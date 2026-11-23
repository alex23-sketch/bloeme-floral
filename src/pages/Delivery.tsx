import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Package, Truck } from 'lucide-react';
import { deliveryOptions, deliveryZones, faqs, storeLocation } from '../data';
import { PageHero } from '../components/ui/PageHero';
import { useSeo } from '../lib/useSeo';
import { formatPrice } from '../lib/format';
import { cn } from '../lib/cn';
import { Accordion } from '../components/ui/Accordion';

const CARE_STEPS = [
  { title: 'Trim the stems', body: 'Cut 1–2 inches at a sharp 45° angle on arrival. A clean cut helps the stem drink; a crushed one blocks water.' },
  { title: 'Fresh water, every other day', body: 'Warm water for roses, cool for everything else. Change it every other day and re-trim lightly.' },
  { title: 'Choose the spot', body: 'Away from direct sun, radiators and draughts. Fruit bowls release ethylene that ages blooms early.' },
  { title: 'Remove fading stems', body: 'As heads fade, lift them out — the remaining flowers get more room and the arrangement holds its line.' },
];

const POLICIES = [
  { title: 'Order changes', body: 'Orders can be changed or cancelled free of charge up to 24 hours before the delivery date. After that, we ask for the cost of the flowers.' },
  { title: 'Delivery guarantees', body: 'If an arrangement arrives damaged or differs meaningfully from its listing, send a photograph within 48 hours and we will replace it at no cost.' },
  { title: 'Recipient unavailable', body: 'Couriers always attempt to leave the arrangement with a neighbour or concierge. If no safe place exists, we return it to the studio and re-schedule at no delivery charge.' },
  { title: 'Substitutions', body: 'Flowers are seasonal and we may substitute a bloom of equal or greater value in the same palette. We never substitute to reduce the value of an arrangement.' },
];

