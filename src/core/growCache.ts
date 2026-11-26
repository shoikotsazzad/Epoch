// Memoizes grown plants so audio, visuals, X-ray and export share one result per plant.

import type { GardenState, GrowResult, Plant } from "./types";
import { growPlant } from "./recursions";
import { SCALES } from "./scales";

export interface GrowEntry {
  key: string;
  result: GrowResult;
}

export function growKey(plant: Plant, seed: number, scaleLength: number): string {
  return `${plant.kind}|${plant.id}|${seed}|${scaleLength}|${JSON.stringify(plant.params)}`;
}

export class GrowCache {
  private cache = new Map<string, GrowEntry>();

  get(plant: Plant, seed: number, scaleLength: number): GrowEntry {
    const key = growKey(plant, seed, scaleLength);
    let hit = this.cache.get(key);
    if (!hit) {
      hit = { key, result: growPlant(plant, seed, scaleLength) };
      this.cache.set(key, hit);
      if (this.cache.size > 200) this.cache.delete(this.cache.keys().next().value as string);
    }
    return hit;
  }

  growsFor(state: GardenState): Map<string, GrowEntry> {
    const len = SCALES[state.scale].length;
    const out = new Map<string, GrowEntry>();
    for (const p of state.plants) out.set(p.id, this.get(p, state.seed, len));
    return out;
  }
}
