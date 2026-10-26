'use strict';
// "Rags to Riches: Dog Edition". A stray dog, a breakup, a window into TJR's
// workshop, a laptop from the trash, and a gold car. Timing comes from timeline.js.

const TL = window.TL;
const C = TL.cuts;
window.DURATION = TL.duration;

function cam(F, P, z, body) {
  return `<g transform="translate(${f1(P[0] - z * F[0])} ${f1(P[1] - z * F[1])}) scale(${z.toFixed(4)})">${body}</g>`;
}
const BARK_DUR = { bark: 0.17, yip: 0.085, woof: 0.3, boof: 0.22 };
function jawOf(who, t) {
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
      const v = { whine: 0.2 + 0.06 * Math.sin(t * 40), howl: 0.75 * clamp(u * 6) * clamp((1 - u) * 5), growl: 0.14, huff: 0.12, stomach: 0, grumble: 0.12 }[b.type] ?? 0;
      j = Math.max(j, v);
    }
  }
  return j;
}
function walkPaws(x, g, s, ph, stride = 26, lift = 14, sx = 64, hx = -62) {
  const P = (base, o) => [x + base * s + stride * s * Math.sin(ph + o), g - Math.max(0, Math.cos(ph + o)) * lift * s];
  return { fN: P(sx + 6, 0), fF: P(sx - 4, Math.PI), hN: P(hx + 4, Math.PI), hF: P(hx - 6, 0) };
}
function sitPaws(x, g, s) {
  return { hN: [x - 34 * s, g], hF: [x - 44 * s, g], fN: [x + 44 * s, g], fF: [x + 34 * s, g] };
}
function rainFx(t, op = 0.35, n = 70, seed = 2) {
  const r = rng(seed); let o = '';
  for (let i = 0; i < n; i++) {
    const x0 = r() * 820 - 50, sp = 1500 + r() * 600, ph = r(), len = 26 + r() * 30;
    const y = ((t * sp + ph * 1500) % 1500) - 120, x = x0 - y * 0.12;
    o += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - len * 0.12)}" y2="${f1(y + len)}" stroke="#cfe6ff" stroke-width="1.6" opacity="${op}"/>`;
  }
  return o;
}
const BRICKS = (() => {
  const r = rng(77); const rows = [];
  for (let y = 0; y < 1100; y += 30) {
    const off = (y / 30) % 2 ? 32 : 0, row = [];
    for (let x = -64 + off; x < 760; x += 64) row.push([x, y, 0.75 + r() * 0.35, r()]);
    rows.push(row);
  }
  return rows;
})();
function bricks(h = 1000, tint = [122, 58, 40]) {
  let o = `<rect x="-100" y="-100" width="920" height="${h + 100}" fill="#3a2a24"/>`;
  for (const row of BRICKS) for (const [x, y, k, v] of row) {
    if (y > h) continue;
    const c = tint.map((ch) => Math.round(ch * k)).join(',');
    o += `<rect x="${x + 2}" y="${y + 2}" width="60" height="26" rx="2" fill="rgb(${c})"/>`;
    if (v < 0.15) o += `<rect x="${x + 6}" y="${y + 6}" width="${f1(20 + v * 100)}" height="6" fill="#000" opacity="0.15"/>`;
  }
  return o;
}
function cardboardBox(x, y, w, h, front) {
  if (!front) return `<path d="M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y - h} L ${x} ${y - h} Z" fill="#7a5530"/><path d="M ${x + 10} ${y} L ${x + w - 10} ${y} L ${x + w - 10} ${y - h + 10} L ${x + 10} ${y - h + 10} Z" fill="#4d3418"/>`;
  let o = `<path d="M ${x - 6} ${y - h} L ${x + w + 6} ${y - h} L ${x + w} ${y - h + 18} L ${x} ${y - h + 18} Z" fill="#b98a52"/>`;
  o += `<path d="M ${x - 4} ${y - h} L ${x - 60} ${y - h - 30} L ${x - 50} ${y - h + 10} Z" fill="#a67a45"/>`;
  o += `<rect x="${x}" y="${y - 48}" width="${w}" height="48" fill="#b48650"/><rect x="${x}" y="${y - 48}" width="${w}" height="48" fill="url(#boxShade)"/>`;
  o += `<rect x="${x + w / 2 - 22}" y="${y - h}" width="44" height="${h}" fill="#c9a46c" opacity="0.6"/>`;
  o += `<text x="${x + w / 2}" y="${y - 18}" font-family="Anton" font-size="18" fill="#5a3d1c" text-anchor="middle" transform="rotate(180 ${x + w / 2} ${y - 24})" opacity="0.8">THIS SIDE UP</text>`;
  return o;
}
function dumpster(x, y, lidOpen = 0) {
  let o = `<path d="M ${x} ${y} L ${x + 240} ${y} L ${x + 250} ${y - 220} L ${x - 10} ${y - 220} Z" fill="#2f5a3a"/><path d="M ${x} ${y} L ${x + 240} ${y} L ${x + 250} ${y - 220} L ${x - 10} ${y - 220} Z" fill="url(#metalShade)"/>`;
  for (let i = 1; i < 5; i++) o += `<line x1="${x + i * 48}" y1="${y - 210}" x2="${x + i * 48}" y2="${y - 6}" stroke="#244630" stroke-width="5"/>`;
  o += `<g transform="rotate(${f1(-lidOpen * 60)} ${x + 250} ${y - 222})"><rect x="${x - 16}" y="${y - 236}" width="272" height="18" rx="4" fill="#26472f"/></g>`;
  o += `<circle cx="${x + 30}" cy="${y + 6}" r="12" fill="#222"/><circle cx="${x + 210}" cy="${y + 6}" r="12" fill="#222"/>`;
  return o;
}
function lampGlow(x, y, r, col, op) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#lampGlow)" opacity="${op}"/>`;
}
function grade(col, op) { return `<rect x="-200" y="-200" width="1120" height="1680" fill="${col}" opacity="${op}" style="mix-blend-mode:multiply"/>`; }

