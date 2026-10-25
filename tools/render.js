// Renders an animation page frame by frame with headless Chromium and pipes the
// frames into ffmpeg.
//
// The page must define `window.DURATION` (seconds) and `window.renderFrame(t)`.
//
// Usage:
//   node tools/render.js <page.html> <out.mp4> [--fps 30] [--scale 1.5] [--from 0] [--to DURATION]
//   node tools/render.js <page.html> <out-dir> --stills 0.5,3.2,10   (PNG previews)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const opts = { fps: 30, scale: 1.5 };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[++i];
    else pos.push(argv[i]);
  }
  return { page: pos[0], out: pos[1], ...opts };
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const fps = +args.fps;
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 720, height: 1280 },
    deviceScaleFactor: +args.scale,
  });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('file://' + path.resolve(args.page));
  await page.evaluate(async () => {
    if (window.ready) await window.ready;
    window.renderFrame(0);
    await document.fonts.ready;
  });
  const duration = await page.evaluate(() => window.DURATION);

  if (args.stills) {
    fs.mkdirSync(args.out, { recursive: true });
    for (const t of args.stills.split(',').map(Number)) {
      await page.evaluate((t) => window.renderFrame(t), t);
      await page.screenshot({ path: path.join(args.out, `t${t.toFixed(2)}.png`) });
    }
    await browser.close();
    return;
  }

  const from = args.from ? +args.from : 0;
  const to = args.to ? +args.to : duration;
  const frames = Math.round((to - from) * fps);
  const ff = spawn('ffmpeg', [
    '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium',
    args.out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.renderFrame(t), from + i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`wrote ${args.out} (${frames} frames)`);
})();
