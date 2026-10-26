'use strict';
// "Inkman": a front-facing cartoon stickman style with rubber-hose limbs, white
// gloves, big eyes, colour accessories and loud flat-colour worlds. Uses the
// generic helpers from lib/stickkit.js (easing, keyframes, text, ik, rng...).

const INKC = '#141414';
const PAL = {
  orange: '#FF7A1A', yellow: '#FFD60A', pink: '#FF4F9A', cyan: '#2EC5FF', purple: '#8B5CF6',
  green: '#22C55E', red: '#FF3B3B', blue: '#3B82F6', teal: '#14B8A6', cream: '#FFF4DC', navy: '#151A3A',
};
const IB = { torso: 118, R: 52, ua: 62, fa: 60, th: 70, sh: 68, bw: 13, lw: 12 };

const IFACE_BASE = { eo: 1, lx: 0, ly: 0, bA: 0, bY: 0, mw: 12, mc: 2, mo: 0, teeth: 0, blush: 0, hp: 0, tear: 0, sw: 0, star: 0, fire: 0, wink: 0 };
const IF = (o) => ({ ...IFACE_BASE, ...o });
const IFACE = {
  neutral: IF({}),
  happy: IF({ mc: 8, mw: 16, mo: 4, blush: 0.5 }),
  laugh: IF({ hp: 1, mw: 20, mc: 6, mo: 16, teeth: 1, blush: 0.8, tear: 1, bA: -10, bY: 4 }),
  sad: IF({ eo: 0.75, bA: -18, bY: 3, mw: 12, mc: -6, ly: 0.4 }),
  worried: IF({ eo: 1.1, bA: -16, bY: 5, mw: 10, mc: -4, mo: 3, sw: 1 }),
  shocked: IF({ eo: 1.35, bA: -12, bY: 8, mw: 9, mc: -2, mo: 14, sw: 1 }),
  angry: IF({ eo: 0.9, bA: 20, mw: 12, mc: -5 }),
  annoyed: IF({ eo: 0.6, bA: 10, mw: 10, mc: -3, lx: 0.5, blush: 0.6 }),
  smug: IF({ eo: 0.75, bA: 8, mw: 14, mc: 6, lx: 0.3 }),
  determined: IF({ eo: 0.9, bA: 18, mw: 13, mc: -1 }),
  amazed: IF({ star: 1, mw: 12, mc: 2, mo: 16, bY: 8, bA: -10 }),
  fire: IF({ fire: 1, bA: 22, mw: 16, mc: 4, mo: 6, teeth: 1 }),
  joy: IF({ hp: 1, mw: 20, mc: 8, mo: 14, teeth: 1, blush: 0.7, bY: 6, bA: -8 }),
  begging: IF({ eo: 1.3, bA: -22, bY: 8, mw: 9, mc: -3, mo: 6 }),
  wink: IF({ wink: 1, mw: 16, mc: 7, bA: 6, eo: 0.9 }),
  bored: IF({ eo: 0.45, mw: 10, mc: 0, lx: 0, ly: 0.3 }),
};
function ifaces(t, keys, dur = 0.14) {
  const k = [];
  keys.forEach(([tt, n], i) => { if (i) k.push([tt, IFACE[keys[i - 1][1]]]); k.push([tt + (i ? dur : 0), IFACE[n]]); });
  return track(t, k);
}

function hose(S, T, a, b, bend) {
  const [E, H] = ik(S, T, a, b, bend);
  const C = [2 * E[0] - (S[0] + H[0]) / 2, 2 * E[1] - (S[1] + H[1]) / 2];
  return { d: `M ${f1(S[0])} ${f1(S[1])} Q ${f1(C[0])} ${f1(C[1])} ${f1(H[0])} ${f1(H[1])}`, H };
}
const strokeP = (d, w, col = INKC) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

function starPath(r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    d += (i ? 'L' : 'M') + f1(Math.cos(a) * rr) + ' ' + f1(Math.sin(a) * rr) + ' ';
  }
  return d + 'Z';
}

