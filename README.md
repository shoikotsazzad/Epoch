# Stack Garden

**A recursive tree that sings.**

Stack Garden is a calm, interactive soundscape that runs in your web browser. It is a quiet Japanese stone garden at night. In the middle stands a small bonsai, and that bonsai is a **recursive function**: a piece of code that calls itself. Every time it calls itself, a branch grows and a note plays. You shape the function, the tree changes, and so does the music.

You can let it play in the background while you work, read or fall asleep. Or you can lean in, plant more, and watch how the mathematics turns into sound. Every garden is yours alone, and you can save its music as an audio file.

> Headphones recommended. On iPhone, switch the ring/silent switch to ring: iOS mutes web audio in silent mode.

---

## Why it exists

Most people never get to *feel* mathematics. Recursion, a function that solves a problem by calling a smaller copy of itself, is usually taught with diagrams and stack traces. In Stack Garden you can **hear** it: deeper calls climb higher and build tension, and returning calls resolve back home. You can **see** it: the tree grows one call at a time. And you can **step through it**: X-ray mode freezes time and walks the real call stack, note by note.

At the same time, it is simply a place to breathe. No accounts, no ads, no feeds, no notifications. You open it, a hum fades in, and a tree starts to sing.

## How it can help

- **Relax and unwind.** Slow, soft music that never repeats exactly and never gets busy. There's also a breathing guide that moves with the music.
- **Fall asleep.** A sleep timer slowly winds the volume and tempo down, then goes quiet. The *Deep Sleep* mood is low, slow and minor.
- **Focus.** Gentle background sound for studying or working, without lyrics or sudden changes. Leave it alone and it keeps evolving on its own.
- **Learn recursion.** Students and teachers can change depth or branching and immediately see and hear the result, then use X-ray mode to step through every call.
- **Create without skill.** You don't need to play an instrument or read music. Everything stays in key, so whatever you do sounds pleasant.
- **Keep and share it.** Export your garden as WAV or MP3 for meditation, a video, a podcast intro or a playlist. A share link reopens the exact same garden for someone else.
- **Inclusive by design.** It works fully from the keyboard, captions describe the music for people who can't hear it, it respects reduced-motion settings, and it works on phones.
- **Private.** Nothing is uploaded, nothing is tracked and nothing is saved between visits. It all runs in your browser.

---

## What makes it special

- **The music *is* the algorithm.** No note is placed by hand. Every pitch, rhythm, chord and sound effect comes from what the recursion does: entering a call, returning from one, reaching a base case, or skipping a gap.
- **You can see and hear the call stack.** Press **X** and time freezes. Step forward and back through the recursion; each call lights up its branch and plays its own note.
- **Sound effects that follow the recursion.** The wind swells as the tree goes deeper and settles as it returns. Rain drips only on the parts of the Cantor set that survive, so you hear the gaps as silence.
- **It almost never repeats.** Each plant loops at a different length (29, 17, 23 and 37 seconds). Those numbers share no common factors, so the full pattern comes back only after about 117 hours.
- **Same seed, same music.** One number (the seed) drives every random choice, so a garden always sounds the same, live, in the exported file, and when opened from a share link.
- **Always in key, never harsh.** Notes are stored as positions in a scale, never as raw frequencies, and a density limiter keeps the whole garden at no more than a few notes per second.

---

## The garden

### The heart: the bonsai, `branch()`

Every visit starts with only the bonsai. It's a fractal tree: `branch(depth, angle, length, degree)` draws one branch, then calls itself for each smaller branch until it reaches the leaves.

| What the recursion does | What you hear | What you see |
|---|---|---|
| Each call | One note | One branch grows |
| Depth (how many calls deep) | Pitch: the trunk is low, the leaves are two octaves higher; deeper notes are also softer and shorter | Thinner, shorter branches |
| Entering a deeper call (*push*) | Tension: the melody steps away from home, the tone brightens, the wind swells | The branch being called glows amber |
| Returning from a call (*pop*) | Release: big limbs end on a cadence back home, the wind settles | |
| Reaching the base case (a leaf) | Sometimes a soft bell | A leaf |
| Branch angle | Left or right in the stereo field | The tree's shape |

