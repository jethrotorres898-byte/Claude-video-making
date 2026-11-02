"""Living pictures: frame-by-frame animation of still illustrations, made from their own pixels.

Every frame starts from the original picture and applies small, time-varying changes: soft warps
(sway, breathing, rotations, squash), cut-out parts moved over a rebuilt background, blinks and
lip-sync on the faces, light and particles painted in picture space, then a camera move. Captions
and flashes are drawn on the output frame. Pictures are float32 RGB arrays in [0, 1].
Used by projects/flytrap-live/edit.py.
"""
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

OUT_W, OUT_H, FPS = 1080, 1920, 30
LUMW = np.array([0.2126, 0.7152, 0.0722], np.float32)


# ---------------- timing ----------------
def clamp01(u):
    return min(1.0, max(0.0, float(u)))


def ease(u):
    return 0.5 - 0.5 * np.cos(np.pi * clamp01(u))


def ease_out(u):
    return 1 - (1 - clamp01(u)) ** 3


def ease_in(u):
    return clamp01(u) ** 3


def back(u, c=1.7):
    u = clamp01(u)
    return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2


def ramp(t, a, b):
    return clamp01((t - a) / (b - a))


def pulse(t, t0, dur):
    return float(np.sin(np.pi * (t - t0) / dur)) if t0 <= t <= t0 + dur else 0.0


def hold(t, t0, up, keep, down):
    """0 -> 1 over `up`, stay for `keep`, back to 0 over `down` (eased)."""
    if t < t0:
        return 0.0
    if t < t0 + up:
        return ease((t - t0) / up)
    if t < t0 + up + keep:
        return 1.0
    return 1.0 - ease((t - t0 - up - keep) / down)


def blink(t, times, close=0.067, reopen=0.133):
    """Fast close (2 frames), slower open (4 frames)."""
    for b in times:
        d = t - b
        if 0 <= d < close:
            return d / close
        if close <= d < close + reopen:
            return 1 - (d - close) / reopen
    return 0.0


def ring(t, t0, freq=6.0, decay=0.25):
    """Damped oscillation that starts at t0 (0 before)."""
    if t < t0:
        return 0.0
    d = t - t0
    return float(np.exp(-d / decay) * np.sin(2 * np.pi * freq * d))


def keys(t, ks):
    """Piecewise interpolation: ks = [(time, value), ...] or (time, value, ease); value may be a tuple."""
    if t <= ks[0][0]:
        return ks[0][1]
    for i in range(1, len(ks)):
        t1, v1 = ks[i][0], ks[i][1]
        if t <= t1:
            t0, v0 = ks[i - 1][0], ks[i - 1][1]
            f = {'io': ease, 'o': ease_out, 'i': ease_in, 'lin': clamp01, 'back': back}[ks[i][2] if len(ks[i]) > 2 else 'io']
            u = f((t - t0) / max(1e-6, t1 - t0))
            if isinstance(v0, tuple):
                return tuple(a + (b - a) * u for a, b in zip(v0, v1))
            return v0 + (v1 - v0) * u
    return ks[-1][1]


def smoothstep(e0, e1, x):
    u = np.clip((x - e0) / (e1 - e0), 0, 1)
    return u * u * (3 - 2 * u)


def noise1(t, seed=0):
    """Smooth 1-D noise in [-1, 1] (sum of incommensurate sines)."""
    return float(np.sin(t * 1.7 + seed) * 0.5 + np.sin(t * 2.9 + seed * 1.3) * 0.3 + np.sin(t * 4.3 + seed * 2.1) * 0.2)


# ---------------- pictures and masks ----------------
def load(path, size=None):
    im = Image.open(path).convert('RGB')
    if size and im.size != size:
        im = im.resize(size, Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255


def to_u8(F):
    return (np.clip(F, 0, 1) * 255 + 0.5).astype(np.uint8)


def poly_mask(shape, pts):
    im = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=255)
    return np.asarray(im) > 0


def inpaint(F, hole, r=6):
    return cv2.inpaint(to_u8(F), hole.astype(np.uint8) * 255, r, cv2.INPAINT_TELEA).astype(np.float32) / 255


