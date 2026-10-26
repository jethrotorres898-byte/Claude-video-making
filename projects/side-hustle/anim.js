'use strict';
// "The Side Hustle": neon-noir trailer. Timing comes from voice.js.

const V = window.VOICE;
const L = V.lines;
window.DURATION = V.duration;
const ls = (i) => L[i].s, le = (i) => L[i].e;
const wt = (i, w, which) => wordTime(L, i, w, which);
const rawT = (i, sub) => { const w = L[i].words.find((x) => x.w.toLowerCase().includes(sub)); return w ? w.s : L[i].s; };
const SUBS = buildSubChunks(L);
const GOLDW = /^(TJR\.?|SIDE|HUSTLE\.|FIFTY|THOUSAND|DOLLARS\.|LATER\.|LUXURY|BRANDS\.|EVERYTHING\.|TRADER\.)$/;
function mouthOf(spk, t) {
  for (const l of L) if (l.speaker === spk && t >= l.s && t <= l.e) return clamp(l.mouth[Math.floor((t - l.s) * V.fps)] || 0);
  return 0;
}
function cam(F, P, z, body) {
  return `<g transform="translate(${f1(P[0] - z * F[0])} ${f1(P[1] - z * F[1])}) scale(${z.toFixed(4)})">${body}</g>`;
}
function shake(t, t0, dur, amp) {
  if (t < t0 || t > t0 + dur) return [0, 0];
  const k = (1 - prog(t, t0, t0 + dur)) * amp;
  return [Math.sin(t * 97) * k, Math.cos(t * 83) * k];
}
const flash = (t, t0, dur = 0.25, col = '#fff') => (t >= t0 && t < t0 + dur ? `<rect x="-400" y="-400" width="1520" height="2080" fill="${col}" opacity="${(1 - prog(t, t0, t0 + dur)).toFixed(3)}"/>` : '');

const CUT = {
  search: ls(2) - 0.3, found: ls(5) - 0.25, grind: ls(7) - 0.2, later: ls(8) - 0.4, shift: ls(9) - 0.25,
  trader: ls(10) - 0.2, fifty: ls(11) - 0.2, rich: ls(12) - 0.2, hero: ls(13) - 0.25, end: ls(14) - 0.2,
};

// ---------- scene: the part-time job ----------
function diner(t, o2 = {}) {
  const empty = o2.empty;
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#060b0e"/>`;
  // window with the street
  o += `<rect x="30" y="300" width="310" height="470" fill="#050712" stroke="#1d2a33" stroke-width="10"/>`;
  o += `<g clip-path="url(#dinerWin)">${skyline(3, 0.03, t * 40, 720, 120, 300, '#0b0e1c', '#ffcf7a', 0.2)}${empty ? '' : rain(t, 0.4, 40, 3)}</g>`;
  const sign = empty ? 'NOW HIRING' : 'OPEN';
  o += neonText(185, 420, sign, NEON.mag, empty ? 40 : 54, { flicker: true, t });
  // menu board
  o += `<rect x="385" y="260" width="300" height="200" rx="10" fill="#071218" stroke="${NEON.cyan}" stroke-width="2.5" opacity="${empty ? 0.4 : 1}" filter="url(#glow2)"/>`;
  [['BURGER', '4.99'], ['FRIES', '2.49'], ['SHAKE', '3.29']].forEach(([a, b], i) => {
    o += text(410, 315 + i * 52, a, { size: 28, fill: NEON.cyan, anchor: 'start', family: 'Anton', weight: 400, op: empty ? 0.35 : 0.9 });
    o += text(662, 315 + i * 52, b, { size: 28, fill: '#cfefff', anchor: 'end', family: 'Anton', weight: 400, op: empty ? 0.35 : 0.9 });
  });
  // fluorescent tube
  const fl = empty ? (Math.sin(t * 41) > 0.3 ? 0.25 : 0.05) : (Math.sin(t * 61) > 0.97 ? 0.4 : 1);
  o += `<polygon points="200,240 560,240 720,960 40,960" fill="url(#tubeCone)" opacity="${(0.55 * fl).toFixed(2)}"/>`;
  o += `<rect x="200" y="226" width="360" height="14" rx="7" fill="#e8fbff" opacity="${fl.toFixed(2)}" filter="url(#neon)"/>`;
  // wall clock
  o += `<g transform="translate(610 620)" opacity="${empty ? 0.5 : 1}"><circle r="46" fill="#0a1216" stroke="${NEON.cyan}" stroke-width="3" filter="url(#glow2)"/><line x1="0" y1="0" x2="${f1(24 * Math.sin(-0.4))}" y2="${f1(-24 * Math.cos(-0.4))}" stroke="#dff" stroke-width="5" stroke-linecap="round"/><line x1="0" y1="0" x2="${f1(34 * Math.sin(4.9 + t * 0.05))}" y2="${f1(-34 * Math.cos(4.9 + t * 0.05))}" stroke="#dff" stroke-width="3" stroke-linecap="round"/></g>`;
  if (empty) {
    // apron and cap left on a hook by the door
    const sway = Math.sin(t * 1.6) * 3;
    o += `<rect x="560" y="680" width="10" height="16" fill="#333"/><g transform="translate(565 696) rotate(${f1(sway)})"><path d="M -40 0 L 40 0 L 46 150 L -46 150 Z" fill="#12303A" stroke="${NEON.cyan}" stroke-width="2.5" filter="url(#glow2)"/><path d="M -24 0 Q 0 -30 24 0" fill="none" stroke="#12303A" stroke-width="6"/><path d="M -30 -6 Q -26 -40 4 -40 Q 30 -40 32 -10 L 58 -8 L 30 -2 Z" fill="${NOIR}" stroke="${NEON.cyan}" stroke-width="1.5"/></g>`;
  }
  return o;
}
function counterFront(t, coinT) {
  let o = `<rect x="-300" y="900" width="1320" height="700" fill="#0a0f13"/><line x1="-300" y1="900" x2="1020" y2="900" stroke="${NEON.cyan}" stroke-width="4" filter="url(#glow2)"/>`;
  o += `<rect x="440" y="820" width="110" height="80" rx="8" fill="${NOIR}" stroke="#2a3a44" stroke-width="3"/><rect x="452" y="832" width="86" height="34" rx="4" fill="#062016"/>` + text(495, 857, '$0.00', { size: 22, fill: NEON.green, family: 'Anton', weight: 400 });
  o += `<path d="M 600 830 L 600 898 Q 600 902 606 902 L 654 902 Q 660 902 660 898 L 660 830" fill="rgba(160,220,255,0.08)" stroke="#9fd8ff" stroke-width="3" opacity="0.8"/>` + text(630, 822, 'TIPS', { size: 16, fill: '#9fd8ff', family: 'Anton', weight: 400, op: 0.8 });
  o += `<ellipse cx="624" cy="896" rx="9" ry="4" fill="${NEON.gold}"/>`;
  if (coinT !== undefined && t > coinT - 0.5) {
    const u = prog(t, coinT - 0.5, coinT);
    o += `<ellipse cx="640" cy="${f1(lerp(760, 892, ease.in(u)))}" rx="9" ry="${f1(u < 1 ? 9 : 4)}" fill="${NEON.gold}" filter="url(#glow2)"/>`;
  }
  return o;
}
function sceneJob(t) {
  const close = t > ls(1) - 0.25;
  const tSurv = wt(0, 'survive');
  let o = diner(t);
  const hip = [300, 935], s = 1.15;
  const wipe = Math.sin(t * 3.2);
  const face = close ? faces(t, [[ls(1) - 0.25, 'sad'], [ls(1) + 0.4, 'bored']]) : FACE.bored;
  const m = noirman({ x: hip[0], y: hip[1], s, lean: close ? 4 : 14, tilt: close ? -18 : 10, hN: [420 + wipe * 45, 893], hF: [365, 895], hideLegs: true, rim: 'cyan', cap: NEON.cyan, apron: true, hair: 'hero', lit: close ? 1 : 0.0, litCol: 'cyan', face: { ...face, ly: close ? -0.12 : 0.1 }, talk: mouthOf('hero', t), blink: blink(t, 0.4) }, t);
  o += m.svg + counterFront(t, tSurv);
  o += rays(380, 230, '#bdf3ff', t, 7, 0.06, 1.0, 900);
  let z, F;
  if (!close) { z = lerp(1.0, 1.12, ease.inOut(prog(t, 0, ls(1)))); F = [360, 760]; }
  else { z = lerp(2.0, 2.2, prog(t, ls(1) - 0.25, CUT.search)); F = m.head; }
  let out = cam(F, close ? [360, 600] : [360, 760], z, o);
  // tube dies at the end of the shift
  const off = prog(t, le(1) + 0.15, CUT.search - 0.05);
  if (off > 0) out += `<rect width="720" height="1280" fill="#000" opacity="${(Math.sin(t * 70) > 0 ? off : off * 0.6).toFixed(2)}"/>`;
  return out;
}

