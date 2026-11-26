# Reference images: what we take from each

All images live in `Reference images/` (read only). Folder names below match the disk exactly.
**Overall split:** most art-direction and generative pieces are *ink on light paper*; the UI references and two night scenes are *dark*. The brief requires a dark night garden, so we keep the **ink language** (brush strokes, fine lines, dots, empty space) and **invert the ground**: moonlit paper-coloured ink on deep slate-teal night. See `DESIGN.md §1`.

## Art Direction (`Reference images/Art Direction/`)

| File | Take | Ignore |
|---|---|---|
| `01e9d3788b0034e631b2e2b640964cf4.jpg` (watercolour lantern on a cherry branch) | The **lantern glow** is our single warm accent: amber light that bleeds softly into its surroundings, the only warm thing in a cool field. This is the "note playing now" colour. | Pink blossoms, light paper ground, signature. |
| `0d2297ccd558dfb08d9c926db739f86f.jpg` (sumi-e bonsai, dry-brush trunk, misty foliage) | **Bonsai technique:** tapered dry-brush trunk, foliage as soft grey dabs clustered at branch tips, huge empty space around the tree. | Watermark, pot reflection, seal. |
| `6b9d5bd37a6139c4b25e9e17be2b7e50.jpg` (ink-wash mountains, temple, pine, teal wash) | Grey ink + **muted teal wash** together confirms the palette. Depth comes from layered opacity (mist), and ink bleed gives texture. | The literal landscape and architecture. |
| `8099c2c5aae0129b819c6fbf05d7d768.jpg` (top-down zen garden, moss mounds, rake rings) | **The core composition:** a top-down view where every object sits in its own **concentric raked rings**, the rings meet and interfere, and objects are scattered with generous breathing room. | Daytime colour, the moss's yellow-green. |
| `85c4060458e61a8219142b4bcff46ee9.jpg` (top-down lily pond, boat, koi) | Top-down storytelling, dark teal-green water, and **tiny warm accents in a vast calm field**: use the accent sparingly. | Saturated greens and reds, the busy density, people. |
| `877a43b1a50131b420a5f137e52442e8.jpg` (woodblock zen garden, rake lines around a rock) | **Sand algorithm:** evenly spaced parallel rake lines that **bend around a stone and close into concentric ellipses**. Flat, graphic, printmaker texture. | Bright moss green, the stone path. |
| `973bc2a01a40af51222f65a62463c822.jpg` (pen bonsai, S-curve trunk, beige paper) | **S-curve trunk**, foliage in horizontal "pads" at branch ends, hatched bark. Good model for line-weight tapering. | Beige ground, red seal, caption text. |
| `a63d6ad4db7fe290e66fa3220403dcbb.jpg` (night courtyard, umbrella, falling petals, blue dress) | **Night mood:** blue-black ambience, soft ground fog, **slowly falling petals** as particles, moonlit highlights. | The figure, the costume, the saturated blue. |
| `d4ab816d5bbe7469f13beb7c41e6c6ba.jpg` (aerial zen garden, wavy sand, rocks) | **Wavy, meandering** parallel rake lines; rocks with soft cast shadows; top-down shadow logic. | Daylight palette, foliage. |
| `download.png` (night courtyard, umbrella, blossoms, mist, near-monochrome) | The **strongest "night" reference:** near-monochrome blue-grey, paper-white highlights, heavy vignette, scattered petals. Sets our value range. | Figure, building, the white frame. |
| `e609e1ce4f9e0f90910dd582fbed36f0.jpg` (woodblock garden, rocks with concentric rings) | Concentric rings around rocks: the **Stones plant** sits in rings like these. Also the flat print grain. | Lime-green lawn. |
| `f043cd75f67abfddd417542681a38501.jpg` (ink cliff, pines, watercolour orange sun) | Asymmetry, **big empty space**, silhouettes. The warm disc supports the amber accent (toned down from orange). | Orange saturation, light ground. |
| `ff931b78c21c6a619a402c219519d774.jpg` (detailed pen-and-ink bonsai on rock) | **Line-weight hierarchy:** thick trunk, very fine twigs, crisp contour. | The dense cross-hatching (too busy for calm). |

