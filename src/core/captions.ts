// Plain-language captions describing the music (for the caption strip and screen readers).

import type { Frame, NoteEvent, PlantKind } from "./types";

/** `effects`: the sound-effect layer is on, so captions also describe the wind and the droplets. */
export function noteCaption(kind: PlantKind, e: NoteEvent, frame: Frame | undefined, noteName: string, effects = false): string {
  switch (kind) {
    case "bonsai":
      if (e.role === "pop") return `Bonsai: ${noteName} · resolving home${effects ? ", wind settles" : ""}`;
      if (e.role === "leaf") return `Bonsai: ${noteName} · leaf bell`;
      if (effects && e.depth >= 2) return `Bonsai: ${noteName} · tension rising, wind swells (depth ${e.depth})`;
      return `Bonsai: ${noteName} · ${e.depth >= 2 ? "tension rising" : "trunk"} (depth ${e.depth})`;
    case "rain":
      if (e.role === "drone") return "Rain: quiet ground tone";
      return effects ? `Rain: droplet on a Cantor segment · ${noteName} (level ${e.depth})` : `Rain: drop ${noteName} (level ${e.depth})`;
    case "stones":
      return `Stones: 3-voice canon · ${["root", "fifth", "octave"][e.voice ?? 0]} voice ${noteName}`;
    case "sunflower": {
      const n = frame?.args.n;
      const v = frame?.args.value;
      if (e.role === "echo") return `Sunflower: fib(${n}) memo hit · ${noteName}`;
      return `Sunflower: fib(${n}) = ${v ?? "?"} · ${noteName}`;
    }
  }
}

export const restCaption: Record<PlantKind, string> = {
  bonsai: "Bonsai: listening",
  rain: "Rain: rest",
  stones: "Stones: holding",
  sunflower: "Sunflower: waiting",
};
