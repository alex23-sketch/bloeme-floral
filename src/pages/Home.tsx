import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { featuredProducts, collections, testimonials, homeHero, homepagePromos, navigation, homeIntro, homeStats } from '../data';
import { MediaFrame } from '../components/ui/MediaFrame';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ProductCard } from '../components/shop/ProductCard';
import { Rating } from '../components/ui/Rating';
import { useSeo } from '../lib/useSeo';
import { BgPatternRing } from '../components/ui/BgPatternRing';
import { cn } from '../lib/cn';

export function HomePage() {
  useSeo({ title: 'Luxury Florist in Arcadia — Flowers, Beautifully Told', description: 'Bloomé Floral is a Parisian-inspired luxury florist in Arcadia, California. Garden roses, seasonal bouquets and wedding florals, hand-delivered.', path: '/' });
  const featureSet = [...featuredProducts].slice(0, 4);
  const featuredTestimonials = testimonials.filter((t) => t.featured).slice(0, 3);

  return (
    <>
      <HomeHero />
      <IntroStatement />
      <FeaturedSection products={featureSet} />
      <CollectionsIndex />
      <StorySplit />
      <WeddingPromo />
      <TestimonialsSection items={featuredTestimonials} />
      <CtaBand />
    </>
  );
}

/* ---------------------------------------------------------------- hero */

function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="shell grid gap-10 pt-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-14 md:pt-16 lg:min-h-[82vh] lg:pt-24">
        <div className="anim-rise relative z-10 max-w-xl pb-4 md:pb-10">
          <p className="type-label flex items-center gap-3 text-[0.62rem] text-charcoal-faint">
            <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
            {homeHero.emphasis}
          </p>
          <h1 className="type-display mt-6 text-charcoal">
            {homeHero.headline.map((line, i) => (
              <span key={i} className={cn('block', i === homeHero.headline.length - 2 && 'pl-[0.6em] font-light')}>
                {line}
              </span>
            ))}
          </h1>
          <p className="type-lead mt-7 max-w-md">{homeHero.subheading}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to={homeHero.primaryCta.href} className="group inline-flex h-12 items-center gap-2 bg-burgundy px-7 text-[0.8rem] font-medium uppercase tracking-[0.1em] text-ivory transition-all duration-300 ease-[var(--ease-silk)] hover:-translate-y-px hover:bg-burgundy-ink">
              {homeHero.primaryCta.label}
              <ArrowRight size={15} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link to={homeHero.secondaryCta?.href ?? '/about'} className="group inline-flex h-12 items-center border border-burgundy/30 px-7 text-[0.8rem] font-medium uppercase tracking-[0.1em] text-burgundy transition-all duration-300 hover:border-burgundy hover:bg-burgundy hover:text-ivory">
              {homeHero.secondaryCta?.label}
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-[0.72rem] text-charcoal-faint">
            <Sparkles size={13} strokeWidth={1.25} className="text-gold" />
            Part of a demonstration template — every bouquet, price and review is sample content.
          </p>
        </div>

        <div className="anim-veil relative">
          <div className="relative mx-auto max-w-[26rem] lg:max-w-[30rem]">
            <MediaFrame
              src={homeHero.media.src}
              alt={homeHero.media.alt}
              priority
              rounded="arch"
              className="aspect-[4/5] w-full shadow-[var(--shadow-lift)]"
            />
            {homeHero.badge && (
              <div className="anim-fade absolute -bottom-5 -left-3 min-[480px]:-left-8 rounded-md border border-line bg-ivory-paper px-5 py-4 shadow-[var(--shadow-menu)] sm:-left-14" style={{ animationDelay: '0.5s' }}>
                <p className="font-serif text-lg leading-none text-burgundy">{homeHero.badge.title}</p>
                <p className="mt-1.5 text-[0.68rem] text-charcoal-soft">{homeHero.badge.caption}</p>
              </div>
            )}
          </div>
          <BgPatternRing className="absolute -right-8 -top-10 -z-10 h-52 w-52 text-gold/25" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- intro */

