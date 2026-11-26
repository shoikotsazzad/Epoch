import { describe, expect, it } from "vitest";
import { mulberry32 } from "../rng";
import { SCALES, bassSafe, isInScale, quantize } from "../scales";
import { PARAM_SPECS, defaultParams } from "../params";
import { GROW, growBonsai, growPlant, growStones, growSunflower } from "../recursions";
import { BONSAI_MAX_EVENTS, BONSAI_MAX_NODES, effectiveTreeDepth } from "../recursions/tree";
import { makePlant } from "../presets";
import type { Frame, GrowResult, PlantKind, ScaleId } from "../types";
import { PLANT_KINDS } from "../types";

const SEEDS = [1, 42, 4821, 99999];

/** Parameter sets to try per plant: defaults, all-min, all-max. */
function paramSets(kind: PlantKind): Record<string, number>[] {
  const specs = PARAM_SPECS[kind];
  const min: Record<string, number> = {};
  const max: Record<string, number> = {};
  for (const s of specs) {
    min[s.key] = s.min;
    max[s.key] = s.max;
  }
  return [defaultParams(kind) as unknown as Record<string, number>, min, max];
}

function grow(kind: PlantKind, params: Record<string, number>, seed: number, scaleLength = 5): GrowResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (GROW[kind] as any)(params, mulberry32(seed), { scaleLength });
}

function checkTrace(trace: Frame[]) {
  const byId = new Map(trace.map((f) => [f.id, f]));
  const ticks = new Set<number>();
  trace.forEach((f, i) => {
    expect(f.id).toBe(i);
    expect(f.exitIndex).toBeGreaterThan(f.enterIndex);
    expect(ticks.has(f.enterIndex)).toBe(false);
    expect(ticks.has(f.exitIndex)).toBe(false);
    ticks.add(f.enterIndex);
    ticks.add(f.exitIndex);
    if (f.parentId === null) {
      expect(i).toBe(0);
    } else {
      const parent = byId.get(f.parentId)!;
      expect(parent).toBeDefined();
      // Proper nesting: a child call is entered and exited inside its parent's call.
      expect(f.enterIndex).toBeGreaterThan(parent.enterIndex);
      expect(f.exitIndex).toBeLessThan(parent.exitIndex);
      expect(f.depth).toBe(parent.depth + 1);
    }
  });
  // Every tick from 0..2N-1 used exactly once (one push + one pop per call).
  expect(ticks.size).toBe(trace.length * 2);
  expect(Math.max(...ticks)).toBe(trace.length * 2 - 1);
}

describe.each(PLANT_KINDS)("%s recursion", (kind) => {
  it("same seed -> identical events, trace and geometry", () => {
    for (const params of paramSets(kind))
      for (const seed of SEEDS) expect(grow(kind, params, seed)).toEqual(grow(kind, params, seed));
  });

  it("different seeds can produce different output (randomness is used where expected)", () => {
    const outs = SEEDS.map((s) => JSON.stringify(grow(kind, defaultParams(kind) as never, s).events));
    if (kind !== "stones" && kind !== "rain") expect(new Set(outs).size).toBeGreaterThan(1);
  });

  it("respects caps and produces sane events", () => {
    for (const params of paramSets(kind))
      for (const seed of SEEDS) {
        const r = grow(kind, params, seed);
        expect(r.events.length).toBeGreaterThan(0);
        expect(r.events.length).toBeLessThanOrEqual(600);
        expect(r.trace.length).toBeLessThanOrEqual(1200);
        const frameIds = new Set(r.trace.map((f) => f.id));
        for (const e of r.events) {
          expect(frameIds.has(e.frameId)).toBe(true);
          expect(e.time).toBeGreaterThanOrEqual(0);
          expect(e.time).toBeLessThan(r.lengthBeats);
          expect(e.dur).toBeGreaterThan(0);
          expect(e.vel).toBeGreaterThan(0);
          expect(e.vel).toBeLessThanOrEqual(1);
          expect(Number.isInteger(e.degree)).toBe(true);
        }
      }
  });

  it("clamps out-of-range params instead of exploding", () => {
    const wild: Record<string, number> = {};
    for (const s of PARAM_SPECS[kind]) wild[s.key] = s.max * 100;
    const r = grow(kind, wild, 7);
    expect(r.events.length).toBeLessThanOrEqual(600);
    const nan: Record<string, number> = {};
    for (const s of PARAM_SPECS[kind]) nan[s.key] = NaN;
    expect(grow(kind, nan, 7)).toEqual(grow(kind, defaultParams(kind) as never, 7));
  });

  it("every event is in key, for every scale", () => {
    for (const id of Object.keys(SCALES) as ScaleId[]) {
      const scale = SCALES[id];
      for (const params of paramSets(kind)) {
        const r = grow(kind, params, 4821, scale.length);
        for (const e of r.events) expect(isInScale(quantize(e.degree, e.octave, scale, 50), scale, 50)).toBe(true);
        for (const f of r.trace)
          if (f.note) expect(isInScale(quantize(f.note.degree, f.note.octave, scale, 50), scale, 50)).toBe(true);
      }
    }
  });

  it("trace frames have matching, properly nested enter/exit", () => {
    for (const params of paramSets(kind)) checkTrace(grow(kind, params, 42).trace);
  });
});

