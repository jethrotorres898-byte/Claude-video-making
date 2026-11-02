'use strict';
// Art for "A Venus flytrap can count": the watercolor garden (in the style of the creator's
// reference), the potted flytrap, a close-up trap that opens and snaps shut, the fly, the
// stickman rig and the paper props. Built on lib/watercolor.js. Design space: 1920 x 1080.

const COL = {
  sweater: '#a9c8dc', trousers: '#a27b55', skin: '#f8f1e6', shoe: '#f6f1e8',
  leaf: '#94c45c', leafDk: '#78aa4c', shell: '#a2cb60', shellUp: '#abd166', inside: '#d65a4d',
  insideLt: '#e47a69', tooth: '#d3e38e', hair: '#f4d8c8', terracotta: '#d98b5b', rim: '#e5a072',
  soil: '#5e4331', bark: '#9c6c46', woodTop: '#dcbc8f', path: '#d4b38b', paper: '#fbf2dc',
};

// ===================== landscape layers =====================
function cloud(x, y, s, seed) {
  const c = [[-110, 12, 44], [-58, -16, 60], [12, -32, 74], [84, -8, 58], [140, 14, 40]];
  let body = c.map(([dx, dy, r]) => `<path d="${P.circle(x + dx * s, y + dy * s, r * s)}" fill="#fbf7ec"/>`).join('');
  body += `<path d="${P.rrect(x - 150 * s, y - 4 * s, 300 * s, 54 * s, 27 * s)}" fill="#fbf7ec"/>`;
  return paintG(body, { v: 90 * s, s: seed, k: 0.45 }) +
    `<path d="${P.ellipse(x, y + 32 * s, 125 * s, 14 * s)}" fill="#e3dbe2" opacity="0.45"/>`;
}

function skyLayer() {
  let o = paint('M -10 -10 H 1930 V 1090 H -10 Z', wcLinear('skyG', [[0, '#c4dae2'], [0.4, '#e6edda'], [0.68, '#f8edca'], [1, '#f5e5bd']]), { v: 420, s: 3, k: 0.4, ink: 0 });
  o += `<circle cx="640" cy="150" r="470" fill="${wcRadial('sunGlow', [[0, '#fff9dc', 0.95], [0.45, '#fff3c6', 0.45], [1, '#fff3c6', 0]])}"/>`;
  o += blurG(paint(P.circle(640, 142, 78), '#f7d77a', { v: 70, s: 5, k: 0.55, ink: 0 }), 1.6);
  o += blurG(cloud(520, 190, 1.0, 2) + cloud(1450, 128, 0.85, 7) + cloud(1020, 92, 0.5, 4), 2.4);
  return o;
}

function farLayer() {
  const back = P.smooth([[-40, 330], [140, 255], [330, 238], [560, 330], [760, 405], [980, 382], [1180, 418], [1400, 300], [1640, 178], [1830, 200], [1960, 262]]) + ' L 1960 1090 L -40 1090 Z';
  const front = P.smooth([[-40, 440], [220, 392], [470, 405], [760, 478], [1050, 450], [1320, 478], [1600, 430], [1960, 452]]) + ' L 1960 1090 L -40 1090 Z';
  let o = paint(back, wcLinear('farBack', [[0, '#b5cfc4'], [0.5, '#c6dac6']]), { v: 260, s: 8, k: 0.7, ink: 0 });
  o += paint(front, wcLinear('farFront', [[0, '#a6c69c'], [0.4, '#b9d2a7']]), { v: 220, s: 9, k: 0.7, ink: 0 });
  return blurG(o, 3.6);
}

function house(x, y, s) {
  const k = (v) => v * s;
  const pt = (pts) => 'M ' + pts.map(([a, b]) => `${wf(x + k(a))} ${wf(y + k(b))}`).join(' L ') + ' Z';
  let o = paint(pt([[-30, -112], [122, -112], [122, 0], [-30, 0]]), '#ead6b5', { v: 60, s: 3, k: 0.6, ink: 2.4 });
  o += paint(pt([[-142, -112], [-86, -186], [-30, -112], [-30, 0], [-142, 0]]), '#f4e4c8', { v: 60, s: 4, k: 0.6, ink: 2.4 });
  o += paint(pt([[48, -212], [72, -212], [72, -168], [48, -168]]), '#e6cfab', { v: 40, s: 2, k: 0.6, ink: 2.2 });
  o += paint(pt([[-86, -190], [112, -190], [140, -106], [-24, -106]]), '#de8f7e', { v: 70, s: 6, k: 0.9, ink: 2.4 });
  o += paint(pt([[-160, -104], [-86, -196], [-78, -184], [-146, -102]]), '#d98575', { v: 50, s: 7, k: 0.8, ink: 2.4 });
  o += paint(pt([[28, -62], [62, -62], [62, 0], [28, 0]]), '#c49b77', { v: 40, s: 5, k: 0.6, ink: 2.2 });
  for (const [wx, wy] of [[-8, -84], [84, -84], [-108, -84]]) {
    o += paint(pt([[wx, wy], [wx + 30, wy], [wx + 30, wy + 30], [wx, wy + 30]]), '#cdb994', { v: 30, s: 8, k: 0.5, ink: 2.2 });
    o += ink(`M ${wf(x + k(wx + 15))} ${wf(y + k(wy))} V ${wf(y + k(wy + 30))} M ${wf(x + k(wx))} ${wf(y + k(wy + 15))} H ${wf(x + k(wx + 30))}`, 1.8);
  }
  return cut(o, 4, 0.22);
}

function bush(x, y, rx, ry, seed, col = '#93bd60') {
  return paint(P.blob(x, y, rx, ry, 9, seed, 0.25, 0.85), col, { v: 70, s: seed, k: 0.9, ink: 2.2, inkc: '#4c5a33' });
}

function midLayer() {
  const hillR = P.smooth([[640, 620], [900, 548], [1150, 512], [1400, 525], [1650, 505], [1960, 545]]) + ' L 1960 1090 L 640 1090 Z';
  const hillL = P.smooth([[-40, 560], [120, 472], [330, 425], [560, 458], [780, 548], [930, 610]]) + ' L 930 1090 L -40 1090 Z';
  let o = cut(paint(hillR, wcLinear('hillR', [[0, '#c4db95'], [0.25, '#aecd82']]), { v: 220, s: 12, k: 0.8, ink: 2, inkc: '#6d8750' }), 4, 0.16);
  o += cut(bush(186, 452, 70, 34, 21) + bush(486, 456, 60, 30, 22, '#9cc566'), 3, 0.15);
  o += cut(paint(hillL, wcLinear('hillL', [[0, '#cfe0a0'], [0.3, '#b6d18a']]), { v: 220, s: 13, k: 0.8, ink: 2, inkc: '#6d8750' }), 4, 0.16);
  // little path down from the house
  o += paint(P.smooth([[322, 432], [360, 470], [450, 520], [560, 580], [640, 640]]) + ' L 700 640 ' +
    P.smooth([[700, 640], [600, 578], [480, 516], [380, 466], [338, 432]]).replace(/^M/, 'L') + ' Z', '#d9bc95', { v: 60, s: 4, k: 0.6, ink: 1.6, inkc: '#8b6e52' });
  o += house(330, 436, 0.78);
  return blurG(o, 1.5);
}