// ---------- scene: searching for a side hustle ----------
function bedroom(t, glowCol) {
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#06050d"/>`;
  o += `<rect x="410" y="250" width="300" height="500" fill="#04040c" stroke="#191629" stroke-width="10"/>`;
  o += `<g clip-path="url(#bedWin)">${skyline(8, 0.02, t * 20, 760, 160, 420, '#0a0a18', '#ffcf7a', 0.22)}<g filter="url(#blur3)">${bokeh(t, 6, 14, [410, 250, 710, 750])}</g>${rain(t, 0.25, 26, 8, 0.05)}</g>`;
  o += `<line x1="560" y1="250" x2="560" y2="750" stroke="#191629" stroke-width="8"/>`;
  // desk + laptop (screen faces the chair)
  o += `<rect x="250" y="940" width="560" height="16" fill="#120f1d"/><line x1="290" y1="956" x2="290" y2="1200" stroke="#120f1d" stroke-width="12"/><line x1="700" y1="956" x2="700" y2="1200" stroke="#120f1d" stroke-width="12"/>`;
  o += `<polygon points="548,822 548,934 210,820 230,700" fill="${glowCol}" opacity="0.13"/>`;
  o += `<rect x="440" y="928" width="140" height="10" rx="3" fill="#1a1726"/><line x1="560" y1="934" x2="540" y2="818" stroke="#1a1726" stroke-width="12" stroke-linecap="round"/><line x1="553" y1="928" x2="534" y2="822" stroke="${glowCol}" stroke-width="3" filter="url(#glow2)"/>`;
  return o;
}
const RESULTS = [['DROPSHIPPING', 'dropshipping'], ['FREELANCING', 'freelancing'], ['RESELLING', 'reselling']];
function sceneSearch(t) {
  const tFound = wt(4, 'found');
  const gold = prog(t, tFound - 0.15, tFound + 0.2);
  const glowCol = gold > 0.5 ? NEON.gold : NEON.cyan;
  let o = bedroom(t, glowCol);
  // time-lapse jitter during "one hour later"
  const lapse = t > ls(4) && t < tFound - 0.15;
  const pose = lapse ? Math.floor((t - ls(4)) / 0.18) % 4 : -1;
  const poses = [
    { lean: 14, tilt: 6, hN: [470, 930], hF: [440, 932] },
    { lean: 4, tilt: -10, hN: [330, 800], hF: [440, 932] },
    { lean: 20, tilt: 14, hN: [470, 930], hF: [360, 870] },
    { lean: -6, tilt: -16, hN: [300, 760], hF: [250, 770] },
  ];
  const base = pose >= 0 ? poses[pose] : { lean: gold > 0 ? 18 : 12, tilt: gold > 0 ? -4 : 6, hN: [470 + Math.sin(t * 25) * 4, 930], hF: [440 - Math.sin(t * 25) * 4, 932] };
  const hip = [230, 1010], s = 1.15;
  const face = gold > 0 ? FACE.curious : lapse ? FACE.bored : t > wt(3, 'nothing') ? FACE.sad : FACE.focus;
  const m = noirman({ x: hip[0], y: hip[1], s, ...base, ...nSitFeet(hip, s), rim: gold > 0.5 ? 'gold' : 'cyan', hair: 'hero', lit: 1, litCol: gold > 0.5 ? 'gold' : 'cyan', face: { ...face, lx: 0.08 }, blink: blink(t, 0.8) }, t);
  o += `<path d="M ${hip[0] - 90} 1012 L ${hip[0] - 110} 860 M ${hip[0] - 96} 1012 L ${hip[0] + 40} 1012 M ${hip[0] - 80} 1012 L ${hip[0] - 90} 1180 M ${hip[0] + 30} 1012 L ${hip[0] + 40} 1180" stroke="#141122" stroke-width="10" stroke-linecap="round"/>`;
  o += m.svg;
  // holo search panel / clock
  if (!lapse && gold <= 0) {
    const pin = ease.out(prog(t, CUT.search + 0.2, CUT.search + 0.6));
    const query = 'side hustle ideas';
    const nType = Math.floor(query.length * prog(t, wt(2, 'searching'), le(2) + 0.2));
    let body = `<circle cx="132" cy="364" r="13" fill="none" stroke="${NEON.cyan}" stroke-width="4"/><line x1="141" y1="373" x2="152" y2="384" stroke="${NEON.cyan}" stroke-width="4" stroke-linecap="round"/>`;
    body += `<rect x="100" y="330" width="520" height="68" rx="34" fill="none" stroke="${NEON.cyan}" stroke-width="2"/>`;
    body += text(170, 376, query.slice(0, nType) + (Math.floor(t * 2.4) % 2 ? '|' : ''), { size: 32, fill: '#e6fbff', anchor: 'start', weight: 500 });
    RESULTS.forEach(([lab, w], i) => {
      const ta = wt(3, w), p = ease.back(prog(t, ta - 0.05, ta + 0.25));
      if (p <= 0) return;
      const x = 120 + i * 168, killed = prog(t, wt(3, 'nothing'), wt(3, 'clicked') + 0.3);
      const jit = killed > 0 && killed < 1 ? (Math.sin(t * 90 + i) * 6) : 0;
      body += `<g transform="translate(${f1(x + 76 + jit)} 488) scale(${p.toFixed(3)})" opacity="${(1 - 0.65 * killed).toFixed(2)}"><rect x="-76" y="-46" width="152" height="92" rx="12" fill="rgba(20,40,70,0.7)" stroke="${NEON.cyan}" stroke-width="2"/>${text(0, 10, lab, { size: lab.length > 11 ? 21 : 24, fill: '#e6fbff', family: 'Anton', weight: 400 })}`;
      if (killed > 0) body += `<g opacity="${clamp(killed * 3).toFixed(2)}"><line x1="-50" y1="-34" x2="50" y2="34" stroke="${NEON.red}" stroke-width="7" stroke-linecap="round" filter="url(#glow2)"/><line x1="50" y1="-34" x2="-50" y2="34" stroke="${NEON.red}" stroke-width="7" stroke-linecap="round" filter="url(#glow2)"/></g>`;
      body += '</g>';
    });
    o += holoPanel(70, 300, 580, 270, NEON.cyan, body, pin);
  } else if (lapse) {
    const u = prog(t, ls(4), tFound - 0.15), mins = Math.floor(u * 60);
    const hh = mins >= 58 ? 12 : 11, mm = (2 + mins) % 60;
    const lab = `${hh}:${String(mm).padStart(2, '0')} ${hh === 12 ? 'AM' : 'PM'}`;
    o += holoPanel(160, 330, 400, 170, NEON.cyan, text(360, 450, lab, { size: 92, fill: '#e6fbff', family: 'Anton', weight: 400 }));
  } else {
    o += rays(540, 860, NEON.gold, t, 10, 0.16, 2.6, 900);
    o += particles(t, 5, 26, NEON.gold, [200, 500, 700, 950], 60, 3);
    const p = ease.back(prog(t, tFound - 0.1, tFound + 0.3));
    o += `<g transform="translate(360 440) scale(${p.toFixed(3)})"><circle r="70" fill="none" stroke="${NEON.gold}" stroke-width="5" filter="url(#neon)"/><path d="M -20 -32 L 36 0 L -20 32 Z" fill="${NEON.gold}" filter="url(#glow)"/></g>`;
  }
  const z = gold > 0 ? lerp(1.05, 1.3, ease.inOut(prog(t, tFound - 0.1, CUT.found))) : lerp(1.0, 1.05, prog(t, CUT.search, ls(4)));
  const F = gold > 0 ? [400, 760] : [360, 700];
  let out = cam(F, [360, gold > 0 ? 760 : 700], z, o);
  out += flash(t, CUT.found - 0.12, 0.12, '#fff7da');
  return out;
}

