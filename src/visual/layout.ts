// Shared garden layout maths (renderer + React overlay use the same numbers).

import type { Plant, PlantKind } from "@/core/types";
import type { Bounds } from "@/core/garden";

/** Plant drawing scale (local unit -> px) and its raked ring-zone radius, as fractions of min(w, h). */
const SIZE: Record<PlantKind, { scale: number; ring: number }> = {
  bonsai: { scale: 0.22, ring: 0.17 },
  rain: { scale: 0.11, ring: 0.145 },
  stones: { scale: 0.105, ring: 0.14 },
  sunflower: { scale: 0.095, ring: 0.125 },
};

/** Screen furniture the garden must stay clear of (px). */
export const TOP_BAR_PX = 92;
export const trayTopPx = (w: number, h: number) => h - (w < 640 ? 176 : 164); // caption line + seed tray
/** Preferred clearance between a plant's raked circle and the bars (px); shrinks on short screens. */
export const BAR_CLEARANCE_PX = 120;

/**
 * Where a plant's CENTRE may sit (normalised 0..1), so its raked circle stays
 * ~120 px clear of the top bar and the caption/tray, and clear of the side edges.
 */
export function plantBounds(kind: PlantKind, w: number, h: number): Bounds {
  const R = ringRadius(kind, w, h);
  const top = TOP_BAR_PX;
  const bottom = trayTopPx(w, h);
  const slack = bottom - top - 2 * R;
  const clear = Math.max(8, Math.min(BAR_CLEARANCE_PX, (slack - 60) / 2)); // keep a 60 px band for centres
  let y0 = (top + clear + R) / h;
  let y1 = (bottom - clear - R) / h;
  if (y0 > y1) y0 = y1 = (top + bottom) / 2 / h;
  const side = w < 640 ? 12 : 48;
  let x0 = (side + R) / w;
  let x1 = 1 - x0;
  if (x0 > x1) x0 = x1 = 0.5;
  return { x0, x1, y0, y1 };
}

const clamp01 = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** On-screen centre of a plant in px (stored positions are clamped into the bounds for display). */
export function displayPos(p: Pick<Plant, "kind" | "x" | "y">, w: number, h: number): { x: number; y: number } {
  const b = plantBounds(p.kind, w, h);
  return { x: clamp01(p.x, b.x0, b.x1) * w, y: clamp01(p.y, b.y0, b.y1) * h };
}

export function plantScale(kind: PlantKind, w: number, h: number): number {
  return Math.min(w, h) * SIZE[kind].scale;
}

export function ringRadius(kind: PlantKind, w: number, h: number): number {
  return Math.min(w, h) * SIZE[kind].ring;
}

/** Deterministic 0..1 hash (for stroke wobble, stone shapes). */
export function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Glow envelope: in over 0.3 s, out over 1.5 s. */
export function glowEnvelope(age: number): number {
  if (age < 0) return 0;
  if (age < 0.3) return age / 0.3;
  return Math.max(0, 1 - (age - 0.3) / 1.5);
}
