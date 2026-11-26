// Master chain + drone. buildEngine() is used for BOTH live playback and the
// offline export render, so the exported file sounds exactly like the live garden.
//
//  plant voices ─► musicBus ─► lowpass ─► feedback delay ─┬─► dry ───────────────┐
//                  (X-ray fade)   ▲                       └─► reverbSend ─► reverb ┤
//  per-plant reverb sends ────────┼──────────────────────────────────────► reverb  │
//  drone ─► droneFilter ─► droneGain ┘ (not faded by X-ray)                         ▼
//  X-ray preview synth ───────────┘                       highpass 40 Hz ─► master ─► limiter -1 dB ─► out

import type * as ToneNS from "tone";
import { SCALES, midiToFreq } from "@/core/scales";
import type { ScaleId } from "@/core/types";

export type ToneLib = typeof ToneNS;

export interface EngineSettings {
  root: number;
  scale: ScaleId;
  reverb: number; // 0..1
  drone: number; // 0..1
  effects: number; // 0..1 sound-effect layer (wind, droplets, stone clicks)
  master: number; // 0..1 user volume
}

/** Final, by-ear settings are documented in design/DESIGN.md §10. */
export const SOUND = {
  masterDb: 2, // measured on rendered audio: peaks ~ -7 dBFS, RMS ~ -24 dBFS; the -1 dB limiter catches the rest
  lowpassHz: 2400,
  lowpassQ: 0.5,
  delayTime: "4n.", // dotted quarter
  delayFeedback: 0.34,
  delayWet: 0.18,
  reverbDecay: 6.5,
  reverbPreDelay: 0.04,
  highpassHz: 40,
  limiterDb: -1,
  droneDb: -30, // sits ~12 dB under the notes
  droneLfoHz: 0.03,
  effectsMax: 1.6, // "Sound effects" 100% = this gain on every effect (55% ≈ 0.9)
} as const;

export interface Engine {
  T: ToneLib;
  musicBus: ToneNS.Gain;
  /** Everything that should be heard (plants connect to musicBus; sends connect here). */
  reverbIn: ToneNS.Gain;
  /** Post-musicBus input (drone, X-ray preview). */
  postBus: ToneNS.Filter;
  limiter: ToneNS.Limiter;
  master: ToneNS.Gain;
  xraySynth: ToneNS.PolySynth<ToneNS.Synth>;
  ready: Promise<void>;
  /** Plant voices register their effect gain so the "Sound effects" level reaches it. Returns an unregister function. */
  registerFx(gain: ToneNS.Gain): () => void;
  apply(settings: Partial<EngineSettings>, ramp?: number): void;
  setMusicLevel(level: number, ramp: number, time?: number): void;
  fadeMaster(level: number, ramp: number, time?: number): void;
  dispose(): void;
}

const droneGainFor = (level: number, T: ToneLib) => T.dbToGain(SOUND.droneDb) * Math.min(2, level * 2);
const fxGainFor = (level: number) => Math.min(1, Math.max(0, level)) * SOUND.effectsMax;

export function buildEngine(T: ToneLib, settings: EngineSettings, destination?: ToneNS.InputNode): Engine {
  let current = { ...settings };

  const musicBus = new T.Gain(1);
  const lowpass = new T.Filter({ type: "lowpass", frequency: SOUND.lowpassHz, Q: SOUND.lowpassQ });
  const delay = new T.FeedbackDelay({ delayTime: SOUND.delayTime, feedback: SOUND.delayFeedback, wet: SOUND.delayWet });
  const dry = new T.Gain(1);
  const reverbSend = new T.Gain(settings.reverb);
  const reverbIn = new T.Gain(1);
  const reverb = new T.Reverb({ decay: SOUND.reverbDecay, preDelay: SOUND.reverbPreDelay, wet: 1 });
  const highpass = new T.Filter({ type: "highpass", frequency: SOUND.highpassHz, Q: 0.5 });
  const userVol = new T.Gain(settings.master);
  const master = new T.Gain(0); // faded in by the caller
  const limiter = new T.Limiter(SOUND.limiterDb);

  musicBus.connect(lowpass);
  lowpass.connect(delay);
  delay.connect(dry);
  delay.connect(reverbSend);
  reverbSend.connect(reverbIn);
  reverbIn.connect(reverb);
  dry.connect(highpass);
  reverb.connect(highpass);
  highpass.chain(userVol, master, limiter);
  if (destination) limiter.connect(destination);
  else limiter.toDestination();

  // Drone: tonic + fifth an octave below the garden's root, very slow filter breathing.
  const droneFilter = new T.Filter({ type: "lowpass", frequency: 700, Q: 0.3 });
  const droneGain = new T.Gain(droneGainFor(settings.drone, T));
  const lfo = new T.LFO({ frequency: SOUND.droneLfoHz, min: 320, max: 1100, type: "sine" });
  lfo.connect(droneFilter.frequency);
  const droneRoot = new T.Oscillator({ type: "sine", frequency: midiToFreq(settings.root - 12) });
  const droneFifth = new T.Oscillator({ type: "triangle", frequency: midiToFreq(settings.root - 12 + 7), volume: -8 });
  droneRoot.connect(droneFilter);
  droneFifth.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(lowpass);
  droneRoot.start();
  droneFifth.start();
  lfo.start();

  // Soft voice for stepping through X-ray mode.
  const xraySynth = new T.PolySynth(T.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.06, decay: 0.6, sustain: 0.2, release: 1.6 },
    volume: -8,
  });
  xraySynth.maxPolyphony = 4;
  xraySynth.connect(lowpass);

  const ready = reverb.ready.then(() => undefined);
  const fxGains = new Set<ToneNS.Gain>();

  return {
    T,
    musicBus,
    reverbIn,
    postBus: lowpass,
    limiter,
    master,
    xraySynth,
    ready,
    registerFx(gain) {
      gain.gain.value = fxGainFor(current.effects);
      fxGains.add(gain);
      return () => {
        fxGains.delete(gain);
      };
    },
    apply(next, ramp = 1.5) {
      const prev = current;
      current = { ...current, ...next };
      if (next.reverb !== undefined) reverbSend.gain.rampTo(current.reverb, ramp);
      if (next.drone !== undefined) droneGain.gain.rampTo(droneGainFor(current.drone, T), ramp);
      if (next.master !== undefined) userVol.gain.rampTo(current.master, 0.3);
      if (next.effects !== undefined && next.effects !== prev.effects) for (const g of fxGains) g.gain.rampTo(fxGainFor(current.effects), ramp);
      if (next.root !== undefined && next.root !== prev.root) {
        droneRoot.frequency.rampTo(midiToFreq(current.root - 12), 3);
        droneFifth.frequency.rampTo(midiToFreq(current.root - 12 + 7), 3);
      }
      // the scale doesn't change the drone (tonic + fifth exist in every scale we use)
      void SCALES;
    },
    setMusicLevel(level, ramp, time) {
      musicBus.gain.cancelScheduledValues(time ?? T.now());
      musicBus.gain.rampTo(level, ramp, time);
    },
    fadeMaster(level, ramp, time) {
      master.gain.cancelScheduledValues(time ?? T.now());
      master.gain.rampTo(level, ramp, time);
    },
    dispose() {
      for (const n of [
        musicBus, lowpass, delay, dry, reverbSend, reverbIn, reverb, highpass, userVol, master, limiter,
        droneFilter, droneGain, lfo, droneRoot, droneFifth, xraySynth,
      ])
        n.dispose();
    },
  };
}
