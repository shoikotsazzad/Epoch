"use client";

import { useEffect, useRef } from "react";
import { LOOP_SECONDS_RANGE, PARAM_SPECS, PLANT_LABELS, PLANT_RECURSION, PLANT_ROLE } from "@/core/params";
import { VOICINGS } from "@/core/recursions/sierpinski";
import type { Plant } from "@/core/types";
import { removePlant, toggleMute, updateParams, updatePlant } from "@/state/actions";
import { gardenStore, patchUi, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { FadePanel, LiveSlider, PanelHeader, Toggle } from "./ui";

const EXPLAIN: Record<Plant["kind"], string> = {
  bonsai:
    "branch() calls itself for every child branch. Deeper calls play higher, softer and shorter notes; entering a call adds tension, returning resolves home.",
  rain: "cantor() keeps the two outer thirds and drops the middle. The surviving pieces at the deepest level are soft drops; the gaps are rests.",
  stones:
    "sierpinski() splits a triangle into three corners. The order of corners is the melody, and each outer corner is one voice of a three-voice canon.",
  sunflower:
    "fib(n) = fib(n−1) + fib(n−2), remembered in a memo. Each finished call rings a bell and lights a seed on the golden-angle spiral.",
};

export default function PlantPanel() {
  const panel = useStore(uiStore, (s) => s.panel);
  const selectedId = useStore(uiStore, (s) => s.selectedId);
  const plant = useStore(gardenStore, (s) => s.plants.find((p) => p.id === selectedId) ?? null);
  const show = panel === "plant" && !!plant;
  const firstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) setTimeout(() => firstRef.current?.querySelector<HTMLElement>("input,button")?.focus(), 50);
  }, [show, selectedId]);

  if (!plant) return <FadePanel show={false} label="Plant">{null}</FadePanel>;
  const params = plant.params as unknown as Record<string, number>;
  const calls = getRuntime().growFor(plant.id)?.trace.length ?? 0;

  const plantId = plant.id;
  const setParam = (key: string, v: number) => updateParams(plantId, { [key]: v } as never);

  const close = () => {
    patchUi({ panel: null });
    document.querySelector<HTMLElement>(`[data-plant-id="${plant.id}"]`)?.focus();
  };

  const specs = PARAM_SPECS[plant.kind];
  const main = specs.filter((s) => s.main);
  const more = specs.filter((s) => !s.main);
  const fmt = (key: string, v: number) => {
    if (plant.kind === "stones" && key === "voicing") return VOICINGS[v]?.name ?? String(v);
    const s = specs.find((x) => x.key === key)!;
    if (key === "removed") return `${Math.round(v * 100)}%`;
    if (key === "spread") return `${v}°`;
    return s.integer ? String(v) : v.toFixed(2);
  };

  return (
    <FadePanel
      show={show}
      label={`${PLANT_LABELS[plant.kind]} settings`}
      id="plant-panel"
      className="fixed inset-x-3 bottom-3 z-30 max-h-[70dvh] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-24 sm:w-[340px] sm:max-h-[calc(100dvh-8rem)]"
    >
      <div ref={firstRef}>
        <PanelHeader
          title={PLANT_LABELS[plant.kind]}
          subtitle={`${PLANT_RECURSION[plant.kind]} · ${PLANT_ROLE[plant.kind]} · ${calls} recursive calls`}
          onClose={close}
        />
        <p className="mb-4 text-[13px] leading-relaxed text-paper-300">{EXPLAIN[plant.kind]}</p>
        <div className="flex flex-col gap-2">
          {main.map((s) => (
            <LiveSlider
              key={`${plant.id}-${s.key}`}
              label={s.label}
              value={params[s.key]}
              min={s.min}
              max={s.max}
              step={s.step}
              hint={s.hint}
              format={(v) => fmt(s.key, v)}
              onCommit={(v) => setParam(s.key, v)}
            />
          ))}
          <LiveSlider
            label="Volume"
            value={Math.round(plant.volume * 100)}
            min={0}
            max={100}
            step={1}
            format={(v) => `${v}%`}
            onCommit={(v) => updatePlant(plantId, { volume: v / 100 })}
          />
        </div>
        <details className="mt-3 group">
          <summary className="cursor-pointer select-none rounded-md py-2 text-[12px] uppercase tracking-[0.08em] text-paper-500 hover:text-paper-300">
            More
          </summary>
          <div className="mt-1 flex flex-col gap-2">
            {more.map((s) => (
              <LiveSlider
                key={`${plant.id}-${s.key}`}
                label={s.label}
                value={params[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                hint={s.hint}
                format={(v) => fmt(s.key, v)}
                onCommit={(v) => setParam(s.key, v)}
              />
            ))}
            <LiveSlider
              label="Loop"
              value={plant.loopSeconds}
              min={LOOP_SECONDS_RANGE.min}
              max={LOOP_SECONDS_RANGE.max}
              step={1}
              hint="Cycle length in seconds. Different lengths drift against each other."
              format={(v) => `${v}s`}
              onCommit={(v) => updatePlant(plantId, { loopSeconds: v })}
            />
          </div>
        </details>
        <div className="mt-4 flex flex-col gap-2">
          <Toggle label="Mute" checked={plant.muted} onChange={() => toggleMute(plant.id)} hint="Shortcut M" />
          <button type="button" onClick={() => removePlant(plant.id)} className="btn-quiet w-full" aria-keyshortcuts="Delete">
            Remove plant
          </button>
        </div>
      </div>
    </FadePanel>
  );
}
