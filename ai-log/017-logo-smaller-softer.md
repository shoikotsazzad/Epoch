# 017: Logo a little smaller and less white

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** polish

## Prompt (verbatim)

````text
make the logo little small, look so big and make it little less white as it takes all the spotlight
````

## Response

Toned the header logo down so the title leads again:
- Size: 46 px on desktop (was 56) and 36 px on phones (was 38).
- Brightness 1.12 (was 1.35, extra contrast removed). The white ring is now 1 px at 32% (was 1.5 px at 60%), and the glow 14 px at 14% (was 20 px at 30%). Hover lifts it gently (brightness 1.25, ring 50%, glow 24%).
- Checked in headless Chrome at 1440, 1024, 800 and 390 px: no overlap, axe 0 violations, no console errors; eslint and tsc pass.

## Files changed

- src/components/TopBar.tsx
- ai-log/017-logo-smaller-softer.md, ai-log/README.md
