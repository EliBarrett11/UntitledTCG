// Screenshots of the presenter for review (stage S5): an attack, a defeat, a Strat resolving, Renown flowing,
// a React window with its previews, and Dusk scoring. Saved to tools/screenshots/s5-*.png.
//
// Usage: node tools/s5shots.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => join(root, 'tools', 'screenshots', `s5-${name}.png`);
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const shots = [];

async function open(query) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.log('page error:', e.message));
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return page;
}
// Waits for a beat of this kind to start, then for `after` ms, and takes the picture.
async function catchBeat(page, kind, name, after, limitMs = 240000) {
  const t0 = Date.now();
  while (Date.now() - t0 < limitMs) {
    if ((await page.evaluate(() => document.body.dataset.beat)) === kind) {
      await page.waitForTimeout(after);
      await page.screenshot({ path: out(name) });
      shots.push(name);
      return true;
    }
    if (await page.$('[data-region="end"]')) return false;
    await page.waitForTimeout(15);
  }
  return false;
}

// An attack (your creature lunges and strikes), then the defeat it causes.
{
  const page = await open('?seed=7&scene=mid&pace=100000&speed=slow');
  await page.click('[data-act="attacker"]');
  await page.waitForTimeout(200);
  const badges = await page.$$eval('[data-pick]', (els) => els.map((e) => e.querySelector('.preview-badge')?.textContent ?? ''));
  let i = badges.findIndex((t) => /defeated/.test(t));
  if (i < 0) i = 0;
  const target = (await page.$$('[data-pick]'))[i];
  await target.click({ force: true });
  await page.waitForTimeout(820);
  await page.screenshot({ path: out('attack') });
  shots.push('attack');
  await catchBeat(page, 'defeat', 'defeat', 380, 15000);
  await catchBeat(page, 'renown', 'renown', 520, 15000);
  await page.close();
}
// A React window, with what the attack does with each React and without.
{
  const page = await open('?seed=7&scene=react&pace=100000');
  await page.screenshot({ path: out('react-previews') });
  shots.push('react-previews');
  await page.close();
}
// A Strat resolving, and Dusk scoring: both sides played by the AI, with the animations on.
{
  const page = await open('?seed=7&scene=mid&autoplay=1&pace=60&speed=normal');
  const want = { stratResolve: ['strat-resolving', 700], dusk: ['dusk', 450], dominance: ['dusk-scoring', 420] };
  const t0 = Date.now();
  while (Object.keys(want).length && Date.now() - t0 < 300000) {
    const beat = await page.evaluate(() => document.body.dataset.beat);
    if (want[beat]) {
      const [name, after] = want[beat];
      delete want[beat];
      await page.waitForTimeout(after);
      await page.screenshot({ path: out(name) });
      shots.push(name);
    }
    if (await page.$('[data-region="end"]')) break;
    await page.waitForTimeout(15);
  }
  if (Object.keys(want).length) console.log(`Not seen in this match: ${Object.keys(want).join(', ')}`);
  await page.close();
}
await browser.close();
server.close();
console.log(`Saved: ${shots.map((s) => `tools/screenshots/s5-${s}.png`).join(', ')}`);
