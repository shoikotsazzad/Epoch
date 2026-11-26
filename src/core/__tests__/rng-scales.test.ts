import { describe, expect, it } from "vitest";
import { deriveSeed, mulberry32 } from "../rng";
import { SCALES, bassSafe, degreeOfInterval, isInScale, quantize, resolveDegree, midiToName } from "../scales";
import type { ScaleId } from "../types";

describe("mulberry32", () => {
  it("is deterministic for a seed", () => {
    const a = mulberry32(4821);
    const b = mulberry32(4821);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
  it("differs across seeds and stays in [0,1)", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let same = 0;
    for (let i = 0; i < 100; i++) {
      const x = a();
      const y = b();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      if (x === y) same++;
    }
    expect(same).toBeLessThan(3);
  });
  it("derives independent streams per salt", () => {
    expect(deriveSeed(7, "bonsai:a")).not.toBe(deriveSeed(7, "bonsai:b"));
    expect(deriveSeed(7, "bonsai:a")).toBe(deriveSeed(7, "bonsai:a"));
  });
});

describe("quantizer", () => {
  it("maps degrees into the scale and wraps octaves", () => {
    const s = SCALES.majorPentatonic;
    expect(quantize(0, 0, s, 48)).toBe(48);
    expect(quantize(3, 0, s, 48)).toBe(55); // G3
    expect(quantize(5, 0, s, 48)).toBe(60); // next octave tonic
    expect(quantize(-1, 0, s, 48)).toBe(45); // A2
    expect(quantize(0, 1, s, 48)).toBe(60);
    expect(midiToName(60)).toBe("C4");
  });

  it("never leaves the key, for any degree, octave and scale", () => {
    for (const id of Object.keys(SCALES) as ScaleId[]) {
      const s = SCALES[id];
      for (let d = -20; d <= 20; d++)
        for (let o = -1; o <= 3; o++) expect(isInScale(quantize(d, o, s, 50), s, 50)).toBe(true);
    }
  });

  it("finds the fifth in every scale", () => {
    expect(degreeOfInterval(SCALES.majorPentatonic, 7)).toBe(3);
    expect(degreeOfInterval(SCALES.minorPentatonic, 7)).toBe(3);
    expect(degreeOfInterval(SCALES.lydian, 7)).toBe(4);
    expect(degreeOfInterval(SCALES.dorian, 7)).toBe(4);
  });

  it("bassSafe allows only roots and fifths below C3, and stays in key", () => {
    const s = SCALES.minorPentatonic;
    const root = 45;
    for (let d = -10; d <= 10; d++) {
      const m = bassSafe(quantize(d, -1, s, root), root);
      expect(isInScale(m, s, root)).toBe(true);
      if (m < 48) expect([0, 7]).toContain((((m - root) % 12) + 12) % 12);
    }
  });

  it("resolves toward degree 0 or 4", () => {
    expect([0, 4, 5]).toContain(resolveDegree(1, 5));
    expect(resolveDegree(3, 5)).toBe(4);
    expect(resolveDegree(7, 5)).toBe(5);
  });
});
