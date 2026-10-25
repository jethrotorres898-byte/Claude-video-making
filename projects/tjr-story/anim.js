'use strict';
// "The Student & The Teacher": stickman trading story, 720x1280 logical canvas.
// Everything is a pure function of time t (seconds) so tools/render.js can
// step through frames deterministically.

window.DURATION = 40.5;

const GOLD = '#f6b941', GREEN = '#27c75e', RED = '#f04438', WHITE = '#f5f5f5';
const INK = '#0a0a0a', GREY = '#9a9a9a', DIM = '#5c5c5c';
const IMG = '../../assets/img/tjr.jpg';

// ---------- utils ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const f1 = (v) => (+v).toFixed(1);
const ease = {
  inOut: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  inOut3: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  out: (u) => 1 - Math.pow(1 - u, 3),
  in: (u) => u * u * u,
  back: (u) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
};
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mix(a, b, u) {
  if (typeof a === 'number') return a + (b - a) * u;
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], u));
  if (a && typeof a === 'object') {
    const o = {};
    for (const k in a) o[k] = k in b ? mix(a[k], b[k], u) : a[k];
    for (const k in b) if (!(k in o)) o[k] = b[k];
    return o;
  }
  return u < 0.5 ? a : b;
}
// keys: [[time, value], ...] sorted by time; eased between neighbours.
function track(t, keys, e = ease.inOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) return mix(a, b, e((t - t0) / (t1 - t0 || 1)));
  }
  return keys[keys.length - 1][1];
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function text(x, y, s, o = {}) {
  const { size = 40, fill = WHITE, weight = 700, anchor = 'middle', family = 'Oswald', ls = 0, filter = '', op = 1 } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" font-family="${family}" font-weight="${weight}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}" opacity="${op}"${filter ? ` filter="url(#${filter})"` : ''}>${esc(s)}</text>`;
}
const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

// ---------- stickman rig ----------
const B = { torso: 150, R: 64, ua: 90, fa: 88, th: 94, sh: 92, tw: 50, lw: 26 };

function ik(S, T, a, b, bend) {
  const dx = T[0] - S[0], dy = T[1] - S[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(a - b) + 0.5, a + b - 0.5);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const E = [S[0] + a * Math.cos(th + bend * al), S[1] + a * Math.sin(th + bend * al)];
  const ex = T[0] - E[0], ey = T[1] - E[1], el = Math.hypot(ex, ey) || 1;
  return [E, [E[0] + (ex / el) * b, E[1] + (ey / el) * b]];
}
function limb(pts, w, col) {
  const d = 'M' + pts.map((q) => f1(q[0]) + ' ' + f1(q[1])).join(' L');
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 8}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const FACE = {
  neutral: { eo: 1, bA: 0, bY: 0, mw: 0.15, mc: 0, mo: 0, lx: 0, ly: 0, hp: 0, sw: 0 },
  worried: { eo: 1.05, bA: -16, bY: 0.05, mw: 0.13, mc: -0.05, mo: 0.03, lx: 0, ly: 0, hp: 0, sw: 1 },
  angry: { eo: 0.85, bA: 24, bY: -0.04, mw: 0.11, mc: -0.05, mo: 0.02, lx: 0.02, ly: 0, hp: 0, sw: 0 },
  shocked: { eo: 1.5, bA: -12, bY: 0.14, mw: 0.08, mc: -0.08, mo: 0.15, lx: 0, ly: 0, hp: 0, sw: 1 },
  sad: { eo: 0.42, bA: -20, bY: 0, mw: 0.12, mc: -0.07, mo: 0, lx: 0, ly: 0.08, hp: 0, sw: 0 },
  bored: { eo: 0.5, bA: 0, bY: -0.03, mw: 0.11, mc: 0, mo: 0, lx: 0.04, ly: 0, hp: 0, sw: 0 },
  curious: { eo: 1.35, bA: -8, bY: 0.12, mw: 0.07, mc: -0.04, mo: 0.08, lx: 0.05, ly: -0.02, hp: 0, sw: 0 },
  happy: { eo: 1, bA: -6, bY: 0.05, mw: 0.19, mc: 0.1, mo: 0.05, lx: 0.02, ly: 0, hp: 0, sw: 0 },
  focus: { eo: 0.8, bA: 14, bY: -0.02, mw: 0.1, mc: 0, mo: 0, lx: 0.05, ly: 0.04, hp: 0, sw: 0 },
  calm: { eo: 0.85, bA: 9, bY: 0, mw: 0.11, mc: 0.03, mo: 0, lx: 0.04, ly: -0.02, hp: 0, sw: 0 },
  joy: { eo: 1, bA: -8, bY: 0.1, mw: 0.23, mc: 0.12, mo: 0.13, lx: 0.02, ly: 0, hp: 1, sw: 0 },
};
// faces(t, [[time, 'name'], ...]): snappy expression changes.
function faces(t, keys, dur = 0.18) {
  const k = [];
  keys.forEach(([tt, n], i) => { if (i) k.push([tt, FACE[keys[i - 1][1]]]); k.push([tt + (i ? dur : 0), FACE[n]]); });
  return track(t, k);
}
function blink(t, seed = 0) {
  const ph = (t + seed) % 3.3;
  return ph < 0.06 ? 1 - ph / 0.06 : ph < 0.13 ? (ph - 0.06) / 0.07 : 1;
}