// ---------- 1. homeless in the alley ----------
function sceneAlley(t) {
  let o = bricks(1000, [96, 48, 36]);
  o += `<rect x="-100" y="1000" width="920" height="400" fill="#141518"/><rect x="60" y="1000" width="60" height="300" fill="url(#lampRefl)" opacity="0.6"/>`;
  o += `<ellipse cx="560" cy="1120" rx="140" ry="22" fill="#2a3442" opacity="0.8"/>`;
  for (let i = 0; i < 5; i++) { const ph = (t * 1.3 + i * 0.37) % 1; o += `<ellipse cx="${500 + i * 28}" cy="${1116 + (i % 2) * 8}" rx="${f1(ph * 22)}" ry="${f1(ph * 5)}" fill="none" stroke="#9fb8d8" stroke-width="1.5" opacity="${f1(1 - ph)}"/>`; }
  o += `<path d="M 70 310 L 140 310" stroke="#222" stroke-width="8"/><path d="M 120 310 L 120 340 L 160 340" stroke="#222" stroke-width="6" fill="none"/>` + lampGlow(160, 352, 260, '#ffd38a', 0.9) + `<ellipse cx="160" cy="348" rx="18" ry="10" fill="#fff4cf"/>`;
  o += `<polygon points="145,355 175,355 330,1000 -10,1000" fill="#ffe2a8" opacity="0.08"/>`;
  o += dumpster(460, 1006, 0);
  o += cardboardBox(150, 1006, 300, 190, false);
  const lift = t > 1.25 && t < 3.6 ? ease.inOut(prog(t, 1.25, 1.6)) * (1 - ease.inOut(prog(t, 3.2, 3.6))) : 0;
  const lookBelly = t > 4.0 && t < 6.2 ? ease.inOut(prog(t, 4.0, 4.3)) * (1 - prog(t, 5.9, 6.2)) : 0;
  const shiver = Math.sin(t * 55) * 1.2;
  const x = 290 + shiver, g = 1004, s = 1.0;
  o += dog({ breed: 'stray', x, y: g, s, tilt: -3, hipLift: 60, neck: lerp(-6, 14, lift) - lookBelly * 18, headTilt: lookBelly * 18, lid: lerp(0.55, 0.3, lift), brow: -1, earLift: 0, tailUp: -10, jaw: jawOf('hero', t), dirt: 1, tear: lift > 0.5, look: [0, lookBelly], paws: { fN: [x + 130 * s, g], fF: [x + 120 * s, g], hN: [x - 10 * s, g], hF: [x - 20 * s, g] } }, t).svg;
  o += cardboardBox(150, 1006, 300, 190, true);
  if (lookBelly > 0) for (let i = 0; i < 3; i++) o += `<path d="M ${300 + i * 16} ${f1(940 + Math.sin(t * 20 + i) * 3)} q 6 -8 12 0 q 6 8 12 0" stroke="#fff" stroke-width="2.5" fill="none" opacity="${(0.7 * lookBelly).toFixed(2)}"/>`;
  o += rainFx(t, 0.32, 80, 2) + grade('#5a6c9a', 0.35);
  const z = lerp(1.45, 1.7, ease.inOut(prog(t, 0, C.breakup)));
  return cam([320, 930], [360, 780], z, o);
}

