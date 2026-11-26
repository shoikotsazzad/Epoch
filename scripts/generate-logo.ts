/**
 * Builds every Stack Garden brand asset from the master artwork public/logo.jpeg
 * (a tree inside a raked-sand ensō, one glowing tip).
 *
 *   npm run logo
 *
 * Outputs (all cropped to the circle, so the mark fills each icon)
 *   src/assets/logo-mark-256.png   header + Begin screen (imported by the app)
 *   public/logo-mark.png           512 px mark for sharing / README
 *   src/app/icon.png               192 px app icon
 *   src/app/apple-icon.png         180 px home-screen icon
 *   src/app/favicon.ico            32 px PNG-in-ICO
 *   public/og-image.png            1200×630 link preview (logo + wordmark + subtitle)
 *   design/logo-preview.png        the mark at 512 / 64 / 32 px for a legibility check
 *
 * No extra dependencies: images are rendered with a locally installed Chrome
 * (CHROME_PATH, or the default macOS / Linux location). The wordmark font is
 * subset from Google Fonts (only the letters used) and embedded.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const out = (p: string) => resolve(root, p);
const MASTER = out("public/logo.jpeg");

// Where the ensō sits in the 1024 px master (measured: bright pixels span 172–852).
const MASTER_SIZE = 1024;
const CROP = 720; // square crop centred on the circle, ~20 px breathing room
const CROP_OFFSET = (MASTER_SIZE - CROP) / 2;

const INK950 = "#0b1012";
const PAPER100 = "#e7e0d1";
const PAPER300 = "#bdb5a5";
const WORD = "Stack Garden";
const SUB = "a recursive tree that sings";

function findChrome(): string | null {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean) as string[];
  return candidates.find((c) => existsSync(c)) ?? null;
}

async function fontDataUri(family: string, weight: number, text: string): Promise<string | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" } })).text();
    const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('([^']+)'\)/);
    if (!m) return null;
    const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
    const mime = m[2] === "woff2" ? "font/woff2" : m[2] === "woff" ? "font/woff" : "font/ttf";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const masterUri = () => `data:image/jpeg;base64,${readFileSync(MASTER).toString("base64")}`;

/** HTML that shows the circle crop of the master at exactly `size` px. */
function cropImg(size: number, src: string, round = false): string {
  const scale = size / CROP;
  return `<div style="width:${size}px;height:${size}px;overflow:hidden;position:relative;background:${INK950};border-radius:${round ? "50%" : "0"}"><img src="${src}" style="position:absolute;left:${-CROP_OFFSET * scale}px;top:${-CROP_OFFSET * scale}px;width:${MASTER_SIZE * scale}px;height:${MASTER_SIZE * scale}px"></div>`;
}

const page = (body: string, css = "", bg = INK950) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}${css}</style></head><body>${body}</body></html>`;

function shot(chrome: string, html: string, w: number, h: number, dest: string) {
  const dir = mkdtempSync(join(tmpdir(), "sg-brand-"));
  const file = join(dir, "page.html");
  writeFileSync(file, html);
  mkdirSync(dirname(out(dest)), { recursive: true });
  execFileSync(
    chrome,
    ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--default-background-color=00000000", `--window-size=${w},${h}`, "--virtual-time-budget=3000", `--screenshot=${out(dest)}`, `file://${file}`],
    { stdio: "ignore" },
  );
  const png = readFileSync(out(dest));
  const size = { w: png.readUInt32BE(16), h: png.readUInt32BE(20) };
  if (size.w !== w || size.h !== h) console.warn(`  ! ${dest} came out ${size.w}×${size.h} (wanted ${w}×${h})`);
  console.log("  wrote", dest);
  return png;
}

/** Wrap a PNG in a single-image .ico container (PNG-in-ICO is supported everywhere). */
function pngToIco(png: Buffer): Buffer {
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(w >= 256 ? 0 : w, 6);
  header.writeUInt8(h >= 256 ? 0 : h, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

async function main() {
  if (!existsSync(MASTER)) throw new Error("public/logo.jpeg (the master artwork) is missing");
  const chrome = findChrome();
  if (!chrome) throw new Error("Chrome not found: set CHROME_PATH to render the brand assets");
  console.log("Stack Garden brand assets from public/logo.jpeg …");
  const src = masterUri();

  // round marks with transparent corners (RGBA) for the app, favicon and icon;
  // the Apple touch icon stays square and opaque, as iOS expects
  for (const [size, dest, round] of [
    [256, "src/assets/logo-mark-256.png", true],
    [512, "public/logo-mark.png", true],
    [192, "src/app/icon.png", true],
    [180, "src/app/apple-icon.png", false],
  ] as const) {
    shot(chrome, page(cropImg(size, src, round), "", round ? "transparent" : INK950), size, size, dest);
  }

  const tmp = mkdtempSync(join(tmpdir(), "sg-ico-"));
  const fav = shot(chrome, page(cropImg(32, src, true), "", "transparent"), 32, 32, join(tmp, "fav.png"));
  if (fav[25] !== 6) throw new Error("favicon PNG must be RGBA");
  writeFileSync(out("src/app/favicon.ico"), pngToIco(fav));
  console.log("  wrote src/app/favicon.ico");

  const serif = await fontDataUri("Cormorant Garamond", 500, WORD);
  const sans = await fontDataUri("Manrope", 400, SUB);
  const fonts = `${serif ? `@font-face{font-family:"SG Serif";src:url(${serif})}` : ""}${sans ? `@font-face{font-family:"SG Sans";src:url(${sans})}` : ""}`;
  shot(
    chrome,
    page(
      `<main><div class="mark">${cropImg(300, src)}</div><div><h1>${WORD}</h1><p>${SUB}</p></div></main>`,
      `${fonts}main{width:1200px;height:630px;display:flex;align-items:center;justify-content:center;gap:56px}
       .mark>div{border-radius:50%}
       h1{margin:0;font:500 96px "SG Serif","Cormorant Garamond",Georgia,serif;letter-spacing:.025em;color:${PAPER100}}
       p{margin:14px 0 0 4px;font:400 30px "SG Sans","Manrope",system-ui,sans-serif;letter-spacing:.06em;color:${PAPER300}}`,
    ),
    1200,
    630,
    "public/og-image.png",
  );

  const cell = (s: number) => `<figure><div style="border-radius:50%;overflow:hidden;width:${s}px;height:${s}px">${cropImg(s, src)}</div><figcaption>${s} px</figcaption></figure>`;
  shot(
    chrome,
    page(
      `<section><div class="row">${cell(512)}${cell(64)}${cell(32)}</div></section>`,
      `section{padding:28px 36px;color:${PAPER300}}.row{display:flex;align-items:flex-end;gap:48px}figure{margin:0}figcaption{font:13px system-ui;margin-top:10px}`,
    ),
    760,
    620,
    "design/logo-preview.png",
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