function headSVG(c, rot, p) {
  const R = B.R, f = p.flip ?? 1;
  let o = `<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(rot)})">`;
  if (p.photo) {
    const k = R / 96;
    o += `<circle r="${R + 5}" fill="${INK}"/>`;
    o += `<g clip-path="url(#hclip)"><use href="#tjrimg" transform="scale(${f} 1) scale(${k.toFixed(4)}) translate(-151 -104)"/></g>`;
    o += `<circle r="${R}" fill="none" stroke="${WHITE}" stroke-width="5"/></g>`;
    return o;
  }
  const e = p.face || FACE.neutral;
  o += `<circle r="${R}" fill="${WHITE}" stroke="${INK}" stroke-width="6"/>`;
  o += `<path d="M ${-R * 0.82} ${R * 0.35} A ${R * 0.95} ${R * 0.95} 0 0 0 ${R * 0.1} ${R * 0.93}" stroke="#d2d2d2" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const lx = e.lx * R, ly = e.ly * R, sw = R * 0.05;
  const eyes = [[0.06 * R + lx, -0.1 * R + ly], [0.5 * R + lx, -0.1 * R + ly]];
  const eo = e.eo * (p.blink ?? 1);
  eyes.forEach((q, i) => {
    const rx = 0.078 * R * (i ? 0.92 : 1);
    if (e.hp > 0.5) {
      o += `<path d="M ${f1(q[0] - rx * 1.2)} ${f1(q[1] + 0.03 * R)} Q ${f1(q[0])} ${f1(q[1] - 0.12 * R)} ${f1(q[0] + rx * 1.2)} ${f1(q[1] + 0.03 * R)}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
    } else {
      const ry = Math.max(0.012 * R, 0.115 * R * eo);
      o += `<ellipse cx="${f1(q[0])}" cy="${f1(q[1])}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${INK}"/>`;
      if (eo > 0.7) o += `<circle cx="${f1(q[0] + rx * 0.3)}" cy="${f1(q[1] - ry * 0.4)}" r="${f1(R * 0.022)}" fill="#fff"/>`;
    }
    const by = q[1] - 0.25 * R - e.bY * R, a = i ? -e.bA : e.bA;
    o += `<line x1="${f1(q[0] - 0.12 * R)}" y1="${f1(by)}" x2="${f1(q[0] + 0.12 * R)}" y2="${f1(by)}" transform="rotate(${f1(a)} ${f1(q[0])} ${f1(by)})" stroke="${INK}" stroke-width="${f1(sw * 1.05)}" stroke-linecap="round"/>`;
  });
  const mx = 0.3 * R + lx * 0.7, my = 0.42 * R + ly * 0.5, w = e.mw * R, cv = e.mc * R, op = e.mo * R;
  if (op > 0.6) {
    o += `<path d="M ${f1(mx - w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv)} ${f1(mx + w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv + 2.4 * op)} ${f1(mx - w)} ${f1(my)} Z" fill="#2b1010" stroke="${INK}" stroke-width="${f1(sw)}" stroke-linejoin="round"/>`;
  } else {
    o += `<path d="M ${f1(mx - w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv)} ${f1(mx + w)} ${f1(my)}" fill="none" stroke="${INK}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
  }
  if (e.sw > 0.5) {
    const sx = 0.86 * R, sy = -0.5 * R;
    o += `<path d="M ${sx} ${sy} q 6 11 0 15 q -6 -4 0 -15 Z" fill="#7cc4ff" stroke="${INK}" stroke-width="2"/>`;
  }
  return o + '</g>';
}

// p: x,y = hip (world), s scale, flip (1 faces right, -1 faces left), lean/tilt in degrees,
// hN/hF = near/far hand targets, fN/fF = near/far foot targets (all world coords).
function stick(p) {
  const s = p.s ?? 1, f = p.flip ?? 1, lean = p.lean ?? 0, tilt = p.tilt ?? 0;
  const L = (q) => [(q[0] - p.x) / (f * s), (q[1] - p.y) / s];
  const Wd = (q) => [p.x + q[0] * f * s, p.y + q[1] * s];
  const ta = ((180 - lean) * Math.PI) / 180;
  const tv = [Math.sin(ta), Math.cos(ta)];
  const neck = [tv[0] * B.torso, tv[1] * B.torso];
  const sh = [tv[0] * B.torso * 0.84, tv[1] * B.torso * 0.84];
  const ha = ((180 - lean - tilt) * Math.PI) / 180;
  const head = [neck[0] + Math.sin(ha) * B.R * 0.78, neck[1] + Math.cos(ha) * B.R * 0.78];
  const [eN, hN] = ik(sh, L(p.hN), B.ua, B.fa, p.bN ?? 1);
  const [eF, hF] = ik(sh, L(p.hF), B.ua, B.fa, p.bF ?? 1);
  const [kN, aN] = ik([4, 0], L(p.fN), B.th, B.sh, -1);
  const [kF, aF] = ik([-4, 0], L(p.fF), B.th, B.sh, -1);
  const g = `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">`;
  let back = g;
  back += limb([sh, eF, hF], B.lw, '#c9c9c9');
  back += limb([[-4, 0], kF, aF, [aF[0] + 22, aF[1] + 1]], B.lw, '#d0d0d0');
  back += limb([[4, 0], kN, aN, [aN[0] + 22, aN[1] + 1]], B.lw, WHITE);
  back += limb([[0, 0], [tv[0] * B.torso * 0.8, tv[1] * B.torso * 0.8]], B.tw, WHITE);
  if (p.chain) {
    const [nx, ny] = neck;
    back += `<path d="M ${nx - 22} ${ny + 4} Q ${nx + 6} ${ny + 46} ${nx + 26} ${ny + 6}" fill="none" stroke="#8f99a3" stroke-width="6" stroke-dasharray="5 3"/>`;
    back += `<path d="M ${nx - 25} ${ny + 8} Q ${nx + 6} ${ny + 66} ${nx + 29} ${ny + 10}" fill="none" stroke="#7d8790" stroke-width="7" stroke-dasharray="6 3"/>`;
  }
  back += headSVG(head, lean + tilt, p) + '</g>';
  let front = g + limb([sh, eN, hN], B.lw, WHITE) + '</g>';
  return { back, front, svg: back + front, head: Wd(head), hN: Wd(hN), hF: Wd(hF), sh: Wd(sh) };
}

function chair(x, y, floor, f = 1, op = 1) {
  const h = floor - y;
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f} 1)" opacity="${op}" fill="#000" stroke="${WHITE}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">` +
    `<line x1="-58" y1="10" x2="-70" y2="${h - 6}" stroke="#777"/><line x1="26" y1="10" x2="34" y2="${h - 6}" stroke="#777"/>` +
    `<path d="M -84 2 L -108 -170 L -90 -173 L -66 0 Z"/>` +
    `<rect x="-92" y="-6" width="142" height="17" rx="7"/>` +
    `<line x1="-82" y1="12" x2="-98" y2="${h}"/><line x1="40" y1="12" x2="50" y2="${h}"/></g>`;
}

// ---------- chart ----------
function makeCandles(seed, n, drift, vol, start = 100) {
  const r = rng(seed); let p = start; const out = [];
  for (let i = 0; i < n; i++) {
    const o = p, c = o + (r() - 0.5 + drift) * vol * 2;
    out.push({ o, c, h: Math.max(o, c) + r() * vol * 0.7, l: Math.min(o, c) - r() * vol * 0.7, v: 0.25 + r() * 0.75 });
    p = c;
  }
  return out;
}
const C1 = (() => {
  const c = makeCandles(7, 22, 0.06, 6);
  let p = c[c.length - 1].c;
  c.push({ o: p, c: p - 58, h: p + 3, l: p - 62, v: 1 }); p -= 58;
  c.push({ o: p, c: p - 7, h: p + 4, l: p - 11, v: 0.7 }); p -= 7;
  c.push({ o: p, c: p + 2, h: p + 5, l: p - 6, v: 0.4 });
  return c;
})();
const C2 = (() => {
  const c = makeCandles(4, 18, 0.03, 4.5);
  let p = c[c.length - 1].c;
  for (const d of [10, 15, 8, 19, 13, 17]) { c.push({ o: p, c: p + d, h: p + d + 3, l: p - 2, v: 0.9 }); p += d; }
  return c;
})();

