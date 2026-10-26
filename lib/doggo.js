'use strict';
// Painterly dog rig: side-view dogs with shaded fur, four IK legs, hinged jaw,
// floppy ears, wagging tail, expressive eyes/brows, breeds and accessories,
// plus a front-facing head for close-ups. Uses lib/stickkit.js helpers.

const BREEDS = {
  stray: { base: '#9a6a3f', dark: '#5e3d22', light: '#e6cca2', ear: 'flop', earCol: '#5e3d22', snout: 1.0, eye: '#3a2414', fur: 1, leg: 1.12, bodyH: 1.12 },
  poodle: { base: '#f3ece4', dark: '#c9bcae', light: '#ffffff', ear: 'poodle', earCol: '#e6dccf', snout: 0.95, eye: '#2a1a12', fluffy: 1, lashes: 1, leg: 1.15 },
  bulldog: { base: '#c9a27a', dark: '#8a6644', light: '#efe0cc', ear: 'rose', earCol: '#8a6644', snout: 0.55, eye: '#2a1a12', jowls: 1, leg: 0.72, bodyH: 1.35, headS: 1.18 },
  diva: { base: '#e2b878', dark: '#a87a40', light: '#fff0d2', ear: 'long', earCol: '#c99a58', snout: 1.15, eye: '#2a1a12', lashes: 1, silky: 1, leg: 1.2 },
};

const DG = { front: [40, 44], hind: [44, 50] };
const BODY_PATH = 'M -26 -4 C -30 -26 -20 -36 -8 -38 C 30 -46 92 -48 124 -44 C 142 -42 156 -30 160 -8 C 164 14 150 34 126 36 C 98 38 80 28 60 28 C 40 28 22 24 10 22 C -8 20 -22 12 -26 -4 Z';

// fur strokes and dirt, generated once per breed in body coordinates
const FUR = {};
function furFor(name) {
  if (FUR[name]) return FUR[name];
  const b = BREEDS[name], r = rng(name.length * 97 + 3);
  let o = '';
  const n = b.fluffy ? 0 : 70;
  for (let i = 0; i < n; i++) {
    const x = -20 + r() * 175, y = -40 + r() * 70;
    if (((x - 66) / 92) ** 2 + ((y + 2) / 38) ** 2 > 1) continue;
    const len = 6 + r() * 8, dark = r() < 0.55;
    o += `<path d="M ${f1(x)} ${f1(y)} q ${f1(-len * 0.5)} ${f1(len * 0.2)} ${f1(-len)} ${f1(len * 0.45)}" stroke="${dark ? b.dark : b.light}" stroke-width="${f1(1.2 + r() * 1.3)}" fill="none" stroke-linecap="round" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`;
  }
  // fuzzy outline tufts along the back and belly
  const edge = [[-24, -20], [-14, -36], [10, -42], [40, -46], [70, -47], [100, -46], [124, -44], [150, -28], [158, 4], [140, 32], [110, 34], [80, 28], [50, 27], [20, 23], [-10, 16]];
  edge.forEach(([x, y], i) => {
    const nx = (x - 66) / 92, ny = (y + 2) / 38, d = Math.hypot(nx, ny) || 1;
    const len = (b.fur ? 7 : 4) + r() * 6;
    o += `<path d="M ${f1(x)} ${f1(y)} l ${f1((nx / d) * len - 3)} ${f1((ny / d) * len)}" stroke="${y < 0 ? b.dark : b.base}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>`;
  });
  let dirt = '';
  for (let i = 0; i < 6; i++) dirt += `<ellipse cx="${f1(r() * 140)}" cy="${f1(-30 + r() * 50)}" rx="${f1(8 + r() * 14)}" ry="${f1(5 + r() * 8)}" fill="#4a3a2c" opacity="0.35"/>`;
  FUR[name] = { strokes: o, dirt };
  return FUR[name];
}