// ---------- scene: TJR's videos and channel ----------
function tjrFigure(t, x, y, s, point) {
  const hN = mix([x + 30 * s, y + 90 * s], [x + 160 * s, y - 150 * s + Math.sin(t * 3) * 8], point);
  return noirman({ x, y, s, lean: 2, tilt: -4, hN, hF: [x - 10, y + 96 * s], fN: [x + 24 * s, y + 188 * s], fF: [x - 12 * s, y + 190 * s], hair: 'tjr', chain: true, rim: 'gold' }, t).svg;
}
function sceneFound(t) {
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#07060a"/>` + rays(360, -60, NEON.gold, t, 9, 0.07, 1.6, 1500);
  const channel = t > ls(6) - 0.15;
  if (!channel) {
    const wins = ['winning', 'again', 'again'];
    const lw5 = lineWords(L[5]);
    const winTimes = [lw5[4].s, lw5[5].s, lw5[7].s];
    let body = text(72, 252, 'TJR', { size: 36, fill: NEON.gold, anchor: 'start', family: 'Anton', weight: 400 }) + text(140, 252, 'LIVE TRADING', { size: 24, fill: '#ddd', anchor: 'start', weight: 500 });
    body += `<rect x="560" y="226" width="80" height="32" rx="6" fill="${NEON.red}"/>` + text(600, 250, 'LIVE', { size: 20, fill: '#fff', family: 'Anton', weight: 400 });
    // chart
    const n = 10 + Math.floor(12 * prog(t, CUT.found, winTimes[2] + 0.5));
    const X0 = 300, Y0 = 760;
    for (let i = 0; i < n; i++) {
      const up = i % 4 !== 2, base = Y0 - i * 18, h = 30 + (i % 3) * 10;
      const x = X0 + i * 15;
      o += '';
      body += `<line x1="${x}" y1="${base - h - 10}" x2="${x}" y2="${base + 8}" stroke="${up ? NEON.green : NEON.red}" stroke-width="2"/><rect x="${x - 5}" y="${base - h}" width="10" height="${h}" fill="${up ? NEON.green : NEON.red}"/>`;
    }
    body += tjrFigure(t, 170, 620, 1.0, 1);
    winTimes.forEach((wt0, i) => {
      if (t < wt0 - 0.05) return;
      const p = prog(t, wt0 - 0.05, wt0 + 0.15), sc = lerp(2.2, 1, ease.out(p));
      const amt = ['+$2,140', '+$3,880', '+$5,320'][i];
      body += `<g transform="translate(${470 + (i - 1) * 40} ${400 + i * 120}) rotate(${-6 + i * 5}) scale(${sc.toFixed(3)})" opacity="${clamp(p * 3).toFixed(2)}"><rect x="-110" y="-46" width="220" height="92" rx="12" fill="rgba(0,0,0,0.6)" stroke="${NEON.green}" stroke-width="4" filter="url(#glow2)"/>${text(0, -2, 'WIN', { size: 44, fill: NEON.green, family: 'Anton', weight: 400 })}${text(0, 34, amt, { size: 26, fill: '#eaffef', family: 'Anton', weight: 400 })}</g>`;
    });
    body += `<rect x="70" y="930" width="580" height="6" rx="3" fill="#333"/><rect x="70" y="930" width="${f1(580 * (0.3 + 0.4 * prog(t, CUT.found, ls(6))))}" height="6" rx="3" fill="${NEON.red}"/>`;
    o += holoPanel(40, 200, 640, 760, NEON.gold, body);
    let sh = [0, 0];
    winTimes.forEach((w) => { const s2 = shake(t, w, 0.25, 8); sh = [sh[0] + s2[0], sh[1] + s2[1]]; });
    let out = cam([360, 640], [360 + sh[0], 640 + sh[1]], 1 + 0.06 * prog(t, CUT.found, ls(6)), o);
    winTimes.forEach((w) => { out += flash(t, w, 0.12, 'rgba(43,255,136,0.25)'); });
    return out;
  }
  // channel page
  const tSub = wt(6, 'channel') + 0.25, tWatch = wt(6, 'watched'), tTut = wt(6, 'tutorial');
  let body = `<rect x="60" y="220" width="600" height="190" rx="12" fill="url(#bannerGrad)"/>` + neonText(400, 345, 'TJR', NEON.gold, 110, { ls: 8 });
  body += `<g transform="translate(150 400)"><circle r="62" fill="#0d0a05" stroke="${NEON.gold}" stroke-width="4"/>${tjrHeadSil(0, 18, 0.62)}</g>`;
  body += text(230, 460, 'TJR', { size: 40, fill: '#fff', anchor: 'start', family: 'Anton', weight: 400 }) + text(230, 492, 'Day trader · tutorials', { size: 22, fill: '#aaa', anchor: 'start', weight: 500 });
  const subd = t > tSub;
  body += `<rect x="470" y="440" width="170" height="54" rx="27" fill="${subd ? '#2a2a2a' : NEON.red}" stroke="${subd ? NEON.gold : NEON.red}" stroke-width="2"/>` + text(555, 476, subd ? 'SUBSCRIBED' : 'SUBSCRIBE', { size: 24, fill: '#fff', family: 'Anton', weight: 400 });
  if (t > tSub - 0.3 && t < tSub + 0.5) {
    const cu = prog(t, tSub - 0.3, tSub);
    body += `<path transform="translate(${f1(lerp(640, 560, cu))} ${f1(lerp(560, 470, cu))})" d="M 0 0 L 0 30 L 8 22 L 14 34 L 20 31 L 14 20 L 25 20 Z" fill="#fff" stroke="#000" stroke-width="2"/>`;
    if (t > tSub) body += `<circle cx="560" cy="470" r="${f1(10 + 40 * prog(t, tSub, tSub + 0.5))}" fill="none" stroke="${NEON.gold}" stroke-width="3" opacity="${f1(1 - prog(t, tSub, tSub + 0.5))}"/>`;
  }
  const TUT = ['HOW TO READ CHARTS', 'RISK MANAGEMENT', 'MY STRATEGY', 'TRADING PSYCHOLOGY'];
  TUT.forEach((lab, i) => {
    const gx = 70 + (i % 2) * 295, gy = 540 + Math.floor(i / 2) * 200;
    const ti = tWatch + i * 0.32;
    const fly = prog(t, tTut + 0.1 + i * 0.08, tTut + 0.6 + i * 0.08);
    const sc = 1 + ease.in(fly) * 2.5, op = 1 - fly;
    const active = t > ti && fly === 0;
    let th = `<rect width="280" height="180" rx="10" fill="#120e08" stroke="${active ? NEON.gold : '#3a3020'}" stroke-width="${active ? 4 : 2}"${active ? ' filter="url(#glow2)"' : ''}/>`;
    th += tjrHeadSil(52, 110, 0.5) + text(150, 70, lab.split(' ').slice(0, 2).join(' '), { size: 22, fill: '#fff', family: 'Anton', weight: 400 }) + text(150, 100, lab.split(' ').slice(2).join(' '), { size: 22, fill: NEON.gold, family: 'Anton', weight: 400 });
    th += `<circle cx="226" cy="140" r="18" fill="rgba(255,255,255,0.15)"/><path d="M 220 130 L 234 140 L 220 150 Z" fill="#fff"/>`;
    th += `<rect x="0" y="174" width="${f1(280 * clamp((t - ti) / 0.9))}" height="6" fill="${NEON.red}"/>`;
    body += `<g transform="translate(${gx + 140} ${gy + 90}) scale(${sc.toFixed(3)}) translate(-140 -90)" opacity="${op.toFixed(3)}">${th}</g>`;
  });
  o += holoPanel(40, 200, 640, 760, NEON.gold, body);
  return cam([360, 600], [360, 600], 1 + 0.05 * prog(t, ls(6), CUT.grind), o);
}
function tjrHeadSil(x, y, s) {
  const R = NB.R;
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#rim_gold)"><path d="M ${0.7 * R} ${-0.5 * R} Q ${1.02 * R} ${-0.8 * R} ${0.8 * R} ${-1.12 * R} Q ${0.64 * R} ${-1.44 * R} ${0.28 * R} ${-1.41 * R} Q ${0.04 * R} ${-1.6 * R} ${-0.26 * R} ${-1.43 * R} Q ${-0.64 * R} ${-1.42 * R} ${-0.84 * R} ${-1.12 * R} Q ${-1.2 * R} ${-0.86 * R} ${-1.11 * R} ${-0.48 * R} Q ${-1.17 * R} ${-0.12 * R} ${-0.98 * R} ${0.13 * R} L 0 0 Z" fill="${NOIR}"/><circle r="${R}" fill="${NOIR}"/><path d="M ${0.55 * R} ${0.62 * R} Q ${0.42 * R} ${1.18 * R} ${0.1 * R} ${1.08 * R} Q ${0.25 * R} ${0.9 * R} ${0.3 * R} ${0.7 * R} Z" fill="${NOIR}"/><path d="M -24 ${R} L -30 ${R + 70} L 40 ${R + 70} L 30 ${R}" fill="${NOIR}"/></g>`;
}

