"""Flipbook animation of the creator's own frame: 30 frames a second, every frame is the original
picture (plate.png) with tiny changes made from its own pixels, so it looks exactly like the art.

Beats (9 s): he's on his phone -> he notices the cat (eyes dart, brows lift, head tilts) -> the cat
slow-blinks at him -> he slow-blinks back, smiling. Throughout: both breathe, the cat's tail sways
with a wave that travels to the tip, the curtain drifts, the camera slowly pushes in.

How each move is made:
- his face: the features (eyes, brows, mouth) are lifted off the head into an ink layer; the skin
  under them is filled from the surrounding skin. The layer is shifted per feature and rotated
  about the head's centre (a round head tilts without changing its outline). Blinks squash the
  eyes; the happy blink draws closed arcs in the same ink.
- the cat's eyes: lids made of fur painted from the fur around the eyes (prep.py) slide down to
  meet, with an ink lid line.
- the tail is cut out along its outline (prep.py) and bent over the rebuilt floor.
- breathing and the curtain are soft local warps that fade to zero at their edges.

Usage: python3 live.py out.mp4 [--stills 1.0,3.0] [--workers 4]   (needs parts.npz from prep.py)
"""
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

W, H, FPS, DUR = 1080, 1920, 30, 9.0
plate = np.asarray(Image.open('plate.png').convert('RGB')).astype(np.float32) / 255
parts = np.load('parts.npz')
CLEAN = parts['clean'].astype(np.float32) / 255
CLOSED = parts['closed'].astype(np.float32) / 255
TAIL_A = parts['tail_a'].astype(np.float32) / 255
_bodies = np.load('bodies.npz')
MAN_A = ndimage.gaussian_filter(_bodies['man'].astype(np.float32), 0.7)
CAT_A = ndimage.gaussian_filter((_bodies['cat'] & (TAIL_A < 0.5)).astype(np.float32), 0.7)
HCX, HCY, HR = [float(v) for v in parts['head']]
LUM = plate @ np.array([0.2126, 0.7152, 0.0722], np.float32)


# ---------------- timing helpers ----------------
def smooth(e0, e1, x):
    u = np.clip((x - e0) / (e1 - e0), 0, 1)
    return u * u * (3 - 2 * u)


def ease(u):
    u = min(1.0, max(0.0, u))
    return 0.5 - 0.5 * np.cos(np.pi * u)


def back(u, c=1.7):
    u = min(1.0, max(0.0, u))
    return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2


def pulse(t, t0, dur):
    return float(np.sin(np.pi * (t - t0) / dur)) if t0 <= t <= t0 + dur else 0.0


def hold(t, t0, up, keep, down):
    if t < t0:
        return 0.0
    if t < t0 + up:
        return ease((t - t0) / up)
    if t < t0 + up + keep:
        return 1.0
    return 1.0 - ease((t - t0 - up - keep) / down)


def blink(t, times):
    """Fast close (2 frames), slower open (4 frames)."""
    for b in times:
        d = t - b
        if 0 <= d < 0.067:
            return d / 0.067
        if 0.067 <= d < 0.2:
            return 1 - (d - 0.067) / 0.133
    return 0.0


T_NOTICE, T_CAT_SLOW, T_HIS_SLOW, T_FLICK = 2.5, 3.7, 5.45, 6.3


# ---------------- his face ----------------
bx0, by0 = int(HCX - HR - 4), int(HCY - HR - 4)
bx1, by1 = int(HCX + HR + 5), int(HCY + HR + 5)
hy, hx = np.mgrid[by0:by1, bx0:bx1].astype(np.float32)
DH = np.hypot(hx - HCX, hy - HCY)
interior = DH < HR - 7
head_rgb = plate[by0:by1, bx0:bx1].copy()
head_l = LUM[by0:by1, bx0:bx1]
feat = (head_l < 0.62) & interior
feat_d = ndimage.binary_dilation(feat, iterations=3) & interior
keep = (~feat_d).astype(np.float32)
SKIN = head_rgb.copy()
for _ in range(5):   # fill the skin under the features from the surrounding skin
    num = np.stack([ndimage.gaussian_filter(SKIN[..., c] * keep, 6) for c in range(3)], -1)
    den = ndimage.gaussian_filter(keep, 6)[..., None] + 1e-6
    SKIN = np.where(feat_d[..., None], num / den, head_rgb)
