"""Trailer score + sound design for "The Side Hustle", timed from voice.js.

Drones and a ticking clock at the job, a pulsing synth for the search, taiko and
ostinato as he finds TJR, a braam for "One year later", then the epic drop for
the payoff. Ducked under the voices. Writes a 44.1 kHz stereo WAV.

Usage: python3 music.py out.wav
"""
import json
import os
import re
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from synth import (SR, Mix, bass, bell, boom, braam, choir, click, cymbal, epiano, hat, hum, kick,  # noqa: E402
                   pad, piano, pluck, pop, reverb, riser, saw_stab, snap, sub808, sub_drop, taiko, tick,
                   whoosh, write_wav, zap)

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
CUT = dict(search=ls(2) - 0.3, found=ls(5) - 0.25, grind=ls(7) - 0.2, later=ls(8) - 0.4, shift=ls(9) - 0.25,
           trader=ls(10) - 0.2, fifty=ls(11) - 0.2, rich=ls(12) - 0.2, hero=ls(13) - 0.25, end=ls(14) - 0.2)
BEAT = 0.6  # 100 BPM

m = Mix(DUR)
mus = lambda sig, t0, g=1.0, pan=0.0: m.add('music', sig, t0, g, pan)  # noqa: E731
fx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731

DM, BB, F, C = [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]
PROG = [DM, BB, F, C]
ROOT = {id(DM): 38, id(BB): 34, id(F): 41, id(C): 36}


def beats(t0, t1, step=BEAT):
    return [t0 + k * step for k in range(int((t1 - t0) / step) + 1) if t0 + k * step < t1]


# ---------- the job: drone, clock, hum, rain ----------
mus(pad(38, CUT['search'], 0.9, att=1.5), 0)
mus(pad(45, CUT['search'], 0.5, att=2.0), 0)
fx(hum(CUT['search']), 0, 1.0)
for t0 in beats(0.3, CUT['search'] - 0.3, 0.5):
    fx(tick(1800), t0, 0.22)
rn = int(CUT['search'] * SR)
fx(np.diff(np.concatenate([[0], np.random.default_rng(1).standard_normal(rn)])) * 0.02, 0, 1.0)
fx(pop(), wt(0, 'survive'), 0.25)
fx(bell(93, 0.6), wt(0, 'survive') + 0.02, 0.35)
mus(piano(62, 1.4, 0.5), ls(1))
mus(piano(57, 1.6, 0.45), ls(1) + 0.7)
fx(zap(), le(1) + 0.15, 0.6)

# ---------- the search: pulsing synth ----------
tS, tFound = CUT['search'], wt(4, 'found')
for k, t0 in enumerate(beats(tS + 0.2, tFound - 0.2, BEAT / 2)):
    ch = PROG[int(k / 8) % 4]
    mus(saw_stab(ch[k % 3] + 12, 0.12, 0.7), t0, 1.0, 0.3 * np.sin(k))
    if k % 2 == 0:
        mus(bass(ROOT[id(ch)], 0.25, 0.7), t0)
for k, t0 in enumerate(beats(tS + 0.2, ls(4), BEAT)):
    mus(kick(0.45), t0)
q = 'side hustle ideas'
ty0, ty1 = wt(2, 'searching'), le(2) + 0.2
for i in range(len(q)):
    fx(click(), ty0 + (ty1 - ty0) * i / len(q), 0.25)
for w in ('dropshipping', 'freelancing', 'reselling'):
    fx(pluck(76, 0.2, 0.8), wt(3, w), 0.6)
fx(zap(), wt(3, 'nothing'), 0.4)
for k in range(28):  # time-lapse ticks speed up
    fx(tick(2400), ls(4) + 1.8 * (1 - (1 - k / 28) ** 1.6), 0.18)
fx(riser(tFound - ls(4)), ls(4), 0.5)
mus(choir(62, 3.0, 0.9), tFound - 0.1)
mus(choir(69, 3.0, 0.7), tFound - 0.1)
for k, n in enumerate([81, 86, 88, 93]):
    fx(bell(n, 2.0), tFound + k * 0.07, 0.6)
fx(boom(), tFound, 0.5)

