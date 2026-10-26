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

## Layout

- `lib/stickkit.js`: shared animation toolkit (stickman rig, faces, hair/beard/shades,
  props, charts, voice-synced captions).
- `lib/inkman.js`: the Inkman style (front-facing rig, accessories, sunbursts, slam text,
  punchy captions); builds on stickkit's helpers.
- `lib/noir.js`: the Neon Noir style (silhouette rig with rim light and lit faces, skylines,
  rain, bokeh, holo panels, grain/letterbox finish, subtitles).
- `lib/doggo.js`: painted dog rig (breeds, fur shading, IK legs, jaw, ears, tail, accessories,
  front-facing head), luxury car, props and translation subtitles.
- `lib/human.js`: painted human rig (side view) used for TJR in the dog episodes.
- `lib/dogscene.js`: shared dog-episode scene helpers (camera, bark-driven jaws, poses, rain,
  bricks, scooter, paparazzi, splash).
- `tools/voicekit.py`: shared voiceover pipeline (Kokoro + Whisper check + timings + mouth envelopes).
- `tools/render.js`: renders a page to MP4 or PNG stills with Playwright + ffmpeg.
- `tools/synth.py`: numpy instruments, sound effects, mixer and reverb.

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

## Rebuild "The Student & The Teacher"

```sh
S=/tmp/build && mkdir -p $S
node tools/render.js projects/tjr-story/index.html $S/video.mp4 --fps 30 --scale 1.5
python3 projects/tjr-story/music.py $S/audio.wav
ffmpeg -y -i $S/video.mp4 -i $S/audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/tjr-story.mp4
```

Preview stills: `node tools/render.js <page.html> <out-dir> --scale 0.5 --stills 1,5,10`.

Requires Node with Playwright + Chromium, Python 3 with numpy, and ffmpeg.
