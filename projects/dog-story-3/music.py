"""Barks, TJR's voice, sound effects and the score for "Rags to Riches 3: Brodie".

Timed from timeline.js; TJR's lines come pre-rendered in voice.flac (see voice.py).
Writes the complete 44.1 kHz stereo soundtrack.

Usage: python3 music.py out.wav
"""
import json
import os
import re
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from synth import (SR, Mix, bark, bass, bell, boing, boom, brake_squeal, cha_ching, choir, clap, clink, clonk,  # noqa: E402
                   crunch, cymbal, door_bang, door_slam, drumroll, engine, epiano, growl, grumble, gulp, hat, horn,
                   howl, huff, hz, kick, marker_squeak, notif, onepole, pad, page_flip, paper_rustle, piano, pluck,
                   rain_noise, record_scratch, release, reverb, riser, saw_stab, slide_whistle, snap, splash, sub808,
                   taiko, tape_stop, thud, thunder, tick, tt, tweet, twinkle, whine, whoosh, woof, write_wav, yip)

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(re.search(r'window\.TL = (\{.*\});', open(os.path.join(HERE, 'timeline.js')).read(), re.S).group(1))
C = TL['cuts']
DUR = TL['duration']

m = Mix(DUR)
mus = lambda sig, t0, g=1.0, pan=0.0: m.add('music', sig, t0, g, pan)  # noqa: E731
fx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731
vo = lambda sig, t0, g=1.0, pan=0.0: m.add('dog', sig, t0, g, pan)  # noqa: E731


def violin(n, dur, vel=1.0):
    t = tt(dur + 0.6)
    f = hz(n) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 2, 0, 1))
    s = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
    s = onepole(onepole(s, np.full(len(t), 0.12)), np.full(len(t), 0.25))
    return release(s * np.clip(t / 0.25, 0, 1), dur, 0.5) * vel * 0.35


def vinyl(dur, seed=7):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    pops = (r.random(n) < 0.0006) * r.uniform(-1, 1, n)
    return (np.convolve(pops, np.exp(-np.arange(60) / 8), mode='same') * 0.25 + r.standard_normal(n) * 0.004)


def env_seg(n, t0, pts):
    """Piecewise-linear gain curve sampled for a signal starting at t0; pts = [(time, gain), ...]."""
    t = t0 + np.arange(n) / SR
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])


# ---------- barks ----------
BOSS_F = ((560, 140, 1.0), (1150, 200, 0.55), (2400, 300, 0.25))
for b in TL['barks']:
    t0, who, typ = b['t'], b['who'], b['type']
    pan = {'hero': -0.1, 'boss': 0.25}[who]
    if typ == 'whine':
        if who == 'boss':
            sig = whine(760, 560, b['dur'], seed=int(t0))
        else:
            sig = whine(1250, 950, b['dur'], seed=int(t0)) if b.get('hi') else whine(980, 720, b['dur'], seed=int(t0))
        vo(sig, t0, 1.9 if who == 'boss' else 1.4, pan)
    elif typ == 'growl':
        vo(growl(b['dur']), t0, 1.6, pan)
    elif typ == 'grumble':
        vo(grumble(b['dur']), t0, 1.9, pan)
    elif typ == 'howl':
        vo(howl(b['dur'], 1.0, seed=int(t0)), t0, 3.6, pan)
    elif typ == 'huff':
        vo(huff(seed=int(t0 * 10)), t0, 3.0, pan)
    elif typ == 'woof':
        vo(woof(), t0, 1.4, pan)
    elif typ == 'boof':
        f0 = 210 if b.get('low') else 330
        vo(bark(f0, 0.26, 0.9, seed=int(t0), question=True), t0, 2.6 if b.get('low') else 1.3, pan)
    elif typ in ('yip', 'bark'):
        for k in range(b.get('n', 1)):
            tk = t0 + k * b.get('gap', 0)
            if typ == 'yip':
                f0 = b['f0'] * (1 + (0.1 * k if b.get('question') else 0.05 * ((k * 7) % 3)))
                sig, g = yip(f0, 1.0, seed=k + int(t0 * 10)), (0.9 if b.get('chatter') else 1.7)
            elif who == 'boss':
                sig, g = bark(b['f0'] * (1 - 0.06 * k), 0.32 if b.get('big') else 0.24, 1.0, seed=k + int(t0), formants=BOSS_F), (2.0 if b.get('big') else 1.6)
            else:
                sig, g = bark(b['f0'] * (1 - 0.05 * k), 0.2, 1.0, seed=k + int(t0)), 1.5
            vo(sig, tk, g, pan)

