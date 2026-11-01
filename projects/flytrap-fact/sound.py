"""Soundtrack for "A Venus flytrap can count": the creator's own voice (voice.mp3), a soft plucky
score and sound effects, all placed on the narration's word cues (cues.js, loaded with node).

Usage: python3 sound.py out.wav [--no-voice]
"""
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from synth import (SR, Mix, bass, bell, clap, gulp, hat, hz, onepole, pad, paper_rustle, pluck, pop,  # noqa: E402
                   reverb, slide_whistle, snap, thud, thud_short, tick, tt, tweet, twinkle, whoosh, write_wav)

cues = json.loads(subprocess.run(
    ['node', '-e', "global.window={};require('./words.js');require('./cues.js');process.stdout.write(JSON.stringify(window.CUES))"],
    cwd=HERE, capture_output=True, text=True, check=True).stdout)
C, CUT, WIG, DUR = cues['C'], cues['CUT'], cues['WIGGLES'], cues['DURATION']


# ---------- extra effects ----------
def drip():
    t = tt(0.14)
    f = 1700 * np.exp(-t * 28) + 520
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) * 0.5


def cricket(n=3):
    out = np.zeros(int((n * 0.3 + 0.2) * SR))
    for k in range(n):
        t = tt(0.12)
        s = np.sin(2 * np.pi * 4700 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 48 * t))) * np.sin(np.pi * t / 0.12)
        i = int(k * 0.3 * SR)
        out[i:i + len(s)] += s
    return out * 0.07


def flybuzz(dur):
    t = tt(dur)
    f = 205 + 25 * np.sin(2 * np.pi * 6 * t) + 9 * np.sin(2 * np.pi * 13.3 * t)
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


# ---------- score ----------
BEAT = 0.6                      # 100 bpm
BAR = 4 * BEAT
CHORDS = [(48, (60, 64, 67)), (45, (57, 60, 64)), (41, (53, 57, 60)), (43, (55, 59, 62))]   # C Am F G


def groove(m, t0, t1, vel=1.0, glock=None):
    """Plucky arpeggios, soft pad, bass and shaker from t0 until t1 (notes after t1 are dropped)."""
    nbars = int(np.ceil((t1 - t0) / BAR))
    for b in range(nbars):
        root, triad = CHORDS[b % 4]
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


