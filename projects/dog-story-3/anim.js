'use strict';
// "Rags to Riches 3: Brodie". Fired in the rain, meets TJR at a bus stop, two years of
// lessons, then comes back for the store. Timing comes from timeline.js; TJR's lip sync
// from voice.js.

const TL = window.TL, C = TL.cuts, VO = window.VOICE;
window.DURATION = TL.duration;
const jaw = (who, t) => jawFrom(TL, who, t);
function tjrMouth(t) {
  for (const l of VO.lines) if (t >= l.s && t < l.e) return clamp((l.mouth[Math.floor((t - l.s) * VO.fps)] ?? 0) * 1.15);
  return 0;
}
const UNI = { col: '#d8342a', dark: '#a8241c', trim: '#ffd23a', tag: 'BRODIE' };
const MGR = { col: '#f2f2ee', dark: '#cfcfc8', trim: '#d8d8d0', collar: '#ffffff', tag: 'MANAGER', tie: '#c8283a', logo: false };
const TRAINEE = { col: '#d8342a', dark: '#a8241c', trim: '#ffd23a', tag: 'TRAINEE' };
const RICH = { chain: true, shades: 1, collar: true, watch: true };
const gradeW = (col, op) => `<rect x="-600" y="-600" width="2600" height="2600" fill="${col}" opacity="${op}" style="mix-blend-mode:multiply"/>`;
const toScreen = (F, P, z, q) => [P[0] + z * (q[0] - F[0]), P[1] + z * (q[1] - F[1])];
const crown = (x, y, sc, col = '#ffd23a') => `<path transform="translate(${f1(x)} ${f1(y)}) scale(${sc})" d="M -24 14 L -27 -12 L -12 0 L 0 -20 L 12 0 L 27 -12 L 24 14 Z" fill="${col}"/>`;

// ---------- props ----------
function kibbleBag(x, y, sc, col = '#e8a23a', rot = 0, o2 = {}) {
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${sc.toFixed(3)})">`;
  o += `<path d="M -34 -72 L 34 -72 L 39 0 Q 0 6 -39 0 Z" fill="${col}"/><path d="M -34 -72 L 34 -72 L 34.6 -63 L -34.6 -63 Z" fill="#000" opacity="0.22"/>`;
  o += `<path d="M -38 -6 Q 0 0 38 -6 L 39 0 Q 0 6 -39 0 Z" fill="#000" opacity="0.15"/><path d="M -26 -60 L -28 -8" stroke="#fff" stroke-width="5" opacity="0.18"/>`;
  o += `<circle cx="0" cy="-40" r="16" fill="#fff"/>${crown(0, -41, 0.42, '#d8342a')}`;
  o += `<text x="0" y="-11" font-family="Anton" font-size="${o2.label && o2.label.length > 8 ? 9 : 13}" fill="#fff" text-anchor="middle">${esc(o2.label || 'KIBBLE')}</text>`;
  if (o2.bite) o += `<path d="M 14 -72 Q 16 -62 24 -64 Q 24 -56 32 -56 Q 32 -50 38 -48 L 36 -72 Z" fill="#3a2410"/><circle cx="22" cy="-60" r="2.5" fill="#8a5a2a"/><circle cx="30" cy="-54" r="2.5" fill="#8a5a2a"/>`;
  return o + '</g>';
}
function bowl(x, y, rot, sc, inverted = false) {
  const shape = inverted ? 'M -30 -26 L 30 -26 L 40 0 L -40 0 Z' : 'M -40 -26 L 40 -26 L 30 0 L -30 0 Z';
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${sc.toFixed(3)})"><path d="${shape}" fill="#2a7ad8"/><ellipse cx="0" cy="${inverted ? 0 : -26}" rx="40" ry="7" fill="${inverted ? '#1a5ab0' : '#5aa0f0'}"/><text x="0" y="-8" font-family="Anton" font-size="12" fill="#fff" text-anchor="middle">BRODIE</text></g>`;
}
function visorProp(x, y, rot, sc) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${sc.toFixed(3)})">${visorSVG('#d8342a')}</g>`;
}
function kibbles(x, y, n, seed, spread = 30) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) o += `<ellipse cx="${f1(x + (r() - 0.5) * spread)}" cy="${f1(y + (r() - 0.5) * spread * 0.4)}" rx="4" ry="3" fill="${r() < 0.5 ? '#8a5a2a' : '#a8743a'}"/>`;
  return o;
}
function splashRing(x, y, t, t0, sc = 1) {
  if (t < t0 || t > t0 + 0.9) return '';
  const u = prog(t, t0, t0 + 0.9), r = rng(5); let o = `<ellipse cx="${x}" cy="${y}" rx="${f1(60 + 160 * u)}" ry="${f1(10 + 24 * u)}" fill="none" stroke="#cfe6ff" stroke-width="${f1(4 * (1 - u))}" opacity="${f1(1 - u)}"/>`;
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI * (0.1 + 0.8 * r()), v = 300 + r() * 380, lt = t - t0;
    const px = x + Math.cos(a) * v * lt * sc * 1.4, py = y + Math.sin(a) * v * lt * sc + 1100 * lt * lt;
    if (py > y + 10) continue;
    o += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(3 + r() * 5)}" fill="#bfe2ff" opacity="${f1(1 - u)}"/>`;
  }
  return o;
}
function speechBubble(x, y, sc, inner, tailDir = 1) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})"><path d="M -52 -38 Q -60 -38 -60 -28 L -60 18 Q -60 28 -50 28 L ${tailDir * 8} 28 L ${tailDir * 22} 48 L ${tailDir * 22} 28 L 50 28 Q 60 28 60 18 L 60 -28 Q 60 -38 50 -38 Z" fill="#fff" stroke="#222" stroke-width="3"/>${inner}</g>`;
}
const ICONS = [
  '<path d="M -30 10 L -10 -6 L 6 4 L 30 -20" stroke="#2fd07a" stroke-width="6" fill="none"/><path d="M 30 -20 L 18 -20 M 30 -20 L 30 -8" stroke="#2fd07a" stroke-width="6"/>',
  '<rect x="-24" y="-14" width="10" height="26" fill="#2fd07a"/><line x1="-19" y1="-22" x2="-19" y2="20" stroke="#2fd07a" stroke-width="2"/><rect x="-4" y="-6" width="10" height="20" fill="#ff4a5a"/><line x1="1" y1="-14" x2="1" y2="22" stroke="#ff4a5a" stroke-width="2"/><rect x="16" y="-20" width="10" height="24" fill="#2fd07a"/><line x1="21" y1="-26" x2="21" y2="10" stroke="#2fd07a" stroke-width="2"/>',
  '<text x="0" y="14" font-family="Anton" font-size="40" fill="#222" text-anchor="middle">?!</text>',
  '<text x="0" y="12" font-family="Anton" font-size="30" fill="#2a5ad8" text-anchor="middle">1%</text>',
  '<text x="0" y="12" font-family="Anton" font-size="26" fill="#222" text-anchor="middle">R:R</text>',
  '<path d="M -26 -14 L 26 -14 M -26 0 L 26 0 M -26 14 L 10 14" stroke="#555" stroke-width="5"/>',
];

