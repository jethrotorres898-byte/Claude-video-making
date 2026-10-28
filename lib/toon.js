'use strict';
// "Toon" style: bold ink outlines, flat cel colours, tufted fur edges, and characters who
// stand upright, drawn from the front, side or back. All dogs share one parametric body
// (breeds change the head, ears, build, tail, markings and accessories); TJR has a matching
// human rig. Uses lib/stickkit.js helpers (f1, lerp, clamp, ik, rng, esc).

const TK = { ink: '#2a1c12', w: 3, fine: 1.6 };

// ---------- drawing helpers ----------
// Smooth path through points (Catmull-Rom); a point [x, y, 1] is a sharp corner.
function tkPath(pts, closed = true) {
  const n = pts.length, P = (i) => pts[((i % n) + n) % n];
  let d = `M ${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = closed ? P(i - 1) : pts[Math.max(0, i - 1)], p1 = P(i), p2 = P(i + 1), p3 = closed ? P(i + 2) : pts[Math.min(n - 1, i + 2)];
    const k1 = p1[2] ? 0 : 1 / 6, k2 = p2[2] ? 0 : 1 / 6;
    d += ` C ${f1(p1[0] + (p2[0] - p0[0]) * k1)} ${f1(p1[1] + (p2[1] - p0[1]) * k1)} ${f1(p2[0] - (p3[0] - p1[0]) * k2)} ${f1(p2[1] - (p3[1] - p1[1]) * k2)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (closed ? ' Z' : '');
}
// mirror a right-half outline (top centre to bottom centre) into a full symmetric outline
const tkSym = (half) => [...half, ...half.slice(1, -1).reverse().map(([x, y, s]) => [-x, y, s])];
// Fur tufts along a quadratic curve a -> c -> b: smooth bases, sharp tips poking out on `side`
// (+1 = right of the direction of travel) and swept along (sweep 1) or against (-1) travel.
function tkFur(a, c, b, n, depth, side = 1, seed = 1, sweep = 1) {
  const r = rng(seed), out = [];
  const q = (u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
  for (let i = 0; i < n; i++) {
    const p0 = q(i / n), pm = q((i + (sweep > 0 ? 0.62 : 0.38)) / n), p1 = q((i + 1) / n);
    const tl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, tx = (p1[0] - p0[0]) / tl, ty = (p1[1] - p0[1]) / tl;
    const dd = depth * (0.65 + 0.7 * r());
    out.push([p0[0], p0[1], i === 0 ? 1 : 0], [pm[0] - ty * side * dd + sweep * tx * dd * 0.9, pm[1] + tx * side * dd + sweep * ty * dd * 0.9, 1]);
  }
  return out;
}
const tkOl = (d, fill, w = TK.w) => `<path d="${d}" fill="${fill}" stroke="${TK.ink}" stroke-width="${w}" stroke-linejoin="round"/>`;
const tkLine = (d, w = TK.fine, col = TK.ink, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
const tkP = (p) => `${f1(p[0])} ${f1(p[1])}`;
const tkCirc = (x, y, r, fill) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r + TK.w / 2)}" fill="${TK.ink}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r - TK.w / 2)}" fill="${fill}"/>`;
// a limb as ink-outlined capsules: returns [outline layer, fill layer] so joints stay clean
function tkLimb(pts, ws, fill) {
  let o = '', f = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const d = `M ${tkP(pts[i])} L ${tkP(pts[i + 1])}`;
    o += `<path d="${d}" stroke="${TK.ink}" stroke-width="${ws[i] + 2 * TK.w}" stroke-linecap="round"/>`;
    f += `<path d="${d}" stroke="${Array.isArray(fill) ? fill[i] : fill}" stroke-width="${ws[i]}" stroke-linecap="round"/>`;
  }
  return [o, f];
}
// a small flame-shaped fur tuft poking out of an outline at (x, y), pointing to side sd
const tkTuft = (x, y, sd, fill, k = 1) => `<path d="M ${f1(x)} ${f1(y - 9 * k)} Q ${f1(x + sd * 9 * k)} ${f1(y - 2 * k)} ${f1(x + sd * 11 * k)} ${f1(y + 10 * k)} Q ${f1(x + sd * 3 * k)} ${f1(y + 4 * k)} ${f1(x - sd * 2)} ${f1(y + 6 * k)}" fill="${fill}" stroke="${TK.ink}" stroke-width="${TK.fine + 0.4}" stroke-linejoin="round"/>`;
const tkAng = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

// ---------- the dog cast ----------
const TOON_DOGS = {
  golden: { name: 'Golden', base: '#efbd6f', shade: '#d9a050', light: '#f8dca8', ear: '#e3aa56', ears: 'retriever', muzzle: 1, head: 1, tail: 'feather', ruff: 1 },
  brodie: { name: 'Brodie', base: '#c98a45', shade: '#a86c30', light: '#fbf6ec', ear: '#94521f', ears: 'beagle', muzzle: 0.95, head: 1.02, tail: 'whip', saddle: '#2e2620', blaze: 1, whiteMuzzle: 1, socks: 1, build: { leg: 0.86, torso: 0.9 } },
  stray: { name: 'The Stray', base: '#a8743f', shade: '#86592f', light: '#e6c99c', ear: '#6e4824', ears: 'retriever', muzzle: 1, head: 1, tail: 'plain', scruff: 1, build: { leg: 0.9, torso: 0.92, sw: 0.95, hw: 0.95, limb: 0.92 } },
  bella: { name: 'Bella', base: '#f7f0e7', shade: '#e2d4c4', light: '#ffffff', ear: '#efe3d4', ears: 'poodle', muzzle: 1.08, head: 0.92, tail: 'pom', topknot: 1, poms: 1, lashes: 1, nose: '#3a2a2a', build: { leg: 0.98, torso: 0.9, sw: 0.86, hw: 0.86, limb: 0.72 }, acc: { bow: '#ff5fa2' } },
  coco: { name: 'Coco', base: '#e9c27f', shade: '#cc9d58', light: '#fff1d4', ear: '#d6a25c', ears: 'silky', muzzle: 1.12, head: 0.95, tail: 'feather', lashes: 1, silky: 1, build: { leg: 1.02, torso: 0.94, sw: 0.88, hw: 0.9, limb: 0.82 }, acc: { tiara: 1, pearls: 1 } },
  bulldog: { name: 'The Bulldog', base: '#d0a67b', shade: '#ac835a', light: '#f2e4d0', ear: '#8a6644', ears: 'rose', muzzle: 0.42, head: 1.22, tail: 'stub', jowls: 1, build: { leg: 0.62, torso: 0.86, sw: 1.38, hw: 1.32, arm: 0.82, limb: 1.32 }, acc: { chain: 1 } },
  boss: { name: 'The Boss', base: '#a9aab4', shade: '#878892', light: '#e9e9ef', ear: '#5c5d68', ears: 'rose', muzzle: 0.42, head: 1.22, tail: 'stub', jowls: 1, grumpy: 1, brow: '#4a4b56', build: { leg: 0.62, torso: 0.86, sw: 1.38, hw: 1.32, arm: 0.82, limb: 1.32 }, acc: { shirt: '#f6f6f2', tie: '#c8283a', tag: 'MANAGER' } },
};
const TK_DEF_BUILD = { leg: 1, torso: 1, sw: 1, hw: 1, arm: 1, limb: 1 };

// skeleton in local units: ground at y = 0, x = 0 is the body's centre line
function tkDogSkel(c, p) {
  const b = { ...TK_DEF_BUILD, ...(c.build || {}) };
  const hipY = -(18 + 198 * b.leg) + (p.crouch ?? 0);
  const shY = hipY - 220 * b.torso;
  return { b, hipY, shY, hs: c.head, headY: shY - 18 - 54 * c.head, sw: 64 * b.sw, hw: 34 * b.hw, ankleY: -16,
    thigh: 100 * b.leg, shin: 99 * b.leg, up: 84 * b.arm, fore: 81 * b.arm, lw: b.limb };
}

