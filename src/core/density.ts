// Global mixing safety: keep the whole garden around 1–3 notes per second
// and never let one plant flash more than 3 times per second.
// Pure and deterministic (it only looks at audio times), so live playback and
// offline export make exactly the same choices.

import type { NoteEvent } from "./types";

/** 0 = essential (structure), 1 = normal, 2 = ornamental (dropped first when crowded). */
export type Priority = 0 | 1 | 2;

export function priorityOf(e: NoteEvent): Priority {
  switch (e.role) {
    case "drone":
    case "pop":
      return 0;
    case "canon":
      return e.voice === 0 && e.vel > 0.2 ? 0 : 1;
    case "push":
      return e.depth <= 2 ? 0 : 1;
    case "pulse":
    case "spark": // the sunflower's whole voice: keep it, just sparse
      return 1;
    default:
      return 2; // leaf bells, memo echoes
  }
}

export interface DensityOptions {
  window: number; // seconds
  softMax: number; // ornamental notes are refused at/above this many notes per window
  hardMax: number; // nothing passes at/above this
  minGapPerPlant: number; // seconds between two notes of one plant (<= 3 flashes/s)
}

export const DEFAULT_DENSITY: DensityOptions = { window: 2, softMax: 4, hardMax: 6, minGapPerPlant: 0.34 };

export class DensityLimiter {
  private times: number[] = [];
  private lastByPlant = new Map<string, number>();
  constructor(private opts: DensityOptions = DEFAULT_DENSITY) {}

  allow(plantId: string, time: number, priority: Priority, exempt = false): boolean {
    if (exempt) return true; // e.g. a sustained level-0 tone: not a "note" for density purposes
    const { window, softMax, hardMax, minGapPerPlant } = this.opts;
    while (this.times.length && this.times[0] <= time - window) this.times.shift();
    const n = this.times.length;
    if (n >= hardMax) return false;
    if (priority === 2 && n >= softMax) return false;
    if (priority === 1 && n >= softMax + 1) return false;
    const last = this.lastByPlant.get(plantId);
    if (last !== undefined && time - last < minGapPerPlant && time >= last) return false;
    this.lastByPlant.set(plantId, time);
    // keep sorted (callbacks can arrive very slightly out of order across parts)
    let i = this.times.length;
    while (i > 0 && this.times[i - 1] > time) i--;
    this.times.splice(i, 0, time);
    return true;
  }

  reset() {
    this.times = [];
    this.lastByPlant.clear();
  }
}