// ---------- sets ----------
function skyline(t, seed, day = 0) {
  let o = '';
  const r = rng(seed);
  for (let i = 0; i < 12; i++) {
    const x = i * 110 - 60, h = 280 + r() * 340;
    o += `<rect x="${x}" y="${1050 - h}" width="104" height="${h}" fill="${day ? '#9fb4c8' : '#0f1120'}"/>`;
    for (let k = 0; k < 12; k++) if (r() < 0.35) o += `<rect x="${f1(x + 12 + (k % 3) * 28)}" y="${f1(1050 - h + 24 + Math.floor(k / 3) * 44)}" width="14" height="20" fill="${day ? '#d8e8f4' : '#ffcf7a'}" opacity="0.5"/>`;
  }
  return `<g filter="url(#blur3)">${o}</g>`;
}
// Kibble King storefront. Returns the parts behind and in front of whoever stands in the doorway.
function storefront(t, o2 = {}) {
  const day = o2.day ?? 0, lights = o2.lights ?? 1;
  let o = `<rect x="-200" y="-300" width="1120" height="1700" fill="url(#${day ? 'daySky' : 'nightSky'})"/>`;
  o += bricks(150, 1000, day ? [178, 120, 96] : [96, 70, 76]);
  const flick = day ? 1 : rng(Math.floor(t * 9))() < 0.08 ? 0.35 : 1;
  o += `<rect x="70" y="180" width="580" height="120" rx="16" fill="#c8202a" stroke="#ffd23a" stroke-width="6"/>`;
  o += `<g opacity="${flick}"${day ? '' : ' filter="url(#glow)"'}>${text(392, 262, 'KIBBLE KING', { size: 72, fill: '#ffd23a', family: 'Anton', weight: 400, ls: 3 })}${crown(122, 240, 1.15)}</g>`;
  for (let i = 0; i < 15; i++) o += `<path d="M ${-30 + i * 52} 320 L ${22 + i * 52} 320 L ${22 + i * 52} 372 Q ${-4 + i * 52} 390 ${-30 + i * 52} 372 Z" fill="${i % 2 ? '#f4efe6' : '#c8283a'}"/>`;
  // shop window: shelves of kibble
  let win = `<rect x="40" y="430" width="370" height="460" fill="${day ? '#f6e6c8' : 'url(#warmWin)'}"/>`;
  const cols = ['#e8a23a', '#d8342a', '#3a8ad8', '#3aa860', '#e8a23a', '#9a5ad8'];
  for (let row = 0; row < 3; row++) {
    const sy = 560 + row * 130;
    win += `<rect x="40" y="${sy}" width="370" height="10" fill="#8a5a2a"/>`;
    for (let k = 0; k < 6; k++) win += kibbleBag(80 + k * 58, sy, 0.62, cols[(k + row * 2) % 6]);
  }
  o += `<g filter="url(#blur3)" opacity="${f1(0.55 + 0.45 * lights)}">${win}</g>`;
  if ((o2.hiring ?? 0) > 0) o += `<g transform="translate(300 500) scale(${f1(o2.hiring)}) rotate(4)"><rect x="-70" y="-34" width="140" height="68" fill="#fffdf4" stroke="#999" stroke-width="2"/>${text(0, -4, 'NOW', { size: 24, fill: '#c8202a', family: 'Anton', weight: 400 })}${text(0, 24, 'HIRING', { size: 24, fill: '#c8202a', family: 'Anton', weight: 400 })}</g>`;
  o += `<path d="M 60 450 L 170 450 L 60 640 Z" fill="#fff" opacity="0.08"/><rect x="40" y="430" width="370" height="460" fill="none" stroke="#1e2028" stroke-width="16"/>`;
  // doorway
  let inside = `<rect x="450" y="440" width="190" height="560" fill="${day ? '#fff2d6' : '#ffe2b0'}"/><rect x="450" y="900" width="190" height="100" fill="#d8c8a8"/><path d="M 450 900 L 640 900" stroke="#b8a888" stroke-width="3"/>`;
  for (let row = 0; row < 3; row++) { const sy = 600 + row * 110; inside += `<rect x="560" y="${sy}" width="80" height="8" fill="#a8783a"/>`; for (let k = 0; k < 2; k++) inside += kibbleBag(584 + k * 40, sy, 0.42, cols[(k + row) % 6]); }
  inside += `<ellipse cx="545" cy="460" rx="60" ry="10" fill="#fff" opacity="0.8" filter="url(#blur3)"/>`;
  o += `<g opacity="${f1(0.55 + 0.45 * lights)}">${inside}</g>`;
  const open = o2.door ?? 0;
  let front = '';
  if (open > 0 && !day) front += `<polygon points="450,1000 640,1000 ${f1(700 + 80 * open)},1090 ${f1(330 - 100 * open)},1090" fill="#ffd99a" opacity="${f1(0.22 * open)}"/>`;
  const sx = 1 - open * 0.86;
  front += `<g transform="translate(640 0) scale(${sx.toFixed(3)} 1) translate(-640 0)"><rect x="450" y="440" width="190" height="560" fill="#2a3a52" opacity="0.72"/><rect x="450" y="440" width="190" height="560" fill="none" stroke="#1e2028" stroke-width="12"/><path d="M 470 470 L 520 470 L 470 560 Z" fill="#fff" opacity="0.15"/><rect x="466" y="700" width="10" height="70" rx="4" fill="#c9d1d9"/>`;
  const fl = Math.cos(Math.PI * clamp(o2.closed ?? 0));
  front += `<line x1="520" y1="500" x2="545" y2="530" stroke="#888" stroke-width="2"/><line x1="570" y1="500" x2="545" y2="530" stroke="#888" stroke-width="2"/><g transform="translate(545 562) scale(1 ${f1(Math.max(0.04, Math.abs(fl)))})"><rect x="-56" y="-26" width="112" height="52" rx="6" fill="${fl >= 0 ? '#2fae5a' : '#c8202a'}" stroke="#fff" stroke-width="3"/>${text(0, 12, fl >= 0 ? 'OPEN' : 'CLOSED', { size: 30, fill: '#fff', family: 'Anton', weight: 400 })}</g></g>`;
  front += `<rect x="444" y="434" width="202" height="572" fill="none" stroke="#14161c" stroke-width="10"/>`;
  // sidewalk + street
  front += `<rect x="-200" y="1000" width="1120" height="90" fill="${day ? '#bdb6aa' : '#3e4048'}"/><rect x="-200" y="1000" width="1120" height="8" fill="${day ? '#d6d0c4' : '#555862'}"/><rect x="-200" y="1090" width="1120" height="400" fill="${day ? '#5c5e66' : '#1d1e24'}"/><rect x="-200" y="1086" width="1120" height="10" fill="${day ? '#e6e0d4' : '#6a6c74'}"/>`;
  if (!day) front += `<ellipse cx="230" cy="1052" rx="150" ry="20" fill="#2c3a50"/><ellipse cx="230" cy="1052" rx="120" ry="12" fill="#c8202a" opacity="0.18" filter="url(#blur3)"/>`;
  return { back: o, front };
}
function busShelter(t) {
  let o = `<rect x="840" y="640" width="400" height="360" fill="#9ec6ff" opacity="0.1"/><rect x="840" y="640" width="400" height="360" fill="none" stroke="#5a5e68" stroke-width="5"/>`;
  o += `<rect x="852" y="672" width="104" height="220" rx="4" fill="#ffefc4"/><rect x="858" y="678" width="92" height="208" fill="url(#posterSky)"/><circle cx="904" cy="760" r="26" fill="#ffd36a"/><path d="M 858 830 L 890 800 L 914 820 L 950 790 L 950 886 L 858 886 Z" fill="#3a2a5a"/>${text(904, 712, 'DREAM BIG', { size: 16, fill: '#fff', family: 'Anton', weight: 400, ls: 1 })}`;
  o += `<circle cx="904" cy="780" r="90" fill="url(#lampGlow)" opacity="0.5"/>`;
  o += `<rect x="806" y="604" width="470" height="30" rx="4" fill="#2c3038"/><rect x="806" y="630" width="470" height="6" fill="#16181e"/>`;
  for (const px of [820, 1262]) o += `<rect x="${px - 6}" y="634" width="12" height="416" fill="#3a3e48"/>`;
  return o;
}
function bench() {
  return `<rect x="846" y="956" width="380" height="14" rx="5" fill="#6a4a2a"/><rect x="846" y="956" width="380" height="4" fill="#8a6a42"/><path d="M 870 970 L 870 1050 M 1200 970 L 1200 1050" stroke="#3a3e48" stroke-width="10"/>`;
}
function wallClock(x, y, hours) {
  const ha = (hours / 12) * 360, ma = (hours % 1) * 360;
  return `<circle cx="${x}" cy="${y}" r="32" fill="#f8f4ea" stroke="#2c3038" stroke-width="6"/>${[0, 90, 180, 270].map((a) => `<line x1="${x}" y1="${y - 26}" x2="${x}" y2="${y - 21}" stroke="#333" stroke-width="3" transform="rotate(${a} ${x} ${y})"/>`).join('')}<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 15}" stroke="#222" stroke-width="5" stroke-linecap="round" transform="rotate(${f1(ha)} ${x} ${y})"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 24}" stroke="#c8202a" stroke-width="3" stroke-linecap="round" transform="rotate(${f1(ma)} ${x} ${y})"/>`;
}
// side-view laptop on TJR's lap; turn: 0 screen faces TJR (right), 1 faces Brodie (left)
function lapLaptop(cx, y, turn, glow = 1) {
  const sx = Math.cos(Math.PI * turn);
  let o = `<g transform="translate(${f1(cx)} ${f1(y)}) scale(${sx.toFixed(3)} 1)"><rect x="-34" y="-6" width="68" height="7" rx="2" fill="#b9bec6"/><path d="M -32 -4 L -44 -66" stroke="#2a2d33" stroke-width="7" stroke-linecap="round"/><path d="M -28 -6 L -40 -64" stroke="#9fd8ff" stroke-width="2.5" opacity="${f1(glow)}"/></g>`;
  if (glow > 0) o += `<circle cx="${f1(cx + 10 * sx)}" cy="${f1(y - 50)}" r="80" fill="url(#screenGlow)" opacity="${f1(glow)}"/>`;
  return o;
}
function room(day = 1) {
  let o = `<rect x="-200" y="-300" width="1120" height="1700" fill="${day ? '#e9e2d4' : '#1c2030'}"/>`;
  o += `<rect x="-200" y="1060" width="1120" height="400" fill="${day ? '#b08a5a' : '#3a2c22'}"/><rect x="-200" y="1060" width="1120" height="8" fill="${day ? '#8a6a42' : '#2a1e16'}"/>`;
  for (let i = 0; i < 9; i++) o += `<line x1="${-200 + i * 140}" y1="1068" x2="${-260 + i * 140}" y2="1400" stroke="#000" stroke-width="2" opacity="0.12"/>`;
  return o;
}
function whiteboard(t, t0) {
  const draw = (u, len, d, col, w = 5) => (u <= 0 ? '' : `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${f1(len * (1 - clamp(u)))}"/>`);
  let o = `<rect x="56" y="436" width="520" height="380" rx="8" fill="#fbfbf8" stroke="#9aa0a8" stroke-width="10"/><rect x="120" y="816" width="380" height="12" rx="3" fill="#9aa0a8"/><rect x="160" y="806" width="40" height="10" rx="3" fill="#2a5ad8"/><rect x="210" y="806" width="40" height="10" rx="3" fill="#c8202a"/>`;
  o += `<g opacity="${f1(prog(t, t0 + 0.1, t0 + 0.4))}">${text(316, 486, 'LESSON 1: PROTECT YOUR CAPITAL', { size: 26, fill: '#222', family: 'Oswald', weight: 700 })}</g>`;
  const cs = [[110, 700, 640, 690], [160, 650, 690, 630], [210, 690, 640, 700], [260, 620, 580, 610], [310, 600, 640, 560], [360, 560, 600, 540]];
  cs.forEach(([x, o1, c1, lo], i) => {
    const u = prog(t, t0 + 0.2 + i * 0.12, t0 + 0.32 + i * 0.12);
    const top = Math.min(o1, c1), h = Math.abs(o1 - c1) + 12;
    o += draw(u, 2 * (24 + h), `M ${x - 12} ${top} L ${x + 12} ${top} L ${x + 12} ${top + h} L ${x - 12} ${top + h} Z`, '#222', 4);
    o += draw(u, 200, `M ${x} ${lo - 20} L ${x} ${top} M ${x} ${top + h} L ${x} ${top + h + 18}`, '#222', 3);
  });
  o += draw(prog(t, t0 + 1.0, t0 + 1.3), 420, 'M 90 712 L 520 712', '#2a5ad8', 5);
  o += draw(prog(t, t0 + 1.3, t0 + 1.6), 420, 'M 90 752 L 520 752', '#c8202a', 5);
  if (t > t0 + 1.6) o += `<g opacity="${f1(prog(t, t0 + 1.6, t0 + 1.8))}">${text(470, 744, 'STOP', { size: 20, fill: '#c8202a', family: 'Anton', weight: 400 })}${text(470, 704, 'LEVEL', { size: 20, fill: '#2a5ad8', family: 'Anton', weight: 400 })}</g>`;
  if (t > t0 + 1.8) o += `<g opacity="${f1(prog(t, t0 + 1.8, t0 + 2.0))}">${text(480, 580, 'RISK 1%', { size: 34, fill: '#c8202a', family: 'Anton', weight: 400 })}</g>`;
  o += draw(prog(t, t0 + 2.2, t0 + 2.5), 320, 'M 400 640 Q 440 560 470 620 L 520 600', '#2fae5a', 5);
  if (t > t0 + 2.4) o += `<g opacity="${f1(prog(t, t0 + 2.4, t0 + 2.6))}">${text(250, 790, 'WAIT FOR THE SETUP ✓', { size: 24, fill: '#2fae5a', family: 'Oswald', weight: 700 })}</g>`;
  return o;
}
function deskLamp(x, y) {
  return `<path d="M ${x} ${y} L ${x + 10} ${y - 90} L ${x + 60} ${y - 120}" stroke="#333" stroke-width="7" fill="none"/><path d="M ${x + 44} ${y - 140} L ${x + 92} ${y - 110} L ${x + 70} ${y - 90} Z" fill="#444"/><ellipse cx="${x + 20}" cy="${y + 4}" rx="30" ry="7" fill="#333"/><circle cx="${x + 80}" cy="${y - 100}" r="200" fill="url(#lampGlow)"/>`;
}
function mug(x, y, col = '#f4efe6') {
  return `<rect x="${x - 12}" y="${y - 30}" width="24" height="30" rx="3" fill="${col}"/><path d="M ${x + 12} ${y - 24} q 12 0 12 10 q 0 10 -12 10" stroke="${col}" stroke-width="4" fill="none"/>`;
}
function palm(x, y, sc, t) {
  const sway = Math.sin(t * 1.6 + x) * 3;
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc})"><path d="M 0 0 Q 14 -160 ${f1(-6 + sway)} -320" stroke="#8a6a42" stroke-width="16" fill="none"/>`;
  for (let i = 0; i < 7; i++) {
    const a = -170 + i * 28 + sway;
    o += `<path transform="translate(${f1(-6 + sway)} -320) rotate(${f1(a)})" d="M 0 0 Q 60 -30 120 10 Q 60 -10 0 6 Z" fill="${i % 2 ? '#2f8a4a' : '#3aa85a'}"/>`;
  }
  return o + '</g>';
}
function giantCheck(x, y, sc, rot) {
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${sc.toFixed(3)})"><rect x="-170" y="-80" width="340" height="160" rx="6" fill="#f4fbf2" stroke="#7aa874" stroke-width="4"/><rect x="-170" y="-80" width="340" height="26" fill="#cfe8c8"/>`;
  o += `${text(-160, -60, 'BANK OF BRODIE', { size: 15, fill: '#2f5a2c', family: 'Anton', weight: 400, anchor: 'start', ls: 1 })}${text(160, -60, 'CHECK #001', { size: 13, fill: '#2f5a2c', family: 'Oswald', weight: 500, anchor: 'end' })}`;
  o += `${text(-160, -24, 'PAY TO: KIBBLE KING', { size: 20, fill: '#222', family: 'Oswald', weight: 700, anchor: 'start' })}`;
  o += `<rect x="-160" y="-8" width="320" height="40" rx="4" fill="#fff" stroke="#9ac494" stroke-width="2"/>${text(0, 22, '$ THE WHOLE STORE', { size: 28, fill: '#1a7a3a', family: 'Anton', weight: 400 })}`;
  o += `${text(-160, 64, 'MEMO: remember me?', { size: 15, fill: '#555', family: 'Oswald', weight: 500, anchor: 'start' })}<path d="M 40 60 q 14 -18 26 0 q 12 -16 24 -2 q 10 -12 22 0" stroke="#1a2a8a" stroke-width="3" fill="none"/><g transform="translate(150 58) scale(0.35)" fill="#1a2a8a"><ellipse cx="0" cy="14" rx="26" ry="22"/><ellipse cx="-30" cy="-16" rx="10" ry="13"/><ellipse cx="-10" cy="-30" rx="10" ry="13"/><ellipse cx="12" cy="-30" rx="10" ry="13"/><ellipse cx="32" cy="-16" rx="10" ry="13"/></g></g>`;
  return o;
}
function birdsCircling(x, y, t) {
  let o = '';
  for (let i = 0; i < 3; i++) {
    const a = t * 5 + (i * Math.PI * 2) / 3, bx = x + Math.cos(a) * 46, by = y + Math.sin(a) * 12, fl = Math.sin(t * 30 + i) * 5;
    o += `<g transform="translate(${f1(bx)} ${f1(by)})"><ellipse rx="9" ry="7" fill="#ffd84a"/><path d="M -2 -2 L -10 ${f1(-8 + fl)} L 4 -4 Z" fill="#f2b82a"/><path d="M 8 -1 L 14 1 L 8 3 Z" fill="#f08a2a"/><circle cx="4" cy="-2" r="1.5" fill="#000"/></g>`;
  }
  return o;
}
function phoneNotif(t, t0, t1) {
  const u = ease.out(prog(t, t0, t0 + 0.4)) * (1 - ease.in(prog(t, t1 - 0.35, t1)));
  if (u <= 0) return '';
  const y = lerp(-140, 70, u);
  return `<g transform="translate(360 ${f1(y)})"><rect x="-300" y="0" width="600" height="124" rx="26" fill="#f6f7f9" opacity="0.96"/><rect x="-276" y="22" width="80" height="80" rx="18" fill="#12b45a"/><path d="M -262 84 L -244 64 L -230 74 L -208 44" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `${text(-176, 50, 'TRADING ACCOUNT', { size: 22, fill: '#666', family: 'Oswald', weight: 500, anchor: 'start', ls: 1 })}${text(270, 50, 'now', { size: 20, fill: '#888', family: 'Oswald', weight: 500, anchor: 'end' })}` +
    `${text(-176, 94, 'This week: +$30,000.00', { size: 34, fill: '#111', family: 'Oswald', weight: 700, anchor: 'start' })}</g>`;
}
const rainAt = (t, op, F, P, z, roof) => rainFx(t, op, 110, 4, roof ? [...toScreen(F, P, z, [roof[0], roof[1]]), ...toScreen(F, P, z, [roof[2], roof[3]])] : null);

// ---------- 1. fired ----------
function sceneFired(t) {
  const tOpen = 0.8, tLand = 1.5, tSit = 3.4, tThrow = 6.05, tBowl = 6.55, tSlam = 6.95, tFlip = 7.2, tBolt = 7.4;
  const open = t < tSlam - 0.12 ? ease.out(prog(t, tOpen, tOpen + 0.12)) : 1 - ease.in(prog(t, tSlam - 0.12, tSlam));
  const S = storefront(t, { door: open, closed: prog(t, tFlip, tFlip + 0.35), hiring: ease.back(prog(t, 7.7, 8.0)), lights: 1 - 0.45 * prog(t, tFlip, tFlip + 0.3) });
  let o = S.back;
  // the boss in the doorway
  const g0 = 1000, bs = 0.82;
  const bx = t < tSlam - 0.35 ? 560 : lerp(560, 650, prog(t, tSlam - 0.35, tSlam - 0.05));
  const shake = t > 2.3 && t < 3.2 ? Math.sin(t * 40) * 8 : 0;
  const shove = ease.out(prog(t, tOpen - 0.02, tOpen + 0.12)) * (1 - prog(t, tOpen + 0.35, tOpen + 0.7));
  const toss = bump(t, tThrow - 0.3, tThrow + 0.25);
  let fN = [bx - 60 + shake * 0.6, g0 - 182 + Math.abs(shake) * 0.5];
  fN = mix(fN, [bx - 110, g0 - 130], shove);
  fN = mix(fN, [bx - 120, g0 - 190], toss);
  const boss = dog({ breed: 'boss', x: bx, y: g0, s: bs, flip: -1, tilt: 64, hipLift: 26, neck: 22, headTilt: -10, lid: 0.22, brow: 1, earLift: 0.6, jaw: jaw('boss', t), tailUp: 30, acc: { uniform: MGR }, paws: uprightPaws(bx, g0, bs, -1, fN, [bx - 36, g0 - 150]), noShadow: true }, t);
  if (t > tOpen - 0.1 && t < tSlam + 0.05) {
    o += boss.svg;
    if (t > tOpen + 0.4 && t < 5.7) o += kibbleBag(boss.paw[0] - 6, boss.paw[1] + 40, 0.75, '#e8a23a', -12 + shake, { bite: true });
    if (t > 5.75 && t < tThrow) o += bowl(boss.paw[0] - 4, boss.paw[1] + 6, -20, 0.75);
  }
  o += S.front;
  // Brodie: thrown out, lands in the puddle, sits up
  const g = 1056, s = 0.85;
  let d = null;
  if (t > tOpen && t < tLand) {
    const u = prog(t, tOpen, tLand), x = lerp(520, 250, u), y = lerp(890, g, u) - Math.sin(u * Math.PI) * 150, fl = Math.sin(t * 34) * 14;
    const dd = dog({ breed: 'beagle', x, y, s, flip: -1, tilt: 8, hipLift: 12, neck: 44, lid: 0, pop: 1, brow: -0.6, earLift: 1, earSwing: fl * 2, tailUp: 70, jaw: 0.75, wet: 0.35, acc: { uniform: UNI, visor: t < 0.95 ? '#d8342a' : null }, paws: { fN: [x - 104 * s, y - 70 * s + fl], fF: [x - 84 * s, y - 34 * s - fl], hN: [x + 64 * s, y - 14 * s + fl], hF: [x + 86 * s, y - 46 * s - fl] }, noShadow: true }, t);
    o += `<g transform="rotate(${f1(-u * 380)} ${f1(x - 20 * s)} ${f1(y - 70 * s)})">${dd.svg}</g>`;
  } else if (t >= tLand) {
    const sit = ease.inOut(prog(t, tSit, tSit + 0.35)), x = 250, f = t < tSit + 0.15 ? -1 : 1;
    const lie = { fN: [x - 110 * s, g], fF: [x - 92 * s, g], hN: [x + 72 * s, g], hF: [x + 92 * s, g] };
    const st = sitPaws(x, g, s, 1);
    const paws = f === -1 ? lie : st;
    const fired = prog(t, 5.8, 6.0) * (1 - prog(t, 6.4, 6.6));
    const sad = prog(t, 7.9, 8.3);
    const bonk = t > tBowl && t < tBowl + 0.4 ? Math.sin((t - tBowl) * 40) * (1 - prog(t, tBowl, tBowl + 0.4)) * 6 : 0;
    d = dog({ breed: 'beagle', x, y: g, s, flip: f, tilt: lerp(-2, 34, sit), hipLift: lerp(64, 38, sit), neck: f === -1 ? -14 : lerp(22, 12, sad) + bonk, headTilt: t > 4.2 && t < 5.6 ? 12 : 0, lid: t < 2.2 ? 0.55 : fired > 0.3 ? 0.65 : lerp(0.3, 0.55, sad), brow: -1, earLift: 0, earSwing: -10, tailUp: lerp(-10, -35, sad), jaw: jaw('hero', t), tongue: t > 4.2 && t < 5.4 ? 0.25 : 0, look: [0.6, -0.8], wet: clamp(0.35 + prog(t, tLand, tLand + 0.2)), tear: t > 8.2, acc: { uniform: UNI }, paws }, t);
    o += d.svg;
    if (t < 2.4) for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; o += star(d.head[0] + Math.cos(a) * 34, d.head[1] - 40 + Math.sin(a) * 8, 9, 1 - prog(t, 2.0, 2.4), '#ffe680'); }
  }
  // the visor flies off into the puddle
  if (t > 0.95) {
    const u = prog(t, 0.95, 1.75), bob = t > 1.75 ? Math.sin(t * 3) * 3 : 0;
    o += visorProp(lerp(470, 130, u), lerp(800, 1044, u) - Math.sin(u * Math.PI) * 120 + bob, u < 1 ? u * 540 : 8 + bob, 0.8);
  }
  // the bowl: thrown, lands upside down on his head
  if (t > tThrow && d) {
    const u = prog(t, tThrow, tBowl), top = [d.head[0] - 6, d.head[1] - 34 * s];
    const p0 = [490, 810];
    const pos = u < 1 ? [lerp(p0[0], top[0], u), lerp(p0[1], top[1], u) - Math.sin(u * Math.PI) * 90] : top;
    o += bowl(pos[0], pos[1] + (u < 1 ? 0 : 12), u < 1 ? u * 500 : 6 + Math.sin(t * 2) * 2, 0.72, u >= 1);
    if (u >= 1) for (let i = 0; i < 3; i++) { const p = (t * 1.4 + i * 0.33) % 1; o += `<circle cx="${f1(top[0] - 26 + i * 26)}" cy="${f1(top[1] + 16 + p * 50)}" r="3" fill="#bfe2ff" opacity="${f1(1 - p)}"/>`; }
  }
  o += splashRing(250, g, t, tLand);
  // camera: storefront, then close on Brodie
  const u1 = ease.inOut(prog(t, 1.2, 2.2)), u2 = ease.inOut(prog(t, 7.7, 8.5));
  let z = lerp(1.0, 1.12, u1), F = mix([360, 640], [420, 800], u1), P = mix([360, 640], [360, 740], u1);
  z = lerp(z, 1.6, u2); F = mix(F, [270, 930], u2); P = mix(P, [360, 760], u2);
  const jolt = (bump(t, 0.82, 1.0) + bump(t, tSlam, tSlam + 0.18) + bump(t, tBolt, tBolt + 0.3) * 1.5) * 8 * Math.sin(t * 90);
  let out = cam(F, [P[0] + jolt, P[1]], z, o + gradeW('#4a5a8a', 0.25));
  out += rainAt(t, 0.36, F, P, z, null);
  const flash = Math.max(bump(t, tBolt, tBolt + 0.12), 0.7 * bump(t, tBolt + 0.18, tBolt + 0.3));
  if (flash > 0) out += `<rect width="720" height="1280" fill="#eef4ff" opacity="${f1(0.55 * flash)}"/><path d="M 520 0 L 470 130 L 510 140 L 440 300" stroke="#fff" stroke-width="6" fill="none" opacity="${f1(flash)}" filter="url(#glow)"/>`;
  return out;
}

// ---------- 2. walking home, meeting TJR ----------
function tjrSeated(t, o2 = {}) {
  const x = 1090, g = 1050, s = 0.85;
  const typing = o2.typing ?? 0, k = Math.sin(t * 26), k2 = Math.sin(t * 26 + 2);
  let hN = mix([1036, 930], [1030 + k * 3, 934 - Math.max(0, k) * 6], typing), hF = mix([1062, 934], [1056 + k2 * 3, 936 - Math.max(0, k2) * 6], typing);
  if (o2.hN) hN = o2.hN;
  if (o2.hF) hF = o2.hF;
  const m = tjrMouth(t) || (o2.chatter ?? 0);
  return human({ x, y: g, s, flip: -1, hip: [0, 62], lean: o2.lean ?? 8, headTilt: o2.headTilt ?? 20, fN: [1012, g], fF: [1030, g], hN, hF, smile: o2.smile ?? 0.35, blink: blink(t, 0.4), mouth: m, brow: o2.brow ?? 0 }, t);
}
function sceneWalk(t) {
  const tStop = 12.4, tDrop = 12.45, tHop = 18.1;
  const walkU = prog(t, C.walk, tStop);
  const bx = lerp(200, 760, ease.out(walkU) * 0.25 + walkU * 0.75);
  const walking = t < tStop;
  const Fx = lerp(400, 930, ease.inOut(prog(t, C.walk + 0.4, tStop + 0.4)));
  const zu = ease.inOut(prog(t, 11.8, 12.9)), z = lerp(1.05, 1.3, zu), F = [Fx, lerp(820, 900, zu)], P = [360, 760];
  let o = `<rect x="-200" y="-300" width="1800" height="1700" fill="url(#nightSky)"/>`;
  o += `<g transform="translate(${f1((Fx - 360) * 0.5)} 0)">${skyline(t, 31)}</g>`;
  o += lampPost(380, 1050, t, 1) + lampPost(1380, 1050, t, 1);
  o += busShelter(t) + wallClock(1180, 700, 9);
  o += `<rect x="-200" y="1050" width="1800" height="60" fill="#34363e"/><rect x="-200" y="1050" width="1800" height="8" fill="#4c4e58"/><rect x="-200" y="1110" width="1800" height="400" fill="#1a1b21"/><ellipse cx="560" cy="1150" rx="170" ry="16" fill="#2a3442"/><ellipse cx="1180" cy="1170" rx="140" ry="14" fill="#2a3442"/>`;
  o += bench();
  // TJR on the bench, trading
  const look = ease.inOut(prog(t, 14.3, 14.6));
  const pat = bump(t, 17.2, 18.0);
  const tj = tjrSeated(t, { typing: t < 14.3 ? 1 : 0, headTilt: lerp(22, 6, look), smile: lerp(0.3, 0.6, prog(t, 15.6, 16.2)), hF: pat > 0 ? mix([1062, 934], [990, 950], pat) : null });
  o += lapLaptop(1046, 944, 0, 1) + tj.svg;
  // Brodie
  const g = 1050, s = 0.82;
  const perk = ease.out(prog(t, 12.6, 12.8)), tilt2 = t > 15.8 && t < 17.0 ? 14 : 0;
  let x = bx, y = g, paws = walking ? walkPaws(bx, g, s, bx / 15, 22, 10) : null, tilt = 0, hipLift = 0;
  const hopU = prog(t, tHop, tHop + 0.26);
  if (t > tHop) {
    x = lerp(760, 870, hopU); y = lerp(g, 962, hopU) - Math.sin(hopU * Math.PI) * 90;
    tilt = hopU < 1 ? 20 : 34; hipLift = hopU < 1 ? 0 : 38;
    paws = hopU < 1 ? { fN: [x + 70 * s, y - 20], fF: [x + 60 * s, y - 10], hN: [x - 60 * s, y], hF: [x - 70 * s, y] } : sitPaws(x, 962, s);
    if (hopU >= 1) y = 962;
  }
  const dropU = bump(t, tDrop - 0.15, tDrop + 0.3);
  const d = dog({ breed: 'beagle', x, y, s, tilt, hipLift, neck: lerp(10, 34, perk) - dropU * 40, headTilt: tilt2, lid: lerp(0.5, 0.1, perk), brow: lerp(-1, 0.1, perk), earLift: lerp(0, 0.5, perk), earSwing: -6, tailUp: lerp(-28, 20, perk), wag: t > 15.6 ? 14 : 0, jaw: jaw('hero', t), look: [0.8, -0.4], wet: 1, acc: { uniform: UNI }, paws }, t);
  o += d.svg;
  if (t < tDrop) o += bowl(d.head[0] + 40 * s, d.head[1] + 26 * s, 0, 0.55);
  else o += bowl(bx + 78, g, 0, 0.55);
  if (t > 12.6 && t < 13.2) o += `<text x="${f1(d.head[0] + 10)}" y="${f1(d.head[1] - 60)}" font-family="Anton" font-size="54" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke" opacity="${f1(1 - prog(t, 12.95, 13.2))}">?</text>`;
  o += gradeW('#4a5a8a', 0.28);
  let out = cam(F, P, z, o);
  out += rainAt(t, 0.34, F, P, z, [806, 636, 1276, 1060]);
  // runoff from the shelter roof
  for (let i = 0; i < 12; i++) { const q = toScreen(F, P, z, [812 + i * 40, 640]), p = (t * 2.2 + i * 0.29) % 1; out += `<line x1="${f1(q[0])}" y1="${f1(q[1] + p * 300)}" x2="${f1(q[0])}" y2="${f1(q[1] + p * 300 + 18)}" stroke="#cfe6ff" stroke-width="2" opacity="${f1(0.5 * (1 - p))}"/>`; }
  return out;
}

