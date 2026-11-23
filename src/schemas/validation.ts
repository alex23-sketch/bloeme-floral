/**
 * BLOOMÉ FLORAL — Zod validation schemas.
 *
 * One schema per content contract. The Standard edition uses them to validate
 * form submissions and parsed/generated data at the edges; Business PRO will
 * reuse the same shapes on the API boundary (server + admin CMS + mobile app).
 */
import { z } from 'zod';
import { COLLECTION_IDS, VARIANT_SIZE_IDS } from '../types/content';
import type { CartItem, ContactSubmission, NavigationItem, Order, Product, Testimonial } from '../types/content';

/* ------------------------------------------------------------------ primitives */

export const centsSchema = z.number().int().nonnegative();
export const isoDateTimeSchema = z.string().datetime();
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
export const slugSchema = z.string().min(2).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, digits and hyphens');
export const skuSchema = z.string().min(4).max(32).regex(/^[A-Z0-9-]+$/, 'Uppercase letters, digits and hyphens');
export const emailSchema = z.string().trim().email('Enter a valid email address');
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9()\- .]+$/, 'Enter a valid phone number')
  .nullable()
  .or(z.literal('').transform(() => null));
export const hexColorSchema = z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Hex colour, e.g. #FAF7F2');
export const imageAssetSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  aspect: z.number().positive().optional(),
  focus: z.enum(['center', 'top', 'bottom']).optional(),
  credit: z.string().optional(),
});

/* ------------------------------------------------------------------ brand & site */

export const navigationItemSchema: z.ZodType<NavigationItem> = z.lazy(() =>
  z.object({
  id: z.string(),
  label: z.string().min(1),
  href: z.string().startsWith('/'),
  children: z.array(navigationItemSchema).optional(),
  external: z.boolean().optional(),
  hidden: z.boolean().optional(),
    order: z.number().int(),
  }),
) as z.ZodType<NavigationItem>;

export const heroSchema = z.object({
  id: z.string(),
  headline: z.array(z.string().min(1)).min(1).max(4),
  emphasis: z.string().optional(),
  subheading: z.string().min(1),
  body: z.string().optional(),
  primaryCta: z.object({ label: z.string().min(1), href: z.string().startsWith('/'), variant: z.enum(['primary', 'secondary', 'text']).optional() }),
  secondaryCta: z
    .object({ label: z.string().min(1), href: z.string().startsWith('/'), variant: z.enum(['primary', 'secondary', 'text']).optional() })
    .optional(),
  media: imageAssetSchema,
  badge: z.object({ title: z.string(), caption: z.string() }).optional(),
  startsAt: isoDateTimeSchema.optional(),
  endsAt: isoDateTimeSchema.optional(),
});

export const brandSettingsSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  wordmark: z.string().min(1),
  tagline: z.string().min(1),
  shortDescription: z.string().min(1),
  market: z.string(),
  currency: z.literal('USD'),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
  colors: z.object({
    background: hexColorSchema,
    primary: hexColorSchema,
    secondary: hexColorSchema,
    accent: hexColorSchema,
    text: hexColorSchema,
  }),
  typography: z.object({ heading: z.string(), body: z.string(), stylesheetUrl: z.string().nullable() }),
  logo: z.object({ mark: imageAssetSchema.nullable(), lockup: imageAssetSchema.nullable() }),
  motif: z.enum(['arch', 'circle', 'square']),
  social: z.array(z.object({ platform: z.enum(['instagram', 'pinterest', 'facebook', 'tiktok']), url: z.string().url() })),
  updatedAt: isoDateTimeSchema,
});

export const pageContentSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: z.string().min(1),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(10),
  hero: heroSchema.optional(),
  sections: z.array(z.any()),
  published: z.boolean(),
  updatedAt: isoDateTimeSchema,
});

/* ------------------------------------------------------------------ catalog */

const productVariantSchema = z.object({
  id: z.string(),
  size: z.enum(VARIANT_SIZE_IDS),
  label: z.string().min(2),
  stems: z.string().min(2),
  description: z.string().min(10),
  priceCents: centsSchema,
  compareAtPriceCents: centsSchema.nullable(),
  sku: skuSchema,
  inventory: z.number().int().nonnegative(),
  inStock: z.boolean(),
});

