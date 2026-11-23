"""Optional payment integration.

Two modes are supported and both are explicit:

* `stripe` — creates a Stripe Checkout Session over HTTPS (no card data touches
  this server) and reconciles orders only from *verified, signature-checked*
  webhook events. Browser redirects are never trusted to mark an order paid.
* `demo`   — order is recorded as `pending` and `is_demo`. It is never marked
  paid. Useful for Standard/self-hosted evaluation without a provider.

Live Stripe calls are **NOT** exercised in this environment (no network and no
credentials); contract behaviour is covered with fixtures and a fake transport.
"""

from __future__ import annotations

import json

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.errors import Conflict, NotFound, ValidationFailed
from ..models import Order, Payment, PaymentEvent, Refund
from ..models.base import utcnow
from .orders import get_order, set_status


class PaymentUnavailable(RuntimeError):
    pass


def _stripe_headers() -> dict[str, str]:
    if not settings.stripe_secret_key:
        raise PaymentUnavailable("Stripe is not configured")
    return {"Authorization": f"Bearer {settings.stripe_secret_key}"}


def create_checkout_session(db: Session, order: Order, *, success_url: str, cancel_url: str, transport: httpx.BaseTransport | None = None) -> dict:
    if settings.payments_mode != "stripe":
        raise PaymentUnavailable("Card payments are not enabled for this installation")
    data = {
        "mode": "payment",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "client_reference_id": order.id,
        "metadata[order_id]": order.id,
        "metadata[order_number]": order.number,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": settings.stripe_currency,
        "line_items[0][price_data][unit_amount]": str(order.total_cents),
        "line_items[0][price_data][product_data][name]": f"Bloomé Floral order {order.number}",
    }
    with httpx.Client(base_url=settings.stripe_api_base, headers=_stripe_headers(), timeout=20, transport=transport) as client:
        response = client.post("/v1/checkout/sessions", data=data)
    if response.status_code >= 400:
        raise PaymentUnavailable("The payment provider rejected the request")
    body = response.json()
    db.add(Payment(order_id=order.id, provider="stripe", provider_ref=body.get("id"), status="pending", amount_cents=order.total_cents))
    set_status(db, order, "awaiting_payment", actor="system", note="Checkout session created")
    return {"url": body.get("url"), "session_id": body.get("id")}


def handle_event(db: Session, *, event: dict, event_id: str, event_type: str) -> dict:
    """Idempotent webhook processor. Caller must have verified the signature."""
    existing = db.scalar(select(PaymentEvent).where(PaymentEvent.provider == "stripe", PaymentEvent.event_id == event_id))
    if existing:
        return {"status": "duplicate", "order": None}

    db.add(PaymentEvent(provider="stripe", event_id=event_id, event_type=event_type, payload_json=json.dumps(event)))
    try:
        with db.begin_nested():
            db.flush()
    except Exception:
        # Unique constraint enforces idempotency under concurrent delivery.
        return {"status": "duplicate", "order": None}
    result_order: str | None = None

    if event_type in {"checkout.session.completed", "payment_intent.succeeded"}:
        obj = event.get("data", {}).get("object", {})
        order_id = (obj.get("metadata") or {}).get("order_id") or obj.get("client_reference_id")
        if obj.get("payment_status") not in (None, "paid") and event_type == "checkout.session.completed":
            db.flush()
            return {"status": "ignored", "order": None, "reason": "not_paid"}
        if not order_id:
            db.flush()
            return {"status": "ignored", "order": None, "reason": "no_order"}
        order = db.get(Order, order_id)
        if not order:
            raise NotFound("Order referenced by payment event not found")
        if order.payment_status != "paid":
            payment = db.scalar(select(Payment).where(Payment.order_id == order.id, Payment.provider == "stripe").order_by(Payment.created_at.desc()))
            if payment:
                payment.status = "succeeded"
                payment.verified = True
                payment.verified_at = utcnow()
                payment.provider_ref = payment.provider_ref or obj.get("payment_intent") or obj.get("id")
            else:
                db.add(
                    Payment(
                        order_id=order.id,
                        provider="stripe",
                        provider_ref=obj.get("payment_intent") or obj.get("id"),
                        status="succeeded",
                        amount_cents=order.total_cents,
                        verified=True,
                        verified_at=utcnow(),
                    )
                )
            order.payment_status = "paid"
            order.paid_at = utcnow()
            set_status(db, order, "paid", actor="stripe-webhook", note=f"Verified payment event {event_id}")
            result_order = order.id

    elif event_type == "charge.refunded":
        obj = event.get("data", {}).get("object", {})
        order_id = (obj.get("metadata") or {}).get("order_id")
        if order_id and (order := db.get(Order, order_id)):
            order.payment_status = "refunded"
            result_order = order.id

    db.flush()
    return {"status": "processed", "order": result_order}


def record_refund(db: Session, order: Order, amount_cents: int, reason: str, *, actor_id: str) -> Refund:
    if amount_cents <= 0:
        raise ValidationFailed("Refund amount must be positive")
    already = sum(r.amount_cents for r in db.scalars(select(Refund).where(Refund.order_id == order.id, Refund.status == "succeeded")))
    if amount_cents + already > order.total_cents:
        raise Conflict("Refund exceeds the order total")
    refund = Refund(order_id=order.id, amount_cents=amount_cents, reason=reason, status="pending", created_by=actor_id)
    db.add(refund)
    db.flush()
    return refund
