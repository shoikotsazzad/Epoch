// Slow drifting motes (petals / dust), ripples, falling drops, film grain and vignette.

import { color, withAlpha } from "./tokens";

export interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
}

export function makeMotes(n: number, w: number, h: number): Mote[] {
  return Array.from({ length: n }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: 4 + Math.random() * 8,
    vy: 2 + Math.random() * 5,
    phase: i * 1.7,
    size: 1 + Math.random() * 2,
  }));
}

export function drawMotes(ctx: CanvasRenderingContext2D, motes: Mote[], dt: number, t: number, w: number, h: number, count: number) {
  ctx.save();
  for (let i = 0; i < Math.min(count, motes.length); i++) {
    const m = motes[i];
    m.x += (m.vx + Math.sin(t * 0.4 + m.phase) * 4) * dt;
    m.y += (m.vy + Math.cos(t * 0.3 + m.phase) * 2) * dt;
    if (m.x > w + 10) m.x = -10;
    if (m.y > h + 10) m.y = -10;
    ctx.fillStyle = withAlpha(color.paper300, 0.14 + 0.1 * Math.sin(t * 0.5 + m.phase) ** 2);
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.size * 1.6, m.size * 0.8, t * 0.2 + m.phase, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export interface Ripple {
  x: number;
  y: number;
  r0: number;
  t0: number;
  strength: number;
  speed: number;
  life: number;
}

export function drawRipples(ctx: CanvasRenderingContext2D, ripples: Ripple[], t: number): Ripple[] {
  const alive: Ripple[] = [];
  ctx.save();
  for (const r of ripples) {
    const age = t - r.t0;
    if (age > r.life) continue;
    alive.push(r);
    const k = age / r.life;
    const radius = r.r0 + age * r.speed;
    ctx.strokeStyle = withAlpha(color.sea300, 0.24 * r.strength * (1 - k) * (1 - k));
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, radius, radius * 0.97, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  return alive;
}

export interface Drop {
  x: number;
  y0: number;
  y1: number;
  t0: number;
  dur: number;
}

export function makeGrain(size = 128): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 135;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v * 0.97;
    img.data[i + 3] = Math.random() * 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function makeVignette(w: number, h: number, dpr: number, ground: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.58);
  g.addColorStop(0, withAlpha(ground, 0));
  g.addColorStop(0.55, withAlpha(ground, 0.15));
  g.addColorStop(1, withAlpha(ground, 0.85));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return c;
}
