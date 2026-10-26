"""Barks, sound effects and the comedy score for "Rags to Riches 2: The Glow Up".

Timed from timeline.js. Writes the complete 44.1 kHz stereo soundtrack.

Usage: python3 music.py out.wav
"""
import json
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from synth import (SR, Mix, bark, bass, bell, choir, clap, click, cymbal, engine, epiano, growl, grumble,  # noqa: E402
                   hat, horn, huff, hz, kick, onepole, pad, piano, pluck, record_scratch, release, reverb,
                   riser, saw_stab, snap, sub808, tick, tt, whine, whoosh, woof, write_wav, yip)

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(re.search(r'window\.TL = (\{.*\});', open(os.path.join(HERE, 'timeline.js')).read(), re.S).group(1))
C = TL['cuts']
DUR = TL['duration']
rng = np.random.default_rng(12)

m = Mix(DUR)
mus = lambda sig, t0, g=1.0, pan=0.0: m.add('music', sig, t0, g, pan)  # noqa: E731
fx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731
vo = lambda sig, t0, g=1.0, pan=0.0: m.add('dog', sig, t0, g, pan)  # noqa: E731


# ---------- extra instruments & effects ----------
def accordion(n, dur, vel=1.0):
    t = tt(dur + 0.3)
    s = sum((((hz(n) * d * t) % 1.0) * 2 - 1) for d in (1, 1.004, 0.997))
    s = onepole(s, np.full(len(t), 0.2)) * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t))
    return release(s * np.clip(t / 0.05, 0, 1), dur, 0.2) * vel * 0.12


def violin(n, dur, vel=1.0):
    t = tt(dur + 0.6)
    f = hz(n) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 2, 0, 1))
    s = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
    s = onepole(onepole(s, np.full(len(t), 0.12)), np.full(len(t), 0.25))
    return release(s * np.clip(t / 0.25, 0, 1), dur, 0.5) * vel * 0.35


def trombone(n, dur, vel=1.0, wah=True):
    """Sad trombone note with a wah (lowpass swell) and a droopy end."""
    t = tt(dur + 0.1)
    u = t / dur
    f = hz(n) * (1 - 0.06 * np.clip(u - 0.6, 0, 1) / 0.4) * (1 + 0.012 * np.sin(2 * np.pi * 5 * t))
    s = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
    coef = 0.04 + 0.22 * np.sin(np.pi * np.clip(u, 0, 1)) if wah else np.full(len(t), 0.15)
    s = onepole(onepole(s, coef), coef)
    return release(s * np.clip(t / 0.04, 0, 1), dur, 0.08) * vel * 0.6


def harp_gliss(t0, notes, step=0.045, vel=0.7):
    for k, n in enumerate(notes):
        mus(pluck(n, 0.6, vel), t0 + k * step, 0.8, 0.5 * np.sin(k))


def crickets(dur):
    t = tt(dur)
    chirp = (np.sin(2 * np.pi * 4500 * t) * (np.sin(2 * np.pi * 32 * t) > 0.3)) * ((t * 2.2) % 1 < 0.35)
    return chirp * 0.06


def slurp():
    t = tt(0.5)
    f = 300 + 900 * t / 0.5
    n = rng.standard_normal(len(t))
    return onepole(n, 0.05 + 0.3 * t / 0.5) * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.5) * 0.6


def thud():
    t = tt(0.3)
    return np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-t * 40)) / SR) * np.exp(-t * 18) * 0.8


def shake_fx():
    t = tt(0.6)
    n = np.diff(np.concatenate([[0], rng.standard_normal(len(t))]))
    return n * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * t / 0.6) * 0.25


def splash():
    t = tt(0.9)
    n = rng.standard_normal(len(t))
    return onepole(n, 0.25 * np.exp(-t * 2) + 0.03) * np.exp(-t * 3.5) * 0.9


def flick():
    t = tt(0.25)
    n = np.diff(np.concatenate([[0], rng.standard_normal(len(t))]))
    return n * np.exp(-t * 20) * 0.4


def beep():
    t = tt(0.14)
    return np.sign(np.sin(2 * np.pi * 880 * t)) * np.exp(-t * 6) * 0.12


def camera_click():
    t = tt(0.12)
    return rng.standard_normal(len(t)) * np.exp(-t * 60) * 0.25


def rain_noise(dur, level=0.02, seed=0):
    n = np.random.default_rng(seed).standard_normal(int(dur * SR))
    n = np.diff(np.concatenate([[0], n])) * level
    fade = np.minimum(1, np.minimum(np.arange(len(n)), len(n) - np.arange(len(n))) / (0.3 * SR))
    return n * fade


