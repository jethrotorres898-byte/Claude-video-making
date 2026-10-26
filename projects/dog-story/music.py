"""Barks, sound effects and the comedy score for "Rags to Riches: Dog Edition".

Everything is timed from timeline.js. Each bark's tone comes from its type
(whine, howl, snobby yips, boof?, growl, confident woof...). Writes a 44.1 kHz
stereo WAV that is the complete soundtrack (there is no separate voice track).

Usage: python3 music.py out.wav
"""
import json
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from synth import (SR, Mix, bark, bass, bell, boom, choir, clap, cymbal, engine, epiano, growl, grumble,  # noqa: E402
                   hat, horn, howl, huff, kick, onepole, pad, piano, pluck, pop, record_scratch, release,
                   reverb, riser, saw_stab, snap, stomach, sub808, taiko, tick, tt, whine, whoosh, woof,
                   write_wav, yip, click, hz)

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(re.search(r'window\.TL = (\{.*\});', open(os.path.join(HERE, 'timeline.js')).read(), re.S).group(1))
C = TL['cuts']
DUR = TL['duration']
rng = np.random.default_rng(11)

m = Mix(DUR)
mus = lambda sig, t0, g=1.0, pan=0.0: m.add('music', sig, t0, g, pan)  # noqa: E731
fx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731
vo = lambda sig, t0, g=1.0, pan=0.0: m.add('dog', sig, t0, g, pan)  # noqa: E731


# ---------- extra instruments ----------
def violin(n, dur, vel=1.0):
    t = tt(dur + 0.6)
    f = hz(n) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 2, 0, 1))
    ph = np.cumsum(f) / SR
    s = (ph % 1.0) * 2 - 1
    s = onepole(onepole(s, np.full(len(t), 0.12)), np.full(len(t), 0.25))
    env = np.clip(t / 0.25, 0, 1)
    return release(s * env, dur, 0.5) * vel * 0.35


def boing():
    t = tt(0.6)
    f = 180 + 520 * (1 - np.exp(-t * 8)) + 40 * np.sin(2 * np.pi * 18 * t) * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * 0.4


def splat():
    t = tt(0.3)
    n = rng.standard_normal(len(t))
    return (onepole(n, np.full(len(t), 0.15)) * np.exp(-t * 18) + np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 8) + 50) / SR) * np.exp(-t * 12) * 0.8) * 0.6


def rustle(dur=0.4):
    t = tt(dur)
    n = np.diff(np.concatenate([[0], rng.standard_normal(len(t))]))
    am = (np.sin(2 * np.pi * 23 * t) > 0.2).astype(float) * 0.7 + 0.3
    return n * am * np.sin(np.pi * t / dur) * 0.2


def register():
    o = np.zeros(int(0.9 * SR))
    for k, n in enumerate([96, 100]):
        b = bell(n, 0.8, 1.0)
        i = int(k * 0.06 * SR)
        o[i:i + len(b)] += b[: len(o) - i]
    c = click()
    o[: len(c)] += c * 2
    return o


def rain_noise(dur, level=0.02, seed=0):
    n = np.random.default_rng(seed).standard_normal(int(dur * SR))
    n = np.diff(np.concatenate([[0], n])) * level
    fade = np.minimum(1, np.minimum(np.arange(len(n)), len(n) - np.arange(len(n))) / (0.3 * SR))
    return n * fade


# ---------- barks: tone follows the situation ----------
for b in TL['barks']:
    t0, who, typ = b['t'], b['who'], b['type']
    pan = {'hero': -0.05, 'ex': 0.3, 'bull': 0.35, 'gf': -0.2}.get(who, 0)
    if typ == 'whine':
        vo(whine(980, 720, b['dur']), t0, 1.0, pan)
    elif typ == 'stomach':
        vo(stomach(b['dur']), t0, 1.2, pan)
    elif typ == 'howl':
        vo(howl(b['dur']), t0, 2.2, pan)
    elif typ == 'growl':
        vo(growl(b['dur']), t0, 1.1, pan)
    elif typ == 'huff':
        if who == 'bull':
            vo(grumble(0.5, 0.9, seed=21), t0, 1.0, pan)
        vo(huff(seed=int(t0 * 10)), t0 + (0.3 if who == 'bull' else 0), 1.2, pan)
    elif typ == 'grumble':
        vo(grumble(b['dur']), t0, 1.0, pan)
    elif typ == 'woof':
        vo(woof(), t0, 1.3, pan)
    elif typ == 'boof':
        vo(bark(310, 0.24, 0.8, seed=31, question=True), t0, 1.1, pan)
    elif typ in ('yip', 'bark'):
        for k in range(b.get('n', 1)):
            tk = t0 + k * b.get('gap', 0)
            f0 = b.get('f0', 600) * (1 + 0.05 * k * (1 if typ == 'yip' else -1))
            sig = yip(f0, 1.0, seed=k + int(t0)) if typ == 'yip' else bark(f0, 0.18, 1.0, seed=k + int(t0))
            vo(sig, tk, 1.7 if who == 'hero' else 1.1, pan)

