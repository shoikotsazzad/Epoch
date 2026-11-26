export interface Highlight {
  stack: Set<number>; // frame ids currently on the call stack
  current: number; // frame being entered / returned
}

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  S: number; // local unit -> px
  t: number; // seconds (animation clock)
  progress: number; // 0..1 growth
  alpha: number; // overall opacity (fade in/out, mute)
  glow: (key: number) => number; // 0..1 glow for a frame id (or a voice key)
  wind: number;
  reduceMotion: boolean;
  quality: number; // 1 = full, 0.5 = degraded
  accent: string;
  hl: Highlight | null; // X-ray highlight (selected plant)
  xrayDim: boolean; // X-ray active but this plant is not the one being inspected
}
