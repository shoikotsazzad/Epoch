// Shared contract for all four recursions. PURE: no DOM, no Tone.
// The same GrowResult drives live audio, visuals, X-ray mode and offline export.

export type PlantKind = "bonsai" | "rain" | "stones" | "sunflower";

export const PLANT_KINDS: readonly PlantKind[] = ["bonsai", "rain", "stones", "sunflower"];

/** Musical role of an event, used for captions and timbre choices. */
export type NoteRole =
  | "push" // entering a deeper call: tension
  | "pop" // returning from a call: release / cadence
  | "leaf" // base case
  | "pulse" // rain: surviving Cantor segment
  | "drone" // rain: level-0 sustained tone
  | "canon" // stones: one voice of the canon
  | "spark" // sunflower: computed fib(k)
  | "echo"; // sunflower: memo hit (softer)

export interface NoteEvent {
  time: number; // beats from loop start
  degree: number; // SCALE DEGREE, never a raw frequency, so it can never go out of key
  octave: number; // register offset relative to the plant's base register
  dur: number; // beats
  vel: number; // 0..1
  depth: number; // recursion depth that produced it
  frameId: number; // links to the trace frame
  pos?: { x: number; y: number }; // local coords for the visual
  voice?: number; // Sierpinski: 0 root, 1 fifth, 2 octave
  pan?: number; // -1..1 within the plant's stereo zone
  role?: NoteRole;
}

/** One recursive call, recorded for X-ray mode. */
export interface Frame {
  id: number;
  parentId: number | null;
  fn: string;
  args: Record<string, number>;
  depth: number;
  enterIndex: number; // global tick when the call was pushed
  exitIndex: number; // global tick when the call returned
  memoHit?: boolean;
  /** The note this call represents (even if it was thinned out of live playback), so X-ray can play every step. */
  note?: { degree: number; octave: number };
}

// ---------------------------------------------------------------------------
// Geometry: per-plant shapes in LOCAL units (plant centred at 0,0, roughly -1..1).
// The renderer scales these into the garden; the debug page draws them raw.

export interface BonsaiSegment {
  frameId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  width: number;
  leaf: boolean;
}

export interface RainBar {
  frameId: number;
  start: number; // 0..1 of the phrase
  length: number; // 0..1 of the phrase
  level: number;
  removed: boolean; // true for the dropped middle (drawn faintly)
}

export interface StoneTriangle {
  frameId: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  level: number;
  corner: number; // which corner of its parent (0 top, 1 left, 2 right; -1 for the root)
}

export interface SunflowerSeed {
  index: number;
  x: number;
  y: number;
  /** frameId of the fib(k) call that lights this seed, if any */
  frameId?: number;
  k?: number;
}

export type Geometry =
  | { kind: "bonsai"; segments: BonsaiSegment[] }
  | { kind: "rain"; bars: RainBar[] }
  | { kind: "stones"; triangles: StoneTriangle[]; corners: { x: number; y: number }[] }
  | { kind: "sunflower"; seeds: SunflowerSeed[] };

export interface GrowResult {
  events: NoteEvent[];
  trace: Frame[];
  lengthBeats: number;
  geometry: Geometry;
}

/** Extra context a recursion may need (kept tiny on purpose). */
export interface GrowContext {
  scaleLength: number;
}

export type Grow<P> = (params: P, rand: () => number, ctx?: GrowContext) => GrowResult;

// ---------------------------------------------------------------------------
// Parameters

export interface BonsaiParams {
  depth: number; // 3..8
  branches: number; // 2..3
  spread: number; // degrees, 12..45
  decay: number; // 0.6..0.8
  wind: number; // 0..1
  prune: number; // 0..0.5
}

export interface RainParams {
  levels: number; // 2..6
  removed: number; // fraction removed from the middle, 0.2..0.5 ("Silence")
  phraseBeats: number; // 8..32
}

export interface StonesParams {
  levels: number; // 1..5
  canonDelay: number; // beats, 1..8
  voicing: number; // index into VOICINGS
}

export interface SunflowerParams {
  n: number; // 5..14
  seeds: number; // 34..377
  density: number; // 0.2..0.5
}

export interface PlantParamsMap {
  bonsai: BonsaiParams;
  rain: RainParams;
  stones: StonesParams;
  sunflower: SunflowerParams;
}

export type AnyPlantParams = PlantParamsMap[PlantKind];

export interface Plant<K extends PlantKind = PlantKind> {
  id: string;
  kind: K;
  x: number; // 0..1 across the garden
  y: number; // 0..1 down the garden
  params: PlantParamsMap[K];
  volume: number; // 0..1
  loopSeconds: number;
  muted: boolean;
}

export type ScaleId = "majorPentatonic" | "minorPentatonic" | "lydian" | "dorian";

export type PresetId = "dawn" | "rainGarden" | "night" | "floating" | "deepSleep";

export interface GardenState {
  v: 1;
  seed: number;
  preset: PresetId;
  scale: ScaleId;
  root: number; // MIDI note of the tonic (e.g. 48 = C3)
  bpm: number;
  reverb: number; // 0..1 wet
  drone: number; // 0..1
  effects: number; // 0..1 sound effects from the recursion (wind, droplets, stone clicks)
  plants: Plant[];
}
