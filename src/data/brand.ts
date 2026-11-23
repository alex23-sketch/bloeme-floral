import type {
  BrandSettings,
  NavigationItem,
  SEOSettings,
  StoreLocation,
  Testimonial,
  FAQ,
  DeliveryZone,
  DeliveryOption,
} from '../types/content';

/* ==========================================================================
   BRAND
   Change the name, palette, tagline or socials here — every page follows.
   ========================================================================== */

export const brand: BrandSettings = {
  id: 'brand-bloeme-floral',
  name: 'Bloomé Floral',
  wordmark: 'BLOOMÉ',
  tagline: 'Flowers, Beautifully Told.',
  shortDescription:
    'A Parisian-inspired floral atelier in Arcadia, composing art-directed arrangements for life’s most considered moments.',
  market: 'United States',
  currency: 'USD',
  locale: 'en-US',
  colors: {
    background: '#FAF7F2',
    primary: '#581F32',
    secondary: '#D8A7AD',
    accent: '#C6A66B',
    text: '#292426',
  },
  typography: {
    heading: 'Cormorant Garamond',
    body: 'DM Sans',
    stylesheetUrl: null,
  },
  logo: {
    mark: { src: '/logo.svg', alt: 'Bloomé Floral monogram' },
    lockup: { src: '/logo.svg', alt: 'Bloomé Floral wordmark' },
  },
  motif: 'arch',
  social: [
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'pinterest', url: 'https://pinterest.com' },
    { platform: 'facebook', url: 'https://facebook.com' },
  ],
  updatedAt: '2026-10-28T09:00:00.000Z',
};

export const contactDetails = {
  phone: '(415) 555-0184',
  phoneHref: 'tel:+14155550184',
  email: 'atelier@bloemefloral.com',
  emailHref: 'mailto:atelier@bloemefloral.com',
  weddingsEmail: 'weddings@bloemefloral.com',
  studioAddress: '118 Rue des Jardins, Arcadia, CA 94107',
  responseTime: 'within one business day',
};

/* ==========================================================================
   NAVIGATION
   ========================================================================== */

export const navigation: NavigationItem[] = [
  { id: 'nav-home', label: 'Home', href: '/', order: 1 },
  {
    id: 'nav-shop',
    label: 'Shop',
    href: '/shop',
    order: 2,
    children: [
      { id: 'nav-shop-all', label: 'All arrangements', href: '/shop', order: 1 },
      { id: 'nav-shop-roses', label: 'Signature roses', href: '/collections/signature-roses', order: 2 },
      { id: 'nav-shop-birthday', label: 'Birthday flowers', href: '/collections/birthday-flowers', order: 3 },
      { id: 'nav-shop-wedding', label: 'Wedding & romance', href: '/collections/wedding-romance', order: 4 },
      { id: 'nav-shop-sympathy', label: 'Sympathy & remembrance', href: '/collections/sympathy-remembrance', order: 5 },
      { id: 'nav-shop-seasonal', label: 'Seasonal blooms', href: '/collections/seasonal-blooms', order: 6 },
      { id: 'nav-shop-luxury', label: 'Luxury arrangements', href: '/collections/luxury-arrangements', order: 7 },
    ],
  },
  { id: 'nav-collections', label: 'Collections', href: '/collections', order: 3 },
  { id: 'nav-about', label: 'About', href: '/about', order: 4 },
  { id: 'nav-delivery', label: 'Delivery', href: '/delivery', order: 5 },
  { id: 'nav-contact', label: 'Contact', href: '/contact', order: 6 },
];

export const footerNavigation = {
  shop: [
    { label: 'All arrangements', href: '/shop' },
    { label: 'Signature roses', href: '/collections/signature-roses' },
    { label: 'Wedding & romance', href: '/collections/wedding-romance' },
    { label: 'Luxury arrangements', href: '/collections/luxury-arrangements' },
    { label: 'Seasonal blooms', href: '/collections/seasonal-blooms' },
  ],
  atelier: [
    { label: 'Our story', href: '/about' },
    { label: 'Collections', href: '/collections' },
    { label: 'Delivery & care', href: '/delivery' },
    { label: 'Contact & appointments', href: '/contact' },
  ],
  support: [
    { label: 'Delivery zones', href: '/delivery#zones' },
    { label: 'Care guide', href: '/delivery#care' },
    { label: 'Frequently asked', href: '/delivery#faq' },
    { label: 'Wedding consultations', href: '/contact?topic=wedding' },
  ],
};

