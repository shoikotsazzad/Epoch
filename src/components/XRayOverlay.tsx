"use client";

// X-ray call stack: time is frozen; step through the recorded trace and hear each call.

import { useEffect, useMemo, useRef } from "react";
import { PLANT_LABELS, PLANT_RECURSION } from "@/core/params";
import { buildSteps, describeFrame, describeStep, stackAt, treeLayout } from "@/core/xray";
import { gardenStore, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { ChevronLeft, ChevronRight } from "./icons";
import { FadePanel, PanelHeader } from "./ui";

const TREE_MAX = 600;

export default function XRayOverlay() {
  const xray = useStore(uiStore, (s) => s.xray);
  const plantId = useStore(uiStore, (s) => s.xrayPlantId);
  const tick = useStore(uiStore, (s) => s.xrayTick);
  const plants = useStore(gardenStore, (s) => s.plants);
  const seed = useStore(gardenStore, (s) => s.seed);
  const scale = useStore(gardenStore, (s) => s.scale);
  const plant = plants.find((p) => p.id === plantId) ?? null;
  const panelRef = useRef<HTMLDivElement>(null);

  // grow results are cached in the runtime; recompute only when the plant changes
  const grow = useMemo(
    () => (plant ? getRuntime().growFor(plant.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plant, seed, scale],
  );
  const steps = useMemo(() => (grow ? buildSteps(grow.trace) : []), [grow]);
  const layout = useMemo(() => (grow && grow.trace.length <= TREE_MAX ? treeLayout(grow.trace) : null), [grow]);

  useEffect(() => {
    if (xray) setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-step-next]")?.focus(), 80);
  }, [xray]);

  const step = steps[Math.min(tick, steps.length - 1)];
  const stack = grow && step ? stackAt(grow.trace, steps, tick) : [];
  const frame = grow && step ? grow.trace[step.frameId] : null;
  const stackIds = new Set(stack.map((f) => f.id));
  const memoHits = grow ? grow.trace.filter((f) => f.memoHit).length : 0;
  const rt = getRuntime();

  return (
    <FadePanel
      show={xray}
      label="X-ray call stack"
      id="xray-panel"
      className="fixed inset-x-3 bottom-3 z-30 max-h-[62dvh] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-24 sm:w-[380px] sm:max-h-[calc(100dvh-8rem)]"
    >
      <div ref={panelRef}>
        <PanelHeader
          title="X-ray: call stack"
          subtitle="Time is frozen. Step through the recursion and hear each call."
          onClose={() => rt.exitXray()}
        />
        {plants.length > 1 && (
          <div role="radiogroup" aria-label="Plant to inspect" className="mb-3 flex flex-wrap gap-1.5">
            {plants.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={p.id === plantId}
                onClick={() => rt.xraySelect(p.id)}
                className="segmented-item rounded-full border border-slate-700 px-3"
              >
                {PLANT_LABELS[p.kind]}
              </button>
            ))}
          </div>
        )}
        {!plant || !grow || !step || !frame ? (
          <p className="text-paper-300">Plant a seed first, then press X to see its recursion.</p>
        ) : (
          <>
            <p className="text-[12px] uppercase tracking-[0.08em] text-paper-500">
              {PLANT_LABELS[plant.kind]} · {PLANT_RECURSION[plant.kind]} · step {tick + 1} of {steps.length}
            </p>
            <p aria-live="polite" className="mt-1 rounded-lg bg-ink-800 px-3 py-2 font-mono text-[13px] text-paper-100">
              {describeStep(step, frame)}
              {frame.memoHit ? <span className="ml-2 rounded border border-sea-300 px-1 text-[11px] text-sea-300">memo</span> : null}
            </p>

            <div className="mt-3 flex items-center gap-2" role="group" aria-label="Step through the trace">
              <button type="button" className="btn-quiet px-3" onClick={() => rt.xrayGo("home")} aria-keyshortcuts="Home">
                Start
              </button>
              <button type="button" className="icon-btn border border-slate-700" aria-label="Previous step" aria-keyshortcuts="ArrowLeft" onClick={() => rt.xrayGo(-1, true)}>
                <ChevronLeft />
              </button>
              <button
                type="button"
                data-step-next
                className="icon-btn border border-lantern-400/60 text-lantern-400"
                aria-label="Next step"
                aria-keyshortcuts="ArrowRight"
                onClick={() => rt.xrayGo(1, true)}
              >
                <ChevronRight />
              </button>
              <button type="button" className="btn-quiet px-3" onClick={() => rt.xrayGo("end")} aria-keyshortcuts="End">
                End
              </button>
            </div>

            <h3 className="drawer-h">Stack ({stack.length} frame{stack.length === 1 ? "" : "s"})</h3>
            <ol className="flex flex-col-reverse gap-1" aria-label="Call stack, innermost call first">
              {stack.map((f, i) => {
                const top = i === stack.length - 1;
                return (
                  <li
                    key={f.id}
                    className={`rounded-md border px-2 py-1 font-mono text-[12px] ${top ? "border-lantern-400 text-paper-100" : "border-slate-700 text-paper-300"}`}
                    style={{ marginLeft: Math.min(f.depth, 8) * 8 }}
                  >
                    {describeFrame(f)}
                    {f.memoHit ? " · memo" : ""}
                    {top ? <span className="sr-only"> (current)</span> : null}
                  </li>
                );
              })}
            </ol>

            {layout && (
              <>
                <h3 className="drawer-h">Call tree ({grow.trace.length} calls{plant.kind === "sunflower" ? `, ${memoHits} memo hits` : ""})</h3>
                <svg viewBox="-4 -4 328 128" className="w-full" role="img" aria-label={`Call tree with ${grow.trace.length} calls. Current call is highlighted.`}>
                  {grow.trace.map((f) =>
                    f.parentId === null ? null : (
                      <line
                        key={`e${f.id}`}
                        x1={layout[f.parentId].x * 320}
                        y1={layout[f.parentId].y * 120}
                        x2={layout[f.id].x * 320}
                        y2={layout[f.id].y * 120}
                        stroke={stackIds.has(f.id) ? "#e7e0d1" : f.exitIndex <= tick ? "#6e9396" : "#3e5d62"}
                        strokeWidth={stackIds.has(f.id) ? 1.6 : 0.8}
                        strokeDasharray={f.memoHit ? "2 2" : undefined}
                      />
                    ),
                  )}
                  {grow.trace.map((f) => (
                    <circle
                      key={`n${f.id}`}
                      cx={layout[f.id].x * 320}
                      cy={layout[f.id].y * 120}
                      r={f.id === frame.id ? 4 : grow.trace.length > 120 ? 1.3 : 2.4}
                      fill={f.id === frame.id ? "#e8aa62" : stackIds.has(f.id) ? "#e7e0d1" : f.enterIndex <= tick ? "#6e9396" : "#22313a"}
                      stroke={f.memoHit ? "#9ebdbb" : "none"}
                      strokeDasharray={f.memoHit ? "1.5 1.5" : undefined}
                    />
                  ))}
                </svg>
                <p className="mt-1 text-caption text-paper-500">
                  Amber = current call · light = on the stack · teal = finished{plant.kind === "sunflower" ? " · dashed = memo hit (pruned branch)" : ""}
                </p>
              </>
            )}
            <p className="mt-3 text-caption text-paper-500">
              <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> step · <kbd className="kbd">Home</kbd>/<kbd className="kbd">End</kbd> jump ·{" "}
              <kbd className="kbd">[</kbd> <kbd className="kbd">]</kbd> plant · <kbd className="kbd">X</kbd> or <kbd className="kbd">Esc</kbd> resume music
            </p>
          </>
        )}
      </div>
    </FadePanel>
  );
}
