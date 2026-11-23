import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { navigation, collections } from '../../data';
import { useCart } from '../../state/CartContext';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { Logo } from '../ui/Logo';
import { SearchDialog } from '../shop/SearchDialog';
import { MediaFrame } from '../ui/MediaFrame';

const topLevel = navigation.filter((n) => !n.hidden);

export function Header() {
  const { totals, open: openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const location = useLocation();
  const navigate = useNavigate();

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close overlays on navigation
  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setMegaOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Skip link target
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-burgundy focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500 ease-[var(--ease-silk)]',
          scrolled
            ? 'border-line/80 bg-ivory/92 shadow-[0_10px_30px_-30px_rgba(41,36,38,0.6)] backdrop-blur-md'
            : 'border-transparent bg-ivory/0',
        )}
      >
        <div className="shell flex h-[4.5rem] items-center justify-between gap-4 md:h-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="-ml-2 inline-flex h-11 w-11 items-center justify-center text-burgundy lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu strokeWidth={1.25} size={22} />
            </button>
            <Logo iconClassName="h-10 w-10 md:h-11 md:w-11" />
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {topLevel.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => {
                  window.clearTimeout(closeTimer.current);
                  if (item.children) setMegaOpen(true);
                }}
                onMouseLeave={() => {
                  if (item.children) closeTimer.current = window.setTimeout(() => setMegaOpen(false), 120);
                }}
              >
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'relative inline-flex h-10 items-center gap-1 px-3.5 text-[0.78rem] font-medium tracking-[0.08em] text-charcoal-soft uppercase transition-colors',
                      'after:absolute after:bottom-1.5 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-gold after:transition-all after:duration-300 hover:text-burgundy hover:after:w-5',
                      (isActive || (item.children && megaOpen && item.href === '/shop')) && 'text-burgundy after:w-5',
                    )
                  }
                  aria-haspopup={item.children ? 'true' : undefined}
                >
                  {item.label}
                  {item.children && <ChevronDown size={12} strokeWidth={1.5} className="mt-px transition-transform duration-300" />}
                </NavLink>

                {item.children && megaOpen && (
                  <div
                    className="anim-fade absolute left-1/2 top-full w-[min(46rem,calc(100vw-3rem))] -translate-x-1/2 pt-3"
                    onMouseEnter={() => window.clearTimeout(closeTimer.current)}
                  >
                    <div className="grid grid-cols-[1fr_1.15fr] gap-0 overflow-hidden rounded-b-2xl rounded-t-md border border-line bg-ivory-paper shadow-[var(--shadow-menu)]">
                      <ul className="p-6">
                        {item.children
                          .filter((c) => c.id === 'nav-shop-all')
                          .map((c) => (
                            <li key={c.id}>
                              <Link to={c.href} className="group block border-b border-line pb-4">
                                <span className="type-title text-[1.4rem] text-burgundy transition-colors group-hover:text-burgundy-mist">
                                  {c.label}
                                </span>
                                <span className="mt-1 block text-[0.8rem] text-charcoal-faint">All 36 arrangements, by occasion or palette</span>
                              </Link>
                            </li>
                          ))}
                        <li className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
                          {item.children
                            .filter((c) => c.id !== 'nav-shop-all')
                            .map((c) => (
                              <Link
                                key={c.id}
                                to={c.href}
                                className="py-1.5 text-[0.84rem] text-charcoal-soft transition-colors hover:text-burgundy"
                              >
                                {c.label}
                              </Link>
                            ))}
                        </li>
                      </ul>
                      <div className="relative hidden border-l border-line sm:block">
                        <Link to="/collections/signature-roses" className="group block h-full">
                          <MediaFrame
                            src={collections[0].heroImage.src}
                            alt={collections[0].heroImage.alt}
                            rounded="none"
                            className="h-full min-h-[18rem] w-full"
                            imgClassName="group-hover:scale-[1.04]"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/70 to-transparent p-5">
                            <p className="type-label text-[0.58rem] text-gold-soft">The house collection</p>
                            <p className="mt-1 font-serif text-2xl text-ivory">Signature Roses</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search arrangements"
              className="inline-flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-burgundy"
            >
              <Search strokeWidth={1.25} size={19} />
            </button>
            <button
              type="button"
              onClick={openCart}
              className="relative inline-flex h-11 items-center gap-2 px-2 text-charcoal transition-colors hover:text-burgundy"
              aria-label={`Open cart, ${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}`}
            >
              <ShoppingBag strokeWidth={1.25} size={19} />
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.62rem] font-medium transition-colors',
                  totals.itemCount > 0 ? 'bg-burgundy text-ivory' : 'bg-ivory-deep text-charcoal-soft',
                )}
                aria-hidden="true"
              >
                {totals.itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} onSearch={() => setSearchOpen(true)} />

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={(slug) => navigate(slug)} />
    </>
  );
}

function MobileMenu({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const [shopOpen, setShopOpen] = useState(true);
  return (
    <div
      className={cn('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        className={cn('absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] transition-opacity duration-500', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(24rem,88vw)] flex-col bg-ivory-paper shadow-[var(--shadow-menu)] transition-transform duration-500 ease-[var(--ease-silk)]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <Logo iconClassName="h-10 w-10" onNavigate={onClose} />
          <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex h-10 w-10 items-center justify-center text-charcoal">
            <X strokeWidth={1.25} size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearch();
            }}
            className="mb-6 flex w-full items-center gap-3 rounded-full border border-line bg-ivory px-4 py-3 text-sm text-charcoal-faint"
          >
            <Search size={16} strokeWidth={1.25} /> Search arrangements
          </button>
          <nav aria-label="Mobile">
            <ul className="divide-y divide-line/70">
              {topLevel.map((item) => (
                <li key={item.id}>
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShopOpen((v) => !v)}
                        aria-expanded={shopOpen}
                        className="flex w-full items-center justify-between py-4 text-left font-serif text-[1.35rem] text-charcoal"
                      >
                        {item.label}
                        <ChevronDown size={18} strokeWidth={1.25} className={cn('transition-transform', shopOpen && 'rotate-180')} />
                      </button>
                      {shopOpen && (
                        <ul className="pb-3">
                          {item.children.map((c) => (
                            <li key={c.id}>
                              <Link to={c.href} onClick={onClose} className="block py-2 pl-3 text-[0.9rem] text-charcoal-soft">
                                {c.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link to={item.href} onClick={onClose} className="block py-4 font-serif text-[1.35rem] text-charcoal">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-line px-6 py-5">
          <p className="type-label text-[0.6rem] text-charcoal-faint">Atelier</p>
          <p className="mt-2 text-sm text-charcoal-soft">118 Rue des Jardins, Arcadia</p>
          <p className="text-sm text-charcoal-soft">
            Mon–Wed & Sat 10–6 · Thu–Fri 10–7 · Sun closed
          </p>
        </div>
      </div>
    </div>
  );
}