"""Catalog service: products, collections, variants and public serialisation."""

from __future__ import annotations

import re

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..core.errors import Conflict, NotFound, ValidationFailed
from ..models import Collection, InventoryMovement, Product, ProductImage, ProductVariant
from ..models.base import iso, utcnow
from ..schemas.catalog import CollectionCreate, CollectionUpdate, ProductCreate, ProductUpdate

VARIANT_LABELS = {"classic": "Classic", "deluxe": "Deluxe", "grand": "Grand"}
VARIANT_ORDER = {"classic": 0, "deluxe": 1, "grand": 2}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return re.sub(r"-{2,}", "-", slug)[:118] or "item"


def _clamp_price(v: int | None) -> int | None:
    if v is None:
        return None
    if v < 0:
        raise ValidationFailed("Prices cannot be negative")
    return v


# ------------------------------------------------------------------ collections


def collection_counts(db: Session) -> dict[str, int]:
    rows = db.execute(
        select(Product.collection_id, func.count(Product.id))
        .where(Product.status == "active", Product.deleted_at.is_(None))
        .group_by(Product.collection_id)
    ).all()
    return {cid: count for cid, count in rows}


def public_collection(db: Session, c: Collection, counts: dict[str, int] | None = None) -> dict:
    counts = counts if counts is not None else collection_counts(db)
    return {
        "id": c.id,
        "slug": c.slug,
        "name": c.name,
        "tagline": c.tagline,
        "description": c.description,
        "story": c.story or [],
        "hero_image": {"src": c.hero_image_url, "alt": c.name} if c.hero_image_url else None,
        "palette_name": c.palette_name,
        "position": c.position,
        "featured": c.featured,
        "product_count": counts.get(c.id, 0),
        "seo_title": c.seo_title,
        "seo_description": c.seo_description,
    }


def list_collections(db: Session, *, published_only: bool) -> list[Collection]:
    stmt = select(Collection).order_by(Collection.position, Collection.name)
    if published_only:
        stmt = stmt.where(Collection.published.is_(True))
    return list(db.scalars(stmt))


def get_collection(db: Session, ident: str, *, published_only: bool = False) -> Collection:
    stmt = select(Collection).where(or_(Collection.id == ident, Collection.slug == ident))
    if published_only:
        stmt = stmt.where(Collection.published.is_(True))
    obj = db.scalar(stmt)
    if not obj:
        raise NotFound("Collection not found")
    return obj


def create_collection(db: Session, data: CollectionCreate) -> Collection:
    slug = data.slug or slugify(data.name)
    if db.scalar(select(Collection).where(or_(Collection.slug == slug, Collection.name == data.name))):
        raise Conflict("A collection with that name or slug already exists")
    obj = Collection(
        slug=slug,
        name=data.name,
        tagline=data.tagline,
        description=data.description,
        story=data.story,
        hero_image_url=data.hero_image_url,
        palette_name=data.palette_name,
        position=data.position,
        featured=data.featured,
        published=data.published,
        seo_title=data.seo_title,
        seo_description=data.seo_description,
    )
    db.add(obj)
    db.flush()
    return obj


def update_collection(db: Session, obj: Collection, data: CollectionUpdate) -> Collection:
    payload = data.model_dump(exclude_unset=True)
    if "slug" in payload and payload["slug"] and payload["slug"] != obj.slug:
        if db.scalar(select(Collection).where(Collection.slug == payload["slug"], Collection.id != obj.id)):
            raise Conflict("Slug already in use")
    for field, value in payload.items():
        setattr(obj, field, value)
    obj.updated_at = utcnow()
    return obj


# ------------------------------------------------------------------ products


def _product_query():
    return select(Product).options(
        selectinload(Product.variants), selectinload(Product.images), selectinload(Product.collection)
    )


def get_product(db: Session, ident: str, *, published_only: bool = False) -> Product:
    stmt = _product_query().where(or_(Product.id == ident, Product.slug == ident), Product.deleted_at.is_(None))
    if published_only:
        stmt = stmt.where(Product.status == "active", Product.collection.has(Collection.published.is_(True)))
    obj = db.scalar(stmt)
    if not obj:
        raise NotFound("Product not found")
    return obj


