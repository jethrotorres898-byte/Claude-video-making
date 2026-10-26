'use strict';
// Shared toolkit for stickman videos on a 720x1280 SVG canvas: easing and
// keyframes, the stickman rig (faces, hair, beard, shades, lip sync), props,
// candlestick charts and voice-synced captions.

const GOLD = '#f6b941', GREEN = '#27c75e', RED = '#f04438', WHITE = '#f5f5f5';
const INK = '#0a0a0a', GREY = '#9a9a9a';

// ---------- utils ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const f1 = (v) => (+v).toFixed(1);
const ease = {
  lin: (u) => u,
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
const bump = (t, a, b) => (t > a && t < b ? Math.sin(prog(t, a, b) * Math.PI) : 0);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function text(x, y, s, o = {}) {
  const { size = 40, fill = WHITE, weight = 700, anchor = 'middle', family = 'Oswald', ls = 0, filter = '', op = 1 } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" font-family="${family}" font-weight="${weight}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}" opacity="${op}"${filter ? ` filter="url(#${filter})"` : ''}>${esc(s)}</text>`;
}
const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
const grp = (tr, body, op = 1) => `<g transform="${tr}"${op < 1 ? ` opacity="${op.toFixed(3)}"` : ''}>${body}</g>`;
const zoomAt = (cx, cy, z, body) => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${z.toFixed(4)}) translate(${f1(-cx)} ${f1(-cy)})">${body}</g>`;

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
  smirk: { eo: 0.85, bA: 6, bY: 0.02, mw: 0.15, mc: 0.07, mo: 0, lx: 0.03, ly: 0, hp: 0, sw: 0 },
  serious: { eo: 0.95, bA: 10, bY: 0, mw: 0.12, mc: -0.01, mo: 0, lx: -0.02, ly: 0, hp: 0, sw: 0 },
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

