// GardenRuntime: the glue between the stores, the audio engine and the renderer.
// Plain TypeScript (no React). One instance per page; fully disposable for hot reload.

import type * as ToneNS from "tone";
import type { GardenState, GrowResult, NoteEvent, PlantKind } from "@/core/types";
import { GrowCache } from "@/core/growCache";
import { PRESETS } from "@/core/presets";
import { SCALES, midiToFreq, midiToName, quantize } from "@/core/scales";
import { noteCaption, restCaption } from "@/core/captions";
import { buildSteps, describeFrame, stackAt, stepForFrame, type Step } from "@/core/xray";
import { evolveGarden } from "@/core/garden";
import { PLANT_LABELS } from "@/core/params";
import { SOUND, buildEngine, type Engine, type ToneLib } from "@/audio/engine";
import { Scheduler } from "@/audio/scheduler";
import { renderGarden } from "@/audio/offline";
import { Renderer } from "@/visual/renderer";
import { SessionRecorder } from "@/export/recorder";
import { captionStore, gardenStore, patchUi, reduceMotion, uiStore, type UiState } from "@/state/store";

/** Old saved-garden key (no longer used: every visit starts fresh). */
export const LEGACY_STORAGE_KEY = "stack-garden:v1";
const IDLE_MS = 30_000;
const EVOLVE_EVERY_MS = 20_000;

class GardenRuntime {
  private T: ToneLib | null = null;
  private engine: Engine | null = null;
  private scheduler: Scheduler | null = null;
  private renderer: Renderer | null = null;
  private grows = new GrowCache();
  private unsubs: (() => void)[] = [];
  private lastFrame = new Map<string, number>();
  private lastCaption = new Map<string, { text: string; t: number }>();
  private captionTurn = 0;
  private timers: ReturnType<typeof setInterval>[] = [];
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private lastInteraction = typeof performance !== "undefined" ? performance.now() : 0;
  private lastEvolve = 0;
  private windingDown = false;
  private xrayWasPlaying = false;
  private stepsCache = new WeakMap<GrowResult, Step[]>();
  private recorder: SessionRecorder | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private prevUi: UiState = uiStore.get();
  private prevGarden: GardenState = gardenStore.get();
  private rawCtx: AudioContext | null = null;

  // ------------------------------------------------------------------ lifecycle

  init(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.applyUiToRenderer(uiStore.get());
    this.onGarden();
    this.unsubs.push(gardenStore.subscribe(() => this.onGarden()));
    this.unsubs.push(uiStore.subscribe(() => this.onUi()));
    this.timers.push(setInterval(() => this.tick(), 1000));
    this.timers.push(setInterval(() => this.emitCaption(), 2000));
  }

  touch() {
    this.lastInteraction = performance.now();
  }

  /** Begin: called from the click handler with an AudioContext created synchronously inside the gesture. */
  async begin(rawCtx: AudioContext) {
    this.rawCtx = rawCtx;
    const T = await import("tone");
    this.T = T;
    T.setContext(rawCtx);
    await T.start();
    const g = gardenStore.get();
    const engine = buildEngine(T, { root: g.root, scale: g.scale, reverb: g.reverb, drone: g.drone, effects: g.effects, master: uiStore.get().master });
    this.engine = engine;
    await engine.ready;
    const transport = T.getTransport();
    transport.bpm.value = g.bpm;
    this.scheduler = new Scheduler(
      T,
      engine,
      () => {
        const s = gardenStore.get();
        return { scale: SCALES[s.scale], root: s.root };
      },
      () => gardenStore.get().seed,
      this.onNote,
    );
    this.scheduler.sync(g, this.grows.growsFor(g), { fadeIn: true });
    transport.start("+0.1");
    engine.fadeMaster(T.dbToGain(SOUND.masterDb), 4);
    this.glideTempo();
    this.renderer?.bloom();
    patchUi({ started: true, playing: true });
    captionStore.set("The bonsai's branch function is calling itself. Each call is a note.");
  }

