# Claude video making

Videos rendered from code: HTML/SVG animations stepped frame by frame in headless
Chromium, soundtracks synthesized in numpy, voiceovers from Kokoro text-to-speech,
all muxed with ffmpeg.

## Projects

- `projects/tjr-story/`: "The Student & The Teacher", 40s vertical stickman story told with
  captions (script in `SCRIPT.md`). Output: `output/tjr-story.mp4`.
- `projects/millionaire-story/`: "How I Got This Car", 70s vertical stickman story with a
  first-person voiceover, lip sync and word-by-word captions (script in `SCRIPT.md`).
  Output: `output/millionaire-story.mp4`.
- `projects/class-story/`: "They Laughed In Class", 48s energetic story in my own "Inkman"
  style (front-facing rubber-hose stickmen, bright comic worlds, beat-synced cuts), with five
  voices and a synthesized class laugh (script in `SCRIPT.md`). Output: `output/class-story.mp4`.
- `projects/side-hustle/`: "The Side Hustle", 52s dramatic neon-noir trailer (rim-lit silhouettes,
  letterbox, film grain, holographic UI, trailer score) with a deep narrator (script in `SCRIPT.md`).
  Output: `output/side-hustle.mp4`.
- `projects/dog-story/`: "Rags to Riches: Dog Edition", 56s comedy with painted, shaded dogs; the
  story is told through synthesized barks whose tone fits each moment, with "dog translation"
  subtitles (script in `SCRIPT.md`). Output: `output/dog-story.mp4`.
- `projects/dog-story-2/`: "Rags to Riches 2: The Glow Up", 62s sequel: cheated on, taught by a
  painted TJR, the ex comes back and gets rejected, gown reveal and a delivery-dog punchline
  (script in `SCRIPT.md`). Output: `output/dog-story-2.mp4`.
- `projects/dog-story-3/`: "Rags to Riches 3: Brodie", 70s: a beagle fired in the rain meets TJR at a
  bus stop, two years of lessons, then he buys the store that fired him. TJR speaks in a synthetic voice
  with lip sync (script in `SCRIPT.md`). Output: `output/dog-story-3.mp4`.

- `projects/toon-test/`: 8s motion test of the new toon style (Brodie walks in, turns, waves and
  barks; TJR answers with lip sync). Output: `output/toon-test.mp4`.
- `projects/flytrap-live/`: "A Venus flytrap can count", 54s vertical frame-by-frame version made from
  the creator's 15 pictures (`shots/`), with their ElevenLabs narration plus a recorded call to action,
  word-by-word captions, sound effects and music; every cut and beat is tied to a word of the voice.
  Output: `output/flytrap-live.mp4`.
- `projects/livingroom-live/`: 9s vertical flipbook made from the creator's own living-room frame
  (`source.jpg`): every one of the 270 frames is the original picture with small changes made from its
  own pixels (his glance, head tilt and happy blink; the cat's blink, slow blink and tail sway; both
  breathing; the curtain; a slow camera push). Output: `output/livingroom-live.mp4`.
- `projects/rickclips-study/`: style study of five RicksClips3000 shorts: script formula, lighting,
  contrast, camera, editing, effects and caption specs (`STUDY.md`) plus the five transcripts.
- `projects/flytrap-fact/`: "A Venus flytrap can count", 45s 16:9 plant fact in the creator's
  watercolor paper-cut style, narrated with their own ElevenLabs voice; every beat is cued to a word
  of the narration (script and shot list in `SCRIPT.md`). Output: `output/flytrap-fact.mp4`.

## Cast (toon style)

`cast/sheets/` holds front / side / back model sheets for every character in the toon style (bold
ink outlines, flat colours, tufted fur, characters standing upright) plus a cast lineup: Brodie,
the Boss, the Stray, Bella, Coco, the Bulldog and TJR (`golden.png` is the style reference match).
Rebuild with `SCALE=1.5 node tools/sheets.js cast/sheets lineup brodie boss stray bella coco bulldog tjr golden`.

## Clyde ("What If" channel)

