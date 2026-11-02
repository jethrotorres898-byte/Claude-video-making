"""Read burned-in word-by-word captions from a vertical video (720 px wide), frame by frame.
Usage: python3 caption_ocr.py video.mp4 out.json [y0 y1]
The caption band is masked to white text that sits against its black outline, cleaned to
text-sized marks near the centre, and read only once the caption has settled (same mask on
3 frames in a row). Output: [{"s": start, "e": end, "text": "...", "conf": mean confidence}]."""
import io, json, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

Y0, Y1 = 640, 1200
W, H, FPS = 720, Y1 - Y0, 30.0

def mask_of(a):
    """Solid caption letters: white shapes whose surrounding ring is mostly dark outline,
    grouped into the one text line that sits around the horizontal centre."""
    mn, mx = a.min(axis=2), a.max(axis=2)
    white, dark = mn >= 205, mx <= 95
    lab, n = ndimage.label(white)
    out = np.zeros(white.shape, bool)
    if n == 0:
        return out
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if not (7 <= h <= 80 and 2 <= w <= 150):
            continue
        y0, y1 = max(0, sl[0].start - 4), min(a.shape[0], sl[0].stop + 4)
        x0, x1 = max(0, sl[1].start - 4), min(a.shape[1], sl[1].stop + 4)
        comp = lab[y0:y1, x0:x1] == i
        ring = ndimage.binary_dilation(comp, iterations=3) & ~comp
        if ring.any() and dark[y0:y1, x0:x1][ring].mean() >= 0.5:
            comps.append((i, sl.start if False else sl[0].start, sl[0].stop, sl[1].start, sl[1].stop))
    if not comps:
        return out
    # group into text lines by vertical overlap
    comps.sort(key=lambda c: c[1])
    lines = []
    for c in comps:
        for L in lines:
            if c[1] < L['y1'] - 4 and c[2] > L['y0'] + 4:
                L['c'].append(c); L['y0'] = min(L['y0'], c[1]); L['y1'] = max(L['y1'], c[2]); break
        else:
            lines.append({'c': [c], 'y0': c[1], 'y1': c[2]})
    best, score = None, 0
    for L in lines:
        x0 = min(c[3] for c in L['c']); x1 = max(c[4] for c in L['c'])
        hgt = L['y1'] - L['y0']
        if abs((x0 + x1) / 2 - a.shape[1] / 2) > 80 or not (20 <= hgt <= 85):
            continue
        px = sum(np.count_nonzero(lab[c[1]:c[2], c[3]:c[4]] == c[0]) for c in L['c'])
        if px > score:
            best, score = L, px
    if best is None:
        return out
    for c in best['c']:
        out[c[1]:c[2], c[3]:c[4]] |= lab[c[1]:c[2], c[3]:c[4]] == c[0]
    return out


def ocr(m):
    ys, xs = np.nonzero(m)
    if len(xs) < 150:
        return '', 0
    sub = m[max(0, ys.min() - 14):ys.max() + 15, max(0, xs.min() - 14):xs.max() + 15]
    # widen word gaps (empty column runs of 9+ px) so tesseract keeps the spaces
    cols = sub.any(axis=0)
    pieces, run, x = [], 0, 0
    for x in range(sub.shape[1]):
        if not cols[x]:
            run += 1
            continue
        if run:
            gap = np.zeros((sub.shape[0], 34 if run >= 9 else run), bool)
            pieces.append(gap)
            run = 0
        pieces.append(sub[:, x:x + 1])
    pieces.append(np.zeros((sub.shape[0], 14), bool))
    sub = np.concatenate(pieces, axis=1)
    im = Image.fromarray(np.where(sub, 0, 255).astype(np.uint8))
    im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    b = io.BytesIO(); im.save(b, 'PNG')
    r = subprocess.run(['tesseract', '-', '-', '--psm', '7', '-l', 'eng', '-c',
                        "tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.,!?-$%: ", '-c', 'preserve_interword_spaces=1', 'tsv'],
                       input=b.getvalue(), capture_output=True)
    words, confs = [], []
    for line in r.stdout.decode('utf8', 'ignore').splitlines()[1:]:
        f = line.split('\t')
        if len(f) == 12 and f[11].strip() and float(f[10]) >= 0:
            words.append(f[11].strip()); confs.append(float(f[10]))
    return ' '.join(words), (sum(confs) / len(confs) if confs else 0)

def main():
    src, out = sys.argv[1], sys.argv[2]
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'crop={W}:{H}:0:{Y0}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    packed, info = [], []
    while True:
        buf = proc.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        m = mask_of(np.frombuffer(buf, np.uint8).reshape(H, W, 3))
        ys, xs = np.nonzero(m)
        n = len(xs)
        bb = (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())) if n >= 150 else None
        sig = None
        if bb:
            crop = Image.fromarray((m[bb[2]:bb[3] + 1, bb[0]:bb[1] + 1] * 255).astype(np.uint8)).resize((96, 20), Image.BILINEAR)
            sig = np.asarray(crop) > 100
        info.append((n, bb, sig))
        packed.append(np.packbits(m))
    # segment: a caption is a run of frames whose ink area and width stay close to its start
    segs, cur = [], None
    def iou(a, b):
        return np.count_nonzero(a & b) / max(1, np.count_nonzero(a | b))
    for i, (n, bb, sig) in enumerate(info):
        if bb is None:
            if cur: segs.append(cur); cur = None
            continue
        w = bb[1] - bb[0]
        if cur and abs(w - cur['w']) <= max(14, 0.12 * cur['w']) and iou(sig, cur['sig']) >= 0.55:
            cur['end'] = i
            cur['sig'], cur['w'] = sig, w      # follow slow drift / pop-in
        else:
            if cur: segs.append(cur)
            cur = {'start': i, 'end': i, 'n': n, 'w': w, 'sig': sig}
    if cur: segs.append(cur)
    caps = []
    for sg in segs:
        if sg['end'] - sg['start'] < 2:
            continue
        best = ('', 0)
        for f in sorted({sg['start'] + min(3, (sg['end'] - sg['start']) // 2), (sg['start'] + sg['end']) // 2}):
            m = np.unpackbits(packed[f])[:H * W].reshape(H, W).astype(bool)
            r = ocr(m)
            if r[0] and (not best[0] or r[1] > best[1]):
                best = r
        if not best[0]:
            continue
        bbs = [info[f][1] for f in range(sg['start'], sg['end'] + 1)]
        cy = [(b[2] + b[3]) / 2 + Y0 for b in bbs]
        cw = [b[1] - b[0] for b in bbs]
        caps.append({'s': round(sg['start'] / FPS, 3), 'e': round((sg['end'] + 1) / FPS, 3), 'text': best[0], 'conf': round(best[1], 1),
                     'y0': round(cy[0], 1), 'y1': round(cy[-1], 1), 'w0': cw[0], 'wmax': max(cw), 'w1': cw[-1]})
    # merge neighbours with identical text (a flicker split one caption)
    merged = []
    for c in caps:
        if merged and merged[-1]['text'] == c['text'] and c['s'] - merged[-1]['e'] < 0.1:
            merged[-1]['e'] = c['e']
        else:
            merged.append(c)
    json.dump(merged, open(out, 'w'), indent=0)
    print(f'{src}: {len(info)} frames, {len(merged)} captions')
    print(' '.join(c['text'] for c in merged))


if __name__ == '__main__':
    main()
