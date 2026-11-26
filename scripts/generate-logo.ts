/**
 * Generates every Stack Garden logo asset from the recursive branch() in
 * src/brand/logo.ts. The logo is literally drawn by recursion.
 *
 *   npm run logo
 *
 * Outputs
 *   public/logo-mark.svg, public/logo-mark-light.svg      square mark (dark / light)
 *   public/logo-lockup.svg, public/logo-lockup-light.svg  mark + "Stack Garden" wordmark
 *   public/logo-favicon-32.svg, src/app/icon.svg          32 px favicon (depth 2, thicker strokes)
 *   src/app/favicon.ico                                   32 px PNG-in-ICO       (needs Chrome)
 *   public/og-image.png                                   1200×630 link preview  (needs Chrome)
 *   design/logo-preview.png                               mark at 512 / 64 / 32  (needs Chrome)
 *
 * No extra dependencies: fonts for the wordmark are subset from Google Fonts
 * (only the letters used) and embedded; PNGs are rendered with a locally
 * installed Chrome (CHROME_PATH, or the default macOS / Linux location).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DARK_THEME, FAVICON_OPTIONS, LIGHT_THEME, SMALL_MARK_OPTIONS, markInner, markSvg, type LogoTheme } from "../src/brand/logo";
import { color } from "../src/visual/tokens";

const root = process.cwd();
const out = (p: string) => resolve(root, p);
const write = (p: string, data: string | Buffer) => {
  writeFileSync(out(p), data);
  console.log("  wrote", p);
};

// ---------------------------------------------------------------- fonts (subset + embed)

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

// ---------------------------------------------------------------- lockup

const WORD = "Stack Garden";
const SUB = "four recursions, one garden";

function lockupSvg(theme: LogoTheme, serif: string | null, wordColor: string): string {
  const H = 160;
  const markSize = 160;
  const textX = 188;
  const textLen = 392; // fixed advance so the lockup is identical with any fallback font
  const W = textX + textLen + 20;
  const { svgInner } = markInner({ ...SMALL_MARK_OPTIONS, theme }); // the lockup is used small: optical size
  const face = serif ? `@font-face{font-family:"SG Serif";src:url(${serif});font-weight:500}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${WORD}"><title>${WORD}</title><style>${face}text{font-family:"SG Serif","Cormorant Garamond","Iowan Old Style",Georgia,serif;font-weight:500}</style><svg x="0" y="0" width="${markSize}" height="${markSize}" viewBox="0 0 512 512">${svgInner}</svg><text x="${textX}" y="${H / 2 + 24}" font-size="72" letter-spacing="1.8" textLength="${textLen}" lengthAdjust="spacing" fill="${wordColor}">${WORD}</text></svg>`;
}

// ---------------------------------------------------------------- Chrome rendering

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

function screenshot(chrome: string, html: string, w: number, h: number, dest: string) {
  const dir = mkdtempSync(join(tmpdir(), "sg-logo-"));
  const file = join(dir, "page.html");
  writeFileSync(file, html);
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${w},${h}`,
      "--virtual-time-budget=3000",
      `--screenshot=${out(dest)}`,
      `file://${file}`,
    ],
    { stdio: "ignore" },
  );
  console.log("  wrote", dest);
}

/** Read width/height from a PNG header. */
const pngSize = (buf: Buffer) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

/** Wrap a PNG in a single-image .ico container (PNG-in-ICO is supported everywhere). */
function pngToIco(png: Buffer): Buffer {
  const { w, h } = pngSize(png);
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  header.writeUInt8(w >= 256 ? 0 : w, 6);
  header.writeUInt8(h >= 256 ? 0 : h, 7);
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // offset
  return Buffer.concat([header, png]);
}

