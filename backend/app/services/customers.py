"""Customer registration, login, session, profile and order-context service."""

from __future__ import annotations

import hashlib
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.errors import Conflict, NotFound, Unauthorized, ValidationFailed
from ..core.security import hash_password, new_token, verify_password
from ..models import Customer, CustomerSession
from ..models.base import utcnow


def customer_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _start_customer_session(db: Session, customer: Customer) -> tuple[CustomerSession, str]:
    raw = new_token(32)
    session = CustomerSession(
        customer_id=customer.id,
        token_hash=customer_token_hash(raw),
        expires_at=utcnow() + timedelta(hours=settings.session_ttl_hours),
    )
    db.add(session)
    db.flush()
    return session, raw


def register(db: Session, *, email: str, first_name: str, last_name: str, password: str):
    email = email.lower().strip()
    if db.scalar(select(Customer).where(Customer.email == email)):
        raise Conflict("An account with that email already exists")
    customer = Customer(
        email=email,
        first_name=first_name,
        last_name=last_name,
        password_hash=hash_password(password),
        marketing_opt_in=True,
    )
    db.add(customer)
    db.flush()
    return customer


def authenticate_customer(db: Session, *, email: str, password: str):
    email = email.lower().strip()
    customer = db.scalar(select(Customer).where(Customer.email == email))
    if not customer or not customer.password_hash or not verify_password(password, customer.password_hash):
        raise Unauthorized("Invalid email or password")
    return customer


def get_customer_by_token(db: Session, token: str) -> Customer | None:
    session = db.scalar(select(CustomerSession).where(CustomerSession.token_hash == customer_token_hash(token)))
    if not session or session.revoked_at is not None:
        return None
    if session.expires_at <= utcnow():
        session.revoked_at = utcnow()
        return None
    return db.get(Customer, session.customer_id)


def revoke_customer_session(db: Session, token: str) -> None:
    session = db.scalar(select(CustomerSession).where(CustomerSession.token_hash == customer_token_hash(token)))
    if session:
        session.revoked_at = utcnow()


def profile(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "email": customer.email,
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "phone": customer.phone,
        "marketing_opt_in": customer.marketing_opt_in,
    }