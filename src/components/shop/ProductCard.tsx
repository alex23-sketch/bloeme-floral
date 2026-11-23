import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Product } from '../../types/content';
import { formatPrice, discountPercent } from '../../lib/format';
import { collectionById } from '../../data';
import { cn } from '../../lib/cn';
import { MediaFrame } from '../ui/MediaFrame';
import { useCart } from '../../state/CartContext';

export function ProductCard({ product, priority = false, className }: { product: Product; priority?: boolean; className?: string }) {
  const { add } = useCart();
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const soldOut = !product.inStock;
  const lowStock = product.inStock && product.variants.every((v) => v.inventory > 0 && v.inventory <= 3);

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-ivory-deep" aria-label={`${product.name} — ${formatPrice(product.priceCents)}`}>
        <MediaFrame
          src={product.images[0].src}
          alt={product.images[0].alt}
          priority={priority}
          rounded="none"
          className="aspect-[4/5] w-full"
          imgClassName="transition-transform duration-[1.1s] ease-[var(--ease-silk)] group-hover:scale-[1.045]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/12 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.newArrival && <Badge tone="gold">New</Badge>}
          {product.bestseller && <Badge tone="ivory">Bestseller</Badge>}
          {discount && <Badge tone="burgundy">Atelier price</Badge>}
          {soldOut && <Badge tone="charcoal">Sold out</Badge>}
          {lowStock && !soldOut && <Badge tone="gold">Few left</Badge>}
        </div>
      </Link>

      {!soldOut && (
        <button
          type="button"
          onClick={() => {
            const first = product.variants.find((v) => v.inStock) ?? product.variants[0];
            add(product, first);
          }}
          aria-label={`Quick add ${product.name}, ${product.variants.find((v) => v.inStock)?.label ?? 'Classic'}`}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/60 bg-ivory/85 text-burgundy opacity-0 shadow-sm backdrop-blur transition-all duration-300 hover:bg-burgundy hover:text-ivory focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      )}

      <div className="flex flex-1 flex-col pt-4">
        <p className="type-label text-[0.56rem] text-charcoal-faint">{collectionById[product.collection]?.name}</p>
        <h3 className="mt-1.5 font-serif text-[1.3rem] leading-snug text-charcoal">
          <Link to={`/products/${product.slug}`} className="transition-colors hover:text-burgundy">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.8rem] leading-relaxed text-charcoal-soft">{product.shortDescription}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-[0.86rem] tabular-nums text-charcoal">From {formatPrice(product.priceCents)}</span>
          {product.compareAtPriceCents && (
            <span className="text-[0.76rem] text-charcoal-faint line-through">{formatPrice(product.compareAtPriceCents)}</span>
          )}
          <span className="ml-auto text-[0.7rem] text-charcoal-faint">{product.variants.length} sizes</span>
        </div>
      </div>
    </article>
  );
}

function Badge({ tone, children }: { tone: 'gold' | 'ivory' | 'burgundy' | 'charcoal'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-[0.28rem] text-[0.56rem] font-medium uppercase tracking-[0.16em]',
        tone === 'gold' && 'bg-gold text-burgundy-ink',
        tone === 'ivory' && 'bg-ivory/92 text-charcoal',
        tone === 'burgundy' && 'bg-burgundy text-ivory',
        tone === 'charcoal' && 'bg-charcoal text-ivory',
      )}
    >
      {children}
    </span>
  );
}