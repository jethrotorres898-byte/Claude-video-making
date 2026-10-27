'use strict';
// Painted human rig (side view) in the same style as lib/doggo.js. Used for TJR:
// black tee, jeans, silver chains, golden swept-back hair, light beard, and a sharp,
// angular profile (strong squared jaw, prominent nose).
// Uses lib/stickkit.js helpers (ik, f1, lerp, clamp...).

const HB = { thigh: 88, shin: 86, upper: 64, fore: 60, torso: 128 };
const SKIN = '#e3b593', SKIN_D = '#c48f6c';

// p: x, y (ground), s, flip, hip [x,y] offset from the standing hip, lean (deg forward),
//    headTilt, fN/fF feet, hN/hF hands (world), smile (0..1), blink, mouth (0..1 talking),
//    brow (-1 worried..1 stern), umbrella, phone
function human(p, t = 0) {
  const s = p.s ?? 1, f = p.flip ?? 1;
  const toL = (q) => [(q[0] - p.x) / (f * s), (q[1] - p.y) / s];
  const toW = (q) => [p.x + q[0] * f * s, p.y + q[1] * s];
  const H = [(p.hip?.[0] ?? 0), -172 + (p.hip?.[1] ?? 0)];
  const la = ((p.lean ?? 0) * Math.PI) / 180;
  const up = [Math.sin(la), -Math.cos(la)];
  const SH = [H[0] + up[0] * HB.torso * 0.92, H[1] + up[1] * HB.torso * 0.92];
  const NK = [H[0] + up[0] * HB.torso, H[1] + up[1] * HB.torso];
  const ha = la + ((p.headTilt ?? 0) * Math.PI) / 180;
  const HD = [NK[0] + Math.sin(ha) * 34, NK[1] - Math.cos(ha) * 34];
  const legs = (tgt, bend) => ik(H, toL(tgt), HB.thigh, HB.shin, bend);
  const arms = (tgt, bend) => ik(SH, toL(tgt), HB.upper, HB.fore, bend);
  const fN = p.fN || [p.x + 14 * f * s, p.y], fF = p.fF || [p.x - 10 * f * s, p.y];
  const [kN, aN] = legs(fN, -1), [kF, aF] = legs(fF, -1);
  const [eN, hN] = arms(p.hN || toW([H[0] + 18, H[1] - 6]), 1);
  const [eF, hF] = arms(p.hF || toW([H[0] - 6, H[1] - 4]), 1);
  const seg = (a, b, w, col) => `<path d="M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const shoe = (a, col) => `<path d="M ${f1(a[0] - 10)} ${f1(a[1] + 2)} Q ${f1(a[0] - 10)} ${f1(a[1] - 12)} ${f1(a[0] + 6)} ${f1(a[1] - 10)} L ${f1(a[0] + 28)} ${f1(a[1] - 4)} Q ${f1(a[0] + 32)} ${f1(a[1] + 2)} ${f1(a[0] + 26)} ${f1(a[1] + 4)} Z" fill="${col}"/>`;
  const arm = (S, E, Hd, sleeve, skin) => seg(S, E, 21, sleeve) + seg([lerp(S[0], E[0], 0.55), lerp(S[1], E[1], 0.55)], E, 17, skin) + seg(E, Hd, 15, skin) + `<circle cx="${f1(Hd[0])}" cy="${f1(Hd[1])}" r="9" fill="${skin}"/>`;
  let o = `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${(f * s).toFixed(3)} ${s.toFixed(3)})">`;
  if (!p.noShadow) o += `<ellipse cx="${f1((aN[0] + aF[0]) / 2)}" cy="3" rx="60" ry="8" fill="#000" opacity="0.25" filter="url(#blur3)"/>`;
  // far limbs
  o += seg(H, kF, 30, '#26314a') + seg(kF, aF, 24, '#26314a') + shoe(aF, '#111');
  o += arm(SH, eF, hF, '#0e0f12', SKIN_D);
  if (p.umbrella) {
    const top = [hF[0] + 6, hF[1] - 150];
    o += `<path d="M ${f1(hF[0])} ${f1(hF[1] + 10)} L ${f1(top[0])} ${f1(top[1])}" stroke="#333" stroke-width="5"/>`;
    o += `<path d="M ${f1(top[0] - 150)} ${f1(top[1] + 46)} Q ${f1(top[0])} ${f1(top[1] - 70)} ${f1(top[0] + 150)} ${f1(top[1] + 46)} Q ${f1(top[0] + 112)} ${f1(top[1] + 30)} ${f1(top[0] + 75)} ${f1(top[1] + 46)} Q ${f1(top[0] + 38)} ${f1(top[1] + 30)} ${f1(top[0])} ${f1(top[1] + 46)} Q ${f1(top[0] - 38)} ${f1(top[1] + 30)} ${f1(top[0] - 75)} ${f1(top[1] + 46)} Q ${f1(top[0] - 112)} ${f1(top[1] + 30)} ${f1(top[0] - 150)} ${f1(top[1] + 46)} Z" fill="#1c2a4a"/>`;
    o += `<path d="M ${f1(top[0] - 120)} ${f1(top[1] + 10)} Q ${f1(top[0] - 40)} ${f1(top[1] - 40)} ${f1(top[0] + 20)} ${f1(top[1] - 30)}" stroke="#fff" stroke-width="4" fill="none" opacity="0.15"/>`;
  }
  // torso: black tee
  const w0 = 34, w1 = 46;
  o += `<path d="M ${f1(H[0] - w0 * 0.9)} ${f1(H[1] + 6)} L ${f1(H[0] + w0)} ${f1(H[1] + 6)} Q ${f1(SH[0] + w1 * 1.0 + 6)} ${f1(SH[1] + 40)} ${f1(SH[0] + w1 * 0.7)} ${f1(SH[1] - 4)} Q ${f1(SH[0])} ${f1(SH[1] - 22)} ${f1(SH[0] - w1 * 0.7)} ${f1(SH[1] - 2)} Q ${f1(SH[0] - w1 * 0.9)} ${f1(SH[1] + 50)} ${f1(H[0] - w0 * 0.9)} ${f1(H[1] + 6)} Z" fill="url(#tee)"/>`;
  o += `<path d="M ${f1(H[0] - 32)} ${f1(H[1] + 4)} L ${f1(H[0] + 34)} ${f1(H[1] + 4)}" stroke="#3a2a1a" stroke-width="7"/>`;
  // chains
  o += `<path d="M ${f1(NK[0] - 14)} ${f1(NK[1] + 6)} Q ${f1(NK[0] + 10)} ${f1(NK[1] + 46)} ${f1(NK[0] + 22)} ${f1(NK[1] + 8)}" stroke="#c9d1d9" stroke-width="4" fill="none" stroke-dasharray="4 2"/>`;
  o += `<path d="M ${f1(NK[0] - 16)} ${f1(NK[1] + 8)} Q ${f1(NK[0] + 12)} ${f1(NK[1] + 64)} ${f1(NK[0] + 24)} ${f1(NK[1] + 10)}" stroke="#aeb7c0" stroke-width="5" fill="none" stroke-dasharray="5 2"/>`;
  // near leg
  o += seg(H, kN, 32, '#2f3d5c') + seg(kN, aN, 26, '#2f3d5c') + `<path d="M ${f1(H[0] + 4)} ${f1(H[1] + 10)} L ${f1(kN[0] + 4)} ${f1(kN[1])}" stroke="#4a5a7c" stroke-width="5" opacity="0.5"/>` + shoe(aN, '#161616');
  // neck + head (profile facing right)
  o += seg(NK, [HD[0] - 4, HD[1] + 18], 20, SKIN_D);
  const rot = ((p.lean ?? 0) + (p.headTilt ?? 0));
  o += `<g transform="translate(${f1(HD[0])} ${f1(HD[1])}) rotate(${f1(rot)})">`;
  const mo = clamp(p.mouth ?? 0), jd = mo * 4;
  // angular skull: sloped forehead, brow ridge, long prominent nose, squared chin, hard jaw angle
  o += `<path d="M -22 10 Q -28 -20 -10 -32 Q 10 -40 24 -26 L 27 -15 L 28 -9 L 44 7 L 42 10 L 32 11 L 31 15 L 30 ${f1(18 + jd)} L 32 ${f1(23 + jd)} L 31 ${f1(31 + jd)} L 22 ${f1(35 + jd)} L -6 ${f1(27 + jd * 0.4)} L -16 14 Z" fill="url(#skin)"/>`;
  o += `<path d="M 6 4 L 22 9 L 27 19 L 12 15 Z" fill="${SKIN_D}" opacity="0.45"/><path d="M 27 -12 L 41 5" stroke="#fff3e6" stroke-width="2.4" opacity="0.55"/><path d="M 33 9 Q 37 11 41 9" stroke="${SKIN_D}" stroke-width="2" fill="none"/>`;
  o += `<ellipse cx="-11" cy="2" rx="5.5" ry="8.5" fill="${SKIN_D}"/>`;
  if (mo > 0.04) o += `<path d="M 23 17.5 L 31 17 L 30.5 ${f1(17.5 + 6 * mo)} Q 27 ${f1(18.5 + 7 * mo)} 23.5 ${f1(17.5 + 4 * mo)} Z" fill="#4a1a14"/>`;
  // beard traced along the jawline, moustache
  o += `<path d="M 30 ${f1(19 + jd)} L 32 ${f1(23 + jd)} L 31 ${f1(31 + jd)} L 22 ${f1(35 + jd)} L -6 ${f1(27 + jd * 0.4)} L -14 12 L -9 9 L -3 ${f1(19 + jd * 0.4)} L 12 ${f1(24 + jd)} L 23 ${f1(22 + jd)} L 27 ${f1(19 + jd)} Z" fill="#b48650" opacity="0.8"/>`;
  o += `<path d="M -6 ${f1(27 + jd * 0.4)} L 22 ${f1(35 + jd)}" stroke="#8a6238" stroke-width="2" opacity="0.6"/>`;
  o += `<path d="M 22 15.5 L 34 13.5 L 32.5 16.5 L 24 17.5 Z" fill="#8a6440"/>`;
  const sm = clamp(p.smile ?? 0.4);
  if (mo <= 0.04) o += `<path d="M 22 19 Q 26 ${f1(19.5 + sm * 2.5)} 30 ${f1(18.5 - sm * 1.2)}" stroke="#6a3022" stroke-width="2" fill="none"/>`;
  const bl = p.blink ?? 1, br = p.brow ?? 0;
  o += `<ellipse cx="17" cy="-6" rx="4.6" ry="${f1(Math.max(0.5, 2.6 * bl))}" fill="#fff"/><circle cx="19" cy="-6" r="${f1(Math.max(0.4, 2.1 * bl))}" fill="#3a5a7a"/>`;
  o += `<path d="M 7 ${f1(-12.5 - br)} L 25 ${f1(-15 + br * 2.5)}" stroke="#9a6a32" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  o += `<path d="M 24 -25 Q 32 -40 14 -46 Q -2 -56 -22 -42 Q -36 -32 -32 -10 Q -30 2 -24 8 Q -26 -12 -12 -20 Q 6 -28 24 -25 Z" fill="#e2b45a"/>`;
  o += `<path d="M 18 -36 Q 0 -48 -20 -34 M 22 -28 Q 2 -38 -24 -22" stroke="#a87a30" stroke-width="2.5" fill="none" opacity="0.7"/><path d="M 14 -40 Q -2 -50 -16 -40" stroke="#fff0b8" stroke-width="3" fill="none" opacity="0.6"/>`;
  o += '</g>';
  // near arm on top
  o += arm(SH, eN, hN, '#16171b', SKIN);
  if (p.phone) {
    o += `<g transform="translate(${f1(hN[0] + 4)} ${f1(hN[1] - 22)}) rotate(-8)"><rect x="-14" y="-24" width="28" height="48" rx="5" fill="#111"/><rect x="-11" y="-20" width="22" height="40" rx="3" fill="#0d2a1a"/>${p.phone === 'chart' ? '<path d="M -8 12 L -3 4 L 1 8 L 8 -12" stroke="#4cff9a" stroke-width="2.4" fill="none"/>' : ''}</g>`;
    o += `<circle cx="${f1(hN[0])}" cy="${f1(hN[1])}" r="9" fill="${SKIN}"/>`;
  }
  o += '</g>';
  return { svg: o, head: toW(HD), hN: toW(hN), hF: toW(hF), hip: toW(H) };
}

function humanDefs() {
  return `<linearGradient id="tee" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0c0d10"/><stop offset="0.6" stop-color="#1e2026"/><stop offset="1" stop-color="#121317"/></linearGradient>
  <radialGradient id="skin" cx="60%" cy="35%" r="75%"><stop offset="0" stop-color="#f0c6a4"/><stop offset="1" stop-color="#c8936e"/></radialGradient>`;
}