export function DeliveryPage() {
  const [postal, setPostal] = useState('');
  const [checked, setChecked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: 'Delivery & Care',
    description: 'Delivery zones, fees, service windows and care guidance for Bloomé Floral — plus our policies and frequently asked questions.',
    path: '/delivery',
  });

  const checkZone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = postal.replace(/\s/g, '');
    if (!/^\d{5}$/.test(clean)) {
      setError('Please enter a 5-digit ZIP code.');
      setChecked(null);
      return;
    }
    setError(null);
    const zone = deliveryZones.find((z) => z.postalCodes.includes(clean));
    setChecked(zone ? zone.id : 'none');
  };

  const matchedZone = deliveryZones.find((z) => z.id === checked);

  return (
    <>
      <PageHero
        eyebrow="Fulfilment"
        title={<>Delivered by hand, <em className="type-italic font-normal">across the metro.</em></>}
        intro="Same-day in select zones, next-day elsewhere, and a regional courier for up to 50 miles. Here is exactly what that looks like."
        image={{ src: 'art://lavender/hydrangea/delivery-hero/arch', alt: 'An arrangement being prepared for hand delivery' }}
      />

      {/* ZIP checker */}
      <section className="shell -mt-1 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <h2 className="type-heading text-charcoal">Check your zone.</h2>
            <p className="type-body mt-4">Enter a ZIP code to see availability, fees and the service window for your area.</p>
          </div>
          <div>
            <form onSubmit={checkZone} noValidate className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="zip" className="sr-only">ZIP code</label>
              <input
                id="zip"
                inputMode="numeric"
                maxLength={5}
                value={postal}
                onChange={(e) => setPostal(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter a 5-digit ZIP"
                aria-invalid={!!error}
                aria-describedby={error ? 'zip-error' : undefined}
                className="h-12 flex-1 border border-line bg-ivory-paper px-4 text-sm tabular-nums text-charcoal placeholder:text-charcoal-faint focus:border-gold focus:outline-none"
              />
              <button type="submit" className="h-12 bg-burgundy px-7 text-[0.78rem] uppercase tracking-[0.1em] text-ivory hover:bg-burgundy-ink">Check ZIP</button>
            </form>
            <div aria-live="polite" className="mt-3">
              {error && <p id="zip-error" role="alert" className="text-[0.8rem] text-danger">{error}</p>}
              {matchedZone && (
                <div className="border border-gold/50 bg-gold/[0.08] p-4 text-[0.84rem]">
                  <p className="flex items-center gap-2 font-medium text-burgundy"><MapPin size={15} strokeWidth={1.5} /> Delivered in {matchedZone.name}</p>
                  <p className="mt-1 text-charcoal-soft">
                    {matchedZone.region}. Standard {formatPrice(matchedZone.feeCents.standard)}
                    {matchedZone.sameDayAvailable ? ` · Same-day ${formatPrice(matchedZone.feeCents.sameDay)} (order by ${matchedZone.cutoffTime})` : ' · Same-day not available'}.
                  </p>
                  <Link to={`/shop`} className="link-underline mt-2 inline-block text-[0.8rem]">Shop arrangements</Link>
                </div>
              )}
              {checked === 'none' && (
                <p className="border border-line bg-ivory-paper p-4 text-[0.84rem] text-charcoal-soft">
                  That ZIP is outside our five demo zones. Our regional courier reaches up to 50 miles — call the atelier and we will try to arrange something.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* zones */}
      <section id="zones" className="border-y border-line bg-ivory-deep/40 py-16 md:py-20">
        <div className="shell">
          <p className="type-label text-[0.62rem] text-charcoal-faint">Delivery zones</p>
          <h2 className="type-heading mt-3 text-charcoal">Five zones, one standard of care.</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-[0.84rem]">
              <caption className="sr-only">Delivery zones, fees and cut-off times</caption>
              <thead>
                <tr className="border-b border-charcoal/20 text-[0.64rem] uppercase tracking-[0.14em] text-charcoal-faint">
                  <th scope="col" className="py-3 pr-4 font-medium">Zone</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Coverage</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Standard</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Express</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Same-day</th>
                  <th scope="col" className="py-3 font-medium">Cut-off</th>
                </tr>
              </thead>
              <tbody>
                {deliveryZones.map((z) => (
                  <tr key={z.id} className="border-b border-line align-top">
                    <th scope="row" className="py-4 pr-4 font-serif text-[1.05rem] font-normal text-charcoal">{z.name}</th>
                    <td className="py-4 pr-4 text-charcoal-soft">{z.region}<br /><span className="text-[0.72rem] text-charcoal-faint">{z.notes}</span></td>
                    <td className="py-4 pr-4 tabular-nums text-charcoal">{formatPrice(z.feeCents.standard)}</td>
                    <td className="py-4 pr-4 tabular-nums text-charcoal">{formatPrice(z.feeCents.express)}</td>
                    <td className="py-4 pr-4 tabular-nums text-charcoal">{z.sameDayAvailable ? formatPrice(z.feeCents.sameDay) : <span className="text-charcoal-faint">—</span>}</td>
                    <td className="py-4 tabular-nums text-charcoal">{z.sameDayAvailable ? z.cutoffTime : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[0.72rem] text-charcoal-faint">All fees and ZIP codes are fictional demonstration data for the Arcadia metro.</p>
        </div>
      </section>

      {/* scheduling */}
      <section className="shell py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {deliveryOptions.map((o, i) => (
            <div key={o.id} className="border-t border-gold/50 pt-6">
              <p className="flex items-center gap-2 text-gold">{i === 0 ? <Truck size={17} strokeWidth={1.25} /> : i === 1 ? <Clock size={17} strokeWidth={1.25} /> : <Package size={17} strokeWidth={1.25} />}</p>
              <h3 className="mt-4 font-serif text-xl text-charcoal">{o.name}</h3>
              <p className="mt-1 text-[0.72rem] uppercase tracking-[0.14em] text-charcoal-faint">{o.window}</p>
              <p className="mt-3 text-[0.86rem] leading-relaxed text-charcoal-soft">{o.description}</p>
              <p className="mt-4 text-[0.8rem] text-charcoal">{o.surchargeCents === 0 ? 'No surcharge' : `+${formatPrice(o.surchargeCents)} on the zone rate`}</p>
            </div>
          ))}
        </div>
      </section>

      {/* care */}
      <section id="care" className="border-t border-line py-16 md:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="type-label text-[0.62rem] text-charcoal-faint">Care guide</p>
            <h2 className="type-heading mt-3 text-charcoal">Make them last.</h2>
            <p className="type-body mt-4">Every arrangement arrives with a care card. These are the four habits that make the biggest difference.</p>
          </div>
          <ol className="grid gap-8 sm:grid-cols-2">
            {CARE_STEPS.map((step, i) => (
              <li key={step.title}>
                <p className="font-serif text-[2.6rem] leading-none text-gold/70">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 font-serif text-lg text-charcoal">{step.title}</h3>
                <p className="mt-1.5 text-[0.84rem] leading-relaxed text-charcoal-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* policies */}
      <section className="bg-ivory-deep/40 py-16 md:py-20">
        <div className="shell grid gap-10 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="type-label text-[0.62rem] text-charcoal-faint">Policies</p>
            <h2 className="type-heading mt-3 text-charcoal">The promises.</h2>
            <p className="type-body mt-4 text-[0.9rem]">Written plainly, because flowers should not come with fine print. Questions? Call {storeLocation.phone}.</p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {POLICIES.map((p) => (
              <div key={p.title} className="py-5">
                <dt className="font-serif text-lg text-charcoal">{p.title}</dt>
                <dd className="mt-1.5 text-[0.86rem] leading-relaxed text-charcoal-soft">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="shell py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="type-label text-center text-[0.62rem] text-charcoal-faint">Frequently asked</p>
          <h2 className="type-heading mt-3 text-center text-charcoal">Questions, answered.</h2>
          <Accordion className="mt-10" items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} defaultOpen={faqs[0].id} />
        </div>
      </section>

      <div className={cn('shell pb-8')}>
        <div className="flex flex-col items-center justify-between gap-4 border border-line bg-ivory-paper px-6 py-6 text-center md:flex-row md:text-left">
          <p className="text-[0.86rem] text-charcoal-soft">Still need a hand? Our studio replies within one business day.</p>
          <Link to="/contact" className="inline-flex h-11 items-center border border-burgundy/30 px-6 text-[0.78rem] uppercase tracking-[0.1em] text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-ivory">
            Contact the atelier
          </Link>
        </div>
      </div>
    </>
  );
}