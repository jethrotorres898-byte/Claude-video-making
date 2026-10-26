"""Music + sound effects for "How I Got This Car", timed from voice.js.

The music bus is ducked under the narration. Writes a 44.1 kHz stereo WAV
(without the voice; ffmpeg mixes that in).

Usage: python3 music.py out.wav
"""
import json
import os
import re
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from synth import (SR, Mix, bass, bell, boom, buzz, click, clap, cymbal, engine, epiano, hat,  # noqa: E402
                   heartbeat, kick, pad, piano, pluck, pop, reverb, riser, snap, sub808, tape_stop,
                   thud, tick, whoosh, write_wav)

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


ls = lambda i: L[i]['s']  # noqa: E731
le = lambda i: L[i]['e']  # noqa: E731
CUT = dict(rewindA=le(1) + 0.12, rewindB=ls(2) - 0.12, brk=ls(6) - 0.25, couch=ls(7) - 0.2,
           study=ls(10) - 0.22, win=ls(13) - 0.25, meet=ls(16) - 0.25, million=ls(18) - 0.25, car2=ls(20) - 0.25)

m = Mix(DUR)
mus = lambda sig, t0, g=1.0, pan=0.0: m.add('music', sig, t0, g, pan)  # noqa: E731
fx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731

AM7, FM7, C, G = [57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 60], [55, 59, 62, 67]
AM, F = [57, 60, 64], [53, 57, 60]
ROOT = {id(AM7): 45, id(FM7): 41, id(C): 36, id(G): 43, id(AM): 45, id(F): 41}


def chord(ch, t0, d, inst=piano, vel=0.8, up=12, padv=0.7):
    for k, n in enumerate(ch):
        mus(inst(n + up, d, vel), t0 + k * 0.012, 0.7, (k - 1.5) * 0.25)
        if padv:
            mus(pad(n, d, padv), t0, 1.0, (k - 1.5) * 0.4)


def cool_beat(t0, t1, beat=0.6, vel=1.0):
    """Laid-back trap-ish groove for the car scenes."""
    prog = [AM7, FM7, C, G]
    n_bars = int((t1 - t0) / (beat * 4)) + 1
    for b in range(n_bars):
        bt = t0 + b * beat * 4
        if bt >= t1:
            break
        ch = prog[b % 4]
        chord(ch, bt, beat * 4, epiano, 0.8 * vel, 12, 0.5 * vel)
        mus(sub808(ROOT[id(ch)], beat * 3.5, 0.9 * vel), bt)
        for k in range(4):
            t = bt + k * beat
            if t >= t1:
                break
            if k in (0, 2):
                mus(kick(0.9 * vel), t)
            if k in (1, 3):
                mus(snap(1.0 * vel), t)
            for h in range(2):
                mus(hat(0.7 * vel), t + h * beat / 2)
        if b % 2 == 1:
            for h in range(3):
                mus(hat(0.5 * vel, 120), bt + beat * 3.5 + h * beat / 6)


# ---------- car (opening) ----------
cool_beat(0.25, CUT['rewindA'])
fx(engine(CUT['rewindA']), 0, 0.12)
fx(tape_stop(0.7), CUT['rewindA'] - 0.05, 0.9)
fx(whoosh(0.6), CUT['rewindA'], 0.5)
for k in range(6):
    fx(tick(3000 - k * 300), CUT['rewindA'] + k * 0.1, 0.2)

# ---------- losing ----------
tB = CUT['rewindB']
for i in range(int((ls(5) - tB) / 0.25)):
    mus(bass(45, 0.12, 0.7), tB + i * 0.25)
for t0 in np.arange(tB, ls(5), 0.5):
    mus(hat(0.6), t0 + 0.25)
mus(pad(57, ls(5) - tB, 0.6), tB)
mus(pad(64, ls(5) - tB, 0.4), tB)
for w, s, _ in line_words(L[2]) + line_words(L[3])[::2]:
    fx(click(), s, 0.9)
fx(click(), wt(4, 'tops'), 1.0)
fx(click(), wt(4, 'bottoms'), 1.0)
fx(buzz(0.25), wt(4, 'tops') + 0.35, 0.5)
fx(buzz(0.25), wt(4, 'bottoms') + 0.35, 0.5)
tBlew, tAcc = wt(5, 'blew'), wt(5, 'account')
fx(riser(tBlew - ls(5)), ls(5), 0.35)
fx(boom(), tBlew, 1.0)
fx(thud(), tAcc, 0.9)
for k, n in enumerate([57, 60, 64, 69]):
    mus(piano(n, 1.2, 0.7), tAcc + 0.3 + k * 0.3, 0.8)
mus(pad(53, CUT['brk'] - tAcc, 0.5), tAcc)

