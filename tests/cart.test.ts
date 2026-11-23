import { describe, expect, it } from 'vitest';
import { products } from '../src/data';
import { addItem, computeTotals, emptyCart, makeCartItem, removeItem, setQuantity, updateGift } from '../src/lib/cart';

describe('cart engine', () => {
  const product = products[0];
  const variant = product.variants[0];
  const item = makeCartItem(product, variant, 2, { deliveryDate: '2026-12-12', giftMessage: 'For you', deliveryOptionId: null, hidePrices: false });

  it('adds, merges, updates and removes variant lines', () => {
    let cart = addItem(emptyCart, item);
    expect(cart.items).toHaveLength(1);
    cart = addItem(cart, makeCartItem(product, variant, 2, cart.gift));
    expect(cart.items[0].quantity).toBe(4);
    cart = setQuantity(cart, item.id, 99);
    expect(cart.items[0].quantity).toBe(12);
    cart = removeItem(cart, item.id);
    expect(cart.items).toHaveLength(0);
  });

  it('calculates subtotal and tax without floating-point dollars', () => {
    const cart = addItem(emptyCart, item);
    const totals = computeTotals(cart, null, null);
    expect(totals.subtotalCents).toBe(variant.priceCents * 2);
    expect(totals.taxCents).toBe(Math.round(totals.subtotalCents * 0.0725));
    expect(totals.totalCents).toBe(totals.subtotalCents + totals.taxCents);
  });

  it('limits gift copy and updates delivery fields', () => {
    const cart = updateGift(emptyCart, { giftMessage: 'x'.repeat(400), deliveryDate: '2026-12-12' });
    expect(cart.gift.giftMessage).toHaveLength(240);
    expect(cart.gift.deliveryDate).toBe('2026-12-12');
  });
});
