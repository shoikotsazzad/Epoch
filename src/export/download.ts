import type { GardenState } from "@/core/types";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const PRESET_SLUG: Record<string, string> = {
  night: "night",
  dawn: "dawn",
  rainGarden: "rain-garden",
  floating: "floating",
  deepSleep: "deep-sleep",
};

/** e.g. stack-garden_night_seed-4821_3min.wav */
export function exportFilename(state: Pick<GardenState, "preset" | "seed">, label: string, ext: string): string {
  return `stack-garden_${PRESET_SLUG[state.preset] ?? state.preset}_seed-${state.seed}_${label}.${ext}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
