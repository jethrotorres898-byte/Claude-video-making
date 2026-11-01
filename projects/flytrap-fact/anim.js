'use strict';
// "A Venus flytrap can count": 45 s, 16:9, watercolor paper-cut style.
// Every beat is cued to a word of the creator's narration: words.js comes from tools/align.py
// run on voice.mp3, so aligning a new recording re-times the whole video.
// Modes: default uses the baked layers in baked/ (tools/bake.js), ?live draws everything live,
// ?bake is the page tools/bake.js drives.

window.DURATION = window.CUES.DURATION;
const stage = document.getElementById('stage');
const MODE = location.search.includes('bake') ? 'bake' : location.search.includes('live') ? 'live' : 'baked';

// ---------- static layers ----------
const LAYER_FNS = {
  sky: skyLayer, far: farLayer, mid: midLayer, trees: treesLayer, near: nearLayer,
  stump: () => stumpPot(1090, 905, 1), fg: fgLayer, bokeh: bokehLayer,
};
window.LAYERS = Object.keys(LAYER_FNS);
window.showLayer = (name) => { const body = LAYER_FNS[name](); stage.innerHTML = `<defs>${wcDefs()}</defs>${body}`; };
if (MODE === 'bake') { document.body.classList.add('bake'); document.documentElement.classList.add('bake'); }
window.ready = MODE !== 'baked' ? Promise.resolve() : Promise.all(window.LAYERS.map((n) => new Promise((res) => {
  const im = new Image(); im.onload = res; im.onerror = res; im.src = `baked/${n}.png`;
})));
const layer = (n) => (MODE === 'baked' ? `<image href="baked/${n}.png" x="0" y="0" width="1920" height="1080" preserveAspectRatio="none"/>` : LAYER_FNS[n]());

// ---------- word cues (cues.js) ----------
const { C, CUT, WIGGLES } = window.CUES;

// ---------- camera ----------
// world -> screen: (p - c) * z + centre; layers with parallax par move/zoom less.
function camera(cx, cy, z, shake = [0, 0]) {
  return (par) => {
    const zl = 1 + (z - 1) * par, lx = 960 + (cx - 960) * par, ly = 540 + (cy - 540) * par;
    return `translate(${wf(960 + shake[0])} ${wf(540 + shake[1])}) scale(${wf(zl)}) translate(${wf(-lx)} ${wf(-ly)})`;
  };
}
function shakeAt(t, t0, amp = 9, dur = 0.45) {
  if (t < t0 || t > t0 + dur) return [0, 0];
  const d = 1 - (t - t0) / dur;
  return [Math.sin((t - t0) * 70) * amp * d, Math.cos((t - t0) * 53) * amp * 0.6 * d];
}
function wideSet(cam, world) {
  return G(cam(0.15), layer('sky')) + G(cam(0.3), layer('far')) + G(cam(0.55), layer('mid')) +
    G(cam(0.7), layer('trees')) + G(cam(1), layer('near') + layer('stump') + world) + G(cam(1.25), layer('fg'));
}

// ---------- stickman poses ----------
const H = (type, rot, n) => ({ type, rot, n });
const POSE = {
  idle: { armL: [100, 96], armR: [80, 84], legL: 92, legR: 88, lean: 0, look: [0.7, 0], face: 'smile', handL: H('rest'), handR: H('rest') },
  chin: { armL: [100, 96], armR: [112, -96], legL: 92, legR: 88, lean: 0, look: [0.65, -0.25], face: 'curious', handL: H('rest'), handR: H('rest', 175) },
  palm: { armL: [100, 96], armR: [-12, -78], legL: 92, legR: 88, lean: 0, look: [0, 0], face: 'serious', handL: H('rest'), handR: H('open', 175) },
  pointSign: { armL: [100, 96], armR: [8, -8], legL: 92, legR: 88, lean: 3, look: [0.85, 0.35], face: 'smile', handL: H('rest'), handR: H('point', -95) },
  jump: { armL: [215, 245], armR: [-35, -65], legL: 108, legR: 72, lean: 0, look: [0.45, -0.2], face: 'surprised', handL: H('open', 155), handR: H('open', 205) },
  shocked: { armL: [140, 225], armR: [40, -45], legL: 96, legR: 84, lean: -4, look: [0.55, -0.15], face: 'surprised', handL: H('open', 135), handR: H('open', 225) },
  watch: { armL: [100, 96], armR: [85, 80], legL: 92, legR: 88, lean: 4, look: [0.8, -0.35], face: 'curious', handL: H('rest'), handR: H('rest') },
  amazed: { armL: [155, 205], armR: [25, -25], legL: 94, legR: 86, lean: 0, look: [0, 0], face: 'amazed', handL: H('open', 115), handR: H('open', 245) },
  thumbs: { armL: [100, 96], armR: [-15, -82], legL: 92, legR: 88, lean: -2, look: [0, 0], face: 'wink', handL: H('rest'), handR: H('thumb', 0) },
  peek: { armL: [100, 96], armR: [-55, -100], legL: 92, legR: 88, lean: 6, look: [0.85, -0.1], face: 'focus', handL: H('rest'), handR: H('count', 185, 0) },
};
function mixPose(a, b, u) {
  const o = {};
  for (const k of Object.keys(a)) {
    const va = a[k], vb = b[k] ?? va;
    if (typeof va === 'number') o[k] = lerpN(va, vb, u);
    else if (Array.isArray(va)) o[k] = va.map((x, i) => lerpN(x, vb[i], u));
    else if (va && typeof va === 'object') o[k] = u < 0.5 ? va : vb;
    else o[k] = u < 0.5 ? va : vb;
  }
  return o;
}
// keys: [[time, poseName], ...]; each change blends over `dur` seconds
function poseAt(t, keys, dur = 0.32) {
  let p = POSE[keys[0][1]];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) break;
    p = mixPose(p, POSE[keys[i][1]], ease((t - keys[i][0]) / dur));
  }
  return { ...p, blink: (t % 3.7) < 0.12 ? 1 : 0, bob: Math.sin(t * 2.2) * 1.6 };
}

