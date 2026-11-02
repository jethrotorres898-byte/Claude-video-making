"""Soundtrack for the living-room flipbook test (9 s): quiet room tone, birds outside the window,
a soft lofi bed, a light chime when he notices the cat, the cat's purr during the slow blinks,
and a soft swish for the tail flick. Times match live.py.

Usage: python3 sound.py out.wav
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from synth import SR, Mix, bass, bell, epiano, hat, onepole, pad, reverb, tt, tweet, whoosh, write_wav  # noqa: E402

DUR = 9.0
T_NOTICE, T_CAT_SLOW, T_HIS_SLOW, T_FLICK = 2.5, 3.7, 5.45, 6.3


def purr(dur, seed=4):
    """Cat purr: low noise pulsed ~26 Hz, in breaths (louder on the in-breath)."""
    t = tt(dur)
    r = np.random.default_rng(seed)
    n = onepole(r.standard_normal(len(t)), np.full(len(t), 0.02))
    pulse = 0.55 + 0.45 * np.sin(2 * np.pi * 26 * t) ** 2
    breath = 0.65 + 0.35 * np.sin(2 * np.pi * t / 1.25)
    body = np.sin(2 * np.pi * 52 * t + 0.3 * np.sin(2 * np.pi * 26 * t)) * 0.25
    env = np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.7)
    y = (n * 2.2 + body) * pulse * breath * env
    return y / (np.max(np.abs(y)) + 1e-9)


def room_tone(dur, seed=9):
    r = np.random.default_rng(seed)
    n = onepole(r.standard_normal(int(dur * SR)), np.full(int(dur * SR), 0.01))
    return n / (np.max(np.abs(n)) + 1e-9)


def build():
    m = Mix(DUR)
    m.add('amb', room_tone(DUR + 0.5), 0, 0.05, 0)
    for tb, pan, seed in ((0.4, 0.7, 1), (1.3, 0.6, 2), (3.1, 0.8, 3), (4.6, 0.65, 4), (6.0, 0.75, 5), (7.7, 0.6, 6), (8.4, 0.7, 7)):
        m.add('amb', tweet(seed), tb, 0.35, pan)
        m.add('amb', tweet(seed + 20), tb + 0.11, 0.28, pan)
    # lofi bed: Fmaj7 - Em7 - Dm7 - Cmaj7, soft e-piano + pad, gentle hats
    chords = [(41, (57, 60, 64, 67)), (40, (55, 59, 62, 67)), (38, (53, 57, 60, 65)), (36, (52, 55, 59, 64))]
    beat = 60 / 76
    for b in range(4):
        root, notes = chords[b % 4]
        t0 = b * 4 * beat * 0.75
        for k, nn in enumerate(notes):
            m.add('music', epiano(nn, 2.4, 0.42), t0 + k * 0.03, 1.0, -0.15 + 0.1 * k)
            m.add('music', pad(nn, 2.6, 0.45), t0, 1.0, 0.0)
        m.add('music', bass(root, 1.6, 0.4), t0, 1.0, 0.0)
        for h in range(4):
            m.add('music', hat(0.3), t0 + (h + 0.5) * beat * 0.75, 1.0, 0.25)
    # beats
    m.add('sfx', bell(91, 1.4, 0.55), T_NOTICE + 0.02, 0.5, -0.2)      # he notices
    m.add('sfx', bell(98, 1.2, 0.35), T_NOTICE + 0.1, 0.35, -0.2)
    m.add('sfx', purr(3.6), T_CAT_SLOW - 0.2, 0.42, -0.45)               # the cat purrs through both slow blinks
    m.add('sfx', bell(96, 1.6, 0.4), T_HIS_SLOW + 0.3, 0.35, 0.2)       # warm moment
    m.add('sfx', whoosh(0.45) * 0.5, T_FLICK, 0.25, -0.6)                # tail flick
    amb, music, sfx = m.bus('amb'), m.bus('music'), m.bus('sfx')
    music = music * 0.7 + np.stack([reverb(music[0], 1.8, 2.6, 1), reverb(music[1], 1.8, 2.6, 2)]) * 0.3
    sfx = sfx * 0.85 + np.stack([reverb(sfx[0], 1.2, 3.5, 3), reverb(sfx[1], 1.2, 3.5, 4)]) * 0.15
    out = amb + music * 0.55 + sfx
    n = int(DUR * SR)
    out = out[:, :n]
    out[:, :int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))
    out[:, -int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR))
    return out * 0.89 / (np.max(np.abs(out)) + 1e-9)


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'sound.wav'
    write_wav(path, build())
    print('wrote', path)
