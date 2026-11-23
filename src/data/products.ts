import type { CollectionId, FloralVariant } from '../types';
import type { HexColor, Product, ProductImage, ProductVariant, VariantSizeId } from '../types/content';

/**
 * THE BLOOMÉ CATALOG — 36 arrangements across six collections.
 *
 * Each product is defined ONCE here. Sizes are explicit (classic / deluxe /
 * grand) so pricing stays controllable from the CMS; the `p()` builder only
 * assembles the three variant objects, SKUs and gallery slots automatically.
 *
 * Imagery uses the built-in art system: a src of the form
 *   art://<palette>/<variant>/<seed>/<frame>
 * is resolved by <MediaFrame /> into the template's deterministic botanical
 * artwork, so the demo ships with zero external images. To go live, replace
 * any src with a real photograph URL — the component then renders <img>.
 *
 * Every price is fictional demo data. All flags, stock levels and reviews are
 * sample content for a resale-ready template.
 */

/* ------------------------------------------------------------------ helpers */

const V: Record<VariantSizeId, { label: string }> = {
  classic: { label: 'Classic' },
  deluxe: { label: 'Deluxe' },
  grand: { label: 'Grand' },
};

const VARIANT_DESCRIPTIONS: Record<VariantSizeId, string> = {
  classic:
    'A gathered hand-tied bouquet of the finest stems, wrapped in ivory paper and finished with twine — our signature atelier size.',
  deluxe:
    'A fuller garden bouquet with premium blooms and added greenery, hand-tied, wrapped and finished with a champagne silk ribbon.',
  grand:
    'Our most generous presentation — an abundant statement bouquet, hand-carried in the studio vault and delivered white-glove.',
};

const CARE_BY_BLOOM: Record<string, string[]> = {
  rose: [
    'Trim rose stems at a sharp 45° angle before arranging.',
    'Roses drink best in lukewarm water; refresh every other day.',
    'Keep away from fruit bowls — ethylene ages roses quickly.',
  ],
  peony: [
    'For tightly closed peonies, unwrap and give them 24 hours in a cool room to open.',
    'Support heavy peony heads with wide-necked vessels.',
  ],
  lily: [
    'Remove stamens as they mature to keep pollen off tablecloths.',
    'Lilies last longest in a cool spot, away from direct sun.',
  ],
  tulip: [
    'Cut tulip stems straight (not on an angle) — they keep growing after cutting.',
    'Keep water level high; tulips drink noticeably overnight.',
  ],
  hydrangea: [
    'Mist hydrangea heads daily and re-cut stems vertically before watering.',
    'If heads droop, submerge the entire stem in cool water for an hour.',
  ],
  ranunculus: [
    'Ranunculus stems are hollow — cut low and water them early in the day.',
  ],
  eucalyptus: ['Trim eucalyptus stems and change the water weekly to prolong the foliage.'],
  orchid: ['Orchids prefer an orchid-topped vase and bright, indirect light.', 'Mist the roots in winter when indoor air is dry.'],
  dahlia: ['Dahlias prefer cool water and a low-sugar vase life. Re-cut daily to keep the heads upright.'],
  garden: ['Gathered garden stems drink best in cool water with a light hand of flower food.'],
};

const CARE_COMMON = 'Change the water every other day and stand the arrangement away from direct sun and heating vents.';

function careFor(flowers: string[]): string[] {
  const set: string[] = [];
  for (const f of flowers) {
    const key = f.toLowerCase().includes('rose')
      ? 'rose'
      : f.toLowerCase().includes('peon')
        ? 'peony'
        : f.toLowerCase().includes('lily')
          ? 'lily'
          : f.toLowerCase().includes('tulip')
            ? 'tulip'
            : f.toLowerCase().includes('hydrangea')
              ? 'hydrangea'
              : f.toLowerCase().includes('ranunculus')
                ? 'ranunculus'
                : f.toLowerCase().includes('eucalyptus')
                  ? 'eucalyptus'
                  : f.toLowerCase().includes('orchid')
                    ? 'orchid'
                    : f.toLowerCase().includes('dahlia')
                      ? 'dahlia'
                      : 'garden';
    if (key === 'garden' || !CARE_BY_BLOOM[key]) continue;
    set.push(...(CARE_BY_BLOOM[key] ?? []));
  }
  const unique = [...new Set(set)];
  return unique.slice(0, 3).concat([CARE_COMMON]);
}

type SizeSpec = { price: number; stems: string; inv?: number; compareAt?: number };

type ProductInput = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  short: string;
  description: string;
  collection: CollectionId;
  tags?: string[];
  palette: { name: string; hex: HexColor }[];
  flowers: string[];
  art: { palette: string; variant: FloralVariant; seed: string };
  sizes: { classic: SizeSpec; deluxe: SizeSpec; grand: SizeSpec };
  compareAt?: number;
  dims?: { w: number; h: number };
  vase?: boolean;
  flags?: { featured?: boolean; bestseller?: boolean; newArrival?: boolean };
  inStock?: boolean;
  seo?: { title: string; description: string };
  created?: string;
};

function artImages(name: string, palette: string, variant: FloralVariant, seed: string): ProductImage[] {
  const alt = (frame: string) => `${name} — ${frame === 'detail' ? 'detail of the arrangement' : frame === 'arch' ? 'ateliier presentation' : 'arrangement'}`;
  return [
    { src: `art://${palette}/${variant}/${seed}/full`, alt: alt('full'), order: 0 },
    { src: `art://${palette}/${variant}/${seed}/arch`, alt: alt('arch'), order: 1 },
    { src: `art://${palette}/${variant}/${seed}/detail`, alt: alt('detail'), order: 2 },
  ];
}

function p(input: ProductInput): Product {
  const makeVariant = (size: VariantSizeId, spec: SizeSpec): ProductVariant => ({
    id: `${input.id}-${size}`,
    size,
    label: V[size].label,
    stems: spec.stems,
    description: VARIANT_DESCRIPTIONS[size],
    priceCents: Math.round(spec.price * 100),
    compareAtPriceCents: spec.compareAt ? Math.round(spec.compareAt * 100) : null,
    sku: `${input.sku}-${size.slice(0, 3).toUpperCase()}`,
    inventory: spec.inv ?? 12,
    inStock: input.inStock !== false && (spec.inv ?? 12) > 0,
  });
  const created = input.created ?? '2026-08-15T09:00:00.000Z';
  return {
    id: input.id,
    sku: input.sku,
    name: input.name,
    slug: input.slug,
    shortDescription: input.short,
    description: input.description,
    priceCents: Math.round(input.sizes.classic.price * 100),
    compareAtPriceCents: input.compareAt ? Math.round(input.compareAt * 100) : null,
    collection: input.collection,
    categoryTags: input.tags ?? [],
    variants: [makeVariant('classic', input.sizes.classic), makeVariant('deluxe', input.sizes.deluxe), makeVariant('grand', input.sizes.grand)],
    colorPalette: input.palette,
    flowerTypes: input.flowers,
    images: artImages(input.name, input.art.palette, input.art.variant, input.art.seed),
    status: 'active',
    inStock: input.inStock !== false,
    featured: input.flags?.featured ?? false,
    bestseller: input.flags?.bestseller ?? false,
    newArrival: input.flags?.newArrival ?? false,
    dimensionsIn: input.dims ? { width: input.dims.w, height: input.dims.h } : { width: 11, height: 18 },
    vaseIncluded: input.vase ?? false,
    careInstructions: careFor(input.flowers),
    seoTitle: input.seo?.title ?? `${input.name} — Luxury Flower Delivery`,
    seoDescription:
      input.seo?.description ??
      `${input.short} Available in Classic, Deluxe and Grand sizes with same-day delivery across the Arcadia metro.`,
    createdAt: created,
    updatedAt: created,
  };
}

