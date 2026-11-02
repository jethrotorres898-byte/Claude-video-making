"""Lip-sync for living pictures: words with timings -> phonemes (espeak) -> the standard 2D mouth
shapes -> per-frame mouth parameters -> a mouth drawn in the picture's own ink and colours.

The shape set is the classic Preston Blair / Hanna-Barbera chart, as used by Rhubarb Lip Sync:
  A  closed lips (M, B, P)                 B  slightly open, teeth together (most consonants, EE)
  C  open (EH, AE, AH)                      D  wide open (AA as in father)
  E  slightly rounded (AO as in off, ER)    F  puckered (OO, OW, W)
  G  upper teeth on lower lip (F, V)        H  open, tongue up behind the teeth (long L)
  X  rest (the character's own expression)
Animation rules: the mouth leads the sound by a frame, every shape is held at least 2 frames
(closures are never dropped), C is slipped in between closed and wide-open shapes and E between
open and puckered ones, and stressed or loud sounds open wider.
"""
import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

LUMW = np.array([0.2126, 0.7152, 0.0722], np.float32)

# ---------------- phonemes ----------------
_BE = None


def _backend():
    global _BE
    if _BE is None:
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        from phonemizer.backend import EspeakBackend
        _BE = EspeakBackend('en-us', with_stress=True, preserve_punctuation=False)
    return _BE


WEAK = {'a': 'ə', 'the': 'ð ə', 'to': 't ə', 'of': 'ə v', 'and': 'æ n d', 'for': 'f ɚ'}


def phonemes(words):
    """IPA phones per word (list of lists); stress marks stay on the vowels."""
    from phonemizer.separator import Separator
    clean = [''.join(ch for ch in w.lower() if ch.isalpha() or ch == "'") or 'uh' for w in words]
    out = _backend().phonemize(clean, separator=Separator(phone=' ', word='|', syllable=''), strip=True)
    return [WEAK.get(c, p).replace('|', ' ').split() for c, p in zip(clean, out)]


SHAPES = {
    'm': 'A', 'b': 'A', 'p': 'A', 'f': 'G', 'v': 'G', 'l': 'H', 'əl': 'CH', 'w': 'F',
    'uː': 'F', 'u': 'F', 'ʊ': 'F', 'oʊ': 'EF', 'oː': 'E', 'aʊ': 'DF', 'aɪ': 'DB', 'eɪ': 'CB', 'ɔɪ': 'EB',
    'ɑː': 'D', 'ɑ': 'D', 'a': 'D', 'æ': 'C', 'ʌ': 'C', 'ə': 'C', 'ɐ': 'C', 'ɛ': 'C', 'ɪ': 'B', 'ᵻ': 'B',
    'i': 'B', 'iː': 'B', 'ɔː': 'E', 'ɔ': 'E', 'ɚ': 'E', 'ɝ': 'E', 'ɜː': 'E', 'ɪɹ': 'BE', 'ɛɹ': 'CE',
    'ʊɹ': 'FE', 'ɑːɹ': 'DE', 'ɔːɹ': 'E', 'ɔɹ': 'E', 'aɪɚ': 'DBE', 'aʊɚ': 'DFE', 'ɹ': 'E', 'h': '*',
}
VOWEL_CH = set('aeiouæɑɐɒɔəɚɛɜɝɪʊʌᵻ')


def _info(ph):
    core = ph.lstrip('ˈˌ')
    vowel = any(ch in VOWEL_CH for ch in core)
    shape = SHAPES.get(core) or SHAPES.get(core.rstrip('ː̩')) or ('C' if vowel else 'B')
    if vowel:
        w = (1.35 if ph.startswith('ˈ') else 1.0) * (1.45 if len(shape) > 1 else 1.0)
    elif core in ('p', 'b', 't', 'd', 'k', 'ɡ', 'ʔ', 'ɾ'):
        w = 0.55
    elif core in ('tʃ', 'dʒ'):
        w = 0.85
    elif core in ('m', 'n', 'ŋ', 'n̩'):
        w = 0.65
    elif core in ('l', 'ɹ', 'w', 'j'):
        w = 0.6
    else:
        w = 0.75
    return shape, w, vowel, ph.startswith('ˈ')