function chartSVG(candles, nv, box, o = {}) {
  const N = o.slots || candles.length + 2;
  const full = Math.floor(nv), frac = nv - full;
  const vis = [];
  for (let i = 0; i < Math.min(candles.length, full + 1); i++) {
    const c = candles[i];
    if (i < full) { vis.push(c); continue; }
    if (frac <= 0.001) break;
    const cc = lerp(c.o, c.c, ease.out(frac));
    vis.push({ o: c.o, c: cc, v: c.v,
      h: Math.max(c.o, cc) + (c.h - Math.max(c.o, c.c)) * frac,
      l: Math.min(c.o, cc) - (Math.min(c.o, c.c) - c.l) * frac });
  }
  let lo = Infinity, hi = -Infinity;
  for (const c of vis) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); }
  const mid = (lo + hi) / 2, span = Math.max(hi - lo, o.minSpan || 40);
  lo = mid - span * 0.56; hi = mid + span * 0.56;
  const Y = (v) => box.y1 - ((v - lo) / (hi - lo)) * (box.y1 - box.y0);
  const sp = (box.x1 - box.x0 - 24) / N, cw = sp * 0.62;
  let axes = `<g stroke="${WHITE}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9">` +
    `<line x1="${box.x0}" y1="${box.y1 + 8}" x2="${box.x0}" y2="${box.y0 - 30}"/><path d="M ${box.x0 - 7} ${box.y0 - 20} L ${box.x0} ${box.y0 - 32} L ${box.x0 + 7} ${box.y0 - 20}"/>` +
    `<line x1="${box.x0 - 8}" y1="${box.y1 + 8}" x2="${box.x1 + 10}" y2="${box.y1 + 8}"/><path d="M ${box.x1} ${box.y1 + 1} L ${box.x1 + 12} ${box.y1 + 8} L ${box.x1} ${box.y1 + 15}"/></g>`;
  let vol = '', cs = '';
  let lastClose = null, lastX = 0, lastUp = true;
  for (let i = 0; i < vis.length; i++) {
    const c = vis[i], cc = c.c, h = c.h, l = c.l;
    const up = cc >= c.o, col = up ? GREEN : RED;
    const x = box.x0 + 18 + i * sp + sp / 2;
    const yt = Y(Math.max(c.o, cc)), yb = Y(Math.min(c.o, cc));
    cs += `<line x1="${f1(x)}" y1="${f1(Y(h))}" x2="${f1(x)}" y2="${f1(Y(l))}" stroke="${col}" stroke-width="3"/>`;
    cs += `<rect x="${f1(x - cw / 2)}" y="${f1(yt)}" width="${f1(cw)}" height="${f1(Math.max(2, yb - yt))}" fill="${col}"/>`;
    vol += `<rect x="${f1(x - cw / 2)}" y="${f1(box.y1 + 6 - c.v * 34)}" width="${f1(cw)}" height="${f1(c.v * 34)}" fill="${col}" opacity="0.22"/>`;
    lastClose = cc; lastX = x; lastUp = up;
  }
  let tag = '';
  if (lastClose !== null && o.tag !== false) {
    const y = Y(lastClose), col = lastUp ? GREEN : RED, v = (lastClose * 0.35 + 0.5).toFixed(2);
    tag = `<line x1="${f1(lastX + cw / 2 + 2)}" y1="${f1(y)}" x2="${f1(lastX + cw / 2 + 30)}" y2="${f1(y)}" stroke="${col}" stroke-width="2"/>` +
      `<rect x="${f1(lastX + cw / 2 + 30)}" y="${f1(y - 13)}" width="70" height="26" rx="5" fill="${col}"/>` +
      text(lastX + cw / 2 + 65, y + 7, '$' + v, { size: 17, fill: '#06140a', weight: 700 });
  }
  return { svg: axes + vol + `<g filter="url(#glow2)">${cs}</g>` + tag, Y, X: (i) => box.x0 + 18 + i * sp + sp / 2 };
}

function button(x, y, label, pressed, glowCol = WHITE) {
  const w = 96, h = 50;
  const fill = pressed > 0 ? `rgba(255,255,255,${(0.92 * pressed).toFixed(2)})` : '#050505';
  const tc = pressed > 0.5 ? '#111' : WHITE;
  return `<g filter="url(#glow2)"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="11" fill="${fill}" stroke="${pressed > 0 ? glowCol : WHITE}" stroke-width="${pressed > 0 ? 4 : 3}"/></g>` +
    text(x, y + 10, label, { size: 27, fill: tc, weight: 700 });
}

// ---------- captions ----------
const CAPS = [
  { a: 0.05, b: 2.4, t: 'HE TRADED [EVERY DAY]' },
  { a: 2.4, b: 4.6, t: 'AND [LOST] EVERY DAY' },
  { a: 4.6, b: 7.0, t: 'ANOTHER [BLOWN]|ACCOUNT' },
  { a: 7.0, b: 9.5, t: 'SO HE TOOK|A [BREAK]' },
  { a: 9.5, b: 12.4, t: 'JUST [SCROLLING...]' },
  { a: 12.4, b: 16.0, t: 'UNTIL HE FOUND [TJR]', sub: 'A DAY TRADER WHO TEACHES PEOPLE HOW TO TRADE', subA: 13.0 },
  { a: 16.0, b: 19.6, t: 'HE STUDIED|[EVERY GUIDE]' },
  { a: 19.6, b: 21.8, t: '[DAY] AFTER [DAY]' },
  { a: 21.8, b: 23.0, t: '[ONE MONTH] LATER...' },
  { a: 23.0, b: 26.2, t: '100% [DISCIPLINE]' },
  { a: 26.2, b: 30.0, t: 'HIS FIRST [BIG WIN]' },
  { a: 30.0, b: 32.6, t: 'THEN HE MET THE|MAN WHO [TAUGHT HIM]' },
  { a: 32.6, b: 36.0, t: 'THE STUDENT MET|[THE TEACHER]' },
  { a: 36.0, b: 38.2, t: 'EVERY [PRO] WAS|ONCE A [BEGINNER]' },
  { a: 38.2, b: 40.5, t: 'STAY DISCIPLINED.|[KEEP GOING.]' },
];
function parseCap(s) {
  return s.split('|').map((line) => line.split(/(\[[^\]]+\])/).filter(Boolean)
    .map((part) => (part[0] === '[' ? [part.slice(1, -1), GOLD] : [part, WHITE])));
}
function captions(t) {
  let o = '';
  for (const c of CAPS) {
    if (t < c.a || t > c.b) continue;
    const pin = prog(t, c.a, c.a + 0.3), pout = c.b >= window.DURATION ? 0 : prog(t, c.b - 0.16, c.b);
    const sc = lerp(0.8, 1, ease.back(pin)), op = clamp(pin * 3) * (1 - pout);
    const size = 68, lh = 76, y0 = 165;
    const lines = parseCap(c.t);
    o += `<g opacity="${op.toFixed(3)}" transform="translate(360 ${y0}) scale(${sc.toFixed(4)}) translate(-360 ${-y0})">`;
    lines.forEach((ln, i) => {
      const spans = ln.map(([s, col]) => `<tspan fill="${col}">${esc(s)}</tspan>`).join('');
      o += `<text x="360" y="${y0 + i * lh}" font-family="Oswald" font-weight="700" font-size="${size}" text-anchor="middle" filter="url(#glow)">${spans}</text>`;
    });
    o += '</g>';
    if (c.sub) {
      const ps = prog(t, c.subA, c.subA + 0.35) * (1 - pout);
      o += text(360, y0 + 52 + lerp(10, 0, ease.out(ps)), c.sub, { size: 25, weight: 500, fill: '#cfcfcf', op: ps.toFixed(3), ls: 0.5 });
    }
  }
  return o;
}

// ---------- scene 1: losing + the break (0 - 9.5) ----------
const S1 = { hip: [200, 1070], s: 1.15, chairX: 226, BUY: [352, 900], SELL: [460, 900], floor: 1190 };
const BOX = { x0: 70, x1: 640, y0: 320, y1: 720 };