const HAIR = '#c9a066', HAIR_HI = '#ead09a', HAIR_DK = '#8a6a3e', BEARD = '#8a6440';
function hairTJR(R) {
  const P = (x, y) => `${f1(x * R)} ${f1(y * R)}`;
  // voluminous swept-back waves with a front quiff, ending above the nape
  let o = `<path d="M ${P(0.7, -0.5)} Q ${P(1.02, -0.8)} ${P(0.8, -1.12)} Q ${P(0.64, -1.44)} ${P(0.28, -1.41)} Q ${P(0.04, -1.6)} ${P(-0.26, -1.43)} Q ${P(-0.64, -1.42)} ${P(-0.84, -1.12)} Q ${P(-1.2, -0.86)} ${P(-1.11, -0.48)} Q ${P(-1.17, -0.12)} ${P(-0.98, 0.13)} Q ${P(-0.92, -0.02)} ${P(-0.84, -0.1)} Q ${P(-0.8, -0.56)} ${P(-0.5, -0.73)} Q ${P(-0.05, -0.93)} ${P(0.38, -0.81)} Q ${P(0.58, -0.73)} ${P(0.7, -0.5)} Z" fill="${HAIR}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  o += `<path d="M ${P(0.74, -0.72)} Q ${P(0.4, -1.12)} ${P(-0.05, -1.12)} Q ${P(-0.46, -1.1)} ${P(-0.72, -0.86)} M ${P(0.56, -1.2)} Q ${P(0.14, -1.36)} ${P(-0.3, -1.27)} M ${P(0.42, -0.88)} Q ${P(0.0, -1.0)} ${P(-0.46, -0.92)} Q ${P(-0.82, -0.72)} ${P(-0.94, -0.34)}" fill="none" stroke="${HAIR_DK}" stroke-width="3.5" stroke-linecap="round"/>`;
  o += `<path d="M ${P(0.66, -1.04)} Q ${P(0.3, -1.3)} ${P(-0.12, -1.28)} M ${P(-0.5, -1.2)} Q ${P(-0.8, -1.04)} ${P(-0.96, -0.72)}" fill="none" stroke="${HAIR_HI}" stroke-width="4.5" stroke-linecap="round"/>`;
  o += `<path d="M ${P(0.64, -0.64)} Q ${P(0.42, -0.6)} ${P(0.32, -0.42)} Q ${P(0.47, -0.52)} ${P(0.7, -0.52)} Z" fill="${HAIR}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  return o;
}
function beardTJR(R, mx, my) {
  // light stubble along the jaw, then a goatee patch below the lip
  let o = `<path d="M ${f1(0.74 * R)} ${f1(0.5 * R)} Q ${f1(0.52 * R)} ${f1(1.02 * R)} ${f1(-0.05 * R)} ${f1(1.0 * R)} Q ${f1(-0.42 * R)} ${f1(0.94 * R)} ${f1(-0.56 * R)} ${f1(0.7 * R)}" fill="none" stroke="${BEARD}" stroke-width="${f1(0.17 * R)}" stroke-linecap="round" opacity="0.3"/>`;
  o += `<path d="M ${f1(mx - 0.12 * R)} ${f1(my + 0.18 * R)} Q ${f1(mx)} ${f1(my + 0.38 * R)} ${f1(mx + 0.13 * R)} ${f1(my + 0.18 * R)} Q ${f1(mx)} ${f1(my + 0.25 * R)} ${f1(mx - 0.12 * R)} ${f1(my + 0.18 * R)} Z" fill="${BEARD}" opacity="0.9"/>`;
  return o;
}
function mustache(R, mx, my) {
  return `<path d="M ${f1(mx - 0.25 * R)} ${f1(my - 0.06 * R)} Q ${f1(mx - 0.13 * R)} ${f1(my - 0.21 * R)} ${f1(mx)} ${f1(my - 0.15 * R)} Q ${f1(mx + 0.14 * R)} ${f1(my - 0.21 * R)} ${f1(mx + 0.27 * R)} ${f1(my - 0.06 * R)} Q ${f1(mx + 0.13 * R)} ${f1(my - 0.12 * R)} ${f1(mx)} ${f1(my - 0.1 * R)} Q ${f1(mx - 0.13 * R)} ${f1(my - 0.12 * R)} ${f1(mx - 0.25 * R)} ${f1(my - 0.06 * R)} Z" fill="#6e4e2e"/>`;
}
function shadesSVG(R, eyes, drop) {
  const dy = drop * R * 0.32;
  const lens = (q, w) => `<rect x="${f1(q[0] - w / 2)}" y="${f1(q[1] - 0.13 * R + dy)}" width="${f1(w)}" height="${f1(0.25 * R)}" rx="${f1(0.08 * R)}" fill="#060606" stroke="${INK}" stroke-width="3"/>` +
    `<line x1="${f1(q[0] - w * 0.25)}" y1="${f1(q[1] - 0.06 * R + dy)}" x2="${f1(q[0] + w * 0.05)}" y2="${f1(q[1] - 0.06 * R + dy)}" stroke="#5a5a5a" stroke-width="3" stroke-linecap="round"/>`;
  return `<line x1="${f1(eyes[0][0] - 0.16 * R)}" y1="${f1(eyes[0][1] - 0.06 * R + dy)}" x2="${f1(-0.5 * R)}" y2="${f1(-0.16 * R + dy * 0.5)}" stroke="#060606" stroke-width="5" stroke-linecap="round"/>` +
    lens(eyes[0], 0.36 * R) + lens(eyes[1], 0.3 * R) +
    `<line x1="${f1(eyes[0][0] + 0.16 * R)}" y1="${f1(eyes[0][1] - 0.05 * R + dy)}" x2="${f1(eyes[1][0] - 0.13 * R)}" y2="${f1(eyes[1][1] - 0.05 * R + dy)}" stroke="#060606" stroke-width="5"/>`;
}

