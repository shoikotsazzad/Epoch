// One voice per plant kind. Only sine / triangle / soft FM (mod index < 3).
// Every plant gets: synths -> plant filter -> panner -> gain -> musicBus, plus a reverb send.
// Sound effects (generated, no samples) join at the panner, so they follow the plant's
// position, volume, mute, removal and the X-ray fade:
//   effect source -> fx gain (follows the garden's "Sound effects" level) -> panner

import type * as ToneNS from "tone";
import type { NoteEvent, PlantKind } from "@/core/types";
import { MIN_DROP_GAP_SEC, clickFreq, dropletFreq, windLevel, windTarget } from "@/core/effects";
import type { Engine, ToneLib } from "./engine";

export interface PlantVoice {
  kind: PlantKind;
  gain: ToneNS.Gain;
  panner: ToneNS.Panner;
  send: ToneNS.Gain;
  trigger(time: number, freq: number, durSec: number, vel: number, e: NoteEvent): void;
  /** Play the plant's sound effect for this event (see core/effects.ts). */
  effect(time: number, freq: number, vel: number, e: NoteEvent): void;
  /** Effects that depend on the plant's recursion parameters (the bonsai's Wind). */
  setParams(params: object): void;
  /** Notes still sounding at `time` (for the polyphony guard). */
  activeAt(time: number): number;
  maxVoices: number;
  dispose(): void;
}

/** Envelope / timbre settings, tuned for calm (documented in DESIGN.md §10). */
export const VOICE_SETTINGS = {
  bonsai: {
    melody: {
      harmonicity: 2,
      modulationIndex: 1.1,
      oscillator: { type: "sine" as const },
      modulation: { type: "triangle" as const },
      envelope: { attack: 0.3, decay: 1.4, sustain: 0.25, release: 4.5 },
      modulationEnvelope: { attack: 0.5, decay: 1.2, sustain: 0.2, release: 3.5 },
      volume: -1,
    },
    bell: {
      harmonicity: 3,
      modulationIndex: 1.6,
      oscillator: { type: "sine" as const },
      modulation: { type: "sine" as const },
      envelope: { attack: 0.12, decay: 2.6, sustain: 0, release: 3.5 },
      modulationEnvelope: { attack: 0.1, decay: 1.6, sustain: 0, release: 2.5 },
      volume: -11,
    },
    filterHz: 1500,
  },
  rain: {
    drop: {
      oscillator: { type: "sine" as const },
      envelope: { attack: 0.05, decay: 0.9, sustain: 0, release: 2.8 },
      volume: -7,
    },
    ground: {
      oscillator: { type: "triangle" as const },
      envelope: { attack: 3, decay: 2, sustain: 0.7, release: 6 },
      volume: -18,
    },
    filterHz: 1700,
  },
  stones: {
    pad: {
      harmonicity: 1,
      modulationIndex: 0.8,
      oscillator: { type: "sine" as const },
      modulation: { type: "sine" as const },
      envelope: { attack: 2.6, decay: 2, sustain: 0.6, release: 7.5 },
      modulationEnvelope: { attack: 3, decay: 2, sustain: 0.4, release: 6 },
      volume: -5,
    },
    filterHz: 1200,
  },
  sunflower: {
    bell: {
      harmonicity: 3.5,
      modulationIndex: 2,
      oscillator: { type: "sine" as const },
      modulation: { type: "sine" as const },
      envelope: { attack: 0.12, decay: 3, sustain: 0, release: 4.5 },
      modulationEnvelope: { attack: 0.08, decay: 2, sustain: 0, release: 3 },
      volume: -13,
    },
    filterHz: 3000,
  },
} as const;

const POLY: Record<PlantKind, number> = { bonsai: 6, rain: 6, stones: 8, sunflower: 6 };

/** Effect timbres (documented in DESIGN.md §10). Levels sit under the notes and the drone. */
export const EFFECT_SETTINGS = {
  wind: { noise: "pink" as const, volume: -4, gustHz: 0.06, gustMin: 0.55 },
  droplet: {
    oscillator: { type: "sine" as const },
    envelope: { attack: 0.003, decay: 0.07, sustain: 0, release: 0.05 },
    volume: -16,
    rise: 1.6, // a drop's pitch rises as the bubble closes
  },
  click: {
    pitchDecay: 0.012,
    octaves: 1.5,
    oscillator: { type: "sine" as const },
    envelope: { attack: 0.005, decay: 0.16, sustain: 0, release: 0.08 }, // 5 ms: a soft knock, never a hard transient
    volume: -18,
  },
} as const;

interface Fx {
  effect(time: number, freq: number, vel: number, e: NoteEvent): void;
  setParams(params: object): void;
  nodes: { dispose(): unknown }[];
}

