import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * FloralArt — the template's built-in art system.
 *
 * Every bouquet is drawn deterministically from a seed string (usually the
 * product slug), so the same arrangement always renders identically. When real
 * photography is supplied (Business PRO / a resale buyer swapping in their own
 * catalog) the `MediaFrame` component in this folder displays photographs
 * instead — the art remains the graceful placeholder.
 */

import type { FloralVariant } from '../../types/floral';

export type { FloralVariant };

type Arrangement = {
  petals: number;
  rings: number;
  petalLength: number;
  petalWidth: number;
  jitter: number;
  leaves: number;
  stems: number;
  spread: number;
  fill: boolean;
  budCount: number;
};

const ARRANGEMENTS: Record<FloralVariant, Arrangement> = {
  rose: { petals: 5, rings: 4, petalLength: 1.45, petalWidth: 1.05, jitter: 0.1, leaves: 6, stems: 7, spread: 0.95, fill: true, budCount: 5 },
  peony: { petals: 7, rings: 5, petalLength: 1.7, petalWidth: 1.35, jitter: 0.14, leaves: 5, stems: 6, spread: 1.0, fill: true, budCount: 4 },
  garden: { petals: 8, rings: 2, petalLength: 0.55, petalWidth: 0.22, jitter: 0.2, leaves: 8, stems: 9, spread: 1.1, fill: true, budCount: 9 },
  tulip: { petals: 3, rings: 1, petalLength: 1.25, petalWidth: 0.62, jitter: 0.02, leaves: 4, stems: 9, spread: 0.8, fill: true, budCount: 9 },
  sunflower: { petals: 16, rings: 1, petalLength: 1.15, petalWidth: 0.26, jitter: 0.06, leaves: 4, stems: 5, spread: 1.0, fill: true, budCount: 5 },
  dahlia: { petals: 12, rings: 4, petalLength: 1.05, petalWidth: 0.3, jitter: 0.05, leaves: 5, stems: 5, spread: 1.0, fill: true, budCount: 5 },
  ranunculus: { petals: 6, rings: 5, petalLength: 0.78, petalWidth: 0.62, jitter: 0.06, leaves: 3, stems: 8, spread: 0.9, fill: true, budCount: 7 },
  lily: { petals: 6, rings: 1, petalLength: 1.8, petalWidth: 0.55, jitter: 0.05, leaves: 6, stems: 5, spread: 1.05, fill: false, budCount: 5 },
  hydrangea: { petals: 4, rings: 1, petalLength: 0.7, petalWidth: 0.7, jitter: 0.1, leaves: 3, stems: 4, spread: 1.05, fill: true, budCount: 26 },
  orchid: { petals: 5, rings: 2, petalLength: 1.35, petalWidth: 0.5, jitter: 0.05, leaves: 2, stems: 4, spread: 1.0, fill: true, budCount: 8 },
  mixed: { petals: 7, rings: 3, petalLength: 1.1, petalWidth: 0.8, jitter: 0.1, leaves: 7, stems: 9, spread: 1.15, fill: true, budCount: 12 },
};

export type Palette = {
  bg: string;
  bgDeep: string;
  bloom: string[];
  core: string;
  leaf: string;
  stem: string;
  vessel: string;
};