function tree(x, y, h, seed) {
  const r = mulberry(seed);
  const tw = h * 0.07, top = y - h * 0.5;
  const fork = y - h * 0.34;
  const trunk = `M ${wf(x - tw)} ${wf(y)} C ${wf(x - tw * 0.8)} ${wf(y - h * 0.15)} ${wf(x - tw * 0.6)} ${wf(fork)} ${wf(x - tw * 2.2)} ${wf(top)} ` +
    `L ${wf(x - tw * 1.2)} ${wf(top + 4)} C ${wf(x - tw * 0.2)} ${wf(fork - h * 0.04)} ${wf(x + tw * 0.2)} ${wf(fork - h * 0.04)} ${wf(x + tw * 1.4)} ${wf(top - 4)} ` +
    `L ${wf(x + tw * 2.3)} ${wf(top + 2)} C ${wf(x + tw * 0.7)} ${wf(fork)} ${wf(x + tw * 0.8)} ${wf(y - h * 0.15)} ${wf(x + tw * 1.1)} ${wf(y)} Z`;
  let o = paint(trunk, wcLinear('trunkG', [[0, '#8c5e3d'], [0.5, '#a57450'], [1, '#86593a']], 0, 0, 1, 0), { v: 30, s: seed, k: 0.8, ink: 2.4 });
  o += ink(`M ${wf(x - tw * 0.2)} ${wf(y - h * 0.06)} q ${wf(tw * 0.3)} ${wf(-h * 0.08)} 0 ${wf(-h * 0.16)}`, 1.6, '#5b3c27');
  const cx = x, cy = y - h * 0.7, rx = h * 0.34, ry = h * 0.28;
  const greens = [wcLinear('can1', [[0, '#a9cf72'], [1, '#7aa84f']]), wcLinear('can2', [[0, '#b3d47a'], [1, '#86b257']]), wcLinear('can3', [[0, '#9dc768'], [1, '#719f49']])];
  let can = '';
  const blobs = [[0, 0, 1, 1], [-0.55, 0.25, 0.6, 0.6], [0.55, 0.22, 0.62, 0.6], [-0.2, -0.45, 0.6, 0.55], [0.3, -0.4, 0.55, 0.5]];
  blobs.forEach(([bx, by, sx, sy], i) => {
    can += paint(P.blob(cx + bx * rx, cy + by * ry, rx * sx, ry * sy, 9, seed * 7 + i, 0.24), greens[i % 3], { v: 60, s: seed + i, k: 1, ink: 2.2, inkc: '#40502c' });
  });
  for (let i = 0; i < 4; i++) {
    const lx = cx + (r() - 0.5) * rx * 1.3, ly = cy + (r() - 0.5) * ry * 1.2, a = r() * 360;
    can += G(tr(lx, ly, a, h / 260), paint('M -9 0 Q 0 -7 9 0 Q 0 7 -9 0 Z', '#7aa84f', { v: 20, s: 3, k: 0.6, ink: 1.6, inkc: '#40502c' }) + ink('M -7 0 H 7', 1.2, '#40502c'));
  }
  return cut(o + can, 4, 0.22);
}

function treesLayer() {
  let o = '';
  const back = [[1300, 588, 230, 31], [1560, 582, 240, 32], [1745, 590, 220, 33]];
  const front = [[1405, 612, 270, 34], [1640, 618, 255, 35], [1215, 626, 225, 36]];
  for (const [x, y, h, s] of back) o += tree(x, y, h, s);
  for (const [x, y, h, s] of front) o += tree(x, y, h, s);
  o += cut(bush(1300, 625, 90, 30, 41) + bush(1520, 632, 110, 32, 42, '#98c262') + bush(1760, 630, 100, 30, 43), 3, 0.18);
  return o;
}

function tuft(x, y, s, seed, col = '#8cc05a') {
  const r = mulberry(seed);
  let o = '';
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = -90 + (i - (n - 1) / 2) * 15 + (r() - 0.5) * 10;
    const len = (52 + r() * 36) * s, w = 9 * s;
    const rad = (a * Math.PI) / 180, bend = (r() - 0.5) * 0.5;
    const tx = x + Math.cos(rad + bend) * len, ty = y + Math.sin(rad + bend) * len;
    const nx = -Math.sin(rad) * w, ny = Math.cos(rad) * w;
    const mx = x + Math.cos(rad) * len * 0.5, my = y + Math.sin(rad) * len * 0.5;
    const d = `M ${wf(x - nx)} ${wf(y - ny)} Q ${wf(mx - nx * 0.8)} ${wf(my - ny * 0.8)} ${wf(tx)} ${wf(ty)} Q ${wf(mx + nx * 0.8)} ${wf(my + ny * 0.8)} ${wf(x + nx)} ${wf(y + ny)} Z`;
    o += paint(d, i % 2 ? col : '#7db150', { v: 40 * s, s: seed + i, k: 0.9, ink: 1.8, inkc: '#3f5129' });
  }
  return cut(o, 3, 0.18);
}

function nearLayer() {
  const field = P.smooth([[-40, 668], [300, 646], [700, 660], [1000, 644], [1400, 664], [1960, 646]]) + ' L 1960 1090 L -40 1090 Z';
  let o = cut(paint(field, wcLinear('field', [[0, '#b6d58a'], [0.5, '#9fc771'], [1, '#8bb962']]), { v: 240, s: 15, k: 0.85, ink: 2, inkc: '#5d7a43' }), 4, 0.18);
  const pl = [[120, 1095], [320, 975], [540, 875], [640, 800], [610, 735], [560, 668]];
  const pr = [[640, 1095], [790, 985], [950, 885], [920, 790], [760, 715], [640, 668]];
  const pathD = P.smooth(pl) + ' ' + P.smooth(pr.slice().reverse()).replace(/^M/, 'L') + ' Z';
  o += paint(pathD, wcLinear('pathG', [[0, '#dcc19a'], [1, '#c9a67c']]), { v: 120, s: 6, k: 0.8, ink: 2, inkc: '#7c5e44' });
  const rp = mulberry(5);
  for (let i = 0; i < 9; i++) {
    const t = rp();
    o += paint(P.ellipse(lerpN(400, 860, rp()), lerpN(800, 1060, t), 7 + rp() * 5, 4 + rp() * 3), '#b59472', { v: 10, s: i, k: 0.5, ink: 1.4, inkc: '#7c5e44' });
  }
  o += cut(bush(1780, 668, 130, 46, 51, '#8fbb5c') + bush(1600, 676, 90, 34, 52, '#9cc566') + bush(90, 676, 110, 36, 53, '#94bf60'), 3, 0.2);
  o += tuft(1010, 720, 0.55, 3) + tuft(1310, 770, 0.7, 4) + tuft(410, 820, 0.6, 5) + tuft(1180, 980, 0.8, 6) + tuft(1530, 900, 0.65, 7) + tuft(250, 760, 0.5, 8);
  return o;
}

