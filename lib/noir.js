'use strict';
// "Neon Noir": cinematic silhouette style. Characters are solid shadow figures
// with neon rim light; faces show only when a light hits them. Comes with
// parallax cityscapes, rain, bokeh, holographic UI, light rays, film grain,
// letterbox and subtitle captions. Uses lib/stickkit.js helpers.

const NOIR = '#07080d', NOIR2 = '#141724';
const NEON = { cyan: '#22E1FF', mag: '#FF2FD6', purple: '#8B3DFF', gold: '#FFC94A', red: '#FF3355', green: '#2BFF88', white: '#EAF2FF' };
const NB = { torso: 150, R: 56, ua: 88, fa: 86, th: 96, sh: 94, lw: 22, tw: 46 };

function noirLimb(pts, w, col) {
  const d = 'M' + pts.map((q) => f1(q[0]) + ' ' + f1(q[1])).join(' L');
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// p: x,y hip (world), s, flip, lean, tilt, hN/hF hands, fN/fF feet (world), hideLegs,
// rim ('cyan'|'mag'|'gold'|'white'|'purple'), lit (0..1), litCol ('cyan'|'gold'|'mag'|'white'),
// face (stickkit FACE schema), talk, blink, hair ('hero'|'tjr'), cap, apron, blazer, shades,
// chain, watch.
function noirman(p, t = 0) {
  const s = p.s ?? 1, f = p.flip ?? 1, lean = p.lean ?? 0, tilt = p.tilt ?? 0;
  const L = (q) => [(q[0] - p.x) / (f * s), (q[1] - p.y) / s];
  const Wd = (q) => [p.x + q[0] * f * s, p.y + q[1] * s];
  const ta = ((180 - lean) * Math.PI) / 180;
  const tv = [Math.sin(ta), Math.cos(ta)];
  const neck = [tv[0] * NB.torso, tv[1] * NB.torso];
  const sh = [tv[0] * NB.torso * 0.84, tv[1] * NB.torso * 0.84];
  const ha = ((180 - lean - tilt) * Math.PI) / 180;
  const head = [neck[0] + Math.sin(ha) * NB.R * 0.8, neck[1] + Math.cos(ha) * NB.R * 0.8];
  const [eN, hN] = ik(sh, L(p.hN), NB.ua, NB.fa, p.bN ?? 1);
  const [eF, hF] = ik(sh, L(p.hF), NB.ua, NB.fa, p.bF ?? 1);
  let o = `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">`;
  o += noirLimb([sh, eF, hF], NB.lw, NOIR2);
  if (!p.hideLegs) {
    const [kN, aN] = ik([4, 0], L(p.fN), NB.th, NB.sh, -1);
    const [kF, aF] = ik([-4, 0], L(p.fF), NB.th, NB.sh, -1);
    o += noirLimb([[-4, 0], kF, aF, [aF[0] + 24, aF[1] + 2]], NB.lw, NOIR2);
    o += noirLimb([[4, 0], kN, aN, [aN[0] + 24, aN[1] + 2]], NB.lw, NOIR);
  }
  const top = [tv[0] * NB.torso * 0.82, tv[1] * NB.torso * 0.82];
  if (p.blazer) {
    o += `<path d="M -26 6 L ${f1(top[0] - 30)} ${f1(top[1] + 4)} Q ${f1(top[0])} ${f1(top[1] - 14)} ${f1(top[0] + 30)} ${f1(top[1] + 4)} L 28 6 Z" fill="${NOIR}"/>`;
    o += `<path d="M ${f1(top[0] - 4)} ${f1(top[1] + 2)} L ${f1(top[0] * 0.5 + 6)} ${f1(top[1] * 0.45)} L ${f1(top[0] + 18)} ${f1(top[1] + 6)}" fill="none" stroke="${NEON.gold}" stroke-width="2.5" opacity="0.7"/>`;
  } else {
    o += noirLimb([[0, 0], top], NB.tw, NOIR);
  }
  if (p.apron) o += `<path d="M -16 -6 L ${f1(top[0] * 0.55 - 14)} ${f1(top[1] * 0.55)} L ${f1(top[0] * 0.55 + 18)} ${f1(top[1] * 0.55)} L 24 -6 L 22 40 L -14 40 Z" fill="#12303A" stroke="${NEON.cyan}" stroke-width="2" stroke-opacity="0.5"/>`;
  if (p.chain) {
    const [nx, ny] = neck;
    o += `<path d="M ${nx - 20} ${ny + 6} Q ${nx + 8} ${ny + 48} ${nx + 24} ${ny + 8}" fill="none" stroke="${NEON.gold}" stroke-width="5" stroke-dasharray="5 3" filter="url(#glow2)"/>`;
  }
  // head
  o += `<g transform="translate(${f1(head[0])} ${f1(head[1])}) rotate(${f1(lean + tilt)})">`;
  const R = NB.R;
  if (p.hair === 'tjr') o += `<path d="M ${0.7 * R} ${-0.5 * R} Q ${1.02 * R} ${-0.8 * R} ${0.8 * R} ${-1.12 * R} Q ${0.64 * R} ${-1.44 * R} ${0.28 * R} ${-1.41 * R} Q ${0.04 * R} ${-1.6 * R} ${-0.26 * R} ${-1.43 * R} Q ${-0.64 * R} ${-1.42 * R} ${-0.84 * R} ${-1.12 * R} Q ${-1.2 * R} ${-0.86 * R} ${-1.11 * R} ${-0.48 * R} Q ${-1.17 * R} ${-0.12 * R} ${-0.98 * R} ${0.13 * R} L 0 0 Z" fill="${NOIR}"/>`;
  if (p.hair === 'hero') o += `<path d="M ${0.75 * R} ${-0.55 * R} Q ${0.9 * R} ${-1.05 * R} ${0.3 * R} ${-1.12 * R} L ${0.45 * R} ${-1.3 * R} L ${0.0} ${-1.14 * R} L ${-0.2 * R} ${-1.28 * R} L ${-0.4 * R} ${-1.08 * R} Q ${-1.05 * R} ${-0.9 * R} ${-1.0 * R} ${-0.2 * R} L 0 0 Z" fill="${NOIR}"/>`;
  o += `<circle r="${R}" fill="${NOIR}"/>`;
  if (p.hair === 'tjr') o += `<path d="M ${0.55 * R} ${0.62 * R} Q ${0.42 * R} ${1.18 * R} ${0.1 * R} ${1.08 * R} Q ${0.25 * R} ${0.9 * R} ${0.3 * R} ${0.7 * R} Z" fill="${NOIR}"/>`;
  const lit = clamp(p.lit ?? 0);
  if (lit > 0) {
    const e = { ...(p.face || FACE.neutral) };
    if (p.talk) { e.mo = Math.max(e.mo, p.talk * 0.17); e.mw = lerp(e.mw, 0.14, clamp(p.talk)); }
    o += `<g opacity="${lit.toFixed(3)}"><circle r="${R}" fill="url(#lit_${p.litCol || 'cyan'})"/>`;
    const lx = e.lx * R, ly = e.ly * R, sw = R * 0.055;
    const eyes = [[0.08 * R + lx, -0.08 * R + ly], [0.52 * R + lx, -0.08 * R + ly]];
    const eo = e.eo * (p.blink ?? 1);
    const hideEyes = (p.shades ?? 0) > 0.5;
    eyes.forEach((q, i) => {
      if (!hideEyes) {
        if (e.hp > 0.5) o += `<path d="M ${f1(q[0] - 7)} ${f1(q[1] + 2)} Q ${f1(q[0])} ${f1(q[1] - 7)} ${f1(q[0] + 7)} ${f1(q[1] + 2)}" stroke="${NOIR}" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round"/>`;
        else o += `<ellipse cx="${f1(q[0])}" cy="${f1(q[1])}" rx="${f1(0.075 * R)}" ry="${f1(Math.max(0.012 * R, 0.11 * R * eo))}" fill="${NOIR}"/>`;
      }
      const by = q[1] - 0.24 * R - e.bY * R, a = i ? -e.bA : e.bA;
      o += `<line x1="${f1(q[0] - 0.12 * R)}" y1="${f1(by)}" x2="${f1(q[0] + 0.12 * R)}" y2="${f1(by)}" transform="rotate(${f1(a)} ${f1(q[0])} ${f1(by)})" stroke="${NOIR}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
    });
    const mx = 0.32 * R + lx * 0.7, my = 0.42 * R + ly * 0.5, w = e.mw * R, cv = e.mc * R, op = e.mo * R;
    if (op > 0.6) o += `<path d="M ${f1(mx - w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv)} ${f1(mx + w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv + 2.4 * op)} ${f1(mx - w)} ${f1(my)} Z" fill="${NOIR}"/>`;
    else o += `<path d="M ${f1(mx - w)} ${f1(my)} Q ${f1(mx)} ${f1(my + 2 * cv)} ${f1(mx + w)} ${f1(my)}" fill="none" stroke="${NOIR}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
    o += '</g>';
  }
  if (p.cap) o += `<path d="M ${-0.95 * R} ${-0.32 * R} Q ${-0.9 * R} ${-1.12 * R} ${0.1 * R} ${-1.08 * R} Q ${0.85 * R} ${-1.0 * R} ${0.9 * R} ${-0.42 * R} L ${1.55 * R} ${-0.36 * R} Q ${1.5 * R} ${-0.22 * R} ${0.85 * R} ${-0.24 * R} Z" fill="${NOIR}"/><path d="M ${-0.6 * R} ${-0.62 * R} L ${0.5 * R} ${-0.58 * R}" stroke="${p.cap}" stroke-width="5" opacity="0.8"/>`;
  if ((p.shades ?? 0) > 0) o += `<g opacity="${clamp(p.shades).toFixed(2)}"><rect x="${0.02 * R}" y="${-0.2 * R}" width="${0.66 * R}" height="${0.26 * R}" rx="${0.1 * R}" fill="#000"/><line x1="${0.08 * R}" y1="${-0.12 * R}" x2="${0.3 * R}" y2="${-0.14 * R}" stroke="#fff" stroke-width="3" opacity="0.85" stroke-linecap="round"/><line x1="0" y1="${-0.1 * R}" x2="${-0.6 * R}" y2="${-0.14 * R}" stroke="#000" stroke-width="5"/></g>`;
  o += '</g>';
  o += noirLimb([sh, eN, hN], NB.lw, NOIR);
  if (p.watch) {
    const dx = hN[0] - eN[0], dy = hN[1] - eN[1], d = Math.hypot(dx, dy) || 1;
    const wx = hN[0] - (dx / d) * 16, wy = hN[1] - (dy / d) * 16;
    o += `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="10" fill="${NEON.gold}" filter="url(#glow2)"/><circle cx="${f1(wx)}" cy="${f1(wy)}" r="5" fill="#fff6d8"/>`;
  }
  o += '</g>';
  const svg = p.rim ? `<g filter="url(#rim_${p.rim})">${o}</g>` : o;
  return { svg, head: Wd(head), hN: Wd(hN), hF: Wd(hF), neck: Wd(neck) };
}
const nSitFeet = (hip, s) => ({ fN: [hip[0] + 108 * s, hip[1] + 108 * s], fF: [hip[0] + 94 * s, hip[1] + 110 * s] });

// ---------- environments ----------
function skyline(seed, k, d, base, h0, h1, fill, winCol, winP = 0.25) {
  const r = rng(seed); const list = []; let x = 0;
  while (x < 1600) {
    const w = 60 + r() * 120, h = h0 + r() * (h1 - h0), wins = [];
    for (let yy = 20; yy < h - 20; yy += 24) for (let xx = 10; xx < w - 12; xx += 18) if (r() < winP) wins.push([xx, yy, r()]);
    list.push({ x, w, h, wins, ant: r() < 0.25 }); x += w + 4;
  }
  const W = x, off = ((d * k) % W + W) % W;
  let o = '';
  for (const rep of [0, 1]) for (const b of list) {
    const bx = b.x - off + rep * W - 100;
    if (bx > 820 || bx + b.w < -100) continue;
    o += `<rect x="${f1(bx)}" y="${f1(base - b.h)}" width="${f1(b.w)}" height="${f1(b.h + 400)}" fill="${fill}"/>`;
    if (b.ant) o += `<line x1="${f1(bx + b.w / 2)}" y1="${f1(base - b.h)}" x2="${f1(bx + b.w / 2)}" y2="${f1(base - b.h - 40)}" stroke="${fill}" stroke-width="4"/><circle cx="${f1(bx + b.w / 2)}" cy="${f1(base - b.h - 42)}" r="3" fill="${NEON.red}"/>`;
    for (const [wx, wy, c] of b.wins) o += `<rect x="${f1(bx + wx)}" y="${f1(base - b.h + wy)}" width="7" height="11" fill="${c < 0.15 ? NEON.mag : c < 0.3 ? NEON.cyan : winCol}" opacity="${(0.35 + c * 0.5).toFixed(2)}"/>`;
  }
  return o;
}
function rain(t, op = 0.35, n = 60, seed = 2, slant = 0.18) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const x0 = r() * 900 - 90, sp = 1400 + r() * 700, ph = r(), len = 30 + r() * 40;
    const y = ((t * sp + ph * 1600) % 1600) - 160;
    const x = x0 - y * slant;
    o += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - len * slant)}" y2="${f1(y + len)}" stroke="#bfe9ff" stroke-width="2" opacity="${op}"/>`;
  }
  return o;
}
function bokeh(t, seed = 4, n = 18, area = [0, 0, 720, 1280], cols = [NEON.mag, NEON.cyan, NEON.gold, NEON.purple]) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * (area[2] - area[0]) + Math.sin(t * 0.3 + i) * 12, y = area[1] + r() * (area[3] - area[1]) + Math.cos(t * 0.25 + i) * 8;
    const rad = 14 + r() * 40, c = cols[i % cols.length];
    o += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rad)}" fill="${c}" opacity="${(0.12 + r() * 0.2).toFixed(2)}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rad)}" fill="none" stroke="${c}" stroke-width="2" opacity="0.25"/>`;
  }
  return o;
}
function rays(cx, cy, col, t, n = 9, op = 0.18, spread = 1.2, len = 1500) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + (i - (n - 1) / 2) * (spread / n) + Math.sin(t * 0.6 + i) * 0.03, w = 0.035 + (i % 3) * 0.012;
    o += `<path d="M ${cx} ${cy} L ${f1(cx + len * Math.cos(a - w))} ${f1(cy + len * Math.sin(a - w))} L ${f1(cx + len * Math.cos(a + w))} ${f1(cy + len * Math.sin(a + w))} Z" fill="${col}" opacity="${(op * (0.6 + 0.4 * Math.sin(t * 2 + i * 1.7))).toFixed(3)}"/>`;
  }
  return o;
}
function neonText(x, y, str, col, size, o2 = {}) {
  const flick = o2.flicker ? (Math.sin(o2.t * 53) > 0.92 ? 0.35 : 1) : 1;
  return `<g opacity="${((o2.op ?? 1) * flick).toFixed(3)}"><text x="${f1(x)}" y="${f1(y)}" font-family="${o2.family || 'Anton'}" font-size="${size}" fill="none" stroke="${col}" stroke-width="${o2.sw ?? 3}" text-anchor="${o2.anchor || 'middle'}" letter-spacing="${o2.ls ?? 2}" filter="url(#neon)">${esc(str)}</text><text x="${f1(x)}" y="${f1(y)}" font-family="${o2.family || 'Anton'}" font-size="${size}" fill="none" stroke="#fff" stroke-width="1.2" text-anchor="${o2.anchor || 'middle'}" letter-spacing="${o2.ls ?? 2}" opacity="0.9">${esc(str)}</text></g>`;
}
function holoPanel(x, y, w, h, col, body, op = 1) {
  return `<g opacity="${op.toFixed(3)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="rgba(10,20,40,0.55)" stroke="${col}" stroke-width="2.5" filter="url(#glow2)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="url(#holoLines)" opacity="0.25"/>${body}</g>`;
}
function particles(t, seed, n, col, area, rise = 30, size = 3) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * (area[2] - area[0]), ph = r(), y = area[3] - (((t * rise / (area[3] - area[1])) + ph) % 1) * (area[3] - area[1]);
    o += `<circle cx="${f1(x + Math.sin(t + i) * 10)}" cy="${f1(y)}" r="${f1(size * (0.5 + r()))}" fill="${col}" opacity="${(0.25 + 0.5 * Math.abs(Math.sin(t * 2 + i))).toFixed(2)}"/>`;
  }
  return o;
}

