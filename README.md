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

## Layout

- `lib/stickkit.js`: shared animation toolkit (stickman rig, faces, hair/beard/shades,
  props, charts, voice-synced captions).
- `lib/inkman.js`: the Inkman style (front-facing rig, accessories, sunbursts, slam text,
  punchy captions); builds on stickkit's helpers.
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

## Rebuild "They Laughed In Class"

Same models and steps as above, from `projects/class-story/` (its `voice.py` takes the same
arguments; `music.py` reads `voice.js` and `voice.wav`).

## Rebuild "The Student & The Teacher"

```sh
S=/tmp/build && mkdir -p $S
node tools/render.js projects/tjr-story/index.html $S/video.mp4 --fps 30 --scale 1.5
python3 projects/tjr-story/music.py $S/audio.wav
ffmpeg -y -i $S/video.mp4 -i $S/audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/tjr-story.mp4
```

Preview stills: `node tools/render.js <page.html> <out-dir> --scale 0.5 --stills 1,5,10`.

Requires Node with Playwright + Chromium, Python 3 with numpy, and ffmpeg.
