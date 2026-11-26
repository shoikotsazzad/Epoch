"use client";

import { captionStore, uiStore, useStore } from "@/state/store";

/** Visible caption strip + polite live region (updated at most every ~2 s). */
export default function Captions() {
  const text = useStore(captionStore, (s) => s);
  const started = useStore(uiStore, (s) => s.started);
  const xray = useStore(uiStore, (s) => s.xray);
  if (!started) return null;
  return (
    <p aria-live="polite" aria-atomic="true" className="caption-strip">
      {xray ? "X-ray: the music is paused on the drone. Use the arrow keys to step through the call stack." : text}
    </p>
  );
}
