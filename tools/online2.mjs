// The two-browser check (stage M): two browser windows play a friend online through a local PeerServer, with real
// mouse clicks only. The host chooses Play a friend and copies its invite link; the guest opens it; the host presses
// Begin; both play the match to the end by clicking what's highlighted (as tools/realinput.mjs does against the
// AI). Mid-match the guest refreshes (it rejoins by itself) and later the host refreshes (it resumes from the title
// screen). At the end both ask for a rematch, the new match starts, and the guest leaves. It fails on any page
// error, any stall, or a broken step. Screenshots of both sides at the same moments go to tools/screenshots/.
//
// Usage: node tools/online2.mjs [peerserver=127.0.0.1:9000] [seed=7]
// Needs Playwright with Chromium and a PeerServer on that address (dev tools only, never runtime dependencies):
//   npx peer --port 9000            (or any PeerServer listening on 127.0.0.1:9000 at path /)
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer, withDev } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'tools', 'screenshots');
const PEER = process.argv[2] ?? '127.0.0.1:9000';
const SEED = Number(process.argv[3] ?? 7);
const SIZE = { width: 1366, height: 768 };

// Stage L: the guest builds its deck in the Card Library from a code: an unusual legal deck (no Locations, no Campaign).
const { defineCards } = await import('../src/engine/cards.js');
const { CARDS } = await import('../src/data/cards.js');
const { encodeDeck, idsToList } = await import('../src/engine/decks.js');
defineCards(CARDS);
const GUEST_DECK_NAME = 'Guest Without Maps';
const GUEST_IDS = CARDS.filter((d) => !['Location', 'Campaign'].includes(d.cardType) && !d.legendaryOf).flatMap((d) => (d.series === 'Legendary' ? [d.id] : [d.id, d.id])).slice(0, 40);
const GUEST_CODE = encodeDeck({ name: GUEST_DECK_NAME, cards: idsToList(GUEST_IDS) });

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
await mkdir(shots, { recursive: true });
const errors = [];
const t0 = Date.now();
const say = (line) => console.log(`[${String(Math.round((Date.now() - t0) / 1000)).padStart(4)} s] ${line}`);

function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const pick = rng(SEED * 101);

