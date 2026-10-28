// Renders still panels (16:9) from a page that defines window.PANELS and window.showPanel(i).
// Usage: node tools/panels.js <page.html> <out-dir> [1,2,5]   (default: all panels)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [pageFile, out, list] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +(process.env.SCALE || 1.5) });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('file://' + path.resolve(pageFile));
  const n = await page.evaluate(async () => { if (window.ready) await window.ready; await document.fonts.ready; return window.PANELS.length; });
  const ids = list ? list.split(',').map(Number) : [...Array(n).keys()].map((i) => i + 1);
  for (const i of ids) {
    await page.evaluate(async (i) => {
      window.showPanel(i);
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('image')].map((im) => (im.decode ? im.decode().catch(() => {}) : null)));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, i);
    await page.screenshot({ path: path.join(out, `${String(i).padStart(2, '0')}.png`) });
  }
  await browser.close();
})();
