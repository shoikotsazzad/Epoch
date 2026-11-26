# 013: Sound-effect layer and the bonsai as "the chosen function"

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** polish (brief coverage: "sound effects", "Choose A recursive function")

## Prompt (verbatim)

````text
do those 2 feature..
````

## Response

Built both features from entry 012.

**1. Sound effects from the recursion** (generated with Tone.js noise and synths: no samples, no new dependency)
- Bonsai **wind**: pink noise through a band-pass with slow gusts. Every call shapes it: a push one level deeper swells it and opens the band; a pop lets it settle. The Wind slider sets the resting level.
- Rain **droplets**: every surviving Cantor segment is a small rising "plip" (at least 90 ms apart), so the removed thirds are silent.
- Stones **click**: a soft knock (5 ms attack) when each canon voice enters.
- Effects join each plant at its panner, so they follow position, volume, mute, removal and the X-ray fade, and they are in WAV/MP3 exports. They fire even when the density limiter thins a note.
- New "Sound effects" slider in Settings (0% shows "Off"). Each mood sets a level (Night 55%, Dawn 50%, Rain Garden 70%, Floating 45%, Deep Sleep 40%). The level is saved in share links, and older links get 55%.
- Captions mention the wind and droplets when effects are on.
- Measured on rendered 1-minute exports: the wind sits about 5 dB above the bonsai's quiet floor and well under the drone; droplets add about 1.5 dB to the rain; peaks unchanged (about −5 to −6.5 dBFS). The wind was raised about 3.5 dB after the first measurement. Not tuned by ear; needs a headphone listen.

**2. The bonsai as the chosen function** (wording only, no layout change)
- Begin screen: "One recursive tree, branch(), grows into music. Plant more if you like."
- How to use, step 1: "This tree is one recursive function, branch()…"
- Desktop subtitle, metadata description and OG image: "a recursive tree that sings" (same length as before, so the desktop layout is unchanged). The OG image was regenerated with `npm run logo`.
- README: opens with the chosen function, then the "three extra layers"; new sound-effects table, demo video script (90 s), and checklist rows for "Choose A recursive function" and for tones / rhythm / harmony / timbre / sound effects / ambient.
- DESIGN.md §10: effect settings table.

Also fixed an axe "label-content-name-mismatch" on the home button from entry 009: its accessible name now comes from the visible title plus a screen-reader-only "(home: close open panels)".

Checks: eslint clean, tsc clean, 76 tests pass (8 new in effects.test.ts, plus caption and share-link assertions), production build OK, axe 0 violations on desktop and phone, the panel-closing E2E still passes on both, no console errors.

## Files changed

- src/core/effects.ts (new), src/core/__tests__/effects.test.ts (new)
- src/audio/voices.ts, src/audio/engine.ts, src/audio/scheduler.ts, src/audio/offline.ts
- src/core/types.ts, src/core/presets.ts, src/core/urlState.ts, src/core/captions.ts
- src/core/__tests__/urlState.test.ts, src/core/__tests__/runtime-logic.test.ts
- src/state/actions.ts, src/runtime/runtime.ts
- src/components/AdvancedDrawer.tsx, src/components/BeginScreen.tsx, src/components/HelpPanel.tsx, src/components/TopBar.tsx
- src/app/layout.tsx, scripts/generate-logo.ts, public/og-image.png (and the other brand images, regenerated unchanged)
- README.md, design/DESIGN.md
- ai-log/013-sound-effects-and-bonsai-framing.md, ai-log/README.md
