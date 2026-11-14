// Real-input check: Playwright plays full matches against the AI with real mouse clicks only, at
// 1920×1080, 1366×768 and 1280×720. It reads the page (what's highlighted, what's clickable) to decide
// where to click, and never calls the game's code. It fails on any page error, any stall, or any click
// that has no effect.
//
// Usage: node tools/realinput.mjs [seed=11]
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { staticServer } from './serve.mjs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available, so the real-input check cannot run.'); process.exit(2); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotDir = join(root, 'tools', 'screenshots');
const SIZES = [[1920, 1080], [1366, 768], [1280, 720]];
const SEED = Number(process.argv[2] ?? 11);
const MAX_CLICKS = 4000;
// A seeded generator for the player's choices.
function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

// A point inside the element that is really on top (so a fanned hand card is clicked where it shows).
async function pointOf(page, selector, index = 0) {
  return page.evaluate(([sel, i]) => {
    const el = document.querySelectorAll(sel)[i];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.25], [0.15, 0.5], [0.5, 0.2], [0.3, 0.12], [0.12, 0.85], [0.8, 0.5], [0.5, 0.85]]) {
      const x = r.left + r.width * fx;
      const y = r.top + r.height * fy;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit))) return { x, y };
    }
    return null;
  }, [selector, index]);
}

const sig = (page) => page.evaluate(() => {
  const b = document.body.dataset;
  return `${b.version}|${b.step}|${b.phase}|${b.react}|${document.querySelectorAll('.menu').length}|${document.querySelectorAll('.mull-card.chosen').length}|${document.querySelectorAll('.react-opt.selected').length}`;
});

async function playOne(browser, url, [w, h], log) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  const pick = rng(SEED * 31 + w);
  let clicks = 0;
  const counts = {};

  // One real click; it must change something on the page.
  async function click(selector, index = 0, what = selector) {
    const p = await pointOf(page, selector, index);
    if (!p) return false;
    const before = await sig(page);
    await page.mouse.click(p.x, p.y);
    clicks += 1;
    counts[what] = (counts[what] ?? 0) + 1;
    for (let i = 0; i < 40; i++) {
      if ((await sig(page)) !== before) return true;
      await page.waitForTimeout(25);
    }
    throw new Error(`a click had no effect: ${what} at (${Math.round(p.x)}, ${Math.round(p.y)})`);
  }
  const count = (sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
  const state = () => page.evaluate(() => ({ ...document.body.dataset, end: !!document.querySelector('[data-region="end"]'), mull: !!document.querySelector('[data-region="mulligan"]'), react: !!document.querySelector('[data-region="react-bar"]') }));

  // Keep clicking highlighted choices until the selection is done (or cancel with Esc if it can't finish).
  async function finishSelection() {
    for (let i = 0; i < 12; i++) {
      const st = await state();
      if (!st.step?.startsWith('sel') && st.step !== 'menu') return;
      if (st.step === 'menu') {
        const n = await count('.menu-item:not(.cancel)');
        const items = await page.evaluate(() => [...document.querySelectorAll('.menu-item:not(.cancel)')].map((b) => b.textContent));
        let choice = items.findIndex((t) => !/^Retain/.test(t));
        if (choice < 0 || pick() < 0.12) choice = Math.floor(pick() * n);
        await click('.menu-item:not(.cancel)', choice, 'menu option');
        continue;
      }
      const n = await count('[data-pick]');
      if (!n) { await page.keyboard.press('Escape'); return; }
      const idx = Math.floor(pick() * n);
      if (!(await click('[data-pick]', idx, 'target'))) {
        let ok = false;
        for (let j = 0; j < n && !ok; j++) ok = await click('[data-pick]', j, 'target');
        if (!ok) { await page.keyboard.press('Escape'); return; }
      }
    }
  }

  let lastVersion = '';
  let sameTurnTries = 0;
  const t0 = Date.now();
  for (;;) {
    if (errors.length) throw new Error(errors.join('; '));
    if (clicks > MAX_CLICKS) throw new Error(`stall: more than ${MAX_CLICKS} clicks`);
    if (Date.now() - t0 > 12 * 60 * 1000) throw new Error('stall: the match took over 12 minutes');
    const st = await state();
    if (st.end) break;
    if (st.mull) {
      // Exercise the mulligan: put one card back.
      await click('.mull-card', 0, 'mulligan card');
      await click('[data-act="mull-go"]', 0, 'mulligan');
      continue;
    }
    if (st.actor !== 'p1') {
      // The AI is thinking (with the page's pause); wait for its move.
      const v = st.version;
      for (let i = 0; i < 200 && (await page.evaluate(() => document.body.dataset.version)) === v && (await state()).actor !== 'p1'; i++) await page.waitForTimeout(25);
      if ((await page.evaluate(() => document.body.dataset.version)) === v && (await state()).actor !== 'p1' && !(await state()).end) throw new Error('stall: the AI made no move');
      continue;
    }
    if (st.version === lastVersion) { if (++sameTurnTries > 25) throw new Error(`stall: no progress on the player's turn (step ${st.step})`); } else { lastVersion = st.version; sameTurnTries = 0; }
    if (st.react) {
      const opts = await count('.react-opt');
      if (opts && pick() < 0.5) { await click('.react-opt', Math.floor(pick() * opts), 'React'); await finishSelection(); }
      else await click('[data-act="decline"]', 0, 'Let it happen');
      continue;
    }
    // My turn: attack, play a card, buy, use the Bag, or Pass.
    const attackers = await count('[data-act="attacker"]');
    const hand = await count('[data-act="hand"]');
    const r = pick();
    if (attackers && (r < 0.6 || !hand)) { await click('[data-act="attacker"]', Math.floor(pick() * attackers), 'attacker'); await finishSelection(); continue; }
    if (hand && r < 0.85) { await click('[data-act="hand"]', Math.floor(pick() * hand), 'hand card'); await finishSelection(); continue; }
    if (await count('[data-act="buy-market"]') && pick() < 0.5) { await click('[data-act="buy-market"]', 0, 'Buy'); await finishSelection(); continue; }
    if (await count('.bag-slot.usable') && pick() < 0.5) { await click('.bag-slot.usable', 0, 'Bag'); await finishSelection(); continue; }
    if (await count('[data-act="pass"]')) { await click('[data-act="pass"]', 0, 'Pass'); continue; }
    if (attackers) { await click('[data-act="attacker"]', 0, 'attacker'); await finishSelection(); continue; }
    if (hand) { await click('[data-act="hand"]', 0, 'hand card'); await finishSelection(); continue; }
    throw new Error('stall: nothing to click on the player\'s turn');
  }
  const end = await page.evaluate(() => document.querySelector('[data-region="end"] .dialog-title')?.textContent);
  log(`  ${w}×${h}: the match ended (${end}) after ${clicks} real clicks; ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  // Play again starts a new match.
  await click('[data-act="again"]', 0, 'Play again');
  const fresh = await state();
  if (fresh.end || fresh.phase !== 'mulligan') throw new Error('Play again did not start a new match');
  await mkdir(shotDir, { recursive: true });
  await page.close();
}

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
let failures = 0;
console.log(`Real-input check: full matches against the AI, real mouse clicks only (seed ${SEED}).`);
for (const size of SIZES) {
  try {
    await playOne(browser, `${base}?seed=${SEED}&pace=30`, size, console.log);
    console.log(`PASS  ${size[0]}×${size[1]}`);
  } catch (e) {
    failures += 1;
    console.log(`FAIL  ${size[0]}×${size[1]}: ${e.message}`);
  }
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