// ---------- face ----------
function inkFace(e, p, t) {
  let o = '';
  const eo = e.eo * (p.blink ?? 1);
  const eyes = [[-17, -4], [17, -4]];
  if (e.blush > 0.05) o += `<ellipse cx="-31" cy="14" rx="9" ry="5" fill="#FF7A9A" opacity="${(0.7 * e.blush).toFixed(2)}"/><ellipse cx="31" cy="14" rx="9" ry="5" fill="#FF7A9A" opacity="${(0.7 * e.blush).toFixed(2)}"/>`;
  const hideEyes = (p.shades ?? 0) > 0.5 && (p.shadesDrop ?? 0) < 0.55;
  eyes.forEach(([ex, ey], i) => {
    if (hideEyes) return;
    const winkThis = e.wink > 0.5 && i === 0;
    if (e.hp > 0.5 || winkThis) {
      o += strokeP(`M ${ex - 10} ${ey + 3} Q ${ex} ${ey - 9} ${ex + 10} ${ey + 3}`, 4.5);
    } else if (e.star > 0.5) {
      const sc = 1 + 0.15 * Math.sin(t * 12 + i);
      o += `<g transform="translate(${ex} ${ey}) scale(${sc.toFixed(3)})"><path d="${starPath(13)}" fill="${PAL.yellow}" stroke="${INKC}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
    } else if (e.fire > 0.5) {
      const fl = Math.sin(t * 30 + i * 2) * 2;
      o += `<ellipse cx="${ex}" cy="${ey}" rx="11" ry="13" fill="#fff" stroke="${INKC}" stroke-width="3.5"/>`;
      o += `<path d="M ${ex - 8} ${ey + 8} Q ${ex - 10} ${ey - 4} ${ex - 2} ${ey - 14 + fl} Q ${ex} ${ey - 4} ${ex + 4} ${ey - 10 - fl} Q ${ex + 10} ${ey} ${ex + 8} ${ey + 8} Z" fill="${PAL.orange}" stroke="${INKC}" stroke-width="2"/>`;
      o += `<path d="M ${ex - 4} ${ey + 8} Q ${ex - 4} ${ey} ${ex} ${ey - 6 + fl} Q ${ex + 5} ${ey + 1} ${ex + 4} ${ey + 8} Z" fill="${PAL.yellow}"/>`;
    } else {
      const ry = Math.max(1.5, 13 * eo);
      o += `<ellipse cx="${ex}" cy="${ey}" rx="11" ry="${f1(ry)}" fill="#fff" stroke="${INKC}" stroke-width="3.5"/>`;
      if (ry > 4) {
        const px = ex + e.lx * 5, py = ey + e.ly * 5;
        const pr = Math.min(6.5, ry * 0.55);
        o += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(pr)}" fill="${INKC}"/><circle cx="${f1(px + 2)}" cy="${f1(py - 2)}" r="1.8" fill="#fff"/>`;
      }
    }
    const by = ey - 20 - e.bY, a = i ? -e.bA : e.bA;
    o += `<line x1="${ex - 9}" y1="${f1(by)}" x2="${ex + 9}" y2="${f1(by)}" transform="rotate(${f1(a)} ${ex} ${f1(by)})" stroke="${p.hair === 'tjr' ? '#8a6440' : INKC}" stroke-width="5" stroke-linecap="round"/>`;
    if (e.tear > 0.5) {
      const ph = (t * 2.2 + i * 0.5) % 1;
      o += `<path transform="translate(${ex + (i ? 12 : -12)} ${f1(ey + 6 + ph * 26)})" d="M 0 -6 Q 5 2 0 5 Q -5 2 0 -6 Z" fill="#6EC8FF" stroke="${INKC}" stroke-width="1.5" opacity="${f1(1 - ph)}"/>`;
    }
  });
  if (p.hair === 'tjr') {
    o += `<path d="M 44 22 Q 34 50 0 52 Q -34 50 -44 22" fill="none" stroke="#a5835a" stroke-width="9" stroke-linecap="round" opacity="0.35"/>`;
    o += `<path d="M -8 36 Q 0 48 8 36 Q 0 40 -8 36 Z" fill="#7a5634"/>`;
  }
  let mo = e.mo, mw = e.mw, mc = e.mc;
  if (p.talk) { mo = Math.max(mo, p.talk * 15); mw = lerp(mw, 12, clamp(p.talk)); mc = lerp(mc, 2, clamp(p.talk)); }
  const my = 22;
  if (mo > 2) {
    const lo = my + 2 * mc + 2.4 * mo;
    o += `<path d="M ${f1(-mw)} ${my} Q 0 ${f1(my + 2 * mc)} ${f1(mw)} ${my} Q 0 ${f1(lo)} ${f1(-mw)} ${my} Z" fill="#5A1414" stroke="${INKC}" stroke-width="3.5" stroke-linejoin="round"/>`;
    if (e.teeth > 0.5) o += `<path d="M ${f1(-mw * 0.78)} ${f1(my + 1)} Q 0 ${f1(my + 2 * mc * 0.9 + 1)} ${f1(mw * 0.78)} ${f1(my + 1)} L ${f1(mw * 0.7)} ${f1(my + 5)} Q 0 ${f1(my + 2 * mc * 0.9 + 6)} ${f1(-mw * 0.7)} ${f1(my + 5)} Z" fill="#fff"/>`;
    if (mo > 8) o += `<ellipse cx="0" cy="${f1(my + mc + mo * 1.6)}" rx="${f1(mw * 0.42)}" ry="${f1(mo * 0.22)}" fill="#FF6B8A"/>`;
  } else {
    o += strokeP(`M ${f1(-mw)} ${my} Q 0 ${f1(my + 2 * mc)} ${f1(mw)} ${my}`, 4.5);
  }
  if (p.hair === 'tjr') o += `<path d="M -17 15 Q -9 7 0 11 Q 9 7 17 15 Q 9 13 0 15 Q -9 13 -17 15 Z" fill="#6e4e2e" stroke="${INKC}" stroke-width="1.2"/>`;
  if (e.sw > 0.5) o += `<path transform="translate(44 -30)" d="M 0 -10 Q 8 2 0 7 Q -8 2 0 -10 Z" fill="#6EC8FF" stroke="${INKC}" stroke-width="2"/>`;
  if (p.glasses) o += `<g fill="rgba(255,255,255,0.18)" stroke="${INKC}" stroke-width="3.5"><circle cx="-17" cy="-4" r="15"/><circle cx="17" cy="-4" r="15"/></g><line x1="-2" y1="-6" x2="2" y2="-6" stroke="${INKC}" stroke-width="3.5"/>`;
  if ((p.shades ?? 0) > 0) {
    const dy = (p.shadesDrop ?? 0) * 16;
    o += `<g opacity="${clamp(p.shades).toFixed(2)}" transform="translate(0 ${f1(dy)})"><rect x="-34" y="-15" width="30" height="21" rx="7" fill="#0b0b0b" stroke="${INKC}" stroke-width="3"/><rect x="4" y="-15" width="30" height="21" rx="7" fill="#0b0b0b" stroke="${INKC}" stroke-width="3"/><line x1="-4" y1="-9" x2="4" y2="-9" stroke="${INKC}" stroke-width="4"/><line x1="-28" y1="-10" x2="-18" y2="-10" stroke="#666" stroke-width="3" stroke-linecap="round"/><line x1="10" y1="-10" x2="20" y2="-10" stroke="#666" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  return o;
}

// ---------- hair & hats (head-local, front view) ----------
function hairBack(p) {
  if (p.hair === 'ponytail') return `<path d="M 34 -40 Q 92 -30 76 30 Q 70 52 58 40 Q 70 0 30 -24 Z" fill="#3a2414" stroke="${INKC}" stroke-width="4" stroke-linejoin="round"/>`;
  return '';
}
function hairFront(p, t) {
  let o = '';
  const R = IB.R;
  if (p.hair === 'spiky') o += `<path d="M -48 -14 L -54 -42 L -34 -38 L -32 -64 L -12 -50 L 0 -74 L 12 -50 L 32 -64 L 34 -38 L 54 -42 L 48 -14 Q 0 -36 -48 -14 Z" fill="${INKC}"/>`;
  if (p.hair === 'curly') {
    o += [[-40, -28, 14], [-24, -44, 16], [0, -52, 17], [24, -44, 16], [40, -28, 14], [-48, -8, 10], [48, -8, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#5b3a1e" stroke="${INKC}" stroke-width="4"/>`).join('');
  }
  if (p.hair === 'ponytail' || p.hair === 'buns') {
    if (p.hair === 'buns') o += `<circle cx="-38" cy="-48" r="17" fill="#2b1a10" stroke="${INKC}" stroke-width="4"/><circle cx="38" cy="-48" r="17" fill="#2b1a10" stroke="${INKC}" stroke-width="4"/>`;
    o += `<path d="M -52 -2 Q -56 -58 0 -58 Q 56 -58 52 -2 Q 44 -30 6 -36 Q -2 -30 -8 -36 Q -44 -30 -52 -2 Z" fill="${p.hair === 'buns' ? '#2b1a10' : '#3a2414'}" stroke="${INKC}" stroke-width="4" stroke-linejoin="round"/>`;
    if (p.bow) o += `<g transform="translate(40 -44) rotate(20)"><path d="M 0 0 L -16 -10 L -16 10 Z M 0 0 L 16 -10 L 16 10 Z" fill="${p.bow}" stroke="${INKC}" stroke-width="3" stroke-linejoin="round"/><circle r="5" fill="${p.bow}" stroke="${INKC}" stroke-width="3"/></g>`;
  }
  if (p.beanie) {
    o += `<path d="M -55 -8 Q -58 -72 0 -70 Q 58 -72 55 -8 Z" fill="${p.beanie}" stroke="${INKC}" stroke-width="4"/>`;
    o += `<rect x="-57" y="-22" width="114" height="18" rx="7" fill="${shade(p.beanie)}" stroke="${INKC}" stroke-width="4"/><circle cx="0" cy="-74" r="11" fill="${p.beanie}" stroke="${INKC}" stroke-width="4"/>`;
  }
  if (p.cap) {
    // forward cap: dome, lightning-bolt badge, brim toward the viewer
    o += `<path d="M -50 -24 Q -52 -74 0 -74 Q 52 -74 50 -24 Z" fill="${p.cap}" stroke="${INKC}" stroke-width="4" stroke-linejoin="round"/>`;
    o += `<path d="M 0 -74 L 0 -26" stroke="${shade(p.cap)}" stroke-width="3"/><circle cx="0" cy="-74" r="5" fill="${shade(p.cap)}" stroke="${INKC}" stroke-width="3"/>`;
    o += `<circle cx="0" cy="-46" r="14" fill="#fff" stroke="${INKC}" stroke-width="3"/><path d="M 3 -57 L -6 -44 L 1 -44 L -3 -35 L 7 -49 L 0 -49 Z" fill="${p.cap}" stroke="${INKC}" stroke-width="1.5" stroke-linejoin="round"/>`;
    o += `<path d="M -60 -22 Q 0 -40 60 -22 Q 66 -10 54 -8 Q 0 -22 -54 -8 Q -66 -10 -60 -22 Z" fill="${shade(p.cap, 0.85)}" stroke="${INKC}" stroke-width="4" stroke-linejoin="round"/>`;
  }
  if (p.hair === 'tjr') {
    o += `<path d="M -55 -4 Q -64 -48 -40 -66 Q -24 -86 -2 -76 Q 16 -90 36 -74 Q 62 -62 56 -28 Q 60 -12 53 -2 Q 47 -30 22 -40 Q 8 -46 2 -36 Q -6 -48 -22 -40 Q -46 -30 -55 -4 Z" fill="#E9B44C" stroke="${INKC}" stroke-width="4" stroke-linejoin="round"/>`;
    o += strokeP('M -44 -26 Q -36 -58 -8 -66 M 46 -26 Q 40 -58 12 -68 M -24 -48 Q -10 -70 6 -70', 3.5, '#A8741F');
    o += strokeP('M -36 -50 Q -20 -72 0 -72 M 18 -66 Q 38 -60 46 -42', 4, '#FFE7A6');
  }
  return o;
}
function shade(hex, k = 0.75) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

