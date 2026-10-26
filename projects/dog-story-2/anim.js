'use strict';
// "Rags to Riches 2: The Glow Up". Cheated on for being broke, taught by TJR,
// and a year later the ex comes back. Timing comes from timeline.js.

const TL = window.TL;
const C = TL.cuts;
window.DURATION = TL.duration;
const jaw = (who, t) => jawFrom(TL, who, t);

// ---------- 1. the café: caught red-pawed ----------
function cafeInterior(t) {
  let o = `<rect x="300" y="400" width="400" height="480" fill="url(#warmWin)"/>`;
  o += `<rect x="300" y="820" width="400" height="60" fill="#5a2e14"/>`;
  o += `<rect x="380" y="770" width="240" height="14" fill="#f4efe6"/><path d="M 380 784 L 372 840 L 628 840 L 620 784 Z" fill="#ece5d8"/>`;
  o += `<rect x="496" y="728" width="8" height="42" fill="#f6f0dc"/><ellipse cx="500" cy="722" rx="5" ry="9" fill="#ffb84a"/><circle cx="500" cy="726" r="40" fill="url(#lampGlow)"/>`;
  o += `<ellipse cx="500" cy="768" rx="40" ry="8" fill="#fff"/><path d="M 470 764 Q 500 750 530 764" stroke="#e8c070" stroke-width="5" fill="none"/>`;
  const kissU = prog(t, 3.2, 3.6) * (1 - prog(t, 4.6, 5.0));
  const turn = prog(t, 5.6, 5.9);
  const bx = 430 + kissU * 22, ux = 570 - kissU * 22;
  o += dog({ breed: 'poodle', x: bx, y: 840, s: 0.55, tilt: 35, hipLift: 38, neck: 30, headTilt: -8 + turn * 18, lid: 0.45, brow: 0.3, earLift: 0.25, tailUp: 60, jaw: jaw('ex', t), acc: { bow: '#ff5fa2' }, paws: sitPaws(bx, 840, 0.55), noShadow: true }, t).svg;
  const watch = prog(t, 7.3, 7.5) * (1 - prog(t, 8.8, 9.1));
  const um = dog({ breed: 'bulldog', x: ux, y: 840, s: 0.55, flip: -1, tilt: 30, hipLift: 22, neck: 18, lid: 0.3, brow: 0.5, earLift: 0.5, jaw: jaw('bull', t), acc: { chain: true }, paws: { ...sitPaws(ux, 840, 0.55, -1), fN: mix([ux - 30, 840], [ux - 60, 740], watch) }, noShadow: true }, t);
  o += um.svg;
  if (watch > 0) o += `<circle cx="${f1(um.paw[0] + 4)}" cy="${f1(um.paw[1] - 10)}" r="7" fill="#F2C230" stroke="#9a7410" stroke-width="2"/>` + star(um.paw[0] + 4, um.paw[1] - 12, 12 * watch, Math.abs(Math.sin(t * 12)), '#fff6c0');
  if (t > 3.0 && t < 4.8) {
    const len = 1 - kissU;
    o += `<path d="M ${f1(bx + 34)} ${f1(744)} Q 500 ${f1(770 - 20 * len)} ${f1(ux - 34)} 744" stroke="#e8c070" stroke-width="3" fill="none"/>`;
  }
  if (t > 3.55 && t < 4.6) { const u = prog(t, 3.55, 4.6); o += `<path transform="translate(500 ${f1(700 - u * 60)}) scale(${f1(1 + u)})" d="M 0 8 C -14 -2 -10 -14 0 -6 C 10 -14 14 -2 0 8 Z" fill="#ff4f7a" opacity="${f1(1 - u)}"/>`; }
  return o;
}
function sceneCafe(t) {
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#eveSky)"/>` + bricks(250, 1060, [118, 62, 46]);
  o += `<g filter="url(#blur3)">${cafeInterior(t)}</g>`;
  o += `<path d="M 300 400 L 420 400 L 300 620 Z" fill="#fff" opacity="0.07"/><rect x="300" y="400" width="400" height="480" fill="none" stroke="#2a1a12" stroke-width="16"/><line x1="500" y1="400" x2="500" y2="880" stroke="#2a1a12" stroke-width="8"/>`;
  for (let i = 0; i < 8; i++) o += `<path d="M ${290 + i * 52} 340 L ${342 + i * 52} 340 L ${342 + i * 52} 380 Q ${316 + i * 52} 396 ${290 + i * 52} 380 Z" fill="${i % 2 ? '#f4efe6' : '#c8283a'}"/>`;
  o += `<text x="500" y="318" font-family="Oswald" font-style="italic" font-weight="700" font-size="54" fill="#ffd36a" text-anchor="middle" filter="url(#glow)">Le Bark</text>`;
  o += lampPost(120, 1060, t, 1);
  o += `<rect x="-100" y="1060" width="920" height="300" fill="#4a4a50"/><rect x="-100" y="1060" width="920" height="12" fill="#66666c"/>`;
  // our hero
  const g = 1062, s = 0.9;
  const walking = t < 3.0;
  const x = walking ? lerp(-150, 230, t / 3.0) : 230;
  const sad = prog(t, 5.8, 8.6);
  const look = prog(t, 3.0, 3.3);
  const d = dog({ breed: 'stray', x, y: g, s, neck: lerp(14, 48, look) - sad * 22, headTilt: t > 4.2 && t < 5.6 ? 16 : 0, lid: lerp(0.05, 0.55, sad), brow: lerp(0.3, -1, Math.max(sad, look * 0.3)), earLift: walking ? 0.6 : lerp(0.8, 0, sad), tailUp: lerp(45, -30, sad), wag: walking ? 25 : 18 * (1 - sad), wagSpeed: 16, jaw: jaw('hero', t), dirt: 0.5, tear: t > 8.7, sparkle: t < 3.4, paws: walking ? walkPaws(x, g, s, t * 9) : null }, t);
  o += d.svg;
  if (t < 4.1) o += boneWithBow(d.head[0] + 46, d.head[1] + 22, -8, 0.9);
  else { const u = prog(t, 4.1, 4.5), bounce = Math.abs(Math.sin(u * Math.PI * 2)) * (1 - u) * 30; o += boneWithBow(lerp(d.head[0] + 46, 330, u), lerp(d.head[1] + 22, g - 8, Math.min(1, u * 1.6)) - bounce, u * 160, 0.9); }
  if (t > 3.95 && t < 4.5) o += `<text x="${f1(d.head[0] + 20)}" y="${f1(d.head[1] - 70)}" font-family="Anton" font-size="56" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke">!?</text>`;
  o += grade('#6a5a8a', 0.22);
  const z = lerp(1.0, 1.28, ease.inOut(prog(t, 2.6, 5.0)));
  return cam([400, 840], [360, 760], z, o);
}