function sitFeet(hip, s) {
  return { fN: [hip[0] + 104 * s, hip[1] + 104 * s], fF: [hip[0] + 90 * s, hip[1] + 106 * s] };
}

function scene1(t) {
  let o = '';
  const shake = t > 3.0 && t < 3.6 ? (1 - prog(t, 3.0, 3.6)) * 12 : 0;
  const sx = Math.sin(t * 91) * shake, sy = Math.cos(t * 77) * shake;
  o += `<g transform="translate(${f1(sx)} ${f1(sy)})">`;

  const uiOp = 1 - prog(t, 7.0, 8.0);
  const nv = t < 2.9 ? 9 + (t / 2.9) * 13 : t < 3.6 ? 22 + prog(t, 2.95, 3.5) : 23 + 2 * prog(t, 3.9, 5.2);
  const ch = chartSVG(C1, nv, BOX);
  let bal = t < 2.9 ? 10000 - 3100 * prog(t, 0, 2.9) + Math.sin(t * 13) * 60 : lerp(6900, 2140, ease.out(prog(t, 2.95, 3.6)));
  const balCol = t < 2.9 ? WHITE : RED;

  // button presses: [time, which]
  const presses = [[0.35, 'BUY'], [0.95, 'SELL'], [1.5, 'BUY'], [2.05, 'SELL'], [2.6, 'BUY']];
  let pressB = 0, pressS = 0;
  for (const [pt, w] of presses) {
    const v = t >= pt && t < pt + 0.35 ? 1 - prog(t, pt + 0.1, pt + 0.35) : 0;
    if (w === 'BUY') pressB = Math.max(pressB, v); else pressS = Math.max(pressS, v);
  }
  o += `<g opacity="${uiOp.toFixed(3)}">` + ch.svg;
  o += button(S1.BUY[0], S1.BUY[1], 'BUY', pressB, GREEN) + button(S1.SELL[0], S1.SELL[1], 'SELL', pressS, RED);
  o += text(640, 1010, 'BALANCE', { size: 22, fill: GREY, anchor: 'end', weight: 500, ls: 2 });
  o += text(640, 1066, money(bal), { size: 54, fill: balCol, anchor: 'end', filter: 'glow2' });
  o += '</g>';

  // red flash on the crash
  if (t > 2.95 && t < 3.8) o += `<rect width="720" height="1280" fill="${RED}" opacity="${(0.28 * (1 - prog(t, 2.95, 3.8))).toFixed(3)}"/>`;

  // stickman
  const hip = S1.hip;
  const handKeys = [[0, [300, 930]]];
  for (const [pt, w] of presses) {
    const tgt = w === 'BUY' ? S1.BUY : S1.SELL;
    handKeys.push([pt - 0.22, [tgt[0] - 62, tgt[1] - 30]], [pt, [tgt[0] - 36, tgt[1] + 4]], [pt + 0.12, [tgt[0] - 44, tgt[1] - 10]]);
  }
  handKeys.push(
    [3.0, [290, 900]], [3.25, [300, 820]], // shocked, hands up
    [4.6, [300, 830]], [5.4, [306, 1072]], // slump, hands on knees
    [7.2, [306, 1072]], [7.9, [282, 1058]], // lean back
    [8.5, [282, 1058]], [9.1, [318, 955]], // pick up phone
  );
  const hN = track(t, handKeys);
  const hF = track(t, [[0, [262, 945]], [3.0, [262, 945]], [3.25, [250, 840]], [4.6, [250, 850]], [5.4, [292, 1080]], [7.2, [292, 1080]], [7.9, [262, 1062]], [8.5, [262, 1062]], [9.1, [300, 968]]]);
  const nearSell = (pt) => presses.some(([p, w]) => w === 'SELL' && Math.abs(t - p) < 0.3);
  const body = track(t, [
    [0, { lean: 12, tilt: -4 }], [2.9, { lean: 14, tilt: -4 }], [3.15, { lean: -6, tilt: -12 }],
    [4.6, { lean: -4, tilt: -8 }], [5.5, { lean: 34, tilt: 26 }], [7.1, { lean: 34, tilt: 26 }],
    [7.9, { lean: -8, tilt: -14 }], [8.5, { lean: -6, tilt: -10 }], [9.1, { lean: 8, tilt: 22 }],
  ]);
  const lean = body.lean + (t < 2.9 && nearSell(t) ? 8 : 0) + (t < 2.9 ? Math.sin(t * 22) * 1.5 : 0);
  const face = faces(t, [[0, 'worried'], [1.4, 'angry'], [3.05, 'shocked'], [4.7, 'sad'], [7.6, 'bored']]);
  const sm = stick({ x: hip[0], y: hip[1] + (t > 7.2 && t < 8.2 ? Math.sin(prog(t, 7.2, 8.2) * Math.PI) * -6 : 0), s: S1.s, lean, tilt: body.tilt, hN, hF, ...sitFeet(hip, S1.s), face, blink: blink(t) });
  o += chair(S1.chairX, hip[1] + 13, S1.floor) + sm.back;
  if (t > 8.7) {
    const po = prog(t, 8.7, 8.95), h = sm.hN;
    o += `<g opacity="${po}" transform="translate(${f1(h[0] + 4)} ${f1(h[1] - 30)}) rotate(-18)"><rect x="-17" y="-30" width="34" height="60" rx="7" fill="#111" stroke="${WHITE}" stroke-width="3.5"/><rect x="-12" y="-23" width="24" height="44" rx="3" fill="#2a4a6a"/></g>`;
  }
  o += sm.front;
  return o + '</g>';
}

// ---------- scene 2: the feed (9.5 - 16) ----------
const PH = { x: 300, y: 380, w: 340, h: 640 };
const FEED = [
  { name: 'CryptoKing99', sub: 'Sponsored', col: '#5b3bd1', big: 'GET RICH IN 1 DAY!!', small: 'no strategy needed' },
  { name: 'memes.daily', sub: '2h', col: '#d18b3b', big: 'ME AFTER 1 TRADE', small: '"I\'m basically a pro"' },
  { name: 'LamboLife', sub: 'Sponsored', col: '#c23b5b', big: 'COPY MY TRADES $$$', small: 'DM for VIP group' },
  { name: '100xSignals', sub: '5h', col: '#3b8bd1', big: '100X SIGNALS', small: 'guaranteed profits' },
  { name: 'gym.bro', sub: '1d', col: '#3bb07a', big: 'DAY 1 VS DAY 365', small: 'just keep going' },
  { tjr: true },
  { name: 'random.clips', sub: '3h', col: '#777', big: 'WAIT FOR IT...', small: '' },
];
const POST_H = 330;

