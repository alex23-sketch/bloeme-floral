import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'light';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group relative inline-flex items-center justify-center gap-2 font-sans font-medium tracking-[0.02em] whitespace-nowrap transition-all duration-300 ease-[var(--ease-silk)] disabled:pointer-events-none disabled:opacity-45';

const variants: Record<Variant, string> = {
  primary:
    'bg-burgundy text-ivory hover:bg-burgundy-ink shadow-[0_10px_30px_-18px_rgba(88,31,50,0.8)] hover:shadow-[0_18px_40px_-20px_rgba(88,31,50,0.9)] hover:-translate-y-px',
  secondary:
    'border border-burgundy/35 text-burgundy bg-transparent hover:border-burgundy hover:bg-burgundy hover:text-ivory',
  ghost: 'text-burgundy hover:text-burgundy-ink px-0',
  light: 'bg-ivory text-burgundy hover:bg-rose-soft',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.75rem]',
  md: 'h-11 px-6 text-[0.8125rem]',
  lg: 'h-13 px-8 text-[0.8125rem]',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  fullWidth,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], variant === 'ghost' && 'h-auto p-0', fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  fullWidth,
  onClick,
}: CommonProps & { to: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(base, variants[variant], sizes[size], variant === 'ghost' && 'h-auto p-0', fullWidth && 'w-full', className)}
    >
      {children}
    </Link>
  );
}
