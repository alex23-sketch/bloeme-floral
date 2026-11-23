import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, Mail } from 'lucide-react';
import { brand, contactDetails, footerNavigation, storeLocation } from '../../data';
import { Logo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="mt-24 bg-burgundy text-ivory">
      <div className="shell">
        {/* newsletter strip */}
        <div className="flex flex-col gap-6 border-b border-ivory/15 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <p className="type-label text-[0.62rem] text-gold-soft">The weekly stem</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight">One letter, every Friday. What the growers sent us.</h2>
          </div>
          <form
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement;
              if (input?.value) {
                input.value = '';
                const btn = e.currentTarget.querySelector('button');
                if (btn) btn.textContent = 'Subscribed';
              }
            }}
          >
            <label htmlFor="footer-newsletter" className="sr-only">
              Email address
            </label>
            <input
              id="footer-newsletter"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-12 flex-1 rounded-md border border-ivory/25 bg-transparent px-4 text-sm text-ivory placeholder:text-ivory/45 focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ivory px-6 text-[0.78rem] font-medium tracking-[0.08em] text-burgundy uppercase transition-colors hover:bg-rose-soft"
            >
              Subscribe <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          </form>
        </div>

        {/* columns */}
        <div className="grid grid-cols-2 gap-10 py-16 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo iconClassName="h-11 w-11 text-ivory" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/70">{brand.shortDescription}</p>
            <p className="mt-5 text-[0.72rem] uppercase tracking-[0.22em] text-ivory/50">{brand.tagline}</p>
          </div>
          <FooterCol title="Shop" items={footerNavigation.shop} />
          <FooterCol title="Atelier" items={footerNavigation.atelier} />
          <div>
            <p className="type-label text-[0.62rem] text-gold-soft">Visit & speak</p>
            <ul className="mt-5 space-y-4 text-sm text-ivory/80">
              <li className="flex gap-3">
                <MapPin size={16} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold-soft" />
                <span>
                  {storeLocation.street}
                  <br />
                  {storeLocation.city}, {storeLocation.state} {storeLocation.postalCode}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone size={16} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold-soft" />
                <a href={contactDetails.phoneHref} className="transition-colors hover:text-ivory">
                  {contactDetails.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={16} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold-soft" />
                <a href={contactDetails.emailHref} className="transition-colors hover:text-ivory">
                  {contactDetails.email}
                </a>
              </li>
            </ul>
            <div className="mt-6 flex gap-2">
              {brand.social.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.platform}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/25 text-[0.62rem] uppercase tracking-wider text-ivory/70 transition-colors hover:border-gold hover:text-gold"
                >
                  {s.platform.slice(0, 2)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-ivory/15 py-8 text-[0.72rem] text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. A fictional demonstration boutique — all products, prices and reviews are sample content.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/contact" className="transition-colors hover:text-ivory">
              Contact
            </Link>
            <Link to="/delivery" className="transition-colors hover:text-ivory">
              Delivery
            </Link>
            <Link to="/about" className="transition-colors hover:text-ivory">
              About
            </Link>
            <span className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" /> Made with the Bloomé atelier
            </span>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="type-label text-[0.62rem] text-gold-soft">{title}</p>
      <ul className="mt-5 space-y-3 text-sm text-ivory/80">
        {items.map((item) => (
          <li key={item.label}>
            <Link to={item.href} className="transition-colors hover:text-ivory">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
