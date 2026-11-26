import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

// Refined serif for headings, clean sans for UI. Both are small Latin-only
// variable fonts: a CJK font (Shippori Mincho) shipped 100+ subset files and
// timed out on slow connections during `next dev`.
const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stack Garden: a garden of recursive soundscapes",
  description:
    "A garden of four recursive functions. Plant seeds, listen to them grow. Fractal tree, Cantor set, Sierpinski triangle and Fibonacci, turned into calm generative music.",
};

export const viewport: Viewport = {
  themeColor: "#0b1012",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink-950 text-paper-100">{children}</body>
    </html>
  );
}
