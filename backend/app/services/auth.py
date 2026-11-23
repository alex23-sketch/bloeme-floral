"""Authentication, first-run setup, sessions and audit."""

from __future__ import annotations

import json

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.errors import Conflict, Forbidden, Unauthorized, ValidationFailed
from ..core.security import hash_password, new_csrf_token, new_token, session_expiry, verify_password
from ..models import AdminSession, AdminUser, AuditEvent, LoginAttempt
from ..models.base import utcnow
from .audit import record


def owner_exists(db: Session) -> bool:
    return bool(db.scalar(select(func.count(AdminUser.id))))


def setup_owner(db: Session, *, email: str, name: str, password: str, ip: str) -> AdminUser:
    """First-run bootstrap. Refuses if any admin account already exists."""
    if owner_exists(db):
        raise Conflict("Setup has already been completed")
    if len(password) < 12:
        raise ValidationFailed("Password must be at least 12 characters")
    user = AdminUser(email=email.lower().strip(), name=name.strip(), password_hash=hash_password(password), role="owner")
    db.add(user)
    db.flush()
    record(db, actor=user, action="setup.owner_created", resource_type="admin_user", resource_id=user.id, summary="Initial owner account created", ip=ip)
    return user


def _recent_failures(db: Session, email: str) -> int:
    from datetime import timedelta

    since = utcnow() - timedelta(minutes=settings.login_window_minutes)
    return db.scalar(
        select(func.count(LoginAttempt.id)).where(
            LoginAttempt.email == email, LoginAttempt.succeeded.is_(False), LoginAttempt.created_at >= since
        )
    ) or 0


def authenticate(db: Session, *, email: str, password: str, ip: str) -> AdminUser:
    email = email.lower().strip()
    if _recent_failures(db, email) >= settings.login_max_attempts:
        raise Forbidden("Too many failed attempts. Try again later.")
    user = db.scalar(select(AdminUser).where(AdminUser.email == email))
    if not user or not user.active or not verify_password(password, user.password_hash):
        db.add(LoginAttempt(email=email, ip_address=ip, succeeded=False, created_at=utcnow()))
        record(db, actor=None, action="auth.login_failed", resource_type="admin_user", resource_id=user.id if user else None, summary="Login failed", ip=ip)
        raise Unauthorized("Invalid email or password")
    db.add(LoginAttempt(email=email, ip_address=ip, succeeded=True, created_at=utcnow()))
    user.last_login_at = utcnow()
    user.failed_attempts = 0
    record(db, actor=user, action="auth.login", resource_type="admin_user", resource_id=user.id, summary="Signed in", ip=ip)
    return user


def start_session(db: Session, user: AdminUser, *, ip: str, user_agent: str) -> tuple[AdminSession, str]:
    raw = new_token(32)
    from ..core.deps import hash_token

    session = AdminSession(
        user_id=user.id,
        token_hash=hash_token(raw),
        csrf_token=new_csrf_token(),
        expires_at=session_expiry(),
        created_at=utcnow(),
        user_agent=user_agent[:300],
        ip_address=ip,
    )
    db.add(session)
    db.flush()
    return session, raw


def revoke(db: Session, session: AdminSession) -> None:
    session.revoked_at = utcnow()


def revoke_all(db: Session, user: AdminUser, *, except_session: AdminSession | None = None) -> int:
    count = 0
    for s in db.scalars(select(AdminSession).where(AdminSession.user_id == user.id, AdminSession.revoked_at.is_(None))):
        if except_session and s.id == except_session.id:
            continue
        s.revoked_at = utcnow()
        count += 1
    return count


def change_password(db: Session, user: AdminUser, *, current: str, new: str, keep_session: AdminSession | None = None, ip: str = "") -> int:
    if not verify_password(current, user.password_hash):
        raise Unauthorized("Current password is incorrect")
    if len(new) < 12:
        raise ValidationFailed("Password must be at least 12 characters")
    user.password_hash = hash_password(new)
    user.must_change_password = False
    revoked = revoke_all(db, user, except_session=keep_session)
    record(db, actor=user, action="auth.password_changed", resource_type="admin_user", resource_id=user.id, summary="Password changed; other sessions revoked", ip=ip)
    return revoked


def list_users(db: Session) -> list[AdminUser]:
    return list(db.scalars(select(AdminUser).order_by(AdminUser.created_at)))


def create_user(db: Session, *, actor: AdminUser, email: str, name: str, password: str, role: str, ip: str) -> AdminUser:
    if role not in {"owner", "admin", "staff"}:
        raise ValidationFailed("Unknown role")
    if role == "owner" and actor.role != "owner":
        raise Forbidden("Only owners can create owners")
    if db.scalar(select(AdminUser).where(AdminUser.email == email.lower().strip())):
        raise Conflict("A user with that email already exists")
    user = AdminUser(email=email.lower().strip(), name=name.strip(), password_hash=hash_password(password), role=role, must_change_password=True)
    db.add(user)
    db.flush()
    record(db, actor=actor, action="admin.user_created", resource_type="admin_user", resource_id=user.id, summary=f"Created {role}", ip=ip)
    return user


def update_user(db: Session, *, actor: AdminUser, user: AdminUser, role: str | None, active: bool | None, ip: str) -> AdminUser:
    if user.id == actor.id and role and role != actor.role:
        raise Forbidden("You cannot change your own role")
    if role == "owner" and actor.role != "owner":
        raise Forbidden("Only owners can grant owner role")
    if role:
        user.role = role
    if active is not None:
        if user.id == actor.id and not active:
            raise Forbidden("You cannot deactivate your own account")
        user.active = active
        if not active:
            revoke_all(db, user)
    record(db, actor=actor, action="admin.user_updated", resource_type="admin_user", resource_id=user.id, summary=f"role={user.role} active={user.active}", ip=ip)
    return user


def user_payload(u: AdminUser) -> dict:
    return {"id": u.id, "email": u.email, "name": u.name, "role": u.role, "active": u.active, "must_change_password": u.must_change_password}


def audit_json(detail: dict | None) -> str:
    return json.dumps(detail or {}, default=str)[:8000]