// ---------- heads (head-local units, skull centre at 0,0) ----------
const TK_EARS = {
  retriever: [[34, -52], [58, -58], [80, -42], [90, -12], [90, 22], [86, 48, 1], [80, 38], [76, 54, 1], [70, 42], [63, 52, 1], [58, 28], [50, -2], [40, -30]],
  beagle: [[40, -40], [66, -44], [86, -16], [94, 28], [92, 70], [80, 90], [64, 86], [56, 60], [50, 20], [44, -12]],
  silky: [[36, -52], [62, -54], [84, -26], [94, 28], [102, 92], [100, 134, 1], [92, 120], [86, 138, 1], [78, 122], [70, 136, 1], [64, 96], [56, 34], [44, -20]],
  rose: [[38, -56, 1], [62, -76, 1], [94, -64, 1], [86, -46, 1], [62, -48, 1]],
};
function tkEarFront(c, t, p, mirror) {
  const sw = Math.sin(t * 3 + (mirror ? 1.3 : 0)) * 2 + (p.earSwing ?? 0) * (mirror ? -1 : 1);
  const xf = mirror ? ' scale(-1 1)' : '';
  if (c.ears === 'poodle') {
    const cl = [[66, -14, 24], [74, 16, 23], [70, 46, 22], [80, 68, 16]];
    const curls = cl.map(([x, y, r]) => tkLine(`M ${x - r * 0.4} ${y} q ${r * 0.2} ${-r * 0.4} ${r * 0.5} 0`, TK.fine, TK.ink, 0.5)).join('');
    return `<g transform="${xf} rotate(${f1(sw)} 50 -40)">${cl.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + TK.w / 2}" fill="${TK.ink}"/>`).join('')}${cl.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - TK.w / 2}" fill="${c.ear}"/>`).join('')}${curls}</g>`;
  }
  let o = tkOl(tkPath(TK_EARS[c.ears]), c.ear);
  if (c.ears === 'retriever' || c.ears === 'silky') o += tkLine('M 68 -14 Q 76 12 72 34') + tkLine('M 80 4 Q 84 22 80 40', TK.fine, TK.ink, 0.6);
  if (c.ears === 'silky') o += tkLine('M 86 44 Q 94 84 90 114') + tkLine('M 74 52 Q 78 92 76 118', TK.fine, TK.ink, 0.6);
  if (c.ears === 'beagle') o += tkLine('M 70 -6 Q 82 30 78 66', TK.fine, TK.ink, 0.5);
  if (c.ears === 'rose') o += tkLine('M 62 -74 Q 66 -60 72 -50');
  return `<g transform="${xf} rotate(${f1(sw * (c.ears === 'rose' ? 0.3 : 1))} 46 -46)">${o}</g>`;
}
function tkHeadFront(c, p, t) {
  const blink = p.lid ?? 0, look = p.look || [0, 0], jaw = clamp(p.jaw ?? 0), brow = c.grumpy ? 1 : p.brow ?? 0, bull = c.jowls;
  let o = '';
  if (c.topknot) o += tkOl(tkPath([[-48, -40], [-58, -76], [-40, -112], [-6, -124], [30, -116], [54, -84], [48, -42]]), c.light) + tkLine('M -30 -92 q 8 -10 16 0 M 2 -102 q 8 -10 16 0 M -14 -76 q 8 -10 16 0', TK.fine, TK.ink, 0.45);
  if (c.ears !== 'rose') o += tkEarFront(c, t, p, false) + tkEarFront(c, t, p, true);
  const half = bull
    ? [[0, -62], [34, -60], [60, -48], [76, -22], [80, 8], [76, 34], [60, 54], [30, 64], [0, 66]]
    : [[0, -62, 1], [6, -71, 1], [12, -61], [34, -60], [54, -46], [64, -22], [66, 0], [73, 9, 1], [64, 15], [71, 25, 1], [60, 29], [63, 39, 1], [50, 42], [38, 54], [18, 61], [0, 62]];
  o += tkOl(tkPath(tkSym(half)), c.base);
  if (c.scruff) o += tkOl(tkPath([[-22, -58, 1], [-15, -80, 1], [-6, -61], [2, -86, 1], [9, -62], [19, -77, 1], [24, -59, 1]]), c.base);
  if (c.silky) o += tkOl(tkPath([[-42, -46], [-26, -72], [4, -78], [32, -70], [46, -44], [26, -54], [6, -50, 1], [-10, -56], [-28, -50]]), c.light);
  if (c.blaze) o += `<path d="M -7 -62 Q 0 -66 7 -62 L 12 -2 L -12 -2 Z" fill="${c.light}"/>`;
  // muzzle
  if (c.whiteMuzzle) o += `<path d="${tkPath([[-36, 6], [-20, -6], [0, -8], [20, -6], [36, 6], [36, 32], [20, 52], [0, 56], [-20, 52], [-36, 32]])}" fill="${c.light}"/>`;
  else if (c.base !== c.light && !bull) o += `<path d="${tkPath([[-34, 10], [-18, 2], [0, 0], [18, 2], [34, 10], [34, 32], [20, 50], [0, 56], [-20, 50], [-34, 32]])}" fill="${c.light}" opacity="0.7"/>`;
  if (bull) {
    // underbite jaw, then two drooping jowls over it, wrinkles on the brow and nose
    o += tkOl(tkPath(tkSym([[0, 52], [26, 52], [40, 62], [30, 82], [0, 86]])), c.shade);
    for (const sd of [-1, 1]) o += tkOl(tkPath([[0, 6], [sd * 24, 4], [sd * 52, 16], [sd * 64, 40], [sd * 56, 62], [sd * 34, 70], [sd * 12, 64], [0, 52]]), c.light);
    o += `<path d="M -24 80 L -19 63 L -14 80 Z M 14 80 L 19 63 L 24 80 Z" fill="#fff" stroke="${TK.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    o += tkLine('M -40 46 Q -20 36 0 44 Q 20 36 40 46', TK.w) + tkLine('M -26 -40 Q 0 -48 26 -40 M -20 -30 Q 0 -36 20 -30 M -16 -2 Q 0 -8 16 -2', TK.fine, TK.ink, 0.65);
  }
  else o += tkLine('M -19 -2 Q -25 10 -27 22', TK.fine, TK.ink, 0.55) + tkLine('M 19 -2 Q 25 10 27 22', TK.fine, TK.ink, 0.55);
  // eyes and brows
  const ex = bull ? 34 : 26, ey = bull ? -14 : -10;
  for (const s of [-1, 1]) {
    const x = s * ex + look[0] * 2.5, y = ey + look[1] * 2.5;
    if ((p.wink ?? 0) > 0.5 && s === -1) o += tkLine(`M ${x - 8} ${y + 1} Q ${x} ${y + 7} ${x + 8} ${y + 1}`, TK.w);
    else {
      o += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="6.8" ry="${f1(Math.max(0.8, 7.8 * (1 - blink)))}" fill="${TK.ink}"/>`;
      if (blink < 0.5) o += `<circle cx="${f1(x + 2.2)}" cy="${f1(y - 2.6)}" r="2.4" fill="#fff"/>`;
      if (c.lashes) o += tkLine(`M ${f1(x + s * 5)} ${f1(y - 5)} l ${s * 6} -5 M ${f1(x + s * 7)} ${f1(y - 1)} l ${s * 7} -2`, TK.fine + 0.5);
    }
    // brow: soft line above the eye; grumpy/angry brows slant down toward the middle
    o += tkLine(`M ${f1(s * (ex - 10))} ${f1(ey - 16 + brow * 4)} Q ${f1(s * ex)} ${f1(ey - 21 - brow)} ${f1(s * (ex + 9))} ${f1(ey - 17 - brow * 3)}`, 2.8, c.brow || (c.base === c.light ? '#bba996' : c.shade));
  }
  // nose and mouth
  const ny = bull ? 10 : 16, nw = bull ? 24 : 17;
  if (jaw > 0.05) {
    const jh = 10 + jaw * 34;
    o += tkOl(tkPath([[-24, ny + 14, 1], [0, ny + 18], [24, ny + 14, 1], [17, ny + 14 + jh], [0, ny + 18 + jh], [-17, ny + 14 + jh]]), '#5a1a1e') + `<path d="M -12 ${f1(ny + 14 + jh * 0.62)} Q 0 ${f1(ny + 8 + jh * 0.5)} 12 ${f1(ny + 14 + jh * 0.62)} Q 0 ${f1(ny + 18 + jh)} -12 ${f1(ny + 14 + jh * 0.62)} Z" fill="#e8758a"/>`;
  } else if (bull) {
    o += '';
  } else {
    const sm = p.smile ?? 1;
    o += tkLine(`M 0 ${ny + 10} L 0 ${ny + 18}`, TK.w) + tkLine(`M -36 ${ny + 12} Q -20 ${f1(ny + 24 + 5 * sm)} 0 ${ny + 18} Q 20 ${f1(ny + 24 + 5 * sm)} 36 ${ny + 12}`, TK.w);
    o += tkLine(`M -36 ${ny + 12} l -4 -4 M 36 ${ny + 12} l 4 -4`, TK.w) + tkLine(`M -12 ${ny + 34} Q 0 ${ny + 40} 12 ${ny + 34}`, TK.fine, TK.ink, 0.6);
  }
  o += tkOl(tkPath([[-nw, ny - 6], [0, ny - 10], [nw, ny - 6], [nw * 0.85, ny + 4], [0, ny + 12], [-nw * 0.85, ny + 4]]), c.nose || '#3a2a26', 2.4) + `<ellipse cx="-3" cy="${ny - 4}" rx="6" ry="2.6" fill="#fff" opacity="0.4"/>`;
  if (c.ears === 'rose') o += tkEarFront(c, t, p, false) + tkEarFront(c, t, p, true);
  return o + tkHeadAcc(c, 'front');
}
function tkHeadSide(c, p, t) {
  // facing +x
  const L = c.muzzle, jaw = clamp(p.jaw ?? 0), bull = c.jowls, look = p.look || [0, 0];
  const nx = 38 + 50 * L;
  let o = '';
  if (c.topknot) o += tkOl(tkPath([[-50, -36], [-56, -70], [-30, -106], [6, -114], [34, -98], [40, -60], [12, -54]]), c.light) + tkLine('M -30 -86 q 8 -10 16 0 M 0 -94 q 8 -10 16 0', TK.fine, TK.ink, 0.45);
  const skull = bull
    ? [[-60, 0], [-56, -40], [-28, -66], [10, -68], [42, -56], [58, -36], [64, -20], [64, -4], [60, 30], [40, 56], [6, 62], [-26, 56], [-52, 36]]
    : [[-58, -4], [-54, -40], [-28, -64], [6, -68], [36, -56], [50, -36], [nx - 12, -18], [nx + 4, -12], [nx + 8, 0], [nx + 2, 10], [nx - 18, 18], [28, 22], [18, 36], [-4, 50], [-34, 46], [-54, 24]];
  o += tkOl(tkPath(skull), c.base);
  if (c.whiteMuzzle) o += `<path d="${tkPath([[22, -24], [nx - 12, -18], [nx + 4, -10], [nx + 4, 8], [nx - 16, 16], [26, 26], [12, 30]])}" fill="${c.light}"/>`;
  else if (c.base !== c.light && !bull) o += `<path d="${tkPath([[30, -12], [nx - 10, -12], [nx + 2, 6], [nx - 16, 16], [26, 24]])}" fill="${c.light}" opacity="0.65"/>`;
  if (c.blaze) o += `<path d="M 30 -58 Q 42 -50 48 -34 L ${nx - 12} -19 L 40 -22 Q 34 -42 22 -54 Z" fill="${c.light}"/>`;
  if (c.silky) o += tkOl(tkPath([[-46, -40], [-26, -66], [8, -72], [36, -56], [14, -56], [-10, -58], [-30, -44]]), c.light);
  if (c.scruff) o += tkOl(tkPath([[-32, -54, 1], [-26, -78, 1], [-16, -60], [-6, -84, 1], [4, -63], [14, -74, 1], [20, -56, 1]]), c.base);
  if (bull) {
    o += tkOl(tkPath([[44, 54], [72, 50], [76, 66], [50, 72]]), c.shade);
    o += tkOl(tkPath([[48, -10], [66, -14], [78, -6], [82, 10], [82, 28], [78, 48], [62, 62], [44, 64], [36, 40], [40, 12]]), c.light);
    o += `<path d="M 66 66 L 70 52 L 74 66 Z" fill="#fff" stroke="${TK.ink}" stroke-width="1.6" stroke-linejoin="round"/>` + tkLine('M 8 -54 Q 22 -60 34 -52 M 12 -44 Q 24 -48 34 -42 M 48 -20 Q 56 -26 62 -22', TK.fine, TK.ink, 0.6);
  }
  if (jaw > 0.05) {
    o += tkOl(tkPath([[24, 18, 1], [nx - 6, 12, 1], [nx - 8, 18 + jaw * 28, 1], [28, 28 + jaw * 8, 1]]), '#5a1a1e') + `<path d="M 34 ${f1(24 + jaw * 10)} Q ${f1(nx - 18)} ${f1(18 + jaw * 14)} ${f1(nx - 12)} ${f1(20 + jaw * 24)} Q 44 ${f1(32 + jaw * 16)} 34 ${f1(24 + jaw * 10)} Z" fill="#e8758a"/>`;
  } else o += bull ? tkLine('M 82 28 Q 66 38 50 34', TK.w) : tkLine(`M ${nx - 6} 12 Q ${f1(nx - 26)} 20 26 18`, TK.w);
  o += bull ? tkOl(tkPath([[62, -18], [76, -18], [86, -8], [82, 2], [66, 0]]), c.nose || '#3a2a26', 2.4) : tkOl(tkPath([[nx - 8, -16], [nx + 6, -14], [nx + 13, -3], [nx + 8, 7], [nx - 6, 4]]), c.nose || '#3a2a26', 2.4);
  const ex = bull ? 30 : 28, ey = -24;
  if ((p.wink ?? 0) > 0.5) o += tkLine(`M ${ex - 6} ${ey} Q ${ex} ${ey + 5} ${ex + 6} ${ey}`, TK.w);
  else {
    o += `<ellipse cx="${f1(ex + look[0] * 2)}" cy="${f1(ey + look[1] * 2)}" rx="5" ry="${f1(Math.max(0.8, 6.8 * (1 - (p.lid ?? 0))))}" fill="${TK.ink}"/><circle cx="${f1(ex + 1.8 + look[0] * 2)}" cy="${f1(ey - 2.2 + look[1] * 2)}" r="1.9" fill="#fff"/>`;
    if (c.lashes) o += tkLine(`M ${ex + 3} ${ey - 5} l 5 -4 M ${ex + 5} ${ey - 2} l 6 -2`, TK.fine + 0.5);
  }
  o += tkLine(`M ${ex - 8} ${ey - 11 + (c.grumpy ? -2 : 0)} Q ${ex} ${ey - 16} ${ex + 8} ${ey - 13 + (c.grumpy ? 5 : 0)}`, 2.6, c.brow || (c.base === c.light ? '#bba996' : c.shade));
  const sw = Math.sin(t * 3) * 2 + (p.earSwing ?? 0);
  const EAR = {
    retriever: [[-6, -54], [16, -52], [22, -22], [18, 18], [12, 46, 1], [6, 36], [2, 50, 1], [-4, 38], [-11, 46, 1], [-14, 16], [-16, -24]],
    beagle: [[-4, -50], [18, -48], [24, -12], [22, 40], [12, 70], [-4, 66], [-12, 32], [-14, -16]],
    silky: [[-6, -56], [18, -54], [24, -12], [26, 60], [22, 106, 1], [14, 92], [8, 110, 1], [0, 94], [-6, 106, 1], [-10, 60], [-16, -12]],
    rose: [[-34, -56, 1], [-14, -80, 1], [14, -72, 1], [6, -56, 1]],
  }[c.ears];
  if (EAR) o += `<g transform="translate(-16 4) rotate(${f1(sw)} 0 -52)">${tkOl(tkPath(EAR), c.ear)}${c.ears === 'retriever' || c.ears === 'silky' ? tkLine('M 4 -20 Q 8 6 4 30', TK.fine, TK.ink, 0.6) : ''}</g>`;
  if (c.ears === 'poodle') {
    const cl = [[-12, -10, 22], [-8, 18, 21], [-12, 44, 19]];
    o += `<g transform="rotate(${f1(sw)} -10 -30)">${cl.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + TK.w / 2}" fill="${TK.ink}"/>`).join('')}${cl.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - TK.w / 2}" fill="${c.ear}"/>`).join('')}</g>`;
  }
  return o + tkHeadAcc(c, 'side');
}
function tkHeadBack(c, p, t) {
  const bull = c.jowls;
  let o = '';
  if (c.topknot) o += tkOl(tkPath([[-48, -40], [-58, -76], [-40, -112], [-6, -124], [30, -116], [54, -84], [48, -42]]), c.light);
  const half = bull ? [[0, -70], [38, -66], [64, -44], [74, -10], [72, 26], [56, 52], [26, 64], [0, 66]]
    : [[0, -62], [32, -60], [54, -46], [64, -20], [66, 6], [62, 30], [46, 50], [20, 60], [0, 62]];
  o += tkOl(tkPath(tkSym(half)), c.base);
  if (c.silky) o += tkOl(tkPath([[-44, -46], [-26, -72], [4, -78], [32, -70], [46, -44], [30, 20], [0, 40], [-30, 20]]), c.light) + tkLine('M -16 -50 Q -18 0 -12 30 M 14 -50 Q 16 0 12 30', TK.fine, TK.ink, 0.5);
  else o += tkLine('M -18 24 l 6 14 M 0 30 l 2 16 M 18 24 l -6 14', TK.fine, TK.ink, 0.6) + tkLine('M -30 -36 Q 0 -50 30 -36', TK.fine, TK.ink, 0.35);
  if (c.scruff) o += tkOl(tkPath([[-22, -58, 1], [-15, -80, 1], [-6, -61], [2, -86, 1], [9, -62], [19, -77, 1], [24, -59, 1]]), c.base);
  o += tkEarFront(c, t, p, false) + tkEarFront(c, t, p, true);
  return o + tkHeadAcc(c, 'back');
}
function tkHeadAcc(c, view) {
  const a = c.acc || {};
  let o = '';
  if (a.bow) {
    const [x, y] = view === 'side' ? [-8, -106] : [view === 'back' ? -28 : 28, -106];
    o += `<g transform="translate(${x} ${y}) rotate(${view === 'side' ? -10 : 12})">${tkOl('M 0 0 L -21 -14 L -21 14 Z M 0 0 L 21 -14 L 21 14 Z', a.bow, 2.4)}${tkOl('M -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0', a.bow, 2.4)}</g>`;
  }
  if (a.tiara) o += `<g transform="translate(${view === 'side' ? -8 : 0} -66) ${view === 'side' ? 'scale(0.7 1)' : ''}">${tkOl('M -30 6 L -26 -10 L -16 0 L -6 -20 L 6 -20 L 16 0 L 26 -10 L 30 6 Z', '#f6d55c', 2.2)}<circle cx="0" cy="-16" r="4.5" fill="#ff4f9a" stroke="${TK.ink}" stroke-width="1.5"/></g>`;
  return o;
}

