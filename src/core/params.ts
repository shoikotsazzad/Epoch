// Parameter specs: the ONE place that defines safe ranges for every plant.
// Used for clamping (recursions, URL decode) and for building sliders (UI).

import type { AnyPlantParams, PlantKind, PlantParamsMap } from "./types";

export interface ParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** One of the plant's 3 main sliders (shown first in the plant panel). */
  main?: boolean;
  integer?: boolean;
  /** Short plain-language hint for the UI / screen readers. */
  hint: string;
}

export const PARAM_SPECS: { [K in PlantKind]: ParamSpec[] } = {
  bonsai: [
    { key: "depth", label: "Depth", min: 3, max: 8, step: 1, default: 6, main: true, integer: true, hint: "How many times the branch function calls itself" },
    { key: "spread", label: "Spread", min: 12, max: 45, step: 1, default: 26, main: true, hint: "Angle between sibling branches" },
    { key: "wind", label: "Wind", min: 0, max: 1, step: 0.01, default: 0.3, main: true, hint: "Gentle sway and lean" },
    { key: "branches", label: "Branches", min: 2, max: 3, step: 1, default: 2, integer: true, hint: "Recursive calls per branch" },
    { key: "decay", label: "Length decay", min: 0.6, max: 0.8, step: 0.01, default: 0.72, hint: "Each branch is this fraction of its parent" },
    { key: "prune", label: "Prune", min: 0, max: 0.5, step: 0.01, default: 0.12, hint: "Chance a branch is skipped" },
  ],
  rain: [
    { key: "levels", label: "Levels", min: 2, max: 6, step: 1, default: 4, main: true, integer: true, hint: "Recursion depth of the Cantor set" },
    { key: "removed", label: "Silence", min: 0.2, max: 0.5, step: 0.01, default: 0.33, main: true, hint: "Fraction of each segment left silent" },
    { key: "phraseBeats", label: "Phrase", min: 8, max: 32, step: 1, default: 16, main: true, integer: true, hint: "Length of the rain phrase in beats" },
  ],
  stones: [
    { key: "levels", label: "Levels", min: 1, max: 5, step: 1, default: 3, main: true, integer: true, hint: "Recursion depth of the Sierpinski triangle" },
    { key: "canonDelay", label: "Canon delay", min: 1, max: 8, step: 0.5, default: 3, main: true, hint: "Beats between the three voices" },
    { key: "voicing", label: "Voicing", min: 0, max: 2, step: 1, default: 0, main: true, integer: true, hint: "Root–fifth–octave, wide, or low" },
  ],
  sunflower: [
    { key: "n", label: "n", min: 5, max: 14, step: 1, default: 10, main: true, integer: true, hint: "Compute fib(n) recursively, with memo" },
    { key: "density", label: "Sparkle", min: 0.2, max: 0.5, step: 0.01, default: 0.35, main: true, hint: "Chance each finished call rings a bell" },
    { key: "seeds", label: "Seeds", min: 34, max: 377, step: 1, default: 144, main: true, integer: true, hint: "Seeds drawn on the golden-angle spiral" },
  ],
};

export const DEFAULT_LOOP_SECONDS: Record<PlantKind, number> = {
  bonsai: 29,
  rain: 17,
  stones: 23,
  sunflower: 37,
};

export const LOOP_SECONDS_RANGE = { min: 11, max: 61 };

export const PLANT_LABELS: Record<PlantKind, string> = {
  bonsai: "Bonsai",
  rain: "Rain",
  stones: "Stones",
  sunflower: "Sunflower",
};

export const PLANT_RECURSION: Record<PlantKind, string> = {
  bonsai: "Fractal tree",
  rain: "Cantor set",
  stones: "Sierpinski triangle",
  sunflower: "Fibonacci (memoized)",
};

export const PLANT_ROLE: Record<PlantKind, string> = {
  bonsai: "Melody",
  rain: "Rhythm",
  stones: "Harmony",
  sunflower: "Sparkle",
};

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function defaultParams<K extends PlantKind>(kind: K): PlantParamsMap[K] {
  const out: Record<string, number> = {};
  for (const s of PARAM_SPECS[kind]) out[s.key] = s.default;
  return out as unknown as PlantParamsMap[K];
}

/** Clamp (and fill missing / non-finite) params into their safe ranges. */
export function clampParams<K extends PlantKind>(kind: K, params: Partial<AnyPlantParams> | undefined): PlantParamsMap[K] {
  const src = (params ?? {}) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const s of PARAM_SPECS[kind]) {
    const raw = src[s.key];
    let v = typeof raw === "number" && Number.isFinite(raw) ? raw : s.default;
    v = clamp(v, s.min, s.max);
    // Snap to the slider step so share links and sliders agree exactly.
    v = s.integer ? Math.round(v) : Math.round((Math.round((v - s.min) / s.step) * s.step + s.min) * 1e4) / 1e4;
    v = clamp(v, s.min, s.max);
    out[s.key] = v;
  }
  return out as unknown as PlantParamsMap[K];
}
