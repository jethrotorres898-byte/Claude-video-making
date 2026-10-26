'use strict';
// "They Laughed In Class": energetic Inkman-style story. Timing comes from
// voice.js; the montage rides a 128 BPM grid that drops on "So I kept going".

const V = window.VOICE;
const L = V.lines;
window.DURATION = V.duration;
const ls = (i) => L[i].s, le = (i) => L[i].e;
const wt = (i, w, which) => wordTime(L, i, w, which);
const rawT = (i, sub) => { const w = L[i].words.find((x) => x.w.toLowerCase().includes(sub)); return w ? w.s : L[i].s; };
const lw = (i, k) => lineWords(L[i])[k];
const CH = buildPunchChunks(L);
const SPK = { nar: PAL.yellow, hero: PAL.yellow, k1: PAL.green, k2: PAL.pink, k3: PAL.cyan, k4: '#C9A7FF', laugh: PAL.red };
function mouthOf(spk, t) {
  for (const l of L) if (l.speaker === spk && t >= l.s && t <= l.e) return clamp(l.mouth[Math.floor((t - l.s) * V.fps)] || 0);
  return 0;
}
const BEAT = 60 / 128, DROP = ls(9);
const phase = (t) => { const x = (t - DROP) / BEAT; return ((x % 1) + 1) % 1; };
const pulse = (t) => Math.exp(-phase(t) * BEAT * 14);
const CUT = { lose: ls(3) - 0.15, quit: ls(6) - 0.2, night: ls(7) - 0.2, grind: DROP - 0.12, class2: ls(14) - 0.15, end: ls(18) - 0.2 };

const HERO = { cap: PAL.orange, shoes: PAL.orange };
const K1 = { hair: 'spiky', phones: PAL.cyan, shoes: PAL.green };
const K2 = { hair: 'ponytail', bow: PAL.pink, shoes: PAL.pink };
const K3 = { hair: 'curly', glasses: true, shoes: PAL.yellow };
const K4 = { hair: 'buns', shoes: PAL.purple };
const K5 = { beanie: PAL.blue, shoes: PAL.blue };
const TJR = { hair: 'tjr', chain: 'silver', shoes: '#eee' };

function cam(F, P, z, body) {
  return `<g transform="translate(${f1(P[0] - z * F[0])} ${f1(P[1] - z * F[1])}) scale(${z.toFixed(4)})">${body}</g>`;
}
function shake(t, t0, dur, amp) {
  if (t < t0 || t > t0 + dur) return [0, 0];
  const k = (1 - prog(t, t0, t0 + dur)) * amp;
  return [Math.sin(t * 97) * k, Math.cos(t * 83) * k];
}