async function player(name, seat) {
  const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: console: ${m.text()}`); });
  return { name, seat, page, clicks: 0, counts: {} };
}
const host = await player('host', 'p1');
const guest = await player('guest', 'p2');

// A point inside the element that is really on top.
const pointOf = (page, selector, index = 0) => page.evaluate(([sel, i]) => {
  const el = document.querySelectorAll(sel)[i];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.25], [0.15, 0.5], [0.5, 0.2], [0.3, 0.12], [0.12, 0.85], [0.8, 0.5], [0.5, 0.85]]) {
    const x = r.left + r.width * fx; const y = r.top + r.height * fy;
    const hit = document.elementFromPoint(x, y);
    if (hit && (hit === el || el.contains(hit))) return { x, y };
  }
  return null;
}, [selector, index]);
const count = (p, sel) => p.page.evaluate((s) => document.querySelectorAll(s).length, sel);
const state = (p) => p.page.evaluate(() => ({ ...document.body.dataset, mull: !!document.querySelector('[data-region="mulligan"]'), end: !!document.querySelector('[data-region="end"]') }));
const sig = (p) => p.page.evaluate(() => { const b = document.body.dataset; return `${b.screen}|${b.version}|${b.step}|${b.phase}|${b.react}|${document.querySelectorAll('.menu').length}|${document.querySelectorAll('.react-opt.selected').length}|${document.querySelector('[data-region="prompt"]')?.textContent ?? ''}`; });

// One real click; waits (up to 6 s: the answer comes from the host) for something to change. Returns whether it did.
async function click(p, selector, index = 0, what = selector) {
  const pt = await pointOf(p.page, selector, index);
  if (!pt) return false;
  const before = await sig(p);
  await p.page.mouse.click(pt.x, pt.y);
  p.clicks += 1;
  p.counts[what] = (p.counts[what] ?? 0) + 1;
  for (let i = 0; i < 120; i++) { if ((await sig(p)) !== before) return true; await p.page.waitForTimeout(50); }
  return false;
}

async function finishSelection(p) {
  for (let i = 0; i < 12; i++) {
    const st = await state(p);
    if (!st.step?.startsWith('sel') && st.step !== 'menu') return;
    if (st.step === 'menu') {
      const n = await count(p, '.menu-item:not(.cancel)');
      const items = await p.page.evaluate(() => [...document.querySelectorAll('.menu-item:not(.cancel)')].map((b) => b.textContent));
      let choice = items.findIndex((t) => !/^Retain/.test(t));
      if (choice < 0 || pick() < 0.12) choice = Math.floor(pick() * n);
      await click(p, '.menu-item:not(.cancel)', choice, 'menu option');
      continue;
    }
    const n = await count(p, '[data-pick]');
    if (!n) { await p.page.keyboard.press('Escape'); return; }
    let ok = false;
    for (let j = 0; j < n && !ok; j++) ok = await click(p, '[data-pick]', (Math.floor(pick() * n) + j) % n, 'target');
    if (!ok) { await p.page.keyboard.press('Escape'); return; }
  }
}

// If it's this player's move: one move by real clicks. Returns true if it acted.
async function move(p) {
  const st = await state(p);
  if (st.screen !== 'match' || st.presenting === '1' || st.actor !== p.seat) return false;
  if (st.mull) {
    if (pick() < 0.5) { await click(p, '.mull-card', 0, 'mulligan card'); await click(p, '[data-act="mull-go"]', 0, 'mulligan'); } else await click(p, '[data-act="mull-keep"]', 0, 'keep');
    return true;
  }
  if (st.react === p.seat) {
    const opts = await count(p, '.react-opt');
    if (opts && pick() < 0.6) { await click(p, '.react-opt', Math.floor(pick() * opts), 'React'); await finishSelection(p); } else await click(p, '[data-act="decline"]', 0, 'Let it happen');
    return true;
  }
  if (st.step?.startsWith('sel') || st.step === 'menu') { await finishSelection(p); return true; }
  const attackers = await count(p, '[data-act="attacker"]');
  const hand = await count(p, '[data-act="hand"]');
  const r = pick();
  if (attackers && (r < 0.6 || !hand)) { await click(p, '[data-act="attacker"]', Math.floor(pick() * attackers), 'attacker'); await finishSelection(p); return true; }
  if (hand && r < 0.8) { await click(p, '[data-act="hand"]', Math.floor(pick() * hand), 'hand card'); await finishSelection(p); return true; }
  if (await count(p, '[data-act="buy-market"]') && pick() < 0.5) { await click(p, '[data-act="buy-market"]', 0, 'Buy'); await finishSelection(p); return true; }
  if (await count(p, '.bag-slot.usable') && pick() < 0.5) { await click(p, '.bag-slot.usable', 0, 'Bag'); await finishSelection(p); return true; }
  if (await count(p, '[data-act="pass"]')) { await click(p, '[data-act="pass"]', 0, 'Pass'); return true; }
  if (attackers) { await click(p, '[data-act="attacker"]', 0, 'attacker'); await finishSelection(p); return true; }
  if (hand) { await click(p, '[data-act="hand"]', 0, 'hand card'); await finishSelection(p); return true; }
  return false;
}

// Both screens at the same moment, side by side, for the report.
async function bothShots(name) {
  const [a, b] = await Promise.all([host.page.screenshot(), guest.page.screenshot()]);
  const page = await browser.newPage({ viewport: { width: 1406, height: 420 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:#080605;font-family:Georgia,serif;color:#c9b07a;display:inline-flex;gap:14px;padding:0 10px 10px">
    <div><div style="padding:8px 4px;font-size:16px;letter-spacing:3px">THE HOST (PLAYER 1)</div><img src="data:image/png;base64,${a.toString('base64')}" style="display:block;width:683px;height:384px"></div>
    <div><div style="padding:8px 4px;font-size:16px;letter-spacing:3px">THE GUEST (PLAYER 2)</div><img src="data:image/png;base64,${b.toString('base64')}" style="display:block;width:683px;height:384px"></div></body>`);
  await (await page.$('body')).screenshot({ path: join(shots, `m-${name}.png`) });
  await page.close();
  say(`saved m-${name}.png`);
}
const waitFor = (p, fn, arg, ms = 30000) => p.page.waitForFunction(fn, arg, { timeout: ms });
// V5: what each screen reads, to compare the two seats: the turn plaque, both Energy displays, every dominance line,
// and any announcement showing.
const reads = (p) => p.page.evaluate(() => ({
  presenting: document.body.dataset.presenting, version: document.body.dataset.version,
  whose: document.querySelector('[data-region="turn-plaque"]')?.dataset.whose ?? null,
  mine: Number(document.querySelector('.my-energy .en-num')?.dataset.energy), theirs: Number(document.querySelector('.foe-energy .en-num')?.dataset.energy),
  dom: Object.fromEntries([...document.querySelectorAll('.dom-line[data-dom]')].map((el) => [el.dataset.dom, [Number(el.dataset.them), Number(el.dataset.you)]])),
  announce: document.querySelector('[data-region="announce"]')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
}));
const v5 = { compared: 0, announceHost: new Set(), announceGuest: new Set() };
async function compareSeats() {
  const [a, b] = await Promise.all([reads(host), reads(guest)]);
  if (a.announce) v5.announceHost.add(a.announce);
  if (b.announce) v5.announceGuest.add(b.announce);
  if (a.presenting === '1' || b.presenting === '1') return;
  const hv = await host.page.evaluate(() => window.__match.state().players.p2 ? { v: document.body.dataset.version } : null);
  if (!hv) return;
  // (Only at the same moment: both screens idle on the same update.)
  const same = await Promise.all([host.page.evaluate(() => JSON.stringify(window.__match.state().log.length)), guest.page.evaluate(() => JSON.stringify(window.__match.state().log.length))]);
  if (same[0] !== same[1]) return;
  if (a.whose && b.whose && a.whose !== 'none' && !((a.whose === 'you' && b.whose === 'them') || (a.whose === 'them' && b.whose === 'you'))) throw new Error(`the turn plaques disagree: host ${a.whose}, guest ${b.whose}`);
  if (a.mine !== b.theirs || a.theirs !== b.mine) throw new Error(`the Energy displays disagree: host ${a.mine}/${a.theirs}, guest ${b.mine}/${b.theirs}`);
  for (const [k, [t, y]] of Object.entries(a.dom)) {
    const g = b.dom[k];
    if (!g) throw new Error(`the guest has no dominance line for ${k}`);
    if (g[0] !== y || g[1] !== t) throw new Error(`the dominance line ${k} disagrees: host ${t}-${y}, guest ${g[0]}-${g[1]}`);
  }
  v5.compared += 1;
}
const hostState = () => host.page.evaluate(() => { const s = window.__match?.state(); return s ? { round: s.round, phase: s.phase, winner: s.winner } : null; });