/* ==========================================================================
   STORE & CONTACT
   ========================================================================== */

export const storeLocation: StoreLocation = {
  id: 'store-arcadia',
  name: 'Bloomé Atelier — Arcadia',
  street: '118 Rue des Jardins',
  city: 'Arcadia',
  state: 'CA',
  postalCode: '94107',
  phone: contactDetails.phone,
  email: contactDetails.email,
  hours: [
    { day: 0, label: 'Sunday', opens: null, closes: null, closed: true },
    { day: 1, label: 'Monday', opens: '10:00', closes: '18:00', closed: false },
    { day: 2, label: 'Tuesday', opens: '10:00', closes: '18:00', closed: false },
    { day: 3, label: 'Wednesday', opens: '10:00', closes: '18:00', closed: false },
    { day: 4, label: 'Thursday', opens: '10:00', closes: '19:00', closed: false },
    { day: 5, label: 'Friday', opens: '09:00', closes: '19:00', closed: false },
    { day: 6, label: 'Saturday', opens: '09:00', closes: '18:00', closed: false },
  ],
  mapUrl: 'https://maps.example.com/?q=118+Rue+des+Jardins+Arcadia+CA',
  parkingNote: 'Limited street parking on Rue des Jardins; the courtyard lot behind the atelier offers two hours of complimentary parking.',
};

/* ==========================================================================
   DELIVERY
   All delivery content is fictional demo data for a fictional metro
   ("Arcadia"), which keeps the catalog realistic without inventing claims
   about a real city.
   ========================================================================== */

export const deliveryZones: DeliveryZone[] = [
  {
    id: 'arcadia-core',
    name: 'Arcadia Core',
    region: 'Downtown, Old Town, Rue des Jardins',
    postalCodes: ['94107', '94103', '94105', '94102'],
    coverage: 'Same-day hand delivery',
    feeCents: { standard: 1200, express: 1800, sameDay: 2500 },
    sameDayAvailable: true,
    cutoffTime: '14:00',
    minimumOrderCents: 6000,
    standardLeadHours: 24,
    notes: 'Complimentary delivery on orders over $125.',
  },
  {
    id: 'harbor-district',
    name: 'Harbor District',
    region: 'Marina, Wharf, Lighthouse Point',
    postalCodes: ['94111', '94123', '94109', '94133'],
    coverage: 'Same-day hand delivery',
    feeCents: { standard: 1400, express: 2000, sameDay: 2800 },
    sameDayAvailable: true,
    cutoffTime: '13:00',
    minimumOrderCents: 6000,
    standardLeadHours: 24,
    notes: 'Same-day orders require a 1pm cut-off.',
  },
  {
    id: 'westmeadow',
    name: 'Westmeadow',
    region: 'Westmeadow, Garden Row, Willow Park',
    postalCodes: ['94117', '94118', '94121', '94122'],
    coverage: 'Next-day courier',
    feeCents: { standard: 1600, express: 2400, sameDay: 0 },
    sameDayAvailable: false,
    cutoffTime: '17:00',
    minimumOrderCents: 7500,
    standardLeadHours: 48,
    notes: 'Same-day service is not available; flowers travel by refrigerated courier.',
  },
  {
    id: 'north-hills',
    name: 'North Hills',
    region: 'North Hills, Cedar Heights, Vine & Oak',
    postalCodes: ['94131', '94114', '94110', '94112'],
    coverage: 'Next-day hand delivery',
    feeCents: { standard: 1800, express: 2600, sameDay: 0 },
    sameDayAvailable: false,
    cutoffTime: '16:00',
    minimumOrderCents: 7500,
    standardLeadHours: 48,
    notes: 'Orders placed after 4pm are scheduled the following day.',
  },
  {
    id: 'regional-courier',
    name: 'Regional Courier',
    region: 'Beyond the Arcadia metro — up to 50 miles',
    postalCodes: ['94401', '94402', '94501', '94502', '94901', '94903'],
    coverage: 'Scheduled delivery within two business days',
    feeCents: { standard: 2400, express: 3400, sameDay: 0 },
    sameDayAvailable: false,
    cutoffTime: '12:00',
    minimumOrderCents: 9000,
    standardLeadHours: 72,
    notes: 'Regional deliveries ship in our signature travelling vault.',
  },
];