// ---------- classroom ----------
function classroom(t, bright = 0) {
  let o = `<rect x="-200" y="-200" width="1120" height="1680" fill="#FFD976"/>`;
  for (let x = -200; x < 920; x += 90) o += `<rect x="${x}" y="-200" width="45" height="1680" fill="#FFE296"/>`;
  for (const wx of [60, 460]) {
    o += `<rect x="${wx}" y="370" width="200" height="250" rx="10" fill="#8FD8FF" stroke="${INKC}" stroke-width="6"/>`;
    const cx = wx + ((t * 18 + wx) % 260) - 30;
    o += `<g clip-path="url(#win${wx})"><g fill="#fff" stroke="${INKC}" stroke-width="3"><circle cx="${f1(cx)}" cy="440" r="18"/><circle cx="${f1(cx + 22)}" cy="432" r="22"/><circle cx="${f1(cx + 44)}" cy="442" r="16"/></g></g>`;
    o += `<line x1="${wx + 100}" y1="370" x2="${wx + 100}" y2="620" stroke="${INKC}" stroke-width="5"/><line x1="${wx}" y1="495" x2="${wx + 200}" y2="495" stroke="${INKC}" stroke-width="5"/>`;
  }
  const ha = t * 30, ma = t * 360 / 6;
  o += `<g transform="translate(360 470)"><circle r="44" fill="#fff" stroke="${INKC}" stroke-width="6"/><line x1="0" y1="0" x2="${f1(22 * Math.sin(ha * Math.PI / 180))}" y2="${f1(-22 * Math.cos(ha * Math.PI / 180))}" stroke="${INKC}" stroke-width="5" stroke-linecap="round"/><line x1="0" y1="0" x2="${f1(32 * Math.sin(ma * Math.PI / 180))}" y2="${f1(-32 * Math.cos(ma * Math.PI / 180))}" stroke="${PAL.red}" stroke-width="4" stroke-linecap="round"/><circle r="4" fill="${INKC}"/></g>`;
  o += `<rect x="-200" y="880" width="1120" height="600" fill="#F4A95A"/><line x1="-200" y1="880" x2="920" y2="880" stroke="${INKC}" stroke-width="6"/>`;
  if (bright > 0) o += `<rect x="-200" y="-200" width="1120" height="1680" fill="#fff" opacity="${(0.12 * bright).toFixed(2)}"/>`;
  return o + halftone(0.06);
}
function deskF(x, y, s = 1, w = 230) {
  const hw = (w / 2) * s;
  return `<g stroke="${INKC}" stroke-width="${f1(5 * s)}" stroke-linejoin="round"><rect x="${f1(x - hw + 14 * s)}" y="${f1(y + 18 * s)}" width="${f1(2 * hw - 28 * s)}" height="${f1(120 * s)}" fill="#C9813F"/><rect x="${f1(x - hw)}" y="${f1(y)}" width="${f1(2 * hw)}" height="${f1(18 * s)}" rx="${f1(6 * s)}" fill="#E8A35C"/></g>`;
}
function laptopBack(x, y, s = 1) {
  return `<g stroke="${INKC}" stroke-width="${f1(5 * s)}"><rect x="${f1(x - 66 * s)}" y="${f1(y - 92 * s)}" width="${f1(132 * s)}" height="${f1(90 * s)}" rx="${f1(8 * s)}" fill="#D9DEE6"/><circle cx="${x}" cy="${f1(y - 47 * s)}" r="${f1(11 * s)}" fill="${PAL.orange}" stroke-width="${f1(3 * s)}"/><rect x="${f1(x - 74 * s)}" y="${f1(y - 4 * s)}" width="${f1(148 * s)}" height="${f1(8 * s)}" rx="3" fill="#BFC6D1"/></g>`;
}
function popCard(x, y, w, h, t0, t, body) {
  if (t < t0) return '';
  const p = ease.back(prog(t, t0, t0 + 0.3));
  return `<g transform="translate(${x} ${y}) scale(${p.toFixed(3)})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="#fff" stroke="${INKC}" stroke-width="6"/>${body}</g>`;
}
function miniLine(pts, col, w = 6) {
  return `<path d="M ${pts.map((q) => f1(q[0]) + ' ' + f1(q[1])).join(' L ')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// seated classmate behind a desk
function seated(style, x, deskY, s, o2, t) {
  const y = deskY + 30 * s + (o2.dy || 0);
  const m = inkman({ ...style, x, y, s, hideLegs: true, hA: o2.hA || [x - 40 * s, deskY - 6], hB: o2.hB || [x + 40 * s, deskY - 6], ...o2 }, t);
  return m.svg;
}
function kidPose(t, x, deskY, s, mode, k, target) {
  // mode: idle | laugh | point | beg | amazed
  const shakeY = mode === 'laugh' || mode === 'point' ? -Math.abs(Math.sin(t * 17 + k)) * 7 * s : 0;
  const o = { dy: shakeY, lean: 0, tilt: 0 };
  if (mode === 'laugh') { o.tilt = Math.sin(t * 9 + k) * 8; o.hA = [x - 16 * s, deskY - 34 * s]; o.hB = [x + 16 * s, deskY - 34 * s]; o.face = IFACE.laugh; }
  if (mode === 'point') {
    const dir = Math.sign(target[0] - x) || 1;
    o.lean = 8 * dir; o.tilt = Math.sin(t * 9 + k) * 6;
    const reach = [x + dir * 115 * s, deskY - 110 * s];
    if (dir > 0) { o.hB = reach; o.gloveB = 'point'; o.hA = [x - 16 * s, deskY - 34 * s]; } else { o.hA = reach; o.gloveA = 'point'; o.hB = [x + 16 * s, deskY - 34 * s]; }
    o.face = IFACE.laugh;
  }
  if (mode === 'beg') { const hop = Math.abs(Math.sin(t * 7 + k)) * 6 * s; o.dy = -hop; o.hA = [x - 4 * s, deskY - 70 * s]; o.hB = [x + 4 * s, deskY - 70 * s]; o.face = IFACE.begging; o.lean = Math.sign(target[0] - x) * 10; }
  if (mode === 'amazed') { o.face = IFACE.amazed; o.lean = Math.sign(target[0] - x) * 12; o.hA = [x - 50 * s, deskY - 110 * s]; o.hB = [x + 50 * s, deskY - 110 * s]; }
  return o;
}

// ---------- scene 1: laughed at in class ----------
const FRONT = 1060, BACK = 840;
function sceneClass1(t) {
  const tLaugh = wt(0, 'laughed');
  const k1Talk = mouthOf('k1', t);
  const big = t >= ls(2) - 0.05;
  let o = classroom(t);
  const heroHead = [360, 918];
  const kids = [[K5, 150, BACK, 0.72, 1], [K3, 360, BACK, 0.72, 2], [K4, 570, BACK, 0.72, 3]];
  for (const [st, x, dy, s, k] of kids) {
    const mode = t < tLaugh ? 'idle' : big ? (k === 2 ? 'point' : 'laugh') : 'laugh';
    const po = kidPose(t, x, dy, s, mode, k, heroHead);
    if (t < tLaugh) po.face = IFACE.bored;
    if (!big && t >= tLaugh) po.face = IFACE.happy;
    o += seated(st, x, dy, s, { ...po, blink: blink(t, k) }, t) + deskF(x, dy, s);
  }
  // front row
  const k1mode = t < tLaugh ? 'idle' : 'point';
  const p1 = kidPose(t, 120, FRONT, 1, k1mode, 7, heroHead);
  if (t >= ls(1) - 0.05 && t < ls(2)) { p1.face = IFACE.smug; p1.talk = k1Talk; p1.lean = 14; p1.dy = 0; }
  if (t < tLaugh) p1.face = IFACE.bored;
  o += seated(K1, 120, FRONT, 1, { ...p1, blink: blink(t, 4) }, t) + deskF(120, FRONT, 1, 200);
  const p2 = kidPose(t, 600, FRONT, 1, t < tLaugh ? 'idle' : 'laugh', 8, heroHead);
  if (t < tLaugh) p2.face = IFACE.bored;
  o += seated(K2, 600, FRONT, 1, { ...p2, blink: blink(t, 6) }, t) + deskF(600, FRONT, 1, 200);
  // hero
  const face = ifaces(t, [[0, 'sad'], [tLaugh, 'annoyed'], [ls(2), 'worried']]);
  const shrink = big ? -0.07 : 0;
  const typing = Math.sin(t * 22) * 4;
  o += seated(HERO, 360, FRONT, 1, { face: { ...face, ly: Math.max(face.ly, 0.5) }, sq: shrink, hA: [330, FRONT - 20 + typing], hB: [390, FRONT - 20 - typing], blink: blink(t, 0.3) }, t);
  o += laptopBack(360, FRONT) + deskF(360, FRONT, 1, 230);
  o += popCard(360, 630, 250, 110, 0.4, t, `${text(-100, -18, 'MY TRADES', { size: 22, fill: INKC, anchor: 'start', family: 'Anton', weight: 400 })}${text(104, -18, '-$420', { size: 26, fill: PAL.red, anchor: 'end', family: 'Anton', weight: 400 })}${miniLine([[-100, 0], [-60, 10], [-30, 4], [10, 26], [50, 18], [100, 40]], PAL.red)}`);
  o += haSprites(t, tLaugh, ls(2) + 1.3, 11, [60, 560, 660, 1000]);
  // camera
  const z = track(t, [[0, 1.2], [tLaugh, 1.26], [ls(1), 1.38], [ls(2) - 0.05, 1.38], [ls(2) + 0.1, 1.22]]);
  const F = mix([360, 900], [240, 900], prog(t, ls(1) - 0.2, ls(1) + 0.2) * (1 - prog(t, ls(2) - 0.1, ls(2) + 0.1)));
  const [sx, sy] = big ? [Math.sin(t * 40) * 4, Math.cos(t * 33) * 4] : [0, 0];
  return cam(F, [360 + sx, 900 + sy], z + 0.02 * Math.abs(Math.sin(t * 8.5)) * (big ? 1 : 0), o);
}

// ---------- scene 2: trading under the desk ----------
function sceneLose(t) {
  let o = burst(360, 600, '#E3263A', '#FF4A5C', t, 16, 12) + halftone(0.08);
  const ev = lineWords(L[4]).map((w) => w.s);
  const t50 = rawT(5, '50'), t100 = rawT(5, '100'), tEv = rawT(5, 'everything');
  const hits = [...ev, t50, t100, tEv];
  let sh = [0, 0];
  for (const h of hits) { const s2 = shake(t, h, 0.3, 12); sh = [sh[0] + s2[0], sh[1] + s2[1]]; }
  const bal = track(t, [[CUT.lose, 1000], [ev[0], 1000], [ev[0] + 0.15, 820], [ev[1], 820], [ev[1] + 0.15, 610], [ev[2], 610], [ev[2] + 0.15, 430], [t50, 430], [t50 + 0.15, 380], [t100, 380], [t100 + 0.15, 280], [tEv, 280], [tEv + 0.3, 0]]);
  const face = ifaces(t, [[CUT.lose, 'worried'], [ev[0], 'shocked'], [ls(5), 'worried'], [tEv, 'sad']]);
  const s = 2, hip = [360, 940];
  const shakeHands = Math.sin(t * 30) * 3;
  const m = inkman({ ...HERO, x: hip[0], y: hip[1], s, hideLegs: true, face: { ...face, ly: 0.6, tear: t > tEv ? 1 : 0 }, hA: [244, 950 + shakeHands], hB: [476, 950 - shakeHands], blink: blink(t, 0.2) }, t);
  o += m.svg;
  // phone
  const P = { x: 360, y: 935, w: 250, h: 420 };
  o += `<rect x="${P.x - P.w / 2}" y="${P.y - P.h / 2}" width="${P.w}" height="${P.h}" rx="34" fill="${INKC}"/>`;
  const sx0 = P.x - P.w / 2 + 14, sy0 = P.y - P.h / 2 + 16, sw = P.w - 28, shh = P.h - 32;
  o += `<rect x="${sx0}" y="${sy0}" width="${sw}" height="${shh}" rx="22" fill="#fff"/>`;
  o += text(P.x, sy0 + 42, 'BALANCE', { size: 22, fill: '#777', family: 'Anton', weight: 400, ls: 2 });
  o += text(P.x, sy0 + 98, money(bal), { size: 56, fill: bal < 1000 ? PAL.red : INKC, family: 'Anton', weight: 400 });
  const prog01 = 1 - bal / 1000;
  const pts = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([sx0 + 16 + u * (sw - 32), sy0 + 150 + u * prog01 * 170 + Math.sin(i * 1.7) * 10]); }
  o += miniLine(pts, PAL.red, 7);
  o += gloveSVG(m.hA, null, 1.25) + gloveSVG(m.hB, null, 1.25);
  o += `<rect x="-200" y="1140" width="1120" height="200" fill="#E8A35C" stroke="${INKC}" stroke-width="6"/><rect x="-200" y="1158" width="1120" height="200" fill="#C9813F" stroke="${INKC}" stroke-width="6"/>`;
  // stamps and slams
  [[130, 600, -12], [590, 600, 10], [590, 860, -8]].forEach(([x, y, r], i) => { o += slam(t, ev[i], x, y, '✗', { size: 120, fill: PAL.yellow, rot: r }); });
  o += slam(t, t50, 150, 470, '-$50', { size: 80, fill: '#fff', rot: -10 });
  o += slam(t, t100, 570, 520, '-$100', { size: 96, fill: '#fff', rot: 8 });
  o += slam(t, tEv, 360, 1230, '-$EVERYTHING', { size: 88, fill: PAL.yellow, rot: -4, from: 3.2 });
  const z = 1 + 0.03 * prog(t, CUT.lose, CUT.quit) + (t > tEv ? 0.05 * ease.out(prog(t, tEv, tEv + 0.3)) : 0);
  return cam([360, 760], [360 + sh[0], 760 + sh[1]], z, o);
}

// ---------- scene 3: almost quit ----------
function sceneQuit(t) {
  let o = `<rect x="-200" y="-200" width="1120" height="1680" fill="#4B566C"/>` + halftone(0.12);
  const s = 1.5, deskY = 1040;
  const m = inkman({ ...HERO, x: 360, y: deskY + 60, s, hideLegs: true, sq: -0.12, tilt: Math.sin(t * 1.5) * 3, face: { ...IFACE.sad, eo: 0.25, ly: 0.8 }, hA: [300, deskY - 10], hB: [420, deskY - 10] }, t);
  o += m.svg + deskF(360, deskY, 1.5, 300);
  // rain cloud
  const cy = 560 + Math.sin(t * 2) * 6;
  for (let i = 0; i < 16; i++) {
    const x = 250 + ((i * 47) % 220), ph = ((t * 2.6 + i * 0.37) % 1);
    o += `<line x1="${x}" y1="${f1(cy + 40 + ph * 220)}" x2="${x - 4}" y2="${f1(cy + 62 + ph * 220)}" stroke="#7CC8FF" stroke-width="5" stroke-linecap="round" opacity="${f1(1 - ph * 0.6)}"/>`;
  }
  o += `<g fill="#9AA3B5" stroke="${INKC}" stroke-width="6"><circle cx="300" cy="${f1(cy)}" r="48"/><circle cx="360" cy="${f1(cy - 26)}" r="62"/><circle cx="430" cy="${f1(cy)}" r="50"/><rect x="290" y="${f1(cy)}" width="150" height="46" rx="20" stroke="none"/></g>`;
  o += `<line x1="270" y1="${f1(cy + 46)}" x2="460" y2="${f1(cy + 46)}" stroke="${INKC}" stroke-width="6" stroke-linecap="round"/>`;
  const z = 1 + 0.08 * ease.inOut(prog(t, CUT.quit, CUT.night));
  return cam([360, 820], [360, 820], z, o);
}

// ---------- scene 4: 2 AM, TJR's video ----------
function bedroom(t) {
  let o = `<rect x="-200" y="-200" width="1120" height="1680" fill="${PAL.navy}"/>`;
  o += `<rect x="440" y="370" width="210" height="230" rx="10" fill="#0B0F26" stroke="${INKC}" stroke-width="6"/><circle cx="560" cy="440" r="34" fill="#FFF3C4" filter="url(#glow)"/>`;
  const r = rng(4);
  for (let i = 0; i < 10; i++) o += `<circle cx="${f1(450 + r() * 190)}" cy="${f1(380 + r() * 210)}" r="2.5" fill="#fff" opacity="${(0.4 + 0.5 * Math.sin(t * 3 + i)).toFixed(2)}"/>`;
  o += `<line x1="545" y1="370" x2="545" y2="600" stroke="${INKC}" stroke-width="5"/>`;
  o += `<rect x="110" y="760" width="500" height="260" rx="20" fill="#5A3A8A" stroke="${INKC}" stroke-width="6"/>`;
  o += `<rect x="20" y="990" width="110" height="200" rx="10" fill="#3D2A63" stroke="${INKC}" stroke-width="6"/><rect x="28" y="934" width="96" height="54" rx="8" fill="#111" stroke="${INKC}" stroke-width="5"/>`;
  o += text(76, 972, '2:00 AM', { size: 26, fill: '#FF4040', family: 'Anton', weight: 400, filter: 'glow2' });
  return o + halftone(0.08);
}
function tjrVideo(t, x, y, w, h) {
  let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2A1450"/>`;
  o += burst(x + w / 2, y + h * 0.55, '#2A1450', '#3A1F6E', t, 14, 20).replace('<rect x="-200" y="-200" width="1120" height="1680"', `<rect x="${x}" y="${y}" width="${w}" height="${h}"`);
  const s = 1.25, hip = [x + w / 2, y + 600];
  const pump = Math.sin(t * Math.PI * 2 / (BEAT * 2));
  const m = inkman({ ...TJR, x: hip[0], y: hip[1], s, fA: [hip[0] - 30 * s, hip[1] + 136 * s], fB: [hip[0] + 30 * s, hip[1] + 136 * s], lean: pump * 3, face: IFACE.determined, hA: [hip[0] - 120, hip[1] - 150 - Math.max(0, pump) * 120], hB: [hip[0] + 120, hip[1] - 150 - Math.max(0, -pump) * 120], gloveA: 'fist', gloveB: 'fist', blink: blink(t, 1.7) }, t);
  o += m.svg;
  const kp = 1 + 0.06 * pulse(t);
  o += `<g transform="translate(${x + w / 2} ${y + 880}) scale(${kp.toFixed(3)})"><text font-family="Anton" font-size="92" fill="${PAL.yellow}" text-anchor="middle" stroke="${INKC}" stroke-width="14" paint-order="stroke">KEEP GOING</text></g>`;
  o += `<rect x="${x}" y="${y}" width="${w}" height="70" fill="rgba(0,0,0,0.55)"/>` + text(x + 24, y + 47, 'TJR | MOTIVATION', { size: 30, anchor: 'start', family: 'Anton', weight: 400 });
  o += `<rect x="${x + 20}" y="${y + h - 40}" width="${w - 40}" height="8" rx="4" fill="#555"/><rect x="${x + 20}" y="${y + h - 40}" width="${f1((w - 40) * (0.2 + 0.5 * prog(t, wt(7, 'tjr'), ls(8) + 1)))}" height="8" rx="4" fill="#FF2D2D"/>`;
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.8 + i / 6) % 1;
    o += `<path transform="translate(${f1(x + w - 60 + Math.sin(ph * 9 + i) * 14)} ${f1(y + h - 80 - ph * 300)}) scale(${f1(1.2 - ph * 0.5)})" d="M 0 8 C -14 -2 -10 -14 0 -6 C 10 -14 14 -2 0 8 Z" fill="${PAL.pink}" stroke="${INKC}" stroke-width="2.5" opacity="${f1(1 - ph)}"/>`;
  }
  return o;
}
function sceneNight(t) {
  const tT = wt(7, 'tjr') - 0.1, tHit = wt(8, 'hit');
  if (t < tHit) {
    let o = bedroom(t);
    const s = 1.25, hip = [360, 1060];
    const glowOn = 1;
    const m = inkman({ ...HERO, x: hip[0], y: hip[1], s, hideLegs: true, lean: 4, face: { ...IFACE.bored, ly: 0.7, eo: t > tT - 0.3 ? 0.9 : 0.5 }, hA: [334, 960], hB: [386, 960], blink: blink(t, 0.6) }, t);
    o += `<ellipse cx="360" cy="880" rx="190" ry="190" fill="url(#phoneglow)" opacity="${glowOn}"/>`;
    o += m.svg;
    o += `<rect x="326" y="900" width="68" height="112" rx="12" fill="${INKC}"/><rect x="332" y="908" width="56" height="94" rx="8" fill="#7fdcff"/>`;
    o += gloveSVG(m.hA) + gloveSVG(m.hB);
    o += `<rect x="90" y="1040" width="540" height="240" rx="26" fill="#3B6FD8" stroke="${INKC}" stroke-width="6"/><path d="M 140 1100 Q 250 1080 360 1110 Q 470 1140 580 1100" fill="none" stroke="${INKC}" stroke-width="4" opacity="0.5"/>`;
    // phone grows to full screen for TJR's video
    const g = ease.inOut3(prog(t, tT, tT + 0.35));
    if (g > 0) {
      const W = 600, Hh = 1060, cx = lerp(360, 360, g), cy = lerp(955, 680, g), sc = lerp(0.11, 1, g);
      o += `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${sc.toFixed(4)}) translate(${-W / 2} ${-Hh / 2})"><rect width="${W}" height="${Hh}" rx="60" fill="${INKC}"/><g clip-path="url(#bigscreen)">${tjrVideo(t, 20, 20, W - 40, Hh - 40)}</g></g>`;
    }
    return o;
  }
  // impact: it hit different
  let o = burst(360, 640, PAL.orange, PAL.yellow, t, 20, 40) + halftone(0.1) + animeLines(360, 640, t, '#fff', 36, 0.8);
  const [sx, sy] = shake(t, tHit, 0.6, 16);
  const s = 2.1, hip = [360, 1080];
  const m = inkman({ ...HERO, x: hip[0], y: hip[1], s, hideLegs: true, face: IFACE.fire, hA: [250, 980], hB: [470, 980], gloveA: 'fist', gloveB: 'fist', blink: 1 }, t);
  o += m.svg;
  const z = 1.0 + 0.12 * ease.out(prog(t, tHit, DROP));
  let out = cam([360, 700], [360 + sx, 700 + sy], z, o);
  if (t < tHit + 0.08) out += `<rect width="720" height="1280" fill="#fff"/>`;
  else if (t < tHit + 0.2) out += `<rect width="720" height="1280" fill="#fff" opacity="${(1 - prog(t, tHit + 0.08, tHit + 0.2)).toFixed(2)}"/>`;
  return out;
}

