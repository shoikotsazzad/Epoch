# Stack Garden: design system

Derived from `design/REFERENCES.md`. Tokens live in **`src/app/globals.css`** (`@theme`, Tailwind v4) and are mirrored in **`src/visual/tokens.ts`** for canvas code. A unit test (`src/visual/tokens.test.ts`) fails if the two disagree, if any text colour drops below WCAG AA, or if pure black or white sneaks in.

---

## 1. Direction: "Moonlit ink"

The references pull two ways. The art-direction and generative images are **sumi-e / pen ink on light paper**; the UI references and the two night courtyards are **dark**. The brief requires a dark night garden, so we:

- **Invert the sumi-e:** the ground is the darkest papers from the palette stack (charcoal / slate-teal). Strokes are **moonlit rice-paper ink** (`paper-100`, warm off-white, never `#fff`).
- Keep the **top-down zen garden** composition (`8099…`, `877a…`, `e609…`): every plant sits in its own raked rings, and the rings meet and interfere.
- Use **one warm accent**, lantern amber, *only* for "the note sounding now" (and the primary action). Everything else is cool and quiet.
- Keep the **printmaker restraint**: few elements, even line spacing, lots of empty space. Ignore the daytime greens and the dense hatching.

Emotional target: *standing in a temple garden at night with a paper lantern.* Calm, slow, spacious.

---

## 2. Colour tokens (dark only)

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#0b1012` | Page / garden ground (near-black slate-teal, **not** `#000`) |
| `ink-900` | `#10171a` | Panel base (used at ~72% alpha) |
| `ink-800` | `#172125` | Raised surfaces, slider track, hover |
| `slate-700` | `#22313a` | Hairlines, panel borders, inactive strokes |
| `slate-600` | `#2d4148` | Sand furrow shadow side |
| `teal-500` | `#3e5d62` | Faint geometry (Cantor removed parts, X-ray inactive frames) |
| `sea-400` | `#6e9396` | Secondary strokes, inactive icons (≥ 3:1 on ground) |
| `sea-300` | `#9ebdbb` | Sand line highlight, **focus ring**, links |
| `pond-700` | `#163a42` | Deep pools (sunflower bed, X-ray dim tint) |
| `moss-500` | `#7c8b5e` | Bonsai foliage dabs (low alpha) |
| `paper-100` | `#e7e0d1` | Primary text, ink strokes |
| `paper-300` | `#bdb5a5` | Secondary text, stones |
| `paper-500` | `#8e877a` | Muted text, captions (still ≥ 4.5:1 on all surfaces) |
| `lantern-400` | `#e8aa62` | **The warm accent:** note playing now, primary button |
| `lantern-200` | `#f5d6a8` | Glow core of the accent (tiny radius only) |

Measured contrast on `ink-950` / on `ink-800`: paper-100 14.6 / 12.5 · paper-300 9.4 / 8.1 · paper-500 5.4 / 4.6 · lantern-400 9.4 / 8.1 · sea-300 9.5 / 8.2 · sea-400 5.7 / 4.9.

**State never relies on colour alone.** Muted plants also show a struck-through label and dimmed strokes, the selected plant shows a dashed ring, and memo hits in X-ray show a "memo" tag.

### Preset palette variants (Milestone 4)
Small shifts, never a new palette: they nudge the ground tint, the sand-line alpha and the accent warmth.

| Variant | Ground | Accent | Feel |
|---|---|---|---|
| night (default) | `ink-950` | `lantern-400` | moonlit |
| dawn | ground lifted ~4% toward `pond-700` | accent +5% lightness | first light |
| rain | ground +3% teal | accent −10% saturation | wet stone |
| floating | ground +2% toward `sea-400` | accent unchanged, sand alpha −20% | weightless |
| deep | ground −2% | accent −15% lightness | almost asleep |

---

## 3. Typography (via `next/font`)

- **Display / headings:** *Cormorant Garamond* (variable). A refined, calligraphic serif for the title, plant names and Begin screen. Letter-spacing `0.02em`. (Shippori Mincho was tried first, but as a CJK font it ships 100+ subset files and timed out during `next dev` on a slow connection.)
- **UI:** *Manrope* (variable). Labels, values, captions. Labels are uppercase 11–12px with `tracking-label` (0.08em) at weight 500.
- Scale: title 40/48px (mobile 32), panel heading 20px display, body 15px, label 12px, caption 13px (`text-caption`).
- Numbers in sliders use `font-variant-numeric: tabular-nums`.

## 4. Spacing, radii, layout

- Spacing on a 4px base: `4 8 12 16 24 32 48 64 96`. The screen edge gutter is 24px (16px on phones).
- Radii: `sm 8px` (chips), `md 14px` (slider rows), `lg 22px` (panels), pill (buttons).
- **Layout:** the canvas fills the viewport. UI floats at the edges and never covers the central ~60% of the garden.
  - Top-left: title (display serif, `paper-300`).
  - Top-right: Mood · Play/Pause · Export · X-ray · `?` (icon buttons, 44px targets).
  - Bottom-centre: seed tray (4 seeds). On phones it becomes a bottom sheet.
  - Bottom: one-line caption strip (`paper-500`), centred under the tray.
  - Plant panel: slides in from the right (or rises as a bottom sheet on phones), 320px wide.