// ---------- 2. dumped on the park bench ----------
function bench(x, y) {
  let o = '';
  for (let i = 0; i < 3; i++) o += `<rect x="${x}" y="${y - 150 + i * 30}" width="420" height="20" rx="5" fill="#8a5a34"/><rect x="${x}" y="${y - 150 + i * 30}" width="420" height="6" rx="3" fill="#b07a4a"/>`;
  o += `<rect x="${x - 10}" y="${y - 10}" width="440" height="22" rx="6" fill="#9a6640"/><rect x="${x - 10}" y="${y - 10}" width="440" height="7" rx="3" fill="#c08a5a"/>`;
  for (const lx of [x + 20, x + 380]) o += `<path d="M ${lx} ${y + 10} L ${lx - 6} ${y + 120} M ${lx + 20} ${y + 10} L ${lx + 30} ${y + 120}" stroke="#2a2a2a" stroke-width="8"/>`;
  return o;
}
function treesBlur(t) {
  const r = rng(5); let o = '';
  for (let i = 0; i < 9; i++) o += `<circle cx="${f1(r() * 760)}" cy="${f1(520 + r() * 200)}" r="${f1(90 + r() * 70)}" fill="${['#4f6b4a', '#5c7a52', '#3f5a3e'][i % 3]}"/>`;
  return `<g filter="url(#blur10)">${o}</g>`;
}
function cloudGag(x, y, t, op) {
  let o = `<g opacity="${op.toFixed(2)}">`;
  for (let i = 0; i < 10; i++) { const ph = (t * 2.4 + i * 0.29) % 1; o += `<line x1="${x - 60 + i * 13}" y1="${f1(y + 30 + ph * 170)}" x2="${x - 63 + i * 13}" y2="${f1(y + 46 + ph * 170)}" stroke="#9fc4ef" stroke-width="2.5"/>`; }
  o += `<g fill="#6f7a8a"><circle cx="${x - 40}" cy="${y}" r="34"/><circle cx="${x}" cy="${y - 20}" r="44"/><circle cx="${x + 44}" cy="${y}" r="32"/><rect x="${x - 70}" y="${y}" width="140" height="30" rx="15"/></g><g fill="#8a95a6" opacity="0.6"><circle cx="${x - 10}" cy="${y - 34}" r="20"/></g></g>`;
  return o;
}
function sceneBreakup(t) {
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#overcast)"/>` + treesBlur(t);
  o += `<rect x="-100" y="830" width="920" height="70" fill="#5a5f66"/><line x1="-100" y1="866" x2="820" y2="866" stroke="#d8d8a8" stroke-width="3" stroke-dasharray="40 30" opacity="0.6"/>`;
  o += `<rect x="-100" y="900" width="920" height="400" fill="#6b8a4e"/><rect x="-100" y="900" width="920" height="40" fill="#7d9a5c"/>`;
  // the bulldog's car
  const tIn = 10.0, tOff = 13.4;
  const carX = t < tOff ? lerp(980, 560, ease.out(prog(t, tIn, tIn + 0.8))) : lerp(560, 1300, ease.in(prog(t, tOff, tOff + 0.9)));
  const bx = carX - 40, by = 860 - 40;
  const bull = dog({ breed: 'bulldog', x: bx - 10, y: by + 52, s: 0.62, flip: -1, tilt: 60, hipLift: 30, neck: 10, jaw: jawOf('bull', t), earLift: 0.6, acc: { shades: 1, chain: true }, noShadow: true, paws: { fN: [bx - 70, by - 6], fF: [bx - 62, by - 2], hN: [bx - 10, by + 52], hF: [bx, by + 52] } }, t).svg;
  // Bella jumps from the bench into the car
  const jumpU = prog(t, 11.6, 12.2);
  const onCar = t > 12.2;
  let bellaSvg = '';
  const bellaPose = (x, y, fl, extra) => dog({ breed: 'poodle', x, y, s: 0.72, flip: fl, tilt: 35, hipLift: 38, neck: 48, headTilt: -14, lid: 0.5, brow: 0.3, earLift: 0.25, tailUp: 60, jaw: jawOf('ex', t), acc: { bow: '#ff5fa2' }, paws: sitPaws(x, y, -fl * 0.72), noShadow: onCar, ...extra }, t).svg;
  if (!onCar && jumpU === 0) bellaSvg = bellaPose(470, 900, -1, {});
  else if (!onCar) { const jx = lerp(470, carX - 120, jumpU), jy = lerp(900, by + 44, jumpU) - Math.sin(jumpU * Math.PI) * 110; bellaSvg = bellaPose(jx, jy, -1, { tilt: 10, hipLift: 0, paws: null }); }
  else bellaSvg = bellaPose(carX - 120, by + 44, -1, {});
  // world-space riders placed inside the car group (which is translated and scaled by 0.7)
  const under = `<g transform="scale(${(1 / 0.7).toFixed(4)}) translate(${f1(-carX)} -860)">${onCar ? bellaSvg : ''}${bull}</g>`;
  o += luxCar(t, carX, 860, { col: 'red', s: 0.7, seats: false, wheelRot: carX * 1.2, under });
  if (t > tOff && t < tOff + 1.6) { const u = prog(t, tOff, tOff + 1.6); o += `<g opacity="${f1(1 - u)}"><circle cx="${f1(carX - 260 - u * 120)}" cy="870" r="${f1(20 + u * 70)}" fill="#9a9a9a"/><circle cx="${f1(carX - 300 - u * 200)}" cy="850" r="${f1(14 + u * 60)}" fill="#aaa"/></g>`; }
  o += bench(150, 900);
  // hero
  const howlU = t > 14.4 && t < 17.1 ? ease.inOut(prog(t, 14.3, 14.7)) * (1 - ease.inOut(prog(t, 16.8, 17.1))) : 0;
  const hopeful = t < 9.6;
  const x = 270, g = 900, s = 0.82;
  const coughed = t > tOff + 0.5 && t < tOff + 1.4;
  o += dog({ breed: 'stray', x, y: g, s, tilt: 36, hipLift: 38, neck: lerp(hopeful ? 30 : 12, 72, howlU), headTilt: hopeful ? -6 : coughed ? 10 : 0, lid: howlU > 0.5 ? 0.92 : hopeful ? 0.1 : 0.45, brow: hopeful ? -0.3 : -1, earLift: hopeful ? 0.5 : 0, earSwing: howlU * 30, tailUp: hopeful ? 35 : -30, wag: hopeful ? 25 : 0, jaw: Math.max(jawOf('hero', t), 0), dirt: 0.8, sparkle: hopeful, tear: !hopeful && t > 12.4, acc: { flower: t < 9.9 }, paws: sitPaws(x, g, s) }, t).svg;
  if (t > 9.9 && t < 11.2) { const u = prog(t, 9.9, 11.2); o += `<g transform="translate(${f1(345 + u * 20)} ${f1(805 + ease.in(u) * 95)}) rotate(${f1(u * 200)})">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-6" rx="3.5" ry="6" fill="#ff6fa3" transform="rotate(${r})"/>`).join('')}<circle r="3.5" fill="#ffd34d"/></g>`; }
  if (!onCar) o += bellaSvg;
  o += cloudGag(300, 600, t, prog(t, 14.2, 14.6));
  const z = t < 14.3 ? 1.05 : lerp(1.05, 0.98, prog(t, 14.3, C.peek));
  return cam([400, 820], [360, 820], z, o);
}

// ---------- 3. peeking at TJR's workshop ----------
function tjrIRL(x, y, s, t, point) {
  // side view facing left, lit by the stage
  const arm = lerp(0.2, 1, point);
  let o = `<g transform="translate(${x} ${y}) scale(${-s} ${s})">`;
  o += `<path d="M -10 0 L -16 -120 M 14 0 L 18 -120" stroke="#2f3d5c" stroke-width="22" stroke-linecap="round"/><ellipse cx="-12" cy="4" rx="18" ry="8" fill="#1a1a1a"/><ellipse cx="18" cy="4" rx="18" ry="8" fill="#1a1a1a"/>`;
  o += `<path d="M -28 -122 Q -30 -230 0 -236 Q 34 -232 30 -122 Z" fill="#17181c"/>`;
  o += `<path d="M -6 -224 L ${f1(-6 + 80 * arm)} ${f1(-206 - 40 * arm)} L ${f1(-6 + 150 * arm)} ${f1(-214 - 70 * arm)}" stroke="#d7a887" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M -6 -224 L ${f1(-6 + 40 * arm)} ${f1(-215 - 20 * arm)}" stroke="#17181c" stroke-width="22" stroke-linecap="round"/>`;
  o += `<path d="M -14 -226 L -30 -160 L -26 -130" stroke="#d7a887" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  o += `<rect x="-8" y="-262" width="18" height="30" fill="#d7a887"/>`;
  o += `<ellipse cx="2" cy="-282" rx="30" ry="34" fill="#e3b593"/><path d="M 24 -268 Q 34 -262 26 -248 Q 12 -236 -2 -240 Q -18 -246 -22 -262" fill="#b98a5a"/><path d="M 18 -270 Q 26 -272 32 -266" stroke="#7a5634" stroke-width="4" fill="none"/>`;
  o += `<path d="M 30 -296 Q 40 -322 18 -330 Q 0 -350 -24 -330 Q -42 -318 -34 -290 Q -30 -272 -24 -268 Q -24 -296 -6 -304 Q 14 -312 30 -296 Z" fill="#e2b45a"/><path d="M 22 -318 Q 0 -332 -22 -316" stroke="#fff0b8" stroke-width="3" fill="none" opacity="0.7"/>`;
  o += `<circle cx="20" cy="-288" r="2.6" fill="#2a1a10"/>`;
  return o + '</g>';
}
function workshopInterior(t, x0, y0, w, h) {
  const slide = t < 23 ? 'RISK MANAGEMENT' : t < 25 ? 'PATIENCE' : 'WAIT FOR THE SETUP';
  let o = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#3a2414"/><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#stageWarm)"/>`;
  o += `<rect x="${x0 + 30}" y="${y0 + 26}" width="${w - 60}" height="44" rx="6" fill="#120c06" stroke="#e8b84a" stroke-width="2"/>` + text(x0 + w / 2, y0 + 58, 'TJR · LIVE TRADING WORKSHOP', { size: 26, fill: '#ffd36a', family: 'Anton', weight: 400 });
  o += `<rect x="${x0 + 40}" y="${y0 + 100}" width="${w * 0.46}" height="${h * 0.42}" rx="6" fill="#0b1016" stroke="#555" stroke-width="3"/>`;
  o += text(x0 + 40 + w * 0.23, y0 + 132, slide, { size: 22, fill: '#fff', family: 'Anton', weight: 400 });
  o += miniChart(x0 + 50, y0 + 145, w * 0.46 - 20, h * 0.42 - 55, 'green', t, 14);
  o += `<polygon points="${x0 + w * 0.7},${y0} ${x0 + w * 0.78},${y0} ${x0 + w * 0.92},${y0 + h} ${x0 + w * 0.5},${y0 + h}" fill="#ffe6a8" opacity="0.18"/>`;
  o += tjrIRL(x0 + w * 0.72, y0 + h * 0.82, 0.62, t, 0.6 + 0.4 * Math.sin(t * 1.8));
  for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) {
    const hx = x0 + 30 + i * (w - 40) / 8 + row * 24, hy = y0 + h - 20 + row * 34 + Math.sin(t * 2 + i) * 1.5;
    o += `<ellipse cx="${f1(hx)}" cy="${f1(hy + 30)}" rx="34" ry="26" fill="#0f0a07"/><circle cx="${f1(hx)}" cy="${f1(hy)}" r="20" fill="#1a120c"/>`;
  }
  return o;
}
function scenePeek(t) {
  if (t < C.window) {
    let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#eveSky)"/>` + `<g transform="translate(0 300)">${bricks(760, [110, 66, 48])}</g>`;
    o += `<rect x="320" y="420" width="390" height="460" fill="#2a1a10"/><g filter="url(#blur3)">${workshopInterior(t, 330, 430, 370, 440)}</g><rect x="320" y="420" width="390" height="460" fill="none" stroke="#2a2420" stroke-width="16"/><path d="M 340 440 L 420 440 L 340 600 Z" fill="#fff" opacity="0.07"/>`;
    o += `<rect x="300" y="880" width="430" height="20" fill="#5a4a40"/>`;
    o += `<rect x="-100" y="1060" width="920" height="300" fill="#4a4a4e"/><rect x="-100" y="1060" width="920" height="12" fill="#6a6a6e"/>`;
    const walkEnd = 19.2;
    let x, ph = 0, fl = 1;
    if (t < walkEnd) { x = lerp(-140, 470, prog(t, C.peek, walkEnd)); ph = (x / 60) * Math.PI; }
    else if (t < 19.85) { x = lerp(470, 380, ease.inOut(prog(t, 19.3, 19.8))); ph = -(x / 30) * Math.PI; }
    else x = 380;
    const moving = (t < walkEnd) || (t > 19.3 && t < 19.8);
    const perk = prog(t, 19.15, 19.3);
    const g = 1062, s = 0.85;
    const paws = moving ? walkPaws(x, g, s, ph, 22, 12, 58, -62) : null;
    o += dog({ breed: 'stray', x, y: g, s, flip: fl, neck: t > 19.85 ? 55 : lerp(10, 40, perk), headTilt: t > 19.85 ? 16 : 0, lid: lerp(0.45, 0.05, perk), brow: lerp(-1, 0.2, perk), earLift: perk, tailUp: lerp(-20, 30, perk), wag: perk * 10, jaw: jawOf('hero', t), dirt: 0.8, look: [0.3, -1], paws }, t).svg;
    if (t > 19.15 && t < 19.7) o += `<text x="${f1(x + 60)}" y="830" font-family="Anton" font-size="60" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke" opacity="${f1(1 - prog(t, 19.4, 19.7))}">!</text>`;
    o += grade('#6a5a8a', 0.3);
    return cam([430, 880], [360, 800], 1.22, o);
  }
  // close-up at the window; nights pass
  const night = t < 25 ? 0 : t < 26 ? 1 : t < 27 ? 2 : 3;
  let o = bricks(1100, [110, 66, 48]);
  o += `<rect x="50" y="250" width="620" height="620" fill="#2a1a10"/><g filter="url(#blur3)">${workshopInterior(t, 60, 260, 600, 600)}</g>`;
  o += `<path d="M 70 270 L 230 270 L 70 560 Z" fill="#fff" opacity="0.06"/><path d="M 600 270 L 650 270 L 400 860 L 350 860 Z" fill="#fff" opacity="0.04"/>`;
  o += `<rect x="50" y="250" width="620" height="620" fill="none" stroke="#2a2420" stroke-width="22"/><rect x="30" y="866" width="660" height="26" fill="#6a5a50"/>`;
  // chalk tally marks on the wall, growing each night
  const marks = [4, 9, 15, 22][night];
  for (let i = 0; i < marks; i++) { const gx = 20 + Math.floor(i / 5) * 46, gi = i % 5; o += gi < 4 ? `<line x1="${gx + gi * 8}" y1="940" x2="${gx + gi * 8}" y2="990" stroke="#eee" stroke-width="3.5" opacity="0.85"/>` : `<line x1="${gx - 4}" y1="980" x2="${gx + 30}" y2="948" stroke="#eee" stroke-width="3.5" opacity="0.85"/>`; }
  const x = 560, g = 1080, s = 1.05;
  const nod = Math.sin(t * 3.2) * 6;
  o += dog({ breed: 'stray', x, y: g, s, tilt: 72, hipLift: 30, neck: 16, headTilt: 10 + nod, lid: 0.05, brow: 0.1, earLift: 0.9, earSwing: nod * 0.6, tailUp: 25, wag: 12, jaw: jawOf('hero', t), dirt: 0.7, look: [-1, -0.4], sparkle: true, paws: { hN: [x - 60, g], hF: [x - 70, g], fN: [x - 70, 870], fF: [x - 90, 872] } }, t).svg;
  if (night === 1) o += rainFx(t, 0.3, 60, 5);
  if (night === 2) o += `<circle cx="120" cy="140" r="40" fill="#f3efe4" filter="url(#glow)"/>`;
  if (night === 3) { const r = rng(9); for (let i = 0; i < 40; i++) { const y0 = ((t * 60 + r() * 1300) % 1300) - 50; o += `<circle cx="${f1(r() * 720 + Math.sin(t + i) * 20)}" cy="${f1(y0)}" r="${f1(2 + r() * 3)}" fill="#fff" opacity="0.85"/>`; } }
  o += grade(['#7a6a9a', '#5a6a9a', '#4a5a8a', '#6a7aa0'][night], 0.28);
  const z = lerp(1.0, 1.12, prog(t, C.window, 25)) - (night > 0 ? 0.05 : 0);
  let out = cam([380, 700], [360, 700], z, o);
  if (Math.abs(t - 25) < 0.05 || Math.abs(t - 26) < 0.05 || Math.abs(t - 27) < 0.05) out += `<rect width="720" height="1280" fill="#000" opacity="0.7"/>`;
  return out;
}