// ---------- scene 5: the grind montage ----------
const FLOOR = 1160;
function standHero(t, x, s, o2) {
  const hipY = FLOOR - (IB.th + IB.sh) * s + 8 + (o2.dy || 0);
  return inkman({ ...HERO, x, y: hipY, s, fA: o2.fA || [x - 26 * s, FLOOR + (o2.footLift || 0)], fB: o2.fB || [x + 26 * s, FLOOR + (o2.footLift || 0)], ...o2 }, t);
}
function card(cx, cy, w, h, body, rot = 0, sc = 1) {
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc.toFixed(3)})"><rect x="${-w / 2 + 8}" y="${-h / 2 + 10}" width="${w}" height="${h}" rx="22" fill="${INKC}"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="22" fill="#fff" stroke="${INKC}" stroke-width="6"/>${body}</g>`;
}
function candleRow(n, x0, y0, sp, hFn, colFn) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const [top, bot] = hFn(i), col = colFn(i), x = x0 + i * sp;
    o += `<line x1="${x}" y1="${f1(top - 12)}" x2="${x}" y2="${f1(bot + 12)}" stroke="${INKC}" stroke-width="4"/><rect x="${x - 11}" y="${f1(top)}" width="22" height="${f1(Math.max(6, bot - top))}" rx="3" fill="${col}" stroke="${INKC}" stroke-width="4"/>`;
  }
  return o;
}
function sceneGrind(t) {
  const w11 = lineWords(L[11]);
  const tS = wt(10, 'studied') - 0.08, tP = wt(10, 'practiced') - 0.08, tK = wt(10, 'kept') - 0.08;
  const tW1 = w11[0].s - 0.08, tW2 = w11[3].s - 0.08, tW4 = w11[6].s - 0.08, tG = ls(12) - 0.06, tA = ls(13) - 0.08;
  const beatZ = 1 + 0.035 * pulse(t);
  let o = '', F = [360, 760];
  if (t < tS) {
    // "So I kept going": landing + fist pump
    o += burst(360, 700, PAL.orange, '#FF9A3D', t, 18, 30) + halftone(0.1) + animeLines(360, 700, t, '#fff', 26, 0.5);
    const land = prog(t, DROP - 0.12, DROP + 0.04);
    const dy = -(1 - ease.in(land)) * 700;
    const sq = t > DROP && t < DROP + 0.25 ? -0.18 * Math.sin(prog(t, DROP, DROP + 0.25) * Math.PI) : 0;
    const pumpT = wt(9, 'going');
    const pump = ease.back(prog(t, pumpT - 0.1, pumpT + 0.15));
    const s = 1.45;
    const m = standHero(t, 360, s, { dy, sq, face: IFACE.fire, hA: [300, 900], hB: mix([420, 900], [540, 560], pump), gloveB: 'fist', gloveA: 'fist' });
    o += `<ellipse cx="360" cy="${FLOOR + 6}" rx="${f1(120 + 80 * prog(t, DROP, DROP + 0.3))}" ry="16" fill="#000" opacity="0.18"/>` + m.svg;
    if (t > DROP && t < DROP + 0.4) { const u = prog(t, DROP, DROP + 0.4); for (const d of [-1, 1]) o += `<circle cx="${f1(360 + d * (90 + u * 120))}" cy="${FLOOR - 10}" r="${f1(26 * (1 - u))}" fill="#fff" stroke="${INKC}" stroke-width="4" opacity="${f1(1 - u)}"/>`; }
  } else if (t < tP) {
    // studying his guides
    o += burst(360, 640, PAL.blue, '#5B9BFF', t, 16, 25) + halftone(0.1);
    const r = rng(21);
    for (let i = 0; i < 6; i++) {
      const ph = ((t - tS) * 1.4 + i / 6) % 1, x = 100 + r() * 520, col = [PAL.pink, PAL.yellow, PAL.green, PAL.orange, PAL.cyan, '#fff'][i];
      o += `<g transform="translate(${f1(x)} ${f1(1000 - ph * 700)}) rotate(${f1(ph * 360 * (i % 2 ? 1 : -1))})"><rect x="-34" y="-24" width="68" height="48" rx="6" fill="${col}" stroke="${INKC}" stroke-width="5"/><line x1="0" y1="-24" x2="0" y2="24" stroke="${INKC}" stroke-width="4"/></g>`;
    }
    o += card(500, 520, 260, 190, `<rect x="-118" y="-83" width="236" height="140" rx="10" fill="#2A1450"/>${inkman({ ...TJR, x: -40, y: 40, s: 0.55, hideLegs: true, face: IFACE.happy, hA: [-90, 10], hB: [30, -40], gloveB: 'point' }, t).svg}<rect x="-118" y="62" width="236" height="10" rx="5" fill="#ddd"/><rect x="-118" y="62" width="${f1(236 * prog(t, tS, tP))}" height="10" rx="5" fill="${PAL.red}"/>`, 4);
    const wr = Math.sin(t * 30) * 8;
    o += inkman({ ...HERO, x: 300, y: 1090, s: 1.35, hideLegs: true, face: IFACE.determined, hA: [250 + wr, 1010], hB: [350 - wr, 1010], blink: 1 }, t).svg;
    o += deskF(300, 1020, 1.35, 300);
    o += `<rect x="190" y="992" width="80" height="28" rx="4" fill="${PAL.yellow}" stroke="${INKC}" stroke-width="4"/><rect x="196" y="968" width="70" height="26" rx="4" fill="${PAL.pink}" stroke="${INKC}" stroke-width="4"/>`;
  } else if (t < tK) {
    // practicing every day
    o += burst(360, 640, PAL.purple, '#A47BFF', t, 16, 25) + halftone(0.1);
    const n = 3 + Math.floor((t - tP) / 0.12);
    o += card(360, 515, 560, 270, candleRow(Math.min(n, 16), -240, 0, 32, (i) => { const base = Math.sin(i * 1.3) * 40 - i * 4; return [base - 30 - (i % 3) * 8, base + 20]; }, (i) => (i % 3 === 1 ? PAL.red : PAL.green)), -3);
    const day = 1 + Math.floor((t - tP) / 0.09);
    o += card(130, 380, 180, 90, text(0, 18, `DAY ${day}`, { size: 50, fill: INKC, family: 'Anton', weight: 400 }), -8);
    const tap = Math.floor((t - tP) / (BEAT / 2)) % 2;
    o += inkman({ ...HERO, x: 360, y: 1130, s: 1.35, hideLegs: true, face: IFACE.determined, hA: tap ? [270, 1010] : [300, 1040], hB: tap ? [420, 1040] : [450, 1010], blink: 1 }, t).svg;
    o += `<rect x="150" y="1040" width="420" height="300" fill="#2d2d2d" stroke="${INKC}" stroke-width="6"/>` + button3D(270, 1080, 'BUY', PAL.green, tap) + button3D(450, 1080, 'SELL', PAL.red, !tap);
  } else if (t < tW1) {
    // kept my losses small
    o += burst(360, 640, PAL.teal, '#2DD4BF', t, 16, 25) + halftone(0.1);
    o += card(360, 515, 520, 270, `${candleRow(6, -200, -10, 48, (i) => (i === 4 ? [-10, 14] : [-60 - i * 18, -10 - i * 10]), (i) => (i === 4 ? PAL.red : PAL.green))}<line x1="-230" y1="26" x2="230" y2="26" stroke="${PAL.red}" stroke-width="5" stroke-dasharray="14 10"/>${text(170, 62, 'STOP -1%', { size: 34, fill: PAL.red, family: 'Anton', weight: 400 })}`, 3);
    o += slam(t, wt(10, 'small') - 0.05, 470, 420, '✓', { size: 150, fill: PAL.green, rot: 10 });
    const nod = Math.abs(Math.sin(t * 9)) * 6;
    o += standHero(t, 360, 1.35, { face: IFACE.smug, tilt: nod, hA: [290, 980], hB: [460, 890], gloveB: 'thumb' }).svg;
  } else if (t < tG) {
    // week 1 / 2 / 4
    const wk = t < tW2 ? 1 : t < tW4 ? 2 : 4;
    const bg = wk === 1 ? ['#E3263A', '#FF4A5C'] : wk === 2 ? [PAL.orange, '#FF9A3D'] : ['#1E1E2E', '#2A2A40'];
    o += burst(360, 640, bg[0], bg[1], t, 16, wk === 4 ? 6 : 25) + halftone(0.1);
    const t0 = wk === 1 ? tW1 : wk === 2 ? tW2 : tW4;
    const line = wk === 1 ? [[-200, -40], [-120, -10], [-40, 10], [40, 0], [120, 30], [200, 60]] : wk === 2 ? [[-200, 30], [-120, 10], [-40, 20], [40, 0], [120, -6], [200, -14]] : [[-200, 20], [-120, 0], [-40, 10], [40, -10]];
    const pc = ease.back(prog(t, t0, t0 + 0.2));
    o += card(360, 515, 440, 250, `${text(0, -50, `WEEK ${wk}`, { size: 76, fill: INKC, family: 'Anton', weight: 400 })}${miniLine(line.map(([x, y]) => [x, y * 0.8 + 45]), wk === 1 ? PAL.red : wk === 2 ? PAL.orange : '#888', 9)}${wk === 4 ? text(150, 80, '?', { size: 90, fill: INKC, family: 'Anton', weight: 400 }) : ''}`, wk === 2 ? 3 : -3, pc);
    const face = wk === 1 ? IFACE.annoyed : wk === 2 ? IFACE.determined : { ...IFACE.worried, eo: 1.2 };
    const m = standHero(t, 360, 1.35, { face, hA: [290, 960], hB: [430, 960], gloveA: 'fist', gloveB: 'fist', tilt: wk === 4 ? Math.sin(t * 40) * 1.5 : 0 });
    o += m.svg;
    if (wk === 4) F = [360, 760 - 120 * prog(t, tW4, tG)];
  } else if (t < tA) {
    // GREEN!
    o += burst(360, 640, PAL.green, '#4ADE80', t, 20, 50) + halftone(0.1) + animeLines(360, 640, t, '#fff', 30, 0.7);
    const j = Math.abs(Math.sin((t - tG) * Math.PI / (BEAT * 1.2)));
    const m = standHero(t, 360, 1.45, { dy: -j * 110, sq: 0.08 * j, face: IFACE.joy, hA: [230, 560], hB: [490, 560], footLift: -j * 100 });
    o += m.svg + inkConfetti(t, tG, 5);
    if (t < tG + 0.1) o += `<rect x="-200" y="-200" width="1120" height="1680" fill="#fff" opacity="${(1 - prog(t, tG, tG + 0.1)).toFixed(2)}"/>`;
  } else {
    // green again, and again
    o += burst(360, 640, PAL.green, '#4ADE80', t, 18, 30) + halftone(0.1);
    const ag = lineWords(L[13]).filter((w) => /again/i.test(w.w)).map((w) => w.s);
    const grow = ag.reduce((a, s) => a + ease.out(prog(t, s, s + 0.3)) * 4, 4);
    const pv = 1200 + 1900 * ag.reduce((a, s) => a + ease.out(prog(t, s, s + 0.3)), 0);
    o += card(360, 515, 560, 270, text(0, -62, '+' + money(pv), { size: 64, fill: PAL.green, family: 'Anton', weight: 400 }) + candleRow(Math.floor(grow), -250, 105, 30, (i) => [12 - i * 5 - 18, 12 - i * 5 + 6], () => PAL.green), -2);
    const b = pulse(t), sideA = Math.floor((t - DROP) / BEAT) % 2;
    const m = standHero(t, 360, 1.35, { dy: -b * 26, sq: -0.06 * b, face: IFACE.joy, hA: sideA ? [250, 760] : [300, 980], hB: sideA ? [420, 980] : [470, 760], lean: sideA ? -6 : 6 });
    o += m.svg;
  }
  return cam(F, [360, 760], beatZ, o);
}
function button3D(x, y, label, col, down) {
  const d = down ? 8 : 0;
  return `<rect x="${x - 70}" y="${y - 30 + 10}" width="140" height="60" rx="14" fill="${shade(col, 0.6)}" stroke="${INKC}" stroke-width="5"/><rect x="${x - 70}" y="${y - 30 + d}" width="140" height="60" rx="14" fill="${col}" stroke="${INKC}" stroke-width="5"/>${text(x, y + 13 + d, label, { size: 36, fill: '#fff', family: 'Anton', weight: 400 })}`;
}

