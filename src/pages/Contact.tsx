import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { contactDetails, storeLocation } from '../data';
import { contactSchema } from '../schemas/validation';
import { PageHero } from '../components/ui/PageHero';
import { useSeo } from '../lib/useSeo';
import { cn } from '../lib/cn';

type Fields = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  preferredContact: 'email' | 'phone';
  message: string;
  website: string;
  consented: boolean;
};

const initial: Fields = {
  name: '',
  email: '',
  phone: '',
  topic: 'general',
  preferredContact: 'email',
  message: '',
  website: '',
  consented: false,
};

const TOPICS = [
  { value: 'general', label: 'A general question' },
  { value: 'wedding', label: 'A wedding or event' },
  { value: 'corporate', label: 'Corporate flowers' },
  { value: 'delivery', label: 'Delivery or an existing order' },
  { value: 'sympathy', label: 'Sympathy & remembrance' },
  { value: 'press', label: 'Press & collaborations' },
];

const today = new Date();
const isOpenNow = (() => {
  const day = today.getDay();
  const hours = storeLocation.hours.find((h) => h.day === day);
  if (!hours || hours.closed || !hours.opens || !hours.closes) return false;
  const [oh, om] = hours.opens.split(':').map(Number);
  const [ch, cm] = hours.closes.split(':').map(Number);
  const mins = today.getHours() * 60 + today.getMinutes();
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
})();

