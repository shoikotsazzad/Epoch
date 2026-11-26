// Recursion events -> looping Tone.Parts, one per plant, each on its own
// incommensurate cycle (Bonsai 29 s, Rain 17 s, Stones 23 s, Sunflower 37 s at 56 BPM),
// so the combined music almost never repeats (Eno, Music for Airports).
//
// Times are in transport TICKS, so changing the tempo stretches every loop smoothly
// while keeping their ratios. Pitches are quantized at trigger time, so a scale
// change applies instantly without rebuilding anything.

import type * as ToneNS from "tone";
import type { GardenState, GrowResult, NoteEvent, Plant } from "@/core/types";
import { deriveSeed, mulberry32 } from "@/core/rng";
import { bassSafe, foldIntoRange, midiToFreq, quantize } from "@/core/scales";
import { DensityLimiter, priorityOf } from "@/core/density";
import { panFor, reverbSendFor } from "@/core/garden";
import type { Engine, ToneLib } from "./engine";
import { createPlantVoice, type PlantVoice } from "./voices";

/** Loop lengths are defined in seconds at this tempo. */
export const REF_BPM = 56;

/** Per-kind mix balance (on top of the plant's own volume). */
export const KIND_GAIN = { bonsai: 1, rain: 0.8, stones: 0.75, sunflower: 0.8 } as const;
/** +6 dB plant makeup gain (gain staging measured from rendered audio). */
export const PLANT_MAKEUP = 2;

export interface PartEvent {
  time: string;
  e: NoteEvent;
  vel: number;
}

export interface GrowEntry {
  key: string;
  result: GrowResult;
}

type Transport = ReturnType<ToneLib["getTransport"]>;

interface Entry {
  plant: Plant;
  key: string;
  voice: PlantVoice;
  part: ToneNS.Part<PartEvent> | null;
  originTicks: number;
}

export type NoteListener = (plantId: string, e: NoteEvent, midi: number, time: number) => void;

export interface MusicContext {
  scale: readonly number[];
  root: number;
}

/** Bake a plant's events into tick-timed Part events (seeded humanize: ±10–30 ms, ±10% velocity). */
export function buildPartEvents(plant: Plant, grow: GrowResult, gardenSeed: number, ppq: number): { events: PartEvent[]; loopTicks: number } {
  const rand = mulberry32(deriveSeed(gardenSeed, `human:${plant.id}`));
  const loopBeats = (plant.loopSeconds * REF_BPM) / 60;
  const scale = loopBeats / Math.max(1, grow.lengthBeats);
  const loopTicks = Math.round(loopBeats * ppq);
  const jitterBeats = (0.03 * REF_BPM) / 60; // up to ±30 ms
  const events: PartEvent[] = [];
  for (const e of grow.events) {
    const sign = rand() < 0.5 ? -1 : 1;
    const jitter = e.role === "drone" ? 0 : sign * (0.33 + rand() * 0.67) * jitterBeats; // 10..30 ms
    const beat = Math.max(0, e.time * scale + jitter);
    const ticks = Math.min(loopTicks - 1, Math.round(beat * ppq));
    const vel = Math.min(1, Math.max(0.02, e.vel * (0.9 + rand() * 0.2)));
    events.push({ time: `${ticks}i`, e, vel });
  }
  return { events, loopTicks };
}

export class Scheduler {
  private entries = new Map<string, Entry>();
  private limiter = new DensityLimiter();
  private pending = new Set<ReturnType<typeof setTimeout>>();
  private transport: Transport;

  constructor(
    private T: ToneLib,
    private engine: Engine,
    private music: () => MusicContext,
    private gardenSeed: () => number,
    private onNote?: NoteListener,
  ) {
    this.transport = T.getTransport();
  }

  /** Reconcile playing plants with the garden state. */
  sync(state: GardenState, grows: Map<string, GrowEntry>, opts: { fadeIn: boolean }) {
    const seen = new Set<string>();
    for (const plant of state.plants) {
      const grow = grows.get(plant.id);
      if (!grow) continue;
      seen.add(plant.id);
      const entry = this.entries.get(plant.id);
      if (!entry) {
        this.add(plant, grow, opts.fadeIn);
        continue;
      }
      if (entry.key !== grow.key || entry.plant.loopSeconds !== plant.loopSeconds) this.replacePart(entry, plant, grow);
      if (entry.plant.volume !== plant.volume || entry.plant.muted !== plant.muted) entry.voice.gain.gain.rampTo(this.targetGain(plant), 1.5);
      if (entry.plant.x !== plant.x || entry.plant.y !== plant.y) {
        entry.voice.panner.pan.rampTo(panFor(plant.x), 1.5);
        entry.voice.send.gain.rampTo(reverbSendFor(plant.x, plant.y), 1.5);
      }
      entry.plant = plant;
    }
    for (const [id, entry] of this.entries) if (!seen.has(id)) this.remove(id, entry);
  }