function postSVG(p, x, y, w, t, tjrIntro) {
  let o = '';
  if (p.tjr) {
    const glow = tjrIntro;
    o += `<rect x="${x + 4}" y="${y + 2}" width="${w - 8}" height="${POST_H - 14}" rx="14" fill="#161616" stroke="${GOLD}" stroke-width="${f1(1 + 3 * glow)}" opacity="1"${glow > 0 ? ' filter="url(#glow2)"' : ''}/>`;
    o += `<g clip-path="url(#avclip)" transform="translate(${x + 32} ${y + 32})"><use href="#tjrimg" transform="scale(0.2) translate(-151 -104)"/></g>`;
    o += `<circle cx="${x + 32}" cy="${y + 32}" r="20" fill="none" stroke="${GOLD}" stroke-width="2.5"/>`;
    o += text(x + 62, y + 30, 'TJR', { size: 22, anchor: 'start' });
    o += `<circle cx="${x + 108}" cy="${y + 23}" r="9" fill="#1d9bf0"/><path d="M ${x + 103.5} ${y + 23} l 3.2 3.2 l 5.5 -6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    o += text(x + 62, y + 50, 'Day Trader', { size: 14, anchor: 'start', fill: GREY, weight: 500 });
    o += `<g clip-path="url(#postclip)" transform="translate(${x + 12} ${y + 62})"><use href="#tjrimg" transform="scale(0.96) translate(0 -8)"/></g>`;
    o += `<rect x="${x + 12}" y="${y + 216}" width="${w - 24}" height="46" fill="rgba(0,0,0,0.75)"/>`;
    o += text(x + w / 2, y + 248, 'HOW I TRADE: FULL GUIDE', { size: 22, fill: GOLD });
    const fol = prog(t, 14.0, 14.15);
    const bw = 104, bx = x + w - bw - 14, by = y + 274;
    o += `<rect x="${bx}" y="${by}" width="${bw}" height="32" rx="16" fill="${fol > 0.5 ? '#1c1c1c' : '#1d9bf0'}" stroke="${fol > 0.5 ? GREY : '#1d9bf0'}" stroke-width="2"/>`;
    o += text(bx + bw / 2, by + 22, fol > 0.5 ? 'FOLLOWING' : 'FOLLOW', { size: 16 });
    if (t > 13.9 && t < 14.5) {
      const r = prog(t, 13.9, 14.5);
      o += `<circle cx="${bx + bw / 2}" cy="${by + 16}" r="${f1(10 + r * 40)}" fill="none" stroke="#fff" stroke-width="3" opacity="${f1(1 - r)}"/>`;
    }
    o += heartRow(x + 18, y + 290, t > 14.2);
    return o;
  }
  o += `<circle cx="${x + 32}" cy="${y + 32}" r="20" fill="${p.col}"/>`;
  o += text(x + 62, y + 30, p.name, { size: 18, anchor: 'start', weight: 500 });
  o += text(x + 62, y + 50, p.sub, { size: 13, anchor: 'start', fill: GREY, weight: 500 });
  o += `<rect x="${x + 12}" y="${y + 62}" width="${w - 24}" height="200" rx="8" fill="${p.col}" opacity="0.55"/>`;
  o += text(x + w / 2, y + 168, p.big, { size: 30 });
  if (p.small) o += text(x + w / 2, y + 200, p.small, { size: 16, weight: 500, fill: '#e6e6e6' });
  o += heartRow(x + 18, y + 290, false);
  return o;
}
function heartRow(x, y, liked) {
  return `<path transform="translate(${x} ${y})" d="M 12 21 C 2 13 0 8 3 4 C 6 0 11 1 12 5 C 13 1 18 0 21 4 C 24 8 22 13 12 21 Z" fill="${liked ? '#ff3b5c' : 'none'}" stroke="${liked ? '#ff3b5c' : WHITE}" stroke-width="2.2"/>` +
    `<path transform="translate(${x + 40} ${y})" d="M 3 3 H 21 V 16 H 10 L 5 21 V 16 H 3 Z" fill="none" stroke="${WHITE}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path transform="translate(${x + 80} ${y})" d="M 2 12 L 21 3 L 15 21 L 11 13 Z" fill="none" stroke="${WHITE}" stroke-width="2.2" stroke-linejoin="round"/>`;
}

function scene2(t) {
  let o = '';
  const zoom = 1 + 0.1 * ease.inOut(prog(t, 12.55, 13.3));
  const cx = 470, cy = 640;
  o += `<g transform="translate(${cx} ${cy}) scale(${zoom.toFixed(4)}) translate(${-cx} ${-cy})">`;
  // flicks of the feed
  const target = 60 + 5 * POST_H - 110;
  const scroll = track(t, [[9.6, 0], [10.3, 420], [10.45, 420], [11.1, 950], [11.25, 950], [12.6, target]], ease.out);
  const swipe = (a, b) => (t > a && t < b ? Math.sin(prog(t, a, b) * Math.PI) : 0);
  const sw = swipe(9.55, 10.15) + swipe(10.4, 11.0) + swipe(11.2, 11.85);

  const hip = [150, 1090], s = 1.15;
  const face = faces(t, [[9.5, 'bored'], [12.55, 'curious'], [14.4, 'happy']]);
  const body = track(t, [[9.5, { lean: 4, tilt: -6 }], [12.5, { lean: 4, tilt: -6 }], [12.9, { lean: 16, tilt: -10 }], [16, { lean: 16, tilt: -10 }]]);
  const hN = [PH.x + 16 + sw * 26, PH.y + 520 - sw * 110];
  const hF = [PH.x + 10, PH.y + 580];
  const sm = stick({ x: hip[0], y: hip[1], s, lean: body.lean, tilt: body.tilt, hN, hF, ...sitFeet(hip, s), face, blink: blink(t, 1.1) });
  o += chair(176, hip[1] + 13, 1210) + sm.back;

  // phone body + feed
  o += `<rect x="${PH.x}" y="${PH.y}" width="${PH.w}" height="${PH.h}" rx="40" fill="#0d0d0d" stroke="${WHITE}" stroke-width="5"/>`;
  const sx = PH.x + 14, sy = PH.y + 14, sw2 = PH.w - 28, sh2 = PH.h - 28;
  o += `<g clip-path="url(#screenclip)"><rect x="${sx}" y="${sy}" width="${sw2}" height="${sh2}" fill="#050505"/>`;
  const intro = prog(t, 12.6, 12.9) * (0.6 + 0.4 * Math.sin(t * 6));
  FEED.forEach((p, i) => {
    const py = sy + 60 + i * POST_H - scroll;
    if (py > sy + sh2 || py + POST_H < sy) return;
    o += postSVG(p, sx, py, sw2, t, intro);
  });
  o += `<rect x="${sx}" y="${sy}" width="${sw2}" height="50" fill="#050505"/>`;
  o += text(sx + sw2 / 2, sy + 34, 'For You', { size: 20, weight: 700 });
  o += `<line x1="${sx}" y1="${sy + 50}" x2="${sx + sw2}" y2="${sy + 50}" stroke="#222" stroke-width="1.5"/>`;
  o += '</g>';
  o += `<rect x="${PH.x + PH.w / 2 - 40}" y="${PH.y + 22}" width="80" height="12" rx="6" fill="#0d0d0d"/>`;
  o += sm.front;

  // "!" pop over the head
  if (t > 12.6 && t < 13.9) {
    const pp = ease.back(prog(t, 12.6, 12.85)) * (1 - prog(t, 13.6, 13.9));
    const h = sm.head;
    o += `<g transform="translate(${f1(h[0] + 10)} ${f1(h[1] - 110)}) scale(${pp.toFixed(3)})">${text(0, 0, '!', { size: 74, fill: GOLD, family: 'Anton', weight: 400, filter: 'glow' })}</g>`;
  }
  return o + '</g>';
}

// ---------- scene 3: studying (16 - 23) ----------
const LESSONS = ['RISK MANAGEMENT', 'PATIENCE', 'A REAL TRADING PLAN', 'NO FOMO'];
function scene3(t) {
  let o = '';
  const hip = [168, 1090], s = 1.15, deskY = 958;
  // desk + laptop
  o += `<g stroke="${WHITE}" stroke-width="4" fill="#000" stroke-linecap="round" stroke-linejoin="round">` +
    `<line x1="356" y1="${deskY + 14}" x2="346" y2="1210"/><line x1="684" y1="${deskY + 14}" x2="694" y2="1210"/>` +
    `<line x1="380" y1="${deskY + 14}" x2="380" y2="1180" stroke="#666"/>` +
    `<rect x="318" y="${deskY}" width="402" height="16" rx="5"/></g>`;
  const lx0 = 432, lw = 210, lh = 150;
  o += `<rect x="${lx0 - 14}" y="${deskY - 9}" width="${lw + 34}" height="10" rx="4" fill="#111" stroke="${WHITE}" stroke-width="3.5"/>`;
  o += `<rect x="${lx0}" y="${deskY - 12 - lh}" width="${lw}" height="${lh}" rx="8" fill="#111" stroke="${WHITE}" stroke-width="4"/>`;
  o += `<g clip-path="url(#lapclip)"><use href="#tjrimg" transform="translate(${lx0 + 4} ${deskY - 8 - lh}) scale(0.68) translate(0 -14)"/></g>`;
  const pb = prog(t, 16, 23);
  o += `<rect x="${lx0 + 12}" y="${deskY - 34}" width="${lw - 24}" height="5" rx="2" fill="#555"/><rect x="${lx0 + 12}" y="${deskY - 34}" width="${f1((lw - 24) * (0.15 + 0.8 * pb))}" height="5" rx="2" fill="#ff2d2d"/>`;
  o += `<rect x="${lx0 + 10}" y="${deskY - lh}" width="54" height="22" rx="4" fill="rgba(0,0,0,0.7)"/>` + text(lx0 + 37, deskY - lh + 16, 'TJR', { size: 15, fill: GOLD });
  // notebook
  o += `<path d="M 322 ${deskY - 1} L 412 ${deskY - 1} L 400 ${deskY - 11} L 334 ${deskY - 11} Z" fill="#f2f2f2" stroke="${INK}" stroke-width="2"/>`;

  const writing = t < 19.4 || (t > 20 && t < 22.6);
  const wx = writing ? Math.sin(t * 9) * 12 : 0, wy = writing ? Math.sin(t * 19) * 3 : 0;
  const hN = [362 + wx, deskY - 12 + wy];
  const hF = [404, deskY - 6];
  const face = faces(t, [[16, 'focus'], [18.75, 'happy'], [19.5, 'focus'], [21.9, 'calm']]);
  const nod = t < 19.4 ? Math.sin(t * 3.4) * 4 : 0;
  const sm = stick({ x: hip[0], y: hip[1], s, lean: 12, tilt: -2 + nod, hN, hF, ...sitFeet(hip, s), face, blink: blink(t, 0.4) });
  o += chair(194, hip[1] + 13, 1210) + sm.back + sm.front;
  // pencil
  o += `<line x1="${f1(sm.hN[0] - 4)}" y1="${f1(sm.hN[1] - 22)}" x2="${f1(sm.hN[0] + 10)}" y2="${f1(sm.hN[1] + 8)}" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>`;

  // checklist
  const clOp = 1 - prog(t, 19.3, 19.65);
  if (clOp > 0) {
    o += `<g opacity="${clOp.toFixed(3)}">`;
    o += `<rect x="80" y="296" width="560" height="380" rx="24" fill="#0c0c0c" stroke="#2a2a2a" stroke-width="2"/>`;
    o += text(360, 344, "TJR'S LESSONS", { size: 24, fill: GOLD, weight: 500, ls: 3, op: prog(t, 16.2, 16.5) });
    LESSONS.forEach((l, i) => {
      const a = 16.6 + i * 0.7, pp = prog(t, a, a + 0.3);
      if (pp <= 0) return;
      const y = 410 + i * 72, sc = ease.back(pp);
      o += `<g opacity="${clamp(pp * 2).toFixed(3)}" transform="translate(${f1(lerp(-40, 0, ease.out(pp)))} 0)">`;
      o += `<g transform="translate(130 ${y}) scale(${sc.toFixed(3)})"><rect x="-22" y="-22" width="44" height="44" rx="9" fill="${GREEN}"/><path d="M -11 0 L -3 9 L 12 -9" stroke="#04210f" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      o += text(176, y + 13, l, { size: 36, anchor: 'start', weight: 700 });
      o += '</g>';
    });
    o += '</g>';
  }
  // calendar
  const calOp = prog(t, 19.6, 19.9);
  if (calOp > 0) {
    const day = 1 + Math.round(29 * ease.inOut3(prog(t, 19.9, 21.9)));
    const tick = (t * 30) % 1;
    const pop = day === 30 ? 1 + 0.12 * Math.sin(prog(t, 21.9, 22.2) * Math.PI) : 1;
    o += `<g opacity="${calOp.toFixed(3)}" transform="translate(360 470) scale(${pop.toFixed(3)})">`;
    o += `<rect x="-130" y="-160" width="260" height="290" rx="26" fill="#f4f4f4"/>`;
    o += `<path d="M -130 -96 V -134 A 26 26 0 0 1 -104 -160 H 104 A 26 26 0 0 1 130 -134 V -96 Z" fill="${RED}"/>`;
    o += text(0, -114, 'DAY', { size: 40, fill: '#fff', ls: 4 });
    o += text(0, 80, String(day), { size: 150, fill: '#111', family: 'Anton', weight: 400 });
    o += `<circle cx="-70" cy="-160" r="9" fill="#333"/><circle cx="70" cy="-160" r="9" fill="#333"/>`;
    o += '</g>';
    o += `<g opacity="${calOp.toFixed(3)}"><rect x="160" y="636" width="400" height="12" rx="6" fill="#222"/><rect x="160" y="636" width="${f1(400 * day / 30)}" height="12" rx="6" fill="${GREEN}" filter="url(#glow2)"/></g>`;
    void tick;
  }
  return o;
}

// ---------- scene 4: the win (23 - 30) ----------
const CONFETTI = (() => { const r = rng(99); return Array.from({ length: 70 }, () => ({ x: r() * 720, d: r() * 1.2, v: 260 + r() * 260, rot: r() * 360, vr: (r() - 0.5) * 600, sway: 10 + r() * 30, c: [GOLD, GREEN, WHITE, '#ffd979'][Math.floor(r() * 4)], w: 9 + r() * 7 })); })();

function scene4(t) {
  let o = '';
  const buyT = 25.0;
  const nv = t < 25.35 ? 18 : 18 + 6 * ease.inOut(prog(t, 25.35, 28.0));
  const ch = chartSVG(C2, nv, BOX);
  if (t > 26.6) o += `<rect width="720" height="1280" fill="url(#greenglow)" opacity="${(0.5 + 0.2 * Math.sin(t * 5)).toFixed(3)}"/>`;
  o += ch.svg;
  const entry = C2[17].c, ey = ch.Y(entry);
  if (t > buyT + 0.05) {
    const e = ease.out(prog(t, buyT + 0.05, buyT + 0.45)), x0 = ch.X(17);
    o += `<line x1="${f1(x0)}" y1="${f1(ey)}" x2="${f1(x0 + (BOX.x1 - x0) * e)}" y2="${f1(ey)}" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="9 7"/>`;
    o += `<g opacity="${e.toFixed(3)}"><rect x="${BOX.x1 - 78}" y="${f1(ey + 8)}" width="78" height="26" rx="5" fill="${GOLD}"/>${text(BOX.x1 - 39, ey + 28, 'ENTRY', { size: 17, fill: '#1a1200' })}</g>`;
  }
  const press = t >= buyT && t < buyT + 0.5 ? 1 - prog(t, buyT + 0.2, buyT + 0.5) : 0;
  o += button(S1.BUY[0], S1.BUY[1], 'BUY', press, GREEN) + button(S1.SELL[0], S1.SELL[1], 'SELL', 0);

  // profit counter
  if (t > 25.5) {
    const pv = 4820 * ease.inOut(prog(t, 25.5, 28.1));
    const pop = 1 + 0.15 * Math.sin(prog(t, 28.1, 28.4) * Math.PI);
    o += `<g transform="translate(560 1050) scale(${pop.toFixed(3)})">`;
    o += text(0, -58, 'PROFIT', { size: 22, fill: GREY, weight: 500, ls: 3 });
    o += text(0, 6, '+' + money(pv), { size: 62, fill: GREEN, filter: 'glow' });
    o += '</g>';
  }

  // stickman: sit, press, watch, jump up
  const seat = S1.hip;
  const standHip = [236, 990];
  const j1 = t > 27.55 && t < 28.05 ? Math.sin(prog(t, 27.55, 28.05) * Math.PI) : 0;
  const j2 = t > 28.35 && t < 28.85 ? Math.sin(prog(t, 28.35, 28.85) * Math.PI) : 0;
  const j3 = t > 29.15 && t < 29.65 ? Math.sin(prog(t, 29.15, 29.65) * Math.PI) : 0;
  const up = ease.inOut(prog(t, 27.0, 27.45));
  const hip = [lerp(seat[0], standHip[0], up), lerp(seat[1], standHip[1], up) - (j1 + j2 + j3) * 60];
  const hN = track(t, [[23, [272, 880]], [24.6, [276, 874]], [buyT, [S1.BUY[0] - 36, S1.BUY[1] + 4]], [buyT + 0.25, [300, 880]], [26.8, [300, 890]], [27.3, [330, 700]]]);
  const hF = track(t, [[23, [262, 945]], [26.8, [262, 945]], [27.3, [150, 720]]]);
  const wave = t > 27.3 ? Math.sin(t * 12) * 14 : 0;
  const sf = sitFeet(seat, S1.s);
  const lift = (j1 + j2 + j3) * 60;
  const fN = [lerp(sf.fN[0], standHip[0] + 22, up), lerp(sf.fN[1], S1.floor, up) - lift * 0.75];
  const fF = [lerp(sf.fF[0], standHip[0] - 10, up), lerp(sf.fF[1], S1.floor + 2, up) - lift * 0.75];
  const body = track(t, [[23, { lean: 10, tilt: -6 }], [24.6, { lean: 12, tilt: -6 }], [buyT, { lean: 14, tilt: -2 }], [25.5, { lean: 6, tilt: -22 }], [26.8, { lean: 4, tilt: -24 }], [27.3, { lean: -4, tilt: -14 }]]);
  const face = faces(t, [[23, 'calm'], [24.8, 'focus'], [25.6, 'curious'], [26.5, 'happy'], [27.0, 'joy']]);
  const sm = stick({ x: hip[0], y: hip[1], s: S1.s, lean: body.lean, tilt: body.tilt, hN: [hN[0] + wave, hN[1]], hF: [hF[0] - wave, hF[1]], fN, fF, face, blink: blink(t, 2.2) });
  o += chair(S1.chairX, seat[1] + 13, S1.floor) + sm.back + sm.front;

  // confetti
  if (t > 27.0) {
    for (const c of CONFETTI) {
      const lt = t - 27.0 - c.d;
      if (lt < 0) continue;
      const y = -30 + lt * c.v;
      if (y > 1300) continue;
      const x = c.x + Math.sin(lt * 3 + c.rot) * c.sway;
      o += `<rect x="${f1(-c.w / 2)}" y="${f1(-c.w * 0.7)}" width="${f1(c.w)}" height="${f1(c.w * 1.4)}" fill="${c.c}" transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(c.rot + lt * c.vr)})"/>`;
    }
  }
  return o;
}

