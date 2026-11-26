"use client";

import { useEffect, useRef } from "react";
import { patchUi, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { FadePanel, PanelHeader } from "./ui";

const KEYS: [string, string][] = [
  ["Space", "Play / pause"],
  ["1 – 4", "Plant bonsai, rain, stones, sunflower"],
  ["Tab / Shift+Tab", "Move between plants and controls"],
  ["Enter", "Tune the focused plant"],
  ["Arrows", "Nudge the selected plant (Shift = bigger steps)"],
  ["Delete", "Remove the selected plant"],
  ["M", "Mute / unmute the selected plant"],
  ["X", "X-ray call stack (← → step, Home / End, [ ] plant)"],
  ["B", "Breathing guide"],
  ["E", "Export audio"],
  ["R", "New seed"],
  ["H", "How to use (guide for new visitors)"],
  ["?", "This sheet"],
  ["Esc", "Close panels / leave X-ray"],
];

export function ShortcutSheet() {
  const panel = useStore(uiStore, (s) => s.panel);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (panel === "shortcuts") setTimeout(() => ref.current?.querySelector<HTMLElement>("button")?.focus(), 50);
  }, [panel]);
  return (
    <FadePanel show={panel === "shortcuts"} label="Keyboard shortcuts" from="center" className="fixed left-1/2 top-1/2 z-40 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2">
      <div ref={ref}>
        <PanelHeader title="Shortcuts" onClose={() => patchUi({ panel: null })} />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {KEYS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>
                <kbd className="kbd">{k}</kbd>
              </dt>
              <dd className="text-paper-300">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </FadePanel>
  );
}

export function SleepDoneDialog() {
  const panel = useStore(uiStore, (s) => s.panel);
  return (
    <FadePanel show={panel === "sleepDone"} label="Sleep timer finished" from="center" className="fixed left-1/2 top-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 text-center">
      <h2 className="font-display text-3xl text-paper-100">The garden is resting</h2>
      <p className="mt-3 text-paper-300">Would you like to keep the music it made?</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-primary flex-1 py-3" onClick={() => patchUi({ panel: "export" })} autoFocus>
          Save this session
        </button>
        <button
          type="button"
          className="btn-quiet flex-1"
          onClick={() => {
            patchUi({ panel: null });
            getRuntime().setPlaying(true);
          }}
        >
          Keep listening
        </button>
      </div>
    </FadePanel>
  );
}
