"""Cookie sessions, CSRF, password hashing and request hardening.

Password hashing prefers Argon2id when the optional `argon2-cffi` package is
installed. The built-in fallback is scrypt, a memory-hard KDF, and is useful
for offline development; production installations should install argon2-cffi.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request, status

from .config import settings

try:  # Optional production dependency.
    from argon2 import PasswordHasher  # type: ignore
    from argon2.exceptions import InvalidHashError, VerificationError  # type: ignore

    _argon = PasswordHasher()
except ImportError:  # pragma: no cover - depends on installation extras
    _argon = None


@dataclass(frozen=True)
class Principal:
    id: str
    email: str
    role: str
    name: str


def hash_password(password: str) -> str:
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters")
    if _argon:
        return _argon.hash(password)
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=8192, r=8, p=1, maxmem=64 * 1024 * 1024)
    return "scrypt$8192$8$1$" + base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()


def verify_password(password: str, encoded: str) -> bool:
    if encoded.startswith("$argon2") and _argon:
        try:
            return bool(_argon.verify(encoded, password))
        except (InvalidHashError, VerificationError):
            return False
    try:
        prefix, n, r, p, salt_b64, digest_b64 = encoded.split("$", 5)
        if prefix != "scrypt":
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        actual = hashlib.scrypt(password.encode(), salt=salt, n=int(n), r=int(r), p=int(p), maxmem=64 * 1024 * 1024)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def new_token(bytes_: int = 32) -> str:
    return secrets.token_urlsafe(bytes_)


def new_csrf_token() -> str:
    return new_token(24)


def csrf_matches(request: Request) -> bool:
    if request.method.upper() in {"GET", "HEAD", "OPTIONS"}:
        return True
    cookie = request.cookies.get(settings.csrf_cookie_name)
    header = request.headers.get("x-csrf-token")
    return bool(cookie and header and hmac.compare_digest(cookie, header))


def require_csrf(request: Request) -> None:
    if not csrf_matches(request):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")


def session_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(hours=settings.session_ttl_hours)


def constant_time(value: str, expected: str) -> bool:
    return hmac.compare_digest(value.encode(), expected.encode())


def verify_webhook_signature(payload: bytes, signature: str, secret: str, tolerance: int = 300) -> bool:
    """Stripe-compatible timestamped HMAC envelope verifier for test fixtures.

    Stripe's official SDK can be substituted in an installation that includes
    it; this verifier never trusts a browser redirect and rejects stale events.
    """
    try:
        parts = dict(piece.split("=", 1) for piece in signature.split(","))
        timestamp = int(parts["t"])
        provided = parts["v1"]
    except (KeyError, ValueError):
        return False
    if abs(time.time() - timestamp) > tolerance:
        return False
    signed = f"{timestamp}.".encode() + payload
    expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(provided, expected)
