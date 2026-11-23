/**
 * Cart engine — pure functions only, so every rule is unit-tested without a DOM.
 * Persistence and React wiring live in `src/state/CartContext.tsx`.
 */
import type { Cart, CartItem, CartTotals, Cents, DeliveryOption, DeliveryZone, GiftOptions, Product, ProductVariant } from '../types/content';

export const CART_STORAGE_KEY = 'bloeme.cart.v1';
export const CART_MAX_QTY = 12;
export const GIFT_MESSAGE_MAX = 240;
export const TAX_RATE = 0.0725; // Arcadia, CA sales tax — demo value, clearly disclosed

export const emptyGift: GiftOptions = {
  deliveryDate: null,
  deliveryOptionId: null,
  giftMessage: '',
  hidePrices: false,
};

export const emptyCart: Cart = {
  items: [],
  gift: emptyGift,
  promoCode: null,
  updatedAt: new Date(0).toISOString(),
};

export function lineId(productId: string, variantId: string): string {
  return `${productId}:${variantId}`;
}

export function findVariant(product: Product, variantId: string): ProductVariant | undefined {
  return product.variants.find((v) => v.id === variantId);
}

function snap(
  product: Product,
  variant: ProductVariant,
): Pick<CartItem, 'productSlug' | 'productName' | 'variantLabel' | 'variantSize' | 'image' | 'unitPriceCents'> {
  return {
    productSlug: product.slug,
    productName: product.name,
    variantLabel: variant.label,
    variantSize: variant.size,
    image: product.images[0],
    unitPriceCents: variant.priceCents,
  };
}

export function makeCartItem(product: Product, variant: ProductVariant, quantity: number, gift: GiftOptions): CartItem {
  const s = snap(product, variant);
  return {
    id: lineId(product.id, variant.id),
    productId: product.id,
    variantId: variant.id,
    productSlug: s.productSlug,
    productName: s.productName,
    variantLabel: s.variantLabel,
    variantSize: s.variantSize,
    image: s.image,
    unitPriceCents: s.unitPriceCents,
    quantity: clampQuantity(quantity),
    personalization: {
      giftMessage: clampMessage(gift.giftMessage),
      deliveryDate: gift.deliveryDate,
      deliveryOptionId: gift.deliveryOptionId,
    },
  };
}

export function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return 1;
  return Math.min(CART_MAX_QTY, Math.max(1, Math.round(q)));
}

export function clampMessage(msg: string): string {
  return msg.slice(0, GIFT_MESSAGE_MAX);
}

/** Adds an item or increments an existing line of the same product+variant. */
export function addItem(cart: Cart, item: CartItem): Cart {
  const existing = cart.items.find((i) => i.id === item.id);
  let items: CartItem[];
  if (existing) {
    items = cart.items.map((i) =>
      i.id === item.id
        ? {
            ...i,
            quantity: clampQuantity(i.quantity + item.quantity),
            // personalization from the newest add wins
            personalization: { ...i.personalization, ...item.personalization },
          }
        : i,
    );
  } else {
    items = [...cart.items, item];
  }
  return { ...cart, items, updatedAt: new Date().toISOString() };
}

export function setQuantity(cart: Cart, id: string, quantity: number): Cart {
  const items = cart.items.map((i) => (i.id === id ? { ...i, quantity: clampQuantity(quantity) } : i));
  return { ...cart, items, updatedAt: new Date().toISOString() };
}

export function removeItem(cart: Cart, id: string): Cart {
  return { ...cart, items: cart.items.filter((i) => i.id !== id), updatedAt: new Date().toISOString() };
}

export function updatePersonalization(cart: Cart, id: string, patch: Partial<CartItem['personalization']>): Cart {
  const items = cart.items.map((i) =>
    i.id === id
      ? {
          ...i,
          personalization: {
            ...i.personalization,
            ...patch,
            ...(patch.giftMessage !== undefined ? { giftMessage: clampMessage(patch.giftMessage) } : {}),
          },
        }
      : i,
  );
  return { ...cart, items, updatedAt: new Date().toISOString() };
}

export function updateGift(cart: Cart, patch: Partial<GiftOptions>): Cart {
  return {
    ...cart,
    gift: { ...cart.gift, ...patch, ...(patch.giftMessage !== undefined ? { giftMessage: clampMessage(patch.giftMessage) } : {}) },
    updatedAt: new Date().toISOString(),
  };
}

export function clearCart(): Cart {
  return { ...emptyCart, gift: { ...emptyGift }, updatedAt: new Date().toISOString() };
}

export function itemCount(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

export function subtotal(cart: Cart): Cents {
  return cart.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
}

/** Resolves the delivery fee for the selected zone + option, honouring the zone's mix. */
export function deliveryFee(zone: DeliveryZone | null, option: DeliveryOption | null): Cents {
  if (!zone || !option) return 0;
  const base = option.sameDay ? zone.feeCents.sameDay : option.id === 'afternoon-window' ? zone.feeCents.express : zone.feeCents.standard;
  return base + option.surchargeCents;
}

export function computeTotals(cart: Cart, zone: DeliveryZone | null, option: DeliveryOption | null): CartTotals {
  const sub = subtotal(cart);
  const delivery = cart.items.length ? deliveryFee(zone, option) : 0;
  const tax = Math.round(sub * TAX_RATE);
  return {
    subtotalCents: sub,
    deliveryCents: delivery,
    taxCents: tax,
    discountCents: 0,
    totalCents: sub + delivery + tax,
    itemCount: itemCount(cart),
  };
}

/* ------------------------------------------------------------------ persistence validation */

/** Validates cart JSON loaded from storage — drops anything malformed. */
export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.productId === 'string' &&
    typeof v.variantId === 'string' &&
    typeof v.productSlug === 'string' &&
    typeof v.productName === 'string' &&
    typeof v.unitPriceCents === 'number' &&
    typeof v.quantity === 'number' &&
    v.quantity >= 1 &&
    typeof v.personalization === 'object' &&
    v.personalization !== null
  );
}

export function sanitizeCart(raw: unknown): Cart {
  if (!raw || typeof raw !== 'object') return clearCart();
  const r = raw as Partial<Cart>;
  const items = Array.isArray(r.items) ? r.items.filter(isCartItem).map((i) => ({ ...i, quantity: clampQuantity(i.quantity) })) : [];
  const gift = r.gift && typeof r.gift === 'object' ? { ...emptyGift, ...r.gift } : { ...emptyGift };
  return { items, gift, promoCode: typeof r.promoCode === 'string' ? r.promoCode : null, updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString() };
}