`cast/clyde/` holds the reference sheets for Clyde, the "What If" channel's character: a stickman
with a round white head, messy spiky brown hair, a white body and stick limbs, drawn in a loose ink
style on cream paper. The sheets cover his expressions (excited, curious, confused, angry, sad,
shocked, disgusted, determined, silly, scared, exhausted, dizzy, mind-blown, panicked, smug, in love,
enraged, crying, scheming...), body poses, and "Mogger", his chiselled glow-up face for punchlines.

## Layout

- `lib/stickkit.js`: shared animation toolkit (stickman rig, faces, hair/beard/shades,
  props, charts, voice-synced captions).
- `lib/inkman.js`: the Inkman style (front-facing rig, accessories, sunbursts, slam text,
  punchy captions); builds on stickkit's helpers.
- `lib/noir.js`: the Neon Noir style (silhouette rig with rim light and lit faces, skylines,
  rain, bokeh, holo panels, grain/letterbox finish, subtitles).
- `lib/doggo.js`: painted dog rig (breeds, fur shading, IK legs, jaw, ears, tail, accessories,
  front-facing head), luxury car, props and translation subtitles.
- `lib/human.js`: painted human rig (side view, angular face, lip sync) used for TJR in the dog episodes.
- `lib/toon.js`: the toon style: one parametric upright dog rig (breeds, ears, build, tails,
  markings, outfits) and a matching human rig for TJR, each drawable from the front, side or back,
  with IK limbs, jaw/mouth, blinks and expressions for animation.
- `lib/dogscene.js`: shared dog-episode scene helpers (camera, bark-driven jaws, poses, rain,
  bricks, scooter, paparazzi, splash).
- `lib/watercolor.js`: the watercolor paper-cut style (painted-fill filters with mottling, hue
  drift, granulation and wet edges; white paper borders with soft shadows; gradients and path helpers).
- `tools/voicekit.py`: shared voiceover pipeline (Kokoro + Whisper check + timings + mouth envelopes).
- `tools/align.py`: word timings for any narration file (faster-whisper), written as `words.js`.
- `tools/bake.js`: rasterizes a page's static layers to transparent PNGs so slow filters run once.
- `tools/livepic.py`: living-picture toolkit for frame-by-frame animation of still illustrations from
  their own pixels (warps, cut-out sprites over rebuilt backgrounds, blinks and lip-sync, rain, dust,
  glows, drops, camera moves, captions).
- `tools/caption_ocr.py`, `tools/shots.py`, `tools/frame_stats.py`: video study tools: read burned-in
  word-by-word captions with timings (needs `tesseract-ocr`, scipy), detect hard cuts and dissolves,
  and measure per-frame brightness, contrast, colour and motion.
- `tools/render.js`: renders a page to MP4 or PNG stills with Playwright + ffmpeg.
- `tools/sheets.js`: renders the cast model sheets (`cast/sheet.html`) to PNG.
- `tools/synth.py`: numpy instruments, sound effects, foley, dog voices, mixer and reverb.

## Rebuild "How I Got This Car"

Voice models (not committed, too large): Kokoro-82M q8 from the npm package
`kokoro-q8-shards` (join the 6 parts), voices from the `kokoro-js` npm package
(`voices/*.bin`, packed into an `.npz`), and Whisper small for timings from
`@skillninja/shortmovie-telop-model-p0..p3`. Python deps: `kokoro-onnx`,
`faster-whisper`, `soundfile`.

```sh
cd projects/millionaire-story
python voice.py --kokoro kokoro-q8.onnx --voices voices.npz --whisper whisper-small/ --out .
cd ../..
S=/tmp/build && mkdir -p $S
node tools/render.js projects/millionaire-story/index.html $S/video.mp4 --fps 30 --scale 1.5
python3 projects/millionaire-story/music.py $S/music.wav
ffmpeg -y -i projects/millionaire-story/voice.wav -i $S/music.wav -filter_complex \
  "[0:a]aresample=44100,pan=stereo|c0=c0|c1=c0[v];[v][1:a]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map "[a]" -ar 44100 $S/mix.wav
ffmpeg -y -i $S/video.mp4 -i $S/mix.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/millionaire-story.mp4
```