function fgLayer() {
  return blurG(tuft(70, 1120, 3.0, 13) + tuft(260, 1130, 2.1, 15) + tuft(1820, 1120, 3.2, 18, '#86b956') + tuft(1640, 1140, 2.0, 19), 6);
}

// close-up background: an out-of-focus garden
function bokehLayer() {
  let o = `<rect x="-10" y="-10" width="1940" height="1100" fill="${wcLinear('bokehG', [[0, '#d9e8e4'], [0.35, '#e9efd6'], [0.6, '#bcd79a'], [1, '#93bd68']])}"/>`;
  const r = mulberry(77);
  for (let i = 0; i < 16; i++) {
    const x = r() * 1920, y = 420 + r() * 700, rr = 90 + r() * 170;
    o += `<path d="${P.blob(x, y, rr * 1.4, rr, 9, i + 3, 0.22)}" fill="${['#9cc566', '#8bb95d', '#a9cd73', '#7eae55'][i % 4]}" opacity="0.85"/>`;
  }
  for (let i = 0; i < 10; i++) {
    o += `<circle cx="${wf(r() * 1920)}" cy="${wf(60 + r() * 420)}" r="${wf(30 + r() * 50)}" fill="#fffbe6" opacity="${wf(0.25 + r() * 0.3)}"/>`;
  }
  return blurG(paintG(o, { v: 300, s: 9, k: 0.7 }), 14);
}

// ===================== stump, pot, plant =====================
function stumpPot(x, y, s) {
  let o = '';
  // stump top at -150, pot sits on it
  const side = 'M -120 -150 C -121 -90 -124 -40 -132 -8 Q -150 4 -168 8 Q -120 14 -60 10 Q 0 16 60 10 Q 120 14 166 8 Q 148 2 132 -8 C 124 -40 121 -90 120 -150 Z';
  o += paint(side, wcLinear('barkG', [[0, '#80553a'], [0.45, '#a77650'], [1, '#7a5036']], 0, 0, 1, 0), { v: 40, s: 4, k: 0.9, ink: 2.6 });
  for (const bx of [-80, -30, 25, 78]) o += ink(`M ${bx} -130 q 6 40 -2 80 q -6 30 2 50`, 1.8, '#5a3b26');
  o += paint(P.ellipse(0, -150, 120, 30), COL.woodTop, { v: 40, s: 5, k: 0.7, ink: 2.6 });
  for (const rr of [86, 56, 28]) o += ink(P.ellipse(0, -150, rr, rr * 0.25), 1.4, '#9c7a55');
  // pot
  o += paint('M -64 -146 L -80 -258 H 80 L 64 -146 Q 0 -136 -64 -146 Z', wcLinear('potG', [[0, '#c97a4d'], [0.45, '#e29a6a'], [1, '#c4764a']], 0, 0, 1, 0), { v: 50, s: 6, k: 0.8, ink: 2.6 });
  o += paint(P.rrect(-92, -286, 184, 34, 10), wcLinear('rimG', [[0, '#d98a5d'], [0.45, '#eeae80'], [1, '#d4865a']], 0, 0, 1, 0), { v: 40, s: 7, k: 0.8, ink: 2.6 });
  o += paint(P.ellipse(0, -282, 80, 8), COL.soil, { v: 20, s: 8, k: 0.6, ink: 1.8 });
  return G(tr(x, y, 0, s), cut(o, 5, 0.25));
}

// a flat leaf blade from (x0,y0) to the trap hinge (x1,y1)
function petiole(x0, y0, x1, y1, w, bend = 0.15) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
  const mx = (x0 + x1) / 2 + nx * l * bend, my = (y0 + y1) / 2 + ny * l * bend;
  const c1 = [lerpN(x0, mx, 0.7), lerpN(y0, my, 0.7)], c2 = [lerpN(x1, mx, 0.55), lerpN(y1, my, 0.55)];
  const d = `M ${wf(x0 - nx * w * 0.15)} ${wf(y0 - ny * w * 0.15)} C ${wf(c1[0] - nx * w)} ${wf(c1[1] - ny * w)} ${wf(c2[0] - nx * w * 0.8)} ${wf(c2[1] - ny * w * 0.8)} ${wf(x1 - nx * w * 0.12)} ${wf(y1 - ny * w * 0.12)} ` +
    `L ${wf(x1 + nx * w * 0.12)} ${wf(y1 + ny * w * 0.12)} C ${wf(c2[0] + nx * w * 0.8)} ${wf(c2[1] + ny * w * 0.8)} ${wf(c1[0] + nx * w)} ${wf(c1[1] + ny * w)} ${wf(x0 + nx * w * 0.15)} ${wf(y0 + ny * w * 0.15)} Z`;
  return paint(d, COL.leaf, { v: 50, s: 9, k: 0.9, ink: 2.2, inkc: '#3f5129' }) +
    ink(`M ${wf(x0)} ${wf(y0)} C ${wf(c1[0])} ${wf(c1[1])} ${wf(c2[0])} ${wf(c2[1])} ${wf(x1)} ${wf(y1)}`, 1.2, '#5f8a3e');
}

// ---------- the trap (side view, hinge at origin, length 100 along +x) ----------
const RIM = [[6, 2], [34, 13], [70, 15], [100, 6]];
function bez(p, t) {
  const u = 1 - t;
  return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]];
}
function bezD(p, t) {
  const u = 1 - t;
  return [3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]),
    3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1])];
}
function teeth(dir, offset, len = 20) {
  let o = '';
  for (let i = 0; i < 13; i++) {
    const t = 0.1 + (i + offset) * 0.068;
    if (t > 0.99) break;
    const [bx, by] = bez(RIM, t), [tx, ty] = bezD(RIM, t);
    const l = Math.hypot(tx, ty), ux = tx / l, uy = ty / l;
    // normal pointing away from the mouth, leaning forward
    const nx = dir * uy * -1, ny = dir * ux;
    const L = len * (0.75 + 0.25 * Math.sin(t * Math.PI));
    const ex = bx + (nx * 0.85 + ux * 0.5) * L, ey = by + (ny * 0.85 + uy * 0.5) * L;
    const w = 1.7;
    o += `<path d="M ${wf(bx - ux * w)} ${wf(by - uy * w)} Q ${wf((bx + ex) / 2 + ux * 0.4)} ${wf((by + ey) / 2 + uy * 0.4)} ${wf(ex)} ${wf(ey)} Q ${wf((bx + ex) / 2 + ux * 1.9)} ${wf((by + ey) / 2 + uy * 1.9)} ${wf(bx + ux * w)} ${wf(by + uy * w)} Z" vector-effect="non-scaling-stroke"/>`;
  }
  return o;
}
// little hair spike standing on the inside of a lobe
function hairSpike(x, y, len, ang, glow) {
  let o = '';
  if (glow > 0) o += `<circle cx="${x}" cy="${wf(y - len * 0.5)}" r="${wf(9 + glow * 3)}" fill="${wcRadial('hairGlow', [[0, '#fff6a8', 0.95], [0.5, '#ffe36b', 0.6], [1, '#ffe36b', 0]])}" opacity="${wf(glow)}"/>`;
  o += G(tr(x, y, ang), `<path d="M -1.3 0 L -0.3 ${-len} L 0.3 ${-len} L 1.3 0 Z" fill="${glow > 0.5 ? '#fff3a0' : COL.hair}" stroke="${WC.ink}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`);
  return o;
}

