"use client";

import { patchUi, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { DownloadIcon, PauseIcon, PlayIcon, SlidersIcon } from "./icons";
import { IconButton } from "./ui";
import MoodMenu from "./MoodMenu";
import BrandMark from "./BrandMark";

export default function TopBar() {
  const playing = useStore(uiStore, (s) => s.playing);
  const started = useStore(uiStore, (s) => s.started);
  const panel = useStore(uiStore, (s) => s.panel);
  const helpSeen = useStore(uiStore, (s) => s.helpSeen);
  const recording = useStore(uiStore, (s) => s.recording);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
      <div className="pointer-events-auto flex select-none items-center gap-3">
        <BrandMark size={36} className="shrink-0" />
        <div>
          <h1 className="whitespace-nowrap font-display text-xl font-medium leading-tight tracking-wide text-paper-300 sm:text-[28px]">Stack Garden</h1>
          <p className="hidden whitespace-nowrap text-caption text-paper-300/90 sm:block">four recursions, one garden</p>
        </div>
      </div>
      <nav aria-label="Main controls" className="pointer-events-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {/* "How to use" lives in the top bar on wide screens, inside Settings below 768 px */}
        <button
          type="button"
          onClick={() => patchUi({ panel: panel === "help" ? null : "help" })}
          aria-expanded={panel === "help"}
          aria-controls="help-panel"
          aria-keyshortcuts="H"
          className={`help-trigger hidden h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-[14px] transition-colors duration-500 ease-calm md:inline-flex ${
            panel === "help" ? "bg-ink-800 text-paper-100" : "text-sea-300 hover:bg-ink-800 hover:text-paper-100"
          }`}
        >
          <span aria-hidden className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold leading-none">
            ?
            {!helpSeen && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-lantern-400 shadow-[0_0_8px_var(--color-lantern-400)]" />}
          </span>
          How to use
          {!helpSeen && <span className="sr-only"> (new here? start here)</span>}
        </button>
        <MoodMenu />
        <IconButton
          label={playing ? "Pause" : "Play"}
          shortcut="Space"
          disabled={!started}
          onClick={() => getRuntime().setPlaying(!playing)}
          className="icon-btn-round"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <IconButton
          label="Export audio"
          shortcut="E"
          disabled={!started}
          expanded={panel === "export"}
          controls="export-dialog"
          onClick={() => patchUi({ panel: panel === "export" ? null : "export" })}
          className={recording ? "text-lantern-400" : ""}
        >
          <DownloadIcon />
        </IconButton>
        <button
          type="button"
          aria-expanded={panel === "menu"}
          aria-controls="menu-drawer"
          title="Settings: X-ray, breathing guide, sleep timer, sound, share link"
          onClick={() => patchUi({ panel: panel === "menu" ? null : "menu" })}
          className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 text-[14px] transition-colors duration-500 ease-calm ${
            panel === "menu" ? "bg-ink-800 text-paper-100" : "text-sea-300 hover:bg-ink-800 hover:text-paper-100"
          }`}
        >
          <SlidersIcon />
          <span className="hidden lg:inline">Settings</span>
          <span className="sr-only lg:hidden">Settings</span>
        </button>
      </nav>
    </header>
  );
}