// ---------- scene: the grind ----------
function sceneGrind(t) {
  const w7 = lineWords(L[7]);
  const tR = w7[1].s - 0.05, tD = w7[2].s - 0.05, tN = w7[3].s - 0.05;
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#05060b"/>`;
  if (t < tR) {
    const n = Math.floor(22 * prog(t, CUT.grind, tR));
    o += `<g stroke="#12303A" stroke-width="1.5">${[...Array(8)].map((_, i) => `<line x1="60" y1="${300 + i * 90}" x2="660" y2="${300 + i * 90}"/>`).join('')}</g>`;
    for (let i = 0; i < n; i++) {
      const up = Math.sin(i * 1.7) > -0.3, base = 820 - i * 14 + Math.sin(i * 1.3) * 40, h = 40 + (i % 3) * 18, x = 90 + i * 26;
      o += `<line x1="${x}" y1="${f1(base - h - 14)}" x2="${x}" y2="${f1(base + 14)}" stroke="${up ? NEON.cyan : NEON.mag}" stroke-width="3" filter="url(#glow2)"/><rect x="${x - 8}" y="${f1(base - h)}" width="16" height="${h}" fill="${up ? NEON.cyan : NEON.mag}" filter="url(#glow2)"/>`;
    }
    o += neonText(360, 300, 'CHARTS', NEON.cyan, 80, {});
  } else if (t < tD) {
    o += `<line x1="60" y1="760" x2="660" y2="760" stroke="${NEON.mag}" stroke-width="5" stroke-dasharray="20 14" filter="url(#glow2)"/>` + text(640, 740, 'STOP -1%', { size: 34, fill: NEON.mag, anchor: 'end', family: 'Anton', weight: 400 });
    const p = ease.back(prog(t, tR, tR + 0.3));
    o += `<g transform="translate(360 560) scale(${p.toFixed(3)})"><path d="M 0 -120 L 100 -80 Q 100 40 0 120 Q -100 40 -100 -80 Z" fill="none" stroke="${NEON.mag}" stroke-width="7" filter="url(#neon)"/><path d="M -40 0 L -10 34 L 46 -36" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    o += neonText(360, 340, 'RISK', NEON.mag, 80, {});
  } else if (t < tN) {
    const k = Math.floor(30 * prog(t, tD, tN));
    for (let i = 0; i < 30; i++) {
      const x = 105 + (i % 6) * 88, y = 430 + Math.floor(i / 6) * 88;
      o += `<rect x="${x}" y="${y}" width="76" height="76" rx="10" fill="none" stroke="#3a3020" stroke-width="2"/>`;
      if (i < k) o += `<path d="M ${x + 18} ${y + 40} L ${x + 32} ${y + 56} L ${x + 60} ${y + 22}" fill="none" stroke="${NEON.gold}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow2)"/>`;
    }
    o += neonText(360, 360, 'DISCIPLINE', NEON.gold, 76, {});
  } else {
    // night after night: time-lapse at the desk
    const u = prog(t, tN, CUT.later), nights = 4;
    const ph = (u * nights) % 1;
    o += `<rect x="60" y="260" width="600" height="420" fill="#04040c" stroke="#191629" stroke-width="10"/>`;
    const mx = 60 + ph * 600, my = 600 - Math.sin(ph * Math.PI) * 300;
    o += `<g clip-path="url(#grindWin)"><circle cx="${f1(mx)}" cy="${f1(my)}" r="34" fill="#f3efe4" filter="url(#glow)"/>${skyline(11, 0.0, 0, 690, 80, 220, '#0a0a18', '#ffcf7a', 0.2)}</g>`;
    o += `<rect x="200" y="940" width="560" height="16" fill="#120f1d"/>`;
    const stack = 1 + Math.floor(u * 7);
    for (let i = 0; i < stack; i++) o += `<rect x="560" y="${926 - i * 14}" width="110" height="12" rx="2" fill="${[NEON.cyan, NEON.mag, NEON.gold][i % 3]}" opacity="0.8"/>`;
    const hip = [200, 1010];
    const jit = Math.floor(u * 16) % 2;
    o += noirman({ x: hip[0], y: hip[1], s: 1.1, lean: jit ? 16 : 10, tilt: jit ? 8 : 0, hN: [430, 930], hF: [400, 934], ...nSitFeet(hip, 1.1), rim: 'purple', hair: 'hero' }, t).svg;
    o += `<rect x="-300" y="-300" width="1320" height="1880" fill="#000" opacity="${(0.25 * Math.abs(Math.sin(ph * Math.PI * 2))).toFixed(2)}"/>`;
  }
  let out = cam([360, 640], [360, 640], 1 + 0.04 * Math.sin(t * 2), o);
  [tR, tD, tN].forEach((x) => { out += flash(t, x, 0.1, 'rgba(255,255,255,0.45)'); });
  return out;
}

// ---------- scene: one year later ----------
function sceneLater(t) {
  const u = prog(t, CUT.later, CUT.shift);
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#000"/>`;
  const sweep = lerp(-0.4, 1.4, prog(t, ls(8) - 0.1, le(8) + 0.4));
  const lsp = lerp(34, 10, ease.out(prog(t, CUT.later, le(8))));
  const op = prog(t, CUT.later + 0.05, CUT.later + 0.35) * (1 - prog(t, CUT.shift - 0.3, CUT.shift));
  o += `<defs><linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="${clamp(sweep - 0.15).toFixed(3)}" stop-color="#9a9a9a"/><stop offset="${clamp(sweep).toFixed(3)}" stop-color="#fff"/><stop offset="${clamp(sweep + 0.15).toFixed(3)}" stop-color="${NEON.gold}"/><stop offset="1" stop-color="#bfa56a"/></linearGradient></defs>`;
  const g = t < CUT.later + 0.3 ? Math.sin(t * 120) * 14 : 0;
  o += `<g opacity="${op.toFixed(3)}" transform="translate(${f1(g)} 0)"><text x="360" y="600" font-family="Anton" font-size="104" letter-spacing="${f1(lsp)}" text-anchor="middle" fill="url(#sweep)" filter="url(#softglow)">ONE YEAR</text><text x="360" y="720" font-family="Anton" font-size="104" letter-spacing="${f1(lsp)}" text-anchor="middle" fill="url(#sweep)" filter="url(#softglow)">LATER</text>`;
  o += `<line x1="${f1(360 - 260 * ease.out(u * 2))}" y1="640" x2="${f1(360 + 260 * ease.out(u * 2))}" y2="640" stroke="${NEON.gold}" stroke-width="2" filter="url(#glow2)"/></g>`;
  o += particles(t, 9, 30, NEON.gold, [0, 300, 720, 1000], 25, 2);
  return cam([360, 640], [360, 640], 1 + 0.06 * u, o);
}

// ---------- scene: the empty shift ----------
function sceneShift(t) {
  let o = diner(t, { empty: true }) + counterFront(t);
  const z = lerp(1.0, 1.15, ease.inOut(prog(t, CUT.shift, CUT.trader)));
  return cam([380, 660], [360, 660], z, o);
}

// ---------- scene: full-time trader ----------
function penthouse(t, d) {
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="url(#duskSky)"/>`;
  o += skyline(21, 0.04, d, 980, 260, 560, '#0c0a1a', '#ffcf7a', 0.18);
  o += skyline(22, 0.12, d, 1040, 200, 420, '#080611', '#ffd28a', 0.26);
  o += `<rect x="-300" y="1040" width="1320" height="600" fill="#05040a"/>`;
  for (let x = -40; x < 800; x += 190) o += `<rect x="${x}" y="150" width="12" height="900" fill="#05040a"/>`;
  return o;
}
function monitors(t, x, y) {
  let o = '';
  [[-150, 18], [0, 0], [150, -18]].forEach(([dx, rot], i) => {
    o += `<g transform="translate(${x + dx} ${y}) rotate(${rot})"><rect x="-70" y="-50" width="140" height="100" rx="6" fill="#020805" stroke="${NEON.green}" stroke-width="3" filter="url(#glow2)"/>`;
    let pts = '';
    for (let k = 0; k <= 10; k++) pts += `${-60 + k * 12},${f1(30 - k * 5 - Math.sin(k * 1.4 + i + t * 2) * 8)} `;
    o += `<polyline points="${pts}" fill="none" stroke="${NEON.green}" stroke-width="3"/></g>`;
  });
  return o;
}
function sceneTrader(t) {
  const d = (t - CUT.trader) * 60;
  let o = penthouse(t, d);
  o += `<rect x="250" y="930" width="520" height="16" fill="#140f05"/><line x1="560" y1="946" x2="560" y2="1160" stroke="#140f05" stroke-width="14"/>`;
  o += monitors(t, 520, 800);
  const hip = [230, 1010], s = 1.15;
  o += noirman({ x: hip[0], y: hip[1], s, lean: 6, tilt: -8, hN: [440, 925], hF: [410, 928], ...nSitFeet(hip, s), rim: 'gold', hair: 'hero', blazer: true, chain: true, watch: true }, t).svg;
  o += rays(520, 700, NEON.green, t, 6, 0.05, 2.2, 600);
  const z = lerp(1.15, 1.0, ease.out(prog(t, CUT.trader, CUT.fifty)));
  return cam([400, 820], [360 + 40 * prog(t, CUT.trader, CUT.fifty), 760], z, o);
}

// ---------- scene: $50,000 a month ----------
function bill(x, y, rot, sc) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${sc.toFixed(2)})"><rect x="-38" y="-19" width="76" height="38" rx="4" fill="#1f6b3c" stroke="${NEON.green}" stroke-width="2" opacity="0.9"/><circle r="11" fill="none" stroke="#9dffbf" stroke-width="2"/></g>`;
}
function sceneFifty(t) {
  const tMonth = rawT(11, 'month');
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#070502"/>` + rays(360, -80, NEON.gold, t, 11, 0.12, 1.4, 1600);
  const r = rng(13);
  for (let i = 0; i < 22; i++) {
    const x0 = r() * 720, sp = 60 + r() * 80, ph = r(), y = ((t * sp + ph * 1400) % 1400) - 100;
    o += bill(x0 + Math.sin(t * 0.8 + i) * 30, y, r() * 360 + t * 20, 0.8 + r() * 0.6);
  }
  const u = prog(t, ls(11), tMonth - 0.15);
  const v = Math.round(50000 * ease.out(u) / 10) * 10;
  const pop = 1 + 0.12 * bump(t, tMonth - 0.15, tMonth + 0.25);
  o += `<g transform="translate(360 600) scale(${pop.toFixed(3)})">${neonText(0, 0, money(v), NEON.gold, 150, { ls: 2, sw: 4 })}</g>`;
  if (t > tMonth - 0.05) {
    const p = prog(t, tMonth - 0.05, tMonth + 0.12);
    o += `<g transform="translate(360 760) scale(${lerp(2.4, 1, ease.out(p)).toFixed(3)})" opacity="${clamp(p * 3).toFixed(2)}">${neonText(0, 0, '/ MONTH', '#fff', 84, { ls: 10 })}</g>`;
  }
  o += particles(t, 17, 40, NEON.gold, [0, 300, 720, 1100], 40, 2.5);
  const [sx, sy] = shake(t, tMonth, 0.5, 14);
  let out = cam([360, 640], [360 + sx, 640 + sy], 1 + 0.08 * prog(t, CUT.fifty, CUT.rich), o);
  out += flash(t, tMonth - 0.02, 0.2, 'rgba(255,214,120,0.5)');
  return out;
}

// ---------- scene: cars, brands, everything ----------
function supercar(t, x, y, reveal, lights) {
  const body = 'M -312 20 L -314 -14 Q -302 -38 -244 -44 L -140 -52 Q -70 -88 20 -90 Q 100 -90 160 -58 L 292 -36 Q 318 -28 314 -4 L 308 20 L 236 20 A 58 58 0 0 0 120 20 L -130 20 A 58 58 0 0 0 -246 20 Z';
  let o = `<g transform="translate(${x} ${y})">`;
  o += `<path d="${body}" fill="${NOIR}"/>`;
  o += `<path d="${body}" fill="none" stroke="${NEON.gold}" stroke-width="4" stroke-dasharray="2400" stroke-dashoffset="${f1(2400 * (1 - reveal))}" filter="url(#neon)"/>`;
  o += `<path d="M -306 -40 L -290 -62 L -236 -62 L -232 -46" fill="none" stroke="${NEON.gold}" stroke-width="4" stroke-opacity="${reveal.toFixed(2)}"/><path d="M -70 -8 L 70 -18" stroke="${NEON.gold}" stroke-width="3" stroke-opacity="${(0.6 * reveal).toFixed(2)}"/>`;
  o += `<path d="M -100 -52 Q -50 -82 20 -84 Q 80 -82 130 -56 Z" fill="#0d1020" stroke="${NEON.gold}" stroke-width="2" stroke-opacity="${reveal.toFixed(2)}"/>`;
  for (const wx of [-188, 178]) o += `<circle cx="${wx}" cy="20" r="46" fill="#050505" stroke="${NEON.gold}" stroke-width="3" stroke-opacity="${reveal.toFixed(2)}"/><circle cx="${wx}" cy="20" r="22" fill="none" stroke="#777" stroke-width="3"/>`;
  if (lights > 0) o += `<polygon points="296,-30 720,-120 720,80" fill="url(#beamGold)" opacity="${lights.toFixed(2)}"/><ellipse cx="294" cy="-30" rx="12" ry="8" fill="#fff8e0" filter="url(#glow)" opacity="${lights.toFixed(2)}"/>`;
  o += `<g transform="translate(0 92) scale(1 -0.45)" opacity="0.18"><path d="${body}" fill="${NEON.gold}" opacity="${(0.5 * reveal).toFixed(2)}"/></g>`;
  return o + '</g>';
}
function bag(x, y, label, col, sc, op) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})" opacity="${op.toFixed(3)}"><path d="M -40 -96 Q -40 -140 0 -140 Q 40 -140 40 -96" fill="none" stroke="${col}" stroke-width="6"/><path d="M -80 -100 L 80 -100 L 92 100 L -92 100 Z" fill="#0b0b0e" stroke="${col}" stroke-width="3" filter="url(#glow2)"/>${text(0, 14, label, { size: 26, fill: col, family: 'Oswald', weight: 500, ls: 6 })}</g>`;
}
function sceneRich(t) {
  const w12 = lineWords(L[12]);
  const tB = w12[2].s - 0.08, tE = w12[4].s - 0.08;
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#050507"/>`;
  if (t < tB) {
    const rv = ease.inOut(prog(t, CUT.rich + 0.05, tB - 0.35));
    o += rays(360, 200, '#fff', t, 5, 0.05, 1.0, 1200);
    const sx = lerp(-200, 920, rv);
    o += `<rect x="${f1(sx - 60)}" y="400" width="120" height="700" fill="url(#sweepBand)" opacity="0.5"/>`;
    o += supercar(t, 360, 860, rv, prog(t, tB - 0.5, tB - 0.25));
    o += `<line x1="-200" y1="880" x2="920" y2="880" stroke="#222" stroke-width="2"/>`;
    return cam([360, 820], [360, 760], lerp(1.05, 1.15, prog(t, CUT.rich, tB)), o);
  }
  if (t < tE) {
    o += `<polygon points="160,300 260,300 340,1000 80,1000" fill="#fff" opacity="0.05"/><polygon points="310,300 410,300 490,1000 230,1000" fill="#fff" opacity="0.06"/><polygon points="460,300 560,300 640,1000 380,1000" fill="#fff" opacity="0.05"/>`;
    [['MAISON', NEON.gold, 200], ['LUXE', '#ffffff', 360], ['ATELIER', NEON.mag, 520]].forEach(([lab, col, x], i) => {
      const t0 = tB + i * 0.18, p = prog(t, t0, t0 + 0.35);
      const y = lerp(300, 860, ease.out(p)) - Math.abs(Math.sin(p * Math.PI * 2)) * 30 * (1 - p);
      o += bag(x, y, lab, col, 0.9, clamp(p * 4));
    });
    o += `<line x1="-200" y1="962" x2="920" y2="962" stroke="#222" stroke-width="2"/>`;
    return cam([360, 760], [360, 740], lerp(1.0, 1.08, prog(t, tB, tE)), o);
  }
  // expensive everything: watch, chain, shades in quick cuts
  const k = Math.min(2, Math.floor((t - tE) / ((CUT.hero - tE) / 3)));
  const lt = (t - tE) - k * ((CUT.hero - tE) / 3);
  const glint = lerp(-1, 2, clamp(lt / 0.5));
  if (k === 0) {
    o += `<g transform="translate(360 640)"><rect x="-70" y="-300" width="140" height="600" rx="30" fill="#151208"/><circle r="150" fill="#0b0904" stroke="${NEON.gold}" stroke-width="16" filter="url(#glow2)"/><circle r="128" fill="none" stroke="#7a6230" stroke-width="3"/>${[...Array(12)].map((_, i) => `<line x1="${f1(110 * Math.sin(i * Math.PI / 6))}" y1="${f1(-110 * Math.cos(i * Math.PI / 6))}" x2="${f1(124 * Math.sin(i * Math.PI / 6))}" y2="${f1(-124 * Math.cos(i * Math.PI / 6))}" stroke="${NEON.gold}" stroke-width="5"/>`).join('')}<line x1="0" y1="0" x2="0" y2="-80" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="0" y1="0" x2="${f1(96 * Math.sin(t * 6))}" y2="${f1(-96 * Math.cos(t * 6))}" stroke="${NEON.gold}" stroke-width="3"/><circle r="8" fill="${NEON.gold}"/></g>`;
  } else if (k === 1) {
    let links = '';
    for (let i = 0; i < 16; i++) { const a = Math.PI * (0.15 + 0.7 * i / 15); links += `<ellipse cx="${f1(360 + 260 * Math.cos(a))}" cy="${f1(380 + 300 * Math.sin(a))}" rx="26" ry="16" transform="rotate(${f1(a * 180 / Math.PI + 90)} ${f1(360 + 260 * Math.cos(a))} ${f1(380 + 300 * Math.sin(a))})" fill="none" stroke="${NEON.gold}" stroke-width="9" filter="url(#glow2)"/>`; }
    o += links + `<circle cx="360" cy="700" r="40" fill="${NEON.gold}" filter="url(#glow)"/>`;
  } else {
    o += `<g transform="translate(360 640)"><path d="M -300 -60 Q -160 -90 -20 -60 L 20 -60 Q 160 -90 300 -60" fill="none" stroke="#222" stroke-width="14"/><rect x="-280" y="-70" width="250" height="150" rx="50" fill="#050505" stroke="#333" stroke-width="6"/><rect x="30" y="-70" width="250" height="150" rx="50" fill="#050505" stroke="#333" stroke-width="6"/>${skylineMini()}</g>`;
  }
  o += `<rect x="${f1(glint * 720 - 80)}" y="0" width="160" height="1280" fill="url(#sweepBand)" opacity="0.45" transform="skewX(-15)"/>`;
  return cam([360, 640], [360, 640], 1 + 0.15 * clamp(lt / 0.6), o);
}
function skylineMini() {
  let o = '';
  for (const ox of [-155, 155]) {
    o += `<g clip-path="url(#lens${ox < 0 ? 'L' : 'R'})">`;
    for (let i = 0; i < 6; i++) o += `<rect x="${ox - 100 + i * 34}" y="${f1(30 - (i % 3) * 22)}" width="26" height="80" fill="${[NEON.mag, NEON.cyan, NEON.gold][i % 3]}" opacity="0.35"/>`;
    o += `</g>`;
  }
  return o;
}

