import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../state/CartContext';
import { formatPrice } from '../../lib/format';
import { CART_MAX_QTY, GIFT_MESSAGE_MAX } from '../../lib/cart';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { MediaFrame } from '../ui/MediaFrame';
import { cn } from '../../lib/cn';
import { ButtonLink } from '../ui/Button';

export function CartDrawer() {
  const { cart, totals, isOpen, close, setQuantity, remove, updateGift } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const empty = cart.items.length === 0;
  const messageLength = cart.gift.giftMessage.length;

  return (
    <div className={cn('fixed inset-0 z-50', isOpen ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!isOpen}>
      <div
        className={cn('absolute inset-0 bg-charcoal/45 backdrop-blur-[3px] transition-opacity duration-500', isOpen ? 'opacity-100' : 'opacity-0')}
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-[29rem] flex-col bg-ivory-paper shadow-[var(--shadow-menu)] transition-transform duration-[520ms] ease-[var(--ease-silk)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="type-label text-[0.6rem] text-charcoal-faint">Your selection</p>
            <h2 className="mt-1 font-serif text-2xl text-charcoal">
              {empty ? 'Cart' : `${totals.itemCount} ${totals.itemCount === 1 ? 'arrangement' : 'arrangements'}`}
            </h2>
          </div>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close cart" className="inline-flex h-10 w-10 items-center justify-center text-charcoal transition-colors hover:text-burgundy">
            <X strokeWidth={1.25} size={22} />
          </button>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-line bg-ivory">
              <ShoppingBag size={26} strokeWidth={1} className="text-burgundy" />
            </span>
            <p className="mt-6 font-serif text-2xl text-charcoal">Your cart is quiet.</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-charcoal-soft">
              Start with the house collection — garden roses in blush, or the seasonal gathers our growers brought in this week.
            </p>
            <ButtonLink to="/shop" className="mt-7" size="md" onClick={close}>
              Browse arrangements
            </ButtonLink>
            <ButtonLink to="/collections/signature-roses" variant="ghost" className="mt-4 text-[0.8rem]">
              Or see Signature Roses
            </ButtonLink>
            <p className="mt-10 text-[0.7rem] leading-relaxed text-charcoal-faint">
              This is a demonstration store. Nothing is charged or ordered.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ul className="divide-y divide-line/80">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-5">
                    <Link to={`/products/${item.productSlug}`} onClick={close} className="shrink-0">
                      <MediaFrame
                        src={item.image.src}
                        alt={item.productName}
                        rounded="soft"
                        className="h-24 w-20 border border-line/70"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={`/products/${item.productSlug}`} onClick={close} className="font-serif text-[1.05rem] leading-snug text-charcoal hover:text-burgundy">
                            {item.productName}
                          </Link>
                          <p className="mt-0.5 text-[0.72rem] uppercase tracking-[0.14em] text-charcoal-faint">{item.variantLabel}</p>
                        </div>
                        <p className="shrink-0 text-[0.85rem] tabular-nums text-charcoal">{formatPrice(item.unitPriceCents * item.quantity)}</p>
                      </div>

                      {item.personalization.giftMessage && (
                        <p className="mt-2 line-clamp-2 rounded bg-ivory px-2.5 py-1.5 text-[0.72rem] italic text-charcoal-soft">
                          “{item.personalization.giftMessage}”
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-line">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.productName}`}
                            className="flex h-8 w-8 items-center justify-center text-charcoal transition-colors hover:bg-ivory disabled:opacity-35"
                          >
                            <Minus size={13} strokeWidth={1.5} />
                          </button>
                          <span aria-live="polite" className="w-8 text-center text-[0.8rem] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= CART_MAX_QTY}
                            aria-label={`Increase quantity of ${item.productName}`}
                            className="flex h-8 w-8 items-center justify-center text-charcoal transition-colors hover:bg-ivory disabled:opacity-35"
                          >
                            <Plus size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="inline-flex items-center gap-1.5 text-[0.72rem] text-charcoal-faint transition-colors hover:text-danger"
                        >
                          <Trash2 size={13} strokeWidth={1.25} /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-2 border-t border-line pt-5">
                <label htmlFor="cart-gift-message" className="type-label text-[0.6rem] text-charcoal-faint">
                  Handwritten card
                </label>
                <textarea
                  id="cart-gift-message"
                  rows={2}
                  maxLength={GIFT_MESSAGE_MAX}
                  value={cart.gift.giftMessage}
                  onChange={(e) => updateGift({ giftMessage: e.target.value })}
                  placeholder="A line for the card — your words, set by hand."
                  className="mt-2 w-full resize-none border border-line bg-ivory px-3 py-2.5 font-serif text-[0.95rem] italic text-charcoal placeholder:font-sans placeholder:text-[0.8rem] placeholder:not-italic placeholder:text-charcoal-faint focus:border-gold focus:outline-none"
                />
                <div className="mt-1.5 flex justify-between text-[0.66rem] text-charcoal-faint">
                  <span>Included with every order</span>
                  <span className={cn(messageLength >= GIFT_MESSAGE_MAX && 'text-danger')}>
                    {messageLength}/{GIFT_MESSAGE_MAX}
                  </span>
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[0.8rem] text-charcoal-soft">
                  <input
                    type="checkbox"
                    checked={cart.gift.hidePrices}
                    onChange={(e) => updateGift({ hidePrices: e.target.checked })}
                    className="h-4 w-4 accent-[var(--color-burgundy)]"
                  />
                  Hide prices on the gift receipt
                </label>
              </div>
            </div>

            <div className="border-t border-line bg-ivory px-6 py-5">
              <dl className="space-y-2 text-[0.85rem]">
                <div className="flex justify-between text-charcoal-soft">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums text-charcoal">{formatPrice(totals.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-charcoal-soft">
                  <dt>Delivery</dt>
                  <dd className="text-charcoal-faint">Calculated at checkout</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-[0.95rem] text-charcoal">
                  <dt className="font-medium">Estimated total</dt>
                  <dd className="font-medium tabular-nums">{formatPrice(totals.subtotalCents)}</dd>
                </div>
              </dl>
              <ButtonLink to="/checkout" className="mt-4 w-full" onClick={close}>
                Continue to checkout
              </ButtonLink>
              <p className="mt-3 text-center text-[0.68rem] leading-relaxed text-charcoal-faint">
                Demo checkout — no payment is taken and no order is sent.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}