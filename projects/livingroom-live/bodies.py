"""Cut the man's upper body and the cat's body out of plate.png (for breathing without moving the
background). Regions are the spaces between ink lines; each body is the set of regions that sit
inside a loose outline polygon and look like that character, plus the ink around them.
Writes bodies.npz (man, cat boolean masks)."""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

plate = np.asarray(Image.open('plate.png').convert('RGB')).astype(np.float32) / 255
lum = plate @ np.array([0.2126, 0.7152, 0.0722], np.float32)
H, W = lum.shape
walls = ndimage.binary_dilation(lum < 0.3, iterations=1)
lab, n = ndimage.label(~walls)
idx = np.arange(n + 1)
tot = np.bincount(lab.ravel(), minlength=n + 1)
mean = np.stack([ndimage.mean(plate[..., c], lab, idx) for c in range(3)], -1)


def poly_mask(pts):
    im = Image.new('L', (W, H), 0)
    ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.asarray(im) > 0


def body(poly, frac, want=None, seeds=()):
    inside = poly_mask(poly)
    ins = np.bincount(lab[inside], minlength=n + 1)
    keep = (ins >= frac * np.maximum(tot, 1)) & (tot >= 12)
    if want is not None:
        keep &= want
    for x, y in seeds:
        keep[lab[y, x]] = True
    keep[0] = False
    m = keep[lab] & inside
    m |= ndimage.binary_dilation(m, iterations=7) & walls & inside
    return ndimage.binary_fill_holes(m) & inside


MAN = [(722, 700), (1030, 700), (1062, 1000), (1072, 1302), (770, 1318), (745, 1272), (612, 1296), (452, 1296), (436, 1138), (604, 1132), (712, 1040)]
CAT = [(150, 1262), (425, 1262), (445, 1500), (370, 1792), (140, 1792), (96, 1712), (100, 1560)]
man = body(MAN, 0.9, seeds=[(900, 1150), (830, 1200), (1030, 1100), (990, 1060)])
orange = (mean[:, 0] - mean[:, 2] > 0.35) & (mean[:, 0] > 0.7)
cat = body(CAT, 0.8, want=orange)
np.savez_compressed('bodies.npz', man=man, cat=cat)
print('man px', int(man.sum()), 'cat px', int(cat.sum()))
if __name__ == '__main__':
    dbg = (plate * 255).astype(np.float32)
    dbg[man, 2] = dbg[man, 2] * 0.4 + 255 * 0.6
    dbg[cat, 0] = dbg[cat, 0] * 0.4 + 255 * 0.6
    S = '/tmp/claude-0/-home-user-Claude-video-making/bcd49906-3251-5003-81c5-2a7487297a28/scratchpad/live/'
    Image.fromarray(dbg.astype(np.uint8)).crop((60, 640, 1080, 1840)).resize((510, 600)).save(S + 'bodies.png')
