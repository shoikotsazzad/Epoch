# 004: "How to use" in the navbar + custom Mood menu

- **Date:** 2026-11-26
- **Tool/model:** Claude Code (Claude Opus 5.5)
- **Milestone:** polish (after Milestone 5)
- **Attachment:** a screenshot of the open native Mood dropdown overlapping the browser toolbar, with the ☰ menu open

## Prompt (verbatim)

````text
Make this how to use this portion in the navbar,   there will be a section for new user to know about this.. but when it comes to mobile section it will go to the top right's menu bar.. and in the navbar there is a scrollabe option there should be this 6 section,"
Dawn
Rain Garden
Night
Floating
Deep Sleep
Start fresh
" and make that section look good, that scroll bar shouldn't go to the upper of navbar.. then
````

## Response

I'll do two things:
- **"How to use" guide:** a button in the top bar on desktop. On phones it moves into the top-right menu.
- **Mood picker:** I'll replace the browser's native dropdown with a styled one listing all six options (five moods plus Start fresh). The native list is what popped up over Chrome's toolbar in your screenshot; the new one always opens downward, inside the page.

(Built both, tested in headless Chrome on desktop and phone, then reported:)

The "How to use" guide and the new Mood menu are both in, tested in headless Chrome on desktop and on a phone-sized screen with no errors.

**"How to use"**
- **Desktop:** a "How to use" button sits in the top bar, left of Mood. It opens a side panel with a 7-step plain-English guide: start, plant seeds (with the four seed icons), shape a plant, listen, pick a mood, X-ray, save your music. It ends with handy keys and tips.
- **New visitors:** a small amber dot on the button marks it until it's opened once; this is remembered on the device. The `H` key also opens it.
- **Phones:** the button is hidden in the top bar and appears as the first item in the ☰ menu. The guide opens as a bottom sheet.

**Mood menu**
- **Options:** the native dropdown is replaced by a styled menu with all six: Dawn, Rain Garden, Night, Floating, Deep Sleep, and Start fresh (separated by a line).
- **Each mood row:** a small colour swatch, the name in the serif font, a one-line description, and a tick on the current mood.
- **No more popping over the toolbar:** it always opens downward inside the page and never goes above the top bar. On short screens it scrolls inside itself with a thin, styled scrollbar. Scrollbars in the other panels now use the same calm style.
- **Keyboard:** ↑/↓, Home/End, Enter and Esc all work.

**Checked:** 68 tests and lint pass, the build succeeds, and there are no console errors. Choosing a mood from the keyboard works (it switched to Floating), and the phone layout fits.

**Note:** the Scale picker inside the ☰ menu is still the browser's native dropdown, so it can show the same pop-over behaviour. I can restyle it the same way if you'd like.

I've logged this request and reply as entry 004 in the AI log.

## Files changed

- New: `src/components/MoodMenu.tsx` (custom mood menu), `src/components/HelpPanel.tsx` (How to use guide)
- `src/components/TopBar.tsx`: How to use button (desktop) + MoodMenu replace the native select
- `src/components/AdvancedDrawer.tsx`: How to use button at the top of the ☰ menu on phones
- `src/components/Garden.tsx`: renders HelpPanel, `H` shortcut, remembers whether the guide was seen
- `src/components/ShortcutSheet.tsx`: lists `H`
- `src/state/store.ts`: `help` panel, `helpSeen` flag
- `src/app/globals.css`: help button, mood trigger/menu/item styles, thin panel scrollbars
- `README.md`: How to use, `H` key, mood menu
- `ai-log/004-navbar-help-and-mood-menu.md`, `ai-log/README.md`