// ---------- scene 6: the class asks for help ----------
function sceneClass2(t) {
  let o = classroom(t, 1);
  const heroHead = [360, 918];
  const t2 = ls(15), t3 = ls(16), t4 = ls(17);
  const crowd = ease.inOut(prog(t, t2 - 0.3, t4 + 0.5));
  const kids = [[K5, 150, BACK, 0.72, 1, null], [K3, 360, BACK, 0.72, 2, 'k3'], [K4, 570, BACK, 0.72, 3, 'k4']];
  for (const [st, x0, dy, s, k, spk] of kids) {
    const x = lerp(x0, x0 + (360 - x0) * 0.25, crowd);
    const talking = spk && mouthOf(spk, t) > 0;
    const mode = t < wt(14, 'laughed') ? 'amazed' : talking || (spk && t > ls(spk === 'k3' ? 16 : 17)) ? 'beg' : 'amazed';
    const po = kidPose(t, x, dy, s, mode, k, heroHead);
    if (spk) po.talk = mouthOf(spk, t);
    o += seated(st, x, dy, s, { ...po, blink: blink(t, k) }, t) + deskF(x0, dy, s);
  }
  const p1 = kidPose(t, 120, FRONT, 1, t > wt(14, 'laughed') ? 'beg' : 'amazed', 7, heroHead);
  if (t > wt(14, 'laughed')) p1.face = { ...IFACE.begging, sw: 1 };
  o += seated(K1, lerp(120, 150, crowd), FRONT, 1, { ...p1, blink: blink(t, 4) }, t) + deskF(120, FRONT, 1, 200);
  const p2 = kidPose(t, 600, FRONT, 1, t > t2 - 0.1 ? 'beg' : 'amazed', 8, heroHead);
  p2.talk = mouthOf('k2', t);
  if (p2.talk > 0) { p2.face = IFACE.begging; p2.lean = -16; }
  o += seated(K2, lerp(600, 570, crowd), FRONT, 1, { ...p2, blink: blink(t, 6) }, t) + deskF(600, FRONT, 1, 200);
  // hero, chilling
  const lean = Math.sin(t * 2) * 2;
  o += seated(HERO, 360, FRONT, 1, { face: IFACE.smug, shades: 1, chain: 'gold', lean, hA: [300, 840], hB: [420, 840], blink: 1 }, t);
  o += laptopBack(360, FRONT) + deskF(360, FRONT, 1, 230);
  o += popCard(360, 630, 250, 110, CUT.class2 + 0.3, t, `${text(-100, -18, 'MY TRADES', { size: 22, fill: INKC, anchor: 'start', family: 'Anton', weight: 400 })}${text(104, -18, '+$6,900', { size: 26, fill: PAL.green, anchor: 'end', family: 'Anton', weight: 400 })}${miniLine([[-100, 40], [-60, 30], [-30, 34], [10, 12], [50, 18], [100, -6]], PAL.green)}`);
  // "?" bubbles over whoever is asking
  for (const [spk, x, y] of [['k2', 560, 860], ['k3', 360, 600], ['k4', 540, 620]]) {
    const on = L.find((l) => l.speaker === spk);
    if (t > on.s && t < on.e + 0.4) {
      const p = ease.back(prog(t, on.s, on.s + 0.2));
      o += `<g transform="translate(${x + 60} ${y - 40}) scale(${p.toFixed(3)})"><circle r="30" fill="#fff" stroke="${INKC}" stroke-width="5"/>${text(0, 16, '?', { size: 46, fill: SPK[spk], family: 'Anton', weight: 400 })}</g>`;
    }
  }
  const z = 1.22 + 0.08 * crowd + 0.02 * pulse(t);
  return cam([360, 880], [360, 900], z, o);
}

