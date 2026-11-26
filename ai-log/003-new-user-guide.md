# 003: Plain-English guide for a new user

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** n/a (explanation only)

## Prompt (verbatim)

````text
Add a "How to use" guide for new users, opened from the top navbar.

Navbar button:
- A "How to use" button (with a ? icon) in the top bar. If one already exists,
  connect it to this new guide instead of adding a second one.
- On mobile, show only the ? icon, with an aria-label of "How to use".
- Keyboard shortcut: `?` opens it, Esc closes it.

The guide:
- A calm side panel (or a centered modal on mobile) in the DESIGN.md style:
  dark panel, soft blur, slow fade-in (respecting reduced motion).
- Plain, friendly English with no technical words, readable in under 1 minute.
- Short sections, each with a small icon:
  1. Begin: press Begin and put on headphones
  2. Plant seeds: drag a seed or press 1–4; what each plant adds
     (Bonsai = melody, Rain = rhythm, Stones = harmony, Sunflower = sparkle)
  3. Shape the sound: click a plant to change it, mute it or remove it
  4. Set the mood: presets, breathing guide, sleep timer
  5. X-ray: press X to see the music being built step by step
  6. Save & share: download WAV/MP3 or copy a share link
  7. Keyboard shortcuts: a compact list
- Only describe features that actually exist in the app right now.

First-time users:
- Open the guide automatically once, right after the user presses Begin
  (or show a small "New here? See how it works" hint near the button).
- Remember that it was seen (localStorage, wrapped in try/catch) so it doesn't
  show again. It must not block the music or the garden, and closing it
  should be one click.

Accessibility:
- role="dialog", aria-modal, a clear title, focus moves into the panel when it
  opens and returns to the button when it closes, Tab stays inside while open,
  text contrast ≥ 4.5:1, works fully with the keyboard.

Check it on desktop and on mobile widths (375 px, 393 px) and tell me how to test it.
Add this prompt and your reply to ai-log/.
````

## Response

Here's how Stack Garden works for someone opening it for the first time.

**What it is:** a quiet night-time garden that makes relaxing music. Each plant you put in it plays its own part of the music, and together they make a calm soundtrack that keeps changing. Headphones make it nicer.

**1. Start it**
- Open the page and press **Begin**. Browsers need you to click before they're allowed to play sound.
- A soft hum fades in and a small tree grows in the middle. That's the first plant, already playing a slow melody.

**2. Add plants**
At the bottom are four seeds. Drag one into the sand, click it, or press keys **1–4**:
- **Bonsai** (1): a tree that plays the melody.
- **Rain** (2): falling drops that make a gentle rhythm.
- **Stones** (3): a triangle of stones that plays soft chords, three voices echoing each other.
- **Sunflower** (4): a spiral of seeds that adds occasional high bell sparkles.

Each new plant fades in slowly. Where you put it matters: plants on the left sound more from your left ear, and plants near the edges sound a little further away.

**3. Change a plant**
- Click a plant to open its panel on the right.
- Move the sliders to change how it grows. For example, more **Depth** on the tree gives more branches and more notes. The plant redraws and the music changes with it.
- You can also change its volume, mute it, or remove it. To move a plant, drag it around the sand.

**4. Just listen**
- Each plant repeats on a different cycle length, so the music drifts and almost never repeats exactly.
- If you leave it alone for about 30 seconds, the garden starts growing on its own.
- The line of text above the seeds describes what's playing right now.

**5. Controls at the top right**
- **Mood** menu: changes the feel (Dawn, Rain Garden, Night, Floating, Deep Sleep). It changes the scale, speed and colours but keeps your plants.
- **Play / Pause** button (or the **Space** key).
- **Download** button: saves the music as a file (see step 7).
- **Menu** button (three lines) holds the extras:
  - **X-ray**: see how the music is made (step 6).
  - **Breathing guide**: a circle that grows and shrinks. Breathe in as it grows (4 seconds) and out as it shrinks (6 seconds).
  - **Sleep timer**: 5, 10 or 20 minutes. The music slowly fades and slows down at the end.
  - **Sound settings**: scale, key, speed, reverb (echo) and drone (the background hum).
  - **New seed / Surprise me**: regrows everything with a new pattern.
  - **Copy share link**: anyone who opens the link gets your exact garden and the same music.
  - **Reduce motion**: turns off the moving effects if they bother you.

**6. X-ray: see where the music comes from**
- Press **X**. The music pauses (only the soft hum keeps going) and the garden dims.
- A side panel shows how each plant was "built" step by step. Each plant is made by a small set of instructions that repeats itself on smaller and smaller pieces.
- Press the **right arrow** to step forward. Each step lights up the matching part of the plant and plays its note. Press the **left arrow** to go back.
- Use the plant buttons at the top of the panel to inspect a different plant.
- Press **X** or **Esc** to return, and the music picks up where it left off.

**7. Save your music**
- Click the download button (or press **E**).
- Choose **WAV** (best quality, bigger file) or **MP3** (smaller file), and a length of 1, 3 or 5 minutes.
- Click **Render**. It takes a little while (about 20 seconds for a minute of music) and then the file downloads automatically.
- Or use **Start recording** to capture exactly what you're hearing, including any changes you make while it records. Click again to stop and save.

**Handy keys:** Space = play/pause, 1–4 = plant, X = X-ray, B = breathing guide, E = export, Esc = close, ? = list of all shortcuts.

**Tips**
- On an iPhone, flip the silent switch off, or you won't hear anything.
- If it feels too busy, mute or remove a plant; two or three plants is often the calmest.
- Your garden is remembered on that device. Next time you open the page it's still there.

## Files changed

- `ai-log/003-new-user-guide.md`, `ai-log/README.md`
