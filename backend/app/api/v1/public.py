"""Public (unauthenticated) catalog, CMS and delivery endpoints.

These are the exact resources the website and the future Expo app consume.
Every response carries an ETag derived from the content version so clients can
cache and revalidate cheaply; publishing anything in the admin bumps it.
"""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from ...core.config import settings
from ...core.db import get_db
from ...core.errors import NotFound, TooManyRequests, ValidationFailed
from ...core.ratelimit import limiter
from ...models import Collection, DeliveryWindow, DeliveryZone, Faq, Order, Product, Testimonial
from ...models.base import iso
from ...schemas.catalog import PublicCollection, PublicProduct, SearchResult
from ...schemas.cms import InquiryIn
from ...schemas.commerce import QuoteRequest
from ...services import catalog, cms, orders
from ...services.delivery import find_zone
from ...services.email import send_transactional

router = APIRouter(tags=["public"])


def _etag(response: Response, db: Session, extra: str = "") -> str:
    token = f'W/"{cms.content_version(db)}{extra}"'
    response.headers["ETag"] = token
    response.headers["Cache-Control"] = "public, max-age=0, must-revalidate"
    return token


@router.get("/site", summary="Brand, settings, published pages, editorial and delivery config")
def get_site(response: Response, db: Session = Depends(get_db)) -> dict:
    biz = cms.get_business(db)
    _etag(response, db)
    pages = [cms.page_payload(p, public=True) for p in cms.list_pages(db) if p.published_sections is not None]
    zones = db.scalars(select(DeliveryZone).where(DeliveryZone.active.is_(True)).order_by(DeliveryZone.position)).all()
    windows = db.scalars(select(DeliveryWindow).where(DeliveryWindow.active.is_(True)).order_by(DeliveryWindow.position)).all()
    return {
        "settings": cms.public_settings(biz),
        "pages": pages,
        "testimonials": cms.public_testimonials(db),
        "faqs": cms.public_faqs(db),
        "delivery": {
            "zones": [
                {
                    "id": z.id,
                    "name": z.name,
                    "region": z.region,
                    "postal_codes": z.zip_list,
                    "same_day_available": z.same_day_available,
                    "cutoff_time": z.cutoff_time,
                    "standard_fee_cents": z.standard_fee_cents,
                    "express_fee_cents": z.express_fee_cents,
                    "same_day_fee_cents": z.same_day_fee_cents,
                    "minimum_order_cents": z.minimum_order_cents,
                    "standard_lead_hours": z.standard_lead_hours,
                    "notes": z.notes,
                }
                for z in zones
            ],
            "windows": [
                {
                    "id": w.id,
                    "name": w.name,
                    "description": w.description,
                    "window": f"{w.start_time} – {w.end_time}",
                    "surcharge_cents": w.surcharge_cents,
                    "same_day_only": w.same_day_only,
                }
                for w in windows
            ],
        },
        "payments_mode": settings.payments_mode if biz.payments_mode != "stripe" or settings.stripe_secret_key else "disabled",
        "content_version": cms.content_version(db),
    }


@router.get("/collections", response_model=list[PublicCollection], summary="Published collections")
def list_collections(response: Response, db: Session = Depends(get_db)):
    _etag(response, db, ":collections")
    counts = catalog.collection_counts(db)
    return [catalog.public_collection(db, c, counts) for c in catalog.list_collections(db, published_only=True)]


@router.get("/collections/{slug}", response_model=PublicCollection, summary="A published collection")
def get_collection(slug: str, response: Response, db: Session = Depends(get_db)):
    c = catalog.get_collection(db, slug, published_only=True)
    _etag(response, db, f":collection-{c.id}")
    return catalog.public_collection(db, c)


@router.get("/products", response_model=list[PublicProduct], summary="Published products (search, filter, sort)")
def list_products(
    response: Response,
    db: Session = Depends(get_db),
    collection: str | None = None,
    q: str | None = Query(default=None, max_length=120),
    sort: str = Query(default="featured", pattern=r"^(featured|price-asc|price-desc|newest|name)$"),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.images), selectinload(Product.collection))
        .where(Product.status == "active", Product.deleted_at.is_(None), Collection.published.is_(True))
        .join(Collection)
    )
    if collection:
        coll = catalog.get_collection(db, collection, published_only=True)
        stmt = stmt.where(Product.collection_id == coll.id)
    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(like),
                Product.short_description.ilike(like),
                Product.description.ilike(like),
            )
        )
    order_by = {
        "featured": (Product.featured.desc(), Product.bestseller.desc(), Product.name),
        "price-asc": (Product.base_price_cents.asc(),),
        "price-desc": (Product.base_price_cents.desc(),),
        "newest": (Product.published_at.desc(), Product.name),
        "name": (Product.name.asc(),),
    }[sort]
    products = list(db.scalars(stmt.order_by(*order_by).limit(limit).offset(offset)))
    if q:
        needle = q.strip().lower()
        products = [
            p
            for p in products
            if needle in " ".join([p.name, p.short_description, *(p.flower_types or [])]).lower()
        ]
    _etag(response, db, f":products:{collection}:{q}:{sort}")
    return [catalog.public_product(p) for p in products]


@router.get("/products/{slug}", response_model=PublicProduct, summary="A published product")
def get_product(slug: str, response: Response, db: Session = Depends(get_db)):
    p = catalog.get_product(db, slug, published_only=True)
    _etag(response, db, f":product-{p.id}")
    return catalog.public_product(p)