export const deliveryOptions: DeliveryOption[] = [
  {
    id: 'standard-window',
    name: 'Standard window',
    description: 'Delivered between 9am and 5pm on the date you choose.',
    window: '9am – 5pm',
    surchargeCents: 0,
    sameDay: false,
    order: 1,
  },
  {
    id: 'afternoon-window',
    name: 'Afternoon window',
    description: 'Delivered to offices and homes between 1pm and 4pm.',
    window: '1pm – 4pm',
    surchargeCents: 800,
    sameDay: false,
    order: 2,
  },
  {
    id: 'same-day',
    name: 'Same-day hand delivery',
    description: 'Order before the zone cut-off and we deliver today.',
    window: 'By 7pm',
    surchargeCents: 1500,
    sameDay: true,
    order: 3,
  },
];

/* ==========================================================================
   TESTIMONIALS — clearly labelled sample reviews
   ========================================================================== */

export const testimonials: Testimonial[] = [
  {
    id: 'tst-001',
    quote:
      'The arrangement arrived looking like a page from a design magazine — not a single stem out of place. My mother kept it for eleven days.',
    author: 'Miriam Castellanos',
    initials: 'MC',
    location: 'Old Town, Arcadia',
    occasion: 'Anniversary',
    rating: 5,
    isSample: true,
    featured: true,
    date: '2026-09-14T00:00:00.000Z',
  },
  {
    id: 'tst-002',
    quote:
      'We planned our entire reception palette around Bloomé’s roses. The team read every note we sent and translated it into flowers.',
    author: 'Priya & Daniel Ashford',
    initials: 'PA',
    location: 'Harbor District',
    occasion: 'Wedding',
    rating: 5,
    isSample: true,
    featured: true,
    date: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'tst-003',
    quote:
      'Ordering flowers for a difficult occasion should feel gentle. This did. The handwritten note and the calm delivery made all the difference.',
    author: 'Eleanor Whitfield',
    initials: 'EW',
    location: 'Westmeadow',
    occasion: 'Sympathy',
    rating: 5,
    isSample: true,
    featured: true,
    date: '2026-07-21T00:00:00.000Z',
  },
  {
    id: 'tst-004',
    quote:
      'I sent the Grand peonies to a client and received a thank-you email before the delivery confirmation. That says everything.',
    author: 'Thomas Réveillon',
    initials: 'TR',
    location: 'Marina',
    occasion: 'Corporate gift',
    rating: 5,
    isSample: true,
    featured: false,
    date: '2026-06-30T00:00:00.000Z',
  },
  {
    id: 'tst-005',
    quote:
      'The bouquet lasted well past the two weeks they promised. I followed the care card and changed the water every other day.',
    author: 'Sofia Lindgren',
    initials: 'SL',
    location: 'Garden Row',
    occasion: 'Birthday',
    rating: 4,
    isSample: true,
    featured: false,
    date: '2026-05-18T00:00:00.000Z',
  },
  {
    id: 'tst-006',
    quote:
      'Every Friday for six months, the same card, a different arrangement. My assistant now knows the courier by name.',
    author: 'Henry Okafor',
    initials: 'HO',
    location: 'Lighthouse Point',
    occasion: 'Weekly subscription',
    rating: 5,
    isSample: true,
    featured: true,
    date: '2026-04-09T00:00:00.000Z',
  },
  {
    id: 'tst-007',
    quote:
      'The seasonal arrangement was full of things I could not name — and somehow all of them belonged together. Visited the atelier the next week.',
    author: 'Aiko Tanabe',
    initials: 'AT',
    location: 'Willow Park',
    occasion: 'Just because',
    rating: 5,
    isSample: true,
    featured: false,
    date: '2026-03-27T00:00:00.000Z',
  },
  {
    id: 'tst-008',
    quote:
      'A small hiccup with our delivery date; the team called within the hour and re-sent a fresh arrangement the next morning.',
    author: 'Gabriel Marchetti',
    initials: 'GM',
    location: 'Cedar Heights',
    occasion: 'Birthday',
    rating: 4,
    isSample: true,
    featured: false,
    date: '2026-02-12T00:00:00.000Z',
  },
];

/* ==========================================================================
   FAQs
   ========================================================================== */