// ---------- 4. the dumpster dive ----------
const TRASH = [['banana', 28.95], ['can', 29.15], ['fish', 29.4], ['paper', 29.7], ['shoe', 29.95], ['can', 30.2], ['paper', 30.4]];
function trashItem(kind) {
  if (kind === 'banana') return `<path d="M -16 0 Q 0 -14 16 0 Q 4 -4 0 10 Q -4 -4 -16 0 Z" fill="#f2d24a" stroke="#8a6a1a" stroke-width="2"/>`;
  if (kind === 'can') return `<rect x="-9" y="-14" width="18" height="28" rx="3" fill="#c73a3a"/><rect x="-9" y="-6" width="18" height="8" fill="#eee"/>`;
  if (kind === 'fish') return `<path d="M -20 0 L 10 0 M -14 -6 L -14 6 M -6 -6 L -6 6 M 2 -6 L 2 6 M 10 0 L 20 -8 L 20 8 Z" stroke="#ddd" stroke-width="3" fill="#ddd"/>`;
  if (kind === 'shoe') return `<path d="M -18 6 L -18 -8 Q -6 -12 0 -4 L 18 2 Q 22 8 14 10 L -18 10 Z" fill="#5a3a2a"/>`;
  return `<circle r="12" fill="#e8e2d0" stroke="#999" stroke-width="2"/>`;
}
function sceneTrash(t) {
  let o = bricks(1010, [150, 84, 58]);
  o += `<polygon points="-100,-100 820,-100 820,500 -100,1000" fill="#fff3d0" opacity="0.12"/>`;
  o += `<rect x="-100" y="1010" width="920" height="300" fill="#5a5a5e"/><rect x="-100" y="1010" width="920" height="16" fill="#6e6e72"/>`;
  const tUp = 28.8, tOut = 30.6, tLift = 31.0;
  o += dumpster(300, 1010, prog(t, 28.6, 28.9));
  const x = 290, g = 1010, s = 0.95;
  let svg;
  if (t < tUp) {
    const sniff = Math.sin(t * 18) * 3;
    svg = dog({ breed: 'stray', x: lerp(120, 200, prog(t, C.trash, tUp)), y: g, s, neck: -10 + sniff, earLift: 0.4, tailUp: 30, wag: 18, dirt: 0.6, paws: walkPaws(lerp(120, 200, prog(t, C.trash, tUp)), g, s, t * 9, 10, 6) }, t).svg;
  } else if (t < tLift) {
    const inside = t < tOut;
    svg = dog({ breed: 'stray', x, y: g, s, tilt: inside ? 44 : 66, hipLift: inside ? 10 : 30, neck: inside ? -78 : 10, headTilt: inside ? Math.sin(t * 14) * 8 : -6, earLift: inside ? 0.2 : 0.7, tailUp: 40, wag: 30, wagSpeed: 20, jaw: jawOf('hero', t), dirt: 0.6, paws: { hN: [x - 60, g], hF: [x - 70, g], fN: [x + 40, 790], fF: [x + 26, 792] } }, t).svg;
  } else {
    svg = '';
  }
  o += svg;
  // front panel hides the head while it's in the dumpster
  if (t > tUp && t < tOut) o += `<path d="M 300 1010 L 540 1010 L 550 790 L 290 790 Z" fill="#2f5a3a"/><path d="M 300 1010 L 540 1010 L 550 790 L 290 790 Z" fill="url(#metalShade)"/>` + [1, 2, 3, 4].map((i) => `<line x1="${300 + i * 48}" y1="800" x2="${300 + i * 48}" y2="1004" stroke="#244630" stroke-width="5"/>`).join('');
  for (const [kind, t0] of TRASH) {
    if (t < t0) continue;
    const u = (t - t0) / 1.0;
    if (u > 1.2) continue;
    const dir = kind === 'banana' ? -1 : (t0 * 10) % 2 > 1 ? 1 : -1;
    const tx = 420 + dir * u * (kind === 'banana' ? 150 : 300), ty = 780 - Math.sin(Math.min(u, 1) * Math.PI) * 300 + (u > 1 ? (u - 1) * 600 : 0);
    if (kind === 'banana' && t > tOut - 0.05) continue;
    o += `<g transform="translate(${f1(tx)} ${f1(ty)}) rotate(${f1(u * 540 * dir)}) scale(1.7)">${trashItem(kind)}</g>`;
  }
  if (t >= tLift) {
    // the lift: laptop held up to the heavens
    const lx = 330, lg = 1010, ls2 = 1.0;
    const up = ease.out(prog(t, tLift, tLift + 0.5));
    o += `<g opacity="${up.toFixed(2)}">${[...Array(9)].map((_, i) => { const a = -Math.PI / 2 + (i - 4) * 0.16 + Math.sin(t + i) * 0.02; return `<path d="M 380 560 L ${f1(380 + 1400 * Math.cos(a - 0.04))} ${f1(560 + 1400 * Math.sin(a - 0.04))} L ${f1(380 + 1400 * Math.cos(a + 0.04))} ${f1(560 + 1400 * Math.sin(a + 0.04))} Z" fill="#fff6c8" opacity="0.18"/>`; }).join('')}</g>`;
    const d = dog({ breed: 'stray', x: lx, y: lg, s: ls2, tilt: 78, hipLift: 26, neck: 40, headTilt: -10, lid: 0.0, brow: -0.6, earLift: 1, tailUp: 50, wag: 30, wagSpeed: 22, jaw: jawOf('hero', t), dirt: 0.6, sparkle: true, paws: { hN: [lx - 60, lg], hF: [lx - 70, lg], fN: [lx + 30, lerp(760, 600, up)], fF: [lx + 50, lerp(764, 604, up)] } }, t);
    o += d.svg;
    o += crackedLaptop(lx + 44, lerp(770, 610, up), 0.8, (x0, y0, w, h) => `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#0d2a1a"/>${miniChart(x0 + 6, y0 + 8, w - 12, h - 16, 'green', t, 10)}`, prog(t, tLift + 0.4, tLift + 0.8));
    // banana peel still on his head
    o += `<g transform="translate(${f1(d.head[0] - 6)} ${f1(d.head[1] - 34)}) rotate(-20)">${trashItem('banana')}</g>`;
    for (let i = 0; i < 8; i++) { const a = t * 2 + i; o += star(380 + Math.cos(a) * 160, 640 + Math.sin(a * 1.3) * 120, 6 + (i % 3) * 3, Math.abs(Math.sin(t * 4 + i)), '#fff3b0'); }
  } else if (t > tOut) {
    const hd = dog({ breed: 'stray', x, y: g, s, tilt: 66, hipLift: 30, neck: 10, paws: { hN: [x - 60, g], hF: [x - 70, g], fN: [x + 40, 790], fF: [x + 26, 792] } }, t).head;
    const land = prog(t, tOut - 0.05, tOut + 0.05);
    o += `<g transform="translate(${f1(hd[0] - 6)} ${f1(hd[1] - 34 - (1 - land) * 60)}) rotate(-20)">${trashItem('banana')}</g>`;
  }
  return cam([380, 820], [360, 820], t > tLift ? lerp(1.0, 1.12, prog(t, tLift, C.trade)) : 1.0, o);
}

