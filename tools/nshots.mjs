// Stage N: the moments a still can't stage: Undying saving a creature, caught as it happens. From the n-undying scene
// (your Gorran is Ready; an enemy Cairn Revenant at 2 Health), real clicks attack it, and the shot is taken while the
// UNDYING moment plays (its tag on the board), and again once it has settled (the Cairn at 1 Health, its marker gone).
//
// Usage: node tools/nshots.mjs     (writes tools/screenshots/n-undying-moment.png and n-undying-after.png)
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available.'); process.exit(2); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${url}?seed=10&scene=n-undying&pace=100000&speed=slow`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// (A real click on the element, where it's on top.)
const click = async (sel) => { await (await page.$(sel))?.click(); await page.waitForTimeout(250); };
let ok = true;
await click('[data-act="attacker"]');
if (await page.$('[data-cell="p2:3"][data-pick]')) await click('[data-cell="p2:3"][data-pick]');
try {
  // (The moment is short: the shot is taken as soon as its tag shows, at the slow speed.)
  await page.waitForFunction(() => [...document.querySelectorAll('.trigger-tag')].some((t) => /UNDYING/.test(t.textContent)), null, { timeout: 15000, polling: 'raf' });
  // (Three quick frames as it lands; the first, with the tag and the burst, is kept.)
  for (let i = 0; i < 3; i++) { await page.waitForTimeout(90); await page.screenshot({ path: join(root, 'tools', 'screenshots', i === 0 ? 'n-undying-moment.png' : `n-undying-f${i}.png`) }); }
} catch { ok = false; console.log('FAIL  the Undying moment never showed'); }
await page.waitForFunction(() => !document.body.classList.contains('presenting') && document.body.dataset.step === 'idle', null, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(800);
const after = await page.evaluate(() => ({ hp: document.querySelector('[data-cell="p2:3"] .tab-h span')?.firstChild?.textContent, marker: !!document.querySelector('[data-cell="p2:3"] .cv-undying') }));
await page.screenshot({ path: join(root, 'tools', 'screenshots', 'n-undying-after.png') });
if (after.hp !== '1' || after.marker) { ok = false; console.log(`FAIL  after Undying: Health ${after.hp}, marker ${after.marker ? 'still shown' : 'gone'}`); }
if (errors.length) { ok = false; console.log(errors.join('\n')); }
console.log(ok ? 'PASS  Undying caught as it saves the Cairn (left at 1 Health, its marker gone)' : 'FAIL');
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
