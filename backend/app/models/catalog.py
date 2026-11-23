"""Catalog: collections, products, images, variants, inventory and movements."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
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

VARIANT_SIZES = ("classic", "deluxe", "grand")
PRODUCT_STATUSES = ("draft", "active", "archived")


class Collection(Base, IdMixin, TimestampMixin):
    __tablename__ = "collections"

    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    tagline: Mapped[str] = mapped_column(String(240), default="", nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    story: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    hero_image_url: Mapped[str | None] = mapped_column(String(500))
    palette_name: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    seo_title: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    seo_description: Mapped[str] = mapped_column(String(400), default="", nullable=False)

    products: Mapped[list["Product"]] = relationship(back_populates="collection")

    __table_args__ = (Index("ix_collections_published_position", "published", "position"),)


class Product(Base, IdMixin, TimestampMixin):
    __tablename__ = "products"

    collection_id: Mapped[str] = mapped_column(ForeignKey("collections.id", ondelete="RESTRICT"), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    short_description: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    base_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    compare_at_price_cents: Mapped[int | None] = mapped_column(Integer)
    category_tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    color_palette: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    flower_types: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    dimensions: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    vase_included: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    care_instructions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bestseller: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    new_arrival: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    seo_title: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    seo_description: Mapped[str] = mapped_column(String(400), default="", nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    deleted_at: Mapped[datetime | None] = mapped_column(UTCDateTime())

    collection: Mapped["Collection"] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.position"
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductVariant.position"
    )

    __table_args__ = (
        CheckConstraint("base_price_cents >= 0", name="ck_products_base_price_nonneg"),
        CheckConstraint("compare_at_price_cents IS NULL OR compare_at_price_cents >= base_price_cents", name="ck_products_compare_ge_base"),
        CheckConstraint("status IN ('draft','active','archived')", name="ck_products_status"),
        Index("ix_products_status_collection", "status", "collection_id"),
        Index("ix_products_flags", "featured", "bestseller", "new_arrival"),
    )

    @property
    def in_stock(self) -> bool:
        return any(v.in_stock and v.stock_qty > 0 for v in self.variants)


class ProductImage(Base, IdMixin):
    __tablename__ = "product_images"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    src: Mapped[str] = mapped_column(String(500), nullable=False)
    alt: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    media_asset_id: Mapped[str | None] = mapped_column(ForeignKey("media_assets.id", ondelete="SET NULL"))

    product: Mapped["Product"] = relationship(back_populates="images")


class ProductVariant(Base, IdMixin, TimestampMixin):
    __tablename__ = "product_variants"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    size: Mapped[str] = mapped_column(String(16), nullable=False)
    label: Mapped[str] = mapped_column(String(40), nullable=False)
    stems: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    compare_at_price_cents: Mapped[int | None] = mapped_column(Integer)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    stock_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="variants")

    __table_args__ = (
        UniqueConstraint("product_id", "size", name="uq_variant_product_size"),
        CheckConstraint("size IN ('classic','deluxe','grand')", name="ck_variant_size"),
        CheckConstraint("price_cents >= 0", name="ck_variant_price_nonneg"),
        CheckConstraint("stock_qty >= 0", name="ck_variant_stock_nonneg"),
    )


class InventoryMovement(Base, IdMixin):
    __tablename__ = "inventory_movements"

    variant_id: Mapped[str] = mapped_column(ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False, index=True)
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(40), nullable=False)  # adjustment | order | cancellation | refund | seed
    reference: Mapped[str | None] = mapped_column(String(80))
    note: Mapped[str] = mapped_column(String(400), default="", nullable=False)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"))
    stock_after: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, nullable=False)

    __table_args__ = (Index("ix_inventory_movements_variant_created", "variant_id", "created_at"),)
