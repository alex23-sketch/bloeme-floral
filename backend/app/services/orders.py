"""Server-authoritative quotes, transactional checkout and order lifecycle.

Every price, fee, discount and tax line is computed here from database state.
The browser's numbers are only used to detect staleness/tampering, never as a
source of truth.
"""

from __future__ import annotations

import hashlib
import json
import secrets
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..core.config import settings
from ..core.errors import Conflict, NotFound, ValidationFailed
from ..models import (
    Customer,
    CustomerAddress,
    Discount,
    IdempotencyKey,
    Order,
    OrderItem,
    OrderStatusHistory,
    ProductVariant,
)
from ..models.base import iso, utcnow
from ..schemas.commerce import CheckoutRequest, QuoteRequest
from .catalog import adjust_stock
from .delivery import validate_delivery

TRANSITIONS: dict[str, set[str]] = {
    "pending": {"awaiting_payment", "paid", "cancelled"},
    "awaiting_payment": {"paid", "cancelled"},
    "paid": {"preparing", "cancelled", "refunded"},
    "preparing": {"out_for_delivery", "cancelled", "refunded"},
    "out_for_delivery": {"delivered", "cancelled"},
    "delivered": {"refunded"},
    "cancelled": set(),
    "refunded": set(),
}


def _tax_rate_bp(db: Session) -> int:
    from ..models import BusinessSettings

    biz = db.get(BusinessSettings, "business")
    return biz.tax_rate_bp if biz else settings.default_tax_rate_bp


def _resolve_discount(db: Session, code: str | None, subtotal: int) -> tuple[Discount | None, int]:
    if not code:
        return None, 0
    d = db.scalar(select(Discount).where(Discount.code == code.strip().upper(), Discount.active.is_(True)))
    if not d:
        raise ValidationFailed("Discount code is invalid")
    now = utcnow()
    if (d.starts_at and d.starts_at > now) or (d.ends_at and d.ends_at < now):
        raise ValidationFailed("Discount code is not currently active")
    if d.max_uses is not None and d.used_count >= d.max_uses:
        raise Conflict("Discount code has reached its usage limit")
    if subtotal < d.min_subtotal_cents:
        raise ValidationFailed("Order does not meet the minimum subtotal for this code")
    amount = round(subtotal * d.value / 10000) if d.kind == "percent" else d.value
    return d, min(subtotal, amount)


def resolve_lines(db: Session, lines) -> tuple[list[tuple[ProductVariant, int, int]], int]:
    if not lines:
        raise ValidationFailed("At least one product is required")
    resolved: list[tuple[ProductVariant, int, int]] = []
    seen: set[str] = set()
    subtotal = 0
    for line in lines:
        if line.variant_id in seen:
            raise ValidationFailed("Each variant may appear only once per checkout")
        seen.add(line.variant_id)
        stmt = select(ProductVariant).options(selectinload(ProductVariant.product)).where(ProductVariant.id == line.variant_id)
        variant = db.scalar(stmt.with_for_update())
        if not variant or not variant.product or variant.product.status != "active" or variant.product.deleted_at is not None:
            raise NotFound("A selected product is no longer available", {"variant_id": line.variant_id})
        if not variant.in_stock or variant.stock_qty < line.quantity:
            raise Conflict(f"Insufficient stock for {variant.product.name} ({variant.label})", {"variant_id": variant.id})
        total = variant.price_cents * line.quantity
        resolved.append((variant, line.quantity, total))
        subtotal += total
    return resolved, subtotal


def compute_quote(db: Session, payload: QuoteRequest) -> dict:
    variants, subtotal = resolve_lines(db, payload.lines)
    _, discount_cents = _resolve_discount(db, payload.discount_code, subtotal)
    delivery_cents = 0
    zone_json = window_json = None
    if payload.postal_code and payload.delivery_date and payload.window_id:
        zone, window, delivery_cents = validate_delivery(
            db, payload.postal_code, date.fromisoformat(payload.delivery_date), payload.window_id, subtotal - discount_cents
        )
        zone_json = {"id": zone.id, "name": zone.name, "coverage": zone.region, "standard_fee_cents": zone.standard_fee_cents}
        window_json = {"id": window.id, "name": window.name, "window": f"{window.start_time} – {window.end_time}"}
    taxable = max(0, subtotal - discount_cents)
    tax_cents = round(taxable * _tax_rate_bp(db) / 10000)
    return {
        "lines": [
            {
                "variant_id": v.id,
                "product_name": v.product.name,
                "variant_label": v.label,
                "unit_price_cents": v.price_cents,
                "quantity": qty,
                "line_total_cents": total,
                "available": v.in_stock and v.stock_qty >= qty,
            }
            for v, qty, total in variants
        ],
        "subtotal_cents": subtotal,
        "discount_cents": discount_cents,
        "delivery_cents": delivery_cents,
        "tax_cents": tax_cents,
        "total_cents": subtotal - discount_cents + delivery_cents + tax_cents,
        "delivery_zone": zone_json,
        "delivery_window": window_json,
        "issues": [],
        "version": hashlib.sha256(json.dumps([(v.id, v.price_cents, v.stock_qty) for v, _, _ in variants]).encode()).hexdigest()[:16],
    }


