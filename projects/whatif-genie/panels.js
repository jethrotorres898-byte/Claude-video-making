'use strict';
// "What If... a genie gave you only ONE wish?" — 18 still panels (16:9), one per script beat.
// Clyde is cut straight out of the character sheets (assets/, made with tools/cutout.py);
// the genie and props are drawn in lib/whatif.js. Script: SCRIPT.md.

const W = 1280, H = 720, PAPER = '#f2e9d6';
const stage = document.getElementById('stage');
const DEFS = `<defs>${whatifDefs()}</defs>`;
const ASSETS = ['shrug', 'excited', 'shocked', 'scheming', 'smirking', 'mogger', 'mogger2', 'grinning', 'skeptical', 'giggling', 'smirkwink', 'shout', 'smug', 'sneaking'];
const SIZE = {};
window.ready = Promise.all(ASSETS.map((n) => new Promise((res) => { const im = new Image(); im.onload = () => { SIZE[n] = [im.naturalWidth, im.naturalHeight]; res(); }; im.onerror = res; im.src = `assets/${n}.png`; })));

// place a cut-out by its height; anchor 'c' = centre, 'b' = bottom centre
function put(n, x, y, h, o = {}) {
  const [iw, ih] = SIZE[n] || [1, 1], w = (h * iw) / ih;
  const ax = x - w / 2, ay = o.anchor === 'b' ? y - h : y - h / 2;
  const tr = `${o.rot ? `rotate(${o.rot} ${f1(x)} ${f1(y)})` : ''}${o.flip ? ` translate(${f1(2 * x)} 0) scale(-1 1)` : ''}`;
  return `<image href="assets/${n}.png" x="${f1(ax)}" y="${f1(ay)}" width="${f1(w)}" height="${f1(h)}"${tr ? ` transform="${tr}"` : ''}/>`;
}
const ink = (body) => `<g filter="url(#sketch)">${body}</g>`;
const view = (cx, cy, z, body) => `<g transform="translate(${f1(640 - z * cx)} ${f1(360 - z * cy)}) scale(${z})">${body}</g>`;

function scrollProp(x, y, len, lines, sc = 1, rot = 0) {
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${sc})">`;
  o += wiOl(`M -70 0 L 70 0 L 66 ${len} Q 74 ${len + 14} 60 ${len + 20} L -60 ${len + 20} Q -74 ${len + 14} -66 ${len} Z`, '#f6ecd0');
  o += wiOl('M -84 -12 L 84 -12 Q 96 0 84 12 L -84 12 Q -96 0 -84 -12 Z', '#e6d2a4');
  lines.forEach((l, i) => { o += wiText(-58, 40 + i * 30, l.t, { size: l.size || 22, font: 'hand', anchor: 'start', fill: l.col || WI.ink }); if (l.under) o += wiLn(`M -58 ${46 + i * 30} L ${-58 + l.t.length * 10} ${46 + i * 30}`, 2.4, l.col || WI.ink); });
  return o + '</g>';
}
const RULES = [{ t: 'GENIE RULES', size: 26 }, { t: '1. No extra wishes' }, { t: '2. No mind control' }, { t: '3. No time travel' }, { t: '4. NO TIME STOP', col: '#c8323a', under: true }, { t: '5. No wishing for' }, { t: '    a better genie' }];
function spiral(x, y, sc) {
  let o = '';
  for (let i = 0; i < 4; i++) o += `<circle cx="${x}" cy="${y}" r="${f1((20 + i * 26) * sc)}" fill="none" stroke="${i % 2 ? '#fff' : '#7a3ab8'}" stroke-width="${f1(14 * sc)}"/>`;
  return o + wiCirc(x, y, 112 * sc, 'none', 4);
}