// ---------- 3. two hours later (fast-forward) ----------
function sceneChat(t) {
  const u = prog(t, C.chat, 21.0), tTurn = 21.0;
  const F = [1010, 890], P = [360, 760], z = 1.35;
  let o = `<rect x="-200" y="-300" width="1800" height="1700" fill="url(#nightSky)"/>`;
  o += `<circle cx="${f1(lerp(700, 1300, u))}" cy="${f1(420 - Math.sin(u * Math.PI) * 80)}" r="30" fill="#fff8dc" filter="url(#glow)"/>`;
  o += `<g transform="translate(270 0)">${skyline(t, 31)}</g>` + lampPost(1380, 1050, t, 1);
  o += busShelter(t) + wallClock(1180, 700, 9 + 2 * u);
  o += `<rect x="-200" y="1050" width="1800" height="60" fill="#34363e"/><rect x="-200" y="1050" width="1800" height="8" fill="#4c4e58"/><rect x="-200" y="1110" width="1800" height="400" fill="#1a1b21"/>`;
  o += bench();
  // coffee cups pile up
  const nCups = Math.floor(u * 7);
  const cupPos = [[1150, 956], [1172, 956], [1194, 956], [1161, 926], [1183, 926], [1172, 896]];
  for (let i = 0; i < Math.min(nCups, 6); i++) o += `<g transform="translate(${cupPos[i][0]} ${cupPos[i][1]})"><path d="M -9 -30 L 9 -30 L 7 0 L -7 0 Z" fill="#f4efe6"/><rect x="-10" y="-34" width="20" height="5" rx="2" fill="#6a4a2a"/><rect x="-8" y="-20" width="16" height="8" fill="#c8915a"/></g>`;
  const turn = ease.inOut(prog(t, tTurn, tTurn + 0.4));
  const talk = t < 21.0 ? 0.25 + 0.25 * Math.sin(t * 31) : 0;
  const gest = Math.sin(t * 7);
  const tj = tjrSeated(t, { typing: 0, headTilt: 8, smile: 0.55, chatter: talk, hN: turn > 0 ? mix([1036, 930], [1010, 920], turn) : [1010 + gest * 14, 860 + Math.cos(t * 9) * 16], hF: mix([1062, 934], [1040, 920], turn) });
  o += lapLaptop(1046, 944, turn, 1 - turn * 0.8) + tj.svg;
  // Brodie on the bench, drying off
  const x = 870, g = 962, s = 0.8;
  const lean = ease.inOut(prog(t, tTurn + 0.2, tTurn + 0.5));
  o += dog({ breed: 'beagle', x, y: g, s, tilt: 34, hipLift: 38, neck: 30 + Math.sin(t * 9) * 6 - lean * 16, headTilt: Math.sin(t * 5) * 10 + lean * 10, lid: 0.05, brow: 0.2, earLift: 0.6 + 0.2 * Math.sin(t * 12), tailUp: 40, wag: 30, wagSpeed: 26, jaw: jaw('hero', t), sparkle: true, look: [0.8, 0], wet: 1 - prog(t, C.chat, 20.2), acc: { uniform: UNI }, paws: sitPaws(x, g, s) }, t).svg;
  // conversation bubbles
  for (let k = 0; k < 6; k++) {
    const ta = C.chat + 0.15 + k * 0.42, bu = prog(t, ta, ta + 0.12) * (1 - prog(t, ta + 0.5, ta + 0.6));
    if (bu <= 0 || t > tTurn) continue;
    const left = k % 2 === 1;
    o += speechBubble(left ? 900 : 1020, left ? 770 : 740, 0.75 * ease.back(bu), ICONS[k % ICONS.length], left ? -1 : 1);
  }
  o += gradeW('#4a5a8a', 0.24);
  let out = cam(F, P, z, o);
  out += rainAt(t, 0.34 * (1 - prog(t, C.chat, 20.0)), F, P, z, [806, 636, 1276, 1060]);
  // fast-forward overlay
  const op = prog(t, C.chat, C.chat + 0.2) * (1 - prog(t, 20.9, 21.2));
  out += `<g opacity="${f1(op)}">${text(360, 150, '2 HOURS LATER', { size: 62, fill: '#fff', family: 'Anton', weight: 400, ls: 4 })}<g transform="translate(360 196)" opacity="${f1(0.5 + 0.5 * (Math.sin(t * 14) > 0))}"><path d="M -40 -16 L -8 0 L -40 16 Z M -4 -16 L 28 0 L -4 16 Z" fill="#fff"/></g></g>`;
  for (let i = 0; i < 8; i++) { const y = (i * 160 + t * 900) % 1280; out += `<rect x="0" y="${f1(y)}" width="720" height="2" fill="#fff" opacity="${f1(0.06 * op)}"/>`; }
  return out;
}

