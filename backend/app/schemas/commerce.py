"""Commerce API contracts: quotes, checkout, orders, payments, delivery and discounts."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator

from .common import Cents, ISODate

ORDER_STATUS_CHOICES = ("pending", "awaiting_payment", "paid", "preparing", "out_for_delivery", "delivered", "cancelled", "refunded")


class CheckoutLine(BaseModel):
    variant_id: str
    quantity: int = Field(ge=1, le=12)


class CheckoutCustomer(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=40, pattern=r"^\+?[0-9()\- .]+$")


class CheckoutRecipient(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    line1: str = Field(min_length=4, max_length=200)
    line2: str = Field(default="", max_length=200)
    city: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=2)
    postal_code: str = Field(pattern=r"^\d{5}(-\d{4})?$")

    @field_validator("state")
    @classmethod
    def _upper(cls, v: str) -> str:
        return v.upper()


class CheckoutRequest(BaseModel):
    customer: CheckoutCustomer
    recipient: CheckoutRecipient
    lines: list[CheckoutLine] = Field(min_length=1, max_length=30)
    delivery_date: ISODate
    window_id: str
    gift_message: str = Field(default="", max_length=240)
    hide_prices: bool = False
    discount_code: str | None = Field(default=None, max_length=40)
    # Client-side running subtotal — checked against the server total to catch tampering.
    client_subtotal_cents: Cents | None = None
    consent: bool = True


class QuoteRequest(BaseModel):
    lines: list[CheckoutLine] = Field(min_length=1, max_length=30)
    postal_code: str | None = Field(default=None, pattern=r"^\d{5}(-\d{4})?$")
    delivery_date: ISODate | None = None
    window_id: str | None = None
    discount_code: str | None = Field(default=None, max_length=40)


class QuoteLine(BaseModel):
    variant_id: str
    product_name: str
    variant_label: str
    unit_price_cents: int
    quantity: int
    line_total_cents: int
    available: bool


class QuoteResponse(BaseModel):
    lines: list[QuoteLine]
    subtotal_cents: int
    discount_cents: int
    delivery_cents: int
    tax_cents: int
    total_cents: int
    delivery_zone: dict | None
    delivery_window: dict | None
    issues: list[dict]
    version: str


class OrderItemOut(BaseModel):
    product_name: str
    variant_label: str
    sku: str
    unit_price_cents: int
    quantity: int
    line_total_cents: int
    gift_message: str


class OrderOut(BaseModel):
    id: str
    number: str
    status: str
    payment_status: str
    is_demo: bool
    source: str
    customer_email: str
    customer_name: str
    customer_phone: str | None
    subtotal_cents: int
    discount_cents: int
    delivery_cents: int
    tax_cents: int
    total_cents: int
    discount_code: str | None
    delivery_date: str | None
    window_name: str | None
    recipient_name: str
    postal_code: str
    city: str
    gift_message: str
    admin_notes: str
    items: list[OrderItemOut]
    history: list[dict]
    created_at: str
    paid_at: str | None


class ShipmentStatusUpdate(BaseModel):
    status: str
    note: str = Field(default="", max_length=400)

    @field_validator("status")
    @classmethod
    def _check(cls, v: str) -> str:
        if v not in ORDER_STATUS_CHOICES:
            raise ValueError("Unsupported order status")
        return v


class OrderNotesUpdate(BaseModel):
    admin_notes: str = Field(max_length=2000)


class RefundRequest(BaseModel):
    amount_cents: Cents
    reason: str = Field(min_length=3, max_length=400)


class DiscountIn(BaseModel):
    code: str = Field(min_length=2, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")
    description: str = Field(default="", max_length=200)
    kind: str = Field(pattern=r"^(percent|fixed)$")
    value: int = Field(gt=0)
    min_subtotal_cents: Cents = 0
    max_uses: int | None = Field(default=None, ge=1)
    active: bool = True


class DeliveryZoneIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str | None = Field(default=None, max_length=80)
    region: str = Field(default="", max_length=200)
    postal_codes: list[str] = Field(min_length=1)
    same_day_available: bool = False
    cutoff_time: str = Field(default="14:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    standard_fee_cents: Cents = 1200
    express_fee_cents: Cents = 1800
    same_day_fee_cents: Cents = 2500
    minimum_order_cents: Cents = 0
    standard_lead_hours: int = Field(default=24, ge=1, le=168)
    notes: str = ""
    active: bool = True
    position: int = 0

    @field_validator("postal_codes")
    @classmethod
    def _zips(cls, v: list[str]) -> list[str]:
        import re

        if not all(re.fullmatch(r"\d{5}", z.strip()) for z in v):
            raise ValueError("ZIP codes must be five digits")
        return [z.strip() for z in v]


class DeliveryWindowIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    slug: str | None = Field(default=None, max_length=60)
    description: str = ""
    start_time: str = Field(default="09:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(default="17:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    surcharge_cents: Cents = 0
    same_day_only: bool = False
    capacity: int = Field(default=25, ge=0, le=500)
    active: bool = True
    position: int = 0


class ScheduleIn(BaseModel):
    zone_id: str
    service_date: ISODate
    is_open: bool
    capacity_override: int | None = Field(default=None, ge=0, le=500)


class BlackoutIn(BaseModel):
    service_date: ISODate
    reason: str = Field(default="", max_length=200)
