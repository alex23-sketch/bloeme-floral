import { useEffect } from 'react';
import { seoSettings } from '../data/brand';

type SeoInput = {
  title: string;
  description?: string;
  /** Absolute or root-relative path for canonical + og:url. */
  path?: string;
  image?: string;
  /** JSON-LD structured data — injected as a script tag, replaced on change. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
};

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Lightweight SEO manager — works for client-side routing in Vite.
 * For server-rendered production builds (Business PRO on SSR) the same
 * values are rendered server-side from the same catalog data.
 */
export function useSeo({ title, description, path, image, jsonLd, noindex }: SeoInput) {
  useEffect(() => {
    const fullTitle = title.includes(seoSettings.siteName) ? title : seoSettings.titleTemplate.replace('%s', title);
    const desc = description ?? seoSettings.defaultDescription;
    const url = `${seoSettings.siteUrl}${path ?? ''}`;
    const img = `${seoSettings.siteUrl}${image ?? seoSettings.defaultImage.src}`;

    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:site_name', seoSettings.siteName);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setLink('canonical', url);

    const id = 'seo-jsonld';
    document.getElementById(id)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, image, jsonLd, noindex]);
}

export const organizationJsonLd = (org: typeof seoSettings.organization) => ({
  '@context': 'https://schema.org',
  '@type': 'Florist',
  name: org.name,
  url: seoSettings.siteUrl,
  logo: `${seoSettings.siteUrl}${org.logo.src}`,
  telephone: org.telephone,
  email: org.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: org.address.street,
    addressLocality: org.address.city,
    addressRegion: org.address.state,
    postalCode: org.address.postalCode,
    addressCountry: org.address.country,
  },
  sameAs: org.sameAs,
});