// ---------- scene 7: funny how that works ----------
function sceneEnd(t) {
  let o = burst(360, 640, PAL.orange, '#FF9A3D', t, 18, 15) + halftone(0.1);
  const tWorks = wt(18, 'works'), tKeep = ls(19), tCom = wt(19, 'coming');
  const talk = mouthOf('hero', t);
  const drop = ease.inOut(prog(t, ls(18), ls(18) + 0.3));
  const shrug = bump(t, ls(18) + 0.1, le(18) + 0.2);
  const point = ease.out(prog(t, tKeep - 0.1, tKeep + 0.2)) * (1 - ease.out(prog(t, tCom - 0.25, tCom)));
  const thumb = ease.back(prog(t, tCom - 0.2, tCom + 0.1));
  const face = ifaces(t, [[CUT.end, 'smug'], [tWorks, 'wink'], [le(18), 'smug'], [tKeep, 'determined'], [tCom, 'happy']]);
  const s = 2.1, hip = [360, 1080];
  let hA = mix([250, 1010], [150, 820], shrug), hB = mix([470, 1010], [570, 820], shrug);
  hB = mix(hB, [440, 980], point);
  hB = mix(hB, [490, 760], thumb);
  const m = inkman({ ...HERO, x: hip[0], y: hip[1] + Math.sin(t * 6) * 3, s, hideLegs: true, chain: 'gold', shades: 1, shadesDrop: drop, face, talk, hA, hB, gloveB: thumb > 0.5 ? 'thumb' : point > 0.3 ? 'point' : null, gloveScaleB: 1 + point * 1.3 + thumb * 0.5, blink: blink(t, 0.4) }, t);
  o += m.svg;
  const disc = prog(t, le(19) - 0.3, le(19) + 0.2);
  if (disc > 0) o += text(360, 1240, 'Fictional story · Not financial advice', { size: 22, fill: INKC, weight: 500, op: disc.toFixed(2) });
  return cam([360, 760], [360, 760], 1 + 0.03 * pulse(t), o);
}