// o: L (px length), open (0..1), glow [3], fly (draw fn in local units), juice (0..1), squash
function trap(x, y, rot, o) {
  const k = o.L / 100, op = o.open;
  const lw = { 'vector-effect': 'non-scaling-stroke' };
  const sk = (d, w = 2.6, c = WC.ink) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  const fill = (d, col, v, s, kk = 1) => `<path d="${d}" fill="${col}" filter="url(#${wcFilter(v, s, kk, Math.max(1, k * 0.8))})"/>`;
  const rimD = 'M 6 2 C 34 13 70 15 100 6';
  let lower = '';
  // lower jaw: inside (red), hairs, glands, fly, shell, teeth
  const inside = 'M 6 2 C 32 -12 70 -14 100 6 C 70 15 34 13 6 2 Z';
  lower += fill(inside, wcLinear('insG', [[0, COL.inside], [0.5, COL.insideLt], [1, COL.inside]], 0, 0, 1, 0), 28, 4) + sk(inside, 2.2);
  const rg = mulberry(9);
  for (let i = 0; i < 26; i++) {
    const gx = 18 + rg() * 74, gy = lerpN(-6, 8, rg()) * (1 - Math.abs(gx - 55) / 60);
    lower += `<circle cx="${wf(gx)}" cy="${wf(gy)}" r="0.7" fill="#a8362f" opacity="0.7"/>`;
  }
  const hairs = [[36, 2.5], [54, 3], [72, 3.5]];
  hairs.forEach(([hx, hy], i) => { lower += hairSpike(hx, hy, 11, -6 + i * 4, (o.glow || [])[i] || 0); });
  if (o.fly) lower += o.fly;
  const shell = 'M 0 0 C 6 30 72 40 106 8 L 100 6 C 70 15 34 13 6 2 Z';
  lower += fill(shell, COL.shell, 45, 5) + sk(shell);
  lower += `<g fill="${COL.tooth}" stroke="${WC.ink}" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linejoin="round">${teeth(1, 0)}</g>`;
  // upper jaw (rotates open about the hinge)
  let upper = '';
  if (op > 0.02) {
    const b = 20 * op;
    const uin = `M 6 2 C 34 13 70 15 100 6 C 70 ${wf(15 + b * 1.1)} 34 ${wf(13 + b)} 6 2 Z`;
    upper += fill(uin, wcLinear('insG2', [[0, '#c94e43'], [0.6, COL.insideLt], [1, COL.inside]], 0, 0, 1, 0), 28, 6) + sk(uin, 2.2);
    if (op > 0.4) [[38, 9], [56, 10.5], [74, 9.5]].forEach(([hx, hy], i) => { upper += G(`translate(0 ${wf(hy * op)}) scale(1 -1)`, hairSpike(hx, 0, 8 * op, 6 - i * 4, 0)); });
  }
  const ushell = 'M 0 0 C 6 -32 74 -40 106 6 L 100 6 C 70 15 34 13 6 2 Z';
  upper += fill(ushell, COL.shellUp, 45, 7) + sk(ushell);
  upper += `<g fill="${COL.tooth}" stroke="${WC.ink}" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linejoin="round">${teeth(-1, 0.5)}</g>`;
  let juice = '';
  if (o.juice > 0) {
    for (let i = 0; i < 6; i++) {
      const t = 0.18 + i * 0.13, [jx, jy] = bez(RIM, t);
      const g = clamp01(o.juice * 6 - i * 0.6) * (0.8 + 0.2 * Math.sin(i * 2.3));
      if (g <= 0) continue;
      const r = 2.6 * g;
      juice += `<path d="M ${wf(jx - r)} ${wf(jy + 1 + r)} Q ${wf(jx)} ${wf(jy - r * 0.4)} ${wf(jx + r)} ${wf(jy + 1 + r)} A ${wf(r)} ${wf(r)} 0 0 1 ${wf(jx - r)} ${wf(jy + 1 + r)} Z" fill="#dbe78c" stroke="${WC.ink}" stroke-width="1.3" vector-effect="non-scaling-stroke"/>` +
        `<circle cx="${wf(jx - r * 0.35)}" cy="${wf(jy + 1 + r * 0.6)}" r="${wf(r * 0.3)}" fill="#fffbe0"/>`;
    }
  }
  const sq = o.squash || 0;
  const body = G(`scale(${wf(1 + sq * 0.03)} ${wf(1 - sq * 0.05)})`, lower + G(`rotate(${wf(-44 * op)})`, upper) + juice);
  return G(`translate(${wf(x)} ${wf(y)})${o.mirror ? ' scale(-1 1)' : ''} rotate(${wf(rot)}) scale(${wf(k)})`, body);
}

// the potted plant's leaves: [hingeX, hingeY, tilt, L, petiole width, bend, mirror]
const LEAVES = [
  [-150, -335, 12, 96, 26, 0.12, true],
  [-92, -420, -38, 104, 28, -0.1, true],
  [10, -448, -72, 92, 26, 0.06, false],
  [168, -330, 6, 98, 26, -0.12, false],
  [100, -415, -34, 124, 30, 0.1, false], // hero trap (index 4)
];
// world position of a point (lx, ly in trap units) on leaf i of a plant drawn at (x, y, s)
function trapPoint(x, y, s, i, lx, ly) {
  const [hx, hy, rot, L, , , mirror] = LEAVES[i];
  const k = L / 100, a = (rot * Math.PI) / 180;
  const px = lx * k, py = ly * k;
  let rx = px * Math.cos(a) - py * Math.sin(a);
  const ry = px * Math.sin(a) + py * Math.cos(a);
  if (mirror) rx = -rx;
  return [x + (hx + rx) * s, y + (hy + ry) * s];
}
// the whole potted plant; traps: [{open, glow, fly, juice, squash}] for the 5 traps
function flytrapPlant(x, y, s, st = {}) {
  const bx = 0, by = -282;
  let o = '';
  LEAVES.forEach(([hx, hy, rot, L, w, bend, mirror], i) => {
    const t = st[i] || {};
    o += petiole(bx + (i - 2) * 9, by, hx, hy, w, bend);
    o += trap(hx, hy, rot, { L, mirror, open: t.open ?? 1, glow: t.glow, fly: t.fly, juice: t.juice, squash: t.squash });
  });
  return G(tr(x, y, 0, s), cut(o, 4, 0.22));
}

