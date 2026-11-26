// Tiny external stores (no library). React reads them with useSyncExternalStore;
// the audio engine and renderer subscribe directly. Never updated per note or per frame.

import { useSyncExternalStore } from "react";
import type { GardenState, PlantKind } from "@/core/types";
import { gardenFromPreset, DEFAULT_PRESET } from "@/core/presets";

type Listener = () => void;

export interface Store<T> {
  get: () => T;
  set: (next: T | ((s: T) => T)) => void;
  subscribe: (l: Listener) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(next) {
      const value = typeof next === "function" ? (next as (s: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

/** Select a slice. The selector must return a primitive or a stable reference. */
export function useStore<T, S>(store: Store<T>, selector: (s: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

// ---------------------------------------------------------------------------

export const gardenStore = createStore<GardenState>(gardenFromPreset(DEFAULT_PRESET, 4821));

export type PanelId = null | "plant" | "menu" | "export" | "shortcuts" | "sleepDone" | "help" | "mood";

export interface UiState {
  started: boolean; // Begin pressed, audio unlocked
  playing: boolean;
  selectedId: string | null;
  panel: PanelId;
  xray: boolean;
  xrayPlantId: string | null;
  xrayTick: number;
  breathing: boolean;
  reduceMotionToggle: boolean; // in-app toggle
  osReduceMotion: boolean;
  master: number; // 0..1 user volume
  sleepMinutes: number | null;
  sleepEndsAt: number | null; // performance.now() ms
  evolveMessage: string | null;
  demo: boolean;
  dragKind: PlantKind | null; // a seed being dragged from the tray
  recording: boolean;
  helpSeen: boolean; // has this visitor opened "How to use"?
}

export const uiStore = createStore<UiState>({
  started: false,
  playing: false,
  selectedId: null,
  panel: null,
  xray: false,
  xrayPlantId: null,
  xrayTick: 0,
  breathing: false,
  reduceMotionToggle: false,
  osReduceMotion: false,
  master: 0.8,
  sleepMinutes: null,
  sleepEndsAt: null,
  evolveMessage: null,
  demo: false,
  dragKind: null,
  recording: false,
  helpSeen: true,
});

export const reduceMotion = (s: UiState) => s.reduceMotionToggle || s.osReduceMotion;

export function patchUi(patch: Partial<UiState>) {
  uiStore.set((s) => ({ ...s, ...patch }));
}

/** Captions: updated by the runtime at most every ~2 s. */
export const captionStore = createStore<string>("");
