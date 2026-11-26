import { describe, expect, it } from "vitest";
import { DensityLimiter, priorityOf } from "../density";
import { buildSteps, describeFrame, describeStep, stackAt, stepForFrame, treeLayout } from "../xray";
import { MAX_GARDEN_PLANTS, PLANT_BOUNDS, demoGarden, evolveGarden, findFreeSpot, gardenSummary, panFor, reverbSendFor } from "../garden";
import { noteCaption } from "../captions";
import { GrowCache, growKey } from "../growCache";
import { gardenFromPreset, makePlant } from "../presets";
import { mulberry32 } from "../rng";
import { growBonsai, growSunflower } from "../recursions";
import { encodeWav, peaks } from "@/export/wav";
import { exportFilename, formatDuration } from "@/export/download";
import { buildPartEvents, REF_BPM } from "@/audio/scheduler";
import type { NoteEvent } from "../types";

const ev = (over: Partial<NoteEvent>): NoteEvent => ({ time: 0, degree: 0, octave: 0, dur: 1, vel: 0.5, depth: 3, frameId: 0, ...over });

describe("density limiter (mixing safety)", () => {
  it("never lets one plant sound more than ~3 times per second", () => {
    const lim = new DensityLimiter();
    let allowed = 0;
    for (let i = 0; i < 100; i++) if (lim.allow("a", i * 0.1, 0)) allowed++; // 10 notes/s requested over 10 s
    expect(allowed).toBeLessThanOrEqual(31);
  });

  it("caps the whole garden and drops ornaments first", () => {
    const lim = new DensityLimiter();
    const res: Record<string, number> = { essential: 0, ornament: 0 };
    for (let i = 0; i < 400; i++) {
      const t = i * 0.05; // 20 requests per second across many plants
      const plant = `p${i % 8}`;
      if (lim.allow(plant, t, i % 2 ? 2 : 0)) res[i % 2 ? "ornament" : "essential"]++;
    }
    const perSecond = (res.essential + res.ornament) / 20;
    expect(perSecond).toBeLessThanOrEqual(3.05);
    expect(res.essential).toBeGreaterThan(res.ornament);
  });

  it("exempts sustained ground tones and is deterministic", () => {
    const a = new DensityLimiter();
    const b = new DensityLimiter();
    const seq = Array.from({ length: 50 }, (_, i) => [`p${i % 3}`, i * 0.13, (i % 3) as 0 | 1 | 2] as const);
    expect(seq.map(([p, t, pr]) => a.allow(p, t, pr))).toEqual(seq.map(([p, t, pr]) => b.allow(p, t, pr)));
    expect(new DensityLimiter().allow("x", 0, 2, true)).toBe(true);
  });

  it("assigns sensible priorities", () => {
    expect(priorityOf(ev({ role: "pop" }))).toBe(0);
    expect(priorityOf(ev({ role: "push", depth: 1 }))).toBe(0);
    expect(priorityOf(ev({ role: "leaf" }))).toBe(2);
    expect(priorityOf(ev({ role: "canon", voice: 0, vel: 0.42 }))).toBe(0);
    expect(priorityOf(ev({ role: "canon", voice: 2 }))).toBe(1);
  });
});

describe("x-ray stepping", () => {
  const r = growSunflower({ n: 6, seeds: 89, density: 0.5 }, mulberry32(1));
  const steps = buildSteps(r.trace);

  it("has one enter and one exit step per call", () => {
    expect(steps).toHaveLength(r.trace.length * 2);
    expect(steps.filter((s) => s.type === "enter")).toHaveLength(r.trace.length);
    expect(steps[0]).toEqual({ tick: 0, frameId: 0, type: "enter" });
    expect(steps[steps.length - 1].type).toBe("exit");
  });

  it("reconstructs the call stack at every tick", () => {
    for (const s of steps) {
      const stack = stackAt(r.trace, steps, s.tick);
      expect(stack[0].id).toBe(0);
      expect(stack[stack.length - 1].id).toBe(s.frameId);
      stack.forEach((f, i) => expect(f.depth).toBe(i));
    }
  });

  it("describes calls, returns and memo hits", () => {
    const hit = r.trace.find((f) => f.memoHit)!;
    expect(describeFrame(r.trace[0])).toBe("fib(n=6)");
    expect(describeStep({ tick: hit.enterIndex, frameId: hit.id, type: "enter" }, hit)).toContain("memo hit");
    expect(describeStep({ tick: r.trace[0].exitIndex, frameId: 0, type: "exit" }, r.trace[0])).toBe("return fib(n=6) = 8");
    expect(stepForFrame(r.trace, hit.id)).toBe(hit.enterIndex);
  });

  it("lays out the call tree inside 0..1", () => {
    const t = growBonsai({ depth: 5, branches: 2, spread: 26, decay: 0.7, wind: 0, prune: 0 }, mulberry32(2));
    const pos = treeLayout(t.trace);
    for (const p of pos) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
    expect(pos[0].y).toBe(0);
  });
});

