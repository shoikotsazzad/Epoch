import Link from "next/link";

// Milestone 1 placeholder. Milestone 2 replaces this with the Begin screen + garden.
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-4xl tracking-wide text-paper-100 sm:text-5xl">Stack Garden</h1>
      <p className="max-w-md text-paper-300">
        A garden of four recursive functions. Plant seeds, listen to them grow.
      </p>
      <p className="text-caption text-paper-500">Milestone 1: foundation. The garden arrives in Milestone 2.</p>
      <Link
        href="/debug"
        className="rounded-full border border-slate-700 px-5 py-3 text-sm text-sea-300 transition-colors duration-ui ease-calm hover:border-sea-400 hover:text-paper-100"
      >
        Open the recursion debug view
      </Link>
    </main>
  );
}
