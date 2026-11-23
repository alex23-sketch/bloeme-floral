"""FastAPI dependencies: sessions, role permissions, CSRF and client identity."""

from __future__ import annotations

import hashlib
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import AdminSession, AdminUser
from ..models.base import utcnow
from .config import settings
from .db import get_db
from .security import Principal, require_csrf

ROLE_RANK = {"staff": 1, "admin": 2, "owner": 3}


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    return (request.client.host if request.client else "unknown")[:64]


def _resolve_session(request: Request, db: Session) -> AdminSession | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
    if not token:
        return None
    session = db.scalar(select(AdminSession).where(AdminSession.token_hash == hash_token(token)))
    if not session or session.revoked_at is not None:
        return None
    if session.expires_at <= utcnow():
        return None
    if not session.user.active:
        return None
    return session


def optional_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser | None:
    session = _resolve_session(request, db)
    return session.user if session else None


def current_session(request: Request, db: Session = Depends(get_db)) -> AdminSession:
    session = _resolve_session(request, db)
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return session


def current_admin(session: AdminSession = Depends(current_session)) -> AdminUser:
    return session.user


def require_role(minimum: str) -> Callable[..., AdminUser]:
    """Dependency factory enforcing a minimum role rank (staff < admin < owner)."""

    def _dep(admin: AdminUser = Depends(current_admin)) -> AdminUser:
        if ROLE_RANK.get(admin.role, 0) < ROLE_RANK[minimum]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return admin

    return _dep


def owner_only(admin: AdminUser = Depends(require_role("owner"))) -> AdminUser:
    return admin


def csrf_guard(request: Request) -> None:
    require_csrf(request)


def principal(admin: AdminUser) -> Principal:
    return Principal(id=admin.id, email=admin.email, role=admin.role, name=admin.name)


AdminDep = Depends(current_admin)