// ---------- scene: "best search of my life" ----------
function sceneHero(t) {
  const d = (t - CUT.hero) * 30;
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#07040e"/>` + skyline(31, 0.05, d, 900, 200, 520, '#0c0820', '#ffcf7a', 0.25);
  o += neonText(560, 380, 'LUXE', NEON.mag, 60, { flicker: true, t, ls: 10 });
  o += `<rect x="-300" y="900" width="1320" height="700" fill="#06040b"/>` + `<g opacity="0.25" transform="translate(0 1800) scale(1 -1)">${skyline(31, 0.05, d, 900, 200, 520, '#0c0820', '#ffcf7a', 0.25)}</g>`;
  o += supercar(t, 470, 990, 1, 0.7);
  const hip = [210, 900], s = 1.2;
  const m = noirman({ x: hip[0], y: hip[1], s, lean: -6, tilt: -6, hN: [300, 960], hF: [170, 960], fN: [250, 1110], fF: [190, 1112], rim: 'mag', hair: 'hero', blazer: true, chain: true, watch: true, shades: 1, lit: 1, litCol: 'mag', face: { ...FACE.smirk, lx: 0.05 }, talk: mouthOf('hero', t), blink: 1 }, t);
  o += m.svg + rain(t, 0.12, 20, 31, 0.05);
  return cam(m.head, [330, 560], lerp(1.55, 1.75, prog(t, CUT.hero, CUT.end)), o);
}