You can change **Depth**, **Spread**, **Wind**, **Branches**, **Length decay** and **Prune** while it plays.

### Three more layers you can plant

If you want more, you can plant the same idea (a function that calls itself) in three other forms. Each one adds a different part of the music.

| Plant | Recursion | Musical role | How it becomes sound | What you see |
|---|---|---|---|---|
| **Rain** | Cantor set, `cantor(start, length, level)` | **Rhythm** | Keep the two outer thirds, drop the middle, repeat. Surviving segments become soft drops and the **gaps are rests**. The left/right path through the recursion picks the pitch; deeper means shorter and higher. | Bamboo-like bars splitting into thirds; drops fall into the sand |
| **Stones** | Sierpinski triangle, `sierpinski(triangle, level, path)` | **Harmony** | The **three corners are three voices** (root, fifth, octave). The order of subdivision is the melody, and all three voices sing it as a slow canon, each one a few beats behind the last. | A triangle of stones subdividing; each corner stone warms when its voice sings |
| **Sunflower** | Fibonacci, a truly recursive `fib(n)` **with memoization** | **Sparkle** | Each computed `fib(k)` rings a high bell, in the order the calls finish. **Memo hits** (results reused from the cache) ring as softer echoes. | Seeds on the golden-angle spiral; seed `fib(k)` lights up when `fib(k)` returns |

### Sound effects from the recursion

A quiet layer of generated sounds (no recordings) is triggered by the recursion's own steps:

| Plant | Effect | What triggers it |
|---|---|---|
| Bonsai | Soft **wind** | Every call: a push one level deeper swells and brightens it, a pop lets it settle. The **Wind** slider sets how much. |
| Rain | **Droplets** | Every surviving Cantor segment. The removed thirds stay silent. |
| Stones | A soft **stone click** | The moment each canon voice comes in. |

The effects come from where their plant sits, mute and disappear with it, are included in exports, and have their own **Sound effects** slider in Settings.

### Underneath it all

A low **drone** (the home note and its fifth) breathes slowly under the garden, and a long **reverb** gives everything space. Where you place a plant matters: left sounds left, and plants near the edge sound farther away.

---

## Features

**Create**
- Plant up to four kinds of recursive plants by dragging, clicking or pressing `1`–`4`
- Change each plant's recursion live with sliders; the tree regrows and the music follows
- Five moods: *Dawn*, *Rain Garden*, *Night*, *Floating* and *Deep Sleep*. Each changes scale, tempo, colours, reverb, drone and sound effects and keeps your plants; *Start fresh* returns to a single bonsai
- Global controls for key, scale, tempo, reverb, drone, sound effects and volume
- New seed, or *Surprise me* for a fresh garden

**Listen and relax**
- Music that keeps evolving: leave it alone for 30 seconds and your plants slowly grow or re-seed on their own
- Breathing guide (in 4 s, out 6 s), timed to the music
- Sleep timer (5, 10 or 20 minutes) that winds down gently; on desktop the countdown shows in the top bar
- Captions describing the music, one line at a time

**Understand**
- **X-ray mode**: freeze time and step through the real call stack, with every call highlighted and played
- A short illustrated *How to use* guide for first-time visitors (`H`)

**Keep and share**
- Export 1, 3 or 5 minutes as **WAV** or **MP3**, rendered faster than real time
- Record a live session straight from the browser
- Copy a share link that reopens your exact garden

---

## Using it

1. Press **Begin**. A soft hum fades in and the bonsai starts to grow and sing.
2. **Tune** it: click the bonsai (or Tab to it and press Enter) and move its sliders.
3. **Plant** more if you like: drag a seed from the tray into the sand, click a seed, or press `1`–`4`.
4. **Listen**. Pick a mood, turn on the breathing guide, or set a sleep timer.
5. **Look inside**: press `X` and use `←` `→` to walk through the call stack.
6. **Keep it**: use the download icon in the top bar to export WAV or MP3.