# ---------- barks ----------
for b in TL['barks']:
    t0, who, typ = b['t'], b['who'], b['type']
    pan = {'hero': -0.05, 'ex': 0.25, 'bull': 0.3, 'gf': -0.2}.get(who, 0)
    if typ == 'whine':
        sig = whine(1250, 950, b['dur'], seed=int(t0)) if b.get('hi') else whine(980, 720, b['dur'], seed=int(t0))
        vo(sig, t0, 1.0, pan)
    elif typ == 'growl':
        vo(growl(b['dur']), t0, 1.2, pan)
    elif typ == 'grumble':
        vo(grumble(b['dur']), t0, 1.1, pan)
    elif typ == 'huff':
        if who == 'bull':
            vo(grumble(0.45, 0.8, seed=int(t0)), t0, 0.9, pan)
        vo(huff(seed=int(t0 * 10)), t0 + (0.3 if who == 'bull' else 0), 1.3 if who == 'bull' else 2.4, pan)
    elif typ == 'woof':
        vo(woof(), t0, 1.4, pan)
    elif typ == 'boof':
        f0 = 210 if b.get('low') else 310
        vo(bark(f0, 0.26, 0.9, seed=int(t0), question=True), t0, 2.0 if b.get('low') else 1.3, pan)
    elif typ in ('yip', 'bark'):
        for k in range(b.get('n', 1)):
            tk = t0 + k * b.get('gap', 0)
            f0 = b.get('f0', 600) * (1 + (0.12 if b.get('flirty') else 0.05) * k)
            sig = yip(f0, 1.0, seed=k + int(t0)) if typ == 'yip' else bark(f0, 0.2, 1.0, seed=k + int(t0))
            vo(sig, tk, 1.7 if who == 'hero' else (2.2 if b.get('flirty') else 1.3), pan)

SFX = {'slurp': lambda: slurp(), 'scratch': lambda: record_scratch(), 'thud': lambda: thud(), 'shake': lambda: shake_fx(),
       'beep': lambda: np.concatenate([beep(), np.zeros(int(0.08 * SR)), beep()]), 'flick': lambda: flick(),
       'rev': lambda: engine(1.4, np.clip(np.linspace(0, 1.3, int(1.4 * SR)), 0, 1)), 'splash': lambda: splash()}
for s_ in TL['sfx']:
    if s_['type'] == 'ding':
        for k, n in enumerate([96, 103]):
            fx(bell(n, 1.2, 1.0), s_['t'] + k * 0.05, 0.9)
    else:
        fx(SFX[s_['type']](), s_['t'], {'rev': 0.45, 'flick': 0.5, 'splash': 0.75}.get(s_['type'], 1.0))

# ---------- 1. café: romantic waltz, cut by the scratch ----------
waltz = [(65, [53, 57, 60]), (64, [52, 55, 60]), (62, [50, 53, 57]), (67, [55, 59, 62])]
beat = 0.4
for bar in range(int(3.9 / (beat * 3)) + 1):
    t0 = 0.2 + bar * beat * 3
    if t0 >= 3.9:
        break
    mel, ch = waltz[bar % 4]
    mus(bass(ch[0] - 12, beat * 0.9, 0.7), t0)
    for k in (1, 2):
        for n in ch:
            mus(accordion(n + 12, beat * 0.6, 0.6), t0 + k * beat)
    mus(accordion(mel + 12, beat * 2.6, 1.0), t0)
for n, t0 in [(57, 4.6), (53, 5.8), (52, 7.2), (50, 8.6)]:
    mus(piano(n, 1.6, 0.55), t0)
mus(violin(62, 1.3, 0.8), 8.8)

# ---------- 2. street: rain, then warm hope ----------
t2 = C['street']
fx(rain_noise(C['lessons'] - t2 + 0.3, 0.022, 3), t2, 1.0)
mus(pad(50, 3.0, 0.6), t2)
mus(violin(57, 1.2, 0.7), t2 + 0.6)
mus(violin(55, 1.6, 0.7), t2 + 1.9)
for j, n in enumerate([60, 64, 67]):
    mus(pad(n, C['lessons'] - 13.0, 0.6, att=1.0), 13.0, 1.0, (j - 1) * 0.4)
for k, n in enumerate([72, 76, 79, 84, 79, 76]):
    mus(piano(n, 0.6, 0.45), 13.2 + k * 0.45)
fx(bell(88, 1.4, 0.7), 14.0, 0.6)

