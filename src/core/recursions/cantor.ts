// RAIN: Cantor set -> RHYTHM.
//
// cantor(start, length, level)
//   - recurse into the two outer parts, drop the middle (the "Silence" fraction)
//   - surviving segments at the deepest level become soft pulses; the gaps are rests
//   - level 0 is a very quiet sustained tone underneath
//   - pulses snap to a half-beat grid and merge, so density grows slowly
//     (Cantor dust on an N-slot grid has only ~N^0.63 occupied slots)
//   - the left/right path through the recursion picks the pitch; deeper = higher

import type { Grow, NoteEvent, RainBar, RainParams } from "../types";
import { clampParams } from "../params";
import { Tracer, round, toBars } from "./trace";

export const RAIN_MAX_EVENTS = 600;
export const RAIN_GRID = 0.5; // beats

export const growRain: Grow<RainParams> = (raw, rand, ctx) => {
  const p = clampParams("rain", raw);
  const L = ctx?.scaleLength ?? 5;
  const tracer = new Tracer();
  const bars: RainBar[] = [];
  const candidates: NoteEvent[] = [];
  const pulseOctave = 1 + (p.levels >= 5 ? 1 : 0);

  function cantor(start: number, length: number, level: number, rights: number, parentId: number | null) {
    const frame = tracer.enter("cantor", { start: round(start, 3), length: round(length, 3), level }, level, parentId);
    bars.push({ frameId: frame.id, start, length, level, removed: false });

    if (level >= p.levels) {
      // Base case: a surviving segment -> one soft pulse.
      const degree = (rights * 2) % L;
      frame.note = { degree, octave: pulseOctave };
      const center = start + length / 2;
      candidates.push({
        time: start * p.phraseBeats,
        degree,
        octave: pulseOctave,
        dur: Math.max(0.5, round(length * p.phraseBeats, 2)),
        vel: round(0.32 + rand() * 0.14, 3),
        depth: level,
        frameId: frame.id,
        pos: { x: round(center * 2 - 1, 3), y: round(level / p.levels, 3) },
        pan: round((center * 2 - 1) * 0.6, 2),
        role: "pulse",
      });
    } else {
      const outer = (length * (1 - p.removed)) / 2;
      const mid = length * p.removed;
      bars.push({ frameId: frame.id, start: start + outer, length: mid, level: level + 1, removed: true });
      cantor(start, outer, level + 1, rights, frame.id);
      cantor(start + outer + mid, outer, level + 1, rights + 1, frame.id);
    }
    tracer.exit(frame);
  }

  cantor(0, 1, 0, 0, null);

  // Level 0: a very quiet sustained tone on the tonic.
  const root = tracer.frames[0];
  root.note = { degree: 0, octave: 0 };
  const events: NoteEvent[] = [
    {
      time: 0,
      degree: 0,
      octave: 0,
      dur: p.phraseBeats,
      vel: 0.12,
      depth: 0,
      frameId: root.id,
      pos: { x: 0, y: 0 },
      pan: 0,
      role: "drone",
    },
  ];

  // Snap pulses to the grid; first segment in a slot wins (merging Cantor dust).
  const taken = new Set<number>();
  for (const e of candidates) {
    const slot = Math.round(e.time / RAIN_GRID);
    if (taken.has(slot)) continue;
    taken.add(slot);
    if (events.length >= RAIN_MAX_EVENTS) break;
    events.push({ ...e, time: slot * RAIN_GRID });
  }

  return {
    events,
    trace: tracer.frames,
    lengthBeats: toBars(p.phraseBeats + 2),
    geometry: { kind: "rain", bars },
  };
};
