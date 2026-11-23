import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'left',
  action,
  className,
  tone = 'default',
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
  tone?: 'default' | 'on-dark';
}) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', align === 'center' && 'md:flex-col md:items-center md:text-center', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
        {eyebrow && (
          <p className={cn('type-label flex items-center gap-3 text-[0.62rem]', tone === 'on-dark' ? 'text-gold-soft' : 'text-charcoal-faint', align === 'center' && 'justify-center')}>
            <span className={cn('inline-block h-px w-8', tone === 'on-dark' ? 'bg-gold/70' : 'bg-gold/70')} aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h2 className={cn('type-heading mt-4', tone === 'on-dark' ? 'text-ivory' : 'text-charcoal')}>{title}</h2>
        {body && <p className={cn('type-body mt-5', tone === 'on-dark' ? 'text-ivory/70' : 'text-charcoal-soft')}>{body}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
