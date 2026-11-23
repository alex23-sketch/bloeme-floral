import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

/**
 * The Bloomé monogram — an open ring with the house initial and a single
 * leaf, hand-drawn as inline SVG so the logo ships with the template and
 * recolours from the brand tokens.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('h-10 w-10', className)} aria-hidden="true">
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.85" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
      {/* leaf climbing the ring at the top right */}
      <path
        d="M40.6 13.4 C46.2 11.3 46.9 4.2 43.6 2.4 C41.1 1 36.6 4.4 37.2 9.6 C37.4 11.2 38.6 12.6 40.6 13.4 Z"
        fill="currentColor"
        opacity="0.9"
        transform="rotate(18 40 8)"
      />
      <path d="M38.6 11.6 C39.5 10.2 40 8.6 40 7 C40 5.2 39.6 3.6 39 2.6" stroke="var(--color-gold)" strokeWidth="0.6" fill="none" opacity="0.9" transform="rotate(18 40 8)" />
      <text
        x="24"
        y="31.5"
        textAnchor="middle"
        fontFamily="var(--font-serif)"
        fontSize="20"
        fontWeight="500"
        fill="currentColor"
        letterSpacing="0.5"
      >
        B
      </text>
    </svg>
  );
}

export function Logo({
  to = '/',
  variant = 'full',
  className,
  iconClassName,
  onNavigate,
}: {
  to?: string;
  variant?: 'full' | 'mark';
  className?: string;
  iconClassName?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-label="Bloomé Floral — home"
      className={cn('inline-flex items-center gap-3 text-burgundy', className)}
    >
      <Monogram className={cn('h-11 w-11 text-burgundy', iconClassName)} />
      {variant === 'full' && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.45rem] font-medium tracking-[0.06em]" style={{ letterSpacing: '0.14em' }}>
            BLOOMÉ
          </span>
          <span className="mt-1.5 text-[0.55rem] font-medium uppercase tracking-[0.42em] text-charcoal-soft/80">
            Floral <span className="text-gold">·</span> Atelier
          </span>
        </span>
      )}
    </Link>
  );
}