# ---------- 3. lessons montage: lofi groove ----------
t3 = C['lessons']
lb = 60 / 96
for k, t0 in enumerate(np.arange(t3, C['later'], lb)):
    mus(kick(0.7), t0)
    if k % 2:
        mus(snap(0.7), t0)
    mus(hat(0.5), t0 + lb / 2)
    root = [48, 45, 41, 43][(k // 4) % 4]
    mus(bass(root, lb * 0.8, 0.7), t0)
    if k % 2 == 0:
        for j, n in enumerate([64, 67, 71]):
            mus(epiano(n + (root - 48), lb * 1.6, 0.5), t0 + j * 0.01, 0.8)
for k in range(16):
    fx(click(), t3 + 0.4 + k * 0.11, 0.2)

# ---------- 4. one year later ----------
fx(riser(C['bella'] - C['later'] - 0.2), C['later'] + 0.1, 0.3)
for k, n in enumerate([74, 81, 86]):
    fx(bell(n, 1.6, 0.6), C['later'] + 0.2 + k * 0.25, 0.5)

# ---------- 5. Bella's downfall: sad violin + sad trombone ----------
t5 = C['bella']
fx(rain_noise(C['meet'] - t5, 0.02, 5), t5, 0.9)
for n, t0, d in [(64, t5 + 0.2, 1.0), (62, t5 + 1.2, 1.0), (60, t5 + 2.2, 1.2)]:
    mus(violin(n, d, 0.8), t0)
for k, (n, d) in enumerate([(58, 0.45), (57, 0.45), (56, 0.45), (55, 1.2)]):
    mus(trombone(n - 12, d, 1.0), 32.6 + k * 0.5)

# ---------- 6. the encounter: smooth swagger, music drops for the burn ----------
t6 = C['meet']
sb = 60 / 88
for k, t0 in enumerate(np.arange(t6, 38.6, sb / 2)):
    b_ = k % 8
    root = [38, 34, 41, 36][(k // 8) % 4]
    if b_ in (0, 5):
        mus(kick(1.0), t0)
    if b_ in (2, 6):
        mus(clap(0.9), t0)
    mus(hat(0.5), t0)
    if b_ == 0:
        mus(sub808(root, sb * 3.6, 0.9), t0)
        for j, n in enumerate([62, 65, 69]):
            mus(epiano(n + (root - 38), sb * 3.5, 0.55), t0 + j * 0.01, 0.8)
for k in range(10):
    tc = t6 + 0.3 + k * 0.42 + 0.1 * np.sin(k)
    if not 36.2 < tc < 38.4:
        fx(camera_click(), tc, 0.6, 0.6 * np.sin(k * 2))
for k, t0 in enumerate(np.arange(39.2 + 0.9, C['reveal'], sb / 2)):
    if k % 4 == 0:
        mus(kick(0.8), t0)
    mus(hat(0.4), t0)

# ---------- 7. the reveal: harp, choir, strings; then crickets ----------
t7 = C['reveal']
harp_gliss(t7 + 0.2, [60, 64, 67, 72, 76, 79, 84, 88, 91, 96])
for n in (60, 64, 67):
    mus(choir(n + 12, 4.0, 0.8, att=0.6), t7 + 0.4)
for n, t0, d in [(72, t7 + 0.6, 1.6), (76, t7 + 2.2, 1.0), (79, t7 + 3.2, 1.4)]:
    mus(violin(n, d, 0.9), t0)
for k in range(16):
    fx(camera_click(), t7 + 0.4 + k * 0.22 + 0.05 * np.sin(k), 0.7, 0.7 * np.sin(k * 1.7))
fx(crickets(C['ending'] - 47.6), 47.6, 1.0)

# ---------- 8. the ending: bouncy comedy, scratch-freeze for "NO." ----------
t8 = C['ending']
eb = 60 / 120
for k, t0 in enumerate(np.arange(t8, 58.2, eb / 2)):
    b_ = k % 4
    if b_ == 0:
        mus(bass([43, 48, 41, 43][(k // 8) % 4], eb * 0.4, 0.8), t0)
    if b_ == 2:
        mus(pluck([67, 72, 69, 71][(k // 8) % 4], 0.12, 0.6), t0)
    if k % 4 == 1:
        mus(snap(0.5), t0)
fx(record_scratch(), 58.25, 0.8)
for j, n in enumerate([62, 65, 69, 74]):
    mus(epiano(n, DUR - C['endcard'], 0.6), C['endcard'] + 0.1 + j * 0.05, 0.8, (j - 1.5) * 0.3)
    mus(pad(n - 12, DUR - C['endcard'], 0.55), C['endcard'])

# ---------- mix ----------
music, sfx, dogv = m.bus('music'), m.bus('sfx'), m.bus('dog')
for ch in range(2):
    music[ch] += 0.25 * reverb(music[ch], 2.0, 2.8, seed=ch)
    sfx[ch] += 0.12 * reverb(sfx[ch], 1.4, 3.5, seed=10 + ch)
    dogv[ch] += 0.16 * reverb(dogv[ch], 1.2, 4.0, seed=20 + ch)
e = np.abs(dogv[0]) + np.abs(dogv[1])
e = np.convolve(e, np.ones(4410) / 4410, mode='same')
e = np.clip(e / (np.percentile(e[e > 1e-4], 95) + 1e-9), 0, 1)
mix = music * (1 - 0.5 * e) * 0.5 + sfx * 0.8 + dogv * 1.0
n = int(DUR * SR)
fade = np.ones(m.n)
fade[n - int(0.6 * SR):n] = np.linspace(1, 0, int(0.6 * SR))
fade[n:] = 0
mix = (mix * fade)[:, :n]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.4) / np.tanh(1.4) * 0.9
write_wav(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', mix)
print('wrote soundtrack', DUR)
