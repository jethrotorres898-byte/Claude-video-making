"""Word timings for any narration file (guide voice or the creator's own recording).

Runs faster-whisper with word timestamps and writes a JS file the animation loads:
  window.WORDS = [{"w": "Did", "s": 0.41, "e": 0.55}, ...]; window.AUDIO_DUR = 39.2;
Usage:
  python tools/align.py narration.mp3 projects/x/words.js --whisper whisper-small/
"""
import argparse
import json
import subprocess

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('audio')
ap.add_argument('out')
ap.add_argument('--whisper', required=True)
ap.add_argument('--prompt', default='', help='expected text, helps spelling')
a = ap.parse_args()

pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.audio, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.float32)

from faster_whisper import WhisperModel

model = WhisperModel(a.whisper, device='cpu', compute_type='int8')
segs, _ = model.transcribe(audio, language='en', word_timestamps=True, initial_prompt=a.prompt or None)
words = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
print(' '.join(w['w'] for w in words))
with open(a.out, 'w') as f:
    f.write(f'window.WORDS = {json.dumps(words)};\nwindow.AUDIO_DUR = {len(audio) / 16000:.3f};\n')
print(f'{len(words)} words, {len(audio) / 16000:.2f}s -> {a.out}')
