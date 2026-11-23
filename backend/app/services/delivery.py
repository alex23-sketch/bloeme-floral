"""Delivery eligibility, fee and capacity service."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.errors import Conflict, NotFound, ValidationFailed
from ..models import BlackoutDate, DeliverySchedule, DeliveryWindow, DeliveryZone, Order


def find_zone(db: Session, postal_code: str) -> DeliveryZone | None:
    normalized = postal_code.strip()
    zones = db.scalars(select(DeliveryZone).where(DeliveryZone.active.is_(True))).all()
    return next((z for z in zones if normalized in z.zip_list), None)


def get_zone(db: Session, zone_id: str) -> DeliveryZone:
    zone = db.get(DeliveryZone, zone_id)
    if not zone or not zone.active:
        raise NotFound("Delivery zone not found")
    return zone


def get_window(db: Session, window_id: str) -> DeliveryWindow:
    window = db.get(DeliveryWindow, window_id)
    if not window or not window.active:
        raise NotFound("Delivery window not found")
    return window


def validate_date(db: Session, service_date: date, zone: DeliveryZone, window: DeliveryWindow) -> None:
    if service_date < date.today():
        raise ValidationFailed("Delivery date must be today or later")
    if db.scalar(select(BlackoutDate).where(BlackoutDate.service_date == service_date)):
        raise Conflict("The atelier is closed on that date")
    schedule = db.scalar(
        select(DeliverySchedule).where(DeliverySchedule.zone_id == zone.id, DeliverySchedule.service_date == service_date)
    )
    if schedule and not schedule.is_open:
        raise Conflict("Delivery is unavailable in this zone on that date")
    # Sundays are closed by the default store policy unless overridden open.
    if service_date.weekday() == 6 and (not schedule or not schedule.is_open):
        raise Conflict("Sunday delivery is unavailable")
    if window.same_day_only:
        now = datetime.now()
        if service_date != date.today():
            raise ValidationFailed("Same-day delivery must be booked for today")
        if now.strftime("%H:%M") > zone.cutoff_time:
            raise Conflict("The same-day cut-off has passed")
        if not zone.same_day_available:
            raise Conflict("Same-day delivery is unavailable in this zone")


def capacity_left(db: Session, zone: DeliveryZone, window: DeliveryWindow, service_date: date) -> int:
    schedule = db.scalar(
        select(DeliverySchedule).where(DeliverySchedule.zone_id == zone.id, DeliverySchedule.service_date == service_date)
    )
    limit = schedule.capacity_override if schedule and schedule.capacity_override is not None else window.capacity
    # Only live orders consume a delivery slot.
    booked_count = db.scalar(
        select(func.count(Order.id)).where(
            Order.delivery_zone_id == zone.id,
            Order.delivery_window_id == window.id,
            Order.delivery_date == service_date,
            Order.status.notin_(["cancelled", "refunded"]),
        )
    ) or 0
    return max(0, limit - booked_count)


def validate_delivery(db: Session, postal_code: str, service_date: date, window_id: str, subtotal_cents: int) -> tuple[DeliveryZone, DeliveryWindow, int]:
    zone = find_zone(db, postal_code)
    if not zone:
        raise ValidationFailed("This ZIP code is outside our delivery zones", {"postal_code": postal_code})
    if subtotal_cents < zone.minimum_order_cents:
        raise ValidationFailed(f"Orders in {zone.name} require a minimum of ${zone.minimum_order_cents / 100:.0f}")
    window = get_window(db, window_id)
    validate_date(db, service_date, zone, window)
    if capacity_left(db, zone, window, service_date) <= 0:
        raise Conflict("That delivery window is full; choose another time")
    base = zone.same_day_fee_cents if window.same_day_only else zone.standard_fee_cents
    if window.slug == "afternoon-window":
        base = zone.express_fee_cents
    return zone, window, base + window.surcharge_cents