// p: breed, x, y (ground), s, flip, tilt (body pitch, + = front up), hipLift,
//    paws: { fN, fF, hN, hF } world targets, neck (deg above horizontal), headTilt,
//    jaw (0..1), tongue (0..1), lid (0..1 closed), look [x,y], brow (-1 sad..1 angry),
//    earLift (0 droop..1 perk), earSwing (deg), tailUp (deg), wag (deg), wagSpeed,
//    dirt (0..1), wink, acc: { chain, shades, shadesDrop, pearls, scarf, bow, flower }
function dog(p, t = 0) {
  const b = BREEDS[p.breed || 'stray'];
  const s = p.s ?? 1, f = p.flip ?? 1, tilt = p.tilt ?? 0;
  const toL = (q) => [(q[0] - p.x) / (f * s), (q[1] - p.y) / s];
  const toW = (q) => [p.x + q[0] * f * s, p.y + q[1] * s];
  const lm = b.leg ?? 1, bh = b.bodyH ?? 1, hs = b.headS ?? 1;
  const FL = DG.front.map((v) => v * lm), HL = DG.hind.map((v) => v * lm);
  const H = [-62, -92 * lm + (p.hipLift ?? 0)];
  const a = (-tilt * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const bp = (q) => [H[0] + q[0] * ca - q[1] * bh * sa, H[1] + q[0] * sa + q[1] * bh * ca];
  const SJ = bp([120, -6]), HJ = bp([0, 2]), NB = bp([140, -30]), TB = bp([-22, -24]);
  const paw = (k, def) => (p.paws && p.paws[k] ? toL(p.paws[k]) : def);
  const fN = paw('fN', [SJ[0] + 6, 0]), fF = paw('fF', [SJ[0] - 6, 0]);
  const hN = paw('hN', [HJ[0] + 4, 0]), hF = paw('hF', [HJ[0] - 8, 0]);
  const g = `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">`;
  let o = g;
  // contact shadow
  if (!p.noShadow) o += `<ellipse cx="${f1((SJ[0] + HJ[0]) / 2)}" cy="2" rx="${f1(Math.abs(SJ[0] - HJ[0]) * 0.75 + 30)}" ry="9" fill="#000" opacity="${(p.shadowOp ?? 0.28).toFixed(2)}" filter="url(#blur3)"/>`;
  const acc = p.acc || {};
  const leg = (root, tgt, [u, l], bend, col, w0, w1, pawCol = col) => {
    const [E, P] = ik(root, tgt, u, l, bend);
    return `<path d="M ${f1(root[0])} ${f1(root[1])} L ${f1(E[0])} ${f1(E[1])}" stroke="${col}" stroke-width="${w0}" stroke-linecap="round"/>` +
      `<path d="M ${f1(E[0])} ${f1(E[1])} L ${f1(P[0])} ${f1(P[1])}" stroke="${col}" stroke-width="${w1}" stroke-linecap="round"/>` +
      `<ellipse cx="${f1(P[0] + 5)}" cy="${f1(P[1] - 2)}" rx="12" ry="7" fill="${pawCol}"/>` +
      (b.fluffy ? `<circle cx="${f1(P[0] + 2)}" cy="${f1(P[1] - 8)}" r="12" fill="${b.light}"/>` : '');
  };
  const farCol = acc.tux ? '#0b0b0d' : b.dark, nearCol = acc.tux ? '#17171a' : b.base;
  o += leg(bp([-6, 0]), hF, HL, -1, farCol, 22, 14, b.dark);
  o += leg(bp([114, -6]), fF, FL, 1, farCol, 20, 13, b.dark);
  // tail
  const wagA = (p.tailUp ?? 20) + (p.wag ?? 0) * Math.sin(t * (p.wagSpeed ?? 12));
  const ta = ((180 - wagA) * Math.PI) / 180 - a;
  const tl = b.fluffy ? 40 : 62;
  const T1 = [TB[0] + Math.cos(ta) * tl * 0.55, TB[1] - Math.sin(ta) * tl * 0.55 - 10];
  const T2 = [TB[0] + Math.cos(ta) * tl, TB[1] - Math.sin(ta) * tl];
  o += `<path d="M ${f1(TB[0])} ${f1(TB[1])} Q ${f1(T1[0])} ${f1(T1[1])} ${f1(T2[0])} ${f1(T2[1])}" stroke="${b.base}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
  o += `<path d="M ${f1(T1[0])} ${f1(T1[1])} Q ${f1((T1[0] + T2[0]) / 2)} ${f1((T1[1] + T2[1]) / 2 - 3)} ${f1(T2[0])} ${f1(T2[1])}" stroke="${b.dark}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>`;
  if (b.fluffy) o += `<circle cx="${f1(T2[0])}" cy="${f1(T2[1])}" r="16" fill="${b.light}"/>`;
  if (b.silky) o += `<path d="M ${f1(T1[0])} ${f1(T1[1])} Q ${f1(T2[0] - 4)} ${f1(T2[1] + 20)} ${f1(T2[0] - 10)} ${f1(T2[1] + 34)}" stroke="${b.light}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  // body
  const fur = furFor(p.breed || 'stray');
  o += `<g transform="translate(${f1(H[0])} ${f1(H[1])}) rotate(${f1(-tilt)}) scale(1 ${bh})">`;
  o += `<path d="${BODY_PATH}" fill="url(#fur_${p.breed || 'stray'})"/>`;
  o += `<g clip-path="url(#bodyClip)">${fur.strokes}${(p.dirt ?? 0) > 0 ? `<g opacity="${clamp(p.dirt).toFixed(2)}">${fur.dirt}</g>` : ''}<ellipse cx="70" cy="-30" rx="70" ry="14" fill="#fff" opacity="0.12"/></g>`;
  if (b.fluffy) o += `<circle cx="-12" cy="-8" r="34" fill="${b.light}"/><circle cx="140" cy="2" r="36" fill="${b.light}"/><circle cx="120" cy="-24" r="28" fill="${b.base}"/>`;
  o += `<ellipse cx="4" cy="2" rx="32" ry="30" fill="${b.base}"/><ellipse cx="0" cy="-6" rx="22" ry="18" fill="#fff" opacity="0.08"/>`;
  if (acc.tux) o += `<path d="${BODY_PATH}" fill="#17171a"/><path d="M 124 -42 L 160 -8 L 152 22 L 136 -4 Z" fill="#f4f4f2"/><path d="M 124 -42 L 136 -4 M 160 -8 L 136 -4" stroke="#000" stroke-width="2"/><ellipse cx="60" cy="-30" rx="60" ry="10" fill="#fff" opacity="0.06"/>`;
  if (acc.gown) o += `<g clip-path="url(#bodyClip)"><rect x="6" y="-60" width="170" height="130" fill="url(#gown_${acc.gown})"/>${sparkles(t, 9, [10, -50, 165, 35], 3)}</g>`;
  o += '</g>';
  o += leg(bp([4, 4]), hN, HL, -1, nearCol, 26, 15, b.base);
  if (acc.gown) {
    const W = bp([4, 22]), F = bp([118, 30]), wv = Math.sin(t * 3) * 6;
    o += `<path d="M ${f1(W[0] - 8)} ${f1(W[1])} Q ${f1(W[0] - 40)} ${f1(W[1] * 0.4)} ${f1(W[0] - 150 + wv)} -2 L ${f1(F[0] + 60 - wv)} -2 Q ${f1(F[0] + 30)} ${f1(F[1] * 0.4)} ${f1(F[0])} ${f1(F[1])} Z" fill="url(#gown_${acc.gown})"/>`;
    o += `<path d="M ${f1(W[0] - 150 + wv)} -2 Q ${f1((W[0] + F[0]) / 2)} 6 ${f1(F[0] + 60 - wv)} -2" stroke="#fff" stroke-width="3" fill="none" opacity="0.5"/>`;
    o += sparkles(t, 23, [W[0] - 140, Math.min(W[1], F[1]), F[0] + 50, -6], 22);
  }
  o += leg(bp([122, -2]), fN, FL, 1, nearCol, 22, 14, b.base);
  // neck + head
  const na = ((p.neck ?? 35) * Math.PI) / 180 - a;
  const HC = [NB[0] + Math.cos(na) * 44, NB[1] - Math.sin(na) * 44];
  o += `<path d="M ${f1(NB[0] - 12)} ${f1(NB[1] + 14)} L ${f1(HC[0] - 6)} ${f1(HC[1] + 8)}" stroke="${b.base}" stroke-width="50" stroke-linecap="round"/>`;
  if (b.silky) o += `<path d="M ${f1(NB[0] - 20)} ${f1(NB[1] + 10)} Q ${f1(NB[0])} ${f1(NB[1] + 50)} ${f1(NB[0] + 18)} ${f1(NB[1] + 40)}" stroke="${b.light}" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  if (acc.tux) o += `<g transform="translate(${f1(NB[0] + 10)} ${f1(NB[1] + 12)}) rotate(${f1(-tilt)})"><path d="M 0 0 L -12 -8 L -12 8 Z M 0 0 L 12 -8 L 12 8 Z" fill="#111"/><circle r="3.5" fill="#222"/></g>`;
  if (acc.scarf) {
    const wv = Math.sin(t * 9) * 8;
    o += `<path d="M ${f1(NB[0] - 4)} ${f1(NB[1] + 2)} Q ${f1(NB[0] - 40)} ${f1(NB[1] + 8 + wv)} ${f1(NB[0] - 80)} ${f1(NB[1] - 4 - wv)}" stroke="${acc.scarf}" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="${f1((NB[0] + HC[0]) / 2)}" cy="${f1((NB[1] + HC[1]) / 2 + 16)}" rx="24" ry="9" fill="${acc.scarf}" transform="rotate(${f1(-(p.neck ?? 35) + tilt)} ${f1((NB[0] + HC[0]) / 2)} ${f1((NB[1] + HC[1]) / 2 + 16)})"/>`;
  }
  if (acc.chain) {
    const mX = (NB[0] + HC[0]) / 2, mY = (NB[1] + HC[1]) / 2;
    for (const k of [0, 1]) o += `<path d="M ${f1(mX - 22)} ${f1(mY - 6 + k * 8)} Q ${f1(mX + 6)} ${f1(mY + 40 + k * 14)} ${f1(mX + 30)} ${f1(mY + 6 + k * 8)}" stroke="#F2C230" stroke-width="${5 - k}" fill="none" stroke-dasharray="5 2.5" filter="url(#glow2)"/>`;
    o += `<circle cx="${f1(mX + 6)}" cy="${f1(mY + 44)}" r="9" fill="#F2C230" stroke="#9a7410" stroke-width="2"/>` + `<text x="${f1(mX + 6)}" y="${f1(mY + 48.5)}" font-family="Anton" font-size="12" fill="#7a5a08" text-anchor="middle">$</text>`;
  }
  if (acc.pearls) {
    const mX = (NB[0] + HC[0]) / 2, mY = (NB[1] + HC[1]) / 2;
    for (let i = 0; i <= 8; i++) { const u = i / 8, x = mX - 22 + u * 50, y = mY - 4 + Math.sin(u * Math.PI) * 34; o += `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.2" fill="#fbf6ee" stroke="#cfc4b6" stroke-width="1"/>`; }
  }
  if (!p.noHead) o += `<g transform="translate(${f1(HC[0])} ${f1(HC[1])}) rotate(${f1(-(p.headTilt ?? 0) - tilt * 0.3)}) scale(${hs})">${dogHead(b, p, t)}</g>`;
  o += '</g>';
  return { svg: o, head: toW(HC), neck: toW(NB), chest: toW(bp([150, 10])), paw: toW(fN) };
}

function earShape(b, near, lift, swing, t) {
  const col = near ? b.earCol : b.dark;
  if (b.ear === 'rose') return `<path d="M -6 -26 Q -24 -42 -30 -24 Q -20 -20 -8 -16 Z" fill="${col}"/>`;
  if (b.ear === 'poodle') {
    const ang = lerp(6, 40, lift) + swing;
    return `<g transform="translate(-14 -18) rotate(${f1(ang)})"><circle cx="0" cy="18" r="17" fill="${near ? b.light : b.dark}"/><circle cx="-6" cy="36" r="15" fill="${near ? b.light : b.dark}"/><circle cx="6" cy="44" r="13" fill="${near ? b.light : b.dark}"/></g>`;
  }
  const len = b.ear === 'long' ? 1.7 : 1;
  const ang = lerp(8, 112, lift) + swing;
  let o = `<g transform="translate(-10 -24) rotate(${f1(ang)})"><path d="M 0 0 C 15 6 18 ${f1(34 * len)} 7 ${f1(52 * len)} C 0 ${f1(60 * len)} -14 ${f1(56 * len)} -16 ${f1(44 * len)} C -20 ${f1(26 * len)} -12 6 0 0 Z" fill="${col}"/>`;
  if (b.ear === 'long') for (let i = 0; i < 4; i++) o += `<path d="M ${-8 + i * 5} 10 Q ${-12 + i * 6 + Math.sin(t * 6 + i) * 3} ${f1(50 * len)} ${-6 + i * 5} ${f1(62 * len)}" stroke="${b.light}" stroke-width="2.2" fill="none" opacity="0.55"/>`;
  return o + '</g>';
}

function dogHead(b, p, t) {
  const sn = b.snout, jaw = clamp(p.jaw ?? 0), acc = p.acc || {};
  const lift = p.earLift ?? 0.3, swing = p.earSwing ?? 0;
  let o = earShape(b, false, lift, swing + 6, t).replace('translate(-10 -24)', 'translate(-2 -28)').replace('translate(-14 -18)', 'translate(-6 -22)');
  // skull
  o += `<ellipse cx="0" cy="0" rx="36" ry="31" fill="url(#head_${p.breed || 'stray'})"/>`;
  if (b.fluffy) o += `<circle cx="-6" cy="-26" r="22" fill="${b.light}"/><circle cx="12" cy="-30" r="16" fill="${b.light}"/>`;
  if (b.silky) o += `<path d="M -20 -28 Q 4 -44 26 -24 Q 6 -30 -20 -16 Z" fill="${b.light}" opacity="0.85"/>`;
  // mouth interior + lower jaw (hinged)
  const jr = jaw * 30;
  if (jaw > 0.02) o += `<path d="M 14 14 L ${f1(60 * sn)} 13 L ${f1(58 * sn)} ${f1(14 + jaw * 26)} L 14 20 Z" fill="#5a1a1e"/>`;
  if (jaw > 0.2 || (p.tongue ?? 0) > 0) {
    const tg = Math.max(jaw, p.tongue ?? 0);
    o += `<path d="M 26 ${f1(18 + jaw * 8)} Q ${f1(46 * sn)} ${f1(20 + jaw * 12 + tg * 22)} ${f1(52 * sn)} ${f1(18 + jaw * 10 + tg * 26)} Q ${f1(44 * sn)} ${f1(26 + jaw * 10 + tg * 30)} 30 ${f1(24 + jaw * 6)} Z" fill="#e8758a"/>`;
  }
  o += `<g transform="rotate(${f1(jr)} 12 16)"><path d="M 12 14 L ${f1(56 * sn)} 16 Q ${f1(60 * sn)} 18 ${f1(56 * sn)} 24 L 18 28 Q 8 24 12 14 Z" fill="${b.base}"/>`;
  if (jaw > 0.2) o += `<path d="M ${f1(50 * sn)} 16 l -3 -5 l -3 5 Z" fill="#fff"/>`;
  o += '</g>';
  // upper muzzle
  o += `<path d="M 12 -10 C 30 -14 ${f1(52 * sn)} -10 ${f1(62 * sn)} -4 C ${f1(70 * sn)} 2 ${f1(68 * sn)} 14 ${f1(60 * sn)} 15 L 14 18 C 8 12 6 -4 12 -10 Z" fill="${b.light}"/>`;
  o += `<path d="M 12 -10 C 30 -14 ${f1(52 * sn)} -10 ${f1(62 * sn)} -4" stroke="${b.base}" stroke-width="6" fill="none" opacity="0.6"/>`;
  if (b.jowls) o += `<path d="M ${f1(30 * sn)} 10 Q ${f1(58 * sn)} 12 ${f1(60 * sn)} 26 Q ${f1(40 * sn)} 34 20 22 Z" fill="${b.light}" stroke="${b.dark}" stroke-width="1.5"/><path d="M -6 -18 q 8 -4 16 0 M -4 -12 q 8 -4 16 0" stroke="${b.dark}" stroke-width="2" fill="none" opacity="0.6"/>`;
  o += `<path d="M ${f1(62 * sn)} 8 Q ${f1(44 * sn)} 14 22 15" stroke="#3a2418" stroke-width="2" fill="none" opacity="0.6"/>`;
  // nose
  o += `<ellipse cx="${f1(66 * sn)}" cy="-1" rx="10" ry="8" fill="#1a1210"/><ellipse cx="${f1(64 * sn)}" cy="-4" rx="4" ry="2.2" fill="#fff" opacity="0.5"/>`;
  // eye
  const ex = 14, ey = -10, lid = clamp(p.lid ?? 0.15), look = p.look || [0, 0];
  const wink = p.wink ?? 0;
  if (wink > 0.5) {
    o += `<path d="M ${ex - 8} ${ey + 1} Q ${ex} ${ey + 6} ${ex + 8} ${ey + 1}" stroke="#1a0f08" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  } else {
    o += `<ellipse cx="${ex}" cy="${ey}" rx="8.5" ry="8" fill="#fff"/><circle cx="${f1(ex + 1.5 + look[0] * 2)}" cy="${f1(ey + look[1] * 2)}" r="7" fill="${b.eye}"/><circle cx="${f1(ex + 2 + look[0] * 2)}" cy="${f1(ey + look[1] * 2)}" r="4" fill="#000"/><circle cx="${f1(ex + 4 + look[0] * 2)}" cy="${f1(ey - 2.5 + look[1] * 2)}" r="2" fill="#fff"/>`;
    if (p.sparkle) o += `<circle cx="${f1(ex - 1)}" cy="${f1(ey + 2)}" r="1.4" fill="#fff"/>`;
    o += `<path d="M ${ex - 10} ${ey - 9} L ${ex + 10} ${ey - 9} L ${ex + 10} ${f1(ey - 9 + 17 * lid)} Q ${ex} ${f1(ey - 6 + 17 * lid)} ${ex - 10} ${f1(ey - 9 + 17 * lid)} Z" fill="${b.base}"/>`;
    o += `<path d="M ${ex - 9} ${f1(ey - 8 + 16 * lid)} Q ${ex} ${f1(ey - 5 + 16 * lid)} ${ex + 9} ${f1(ey - 8 + 16 * lid)}" stroke="#2a1a10" stroke-width="1.8" fill="none"/>`;
    if (b.lashes) o += `<path d="M ${ex + 6} ${f1(ey - 7 + 15 * lid)} l 5 -4 M ${ex + 3} ${f1(ey - 6 + 15 * lid)} l 3 -5" stroke="#1a0f08" stroke-width="1.6"/>`;
    if (p.tear) o += `<path transform="translate(${ex + 2} ${f1(ey + 10 + ((t * 1.5) % 1) * 22)})" d="M 0 -4 Q 3 1 0 3 Q -3 1 0 -4 Z" fill="#8fd3ff" opacity="${f1(1 - ((t * 1.5) % 1))}"/>`;
  }
  const brow = p.brow ?? 0;
  o += `<path d="M ${ex - 10} ${f1(ey - 13 + brow * 3)} Q ${ex} ${f1(ey - 17)} ${ex + 9} ${f1(ey - 13 - brow * 5)}" stroke="${b.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (acc.shades > 0) {
    const dy = (acc.shadesDrop ?? 0) * 10;
    o += `<g opacity="${clamp(acc.shades).toFixed(2)}"><path d="M ${ex - 13} ${f1(ey - 6 + dy)} L ${ex + 15} ${f1(ey - 6 + dy)} L ${ex + 12} ${f1(ey + 8 + dy)} Q ${ex} ${f1(ey + 12 + dy)} ${ex - 11} ${f1(ey + 6 + dy)} Z" fill="#0c0c10"/><path d="M ${ex - 6} ${f1(ey - 2 + dy)} L ${ex + 4} ${f1(ey - 3 + dy)}" stroke="#fff" stroke-width="2" opacity="0.7"/><path d="M ${ex - 13} ${f1(ey - 5 + dy)} L -24 ${f1(-12 + dy * 0.5)}" stroke="#d4a72c" stroke-width="3"/></g>`;
  }
  if (acc.glasses) o += `<circle cx="${ex + 1}" cy="${ey}" r="11" fill="rgba(255,255,255,0.15)" stroke="#2a2a2a" stroke-width="2.5"/><path d="M ${ex - 10} ${ey - 2} L -20 -14" stroke="#2a2a2a" stroke-width="2.5"/>`;
  if (acc.pen) o += `<g transform="translate(${f1(52 * sn)} 20) rotate(14)"><rect x="0" y="-3" width="44" height="6" rx="2" fill="#2a5ad8"/><path d="M 44 -3 L 52 0 L 44 3 Z" fill="#e8d0a0"/></g>`;
  if (acc.heartEyes) { const hb = 1 + 0.18 * Math.sin(t * 14); o += `<g transform="translate(${ex + 1} ${ey}) scale(${hb.toFixed(2)})"><path d="M 0 7 C -12 -1 -8 -11 0 -5 C 8 -11 12 -1 0 7 Z" fill="#ff3b6b" stroke="#a0103a" stroke-width="1.5"/></g>`; }
  if (acc.tiara) o += `<g transform="translate(-2 -30) rotate(-12)"><path d="M -24 4 L -20 -10 L -12 0 L -4 -16 L 4 0 L 12 -10 L 18 4 Z" fill="#f6d55c" stroke="#b08a20" stroke-width="1.5"/><circle cx="-4" cy="-12" r="3.5" fill="#ff4f9a"/><circle cx="-18" cy="-6" r="2.2" fill="#9fe8ff"/><circle cx="12" cy="-6" r="2.2" fill="#9fe8ff"/></g>`;
  if (acc.helmet) o += `<path d="M -36 -4 Q -38 -42 0 -42 Q 34 -42 34 -8 Z" fill="${acc.helmet}"/><path d="M 30 -10 L 52 -6 L 50 0 L 30 -2 Z" fill="#222"/><text x="-2" y="-18" font-family="Anton" font-size="12" fill="#fff" text-anchor="middle">DELIVERY</text><path d="M -18 -4 Q -10 22 10 26" stroke="#222" stroke-width="3" fill="none"/>`;
  if (acc.bowDroop) o += `<g transform="translate(-14 -26) rotate(70)"><path d="M 0 0 L -12 -6 L -10 9 Z M 0 0 L 9 -4 L 11 8 Z" fill="#b08a9a"/><circle r="3.5" fill="#9a7a88"/></g>`;
  if (acc.bow) o += `<g transform="translate(-4 -40) rotate(-10)"><path d="M 0 0 L -14 -9 L -14 9 Z M 0 0 L 14 -9 L 14 9 Z" fill="${acc.bow}"/><circle r="4.5" fill="${acc.bow}"/></g>`;
  if (acc.flower) o += `<g transform="translate(${f1(62 * sn)} 22)"><line x1="0" y1="0" x2="-30" y2="6" stroke="#3c8a3a" stroke-width="3"/><g transform="translate(6 -2)">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-6" rx="3.5" ry="6" fill="#ff6fa3" transform="rotate(${r})"/>`).join('')}<circle r="3.5" fill="#ffd34d"/></g></g>`;
  o += earShape(b, true, lift, swing, t);
  return o;
}

// Front-facing head for camera close-ups (the wink).
function dogFront(cx, cy, sc, p, t) {
  const b = BREEDS[p.breed || 'stray'], acc = p.acc || {};
  let o = `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${sc.toFixed(3)})">`;
  const lift = p.earLift ?? 0.3;
  for (const d of [-1, 1]) o += `<g transform="translate(${d * 40} -34) rotate(${f1(d * lerp(20, -30, lift))})"><path d="M 0 0 C ${d * 26} 6 ${d * 34} 50 ${d * 16} 74 C ${d * 6} 84 ${d * -10} 76 ${d * -8} 56 C ${d * -6} 30 ${d * -6} 8 0 0 Z" fill="${b.earCol}"/></g>`;
  o += `<path d="M -62 -10 C -64 -56 -30 -76 0 -76 C 30 -76 64 -56 62 -10 C 60 30 40 56 0 60 C -40 56 -60 30 -62 -10 Z" fill="url(#head_${p.breed || 'stray'})"/>`;
  o += `<ellipse cx="0" cy="28" rx="40" ry="32" fill="${b.light}"/>`;
  const wink = p.wink ?? 0;
  for (const d of [-1, 1]) {
    const ex = d * 26, ey = -14;
    if (wink > 0.5 && d === -1) o += `<path d="M ${ex - 12} ${ey + 2} Q ${ex} ${ey + 10} ${ex + 12} ${ey + 2}" stroke="#1a0f08" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    else o += `<ellipse cx="${ex}" cy="${ey}" rx="12" ry="12" fill="#fff"/><circle cx="${ex}" cy="${ey + 1}" r="10" fill="${b.eye}"/><circle cx="${ex}" cy="${ey + 1}" r="5.5" fill="#000"/><circle cx="${ex + 3.5}" cy="${ey - 3}" r="3" fill="#fff"/>`;
    o += `<path d="M ${ex - 13} ${ey - 18 + (d === -1 && wink > 0.5 ? 4 : 0)} Q ${ex} ${ey - 24} ${ex + 13} ${ey - 18}" stroke="${b.dark}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  o += `<path d="M -16 10 Q 0 4 16 10 Q 18 22 0 28 Q -18 22 -16 10 Z" fill="#1a1210"/><ellipse cx="-5" cy="12" rx="5" ry="2.5" fill="#fff" opacity="0.5"/>`;
  o += `<path d="M 0 28 L 0 38 M -20 38 Q -10 48 0 38 Q 10 48 20 38" stroke="#3a2418" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if ((p.tongue ?? 0) > 0) o += `<path d="M -9 42 Q 0 ${f1(42 + 24 * p.tongue)} 9 42 Z" fill="#e8758a"/>`;
  if (acc.chain) for (const k of [0, 1, 2]) o += `<path d="M -50 ${56 + k * 8} Q 0 ${100 + k * 12} 50 ${56 + k * 8}" stroke="#F2C230" stroke-width="${6 - k}" fill="none" stroke-dasharray="7 3" filter="url(#glow2)"/>`;
  if (acc.chain) o += `<circle cx="0" cy="112" r="14" fill="#F2C230" stroke="#9a7410" stroke-width="2.5"/><text x="0" y="119" font-family="Anton" font-size="19" fill="#7a5a08" text-anchor="middle">$</text>`;
  if (acc.shades > 0) {
    const dy = (acc.shadesDrop ?? 0) * 22;
    o += `<g transform="translate(0 ${f1(dy)})" opacity="${clamp(acc.shades).toFixed(2)}"><path d="M -48 -26 L -6 -26 L -10 -2 Q -28 6 -44 -4 Z M 48 -26 L 6 -26 L 10 -2 Q 28 6 44 -4 Z" fill="#0c0c10"/><path d="M -6 -22 L 6 -22" stroke="#d4a72c" stroke-width="4"/><path d="M -48 -24 L -64 -28 M 48 -24 L 64 -28" stroke="#d4a72c" stroke-width="4"/><path d="M -38 -18 L -24 -20 M 18 -18 L 32 -20" stroke="#fff" stroke-width="3" opacity="0.6"/></g>`;
  }
  return o + '</g>';
}

function sparkles(t, seed, box, n) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), ph = r() * 6.28, sz = 1.5 + r() * 2.5;
    const tw = Math.max(0, Math.sin(t * 5 + ph));
    o += `<path transform="translate(${f1(x)} ${f1(y)}) scale(${(tw * sz).toFixed(2)})" d="M 0 -3 L 0.7 -0.7 L 3 0 L 0.7 0.7 L 0 3 L -0.7 0.7 L -3 0 L -0.7 -0.7 Z" fill="#fff"/>`;
  }
  return o;
}

// ---------- props ----------
function cashBill(x, y, rot, sc, op = 1) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${sc.toFixed(2)})" opacity="${op.toFixed(2)}"><rect x="-30" y="-15" width="60" height="30" rx="3" fill="#8fc98a" stroke="#3f7a3c" stroke-width="2"/><rect x="-24" y="-10" width="48" height="20" rx="2" fill="none" stroke="#3f7a3c" stroke-width="1.2"/><circle r="7" fill="#b9e3b4" stroke="#3f7a3c" stroke-width="1.5"/><text x="0" y="3.5" font-family="Anton" font-size="10" fill="#2f5a2c" text-anchor="middle">$</text></g>`;
}
function luxCar(t, x, y, o2 = {}) {
  const col = o2.col || 'gold', wheelRot = o2.wheelRot ?? 0;
  const body = 'M -330 10 L -334 -20 Q -326 -50 -270 -56 L -150 -66 L -60 -70 L 90 -70 Q 170 -64 250 -50 L 318 -36 Q 342 -28 338 -2 L 334 12 L 262 14 A 62 62 0 0 0 138 14 L -136 14 A 62 62 0 0 0 -260 14 Z';
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${(o2.s ?? 1).toFixed(3)})">`;
  o += `<ellipse cx="0" cy="66" rx="360" ry="20" fill="#000" opacity="0.35" filter="url(#blur10)"/>`;
  if (o2.under) o += o2.under;
  o += `<path d="${body}" fill="url(#car_${col})"/>`;
  o += `<path d="M -320 -26 Q -100 -46 330 -18" stroke="#fff" stroke-width="5" opacity="0.35" fill="none"/>`;
  o += `<path d="M -300 -6 L 320 -2" stroke="url(#chrome)" stroke-width="5"/>`;
  o += `<path d="M -20 -66 L -24 10" stroke="#000" stroke-width="2" opacity="0.25"/>`;
  o += `<path d="M 60 -70 L 120 -128 L 134 -126 L 84 -70 Z" fill="rgba(170,215,255,0.35)" stroke="url(#chrome)" stroke-width="4"/>`;
  o += `<path d="M -250 -66 Q -250 -96 -214 -96 L -190 -96 Q -176 -96 -178 -66 Z M -110 -70 Q -110 -102 -76 -102 L -52 -102 Q -38 -102 -40 -70 Z" fill="#c8915a" opacity="${o2.seats === false ? 0 : 1}"/>`;
  o += `<path d="M 322 -30 L 340 -22 L 338 -10 L 318 -14 Z" fill="#fff8e0" filter="url(#glow2)"/><path d="M -332 -40 L -322 -42 L -322 -26 L -332 -24 Z" fill="#ff4040" filter="url(#glow2)"/>`;
  for (const wx of [-198, 200]) {
    o += `<g transform="translate(${wx} 14)"><circle r="50" fill="#141414"/><circle r="50" fill="none" stroke="#2a2a2a" stroke-width="6"/><circle r="33" fill="url(#rim)"/>`;
    o += `<g transform="rotate(${f1(wheelRot % 360)})">${[0, 60, 120, 180, 240, 300].map((r) => `<path d="M 0 0 L ${f1(31 * Math.cos(r * Math.PI / 180 - 0.12))} ${f1(31 * Math.sin(r * Math.PI / 180 - 0.12))} L ${f1(31 * Math.cos(r * Math.PI / 180 + 0.12))} ${f1(31 * Math.sin(r * Math.PI / 180 + 0.12))} Z" fill="#e6e6e6" stroke="#888" stroke-width="1"/>`).join('')}</g>`;
    o += `<rect x="-22" y="-28" width="12" height="22" rx="4" fill="#d02a2a"/><circle r="7" fill="#999"/></g>`;
  }
  return o + '</g>';
}
function crackedLaptop(x, y, sc, content, glow = 1) {
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})">`;
  o += `<rect x="-90" y="-128" width="180" height="120" rx="8" fill="#3a3d44"/><rect x="-80" y="-120" width="160" height="104" rx="4" fill="#0c1014"/>`;
  if (content) o += `<g opacity="${glow.toFixed(2)}">${content(-80, -120, 160, 104)}</g>`;
  o += `<path d="M -60 -120 L -40 -90 L -55 -70 L -30 -40" stroke="#cfd6de" stroke-width="1.5" fill="none" opacity="0.7"/>`;
  o += `<rect x="40" y="-132" width="44" height="18" rx="2" fill="#a9a9a9" transform="rotate(14 62 -123)"/><rect x="-100" y="-10" width="200" height="14" rx="5" fill="#4a4e56"/>`;
  return o + '</g>';
}
function miniChart(x, y, w, h, kind, t, n = 12) {
  let o = '';
  const sp = (w - 16) / n;
  for (let i = 0; i < n; i++) {
    const up = kind === 'green' ? i % 4 !== 2 : kind === 'red' ? i % 4 === 1 : Math.sin(i * 1.7) > 0;
    const base = kind === 'green' ? y + h - 12 - i * (h - 30) / n : kind === 'red' ? y + 20 + i * (h - 40) / n : y + h / 2 + Math.sin(i * 1.3) * h * 0.2;
    const bh = 10 + (i % 3) * 5, cx = x + 8 + i * sp + sp / 2;
    o += `<line x1="${f1(cx)}" y1="${f1(base - bh - 5)}" x2="${f1(cx)}" y2="${f1(base + 5)}" stroke="${up ? '#2fd07a' : '#ff4a5a'}" stroke-width="1.5"/><rect x="${f1(cx - sp * 0.3)}" y="${f1(base - bh)}" width="${f1(sp * 0.6)}" height="${bh}" fill="${up ? '#2fd07a' : '#ff4a5a'}"/>`;
  }
  return o;
}

