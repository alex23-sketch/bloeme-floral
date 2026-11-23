import type { ContentBlock, HeroSection, PageContent } from '../types/content';

/* ==========================================================================
   EDITORIAL CONTENT
   Homepage and About copy lives here — never in components. In Business PRO
   these objects are the seed data for the `pages` table and become editable
   from the admin CMS.
   ========================================================================== */

export const homeHero: HeroSection = {
  id: 'home-hero',
  headline: ['Flowers,', 'Beautifully', 'Told.'],
  emphasis: 'Parisian atelier · Arcadia, California',
  subheading:
    'Hand-tied arrangements composed each morning in our studio — garden roses, seasonal blooms and a little theatre.',
  primaryCta: { label: 'Shop arrangements', href: '/shop', variant: 'primary' },
  secondaryCta: { label: 'Our story', href: '/about', variant: 'secondary' },
  media: { src: 'art://blush/peony/home-hero/full', alt: 'A generous hand-tied bouquet of blush peonies' },
  badge: { title: 'Same-day delivery', caption: 'Order by 2pm · Arcadia metro' },
};

export const homeIntro = {
  eyebrow: 'The atelier',
  title: 'Composed by hand, delivered with care.',
  body: 'Bloomé Floral is a small studio with an old-world approach — a designer’s eye for composition, a gardener’s patience for the stems, and the belief that a bouquet should look considered long after it arrives. We buy from three regional growers, grow a handful of roses ourselves, and hand-tie every order the day it leaves us.',
};

export const homeStats: ContentBlock = {
  type: 'statRow',
  stats: [
    { value: '3', label: 'Regional growers' },
    { value: '1,400+', label: 'Arrangements each season' },
    { value: '12', label: 'Weddings designed each month' },
    { value: '9 yrs', label: 'In the same studio' },
  ],
};

export type HomepageBanner = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
};

/** Promotional strip rendered once in the header area (dismissible). */
export const homepageBanner: HomepageBanner = {
  id: 'banner-midnight-roses',
  eyebrow: 'Seasonal',
  title: 'Velvet Noir is back, until the cold arrives.',
  body: 'The house’s burgundy rose bouquet returns for autumn, in limited quantities each morning.',
  cta: { label: 'See the roses', href: '/products/velvet-noir' },
};

export type PromoPanel = {
  id: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  art: { src: string; alt: string };
};

export const homepagePromos: PromoPanel[] = [
  {
    id: 'promo-wedding',
    title: 'Wedding consultations open',
    body: 'Our events team books twelve weddings a month. Sit with us over coffee and begin with a palette, not a package.',
    cta: { label: 'Book a consultation', href: '/contact?topic=wedding' },
    art: { src: 'art://porcelain/peony/wedding-promo/arch', alt: 'An ivory bridal peony bouquet' },
  },
  {
    id: 'promo-delivery',
    title: 'Same-day, across the metro',
    body: 'Order by 2pm in the Arcadia Core, and we deliver before seven. Every zone, every fee — none of the guesswork.',
    cta: { label: 'Check delivery zones', href: '/delivery#zones' },
    art: { src: 'art://lavender/hydrangea/delivery-promo/arch', alt: 'A lavender hydrangea arrangement' },
  },
];

export const aboutHero: HeroSection = {
  id: 'about-hero',
  headline: ['A studio built on', 'slow flowers.'],
  emphasis: 'Est. 2017 · Rue des Jardins',
  subheading: 'Bloomé Floral began with one bucket of roses, one enamel table, and a conviction that flowers should be art-directed, not assembled.',
  primaryCta: { label: 'Visit the atelier', href: '/contact' },
  secondaryCta: { label: 'Browse the catalog', href: '/shop' },
  media: { src: 'art://garden/rose/atelier-hero/full', alt: 'The Bloomé atelier table with gathered garden roses' },
};

