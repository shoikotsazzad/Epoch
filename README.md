# Stack Garden

**A garden of four recursive functions. Plant seeds, listen to them grow.**

Stack Garden is a calm, top-down Japanese stone garden at night. Each plant is a different **recursive function**, and each one plays one layer of an ever-changing ambient piece. Press **X** at any time to freeze time and *see and hear the call stack*.

Built for **Hub's Quest Epoch 1, Recursive Soundscapes** (UIU Developers Hub).

> Headphones recommended. On iPhone, switch the ring/silent switch to ring: iOS mutes Web Audio in silent mode.

---

## The four recursions, and how they become music

| Plant | Recursion | Musical role | How the recursion maps to sound | Visual |
|---|---|---|---|---|
| **Bonsai** | Fractal tree, `branch(depth, angle, length, degree)` | **Melody** | Every call is a note. **Depth sets register** (trunk ≈ the tonic in octave 3, leaves two octaves up), loudness (−3 dB per level) and length. **Push = tension**: each child moves one scale step away from home and opens the filter a little. **Pop = release**: big limbs end with a cadence to degree 0 / 4. Sibling branches take different **chord tones** (never adjacent steps). Leaves (base case) ring as soft bells ~40% of the time. Branch angle sets pan. | Ink-brush tree that grows call by call; the branch being called glows lantern-amber |
| **Rain** | Cantor set, `cantor(start, length, level)` | **Rhythm** | Keep the two outer parts, drop the middle ("Silence" slider = how much). Surviving segments at the deepest level become soft drops, and **the gaps are rests**. The left/right path through the recursion picks the pitch, and deeper means shorter and higher. Level 0 is a quiet sustained tone. Drops snap to a half-beat grid, so Cantor dust stays sparse. | Bars splitting into thirds; drops fall and ripple into the sand |
| **Stones** | Sierpinski triangle, `sierpinski(triangle, level, path)` | **Harmony** (3-voice canon) | The **three corners are three voices** (root, fifth, octave). The **order of subdivision** (top = stay, left = up, right = down) is the melody. Every voice plays the same line, delayed by the canon delay. Slow FM pads; below C3 only roots and fifths. | A triangle of stones subdividing; each corner stone warms when its voice sings |
| **Sunflower** | Fibonacci, genuinely recursive `fib(n)` **with memoization** | **Sparkle** | Calls drive time **in the order they finish**. Each computed `fib(k)` becomes a high bell on scale degree `fib(k) mod scaleLength` (probability = "Sparkle"). **Memo hits** are recorded and ring as softer echoes. | Seeds on the golden-angle spiral (137.508°, r = c·√i); seed `fib(k)` lights up when `fib(k)` returns |

**Phasing (Brian Eno, *Music for Airports*).** Each plant loops on its own cycle: Bonsai 29 s, Rain 17 s, Stones 23 s, Sunflower 37 s. These lengths are pairwise coprime, so the full combination repeats only after about **117 hours**.

**Everything is seeded.** One seed (mulberry32) drives every random choice, so the same seed always gives the same garden and the same music, live and in the exported file.

**One shared contract.** Every recursion is a pure function returning `{ events, trace, lengthBeats, geometry }`. That same result drives the audio, the drawing, X-ray mode and the export. Notes are stored as **scale degrees**, never frequencies, so nothing can ever go out of key.

---

## Using it

