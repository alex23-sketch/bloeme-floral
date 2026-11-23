import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { activeProducts, collections, collectionById } from '../data';
import type { Product } from '../types/content';
import { ProductCard } from '../components/shop/ProductCard';
import { EmptyState } from '../components/ui/States';
import { useSeo } from '../lib/useSeo';
import { cn } from '../lib/cn';
import { formatPrice } from '../lib/format';

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Alphabetical' },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]['id'];

const PRICE_BANDS = [
  { id: 'all', label: 'Any price', min: 0, max: Infinity },
  { id: 'under-80', label: 'Under $80', min: 0, max: 7999 },
  { id: '80-150', label: '$80 – $150', min: 8000, max: 15000 },
  { id: 'over-150', label: 'Over $150', min: 15001, max: Infinity },
] as const;

/** Pure filter + sort pipeline — exported for unit tests. */
export function filterAndSortProducts(
  all: Product[],
  opts: { collection?: string; q?: string; sort?: string; maxPrice?: string; tag?: string },
): Product[] {
  const q = (opts.q ?? '').trim().toLowerCase();
  let list = all.filter((p) => p.status === 'active');

  if (opts.collection && opts.collection !== 'all') {
    list = list.filter((p) => p.collection === opts.collection);
  }
  if (opts.tag && opts.tag !== 'all') {
    list = list.filter((p) => p.categoryTags.some((t) => t.toLowerCase() === opts.tag!.toLowerCase()));
  }
  if (opts.maxPrice && opts.maxPrice !== 'all') {
    const band = PRICE_BANDS.find((b) => b.id === opts.maxPrice);
    if (band) list = list.filter((p) => p.priceCents >= band.min && p.priceCents <= band.max);
  }
  if (q.length >= 2) {
    list = list.filter((p) => {
      const hay = [p.name, p.shortDescription, p.description, p.flowerTypes.join(' '), p.categoryTags.join(' '), collectionById[p.collection]?.name ?? '']
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every((token) => hay.includes(token));
    });
  }

  const sort = (opts.sort ?? 'featured') as SortId;
  const sorted = [...list];
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      break;
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.bestseller) - Number(a.bestseller) || a.name.localeCompare(b.name));
  }
  return sorted;
}

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const collection = params.get('collection') ?? 'all';
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'featured';
  const price = params.get('price') ?? 'all';
  const tag = params.get('tag') ?? 'all';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const results = useMemo(() => filterAndSortProducts(activeProducts, { collection, q, sort, maxPrice: price, tag }), [collection, q, sort, price, tag]);
  const activeCollection = collection !== 'all' ? collectionById[collection as keyof typeof collectionById] : null;
  const allTags = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach((p) => p.categoryTags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, []);
  const hasFilters = collection !== 'all' || q.trim().length > 0 || price !== 'all' || tag !== 'all';

  useSeo({
    title: activeCollection ? `${activeCollection.name} — Shop` : 'Shop All Arrangements',
    description: activeCollection?.seoDescription ?? 'Browse all 36 Bloomé arrangements — garden roses, seasonal blooms, wedding florals and luxury pieces, delivered across the Arcadia metro.',
    path: '/shop',
  });

  return (
    <>
      <section className="border-b border-line/70">
        <div className="shell py-12 md:py-16">
          <p className="type-label flex items-center gap-3 text-[0.62rem] text-charcoal-faint">
            <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
            {activeCollection ? activeCollection.name : 'The collection'}
          </p>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="type-hero text-charcoal">{activeCollection ? activeCollection.name : 'The whole cooler'}</h1>
              <p className="type-lead mt-4 max-w-2xl">
                {activeCollection ? activeCollection.description : 'Every arrangement in the atelier — filter by occasion, palette or price, or search for a bloom.'}
              </p>
            </div>
            <p className="text-[0.8rem] text-charcoal-faint md:text-right" aria-live="polite">
              {results.length} {results.length === 1 ? 'arrangement' : 'arrangements'}
            </p>
          </div>
        </div>
      </section>

      <div className="shell py-8 md:py-12">
        {/* toolbar */}
        <div className="flex flex-col gap-4 border-y border-line py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <Search size={16} strokeWidth={1.25} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-faint" />
            <label htmlFor="shop-search" className="sr-only">
              Search the shop
            </label>
            <input
              id="shop-search"
              type="search"
              value={q}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Search by flower, occasion or colour…"
              className="h-11 w-full border border-line bg-ivory-paper pl-10 pr-9 text-sm text-charcoal placeholder:text-charcoal-faint focus:border-gold focus:outline-none"
            />
            {q && (
              <button type="button" onClick={() => update('q', '')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-faint hover:text-charcoal">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="sort-select" className="type-label text-[0.58rem] text-charcoal-faint">
              Sort
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => update('sort', e.target.value)}
              className="h-10 border border-line bg-ivory-paper px-3 text-[0.82rem] text-charcoal focus:border-gold focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <label htmlFor="price-select" className="type-label ml-2 text-[0.58rem] text-charcoal-faint">
              Price
            </label>
            <select
              id="price-select"
              value={price}
              onChange={(e) => update('price', e.target.value)}
              className="h-10 border border-line bg-ivory-paper px-3 text-[0.82rem] text-charcoal focus:border-gold focus:outline-none"
            >
              {PRICE_BANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* collection chips */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Filter by collection">
          <span className="mr-1 hidden shrink-0 items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-charcoal-faint sm:inline-flex">
            <SlidersHorizontal size={13} strokeWidth={1.25} /> Collections
          </span>
          <Chip active={collection === 'all'} onClick={() => update('collection', 'all')}>
            All
          </Chip>
          {collections.map((c) => (
            <Chip key={c.id} active={collection === c.id} onClick={() => update('collection', c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>

        {/* tag chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by occasion">
          <Chip active={tag === 'all'} onClick={() => update('tag', 'all')} small>
            Every occasion
          </Chip>
          {allTags.map((t) => (
            <Chip key={t} active={tag === t} onClick={() => update('tag', t)} small>
              {t}
            </Chip>
          ))}
        </div>

        {hasFilters && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-ivory-deep/40 px-4 py-3 text-[0.78rem] text-charcoal-soft">
            <span>
              Filtering {results.length} of {activeProducts.length} arrangements
              {q && <> for “{q}”</>}
              {collection !== 'all' && <> in {activeCollection?.name}</>}
              {price !== 'all' && <> · {PRICE_BANDS.find((b) => b.id === price)?.label}</>}
              {tag !== 'all' && <> · {tag}</>}
            </span>
            <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 text-burgundy underline underline-offset-4">
              Clear all filters <X size={13} />
            </button>
          </div>
        )}

        {/* results */}
        <div className="mt-10" aria-live="polite">
          {results.length === 0 ? (
            <EmptyState
              title="No arrangements match that."
              body="Try a wider price band, another collection, or search for a single bloom like ‘peony’ or ‘tulip’."
              action={
                <button type="button" onClick={clearAll} className="inline-flex h-11 items-center border border-burgundy/30 px-6 text-[0.78rem] uppercase tracking-[0.1em] text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-ivory">
                  Reset filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </div>

        <p className="mt-14 border-t border-line pt-6 text-[0.72rem] leading-relaxed text-charcoal-faint">
          Prices shown are for the Classic size; Deluxe and Grand sizes are priced on each product page. From {formatPrice(Math.min(...activeProducts.map((p) => p.priceCents)))} to{' '}
          {formatPrice(Math.max(...activeProducts.map((p) => p.priceCents)))}. Demonstration catalog — no orders are fulfilled.
        </p>
      </div>
    </>
  );
}

function Chip({ active, onClick, children, small }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 border transition-colors duration-200',
        small ? 'px-2.5 py-1 text-[0.7rem]' : 'px-3.5 py-1.5 text-[0.76rem]',
        active ? 'border-burgundy bg-burgundy text-ivory' : 'border-line bg-ivory-paper text-charcoal-soft hover:border-burgundy/40 hover:text-burgundy',
      )}
    >
      {children}
    </button>
  );
}