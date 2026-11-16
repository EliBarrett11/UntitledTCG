// Side by side (stage V3): each after-V6 concept still (docs/mockups/v6/) next to the game at the same moment,
// both at 1920×1080, shown at half size. Saved to tools/screenshots/v3-compare-<name>.png.
//   title   ← ?screen=title
//   board   ← ?seed=7&scene=mid
//   last    ← ?seed=7&scene=lastbattle (the scorched map)
//   victory ← ?seed=12&scene=end (a win for you)
//   defeat  ← ?seed=7&scene=end (no still; shown next to the victory still for its mood)
//
// Usage: node tools/v3compare.mjs
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
const PAIRS = [
  ['title', '1-title', '?screen=title'],
  ['board', '2-board', '?seed=7&scene=mid&pace=100000'],
  ['last', '5-last-battle', '?seed=7&scene=lastbattle&pace=100000'],
  ['victory', '6-victory', '?seed=12&scene=end&pace=100000'],
  ['defeat', '6-victory', '?seed=7&scene=end&pace=100000'],
];
for (const [name, still, query] of PAIRS) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500); // the end screen's burst and the screen fade settle
  const game = (await page.screenshot()).toString('base64');
  const mock = (await readFile(join(root, 'docs', 'mockups', 'v6', `${still}.png`))).toString('base64');
  await page.setViewportSize({ width: 1940, height: 620 });
  await page.setContent(`<body style="margin:0;background:#080605;font-family:Georgia,serif;color:#c9b07a;display:inline-flex;gap:20px;padding:0 0 10px">
    <div><div style="padding:10px 16px;font-size:18px;letter-spacing:3px">THE CONCEPT · docs/mockups/v6/${still}.png</div><img src="data:image/png;base64,${mock}" style="display:block;width:960px;height:540px"></div>
    <div><div style="padding:10px 16px;font-size:18px;letter-spacing:3px">THE GAME · ${query.replace(/&pace=100000/, '')}</div><img src="data:image/png;base64,${game}" style="display:block;width:960px;height:540px"></div></body>`);
  await page.waitForTimeout(200);
  await (await page.$('body')).screenshot({ path: join(root, 'tools', 'screenshots', `v3-compare-${name}.png`) });
  await page.close();
  console.log(`Saved v3-compare-${name}.png`);
}
await browser.close();
server.close();