// ---------- 2. the street: TJR finds him ----------
function citySilhouette(t) {
  let o = '';
  const r = rng(12);
  for (let i = 0; i < 9; i++) {
    const x = i * 90 - 20, h = 300 + r() * 300;
    o += `<rect x="${x}" y="${1050 - h}" width="86" height="${h}" fill="#0f1120"/>`;
    for (let k = 0; k < 10; k++) if (r() < 0.35) o += `<rect x="${f1(x + 10 + (k % 3) * 24)}" y="${f1(1050 - h + 20 + Math.floor(k / 3) * 40)}" width="12" height="18" fill="#ffcf7a" opacity="0.5"/>`;
  }
  return `<g filter="url(#blur3)">${o}</g>`;
}
function sceneStreet(t) {
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#nightSky)"/>` + citySilhouette(t);
  o += lampPost(560, 1050, t, 1);
  o += `<rect x="-100" y="1050" width="920" height="300" fill="#1c1d22"/><rect x="-100" y="1050" width="920" height="16" fill="#3a3a40"/><ellipse cx="420" cy="1150" rx="160" ry="20" fill="#2a3442" opacity="0.8"/>`;
  const g = 1052;
  // TJR walks in from the right with an umbrella, then crouches
  const tStop = 13.0, tCrouch = 13.5, tPhone = 15.2;
  const walkU = prog(t, 10.6, tStop);
  const tx = lerp(860, 480, ease.out(walkU));
  const walking = t > 10.6 && t < tStop;
  const ph = (tx / 70) * Math.PI;
  const crouch = ease.inOut(prog(t, tCrouch, tCrouch + 0.5));
  const cover = ease.inOut(prog(t, tStop, tStop + 0.45));
  const fN = walking ? [tx - 16 + Math.sin(ph) * 26, g - Math.max(0, Math.cos(ph)) * 12] : [tx - lerp(14, 50, crouch), g];
  const fF = walking ? [tx + 10 - Math.sin(ph) * 26, g - Math.max(0, -Math.cos(ph)) * 12] : [tx + lerp(10, 30, crouch), g];
  const umbHand = mix([tx + 10, lerp(870, 880, 0)], [tx + 70, lerp(850, 930, crouch)], cover);
  const phoneHand = mix([tx - 10, lerp(900, 960, crouch)], [300, 930], ease.inOut(prog(t, tPhone, tPhone + 0.4)));
  const tj = human({ x: tx, y: g, s: 0.85, flip: -1, hip: [0, crouch * 92], lean: crouch * 26, headTilt: crouch * 14, fN, fF, hF: umbHand, hN: phoneHand, umbrella: true, phone: t > tPhone ? 'chart' : null, smile: 0.4 + 0.4 * prog(t, 14.0, 14.5), blink: blink(t, 0.7) }, t);
  // the dog on the curb
  const x = 250, s = 0.85;
  const up = ease.inOut(prog(t, 13.9, 14.2));
  const hopeful = prog(t, 15.8, 16.1);
  o += dog({ breed: 'stray', x, y: g, s, tilt: 34, hipLift: 38, neck: lerp(4, 48, up), headTilt: up * 10, lid: lerp(0.55, 0.0, up), brow: lerp(-1, -0.2, up), earLift: lerp(0, 0.9, up), tailUp: lerp(-30, 40, hopeful), wag: hopeful * 30, wagSpeed: 18, jaw: jaw('hero', t), dirt: 0.8, tear: up < 0.5, sparkle: up > 0.5, look: [0.4, -0.6], paws: sitPaws(x, g, s) }, t).svg;
  // drips off the dog while it's still raining on him
  if (cover < 1) for (let i = 0; i < 4; i++) { const p = (t * 1.8 + i * 0.25) % 1; o += `<circle cx="${210 + i * 22}" cy="${f1(960 + p * 80)}" r="3" fill="#bfe0ff" opacity="${f1((1 - p) * (1 - cover))}"/>`; }
  o += tj.svg;
  if (t > 14.0 && t < 14.6) o += `<text x="330" y="820" font-family="Anton" font-size="64" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke" opacity="${f1(1 - prog(t, 14.3, 14.6))}">!</text>`;
  const top = [tj.hF[0] - 6, tj.hF[1] - 128];
  o += rainFx(t, 0.34, 90, 4, cover > 0.5 ? [top[0] - 130, top[1], top[0] + 130, 1100] : null);
  o += grade('#4a5a8a', 0.3);
  const z = lerp(1.05, 1.2, ease.inOut(prog(t, tStop, tPhone)));
  return cam([360, 860], [360, 780], z, o);
}

