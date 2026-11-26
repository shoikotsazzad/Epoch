// The garden renderer: ONE requestAnimationFrame loop, devicePixelRatio-aware.
// Lives outside React. React never re-renders per frame or per note.

import type { GardenState, GrowResult, NoteEvent, Plant } from "@/core/types";
import type { GrowEntry } from "@/core/growCache";
import { PRESETS } from "@/core/presets";
import { color, paletteVariants, withAlpha, type PaletteName } from "./tokens";
import { glowEnvelope, plantScale, ringRadius } from "./layout";
import { drawSand, type SandZone } from "./sand";
import { drawMotes, drawRipples, makeGrain, makeMotes, makeVignette, type Drop, type Mote, type Ripple } from "./particles";
import type { DrawCtx, Highlight } from "./plants/types";
import { bonsaiCenterOffset, bonsaiFramePoint, drawBonsai } from "./plants/bonsai";
import { RAIN_GROUND, drawRain, rainBarPoint } from "./plants/rain";
import { drawStones, stonePoints, stonesFramePoint, voiceKey, type StonePoints } from "./plants/stones";
import { drawSunflower, sunflowerFrameSeeds } from "./plants/sunflower";

interface RPlant {
  plant: Plant;
  grow: GrowResult;
  key: string;
  bornAt: number | null;
  removedAt: number | null;
  bonsaiOffset: number;
  stonePts: StonePoints | null;
  frameSeeds: Map<number, number> | null;
  seedByPos: Map<string, number> | null;
  rainLevels: number;
}

export interface XrayView {
  plantId: string;
  hl: Highlight;
  label: string;
}

