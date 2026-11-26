"use client";

// The whole app (client only). Canvas + floating UI at the edges.

import { useEffect, useRef } from "react";
import { decodeGarden } from "@/core/urlState";
import { demoGarden, gardenSummary } from "@/core/garden";
import { gardenFromPreset } from "@/core/presets";
import type { PlantKind } from "@/core/types";
import { cycleSelection, newSeed, nudgePlant, plantSeed, removePlant, toggleMute } from "@/state/actions";
import { gardenStore, patchUi, uiStore, useStore } from "@/state/store";
import { STORAGE_KEY, getRuntime, resetRuntime } from "@/runtime/runtime";
import { useIdle } from "./hooks";
import BeginScreen from "./BeginScreen";
import TopBar from "./TopBar";
import SeedTray from "./SeedTray";
import PlantOverlay from "./PlantOverlay";
import PlantPanel from "./PlantPanel";
import AdvancedDrawer from "./AdvancedDrawer";
import XRayOverlay from "./XRayOverlay";
import BreathingGuide from "./BreathingGuide";
import ExportDialog from "./ExportDialog";
import Captions from "./Captions";
import { ShortcutSheet, SleepDoneDialog } from "./ShortcutSheet";

const KIND_KEYS: Record<string, PlantKind> = { "1": "bonsai", "2": "rain", "3": "stones", "4": "sunflower" };

function loadInitialGarden() {
  const params = new URLSearchParams(location.search);
  if (params.get("demo") === "1") {
    patchUi({ demo: true });
    return demoGarden();
  }
  if (location.hash.length > 1) {
    const g = decodeGarden(location.hash.slice(1));
    if (g) return g;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const g = decodeGarden(saved);
      if (g) return g;
    }
  } catch {
    /* storage blocked */
  }
  return gardenFromPreset("night", 1000 + Math.floor(Math.random() * 9000));
}

export default function Garden() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const garden = useStore(gardenStore, (s) => s);
  const started = useStore(uiStore, (s) => s.started);
  const panel = useStore(uiStore, (s) => s.panel);
  const xray = useStore(uiStore, (s) => s.xray);
  const dragKind = useStore(uiStore, (s) => s.dragKind);
  const idle = useIdle(6000, started && !panel && !xray);

  // boot: restore garden, start the renderer
  useEffect(() => {
    gardenStore.set(loadInitialGarden());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    patchUi({ osReduceMotion: mq.matches });
    const onMq = () => patchUi({ osReduceMotion: mq.matches });
    mq.addEventListener("change", onMq);
    const rt = getRuntime();
    rt.init(canvas.current!);
    const touch = () => rt.touch();
    const evs = ["pointerdown", "keydown", "wheel", "pointermove"] as const;
    evs.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    return () => {
      mq.removeEventListener("change", onMq);
      evs.forEach((e) => window.removeEventListener(e, touch));
      resetRuntime(); // hot reload: never stack duplicate sounds
      patchUi({ started: false, playing: false, xray: false });
    };
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
      const ui = uiStore.get();
      const rt = getRuntime();

      if (e.key === "Escape") {
        if (ui.xray) rt.exitXray();
        else if (ui.panel) {
          const sel = ui.selectedId;
          patchUi({ panel: null });
          if (sel) document.querySelector<HTMLElement>(`[data-plant-id="${sel}"]`)?.focus();
        } else patchUi({ selectedId: null });
        return;
      }
      if (!ui.started) return;

      if (ui.xray && !typing) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") return e.preventDefault(), rt.xrayGo(1, true);
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") return e.preventDefault(), rt.xrayGo(-1, true);
        if (e.key === "Home") return e.preventDefault(), rt.xrayGo("home");
        if (e.key === "End") return e.preventDefault(), rt.xrayGo("end");
        if (e.key === "[" || e.key === "]") {
          const plants = gardenStore.get().plants;
          const i = plants.findIndex((p) => p.id === ui.xrayPlantId);
          const next = plants[(i + (e.key === "]" ? 1 : -1) + plants.length) % plants.length];
          if (next) rt.xraySelect(next.id);
          return;
        }
        if (e.key === "x" || e.key === "X") return rt.exitXray();
        return;
      }
      if (typing) return;

      const sel = ui.selectedId;
      if (e.key === " " && (tag !== "BUTTON" || target.classList.contains("plant-hit"))) {
        e.preventDefault();
        rt.setPlaying(!ui.playing);
        return;
      }
      if (KIND_KEYS[e.key]) return void plantSeed(KIND_KEYS[e.key]);
      switch (e.key) {
        case "x":
        case "X":
          return rt.enterXray();
        case "b":
        case "B":
          return patchUi({ breathing: !ui.breathing });
        case "e":
        case "E":
          return patchUi({ panel: ui.panel === "export" ? null : "export" });
        case "r":
        case "R":
          return newSeed();
        case "?":
          return patchUi({ panel: ui.panel === "shortcuts" ? null : "shortcuts" });
        case "m":
        case "M":
          if (sel) toggleMute(sel);
          return;
        case "[":
          return cycleSelection(-1);
        case "]":
          return cycleSelection(1);
        case "Delete":
        case "Backspace":
          if (sel) {
            e.preventDefault();
            removePlant(sel);
          }
          return;
      }
      if (sel && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const s = e.shiftKey ? 0.05 : 0.012;
        const dx = e.key === "ArrowLeft" ? -s : e.key === "ArrowRight" ? s : 0;
        const dy = e.key === "ArrowUp" ? -s : e.key === "ArrowDown" ? s : 0;
        nudgePlant(sel, dx, dy);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const summary = gardenSummary(garden);

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink-950">
      <canvas
        ref={canvas}
        role="img"
        aria-label={summary}
        className={`absolute inset-0 h-full w-full ${dragKind ? "cursor-copy" : ""}`}
        onClick={(e) => {
          // clicking empty sand deselects
          if (e.target === e.currentTarget) patchUi({ selectedId: null, panel: uiStore.get().panel === "plant" ? null : uiStore.get().panel });
        }}
      />
      <p className="sr-only" aria-live="polite">
        Garden summary: {summary}
      </p>

      <BreathingGuide />

      {/* DOM order = Tab order: top bar, plants, seed tray */}
      <div className={`transition-opacity duration-[800ms] ease-calm ${idle ? "opacity-20" : "opacity-100"}`}>
        <TopBar />
      </div>
      <PlantOverlay />
      <div className={`transition-opacity duration-[800ms] ease-calm ${idle ? "opacity-20" : "opacity-100"}`}>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-3 sm:pb-5">
          <Captions />
          <SeedTray />
        </div>
      </div>

      <PlantPanel />
      <AdvancedDrawer />
      <XRayOverlay />
      <ExportDialog />
      <ShortcutSheet />
      <SleepDoneDialog />
      <BeginScreen />
    </div>
  );
}