// ---------- 4. the screen: weekly P&L ----------
function sceneScreen(t) {
  const u = ease.out(prog(t, C.screen + 0.15, 22.6)), v = Math.round(50000 * u);
  const hit = t > 22.7 ? 1 + 0.08 * Math.sin((t - 22.7) * 30) * (1 - prog(t, 22.7, 23.0)) : 1;
  let o = `<rect width="720" height="1280" fill="#06080c"/><rect x="40" y="250" width="640" height="720" rx="22" fill="#1d2027"/><rect x="62" y="272" width="596" height="676" rx="8" fill="#0b1220"/>`;
  o += text(110, 340, 'WEEKLY P&L', { size: 34, fill: '#8aa0bf', family: 'Oswald', weight: 700, anchor: 'start', ls: 3 });
  o += `<rect x="460" y="306" width="170" height="46" rx="23" fill="#16243c"/>${text(545, 338, 'THIS WEEK', { size: 22, fill: '#cfe0ff', family: 'Oswald', weight: 500 })}`;
  // equity curve
  let pth = '', lastX = 110, lastY = 820;
  for (let i = 0; i <= 40; i++) {
    const q = i / 40; if (q > u) break;
    const x = 110 + q * 500, y = 840 - q * 300 + Math.sin(i * 1.9) * 18 * (1 - q * 0.4);
    pth += `${i ? 'L' : 'M'} ${f1(x)} ${f1(y)} `; lastX = x; lastY = y;
  }
  if (pth) o += `<path d="${pth}" stroke="#2fd07a" stroke-width="6" fill="none" stroke-linejoin="round" filter="url(#glow2)"/><circle cx="${f1(lastX)}" cy="${f1(lastY)}" r="9" fill="#2fd07a"/>`;
  o += `<g transform="translate(360 500) scale(${hit.toFixed(3)})">${text(0, 0, '+' + money(v), { size: 104, fill: '#2fd07a', family: 'Anton', weight: 400, filter: t > 22.7 ? 'glow' : '' })}</g>`;
  if (t > 22.7) o += sparkles(t, 77, [120, 380, 600, 540], 14) + confetti(t, 22.7, 5, 50);
  o += `<path d="M 80 290 L 220 290 L 80 520 Z" fill="#fff" opacity="0.04"/>`;
  const z = lerp(1.0, 1.08, prog(t, C.screen, C.shock));
  return zoomAt(360, 560, z, o);
}

