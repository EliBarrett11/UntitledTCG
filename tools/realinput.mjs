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
import { staticServer, withDev } from './serve.mjs';
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
  // (The prompt too: a new selection can have the same step and number of choices as the last, e.g. a target
  // for a Bag Item chosen in the middle of choosing a target for something else.)
  return `${b.screen}|${b.version}|${b.step}|${b.phase}|${b.react}|${b.skips}|${b.beatsDone}|${document.querySelectorAll('.menu').length}|${document.querySelectorAll('.mull-card.chosen').length}|${document.querySelectorAll('.react-opt.selected').length}|${document.querySelector('[data-region="prompt"]')?.textContent ?? ''}`;
});

async function playOne(browser, url, [w, h], log, { skipRate = 0.2 } = {}) {
  // (Stage H: the seat this screen plays, p1 unless ?seat=p2.)
  const ME = /[?&]seat=p2\b/.test(url) ? 'p2' : 'p1';
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  // (Stage G: was the browser's own menu let through on a right-click?)
  await page.addInitScript(() => { window.addEventListener('contextmenu', (e) => { if (!e.defaultPrevented) window.__browserMenu = (window.__browserMenu ?? 0) + 1; }); });
  await page.goto(withDev(url), { waitUntil: 'networkidle' });
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
    // (Up to 3 s: a busy machine can be slow to draw the change.)
    for (let i = 0; i < 120; i++) {
      if ((await sig(page)) !== before) return true;
      await page.waitForTimeout(25);
    }
    // (What was under the pointer, and the prompt, to tell why.)
    const why = await page.evaluate(([x, y]) => {
      const e = document.elementFromPoint(x, y);
      const name = (el) => (el ? `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}` : 'nothing');
      return `under the pointer: ${name(e)} (in ${name(e?.closest('[data-pick], [data-act], [data-region]'))}); prompt: "${document.querySelector('[data-region="prompt"]')?.textContent ?? ''}"`;
    }, [p.x, p.y]);
    throw new Error(`a click had no effect: ${what} at (${Math.round(p.x)}, ${Math.round(p.y)}); ${why}`);
  }
  const count = (sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
  const state = () => page.evaluate(() => ({ ...document.body.dataset, end: !!document.querySelector('[data-region="end"]'), mull: !!document.querySelector('[data-region="mulligan"]'), react: !!document.querySelector('[data-region="react-moment"]') }));

  // Stage G: the hover check. Moves the pointer onto hand cards and off the hand in many ways (fast, slow,
  // diagonally, to the map, the column and the window's edges), at any moment (during animations, the AI's turn,
  // after a drag), and fails if a hover preview stays while the pointer isn't over a card.
  async function hoverSweep(when, moves = 4) {
    for (let i = 0; i < moves; i++) {
      const n = await count('.hand-card');
      if (!n) return;
      const hb = await page.evaluate((k) => { const r = document.querySelectorAll('.hand-card')[k]?.getBoundingClientRect(); return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; }, Math.floor(pick() * n));
      if (!hb) return;
      const steps = [1, 2, 6, 20];
      await page.mouse.move(hb.x + hb.w * (0.2 + pick() * 0.6), hb.y + hb.h * (0.2 + pick() * 0.6), { steps: steps[Math.floor(pick() * 4)] });
      await page.waitForTimeout(30 + pick() * 120);
      // Across the hand first, now and then.
      if (pick() < 0.4) await page.mouse.move(pick() * w, hb.y + hb.h * 0.5, { steps: steps[Math.floor(pick() * 4)] });
      const exits = [[pick() * w, h * 0.4], [w * 0.9, h * (0.3 + pick() * 0.6)], [pick() * w, h - 1], [1, pick() * h], [w - 1, pick() * h], [hb.x - 120, hb.y - 200], [hb.x + hb.w + 160, hb.y - 260]];
      const [x, y] = exits[Math.floor(pick() * exits.length)];
      await page.mouse.move(x, y, { steps: steps[Math.floor(pick() * 4)] });
      await page.waitForTimeout(60);
      const stuck = await page.evaluate(([x, y]) => {
        const pv = document.getElementById('preview');
        if (!pv || pv.hidden || getComputedStyle(pv).visibility === 'hidden') return null;
        const top = document.elementFromPoint(x, y);
        if (top?.closest?.('[data-hover]')) return null;
        return top ? `${top.tagName.toLowerCase()}.${String(top.className).trim().split(/\s+/).join('.')}` : 'nothing';
      }, [x, y]);
      counts['hover sweep'] = (counts['hover sweep'] ?? 0) + 1;
      if (stuck) throw new Error(`a hover preview stayed on screen ${when}, with the pointer over ${stuck} at (${Math.round(x)}, ${Math.round(y)})`);
    }
  }

  // Stage G: the Codex check. A real right-click on a card (hand, board, Market, Location, Campaign, piles, the log's
  // chips, React plates) opens the Codex, the browser menu stays shut, and a choice in progress isn't broken; Escape
  // then closes the Codex and nothing else.
  async function codexCheck(when) {
    const sels = ['[data-hover="hand"]', '[data-hover="board"]', '.market-card', '.loc-label', `[data-region="quest-${ME}"]`, '[data-codex="pile"]', '.log-chip', '.rx-plate[data-i]'];
    const opts = [];
    for (const sel of sels) { const n = await count(sel); for (let i = 0; i < n; i++) opts.push([sel, i]); }
    if (!opts.length) return;
    const [sel, i] = opts[Math.floor(pick() * opts.length)];
    const p = await pointOf(page, sel, i);
    if (!p) return;
    const read = () => page.evaluate(() => ({ codex: document.body.dataset.codex ?? '', step: document.body.dataset.step, react: document.body.dataset.react, menu: window.__browserMenu ?? 0, crumb: document.querySelector('.cx-crumb')?.textContent ?? '' }));
    const before = await read();
    await page.mouse.click(p.x, p.y, { button: 'right' });
    await page.waitForTimeout(80);
    const open = await read();
    if (open.codex !== 'open') throw new Error(`a right-click on ${sel} ${when} did not open the Codex`);
    if (open.menu !== before.menu) throw new Error(`the browser menu opened on a right-click on ${sel} ${when}`);
    if (open.step !== before.step || open.react !== before.react) throw new Error(`a right-click on ${sel} ${when} broke the choice in progress (${before.step} → ${open.step})`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
    const shut = await read();
    if (shut.codex) throw new Error(`Escape did not close the Codex (${sel}, ${when})`);
    if (shut.step !== before.step || shut.react !== before.react) throw new Error(`Escape on the Codex also changed the choice in progress (${before.step} → ${shut.step})`);
    counts['Codex right-click'] = (counts['Codex right-click'] ?? 0) + 1;
  }

  // Drag a hand card onto one of the places it lights up (or onto the map, for a card with no target).
  async function dragHand(index) {
    const p = await pointOf(page, '[data-act="hand"]', index);
    if (!p) return false;
    const before = await sig(page);
    // (Stage F: from the moment the card is picked up until it's dropped, no hover preview or series line shows.)
    const previewShown = () => page.evaluate(() => { const pv = document.getElementById('preview'); return !!pv && !pv.hidden && pv.innerHTML !== ''; });
    const noPreview = async (when) => { if (await previewShown()) throw new Error(`the hover preview showed during a drag (${when})`); };
    await page.mouse.move(p.x, p.y);
    await page.waitForTimeout(120);   // the hover preview opens
    await page.mouse.down();
    await noPreview('on picking the card up');
    await page.mouse.move(p.x + 12, p.y - 30, { steps: 3 });
    await noPreview('on starting to move');
    await page.mouse.move(p.x + 24, p.y - 80, { steps: 3 });
    const n = await count('.drop-ok');
    const target = n ? await pointOf(page, '.drop-ok', Math.floor(pick() * n)) : await pointOf(page, '[data-region="map"]', 0);
    if (!target) { await page.mouse.up(); return false; }
    // Over other cards on the way (each would open a preview if it weren't a drag).
    await page.mouse.move(target.x, target.y, { steps: 8 });
    await page.waitForTimeout(80);
    await noPreview('over the drop target');
    // Now and then, cancel the drag with Escape instead: nothing is played and nothing reappears.
    if (pick() < 0.15) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(80);
      await noPreview('after Escape');
      // (Stage X1: the ghost flies home along the card-motion system's short arc first, then goes.)
      await page.waitForFunction(() => !document.querySelector('.drag-ghost'), null, { timeout: 2500 }).catch(() => {});
      if (await count('.drag-ghost')) throw new Error('the drag ghost stayed after Escape');
      await page.mouse.up();
      counts['drag cancelled'] = (counts['drag cancelled'] ?? 0) + 1;
      return true;
    }
    await page.mouse.up();
    clicks += 1;
    counts.drag = (counts.drag ?? 0) + 1;
    for (let i = 0; i < 40; i++) { if ((await sig(page)) !== before) return true; await page.waitForTimeout(25); }
    // A drop the card can't use shows a note and changes nothing on the board; that's allowed.
    return !!(await page.$('.toast'));
  }

  // Keep clicking highlighted choices until the selection is done (or cancel with Esc if it can't finish).
  async function finishSelection() {
    for (let i = 0; i < 12; i++) {
      const st = await state();
      if (!st.step?.startsWith('sel') && st.step !== 'menu') return;
      if (st.step.startsWith('sel') && pick() < 0.2) await codexCheck('while choosing a target');
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
    if (Date.now() - t0 > 25 * 60 * 1000) throw new Error('stall: the match took over 25 minutes');
    const st = await state();
    if (st.end && st.presenting !== '1') break;
    if (st.presenting === '1') {
      // Animations play; sometimes click to skip the beat.
      if (pick() < skipRate) {
        // (If the presentation ends just before the click lands, the click falls on the table and does nothing.)
        const p = await pointOf(page, '[data-region="map"]', 0);
        if (p) { await page.mouse.click(p.x, p.y); clicks += 1; counts.skip = (counts.skip ?? 0) + 1; }
        await page.waitForTimeout(40);
      } else if (pick() < 0.12) await hoverSweep('during an animation', 1);
      else await page.waitForTimeout(60);
      continue;
    }
    if (st.mull) {
      // Exercise the mulligan: put one card back.
      await click('.mull-card', 0, 'mulligan card');
      await click('[data-act="mull-go"]', 0, 'mulligan');
      continue;
    }
    if (st.actor !== ME) {
      // The AI is thinking (with the page's pause); wait for its move.
      if (pick() < 0.15) await hoverSweep('on the AI\'s turn', 1);
      const v = st.version;
      for (let i = 0; i < 200 && (await page.evaluate(() => document.body.dataset.version)) === v && (await state()).actor !== ME; i++) await page.waitForTimeout(25);
      if ((await page.evaluate(() => document.body.dataset.version)) === v && (await state()).actor !== ME && !(await state()).end) throw new Error('stall: the AI made no move');
      continue;
    }
    // Between actions the board must match the state.
    const off = await page.evaluate(() => window.__match.boardProblems());
    if (off.length) throw new Error(`the board is out of step with the state: ${off.slice(0, 3).join('; ')}`);
    if (st.version === lastVersion) { if (++sameTurnTries > 25) throw new Error(`stall: no progress on the player's turn (step ${st.step})`); } else { lastVersion = st.version; sameTurnTries = 0; }
    if (st.react) {
      if (pick() < 0.25) await codexCheck('in a React moment');
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
    if (hand && r < 0.72) { await click('[data-act="hand"]', Math.floor(pick() * hand), 'hand card'); await finishSelection(); continue; }
    if (hand && r < 0.85) { await dragHand(Math.floor(pick() * hand)); await hoverSweep('after a drag', 2); await finishSelection(); continue; }
    if (hand && pick() < 0.1) await hoverSweep('on my turn', 3);
    if (pick() < 0.06) await codexCheck('on my turn');
    if (await count('[data-act="buy-market"]') && pick() < 0.5) { await click('[data-act="buy-market"]', 0, 'Buy'); await finishSelection(); continue; }
    if (await count('.bag-slot.usable') && pick() < 0.5) { await click('.bag-slot.usable', 0, 'Bag'); await finishSelection(); continue; }
    if (await count('[data-act="pass"]')) { await click('[data-act="pass"]', 0, 'Pass'); continue; }
    if (attackers) { await click('[data-act="attacker"]', 0, 'attacker'); await finishSelection(); continue; }
    if (hand) { await click('[data-act="hand"]', 0, 'hand card'); await finishSelection(); continue; }
    throw new Error('stall: nothing to click on the player\'s turn');
  }
  const end = await page.evaluate(() => document.querySelector('[data-region="end"] .dialog-title')?.textContent);
  const beats = await page.evaluate(() => window.__match.beats());
  if (beats.started !== beats.done) throw new Error(`beats left unfinished: ${beats.started} started, ${beats.done} done`);
  log(`  ${w}×${h}: ${beats.done} beats played; the match ended (${end}) after ${clicks} real clicks; ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  // Play again leads to match setup, and Begin starts a new match.
  await click('[data-act="again"]', 0, 'Play again');
  await page.waitForSelector('[data-region="setup"] [data-act="begin"]', { timeout: 5000 }).catch(() => { throw new Error('Play again did not lead to match setup'); });
  await page.waitForTimeout(400);
  await click('[data-act="begin"]', 0, 'Begin');
  await page.waitForSelector('[data-region="mulligan"]', { timeout: 5000 }).catch(() => {});
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
// Animations on, at normal speed, at each size; then once in low motion.
const RUNS = [...SIZES.map((size) => ({ size, query: 'speed=normal&lowmotion=0', label: `${size[0]}×${size[1]}` })),
  { size: SIZES[1], query: 'speed=normal&lowmotion=1', label: `${SIZES[1][0]}×${SIZES[1][1]} low motion` },
  // (Stage H: the panels from the other seat, the one a guest plays online.)
  { size: SIZES[2], query: 'speed=normal&lowmotion=0&seat=p2', label: `${SIZES[2][0]}×${SIZES[2][1]} from Player 2's seat` }];
for (const run of RUNS) {
  try {
    await playOne(browser, `${base}?seed=${SEED}&pace=60&${run.query}`, run.size, console.log);
    console.log(`PASS  ${run.label}`);
  } catch (e) {
    failures += 1;
    console.log(`FAIL  ${run.label}: ${e.message}`);
  }
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