def region_mask(F, poly, frac=0.9, dark=0.36, grow=7):
    """Cut-out of an inked object: the spaces between ink lines that sit (almost) entirely inside a
    loose polygon around it, plus the ink around them, holes filled."""
    lum = F @ LUMW
    walls = ndimage.binary_dilation(lum < dark, iterations=1)
    lab, n = ndimage.label(~walls)
    inside = poly_mask(F.shape, poly)
    tot = np.bincount(lab.ravel(), minlength=n + 1)
    ins = np.bincount(lab[inside], minlength=n + 1)
    keep = (ins >= frac * np.maximum(tot, 1)) & (tot >= 6)
    keep[0] = False
    m = keep[lab] & inside
    m |= ndimage.binary_dilation(m, iterations=grow) & walls & inside
    return ndimage.binary_fill_holes(m) & inside


def grabcut_mask(F, poly, iters=6, band=6, core_frac=0.98):
    """Cut-out of a character inside a loose polygon: GrabCut seeded with 'definitely background'
    outside the polygon (+band), 'probably foreground' inside, and 'definitely foreground' for the
    ink-enclosed regions fully inside it. Keeps the largest piece, holes filled."""
    inside = poly_mask(F.shape, poly)
    core = ndimage.binary_erosion(region_mask(F, poly, frac=core_frac, grow=0), iterations=3)
    ys, xs = np.nonzero(ndimage.binary_dilation(inside, iterations=band + 20))
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    gc = np.full(F.shape[:2], cv2.GC_BGD, np.uint8)
    gc[ndimage.binary_dilation(inside, iterations=band)] = cv2.GC_PR_BGD
    gc[inside] = cv2.GC_PR_FGD
    gc[core] = cv2.GC_FGD
    sub = gc[y0:y1, x0:x1].copy()
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(to_u8(F[y0:y1, x0:x1]), cv2.COLOR_RGB2BGR), sub, None, bgd, fgd, iters, cv2.GC_INIT_WITH_MASK)
    m = np.zeros(F.shape[:2], bool)
    m[y0:y1, x0:x1] = (sub == cv2.GC_FGD) | (sub == cv2.GC_PR_FGD)
    lab, n = ndimage.label(m)
    if n > 1:
        m = lab == (1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1)))))
    return ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))


def contrast_mask(F, box, thr=0.09, blur=31, grow=2):
    """Small object on a smooth background: pixels that differ from a median-blurred copy."""
    x0, y0, x1, y1 = box
    P = to_u8(F[y0:y1, x0:x1])
    bg = cv2.medianBlur(P, blur).astype(np.float32) / 255
    d = np.abs(P.astype(np.float32) / 255 - bg).max(axis=2)
    m = d > thr
    lab, n = ndimage.label(m)
    if n:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))
    m = ndimage.binary_fill_holes(ndimage.binary_dilation(m, iterations=grow))
    full = np.zeros(F.shape[:2], bool)
    full[y0:y1, x0:x1] = m
    return full


def soft(mask, sigma=1.0):
    return ndimage.gaussian_filter(mask.astype(np.float32), sigma)