// ---------- 3. lessons ----------
function cafeChair(x, y, f = 1) {
  return `<g transform="translate(${x} ${y}) scale(${f} 1)"><rect x="-40" y="-8" width="90" height="12" rx="4" fill="#6a4a2a"/><path d="M -36 -8 L -44 -130 M -36 -8 L -40 110 M 44 4 L 48 110" stroke="#4a3018" stroke-width="7"/><rect x="-52" y="-136" width="14" height="70" rx="4" fill="#6a4a2a"/></g>`;
}
function sceneLessons(t) {
  const tRed = 20.4, tGreen = 22.6, tProud = 24.7;
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#daySky)"/><rect x="-100" y="300" width="920" height="760" fill="#e9dcc6"/>`;
  o += `<rect x="60" y="380" width="600" height="380" fill="#9ab8c8" stroke="#6a5a4a" stroke-width="12"/><path d="M 80 400 L 220 400 L 80 600 Z" fill="#fff" opacity="0.2"/>`;
  o += stickyNote(170, 470, -6, 'RISK 1%') + stickyNote(360, 450, 4, 'PATIENCE', '#9ff0c0') + stickyNote(550, 480, -3, 'WAIT FOR THE SETUP', '#ffc0d8');
  o += `<rect x="-100" y="1060" width="920" height="300" fill="#c9b08a"/><rect x="-100" y="1060" width="920" height="10" fill="#b39a74"/>`;
  o += cafeChair(150, 960, 1) + cafeChair(580, 960, -1);
  o += `<rect x="230" y="880" width="270" height="14" rx="4" fill="#f4efe6"/><path d="M 365 894 L 365 1060 M 320 1060 L 410 1060" stroke="#555" stroke-width="8"/>`;
  const red = t > tRed && t < tGreen;
  o += laptopFront(365, 880, 0.85, (x0, y0, w, h) => `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${red ? '#1a0a0c' : '#081a10'}"/>${miniChart(x0 + 4, y0 + 6, w - 8, h - 12, red ? 'red' : t > tGreen ? 'green' : 'mixed', t, 12)}`);
  // TJR, seated, facing left
  const pat = t > tRed + 0.8 && t < tGreen ? ease.inOut(prog(t, tRed + 0.8, tRed + 1.1)) : 0;
  const bump = t > 22.9 && t < 23.8 ? ease.inOut(prog(t, 22.9, 23.15)) * (1 - ease.inOut(prog(t, 23.5, 23.8))) : 0;
  const thumbs = ease.back(prog(t, tProud, tProud + 0.3));
  const point = t < tRed ? 0.5 + 0.5 * Math.sin(t * 2.2) : 0;
  let hN = mix([480, 900], [400, 790], point);
  hN = mix(hN, [215, 820], pat);
  hN = mix(hN, [300, 780], bump);
  const hF = mix([560, 900], [600, 740], thumbs);
  o += human({ x: 580, y: 1060, s: 0.82, flip: -1, hip: [0, 62], lean: 6 + pat * 14 + bump * 10, headTilt: 8, fN: [500, 1060], fF: [520, 1060], hN, hF, smile: 0.5 + 0.4 * (t > tGreen ? 1 : 0), blink: blink(t, 1.1) }, t).svg;
  // the student
  const x = 150, g = 958, s = 0.78;
  const angry = red ? ease.out(prog(t, tRed, tRed + 0.25)) * (1 - pat) : 0;
  const happy = t > tGreen;
  const hop = happy && t < tProud ? Math.abs(Math.sin(t * 10)) * 18 : 0;
  const paws = bump > 0 ? { ...sitPaws(x, g - hop, s), fN: mix([x + 34, g], [292, 784], bump) } : angry > 0.3 ? uprightPaws(x, g, s, 1, [x + 60, g - 130], [x + 50, g - 120]) : sitPaws(x, g - hop, s);
  o += dog({ breed: 'stray', x, y: g - hop, s, tilt: angry > 0.3 ? 72 : 36, hipLift: angry > 0.3 ? 30 : 38, neck: happy ? 34 : 14 + Math.sin(t * 4) * (t < tRed ? 6 : 0), headTilt: t < tRed ? Math.sin(t * 4) * 6 : 0, lid: angry ? 0.25 : 0.1, brow: angry ? 1 : happy ? -0.3 : 0.4, earLift: happy ? 0.9 : angry ? 0.7 : 0.5, tailUp: happy ? 55 : 20, wag: happy ? 35 : 6, wagSpeed: happy ? 26 : 8, jaw: jaw('hero', t), tongue: happy && t < tProud ? 0.5 : 0, dirt: 0.2, sparkle: happy, acc: { glasses: t < tGreen, pen: t < tRed }, paws }, t).svg;
  if (bump > 0.9) o += star(296, 782, 34, 1, '#fff6c0');
  o += grade('#ffe8c0', 0.12);
  return cam([370, 860], [360, 800], 1.08, o);
}

