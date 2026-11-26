// Small helper that records recursive calls as Frames with enter/exit ticks.

import type { Frame } from "../types";

export class Tracer {
  readonly frames: Frame[] = [];
  private tick = 0;

  enter(fn: string, args: Record<string, number>, depth: number, parentId: number | null): Frame {
    const frame: Frame = {
      id: this.frames.length,
      parentId,
      fn,
      args,
      depth,
      enterIndex: this.tick++,
      exitIndex: -1,
    };
    this.frames.push(frame);
    return frame;
  }

  exit(frame: Frame): number {
    frame.exitIndex = this.tick++;
    return frame.exitIndex;
  }

  get count(): number {
    return this.frames.length;
  }
}

export const round = (v: number, places = 2) => {
  const f = Math.pow(10, places);
  return Math.round(v * f) / f;
};

/** Round a beat value up to a whole number of 4-beat bars. */
export const toBars = (beats: number) => Math.max(4, Math.ceil(beats / 4) * 4);
