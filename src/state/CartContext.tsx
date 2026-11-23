import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Cart, CartItem, CartTotals, DeliveryOption, DeliveryZone, GiftOptions, Product, ProductVariant } from '../types/content';
import {
  CART_STORAGE_KEY,
  addItem as cartAdd,
  clearCart,
  computeTotals,
  makeCartItem,
  removeItem as cartRemove,
  sanitizeCart,
  setQuantity as cartSetQty,
  updateGift as cartUpdateGift,
  updatePersonalization as cartUpdatePerso,
} from '../lib/cart';
import { readJSON, writeJSON } from '../lib/storage';

type CartContextValue = {
  cart: Cart;
  totals: CartTotals;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (product: Product, variant: ProductVariant, quantity?: number, gift?: Partial<GiftOptions>) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  updatePersonalization: (id: string, patch: Partial<CartItem['personalization']>) => void;
  updateGift: (patch: Partial<GiftOptions>) => void;
  reset: () => void;
  /** Set from checkout once a zone + option are selected. */
  setSelectedZone: (zone: DeliveryZone | null) => void;
  selectedZone: DeliveryZone | null;
  selectedOption: DeliveryOption | null;
  setSelectedOption: (option: DeliveryOption | null) => void;
  /** Announce "Added to cart" to assistive tech. */
  lastAdded: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => sanitizeCart(readJSON(CART_STORAGE_KEY, null)));
  const [isOpen, setIsOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [selectedOption, setSelectedOption] = useState<DeliveryOption | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const announceTimer = useRef<number | undefined>(undefined);

  // Persist on every change — refresh-safe.
  useEffect(() => {
    writeJSON(CART_STORAGE_KEY, cart);
  }, [cart]);

  const announce = useCallback((message: string) => {
    setLastAdded(message);
    window.clearTimeout(announceTimer.current);
    announceTimer.current = window.setTimeout(() => setLastAdded(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  const add = useCallback(
    (product: Product, variant: ProductVariant, quantity = 1, gift?: Partial<GiftOptions>) => {
      setCart((c) => {
        const mergedGift: GiftOptions = { ...c.gift, ...gift };
        const item = makeCartItem(product, variant, quantity, mergedGift);
        return cartAdd(c, item);
      });
      announce(`${product.name} — ${variant.label} added to your cart`);
      setIsOpen(true);
    },
    [announce],
  );

  const setQuantity = useCallback((id: string, quantity: number) => {
    setCart((c) => cartSetQty(c, id, quantity));
  }, []);

  const remove = useCallback((id: string) => {
    setCart((c) => cartRemove(c, id));
  }, []);

  const updatePersonalization = useCallback((id: string, patch: Partial<CartItem['personalization']>) => {
    setCart((c) => cartUpdatePerso(c, id, patch));
  }, []);

  const updateGift = useCallback((patch: Partial<GiftOptions>) => {
    setCart((c) => cartUpdateGift(c, patch));
  }, []);

  const reset = useCallback(() => {
    setCart(clearCart());
    setSelectedZone(null);
    setSelectedOption(null);
  }, []);

  const totals = useMemo(() => computeTotals(cart, selectedZone, selectedOption), [cart, selectedZone, selectedOption]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      totals,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQuantity,
      remove,
      updatePersonalization,
      updateGift,
      reset,
      setSelectedZone,
      selectedZone,
      setSelectedOption,
      selectedOption,
      lastAdded,
    }),
    [cart, totals, isOpen, add, setQuantity, remove, updatePersonalization, updateGift, reset, selectedZone, selectedOption, lastAdded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