def segments(words, energy=None, fps=30):
    """[(start, end, shape, stressed)] for the narration. Word ends are trimmed to where the voice
    actually goes quiet (energy is a per-frame envelope at fps), so pauses become rest."""
    phs = phonemes([w['w'] for w in words])
    segs = []
    for i, (w, ph) in enumerate(zip(words, phs)):
        s, e = w['s'], w['e']
        if i + 1 < len(words):
            e = min(e, words[i + 1]['s'])
        info = [_info(p) for p in ph]
        tot = sum(x[1] for x in info) or 1.0
        e = min(e, s + tot * 0.085 * 1.7)                        # no word lasts far beyond its sounds
        if energy is not None:
            f0, f1 = int(s * fps), int(e * fps)
            act = [f for f in range(f0, min(f1 + 1, len(energy))) if energy[f] > 0.06]
            if act:
                e = min(e, (act[-1] + 1) / fps + 0.02)
        t = s
        for shape, wt, vowel, stressed in info:
            d = (e - s) * wt / tot
            parts = list(shape)
            for k, sh in enumerate(parts):
                segs.append([t + d * k / len(parts), t + d * (k + 1) / len(parts), sh, stressed and vowel])
            t += d
    for i, sg in enumerate(segs):                                  # 'h' takes the following sound's shape
        if sg[2] == '*':
            nxt = next((x[2] for x in segs[i + 1:] if x[2] != '*'), 'B')
            sg[2] = nxt if nxt != 'A' else 'B'
    return [tuple(s) for s in segs]


def frame_track(segs, n_frames, fps=30, lead=1, rest_gap=0.14):
    """Shape per frame (on ones), with the timing rules applied."""
    track = ['X'] * n_frames
    stress = [False] * n_frames
    last_end = None
    for s, e, sh, st in segs:
        f0, f1 = int(round(s * fps)) - lead, int(round(e * fps)) - lead
        if last_end is not None and s - last_end < rest_gap:     # short gap: hold the previous shape
            g0 = int(round(last_end * fps)) - lead
            prev = track[max(0, g0 - 1)]
            for f in range(max(0, g0), max(0, f0)):
                track[f] = prev
        for f in range(max(0, f0), min(n_frames, max(f1, f0 + 1))):
            track[f] = sh
            stress[f] = stress[f] or st
        last_end = e
    runs = []
    for f, sh in enumerate(track):
        if runs and runs[-1][0] == sh:
            runs[-1][2] += 1
        else:
            runs.append([sh, f, 1])
    changed = True
    while changed:                                                # every shape lasts at least 2 frames
        changed = False
        for i, r in enumerate(runs):
            if r[2] >= 2 or len(runs) == 1:
                continue
            prv, nxt = (runs[i - 1] if i > 0 else None), (runs[i + 1] if i + 1 < len(runs) else None)
            if r[0] == 'A':                                       # closures steal a frame from a neighbour
                donor = max([x for x in (nxt, prv) if x is not None and x[2] >= 3], key=lambda x: x[2], default=None)
                if donor is not None:
                    donor[2] -= 1
                    r[2] += 1
                    if donor is nxt:
                        nxt[1] += 1
                    else:
                        r[1] -= 1
                    changed = True
                    break
            tgt = max([x for x in (prv, nxt) if x is not None], key=lambda x: x[2])
            tgt[2] += r[2]
            if tgt is nxt:
                nxt[1] = r[1]
            runs.pop(i)
            changed = True
            break
        merged = []
        for r in runs:
            if merged and merged[-1][0] == r[0]:
                merged[-1][2] += r[2]
            else:
                merged.append(r)
        runs = merged
    for i in range(1, len(runs)):                                  # in-betweens
        a, b = runs[i - 1][0], runs[i][0]
        if b == 'D' and a in 'ABX' and runs[i][2] >= 3:
            runs.insert(i, ['C', runs[i][1], 1])
            runs[i + 1][1] += 1
            runs[i + 1][2] -= 1
        elif b == 'F' and a in 'CD' and runs[i][2] >= 3:
            runs.insert(i, ['E', runs[i][1], 1])
            runs[i + 1][1] += 1
            runs[i + 1][2] -= 1
    out = ['X'] * n_frames
    for sh, f0, ln in runs:
        for f in range(f0, min(n_frames, f0 + ln)):
            out[f] = sh
    return out, stress


