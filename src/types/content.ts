/**
 * BLOOMÉ FLORAL — Content & catalog schemas.
 *
 * These are the canonical TypeScript contracts shared by:
 *   • the Standard web template (demo data lives in `src/data/*`)
 *   • Business PRO (PostgreSQL + admin CMS — the API returns exactly these shapes)
 *   • Premium Full System (React Native / Expo app consuming the same API)
 *
 * Keep this file free of UI imports. Every entity carries `id` and, where it is
 * addressable, a `slug`, plus ISO-8601 timestamps so it maps 1:1 onto DB rows.
 */

/* ------------------------------------------------------------------ utilities */

/** ISO-8601 date-time string, e.g. "2026-09-01T14:30:00.000Z" */
export type ISODateString = string;

/** Money is always stored as integer **cents** (USD) to avoid float errors. */
export type Cents = number;

/** URL-safe identifier, lowercase, hyphenated. */
export type Slug = string;

export type HexColor = `#${string}`;

export type ImageAsset = {
  /** Absolute URL or path relative to `/public`. */
  src: string;
  /** Concise alternative text describing the visual content. */
  alt: string;
  /** Intrinsic aspect ratio as `width / height`, used to reserve layout space. */
  aspect?: number;
  /** Optional art-direction hint consumed by the mobile app. */
  focus?: 'center' | 'top' | 'bottom';
  /** Original creator, required for resale licensing attribution. */
  credit?: string;
};

/* ------------------------------------------------------------------ brand */

export type SocialPlatform = 'instagram' | 'pinterest' | 'facebook' | 'tiktok';

export type BrandSettings = {
  id: string;
  name: string;
  wordmark: string;
  tagline: string;
  shortDescription: string;
  market: string;
  currency: 'USD';
  locale: string;
  colors: {
    background: HexColor;
    primary: HexColor;
    secondary: HexColor;
    accent: HexColor;
    text: HexColor;
  };
  typography: {
    heading: string;
    body: string;
    /** Self-hosted stylesheet path or licensed CDN URL; null uses the system stack. */
    stylesheetUrl: string | null;
  };
  logo: {
    /** Vector mark used in the header/footer. */
    mark: ImageAsset | null;
    /** Full lockup for invoices, emails and app splash. */
    lockup: ImageAsset | null;
  };
  /** Approved motif for loading, placeholders and app chrome. */
  motif: 'arch' | 'circle' | 'square';
  social: { platform: SocialPlatform; url: string }[];
  /** Set once on the backend; drives cache invalidation and mobile updates. */
  updatedAt: ISODateString;
};

/* ------------------------------------------------------------------ navigation & pages */

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  /** Secondary menu rendered inside a panel / drawer. */
  children?: NavigationItem[];
  /** Opens in a new tab. */
  external?: boolean;
  /** Hidden from navigation but kept resolvable (e.g. checkout). */
  hidden?: boolean;
  order: number;
};

export type CallToAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'text';
};

export type HeroSection = {
  id: string;
  /** Editorial headline lines — each renders as its own display line. */
  headline: string[];
  /** Italic emphasis rendered beneath the headline. */
  emphasis?: string;
  subheading: string;
  body?: string;
  primaryCta: CallToAction;
  secondaryCta?: CallToAction;
  media: ImageAsset;
  /** Small floating proof-note shown over the hero art. */
  badge?: { title: string; caption: string };
  /** Campaign scheduling for the CMS. */
  startsAt?: ISODateString;
  endsAt?: ISODateString;
};

export type ContentBlock =
  | { type: 'richText'; heading?: string; paragraphs: string[] }
  | { type: 'imagePair'; images: [ImageAsset, ImageAsset]; caption?: string }
  | { type: 'pullQuote'; quote: string; attribution?: string }
  | { type: 'statRow'; stats: { value: string; label: string }[] }
  | { type: 'featureList'; items: { title: string; body: string }[] };

export type PageSection = {
  id: string;
  /** Stable key used by the web + mobile renderers to select a layout. */
  kind:
    | 'hero'
    | 'intro'
    | 'content'
    | 'featuredProducts'
    | 'collections'
    | 'testimonials'
    | 'cta'
    | 'faq'
    | 'contact'
    | 'deliveryZones'
    | 'team';
  heading?: string;
  eyebrow?: string;
  body?: string;
  blocks?: ContentBlock[];
  /** Links to catalog entities referenced by this section. */
  refs?: { products?: string[]; collections?: string[] };
  order: number;
  visible: boolean;
};