// ---------- 4. one year later ----------
function sceneLater(t) {
  const u = prog(t, C.later, C.bella);
  const op = prog(t, C.later + 0.1, C.later + 0.5) * (1 - prog(t, C.bella - 0.3, C.bella));
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="#0c0906"/>`;
  o += `<g opacity="${op.toFixed(2)}">${text(360, 620, 'ONE YEAR LATER', { size: 92, fill: '#f2d9a0', family: 'Anton', weight: 400, ls: lerp(18, 6, ease.out(u)) })}${text(360, 690, '(still 7 in dog years)', { size: 34, fill: '#bfa77a', family: 'Oswald', weight: 500 })}</g>`;
  return o;
}

// ---------- 5. Bella's downfall ----------
function giantBowl(x, y, sc) {
  return `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M -60 -30 L 60 -30 L 48 10 L -48 10 Z" fill="#e8b830"/><ellipse cx="0" cy="-30" rx="60" ry="12" fill="#f6d55c"/><ellipse cx="0" cy="-32" rx="50" ry="8" fill="#8a5a2a"/></g>`;
}
function sceneBella(t) {
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#nightSky)"/>` + citySilhouette(t + 3);
  o += `<rect x="-100" y="1050" width="920" height="300" fill="#1c1d22"/><rect x="-100" y="1050" width="920" height="16" fill="#3a3a40"/>`;
  const g = 1052, s = 0.85;
  const x = lerp(-120, 420, prog(t, C.bella, 32.0));
  const walking = t < 32.0;
  const bel = dog({ breed: 'poodle', x, y: g, s, neck: -2, lid: 0.5, brow: -1, earLift: 0, tailUp: -20, jaw: jaw('ex', t), dirt: 1, tear: t > 32.0, acc: { bowDroop: true }, paws: walking ? walkPaws(x, g, s, t * 6, 18, 8) : null }, t);
  o += bel.svg;
  o += cloudGag(bel.head[0] - 20, bel.head[1] - 170, t, 1);
  // flashback bubble: the bulldog leaves her for a bigger bowl
  const fb = prog(t, 29.5, 29.8) * (1 - prog(t, 31.6, 31.9));
  if (fb > 0) {
    let inner = `<rect x="160" y="230" width="400" height="300" fill="#d8c8a8"/><rect x="160" y="470" width="400" height="60" fill="#a89878"/>`;
    const bx = lerp(260, 420, prog(t, 29.6, 31.6));
    inner += dog({ breed: 'bulldog', x: bx, y: 500, s: 0.62, neck: 30, lid: 0.3, brow: 0.5, earLift: 0.5, jaw: jaw('bull', t), acc: { chain: true }, paws: walkPaws(bx, 500, 0.62, t * 8, 16, 8) }, t).svg + giantBowl(bx + 70, 420, 0.8);
    o += `<g opacity="${fb.toFixed(2)}"><circle cx="${f1(bel.head[0] + 10)}" cy="${f1(bel.head[1] - 230)}" r="9" fill="#f4efe6"/><circle cx="${f1(bel.head[0] + 40)}" cy="${f1(bel.head[1] - 290)}" r="14" fill="#f4efe6"/>`;
    o += `<g clip-path="url(#bubbleClip)"><g filter="url(#sepia)">${inner}</g></g><ellipse cx="360" cy="380" rx="210" ry="160" fill="none" stroke="#f4efe6" stroke-width="10"/></g>`;
  }
  o += rainFx(t, 0.25, 50, 9);
  o += grade('#4a5a8a', 0.3);
  return cam([380, 860], [360, 780], 1.12, o);
}

