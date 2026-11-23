import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Lock, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../state/CartContext';
import { ButtonLink } from '../components/ui/Button';
import { MediaFrame } from '../components/ui/MediaFrame';
import { deliveryOptions, deliveryZones } from '../data';
import { checkoutDetailsSchema } from '../schemas/validation';
import { formatPrice, formatShortDate } from '../lib/format';
import { GIFT_MESSAGE_MAX, TAX_RATE } from '../lib/cart';
import { useSeo } from '../lib/useSeo';
import { cn } from '../lib/cn';

type Details = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  consent: boolean;
};

const blank: Details = { firstName: '', lastName: '', email: '', phone: '', line1: '', line2: '', city: '', state: 'CA', postalCode: '', consent: false };

function minDate(offsetDays = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function CheckoutPage() {
  const { cart, totals, updateGift, selectedZone, setSelectedZone, selectedOption, setSelectedOption, reset } = useCart();
  const navigate = useNavigate();
  const [details, setDetails] = useState<Details>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof Details | 'gift' | 'zone' | 'date', string>>>({});
  const [placed, setPlaced] = useState<{ number: string; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useSeo({ title: 'Checkout (Demo)', description: 'Demonstration checkout — no payment is taken and no order is placed.', path: '/checkout', noindex: true });

  const cartItems = cart.items;
  const empty = cartItems.length === 0;

  // Recompute totals with the selected zone / option, using the same engine as the cart.
  const zone = selectedZone;
  const option = selectedOption;
  const recalculated = useMemo(() => {
    if (!zone || !option) return totals;
    const base = option.sameDay ? zone.feeCents.sameDay : option.id === 'afternoon-window' ? zone.feeCents.express : zone.feeCents.standard;
    const delivery = base + option.surchargeCents;
    const tax = Math.round(totals.subtotalCents * TAX_RATE);
    return { ...totals, deliveryCents: delivery, taxCents: tax, totalCents: totals.subtotalCents + delivery + tax };
  }, [zone, option, totals]);

  const set = <K extends keyof Details>(key: K, value: Details[K]) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setDelivery = (date: string) => {
    updateGift({ deliveryDate: date || null });
    setErrors((e) => ({ ...e, date: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!cart.gift.deliveryDate) next.date = 'Choose a delivery date.';
    if (!zone) next.zone = 'Enter a ZIP code to find your delivery zone.';
    if (!option) next.zone = 'Choose a delivery window.';

    const parsed = checkoutDetailsSchema.safeParse(details);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Details;
        if (!next[key]) next[key] = issue.message;
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    // Demo only: no network, no payment. The order number is generated client-side.
    window.setTimeout(() => {
      const number = `BLO-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
      setPlaced({ number, total: recalculated.totalCents });
      setSubmitting(false);
      reset();
    }, 800);
  };

  if (placed) {
    return (
      <div className="shell flex min-h-[70vh] max-w-2xl flex-col items-center justify-center py-20 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold/60 bg-gold/15">
          <Check size={28} strokeWidth={1.25} className="text-burgundy" />
        </span>
        <p className="type-label mt-8 text-[0.6rem] text-charcoal-faint">Demonstration complete</p>
        <h1 className="type-heading mt-3 text-charcoal">Thank you — this was a demo.</h1>
        <p className="type-body mt-4">
          No payment was taken, no card was charged, and no order has been placed or sent anywhere. In a live store this would confirm order <span className="font-medium text-charcoal">{placed.number}</span> for {formatPrice(placed.total)}.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/shop">Continue browsing</ButtonLink>
          <ButtonLink to="/" variant="secondary">Back to home</ButtonLink>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="shell flex min-h-[60vh] max-w-xl flex-col items-center justify-center py-20 text-center">
        <h1 className="type-heading text-charcoal">Your cart is quiet.</h1>
        <p className="type-body mt-4">Add an arrangement to the cart to try the demo checkout.</p>
        <ButtonLink to="/shop" className="mt-7">Browse arrangements</ButtonLink>
      </div>
    );
  }

  const zipZone = (zip: string) => deliveryZones.find((z) => z.postalCodes.includes(zip.trim())) ?? null;
  const zoneFromZip = zone ?? zipZone(details.postalCode);
  const availableOptions = zoneFromZip ? deliveryOptions.filter((o) => !o.sameDay || zoneFromZip.sameDayAvailable) : deliveryOptions;

  return (
    <div className="shell py-10 md:py-14">
      <div role="note" className="mb-8 flex flex-col gap-2 border border-gold/50 bg-gold/[0.08] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-2 text-[0.84rem] text-burgundy-ink"><ShieldCheck size={16} strokeWidth={1.5} className="text-gold" /> This is a demonstration checkout.</p>
        <p className="text-[0.78rem] text-charcoal-soft md:text-right">No payment method is needed, nothing is charged, and no order is transmitted.</p>
      </div>

      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-[0.76rem] text-charcoal-soft hover:text-burgundy">
        <ArrowLeft size={14} strokeWidth={1.5} /> Back
      </button>

      <h1 className="type-heading text-charcoal">Checkout</h1>
      <p className="mt-2 text-[0.86rem] text-charcoal-soft">Demo mode — your progress is local to this browser.</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <form onSubmit={submit} noValidate className="space-y-10">
          {/* contact */}
          <fieldset>
            <legend className="font-serif text-xl text-charcoal">1 · Your details</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="firstName" label="First name" required error={errors.firstName}>
                <input id="firstName" autoComplete="given-name" value={details.firstName} onChange={(e) => set('firstName', e.target.value)} className={inp(!!errors.firstName)} aria-invalid={!!errors.firstName} />
              </Field>
              <Field id="lastName" label="Last name" required error={errors.lastName}>
                <input id="lastName" autoComplete="family-name" value={details.lastName} onChange={(e) => set('lastName', e.target.value)} className={inp(!!errors.lastName)} aria-invalid={!!errors.lastName} />
              </Field>
              <Field id="email" label="Email" required error={errors.email}>
                <input id="email" type="email" autoComplete="email" value={details.email} onChange={(e) => set('email', e.target.value)} className={inp(!!errors.email)} aria-invalid={!!errors.email} />
              </Field>
              <Field id="phone" label="Phone" required error={errors.phone}>
                <input id="phone" type="tel" autoComplete="tel" value={details.phone} onChange={(e) => set('phone', e.target.value)} className={inp(!!errors.phone)} aria-invalid={!!errors.phone} />
              </Field>
            </div>
          </fieldset>

          {/* delivery */}
          <fieldset>
            <legend className="font-serif text-xl text-charcoal">2 · Delivery</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="line1" label="Street address" required error={errors.line1} className="sm:col-span-2">
                <input id="line1" autoComplete="address-line1" value={details.line1} onChange={(e) => set('line1', e.target.value)} className={inp(!!errors.line1)} aria-invalid={!!errors.line1} />
              </Field>
              <Field id="line2" label="Apartment, suite (optional)" error={errors.line2} className="sm:col-span-2">
                <input id="line2" autoComplete="address-line2" value={details.line2} onChange={(e) => set('line2', e.target.value)} className={inp(false)} />
              </Field>
              <Field id="city" label="City" required error={errors.city}>
                <input id="city" autoComplete="address-level2" value={details.city} onChange={(e) => set('city', e.target.value)} className={inp(!!errors.city)} aria-invalid={!!errors.city} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field id="state" label="State" required error={errors.state}>
                  <input id="state" autoComplete="address-level1" maxLength={2} value={details.state} onChange={(e) => set('state', e.target.value.toUpperCase())} className={inp(!!errors.state)} aria-invalid={!!errors.state} />
                </Field>
                <Field id="postalCode" label="ZIP" required error={errors.postalCode}>
                  <input
                    id="postalCode"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    value={details.postalCode}
                    onChange={(e) => {
                      const zip = e.target.value.replace(/\D/g, '');
                      set('postalCode', zip);
                      if (zip.length === 5) {
                        const z = zipZone(zip);
                        setSelectedZone(z);
                        if (!z) setSelectedOption(null);
                      } else {
                        setSelectedZone(null);
                      }
                    }}
                    className={inp(!!errors.postalCode)}
                    aria-invalid={!!errors.postalCode}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="deliveryDate" label="Delivery date" required error={errors.date}>
                <input id="deliveryDate" type="date" min={minDate(0)} value={cart.gift.deliveryDate ?? ''} onChange={(e) => setDelivery(e.target.value)} className={inp(!!errors.date)} aria-invalid={!!errors.date} />
              </Field>
              <div>
                <span className="type-label text-[0.6rem] text-charcoal-faint">Delivery window</span>
                <div className="mt-2.5 space-y-2">
                  {availableOptions.map((o) => (
                    <label key={o.id} className={cn('flex cursor-pointer items-center justify-between gap-3 border px-3 py-2.5 text-[0.82rem] transition-colors', option?.id === o.id ? 'border-burgundy bg-burgundy/[0.04]' : 'border-line hover:border-burgundy/40')}>
                      <span className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="deliveryOption"
                          checked={option?.id === o.id}
                          onChange={() => setSelectedOption(o)}
                          disabled={!zoneFromZip}
                          className="accent-[var(--color-burgundy)]"
                        />
                        <span>
                          <span className="text-charcoal">{o.name}</span>
                          <span className="ml-2 text-[0.72rem] text-charcoal-faint">{o.window}</span>
                        </span>
                      </span>
                      <span className="text-[0.76rem] tabular-nums text-charcoal-soft">{formatPrice((zoneFromZip ? (o.sameDay ? zoneFromZip.feeCents.sameDay : o.id === 'afternoon-window' ? zoneFromZip.feeCents.express : zoneFromZip.feeCents.standard) : 0) + o.surchargeCents)}</span>
                    </label>
                  ))}
                  {!zoneFromZip && <p className="text-[0.74rem] text-charcoal-faint">Enter a ZIP code to see delivery fees and windows.</p>}
                </div>
                {errors.zone && <p role="alert" className="mt-1.5 text-[0.74rem] text-danger">{errors.zone}</p>}
                {zoneFromZip && (
                  <p className="mt-2 flex items-center gap-1.5 text-[0.74rem] text-success"><Truck size={13} strokeWidth={1.5} /> {zoneFromZip.name} — {zoneFromZip.coverage}</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="checkout-gift" className="type-label text-[0.6rem] text-charcoal-faint">Gift message (optional)</label>
              <textarea
                id="checkout-gift"
                rows={3}
                maxLength={GIFT_MESSAGE_MAX}
                value={cart.gift.giftMessage}
                onChange={(e) => updateGift({ giftMessage: e.target.value })}
                placeholder="We will hand-write this on the atelier card."
                className="mt-2.5 w-full resize-none border border-line bg-ivory-paper px-3.5 py-3 font-serif text-[1rem] italic text-charcoal focus:border-gold focus:outline-none"
              />
              <div className="mt-1 flex justify-between text-[0.68rem] text-charcoal-faint">
                <span>Included free with every order</span>
                <span>{cart.gift.giftMessage.length}/{GIFT_MESSAGE_MAX}</span>
              </div>
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 text-[0.8rem] leading-relaxed text-charcoal-soft">
            <input type="checkbox" checked={details.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-burgundy)]" />
            <span>I understand this is a demonstration and no payment will be taken. {errors.consent && <span role="alert" className="text-danger">{errors.consent}</span>}</span>
          </label>

          <button type="submit" disabled={submitting} className="inline-flex h-13 w-full items-center justify-center gap-2 bg-burgundy text-[0.8rem] uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-burgundy-ink disabled:opacity-60">
            <Lock size={15} strokeWidth={1.5} /> {submitting ? 'Placing demo order…' : 'Place demo order'}
          </button>
          <p className="-mt-6 text-center text-[0.68rem] text-charcoal-faint">No card required · Nothing is charged · No data leaves this page</p>
        </form>

        {/* summary */}
        <aside className="h-fit border border-line bg-ivory-paper p-6 md:sticky md:top-28 md:p-7">
          <h2 className="font-serif text-xl text-charcoal">Order summary</h2>
          <ul className="mt-5 divide-y divide-line/70">
            {cartItems.map((i) => (
              <li key={i.id} className="flex gap-4 py-4">
                <MediaFrame src={i.image.src} alt={i.productName} rounded="soft" className="h-16 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[1rem] text-charcoal">{i.productName}</p>
                  <p className="text-[0.7rem] uppercase tracking-[0.12em] text-charcoal-faint">{i.variantLabel} · Qty {i.quantity}</p>
                  {i.personalization.giftMessage && <p className="mt-1 line-clamp-1 text-[0.72rem] italic text-charcoal-soft">“{i.personalization.giftMessage}”</p>}
                </div>
                <p className="text-[0.82rem] tabular-nums text-charcoal">{formatPrice(i.unitPriceCents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[0.84rem]">
            <Row label="Subtotal" value={formatPrice(recalculated.subtotalCents)} />
            <Row label="Delivery" value={zone && option ? formatPrice(recalculated.deliveryCents) : '—'} muted={!zone || !option} />
            <Row label={`Tax (${(TAX_RATE * 100).toFixed(2)}%)`} value={formatPrice(recalculated.taxCents)} />
            <div className="flex justify-between border-t border-line pt-3 text-[1rem] text-charcoal">
              <dt className="font-medium">Total</dt>
              <dd className="font-medium tabular-nums">{formatPrice(recalculated.totalCents)}</dd>
            </div>
          </dl>
          {cart.gift.deliveryDate && <p className="mt-4 text-[0.74rem] text-charcoal-faint">Requested for {formatShortDate(cart.gift.deliveryDate)}</p>}
          <Link to="/shop" className="mt-5 inline-block text-[0.78rem] text-burgundy underline underline-offset-4">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-charcoal-soft">{label}</dt>
      <dd className={cn('tabular-nums', muted ? 'text-charcoal-faint' : 'text-charcoal')}>{value}</dd>
    </div>
  );
}

function Field({ id, label, required, error, children, className }: { id: string; label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="type-label text-[0.6rem] text-charcoal-faint">
        {label} {required && <span className="text-burgundy" aria-hidden="true">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error && <p role="alert" className="mt-1.5 text-[0.74rem] text-danger">{error}</p>}
    </div>
  );
}

function inp(hasError: boolean) {
  return cn('h-11 w-full border bg-ivory px-3.5 text-[0.86rem] text-charcoal focus:outline-none', hasError ? 'border-danger' : 'border-line focus:border-gold');
}