def public_quote(db: Session, payload: QuoteRequest) -> dict:
    q = compute_quote(db, payload)
    q.pop("resolved", None)
    return q


def _upsert_customer(db: Session, payload) -> Customer:
    email = str(payload.email).lower().strip()
    customer = db.scalar(select(Customer).where(Customer.email == email))
    if not customer:
        customer = Customer(email=email, first_name=payload.first_name, last_name=payload.last_name, phone=payload.phone)
        db.add(customer)
        db.flush()
    else:
        customer.first_name = payload.first_name
        customer.last_name = payload.last_name
        customer.phone = payload.phone
    return customer


def create_order(db: Session, payload: CheckoutRequest, *, idempotency_key: str | None, is_demo: bool, source: str = "web") -> Order:
    if not payload.consent:
        raise ValidationFailed("Checkout consent is required")
    request_hash = hashlib.sha256(payload.model_dump_json().encode()).hexdigest()

    if idempotency_key:
        existing = db.scalar(select(IdempotencyKey).where(IdempotencyKey.scope == "checkout", IdempotencyKey.key == idempotency_key))
        if existing:
            if existing.request_hash != request_hash:
                raise Conflict("Idempotency key was reused with different checkout data")
            if existing.response_json:
                order = db.get(Order, json.loads(existing.response_json)["order_id"])
                if order:
                    return order
            raise Conflict("This checkout is already being processed")
        db.add(IdempotencyKey(scope="checkout", key=idempotency_key, request_hash=request_hash))
        db.flush()

    variants, subtotal = resolve_lines(db, payload.lines)
    discount_obj, discount_cents = _resolve_discount(db, payload.discount_code, subtotal)
    zone, window, delivery_cents = validate_delivery(
        db, payload.recipient.postal_code, date.fromisoformat(payload.delivery_date), payload.window_id, subtotal - discount_cents
    )
    taxable = max(0, subtotal - discount_cents)
    tax_cents = round(taxable * _tax_rate_bp(db) / 10000)
    total_cents = subtotal - discount_cents + delivery_cents + tax_cents

    if payload.client_subtotal_cents is not None and payload.client_subtotal_cents != subtotal:
        raise Conflict("The cart total no longer matches the catalog; refresh and try again")

    customer = _upsert_customer(db, payload.customer)
    db.add(
        CustomerAddress(
            customer_id=customer.id,
            label="recipient",
            recipient_name=payload.recipient.name,
            line1=payload.recipient.line1,
            line2=payload.recipient.line2,
            city=payload.recipient.city,
            state=payload.recipient.state,
            postal_code=payload.recipient.postal_code,
            country="US",
            is_default=False,
        )
    )
    db.flush()

    order = Order(
        number=f"BLO-{secrets.token_hex(4).upper()}",
        status="pending",
        payment_status="unpaid",
        is_demo=is_demo,
        source=source,
        customer_id=customer.id,
        customer_email=customer.email,
        customer_name=f"{customer.first_name} {customer.last_name}",
        customer_phone=customer.phone,
        subtotal_cents=subtotal,
        discount_cents=discount_cents,
        delivery_cents=delivery_cents,
        tax_cents=tax_cents,
        total_cents=total_cents,
        discount_code=discount_obj.code if discount_obj else None,
        delivery_zone_id=zone.id,
        delivery_window_id=window.id,
        delivery_date=date.fromisoformat(payload.delivery_date),
        recipient_name=payload.recipient.name,
        address_line1=payload.recipient.line1,
        address_line2=payload.recipient.line2,
        city=payload.recipient.city,
        state=payload.recipient.state,
        postal_code=payload.recipient.postal_code,
        gift_message=payload.gift_message,
        hide_prices=payload.hide_prices,
        idempotency_key=idempotency_key,
    )
    db.add(order)
    db.flush()

    for variant, qty, line_total in variants:
        adjust_stock(db, variant, -qty, reason="order", note="Checkout", reference=order.number)
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=variant.product_id,
                variant_id=variant.id,
                product_name=variant.product.name,
                variant_label=variant.label,
                sku=variant.sku,
                unit_price_cents=variant.price_cents,
                quantity=qty,
                line_total_cents=line_total,
                gift_message=payload.gift_message,
            )
        )
    db.add(OrderStatusHistory(order_id=order.id, from_status=None, to_status="pending", note="Order placed", actor_email="customer"))
    if discount_obj:
        discount_obj.used_count += 1
    if idempotency_key:
        idem = db.scalar(select(IdempotencyKey).where(IdempotencyKey.scope == "checkout", IdempotencyKey.key == idempotency_key))
        idem.response_json = json.dumps({"order_id": order.id})
    db.flush()
    return order


