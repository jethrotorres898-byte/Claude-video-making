"""Tiny numpy synth kit: instruments, sound effects, a stereo mixer and reverb."""
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(3)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


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


class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR
        self.buses = {}

    def bus(self, name):
        if name not in self.buses:
            self.buses[name] = np.zeros((2, self.n))
        return self.buses[name]

    def add(self, name, sig, t0, gain=1.0, pan=0.0):
        b = self.bus(name)
        i = int(t0 * SR)
        if i >= self.n or i + len(sig) <= 0:
            return
        if i < 0:
            sig, i = sig[-i:], 0
        sig = sig[: self.n - i]
        b[0, i:i + len(sig)] += sig * gain * (1 - max(pan, 0))
        b[1, i:i + len(sig)] += sig * gain * (1 + min(pan, 0))


def reverb(x, secs=1.8, decay=3.2, seed=0):
    r = np.random.default_rng(seed)
    t = tt(secs)
    ir = r.standard_normal(len(t)) * np.exp(-t * decay)
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]


def write_wav(path, stereo):
    pcm = (np.clip(stereo, -1, 1).T * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ---------- instruments ----------
def piano(m, dur, vel=1.0):
    t = tt(dur + 1.6)
    f = hz(m)
    s = sum(a * np.sin(2 * np.pi * f * h * t * (1 + 0.0004 * h)) * np.exp(-t * (1.6 + h * 1.1))
            for h, a in enumerate([1, 0.55, 0.3, 0.16, 0.09, 0.05], 1))
    s *= 1 - np.exp(-t * 300)
    return release(s, dur + 1.2, 0.4) * vel * 0.5


def epiano(m, dur, vel=1.0):
    t = tt(dur + 1.0)
    f = hz(m)
    trem = 1 + 0.15 * np.sin(2 * np.pi * 4.5 * t)
    s = (np.sin(2 * np.pi * f * t + 0.8 * np.sin(2 * np.pi * f * t) * np.exp(-t * 6)) * np.exp(-t * 1.4)) * trem
    return release(s * (1 - np.exp(-t * 200)), dur + 0.6, 0.4) * vel * 0.35


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
    return release(s * env, dur, 0.9) * vel * 0.08


def bass(m, dur, vel=1.0):
    t = tt(dur + 0.1)
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
    env = (1 - np.exp(-t * 400)) * (0.6 + 0.4 * np.exp(-t * 6))
    return release(s * env, dur, 0.06) * vel * 0.45


def sub808(m, dur, vel=1.0):
    t = tt(dur + 0.2)
    ph = 2 * np.pi * np.cumsum(hz(m) * (1 + 0.6 * np.exp(-t * 40))) / SR
    s = np.tanh(1.6 * np.sin(ph)) * np.exp(-t * 1.2)
    return release(s, dur, 0.1) * vel * 0.5


def kick(vel=1.0):
    t = tt(0.5)
    ph = 2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 28)) / SR
    return (np.sin(ph) * np.exp(-t * 7) + 0.09 * np.exp(-t * 300) * rng.standard_normal(len(t))) * vel


def clap(vel=1.0):
    t = tt(0.35)
    n = np.diff(rng.standard_normal(len(t) + 1))
    env = np.exp(-t * 16)
    for d in (0.0, 0.011, 0.022):
        env += np.where(t >= d, np.exp(-(t - d) * 120), 0) * 0.6
    return n * env * vel * 0.18


def snap(vel=1.0):
    t = tt(0.15)
    return np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * 45) * vel * 0.16


def hat(vel=1.0, dec=70):
    t = tt(0.12)
    n = np.diff(np.diff(rng.standard_normal(len(t) + 2)))
    return n * np.exp(-t * dec) * vel * 0.05


def cymbal(vel=1.0):
    t = tt(2.5)
    return np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * 1.6) * vel * 0.07


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


def buzz(dur=0.35):
    t = tt(dur)
    s = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.5 + np.sin(2 * np.pi * 220 * t) * 0.3
    return onepole(s, np.full(len(t), 0.2)) * np.minimum(1, (dur - t) * 20) * 0.35


def thud():
    t = tt(0.3)
    ph = 2 * np.pi * np.cumsum(60 + 80 * np.exp(-t * 40)) / SR
    return np.sin(ph) * np.exp(-t * 18) + rng.standard_normal(len(t)) * np.exp(-t * 60) * 0.2


def heartbeat():
    t = tt(0.4)
    ph = 2 * np.pi * np.cumsum(40 + 40 * np.exp(-t * 30)) / SR
    return np.sin(ph) * np.exp(-t * 12)


def tape_stop(dur=0.6):
    t = tt(dur)
    u = t / dur
    f = 330 * (1 - u) ** 2 + 30
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * rng.standard_normal(len(t)) * (1 - u)
    return onepole(s, 0.05 + 0.4 * (1 - u)) * (1 - u) * 0.6


def engine(dur, rev=None):
    """Low car rumble; rev is an optional 0..1 curve (per sample) that raises the pitch."""
    t = tt(dur)
    r = np.zeros_like(t) if rev is None else rev
    f = 42 + 50 * r
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.5 * np.sin(2 * ph + 0.3) + 0.25 * np.sin(3 * ph)
    s *= 1 + 0.25 * np.sin(2 * np.pi * 9 * t)
    n = onepole(rng.standard_normal(len(t)), np.full(len(t), 0.03))
    return (s * 0.5 + n * 1.2) * (0.6 + 0.6 * r)
