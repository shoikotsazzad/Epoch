// SUNFLOWER: recursive, memoized Fibonacci -> SPARKLE.
//
// fib(k) = fib(k-1) + fib(k-2), with a memo table, fully traced.
//   - the order in which calls FINISH drives time
//   - each computed fib(k) -> scale degree fib(k) mod scaleLength, a high bell (probability = density)
//   - memo hits are recorded (X-ray shows the pruned branches) and ring as a softer echo
//   - seeds sit on the golden-angle spiral: angle = i * 137.508°, radius = c * sqrt(i);
//     the seed at index fib(k) (mod seed count) lights up when fib(k) finishes

import type { Grow, NoteEvent, SunflowerParams, SunflowerSeed } from "../types";
import { clampParams } from "../params";
import { Tracer, round, toBars } from "./trace";

export const GOLDEN_ANGLE_DEG = 137.508;
export const SUNFLOWER_MAX_EVENTS = 600;
const STEP_BEATS = 1;

export function seedPosition(i: number, count: number): { x: number; y: number } {
  const a = (i * GOLDEN_ANGLE_DEG * Math.PI) / 180;
  const r = Math.sqrt(i) / Math.sqrt(Math.max(1, count - 1));
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

export const growSunflower: Grow<SunflowerParams> = (raw, rand, ctx) => {
  const p = clampParams("sunflower", raw);
  const L = ctx?.scaleLength ?? 5;
  const tracer = new Tracer();
  const memo = new Map<number, number>();
  const events: NoteEvent[] = [];
  const seeds: SunflowerSeed[] = [];
  for (let i = 0; i < p.seeds; i++) seeds.push({ index: i, ...seedPosition(i, p.seeds) });
  let finished = 0; // completion order

  function ring(value: number, k: number, frameId: number, depth: number, hit: boolean) {
    const seedIndex = value % p.seeds;
    const seed = seeds[seedIndex];
    if (!hit && seed.frameId === undefined) {
      seed.frameId = frameId;
      seed.k = k;
    }
    const time = finished * STEP_BEATS;
    finished++;
    if (rand() >= p.density || events.length >= SUNFLOWER_MAX_EVENTS) return;
    events.push({
      time,
      degree: value % L,
      octave: hit ? 3 : 2,
      dur: hit ? 1 : 2,
      vel: hit ? 0.16 : round(0.3 + rand() * 0.1, 3),
      depth,
      frameId,
      pos: { x: round(seed.x, 3), y: round(seed.y, 3) },
      pan: round(seed.x * 0.7, 2),
      role: hit ? "echo" : "spark",
    });
  }

  function fib(k: number, depth: number, parentId: number | null): number {
    const frame = tracer.enter("fib", { n: k }, depth, parentId);
    const cached = memo.get(k);
    if (cached !== undefined) {
      frame.memoHit = true;
      frame.note = { degree: cached % L, octave: 3 };
      tracer.exit(frame);
      ring(cached, k, frame.id, depth, true);
      return cached;
    }
    const value = k < 2 ? k : fib(k - 1, depth + 1, frame.id) + fib(k - 2, depth + 1, frame.id);
    memo.set(k, value);
    frame.args.value = value;
    frame.note = { degree: value % L, octave: 2 };
    tracer.exit(frame);
    ring(value, k, frame.id, depth, false);
    return value;
  }

  fib(p.n, 0, null);

  return {
    events,
    trace: tracer.frames,
    lengthBeats: toBars(finished * STEP_BEATS + 4),
    geometry: { kind: "sunflower", seeds },
  };
};