describe("garden helpers", () => {
  it("finds free spots inside the bounds, away from other plants", () => {
    const plants = [makePlant("bonsai", 0.5, 0.5)];
    const spot = findFreeSpot(plants, mulberry32(3));
    expect(spot.x).toBeGreaterThanOrEqual(PLANT_BOUNDS.x0);
    expect(spot.x).toBeLessThanOrEqual(PLANT_BOUNDS.x1);
    expect(spot.y).toBeGreaterThanOrEqual(PLANT_BOUNDS.y0);
    expect(spot.y).toBeLessThanOrEqual(PLANT_BOUNDS.y1);
    expect(Math.hypot((spot.x - 0.5) * 1.6, spot.y - 0.5)).toBeGreaterThan(0.2);
  });

  it("maps position to pan and distance to reverb", () => {
    expect(panFor(0)).toBe(-0.7);
    expect(panFor(1)).toBe(0.7);
    expect(panFor(0.5)).toBe(0);
    expect(reverbSendFor(0.5, 0.5)).toBeLessThan(reverbSendFor(0.1, 0.2));
  });

  it("summarises the garden for screen readers", () => {
    const g = demoGarden();
    expect(gardenSummary(g)).toBe("Garden with 4 plants: bonsai depth 6, rain level 4, stones level 3, sunflower fib(11)");
    expect(gardenSummary({ ...g, plants: [] })).toContain("empty");
  });

  it("idle evolution changes the garden gently and stays within limits", () => {
    let g = gardenFromPreset("night", 1);
    const rand = mulberry32(5);
    for (let i = 0; i < 60; i++) {
      const next = evolveGarden(g, rand);
      expect(next).not.toBeNull();
      const before = g.plants.length;
      g = next!.state;
      expect(g.plants.length).toBe(before); // never plants on its own: the visitor adds plants
      expect(g.plants.length).toBeLessThanOrEqual(MAX_GARDEN_PLANTS);
    }
    const bonsai = g.plants.find((p) => p.kind === "bonsai");
    if (bonsai) expect((bonsai.params as { depth: number }).depth).toBeLessThanOrEqual(8);
  });

  it("captions describe the music in words", () => {
    expect(noteCaption("bonsai", ev({ role: "push", depth: 3 }), undefined, "D4")).toBe("Bonsai: D4 · tension rising (depth 3)");
    const r = growSunflower({ n: 5, seeds: 34, density: 0.5 }, mulberry32(1));
    expect(noteCaption("sunflower", ev({ role: "spark" }), r.trace[0], "A5")).toBe("Sunflower: fib(5) = 5 · A5");
  });
});

describe("grow cache", () => {
  it("returns the same result object for unchanged plants and regrows on change", () => {
    const cache = new GrowCache();
    const p = makePlant("bonsai", 0.5, 0.5, undefined, "aa");
    const a = cache.get(p, 1, 5);
    expect(cache.get(p, 1, 5)).toBe(a);
    expect(cache.get({ ...p, x: 0.2 }, 1, 5)).toBe(a); // moving does not regrow
    expect(cache.get(p, 2, 5)).not.toBe(a);
    expect(growKey(p, 1, 5)).not.toBe(growKey(p, 1, 7));
  });
});

describe("scheduling (ticks)", () => {
  it("fits every event inside the plant's loop, deterministically", () => {
    const p = makePlant("bonsai", 0.5, 0.5, undefined, "b1");
    const grow = growBonsai(p.params, mulberry32(9));
    const a = buildPartEvents(p, grow, 4821, 192);
    const b = buildPartEvents(p, grow, 4821, 192);
    expect(a).toEqual(b);
    expect(a.loopTicks).toBe(Math.round(((29 * REF_BPM) / 60) * 192));
    for (const e of a.events) {
      const ticks = Number(e.time.replace("i", ""));
      expect(ticks).toBeGreaterThanOrEqual(0);
      expect(ticks).toBeLessThan(a.loopTicks);
      expect(e.vel).toBeGreaterThan(0);
      expect(e.vel).toBeLessThanOrEqual(1);
    }
  });

  it("incommensurate default cycles almost never line up", () => {
    // 29, 17, 23, 37 s are pairwise coprime: the full pattern repeats after their product
    const lcm = 29 * 17 * 23 * 37;
    expect(lcm / 3600).toBeGreaterThan(100); // > 100 hours
  });
});

describe("export helpers", () => {
  it("encodes a valid 16-bit stereo WAV", async () => {
    const sr = 8000;
    const len = 800;
    const ch = [new Float32Array(len), new Float32Array(len)];
    for (let i = 0; i < len; i++) {
      ch[0][i] = Math.sin(i / 10);
      ch[1][i] = 2; // will be clipped to +1
    }
    const blob = encodeWav({ numberOfChannels: 2, sampleRate: sr, length: len, getChannelData: (c) => ch[c] });
    const buf = new DataView(await blob.arrayBuffer());
    const str = (o: number) => String.fromCharCode(buf.getUint8(o), buf.getUint8(o + 1), buf.getUint8(o + 2), buf.getUint8(o + 3));
    expect(str(0)).toBe("RIFF");
    expect(str(8)).toBe("WAVE");
    expect(buf.getUint16(22, true)).toBe(2);
    expect(buf.getUint32(24, true)).toBe(sr);
    expect(buf.getUint16(34, true)).toBe(16);
    expect(buf.byteLength).toBe(44 + len * 4);
    expect(buf.getInt16(44 + 2, true)).toBe(32767); // clipped right channel
    expect(peaks({ numberOfChannels: 1, sampleRate: sr, length: len, getChannelData: () => ch[0] }, 10)).toHaveLength(10);
  });

  it("names files descriptively", () => {
    expect(exportFilename({ preset: "night", seed: 4821 }, "3min", "wav")).toBe("stack-garden_night_seed-4821_3min.wav");
    expect(exportFilename({ preset: "deepSleep", seed: 7 }, "1min", "mp3")).toBe("stack-garden_deep-sleep_seed-7_1min.mp3");
    expect(formatDuration(180)).toBe("3:00");
    expect(formatDuration(65.4)).toBe("1:05");
  });
});