// ---------- subtitles: dog translation ----------
const TONE_COL = { sad: '#8fc8ff', snob: '#ff9bd2', angry: '#ff6b5a', happy: '#ffd84a', smug: '#c9a2ff', curious: '#7cf0c8', drama: '#8fc8ff' };
function dogSub(t, subs, y = 1060) {
  const sub = subs.find((x) => t >= x.a && t < x.b);
  if (!sub) return '';
  const pin = prog(t, sub.a, sub.a + 0.2), pout = prog(t, sub.b - 0.15, sub.b), op = ease.out(pin) * (1 - pout);
  const col = TONE_COL[sub.mood] || '#fff';
  const size = Math.min(54, 1200 / Math.max(14, sub.text.length + 2));
  return `<g opacity="${op.toFixed(3)}" transform="translate(360 ${f1(y + lerp(12, 0, ease.out(pin)))})">` +
    `<text x="0" y="-${f1(size + 8)}" font-family="Oswald" font-weight="500" font-style="italic" font-size="30" fill="${col}" text-anchor="middle" stroke="#000" stroke-width="7" paint-order="stroke" letter-spacing="1">[${esc(sub.tone)}]</text>` +
    `<text x="0" y="0" font-family="Oswald" font-weight="700" font-size="${f1(size)}" fill="#fff" text-anchor="middle" stroke="#000" stroke-width="10" stroke-linejoin="round" paint-order="stroke">“${esc(sub.text)}”</text></g>`;
}

