// Sound effects that come FROM the recursion (pure: no Tone, no DOM).
//
//   Bonsai    wind      every call shapes it: a deeper push swells and brightens it, a pop lets it settle
//   Rain      droplets  every surviving Cantor segment is a drop; the removed thirds stay silent
//   Stones    clicks    a soft stone knock the moment each canon voice comes in
//   Sunflower none      (its bells are already the sparkle)
//
// The audio side (src/audio/voices.ts) only plays what these functions decide.

import type { NoteEvent, PlantKind } from "./types";

/** Default level of the effects layer (0..1) when a mood doesn't set one. */
export const DEFAULT_EFFECTS = 0.55;

/** Drops closer together than this are merged, so rain never clatters. */
export const MIN_DROP_GAP_SEC = 0.09;

/** Which events also trigger the plant's sound effect (same order as `events`). */
export function markEffects(kind: PlantKind, events: readonly NoteEvent[]): boolean[] {
  switch (kind) {
    case "bonsai":
      return events.map((e) => e.role === "push" || e.role === "leaf" || e.role === "pop");
    case "rain":
      return events.map((e) => e.role === "pulse");
    case "stones": {
      // the first note of each canon voice (0 root, 1 fifth, 2 octave) in the loop
      const first = new Map<number, number>();
      events.forEach((e, i) => {
        const v = e.voice ?? 0;
        const j = first.get(v);
        if (j === undefined || e.time < events[j].time) first.set(v, i);
      });
      const hits = new Set(first.values());
      return events.map((_, i) => hits.has(i));
    }
    case "sunflower":
      return events.map(() => false);
  }
}

/** Resting wind level (linear gain) for the bonsai's Wind slider (0..1). */
export function windLevel(wind: number): number {
  const w = Math.min(1, Math.max(0, wind));
  return 0.04 + w * 0.11;
}

/**
 * Where the wind goes after a bonsai call: a push `depth` levels down swells it and
 * opens its band a little (tension); a pop returns it to rest (release).
 */
export function windTarget(role: NoteEvent["role"], depth: number, wind: number): { level: number; freq: number; ramp: number } {
  const base = windLevel(wind);
  if (role === "pop") return { level: base, freq: 420, ramp: 2.5 };
  const d = Math.min(6, Math.max(0, depth));
  return { level: base * (1 + 0.12 * d), freq: 420 + d * 70, ramp: 0.8 };
}

/** Pitch of a rain drop (Hz): deeper Cantor levels are smaller, higher drops; frameId adds seeded variety. */
export function dropletFreq(frameId: number, depth: number): number {
  const h = ((frameId * 2654435761) >>> 0) % 6;
  return Math.min(2000, 900 + Math.max(0, depth) * 90 + h * 70);
}

/** Pitch of a stone click (Hz): the voice's note an octave up, kept in a woody range. */
export function clickFreq(noteFreq: number): number {
  let f = noteFreq * 2;
  while (f > 900) f /= 2;
  while (f < 350) f *= 2;
  return f;
}
