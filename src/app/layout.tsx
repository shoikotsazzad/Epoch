import type { Metadata, Viewport } from "next";
import { Manrope, Shippori_Mincho } from "next/font/google";
import "./globals.css";

// Refined serif for headings (a Japanese mincho with good Latin), clean sans for UI.
const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html lang="en" className={`${shippori.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink-950 text-paper-100">{children}</body>
    </html>
  );
}