  private targetGain(p: Plant) {
    return p.muted ? 0 : p.volume * KIND_GAIN[p.kind] * PLANT_MAKEUP;
  }

  private add(plant: Plant, grow: GrowEntry, fadeIn: boolean) {
    const voice = createPlantVoice(this.T, this.engine, plant.kind, panFor(plant.x), reverbSendFor(plant.x, plant.y));
    const entry: Entry = { plant, key: grow.key, voice, part: null, originTicks: 0 };
    const target = this.targetGain(plant);
    if (fadeIn) {
      voice.gain.gain.setValueAtTime(0, this.T.now());
      voice.gain.gain.linearRampToValueAtTime(target, this.T.now() + 4);
    } else voice.gain.gain.value = target;
    this.entries.set(plant.id, entry);
    const start = this.startTicks();
    entry.originTicks = start;
    this.startPart(entry, grow.result, start, 0);
  }

  private replacePart(entry: Entry, plant: Plant, grow: GrowEntry) {
    entry.part?.dispose();
    entry.part = null;
    entry.key = grow.key;
    entry.plant = plant;
    const start = this.startTicks();
    const { loopTicks } = buildPartEvents(plant, grow.result, this.gardenSeed(), this.transport.PPQ);
    const offset = (((start - entry.originTicks) % loopTicks) + loopTicks) % loopTicks;
    this.startPart(entry, grow.result, start, offset);
  }

  /** Start "now" (a little ahead) if the transport has moved, else at the very beginning. */
  private startTicks(): number {
    const t = this.transport;
    if (t.state !== "started" && t.ticks === 0) return 0;
    return t.ticks + Math.round((0.08 * t.bpm.value * t.PPQ) / 60);
  }

  private startPart(entry: Entry, grow: GrowResult, startTicks: number, offsetTicks: number) {
    const plantId = entry.plant.id;
    const { events, loopTicks } = buildPartEvents(entry.plant, grow, this.gardenSeed(), this.transport.PPQ);
    const part = new this.T.Part<PartEvent>((time, ev) => this.play(plantId, time, ev), events);
    part.loop = true;
    part.loopStart = 0;
    part.loopEnd = `${loopTicks}i`;
    part.start(`${startTicks}i`, `${offsetTicks}i`);
    entry.part = part;
  }

  private play(plantId: string, time: number, ev: PartEvent) {
    const entry = this.entries.get(plantId);
    if (!entry || entry.plant.muted) return;
    const e = ev.e;
    const exempt = e.role === "drone";
    if (!this.limiter.allow(plantId, time, priorityOf(e), exempt)) return;
    if (!exempt && entry.voice.activeAt(time) >= entry.voice.maxVoices) return;
    const { scale, root } = this.music();
    let midi = quantize(e.degree, e.octave, scale, root);
    if (entry.plant.kind === "stones" || entry.plant.kind === "rain") midi = bassSafe(midi, root);
    midi = foldIntoRange(midi, 36, 86); // nothing above D6: bright, never piercing
    const durSec = Math.max(0.2, (e.dur * 60) / this.transport.bpm.value);
    entry.voice.trigger(time, midiToFreq(midi), durSec, ev.vel, e);
    this.onNote?.(plantId, e, midi, time);
  }

  private remove(id: string, entry: Entry) {
    this.entries.delete(id);
    entry.voice.gain.gain.cancelScheduledValues(this.T.now());
    entry.voice.gain.gain.rampTo(0, 3);
    const timer = setTimeout(() => {
      this.pending.delete(timer);
      entry.part?.dispose();
      entry.voice.dispose();
    }, 3400);
    this.pending.add(timer);
  }

  dispose() {
    for (const t of this.pending) clearTimeout(t);
    this.pending.clear();
    for (const entry of this.entries.values()) {
      entry.part?.dispose();
      entry.voice.dispose();
    }
    this.entries.clear();
  }
}
