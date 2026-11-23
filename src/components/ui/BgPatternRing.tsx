/** Decorative concentric hairline rings — the boutique window motif. */
export function BgPatternRing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="99" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="100" cy="100" r="57" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="100" cy="100" r="36" stroke="currentColor" strokeWidth="0.7" />
      <path d="M100 1v198M1 100h198" stroke="currentColor" strokeWidth="0.35" />
    </svg>
  );
}
