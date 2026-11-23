import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { activeProducts, collections, collectionById } from '../../data';
import { formatPrice } from '../../lib/format';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { cn } from '../../lib/cn';
import { MediaFrame } from '../ui/MediaFrame';

/** Tokenises a query and scores products — name hits outrank flowers, tags, collection. */
export function searchProducts(query: string, limit = 6) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/);
  const scored = activeProducts
    .map((p) => {
      const hayname = p.name.toLowerCase();
      const flowers = p.flowerTypes.join(' ').toLowerCase();
      const tags = p.categoryTags.join(' ').toLowerCase();
      const coll = collectionById[p.collection]?.name.toLowerCase() ?? '';
      const short = p.shortDescription.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (hayname.includes(t)) score += 8;
        if (flowers.includes(t)) score += 4;
        if (tags.includes(t)) score += 3;
        if (coll.includes(t)) score += 3;
        if (short.includes(t)) score += 1;
      }
      // bonus for exact prefix
      if (hayname.startsWith(q)) score += 6;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.p);
}

const SUGGESTIONS = ['Roses', 'Peony', 'Birthday', 'Sympathy', 'Wedding', 'Luxury', 'Autumn'];

export function SearchDialog({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useLockBodyScroll(open);

  const results = useMemo(() => searchProducts(query), [query]);
  const matchingCollections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return collections.filter((c) => `${c.name} ${c.tagline} ${c.description}`.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const go = (path: string) => {
    onClose();
    onNavigate(path);
  };

  return (
    <div className={cn('fixed inset-0 z-50', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
      <div
        className={cn('absolute inset-0 bg-charcoal/45 backdrop-blur-[3px] transition-opacity duration-400', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the atelier"
        className={cn(
          'absolute inset-x-0 top-0 mx-auto flex max-h-[88vh] w-full max-w-2xl flex-col bg-ivory-paper shadow-[var(--shadow-menu)] transition-all duration-500 ease-[var(--ease-silk)] sm:top-[10vh] sm:rounded-xl sm:border sm:border-line',
          open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
        )}
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) go(`/products/${results[0].slug}`);
            else go(`/shop?q=${encodeURIComponent(query)}`);
          }}
          className="flex items-center gap-3 border-b border-line px-5 py-4"
        >
          <Search size={19} strokeWidth={1.25} className="shrink-0 text-burgundy" />
          <label htmlFor="search-input" className="sr-only">
            Search arrangements
          </label>
          <input
            ref={inputRef}
            id="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Roses, peonies, ‘sympathy in white’…"
            autoComplete="off"
            className="h-9 flex-1 bg-transparent font-serif text-lg text-charcoal placeholder:font-sans placeholder:text-[0.9rem] placeholder:text-charcoal-faint focus:outline-none"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[0.62rem] text-charcoal-faint sm:block">ESC</kbd>
          <button type="button" onClick={onClose} aria-label="Close search" className="inline-flex h-8 w-8 items-center justify-center text-charcoal-faint hover:text-charcoal sm:hidden">
            <X size={18} />
          </button>
        </form>

        <div className="overflow-y-auto px-5 py-5">
          {query.trim().length < 2 ? (
            <>
              <p className="type-label text-[0.6rem] text-charcoal-faint">Popular searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-line px-3.5 py-1.5 text-[0.8rem] text-charcoal-soft transition-colors hover:border-burgundy hover:text-burgundy"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="type-label mt-7 text-[0.6rem] text-charcoal-faint">Jump to a collection</p>
              <ul className="mt-3 grid grid-cols-2 gap-1.5">
                {collections.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => go(`/collections/${c.slug}`)}
                      className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[0.85rem] text-charcoal-soft transition-colors hover:bg-ivory hover:text-burgundy"
                    >
                      {c.name}
                      <ArrowUpRight size={13} strokeWidth={1.25} className="opacity-50" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : results.length === 0 && matchingCollections.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-serif text-xl text-charcoal">Nothing in the cooler matches “{query}”.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-charcoal-soft">
                Try a flower (‘peony’, ‘tulip’), an occasion (‘birthday’, ‘sympathy’) or a colour (‘blush’, ‘burgundy’).
              </p>
              <button type="button" onClick={() => go(`/shop?q=${encodeURIComponent(query)}`)} className="mt-4 text-[0.82rem] text-burgundy underline underline-offset-4">
                Search the full shop instead
              </button>
            </div>
          ) : (
            <>
              {matchingCollections.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {matchingCollections.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => go(`/collections/${c.slug}`)}
                        className="flex w-full items-center justify-between rounded-md bg-ivory px-3 py-2 text-left hover:bg-rose-soft/50"
                      >
                        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-charcoal-faint">Collection</span>
                        <span className="font-serif text-[1.05rem] text-burgundy">{c.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="divide-y divide-line/70">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => go(`/products/${p.slug}`)}
                      className="group flex w-full items-center gap-4 py-3 text-left"
                    >
                      <MediaFrame src={p.images[0].src} alt={p.name} rounded="soft" className="h-14 w-12 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[1.05rem] text-charcoal group-hover:text-burgundy">{p.name}</span>
                        <span className="block truncate text-[0.75rem] text-charcoal-faint">{collectionById[p.collection]?.name}</span>
                      </span>
                      <span className="text-[0.82rem] tabular-nums text-charcoal-soft">{formatPrice(p.priceCents)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => go(`/shop?q=${encodeURIComponent(query)}`)}
                className="mt-3 inline-flex items-center gap-1 text-[0.8rem] text-burgundy underline underline-offset-4"
              >
                See all results in the shop <ArrowUpRight size={13} strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
        <div className="border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/shop');
            }}
            className="text-[0.72rem] text-charcoal-faint hover:text-burgundy"
          >
            Browse all 36 arrangements
          </button>
        </div>
      </div>
    </div>
  );
}