import type { Collection } from '../types/content';

/**
 * The six Bloomé collections. Products carry a `collection` id that matches
 * these slugs, so the "Collections" experience is always in sync with the
 * catalog — add a product to a collection here and it appears everywhere.
 */
export const collections: Collection[] = [
  {
    id: 'signature-roses',
    slug: 'signature-roses',
    name: 'Signature Roses',
    tagline: 'Garden roses, grown for scent and structure.',
    description:
      'Our house collection. Certified garden roses in the hues of the French countryside — blush, ivory, champagne and wine — hand-tied and delivered with a care card.',
    story: [
      'The Signature Rose is the bloom that named the house. We grow them on day-neutral California acreage, cut them at first light, and spend the morning arranging them by hand so that each rose opens in its own time.',
      'Every bouquet in this collection is built around the architecture of the flower itself: high centres, full petal age, and a fragrance that a perfume house would photograph for reference.',
    ],
    heroImage: { src: 'art://blush/rose/signature-roses/hero', alt: 'A hand-tied bouquet of garden roses in blush and burgundy' },
    paletteName: 'Burgundy & blush',
    order: 1,
    featured: true,
    seoTitle: 'Signature Roses — Garden Rose Bouquets & Delivery',
    seoDescription:
      'Shop the Signature Roses collection — blush, ivory, champagne and wine garden roses, hand-tied in three sizes and delivered across the Arcadia metro.',
  },
  {
    id: 'birthday-flowers',
    slug: 'birthday-flowers',
    name: 'Birthday Flowers',
    tagline: 'Candles, confetti and joyful colour.',
    description:
      'Arrangements designed to be the best part of a party — saturated tulips, ranunculus and dahlias in palettes that flatter wrapping paper and birthday tables alike.',
    story: [
      'Birthdays deserve flowers with an appetite for life. We lean on short, sturdy stems and colours with high saturation so the arrangement holds its sculpture through candles, cake and dancing.',
      'Leaning bright without being brash, this collection is our most popular gift at the atelier counter.',
    ],
    heroImage: { src: 'art://sunlit/tulip/birthday-flowers/hero', alt: 'A cheerfully bright birthday bouquet of tulips and ranunculus' },
    paletteName: 'Sunlit citrus & berry',
    order: 2,
    featured: true,
    seoTitle: 'Birthday Flowers — Joyful Bouquets Delivered Same-Day',
    seoDescription:
      'Send birthday flowers that feel like confetti — bright tulips, ranunculus and dahlias, beautifully wrapped with a handwritten card.',
  },
  {
    id: 'wedding-romance',
    slug: 'wedding-romance',
    name: 'Wedding & Romance',
    tagline: 'For proposals, vows and anniversaries.',
    description:
      'Couture florals for the most photographed moments of your life — bridal bouquets, ceremony pieces and anniversary arrangements composed with intention.',
    story: [
      'Whether it is a hand-tied bridal bouquet carried down an aisle or a table arrangement that holds a conversation, romance is about restraint as much as abundance.',
      'Our wedding team books twelve consultations a month and composes every piece for the light of the venue, not the trend of the season.',
    ],
    heroImage: { src: 'art://porcelain/peony/wedding-romance/hero', alt: 'An ivory and blush wedding bouquet of peonies and garden roses' },
    paletteName: 'Porcelain & ivory',
    order: 3,
    featured: true,
    seoTitle: 'Wedding Florals — Bouquets, Ceremony & Romance Flowers',
    seoDescription:
      'Wedding and romance flowers from Bloomé — bridal bouquets, ceremony arches and anniversary arrangements, composed for the light of your venue.',
  },
  {
    id: 'sympathy-remembrance',
    slug: 'sympathy-remembrance',
    name: 'Sympathy & Remembrance',
    tagline: 'Gentle arrangements in quiet tones.',
    description:
      'Considered flowers for honouring a life — white lilies, cream roses and soft greenery, delivered with dignity and a handwritten note.',
    story: [
      'We take care with these arrangements that they say what words cannot: that someone is loved, and that the people carrying the grief are seen.',
      'Sympathy orders are assembled quietly, out of traffic, and delivered in plain wrappers — never with branding on the exterior.',
    ],
    heroImage: { src: 'art://porcelain/lily/sympathy-remembrance/hero', alt: 'A serene white and cream sympathy bouquet of lilies and roses' },
    paletteName: 'Porcelain white & green',
    order: 4,
    featured: false,
    seoTitle: 'Sympathy Flowers & Remembrance Bouquets — Same-Day Delivery',
    seoDescription:
      'Sympathy and remembrance flowers in quiet, dignified tones — white lilies, cream roses and greenery, delivered with a handwritten note.',
  },
  {
    id: 'seasonal-blooms',
    slug: 'seasonal-blooms',
    name: 'Seasonal Blooms',
    tagline: 'What is blooming, right now.',
    description:
      'A living collection that changes with the calendar — whatever our regional growers bring to the market this week, arranged with editorial calm.',
    story: [
      'Seasonality is how we stay honest and how we stay good. The Seasonal Blooms collection is composed each Monday morning from the freshest arrivals at our growers’ coolers.',
      'Order blindly and be surprised, or browse the notes that tell you exactly which farms your stems came from.',
    ],
    heroImage: { src: 'art://autumn/garden/seasonal-blooms/hero', alt: 'A gathered seasonal bouquet in autumn and summer tones' },
    paletteName: 'Autumn & garden gold',
    order: 5,
    featured: false,
    seoTitle: 'Seasonal Flowers — Fresh Local Arrangements by Season',
    seoDescription:
      'Seasonal flower arrangements composed each week from regional growers — autumn golds, winter whites, spring pastels and summer celebrations.',
  },
  {
    id: 'luxury-arrangements',
    slug: 'luxury-arrangements',
    name: 'Luxury Arrangements',
    tagline: 'Sculptural couture pieces, by the stem.',
    description:
      'Our most generous work — overscale arrangements in rare blooms, finished with silk ribbons and delivered with white-glove care.',
    story: [
      'Luxury, at the atelier, means two things: stems that do not grow in every market, and a designer’s eye for negative space. The Luxury collection gives both full room.',
      'Each piece is made to order, photographed in the studio, and delivered in a travelling vault that keeps the petals at 6°C until the doorbell rings.',
    ],
    heroImage: { src: 'art://lavender/orchid/luxury-arrangements/hero', alt: 'A sculptural luxury arrangement of orchids and peonies' },
    paletteName: 'Wine, porcelain & lavender',
    order: 6,
    featured: false,
    seoTitle: 'Luxury Flower Arrangements — White-Glove Delivery',
    seoDescription:
      'Sculptural luxury flower arrangements in rare blooms — orchids, peonies and garden roses, made to order and delivered by white-glove courier.',
  },
];

export const collectionById = Object.fromEntries(collections.map((c) => [c.id, c])) as Record<Collection['id'], Collection>;