function dogDefs() {
  const fur = (id, b) => `<linearGradient id="fur_${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b.dark}"/><stop offset="0.35" stop-color="${b.base}"/><stop offset="0.85" stop-color="${b.base}"/><stop offset="1" stop-color="${b.light}"/></linearGradient>` +
    `<radialGradient id="head_${id}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${b.base}"/><stop offset="0.7" stop-color="${b.base}"/><stop offset="1" stop-color="${b.dark}"/></radialGradient>`;
  return Object.entries(BREEDS).map(([k, b]) => fur(k, b)).join('') + `
  <clipPath id="bodyClip"><path d="${BODY_PATH}"/></clipPath>
  <linearGradient id="gown_red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a7a"/><stop offset="0.5" stop-color="#c8102e"/><stop offset="1" stop-color="#6a0618"/></linearGradient>
  <linearGradient id="gown_gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset="0.5" stop-color="#e2b440"/><stop offset="1" stop-color="#8a6410"/></linearGradient>
  <linearGradient id="car_gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset="0.35" stop-color="#e7b636"/><stop offset="0.7" stop-color="#a87812"/><stop offset="1" stop-color="#5e420a"/></linearGradient>
  <linearGradient id="car_red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a8a"/><stop offset="0.35" stop-color="#d42a2a"/><stop offset="0.7" stop-color="#8a1414"/><stop offset="1" stop-color="#4a0808"/></linearGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#888"/><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#999"/></linearGradient>
  <radialGradient id="rim" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fafafa"/><stop offset="1" stop-color="#777"/></radialGradient>`;
}
