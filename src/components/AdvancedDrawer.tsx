"use client";

import { useEffect, useRef, useState } from "react";
import { PRESETS, PRESET_ORDER } from "@/core/presets";
import { SCALE_LABELS, SCALES, midiToName } from "@/core/scales";
import type { ScaleId } from "@/core/types";
import { gardenSummary } from "@/core/garden";
import { encodeGarden, BPM_RANGE, ROOT_RANGE } from "@/core/urlState";
import { applyPreset, newSeed, setGlobal, startFresh, surpriseMe } from "@/state/actions";
import { gardenStore, patchUi, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { FadePanel, LiveSlider, PanelHeader, Segmented, Slider, Toggle } from "./ui";
import { XrayIcon } from "./icons";

export default function AdvancedDrawer() {
  const panel = useStore(uiStore, (s) => s.panel);
  const show = panel === "menu";
  const garden = useStore(gardenStore, (s) => s);
  const breathing = useStore(uiStore, (s) => s.breathing);
  const reduce = useStore(uiStore, (s) => s.reduceMotionToggle);
  const osReduce = useStore(uiStore, (s) => s.osReduceMotion);
  const master = useStore(uiStore, (s) => s.master);
  const sleepMinutes = useStore(uiStore, (s) => s.sleepMinutes);
  const sleepEndsAt = useStore(uiStore, (s) => s.sleepEndsAt);
  const started = useStore(uiStore, (s) => s.started);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (show) setTimeout(() => ref.current?.querySelector<HTMLElement>("button,input,select")?.focus(), 50);
  }, [show]);
  useEffect(() => {
    if (!show || !sleepEndsAt) return;
    const t = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(t);
  }, [show, sleepEndsAt]);

  const copyLink = async () => {
    const url = `${location.origin}${location.pathname}#${encodeGarden(gardenStore.get())}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const setSleep = (m: number | "off") => {
    if (m === "off") patchUi({ sleepMinutes: null, sleepEndsAt: null });
    else {
      const t = performance.now();
      setNow(t);
      patchUi({ sleepMinutes: m, sleepEndsAt: t + m * 60_000 });
    }
  };
  const remaining = sleepEndsAt && now ? Math.max(0, Math.round((sleepEndsAt - now) / 1000)) : sleepMinutes ? sleepMinutes * 60 : 0;

  return (
    <FadePanel
      show={show}
      label="Settings"
      id="menu-drawer"
      className="fixed inset-x-3 bottom-3 z-30 max-h-[78dvh] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-24 sm:w-[360px] sm:max-h-[calc(100dvh-8rem)]"
    >
      <div ref={ref}>
        <PanelHeader title="Settings" subtitle={gardenSummary(garden)} onClose={() => patchUi({ panel: null })} />

        {/* below 768 px "How to use" lives here instead of the top bar */}
        <button type="button" className="btn-primary mb-2 flex w-full items-center justify-center gap-2.5 py-3 md:hidden" onClick={() => patchUi({ panel: "help" })}>
          <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px] font-semibold">?</span>
          How to use
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-quiet flex items-center justify-center gap-2"
            disabled={!started}
            onClick={() => {
              patchUi({ panel: null });
              getRuntime().enterXray();
            }}
            aria-keyshortcuts="X"
          >
            <XrayIcon width={16} height={16} /> X-ray stack
          </button>
          <button type="button" className="btn-quiet" onClick={() => patchUi({ panel: "shortcuts" })} aria-keyshortcuts="?">
            Shortcuts
          </button>
        </div>

        <h3 className="drawer-h">Calm</h3>
        <div className="flex flex-col gap-2">
          <Toggle label="Breathing guide" checked={breathing} onChange={(v) => patchUi({ breathing: v })} hint="Shortcut B" />
          <div>
            <p className="mb-1.5 text-[12px] uppercase tracking-[0.08em] text-paper-500">
              Sleep timer{sleepEndsAt ? ` · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} left` : ""}
            </p>
            <Segmented
              label="Sleep timer"
              value={sleepMinutes ?? 0}
              options={[
                { value: 0, label: "Off" },
                { value: 5, label: "5 min" },
                { value: 10, label: "10 min" },
                { value: 20, label: "20 min" },
              ]}
              onChange={(v) => setSleep(v === 0 ? "off" : v)}
            />
          </div>
          <Slider label="Volume" value={Math.round(master * 100)} min={0} max={100} step={1} format={(v) => `${v}%`} onChange={(v) => patchUi({ master: v / 100 })} />
        </div>

        <h3 className="drawer-h">Sound</h3>
        <div className="flex flex-col gap-2">
          <div className="slider-row">
            <label htmlFor="scale" className="slider-label">
              Scale
            </label>
            <select id="scale" value={garden.scale} onChange={(e) => setGlobal({ scale: e.target.value as ScaleId })} className="row-select">
              {(Object.keys(SCALES) as ScaleId[]).map((s) => (
                <option key={s} value={s}>
                  {SCALE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <LiveSlider label="Key" value={garden.root} min={ROOT_RANGE.min} max={ROOT_RANGE.max} step={1} format={(v) => midiToName(v)} onCommit={(v) => setGlobal({ root: v })} />
          <LiveSlider label="Tempo" value={Math.round(garden.bpm)} min={BPM_RANGE.min} max={BPM_RANGE.max} step={1} format={(v) => `${v} bpm`} onCommit={(v) => setGlobal({ bpm: v })} />
          <LiveSlider label="Reverb" value={Math.round(garden.reverb * 100)} min={0} max={100} step={1} format={(v) => `${v}%`} onCommit={(v) => setGlobal({ reverb: v / 100 })} />
          <LiveSlider label="Drone" value={Math.round(garden.drone * 100)} min={0} max={100} step={1} format={(v) => `${v}%`} onCommit={(v) => setGlobal({ drone: v / 100 })} />
        </div>

        <h3 className="drawer-h">Mood</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={garden.preset === id}
              onClick={() => applyPreset(id)}
              className="preset-btn"
              title={PRESETS[id].description}
            >
              <span className="font-display text-lg leading-none">{PRESETS[id].name}</span>
              <span className="mt-1 block text-[11px] text-paper-500">{PRESETS[id].description}</span>
            </button>
          ))}
          <button type="button" onClick={startFresh} className="preset-btn" title="Back to the beginning: one bonsai, a new seed">
            <span className="text-sm">Start fresh</span>
            <span className="mt-1 block text-[11px] text-paper-500">back to one bonsai</span>
          </button>
        </div>

        <h3 className="drawer-h">Seed</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-700 px-3 py-2 font-mono text-sm text-paper-100" aria-label={`Seed ${garden.seed}`}>
            {garden.seed}
          </span>
          <button type="button" className="btn-quiet flex-1" onClick={newSeed} aria-keyshortcuts="R">
            New seed
          </button>
          <button type="button" className="btn-quiet flex-1" onClick={surpriseMe}>
            Surprise me
          </button>
        </div>
        <button type="button" className="btn-primary mt-3 w-full py-3" onClick={copyLink}>
          {copied ? "Link copied" : "Copy share link"}
        </button>
        <p className="mt-2 text-caption text-paper-500">The link holds the whole garden: same seed, same plants, same music.</p>

        <h3 className="drawer-h">Accessibility</h3>
        <Toggle
          label={osReduce ? "Reduce motion (on in your system)" : "Reduce motion"}
          checked={reduce || osReduce}
          onChange={(v) => patchUi({ reduceMotionToggle: v })}
          hint="No sway, particles or ripples"
        />
      </div>
    </FadePanel>
  );
}
