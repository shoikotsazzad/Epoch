// Pure garden helpers: placement, summaries, spatial mix, idle evolution, demo layout.

import type { GardenState, GrowResult, Plant, PlantKind } from "./types";
import { PARAM_SPECS, PLANT_LABELS, clamp, clampParams } from "./params";
import { gardenFromPreset, makePlant, newPlantId } from "./presets";

export const MAX_GARDEN_PLANTS = 8;

export interface Bounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Default bounds (normalised) when the screen size is unknown (tests, server). */
export const PLANT_BOUNDS: Bounds = { x0: 0.12, x1: 0.88, y0: 0.3, y1: 0.66 };

export function clampToBounds(x: number, y: number, b: Bounds = PLANT_BOUNDS): { x: number; y: number } {
  return { x: clamp(x, b.x0, b.x1), y: clamp(y, b.y0, b.y1) };
}

/** Circle sizes (in garden-height units) so spacing is measured edge to edge, not centre to centre. */
export interface Radii {
  self: number;
  of: (p: Plant) => number;
}

/** Pick the candidate spot with the most open space around it (aspect = width / height of the garden). */
export function findFreeSpot(
  plants: Plant[],
  rand: () => number,
  aspect = 1.6,
  bounds: Bounds = PLANT_BOUNDS,
  radii: Radii = { self: 0, of: () => 0 },
): { x: number; y: number } {
  const { x0, x1, y0, y1 } = bounds;
  let best = { x: 0.5, y: 0.5 };
  let bestScore = -Infinity;
  for (let i = 0; i < 96; i++) {
    const c = { x: x0 + (x1 - x0) * rand(), y: y0 + (y1 - y0) * rand() };
    let minD = Infinity;
    for (const p of plants) minD = Math.min(minD, Math.hypot((c.x - p.x) * aspect, c.y - p.y) - radii.self - radii.of(p));
    // prefer open space, gently prefer the centre when the garden is empty
    const score = (plants.length ? minD : 1) - Math.hypot(c.x - 0.5, c.y - 0.5) * 0.15;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return { x: Math.round(best.x * 1000) / 1000, y: Math.round(best.y * 1000) / 1000 };
}

/** x -> stereo pan, -0.7 (left) .. +0.7 (right). */
export const panFor = (x: number) => clamp((x - 0.5) * 1.4, -0.7, 0.7);

/** Distance from the centre -> extra reverb send (further away sounds further away). */
export const reverbSendFor = (x: number, y: number) => 0.06 + 0.32 * clamp(Math.hypot(x - 0.5, y - 0.5) / 0.6, 0, 1);

export function plantShortDesc(p: Plant): string {
  const params = p.params as unknown as Record<string, number>;
  switch (p.kind) {
    case "bonsai":
      return `bonsai depth ${params.depth}`;
    case "rain":
      return `rain level ${params.levels}`;
    case "stones":
      return `stones level ${params.levels}`;
    case "sunflower":
      return `sunflower fib(${params.n})`;
  }
}

export function gardenSummary(state: GardenState): string {
  const n = state.plants.length;
  if (n === 0) return "An empty garden of raked sand. Plant a seed to begin.";
  const parts = state.plants.map((p) => plantShortDesc(p) + (p.muted ? " (muted)" : ""));
  return `Garden with ${n} plant${n === 1 ? "" : "s"}: ${parts.join(", ")}`;
}

export function totalCalls(grows: Iterable<GrowResult>): number {
  let n = 0;
  for (const g of grows) n += g.trace.length;
  return n;
}

/** Soft ceilings for idle growth, so the evolving garden stays calm. */
const GROW_KEY: Record<PlantKind, { key: string; ceiling: number }> = {
  bonsai: { key: "depth", ceiling: 7 },
  rain: { key: "levels", ceiling: 5 },
  stones: { key: "levels", ceiling: 4 },
  sunflower: { key: "n", ceiling: 13 },
};

/**
 * One idle-evolution step (Eno's Bloom: the garden keeps changing when left alone).
 * Grows a level or re-seeds an existing plant. It never adds plants: the visitor plants their own.
 */
export function evolveGarden(state: GardenState, rand: () => number): { state: GardenState; message: string } | null {
  const plants = state.plants;
  if (!plants.length) return null;
  const i = Math.floor(rand() * plants.length);
  const p = plants[i];
  const g = GROW_KEY[p.kind];
  const params = p.params as unknown as Record<string, number>;
  let next: Plant;
  let message: string;
  if (params[g.key] < g.ceiling && rand() < 0.65) {
    const spec = PARAM_SPECS[p.kind].find((s) => s.key === g.key)!;
    next = { ...p, params: clampParams(p.kind, { ...params, [g.key]: params[g.key] + spec.step } as never) } as Plant;
    message = `${PLANT_LABELS[p.kind]} grew a level`;
  } else {
    next = { ...p, id: newPlantId(rand) };
    message = `${PLANT_LABELS[p.kind]} re-seeded itself`;
  }
  const out = plants.slice();
  out[i] = next;
  return { state: { ...state, plants: out }, message };
}

/** Fixed garden for the demo video (?demo=1). */
export function demoGarden(): GardenState {
  const g = gardenFromPreset("night", 4821);
  g.plants = [
    makePlant("bonsai", 0.5, 0.5, { depth: 6 }, "b0"),
    makePlant("rain", 0.25, 0.36, { levels: 4 }, "r0"),
    makePlant("stones", 0.74, 0.62, { levels: 3 }, "s0"),
    makePlant("sunflower", 0.78, 0.3, { n: 11 }, "f0"),
  ];
  return g;
}