# ---------- TJR (synthetic voice) ----------
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'voice.flac'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
voice = np.frombuffer(raw, np.float32)
m.add('voice', voice.astype(np.float64), 0.0, 1.0, 0.05)

# ---------- sound effects ----------
SFX = {
    'door': lambda: door_bang(), 'whoosh': lambda: whoosh(0.45), 'splash': lambda: splash(), 'clonk': lambda: clonk(),
    'slam': lambda: door_slam(), 'tick': lambda: tick(1200), 'thunder': lambda: thunder(2.6), 'clink': lambda: clink(),
    'hop': lambda: boing(), 'drumroll': lambda: drumroll(1.0), 'chaching': lambda: cha_ching(), 'thud': lambda: thud(),
    'twinkle': lambda: twinkle(), 'squeak': lambda: marker_squeak(0.45), 'ding': lambda: bell(96, 1.2) + bell(103, 1.2) * 0.8,
    'clap': lambda: clap(1.2), 'notif': lambda: notif(), 'horn': lambda: np.concatenate([horn(0.18), np.zeros(int(0.07 * SR)), horn(0.3)]),
    'rev': lambda: engine(1.3, np.clip(np.linspace(1.0, 0.0, int(1.3 * SR)), 0, 1)), 'brake': lambda: brake_squeal(),
    'paper': lambda: paper_rustle(0.5), 'slide': lambda: slide_whistle(1500, 250, 0.55), 'crunch': lambda: crunch(seed=int(np.random.default_rng(1).integers(99))),
    'scratch': lambda: record_scratch(), 'gulp': lambda: gulp(), 'thunk': lambda: thud() * 0.6,
}
GAIN = {'thunder': 0.75, 'rev': 0.45, 'whoosh': 0.5, 'splash': 0.8, 'tick': 0.6, 'clink': 1.2, 'squeak': 1.4, 'paper': 0.6, 'crunch': 1.1, 'ding': 0.8}
for s_ in TL['sfx']:
    typ, t0 = s_['type'], s_['t']
    if typ == 'flips':
        for k in range(23):
            fx(page_flip(seed=k), t0 + k / 23 * 1.0, 0.35, 0.3 * np.sin(k))
    elif typ == 'tweet':
        for k in range(14):
            fx(tweet(seed=k), t0 + k * 0.13 + 0.03 * np.sin(k * 3), 0.9, 0.4 * np.sin(k))
    else:
        fx(SFX[typ](), t0, GAIN.get(typ, 1.0))
fx(thunder(3.0, seed=5) * 0.35, 0.1, 0.5, -0.3)

# rain: storefront + walk, fading out during the fast-forward; the boss's own little cloud later
rn = rain_noise(20.2, 0.024, 3)
fx(rn * env_seg(len(rn), 0.0, [(0, 1), (18.4, 1), (20.0, 0)]), 0.0, 1.0)
fx(rain_noise(C['owner'] - C['store'], 0.012, 8), C['store'], 0.8, 0.35)

