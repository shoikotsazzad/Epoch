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

const description =
  "A garden of four recursive functions. Plant seeds, listen to them grow. Fractal tree, Cantor set, Sierpinski triangle and Fibonacci, turned into calm generative music.";

export const metadata: Metadata = {
  // set NEXT_PUBLIC_SITE_URL to the deployed URL so link previews get absolute image URLs
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Stack Garden: a garden of recursive soundscapes",
  description,
  openGraph: {
    title: "Stack Garden",
    description: "four recursions, one garden",
    images: [{ url: "og-image.png", width: 1200, height: 630, alt: "Stack Garden: a bonsai drawn by recursion inside a raked-sand circle" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Stack Garden", description: "four recursions, one garden", images: ["og-image.png"] },
};

export const viewport: Viewport = {
  themeColor: "#0b1012",
  colorScheme: "dark",
  viewportFit: "cover", // lets the phone layout respect notches / home indicator
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink-950 text-paper-100">{children}</body>
    </html>
  );
}
