"""Builds the narration: the creator's main ElevenLabs take (voice_main.mp3) up to "...that can count.",
a natural pause, then the call-to-action take (voice_cta.mp3), level-matched. Writes voice.wav and
words.json (word timings for both takes on the joined timeline, from words_main.js / words_cta.js,
which tools/align.py made from the two takes).

Usage: python3 voice.py
"""
import json
import subprocess
import wave

import numpy as np

SR = 44100
PAUSE = 0.55          # silence between "count." and "So be honest"


def decode(path):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32).astype(np.float64)


def words(path):
    return json.loads(open(path).read().split('= ', 1)[1].split(';\n')[0])


def rms_frames(a, hop=441):
    n = len(a) // hop
    return np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)


main, cta = decode('voice_main.mp3'), decode('voice_cta.mp3')
wm, wc = words('words_main.js'), words('words_cta.js')
norm = lambda s: ''.join(ch for ch in s.lower() if ch.isalnum())
counts = [w for w in wm if norm(w['w']) == 'count']
follow = next(w for w in wm if norm(w['w']) == 'follow')
last = counts[-1]

r = rms_frames(main)
gate = 0.06 * np.percentile(r[r > 1e-3], 90)
i0, i1 = int(last['s'] * 100) + 10, int(follow['s'] * 100) - 3
seg = r[i0:i1]
speech_end = (i0 + int(np.nonzero(seg > gate)[0].max()) + 1) / 100 if (seg > gate).any() else last['e']
split = min(speech_end + 0.12, follow['s'] - 0.08)

rc = rms_frames(cta)
gate_c = 0.06 * np.percentile(rc[rc > 1e-3], 90)
lead = max(0.0, np.nonzero(rc > gate_c)[0].min() / 100 - 0.05)

# level-match the two takes on their speech frames
sp_m = r[: int(split * 100)][r[: int(split * 100)] > gate]
sp_c = rc[rc > gate_c]
gain = float(np.sqrt((sp_m ** 2).mean()) / np.sqrt((sp_c ** 2).mean()))

offset = speech_end + PAUSE - lead          # where the CTA take's t=0 lands on the joined timeline
a = main[: int(split * SR)]
gap = np.zeros(int((offset + lead - split) * SR))
fade = np.linspace(1, 0, int(0.03 * SR))
a[-len(fade):] *= fade
b = cta[int(lead * SR):] * gain
voice = np.concatenate([a, gap, b])

out = [dict(w) for w in wm if w['s'] < split] + [{'w': w['w'], 's': round(w['s'] + offset, 3), 'e': round(w['e'] + offset, 3)} for w in wc]
json.dump({'words': out, 'duration': round(len(voice) / SR, 3), 'cta_offset': round(offset, 3)}, open('words.json', 'w'), indent=0)
pcm = (np.clip(voice, -1, 1) * 32767).astype(np.int16)
with wave.open('voice.wav', 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print(f'split at {split:.2f}s (speech ends {speech_end:.2f}s), CTA lead {lead:.2f}s, gain {gain:.2f}, CTA offset {offset:.2f}s, total {len(voice) / SR:.2f}s')