function createFx(T: ToneLib, engine: Engine, kind: PlantKind, out: ToneNS.InputNode): Fx | null {
  const fxGain = new T.Gain(0);
  const release = engine.registerFx(fxGain);
  fxGain.connect(out);
  const unregister = { dispose: release };

  if (kind === "bonsai") {
    const w = EFFECT_SETTINGS.wind;
    const noise = new T.Noise({ type: w.noise, volume: w.volume });
    const band = new T.Filter({ type: "bandpass", frequency: 420, Q: 0.9 });
    const level = new T.Gain(windLevel(0.3));
    const gust = new T.Gain(1);
    const lfo = new T.LFO({ frequency: w.gustHz, min: w.gustMin, max: 1, type: "sine" });
    lfo.connect(gust.gain);
    noise.chain(band, level, gust, fxGain);
    noise.start();
    lfo.start();
    let wind = 0.3;
    return {
      effect(time, _freq, _vel, e) {
        const t = windTarget(e.role, e.depth, wind);
        level.gain.rampTo(t.level, t.ramp, time);
        band.frequency.rampTo(t.freq, t.ramp, time);
      },
      setParams(params) {
        const next = (params as { wind?: number }).wind;
        if (typeof next !== "number" || next === wind) return;
        wind = next;
        level.gain.rampTo(windLevel(wind), 1.5);
      },
      nodes: [unregister, noise, band, level, gust, lfo, fxGain],
    };
  }

  if (kind === "rain") {
    const d = EFFECT_SETTINGS.droplet;
    const drop = new T.Synth({ oscillator: d.oscillator, envelope: d.envelope, volume: d.volume });
    const hp = new T.Filter({ type: "highpass", frequency: 700, Q: 0.5 });
    drop.chain(hp, fxGain);
    let last = -Infinity;
    return {
      effect(time, _freq, vel, e) {
        if (time - last < MIN_DROP_GAP_SEC) return;
        last = time;
        const f = dropletFreq(e.frameId, e.depth);
        drop.triggerAttackRelease(f, 0.05, time, Math.min(1, 0.5 + vel * 0.5));
        drop.frequency.exponentialRampToValueAtTime(f * d.rise, time + 0.045);
      },
      setParams() {},
      nodes: [unregister, drop, hp, fxGain],
    };
  }

  if (kind === "stones") {
    const c = EFFECT_SETTINGS.click;
    const knock = new T.MembraneSynth({ pitchDecay: c.pitchDecay, octaves: c.octaves, oscillator: c.oscillator, envelope: c.envelope, volume: c.volume });
    knock.connect(fxGain);
    return {
      effect(time, freq, vel) {
        knock.triggerAttackRelease(clickFreq(freq), 0.08, time, Math.min(1, 0.4 + vel * 0.5));
      },
      setParams() {},
      nodes: [unregister, knock, fxGain],
    };
  }

  release();
  fxGain.dispose();
  return null;
}

export function createPlantVoice(T: ToneLib, engine: Engine, kind: PlantKind, pan: number, send: number): PlantVoice {
  const gain = new T.Gain(0);
  const panner = new T.Panner(pan);
  const sendGain = new T.Gain(send);
  const s = VOICE_SETTINGS[kind];
  const filter = new T.Filter({ type: "lowpass", frequency: s.filterHz, Q: 0.4 });
  filter.chain(panner, gain, engine.musicBus);
  gain.connect(sendGain);
  sendGain.connect(engine.reverbIn);

  const synths: ToneNS.PolySynth[] = [];
  const mk = (voice: unknown, opts: object, poly: number) => {
    const p = new T.PolySynth(voice as never, opts as never) as unknown as ToneNS.PolySynth;
    p.maxPolyphony = poly;
    p.connect(filter);
    synths.push(p);
    return p;
  };

  const fx = createFx(T, engine, kind, panner);

  let main: ToneNS.PolySynth;
  let extra: ToneNS.PolySynth | null = null;
  switch (kind) {
    case "bonsai":
      main = mk(T.FMSynth as never, VOICE_SETTINGS.bonsai.melody, POLY.bonsai);
      extra = mk(T.FMSynth as never, VOICE_SETTINGS.bonsai.bell, 4);
      break;
    case "rain":
      main = mk(T.Synth as never, VOICE_SETTINGS.rain.drop, POLY.rain);
      extra = mk(T.Synth as never, VOICE_SETTINGS.rain.ground, 2);
      break;
    case "stones":
      main = mk(T.FMSynth as never, VOICE_SETTINGS.stones.pad, POLY.stones);
      break;
    case "sunflower":
      main = mk(T.FMSynth as never, VOICE_SETTINGS.sunflower.bell, POLY.sunflower);
      break;
  }

  // note end times, for the polyphony guard (audio-clock based, so export behaves the same)
  let ends: number[] = [];
  const release = kind === "stones" ? 7.5 : kind === "rain" ? 2.8 : 4;

  return {
    kind,
    gain,
    panner,
    send: sendGain,
    maxVoices: POLY[kind],
    activeAt(time) {
      ends = ends.filter((t) => t > time);
      return ends.length;
    },
    trigger(time, freq, durSec, vel, e) {
      const useExtra =
        (kind === "bonsai" && e.role === "leaf") || (kind === "rain" && e.role === "drone");
      const synth = useExtra && extra ? extra : main;
      if (kind === "bonsai") {
        // push = tension opens the filter a little, pop = release closes it again
        const target = e.role === "pop" ? s.filterHz : s.filterHz + Math.min(e.depth, 5) * 160;
        filter.frequency.linearRampToValueAtTime(target, time + 0.6);
      }
      if (!useExtra) ends.push(time + durSec * 0.6 + release * 0.5);
      synth.triggerAttackRelease(freq, durSec, time, vel);
    },
    effect(time, freq, vel, e) {
      fx?.effect(time, freq, vel, e);
    },
    setParams(params) {
      fx?.setParams(params);
    },
    dispose() {
      synths.forEach((x) => x.dispose());
      fx?.nodes.forEach((n) => n.dispose());
      filter.dispose();
      panner.dispose();
      gain.dispose();
      sendGain.dispose();
    },
  };
}