skin_l = SKIN @ np.array([0.2126, 0.7152, 0.0722], np.float32)
INK = np.median(head_rgb[(head_l < 0.3) & interior], axis=0)
ink_l = float(INK @ np.array([0.2126, 0.7152, 0.0722], np.float32))
FEAT_A = ndimage.gaussian_filter(np.clip((skin_l - head_l) / np.maximum(skin_l - ink_l, 0.2), 0, 1) * feat_d, 0.5)
GROUPS = {}
for name, (y0, y1) in {'brows': (0, 870), 'eyes': (870, 930), 'mouth': (930, 9999)}.items():
    a = FEAT_A.copy()
    a[(hy < y0) | (hy >= y1)] = 0
    GROUPS[name] = a
EYES = [(784.1, 897.8), (883.7, 896.3)]
FACE_EDGE = np.clip((HR - 6 - DH) / 2.0, 0, 1)


def squash_eyes(a, close):
    out = np.zeros_like(a)
    sq = max(0.12, 1 - close)
    for ex, ey in EYES:
        x0, x1 = int(ex - 18 - bx0), int(ex + 18 - bx0)
        y0, y1 = int(ey - 24 - by0), int(ey + 24 - by0)
        sub = a[y0:y1, x0:x1]
        z = ndimage.zoom(sub, (sq, 1), order=1)
        off = (sub.shape[0] - z.shape[0]) // 2
        out[y0 + off:y0 + off + z.shape[0], x0:x1] = np.maximum(out[y0 + off:y0 + off + z.shape[0], x0:x1], z)
    return out


def closed_arcs(happy):
    S = 4
    im = Image.new('L', ((bx1 - bx0) * S, (by1 - by0) * S), 0)
    d = ImageDraw.Draw(im)
    for ex, ey in EYES:
        cx, cy, w = (ex - bx0) * S, (ey - by0) * S, 13 * S
        if happy:   # ^ ^
            d.arc([cx - w, cy - 6 * S, cx + w, cy + 14 * S], 205, 335, fill=255, width=6 * S)
        else:       # relaxed closed lids
            d.arc([cx - w, cy - 12 * S, cx + w, cy + 6 * S], 25, 155, fill=255, width=6 * S)
    return np.asarray(im.resize((bx1 - bx0, by1 - by0), Image.LANCZOS)).astype(np.float32) / 255


ARC_HAPPY, ARC_CLOSED = closed_arcs(True), closed_arcs(False)


def face(t, F):
    n = back((t - T_NOTICE) / 0.1, 1.2) if t > T_NOTICE else 0.0      # eyes dart (3 frames, tiny overshoot)
    n2 = ease((t - T_NOTICE - 0.04) / 0.35)                             # the rest of the face follows
    brow = hold(t, T_NOTICE + 0.05, 0.16, 2.5, 0.6)
    tilt = -3.2 * back((t - T_NOTICE - 0.06) / 0.55) + -1.6 * ease((t - 6.6) / 1.2) if t > T_NOTICE else 0.0
    tilt += 0.5 * np.sin(t * 1.3)                                        # never perfectly still
    slow = hold(t, T_HIS_SLOW, 0.32, 0.5, 0.34)
    quick = blink(t, [0.95, 8.25])
    a = ndimage.shift(GROUPS['brows'], (2 * n2 - 6 * brow + 2 * slow, -7 * n2), order=1)
    a = a + ndimage.shift(GROUPS['mouth'], (1.5 * n2, -5 * n2), order=1)
    if slow > quick:
        e = ARC_HAPPY * smooth(0.45, 0.75, slow) + squash_eyes(GROUPS['eyes'], slow / 0.6) * smooth(0.6, 0.45, slow)
    elif quick > 0.6:
        e = ARC_CLOSED * smooth(0.6, 0.9, quick)
    else:
        e = squash_eyes(GROUPS['eyes'], quick) if quick > 0 else GROUPS['eyes']
    a = a + ndimage.shift(e, (2 * n, -9 * n), order=1)
    if abs(tilt) > 0.01:
        a = ndimage.rotate(a, tilt, reshape=False, order=1)
    a = np.clip(a, 0, 1) * FACE_EDGE
    reg = F[by0:by1, bx0:bx1]
    inside = FACE_EDGE[..., None]
    base = SKIN * inside + reg * (1 - inside)
    reg[:] = base * (1 - a[..., None]) + INK * a[..., None]


