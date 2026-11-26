"use client";

// TEMPORARY debug view: proves the four pure recursions by drawing their raw
// geometry plus a "piano roll" of the note events they emit. No audio, no styling.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { growPlant } from "@/core/recursions";
import { makePlant } from "@/core/presets";
import { PARAM_SPECS, PLANT_LABELS, PLANT_RECURSION, defaultParams } from "@/core/params";
import { SCALES, quantize, midiToName } from "@/core/scales";
import type { GrowResult, PlantKind, ScaleId } from "@/core/types";
import { PLANT_KINDS } from "@/core/types";

const W = 320;
const H = 320;
const ROLL_H = 110;

function drawGeometry(ctx: CanvasRenderingContext2D, r: GrowResult) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  const s = W * 0.45;
  ctx.strokeStyle = "#ccc";
  ctx.fillStyle = "#ccc";
  const g = r.geometry;
  if (g.kind === "bonsai") {
    for (const seg of g.segments) {
      ctx.lineWidth = Math.max(0.5, seg.width * s);
      ctx.strokeStyle = seg.leaf ? "#8a8" : "#ccc";
      ctx.beginPath();
      ctx.moveTo(seg.x1 * s, seg.y1 * s);
      ctx.lineTo(seg.x2 * s, seg.y2 * s);
      ctx.stroke();
    }
  } else if (g.kind === "rain") {
    const levels = Math.max(...g.bars.map((b) => b.level));
    const rowH = (2 * s) / (levels + 1);
    for (const b of g.bars) {
      ctx.fillStyle = b.removed ? "#444" : "#ccc";
      ctx.fillRect(-s + b.start * 2 * s, -s + b.level * rowH, Math.max(1, b.length * 2 * s), rowH * 0.6);
    }
  } else if (g.kind === "stones") {
    const maxLevel = Math.max(...g.triangles.map((t) => t.level));
    for (const t of g.triangles) {
      if (t.level !== maxLevel) continue;
      ctx.beginPath();
      ctx.moveTo(t.ax * s, t.ay * s);
      ctx.lineTo(t.bx * s, t.by * s);
      ctx.lineTo(t.cx * s, t.cy * s);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = "#e8aa62";
    for (const c of g.corners) {
      ctx.beginPath();
      ctx.arc(c.x * s, c.y * s, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (g.kind === "sunflower") {
    for (const seed of g.seeds) {
      ctx.fillStyle = seed.frameId !== undefined ? "#e8aa62" : "#777";
      ctx.beginPath();
      ctx.arc(seed.x * s, seed.y * s, seed.frameId !== undefined ? 4 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRoll(ctx: CanvasRenderingContext2D, r: GrowResult, scale: readonly number[], root: number) {
  ctx.clearRect(0, 0, W, ROLL_H);
  ctx.strokeStyle = "#333";
  for (let b = 0; b <= r.lengthBeats; b += 4) {
    const x = (b / r.lengthBeats) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ROLL_H);
    ctx.stroke();
  }
  const midis = r.events.map((e) => quantize(e.degree, e.octave, scale, root));
  const lo = Math.min(...midis) - 2;
  const hi = Math.max(...midis) + 2;
  r.events.forEach((e, i) => {
    const x = (e.time / r.lengthBeats) * W;
    const w = Math.max(2, (e.dur / r.lengthBeats) * W);
    const y = ROLL_H - ((midis[i] - lo) / (hi - lo)) * ROLL_H;
    ctx.fillStyle = e.voice === 1 ? "#8ab" : e.voice === 2 ? "#b8a" : e.role === "pop" ? "#e8aa62" : "#ccc";
    ctx.globalAlpha = 0.35 + e.vel * 0.65;
    ctx.fillRect(x, y - 2, w, 3);
  });
  ctx.globalAlpha = 1;
}

function PlantCard({ kind, seed, scaleId }: { kind: PlantKind; seed: number; scaleId: ScaleId }) {
  const [params, setParams] = useState<Record<string, number>>(() => ({ ...(defaultParams(kind) as unknown as Record<string, number>) }));
  const geoRef = useRef<HTMLCanvasElement>(null);
  const rollRef = useRef<HTMLCanvasElement>(null);
  const scale = SCALES[scaleId];
  const root = 50;

  const result = useMemo(() => {
    const plant = makePlant(kind, 0.5, 0.5, params as never, "debug");
    return growPlant(plant, seed, scale.length);
  }, [kind, params, seed, scale.length]);

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    for (const [ref, h] of [
      [geoRef, H],
      [rollRef, ROLL_H],
    ] as const) {
      const c = ref.current;
      if (!c) continue;
      c.width = W * dpr;
      c.height = h * dpr;
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    drawGeometry(geoRef.current!.getContext("2d")!, result);
    drawRoll(rollRef.current!.getContext("2d")!, result, scale, root);
  }, [result, scale]);

  const memoHits = result.trace.filter((f) => f.memoHit).length;
  const maxDepth = Math.max(...result.trace.map((f) => f.depth));
  const first = result.events
    .slice()
    .sort((a, b) => a.time - b.time)
    .slice(0, 8)
    .map((e) => midiToName(quantize(e.degree, e.octave, scale, root)))
    .join(" ");

  return (
    <section style={{ border: "1px solid #333", padding: 12, width: W + 24 }}>
      <h2 style={{ margin: "0 0 4px" }}>
        {PLANT_LABELS[kind]}: {PLANT_RECURSION[kind]}
      </h2>
      <canvas ref={geoRef} style={{ width: W, height: H, display: "block", background: "#111" }} aria-label={`${kind} geometry`} />
      <canvas ref={rollRef} style={{ width: W, height: ROLL_H, display: "block", background: "#0a0a0a", marginTop: 4 }} aria-label={`${kind} note events`} />
      <p style={{ fontFamily: "monospace", fontSize: 12, margin: "6px 0" }}>
        calls {result.trace.length} · max depth {maxDepth} · events {result.events.length} · {result.lengthBeats} beats
        {kind === "sunflower" ? ` · memo hits ${memoHits} · fib = ${result.trace[0].args.value}` : ""}
        <br />
        first notes: {first}
      </p>
      {PARAM_SPECS[kind].map((s) => (
        <label key={s.key} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "center" }}>
          <span style={{ width: 90 }}>{s.label}</span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={params[s.key]}
            onChange={(e) => setParams((p) => ({ ...p, [s.key]: Number(e.target.value) }))}
          />
          <span style={{ fontFamily: "monospace" }}>{Number(params[s.key]).toFixed(s.integer ? 0 : 2)}</span>
        </label>
      ))}
    </section>
  );
}

export default function DebugView() {
  const [seed, setSeed] = useState(4821);
  const [scaleId, setScaleId] = useState<ScaleId>("majorPentatonic");
  return (
    <main style={{ padding: 16, fontFamily: "system-ui", color: "#ddd", background: "#000", minHeight: "100vh" }}>
      <h1 style={{ marginTop: 0 }}>Recursion debug (?debug=1)</h1>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}>
        <label>
          Seed{" "}
          <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} style={{ width: 90 }} />
        </label>
        <button onClick={() => setSeed(1000 + Math.floor(Math.random() * 9000))}>Random seed</button>
        <label>
          Scale{" "}
          <select value={scaleId} onChange={(e) => setScaleId(e.target.value as ScaleId)}>
            {Object.keys(SCALES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <Link href="/" style={{ color: "#9ebdbb" }}>
          ← back
        </Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {PLANT_KINDS.map((k) => (
          <PlantCard key={k} kind={k} seed={seed} scaleId={scaleId} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: "#888" }}>
        Piano roll: x = time (bar lines every 4 beats), y = pitch after quantizing to the scale. Stones voices: white = root, blue =
        fifth, pink = octave. Amber in Bonsai = pop (release) cadences.
      </p>
    </main>
  );
}
