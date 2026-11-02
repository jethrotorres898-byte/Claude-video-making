"""Timing for "A Venus flytrap can count" (frame-by-frame version), shared by edit.py and sound.py.
Every cut and beat is tied to a word of the narration (words.json, made by voice.py)."""
import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
V = json.load(open(os.path.join(HERE, 'words.json')))
WORDS, CTA = V['words'], V['cta_offset']


def norm(s):
    return ''.join(ch for ch in s.lower() if ch.isalnum())


def at(word, nth=1, edge='s'):
    """Start (or end) time of the nth occurrence of a word."""
    k = 0
    for w in WORDS:
        if norm(w['w']) == word:
            k += 1
            if k == nth:
                return w[edge]
    raise KeyError(f'{word} #{nth}')


SNAP = at('snap')
END = at('hear', 1, 'e') + 1.35

# (shot, start, transition into it, dissolve length)
CUTS = [
    (1, 0.0, 'cut', 0),
    (2, at('and') - 0.14, 'cut', 0),
    (3, at('this', 2) - 0.14, 'dis', 0.30),
    (4, at('inside') - 0.14, 'dis', 0.30),
    (5, at('if') - 0.14, 'dis', 0.30),
    (6, at('but') - 0.14, 'dis', 0.28),
    (7, SNAP - 0.02, 'cut', 0),
    (8, at('trap', 2) - 0.28, 'cut', 0),
    (9, at('and', 2) - 0.12, 'dis', 0.30),
    (10, at('every') - 0.16, 'dis', 0.30),
    (11, at('counts', 2) - 0.14, 'dis', 0.34),
    (12, at('plant', 3) - 0.28, 'dis', 0.34),
    (13, at('that') - 0.12, 'cut', 0),
    (14, at('so', 2) - 0.12, 'cut', 0),
    (15, at('and', 4) - 0.12, 'dis', 0.30),
]
START = {n: s for n, s, _, _ in CUTS}
PUNCH5, PUNCH10, PUNCH14 = at('nothing') - 0.10, at('and', 3) - 0.10, at('yes') - 0.12
DROP_LAND = at('one') + 0.02                               # raindrop lands on a trigger hair
FLY_TOUCH = at('touched')                                  # the fly brushes the second hair
WIGGLES = [at('struggles') + i * 0.75 for i in range(5)]   # the bug struggles, the trap counts
COUNT9 = [START[9] + 0.25 + 0.5 * k for k in range(5)]      # he counts five traps, one every half second


def bee_offset(t):
    """The bee's flight path in shot 15 (picture px), also used to pan its buzz."""
    tl = t - START[15]
    return (30 * np.sin(2 * np.pi * 0.55 * tl) + 8 * np.sin(2 * np.pi * 1.9 * tl),
            18 * np.sin(2 * np.pi * 1.1 * tl + 0.5) + 6 * np.sin(2 * np.pi * 3.1 * tl))