// ---------- the character ----------
// p: x,y hip (world), s scale, lean/tilt degrees, hA/hB hand targets (screen-left/right),
// fA/fB foot targets, sq squash (+ taller, - squashed), face, talk, blink, and style:
// cap, hair, bow, beanie, glasses, shades, shadesDrop, chain, phones, shoes, glove ('thumb'|'point'|'fist'),
// gloveScaleA/B, hideLegs.
function inkman(p, t = 0) {
  const s = p.s ?? 1, sq = p.sq ?? 0;
  const sx = s * (1 - sq * 0.5), sy = s * (1 + sq);
  const L = (q) => [(q[0] - p.x) / sx, (q[1] - p.y) / sy];
  const Wd = (q) => [p.x + q[0] * sx, p.y + q[1] * sy];
  const la = ((p.lean ?? 0) * Math.PI) / 180, ha = (((p.lean ?? 0) + (p.tilt ?? 0)) * Math.PI) / 180;
  const up = [Math.sin(la), -Math.cos(la)];
  const neck = [up[0] * IB.torso, up[1] * IB.torso];
  const shp = [up[0] * IB.torso * 0.86, up[1] * IB.torso * 0.86];
  const head = [neck[0] + Math.sin(ha) * IB.R * 0.98, neck[1] - Math.cos(ha) * IB.R * 0.98];
  let o = `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})">`;
  // legs
  if (!p.hideLegs) {
    for (const [hipX, tgt, bend, shoeDir] of [[-7, p.fA, 1, -1], [7, p.fB, -1, 1]]) {
      const h = hose([hipX, 0], L(tgt), IB.th, IB.sh, bend * 0.4);
      o += strokeP(h.d, IB.lw);
      o += `<ellipse cx="${f1(h.H[0] + shoeDir * 9)}" cy="${f1(h.H[1] + 2)}" rx="18" ry="10" fill="${p.shoes || INKC}" stroke="${INKC}" stroke-width="5"/>`;
    }
  }
  o += strokeP(`M 0 0 Q ${f1(up[0] * IB.torso * 0.5 + (p.lean ?? 0) * 0.15)} ${f1(up[1] * IB.torso * 0.5)} ${f1(neck[0])} ${f1(neck[1])}`, IB.bw);
  if (p.phones) o += `<path d="M ${f1(neck[0] - 24)} ${f1(neck[1] + 10)} Q ${f1(neck[0])} ${f1(neck[1] + 34)} ${f1(neck[0] + 24)} ${f1(neck[1] + 10)}" fill="none" stroke="${INKC}" stroke-width="6"/><rect x="${f1(neck[0] - 34)}" y="${f1(neck[1] + 2)}" width="16" height="22" rx="6" fill="${p.phones}" stroke="${INKC}" stroke-width="4"/><rect x="${f1(neck[0] + 18)}" y="${f1(neck[1] + 2)}" width="16" height="22" rx="6" fill="${p.phones}" stroke="${INKC}" stroke-width="4"/>`;
  if (p.chain) {
    const c = p.chain === 'gold' ? '#F5B82E' : '#B9C2CC';
    o += `<path d="M ${f1(neck[0] - 20)} ${f1(neck[1] + 6)} Q ${f1(neck[0])} ${f1(neck[1] + 40)} ${f1(neck[0] + 20)} ${f1(neck[1] + 6)}" fill="none" stroke="${c}" stroke-width="7" stroke-dasharray="6 3"/>`;
    o += `<circle cx="${f1(neck[0])}" cy="${f1(neck[1] + 32)}" r="7" fill="${c}" stroke="${INKC}" stroke-width="2.5"/>`;
  }
  // head
  const rot = ((p.lean ?? 0) + (p.tilt ?? 0));
  o += `<g transform="translate(${f1(head[0])} ${f1(head[1])}) rotate(${f1(rot)})">`;
  o += hairBack(p);
  o += `<circle r="${IB.R}" fill="#fff" stroke="${INKC}" stroke-width="6"/>`;
  o += `<path d="M -40 30 Q -10 50 30 38" fill="none" stroke="#e7e2d8" stroke-width="7" stroke-linecap="round"/>`;
  o += inkFace(p.face || IFACE.neutral, p, t);
  o += hairFront(p, t) + '</g>';
  // arms + gloves on top
  // elbows point outward: down-and-out for lowered hands, up-and-out for raised ones
  const above = (q) => L(q)[1] < shp[1] - 10;
  const arms = [[p.hA, p.bA ?? (above(p.hA) ? -1 : 1), p.gloveA, p.gloveScaleA ?? 1], [p.hB, p.bB ?? (above(p.hB) ? 1 : -1), p.gloveB, p.gloveScaleB ?? 1]];
  const hands = [];
  for (const [tgt, bend, glove, gs] of arms) {
    const h = hose(shp, L(tgt), IB.ua, IB.fa, bend);
    o += strokeP(h.d, IB.lw);
    hands.push(h.H);
    o += gloveSVG(h.H, glove, gs);
  }
  o += '</g>';
  return { svg: o, head: Wd(head), neck: Wd(neck), hA: Wd(hands[0]), hB: Wd(hands[1]) };
}
function gloveSVG(H, kind, sc = 1) {
  let o = `<g transform="translate(${f1(H[0])} ${f1(H[1])}) scale(${sc.toFixed(3)})">`;
  if (kind === 'thumb') o += `<rect x="-5" y="-30" width="11" height="22" rx="5.5" fill="#fff" stroke="${INKC}" stroke-width="4.5"/>`;
  if (kind === 'point') o += `<rect x="-5" y="-32" width="10" height="24" rx="5" fill="#fff" stroke="${INKC}" stroke-width="4.5"/>`;
  o += `<circle r="13" fill="#fff" stroke="${INKC}" stroke-width="5"/>`;
  if (kind === 'fist') o += `<path d="M -7 -4 H 7 M -7 3 H 7" stroke="${INKC}" stroke-width="2.5"/>`;
  return o + '</g>';
}

