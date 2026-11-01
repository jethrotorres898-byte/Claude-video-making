// Rasterizes the static layers of an animation page to transparent PNGs, so their (slow)
// filters run once instead of every frame.
//
// The page must define `window.LAYERS` (names) and `window.showLayer(name)`, which draws only
// that layer on a transparent background (open the page with ?bake).
//
// Usage:
//   node tools/bake.js <page.html> <out-dir> [--scale 1.6] [--width 1920 --height 1080] [--only a,b]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const argv = process.argv.slice(2);
  const opts = { scale: 1.6, width: 1920, height: 1080 };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[++i];
    else pos.push(argv[i]);
  }
  const [pagePath, outDir] = pos;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +opts.width, height: +opts.height }, deviceScaleFactor: +opts.scale });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('file://' + path.resolve(pagePath) + '?bake');
  await page.evaluate(() => document.fonts.ready);
  let names = await page.evaluate(() => window.LAYERS);
  if (opts.only) names = names.filter((n) => opts.only.split(',').includes(n));
  for (const name of names) {
    const t0 = Date.now();
    await page.evaluate((n) => window.showLayer(n), name);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: path.join(outDir, `${name}.png`), omitBackground: true });
    console.log(`${name}.png (${Date.now() - t0} ms)`);
  }
  await browser.close();
})();
