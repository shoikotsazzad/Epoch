// STONES: Sierpinski triangle -> HARMONY (a three-voice canon).
//
// sierpinski(triangle, level, path)
//   - each call splits a triangle into its three corner triangles
//   - the three corners of the big triangle are three voices (root, fifth, octave)
//   - the order of subdivision (which corner at each level) is the melodic contour:
//     top corner = stay, left = up a chord step, right = down a step
//   - the line is read at level min(levels, 2) (3 or 9 notes: pads must stay sparse);
//     deeper levels add a quiet ornament on the root voice, pitched by the deepest path
//   - every voice plays the same line, delayed by the canon delay

import type { Grow, NoteEvent, StoneTriangle, StonesParams } from "../types";
import { clampParams } from "../params";
import { Tracer, round, toBars } from "./trace";

export const STONES_MAX_EVENTS = 600;

/** Voicings as (fifths, octaves) above the root, per voice. Only fifths and octaves: never muddy. */
export const VOICINGS: { name: string; voices: [number, number][] }[] = [
  { name: "Root · fifth · octave", voices: [[0, 0], [1, 0], [0, 1]] },
  { name: "Wide", voices: [[0, 0], [0, 1], [1, 1]] },
  { name: "Low", voices: [[0, -1], [0, 0], [1, 0]] },
];

const CONTOUR = [0, 2, -1]; // per corner: top, left, right
const NOTE_BEATS = 2;

type P = { x: number; y: number };
const midpoint = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export const growStones: Grow<StonesParams> = (raw, rand, ctx) => {
  const p = clampParams("stones", raw);
  const L = ctx?.scaleLength ?? 5;
  const fifthDeg = L === 5 ? 3 : 4; // index of the perfect fifth in our pentatonic / heptatonic scales
  const tracer = new Tracer();
  const triangles: StoneTriangle[] = [];
  const lineLevel = Math.min(p.levels, 2);
  const line: { frameId: number; degree: number; centroid: P; ornament: number | null }[] = [];

  const top: P = { x: 0, y: -0.85 };
  const left: P = { x: -0.86, y: 0.65 };
  const right: P = { x: 0.86, y: 0.65 };

  function sierpinski(a: P, b: P, c: P, level: number, contour: number, corner: number, parentId: number | null): number {
    const frame = tracer.enter("sierpinski", { level, corner, contour }, level, parentId);
    triangles.push({ frameId: frame.id, ax: a.x, ay: a.y, bx: b.x, by: b.y, cx: c.x, cy: c.y, level, corner });
    frame.note = { degree: contour, octave: 0 };

    let lineIndex = -1;
    if (level === lineLevel) {
      lineIndex = line.length;
      line.push({
        frameId: frame.id,
        degree: contour,
        centroid: { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 },
        ornament: null,
      });
    }

    let deepest = contour;
    if (level < p.levels) {
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      // Corner 0 (top), 1 (left), 2 (right): the order of subdivision.
      const kids: [P, P, P][] = [
        [a, ab, ca],
        [ab, b, bc],
        [ca, bc, c],
      ];
      // A seeded corner chain is followed down to the deepest level for the ornament pitch.
      const follow = Math.floor(rand() * 3);
      for (let k = 0; k < 3; k++) {
        const d = sierpinski(kids[k][0], kids[k][1], kids[k][2], level + 1, contour + CONTOUR[k], k, frame.id);
        if (k === follow) deepest = d;
      }
    }
    if (lineIndex >= 0 && p.levels > lineLevel) {
      // Ornament from the deepest level, folded back near the line note.
      const delta = ((deepest - contour) % 3 + 3) % 3;
      line[lineIndex].ornament = delta === 0 ? null : contour + (delta === 1 ? 2 : 4);
    }
    tracer.exit(frame);
    return deepest;
  }

  sierpinski(top, left, right, 0, 0, -1, null);

  const voicing = VOICINGS[p.voicing] ?? VOICINGS[0];
  const corners = [top, left, right];
  const events: NoteEvent[] = [];

  for (let v = 0; v < 3; v++) {
    const [fifths, octaves] = voicing.voices[v];
    const offset = fifths * fifthDeg;
    for (let i = 0; i < line.length && events.length < STONES_MAX_EVENTS; i++) {
      const n = line[i];
      const time = i * NOTE_BEATS + v * p.canonDelay;
      events.push({
        time,
        degree: n.degree + offset,
        octave: octaves,
        dur: NOTE_BEATS * 1.5,
        vel: round(v === 0 ? 0.42 : 0.34, 3),
        depth: lineLevel,
        frameId: n.frameId,
        pos: { x: round(corners[v].x, 3), y: round(corners[v].y, 3) },
        voice: v,
        pan: v === 0 ? 0 : v === 1 ? -0.5 : 0.5,
        role: "canon",
      });
      // Ornament: only on the root voice, ~half the time, so the canon stays spacious.
      if (v === 0 && n.ornament !== null && rand() < 0.5) {
        events.push({
          time: time + NOTE_BEATS * 0.75,
          degree: n.ornament,
          octave: 1,
          dur: NOTE_BEATS,
          vel: 0.18,
          depth: p.levels,
          frameId: n.frameId,
          pos: { x: round(n.centroid.x, 3), y: round(n.centroid.y, 3) },
          voice: 0,
          pan: 0,
          role: "canon",
        });
      }
    }
  }

  const lineBeats = line.length * NOTE_BEATS;
  return {
    events,
    trace: tracer.frames,
    lengthBeats: toBars(lineBeats + 2 * p.canonDelay + NOTE_BEATS * 2),
    geometry: { kind: "stones", triangles, corners },
  };
};