// ---------- worlds & effects ----------
function burst(cx, cy, a, b, t, n = 18, spin = 10) {
  let o = `<rect x="-200" y="-200" width="1120" height="1680" fill="${a}"/>`;
  const R = 1600, rot = (t * spin * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i * 2 * Math.PI) / n, a1 = a0 + Math.PI / n;
    o += `<path d="M ${cx} ${cy} L ${f1(cx + R * Math.cos(a0))} ${f1(cy + R * Math.sin(a0))} L ${f1(cx + R * Math.cos(a1))} ${f1(cy + R * Math.sin(a1))} Z" fill="${b}"/>`;
  }
  return o;
}
function halftone(op = 0.1) { return `<rect x="-200" y="-200" width="1120" height="1680" fill="url(#dots)" opacity="${op}"/>`; }
function animeLines(cx, cy, t, col = '#fff', n = 40, op = 0.7) {
  const r = rng(Math.floor(t * 20) + 7); let o = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, w = 0.004 + r() * 0.012, r0 = 300 + r() * 200;
    o += `<path d="M ${f1(cx + r0 * Math.cos(a))} ${f1(cy + r0 * Math.sin(a))} L ${f1(cx + 1500 * Math.cos(a - w))} ${f1(cy + 1500 * Math.sin(a - w))} L ${f1(cx + 1500 * Math.cos(a + w))} ${f1(cy + 1500 * Math.sin(a + w))} Z" fill="${col}" opacity="${op}"/>`;
  }
  return o;
}
function slam(t, t0, x, y, str, o2 = {}) {
  if (t < t0) return '';
  const u = prog(t, t0, t0 + 0.16), sc = lerp(o2.from ?? 2.6, 1, ease.out(u)) * (1 + 0.04 * Math.sin((t - t0) * 30) * (1 - prog(t, t0, t0 + 0.5)));
  const op = clamp(u * 3) * (1 - prog(t, (o2.until ?? 1e9) - 0.12, o2.until ?? 1e9));
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${o2.rot ?? 0}) scale(${sc.toFixed(3)})" opacity="${op.toFixed(3)}"><text x="0" y="0" font-family="Anton" font-size="${o2.size ?? 90}" fill="${o2.fill ?? '#fff'}" text-anchor="middle" stroke="${INKC}" stroke-width="${o2.stroke ?? 14}" stroke-linejoin="round" paint-order="stroke">${esc(str)}</text></g>`;
}
function haSprites(t, t0, t1, seed, area) {
  if (t < t0 || t > t1 + 0.5) return '';
  const r = rng(seed); let o = '';
  const cols = [PAL.pink, PAL.cyan, PAL.yellow, PAL.green, PAL.orange];
  for (let i = 0; i < 14; i++) {
    const ts = t0 + r() * (t1 - t0), x = area[0] + r() * (area[2] - area[0]), y = area[1] + r() * (area[3] - area[1]);
    const life = 0.7, u = (t - ts) / life;
    if (u < 0 || u > 1) continue;
    const sc = ease.back(clamp(u * 4)) * (1 - 0.2 * u), rot = (r() - 0.5) * 40;
    o += `<g transform="translate(${f1(x)} ${f1(y - u * 40)}) rotate(${f1(rot)}) scale(${sc.toFixed(3)})" opacity="${f1(1 - u * u)}"><text font-family="Anton" font-size="${f1(44 + r() * 30)}" fill="${cols[i % 5]}" text-anchor="middle" stroke="${INKC}" stroke-width="9" paint-order="stroke">${r() < 0.5 ? 'HA' : 'HAHA'}</text></g>`;
  }
  return o;
}
function inkConfetti(t, t0, seed = 3, n = 80) {
  const r = rng(seed); let o = '';
  const cols = [PAL.yellow, PAL.pink, PAL.cyan, PAL.orange, PAL.green, '#fff'];
  for (let i = 0; i < n; i++) {
    const x0 = r() * 720, d = r() * 0.5, v = 300 + r() * 400, rot0 = r() * 360, vr = (r() - 0.5) * 700, w = 10 + r() * 8, c = cols[i % cols.length];
    const lt = t - t0 - d;
    if (lt < 0) continue;
    const y = -40 + lt * v;
    if (y > 1320) continue;
    o += `<rect x="${f1(-w / 2)}" y="${f1(-w * 0.35)}" width="${f1(w)}" height="${f1(w * 0.7)}" fill="${c}" stroke="${INKC}" stroke-width="2" transform="translate(${f1(x0 + Math.sin(lt * 4 + rot0) * 30)} ${f1(y)}) rotate(${f1(rot0 + lt * vr)})"/>`;
  }
  return o;
}

