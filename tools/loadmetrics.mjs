// Stage X1 (docs/38 section 2): what the page loads, and how long it takes, to an interactive title screen and to the
// first match (Play, then Begin, until the hand is on the table), with a cold cache. Bytes are the bodies transferred.
// It also reports what has loaded 20 s after the title (the background preload) and lists the biggest files to the title.
//
// Usage: node tools/loadmetrics.mjs     (a player's address: no ?dev)
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
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const got = [];
page.on('requestfinished', async (req) => {
  try { const s = await req.sizes(); got.push({ url: req.url().replace(base, ''), bytes: s.responseBodySize, t: Date.now() }); } catch { /* gone */ }
});
const sum = (until) => got.filter((g) => g.t <= until).reduce((n, g) => n + g.bytes, 0);
const mb = (b) => `${(b / 1048576).toFixed(2)} MB`;
const t0 = Date.now();
await page.goto(base);
await page.waitForSelector('[data-act="play"]', { state: 'visible', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const tTitle = Date.now();
await page.waitForTimeout(300);
const titleBytes = sum(tTitle);
const titleFiles = got.filter((g) => g.t <= tTitle).sort((a, b) => b.bytes - a.bytes).slice(0, 8);
await page.click('[data-act="play"]');
await page.waitForSelector('[data-act="begin"]', { state: 'visible', timeout: 60000 });
const tPlay = Date.now();
await page.click('[data-act="begin"]');
await page.waitForFunction(() => document.querySelectorAll('.hand-card').length > 0 && !document.querySelector('.loading-bar:not([hidden])'), null, { timeout: 120000, polling: 100 });
const tMatch = Date.now();
const matchBytes = sum(tMatch);
await page.waitForTimeout(Math.max(0, 20000 - (Date.now() - tTitle)));
const after = sum(Date.now());
console.log(`To an interactive title: ${mb(titleBytes)} in ${((tTitle - t0) / 1000).toFixed(2)} s`);
for (const f of titleFiles) console.log(`  ${mb(f.bytes).padStart(9)}  ${f.url}`);
console.log(`To the first match (Play at ${((tPlay - t0) / 1000).toFixed(2)} s, Begin, the hand dealt): ${mb(matchBytes)} in ${((tMatch - t0) / 1000).toFixed(2)} s`);
console.log(`20 s after the title (with the background preload): ${mb(after)}, ${got.length} files`);
await browser.close();
server.close();
