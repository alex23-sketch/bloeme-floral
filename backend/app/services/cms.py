"""CMS service: business settings, pages with draft/publish/revision, editorial."""

from __future__ import annotations

import hashlib
import json

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.errors import Conflict, NotFound, ValidationFailed
from ..models import BusinessSettings, CmsPage, CmsPageRevision, Faq, Inquiry, Testimonial
from ..models.base import iso, utcnow
from ..schemas.cms import BusinessSettingsIn, FaqIn, PageUpdate, TestimonialIn

BUSINESS_ID = "business"


def get_business(db: Session) -> BusinessSettings:
    biz = db.get(BusinessSettings, BUSINESS_ID)
    if not biz:
        raise NotFound("Business settings have not been created")
    return biz


def bump_version(db: Session) -> None:
    biz = get_business(db)
    biz.content_version += 1


def settings_payload(biz: BusinessSettings) -> dict:
    return {
        "id": biz.id,
        "company_name": biz.company_name,
        "wordmark": biz.wordmark,
        "tagline": biz.tagline,
        "short_description": biz.short_description,
        "logo_url": biz.logo_url,
        "favicon_url": biz.favicon_url,
        "colors": biz.colors,
        "typography": biz.typography,
        "contact": biz.contact,
        "store_hours": biz.store_hours,
        "social": biz.social,
        "policies": biz.policies,
        "seo": biz.seo,
        "tax_rate_bp": biz.tax_rate_bp,
        "currency": biz.currency,
        "locale": biz.locale,
        "payments_mode": biz.payments_mode,
        "content_version": biz.content_version,
        "updated_at": iso(biz.updated_at),
    }


def public_settings(biz: BusinessSettings) -> dict:
    payload = settings_payload(biz)
    for hidden in ("tax_rate_bp",):
        payload.pop(hidden, None)
    return payload


def update_settings(db: Session, biz: BusinessSettings, data: BusinessSettingsIn) -> BusinessSettings:
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "colors":
            continue
        if field == "store_hours" or field == "social":
            value = [v.model_dump() if hasattr(v, "model_dump") else v for v in value]
        setattr(biz, field, value)
    biz.colors = data.colors
    biz.updated_at = utcnow()
    bump_version(db)
    return biz


# ------------------------------------------------------------------ pages


def list_pages(db: Session) -> list[CmsPage]:
    return list(db.scalars(select(CmsPage).order_by(CmsPage.slug)))


def get_page(db: Session, slug: str) -> CmsPage:
    page = db.scalar(select(CmsPage).where(CmsPage.slug == slug))
    if not page:
        raise NotFound("Page not found")
    return page


def create_page(db: Session, *, slug: str, title: str) -> CmsPage:
    if db.scalar(select(CmsPage).where(CmsPage.slug == slug)):
        raise Conflict("Page slug already exists")
    page = CmsPage(slug=slug, title=title, draft_sections=[], draft_hero={}, draft_updated_at=utcnow())
    db.add(page)
    db.flush()
    return page


def update_draft(db: Session, page: CmsPage, data: PageUpdate) -> CmsPage:
    payload = data.model_dump(exclude_unset=True)
    for scalar in ("title", "seo_title", "seo_description"):
        if scalar in payload and payload[scalar] is not None:
            setattr(page, scalar, payload[scalar])
    if payload.get("hero") is not None:
        hero = payload["hero"]
        page.draft_hero = hero.model_dump() if hasattr(hero, "model_dump") else hero
    if payload.get("sections") is not None:
        page.draft_sections = [s.model_dump() if hasattr(s, "model_dump") else s for s in payload["sections"]] if isinstance(payload["sections"], list) else payload["sections"]
        # Accept either a list of sections or a full sections object from the admin UI
        if isinstance(payload["sections"], dict) and "sections" in payload["sections"]:
            page.draft_sections = payload["sections"]["sections"]
    page.draft_updated_at = utcnow()
    bump_version(db)
    return page


