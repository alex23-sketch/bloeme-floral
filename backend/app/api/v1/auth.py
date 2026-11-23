"""Owner bootstrap and cookie-session authentication."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.db import get_db
from ...core.deps import client_ip, current_session, optional_admin
from ...core.errors import Conflict, TooManyRequests, ValidationFailed
from ...core.ratelimit import limiter
from ...core.security import new_csrf_token
from ...models import AdminSession, AdminUser
from ...models.base import iso
from ...schemas.common import OkResponse
from ...services import auth

router = APIRouter(prefix="/auth", tags=["auth"])


class OwnerSetup(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=12, max_length=256)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=12, max_length=256)


def _cookie(response: Response, token: str, *, max_age: int | None = None) -> None:
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=max_age or settings.session_ttl_hours * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


def _csrf_cookie(response: Response, token: str) -> None:
    response.set_cookie(settings.csrf_cookie_name, token, max_age=settings.session_ttl_hours * 3600, httponly=False, secure=settings.cookie_secure, samesite=settings.cookie_samesite, path="/")


@router.get("/status")
def status_(request: Request, db: Session = Depends(get_db)):
    user = optional_admin(request, db)
    return {"setup_required": not auth.owner_exists(db), "authenticated": user is not None, "user": auth.user_payload(user) if user else None}


@router.post("/setup", status_code=status.HTTP_201_CREATED)
def setup(payload: OwnerSetup, response: Response, request: Request, db: Session = Depends(get_db)):
    ok, _ = limiter.hit(f"setup:{client_ip(request)}", 5, 3600)
    if not ok:
        raise TooManyRequests("Too many setup attempts")
    user = auth.setup_owner(db, email=str(payload.email), name=payload.name, password=payload.password, ip=client_ip(request))
    session, raw = auth.start_session(db, user, ip=client_ip(request), user_agent=request.headers.get("user-agent", ""))
    db.commit()
    _cookie(response, raw)
    _csrf_cookie(response, session.csrf_token)
    result = {"user": auth.user_payload(user), "csrf_token": session.csrf_token, "expires_at": iso(session.expires_at)}
    if request.headers.get("x-client-platform", "").lower() == "mobile":
        result["session_token"] = raw
    return result


@router.post("/login")
def login(payload: LoginIn, response: Response, request: Request, db: Session = Depends(get_db)):
    ok, retry = limiter.hit(f"login:{client_ip(request)}", settings.login_max_attempts, settings.login_window_minutes * 60)
    if not ok:
        raise TooManyRequests("Too many login attempts")
    user = auth.authenticate(db, email=str(payload.email), password=payload.password, ip=client_ip(request))
    session, raw = auth.start_session(db, user, ip=client_ip(request), user_agent=request.headers.get("user-agent", ""))
    db.commit()
    _cookie(response, raw)
    _csrf_cookie(response, session.csrf_token)
    result = {"user": auth.user_payload(user), "csrf_token": session.csrf_token, "expires_at": iso(session.expires_at)}
    if request.headers.get("x-client-platform", "").lower() == "mobile":
        result["session_token"] = raw
    return result


@router.post("/logout", response_model=OkResponse)
def logout(response: Response, session: AdminSession = Depends(current_session), db: Session = Depends(get_db)):
    auth.revoke(db, session)
    db.commit()
    response.delete_cookie(settings.session_cookie_name, path="/")
    response.delete_cookie(settings.csrf_cookie_name, path="/")
    return {"ok": True, "message": "Signed out"}


@router.get("/me")
def me(session: AdminSession = Depends(current_session)):
    return {"user": auth.user_payload(session.user), "csrf_token": session.csrf_token, "expires_at": iso(session.expires_at)}


@router.post("/password")
def password(payload: PasswordChange, request: Request, session: AdminSession = Depends(current_session), db: Session = Depends(get_db)):
    # caller route is mounted after csrf middleware, but explicit guard is safer
    from ...core.security import require_csrf

    require_csrf(request)
    count = auth.change_password(db, session.user, current=payload.current_password, new=payload.new_password, keep_session=session, ip=client_ip(request))
    db.commit()
    return {"ok": True, "revoked_sessions": count}
