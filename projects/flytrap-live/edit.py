"""A Venus flytrap can count: frame-by-frame video made from the creator's 15 pictures (shots/01-15.jpg).

Every frame is the shot's own picture with small changes made from its pixels (tools/livepic.py):
blinks, lip-sync, a wagging finger, glowing trigger hairs, a falling raindrop, a buzzing fly, the
snap, a jump, struggles, rain, drips, a flying bee, wind in the plants, dust in the light, and a
camera that always moves. Shots are cut to the narration (voice.wav and words.json from voice.py)
and word-by-word captions are drawn on top. 1080x1920, 30 fps.

Usage: python3 edit.py out.mp4 [--workers 4]
       python3 edit.py prefix --stills 1.0,3.5        (PNG stills)
"""
import os
import subprocess
import sys
import wave
from multiprocessing import Pool

import numpy as np
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from livepic import (FPS, OUT_H, OUT_W, Eye, Mark, Motes, Rain, Sprite, TextSprite, Wings, back, blink, bob, buzz, camera,  # noqa: E402
                     clamp01, contrast_mask, drop, ease, ease_in, ease_out, find_highlights, fit_circle, glow, grabcut_mask, hold, inpaint,
                     keys, load, noise1, poly_mask, pulse, ramp, region_mask, ripple_rings, ripple_warp, rot_warp, shake, shift_warp,
                     soft, sparkle, sway, to_u8)
from lipsync import MouthRig, frame_track, param_track, sample_style, segments  # noqa: E402
sys.path.insert(0, HERE)
from mouths import CFG as MOUTH_CFG, TEETH  # noqa: E402

P = lambda *a: os.path.join(HERE, *a)  # noqa: E731
FONT = P('..', '..', 'assets', 'fonts', 'Nunito-Black.ttf')
PW, PH = 1152, 2048
PIC = {n: load(P('shots', f'{n:02d}.jpg'), (PW, PH)) for n in range(1, 16)}

# ---------------- narration ----------------
from cues import COUNT9, CTA, CUTS, DROP_LAND, END, FLY_TOUCH, PUNCH5, PUNCH10, PUNCH14, SNAP, START, WIGGLES, WORDS, at, bee_offset, norm  # noqa: E402

with wave.open(P('voice.wav')) as f:
    _a = np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768
    _sr = f.getframerate()