# ---------------- warps (in place, picture space) ----------------
def warp(F, box, fn):
    H, W = F.shape[:2]
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if x1 - x0 < 2 or y1 - y0 < 2:
        return
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    sx, sy = fn(gx, gy, (x0, y0, x1, y1))
    F[y0:y1, x0:x1] = cv2.remap(F, np.asarray(sx, np.float32), np.asarray(sy, np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def _weight(gx, gy, c, r0, r1, weight, b):
    if weight is not None:
        return weight[b[1]:b[3], b[0]:b[2]]
    return smoothstep(r1, r0, np.hypot(gx - c[0], gy - c[1]))


def rot_warp(F, pivot, ang, r0, r1, scale=(1.0, 1.0), weight=None, box=None):
    """Rotate (clockwise-positive, degrees) and scale about pivot; rigid within r0, fading out by r1
    (or weighted by a full-frame weight map)."""
    px, py = pivot
    sx_, sy_ = scale

    def fn(gx, gy, b):
        w = _weight(gx, gy, pivot, r0, r1, weight, b)
        a = np.deg2rad(ang) * w
        ca, sa = np.cos(a), np.sin(a)
        kx, ky = 1 + (sx_ - 1) * w, 1 + (sy_ - 1) * w
        dx, dy = gx - px, gy - py
        return px + (dx * ca + dy * sa) / kx, py + (-dx * sa + dy * ca) / ky
    warp(F, box or (px - r1, py - r1, px + r1, py + r1), fn)


def shift_warp(F, center, dx, dy, r0, r1, weight=None, box=None):
    cx, cy = center

    def fn(gx, gy, b):
        w = _weight(gx, gy, center, r0, r1, weight, b)
        return gx - dx * w, gy - dy * w
    warp(F, box or (cx - r1 - abs(dx), cy - r1 - abs(dy), cx + r1 + abs(dx), cy + r1 + abs(dy)), fn)


def sway(F, box, t, amp, ground, height, freq=0.32, k=0.007, phase=0.0, power=1.5, weight=None, hang=False):
    """Wind: horizontal waves that grow with height above `ground` (or below it for hanging plants),
    feathered at the box edges and optionally weighted by a full-frame map."""
    x0, y0, x1, y1 = box

    def fn(gx, gy, b):
        h = (gy - ground) if hang else (ground - gy)
        h = np.clip(h / height, 0, 1) ** power
        wave = np.sin(2 * np.pi * freq * t - k * gx + phase) + 0.4 * np.sin(2 * np.pi * freq * 2.37 * t - 1.9 * k * gx + 1.1 + phase)
        e = smoothstep(b[0], b[0] + 40, gx) * smoothstep(b[2], b[2] - 40, gx) * smoothstep(b[1], b[1] + 40, gy) * smoothstep(b[3], b[3] - 40, gy)
        if weight is not None:
            e = e * weight[b[1]:b[3], b[0]:b[2]]
        return gx - amp * h * wave * e, gy
    warp(F, box, fn)


def bob(F, box, dy, fixed_y, top_y, feather=50):
    """Breathing / bounce: vertical shift that is dy at top_y and above, 0 at fixed_y."""
    def fn(gx, gy, b):
        w = smoothstep(fixed_y, top_y, gy) * smoothstep(b[0], b[0] + feather, gx) * smoothstep(b[2], b[2] - feather, gx) * smoothstep(b[1], b[1] + feather, gy)
        return gx, gy - dy * w
    warp(F, box, fn)


def ripple_warp(F, box, t, amp=1.5, k=0.08, speed=3.0):
    """Water shimmer: small horizontal ripples."""
    def fn(gx, gy, b):
        e = smoothstep(b[0], b[0] + 30, gx) * smoothstep(b[2], b[2] - 30, gx) * smoothstep(b[1], b[1] + 20, gy) * smoothstep(b[3], b[3] - 20, gy)
        return gx + amp * np.sin(gy * k + t * speed) * e, gy
    warp(F, box, fn)


# ---------------- sprites ----------------
class Sprite:
    """A cut-out part of a picture (soft alpha) that can be moved, rotated and scaled."""

    def __init__(self, F, mask, pad=8, feather=0.8):
        H, W = mask.shape
        ys, xs = np.nonzero(mask)
        self.box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + pad + 1), min(H, ys.max() + pad + 1))
        x0, y0, x1, y1 = self.box
        self.a = soft(mask[y0:y1, x0:x1], feather)
        self.rgb = F[y0:y1, x0:x1].copy()
        self.pm = self.rgb * self.a[..., None]
        cy, cx = ndimage.center_of_mass(mask)
        self.c = (float(cx), float(cy))

    def draw(self, F, dx=0.0, dy=0.0, ang=0.0, sx=1.0, sy=1.0, pivot=None, opacity=1.0, margin=None):
        x0, y0, x1, y1 = self.box
        px, py = pivot if pivot is not None else self.c
        a = np.deg2rad(ang)
        A = np.array([[np.cos(a) * sx, -np.sin(a) * sy], [np.sin(a) * sx, np.cos(a) * sy]], np.float64)
        m = margin if margin is not None else int(max(x1 - x0, y1 - y0) * (abs(sx - 1) + abs(sy - 1) + abs(a)) + abs(dx) + abs(dy) + 6)
        H, W = F.shape[:2]
        X0, Y0, X1, Y1 = max(0, int(x0 - m)), max(0, int(y0 - m)), min(W, int(x1 + m)), min(H, int(y1 + m))
        o = np.array([x0, y0], np.float64)
        t = A @ (o - (px, py)) + (px, py) + (dx, dy) - (X0, Y0)
        M = np.hstack([A, t[:, None]])
        size = (X1 - X0, Y1 - Y0)
        pm = cv2.warpAffine(self.pm, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        al = cv2.warpAffine(self.a, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)[..., None] * opacity
        reg = F[Y0:Y1, X0:X1]
        reg[:] = reg * (1 - al) + pm * opacity


def fit_circle(F, c, r, band=12, below=0.8, dark=0.36):
    """Refine a circle (head outline) from a guess: least-squares fit to the ink pixels within
    `band` px of the guessed circle, ignoring the bottom part (where the neck joins)."""
    lum = F @ LUMW
    yy, xx = np.nonzero(lum < dark)
    cx, cy, R = float(c[0]), float(c[1]), float(r)
    for _ in range(4):
        d = np.hypot(xx - cx, yy - cy)
        sel = (np.abs(d - R) < band) & (yy < cy + below * R)
        if sel.sum() < 20:
            break
        X, Y = xx[sel].astype(np.float64), yy[sel].astype(np.float64)
        A = np.c_[2 * X, 2 * Y, np.ones_like(X)]
        sol = np.linalg.lstsq(A, X ** 2 + Y ** 2, rcond=None)[0]
        cx, cy = sol[0], sol[1]
        R = float(np.sqrt(sol[2] + cx * cx + cy * cy))
    return (cx, cy), R


class Wings:
    """Translucent insect wings split from what is behind them, so they can be redrawn moving.

    The picture becomes a background (wings removed, rebuilt by inpainting) plus a wing layer:
    membrane where the wing is lighter than the background, veins and outline where it is darker,
    each with the opacity that reproduces the original pixels exactly."""

    def __init__(self, F, mask, root, membrane=(0.94, 0.95, 0.96), keep_front=None, floor=0.0):
        H, W = mask.shape
        ys, xs = np.nonzero(mask)
        m = 6
        self.box = (max(0, xs.min() - m), max(0, ys.min() - m), min(W, xs.max() + m + 1), min(H, ys.max() + m + 1))
        x0, y0, x1, y1 = self.box
        hole = ndimage.binary_dilation(mask, iterations=2)
        self.bg = inpaint(F, hole, 9)
        O, B = F[y0:y1, x0:x1], self.bg[y0:y1, x0:x1]
        lo, lb = O @ LUMW, B @ LUMW
        mem = np.array(membrane, np.float32)
        ink = np.median(O[(lo < np.percentile(lo[mask[y0:y1, x0:x1]], 8)) & mask[y0:y1, x0:x1]], axis=0)
        lighter = lo >= lb
        a_mem = np.clip((lo - lb - 0.012) / np.maximum(float(mem @ LUMW) - lb, 0.05), 0, 1)   # small offset: paper grain is not wing
        a_ink = np.clip((lb - lo - 0.012) / np.maximum(lb - float(ink @ LUMW), 0.05), 0, 1)
        ms = soft(hole[y0:y1, x0:x1], 0.8) * soft(mask[y0:y1, x0:x1], 1.2)
        self.a = np.where(lighter, np.maximum(a_mem, floor), a_ink) * ms
        self.rgb = np.where(lighter[..., None], mem, ink).astype(np.float32)
        self.pm = self.rgb * self.a[..., None]
        self.root = root
        self.front = None
        if keep_front is not None:                       # things in front of the wings (e.g. trap spikes)
            fm = keep_front[y0:y1, x0:x1] & hole[y0:y1, x0:x1]
            self.front = (F[y0:y1, x0:x1].copy(), soft(fm, 0.7))
            self.bg[y0:y1, x0:x1] = np.where(fm[..., None], F[y0:y1, x0:x1], self.bg[y0:y1, x0:x1])

    def draw(self, F, angles, weights, dx=0.0, dy=0.0, scale=1.0):
        """Composite the wing at each angle (deg, clockwise) about the root, with those opacities."""
        x0, y0, x1, y1 = self.box
        rx, ry = self.root
        H, W = F.shape[:2]
        R = int(max(x1 - x0, y1 - y0) * 1.2 * scale + abs(dx) + abs(dy) + 8)
        X0, Y0, X1, Y1 = max(0, int(rx - R)), max(0, int(ry - R)), min(W, int(rx + R)), min(H, int(ry + R))
        acc_pm = np.zeros((Y1 - Y0, X1 - X0, 3), np.float32)
        acc_a = np.zeros((Y1 - Y0, X1 - X0), np.float32)
        for ang, w in zip(angles, weights):
            a = np.deg2rad(ang)
            A = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]]) * scale
            t = A @ (np.array([x0, y0], np.float64) - (rx, ry)) + (rx + dx, ry + dy) - (X0, Y0)
            M = np.hstack([A, t[:, None]])
            size = (X1 - X0, Y1 - Y0)
            pm = cv2.warpAffine(self.pm, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            al = cv2.warpAffine(self.a, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            acc_pm += pm * w
            acc_a += al * w
        acc_a = np.clip(acc_a, 0, 1)
        reg = F[Y0:Y1, X0:X1]
        reg[:] = reg * (1 - acc_a[..., None]) + np.clip(acc_pm, 0, 1)
        if self.front is not None:
            frgb, fa = self.front
            r2 = F[y0:y1, x0:x1]
            r2[:] = r2 * (1 - fa[..., None]) + frgb * fa[..., None]


def buzz(frame, up, down, spread=16.0, n=6, opacity=1.0):
    """Wing-beat angles for one frame: the wing is drawn as a motion-blur fan, alternating between
    the up and the down half of the stroke every frame (the classic cartoon buzz)."""
    c = up if frame % 2 == 0 else down
    angs = np.linspace(c - spread / 2, c + spread / 2, n)
    w = np.full(n, 0.9 / n * opacity)
    w[n // 2] += 0.35 * opacity
    return angs, w


# ---------------- faces ----------------
class Mark:
    """A dark mark on light skin (eye, brow, mouth): a clean skin patch plus a movable sprite."""

    def __init__(self, F, box, thr=0.16, grow=2, pink=True):
        x0, y0, x1, y1 = box
        self.box = box
        P = F[y0:y1, x0:x1].copy()
        lum = P @ LUMW
        skin = float(np.percentile(lum, 88))
        sat = P.max(axis=2) - P.min(axis=2)
        m = lum < skin - thr
        if pink:
            m |= (sat > 0.16) & (lum < skin - 0.06)
        lab, n = ndimage.label(m)
        if n:
            sizes = ndimage.sum(m, lab, range(1, n + 1))
            m = np.isin(lab, 1 + np.nonzero(sizes >= max(8, 0.08 * sizes.max()))[0])
        md = ndimage.binary_dilation(m, iterations=grow)
        self.clean = inpaint(P, md, 4)
        d = np.abs(P - self.clean).max(axis=2)
        depth = max(0.1, float(np.percentile(d[m], 90))) if m.any() else 0.3
        self.a = ndimage.gaussian_filter(np.clip(d / depth, 0, 1) * md, 0.4)
        self.rgb = P
        self.pm = P * self.a[..., None]
        ys, xs = np.nonzero(m)
        cy, cx = ndimage.center_of_mass(m)
        self.c = (x0 + float(cx), y0 + float(cy))
        self.top, self.bot = y0 + int(ys.min()), y0 + int(ys.max())
        self.left, self.right = x0 + int(xs.min()), x0 + int(xs.max())
        dark = m & (lum <= np.percentile(lum[m], 35))
        self.ink = np.median(P[dark], axis=0) if dark.any() else np.array([0.12, 0.1, 0.09], np.float32)

    def restore(self, F):
        x0, y0, x1, y1 = self.box
        F[y0:y1, x0:x1] = self.clean

    def draw(self, F, sx=1.0, sy=1.0, dx=0.0, dy=0.0, ang=0.0, anchor=None):
        x0, y0, x1, y1 = self.box
        F[y0:y1, x0:x1] = self.clean
        px, py = anchor if anchor is not None else self.c
        a = np.deg2rad(ang)
        A = np.array([[np.cos(a) * sx, -np.sin(a) * sy], [np.sin(a) * sx, np.cos(a) * sy]], np.float64)
        t = A @ (np.array([x0, y0], np.float64) - (px, py)) + (px, py) + (dx, dy) - (x0, y0)
        M = np.hstack([A, t[:, None]])
        size = (x1 - x0, y1 - y0)
        pm = cv2.warpAffine(self.pm, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        al = cv2.warpAffine(self.a, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)[..., None]
        reg = F[y0:y1, x0:x1]
        reg[:] = reg * (1 - al) + pm


class Eye(Mark):
    """Dot eye that blinks: squashes toward its centre, then becomes a closed-lid line."""

    def blink(self, F, c, dx=0.0, dy=0.0, happy=False):
        if c <= 0.01:
            if dx or dy:
                self.draw(F, dx=dx, dy=dy)
            return
        if c < 0.72:
            self.draw(F, sy=max(0.14, 1 - c * 1.15), dx=dx, dy=dy)
            return
        self.restore(F)
        x0, y0, x1, y1 = self.box
        S = 4
        im = Image.new('L', ((x1 - x0) * S, (y1 - y0) * S), 0)
        d = ImageDraw.Draw(im)
        w = (self.right - self.left + 2) * 0.62 * S
        h = max(6, (self.bot - self.top) * 0.35) * S
        cx, cy = (self.c[0] + dx - x0) * S, (self.c[1] + dy - y0) * S
        lw = max(2, round((self.right - self.left) * 0.22)) * S
        if happy:
            d.arc([cx - w, cy - h * 0.3, cx + w, cy + h * 1.7], 200, 340, fill=255, width=lw)
        else:
            d.arc([cx - w, cy - h * 1.5, cx + w, cy + h * 0.5], 20, 160, fill=255, width=lw)
        a = np.asarray(im.resize((x1 - x0, y1 - y0), Image.LANCZOS)).astype(np.float32)[..., None] / 255
        reg = F[y0:y1, x0:x1]
        reg[:] = reg * (1 - a) + self.ink * a


# ---------------- light and particles (picture space) ----------------
def screen(F, layer):
    """Screen-blend an additive light layer (HxWx3 or HxW) onto F."""
    if layer.ndim == 2:
        layer = layer[..., None]
    np.subtract(1, (1 - F) * (1 - np.clip(layer, 0, 1)), out=F)


def glow(F, x, y, r, color=(1.0, 0.93, 0.6), k=0.8):
    H, W = F.shape[:2]
    R = int(r * 3)
    x0, y0, x1, y1 = max(0, int(x - R)), max(0, int(y - R)), min(W, int(x + R)), min(H, int(y + R))
    if x1 <= x0 or y1 <= y0 or k <= 0.001:
        return
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    g = np.exp(-((gx - x) ** 2 + (gy - y) ** 2) / (2 * r * r)) * k
    reg = F[y0:y1, x0:x1]
    reg[:] = 1 - (1 - reg) * (1 - g[..., None] * np.array(color, np.float32))


class Rain:
    """Falling streaks in picture space, in two depths."""

    def __init__(self, W, H, n=170, angle=8, seed=1, length=(40, 90), speed=(1500, 2300), alpha=(0.18, 0.4), width=(1, 2)):
        r = np.random.default_rng(seed)
        self.W, self.H = W, H
        self.x = r.random(n) * (W + 300) - 150
        self.y = r.random(n) * H
        self.len = r.uniform(*length, n)
        self.sp = r.uniform(*speed, n)
        self.al = r.uniform(*alpha, n)
        self.w = r.integers(width[0], width[1] + 1, n)
        self.dx = np.tan(np.deg2rad(angle))

    def draw(self, F, t, color=(0.93, 0.96, 1.0), k=1.0):
        H, W = self.H, self.W
        S = 2
        m = np.zeros((H // S, W // S), np.uint8)
        for x, y0, ln, sp, al, w in zip(self.x, self.y, self.len, self.sp, self.al, self.w):
            y = (y0 + sp * t) % (H + ln) - ln
            xx = x + y * self.dx
            cv2.line(m, (int(xx / S), int(y / S)), (int((xx + ln * self.dx) / S), int((y + ln) / S)), int(255 * al * k), int(w), cv2.LINE_AA)
        a = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32)[..., None] / 255
        F[:] = F * (1 - a) + np.array(color, np.float32) * a


class Motes:
    """Dust drifting in sunlight."""

    def __init__(self, box, n=40, seed=3, size=(1.5, 4.0)):
        r = np.random.default_rng(seed)
        self.box = box
        self.p = r.random((n, 2))
        self.ph = r.random(n) * 6.283
        self.sp = r.uniform(8, 26, n)
        self.sz = r.uniform(*size, n)

    def draw(self, F, t, k=1.0):
        x0, y0, x1, y1 = self.box
        H, W = F.shape[:2]
        m = np.zeros((H, W), np.float32)
        for (u, v), ph, sp, sz in zip(self.p, self.ph, self.sp, self.sz):
            x = x0 + u * (x1 - x0) + np.sin(t * 0.5 + ph) * 26 + t * 6
            y = y0 + ((v * (y1 - y0) - t * sp) % (y1 - y0)) + np.sin(t * 0.8 + ph) * 10
            a = (0.35 + 0.45 * np.sin(t * 1.4 + ph) ** 2) * k
            cv2.circle(m, (int(x), int(y)), max(1, int(sz)), a, -1, cv2.LINE_AA)
        m = cv2.GaussianBlur(m, (0, 0), 1.6)
        screen(F, m[..., None] * np.array([1.0, 0.96, 0.82], np.float32))


def find_highlights(F, box, n=14, min_dist=40, thr=0.9):
    """Bright specular spots (dew-drop highlights) inside box, strongest first."""
    x0, y0, x1, y1 = box
    lum = F[y0:y1, x0:x1] @ LUMW
    local = ndimage.uniform_filter(lum, 25)
    score = (lum - local) * (lum > thr)
    pts = []
    s = score.copy()
    for _ in range(n):
        i = int(np.argmax(s))
        v = s.flat[i]
        if v <= 0.04:
            break
        yy, xx = divmod(i, s.shape[1])
        pts.append((x0 + xx, y0 + yy))
        s[max(0, yy - min_dist):yy + min_dist, max(0, xx - min_dist):xx + min_dist] = 0
    return pts


def sparkle(F, pts, t, size=16, k=0.9, seed=0):
    """Twinkling 4-point glints at the given points."""
    r = np.random.default_rng(seed)
    phases = r.random(len(pts)) * 6.283
    rates = r.uniform(1.6, 3.2, len(pts))
    H, W = F.shape[:2]
    for (x, y), ph, rate in zip(pts, phases, rates):
        s = max(0.0, np.sin(t * rate + ph)) ** 3
        if s < 0.05:
            continue
        L = size * (0.5 + s)
        R = int(L + 4)
        x0, y0, x1, y1 = max(0, x - R), max(0, y - R), min(W, x + R + 1), min(H, y + R + 1)
        m = np.zeros((y1 - y0, x1 - x0), np.float32)
        cx, cy = x - x0, y - y0
        cv2.line(m, (int(cx - L), cy), (int(cx + L), cy), 1.0, 1, cv2.LINE_AA)
        cv2.line(m, (cx, int(cy - L)), (cx, int(cy + L)), 1.0, 1, cv2.LINE_AA)
        m = cv2.GaussianBlur(m, (0, 0), 0.7) * 1.4
        cv2.circle(m, (cx, cy), 2, 1.0, -1, cv2.LINE_AA)
        m = np.maximum(m, cv2.GaussianBlur(m, (0, 0), 3) * 0.8)
        reg = F[y0:y1, x0:x1]
        reg[:] = 1 - (1 - reg) * (1 - np.clip(m * s * k, 0, 1)[..., None])


def drop(F, x, y, r, sx=1.0, sy=1.0, alpha=1.0):
    """A small clear water drop: pale body, darker rim at the bottom, bright highlight."""
    H, W = F.shape[:2]
    R = int(max(r * sx, r * sy) + 4)
    x0, y0, x1, y1 = max(0, int(x - R)), max(0, int(y - R)), min(W, int(x + R + 1)), min(H, int(y + R + 1))
    if x1 <= x0 or y1 <= y0:
        return
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    u, v = (gx - x) / (r * sx), (gy - y) / (r * sy)
    d = np.sqrt(u * u + v * v)
    body = smoothstep(1.05, 0.9, d) * alpha
    rim = np.exp(-((d - 0.92) / 0.09) ** 2) * smoothstep(-0.2, 0.6, v) * alpha
    hl = np.exp(-(((u + 0.35) ** 2 + (v + 0.4) ** 2) / 0.03)) * alpha
    reg = F[y0:y1, x0:x1]
    reg[:] = reg * (1 - body[..., None] * 0.35) + np.array([0.86, 0.93, 0.97], np.float32) * body[..., None] * 0.35
    reg[:] = reg * (1 - rim[..., None] * 0.55) + np.array([0.2, 0.25, 0.27], np.float32) * rim[..., None] * 0.55
    reg[:] = 1 - (1 - reg) * (1 - hl[..., None])


def ripple_rings(F, centers, t, period=0.9, rmax=26, k=0.5, seed=0, flat=0.35):
    """Expanding rain rings on water."""
    r = np.random.default_rng(seed)
    offs = r.random(len(centers)) * period
    H, W = F.shape[:2]
    m = np.zeros((H, W), np.float32)
    for (x, y), o in zip(centers, offs):
        ph = ((t + o) % period) / period
        rr = 3 + ph * rmax
        a = (1 - ph) * k
        cv2.ellipse(m, (int(x), int(y)), (int(rr), max(1, int(rr * flat))), 0, 0, 360, a, 1, cv2.LINE_AA)
    m = cv2.GaussianBlur(m, (0, 0), 0.8)
    screen(F, m[..., None] * np.array([0.9, 0.95, 1.0], np.float32))


# ---------------- camera ----------------
def camera(F, cx, cy, z, rot=0.0, out=(OUT_W, OUT_H)):
    """Output frame looking at picture point (cx, cy) with zoom z (1 = whole picture) and a small
    rotation in degrees; the view is kept inside the picture."""
    H, W = F.shape[:2]
    s = z * out[0] / W
    a = np.deg2rad(rot)
    hw = (out[0] / 2 * abs(np.cos(a)) + out[1] / 2 * abs(np.sin(a))) / s
    hh = (out[0] / 2 * abs(np.sin(a)) + out[1] / 2 * abs(np.cos(a))) / s
    cx = min(max(cx, hw), W - hw) if W > 2 * hw else W / 2
    cy = min(max(cy, hh), H - hh) if H > 2 * hh else H / 2
    M = np.array([[s * np.cos(a), -s * np.sin(a), 0], [s * np.sin(a), s * np.cos(a), 0]], np.float64)
    M[:, 2] = np.array([out[0] / 2, out[1] / 2]) - M[:, :2] @ np.array([cx, cy])
    return cv2.warpAffine(F, M, out, flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def shake(t, t0, amp=14.0, dur=0.5, freq=31.0, seed=0):
    """Camera shake offset (output px) that decays after t0."""
    if t < t0 or t > t0 + dur:
        return 0.0, 0.0
    d = (t - t0) / dur
    e = (1 - d) ** 2
    return (amp * e * np.sin((t - t0) * freq * 6.283 / 10 + seed), amp * 0.7 * e * np.cos((t - t0) * freq * 1.13 * 6.283 / 10 + seed * 2))


# ---------------- captions (output space) ----------------
class TextSprite:
    """Pre-rendered text with outline and soft shadow, premultiplied for fast compositing."""

    def __init__(self, text, font_path, size, fill=(255, 255, 255), stroke=(30, 22, 17), stroke_w=7, shadow=0.55, max_w=None, spacing=0):
        font = ImageFont.truetype(font_path, size)
        bb = font.getbbox(text, stroke_width=stroke_w)
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        if max_w and w > max_w:
            font = ImageFont.truetype(font_path, int(size * max_w / w))
            bb = font.getbbox(text, stroke_width=stroke_w)
            w, h = bb[2] - bb[0], bb[3] - bb[1]
        pad = 24
        im = Image.new('RGBA', (w + 2 * pad, h + 2 * pad + 10), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.text((pad - bb[0], pad - bb[1]), text, font=font, fill=fill + (255,), stroke_width=stroke_w, stroke_fill=stroke + (255,))
        a = np.asarray(im).astype(np.float32) / 255
        sh = Image.fromarray((a[..., 3] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))
        sh = np.roll(np.asarray(sh).astype(np.float32) / 255, 7, axis=0) * shadow
        alpha = a[..., 3] + sh * (1 - a[..., 3])
        rgb = a[..., :3] * a[..., 3:4]              # shadow is black
        self.pm = rgb
        self.a = alpha
        self.w, self.h = im.size

    @classmethod
    def pill(cls, text, font_path, size, bg=(229, 57, 53), fg=(255, 255, 255), pad=(44, 22), shadow=0.45):
        """A rounded button (e.g. '+ FOLLOW') with a soft shadow."""
        self = cls.__new__(cls)
        font = ImageFont.truetype(font_path, size)
        bb = font.getbbox(text)
        w, h = bb[2] - bb[0] + 2 * pad[0], bb[3] - bb[1] + 2 * pad[1]
        m = 24
        im = Image.new('RGBA', (w + 2 * m, h + 2 * m + 10), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((m, m, m + w, m + h), radius=h // 2, fill=bg + (255,))
        d.text((m + pad[0] - bb[0], m + pad[1] - bb[1]), text, font=font, fill=fg + (255,))
        a = np.asarray(im).astype(np.float32) / 255
        sh = Image.fromarray((a[..., 3] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))
        sh = np.roll(np.asarray(sh).astype(np.float32) / 255, 8, axis=0) * shadow
        self.a = a[..., 3] + sh * (1 - a[..., 3])
        self.pm = a[..., :3] * a[..., 3:4]
        self.w, self.h = im.size
        return self

    def draw(self, O, cx, cy, scale=1.0, opacity=1.0, rot=0.0):
        a = np.deg2rad(rot)
        A = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]]) * scale
        t = np.array([cx, cy]) - A @ np.array([self.w / 2, self.h / 2])
        M = np.hstack([A, t[:, None]])
        H, W = O.shape[:2]
        R = int(max(self.w, self.h) * scale / 2 + 4)
        x0, y0, x1, y1 = max(0, int(cx - R)), max(0, int(cy - R)), min(W, int(cx + R)), min(H, int(cy + R))
        if x1 <= x0 or y1 <= y0:
            return
        M[:, 2] -= (x0, y0)
        pm = cv2.warpAffine(self.pm, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        al = cv2.warpAffine(self.a, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)[..., None]
        reg = O[y0:y1, x0:x1]
        reg[:] = reg * (1 - al * opacity) + pm * opacity