describe("bonsai specifics", () => {
  it("caps node count (3 branches cannot reach depth 8)", () => {
    expect(effectiveTreeDepth(3, 8)).toBe(5);
    expect(effectiveTreeDepth(2, 8)).toBe(8);
    const r = growBonsai({ depth: 8, branches: 3, spread: 30, decay: 0.8, wind: 0, prune: 0 }, mulberry32(1));
    expect(r.trace.length).toBeLessThanOrEqual(BONSAI_MAX_NODES);
    expect(r.events.length).toBeLessThanOrEqual(BONSAI_MAX_EVENTS);
  });

  it("sibling branches use chord tones, never adjacent scale steps", () => {
    for (const seed of SEEDS) {
      const r = growBonsai({ depth: 6, branches: 3, spread: 26, decay: 0.72, wind: 0.3, prune: 0 }, mulberry32(seed));
      const kids = new Map<number, number[]>();
      for (const f of r.trace) {
        if (f.parentId === null) continue;
        const list = kids.get(f.parentId) ?? [];
        list.push(f.note!.degree);
        kids.set(f.parentId, list);
      }
      for (const degrees of kids.values())
        for (let i = 0; i < degrees.length; i++)
          for (let j = i + 1; j < degrees.length; j++) expect(Math.abs(degrees[i] - degrees[j])).toBeGreaterThanOrEqual(2);
    }
  });

  it("depth sets register: trunk low, leaves high", () => {
    const r = growBonsai({ depth: 6, branches: 2, spread: 26, decay: 0.72, wind: 0.3, prune: 0 }, mulberry32(3));
    expect(r.trace[0].note!.octave).toBe(0);
    const leafOctaves = r.trace.filter((f) => f.depth === 6).map((f) => f.note!.octave);
    expect(Math.min(...leafOctaves)).toBe(2);
  });

  it("includes push (tension) and pop (release) roles", () => {
    const r = growBonsai({ depth: 5, branches: 2, spread: 26, decay: 0.72, wind: 0.3, prune: 0 }, mulberry32(3));
    const roles = new Set(r.events.map((e) => e.role));
    expect(roles.has("push")).toBe(true);
    expect(roles.has("pop")).toBe(true);
  });
});

describe("fibonacci specifics", () => {
  it("computes fib(n) recursively and records memo hits", () => {
    const r = growSunflower({ n: 10, seeds: 144, density: 0.5 }, mulberry32(1));
    const root = r.trace[0];
    expect(root.args.n).toBe(10);
    expect(root.args.value).toBe(55);
    const hits = r.trace.filter((f) => f.memoHit);
    // With memoization: fib(n) makes 2n-1 calls; n-2 of them are memo hits
    // (fib(0) is computed fresh the first time, every other fib(k-2) is a hit).
    expect(r.trace.length).toBe(2 * 10 - 1);
    expect(hits.length).toBe(10 - 2);
    // A memo hit never recurses further.
    for (const h of hits) expect(r.trace.some((f) => f.parentId === h.id)).toBe(false);
  });

  it("lights seeds at Fibonacci indices on the golden-angle spiral", () => {
    const r = growSunflower({ n: 12, seeds: 377, density: 0.35 }, mulberry32(1));
    if (r.geometry.kind !== "sunflower") throw new Error("wrong geometry");
    const lit = r.geometry.seeds.filter((s) => s.frameId !== undefined).map((s) => s.index);
    for (const i of lit) expect([0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]).toContain(i);
  });
});

describe("stones specifics", () => {
  it("is a three-voice canon: same line, delayed per voice", () => {
    const r = growStones({ levels: 2, canonDelay: 3, voicing: 0 }, mulberry32(1), { scaleLength: 5 });
    const byVoice = [0, 1, 2].map((v) => r.events.filter((e) => e.voice === v && e.role === "canon" && e.vel > 0.2));
    expect(byVoice[0].length).toBe(9);
    for (let v = 1; v < 3; v++) {
      expect(byVoice[v].length).toBe(9);
      byVoice[v].forEach((e, i) => expect(e.time - byVoice[0][i].time).toBe(3 * v));
    }
  });

  it("low voicing stays bass-safe after the quantizer", () => {
    const scale = SCALES.minorPentatonic;
    const r = growStones({ levels: 3, canonDelay: 2, voicing: 2 }, mulberry32(9), { scaleLength: 5 });
    for (const e of r.events) {
      const m = bassSafe(quantize(e.degree, e.octave, scale, 45), 45);
      if (m < 48) expect([0, 7]).toContain((((m - 45) % 12) + 12) % 12);
    }
  });
});

describe("growPlant", () => {
  it("is deterministic per garden seed and plant id", () => {
    const p = makePlant("bonsai", 0.5, 0.5, undefined, "abc");
    expect(growPlant(p, 4821, 5)).toEqual(growPlant(p, 4821, 5));
    expect(JSON.stringify(growPlant(p, 4821, 5))).not.toBe(JSON.stringify(growPlant(p, 4822, 5)));
  });
});