_hop = _sr // FPS
_rms = np.sqrt(np.array([np.mean(_a[i * _hop:(i + 1) * _hop] ** 2) for i in range(len(_a) // _hop)]) + 1e-12)
_rms = np.clip(_rms / np.percentile(_rms[_rms > 1e-3], 92), 0, 1.3)
ENV, _acc = [], 0.0
for v in _rms:
    _acc = v if v > _acc else _acc * 0.6 + v * 0.4
    ENV.append(_acc if _acc > 0.07 else 0.0)


def env(t):
    i = int(t * FPS)
    return ENV[i] if 0 <= i < len(ENV) else 0.0


# ---------------- lip-sync: the standard mouth shapes, timed to the voice (tools/lipsync.py) ----------------
NFR = int(END * FPS) + 2
TRACK, STRESS = frame_track(segments(WORDS, ENV), NFR)
STRESS_ON = [f / FPS for f in range(1, NFR) if STRESS[f] and not STRESS[f - 1]]


def fidx(t):
    return min(NFR - 1, max(0, int(round(t * FPS))))


def talk_tilt(t, seed=0, amp=1.3):
    """Head tilts that land on the stressed syllables, alternating sides (a talking head is never still)."""
    a = 0.0
    for k, ts in enumerate(STRESS_ON):
        dt = t - ts
        if 0 <= dt < 0.9:
            a += (1.0 if k % 2 else -1.0) * amp * (dt / 0.12) * np.exp(1 - dt / 0.12)
    return a + 0.5 * noise1(t * 0.6, seed)


def cam(cx, cy, z, t, seed, shake_xy=(0.0, 0.0), rot=0.0):
    """Handheld drift + shake (in output px) on top of a planned move."""
    s = z * OUT_W / PW
    hx = 3.0 * noise1(t * 0.55, seed) + shake_xy[0]
    hy = 2.5 * noise1(t * 0.47, seed + 5) + shake_xy[1]
    return cx + hx / s, cy + hy / s, z, rot + 0.12 * noise1(t * 0.4, seed + 9)


def move(t, t0, t1, a, b, f=ease):
    u = f((t - t0) / max(1e-6, t1 - t0))
    return tuple(x + (y - x) * u for x, y in zip(a, b))


def nxt(n):
    return START[n + 1] if n + 1 in START else END


def veg_weight(F, box, sigma=6):
    """Where the plants are (green / straw coloured), as a soft full-frame weight."""
    x0, y0, x1, y1 = box
    Q = F[y0:y1, x0:x1]
    g, b = Q[..., 1], Q[..., 2]
    m = (g >= b + 0.04) & ((Q.max(2) - Q.min(2)) > 0.12)
    w = np.zeros(F.shape[:2], np.float32)
    w[y0:y1, x0:x1] = ndimage.gaussian_filter(m.astype(np.float32), sigma)
    return w


# =============== shot set-ups (computed once, shared by the worker processes) ===============
F1 = PIC[1]
E1 = [Eye(F1, (586, 1116, 621, 1166)), Eye(F1, (708, 1119, 746, 1169))]
B1 = [Mark(F1, (578, 1062, 622, 1095)), Mark(F1, (715, 1068, 764, 1104))]
MOTES1 = Motes((80, 200, 1100, 1250), n=38, seed=1)

F2 = PIC[2]
E2 = [Eye(F2, (452, 843, 507, 914)), Eye(F2, (708, 844, 760, 914))]
B2 = [Mark(F2, (426, 778, 529, 831)), Mark(F2, (682, 780, 786, 834))]
HAND2_POLY = [(262, 1098), (322, 1098), (334, 1150), (334, 1268), (362, 1286), (398, 1300), (428, 1330), (433, 1402), (404, 1444), (372, 1474), (334, 1522),
              (240, 1534), (208, 1472), (212, 1380), (222, 1300), (258, 1266), (258, 1150)]
_h2 = region_mask(F2, HAND2_POLY, frac=0.85)
_fy = np.mgrid[0:PH, 0:PW][0]
FINGER2 = _h2 & (_fy < 1312)
HAND2 = Sprite(F2, FINGER2, pad=6)
_fade = np.clip((1312 - np.arange(HAND2.box[1], HAND2.box[3])) / 26, 0, 1)[:, None]
HAND2.a *= _fade                                         # the finger blends into the fist at its base
HAND2.pm = HAND2.rgb * HAND2.a[..., None]
CLEAN2 = inpaint(F2, ndimage.binary_dilation(FINGER2 & (_fy < 1290), iterations=4), 7)

F4 = PIC[4]
HAIRS4 = [(716, 812), (803, 902), (818, 1062), (432, 862)]

F5 = PIC[5]
_yy, _xx = np.mgrid[0:PH, 0:PW]
DROP5_C = (573.0, 1028.0)
DROP5 = Sprite(F5, np.hypot(_xx - DROP5_C[0], _yy - DROP5_C[1]) < 27.5, pad=6, feather=0.9)
CLEAN5 = inpaint(F5, np.hypot(_xx - DROP5_C[0], _yy - DROP5_C[1]) < 30, 5)
RAIN5 = Rain(PW, PH, n=150, angle=6, seed=2, alpha=(0.14, 0.32))
PUDDLE5 = [(140, 1500), (300, 1640), (900, 1560), (1020, 1700), (760, 1840), (220, 1880), (980, 1950), (520, 1960)]

F6 = PIC[6]
WINGS6 = Wings(F6, poly_mask(F6.shape, [(645, 975), (650, 945), (668, 905), (695, 872), (722, 858), (748, 866), (772, 880), (800, 886), (814, 912),
                                         (806, 948), (778, 974), (750, 980), (720, 970), (690, 962), (662, 966)])
               & ~poly_mask(F6.shape, [(628, 1012), (638, 976), (660, 963), (690, 960), (720, 967), (752, 978), (778, 995), (784, 1012)]), (670, 972))
SPARK6 = find_highlights(F6, (130, 520, 1060, 1700), n=16, min_dist=60)

F7 = PIC[7]
_spikes7 = ((F7 @ np.array([0.2126, 0.7152, 0.0722], np.float32)) > 0.6) & (F7[..., 1] - F7[..., 2] > 0.07)
WINGS7 = [Wings(F7, poly_mask(F7.shape, [(425, 940), (455, 928), (500, 928), (540, 938), (562, 955), (562, 990), (540, 1006), (500, 1014),
                                          (455, 1010), (428, 990)]), (560, 975), keep_front=_spikes7),
          Wings(F7, poly_mask(F7.shape, [(638, 950), (675, 945), (715, 950), (735, 965), (730, 985), (700, 995), (660, 995), (638, 985)]),
                (638, 970), keep_front=_spikes7)]
BG7 = WINGS7[1].bg.copy()
_x0, _y0, _x1, _y1 = WINGS7[0].box
BG7[_y0:_y1, _x0:_x1] = WINGS7[0].bg[_y0:_y1, _x0:_x1]

F8 = PIC[8]
CHAR8_POLY = [(180, 560), (205, 492), (270, 478), (322, 525), (320, 612), (350, 700), (368, 640), (395, 568), (450, 530), (520, 524), (592, 545), (632, 598),
              (642, 680), (690, 688), (703, 624), (745, 598), (808, 612), (818, 665), (792, 716), (760, 772), (712, 830), (650, 885), (602, 905), (578, 980),
              (562, 1050), (548, 1080), (592, 1158), (662, 1222), (718, 1254), (716, 1322), (662, 1358), (588, 1352), (552, 1306), (500, 1215), (470, 1170),
              (440, 1222), (402, 1280), (365, 1335), (290, 1343), (247, 1312), (242, 1240), (272, 1178), (328, 1108), (318, 1062), (282, 1002), (236, 962),
              (222, 880), (238, 790), (222, 700), (212, 616)]
_m8 = grabcut_mask(F8, CHAR8_POLY)
CHAR8 = Sprite(F8, _m8, pad=6)
CLEAN8 = inpaint(F8, ndimage.binary_dilation(_m8, iterations=5), 7)

F9 = PIC[9]
E9 = [Eye(F9, (564, 1100, 593, 1134)), Eye(F9, (626, 1094, 658, 1128))]
_hand9 = grabcut_mask(F9, [(482, 1196), (496, 1170), (511, 1155), (530, 1157), (543, 1177), (551, 1195), (570, 1201), (594, 1210), (610, 1228),
                           (604, 1255), (576, 1268), (544, 1266), (518, 1250), (496, 1232)])
_cuff9 = poly_mask(F9.shape, [(552, 1232), (584, 1214), (614, 1218), (626, 1250), (614, 1282), (584, 1286), (556, 1270)]) & (F9[..., 2] > F9[..., 0] + 0.03)
_cuff9 = ndimage.binary_closing(_cuff9, iterations=2)
HAND9 = Sprite(F9, _hand9 & ~_cuff9, pad=6)
CUFF9 = Sprite(F9, _cuff9, pad=4, feather=0.7)
CLEAN9 = inpaint(F9, ndimage.binary_dilation(_hand9 & ~_cuff9, iterations=4), 7)
TRAP9 = [(462, 1292), (302, 1256), (222, 1378), (522, 1402), (198, 1518)]      # number positions, above the counted traps
NUM9 = [TextSprite(str(k + 1), FONT, 92, fill=(255, 255, 255), stroke_w=9) for k in range(5)]

F10 = PIC[10]
TRAP10 = soft(poly_mask(F10.shape, [(430, 560), (520, 400), (640, 410), (760, 440), (860, 480), (930, 590), (985, 900), (990, 1160), (930, 1420), (800, 1590),
                                    (640, 1680), (590, 1760), (545, 1760), (500, 1650), (330, 1540), (225, 1330), (200, 1000), (240, 760), (330, 620)]), 12)
SPARK10 = find_highlights(F10, (200, 420, 1000, 1650), n=12, min_dist=60)
JUICE10 = [(622, 760), (604, 880), (628, 1000), (600, 1130), (622, 1250), (588, 1370), (612, 1480)]

F11 = PIC[11]
E11 = [Eye(F11, (521, 769, 546, 802)), Eye(F11, (580, 760, 603, 792))]
RAIN11 = Rain(PW, PH, n=200, angle=10, seed=4, alpha=(0.16, 0.36))
TIPS11 = [(362, 747), (478, 696), (736, 706), (850, 650)]
PUDDLE11 = [(600, 1720), (690, 1790), (790, 1700), (870, 1760), (960, 1880), (1040, 1950), (760, 1860), (565, 1795), (1080, 1820), (650, 1905)]
VEG11 = veg_weight(F11, (0, 1050, PW, PH))

F12 = PIC[12]
E12 = [Eye(F12, (497, 929, 534, 985)), Eye(F12, (635, 920, 678, 978))]
B12 = [Mark(F12, (476, 847, 520, 893)), Mark(F12, (629, 841, 698, 888))]
MOTES12 = Motes((60, 150, 1100, 1300), n=36, seed=5)

F13 = PIC[13]
E13 = [Eye(F13, (503, 727, 538, 774)), Eye(F13, (628, 732, 665, 780))]
MOTES13 = Motes((60, 150, 1100, 1300), n=34, seed=6)

F14 = PIC[14]
E14 = [Eye(F14, (503, 779, 551, 850)), Eye(F14, (706, 777, 759, 847))]
B14 = [Mark(F14, (477, 691, 560, 758)), Mark(F14, (665, 703, 780, 773))]
MOTES14 = Motes((60, 150, 1100, 1300), n=34, seed=7)

F15 = PIC[15]
E15 = [Eye(F15, (541, 905, 576, 948)), Eye(F15, (633, 857, 671, 901))]
_mb = contrast_mask(F15, (343, 1093, 448, 1192), thr=0.08)
_bw = poly_mask(F15.shape, [(352, 1112), (360, 1096), (378, 1088), (395, 1092), (406, 1108), (402, 1128), (390, 1136), (370, 1133), (356, 1124)]) \
    & ~poly_mask(F15.shape, [(378, 1140), (384, 1126), (398, 1124), (412, 1132), (412, 1150), (378, 1150)])
WINGS15 = Wings(F15, _bw, (392, 1132))
BEE15 = Sprite(F15, _mb & ~ndimage.binary_dilation(_bw, iterations=1), pad=4)
CLEAN15 = inpaint(F15, ndimage.binary_dilation(_mb | _bw, iterations=4), 6)
MOTES15 = Motes((60, 150, 1100, 1300), n=36, seed=8)


_MS = sample_style(PIC[1], MOUTH_CFG[1]['sample'])


def _mouth(n):
    c = MOUTH_CFG[n]
    smp = sample_style(PIC[n], c['sample']) if c['sample'] else _MS
    st = dict(ink=smp['ink'], inner=smp['inner'] * 0.92, tongue=smp['tongue'], teeth=TEETH, **c['style'])
    return MouthRig(PIC[n], c['erase'], c['c'], c['hw'], st)


MOUTH = {n: _mouth(n) for n in MOUTH_CFG}
MPAR = {n: param_track(TRACK, STRESS, ENV, MOUTH_CFG[n]['rest']) for n in MOUTH_CFG}
HEAD = {n: fit_circle(PIC[n], c, r) for n, (c, r) in {1: ((710, 1140), 175), 2: ((577, 862), 312), 9: ((660, 1040), 140),
                                                      12: ((675, 890), 225), 13: ((597, 750), 157), 14: ((665, 777), 285)}.items()}


def head_tilt(F, n, ang):
    """Tilt the head: the face rotates inside its round outline (which a rotation leaves unchanged)."""
    (cx, cy), R = HEAD[n]
    rot_warp(F, (cx, cy), ang, R - 5, R + 9)


# =============== shot animations: (picture, camera) for global time t ===============
def s1(t):
    F = F1.copy()
    MOUTH[1].draw(F, MPAR[1][fidx(t)])
    lift = -5 * hold(t, at('count') - 0.12, 0.12, 0.55, 0.3)
    for b in B1:
        b.draw(F, dy=lift)
    for e in E1:
        e.blink(F, blink(t, [1.72, 3.75]))
    head_tilt(F, 1, talk_tilt(t, 1, 1.4))
    bob(F, (520, 930, 900, 1840), 1.4 * np.sin(2 * np.pi * t / 3.2) + 0.7 * clamp01(env(t)), 1840, 1000)
    sway(F, (290, 1190, 600, 1430), t, 3.0, 1430, 230, freq=0.45, k=0.01)
    sway(F, (120, 380, 500, 740), t, 4.0, 400, 320, freq=0.25, hang=True)
    sway(F, (730, 360, 1020, 820), t, 4.0, 380, 420, freq=0.22, phase=1.3, hang=True)
    MOTES1.draw(F, t, 0.9)
    cx, cy, z = move(t, 0, nxt(1), (576, 1024, 1.0), (650, 1150, 1.13))
    return F, cam(cx, cy, z, t, 1)


def s2(t):
    F = CLEAN2.copy()
    MOUTH[2].draw(F, MPAR[2][fidx(t)])
    a = 0.0
    for tw in (at('no'), at('joke')):
        a += 8.0 * np.sin(2 * np.pi * 3.0 * (t - tw)) * hold(t, tw - 0.04, 0.08, 0.42, 0.15)
    HAND2.draw(F, ang=a, pivot=(298, 1300))
    low = 4.5 * hold(t, at('joke') - 0.08, 0.1, 0.6, 0.3)
    for b in B2:
        b.draw(F, dy=low)
    for e in E2:
        e.blink(F, blink(t, [START[2] + 1.15]))
    head_tilt(F, 2, talk_tilt(t, 2, 0.9))
    bob(F, (160, 520, 1000, PH), 1.8 * np.sin(2 * np.pi * t / 3.0), PH, 1100)
    sway(F, (740, 1180, 1100, 1620), t, 3.0, 1600, 420, freq=0.4)
    t0 = START[2]
    z = 1.12 + 0.06 * ease_out((t - t0) / 2.4) + 0.025 * hold(t, at('joke') - 0.05, 0.12, 0.5, 0.3)
    return F, cam(575 - 12 * ramp(t, t0, t0 + 2.4), 1000, z, t, 2)


def s3(t):
    F = PIC[3].copy()
    sway(F, (0, 0, 780, 920), t, 3.5, 900, 900, freq=0.22, k=0.004, power=2.0)
    sway(F, (760, 520, PW, 860), t, 2.0, 860, 340, freq=0.2, k=0.004, phase=0.8)
    sway(F, (0, 820, PW, PH), t, 2.4, 9999, 1, freq=0.32, k=0.011)
    sway(F, (280, 1080, 900, 1480), t, 3.5, 1500, 420, freq=0.42, k=0.012, phase=2.0)
    shift_warp(F, (1040, 385), 14 * ramp(t, START[3] - 0.3, nxt(3)), 0, 90, 170)
    glow(F, 880, 225, 120, (1.0, 0.97, 0.8), 0.12 + 0.06 * np.sin(2 * np.pi * t / 2.4))
    cx, cy, z = move(t, START[3] - 0.15, nxt(3) + 0.15, (600, 800, 1.3), (560, 1245, 1.3))
    return F, cam(cx, cy, z, t, 3)


def s4(t):
    F = F4.copy()
    sway(F, (0, 1250, PW, PH), t, 2.5, 9999, 1, freq=0.3, k=0.012)
    sway(F, (0, 0, PW, 620), t, 4.0, 9999, 1, freq=0.25, k=0.005, phase=1.0)
    glow(F, 760, 120, 380, (1.0, 0.97, 0.85), 0.07 + 0.04 * np.sin(2 * np.pi * t / 2.8))
    t0 = at('trigger')
    for i, (x, y) in enumerate(HAIRS4):
        k = hold(t, t0 + i * 0.2, 0.07, 0.55, 0.7)
        glow(F, x, y, 28, (1.0, 0.86, 0.35), 0.9 * k)
        glow(F, x, y, 8, (1.0, 0.98, 0.85), 0.95 * k)
    cx, cy, z = move(t, START[4] - 0.15, nxt(4) + 0.15, (600, 1000, 1.05), (680, 925, 1.3))
    return F, cam(cx, cy, z, t, 4)


def s5(t):
    land = DROP_LAND
    F = CLEAN5.copy()                      # the picture without its raindrop; the drop is a sprite
    sway(F, (0, 1250, PW, PH), t, 2.2, 9999, 1, freq=0.3, k=0.012)
    sway(F, (0, 0, PW, 700), t, 3.0, 9999, 1, freq=0.22, k=0.006)
    if t < land:
        u = ramp(t, land - 0.42, land)
        if u > 0:
            y = DROP5_C[1] - 560 * (1 - u) ** 2
            DROP5.draw(F, dy=y - DROP5_C[1], sx=0.9, sy=1.18)
    else:
        d = t - land
        q = 0.3 * np.exp(-d / 0.14) * np.cos(2 * np.pi * 4.2 * d)
        DROP5.draw(F, sx=1 + q, sy=1 - q, pivot=(DROP5_C[0], DROP5_C[1] + 22))
        if d < 0.45:
            for i in range(5):
                ang = np.pi * (0.15 + 0.7 * i / 4)
                sp = 230 + 40 * (i % 2)
                px = DROP5_C[0] - np.cos(ang) * sp * d
                py = DROP5_C[1] + 10 - np.sin(ang) * sp * d + 1300 * d * d
                drop(F, px, py, 4.5, alpha=1 - d / 0.45)
        k = hold(t, land, 0.06, 0.45, 0.8)
        glow(F, DROP5_C[0], DROP5_C[1] + 14, 34, (1.0, 0.86, 0.35), 0.85 * k)
    RAIN5.draw(F, t)
    ripple_rings(F, PUDDLE5, t, period=0.8, rmax=22, k=0.45, seed=5)
    if t < PUNCH5:
        cx, cy, z = move(t, START[5] - 0.15, PUNCH5, (576, 1000, 1.04), (575, 1012, 1.16))
    else:
        cx, cy, z = move(t, PUNCH5, nxt(5) + 0.15, (573, 1036, 1.6), (573, 1032, 1.7))
    return F, cam(cx, cy, z, t, 5)


def s6(t):
    F = WINGS6.bg.copy()
    sway(F, (0, 300, 220, PH), t, 5.0, 2100, 1800, freq=0.3, k=0.004)
    sway(F, (930, 300, PW, PH), t, 5.0, 2100, 1800, freq=0.28, k=0.004, phase=1.7)
    glow(F, 576, 120, 420, (1.0, 0.96, 0.82), 0.06 + 0.03 * np.sin(2 * np.pi * t / 2.6))
    sparkle(F, SPARK6, t, size=15, k=0.85, seed=6)
    ts = at('second') + 0.15
    st = ease((t - ts) / 0.25)
    shift_warp(F, (655, 1000), -8 * st, 2 * st, 115, 175)
    angs, wts = buzz(fidx(t), -26, 16, spread=18, n=7)               # wings flip up / down every frame, motion-blurred
    WINGS6.draw(F, angs, wts, dx=-8 * st, dy=2 * st)
    k = hold(t, FLY_TOUCH, 0.06, 0.5, 0.55)
    glow(F, 552, 1072, 24, (1.0, 0.86, 0.35), 0.9 * k)
    glow(F, 552, 1072, 7, (1.0, 0.98, 0.85), 0.9 * k)
    tr = 2.5 * ramp(t, at('within'), SNAP)
    cx, cy, z = move(t, START[6] - 0.15, SNAP, (600, 1060, 1.05), (650, 1010, 1.32), ease_in)
    return F, cam(cx, cy, z, t, 6, (tr * noise1(t * 30, 1), tr * noise1(t * 27, 2)))


DROPS7 = [((420, 640), (-380, -520)), ((700, 600), (360, -560)), ((560, 560), (-60, -700)), ((300, 900), (-520, -260)), ((860, 880), (520, -300)),
          ((330, 1200), (-480, -120)), ((820, 1230), (470, -160)), ((480, 610), (-200, -640)), ((640, 590), (210, -650))]


def s7(t):
    F = BG7.copy()
    d = max(0.0, t - SNAP)
    q = np.exp(-d / 0.16) * np.cos(2 * np.pi * 6.5 * d)
    rot_warp(F, (575, 1020), 0.0, 430, 640, scale=(1 + 0.07 * q, 1 - 0.07 * q))
    jx, jy = 2.5 * noise1(t * 40, 1), 1.8 * noise1(t * 37, 3)       # the trapped fly trembles...
    shift_warp(F, (585, 990), jx, jy, 95, 140)
    angs, wts = buzz(fidx(t), -13, 9, spread=10, n=5)                # ...and buzzes its wings in panic
    WINGS7[0].draw(F, angs, wts, dx=jx, dy=jy)
    WINGS7[1].draw(F, -angs, wts, dx=jx, dy=jy)
    if d < 0.6:
        for (x, y), (vx, vy) in DROPS7:
            drop(F, x + vx * d, y + vy * d + 1500 * d * d, 7, alpha=1 - d / 0.6)
    z = 1.22 - 0.1 * ease_out(ramp(t, SNAP, SNAP + 0.35))
    return F, cam(575, 1010, z, t, 7, shake(t, SNAP, 18, 0.55))


def s8(t):
    F = CLEAN8.copy()
    t0 = START[8]
    dy = keys(t, [(t0, 22.0), (t0 + 0.3, -9.0, 'o'), (t0 + 0.9, 0.0)]) + 2.5 * np.sin(2 * np.pi * 1.3 * (t - t0))
    a = 2.6 * np.sin(2 * np.pi * 2.1 * (t - t0)) * np.exp(-(t - t0) / 1.3)
    sq = 0.05 * np.exp(-(t - t0) / 0.18) * np.cos(2 * np.pi * 5 * (t - t0))
    sway(F, (720, 1280, PW, PH), t, 3.0, 9999, 1, freq=0.32, k=0.01)
    sway(F, (0, 950, 260, 1460), t, 3.0, 1460, 500, freq=0.3, k=0.01)
    sway(F, (0, 0, PW, 1000), t, 3.0, 1000, 900, freq=0.24, k=0.004, power=2.0)
    rot_warp(F, (760, 1560), 4.0 * np.exp(-(t - t0) / 0.5) * np.sin(2 * np.pi * 5 * (t - t0)), 230, 300)
    CHAR8.draw(F, dy=dy, ang=a, sx=1 - sq, sy=1 + sq, pivot=(450, 920))
    cx, cy, z = move(t, t0, nxt(8) + 0.15, (470, 985, 1.07), (500, 960, 1.15))
    return F, cam(cx, cy, z, t, 8, shake(t, SNAP, 13, 1.1))


def count_pose(t):
    """He counts the traps: for each one the hand lifts a little (anticipation), snaps down onto it,
    holds a beat and eases back; it drifts toward the next trap and the head follows a moment later."""
    ang, nod = 0.0, 0.0
    for tb in COUNT9:
        u = t - tb
        if -0.12 <= u < 0.0:
            ang += 5.0 * ease((u + 0.12) / 0.12)
        elif 0.0 <= u < 0.07:
            ang += 5.0 - 21.0 * ease_out(u / 0.07)
        elif 0.07 <= u < 0.16:
            ang -= 16.0
        elif 0.16 <= u < 0.4:
            ang -= 16.0 * (1 - ease((u - 0.16) / 0.24))
        du = u - 0.05
        if 0 <= du < 0.7:
            nod += (du / 0.12) * np.exp(1 - du / 0.12)
    dx = keys(t, [(COUNT9[0] - 0.2, 0.0)] + [(tb + 0.12, x, 'o') for tb, x in zip(COUNT9, (2.0, -6.0, -10.0, 0.0, -9.0))])
    return ang, dx, nod


def s9(t):
    F = CLEAN9.copy()
    ang, dx, nod = count_pose(t)
    k = sum(1 for tb in COUNT9 if t >= tb - 0.02) - 1
    lx, ly = (-2.5, 1.5) if k >= 0 else (0.0, 0.0)
    for e in E9:
        e.blink(F, blink(t, [START[9] + 2.05]), dx=lx * (1.2 if k in (1, 2, 4) else 0.6), dy=ly)
    head_tilt(F, 9, -1.4 * nod)
    HAND9.draw(F, dx=dx, ang=ang, pivot=(585, 1240))
    CUFF9.draw(F, dx=dx * 0.5)
    for i, (tb, (x, y)) in enumerate(zip(COUNT9, TRAP9)):
        if t >= tb:
            glow(F, x, y + 44, 30, (1.0, 0.88, 0.4), 0.7 * hold(t, tb, 0.05, 0.12, 0.5))
            NUM9[i].draw(F, x, y - 10 * ease(ramp(t, tb, tb + 0.8)), scale=0.75 * back(ramp(t, tb, tb + 0.2), 2.2))
    ripple_warp(F, (560, 1810, 900, 1985), t, amp=1.8, k=0.09, speed=3.0)
    sway(F, (930, 780, PW, 1460), t, 4.0, 1460, 600, freq=0.3, k=0.006)
    sway(F, (0, 780, 250, 1520), t, 4.0, 1520, 700, freq=0.28, k=0.006, phase=1.1)
    sway(F, (0, 1700, PW, PH), t, 4.0, 2150, 450, freq=0.33, k=0.008, phase=0.5)
    sway(F, (150, 1280, 600, 1700), t, 2.2, 1700, 420, freq=0.4, k=0.01)
    bob(F, (530, 880, 980, 1520), 1.2 * np.sin(2 * np.pi * t / 2.8), 1520, 1000)
    cx, cy, z = move(t, START[9] - 0.15, nxt(9) + 0.15, (560, 1180, 1.06), (520, 1262, 1.22))
    return F, cam(cx, cy, z, t, 9)


def s10(t):
    F = F10.copy()
    q = sum(np.exp(-(t - tw) / 0.2) * np.sin(2 * np.pi * 7 * (t - tw)) for tw in WIGGLES if t >= tw)
    rot_warp(F, (590, 1030), 0.9 * q, 1, 2, scale=(1 + 0.012 * q, 1 - 0.012 * q), weight=TRAP10, box=(150, 350, 1050, 1800))
    shift_warp(F, (505, 1110), 4 * q, 2 * q, 35, 60)
    sway(F, (0, 1500, PW, PH), t, 2.5, 9999, 1, freq=0.3, k=0.012)
    sway(F, (0, 200, 230, 1500), t, 4.0, 1600, 1300, freq=0.28, k=0.005)
    sway(F, (940, 200, PW, 1500), t, 4.0, 1600, 1300, freq=0.3, k=0.005, phase=1.4)
    sparkle(F, SPARK10, t, size=14, k=0.8, seed=10)
    td = at('digestive')
    for i, (x, y) in enumerate(JUICE10):
        g = back(ramp(t, td + i * 0.13, td + i * 0.13 + 0.35))
        if g > 0:
            drop(F, x, y + 14 * ramp(t, td + i * 0.13 + 0.5, td + i * 0.13 + 2.5), 10.5 * g, sx=0.9, sy=1.1)
    if t < PUNCH10:
        cx, cy, z = move(t, START[10] - 0.15, PUNCH10, (590, 1040, 1.03), (590, 1040, 1.12))
    else:
        cx, cy, z = move(t, PUNCH10, nxt(10) + 0.15, (606, 1090, 1.5), (606, 1080, 1.58))
    return F, cam(cx, cy, z, t, 10)


def s11(t):
    F = F11.copy()
    for e in E11:
        e.blink(F, blink(t, [START[11] + 2.2]))
    bob(F, (300, 480, 900, 1450), 1.3 * np.sin(2 * np.pi * t / 3.0), 1450, 800)
    sway(F, (0, 1050, PW, PH), t, 2.6, 9999, 1, freq=0.3, k=0.01, weight=VEG11)
    RAIN11.draw(F, t)
    ripple_rings(F, PUDDLE11, t, period=0.85, rmax=26, k=0.5, seed=11)
    for i, (x, y) in enumerate(TIPS11):
        ph = ((t - START[11]) + i * 0.29) % 0.8
        if ph < 0.5:
            u = ph / 0.5
            drop(F, x, y + 6 + 950 * u * u, 5.0, sx=0.85, sy=1.2, alpha=1 - u ** 3)
        else:
            drop(F, x, y + 4, 4.0 * ramp(ph, 0.5, 0.8))
    cx, cy, z = move(t, START[11] - 0.15, nxt(11) + 0.15, (560, 1000, 1.05), (540, 905, 1.16))
    return F, cam(cx, cy, z, t, 11)


def s12(t):
    F = F12.copy()
    MOUTH[12].draw(F, MPAR[12][fidx(t)])
    lift = -5 * ease(ramp(t, START[12], START[12] + 0.6))
    for b in B12:
        b.draw(F, dy=lift)
    head_tilt(F, 12, talk_tilt(t, 12, 0.8))
    bob(F, (440, 640, 940, 1900), 1.4 * np.sin(2 * np.pi * t / 3.0), 1900, 900)
    sway(F, (220, 1010, 560, 1300), t, 3.0, 1300, 280, freq=0.5, k=0.012)
    sway(F, (790, 280, 1140, 680), t, 4.0, 300, 380, freq=0.24, hang=True)
    sway(F, (110, 560, 370, 790), t, 3.0, 580, 200, freq=0.27, phase=1.0, hang=True)
    MOTES12.draw(F, t, 0.9)
    cx, cy, z = move(t, START[12] - 0.17, nxt(12), (520, 1080, 1.1), (500, 1048, 1.17))
    return F, cam(cx, cy, z, t, 12)


def s13(t):
    F = F13.copy()
    MOUTH[13].draw(F, MPAR[13][fidx(t)])
    for e in E13:
        e.blink(F, blink(t, [START[13] + 1.05]))
    head_tilt(F, 13, talk_tilt(t, 13, 1.1))
    p = back(ramp(t, START[13], START[13] + 0.22)) * (1 - ramp(t, START[13] + 0.35, START[13] + 0.6)) + pulse(t, at('count', 2) - 0.02, 0.28)
    rot_warp(F, (690, 1150), 0.0, 72, 115, scale=(1 + 0.08 * p, 1 + 0.08 * p))
    shift_warp(F, (690, 1150), 0, -7 * p, 80, 120)
    bob(F, (380, 560, 860, 1960), 1.4 * np.sin(2 * np.pi * t / 3.0) + 0.6 * clamp01(env(t)), 1960, 900)
    sway(F, (0, 80, 370, 590), t, 4.0, 100, 480, freq=0.24, hang=True)
    sway(F, (810, 130, 1140, 500), t, 4.0, 150, 350, freq=0.26, phase=1.2, hang=True)
    sway(F, (300, 920, 590, 1130), t, 3.0, 1130, 200, freq=0.5, k=0.012)
    MOTES13.draw(F, t, 0.9)
    z = 1.2 - 0.08 * ease_out(ramp(t, START[13], START[13] + 0.5))
    return F, cam(600, 975, z, t, 13)


def s14(t):
    F = F14.copy()
    MOUTH[14].draw(F, MPAR[14][fidx(t)])
    w = 0.0
    for tb in (at('honest'), at('one', 2)):
        w += pulse(t, tb - 0.04, 0.2) + pulse(t, tb + 0.2, 0.2)
    for b in B14:
        b.draw(F, dy=-9 * w)
    for e in E14:
        e.blink(F, blink(t, [at('tell') - 0.3, at('because') + 0.4]))
    head_tilt(F, 14, talk_tilt(t, 14, 1.0))
    tq = at('finger')
    qd = t - tq
    q = np.exp(-qd / 0.13) * np.cos(2 * np.pi * 5.0 * qd) if qd >= 0 else 0.0
    rot_warp(F, (345, 995), -4.0 * q, 140, 205, scale=(1 + 0.06 * q, 1 - 0.07 * q))
    jab = sum(pulse(t, tj - 0.03, 0.26) for tj in (at('you', 2), at('one', 2), at('comments')))
    rot_warp(F, (805, 1330), 0.0, 150, 215, scale=(1 + 0.07 * jab, 1 + 0.07 * jab))
    bob(F, (180, 470, 1000, PH), 1.6 * np.sin(2 * np.pi * t / 3.0), PH, 900)
    MOTES14.draw(F, t, 0.9)
    if t < PUNCH14:
        cx, cy, z = move(t, START[14], PUNCH14, (610, 950, 1.04), (610, 945, 1.12))
    else:
        cx, cy, z = move(t, PUNCH14, nxt(14) + 0.15, (650, 905, 1.36), (650, 895, 1.44))
    return F, cam(cx, cy, z, t, 14)


def s15(t):
    F = CLEAN15.copy()
    for e in E15:
        e.blink(F, blink(t, [START[15] + 1.7, START[15] + 3.9]))
    sway(F, (280, 1140, 680, 1620), t, 4.5, 1600, 460, freq=0.45, k=0.012)
    bob(F, (440, 680, 1000, 1880), 1.3 * np.sin(2 * np.pi * t / 3.1), 1880, 800)
    dx, dy = bee_offset(t)
    ang = 6 * np.sin(2 * np.pi * 0.55 * (t - START[15]) + 1.2)
    bx, by = BEE15.c
    rx, ry = WINGS15.root
    a = np.deg2rad(ang)
    wx = bx + np.cos(a) * (rx - bx) - np.sin(a) * (ry - by) + dx - rx       # the wings stay on the turning body
    wy = by + np.sin(a) * (rx - bx) + np.cos(a) * (ry - by) + dy - ry
    BEE15.draw(F, dx=dx, dy=dy + 1.2 * np.sin(2 * np.pi * 9 * t), ang=ang)
    angs, wts = buzz(fidx(t), -30, 22, spread=20, n=7)
    WINGS15.draw(F, angs + ang, wts, dx=wx, dy=wy)
    MOTES15.draw(F, t, 0.9)
    cx, cy, z = move(t, START[15] - 0.15, END, (560, 1150, 1.05), (520, 1120, 1.14))
    return F, cam(cx, cy, z, t, 15)


SHOT = {1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7, 8: s8, 9: s9, 10: s10, 11: s11, 12: s12, 13: s13, 14: s14, 15: s15}


# =============== captions and call-to-action graphics ===============
YELLOW, GREEN, RED = (255, 214, 72), (140, 226, 92), (255, 98, 80)


def build_captions():
    style = {}
    for w in WORDS:
        n = norm(w['w'])
        cta = w['s'] >= CTA
        if n in ('count', 'twenty', 'seconds', 'juice', 'comments', 'follow', 'hear') or (n == 'counting'):
            style[id(w)] = YELLOW
        if n == 'snap':
            style[id(w)] = 'big'
        if cta and n == 'yes':
            style[id(w)] = GREEN
        if cta and n == 'no':
            style[id(w)] = RED
    caps, i = [], 0
    while i < len(WORDS):
        w = WORDS[i]
        grp = [w]
        if i + 1 < len(WORDS):
            v = WORDS[i + 1]
            short = len(norm(w['w'])) + len(norm(v['w'])) <= 9
            if short and w['w'][-1].isalnum() and v['s'] - w['e'] < 0.25 and id(w) not in style and id(v) not in style:
                grp.append(v)
        caps.append({'text': ' '.join(g['w'] for g in grp).replace('...', ''), 's': grp[0]['s'] - 0.03, 'e': grp[-1]['e'], 'style': style.get(id(grp[0]))})
        i += len(grp)
    for a, b in zip(caps, caps[1:]):
        a['end'] = b['s'] if b['s'] - a['e'] < 0.6 else a['e'] + 0.25
    caps[-1]['end'] = caps[-1]['e'] + 0.6
    for c in caps:
        st = c['style']
        if st == 'big':
            c['spr'] = TextSprite(c['text'].upper(), FONT, 170, fill=YELLOW, stroke_w=10, max_w=980)
        else:
            c['spr'] = TextSprite(c['text'], FONT, 96, fill=st if isinstance(st, tuple) else (255, 255, 255), stroke_w=8, max_w=960)
    return caps


CAPS = build_captions()
PILL = TextSprite.pill('+ FOLLOW', FONT, 70)
NEXT1 = TextSprite('NEXT:', FONT, 70, fill=(255, 214, 72), stroke_w=8)
NEXT2 = TextSprite('the plant that can HEAR', FONT, 84, fill=(255, 255, 255), stroke_w=8, max_w=980)


def overlays(O, t):
    for c in CAPS:
        if c['s'] <= t < c['end']:
            pop = 0.84 + 0.16 * back(ramp(t, c['s'], c['s'] + 0.1))
            if c['style'] == 'big':
                sx, sy = shake(t, SNAP, 10, 0.5, seed=3)
                c['spr'].draw(O, OUT_W / 2 + sx, 1180 + sy, scale=0.7 + 0.3 * back(ramp(t, c['s'], c['s'] + 0.14), 2.4), rot=-4)
            else:
                c['spr'].draw(O, OUT_W / 2, 1344, scale=pop)
            break
    tf = at('follow')
    if t >= tf - 0.05:
        p = back(ramp(t, tf - 0.05, tf + 0.2))
        press = 1 - 0.1 * pulse(t, tf + 0.55, 0.25)
        PILL.draw(O, OUT_W / 2, 300, scale=p * press)
    tn = at('next')
    if t >= tn - 0.1:
        NEXT1.draw(O, OUT_W / 2, 430, scale=back(ramp(t, tn - 0.1, tn + 0.15)))
        NEXT2.draw(O, OUT_W / 2, 520, scale=back(ramp(t, tn + 0.05, tn + 0.3)), rot=-2 + 0.8 * np.sin(2 * np.pi * 0.7 * t))
    k = 0.85 * (1 - ramp(t, SNAP, SNAP + 0.16)) ** 2 if t >= SNAP - 0.02 else 0.0
    if k > 0:
        O[:] = O + (1 - O) * k


# =============== frames ===============
def shot_frame(n, t):
    F, (cx, cy, z, rot) = SHOT[n](t)
    return camera(F, cx, cy, z, rot)


def frame(t):
    idx = max(i for i, c in enumerate(CUTS) if c[1] <= t)
    n, s, kind, d = CUTS[idx]
    O = None
    if kind == 'dis' and t < s + d / 2 and idx > 0:
        w = ease((t - (s - d / 2)) / d)
        O = shot_frame(CUTS[idx - 1][0], t) * (1 - w) + shot_frame(n, t) * w
    elif idx + 1 < len(CUTS) and CUTS[idx + 1][2] == 'dis' and t >= CUTS[idx + 1][1] - CUTS[idx + 1][3] / 2:
        n2, s2_, _, d2 = CUTS[idx + 1]
        w = ease((t - (s2_ - d2 / 2)) / d2)
        O = shot_frame(n, t) * (1 - w) + shot_frame(n2, t) * w
    else:
        O = shot_frame(n, t)
    overlays(O, t)
    return to_u8(O)


if __name__ == '__main__':
    out = sys.argv[1]
    if '--stills' in sys.argv:
        from PIL import Image
        for t in [float(x) for x in sys.argv[sys.argv.index('--stills') + 1].split(',')]:
            Image.fromarray(frame(t)).save(f'{out}_t{t:05.2f}.png')
        sys.exit(0)
    workers = int(sys.argv[sys.argv.index('--workers') + 1]) if '--workers' in sys.argv else 4
    n = int(END * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT_W}x{OUT_H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out], stdin=subprocess.PIPE)
    with Pool(workers) as pool:
        for i, fr in enumerate(pool.imap(frame, [i / FPS for i in range(n)], chunksize=2)):
            ff.stdin.write(fr.tobytes())
            if i % 60 == 0:
                print(f'frame {i}/{n}', flush=True)
    ff.stdin.close()
    ff.wait()
    print('wrote', out, f'({n} frames, {END:.2f}s)')