# ---------- the break ----------
chord(F, CUT['brk'], CUT['couch'] - CUT['brk'], piano, 0.5, 12, 0.5)
fx(thud(), wt(6, 'stepped') + 0.25, 0.7)
fx(buzz(0.3), wt(6, 'charts'), 0.45)
fx(buzz(0.3), wt(6, 'trades'), 0.45)

# ---------- couch + discovery ----------
tC, tFound = CUT['couch'], wt(8, 'tjr')
for k, n in enumerate([69, 72, 76, 72, 74, 71, 72, 69]):
    mus(epiano(n, 0.4, 0.5), tC + 0.2 + k * 0.45)
mus(pad(57, tFound - tC, 0.4), tC)
for t0 in (wt(7, 'couch'), wt(7, 'phone') + 0.3, ls(8)):
    fx(whoosh(0.45), t0 - 0.05, 0.3, 0.2)
    for k in range(5):
        fx(tick(2200), t0 + k * 0.06, 0.22 * (1 - k / 5))
for k, n in enumerate([72, 76, 79, 84]):
    fx(bell(n, 2.0), tFound + k * 0.07, 0.9)
fx(pop(), tFound, 0.6)
fx(pop(), tFound + 0.9, 0.4)
chord(C, tFound, 2.0, piano, 0.8)
chord(G, tFound + 2.0, CUT['study'] - tFound - 2.0, piano, 0.7)
fx(whoosh(0.8), ls(9) - 0.15, 0.5)

# ---------- studying ----------
tS = CUT['study']
prog = [AM, F, C, G]
k = 0
t = tS
while t < CUT['win'] - 0.05:
    ch = prog[k % 4]
    d = min(2.0, CUT['win'] - t)
    chord(ch, t, d, piano, 0.75)
    for b in range(int(d * 2)):
        mus(bass(ROOT[id(ch)], 0.4, 0.75), t + b * 0.5)
    t += 2.0
    k += 1
for b in range(int((CUT['win'] - tS) / 0.5)):
    t0 = tS + b * 0.5
    mus(kick(0.5 + 0.4 * b / 20), t0)
    if t0 > ls(11):
        mus(hat(0.9), t0 + 0.25)
    if t0 > ls(12) and b % 2:
        mus(clap(0.8), t0)
    if t0 > ls(11):
        ch = prog[int((t0 - tS) / 2) % 4]
        tones = [n + 12 for n in ch] + [ch[0] + 24]
        for q in range(4):
            mus(pluck(tones[q], 0.15, 0.45), t0 + q * 0.125, 0.8, 0.3 * np.sin(b + q))
for w in ('guides', 'videos', 'rules'):
    fx(pop(), wt(10, w), 0.6)
for w in ('risk', 'patience', 'fomo'):
    fx(bell(84, 0.8), wt(11, w), 0.7)
tD0, tD1 = wt(12, 'day'), le(12)
for d in range(2, 31):
    u = (d - 1.5) / 29
    fx(tick(1700), tD0 + (tD1 - tD0) * u, 0.3)
for q in range(8):
    mus(clap(0.4 + q * 0.08), CUT['win'] - 0.5 + q * 0.0625)

# ---------- the win ----------
tW, tBuy, tWin = CUT['win'], wt(14, 'buy'), wt(15, 'win')
mus(pad(52, tBuy - tW, 0.7), tW)
mus(pad(59, tBuy - tW, 0.5), tW)
for t0 in np.arange(tW + 0.3, tBuy - 0.4, 0.8):
    mus(heartbeat(), t0, 0.7)
    mus(heartbeat(), t0 + 0.25, 0.5)
fx(riser(tBuy - ls(13)), ls(13), 0.45)
fx(click(), tBuy, 1.2)
drop = tBuy + 0.25
mus(cymbal(1.0), drop)
for b in range(int((CUT['meet'] - drop) / 0.5)):
    t0 = drop + b * 0.5
    mus(kick(1.0), t0)
    mus(hat(1.0), t0 + 0.25)
    if b % 2:
        mus(clap(1.0), t0)
    ch = [AM, F, G, AM][int(b / 4) % 4]
    mus(bass(ROOT[id(ch)], 0.2, 1.0), t0)
    mus(bass(ROOT[id(ch)], 0.2, 0.8), t0 + 0.25)
    tones = [n + 12 for n in ch] + [ch[0] + 24]
    for q in range(4):
        mus(pluck(tones[(q * 3 + b) % 4], 0.18, 0.65), t0 + q * 0.125, 0.8, 0.35 * np.sin(q * 1.7 + b))
    if b % 4 == 0:
        chord(ch, t0, 2.0, piano, 0.8, 12, 0.8)
for k2, n in enumerate([84, 88, 91]):
    fx(bell(n, 1.4), tWin + k2 * 0.05, 0.9)
