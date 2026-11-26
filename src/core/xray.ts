// X-ray mode logic: step through a recorded call trace one push/pop at a time.

import type { Frame } from "./types";

export interface Step {
  tick: number;
  frameId: number;
  type: "enter" | "exit";
}

/** One step per tick: every call contributes an enter step and an exit step. */
export function buildSteps(trace: Frame[]): Step[] {
  const steps: Step[] = new Array(trace.length * 2);
  for (const f of trace) {
    steps[f.enterIndex] = { tick: f.enterIndex, frameId: f.id, type: "enter" };
    steps[f.exitIndex] = { tick: f.exitIndex, frameId: f.id, type: "exit" };
  }
  return steps;
}

/** The call stack at a tick, bottom (root) first. At an exit tick the returning frame is still shown on top. */
export function stackAt(trace: Frame[], steps: Step[], tick: number): Frame[] {
  const step = steps[Math.max(0, Math.min(steps.length - 1, tick))];
  if (!step) return [];
  const out: Frame[] = [];
  let f: Frame | undefined = trace[step.frameId];
  while (f) {
    out.push(f);
    f = f.parentId === null ? undefined : trace[f.parentId];
  }
  return out.reverse();
}

const ARG_KEYS: Record<string, string[]> = {
  branch: ["depth", "angle", "length"],
  cantor: ["level", "start", "length"],
  sierpinski: ["level", "corner"],
  fib: ["n"],
};

export function describeFrame(f: Frame): string {
  const keys = ARG_KEYS[f.fn] ?? Object.keys(f.args);
  const args = keys
    .filter((k) => f.args[k] !== undefined)
    .map((k) => `${k}=${f.args[k]}`)
    .join(", ");
  return `${f.fn}(${args})`;
}

export function describeStep(step: Step, f: Frame): string {
  if (step.type === "enter") {
    if (f.memoHit) return `call ${describeFrame(f)}: memo hit`;
    return `call ${describeFrame(f)}`;
  }
  const value = f.args.value;
  if (f.fn === "fib") return `return ${describeFrame(f)} = ${value ?? "?"}${f.memoHit ? " (from memo)" : ""}`;
  return `return from ${describeFrame(f)}`;
}

/** Tick at which a frame was entered (used to open X-ray at "the note you just heard"). */
export function stepForFrame(trace: Frame[], frameId: number | undefined): number {
  if (frameId === undefined || !trace[frameId]) return 0;
  return trace[frameId].enterIndex;
}

/**
 * Tidy call-tree layout in 0..1: leaves are spread left to right in call order,
 * parents sit centred over their children, y = depth.
 */
export function treeLayout(trace: Frame[]): { x: number; y: number }[] {
  const children = new Map<number, number[]>();
  for (const f of trace) {
    if (f.parentId === null) continue;
    const list = children.get(f.parentId) ?? [];
    list.push(f.id);
    children.set(f.parentId, list);
  }
  const pos: { x: number; y: number }[] = trace.map(() => ({ x: 0, y: 0 }));
  let leafCount = 0;
  const maxDepth = Math.max(1, ...trace.map((f) => f.depth));
  function place(id: number): number {
    const kids = children.get(id) ?? [];
    let x: number;
    if (kids.length === 0) x = leafCount++;
    else {
      const xs = kids.map(place);
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    pos[id] = { x, y: trace[id].depth / maxDepth };
    return x;
  }
  if (trace.length) place(0);
  const span = Math.max(1, leafCount - 1);
  return pos.map((p) => ({ x: leafCount <= 1 ? 0.5 : p.x / span, y: p.y }));
}