def public_product(p: Product) -> dict:
    low_stock = any(0 < v.stock_qty <= p.low_stock_threshold for v in p.variants)
    return {
        "id": p.id,
        "collection": p.collection.slug if p.collection else "",
        "collection_name": p.collection.name if p.collection else "",
        "sku": p.sku,
        "name": p.name,
        "slug": p.slug,
        "short_description": p.short_description,
        "description": p.description,
        "price_cents": p.base_price_cents,
        "compare_at_price_cents": p.compare_at_price_cents,
        "category_tags": p.category_tags or [],
        "color_palette": p.color_palette or [],
        "flower_types": p.flower_types or [],
        "dimensions": p.dimensions or {},
        "vase_included": p.vase_included,
        "care_instructions": p.care_instructions or [],
        "status": p.status,
        "in_stock": p.in_stock,
        "featured": p.featured,
        "bestseller": p.bestseller,
        "new_arrival": p.new_arrival,
        "low_stock": low_stock,
        "images": [{"id": i.id, "src": i.src, "alt": i.alt, "position": i.position} for i in p.images],
        "variants": [
            {
                "id": v.id,
                "size": v.size,
                "label": v.label,
                "stems": v.stems,
                "description": v.description,
                "price_cents": v.price_cents,
                "compare_at_price_cents": v.compare_at_price_cents,
                "sku": v.sku,
                "stock_qty": v.stock_qty,
                "in_stock": v.in_stock and v.stock_qty > 0,
            }
            for v in sorted(p.variants, key=lambda x: (VARIANT_ORDER.get(x.size, 9), x.position))
        ],
        "seo_title": p.seo_title,
        "seo_description": p.seo_description,
        "updated_at": iso(p.updated_at),
    }


def _validate_variants(variants: list) -> None:
    sizes = [v.size for v in variants]
    if len(set(sizes)) != len(sizes):
        raise ValidationFailed("Each size (classic/deluxe/grand) may appear only once")
    for v in variants:
        if v.compare_at_price_cents is not None and v.compare_at_price_cents < v.price_cents:
            raise ValidationFailed("Compare-at price must be greater than or equal to price")


def create_product(db: Session, data: ProductCreate) -> Product:
    _validate_variants(data.variants)
    get_collection(db, data.collection_id)
    slug = data.slug or slugify(data.name)
    if db.scalar(select(Product).where(or_(Product.slug == slug, Product.name == data.name))):
        raise Conflict("A product with that name or slug already exists")
    base = min([v.price_cents for v in data.variants], default=0)
    sku = data.sku or f"BF-{slug[:6].upper().replace('-', '')}-{abs(hash(slug)) % 1000:03d}"
    if db.scalar(select(Product).where(Product.sku == sku)):
        raise Conflict("SKU already in use")
    p = Product(
        collection_id=data.collection_id,
        sku=sku,
        name=data.name,
        slug=slug,
        short_description=data.short_description,
        description=data.description,
        base_price_cents=base,
        compare_at_price_cents=None,
        category_tags=data.category_tags,
        color_palette=[c.model_dump() for c in data.color_palette],
        flower_types=data.flower_types,
        dimensions=data.dimensions.model_dump(),
        vase_included=data.vase_included,
        care_instructions=data.care_instructions,
        status="draft",
        featured=data.featured,
        bestseller=data.bestseller,
        new_arrival=data.new_arrival,
        low_stock_threshold=data.low_stock_threshold,
        seo_title=data.seo_title,
        seo_description=data.seo_description,
    )
    db.add(p)
    db.flush()
    _sync_images(db, p, data.images)
    _sync_variants(db, p, data.variants)
    db.flush()
    db.refresh(p)
    return p


def _sync_images(db: Session, p: Product, images: list) -> None:
    for old in list(p.images):
        db.delete(old)
    db.flush()
    for i, img in enumerate(images):
        db.add(ProductImage(product_id=p.id, src=img.src, alt=img.alt, position=img.position or i))


