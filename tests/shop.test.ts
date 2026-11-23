import { describe, expect, it } from 'vitest';
import { activeProducts } from '../src/data';
import { filterAndSortProducts } from '../src/pages/Shop';

describe('shop filters', () => {
  it('searches across product copy and flower types', () => {
    const results = filterAndSortProducts(activeProducts, { q: 'peony' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => `${p.name} ${p.description} ${p.flowerTypes.join(' ')}`.toLowerCase().includes('peony'))).toBe(true);
  });

  it('filters collections and sorts by price', () => {
    const roses = filterAndSortProducts(activeProducts, { collection: 'signature-roses', sort: 'price-asc' });
    expect(roses).toHaveLength(6);
    expect(roses.map((p) => p.priceCents)).toEqual([...roses.map((p) => p.priceCents)].sort((a, b) => a - b));
  });

  it('returns an empty list for an unmatched query', () => {
    expect(filterAndSortProducts(activeProducts, { q: 'unicorn bouquet' })).toHaveLength(0);
  });
});