// ---------- scene: so what are you searching for? ----------
function sceneEnd(t) {
  let o = `<rect x="-300" y="-300" width="1320" height="1880" fill="#000"/>`;
  const p = ease.out(prog(t, CUT.end + 0.1, CUT.end + 0.6));
  const cur = Math.floor(t * 2.2) % 2 ? '|' : '';
  const body = `<circle cx="132" cy="634" r="14" fill="none" stroke="${NEON.cyan}" stroke-width="4"/><line x1="142" y1="644" x2="154" y2="656" stroke="${NEON.cyan}" stroke-width="4" stroke-linecap="round"/><rect x="96" y="596" width="528" height="80" rx="40" fill="none" stroke="${NEON.cyan}" stroke-width="2"/>${text(176, 650, cur, { size: 38, fill: '#e6fbff', anchor: 'start', weight: 500 })}`;
  o += holoPanel(70, 570, 580, 132, NEON.cyan, body, p);
  o += particles(t, 23, 24, NEON.cyan, [0, 300, 720, 1000], 18, 2);
  const disc = prog(t, le(14) + 0.2, le(14) + 0.7);
  if (disc > 0) o += text(360, 1000, 'Fictional story · Not financial advice', { size: 22, fill: '#8a8a8a', weight: 500, op: disc.toFixed(2) });
  return cam([360, 640], [360, 640], 1 + 0.04 * prog(t, CUT.end, window.DURATION), o);
}