// ---------- finishing: grade, grain, letterbox ----------
function finish(t, o2 = {}) {
  const bar = o2.bar ?? 120;
  const gx = Math.floor(rng(Math.floor(t * 24))() * 256), gy = Math.floor(rng(Math.floor(t * 24) + 99)() * 256);
  return `<rect width="720" height="1280" fill="url(#vignette)"/>` +
    `<rect x="${-gx}" y="${-gy}" width="1100" height="1600" fill="url(#grain)" opacity="${o2.grain ?? 0.16}" style="mix-blend-mode:overlay"/>` +
    `<rect width="720" height="${bar}" fill="#000"/><rect y="${1280 - bar}" width="720" height="${bar}" fill="#000"/>`;
}

// ---------- cinematic subtitles ----------
function buildSubChunks(lines) {
  const chunks = [];
  lines.forEach((line, li) => {
    const ws = lineWords(line);
    let cur = [];
    const flush = () => { if (cur.length) chunks.push({ li, spk: line.speaker, words: cur }); cur = []; };
    ws.forEach((w) => { cur.push(w); if (/[.!?…]$/.test(w.w) || (/,$/.test(w.w) && cur.length >= 3) || cur.length >= 5) flush(); });
    flush();
  });
  chunks.forEach((c, i) => {
    const next = chunks[i + 1], line = lines[c.li];
    c.a = c.words[0].s - 0.1;
    c.b = next ? (next.li === c.li ? next.words[0].s - 0.1 : Math.min(line.e + 0.45, next.words[0].s - 0.12)) : line.e + 1.2;
  });
  return chunks;
}
function subtitle(t, chunks, o2 = {}) {
  const y = o2.y ?? 1060;
  const c = chunks.find((c) => t >= c.a && t < c.b);
  if (!c) return '';
  const pin = prog(t, c.a, c.a + 0.25), pout = prog(t, c.b - 0.15, c.b);
  const op = ease.out(pin) * (1 - pout);
  const hero = c.spk === 'hero';
  const words = c.words.map((w) => w.w.toUpperCase());
  const size = Math.min(50, 1100 / Math.max(10, words.join(' ').length + 2));
  let spans = hero ? `<tspan fill="${NEON.cyan}">“</tspan>` : '';
  c.words.forEach((w, i) => {
    const said = t >= w.s - 0.05;
    const key = o2.gold && o2.gold.test(words[i]);
    const col = key ? NEON.gold : hero ? NEON.cyan : '#fff';
    spans += `<tspan fill="${col}" fill-opacity="${said ? 1 : 0.38}">${esc(words[i])}${i < words.length - 1 ? ' ' : ''}</tspan>`;
  });
  if (hero) spans += `<tspan fill="${NEON.cyan}">”</tspan>`;
  return `<g opacity="${op.toFixed(3)}" transform="translate(0 ${f1(lerp(14, 0, ease.out(pin)))})"><text x="360" y="${y}" font-family="Oswald" font-weight="700" font-size="${f1(size)}" letter-spacing="${f1(lerp(9, 3, ease.out(pin)))}" text-anchor="middle" stroke="#000" stroke-width="8" stroke-linejoin="round" paint-order="stroke" filter="url(#softglow)">${spans}</text></g>`;
}

function noirDefs(grainHref) {
  const lit = (id, col) => `<radialGradient id="lit_${id}" cx="75%" cy="70%" r="85%"><stop offset="0" stop-color="${col}" stop-opacity="0.95"/><stop offset="0.55" stop-color="${col}" stop-opacity="0.5"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
  const rim = (id, col, r = 3, b = 4) => `<filter id="rim_${id}" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${col}"/><feComposite in2="d" operator="in" result="c"/><feGaussianBlur in="c" stdDeviation="${b}" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  return `
  ${lit('cyan', '#9FE9FF')}${lit('gold', '#FFD98A')}${lit('mag', '#FF9BEA')}${lit('white', '#F2F6FF')}
  ${rim('cyan', NEON.cyan)}${rim('mag', NEON.mag)}${rim('gold', NEON.gold)}${rim('white', '#cfe0ff', 2, 3)}${rim('purple', NEON.purple)}
  <filter id="neon" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="softglow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="blur10" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
  <pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${grainHref}" width="256" height="256"/></pattern>
  <pattern id="holoLines" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="#7fe8ff"/></pattern>`;
}