// ===================== the fly =====================
function fly(x, y, s, o = {}) {
  const flap = o.flap ?? 0, face = o.face ?? -1;
  const wa = -30 + Math.sin(flap * Math.PI * 2) * 34;
  const wing = (ox, rot) => G(tr(ox, -8, rot), `<path d="${P.ellipse(10, 0, 15, 7)}" fill="#eaf5fb" fill-opacity="0.85" stroke="${WC.ink}" stroke-width="2" vector-effect="non-scaling-stroke"/>` +
    `<path d="M 0 0 L 20 0" stroke="#9fb4c0" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`);
  const step = o.step ?? 0;
  let legs = '';
  for (let i = 0; i < 3; i++) {
    const sw = Math.sin(step * Math.PI * 2 + i * 2.1) * 4;
    legs += `<path d="M ${-6 + i * 7} 6 l ${wf(-4 + sw)} 9 l -3 3" fill="none" stroke="${WC.ink}" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  }
  const body = paint(P.ellipse(4, 0, 16, 10), '#4b5262', { v: 20, s: 3, k: 0.7, ink: 2.4 }) +
    ink('M 0 -9 Q 3 0 0 9 M 8 -9 Q 11 0 8 9', 1.6, '#2c3038');
  const head = paint(P.circle(-14, -2, 9.5), '#4b5262', { v: 16, s: 4, k: 0.6, ink: 2.4 });
  const eye = (ex, ey, r) => `<path d="${P.circle(ex, ey, r)}" fill="#fffdf6" stroke="${WC.ink}" stroke-width="2" vector-effect="non-scaling-stroke"/>` +
    `<circle cx="${wf(ex - 1.6)}" cy="${wf(ey + 0.6)}" r="${wf(r * 0.5)}" fill="#1f1a17"/>`;
  return G(`translate(${wf(x)} ${wf(y)}) scale(${wf(s * -face)} ${wf(s)})`, legs + wing(6, wa - 14) + body + head + eye(-19, -6, 5.5) + eye(-11.5, -7.5, 5) + wing(0, wa + 6));
}

// ===================== the student (character study "design unit") =====================
// Round head, thin cream limbs with mannequin joint bands, big rounded feet; outfit: blue knit
// turtleneck with ribbed collar, cuffs and hem, and a green backpack on one shoulder.
// p: armL/armR = [shoulder deg, elbow deg] (screen angles, 90 = straight down),
// handL/handR = {type, rot}, legL/legR = deg or [hip deg, knee deg], face, look [x,y], blink, lean, bob
function stickman(x, y, s, p = {}) {
  const lean = p.lean || 0, bob = p.bob || 0;
  const hipY = -168, shY = -292;
  const dir = (a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
  const caps = (pts, r, c) => pts.slice(1).map((q, i) => `<path d="${P.capsule(pts[i][0], pts[i][1], q[0], q[1], r)}" fill="${c}"/>`).join('');
  const tube = (pts, w, c, opts) => caps(pts, w / 2 + 3.2, WC.ink) + paintG(caps(pts, w / 2, c), opts);
  const band = (x0, y0, ang, w, h) => G(tr(x0, y0, ang - 90), paint(P.rrect(-w / 2, -h / 2, w, h, h / 2), COL.skin, { v: 20, s: 3, k: 0.35, ink: 2.6 }));
  let o = '';
  // legs: thin jointed tubes ending in big feet
  const legs = [[-21, p.legL ?? 93, -1], [21, p.legR ?? 87, 1]].map(([hx, a, side]) => {
    const [a1, a2] = Array.isArray(a) ? a : [a, a];
    const [d1x, d1y] = dir(a1), [d2x, d2y] = dir(a2);
    const knee = [hx + d1x * 70, hipY + d1y * 70], ankle = [knee[0] + d2x * 66, knee[1] + d2y * 66];
    return { side, hip: [hx, hipY], knee, ankle, a1, a2 };
  });
  for (const l of legs) {
    o += tube([l.hip, l.knee, l.ankle], 15, COL.skin, { v: 40, s: 21 + l.side, k: 0.35, gs: s });
    o += band(l.knee[0], l.knee[1], (l.a1 + l.a2) / 2, 20, 11);
    const m = l.side, [ax, ay] = l.ankle;
    const foot = `M ${wf(ax - 14 * m)} ${wf(ay - 8)} Q ${wf(ax + 12 * m)} ${wf(ay - 14)} ${wf(ax + 40 * m)} ${wf(ay - 2)} Q ${wf(ax + 52 * m)} ${wf(ay + 6)} ${wf(ax + 44 * m)} ${wf(ay + 15)} ` +
      `Q ${wf(ax + 20 * m)} ${wf(ay + 21)} ${wf(ax - 8 * m)} ${wf(ay + 17)} Q ${wf(ax - 24 * m)} ${wf(ay + 12)} ${wf(ax - 20 * m)} ${wf(ay + 1)} Q ${wf(ax - 18 * m)} ${wf(ay - 6)} ${wf(ax - 14 * m)} ${wf(ay - 8)} Z`;
    o += paint(foot, COL.skin, { v: 30, s: 23 + m, k: 0.4, ink: 3.2 });
  }
  // backpack behind the body (character's right shoulder = viewer's left)
  let up = paint(P.rrect(-96, shY + 4, 58, 112, 20), wcLinear('packG', [[0, '#93ba68'], [1, '#6f9a4c']]), { v: 40, s: 31, k: 0.8, ink: 3.2, gs: s });
  up += paint(P.rrect(-100, shY + 40, 22, 48, 9), '#7aa555', { v: 20, s: 32, k: 0.7, ink: 2.8 });
  up += ink(`M -84 ${shY + 4} q 12 -14 26 0`, 3);
  // sweater body with ribbed hem and knit marks
  const torso = `M -56 ${shY + 10} Q -58 ${shY - 6} -42 ${shY - 8} L 42 ${shY - 8} Q 58 ${shY - 6} 56 ${shY + 10} L 54 ${hipY - 2} L -54 ${hipY - 2} Z`;
  up += paint(torso, COL.sweater, { v: 60, s: 12, k: 1, ink: 3.4, gs: s });
  const hem = P.rrect(-57, hipY - 14, 114, 18, 7);
  up += paint(hem, '#9dbfd3', { v: 30, s: 13, k: 0.7, ink: 3, gs: s });
  let rib = '';
  for (let xx = -50; xx <= 50; xx += 6) rib += `M ${xx} ${hipY - 11} V ${hipY + 1} `;
  up += ink(rib, 1.3, '#6f90a6');
  const rk = mulberry(17);
  let knit = '';
  for (let yy = shY + 18; yy < hipY - 22; yy += 13) {
    for (let xx = -44; xx <= 44; xx += 11) {
      const jx = xx + (rk() - 0.5) * 6, jy = yy + (rk() - 0.5) * 5;
      if (rk() < 0.55) knit += `M ${wf(jx)} ${wf(jy)} l ${wf((rk() - 0.5) * 2)} 5 `;
    }
  }
  up += ink(knit, 1.4, '#7c9db4');
  // strap over the shoulder, in front of the sweater
  up += paint('M -40 ' + (shY - 6) + ' Q -30 ' + (shY + 30) + ' -36 ' + (shY + 92) + ' L -24 ' + (shY + 92) + ' Q -18 ' + (shY + 30) + ' -28 ' + (shY - 8) + ' Z', '#7fa95a', { v: 20, s: 33, k: 0.7, ink: 2.8 });
  // neck, turtleneck collar, head
  up += paint(P.rrect(-7, shY - 34, 14, 22, 5), COL.skin, { v: 20, s: 2, k: 0.35, ink: 3 });
  up += paint(P.rrect(-26, shY - 26, 52, 26, 9), '#a4c5d9', { v: 30, s: 14, k: 0.7, ink: 3, gs: s });
  let crib = '';
  for (let xx = -20; xx <= 20; xx += 6) crib += `M ${xx} ${shY - 22} V ${shY - 4} `;
  up += ink(crib, 1.3, '#6f90a6');
  const hy = -372;
  up += paint(P.circle(0, hy, 58), COL.skin, { v: 60, s: 13, k: 0.35, ink: 3.4 });
  up += `<path d="M ${-40} ${hy + 38} A 58 58 0 0 1 ${-50} ${hy - 26}" fill="none" stroke="#d9cbb6" stroke-width="7" stroke-linecap="round" opacity="0.55"/>`;
  up += face(p.face || 'smile', p.look || [0, 0], p.blink || 0, hy);
  // knit sleeves with ribbed cuffs, mitten hands
  const arms = [[-50, p.armL || [100, 96], p.handL, -1], [50, p.armR || [80, 84], p.handR, 1]];
  let sleeves = '', cuffs = '', hands = '';
  for (const [sx, [a1, a2], hand, side] of arms) {
    const [d1x, d1y] = dir(a1), [d2x, d2y] = dir(a2);
    const e = [sx + d1x * 74, shY + 6 + d1y * 74], w = [e[0] + d2x * 56, e[1] + d2y * 56];
    sleeves += tube([[sx, shY + 6], e, w], 30, COL.sweater, { v: 60, s: 15 + side, k: 1, gs: s });
    const c0 = [w[0] - d2x * 4, w[1] - d2y * 4];
    cuffs += G(tr(c0[0], c0[1], a2 - 90), paint(P.rrect(-17, -7, 34, 14, 6), '#9dbfd3', { v: 20, s: 16, k: 0.6, ink: 2.8 }) + ink('M -10 -5 V 5 M -4 -5 V 5 M 2 -5 V 5 M 8 -5 V 5', 1.2, '#6f90a6'));
    const h = hand || {};
    hands += handShape(w[0] + d2x * 4, w[1] + d2y * 4, h.type || 'rest', h.rot ?? a2 - 90, side, h.n);
  }
  up += sleeves + hands + cuffs;
  const shadow = `<ellipse cx="0" cy="8" rx="78" ry="13" fill="#5a4a33" opacity="0.16" filter="url(#${wcBlurFilter(5)})"/>`;
  return G(`translate(${wf(x)} ${wf(y)}) scale(${wf(s)})`, shadow + G(`translate(0 ${wf(bob)})`, cut(o + G(`rotate(${wf(lean)} 0 ${hipY})`, up), 6, 0.28)));
}

function face(expr, look, blink, hy) {
  const lx = look[0] * 13, ly = look[1] * 7;
  const cx = lx, cy = hy + ly;
  let o = '';
  const E = (ex) => {
    if (blink > 0.5 || expr === 'happy') return ink(`M ${wf(ex - 7)} ${wf(cy - 2)} Q ${wf(ex)} ${wf(cy - 9)} ${wf(ex + 7)} ${wf(cy - 2)}`, 3);
    if (expr === 'surprised' || expr === 'amazed') {
      return `<path d="${P.ellipse(ex, cy - 2, 9, 11)}" fill="#fffdf8" stroke="${WC.ink}" stroke-width="2.6"/><circle cx="${wf(ex + look[0] * 2)}" cy="${wf(cy - 1)}" r="4.6" fill="${WC.ink}"/>`;
    }
    return `<path d="${P.ellipse(ex, cy - 2, 5.4, 7.4)}" fill="${WC.ink}"/>`;
  };
  if (expr === 'wink') {
    o += `<path d="${P.ellipse(cx - 20, cy - 2, 5.4, 7.4)}" fill="${WC.ink}"/>` + ink(`M ${wf(cx + 13)} ${wf(cy - 1)} Q ${wf(cx + 20)} ${wf(cy - 7)} ${wf(cx + 27)} ${wf(cy - 1)}`, 3);
  } else o += E(cx - 20) + E(cx + 20);
  // brows
  const br = {
    smile: [[-26, -25, -14, -27], [14, -27, 26, -25]],
    curious: [[-27, -26, -13, -27], [13, -36, 27, -33]],
    surprised: [[-29, -34, -12, -38], [12, -38, 29, -34]],
    amazed: [[-29, -33, -12, -37], [12, -37, 29, -33]],
    focus: [[-27, -28, -13, -24], [13, -24, 27, -28]],
    serious: [[-27, -26, -13, -26], [13, -26, 27, -26]],
    happy: [[-26, -27, -14, -29], [14, -29, 26, -27]],
    wink: [[-26, -27, -14, -29], [14, -26, 26, -24]],
  }[expr] || [[-26, -25, -14, -27], [14, -27, 26, -25]];
  for (const [x1, y1, x2, y2] of br) o += ink(`M ${wf(cx + x1)} ${wf(cy + y1)} Q ${wf(cx + (x1 + x2) / 2)} ${wf(cy + Math.min(y1, y2) - 4)} ${wf(cx + x2)} ${wf(cy + y2)}`, 2.6);
  // mouth
  const mx = cx, my = cy + 20;
  if (expr === 'surprised') o += `<path d="${P.ellipse(mx, my + 4, 9, 12)}" fill="#6b2c25" stroke="${WC.ink}" stroke-width="3"/>`;
  else if (expr === 'amazed' || expr === 'happy' || expr === 'wink') {
    o += `<path d="M ${wf(mx - 17)} ${wf(my - 3)} Q ${wf(mx)} ${wf(my)} ${wf(mx + 17)} ${wf(my - 3)} Q ${wf(mx + 13)} ${wf(my + 19)} ${wf(mx)} ${wf(my + 19)} Q ${wf(mx - 13)} ${wf(my + 19)} ${wf(mx - 17)} ${wf(my - 3)} Z" fill="#7a3029" stroke="${WC.ink}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M ${wf(mx - 8)} ${wf(my + 14)} Q ${wf(mx)} ${wf(my + 6)} ${wf(mx + 8)} ${wf(my + 14)} Q ${wf(mx)} ${wf(my + 19)} ${wf(mx - 8)} ${wf(my + 14)} Z" fill="#e1837a"/>`;
  } else if (expr === 'curious') o += ink(`M ${wf(mx - 8)} ${wf(my + 2)} Q ${wf(mx + 2)} ${wf(my + 1)} ${wf(mx + 9)} ${wf(my - 3)}`, 3);
  else if (expr === 'focus') o += ink(`M ${wf(mx - 9)} ${wf(my + 1)} Q ${wf(mx)} ${wf(my + 5)} ${wf(mx + 9)} ${wf(my + 1)}`, 3) + `<path d="${P.ellipse(mx + 7, my + 5, 4, 3.5)}" fill="#e1837a" stroke="${WC.ink}" stroke-width="2"/>`;
  else if (expr === 'serious') o += ink(`M ${wf(mx - 9)} ${wf(my + 2)} L ${wf(mx + 9)} ${wf(my + 2)}`, 3);
  else o += ink(`M ${wf(mx - 11)} ${wf(my - 1)} Q ${wf(mx)} ${wf(my + 7)} ${wf(mx + 11)} ${wf(my - 1)}`, 3);
  return o;
}

// hand at wrist (x,y); rot = degrees (0 = fingers pointing down); side -1 left, 1 right
function handShape(x, y, type, rot, side, n = 0) {
  const fill = (d) => `<path d="${d}" fill="${COL.skin}" stroke="${WC.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  let o = '';
  if (type === 'rest') {
    o += fill(P.ellipse(0, 14, 12, 15)) + fill(`M ${-side * 9} 6 q ${-side * 9} 6 ${-side * 6} 16 q ${side * 4} 2 ${side * 6} -6 Z`);
    o += ink(`M -4 22 q 2 5 6 4`, 1.8);
  } else if (type === 'open' || type === 'count') {
    const k = type === 'open' ? 4 : n;
    const angs = [-24, -8, 8, 24];
    for (let i = 0; i < 4; i++) {
      const extended = type === 'open' || i < k;
      const a = (angs[i] * Math.PI) / 180, L = extended ? 22 : 9;
      const bx = Math.sin(a) * 9, by = 14 + Math.cos(a) * 9, ex = bx + Math.sin(a) * L, ey = by + Math.cos(a) * L;
      o += `<path d="M ${wf(bx)} ${wf(by)} L ${wf(ex)} ${wf(ey)}" stroke="${WC.ink}" stroke-width="11.5" stroke-linecap="round"/>` +
        `<path d="M ${wf(bx)} ${wf(by)} L ${wf(ex)} ${wf(ey)}" stroke="${COL.skin}" stroke-width="6" stroke-linecap="round"/>`;
    }
    o += fill(P.ellipse(0, 12, 13, 13));
    if (type === 'open' || n >= 5) o += `<path d="M ${-side * 10} 10 L ${-side * 24} 2" stroke="${WC.ink}" stroke-width="11.5" stroke-linecap="round"/><path d="M ${-side * 10} 10 L ${-side * 24} 2" stroke="${COL.skin}" stroke-width="6" stroke-linecap="round"/>`;
    o += fill(P.ellipse(0, 12, 12, 12)).replace('stroke-width="3"', 'stroke-width="0"');
  } else if (type === 'thumb') {
    o += `<path d="M ${side * 6} 4 L ${side * 6} -20" stroke="${WC.ink}" stroke-width="12" stroke-linecap="round"/><path d="M ${side * 6} 4 L ${side * 6} -20" stroke="${COL.skin}" stroke-width="6.5" stroke-linecap="round"/>`;
    o += fill(P.rrect(-13, 0, 26, 26, 9)) + ink('M -9 9 H 7 M -9 17 H 7', 1.6);
  } else if (type === 'point') {
    o += `<path d="M ${side * 3} 16 L ${side * 3} 40" stroke="${WC.ink}" stroke-width="11.5" stroke-linecap="round"/><path d="M ${side * 3} 16 L ${side * 3} 40" stroke="${COL.skin}" stroke-width="6" stroke-linecap="round"/>`;
    o += fill(P.rrect(-12, 0, 24, 24, 9)) + ink(`M ${-side * 9} 9 q ${side * 6} 3 ${side * 2} 8`, 1.6);
  } else if (type === 'fist') {
    o += fill(P.rrect(-13, 2, 26, 24, 9)) + ink('M -9 10 H 7 M -9 18 H 7', 1.6);
  }
  return G(tr(x, y, rot), o);
}

// ===================== paper props =====================
const FONT = "'PatrickHand', 'Comic Sans MS', sans-serif";
function txt(x, y, s, size, col = WC.ink, anchor = 'middle', extra = '') {
  return `<text x="${wf(x)}" y="${wf(y)}" font-family="${FONT}" font-size="${wf(size)}" fill="${col}" text-anchor="${anchor}"${extra}>${s}</text>`;
}
function badge(x, y, s, label, pop = 1) {
  if (pop <= 0) return '';
  const o = paint(P.circle(0, 0, 50), COL.paper, { v: 40, s: 5, k: 0.4, ink: 3.2 }) + txt(0, 21, label, 64);
  return G(tr(x, y, 0, s * pop), cut(o, 6, 0.28));
}
function tag(x, y, label, size = 44, pop = 1, rot = 0) {
  if (pop <= 0) return '';
  const w = label.length * size * 0.42 + 44, h = size * 1.45;
  const o = paint(P.rrect(-w / 2, -h / 2, w, h, 16), COL.paper, { v: 50, s: 6, k: 0.4, ink: 3 }) + txt(0, size * 0.33, label, size);
  return G(tr(x, y, rot, pop), cut(o, 6, 0.26));
}
function arrow(x1, y1, x2, y2, bend = 0.2, t = 1) {
  if (t <= 0) return '';
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const ex = lerpN(lerpN(x1, mx, t), lerpN(mx, x2, t), t), ey = lerpN(lerpN(y1, my, t), lerpN(my, y2, t), t);
  let o = `<path d="M ${wf(x1)} ${wf(y1)} Q ${wf(lerpN(x1, mx, t))} ${wf(lerpN(y1, my, t))} ${wf(ex)} ${wf(ey)}" fill="none" stroke="${WC.ink}" stroke-width="4.5" stroke-linecap="round"/>`;
  if (t > 0.95) {
    const a = Math.atan2(y2 - my, x2 - mx);
    const hx = (d) => [x2 - Math.cos(a + d) * 22, y2 - Math.sin(a + d) * 22];
    const [ax, ay] = hx(0.5), [bx, by] = hx(-0.5);
    o += `<path d="M ${wf(ax)} ${wf(ay)} L ${wf(x2)} ${wf(y2)} L ${wf(bx)} ${wf(by)}" fill="none" stroke="${WC.ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return o;
}
function raindrop(x, y, s) {
  const d = 'M 0 -20 C 6 -9 13 0 13 7 A 13 13 0 1 1 -13 7 C -13 0 -6 -9 0 -20 Z';
  return G(tr(x, y, 0, s), paint(d, '#a6d3ec', { v: 20, s: 4, k: 0.5, ink: 2.6 }) + `<path d="M -6 2 Q -7 10 -2 14" fill="none" stroke="#fffdf6" stroke-width="3.2" stroke-linecap="round"/>`);
}
function splash(x, y, t, s = 1) {
  if (t <= 0 || t >= 1) return '';
  let o = '';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.15 + 0.7 * (i / 5)), sp = 34 + (i % 3) * 10;
    const px = x + Math.cos(a) * sp * t * s, py = y + (Math.sin(a) * sp * t + 60 * t * t) * s;
    o += `<circle cx="${wf(px)}" cy="${wf(py)}" r="${wf(4.5 * s * (1 - t * 0.6))}" fill="#a6d3ec" stroke="${WC.ink}" stroke-width="1.8"/>`;
  }
  return o;
}
function qmark(x, y, s, pop = 1) {
  if (pop <= 0) return '';
  const d = 'M -16 -22 Q -16 -46 6 -46 Q 26 -46 26 -26 Q 26 -12 8 -4 Q 2 -1 2 12';
  const o = `<path d="${d}" fill="none" stroke="${WC.ink}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#f3d77a" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>` +
    paint(P.circle(2, 34, 9), '#f3d77a', { v: 20, s: 2, k: 0.5, ink: 4 });
  return G(tr(x, y, 0, s * pop), cut(o, 6, 0.25));
}
function stopwatch(x, y, s, frac, label, pop = 1) {
  if (pop <= 0) return '';
  let o = paint(P.rrect(-12, -78, 24, 18, 5), '#c9b089', { v: 20, s: 2, k: 0.5, ink: 3 });
  o += paint(P.circle(0, 0, 64), '#f1e2c2', { v: 40, s: 3, k: 0.5, ink: 3.4 });
  o += `<circle r="52" fill="${COL.paper}" stroke="${WC.ink}" stroke-width="2.4"/>`;
  if (frac !== null) {
    const a = frac * Math.PI * 2;
    if (frac > 0.001) o += `<path d="M 0 0 L 0 -52 A 52 52 0 ${frac > 0.5 ? 1 : 0} 1 ${wf(Math.sin(a) * 52)} ${wf(-Math.cos(a) * 52)} Z" fill="#f6c96b" opacity="0.85"/>`;
    o += `<path d="M 0 0 L ${wf(Math.sin(a) * 44)} ${wf(-Math.cos(a) * 44)}" stroke="${WC.ink}" stroke-width="4.5" stroke-linecap="round"/><circle r="5" fill="${WC.ink}"/>`;
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    o += `<path d="M ${wf(Math.sin(a) * 45)} ${wf(-Math.cos(a) * 45)} L ${wf(Math.sin(a) * 51)} ${wf(-Math.cos(a) * 51)}" stroke="${WC.ink}" stroke-width="2.4"/>`;
  }
  if (label) o += txt(0, 112, label, 52);
  return G(tr(x, y, 0, s * pop), cut(o, 6, 0.26));
}
function battery(x, y, s, level, pop = 1, check = 0) {
  if (pop <= 0) return '';
  let o = paint(P.rrect(-70, -36, 140, 72, 14), COL.paper, { v: 40, s: 4, k: 0.4, ink: 3.4 }) + paint(P.rrect(70, -14, 14, 28, 4), '#c9b089', { v: 10, s: 2, k: 0.4, ink: 3 });
  for (let i = 0; i < 4; i++) if (level > i / 4 + 0.01) o += paint(P.rrect(-60 + i * 31, -26, 26, 52, 6), '#8cc063', { v: 20, s: 5 + i, k: 0.6, ink: 2.2 });
  if (check > 0) o += G(tr(78, -44, 0, popIn(check)), paint(P.circle(0, 0, 26), '#8cc063', { v: 20, s: 7, k: 0.6, ink: 3 }) + ink('M -12 0 L -3 9 L 13 -9', 5.5, '#fffdf6'));
  return G(tr(x, y, 0, s * pop), cut(o, 6, 0.26));
}
// little wooden garden sign: the plant's name, plus tally marks as it "keeps score"
function plantSign(x, y, s, rise, marks) {
  if (rise <= 0) return '';
  let o = paint('M -9 0 L -9 -150 L 9 -150 L 9 0 Z', '#b48a5f', { v: 20, s: 3, k: 0.7, ink: 2.8 });
  o += paint(P.rrect(-112, -270, 224, 136, 12), '#e0c79d', { v: 50, s: 4, k: 0.6, ink: 3 });
  o += txt(0, -222, 'Venus flytrap', 40);
  const n = Math.min(5, Math.floor(marks));
  for (let i = 0; i < Math.min(4, n); i++) o += ink(`M ${-36 + i * 22} -196 L ${-38 + i * 22} -150`, 5.5);
  if (n >= 5) o += ink('M -54 -158 L 46 -190', 5.5);
  return G(`translate(${wf(x)} ${wf(y)}) scale(${wf(s)} ${wf(s * popIn(rise))}) rotate(-3)`, cut(o, 5, 0.26));
}
function signpost(x, y, s, lines, pop = 1) {
  if (pop <= 0) return '';
  let o = paint('M -10 0 L -10 -250 L 10 -250 L 10 0 Z', '#a57a52', { v: 30, s: 3, k: 0.8, ink: 3 });
  lines.forEach(([label, side, dy], i) => {
    const w = label.length * 25 + 60, h = 66, x0 = side > 0 ? -24 : -w + 24;
    const tip = side > 0 ? `L ${x0 + w + 26} ${dy + h / 2} L ${x0 + w} ${dy + h}` : `L ${x0 + w} ${dy + h}`;
    const d = side > 0 ? `M ${x0} ${dy} L ${x0 + w} ${dy} ${tip} L ${x0} ${dy + h} Z` : `M ${x0} ${dy} L ${x0 + w} ${dy} L ${x0 + w} ${dy + h} L ${x0} ${dy + h} L ${x0 - 26} ${dy + h / 2} Z`;
    o += paint(d, '#d6bd93', { v: 40, s: 5 + i, k: 0.7, ink: 3 }) + txt(x0 + w / 2 + (side > 0 ? 6 : -6), dy + 48, label, 46, '#3b2f27', 'middle', ' letter-spacing="1"');
  });
  o += tuft(0, 4, 0.5, 31);
  return G(tr(x, y, 0, s * pop), cut(o, 5, 0.26));
}
function leafIcon(x, y, s) {
  return G(tr(x, y, -30, s), paint('M -16 0 Q 0 -14 16 0 Q 0 14 -16 0 Z', COL.leaf, { v: 20, s: 3, k: 0.6, ink: 2.4 }) + ink('M -12 0 H 12', 1.6));
}
