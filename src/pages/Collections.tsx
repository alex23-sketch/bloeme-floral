import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { collections, productsInCollection } from '../data';
import type { CollectionId } from '../types/content';
import { MediaFrame } from '../components/ui/MediaFrame';
import { ProductCard } from '../components/shop/ProductCard';
import { useSeo } from '../lib/useSeo';
import { NotFoundState } from '../components/ui/States';
import { PageHero } from '../components/ui/PageHero';
import { cn } from '../lib/cn';

export function CollectionsPage() {
  useSeo({
    title: 'Collections',
    description: 'Six floral collections for every occasion — Signature Roses, Birthday Flowers, Wedding & Romance, Sympathy & Remembrance, Seasonal Blooms and Luxury Arrangements.',
    path: '/collections',
  });

  return (
    <>
      <section className="border-b border-line/70">
        <div className="shell py-14 md:py-20">
          <p className="type-label flex items-center gap-3 text-[0.62rem] text-charcoal-faint">
            <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
            Curated
          </p>
          <h1 className="type-hero mt-5 max-w-3xl text-charcoal">Six ways to say it with flowers.</h1>
          <p className="type-lead mt-5">
            Each collection is a palette and a point of view — shop by occasion, or by the feeling you want the room to carry.
          </p>
        </div>
      </section>

      <div className="shell space-y-6 py-10 md:space-y-10 md:py-14">
        {collections.map((c, index) => {
          const products = productsInCollection(c.id);
          const reverse = index % 2 === 1;
          return (
            <Link
              key={c.id}
              to={`/collections/${c.slug}`}
              className={cn(
                'group grid overflow-hidden rounded-2xl border border-line bg-ivory-paper transition-shadow duration-500 hover:shadow-[var(--shadow-lift)] md:grid-cols-2',
                reverse && 'md:[&>*:first-child]:order-2',
              )}
            >
              <MediaFrame
                src={c.heroImage.src}
                alt={c.heroImage.alt}
                rounded="none"
                priority={index === 0}
                className="aspect-[16/11] w-full md:aspect-auto md:h-full md:min-h-[21rem]"
                imgClassName="transition-transform duration-[1.15s] ease-[var(--ease-silk)] group-hover:scale-[1.04]"
              />
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="type-label text-[0.58rem] text-charcoal-faint">
                  Collection {String(index + 1).padStart(2, '0')} · {products.length} arrangements
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-charcoal md:text-4xl">{c.name}</h2>
                <p className="mt-2 font-serif text-lg italic text-burgundy-mist">{c.tagline}</p>
                <p className="mt-4 max-w-md text-[0.9rem] leading-relaxed text-charcoal-soft">{c.description}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-[0.78rem] font-medium uppercase tracking-[0.1em] text-burgundy">
                  View collection <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const collection = collections.find((c) => c.slug === slug);

  useSeo({
    title: collection ? collection.name : 'Collection',
    description: collection?.seoDescription,
    path: `/collections/${slug}`,
    noindex: !collection,
  });

  if (!collection) return <NotFoundState />;

  const products = productsInCollection(collection.id as CollectionId);
  const idx = collections.findIndex((c) => c.id === collection.id);
  const next = collections[(idx + 1) % collections.length];

  return (
    <>
      <PageHero
        eyebrow={`Collection ${String(idx + 1).padStart(2, '0')} · ${products.length} arrangements`}
        title={collection.name}
        intro={collection.description}
        image={collection.heroImage}
        meta={
          <Link to="/collections" className="group inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-burgundy">
            <ArrowLeft size={14} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" /> All collections
          </Link>
        }
      />

      <section className="shell py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
          <aside className="max-w-md">
            <p className="type-label text-[0.6rem] text-charcoal-faint">The story</p>
            {collection.story.map((para, i) => (
              <p key={i} className={cn('text-[0.94rem] leading-[1.8] text-charcoal-soft', i === 0 ? 'mt-4' : 'mt-4')}>
                {para}
              </p>
            ))}
            <dl className="mt-8 space-y-3 border-t border-line pt-6 text-[0.8rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-faint">Palette</dt>
                <dd className="text-right text-charcoal">{collection.paletteName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-faint">Sizes</dt>
                <dd className="text-charcoal">Classic · Deluxe · Grand</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-faint">Delivery</dt>
                <dd className="text-charcoal">Same-day in select zones</dd>
              </div>
            </dl>
          </aside>

          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 lg:gap-x-7">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 3} />
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-line pt-10 md:flex-row md:items-center md:justify-between">
          <p className="text-[0.84rem] text-charcoal-soft">Continue browsing</p>
          <Link to={`/collections/${next.slug}`} className="group inline-flex items-center gap-3">
            <span className="type-label text-[0.58rem] text-charcoal-faint">Next collection</span>
            <span className="font-serif text-2xl text-burgundy">{next.name}</span>
            <ArrowRight size={16} strokeWidth={1.5} className="text-burgundy transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
