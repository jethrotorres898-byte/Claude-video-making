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


def _resonator(x, f, bw):
    """Two-pole formant resonator."""
    r = np.exp(-np.pi * bw / SR)
    c1, c2 = 2 * r * np.cos(2 * np.pi * f / SR), -r * r
    y = np.zeros_like(x)
    y1 = y2 = 0.0
    g = 1 - r
    for i in range(len(x)):
        v = g * x[i] + c1 * y1 + c2 * y2
        y[i] = v
        y2, y1 = y1, v
    return y


def laugh(f0=140, n=5, syl=0.17, gap=0.05, seed=0, formants=((900, 100), (1450, 120), (2800, 170))):
    """Cartoon "ha-ha-ha" laughter by formant synthesis: aspirated onset, voiced /a/, falling pitch."""
    r = np.random.default_rng(seed)
    out = []
    for k in range(n):
        t = tt(syl)
        u = t / syl
        f = f0 * (1.12 - 0.22 * k / max(1, n - 1)) * (1 + 0.06 * (1 - u)) * (1 + 0.01 * r.standard_normal())
        ph = np.cumsum(f) / SR
        glot = (ph % 1.0) ** 3 - 0.25  # bright pulse train
        voiced = glot * np.clip((u - 0.18) * 6, 0, 1) * np.clip((1 - u) * 5, 0, 1)
        breath = r.standard_normal(len(t)) * (np.exp(-u * 9) * 0.9 + 0.12)
        src = voiced * 1.4 + breath * 0.5
        y = sum(_resonator(src, ff, bw) * (1.0, 0.7, 0.35)[i] for i, (ff, bw) in enumerate(formants))
        out += [y * (1 - 0.15 * k / n), np.zeros(int(gap * SR))]
    s = np.concatenate(out)
    return s / (np.max(np.abs(s)) + 1e-9) * 0.5


def crowd_laugh(voices=((120, 0.0), (140, 0.09), (170, 0.17)), n=5):
    """Several laughs layered; the pitches here were checked to read as "ha ha" with Whisper."""
    parts = [np.pad(laugh(f0, n, seed=f0), (int(off * SR), 0)) for f0, off in voices]
    out = np.zeros(max(len(p) for p in parts))
    for k, p in enumerate(parts):
        out[:len(p)] += p * (1.0 - 0.12 * k)
    return out / (np.max(np.abs(out)) + 1e-9) * 0.6


# ---------- cinematic ----------
def braam(m=36, dur=2.6, vel=1.0):
    """Trailer brass "BRAAAM": detuned saws through a swelling lowpass, saturated."""
    t = tt(dur)
    f = hz(m)
    s = np.zeros_like(t)
    for mult, det in ((1, 0), (1, 0.006), (1, -0.007), (2, 0.003), (0.5, 0)):
        ph = (f * mult * (1 + det) * t) % 1.0
        s += (2 * ph - 1) * (0.5 if mult == 2 else 1.0)
    u = t / dur
    cut = 0.02 + 0.12 * np.exp(-((u - 0.12) / 0.18) ** 2) + 0.02 * (1 - u)
    s = onepole(onepole(s, cut), cut)
    env = np.minimum(1, t / 0.06) * np.exp(-t * 0.9)
    return np.tanh(s * 2.2) * env * vel * 0.5


def taiko(vel=1.0):
    t = tt(0.9)
    ph = 2 * np.pi * np.cumsum(46 + 60 * np.exp(-t * 18)) / SR
    n = onepole(rng.standard_normal(len(t)), np.full(len(t), 0.08))
    return (np.sin(ph) * np.exp(-t * 4.5) + n * np.exp(-t * 22) * 0.8) * vel


def choir(m, dur, vel=1.0, att=0.8, vowel=((800, 80), (1150, 90), (2900, 120))):
    """Formant "aah" choir pad: three detuned voices with vibrato."""
    t = tt(dur + 0.8)
    out = np.zeros_like(t)
    for k, det in enumerate((-0.006, 0.0, 0.007)):
        f = hz(m) * (1 + det) * (1 + 0.006 * np.sin(2 * np.pi * (5 + k * 0.4) * t + k))
        src = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
        out += sum(_resonator(src, ff, bw) * (1.0, 0.6, 0.25)[i] for i, (ff, bw) in enumerate(vowel))
    env = np.minimum(1, t / att)
    out = release(out * env, dur, 0.8)
    return out / (np.max(np.abs(out)) + 1e-9) * 0.3 * vel


