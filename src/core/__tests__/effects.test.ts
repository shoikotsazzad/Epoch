import { describe, expect, it } from "vitest";
import { DEFAULT_EFFECTS, clickFreq, dropletFreq, markEffects, windLevel, windTarget } from "../effects";
import { growPlant } from "../recursions";
import { decodeGarden, encodeGarden, toBase64Url } from "../urlState";
import { PRESETS, gardenFromPreset, makePlant } from "../presets";
import type { PlantKind } from "../types";

const growOf = (kind: PlantKind) => growPlant(makePlant(kind, 0.5, 0.5, undefined, `${kind[0]}0`), 4821, 5);

describe("sound effects follow the recursion", () => {
  it("bonsai: every call (push, leaf, pop) shapes the wind", () => {
    const g = growOf("bonsai");
    const fx = markEffects("bonsai", g.events);
    expect(fx.length).toBe(g.events.length);
    g.events.forEach((e, i) => expect(fx[i]).toBe(e.role === "push" || e.role === "leaf" || e.role === "pop"));
    expect(fx.some(Boolean)).toBe(true);
  });

  it("rain: only surviving Cantor segments (pulses) drip; the level-0 tone does not", () => {
    const g = growOf("rain");
    const fx = markEffects("rain", g.events);
    g.events.forEach((e, i) => expect(fx[i]).toBe(e.role === "pulse"));
    expect(fx.filter(Boolean).length).toBeGreaterThan(0);
  });

  it("stones: exactly one click per canon voice, on that voice's first note", () => {
    const g = growOf("stones");
    const fx = markEffects("stones", g.events);
    const voices = new Set(g.events.map((e) => e.voice ?? 0));
    expect(fx.filter(Boolean).length).toBe(voices.size);
    g.events.forEach((e, i) => {
      if (!fx[i]) return;
      const sameVoice = g.events.filter((x) => (x.voice ?? 0) === (e.voice ?? 0));
      expect(e.time).toBe(Math.min(...sameVoice.map((x) => x.time)));
    });
  });

  it("sunflower: no effect (its bells are the sparkle)", () => {
    expect(markEffects("sunflower", growOf("sunflower").events).every((x) => !x)).toBe(true);
  });

  it("wind rises with the Wind slider; a deeper push swells it, a pop settles it", () => {
    expect(windLevel(1)).toBeGreaterThan(windLevel(0));
    expect(windLevel(5)).toBe(windLevel(1));
    const shallow = windTarget("push", 1, 0.3);
    const deep = windTarget("push", 5, 0.3);
    expect(deep.level).toBeGreaterThan(shallow.level);
    expect(deep.freq).toBeGreaterThan(shallow.freq);
    const pop = windTarget("pop", 5, 0.3);
    expect(pop.level).toBe(windLevel(0.3));
    expect(pop.ramp).toBeGreaterThan(deep.ramp); // release is slower than tension
  });

  it("drops and clicks stay in a soft, deterministic range", () => {
    for (let id = 0; id < 200; id++) {
      const f = dropletFreq(id, id % 7);
      expect(f).toBeGreaterThanOrEqual(900);
      expect(f).toBeLessThanOrEqual(2000);
      expect(dropletFreq(id, id % 7)).toBe(f);
    }
    for (const n of [65, 110, 220, 440, 880, 1760]) {
      const c = clickFreq(n);
      expect(c).toBeGreaterThanOrEqual(350);
      expect(c).toBeLessThanOrEqual(900);
    }
  });

  it("every mood sets an effects level, and it survives a share link", () => {
    for (const p of Object.values(PRESETS)) expect(p.effects).toBeGreaterThan(0);
    const g = { ...gardenFromPreset("rainGarden", 7), effects: 0.25 };
    expect(decodeGarden(encodeGarden(g))?.effects).toBe(0.25);
  });

  it("older share links without an effects value get the default", () => {
    const old = { v: 1, s: 1, p: "night", k: "majorPentatonic", r: 50, t: 56, w: 0.4, d: 0.5, g: [] };
    expect(decodeGarden(toBase64Url(JSON.stringify(old)))?.effects).toBe(DEFAULT_EFFECTS);
  });
});