const PANELS = [
  // 1. the hook
  () => wiText(80, 210, 'WHAT IF...', { size: 120, font: 'marker', anchor: 'start' }) + wiText(86, 310, 'a genie gave you', { size: 64, font: 'hand', anchor: 'start' }) +
    wiText(86, 392, 'only ONE wish?', { size: 76, font: 'marker', anchor: 'start' }) + put('shrug', 1000, 705, 660, { anchor: 'b' }),
  // 2. POP! the genie appears
  () => ink(wiSmoke(880, 390, 200, 5) + genie({ x: 880, y: 670, s: 0.78, expr: 'grand', hL: [-210, -620], hR: [210, -620] }) + wiSmoke(880, 650, 110, 9) + wiSmoke(700, 610, 60, 12) + wiSmoke(1060, 620, 70, 13)) +
    put('shocked', 300, 380, 400),
  // 3. "You get ONE wish!"
  () => ink(genie({ x: 860, y: 690, s: 0.82, expr: 'grand', hR: [150, -690], handR: 'point', hL: [-40, -430], handL: 'open' }) + wiSparkle(1020, 80, 16) + wiSparkle(1090, 150, 11)) +
    put('excited', 300, 380, 380),
  // 4. Clyde looks at the camera, scheming
  () => put('scheming', 640, 360, 690),
  // 5. "The rules are—"
  () => ink(genie({ x: 860, y: 690, s: 0.82, expr: 'lecture', hL: [-60, -700], handL: 'point', hR: [190, -470], handR: 'fist' }) + scrollProp(1016, 300, 330, RULES, 0.82, 4)) +
    put('smirking', 300, 380, 380),
  // 6. MOGGER: "TIME STOP."
  () => put('mogger', 640, 370, 700),
  // 7. "WHAT?! I haven't finished the rules yet!"
  () => ink(view(0, -540, 1.55, genie({ x: 0, y: 0, s: 1, expr: 'shocked', hL: [-210, -540], hR: [210, -540] })) + scrollProp(1080, 470, 200, RULES.slice(0, 4), 0.85, 28) + wiSweat(470, 150, 2) + wiSweat(830, 170, 1.6)),
  // 8. MOGGER, slower: "TA-IME... STOP."
  () => put('mogger2', 640, 400, 980, { rot: -5 }),
  // 9. "NO!"
  () => ink(view(0, -560, 1.75, genie({ x: 0, y: 0, s: 1, expr: 'furious', hL: [-190, -380], handL: 'fist', hR: [190, -380], handR: 'fist' })) +
    wiSteam(250, 300, 1.8, -1) + wiSteam(1030, 300, 1.8) + wiSteam(200, 160, 1.2, -1) + wiSteam(1080, 150, 1.2)),
  // 10. "MIND CONTROL."
  () => put('grinning', 420, 370, 520) + ink(spiral(930, 360, 1.25) + wiLn('M 720 330 q 14 -12 28 0 q 14 12 28 0 M 724 380 q 14 -12 28 0 q 14 12 28 0', 4, '#7a3ab8')),
  // 11. "I cannot give you that. You can wish for anything else."
  () => ink(genie({ x: 860, y: 690, s: 0.82, expr: 'stern', crossArms: true, headTilt: -8 }) + scrollProp(1110, 380, 120, [{ t: 'GENIE RULES', size: 26 }, { t: '2. No mind control', col: '#c8323a', under: true }], 1.0, 6)) +
    put('skeptical', 300, 390, 360),
  // 12. "Okay... then I wish that you give me a RANDOM ability."
  () => put('giggling', 640, 370, 600),
  // 13. "Your wish is my..."
  () => {
    let st = '';
    for (let i = 0; i < 34; i++) { const u = i / 34, x = lerp(720, 430, u), y = lerp(330, 360, u) + Math.sin(u * 14) * 36; st += wiSparkle(x, y, 6 + (i % 3) * 4, i % 2 ? '#fff6b0' : '#ffd84a'); }
    return ink(genie({ x: 900, y: 690, s: 0.8, expr: 'bliss', hL: [-210, -430], handL: 'magic', hR: [-110, -470], handR: 'magic' }) + st) + put('smirkwink', 290, 380, 380);
  },
  // 14. Clyde cuts in: "TIME STOP!"
  () => {
    let c = '';
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.6; c += wiClock(640 + Math.cos(a) * 470, 340 + Math.sin(a) * 250, 38 + (i % 2) * 10, -60 + i * 40, i * 50); }
    return ink(c) + put('shout', 640, 380, 620);
  },
  // 15. "...command." (still blissfully unaware)
  () => ink(genie({ x: 880, y: 690, s: 0.8, expr: 'bliss', hR: [10, -450], handR: 'open', hL: [-230, -560], handL: 'open', lean: -6 }) + wiClock(300, 130, 56, -30, 120) + wiSparkle(1020, 90, 16)) + put('smug', 300, 420, 380),
  // 16. "Wait... NOOO!"
  () => ink(genie({ x: 880, y: 690, s: 0.82, expr: 'horror', handsOnCheeks: true }) + wiSweat(740, 170, 1.6) + wiSweat(1020, 160, 1.4) + wiClock(300, 120, 60, -90, 0)) + put('smirking', 300, 420, 380),
  // 17. Time stops: the world goes grey, only Clyde keeps moving
  () => {
    const frozen = genie({ x: 900, y: 690, s: 0.82, expr: 'horror', handsOnCheeks: true }) + wiSweat(760, 170, 1.6) + wiSweat(1040, 160, 1.4) +
      `<g transform="translate(600 230)">${wiEll(0, 0, 10, 7, '#333', 2)}${wiEll(-8, -8, 9, 5, '#ddd', 1.5, -30)}${wiEll(8, -8, 9, 5, '#ddd', 1.5, 30)}</g>` + wiClock(560, 120, 50, -90, 0);
    return `<rect width="${W}" height="${H}" fill="#b9bcc4"/>` + `<g filter="url(#grey)">${ink(frozen)}</g>` + put('sneaking', 330, 650, 420, { anchor: 'b' });
  },
  // 18. Evil laugh to the camera
  () => `<rect width="${W}" height="${H}" fill="#b9bcc4"/>` + `<g filter="url(#grey)">${ink(genie({ x: 1010, y: 720, s: 0.82, expr: 'horror', handsOnCheeks: true }))}</g>` + put('scheming', 470, 360, 690),
];

window.PANELS = PANELS;
window.showPanel = (i) => { stage.innerHTML = DEFS + `<rect width="${W}" height="${H}" fill="${PAPER}"/>` + PANELS[i - 1](); };
window.ready.then(() => window.showPanel(1));