def publish_page(db: Session, page: CmsPage, *, actor_email: str, actor_id: str | None, note: str = "") -> CmsPage:
    if not page.draft_sections and not page.draft_hero:
        raise ValidationFailed("Nothing to publish")
    page.revision += 1
    revision = CmsPageRevision(
        page_id=page.id,
        revision=page.revision,
        title=page.title,
        sections=page.draft_sections,
        hero=page.draft_hero,
        published_by=actor_id,
        note=note,
    )
    db.add(revision)
    page.published_sections = page.draft_sections
    page.published_hero = page.draft_hero
    page.published_at = utcnow()
    page.published_by = actor_id
    bump_version(db)
    return page


def rollback(db: Session, page: CmsPage, revision_number: int, *, actor_id: str | None) -> CmsPage:
    rev = db.scalar(select(CmsPageRevision).where(CmsPageRevision.page_id == page.id, CmsPageRevision.revision == revision_number))
    if not rev:
        raise NotFound("Revision not found")
    page.title = rev.title
    page.draft_sections = rev.sections
    page.draft_hero = rev.hero
    page.draft_updated_at = utcnow()
    return publish_page(db, page, actor_email="rollback", actor_id=actor_id, note=f"Rolled back to revision {revision_number}")


def page_payload(page: CmsPage, *, public: bool) -> dict:
    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "seo_title": page.seo_title,
        "seo_description": page.seo_description,
        "hero": page.published_hero if public else page.draft_hero,
        "sections": page.published_sections if public else page.draft_sections,
        "published_at": iso(page.published_at),
        "revision": page.revision,
        "updated_at": iso(page.draft_updated_at),
    }


def revisions_payload(db: Session, page: CmsPage) -> list[dict]:
    rows = db.scalars(select(CmsPageRevision).where(CmsPageRevision.page_id == page.id).order_by(CmsPageRevision.revision.desc())).all()
    return [{"revision": r.revision, "title": r.title, "note": r.note, "created_at": iso(r.created_at)} for r in rows]


# ------------------------------------------------------------------ editorial


def testimonial_payload(t: Testimonial) -> dict:
    return {
        "id": t.id,
        "quote": t.quote,
        "author": t.author,
        "initials": t.initials,
        "location": t.location,
        "occasion": t.occasion,
        "rating": t.rating,
        "is_sample": t.is_sample,
        "featured": t.featured,
        "published": t.published,
    }


def faq_payload(f: Faq) -> dict:
    return {
        "id": f.id,
        "question": f.question,
        "answer": f.answer,
        "category": f.category,
        "position": f.position,
        "featured": f.featured,
        "published": f.published,
    }


def public_testimonials(db: Session) -> list[dict]:
    rows = db.scalars(select(Testimonial).where(Testimonial.published.is_(True)).order_by(Testimonial.featured.desc())).all()
    return [testimonial_payload(t) for t in rows]


def public_faqs(db: Session) -> list[dict]:
    rows = db.scalars(select(Faq).where(Faq.published.is_(True)).order_by(Faq.position)).all()
    return [faq_payload(f) for f in rows]


def upsert_testimonial(db: Session, data: TestimonialIn, obj: Testimonial | None = None) -> Testimonial:
    obj = obj or Testimonial()
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.add(obj)
    db.flush()
    bump_version(db)
    return obj


def upsert_faq(db: Session, data: FaqIn, obj: Faq | None = None) -> Faq:
    obj = obj or Faq()
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.add(obj)
    db.flush()
    bump_version(db)
    return obj


def create_inquiry(db: Session, *, name: str, email: str, phone: str | None, topic: str, message: str) -> Inquiry:
    inquiry = Inquiry(name=name, email=email.lower(), phone=phone, topic=topic, message=message)
    db.add(inquiry)
    db.flush()
    return inquiry


def content_version(db: Session) -> str:
    biz = db.get(BusinessSettings, BUSINESS_ID)
    version = biz.content_version if biz else 0
    max_page = db.scalar(select(func.max(CmsPage.published_at)))
    digest = hashlib.sha256(f"{version}:{iso(max_page)}".encode()).hexdigest()[:12]
    return digest


def invalidate(db: Session) -> None:
    bump_version(db)


def page_not_found(slug: str) -> NotFound:
    return NotFound(f"Page '{slug}' not found")


def _json(value) -> str:  # pragma: no cover - defensive
    return json.dumps(value, default=str)