// ---------- tails (local to the tail root) ----------
function tkTail(c, K, view, t, p) {
  const wag = (p.wag ?? 6) * Math.sin(t * (p.wagSpeed ?? 5));
  const root = view === 'side' ? [-42 * K.b.sw, K.hipY - 4] : [0, K.hipY + (view === 'back' ? -14 : 22)];
  const feather = c.tail === 'feather' ? 1 : 0.45;
  let body = '';
  if (c.tail === 'feather' || c.tail === 'plain') {
    const fe = feather;
    if (view === 'side') {
      const pts = [[6, -10], [-18, 40], [-56, 108], [-104, 160], [-150, 196, 1], [-124, 184], [-116, 184 + 14 * fe, 1], [-100, 172], [-92, 172 + 14 * fe, 1], [-76, 156], [-68, 156 + 14 * fe, 1], [-52, 134], [-44, 134 + 13 * fe, 1], [-30, 106], [-22, 106 + 12 * fe, 1], [-10, 66], [12, 8]];
      body = tkOl(tkPath(pts), c.base) + tkLine('M -14 40 Q -44 104 -100 164', TK.fine, TK.ink, 0.5);
    } else {
      const k = view === 'back' ? 1 : 0.74;
      const half = [[0, -2], [12, 0], [20, 24], [26, 50], [26 + 8 * fe, 72, 1], [24, 74], [24 + 8 * fe, 102, 1], [21, 106], [20 + 8 * fe, 136, 1], [15, 140], [12 + 4 * fe, 166, 1], [7, 168], [0, 200, 1]];
      body = tkOl(tkPath(tkSym(half.map(([x, y, sh]) => [x * k, y * k, sh]))), c.base) + tkLine(`M 0 ${30 * k} Q ${4 * k} ${100 * k} 0 ${170 * k}`, TK.fine, TK.ink, 0.5);
    }
  } else if (c.tail === 'whip') {
    if (view === 'front') return '';
    const pts = view === 'side' ? [[-8, -6], [-38, -52], [-46, -120], [-38, -152], [-28, -146], [-32, -112], [-22, -54], [6, 4]] : [[-11, 0], [-14, -60], [-9, -128], [0, -148], [9, -128], [14, -60], [11, 0]];
    const tip = view === 'side' ? [[-46, -120], [-38, -152], [-28, -146], [-32, -114]] : [[-9, -116], [0, -148], [9, -116]];
    body = tkOl(tkPath(pts), c.base) + `<path d="${tkPath(tip)}" fill="${c.light}" stroke="${TK.ink}" stroke-width="${TK.w}" stroke-linejoin="round"/>`;
  } else if (c.tail === 'stub') {
    if (view === 'front') return '';
    body = tkOl(tkPath(view === 'side' ? [[-4, -8], [-22, -18], [-24, 2], [-4, 8]] : [[-13, -2], [0, -16], [13, -2], [0, 10]]), c.base);
  } else if (c.tail === 'pom') {
    if (view === 'front') return '';
    const tip = view === 'side' ? [-34, -62] : [0, -72];
    const stem = view === 'side' ? `M 0 0 Q -20 -20 ${tip[0]} ${tip[1]}` : `M 0 0 L 0 ${tip[1]}`;
    body = `<path d="${stem}" stroke="${TK.ink}" stroke-width="${12 + 2 * TK.w}" fill="none" stroke-linecap="round"/><path d="${stem}" stroke="${c.base}" stroke-width="12" fill="none" stroke-linecap="round"/>${tkCirc(tip[0], tip[1], 23, c.light)}`;
  }
  return `<g transform="translate(${f1(root[0])} ${f1(root[1])}) rotate(${f1(wag)})">${body}</g>`;
}

