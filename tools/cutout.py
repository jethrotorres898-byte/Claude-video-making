"""Cut characters out of a character sheet: flood-fills the paper from the crop's edges
(outlines act as walls), upscales with Lanczos and sharpens. Writes RGBA PNGs.

Usage: python3 tools/cutout.py <out-dir> name=sheet.jpg:x0,y0,x1,y1[:keep|-][:x0,y0,x1,y1;...] ...
       (":keep" keeps the crop rectangular, for framed close-ups; then rectangles, in sheet
       coordinates, to erase (labels that sit too close to a drawing); then seed points for
       enclosed paper gaps such as the space between the legs)"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

UP = 3


def cut(img, box, keep=False, erase=(), seeds=()):
    crop = img.crop(box).convert('RGB')
    if erase:
        a0 = np.asarray(crop).copy()
        ring = a0[:3].reshape(-1, 3)
        for x0, y0, x1, y1 in erase:
            a0[max(0, y0 - box[1]):max(0, y1 - box[1]), max(0, x0 - box[0]):max(0, x1 - box[0])] = np.median(ring, axis=0)
        crop = Image.fromarray(a0)
    a = np.asarray(crop).astype(float)
    h, w = a.shape[:2]
    if not keep:
        ring = np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)])
        paper = np.median(ring, axis=0)
        dist = np.sqrt(((a - paper) ** 2).sum(axis=2))
        lum = a.mean(axis=2)
        wall = np.asarray(Image.fromarray(((lum < 150) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        ok = (dist < 26) & ~wall
        bg = np.zeros((h, w), bool)
        q = deque((y, x) for y in range(h) for x in (0, w - 1) if ok[y, x])
        q.extend((y, x) for x in range(w) for y in (0, h - 1) if ok[y, x])
        q.extend((sy - box[1], sx - box[0]) for sx, sy in seeds if ok[sy - box[1], sx - box[0]])
        for y, x in q:
            bg[y, x] = True
        while q:
            y, x = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and ok[ny, nx] and not bg[ny, nx]:
                    bg[ny, nx] = True
                    q.append((ny, nx))
        # pixels next to the paper that are still paper-coloured become transparent too (no cream halo)
        near = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
        bg |= near & (dist < 40)
        # drop small bits of neighbouring drawings that poke in at the crop's edges
        fg = ~bg
        seen = np.zeros((h, w), bool)
        total = fg.sum()
        for sy in range(h):
            for sx in range(w):
                if fg[sy, sx] and not seen[sy, sx]:
                    comp, edge, q = [], False, deque([(sy, sx)])
                    seen[sy, sx] = True
                    while q:
                        y, x = q.popleft(); comp.append((y, x))
                        edge |= y in (0, h - 1) or x in (0, w - 1)
                        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            ny, nx = y + dy, x + dx
                            if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True; q.append((ny, nx))
                    if edge and len(comp) < 0.02 * total:
                        for y, x in comp:
                            bg[y, x] = True
        alpha = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    else:
        alpha = Image.new('L', crop.size, 255)
    big = crop.resize((w * UP, h * UP), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=90, threshold=2))
    out = big.convert('RGBA')
    out.putalpha(alpha.resize((w * UP, h * UP), Image.LANCZOS))
    return out


if __name__ == '__main__':
    out_dir = sys.argv[1]
    cache = {}
    for spec in sys.argv[2:]:
        name, rest = spec.split('=', 1)
        parts = rest.split(':')
        sheet, box = parts[0], tuple(int(v) for v in parts[1].split(','))
        img = cache.setdefault(sheet, Image.open(sheet))
        erase = [tuple(int(v) for v in r.split(',')) for r in parts[3].split(';') if r] if len(parts) > 3 else []
        seeds = [tuple(int(v) for v in r.split(',')) for r in parts[4].split(';') if r] if len(parts) > 4 else []
        cut(img, box, keep=len(parts) > 2 and parts[2] == 'keep', erase=erase, seeds=seeds).save(f'{out_dir}/{name}.png')
        print(name, box)
