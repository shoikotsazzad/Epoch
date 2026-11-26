"use client";

// Breathe in 4 s, out 6 s: a soft ring synced to the music clock (no React state per frame).

import { useEffect, useRef } from "react";
import { reduceMotion, uiStore, useStore } from "@/state/store";
import { getRuntime } from "@/runtime/runtime";

export default function BreathingGuide() {
  const on = useStore(uiStore, (s) => s.breathing);
  const reduced = useStore(uiStore, reduceMotion);
  const ring = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLParagraphElement>(null);
  const live = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let lastPhase = "";
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = ((getRuntime().clockSeconds() % 10) + 10) % 10; // 4 s in + 6 s out, on the music clock
      const inhale = t < 4;
      const k = inhale ? t / 4 : 1 - (t - 4) / 6;
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * k);
      if (ring.current) {
        ring.current.style.transform = reduced ? "scale(0.85)" : `scale(${0.6 + eased * 0.4})`;
        ring.current.style.opacity = String(0.25 + eased * 0.45);
      }
      const phase = inhale ? "Breathe in…" : "Breathe out…";
      if (phase !== lastPhase) {
        lastPhase = phase;
        if (text.current) text.current.textContent = phase;
        if (live.current) live.current.textContent = phase;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on, reduced]);

  if (!on) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] flex flex-col items-center justify-center" aria-hidden={false}>
      <div
        ref={ring}
        className="h-[38vmin] w-[38vmin] rounded-full"
        style={{
          border: "1.5px solid rgba(158,189,187,0.85)",
          background: "radial-gradient(circle, rgba(22,58,66,0.35) 0%, rgba(158,189,187,0.10) 62%, rgba(158,189,187,0) 72%)",
          boxShadow: "0 0 70px rgba(158,189,187,0.18), inset 0 0 50px rgba(158,189,187,0.12)",
        }}
      />
      <p ref={text} className="mt-6 font-display text-2xl text-paper-300" aria-hidden />
      <p ref={live} className="sr-only" aria-live="polite" />
    </div>
  );
}