// ---------- hands and feet ----------
function tkPaw(c, H, E, back, lw, col) {
  const a = tkAng(E, H) - 90;
  col = col || (c.socks || c.poms ? c.light : c.base);
  let o = `<g transform="translate(${f1(H[0])} ${f1(H[1])}) rotate(${f1(a)}) scale(${f1(lw)})">`;
  if (c.poms) o += tkCirc(0, -10, 18, c.light);
  o += tkOl('M -15 -6 C -17 12 -10 23 0 23 C 10 23 17 12 15 -6 Z', col);
  if (back) o += `<ellipse cx="0" cy="9" rx="6.5" ry="5" fill="#6a4632"/>${[-8, -3, 3, 8].map((x) => `<circle cx="${x}" cy="${Math.abs(x) > 5 ? 16 : 19}" r="2.6" fill="#6a4632"/>`).join('')}`;
  else o += tkLine('M -5 23 L -5 15 M 5 23 L 5 15', TK.fine);
  return o + '</g>';
}
function tkFoot(c, A, view, lw, col) {
  col = col || (c.socks || c.poms ? c.light : c.base);
  let o = c.poms ? tkCirc(A[0], A[1] - 14, 20, c.light) : '';
  if (view === 'side') return o + tkOl(tkPath([[A[0] - 14, A[1] - 12], [A[0] + 10, A[1] - 8], [A[0] + 34 * lw, A[1] + 2], [A[0] + 38 * lw, A[1] + 14, 1], [A[0] - 16, A[1] + 14, 1]]), col) + tkLine(`M ${f1(A[0] + 26 * lw)} ${f1(A[1] + 14)} l -2 -8 M ${f1(A[0] + 15 * lw)} ${f1(A[1] + 14)} l -2 -8`, TK.fine);
  o += tkOl(tkPath([[A[0] - 26 * lw, A[1] + 14, 1], [A[0] - 24 * lw, A[1] - 3], [A[0], A[1] - 11], [A[0] + 24 * lw, A[1] - 3], [A[0] + 26 * lw, A[1] + 14, 1]]), col);
  if (view === 'front') o += tkLine(`M ${f1(A[0] - 9 * lw)} ${f1(A[1] + 14)} l 0 -8 M ${f1(A[0] + 9 * lw)} ${f1(A[1] + 14)} l 0 -8`, TK.fine);
  return o;
}

