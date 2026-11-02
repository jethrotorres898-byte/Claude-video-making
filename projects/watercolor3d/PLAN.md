# Your watercolor storybook style, coded the "Ricky" way (flat characters in a 3D world)

Source studied: [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT code; its
reference frames are style study only). It is the method behind the Ricks Clips look: no AI video, everything is a
real 3D world built in **three.js**, flat 2D character cards standing in it, rendered frame by frame.

## How the repo builds the Ricky look (what I took from it)

| Layer | File | What it does |
|---|---|---|
| World | `build.ts`, `paint.ts` | Boxy houses and low-poly CC0 props (Kenney kit), recoloured, with HD painted Canvas2D textures (seams painted as dark tints) |
| Light | `lights.ts`, `shade.ts` | Two-tone shading: albedo × mix(shade colour, lit colour, sun term), sun frozen per shot and camera-relative; day and golden presets |
| Characters | `toon.ts`, `cast.ts`, `cardshade.ts` | Drawn in code (Canvas2D "Pen"): bean heads, stick limbs, plum outline, 14 expressions, walk cycles, blinks; shown as camera-facing cards that take the scene light, with contact shadows |
| Ink | `ink.ts` | A post pass that finds edges of the 3D world (depth jumps + normal creases) and draws near-black lines, 5 to 3 px with distance; characters excluded (they carry their own outline) |
| Post | `Bridge.tsx`, `lensblur.ts`, `grade.ts` | ink → lens blur (depth of field per shot) → bloom (emissive only) → neutral tone map → colour grade |
| Story / camera | `story.ts` | Shots, crossfades, flash, camera keys: cuts on big jumps, 18-40 frame eased glides, a slow push-in on every hold, 4-5° rolls, impact shakes |
| Sound | `templates/audio/` | Synthesized SFX + march score, ducked under the voice, -14 LUFS |
| QA | `scripts/short_qa.py` | Checks every frame for black, white, frozen and pop frames, plus loudness |

The reports in `references/reports/` measure his channel in numbers (ink widths, colours, blur sizes, camera speeds,
character proportions) and are the targets the repo tunes to.

## What changes for your style

Your picked look: soft watercolor washes, thin warm-dark ink outlines, light paper texture, warm golden light with
soft lavender shade, softly blurred backgrounds, and your round-head character (dot eyes, blue-grey knit turtleneck,
green backpack, brown trousers, white shoes).

| Layer | Ricky (repo) | Your watercolor version | How it's coded |
|---|---|---|---|
| Shading | Hard two-tone, saturated, deep darks | Soft two-tone: warm light, lavender-blue shade, wide soft terminator, lifted darks (no blacks) | Same `twoTone()` shader, new preset: `term` .35-.5, shade ≈ [.62,.60,.78], `uSat` .8-.9 |
| Textures | Painted, flat colour + seams | Watercolor washes: pigment mottling, darker wet edges, granulation | Port the recipe from our `lib/watercolor.js` (noise-mottled fills, edge darkening, grain) into `paint.ts` Canvas2D textures |
| Ink | Near-black #030303, 5→3 px | Warm brown-black ~#3b2f27, thinner (2.4→1.4 px), slightly wobbly and broken | Same edge-detect pass; ink colour/width changed; line positions jittered by a low-frequency noise so they look hand-drawn |
| Post look | Grade + DOF + bloom | Watercolor pass: paper texture, wet-edge darkening, pigment turbulence, paper distortion, soft colour bleed; then DOF and soft bloom on light shafts | New `watercolor.ts` pass after the ink (the standard real-time recipe: Montesdeoca et al., "Art-directed watercolor stylization of 3D animations in real-time") |
| Characters | Procedural bean-head cards | **Your** character as cards. Two options: (a) cut out of your AI pictures (exact art, few poses); (b) drawn in code like `toon.ts`, redrawn to match your character (any pose, walk cycles, blinks, and our new lip-sync mouth shapes) | Recommend (b), using your pictures as the model sheet; cards lit by `cardShade()` and textured with the same paper grain |
| Light | Day / golden presets | Warm storybook light: soft key, golden hour, light shafts through windows, dust motes | New presets in `lights.ts`; shafts as soft additive cards; motes as particles |
| Camera, sound, voice | Repo rules | Same rules | We already have the voice, captions, lip-sync and sound pipeline |

## How it runs here

- three.js 0.187 in the headless Chromium we already use: WebGL2 works through a software GPU (SwiftShader),
  including float render targets. `tools/render.js` steps the page frame by frame, so Remotion isn't needed.
- No graphics card in this environment, so rendering is slower than on a gaming PC. A short test measures the speed
  before a full video. On a PC with a GPU, the repo's own Remotion route runs about 4 frames/s at 2K.
- Blender is possible too, but its fast renderer needs a GPU this environment doesn't have; the three.js route
  matches the repo and runs here.

## Proof of concept (next step)

One 5-second shot to judge the look before a full video:
1. A low-poly greenhouse: white glass frame, wooden benches, terracotta pots and plants, painted watercolor textures.
2. Your character as a code-drawn card walking in, waving and blinking, with a contact shadow.
3. Soft warm key light, lavender shade, light shafts, dust motes.
4. Ink pass (warm, thin, wobbly) → watercolor pass (paper, wet edges, pigment turbulence) → background lens blur.
5. A side-by-side sheet against your greenhouse picture to compare.