const page = (body: string, bg: string, extraCss = "") =>
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}${extraCss}</style></head><body>${body}</body></html>`;

// ---------------------------------------------------------------- main

async function main() {
  console.log("Stack Garden logo: growing it with branch() …");

  // 1. marks
  write("public/logo-mark.svg", markSvg({ size: 512, theme: DARK_THEME }));
  write("public/logo-mark-light.svg", markSvg({ size: 512, theme: LIGHT_THEME }));
  write("public/logo-mark-small.svg", markSvg({ ...SMALL_MARK_OPTIONS, theme: DARK_THEME }));
  const favicon = markSvg({ ...FAVICON_OPTIONS, theme: DARK_THEME });
  write("public/logo-favicon-32.svg", favicon);
  write("src/app/icon.svg", favicon);

  // 2. lockups (wordmark font subset to just "Stack Garden")
  const serif = await fontDataUri("Cormorant Garamond", 500, WORD);
  const sans = await fontDataUri("Manrope", 400, SUB);
  if (!serif) console.warn("  (offline: wordmark falls back to system serif fonts)");
  write("public/logo-lockup.svg", lockupSvg(DARK_THEME, serif, color.paper100));
  write("public/logo-lockup-light.svg", lockupSvg(LIGHT_THEME, serif, color.ink800));

  // 3. PNGs via Chrome
  const chrome = findChrome();
  if (!chrome) {
    console.warn("  Chrome not found (set CHROME_PATH): skipped og-image.png, favicon.ico and the preview.");
    return;
  }
  const fonts = `${serif ? `@font-face{font-family:"SG Serif";src:url(${serif})}` : ""}${sans ? `@font-face{font-family:"SG Sans";src:url(${sans})}` : ""}`;
  const lockupDark = readFileSync(out("public/logo-lockup.svg"), "utf8");

  // og-image: dark background, centred lockup, subtitle
  screenshot(
    chrome,
    page(
      `<main><div class="lock">${lockupDark}</div><p>${SUB}</p></main>`,
      color.ink950,
      `${fonts}main{width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px}
       .lock svg{width:760px;height:auto;display:block}
       p{margin:0;font:400 30px "SG Sans","Manrope",system-ui,sans-serif;letter-spacing:.06em;color:${color.paper300}}`,
    ),
    1200,
    630,
    "public/og-image.png",
  );

  // favicon.ico from the 32 px variant
  const tmp = mkdtempSync(join(tmpdir(), "sg-ico-"));
  const icoPng = join(tmp, "fav.png");
  execFileSync(
    chrome,
    ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=32,32", "--default-background-color=00000000", `--screenshot=${icoPng}`, `data:text/html,${encodeURIComponent(page(favicon.replace('width="32" height="32"', 'width="32" height="32" style="display:block"'), "transparent"))}`],
    { stdio: "ignore" },
  );
  const png = readFileSync(icoPng);
  const { w, h } = pngSize(png);
  if (w === 32 && h === 32) write("src/app/favicon.ico", pngToIco(png));
  else console.warn(`  favicon PNG came out ${w}×${h}; kept the SVG icon only.`);

  // legibility preview: 512, 64, 32 px side by side, dark and light
  const mark = (s: number, theme: LogoTheme) =>
    (s <= 32 ? markSvg({ ...FAVICON_OPTIONS, theme }) : s <= 128 ? markSvg({ ...SMALL_MARK_OPTIONS, theme }) : markSvg({ size: 512, theme })).replace(
      /width="\d+" height="\d+"/,
      `width="${s}" height="${s}"`,
    );
  const cell = (s: number, label: string, svg: string) => `<figure><div class="m">${svg}</div><figcaption>${label}</figcaption></figure>`;
  const row = (theme: LogoTheme, bg: string, fg: string, name: string) =>
    `<section style="background:${bg};color:${fg}"><h2>${name}</h2><div class="row">${cell(512, "512 px", mark(512, theme))}${cell(64, "64 px (optical small)", mark(64, theme))}${cell(32, "32 px (favicon, depth 2)", mark(32, theme))}</div></section>`;
  screenshot(
    chrome,
    page(
      row(DARK_THEME, color.ink950, color.paper300, "Dark") + row(LIGHT_THEME, color.paper100, color.ink800, "Light"),
      color.ink950,
      `section{padding:28px 36px}h2{margin:0 0 12px;font:500 16px system-ui;letter-spacing:.08em;text-transform:uppercase}
       .row{display:flex;align-items:flex-end;gap:48px}figure{margin:0}figcaption{font:13px system-ui;margin-top:10px;opacity:.8}.m svg{display:block}`,
    ),
    760,
    1260,
    "design/logo-preview.png",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
