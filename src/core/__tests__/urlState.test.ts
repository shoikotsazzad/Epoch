import { describe, expect, it } from "vitest";
import { decodeGarden, encodeGarden, fromBase64Url, toBase64Url } from "../urlState";
import { PRESET_ORDER, gardenFromPreset, makePlant } from "../presets";

describe("url state", () => {
  it("base64url round-trips unicode", () => {
    const s = "Stack Garden · 庭 · ✓";
    expect(fromBase64Url(toBase64Url(s))).toBe(s);
    expect(toBase64Url(s)).not.toMatch(/[+/=]/);
  });

  it("round-trips every preset garden exactly", () => {
    for (const id of PRESET_ORDER) {
      const g = gardenFromPreset(id, 4821);
      expect(decodeGarden(encodeGarden(g))).toEqual(g);
    }
  });

  it("round-trips a garden with all four plants, muted and tuned", () => {
    const g = gardenFromPreset("night", 1234);
    g.plants.push(makePlant("rain", 0.2, 0.3, { levels: 5, removed: 0.4 }, "r1"));
    g.plants.push({ ...makePlant("stones", 0.7, 0.6, { voicing: 1 }, "s1"), muted: true, volume: 0.4 });
    g.plants.push(makePlant("sunflower", 0.8, 0.2, { n: 13 }, "f1"));
    expect(decodeGarden(encodeGarden(g))).toEqual(g);
    expect(decodeGarden("#" + encodeGarden(g))).toEqual(g);
  });

  it("returns null for garbage", () => {
    expect(decodeGarden("")).toBeNull();
    expect(decodeGarden("not-base64!!")).toBeNull();
    expect(decodeGarden(toBase64Url("{\"v\":2}"))).toBeNull();
    expect(decodeGarden(toBase64Url("[1,2,3]"))).toBeNull();
  });

  it("clamps hostile values", () => {
    const hostile = {
      v: 1,
      s: -5,
      p: "nope",
      k: "chromatic",
      r: 200,
      t: 999,
      w: 7,
      d: -1,
      g: [
        ["x", "b", 9, -9, [99, 99, 99, 99, 99, 99], 5, 1000, 1],
        ["y", "zzz", 0, 0, [], 1, 20, 0],
      ],
    };
    const g = decodeGarden(toBase64Url(JSON.stringify(hostile)))!;
    expect(g).not.toBeNull();
    expect(g.preset).toBe("night");
    expect(g.scale).toBe("majorPentatonic");
    expect(g.bpm).toBeLessThanOrEqual(66);
    expect(g.reverb).toBeLessThanOrEqual(1);
    expect(g.drone).toBeGreaterThanOrEqual(0);
    expect(g.plants).toHaveLength(1);
    const p = g.plants[0];
    expect(p.x).toBe(1);
    expect(p.y).toBe(0);
    expect(p.volume).toBe(1);
    expect(p.loopSeconds).toBeLessThanOrEqual(61);
    expect((p.params as { depth: number }).depth).toBe(8);
  });
});
