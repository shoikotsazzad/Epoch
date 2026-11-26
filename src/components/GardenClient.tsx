"use client";

// Client-only wrapper: Tone.js and the canvas need `window`, so the garden is
// loaded with ssr:false. ?debug=1 shows the raw recursion debug view instead.

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const Garden = dynamic(() => import("./Garden"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-ink-950" aria-busy="true" />,
});
const DebugView = dynamic(() => import("./debug/DebugView"), { ssr: false });

const noop = () => () => {};

export default function GardenClient() {
  const mode = useSyncExternalStore(
    noop,
    () => (new URLSearchParams(location.search).get("debug") === "1" ? "debug" : "garden"),
    () => "loading",
  );
  if (mode === "loading") return <div className="fixed inset-0 bg-ink-950" aria-busy="true" />;
  return mode === "debug" ? <DebugView /> : <Garden />;
}