export const productSchema = z.object({
  id: z.string(),
  sku: skuSchema,
  name: z.string().min(2),
  slug: slugSchema,
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  priceCents: centsSchema,
  compareAtPriceCents: centsSchema.nullable(),
  collection: z.enum(COLLECTION_IDS),
  categoryTags: z.array(z.string()).default([]),
  variants: z.array(productVariantSchema).length(3),
  colorPalette: z.array(z.object({ name: z.string().min(1), hex: hexColorSchema })),
  flowerTypes: z.array(z.string().min(1)),
  images: z.array(imageAssetSchema.extend({ order: z.number().int().nonnegative(), swatch: hexColorSchema.optional() })),
  status: z.enum(['active', 'draft', 'archived']),
  inStock: z.boolean(),
  featured: z.boolean(),
  bestseller: z.boolean(),
  newArrival: z.boolean(),
  dimensionsIn: z.object({ width: z.number(), height: z.number() }),
  vaseIncluded: z.boolean(),
  careInstructions: z.array(z.string()),
  seoTitle: z.string().min(6),
  seoDescription: z.string().min(10),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const collectionSchema = z.object({
  id: z.enum(COLLECTION_IDS),
  slug: slugSchema,
  name: z.string().min(1),
  tagline: z.string().min(4),
  description: z.string().min(10),
  story: z.array(z.string()),
  heroImage: imageAssetSchema,
  paletteName: z.string(),
  order: z.number().int(),
  featured: z.boolean(),
  seoTitle: z.string().min(6),
  seoDescription: z.string().min(10),
  productCount: z.number().int().nonnegative().optional(),
});

/* ------------------------------------------------------------------ commerce */

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string(),
  productSlug: slugSchema,
  productName: z.string(),
  variantLabel: z.string(),
  variantSize: z.enum(VARIANT_SIZE_IDS),
  image: imageAssetSchema,
  unitPriceCents: centsSchema,
  quantity: z.number().int().min(1).max(99),
  personalization: z.object({
    giftMessage: z.string().max(240),
    deliveryDate: isoDateSchema.nullable(),
    deliveryOptionId: z.string().nullable(),
  }),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  gift: z.object({
    deliveryDate: isoDateSchema.nullable(),
    deliveryOptionId: z.string().nullable(),
    giftMessage: z.string().max(240),
    hidePrices: z.boolean(),
  }),
  promoCode: z.string().nullable(),
  updatedAt: isoDateTimeSchema,
});

const customerAddressSchema = z.object({
  id: z.string(),
  label: z.enum(['home', 'work', 'recipient']),
  recipientName: z.string().min(2),
  line1: z.string().min(4),
  line2: z.string().nullable(),
  city: z.string().min(2),
  state: z.string().regex(/^[A-Z]{2}$/),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.literal('US'),
  isDefault: z.boolean(),
});

export const customerSchema = z.object({
  id: z.string(),
  email: emailSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: phoneSchema,
  addresses: z.array(customerAddressSchema),
  source: z.enum(['web', 'mobile', 'phone', 'walk-in']),
  marketingOptIn: z.boolean(),
  createdAt: isoDateTimeSchema,
});

/* ------------------------------------------------------------------ fulfilment */

export const deliveryZoneSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  region: z.string().min(2),
  postalCodes: z.array(z.string().regex(/^\d{5}$/)).min(1),
  coverage: z.string().min(4),
  feeCents: z.object({ standard: centsSchema, express: centsSchema, sameDay: centsSchema }),
  sameDayAvailable: z.boolean(),
  cutoffTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '24h time'),
  minimumOrderCents: centsSchema,
  standardLeadHours: z.number().int().positive(),
  notes: z.string(),
});

export const deliveryOptionSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  description: z.string().min(4),
  window: z.string().min(2),
  surchargeCents: centsSchema,
  sameDay: z.boolean(),
  order: z.number().int(),
});

/* ------------------------------------------------------------------ orders */