// ---------- 5. trading from the box ----------
function sceneTrade(t) {
  const tGreen = 36.6, tSeason = 38.8;
  const season = t < tSeason ? -1 : Math.min(3, Math.floor((t - tSeason) / 0.45));
  let o = bricks(1010, [92, 46, 36]);
  o += `<rect x="-100" y="1010" width="920" height="300" fill="#18191c"/>` + lampGlow(160, 352, 240, '#ffd38a', 0.7);
  o += cardboardBox(60, 1010, 290, 190, false) + cardboardBox(60, 1010, 290, 190, true).replace('THIS SIDE UP', 'HEADQUARTERS');
  const cans = season < 0 ? 1 : 2 + season * 2;
  for (let i = 0; i < cans; i++) o += `<g transform="translate(${360 + (i % 3) * 30} ${1004 - Math.floor(i / 3) * 34})"><rect x="-13" y="-32" width="26" height="32" rx="3" fill="#c8a24a"/><rect x="-13" y="-22" width="26" height="12" fill="#a33"/></g>`;
  o += `<rect x="470" y="930" width="180" height="80" fill="#6b4a2a"/><rect x="470" y="930" width="180" height="10" fill="#8a6440"/>`;
  o += `<rect x="500" y="900" width="120" height="30" rx="4" fill="#3a3d44"/><line x1="600" y1="925" x2="585" y2="820" stroke="#3a3d44" stroke-width="10"/><polygon points="585,822 600,925 470,850 480,780" fill="${t > tGreen ? '#5affa0' : '#ff5a5a'}" opacity="0.12"/>`;
  const x = 380, g = 1010, s = 0.95;
  const happy = t > tGreen + 0.2;
  const type = Math.sin(t * (happy ? 30 : 18)) > 0;
  const hop = happy ? Math.abs(Math.sin(t * 9)) * 16 : 0;
  o += dog({ breed: 'stray', x: x - 80, y: g - hop, s, tilt: 40, hipLift: 36, neck: happy ? 30 : 6, headTilt: happy ? -8 : 4, lid: happy ? 0.0 : 0.2, brow: happy ? -0.4 : 0.9, earLift: happy ? 0.8 : 0.5, tailUp: happy ? 55 : 10, wag: happy ? 40 : 4, wagSpeed: happy ? 28 : 8, jaw: jawOf('hero', t), tongue: happy ? 0.6 : 0, dirt: season >= 2 ? 0.1 : 0.4, acc: { scarf: season === 0 ? '#c33' : null, shades: season === 2 ? 1 : 0 }, paws: { hN: [x - 114, g - hop], hF: [x - 124, g - hop], fN: [x + (type ? 104 : 96), type ? 898 : 906], fF: [x + 30, g - hop] } }, t).svg;
  // picture-in-picture: the chart on his screen
  const red = t < tGreen;
  o += `<g transform="translate(360 470)"><rect x="-250" y="-170" width="500" height="320" rx="18" fill="#0b0f14" stroke="#2a2f38" stroke-width="10"/><rect x="-236" y="-156" width="472" height="292" rx="8" fill="${red ? '#1a0a0c' : '#081a10'}"/>${miniChart(-226, -140, 452, 250, red ? 'red' : 'green', t, 16)}${text(170, -120, red ? '-2.4%' : '+8.7%', { size: 34, fill: red ? '#ff5a5a' : '#5affa0', family: 'Anton', weight: 400 })}</g>`;
  if (season === 0) { const r = rng(3); for (let i = 0; i < 50; i++) o += `<circle cx="${f1(r() * 720)}" cy="${f1(((t * 80 + r() * 1300) % 1300) - 20)}" r="${f1(2 + r() * 3)}" fill="#fff"/>`; o += `<rect x="54" y="814" width="302" height="12" rx="6" fill="#fff"/>`; }
  if (season === 1) { const r = rng(4); for (let i = 0; i < 18; i++) o += `<ellipse cx="${f1(r() * 720 + Math.sin(t * 2 + i) * 40)}" cy="${f1(((t * 120 + r() * 1300) % 1300) - 20)}" rx="9" ry="5" fill="${['#d9822b', '#b5532a', '#e0a33a'][i % 3]}" transform="rotate(${f1(t * 200 + i * 40)})"/>`; }
  if (season === 2) o += `<rect x="-100" y="-100" width="920" height="1400" fill="#fff2b0" opacity="0.15"/>`;
  o += grade(season === 2 ? '#d8c08a' : '#6a6a8a', 0.25);
  let out = cam([380, 820], [360, 820], 1.0 + (happy ? 0.02 * Math.sin(t * 18) : 0), o);
  if (season >= 0 && ((t - tSeason) % 0.45) < 0.05) out += `<rect width="720" height="1280" fill="#fff" opacity="0.5"/>`;
  return out;
}