// ---------- compose ----------
const DEFS = `<defs>${DEFS_COMMON}${INK_DEFS}
  <clipPath id="win60"><rect x="60" y="370" width="200" height="250" rx="10"/></clipPath>
  <clipPath id="win460"><rect x="460" y="370" width="200" height="250" rx="10"/></clipPath>
  <clipPath id="bigscreen"><rect x="20" y="20" width="560" height="1020" rx="44"/></clipPath>
</defs>`;
const SCENES = [[0, CUT.lose, sceneClass1], [CUT.lose, CUT.quit, sceneLose], [CUT.quit, CUT.night, sceneQuit], [CUT.night, CUT.grind, sceneNight], [CUT.grind, CUT.class2, sceneGrind], [CUT.class2, CUT.end, sceneClass2], [CUT.end, Infinity, sceneEnd]];
const WIPES = [[CUT.lose, PAL.red], [CUT.night, PAL.navy], [CUT.class2, PAL.yellow], [CUT.end, PAL.orange]];
const sceneAt = (t) => { for (const [a, b, fn] of SCENES) if (t >= a && t < b) return fn(t); return ''; };

const stage = document.getElementById('stage');
stage.innerHTML = DEFS + '<g id="frame"></g>';
const frameEl = document.getElementById('frame');

window.renderFrame = function (t) {
  let o = sceneAt(t);
  for (const [c, col] of WIPES) {
    if (Math.abs(t - c) < 0.2) {
      const u = ease.inOut(prog(t, c - 0.2, c + 0.2)), X = lerp(900, -2300, u);
      o += `<polygon points="${f1(X)},-100 ${f1(X + 1600)},-100 ${f1(X + 1200)},1380 ${f1(X - 400)},1380" fill="${col}" stroke="${INKC}" stroke-width="10"/>`;
    }
  }
  if (Math.abs(t - CUT.grind) < 0.06) o += `<rect width="720" height="1280" fill="#fff"/>`;
  if (Math.abs(t - CUT.quit) < 0.25) o += `<rect width="720" height="1280" fill="#000" opacity="${(1 - Math.abs(t - CUT.quit) / 0.25).toFixed(2)}"/>`;
  o += punchCaption(t, CH, (spk) => SPK[spk] || PAL.yellow, 290);
  const dip = Math.max(t < 0.2 ? 1 - t / 0.2 : 0, prog(t, window.DURATION - 0.4, window.DURATION - 0.05));
  if (dip > 0) o += `<rect width="720" height="1280" fill="#000" opacity="${clamp(dip).toFixed(3)}"/>`;
  frameEl.innerHTML = o;
};