let failed = null;
try {
  // --- The lobby ---
  await host.page.goto(withDev(`${base}?peerserver=${PEER}&speed=fast&lowmotion=1`), { waitUntil: 'networkidle' });
  await waitFor(host, () => document.querySelector('[data-act="friend"]'));
  await host.page.screenshot({ path: join(shots, 'm-title.png') });
  await click(host, '[data-act="friend"]', 0, 'Play a friend');
  await waitFor(host, () => document.querySelector('[data-region="room-code"]')?.textContent.length === 5);
  const code = await host.page.textContent('[data-region="room-code"]');
  const link = (await host.page.inputValue('.lobby-link')).replace(/^https?:\/\/[^/]+\//, base);
  say(`the host's room code: ${code}`);
  await host.page.screenshot({ path: join(shots, 'm-lobby-host.png') });
  // The guest opens the game, chooses Play a friend, and types the code into the join form (the invite link is
  // used for its refresh later).
  await guest.page.goto(withDev(`${base}?peerserver=${PEER}&speed=fast&lowmotion=1`), { waitUntil: 'networkidle' });
  await waitFor(guest, () => document.querySelector('[data-act="friend"]'));
  await click(guest, '[data-act="friend"]', 0, 'Play a friend');
  await waitFor(guest, () => document.querySelector('[data-region="join-form"] input'));
  await guest.page.click('[data-region="join-form"] input');
  await guest.page.keyboard.type(code.toLowerCase());
  await guest.page.screenshot({ path: join(shots, 'm-lobby-join.png') });
  await guest.page.keyboard.press('Enter');
  await waitFor(host, () => document.querySelector('[data-region="setup"]'));
  await waitFor(guest, () => document.querySelector('[data-region="setup"]'));
  await host.page.waitForTimeout(600);
  await bothShots('setup');
  // Stage L: the guest opens the Card Library from match setup, imports its deck code, comes back and chooses that
  // deck. The host sees only its name and card count; the host's real game then deals the guest exactly that deck.
  await click(guest, '[data-act="library"]', 0, 'Card Library');
  await waitFor(guest, () => document.querySelector('[data-region="library"]'));
  await click(guest, '[data-lib="import"]', 0, 'Import deck code');
  await guest.page.fill('.ld-import textarea', GUEST_CODE);
  await click(guest, '.ld-import [type="submit"]', 0, 'Import');
  await waitFor(guest, (n) => document.querySelector('.ld-name')?.textContent === n, GUEST_DECK_NAME);
  await click(guest, '[data-lib="back"]', 0, 'Back to setup');
  await waitFor(guest, () => document.querySelector('[data-region="setup"]'));
  await click(guest, '[data-act="deck-menu"]', 0, 'Choose your deck');
  const opt = await guest.page.evaluate((n) => [...document.querySelectorAll('[data-act="pick-deck"]')].findIndex((b) => b.textContent.includes(n)), GUEST_DECK_NAME);
  if (opt < 0) throw new Error('the imported deck isn\'t offered on match setup');
  await click(guest, '[data-act="pick-deck"]', opt, 'pick the deck');
  await waitFor(host, (n) => document.querySelector('[data-region="deck-them"]')?.textContent.includes(n), GUEST_DECK_NAME);
  const hostSees = await host.page.textContent('[data-region="deck-them"]');
  if (!/40 cards/.test(hostSees)) throw new Error(`the host sees the friend's deck as "${hostSees}"`);
  say(`the guest chose "${GUEST_DECK_NAME}" in the Card Library; the host sees: ${hostSees.trim()}`);
  await host.page.waitForTimeout(300);
  await bothShots('setup-decks');
  await click(host, '[data-act="begin"]', 0, 'Begin');
  await waitFor(host, () => document.body.dataset.screen === 'match');
  await waitFor(guest, () => document.body.dataset.screen === 'match');
  say('the match began on both screens');
  {
    const dealt = await host.page.evaluate(() => { const p = window.__match.state().players.p2; return [...p.hand, ...p.drawPile].map((c) => c.id).sort(); });
    if (JSON.stringify(dealt) !== JSON.stringify([...GUEST_IDS].sort())) throw new Error('the guest was not dealt its chosen deck');
    say('the host\'s game dealt the guest its chosen deck (40 cards, no Locations, no Campaign)');
  }
  // From here the guest's page is reloaded from its invite link (as reopening it would).
  const guestUrl = `${link}&speed=fast&lowmotion=1`;

  // --- The match ---
  let lastProgress = Date.now();
  let lastKey = '';
  let guestRefreshed = false;
  let hostRefreshed = false;
  const shotsAt = new Set();
  for (;;) {
    if (errors.length) throw new Error(errors.join('; '));
    const hs = await hostState();
    const key = JSON.stringify(hs) + (await host.page.evaluate(() => document.body.dataset.version));
    if (key !== lastKey) { lastKey = key; lastProgress = Date.now(); }
    if (Date.now() - lastProgress > 90000) throw new Error(`stall: nothing happened for 90 s (host: ${JSON.stringify(hs)}; guest: ${JSON.stringify(await state(guest))})`);
    if (Date.now() - t0 > 40 * 60 * 1000) throw new Error('stall: the match took over 40 minutes');
    if (hs?.phase === 'gameOver') break;
    // Screenshots of both sides at the same moments.
    const gs = await state(guest);
    if (hs?.round === 2 && gs.react === 'p2' && gs.presenting !== '1' && !shotsAt.has('react')) { shotsAt.add('react'); await bothShots('react-guest'); }
    if (hs?.round === 3 && !shotsAt.has('r3')) {
      const hst = await state(host);
      if (hst.presenting !== '1' && gs.presenting !== '1' && hst.actor === 'p1' && !hst.react) { shotsAt.add('r3'); await bothShots('round3'); }
    }
    // The guest refreshes mid-match (Round 3): its page reloads from the invite link and rejoins by itself.
    if (!guestRefreshed && hs?.round >= 3 && shotsAt.has('r3')) {
      guestRefreshed = true;
      say('the guest refreshes');
      await guest.page.goto(withDev(guestUrl), { waitUntil: 'networkidle' });
      await waitFor(guest, () => document.body.dataset.screen === 'match', null, 45000);
      await host.page.waitForFunction(() => !document.querySelector('[data-region="net-banner"]'), null, { timeout: 30000 });
      say('the guest rejoined and the host sees it back');
      await bothShots('guest-back');
      continue;
    }
    // The host refreshes later (Round 5): the title screen offers to resume, and the guest reconnects by itself.
    if (!hostRefreshed && hs?.round >= 5) {
      hostRefreshed = true;
      say('the host refreshes');
      await host.page.goto(withDev(`${base}?peerserver=${PEER}&speed=fast&lowmotion=1`), { waitUntil: 'networkidle' });
      await waitFor(host, () => document.querySelector('[data-act="net-resume"]'), null, 20000);
      await host.page.screenshot({ path: join(shots, 'm-resume.png') });
      await click(host, '[data-act="net-resume"]', 0, 'Resume');
      await waitFor(host, () => document.body.dataset.screen === 'match');
      await waitFor(guest, () => !document.querySelector('[data-region="net-banner"]'), null, 60000);
      await host.page.waitForFunction(() => !document.querySelector('[data-region="net-banner"]'), null, { timeout: 60000 });
      say('the host resumed, and the guest reconnected');
      await bothShots('host-back');
      continue;
    }
    await compareSeats();
    const acted = (await move(host)) || (await move(guest));
    if (!acted) await host.page.waitForTimeout(120);
  }
  const hs = await hostState();
  await waitFor(host, () => document.querySelector('[data-region="end"]'), null, 60000);
  await waitFor(guest, () => document.querySelector('[data-region="end"]'), null, 60000);
  say(`the match ended in Round ${hs.round}: ${hs.winner ?? 'a draw'} won; host ${host.clicks} clicks, guest ${guest.clicks} clicks`);
  await bothShots('end');

  // --- Rematch: both must accept, then match setup and a new match ---
  await click(guest, '[data-act="net-rematch"]', 0, 'Rematch');
  await waitFor(host, () => /Accept rematch/.test(document.querySelector('[data-act="net-rematch"]')?.textContent ?? ''));
  await bothShots('rematch-asked');
  await click(host, '[data-act="net-rematch"]', 0, 'Accept rematch');
  await waitFor(host, () => document.querySelector('[data-region="setup"]'));
  await waitFor(guest, () => document.querySelector('[data-region="setup"]'));
  await click(host, '[data-act="begin"]', 0, 'Begin');
  await waitFor(guest, () => document.body.dataset.screen === 'match' && window.__match.state()?.round === 1);
  say('the rematch began on both screens');

  // --- Leave match ---
  guest.page.once('dialog', (d) => d.accept());
  await guest.page.evaluate(() => document.querySelector('[data-act="settings"]')?.click());
  await guest.page.waitForTimeout(300);
  await click(guest, '[data-act="net-leave"]', 0, 'Leave match');
  await waitFor(guest, () => document.querySelector('[data-region="title"]'));
  await waitFor(host, () => /Your friend left the match/.test(document.querySelector('.title-notice')?.textContent ?? ''));
  await bothShots('left');
  say('the guest left; the host was told');
  if (errors.length) throw new Error(errors.join('; '));
  for (const p of [host, guest]) say(`${p.name}: ${Object.entries(p.counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  // V5: the two seats read alike, and each side's announcements of the other's actions name "your friend".
  if (v5.compared < 20) throw new Error(`the two seats were compared only ${v5.compared} times`);
  for (const [who, set] of [['host', v5.announceHost], ['guest', v5.announceGuest]]) {
    if (!set.size) throw new Error(`the ${who} saw no announcement of their friend's actions`);
    const wrong = [...set].find((t) => !/^YOUR FRIEND /.test(t));
    if (wrong) throw new Error(`an announcement on the ${who}'s screen doesn't name "your friend": ${wrong}`);
  }
  say(`V5: the seats agreed ${v5.compared} times (turn plaques, Energy, dominance lines); announcements: host ${v5.announceHost.size}, guest ${v5.announceGuest.size}`);
} catch (e) {
  failed = e;
  await host.page.screenshot({ path: join(shots, 'm-fail-host.png') }).catch(() => {});
  await guest.page.screenshot({ path: join(shots, 'm-fail-guest.png') }).catch(() => {});
}
await browser.close();
server.close();
if (failed) { console.log(`FAIL  ${failed.message}`); process.exit(1); }
console.log('PASS  two browsers played a friend online: lobby, a whole match by real clicks with a refresh on each side, rematch and leave');