function headSVG(c, rot, p) {
  const R = B.R;
  const e = { ...(p.face || FACE.neutral) };
  if (p.talk) { e.mo = Math.max(e.mo, p.talk * 0.17); e.mw = lerp(e.mw, 0.14, clamp(p.talk)); e.mc = lerp(e.mc, -0.03, clamp(p.talk)); }
  let o = `<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(rot)})">`;
  o += `<circle r="${R}" fill="${WHITE}" stroke="${INK}" stroke-width="6"/>`;
  o += `<path d="M ${-R * 0.82} ${R * 0.35} A ${R * 0.95} ${R * 0.95} 0 0 0 ${R * 0.1} ${R * 0.93}" stroke="#d2d2d2" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const lx = e.lx * R, ly = e.ly * R, sw = R * 0.05;
  const eyes = [[0.06 * R + lx, -0.1 * R + ly], [0.5 * R + lx, -0.1 * R + ly]];
  const mx = 0.3 * R + lx * 0.7, my = 0.42 * R + ly * 0.5;
  if (p.beard) o += beardTJR(R, mx, my);
  const eo = e.eo * (p.blink ?? 1);
  const showEyes = !(p.shades > 0.5 && (p.shadesDrop ?? 0) < 0.6);
  eyes.forEach((q, i) => {
    const rx = 0.078 * R * (i ? 0.92 : 1);
    if (showEyes) {
      if (e.hp > 0.5) {
        o += `<path d="M ${f1(q[0] - rx * 1.2)} ${f1(q[1] + 0.03 * R)} Q ${f1(q[0])} ${f1(q[1] - 0.12 * R)} ${f1(q[0] + rx * 1.2)} ${f1(q[1] + 0.03 * R)}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
      } else {
        const ry = Math.max(0.012 * R, 0.115 * R * eo);
        o += `<ellipse cx="${f1(q[0])}" cy="${f1(q[1])}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${INK}"/>`;
        if (eo > 0.7) o += `<circle cx="${f1(q[0] + rx * 0.3)}" cy="${f1(q[1] - ry * 0.4)}" r="${f1(R * 0.022)}" fill="#fff"/>`;
      }
    }
    const by = q[1] - 0.25 * R - e.bY * R, a = i ? -e.bA : e.bA;
    const bw = p.beard ? 0.075 : 0.05;
    o += `<line x1="${f1(q[0] - 0.12 * R)}" y1="${f1(by)}" x2="${f1(q[0] + 0.12 * R)}" y2="${f1(by)}" transform="rotate(${f1(a)} ${f1(q[0])} ${f1(by)})" stroke="${p.beard ? BEARD : INK}" stroke-width="${f1(bw * R)}" stroke-linecap="round"/>`;
  });
  const w = e.mw * R, cv = e.mc * R, op = e.mo * R;
  if (op > 0.6) {
    o += `<path d="M ${f1(mx - w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv)} ${f1(mx + w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv + 2.4 * op)} ${f1(mx - w)} ${f1(my)} Z" fill="#2b1010" stroke="${INK}" stroke-width="${f1(sw)}" stroke-linejoin="round"/>`;
  } else {
    o += `<path d="M ${f1(mx - w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv)} ${f1(mx + w)} ${f1(my)}" fill="none" stroke="${INK}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
  }
  if (p.beard) o += mustache(R, mx, my);
  if (e.sw > 0.5) o += `<path d="M ${0.86 * R} ${-0.5 * R} q 6 11 0 15 q -6 -4 0 -15 Z" fill="#7cc4ff" stroke="${INK}" stroke-width="2"/>`;
  if (p.hair) o += hairTJR(R);
  if (p.shades > 0) o += `<g opacity="${clamp(p.shades).toFixed(2)}">${shadesSVG(R, eyes, p.shadesDrop ?? 0)}</g>`;
  return o + '</g>';
}

// p: x,y = hip (world), s scale, flip (1 faces right, -1 faces left), lean/tilt degrees,
// hN/hF near/far hand targets, fN/fF near/far foot targets (world coords).
// Extras: face, blink, talk (0..1 mouth), hair, beard, shades (0..1), shadesDrop,
// chain ('silver' | 'gold'), thumbN (0..1 thumbs-up on near hand), hideLegs.
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
  const g = `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">`;
  let back = g;
  back += limb([sh, eF, hF], B.lw, '#c9c9c9');
  if (!p.hideLegs) {
    const [kN, aN] = ik([4, 0], L(p.fN), B.th, B.sh, -1);
    const [kF, aF] = ik([-4, 0], L(p.fF), B.th, B.sh, -1);
    back += limb([[-4, 0], kF, aF, [aF[0] + 22, aF[1] + 1]], B.lw, '#d0d0d0');
    back += limb([[4, 0], kN, aN, [aN[0] + 22, aN[1] + 1]], B.lw, WHITE);
  }
  back += limb([[0, 0], [tv[0] * B.torso * 0.8, tv[1] * B.torso * 0.8]], B.tw, WHITE);
  if (p.chain) {
    const [nx, ny] = neck;
    const c1 = p.chain === 'gold' ? '#d9a531' : '#8f99a3', c2 = p.chain === 'gold' ? '#f3c44c' : '#7d8790';
    back += `<path d="M ${nx - 22} ${ny + 4} Q ${nx + 6} ${ny + 46} ${nx + 26} ${ny + 6}" fill="none" stroke="${c1}" stroke-width="6" stroke-dasharray="5 3"/>`;
    back += `<path d="M ${nx - 25} ${ny + 8} Q ${nx + 6} ${ny + 66} ${nx + 29} ${ny + 10}" fill="none" stroke="${c2}" stroke-width="7" stroke-dasharray="6 3"/>`;
  }
  back += headSVG(head, lean + tilt, p) + '</g>';
  let front = g + limb([sh, eN, hN], B.lw, WHITE);
  if (p.thumbN > 0) {
    const th = p.thumbN;
    front += `<g transform="translate(${f1(hN[0])} ${f1(hN[1])})"><path d="M 0 0 L 2 ${f1(-30 * th)}" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M 0 0 L 2 ${f1(-30 * th)}" stroke="${WHITE}" stroke-width="12" stroke-linecap="round"/></g>`;
  }
  front += '</g>';
  return { back, front, svg: back + front, head: Wd(head), hN: Wd(hN), hF: Wd(hF), sh: Wd(sh), neck: Wd(neck) };
}
const sitFeet = (hip, s) => ({ fN: [hip[0] + 104 * s, hip[1] + 104 * s], fF: [hip[0] + 90 * s, hip[1] + 106 * s] });
const standFeet = (x, floor, f = 1) => ({ fN: [x + 22 * f, floor], fF: [x - 10 * f, floor + 2] });
const standY = (floor, s) => floor - 184 * s + 4;

