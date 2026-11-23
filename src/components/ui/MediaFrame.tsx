import { useState } from 'react';
import { cn } from '../../lib/cn';
import { FloralArt, type FloralVariant } from './FloralArt';

/**
 * MediaFrame — the single image component for the whole template.
 *
 * Any `src` of the form `art://<palette>/<variant>/<seed>[/<frame>]` renders the
 * built-in botanical artwork (no network, no licensing issues, deterministic).
 * Anything else renders a photograph <img> with lazy loading, decoding hints and
 * a graceful fallback to the art system if the image fails to load.
 */

export const ART_PREFIX = 'art://';

type ArtSpec = { palette: string; variant: FloralVariant; seed: string; frame: string };

export function parseArtSrc(src: string): ArtSpec | null {
  if (!src.startsWith(ART_PREFIX)) return null;
  const [palette = 'blush', variant = 'rose', seed = 'seed', frame = 'full'] = src.slice(ART_PREFIX.length).split('/');
  return { palette, variant: variant as FloralVariant, seed, frame };
}

/** Palette that suits each product collection, used for CMS-managed art. */
export const COLLECTION_PALETTE: Record<string, string> = {
  'signature-roses': 'blush',
  'birthday-flowers': 'sunlit',
  'wedding-romance': 'porcelain',
  'sympathy-remembrance': 'lavender',
  'seasonal-blooms': 'autumn',
  'luxury-arrangements': 'burgundy',
};

export function MediaFrame({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  sizes,
  rounded = 'arch',
  seedOffset,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Above-the-fold images load eagerly without lazy decoding. */
  priority?: boolean;
  sizes?: string;
  rounded?: 'arch' | 'soft' | 'none';
  /** Shift the art's deterministic seed (used for gallery variants). */
  seedOffset?: string;
  children?: React.ReactNode;
}) {
  const art = parseArtSrc(src);
  const [failed, setFailed] = useState(false);
  const radius = rounded === 'arch' ? 'arch' : rounded === 'soft' ? 'rounded-2xl' : '';

  if (art || failed) {
    const spec = art ?? { palette: 'blush', variant: 'rose' as FloralVariant, seed: 'fallback', frame: 'full' };
    return (
      <div className={cn('relative isolate overflow-hidden bg-ivory-deep', radius, className)}>
        <FloralArt
          variant={spec.variant}
          palette={spec.palette}
          seed={`${spec.seed}${seedOffset ?? ''}${spec.frame}`}
          className={cn(
            'h-full w-full',
            spec.frame === 'detail' && 'scale-[2.2] origin-[40%_30%]',
            spec.frame === 'arch' && 'scale-105',
            priority ? 'anim-fade' : '',
          )}
        />
        <span className="sr-only">{alt}</span>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('relative isolate overflow-hidden bg-ivory-deep', radius, className)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        sizes={sizes}
        onError={() => setFailed(true)}
        className={cn(priority ? 'anim-fade' : '', 'h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-silk)]', imgClassName)}
      />
      {children}
    </div>
  );
}
