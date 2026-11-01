'use strict';
// Word cues for "A Venus flytrap can count". Every beat of the animation (anim.js) and of the
// soundtrack (sound.py, which loads this file with node) is tied to a word of the narration:
// window.WORDS comes from words.js, made by tools/align.py from voice.mp3.
(function () {
  const DURATION = 45;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const WL = (window.WORDS || []).map((w) => ({ n: norm(w.w), s: w.s, e: w.e }));
  const DEF = { // fallback timings (from the first recording) if a word is missing from words.js
    venus1: 1.06, count1: 3.04, no1: 4.2, joke1: 5.9, keeps1: 7.76, inside1: 9.36, trigger1: 11.08, something1: 12.66, one1: 13.78,
    raindrop1: 17.44, but1: 18.38, second1: 19.28, within1: 20.56, snap1: 22.8, trap2: 23.9, fraction1: 25.5, second2: 26.34,
    and2: 26.62, struggles1: 30.2, digestive1: 33.82, it4: 35.54, never1: 36.52, energy1: 37.32, alarm1: 38.2, plant3: 39.48,
    count2: 41.16, follow1: 42.36,
  };
  function at(word, nth = 1, edge = 's') {
    let k = 0;
    for (const w of WL) if (w.n === word && ++k === nth) return w[edge];
    return (DEF[`${word}${nth}`] ?? 0) + (edge === 'e' ? 0.35 : 0);
  }
  const C = {
    venus: at('venus'), count: at('count'), no: at('no'), joke: at('joke'), keeps: at('keeps'),
    inside: at('inside'), trigger: at('trigger'), something: at('something'), one: at('one'), raindrop: at('raindrop'),
    but: at('but'), second: at('second'), within: at('within'), snap: at('snap'), trap2: at('trap', 2), fraction: at('fraction'),
    struggles: at('struggles'), digestive: at('digestive'), it4: at('it', 4), never: at('never'), energy: at('energy'),
    alarm: at('alarm'), plant3: at('plant', 3), count2: at('count', 2), follow: at('follow'),
  };
  const CUT = [0, C.inside - 0.12, C.trap2 - 0.3, Math.max(at('second', 2, 'e') + 0.05, at('and', 2) - 0.1), C.it4 - 0.15, C.plant3 - 0.35, DURATION];
  const WIGGLES = [0, 1, 2, 3, 4].map((i) => C.struggles + i * Math.max(0.45, (C.digestive - C.struggles - 0.6) / 4));
  window.CUES = { DURATION, C, CUT, WIGGLES };
})();
