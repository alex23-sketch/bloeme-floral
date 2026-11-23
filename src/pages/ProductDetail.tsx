import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronDown, Heart, Leaf, Ruler, Truck, Package as Vase, Plus, Minus } from 'lucide-react';
import { productsBySlug, collectionById, relatedProducts, deliveryZones } from '../data';
import { useCart } from '../state/CartContext';
import { formatPrice, formatShortDate, discountPercent } from '../lib/format';
import { GIFT_MESSAGE_MAX } from '../lib/cart';
import { useSeo } from '../lib/useSeo';
import { MediaFrame } from '../components/ui/MediaFrame';
import { ProductCard } from '../components/shop/ProductCard';
import { NotFoundState } from '../components/ui/States';
import { cn } from '../lib/cn';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? productsBySlug[slug] : undefined;

  const [sizeId, setSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [giftMessage, setGiftMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const navigate = useNavigate();

  const variant = useMemo(() => product?.variants.find((v) => v.id === sizeId) ?? product?.variants.find((v) => v.inStock) ?? product?.variants[0], [product, sizeId]);

  const variants = product?.variants;

  useEffect(() => {
    setSizeId(variants?.find((v) => v.inStock)?.id ?? variants?.[0]?.id ?? null);
    setQuantity(1);
    setGiftMessage('');
    setDeliveryDate('');
    setActiveImage(0);
    setFavorite(false);
    setAdded(false);
  }, [product?.id, variants]);

  useSeo({
    title: product ? product.seoTitle : 'Arrangement',
    description: product?.seoDescription,
    path: product ? `/products/${product.slug}` : '/products',
    image: product?.images[0]?.src,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.shortDescription,
          sku: product.sku,
          image: product.images.map((i) => i.src),
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: (product.priceCents / 100).toFixed(0),
            highPrice: (product.variants[2].priceCents / 100).toFixed(0),
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }
      : undefined,
  });

  if (!product) return <NotFoundState />;

  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const inStock = variant?.inStock ?? false;
  const lowStock = inStock && (variant?.inventory ?? 0) <= 3;
  const collection = collectionById[product.collection];
  const related = relatedProducts(product, 4);

  const handleAdd = () => {
    if (!variant) return;
    add(product, variant, quantity, { giftMessage, deliveryDate: deliveryDate || null });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + (deliveryZones.some((z) => z.sameDayAvailable) ? 0 : 1));

  return (
    <div className="shell py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="text-[0.72rem] text-charcoal-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link to="/" className="hover:text-burgundy">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to="/shop" className="hover:text-burgundy">Shop</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to={`/collections/${collection.slug}`} className="hover:text-burgundy">{collection.name}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-charcoal">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* gallery */}
        <section aria-label="Product images">
          <div className="arch relative overflow-hidden border border-line/70 shadow-[var(--shadow-lift)]">
            <MediaFrame src={product.images[activeImage].src} alt={product.images[activeImage].alt} priority rounded="none" className="aspect-[4/4.6] w-full" />
            {product.newArrival && <span className="absolute left-4 top-4 bg-gold px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-burgundy-ink">New arrival</span>}
            {!product.inStock && <span className="absolute left-4 top-4 bg-charcoal px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-ivory">Sold out</span>}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3" role="tablist" aria-label="Image gallery">
            {product.images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                role="tab"
                aria-selected={activeImage === i}
                aria-label={`View image ${i + 1} of ${product.images.length}`}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'overflow-hidden border transition-colors',
                  activeImage === i ? 'border-burgundy' : 'border-line hover:border-gold',
                )}
              >
                <MediaFrame src={img.src} alt="" rounded="none" className="aspect-square w-full" />
              </button>
            ))}
          </div>
          <p className="mt-3 text-[0.7rem] text-charcoal-faint">Gallery imagery is generated from the built-in art system — replace with studio photography via the catalog data.</p>
        </section>

        {/* purchase panel */}
        <section>
          <p className="type-label text-[0.58rem] text-charcoal-faint">{collection.name} · {product.flowerTypes.join(' · ')}</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] text-charcoal md:text-5xl">{product.name}</h1>
          <p className="mt-3 font-serif text-xl italic text-burgundy-mist">{product.shortDescription}</p>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-line py-5">
            <p className="font-serif text-[2rem] text-charcoal">{formatPrice(variant?.priceCents ?? product.priceCents)}</p>
            {variant?.compareAtPriceCents && <s className="text-[1rem] text-charcoal-faint">{formatPrice(variant.compareAtPriceCents)}</s>}
            {discount && <span className="bg-gold/20 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-burgundy">{discount}% atelier price</span>}
            <span className="ml-auto text-[0.74rem] text-charcoal-faint">{variant?.stems}</span>
          </div>

          {/* size selector */}
          <fieldset className="mt-6">
            <legend className="flex w-full items-center justify-between">
              <span className="type-label text-[0.6rem] text-charcoal-faint">Size</span>
              <span className="text-[0.74rem] text-charcoal-soft">{variant?.label} — {variant?.stems} · {variant?.description.split('.')[0]}</span>
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setSizeId(v.id); setQuantity(1); }}
                  aria-pressed={variant?.id === v.id}
                  disabled={!v.inStock}
                  className={cn(
                    'relative flex flex-col items-start border px-3.5 py-3 text-left transition-all duration-200',
                    variant?.id === v.id ? 'border-burgundy bg-burgundy/[0.04] shadow-[0_0_0_1px_#581F32]' : 'border-line hover:border-burgundy/40',
                    !v.inStock && 'opacity-45 hover:border-line',
                  )}
                >
                  <span className={cn('font-serif text-[1.05rem]', variant?.id === v.id ? 'text-burgundy' : 'text-charcoal')}>{v.label}</span>
                  <span className="mt-0.5 text-[0.72rem] tabular-nums text-charcoal-soft">{formatPrice(v.priceCents)}</span>
                  {!v.inStock && <span className="mt-1 text-[0.6rem] uppercase tracking-wider text-charcoal-faint">Sold out</span>}
                </button>
              ))}
            </div>
          </fieldset>

          {/* quantity + gift */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="qty" className="type-label text-[0.6rem] text-charcoal-faint">Quantity</label>
              <div className="mt-2.5 flex h-12 items-center justify-between border border-line bg-ivory-paper px-2">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center text-charcoal disabled:opacity-30">
                  <Minus size={14} strokeWidth={1.5} />
                </button>
                <span className="text-[0.85rem] tabular-nums" aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => Math.min(12, q + 1))} disabled={quantity >= 12} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center text-charcoal disabled:opacity-30">
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="delivery-date" className="type-label text-[0.6rem] text-charcoal-faint">Deliver on</label>
              <input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                min={minDate.toISOString().slice(0, 10)}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="mt-2.5 h-12 w-full border border-line bg-ivory-paper px-3 text-[0.82rem] text-charcoal focus:border-gold focus:outline-none"
              />
              {deliveryDate && <p className="mt-1 text-[0.7rem] text-charcoal-faint">Requested for {formatShortDate(deliveryDate)}</p>}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="gift-message" className="type-label text-[0.6rem] text-charcoal-faint">
              Handwritten card <span className="normal-case text-charcoal-faint/70">(optional)</span>
            </label>
            <textarea
              id="gift-message"
              rows={3}
              maxLength={GIFT_MESSAGE_MAX}
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              placeholder="A message we will set by hand on the atelier card — up to 240 characters."
              className="mt-2.5 w-full resize-none border border-line bg-ivory-paper px-3.5 py-3 text-[0.86rem] text-charcoal placeholder:text-charcoal-faint focus:border-gold focus:outline-none"
            />
            <p className="mt-1 text-right text-[0.66rem] text-charcoal-faint">{giftMessage.length}/{GIFT_MESSAGE_MAX}</p>
          </div>

          {lowStock && (
            <p className="mt-4 flex items-center gap-2 bg-gold/15 px-3.5 py-2.5 text-[0.78rem] text-burgundy">
              <span className="inline-block h-2 w-2 rounded-full bg-gold" aria-hidden="true" /> Only {variant?.inventory} left in this size — bouquets sell through by mid-week in season.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock}
              aria-live="polite"
              className={cn(
                'inline-flex h-13 flex-1 items-center justify-center gap-2 px-8 text-[0.8rem] font-medium uppercase tracking-[0.1em] transition-all duration-300',
                inStock ? (added ? 'bg-success text-ivory' : 'bg-burgundy text-ivory hover:bg-burgundy-ink') : 'cursor-not-allowed bg-charcoal-faint/40 text-ivory',
              )}
            >
              {added ? (<><Check size={16} strokeWidth={1.75} /> Added</>) : inStock ? 'Add to cart' : 'Sold out — contact the atelier'}
            </button>
            <button
              type="button"
              onClick={() => setFavorite((f) => !f)}
              aria-pressed={favorite}
              aria-label={favorite ? 'Remove from wishlist' : 'Save to wishlist'}
              className={cn(
                'inline-flex h-13 items-center justify-center border px-5 transition-colors',
                favorite ? 'border-burgundy bg-burgundy/5 text-burgundy' : 'border-line text-charcoal-soft hover:border-burgundy/40 hover:text-burgundy',
              )}
            >
              <Heart size={17} strokeWidth={1.25} className={favorite ? 'fill-burgundy' : ''} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2.5 text-[0.8rem] text-charcoal-soft sm:grid-cols-3">
            <p className="flex items-center gap-2.5"><Truck size={15} strokeWidth={1.25} className="shrink-0 text-gold" /> Same-day in select zones</p>
            <p className="flex items-center gap-2.5"><Vase size={15} strokeWidth={1.25} className="shrink-0 text-gold" /> {product.vaseIncluded ? 'Vase included' : 'Delivered in paper wrap'}</p>
            <p className="flex items-center gap-2.5"><Ruler size={15} strokeWidth={1.25} className="shrink-0 text-gold" /> {product.dimensionsIn.width}″ × {product.dimensionsIn.height}″</p>
          </div>

          {/* colour palette */}
          <div className="mt-6 border-t border-line pt-5">
            <p className="type-label text-[0.6rem] text-charcoal-faint">Palette</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {product.colorPalette.map((c) => (
                <span key={c.name} className="inline-flex items-center gap-2 text-[0.72rem] text-charcoal-soft">
                  <span className="inline-block h-4 w-4 rounded-full border border-charcoal/15" style={{ background: c.hex }} aria-hidden="true" />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* description + care */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
        <section>
          <p className="type-label text-[0.6rem] text-charcoal-faint">About this arrangement</p>
          <div className="type-body mt-4 space-y-4 text-[0.97rem]">
            {product.description.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <p className="type-label flex items-center gap-2 text-[0.6rem] text-charcoal-faint"><Leaf size={13} strokeWidth={1.25} className="text-gold" /> Care instructions</p>
            <ul className="mt-4 space-y-2.5">
              {product.careInstructions.map((c) => (
                <li key={c} className="flex gap-3 text-[0.86rem] leading-relaxed text-charcoal-soft">
                  <span className="mt-[0.55rem] inline-block h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" /> {c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="h-fit border border-line bg-ivory-paper p-6 md:p-8">
          <p className="type-label text-[0.6rem] text-charcoal-faint">The fine print</p>
          <ul className="mt-4 space-y-4 text-[0.82rem] text-charcoal-soft">
            <li>
              <p className="font-medium text-charcoal">Sourced with the season</p>
              <p className="mt-0.5 text-[0.76rem]">Bloom substitutions follow our growers’ arrivals and never change the silhouette of the piece.</p>
            </li>
            <li>
              <p className="font-medium text-charcoal">Composed the morning of</p>
              <p className="mt-0.5 text-[0.76rem]">Hand-tied the day it travels, in the studio on Rue des Jardins.</p>
            </li>
            <li>
              <p className="font-medium text-charcoal">Delivered by hand</p>
              <p className="mt-0.5 text-[0.76rem]">Our couriers deliver across the metro with a prepared resting spot in mind.</p>
            </li>
            <li className="border-t border-line pt-4">
              <p className="text-[0.74rem] italic leading-relaxed text-charcoal-faint">
                Demonstration listing. No payment is taken, and no order is sent when you use this demo checkout.
              </p>
            </li>
          </ul>
          <button type="button" onClick={() => navigate(`/contact?topic=wedding`)} className="link-underline mt-5 text-[0.8rem]">
            Speak with the studio
          </button>
        </aside>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-3xl text-charcoal">Pairs well with</h2>
            <Link to={`/collections/${collection.slug}`} className="type-label flex items-center gap-1.5 text-[0.62rem] text-burgundy">
              More from {collection.name} <ChevronDown size={13} className="rotate-[-90deg]" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}