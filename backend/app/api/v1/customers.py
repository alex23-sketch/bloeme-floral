"""Customer account APIs consumed by the mobile application and shared backend."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import client_ip
from ...core.errors import NotFound, TooManyRequests
from ...core.ratelimit import limiter
from ...schemas.customer import CustomerLogin, CustomerOut, CustomerRegister, RecoveryRequest
from ...schemas.commerce import CheckoutRequest
from ...services import customers as svc
from ...services import orders
from ...services.email import send_transactional

router = APIRouter(prefix="/customers", tags=["customers"])


def _customer_dep(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        from ...core.errors import Unauthorized

        raise Unauthorized("Authentication required")
    customer = svc.get_customer_by_token(db, authorization[7:].strip())
    if not customer:
        from ...core.errors import Unauthorized

        raise Unauthorized("Session expired")
    return customer


@router.post("/register", response_model=CustomerOut)
def register(payload: CustomerRegister, db: Session = Depends(get_db)):
    customer = svc.register(db, email=str(payload.email), first_name=payload.first_name, last_name=payload.last_name, password=payload.password)
    session, raw = svc._start_customer_session(db, customer)
    db.commit()
    return {**svc.profile(customer), "token": raw}


@router.post("/login")
def login(payload: CustomerLogin, db: Session = Depends(get_db)):
    customer = svc.authenticate_customer(db, email=str(payload.email), password=payload.password)
    session, raw = svc._start_customer_session(db, customer)
    db.commit()
    return {**svc.profile(customer), "token": raw}


@router.post("/recovery")
def recovery(payload: RecoveryRequest, request: Request, db: Session = Depends(get_db)):
    ok, _ = limiter.hit(f"recovery:{client_ip(request)}", 4, 60)
    if not ok:
        raise TooManyRequests("Too many recovery requests")
    customer = db.execute(__import__("sqlalchemy", fromlist=["select"]).select(__import__("app.models", fromlist=["Customer"]).Customer).where(__import__("app.models", fromlist=["Customer"]).Customer.email == str(payload.email).lower())).scalar_one_or_none()
    if customer:
        send_transactional(db, key="recovery", to=customer.email, context={"name": customer.first_name})
    db.commit()
    return {"ok": True, "message": "If that account exists, a recovery email has been queued."}


@router.get("/me", response_model=CustomerOut)
def me(customer=Depends(_customer_dep)):
    return svc.profile(customer)


@router.post("/logout")
def logout(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if authorization and authorization.lower().startswith("bearer "):
        svc.revoke_customer_session(db, authorization[7:].strip())
    db.commit()
    return {"ok": True}


@router.get("/orders")
def my_orders(customer=Depends(_customer_dep), db: Session = Depends(get_db)):
    from sqlalchemy import select

    from ...models import Order

    rows = db.scalars(select(Order).where(Order.customer_id == customer.id).order_by(Order.created_at.desc()).limit(50)).all()
    orders.attach_window_names(db, rows)
    return [orders.order_payload(o) for o in rows]


@router.post("/checkout")
def customer_checkout(payload: CheckoutRequest, authorization: str | None = Header(default=None), db: Session = Depends(get_db), idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    from ...core.config import settings

    customer = _customer_dep(authorization, db) if False else None
    # Guest checkout remains supported; identify the customer when a session is present.
    customer = svc.get_customer_by_token(db, (authorization or "").removeprefix("Bearer ").strip()) if authorization and authorization.lower().startswith("bearer ") else None
    is_demo = settings.payments_mode == "demo"
    order = orders.create_order(db, payload, idempotency_key=idempotency_key, is_demo=is_demo)
    if customer:
        order.customer_id = customer.id
        order.customer_email = customer.email
        order.customer_name = f"{customer.first_name} {customer.last_name}"
        order.customer_phone = customer.phone
    send_transactional(db, key="order_received", to=order.customer_email, context={"customer_name": order.customer_name, "order_number": order.number, "total": f"${order.total_cents / 100:.2f}"}, order=order)
    db.commit()
    orders.attach_window_names(db, [order])
    return orders.order_payload(order)