// ---------- 6-8. the gala ----------
function galaSet(t, flashRate) {
  let o = `<rect x="-100" y="-100" width="920" height="1400" fill="url(#nightSky)"/>`;
  o += `<rect x="-100" y="340" width="920" height="680" fill="#141a3a"/>`;
  for (let row = 0; row < 7; row++) for (let i = 0; i < 6; i++) {
    const x = -40 + i * 150 + (row % 2) * 75, y = 400 + row * 92;
    o += row % 2 ? `<path transform="translate(${x} ${y - 10})" d="M 0 -14 L 4 -4 L 14 -4 L 6 3 L 9 14 L 0 7 L -9 14 L -6 3 L -14 -4 L -4 -4 Z" fill="#c9a24a" opacity="0.5"/>` : text(x, y, 'GALA', { size: 34, fill: '#c9a24a', family: 'Anton', weight: 400, op: 0.45, ls: 6 });
  }
  o += `<polygon points="-100,1020 820,1020 820,1140 -100,1140" fill="#a8122a"/><rect x="-100" y="1020" width="920" height="8" fill="#d8304a"/>`;
  for (const px of [40, 250, 470, 690]) o += `<rect x="${px - 5}" y="900" width="10" height="120" fill="#d8b040"/><circle cx="${px}" cy="898" r="9" fill="#f6d55c"/>`;
  for (const [a, b] of [[40, 250], [470, 690]]) o += `<path d="M ${a} 910 Q ${(a + b) / 2} 960 ${b} 910" stroke="#7a0a1a" stroke-width="10" fill="none"/>`;
  o += `<rect x="-100" y="1140" width="920" height="200" fill="#2a2a30"/><ellipse cx="300" cy="1200" rx="120" ry="16" fill="#3a4a5a" opacity="0.8"/>`;
  o += paparazzi(t, 3, flashRate, [-60, 360, 780, 1000]);
  return o;
}
function crewInCar(t) {
  let o = `<path d="M -250 -66 Q -250 -96 -214 -96 L -190 -96 Q -176 -96 -178 -66 Z M -110 -70 Q -110 -102 -76 -102 L -52 -102 Q -38 -102 -40 -70 Z" fill="#c8915a"/>`;
  o += dog({ breed: 'diva', x: -170, y: -10, s: 0.78, tilt: 62, hipLift: 34, neck: 24, headTilt: -8, lid: 0.35, earLift: 0.1, earSwing: 20 + Math.sin(t * 12) * 8, jaw: jaw('gf', t), acc: { pearls: 1, gown: 'red', tiara: true }, noShadow: true, paws: { hN: [-210, -10], hF: [-220, -10], fN: [-130, -60], fF: [-140, -56] } }, t).svg;
  o += dog({ breed: 'stray', x: -60, y: -6, s: 0.84, tilt: 64, hipLift: 34, neck: 22, lid: 0.15, brow: 0.4, earLift: 0.2, earSwing: 20 + Math.sin(t * 12) * 8, jaw: jaw('hero', t), acc: { chain: true, shades: 1, tux: true }, noShadow: true, paws: { hN: [-100, -6], hF: [-110, -6], fN: [44, -104], fF: [36, -98] } }, t).svg;
  o += `<line x1="62" y1="-64" x2="44" y2="-92" stroke="#555" stroke-width="5"/><ellipse cx="40" cy="-98" rx="9" ry="26" transform="rotate(-18 40 -98)" fill="none" stroke="#222" stroke-width="6"/>`;
  return o;
}
function bellaAt(t, x, extra = {}) {
  return dog({ breed: 'poodle', x, y: 1030, s: 0.8, neck: 22, lid: 0.3, brow: -0.6, earLift: 0.3, tailUp: 10, jaw: jaw('ex', t), dirt: 0.7, acc: { bowDroop: true }, ...extra }, t);
}
function sceneMeet(t) {
  let o = galaSet(t, 0.6);
  o += luxCar(t, 560, 1060, { col: 'gold', s: 0.72 });
  // hero in a tux, facing Bella
  const lower = ease.inOut(prog(t, 38.8, 39.1)) * (1 - ease.inOut(prog(t, 40.0, 40.3)));
  const hx = 400, hg = 1032;
  o += dog({ breed: 'stray', x: hx, y: hg, s: 0.9, flip: -1, tilt: 78, hipLift: 28, neck: lerp(18, 8, lower), headTilt: lerp(-14, 0, prog(t, 38.6, 38.9)), lid: lerp(0.2, 0.5, lower), brow: 0.5, earLift: 0.25, tailUp: 10, jaw: jaw('hero', t), acc: { tux: true, chain: true, shades: 1, shadesDrop: lower }, paws: uprightPaws(hx, hg, 0.9, -1, [hx - 40, hg - 120], [hx - 30, hg - 112]) }, t).svg;
  // Bella walks up, sees him, shakes off, flirts
  const bx = lerp(-120, 130, ease.out(prog(t, C.meet, 35.8)));
  const walking = t < 35.8;
  const seen = t > 35.2;
  const shake = t > 35.6 && t < 36.2 ? Math.sin(t * 60) * 10 : 0;
  const flirt = t > 36.2 && t < 41.0;
  const sad = prog(t, 41.0, 41.3);
  o += bellaAt(t, bx + shake, { neck: seen ? 34 : 18, headTilt: flirt ? -12 + Math.sin(t * 3) * 4 : 0, lid: flirt ? 0.35 + 0.35 * Math.max(0, Math.sin(t * 16)) : sad ? 0.5 : 0.3, brow: sad ? -1 : -0.3, earLift: seen && !sad ? 0.6 : 0.1, tailUp: flirt ? 50 : -10, wag: flirt ? 30 : 0, wagSpeed: 20, dirt: t > 36.0 ? 0.45 : 0.85, tear: sad > 0.5, acc: { bowDroop: true, heartEyes: seen && t < 41.0 }, paws: walking ? walkPaws(bx, 1030, 0.8, t * 8, 18, 10) : null }).svg;
  if (shake) for (let i = 0; i < 10; i++) { const a = i * 0.63 + t * 4; o += `<circle cx="${f1(bx + 20 + Math.cos(a) * (60 + (t - 35.6) * 200))}" cy="${f1(930 + Math.sin(a) * 50)}" r="4" fill="#a9d2ff"/>`; }
  o += grade('#5a4a8a', 0.2);
  const z = t > 38.6 ? lerp(1.3, 1.6, ease.inOut(prog(t, 38.6, 39.2))) : 1.3;
  return cam([290, 900], [360, 850], z, o);
}
function sceneReveal(t) {
  let o = galaSet(t, 1.6);
  const tDoor = C.reveal + 0.3, tOut = C.reveal + 0.9, tPaw = 45.0, tShock = 47.6;
  const door = ease.out(prog(t, tDoor, tDoor + 0.6));
  o += `<g opacity="${(door * 0.9).toFixed(2)}">${[...Array(8)].map((_, i) => { const a = -Math.PI / 2 - 0.9 + i * 0.26; return `<path d="M 520 980 L ${f1(520 + 900 * Math.cos(a - 0.05))} ${f1(980 + 900 * Math.sin(a - 0.05))} L ${f1(520 + 900 * Math.cos(a + 0.05))} ${f1(980 + 900 * Math.sin(a + 0.05))} Z" fill="#fff2c0" opacity="0.15"/>`; }).join('')}</g>`;
  o += luxCar(t, 560, 1060, { col: 'gold', s: 0.72 });
  o += `<g transform="translate(470 1020) scale(${f1(1 - door * 0.85)} 1)"><rect x="0" y="-50" width="120" height="58" rx="4" fill="url(#car_gold)" stroke="#8a6410" stroke-width="2"/></g>`;
  // Coco steps out in slow motion
  const step = ease.inOut(prog(t, tOut, tOut + 1.6));
  const cxp = lerp(580, 510, step), cg = lerp(1000, 1032, step);
  const pawMeet = ease.inOut(prog(t, tPaw, tPaw + 0.4));
  o += dog({ breed: 'diva', x: cxp, y: cg, s: 0.92, flip: -1, tilt: 80, hipLift: 30, neck: 34, headTilt: t > 45.5 && t < 47.2 ? 10 : -6, lid: t > 45.5 ? 0.45 : 0.25, earLift: 0.1, earSwing: Math.sin(t * 2.4) * 14 + 10, tailUp: 10, jaw: jaw('gf', t), acc: { gown: 'red', tiara: true, pearls: true }, paws: uprightPaws(cxp, cg, 0.92, -1, mix([cxp - 40, cg - 150], [458, 930], pawMeet), [cxp - 20, cg - 140]) }, t).svg;
  o += sparkles(t, 61, [cxp - 160, cg - 330, cxp + 120, cg], 30);
  const hx = 400, hg = 1032;
  o += dog({ breed: 'stray', x: hx, y: hg, s: 0.9, flip: 1, tilt: 78, hipLift: 28, neck: 16, headTilt: -6, lid: 0.15, brow: 0.3, earLift: 0.3, tailUp: 30, wag: 14, jaw: jaw('hero', t), acc: { tux: true, chain: true, shades: 1 }, paws: uprightPaws(hx, hg, 0.9, 1, mix([hx + 40, hg - 120], [456, 934], pawMeet), [hx + 30, hg - 112]) }, t).svg;
  // Bella, speechless
  const shock = t > tShock;
  const bel = bellaAt(t, 110, { neck: 30, lid: shock ? (Math.sin(t * 40) > 0.85 ? 0.6 : 0) : 0.3, brow: shock ? -0.4 : -0.8, earLift: shock ? 0.9 : 0.2, jaw: shock ? 0.6 : 0, dirt: 0.45, look: [1, 0], acc: { bowDroop: t < 49.0 } });
  o += bel.svg;
  if (t > 49.0 && t < 49.6) { const u = prog(t, 49.0, 49.6); o += `<g transform="translate(${f1(bel.head[0] - 10)} ${f1(bel.head[1] - 20 + ease.in(u) * 120)}) rotate(${f1(u * 200)})"><path d="M 0 0 L -12 -6 L -10 9 Z M 0 0 L 9 -4 L 11 8 Z" fill="#b08a9a"/></g>`; }
  o += grade('#5a4a8a', 0.18);
  let z = 1.18, F = [330, 900], P = [360, 850];
  if (shock) { const u = ease.inOut(prog(t, tShock, tShock + 0.6)); z = lerp(1.18, 2.8, u); F = mix([330, 900], bel.head, u); P = mix([360, 850], [360, 640], u); }
  return cam(F, P, z, o);
}
function sceneEnding(t) {
  let o = galaSet(t, 0.5);
  const tArrive = 51.4, tTake = 53.0, tFlick = 53.6, tCar = 54.6, tGo = 55.4, tSplash = 56.0, tNo = 58.3;
  // the getaway car
  const carX = t < tGo ? 560 : lerp(560, 1500, ease.in(prog(t, tGo, tGo + 1.1)));
  if (t > tCar) o += luxCar(t, carX, 1060, { col: 'gold', s: 0.72, seats: false, wheelRot: carX, under: crewInCar(t) });
  else o += luxCar(t, 560, 1060, { col: 'gold', s: 0.72 });
  // hero + Coco standing until they hop in
  if (t < tCar) {
    const hx = 420, hg = 1032;
    const take = ease.inOut(prog(t, tTake - 0.3, tTake)), flick = ease.out(prog(t, tFlick - 0.2, tFlick));
    o += dog({ breed: 'diva', x: 515, y: 1032, s: 0.92, flip: -1, tilt: 80, hipLift: 30, neck: 30, lid: 0.45, earLift: 0.1, earSwing: Math.sin(t * 2.4) * 10, acc: { gown: 'red', tiara: true, pearls: true }, paws: uprightPaws(515, 1032, 0.92, -1, [475, 900], [495, 890]) }, t).svg;
    o += dog({ breed: 'stray', x: hx, y: hg, s: 0.9, flip: -1, tilt: 78, hipLift: 28, neck: 14, lid: 0.3, brow: 0.5, earLift: 0.25, jaw: jaw('hero', t), acc: { tux: true, chain: true, shades: 1 }, paws: uprightPaws(hx, hg, 0.9, -1, mix([hx - 40, hg - 120], [hx - 70, hg - 150], Math.max(take * (1 - flick), flick)), [hx - 30, hg - 112]) }, t).svg;
    if (t > tTake && t < tCar) o += `<rect x="${hx - 100}" y="${hg - 190}" width="44" height="40" rx="6" fill="#e8442a"/>`;
  }
  const soaked = t > tSplash + 0.15;
  // Bella
  const stomp = prog(t, tNo + 0.3, 60.6);
  const bx = 90 - stomp * 300;
  o += bellaAt(t, bx, { flip: t > tNo + 0.3 ? -1 : 1, neck: t > tNo ? 30 : 20, lid: soaked ? 0.5 : 0.3, brow: t > tNo ? 1 : -0.6, earLift: t > tNo ? 0.7 : 0.1, tailUp: t > tNo ? 40 : -10, dirt: soaked ? 1 : 0.45, look: [1, 0], paws: stomp > 0 ? walkPaws(bx, 1030, 0.8, t * 12, 20, 12, 64, -62, -1) : null }).svg;
  // the bulldog on his delivery scooter
  const sx = lerp(-260, 270, ease.out(prog(t, C.ending, tArrive)));
  o += scooter(sx, 1100, 0.75, sx / 20);
  const turnToBella = t > 56.6;
  const bd = dog({ breed: 'bulldog', x: sx - 10, y: 1038, s: 0.7, flip: turnToBella ? -1 : 1, tilt: 64, hipLift: 22, neck: 14, lid: soaked ? 0.55 : 0.4, brow: -0.6, earLift: 0.2, jaw: jaw('bull', t), acc: { helmet: '#d83a2a' }, noShadow: true, paws: { hN: [sx - 40, 1040], hF: [sx - 50, 1040], fN: t < tTake && t > tArrive ? [sx + 60, 920] : [sx + 30, 960], fF: [sx + 20, 966] } }, t);
  o += bd.svg;
  if (t > tArrive && t < tTake) o += `<rect x="${f1(sx + 50)}" y="905" width="44" height="40" rx="6" fill="#e8442a"/>`;
  // the dollar tip
  if (t > tFlick) {
    const u = prog(t, tFlick, tFlick + 0.5);
    const p0 = [350, 860], p1 = [bd.head[0] + 20, bd.head[1]];
    const pos = u < 1 ? [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) - Math.sin(u * Math.PI) * 60] : p1;
    o += cashBill(pos[0], pos[1], u < 1 ? u * 720 : -10, 0.9, 1);
  }
  if (soaked) {
    o += `<rect x="-100" y="760" width="${f1(sx + 160)}" height="300" fill="#4a7ab0" opacity="0.18" style="mix-blend-mode:multiply"/>`;
    for (let i = 0; i < 8; i++) { const p = (t * 1.6 + i * 0.13) % 1; o += `<circle cx="${f1(60 + i * 34 + (i > 4 ? sx - 200 : 0))}" cy="${f1(920 + p * 110)}" r="3" fill="#bfe0ff" opacity="${f1(1 - p)}"/>`; }
  }
  o += splashWave(360, 1150, t, tSplash);
  o += grade('#5a4a8a', 0.18);
  const zz = t > 56.4 && t < C.endcard ? ease.inOut(prog(t, 56.4, 56.9)) : 0;
  let out = cam(mix([300, 920], [200, 930], zz), [360, 860], lerp(1.12, 1.5, zz), o);
  if (t > C.endcard) {
    const u = prog(t, C.endcard, C.endcard + 0.6);
    out += `<rect width="720" height="1280" fill="#000" opacity="${(0.7 * u).toFixed(2)}"/>`;
    out += `<g opacity="${u.toFixed(2)}">${text(360, 540, 'MORAL:', { size: 34, fill: '#f2d9a0', family: 'Oswald', weight: 500, ls: 4 })}${text(360, 610, 'Be the dog with the plan.', { size: 52, fill: '#fff', family: 'Oswald', weight: 700 })}${text(360, 690, 'Not financial advice. Still not from a dog.', { size: 28, fill: '#bfa77a', family: 'Oswald', weight: 500 })}<g transform="translate(360 790)" fill="#f2d9a0"><ellipse cx="0" cy="14" rx="26" ry="22"/><ellipse cx="-30" cy="-16" rx="10" ry="13"/><ellipse cx="-10" cy="-30" rx="10" ry="13"/><ellipse cx="12" cy="-30" rx="10" ry="13"/><ellipse cx="32" cy="-16" rx="10" ry="13"/></g></g>`;
  }
  return out;
}

