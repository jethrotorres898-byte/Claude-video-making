'use strict';
// Watercolor paper-cut style (soft storybook look): flat shapes are painted through SVG filters
// (pigment mottling, hue drift, granulation and darker wet edges), outlined in thin warm ink, and
// whole objects are cut out of paper with a white border and a soft drop shadow.
// Filters and gradients register themselves on first use: draw the body first, then put wcDefs()
// inside the page's <defs>.

const WC = { ink: '#3b2f27', edge: '#fffbf2', shadow: '#3a2c1c' };
const _wcDefs = new Map();
const wf = (v) => (Math.round(v * 100) / 100).toString();

// Painted-fill filter. v = blotch size in px, s = noise seed, k = strength (0..1),
// gs = granulation scale (pass the object's scale so the fine grain stays fine when enlarged).
function wcFilter(v = 120, s = 1, k = 1, gs = 1) {
  const id = `wc${Math.round(v)}_${s}_${Math.round(k * 100)}_${Math.round(gs * 10)}`;
  if (_wcDefs.has(id)) return id;
  const f = (1 / v).toFixed(5);
  const dk = wf(1 - 0.2 * k), lt = wf(0.3 * k), lt1 = wf(1 - 0.3 * k), e = wf(1.25 * k);
  _wcDefs.set(id, `<filter id="${id}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" seed="${s}" result="n"/>` +
    '<feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.6 0 0 0 -1.05" result="md"/>' +
    '<feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.6 0 0 -1.08" result="ml"/>' +
    '<feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.2 0 -0.85" result="mh"/>' +
    `<feColorMatrix in="SourceGraphic" values="${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 1 0" result="dk"/>` +
    `<feColorMatrix in="SourceGraphic" values="${lt1} 0 0 0 ${lt} 0 ${lt1} 0 0 ${lt} 0 0 ${lt1} 0 ${lt} 0 0 0 1 0" result="lt"/>` +
    `<feColorMatrix in="SourceGraphic" type="hueRotate" values="${wf(14 * k)}" result="hu"/>` +
    '<feComposite in="dk" in2="md" operator="in" result="d1"/>' +
    '<feComposite in="lt" in2="ml" operator="in" result="l1"/>' +
    '<feComposite in="hu" in2="mh" operator="in" result="h1"/>' +
    `<feTurbulence type="fractalNoise" baseFrequency="${(0.7 / gs).toFixed(4)}" numOctaves="1" seed="${s + 11}" result="g"/>` +
    '<feColorMatrix in="g" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.4 0 0 0 -1.9" result="mg"/>' +
    '<feComposite in="dk" in2="mg" operator="in" result="g1"/>' +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${wf(Math.max(2, v / 28))}" result="ab"/>` +
    `<feComposite in="SourceAlpha" in2="ab" operator="arithmetic" k2="${e}" k3="-${e}" result="ed"/>` +
    '<feComposite in="dk" in2="ed" operator="in" result="e1"/>' +
    '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="h1"/><feMergeNode in="l1"/>' +
    '<feMergeNode in="d1"/><feMergeNode in="g1"/><feMergeNode in="e1"/></feMerge></filter>');
  return id;
}