// ---------- compose ----------
const DEFS = `<defs>${DEFS_COMMON}${noirDefs('../../assets/img/grain.png')}
  <clipPath id="dinerWin"><rect x="30" y="300" width="310" height="470"/></clipPath>
  <clipPath id="bedWin"><rect x="410" y="250" width="300" height="500"/></clipPath>
  <clipPath id="grindWin"><rect x="60" y="260" width="600" height="420"/></clipPath>
  <clipPath id="lensL"><rect x="-280" y="-70" width="250" height="150" rx="50"/></clipPath>
  <clipPath id="lensR"><rect x="30" y="-70" width="250" height="150" rx="50"/></clipPath>
  <linearGradient id="tubeCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cff6ff" stop-opacity="0.35"/><stop offset="1" stop-color="#cff6ff" stop-opacity="0"/></linearGradient>
  <linearGradient id="bannerGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1a04"/><stop offset="1" stop-color="#0c0702"/></linearGradient>
  <linearGradient id="duskSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05030c"/><stop offset="0.7" stop-color="#1a0d2e"/><stop offset="1" stop-color="#3a1640"/></linearGradient>
  <linearGradient id="beamGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c0" stop-opacity="0.4"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></linearGradient>
  <linearGradient id="sweepBand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`;
const SCENES = [[0, CUT.search, sceneJob], [CUT.search, CUT.found, sceneSearch], [CUT.found, CUT.grind, sceneFound], [CUT.grind, CUT.later, sceneGrind],
  [CUT.later, CUT.shift, sceneLater], [CUT.shift, CUT.trader, sceneShift], [CUT.trader, CUT.fifty, sceneTrader], [CUT.fifty, CUT.rich, sceneFifty],
  [CUT.rich, CUT.hero, sceneRich], [CUT.hero, CUT.end, sceneHero], [CUT.end, Infinity, sceneEnd]];
