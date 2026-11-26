// Offline export: re-create the SAME engine and the SAME seeded garden inside
// Tone.Offline and render N minutes faster than real time.

import type { GardenState } from "@/core/types";
import { GrowCache } from "@/core/growCache";
import { PRESETS } from "@/core/presets";
import { SCALES } from "@/core/scales";
import { SOUND, buildEngine, type ToneLib } from "./engine";
import { Scheduler } from "./scheduler";

export const EXPORT_FADE_OUT = 4;
const EXPORT_FADE_IN = 3;

/**
 * Render the garden. Progress goes 0 -> 0.85 while the clock is scheduled
 * (that part reports progress), the last 15% is the browser's final render pass.
 */
export async function renderGarden(
  T: ToneLib,
  state: GardenState,
  seconds: number,
  onProgress: (p: number) => void,
): Promise<AudioBuffer> {
  const grows = new GrowCache().growsFor(state);
  const sampleRate = T.getContext().sampleRate;
  let timer: ReturnType<typeof setInterval> | undefined;
  try {
    const buffer = await T.Offline(
      async (ctx) => {
        const engine = buildEngine(T, {
          root: state.root,
          scale: state.scale,
          reverb: state.reverb,
          drone: state.drone,
          master: 0.8,
        });
        // the reverb impulse is generated asynchronously: wait before scheduling
        await engine.ready;
        const transport = T.getTransport();
        transport.bpm.value = state.bpm;
        const scale = SCALES[state.scale];
        const scheduler = new Scheduler(
          T,
          engine,
          () => ({ scale, root: state.root }),
          () => state.seed,
        );
        scheduler.sync(state, grows, { fadeIn: false });

        const level = T.dbToGain(SOUND.masterDb);
        const g = engine.master.gain;
        g.setValueAtTime(0, 0);
        g.linearRampToValueAtTime(level, EXPORT_FADE_IN);
        g.setValueAtTime(level, Math.max(EXPORT_FADE_IN, seconds - EXPORT_FADE_OUT));
        g.linearRampToValueAtTime(0, seconds - 0.05);

        const bpmEnd = PRESETS[state.preset].bpmEnd;
        if (bpmEnd) transport.bpm.linearRampTo(bpmEnd, seconds);
        transport.start(0);

        timer = setInterval(() => onProgress(Math.min(0.85, (ctx.currentTime / seconds) * 0.85)), 150);
      },
      seconds,
      2,
      sampleRate,
    );
    onProgress(1);
    return buffer.get() as AudioBuffer;
  } finally {
    if (timer) clearInterval(timer);
  }
}