// ---------- 6. one year later ----------
function sceneLater(t) {
  const u = prog(t, C.later, C.lux);
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="#0c0906"/>`;
  const op = prog(t, C.later + 0.1, C.later + 0.5) * (1 - prog(t, C.lux - 0.3, C.lux));
  o += `<g opacity="${op.toFixed(2)}">${text(360, 620, 'ONE YEAR LATER', { size: 92, fill: '#f2d9a0', family: 'Anton', weight: 400, ls: lerp(18, 6, ease.out(u)) })}${text(360, 690, "(that's 7 in dog years)", { size: 34, fill: '#bfa77a', family: 'Oswald', weight: 500 })}</g>`;
  for (let i = 0; i < 6; i++) o += cashBill(120 + i * 100, ((t - C.later) * 120 + i * 140) % 1300 - 100, t * 40 + i * 50, 0.8, 0.25 * op);
  return o;
}

// ---------- 7. the gold car at golden hour ----------
function palms(d, k, y, sc, op = 1) {
  let o = '';
  const sp = 380, off = ((d * k) % sp + sp) % sp;
  for (let i = -1; i < 4; i++) {
    const x = i * sp - off + 100;
    o += `<g transform="translate(${f1(x)} ${y}) scale(${sc})" opacity="${op}"><path d="M 0 0 Q 10 -200 30 -400" stroke="#3a2416" stroke-width="16" fill="none"/>`;
    for (let k2 = 0; k2 < 7; k2++) { const a = -2.6 + k2 * 0.62; o += `<path d="M 30 -400 Q ${f1(30 + Math.cos(a) * 90)} ${f1(-400 + Math.sin(a) * 60 - 30)} ${f1(30 + Math.cos(a) * 170)} ${f1(-400 + Math.sin(a) * 120 + 40)}" stroke="#2a3a1e" stroke-width="12" fill="none" stroke-linecap="round"/>`; }
    o += '</g>';
  }
  return o;
}
function carCrew(t, carX, carY, cs, o2 = {}) {
  // dogs seated in the car, in car-local coordinates (drawn before the body)
  const wind = 26 + Math.sin(t * 13) * 10;
  let o = `<path d="M -250 -66 Q -250 -96 -214 -96 L -190 -96 Q -176 -96 -178 -66 Z M -110 -70 Q -110 -102 -76 -102 L -52 -102 Q -38 -102 -40 -70 Z" fill="#c8915a"/>`;
  const gx = -170, gy = -10;
  o += dog({ breed: 'diva', x: gx, y: gy, s: 0.78, tilt: 62, hipLift: 34, neck: 24, headTilt: -8, lid: 0.35, earLift: 0.1, earSwing: wind, tailUp: 0, jaw: jawOf('gf', t), acc: { pearls: 1, scarf: '#ff4f9a', shades: 1 }, noShadow: true, paws: { hN: [gx - 40, gy], hF: [gx - 50, gy], fN: [gx + 40, gy - 50], fF: [gx + 30, gy - 46] } }, t).svg;
  if (o2.kiss) o += o2.kiss;
  const hx = -60, hy = -6;
  const d = dog({ breed: 'stray', x: hx, y: hy, s: 0.84, tilt: 64, hipLift: 34, neck: 22, headTilt: o2.headTilt ?? -4, lid: 0.15, brow: 0.4, earLift: 0.2, earSwing: wind, tailUp: 0, jaw: jawOf('hero', t), dirt: 0, acc: { chain: true, shades: o2.shades ?? 1, shadesDrop: 0 }, noShadow: true, noHead: o2.hideHead, paws: { hN: [hx - 40, hy], hF: [hx - 50, hy], fN: [44, -104], fF: [36, -98] } }, t);
  o += d.svg;
  o += `<line x1="62" y1="-64" x2="44" y2="-92" stroke="#555" stroke-width="5"/><ellipse cx="40" cy="-98" rx="9" ry="26" transform="rotate(-18 40 -98)" fill="none" stroke="#222" stroke-width="6"/>`;
  return { svg: o, head: [carX + d.head[0] * cs, carY + d.head[1] * cs] };
}
function busStop(x, t) {
  let o = `<g transform="translate(${f1(x)} 0)"><rect x="-10" y="700" width="10" height="320" fill="#666"/><rect x="-60" y="680" width="110" height="40" rx="6" fill="#2a5aa8"/>` + text(-5, 708, 'BUS', { size: 24, fill: '#fff', family: 'Anton', weight: 400 });
  o += `<rect x="40" y="760" width="300" height="10" fill="#777"/><rect x="40" y="770" width="8" height="250" fill="#777"/><rect x="332" y="770" width="8" height="250" fill="#777"/><rect x="48" y="770" width="284" height="200" fill="#9ab" opacity="0.18"/>`;
  o += luxCar(t, 180, 1000, { col: 'red', s: 0.55, wheelRot: 0 });
  o += `<path d="M 290 942 L 340 900" stroke="#8a1414" stroke-width="10"/>`;
  for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i * 0.25) % 1; o += `<circle cx="${f1(320 + ph * 30)}" cy="${f1(930 - ph * 160)}" r="${f1(14 + ph * 30)}" fill="#777" opacity="${f1(0.6 * (1 - ph))}"/>`; }
  const shocked = t > 47.5;
  o += dog({ breed: 'poodle', x: 110, y: 1022, s: 0.6, flip: 1, tilt: 35, hipLift: 38, neck: shocked ? 40 : 20, headTilt: shocked ? -16 : 6, lid: shocked ? 0 : 0.6, brow: shocked ? -0.6 : -0.8, earLift: shocked ? 0.8 : 0, tailUp: -10, jaw: Math.max(jawOf('ex', t), shocked ? 0.45 : 0), acc: { bow: '#ff5fa2' }, look: [1, 0], paws: sitPaws(110, 1022, 0.6) }, t).svg;
  o += dog({ breed: 'bulldog', x: 250, y: 1022, s: 0.55, flip: -1, tilt: 30, hipLift: 22, neck: 10, lid: 0.5, brow: -0.6, earLift: 0.2, acc: { shades: shocked ? 0 : 1 }, paws: sitPaws(250, 1022, -0.55) }, t).svg;
  if (shocked) o += `<g transform="translate(${f1(262 + prog(t, 47.6, 48.2) * 10)} ${f1(910 + ease.in(prog(t, 47.6, 48.2)) * 100)}) rotate(${f1(prog(t, 47.6, 48.2) * 120)})"><rect x="-14" y="-6" width="28" height="12" rx="4" fill="#111"/></g>`;
  o += cloudGag(180, 640, t, 1).replace(/r="34"/, 'r="30"');
  return o + '</g>';
}
function sceneLux(t) {
  const d = (t - C.lux) * 520;
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#goldenSky)"/><circle cx="520" cy="700" r="120" fill="#fff0c0" filter="url(#glow)" opacity="0.9"/>`;
  o += `<g filter="url(#blur3)" opacity="0.7">${palms(d, 0.15, 900, 0.7, 0.8)}</g>`;
  o += `<rect x="-100" y="900" width="920" height="100" fill="#8a5a5a" opacity="0.5"/>`;
  const bsX = t < 47.5 ? lerp(820, 420, ease.out(prog(t, C.busstop, 47.5))) : t < 48.6 ? lerp(420, 370, prog(t, 47.5, 48.6)) : lerp(370, -560, ease.in(prog(t, 48.6, C.finale)));
  if (t > C.busstop) o += busStop(bsX, t);
  o += `<rect x="-100" y="1000" width="920" height="300" fill="#3a3238"/>`;
  for (let j = 0; j < 7; j++) o += `<rect x="${f1(j * 160 - (d % 160) - 40)}" y="1150" width="80" height="8" fill="#e8d8a8" opacity="0.6"/>`;
  const shift = ease.inOut(prog(t, C.busstop, C.busstop + 0.6)) * (1 - ease.inOut(prog(t, 48.6, 49.2)));
  const cx = lerp(360, 190, shift), cy = 1010 + Math.sin(t * 11) * 1.5, cs = 0.8;
  const crew = carCrew(t, cx, cy, cs, {});
  o += luxCar(t, cx, cy, { col: 'gold', s: cs, seats: false, wheelRot: d * 1.1, under: crew.svg });
  for (let i = 0; i < 6; i++) { const yy = 900 + i * 40, xx = 760 - ((t * 1400 + i * 300) % 1100); o += `<line x1="${f1(xx)}" y1="${yy}" x2="${f1(xx + 120)}" y2="${yy}" stroke="#fff" stroke-width="2" opacity="0.18"/>`; }
  o += grade('#ffb070', 0.18);
  return cam([cx, 940], [lerp(360, 300, shift), 900], lerp(1.22, 1.0, shift), o);
}