# ---------- TJR found: taiko + ostinato ----------
tF = CUT['found']
fx(whoosh(0.4), tF - 0.15, 0.5)
for k, t0 in enumerate(beats(tF, CUT['grind'], BEAT / 4)):
    ch = PROG[int(k / 16) % 4]
    mus(saw_stab(ch[(k // 2) % 3] + 24, 0.09, 0.45), t0, 1.0, 0.25 * np.sin(k * 0.7))
for k, t0 in enumerate(beats(tF, CUT['grind'], BEAT)):
    mus(taiko(0.8 if k % 2 == 0 else 0.5), t0)
    if k % 4 == 0:
        ch = PROG[(k // 4) % 4]
        for j, n in enumerate(ch):
            mus(pad(n, BEAT * 4, 0.6), t0, 1.0, (j - 1) * 0.4)
        mus(bass(ROOT[id(ch)], BEAT * 3.8, 0.8), t0)
lw5 = line_words(L[5])
for _, s, _ in (lw5[4], lw5[5], lw5[7]):
    fx(boom(), s, 0.35)
    for k, n in enumerate([84, 88, 91]):
        fx(bell(n, 1.0), s + k * 0.04, 0.6)
fx(click(), wt(6, 'channel') + 0.25, 0.8)
for k in range(4):
    fx(whoosh(0.35), wt(6, 'tutorial') + 0.1 + k * 0.08, 0.3, (k - 1.5) * 0.4)

# ---------- the grind: hits on every word ----------
tG = CUT['grind']
lw7 = line_words(L[7])
for _, s, _ in lw7[:3]:
    mus(taiko(1.0), s - 0.1)
    fx(boom(), s - 0.1, 0.25)
mus(braam(38, 2.4, 0.7), lw7[3][1])
for k in range(24):
    fx(tick(2000), lw7[3][1] + 1.6 * (k / 24) ** 0.7, 0.16)
for t0 in beats(lw7[3][1], CUT['later'], BEAT / 2):
    mus(taiko(0.6), t0)

# ---------- one year later ----------
tY = ls(8)
mus(braam(33, 3.2, 1.2), tY - 0.05)
mus(braam(45, 3.0, 0.6), tY - 0.05)
fx(sub_drop(2.0), tY - 0.05, 0.9)
mus(cymbal(0.8), tY)

# ---------- the empty shift ----------
tSh = CUT['shift']
mus(choir(74, CUT['trader'] - tSh, 0.5, att=1.2), tSh)
mus(piano(74, 1.0, 0.45), tSh + 0.4)
mus(piano(69, 1.2, 0.4), tSh + 1.4)
fx(riser(CUT['trader'] - tSh - 0.1), tSh + 0.1, 0.45)

# ---------- the payoff: epic drop ----------
tT = CUT['trader']
mus(cymbal(1.3), tT)
fx(boom(), tT, 0.6)
payoff_end = CUT['end']
for k, t0 in enumerate(beats(tT, payoff_end, BEAT / 2)):
    b = k % 8
    ch = PROG[(k // 8) % 4]
    if b in (0, 3, 6):
        mus(taiko(1.0), t0)
    if b in (0, 4):
        mus(kick(1.0), t0)
    if b in (2, 6):
        mus(snap(1.0), t0)
    mus(hat(0.55), t0 + BEAT / 4)
    mus(saw_stab(ch[b % 3] + 24, 0.1, 0.5), t0, 1.0, 0.3 * np.sin(k))
    if b == 0:
        for j, n in enumerate(ch):
            mus(pad(n + 12, BEAT * 4, 0.7), t0, 1.0, (j - 1) * 0.4)
        mus(sub808(ROOT[id(ch)], BEAT * 3.6, 0.9), t0)
mus(choir(62, payoff_end - tT, 0.6, att=1.5), tT)
mus(choir(69, payoff_end - tT, 0.45, att=1.5), tT)
tMonth = raw(11, 'month')
fx(boom(), tMonth, 0.8)
mus(braam(38, 2.6, 0.9), tMonth - 0.02)
mus(cymbal(1.1), tMonth)
lw12 = line_words(L[12])
for _, s, _ in (lw12[0], lw12[2], lw12[4]):
    fx(whoosh(0.35), s - 0.15, 0.45)
    mus(taiko(1.1), s)
for k in range(3):
    fx(bell(96, 0.6), lw12[4][1] + 0.2 + k * 0.42, 0.45)
fx(riser(1.0), CUT['rich'] + 0.1, 0.25)

# ---------- ending ----------
tE = CUT['end']
fx(whoosh(0.5), tE - 0.2, 0.4)
mus(braam(33, 3.0, 0.7), tE)
mus(pad(38, DUR - tE, 0.8, att=0.4), tE)
for k in range(int((DUR - tE) / 0.45)):
    fx(tick(1200), tE + 0.5 + k * 0.45, 0.12)
mus(piano(62, 2.0, 0.5), ls(14) + 0.3)
mus(piano(69, 2.0, 0.45), ls(14) + 0.9)

# ---------- mix with ducking ----------
music, sfx = m.bus('music'), m.bus('sfx')
for ch in range(2):
    music[ch] += 0.3 * reverb(music[ch], 2.4, 2.4, seed=ch)
    sfx[ch] += 0.14 * reverb(sfx[ch], 1.6, 3.0, seed=10 + ch)
with wave.open(os.path.join(HERE, 'voice.wav')) as w:
    vsr = w.getframerate()
    voice = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64)
voice /= np.max(np.abs(voice)) + 1e-9
hop = vsr // 100
env = np.array([np.sqrt(np.mean(voice[i:i + hop] ** 2)) for i in range(0, len(voice), hop)])
env = np.convolve(env, np.ones(20) / 20, mode='same')
env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
e = np.interp(np.arange(m.n) / SR, np.arange(len(env)) / 100, env, right=0)
# extra dips under lines that sit on heavy hits
dip = np.ones(m.n)
for i in (7, 13):
    dip[int((ls(i) - 0.15) * SR):int((le(i) + 0.05) * SR)] = 0.5
dip = np.convolve(dip, np.ones(2205) / 2205, mode='same')
mix = music * dip * (1 - 0.6 * e) * 0.6 + sfx * (1 - 0.4 * e) * 0.85
n = int(DUR * SR)
fade = np.ones(m.n)
fade[n - int(0.8 * SR):n] = np.linspace(1, 0, int(0.8 * SR))
fade[n:] = 0
mix = (mix * fade)[:, :n]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.5) / np.tanh(1.5) * 0.55
write_wav(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', mix)
print('wrote music', DUR)
