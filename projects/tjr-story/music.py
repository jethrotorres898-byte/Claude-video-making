"""Soundtrack + sound effects for the TJR story, synthesized with numpy.

Timings follow anim.js. Writes a 44.1 kHz stereo WAV.

Usage: python3 music.py out.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 40.5
N = int(DUR * SR) + SR
rng = np.random.default_rng(3)

music = np.zeros((2, N))
sfx = np.zeros((2, N))


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(bus, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    bus[0, i:i + len(sig)] += sig * gain * (1 - max(pan, 0))
    bus[1, i:i + len(sig)] += sig * gain * (1 + min(pan, 0))


def release(sig, dur, rel=0.15):
    n, r = int(dur * SR), int(rel * SR)
    out = sig[: n + r].copy()
    if len(out) > n:
        out[n:] *= np.linspace(1, 0, len(out) - n)
    return out


def onepole(x, coef):
    """Lowpass with a per-sample coefficient array (0..1, higher = brighter)."""
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += coef[i] * (x[i] - acc)
        y[i] = acc
    return y


# ---------- instruments ----------
def piano(m, dur, vel=1.0):
    t = tt(dur + 1.6)
    f = hz(m)
    s = sum(a * np.sin(2 * np.pi * f * h * t * (1 + 0.0004 * h)) * np.exp(-t * (1.6 + h * 1.1))
            for h, a in enumerate([1, 0.55, 0.3, 0.16, 0.09, 0.05], 1))
    s *= 1 - np.exp(-t * 300)
    return release(s, dur + 1.2, 0.4) * vel * 0.5


def pluck(m, dur=0.3, vel=1.0):
    t = tt(dur + 0.3)
    f = hz(m)
    s = sum(np.sin(2 * np.pi * f * h * t) / h * np.exp(-t * (7 + 3 * h)) for h in range(1, 8))
    return s * (1 - np.exp(-t * 500)) * vel * 0.4


def pad(m, dur, vel=1.0, att=0.6):
    t = tt(dur + 1.0)
    f = hz(m)
    s = np.zeros_like(t)
    for det in (-0.005, 0.0, 0.006):
        for h in range(1, 6):
            s += np.sin(2 * np.pi * f * (1 + det) * h * t + h * det * 50) / (h * 1.6)
    env = np.minimum(1, t / att)
    s = release(s * env, dur, 0.9)
    return s * vel * 0.08


def bass(m, dur, vel=1.0):
    t = tt(dur + 0.1)
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
    env = (1 - np.exp(-t * 400)) * (0.6 + 0.4 * np.exp(-t * 6))
    return release(s * env, dur, 0.06) * vel * 0.45


def kick(vel=1.0):
    t = tt(0.5)
    ph = 2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 28)) / SR
    return (np.sin(ph) * np.exp(-t * 7) + 0.3 * np.exp(-t * 300) * rng.standard_normal(len(t)) * 0.3) * vel


def clap(vel=1.0):
    t = tt(0.35)
    n = np.diff(rng.standard_normal(len(t) + 1))
    env = np.exp(-t * 16)
    for d in (0.0, 0.011, 0.022):
        env += np.where(t >= d, np.exp(-(t - d) * 120), 0) * 0.6
    return n * env * vel * 0.18


def hat(vel=1.0, dec=70):
    t = tt(0.12)
    n = np.diff(np.diff(rng.standard_normal(len(t) + 2)))
    return n * np.exp(-t * dec) * vel * 0.05


def cymbal(vel=1.0):
    t = tt(2.5)
    n = np.diff(rng.standard_normal(len(t) + 1))
    return n * np.exp(-t * 1.6) * vel * 0.07


def riser(dur):
    t = tt(dur)
    u = t / dur
    n = onepole(rng.standard_normal(len(t)), 0.02 + 0.5 * u ** 2)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * u ** 2) / SR)
    return (n * 0.6 + sweep * 0.12) * u ** 2


def boom():
    t = tt(2.2)
    ph = 2 * np.pi * np.cumsum(38 + 160 * np.exp(-t * 6)) / SR
    n = onepole(rng.standard_normal(len(t)), np.full(len(t), 0.05))
    return np.sin(ph) * np.exp(-t * 2.2) * 0.9 + n * np.exp(-t * 4) * 1.2


def whoosh(dur=0.5):
    t = tt(dur)
    u = t / dur
    n = onepole(rng.standard_normal(len(t)), 0.03 + 0.25 * np.sin(np.pi * u))
    return n * np.sin(np.pi * u) ** 2 * 0.9


def click():
    t = tt(0.06)
    return (np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 260) + rng.standard_normal(len(t)) * np.exp(-t * 500) * 0.4) * 0.35


def tick(f=1500):
    t = tt(0.08)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 70) * 0.25


def bell(m, dur=1.6, vel=1.0):
    t = tt(dur)
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 2.5) * (1 - np.exp(-t * 800)) * vel * 0.18


def pop():
    t = tt(0.25)
    ph = 2 * np.pi * np.cumsum(900 * np.exp(-t * 25) + 120) / SR
    return (np.sin(ph) * np.exp(-t * 20) * 0.5 + rng.standard_normal(len(t)) * np.exp(-t * 40) * 0.5) * 0.5


def heartbeat():
    t = tt(0.4)
    ph = 2 * np.pi * np.cumsum(40 + 40 * np.exp(-t * 30)) / SR
    return np.sin(ph) * np.exp(-t * 12)


AM, F, C, G = [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]
ROOT = {id(AM): 45, id(F): 41, id(C): 36, id(G): 43}


def chord_piano(ch, t0, dur, vel=1.0, up=12):
    for k, m in enumerate(ch):
        place(music, piano(m + up, dur, vel), t0 + k * 0.012, 0.7, pan=(k - 1) * 0.3)


def chord_pad(ch, t0, dur, vel=1.0):
    for k, m in enumerate(ch):
        place(music, pad(m, dur, vel), t0, 1.0, pan=(k - 1) * 0.5)


# ---------- 0 - 9.5: the struggle and the break ----------
for i in range(12):  # tense muted pulse while he overtrades
    place(music, bass(45, 0.12, 0.8), i * 0.25)
chord_pad(AM, 0.0, 3.0, 0.7)
for pt in (0.35, 0.95, 1.5, 2.05, 2.6):
    place(sfx, click(), pt)
place(sfx, boom(), 2.95, 0.9)
place(sfx, whoosh(0.4), 2.75, 0.4)
for k, m in enumerate([57, 60, 64, 69]):  # sad broken chords
    place(music, piano(m, 1.2, 0.8), 3.5 + k * 0.32, 0.8)
for k, m in enumerate([53, 57, 60, 65]):
    place(music, piano(m, 1.2, 0.7), 5.2 + k * 0.32, 0.8)
place(music, piano(41, 2.0, 0.6), 5.2)
chord_pad(AM, 3.4, 3.6, 0.6)
chord_pad(F, 7.0, 2.6, 0.5)
place(music, piano(64, 2.0, 0.5), 7.3)
place(music, piano(62, 2.0, 0.45), 8.3)

# ---------- 9.5 - 16: scrolling, then discovery ----------
for t0 in (9.55, 10.4, 11.2):
    place(sfx, whoosh(0.45), t0, 0.35, pan=0.2)
    for k in range(5):
        place(sfx, tick(2200), t0 + 0.05 + k * 0.06, 0.25 * (1 - k / 5))
for k, m in enumerate([69, 72, 76, 72, 74, 71]):  # light idle notes
    place(music, piano(m, 0.4, 0.35), 9.6 + k * 0.5)
chord_pad(AM, 9.5, 3.1, 0.45)
for k, m in enumerate([72, 76, 79, 84]):
    place(sfx, bell(m, 2.0), 12.6 + k * 0.07, 0.9)
place(sfx, pop(), 12.62, 0.6)
chord_piano(C, 12.6, 2.0, 0.8)
chord_pad(C, 12.6, 2.0, 0.6)
chord_piano(G, 14.6, 1.4, 0.7)
chord_pad(G, 14.6, 1.5, 0.6)
place(sfx, pop(), 13.95, 0.4)

# ---------- 16 - 23: the grind ----------
prog = [(AM, 16.0), (F, 18.0), (C, 20.0), (G, 22.0)]
for ch, t0 in prog:
    d = 2.0 if t0 < 22 else 1.0
    chord_piano(ch, t0, d, 0.8)
    chord_pad(ch, t0, d, 0.8)
    for b in range(int(d * 2)):
        place(music, bass(ROOT[id(ch)], 0.4, 0.8), t0 + b * 0.5)
for b in range(14):
    t0 = 16 + b * 0.5
    place(music, kick(0.55 + 0.3 * b / 14), t0)
    if t0 >= 19.5:
        place(music, hat(0.9), t0 + 0.25)
    if t0 >= 20 and b % 2 == 1:
        place(music, clap(0.8), t0)
for ch, t0 in prog[1:]:  # arpeggio enters
    tones = [m + 12 for m in ch] + [ch[0] + 24]
    n = 16 if t0 < 22 else 8
    for k in range(n):
        place(music, pluck(tones[k % 4], 0.2, 0.5 + 0.3 * (t0 - 18) / 4), t0 + k * 0.125, 0.8, pan=0.3 * np.sin(k))
for k in range(8):  # snare fill into the month-later beat
    place(music, clap(0.4 + k * 0.08), 22.5 + k * 0.0625)
# ticks follow the calendar's ease-in-out
u = np.linspace(0, 1, 2000)
e = np.where(u < 0.5, 4 * u ** 3, 1 - (-2 * u + 2) ** 3 / 2)
for d in range(2, 31):
    tu = np.interp((d - 1.5) / 29, e, u)
    place(sfx, tick(1700), 19.9 + 2.0 * tu, 0.35)

# ---------- 23 - 30: the win ----------
chord_pad([52, 55, 59], 23.0, 2.0, 0.7)
for t0 in (23.4, 23.65, 24.2, 24.45):
    place(music, heartbeat(), t0, 0.7)
place(sfx, riser(1.4), 23.6, 0.5)
place(sfx, click(), 25.0, 1.2)
place(sfx, whoosh(0.3), 25.1, 0.3)
drop = [(AM, 25.4), (F, 27.4), (G, 29.4)]
for ch, t0 in drop:
    d = 2.0 if t0 < 29 else 0.6
    chord_pad([m + 12 for m in ch], t0, d, 0.9)
    chord_piano(ch, t0, d, 0.9)
    for b in range(int(d * 4)):
        place(music, bass(ROOT[id(ch)], 0.2, 1.0), t0 + b * 0.25)
    tones = [m + 12 for m in ch] + [ch[0] + 24]
    for k in range(int(d * 8)):
        place(music, pluck(tones[(k * 3) % 4] + (12 if k % 8 > 5 else 0), 0.2, 0.7), t0 + k * 0.125, 0.8, pan=0.35 * np.sin(k * 1.7))
for b in range(10):
    t0 = 25.4 + b * 0.5
    place(music, kick(1.0), t0)
    place(music, hat(1.0), t0 + 0.25)
    place(music, hat(0.5, 120), t0)
    if b % 2 == 1:
        place(music, clap(1.0), t0)
place(music, cymbal(1.0), 25.4)
place(sfx, kick(1.2), 25.4, 0.8)
place(sfx, pop(), 27.0, 0.9, pan=-0.3)
place(sfx, pop(), 27.08, 0.8, pan=0.3)
for k, m in enumerate([84, 88, 91]):  # cash register
    place(sfx, bell(m, 1.4), 28.1 + k * 0.05, 0.9)
place(sfx, clap(1.0), 28.08, 0.6)

# ---------- 30 - 36: the thank you ----------
warm = [(C, 30.0), (G, 32.0), (AM, 34.0)]
for ch, t0 in warm:
    chord_piano(ch, t0, 2.0, 0.8)
    chord_pad(ch, t0, 2.0, 0.8)
    place(music, bass(ROOT[id(ch)] + 12 if ROOT[id(ch)] < 40 else ROOT[id(ch)], 1.8, 0.8), t0)
for b in range(6):
    place(music, kick(0.6), 30 + b * 1.0)
    place(music, hat(0.6), 30.5 + b * 1.0)
for k, (m, t0) in enumerate([(76, 30.5), (79, 31.0), (76, 31.5), (74, 32.5), (71, 33.0), (74, 33.5), (72, 34.5), (76, 35.0)]):
    place(music, piano(m, 0.5, 0.55), t0)
for k, m in enumerate([79, 83, 86, 91]):
    place(sfx, bell(m, 1.8), 32.7 + k * 0.09, 0.6)

# ---------- 36 - 40.5: outro ----------
place(music, kick(1.0), 36.0)
place(music, cymbal(0.9), 36.0)
chord_piano(F, 36.0, 1.1, 0.9)
chord_pad(F, 36.0, 1.2, 0.9)
place(music, bass(41, 1.0), 36.0)
chord_piano(G, 37.1, 1.1, 0.9)
chord_pad(G, 37.1, 1.1, 0.9)
place(music, bass(43, 1.0), 37.1)
place(music, kick(1.0), 38.2)
place(music, cymbal(1.0), 38.2)
chord_piano(C, 38.2, 2.3, 1.0)
chord_piano([60, 64, 67], 38.2, 2.3, 0.6, up=24)
chord_pad(C, 38.2, 2.3, 1.0)
place(music, bass(36, 2.2), 38.2)
for t0 in (9.3, 15.8, 22.8, 29.8, 35.8):
    place(sfx, whoosh(0.45), t0, 0.45)


# ---------- mix ----------
def reverb(x, secs=1.8, decay=3.2, seed=0):
    r = np.random.default_rng(seed)
    t = tt(secs)
    ir = r.standard_normal(len(t)) * np.exp(-t * decay)
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    return y


for ch in range(2):
    music[ch] += 0.28 * reverb(music[ch], seed=ch)
    sfx[ch] += 0.12 * reverb(sfx[ch], 1.2, 4, seed=10 + ch)

mix = music * 0.8 + sfx * 1.0
fade = np.ones(N)
fs, fe = int(39.6 * SR), int(DUR * SR)
fade[fs:fe] = np.linspace(1, 0, fe - fs)
fade[fe:] = 0
mix *= fade
mix = mix[:, : int(DUR * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6) * 0.89

out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
pcm = (mix.T * 32767).astype(np.int16)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', out)