for s in TL['sfx']:
    t0, typ = s['t'], s['type']
    if typ == 'horn':
        fx(horn(0.28, 420), t0, 0.9, 0.4)
    elif typ == 'scratch':
        fx(record_scratch(), t0, 1.2)
    elif typ == 'boing':
        fx(boing(), t0, 0.9)
    elif typ == 'splat':
        fx(splat(), t0, 1.0)
    elif typ == 'ding':
        for k, n in enumerate([96, 103]):
            fx(bell(n, 1.2, 1.0), t0 + k * 0.05, 0.9)

# ---------- 1. alley: rain + melodramatic violin ----------
fx(rain_noise(C['breakup'] + 0.3, 0.025, 1), 0, 1.0)
for n in (50, 57):
    mus(pad(n, C['breakup'], 0.6, att=1.2), 0)
for n, t0, d in [(69, 0.6, 1.2), (67, 1.8, 0.6), (65, 2.4, 1.6), (64, 4.1, 0.8), (62, 4.9, 1.8)]:
    mus(violin(n, d, 0.9), t0)
for n, t0 in [(50, 0.5), (46, 2.4), (45, 4.2)]:
    mus(piano(n, 1.8, 0.5), t0)

# ---------- 2. breakup: romantic swing, then the scratch, then the howl ----------
b0 = C['breakup']
swing = 0.62
for k, (ch, root) in enumerate([([65, 69, 72, 76], 41), ([64, 67, 71, 74], 40), ([62, 65, 69, 72], 38), ([67, 71, 74, 77], 43)] * 2):
    t0 = b0 + 0.1 + k * swing * 2
    if t0 > 13.3:
        break
    for j, n in enumerate(ch):
        mus(epiano(n, swing * 1.8, 0.6), t0 + j * 0.01, 0.8, (j - 1.5) * 0.3)
    mus(bass(root, swing * 0.9, 0.7), t0)
    mus(bass(root + 7, swing * 0.9, 0.6), t0 + swing)
    for q in range(2):
        mus(hat(0.5, 40), t0 + q * swing + swing * 0.66)
fx(rain_noise(17.6 - 14.2, 0.02, 2), 14.2, 0.8)
for n, t0, d in [(62, 14.5, 1.0), (65, 15.4, 0.8), (64, 16.1, 1.4)]:
    mus(violin(n, d, 1.0), t0)
mus(pad(50, 3.0, 0.6), 14.4)

# ---------- 3. peeking: sad walk, boing, curious pizzicato ----------
p0 = C['peek']
for n, t0 in [(57, p0 + 0.1), (55, p0 + 0.7), (53, p0 + 1.3)]:
    mus(piano(n, 0.6, 0.4), t0)