# ---------------- the cat's eyelids ----------------
CAT_EYES = [(234.0, 1430.0, 31.5, 34.5), (330.5, 1435.0, 31.0, 34.0)]
ring = np.zeros(LUM.shape, bool)
gy_all, gx_all = np.mgrid[1380:1480, 190:380]
for ex, ey, rx, ry in CAT_EYES:
    d = np.hypot((gx_all - ex) / rx, (gy_all - ey) / ry)
    ring[1380:1480, 190:380] |= (d > 0.9) & (d < 1.05) & (LUM[1380:1480, 190:380] < 0.3)
CAT_INK = np.median(plate[ring], axis=0)


def cat_eyes(t, F):
    c = max(blink(t, [1.75, 7.8]), hold(t, T_CAT_SLOW, 0.4, 0.35, 0.42))
    if c <= 0.01:
        return
    for ex, ey, rx, ry in CAT_EYES:
        x0, y0, x1, y1 = int(ex - rx * 1.3), int(ey - ry * 1.3), int(ex + rx * 1.3), int(ey + ry * 1.3)
        gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        nx = np.clip((gx - ex) / rx, -1, 1)
        d = np.hypot((gx - ex) / rx, (gy - ey) / ry)
        eye = smooth(1.24, 1.12, d)
        meet = ey + 0.2 * ry + 0.14 * ry * (1 - nx ** 2)                 # closed lids curve down in the middle
        yu = (ey - 1.08 * ry) + (meet - (ey - 1.08 * ry)) * c
        yl = (ey + 1.08 * ry) + (meet - (ey + 1.08 * ry)) * c
        lid = eye * np.maximum(smooth(yu + 1.2, yu - 1.2, gy), smooth(yl - 1.2, yl + 1.2, gy))
        reg = F[y0:y1, x0:x1]
        reg[:] = reg * (1 - lid[..., None]) + CLOSED[y0:y1, x0:x1] * lid[..., None]
        nxr = (gx - ex) / rx
        for ye, k in ((yu, 1.0), (yl, 0.75 if c < 0.98 else 0.0)):
            de = np.hypot(nxr, (ye - ey) / ry)
            line = np.exp(-((gy - ye) / 1.7) ** 2) * smooth(1.04, 0.92, de) * k * min(1.0, c * 4)
            reg[:] = reg * (1 - line[..., None]) + CAT_INK * line[..., None]


# ---------------- tail: cut-out bent over the rebuilt floor ----------------
TX0, TY0, TX1, TY1 = 0, 1550, 175, 1795
TPX, TPY = 126.0, 1740.0
tgy, tgx = np.mgrid[TY0:TY1, TX0:TX1].astype(np.float32)
TDIST = np.hypot(tgx - TPX, tgy - TPY)
TW = smooth(25, 180, TDIST)


def tail(t, F):
    wave = 4.2 * np.sin(2 * np.pi * t / 3.1 - 0.013 * TDIST)                       # slow sway, tip lags the base
    flick = 7.5 * np.sin(np.pi * np.clip((t - 0.0028 * TDIST - T_FLICK) / 0.65, 0, 1))   # one flick that travels to the tip
    ang = TW * (wave + flick)
    a = -np.deg2rad(ang)
    ca, sa = np.cos(a), np.sin(a)
    dx, dy = tgx - TPX, tgy - TPY
    sx, sy = TPX + dx * ca - dy * sa, TPY + dx * sa + dy * ca
    rgb = np.stack([ndimage.map_coordinates(plate[..., ch], [sy, sx], order=1, mode='nearest') for ch in range(3)], -1)
    al = ndimage.map_coordinates(TAIL_A, [sy, sx], order=1, mode='nearest')[..., None]   # the tail runs off the left edge
    reg = F[TY0:TY1, TX0:TX1]
    reg[:] = reg * (1 - al) + rgb * al


