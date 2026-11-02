"""Per-frame look and motion stats for a video at its native 30 fps.
Usage: python3 frame_stats.py video.mp4 out.json
Records luma mean/contrast, shadow & highlight share, saturation, warm-vs-cool balance,
frame-to-frame motion, and detects hard cuts (histogram jump + pixel change)."""
import json, subprocess, sys
import numpy as np

src, out = sys.argv[1], sys.argv[2]
W, H = 180, 320
proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
rows, prev, prevh = [], None, None
cap = (slice(int(H * 0.64), int(H * 0.77)), slice(None))   # skip the caption band in motion/cut stats
while True:
    b = proc.stdout.read(W * H * 3)
    if len(b) < W * H * 3:
        break
    a = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32) / 255
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    m = np.ones_like(y, bool); m[cap] = False
    hist = np.histogram(y[m], bins=32, range=(0, 1))[0].astype(np.float32); hist /= hist.sum()
    motion = float(np.mean(np.abs(y[m] - prev[m]))) if prev is not None else 0.0
    hd = float(0.5 * np.abs(hist - prevh).sum()) if prevh is not None else 0.0
    rows.append({
        'luma': round(float(y[m].mean()), 4), 'contrast': round(float(y[m].std()), 4),
        'shadows': round(float((y[m] < 0.15).mean()), 4), 'highlights': round(float((y[m] > 0.85).mean()), 4),
        'sat': round(float(sat[m].mean()), 4), 'warm': round(float((a[..., 0] - a[..., 2])[m].mean()), 4),
        'motion': round(motion, 4), 'hist': round(hd, 4),
    })
    prev, prevh = y, hist
cuts = [i for i, r in enumerate(rows) if i > 0 and r['hist'] > 0.28 and r['motion'] > 0.06]
# merge cuts closer than 4 frames (flash frames / dissolves)
merged = []
for c in cuts:
    if not merged or c - merged[-1] > 4:
        merged.append(c)
json.dump({'fps': 30, 'frames': rows, 'cuts': merged}, open(out, 'w'))
shots = np.diff([0] + merged + [len(rows)]) / 30
print(f'{src}: {len(rows)} frames, {len(merged)} cuts, shots {len(shots)}, mean {shots.mean():.2f}s, median {np.median(shots):.2f}s')