// ---------- scene 5: meeting TJR (30 - 36) ----------
function star(x, y, r, op) {
  return `<path transform="translate(${f1(x)} ${f1(y)})" d="M 0 ${-r} Q 0 0 ${r} 0 Q 0 0 0 ${r} Q 0 0 ${-r} 0 Q 0 0 0 ${-r} Z" fill="${GOLD}" opacity="${op.toFixed(3)}" filter="url(#glow2)"/>`;
}
function scene5(t) {
  let o = '';
  const floor = 1150, s = 1.15, standY = floor - 184 * s + 4;
  o += `<ellipse cx="360" cy="${floor + 6}" rx="380" ry="70" fill="url(#spot)"/>`;
  o += `<line x1="0" y1="${floor + 6}" x2="720" y2="${floor + 6}" stroke="#333" stroke-width="2"/>`;

  // TJR
  const tx = 505;
  const shakeY = t > 32.6 && t < 33.9 ? Math.sin((t - 32.6) * 20) * 9 : 0;
  const meet = [404, 930 + shakeY];
  const reach = ease.inOut(prog(t, 32.15, 32.6));
  const tjrHN = mix([478, 985], meet, reach);
  const nodT = t > 33.4 && t < 34.4 ? Math.sin(prog(t, 33.4, 34.4) * Math.PI * 2) * 5 : 0;
  const tj = stick({ x: tx, y: standY, s, flip: -1, lean: 2, tilt: nodT, hN: tjrHN, hF: [526, 990], fN: [tx - 22, floor], fF: [tx + 8, floor + 2], photo: true, chain: true });
  o += tj.back + tj.front;
  const tagY = tj.head[1] - 104;
  o += `<g filter="url(#glow2)"><rect x="${tx - 42}" y="${f1(tagY - 24)}" width="84" height="38" rx="19" fill="${GOLD}"/></g>` + text(tx, tagY + 4, 'TJR', { size: 24, fill: '#1a1200' });

  // stickman walks in
  const walkU = prog(t, 30.0, 32.2);
  const x = lerp(-80, 300, ease.out(walkU * 0.98 + 0.02 * walkU));
  const walking = t < 32.2;
  const ph = (x / 105) * Math.PI;
  const bob = walking ? Math.abs(Math.sin(ph)) * 6 : 0;
  const hip = [x, standY - bob];
  const stride = walking ? 30 : 0;
  const fN = [x + 10 + Math.sin(ph) * stride, floor - Math.max(0, Math.cos(ph)) * (walking ? 16 : 0)];
  const fF = [x - 6 - Math.sin(ph) * stride, floor - Math.max(0, -Math.cos(ph)) * (walking ? 16 : 0)];
  const swing = walking ? Math.sin(ph) * 40 : 0;
  const idleN = [x + 22 - swing, standY + 95], idleF = [x - 2 + swing, standY + 98];
  const hN = mix(idleN, meet, reach);
  const face = faces(t, [[30, 'happy'], [32.7, 'joy'], [34.6, 'happy']]);
  const sm = stick({ x: hip[0], y: hip[1], s, lean: walking ? 6 : 3, tilt: -6, hN, hF: idleF, fN, fF, face, blink: blink(t, 0.7) });
  o += sm.back + sm.front;

  // speech bubble
  if (t > 32.85) {
    const bp = ease.back(prog(t, 32.85, 33.15));
    const l2 = prog(t, 33.55, 33.85);
    const bx = 40, by = 405, bw = 420, bh = 150;
    const tipX = sm.head[0] - 10, tipY = sm.head[1] - 78;
    o += `<g transform="translate(${tipX} ${tipY}) scale(${bp.toFixed(3)}) translate(${-tipX} ${-tipY})">`;
    o += `<path d="M ${bx + 24} ${by} H ${bx + bw - 24} Q ${bx + bw} ${by} ${bx + bw} ${by + 24} V ${by + bh - 24} Q ${bx + bw} ${by + bh} ${bx + bw - 24} ${by + bh} H ${tipX + 34} L ${tipX} ${tipY} L ${tipX - 6} ${by + bh} H ${bx + 24} Q ${bx} ${by + bh} ${bx} ${by + bh - 24} V ${by + 24} Q ${bx} ${by} ${bx + 24} ${by} Z" fill="${WHITE}" stroke="${INK}" stroke-width="4"/>`;
    o += text(bx + bw / 2, by + 62, 'THANK YOU, TJR.', { size: 44, fill: '#111' });
    o += text(bx + bw / 2, by + 112, 'YOUR VIDEOS CHANGED EVERYTHING.', { size: 25, fill: '#333', weight: 500, op: l2.toFixed(3) });
    o += '</g>';
  }
  // sparkles round the handshake
  if (t > 32.7) {
    const r = rng(5);
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2, d = 50 + r() * 70, ph2 = r() * 6;
      const tw = Math.max(0, Math.sin((t - 32.7) * 4 + ph2)) * prog(t, 32.7, 33.0);
      o += star(meet[0] + Math.cos(a) * d, meet[1] - 20 + Math.sin(a) * d * 0.8, 9 + r() * 9, tw);
    }
  }
  return o;
}

