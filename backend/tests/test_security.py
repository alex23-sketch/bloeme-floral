"""Security boundaries: webhook verification, safe upload, delivery validation,
concurrent oversell guard and role enforcement."""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from datetime import date, timedelta

from sqlalchemy import select

from app.core.config import settings
from app.core.security import verify_webhook_signature
from app.services.media import UnsafeUpload, validate_upload
from app.services.payments import handle_event
from app.models import ProductVariant, Payment  # noqa: F401  (used in helpers)



def next_delivery_date():
    d = date.today() + timedelta(days=1)
    while d.weekday() == 6:
        d += timedelta(days=1)
    return d

def _seed(client, db):
    from pathlib import Path
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
    from seed.seed import load, seed_business, seed_catalog, seed_editorial

    data = load()
    seed_business(db)
    seed_catalog(db, data)
    seed_editorial(db, data)
    db.commit()
    variant = db.scalar(select(ProductVariant).where(ProductVariant.size == "classic"))
    from app.models import DeliveryZone, DeliveryWindow

    zone = db.scalar(select(DeliveryZone))
    window = db.scalar(select(DeliveryWindow))
    return variant, zone, window


def _checkout_payload(variant, zone, window):
    return {
        "customer": {"first_name": "Sec", "last_name": "Test", "email": "sec@example.com", "phone": "4155550199"},
        "recipient": {"name": "Sec Test", "line1": "1 Petal Lane", "line2": "", "city": "Arcadia", "state": "CA", "postal_code": "94107"},
        "lines": [{"variant_id": variant.id, "quantity": 1}],
        "delivery_date": next_delivery_date().isoformat(),
        "window_id": window.id,
        "client_subtotal_cents": variant.price_cents,
        "consent": True,
    }


class TestWebhookSecurity:
    def test_signature_verification_rejects_forged_and_stale(self):
        payload = b'{"id":"evt_1","type":"checkout.session.completed"}'
        secret = "whsec_test"
        timestamp = str(int(time.time()))
        signed = f"{timestamp}." + payload.decode()
        valid = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
        assert verify_webhook_signature(payload, f"t={timestamp},v1={valid}", secret) is True
        assert verify_webhook_signature(payload, f"t={timestamp},v1={'0' * 64}", secret) is False
        stale = str(int(time.time()) - 3600)
        stale_sig = hmac.new(secret.encode(), (stale + "." + payload.decode()).encode(), hashlib.sha256).hexdigest()
        assert verify_webhook_signature(payload, f"t={stale},v1={stale_sig}", secret) is False

    def test_stripe_endpoint_rejects_unconfigured_and_bad_sig(self, client):
        assert client.post("/api/v1/webhooks/stripe", content=b"{}", headers={"Stripe-Signature": "t=1,v1=x"}).status_code in (400, 503)

    def test_verified_event_marks_order_paid_once(self, client, db):
        variant, zone, window = _seed(client, db)
        order = client.post("/api/v1/checkout", json=_checkout_payload(variant, zone, window)).json()
        event = {
            "id": "evt_checkout_0001",
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_test", "client_reference_id": order["id"], "metadata": {"order_id": order["id"]}}},
        }
        first = handle_event(db, event=event, event_id=event["id"], event_type=event["type"])
        assert first["status"] == "processed"
        result = handle_event(db, event=event, event_id=event["id"], event_type=event["type"])
        assert result["status"] == "duplicate"
        db.commit()
        from app.models import Order

        fresh = db.get(Order, order["id"])
        assert fresh.payment_status == "paid"
        assert fresh.status == "paid"


class TestMediaUpload:
    def test_rejects_html_and_scripted_svg(self):
        try:
            validate_upload(b"<html><body>hi</body></html>", "text/html", "evil.html")
        except UnsafeUpload:
            pass
        else:
            raise AssertionError("HTML upload should be rejected")

        svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        try:
            validate_upload(svg, "image/svg+xml", "evil.svg")
        except UnsafeUpload:
            pass
        else:
            raise AssertionError("Scripted SVG should be rejected")

    def test_accepts_clean_raster(self):
        png = b"\x89PNG\r\n\x1a\n" + (13).to_bytes(4, "big") + b"IHDR" + (123).to_bytes(4, "big") + (456).to_bytes(4, "big") + b"\x08\x06\x00\x00\x00" + b"\x00" * 64
        image = validate_upload(png, "image/png", "flower.png")
        assert image.width == 123
        assert image.height == 456


class TestDeliveryValidation:
    def test_invalid_zip_rejected(self, client, db):
        from seed.seed import load, seed_business, seed_catalog, seed_editorial
        data = load(); seed_business(db); seed_catalog(db, data); seed_editorial(db, data); db.commit()
        from app.models import DeliveryZone, DeliveryWindow, ProductVariant
        from sqlalchemy import select
        variant = db.scalar(select(ProductVariant).where(ProductVariant.size == "classic"))
        window = db.scalar(select(DeliveryWindow))
        payload = {
            "customer": {"first_name": "Sec", "last_name": "Test", "email": "sec@example.com", "phone": "4155550199"},
            "recipient": {"name": "Sec Test", "line1": "1 Petal Lane", "line2": "", "city": "Arcadia", "state": "CA", "postal_code": "00000"},
            "lines": [{"variant_id": variant.id, "quantity": 1}],
            "delivery_date": next_delivery_date().isoformat(),
            "window_id": window.id,
            "client_subtotal_cents": variant.price_cents,
            "consent": True,
        }
        response = client.post("/api/v1/checkout", json=payload)
        assert response.status_code == 400

    def test_sunday_is_blocked(self, db):
        from seed.seed import load, seed_business, seed_catalog, seed_editorial
        data = load(); seed_business(db); seed_catalog(db, data); seed_editorial(db, data); db.commit()
        from app.models import DeliveryZone, DeliveryWindow
        from sqlalchemy import select
        zone = db.scalar(select(DeliveryZone)); window = db.scalar(select(DeliveryWindow))
        sunday = date.today() + timedelta(days=(6 - date.today().weekday()) % 7)
        from app.core.errors import Conflict
        from app.services import delivery
        try:
            delivery.validate_date(db, sunday, zone, window)
        except Conflict:
            pass
        else:
            raise AssertionError("Sunday delivery should be blocked")

class TestAuthorization:
    def test_staff_cannot_create_products(self, client, db):
        from pathlib import Path
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
        owner_response = client.post("/api/v1/auth/setup", json={"email": "owner@example.com", "name": "Owner", "password": "correct-horse-battery"})
        assert owner_response.status_code == 201
        owner = owner_response.json()
        client.cookies.update(owner_response.cookies)
        created = client.post("/api/v1/admin/users", headers={"X-CSRF-Token": owner["csrf_token"]}, json={"email":"staff@example.com","name":"Staff","password":"correct-horse-battery","role":"staff"})
        assert created.status_code == 200, created.text
        client.post("/api/v1/auth/logout", headers={"X-CSRF-Token": owner["csrf_token"]})
        logged = client.post("/api/v1/auth/login", json={"email":"staff@example.com","password":"correct-horse-battery"})
        assert logged.status_code == 200, logged.text
        client.cookies.update(logged.cookies)
        # Staff may read products but cannot mutate catalog.
        response = client.post("/api/v1/admin/products", headers={"X-CSRF-Token": logged.json()["csrf_token"]}, json={"name":"Nope","collection_id":"missing","variants":[]})
        assert response.status_code == 403