export type PageContent = {
  id: string;
  slug: Slug;
  title: string;
  seoTitle: string;
  seoDescription: string;
  hero?: HeroSection;
  sections: PageSection[];
  published: boolean;
  updatedAt: ISODateString;
};

/* ------------------------------------------------------------------ catalog */

export type CollectionId =
  | 'signature-roses'
  | 'birthday-flowers'
  | 'wedding-romance'
  | 'sympathy-remembrance'
  | 'seasonal-blooms'
  | 'luxury-arrangements';

export const COLLECTION_IDS = [
  'signature-roses',
  'birthday-flowers',
  'wedding-romance',
  'sympathy-remembrance',
  'seasonal-blooms',
  'luxury-arrangements',
] as const satisfies readonly CollectionId[];

export type VariantSizeId = 'classic' | 'deluxe' | 'grand';

export const VARIANT_SIZE_IDS = ['classic', 'deluxe', 'grand'] as const satisfies readonly VariantSizeId[];

export type ProductVariant = {
  id: string;
  size: VariantSizeId;
  /** Display label — "Classic", "Deluxe", "Grand". */
  label: string;
  /** e.g. "12 stems", "18 stems · hand-tied". */
  stems: string;
  description: string;
  priceCents: Cents;
  compareAtPriceCents: Cents | null;
  sku: string;
  /** Units on hand. Business PRO decrements on order. */
  inventory: number;
  /** Authoritative status derived from inventory on the server. */
  inStock: boolean;
};

export type ProductImage = ImageAsset & {
  /** Gallery ordering. */
  order: number;
  /** Optional colour-swatch alignment for the bundle. */
  swatch?: HexColor;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: Slug;
  shortDescription: string;
  description: string;
  /** Base price = Classic variant. Kept denormalised for list views & sorting. */
  priceCents: Cents;
  compareAtPriceCents: Cents | null;
  collection: CollectionId;
  /** Secondary taxonomy tags used by shop filters. */
  categoryTags: string[];
  /** Exactly three: classic, deluxe, grand. */
  variants: ProductVariant[];
  colorPalette: { name: string; hex: HexColor }[];
  flowerTypes: string[];
  images: ProductImage[];
  status: 'active' | 'draft' | 'archived';
  inStock: boolean;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  /** Approximate finished dimensions in inches, used in the spec rail. */
  dimensionsIn: { width: number; height: number };
  vaseIncluded: boolean;
  careInstructions: string[];
  seoTitle: string;
  seoDescription: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Collection = {
  id: CollectionId;
  slug: Slug;
  name: string;
  /** One-line editorial descriptor used in lists. */
  tagline: string;
  description: string;
  /** Longer story for the collection landing page. */
  story: string[];
  heroImage: ImageAsset;
  paletteName: string;
  /** Canonical order in the mega-menu and the Collections page. */
  order: number;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  /** Populated by the server (or computed by selectors in Standard). */
  productCount?: number;
};

/* ------------------------------------------------------------------ commerce */

export type GiftOptions = {
  /** ISO date (YYYY-MM-DD) the recipient should receive the arrangement. */
  deliveryDate: string | null;
  /** Service window chosen at checkout. */
  deliveryOptionId: string | null;
  /** Optional handwritten message, max 240 chars. */
  giftMessage: string;
  /** Hide prices on the packing slip. */
  hidePrices: boolean;
};

export type CartItem = {
  /** Deterministic key: `${productId}:${variantId}` — one line per variant. */
  id: string;
  productId: string;
  variantId: string;
  productSlug: Slug;
  productName: string;
  variantLabel: string;
  variantSize: VariantSizeId;
  image: ImageAsset;
  unitPriceCents: Cents;
  quantity: number;
  /** Per-item personalization; overrides the cart-level defaults. */
  personalization: {
    giftMessage: string;
    deliveryDate: string | null;
    deliveryOptionId: string | null;
  };
};

export type CartTotals = {
  subtotalCents: Cents;
  deliveryCents: Cents;
  taxCents: Cents;
  discountCents: Cents;
  totalCents: Cents;
  itemCount: number;
};

export type Cart = {
  items: CartItem[];
  gift: GiftOptions;
  /** Optional promo code applied in the cart drawer. */
  promoCode: string | null;
  updatedAt: ISODateString;
};

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  addresses: CustomerAddress[];
  /** Orders created during this milestone are all `demo`. */
  source: 'web' | 'mobile' | 'phone' | 'walk-in';
  marketingOptIn: boolean;
  createdAt: ISODateString;
};

