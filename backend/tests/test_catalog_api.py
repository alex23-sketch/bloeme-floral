"""Backend regression coverage for catalog, checkout, delivery, auth and CMS."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest


@pytest.fixture()
def seeded_db(db):
    root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(root / "backend"))
    from seed.seed import load, seed_business, seed_catalog, seed_editorial

    data = load()
    seed_business(db)
    seed_catalog(db, data)
    seed_editorial(db, data)
    db.commit()
    return db


@pytest.fixture()
def owner(client):
    response = client.post(
        "/api/v1/auth/setup",
        json={"email": "owner@bloeme.example", "name": "Owner", "password": "correct-horse-battery"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return {"csrf": body["csrf_token"], "cookies": response.cookies, "user": body["user"]}


def csrf(owner):
    return {"X-CSRF-Token": owner["csrf"]}


class TestPublicCatalog:
    def test_site_returns_brand_and_pages(self, client, seeded_db):
        response = client.get("/api/v1/site")
        assert response.status_code == 200
        body = response.json()
        assert body["settings"]["company_name"] == "Bloomé Floral"
        assert body["settings"]["tagline"] == "Flowers, Beautifully Told."
        assert "home" in {page["slug"] for page in body["pages"]}

    def test_products_are_complete_and_searchable(self, client, seeded_db):
        products = client.get("/api/v1/products").json()
        assert len(products) == 36
        assert len({product["sku"] for product in products}) == 36
        assert all(len(product["variants"]) == 3 for product in products)
        assert all(len(product["images"]) >= 2 for product in products)
        result = client.get("/api/v1/products", params={"q": "peony"})
        assert result.status_code == 200
        assert result.json()

    def test_collections_are_six(self, client, seeded_db):
        collections = client.get("/api/v1/collections").json()
        assert len(collections) == 6
        assert all(item["product_count"] == 6 for item in collections)

    def test_etag_is_present(self, client, seeded_db):
        response = client.get("/api/v1/products")
        assert response.headers.get("etag")


class TestAuthenticationAndAuthorization:
    def test_setup_is_one_time_and_logout_revokes_session(self, client, owner):
        duplicate = client.post(
            "/api/v1/auth/setup",
            json={"email": "second@bloeme.example", "name": "Second", "password": "correct-horse-battery"},
        )
        assert duplicate.status_code == 409
        client.cookies.update(owner["cookies"])
        assert client.get("/api/v1/auth/me").status_code == 200
        assert client.post("/api/v1/auth/logout", headers=csrf(owner)).status_code == 200
        assert client.get("/api/v1/auth/me").status_code == 401

    def test_short_password_rejected(self, client):
        response = client.post(
            "/api/v1/auth/setup",
            json={"email": "owner@bloeme.example", "name": "Owner", "password": "short"},
        )
        assert response.status_code in (400, 422)

    def test_csrf_is_required_for_mutation(self, client, owner, seeded_db):
        client.cookies.update(owner["cookies"])
        response = client.patch("/api/v1/admin/settings", json={"tagline": "Tampered"})
        assert response.status_code == 403


class TestAdminCatalogAndCms:
    def test_product_crud_and_publish(self, client, owner, seeded_db):
        client.cookies.update(owner["cookies"])
        collection = client.get("/api/v1/collections").json()[0]
        payload = {
            "name": "Admin Test Bouquet",
            "collection_id": collection["id"],
            "short_description": "A test arrangement.",
            "description": "A complete test arrangement.",
            "images": [{"src": "art://blush/rose/test/full", "alt": "Test art", "position": 0}],
            "variants": [
                {"size": "classic", "label": "Classic", "price_cents": 6000, "stock_qty": 4, "sku": "TEST-CLASSIC"},
                {"size": "deluxe", "label": "Deluxe", "price_cents": 8000, "stock_qty": 3, "sku": "TEST-DELUXE"},
                {"size": "grand", "label": "Grand", "price_cents": 10000, "stock_qty": 2, "sku": "TEST-GRAND"},
            ],
        }
        created = client.post("/api/v1/admin/products", json=payload, headers=csrf(owner))
        assert created.status_code == 201, created.text
        product_id = created.json()["id"]
        published = client.post(f"/api/v1/admin/products/{product_id}/publish", headers=csrf(owner))
        assert published.status_code == 200, published.text
        assert published.json()["status"] == "active"

    def test_cms_draft_publish(self, client, owner, seeded_db):
        client.cookies.update(owner["cookies"])
        update = client.patch(
            "/api/v1/admin/pages/home",
            json={"title": "Edited home", "sections": [{"id": "hero", "kind": "hero", "heading": "New heading"}]},
            headers=csrf(owner),
        )
        assert update.status_code == 200, update.text
        publish = client.post("/api/v1/admin/pages/home/publish", json={"note": "QA publish"}, headers=csrf(owner))
        assert publish.status_code == 200, publish.text
        public = client.get("/api/v1/site").json()
        assert any(page["title"] == "Edited home" for page in public["pages"])