export function ContactPage() {
  const [params] = useSearchParams();
  const presetTopic = params.get('topic');
  const [form, setForm] = useState<Fields>({ ...initial, topic: presetTopic && TOPICS.some((t) => t.value === presetTopic) ? presetTopic : 'general' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [reference, setReference] = useState('');

  useSeo({
    title: 'Contact & Appointments',
    description: 'Speak with the Bloomé Floral atelier — openings hours, address, phone and a contact form for orders, weddings, corporate flowers and press.',
    path: '/contact',
  });

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot — silently accept and discard bots.
    if (form.website.trim() !== '') {
      setStatus('sent');
      setReference('BOT');
      return;
    }
    const result = contactSchema.safeParse({
      ...form,
      phone: form.phone || null,
      id: 'pending',
      createdAt: new Date().toISOString(),
    });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof Fields, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setStatus('sending');
    // Demo submission: nothing leaves the browser. In Business PRO this posts
    // to POST /api/contact and the CMS stores the submission.
    window.setTimeout(() => {
      setReference(`BF-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
      setStatus('sent');
      setForm({ ...initial });
    }, 700);
  };

  return (
    <>
      <PageHero
        eyebrow="Contact & appointments"
        title={<>Tell us what you are <em className="type-italic font-normal">planning.</em></>}
        intro="Weddings, corporate accounts, delivery questions or a note about a recent arrangement — the studio reads every message."
        image={{ src: 'art://blush/peony/contact-hero/arch', alt: 'A blush bouquet on the atelier desk' }}
      />

      <div className="shell py-14 md:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          {/* form */}
          <section>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="type-heading text-charcoal">Write to the atelier</h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em]',
                  isOpenNow ? 'bg-success/10 text-success' : 'bg-charcoal/5 text-charcoal-faint',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', isOpenNow ? 'bg-success' : 'bg-charcoal-faint')} aria-hidden="true" />
                {isOpenNow ? 'Open now' : 'Currently closed'}
              </span>
            </div>
            <p className="type-body mt-3 text-[0.92rem]">We reply within one business day. For same-day orders, please call {contactDetails.phone}.</p>

            {status === 'sent' ? (
              <div role="status" className="mt-8 border border-gold/50 bg-gold/[0.08] p-7">
                <p className="font-serif text-2xl text-burgundy">Your note is on the desk.</p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-charcoal-soft">
                  Thank you — this is a demonstration form, so nothing was sent, but in the live site the studio would reply {contactDetails.responseTime}. Reference <span className="font-medium text-charcoal">{reference}</span>.
                </p>
                <button type="button" onClick={() => { setStatus('idle'); }} className="mt-4 text-[0.8rem] text-burgundy underline underline-offset-4">
                  Write another note
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field label="Your name" id="name" error={errors.name} required>
                  <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" className={inputCls(!!errors.name)} placeholder="Camille Laurent" />
                </Field>
                <Field label="Email address" id="email" error={errors.email} required>
                  <input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" className={inputCls(!!errors.email)} placeholder="you@example.com" />
                </Field>
                <Field label="Phone (optional)" id="phone" error={errors.phone}>
                  <input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" className={inputCls(!!errors.phone)} placeholder="(415) 555-0100" />
                </Field>
                <Field label="What is it about?" id="topic" error={errors.topic}>
                  <select id="topic" value={form.topic} onChange={(e) => set('topic', e.target.value)} className={inputCls(false)}>
                    {TOPICS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <fieldset>
                    <legend className="type-label text-[0.6rem] text-charcoal-faint">Preferred reply</legend>
                    <div className="mt-2.5 flex gap-2">
                      {(['email', 'phone'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={form.preferredContact === opt}
                          onClick={() => set('preferredContact', opt)}
                          className={cn(
                            'border px-4 py-2 text-[0.78rem] capitalize transition-colors',
                            form.preferredContact === opt ? 'border-burgundy bg-burgundy text-ivory' : 'border-line text-charcoal-soft hover:border-burgundy/40',
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <Field label="Your message" id="message" error={errors.message} required className="sm:col-span-2">
                  <textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    className={cn(inputCls(!!errors.message), 'resize-none py-3')}
                    placeholder="Tell us the date, the venue, the palette you have in mind — or just the feeling."
                    aria-describedby="message-help"
                  />
                </Field>
                <p id="message-help" className="sm:col-span-2 -mt-2 text-[0.7rem] text-charcoal-faint">{form.message.length} characters · minimum 10</p>

                {/* honeypot */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3 text-[0.8rem] leading-relaxed text-charcoal-soft">
                    <input
                      type="checkbox"
                      checked={form.consented}
                      onChange={(e) => set('consented', e.target.checked)}
                      aria-invalid={!!errors.consented}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-burgundy)]"
                    />
                    <span>
                      I am happy for Bloomé to store these details to reply to my message. This is a demonstration form — nothing is transmitted.
                    </span>
                  </label>
                  {errors.consented && <p role="alert" className="mt-2 text-[0.75rem] text-danger">{errors.consented}</p>}
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex h-12 items-center gap-2 bg-burgundy px-8 text-[0.78rem] uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-burgundy-ink disabled:opacity-60"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send your note'}
                  </button>
                  <p className="mt-3 text-[0.7rem] text-charcoal-faint">All fields marked * are required. We never sell your details.</p>
                </div>
              </form>
            )}
          </section>

          {/* studio info */}
          <aside className="space-y-8">
            <div className="border border-line bg-ivory-paper p-6 md:p-8">
              <p className="type-label text-[0.6rem] text-charcoal-faint">The atelier</p>
              <p className="mt-3 font-serif text-2xl text-charcoal">{storeLocation.name}</p>
              <ul className="mt-5 space-y-4 text-[0.86rem] text-charcoal-soft">
                <li className="flex gap-3"><MapPin size={16} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold" /><span>{storeLocation.street}<br />{storeLocation.city}, {storeLocation.state} {storeLocation.postalCode}</span></li>
                <li className="flex gap-3"><Phone size={16} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold" /><a href={contactDetails.phoneHref} className="hover:text-burgundy">{contactDetails.phone}</a></li>
                <li className="flex gap-3"><Mail size={16} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold" /><a href={contactDetails.emailHref} className="hover:text-burgundy">{contactDetails.email}</a></li>
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-[0.76rem] leading-relaxed text-charcoal-faint">{storeLocation.parkingNote}</p>
            </div>

            <div className="border border-line bg-ivory-paper p-6 md:p-8">
              <p className="type-label flex items-center gap-2 text-[0.6rem] text-charcoal-faint"><Clock size={13} strokeWidth={1.25} className="text-gold" /> Opening hours</p>
              <dl className="mt-4 space-y-2 text-[0.84rem]">
                {storeLocation.hours.map((h) => (
                  <div key={h.day} className="flex justify-between gap-4">
                    <dt className={cn(h.closed ? 'text-charcoal-faint' : 'text-charcoal-soft')}>{h.label}</dt>
                    <dd className={cn('tabular-nums', h.closed ? 'text-charcoal-faint' : 'text-charcoal')}>
                      {h.closed ? 'Closed' : `${h.opens} — ${h.closes}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-burgundy p-6 text-ivory md:p-8">
              <p className="type-label text-[0.6rem] text-gold-soft">Weddings</p>
              <p className="mt-3 font-serif text-xl leading-snug">Planning a wedding or a room of flowers?</p>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-ivory/70">Consultations are 45 minutes at the atelier, over coffee. Bring a palette, a photograph, or nothing at all.</p>
              <p className="mt-4 text-[0.8rem] text-gold-soft">{contactDetails.weddingsEmail}</p>
              <p className="mt-1 text-[0.72rem] text-ivory/50">Demonstration email address — not monitored.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  id,
  error,
  required,
  children,
  className,
}: {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="type-label text-[0.6rem] text-charcoal-faint">
        {label} {required && <span aria-hidden="true" className="text-burgundy">*</span>}
      </label>
      <div className="mt-2.5">{children}</div>
      {error && <p role="alert" className="mt-1.5 text-[0.74rem] text-danger">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    'h-11 w-full border bg-ivory-paper px-3.5 text-[0.86rem] text-charcoal placeholder:text-charcoal-faint focus:outline-none',
    hasError ? 'border-danger focus:border-danger' : 'border-line focus:border-gold',
  );
}