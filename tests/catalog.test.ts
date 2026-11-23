import { describe, expect, it } from 'vitest';
import { collections, products, testimonials, faqs, deliveryZones } from '../src/data';
import { productSchema, collectionSchema } from '../src/schemas/validation';

describe('Bloomé demo catalog', () => {
  it('contains exactly 36 unique products across six collections', () => {
    expect(products).toHaveLength(36);
    expect(new Set(products.map((p) => p.id)).size).toBe(36);
    expect(new Set(products.map((p) => p.slug)).size).toBe(36);
    expect(collections).toHaveLength(6);
    for (const collection of collections) {
      expect(products.filter((p) => p.collection === collection.id)).toHaveLength(6);
    }
  });

  it('gives every product three valid sizes, images, stock and SEO data', () => {
    for (const product of products) {
      expect(productSchema.safeParse(product).success).toBe(true);
      expect(product.variants.map((v) => v.size)).toEqual(['classic', 'deluxe', 'grand']);
      expect(product.images.length).toBeGreaterThanOrEqual(2);
      expect(product.priceCents).toBeGreaterThanOrEqual(4500);
      expect(product.variants[2].priceCents).toBeLessThanOrEqual(35000);
      expect(product.sku).toMatch(/^BF-[A-Z]+-\d{3}$/);
      expect(product.seoTitle.length).toBeGreaterThan(5);
      expect(product.seoDescription.length).toBeGreaterThan(10);
    }
  });

  it('validates all six collections and required content counts', () => {
    expect(collections.every((collection) => collectionSchema.safeParse(collection).success)).toBe(true);
    expect(testimonials).toHaveLength(8);
    expect(testimonials.every((review) => review.isSample)).toBe(true);
    expect(faqs).toHaveLength(10);
    expect(deliveryZones).toHaveLength(5);
  });
});
