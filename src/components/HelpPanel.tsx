"use client";

// "How to use": a plain-English guide for first-time visitors.
// Desktop: opened from the top bar. Phone: opened from the top-right menu.

import { useEffect, useRef, type ReactNode } from "react";
import { patchUi, uiStore, useStore } from "@/state/store";
import { BonsaiGlyph, RainGlyph, StonesGlyph, SunflowerGlyph } from "./icons";
import { FadePanel, PanelHeader } from "./ui";

export const HELP_SEEN_KEY = "stack-garden:help-seen";

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="relative pl-11">
      <span aria-hidden className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-lantern-400/60 font-display text-[15px] text-lantern-400">
        {n}
      </span>
      <h3 className="font-display text-[20px] leading-7 text-paper-100">{title}</h3>
      <div className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-paper-300">{children}</div>
    </li>
  );
}

const K = ({ children }: { children: ReactNode }) => <kbd className="kbd !text-[11px] !text-paper-300">{children}</kbd>;

const SEEDS = [
  { Glyph: BonsaiGlyph, name: "Bonsai", key: "1", text: "a tree that plays the melody" },
  { Glyph: RainGlyph, name: "Rain", key: "2", text: "falling drops, a gentle rhythm" },
  { Glyph: StonesGlyph, name: "Stones", key: "3", text: "soft chords, three voices echoing" },
  { Glyph: SunflowerGlyph, name: "Sunflower", key: "4", text: "rare, high bell sparkles" },
];

export default function HelpPanel() {
  const panel = useStore(uiStore, (s) => s.panel);
  const show = panel === "help";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    patchUi({ helpSeen: true });
    try {
      localStorage.setItem(HELP_SEEN_KEY, "1");
    } catch {
      /* storage blocked */
    }
    setTimeout(() => ref.current?.querySelector<HTMLElement>("button")?.focus(), 50);
  }, [show]);

  return (
    <FadePanel
      show={show}
      mobileFrom="top"
      label="How to use Stack Garden"
      id="help-panel"
      className="fixed inset-x-2 top-[64px] bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 overflow-y-auto max-sm:bg-ink-900 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-24 sm:w-[420px] sm:max-h-[calc(100dvh-8rem)]"
    >
      <div ref={ref}>
        <PanelHeader title="How to use" subtitle="A quiet garden that makes relaxing music. Headphones make it nicer." onClose={() => patchUi({ panel: null })} />

        <ol className="flex flex-col gap-6">
          <Step n={1} title="Start">
            <p>
              Press <strong className="font-medium text-paper-100">Begin</strong>. A soft hum fades in and a small tree grows: your first plant, already playing.
            </p>
          </Step>

          <Step n={2} title="Plant seeds">
            <p>Drag a seed from the bottom into the sand, click it, or press its number.</p>
            <ul className="mt-2 grid gap-1.5">
              {SEEDS.map(({ Glyph, name, key, text }) => (
                <li key={name} className="flex items-center gap-3 rounded-xl bg-ink-800 px-3 py-2">
                  <Glyph width={20} height={20} className="shrink-0 text-sea-300" />
                  <span className="min-w-0 flex-1">
                    <span className="text-paper-100">{name}</span> <span className="text-paper-500">· {text}</span>
                  </span>
                  <K>{key}</K>
                </li>
              ))}
            </ul>
            <p>Where you place a plant matters: left sounds left, the edges sound further away.</p>
          </Step>

          <Step n={3} title="Shape a plant">
            <p>
              Click a plant to open its panel. Move the sliders (for example, more <em>Depth</em> means more branches and more notes). You can also mute it, remove it, or drag it to a new spot.
            </p>
          </Step>

          <Step n={4} title="Just listen">
            <p>Every plant repeats on a different cycle, so the music drifts and almost never repeats. Leave it alone for 30 seconds and your plants slowly keep growing by themselves.</p>
            <p>The line of text above the seeds tells you what is playing.</p>
          </Step>

          <Step n={5} title="Pick a mood">
            <p>
              The <strong className="font-medium text-paper-100">Mood</strong> menu at the top changes the scale, speed and colours: Dawn, Rain Garden, Night, Floating, Deep Sleep. Your plants stay. <em>Start fresh</em> takes you back to the beginning: one bonsai and a new seed.
            </p>
            <p><strong className="font-medium text-paper-100">Settings</strong> (top right) has the breathing guide, a sleep timer, sound settings and a share link.</p>
          </Step>

          <Step n={6} title="See how it works: X-ray">
            <p>
              Press <K>X</K>. Time freezes and each plant shows the steps that built it. Each plant is one small rule repeating itself on smaller and smaller pieces.
            </p>
            <p>
              Use <K>←</K> <K>→</K> to step through; every step lights up and plays its note. Press <K>X</K> again to return.
            </p>
          </Step>

          <Step n={7} title="Save your music">
            <p>
              Press the download button (or <K>E</K>), choose WAV or MP3 and 1, 3 or 5 minutes, then <em>Render</em>. Or record exactly what you are hearing.
            </p>
          </Step>
        </ol>

        <h3 className="drawer-h">Handy keys</h3>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-paper-300">
          {[
            ["Space", "play / pause"],
            ["1–4", "plant a seed"],
            ["X", "X-ray"],
            ["B", "breathing guide"],
            ["E", "export"],
            ["H", "this guide"],
            ["?", "all shortcuts"],
            ["Esc", "close"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <dt>
                <K>{k}</K>
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <h3 className="drawer-h">Tips</h3>
        <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-paper-300 marker:text-sea-400">
          <li>On iPhone, turn the silent switch off or you won&apos;t hear anything.</li>
          <li>Tap the open sand, or the Stack Garden logo, to close any panel.</li>
          <li>Too busy? Two or three plants is often the calmest garden.</li>
          <li>Every visit starts fresh with one bonsai. To keep a garden, use <em>Copy share link</em> in Settings.</li>
        </ul>

        <button type="button" className="btn-primary mt-6 w-full py-3" onClick={() => patchUi({ panel: null })}>
          Got it, back to the garden
        </button>
      </div>
    </FadePanel>
  );
}
