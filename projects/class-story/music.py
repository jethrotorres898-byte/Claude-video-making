"""Energetic 128 BPM soundtrack + sound effects for "They Laughed In Class".

Timed from voice.js; the beat drops on "So I kept going". The music is ducked
under the voices. Writes a 44.1 kHz stereo WAV without the voices.

Usage: python3 music.py out.wav
"""
import json
import os
import re
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from synth import (SR, Mix, bass, bell, boom, buzz, clap, cymbal, epiano, hat, kick, pad, piano,  # noqa: E402
                   pluck, pop, reverb, riser, snap, sub808, tape_stop, thud, tick, whoosh, write_wav)

HERE = os.path.dirname(os.path.abspath(__file__))
V = json.loads(re.search(r'window\.VOICE = (.*);\s*$', open(os.path.join(HERE, 'voice.js')).read(), re.S).group(1))
L = V['lines']
DUR = V['duration']


def line_words(line):
    sw = line['text'].split()
    ww = line['words']
    if len(ww) == len(sw):
        return [(w, x['s'], x['e']) for w, x in zip(sw, ww)]
    s0 = ww[0]['s'] if ww else line['s']
    e0 = ww[-1]['e'] if ww else line['e']
    tot = sum(len(w) + 1 for w in sw)
    out, acc = [], 0
    for w in sw:
        s = s0 + (e0 - s0) * acc / tot
        acc += len(w) + 1
        out.append((w, s, s0 + (e0 - s0) * acc / tot))
    return out


def wt(i, target):
    for w, s, _ in line_words(L[i]):
        if re.sub(r"[^a-z0-9']", '', w.lower()).startswith(target.lower()):
            return s
    return L[i]['s']


def raw(i, sub):
    for w in L[i]['words']:
        if sub in w['w'].lower():
            return w['s']
    return L[i]['s']


ls = lambda i: L[i]['s']  # noqa: E731
le = lambda i: L[i]['e']  # noqa: E731
BEAT = 60 / 128
DROP = ls(9)
CUT = dict(lose=ls(3) - 0.15, quit=ls(6) - 0.2, night=ls(7) - 0.2, grind=DROP - 0.12, class2=ls(14) - 0.15, end=ls(18) - 0.2)


def grid(t0, t1):
    """Beat times on the 128 BPM grid anchored at the drop."""
    k0 = int(np.ceil((t0 - DROP) / BEAT))
    out = []
    k = k0
    while DROP + k * BEAT < t1:
        out.append((k, DROP + k * BEAT))
        k += 1
    return out


m = Mix(DUR)
mus = lambda sig, t0, g=1.0, pan=0.0: m.add('music', sig, t0, g, pan)  # noqa: E731
fx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731

# I-V-vi-IV in C: bright and bouncy
C, G, AM, F = [60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]
PROG = [C, G, AM, F]
ROOT = {id(C): 36, id(G): 43, id(AM): 45, id(F): 41}
DM, BB = [62, 65, 69], [58, 62, 65]


