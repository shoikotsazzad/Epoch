"use client";

// Invisible, focusable buttons over each plant: Tab cycles plants, Enter opens the
// plant panel, click selects, drag moves (Pointer Events), arrows nudge (global handler).

import { useRef } from "react";
import { PLANT_LABELS, PLANT_RECURSION } from "@/core/params";
import { plantShortDesc } from "@/core/garden";

import { gardenStore, patchUi, uiStore, useStore } from "@/state/store";
import { boundsFor, updatePlant } from "@/state/actions";
import { clampToBounds } from "@/core/garden";
import { displayPos, ringRadius } from "@/visual/layout";
import { useWindowSize } from "./hooks";

export default function PlantOverlay() {
  const plants = useStore(gardenStore, (s) => s.plants);
  const selectedId = useStore(uiStore, (s) => s.selectedId);
  const xray = useStore(uiStore, (s) => s.xray);
  const { w, h } = useWindowSize();
  const drag = useRef<{ id: string; x0: number; y0: number; moved: boolean; raf: number } | null>(null);

  return (
    <div className="pointer-events-none fixed inset-0 z-10" aria-label="Plants in the garden" role="group">
      {plants.map((p) => {
        const R = ringRadius(p.kind, w, h);
        const pos = displayPos(p, w, h);
        return (
          <button
            key={p.id}
            type="button"
            data-plant-id={p.id}
            aria-pressed={selectedId === p.id}
            aria-label={`${PLANT_LABELS[p.kind]} (${PLANT_RECURSION[p.kind]}): ${plantShortDesc(p)}${p.muted ? ", muted" : ""}. Enter to tune, arrows to move, M to mute, Delete to remove.`}
            className="plant-hit pointer-events-auto"
            style={{ left: pos.x - R, top: pos.y - R, width: R * 2, height: R * 2, touchAction: "none" }}
            onFocus={() => !xray && patchUi({ selectedId: p.id })}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { id: p.id, x0: e.clientX, y0: e.clientY, moved: false, raf: 0 };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || xray) return;
              if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) d.moved = true;
              if (!d.moved) return;
              const x = e.clientX / window.innerWidth;
              const y = e.clientY / window.innerHeight;
              cancelAnimationFrame(d.raf);
              d.raf = requestAnimationFrame(() => updatePlant(d.id, clampToBounds(x, y, boundsFor(p.kind))));
            }}
            onPointerUp={() => {
              const d = drag.current;
              drag.current = null;
              if (d && !d.moved) {
                if (uiStore.get().xray) return;
                const ui = uiStore.get();
                const open = ui.selectedId === p.id && ui.panel === "plant";
                patchUi({ selectedId: p.id, panel: open ? null : "plant" });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                patchUi({ selectedId: p.id, panel: "plant" });
              }
            }}
          >
            {p.muted && <span className="plant-muted-tag">muted</span>}
          </button>
        );
      })}
    </div>
  );
}
