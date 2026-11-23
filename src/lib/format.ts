import type { Cents } from '../types/content';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdExact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $68 (whole dollars drop cents, as most premium florists price). */
export function formatPrice(cents: Cents): string {
  return Number.isInteger(cents / 100) ? usd.format(cents / 100) : usdExact.format(cents / 100);
}

/** $68.00 — used where totals must align. */
export function formatPriceExact(cents: Cents): string {
  return usdExact.format(cents / 100);
}

export function discountPercent(price: Cents, compareAt: Cents | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** "Tue, Nov 11" from "2026-11-11" — parsed in local time to avoid off-by-one. */
export function formatShortDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return dateFormatter.format(new Date(y, m - 1, d));
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++; // atelier closed Sundays
  }
  return d;
}

/** Plural helper: plural(1, 'stem') → "1 stem", plural(3, 'stem') → "3 stems". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
