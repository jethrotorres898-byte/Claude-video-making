// Renders cast model sheets (cast/sheet.html) to PNG.
// Usage: node tools/sheets.js <out-dir> brodie boss lineup ...
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [out, ...names] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: +(process.env.SCALE || 1) });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  for (const n of names) {
    await page.goto('file://' + path.resolve(__dirname, '../cast/sheet.html') + '?c=' + n);
    await page.evaluate(() => window.sheetReady);
    await page.screenshot({ path: path.join(out, `${n}.png`) });
  }
  await browser.close();
})();
