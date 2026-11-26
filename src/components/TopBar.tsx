"use client";

import { PRESETS, PRESET_ORDER } from "@/core/presets";
import type { PresetId } from "@/core/types";
import { applyPreset } from "@/state/actions";
import { gardenStore, patchUi, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { DownloadIcon, MoreIcon, PauseIcon, PlayIcon } from "./icons";
import { IconButton } from "./ui";

export default function TopBar() {
  const playing = useStore(uiStore, (s) => s.playing);
  const started = useStore(uiStore, (s) => s.started);
  const panel = useStore(uiStore, (s) => s.panel);
  const preset = useStore(gardenStore, (s) => s.preset);
  const recording = useStore(uiStore, (s) => s.recording);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
      <div className="pointer-events-auto select-none">
        <h1 className="whitespace-nowrap font-display text-xl font-medium tracking-wide text-paper-300 sm:text-[28px]">Stack Garden</h1>
        <p className="hidden text-caption text-paper-500 sm:block">four recursions, one garden</p>
      </div>
      <nav aria-label="Main controls" className="pointer-events-auto flex items-center gap-1 sm:gap-2">
        <label className="sr-only" htmlFor="mood">
          Mood preset
        </label>
        <select
          id="mood"
          value={preset}
          onChange={(e) => applyPreset(e.target.value as PresetId)}
          className="mood-select max-w-[6.5rem] sm:max-w-none"
          title="Mood: scale, tempo and colour"
        >
          {PRESET_ORDER.map((id) => (
            <option key={id} value={id}>
              {PRESETS[id].name}
            </option>
          ))}
        </select>
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
        <IconButton
          label="More: X-ray, breathing, sleep timer, settings"
          expanded={panel === "menu"}
          controls="menu-drawer"
          onClick={() => patchUi({ panel: panel === "menu" ? null : "menu" })}
        >
          <MoreIcon />
        </IconButton>
      </nav>
    </header>
  );
}
