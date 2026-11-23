import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { MediaFrame } from './MediaFrame';

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  meta,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  image?: { src: string; alt: string };
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('relative overflow-hidden border-b border-line/70', className)}>
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.25fr_0.75fr] md:items-end md:py-20 lg:gap-20">
        <div className="anim-rise max-w-2xl">
          <p className="type-label flex items-center gap-3 text-[0.62rem] text-charcoal-faint">
            <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="type-hero mt-5 text-charcoal">{title}</h1>
          {intro && <p className="type-lead mt-6">{intro}</p>}
          {meta && <div className="mt-8">{meta}</div>}
        </div>
        {image && (
          <div className="arch anim-veil hidden max-h-[21rem] w-full overflow-hidden border border-line/60 shadow-[var(--shadow-lift)] md:block">
            <MediaFrame src={image.src} alt={image.alt} priority rounded="none" className="h-full min-h-[21rem] w-full" />
          </div>
        )}
      </div>
    </section>
  );
}
