# Bloomé Floral Business PRO deployment

## Docker (recommended)

1. Copy `.env.example` to `.env` and set a long random `SECRET_KEY` and a unique PostgreSQL password.
2. Set `ENVIRONMENT=production`, `COOKIE_SECURE=true`, explicit `TRUSTED_ORIGINS`, and `PAYMENTS_MODE=disabled` or `stripe`.
3. Start with `docker compose up --build`.
4. Run the owner setup once at `POST /api/v1/auth/setup`; do not seed an owner password.
5. Put TLS/reverse proxy in front of the API and serve the Vite storefront from the same trusted origin.

The container runs Alembic migrations and the idempotent demo seed. For a production catalog, omit the seed command after the initial empty install and use the admin CMS.

## Manual

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
export DATABASE_URL='postgresql+psycopg://...'
PYTHONPATH=backend python -m alembic upgrade head
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Production requirements should add `argon2-cffi` (the app prefers Argon2id when installed). The offline development fallback is scrypt; it is not a claim of Argon2id availability.

## Stripe

Set `PAYMENTS_MODE=stripe`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Configure Stripe to POST events to `/api/v1/webhooks/stripe`. The server verifies timestamped signatures and idempotently records event IDs. Never mark orders paid from a browser return URL.

## SMTP

Set `SMTP_ENABLED=true` plus host, port, credentials and `SMTP_FROM`. Email logs report `sent`, `failed` or `skipped`; the app never claims delivery for an unconfigured or failed SMTP send.