// ---------- 5. the jaw drop ----------
function sceneShock(t) {
  const t0 = C.shock, pop = ease.out(prog(t, t0 + 0.02, t0 + 0.12)), gape = ease.in(prog(t, t0 + 0.12, t0 + 0.36)) * 1.6;
  let o = `<rect width="720" height="1280" fill="#ffcf3a"/>`;
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2 + t * 0.6; o += `<path d="M 360 520 L ${f1(360 + Math.cos(a - 0.04) * 1400)} ${f1(520 + Math.sin(a - 0.04) * 1400)} L ${f1(360 + Math.cos(a + 0.04) * 1400)} ${f1(520 + Math.sin(a + 0.04) * 1400)} Z" fill="#ff8a2a" opacity="${i % 2 ? 0.5 : 0.25}"/>`; }
  const jx = t > t0 + 0.36 ? Math.sin(t * 70) * 4 : 0;
  o += dogFront(360 + jx, 470, 2.6, { breed: 'beagle', pop, gape, earLift: 0.9 + 0.1 * Math.sin(t * 30) }, t);
  if (t > t0 + 0.36) { const u = prog(t, t0 + 0.36, t0 + 0.7); o += `<ellipse cx="360" cy="1230" rx="${f1(120 + 200 * u)}" ry="${f1(14 + 10 * u)}" fill="none" stroke="#7a3a0a" stroke-width="5" opacity="${f1(1 - u)}"/>`; }
  for (const [x, y, r] of [[110, 230, -16], [610, 250, 14]]) o += `<text x="${x}" y="${y}" font-family="Anton" font-size="110" fill="#fff" stroke="#000" stroke-width="8" paint-order="stroke" transform="rotate(${r} ${x} ${y})" opacity="${f1(pop)}">!!</text>`;
  return o;
}

// ---------- 6. begging ----------
function sceneBeg(t) {
  const F = [990, 890], P = [360, 760], z = 1.32;
  let o = `<rect x="-200" y="-300" width="1800" height="1700" fill="url(#nightSky)"/><circle cx="1300" cy="340" r="30" fill="#fff8dc" filter="url(#glow)"/>`;
  o += `<g transform="translate(270 0)">${skyline(t, 31)}</g>` + lampPost(1380, 1050, t, 1);
  o += busShelter(t) + wallClock(1180, 700, 11.05 + (t - C.beg) / 3600);
  o += `<rect x="-200" y="1050" width="1800" height="60" fill="#34363e"/><rect x="-200" y="1050" width="1800" height="8" fill="#4c4e58"/><rect x="-200" y="1110" width="1800" height="400" fill="#1a1b21"/>`;
  o += bench();
  const cupPos = [[1150, 956], [1172, 956], [1194, 956], [1161, 926], [1183, 926], [1172, 896]];
  for (const [cx, cy] of cupPos) o += `<g transform="translate(${cx} ${cy})"><path d="M -9 -30 L 9 -30 L 7 0 L -7 0 Z" fill="#f4efe6"/><rect x="-10" y="-34" width="20" height="5" rx="2" fill="#6a4a2a"/><rect x="-8" y="-20" width="16" height="8" fill="#c8915a"/></g>`;
  const yes = t > 27.75, finger = ease.back(prog(t, 28.5, 28.8)) * (1 - prog(t, 30.2, 30.5));
  const tj = tjrSeated(t, { typing: 0, headTilt: 14, lean: 12, smile: yes ? 0.85 : 0.3, brow: t < 27.4 ? -0.6 : 0, hN: mix([1036, 930], [1000, 836], finger) });
  o += lapLaptop(1046, 944, 0, 0) + tj.svg;
  // Brodie begs: upright, paws together, puppy eyes
  const x = 900, g = 1050, s = 0.82, bob = Math.sin(t * 6) * 6, joy = prog(t, 27.9, 28.1);
  const hop = yes && t < 29.0 ? Math.abs(Math.sin((t - 27.9) * 9)) * 22 * joy : 0;
  o += `<circle cx="${x + 20}" cy="${g - 150}" r="${f1(150 + 10 * Math.sin(t * 3))}" fill="url(#pinkGlow)" opacity="${f1(0.6 * (1 - joy))}"/>`;
  o += dog({ breed: 'beagle', x, y: g - hop, s, tilt: 80, hipLift: 30, neck: 34, headTilt: yes ? 0 : 8, lid: 0, puppy: 1 - joy * 0.6, brow: yes ? 0.2 : -1, earLift: yes ? 0.9 : 0.15, earSwing: yes ? Math.sin(t * 20) * 14 : 0, tailUp: 30, wag: yes ? 50 : 10, wagSpeed: yes ? 34 : 6, jaw: jaw('hero', t), tongue: yes ? 0.6 : 0, sparkle: true, look: [0.6, -0.8], acc: { uniform: UNI }, paws: uprightPaws(x, g - hop, s, 1, [x + 36, g - 170 + bob - hop], [x + 30, g - 160 + bob - hop]) }, t).svg;
  if (!yes) o += sparkles(t, 91, [x - 40, g - 300, x + 120, g - 160], 10);
  if (yes && t < 29.0) for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 3; o += `<path transform="translate(${f1(x + 40 + Math.cos(a) * 110)} ${f1(g - 230 + Math.sin(a) * 60)}) scale(${f1(0.7 + 0.3 * Math.sin(t * 9 + i))})" d="M 0 8 C -14 -2 -10 -14 0 -6 C 10 -14 14 -2 0 8 Z" fill="#ff5f8a"/>`; }
  o += gradeW('#4a5a8a', 0.2);
  return cam(F, P, lerp(z, z + 0.08, prog(t, C.beg, C.board)), o);
}

