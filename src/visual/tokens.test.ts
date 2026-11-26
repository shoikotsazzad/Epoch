import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { color, contrast, cssVarName, type ColorToken } from "./tokens";

const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("design tokens", () => {
  it("tokens.ts and globals.css agree on every colour", () => {
    for (const [name, hex] of Object.entries(color)) {
      const v = cssVarName(name as ColorToken);
      const m = css.match(new RegExp(`${v}:\\s*(#[0-9a-fA-F]{6})`));
      expect(m, `${v} missing in globals.css`).not.toBeNull();
      expect(m![1].toLowerCase()).toBe(hex.toLowerCase());
    }
  });

  it("background is near-black but not #000, and nothing is pure white", () => {
    expect(color.ink950).not.toBe("#000000");
    for (const hex of Object.values(color)) expect(hex.toLowerCase()).not.toBe("#ffffff");
  });

  it("text colours meet WCAG AA (4.5:1) on the background and on panels", () => {
    for (const bg of [color.ink950, color.ink900, color.ink800])
      for (const fg of [color.paper100, color.paper300, color.paper500, color.lantern400])
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("UI component colours meet 3:1 (focus ring, inactive icons)", () => {
    expect(contrast(color.sea300, color.ink950)).toBeGreaterThanOrEqual(3);
    expect(contrast(color.sea400, color.ink950)).toBeGreaterThanOrEqual(3);
  });
});
