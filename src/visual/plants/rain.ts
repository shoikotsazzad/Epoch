// Rain: the Cantor set drawn as hanging bamboo. Each surviving segment is a piece
// of bamboo with soft ends and a node mark; the removed middles are simply empty
// air. Drops fall from the deepest pieces into small ripples in the sand.

import type { RainBar } from "@/core/types";
import { color, withAlpha } from "../tokens";
import { hash } from "../layout";
import type { DrawCtx } from "./types";

export const RAIN_TOP = -0.62;
export const RAIN_BOTTOM = 0.22;
export const RAIN_GROUND = 0.8;

export function rainRowY(level: number, levels: number): number {
  return RAIN_TOP + (level / Math.max(1, levels)) * (RAIN_BOTTOM - RAIN_TOP);
}

/** Small per-segment vertical drift so the rows don't read as a chart. */
const wobble = (frameId: number) => (hash(frameId * 3.1) - 0.5) * 0.05;

export function rainBarPoint(bar: RainBar, levels: number, S: number) {
  return { x: (-1 + (bar.start + bar.length / 2) * 2) * S, y: (rainRowY(bar.level, levels) + wobble(bar.frameId)) * S };
}

export function drawRain(d: DrawCtx, bars: RainBar[]) {
  const { ctx, S, hl, xrayDim } = d;
  const levels = Math.max(1, ...bars.map((b) => b.level));
  const shownLevels = d.reduceMotion ? levels : Math.floor(d.progress * (levels + 1) - 0.0001);
  const unit = S / 110; // stroke scale
  ctx.save();
  ctx.globalAlpha = d.alpha * (d.reduceMotion ? d.progress : 1);
  ctx.lineCap = "round";

  for (const b of bars) {
    if (b.removed || b.level > shownLevels) continue; // the Cantor gaps are just air
    const y = (rainRowY(b.level, levels) + wobble(b.frameId)) * S;
    const thick = Math.max(1.2, (3.8 - b.level * 0.55) * unit); // thick at the top, thin below
    const inset = Math.min(thick * 1.2, (b.length * S) / 3); // soft, slightly shortened ends
    const x1 = (-1 + b.start * 2) * S + inset;
    const x2 = (-1 + (b.start + b.length) * 2) * S - inset;
    if (x2 <= x1) {
      // the tiniest pieces become a single bead
      ctx.fillStyle = withAlpha(color.paper300, xrayDim ? 0.25 : 0.7);
      ctx.beginPath();
      ctx.arc((x1 + x2) / 2, y, thick * 0.6, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const sag = (x2 - x1) * 0.03; // a gentle bow, like a real stem

    let stroke: string = withAlpha(color.paper300, 0.72);
    if (xrayDim) stroke = withAlpha(color.teal500, 0.45);
    else if (hl) {
      stroke = hl.stack.has(b.frameId) ? withAlpha(color.paper100, 0.95) : withAlpha(color.teal500, 0.55);
      if (hl.current === b.frameId) stroke = d.accent;
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo((x1 + x2) / 2, y + sag, x2, y);
    ctx.stroke();

    // bamboo nodes: a darker band near each end (and in the middle of long pieces)
    if (!hl && !xrayDim) {
      ctx.strokeStyle = withAlpha(color.moss500, 0.7);
      ctx.lineWidth = Math.max(1, thick * 0.55);
      const nodes = x2 - x1 > 60 * unit ? [0.12, 0.5, 0.88] : [0.15, 0.85];
      for (const k of nodes) {
        const nx = x1 + (x2 - x1) * k;
        const ny = y + sag * 4 * k * (1 - k);
        ctx.beginPath();
        ctx.moveTo(nx, ny - thick * 0.75);
        ctx.lineTo(nx, ny + thick * 0.75);
        ctx.stroke();
      }
    }

    const g = d.glow(b.frameId);
    if (g > 0.02) {
      ctx.strokeStyle = withAlpha(d.accent, 0.85 * g);
      ctx.lineWidth = thick + 1.5;
      if (d.quality > 0.6) {
        ctx.shadowColor = d.accent;
        ctx.shadowBlur = 10 * g;
      }
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.quadraticCurveTo((x1 + x2) / 2, y + sag, x2, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}
