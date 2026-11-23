/**
 * Exports the M1 TypeScript catalog (single source of truth) to
 * backend/seed/catalog.json for the seed CLI. Run after editing src/data.
 */
import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'node:fs';

const result = await build({
  stdin: {
    contents: `
      import { products, collections, testimonials, faqs, deliveryZones, deliveryOptions } from './src/data/index.ts';
      export const data = { products, collections, testimonials, faqs, deliveryZones, deliveryOptions };
    `,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  jsx: 'automatic',
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});

const mod = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { products, collections, testimonials, faqs, deliveryZones, deliveryOptions } = mod.data;

const catalog = {
  generatedAt: new Date().toISOString(),
  collections: collections.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    story: c.story,
    heroImageUrl: c.heroImage?.src ?? null,
    paletteName: c.paletteName,
    position: c.order,
    featured: c.featured,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
  })),
  products: products.map((p) => ({
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    collection: p.collection,
    shortDescription: p.shortDescription,
    description: p.description,
    basePriceCents: p.priceCents,
    compareAtPriceCents: p.compareAtPriceCents,
    categoryTags: p.categoryTags,
    colorPalette: p.colorPalette,
    flowerTypes: p.flowerTypes,
    dimensions: p.dimensionsIn,
    vaseIncluded: p.vaseIncluded,
    careInstructions: p.careInstructions,
    featured: p.featured,
    bestseller: p.bestseller,
    newArrival: p.newArrival,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    images: p.images.map((i, idx) => ({ src: i.src, alt: i.alt, position: i.position ?? idx })),
    variants: p.variants.map((v) => ({
      size: v.size, label: v.label, stems: v.stems, description: v.description,
      priceCents: v.priceCents, compareAtPriceCents: v.compareAtPriceCents,
      sku: v.sku, stockQty: v.inventory, inStock: v.inStock,
    })),
  })),
  testimonials: testimonials.map((t) => ({
    quote: t.quote, author: t.author, initials: t.initials, location: t.location,
    occasion: t.occasion, rating: t.rating, isSample: t.isSample, featured: t.featured,
  })),
  faqs: faqs.map((f) => ({ question: f.question, answer: f.answer, category: f.category, position: f.order, featured: f.featured })),
  deliveryZones: deliveryZones.map((z) => ({
    slug: z.id, name: z.name, region: z.region, postalCodes: z.postalCodes,
    sameDayAvailable: z.sameDayAvailable, cutoffTime: z.cutoffTime,
    standardFeeCents: z.feeCents.standard, expressFeeCents: z.feeCents.express,
    sameDayFeeCents: z.feeCents.sameDay, minimumOrderCents: z.minimumOrderCents,
    standardLeadHours: z.standardLeadHours, notes: z.notes,
  })),
  deliveryWindows: deliveryOptions.map((o, i) => ({
    slug: o.id, name: o.name, description: o.description,
    startTime: o.window.split('–')[0].trim().replace('am', ':00').replace('pm', ':00'),
    endTime: (o.window.split('–')[1] ?? '17:00').trim(),
    surchargeCents: o.surchargeCents, sameDayOnly: o.sameDay, position: i + 1,
  })),
};

mkdirSync('backend/seed', { recursive: true });
writeFileSync('backend/seed/catalog.json', JSON.stringify(catalog, null, 2));
console.log(`exported ${catalog.collections.length} collections, ${catalog.products.length} products, ${catalog.testimonials.length} testimonials, ${catalog.faqs.length} faqs, ${catalog.deliveryZones.length} zones`);
