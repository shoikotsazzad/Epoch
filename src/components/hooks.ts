"use client";

import { useEffect, useState } from "react";

export function useWindowSize() {
  const [size, setSize] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return size;
}

/** True after `ms` without pointer / key / focus activity. */
export function useIdle(ms: number, enabled = true) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), ms);
    };
    const evs = ["pointermove", "pointerdown", "keydown", "focusin", "wheel", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(timer);
      evs.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [ms, enabled]);
  return enabled && idle;
}
