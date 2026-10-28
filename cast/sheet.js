'use strict';
// Model sheets for the toon cast: front / side / back of one character (?c=brodie), or the
// whole cast side by side (?c=lineup). Rendered to PNG by tools/sheets.js.

const W = 1500, H = 1000, GROUND = 900;
const q = new URLSearchParams(location.search), who = q.get('c') || 'golden';
const stage = document.getElementById('stage');
const label = (x, y, s, size = 30, col = '#2a1c12', anchor = 'middle') => `<text x="${x}" y="${y}" font-family="Oswald" font-weight="700" font-size="${size}" fill="${col}" text-anchor="${anchor}" letter-spacing="2">${esc(s)}</text>`;
const draw = (c, view, x, s, flip = 1) => (TOON_HUMANS[c] ? toonHuman(c, { view, x, y: GROUND, s, flip }, 0.6) : toonDog(c, { view, x, y: GROUND, s, flip }, 0.6));

function sheet(c) {
  const spec = TOON_DOGS[c] || TOON_HUMANS[c];
  let o = `<rect width="${W}" height="${H}" fill="#d9dadc"/>`;
  for (const y of [180, 330, 520, 700]) o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#5ab8c0" stroke-width="2" opacity="0.6"/>`;
  o += `<rect x="0" y="${GROUND + 6}" width="${W}" height="4" fill="#9a9ca0"/>`;
  o += draw(c, 'front', 280, 1.0) + draw(c, 'side', 750, 1.0, -1) + draw(c, 'back', 1220, 1.0);
  o += label(280, 965, 'FRONT') + label(750, 965, 'SIDE') + label(1220, 965, 'BACK');
  o += label(40, 70, spec.name.toUpperCase(), 48, '#2a1c12', 'start');
  const sw = [spec.base, spec.shade, spec.light, spec.ear || spec.hair, spec.saddle || spec.shirt || spec.jeans].filter(Boolean);
  sw.forEach((col, i) => { o += `<rect x="${W - 60 - i * 54}" y="34" width="44" height="44" rx="6" fill="${col}" stroke="#2a1c12" stroke-width="3"/>`; });
  return o;
}
function lineup() {
  const cast = ['brodie', 'boss', 'stray', 'bella', 'coco', 'bulldog', 'tjr'];
  let o = `<rect width="${W}" height="${H}" fill="#d9dadc"/><rect x="0" y="${GROUND + 6}" width="${W}" height="4" fill="#9a9ca0"/>`;
  o += label(40, 70, 'THE CAST', 48, '#2a1c12', 'start');
  cast.forEach((c, i) => {
    const x = 110 + i * (1280 / (cast.length - 1));
    o += draw(c, 'front', x, 0.92) + label(x, 965, (TOON_DOGS[c] || TOON_HUMANS[c]).name.toUpperCase(), 24);
  });
  return o;
}
stage.setAttribute('width', W); stage.setAttribute('height', H); stage.setAttribute('viewBox', `0 0 ${W} ${H}`);
stage.innerHTML = who === 'lineup' ? lineup() : sheet(who);
window.sheetReady = document.fonts.ready;