// ---------- compose ----------
const DEFS = `<defs>${DEFS_COMMON}${dogDefs()}${humanDefs()}${dogSceneDefs()}
  <clipPath id="bubbleClip"><ellipse cx="360" cy="380" rx="210" ry="160"/></clipPath>
</defs>`;
const SCENES = [[0, C.street, sceneCafe], [C.street, C.lessons, sceneStreet], [C.lessons, C.later, sceneLessons], [C.later, C.bella, sceneLater],
  [C.bella, C.meet, sceneBella], [C.meet, C.reveal, sceneMeet], [C.reveal, C.ending, sceneReveal], [C.ending, Infinity, sceneEnding]];
const sceneAt = (t) => { for (const [a, b, fn] of SCENES) if (t >= a && t < b) return fn(t); return ''; };

const stage = document.getElementById('stage');
stage.innerHTML = DEFS + '<g id="frame"></g>';
const frameEl = document.getElementById('frame');
window.ready = new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = '../../assets/img/grain.png'; });

window.renderFrame = function (t) {
  let o = sceneAt(t);
  for (const c of [C.street, C.lessons, C.later, C.bella, C.meet]) {
    const d = Math.abs(t - c);
    if (d < 0.18) o += `<rect width="720" height="1280" fill="#000" opacity="${(1 - d / 0.18).toFixed(2)}"/>`;
  }
  if (Math.abs(t - 54.6) < 0.08) o += `<rect width="720" height="1280" fill="#fff" opacity="0.6"/>`;
  const gx = Math.floor(rng(Math.floor(t * 24))() * 256), gy = Math.floor(rng(Math.floor(t * 24) + 7)() * 256);
  o += `<rect width="720" height="1280" fill="url(#vignette)" opacity="0.8"/><rect x="${-gx}" y="${-gy}" width="1100" height="1600" fill="url(#grain)" opacity="0.1" style="mix-blend-mode:overlay"/>`;
  o += dogSub(t, TL.subs, 1150);
  const dip = Math.max(t < 0.4 ? 1 - t / 0.4 : 0, prog(t, window.DURATION - 0.5, window.DURATION - 0.05));
  if (dip > 0) o += `<rect width="720" height="1280" fill="#000" opacity="${clamp(dip).toFixed(3)}"/>`;
  frameEl.innerHTML = o;
};