// ---------- scene 6: outro (36 - 40.5) ----------
function scene6(t) {
  let o = '';
  const pts = [[60, 1100], [140, 1040], [200, 1070], [290, 930], [350, 970], [450, 780], [520, 820], [640, 560]];
  const d = prog(t, 36.1, 37.6);
  // partial polyline
  let len = 0; const segs = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); len += l; }
  let rem = len * ease.inOut(d), path = `M ${pts[0][0]} ${pts[0][1]}`, end = pts[0], ang = 0;
  for (let i = 1; i < pts.length && rem > 0; i++) {
    const u = Math.min(1, rem / segs[i - 1]);
    end = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
    ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    path += ` L ${f1(end[0])} ${f1(end[1])}`; rem -= segs[i - 1];
  }
  o += `<path d="${path} L ${f1(end[0])} 1190 L 60 1190 Z" fill="url(#greenfade)" opacity="0.35"/>`;
  o += `<path d="${path}" fill="none" stroke="${GREEN}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)"/>`;
  if (d > 0.02) {
    const deg = (ang * 180) / Math.PI;
    o += `<path transform="translate(${f1(end[0])} ${f1(end[1])}) rotate(${f1(deg)})" d="M 8 0 L -22 -18 L -22 18 Z" fill="${GREEN}" filter="url(#glow)"/>`;
  }
  const s = 1.2, floor = 1190, hipY = floor - 184 * s + 6;
  const x = 300, breathe = Math.sin(t * 2.2) * 2;
  const raise = ease.inOut(prog(t, 37.2, 37.7));
  const hN = mix([x + 30, hipY + 100], [x + 150, hipY - 300], raise);
  const sm = stick({ x, y: hipY + breathe, s, lean: -2, tilt: -10 - raise * 8, hN, hF: [x - 10, hipY + 104], fN: [x + 26, floor], fF: [x - 18, floor + 2], face: faces(t, [[36, 'calm'], [37.4, 'happy']]), blink: blink(t, 1.9) });
  o += `<line x1="0" y1="${floor + 4}" x2="720" y2="${floor + 4}" stroke="#2a2a2a" stroke-width="2"/>`;
  o += sm.back + sm.front;
  return o;
}

