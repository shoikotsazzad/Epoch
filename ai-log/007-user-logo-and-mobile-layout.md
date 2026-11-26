# 007: The user's logo + a modern phone layout

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** polish
- **Attachments:** the logo artwork (`public/logo.jpeg`) and four phone screenshots (mood menu, How to use, Settings, garden)

## Prompt (verbatim)

````text
make this as the logo i send you in the public folder logo.jpeg and pc section dont touch, make the mobile section more modern.. like down's button overlap problem fix, then in the navbar all looks caotic, and after clicking the settings all comes little down..
````

## Response

Here's my plan, with desktop left exactly as it is: your `public/logo.jpeg` becomes the logo everywhere; the round **N** button overlapping the tray is Next.js's development badge (never in the real site), and I'll switch it off; the phone top bar keeps only the logo and title, Play and Settings; phone panels open as full sheets under the top bar, with the plant panel and X-ray as bottom sheets; the seed tray becomes a full-width dock.

(Implemented and verified in headless Chrome at 390 px and 1440 px, then reported:)

Done: your logo is in, and the phone layout is cleaned up. Desktop layout is unchanged apart from the new logo.

**Your logo everywhere**
- `public/logo.jpeg` is now the master. `npm run logo` crops it to the circle and builds the header/Begin-screen mark, a 512 px mark, the favicon, a 192 px app icon, a 180 px Apple home-screen icon and the link-preview image.
- The recursive logo I generated earlier, and its SVG files, are removed so there's only one logo.
- [design/logo-preview.png](design/logo-preview.png) shows it at 512, 64 and 32 px. At 32 px the tree turns into texture, but the rings and the glow still read.

**Phone layout (below 640 px only)**
- **Overlap fixed:** the round **N** button on top of the seed tray and panels was Next.js's development badge. It never appears in the real site; I've switched it off in dev too.
- **Top bar:** just the logo and title on the left, Play and Settings on the right. Mood and Export moved into Settings, which now has an **Export** button at the top; Mood and Start fresh are further down.
- **Settings, How to use and Export** open as a full sheet directly under the top bar instead of sitting low on the screen.
- **Plant panel and X-ray** are solid bottom sheets with a grab handle, so the garden stays visible above them.
- **Seed tray** is a full-width dock that respects the phone's notch and home bar, with the caption kept to one line.
- **Smaller fixes:** buttons no longer stay highlighted after a tap, the stray circle under Rain is gone (drops now just fade as they land), and all touch targets are still 44 px.

**Checked:** 68 tests, lint and the build all pass. Headless Chrome shows no console errors at phone and desktop sizes, and nothing scrolls sideways on the phone.

I've logged this request and reply as entry 007 in the AI log.

## Files changed

- Brand: `scripts/generate-logo.ts` (now builds from `public/logo.jpeg`), `src/components/BrandMark.tsx` (uses the cropped artwork)
- Generated: `src/assets/logo-mark-256.png`, `public/logo-mark.png`, `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png`, `public/og-image.png`, `design/logo-preview.png`
- Removed: `src/brand/logo.ts`, `src/brand/logo.test.ts`, `public/logo-mark*.svg`, `public/logo-lockup*.svg`, `public/logo-favicon-32.svg`, `src/app/icon.svg`
- Phone layout: `src/components/TopBar.tsx`, `src/components/AdvancedDrawer.tsx`, `src/components/HelpPanel.tsx`, `src/components/ExportDialog.tsx`, `src/components/PlantPanel.tsx`, `src/components/XRayOverlay.tsx`, `src/components/SeedTray.tsx`, `src/components/Captions.tsx`, `src/components/Garden.tsx`, `src/components/ui.tsx` (phone sheet direction)
- `src/app/globals.css`: hover only on hover-capable devices
- `src/app/layout.tsx`: `viewportFit: "cover"` (safe areas)
- `next.config.ts`: `devIndicators: false`
- `src/visual/renderer.ts`: drops fade on landing (no ring)
- `README.md`, `design/DESIGN.md` (§12 Logo)
- `ai-log/007-user-logo-and-mobile-layout.md`, `ai-log/README.md`
