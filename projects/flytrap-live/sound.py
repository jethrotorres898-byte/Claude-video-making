"""Soundtrack for the frame-by-frame "A Venus flytrap can count": the creator's voice (voice.wav from
voice.py), a soft plucky score ducked under it, and sound effects on every beat of the picture.
All times come from cues.py, the same timing edit.py animates to.

Usage: python3 sound.py out.wav [--no-voice]
"""
import os
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from cues import DROP_LAND, END, FLY_TOUCH, SNAP, START, WIGGLES, at, bee_offset  # noqa: E402
from synth import (SR, Mix, bass, bell, boing, clap, clonk, gulp, hat, onepole, pad, pluck, pop, rain_noise,  # noqa: E402
                   reverb, slide_whistle, snap, thud, thud_short, tick, tt, tweet, twinkle, whoosh, write_wav)


# ---------------- effects ----------------
def drip():
    t = tt(0.14)
    f = 1700 * np.exp(-t * 28) + 520
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) * 0.5


def cricket(n=3):
    out = np.zeros(int((n * 0.3 + 0.2) * SR))
    for k in range(n):
        t = tt(0.12)
        s = np.sin(2 * np.pi * 4700 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 48 * t))) * np.sin(np.pi * t / 0.12)
        out[int(k * 0.3 * SR):int(k * 0.3 * SR) + len(s)] += s
    return out * 0.07


def buzz(dur, f0=205, depth=25, rate=6.0, seed=0):
    """Insect wing buzz with wobbling pitch."""
    t = tt(dur)
    f = f0 + depth * np.sin(2 * np.pi * rate * t + seed) + 0.35 * depth * np.sin(2 * np.pi * 13.3 * t + seed)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(h * ph) / h for h in range(1, 9)) * (0.65 + 0.35 * np.sin(2 * np.pi * 31 * t))
    env = np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.2)
    return onepole(s, np.full(len(t), 0.3)) * env * 0.11


def big_snap():
    a = np.zeros(int(0.9 * SR))
    for sig, g in ((thud(), 1.0), (snap(1.0), 3.2), (clap(1.0), 1.4)):
        a[:len(sig)] += sig * g
    t = tt(0.06)
    a[:len(t)] += np.sin(2 * np.pi * 820 * t) * np.exp(-t * 80) * 0.7
    return a


def squish(seed):
    t = tt(0.24)
    n = np.random.default_rng(seed).standard_normal(len(t))
    return onepole(n, 0.06 + 0.18 * np.sin(np.pi * t / 0.24)) * np.sin(np.pi * t / 0.24) ** 2 * 0.55


def muffled(sig, coef=0.06):
    return onepole(sig, np.full(len(sig), coef))


def wind(dur, seed=7, level=1.0):
    r = np.random.default_rng(seed)
    t = tt(dur)
    n = onepole(r.standard_normal(len(t)), 0.012 + 0.01 * (1 + np.sin(2 * np.pi * t / 5.3)))
    env = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return n / (np.max(np.abs(n)) + 1e-9) * env * level


# ---------------- score ----------------
BEAT = 0.6                      # 100 bpm
BAR = 4 * BEAT
CHORDS = [(48, (60, 64, 67)), (45, (57, 60, 64)), (41, (53, 57, 60)), (43, (55, 59, 62))]   # C Am F G


def groove(m, t0, t1, vel=1.0, glock=None, bar0=0):
    """Plucky arpeggios, soft pad, bass and shaker from t0 until t1 (notes after t1 are dropped)."""
    for b in range(int(np.ceil((t1 - t0) / BAR))):
        root, triad = CHORDS[(b + bar0) % 4]
        tb = t0 + b * BAR
        if tb >= t1:
            break
        for note in triad:
            m.add('music', pad(note, min(BAR, t1 - tb) + 0.2, 0.55 * vel), tb, 1.0, -0.1)
        for k in (0, 2):
            if tb + k * BEAT < t1:
                m.add('music', bass(root, BEAT * 1.6, 0.55 * vel), tb + k * BEAT, 1.0, 0.0)
        arp = [triad[0] + 12, triad[1] + 12, triad[2] + 12, triad[1] + 12, triad[0] + 24, triad[2] + 12, triad[1] + 12, triad[2] + 12]
        for k, note in enumerate(arp):
            tk = tb + k * BEAT / 2
            if tk < t1:
                m.add('music', pluck(note, 0.25, (0.55 if k % 2 == 0 else 0.4) * vel), tk, 1.0, 0.25 if k % 2 else -0.25)
                if k % 2:
                    m.add('music', hat(0.45 * vel), tk, 1.0, 0.3)
        if glock:
            for k, note in enumerate(glock[b % len(glock)]):
                if note and tb + k * BEAT < t1:
                    m.add('music', bell(note, 1.2, 0.7 * vel), tb + k * BEAT, 1.0, 0.15)