def saw_stab(m, dur=0.14, vel=1.0):
    t = tt(dur + 0.05)
    s = (((hz(m) * t) % 1.0) * 2 - 1) + (((hz(m) * 1.004 * t) % 1.0) * 2 - 1)
    s = onepole(s, np.full(len(t), 0.18))
    return s * np.exp(-t * 14) * (1 - np.exp(-t * 600)) * vel * 0.25


def hum(dur, vel=1.0):
    t = tt(dur)
    s = sum(np.sin(2 * np.pi * 60 * h * t) / h for h in (1, 2, 3, 5))
    return s * vel * 0.05


def zap():
    t = tt(0.35)
    ph = 2 * np.pi * np.cumsum(1400 * np.exp(-t * 9) + 60) / SR
    return (np.sign(np.sin(ph)) * 0.4 + rng.standard_normal(len(t)) * 0.5) * np.exp(-t * 10) * 0.4


def sub_drop(dur=1.6):
    t = tt(dur)
    ph = 2 * np.pi * np.cumsum(70 * np.exp(-t * 1.6) + 28) / SR
    return np.sin(ph) * np.exp(-t * 1.4) * 0.9


# ---------- dog voice ----------
def _dog_src(f, rough=0.35, noise=0.25, seed=0):
    """Glottal pulse train with period-doubling roughness and breath noise."""
    r = np.random.default_rng(seed)
    f = f * (1 + 0.012 * r.standard_normal(len(f)).cumsum() / np.sqrt(np.arange(1, len(f) + 1)))
    ph = np.cumsum(f) / SR
    pulse = (ph % 1.0) ** 3 - 0.25
    pulse *= 1 + rough * np.sin(np.pi * ph)
    return pulse + noise * r.standard_normal(len(f))


def _shape(src, formants):
    return sum(_resonator(src, ff, bw) * g for ff, bw, g in formants)


def bark(f0=420, dur=0.17, vel=1.0, seed=0, formants=((750, 160, 1.0), (1500, 220, 0.6), (2700, 320, 0.3)), question=False):
    """One bark: fast attack, pitch rise-then-fall (or rise for a questioning "boof?")."""
    t = tt(dur)
    u = t / dur
    if question:
        contour = 0.85 + 0.45 * u ** 1.5
    else:
        contour = (0.85 + 0.35 * np.sin(np.pi * np.minimum(u * 1.4, 1))) * (1 - 0.15 * u)
    src = _dog_src(f0 * contour, 0.45, 0.35, seed)
    y = _shape(src, formants)
    y = onepole(y, 0.08 + 0.5 * np.sin(np.pi * np.minimum(u * 1.6, 1)))  # "w..uf" opening and closing
    env = (1 - np.exp(-t * 400)) * np.exp(-((u - 0.28) / 0.42) ** 2)
    y = np.tanh(y / (np.max(np.abs(y)) + 1e-9) * 2.6) * env
    return y * vel * 0.6


def woof(vel=1.0, seed=1):
    """Big confident dog: deep and round."""
    return bark(190, 0.3, vel, seed, ((520, 120, 1.0), (1050, 180, 0.55), (2300, 300, 0.2)))


def yip(f0=880, vel=1.0, seed=2):
    """Small dog yip."""
    return bark(f0, 0.085, vel, seed, ((1050, 200, 1.0), (2300, 300, 0.5), (3600, 400, 0.2)))


def whine(f_start=980, f_end=720, dur=1.3, vel=1.0, seed=3):
    """Sad whimper: nasal, tonal, wavering, with little breaks."""
    t = tt(dur)
    u = t / dur
    f = (f_start + (f_end - f_start) * u) * (1 + 0.035 * np.sin(2 * np.pi * 6.5 * t)) * (1 + 0.08 * np.sin(np.pi * u))
    src = _dog_src(f, 0.05, 0.06, seed)
    y = _shape(src, ((1150, 90, 1.0), (2600, 160, 0.5)))
    breaks = 1 - 0.6 * np.clip(np.sin(2 * np.pi * 2.3 * t + 1) - 0.7, 0, 1) / 0.3
    env = np.sin(np.pi * u) ** 0.7 * breaks
    return y / (np.max(np.abs(y)) + 1e-9) * env * vel * 0.45


