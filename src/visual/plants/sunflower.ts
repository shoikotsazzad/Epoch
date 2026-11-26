// Sunflower: golden-angle phyllotaxis; Fibonacci-indexed seeds light up in completion order.

import type { Frame, SunflowerSeed } from "@/core/types";
import { color, withAlpha } from "../tokens";
import type { DrawCtx } from "./types";

/** frameId -> seed index (memo hits map to the seed of the value they return). */
export function sunflowerFrameSeeds(trace: Frame[], seedCount: number): Map<number, number> {
  const m = new Map<number, number>();
  for (const f of trace) if (f.args.value !== undefined) m.set(f.id, f.args.value % seedCount);
  return m;
}

export function drawSunflower(d: DrawCtx, seeds: SunflowerSeed[], frameSeeds: Map<number, number>, seedGlow: (index: number) => number) {
  const { ctx, S, hl, xrayDim } = d;
  ctx.save();
  ctx.globalAlpha = d.alpha * (d.reduceMotion ? d.progress : 1);
  // the bed
  ctx.fillStyle = withAlpha(color.pond700, 0.42);
  ctx.beginPath();
  ctx.arc(0, 0, S * 1.1, 0, Math.PI * 2);
  ctx.fill();

  const shown = d.reduceMotion ? seeds.length : Math.ceil(seeds.length * d.progress);
  const hlSeeds = new Map<number, "stack" | "current">();
  if (hl) {
    for (const id of hl.stack) {
      const s = frameSeeds.get(id);
      if (s !== undefined) hlSeeds.set(s, "stack");
    }
    const c = frameSeeds.get(hl.current);
    if (c !== undefined) hlSeeds.set(c, "current");
  }
  for (let i = 0; i < shown; i++) {
    const s = seeds[i];
    const lit = s.frameId !== undefined;
    const x = s.x * S;
    const y = s.y * S;
    const g = seedGlow(i);
    const h = hlSeeds.get(i);
    if (g > 0.02 && d.quality > 0.4) {
      ctx.fillStyle = withAlpha(d.accent, 0.35 * g);
      ctx.beginPath();
      ctx.arc(x, y, 9 * g + 3, 0, Math.PI * 2);
      ctx.fill();
    }
    let fill: string = lit ? withAlpha(color.paper300, 0.92) : withAlpha(color.paper500, 0.5);
    if (xrayDim) fill = withAlpha(color.teal500, lit ? 0.7 : 0.35);
    if (hl) fill = h === "current" ? d.accent : h === "stack" ? withAlpha(color.paper100, 0.95) : withAlpha(color.teal500, lit ? 0.7 : 0.3);
    if (g > 0.02) fill = withAlpha(d.accent, 0.5 + 0.5 * g);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, lit || h ? 2.5 : 1.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
