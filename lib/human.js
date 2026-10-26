'use strict';
// Painted human rig (side view) in the same style as lib/doggo.js. Used for TJR:
// black tee, jeans, silver chains, golden swept-back hair, light beard.
// Uses lib/stickkit.js helpers (ik, f1, lerp, clamp...).

const HB = { thigh: 88, shin: 86, upper: 64, fore: 60, torso: 128 };
const SKIN = '#e3b593', SKIN_D = '#c48f6c';

// p: x, y (ground), s, flip, hip [x,y] offset from the standing hip, lean (deg forward),
//    headTilt, fN/fF feet, hN/hF hands (world), smile (0..1), blink, umbrella, phone
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
  o += `<path d="M -26 8 Q -30 -26 -4 -32 Q 20 -36 26 -14 L 28 -6 L 36 4 L 29 8 L 30 14 Q 28 20 30 22 Q 24 34 8 34 Q -12 34 -20 22 Z" fill="url(#skin)"/>`;
  o += `<ellipse cx="-12" cy="2" rx="6" ry="9" fill="${SKIN_D}"/>`;
  o += `<path d="M 30 22 Q 22 36 6 36 Q -10 36 -16 24 Q -12 14 -6 18 Q 4 26 14 24 Q 24 22 28 16 Z" fill="#b98a5a" opacity="0.85"/>`;
  o += `<path d="M 20 15 Q 27 12 33 16" stroke="#8a6440" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  const sm = clamp(p.smile ?? 0.4);
  o += `<path d="M 20 21 Q 25 ${f1(22 + sm * 3)} 29 ${f1(20 - sm * 1)}" stroke="#7a3a2a" stroke-width="2" fill="none"/>`;
  const bl = p.blink ?? 1;
  o += `<ellipse cx="16" cy="-6" rx="4.5" ry="${f1(Math.max(0.5, 3 * bl))}" fill="#fff"/><circle cx="18" cy="-6" r="${f1(Math.max(0.4, 2.2 * bl))}" fill="#3a5a7a"/>`;
  o += `<path d="M 9 -13 Q 16 -16 23 -13" stroke="#a87a40" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  o += `<path d="M 26 -14 Q 34 -36 14 -44 Q -2 -56 -22 -42 Q -36 -32 -32 -10 Q -30 2 -24 8 Q -26 -12 -12 -20 Q 4 -28 26 -14 Z" fill="#e2b45a"/>`;
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