// ---------- the dog body ----------
// c: a TOON_DOGS entry or its key. p: view ('front' | 'side' | 'back'), x, y (ground), s, flip,
//    pose: hN/hF (hand targets) and fN/fF (foot targets) in local units, lean, headTilt, crouch,
//    wag, wagSpeed, earSwing; face: lid, look, brow, jaw, smile, wink.
function toonDog(c, p, t = 0) {
  if (typeof c === 'string') c = TOON_DOGS[c];
  const view = p.view || 'front', s = p.s ?? 1, f = p.flip ?? 1;
  const K = tkDogSkel(c, p);
  const body = view === 'side' ? tkDogSide(c, K, p, t) : tkDogFrontBack(c, K, p, t, view === 'back');
  return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">${body}</g>`;
}
function tkDogFrontBack(c, K, p, t, back) {
  const { sw, hw, shY, hipY, lw } = K, acc = c.acc || {}, shirt = acc.shirt;
  const br = Math.sin(t * 2.2) * 1.5;
  let o = `<ellipse cx="0" cy="4" rx="${f1(hw * 2.2 + 50)}" ry="15" fill="#000" opacity="0.16"/>`;
  if (!back) o += tkTail(c, K, 'front', t, p);
  // legs
  const legs = [], feet = [];
  for (const sd of [-1, 1]) {
    const Hp = [sd * hw, hipY + 4], A = (sd > 0 ? p.fN : p.fF) || [sd * (hw + 4), K.ankleY];
    const [Kn] = ik(Hp, A, K.thigh, K.shin, sd > 0 ? -1 : 1);
    legs.push(tkLimb([Hp, Kn, A], [54 * lw, 38 * lw], [c.base, c.socks ? c.light : c.base]));
    feet.push(tkFoot(c, A, back ? 'back' : 'front', lw));
  }
  o += legs.map((l) => l[0]).join('') + legs.map((l) => l[1]).join('') + feet.join('');
  for (const sd of [-1, 1]) o += tkTuft(sd * (hw + 27 * lw), hipY + 60, sd, c.base) + tkTuft(sd * (hw + 24 * lw), hipY + 100, sd, c.base, 0.8);
  // torso (covers the tops of the thighs)
  const wy = (shY + hipY) / 2;
  const half = [[0, shY - 30], [sw * 0.55, shY - 26], [sw, shY + br], [sw * 1.08, shY + 34], ...tkFur([sw * 1.08, shY + 40], [sw * 1.06, shY + 84], [sw * 0.94, shY + 124], 3, 9, -1, 7), [sw * 0.94, shY + 124], [sw * 0.92, wy + 30], [sw * 0.95, hipY - 26], [hw + 30 * lw, hipY + 12], [hw + 26 * lw, hipY + 38], [hw * 0.45, hipY + 32], [0, hipY + 42]];
  o += tkOl(tkPath(tkSym(half)), c.base);
  if (!back) {
    if (c.base !== c.light && !shirt) o += `<path d="${tkPath(tkSym([[0, shY + 40], [sw * 0.72, shY + 20], [sw * 0.7, shY + 130], [sw * 0.64, hipY - 40], [hw * 0.7, hipY + 22], [0, hipY + 38]]))}" fill="${c.light}"/>`;
    // the ruff: a fur bib from under the chin to a point on the chest
    if (!c.jowls) {
      const rs = sw * 0.92, tip = shY + 108;
      const ruff = [[-sw * 0.5, shY - 26], [sw * 0.5, shY - 26], [sw * 0.94, shY - 2], [rs * 0.96, shY + 8, 1], ...tkFur([rs * 0.96, shY + 8], [rs * 0.5, shY + 70], [0, tip], 5, 15, -1, 11, 1), [0, tip, 1], ...tkFur([0, tip], [-rs * 0.5, shY + 70], [-rs * 0.96, shY + 8], 5, 15, -1, 12, -1), [-rs * 0.96, shY + 8, 1]];
      o += `<path d="${tkPath(ruff)}" fill="${c.base}"/>` + tkLine(tkPath(ruff.slice(3), false), TK.fine, TK.ink, 0.9);
      if (c.ruff || c.scruff || c.silky) o += tkLine(`M -24 ${shY + 6} q 4 16 10 28 M 0 ${shY + 14} q -2 22 0 40 M 24 ${shY + 6} q -4 16 -10 28 M -44 ${shY - 4} q 6 14 14 22 M 44 ${shY - 4} q -6 14 -14 22 M -12 ${shY + 50} q 4 12 8 20 M 12 ${shY + 50} q -4 12 -8 20`, TK.fine, TK.ink, 0.65);
    }
    o += tkLine(`M -14 ${hipY - 40} q 14 6 28 0`, TK.fine, TK.ink, 0.3);
  } else {
    if (c.saddle) o += `<path d="${tkPath(tkSym([[0, shY + 20], [sw * 0.6, shY + 24, 1], ...tkFur([sw * 0.6, shY + 24], [sw * 0.9, shY + 90], [sw * 0.6, hipY - 30], 4, 9, -1, 43, 1), [sw * 0.6, hipY - 30, 1], ...tkFur([sw * 0.6, hipY - 30], [sw * 0.3, hipY - 10], [0, hipY - 18], 2, 8, -1, 44, 1), [0, hipY - 18]]))}" fill="${c.saddle}" stroke="${TK.ink}" stroke-width="${TK.fine}"/>`;
    o += tkLine(`M -26 ${shY + 40} q 6 14 2 30 M 26 ${shY + 40} q -6 14 -2 30 M 0 ${shY + 80} l 0 30 M -32 ${hipY - 76} q 8 10 6 26 M 32 ${hipY - 76} q -8 10 -6 26 M -14 ${shY - 6} q 2 12 -2 22 M 14 ${shY - 6} q -2 12 2 22`, TK.fine, TK.ink, 0.6);
  }
  if (shirt) {
    o += tkOl(tkPath(tkSym([[0, shY - 28], [sw * 0.55, shY - 24], [sw, shY + br], [sw * 1.08, shY + 34], [sw * 0.96, shY + 124], [sw * 0.94, wy + 30], [sw * 0.95, hipY - 20], [0, hipY - 12]])), shirt);
    if (!back) {
      o += tkOl(`M -22 ${shY - 26} L 0 ${shY + 8} L 22 ${shY - 26} L 34 ${shY - 6} L 0 ${shY + 20} L -34 ${shY - 6} Z`, '#fff', 2.2);
      o += tkOl(`M -10 ${shY + 8} L 10 ${shY + 8} L 7 ${shY + 24} L 14 ${shY + 120} L 0 ${shY + 140} L -14 ${shY + 120} L -7 ${shY + 24} Z`, acc.tie, 2.2);
      o += `<g transform="translate(${f1(-sw * 0.52)} ${f1(shY + 70)}) scale(${p.flip === -1 ? -1 : 1} 1)">${tkOl('M -32 -13 L 32 -13 L 32 13 L -32 13 Z', '#fff', 2)}<text x="0" y="5" font-family="Anton" font-size="13" fill="#222" text-anchor="middle">${esc(acc.tag)}</text></g>`;
    } else o += tkOl(`M -28 ${shY - 26} Q 0 ${shY - 10} 28 ${shY - 26} L 24 ${shY - 10} Q 0 ${shY + 4} -24 ${shY - 10} Z`, '#fff', 2.2);
  }
  if (!back && acc.chain) {
    o += tkLine(`M ${-sw * 0.55} ${shY - 14} Q 0 ${shY + 74} ${sw * 0.55} ${shY - 14}`, 6, '#f2c230') + tkLine(`M ${-sw * 0.55} ${shY - 14} Q 0 ${shY + 74} ${sw * 0.55} ${shY - 14}`, 1.4, '#9a7410');
    o += `<g transform="translate(0 ${shY + 36})">${tkOl('M -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0', '#f2c230', 2.2)}<text x="0" y="6" font-family="Anton" font-size="17" fill="#7a5a08" text-anchor="middle">$</text></g>`;
  }
  if (!back && acc.pearls) for (let i = 0; i <= 10; i++) { const u = i / 10; o += `<circle cx="${f1(lerp(-sw * 0.5, sw * 0.5, u))}" cy="${f1(shY - 12 + Math.sin(u * Math.PI) * 46)}" r="5.2" fill="#fbf6ee" stroke="${TK.ink}" stroke-width="1.5"/>`; }
  // arms
  const arms = [];
  for (const sd of [-1, 1]) {
    const S = [sd * sw * 0.92, shY + 20], Hd = (sd > 0 ? p.hN : p.hF) || [sd * (sw + 24), shY + 180 + br];
    const [E] = ik(S, Hd, K.up, K.fore, sd > 0 ? -1 : 1);
    arms.push({ S, E, Hd, sd, L: tkLimb([S, E, Hd], [34 * lw, 28 * lw], [shirt || c.base, c.socks ? c.light : c.base]) });
  }
  o += arms.map((a) => a.L[0]).join('') + arms.map((a) => a.L[1]).join('');
  for (const { S, E, Hd, sd } of arms) {
    if (shirt) o += tkLine(`M ${f1(lerp(S[0], E[0], 0.6) - 18)} ${f1(lerp(S[1], E[1], 0.6))} L ${f1(lerp(S[0], E[0], 0.6) + 18)} ${f1(lerp(S[1], E[1], 0.6))}`, 2.2);
    else o += tkTuft(E[0] + sd * 16 * lw, E[1] - 6, sd, c.base) + tkTuft(lerp(S[0], E[0], 0.45) + sd * 17 * lw, lerp(S[1], E[1], 0.45), sd, c.base, 0.8);
    o += tkPaw(c, Hd, E, back, lw);
  }
  const head = back ? tkHeadBack(c, p, t) : tkHeadFront(c, p, t);
  o += `<g transform="translate(0 ${f1(K.headY + br * 0.6)}) rotate(${f1(p.headTilt ?? 0)}) scale(${K.hs})">${head}</g>`;
  if (back) o += tkTail(c, K, 'back', t, p);
  return o;
}
function tkDogSide(c, K, p, t) {
  const { shY, hipY, lw } = K, acc = c.acc || {}, k = K.b.sw;
  const br = Math.sin(t * 2.2) * 1.5;
  let o = `<ellipse cx="0" cy="4" rx="${f1(64 + 34 * k)}" ry="14" fill="#000" opacity="0.16"/>`;
  const legPose = (near) => {
    const Hp = [-10 * k, hipY + 8], A = (near ? p.fN : p.fF) || [near ? -2 : -18, K.ankleY];
    return [Hp, ik(Hp, A, K.thigh, K.shin, -1)[0], A];
  };
  const armPose = (near) => {
    const S = [16 * k, shY + 24], Hd = (near ? p.hN : p.hF) || [near ? 30 * k : 18 * k, shY + 180 + br];
    return [S, ik(S, Hd, K.up, K.fore, 1)[0], Hd];
  };
  // far limbs in shade, then the tail, behind the body
  const fl = legPose(false), fa = armPose(false);
  const fL = tkLimb(fl, [48 * lw, 34 * lw], c.shade), fA = tkLimb(fa, [30 * lw, 25 * lw], acc.shirt ? '#d9d9d2' : c.shade);
  o += fL[0] + fL[1] + tkFoot(c, fl[2], 'side', lw, c.shade) + tkTail(c, K, 'side', t, p);
  o += fA[0] + fA[1] + tkPaw(c, fa[2], fa[1], false, lw, c.shade);
  // torso, with fur tufts down the chest
  const pts = [[-30 * k, shY - 36], [-44 * k, shY + 20], [-50 * k, shY + 110], [-50 * k, hipY - 30], [-46 * k, hipY + 16], [-30 * k, hipY + 42], [10 * k, hipY + 40], [28 * k, hipY - 10], [36 * k, hipY - 80], [50 * k, shY + 116],
    ...tkFur([50 * k, shY + 116], [62 * k, shY + 60], [46 * k, shY + 4], 4, 11, 1, 31, -1), [46 * k, shY + 4], [30 * k, shY - 36]];
  o += tkOl(tkPath(pts), c.base);
  if (c.saddle) {
    const sd = [[-34 * k, shY - 10], [-46 * k, shY + 30], [-50 * k, shY + 110], [-50 * k, hipY - 24], [-24, hipY - 30, 1], ...tkFur([-24, hipY - 30], [-6, shY + 110], [-14, shY + 10], 5, 9, -1, 41, -1), [-14, shY + 10, 1]];
    o += `<path d="${tkPath(sd)}" fill="${c.saddle}"/>` + tkLine(tkPath(sd.slice(4), false), TK.fine, TK.ink, 0.9);
  }
  if (c.base !== c.light) {
    const cream = [[32 * k, shY - 18], [54 * k, shY + 44], [50 * k, shY + 112], [36 * k, hipY - 80], [24 * k, hipY + 16], [14 * k, hipY + 30], [14 * k, hipY - 40], [22 * k, shY + 120], [20 * k, shY + 40]];
    o += `<path d="${tkPath(cream)}" fill="${c.light}"/>` + tkLine(tkPath(tkFur([20 * k, shY + 30], [12 * k, shY + 90], [16 * k, shY + 150], 4, 10, 1, 33, 1), false), TK.fine, TK.ink, 0.7);
  }
  if (acc.shirt) {
    o += tkOl(tkPath([[-30 * k, shY - 32], [-44 * k, shY + 20], [-50 * k, shY + 110], [-50 * k, hipY - 14], [22 * k, hipY - 8], [36 * k, hipY - 80], [52 * k, shY + 110], [56 * k, shY + 50], [46 * k, shY], [30 * k, shY - 34]]), acc.shirt);
    o += tkOl(`M ${32 * k} ${shY - 24} L ${46 * k} ${shY - 8} L ${56 * k} ${shY + 8} L ${44 * k} ${shY + 12} Z`, '#fff', 2) + tkOl(`M ${50 * k} ${shY + 8} L ${58 * k} ${shY + 12} L ${58 * k} ${shY + 104} L ${52 * k} ${shY + 122} L ${46 * k} ${shY + 104} Z`, acc.tie, 2);
  }
  if (acc.chain) o += tkLine(`M ${-12 * k} ${shY - 22} Q ${30 * k} ${shY + 54} ${50 * k} ${shY - 6}`, 6, '#f2c230') + `<g transform="translate(${40 * k} ${shY + 32})">${tkOl('M -13 0 a 13 13 0 1 0 26 0 a 13 13 0 1 0 -26 0', '#f2c230', 2)}</g>`;
  if (acc.pearls) for (let i = 0; i <= 6; i++) { const u = i / 6; o += `<circle cx="${f1(lerp(-6, 44 * k, u))}" cy="${f1(shY - 14 + Math.sin(u * Math.PI * 0.9) * 34)}" r="5.2" fill="#fbf6ee" stroke="${TK.ink}" stroke-width="1.5"/>`; }
  // near leg, neck ruff, near arm
  const nl = legPose(true), na = armPose(true);
  const nL = tkLimb(nl, [54 * lw, 38 * lw], [c.base, c.socks ? c.light : c.base]);
  o += nL[0] + nL[1] + tkFoot(c, nl[2], 'side', lw) + tkLine(`M ${f1(nl[0][0] - 26 * lw)} ${f1(nl[0][1] + 24)} l -8 14 M ${f1(nl[0][0] - 24 * lw)} ${f1(nl[0][1] + 56)} l -7 12`, TK.fine, TK.ink, 0.7);
  if (!c.jowls) {
    const ruff = [[-24 * k, shY - 50], [34 * k, shY - 50], [44 * k, shY - 20, 1], ...tkFur([44 * k, shY - 20], [40 * k, shY + 20], [20 * k, shY + 34], 3, 12, -1, 35, 1), [20 * k, shY + 34, 1], ...tkFur([20 * k, shY + 34], [-6 * k, shY + 20], [-28 * k, shY - 10], 3, 12, -1, 36, 1), [-28 * k, shY - 10, 1]];
    o += `<path d="${tkPath(ruff)}" fill="${c.base}"/>` + tkLine(tkPath(ruff.slice(2), false), TK.fine, TK.ink, 0.9);
  }
  const nA = tkLimb(na, [34 * lw, 28 * lw], [acc.shirt || c.base, c.socks ? c.light : c.base]);
  o += nA[0] + nA[1] + tkPaw(c, na[2], na[1], false, lw);
  if (acc.shirt) o += tkLine(`M ${f1(lerp(na[0][0], na[1][0], 0.6) - 18)} ${f1(lerp(na[0][1], na[1][1], 0.6))} L ${f1(lerp(na[0][0], na[1][0], 0.6) + 18)} ${f1(lerp(na[0][1], na[1][1], 0.6))}`, 2.2);
  else o += tkLine(`M ${f1(na[1][0] - 16 * lw)} ${f1(na[1][1] - 14)} l -7 10 l 5 2`, TK.fine, TK.ink, 0.8);
  o += `<g transform="translate(${f1((c.jowls ? 8 : 20) * k)} ${f1(K.headY + 6 + br * 0.6)}) rotate(${f1(p.headTilt ?? 0)}) scale(${K.hs})">${tkHeadSide(c, p, t)}</g>`;
  return p.lean ? `<g transform="rotate(${f1(p.lean)} 0 ${f1(hipY)})">${o}</g>` : o;
}