def get_order(db: Session, ident: str) -> Order:
    stmt = (
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.history), selectinload(Order.payments))
        .where((Order.id == ident) | (Order.number == ident))
    )
    order = db.scalar(stmt)
    if not order:
        raise NotFound("Order not found")
    return order


def set_status(db: Session, order: Order, status: str, *, actor: str, note: str = "") -> Order:
    if status not in TRANSITIONS:
        raise ValidationFailed("Unknown order status")
    if status == order.status:
        return order
    if status not in TRANSITIONS[order.status]:
        raise Conflict(f"Cannot move an order from {order.status} to {status}", {"from": order.status, "to": status})
    if status == "paid" and order.payment_status != "paid":
        raise Conflict("An order can only be marked paid by a verified payment")
    previous = order.status
    if status in {"cancelled", "refunded"} and not order.stock_released:
        for item in order.items:
            variant = db.get(ProductVariant, item.variant_id) if item.variant_id else None
            if variant:
                adjust_stock(db, variant, item.quantity, reason="cancellation", note=f"Order {order.number} {status}", reference=order.number)
        order.stock_released = True
        if status == "cancelled":
            order.cancelled_at = utcnow()
    order.status = status
    if status == "delivered":
        order.delivered_at = utcnow()
    if status == "refunded":
        order.payment_status = "refunded"
    db.add(OrderStatusHistory(order_id=order.id, from_status=previous, to_status=status, note=note, actor_email=actor))
    db.flush()
    return order


def order_payload(order: Order) -> dict:
    window = db_window_name(order)
    return {
        "id": order.id,
        "number": order.number,
        "status": order.status,
        "payment_status": order.payment_status,
        "is_demo": order.is_demo,
        "source": order.source,
        "customer_email": order.customer_email,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "subtotal_cents": order.subtotal_cents,
        "discount_cents": order.discount_cents,
        "delivery_cents": order.delivery_cents,
        "tax_cents": order.tax_cents,
        "total_cents": order.total_cents,
        "discount_code": order.discount_code,
        "delivery_date": order.delivery_date.isoformat() if order.delivery_date else None,
        "window_name": window,
        "recipient_name": order.recipient_name,
        "postal_code": order.postal_code,
        "city": order.city,
        "gift_message": order.gift_message,
        "admin_notes": order.admin_notes,
        "items": [
            {
                "product_name": i.product_name,
                "variant_label": i.variant_label,
                "sku": i.sku,
                "unit_price_cents": i.unit_price_cents,
                "quantity": i.quantity,
                "line_total_cents": i.line_total_cents,
                "gift_message": i.gift_message,
            }
            for i in sorted(order.items, key=lambda x: x.id)
        ],
        "history": [{"status": h.to_status, "from": h.from_status, "note": h.note, "actor": h.actor_email, "at": iso(h.created_at)} for h in order.history],
        "created_at": iso(order.created_at),
        "paid_at": iso(order.paid_at),
    }


def db_window_name(order: Order) -> str | None:
    from ..models import DeliveryWindow

    if not order.delivery_window_id:
        return None
    w = order.__dict__.get("_window_cache") if False else None  # noqa: F841
    return getattr(order, "_window_name", None)


def attach_window_names(db: Session, orders: list[Order]) -> None:
    from ..models import DeliveryWindow

    ids = {o.delivery_window_id for o in orders if o.delivery_window_id}
    if not ids:
        return
    names = {w.id: w.name for w in db.scalars(select(DeliveryWindow).where(DeliveryWindow.id.in_(ids)))}
    for o in orders:
        o._window_name = names.get(o.delivery_window_id)  # type: ignore[attr-defined]
