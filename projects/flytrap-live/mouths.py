"""Mouth rigs for the talking shots: where each mouth is, its size and expression, and its colours
(sampled from the picture). Used by edit.py with tools/lipsync.py."""
import numpy as np

TEETH = np.array([0.95, 0.93, 0.89], np.float32)
# shot: erase box (original mouth), centre, half width, style, rest (= the drawn expression)
CFG = {
    1: dict(erase=(595, 1170, 745, 1265), c=(667, 1219), hw=40, sample=(605, 1180, 735, 1260),
            style=dict(lw=5.0, smile=0.02, tilt=-12, open=1.25),
            rest=dict(hw=1.0, top=-0.20, bot=1.0, tu=0.0, tl=0.0, tongue=0.62, pucker=0.0, bite=0.0, up=0.0, press=0.0)),
    2: dict(erase=(548, 995, 660, 1040), c=(604, 1018), hw=40, sample=None,
            style=dict(lw=5.6, smile=-0.17, tilt=1, open=0.72),
            rest=dict(hw=1.0, top=0.0, bot=0.0, tu=0.0, tl=0.0, tongue=0.0, pucker=0.0, bite=0.0, up=0.0, press=0.4)),
    12: dict(erase=(562, 1012, 664, 1080), c=(611, 1047), hw=33, sample=(570, 1020, 655, 1075),
             style=dict(lw=4.8, smile=0.08, tilt=-17, open=1.1),
             rest=dict(hw=1.0, top=-0.16, bot=0.78, tu=0.0, tl=0.0, tongue=0.6, pucker=0.0, bite=0.0, up=0.0, press=0.0)),
    13: dict(erase=(522, 792, 650, 868), c=(586, 826), hw=48, sample=(530, 798, 642, 862),
             style=dict(lw=4.8, smile=0.14, tilt=-3, open=1.15),
             rest=dict(hw=1.0, top=-0.04, bot=0.8, tu=0.0, tl=0.0, tongue=0.78, pucker=0.0, bite=0.0, up=0.0, press=0.0)),
    14: dict(erase=(545, 862, 775, 990), c=(657, 926), hw=98, sample=None,
             style=dict(lw=4.6, smile=0.34, tilt=-10, open=0.9, teeth_bias=0.22),
             rest=dict(hw=1.0, top=-0.04, bot=0.36, tu=0.55, tl=0.42, tongue=0.0, pucker=0.0, bite=0.0, up=0.0, press=0.0)),
}