// Paper cut-out: white border of about r px around the whole group, plus a soft drop shadow.
function wcCutFilter(r = 6, sh = 0.3) {
  const id = `cut${wf(r).replace('.', 'p')}_${Math.round(sh * 100)}`;
  if (_wcDefs.has(id)) return id;
  _wcDefs.set(id, `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${wf(r * 0.6)}" result="b"/>` +
    '<feComponentTransfer in="b" result="d"><feFuncA type="linear" slope="16" intercept="-0.4"/></feComponentTransfer>' +
    `<feFlood flood-color="${WC.edge}"/><feComposite in2="d" operator="in" result="border"/>` +
    `<feGaussianBlur in="d" stdDeviation="${wf(r * 0.8 + 1)}" result="sb"/>` +
    `<feOffset in="sb" dx="${wf(r * 0.35)}" dy="${wf(r * 0.7)}" result="so"/>` +
    `<feFlood flood-color="${WC.shadow}" flood-opacity="${sh}"/><feComposite in2="so" operator="in" result="shadow"/>` +
    '<feMerge><feMergeNode in="shadow"/><feMergeNode in="border"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
  return id;
}

function wcBlurFilter(sd) {
  const id = `blur${wf(sd).replace('.', 'p')}`;
  if (!_wcDefs.has(id)) _wcDefs.set(id, `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${wf(sd)}"/></filter>`);
  return id;
}

// Gradients: stops = [[offset, colour, opacity?], ...]; x1..y2 in objectBoundingBox units.
function wcLinear(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units = '') {
  if (!_wcDefs.has(id)) {
    _wcDefs.set(id, `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${units ? ` gradientUnits="${units}"` : ''}>` +
      stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('') + '</linearGradient>');
  }
  return `url(#${id})`;
}
function wcRadial(id, stops) {
  if (!_wcDefs.has(id)) {
    _wcDefs.set(id, `<radialGradient id="${id}">` +
      stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('') + '</radialGradient>');
  }
  return `url(#${id})`;
}

function wcDefs() { return [..._wcDefs.values()].join(''); }

// ---------- drawing helpers ----------
// One painted region with an ink outline. o: v (blotch size), s (seed), k (strength),
// ink (outline width, 0 = none), inkc, op (opacity), extra (raw attributes).
function paint(d, fill, o = {}) {
  const fid = wcFilter(o.v || 120, o.s || 1, o.k ?? 1, o.gs || 1);
  let out = `<path d="${d}" fill="${fill}" filter="url(#${fid})"${o.op !== undefined ? ` opacity="${o.op}"` : ''}/>`;
  if (o.ink !== 0) out += ink(d, o.ink || 3, o.inkc);
  return out;
}
const ink = (d, w = 3, c = WC.ink, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c || WC.ink}" stroke-width="${wf(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
// Painted group: the filter treats everything inside as one region (e.g. a cloud made of circles).
const paintG = (body, o = {}) => `<g filter="url(#${wcFilter(o.v || 120, o.s || 1, o.k ?? 1, o.gs || 1)})"${o.op !== undefined ? ` opacity="${o.op}"` : ''}>${body}</g>`;
const cut = (body, r = 6, sh = 0.3) => `<g filter="url(#${wcCutFilter(r, sh)})">${body}</g>`;
const blurG = (body, sd) => (sd > 0.05 ? `<g filter="url(#${wcBlurFilter(sd)})">${body}</g>` : body);
const tr = (x, y, rot = 0, s = 1) => `translate(${wf(x)} ${wf(y)})${rot ? ` rotate(${wf(rot)})` : ''}${s !== 1 ? ` scale(${wf(s)})` : ''}`;
const G = (t, body, extra = '') => `<g transform="${t}"${extra}>${body}</g>`;

// ---------- path builders ----------
const P = {
  circle: (cx, cy, r) => `M ${wf(cx - r)} ${wf(cy)} a ${wf(r)} ${wf(r)} 0 1 0 ${wf(2 * r)} 0 a ${wf(r)} ${wf(r)} 0 1 0 ${wf(-2 * r)} 0 Z`,
  ellipse: (cx, cy, rx, ry) => `M ${wf(cx - rx)} ${wf(cy)} a ${wf(rx)} ${wf(ry)} 0 1 0 ${wf(2 * rx)} 0 a ${wf(rx)} ${wf(ry)} 0 1 0 ${wf(-2 * rx)} 0 Z`,
  // segment with round caps (filled, so filters get a proper bounding box)
  capsule(x1, y1, x2, y2, r) {
    const l = Math.hypot(x2 - x1, y2 - y1) || 1e-6, nx = (-(y2 - y1) / l) * r, ny = ((x2 - x1) / l) * r;
    return `M ${wf(x1 + nx)} ${wf(y1 + ny)} L ${wf(x2 + nx)} ${wf(y2 + ny)} A ${wf(r)} ${wf(r)} 0 0 0 ${wf(x2 - nx)} ${wf(y2 - ny)} ` +
      `L ${wf(x1 - nx)} ${wf(y1 - ny)} A ${wf(r)} ${wf(r)} 0 0 0 ${wf(x1 + nx)} ${wf(y1 + ny)} Z`;
  },
  rrect: (x, y, w, h, r) => `M ${wf(x + r)} ${wf(y)} H ${wf(x + w - r)} Q ${wf(x + w)} ${wf(y)} ${wf(x + w)} ${wf(y + r)} V ${wf(y + h - r)} Q ${wf(x + w)} ${wf(y + h)} ${wf(x + w - r)} ${wf(y + h)} H ${wf(x + r)} Q ${wf(x)} ${wf(y + h)} ${wf(x)} ${wf(y + h - r)} V ${wf(y + r)} Q ${wf(x)} ${wf(y)} ${wf(x + r)} ${wf(y)} Z`,
  // Catmull-Rom spline through points -> cubic Beziers
  smooth(pts, closed = false, tension = 1) {
    const n = pts.length;
    const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = `M ${wf(pts[0][0])} ${wf(pts[0][1])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
      const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
      d += ` C ${wf(c1[0])} ${wf(c1[1])} ${wf(c2[0])} ${wf(c2[1])} ${wf(p2[0])} ${wf(p2[1])}`;
    }
    return d + (closed ? ' Z' : '');
  },
  // puffy blob (cloud, bush, canopy): bumps around an ellipse, flat-ish bottom optional
  blob(cx, cy, rx, ry, n = 9, seed = 1, bump = 0.22, flat = 0) {
    const r = mulberry(seed);
    let d = '';
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      let x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      if (flat && Math.sin(a) > 0.2) y = cy + ry * (0.2 + (Math.sin(a) - 0.2) * (1 - flat));
      pts.push([x, y]);
    }
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const dx = mx - cx, dy = my - cy, l = Math.hypot(dx, dy) || 1;
      const out = Math.hypot(q[0] - p[0], q[1] - p[1]) * (bump + r() * bump * 0.8);
      const bottom = flat && (p[1] + q[1]) / 2 > cy + ry * 0.15;
      const k = bottom ? 0.15 : 1;
      if (i === 0) d += `M ${wf(p[0])} ${wf(p[1])}`;
      d += ` Q ${wf(mx + (dx / l) * out * k)} ${wf(my + (dy / l) * out * k)} ${wf(q[0])} ${wf(q[1])}`;
    }
    return d + ' Z';
  },
};

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- animation helpers ----------
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerpN = (a, b, t) => a + (b - a) * t;
const ease = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - (1 - clamp01(t)) ** 3;
const easeIn = (t) => clamp01(t) ** 3;
// overshoot pop: 0 -> 1 with a little bounce
const popIn = (t) => { t = clamp01(t); const c = 2.2; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const ramp = (t, a, b) => clamp01((t - a) / (b - a));