/* ==========================================================================
   CATALOG — 36 PRODUCTS
   ========================================================================== */

export const products: Product[] = [
  /* ------------------------------------------------ SIGNATURE ROSES — 6 */
  p({
    id: 'p-01',
    sku: 'BF-ROS-101',
    name: 'Rose Antoinette',
    slug: 'rose-antoinette',
    short: 'Twelve garden roses in soft blush and cream — the bouquet that named the house.',
    description:
      'Named for the atelier’s founding muse, Rose Antoinette is a study in blush: garden roses at their most open, gathered with cream spray roses and a whisper of silver eucalyptus. It is our most reordered arrangement, and the one we photograph for the cover of every lookbook.',
    collection: 'signature-roses',
    tags: ['Anniversary', 'Garden roses', 'Romance'],
    palette: [
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'Cream', hex: '#f6ead9' },
      { name: 'Rosewood', hex: '#b76e79' },
      { name: 'Eucalyptus', hex: '#9aa382' },
    ],
    flowers: ['Garden rose', 'Spray rose', 'Silver eucalyptus'],
    art: { palette: 'blush', variant: 'rose', seed: 'rose-antoinette' },
    sizes: {
      classic: { price: 68, stems: '8–10 stems', inv: 12 },
      deluxe: { price: 98, stems: '12–14 stems · premium bloom', inv: 8 },
      grand: { price: 132, stems: '16–18 stems · silk ribbon', inv: 5 },
    },
    compareAt: 79,
    dims: { w: 11, h: 18 },
    vase: true,
    flags: { featured: true, bestseller: true },
    created: '2026-03-02T09:00:00.000Z',
  }),
  p({
    id: 'p-02',
    sku: 'BF-ROS-102',
    name: 'Velvet Noir',
    slug: 'velvet-noir',
    short: 'Deep burgundy garden roses for the quietest, most confident statements.',
    description:
      'Velvet Noir trades the palette of a garden for the palette of a candlelit room — burgundy and almost-black roses, dark waxed foliage and a single champagne ribbon. The flowers read like velvet because they are: dense petal count, restrained colour, nothing else on the table.',
    collection: 'signature-roses',
    tags: ['Anniversary', 'Statement', 'Evening'],
    palette: [
      { name: 'Burgundy', hex: '#5d2033' },
      { name: 'Wine', hex: '#7b2c43' },
      { name: 'Noir', hex: '#3e1423' },
      { name: 'Champagne', hex: '#c6a66b' },
    ],
    flowers: ['Burgundy garden rose', 'Waxed foliage', 'Dusty rose ranunculus'],
    art: { palette: 'burgundy', variant: 'rose', seed: 'velvet-noir' },
    sizes: {
      classic: { price: 74, stems: '8–10 stems', inv: 10 },
      deluxe: { price: 106, stems: '12–14 stems · premium bloom', inv: 7 },
      grand: { price: 142, stems: '16–18 stems · silk ribbon', inv: 4 },
    },
    dims: { w: 11, h: 17 },
    vase: true,
    flags: { bestseller: true },
    created: '2026-05-20T09:00:00.000Z',
  }),
  p({
    id: 'p-03',
    sku: 'BF-ROS-103',
    name: 'Première Lumière',
    slug: 'premiere-lumiere',
    short: 'Ivory and cream roses that hold the morning light.',
    description:
      'Première Lumière — “first light” — is an all-cream composition built for soft rooms: ivory garden roses, cream ranunculus and a collar of pale eucalyptus. When the sun comes through a window, this bouquet is the brightest thing in it.',
    collection: 'signature-roses',
    tags: ['Everyday', 'Minimal', 'New home'],
    palette: [
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Cream', hex: '#efe4cf' },
      { name: 'Champagne', hex: '#e6d8bd' },
      { name: 'Eucalyptus', hex: '#a7b294' },
    ],
    flowers: ['Ivory garden rose', 'Cream ranunculus', 'Pale eucalyptus'],
    art: { palette: 'porcelain', variant: 'rose', seed: 'premiere-lumiere' },
    sizes: {
      classic: { price: 62, stems: '7–9 stems', inv: 14 },
      deluxe: { price: 90, stems: '11–13 stems · premium bloom', inv: 9 },
      grand: { price: 122, stems: '15–17 stems · silk ribbon', inv: 6 },
    },
    dims: { w: 10, h: 17 },
    vase: true,
    flags: { bestseller: true },
    created: '2026-04-11T09:00:00.000Z',
  }),
  p({
    id: 'p-04',
    sku: 'BF-ROS-104',
    name: 'Avignon Alexandrine',
    slug: 'avignon-alexandrine',
    short: 'Dusty-rose “Juliet” roses in the loosest, most garden-like gathering.',
    description:
      'The Juliet-style rose we grow for scent reads a little like peony, a little like something you picked on a walk. Avignon Alexandrine gathers those roses loosely, with trailing jasmine and a hand of dusty heaven — the bouquet for people who say they do not like bouquets.',
    collection: 'signature-roses',
    tags: ['Anniversary', 'Hand-tied', 'Garden style'],
    palette: [
      { name: 'Dusty rose', hex: '#d8a7ad' },
      { name: 'Soft blush', hex: '#e4b7c0' },
      { name: 'Sage', hex: '#9aa382' },
      { name: 'Ivory', hex: '#f6ead9' },
    ],
    flowers: ['Juliet garden rose', 'Trailing jasmine', 'Sage'],
    art: { palette: 'blush', variant: 'garden', seed: 'avignon-alexandrine' },
    sizes: {
      classic: { price: 78, stems: '10–12 stems', inv: 9 },
      deluxe: { price: 112, stems: '14–16 stems · garden wrap', inv: 6 },
      grand: { price: 150, stems: '18–20 stems · silk ribbon', inv: 4 },
    },
    vase: false,
    flags: { featured: true },
    created: '2026-06-02T09:00:00.000Z',
  }),
  p({
    id: 'p-05',
    sku: 'BF-ROS-105',
    name: 'Heure d’Or',
    slug: 'heure-dor',
    short: 'Champagne roses for golden-hour tables and long celebrations.',
    description:
      'Heure d’Or — “golden hour” — is the colour of five o’clock light in late October: champagne roses, antique peach ranunculus and a brushed-copper vessel. It performs beautifully on dinner tables, where it holds its shape through dessert and conversation.',
    collection: 'signature-roses',
    tags: ['Dinner party', 'Anniversary', 'Warm tones'],
    palette: [
      { name: 'Champagne', hex: '#e6c98f' },
      { name: 'Antique peach', hex: '#e8b48a' },
      { name: 'Honey', hex: '#c98f4a' },
      { name: 'Bronze', hex: '#a97a43' },
    ],
    flowers: ['Champagne garden rose', 'Antique peach ranunculus', 'Dusty blue thistle'],
    art: { palette: 'sunlit', variant: 'rose', seed: 'heure-dor' },
    sizes: {
      classic: { price: 84, stems: '9–11 stems', inv: 11 },
      deluxe: { price: 120, stems: '13–15 stems · premium bloom', inv: 7 },
      grand: { price: 160, stems: '17–19 stems · silk ribbon', inv: 5 },
    },
    dims: { w: 12, h: 16 },
    vase: true,
    flags: { bestseller: true },
    created: '2026-07-19T09:00:00.000Z',
  }),
  p({
    id: 'p-06',
    sku: 'BF-ROS-106',
    name: 'Bohème en Vin',
    slug: 'boheme-en-vin',
    short: 'Wine, mauve and berry roses in an artist’s palette.',
    description:
      'A painter’s bouquet: wine-red roses, mauve scabiosa and blackberry dahlias, composed with the slightly off-balance confidence of a colour study. It asks to be placed somewhere it will be noticed, and repays the attention for two weeks.',
    collection: 'signature-roses',
    tags: ['Artist’s pick', 'Evening', 'Statement'],
    palette: [
      { name: 'Wine', hex: '#7b2c43' },
      { name: 'Mauve', hex: '#9b7a9c' },
      { name: 'Berry', hex: '#8a3b52' },
      { name: 'Fig', hex: '#5c3a49' },
    ],
    flowers: ['Wine garden rose', 'Mauve scabiosa', 'Blackberry dahlia'],
    art: { palette: 'burgundy', variant: 'dahlia', seed: 'boheme-en-vin' },
    sizes: {
      classic: { price: 72, stems: '9–11 stems', inv: 8 },
      deluxe: { price: 104, stems: '13–15 stems · premium bloom', inv: 5 },
      grand: { price: 140, stems: '17–19 stems · silk ribbon', inv: 3 },
    },
    vase: true,
    flags: { newArrival: true },
    created: '2026-09-26T09:00:00.000Z',
  }),

  /* ------------------------------------------------ BIRTHDAY FLOWERS — 6 */
  p({
    id: 'p-07',
    sku: 'BF-BIR-201',
    name: 'Joyeux Anniversaire',
    slug: 'joyeux-anniversaire',
    short: 'Rounded ranunculus in birthday-bright coral, blush and tangerine.',
    description:
      'The party-leader of the collection: coral ranunculus stacked beside tangerine tulips and a spray of rose confetti, wrapped in paper printed with the atelier monogram. It looks like a celebration even before the candle is lit.',
    collection: 'birthday-flowers',
    tags: ['Birthday', 'Vibrant', 'Gift'],
    palette: [
      { name: 'Coral', hex: '#e8846a' },
      { name: 'Tangerine', hex: '#e59a4d' },
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'Cream', hex: '#f6ead9' },
    ],
    flowers: ['Coral ranunculus', 'Tangerine tulips', 'Rose confetti', 'Yellow solidago'],
    art: { palette: 'sunlit', variant: 'ranunculus', seed: 'joyeux-anniversaire' },
    sizes: {
      classic: { price: 58, stems: '8–10 stems', inv: 16 },
      deluxe: { price: 86, stems: '12–14 stems · premium bloom', inv: 10 },
      grand: { price: 118, stems: '16–18 stems · silk ribbon', inv: 6 },
    },
    dims: { w: 10, h: 16 },
    vase: false,
    flags: { bestseller: true, newArrival: true },
    created: '2026-09-14T09:00:00.000Z',
  }),
  p({
    id: 'p-08',
    sku: 'BF-BIR-202',
    name: 'Citrus Éclat',
    slug: 'citrus-eclat',
    short: 'Orange dahlias and lemon cress — the juice of the season, in a vase.',
    description:
      'Éclat means burst, and this is a bouquet that bursts: vermilion dahlias, orange ranunculus and lemon cress in a palette borrowed from the market stall. Bright enough for a brunch table, awake enough for the whole week.',
    collection: 'birthday-flowers',
    tags: ['Birthday', 'Summer', 'Citrus'],
    palette: [
      { name: 'Vermilion', hex: '#d95d39' },
      { name: 'Tangerine', hex: '#e59a4d' },
      { name: 'Lemon', hex: '#e8c95a' },
      { name: 'Cream', hex: '#f6ead9' },
    ],
    flowers: ['Vermilion dahlia', 'Orange ranunculus', 'Lemon cress', 'Bachelor’s button'],
    art: { palette: 'sunlit', variant: 'dahlia', seed: 'citrus-eclat' },
    sizes: {
      classic: { price: 54, stems: '7–9 stems', inv: 15 },
      deluxe: { price: 80, stems: '11–13 stems · premium bloom', inv: 9 },
      grand: { price: 110, stems: '15–17 stems · silk ribbon', inv: 5 },
    },
    vase: false,
    flags: { bestseller: true },
    created: '2026-06-28T09:00:00.000Z',
  }),
  p({
    id: 'p-09',
    sku: 'BF-BIR-203',
    name: 'Rose Party',
    slug: 'rose-party',
    short: 'A dessert-pink party in a wrap — spray roses, peony and raspberry.',
    description:
      'Rose Party is the colour of birthday cake: hot-pink spray roses, a blush peony and raspberry ranunculus gathered into a tight, round, unapologetically pink parcel. It photographs beautifully and the recipient will hold it like a trophy.',
    collection: 'birthday-flowers',
    tags: ['Birthday', 'Pink', 'Celebration'],
    palette: [
      { name: 'Hot pink', hex: '#d9658d' },
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'Raspberry', hex: '#c22f56' },
      { name: 'Cream', hex: '#f6ead9' },
    ],
    flowers: ['Hot-pink spray rose', 'Blush peony', 'Raspberry ranunculus'],
    art: { palette: 'blush', variant: 'peony', seed: 'rose-party' },
    sizes: {
      classic: { price: 60, stems: '8–10 stems', inv: 13 },
      deluxe: { price: 90, stems: '12–14 stems · premium bloom', inv: 8 },
      grand: { price: 124, stems: '16–18 stems · silk ribbon', inv: 5 },
    },
    vase: false,
    flags: { bestseller: true },
    created: '2026-05-05T09:00:00.000Z',
  }),
  p({
    id: 'p-10',
    sku: 'BF-BIR-204',
    name: 'Soleil Levant',
    slug: 'soleil-levant',
    short: 'Yellow tulips that rise like a morning alarm you are happy to hear.',
    description:
      'Soleil Levant is all optimism: butter-yellow tulips at their most vertical, green bell peppers of ranunculus, and a small sunburst of solidago. It belongs on a breakfast table, or anywhere a person needs to be reminded that the day has started well.',
    collection: 'birthday-flowers',
    tags: ['Birthday', 'Yellow', 'Morning'],
    palette: [
      { name: 'Butter yellow', hex: '#e8c95a' },
      { name: 'Saffron', hex: '#d99a3e' },
      { name: 'Green apple', hex: '#a8b55a' },
      { name: 'Cream', hex: '#f6ead9' },
    ],
    flowers: ['Butter-yellow tulips', 'Green ranunculus', 'Solidago'],
    art: { palette: 'sunlit', variant: 'tulip', seed: 'soleil-levant' },
    sizes: {
      classic: { price: 50, stems: '10–12 stems', inv: 18 },
      deluxe: { price: 76, stems: '14–16 stems · premium bloom', inv: 11 },
      grand: { price: 106, stems: '18–20 stems · silk ribbon', inv: 7 },
    },
    dims: { w: 9, h: 18 },
    vase: false,
    flags: { newArrival: true },
    created: '2026-08-30T09:00:00.000Z',
  }),
  p({
    id: 'p-11',
    sku: 'BF-BIR-205',
    name: 'Confetti',
    slug: 'confetti',
    short: 'The whole market, gathered — our most colourful mixed bouquet.',
    description:
      'Confetti is the bouquet we love to argue about: every colour in the room at once, in deliberately mismatched heights, finished with a printed ribbon that says what the flowers already have. Give it to the person who makes everything livelier.',
    collection: 'birthday-flowers',
    tags: ['Birthday', 'Mixed', 'Colourful'],
    palette: [
      { name: 'Coral', hex: '#e8846a' },
      { name: 'Saffron', hex: '#d99a3e' },
      { name: 'Lavender', hex: '#9d8dbb' },
      { name: 'Hot pink', hex: '#d9658d' },
    ],
    flowers: ['Spray rose', 'Ranunculus', 'Scabiosa', 'Solidago', 'Aster'],
    art: { palette: 'garden', variant: 'mixed', seed: 'confetti' },
    sizes: {
      classic: { price: 56, stems: '10–12 stems', inv: 17 },
      deluxe: { price: 84, stems: '14–16 stems · garden wrap', inv: 12 },
      grand: { price: 116, stems: '18–20 stems · silk ribbon', inv: 8 },
    },
    vase: false,
    flags: {},
    created: '2026-07-07T09:00:00.000Z',
  }),
  p({
    id: 'p-12',
    sku: 'BF-BIR-206',
    name: 'Baies d’Été',
    slug: 'baies-dete',
    short: 'Berry-bright roses with blackberry and hypericum for a sweet tooth.',
    description:
      'Dessert-coloured flowers: raspberry spray roses, blackberry dahlia heads and the little coral berries of hypericum, set off by deep green foliage. Baies d’Été is the gift for anyone who says they prefer berries to roses — this has both.',
    collection: 'birthday-flowers',
    tags: ['Birthday', 'Berry', 'Sweet'],
    palette: [
      { name: 'Raspberry', hex: '#c22f56' },
      { name: 'Blackberry', hex: '#5d2b45' },
      { name: 'Coral', hex: '#e8846a' },
      { name: 'Deep green', hex: '#4f6b4a' },
    ],
    flowers: ['Raspberry spray rose', 'Blackberry dahlia', 'Hypericum berry', 'Dark green salal'],
    art: { palette: 'burgundy', variant: 'mixed', seed: 'baies-dete' },
    sizes: {
      classic: { price: 62, stems: '8–10 stems', inv: 12 },
      deluxe: { price: 92, stems: '12–14 stems · premium bloom', inv: 8 },
      grand: { price: 126, stems: '16–18 stems · silk ribbon', inv: 5 },
    },
    vase: true,
    flags: { newArrival: true },
    created: '2026-09-20T09:00:00.000Z',
  }),

  /* ------------------------------------------------ WEDDING & ROMANCE — 6 */
  p({
    id: 'p-13',
    sku: 'BF-WED-301',
    name: 'La Mariée',
    slug: 'la-mariee',
    short: 'The bridal classic — ivory peonies and garden roses, hand-tied for the aisle.',
    description:
      'La Mariée is the bouquet we hand-tie for the moment of the aisle: ivory peonies at their most generous, garden roses still opening, and a trailing ribbon the colour of champagne. It is composed to photograph in any light and to be carried with one hand held loose.',
    collection: 'wedding-romance',
    tags: ['Bridal', 'Peony', 'Wedding'],
    palette: [
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Cream', hex: '#efe4cf' },
      { name: 'Champagne', hex: '#e6d8bd' },
      { name: 'Sage', hex: '#9aa382' },
    ],
    flowers: ['Ivory peony', 'Cream garden rose', 'Trailing freesia', 'Silver eucalyptus'],
    art: { palette: 'porcelain', variant: 'peony', seed: 'la-mariee' },
    sizes: {
      classic: { price: 148, stems: '9–11 premium stems', inv: 6 },
      deluxe: { price: 218, stems: '13–15 premium stems · garden wrap', inv: 4 },
      grand: { price: 290, stems: '17–19 premium stems · silk ribbon', inv: 3 },
    },
    dims: { w: 13, h: 20 },
    vase: false,
    flags: { featured: true, bestseller: true },
    created: '2026-02-14T09:00:00.000Z',
  }),
  p({
    id: 'p-14',
    sku: 'BF-WED-302',
    name: 'Romance du Soir',
    slug: 'romance-du-soir',
    short: 'Blush and peony-rose florals for proposals and candlelit anniversaries.',
    description:
      'Composed for the hour when the light goes amber: blush garden roses, peonies and a deep raspberry undertone, gathered loosely so the arrangement moves like a slow conversation. Romance du Soir is our most requested proposal bouquet.',
    collection: 'wedding-romance',
    tags: ['Proposal', 'Anniversary', 'Romance'],
    palette: [
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'Peony rose', hex: '#d8a7ad' },
      { name: 'Raspberry', hex: '#c22f56' },
      { name: 'Ivory', hex: '#f6ead9' },
    ],
    flowers: ['Blush garden rose', 'Pink peony', 'Raspberry ranunculus', 'Matthiola'],
    art: { palette: 'blush', variant: 'peony', seed: 'romance-du-soir' },
    sizes: {
      classic: { price: 132, stems: '9–11 stems', inv: 7 },
      deluxe: { price: 198, stems: '13–15 stems · garden wrap', inv: 4 },
      grand: { price: 266, stems: '17–19 stems · silk ribbon', inv: 3 },
    },
    compareAt: 150,
    dims: { w: 12, h: 18 },
    vase: false,
    flags: { featured: true, bestseller: true },
    created: '2026-01-30T09:00:00.000Z',
  }),
  p({
    id: 'p-15',
    sku: 'BF-WED-303',
    name: 'Bouquet Blanc',
    slug: 'bouquet-blanc',
    short: 'An all-white classic: roses, lisianthus, sweet pea and eucalyptus.',
    description:
      'Bouquet Blanc is the white-on-white arrangement that works for elopements, second weddings and vow renewals: white garden roses, lisianthus like porcelain bells, sweet pea that scents the room, and eucalyptus for the green shadows. Nothing about it shouts; everything about it is considered.',
    collection: 'wedding-romance',
    tags: ['Wedding', 'White', 'Classic'],
    palette: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Cream', hex: '#efe4cf' },
      { name: 'Eucalyptus', hex: '#9aa382' },
    ],
    flowers: ['White garden rose', 'Lisianthus', 'Sweet pea', 'Eucalyptus'],
    art: { palette: 'porcelain', variant: 'garden', seed: 'bouquet-blanc' },
    sizes: {
      classic: { price: 120, stems: '10–12 stems', inv: 8 },
      deluxe: { price: 180, stems: '14–16 stems · garden wrap', inv: 5 },
      grand: { price: 240, stems: '18–20 stems · silk ribbon', inv: 3 },
    },
    dims: { w: 12, h: 18 },
    vase: false,
    flags: { bestseller: true },
    created: '2026-03-18T09:00:00.000Z',
  }),
  p({
    id: 'p-16',
    sku: 'BF-WED-304',
    name: 'Propos de Paris',
    slug: 'propos-de-paris',
    short: 'A Parisian proposal in red — deep roses, silk and nothing else.',
    description:
      'Propos de Paris is deliberately simple: forty or so red garden roses in one clear gesture, wrapped in silk and tied with a single ribbon. It is the arrangement for the proposal with a script, photographed as many times as said.',
    collection: 'wedding-romance',
    tags: ['Proposal', 'Red roses', 'Statement'],
    palette: [
      { name: 'Bordeaux', hex: '#701f33' },
      { name: 'Crimson', hex: '#9c2440' },
      { name: 'Deep red', hex: '#8a2a33' },
      { name: 'Silk ivory', hex: '#f6ead9' },
    ],
    flowers: ['Bordeaux garden rose', 'Crimson spray rose', 'Leatherleaf fern'],
    art: { palette: 'burgundy', variant: 'rose', seed: 'propos-de-paris' },
    sizes: {
      classic: { price: 138, stems: '10–12 stems', inv: 6 },
      deluxe: { price: 206, stems: '15–17 stems · premium bloom', inv: 4 },
      grand: { price: 276, stems: '20–24 stems · silk ribbon', inv: 2 },
    },
    dims: { w: 12, h: 19 },
    vase: false,
    flags: { featured: true },
    created: '2026-04-27T09:00:00.000Z',
  }),
  p({
    id: 'p-17',
    sku: 'BF-WED-305',
    name: 'Arche de Cérémonie',
    slug: 'arche-de-ceremonie',
    short: 'A sculptural ceremony piece — garden roses, hydrangea and trailing greenery.',
    description:
      'Arche de Cérémonie is a ceremony statement: a wide, low bowl of white and champagne blooms with two tall arcs of greenery and garden roses, designed to frame a vow exchange or anchor a long dinner table. It arrives understated and becomes the room.',
    collection: 'wedding-romance',
    tags: ['Ceremony', 'Installation', 'Statement'],
    palette: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Champagne', hex: '#e6d8bd' },
      { name: 'Sage', hex: '#9aa382' },
      { name: 'Silver', hex: '#c9cede' },
    ],
    flowers: ['White garden rose', 'Hydrangea', 'Italian ruscus', 'Silver brunia'],
    art: { palette: 'porcelain', variant: 'hydrangea', seed: 'arche-de-ceremonie' },
    sizes: {
      classic: { price: 162, stems: '14–16 premium stems', inv: 4 },
      deluxe: { price: 242, stems: '18–22 premium stems', inv: 2 },
      grand: { price: 322, stems: '24–30 premium stems · installation', inv: 1 },
    },
    dims: { w: 20, h: 24 },
    vase: true,
    flags: { featured: true },
    created: '2026-05-23T09:00:00.000Z',
  }),
  p({
    id: 'p-18',
    sku: 'BF-WED-306',
    name: 'Amour Éternel',
    slug: 'amour-eternel',
    short: 'Burgundy and ivory, paired like a classic suit and tie.',
    description:
      'Amour Éternel works the house palette front to back: burgundy garden roses, ivory ranunculus, a collar of wine-dark foliage. It is the anniversary arrangement that says the marriage has matured well — for the table that has hosted thirty years of dinners.',
    collection: 'wedding-romance',
    tags: ['Anniversary', 'Classic', 'Evening'],
    palette: [
      { name: 'Burgundy', hex: '#5d2033' },
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Wine', hex: '#7b2c43' },
      { name: 'Greenery', hex: '#4f6b4a' },
    ],
    flowers: ['Burgundy garden rose', 'Ivory ranunculus', 'Waxflower', 'Ruscus'],
    art: { palette: 'burgundy', variant: 'rose', seed: 'amour-eternel' },
    sizes: {
      classic: { price: 142, stems: '10–12 stems', inv: 0 },
      deluxe: { price: 212, stems: '14–16 stems · premium bloom', inv: 0 },
      grand: { price: 284, stems: '18–20 stems · silk ribbon', inv: 0 },
    },
    dims: { w: 12, h: 18 },
    vase: true,
    flags: { featured: true },
    inStock: false,
    created: '2026-06-15T09:00:00.000Z',
  }),

  /* ------------------------------------------------ SYMPATHY & REMEMBRANCE — 6 */
  p({
    id: 'p-19',
    sku: 'BF-SYM-401',
    name: 'Douce Mémoire',
    slug: 'douce-memoire',
    short: 'White lilies and cream roses — the classic sympathy arrangement, composed gently.',
    description:
      'Douce Mémoire is our most requested sympathy piece: white lilies with their scent held (we remove the stamens), cream roses and a collar of soft green. It is composed quietly, delivered plainly, and meant to stay beautiful for the days a family needs.',
    collection: 'sympathy-remembrance',
    tags: ['Sympathy', 'White', 'Classic'],
    palette: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Cream', hex: '#efe4cf' },
      { name: 'Soft green', hex: '#a7b294' },
    ],
    flowers: ['White oriental lily', 'Cream garden rose', 'Lisianthus', 'Bear grass'],
    art: { palette: 'porcelain', variant: 'lily', seed: 'douce-memoire' },
    sizes: {
      classic: { price: 98, stems: '8–10 stems', inv: 10 },
      deluxe: { price: 146, stems: '12–14 stems · premium bloom', inv: 7 },
      grand: { price: 196, stems: '16–18 stems · silk ribbon', inv: 4 },
    },
    dims: { w: 13, h: 18 },
    vase: true,
    flags: { featured: true, bestseller: true },
    created: '2026-02-02T09:00:00.000Z',
  }),
  p({
    id: 'p-20',
    sku: 'BF-SYM-402',
    name: 'Grâce Douce',
    slug: 'grace-douce',
    short: 'Soft pastels — blush roses, white ranunculus and lavender.',
    description:
      'Grâce Douce softens the sympathy palette into pastel: blush garden roses, white ranunculus and a whisper of lavender, gathered as loose as a held hand. For the person whose grief is quiet, and the room that should feel gentle.',
    collection: 'sympathy-remembrance',
    tags: ['Sympathy', 'Pastel', 'Gentle'],
    palette: [
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'White', hex: '#ffffff' },
      { name: 'Lavender', hex: '#b5a7c9' },
      { name: 'Sage', hex: '#9aa382' },
    ],
    flowers: ['Blush garden rose', 'White ranunculus', 'Lavender', 'Silver brunia'],
    art: { palette: 'lavender', variant: 'ranunculus', seed: 'grace-douce' },
    sizes: {
      classic: { price: 86, stems: '8–10 stems', inv: 11 },
      deluxe: { price: 128, stems: '12–14 stems · premium bloom', inv: 7 },
      grand: { price: 172, stems: '16–18 stems · silk ribbon', inv: 4 },
    },
    vase: true,
    flags: {},
    created: '2026-03-11T09:00:00.000Z',
  }),
  p({
    id: 'p-21',
    sku: 'BF-SYM-403',
    name: 'Prière Silencieuse',
    slug: 'priere-silencieuse',
    short: 'A single clear gesture: white roses and white hydrangea in quiet proportion.',
    description:
      'Prière Silencieuse — “silent prayer” — is the most restrained piece we make: white roses opening over a mound of white hydrangea, nothing else. It holds the room’s attention the way a held silence does, and asks for nothing in return.',
    collection: 'sympathy-remembrance',
    tags: ['Sympathy', 'White', 'Minimal'],
    palette: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Silver', hex: '#e2e4ea' },
      { name: 'Green', hex: '#a7b294' },
    ],
    flowers: ['White garden rose', 'White hydrangea', 'Ferns'],
    art: { palette: 'porcelain', variant: 'hydrangea', seed: 'priere-silencieuse' },
    sizes: {
      classic: { price: 80, stems: '7–9 stems', inv: 12 },
      deluxe: { price: 118, stems: '10–12 stems · premium bloom', inv: 8 },
      grand: { price: 160, stems: '14–16 stems · silk ribbon', inv: 5 },
    },
    dims: { w: 13, h: 15 },
    vase: true,
    flags: {},
    created: '2026-04-04T09:00:00.000Z',
  }),
  p({
    id: 'p-22',
    sku: 'BF-SYM-404',
    name: 'Paix Éternelle',
    slug: 'paix-eternelle',
    short: 'Ivory blooms resting in a frame of eucalyptus and olive greenery.',
    description:
      'Paix Éternelle surrounds ivory roses and peonies with the long lines of eucalyptus and olive — greenery that speaks of continuation. It is the piece we make when a family asks for something less traditional but equally serene.',
    collection: 'sympathy-remembrance',
    tags: ['Sympathy', 'Greenery', 'Serene'],
    palette: [
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Olive', hex: '#8a946b' },
      { name: 'Eucalyptus', hex: '#9aa382' },
      { name: 'Cream', hex: '#efe4cf' },
    ],
    flowers: ['Ivory garden rose', 'Ivory peony', 'Eucalyptus', 'Olive foliage'],
    art: { palette: 'garden', variant: 'garden', seed: 'paix-eternelle' },
    sizes: {
      classic: { price: 90, stems: '9–11 stems', inv: 9 },
      deluxe: { price: 134, stems: '13–15 stems · premium bloom', inv: 6 },
      grand: { price: 180, stems: '17–19 stems · silk ribbon', inv: 3 },
    },
    dims: { w: 12, h: 19 },
    vase: true,
    flags: {},
    created: '2026-05-10T09:00:00.000Z',
  }),
  p({
    id: 'p-23',
    sku: 'BF-SYM-405',
    name: 'Réconfort',
    slug: 'reconfort',
    short: 'Pale pink roses and white lisianthus — comfort in the smallest scale.',
    description:
      'Réconfort is made to be the smallest possible gesture with the fullest possible meaning: pale pink garden roses, white lisianthus and a breath of lavender at the collar. It travels in a plain box that we ask you to open privately, because the first look should be yours.',
    collection: 'sympathy-remembrance',
    tags: ['Sympathy', 'Pink', 'Small'],
    palette: [
      { name: 'Pale pink', hex: '#eed6da' },
      { name: 'White', hex: '#ffffff' },
      { name: 'Lavender', hex: '#c3b6d4' },
      { name: 'Sage', hex: '#9aa382' },
    ],
    flowers: ['Pale pink garden rose', 'White lisianthus', 'Lavender', 'Heather'],
    art: { palette: 'blush', variant: 'garden', seed: 'reconfort' },
    sizes: {
      classic: { price: 84, stems: '8–10 stems', inv: 11 },
      deluxe: { price: 126, stems: '12–14 stems · premium bloom', inv: 7 },
      grand: { price: 170, stems: '16–18 stems · silk ribbon', inv: 4 },
    },
    dims: { w: 11, h: 15 },
    vase: true,
    flags: {},
    created: '2026-06-25T09:00:00.000Z',
  }),
  p({
    id: 'p-24',
    sku: 'BF-SYM-406',
    name: 'Jardin du Souvenir',
    slug: 'jardin-du-souvenir',
    short: 'A gathered garden of whites and greens, like a remembered morning walk.',
    description:
      'Jardin du Souvenir gathers everything a memory garden should hold: white roses, daisies, chamomile-like feverfew, berries and a generous run of greenery. It is for the person who lived in their garden, and for the family who will gather beside it.',
    collection: 'sympathy-remembrance',
    tags: ['Sympathy', 'Garden', 'Remembrance'],
    palette: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Garden green', hex: '#7c8b63' },
      { name: 'Cream', hex: '#efe4cf' },
      { name: 'Berry', hex: '#8a3b52' },
    ],
    flowers: ['White rose', 'Feverfew', 'Salal berry', 'Ruscus', 'Daisy'],
    art: { palette: 'garden', variant: 'mixed', seed: 'jardin-du-souvenir' },
    sizes: {
      classic: { price: 94, stems: '12–14 stems', inv: 10 },
      deluxe: { price: 140, stems: '16–18 stems · garden wrap', inv: 6 },
      grand: { price: 188, stems: '20–24 stems · silk ribbon', inv: 4 },
    },
    vase: false,
    flags: { newArrival: true },
    created: '2026-08-21T09:00:00.000Z',
  }),

  /* ------------------------------------------------ SEASONAL BLOOMS — 6 */
  p({
    id: 'p-25',
    sku: 'BF-SEA-501',
    name: 'Automne Doré',
    slug: 'automne-dore',
    short: 'Amaryllis, dahlias and gold foliage for the season of long shadows.',
    description:
      'Automne Doré is October in a vessel: papery amaryllis, golden dahlia heads, oak leaves that hold their copper colour, and small ornamental gourds on wire. It is the centrepiece we refuse to photograph in studio light — it belongs in late-afternoon sun.',
    collection: 'seasonal-blooms',
    tags: ['Autumn', 'Table', 'Warm'],
    palette: [
      { name: 'Copper', hex: '#b4572f' },
      { name: 'Gold', hex: '#e0b07a' },
      { name: 'Amber', hex: '#c98f4a' },
      { name: 'Oak', hex: '#8f3e2a' },
    ],
    flowers: ['Amaryllis', 'Golden dahlia', 'Oak foliage', 'Ornamental gourd'],
    art: { palette: 'autumn', variant: 'dahlia', seed: 'automne-dore' },
    sizes: {
      classic: { price: 72, stems: '8–10 stems', inv: 12 },
      deluxe: { price: 108, stems: '12–14 stems · premium bloom', inv: 8 },
      grand: { price: 146, stems: '16–18 stems · silk ribbon', inv: 5 },
    },
    compareAt: 84,
    dims: { w: 13, h: 16 },
    vase: true,
    flags: { featured: true, newArrival: true },
    created: '2026-09-28T09:00:00.000Z',
  }),
  p({
    id: 'p-26',
    sku: 'BF-SEA-502',
    name: 'Hiver Blanc',
    slug: 'hiver-blanc',
    short: 'Winter white anemones, paperwhites and a brush of frost-blue berries.',
    description:
      'Hiver Blanc is the bouquet of windows in December: white anemones with ink-dark centres, paperwhite narcissus, and frost-blue berries that look dipped in snow. Cool, crisp and quietly festive — mistletoe not required.',
    collection: 'seasonal-blooms',
    tags: ['Winter', 'Holiday', 'White'],
    palette: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Frost blue', hex: '#c9cede' },
      { name: 'Ink', hex: '#2d2730' },
      { name: 'Silver', hex: '#e2e4ea' },
    ],
    flowers: ['White anemone', 'Paperwhite', 'Frost berry', 'Spruce tip'],
    art: { palette: 'porcelain', variant: 'ranunculus', seed: 'hiver-blanc' },
    sizes: {
      classic: { price: 88, stems: '9–11 stems', inv: 10 },
      deluxe: { price: 132, stems: '13–15 stems · premium bloom', inv: 6 },
      grand: { price: 178, stems: '17–19 stems · silk ribbon', inv: 4 },
    },
    dims: { w: 11, h: 17 },
    vase: true,
    flags: { newArrival: true },
    created: '2026-10-12T09:00:00.000Z',
  }),
  p({
    id: 'p-27',
    sku: 'BF-SEA-503',
    name: 'Printemps',
    slug: 'printemps',
    short: 'Spring’s first pastels — ranunculus, hyacinth and muscari in bloom.',
    description:
      'Printemps arrives the week the growers call us about the first ranunculus: candy-coloured heads, blue muscari like tiny bells, and hyacinth that perfumes a hallway. It is our shortest-season collection and the one people write us about most.',
    collection: 'seasonal-blooms',
    tags: ['Spring', 'Pastel', 'Fresh'],
    palette: [
      { name: 'Candy pink', hex: '#e8a9b8' },
      { name: 'Muscari blue', hex: '#7a88c8' },
      { name: 'Butter', hex: '#e8c95a' },
      { name: 'White', hex: '#ffffff' },
    ],
    flowers: ['Ranunculus', 'Hyacinth', 'Muscari', 'Tulip'],
    art: { palette: 'lavender', variant: 'ranunculus', seed: 'printemps' },
    sizes: {
      classic: { price: 68, stems: '10–12 stems', inv: 15 },
      deluxe: { price: 102, stems: '14–16 stems · premium bloom', inv: 9 },
      grand: { price: 138, stems: '18–20 stems · silk ribbon', inv: 6 },
    },
    vase: false,
    flags: {},
    created: '2026-03-22T09:00:00.000Z',
  }),
  p({
    id: 'p-28',
    sku: 'BF-SEA-504',
    name: 'Soirée d’Été',
    slug: 'soiree-dete',
    short: 'Sunflowers, limonium and grasses for long tables and longer evenings.',
    description:
      'Soirée d’Été is summer party logistics solved: sunflower heads, airy limonium and the dry grasses that survive a June evening without a drop of water. Set it on the table at five, light the candles at nine, throw it out glowing at one — it does the whole shift.',
    collection: 'seasonal-blooms',
    tags: ['Summer', 'Outdoor', 'Party'],
    palette: [
      { name: 'Sunflower gold', hex: '#e0b544' },
      { name: 'Amber', hex: '#c9802f' },
      { name: 'Wheat', hex: '#d8c48a' },
      { name: 'Green', hex: '#7c8b63' },
    ],
    flowers: ['Sunflower', 'Limonium', 'Dried grass', 'Zinnia'],
    art: { palette: 'sunlit', variant: 'sunflower', seed: 'soiree-dete' },
    sizes: {
      classic: { price: 70, stems: '8–10 stems', inv: 14 },
      deluxe: { price: 106, stems: '12–14 stems · premium bloom', inv: 9 },
      grand: { price: 144, stems: '16–18 stems · silk ribbon', inv: 6 },
    },
    dims: { w: 12, h: 17 },
    vase: false,
    flags: { featured: true, bestseller: true },
    created: '2026-06-08T09:00:00.000Z',
  }),
  p({
    id: 'p-29',
    sku: 'BF-SEA-505',
    name: 'Chrysanthème d’Or',
    slug: 'chrysantheme-dor',
    short: 'Golden chrysanthemums and alstroemeria — the reliable autumn workhorse.',
    description:
      'Golden chrysanthemum is the bloom of autumn markets everywhere, and d’Or treats it with respect: wide gold heads, orange alstroemeria, and the surprising staying power only chrysanthemum has — two full weeks in a cool room. Understated, generous, dependable.',
    collection: 'seasonal-blooms',
    tags: ['Autumn', 'Long-lasting', 'Budget-friendly'],
    palette: [
      { name: 'Chrysanthemum gold', hex: '#e0a83e' },
      { name: 'Orange', hex: '#d97a2f' },
      { name: 'Honey', hex: '#c98f4a' },
      { name: 'Green', hex: '#7c8b63' },
    ],
    flowers: ['Golden chrysanthemum', 'Alstroemeria', 'Solidago'],
    art: { palette: 'sunlit', variant: 'dahlia', seed: 'chrysantheme-dor' },
    sizes: {
      classic: { price: 64, stems: '9–11 stems', inv: 1 },
      deluxe: { price: 96, stems: '13–15 stems · premium bloom', inv: 2 },
      grand: { price: 130, stems: '17–19 stems · silk ribbon', inv: 1 },
    },
    dims: { w: 11, h: 15 },
    vase: true,
    flags: { newArrival: true },
    created: '2026-10-05T09:00:00.000Z',
  }),
  p({
    id: 'p-30',
    sku: 'BF-SEA-506',
    name: 'Récolte',
    slug: 'recolte',
    short: 'A harvest table in a vase — rust dahlias, chocolate cosmos and berry.',
    description:
      'Récolte is the colour story of the harvest table: rust and bronze dahlias, chocolate cosmos with its cocoa scent, blackberry berries and wheat stems. It is the arrangement we send to chefs, growers and anyone whose kitchen faces a field.',
    collection: 'seasonal-blooms',
    tags: ['Autumn', 'Harvest', 'Natural'],
    palette: [
      { name: 'Rust', hex: '#a94b2a' },
      { name: 'Chocolate', hex: '#6b3a2a' },
      { name: 'Bronze', hex: '#a97a43' },
      { name: 'Berry', hex: '#8a3b52' },
    ],
    flowers: ['Rust dahlia', 'Chocolate cosmos', 'Wheat', 'Blackberry'],
    art: { palette: 'autumn', variant: 'dahlia', seed: 'recolte' },
    sizes: {
      classic: { price: 74, stems: '9–11 stems', inv: 9 },
      deluxe: { price: 112, stems: '13–15 stems · premium bloom', inv: 6 },
      grand: { price: 152, stems: '17–19 stems · silk ribbon', inv: 4 },
    },
    dims: { w: 13, h: 17 },
    vase: true,
    flags: {},
    created: '2026-09-02T09:00:00.000Z',
  }),

  /* ------------------------------------------------ LUXURY ARRANGEMENTS — 6 */
  p({
    id: 'p-31',
    sku: 'BF-LUX-601',
    name: 'Grand Palais',
    slug: 'grand-palais',
    short: 'Our grandest rose-and-peony composition, built for the centre of a grand room.',
    description:
      'Grand Palais is the full atelier on a dining table: two dozen stems of the season’s best garden roses, ivory peonies, and an architecture of greenery that holds its sculpture for two weeks. It is made to order, photographed on delivery day, and hand-carried in the studio vault.',
    collection: 'luxury-arrangements',
    tags: ['Statement', 'Luxury', 'Grand'],
    palette: [
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'Champagne', hex: '#e6d8bd' },
      { name: 'Wine', hex: '#7b2c43' },
    ],
    flowers: ['Garden rose', 'Ivory peony', 'Tuberose', 'Ruscus', 'Silver brunia'],
    art: { palette: 'porcelain', variant: 'peony', seed: 'grand-palais' },
    sizes: {
      classic: { price: 168, stems: '16–18 premium stems', inv: 4 },
      deluxe: { price: 252, stems: '22–26 premium stems', inv: 3 },
      grand: { price: 336, stems: '28–34 premium stems · installation', inv: 2 },
    },
    dims: { w: 20, h: 22 },
    vase: true,
    flags: { featured: true, bestseller: true },
    created: '2026-01-12T09:00:00.000Z',
  }),
  p({
    id: 'p-32',
    sku: 'BF-LUX-602',
    name: 'Opulence',
    slug: 'opulence',
    short: 'Peonies and orchids in a porcelain vessel, for the moments that matter most.',
    description:
      'Opulence pairs the two blooms people ask for by name — peony and phalaenopsis orchid — in a hand-thrown porcelain vessel from our studio collaborator. It is the arrangement for the gesture that should not be forgotten: the partner, the parent, the client who signs.',
    collection: 'luxury-arrangements',
    tags: ['Luxury', 'Orchid', 'Gift'],
    palette: [
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'Porcelain white', hex: '#ffffff' },
      { name: 'Sage', hex: '#9aa382' },
    ],
    flowers: ['Phalaenopsis orchid', 'Ivory peony', 'White garden rose', 'Italian ruscus'],
    art: { palette: 'porcelain', variant: 'orchid', seed: 'opulence' },
    sizes: {
      classic: { price: 176, stems: '14–16 premium stems', inv: 4 },
      deluxe: { price: 262, stems: '18–22 premium stems', inv: 3 },
      grand: { price: 348, stems: '24–30 premium stems · installation', inv: 1 },
    },
    dims: { w: 16, h: 20 },
    vase: true,
    flags: { featured: true },
    created: '2026-02-20T09:00:00.000Z',
  }),
  p({
    id: 'p-33',
    sku: 'BF-LUX-603',
    name: 'Jardin Secret',
    slug: 'jardin-secret',
    short: 'A walled garden gathered into a vase — loose, layered and deeply romantic.',
    description:
      'Jardin Secret is the luxury piece that wears its cost lightly: a dense, garden-style gather of roses, peonies, ranunculus and textural foliage that looks picked, not composed. It is the arrangement for the maison with the overgrown garden and the beautiful table.',
    collection: 'luxury-arrangements',
    tags: ['Luxury', 'Garden style', 'Romantic'],
    palette: [
      { name: 'Dusty rose', hex: '#d8a7ad' },
      { name: 'Cream', hex: '#efe4cf' },
      { name: 'Sage', hex: '#9aa382' },
      { name: 'Peach', hex: '#e8b48a' },
    ],
    flowers: ['Juliet rose', 'Peony', 'Ranunculus', 'Scabiosa', 'Eucalyptus'],
    art: { palette: 'garden', variant: 'garden', seed: 'jardin-secret' },
    sizes: {
      classic: { price: 158, stems: '14–16 premium stems', inv: 5 },
      deluxe: { price: 238, stems: '18–22 premium stems', inv: 3 },
      grand: { price: 318, stems: '24–30 premium stems · installation', inv: 2 },
    },
    dims: { w: 15, h: 19 },
    vase: false,
    flags: { featured: true },
    created: '2026-03-05T09:00:00.000Z',
  }),
  p({
    id: 'p-34',
    sku: 'BF-LUX-604',
    name: 'Impérial',
    slug: 'imperial',
    short: 'Cymbidium orchids and amaranth in a tall, architectural statement.',
    description:
      'Impérial is the architecture of the collection: three candlestick cymbidium orchids, a fall of wine amaranth, and crisp structural foliage on a tall water line. It reads as sculpture before it reads as flowers, and it is the piece our events clients request by photograph.',
    collection: 'luxury-arrangements',
    tags: ['Luxury', 'Architectural', 'Orchid'],
    palette: [
      { name: 'Wine', hex: '#7b2c43' },
      { name: 'Champagne', hex: '#e6d8bd' },
      { name: 'Lavender', hex: '#b5a7c9' },
      { name: 'Deep green', hex: '#4f6b4a' },
    ],
    flowers: ['Cymbidium orchid', 'Amaranth', 'Anthurium', 'Leatherleaf'],
    art: { palette: 'lavender', variant: 'orchid', seed: 'imperial' },
    sizes: {
      classic: { price: 172, stems: '12–14 premium stems', inv: 4 },
      deluxe: { price: 258, stems: '16–20 premium stems', inv: 2 },
      grand: { price: 344, stems: '22–28 premium stems · installation', inv: 1 },
    },
    dims: { w: 14, h: 26 },
    vase: true,
    flags: {},
    created: '2026-04-19T09:00:00.000Z',
  }),
  p({
    id: 'p-35',
    sku: 'BF-LUX-605',
    name: 'Versailles Rose',
    slug: 'versailles-rose',
    short: 'A towering garden-rose column, the most photographed piece in the atelier.',
    description:
      'Versailles Rose is the column we build in the window of the atelier every spring: sixty or more garden-rose stems rising from a plinth of greenery to a crown of peonies. It is photographed on the hour by the street, and it is the arrangement we refuse to miniaturise.',
    collection: 'luxury-arrangements',
    tags: ['Luxury', 'Statement', 'Rose'],
    palette: [
      { name: 'Antique pink', hex: '#e0a3b2' },
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Champagne', hex: '#e6d8bd' },
      { name: 'Green', hex: '#5f6b51' },
    ],
    flowers: ['Garden rose', 'Ivory peony', 'Phlox', 'Ruscus'],
    art: { palette: 'blush', variant: 'rose', seed: 'versailles-rose' },
    sizes: {
      classic: { price: 180, stems: '20–24 premium stems', inv: 3 },
      deluxe: { price: 270, stems: '26–32 premium stems', inv: 2 },
      grand: { price: 348, stems: '36–44 premium stems · installation', inv: 1 },
    },
    dims: { w: 14, h: 28 },
    vase: true,
    flags: { featured: true, newArrival: true },
    created: '2026-09-09T09:00:00.000Z',
  }),
  p({
    id: 'p-36',
    sku: 'BF-LUX-606',
    name: 'Le Grand Bouquet',
    slug: 'le-grand-bouquet',
    short: 'The largest bouquet the atelier pays forward — the centrepiece of the house.',
    description:
      'Le Grand Bouquet is what we mean when we say couture flowers: a composition of the season’s rarest stems — lily-of-the-valley in spring, hybrid tea roses in summer, gardenias in winter — built over three hours in the studio and delivered white-glove to wherever the moment is. It is our gift for the once-in-a-lifetime.',
    collection: 'luxury-arrangements',
    tags: ['Luxury', 'Grand', 'Couture'],
    palette: [
      { name: 'Ivory', hex: '#f6ead9' },
      { name: 'Blush', hex: '#e4b7c0' },
      { name: 'Champagne', hex: '#e6d8bd' },
      { name: 'Wine', hex: '#7b2c43' },
    ],
    flowers: ['Hybrid tea rose', 'Gardenia', 'Lily of the valley', 'Orchid', 'Peony'],
    art: { palette: 'porcelain', variant: 'mixed', seed: 'le-grand-bouquet' },
    sizes: {
      classic: { price: 190, stems: '24–28 premium stems', inv: 3 },
      deluxe: { price: 285, stems: '30–38 premium stems', inv: 2 },
      grand: { price: 350, stems: '40–50 premium stems · installation', inv: 1 },
    },
    compareAt: 215,
    dims: { w: 18, h: 24 },
    vase: true,
    flags: { featured: true },
    created: '2026-05-14T09:00:00.000Z',
  }),
];