- **Max 3 controls visible by default** (Play/Pause, Mood, Export). Everything else lives behind `?`, the Advanced drawer or the plant panel.

## 5. Panels, buttons, sliders

- **Panel:** `ink-900` at 72% alpha, 1px `slate-700` border, radius `lg`, `backdrop-filter: blur(8px)` on **floating panels only** (no glassmorphism everywhere), soft shadow `0 20px 60px rgb(0 0 0 / 0.35)`. Padding 20–24px.
- **Icon button:** 44×44, transparent, `sea-400` icon (thin 1.5px stroke, hand-drawn-feeling SVG; never emoji). Hover: `ink-800` fill. Active: `paper-100` icon.
- **Primary button (Begin, Export):** pill, 1px `lantern-400` border, text `lantern-400`. Hover fills `lantern-400` at 12%. There is never a solid white button.
- **Slider row** (from `6aebb…`): a pill row (`ink-800`, radius `md`, 48px tall) with the label left (uppercase 12px `paper-300`), a dotted tick track, a thin vertical thumb (2×18px `paper-100`) and the value right (tabular, `paper-100`). It is a native `<input type="range">` with a `<label>`, restyled; focus shows the `sea-300` ring around the whole row.

## 6. Motion

- UI transitions: **400–800ms** `cubic-bezier(0.45, 0, 0.55, 1)` (ease-in-out, token `--ease-calm`). Framer Motion with `useReducedMotion` (falls back to opacity only).
- Parameter changes ramp over **~1.5s** (audio `rampTo`, visual lerp).
- Glows: fade **in ~300ms**, **out ~1.5s**. Nothing bounces, nothing flashes, and no element pulses more than **3×/second** (the scheduler enforces a minimum gap per plant).
- **Idle fade:** UI panels fade to **20% opacity after 6s** idle and return on mouse move, key press or focus.
- Planting: the layer fades in over 4s while the plant draws itself stroke by stroke. Removal fades out over 3s and the strokes dissolve into sand.
- **Reduced motion** (OS setting or in-app toggle): no sway, no particles, no ripples, no stroke-by-stroke growth (shapes fade in), opacity-only transitions.

## 7. Texture

- **Film grain:** a pre-rendered 256px noise tile, overlaid at 4–6% alpha, offset each frame by a random integer (cheap and alive). It stays static under reduced motion.
- **Vignette:** a radial gradient from transparent at 55% to `ink-950` at 85% alpha at the corners.
- **Raked sand** (from `877a…`, `8099…`, `4df6…`): horizontal-ish parallel lines, 9–12px apart, `sea-300` at 7–10% alpha, each with a darker `slate-600` twin offset 1px (furrow shadow). Lines are displaced by a field that **bends around each plant** and **closes into 4–6 concentric rings** around it. Ripples on notes are a ring of extra displacement travelling outward (~60px/s), fading over 1.5s. Static lines are cached offscreen and redrawn only when the garden changes.
- **Motes:** 12–30 slow drifting petals / dust (from the night courtyards), `paper-300` at 15–30% alpha, ~5–15px/s. Fewer on slow frames, none with reduced motion.

## 8. Plants: visual technique

| Plant | Technique | Glow on note |
|---|---|---|
| **Bonsai** | Ink-brush segments: a tapered quadratic stroke per branch whose width follows depth (trunk thick, twigs hairline), drawn in `paper-100` at 85% alpha with a slight dry-brush texture (2–3 offset thin strokes at low alpha). Foliage is soft `moss-500` dabs at the leaves (from `0d22…`, `973b…`). Wind sways each segment by `sin(t·0.3 + depth)` × depth weight. Grows branch by branch in call order. | The branch being called glows `lantern-400` (in 300ms, out 1.5s); leaves emit a tiny amber bloom. |
| **Rain** | The Cantor bars as a thin stacked ladder (one row per level, `sea-300` lines, removed middles as `teal-500` dotted gaps). Surviving deepest segments release **drops** that fall to the sand and become **ripple rings**. | The segment brightens, then its drop lands as a ring (no hard flash). |
| **Stones** | A triangle of rounded stones (`paper-300`, slightly irregular polygons like deckled paper) at the subdivision vertices of the deepest level. Thin `sea-400` hairlines show the Sierpinski edges, and each stone has its own raked rings. The three outer corners are the voices. | The singing corner's stone warms to amber and its rings breathe outward. |
| **Sunflower** | Phyllotaxis dots (`c075…`): unlit seeds are tiny `paper-500` dots at 40% on a faint `pond-700` disc. Fibonacci-indexed seeds are larger and light up **in completion order**. | The seed glows amber, with a soft halo of radius ×3. |

## 9. X-ray mode

