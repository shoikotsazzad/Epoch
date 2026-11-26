// Sunflower: a golden-angle seed head. Seeds grow larger toward the edge (like a
// real sunflower) and are warm cream / amber. Two families of spiral arms (the
// 13 and 21 parastichies, both Fibonacci numbers) are lit so the golden spiral
// is visible; seeds at Fibonacci indices light up when fib(k) returns.

import type { Frame, SunflowerSeed } from "@/core/types";
import { color, withAlpha } from "../tokens";
import type { DrawCtx } from "./types";

/** frameId -> seed index (memo hits map to the seed of the value they return). */
export function sunflowerFrameSeeds(trace: Frame[], seedCount: number): Map<number, number> {
  const m = new Map<number, number>();
  for (const f of trace) if (f.args.value !== undefined) m.set(f.id, f.args.value % seedCount);
  return m;
}

/** Seeds on one of the visible spiral arms (every 13th or 21st seed). */
const onArm = (i: number) => i > 0 && (i % 21 === 0 || i % 13 === 0);

export function drawSunflower(d: DrawCtx, seeds: SunflowerSeed[], frameSeeds: Map<number, number>, seedGlow: (index: number) => number) {
  const { ctx, S, hl, xrayDim } = d;
  ctx.save();
  ctx.globalAlpha = d.alpha * (d.reduceMotion ? d.progress : 1);

  const shown = d.reduceMotion ? seeds.length : Math.ceil(seeds.length * d.progress);
  const n = Math.max(2, seeds.length);
  const unit = S / 95;
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
    const t = Math.sqrt(i / (n - 1)); // 0 at the centre, 1 at the rim
    const x = s.x * S;
    const y = s.y * S;
    const fib = s.frameId !== undefined;
    const arm = onArm(i);
    const r = (1.1 + 2.9 * t) * unit * (fib ? 1.25 : 1);
    const g = seedGlow(i);
    const h = hlSeeds.get(i);

    let fill: string;
    if (xrayDim) fill = withAlpha(color.teal500, fib || arm ? 0.6 : 0.3);
    else if (hl) fill = h === "current" ? d.accent : h === "stack" ? withAlpha(color.paper100, 0.95) : withAlpha(color.teal500, fib ? 0.7 : 0.3);
    else if (fib) fill = withAlpha(d.accent, 0.95);
    else if (arm) fill = withAlpha(d.accent, 0.68 + 0.3 * t);
    else fill = withAlpha(color.lantern200, 0.42 + 0.4 * t); // warm cream, brighter toward the rim

    if (g > 0.02 && d.quality > 0.4) {
      ctx.fillStyle = withAlpha(color.lantern200, 0.35 * g);
      ctx.beginPath();
      ctx.arc(x, y, r * 3 + 4 * g, 0, Math.PI * 2);
      ctx.fill();
      fill = withAlpha(color.lantern200, 0.7 + 0.3 * g);
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    // seeds are slightly oval, pointing away from the centre
    const a = Math.atan2(s.y, s.x);
    ctx.ellipse(x, y, r * 1.15, r * 0.85, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