// ---------- 7-9. lessons montage ----------
function sceneBoard(t) {
  let o = room(1) + `<rect x="620" y="300" width="120" height="300" fill="#bfe2f6" stroke="#8a6a42" stroke-width="10"/>`;
  o += whiteboard(t, C.board);
  o += `<g transform="translate(70 340) rotate(-3)"><rect x="-6" y="-24" width="120" height="44" rx="6" fill="#222"/>${text(54, 8, 'DAY 1', { size: 28, fill: '#ffd23a', family: 'Anton', weight: 400, ls: 2 })}</g>`;
  // TJR at the board, marker pointing where the ink appears
  const tp = [[C.board, [430, 560]], [C.board + 0.3, [130, 660]], [C.board + 0.95, [360, 590]], [C.board + 1.1, [200, 712]], [C.board + 1.4, [400, 752]], [C.board + 1.85, [470, 590]], [C.board + 2.3, [440, 610]], [C.board + 2.6, [300, 780]], [C.board + 3.2, [460, 640]]];
  const aim = track(t, tp);
  const hN = mix([520, 760], aim, 0.55);
  o += human({ x: 610, y: 1068, s: 0.98, flip: -1, lean: 4, headTilt: -6, hN, hF: [600, 880], smile: 0.5, blink: blink(t, 1.3), fN: [575, 1068], fF: [612, 1068] }, t).svg;
  o += `<rect x="${f1(hN[0] - 16)}" y="${f1(hN[1] - 4)}" width="22" height="8" rx="3" fill="#2a5ad8" transform="rotate(-30 ${f1(hN[0])} ${f1(hN[1])})"/>`;
  // Brodie takes notes
  const x = 200, g = 1068, s = 0.8;
  const nod = t > 32.6 && t < 34.4 ? Math.sin(t * 9) * 6 : 0;
  o += `<g transform="translate(330 1062) rotate(-4)"><rect x="-44" y="-8" width="88" height="10" rx="2" fill="#f8f4e8"/><path d="M -40 -6 L 40 -6" stroke="#9ab" stroke-width="1"/></g>`;
  o += dog({ breed: 'beagle', x, y: g, s, tilt: 34, hipLift: 38, neck: 40 + nod, headTilt: -6, lid: 0.15, brow: 0.6, earLift: 0.4, tailUp: 20, wag: 6, jaw: jaw('hero', t), look: [0.6, -1], acc: { glasses: true, pen: true }, paws: sitPaws(x, g, s) }, t).svg;
  o += gradeW('#ffe8c0', 0.1);
  return cam([370, 820], [360, 760], lerp(1.04, 1.1, prog(t, C.board, C.night)), o);
}
function sceneNight(t) {
  const tRed = C.night + 0.2, tGreen = 36.4, tClick = 36.45;
  let o = room(0);
  o += `<rect x="470" y="300" width="190" height="230" fill="#0e1428" stroke="#3a2c22" stroke-width="10"/><circle cx="600" cy="360" r="24" fill="#fff8dc" filter="url(#glow)"/>`;
  o += stickyNote(120, 420, -6, 'RISK 1%') + stickyNote(260, 400, 5, 'WAIT', '#9ff0c0') + stickyNote(190, 520, -2, 'NO REVENGE', '#ffc0d8');
  o += `<g transform="translate(380 420)"><rect x="-56" y="-60" width="112" height="120" rx="6" fill="#f8f4ea"/><rect x="-56" y="-60" width="112" height="30" rx="6" fill="#c8202a"/>${text(0, -38, 'DAY', { size: 18, fill: '#fff', family: 'Anton', weight: 400 })}${text(0, 34, String(Math.round(lerp(214, 236, prog(t, C.night, C.five)))), { size: 50, fill: '#222', family: 'Anton', weight: 400 })}</g>`;
  o += `<rect x="200" y="900" width="460" height="16" rx="4" fill="#5a3a22"/><path d="M 230 916 L 230 1060 M 630 916 L 630 1060" stroke="#3a2416" stroke-width="12"/>`;
  o += deskLamp(600, 900) + mug(560, 900) + mug(590, 900, '#ffd23a') + mug(575, 870, '#3a8ad8');
  const red = t < tGreen;
  o += laptopFront(420, 900, 0.85, (x0, y0, w, h) => `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${red ? '#1a0a0c' : '#081a10'}"/>${miniChart(x0 + 4, y0 + 18, w - 8, h - 22, red ? 'red' : 'green', t, 12)}${text(x0 + w / 2, y0 + 16, red ? 'NO SETUP' : 'SETUP ✓', { size: 14, fill: red ? '#ff6a6a' : '#4cff9a', family: 'Anton', weight: 400, ls: 1 })}`);
  // Brodie at the desk
  const x = 200, g = 1060, s = 0.8;
  const hands = t > 34.9 && t < tGreen ? ease.out(prog(t, 34.9, 35.15)) : 0;
  const click = bump(t, tClick - 0.1, tClick + 0.12);
  const happy = t > tGreen + 0.1, hop = happy ? Math.abs(Math.sin((t - tGreen) * 10)) * 16 : 0;
  const fN = mix(mix([300, 896], [262, 820], hands), [320, 900], click), fF = mix([288, 898], [256, 830], hands);
  o += dog({ breed: 'beagle', x, y: g - hop, s, tilt: 64, hipLift: 30, neck: happy ? 30 : 20, headTilt: 0, lid: hands > 0.5 ? 0.35 : 0.15, brow: hands > 0.5 ? 1 : happy ? -0.2 : 0.3, earLift: happy ? 0.9 : 0.4, tailUp: happy ? 55 : 15, wag: happy ? 40 : 4, wagSpeed: 28, jaw: jaw('hero', t), tongue: happy ? 0.4 : 0, look: [1, 0.3], sparkle: happy, paws: uprightPaws(x, g - hop, s, 1, [fN[0], fN[1] - hop], [fF[0], fF[1] - hop]) }, t).svg;
  o += `<rect x="60" y="960" width="200" height="14" rx="4" fill="#3a2a5a"/><path d="M 80 974 L 80 1060 M 240 974 L 240 1060" stroke="#2a1e3a" stroke-width="8"/>`;
  if (t > tGreen && t < tGreen + 0.5) o += star(420, 760, 50 * ease.back(prog(t, tGreen, tGreen + 0.3)), 1 - prog(t, tGreen + 0.3, tGreen + 0.5), '#b8ffd0');
  o += gradeW('#5a5a9a', 0.15);
  return cam([380, 840], [360, 780], 1.12, o);
}
function sceneFive(t) {
  const tHit = 38.25, tFlip = 39.3;
  let o = room(1) + `<rect x="620" y="300" width="120" height="300" fill="#bfe2f6" stroke="#8a6a42" stroke-width="10"/>`;
  o += `<g transform="translate(-40 0)">${whiteboard(40, C.board)}</g>`;
  // the wall calendar, pages flying off
  const cx = 150, cy = 300;
  o += `<rect x="${cx - 60}" y="${cy - 66}" width="120" height="132" rx="6" fill="#f8f4ea" stroke="#999" stroke-width="2"/>`;
  const nP = Math.floor(clamp((t - tFlip) / 1.0) * 23);
  o += `<rect x="${cx - 60}" y="${cy - 66}" width="120" height="30" rx="6" fill="#c8202a"/>${text(cx, cy - 44, 'MONTH', { size: 16, fill: '#fff', family: 'Anton', weight: 400 })}${text(cx, cy + 40, String(nP + 1), { size: 60, fill: '#222', family: 'Anton', weight: 400 })}`;
  for (let k = 0; k < nP; k++) {
    const tk = tFlip + (k / 23) * 1.0, u = prog(t, tk, tk + 0.6);
    if (u >= 1) continue;
    o += `<g transform="translate(${f1(cx + u * 300 + k * 7)} ${f1(cy - u * 220 + u * u * 160)}) rotate(${f1(u * 160 + k * 13)})" opacity="${f1(1 - u)}"><rect x="-60" y="-50" width="120" height="100" fill="#f8f4ea" stroke="#bbb"/>${text(0, 22, String(k + 1), { size: 44, fill: '#444', family: 'Anton', weight: 400 })}</g>`;
  }
  // high five
  const reach = ease.inOut(prog(t, C.five, tHit)), down = ease.inOut(prog(t, tHit + 0.5, tHit + 0.9));
  const handP = mix([500, 880], [430, 760], reach);
  o += human({ x: 560, y: 1068, s: 0.98, flip: -1, lean: 4, headTilt: 2, hN: mix(handP, [500, 900], down), hF: [570, 880], smile: 0.8, blink: blink(t, 2.1), mouth: tjrMouth(t), fN: [528, 1068], fF: [560, 1068] }, t).svg;
  const x = 300, g = 1068, s = 0.82;
  const jump = bump(t, C.five + 0.05, tHit + 0.35) * 80;
  o += dog({ breed: 'beagle', x, y: g - jump, s, tilt: 70, hipLift: 30, neck: 32, lid: 0.05, brow: 0.2, earLift: 0.9, earSwing: jump * 0.2, tailUp: 55, wag: 40, wagSpeed: 30, tongue: 0.5, sparkle: true, look: [1, -0.6], paws: uprightPaws(x, g - jump, s, 1, mix([x + 60, g - 150 - jump], [424, 768], reach * (1 - down)), [x + 40, g - 140 - jump]) }, t).svg;
  if (t > tHit && t < tHit + 0.45) o += star(428, 762, 70 * ease.back(prog(t, tHit, tHit + 0.2)), 1 - prog(t, tHit + 0.25, tHit + 0.45), '#fff6c0');
  o += gradeW('#ffe8c0', 0.1);
  const zz = ease.in(prog(t, 39.7, C.later));
  return cam(mix([380, 820], [cx, cy], zz), [360, 760], lerp(1.04, 4.5, zz), o);
}

// ---------- 10. two years later ----------
function sceneLater(t) {
  const u = prog(t, C.later, C.rich), op = prog(t, C.later + 0.1, C.later + 0.5) * (1 - prog(t, C.rich - 0.3, C.rich));
  return `<rect x="-100" y="-100" width="920" height="1400" fill="#0c0906"/><g opacity="${op.toFixed(2)}">${text(360, 620, '2 YEARS LATER', { size: 96, fill: '#f2d9a0', family: 'Anton', weight: 400, ls: lerp(18, 6, ease.out(u)) })}${text(360, 690, '(14 in dog years)', { size: 34, fill: '#bfa77a', family: 'Oswald', weight: 500 })}</g>`;
}