- Scene dims to 35% under a `pond-700` tint at 55%. Non-active geometry turns `teal-500`.
- The active call path is drawn in `paper-100` with a `lantern-400` head (the current frame). Depth labels use 11px mono `paper-300`.
- Side panel (right): the stack as a vertical list of frames, `fib(n=6)` above `fib(n=5)` and so on, indented by depth, current frame bordered in amber. Memo hits are tagged **"memo"** and drawn as pruned (dashed) branches.
- All overlay text sits on `ink-900` ≥ 90% alpha pills, so contrast ≥ 4.5:1 regardless of the garden underneath.

## 10. Sound settings (final)

Source of truth: `src/audio/engine.ts` (`SOUND`) and `src/audio/voices.ts` (`VOICE_SETTINGS`).
Levels were set by **measuring rendered exports** (peak / RMS / dynamic range). They were not tuned by ear, so give them a final listen on headphones.

**Global**
| Setting | Value |
|---|---|
| Key / scale | from preset (Night: D major pentatonic, root D3) |
| Tempo | 56 BPM default (range 40–66); loops are defined in seconds at 56 BPM and stretch with tempo |
| Loop cycles | Bonsai 29 s · Rain 17 s · Stones 23 s · Sunflower 37 s (pairwise coprime: the full pattern repeats only after ~117 h) |
| Drone | sine tonic + triangle fifth an octave below the root, −30 dB, low-pass breathing 320–1100 Hz at 0.03 Hz |
| Chain | voices → plant low-pass → panner → plant gain (×2 makeup) → bus low-pass 2.4 kHz, Q 0.5 → feedback delay (dotted quarter, fb 0.34, wet 0.18) → dry + reverb send → reverb (decay 6.5 s, pre-delay 40 ms) → high-pass 40 Hz → user volume → master +2 dB → limiter −1 dB |
| Spatial | x → pan −0.7…+0.7; distance from centre → extra reverb send 0.06…0.38 |
| Density | ≤ 6 notes per 2 s for the whole garden, ornaments dropped first at 4; ≥ 0.34 s between notes of one plant (≤ 3 glows/s) |
| Register | nothing above D6; below C3 only roots and fifths |
| Humanize | seeded ±10–30 ms timing, ±10% velocity |
| Measured output (demo garden) | peak −5.7 dBFS, RMS −23 dBFS, 17 dB swing between quiet and busy moments |

**Voices** (attack / release in seconds)
| Plant | Timbre | Envelope | Level | Filter |
|---|---|---|---|---|
| Bonsai melody | FM: sine carrier, triangle modulator, harmonicity 2, index 1.1 | 0.3 / 4.5 | −1 dB | 1.5 kHz, opens +160 Hz per depth on push, closes on pop |
| Bonsai leaf bell | FM sine/sine, harmonicity 3, index 1.6 | 0.12 / 3.5 | −11 dB | (same) |
| Rain drop | sine | 0.05 / 2.8 (no sustain) | −7 dB | 1.7 kHz |
| Rain ground tone | triangle | 3 / 6 | −18 dB | (same) |
| Stones pad | FM sine/sine, harmonicity 1, index 0.8 | 2.6 / 7.5 | −5 dB | 1.2 kHz |
| Sunflower bell | FM sine/sine, harmonicity 3.5, index 2 | 0.12 / 4.5 | −13 dB | 3 kHz |
| X-ray step | triangle | 0.06 / 1.6 | −8 dB | bus |

**Deviations from the brief, and why**
- Bells and rain drops use 0.05–0.12 s attacks (the brief suggests 0.2–0.6 s for notes). A 0.2 s+ attack turns a bell into a swell. These are still click-free sine/FM tones at low velocity.
- The master is +2 dB, not −14 dB. With the voices at the brief's suggested levels, the rendered export came out at about −50 dBFS for notes, and the drone drowned the music. The limiter at −1 dB keeps everything safe.

## 11. Don't

- No purple-blue "AI" gradients, neon, or saturated electric blue (desaturate everything toward sea glass).
- No glassmorphism everywhere. Blur is allowed only on floating panels, and subtly.
- No emoji icons; use thin-stroke SVG only.
- No pure white (`#fff`) and no pure black (`#000`).
- No bouncing, springy overshoot, shaking, or anything flashing more than 3×/s.
- No more than 3 controls visible by default. Never cover the centre of the garden.
- No hard drum transients, no raw saw/square timbres.
- No light theme.
- No copied artwork, sampled audio, or third-party characters; everything is procedural.
- Don't use colour alone to convey state.

## 12. Logo

- **Master artwork:** `public/logo.jpeg` (1024 px). It shows a cream line-art tree inside five concentric raked-sand arcs that open at the upper right like an ensō. One branch tip glows amber, the same "note playing now" accent as the garden. The background (#0b1218) is almost exactly `ink-950`.
- **Derived assets** (`npm run logo`): a 720 px square crop centred on the circle (which spans 172–852 px of the master), shown round with transparent corners, at 256, 512, 192 and 32 px. Plus a square, opaque 180 px Apple touch icon and the 1200×630 OG image. The wordmark is Cormorant Garamond 500, slightly letter-spaced.
- **Small sizes:** at 64 px the tree and the glowing tip still read. At 32 px (favicon) it reads as "rings + glow", the tree becomes texture, and that is acceptable for a tab icon.
