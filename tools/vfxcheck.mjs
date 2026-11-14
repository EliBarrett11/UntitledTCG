// Effects-layer check (stage V1), in a real browser:
//  1. Coverage: AI-vs-AI matches with the effects on; lists every effect that played. Every storyboard effect
//     must play at least once.
//  2. Missing textures: the same with every texture treated as missing, and with texture downloads failing:
//     the stand-ins drawn in code take their place, with no errors.
//  3. The 2D fallback: with ?webgl=0, and with WebGL switched off in the browser, the S5 animations play.
// Every run must finish with no page errors, every beat finished, and the board matching the state.
//
// Usage: node tools/vfxcheck.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available, so the effects check cannot run.'); process.exit(2); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'assets/vfx/manifest.json'), 'utf8')).textures;
// The storyboard's effects (docs/10-feel-and-vfx.md section 3) that a real match must play.
const STORYBOARD = ['attack.martial', 'attack.arcane', 'attack.ranger', 'attack.rogue', 'attack.beast', 'attack.undead', 'defeat', 'summon', 'renown', 'heal', 'strat.seal', 'strat.resolve', 'gold.gain', 'item.bought'];
const ALSO = ['attack.wyrm', 'wyrm.onsummon', 'renown.favour', 'riposte', 'item.wildfire', 'item.draught', 'item.held.blade', 'item.held.shield', 'spell.firebolt', 'shade.drain', 'legendary'];
// Chromium's own notices about software GPU readbacks are not page problems.
const noise = (t) => /GL Driver Message|GPU stall due to ReadPixels|Automatic fallback to software WebGL/.test(t);

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
let failures = 0;

async function match(browser, query, { actions = 400, route = null, label }) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !noise(m.text()) && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  if (route) await page.route('**/assets/vfx/*.webp', route);
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  const seen = new Set();
  const problems = [];
  let lastV = '';
  const t0 = Date.now();
  for (;;) {
    const st = await page.evaluate(() => ({ ...document.body.dataset, end: !!document.querySelector('[data-region="end"]') }));
    if (st.effect) seen.add(st.effect);
    if (st.presenting !== '1' && st.version !== lastV) {
      const snap = await page.evaluate(() => (document.body.dataset.presenting === '1' ? null : { v: document.body.dataset.version, off: window.__match.boardProblems(), beats: window.__match.beats() }));
      if (snap) {
        lastV = snap.v;
        if (snap.off.length) problems.push(`after action ${snap.v}: ${snap.off.join('; ')}`);
        if (snap.beats.started !== snap.beats.done) problems.push(`after action ${snap.v}: ${snap.beats.started} beats started, ${snap.beats.done} done`);
      }
    }
    if (st.end || errors.length || problems.length || Number(st.version) >= actions) break;
    if (Date.now() - t0 > 20 * 60 * 1000) { problems.push('stall'); break; }
    await page.waitForTimeout(20);
  }
  const info = await page.evaluate(() => ({ mode: document.body.dataset.vfx, beats: window.__match.beats(), vfx: window.__match.vfx() }));
  await page.close();
  const all = [...problems, ...errors];
  if (all.length) { failures += 1; console.log(`FAIL  ${label}`); for (const p of all.slice(0, 8)) console.log(`      ${p}`); } else console.log(`PASS  ${label}: effects ${info.mode}, ${info.beats.done} beats finished${info.vfx ? `, ${info.vfx.ready} painted textures in use` : ''}.`);
  return { seen, info };
}

const browser = await chromium.launch();
// 1. Coverage.
const seen = new Set();
for (const seed of [5, 7, 11, 3, 21]) {
  const r = await match(browser, `?seed=${seed}&autoplay=1&pace=30&speed=fast&lowmotion=0`, { label: `coverage, seed ${seed}` });
  for (const e of r.seen) seen.add(e);
  if (STORYBOARD.every((e) => seen.has(e)) && ALSO.every((e) => seen.has(e))) break;
}
const notSeen = STORYBOARD.filter((e) => !seen.has(e));
const alsoNot = ALSO.filter((e) => !seen.has(e));
console.log(`      Effects played: ${[...seen].sort().join(', ')}.`);
if (notSeen.length) { failures += 1; console.log(`FAIL  storyboard effects never played: ${notSeen.join(', ')}`); } else console.log('PASS  every storyboard effect played in a real match.');
if (alsoNot.length) console.log(`      (Not met in these matches: ${alsoNot.join(', ')}.)`);
// 2. Missing textures.
await match(browser, `?seed=7&autoplay=1&pace=30&speed=fast&lowmotion=0&vfxmissing=${Object.keys(manifest).join(',')}`, { actions: 160, label: 'every texture missing (stand-ins drawn in code)' });
await match(browser, '?seed=11&autoplay=1&pace=30&speed=fast&lowmotion=0', { actions: 160, label: 'texture downloads failing', route: (r) => (/(slash-arc|impact-flash|renown-ribbon|summon-sigil|embers-atlas)/.test(r.request().url()) ? r.abort() : r.continue()) });
// 3. The 2D fallback.
const r2 = await match(browser, '?seed=7&autoplay=1&pace=30&speed=fast&lowmotion=0&webgl=0', { actions: 160, label: '2D fallback (?webgl=0)' });
if (r2.info.mode !== '2d') { failures += 1; console.log('FAIL  ?webgl=0 did not use the 2D fallback'); }
await browser.close();
const noGl = await chromium.launch({ args: ['--disable-webgl', '--disable-webgl2'] });
const r3 = await match(noGl, '?seed=5&autoplay=1&pace=30&speed=fast&lowmotion=0', { actions: 160, label: '2D fallback (WebGL switched off in the browser)' });
if (r3.info.mode !== '2d') { failures += 1; console.log('FAIL  with WebGL off, the 2D fallback was not used'); }
await noGl.close();
server.close();
process.exit(failures ? 1 : 0);
