// Share links: the full garden state in the URL hash (compact JSON -> base64url).
// Decoding is defensive: anything malformed returns null, and every number is clamped.

import type { GardenState, Plant, PlantKind, PresetId, ScaleId } from "./types";
import { PLANT_KINDS } from "./types";
import { LOOP_SECONDS_RANGE, PARAM_SPECS, clamp, clampParams } from "./params";
import { PRESETS } from "./presets";
import { SCALES } from "./scales";

const KIND_CODE: Record<PlantKind, string> = { bonsai: "b", rain: "r", stones: "s", sunflower: "f" };
const CODE_KIND: Record<string, PlantKind> = { b: "bonsai", r: "rain", s: "stones", f: "sunflower" };

export const BPM_RANGE = { min: 40, max: 66 };
export const ROOT_RANGE = { min: 40, max: 57 };

// Compact shape: short keys, params as an ordered array matching PARAM_SPECS.
interface Compact {
  v: 1;
  s: number; // seed
  p: string; // preset
  k: string; // scale
  r: number; // root
  t: number; // tempo
  w: number; // reverb wet
  d: number; // drone
  g: [string, string, number, number, number[], number, number, number][]; // id, kind, x, y, params, volume, loop, muted
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(b64: string): string {
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = norm + "===".slice((norm.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeGarden(state: GardenState): string {
  const c: Compact = {
    v: 1,
    s: state.seed >>> 0,
    p: state.preset,
    k: state.scale,
    r: state.root,
    t: r3(state.bpm),
    w: r3(state.reverb),
    d: r3(state.drone),
    g: state.plants.map((pl) => [
      pl.id,
      KIND_CODE[pl.kind],
      r3(pl.x),
      r3(pl.y),
      PARAM_SPECS[pl.kind].map((s) => r3((pl.params as unknown as Record<string, number>)[s.key])),
      r3(pl.volume),
      r3(pl.loopSeconds),
      pl.muted ? 1 : 0,
    ]),
  };
  return toBase64Url(JSON.stringify(c));
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

export const MAX_PLANTS = 12;

export function decodeGarden(encoded: string): GardenState | null {
  try {
    const c = JSON.parse(fromBase64Url(encoded.replace(/^#/, ""))) as Partial<Compact>;
    if (!c || c.v !== 1 || !Array.isArray(c.g)) return null;
    const preset: PresetId = typeof c.p === "string" && c.p in PRESETS ? (c.p as PresetId) : "night";
    const scale: ScaleId = typeof c.k === "string" && c.k in SCALES ? (c.k as ScaleId) : PRESETS[preset].scale;
    const plants: Plant[] = [];
    const seenIds = new Set<string>();
    for (const row of c.g.slice(0, MAX_PLANTS)) {
      if (!Array.isArray(row)) continue;
      const [id, code, x, y, params, volume, loop, muted] = row;
      const kind = CODE_KIND[String(code)];
      if (!kind || !PLANT_KINDS.includes(kind)) continue;
      let pid = typeof id === "string" && /^[a-z0-9]{1,8}$/.test(id) ? id : `${code}${plants.length}`;
      while (seenIds.has(pid)) pid += "x";
      seenIds.add(pid);
      const specs = PARAM_SPECS[kind];
      const rawParams: Record<string, number> = {};
      specs.forEach((s, i) => {
        if (Array.isArray(params)) rawParams[s.key] = num(params[i], s.default);
      });
      plants.push({
        id: pid,
        kind,
        x: clamp(num(x, 0.5), 0, 1),
        y: clamp(num(y, 0.5), 0, 1),
        params: clampParams(kind, rawParams),
        volume: clamp(num(volume, 0.8), 0, 1),
        loopSeconds: clamp(num(loop, 29), LOOP_SECONDS_RANGE.min, LOOP_SECONDS_RANGE.max),
        muted: muted === 1,
      } as Plant);
    }
    return {
      v: 1,
      seed: Math.floor(clamp(num(c.s, 4821), 0, 0xffffffff)),
      preset,
      scale,
      root: Math.round(clamp(num(c.r, PRESETS[preset].root), ROOT_RANGE.min, ROOT_RANGE.max)),
      bpm: clamp(num(c.t, PRESETS[preset].bpm), BPM_RANGE.min, BPM_RANGE.max),
      reverb: clamp(num(c.w, 0.45), 0, 1),
      drone: clamp(num(c.d, 0.5), 0, 1),
      plants,
    };
  } catch {
    return null;
  }
}