Tapping empty sand or the **Stack Garden** logo closes any open panel. Every visit starts fresh with a single bonsai; nothing is saved unless you export it or copy a share link.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `1` – `4` | Plant bonsai, rain, stones, sunflower |
| `Tab` / `Shift+Tab` | Move between controls and plants |
| `Enter` | Open the focused plant's panel |
| Arrows | Move the selected plant (Shift = bigger steps) |
| `Delete` | Remove the selected plant |
| `M` | Mute / unmute the selected plant |
| `X` | **X-ray call stack**: `←` `→` step, `Home` / `End` jump, `[` `]` switch plant, `X` / `Esc` resume |
| `B` | Breathing guide |
| `E` | Export |
| `R` | New seed |
| `H` | How to use |
| `?` | Shortcut sheet |
| `Esc` | Close panels |

### Special URLs
- `?demo=1`: a fixed garden with all four plants (seed 4821, Night mood).
- `?debug=1`: a raw view of each recursion's geometry and notes.

---

## How it's built

### Architecture

```
recursion (pure function) ──► { events, trace, geometry }
                                   │        │        │
                                   ▼        ▼        ▼
                                 audio    X-ray    drawing
                                   │
                                   ▼
                          live playback  =  exported file
```

- **One shared result per plant.** Each recursion is a pure, seeded function that returns its notes (`events`), its call trace (`trace`, every call with its enter and exit time) and its shape (`geometry`). That same result drives the sound, the drawing, X-ray mode and the export, so they can never disagree.
- **Audio and drawing live outside React.** The audio engine, the scheduler and the canvas renderer run on their own; React only draws the panels and controls, never once per note or per frame.
- **Export uses the same engine.** The exact `buildEngine()` used for live playback runs again inside `Tone.Offline`, so the file you download sounds like what you heard.
- **No server at all.** It's a static site: HTML, JavaScript and CSS. There are no API routes, no database and no tracking.

### Sound

- All sound is **synthesized** with Tone.js: soft FM and sine voices, generated noise for the wind, small synths for droplets and stone clicks. There are no samples.
- Notes are scale degrees, quantized at play time, so changing key or scale applies instantly and nothing goes out of key. Very low notes are limited to roots and fifths, and nothing plays above D6.
- Loops are timed in transport ticks, so changing the tempo stretches every loop smoothly. Small seeded timing and velocity variations keep it feeling human.
- A density limiter, a per-plant voice limit, a master low-pass, a long reverb and a −1 dB limiter keep the mix calm and safe.
- MP3 encoding runs in a **Web Worker**, so the page stays smooth while it encodes.

### Visuals

- A single **Canvas 2D** loop (`requestAnimationFrame`), sharp on high-density screens, with the raked sand cached as a background layer.
- Plants are drawn procedurally from their recursion's geometry: an ink-brush bonsai, bamboo-like rain, stones and a golden-angle sunflower.
- Ripples appear only when notes play; the branch, stone or seed being called glows.
- A small, consistent design system ("Moonlit ink"): dark ink tones, warm lantern amber, sea-glass accents. See [`design/DESIGN.md`](design/DESIGN.md).

### Tech stack

- **Next.js 16** (App Router, TypeScript, static export) and **React 19**
- **Tailwind CSS 4** (design tokens in `@theme`, mirrored in `src/visual/tokens.ts` and checked by a test)
- **Tone.js 15** for synthesis, timing and offline rendering
- **Framer Motion** for panel transitions (respects reduced motion)
- **@breezystack/lamejs** for MP3 encoding
- **Vitest** for the logic (76 tests)

### Project structure