// ---------- props ----------
function chair(x, y, floor, f = 1, op = 1) {
  const h = floor - y;
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f} 1)" opacity="${op}" fill="#000" stroke="${WHITE}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">` +
    `<line x1="-58" y1="10" x2="-70" y2="${h - 6}" stroke="#777"/><line x1="26" y1="10" x2="34" y2="${h - 6}" stroke="#777"/>` +
    `<path d="M -84 2 L -108 -170 L -90 -173 L -66 0 Z"/>` +
    `<rect x="-92" y="-6" width="142" height="17" rx="7"/>` +
    `<line x1="-82" y1="12" x2="-98" y2="${h}"/><line x1="40" y1="12" x2="50" y2="${h}"/></g>`;
}
// couch facing right; x,y = front of the seat cushion top
function couch(x, y, floor) {
  return `<g fill="#0b0b0b" stroke="${WHITE}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">` +
    `<rect x="${x - 200}" y="${y - 170}" width="74" height="250" rx="30"/>` +
    `<rect x="${x - 170}" y="${y}" width="240" height="70" rx="18"/>` +
    `<rect x="${x + 40}" y="${y - 50}" width="58" height="130" rx="24"/>` +
    `<line x1="${x - 170}" y1="${y + 80}" x2="${x - 176}" y2="${floor}"/><line x1="${x + 80}" y1="${y + 80}" x2="${x + 86}" y2="${floor}"/>` +
    `<line x1="${x - 90}" y1="${y + 10}" x2="${x - 90}" y2="${y + 60}" stroke="#444"/><line x1="${x - 10}" y1="${y + 10}" x2="${x - 10}" y2="${y + 60}" stroke="#444"/></g>`;
}
function desk(x0, x1, y, floor) {
  return `<g stroke="${WHITE}" stroke-width="4" fill="#000" stroke-linecap="round" stroke-linejoin="round">` +
    `<line x1="${x0 + 38}" y1="${y + 14}" x2="${x0 + 28}" y2="${floor}"/><line x1="${x1 - 36}" y1="${y + 14}" x2="${x1 - 26}" y2="${floor}"/>` +
    `<line x1="${x0 + 62}" y1="${y + 14}" x2="${x0 + 62}" y2="${floor - 30}" stroke="#666"/>` +
    `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="16" rx="5"/></g>`;
}
// laptop on a desk; content(x, y, w, h) draws the screen contents
function laptop(x, deskY, w, h, content = null, open = 1) {
  let o = `<rect x="${x - 14}" y="${deskY - 9}" width="${w + 34}" height="10" rx="4" fill="#111" stroke="${WHITE}" stroke-width="3.5"/>`;
  const hh = h * open;
  o += `<rect x="${x}" y="${f1(deskY - 12 - hh)}" width="${w}" height="${f1(Math.max(4, hh))}" rx="8" fill="#111" stroke="${WHITE}" stroke-width="4"/>`;
  if (content && open > 0.95) o += content(x + 6, deskY - 6 - h, w - 12, h - 12);
  return o;
}
function star(x, y, r, op, col = GOLD) {
  return `<path transform="translate(${f1(x)} ${f1(y)})" d="M 0 ${-r} Q 0 0 ${r} 0 Q 0 0 0 ${r} Q 0 0 ${-r} 0 Q 0 0 0 ${-r} Z" fill="${col}" opacity="${op.toFixed(3)}" filter="url(#glow2)"/>`;
}
function confetti(t, t0, seed = 99, n = 70) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const c = { x: r() * 720, d: r() * 1.2, v: 260 + r() * 260, rot: r() * 360, vr: (r() - 0.5) * 600, sway: 10 + r() * 30, c: [GOLD, GREEN, WHITE, '#ffd979'][Math.floor(r() * 4)], w: 9 + r() * 7 };
    const lt = t - t0 - c.d;
    if (lt < 0) continue;
    const y = -30 + lt * c.v;
    if (y > 1300) continue;
    const x = c.x + Math.sin(lt * 3 + c.rot) * c.sway;
    o += `<rect x="${f1(-c.w / 2)}" y="${f1(-c.w * 0.7)}" width="${f1(c.w)}" height="${f1(c.w * 1.4)}" fill="${c.c}" transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(c.rot + lt * c.vr)})"/>`;
  }
  return o;
}
function button(x, y, label, pressed, glowCol = WHITE) {
  const w = 96, h = 50;
  const fill = pressed > 0 ? `rgba(255,255,255,${(0.92 * pressed).toFixed(2)})` : '#050505';
  const tc = pressed > 0.5 ? '#111' : WHITE;
  return `<g filter="url(#glow2)"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="11" fill="${fill}" stroke="${pressed > 0 ? glowCol : WHITE}" stroke-width="${pressed > 0 ? 4 : 3}"/></g>` +
    text(x, y + 10, label, { size: 27, fill: tc, weight: 700 });
}