// ---------- compose ----------
const DEFS = `<defs>
  <image id="tjrimg" href="${IMG}" width="300" height="300"/>
  <clipPath id="hclip"><circle r="${B.R}"/></clipPath>
  <clipPath id="avclip"><circle r="20"/></clipPath>
  <clipPath id="postclip"><rect width="${PH.w - 52}" height="200" rx="8"/></clipPath>
  <clipPath id="screenclip"><rect x="${PH.x + 14}" y="${PH.y + 14}" width="${PH.w - 28}" height="${PH.h - 28}" rx="28"/></clipPath>
  <clipPath id="lapclip"><rect x="436" y="${958 - 12 - 150 + 4}" width="202" height="142" rx="5"/></clipPath>
  <filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.75 0" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glow2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <radialGradient id="greenglow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="${GREEN}" stop-opacity="0.35"/><stop offset="1" stop-color="${GREEN}" stop-opacity="0"/></radialGradient>
  <radialGradient id="spot" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="greenfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GREEN}" stop-opacity="0.8"/><stop offset="1" stop-color="${GREEN}" stop-opacity="0"/></linearGradient>
</defs>`;

const SCENES = [[0, 9.5, scene1], [9.5, 16, scene2], [16, 23, scene3], [23, 30, scene4], [30, 36, scene5], [36, 40.5, scene6]];
const CUTS = [9.5, 16, 23, 30, 36];

const stage = document.getElementById('stage');
stage.innerHTML = DEFS + '<g id="frame"></g>';
const frameEl = document.getElementById('frame');

window.ready = new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = IMG; });

window.renderFrame = function (t) {
  let o = '<rect width="720" height="1280" fill="#000"/>';
  for (const [a, b, fn] of SCENES) {
    if (t >= a && t < b) {
      const z = 1 + 0.035 * prog(t, a, b);
      o += `<g transform="translate(360 700) scale(${z.toFixed(4)}) translate(-360 -700)">${fn(t)}</g>`;
      break;
    }
  }
  o += captions(t);
  let dip = 0;
  for (const c of CUTS) dip = Math.max(dip, 1 - Math.abs(t - c) / 0.2);
  dip = Math.max(dip, prog(t, 39.9, 40.45));
  if (t < 0.25) dip = Math.max(dip, 1 - t / 0.25);
  if (dip > 0) o += `<rect width="720" height="1280" fill="#000" opacity="${clamp(dip).toFixed(3)}"/>`;
  frameEl.innerHTML = o;
};