const GROW_SECONDS = { bonsai: 9, rain: 4, stones: 5, sunflower: 6 } as const;
const MAX_RIPPLES = 40;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private plants = new Map<string, RPlant>();
  private glows = new Map<string, Map<number, number>>();
  private ripples: Ripple[] = [];
  private drops: (Drop & { strength: number })[] = [];
  private motes: Mote[] = [];
  private sand = typeof document !== "undefined" ? document.createElement("canvas") : (null as unknown as HTMLCanvasElement);
  private sandKey = "";
  private grain: HTMLCanvasElement | null = null;
  private vignette: HTMLCanvasElement | null = null;
  private vignetteKey = "";
  private raf = 0;
  private last = 0;
  private frameEma = 16;
  private quality = 1;
  private ro: ResizeObserver | null = null;
  private started = false;

  reduceMotion = false;
  selectedId: string | null = null;
  xray: XrayView | null = null;
  palette: PaletteName = "night";

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.grain = makeGrain();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.raf = requestAnimationFrame(this.loop);
  }

  private now() {
    return performance.now() / 1000;
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.sandKey = "";
    this.vignetteKey = "";
    this.motes = makeMotes(30, this.w, this.h);
  }

  setGarden(state: GardenState, grows: Map<string, GrowEntry>) {
    const t = this.now();
    this.palette = PRESETS[state.preset].palette;
    const ids = new Set(state.plants.map((p) => p.id));
    for (const p of state.plants) {
      const g = grows.get(p.id);
      if (!g) continue;
      const existing = this.plants.get(p.id);
      if (existing && existing.removedAt === null) {
        existing.plant = p;
        if (existing.key !== g.key) this.attachGrow(existing, g);
      } else {
        const rp: RPlant = {
          plant: p,
          grow: g.result,
          key: g.key,
          bornAt: this.started ? t : null,
          removedAt: null,
          bonsaiOffset: 0,
          stonePts: null,
          frameSeeds: null,
          seedByPos: null,
          rainLevels: 1,
        };
        this.attachGrow(rp, g);
        this.plants.set(p.id, rp);
      }
    }
    for (const [id, rp] of this.plants) if (!ids.has(id) && rp.removedAt === null) rp.removedAt = t;
    this.sandKey = "";
  }

  private attachGrow(rp: RPlant, g: GrowEntry) {
    rp.grow = g.result;
    rp.key = g.key;
    const geo = g.result.geometry;
    if (geo.kind === "bonsai") rp.bonsaiOffset = bonsaiCenterOffset(geo.segments);
    if (geo.kind === "stones") rp.stonePts = stonePoints(geo.triangles);
    if (geo.kind === "rain") rp.rainLevels = Math.max(1, ...geo.bars.map((b) => b.level));
    if (geo.kind === "sunflower") {
      rp.frameSeeds = sunflowerFrameSeeds(g.result.trace, geo.seeds.length);
      rp.seedByPos = new Map(geo.seeds.map((s, i) => [`${(Math.round(s.x * 1000) / 1000).toFixed(3)},${(Math.round(s.y * 1000) / 1000).toFixed(3)}`, i]));
    }
  }

  /** Begin pressed: plants already in the garden grow in, one after another. */
  bloom() {
    this.started = true;
    let i = 0;
    const t = this.now();
    for (const rp of this.plants.values()) if (rp.bornAt === null) rp.bornAt = t + 0.4 + i++ * 1.2;
  }

  /** A note was heard: light its recursion and ripple the sand (scheduled via Tone.Draw). */
  onNote(plantId: string, e: NoteEvent) {
    const rp = this.plants.get(plantId);
    if (!rp) return;
    const t = this.now();
    let map = this.glows.get(plantId);
    if (!map) this.glows.set(plantId, (map = new Map()));
    const geo = rp.grow.geometry;
    if (geo.kind === "stones") {
      map.set(voiceKey(e.voice ?? 0), t);
      map.set(e.frameId, t);
    } else if (geo.kind === "sunflower" && e.pos && rp.seedByPos) {
      const idx = rp.seedByPos.get(`${e.pos.x.toFixed(3)},${e.pos.y.toFixed(3)}`);
      if (idx !== undefined) map.set(idx, t);
    } else map.set(e.frameId, t);

    if (this.reduceMotion || e.role === "drone") return;
    const cx = rp.plant.x * this.w;
    const cy = rp.plant.y * this.h;
    const S = plantScale(rp.plant.kind, this.w, this.h);
    if (geo.kind === "rain") {
      const bar = geo.bars.find((b) => b.frameId === e.frameId && !b.removed);
      if (bar) {
        const p = rainBarPoint(bar, rp.rainLevels, S);
        this.drops.push({ x: cx + p.x, y0: cy + p.y, y1: cy + RAIN_GROUND * S, t0: t, dur: 0.9, strength: e.vel });
      }
      return;
    }
    if (this.ripples.length < MAX_RIPPLES)
      this.ripples.push({
        x: cx,
        y: cy,
        r0: ringRadius(rp.plant.kind, this.w, this.h),
        t0: t,
        strength: Math.min(1, 0.4 + e.vel * 1.4),
        speed: 38,
        life: 1.9,
      });
  }

  private glowFor(plantId: string, t: number) {
    const map = this.glows.get(plantId);
    return (key: number) => {
      const t0 = map?.get(key);
      return t0 === undefined ? 0 : glowEnvelope(t - t0);
    };
  }

  private ensureLayers() {
    const zones: SandZone[] = [];
    for (const rp of this.plants.values()) {
      if (rp.removedAt !== null) continue;
      zones.push({ x: rp.plant.x * this.w, y: rp.plant.y * this.h, r: ringRadius(rp.plant.kind, this.w, this.h) });
    }
    const pal = paletteVariants[this.palette];
    const key = `${this.w}x${this.h}@${this.dpr}|${pal.sand}|${zones.map((z) => `${z.x.toFixed(0)},${z.y.toFixed(0)},${z.r.toFixed(0)}`).join(";")}`;
    if (key !== this.sandKey) {
      drawSand(this.sand, this.w, this.h, this.dpr, zones, pal.sand);
      this.sandKey = key;
    }
    const vk = `${this.w}x${this.h}@${this.dpr}|${pal.ground}`;
    if (vk !== this.vignetteKey) {
      this.vignette = makeVignette(this.w, this.h, this.dpr, pal.ground);
      this.vignetteKey = vk;
    }
  }

  private loop = (ts: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (document.hidden) {
      this.last = ts;
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (ts - (this.last || ts)) / 1000));
    this.last = ts;
    this.frameEma = this.frameEma * 0.95 + dt * 1000 * 0.05;
    if (this.frameEma > 26) this.quality = 0.5;
    else if (this.frameEma < 18) this.quality = 1;
    this.draw(ts / 1000, dt);
  };

  private draw(t: number, dt: number) {
    const { ctx, w, h } = this;
    const pal = paletteVariants[this.palette];
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, 0, w, h);
    this.ensureLayers();
    ctx.drawImage(this.sand, 0, 0, w, h);

    if (!this.reduceMotion) {
      this.ripples = drawRipples(ctx, this.ripples, t);
      this.drawDrops(t);
    }

    if (this.xray) {
      ctx.fillStyle = withAlpha(color.pond700, 0.5);
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = withAlpha(color.ink950, 0.35);
      ctx.fillRect(0, 0, w, h);
    }

    const list = [...this.plants.values()].sort((a, b) => a.plant.y - b.plant.y);
    for (const rp of list) {
      if (rp.removedAt !== null && t - rp.removedAt > 3) {
        this.plants.delete(rp.plant.id);
        this.glows.delete(rp.plant.id);
        continue;
      }
      this.drawPlant(rp, t);
    }

    if (!this.reduceMotion && !this.xray) drawMotes(ctx, this.motes, dt, t, w, h, Math.round(22 * this.quality));

    // film grain
    if (this.grain) {
      const pattern = ctx.createPattern(this.grain, "repeat");
      if (pattern) {
        const ox = this.reduceMotion ? 0 : Math.floor(Math.random() * 128);
        const oy = this.reduceMotion ? 0 : Math.floor(Math.random() * 128);
        ctx.save();
        ctx.globalAlpha = 0.045;
        ctx.translate(-ox, -oy);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w + 128, h + 128);
        ctx.restore();
      }
    }
    if (this.vignette) ctx.drawImage(this.vignette, 0, 0, w, h);
    if (this.xray) this.drawXrayLabel();
  }

  private drawDrops(t: number) {
    const ctx = this.ctx;
    const alive: typeof this.drops = [];
    for (const d of this.drops) {
      const k = (t - d.t0) / d.dur;
      if (k >= 1) {
        if (this.ripples.length < MAX_RIPPLES)
          this.ripples.push({ x: d.x, y: d.y1, r0: 2, t0: t, strength: Math.min(1, 0.5 + d.strength), speed: 26, life: 1.5 });
        continue;
      }
      alive.push(d);
      const y = d.y0 + (d.y1 - d.y0) * k * k; // gentle acceleration
      ctx.fillStyle = withAlpha(color.paper100, 0.55 * (1 - k * 0.4));
      ctx.beginPath();
      ctx.ellipse(d.x, y, 1.4, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    this.drops = alive;
  }

  private drawPlant(rp: RPlant, t: number) {
    if (rp.bornAt === null || t < rp.bornAt) return;
    const { ctx, w, h } = this;
    const p = rp.plant;
    const cx = p.x * w;
    const cy = p.y * h;
    const S = plantScale(p.kind, w, h);
    const progress = Math.min(1, (t - rp.bornAt) / GROW_SECONDS[p.kind]);
    let alpha = p.muted ? 0.4 : 1;
    if (rp.removedAt !== null) alpha *= Math.max(0, 1 - (t - rp.removedAt) / 3);
    const isXray = this.xray?.plantId === p.id;
    const d: DrawCtx = {
      ctx,
      S,
      t,
      progress,
      alpha,
      glow: this.glowFor(p.id, t),
      wind: p.kind === "bonsai" ? (p.params as { wind: number }).wind : 0,
      reduceMotion: this.reduceMotion,
      quality: this.quality,
      accent: paletteVariants[this.palette].accent,
      hl: isXray ? this.xray!.hl : null,
      xrayDim: !!this.xray && !isXray,
    };
    ctx.save();
    ctx.translate(cx, cy);
    const geo = rp.grow.geometry;
    if (geo.kind === "bonsai") drawBonsai(d, geo.segments, rp.bonsaiOffset);
    else if (geo.kind === "rain") drawRain(d, geo.bars);
    else if (geo.kind === "stones" && rp.stonePts) drawStones(d, geo.triangles, geo.corners, rp.stonePts);
    else if (geo.kind === "sunflower" && rp.frameSeeds) drawSunflower(d, geo.seeds, rp.frameSeeds, d.glow);

    if (this.selectedId === p.id && rp.removedAt === null) {
      // selection is shown by a dashed ring (never by colour alone)
      const R = ringRadius(p.kind, w, h) * 1.06;
      ctx.setLineDash([4, 7]);
      ctx.strokeStyle = withAlpha(color.sea300, 0.65);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  /** Small depth label next to the frame being inspected in X-ray mode. */
  private drawXrayLabel() {
    const xr = this.xray;
    if (!xr) return;
    const rp = this.plants.get(xr.plantId);
    if (!rp) return;
    const { ctx, w, h } = this;
    const S = plantScale(rp.plant.kind, w, h);
    const geo = rp.grow.geometry;
    let pt: { x: number; y: number } | null = null;
    if (geo.kind === "bonsai") pt = bonsaiFramePoint(geo.segments, xr.hl.current, rp.bonsaiOffset, S);
    else if (geo.kind === "stones") pt = stonesFramePoint(geo.triangles, xr.hl.current, S);
    else if (geo.kind === "rain") {
      const bar = geo.bars.find((b) => b.frameId === xr.hl.current && !b.removed);
      if (bar) pt = rainBarPoint(bar, rp.rainLevels, S);
    } else if (geo.kind === "sunflower" && rp.frameSeeds) {
      const idx = rp.frameSeeds.get(xr.hl.current);
      if (idx !== undefined) pt = { x: geo.seeds[idx].x * S, y: geo.seeds[idx].y * S };
    }
    const x = rp.plant.x * w + (pt?.x ?? 0);
    const y = rp.plant.y * h + (pt?.y ?? -ringRadius(rp.plant.kind, w, h));
    ctx.save();
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    const text = xr.label;
    const tw = ctx.measureText(text).width;
    // keep clear of the X-ray side panel on wide screens
    const rightLimit = w >= 640 ? w - 410 : w;
    const bx = Math.min(rightLimit - tw - 24, Math.max(8, x + 12));
    const by = Math.max(8, y - 30);
    ctx.fillStyle = withAlpha(color.ink900, 0.92);
    ctx.beginPath();
    ctx.roundRect(bx, by, tw + 16, 22, 8);
    ctx.fill();
    ctx.strokeStyle = withAlpha(paletteVariants[this.palette].accent, 0.8);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color.paper100;
    ctx.fillText(text, bx + 8, by + 15);
    ctx.restore();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.plants.clear();
  }
}
