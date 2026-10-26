'use strict';
// Scene helpers for dog episodes: camera, bark-driven jaws, poses, weather,
// city props and effects. Uses lib/stickkit.js + lib/doggo.js.

function cam(F, P, z, body) {
  return `<g transform="translate(${f1(P[0] - z * F[0])} ${f1(P[1] - z * F[1])}) scale(${z.toFixed(4)})">${body}</g>`;
}
const BARK_DUR = { bark: 0.17, yip: 0.085, woof: 0.3, boof: 0.22 };
// jaw opening (0..1) for a character at time t, from the timeline's barks
function jawFrom(TL, who, t) {
  let j = 0;
  for (const b of TL.barks) {
    if (b.who !== who) continue;
    if (BARK_DUR[b.type]) {
      for (let k = 0; k < (b.n || 1); k++) {
        const tk = b.t + k * (b.gap || 0), d = BARK_DUR[b.type] + 0.08;
        if (t >= tk && t < tk + d) j = Math.max(j, Math.sin((Math.PI * (t - tk)) / d));
      }
    } else if (t >= b.t && t < b.t + (b.dur || 0.25)) {
      const u = (t - b.t) / (b.dur || 0.25);
      const v = { whine: 0.2 + 0.06 * Math.sin(t * 40), howl: 0.75 * clamp(u * 6) * clamp((1 - u) * 5), growl: 0.16, huff: 0.12, stomach: 0, grumble: 0.12 }[b.type] ?? 0;
      j = Math.max(j, v);
    }
  }
  return j;
}
function walkPaws(x, g, s, ph, stride = 26, lift = 14, sx = 64, hx = -62, f = 1) {
  const P = (base, o) => [x + f * base * s + f * stride * s * Math.sin(ph + o), g - Math.max(0, Math.cos(ph + o)) * lift * s];
  return { fN: P(sx + 6, 0), fF: P(sx - 4, Math.PI), hN: P(hx + 4, Math.PI), hF: P(hx - 6, 0) };
}
function sitPaws(x, g, s, f = 1) {
  return { hN: [x - f * 34 * s, g], hF: [x - f * 44 * s, g], fN: [x + f * 44 * s, g], fF: [x + f * 34 * s, g] };
}
function uprightPaws(x, g, s, f, fN, fF) {
  return { hN: [x - f * 50 * s, g], hF: [x - f * 60 * s, g], fN, fF };
}
function rainFx(t, op = 0.35, n = 70, seed = 2, box = null) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const x0 = r() * 820 - 50, sp = 1500 + r() * 600, ph = r(), len = 26 + r() * 30;
    const y = ((t * sp + ph * 1500) % 1500) - 120, x = x0 - y * 0.12;
    if (box && x > box[0] && x < box[2] && y > box[1] && y < box[3]) continue;
    o += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - len * 0.12)}" y2="${f1(y + len)}" stroke="#cfe6ff" stroke-width="1.6" opacity="${op}"/>`;
  }
  return o;
}
const DS_BRICKS = (() => {
  const r = rng(77); const rows = [];
  for (let y = 0; y < 1300; y += 30) {
    const off = (y / 30) % 2 ? 32 : 0, row = [];
    for (let x = -64 + off; x < 820; x += 64) row.push([x, y, 0.75 + r() * 0.35, r()]);
    rows.push(row);
  }
  return rows;
})();
function bricks(y0, y1, tint = [122, 58, 40]) {
  let o = `<rect x="-100" y="${y0}" width="920" height="${y1 - y0}" fill="#3a2a24"/>`;
  for (const row of DS_BRICKS) for (const [x, y, k, v] of row) {
    if (y < y0 || y > y1 - 26) continue;
    o += `<rect x="${x + 2}" y="${y + 2}" width="60" height="26" rx="2" fill="rgb(${tint.map((c) => Math.round(c * k)).join(',')})"/>`;
    if (v < 0.12) o += `<rect x="${x + 6}" y="${y + 6}" width="${f1(20 + v * 100)}" height="6" fill="#000" opacity="0.15"/>`;
  }
  return o;
}
function lampPost(x, groundY, t, lit = 1) {
  return `<rect x="${x - 5}" y="${groundY - 520}" width="10" height="520" fill="#2a2a2e"/><path d="M ${x} ${groundY - 520} Q ${x} ${groundY - 560} ${x + 50} ${groundY - 560}" stroke="#2a2a2e" stroke-width="8" fill="none"/><ellipse cx="${x + 56}" cy="${groundY - 552}" rx="16" ry="9" fill="#fff4cf" opacity="${lit}"/><circle cx="${x + 56}" cy="${groundY - 548}" r="220" fill="url(#lampGlow)" opacity="${0.9 * lit}"/><polygon points="${x + 44},${groundY - 546} ${x + 68},${groundY - 546} ${x + 200},${groundY} ${x - 90},${groundY}" fill="#ffe2a8" opacity="${0.07 * lit}"/>`;
}
function grade(col, op) { return `<rect x="-200" y="-200" width="1120" height="1680" fill="${col}" opacity="${op}" style="mix-blend-mode:multiply"/>`; }
function cloudGag(x, y, t, op) {
  if (op <= 0) return '';
  let o = `<g opacity="${op.toFixed(2)}">`;
  for (let i = 0; i < 10; i++) { const ph = (t * 2.4 + i * 0.29) % 1; o += `<line x1="${x - 60 + i * 13}" y1="${f1(y + 30 + ph * 170)}" x2="${x - 63 + i * 13}" y2="${f1(y + 46 + ph * 170)}" stroke="#9fc4ef" stroke-width="2.5"/>`; }
  o += `<g fill="#6f7a8a"><circle cx="${x - 40}" cy="${y}" r="34"/><circle cx="${x}" cy="${y - 20}" r="44"/><circle cx="${x + 44}" cy="${y}" r="32"/><rect x="${x - 70}" y="${y}" width="140" height="30" rx="15"/></g></g>`;
  return o;
}
function boneWithBow(x, y, rot = 0, sc = 1) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${sc})"><rect x="-26" y="-6" width="52" height="12" rx="6" fill="#f3ead8"/><circle cx="-26" cy="-7" r="8" fill="#f3ead8"/><circle cx="-26" cy="7" r="8" fill="#f3ead8"/><circle cx="26" cy="-7" r="8" fill="#f3ead8"/><circle cx="26" cy="7" r="8" fill="#f3ead8"/><path d="M 0 0 L -12 -10 L -12 10 Z M 0 0 L 12 -10 L 12 10 Z" fill="#ff4f7a"/><circle r="4" fill="#d02a5a"/></g>`;
}
function laptopFront(x, y, sc, screen) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})"><path d="M -110 0 L 110 0 L 128 16 L -128 16 Z" fill="#b9bec6"/><rect x="-100" y="-140" width="200" height="140" rx="8" fill="#2a2d33"/><rect x="-90" y="-130" width="180" height="120" rx="3" fill="#0c1016"/>${screen ? screen(-90, -130, 180, 120) : ''}<circle cx="0" cy="-135" r="2" fill="#555"/></g>`;
}
function stickyNote(x, y, rot, label, col = '#ffe66d') {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-58" y="-40" width="116" height="80" fill="${col}"/><rect x="-58" y="-40" width="116" height="12" fill="#000" opacity="0.06"/>${text(0, 8, label, { size: label.length > 10 ? 16 : 20, fill: '#3a2a10', family: 'Anton', weight: 400 })}</g>`;
}
function paparazzi(t, seed, rate = 1, box = [0, 300, 720, 900]) {
  const r = rng(Math.floor(t * 12 * rate) + seed);
  let o = '';
  if (r() < 0.55 * rate) {
    const x = r() < 0.5 ? box[0] + r() * 120 : box[2] - r() * 120, y = box[1] + r() * (box[3] - box[1]);
    o += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(60 + r() * 60)}" fill="url(#flashGlow)"/><path transform="translate(${f1(x)} ${f1(y)})" d="M 0 -40 L 6 -6 L 40 0 L 6 6 L 0 40 L -6 6 L -40 0 L -6 -6 Z" fill="#fff"/>`;
  }
  return o;
}
function scooter(x, y, sc, wheelRot = 0) {
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc})">`;
  for (const wx of [-70, 80]) o += `<g transform="translate(${wx} -28)"><circle r="28" fill="#1a1a1a"/><circle r="14" fill="#999"/><line x1="0" y1="0" x2="${f1(12 * Math.cos(wheelRot))}" y2="${f1(12 * Math.sin(wheelRot))}" stroke="#555" stroke-width="3"/></g>`;
  o += `<path d="M -100 -40 Q -90 -84 -30 -84 L 20 -84 Q 40 -60 70 -54 L 100 -50 L 96 -30 L -96 -28 Z" fill="#e8442a"/><path d="M 60 -60 L 84 -150" stroke="#333" stroke-width="7"/><path d="M 70 -152 L 104 -150" stroke="#333" stroke-width="7" stroke-linecap="round"/><ellipse cx="96" cy="-104" rx="10" ry="8" fill="#fff6c8"/>`;
  o += `<rect x="-120" y="-150" width="70" height="66" rx="8" fill="#e8442a"/><text x="-85" y="-110" font-family="Anton" font-size="14" fill="#fff" text-anchor="middle">DELIVERY</text>`;
  return o + '</g>';
}
function splashWave(x, y, t, t0) {
  if (t < t0 || t > t0 + 1.0) return '';
  const u = prog(t, t0, t0 + 1.0), r = rng(17); let o = '';
  o += `<path d="M ${x - 60} ${y} Q ${f1(x - 160 - u * 80)} ${f1(y - 260 * Math.sin(u * Math.PI))} ${f1(x - 340 - u * 120)} ${f1(y - 60 + u * 80)} L ${f1(x - 300)} ${y} Z" fill="#7fb4e6" opacity="${f1(0.85 * (1 - u))}"/>`;
  for (let i = 0; i < 30; i++) {
    const vx = -200 - r() * 400, vy = -300 - r() * 400, lt = (t - t0);
    const px = x - 40 + vx * lt, py = y + vy * lt + 900 * lt * lt;
    if (py > y + 40) continue;
    o += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(3 + r() * 6)}" fill="#a9d2ff" opacity="${f1(1 - u)}"/>`;
  }
  return o;
}
function dogSceneDefs() {
  return `<radialGradient id="lampGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
  <radialGradient id="flashGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="warmWin" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#7a3a1a"/></radialGradient>
  <linearGradient id="eveSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d3a"/><stop offset="1" stop-color="#5a4a7a"/></linearGradient>
  <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f"/><stop offset="1" stop-color="#1a1a34"/></linearGradient>
  <linearGradient id="daySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cc6f0"/><stop offset="1" stop-color="#dff0fb"/></linearGradient>
  <pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse"><image href="../../assets/img/grain.png" width="256" height="256"/></pattern>
  <filter id="sepia"><feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0"/></filter>`;
}