## Rebuild "A Venus flytrap can count" (frame-by-frame)

```sh
cd projects/flytrap-live
python3 ../../tools/align.py voice_main.mp3 words_main.js --whisper whisper-small/ --prompt "$(cat ../flytrap-fact/narration.txt)"
python3 ../../tools/align.py voice_cta.mp3 words_cta.js --whisper whisper-small/
python3 voice.py                                 # joins the two takes -> voice.wav, words.json
python3 edit.py /tmp/video.mp4 --workers 4       # 1610 frames
python3 sound.py /tmp/mix.wav
ffmpeg -y -i /tmp/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 44100 /tmp/mix_norm.wav
ffmpeg -y -i /tmp/video.mp4 -i /tmp/mix_norm.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../../output/flytrap-live.mp4
```

Needs scipy, opencv-python-headless and the Nunito Black font (`assets/fonts/Nunito-Black.ttf`, OFL).

## Rebuild the living-room flipbook

```sh
cd projects/livingroom-live
python3 bodies.py && python3 prep.py          # cut out the bodies and tail, rebuild what's behind them
python3 live.py /tmp/video.mp4 --workers 4    # 270 frames
python3 sound.py /tmp/sound.wav
ffmpeg -y -i /tmp/sound.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 /tmp/sound_norm.wav
ffmpeg -y -i /tmp/video.mp4 -i /tmp/sound_norm.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../../output/livingroom-live.mp4
```

Needs scipy and opencv-python-headless. `plate.png` is `source.jpg` cropped to 9:16 (caption band removed) and upscaled to 1080x1920.

## Rebuild "A Venus flytrap can count"

`voice.mp3` is the creator's narration. Re-align it (or a new recording) with Whisper small
(see above), bake the static layers, render, then mix:

```sh
S=/tmp/build && mkdir -p $S && P=projects/flytrap-fact
python3 tools/align.py $P/voice.mp3 $P/words.js --whisper whisper-small/ --prompt "$(cat $P/narration.txt)"
node tools/bake.js $P/index.html $P/baked --scale 1.6 --only sky,far,mid,trees,near,stump,fg
node tools/bake.js $P/index.html $P/baked --scale 1 --only bokeh
node tools/render.js $P/index.html $S/video.mp4 --width 1920 --height 1080 --scale 1
python3 $P/sound.py $S/mix.wav
ffmpeg -y -i $S/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 44100 $S/mix_norm.wav
ffmpeg -y -i $S/video.mp4 -i $S/mix_norm.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/flytrap-fact.mp4
```

## Rebuild "They Laughed In Class" / "The Side Hustle"

Same models and steps as above, from `projects/class-story/` or `projects/side-hustle/` (their
`voice.py` takes the same arguments; `music.py` reads `voice.js` and `voice.wav`).

## Rebuild "Rags to Riches: Dog Edition" (and part 2)

No voice models needed: `timeline.js` drives both the animation and `music.py`, which
synthesizes every bark, effect and the score into one track. For part 2 use
`projects/dog-story-2/` and `output/dog-story-2.mp4` in the commands below.

```sh
S=/tmp/build && mkdir -p $S
node tools/render.js projects/dog-story/index.html $S/video.mp4 --fps 30 --scale 1.5
python3 projects/dog-story/music.py $S/audio.wav
ffmpeg -y -i $S/video.mp4 -i $S/audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/dog-story.mp4
```

For part 3 (`projects/dog-story-3/`), TJR's lines are pre-rendered in `voice.flac`; to regenerate them
run its `voice.py` with the same model arguments as above, then build as for the other dog episodes.

## Rebuild "The Student & The Teacher"

```sh
S=/tmp/build && mkdir -p $S
node tools/render.js projects/tjr-story/index.html $S/video.mp4 --fps 30 --scale 1.5
python3 projects/tjr-story/music.py $S/audio.wav
ffmpeg -y -i $S/video.mp4 -i $S/audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/tjr-story.mp4
```

Preview stills: `node tools/render.js <page.html> <out-dir> --scale 0.5 --stills 1,5,10`.

Requires Node with Playwright + Chromium, Python 3 with numpy, and ffmpeg.
