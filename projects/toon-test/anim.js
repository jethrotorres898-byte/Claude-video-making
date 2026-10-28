'use strict';
// Toon style motion test: Brodie walks in (side view), turns to camera, waves and barks;
// TJR answers with lip sync. Shows the new rig animating: walk cycle, view switch, wave,
// jaw, blink, ear swing, tail wag.

const TL = window.TL, VO = window.VOICE;
window.DURATION = TL.duration;
const G = 1070;
const BR = tkDogSkel(TOON_DOGS.brodie, {});
function tjrMouth(t) {
  for (const l of VO.lines) if (t >= l.s && t < l.e) return clamp((l.mouth[Math.floor((t - l.s) * VO.fps)] ?? 0) * 1.2);
  return 0;
}
function set(t) {
  let o = `<rect width="720" height="1280" fill="#bfe3f5"/>`;
  for (const [x, y, k] of [[140, 220, 1], [560, 160, 0.8]]) o += `<g transform="translate(${f1(x + Math.sin(t * 0.3 + x) * 8)} ${y}) scale(${k})">${tkOl(tkPath([[-70, 20], [-74, -4], [-46, -26], [-16, -40], [20, -36], [48, -20], [74, -2], [70, 20]]), '#ffffff')}</g>`;
  const bld = [[-20, 520, 200, '#e8a07a'], [190, 460, 180, '#9fc4a8'], [380, 540, 170, '#e9d18a'], [560, 480, 200, '#a8a4d8']];
  for (const [x, y, w, col] of bld) {
    o += tkOl(`M ${x} ${G - 60} L ${x} ${y} L ${x + w} ${y} L ${x + w} ${G - 60} Z`, col);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) o += tkOl(`M ${x + 22 + k * 52} ${y + 30 + r * 90} h 32 v 46 h -32 Z`, '#dff2fb', 2);
  }
  o += tkOl(`M -20 ${G - 60} L 740 ${G - 60} L 740 ${G + 24} L -20 ${G + 24} Z`, '#d9d2c4') + `<rect x="-20" y="${G + 24}" width="760" height="300" fill="#6c6e76"/>`;
  for (let i = 0; i < 6; i++) o += tkLine(`M ${i * 140 - 20} ${G - 60} L ${i * 140 - 60} ${G + 24}`, 2, '#b8b0a2');
  return o;
}
window.renderFrame = function (t) {
  let o = set(t);
  // TJR, front view, nodding while he talks
  const talk = tjrMouth(t);
  const nod = t > 4.7 && t < 6.9 ? Math.sin((t - 4.7) * 5) * 3 : 0;
  const wave2 = t > 6.9 ? Math.sin(t * 9) * 26 : 0;
  o += toonHuman('tjr', { view: 'front', x: 520, y: G, s: 0.86, headTilt: nod - 3, mouth: talk, smile: 0.7, blink: blink(t, 0.3) > 0.5 ? 0 : 1, look: [-0.6, 0], hF: t > 6.9 ? [-130 + wave2, -720] : null }, t);
  // Brodie: walk in from the left in side view, then face the camera
  const tStop = 2.6, tTurn = 2.85;
  const walkU = prog(t, 0, tStop), x = lerp(-120, 220, walkU);
  if (t < tTurn) {
    const ph = x / 22, sw = 24, lift = 16;
    const fN = [-2 + sw * Math.sin(ph), BR.ankleY - Math.max(0, Math.cos(ph)) * lift];
    const fF = [-18 - sw * Math.sin(ph), BR.ankleY - Math.max(0, -Math.cos(ph)) * lift];
    const walking = t < tStop;
    const bob = walking ? Math.abs(Math.cos(ph)) * 6 : 0;
    o += toonDog('brodie', { view: 'side', x, y: G - bob, s: 1, fN: walking ? fN : null, fF: walking ? fF : null, hN: walking ? [30 - 20 * Math.sin(ph), BR.shY + 176] : null, hF: walking ? [18 + 20 * Math.sin(ph), BR.shY + 176] : null, wag: 14, wagSpeed: 10, earSwing: walking ? Math.sin(ph * 2) * 6 : 0 }, t);
  } else {
    const pop = 1 + 0.06 * Math.sin(prog(t, tTurn, tTurn + 0.25) * Math.PI);
    const waving = t > 3.1 && t < 4.6 || t > 6.9;
    const wv = Math.sin(t * 10) * 28;
    const hN = waving ? [BR.sw + 54 + wv, BR.headY - 10] : null;
    const jaw = jawFrom(TL, 'hero', t), excited = t > 3.1 && t < 4.7;
    o += toonDog('brodie', { view: 'front', x: 220, y: G, s: pop, hN, jaw, smile: 1, lid: blink(t, 0.9) > 0.5 ? 0 : 1, look: t > 4.7 ? [0.8, -0.2] : [0, 0], earSwing: excited ? Math.sin(t * 14) * 8 : 0, headTilt: t > 4.8 && t < 6.9 ? -6 : 0, brow: excited ? -0.4 : 0 }, t);
  }
  o += `<rect width="720" height="1280" fill="url(#vignette)" opacity="0.5"/>`;
  o += dogSub(t, TL.subs, 1190);
  const dip = Math.max(t < 0.3 ? 1 - t / 0.3 : 0, prog(t, TL.duration - 0.4, TL.duration - 0.05));
  if (dip > 0) o += `<rect width="720" height="1280" fill="#000" opacity="${clamp(dip).toFixed(3)}"/>`;
  frameEl.innerHTML = o;
};
const stage = document.getElementById('stage');
stage.innerHTML = `<defs>${DEFS_COMMON}</defs><g id="frame"></g>`;
const frameEl = document.getElementById('frame');
