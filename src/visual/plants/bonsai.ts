// Bonsai: ink-brush fractal tree. The branch being called glows lantern amber.

import type { BonsaiSegment } from "@/core/types";
import { color, withAlpha } from "../tokens";
import { hash } from "../layout";
import type { DrawCtx } from "./types";

/** Vertical offset that centres the tree's bounding box on the plant position. */
export function bonsaiCenterOffset(segments: BonsaiSegment[]): number {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const s of segments) {
    minY = Math.min(minY, s.y1, s.y2);
    maxY = Math.max(maxY, s.y1, s.y2);
  }
  return Number.isFinite(minY) ? -(minY + maxY) / 2 : 0;
}

export function drawBonsai(d: DrawCtx, segments: BonsaiSegment[], offsetY: number) {
  const { ctx, S, t, hl, xrayDim } = d;
  const n = d.reduceMotion ? segments.length : Math.ceil(segments.length * d.progress);
  const sway = (x: number, y: number) => {
    if (d.reduceMotion || d.wind <= 0) return 0;
    const height = Math.max(0, 0.5 - y); // 0 at the base, grows upward
    return Math.sin(t * 0.55 + y * 2.2 + x) * d.wind * Math.pow(height, 1.6) * 0.035;
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.globalAlpha = d.alpha * (d.reduceMotion ? d.progress : 1);

  // brush curvature: the trunk and big limbs get a pronounced S-like bend (like the
  // ink bonsai references), twigs only a slight wobble
  const curve = (s: BonsaiSegment) => {
    const x1 = (s.x1 + sway(s.x1, s.y1)) * S;
    const y1 = (s.y1 + offsetY) * S;
    const x2 = (s.x2 + sway(s.x2, s.y2)) * S;
    const y2 = (s.y2 + offsetY) * S;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const hb = hash(s.frameId) - 0.5;
    const amt = s.depth <= 1 ? (s.depth === 0 ? 1 : -1) * Math.sign(hb || 1) * (0.14 + Math.abs(hb) * 0.3) : hb * 0.2;
    const nx = -(y2 - y1) / (len || 1);
    const ny = (x2 - x1) / (len || 1);
    return { x1, y1, x2, y2, nx, ny, cx: (x1 + x2) / 2 + nx * amt * len, cy: (y1 + y2) / 2 + ny * amt * len };
  };

  const glowing: BonsaiSegment[] = [];
  for (let i = 0; i < n; i++) {
    const s = segments[i];
    const { x1, y1, x2, y2, nx, ny, cx, cy } = curve(s);
    const w = Math.max(0.6, s.width * S);

    let stroke: string = withAlpha(color.paper100, 0.86 - s.depth * 0.04);
    if (xrayDim) stroke = withAlpha(color.teal500, 0.5);
    else if (hl) {
      stroke = hl.stack.has(s.frameId) ? withAlpha(color.paper100, 0.95) : withAlpha(color.teal500, 0.55);
      if (hl.current === s.frameId) stroke = d.accent;
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
    if (s.depth < 3 && !hl && !xrayDim) {
      // dry-brush texture: a thin offset echo stroke
      ctx.strokeStyle = withAlpha(color.paper300, 0.16);
      ctx.lineWidth = w * 0.45;
      ctx.beginPath();
      ctx.moveTo(x1 + nx * w * 0.45, y1 + ny * w * 0.45);
      ctx.quadraticCurveTo(cx + nx * w * 0.5, cy + ny * w * 0.5, x2 + nx * w * 0.3, y2 + ny * w * 0.3);
      ctx.stroke();
    }
    if (s.leaf && !hl && !xrayDim) {
      // foliage dabs (soft moss)
      ctx.fillStyle = withAlpha(color.moss500, 0.24);
      for (let k = 0; k < 3; k++) {
        const a = hash(s.frameId * 7 + k) * Math.PI * 2;
        const r = S * (0.018 + hash(s.frameId * 3 + k) * 0.022);
        ctx.beginPath();
        ctx.ellipse(x2 + Math.cos(a) * r, y2 + Math.sin(a) * r * 0.6, r * 1.3, r * 0.8, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (d.glow(s.frameId) > 0.02) glowing.push(s);
    if (hl && hl.current === s.frameId) glowing.push(s);
  }

  // glows on top (only the few active segments use shadowBlur)
  for (const s of glowing) {
    const g = hl && hl.current === s.frameId ? 1 : d.glow(s.frameId);
    const { x1, y1, x2, y2, cx, cy } = curve(s);
    ctx.strokeStyle = withAlpha(d.accent, 0.9 * g);
    ctx.lineWidth = Math.max(1.4, s.width * S) + 1.5;
    if (d.quality > 0.6) {
      ctx.shadowColor = d.accent;
      ctx.shadowBlur = 12 * g;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
    if (s.leaf) {
      ctx.fillStyle = withAlpha(color.lantern200, 0.7 * g);
      ctx.beginPath();
      ctx.arc(x2, y2, 2.2 + 2 * g, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

/** Tip of a segment (for X-ray depth labels). */
export function bonsaiFramePoint(segments: BonsaiSegment[], frameId: number, offsetY: number, S: number) {
  const s = segments.find((x) => x.frameId === frameId);
  return s ? { x: s.x2 * S, y: (s.y2 + offsetY) * S } : null;
}
