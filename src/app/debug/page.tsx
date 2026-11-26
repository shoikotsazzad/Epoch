import type { Metadata } from "next";
import DebugView from "@/components/debug/DebugView";

// TEMPORARY (Milestone 1): raw geometry of each recursion, no styling, no audio.
// Milestone 5 removes this or hides it behind ?debug=1.
export const metadata: Metadata = { title: "Stack Garden: recursion debug" };

export default function DebugPage() {
  return <DebugView />;
}
