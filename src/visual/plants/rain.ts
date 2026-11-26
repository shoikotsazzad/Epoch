// Rain: the Cantor set as a ladder of bars; surviving segments release drops that ripple into the sand.

import type { RainBar } from "@/core/types";
import { color, withAlpha } from "../tokens";
import type { DrawCtx } from "./types";

export const RAIN_TOP = -0.6;
export const RAIN_BOTTOM = 0.2;
export const RAIN_GROUND = 0.78;

export function rainRowY(level: number, levels: number): number {
  return RAIN_TOP + (level / Math.max(1, levels)) * (RAIN_BOTTOM - RAIN_TOP);
}

export function rainBarPoint(bar: RainBar, levels: number, S: number) {
  return { x: (-1 + (bar.start + bar.length / 2) * 2) * S, y: rainRowY(bar.level, levels) * S };
}

export function drawRain(d: DrawCtx, bars: RainBar[]) {
  const { ctx, S, hl, xrayDim } = d;
  const levels = Math.max(1, ...bars.map((b) => b.level));
  const shownLevels = d.reduceMotion ? levels : Math.floor(d.progress * (levels + 1) - 0.0001);
  ctx.save();
  ctx.globalAlpha = d.alpha * (d.reduceMotion ? d.progress : 1);
  ctx.lineCap = "round";
  for (const b of bars) {
    if (b.level > shownLevels) continue;
    const y = rainRowY(b.level, levels) * S;
    const x1 = (-1 + b.start * 2) * S;
    const x2 = (-1 + (b.start + b.length) * 2) * S;
    if (b.removed) {
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = withAlpha(color.teal500, xrayDim ? 0.3 : 0.6);
      ctx.lineWidth = 1;
    } else {
      ctx.setLineDash([]);
      let stroke: string = withAlpha(color.sea300, 0.55);
      if (xrayDim) stroke = withAlpha(color.teal500, 0.5);
      else if (hl) {
        stroke = hl.stack.has(b.frameId) ? withAlpha(color.paper100, 0.95) : withAlpha(color.teal500, 0.6);
        if (hl.current === b.frameId) stroke = d.accent;
      }
      ctx.strokeStyle = stroke;
      ctx.lineWidth = b.level === 0 ? 2.4 : 2;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    if (!b.removed) {
      const g = d.glow(b.frameId);
      if (g > 0.02) {
        ctx.setLineDash([]);
        ctx.strokeStyle = withAlpha(d.accent, 0.85 * g);
        ctx.lineWidth = 3;
        if (d.quality > 0.6) {
          ctx.shadowColor = d.accent;
          ctx.shadowBlur = 10 * g;
        }
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }
  ctx.setLineDash([]);
  // the "ground line" where drops land, very faint
  ctx.strokeStyle = withAlpha(color.sea400, 0.18);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-0.7 * S, RAIN_GROUND * S);
  ctx.lineTo(0.7 * S, RAIN_GROUND * S);
  ctx.stroke();
  ctx.restore();
}
