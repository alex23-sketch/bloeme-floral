# Business PRO installation and API contract

Business PRO is the existing React storefront plus the FastAPI service, PostgreSQL schema and admin CMS. Standard mode remains backend-free and continues using its local demo catalog/cart.

## API

- OpenAPI: `/docs` in development
- Versioned prefix: `/api/v1`
- Public resources: `/site`, `/products`, `/collections`, `/search`, `/quote`, `/delivery/availability`, `/calendar`
- Commerce: `/checkout`, `/checkout/{order_id}/pay`, `/orders/{number}`
- Auth: `/auth/setup`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/password`
- Admin: `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/pages`, `/admin/settings`, `/admin/inventory/low-stock`, `/admin/audit` and related resources
- Webhooks: `/webhooks/stripe`

The web storefront and future Expo application must use this same API, identifiers, database and CMS. Do not create a second mobile backend.

## First owner

Owner setup is one-time. Use a unique long password, then rotate it from Account Settings. Sessions are HttpOnly cookies; mutation routes require the CSRF token returned by login/setup.

## CMS publishing

Pages keep draft JSON plus published JSON and immutable revisions. Publishing bumps `content_version`, which appears in public ETags and lets web/mobile clients refresh without rebuilding.

## Seed data

`backend/seed/catalog.json` is generated from the canonical M1 TypeScript catalog with `node scripts/export-catalog.mjs`. `PYTHONPATH=backend python backend/seed/seed.py` is idempotent and preserves 36 products, six collections, 108 variants, testimonials, FAQs and delivery zones.
