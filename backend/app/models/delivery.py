"""Delivery zones, windows, capacity, schedules and blackout dates."""

from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import IdMixin, TimestampMixin
from .db_base import Base


class DeliveryZone(Base, IdMixin, TimestampMixin):
    __tablename__ = "delivery_zones"

    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    region: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    postal_codes: Mapped[str] = mapped_column(Text, default="", nullable=False)  # comma-separated 5-digit ZIPs
    same_day_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    cutoff_time: Mapped[str] = mapped_column(String(5), default="14:00", nullable=False)
    standard_fee_cents: Mapped[int] = mapped_column(Integer, default=1200, nullable=False)
    express_fee_cents: Mapped[int] = mapped_column(Integer, default=1800, nullable=False)
    same_day_fee_cents: Mapped[int] = mapped_column(Integer, default=2500, nullable=False)
    minimum_order_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    standard_lead_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        CheckConstraint("standard_fee_cents >= 0 AND express_fee_cents >= 0 AND same_day_fee_cents >= 0", name="ck_zone_fees"),
        CheckConstraint("minimum_order_cents >= 0", name="ck_zone_min_order"),
        Index("ix_zones_active", "active", "position"),
    )

    @property
    def zip_list(self) -> list[str]:
        return [z.strip() for z in self.postal_codes.split(",") if z.strip()]


class DeliveryWindow(Base, IdMixin, TimestampMixin):
    __tablename__ = "delivery_windows"

    slug: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), default="09:00", nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), default="17:00", nullable=False)
    surcharge_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    same_day_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (CheckConstraint("capacity >= 0", name="ck_window_capacity"),)


class DeliverySchedule(Base, IdMixin, TimestampMixin):
    """Per-date availability override for a zone (closed days, reduced capacity)."""

    __tablename__ = "delivery_schedules"

    zone_id: Mapped[str] = mapped_column(ForeignKey("delivery_zones.id", ondelete="CASCADE"), nullable=False, index=True)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    capacity_override: Mapped[int | None] = mapped_column(Integer)

    __table_args__ = (
        UniqueConstraint("zone_id", "service_date", name="uq_schedule_zone_date"),
        Index("ix_schedule_date", "service_date"),
    )


class BlackoutDate(Base, IdMixin):
    __tablename__ = "blackout_dates"

    service_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    reason: Mapped[str] = mapped_column(String(200), default="", nullable=False)