New here? Press **How to use** in the top bar (on narrow screens it's inside **Settings**) or press `H` for a short illustrated guide.

1. **Begin** unlocks audio. The drone fades in and the bonsai grows.
2. **Plant**: drag a seed from the tray into the sand, click a seed, or press `1`–`4`.
3. **Tune**: click a plant (or Tab to it and press Enter) to change its recursion live.
4. **Listen** while plants phase against each other. Leave it alone for 30 s and your plants keep growing on their own (like Eno's *Bloom*).
5. **Export** a 1, 3 or 5-minute WAV or MP3, or record the live session (the download icon in the top bar, on phones too).

Tapping empty sand or the **Stack Garden** logo/title closes every open panel (and leaves X-ray); planting a seed also starts from a clean screen.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `1` – `4` | Plant bonsai, rain, stones, sunflower |
| `Tab` / `Shift+Tab` | Move between controls and plants |
| `Enter` | Open the focused plant's panel |
| Arrows | Nudge the selected plant (Shift = bigger steps) |
| `Delete` | Remove the selected plant |
| `M` | Mute / unmute the selected plant |
| `X` | **X-ray call stack**: `←` `→` step, `Home` / `End` jump, `[` `]` switch plant, `X` / `Esc` resume |
| `B` | Breathing guide (in 4 s, out 6 s) |
| `E` | Export dialog |
| `R` | New seed |
| `H` | How to use (guide for new visitors) |
| `?` | Shortcut sheet |
| `Esc` | Close panels |

### Calm features
- **Moods** (the Mood menu in the top bar): Dawn, Rain Garden, Night (default), Floating (Lydian), Deep Sleep (minor pentatonic, low, tempo glides 48 → 40), plus *Start fresh*. A mood changes scale, tempo, colours, reverb and drone and keeps your plants; *Start fresh* takes you back to the beginning: Night, one bonsai and a new seed. The menu is keyboard accessible (↑/↓, Enter, Esc) and always opens inside the page.
- **Breathing guide** synced to the music clock.
- **Idle evolve**: after 30 s untouched, your plants slowly grow a level or re-seed (it never adds plants: that's yours to do).
- **Sleep timer**: 5 / 10 / 20 min. In the last minute the volume and tempo wind down, then it offers *Save this session*.
- **Fresh start**: every visit begins with a single bonsai playing its melody; you plant the rest.
- **Share link**: *Copy share link* puts the whole garden in the URL hash; opening it restores that garden.

### Special URLs
- `?demo=1`: fixed seed 4821, Night mood, all four plants (for the demo video; nothing is saved).
- `?debug=1`: raw recursion debug view (geometry and piano roll for each recursion).

---

## Logo

The master artwork is **`public/logo.jpeg`**: a tree inside a raked-sand ensō, with one glowing tip ("the note playing now"). Every other brand asset is cropped and resized from it:

```bash
npm run logo   # rebuilds the assets below from public/logo.jpeg
```

| File | What |
|---|---|
| `src/assets/logo-mark-256.png` | round mark used in the header and on the Begin screen |
| `public/logo-mark.png` | 512 px round mark |
| `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png` | 32 px favicon, 192 px app icon, 180 px home-screen icon |
| `public/og-image.png` | 1200×630 link preview (logo + wordmark + subtitle) |
| `design/logo-preview.png` | the mark at 512 / 64 / 32 px |

Images are rendered with a locally installed Chrome (`CHROME_PATH` if it isn't in the default place). For absolute link-preview URLs, build with `NEXT_PUBLIC_SITE_URL=https://your-site`.

## Run, test, build, deploy

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # Vitest: 68 tests of the recursion, music and export logic
npm run lint
npm run build      # static export into ./out (no server needed)
```

**Vercel:** import the repository. The framework preset (Next.js) builds the static export automatically.

**GitHub Pages:** build with your repository name as the base path and publish `out/`:

```bash
BASE_PATH=/your-repo-name npm run build
touch out/.nojekyll   # so Pages serves the _next/ folder
```

(For a `username.github.io` user site, plain `npm run build` is enough.)

Any static host works: it's just HTML, JS and CSS. There are no API routes, no server actions and no database.

---

## Tech stack

- **Next.js 16** (App Router, TypeScript, `output: 'export'`), **React 19**
- **Tailwind CSS 4** (design tokens in `@theme`, mirrored in `src/visual/tokens.ts` and checked by a test)
- **Tone.js 15** for all audio: synthesis, transport, `Tone.Offline` export
- **Canvas 2D**: one `requestAnimationFrame` loop, devicePixelRatio-aware, cached sand layer
- **Framer Motion** for panel transitions (respects reduced motion)
- **@breezystack/lamejs** for MP3, running in a **Web Worker**
- **Vitest** for the pure logic

```
src/
  core/        pure logic: types, rng, scales, params, presets, urlState, density, xray, garden, captions
    recursions/  tree.ts  cantor.ts  sierpinski.ts  fibonacci.ts
  audio/       engine.ts (master chain + drone), voices.ts, scheduler.ts (Tone.Part loops), offline.ts (export)
  visual/      renderer.ts (rAF loop), sand.ts, particles.ts, plants/*.ts, tokens.ts, layout.ts
  export/      wav.ts, mp3.worker.ts, mp3.ts, recorder.ts, download.ts
  runtime/     runtime.ts (glue between stores, audio and renderer)
  state/       store.ts (tiny external store), actions.ts
  components/  React UI (panels, tray, X-ray, export, captions …)
design/        REFERENCES.md, DESIGN.md (design system + final sound settings)
ai-log/        every prompt and response (hackathon rule)
```

The audio engine, scheduler and renderer live **outside React**. React only renders panels and controls, never per note or per frame. The **same `buildEngine()`** is used live and inside `Tone.Offline`, so exports sound like what you heard.

---

## Accessibility

- Full keyboard control (see shortcuts) with visible focus rings; plants are real focusable buttons.
- Native `<button>`, `<input type="range">` with `<label>`, `role="switch"`/`radiogroup` where appropriate.
- `prefers-reduced-motion` respected, plus an in-app **Reduce motion** toggle (no sway, particles or ripples).
- **Captions**: a visible caption strip and an `aria-live` region describing the music ("Bonsai: D4 · tension rising · Rain: rest · Stones: 3-voice canon"), at most every 2 s.
- The canvas has `role="img"` with a live garden summary. X-ray announces each step.
- Text contrast ≥ 4.5:1 and UI ≥ 3:1 (checked by unit tests on the palette). State is never shown by colour alone (dashed selection ring, "muted" tag, "memo" tag).
- Touch targets ≥ 44 px. Works on a phone in portrait (panels become bottom sheets).
- Volume safety: gentle fade-in, master volume, limiter at −1 dB.
- Lighthouse (static build): **Accessibility 100**, **Best Practices 100**.

## Browser notes
- **Chrome / Edge**: everything, including session recording (`.webm`).
- **Firefox**: everything; recording as `.ogg` / `.webm`.
- **Safari (macOS / iOS)**: everything; recording as `.m4a` where supported. On iOS the ring/silent switch mutes Web Audio.
- Export renders faster than real time (about 3× on a laptop); a 5-minute render takes roughly a minute or two.

---

## Credits

- Sound: **Tone.js** (MIT). All sound is synthesized; there are no samples.
- Visuals: drawn procedurally in code; there are no images.
- Fonts: **Cormorant Garamond** and **Manrope** (SIL Open Font License) via Google Fonts / `next/font`.
- MP3 encoding: **lamejs** (`@breezystack/lamejs` fork, LGPL).
- Inspiration: Brian Eno's *Music for Airports* (phasing loops) and *Bloom* (a garden that keeps playing), Japanese karesansui gardens, sumi-e ink painting.
- Built with the help of an AI coding agent. Every prompt and response is in [`ai-log/`](ai-log/).

---

## Hackathon checklist

| Requirement / rubric | Where |
|---|---|
| Recursive algorithm with user-changeable parameters | `src/core/recursions/*`; plant panel sliders (depth, spread, wind, levels, silence, canon delay, voicing, n, sparkle …) |
| Interactive simulation / visualization | Canvas garden: plants grow call by call, glows on notes, ripples, X-ray call stack |
| Procedural music from the recursion | `src/audio/*`; mapping table above |
| UI with parameter controls and playback | Top bar (mood, play/pause, export, more), plant panel, settings drawer |
| Audio export | Export dialog: WAV (16-bit), MP3 (worker), session recording |
| Polished, accessible, relaxing | Moods, breathing guide, idle evolve, sleep timer, captions, reduced motion, keyboard, Lighthouse a11y 100 |
| Creative use of recursion | Four different recursions phasing together; X-ray "see and hear the call stack"; memo hits audible |
