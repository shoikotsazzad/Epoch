# 010: Hackathon audit, rating and new feature ideas

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** n/a (review only, no code changed)

## Prompt (verbatim)

````Bug: Settings panel layout on mobile, the sleep timer section is too large.

What happens:
On mobile (portrait, around 375–430 px wide), when I open Settings, the sleep timer
section takes up far too much space. Its buttons/text are oversized compared with
the other settings, and it pushes the rest of the panel down or off-screen.
[Screenshot attached]

What I expect:
- The timer options (Off / 5 / 10 / 20 min) sit in one compact row, as a small
  segmented control, matching the size and spacing of the other controls.
- The whole Settings panel fits on a phone screen; if it's taller, it scrolls
  smoothly inside the panel (not the whole page).
- Font sizes, padding and radii follow design/DESIGN.md tokens.
- Touch targets stay at least 44×44 px.
- Desktop layout must stay exactly as it is now.

Please:
1. Find the cause (likely a fixed size, missing responsive class, or a flex/grid
   item not shrinking) and explain it in one or two lines.
2. Fix it with responsive styles for small screens only.
3. Check the other Settings sections at the same width for the same problem
   and fix those too.
4. Tell me how to verify it (Chrome DevTools device mode: iPhone SE 375 px,
   iPhone 14 Pro 393 px, Pixel 7 412 px).
5. Add this prompt and your reply to ai-log/.

## Response

(Checked the code for the parameter specs, the timbre mapping in voices.ts, demo mode and the iOS note, then replied with the audit below.)

All six mandatory deliverables are met. Gaps are in submission readiness and in the depth of the timbre and sound-effect mapping, not in the requirements. Estimated score about 8.5/10; a strong top-3 contender, with winning depending mostly on musical quality and the demo. Feature ideas: "base case lullaby" (the sleep timer unwinds the recursion), "hear the call stack" in X-ray, wind and rain-texture layers tied to parameters, zooming into a branch (self-similarity), hum-to-tune via the microphone, phone tilt as wind, and a 30-second video postcard export. The full reply is the one shown in the conversation.

## Files changed

- ai-log/010-mobile-responsive.md (this entry)
- ai-log/README.md (index row)