// ---------- chart ----------
function chartSVG(candles, nv, box, o = {}) {
  const N = o.slots || candles.length + 2;
  const full = Math.floor(nv), frac = nv - full;
  const vis = [];
  for (let i = 0; i < Math.min(candles.length, full + 1); i++) {
    const c = candles[i];
    if (i < full) { vis.push(c); continue; }
    if (frac <= 0.001) break;
    const cc = lerp(c.o, c.c, ease.out(frac));
    vis.push({ o: c.o, c: cc, v: c.v, h: Math.max(c.o, cc) + (c.h - Math.max(c.o, c.c)) * frac, l: Math.min(c.o, cc) - (Math.min(c.o, c.c) - c.l) * frac });
  }
  let lo = Infinity, hi = -Infinity;
  for (const c of vis) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); }
  const mid = (lo + hi) / 2, span = Math.max(hi - lo, o.minSpan || 40);
  lo = mid - span * 0.56; hi = mid + span * 0.56;
  const Y = (v) => box.y1 - ((v - lo) / (hi - lo)) * (box.y1 - box.y0);
  const sp = (box.x1 - box.x0 - 24) / N, cw = sp * 0.62;
  const X = (i) => box.x0 + 18 + i * sp + sp / 2;
  let out = `<g stroke="${WHITE}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9">` +
    `<line x1="${box.x0}" y1="${box.y1 + 8}" x2="${box.x0}" y2="${box.y0 - 30}"/><path d="M ${box.x0 - 7} ${box.y0 - 20} L ${box.x0} ${box.y0 - 32} L ${box.x0 + 7} ${box.y0 - 20}"/>` +
    `<line x1="${box.x0 - 8}" y1="${box.y1 + 8}" x2="${box.x1 + 10}" y2="${box.y1 + 8}"/><path d="M ${box.x1} ${box.y1 + 1} L ${box.x1 + 12} ${box.y1 + 8} L ${box.x1} ${box.y1 + 15}"/></g>`;
  let vol = '', cs = '', lastClose = null, lastX = 0, lastUp = true;
  vis.forEach((c, i) => {
    const up = c.c >= c.o, col = up ? GREEN : RED, x = X(i);
    const yt = Y(Math.max(c.o, c.c)), yb = Y(Math.min(c.o, c.c));
    cs += `<line x1="${f1(x)}" y1="${f1(Y(c.h))}" x2="${f1(x)}" y2="${f1(Y(c.l))}" stroke="${col}" stroke-width="3"/>`;
    cs += `<rect x="${f1(x - cw / 2)}" y="${f1(yt)}" width="${f1(cw)}" height="${f1(Math.max(2, yb - yt))}" fill="${col}"/>`;
    vol += `<rect x="${f1(x - cw / 2)}" y="${f1(box.y1 + 6 - c.v * 34)}" width="${f1(cw)}" height="${f1(c.v * 34)}" fill="${col}" opacity="0.22"/>`;
    lastClose = c.c; lastX = x; lastUp = up;
  });
  if (lastClose !== null && o.tag !== false) {
    const y = Y(lastClose), col = lastUp ? GREEN : RED, v = (lastClose * 0.35 + 0.5).toFixed(2);
    cs += `<line x1="${f1(lastX + cw / 2 + 2)}" y1="${f1(y)}" x2="${f1(lastX + cw / 2 + 30)}" y2="${f1(y)}" stroke="${col}" stroke-width="2"/>` +
      `<rect x="${f1(lastX + cw / 2 + 30)}" y="${f1(y - 13)}" width="70" height="26" rx="5" fill="${col}"/>`;
    out += vol + `<g filter="url(#glow2)">${cs}</g>` + text(lastX + cw / 2 + 65, y + 7, '$' + v, { size: 17, fill: '#06140a', weight: 700 });
  } else out += vol + `<g filter="url(#glow2)">${cs}</g>`;
  return { svg: out, Y, X, cw };
}
// candles that walk through the given closes
function candlesFrom(closes, seed = 1, wick = 3) {
  const r = rng(seed); const out = [];
  for (let i = 1; i < closes.length; i++) {
    const o = closes[i - 1], c = closes[i];
    out.push({ o, c, h: Math.max(o, c) + r() * wick, l: Math.min(o, c) - r() * wick, v: 0.25 + Math.min(1, Math.abs(c - o) / 15) * 0.7 + r() * 0.1 });
  }
  return out;
}

