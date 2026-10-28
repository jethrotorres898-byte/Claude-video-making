"""Soundtrack for the toon style test: a light pluck groove, Brodie's yips, footsteps and
TJR's line (voice.flac). Usage: python3 music.py out.wav"""
import json
import os
import re
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from synth import SR, Mix, bass, bell, hat, kick, pluck, snap, thud, whoosh, write_wav, yip  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(re.search(r'window\.TL = (\{.*\});', open(os.path.join(HERE, 'timeline.js')).read(), re.S).group(1))
DUR = TL['duration']
m = Mix(DUR)
for b in TL['barks']:
    for k in range(b['n']):
        m.add('dog', yip(b['f0'] * (1 + 0.06 * k), 1.0, seed=k), b['t'] + k * b['gap'], 1.7, -0.2)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'voice.flac'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
m.add('voice', np.frombuffer(raw, np.float32).astype(np.float64), 0.0, 1.0, 0.15)
for k in range(9):  # footsteps while he walks in
    m.add('sfx', thud() * 0.25, 0.15 + k * 0.28, 0.6, -0.3)
m.add('sfx', whoosh(0.3), 2.8, 0.4)
m.add('sfx', bell(96, 1.0) + bell(103, 1.0), 2.85, 0.4)
beat = 60 / 112
for k, t0 in enumerate(np.arange(0.2, DUR - 0.3, beat / 2)):
    if k % 4 == 0:
        m.add('music', kick(0.6), t0)
        m.add('music', bass([48, 53, 55, 53][(k // 8) % 4], beat * 0.9, 0.7), t0)
    if k % 4 == 2:
        m.add('music', snap(0.5), t0)
    m.add('music', hat(0.3), t0)
    m.add('music', pluck([72, 76, 79, 76, 77, 81, 79, 74][k % 8], 0.16, 0.45), t0, 0.7, 0.3)
music, sfx, dog, vox = m.bus('music'), m.bus('sfx'), m.bus('dog'), m.bus('voice')
e = np.convolve(np.abs(dog[0]) + 1.5 * np.abs(vox[0]), np.ones(4410) / 4410, mode='same')
e = np.clip(e / (np.percentile(e[e > 1e-4], 95) + 1e-9), 0, 1)
mix = music * (1 - 0.65 * e) * 0.45 + sfx * 0.8 + dog + vox * 1.3
n = int(DUR * SR)
mix = mix[:, :n] * np.concatenate([np.ones(n - int(0.4 * SR)), np.linspace(1, 0, int(0.4 * SR))])
mix /= np.max(np.abs(mix)) + 1e-9
write_wav(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', np.tanh(mix * 1.3) / np.tanh(1.3) * 0.9)