export const faqs: FAQ[] = [
  {
    id: 'faq-01',
    question: 'How far in advance should I place my order?',
    answer:
      'Standard delivery needs 24–48 hours depending on your zone. Same-day delivery is available in the Arcadia Core and Harbor District zones for orders placed before 2pm and 1pm respectively. Weddings and events are booked at least four weeks ahead.',
    category: 'ordering',
    order: 1,
    featured: true,
  },
  {
    id: 'faq-02',
    question: 'Is this a real shop, and will I be charged?',
    answer:
      'No. This website is a demonstration template. Every product, price and review is fictional sample content, and the checkout is a demo that never processes payment or transmits an order.',
    category: 'ordering',
    order: 2,
    featured: true,
  },
  {
    id: 'faq-03',
    question: 'Which areas do you deliver to?',
    answer:
      'We hand-deliver across five zones — Arcadia Core, Harbor District, Westmeadow, North Hills and a Regional Courier zone up to 50 miles out. Enter your ZIP at checkout and we will show availability, delivery fees and service windows.',
    category: 'delivery',
    order: 3,
    featured: true,
  },
  {
    id: 'faq-04',
    question: 'Can I choose a delivery time?',
    answer:
      'You can choose a delivery date and a service window — morning, afternoon or same-day. Precise times within a window cost extra and can be arranged by calling the atelier.',
    category: 'delivery',
    order: 4,
    featured: false,
  },
  {
    id: 'faq-05',
    question: 'What happens if the recipient is not home?',
    answer:
      'Our couriers will leave the arrangement with a neighbour or concierge where possible, and always with a card. If no safe spot exists, we return the arrangement to the atelier and contact you to re-schedule at no delivery cost.',
    category: 'delivery',
    order: 5,
    featured: false,
  },
  {
    id: 'faq-06',
    question: 'How long will my flowers last?',
    answer:
      'Most arrangements remain at their best for 7–12 days, and roses often longer. Every order includes a care card; trim the stems at an angle, change the water every other day, and keep the vase away from direct sun and heating vents.',
    category: 'product',
    order: 6,
    featured: false,
  },
  {
    id: 'faq-07',
    question: 'Can I include a personal message?',
    answer:
      'Yes. On the product page you can add a handwritten gift message of up to 240 characters, and at checkout you can request that prices be hidden from the packing slip.',
    category: 'product',
    order: 7,
    featured: false,
  },
  {
    id: 'faq-08',
    question: 'Are the flowers seasonal and locally sourced?',
    answer:
      'Wherever possible. We buy from three regional growers in California and complement with fair-trade imports for varieties that cannot be grown locally. Our care pages note when a bloom is in its natural season.',
    category: 'product',
    order: 8,
    featured: false,
  },
  {
    id: 'faq-09',
    question: 'What is your cancellation and refund policy?',
    answer:
      'Orders can be changed or cancelled free of charge up to 24 hours before the delivery date. Because flowers are perishable, cancellations after that point may carry the cost of the arrangement, and we always refund delivery when we cannot fulfil.',
    category: 'account',
    order: 9,
    featured: false,
  },
  {
    id: 'faq-10',
    question: 'Do you create flowers for weddings and corporate events?',
    answer:
      'We do. Our events team designs installations, tablescapes and ceremony florals for weddings from six to four hundred guests, and weekly arrangements for offices and hotels. Book a consultation through our contact page.',
    category: 'events',
    order: 10,
    featured: true,
  },
];

/* ==========================================================================
   SEO
   ========================================================================== */

export const seoSettings: SEOSettings = {
  siteName: 'Bloomé Floral',
  titleTemplate: '%s — Bloomé Floral',
  defaultTitle: 'Bloomé Floral — Flowers, Beautifully Told.',
  defaultDescription:
    'A luxury floral atelier in Arcadia composing art-directed bouquets and arrangements for weddings, birthdays, sympathy and the everyday. Same-day hand delivery across the metro.',
  defaultImage: { src: '/og-cover.svg', alt: 'Bloomé Floral' },
  siteUrl: 'https://www.bloemefloral.example',
  twitterHandle: null,
  locale: 'en_US',
  keywords: [
    'luxury florist',
    'premium flowers',
    'bouquet delivery',
    'wedding florist',
    'same-day flowers',
    'signature roses',
  ],
  organization: {
    name: 'Bloomé Floral',
    logo: { src: '/logo.svg', alt: 'Bloomé Floral' },
    telephone: contactDetails.phone,
    email: contactDetails.email,
    address: {
      street: storeLocation.street,
      city: storeLocation.city,
      state: storeLocation.state,
      postalCode: storeLocation.postalCode,
      country: 'US',
    },
    sameAs: ['https://instagram.com', 'https://pinterest.com', 'https://facebook.com'],
  },
};