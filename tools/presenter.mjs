// Presenter check: whole AI-vs-AI matches play with the animations on (?autoplay=1), while the check clicks
// to skip beats at random. Whenever a presentation ends, the board on screen must match the state, and every
// beat that started must have finished. Runs at fast and normal speed, and once in low motion.
//
// Usage: node tools/presenter.mjs [seed=5]
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available, so the presenter check cannot run.'); process.exit(2); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED = Number(process.argv[2] ?? 5);
const RUNS = [
  { label: 'fast, skipping often', query: 'speed=fast&lowmotion=0', skip: 0.5 },
  { label: 'normal, skipping sometimes', query: 'speed=normal&lowmotion=0', skip: 0.15, maxActions: 140 },
  { label: 'low motion', query: 'speed=fast&lowmotion=1', skip: 0.2 },
];
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
let failures = 0;
let k = SEED;
const rnd = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };

for (const run of RUNS) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message|GPU stall due to ReadPixels/.test(m.text())) errors.push(`console: ${m.text()}`); });
  await page.goto(`http://127.0.0.1:${server.address().port}/?seed=${SEED}&autoplay=1&pace=120&${run.query}`, { waitUntil: 'networkidle' });
  const problems = [];
  let checks = 0;
  let skips = 0;
  let lastVersion = '';
  const t0 = Date.now();
  for (;;) {
    const st = await page.evaluate(() => ({ ...document.body.dataset, end: !!document.querySelector('[data-region="end"]') }));
    if (st.presenting === '1') {
      if (rnd() < run.skip) {
        const box = await page.evaluate(() => { const r = document.querySelector('[data-region="map"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        await page.mouse.click(box.x, box.y);
        skips += 1;
      }
      await page.waitForTimeout(40 + Math.floor(rnd() * 120));
      continue;
    }
    if (st.version !== lastVersion) {
      // Read everything in one go, so the next action can't start in between.
      const snap = await page.evaluate(() => (document.body.dataset.presenting === '1' ? null : { v: document.body.dataset.version, off: window.__match.boardProblems(), beats: window.__match.beats() }));
      if (snap) {
        lastVersion = snap.v;
        checks += 1;
        if (snap.off.length) problems.push(`after action ${snap.v}: ${snap.off.join('; ')}`);
        if (snap.beats.started !== snap.beats.done) problems.push(`after action ${snap.v}: ${snap.beats.started} beats started, ${snap.beats.done} done`);
      }
    }
    if (st.end || errors.length || problems.length || (run.maxActions && Number(st.version) >= run.maxActions)) break;
    if (Date.now() - t0 > 20 * 60 * 1000) { problems.push('stall: over 20 minutes'); break; }
    await page.waitForTimeout(30);
  }
  const beats = await page.evaluate(() => window.__match.beats());
  const all = [...problems, ...errors];
  if (all.length) {
    failures += 1;
    console.log(`FAIL  ${run.label}`);
    for (const p of all.slice(0, 10)) console.log(`      ${p}`);
  } else console.log(`PASS  ${run.label}: ${beats.done} beats finished, ${skips} skip clicks, the board matched the state after all ${checks} actions checked.`);
  await page.close();
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
