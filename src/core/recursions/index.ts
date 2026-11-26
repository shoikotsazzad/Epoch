import type { Grow, GrowResult, Plant, PlantKind, PlantParamsMap } from "../types";
import { deriveSeed, mulberry32 } from "../rng";
import { growBonsai } from "./tree";
import { growRain } from "./cantor";
import { growStones } from "./sierpinski";
import { growSunflower } from "./fibonacci";

export { growBonsai, growRain, growStones, growSunflower };

export const GROW: { [K in PlantKind]: Grow<PlantParamsMap[K]> } = {
  bonsai: growBonsai,
  rain: growRain,
  stones: growStones,
  sunflower: growSunflower,
};

/**
 * Grow one plant deterministically: the garden seed + the plant id give it its own
 * random stream, so adding or removing other plants never changes this one.
 */
export function growPlant(plant: Plant, gardenSeed: number, scaleLength: number): GrowResult {
  const rand = mulberry32(deriveSeed(gardenSeed, `${plant.kind}:${plant.id}`));
  const grow = GROW[plant.kind] as Grow<PlantParamsMap[PlantKind]>;
  return grow(plant.params, rand, { scaleLength });
}