export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string(),
  productName: z.string(),
  variantLabel: z.string(),
  sku: skuSchema,
  unitPriceCents: centsSchema,
  quantity: z.number().int().min(1),
  lineTotalCents: centsSchema,
  giftMessage: z.string(),
});

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  isDemo: z.literal(true),
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1),
  totals: z.object({
    subtotalCents: centsSchema,
    deliveryCents: centsSchema,
    taxCents: centsSchema,
    discountCents: centsSchema,
    totalCents: centsSchema,
    itemCount: z.number().int(),
  }),
  delivery: z.object({
    method: z.enum(['delivery', 'pickup']),
    zoneId: z.string().nullable(),
    optionId: z.string().nullable(),
    date: isoDateSchema.nullable(),
    window: z.string().nullable(),
    address: customerAddressSchema.nullable(),
  }),
  giftMessage: z.string(),
  status: z.enum(['demo-pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled']),
  notes: z.string(),
  createdAt: isoDateTimeSchema,
});

/* ------------------------------------------------------------------ contact & editorial */

export const contactTopicSchema = z.enum(['general', 'wedding', 'corporate', 'delivery', 'sympathy', 'press']);
export const contactSchema = z.object({
  id: z.string().default(() => ''),
  name: z.string().trim().min(2, 'Tell us your name'),
  email: emailSchema,
  phone: phoneSchema,
  topic: contactTopicSchema,
  message: z.string().trim().min(10, 'Give us a little more detail'),
  preferredContact: z.enum(['email', 'phone']),
  website: z.string().max(0, 'Leave this field empty'),
  consented: z.literal(true, { errorMap: () => ({ message: 'We need your consent to reply' }) }),
  createdAt: isoDateTimeSchema.default(() => new Date().toISOString()),
});

export const testimonialSchema = z.object({
  id: z.string(),
  quote: z.string().min(10),
  author: z.string().min(2),
  initials: z.string().regex(/^[A-Z]{1,3}$/),
  location: z.string(),
  occasion: z.string(),
  rating: z.number().int().min(1).max(5) ,
  isSample: z.boolean(),
  featured: z.boolean(),
  date: isoDateTimeSchema,
});

export const faqSchema = z.object({
  id: z.string(),
  question: z.string().min(4),
  answer: z.string().min(10),
  category: z.enum(['ordering', 'delivery', 'product', 'account', 'events']),
  order: z.number().int(),
  featured: z.boolean(),
});

export const seoSettingsSchema = z.object({
  siteName: z.string(),
  titleTemplate: z.string(),
  defaultTitle: z.string(),
  defaultDescription: z.string().min(10),
  defaultImage: imageAssetSchema,
  siteUrl: z.string().url(),
  twitterHandle: z.string().nullable(),
  locale: z.string(),
  keywords: z.array(z.string()),
  organization: z.object({
    name: z.string(),
    logo: imageAssetSchema,
    telephone: z.string(),
    email: emailSchema,
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }),
    sameAs: z.array(z.string().url()),
  }),
});

/* ------------------------------------------------------------------ helpers */

/** Convenience parsers with a shared error shape. */
/**
 * Typed parse helpers. The Zod schemas describe the same shapes as the
 * hand-written domain types in `src/types/content.ts`; parsing output is cast to
 * the domain type so call sites get one stable contract either way.
 */
export const parse = {
  contact: (input: unknown) => contactSchema.safeParse(input) as z.SafeParseReturnType<unknown, ContactSubmission>,
  cartItem: (input: unknown) => cartItemSchema.safeParse(input) as z.SafeParseReturnType<unknown, CartItem>,
  product: (input: unknown) => productSchema.safeParse(input) as z.SafeParseReturnType<unknown, Product>,
  order: (input: unknown) => orderSchema.safeParse(input) as z.SafeParseReturnType<unknown, Order>,
  testimonial: (input: unknown) => testimonialSchema.safeParse(input) as z.SafeParseReturnType<unknown, Testimonial>,
};

/** Checkout form schema — the fields the standard template collects. */
export const checkoutDetailsSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter your first name'),
  lastName: z.string().trim().min(2, 'Enter your last name'),
  email: emailSchema,
  phone: z.string().trim().regex(/^\+?[0-9()\- .]{7,}$/, 'Enter a valid phone number'),
  line1: z.string().trim().min(5, 'Enter a street address'),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, 'Enter a city'),
  state: z.string().trim().regex(/^[A-Z]{2}$/, 'Use the two-letter state code'),
  postalCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Enter a 5-digit ZIP code'),
  consent: z.literal(true),
});
export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;