// ---------- punchy captions ----------
function buildPunchChunks(lines) {
  const chunks = [];
  lines.forEach((line, li) => {
    const ws = lineWords(line);
    let cur = [];
    const flush = () => { if (cur.length) chunks.push({ li, spk: line.speaker, words: cur }); cur = []; };
    ws.forEach((w) => {
      cur.push(w);
      if (/[.!?…,]$/.test(w.w) || cur.length >= 3) flush();
    });
    flush();
  });
  chunks.forEach((c, i) => {
    const next = chunks[i + 1], line = lines[c.li];
    c.a = c.words[0].s - 0.06;
    c.b = next ? Math.min(next.words[0].s - 0.06, line.e + 0.5) : line.e + 1.0;
    if (next && next.li !== c.li) c.b = Math.min(line.e + 0.5, next.words[0].s - 0.06);
  });
  return chunks;
}
function punchCaption(t, chunks, colorOf, y = 300) {
  const ci = chunks.findIndex((c) => t >= c.a && t < c.b);
  if (ci < 0) return '';
  const c = chunks[ci];
  const words = c.words.map((w) => w.w.toUpperCase());
  const est = (s) => s.length * 0.5 + 0.28;
  let size = 96;
  const total = words.reduce((a, w) => a + est(w), 0) * size;
  if (total > 640) size *= 640 / total;
  let x = 360 - (words.reduce((a, w) => a + est(w), 0) * size) / 2;
  const rot = ci % 2 ? 2.5 : -2.5;
  let o = `<g transform="rotate(${rot} 360 ${y})">`;
  c.words.forEach((w, i) => {
    const wwid = est(words[i]) * size, cx = x + wwid / 2;
    x += wwid;
    if (t < w.s - 0.06) return;
    const u = prog(t, w.s - 0.06, w.s + 0.1);
    const sc = lerp(1.7, 1, ease.out(u)) * (1 + 0.08 * bump(t, w.s + 0.05, w.s + 0.3));
    const active = t >= w.s - 0.06 && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.06);
    const fill = active ? colorOf(c.spk) : '#fff';
    o += `<g transform="translate(${f1(cx)} ${y}) scale(${sc.toFixed(3)})"><text x="0" y="${f1(size * 0.36)}" font-family="Anton" font-size="${f1(size)}" fill="${fill}" text-anchor="middle" stroke="${INKC}" stroke-width="${f1(size * 0.16)}" stroke-linejoin="round" paint-order="stroke">${esc(words[i])}</text></g>`;
  });
  return o + '</g>';
}

const INK_DEFS = `
  <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.4" fill="#000"/></pattern>
  <radialGradient id="phoneglow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7fdcff" stop-opacity="0.55"/><stop offset="1" stop-color="#7fdcff" stop-opacity="0"/></radialGradient>`;