// ---------- shared beats ----------
const touchGlow = (t, events) => [0, 1, 2].map((i) => events.reduce((g, [te, hi, hold = 0]) => {
  if (hi !== i || t < te) return g;
  const d = t - te;
  return Math.max(g, d < 0.08 ? d / 0.08 : d < 0.08 + hold ? 1 : Math.exp(-(d - 0.08 - hold) / 0.6));
}, 0));
const badgeAt = (t, x, y, events, until = 1e9) => {
  let cur = null;
  for (const [te, label] of events) if (t >= te) cur = [te, label];
  if (!cur || t > until + 0.3) return '';
  const pop = t > until ? 1 - ease((t - until) / 0.3) : popIn((t - cur[0]) / 0.3);
  return badge(x, y, 1, cur[1], pop);
};
const popFor = (t, t0, t1 = 1e9, d = 0.3) => (t < t0 ? 0 : t < t1 ? popIn((t - t0) / d) : 1 - ease((t - t1) / 0.25));
const PLANT_X = 1090, PLANT_Y = 905, MAN_X = 760, MAN_Y = 905;
const SIGN = (t) => plantSign(1345, 918, 0.9, ramp(t, C.venus, C.venus + 0.4), (t - C.keeps) / 0.12 + 1);

// ---------- shots ----------
function shot1(t) { // wide: "Did you know a Venus flytrap can actually count? ... keeps score."
  const u = ease(ramp(t, 0, CUT[1]));
  const cam = camera(lerpN(960, 930, u), lerpN(540, 600, u), lerpN(1, 1.15, u));
  const p = poseAt(t, [[0, 'idle'], [C.count - 0.45, 'chin'], [C.no - 0.12, 'palm'], [C.keeps - 0.25, 'pointSign']]);
  if (t > C.joke && t < C.joke + 0.7) p.look = [Math.sin((t - C.joke) * 22) * 0.35 * (1 - (t - C.joke) / 0.7), 0];
  let world = SIGN(t) + flytrapPlant(PLANT_X, PLANT_Y, 1, {}) + stickman(MAN_X, MAN_Y, 1, p);
  world += qmark(MAN_X - 105, MAN_Y - 520, 1, popFor(t, C.count, C.no - 0.1));
  let ui = '';
  const tp = popFor(t, 0.25);
  if (tp > 0) ui += G(tr(205, 90, -2, tp), cut(paint(P.rrect(-150, -40, 300, 80, 18), COL.paper, { v: 50, s: 3, k: 0.4, ink: 3 }) + leafIcon(-105, 0, 1.25) + txt(22, 15, 'PLANT FACT', 42, WC.ink, 'middle', ' letter-spacing="2"'), 6, 0.26));
  return wideSet(cam, world) + ui;
}

