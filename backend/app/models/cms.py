"""CMS: business settings, branding, pages, sections, revisions, media, editorial."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import IdMixin, TimestampMixin, UTCDateTime, utcnow
from .db_base import Base


class BusinessSettings(Base, IdMixin, TimestampMixin):
    """Singleton row (id = 'business'). Holds brand + operational configuration."""

    __tablename__ = "business_settings"

    company_name: Mapped[str] = mapped_column(String(160), nullable=False)
    wordmark: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    tagline: Mapped[str] = mapped_column(String(240), default="", nullable=False)
    short_description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    favicon_url: Mapped[str | None] = mapped_column(String(500))
    colors: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    typography: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    contact: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    store_hours: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    social: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    policies: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    seo: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    tax_rate_bp: Mapped[int] = mapped_column(Integer, default=725, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    locale: Mapped[str] = mapped_column(String(16), default="en-US", nullable=False)
    payments_mode: Mapped[str] = mapped_column(String(16), default="demo", nullable=False)
    content_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class CmsPage(Base, IdMixin, TimestampMixin):
    __tablename__ = "cms_pages"

    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    seo_title: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    seo_description: Mapped[str] = mapped_column(String(400), default="", nullable=False)
    draft_sections: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    published_sections: Mapped[list | None] = mapped_column(JSON)
    draft_hero: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    published_hero: Mapped[dict | None] = mapped_column(JSON)
    draft_updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    published_by: Mapped[str | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"))
    revision: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    revisions: Mapped[list["CmsPageRevision"]] = relationship(
        back_populates="page", cascade="all, delete-orphan", order_by="CmsPageRevision.revision.desc()"
    )


class CmsPageRevision(Base, IdMixin):
    __tablename__ = "cms_page_revisions"

    page_id: Mapped[str] = mapped_column(ForeignKey("cms_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    revision: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    sections: Mapped[list] = mapped_column(JSON, nullable=False)
    hero: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    published_by: Mapped[str | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"))
    note: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)

    page: Mapped["CmsPage"] = relationship(back_populates="revisions")

    __table_args__ = (UniqueConstraint("page_id", "revision", name="uq_page_revision"),)


class MediaAsset(Base, IdMixin, TimestampMixin):
    __tablename__ = "media_assets"

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    content_type: Mapped[str] = mapped_column(String(80), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    alt_text: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[str | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"))


class Testimonial(Base, IdMixin, TimestampMixin):
    __tablename__ = "testimonials"

    quote: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(160), nullable=False)
    initials: Mapped[str] = mapped_column(String(4), default="", nullable=False)
    location: Mapped[str] = mapped_column(String(160), default="", nullable=False)
    occasion: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Faq(Base, IdMixin, TimestampMixin):
    __tablename__ = "faqs"

    question: Mapped[str] = mapped_column(String(300), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(40), default="ordering", nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Inquiry(Base, IdMixin):
    __tablename__ = "inquiries"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(40))
    topic: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="new", nullable=False)  # new | read | replied | closed
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)
    responded_at: Mapped[datetime | None] = mapped_column(UTCDateTime())

    __table_args__ = (Index("ix_inquiries_status_created", "status", "created_at"),)
