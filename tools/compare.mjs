// Side by side (stage C): each approved mockup page of card design v4 (docs/mockups/cards-v4/*.html) above the
// same cards drawn by the game's renderer (?sheet=v4-types|stats|finishes|board). Saved to
// tools/screenshots/c-compare-<page>.png. Holo is paused in both, so the pictures compare like for like.
//
// Usage: node tools/compare.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
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
const ctx = await browser.newContext({ viewport: { width: 3000, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const shot = async (url, sel) => {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const el = await page.$(sel);
  const buf = await el.screenshot();
  await page.close();
  return buf.toString('base64');
};
for (const name of ['types', 'stats', 'finishes', 'board']) {
  const mock = await shot(`${base}docs/mockups/cards-v4/${name}.html`, 'body > div');
  const game = await shot(`${base}?sheet=v4-${name}`, '#cmp');
  const page = await ctx.newPage();
  await page.setContent(`<body style="margin:0;background:#080605;font-family:sans-serif;color:#c9b07a;display:inline-block">
    <div style="padding:10px 16px;font-size:18px;letter-spacing:3px">THE APPROVED MOCKUP · docs/mockups/cards-v4/${name}.html</div><img src="data:image/png;base64,${mock}" style="display:block">
    <div style="padding:10px 16px;font-size:18px;letter-spacing:3px">THE GAME · the same cards drawn by src/ui/cards.js</div><img src="data:image/png;base64,${game}" style="display:block"></body>`);
  await page.waitForTimeout(200);
  const body = await page.$('body');
  await body.screenshot({ path: join(root, 'tools', 'screenshots', `c-compare-${name}.png`) });
  await page.close();
  console.log(`Saved tools/screenshots/c-compare-${name}.png`);
}
await browser.close();
server.close();