# ---------------- mouth parameters ----------------
# hw: half width, top: upper-lip lift, bot: lower-lip drop (units of the shot's mouth half width),
# tu / tl: upper / lower teeth (fraction of the opening), tongue, pucker 0..1, bite, tongue_up
P = {
    'A': dict(hw=0.80, top=0.00, bot=0.00, tu=0.0, tl=0.0, tongue=0.0, pucker=0.0, bite=0.0, up=0.0, press=1.0),
    'B': dict(hw=0.92, top=-0.05, bot=0.17, tu=0.55, tl=0.42, tongue=0.0, pucker=0.0, bite=0.0, up=0.0, press=0.0),
    'C': dict(hw=0.95, top=-0.09, bot=0.42, tu=0.25, tl=0.0, tongue=0.35, pucker=0.0, bite=0.0, up=0.0, press=0.0),
    'D': dict(hw=1.00, top=-0.13, bot=0.74, tu=0.20, tl=0.0, tongue=0.50, pucker=0.0, bite=0.0, up=0.0, press=0.0),
    'E': dict(hw=0.70, top=-0.11, bot=0.44, tu=0.12, tl=0.0, tongue=0.30, pucker=0.55, bite=0.0, up=0.0, press=0.0),
    'F': dict(hw=0.42, top=-0.11, bot=0.30, tu=0.0, tl=0.0, tongue=0.12, pucker=1.0, bite=0.0, up=0.0, press=0.0),
    'G': dict(hw=0.90, top=-0.05, bot=0.14, tu=0.75, tl=0.0, tongue=0.0, pucker=0.0, bite=1.0, up=0.0, press=0.0),
    'H': dict(hw=0.95, top=-0.10, bot=0.50, tu=0.22, tl=0.0, tongue=0.45, pucker=0.0, bite=0.0, up=1.0, press=0.0),
}
KEYS = ['hw', 'top', 'bot', 'tu', 'tl', 'tongue', 'pucker', 'bite', 'up', 'press']


def param_track(track, stress, energy, rest, open_scale=1.0):
    """Smoothed per-frame parameters: the mouth moves most of the way to each new shape in one
    frame (closures snap shut), louder and stressed sounds open wider."""
    out, cur = [], dict(rest)
    for f, sh in enumerate(track):
        tgt = dict(rest) if sh == 'X' else dict(P[sh])
        if sh != 'X':
            loud = float(energy[f]) if f < len(energy) else 0.0
            k = open_scale * (0.82 + 0.3 * min(1.2, loud)) * (1.12 if stress[f] else 1.0)
            tgt['top'] *= k
            tgt['bot'] *= k
        a = 0.88 if sh == 'A' else (0.45 if sh == 'X' else 0.62)
        cur = {kk: cur[kk] + (tgt[kk] - cur[kk]) * a for kk in KEYS}
        out.append(dict(cur))
    return out


