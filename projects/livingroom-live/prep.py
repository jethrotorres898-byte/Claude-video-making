"""One-time prep for live.py (run bodies.py first): separates the cat's tail from the creator's
frame (plate.png), rebuilds the floor behind it and a thin band of background behind each body edge, paints closed-eye fur for the cat from the fur around its eyes,
and fits the man's head circle. Writes parts.npz."""
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

plate = np.asarray(Image.open('plate.png').convert('RGB'))
H, W = plate.shape[:2]
f = plate.astype(np.float32) / 255
lum = f @ np.array([0.2126, 0.7152, 0.0722], np.float32)
dark = lum < 0.36

# ---- head: fit a circle to the outline ----
cx, cy, r = 875.0, 860.0, 140.0
yy, xx = np.nonzero(dark)
for _ in range(3):
    d = np.hypot(xx - cx, yy - cy)
    sel = (np.abs(d - r) < 9) & (yy < cy + 128)          # skip the collar join
    X, Y = xx[sel].astype(np.float64), yy[sel].astype(np.float64)
    A = np.c_[2 * X, 2 * Y, np.ones_like(X)]
    sol, *_ = np.linalg.lstsq(A, X ** 2 + Y ** 2, rcond=None)
    cx, cy = sol[0], sol[1]
    r = np.sqrt(sol[2] + cx ** 2 + cy ** 2)
print(f'head circle: centre ({cx:.1f}, {cy:.1f}) r {r:.1f}')
gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
dh = np.hypot(gx - cx, gy - cy)
head_a = np.clip((r + 5.5 - dh) / 2.0, 0, 1)

# ---- tail: the orange regions inside a loose tail outline, plus their ink, holes filled ----
from PIL import ImageDraw
walls = ndimage.binary_dilation(dark, iterations=1)
lab, n = ndimage.label(~walls)
idx = np.arange(n + 1)
tot = np.bincount(lab.ravel(), minlength=n + 1)
mean = np.stack([ndimage.mean(f[..., c], lab, idx) for c in range(3)], -1)
TAIL_POLY = [(0, 1556), (78, 1556), (84, 1640), (90, 1692), (99, 1708), (158, 1776), (0, 1776)]
pm = Image.new('L', (W, H), 0)
ImageDraw.Draw(pm).polygon(TAIL_POLY, fill=255)
tail_poly = np.asarray(pm) > 0
ins = np.bincount(lab[tail_poly], minlength=n + 1)
keep = (ins >= 0.9 * np.maximum(tot, 1)) & (tot >= 6) & (mean[:, 0] - mean[:, 2] > 0.3) & (mean[:, 0] > 0.68)
keep[0] = False
tail_full = keep[lab] & tail_poly
tail_full |= ndimage.binary_dilation(tail_full, iterations=8) & walls & tail_poly
tail_full = ndimage.binary_fill_holes(tail_full) & tail_poly
print('tail px', int(tail_full.sum()))
tail_a = ndimage.gaussian_filter(tail_full.astype(np.float32), 0.7)
cut_img = Image.new('L', (W, H), 0)
ImageDraw.Draw(cut_img).line([(97, 1708), (156, 1772)], fill=255, width=4)
walls_cut = walls | (np.asarray(cut_img) > 0)

# ---- inpaint everything behind the moving parts ----
lab_b, _ = ndimage.label(~walls_cut)
body_in = lab_b == lab_b[1650, 180]
body = ndimage.binary_dilation(body_in, iterations=8) & (dark | body_in) | body_in
hole = ndimage.binary_dilation(tail_full, iterations=6) & ~(body & ~tail_full)
# a thin band inside each breathing body: what shows when a body edge moves a pixel or two
bodies = np.load('bodies.npz')
for m in (bodies['man'], bodies['cat']):
    hole |= m & ~ndimage.binary_erosion(m, iterations=5)
clean = cv2.inpaint(plate, hole.astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA)

# ---- cat closed-eye fur (eye discs inpainted from the fur around them) ----
CAT_EYES = [(234.0, 1430.0, 31.5, 34.5), (330.5, 1435.0, 31.0, 34.0)]   # centre, outer radii of the ring
eye_hole = np.zeros((H, W), bool)
for ex, ey, rx, ry in CAT_EYES:
    eye_hole |= np.hypot((gx - ex) / rx, (gy - ey) / ry) < 1.27
valid = (~eye_hole & (lum > 0.45)).astype(np.float32)
def nconv(sig):
    num = np.stack([ndimage.gaussian_filter(f[..., c] * valid, sig) for c in range(3)], -1)
    den = ndimage.gaussian_filter(valid, sig)[..., None]
    return num / np.maximum(den, 1e-6), den
coarse, _ = nconv(16)                     # smooth wash across the whole eye
fine, den = nconv(6)                      # keeps detail near the edge of the hole
w = np.clip(den / 0.35, 0, 1)
fill = np.where(eye_hole[..., None], fine * w + coarse * (1 - w), f)
closed = (np.clip(fill, 0, 1) * 255).astype(np.uint8)

# paper grain for inpainted areas: match the high-frequency texture of nearby fur / wall
def grain_std(box):
    x0, y0, x1, y1 = box
    p = f[y0:y1, x0:x1]
    hp = p - ndimage.gaussian_filter(p, (2, 2, 0))
    return float(hp.std())
g_fur, g_wall = 0.0145, 0.006   # measured high-pass std in the fur ring around the eyes / on the floor
print('grain std fur', round(g_fur, 4), 'wall', round(g_wall, 4))
rng = np.random.default_rng(3)
noise = ndimage.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 0.8)
noise /= noise.std()
def add_grain(img, mask, std):
    out = img.astype(np.float32) / 255 + (noise * std * 0.9)[..., None] * mask[..., None]
    return np.clip(out, 0, 1)
clean_f = add_grain(clean, hole.astype(np.float32), g_wall)
closed_f = add_grain(closed, eye_hole.astype(np.float32), g_fur)

np.savez_compressed('parts.npz', clean=(clean_f * 255).astype(np.uint8), closed=(closed_f * 255).astype(np.uint8),
                    head_a=(head_a * 255).astype(np.uint8), tail_a=(tail_a * 255).astype(np.uint8),
                    head=np.array([cx, cy, r], np.float32))

# debug overlay
dbg = plate.astype(np.float32).copy()
dbg[..., 0] = np.where(tail_a > 0.5, dbg[..., 0] * 0.4 + 255 * 0.6, dbg[..., 0])
dbg[..., 2] = np.where(head_a > 0.5, dbg[..., 2] * 0.5 + 255 * 0.5, dbg[..., 2])
S = '/tmp/claude-0/-home-user-Claude-video-making/bcd49906-3251-5003-81c5-2a7487297a28/scratchpad/live/'
Image.fromarray(dbg.astype(np.uint8)).crop((0, 650, 1080, 1850)).resize((540, 600)).save(S + 'masks.png')
Image.fromarray((clean_f * 255).astype(np.uint8)).crop((0, 650, 1080, 1850)).resize((540, 600)).save(S + 'clean.png')