// ---------- 11. the drive ----------
function driver(t, o2 = {}) {
  let o = `<path d="M -110 -70 Q -110 -102 -76 -102 L -52 -102 Q -38 -102 -40 -70 Z" fill="#c8915a"/>`;
  o += dog({ breed: 'beagle', x: -60, y: -6, s: 0.84, tilt: 64, hipLift: 34, neck: o2.neck ?? 22, headTilt: o2.headTilt ?? 0, lid: o2.lid ?? 0.15, brow: o2.brow ?? 0.4, earLift: 0.3, earSwing: 30 + Math.sin(t * 14) * 14, tailUp: 30, jaw: jaw('hero', t), wink: o2.wink, acc: { ...RICH, shadesDrop: o2.drop ?? 0 }, noShadow: true, paws: { hN: [-100, -6], hF: [-110, -6], fN: o2.fN || [44, -104], fF: [36, -98] } }, t).svg;
  o += `<line x1="62" y1="-64" x2="44" y2="-92" stroke="#555" stroke-width="5"/><ellipse cx="40" cy="-98" rx="9" ry="26" transform="rotate(-18 40 -98)" fill="none" stroke="#222" stroke-width="6"/>`;
  return o;
}
function sceneRich(t) {
  const t0 = C.rich, tExit = 49.0;
  const speed = 700, scroll = (t - t0) * speed;
  let o = `<rect x="-300" y="-300" width="1400" height="1700" fill="url(#daySky)"/><circle cx="560" cy="240" r="70" fill="#fff6c8" filter="url(#glow)"/>`;
  o += `<g transform="translate(${f1(-((scroll * 0.15) % 1320))} 0)">${skyline(t, 52, 1)}<g transform="translate(1320 0)">${skyline(t, 52, 1)}</g></g>`;
  let palms = '';
  for (let i = 0; i < 8; i++) { const px = ((i * 260 - scroll * 0.6) % 2080 + 2080) % 2080 - 300; palms += palm(px, 1040, 0.9, t); }
  o += palms;
  o += `<rect x="-300" y="1010" width="1400" height="50" fill="#d8d0c0"/><rect x="-300" y="1056" width="1400" height="400" fill="#4a4c54"/>`;
  for (let i = 0; i < 9; i++) { const lx = ((i * 200 - scroll) % 1800 + 1800) % 1800 - 300; o += `<rect x="${f1(lx)}" y="1186" width="110" height="10" fill="#f2e6b0"/>`; }
  // the road sign to Kibble King
  const sx = lerp(1100, -500, prog(t, 47.6, 49.4));
  o += `<g transform="translate(${f1(sx)} 0)"><rect x="-6" y="760" width="12" height="260" fill="#6a6a70"/><rect x="-140" y="680" width="280" height="96" rx="8" fill="#1f6a3a" stroke="#fff" stroke-width="5"/>${text(-14, 724, 'KIBBLE KING', { size: 30, fill: '#fff', family: 'Anton', weight: 400 })}${text(-14, 760, '0.5 MI', { size: 24, fill: '#fff', family: 'Oswald', weight: 700 })}<path d="M 96 714 L 126 728 L 96 742 Z" fill="#fff"/></g>`;
  const cx = t < tExit ? lerp(-420, 360, ease.out(prog(t, t0, t0 + 1.1))) : lerp(360, 1300, ease.in(prog(t, tExit, tExit + 1.2)));
  const bob = Math.sin(t * 13) * 2;
  const sees = ease.inOut(prog(t, 47.9, 48.3)) * (1 - ease.inOut(prog(t, 49.0, 49.3)));
  const adj = bump(t, 44.0, 44.6);
  o += luxCar(t, cx, 1120 + bob, { col: 'blue', s: 0.72, seats: false, wheelRot: scroll, under: driver(t, { headTilt: -sees * 18, drop: sees * 0.7, brow: sees ? 0.8 : 0.4, fN: mix([44, -104], [30, -128], adj) }) });
  for (let i = 0; i < 5; i++) { const y = 1080 + i * 22, p = (t * 4 + i * 0.3) % 1; o += `<line x1="${f1(cx - 300 - p * 200)}" y1="${y}" x2="${f1(cx - 260 - p * 200)}" y2="${y}" stroke="#fff" stroke-width="3" opacity="${f1(0.4 * (1 - p))}"/>`; }
  // camera: wide, close on the watch, then wide again for the sign
  const head = [cx + (-60 + 24) * 0.72, 1120 - 150 * 0.72];
  const zin = ease.inOut(prog(t, 43.7, 44.3)) * (1 - ease.inOut(prog(t, 45.4, 46.0)));
  const mid = ease.inOut(prog(t, 45.4, 46.0)) * (1 - ease.inOut(prog(t, 47.4, 47.9)));
  let F = [360, 900], z = 1.0;
  F = mix(F, [cx + 10, 1020], zin); z = lerp(z, 1.9, zin);
  F = mix(F, [head[0] + 40, 980], mid); z = lerp(z, 1.35, mid);
  return cam(F, [360, 760], z, o) + phoneNotif(t, 44.8, 47.6);
}

// ---------- 12. back at the store ----------
function sceneStore(t) {
  const t0 = C.store, tStop = 51.4, tDrop = 51.7, tShades = 53.2, tCheck = 53.5, tFaint = 55.9;
  const S = storefront(t, { day: 1, hiring: 1 });
  let o = S.back + S.front;
  // the boss, under his own private rain cloud
  const g0 = 1000, bs = 0.82;
  const walkU = prog(t, t0, tDrop - 0.2);
  const bx = lerp(380, 520, walkU);
  const turned = t > tDrop;
  const faint = ease.in(prog(t, tFaint, tFaint + 0.45));
  const bounce = t > tFaint + 0.45 ? Math.sin((t - tFaint - 0.45) * 20) * Math.exp(-(t - tFaint - 0.45) * 6) * 6 : 0;
  const stunned = t > 52.0;
  const boss = dog({ breed: 'boss', x: bx, y: g0, s: bs, flip: turned ? -1 : 1, neck: faint > 0 ? 10 : stunned ? 26 : 8, headTilt: 0, lid: faint > 0.9 ? 1 : stunned ? 0 : 0.45, pop: stunned && faint < 0.5 ? 1 : 0, brow: stunned ? -0.3 : -0.8, earLift: stunned ? 0.9 : 0.1, tailUp: faint > 0 ? 80 : -10, jaw: stunned && t < tFaint ? Math.max(0.35, jaw('boss', t)) : jaw('boss', t), wet: 1, acc: { uniform: MGR }, paws: !turned ? walkPaws(bx, g0, bs, t * 8, 16, 8) : faint > 0 ? { fN: [bx - 70 - 20 * faint, g0 + 10 * faint], fF: [bx - 50 - 20 * faint, g0 + 6 * faint], hN: [bx + 40 + 20 * faint, g0 + 10 * faint], hF: [bx + 60 + 20 * faint, g0 + 6 * faint] } : null }, t);
  const pivot = [bx + 10, g0 - 62 * bs];
  o += `<g transform="translate(0 ${f1(faint * 30 * bs + Math.abs(bounce))}) rotate(${f1(faint * 180 + bounce)} ${f1(pivot[0])} ${f1(pivot[1])})">${boss.svg}</g>`;
  // trash bag: carried, then dropped
  if (t < tDrop) o += `<path transform="translate(${f1(boss.head[0] + 30)} ${f1(boss.head[1] + 50)})" d="M -6 -30 Q -30 -10 -26 20 Q 0 32 26 20 Q 30 -10 6 -30 Z" fill="#1a1a1e"/>`;
  else { const u = prog(t, tDrop, tDrop + 0.25); o += `<path transform="translate(${f1(bx - 40)} ${f1(lerp(920, 984, ease.in(u)))})" d="M -6 -30 Q -30 -10 -26 20 Q 0 32 26 20 Q 30 -10 6 -30 Z" fill="#1a1a1e"/>`; }
  const cloudAt = faint > 0 ? [pivot[0], g0 - 260] : [boss.head[0], boss.head[1] - 150];
  o += cloudGag(cloudAt[0], cloudAt[1], t, 1);
  if (t > tFaint + 0.5) o += birdsCircling(pivot[0] - 60, g0 - 40, t);
  // the car pulls up
  const cx = lerp(-420, 200, ease.out(prog(t, t0 + 0.2, tStop)));
  const drop = ease.inOut(prog(t, tShades, tShades + 0.3));
  const hold = ease.out(prog(t, tCheck, tCheck + 0.35));
  o += luxCar(t, cx, 1064, { col: 'blue', s: 0.72, seats: false, wheelRot: cx, under: driver(t, { neck: 18 + drop * 4, drop, brow: 0.6, fN: mix([44, -104], [70, -170], hold) }) });
  if (hold > 0) o += giantCheck(lerp(cx + 40, 330, hold), lerp(1000, 800, hold), 0.85 * hold, lerp(-30, -4, hold));
  if (t > tCheck && t < tCheck + 0.6) o += sparkles(t, 33, [150, 680, 520, 920], 16);
  // camera
  const zb = ease.inOut(prog(t, 51.8, 52.2)) * (1 - ease.inOut(prog(t, 53.2, 53.6)));
  let F = [380, 780], z = 1.02;
  F = mix(F, [boss.head[0] - 20, boss.head[1] + 30], zb); z = lerp(z, 1.8, zb);
  const two = ease.inOut(prog(t, 53.2, 53.6));
  F = mix(F, [400, 830], two); z = lerp(z, 1.12, two);
  return cam(F, [360, 760], z, o);
}