const sceneAt = (t) => { for (const [a, b, fn] of SCENES) if (t >= a && t < b) return fn(t); return ''; };

const stage = document.getElementById('stage');
stage.innerHTML = DEFS + '<g id="frame"></g>';
const frameEl = document.getElementById('frame');
window.ready = new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = '../../assets/img/grain.png'; });

window.renderFrame = function (t) {
  let o = sceneAt(t);
  // light streak on hard cuts
  for (const c of [CUT.shift, CUT.trader, CUT.fifty, CUT.rich, CUT.hero]) {
    if (Math.abs(t - c) < 0.12) {
      const u = prog(t, c - 0.12, c + 0.12);
      o += `<rect x="${f1(lerp(-500, 900, u))}" y="-200" width="260" height="1700" fill="url(#sweepBand)" opacity="0.8" transform="skewX(-12)"/>`;
    }
  }
  if (Math.abs(t - CUT.later) < 0.35) o += `<rect width="720" height="1280" fill="#000" opacity="${(1 - Math.abs(t - CUT.later) / 0.35).toFixed(2)}"/>`;
  o += finish(t);
  o += subtitle(t, SUBS, { y: 1110, gold: GOLDW });
  const dip = Math.max(t < 0.4 ? 1 - t / 0.4 : 0, prog(t, window.DURATION - 0.6, window.DURATION - 0.05));
  if (dip > 0) o += `<rect width="720" height="1280" fill="#000" opacity="${clamp(dip).toFixed(3)}"/>`;
  frameEl.innerHTML = o;
};
