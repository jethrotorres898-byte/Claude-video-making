'use strict';
// "What If" style: loose ink lines on cream paper (a displacement filter roughens every
// stroke), flat colours, and exaggerated comedy faces. Characters: Clyde (round white head,
// messy spiky brown hair, white bean body, tube limbs) with his "Mogger" glow-up face, and
// the Genie. Uses lib/stickkit.js (f1, lerp, clamp, ik, rng) and lib/toon.js (tkPath, tkSym).

const WI = {
  ink: '#1e1914', w: 4, fine: 2.2, paper: '#f4ead6', white: '#fdfbf5', shade: '#e6dccb',
  hair: '#4b2e1b', hairHi: '#714a2c', hairDk: '#2e1b0f', red: '#c8423c', mouth: '#5a1a18', tongue: '#e0707a',
  gSkin: '#4bb4a4', gShade: '#2f8f82', gLight: '#94dccf', vest: '#6b3f9e', vestDk: '#4e2a78', gold: '#e2b23e', goldDk: '#a87a18', turban: '#b8323a', turbanDk: '#86202a',
};
const wiOl = (d, fill, w = WI.w) => `<path d="${d}" fill="${fill}" stroke="${WI.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const wiLn = (d, w = WI.w, col = WI.ink, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
const wiCirc = (x, y, r, fill, w = WI.w) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}" stroke="${WI.ink}" stroke-width="${w}"/>`;
const wiEll = (x, y, rx, ry, fill, w = WI.w, rot = 0) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" stroke="${WI.ink}" stroke-width="${w}"${rot ? ` transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"` : ''}/>`;
function wiLimb(pts, ws, fill) {
  let o = '', f = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const d = `M ${f1(pts[i][0])} ${f1(pts[i][1])} L ${f1(pts[i + 1][0])} ${f1(pts[i + 1][1])}`;
    o += `<path d="${d}" stroke="${WI.ink}" stroke-width="${ws[i] + 2 * WI.w}" stroke-linecap="round"/>`;
    f += `<path d="${d}" stroke="${fill}" stroke-width="${ws[i]}" stroke-linecap="round"/>`;
  }
  return [o, f];
}
const wiAng = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
// hand-lettered text: bold marker or casual handwriting, ink outline optional
function wiText(x, y, s, o = {}) {
  const { size = 40, fill = WI.ink, font = 'marker', anchor = 'middle', rot = 0, stroke = null, sw = 8, ls = 0 } = o;
  const fam = font === 'marker' ? 'Marker' : 'Hand';
  return `<text x="${f1(x)}" y="${f1(y)}" font-family="${fam}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round"` : ''}${rot ? ` transform="rotate(${rot} ${f1(x)} ${f1(y)})"` : ''}>${esc(s)}</text>`;
}

// ---------- Clyde ----------
const CLYDE_R = 60;
// shaggy mop: short chunky tufts around a rounded volume (fixed seed, identical in every panel);
// up (0..1) makes it stand on end
function clydeHair(up = 0) {
  const R = CLYDE_R, r = rng(4242), pts = [];
  const cx = 0, cy = -0.32 * R, rx = 1.14 * R, ry = 1.04 * R, n = 14;
  for (let i = 0; i <= n; i++) {
    const t = lerp(Math.PI * 1.13, -Math.PI * 0.13, i / n);
    const bx = cx + Math.cos(t) * rx, by = cy - Math.sin(t) * ry;
    if (i > 0) pts.push([bx, by]);
    if (i === n) break;
    const tm = lerp(Math.PI * 1.13, -Math.PI * 0.13, (i + 0.55) / n);
    const len = 1.2 + 0.24 * r() + up * (0.25 + 0.2 * Math.max(0, Math.sin(tm)));
    const sweep = (Math.cos(tm) > 0 ? -1 : 1) * (0.1 + 0.12 * r()) * (1 - up);
    const ta = tm + sweep;
    pts.push([cx + Math.cos(ta) * rx * len, cy - Math.sin(ta) * ry * len - up * 0.12 * R, 1]);
  }
  pts[0] = [cx + Math.cos(Math.PI * 1.13) * rx, cy - Math.sin(Math.PI * 1.13) * ry, 1];
  // bangs: chunky clumps hanging over the forehead to just above the brows
  const bang = [[0.98, -0.12, 1], [0.82, -0.5], [0.7, -0.3, 1], [0.56, -0.6], [0.4, -0.34, 1], [0.24, -0.62], [0.08, -0.36, 1], [-0.08, -0.64], [-0.24, -0.38, 1], [-0.4, -0.62], [-0.56, -0.34, 1], [-0.72, -0.56], [-0.86, -0.28, 1], [-1.0, -0.1, 1]];
  const shape = [...pts, ...bang.map(([x, y, sh]) => [x * R, y * R, sh])];
  let o = wiOl(tkPath(shape), WI.hair);
  const rr = rng(99);
  for (let i = 0; i < 9; i++) {
    const t = lerp(Math.PI * 0.95, Math.PI * 0.05, i / 8), x0 = Math.cos(t) * rx * 0.62, y0 = cy - Math.sin(t) * ry * 0.5;
    const x1 = Math.cos(t) * rx * (0.98 + rr() * 0.1), y1 = cy - Math.sin(t) * ry * (0.98 + rr() * 0.1);
    o += wiLn(`M ${f1(x0)} ${f1(y0)} Q ${f1((x0 + x1) / 2 + (rr() - 0.5) * 8)} ${f1((y0 + y1) / 2)} ${f1(x1)} ${f1(y1)}`, 2.2, i % 2 ? WI.hairHi : WI.hairDk, 0.9);
  }
  return o;
}
// faces: expression presets drawn inside the head circle (radius 60)
function clydeFace(e = 'neutral', o2 = {}) {
  const R = CLYDE_R, look = o2.look || [0, 0];
  let o = '';
  const eyes = (rx = 5.5, ry = 8.5, dy = 0) => [-1, 1].map((s) => `<ellipse cx="${f1(s * 20 + look[0] * 4)}" cy="${f1(-2 + dy + look[1] * 3)}" rx="${rx}" ry="${ry}" fill="${WI.ink}"/>`).join('');
  const brows = (inner, outer, y = -18) => [-1, 1].map((s) => wiLn(`M ${s * 10} ${y + inner} L ${s * 30} ${y + outer}`, 3.4)).join('');
  if (e === 'neutral' || e === 'happy') {
    o += eyes() + brows(0, -2) + (e === 'happy' ? wiOl('M -16 18 Q 0 40 16 18 Z', WI.mouth, 3) + `<path d="M -8 28 Q 0 34 8 28 Q 0 24 -8 28 Z" fill="${WI.tongue}"/>` : wiLn('M -12 20 Q 0 28 12 20', 3.4));
  } else if (e === 'curious') {
    o += eyes(5.5, 8.5) + wiLn('M -30 -20 L -10 -18', 3.4) + wiLn('M 10 -24 Q 20 -32 30 -26', 3.4) + wiOl('M -4 24 a 5 5 0 1 0 8 0 a 5 5 0 1 0 -8 0', WI.mouth, 3);
  } else if (e === 'shocked') {
    o += [-1, 1].map((s) => wiCirc(s * 21, -6, 13, '#fff', 3.2) + `<circle cx="${s * 21}" cy="-6" r="3.6" fill="${WI.ink}"/>`).join('');
    o += [-1, 1].map((s) => wiLn(`M ${s * 10} -30 Q ${s * 21} -40 ${s * 32} -30`, 3.4)).join('');
    o += wiOl('M -15 22 Q -16 52 0 54 Q 16 52 15 22 Q 0 14 -15 22 Z', WI.mouth, 3.2) + `<path d="M -9 44 Q 0 36 9 44 Q 0 52 -9 44 Z" fill="${WI.tongue}"/>`;
  } else if (e === 'scheming' || e === 'evil') {
    // half-lidded eyes looking sideways, brows in a sharp V, wide toothy grin, shadowed brow
    o += `<path d="M ${-R * 0.95} -26 Q 0 -44 ${R * 0.95} -26 L ${R * 0.9} -8 Q 0 -20 ${-R * 0.9} -8 Z" fill="#000" opacity="0.12"/>`;
    for (const s of [-1, 1]) {
      o += wiOl(`M ${s * 9} -6 Q ${s * 20} -12 ${s * 32} -8 Q ${s * 21} 2 ${s * 9} -6 Z`, '#fff', 2.6) + `<circle cx="${s * 21 + (e === 'evil' ? 0 : 4)}" cy="-6" r="3.8" fill="${WI.ink}"/>` + wiLn(`M ${s * 7} -7 Q ${s * 20} -14 ${s * 34} -9`, 3.6);
      o += wiLn(`M ${s * 6} -14 L ${s * 32} -26`, 4);
    }
    if (e === 'evil') o += wiOl('M -26 14 Q 0 6 26 14 Q 22 46 0 48 Q -22 46 -26 14 Z', WI.mouth, 3.2) + `<path d="M -24 15 Q 0 8 24 15 L 22 22 Q 0 15 -22 22 Z" fill="#fff"/>` + `<path d="M -9 40 Q 0 33 9 40 Q 0 46 -9 40 Z" fill="${WI.tongue}"/>`;
    else o += wiOl('M -28 12 Q 0 22 28 12 Q 22 34 0 36 Q -22 34 -28 12 Z', '#fff', 3.2) + wiLn('M -26 18 Q 0 28 26 18', 2) + [-14, -5, 5, 14].map((x) => wiLn(`M ${x} ${x * x > 100 ? 17 : 20} L ${x} ${x * x > 100 ? 29 : 33}`, 1.8)).join('');
    o += wiLn('M -34 14 q -4 -2 -6 -7 M 34 14 q 4 -2 6 -7', 2.6);
  } else if (e === 'smug') {
    for (const s of [-1, 1]) o += `<path d="M ${s * 12} -4 Q ${s * 21} -9 ${s * 30} -4 Q ${s * 21} 2 ${s * 12} -4 Z" fill="${WI.ink}"/>` + wiLn(`M ${s * 10} -6 L ${s * 32} -6`, 3.4);
    o += wiLn('M -30 -22 L -10 -18', 3.4) + wiLn('M 10 -22 Q 20 -30 30 -24', 3.4) + wiLn('M -12 22 Q 6 26 20 14', 3.6);
  } else if (e === 'innocent') {
    for (const s of [-1, 1]) {
      o += wiCirc(s * 21, -4, 12, WI.ink, 2) + `<circle cx="${s * 21 + 4}" cy="-9" r="4.5" fill="#fff"/><circle cx="${s * 21 - 4}" cy="1" r="2" fill="#fff"/>`;
      o += wiLn(`M ${s * 12} -24 Q ${s * 22} -30 ${s * 32} -22`, 3);
      o += `<ellipse cx="${s * 34}" cy="14" rx="9" ry="5" fill="#ff9aa8" opacity="0.6"/>`;
    }
    o += wiLn('M -8 22 Q -4 27 0 22 Q 4 27 8 22', 3);
  } else if (e === 'laugh') {
    for (const s of [-1, 1]) o += wiLn(`M ${s * 10} -4 Q ${s * 21} -14 ${s * 32} -4`, 4) + wiLn(`M ${s * 8} -16 L ${s * 32} -26`, 4);
    o += wiOl('M -24 10 Q 0 4 24 10 Q 20 44 0 46 Q -20 44 -24 10 Z', WI.mouth, 3.2) + `<path d="M -22 11 Q 0 5 22 11 L 20 18 Q 0 12 -20 18 Z" fill="#fff"/><path d="M -9 38 Q 0 31 9 38 Q 0 44 -9 38 Z" fill="${WI.tongue}"/>`;
  }
  return o;
}
function clydeHead(e = 'neutral', o2 = {}) {
  const R = CLYDE_R;
  let o = wiCirc(0, 0, R, WI.white) + `<path d="M ${-R * 0.75} ${R * 0.55} Q 0 ${R * 1.08} ${R * 0.75} ${R * 0.55}" fill="none" stroke="${WI.shade}" stroke-width="7" opacity="0.7"/>`;
  o += clydeFace(e, o2) + clydeHair(o2.hairUp ?? (e === 'shocked' ? 0.7 : 0));
  return o;
}
// mitten hand at H pointing away from E; kind: open | fist | point | thumb
function clydeHand(H, E, kind = 'open', sc = 1) {
  const a = wiAng(E, H) - 90;
  let o = `<g transform="translate(${f1(H[0])} ${f1(H[1])}) rotate(${f1(a)}) scale(${sc})">`;
  if (kind === 'point') o += wiOl('M -9 -6 C -11 6 -8 14 0 14 C 8 14 11 6 9 -6 Z', WI.white, 3.2) + wiOl('M -3 12 L -3 34 Q 0 38 3 34 L 3 12', WI.white, 3);
  else if (kind === 'fist') o += wiOl('M -11 -6 C -13 8 -8 16 0 16 C 8 16 13 8 11 -6 Z', WI.white, 3.2) + wiLn('M -6 12 L -6 6 M 0 14 L 0 7 M 6 12 L 6 6', 1.8);
  else o += wiOl('M -11 -6 C -13 10 -8 19 0 19 C 8 19 13 10 11 -6 Z', WI.white, 3.2) + wiOl('M 9 0 Q 18 2 17 11 Q 12 11 9 7', WI.white, 2.8);
  return o + '</g>';
}
// p: x, y (ground), s, flip, expr, look, hairUp, lean, headTilt, hL/hR hand targets (local), handL/handR kinds,
//    bendL/bendR (elbow direction), fL/fR feet, halo
function clyde(p) {
  const s = p.s ?? 1, f = p.flip ?? 1;
  let o = '';
  const head = [p.headX ?? 0, -462 + (p.headY ?? 0)];
  // legs
  const hips = [[-13, -236], [13, -236]];
  const feet = [p.fL || [-34, -6], p.fR || [34, -6]];
  const legs = hips.map((H, i) => { const K = ik(H, feet[i], 118, 116, i ? -1 : 1)[0]; return wiLimb([H, K, feet[i]], [17, 16], WI.white); });
  o += legs.map((l) => l[0]).join('') + legs.map((l) => l[1]).join('');
  for (let i = 0; i < 2; i++) o += wiEll(feet[i][0] + (i ? 7 : -7), feet[i][1] + 2, 15, 8, WI.white, 3.2);
  // torso
  o += wiOl(tkPath(tkSym([[0, -404], [24, -400], [34, -382], [37, -330], [34, -272], [28, -242], [14, -228], [0, -226]])), WI.white) + `<path d="M 26 -380 Q 34 -320 24 -244" stroke="${WI.shade}" stroke-width="6" fill="none" opacity="0.8"/>`;
  // arms
  const sh = [[-28, -384], [28, -384]];
  const hands = [p.hL || [-46, -232], p.hR || [46, -232]];
  const bends = [p.bendL ?? 1, p.bendR ?? -1];
  const arms = sh.map((S, i) => { const E = ik(S, hands[i], 88, 84, bends[i])[0]; return { S, E, H: hands[i], L: wiLimb([S, E, hands[i]], [16, 15], WI.white) }; });
  o += arms.map((a) => a.L[0]).join('') + arms.map((a) => a.L[1]).join('');
  o += arms.map((a, i) => clydeHand(a.H, a.E, (i ? p.handR : p.handL) || 'open')).join('');
  // head
  o += `<g transform="translate(${f1(head[0])} ${f1(head[1])}) rotate(${f1(p.headTilt ?? 0)})">${clydeHead(p.expr || 'neutral', p)}</g>`;
  if (p.halo) o += `<ellipse cx="${f1(head[0])}" cy="${f1(head[1] - 96)}" rx="38" ry="10" fill="none" stroke="#f2c94c" stroke-width="7"/><ellipse cx="${f1(head[0])}" cy="${f1(head[1] - 96)}" rx="38" ry="10" fill="none" stroke="${WI.ink}" stroke-width="2" opacity="0.5"/>`;
  return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">${o}</g>`;
}
// "Mogger": Clyde's chiselled glow-up face for punchlines (same hair), drawn big for close-ups
function moggerHead(o2 = {}) {
  const intense = o2.intense ?? 0;
  let o = '';
  // neck and shoulders
  o += wiOl('M -46 70 L -40 128 Q 0 140 40 128 L 46 70 Z', WI.white) + wiLn('M -14 96 L -10 124 M 14 96 L 10 124', 2.4, WI.ink, 0.6) + wiOl('M -150 170 Q -120 120 -40 120 Q 0 132 40 120 Q 120 120 150 170 L 150 220 L -150 220 Z', WI.white);
  // the jaw: wide, square, sharp corners
  const face = [[0, -78], [44, -74], [64, -50], [70, -12], [70, 20], [64, 48, 1], [34, 86, 1], [0, 92], [-34, 86, 1], [-64, 48, 1], [-70, 20], [-70, -12], [-64, -50], [-44, -74]];
  o += wiOl(tkPath(face), WI.white);
  o += `<path d="M 60 -10 Q 66 30 58 50 L 36 80 Q 54 50 56 20 Z" fill="${WI.shade}"/>`;
  // cheekbones, jaw lines, chin cleft
  o += wiLn('M -56 18 Q -42 30 -30 28 M 56 18 Q 42 30 30 28', 2.6) + wiLn('M -6 80 Q 0 88 6 80', 2.4) + wiLn('M -60 52 L -36 80 M 60 52 L 36 80', 2, WI.ink, 0.5);
  // stubble
  const r = rng(77);
  for (let i = 0; i < 46; i++) { const x = (r() - 0.5) * 110, y = 40 + r() * 44; if (Math.abs(x) < 64 - (y - 40) * 0.6) o += `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.3" fill="${WI.ink}" opacity="0.55"/>`; }
  // eyes: narrow, heavy-lidded, sharp brows
  for (const s of [-1, 1]) {
    o += wiOl(`M ${s * 12} -14 Q ${s * 28} -22 ${s * 44} -14 Q ${s * 28} -6 ${s * 12} -14 Z`, '#fff', 2.6);
    o += `<circle cx="${s * 27 + (o2.lookAt ? 0 : 3)}" cy="-14" r="5" fill="${WI.ink}"/><circle cx="${s * 27 + 5}" cy="-16" r="1.6" fill="#fff"/>`;
    o += wiLn(`M ${s * 10} -16 Q ${s * 28} -26 ${s * 46} -16`, 4);
    o += `<path d="M ${s * 8} -26 L ${s * 46} ${-36 + intense * 4} L ${s * 48} ${-30 + intense * 4} L ${s * 10} -20 Z" fill="${WI.hair}" stroke="${WI.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    o += wiLn(`M ${s * 14} -6 Q ${s * 28} -2 ${s * 40} -6`, 1.8, WI.ink, 0.5);
  }
  // nose and the smirk
  o += wiLn('M -2 -10 Q -6 18 -10 26 Q -4 32 4 30 Q 8 30 10 26', 2.8) + wiLn('M 4 -10 Q 8 8 10 20', 1.8, WI.ink, 0.4);
  o += wiLn('M -24 50 Q 0 56 22 46 Q 30 42 34 34', 3.4) + wiLn('M 30 38 q 6 0 8 6', 2.4);
  // the same messy hair, swept a bit more
  o += `<g transform="translate(0 -30) scale(1.18 1.05)">${clydeHair(0.15)}</g>`;
  return o;
}
// close-up hands steepled under the chin (scheming)
function steepleHands(x, y, sc = 1) {
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc})">`;
  for (const s of [-1, 1]) {
    o += wiOl(`M ${s * 70} 120 Q ${s * 60} 60 ${s * 34} 40 L ${s * 8} 0 Q ${s * 2} -10 ${s * 6} -14 L ${s * 30} 10 Q ${s * 56} 30 ${s * 80} 80 Z`, WI.white, 3.4);
    for (let k = 0; k < 3; k++) o += wiLn(`M ${s * (10 + k * 9)} ${4 + k * 8} L ${s * (28 + k * 8)} ${24 + k * 6}`, 2, WI.ink, 0.7);
  }
  o += wiLn('M -6 -14 L 0 -22 L 6 -14', 3);
  return o + '</g>';
}

// ---------- the Genie ----------
// expression presets for the genie's big face (head radius ~72)
function genieFace(e = 'grand') {
  let o = '';
  const brow = (l, r, y = -34) => wiOl(`M -50 ${y + l} Q -30 ${y - 12 + l} -10 ${y + 2 + l} L -12 ${y + 8 + l} Q -30 ${y - 4 + l} -48 ${y + 8 + l} Z`, WI.ink, 2) + wiOl(`M 50 ${y + r} Q 30 ${y - 12 + r} 10 ${y + 2 + r} L 12 ${y + 8 + r} Q 30 ${y - 4 + r} 48 ${y + 8 + r} Z`, WI.ink, 2);
  const eyeOpen = (rx = 12, ry = 15, pr = 6, py = 0, dx = 0) => [-1, 1].map((s) => wiEll(s * 28, -12, rx, ry, '#fff', 3) + `<circle cx="${s * 28 + dx}" cy="${-12 + py}" r="${pr}" fill="${WI.ink}"/>`).join('');
  const eyeClosed = (up = 1) => [-1, 1].map((s) => wiLn(`M ${s * 16} -12 Q ${s * 28} ${-12 - 10 * up} ${s * 40} -12`, 4)).join('');
  // mustache: curls up when happy, droops when sad
  const stache = (curl) => wiOl(`M 0 16 Q -22 6 -44 16 Q -62 ${22 - curl * 12} -60 ${4 - curl * 18} Q -52 ${-4 - curl * 12} -48 ${10 - curl * 6} Q -38 ${22 - curl * 4} -22 22 Q -8 26 0 22 Q 8 26 22 22 Q 38 ${22 - curl * 4} 48 ${10 - curl * 6} Q 52 ${-4 - curl * 12} 60 ${4 - curl * 18} Q 62 ${22 - curl * 12} 44 16 Q 22 6 0 16 Z`, WI.ink, 2);
  const nose = wiOl('M -6 -6 Q -16 8 -12 16 Q 0 24 12 16 Q 16 8 6 -6 Z', e === 'furious' ? '#a8281f' : WI.gShade, 3);
  if (e === 'grand' || e === 'bliss') {
    o += eyeClosed(1) + brow(-4, -4) + wiOl('M -22 30 Q 0 52 22 30 Q 0 36 -22 30 Z', WI.mouth, 3) + nose + stache(1);
  } else if (e === 'lecture') {
    o += eyeOpen(11, 10, 5, 2) + brow(6, -10) + wiLn('M -10 36 Q 0 40 10 36', 3) + nose + stache(0.4) + wiLn('M -44 -4 Q -28 2 -14 -4 M 14 -4 Q 28 2 44 -4', 3);
  } else if (e === 'shocked') {
    o += eyeOpen(17, 21, 4) + brow(-14, -14, -44) + wiOl('M -14 32 Q -16 62 0 64 Q 16 62 14 32 Q 0 26 -14 32 Z', WI.mouth, 3) + nose + stache(1.6);
  } else if (e === 'furious') {
    o += eyeOpen(12, 10, 4.5) + `<path d="M -48 -30 L -10 -16 L -12 -8 L -50 -22 Z M 48 -30 L 10 -16 L 12 -8 L 50 -22 Z" fill="${WI.ink}"/>` + wiOl('M -34 26 Q 0 18 34 26 Q 30 70 0 72 Q -30 70 -34 26 Z', WI.mouth, 3.2) + `<path d="M -32 27 Q 0 19 32 27 L 30 36 Q 0 28 -30 36 Z" fill="#fff"/><path d="M -12 62 Q 0 54 12 62 Q 0 68 -12 62 Z" fill="${WI.tongue}"/>` + nose + stache(-0.4);
    o += wiLn('M -60 -52 l 10 6 l -4 -10 l 10 4 M 58 -60 l -8 8 l 10 -2 l -6 8', 3, '#8a1010');
  } else if (e === 'stern') {
    o += eyeClosed(-0.6) + brow(10, 10) + wiLn('M -14 38 Q 0 32 14 38', 3.4) + nose + stache(-0.6);
  } else if (e === 'horror') {
    o += [-1, 1].map((s) => wiEll(s * 28, -14, 18, 24, '#fff', 3) + `<circle cx="${s * 28}" cy="-14" r="3" fill="${WI.ink}"/>`).join('') + brow(-18, -18, -48);
    o += wiOl('M -12 28 Q -18 90 0 96 Q 18 90 12 28 Q 0 22 -12 28 Z', WI.mouth, 3.2) + nose + stache(-1.4);
  }
  return o;
}
function genieHead(e = 'grand', tint = null) {
  let o = '';
  // ears with gold hoops
  for (const s of [-1, 1]) o += wiOl(`M ${s * 64} -16 Q ${s * 100} -40 ${s * 96} -60 Q ${s * 84} -30 ${s * 66} 6 Z`, WI.gSkin, 3.4) + `<circle cx="${s * 74}" cy="10" r="10" fill="none" stroke="${WI.gold}" stroke-width="5"/><circle cx="${s * 74}" cy="10" r="10" fill="none" stroke="${WI.ink}" stroke-width="1.4" opacity="0.6"/>`;
  o += wiOl(tkPath([[0, -84], [44, -78], [70, -46], [72, 0], [64, 40], [40, 70], [0, 80], [-40, 70], [-64, 40], [-72, 0], [-70, -46], [-44, -78]]), tint || (e === 'furious' ? '#d9473c' : WI.gSkin));
  o += `<path d="M 50 -50 Q 70 0 52 50 Q 40 66 22 74 Q 54 30 50 -50 Z" fill="${e === 'furious' ? '#a8281f' : WI.gShade}" opacity="0.55"/>`;
  o += genieFace(e);
  // goatee
  o += wiOl('M -12 74 Q 0 112 12 74 Z', WI.ink, 2);
  // turban with jewel and plume
  o += wiOl(tkPath([[-76, -26], [-84, -70], [-56, -112], [0, -128], [56, -112], [84, -70], [76, -26], [40, -46], [0, -52], [-40, -46]]), WI.turban);
  o += wiLn('M -70 -50 Q 0 -96 72 -54 M -60 -84 Q 0 -120 60 -86', 3, WI.turbanDk);
  o += wiOl('M 0 -66 l 16 14 l -16 16 l -16 -16 Z', WI.gold, 3) + `<circle cx="0" cy="-52" r="6" fill="#d8304a" stroke="${WI.ink}" stroke-width="2"/>`;
  o += wiOl('M 0 -70 Q -10 -120 20 -150 Q 10 -110 6 -70 Z', '#f6f0e4', 2.6);
  return o;
}
// genie hand at H (4 chunky fingers); kind: open | point | fist | magic
function genieHand(H, E, kind = 'open', sc = 1) {
  const a = wiAng(E, H) - 90;
  let o = `<g transform="translate(${f1(H[0])} ${f1(H[1])}) rotate(${f1(a)}) scale(${sc})">`;
  o += `<rect x="-17" y="-16" width="34" height="14" rx="5" fill="${WI.gold}" stroke="${WI.ink}" stroke-width="3"/>`;
  if (kind === 'point') o += wiOl('M -16 0 Q -18 22 -4 26 L 14 24 Q 20 10 16 0 Z', WI.gSkin, 3.2) + wiOl('M 0 22 L 0 56 Q 6 62 11 56 L 12 22', WI.gSkin, 3) + wiOl('M -16 8 Q -28 10 -26 22 Q -18 22 -14 16', WI.gSkin, 2.6);
  else if (kind === 'fist') o += wiOl('M -18 0 Q -20 30 0 32 Q 20 30 18 0 Z', WI.gSkin, 3.2) + wiLn('M -10 26 L -10 16 M 0 28 L 0 18 M 10 26 L 10 16', 2);
  else {
    o += wiOl('M -18 0 Q -20 26 -12 30 L 14 30 Q 20 24 18 0 Z', WI.gSkin, 3.2);
    for (const [x, len, ang] of [[-12, 26, -12], [-3, 32, -3], [6, 32, 4], [14, 26, 12]]) o += `<g transform="translate(${x} 26) rotate(${ang})">${wiOl(`M -4 0 L -4 ${len} Q 0 ${len + 6} 4 ${len} L 4 0`, WI.gSkin, 2.8)}</g>`;
    o += wiOl('M -16 8 Q -34 6 -36 22 Q -24 26 -14 18', WI.gSkin, 2.8);
    if (kind === 'magic') o += `<circle cx="0" cy="40" r="46" fill="url(#magicGlow)"/>`;
  }
  return o + '</g>';
}
// p: x, y (lamp on the ground), s, flip, expr, hL/hR hand targets (local), handL/handR, crossArms, handsOnCheeks,
//    tint (override skin, e.g. grey when frozen), lean
function genie(p) {
  const s = p.s ?? 1, f = p.flip ?? 1, skin = p.tint || WI.gSkin;
  let o = '';
  // the lamp
  o += `<ellipse cx="0" cy="6" rx="120" ry="16" fill="#000" opacity="0.15"/>`;
  o += wiOl('M -70 0 Q -80 -40 -30 -48 L 40 -48 Q 70 -44 76 -26 L 124 -46 Q 136 -46 130 -36 L 84 -6 Q 74 4 40 4 L -40 4 Q -66 4 -70 0 Z', p.tint ? '#b8b8b8' : WI.gold);
  o += wiOl('M -80 -30 Q -112 -34 -110 -6 Q -100 8 -74 -8', 'none', 6) + wiOl('M -20 -48 Q 0 -70 20 -48 Z', p.tint ? '#a0a0a0' : WI.goldDk, 3) + wiLn('M -50 -24 Q 0 -10 60 -24', 3, p.tint ? '#888' : WI.goldDk);
  // smoke tail from the spout up to the waist
  o += wiOl('M 128 -44 Q 170 -110 120 -170 Q 70 -230 -30 -250 Q -60 -268 -42 -300 L 42 -300 Q 30 -276 40 -262 Q 150 -230 168 -160 Q 190 -80 134 -40 Z', p.tint || WI.gLight, 3.4);
  o += wiLn('M 140 -70 Q 160 -130 110 -180 M 60 -240 Q 0 -256 -10 -280', 2.4, p.tint ? '#888' : WI.gShade, 0.7);
  // torso: broad chest, open vest, sash
  const chest = [[0, -488], [60, -484], [96, -462], [98, -420], [78, -370], [56, -320], [40, -296], [0, -290]];
  o += wiOl(tkPath(tkSym(chest)), skin);
  o += wiLn('M -40 -440 Q -20 -420 0 -432 Q 20 -420 40 -440 M 0 -420 L 0 -330 M -24 -392 Q 0 -384 24 -392 M -22 -360 Q 0 -352 22 -360', 2.6, WI.ink, 0.7);
  for (const sd of [-1, 1]) o += wiOl(`M ${sd * 30} -486 Q ${sd * 64} -490 ${sd * 96} -462 Q ${sd * 98} -420 ${sd * 80} -370 L ${sd * 52} -316 Q ${sd * 40} -380 ${sd * 30} -486 Z`, p.tint ? '#8a8a8a' : WI.vest, 3.4) + wiLn(`M ${sd * 30} -486 Q ${sd * 40} -380 ${sd * 52} -316`, 4, p.tint ? '#bbb' : WI.gold);
  o += wiOl('M -52 -326 Q 0 -306 52 -326 L 44 -292 Q 0 -280 -44 -292 Z', p.tint ? '#999' : WI.turban, 3.4);
  // arms
  const sh = [[-84, -462], [84, -462]];
  let hands = [p.hL || [-150, -360], p.hR || [150, -360]];
  if (p.handsOnCheeks) hands = [[-62, -560], [62, -560]];
  if (p.crossArms) {
    // forearms folded across the chest
    o += wiLimb([sh[0], [-104, -380]], [40], skin).join('') + wiLimb([sh[1], [104, -380]], [40], skin).join('');
    o += wiOl('M -110 -400 Q -40 -360 70 -404 L 82 -372 Q -30 -326 -104 -364 Z', skin, 3.6) + wiOl('M 110 -404 Q 40 -360 -70 -400 L -82 -370 Q 30 -330 104 -366 Z', skin, 3.6);
    o += `<rect x="62" y="-410" width="16" height="36" rx="5" fill="${p.tint ? '#aaa' : WI.gold}" stroke="${WI.ink}" stroke-width="3" transform="rotate(-18 70 -392)"/><rect x="-78" y="-408" width="16" height="36" rx="5" fill="${p.tint ? '#aaa' : WI.gold}" stroke="${WI.ink}" stroke-width="3" transform="rotate(18 -70 -390)"/>`;
  } else {
    const arms = sh.map((S, i) => { const E = ik(S, hands[i], 100, 96, i ? (p.handsOnCheeks ? 1 : -1) : (p.handsOnCheeks ? -1 : 1))[0]; return { S, E, H: hands[i], L: wiLimb([S, E, hands[i]], [40, 34], skin) }; });
    o += arms.map((a) => a.L[0]).join('') + arms.map((a) => a.L[1]).join('');
    o += arms.map((a) => wiLn(`M ${f1(lerp(a.S[0], a.E[0], 0.4) - 10)} ${f1(lerp(a.S[1], a.E[1], 0.4))} q 8 -8 18 -2`, 2.4, WI.ink, 0.6)).join('');
    o += arms.map((a, i) => genieHand(a.H, a.E, (i ? p.handR : p.handL) || 'open')).join('');
  }
  // head (drawn before cheek hands so the hands sit on the face)
  const headSvg = `<g transform="translate(0 -566) rotate(${f1(p.headTilt ?? 0)})">${genieHead(p.expr || 'grand', p.tint)}</g>`;
  if (p.handsOnCheeks) {
    const hs = `<g transform="translate(-62 -560)">${genieHand([0, 0], [0, -40], 'open', 1.05)}</g><g transform="translate(62 -560)">${genieHand([0, 0], [0, -40], 'open', 1.05)}</g>`;
    o += headSvg + hs;
  } else o += headSvg;
  return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)}) rotate(${f1(p.lean ?? 0)} 0 -300)">${o}</g>`;
}