## Colour palette (`Reference images/Colour palette/`)

| File | Take | Ignore |
|---|---|---|
| `ccbe49161479c3765df2218f01e86356.jpg` (stacked handmade papers: charcoal → slate → teal → sea glass → deep teal, with a twig) | **The whole palette.** Charcoal and slate become the night ground and panels, mid-teal the faint geometry, sea glass the secondary lines and focus ring, deep teal the pools. The twig gives moss and wood as a quiet plant tint. **Deckled paper edges** mean soft, slightly irregular shapes and no hard geometric UI. | The light grey table surface. |

## Generative art (`Reference images/Generative art/`)

| File | Take | Ignore |
|---|---|---|
| `3a979f5c4bd9f7c762b68806c08d5b93.jpg` (B&W bare tree photo) | Natural branching: **crooked segments, varied angles, strong taper**. Add angle jitter and slight curvature to the fractal so it never looks like a textbook binary tree. | Photographic grain. |
| `4df6d8ba89f88a37b94b25aab374d61a.jpg` (flow-field lines, blue-grey with dark veins) | **Thousands of fine flowing lines** whose density creates tone. This is the technique for the sand furrows bending around plants. Dark "veins" form where lines converge. | Light background, overall density (we use far fewer lines). |
| `5ddb890bf5bcc7f293053900939d8895.jpg` (woodblock poppies in indigo) | A limited indigo and sea palette with fine outlines and flat fills, in an asymmetrical composition. | Light ground, calligraphy. |
| `7a89c7c9b40ce31dda1383f5c9d3d1a2.jpg` (spiral cloud pattern, blues) | **Concentric spiral line work.** This is the look of the ripple rings when a note lands: layered thin rings, darker at the core. | Saturated cobalt. |
| `a59818e324ca711f2481870fa4d759dc.jpg` (lines swirling into a dark disc, gold flecks) | Lines swirling into a centre give the **sunflower** its spiral energy. Gold flecks used sparingly show the accent working at tiny scale. | Busy triangulated noise, frame. |
| `c075637f9686120fceebb36f4d672580.jpg` (phyllotaxis dot spiral) | **Exactly the Sunflower plant:** golden-angle dots, faint small dots for unlit seeds, a highlighted subset that forms visible parastichies. | White ground (inverted for night). |
| `d6e04fdde16365c62eac0c84bfe8a5e3.jpg` (flow lines with dark veins on cream) | Same technique as the blue flow field, warm: **line density and weight create calm texture**. The veins look like branches, which echoes the bonsai. | Cream ground. |
| `download.png` (dendritic fractal tree, teal-black ink, soft glow) | **Recursive branching with a soft glow halo**, teal-black ink. This sets the look of the Bonsai and of X-ray's highlighted call path. | Very high density, white ground. |

## Calm app UI (`Reference images/Calm app UI/`)

| File | Take | Ignore |
|---|---|---|
| `6aebb11fa6f2ccda0ebbb6ff42832876.jpg` (dark meditation UI, pill sliders, round play) | **The control style:** pill-shaped slider rows with label left, value right and a dotted tick track. Minimal light type, a single prominent circular play button, a thin vertical progress line. | The pure-white play button (we use paper-100), stacked heavy glass. |
| `820367d1c4b6d3899c20efcb228c4375.jpg` (music app showcase, teal → amber) | **Teal + warm amber** in a dark UI confirms the palette pairing. Small uppercase labels with tracking. | Dense screens, album grids, avatars, many controls. |
| `8dda157b4966db2dfa3a40e702388130.jpg` (flowing blue particle stream) | **Particle glow:** fine lines and dots with soft fall-off, for the sand shimmer and drifting motes. | Electric blue (that "AI" purple-blue look): desaturated to sea glass. |
| `c7f277c9ea0c29a4a89f3fb4d2a690b1.jpg` (dark music player carousel) | A **bottom-centred** transport row and a thin floating "now playing" strip with a soft border. That strip becomes our **caption strip**. | Brand, carousel, glass cards, album art. |