# ---------------- mouth renderer ----------------
class MouthRig:
    """Draws the mouth shapes in a picture's style: the original mouth is lifted off the skin, and
    each frame a mouth is drawn with the same ink, inner colour, tongue and teeth.

    style: ink, inner, tongue, teeth (RGB 0..1), lw (ink width, px), smile (corner lift in half
    widths, negative = frown), tilt (deg), open (opening scale), teeth_bias (extra teeth, for grins)
    """

    def __init__(self, F, erase_box, center, hw0, style, thr=0.16):
        x0, y0, x1, y1 = erase_box
        P_ = F[y0:y1, x0:x1]
        lum = P_ @ LUMW
        skin = float(np.percentile(lum, 85))
        sat = P_.max(axis=2) - P_.min(axis=2)
        m = (lum < skin - thr) | ((sat > 0.12) & (lum < skin - 0.05))
        lab, n = ndimage.label(m)
        if n:
            sizes = ndimage.sum(m, lab, range(1, n + 1))
            m = np.isin(lab, 1 + np.nonzero(sizes >= max(10, 0.1 * sizes.max()))[0])
        m = ndimage.binary_dilation(m, iterations=3)
        self.mask = np.zeros(F.shape[:2], bool)
        self.mask[y0:y1, x0:x1] = m
        u8 = (np.clip(F, 0, 1) * 255 + 0.5).astype(np.uint8)
        self.clean = cv2.inpaint(u8, self.mask.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA).astype(np.float32) / 255
        self.c, self.hw0, self.st = center, hw0, style
        self.R = int(hw0 * 1.6 + 8)

    def contours(self, p):
        st, hw0 = self.st, self.hw0
        hw = p['hw'] * hw0
        sm = st.get('smile', 0.2) * hw0 * (1 - 0.8 * p['pucker'])
        op = st.get('open', 1.0)
        u = np.linspace(-1, 1, 41)
        ys = -sm * u ** 2
        pu, pl = 0.9 - 0.4 * p['pucker'], 0.55 - 0.05 * p['pucker']
        yu = ys + p['top'] * op * hw0 * (1 - u ** 2) ** pu
        yl = ys + p['bot'] * op * hw0 * (1 - u ** 2) ** pl
        return u * hw, yu, yl

    def render(self, p, ss=4):
        st, R = self.st, self.R
        x, yu, yl = self.contours(p)
        a = np.deg2rad(st.get('tilt', 0.0))
        ca, sa = np.cos(a), np.sin(a)

        def tf(xx, yy):
            return [((ca * xi - sa * yi + R) * ss, (sa * xi + ca * yi + R) * ss) for xi, yi in zip(xx, yy)]
        size = (2 * R * ss, 2 * R * ss)
        lw = st.get('lw', 4.5) * ss
        ink = tuple(int(c * 255) for c in st['ink'])
        opening = float(np.max(yl - yu))
        col = Image.new('RGBA', size, (0, 0, 0, 0))
        d = ImageDraw.Draw(col)
        if opening < 0.07 * self.hw0:                              # closed: one tapered ink stroke
            ym = (yu + yl) / 2
            w = lw * (1.15 + 0.25 * p['press'])
            n = len(x)
            prof = np.sin(np.linspace(0.08, np.pi - 0.08, n)) ** 0.6
            nx = np.gradient(ym)
            nrm = np.sqrt(1 + nx ** 2)
            top = tf(x - nx / nrm * 0, ym - prof * w / ss / 2 / nrm)
            bot = tf(x, ym + prof * w / ss / 2 / nrm)
            d.polygon(top + bot[::-1], fill=ink + (255,))
            r = w * 0.32
            for (px, py) in (top[0], top[-1]):
                d.ellipse((px - r, py - r + w * 0.15, px + r, py + r + w * 0.15), fill=ink + (255,))
        else:
            outline = tf(x, yu) + tf(x[::-1], yl[::-1])
            inner = Image.new('L', size, 0)
            ImageDraw.Draw(inner).polygon(outline, fill=255)
            layer = Image.new('RGBA', size, tuple(int(c * 255) for c in st['inner']) + (255,))
            ld = ImageDraw.Draw(layer)
            gap = yl - yu
            if p['tongue'] > 0.02:
                if p['up'] > 0.5:                                  # L: tongue tip raised behind the teeth
                    cy = yu[20] + gap[20] * 0.42
                    th = gap[20] * 0.34
                    ex = np.abs(x).max() * 0.4
                    ld.ellipse(_bbox(tf([-ex, ex], [cy - th, cy + th])), fill=tuple(int(c * 255) for c in st['tongue']) + (255,))
                else:
                    th = gap[20] * p['tongue'] * 0.85
                    cy = yl[20] - th * 0.55
                    ex = np.abs(x).max() * 0.62
                    ld.ellipse(_bbox(tf([-ex + 0.12 * ex, ex + 0.12 * ex], [cy - th, cy + th * 1.4])), fill=tuple(int(c * 255) for c in st['tongue']) + (255,))
            tu = min(0.9, p['tu'] + st.get('teeth_bias', 0.0))
            tl = min(0.9, p['tl'] + st.get('teeth_bias', 0.0) * 0.6)
            teeth = tuple(int(c * 255) for c in st['teeth']) + (255,)
            if tu > 0.03:
                ld.polygon(tf(x, yu - 2) + tf(x[::-1], (yu + gap * tu)[::-1]), fill=teeth)
            if tl > 0.03:
                ld.polygon(tf(x, yl - gap * tl) + tf(x[::-1], (yl + 2)[::-1]), fill=teeth)
            if p['bite'] > 0.5:                                    # F/V: lower lip tucked under the teeth
                ll = yu + gap * 0.82
                ld.line(tf(x * 0.85, ll * 1.0), fill=ink + (255,), width=int(lw * 0.8), joint='curve')
            if tu > 0.35 or tl > 0.35:                             # a couple of soft gaps between teeth
                for fx in (-0.45, 0.0, 0.45):
                    i = int((fx + 1) * 20)
                    ys0, ys1 = yu[i] + 1, yu[i] + gap[i] * max(tu, 0.2)
                    ld.line(tf([x[i], x[i] + 0.5], [ys0, ys1]), fill=tuple(int(c * 255 * 0.82) for c in st['teeth']) + (255,), width=max(1, int(ss * 1.2)))
            col.paste(layer, (0, 0), inner)
            d = ImageDraw.Draw(col)
            d.line(outline + outline[:1], fill=ink + (255,), width=int(lw), joint='curve')
            r = lw * 0.5
            for (px, py) in (outline[0], outline[len(outline) // 2 - 1]):
                d.ellipse((px - r, py - r, px + r, py + r), fill=ink + (255,))
        small = col.resize((2 * R, 2 * R), Image.LANCZOS)
        return np.asarray(small).astype(np.float32) / 255

    def draw(self, F, p, dx=0.0, dy=0.0):
        F[self.mask] = self.clean[self.mask]
        rgba = self.render(p)
        R = self.R
        cx, cy = self.c[0] + dx, self.c[1] + dy
        x0, y0 = int(round(cx)) - R, int(round(cy)) - R
        H, W = F.shape[:2]
        sx0, sy0 = max(0, -x0), max(0, -y0)
        x0c, y0c = max(0, x0), max(0, y0)
        x1c, y1c = min(W, x0 + 2 * R), min(H, y0 + 2 * R)
        if x1c <= x0c or y1c <= y0c:
            return
        src = rgba[sy0:sy0 + (y1c - y0c), sx0:sx0 + (x1c - x0c)]
        a = src[..., 3:4]
        reg = F[y0c:y1c, x0c:x1c]
        reg[:] = reg * (1 - a) + src[..., :3] * a


def _bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def sample_style(F, box, ink_thr=0.2):
    """Ink / inner / tongue colours of an open mouth drawn in the picture."""
    x0, y0, x1, y1 = box
    P_ = F[y0:y1, x0:x1].reshape(-1, 3)
    lum = P_ @ LUMW
    sat = P_.max(axis=1) - P_.min(axis=1)
    ink = np.median(P_[lum < np.percentile(lum, 6)], axis=0)
    inner = P_[(lum > ink_thr) & (lum < 0.42) & (sat < 0.2)]
    tongue = P_[(sat > 0.15) & (lum > 0.42) & (lum < 0.85)]
    return dict(ink=ink, inner=np.median(inner, axis=0) if len(inner) else np.array([0.29, 0.23, 0.22]),
                tongue=np.median(tongue, axis=0) if len(tongue) else np.array([0.84, 0.54, 0.47]))