export const aboutStory: ContentBlock[] = [
  {
    type: 'richText',
    heading: 'Where it began',
    paragraphs: [
      'In 2017, Camille Ellison left a career as a set designer and rented a garden shed behind a café on Rue des Jardins. She had one enamel table, a set of floral shears, and a conviction that the florists she grew up with in Paris had something the flower shops around her lacked: intention.',
      'The first week, she sold a single bucket of garden roses to a café regular who carried it home in a hat box. By the end of the first year, the shed had a waiting list, and the bucket had become a studio.',
    ],
  },
  {
    type: 'pullQuote',
    quote: 'A bouquet is a small piece of theatre. It should have a beginning, a middle, and an end — and be worth looking at from every seat.',
    attribution: 'Camille Ellison, founder & creative director',
  },
  {
    type: 'richText',
    heading: 'How we work',
    paragraphs: [
      'Every arrangement is designed the morning it is delivered. We work from the flowers, not from a catalogue, which means no two bouquets are identical and no two seasons look the same. Our designers each keep a notebook of compositions they have made and want to make again; some of them have been waiting years for the right peony harvest.',
      'Behind the studio is a cool room kept at 6°C, a draftsman’s table for arrangement drawings, and a wall of silk ribbon from a mill in Lyon that has been winding ribbons for four generations.',
    ],
  },
  {
    type: 'statRow',
    stats: [
      { value: '2017', label: 'Founded on Rue des Jardins' },
      { value: '4', label: 'Floral designers' },
      { value: '72%', label: 'Stems grown within 120 miles' },
      { value: '100%', label: 'Orders composed by hand' },
    ],
  },
];

export const aboutCraft: ContentBlock = {
  type: 'featureList',
  items: [
    {
      title: 'Sourced with the seasons',
      body: 'We buy from three regional growers and complete the palette with fair-trade imports for blooms that cannot be grown locally. Every stem is traceable to its farm.',
    },
    {
      title: 'Composed the morning of',
      body: 'No pre-made bouquets sit overnight. Orders are gathered the day they travel, in the half-light of the morning when the flowers are at their coolest.',
    },
    {
      title: 'Delivered by hand',
      body: 'Our own couriers deliver most of the metro, in white vans and plain wrappers. If a recipient is not home, we call and return — we never leave flowers in the sun.',
    },
  ],
};

export const aboutSustainability: ContentBlock[] = [
  {
    type: 'richText',
    heading: 'Sustainability is a supply-chain decision',
    paragraphs: [
      'Flowers have a carbon story, and most of it is told in the air freight. We source the majority of our stems from growers within 120 miles on the California coast, and we work with two farms that have moved to open-field growing with recycled water.',
      'Closer to home: we use paper rather than foam for mechanics, we offer vase rental for events, we compost every stem that does not leave the studio, and our ribbon mill in Lyon ships by sea. We are not perfect; we publish what we know and what we are still working out.',
    ],
  },
  {
    type: 'statRow',
    stats: [
      { value: '72%', label: 'Stems grown within 120 miles' },
      { value: '0', label: 'Floral foam used in daily orders' },
      { value: '100%', label: 'Green waste composted' },
    ],
  },
];

export const aboutTeam = [
  {
    id: 'team-camille',
    name: 'Camille Ellison',
    role: 'Founder & Creative Director',
    initials: 'CE',
    bio: 'Trained as a set designer in Paris before moving to California. Designs every wedding arch herself, and still keeps the first pair of floral shears.',
    art: { src: 'art://porcelain/peony/team-camille/arch', alt: 'Portrait placeholder — Camille Ellison' },
  },
  {
    id: 'team-ines',
    name: 'Inès Moreau',
    role: 'Head Floral Designer',
    initials: 'IM',
    bio: 'Has been arranging flowers since age fourteen, most recently as head designer for a five-star hotel. Our retail arrangements are composed by her hand.',
    art: { src: 'art://blush/rose/team-ines/arch', alt: 'Portrait placeholder — Inès Moreau' },
  },
  {
    id: 'team-joseph',
    name: 'Joseph Acker',
    role: 'Grower & Sourcing Lead',
    initials: 'JA',
    bio: 'Third-generation grower. Knows every farm we buy from by the smell of its cool room, and negotiates for the first peonies of the season.',
    art: { src: 'art://garden/garden/team-joseph/arch', alt: 'Portrait placeholder — Joseph Acker' },
  },
  {
    id: 'team-mara',
    name: 'Mara Okafor',
    role: 'Events & Studio Manager',
    initials: 'MO',
    bio: 'Keeps four weddings a weekend from all being the same, and every corporate table delivery on time. Runs the studio calendar like a conductor.',
    art: { src: 'art://lavender/orchid/team-mara/arch', alt: 'Portrait placeholder — Mara Okafor' },
  },
];

