"use client";

import { patchUi, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { useEffect, useState } from "react";
import { DownloadIcon, MoonIcon, PauseIcon, PlayIcon, SlidersIcon } from "./icons";
import { IconButton } from "./ui";
import MoodMenu from "./MoodMenu";
import BrandMark from "./BrandMark";
import { closeAll } from "@/state/actions";

/** Desktop only: a quiet countdown while the sleep timer runs. Opens Settings, where it can be changed or turned off. */
function SleepPill() {
  const sleepEndsAt = useStore(uiStore, (s) => s.sleepEndsAt);
  const panel = useStore(uiStore, (s) => s.panel);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!sleepEndsAt) return;
    const tick = () => setNow(performance.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [sleepEndsAt]);
  if (!sleepEndsAt || !now) return null;
  const left = Math.max(0, Math.round((sleepEndsAt - now) / 1000));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const windingDown = left <= 60;
  return (
    <button
      type="button"
      onClick={() => patchUi({ panel: panel === "menu" ? null : "menu" })}
      aria-controls="menu-drawer"
      aria-expanded={panel === "menu"}
      title="Sleep timer: open Settings to change or stop it"
      className={`hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[14px] tabular-nums transition-colors duration-500 ease-calm lg:inline-flex ${
        windingDown ? "border-lantern-400/50 text-lantern-400" : "border-slate-700 text-sea-300 hover:bg-ink-800 hover:text-paper-100"
      }`}
    >
      <MoonIcon width={17} height={17} />
      <span>Sleep</span>{" "}
      <span className="text-paper-100">
        {mm}:{ss}
      </span>
      <span className="sr-only"> left on the sleep timer{windingDown ? ", winding down" : ""} (open Settings)</span>
    </button>
  );
}

export default function TopBar() {
  const playing = useStore(uiStore, (s) => s.playing);
  const started = useStore(uiStore, (s) => s.started);
  const panel = useStore(uiStore, (s) => s.panel);
  const helpSeen = useStore(uiStore, (s) => s.helpSeen);
  const recording = useStore(uiStore, (s) => s.recording);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-start sm:p-6">
      <h1 className="sr-only">Stack Garden</h1>
      {/* home: logo + title close every open bar and leave X-ray */}
      <button
        type="button"
        onClick={() => closeAll()}
        title="Stack Garden: back to the garden"
        className="group pointer-events-auto flex min-w-0 select-none items-center gap-2.5 rounded-full pr-2 text-left sm:gap-3"
      >
        {/* brightened mark with a soft moonlight ring, sized to the two-line title on desktop */}
        <BrandMark
          size={48}
          className="h-9 w-9 shrink-0 brightness-[1.12] shadow-[0_0_0_1px_rgb(231_224_209/0.32),0_0_14px_rgb(231_224_209/0.14)] transition-[box-shadow,filter] duration-500 group-hover:brightness-[1.25] group-hover:shadow-[0_0_0_1px_rgb(231_224_209/0.5),0_0_20px_rgb(231_224_209/0.24)] sm:h-11.5 sm:w-11.5"
        />
        <span className="min-w-0 max-[359px]:hidden">
          <span className="block truncate whitespace-nowrap font-display text-[19px] font-medium leading-tight tracking-wide text-paper-100 sm:text-[28px] sm:text-paper-300 sm:transition-colors sm:duration-500 sm:group-hover:text-paper-100">
            Stack Garden
          </span>
          <span className="hidden whitespace-nowrap text-caption text-paper-300/90 sm:block">a recursive tree that sings</span>
        </span>
        {/* accessible name = the visible title (+ subtitle) + what the button does; the title is hidden below 360 px */}
        <span className="sr-only min-[360px]:hidden">Stack Garden</span>
        <span className="sr-only"> (home: close open panels)</span>
      </button>
      <nav aria-label="Main controls" className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
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
        <SleepPill />
        {/* on phones Mood lives in Settings, keeping the bar calm */}
        <div className="hidden sm:block">
          <MoodMenu />
        </div>
        <IconButton
          label={playing ? "Pause" : "Play"}
          shortcut="Space"
          disabled={!started}
          onClick={() => getRuntime().setPlaying(!playing)}
          className="icon-btn-round h-11 w-11 sm:h-12 sm:w-12"
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
          className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-700 px-2.5 text-[14px] sm:border-0 sm:px-3 transition-colors duration-500 ease-calm ${
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