/* ------------------------------------------------------------------ selectors */

export const productsById = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>;
export const productsBySlug = Object.fromEntries(products.map((p) => [p.slug, p])) as Record<string, Product>;
export const activeProducts = products.filter((p) => p.status === 'active');
export const featuredProducts = activeProducts.filter((p) => p.featured);
export const bestsellerProducts = activeProducts.filter((p) => p.bestseller);
export const newArrivalProducts = activeProducts.filter((p) => p.newArrival);

export function productsInCollection(collectionId: CollectionId): Product[] {
  return activeProducts.filter((p) => p.collection === collectionId);
}

/**
 * Related arrangements: same collection first, then same price band across the
 * catalog — deterministic, so server and client always agree.
 */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCollection = productsInCollection(product.collection).filter((p) => p.id !== product.id);
  const others = activeProducts
    .filter((p) => p.id !== product.id && p.collection !== product.collection)
    .sort((a, b) => Math.abs(a.priceCents - product.priceCents) - Math.abs(b.priceCents - product.priceCents));
  return [...sameCollection, ...others].slice(0, limit);
}

/** Inventory helper used by the cart and checkout: true when any size is orderable. */
export function isPurchasable(product: Product): boolean {
  return product.status === 'active' && product.variants.some((v) => v.inStock && v.inventory > 0);
}
