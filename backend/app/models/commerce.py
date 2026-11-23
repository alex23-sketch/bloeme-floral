"""Customers, carts, orders, payments, refunds, discounts and notifications."""

from __future__ import annotations

from typing import Optional

from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import IdMixin, TimestampMixin, UTCDateTime, utcnow
from .db_base import Base

ORDER_STATUSES = ("pending", "awaiting_payment", "paid", "preparing", "out_for_delivery", "delivered", "cancelled", "refunded")


class Customer(Base, IdMixin, TimestampMixin):
    __tablename__ = "customers"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40))
    marketing_opt_in: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)

    addresses: Mapped[list["CustomerAddress"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="customer")


class CustomerAddress(Base, IdMixin, TimestampMixin):
    __tablename__ = "customer_addresses"

    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(20), default="home", nullable=False)
    recipient_name: Mapped[str] = mapped_column(String(160), nullable=False)
    line1: Mapped[str] = mapped_column(String(200), nullable=False)
    line2: Mapped[str | None] = mapped_column(String(200))
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    country: Mapped[str] = mapped_column(String(2), default="US", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    customer: Mapped["Customer"] = relationship(back_populates="addresses")


class Discount(Base, IdMixin, TimestampMixin):
    __tablename__ = "discounts"

    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # percent | fixed
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # basis points for percent, cents for fixed
    min_subtotal_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_uses: Mapped[int | None] = mapped_column(Integer)
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    starts_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    ends_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        CheckConstraint("kind IN ('percent','fixed')", name="ck_discount_kind"),
        CheckConstraint("value > 0", name="ck_discount_value"),
        CheckConstraint("used_count >= 0", name="ck_discount_used"),
    )


class IdempotencyKey(Base, IdMixin):
    __tablename__ = "idempotency_keys"

    scope: Mapped[str] = mapped_column(String(40), nullable=False)
    key: Mapped[str] = mapped_column(String(80), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("scope", "key", name="uq_idem_scope_key"),)


class Order(Base, IdMixin, TimestampMixin):
    __tablename__ = "orders"

    number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(24), default="pending", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(24), default="unpaid", nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    source: Mapped[str] = mapped_column(String(16), default="web", nullable=False)  # web | mobile | admin
    customer_id: Mapped[str | None] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"), index=True)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(160), nullable=False)
    customer_phone: Mapped[str | None] = mapped_column(String(40))

    subtotal_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    delivery_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tax_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)

    discount_code: Mapped[str | None] = mapped_column(String(40))
    delivery_zone_id: Mapped[str | None] = mapped_column(ForeignKey("delivery_zones.id", ondelete="SET NULL"))
    delivery_window_id: Mapped[str | None] = mapped_column(ForeignKey("delivery_windows.id", ondelete="SET NULL"))
    delivery_date: Mapped[date | None] = mapped_column(Date)
    recipient_name: Mapped[str] = mapped_column(String(160), default="", nullable=False)
    address_line1: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    address_line2: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    city: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    state: Mapped[str] = mapped_column(String(2), default="", nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), default="", nullable=False)
    gift_message: Mapped[str] = mapped_column(Text, default="", nullable=False)
    hide_prices: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    admin_notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(80), unique=True)
    paid_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    delivered_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    cancelled_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    stock_released: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    customer: Mapped[Optional["Customer"]] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderStatusHistory.created_at"
    )
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','awaiting_payment','paid','preparing','out_for_delivery','delivered','cancelled','refunded')",
            name="ck_order_status",
        ),
        CheckConstraint("total_cents >= 0 AND subtotal_cents >= 0 AND delivery_cents >= 0 AND tax_cents >= 0", name="ck_order_totals"),
        Index("ix_orders_status_created", "status", "created_at"),
        Index("ix_orders_delivery_date", "delivery_date"),
    )


class OrderItem(Base, IdMixin):
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    variant_id: Mapped[str | None] = mapped_column(ForeignKey("product_variants.id", ondelete="SET NULL"))
    product_name: Mapped[str] = mapped_column(String(160), nullable=False)
    variant_label: Mapped[str] = mapped_column(String(40), nullable=False)
    sku: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    gift_message: Mapped[str] = mapped_column(Text, default="", nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")

    __table_args__ = (CheckConstraint("quantity > 0", name="ck_order_item_qty"),)


class OrderStatusHistory(Base, IdMixin):
    __tablename__ = "order_status_history"

    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status: Mapped[str | None] = mapped_column(String(24))
    to_status: Mapped[str] = mapped_column(String(24), nullable=False)
    note: Mapped[str] = mapped_column(String(400), default="", nullable=False)
    actor_email: Mapped[str] = mapped_column(String(255), default="system", nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="history")


class Payment(Base, IdMixin):
    __tablename__ = "payments"

    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(20), default="none", nullable=False)  # none | demo | stripe
    provider_ref: Mapped[str | None] = mapped_column(String(255), unique=True)
    status: Mapped[str] = mapped_column(String(24), default="pending", nullable=False)  # pending | succeeded | failed | refunded
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(UTCDateTime())

    order: Mapped["Order"] = relationship(back_populates="payments")


class PaymentEvent(Base, IdMixin):
    """Idempotent ledger of provider webhook events."""

    __tablename__ = "payment_events"

    provider: Mapped[str] = mapped_column(String(20), nullable=False)
    event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    processed_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("provider", "event_id", name="uq_payment_event"),)


class Refund(Base, IdMixin):
    __tablename__ = "refunds"

    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_id: Mapped[str | None] = mapped_column(ForeignKey("payments.id", ondelete="SET NULL"))
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(400), default="", nullable=False)
    provider_refund_ref: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(24), default="pending", nullable=False)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)

    __table_args__ = (CheckConstraint("amount_cents > 0", name="ck_refund_amount"),)


class EmailTemplate(Base, IdMixin, TimestampMixin):
    __tablename__ = "email_templates"

    key: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class EmailLog(Base, IdMixin):
    __tablename__ = "email_logs"

    template_key: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"))
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="queued", nullable=False)  # queued | sent | failed | skipped
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(UTCDateTime())


class CustomerSession(Base, IdMixin):
    __tablename__ = "customer_sessions"

    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)
