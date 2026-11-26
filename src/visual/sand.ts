// Raked sand: parallel lines that bend around each plant and close into
// concentric rings (from the woodblock zen-garden references). Cached offscreen;
// redrawn only when the layout changes.

import { color, withAlpha } from "./tokens";

export interface SandZone {
  x: number;
  y: number;
  r: number;
}

export function drawSand(
  target: HTMLCanvasElement,
  w: number,
  h: number,
  dpr: number,
  zones: SandZone[],
  strength: number,
) {
  target.width = Math.max(1, Math.round(w * dpr));
  target.height = Math.max(1, Math.round(h * dpr));
  const ctx = target.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const spacing = w < 600 ? 10 : 12;
  const step = 7;
  const shadow = withAlpha(color.slate600, 0.5 * strength);
  const light = withAlpha(color.sea300, 0.075 * strength);

  const strokeLine = (pts: [number, number][], dy: number, style: string, width: number) => {
    if (pts.length < 2) return;
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] + dy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + dy);
    ctx.stroke();
  };

  for (let y0 = spacing / 2; y0 < h + spacing; y0 += spacing) {
    let run: [number, number][] = [];
    const runs: [number, number][][] = [];
    for (let x = -step; x <= w + step; x += step) {
      let y = y0 + Math.sin(x * 0.0055 + y0 * 0.021) * 2.2;
      let inside = false;
      for (const z of zones) {
        const dx = x - z.x;
        const dy = y - z.y;
        const d = Math.hypot(dx, dy);
        const outer = z.r * 1.75;
        if (d < z.r * 1.02) {
          inside = true;
          break;
        }
        if (d < outer) {
          // push the furrow away from the plant so lines flow around the ring zone
          const push = (outer - d) * 0.42;
          y += (dy / (d || 1)) * push;
        }
      }
      if (inside) {
        if (run.length) runs.push(run);
        run = [];
      } else run.push([x, y]);
    }
    if (run.length) runs.push(run);
    for (const r of runs) {
      strokeLine(r, 1, shadow, 1.2);
      strokeLine(r, 0, light, 1);
    }
  }

  // a few faint concentric rings per plant (bright ripples come only with notes)
  const ringShadow = withAlpha(color.slate600, 0.38 * strength);
  const ringLight = withAlpha(color.sea300, 0.05 * strength);
  for (const z of zones) {
    for (const k of [0.64, 0.76, 0.88, 1]) {
      const r = z.r * k;
      ctx.strokeStyle = ringShadow;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(z.x, z.y + 1, r, r * 0.97, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = ringLight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, r, r * 0.97, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
