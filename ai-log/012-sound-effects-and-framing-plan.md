# 012: How the sound-effect layer and the "chosen function" framing would work

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** n/a (explanation only, no code changed)

## Prompt (verbatim)

````text
explain about this 2,"add the sound-effect layer (about half a day), and present the bonsai as "the chosen function" with the others as extras." how that will work
````

## Response

(Read types.ts, voices.ts, the recursion event roles, the README intro, the Begin screen and help step 1, then explained the plan.)

1. Sound-effect layer: a new src/audio/effects.ts, built inside buildEngine() so live play and export both get it. Uses only Tone.js's generated noise and synths (no samples, no new dependency). Three effects driven by events the recursions already emit: wind for the bonsai (push swells, pop settles, the Wind slider sets the level), droplets on each Rain "pulse" (gaps stay silent), and a soft stone click when each Sierpinski canon voice enters. Effects follow each plant's mute, pan, removal and the X-ray fade. There is one "Sound effects" slider in Settings. Pure mapping functions get unit tests.
2. "Chosen function" framing: mostly wording. The README opens with branch() as the chosen function and the other three as optional layers; the Begin screen line and help step 1 say the bonsai is one recursive function; the demo video spends its first 30 s on the bonsai alone. No layout change, desktop untouched.

The full reply is the one shown in the conversation.

## Files changed

- ai-log/012-sound-effects-and-framing-plan.md (this entry)
- ai-log/README.md (index row)