// ---------- effects ----------
function wiSparkle(x, y, r, col = '#f2c94c') {
  return `<path transform="translate(${f1(x)} ${f1(y)})" d="M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z" fill="${col}" stroke="${WI.ink}" stroke-width="2"/>`;
}
function wiBurst(cx, cy, n, r0, r1, col, op = 1) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = a + Math.PI / n;
    o += `<path d="M ${f1(cx + Math.cos(a) * r0)} ${f1(cy + Math.sin(a) * r0)} L ${f1(cx + Math.cos(a) * r1)} ${f1(cy + Math.sin(a) * r1)} L ${f1(cx + Math.cos(b) * r1)} ${f1(cy + Math.sin(b) * r1)} Z" fill="${col}" opacity="${op}"/>`;
  }
  return o;
}
function wiSpeedLines(cx, cy, n, r0, r1, seed = 3, col = WI.ink, op = 0.5) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, ra = r0 + r() * 40; o += wiLn(`M ${f1(cx + Math.cos(a) * ra)} ${f1(cy + Math.sin(a) * ra)} L ${f1(cx + Math.cos(a) * r1)} ${f1(cy + Math.sin(a) * r1)}`, 2 + r() * 3, col, op); }
  return o;
}
function wiSmoke(cx, cy, r, seed = 5, fill = '#f2f0ea') {
  const rr = rng(seed); let o = '';
  for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2, d = r * (0.55 + rr() * 0.35); o += wiCirc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, r * (0.32 + rr() * 0.18), fill, 3.4); }
  return o + `<ellipse cx="${cx}" cy="${cy}" rx="${f1(r * 0.75)}" ry="${f1(r * 0.55)}" fill="${fill}"/>`;
}
function wiSteam(x, y, sc = 1, flip = 1) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(flip * sc)} ${f1(sc)})">${wiOl('M 0 0 Q -10 -20 4 -30 Q 0 -44 16 -48 Q 26 -64 42 -54 Q 60 -56 58 -38 Q 70 -26 56 -14 Q 50 0 30 -4 Q 14 8 0 0 Z', '#ffffff', 3)}</g>`;
}
function wiSweat(x, y, sc = 1) {
  return `<path transform="translate(${f1(x)} ${f1(y)}) scale(${sc})" d="M 0 -16 Q 10 0 8 8 Q 4 16 -4 12 Q -10 6 0 -16 Z" fill="#8fd3ff" stroke="${WI.ink}" stroke-width="2.4"/>`;
}
function wiClock(cx, cy, r, hh = -60, mm = 0, op = 1) {
  let o = `<g opacity="${op}">${wiCirc(cx, cy, r, '#fdf7e8', 6)}${wiCirc(cx, cy, r * 0.86, 'none', 2)}`;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; o += wiLn(`M ${f1(cx + Math.cos(a) * r * 0.74)} ${f1(cy + Math.sin(a) * r * 0.74)} L ${f1(cx + Math.cos(a) * r * 0.84)} ${f1(cy + Math.sin(a) * r * 0.84)}`, i % 3 ? 2.4 : 5); }
  o += wiLn(`M ${cx} ${cy} L ${f1(cx + Math.cos((hh * Math.PI) / 180) * r * 0.45)} ${f1(cy + Math.sin((hh * Math.PI) / 180) * r * 0.45)}`, 8) + wiLn(`M ${cx} ${cy} L ${f1(cx + Math.cos((mm * Math.PI) / 180 - Math.PI / 2) * r * 0.68)} ${f1(cy + Math.sin((mm * Math.PI) / 180 - Math.PI / 2) * r * 0.68)}`, 5);
  return o + wiCirc(cx, cy, 8, WI.ink, 2) + '</g>';
}
function wiPaper(W, H, col = WI.paper) {
  return `<rect width="${W}" height="${H}" fill="${col}"/><rect width="${W}" height="${H}" filter="url(#paperGrain)" opacity="0.5"/>`;
}
function whatifDefs() {
  return `<filter id="sketch" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="paperGrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.34  0 0 0 0 0.22  0 0 0 0.35 0"/></filter>
  <filter id="wash"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="grey"><feColorMatrix type="saturate" values="0.08"/><feComponentTransfer><feFuncR type="linear" slope="0.85" intercept="0.08"/><feFuncG type="linear" slope="0.88" intercept="0.09"/><feFuncB type="linear" slope="0.95" intercept="0.13"/></feComponentTransfer></filter>
  <radialGradient id="magicGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6b0" stop-opacity="0.95"/><stop offset="0.5" stop-color="#ffd84a" stop-opacity="0.45"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3a2a14" stop-opacity="0.35"/></radialGradient>`;
}
