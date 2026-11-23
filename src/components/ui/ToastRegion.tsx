import { useCart } from '../../state/CartContext';

/**
 * Live region for cart announcements. The cart drawer opens on add, so this
 * exists mainly so screen-reader users hear confirmation without moving focus.
 */
export function ToastRegion() {
  const { lastAdded } = useCart();
  return (
    <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
      {lastAdded ?? ''}
    </div>
  );
}