# ---------- 1. fired: store muzak, muffled behind the door ----------
mz = Mix(10.5)
mb = 60 / 104
prog_ = [(53, [57, 60, 64, 67]), (52, [55, 59, 62, 64]), (50, [53, 57, 60, 64]), (55, [59, 62, 65, 69])]
for k, t0 in enumerate(np.arange(0.0, 7.0, mb)):
    root, ch = prog_[(k // 4) % 4]
    if k % 4 == 0:
        for j, n in enumerate(ch):
            mz.add('m', epiano(n + 12, mb * 3.6, 0.5), t0 + j * 0.012)
    mz.add('m', bass(root - 12 + (7 if k % 2 else 0), mb * 0.8, 0.8), t0)
    mz.add('m', hat(0.4), t0 + mb / 2)
    if k % 2:
        mz.add('m', snap(0.4), t0)
    mz.add('m', pluck([72, 76, 74, 71, 69, 72, 74, 76][k % 8], 0.18, 0.5), t0 + mb * 0.5)
mzb = mz.bus('m')
coef = env_seg(mzb.shape[1], 0.0, [(0, 0.03), (0.8, 0.03), (0.86, 0.5), (6.9, 0.5), (6.97, 0.025), (10.5, 0.025)])
gain = env_seg(mzb.shape[1], 0.0, [(0, 0.5), (0.8, 0.5), (0.86, 1.0), (6.9, 1.0), (6.97, 0.3), (7.6, 0.0), (10.5, 0)])
for ch in range(2):
    m.bus('music')[ch, :mzb.shape[1]] += onepole(mzb[ch], coef) * gain * 0.8
for n, t0 in [(57, 7.6), (53, 8.3), (52, 9.0), (50, 9.6)]:
    mus(piano(n, 1.4, 0.55), t0)

# ---------- 2. the walk home, then meeting TJR ----------
t2 = C['walk']
mus(pad(50, 2.8, 0.55), t2)
mus(violin(57, 1.1, 0.6), t2 + 0.5)
mus(violin(55, 1.4, 0.6), t2 + 1.6)
for k, n in enumerate([67, 71, 74, 72]):
    mus(pluck(n, 0.2, 0.6), 12.5 + k * 0.16, 0.9, 0.2)
for j, n in enumerate([60, 64, 67]):
    mus(pad(n, 3.8, 0.45, att=1.0), 14.6, 1.0, (j - 1) * 0.4)
for j, n in enumerate([65, 69, 72]):
    mus(pad(n, 2.6, 0.4, att=0.6), 16.4, 0.8, (j - 1) * 0.4)
for k, n in enumerate([72, 76, 79]):
    mus(piano(n, 0.6, 0.4), 15.4 + k * 0.3)

# ---------- 3. fast-forward: sped-up lofi + racing clock ----------
t3 = C['chat']
fb = 60 / 190
for k, t0 in enumerate(np.arange(t3, 21.0, fb)):
    mus(kick(0.45), t0) if k % 2 == 0 else mus(snap(0.45), t0)
    mus(hat(0.5), t0 + fb / 2)
    mus(epiano([76, 79, 83, 86][k % 4], fb * 0.9, 0.4), t0, 0.8, 0.3 * np.sin(k))
    mus(bass([48, 45, 41, 43][(k // 4) % 4], fb * 0.9, 0.6), t0)
for k in range(26):
    fx(tick(2400), t3 + 0.1 + k * 0.1, 0.25, 0.5)
fx(tape_stop(0.5), 21.0, 0.6)

# ---------- 4-5. the number, the jaw drop ----------
for k, n in enumerate([91, 95, 98]):
    fx(bell(n, 1.0, 0.6), 22.75 + k * 0.05, 0.5)
t5 = C['shock']
for n in (48, 51, 55, 60, 63):
    mus(saw_stab(n, 0.3, 1.0), t5 - 0.04, 0.4)
mus(taiko(1.0), t5 - 0.04, 0.9)
mus(cymbal(1.0), t5 - 0.04, 0.2)

# ---------- 6. begging: sappy violin, then "alright" warmth ----------
t6 = C['beg']
for n, t0, d in [(76, t6 + 0.2, 0.9), (74, t6 + 1.1, 0.5), (72, t6 + 1.6, 0.5), (74, t6 + 2.1, 1.4)]:
    mus(violin(n, d, 0.75), t0)
for k in range(10):
    mus(piano([57, 60, 64, 60][k % 4], 0.5, 0.35), t6 + k * 0.26)
for j, n in enumerate([60, 64, 67, 72]):
    mus(pad(n, 3.0, 0.5, att=0.8), 27.8, 0.9, (j - 1.5) * 0.3)
for k, n in enumerate([60, 64, 67, 72, 76, 79, 84]):
    mus(pluck(n, 0.5, 0.5), 30.1 + k * 0.05, 0.7, 0.5 * np.sin(k))

# ---------- 7-9. lessons montage: boom-bap ----------
t7 = C['board']
bb = 60 / 90
for k, t0 in enumerate(np.arange(t7, 40.2, bb / 2)):
    beat = k % 8
    night = C['night'] <= t0 < 36.4
    if 38.3 <= t0 < 39.6:  # the beat drops out for TJR's line
        continue
    root = [45, 41, 43, 40][(k // 8) % 4]
    if beat in (0, 3) and not (night and beat == 3):
        mus(kick(0.8 if night else 1.0), t0)
    if beat in (2, 6) and not night:
        mus(snap(0.9), t0)
        mus(clap(0.5), t0)
    mus(hat(0.35 if night else 0.5), t0 + (0.03 if k % 2 else 0))
    if beat == 0:
        mus(bass(root, bb * 3.6, 0.7), t0)
        for j, n in enumerate([60, 64, 67, 71]):
            mus(epiano(n + (root - 45), bb * 3.5, 0.4 if night else 0.5), t0 + j * 0.015, 0.8)
fx(vinyl(40.2 - t7), t7, 0.4)
mus(cymbal(0.8), 36.4, 0.6)

# ---------- 10. two years later ----------
fx(riser(C['rich'] - C['later'] - 0.2), C['later'] + 0.1, 0.3)
for k, n in enumerate([74, 81, 86]):
    fx(bell(n, 1.6, 0.6), C['later'] + 0.2 + k * 0.25, 0.5)

# ---------- 11-12. the drive and the store: trap swagger ----------
t11 = C['rich']
mus(boom(), t11, 0.7)
mus(cymbal(1.0), t11, 0.7)
sb = 60 / 140
for k, t0 in enumerate(np.arange(t11, 51.8, sb / 2)):
    beat = k % 16
    root = [38, 38, 34, 36][(k // 16) % 4]
    if beat in (0, 6, 10):
        mus(kick(1.0), t0)
    if beat in (4, 12):
        mus(clap(1.0), t0)
    mus(hat(0.45), t0)
    if beat in (14, 15) and (k // 16) % 2:
        mus(hat(0.4), t0 + sb / 4)
    if beat == 0:
        mus(sub808(root, sb * 7.5, 0.9), t0)
        for j, n in enumerate([62, 65, 69]):
            mus(saw_stab(n + (root - 38), 0.16, 0.7), t0 + j * 0.005, 0.6)
    if beat == 8:
        for j, n in enumerate([62, 65, 69]):
            mus(saw_stab(n + (root - 38), 0.12, 0.6), t0, 0.5)
fx(engine(C['store'] - t11, np.full(int((C['store'] - t11) * SR), 0.3)), t11, 0.18)
fx(tape_stop(0.6), 51.8, 0.7)
mus(tape_stop(0.6) * 0.5, 51.8, 0.6)
# the check: ta-da
for k, n in enumerate([60, 64, 67, 72]):
    mus(saw_stab(n, 0.12 if k < 3 else 0.9, 0.9), 53.5 + k * 0.09, 0.8)
mus(cymbal(1.0), 53.77, 0.6)

# ---------- 13-14. new management: bouncy comedy groove ----------
t13 = C['owner']
eb = 60 / 118
for k, t0 in enumerate(np.arange(t13, 60.38, eb / 2)):
    b_ = k % 4
    if b_ == 0:
        mus(bass([43, 48, 41, 43][(k // 8) % 4], eb * 0.4, 0.8), t0)
    if b_ == 2:
        mus(pluck([67, 72, 69, 71][(k // 8) % 4], 0.12, 0.6), t0)
    if k % 4 == 1:
        mus(snap(0.5), t0)
for k, t0 in enumerate(np.arange(C['stash'], C['endcard'], eb / 2)):
    b_ = k % 8
    if b_ in (0, 3):
        mus(kick(0.8), t0)
    if b_ in (4,):
        mus(snap(0.7), t0)
    mus(hat(0.35), t0)
    if b_ == 0:
        mus(bass([41, 43][(k // 8) % 2], eb * 1.6, 0.8), t0)
        for j, n in enumerate([64, 67, 71]):
            mus(epiano(n + [41, 43][(k // 8) % 2] - 41, eb * 1.8, 0.45), t0 + j * 0.01, 0.8)
for j, n in enumerate([62, 65, 69, 74]):
    mus(epiano(n, DUR - C['endcard'], 0.6), C['endcard'] + 0.1 + j * 0.05, 0.8, (j - 1.5) * 0.3)
    mus(pad(n - 12, DUR - C['endcard'], 0.55), C['endcard'])

# ---------- mix ----------
music, sfx, dogv, vox = m.bus('music'), m.bus('sfx'), m.bus('dog'), m.bus('voice')
for ch in range(2):
    music[ch] += 0.22 * reverb(music[ch], 2.0, 2.8, seed=ch)
    sfx[ch] += 0.12 * reverb(sfx[ch], 1.4, 3.5, seed=10 + ch)
    dogv[ch] += 0.14 * reverb(dogv[ch], 1.2, 4.0, seed=20 + ch)
    vox[ch] += 0.08 * reverb(vox[ch], 0.9, 5.0, seed=30 + ch)
e = np.abs(dogv[0]) + np.abs(dogv[1]) + 1.5 * (np.abs(vox[0]) + np.abs(vox[1]))
e = np.convolve(e, np.ones(4410) / 4410, mode='same')
e = np.clip(e / (np.percentile(e[e > 1e-4], 95) + 1e-9), 0, 1)
mix = music * (1 - 0.65 * e) * 0.5 + sfx * 0.8 * (1 - 0.3 * e) + dogv * 1.0 + vox * 1.3
n = int(DUR * SR)
fade = np.ones(m.n)
fade[n - int(0.6 * SR):n] = np.linspace(1, 0, int(0.6 * SR))
fade[n:] = 0
mix = (mix * fade)[:, :n]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.4) / np.tanh(1.4) * 0.9
write_wav(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', mix)
print('wrote soundtrack', DUR)