def _sync_variants(db: Session, p: Product, variants: list) -> None:
    existing = {v.size: v for v in p.variants}
    for v in variants:
        cur = existing.pop(v.size, None)
        sku = v.sku or f"{p.sku}-{v.size[:3].upper()}"
        if cur:
            if sku != cur.sku and db.scalar(select(ProductVariant).where(ProductVariant.sku == sku)):
                raise Conflict(f"Variant SKU {sku} already in use")
            cur.label = v.label or VARIANT_LABELS[v.size]
            cur.stems = v.stems
            cur.description = v.description
            cur.price_cents = v.price_cents
            cur.compare_at_price_cents = v.compare_at_price_cents
            cur.sku = sku
            cur.in_stock = v.in_stock
            if v.stock_qty != cur.stock_qty:
                delta = v.stock_qty - cur.stock_qty
                if cur.stock_qty + delta < 0:
                    raise ValidationFailed("Stock cannot go negative")
                _record_movement(db, cur, delta, "correction", "Variant editor")
        else:
            if db.scalar(select(ProductVariant).where(ProductVariant.sku == sku)):
                raise Conflict(f"Variant SKU {sku} already in use")
            nv = ProductVariant(
                product_id=p.id,
                size=v.size,
                label=v.label or VARIANT_LABELS[v.size],
                stems=v.stems,
                description=v.description,
                price_cents=v.price_cents,
                compare_at_price_cents=v.compare_at_price_cents,
                sku=sku,
                stock_qty=v.stock_qty,
                in_stock=v.in_stock,
                position=VARIANT_ORDER[v.size],
            )
            db.add(nv)
            db.flush()
            if v.stock_qty:
                _record_movement(db, nv, v.stock_qty, "seed", "Initial stock")
    # Never delete a variant that has been ordered: mark out of stock instead.
    for leftover in existing.values():
        leftover.in_stock = False
    p.base_price_cents = min([v.price_cents for v in variants], default=p.base_price_cents)


def update_product(db: Session, p: Product, data: ProductUpdate) -> Product:
    payload = data.model_dump(exclude_unset=True)
    if "variants" in payload and payload["variants"] is not None:
        from ..schemas.catalog import VariantIn

        variants = [VariantIn(**v) if isinstance(v, dict) else v for v in payload.pop("variants")]
        _validate_variants(variants)
        db.flush()
        # Re-point incoming variant ids/skus before syncing
        _sync_variants(db, p, variants)
    if "images" in payload and payload["images"] is not None:
        from ..schemas.catalog import ProductImageIn

        images = [ProductImageIn(**i) if isinstance(i, dict) else i for i in payload.pop("images")]
        _sync_images(db, p, images)
    if "collection_id" in payload:
        get_collection(db, payload["collection_id"])
    if "slug" in payload and payload["slug"]:
        if db.scalar(select(Product).where(Product.slug == payload["slug"], Product.id != p.id)):
            raise Conflict("Slug already in use")
    for field, value in payload.items():
        if field == "color_palette" and value is not None:
            value = [c if isinstance(c, dict) else c.model_dump() for c in value]
        if field == "dimensions" and value is not None:
            value = value if isinstance(value, dict) else value.model_dump()
        if field == "compare_at_price_cents":
            value = _clamp_price(value)
        setattr(p, field, value)
    p.updated_at = utcnow()
    db.flush()
    db.refresh(p)
    return p


def set_product_status(db: Session, p: Product, status: str, *, actor: str) -> Product:
    if status not in {"draft", "active", "archived"}:
        raise ValidationFailed("Unsupported status")
    if status == "active":
        if not p.variants:
            raise ValidationFailed("A product needs at least one variant before it can be published")
        if not p.images:
            raise ValidationFailed("A product needs at least one image before it can be published")
        if p.base_price_cents <= 0:
            raise ValidationFailed("A product needs a price before it can be published")
        if p.published_at is None:
            p.published_at = utcnow()
    p.status = status
    p.updated_at = utcnow()
    return p