// ---------- humans (TJR) ----------
const TOON_HUMANS = {
  tjr: { name: 'TJR', base: '#e9b994', shade: '#c99470', light: '#f6d2b2', hair: '#e3b45a', hairShade: '#b8862e', beard: '#b48650', tee: '#1c1d22', teeShade: '#2e3038', jeans: '#304060', jeansShade: '#24304a', shoe: '#1c1c1e', sole: '#f2f2f2', chain: '#d2d8de', iris: '#3d6d90' },
};
function tkHumanSkel(c, p) {
  const hipY = -332 + (p.crouch ?? 0), shY = hipY - 232;
  return { hipY, shY, headY: shY - 84, hs: 1.22, sw: 76, hw: 30, ankleY: -18, thigh: 162, shin: 156, up: 116, fore: 108 };
}
function tkFaceFront(c, p, t) {
  const blink = p.blink ?? 0, look = p.look || [0, 0], mo = clamp(p.mouth ?? 0), sm = p.smile ?? 0.4, br = p.brow ?? 0;
  let o = '';
  // ears, then the angular face: wide cheekbones, hard jaw corners, flat square chin
  for (const s of [-1, 1]) o += tkOl(`M ${s * 44} -14 Q ${s * 58} -20 ${s * 58} -2 Q ${s * 58} 14 ${s * 45} 14 Z`, c.base) + tkLine(`M ${s * 47} -8 Q ${s * 54} -6 ${s * 50} 6`, TK.fine, TK.ink, 0.6);
  const half = [[0, -60], [30, -58], [42, -46], [46, -22], [48, -4], [46, 12], [41, 28, 1], [16, 50, 1], [0, 52]];
  o += tkOl(tkPath(tkSym(half)), c.base);
  // cel shading: under the cheekbones, one side of the nose, under the lip
  for (const s of [-1, 1]) o += `<path d="M ${s * 45} 0 L ${s * 33} 8 L ${s * 40} 20 Z" fill="${c.shade}" opacity="0.35"/>`;
  o += `<path d="M 3 -14 L 9 8 L 12 13 L 4 15 Z" fill="${c.shade}" opacity="0.7"/>`;
  // beard along the jaw and chin, moustache
  o += `<path d="${tkPath(tkSym([[0, 37], [12, 37], [22, 33], [33, 18], [38, 4, 1], [46, 4, 1], [46, 12], [41, 28, 1], [16, 50, 1], [0, 52]]))}" fill="${c.beard}" opacity="0.85"/>`;
  o += tkLine('M -41 28 L -16 50 L 16 50 L 41 28', TK.w);
  // nose: long bridge, strong tip
  o += tkLine('M -4 -16 Q -5 0 -9 11', TK.fine + 0.4) + tkLine('M -9 11 Q -13 17 -6 18 M 9 11 Q 13 17 6 18 M -4 19 Q 0 21 4 19', 2.2);
  // moustache and mouth
  o += `<path d="M -15 25 Q 0 20 15 25 L 13 28 Q 0 24 -13 28 Z" fill="${c.beard}" stroke="${TK.ink}" stroke-width="1"/>`;
  if (mo > 0.05) o += tkOl(`M -10 30 Q 0 ${f1(30 + 12 * mo)} 10 30 Q 0 28 -10 30 Z`, '#4a1a14', 2);
  else o += tkLine(`M -11 31 Q 0 ${f1(31 + 4 * sm)} 11 ${f1(30 - sm)}`, 2.2);
  // eyes: almond, blue iris, heavy upper lid; brows: straight, angled down toward the nose
  for (const s of [-1, 1]) {
    const x = s * 18, y = -12;
    if ((p.wink ?? 0) > 0.5 && s === -1) { o += tkLine(`M ${x - 8} ${y} Q ${x} ${y + 5} ${x + 8} ${y}`, TK.w); }
    else {
      const h = 5.4 * (1 - blink);
      o += `<path d="M ${x - 9} ${y} Q ${x} ${f1(y - h)} ${x + 9} ${y} Q ${x} ${f1(y + h * 0.7)} ${x - 9} ${y} Z" fill="#fff" stroke="${TK.ink}" stroke-width="1.6"/>`;
      if (blink < 0.6) o += `<circle cx="${f1(x + look[0] * 3)}" cy="${f1(y + look[1] * 2)}" r="3.6" fill="${c.iris}"/><circle cx="${f1(x + look[0] * 3)}" cy="${f1(y + look[1] * 2)}" r="1.7" fill="${TK.ink}"/>`;
      o += tkLine(`M ${x - 9} ${y} Q ${x} ${f1(y - h - 1)} ${x + 9} ${y}`, TK.w);
    }
    o += `<path d="M ${s * 7} ${f1(-24 + br)} L ${s * 30} ${f1(-28 - br * 2)} L ${s * 30} ${f1(-24 - br * 2)} L ${s * 8} ${f1(-20 + br)} Z" fill="${c.hairShade}" stroke="${TK.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
  }
  // golden hair swept back
  o += tkOl(tkPath([[-46, -24], [-50, -50], [-36, -74], [-8, -86], [26, -84], [46, -70], [52, -46], [46, -24, 1], [40, -38], [18, -48], [-8, -46], [-30, -40], [-42, -30, 1]]), c.hair);
  o += tkLine('M -30 -46 Q -20 -66 6 -76 M -6 -48 Q 4 -68 28 -74 M 18 -50 Q 30 -62 42 -60', TK.fine, c.hairShade) + tkLine('M -40 -40 Q -36 -60 -20 -70', TK.fine, '#fff3c8', 0.7);
  return o;
}
function tkFaceSide(c, p, t) {
  const blink = p.blink ?? 0, mo = clamp(p.mouth ?? 0), sm = p.smile ?? 0.4;
  let o = '';
  const face = [[-36, 10], [-42, -24], [-30, -50], [-6, -60], [22, -56], [38, -40], [43, -22], [45, -14, 1], [67, 10, 1], [64, 15], [51, 16, 1], [49, 22], [48, 28], [51, 34], [49, 40], [51, 48, 1], [45, 55, 1], [6, 46, 1], [-14, 26]];
  o += tkOl(tkPath(face), c.base);
  o += `<path d="M 45 -14 L 64 10 L 56 12 Z" fill="#fff4e8" opacity="0.5"/><path d="M 30 4 L 42 6 L 36 20 Z" fill="${c.shade}" opacity="0.5"/>`;
  o += `<path d="${tkPath([[-12, 12], [-2, 8], [8, 26], [24, 34], [42, 35], [49, 40], [51, 48, 1], [45, 55, 1], [6, 46, 1], [-14, 26]])}" fill="${c.beard}" opacity="0.85"/>` + tkLine('M 6 46 L 45 55', TK.w);
  o += `<path d="M 40 23 L 52 21 L 51 25 L 42 26 Z" fill="${c.beard}" stroke="${TK.ink}" stroke-width="1"/>`;
  o += mo > 0.05 ? tkOl(`M 41 29 L 50 28 L 49 ${f1(29 + 9 * mo)} Q 45 ${f1(30 + 10 * mo)} 42 ${f1(29 + 6 * mo)} Z`, '#4a1a14', 1.8) : tkLine(`M 41 30 Q 45 ${f1(30 + 2 * sm)} 50 ${f1(29 - sm)}`, 2);
  o += tkOl('M -10 -12 Q 2 -16 2 2 Q 2 16 -10 14 Z', c.base) + tkLine('M -6 -6 Q -1 -2 -4 8', TK.fine, TK.ink, 0.6);
  const h = 5 * (1 - blink);
  if ((p.wink ?? 0) > 0.5) o += tkLine('M 20 -12 Q 27 -8 34 -12', TK.w);
  else o += `<path d="M 20 -12 Q 28 ${f1(-12 - h)} 35 -11 Q 29 ${f1(-12 + h * 0.6)} 20 -12 Z" fill="#fff" stroke="${TK.ink}" stroke-width="1.5"/>${blink < 0.6 ? `<circle cx="31" cy="-12" r="2.8" fill="${c.iris}"/><circle cx="32" cy="-12" r="1.3" fill="${TK.ink}"/>` : ''}` + tkLine(`M 20 -12 Q 28 ${f1(-13 - h)} 35 -11`, 2.6);
  o += `<path d="M 16 -24 L 40 -27 L 40 -23 L 17 -20 Z" fill="${c.hairShade}" stroke="${TK.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
  o += tkOl(tkPath([[42, -32, 1], [44, -54], [30, -74], [0, -84], [-30, -76], [-48, -54], [-48, -20], [-38, 6, 1], [-30, -10], [-22, -34], [-2, -44], [24, -44]]), c.hair);
  o += tkLine('M 32 -52 Q 6 -70 -26 -62 M 22 -44 Q -4 -58 -36 -46 M 8 -40 Q -16 -48 -40 -30', TK.fine, c.hairShade) + tkLine('M 26 -64 Q 4 -76 -20 -72', TK.fine, '#fff3c8', 0.7);
  return o;
}
function tkHeadBackHuman(c) {
  let o = '';
  for (const s of [-1, 1]) o += tkOl(`M ${s * 44} -14 Q ${s * 58} -20 ${s * 58} -2 Q ${s * 58} 14 ${s * 45} 14 Z`, c.base);
  o += tkOl(tkPath(tkSym([[0, -60], [30, -58], [42, -46], [46, -22], [48, -4], [46, 12], [40, 30], [16, 48], [0, 50]])), c.base);
  o += tkOl(tkPath(tkSym([[0, -86], [26, -84], [46, -70], [52, -46], [50, -14], [42, 14], [24, 26], [0, 30]])), c.hair);
  o += tkLine('M -30 -70 Q -20 -30 -14 14 M 0 -80 Q 2 -30 0 22 M 30 -70 Q 20 -30 14 14', TK.fine, c.hairShade);
  return o;
}
function tkShoe(c, A, view) {
  if (view === 'side') return tkOl(tkPath([[A[0] - 22, A[1] - 16], [A[0] + 4, A[1] - 18], [A[0] + 26, A[1] - 8], [A[0] + 46, A[1] - 2], [A[0] + 48, A[1] + 10, 1], [A[0] - 26, A[1] + 10, 1]]), c.shoe) + `<path d="M ${f1(A[0] - 26)} ${f1(A[1] + 4)} L ${f1(A[0] + 48)} ${f1(A[1] + 4)} L ${f1(A[0] + 48)} ${f1(A[1] + 12)} L ${f1(A[0] - 26)} ${f1(A[1] + 12)} Z" fill="${c.sole}" stroke="${TK.ink}" stroke-width="2"/>` + tkLine(`M ${f1(A[0] - 2)} ${f1(A[1] - 14)} L ${f1(A[0] + 14)} ${f1(A[1] - 6)}`, 1.6, '#888');
  return tkOl(tkPath([[A[0] - 22, A[1] + 12, 1], [A[0] - 22, A[1] - 8], [A[0], A[1] - 16], [A[0] + 22, A[1] - 8], [A[0] + 22, A[1] + 12, 1]]), c.shoe) + `<rect x="${f1(A[0] - 22)}" y="${f1(A[1] + 4)}" width="44" height="9" rx="3" fill="${c.sole}" stroke="${TK.ink}" stroke-width="2"/>`;
}
function tkHand(c, H, E, back) {
  const a = tkAng(E, H) - 90;
  return `<g transform="translate(${f1(H[0])} ${f1(H[1])}) rotate(${f1(a)})">${tkOl('M -11 -6 C -13 10 -9 22 0 23 C 9 22 13 10 11 -6 Z', c.base)}${back ? tkLine('M -5 8 l 0 10 M 0 9 l 0 11 M 5 8 l 0 10', TK.fine, TK.ink, 0.5) : tkOl('M 9 -2 Q 18 4 14 14 Q 10 12 8 6 Z', c.base, 2)}</g>`;
}
// p: view, x, y, s, flip; pose: hN/hF, fN/fF (local), lean, headTilt, crouch; face: blink, look, mouth, smile, brow, wink
function toonHuman(c, p, t = 0) {
  if (typeof c === 'string') c = TOON_HUMANS[c];
  const view = p.view || 'front', s = p.s ?? 1, f = p.flip ?? 1;
  const K = tkHumanSkel(c, p), { shY, hipY, sw, hw } = K;
  const br = Math.sin(t * 2) * 1.2;
  let o = `<ellipse cx="0" cy="4" rx="${view === 'side' ? 78 : 96}" ry="15" fill="#000" opacity="0.16"/>`;
  if (view !== 'side') {
    const back = view === 'back';
    const legs = [], shoes = [];
    for (const sd of [-1, 1]) {
      const Hp = [sd * hw, hipY], A = (sd > 0 ? p.fN : p.fF) || [sd * (hw + 6), K.ankleY];
      const [Kn] = ik(Hp, A, K.thigh, K.shin, sd > 0 ? -1 : 1);
      legs.push(tkLimb([Hp, Kn, A], [58, 46], c.jeans));
      shoes.push(tkShoe(c, A, 'front'));
    }
    o += legs.map((l) => l[0]).join('') + legs.map((l) => l[1]).join('') + shoes.join('');
    o += tkLine(`M ${-hw - 8} ${hipY + 60} q 10 70 4 140 M ${hw + 8} ${hipY + 60} q -10 70 -4 140`, 1.6, c.jeansShade);
    // jeans seat/waist, the tee over it
    o += tkOl(tkPath(tkSym([[0, hipY - 34], [hw + 30, hipY - 34], [hw + 32, hipY + 10], [hw + 26, hipY + 40], [6, hipY + 44], [0, hipY + 30]])), c.jeans);
    if (back) for (const sd of [-1, 1]) o += tkOl(`M ${sd * 12} ${hipY - 8} L ${sd * 50} ${hipY - 8} L ${sd * 48} ${hipY + 24} L ${sd * 31} ${hipY + 32} L ${sd * 14} ${hipY + 24} Z`, c.jeansShade, 1.8);
    else o += tkLine(`M 0 ${hipY - 30} L 0 ${hipY + 26}`, 1.6, c.jeansShade);
    const tee = [[0, shY - 18], [sw * 0.5, shY - 16], [sw, shY + br], [sw * 1.06, shY + 40], [sw * 0.9, shY + 80], [sw * 0.84, shY + 150], [sw * 0.82, hipY - 28], [sw * 0.84, hipY - 8, 1], [0, hipY - 4]];
    o += tkOl(tkPath(tkSym(tee)), c.tee);
    o += `<path d="M ${f1(sw * 0.62)} ${shY + 40} Q ${f1(sw * 0.72)} ${shY + 140} ${f1(sw * 0.6)} ${hipY - 10} L ${f1(sw * 0.82)} ${hipY - 10} L ${f1(sw * 0.86)} ${shY + 60} Z" fill="${c.teeShade}"/>`;
    if (!back) {
      o += tkOl(`M -16 ${shY - 19} L 0 ${shY - 4} L 16 ${shY - 19} L 18 ${shY - 30} L -18 ${shY - 30} Z`, c.base, 2);
      o += tkLine(`M -20 ${shY - 18} Q 0 ${shY + 2} 20 ${shY - 18}`, 2.4, '#444a52');
      for (const [d, w] of [[44, 3.6], [64, 4.4]]) o += tkLine(`M -20 ${shY - 22} Q 0 ${shY + d} 20 ${shY - 22}`, w + 2, TK.ink) + tkLine(`M -20 ${shY - 22} Q 0 ${shY + d} 20 ${shY - 22}`, w, c.chain);
    } else o += tkLine(`M -20 ${shY - 18} Q 0 ${shY - 8} 20 ${shY - 18}`, 2.4, '#444a52');
    // arms: sleeves then skin
    for (const sd of [-1, 1]) {
      const S = [sd * sw * 0.9, shY + 22], Hd = (sd > 0 ? p.hN : p.hF) || [sd * (sw + 22), hipY + 20 + br];
      const [E] = ik(S, Hd, K.up, K.fore, sd > 0 ? -1 : 1);
      const L = tkLimb([S, E, Hd], [32, 26], c.base), m = [lerp(S[0], E[0], 0.5), lerp(S[1], E[1], 0.5)];
      const SL = tkLimb([[S[0] - sd * 6, S[1] - 6], m], [48], c.tee);
      o += L[0] + L[1] + SL[0] + SL[1] + tkLine(`M ${f1(m[0] - 20)} ${f1(m[1] + 4)} L ${f1(m[0] + 20)} ${f1(m[1] + 4)}`, 1.6, '#4a4e58');
      o += tkHand(c, Hd, E, back);
    }
    // neck and head
    o += tkOl(`M -16 ${shY - 40} L 16 ${shY - 40} L 17 ${shY - 16} L -17 ${shY - 16} Z`, c.base, 2.4) + (back ? '' : `<path d="M -15 ${shY - 38} L 15 ${shY - 38} L 15 ${shY - 30} L -15 ${shY - 30} Z" fill="${c.shade}" opacity="0.7"/>`);
    o += `<g transform="translate(0 ${f1(K.headY + br * 0.5)}) rotate(${f1(p.headTilt ?? 0)}) scale(${K.hs})">${back ? tkHeadBackHuman(c) : tkFaceFront(c, p, t)}</g>`;
  } else {
    // side view, facing +x
    const leg = (near) => { const Hp = [-4, hipY], A = (near ? p.fN : p.fF) || [near ? 6 : -14, K.ankleY]; return [Hp, ik(Hp, A, K.thigh, K.shin, -1)[0], A]; };
    const arm = (near) => { const S = [4, shY + 24], Hd = (near ? p.hN : p.hF) || [near ? 18 : 4, hipY + 16 + br]; return [S, ik(S, Hd, K.up, K.fore, 1)[0], Hd]; };
    const fl = leg(false), fa = arm(false);
    const FL = tkLimb(fl, [54, 44], c.jeansShade), FA = tkLimb(fa, [28, 24], c.shade);
    o += FL[0] + FL[1] + tkShoe({ ...c, shoe: '#111' }, fl[2], 'side') + FA[0] + FA[1] + tkHand({ ...c, base: c.shade }, fa[2], fa[1], false);
    const nl = leg(true), na = arm(true);
    const NL = tkLimb(nl, [58, 46], c.jeans);
    o += tkOl(tkPath([[-38, hipY - 34], [34, hipY - 34], [36, hipY + 20], [24, hipY + 44], [-30, hipY + 44], [-40, hipY + 10]]), c.jeans);
    o += NL[0] + NL[1] + tkShoe(c, nl[2], 'side');
    o += tkOl(tkPath([[-30, shY - 22], [-44, shY + 20], [-46, shY + 120], [-40, hipY - 6, 1], [36, hipY - 6, 1], [40, shY + 140], [48, shY + 60], [40, shY + 6], [24, shY - 22]]), c.tee);
    o += `<path d="M -40 ${shY + 40} Q -44 ${shY + 140} -38 ${hipY - 8} L -24 ${hipY - 8} Q -30 ${shY + 120} -26 ${shY + 40} Z" fill="${c.teeShade}"/>`;
    for (const [d, w] of [[36, 3.6], [56, 4.4]]) o += tkLine(`M -6 ${shY - 22} Q 30 ${shY + d} 40 ${shY - 6}`, w + 2, TK.ink) + tkLine(`M -6 ${shY - 22} Q 30 ${shY + d} 40 ${shY - 6}`, w, c.chain);
    const NA = tkLimb(na, [32, 26], c.base);
    o += NA[0] + NA[1];
    const m = [lerp(na[0][0], na[1][0], 0.5), lerp(na[0][1], na[1][1], 0.5)], SL = tkLimb([[na[0][0] - 4, na[0][1] - 6], m], [48], c.tee);
    o += SL[0] + SL[1] + tkHand(c, na[2], na[1], false);
    o += tkOl(`M -10 ${shY - 44} L 18 ${shY - 44} L 22 ${shY - 18} L -14 ${shY - 18} Z`, c.base, 2.4);
    o += `<g transform="translate(4 ${f1(K.headY + br * 0.5)}) rotate(${f1(8 + (p.headTilt ?? 0))}) scale(${K.hs})">${tkFaceSide(c, p, t)}</g>`;
  }
  return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">${p.lean ? `<g transform="rotate(${f1(p.lean)} 0 ${f1(hipY)})">${o}</g>` : o}</g>`;
}