// ---------- captions synced to the voice ----------
function lineWords(line) {
  const sw = line.text.split(/\s+/).filter(Boolean);
  const ww = line.words;
  if (ww.length === sw.length) return sw.map((w, i) => ({ w, s: ww[i].s, e: ww[i].e }));
  const s0 = ww.length ? ww[0].s : line.s, e0 = ww.length ? ww[ww.length - 1].e : line.e;
  const tot = sw.reduce((a, w) => a + w.length + 1, 0);
  let acc = 0;
  return sw.map((w) => { const s = s0 + ((e0 - s0) * acc) / tot; acc += w.length + 1; return { w, s, e: s0 + ((e0 - s0) * acc) / tot }; });
}
function buildChunks(lines) {
  const chunks = [];
  lines.forEach((line, li) => {
    const ws = lineWords(line);
    let cur = [];
    const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
    ws.forEach((w) => {
      cur.push(w);
      const p = /[.!?…]$/.test(w.w) || (/[,]$/.test(w.w) && cur.length >= 2);
      if (p || cur.length >= 4) flush();
    });
    flush();
  });
  chunks.forEach((c, i) => {
    const next = chunks[i + 1];
    const line = lines[c.li];
    c.a = c.words[0].s - 0.08;
    c.b = next ? (next.li === c.li ? next.words[0].s - 0.08 : Math.min(line.e + 0.35, next.words[0].s - 0.1)) : line.e + 1.2;
  });
  return chunks;
}
function wordTime(lines, li, target, which = 's') {
  const t = target.toLowerCase();
  const w = lineWords(lines[li]).find((x) => x.w.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(t));
  return w ? w[which] : lines[li].s;
}
function captionSVG(t, chunks, o = {}) {
  const y = o.y ?? 190;
  for (const c of chunks) {
    if (t < c.a || t >= c.b) continue;
    const pin = prog(t, c.a, c.a + 0.16);
    const sc = lerp(0.86, 1, ease.back(pin));
    const words = c.words.map((w) => w.w.toUpperCase());
    const chars = words.join(' ').length;
    const size = Math.min(74, 1180 / Math.max(chars, 8));
    let spans = '';
    c.words.forEach((w, i) => {
      const active = t >= w.s - 0.04 && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.04);
      const col = active ? GOLD : WHITE;
      spans += `<tspan fill="${col}">${esc(words[i])}${i < words.length - 1 ? ' ' : ''}</tspan>`;
    });
    return `<g transform="translate(360 ${y}) scale(${sc.toFixed(4)}) translate(-360 ${-y})" opacity="${clamp(pin * 2.5).toFixed(3)}">` +
      `<text x="360" y="${y}" font-family="Oswald" font-weight="700" font-size="${f1(size)}" text-anchor="middle" stroke="#000" stroke-width="10" stroke-linejoin="round" paint-order="stroke" filter="url(#glow)">${spans}</text></g>`;
  }
  return '';
}

const DEFS_COMMON = `
  <clipPath id="hclip"><circle r="${B.R}"/></clipPath>
  <filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.75 0" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glow2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
  <radialGradient id="greenglow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="${GREEN}" stop-opacity="0.35"/><stop offset="1" stop-color="${GREEN}" stop-opacity="0"/></radialGradient>
  <radialGradient id="goldglow" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="${GOLD}" stop-opacity="0.4"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="spot" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" cx="50%" cy="50%" r="75%"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient>
  <linearGradient id="greenfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GREEN}" stop-opacity="0.8"/><stop offset="1" stop-color="${GREEN}" stop-opacity="0"/></linearGradient>
  <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#fff" opacity="0.07"/></pattern>`;