const CU = { hx: 560, hy: 690, L: 720 };
function closeTrap(open, glow, flyMarkup, extra = {}) {
  return cut(petiole(-80, 1010, CU.hx, CU.hy, 125, 0.1) + trap(CU.hx, CU.hy, extra.rot || 0, { L: CU.L, open, glow, fly: flyMarkup, juice: extra.juice, squash: extra.squash }), 7, 0.28);
}
function shot2(t) { // close-up: trigger hairs, the raindrop, the fly, SNAP
  const lt = t - CUT[1];
  const cam = camera(960, 560, 1 + 0.06 * ease(lt / (CUT[2] - CUT[1])), shakeAt(t, C.snap, 12));
  const k = CU.L / 100;
  const hairTip = (i) => [CU.hx + [36, 54, 72][i] * k, CU.hy - 8.5 * k];
  const touchA = C.second, touchB = C.snap - 0.12;
  const glow = touchGlow(t, [[C.trigger, 0, 1.1], [C.trigger + 0.22, 1, 0.9], [C.trigger + 0.44, 2, 0.7], [C.one, 1, 0.5], [touchA, 2, 0.4], [touchB, 1, 0.2]]);
  // the trap snaps shut, then wobbles
  let open = 1, squash = 0;
  if (t >= C.snap) {
    open = 1 - easeIn(ramp(t, C.snap, C.snap + 0.11));
    const d = t - C.snap - 0.11;
    if (d > 0) squash = Math.exp(-d / 0.18) * Math.sin(d * 34) * 0.9;
  }
  // the fly: flies in, lands by hair 3, bumps it, walks to hair 2
  let flyM = '';
  if (t >= C.but) {
    let fx, fy, flap = 0, step = 0;
    const land = touchA - 0.12;
    if (t < land) {
      const q = ease(ramp(t, C.but, land));
      fx = lerpN(160, 79, q); fy = lerpN(-70, -6, q) + Math.sin(q * Math.PI * 3) * 9 * (1 - q);
      flap = t * 22;
    } else if (t < C.within + 0.1) {
      fx = 79 - (t > touchA && t < touchA + 0.25 ? Math.sin(((t - touchA) / 0.25) * Math.PI) * 2.5 : 0); fy = -6;
    } else {
      const q = ramp(t, C.within + 0.1, touchB);
      fx = lerpN(79, 61, ease(q)); fy = -6; step = q * 7;
    }
    flyM = fly(fx, fy, 0.3, { flap, step, face: -1 });
  }
  let world = closeTrap(open, glow, flyM, { squash });
  // raindrop onto hair 2
  const [dx, dy] = hairTip(1);
  if (t > C.something + 0.1 && t < C.one) world += raindrop(dx, lerpN(-90, dy - 14, easeIn(ramp(t, C.something + 0.1, C.one))), 1.25);
  world += splash(dx, dy - 6, ramp(t, C.one, C.one + 0.5), 1.4);
  if (t > C.snap + 0.06 && t < C.snap + 0.5) {
    const a = ramp(t, C.snap + 0.06, C.snap + 0.5);
    for (const [ax, ay, ang] of [[1330, 470, -30], [1380, 560, 0], [1330, 650, 30]]) {
      world += G(tr(ax + a * 30, ay, ang), ink(`M 0 0 L ${wf(36 + a * 20)} 0`, 6));
    }
  }
  let ui = tag(1460, 560, 'trigger hairs', 50, popFor(t, C.trigger, C.something - 0.2)) + (t > C.trigger && t < C.something - 0.2 ? arrow(1290, 590, hairTip(0)[0] + 70, hairTip(0)[1] + 10, -0.22, ease(ramp(t, C.trigger + 0.1, C.trigger + 0.45))) : '');
  ui += badgeAt(t, 1560, 230, [[C.one, '1']], C.raindrop + 0.4);
  ui += badgeAt(t, 1560, 230, [[touchA, '1'], [touchB, '2']]);
  if (t > C.within) ui += stopwatch(260, 250, 1, Math.min(t, C.snap) - touchA > 0 ? (Math.min(t, C.snap) - touchA) / 20 : 0, '20 s', popFor(t, C.within));
  ui += tag(1250, 285, 'SNAP!', 84, popFor(t, C.snap + 0.02, 1e9, 0.22), -8);
  return G(cam(0.3), layer('bokeh')) + G(cam(1), world) + ui;
}

function shot3(t) { // medium: the stickman jumps; "in a fraction of a second"
  const lt = t - CUT[2], u = ease(ramp(t, CUT[2], CUT[3]));
  const cam = camera(930, lerpN(690, 680, u), lerpN(1.42, 1.5, u));
  const p = poseAt(t, [[0, 'jump'], [CUT[2] + 0.6, 'shocked']], 0.3);
  p.bob = -Math.sin(Math.PI * clamp01(lt / 0.55)) * 75;
  const sq = Math.exp(-(t - C.snap) / 0.4) * Math.sin((t - C.snap) * 30) * 0.6;
  const world = SIGN(t) + flytrapPlant(PLANT_X, PLANT_Y, 1, { 4: { open: 0, squash: sq } }) + stickman(MAN_X, MAN_Y, 1, p);
  return wideSet(cam, world) + stopwatch(1660, 300, 1.1, 0.012, '0.1 s', popFor(t, C.fraction));
}

