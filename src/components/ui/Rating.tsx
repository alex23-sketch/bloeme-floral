import { Star } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Rating({ value, size = 12, className, label }: { value: number; size?: number; className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={label ?? `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.25}
          className={i <= value ? 'fill-gold text-gold' : 'text-line'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
