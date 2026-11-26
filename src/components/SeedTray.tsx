"use client";

// Drag a seed into the garden (Pointer Events: mouse + touch), click it, or press 1–4.

import { useRef } from "react";
import type { PlantKind } from "@/core/types";
import { PLANT_LABELS, PLANT_RECURSION, PLANT_ROLE } from "@/core/params";
import { plantSeed } from "@/state/actions";
import { patchUi, uiStore, useStore } from "@/state/store";
import { BonsaiGlyph, RainGlyph, StonesGlyph, SunflowerGlyph } from "./icons";

const SEEDS: { kind: PlantKind; key: string; Glyph: typeof BonsaiGlyph }[] = [
  { kind: "bonsai", key: "1", Glyph: BonsaiGlyph },
  { kind: "rain", key: "2", Glyph: RainGlyph },
  { kind: "stones", key: "3", Glyph: StonesGlyph },
  { kind: "sunflower", key: "4", Glyph: SunflowerGlyph },
];

export default function SeedTray() {
  const started = useStore(uiStore, (s) => s.started);
  const ghost = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: PlantKind; x0: number; y0: number; moved: boolean } | null>(null);
  const tray = useRef<HTMLDivElement>(null);

  const onDown = (kind: PlantKind) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { kind, x0: e.clientX, y0: e.clientY, moved: false };
  };
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) {
      d.moved = true;
      patchUi({ dragKind: d.kind });
    }
    if (d.moved && ghost.current) {
      ghost.current.style.opacity = "1";
      ghost.current.style.transform = `translate(${e.clientX - 22}px, ${e.clientY - 22}px)`;
    }
  };
  const onUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (ghost.current) ghost.current.style.opacity = "0";
    patchUi({ dragKind: null });
    if (!d || !d.moved) return; // a plain click is handled by onClick
    const trayRect = tray.current?.getBoundingClientRect();
    const overTray = trayRect && e.clientY > trayRect.top - 8;
    if (overTray) return;
    plantSeed(d.kind, { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
  };

  return (
    <>
      <div
        ref={tray}
        role="toolbar"
        aria-label="Seed tray: plant a recursion"
        className="pointer-events-auto flex items-stretch justify-center gap-1 rounded-[22px] border border-slate-700 bg-ink-900/70 p-1.5 backdrop-blur-[8px] sm:gap-2"
      >
        {SEEDS.map(({ kind, key, Glyph }) => (
          <button
            key={kind}
            type="button"
            disabled={!started}
            onPointerDown={onDown(kind)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => {
              drag.current = null;
              patchUi({ dragKind: null });
              if (ghost.current) ghost.current.style.opacity = "0";
            }}
            onClick={(e) => {
              if (e.detail === 0 || !uiStore.get().dragKind) plantSeed(kind);
              // after a mouse/touch click, drop focus so Space goes back to play/pause
              if (e.detail > 0) e.currentTarget.blur();
            }}
            aria-keyshortcuts={key}
            aria-label={`Plant ${PLANT_LABELS[kind]}: ${PLANT_RECURSION[kind]}, plays ${PLANT_ROLE[kind].toLowerCase()}. Shortcut ${key}.`}
            className="seed-btn"
            style={{ touchAction: "none" }}
          >
            <Glyph width={22} height={22} />
            <span className="text-[12px] font-medium text-paper-300">{PLANT_LABELS[kind]}</span>
            <span className="hidden text-[10px] uppercase tracking-[0.08em] text-paper-500 sm:block">{PLANT_ROLE[kind]}</span>
            <kbd className="kbd absolute right-1.5 top-1.5 hidden sm:block">{key}</kbd>
          </button>
        ))}
      </div>
      <div
        ref={ghost}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-lantern-400/70 bg-ink-900/80 text-lantern-400 opacity-0 transition-opacity duration-300"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <circle cx="5" cy="5" r="4" fill="currentColor" />
        </svg>
      </div>
    </>
  );
}