const CU4 = { hx: 700, hy: 650, L: 700 };
function shot4(t) { // close-up of the closed trap: it keeps counting, digestive juice
  const lt = t - CUT[3];
  const cam = camera(960, 540, 1 + 0.04 * ease(lt / (CUT[4] - CUT[3])));
  let rot = 0, squash = 0, n = 0;
  for (const tw of WIGGLES) {
    if (t < tw) continue;
    n++;
    const d = t - tw;
    rot += Math.exp(-d / 0.22) * Math.sin(d * 38) * 2.6;
    squash += Math.exp(-d / 0.22) * Math.sin(d * 38 + 1) * 0.9;
  }
  const juice = ramp(t, C.digestive - 0.15, C.digestive + 1.1);
  const trapM = cut(petiole(-80, 1030, CU4.hx, CU4.hy, 120, 0.1) + trap(CU4.hx, CU4.hy, rot, { L: CU4.L, open: 0, juice, squash }), 7, 0.28);
  const p = poseAt(t, [[0, 'peek']]);
  p.handR = H(n ? 'count' : 'fist', 185, Math.min(5, n));
  const lastW = WIGGLES.filter((w) => w <= t).pop();
  if (lastW !== undefined && t - lastW < 0.3) p.bob += -Math.sin(((t - lastW) / 0.3) * Math.PI) * 6;
  const man = stickman(250, 1580, 2.4, p);
  const labels = ['2', ...WIGGLES.map((_, i) => String(3 + i))];
  let ui = badgeAt(t, 1580, 220, [[CUT[3] + 0.1, '2'], ...WIGGLES.map((w, i) => [w, labels[i + 1]])]);
  const [jx, jy] = [CU4.hx + 60 * (CU4.L / 100), CU4.hy + 17 * (CU4.L / 100)];
  ui += tag(1500, 930, 'digestive juice', 50, popFor(t, C.digestive));
  if (t > C.digestive) ui += arrow(1330, 915, jx + 40, jy + 50, 0.2, ease(ramp(t, C.digestive + 0.1, C.digestive + 0.45)));
  return G(cam(0.3), layer('bokeh')) + G(cam(1), trapM) + man + ui;
}

function shot5(t) { // medium on the plant: a raindrop is a false alarm, energy saved
  const u = ease(ramp(t, CUT[4], CUT[5]));
  const cam = camera(1075, 640, lerpN(1.6, 1.66, u));
  const tip = trapPoint(PLANT_X, PLANT_Y, 1, 1, 54, -8.5);
  const glow = touchGlow(t, [[C.energy, 1, 0.6]]);
  let world = SIGN(t) + flytrapPlant(PLANT_X, PLANT_Y, 1, { 1: { glow }, 4: { open: 0 } }) + stickman(MAN_X, MAN_Y, 1, poseAt(t, [[0, 'watch']]));
  const t0 = C.never - 0.2;
  if (t > t0 && t < C.energy) world += raindrop(tip[0], lerpN(210, tip[1] - 16, easeIn(ramp(t, t0, C.energy))), 1.1);
  world += splash(tip[0], tip[1] - 6, ramp(t, C.energy, C.energy + 0.5), 1.2);
  const ui = battery(1600, 250, 1.35, 1, popFor(t, C.energy + 0.1), ramp(t, C.alarm, C.alarm + 0.3)) + tag(1600, 395, 'energy saved', 46, popFor(t, C.alarm + 0.05));
  return wideSet(cam, world) + ui;
}

function shot6(t) { // wide pull-back: "A plant... that can count. Follow for more plant facts!"
  const u = ease(ramp(t, CUT[5], C.follow + 1.2));
  const cam = camera(lerpN(900, 960, u), lerpN(650, 540, u), lerpN(1.3, 1.0, u));
  const p = poseAt(t, [[0, 'watch'], [CUT[5] + 0.15, 'amazed'], [C.follow, 'thumbs']]);
  if (t > C.count2 && t < C.count2 + 0.5) p.bob += -Math.sin(((t - C.count2) / 0.5) * Math.PI) * 26;
  const world = SIGN(t) + flytrapPlant(PLANT_X, PLANT_Y, 1, { 4: { open: 0 } }) + stickman(MAN_X, MAN_Y, 1, p) +
    signpost(610, 1000, 1, [['FOLLOW FOR MORE', -1, -250], ['PLANT FACTS!', -1, -168]], popFor(t, C.follow, 1e9, 0.35));
  return wideSet(cam, world);
}

const SHOTS = [shot1, shot2, shot3, shot4, shot5, shot6];
window.renderFrame = (t) => {
  let i = 0;
  while (i < SHOTS.length - 1 && t >= CUT[i + 1]) i++;
  const body = SHOTS[i](t);
  stage.innerHTML = `<defs>${wcDefs()}</defs>${body}`;
};
if (MODE !== 'bake') window.ready.then(() => window.renderFrame(0));