// ---------- 13. new management ----------
function shopInterior(t) {
  let o = `<rect x="-200" y="-300" width="1120" height="1700" fill="#f3ead8"/>`;
  o += `<rect x="70" y="330" width="600" height="66" rx="6" fill="#c8202a"/>${text(370, 378, 'UNDER NEW MANAGEMENT', { size: 42, fill: '#ffd23a', family: 'Anton', weight: 400, ls: 2 })}`;
  const cols = ['#e8a23a', '#d8342a', '#3a8ad8', '#3aa860', '#9a5ad8', '#e8a23a', '#3a8ad8'];
  for (let row = 0; row < 3; row++) {
    const sy = 560 + row * 160;
    o += `<rect x="330" y="${sy}" width="420" height="12" fill="#8a5a2a"/>`;
    for (let k = 0; k < 6; k++) if (!(row === 2 && k < 2)) o += kibbleBag(366 + k * 64, sy, 0.78, cols[(k + row * 3) % 7]);
  }
  // the portrait
  o += `<rect x="96" y="440" width="210" height="240" rx="6" fill="#d4a72c" stroke="#8a6410" stroke-width="6"/><rect x="113" y="457" width="176" height="190" fill="#3a2a5a"/>`;
  o += `<g clip-path="url(#portraitClip)">${dogFront(201, 552, 0.9, { breed: 'beagle', acc: { shades: 1, chain: true, collar: true } }, t)}</g>`;
  o += `<rect x="145" y="650" width="112" height="34" rx="4" fill="#8a6410"/>${text(201, 676, 'OWNER', { size: 24, fill: '#ffe9a0', family: 'Anton', weight: 400, ls: 2 })}`;
  o += `<rect x="-200" y="1060" width="1120" height="400" fill="#e6e0d4"/>`;
  for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) o += `<rect x="${-200 + i * 100}" y="${1060 + j * 70}" width="100" height="70" fill="#c9c0b0"/>`;
  return o;
}
function sceneOwner(t) {
  const tSneak = 59.9, tCrunch = 60.15, tBark = 60.5, tWhine = 62.3;
  let o = shopInterior(t);
  // the trainee
  const bx = 560, g = 1060, bs = 0.8;
  const stack = bump(t, C.owner + 0.1, 59.4);
  const sneak = ease.inOut(prog(t, tSneak - 0.3, tSneak)) * (1 - ease.inOut(prog(t, tBark, tBark + 0.2)));
  const caught = t > tBark;
  const look = t > 59.4 && t < tSneak - 0.3 ? Math.sin((t - 59.4) * 12) * 14 : 0;
  o += kibbleBag(450, g, 0.9, '#e8a23a', 0, { bite: true });
  const tr = dog({ breed: 'boss', x: bx, y: g, s: bs, flip: -1, neck: lerp(18, -20, sneak) + stack * 30, headTilt: look, lid: caught ? 0 : 0.3, pop: caught ? 1 : 0, brow: caught ? -0.8 : -0.2, earLift: caught ? 0.9 : 0.3, tailUp: caught ? 60 : 0, jaw: t > tCrunch && t < tBark ? 0.3 + 0.3 * Math.abs(Math.sin(t * 20)) : jaw('boss', t), acc: { uniform: TRAINEE, visor: '#d8342a' } }, t);
  o += tr.svg;
  if (stack > 0) o += kibbleBag(tr.head[0] - 30, tr.head[1] + 40 - stack * 40, 0.6, '#3a8ad8');
  if (caught) o += `<circle cx="${f1(tr.head[0] - 26)}" cy="${f1(tr.head[1] + 4)}" r="11" fill="#9a9aa4"/>` + kibbles(tr.head[0] - 40, tr.head[1] + 30 + ((t * 120) % 60), 3, Math.floor(t * 3), 16);
  if (t > tWhine) { const p = (t * 1.2) % 1; o += `<path transform="translate(${f1(tr.head[0] + 18)} ${f1(tr.head[1] - 30 + p * 20)})" d="M 0 -8 Q 6 2 0 6 Q -6 2 0 -8 Z" fill="#8fd3ff" opacity="${f1(1 - p)}"/>`; }
  // the owner
  const x = 190, s = 0.86;
  const stern = t > tBark - 0.1;
  o += dog({ breed: 'beagle', x, y: g, s, neck: stern ? 26 : 18, headTilt: 0, lid: stern ? 0.35 : 0.2, brow: stern ? 1 : 0.4, earLift: stern ? 0.6 : 0.3, tailUp: 30, wag: stern ? 0 : 10, jaw: jaw('hero', t), acc: { chain: true, collar: true, watch: true, shades: 1, shadesDrop: stern ? 0.6 : 0 } }, t).svg;
  if (t > tBark && t < tBark + 0.4) o += `<text x="${f1(tr.head[0] + 20)}" y="${f1(tr.head[1] - 60)}" font-family="Anton" font-size="60" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke">!</text>`;
  o += gradeW('#ffe8c0', 0.08);
  const zz = ease.inOut(prog(t, 62.1, 62.5));
  return cam(mix([375, 905], [470, 930], zz), [360, 760], lerp(1.25, 1.45, zz), o);
}

// ---------- 14. the owner's stash, the wink ----------
function sceneStash(t) {
  const t0 = C.stash, tWink = 65.4;
  let o = `<g filter="url(#blur10)">${shopInterior(t)}</g><rect width="720" height="1280" fill="#000" opacity="0.15"/>`;
  const chew = t > 64.25 && t < 65.1 ? Math.abs(Math.sin((t - 64.25) * 14)) : 0;
  const drop = ease.inOut(prog(t, 64.95, 65.25)), wink = t > tWink && t < tWink + 0.6 ? 1 : 0;
  o += dogFront(360, 560 + chew * 6, 2.3, { breed: 'beagle', wink, tongue: wink ? 0.3 : 0, earLift: 0.3, acc: { chain: true, collar: true, shades: 1 - drop * 0.999, shadesDrop: drop } }, t);
  if (chew > 0) for (const dx of [-1, 1]) o += `<ellipse cx="${f1(360 + dx * (78 + chew * 10))}" cy="${f1(632 + chew * 6)}" rx="${f1(26 + chew * 10)}" ry="${f1(22 + chew * 8)}" fill="#f8f2e8"/>`;
  // golden stash bag
  const bagIn = ease.out(prog(t, t0, t0 + 0.4));
  o += `<g transform="translate(${f1(lerp(820, 580, bagIn))} 1030)">${kibbleBag(0, 0, 2.2, '#d4a72c', -8, { label: "OWNER'S STASH" })}</g>`;
  const toss = prog(t, 64.0, 64.3);
  if (toss > 0 && toss < 1) o += kibbles(lerp(560, 360, toss), lerp(840, 700, toss) - Math.sin(toss * Math.PI) * 120, 1, 3, 1);
  if (wink) o += star(300, 520, 60 * ease.back(prog(t, tWink, tWink + 0.25)), 1 - prog(t, tWink + 0.35, tWink + 0.6), '#fff6c0');
  o += sparkles(t, 64, [120, 300, 600, 900], 12);
  let out = zoomAt(360, 640, lerp(1.0, 1.06, prog(t, t0, C.endcard + 3)), o);
  return out;
}
function endCard(t) {
  const u = prog(t, C.endcard, C.endcard + 0.6);
  return `<rect width="720" height="1280" fill="#000" opacity="${(0.72 * u).toFixed(2)}"/><g opacity="${u.toFixed(2)}">${text(360, 500, 'MORAL:', { size: 34, fill: '#f2d9a0', family: 'Oswald', weight: 500, ls: 4 })}${text(360, 570, 'Get fired. Get focused.', { size: 50, fill: '#fff', family: 'Oswald', weight: 700 })}${text(360, 636, 'Get the store.', { size: 50, fill: '#ffd23a', family: 'Oswald', weight: 700 })}${text(360, 720, 'Fictional story · Synthetic voices · Not financial advice.', { size: 24, fill: '#bfa77a', family: 'Oswald', weight: 500 })}<g transform="translate(360 820)" fill="#f2d9a0"><ellipse cx="0" cy="14" rx="26" ry="22"/><ellipse cx="-30" cy="-16" rx="10" ry="13"/><ellipse cx="-10" cy="-30" rx="10" ry="13"/><ellipse cx="12" cy="-30" rx="10" ry="13"/><ellipse cx="32" cy="-16" rx="10" ry="13"/></g></g>`;
}

// ---------- compose ----------
const DEFS = `<defs>${DEFS_COMMON}${dogDefs()}${humanDefs()}${dogSceneDefs()}
  <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9fd8ff" stop-opacity="0.45"/><stop offset="1" stop-color="#9fd8ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="pinkGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff9ac8" stop-opacity="0.6"/><stop offset="1" stop-color="#ff9ac8" stop-opacity="0"/></radialGradient>
  <linearGradient id="posterSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a5a"/><stop offset="1" stop-color="#ffd36a"/></linearGradient>
  <clipPath id="portraitClip"><rect x="113" y="457" width="176" height="190"/></clipPath>
</defs>`;
const SCENES = [[0, C.walk, sceneFired], [C.walk, C.chat, sceneWalk], [C.chat, C.screen, sceneChat], [C.screen, C.shock, sceneScreen],
  [C.shock, C.beg, sceneShock], [C.beg, C.board, sceneBeg], [C.board, C.night, sceneBoard], [C.night, C.five, sceneNight],
  [C.five, C.later, sceneFive], [C.later, C.rich, sceneLater], [C.rich, C.store, sceneRich], [C.store, C.owner, sceneStore],
  [C.owner, C.stash, sceneOwner], [C.stash, Infinity, sceneStash]];
const sceneAt = (t) => { for (const [a, b, fn] of SCENES) if (t >= a && t < b) return fn(t); return ''; };

const stage = document.getElementById('stage');
stage.innerHTML = DEFS + '<g id="frame"></g>';
const frameEl = document.getElementById('frame');
window.ready = new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = '../../assets/img/grain.png'; });

window.renderFrame = function (t) {
  let o = sceneAt(t);
  for (const c of [C.walk, C.beg, C.board, C.later, C.rich, C.store, C.owner]) {
    const d = Math.abs(t - c);
    if (d < 0.16) o += `<rect width="720" height="1280" fill="#000" opacity="${(1 - d / 0.16).toFixed(2)}"/>`;
  }
  for (const c of [C.screen, C.shock, C.stash]) if (t > c && t < c + 0.08) o += `<rect width="720" height="1280" fill="#fff" opacity="${f1(0.7 * (1 - (t - c) / 0.08))}"/>`;
  if (t > C.endcard) o += endCard(t);
  const gx = Math.floor(rng(Math.floor(t * 24))() * 256), gy = Math.floor(rng(Math.floor(t * 24) + 7)() * 256);
  o += `<rect width="720" height="1280" fill="url(#vignette)" opacity="0.8"/><rect x="${-gx}" y="${-gy}" width="1100" height="1600" fill="url(#grain)" opacity="0.1" style="mix-blend-mode:overlay"/>`;
  o += dogSub(t, TL.subs, 1150);
  const dip = Math.max(t < 0.4 ? 1 - t / 0.4 : 0, prog(t, window.DURATION - 0.5, window.DURATION - 0.05));
  if (dip > 0) o += `<rect width="720" height="1280" fill="#000" opacity="${clamp(dip).toFixed(3)}"/>`;
  frameEl.innerHTML = o;
};
