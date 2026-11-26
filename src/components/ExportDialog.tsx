"use client";

import { useEffect, useRef, useState } from "react";
import { encodeWav, peaks } from "@/export/wav";
import { encodeMp3 } from "@/export/mp3";
import { downloadBlob, exportFilename, formatDuration } from "@/export/download";
import { pickRecorderFormat } from "@/export/recorder";
import { gardenStore, patchUi, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";
import { FadePanel, PanelHeader, Segmented } from "./ui";
import { RecordIcon } from "./icons";

type Format = "wav" | "mp3";
type Phase = { kind: "idle" } | { kind: "render"; p: number; label: string } | { kind: "done"; summary: string; peaks: number[]; filename: string; blob: Blob } | { kind: "error"; message: string };

export default function ExportDialog() {
  const panel = useStore(uiStore, (s) => s.panel);
  const recording = useStore(uiStore, (s) => s.recording);
  const show = panel === "export";
  const [format, setFormat] = useState<Format>("wav");
  const [minutes, setMinutes] = useState(3);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [recStart, setRecStart] = useState(0);
  const [recNow, setRecNow] = useState(0);
  const wave = useRef<HTMLCanvasElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const recFormat = typeof window !== "undefined" ? pickRecorderFormat() : null;

  useEffect(() => {
    if (show) setTimeout(() => ref.current?.querySelector<HTMLElement>("button")?.focus(), 50);
  }, [show]);
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecNow(performance.now()), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (phase.kind !== "done" || !wave.current) return;
    const c = wave.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const w = c.clientWidth;
    const h = c.clientHeight;
    const max = Math.max(0.0001, ...phase.peaks);
    ctx.fillStyle = "#6e9396";
    phase.peaks.forEach((p, i) => {
      const x = (i / phase.peaks.length) * w;
      const bh = Math.max(1, (p / max) * h * 0.9);
      ctx.fillRect(x, (h - bh) / 2, Math.max(1, w / phase.peaks.length - 1), bh);
    });
  }, [phase]);

  const render = async () => {
    const g = gardenStore.get();
    const seconds = minutes * 60;
    setPhase({ kind: "render", p: 0, label: "Growing the garden offline…" });
    try {
      const buffer = await getRuntime().renderExport(seconds, (p) => setPhase({ kind: "render", p: p * (format === "mp3" ? 0.7 : 0.95), label: p < 0.85 ? "Growing the garden offline…" : "Mixing the final sound…" }));
      let blob: Blob;
      if (format === "mp3") {
        setPhase({ kind: "render", p: 0.7, label: "Encoding MP3…" });
        blob = await encodeMp3(buffer, (p) => setPhase({ kind: "render", p: 0.7 + p * 0.3, label: "Encoding MP3…" }));
      } else blob = encodeWav(buffer);
      const filename = exportFilename(g, `${minutes}min`, format);
      const calls = getRuntime().allGrows().reduce((n, r) => n + r.trace.length, 0);
      const summary = `${g.plants.length} plant${g.plants.length === 1 ? "" : "s"} · ${calls} recursive calls · ${formatDuration(seconds)}`;
      setPhase({ kind: "done", summary, peaks: peaks(buffer), filename, blob });
      downloadBlob(blob, filename);
    } catch (e) {
      console.error(e);
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "Export failed" });
    }
  };

  const toggleRecord = async () => {
    const rt = getRuntime();
    if (!recording) {
      if (rt.startRecording()) {
        const t = performance.now();
        setRecStart(t);
        setRecNow(t);
      }
      else setPhase({ kind: "error", message: "Recording is not supported in this browser. Use Render instead." });
      return;
    }
    const res = await rt.stopRecording();
    if (res) downloadBlob(res.blob, exportFilename(gardenStore.get(), `session-${Math.round(res.seconds)}s`, res.ext));
  };

  const busy = phase.kind === "render";
  return (
    <FadePanel
      show={show}
      label="Export audio"
      id="export-dialog"
      from="top"
      className="fixed inset-x-2 top-[64px] bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 overflow-y-auto max-sm:bg-ink-900 sm:inset-x-auto sm:right-6 sm:top-20 sm:bottom-auto sm:w-[380px] sm:max-h-[calc(100dvh-6rem)]"
    >
      <div ref={ref}>
        <PanelHeader title="Export" subtitle="Download the composition your garden is making." onClose={() => patchUi({ panel: null })} />
        <div className="flex flex-col gap-3">
          <Segmented label="Format" value={format} options={[{ value: "wav", label: "WAV (lossless)" }, { value: "mp3", label: "MP3 (176 kbps)" }]} onChange={setFormat} />
          <Segmented label="Length" value={minutes} options={[{ value: 1, label: "1 min" }, { value: 3, label: "3 min" }, { value: 5, label: "5 min" }]} onChange={setMinutes} />
          <button type="button" className="btn-primary w-full py-3" onClick={render} disabled={busy}>
            {busy ? "Rendering…" : `Render ${minutes} min ${format.toUpperCase()}`}
          </button>
          <p className="text-caption text-paper-500">Rendered offline from the same seed and engine, so it sounds just like what you hear, with a gentle fade at the end.</p>

          {phase.kind === "render" && (
            <div role="status" aria-live="polite">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(phase.p * 100)} aria-label="Export progress">
                <div className="h-full rounded-full bg-lantern-400 transition-[width] duration-300" style={{ width: `${Math.max(3, phase.p * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-caption text-paper-300">
                {phase.label} {Math.round(phase.p * 100)}%
              </p>
            </div>
          )}
          {phase.kind === "done" && (
            <div className="rounded-xl border border-slate-700 p-3" role="status">
              <canvas ref={wave} className="h-12 w-full" aria-hidden />
              <p className="mt-2 text-sm text-paper-100">{phase.summary}</p>
              <p className="mt-0.5 break-all font-mono text-[11px] text-paper-500">{phase.filename}</p>
              <button type="button" className="btn-quiet mt-2 w-full" onClick={() => downloadBlob(phase.blob, phase.filename)}>
                Download again
              </button>
            </div>
          )}
          {phase.kind === "error" && (
            <p role="alert" className="text-sm text-lantern-400">
              {phase.message}
            </p>
          )}

          <h3 className="drawer-h">Record this session</h3>
          <button type="button" className={`btn-quiet flex w-full items-center justify-center gap-2 ${recording ? "border-lantern-400 text-lantern-400" : ""}`} onClick={toggleRecord} disabled={!recFormat}>
            <RecordIcon width={16} height={16} />
            {recording ? `Stop & save (${formatDuration(Math.max(0, recNow - recStart) / 1000)})` : "Start recording"}
          </button>
          <p className="text-caption text-paper-500">
            {recFormat ? `Captures exactly what you hear, including your changes, as .${recFormat.ext}.` : "Live recording isn't supported in this browser; use Render instead."}
          </p>
        </div>
      </div>
    </FadePanel>
  );
}
