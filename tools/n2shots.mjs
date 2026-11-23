// Stage N2: Chill's Frozen, caught with real clicks. From the n2-chill scene (your Ready Hilde; an enemy Rime Elemental,
// Spent, with Chill), real clicks attack it; Hilde should end Spent with the FROZEN tag and its frost crust, and her
// Codex page should say she's Frozen. The shot is taken as the CHILL moment plays and once it has settled.
//
// Usage: node tools/n2shots.mjs     (writes tools/screenshots/n2-chill-moment.png and n2-chill-after.png)
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
await page.goto(`${url}?seed=10&scene=n2-chill&pace=100000&speed=slow`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const click = async (sel) => { await (await page.$(sel))?.click(); await page.waitForTimeout(250); };
let ok = true;
const fail = (m) => { ok = false; console.log(`FAIL  ${m}`); };
await click('[data-act="attacker"]');
if (await page.$('[data-cell="p2:3"][data-pick]')) await click('[data-cell="p2:3"][data-pick]');
try {
  await page.waitForFunction(() => [...document.querySelectorAll('.trigger-tag')].some((t) => /CHILL/.test(t.textContent)), null, { timeout: 15000, polling: 'raf' });
  await page.waitForTimeout(90);
  await page.screenshot({ path: join(root, 'tools', 'screenshots', 'n2-chill-moment.png') });
} catch { fail('the Chill moment never showed'); }
await page.waitForFunction(() => !document.body.classList.contains('presenting') && document.body.dataset.step === 'idle', null, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(800);
const after = await page.evaluate(() => ({
  tag: document.querySelector('[data-cell="p1:3"] .tag')?.textContent,
  crust: !!document.querySelector('[data-cell="p1:3"] .frost-crust'),
  frozen: !!document.querySelector('[data-cell="p1:3"] .slot-card.frozen.spent'),
}));
await page.screenshot({ path: join(root, 'tools', 'screenshots', 'n2-chill-after.png') });
if (after.tag !== 'FROZEN' || !after.crust || !after.frozen) fail(`after Chill: tag ${after.tag}, crust ${after.crust}, frozen class ${after.frozen}`);
// Her Codex page says so (right-click), with the Frozen glossary entry.
await page.click('[data-hover="board"][data-who="p1"][data-space="3"]', { button: 'right' });
await page.waitForSelector('#codex:not([hidden])', { timeout: 5000 }).catch(() => {});
const cx = await page.evaluate(() => ({ now: document.querySelector('#codex .cx-now')?.textContent ?? '', gl: !!document.querySelector('#codex .cx-gl[data-gl="frozen"]') }));
if (!/Frozen: it's Spent, and it stays Spent at the next Dawn/.test(cx.now) || !cx.gl) fail(`the Codex: "${cx.now.slice(0, 120)}", glossary ${cx.gl}`);
if (errors.length) fail(errors.join('\n'));
console.log(ok ? 'PASS  Chill freezes the attacker with real clicks: FROZEN tag, frost crust, and the Codex says so' : 'FAIL');
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