def chord_at(k):
    return PROG[(k // 4) % 4]


def bounce(t0, t1, vel=1.0, full=True):
    """Bouncy pop groove: kick, clap, hats, plucky chords, bass."""
    for k, t in grid(t0, t1):
        ch = chord_at(k)
        b = k % 4
        mus(kick(1.0 * vel), t)
        if b in (1, 3):
            mus(clap(0.9 * vel), t)
        mus(hat(0.8 * vel), t + BEAT / 2)
        if full:
            mus(hat(0.4 * vel, 120), t + BEAT * 0.25)
            mus(hat(0.4 * vel, 120), t + BEAT * 0.75)
        mus(bass(ROOT[id(ch)], BEAT * 0.45, 0.9 * vel), t)
        mus(bass(ROOT[id(ch)] + 12, BEAT * 0.3, 0.6 * vel), t + BEAT / 2)
        tones = [n + 12 for n in ch]
        for q in range(2):
            mus(pluck(tones[(b * 2 + q) % 3] + (12 if q else 0), 0.15, 0.55 * vel), t + q * BEAT / 2, 0.8, 0.3 * (1 if q else -1))
        if b == 0:
            for j, n in enumerate(ch):
                mus(pad(n, BEAT * 4, 0.5 * vel), t, 1.0, (j - 1) * 0.4)


# ---------- class: playful groove ----------
bounce(0.2, CUT['lose'], 0.75, full=False)
fx(pop(), wt(0, 'laughed'), 0.6)
fx(buzz(0.2), ls(1) - 0.05, 0.25)

# ---------- losing: tense, minor ----------
for k, t in grid(CUT['lose'], CUT['quit']):
    mus(kick(0.9), t)
    if k % 2:
        mus(snap(0.9), t)
    mus(hat(0.7), t + BEAT / 2)
    mus(bass(38, BEAT * 0.4, 0.9), t)
    mus(bass(38, BEAT * 0.3, 0.7), t + BEAT / 2)
for j, n in enumerate(DM):
    mus(pad(n, CUT['quit'] - CUT['lose'], 0.6), CUT['lose'], 1.0, (j - 1) * 0.4)
hits = [s for _, s, _ in line_words(L[4])] + [raw(5, '50'), raw(5, '100')]
for h in hits:
    fx(thud(), h, 0.8)
    fx(buzz(0.18), h + 0.02, 0.3)
tEv = raw(5, 'everything')
fx(boom(), tEv, 0.8)
fx(tape_stop(0.8), tEv + 0.4, 0.5)

# ---------- almost quit: rain + sad piano ----------
rain_n = int((CUT['night'] - CUT['quit'] + 0.4) * SR)
rain = np.random.default_rng(9).standard_normal(rain_n)
rain = np.diff(np.concatenate([[0], rain])) * 0.04
fx(rain * np.minimum(1, np.linspace(0, 6, rain_n)) * np.minimum(1, np.linspace(6, 0, rain_n)), CUT['quit'], 0.9)
for k2, n in enumerate([69, 65, 62, 57]):
    mus(piano(n, 0.9, 0.6), CUT['quit'] + 0.1 + k2 * 0.4)

# ---------- 2 AM: ambient build, TJR, impact ----------
tN, tT, tHit = CUT['night'], wt(7, 'tjr'), wt(8, 'hit')
for j, n in enumerate(AM):
    mus(pad(n, tHit - tN, 0.6), tN, 1.0, (j - 1) * 0.4)
for q in range(int((tT - tN) / (BEAT / 2))):
    mus(epiano(76 if q % 4 else 81, 0.2, 0.35), tN + 0.2 + q * BEAT / 2)
fx(whoosh(0.5), tT - 0.15, 0.6)
for k2, n in enumerate([72, 76, 79, 84]):
    fx(bell(n, 1.6), tT + k2 * 0.06, 0.7)
for k, t in grid(tT, tHit - 0.05):  # heartbeat-ish build under the video
    mus(kick(0.45 + 0.4 * (t - tT) / max(0.1, tHit - tT)), t)
    mus(hat(0.6), t + BEAT / 2)
fx(riser(tHit - tT), tT, 0.45)
fx(boom(), tHit, 1.0)
mus(cymbal(1.2), tHit)
fx(riser(DROP - tHit - 0.1), tHit + 0.1, 0.6)  # silence-ish lift into the drop

# ---------- drop: the grind ----------
mus(cymbal(1.3), DROP)
fx(kick(1.4), DROP, 0.8)
fx(thud(), DROP + 0.02, 0.9)
bounce(DROP, CUT['class2'], 1.0, full=True)
w11 = line_words(L[11])
fx(bell(88, 0.7), wt(10, 'small'), 0.6)
for _, s, _ in (w11[0], w11[3], w11[6]):
    fx(thud(), s, 0.7)
    fx(whoosh(0.3), s - 0.12, 0.35)
tW4, tG = w11[6][1], ls(12)
for q in range(int((tG - tW4) / 0.0625)):  # drum roll into GREEN
    mus(snap(0.3 + 0.7 * q / max(1, (tG - tW4) / 0.0625)), tW4 + 0.2 + q * 0.0625)
fx(boom(), tG, 0.5)
mus(cymbal(1.3), tG)
for k2, n in enumerate([84, 88, 91, 96]):
    fx(bell(n, 1.4), tG + k2 * 0.05, 0.8)
fx(pop(), tG, 0.8, -0.3)
fx(pop(), tG + 0.07, 0.7, 0.3)
for w, s, _ in line_words(L[13]):
    if 'again' in w.lower():
        for k2, n in enumerate([84, 88, 91]):
            fx(bell(n, 0.9), s + k2 * 0.04, 0.55)

# ---------- class again + ending ----------
fx(whoosh(0.4), CUT['class2'] - 0.2, 0.5)
bounce(CUT['class2'], CUT['end'], 0.85, full=True)
for spk_line in (15, 16, 17):
    fx(pop(), ls(spk_line) - 0.05, 0.45)
fx(whoosh(0.4), CUT['end'] - 0.2, 0.5)
bounce(CUT['end'], wt(19, 'coming'), 0.8, full=False)
tCom = wt(19, 'coming')
mus(kick(1.2), tCom)
mus(cymbal(1.2), tCom)
for j, n in enumerate(C + [72]):
    mus(piano(n + 12, DUR - tCom, 0.9), tCom + j * 0.02, 0.7, (j - 1.5) * 0.3)
    mus(pad(n, DUR - tCom, 0.8), tCom, 1.0, (j - 1.5) * 0.3)
mus(sub808(36, DUR - tCom, 0.9), tCom)
fx(bell(91, 1.2), wt(18, 'works'), 0.5)

# ---------- mix with ducking under the voices ----------
music, sfx = m.bus('music'), m.bus('sfx')
for ch in range(2):
    music[ch] += 0.22 * reverb(music[ch], seed=ch)
    sfx[ch] += 0.1 * reverb(sfx[ch], 1.2, 4, seed=10 + ch)
with wave.open(os.path.join(HERE, 'voice.wav')) as w:
    vsr = w.getframerate()
    voice = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64)
voice /= np.max(np.abs(voice)) + 1e-9
hop = vsr // 100
env = np.array([np.sqrt(np.mean(voice[i:i + hop] ** 2)) for i in range(0, len(voice), hop)])
env = np.convolve(env, np.ones(20) / 20, mode='same')
env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
e = np.interp(np.arange(m.n) / SR, np.arange(len(env)) / 100, env, right=0)
# extra dip under the fastest line in the drop so every word stays clear
dip = np.ones(m.n)
i0, i1 = int((ls(10) - 0.15) * SR), int((wt(10, 'practiced')) * SR)
dip[i0:i1] = 0.45
dip = np.convolve(dip, np.ones(2205) / 2205, mode='same')
mix = music * dip * (1 - 0.62 * e) * 0.6 + sfx * (1 - 0.4 * e) * 0.85
n = int(DUR * SR)
fade = np.ones(m.n)
fade[n - int(0.5 * SR):n] = np.linspace(1, 0, int(0.5 * SR))
fade[n:] = 0
mix = (mix * fade)[:, :n]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.5) / np.tanh(1.5) * 0.55
write_wav(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', mix)
print('wrote music', DUR)