```
src/
  core/        pure logic: types, seeded rng, scales, params, moods, share links, density, X-ray, effects, captions
    recursions/  tree.ts  cantor.ts  sierpinski.ts  fibonacci.ts
  audio/       engine.ts (master chain + drone), voices.ts (plant voices + effects), scheduler.ts, offline.ts (export)
  visual/      renderer.ts, sand.ts, particles.ts, plants/*.ts, tokens.ts, layout.ts
  export/      wav.ts, mp3.worker.ts, mp3.ts, recorder.ts, download.ts
  runtime/     runtime.ts (connects state, audio and drawing)
  state/       store.ts (tiny external store), actions.ts
  components/  React UI: top bar, panels, seed tray, X-ray, export, captions
design/        DESIGN.md (design system and final sound settings), REFERENCES.md
scripts/       generate-logo.ts (builds every icon and preview image from the logo)
ai-log/        development log: every prompt and response
```

---

## Run it yourself

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # 76 tests of the recursion, music and export logic
npm run lint
npm run build      # static site in ./out (no server needed)
```

**Vercel:** import the repository; the Next.js preset builds the static site automatically.

**GitHub Pages:** build with your repository name as the base path and publish `out/`:

```bash
BASE_PATH=/your-repo-name npm run build
touch out/.nojekyll   # so Pages serves the _next/ folder
```

(For a `username.github.io` site, plain `npm run build` is enough.) Any static host works. For absolute link-preview URLs, build with `NEXT_PUBLIC_SITE_URL=https://your-site`.

---

## Accessibility

- Full keyboard control with visible focus rings; plants are real, focusable buttons.
- Native buttons, labelled sliders, and proper switch and radio-group roles.
- Honors `prefers-reduced-motion`, plus an in-app **Reduce motion** toggle (no sway, particles or ripples).
- **Captions**: a visible caption line and a screen-reader live region describe the music ("Bonsai: D4 · tension rising, wind swells"), updated at most every 2 seconds.
- The garden canvas has a live text summary, and X-ray mode announces each step.
- Text contrast of at least 4.5:1 (checked by tests); state is never shown by colour alone.
- Touch targets of at least 44 px; on phones, panels become sheets that never cover the seed tray.
- Volume safety: gentle fade-in, a master volume control and a limiter.
- Lighthouse: **Accessibility 100**, **Best Practices 100**. axe: no violations.

## Browser support

- **Chrome / Edge**: everything, including live recording (`.webm`).
- **Firefox**: everything; recording as `.ogg` / `.webm`.
- **Safari (macOS / iOS)**: everything; recording as `.m4a` where supported. On iPhone, the silent switch mutes web audio.
- Export renders faster than real time; a 5-minute file takes about a minute or two on a laptop.

---

## Logo

The master artwork is [`public/logo.jpeg`](public/logo.jpeg): a tree inside a raked-sand circle (an ensō), with one glowing branch tip, "the note playing now". Every icon and preview image is generated from it:

```bash
npm run logo
```

| File | What |
|---|---|
| `src/assets/logo-mark-256.png` | round mark used in the header and on the Begin screen |
| `public/logo-mark.png` | 512 px round mark |
| `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png` | favicon, app icon, home-screen icon |
| `public/og-image.png` | 1200×630 link preview |
| `design/logo-preview.png` | the mark at 512, 64 and 32 px |

The images are rendered with a locally installed Chrome (set `CHROME_PATH` if it isn't in the default place).

---

## Credits

- Sound: **Tone.js** (MIT). All sound is synthesized; there are no samples.
- Visuals: the garden is drawn in code; the only image is the logo.
- Fonts: **Cormorant Garamond** and **Manrope** (SIL Open Font License), bundled with `next/font`.
- MP3 encoding: **lamejs** (`@breezystack/lamejs` fork, LGPL).
- Inspiration: Brian Eno's *Music for Airports* (loops of different lengths) and *Bloom* (a garden that keeps playing), Japanese karesansui gardens and sumi-e ink painting.
- Built with the help of an AI coding agent; every prompt and response is in [`ai-log/`](ai-log/).