def place(m, bus, sig, t0, gain, pans):
    """Add a mono signal with a time-varying pan (array, -1..1)."""
    b = m.bus(bus)
    i = int(t0 * SR)
    n = min(len(sig), m.n - i)
    p = np.interp(np.arange(n), np.linspace(0, n, len(pans)), pans)
    b[0, i:i + n] += sig[:n] * gain * (1 - np.maximum(p, 0))
    b[1, i:i + n] += sig[:n] * gain * (1 + np.minimum(p, 0))


def build(with_voice=True):
    DUR = END
    m = Mix(DUR)
    sfx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731
    amb = lambda sig, t0, g=1.0, pan=0.0: m.add('amb', sig, t0, g, pan)  # noqa: E731

    # ---- music: groove, suspense under "within about twenty seconds...", groove, brighter CTA ----
    within = at('within')
    groove(m, 0.0, within)
    for note in (55, 59, 62):
        m.add('music', pad(note, SNAP - within, 0.7), within, 1.0)
    t, k = within, 0
    while t < SNAP - 0.1:
        sfx(tick(1500 if k % 2 == 0 else 1050), t, 0.35, -0.3)
        t += 0.5
        k += 1
    groove(m, START[8] + 0.4, START[12])
    melody = [(76, 79, 81, 79), (76, 74, 72, None), (77, 76, 74, 72), (74, None, 79, None)]
    groove(m, START[12], at('hear', 1, 'e') + 0.3, 1.05, melody)
    end = at('hear', 1, 'e') + 0.3
    for note in (48, 60, 64, 67, 72):
        m.add('music', pad(note, DUR - end + 0.5, 0.7), end, 1.0)
    m.add('music', bell(84, 2.5, 0.8), end, 1.0)

    # ---- ambience per place ----
    for a, b in ((0.0, START[3]), (START[12], DUR)):                       # greenhouse: birds outside
        for tb in np.arange(a + 0.5, b - 0.3, 1.9):
            pan = 0.6 if int(tb * 10) % 2 else -0.5
            amb(tweet(int(tb * 7)), tb, 0.32, pan)
            amb(tweet(int(tb * 7) + 1), tb + 0.11, 0.25, pan)
    for a, b in ((START[3], START[5]), (START[6], START[11])):              # sunny bog: wind + birds
        amb(wind(b - a + 0.6, seed=int(a)), a - 0.3, 0.05, 0.0)
        for tb in np.arange(a + 0.7, b - 0.3, 2.3):
            amb(tweet(int(tb * 5) + 3), tb, 0.22, -0.6)
    for a, b in ((START[5], START[6]), (START[11], START[12])):             # rain
        r = np.stack([rain_noise(b - a + 0.6, 0.05, seed=int(a)), rain_noise(b - a + 0.6, 0.05, seed=int(a) + 1)])
        r = np.stack([onepole(r[0], np.full(r.shape[1], 0.35)), onepole(r[1], np.full(r.shape[1], 0.35))])
        i = int((a - 0.3) * SR)
        m.bus('amb')[:, i:i + r.shape[1]] += r[:, :m.n - i] * 3.0
        for tb in np.arange(a + 0.2, b, 0.37):
            amb(drip(), tb + 0.13 * np.sin(tb * 7), 0.16, float(np.sin(tb * 3)))

    # ---- shot 1-2: intro ----
    sfx(twinkle(0.6), 0.05, 0.45)
    sfx(pop(), at('count') - 0.02, 0.6, -0.2)
    sfx(bell(88, 0.8, 0.6), at('count'), 0.55, -0.2)
    sfx(whoosh(0.3), START[2] - 0.22, 0.4)
    for tw in (at('no'), at('joke')):                                       # finger wag "tsk tsk"
        sfx(clonk(1300, 0.4), tw + 0.04, 0.35, -0.4)
        sfx(clonk(1150, 0.4), tw + 0.2, 0.3, -0.4)
    # ---- shot 3-4: the plant, trigger hairs ----
    sfx(whoosh(0.4), START[3] - 0.3, 0.35)
    for i in range(5):
        sfx(clonk(1600 + 120 * i, 0.3), at('keeps') + i * 0.11, 0.25, 0.4)    # "keeps score" ticks
    for i, note in enumerate((84, 88, 91, 96)):
        sfx(bell(note, 1.0, 0.7), at('trigger') + i * 0.2, 0.6, 0.25 - 0.15 * i)
    # ---- shot 5: the raindrop ----
    sfx(whoosh(0.35) * 0.5, DROP_LAND - 0.38, 0.4, 0.0)
    sfx(drip(), DROP_LAND, 1.0, 0.0)
    sfx(bell(86, 0.9, 0.6), DROP_LAND + 0.02, 0.5, 0.0)
    sfx(cricket(3), at('nothing') + 0.55, 0.9, 0.4)
    # ---- shot 6: the fly, the second touch, the clock ----
    nb = FLY_TOUCH + 0.6 - START[6]
    place(m, 'sfx', buzz(nb, seed=1), START[6], 0.9, np.linspace(0.6, 0.1, 50))
    place(m, 'sfx', buzz(SNAP - FLY_TOUCH - 0.6, f0=225, depth=35, rate=9, seed=2), FLY_TOUCH + 0.6, 1.0, 0.1 + 0.25 * np.sin(np.linspace(0, 9, 60)))
    sfx(tick(1800), FLY_TOUCH, 0.6, 0.1)
    sfx(bell(89, 0.8, 0.6), FLY_TOUCH, 0.6, 0.1)
    sfx(pop(), at('within'), 0.45, -0.5)
    # ---- shot 7-8: SNAP, the jump ----
    sfx(whoosh(0.18), SNAP - 0.16, 0.6)
    sfx(big_snap(), SNAP, 0.55, 0.0)
    sfx(pop(), SNAP + 0.03, 0.5, 0.3)
    sfx(muffled(buzz(0.4, f0=250, depth=50, rate=14)) * 3, SNAP + 0.08, 0.5, 0.0)
    sfx(slide_whistle(320, 1350, 0.38), START[8] + 0.02, 0.5, -0.1)
    sfx(thud_short(), START[8] + 0.62, 0.55, -0.1)
    sfx(boing(0.5), START[8] + 0.62, 0.3, -0.1)
    sfx(pop(), at('fraction'), 0.45, 0.5)
    sfx(bell(96, 1.0, 0.55), at('fraction') + 0.05, 0.5, 0.5)
    # ---- shot 9: counting on his fingers ----
    for i, ti in enumerate((at('doesnt') - 0.05, at('stop'), at('counting'), at('counting') + 0.42)):
        sfx(pop(), ti, 0.35, 0.2)
        sfx(bell(84 + (0, 2, 4, 7)[i], 0.6, 0.5), ti + 0.02, 0.35, 0.2)
    # ---- shot 10: the struggles and the juice ----
    for i, tw in enumerate(WIGGLES):
        sfx(squish(30 + i), tw, 0.55, 0.1)
        sfx(muffled(buzz(0.3, seed=i)) * 3, tw, 0.45, 0.1)
        sfx(bell(84 + (0, 2, 4, 5, 7)[i], 0.7, 0.55), tw + 0.04, 0.38, 0.5)
    for i in range(5):
        sfx(gulp(0.5), at('digestive') + 0.05 + i * 0.13, 0.32, 0.1 - 0.05 * i)
    # ---- shot 11: rain on the boardwalk, false alarm ----
    sfx(drip(), at('energy'), 0.8, -0.2)
    for i, note in enumerate((91, 96)):
        sfx(bell(note, 0.9, 0.65), at('alarm') + i * 0.1, 0.6, 0.5)
    # ---- shot 12-15: CTA ----
    sfx(twinkle(0.7), at('count', 2) - 0.05, 0.55, 0.0)
    sfx(pop(), START[13] + 0.02, 0.45, 0.3)
    sfx(whoosh(0.3), START[14] - 0.22, 0.4)
    sfx(boing(0.6), at('finger') + 0.02, 0.35, -0.4)                      # the trap twitches at "finger"
    sfx(muffled(big_snap(), 0.12) * 0.6, at('finger') + 0.02, 0.4, -0.4)
    sfx(bell(91, 0.9, 0.7), at('yes'), 0.55, 0.3)                          # YES ding
    sfx(clonk(300, 0.8), at('no', 2), 0.5, -0.3)                           # NO bonk
    sfx(pop(), at('comments') + 0.1, 0.4, 0.2)
    sfx(pop(), at('follow') - 0.04, 0.6, 0.0)                              # + FOLLOW pops in
    sfx(clonk(900, 0.5), at('follow') + 0.55, 0.35, 0.0)                   # ...and gets pressed
    sfx(twinkle(0.6), at('next') - 0.1, 0.45, 0.2)
    d15 = DUR - START[15]
    xs = np.array([bee_offset(START[15] + u)[0] for u in np.linspace(0, d15, 80)])
    place(m, 'sfx', buzz(d15, f0=150, depth=18, rate=5, seed=3) * 0.8, START[15], 0.7, np.clip(-0.35 + xs / 60, -1, 1))

    # ---- voice, ducking, mix ----
    with wave.open(os.path.join(HERE, 'voice.wav')) as f:
        v0 = np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float64) / 32768
        assert f.getframerate() == SR
    v0 *= 0.7 / (np.max(np.abs(v0)) + 1e-9)
    n = m.n
    v = np.zeros(n)
    v[:min(n, len(v0))] = v0[:n]
    hop = SR // 100
    rms = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, mode='same'))
    env = np.zeros(n)
    acc = 0.0
    att, rel = 1 - np.exp(-1 / (0.02 * SR)), 1 - np.exp(-1 / (0.35 * SR))
    target = np.clip(rms / (np.percentile(rms[rms > 1e-4], 70) + 1e-9), 0, 1)
    for i in range(0, n, 64):
        acc += (att if target[i] > acc else rel) * 64 * (target[i] - acc)
        env[i:i + 64] = min(1.0, max(0.0, acc))
    vr = np.sqrt(np.mean(v[v != 0] ** 2))
    music = m.bus('music')
    music = music * 0.75 + np.stack([reverb(music[0], 1.6, 3.0, 1), reverb(music[1], 1.6, 3.0, 2)]) * 0.25
    music *= (vr * 0.2 / (np.sqrt(np.mean(music ** 2)) + 1e-9)) * (1 - 0.5 * env)
    fx = m.bus('sfx')
    fx = fx * 0.85 + np.stack([reverb(fx[0], 0.9, 5.0, 3), reverb(fx[1], 0.9, 5.0, 4)]) * 0.15
    ab = m.bus('amb')
    ab *= (vr * 0.1 / (np.sqrt(np.mean(ab ** 2)) + 1e-9)) * (1 - 0.35 * env)
    out = music + fx * 0.75 + ab
    if with_voice:
        out = out + np.stack([v, v])
    # soft knee limiter: the voice passes untouched, effect peaks (the SNAP) are rounded off
    L = np.max(np.abs(v)) * 1.5
    k = 0.75
    a = np.abs(out)
    over = a > k * L
    out[over] = np.sign(out[over]) * (k * L + (1 - k) * L * np.tanh((a[over] - k * L) / ((1 - k) * L)))
    fade = np.ones(n)
    fe = int(DUR * SR)
    fade[fe - int(0.9 * SR):fe] = np.linspace(1, 0, int(0.9 * SR))
    fade[fe:] = 0
    return (out * fade)[:, :fe]


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'mix.wav'
    mix = build('--no-voice' not in sys.argv)
    mix *= 0.89 / (np.max(np.abs(mix)) + 1e-9)
    write_wav(out, mix)
    print(f'wrote {out} ({mix.shape[1] / SR:.2f}s)')
