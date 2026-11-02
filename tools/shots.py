"""Shot boundaries for a video: hard cuts and cross-dissolves.
Usage: python3 shots.py video.mp4 out.json
A hard cut is a one-frame jump far above the local frame-to-frame change; a dissolve is a
stretch where each frame is close to the average of the frames k before and k after, while
those two differ a lot."""
import json, subprocess, sys
import numpy as np

src, out = sys.argv[1], sys.argv[2]
w, h = 36, 64
proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={w}:{h}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
fr = []
while True:
    b = proc.stdout.read(w * h * 3)
    if len(b) < w * h * 3:
        break
    a = np.frombuffer(b, np.uint8).reshape(h, w, 3).astype(np.float32) / 255
    a = np.concatenate([a[:int(h * 0.64)], a[int(h * 0.77):]])   # drop the caption band
    fr.append(a)
F = np.stack(fr)
n = len(F)
d1 = np.r_[0, np.abs(F[1:] - F[:-1]).mean(axis=(1, 2, 3))]
cuts = []
for t in range(1, n):
    lo, hi = max(1, t - 15), min(n, t + 16)
    loc = np.median(np.r_[d1[lo:t], d1[t + 1:hi]])
    if d1[t] > 0.045 and d1[t] > 5 * max(loc, 0.004):
        cuts.append(t)
k = 7
diss = np.zeros(n)
for t in range(k, n - k):
    a, b, c = F[t - k], F[t], F[t + k]
    span = np.abs(c - a).mean()
    res = np.abs(b - (a + c) / 2).mean()
    if span > 0.06:
        diss[t] = span - 2.2 * res
peaks = []
for t in range(k, n - k):
    if diss[t] > 0.035 and diss[t] == diss[max(0, t - 8):t + 9].max() and all(abs(t - c) > 4 for c in cuts):
        peaks.append(t)
bounds = sorted([(c, 'cut') for c in cuts] + [(p, 'dissolve') for p in peaks])
json.dump({'n': n, 'bounds': bounds, 'd1': [round(float(x), 4) for x in d1], 'diss': [round(float(x), 4) for x in diss]}, open(out, 'w'))
pos = [0] + [b for b, _ in bounds] + [n]
lens = np.diff(pos) / 30
print(f'{src}: {n} frames | {len(cuts)} hard cuts, {len(peaks)} dissolves | {len(lens)} shots, mean {lens.mean():.2f}s, median {np.median(lens):.2f}s, min {lens.min():.2f}s, max {lens.max():.2f}s')