piz = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 77, 74]
for k in range(int((C['trash'] - 20.0) / 0.3)):
    t0 = 20.0 + k * 0.3
    mus(pluck(piz[k % len(piz)] - 12, 0.18, 0.7), t0, 0.9, 0.2 * np.sin(k))
    if k % 2 == 0:
        mus(pluck([48, 43, 45, 41][(k // 8) % 4], 0.25, 0.6), t0, 0.9)
    if t0 > C['window'] and k % 4 == 0:
        mus(bell(84 + (k % 3) * 3, 0.6, 0.5), t0, 0.35)
fx(rain_noise(1.0, 0.02, 3), 25.0, 0.7)
for t0 in (25.0, 26.0, 27.0):
    fx(whoosh(0.3), t0 - 0.15, 0.3)

# ---------- 4. trash: sneaky minor pizzicato, then the "lion king" lift ----------
t4 = C['trash']
sneak = [69, 72, 76, 72, 68, 71, 74, 71]
for k in range(int((31.0 - t4) / 0.25)):
    t0 = t4 + k * 0.25
    mus(pluck(sneak[k % 8] - 12, 0.12, 0.7), t0, 0.9)
    if k % 2 == 0:
        mus(pluck(45, 0.2, 0.6), t0)
for k in range(10):
    fx(rustle(0.25), 28.9 + k * 0.17, 0.8, 0.3 * np.sin(k))
mus(choir(62, 2.6, 0.7, att=0.3), 31.0)
mus(choir(66, 2.6, 0.55, att=0.3), 31.0)
mus(choir(69, 2.6, 0.55, att=0.3), 31.0)
mus(taiko(1.0), 31.0)
mus(cymbal(0.6), 31.0)
for k, n in enumerate([86, 90, 93, 98]):
    fx(bell(n, 1.6, 0.8), 31.1 + k * 0.08, 0.5)

# ---------- 5. trading: tense red, funky green ----------
t5 = C['trade']
mus(pad(38, 36.6 - t5, 0.7), t5)
for t0 in np.arange(t5, 36.6, 0.55):
    mus(kick(0.35), t0)
    mus(tick(1800), t0 + 0.27, 0.15)
for k in range(30):
    fx(click(), t5 + 0.3 + k * 0.14 + 0.02 * np.sin(k), 0.25)
beat = 60 / 110
for k, t0 in enumerate(np.arange(36.6, C['later'], beat)):
    mus(kick(0.9), t0)
    if k % 2:
        mus(clap(0.9), t0)
    mus(hat(0.7), t0 + beat / 2)
    root = [43, 43, 41, 45][(k // 4) % 4]
    mus(bass(root, beat * 0.4, 0.9), t0)
    mus(bass(root + 12, beat * 0.25, 0.6), t0 + beat * 0.75)
    if k % 2 == 0:
        for j, n in enumerate([67, 71, 74]):
            mus(epiano(n + (root - 43), beat * 0.4, 0.55), t0 + beat / 2 + j * 0.01, 0.8)
for t0 in (38.8, 39.25, 39.7, 40.15):
    fx(whoosh(0.3), t0 - 0.12, 0.35)

# ---------- 6. one year later ----------
fx(riser(C['lux'] - C['later'] - 0.2), C['later'] + 0.1, 0.35)
for k, n in enumerate([74, 81, 86]):
    fx(bell(n, 1.8, 0.6), C['later'] + 0.2 + k * 0.25, 0.5)

# ---------- 7-8. the gold car: swagger beat ----------
t7 = C['lux']
hb = 60 / 90
fx(engine(C['endcard'] - t7), t7, 0.18)
for k, t0 in enumerate(np.arange(t7, 53.4, hb / 2)):
    b = k % 8
    root = [38, 34, 41, 36][(k // 8) % 4]
    if b in (0, 5):
        mus(kick(1.1), t0)
    if b in (2, 6):
        mus(clap(1.0), t0)
        mus(snap(0.5), t0 + 0.01)
    mus(hat(0.6), t0)
    if b == 7:
        for q in range(3):
            mus(hat(0.45, 110), t0 + q * hb / 6)
    if b == 0:
        mus(sub808(root, hb * 3.6, 1.0), t0)
        for j, n in enumerate([62, 65, 69]):
            mus(saw_stab(n + (root - 38), 0.18, 0.7), t0, 0.9, (j - 1) * 0.3)
    if b == 3:
        for j, n in enumerate([62, 65, 69]):
            mus(saw_stab(n + (root - 38), 0.12, 0.5), t0, 0.9, (j - 1) * 0.3)
fx(whoosh(0.6), 46.9, 0.5)
mus(piano(38, 1.0, 0.7), 47.6)
mus(piano(37, 1.2, 0.7), 47.9)
fx(whoosh(0.8), C['finale'] - 0.3, 0.6)
for k in range(24):
    fx(rustle(0.3), C['finale'] + k * 0.13, 0.5, 0.4 * np.sin(k))
rev = np.clip(np.linspace(0, 1.3, int(1.4 * SR)), 0, 1)
fx(engine(1.4, rev), 53.2, 0.45)
fx(register(), 53.4, 0.9)
fx(whoosh(1.0), 53.5, 0.8)
for k in range(30):
    fx(rustle(0.3), 53.4 + k * 0.06, 0.7, 0.5 * np.sin(k * 1.3))
mus(sub808(38, 2.0, 1.0), 53.4)
mus(cymbal(1.0), 53.4)
for j, n in enumerate([62, 65, 69, 74]):
    mus(epiano(n, DUR - C['endcard'], 0.7), C['endcard'] + 0.1 + j * 0.05, 0.8, (j - 1.5) * 0.3)
    mus(pad(n - 12, DUR - C['endcard'], 0.6), C['endcard'])

# ---------- mix: music ducks under the barks ----------
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