@router.get("/search", response_model=list[SearchResult], summary="Cross-catalog search")
def search(q: str = Query(min_length=2, max_length=120), db: Session = Depends(get_db)):
    like = f"%{q.strip().lower()}%"
    results: list[SearchResult] = []
    for c in catalog.list_collections(db, published_only=True):
        if like.strip("%") in f"{c.name} {c.tagline}".lower():
            results.append(SearchResult(type="collection", id=c.id, slug=c.slug, title=c.name, subtitle=c.tagline))
    stmt = (
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.images), selectinload(Product.collection))
        .where(Product.status == "active", Product.deleted_at.is_(None))
        .where(or_(Product.name.ilike(like), Product.short_description.ilike(like), Product.description.ilike(like)))
        .limit(20)
    )
    for p in db.scalars(stmt):
        results.append(
            SearchResult(type="product", id=p.id, slug=p.slug, title=p.name, subtitle=p.collection.name if p.collection else "", price_cents=p.base_price_cents)
        )
    return results


@router.get("/delivery/availability", summary="ZIP / date / window availability and fees")
def delivery_availability(
    db: Session = Depends(get_db),
    postal_code: str | None = Query(default=None, pattern=r"^\d{5}(-\d{4})?$"),
    date_: str | None = Query(default=None, alias="date", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    window_id: str | None = None,
    subtotal_cents: int = Query(default=0, ge=0),
):
    from ...services import delivery as delivery_svc

    if not postal_code:
        raise ValidationFailed("A postal code is required")
    zone = find_zone(db, postal_code)
    if not zone:
        return {"eligible": False, "reason": "outside_zones", "zone": None}
    if not date_:
        return {"eligible": True, "zone": {"id": zone.id, "name": zone.name, "minimum_order_cents": zone.minimum_order_cents}}
    service_date = date.fromisoformat(date_)
    windows = db.scalars(select(DeliveryWindow).where(DeliveryWindow.active.is_(True)).order_by(DeliveryWindow.position)).all()
    out = []
    for w in windows:
        entry = {"id": w.id, "name": w.name, "window": f"{w.start_time} – {w.end_time}", "available": True, "reason": None, "capacity_left": None}
        try:
            delivery_svc.validate_date(db, service_date, zone, w)
            entry["capacity_left"] = delivery_svc.capacity_left(db, zone, w, service_date)
            if window_id and w.id == window_id:
                _, _, fee = delivery_svc.validate_delivery(db, postal_code, service_date, w.id, subtotal_cents)
                entry["fee_cents"] = fee
        except Exception as exc:  # DomainError with a message
            entry["available"] = False
            entry["reason"] = getattr(exc, "message", str(exc))
        out.append(entry)
    return {"eligible": True, "zone": {"id": zone.id, "name": zone.name}, "windows": out}


@router.get("/orders/{number}/status", summary="Minimal order status by reference")
def order_status(number: str, email: str, db: Session = Depends(get_db)):
    order = db.scalar(select(Order).where(Order.number == number.strip().upper(), Order.customer_email == email.lower().strip()))
    if not order:
        raise NotFound("Order not found")
    return {"number": order.number, "status": order.status, "payment_status": order.payment_status, "delivery_date": order.delivery_date.isoformat() if order.delivery_date else None}


@router.post("/quote", summary="Server-calculated cart totals")
def quote(payload: QuoteRequest, db: Session = Depends(get_db)):
    return orders.public_quote(db, payload)


@router.get("/calendar", summary="Next 8 weeks of service availability")
def calendar(db: Session = Depends(get_db), postal_code: str | None = Query(default=None, pattern=r"^\d{5}$")):
    zone = find_zone(db, postal_code) if postal_code else db.scalar(select(DeliveryZone).where(DeliveryZone.active.is_(True)).order_by(DeliveryZone.position))
    windows = db.scalars(select(DeliveryWindow).where(DeliveryWindow.active.is_(True))).all()
    today = date.today()
    days = []
    from ...models import BlackoutDate, DeliverySchedule

    blackouts = {d.service_date for d in db.scalars(select(BlackoutDate))}
    schedules = {(s.zone_id, s.service_date): s for s in db.scalars(select(DeliverySchedule))}
    if zone:
        for i in range(0, 56):
            day = today + timedelta(days=i)
            sched = schedules.get((zone.id, day))
            open_day = day.weekday() != 6 and day not in blackouts and (sched is None or sched.is_open)
            days.append(
                {
                    "date": day.isoformat(),
                    "open": open_day,
                    "windows": [
                        {
                            "id": w.id,
                            "name": w.name,
                            "window": f"{w.start_time} – {w.end_time}",
                            "same_day_only": w.same_day_only,
                            "available": open_day and (not w.same_day_only or day == today),
                        }
                        for w in windows
                    ],
                }
            )
    return {"zone": {"id": zone.id, "name": zone.name} if zone else None, "days": days}


@router.post("/inquiries", status_code=status.HTTP_201_CREATED, summary="Contact form submission")
def submit_inquiry(payload: InquiryIn, db: Session = Depends(get_db)):
    ok, retry = limiter.hit("inquiry:global", 30, 300)
    if not ok:
        raise TooManyRequests("Too many messages, please try again shortly")
    if not payload.consented:
        raise ValidationFailed("Consent is required")
    from email_validator import EmailNotValidError, validate_email

    try:
        email = validate_email(payload.email, check_deliverability=False).normalized
    except EmailNotValidError as exc:
        raise ValidationFailed("Enter a valid email address") from exc
    inquiry = cms.create_inquiry(db, name=payload.name, email=email, phone=payload.phone, topic=payload.topic, message=payload.message)
    send_transactional(db, key="inquiry_received", to=email, context={"name": payload.name})
    db.commit()
    return {"id": inquiry.id, "received_at": iso(inquiry.created_at)}


_ = (Faq, Testimonial, Testimonial)
