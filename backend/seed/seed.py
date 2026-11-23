"""Idempotent Business PRO demo seed.

Usage from repository root:
    PYTHONPATH=backend python backend/seed/seed.py

The seed never creates an Owner account or a live payment credential. It is
safe to run repeatedly: stable UUIDs, SKUs and slugs are upserted.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

_file_root = Path(__file__).resolve()
_repo_root = _file_root.parents[2]
# Source checkout: <repo>/backend/seed/seed.py. Docker image: /app/seed/seed.py.
ROOT = _repo_root if (_repo_root / "src").exists() else _file_root.parents[1]
_BACKEND = ROOT / "backend" if (ROOT / "backend").exists() else ROOT
sys.path.insert(0, str(_BACKEND))

from sqlalchemy import select  # noqa: E402

from app.core.db import session_scope  # noqa: E402
from app.models import (  # noqa: E402
    BlackoutDate,
    BusinessSettings,
    Collection,
    DeliveryWindow,
    DeliveryZone,
    EmailTemplate,
    Faq,
    MediaAsset,
    Product,
    ProductImage,
    ProductVariant,
    Testimonial,
    CmsPage,
)

_catalog_candidates = [ROOT / "backend" / "seed" / "catalog.json", ROOT / "seed" / "catalog.json"]
CATALOG = next((candidate for candidate in _catalog_candidates if candidate.exists()), _catalog_candidates[-1])
NAMESPACE = "https://bloeme-floral.example/seed/"


def sid(kind: str, value: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"{NAMESPACE}{kind}/{value}"))


def stable(kind: str, value: str) -> dict:
    return {"id": sid(kind, value)}


def load() -> dict:
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def get_or_create(db, model, identity: dict, values: dict):
    obj = db.scalar(select(model).filter_by(**identity))
    if obj is None:
        obj = model(**identity, **values)
        db.add(obj)
        db.flush()
    else:
        for key, value in values.items():
            setattr(obj, key, value)
    return obj


def seed_business(db) -> None:
    get_or_create(
        db,
        BusinessSettings,
        {"id": "business"},
        {
            "company_name": "Bloomé Floral",
            "wordmark": "BLOOMÉ",
            "tagline": "Flowers, Beautifully Told.",
            "short_description": "A Parisian-inspired floral atelier in Arcadia, California.",
            "colors": {"background": "#FAF7F2", "primary": "#581F32", "secondary": "#D8A7AD", "accent": "#C6A66B", "text": "#292426"},
            "typography": {"heading": "Cormorant Garamond", "body": "DM Sans"},
            "contact": {"phone": "(415) 555-0184", "email": "atelier@bloemefloral.com", "address": "118 Rue des Jardins, Arcadia, CA 94107"},
            "store_hours": [
                {"day": 0, "label": "Sunday", "closed": True},
                {"day": 1, "label": "Monday", "opens": "10:00", "closes": "18:00"},
                {"day": 2, "label": "Tuesday", "opens": "10:00", "closes": "18:00"},
                {"day": 3, "label": "Wednesday", "opens": "10:00", "closes": "18:00"},
                {"day": 4, "label": "Thursday", "opens": "10:00", "closes": "19:00"},
                {"day": 5, "label": "Friday", "opens": "09:00", "closes": "19:00"},
                {"day": 6, "label": "Saturday", "opens": "09:00", "closes": "18:00"},
            ],
            "social": [{"platform": "instagram", "url": "https://instagram.com"}],
            "policies": {"demo": "This seed contains fictional demo content."},
            "seo": {"title": "Bloomé Floral — Flowers, Beautifully Told.", "description": "A luxury floral atelier."},
            "payments_mode": "demo",
        },
    )


def seed_catalog(db, data: dict) -> None:
    collections = {}
    for item in data["collections"]:
        obj = get_or_create(
            db,
            Collection,
            {"id": sid("collection", item["slug"])},
            {
                "slug": item["slug"], "name": item["name"], "tagline": item["tagline"], "description": item["description"],
                "story": item.get("story", []), "hero_image_url": item.get("heroImageUrl"), "palette_name": item.get("paletteName", ""),
                "position": item.get("position", 0), "featured": item.get("featured", False), "published": True,
                "seo_title": item.get("seoTitle", ""), "seo_description": item.get("seoDescription", ""),
            },
        )
        collections[item["slug"]] = obj

    for item in data["products"]:
        collection = collections[item["collection"]]
        obj = get_or_create(
            db,
            Product,
            {"id": sid("product", item["slug"])},
            {
                "collection_id": collection.id, "sku": item["sku"], "name": item["name"], "slug": item["slug"],
                "short_description": item["shortDescription"], "description": item["description"],
                "base_price_cents": item["basePriceCents"], "compare_at_price_cents": item.get("compareAtPriceCents"),
                "category_tags": item.get("categoryTags", []), "color_palette": item.get("colorPalette", []), "flower_types": item.get("flowerTypes", []),
                "dimensions": item.get("dimensions", {}), "vase_included": item.get("vaseIncluded", False), "care_instructions": item.get("careInstructions", []),
                "status": "active", "featured": item.get("featured", False), "bestseller": item.get("bestseller", False), "new_arrival": item.get("newArrival", False),
                "seo_title": item.get("seoTitle", ""), "seo_description": item.get("seoDescription", ""),
            },
        )
        for image in item.get("images", []):
            get_or_create(db, ProductImage, {"id": sid("image", f"{item['slug']}:{image['position']}")}, {"product_id": obj.id, "src": image["src"], "alt": image.get("alt", item["name"]), "position": image["position"]})
        for variant in item.get("variants", []):
            get_or_create(
                db,
                ProductVariant,
                {"id": sid("variant", variant["sku"])},
                {
                    "product_id": obj.id, "size": variant["size"], "label": variant["label"], "stems": variant.get("stems", ""),
                    "description": variant.get("description", ""), "price_cents": variant["priceCents"], "compare_at_price_cents": variant.get("compareAtPriceCents"),
                    "sku": variant["sku"], "stock_qty": variant.get("stockQty", 0), "in_stock": variant.get("inStock", True), "position": {"classic": 0, "deluxe": 1, "grand": 2}[variant["size"]],
                },
            )


def seed_editorial(db, data: dict) -> None:
    for t in data.get("testimonials", []):
        values = {
            "quote": t["quote"], "author": t["author"], "initials": t.get("initials", ""), "location": t.get("location", ""),
            "occasion": t.get("occasion", ""), "rating": t.get("rating", 5), "is_sample": t.get("isSample", False),
            "featured": t.get("featured", False), "published": True,
        }
        get_or_create(db, Testimonial, {"id": sid("testimonial", t["author"] + t["quote"][:16])}, values)
    for f in data.get("faqs", []):
        values = {"question": f["question"], "answer": f["answer"], "category": f.get("category", "ordering"), "position": f.get("position", 0), "featured": f.get("featured", False), "published": True}
        get_or_create(db, Faq, {"id": sid("faq", f["question"])}, values)
    for z in data.get("deliveryZones", []):
        get_or_create(
            db, DeliveryZone, {"id": sid("zone", z["slug"])},
            {"slug": z["slug"], "name": z["name"], "region": z["region"], "postal_codes": ",".join(z["postalCodes"]),
             "same_day_available": z["sameDayAvailable"], "cutoff_time": z["cutoffTime"], "standard_fee_cents": z["standardFeeCents"],
             "express_fee_cents": z["expressFeeCents"], "same_day_fee_cents": z["sameDayFeeCents"], "minimum_order_cents": z["minimumOrderCents"],
             "standard_lead_hours": z["standardLeadHours"], "notes": z.get("notes", ""), "position": len(z.get("postalCodes", []))},
        )
    for w in data.get("deliveryWindows", []):
        get_or_create(
            db, DeliveryWindow, {"id": sid("window", w["slug"])},
            {"slug": w["slug"], "name": w["name"], "description": w.get("description", ""), "start_time": "09:00", "end_time": "17:00",
             "surcharge_cents": w.get("surchargeCents", 0), "same_day_only": w.get("sameDayOnly", False), "capacity": 25, "position": w.get("position", 0)},
        )
    pages = {"home": "Home", "about": "About", "delivery": "Delivery", "contact": "Contact"}
    for slug, title in pages.items():
        get_or_create(db, CmsPage, {"id": sid("page", slug)}, {"slug": slug, "title": title, "draft_sections": [], "published_sections": [], "draft_hero": {}, "published_hero": {}, "revision": 1})
    from app.services.email import seed_templates
    seed_templates(db)


def main() -> None:
    data = load()
    with session_scope() as db:
        from sqlalchemy import inspect

        from app.core.config import settings
        from app.core.db import Base, engine

        inspector = inspect(engine)
        if not inspector.has_table("business_settings"):
            if settings.is_production:
                raise SystemExit("Run `alembic upgrade head` before seeding a production database")
            import app.models  # noqa: F401

            Base.metadata.create_all(engine)
        seed_business(db)
        seed_catalog(db, data)
        seed_editorial(db, data)
    print(f"Seeded {len(data['collections'])} collections, {len(data['products'])} products, {len(data['deliveryZones'])} delivery zones")


if __name__ == "__main__":
    main()