// ---------- 8. the drive-by wink ----------
function sceneFinale(t) {
  const tStop = 51.0, tTurn = 51.2, tBack = 53.1, tGo = 53.4;
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#goldenSky)"/><circle cx="560" cy="640" r="110" fill="#fff0c0" filter="url(#glow)" opacity="0.85"/>`;
  o += `<g filter="url(#blur10)" opacity="0.8">${palms(t * 40, 0.3, 920, 0.9, 0.9)}</g>`;
  o += `<rect x="-100" y="980" width="920" height="320" fill="#3a3238"/>`;
  const cs = 1.3;
  let carX;
  if (t < tStop) carX = lerp(-700, 330, ease.out(prog(t, C.finale, tStop)));
  else if (t < tGo) carX = 330;
  else carX = lerp(330, 1700, ease.in(prog(t, tGo, tGo + 0.9)));
  const cy = 1030;
  const turned = t > tTurn + 0.15 && t < tBack;
  const crew = carCrew(t, carX, cy, cs, { hideHead: turned, shades: 1, kiss: t > 52.6 ? `<g transform="translate(-120 ${f1(-170 - (t - 52.6) * 60)})" opacity="${f1(1 - prog(t, 52.6, 53.6))}"><path d="M 0 8 C -14 -2 -10 -14 0 -6 C 10 -14 14 -2 0 8 Z" fill="#ff4f7a"/></g>` : '' });
  o += luxCar(t, carX, cy, { col: 'gold', s: cs, seats: false, wheelRot: carX * 1.0, under: crew.svg });
  // money trail: bills fly off the back of the car and drift down; a burst on the getaway
  const carAt = (tt) => (tt < tStop ? lerp(-700, 330, ease.out(prog(tt, C.finale, tStop))) : tt < tGo ? 330 : lerp(330, 1700, ease.in(prog(tt, tGo, tGo + 0.9))));
  const r = rng(41);
  for (let i = 0; i < 130; i++) {
    const burst = i >= 70;
    const born = burst ? tGo + (i - 70) * 0.018 : C.finale + i * 0.055;
    const vx = -60 - r() * 160, vy = -260 - r() * 260, spin = (r() - 0.5) * 600, toCam = r() < 0.25;
    if (t < born) continue;
    const lt = t - born;
    const x0 = carAt(born) - 170 * cs + r() * 50;
    const x = x0 + vx * lt + Math.sin(lt * 4 + i) * 20, y = cy - 150 * cs + vy * lt + 300 * lt * lt;
    if (y > 1400 || lt > 4) continue;
    const sc = (toCam ? 1 + lt * 1.6 : 0.9 + lt * 0.2) * 1.2;
    o += cashBill(x, y, spin * lt + i * 37, sc, clamp(toCam ? 1.3 - lt * 0.6 : 1));
  }

  if (turned) {
    const sx = Math.min(1, prog(t, tTurn + 0.15, tTurn + 0.35)) * (1 - prog(t, tBack - 0.2, tBack));
    const drop = ease.inOut(prog(t, 51.55, 51.85)) * (1 - ease.inOut(prog(t, 52.8, 53.0)));
    const wink = t > 52.0 && t < 52.6 ? 1 : 0;
    const hh = crew.head;
    o += `<g transform="translate(${f1(hh[0])} ${f1(hh[1] - 10)}) scale(${sx.toFixed(3)} 1) translate(${f1(-hh[0])} ${f1(-hh[1] + 10)})">${dogFront(hh[0], hh[1] - 10, 0.95, { breed: 'stray', wink, earLift: 0.2, tongue: t > 52.2 && t < 52.8 ? 0.3 : 0, acc: { chain: true, shades: 1, shadesDrop: drop } }, t)}</g>`;
    if (t > 52.0 && t < 52.5) o += star(hh[0] - 50, hh[1] - 40, 22 * Math.sin(prog(t, 52.0, 52.5) * Math.PI), 1, '#fff6c0');
    if (t > 52.2 && t < 52.6) { const u = prog(t, 52.2, 52.6); o += `<circle cx="${f1(hh[0] + 40 + u * 30)}" cy="${f1(hh[1] + 10)}" r="${f1(8 + u * 14)}" fill="#fff" opacity="${f1(0.6 * (1 - u))}"/>`; }
  }
  if (t > tGo) for (let i = 0; i < 6; i++) { const yy = 860 + i * 36; o += `<line x1="${f1(carX - 500 - i * 40)}" y1="${yy}" x2="${f1(carX - 1100)}" y2="${yy}" stroke="#fff" stroke-width="3" opacity="0.25"/>`; }
  o += grade('#ffb070', 0.16);
  const z = t < tTurn ? 1.0 : t < tGo ? lerp(1.0, 1.18, ease.inOut(prog(t, tTurn, tTurn + 0.5))) : lerp(1.18, 1.0, prog(t, tGo, tGo + 0.6));
  let out = cam([330, 800], [360, 800], z, o);
  if (t > C.endcard) {
    const u = prog(t, C.endcard, C.endcard + 0.6);
    out += `<rect width="720" height="1280" fill="#000" opacity="${(0.65 * u).toFixed(2)}"/>`;
    out += `<g opacity="${u.toFixed(2)}">${text(360, 560, 'Not financial advice.', { size: 56, fill: '#fff', family: 'Oswald', weight: 700 })}${text(360, 630, 'Definitely not from a dog.', { size: 40, fill: '#f2d9a0', family: 'Oswald', weight: 500 })}<g transform="translate(360 740)" fill="#f2d9a0"><ellipse cx="0" cy="14" rx="26" ry="22"/><ellipse cx="-30" cy="-16" rx="10" ry="13"/><ellipse cx="-10" cy="-30" rx="10" ry="13"/><ellipse cx="12" cy="-30" rx="10" ry="13"/><ellipse cx="32" cy="-16" rx="10" ry="13"/></g></g>`;
  }
  return out;
}

