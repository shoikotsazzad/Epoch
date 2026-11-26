// Shared garden layout maths (renderer + React overlay use the same numbers).

import type { PlantKind } from "@/core/types";

/** Plant drawing scale (local unit -> px) and its raked ring-zone radius, as fractions of min(w, h). */
const SIZE: Record<PlantKind, { scale: number; ring: number }> = {
  bonsai: { scale: 0.25, ring: 0.2 },
  rain: { scale: 0.12, ring: 0.165 },
  stones: { scale: 0.115, ring: 0.16 },
  sunflower: { scale: 0.095, ring: 0.135 },
};

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
