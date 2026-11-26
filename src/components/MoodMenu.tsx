"use client";

// Mood picker for the top bar (replaces the native <select>).
// - It is one of the top-bar panels (ui.panel === "mood"), so opening it closes
//   any other panel and opening another panel closes it: nothing overlaps.
// - Opens BELOW the bar; the list scrolls inside its own box, so items slide
//   under the box's top edge and never over the navbar.
// - Keyboard: ↑/↓, Home/End, Enter/Space, Esc (WAI-ARIA menu pattern).
// Styled with utility classes only, so it renders the same in dev and production.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { PRESETS, PRESET_ORDER } from "@/core/presets";
import type { PresetId } from "@/core/types";
import { applyPreset, startFresh } from "@/state/actions";
import { gardenStore, patchUi, uiStore, useStore } from "@/state/store";
import { paletteVariants } from "@/visual/tokens";
import { EASE, useCalmMotion } from "./ui";

type Item = { kind: "mood"; id: PresetId } | { kind: "fresh" };
const ITEMS: Item[] = [...PRESET_ORDER.map((id) => ({ kind: "mood" as const, id })), { kind: "fresh" }];

const ITEM =
  "flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left outline-offset-[-2px] transition-colors duration-300 hover:bg-ink-800 focus-visible:bg-ink-800 min-h-[56px]";

function Swatch({ id }: { id: PresetId }) {
  const pal = paletteVariants[PRESETS[id].palette];
  return (
    <span
      aria-hidden
      className="relative inline-block h-8 w-8 shrink-0 rounded-full border border-slate-700"
      style={{ background: `repeating-radial-gradient(circle at 50% 50%, ${pal.ground} 0 3px, rgba(158,189,187,0.2) 3px 4px)` }}
    >
      <span
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: pal.accent, boxShadow: `0 0 8px ${pal.accent}` }}
      />
    </span>
  );
}

export default function MoodMenu() {
  const preset = useStore(gardenStore, (s) => s.preset);
  const open = useStore(uiStore, (s) => s.panel === "mood");
  const [active, setActive] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useCalmMotion();
  const menuId = useId();

  const openMenu = (focusIndex?: number) => {
    setActive(focusIndex ?? Math.max(0, PRESET_ORDER.indexOf(preset)));
    patchUi({ panel: "mood" }); // closes whatever else was open
  };
  const close = (refocus = true) => {
    if (uiStore.get().panel === "mood") patchUi({ panel: null });
    if (refocus) btn.current?.focus();
  };

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus({ preventScroll: false });
  }, [open, active]);

  // click outside closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t) && uiStore.get().panel === "mood") patchUi({ panel: null });
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const choose = (item: Item) => {
    if (item.kind === "mood") applyPreset(item.id);
    else startFresh();
    close();
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // garden shortcuts (1–4, X …) stay out of the menu
    const n = ITEMS.length;
    if (e.key === "ArrowDown") setActive((a) => (a + 1) % n);
    else if (e.key === "ArrowUp") setActive((a) => (a - 1 + n) % n);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") close(false);
    else return;
    if (e.key !== "Tab") e.preventDefault();
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            openMenu(e.key === "ArrowUp" ? ITEMS.length - 1 : undefined);
          }
        }}
        className={`inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border pl-4 pr-3 text-sea-300 transition-colors duration-500 ease-calm ${
          open ? "border-sea-400 bg-ink-800" : "border-slate-700 bg-ink-900/80 hover:border-sea-400 hover:bg-ink-800"
        }`}
      >
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-paper-500 lg:inline">Mood</span>
        <span className="sr-only lg:hidden">Mood</span>{" "}
        <span className="max-w-[6rem] truncate font-display text-[18px] leading-none text-paper-100 sm:max-w-none">{PRESETS[preset].name}</span>
        <span className="sr-only">, change mood</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden
          className={`shrink-0 transition-transform duration-500 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            id={menuId}
            role="menu"
            aria-label="Choose a mood"
            onKeyDown={onMenuKey}
            initial={{ opacity: 0, y: reduced ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -6 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed right-3 top-[76px] z-40 flex w-[min(330px,calc(100vw-24px))] flex-col overflow-hidden rounded-[22px] border border-slate-700 bg-ink-900/95 shadow-[0_20px_60px_rgb(0_0_0/0.45)] backdrop-blur-[8px] sm:absolute sm:right-0 sm:top-[calc(100%+10px)]"
          >
            {/* fixed header: list items scroll underneath it and disappear at the box edge */}
            <p className="border-b border-slate-700/70 px-5 pb-2.5 pt-3.5 text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500">
              Mood · scale, tempo &amp; colour
            </p>
            <div className="panel-scroll max-h-[min(340px,calc(100dvh-150px))] overflow-y-auto overscroll-contain p-2">
              {ITEMS.map((item, i) => {
                if (item.kind === "fresh")
                  return (
                    <div key="fresh">
                      <div className="mx-3 my-2 h-px bg-slate-700" role="separator" />
                      <button
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                        type="button"
                        role="menuitem"
                        tabIndex={active === i ? 0 : -1}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(item)}
                        className={ITEM}
                      >
                        <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 text-sea-300">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 0 1-13.7 5.6L4 15.3M4 20v-4.7h4.7" />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] text-paper-100">Start fresh</span>
                          <span className="block text-[12px] leading-snug text-paper-500">
                            Back to the beginning: one bonsai, a new seed
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                const p = PRESETS[item.id];
                const selected = item.id === preset;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    tabIndex={active === i ? 0 : -1}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={`${ITEM} ${selected ? "bg-lantern-400/10 shadow-[inset_0_0_0_1px_rgb(232_170_98/0.45)]" : ""}`}
                  >
                    <Swatch id={item.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[19px] leading-tight text-paper-100">{p.name}</span>
                      <span className="block text-[12px] leading-snug text-paper-500">{p.description}</span>
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className={`shrink-0 text-lantern-400 ${selected ? "opacity-100" : "opacity-0"}`}
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