# ---------------- soft warps ----------------
def warp(F, box, fn):
    x0, y0, x1, y1 = box
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    sx, sy = fn(gx, gy)
    F[y0:y1, x0:x1] = np.stack([ndimage.map_coordinates(F[..., c], [sy, sx], order=1, mode='nearest') for c in range(3)], -1)


def curtain(F, t):
    def fn(gx, gy):
        amp = 3.0 * np.clip((gy - 110) / 1000, 0, 1) ** 1.3
        dx = amp * (0.8 * np.sin(t * 1.1 - gy * 0.004) + 0.35 * np.sin(t * 2.05 + 1.3 - gy * 0.007))
        w = smooth(522, 556, gx) * smooth(798, 770, gx) * smooth(1140, 1070, gy) * smooth(HR + 8, HR + 30, np.hypot(gx - HCX, gy - HCY))
        return gx - dx * w, gy
    warp(F, (515, 100, 805, 1145), fn)


def layer(F, S, A, box, dy_fn):
    """Composite body S (alpha A) over F, displaced vertically by dy_fn(gx, gy) inside box."""
    x0, y0, x1, y1 = box
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    sy = gy - dy_fn(gx, gy)
    rgb = np.stack([ndimage.map_coordinates(S[..., c], [sy, gx], order=1, mode='nearest') for c in range(3)], -1)
    al = ndimage.map_coordinates(A, [sy, gx], order=1, mode='constant')[..., None]
    reg = F[y0:y1, x0:x1]
    reg[:] = reg * (1 - al) + rgb * al


MAN_BOX, CAT_BOX = (430, 690, 1080, 1330), (90, 1250, 455, 1800)


def camera(img, t):
    u = ease(t / DUR)
    z = 1.0 + 0.07 * u
    cx = 562 - 12 * u + 5 * np.sin(t * 0.37)
    cy = 1140 - 18 * u + 3 * np.sin(t * 0.29 + 1)
    c = min(max(cx - W / 2 / z, 0), W - W / z)
    f = min(max(cy - H / 2 / z, 0), H - H / z)
    return img.transform((W, H), Image.AFFINE, (1 / z, 0, c, 0, 1 / z, f), resample=Image.BICUBIC)


def frame(t):
    S = plate.copy()                       # the characters, with this frame's face and eyes
    face(t, S)
    cat_eyes(t, S)
    F = CLEAN.copy()                       # the room, with the background rebuilt behind moving edges
    curtain(F, t)
    ac = 1.5 * np.sin(2 * np.pi * t / 2.6 + 1.0)       # cat breathes faster than the man
    layer(F, S, CAT_A, CAT_BOX, lambda gx, gy: -ac * smooth(1792, 1590, gy))
    tail(t, F)
    am = 1.8 * np.sin(2 * np.pi * t / 3.4)
    layer(F, S, MAN_A, MAN_BOX, lambda gx, gy: -am * smooth(1322, 1095, gy))
    img = Image.fromarray((np.clip(F, 0, 1) * 255 + 0.5).astype(np.uint8))
    return np.asarray(camera(img, t))


if __name__ == '__main__':
    out = sys.argv[1]
    workers = int(sys.argv[sys.argv.index('--workers') + 1]) if '--workers' in sys.argv else 4
    if '--stills' in sys.argv:
        for t in [float(x) for x in sys.argv[sys.argv.index('--stills') + 1].split(',')]:
            Image.fromarray(frame(t)).save(f'{out}_t{t:.2f}.png')
        sys.exit(0)
    n = int(DUR * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '15', '-preset', 'medium', out], stdin=subprocess.PIPE)
    with Pool(workers) as pool:
        for i, fr in enumerate(pool.imap(frame, [i / FPS for i in range(n)], chunksize=2)):
            ff.stdin.write(fr.tobytes())
            if i % 30 == 0:
                print(f'frame {i}/{n}', flush=True)
    ff.stdin.close()
    ff.wait()
    print('wrote', out, f'({n} frames)')