export const PALETTES: Record<string, Palette> = {
  burgundy: { bg: '#f3e7e3', bgDeep: '#e8d3cf', bloom: ['#7b2c43', '#9c3c56', '#5d2033', '#c27683'], core: '#3e1423', leaf: '#7f8d6f', stem: '#5f6d51', vessel: '#e7dcc9' },
  blush: { bg: '#f8ecee', bgDeep: '#f0dade', bloom: ['#e3b0b7', '#d5929c', '#f2cdd0', '#c87c88'], core: '#b0656f', leaf: '#8a9a78', stem: '#6b7a5b', vessel: '#efe3d3' },
  ivory: { bg: '#f6f1e7', bgDeep: '#ece3d2', bloom: ['#fbf7ef', '#efe4cf', '#f6e9d8', '#e6d7bd'], core: '#c6a66b', leaf: '#9aa382', stem: '#76805f', vessel: '#e3d6c0' },
  sunlit: { bg: '#f7eddc', bgDeep: '#f0dfc4', bloom: ['#e7b45d', '#d99a3e', '#f3d9a4', '#c9823a'], core: '#8a5a22', leaf: '#8f9a66', stem: '#6f7a4f', vessel: '#e8d9bf' },
  lavender: { bg: '#eeebf1', bgDeep: '#e0dcea', bloom: ['#b5a7c9', '#9d8dbb', '#d4cadf', '#816f9f'], core: '#5e4d78', leaf: '#8f9a86', stem: '#6d7767', vessel: '#e7dfea' },
  garden: { bg: '#eef0e6', bgDeep: '#dfe3d1', bloom: ['#e9dcc6', '#c6858f', '#e8c7a3', '#a8b58a', '#d9a9b0'], core: '#8b6b4a', leaf: '#7c8b63', stem: '#5d6b47', vessel: '#e4dccb' },
  porcelain: { bg: '#f4f1ec', bgDeep: '#e8e3da', bloom: ['#ffffff', '#f4f1ec', '#efe9df', '#ddd5c8'], core: '#c6a66b', leaf: '#9fa890', stem: '#7a836c', vessel: '#ece6db' },
  noir: { bg: '#2a2226', bgDeep: '#1f181c', bloom: ['#8e3550', '#b04f69', '#6b2238', '#d08a98'], core: '#f0dcdd', leaf: '#5f6b56', stem: '#4c5545', vessel: '#3a2f33' },
  autumn: { bg: '#f3e9df', bgDeep: '#e9d8c6', bloom: ['#b4572f', '#d08a4c', '#8f3e2a', '#e0b07a'], core: '#6e2f1d', leaf: '#8a7a4c', stem: '#6b5f3c', vessel: '#e2d3bd' },
};

/* ------------------------------------------------------------------ seeded random */

