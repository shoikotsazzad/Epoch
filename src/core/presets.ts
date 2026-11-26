// Mood presets: scale + tempo + palette variant + a starter layout.

import type { GardenState, Plant, PlantKind, PlantParamsMap, PresetId, ScaleId } from "./types";
import { DEFAULT_LOOP_SECONDS, clampParams, defaultParams } from "./params";

export type PaletteVariant = "night" | "dawn" | "rain" | "floating" | "deep";

export interface Preset {
  id: PresetId;
  name: string;
  description: string;
  scale: ScaleId;
  root: number; // MIDI tonic
  bpm: number;
  /** Deep Sleep slowly glides the tempo down to this. */
  bpmEnd?: number;
  palette: PaletteVariant;
  reverb: number;
  drone: number;
  /** Level of the sound-effect layer (wind, droplets, stone clicks). */
  effects: number;
  layout: { kind: PlantKind; x: number; y: number; params?: Partial<PlantParamsMap[PlantKind]> }[];
}

export const PRESETS: Record<PresetId, Preset> = {
  night: {
    id: "night",
    name: "Night",
    description: "Moonlit stones, a slow bonsai melody",
    scale: "majorPentatonic",
    root: 50, // D3
    bpm: 56,
    palette: "night",
    reverb: 0.45,
    drone: 0.5,
    effects: 0.55,
    layout: [{ kind: "bonsai", x: 0.5, y: 0.52 }],
  },
  dawn: {
    id: "dawn",
    name: "Dawn",
    description: "Brighter, a little quicker, first light",
    scale: "majorPentatonic",
    root: 52, // E3
    bpm: 62,
    palette: "dawn",
    reverb: 0.38,
    drone: 0.4,
    effects: 0.5,
    layout: [
      { kind: "bonsai", x: 0.42, y: 0.5 },
      { kind: "sunflower", x: 0.68, y: 0.4 },
    ],
  },
  rainGarden: {
    id: "rainGarden",
    name: "Rain Garden",
    description: "Soft rain over a quiet canon",
    scale: "dorian",
    root: 50,
    bpm: 54,
    palette: "rain",
    reverb: 0.5,
    drone: 0.45,
    effects: 0.7,
    layout: [
      { kind: "rain", x: 0.32, y: 0.38 },
      { kind: "stones", x: 0.62, y: 0.6 },
    ],
  },
  floating: {
    id: "floating",
    name: "Floating",
    description: "Lydian, weightless and open",
    scale: "lydian",
    root: 53, // F3
    bpm: 52,
    palette: "floating",
    reverb: 0.55,
    drone: 0.42,
    effects: 0.45,
    layout: [
      { kind: "stones", x: 0.5, y: 0.55 },
      { kind: "sunflower", x: 0.74, y: 0.36, params: { density: 0.25 } },
    ],
  },
  deepSleep: {
    id: "deepSleep",
    name: "Deep Sleep",
    description: "Minor pentatonic, low and slowing down",
    scale: "minorPentatonic",
    root: 45, // A2 (bass-safe quantizer keeps it clean)
    bpm: 48,
    bpmEnd: 40,
    palette: "deep",
    reverb: 0.55,
    drone: 0.6,
    effects: 0.4,
    layout: [
      { kind: "stones", x: 0.5, y: 0.56, params: { levels: 2, canonDelay: 4 } },
      { kind: "rain", x: 0.3, y: 0.42, params: { levels: 3, removed: 0.45 } },
    ],
  },
};

export const PRESET_ORDER: PresetId[] = ["dawn", "rainGarden", "night", "floating", "deepSleep"];
export const DEFAULT_PRESET: PresetId = "night";

let idCounter = 0;
/** Short, URL-friendly plant id. Pass a rand for deterministic ids. */
export function newPlantId(rand?: () => number): string {
  const r = rand ? rand() : Math.random();
  idCounter = (idCounter + 1) % 1296;
  return (Math.floor(r * 1679616).toString(36) + idCounter.toString(36)).slice(0, 6);
}

export function makePlant<K extends PlantKind>(
  kind: K,
  x: number,
  y: number,
  params?: Partial<PlantParamsMap[K]>,
  id?: string,
): Plant<K> {
  return {
    id: id ?? newPlantId(),
    kind,
    x,
    y,
    params: clampParams(kind, { ...defaultParams(kind), ...(params ?? {}) }),
    volume: 0.8,
    loopSeconds: DEFAULT_LOOP_SECONDS[kind],
    muted: false,
  };
}

export function gardenFromPreset(presetId: PresetId, seed: number): GardenState {
  const p = PRESETS[presetId];
  return {
    v: 1,
    seed,
    preset: p.id,
    scale: p.scale,
    root: p.root,
    bpm: p.bpm,
    reverb: p.reverb,
    drone: p.drone,
    effects: p.effects,
    plants: p.layout.map((l, i) => makePlant(l.kind, l.x, l.y, l.params, `${l.kind[0]}${i}`)),
  };
}
