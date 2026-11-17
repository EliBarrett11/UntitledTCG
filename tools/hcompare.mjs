// Side by side (stage H): each approved mockup beside the game at the same moment, and the hand at 10 cards at each size.
// Saved to tools/screenshots/:
//   h-compare-you.png      ← docs/mockups/hud-v2/a2-you.png: ?seed=10&scene=mid, your turn
//   h-compare-enemy.png    ← docs/mockups/hud-v2/a2-enemy.png: ?seed=10&scene=enemy, the enemy's turn (thinking)
//   h-compare-energy.png   ← the mockup's Energy panel beside the slimmer one Elliott asked for (about 270 px from x 1286)
//   h-hand10-<size>.png    the hand at 10 cards (two at their Prime), at 1920×1080, 1366×768 and 1280×720
//
// Usage: node tools/hcompare.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'tools', 'screenshots');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];

async function open(query, viewport = { width: 1920, height: 1080 }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(`${query}: ${e.message}`));
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(1200);
  return page;
}
async function sideBySide(name, panels, { width = 960, height = 540 } = {}) {
  const page = await browser.newPage({ viewport: { width: panels.length * (width + 20) + 20, height: 400 }, deviceScaleFactor: 1 });
  const parts = panels.map((x) => `<div><div style="padding:10px 6px;font-size:18px;letter-spacing:3px">${x.label}</div><img src="data:image/png;base64,${x.png.toString('base64')}" style="display:block;width:${width}px;height:${height}px;object-fit:contain;object-position:top left"></div>`).join('');
  await page.setContent(`<body style="margin:0;background:#080605;font-family:Georgia,serif;color:#c9b07a;display:inline-flex;gap:20px;padding:0 10px 10px">${parts}</body>`);
  await page.waitForTimeout(200);
  await (await page.$('body')).screenshot({ path: join(shots, `h-compare-${name}.png`) });
  await page.close();
  console.log(`Saved h-compare-${name}.png`);
}
const mock = (f) => readFile(join(root, 'docs', 'mockups', 'hud-v2', f));

{
  const page = await open('?seed=10&scene=mid&pace=100000&lowmotion=1');
  const game = await page.screenshot();
  await sideBySide('you', [{ label: 'THE MOCKUP · a2-you.png', png: await mock('a2-you.png') }, { label: 'THE GAME · ?seed=10&scene=mid, your turn', png: game }]);
  const slim = await page.screenshot({ clip: { x: 1180, y: 780, width: 390, height: 300 } });
  await page.close();
  const m = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await m.setContent(`<body style="margin:0"><img src="data:image/png;base64,${(await mock('a2-you.png')).toString('base64')}"></body>`);
  const wide = await m.screenshot({ clip: { x: 1180, y: 780, width: 390, height: 300 } });
  await m.close();
  await sideBySide('energy', [{ label: 'THE MOCKUP · 356 PX', png: wide }, { label: 'THE GAME · 270 PX FROM X 1286 (ELLIOTT)', png: slim }], { width: 390, height: 300 });
}
{
  const page = await open('?seed=10&scene=enemy&pace=100000&lowmotion=1');
  const game = await page.screenshot();
  await sideBySide('enemy', [{ label: 'THE MOCKUP · a2-enemy.png', png: await mock('a2-enemy.png') }, { label: "THE GAME · ?seed=10&scene=enemy, the enemy's turn", png: game }]);
  await page.close();
}
for (const [w, h] of [[1920, 1080], [1366, 768], [1280, 720]]) {
  const page = await open('?seed=10&scene=mid&pace=100000&lowmotion=1&hand=10', { width: w, height: h });
  const k = w / 1920;
  await page.screenshot({ path: join(shots, `h-hand10-${w}x${h}.png`), clip: { x: 0, y: Math.round(740 * k), width: w, height: h - Math.round(740 * k) } });
  console.log(`Saved h-hand10-${w}x${h}.png`);
  await page.close();
}

await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
