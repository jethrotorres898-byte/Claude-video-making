# Claude video making

Videos rendered from code: HTML/SVG animations stepped frame by frame in headless
Chromium, with a soundtrack synthesized in numpy and muxed by ffmpeg.

## Projects

- `projects/tjr-story/`: "The Student & The Teacher", a 40s vertical stickman trading story
  (script in `SCRIPT.md`). Output: `output/tjr-story.mp4`.

## Rebuild a video

```sh
S=/tmp/build && mkdir -p $S
node tools/render.js projects/tjr-story/index.html $S/video.mp4 --fps 30 --scale 1.5
python3 projects/tjr-story/music.py $S/audio.wav
ffmpeg -y -i $S/video.mp4 -i $S/audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/tjr-story.mp4
```

Preview stills: `node tools/render.js <page.html> <out-dir> --scale 0.5 --stills 1,5,10`.

Requires Node with Playwright + Chromium, Python 3 with numpy, and ffmpeg.
