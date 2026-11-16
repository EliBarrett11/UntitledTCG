// Side by side (stage P): each approved mockup next to the game drawing the same thing. Saved to
// tools/screenshots/p-compare-<name>.png.
//   prime     ← docs/mockups/prime-v1/series.png beside ?sheet=prime (one series, Rounds 1–6, and its curve strip)
//   locations ← docs/mockups/locations-v1/after-crop.png beside the game's board with two Location tiles
//               (?seed=1&scene=mid: the cards changed in stage P, so the mockup's seed no longer shows two tiles)
//
// Usage: node tools/pcompare.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const b64 = async (f) => (await readFile(join(root, f))).toString('base64');

async function sideBySide(name, mockFile, mockLabel, game, gameLabel, w, h) {
  const page = await browser.newPage({ viewport: { width: 2 * w + 60, height: h + 80 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:#080605;font-family:Georgia,serif;color:#c9b07a;display:inline-flex;gap:20px;padding:0 10px 10px">
    <div><div style="padding:10px 6px;font-size:18px;letter-spacing:3px">THE APPROVED MOCKUP · ${mockLabel}</div><img src="data:image/png;base64,${await b64(mockFile)}" style="display:block;width:${w}px;height:${h}px;object-fit:contain;object-position:top left"></div>
    <div><div style="padding:10px 6px;font-size:18px;letter-spacing:3px">THE GAME · ${gameLabel}</div><img src="data:image/png;base64,${game}" style="display:block;width:${w}px;height:${h}px;object-fit:contain;object-position:top left"></div></body>`);
  await page.waitForTimeout(200);
  await (await page.$('body')).screenshot({ path: join(root, 'tools', 'screenshots', `p-compare-${name}.png`) });
  await page.close();
  console.log(`Saved p-compare-${name}.png`);
}

// The series: the game's own drawing of the Oathsworn Recruit series, with "NOW" over Round 2 as in the mockup.
{
  const page = await browser.newPage({ viewport: { width: 2280, height: 1060 }, deviceScaleFactor: 1 });
  await page.goto(`${base}?sheet=prime&series=oathsworn-recruit&round=2`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const game = (await (await page.$('#cmp')).screenshot()).toString('base64');
  await page.close();
  await sideBySide('prime', 'docs/mockups/prime-v1/series.png', 'docs/mockups/prime-v1/series.png', game, '?sheet=prime (the renderer, the curve strip)', 1140, 530);
}

// The Location tiles: the same crop of the board as the mockup's after-crop.png.
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(`${base}?seed=1&scene=mid&pace=100000&lowmotion=1`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  const game = (await page.screenshot({ clip: { x: 0, y: 120, width: 1100, height: 660 } })).toString('base64');
  await page.close();
  await sideBySide('locations', 'docs/mockups/locations-v1/after-crop.png', 'docs/mockups/locations-v1/after-crop.png', game, '?seed=1&scene=mid (two tiles)', 1100, 660);
}

await browser.close();
server.close();