function IntroStatement() {
  const stats = homeStats.type === 'statRow' ? homeStats.stats : [];
  return (
    <section className="shell py-20 md:py-28">
      <div className="shell-narrow mx-auto text-center">
        <p className="type-label flex items-center justify-center gap-3 text-[0.62rem] text-charcoal-faint">
          <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
          {homeIntro.eyebrow}
          <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
        </p>
        <h2 className="type-heading mx-auto mt-5 text-charcoal">{homeIntro.title}</h2>
        <p className="type-body mx-auto mt-6 text-[1.05rem]">{homeIntro.body}</p>
      </div>
      {stats.length > 0 && (
        <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-y-9 border-t border-line pt-10 text-center md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="font-serif text-[2.1rem] leading-none text-burgundy">{s.value}</dd>
              <dt className="mt-2 px-3 text-[0.68rem] uppercase tracking-[0.16em] text-charcoal-faint">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- featured */

function FeaturedSection({ products }: { products: typeof featuredProducts }) {
  return (
    <section className="shell py-4 md:py-10">
      <SectionHeading
        eyebrow="From the cooler this week"
        title="A selection from the studio"
        action={
          <Link to="/shop" className="group inline-flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] text-burgundy">
            View all <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
        {products.map((p, i) => (
          <div key={p.id} className={cn('reveal', i % 2 === 1 && 'lg:translate-y-8')}>
            <ProductCard product={p} priority={i < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- collections */

function CollectionsIndex() {
  return (
    <section className="shell py-20 md:py-28">
      <SectionHeading
        eyebrow="Six collections"
        title="Shop by occasion, or by feeling"
        body="Each collection is a palette and a point of view — from the house’s Signature Roses to the couture Luxury arrangements."
        action={
          <Link to="/collections" className="group inline-flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] text-burgundy">
            All collections <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {collections.map((c, i) => (
          <Link
            key={c.id}
            to={`/collections/${c.slug}`}
            className={cn('group relative block overflow-hidden', i === 0 && 'col-span-2 md:col-span-1 md:row-span-2')}
          >
            <MediaFrame
              src={c.heroImage.src}
              alt={c.heroImage.alt}
              rounded="none"
              className={cn('w-full', i === 0 ? 'aspect-[4/5] md:h-full md:aspect-auto' : 'aspect-[4/4.6]')}
              imgClassName="transition-transform duration-[1.15s] ease-[var(--ease-silk)] group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/62 via-charcoal/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <p className="font-serif text-[1.35rem] text-ivory md:text-2xl">{c.name}</p>
              <p className="mt-1 max-w-[24ch] text-[0.74rem] leading-relaxed text-ivory/75">{c.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- story */

function StorySplit() {
  const source = collections[4].heroImage;
  return (
    <section className="bg-ivory-deep/55 py-20 md:py-28">
      <div className="shell grid items-center gap-12 md:grid-cols-2 lg:gap-20">
        <div className="relative order-2 md:order-1">
          <MediaFrame src={source.src} alt="Gathered seasonal blooms from regional growers" rounded="soft" className="aspect-[4/5] w-full shadow-[var(--shadow-lift)]" />
          <div className="absolute -right-4 -top-4 -z-10 h-full w-full rounded-2xl border border-gold/40 md:-right-6 md:-top-6" aria-hidden="true" />
        </div>
        <div className="order-1 md:order-2">
          <p className="type-label flex items-center gap-3 text-[0.62rem] text-charcoal-faint">
            <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
            Our story
          </p>
          <h2 className="type-heading mt-5 text-charcoal">A studio that reads the <em className="type-italic font-medium">season</em>, not the calendar.</h2>
          <p className="type-body mt-6">
            Bloomé Floral began in 2017 at a garden shed on Rue des Jardins with a single bucket of roses. Today we are a staffed atelier with our own cool room, three regional growers, and the same enamel table.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ['Sourced with the seasons', 'Seventy-two percent of our stems grow within 120 miles of the studio.'],
              ['Composed the morning of', 'No pre-built bouquets sit overnight — every order is gathered the day it travels.'],
              ['Delivered by hand', 'Our own couriers, white vans, plain wrappers. Never left in the sun.'],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-4">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <div>
                  <p className="font-serif text-lg text-charcoal">{t}</p>
                  <p className="mt-0.5 text-[0.84rem] leading-relaxed text-charcoal-soft">{b}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/about" className="group mt-9 inline-flex items-center gap-2 border-b border-gold/70 pb-1 text-[0.82rem] font-medium text-burgundy">
            Read the full story <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- promo band */

function WeddingPromo() {
  const promo = homepagePromos[0];
  return (
    <section className="shell py-20 md:py-28">
      <div className="relative overflow-hidden rounded-2xl bg-burgundy text-ivory">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-gold/25" aria-hidden="true" />
        <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full border border-gold/15" aria-hidden="true" />
        <div className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-14 lg:px-20">
          <div className="max-w-xl">
            <p className="type-label text-[0.62rem] text-gold-soft">{promo.title.split(' ')[0]} — {promo.title.split(' ').slice(1).join(' ')}</p>
            <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">{promo.title}</h2>
            <p className="mt-4 text-[0.94rem] leading-relaxed text-ivory/75">{promo.body}</p>
            <Link to={promo.cta.href} className="mt-7 inline-flex h-12 items-center gap-2 bg-ivory px-7 text-[0.8rem] font-medium uppercase tracking-[0.1em] text-burgundy transition-colors hover:bg-rose-soft">
              {promo.cta.label} <ArrowRight size={15} strokeWidth={1.5} />
            </Link>
          </div>
          <div className="arch mx-auto hidden h-[19rem] w-[15rem] overflow-hidden border border-gold/35 md:block">
            <MediaFrame src={promo.art.src} alt={promo.art.alt} rounded="none" className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- testimonials */

function TestimonialsSection({ items }: { items: typeof testimonials }) {
  return (
    <section className="shell py-10 md:py-20">
      <SectionHeading eyebrow="Notes from recipients" title="What arrives, and how it is received" align="center" />
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.id} className="reveal flex flex-col border border-line/80 bg-ivory-paper p-7">
            <Rating value={t.rating} />
            <blockquote className="mt-5 flex-1 font-serif text-[1.18rem] italic leading-[1.55] text-charcoal">“{t.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-burgundy font-serif text-sm text-ivory">
                {t.initials}
              </span>
              <div>
                <p className="text-[0.84rem] font-medium text-charcoal">{t.author}</p>
                <p className="text-[0.7rem] text-charcoal-faint">{t.occasion} · {t.location}</p>
              </div>
            </figcaption>
            <p className="mt-4 inline-flex self-start items-center gap-1.5 border border-gold/50 px-2 py-1 text-[0.56rem] uppercase tracking-[0.16em] text-gold">
              Sample review
            </p>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- cta */

function CtaBand() {
  const shop = navigation.find((n) => n.id === 'nav-shop');
  return (
    <section className="shell py-20 md:py-28">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-ivory-paper px-8 py-16 text-center md:py-20">
        <BgPatternRing className="absolute -left-16 -top-16 h-64 w-64 text-gold/20" />
        <p className="type-label flex items-center justify-center gap-3 text-[0.62rem] text-charcoal-faint">
          <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
          The occasion you are planning
          <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
        </p>
        <h2 className="type-heading mx-auto mt-5 max-w-2xl text-charcoal">Flowers for the <em className="type-italic">occasion you are planning</em> — not just the one you are buying from.</h2>
        <p className="type-body mx-auto mt-6">Browse all 36 arrangements or let a collection choose for you.</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/shop" className="inline-flex h-12 items-center bg-burgundy px-8 text-[0.8rem] font-medium uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-burgundy-ink">
            Shop all arrangements
          </Link>
          <Link to={shop?.children?.[1]?.href ?? '/collections/signature-roses'} className="inline-flex h-12 items-center border border-burgundy/30 px-8 text-[0.8rem] font-medium uppercase tracking-[0.1em] text-burgundy transition-colors hover:border-burgundy hover:bg-burgundy hover:text-ivory">
            Start with roses
          </Link>
        </div>
      </div>
    </section>
  );
}