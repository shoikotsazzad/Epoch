# 009: Phone export button, logo highlight, panels close properly

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** polish

## Prompt (verbatim)

````text
no.. download or export button in the phone should be in between pause and setting icon in navbar cause it is a importan part.. logo shoould be little highligted in both pc and mobile.. and there is a problem which needs to fix.. like i click in setting then the bar comes now i click in the rani or stones or  anybuttons to add them from down.. in that time the setting bar also exist.. that time the bar should hide, there is so much problem like that. .if i click in open field or anywher in the middle or maybe the home button which is stack garden title.. all the bar or feature opened should be clone,.. or lets say i click on a feature like bonsai then a bar comes then i go to add another feature like stones.. at that time the bar should hide and behave like when we just add a bar those things fix..
````

## Response

I'll make four changes: the Export button goes back into the phone top bar between Pause and Settings; the logo gets a soft amber glow and thin ring on desktop and phone; planting a seed closes whatever panel is open, including another plant's panel; and clicking empty sand or the logo/title (now a home button) closes every open panel and leaves X-ray.

(Implemented, then tested every case in headless Chrome on desktop and phone, and reported:)

All four are fixed. I tested each case you described in headless Chrome on desktop and phone, with no errors.

- **Export on phones:** the download button is back in the top bar, between Pause and Settings (the duplicate inside Settings is gone).
- **Logo highlight:** the logo now has a soft amber glow and a thin ring on both desktop and phone, slightly stronger on hover.
- **Panels now close properly.** These all close whatever was open (Settings, How to use, Export, Mood, the plant panel or X-ray):
  - **Planting a seed** from the tray, by dragging, or with keys 1–4. Bonsai's panel open → add Stones → the panel hides.
  - **Tapping the open sand** anywhere in the garden.
  - **Tapping the logo or "Stack Garden" title**, which now works as a home button.
- **Phone sheets float above the seed dock** instead of covering it, so you can still tap a seed while Settings or a plant panel is open.

Verified cases (all end with nothing open): Settings → plant Rain; Bonsai panel → plant Stones (desktop) or tap the open field (phone); Export → tap the title; Settings → tap sand; X-ray → tap sand. 68 tests, lint and types pass.

I've logged this request and reply as entry 009 in the AI log.

## Files changed

- `src/state/actions.ts`: `closeAll()`; planting closes open panels and X-ray
- `src/components/Garden.tsx`: tapping open sand calls `closeAll()`
- `src/components/TopBar.tsx`: logo + title as a home button, logo glow, Export visible on phones
- `src/components/AdvancedDrawer.tsx`: removed the phone-only Export duplicate
- `src/components/AdvancedDrawer.tsx`, `HelpPanel.tsx`, `ExportDialog.tsx`, `PlantPanel.tsx`, `XRayOverlay.tsx`: phone sheets stop above the seed dock
- `src/components/HelpPanel.tsx`, `README.md`: how to close panels
- `ai-log/009-close-behaviour-mobile-export-logo-glow.md`, `ai-log/README.md`
