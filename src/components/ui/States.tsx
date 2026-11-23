import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center border border-dashed border-line px-8 py-20 text-center', className)}>
      {icon && <div className="mb-5 text-gold">{icon}</div>}
      <h3 className="font-serif text-[1.75rem] leading-tight text-charcoal">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-charcoal-soft">{body}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something wilted.', body, onRetry }: { title?: string; body: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="border border-danger/25 bg-danger/[0.04] px-6 py-5">
      <p className="font-serif text-xl text-burgundy">{title}</p>
      <p className="mt-1 text-sm text-charcoal-soft">{body}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 text-[0.8rem] text-burgundy underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function ProductSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:gap-x-8" aria-busy="true" aria-label="Loading arrangements">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function NotFoundState() {
  return (
    <div className="mx-auto flex min-h-[62vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="type-label text-[0.62rem] text-charcoal-faint">Page not found</p>
      <h1 className="type-heading mt-4">This arrangement has left the cooler.</h1>
      <p className="type-body mt-4">
        The page you were looking for is not here. It may have moved, or the link may have been mistyped.
      </p>
      <Link to="/shop" className="link-underline mt-6 text-[0.9rem]">
        Browse the collection
      </Link>
    </div>
  );
}