def duplicate_product(db: Session, p: Product) -> Product:
    base = slugify(f"{p.slug}-copy")
    suffix = 2
    slug = base
    while db.scalar(select(Product).where(Product.slug == slug)):
        slug = f"{base}-{suffix}"
        suffix += 1
    sku = f"{p.sku}-C{suffix}"[:40]
    while db.scalar(select(Product).where(Product.sku == sku)):
        suffix += 1
        sku = f"{p.sku}-C{suffix}"[:40]
    clone = Product(
        collection_id=p.collection_id,
        sku=sku,
        name=f"{p.name} (copy)",
        slug=slug,
        short_description=p.short_description,
        description=p.description,
        base_price_cents=p.base_price_cents,
        compare_at_price_cents=p.compare_at_price_cents,
        category_tags=list(p.category_tags or []),
        color_palette=list(p.color_palette or []),
        flower_types=list(p.flower_types or []),
        dimensions=dict(p.dimensions or {}),
        vase_included=p.vase_included,
        care_instructions=list(p.care_instructions or []),
        status="draft",
        featured=p.featured,
        bestseller=p.bestseller,
        new_arrival=p.new_arrival,
        low_stock_threshold=p.low_stock_threshold,
        seo_title=p.seo_title,
        seo_description=p.seo_description,
    )
    db.add(clone)
    db.flush()
    for img in p.images:
        db.add(ProductImage(product_id=clone.id, src=img.src, alt=img.alt, position=img.position))
    for v in p.variants:
        nv = ProductVariant(
            product_id=clone.id,
            size=v.size,
            label=v.label,
            stems=v.stems,
            description=v.description,
            price_cents=v.price_cents,
            compare_at_price_cents=v.compare_at_price_cents,
            sku=f"{clone.sku}-{v.size[:3].upper()}",
            stock_qty=0,
            in_stock=False,
            position=v.position,
        )
        db.add(nv)
    db.flush()
    db.refresh(clone)
    return clone


def archive_product(db: Session, p: Product) -> Product:
    p.status = "archived"
    p.deleted_at = utcnow()
    p.updated_at = utcnow()
    return p


# ------------------------------------------------------------------ inventory


def _record_movement(db: Session, variant: ProductVariant, delta: int, reason: str, note: str = "", actor_id: str | None = None) -> None:
    db.add(
        InventoryMovement(
            variant_id=variant.id,
            delta=delta,
            reason=reason,
            note=note,
            actor_id=actor_id,
            stock_after=variant.stock_qty,
        )
    )


def adjust_stock(db: Session, variant: ProductVariant, delta: int, *, reason: str, note: str = "", actor_id: str | None = None, reference: str | None = None) -> int:
    """Apply an atomic stock delta and record the movement.

    Uses a conditional UPDATE so two concurrent checkouts can never drive stock
    below zero: the decrement only succeeds while `stock_qty >= -delta`.
    """
    from sqlalchemy import update as sa_update

    if delta == 0:
        return variant.stock_qty
    if delta < 0:
        stmt = (
            sa_update(ProductVariant)
            .where(ProductVariant.id == variant.id, ProductVariant.stock_qty >= -delta)
            .values(stock_qty=ProductVariant.stock_qty + delta)
        )
    else:
        stmt = sa_update(ProductVariant).where(ProductVariant.id == variant.id).values(stock_qty=ProductVariant.stock_qty + delta)
    result = db.execute(stmt)
    if result.rowcount == 0:
        raise Conflict("Insufficient stock", {"variant_id": variant.id, "requested": -delta})
    db.flush()
    db.refresh(variant)
    db.add(
        InventoryMovement(
            variant_id=variant.id,
            delta=delta,
            reason=reason,
            reference=reference,
            note=note,
            actor_id=actor_id,
            stock_after=variant.stock_qty,
        )
    )
    return variant.stock_qty


def low_stock_variants(db: Session) -> list[dict]:
    stmt = (
        select(ProductVariant)
        .options(selectinload(ProductVariant.product))
        .join(Product, Product.id == ProductVariant.product_id)
        .where(ProductVariant.stock_qty <= Product.low_stock_threshold, Product.status == "active", Product.deleted_at.is_(None))
        .order_by(ProductVariant.stock_qty)
    )
    return [
        {
            "variant_id": v.id,
            "sku": v.sku,
            "product": v.product.name if v.product else "",
            "size": v.size,
            "stock_qty": v.stock_qty,
            "threshold": v.product.low_stock_threshold if v.product else 0,
        }
        for v in db.scalars(stmt)
    ]
