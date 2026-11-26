// BONSAI: fractal tree -> MELODY.
//
// branch(depth, angle, length, degree)
//   - every call is a note: depth sets register (trunk low, leaves high),
//     loudness (~ -3 dB per level), length (trunk long, leaves short)
//   - PUSH = tension: children move one scale step away from home
//   - siblings take different chord tones (never adjacent scale steps)
//   - POP = release: big limbs end with a cadence toward degree 0 / 4
//   - leaves (base case) ring as soft bells ~40% of the time
//   - branch angle -> pan within the plant's stereo zone

import type { BonsaiParams, BonsaiSegment, Grow, NoteEvent } from "../types";
import { clampParams } from "../params";
import { CHORD_STEPS, resolveDegree } from "../scales";
import { Tracer, round, toBars } from "./trace";

export const BONSAI_MAX_EVENTS = 600;
export const BONSAI_MAX_NODES = 520;

/** Total calls in a full tree with `b` branches and `depth` levels below the trunk. */
export function treeNodeCount(b: number, depth: number): number {
  let n = 0;
  for (let d = 0; d <= depth; d++) n += Math.pow(b, d);
  return n;
}

/** Depth actually used: reduced if the full tree would exceed the node cap (e.g. 3 branches cap at depth 5). */
export function effectiveTreeDepth(b: number, depth: number): number {
  let d = depth;
  while (d > 1 && treeNodeCount(b, d) > BONSAI_MAX_NODES) d--;
  return d;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const growBonsai: Grow<BonsaiParams> = (raw, rand, ctx) => {
  const p = clampParams("bonsai", raw);
  const L = ctx?.scaleLength ?? 5;
  const maxDepth = effectiveTreeDepth(p.branches, p.depth);
  const tracer = new Tracer();
  const events: NoteEvent[] = [];
  const segments: BonsaiSegment[] = [];
  const spreadRad = (p.spread * Math.PI) / 180;
  // Wind leans the whole tree slightly to one side (seeded), sway is animated later.
  const leanSign = rand() < 0.5 ? -1 : 1;
  const lean = leanSign * p.wind * 0.12;
  let cursor = 0; // beats

  const trunkLen = 0.42;

  function branch(depth: number, angle: number, length: number, degree: number, x: number, y: number, parentId: number | null) {
    const leaf = depth >= maxDepth;
    const octave = Math.min(2, Math.floor((depth * 2.6) / Math.max(1, maxDepth)));
    const frame = tracer.enter(
      "branch",
      { depth, angle: round((angle * 180) / Math.PI, 0), length: round(length, 2), degree },
      depth,
      parentId,
    );
    frame.note = { degree, octave };

    const x2 = x + Math.sin(angle) * length;
    const y2 = y - Math.cos(angle) * length;
    segments.push({
      frameId: frame.id,
      x1: x,
      y1: y,
      x2,
      y2,
      depth,
      width: 0.05 * Math.pow(0.62, depth) + 0.003,
      leaf,
    });

    // Loudness ~ -3 dB per level, length long at the trunk, short at the leaves.
    const vel = round(0.85 * Math.pow(0.708, depth), 3);
    const dur = Math.max(0.5, round(4 * Math.pow(0.7, depth) * 2) / 2);
    const step = Math.max(0.5, Math.round(2 * Math.pow(0.78, depth) * 2) / 2);
    // Inner calls deep in the tree are thinned so the melody stays sparse; leaves ring ~40%.
    const pSound = leaf ? 0.4 : depth <= 2 ? 1 : Math.pow(0.62, depth - 2);
    if (rand() < pSound && events.length < BONSAI_MAX_EVENTS) {
      events.push({
        time: cursor,
        degree,
        octave,
        dur,
        vel: leaf ? round(vel * 0.8, 3) : vel,
        depth,
        frameId: frame.id,
        pos: { x: round(x2, 3), y: round(y2, 3) },
        pan: round(Math.max(-1, Math.min(1, Math.sin(angle) * 1.4)), 2),
        role: leaf ? "leaf" : "push",
      });
    }
    cursor += step;

    if (!leaf) {
      // PUSH: one step away from home, then chord tones for siblings.
      const tension = mod(degree + 1, L);
      const offsets = shuffled(CHORD_STEPS, rand).slice(0, p.branches).sort((a, b) => a - b);
      let grown = 0;
      for (let i = 0; i < p.branches; i++) {
        const isLastChance = i === p.branches - 1 && grown === 0;
        if (depth >= 1 && !isLastChance && rand() < p.prune) continue;
        const t = p.branches === 1 ? 0 : i / (p.branches - 1) - 0.5; // -0.5..0.5
        const jitter = (rand() - 0.5) * spreadRad * 0.4;
        const childAngle = angle + t * 2 * spreadRad + jitter + lean;
        const childLen = length * p.decay * (0.9 + rand() * 0.2);
        branch(depth + 1, childAngle, childLen, tension + offsets[i], x2, y2, frame.id);
        grown++;
      }
      // POP: the big limbs resolve home (a cadence at the end of each phrase).
      if (depth <= 1 && events.length < BONSAI_MAX_EVENTS) {
        events.push({
          time: cursor,
          degree: resolveDegree(degree, L),
          octave,
          dur: Math.max(1, dur),
          vel: round(vel * 0.7, 3),
          depth,
          frameId: frame.id,
          pos: { x: round(x2, 3), y: round(y2, 3) },
          pan: round(Math.max(-1, Math.min(1, Math.sin(angle) * 1.4)), 2),
          role: "pop",
        });
        cursor += step;
      }
    }
    tracer.exit(frame);
  }

  // Trunk starts on the tonic, growing up from (0, 0.5) in local coords.
  branch(0, lean * 0.5, trunkLen, 0, 0, 0.5, null);

  return {
    events,
    trace: tracer.frames,
    lengthBeats: toBars(cursor + 2),
    geometry: { kind: "bonsai", segments },
  };
};