export type CustomerAddress = {
  id: string;
  label: 'home' | 'work' | 'recipient';
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: 'US';
  isDefault: boolean;
};

/* ------------------------------------------------------------------ fulfilment */

export type DeliveryZone = {
  id: string;
  name: string;
  /** The metro area this zone belongs to. */
  region: string;
  postalCodes: string[];
  /** Human-readable coverage description. */
  coverage: string;
  /** Fees per service window, in cents. */
  feeCents: { standard: Cents; express: Cents; sameDay: Cents };
  /** Whether same-day service is offered in this zone. */
  sameDayAvailable: boolean;
  /** Order cut-off time (24h) for same-day delivery. */
  cutoffTime: string;
  /** Minimum order subtotal for delivery. */
  minimumOrderCents: Cents;
  /** Lead time in hours for standard delivery. */
  standardLeadHours: number;
  notes: string;
};

export type DeliveryOption = {
  id: string;
  name: string;
  description: string;
  /** Time window label, e.g. "9am – 1pm". */
  window: string;
  /** Additional fee on top of the zone fee, in cents. */
  surchargeCents: Cents;
  /** Whether the option can be booked for the same day. */
  sameDay: boolean;
  /** Sort order within the checkout selector. */
  order: number;
};

export type OrderStatus = 'demo-pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';

export type OrderItem = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPriceCents: Cents;
  quantity: number;
  lineTotalCents: Cents;
  giftMessage: string;
};

export type Order = {
  id: string;
  /** Human-facing reference. Demo orders are prefixed `BLO-DEMO-`. */
  number: string;
  /** Always `true` in the Standard template — no payment is ever taken. */
  isDemo: boolean;
  customer: Customer;
  items: OrderItem[];
  totals: CartTotals;
  delivery: {
    method: 'delivery' | 'pickup';
    zoneId: string | null;
    optionId: string | null;
    date: string | null;
    window: string | null;
    address: CustomerAddress | null;
  };
  giftMessage: string;
  status: OrderStatus;
  /** Plain-language summary of what the demo saved. */
  notes: string;
  createdAt: ISODateString;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: ContactTopic;
  message: string;
  preferredContact: 'email' | 'phone';
  /** Honeypot field — must remain empty; rejected server-side. */
  website: string;
  consented: boolean;
  createdAt: ISODateString;
};

export type ContactTopic = 'general' | 'wedding' | 'corporate' | 'delivery' | 'sympathy' | 'press';

/* ------------------------------------------------------------------ editorial */

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  /** Initials used in the avatar medallion. */
  initials: string;
  location: string;
  occasion: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Always true in the demo template — surfaced as "Sample review". */
  isSample: boolean;
  featured: boolean;
  date: ISODateString;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  order: number;
  featured: boolean;
};

export type FAQCategory = 'ordering' | 'delivery' | 'product' | 'account' | 'events';

/* ------------------------------------------------------------------ operating info */

export type StoreHours = {
  /** 0 = Sunday … 6 = Saturday. */
  day: number;
  label: string;
  opens: string | null;
  closes: string | null;
  closed: boolean;
};

export type StoreLocation = {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  hours: StoreHours[];
  mapUrl: string;
  parkingNote: string;
};

/* ------------------------------------------------------------------ SEO */

export type SEOSettings = {
  siteName: string;
  titleTemplate: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: ImageAsset;
  /** Absolute production origin, e.g. "https://bloeme.example". */
  siteUrl: string;
  twitterHandle: string | null;
  locale: string;
  keywords: string[];
  organization: {
    name: string;
    logo: ImageAsset;
    telephone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    sameAs: string[];
  };
};
