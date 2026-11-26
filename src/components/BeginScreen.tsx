"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getRuntime } from "@/runtime/runtime";
import { uiStore, useStore } from "@/state/store";
import { EASE, useCalmMotion } from "./ui";
import BrandMark from "./BrandMark";

export default function BeginScreen() {
  const started = useStore(uiStore, (s) => s.started);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const reduced = useCalmMotion();

  useEffect(() => {
    btn.current?.focus();
  }, []);

  const begin = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // Create + resume the AudioContext synchronously inside the click (Safari needs this).
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx({ latencyHint: "playback" });
      void ctx.resume();
      await getRuntime().begin(ctx);
    } catch (e) {
      console.error(e);
      setError("Audio could not start in this browser. Please try again, or try Chrome / Firefox / Safari.");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {!started && (
        <motion.div
          key="begin"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.3 : 1.6, ease: EASE }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-ink-950/75 px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
            className="flex max-w-lg flex-col items-center"
          >
            <BrandMark size={112} className="mb-6" />
            <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-sea-300">Recursive soundscapes</p>
            <h1 className="font-display text-5xl font-medium tracking-wide text-paper-100 sm:text-6xl">Stack Garden</h1>
            <p className="mt-6 text-lg leading-relaxed text-paper-300">
              One recursive tree, <code className="font-mono text-[0.92em] text-paper-100">branch()</code>, grows into music. Plant more if you like.
            </p>
            <p className="mt-2 text-sm text-paper-500">Headphones recommended.</p>
            <button ref={btn} type="button" onClick={begin} disabled={busy} className="btn-primary mt-10 min-w-40 px-10 py-4 text-base">
              {busy ? "Waking the garden…" : "Begin"}
            </button>
            {error && (
              <p role="alert" className="mt-4 text-sm text-lantern-400">
                {error}
              </p>
            )}
            <p className="mt-10 max-w-sm text-caption text-paper-500">
              Bonsai = fractal tree (melody) · Rain = Cantor set (rhythm) · Stones = Sierpinski (harmony) · Sunflower = Fibonacci
              (sparkle). Press <kbd className="kbd">X</kbd> anytime to see the call stack.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
