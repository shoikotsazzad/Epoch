// Stones: a Sierpinski triangle of rounded stones; each outer corner is one canon voice.

import type { StoneTriangle } from "@/core/types";
import { color, withAlpha } from "../tokens";
import { hash } from "../layout";
import type { DrawCtx } from "./types";

/** Glow key used for a canon voice (frame ids are >= 0). */
export const voiceKey = (voice: number) => -1 - voice;

function stone(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.82 + hash(seed * 13 + (i % n)) * 0.3);
    const px = x + Math.cos(a) * rr * 1.15;
    const py = y + Math.sin(a) * rr * 0.85;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export interface StonePoints {
  points: { x: number; y: number; level: number }[];
  maxLevel: number;
}

/** Unique vertices of the triangles at level min(L, 2) (more would be gravel, not stones). */
export function stonePoints(triangles: StoneTriangle[]): StonePoints {
  const maxLevel = Math.max(0, ...triangles.map((t) => t.level));
  const lvl = Math.min(maxLevel, 2);
  const seen = new Map<string, { x: number; y: number; level: number }>();
  for (const t of triangles) {
    if (t.level !== lvl) continue;
    for (const [x, y] of [
      [t.ax, t.ay],
      [t.bx, t.by],
      [t.cx, t.cy],
    ]) {
      const k = `${x.toFixed(3)},${y.toFixed(3)}`;
      if (!seen.has(k)) seen.set(k, { x, y, level: lvl });
    }
  }
  return { points: [...seen.values()], maxLevel };
}

export function drawStones(
  d: DrawCtx,
  triangles: StoneTriangle[],
  corners: { x: number; y: number }[],
  pts: StonePoints,
) {
  const { ctx, S, hl, xrayDim } = d;
  ctx.save();
  ctx.globalAlpha = d.alpha * (d.reduceMotion ? d.progress : 1);
  const shown = d.reduceMotion ? pts.maxLevel : Math.floor(d.progress * (pts.maxLevel + 1) - 0.0001);

  // Sierpinski hairlines at the deepest visible level
  ctx.lineWidth = 0.8;
  for (const t of triangles) {
    const isHl = hl && (hl.stack.has(t.frameId) || hl.current === t.frameId);
    if (t.level !== Math.min(shown, pts.maxLevel) && !isHl) continue;
    let stroke: string = withAlpha(color.sea400, xrayDim ? 0.2 : 0.35);
    if (hl) {
      stroke = hl.stack.has(t.frameId) ? withAlpha(color.paper100, 0.9) : withAlpha(color.teal500, 0.45);
      if (hl.current === t.frameId) stroke = d.accent;
    }
    const g = d.glow(t.frameId);
    if (g > 0.02 && !hl) stroke = withAlpha(d.accent, 0.35 + 0.6 * g);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = isHl ? 1.6 : 0.8;
    ctx.beginPath();
    ctx.moveTo(t.ax * S, t.ay * S);
    ctx.lineTo(t.bx * S, t.by * S);
    ctx.lineTo(t.cx * S, t.cy * S);
    ctx.closePath();
    ctx.stroke();
  }

  // inner stones
  if (shown >= 1) {
    for (let i = 0; i < pts.points.length; i++) {
      const p = pts.points[i];
      const isCorner = corners.some((c) => Math.abs(c.x - p.x) < 1e-3 && Math.abs(c.y - p.y) < 1e-3);
      if (isCorner) continue;
      ctx.fillStyle = withAlpha(xrayDim || hl ? color.teal500 : color.paper300, 0.75);
      stone(ctx, p.x * S, p.y * S, S * (p.level === 1 ? 0.075 : 0.055), i + 3);
      ctx.fill();
    }
  }

  // the three voices: big corner stones
  corners.forEach((c, v) => {
    const g = d.glow(voiceKey(v));
    const r = S * 0.13;
    if (g > 0.02 && d.quality > 0.4) {
      const grad = ctx.createRadialGradient(c.x * S, c.y * S, r * 0.5, c.x * S, c.y * S, r * 2.6);
      grad.addColorStop(0, withAlpha(d.accent, 0.45 * g));
      grad.addColorStop(1, withAlpha(d.accent, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x * S, c.y * S, r * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = withAlpha(xrayDim ? color.teal500 : color.paper300, 0.92);
    stone(ctx, c.x * S, c.y * S, r, v);
    ctx.fill();
    ctx.strokeStyle = withAlpha(color.slate600, 0.9);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (g > 0.02) {
      ctx.fillStyle = withAlpha(d.accent, 0.75 * g);
      stone(ctx, c.x * S, c.y * S, r * 0.96, v);
      ctx.fill();
    }
  });
  ctx.restore();
}

export function stonesFramePoint(triangles: StoneTriangle[], frameId: number, S: number) {
  const t = triangles.find((x) => x.frameId === frameId);
  return t ? { x: ((t.ax + t.bx + t.cx) / 3) * S, y: ((t.ay + t.by + t.cy) / 3) * S } : null;
}