function hashString(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/* ------------------------------------------------------------------ geometry */

type Head = { x: number; y: number; r: number; angle: number; colorIdx: number; depth: number };

function petalPath(len: number, wid: number): { path: string; midX: number; midY: number } {
  const d = `M0,0 C${wid * 0.55},${-len * 0.18} ${wid * 0.95},${-len * 0.52} ${wid * 0.42},${-len * 0.9} C${wid * 0.16},${-len * 1.03} ${-wid * 0.16},${-len * 1.03} ${-wid * 0.42},${-len * 0.9} C${-wid * 0.95},${-len * 0.52} ${-wid * 0.55},${-len * 0.18} 0,0 Z`;
  return { path: d, midX: 0, midY: -len * 0.58 };
}

function buildScene(variant: FloralVariant, seed: string) {
  const arr = ARRANGEMENTS[variant];
  const rand = rng(hashString(seed));
  const heads: Head[] = [];
  const W = 400;
  const H = 500;
  const cx = W / 2;
  const bouquetBaseY = H * 0.62;
  const headZone = variant === 'orchid' ? { yMin: H * 0.1, yMax: H * 0.52 } : { yMin: H * 0.1, yMax: H * 0.5 };

  if (variant === 'orchid') {
    // Spray of orchids climbing a curved stem
    for (let i = 0; i < arr.budCount; i++) {
      const t = i / (arr.budCount - 1);
      heads.push({
        x: cx + Math.sin(t * Math.PI * 1.15 + 0.3) * 92 - 10,
        y: H * 0.48 - t * H * 0.4,
        r: 30 - t * 6,
        angle: (rand() - 0.5) * 40 + 15,
        colorIdx: i % 2,
        depth: i,
      });
    }
  } else {
    const clusters = variant === 'hydrangea' ? 3 : variant === 'garden' || variant === 'mixed' ? 6 : 4;
    for (let c = 0; c < clusters; c++) {
      const a = (c / clusters) * Math.PI * 2 + rand() * 0.6;
      const spreadR = (variant === 'garden' || variant === 'mixed' ? 74 : 62) * arr.spread;
      const bx = cx + Math.cos(a) * spreadR * (0.75 + rand() * 0.35);
      const by = (headZone.yMin + headZone.yMax) / 2 + Math.sin(a) * 46 + (rand() - 0.5) * 22;
      const perCluster = Math.max(1, Math.ceil(arr.budCount / clusters));
      for (let k = 0; k < perCluster; k++) {
        const rr = variant === 'hydrangea' ? 34 : 30 + rand() * 10;
        const rad = variant === 'hydrangea' ? 52 : 22;
        const bxk = variant === 'hydrangea' ? cx + Math.cos(c) * 40 + Math.cos(((c * perCluster + k) / arr.budCount) * Math.PI * 2) * rad : bx + (rand() - 0.5) * 26;
        const byk = variant === 'hydrangea' ? (headZone.yMin + headZone.yMax) / 2 + 10 + Math.sin(((c * perCluster + k) / arr.budCount) * Math.PI * 2) * rad * 0.8 : by + (rand() - 0.5) * 26;
        heads.push({ x: bxk, y: byk, r: rr, angle: rand() * 360, colorIdx: (c + k) % 4, depth: 1 });
      }
    }
  }

  heads.sort((a, b) => b.depth - a.depth);

  const stems = Array.from({ length: arr.stems }, (_, i) => {
    const target = heads[i % heads.length];
    return {
      fromX: cx + (i / Math.max(1, arr.stems - 1) - 0.5) * 26,
      fromY: bouquetBaseY + 46,
      toX: target.x + (rand() - 0.5) * 10,
      toY: target.y + target.r * 0.55,
      bend: (rand() - 0.5) * 70,
    };
  });

  const leaves = Array.from({ length: arr.leaves + 3 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    return {
      x: cx + side * (40 + rand() * 86),
      y: H * 0.36 + rand() * H * 0.2,
      angle: side * (28 + rand() * 46),
      scale: 0.7 + rand() * 0.6,
      tone: i % 3,
    };
  });

  return { heads, stems, leaves, baseY: bouquetBaseY, cx };
}

type LeafProps = { x: number; y: number; angle: number; scale: number; tone: number; leaf: string; leafDark: string };

export function LeafSvg({ leaf, leafDark, x, y, angle, scale, tone }: LeafProps & { className?: string }) {
  const f = tone === 0 ? leaf : tone === 1 ? leafDark : '#a7b294';
  return (
    <path
      d="M0,0 C14,-14 30,-30 34,-52 C20,-44 4,-26 0,0 Z"
      fill={f}
      opacity={0.82}
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
    />
  );
}

/* ------------------------------------------------------------------ organic washes */

function blob(cx: number, cy: number, r: number, rand: () => number) {
  const pts = 7;
  let d = '';
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rr = r * (0.7 + rand() * 0.55);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.55;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return `${d}Z`;
}

/* ------------------------------------------------------------------ main component */

export function FloralArt({
  variant,
  palette = 'blush',
  seed,
  className,
  petalSlots,
}: {
  variant: FloralVariant;
  palette?: keyof typeof PALETTES | string;
  seed: string;
  className?: string;
  /** When present, petals render as "<petalSlots /> at a coordinate". */
  petalSlots?: (props: { cx: number; cy: number; index: number; color: string; size: number }) => ReactNode;
}) {
  const uid = useId().replace(/:/g, '');
  const pal = PALETTES[palette] ?? PALETTES.blush;
  const arr = ARRANGEMENTS[variant];
  const scene = buildScene(variant, seed);
  const rand = rng(hashString(`${seed}-bg`));
  const petal = petalPath(arr.petalLength, arr.petalWidth);
  const W = 400;
  const H = 500;
  const wash1 = blob(120, 160, 150, rand);
  const wash2 = blob(300, 330, 170, rand);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn('h-full w-full', className)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={pal.bg} />
          <stop offset="100%" stopColor={pal.bgDeep} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="34%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#3f1623" floodOpacity="0.18" />
        </filter>
        <linearGradient id={`${uid}-vase`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.vessel} />
          <stop offset="100%" stopColor={pal.bgDeep} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${uid}-bg)`} />
      <path d={wash1} fill={pal.bloom[2]} opacity={0.08} />
      <path d={wash2} fill={pal.core} opacity={0.06} />
      <rect width={W} height={H} fill={`url(#${uid}-glow)`} />

      {/* soft surface shadow beneath the vessel */}
      <ellipse cx={W / 2} cy={H * 0.88} rx={W * 0.36} ry={22} fill={pal.core} opacity={0.1} />

      {/* stems — drawn behind everything */}
      <g stroke={pal.stem} strokeWidth="2.2" strokeLinecap="round" opacity="0.75" fill="none">
        {scene.stems.map((s, i) => (
          <path key={i} d={`M${s.fromX},${H * 0.9} C${s.fromX},${s.fromY + 30} ${s.toX + s.bend},${s.toY + 60} ${s.toX},${s.toY}`} />
        ))}
      </g>

      {/* leaves */}
      <g>
        {scene.leaves.map((l, i) => (
          <LeafSvg key={i} {...l} leaf={pal.leaf} leafDark={pal.stem} />
        ))}
      </g>

      {/* blooms */}
      <g filter={`url(#${uid}-sh)`}>
        {scene.heads.map((h, i) => {
          const color = pal.bloom[h.colorIdx % pal.bloom.length];
          const flowerRadius = h.r;
          const petalNodes: ReactNode[] = [];
          if (petalSlots) {
            petalNodes.push(petalSlots({ cx: h.x, cy: h.y, index: i, color, size: flowerRadius }));
          } else {
            const rings = variant === 'hydrangea' ? 1 : arr.rings;
            for (let ring = 0; ring < rings; ring++) {
              const scaleFactor = 1 - ring / (rings + 0.6);
              const petalCount = variant === 'hydrangea' ? 4 : arr.petals + (ring > 0 ? 1 : 0);
              const offset = ring * 18 + h.angle;
              for (let p = 0; p < petalCount; p++) {
                const ang = offset + (p / petalCount) * 360;
                const shade = pal.bloom[(h.colorIdx + ring) % pal.bloom.length];
                petalNodes.push(
                  <path
                    key={`p${ring}-${p}`}
                    d={petal.path}
                    fill={arr.fill ? shade : 'none'}
                    stroke={arr.fill ? 'none' : shade}
                    strokeWidth={arr.fill ? 0 : 3}
                    opacity={0.92 - ring * 0.08}
                    transform={`translate(${h.x} ${h.y}) rotate(${ang}) scale(${((flowerRadius * 1.15) / 60) * scaleFactor})`}
                  />,
                );
              }
            }
            // centre
            petalNodes.push(
              <circle
                key="core"
                cx={h.x}
                cy={h.y}
                r={(flowerRadius * 0.22) / Math.sqrt(rings || 1)}
                fill={variant === 'sunflower' ? pal.core : pal.core}
                opacity={0.85}
              />,
            );
          }
          return <g key={i}>{petalNodes}</g>;
        })}
      </g>

      {/* vessel */}
      <g>
        <path
          d={
            variant === 'orchid'
              ? `M${W / 2 - 34},${H * 0.74} L${W / 2 + 34},${H * 0.74} L${W / 2 + 22},${H * 0.9} L${W / 2 - 22},${H * 0.9} Z`
              : `M${W / 2 - 50},${H * 0.7} C${W / 2 - 58},${H * 0.8} ${W / 2 - 44},${H * 0.9} ${W / 2},${H * 0.9} C${W / 2 + 44},${H * 0.9} ${W / 2 + 58},${H * 0.8} ${W / 2 + 50},${H * 0.7} Z`
          }
          fill={`url(#${uid}-vase)`}
          stroke="#c6a66b"
          strokeWidth="0.75"
          strokeOpacity="0.6"
        />
        <ellipse cx={W / 2} cy={H * 0.7} rx={50} ry={8} fill={pal.core} opacity={0.12} />
      </g>

      {/* signature gold hairline accent */}
      <path
        d={`M${W / 2 - 130},${H * 0.965} L${W / 2 + 130},${H * 0.965}`}
        stroke="#c6a66b"
        strokeWidth="0.8"
        strokeOpacity="0.55"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small medallion bloom used in the logo, avatars and decorative spots. */
export function BloomGlyph({ className, color = '#581F32', accent = '#C6A66B' }: { className?: string; color?: string; accent?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <path id={`${uid}-petal`} d="M32,32 C26,22 26,10 32,7 C38,10 38,22 32,32 Z" />
      </defs>
      <g fill={color} opacity="0.92">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <use key={a} href={`#${uid}-petal`} transform={`rotate(${a} 32 32)`} />
        ))}
      </g>
      <circle cx="32" cy="32" r="4.2" fill={accent} />
    </svg>
  );
}