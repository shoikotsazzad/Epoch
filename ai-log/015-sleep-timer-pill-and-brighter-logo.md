# 015: Sleep timer in the desktop top bar; brighter, larger logo

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** polish

## Prompt (verbatim)

````text
make two things.. when i start a sleep timer at the settings then it will show the timer in the navbar in the PC side, that's okey.. and make the logo more light/white as it is show it will get highlighted and make it little big to look good with the  name and subline ..
````

(with a screenshot of the desktop garden; it showed an older build: no logo, the old subtitle and the ☰ icon, plus the Next.js dev badge, so the user's dev server was stale)

## Response

- **Sleep timer pill (desktop, 1024 px and up):** while a sleep timer runs, a quiet "☾ Sleep 9:58" pill appears in the top bar, left of Mood. It counts down every second, turns lantern-amber in the last minute (wind-down), and clicking it opens Settings to change or stop the timer. Its spoken name is "Sleep 9:58 left on the sleep timer (open Settings)". It's hidden on tablets and phones (the countdown stays in Settings there), so the phone bar is unchanged.
- **Logo:** brightened (brightness 1.35, a touch more contrast) with a soft moonlight-white ring and glow instead of amber; stronger on hover. Size 56 px on desktop, matching the two-line title + subtitle, and 38 px on phones (was 36 / 32).
- Verified in headless Chrome at 1440, 1024, 800 and 390 px: pill visible only at ≥1024, no overlap or horizontal scroll, clicking the pill opens Settings, axe 0 violations, no console errors. eslint, tsc and 76 tests pass.
- Told the user their screenshot came from a stale dev server and how to restart it.

## Files changed

- src/components/TopBar.tsx (SleepPill, logo size and highlight)
- src/components/icons.tsx (MoonIcon)
- ai-log/015-sleep-timer-pill-and-brighter-logo.md, ai-log/README.md
