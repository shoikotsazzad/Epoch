// Design tokens for canvas code. These MUST match the @theme block in
// src/app/globals.css (a unit test enforces it), so canvas and UI share one palette.
// See design/DESIGN.md for what each token is for.

export const color = {
  // Night ground: deep slate-teal, never #000
  ink950: "#0b1012", // page / garden background
  ink900: "#10171a", // panel base (used at ~70% alpha)
  ink800: "#172125", // raised surfaces, slider track
  slate700: "#22313a", // hairlines, inactive strokes
  slate600: "#2d4148", // sand furrow shadow
  teal500: "#3e5d62", // mid teal: removed / faint geometry
  sea400: "#6e9396", // sea glass: secondary strokes, inactive icons
  sea300: "#9ebdbb", // light sea glass: sand line highlight, focus ring
  pond700: "#163a42", // deep teal pools (sunflower bed, X-ray dim tint)
  moss500: "#7c8b5e", // muted moss: bonsai foliage dots
  paper100: "#e7e0d1", // moonlit rice paper: primary text + ink strokes (never pure white)
  paper300: "#bdb5a5", // secondary text
  paper500: "#8e877a", // muted text / captions (still >= 4.5:1 on ink950)
  lantern400: "#e8aa62", // THE warm accent: "the note playing now"
  lantern200: "#f5d6a8", // glow core of the accent
} as const;

export type ColorToken = keyof typeof color;

/** Mapping from token name to the CSS custom property Tailwind generates for it. */
export const cssVarName = (t: ColorToken) =>
  `--color-${t.replace(/([a-z])([0-9])/g, "$1-$2").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;

export const motion = {
  uiMs: 600, // panel transitions (400–800 ms)
  uiEase: [0.45, 0, 0.55, 1] as const, // ease-in-out (cubic-bezier)
  rampSec: 1.5, // parameter ramps
  glowInMs: 300,
  glowOutMs: 1500,
  idleFadeMs: 6000, // UI fades to idleOpacity after this
  idleOpacity: 0.2,
  plantFadeInSec: 4,
  plantFadeOutSec: 3,
  maxFlashesPerSec: 3,
} as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

/** Spacing scale in px (4-based). */
export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

/** Canvas stroke recipes per plant (alphas are applied on top of the token colours). */
export const plantStyle = {
  bonsai: { ink: color.paper100, foliage: color.moss500, glow: color.lantern400 },
  rain: { bar: color.sea300, removed: color.teal500, drop: color.paper100, glow: color.lantern400 },
  stones: { stone: color.paper300, line: color.sea400, glow: color.lantern400 },
  sunflower: { seed: color.paper300, bed: color.pond700, glow: color.lantern400 },
} as const;

/** Hex "#rrggbb" + alpha 0..1 -> rgba() string for canvas. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** WCAG relative luminance + contrast ratio (used by tests to guard the palette). */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Preset palette variants: small shifts of ground, accent and sand strength (DESIGN.md §2). */
export const paletteVariants = {
  night: { ground: color.ink950, accent: color.lantern400, sand: 1 },
  dawn: { ground: "#0f1719", accent: "#ecb878", sand: 1.12 },
  rain: { ground: "#0b1315", accent: "#dcae7a", sand: 1 },
  floating: { ground: "#0d1416", accent: color.lantern400, sand: 0.8 },
  deep: { ground: "#090d0f", accent: "#cf9a5c", sand: 0.85 },
} as const;

export type PaletteName = keyof typeof paletteVariants;
