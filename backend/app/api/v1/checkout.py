"""Public checkout. Server calculates every total; browser numbers are advisory."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Request, Response, status
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.db import get_db
from ...core.errors import TooManyRequests
from ...core.ratelimit import limiter
from ...schemas.common import OkResponse
from ...schemas.commerce import CheckoutRequest
from ...services import orders
from ...services.email import send_transactional

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: CheckoutRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key", max_length=80),
):
    from ...core.deps import client_ip

    ip = client_ip(request)
    ok, _ = limiter.hit(f"checkout:{ip}", 20, 60)
    if not ok:
        raise TooManyRequests("Too many checkout attempts; please wait a moment")
    if settings.payments_mode == "stripe":
        raise __import__("app.core.errors", fromlist=["Conflict"]).Conflict(
            "Card checkout uses the payment session endpoint for this installation"
        )
    is_demo = settings.payments_mode == "demo"
    order = orders.create_order(db, payload, idempotency_key=idempotency_key, is_demo=is_demo)
    send_transactional(
        db,
        key="order_received",
        to=order.customer_email,
        context={"customer_name": order.customer_name, "order_number": order.number, "total": f"${order.total_cents / 100:.2f}", "delivery_date": order.delivery_date.isoformat() if order.delivery_date else ""},
        order=order,
    )
    db.commit()
    orders.attach_window_names(db, [order])
    response.headers["X-Demo-Mode"] = "true" if is_demo else "false"
    return orders.order_payload(order)


@router.post("/{order_id}/pay", response_model=OkResponse)
def stripe_session(order_id: str, db: Session = Depends(get_db)) -> dict:  # pragma: no cover - requires live Stripe
    from ...services.payments import PaymentUnavailable, create_checkout_session

    order = orders.get_order(db, order_id)
    try:
        session = create_checkout_session(
            db,
            order,
            success_url=f"{settings.public_site_url}/order/{order.number}",
            cancel_url=f"{settings.public_site_url}/checkout",
        )
    except PaymentUnavailable as exc:
        from ...core.errors import ValidationFailed

        raise ValidationFailed(str(exc)) from exc
    db.commit()
    return {"ok": True, "message": session.get("url") or ""}


@router.get("/orders/{number}")
def public_order(number: str, email: str, db: Session = Depends(get_db)):
    from sqlalchemy import select

    from ...models import Order

    order = db.scalar(select(Order).where(Order.number == number.upper(), Order.customer_email == email.lower()))
    if not order:
        from ...core.errors import NotFound

        raise NotFound("Order not found")
    orders.attach_window_names(db, [order])
    return orders.order_payload(order)