// ---------- compose ----------
const DEFS = `<defs>${DEFS_COMMON}${dogDefs()}
  <pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse"><image href="../../assets/img/grain.png" width="256" height="256"/></pattern>
  <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
  <linearGradient id="lampRefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd38a" stop-opacity="0.5"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/></linearGradient>
  <linearGradient id="boxShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>
  <linearGradient id="metalShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.12"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>
  <linearGradient id="overcast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa6b4"/><stop offset="1" stop-color="#cfd5da"/></linearGradient>
  <linearGradient id="eveSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d3a"/><stop offset="1" stop-color="#5a4a7a"/></linearGradient>
  <linearGradient id="goldenSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a7a"/><stop offset="0.45" stop-color="#e8806a"/><stop offset="0.8" stop-color="#ffc27a"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient>
  <radialGradient id="stageWarm" cx="70%" cy="20%" r="80%"><stop offset="0" stop-color="#ffcf8a" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>`;
const SCENES = [[0, C.breakup, sceneAlley], [C.breakup, C.peek, sceneBreakup], [C.peek, C.trash, scenePeek], [C.trash, C.trade, sceneTrash],
  [C.trade, C.later, sceneTrade], [C.later, C.lux, sceneLater], [C.lux, C.finale, sceneLux], [C.finale, Infinity, sceneFinale]];
const sceneAt = (t) => { for (const [a, b, fn] of SCENES) if (t >= a && t < b) return fn(t); return ''; };

const stage = document.getElementById('stage');
stage.innerHTML = DEFS + '<g id="frame"></g>';
const frameEl = document.getElementById('frame');
window.ready = new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = '../../assets/img/grain.png'; });

window.renderFrame = function (t) {
  let o = sceneAt(t);
  for (const c of [C.breakup, C.peek, C.trash, C.trade, C.later, C.lux, C.finale]) {
    const d = Math.abs(t - c);
    if (d < 0.18) o += `<rect width="720" height="1280" fill="#000" opacity="${(1 - d / 0.18).toFixed(2)}"/>`;
  }
  const gx = Math.floor(rng(Math.floor(t * 24))() * 256), gy = Math.floor(rng(Math.floor(t * 24) + 7)() * 256);
  o += `<rect width="720" height="1280" fill="url(#vignette)" opacity="0.8"/><rect x="${-gx}" y="${-gy}" width="1100" height="1600" fill="url(#grain)" opacity="0.1" style="mix-blend-mode:overlay"/>`;
  o += dogSub(t, TL.subs, 1120);
  const dip = Math.max(t < 0.4 ? 1 - t / 0.4 : 0, prog(t, window.DURATION - 0.5, window.DURATION - 0.05));
  if (dip > 0) o += `<rect width="720" height="1280" fill="#000" opacity="${clamp(dip).toFixed(3)}"/>`;
  frameEl.innerHTML = o;
};
