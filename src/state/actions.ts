// User intents -> store updates. The runtime reacts to store changes (audio + visuals).

import type { GardenState, Plant, PlantKind, PlantParamsMap, PresetId, ScaleId } from "@/core/types";
import { PLANT_LABELS, clamp, clampParams } from "@/core/params";
import { PRESETS, PRESET_ORDER, gardenFromPreset, makePlant } from "@/core/presets";
import { MAX_GARDEN_PLANTS, PLANT_BOUNDS, clampToBounds, findFreeSpot, type Bounds } from "@/core/garden";
import { plantBounds, ringRadius } from "@/visual/layout";
import { freshSeed } from "@/core/rng";
import { BPM_RANGE } from "@/core/urlState";
import { captionStore, gardenStore, patchUi, uiStore } from "./store";
import { getRuntime } from "@/runtime/runtime";

const setGarden = (fn: (g: GardenState) => GardenState) => gardenStore.set(fn);

/**
 * Close every open bar / panel (settings, help, export, mood, plant panel, shortcuts)
 * and leave X-ray. Used by: tapping empty sand, the home logo/title, and planting.
 */
export function closeAll(opts: { keepSelection?: boolean } = {}) {
  const ui = uiStore.get();
  if (ui.xray) getRuntime().exitXray();
  patchUi({ panel: null, ...(opts.keepSelection ? {} : { selectedId: null }) });
}

const aspect = () => (typeof window === "undefined" ? 1.6 : window.innerWidth / Math.max(1, window.innerHeight));

/** Bounds for a plant kind on the current screen (keeps it ~120 px clear of the bars). */
export const boundsFor = (kind: PlantKind): Bounds =>
  typeof window === "undefined" ? PLANT_BOUNDS : plantBounds(kind, window.innerWidth, window.innerHeight);

export function plantSeed(kind: PlantKind, at?: { x: number; y: number }): string | null {
  const g = gardenStore.get();
  if (g.plants.length >= MAX_GARDEN_PLANTS) {
    captionStore.set(`The garden is full (${MAX_GARDEN_PLANTS} plants). Remove one to plant another.`);
    return null;
  }
  const b = boundsFor(kind);
  const W = typeof window === "undefined" ? 1440 : window.innerWidth;
  const H = typeof window === "undefined" ? 900 : window.innerHeight;
  const radii = { self: ringRadius(kind, W, H) / H, of: (p: { kind: PlantKind }) => ringRadius(p.kind, W, H) / H };
  const spot = at ? clampToBounds(at.x, at.y, b) : findFreeSpot(g.plants, Math.random, aspect(), b, radii);
  const plant = makePlant(kind, spot.x, spot.y);
  closeAll(); // planting always starts from a clean screen: whatever bar was open hides
  setGarden((s) => ({ ...s, plants: [...s.plants, plant] }));
  patchUi({ selectedId: plant.id });
  captionStore.set(`${PLANT_LABELS[kind]} planted. It fades in over a few seconds.`);
  return plant.id;
}

export function removePlant(id: string) {
  const p = gardenStore.get().plants.find((x) => x.id === id);
  setGarden((s) => ({ ...s, plants: s.plants.filter((x) => x.id !== id) }));
  const ui = uiStore.get();
  patchUi({ selectedId: ui.selectedId === id ? null : ui.selectedId, panel: ui.panel === "plant" && ui.selectedId === id ? null : ui.panel });
  if (p) captionStore.set(`${PLANT_LABELS[p.kind]} removed. Its layer fades out.`);
}

export function updatePlant(id: string, patch: Partial<Omit<Plant, "id" | "kind">>) {
  setGarden((s) => ({ ...s, plants: s.plants.map((p) => (p.id === id ? ({ ...p, ...patch } as Plant) : p)) }));
}

export function updateParams<K extends PlantKind>(id: string, params: Partial<PlantParamsMap[K]>) {
  setGarden((s) => ({
    ...s,
    plants: s.plants.map((p) => (p.id === id ? ({ ...p, params: clampParams(p.kind, { ...p.params, ...params } as never) } as Plant) : p)),
  }));
}

export function toggleMute(id: string) {
  const p = gardenStore.get().plants.find((x) => x.id === id);
  if (!p) return;
  updatePlant(id, { muted: !p.muted });
  captionStore.set(`${PLANT_LABELS[p.kind]} ${p.muted ? "unmuted" : "muted"}`);
}

export function nudgePlant(id: string, dx: number, dy: number) {
  const p = gardenStore.get().plants.find((x) => x.id === id);
  if (!p) return;
  updatePlant(id, clampToBounds(p.x + dx, p.y + dy, boundsFor(p.kind)));
}

/** Change the mood: scale, tempo, palette, reverb, drone, effects. Keeps your plants (an empty garden gets the starter layout). */
export function applyPreset(id: PresetId) {
  const g = gardenStore.get();
  const p = PRESETS[id];
  if (g.plants.length === 0) {
    gardenStore.set(gardenFromPreset(id, g.seed));
  } else {
    gardenStore.set({ ...g, preset: id, scale: p.scale, root: p.root, bpm: p.bpm, reverb: p.reverb, drone: p.drone, effects: p.effects });
  }
  captionStore.set(`Mood: ${p.name}. ${p.description}.`);
}

/** Start fresh: exactly like the first visit. Night mood, a single new bonsai, a new seed. */
export function startFresh() {
  const g = gardenFromPreset("night", freshSeed());
  // a new id so the bonsai visibly grows again (and old plants fade out)
  g.plants = [makePlant("bonsai", 0.5, 0.5, undefined, `b${Math.floor(Math.random() * 1e6).toString(36)}`)];
  gardenStore.set(g);
  patchUi({ selectedId: null, panel: null, evolveMessage: null });
  captionStore.set("A fresh start: one bonsai and a new seed. Plant the rest yourself.");
}

export function newSeed() {
  const seed = freshSeed();
  setGarden((s) => ({ ...s, seed }));
  captionStore.set(`New seed ${seed}: every plant regrows with fresh randomness.`);
}

export function surpriseMe() {
  const seed = freshSeed();
  const preset = PRESET_ORDER[Math.floor(Math.random() * PRESET_ORDER.length)];
  const p = PRESETS[preset];
  setGarden((s) => ({ ...s, seed, preset, scale: p.scale, root: p.root, bpm: p.bpm, reverb: p.reverb, drone: p.drone, effects: p.effects }));
  captionStore.set(`Surprise: ${p.name} mood, seed ${seed}.`);
}

export function setGlobal(patch: Partial<Pick<GardenState, "scale" | "bpm" | "reverb" | "drone" | "effects" | "root">>) {
  setGarden((s) => ({
    ...s,
    ...patch,
    bpm: patch.bpm !== undefined ? clamp(patch.bpm, BPM_RANGE.min, BPM_RANGE.max) : s.bpm,
    scale: (patch.scale ?? s.scale) as ScaleId,
  }));
}

export function selectPlant(id: string | null, openPanel = false) {
  patchUi({ selectedId: id, panel: openPanel && id ? "plant" : uiStore.get().panel === "plant" && !id ? null : uiStore.get().panel });
}

/** Cycle selection through plants (Tab-free alternative used by [ and ]). */
export function cycleSelection(dir: 1 | -1) {
  const plants = gardenStore.get().plants;
  if (!plants.length) return;
  const i = plants.findIndex((p) => p.id === uiStore.get().selectedId);
  const next = plants[(i + dir + plants.length) % plants.length];
  patchUi({ selectedId: next.id });
}