fx(pop(), tWin, 0.9, -0.3)
fx(pop(), tWin + 0.08, 0.8, 0.3)

# ---------- meeting TJR ----------
tM = CUT['meet']
for i, ch in enumerate([C, G, AM7, FM7]):
    t0 = tM + i * 1.8
    if t0 >= CUT['million']:
        break
    chord(ch, t0, min(1.8, CUT['million'] - t0), piano, 0.75)
    mus(bass(ROOT[id(ch)] + (12 if ROOT[id(ch)] < 40 else 0), 1.6, 0.7), t0)
for b in range(int((CUT['million'] - tM) / 0.9)):
    mus(kick(0.5), tM + b * 0.9)
    mus(hat(0.5), tM + b * 0.9 + 0.45)
for k2, n in enumerate([79, 83, 86, 91]):
    fx(bell(n, 1.8), wt(16, 'person') + k2 * 0.09, 0.6)

# ---------- the first million ----------
tMi, tMil = CUT['million'], wt(19, 'million')
chord(F, tMi, ls(19) - tMi, piano, 0.7, 12, 0.7)
fx(pop(), wt(18, 'one'), 0.6)
for q in range(16):
    fx(tick(2000 + q * 60), wt(18, 'system') + q * 0.06, 0.2)
chord(G, ls(19), tMil - ls(19), piano, 0.7, 12, 0.8)
fx(riser(tMil - ls(19)), ls(19), 0.35)
for q in range(int((tMil - ls(19)) / 0.125)):
    mus(pluck(67 + (q % 4) * 3 + 12 * (q > 8), 0.12, 0.5), ls(19) + q * 0.125)
tMilE = next(e for w, s_, e in line_words(L[19]) if w.lower().startswith('million'))
fx(boom(), tMil, 0.3)
mus(cymbal(0.8), tMilE)
chord(C, tMil, CUT['car2'] - tMil, piano, 0.9, 12, 0.9)
for k2, n in enumerate([84, 88, 91, 96]):
    fx(bell(n, 1.6), tMilE + k2 * 0.06, 0.8)
for q in range(14):
    fx(tick(2600 + (q % 3) * 400), tMilE + 0.2 + q * 0.11, 0.18)

# ---------- car (ending) ----------
tC2, tLeave = CUT['car2'], le(22) + 0.1
fx(whoosh(0.5), tC2 - 0.25, 0.4)
cool_beat(tC2 + 0.1, wt(22, 'coming'))
fx(engine(DUR - tC2), tC2, 0.12)
tCom = wt(22, 'coming')
mus(kick(1.0), tCom)
mus(cymbal(1.0), tCom)
chord(AM7, tCom, DUR - tCom, epiano, 0.9, 12, 0.9)
mus(sub808(45, DUR - tCom, 0.9), tCom)
rev_len = DUR - tLeave
rev = np.clip(np.linspace(0, 1.2, int(rev_len * SR)), 0, 1)
fx(engine(rev_len, rev), tLeave, 0.35)
fx(whoosh(0.9), tLeave + 0.2, 0.7)
for t0 in (CUT['brk'], CUT['couch'], CUT['study'], CUT['win'], CUT['meet'], CUT['million']):
    fx(whoosh(0.4), t0 - 0.2, 0.45)

# ---------- mix with ducking under the voice ----------
music, sfx = m.bus('music'), m.bus('sfx')
for ch in range(2):
    music[ch] += 0.26 * reverb(music[ch], seed=ch)
    sfx[ch] += 0.1 * reverb(sfx[ch], 1.2, 4, seed=10 + ch)

with wave.open(os.path.join(HERE, 'voice.wav')) as w:
    vsr = w.getframerate()
    vraw = w.readframes(w.getnframes())
    vbytes = w.getsampwidth()
voice = np.frombuffer(vraw, np.int16 if vbytes == 2 else np.int32).astype(np.float64)
voice /= np.max(np.abs(voice)) + 1e-9
hop = vsr // 100
env = np.array([np.sqrt(np.mean(voice[i:i + hop] ** 2)) for i in range(0, len(voice), hop)])
env = np.convolve(env, np.ones(25) / 25, mode='same')
env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
duck = 1 - 0.6 * np.interp(np.arange(m.n) / SR, np.arange(len(env)) / 100, env, right=0)

sfx_duck = 1 - 0.45 * (1 - duck) / 0.6
mix = music * duck * 0.55 + sfx * sfx_duck * 0.85
n = int(DUR * SR)
fade = np.ones(m.n)
fade[n - int(0.6 * SR):n] = np.linspace(1, 0, int(0.6 * SR))
fade[n:] = 0
mix = (mix * fade)[:, :n]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.5) / np.tanh(1.5) * 0.5
write_wav(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', mix)
print('wrote music', DUR)
