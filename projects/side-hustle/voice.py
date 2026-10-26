"""Voices for "The Side Hustle": deep trailer narrator (am_onyx) + the hero (am_puck).

Usage:
  python voice.py --kokoro kokoro-q8.onnx --voices voices.npz --whisper whisper-small/ --out .
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from voicekit import build  # noqa: E402

SPEAKERS = {'nar': ('am_onyx', 0.95), 'hero': ('am_puck', 1.05)}
# (scene, speaker, text, gap after)
SCRIPT = [
    ('job', 'nar', 'He had a part-time job that paid just enough to survive.', 0.45),
    ('job', 'hero', 'There has to be more than this.', 0.7),
    ('search', 'nar', 'So one night, he started searching for a side hustle.', 0.3),
    ('search', 'nar', 'Dropshipping. Freelancing. Reselling. Nothing clicked.', 0.5),
    ('search', 'nar', 'One hour later... he found something.', 0.55),
    ('found', 'nar', 'A trader named TJR. Winning. Again. And again.', 0.4),
    ('found', 'nar', 'He went straight to the channel, and watched every tutorial.', 0.3),
    ('grind', 'nar', 'Charts. Risk. Discipline. Night after night.', 0.9),
    ('later', 'nar', 'One year later.', 1.1),
    ('later', 'nar', "He doesn't work that shift anymore.", 0.4),
    ('later', 'nar', "He's a full-time trader.", 0.35),
    ('later', 'nar', 'Fifty thousand dollars. A month.', 0.8),
    ('rich', 'nar', 'Luxury cars. Designer brands. Expensive everything.', 0.5),
    ('rich', 'hero', 'Best search of my life.', 0.6),
    ('end', 'nar', 'So what are you searching for?', 1.6),
]

if __name__ == '__main__':
    build(SCRIPT, SPEAKERS)