def howl(dur=2.6, vel=1.0, seed=4):
    """Dramatic "awoooo": glide up, hold with vibrato, sink; vowel moves from /a/ to /u/."""
    t = tt(dur)
    u = t / dur
    f = np.interp(u, [0, 0.3, 0.75, 1], [380, 640, 580, 430]) * (1 + 0.025 * np.sin(2 * np.pi * 5.2 * t) * np.clip(u * 3, 0, 1))
    src = _dog_src(f, 0.08, 0.08, seed)
    a = _shape(src, ((760, 110, 1.0), (1250, 150, 0.6), (2700, 250, 0.2)))
    o = _shape(src, ((420, 90, 1.0), (820, 120, 0.6), (2500, 250, 0.15)))
    k = np.clip(u * 1.6 - 0.2, 0, 1)
    y = a * (1 - k) + o * k
    env = np.clip(u * 8, 0, 1) * np.clip((1 - u) * 4, 0, 1)
    return y / (np.max(np.abs(y)) + 1e-9) * env * vel * 0.5


def growl(dur=1.0, vel=1.0, seed=5):
    """Low rattling growl."""
    t = tt(dur)
    u = t / dur
    r = np.random.default_rng(seed)
    f = 105 * (1 + 0.08 * np.sin(2 * np.pi * 1.3 * t)) + 4 * r.standard_normal(len(t))
    src = _dog_src(f, 0.9, 0.5, seed) * (1 + 0.85 * np.sin(2 * np.pi * 27 * t))
    y = _shape(src, ((420, 110, 1.0), (980, 180, 0.5), (2200, 300, 0.15)))
    env = np.clip(u * 6, 0, 1) * np.clip((1 - u) * 5, 0, 1)
    return np.tanh(y / (np.max(np.abs(y)) + 1e-9) * 2) * env * vel * 0.5


def huff(vel=1.0, seed=6):
    """Nasal exhale / smug little huff."""
    t = tt(0.22)
    n = np.random.default_rng(seed).standard_normal(len(t))
    y = _resonator(n, 950, 300) + 0.4 * _resonator(n, 2400, 500)
    return y / (np.max(np.abs(y)) + 1e-9) * np.exp(-t * 14) * (1 - np.exp(-t * 300)) * vel * 0.45


def stomach(dur=1.1, vel=1.0, seed=7):
    """Hungry stomach gurgle."""
    t = tt(dur)
    r = np.random.default_rng(seed)
    f = 70 + 50 * np.abs(np.sin(2 * np.pi * 1.7 * t)) + 15 * np.sin(2 * np.pi * 9 * t)
    src = _dog_src(f, 0.6, 0.3, seed) * (0.6 + 0.4 * np.sin(2 * np.pi * (4 + 3 * r.random()) * t) ** 2)
    y = _shape(src, ((300, 80, 1.0), (700, 150, 0.3)))
    env = np.sin(np.pi * t / dur) ** 1.5
    return y / (np.max(np.abs(y)) + 1e-9) * env * vel * 0.5


def grumble(dur=0.8, vel=1.0, seed=8):
    """Determined low "mrrrf"."""
    t = tt(dur)
    u = t / dur
    f = np.interp(u, [0, 0.5, 1], [150, 190, 140])
    src = _dog_src(f, 0.5, 0.25, seed) * (1 + 0.4 * np.sin(2 * np.pi * 18 * t))
    y = _shape(src, ((500, 120, 1.0), (1100, 180, 0.5)))
    env = np.sin(np.pi * u) ** 0.8
    return y / (np.max(np.abs(y)) + 1e-9) * env * vel * 0.45


def record_scratch():
    t = tt(0.5)
    f = 300 + 900 * np.abs(np.sin(2 * np.pi * 2.2 * t)) * np.exp(-t * 2)
    n = np.random.default_rng(9).standard_normal(len(t))
    y = _resonator(n, 1, 1) * 0 + onepole(n, 0.3 + 0.2 * np.sin(2 * np.pi * 9 * t)) * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return y / (np.max(np.abs(y)) + 1e-9) * np.exp(-t * 4) * 0.5


def horn(dur=0.35, f=420):
    t = tt(dur)
    s = sum(np.sign(np.sin(2 * np.pi * f * k * t)) / k for k in (1, 1.26))
    return onepole(s, np.full(len(t), 0.25)) * np.clip(t * 60, 0, 1) * np.clip((dur - t) * 30, 0, 1) * 0.3
