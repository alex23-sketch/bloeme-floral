"""Authenticated admin resources. Every mutation requires a valid cookie
session and CSRF header; role dependencies enforce Owner/Admin/Staff access."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ...core.deps import client_ip, current_admin, current_session, owner_only, require_role
from ...core.errors import Conflict, NotFound, ValidationFailed
from ...core.security import require_csrf
from ...models import (
    AdminSession, AdminUser, AuditEvent, Collection, CmsPage, DeliverySchedule, DeliveryWindow, DeliveryZone, EmailLog,
    EmailTemplate, Faq, Inquiry, InventoryMovement, MediaAsset, Order, Product, ProductVariant, Testimonial,
)
from ...schemas.catalog import CollectionCreate, CollectionUpdate, ProductCreate, ProductUpdate, StockAdjustment
from ...schemas.cms import BusinessSettingsIn, EmailSettingsIn, FaqIn, InquiryUpdate, PageUpdate, PublishRequest, TestimonialIn
from ...schemas.commerce import BlackoutIn, DeliveryWindowIn, DeliveryZoneIn, OrderNotesUpdate, RefundRequest, ScheduleIn, ShipmentStatusUpdate
from ...services import audit, auth, catalog, cms, email, orders
from ...services.media import store, validate_upload
from ...services.payments import record_refund
from ...core.db import get_db

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_csrf)])


def _guard(request: Request) -> None:
    require_csrf(request)


def _admin(admin: AdminUser = Depends(current_admin)) -> AdminUser:
    return admin


def _payload(obj) -> dict:
    return {"id": obj.id, **{k: v for k, v in obj.__dict__.items() if not k.startswith("_") and k not in {"password_hash"}}}


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    from datetime import UTC, datetime, timedelta
    since = datetime.now(UTC) - timedelta(days=30)
    return {
        "role": admin.role,
        "orders": {
            "total": db.scalar(select(func.count(Order.id))) or 0,
            "pending": db.scalar(select(func.count(Order.id)).where(Order.status.in_(["pending", "awaiting_payment"]))) or 0,
            "revenue_cents_30d": db.scalar(select(func.coalesce(func.sum(Order.total_cents), 0)).where(Order.created_at >= since)) or 0,
        },
        "products": {
            "active": db.scalar(select(func.count(Product.id)).where(Product.status == "active", Product.deleted_at.is_(None))) or 0,
            "low_stock": len(catalog.low_stock_variants(db)),
        },
        "inquiries": db.scalar(select(func.count(Inquiry.id)).where(Inquiry.status == "new")) or 0,
        "content_version": cms.content_version(db),
    }


# ---------------------------------------------------------------- catalog CRUD

@router.get("/collections")
def admin_collections(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return [catalog.public_collection(db, c) for c in catalog.list_collections(db, published_only=False)]


@router.post("/collections", status_code=status.HTTP_201_CREATED)
def create_collection(payload: CollectionCreate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = catalog.create_collection(db, payload)
    audit.record(db, actor=admin, action="collection.created", resource_type="collection", resource_id=obj.id, summary=obj.name, ip=client_ip(request))
    db.commit()
    return catalog.public_collection(db, obj)


@router.patch("/collections/{collection_id}")
def update_collection(collection_id: str, payload: CollectionUpdate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = catalog.update_collection(db, catalog.get_collection(db, collection_id), payload)
    audit.record(db, actor=admin, action="collection.updated", resource_type="collection", resource_id=obj.id, summary=obj.name, ip=client_ip(request))
    db.commit()
    return catalog.public_collection(db, obj)


@router.get("/products")
def admin_products(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin), q: str | None = None, status_: str | None = None):
    stmt = select(Product).options(selectinload(Product.variants), selectinload(Product.images), selectinload(Product.collection)).order_by(Product.updated_at.desc())
    if status_:
        stmt = stmt.where(Product.status == status_)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%") | Product.sku.ilike(f"%{q}%"))
    return [catalog.public_product(p) for p in db.scalars(stmt)]


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = catalog.create_product(db, payload)
    audit.record(db, actor=admin, action="product.created", resource_type="product", resource_id=obj.id, summary=obj.name, ip=client_ip(request))
    db.commit()
    return catalog.public_product(catalog.get_product(db, obj.id))


@router.patch("/products/{product_id}")
def update_product(product_id: str, payload: ProductUpdate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = catalog.update_product(db, catalog.get_product(db, product_id), payload)
    audit.record(db, actor=admin, action="product.updated", resource_type="product", resource_id=obj.id, summary=obj.name, ip=client_ip(request))
    db.commit()
    return catalog.public_product(catalog.get_product(db, obj.id))


@router.post("/products/{product_id}/duplicate", status_code=status.HTTP_201_CREATED)
def duplicate_product(product_id: str, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = catalog.duplicate_product(db, catalog.get_product(db, product_id))
    audit.record(db, actor=admin, action="product.duplicated", resource_type="product", resource_id=obj.id, summary=obj.name, ip=client_ip(request))
    db.commit()
    return catalog.public_product(catalog.get_product(db, obj.id))


@router.post("/products/{product_id}/publish")
def publish_product(product_id: str, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = catalog.set_product_status(db, catalog.get_product(db, product_id), "active", actor=admin.email)
    audit.record(db, actor=admin, action="product.published", resource_type="product", resource_id=obj.id, summary=obj.name, ip=client_ip(request))
    db.commit()
    return catalog.public_product(catalog.get_product(db, obj.id))


@router.post("/products/{product_id}/archive")
def archive_product(product_id: str, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = catalog.archive_product(db, catalog.get_product(db, product_id))
    audit.record(db, actor=admin, action="product.archived", resource_type="product", resource_id=obj.id, summary=obj.name, ip=client_ip(request))
    db.commit()
    return {"id": obj.id, "status": obj.status}


@router.post("/variants/{variant_id}/stock")
def adjust_variant_stock(variant_id: str, payload: StockAdjustment, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    variant = db.get(ProductVariant, variant_id)
    if not variant:
        raise NotFound("Variant not found")
    catalog.adjust_stock(db, variant, payload.delta, reason=payload.reason, note=payload.note, actor_id=admin.id)
    audit.record(db, actor=admin, action="inventory.adjusted", resource_type="variant", resource_id=variant.id, summary=f"delta={payload.delta}", ip=client_ip(request))
    db.commit()
    return {"variant_id": variant.id, "stock_qty": variant.stock_qty, "in_stock": variant.in_stock}


@router.get("/inventory/low-stock")
def low_stock(db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    return catalog.low_stock_variants(db)


# ---------------------------------------------------------------- orders

@router.get("/orders")
def orders_list(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin), status_: str | None = None, q: str | None = None, limit: int = 100):
    stmt = select(Order).options(selectinload(Order.items), selectinload(Order.history)).order_by(Order.created_at.desc()).limit(min(limit, 200))
    if status_:
        stmt = stmt.where(Order.status == status_)
    if q:
        stmt = stmt.where(Order.number.ilike(f"%{q}%") | Order.customer_email.ilike(f"%{q}%"))
    rows = list(db.scalars(stmt))
    orders.attach_window_names(db, rows)
    return [orders.order_payload(o) for o in rows]


@router.get("/orders/{order_id}")
def order_detail(order_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    obj = orders.get_order(db, order_id)
    orders.attach_window_names(db, [obj])
    return orders.order_payload(obj)


@router.post("/orders/{order_id}/status")
def order_status(order_id: str, payload: ShipmentStatusUpdate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    obj = orders.set_status(db, orders.get_order(db, order_id), payload.status, actor=admin.email, note=payload.note)
    audit.record(db, actor=admin, action="order.status_changed", resource_type="order", resource_id=obj.id, summary=payload.status, ip=client_ip(request))
    db.commit()
    return orders.order_payload(obj)


@router.patch("/orders/{order_id}/notes")
def order_notes(order_id: str, payload: OrderNotesUpdate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    obj = orders.get_order(db, order_id)
    obj.admin_notes = payload.admin_notes
    audit.record(db, actor=admin, action="order.notes_updated", resource_type="order", resource_id=obj.id, summary="Notes updated", ip=client_ip(request))
    db.commit()
    return {"id": obj.id, "admin_notes": obj.admin_notes}


@router.post("/orders/{order_id}/refund")
def refund_order(order_id: str, payload: RefundRequest, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    order = orders.get_order(db, order_id)
    if order.payment_status != "paid":
        raise Conflict("Only verified paid orders can be refunded")
    refund = record_refund(db, order, payload.amount_cents, payload.reason, actor_id=admin.id)
    audit.record(db, actor=admin, action="order.refund_requested", resource_type="refund", resource_id=refund.id, summary=str(payload.amount_cents), ip=client_ip(request))
    db.commit()
    return {"id": refund.id, "status": refund.status, "amount_cents": refund.amount_cents, "live_provider": False}


# ---------------------------------------------------------------- CMS and settings

@router.get("/settings")
def admin_settings(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return cms.settings_payload(cms.get_business(db))


@router.patch("/settings")
def update_settings(payload: BusinessSettingsIn, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    require_csrf(request)
    obj = cms.update_settings(db, cms.get_business(db), payload)
    audit.record(db, actor=admin, action="settings.updated", resource_type="business_settings", resource_id=obj.id, summary="Business settings updated", ip=client_ip(request))
    db.commit()
    return cms.settings_payload(obj)


@router.get("/pages")
def pages(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return [cms.page_payload(p, public=False) for p in cms.list_pages(db)]


@router.patch("/pages/{slug}")
def page_draft(slug: str, payload: PageUpdate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    obj = cms.update_draft(db, cms.get_page(db, slug), payload)
    audit.record(db, actor=admin, action="cms.draft_updated", resource_type="page", resource_id=obj.id, summary=slug, ip=client_ip(request))
    db.commit()
    return cms.page_payload(obj, public=False)


@router.post("/pages/{slug}/publish")
def page_publish(slug: str, payload: PublishRequest, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = cms.publish_page(db, cms.get_page(db, slug), actor_email=admin.email, actor_id=admin.id, note=payload.note)
    audit.record(db, actor=admin, action="cms.published", resource_type="page", resource_id=obj.id, summary=slug, ip=client_ip(request))
    db.commit()
    return cms.page_payload(obj, public=True)


@router.get("/pages/{slug}/revisions")
def page_revisions(slug: str, db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return cms.revisions_payload(db, cms.get_page(db, slug))


@router.post("/pages/{slug}/rollback/{revision}")
def page_rollback(slug: str, revision: int, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    obj = cms.rollback(db, cms.get_page(db, slug), revision, actor_id=admin.id)
    audit.record(db, actor=admin, action="cms.rollback", resource_type="page", resource_id=obj.id, summary=f"revision={revision}", ip=client_ip(request))
    db.commit()
    return cms.page_payload(obj, public=True)


@router.get("/testimonials")
def testimonials(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return [cms.testimonial_payload(x) for x in db.scalars(select(Testimonial).order_by(Testimonial.created_at.desc()))]


@router.post("/testimonials", status_code=status.HTTP_201_CREATED)
def create_testimonial(payload: TestimonialIn, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    obj = cms.upsert_testimonial(db, payload)
    db.commit()
    return cms.testimonial_payload(obj)


@router.get("/faqs")
def faqs(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return [cms.faq_payload(x) for x in db.scalars(select(Faq).order_by(Faq.position))]


@router.post("/faqs", status_code=status.HTTP_201_CREATED)
def create_faq(payload: FaqIn, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    obj = cms.upsert_faq(db, payload)
    db.commit()
    return cms.faq_payload(obj)


@router.get("/inquiries")
def inquiries(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin), status_: str | None = None):
    stmt = select(Inquiry).order_by(Inquiry.created_at.desc())
    if status_:
        stmt = stmt.where(Inquiry.status == status_)
    return [_payload(x) for x in db.scalars(stmt)]


@router.patch("/inquiries/{inquiry_id}")
def inquiry_update(inquiry_id: str, payload: InquiryUpdate, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    obj = db.get(Inquiry, inquiry_id)
    if not obj:
        raise NotFound("Inquiry not found")
    obj.status = payload.status
    obj.notes = payload.notes
    db.commit()
    return _payload(obj)


# ---------------------------------------------------------------- accounts, audit, delivery, email, media

@router.get("/users")
def users(db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    return [auth.user_payload(u) for u in auth.list_users(db)]


@router.post("/users")
def create_user(payload: dict, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("owner"))):
    _guard(request)
    obj = auth.create_user(db, actor=admin, email=payload.get("email", ""), name=payload.get("name", ""), password=payload.get("password", ""), role=payload.get("role", "staff"), ip=client_ip(request))
    db.commit()
    return auth.user_payload(obj)


@router.get("/audit")
def audit_log(db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin")), limit: int = 100):
    rows = db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(min(limit, 500))).all()
    return [_payload(x) for x in rows]


@router.get("/delivery/zones")
def zones(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return [_payload(x) | {"postal_codes": x.zip_list} for x in db.scalars(select(DeliveryZone).order_by(DeliveryZone.position))]


@router.get("/delivery/windows")
def windows(db: Session = Depends(get_db), admin: AdminUser = Depends(_admin)):
    return [_payload(x) for x in db.scalars(select(DeliveryWindow).order_by(DeliveryWindow.position))]


@router.post("/delivery/schedules")
def schedule(payload: ScheduleIn, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    obj = DeliverySchedule(**payload.model_dump(), service_date=date.fromisoformat(payload.service_date))
    db.add(obj)
    db.commit()
    return _payload(obj)


@router.get("/email/logs")
def email_logs(db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    return [email.log_payload(x) for x in db.scalars(select(EmailLog).order_by(EmailLog.created_at.desc()).limit(200))]


@router.post("/email/logs/{log_id}/retry")
def email_retry(log_id: str, request: Request, db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("admin"))):
    _guard(request)
    log = db.get(EmailLog, log_id)
    if not log:
        raise NotFound("Email log not found")
    email.retry(db, log)
    db.commit()
    return email.log_payload(log)


@router.post("/media", status_code=status.HTTP_201_CREATED)
async def media_upload(request: Request, file: UploadFile = File(...), alt: str = Form(default=""), db: Session = Depends(get_db), admin: AdminUser = Depends(require_role("staff"))):
    _guard(request)
    raw = await file.read()
    image = validate_upload(raw, file.content_type or "", file.filename or "upload")
    stored, _digest = store(image.data, image.extension)
    asset = MediaAsset(filename=file.filename or stored, stored_name=stored, content_type=image.content_type, size_bytes=len(raw), width=image.width, height=image.height, alt_text=alt, url=f"/media/uploads/{stored}", uploaded_by=admin.id)
    db.add(asset)
    audit.record(db, actor=admin, action="media.uploaded", resource_type="media_asset", summary=asset.filename, ip=client_ip(request))
    db.commit()
    return _payload(asset)


# NOTE: a single router instance is defined at the top of this module; this
# comment documents that every route above is registered with CSRF enforcement
# via main.py include. Route-level _guard() calls protect each mutation too.