def build(with_voice=True):
    m = Mix(DUR)
    # music: groove, suspense under "within about twenty seconds...", groove again, brighter outro
    groove(m, 0.0, C['within'])
    for note in (55, 59, 62):
        m.add('music', pad(note, C['snap'] - C['within'], 0.7), C['within'], 1.0)
    t = C['within']
    k = 0
    while t < C['snap'] - 0.1:
        m.add('sfx', tick(1500 if k % 2 == 0 else 1050), t, 0.35, -0.3)
        t += 0.5
        k += 1
    groove(m, CUT[2] + 0.35, CUT[5])
    melody = [(76, 79, 81, 79), (76, 74, 72, None), (77, 76, 74, 72), (74, None, 79, None)]
    groove(m, CUT[5], C['follow'] + 1.0, 1.05, melody)
    end = C['follow'] + 1.0
    for note in (48, 60, 64, 67, 72):
        m.add('music', pad(note, DUR - end, 0.7), end, 1.0)
    m.add('music', bell(84, 2.5, 0.8), end, 1.0)

    # sound effects
    sfx = lambda sig, t0, g=1.0, pan=0.0: m.add('sfx', sig, t0, g, pan)  # noqa: E731
    sfx(twinkle(0.6), 0.05, 0.5)
    sfx(paper_rustle(0.35, 1), 0.25, 0.35, -0.6)
    for tb, pan in ((0.7, -0.6), (2.0, 0.5), (4.9, -0.3), (6.8, 0.7), (8.5, -0.5), (24.6, 0.6), (35.9, -0.4), (38.9, 0.5), (41.7, -0.6), (44.0, 0.4)):
        sfx(tweet(int(tb * 10)), tb, 0.5, pan)
        sfx(tweet(int(tb * 10) + 1), tb + 0.12, 0.4, pan)
    sfx(pop(), C['venus'], 0.6, 0.45)
    sfx(pop(), C['count'], 0.7, -0.3)
    sfx(bell(88, 0.8, 0.6), C['count'] + 0.02, 0.6, -0.3)
    sfx(paper_rustle(0.3, 2), C['no'] - 0.1, 0.25, -0.2)
    for i in range(5):
        sfx(paper_rustle(0.09, 10 + i), C['keeps'] + i * 0.12, 0.35, 0.5)
    for ct in CUT[1:6]:
        sfx(whoosh(0.35), ct - 0.3, 0.35, 0.0)
    for i, note in enumerate((84, 88, 91)):
        sfx(bell(note, 1.0, 0.7), C['trigger'] + i * 0.22, 0.7, 0.2)
    sfx(drip(), C['one'] - 0.02, 0.9, 0.0)
    sfx(snap(0.6) * 0.5, C['one'], 0.6)
    sfx(pop(), C['one'] + 0.05, 0.6, 0.5)
    sfx(cricket(3), C['one'] + 1.25, 0.9, 0.4)
    land = C['second'] - 0.12
    nb = int((land - C['but']) * SR)
    buzz = flybuzz(land - C['but'])
    pans = np.linspace(0.7, 0.1, len(buzz))
    m.bus('sfx')[0, int(C['but'] * SR):int(C['but'] * SR) + nb] += buzz[:nb] * (1 - np.maximum(pans[:nb], 0)) * 0.9
    m.bus('sfx')[1, int(C['but'] * SR):int(C['but'] * SR) + nb] += buzz[:nb] * 0.9
    for tt0, note in ((C['second'], 86), (C['snap'] - 0.12, 89)):
        sfx(tick(1800), tt0, 0.6, 0.1)
        sfx(bell(note, 0.8, 0.6), tt0, 0.6, 0.1)
        sfx(pop(), tt0 + 0.03, 0.5, 0.5)
    sfx(pop(), C['within'], 0.5, -0.5)
    sfx(big_snap(), C['snap'], 0.6, 0.0)
    sfx(pop(), C['snap'] + 0.03, 0.5, 0.3)
    sfx(slide_whistle(300, 1300, 0.42), CUT[2] + 0.02, 0.55, -0.1)
    sfx(thud_short(), CUT[2] + 0.55, 0.6, -0.1)
    sfx(pop(), C['fraction'], 0.6, 0.6)
    sfx(bell(96, 1.0, 0.6), C['fraction'] + 0.05, 0.6, 0.6)
    sfx(pop(), CUT[3] + 0.1, 0.5, 0.5)
    for i, tw in enumerate(WIG):
        sfx(squish(30 + i), tw, 0.55, 0.1)
        sfx(muffled(flybuzz(0.3)) * 3, tw, 0.45, 0.1)
        sfx(bell(84 + (0, 2, 4, 5, 7)[i], 0.7, 0.55), tw + 0.04, 0.4, 0.5)
    for i in range(4):
        sfx(gulp(0.5), C['digestive'] + 0.1 + i * 0.26, 0.35, 0.1)
    sfx(drip(), C['energy'] - 0.02, 0.9, -0.1)
    sfx(bell(88, 0.8, 0.6), C['energy'] + 0.02, 0.6, -0.1)
    sfx(pop(), C['energy'] + 0.1, 0.5, 0.6)
    for i, note in enumerate((91, 96)):
        sfx(bell(note, 0.9, 0.7), C['alarm'] + i * 0.1, 0.7, 0.6)
    sfx(twinkle(0.7), C['count2'] - 0.05, 0.6, 0.0)
    sfx(paper_rustle(0.4, 3), C['follow'], 0.45, -0.4)
    sfx(pop(), C['follow'] + 0.05, 0.6, -0.4)
    sfx(bell(96, 1.0, 0.7), C['follow'] + 0.15, 0.6, 0.2)

    # voice
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'voice.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         cwd=HERE, capture_output=True, check=True).stdout
    voice = np.frombuffer(pcm, np.float32).astype(np.float64)
    voice *= 0.7 / (np.max(np.abs(voice)) + 1e-9)
    n = m.n
    v = np.zeros(n)
    v[:min(n, len(voice))] = voice[:n]
    # duck the music under the voice
    hop = SR // 100
    rms = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, mode='same'))
    env = np.zeros(n)
    acc = 0.0
    att, rel = 1 - np.exp(-1 / (0.02 * SR)), 1 - np.exp(-1 / (0.35 * SR))
    target = np.clip(rms / (np.percentile(rms[rms > 1e-4], 70) + 1e-9), 0, 1)
    for i in range(0, n, 64):
        x = target[i]
        acc += (att if x > acc else rel) * 64 * (x - acc)
        env[i:i + 64] = min(1.0, max(0.0, acc))
    music = m.bus('music')
    music = music * 0.75 + np.stack([reverb(music[0], 1.6, 3.0, 1), reverb(music[1], 1.6, 3.0, 2)]) * 0.25
    vr = np.sqrt(np.mean(v[v != 0] ** 2)) if np.any(v) else 0.1
    mr = np.sqrt(np.mean(music ** 2)) + 1e-9
    music *= (vr * 0.2 / mr) * (1 - 0.5 * env)
    fx = m.bus('sfx')
    fx = fx * 0.85 + np.stack([reverb(fx[0], 0.9, 5.0, 3), reverb(fx[1], 0.9, 5.0, 4)]) * 0.15
    out = music + fx * 0.75
    if with_voice:
        out = out + np.stack([v, v])
    fade = np.ones(n)
    fe = int(DUR * SR)
    fade[fe - int(0.8 * SR):fe] = np.linspace(1, 0, int(0.8 * SR))
    fade[fe:] = 0
    return out * fade


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'mix.wav'
    mix = build('--no-voice' not in sys.argv)
    mix = mix[:, :int(DUR * SR)]
    mix *= 0.89 / (np.max(np.abs(mix)) + 1e-9)
    write_wav(out, mix)
    print(f'wrote {out} ({mix.shape[1] / SR:.2f}s)')