  dispose() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.timers.forEach((t) => clearInterval(t));
    this.timers = [];
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.scheduler?.dispose();
    this.scheduler = null;
    if (this.T) {
      const tr = this.T.getTransport();
      tr.stop();
      tr.cancel();
    }
    this.engine?.dispose();
    this.engine = null;
    this.renderer?.dispose();
    this.renderer = null;
  }

  /** Music clock in seconds (transport time while playing), for the breathing guide. */
  clockSeconds(): number {
    if (this.T && uiStore.get().playing) return this.T.getTransport().seconds;
    return performance.now() / 1000;
  }

  get toneReady() {
    return !!this.T && !!this.engine;
  }

  growFor(plantId: string): GrowResult | null {
    const g = gardenStore.get();
    const p = g.plants.find((x) => x.id === plantId);
    if (!p) return null;
    return this.grows.get(p, g.seed, SCALES[g.scale].length).result;
  }

  allGrows(): GrowResult[] {
    return [...this.grows.growsFor(gardenStore.get()).values()].map((e) => e.result);
  }

  // ------------------------------------------------------------------ store reactions

  private onGarden() {
    const g = gardenStore.get();
    const prev = this.prevGarden;
    this.prevGarden = g;
    const grows = this.grows.growsFor(g);
    this.renderer?.setGarden(g, grows);
    if (this.scheduler && this.engine && this.T) {
      this.scheduler.sync(g, grows, { fadeIn: true });
      this.engine.apply({ reverb: g.reverb, drone: g.drone, effects: g.effects, root: g.root, scale: g.scale });
      if (g.bpm !== prev.bpm || g.preset !== prev.preset) this.glideTempo();
    }
    const ui = uiStore.get();
    if (ui.xray && ui.xrayPlantId && !g.plants.some((p) => p.id === ui.xrayPlantId)) this.xraySelect(g.plants[0]?.id ?? null);
    else if (ui.xray) this.updateXrayView();
  }

  private onUi() {
    const ui = uiStore.get();
    const prev = this.prevUi;
    this.prevUi = ui;
    this.applyUiToRenderer(ui);
    if (ui.master !== prev.master) this.engine?.apply({ master: ui.master });
    if (ui.sleepEndsAt !== prev.sleepEndsAt) {
      this.windingDown = false;
      if (ui.sleepEndsAt === null && this.engine && this.T && ui.playing) {
        // timer cancelled during wind-down: restore
        this.engine.fadeMaster(this.T.dbToGain(SOUND.masterDb), 2);
        this.glideTempo();
      }
    }
  }

  private applyUiToRenderer(ui: UiState) {
    if (!this.renderer) return;
    this.renderer.reduceMotion = reduceMotion(ui);
    this.renderer.selectedId = ui.selectedId;
  }

  /** Tempo follows the garden; Deep Sleep glides slowly down to its end tempo. */
  private glideTempo() {
    if (!this.T) return;
    const g = gardenStore.get();
    const bpm = this.T.getTransport().bpm;
    bpm.cancelScheduledValues(this.T.now());
    bpm.rampTo(g.bpm, 1.5);
    const end = PRESETS[g.preset].bpmEnd;
    if (end && g.preset === "deepSleep") bpm.linearRampTo(end, 600, this.T.now() + 2);
  }

  // ------------------------------------------------------------------ notes, captions

  private onNote = (plantId: string, e: NoteEvent, midi: number, time: number) => {
    const T = this.T;
    if (!T) return;
    T.getDraw().schedule(() => {
      this.renderer?.onNote(plantId, e);
      this.lastFrame.set(plantId, e.frameId);
      const p = gardenStore.get().plants.find((x) => x.id === plantId);
      if (!p) return;
      const frame = this.growFor(plantId)?.trace[e.frameId];
      this.lastCaption.set(p.kind, { text: noteCaption(p.kind, e, frame, midiToName(midi), gardenStore.get().effects > 0), t: performance.now() });
    }, time);
  };

  private emitCaption() {
    const ui = uiStore.get();
    if (!ui.started || ui.xray) return;
    const g = gardenStore.get();
    if (!ui.playing) {
      captionStore.set(g.plants.length ? "Paused. Press Space to play." : "");
      return;
    }
    if (!g.plants.length) {
      captionStore.set("Only the drone remains. Drag a seed into the garden, or press 1–4.");
      return;
    }
    const now = performance.now();
    if (ui.evolveMessage && now - this.lastEvolve < 4000) {
      captionStore.set(ui.evolveMessage);
      return;
    }
    // One plant at a time, rotating every 2 s: short and calm instead of one long line.
    const kinds = [...new Set(g.plants.map((p) => p.kind))] as PlantKind[];
    const k = kinds[this.captionTurn++ % kinds.length];
    const c = this.lastCaption.get(k);
    captionStore.set(c && now - c.t < 6000 ? c.text : restCaption[k]);
  }

  // ------------------------------------------------------------------ transport

  setPlaying(play: boolean) {
    const T = this.T;
    const engine = this.engine;
    if (!T || !engine) return;
    const tr = T.getTransport();
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    if (play) {
      if (uiStore.get().xray) this.exitXray(false);
      if (tr.state !== "started") tr.start("+0.05");
      engine.setMusicLevel(1, 0.5);
      engine.fadeMaster(T.dbToGain(SOUND.masterDb), 1.5);
      this.glideTempo(); // also undoes a sleep-timer wind-down
      this.windingDown = false;
      patchUi({ playing: true });
    } else {
      engine.fadeMaster(0, 1.2);
      this.pauseTimer = setTimeout(() => {
        tr.pause();
        this.pauseTimer = null;
      }, 1300);
      patchUi({ playing: false });
    }
  }

  // ------------------------------------------------------------------ idle evolve + sleep timer (1 s tick)

  private tick() {
    const ui = uiStore.get();
    const now = performance.now();
    if (ui.started && ui.playing && !ui.xray && !ui.panel && !ui.dragKind) {
      if (now - this.lastInteraction > IDLE_MS && now - this.lastEvolve > EVOLVE_EVERY_MS) {
        this.lastEvolve = now;
        const next = evolveGarden(gardenStore.get(), Math.random);
        if (next) {
          gardenStore.set(next.state);
          patchUi({ evolveMessage: next.message });
        }
      }
    }
    if (ui.sleepEndsAt !== null && this.engine && this.T) {
      const remaining = (ui.sleepEndsAt - now) / 1000;
      if (remaining <= 60 && !this.windingDown && ui.playing) {
        this.windingDown = true;
        const r = Math.max(1, remaining);
        this.engine.fadeMaster(0, r);
        const bpm = this.T.getTransport().bpm;
        bpm.cancelScheduledValues(this.T.now());
        bpm.linearRampTo(gardenStore.get().bpm * 0.85, r);
        captionStore.set("Winding down: the garden is slowing and growing quiet.");
      }
      if (remaining <= 0) {
        this.setPlaying(false);
        patchUi({ sleepEndsAt: null, sleepMinutes: null, panel: "sleepDone" });
      }
    }
  }

  // ------------------------------------------------------------------ X-ray

  private stepsFor(g: GrowResult): Step[] {
    let s = this.stepsCache.get(g);
    if (!s) {
      s = buildSteps(g.trace);
      this.stepsCache.set(g, s);
    }
    return s;
  }

  enterXray() {
    const ui = uiStore.get();
    const g = gardenStore.get();
    const plantId = ui.selectedId ?? g.plants[0]?.id ?? null;
    this.xrayWasPlaying = ui.playing;
    if (this.T && this.engine && ui.playing) {
      // time freezes: music fades to the drone, then the transport pauses
      this.engine.setMusicLevel(0, 0.8);
      if (this.pauseTimer) clearTimeout(this.pauseTimer);
      this.pauseTimer = setTimeout(() => {
        this.T?.getTransport().pause();
        this.pauseTimer = null;
      }, 900);
    }
    const grow = plantId ? this.growFor(plantId) : null;
    const tick = grow ? stepForFrame(grow.trace, this.lastFrame.get(plantId!)) : 0;
    patchUi({ xray: true, xrayPlantId: plantId, xrayTick: tick, panel: null });
    this.updateXrayView();
  }

  exitXray(resume = true) {
    if (this.renderer) this.renderer.xray = null;
    patchUi({ xray: false });
    if (this.T && this.engine && resume && this.xrayWasPlaying) {
      if (this.pauseTimer) {
        clearTimeout(this.pauseTimer);
        this.pauseTimer = null;
      }
      const tr = this.T.getTransport();
      if (tr.state !== "started") tr.start("+0.05");
      this.engine.setMusicLevel(1, 1.2);
      patchUi({ playing: true });
    } else if (this.engine && resume) {
      this.engine.setMusicLevel(1, 0.1);
    }
  }

  xraySelect(plantId: string | null) {
    const grow = plantId ? this.growFor(plantId) : null;
    const tick = grow && plantId ? stepForFrame(grow.trace, this.lastFrame.get(plantId)) : 0;
    patchUi({ xrayPlantId: plantId, xrayTick: tick });
    this.updateXrayView();
  }

  xrayGo(target: number | "home" | "end", relative = false) {
    const ui = uiStore.get();
    if (!ui.xrayPlantId) return;
    const grow = this.growFor(ui.xrayPlantId);
    if (!grow) return;
    const steps = this.stepsFor(grow);
    let tick = target === "home" ? 0 : target === "end" ? steps.length - 1 : relative ? ui.xrayTick + target : target;
    tick = Math.max(0, Math.min(steps.length - 1, tick));
    patchUi({ xrayTick: tick });
    this.updateXrayView();
    const step = steps[tick];
    const frame = grow.trace[step.frameId];
    if (this.T && this.engine && frame.note) {
      const g = gardenStore.get();
      const midi = quantize(frame.note.degree, frame.note.octave, SCALES[g.scale], g.root);
      const vel = step.type === "enter" ? 0.5 : 0.25; // returns are softer echoes
      this.engine.xraySynth.triggerAttackRelease(midiToFreq(Math.min(86, midi)), 0.8, this.T.now() + 0.02, vel);
    }
  }

  private updateXrayView() {
    const ui = uiStore.get();
    if (!this.renderer) return;
    if (!ui.xray || !ui.xrayPlantId) {
      this.renderer.xray = ui.xray ? { plantId: "", hl: { stack: new Set(), current: -1 }, label: "" } : null;
      return;
    }
    const grow = this.growFor(ui.xrayPlantId);
    if (!grow) return;
    const steps = this.stepsFor(grow);
    const step = steps[Math.min(ui.xrayTick, steps.length - 1)];
    const stack = stackAt(grow.trace, steps, ui.xrayTick);
    const frame = grow.trace[step.frameId];
    this.renderer.xray = {
      plantId: ui.xrayPlantId,
      hl: { stack: new Set(stack.map((f) => f.id)), current: step.frameId },
      label: `${step.type === "enter" ? "call" : "return"} ${describeFrame(frame)} · depth ${frame.depth}`,
    };
  }

  // ------------------------------------------------------------------ export

  async renderExport(seconds: number, onProgress: (p: number) => void): Promise<AudioBuffer> {
    if (!this.T) throw new Error("Press Begin first so the browser allows audio.");
    return renderGarden(this.T, gardenStore.get(), seconds, onProgress);
  }

  startRecording(): boolean {
    if (!this.engine || !this.rawCtx) return false;
    if (!this.streamDest) {
      this.streamDest = this.rawCtx.createMediaStreamDestination();
      this.engine.limiter.connect(this.streamDest as unknown as ToneNS.InputNode);
    }
    this.recorder = new SessionRecorder(this.streamDest.stream);
    if (!this.recorder.supported) return false;
    this.recorder.start();
    patchUi({ recording: true });
    return true;
  }

  async stopRecording() {
    const rec = this.recorder;
    patchUi({ recording: false });
    if (!rec) return null;
    this.recorder = null;
    return rec.stop();
  }

  recordingSupported() {
    return typeof MediaRecorder !== "undefined" && new SessionRecorder(new MediaStream()).supported;
  }

  plantLabel(id: string) {
    const p = gardenStore.get().plants.find((x) => x.id === id);
    return p ? PLANT_LABELS[p.kind] : "";
  }
}

let instance: GardenRuntime | null = null;
export function getRuntime(): GardenRuntime {
  if (!instance) instance = new GardenRuntime();
  return instance;
}
export function resetRuntime() {
  instance?.dispose();
  instance = null;
}
export type { GardenRuntime };
