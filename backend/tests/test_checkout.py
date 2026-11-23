"""Checkout, delivery, inventory and payment-contract regression tests."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select

from app.models import Order, ProductVariant


def next_delivery_date():
    d = date.today() + timedelta(days=1)
    while d.weekday() == 6:
        d += timedelta(days=1)
    return d


def seed(client, db):
    from pathlib import Path
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
    from seed.seed import load, seed_business, seed_catalog, seed_editorial

    data = load()
    seed_business(db)
    seed_catalog(db, data)
    seed_editorial(db, data)
    db.commit()
    product = db.scalar(select(ProductVariant).where(ProductVariant.size == "classic"))
    zone = db.execute(select(__import__("app.models", fromlist=["DeliveryZone"]).DeliveryZone)).scalars().first()
    window = db.execute(select(__import__("app.models", fromlist=["DeliveryWindow"]).DeliveryWindow)).scalars().first()
    return product, zone, window


def test_quote_is_server_calculated(client, db):
    variant, zone, window = seed(client, db)
    response = client.post(
        "/api/v1/quote",
        json={"lines": [{"variant_id": variant.id, "quantity": 1}]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["subtotal_cents"] == variant.price_cents
    assert body["total_cents"] >= body["subtotal_cents"]


def test_guest_checkout_creates_order_and_decrements_stock(client, db):
    variant, zone, window = seed(client, db)
    start_stock = variant.stock_qty
    payload = {
        "customer": {"first_name": "Test", "last_name": "Recipient", "email": "guest@example.com", "phone": "4155550199"},
        "recipient": {"name": "Test Recipient", "line1": "1 Petal Lane", "line2": "", "city": "Arcadia", "state": "CA", "postal_code": "94107"},
        "lines": [{"variant_id": variant.id, "quantity": 1}],
        "delivery_date": next_delivery_date().isoformat(),
        "window_id": window.id,
        "gift_message": "For QA",
        "client_subtotal_cents": variant.price_cents,
        "consent": True,
    }
    response = client.post("/api/v1/checkout", json=payload, headers={"Idempotency-Key": "qa-order-001"})
    assert response.status_code == 201, response.text
    order = response.json()
    assert order["number"].startswith("BLO-")
    assert order["status"] == "pending"
    db.expire_all()
    assert db.get(ProductVariant, variant.id).stock_qty == start_stock - 1


def test_duplicate_checkout_is_idempotent(client, db):
    variant, zone, window = seed(client, db)
    payload = {
        "customer": {"first_name": "Idem", "last_name": "Test", "email": "idem@example.com", "phone": "4155550199"},
        "recipient": {"name": "Idem Test", "line1": "1 Petal Lane", "line2": "", "city": "Arcadia", "state": "CA", "postal_code": "94107"},
        "lines": [{"variant_id": variant.id, "quantity": 1}],
        "delivery_date": next_delivery_date().isoformat(),
        "window_id": window.id,
        "client_subtotal_cents": variant.price_cents,
        "consent": True,
    }
    headers = {"Idempotency-Key": "qa-order-idempotent"}
    first = client.post("/api/v1/checkout", json=payload, headers=headers)
    second = client.post("/api/v1/checkout", json=payload, headers=headers)
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]


def test_tampered_client_price_is_rejected(client, db):
    variant, zone, window = seed(client, db)
    payload = {
        "customer": {"first_name": "Tamper", "last_name": "Test", "email": "tamper@example.com", "phone": "4155550199"},
        "recipient": {"name": "Tamper Test", "line1": "1 Petal Lane", "line2": "", "city": "Arcadia", "state": "CA", "postal_code": "94107"},
        "lines": [{"variant_id": variant.id, "quantity": 1}],
        "delivery_date": next_delivery_date().isoformat(),
        "window_id": window.id,
        "client_subtotal_cents": 1,
        "consent": True,
    }
    assert client.post("/api/v1/checkout", json=payload).status_code == 409
