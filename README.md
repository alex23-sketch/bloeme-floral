# BLOOMÉ FLORAL

Premium luxury florist website template — Standard edition.

> **Demo content:** every product, price, delivery zone, testimonial and order in this milestone is fictional sample content. The checkout is intentionally a demo and never collects payment or submits an order.

## Run locally

```bash
npm install
npm run dev
```

The template is built with React, Vite, TypeScript and Tailwind CSS v4. The current local preview uses Vite's automatic port fallback when the default port is occupied.

Quality commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

## Implemented in Milestone 1

- Home: cinematic editorial hero, featured arrangements, six collection rail, atelier story, sample testimonials and CTA.
- Shop: search, collection and occasion filters, price bands, sorting, empty state and responsive product grid.
- Collections: all six collection index and detail pages.
- Product details: three sizes, size-specific pricing, availability, inventory messaging, gallery, personalization, delivery date, quantity and cart actions.
- About: brand story, floral craft, sustainability, team and history.
- Delivery: five zones, ZIP checker, service windows, policies, care guide and FAQ accordion.
- Contact: validated form, topic routing, honeypot, consent, studio address and hours.
- Checkout: delivery date, ZIP zone selection, delivery option, gift message, order summary and clearly marked demo-only completion.
- Shopping cart: localStorage persistence, add/merge/remove, quantity limits, cart drawer, gift message, hide-prices option and totals.
- Accessibility basics: skip link, visible focus, semantic landmarks, labelled controls, live regions, accordion semantics, keyboard-friendly overlays and reduced-motion handling.
- SEO basics: per-route title/description/canonical, Open Graph metadata and product/organization JSON-LD.

## Central content architecture

- `src/types/content.ts` — API/CMS-ready TypeScript contracts for `BrandSettings`, `NavigationItem`, `PageContent`, `HeroSection`, `Product`, `ProductVariant`, `Collection`, `CartItem`, `Customer`, `DeliveryZone`, `DeliveryOption`, `Order`, `OrderItem`, `ContactSubmission`, `Testimonial`, `FAQ` and `SEOSettings`.
- `src/schemas/validation.ts` — Zod edge validation for catalog, contact, checkout, cart and orders.
- `src/data/brand.ts` — brand settings, navigation, contact, store hours, delivery zones, testimonials, FAQs and SEO defaults.
- `src/data/collections.ts` — six editable collections.
- `src/data/products.ts` — exactly 36 products, six per collection, each with three size variants and three art slots.
- `src/data/content.ts` — homepage and About page editorial content.
- `src/data/index.ts` — single data barrel for UI imports.

The data shapes are resource-oriented and use integer cents, stable IDs/SKUs/slugs, timestamps, inventory and explicit variants. Business PRO can replace the local data barrel with API selectors backed by PostgreSQL and an admin CMS; the UI contracts remain the same. Premium Full System can consume the same API resource shapes from React Native/Expo.

## Imagery and typography

The sandbox cannot use external image or font requests, so the Standard demo includes a deterministic botanical SVG art system in `src/components/ui/FloralArt.tsx`. Product data uses `art://<palette>/<variant>/<seed>/<frame>` URLs. `MediaFrame` resolves those to the built-in artwork and renders normal `<img>` elements for any real URL supplied later. This means a resale buyer can replace the art URLs with licensed studio photography without changing components.

The CSS uses the requested Cormorant Garamond / DM Sans roles with an editorial system fallback stack (`Iowan Old Style`, `Palatino`, `Didot`, `Georgia` and platform sans). See `public/fonts/README.md` for self-hosting guidance.

## Future editions

### Business PRO

- Replace local data exports with authenticated API resource hooks.
- Add PostgreSQL tables matching `src/types/content.ts`.
- Add CMS editing for brand settings, navigation, pages, collections, products, inventory and SEO.
- Persist contact submissions, customers and orders server-side.
- Add real payment and transactional email only in the production edition, with server-side validation and provider webhooks.

### Premium Full System

- Reuse the same Business PRO API, PostgreSQL database and CMS.
- Add React Native/Expo screens that consume the same catalog, inventory, content, customer and order resources.
- Keep brand/product/content IDs and API responses shared between web and mobile.
- Add push notifications and native delivery tracking through the shared order resource.

No backend, payment integration or mobile application is included in Standard Milestone 1 by design.