export const aboutTimeline = [
  { year: '2017', title: 'The garden shed', body: 'Camille sells a single bucket of garden roses from a shed on Rue des Jardins.' },
  { year: '2019', title: 'The studio opens', body: 'The shed becomes a studio with a cool room and the first full-time designer.' },
  { year: '2021', title: 'Regional growers', body: 'Partnerships with three California growers make local sourcing the majority of stems.' },
  { year: '2023', title: 'Weddings & events', body: 'A dedicated events team designs twelve weddings a month — and counts.' },
  { year: '2026', title: 'The archive', body: 'Four hundred documented compositions, and a waiting list for peony season.' },
];

/* ==========================================================================
   PAGES (CMS-shaped)
   ========================================================================== */

export const pages: PageContent[] = [
  {
    id: 'page-home',
    slug: 'home',
    title: 'Home',
    seoTitle: 'Luxury Florist in Arcadia — Flowers, Beautifully Told',
    seoDescription:
      'Bloomé Floral is a Parisian-inspired luxury florist in Arcadia, California. Garden roses, seasonal bouquets and wedding florals, hand-delivered. Shop arrangements or book a consultation.',
    hero: homeHero,
    sections: [
      { id: 'home-intro', kind: 'intro', eyebrow: homeIntro.eyebrow, heading: homeIntro.title, body: homeIntro.body, order: 1, visible: true },
      { id: 'home-featured', kind: 'featuredProducts', eyebrow: 'Featured', heading: 'A selection from the studio', order: 2, visible: true },
      { id: 'home-collections', kind: 'collections', eyebrow: 'Six collections', heading: 'Shop by occasion, or by feeling', order: 3, visible: true },
      { id: 'home-testimonials', kind: 'testimonials', eyebrow: 'Notes from recipients', heading: 'What arrives, and how it is received', order: 4, visible: true },
      { id: 'home-cta', kind: 'cta', heading: 'Flowers for the occasion you are planning.', order: 5, visible: true },
    ],
    published: true,
    updatedAt: '2026-10-28T09:00:00.000Z',
  },
  {
    id: 'page-about',
    slug: 'about',
    title: 'About',
    seoTitle: 'Our Story — A Parisian-Inspired Floral Atelier',
    seoDescription:
      'Since 2017, Bloomé Floral has composed hand-tied arrangements from a studio on Rue des Jardins. Meet the designers, the growers and the values behind the work.',
    hero: aboutHero,
    sections: [
      { id: 'about-story', kind: 'content', eyebrow: 'Our story', heading: 'Slow flowers, considered rooms', blocks: aboutStory, order: 1, visible: true },
      { id: 'about-craft', kind: 'content', eyebrow: 'The craft', heading: 'Unhurried by design', blocks: [aboutCraft], order: 2, visible: true },
      { id: 'about-sustainability', kind: 'content', eyebrow: 'Regenerative', heading: 'Flowers that respect their origins', blocks: aboutSustainability, order: 3, visible: true },
      { id: 'about-team', kind: 'team', eyebrow: 'The studio', heading: 'The hands behind the room', order: 4, visible: true },
    ],
    published: true,
    updatedAt: '2026-10-20T09:00:00.000Z',
  },
];