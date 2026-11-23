// The Card Library real-input check (stage L): at 1920×1080, 1366×768 and 1280×720, by real clicks, drags, right-clicks
// and typing only, in a fresh browser each time:
//   - opens the Library from the title screen; filters, search and sort; a card's page and an affiliation link from it;
//   - builds a deck: New deck, cards added by click and by drag, removed by right-click and by dragging a row out, the
//     live rule checks; renames it; copies its code; imports it back; imports a damaged code (refused, saying why);
//     duplicates "The first deck"; deletes a deck (with its confirm); the decks are still there after a reload;
//   - match setup: chooses a saved deck for you and "The first deck" for the AI, Begins, and checks the match dealt each
//     player the chosen deck; the choices are remembered.
// Every click must change something on the page; any page error fails the check.
// Usage: node tools/libinput.mjs   (writes tools/screenshots/l-input-*.png)
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'tools', 'screenshots');
defineCards(CARDS);

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
let failures = 0;

async function run([w, h]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const steps = [];
  const sig = () => p.evaluate(() => `${document.body.dataset.screen}|${document.body.dataset.step}|${document.getElementById('stage').innerHTML.length}|${document.getElementById('stage').innerHTML.slice(0, 4000)}|${document.querySelector('#codex')?.hidden}|${document.querySelector('[data-region="lib-grid"]')?.innerHTML.length}`);
  // The middle of the element, scrolled into view, where it's on top (as a person would click it).
  async function point(sel, i = 0) {
    const loc = p.locator(sel).nth(i);
    await loc.scrollIntoViewIfNeeded();
    return p.evaluate(([s, k]) => {
      const el = document.querySelectorAll(s)[k];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.3], [0.7, 0.4], [0.5, 0.2], [0.5, 0.8]]) {
        const x = r.left + r.width * fx; const y = r.top + r.height * fy;
        const hit = document.elementFromPoint(x, y);
        if (hit && (hit === el || el.contains(hit))) return { x, y };
      }
      return null;
    }, [sel, i]);
  }
  async function click(sel, what, { i = 0, button = 'left' } = {}) {
    const pt = await point(sel, i);
    if (!pt) throw new Error(`${what}: nothing to click (${sel})`);
    const before = await sig();
    await p.mouse.click(pt.x, pt.y, { button });
    for (let k = 0; k < 60; k++) { if ((await sig()) !== before) { steps.push(what); return; } await p.waitForTimeout(25); }
    throw new Error(`${what}: the click had no effect`);
  }
  async function drag(fromSel, toPoint, what) {
    const a = await point(fromSel);
    if (!a) throw new Error(`${what}: nothing to drag (${fromSel})`);
    const before = await sig();
    await p.mouse.move(a.x, a.y); await p.mouse.down();
    await p.mouse.move(a.x + 30, a.y + 30, { steps: 4 });
    await p.mouse.move(toPoint.x, toPoint.y, { steps: 12 });
    await p.mouse.up();
    await p.waitForTimeout(80);
    if ((await sig()) === before) throw new Error(`${what}: the drag had no effect`);
    steps.push(what);
  }
  const text = (sel) => p.locator(sel).first().textContent();
  const expect = async (cond, why) => { if (!(await cond)) throw new Error(why); };
  const centre = async (sel) => { const b = await p.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

  try {
    await p.goto(`${base}?title=1`, { waitUntil: 'networkidle' });
    await p.waitForSelector('[data-act="library"]');
    await click('[data-act="library"]', 'Card Library (title)');
    await p.waitForSelector('[data-region="library"]');
    // Browsing.
    await click('[data-lib="chip"][data-g="type"][data-v="Monster"]', 'filter: Monster');
    await expect((await text('[data-region="lib-count"]')).startsWith('5 of 29'), `Monster filter: ${await text('[data-region="lib-count"]')}`);
    await click('[data-lib="cost-mode"][data-v="level"]', 'cost by Level');
    await click('[data-lib="chip"][data-g="level"][data-v="8"]', 'Level 8');
    await expect((await text('[data-region="lib-count"]')).startsWith('3 of 29'), `Monsters reaching Level 8: ${await text('[data-region="lib-count"]')}`);
    await click('[data-lib="clear-all"]', 'clear all filters');
    await p.locator('.lib-search').click();
    await p.keyboard.type('wyrm');
    await expect((await text('[data-region="lib-count"]')).startsWith('1 of 29'), 'search "wyrm"');
    for (let k = 0; k < 4; k++) await p.keyboard.press('Backspace');
    await click('[data-lib="sort"][data-v="cost"]', 'sort by cost');
    await click('[data-lib="filters"]', 'close the filters');
    await click('[data-lib="filters"]', 'open the filters');
    // A page, by right-click; an affiliation link from it.
    await click('[data-lib-card="call-to-arms"] .lib-card', 'right-click: Call to Arms\'s page', { button: 'right' });
    await p.waitForSelector('#codex:not([hidden]) .cx-aff');
    await click('#codex .cx-aff', 'its "a Fighter" link');
    await expect((await text('[data-region="lib-count"]')).startsWith('3 of 29'), 'the Fighter filter from the link');
    await click('[data-lib="clear-all"]', 'clear all filters');
    // Building a deck.
    await click('[data-lib="new"]', 'New deck');
    for (let k = 0; k < 3; k++) await click('[data-lib-card="firebolt"] .lib-card', `add Firebolt (${k + 1})`);
    await expect(/Firebolt: 3 copies, the most is 2/.test(await text('[data-region="deck-issues"]')), 'the rule check names the third Firebolt');
    await click('[data-lib-card="firebolt"] .lib-card', 'right-click: remove a Firebolt', { button: 'right' });
    await drag('[data-lib-card="parry"] .lib-card', await centre('[data-region="lib-deck"]'), 'drag Parry into the deck');
    await expect((await text('[data-lib-card="parry"] .lib-copies')).includes('1'), 'Parry added by drag');
    const gridMid = await centre('[data-region="lib-grid"]');
    await drag('[data-lib-row="parry"] .ld-cn', gridMid, 'drag Parry\'s row out of the deck');
    await expect((await p.locator('[data-lib-row="parry"]').count()) === 0, 'Parry removed by drag');
    await click('[data-lib="plus"][data-id="firebolt"]', '+ on a row');
    await click('[data-lib="minus"][data-id="firebolt"]', '− on a row');
    await expect((await text('[data-region="deck-count"]')).startsWith('2'), `deck count ${await text('[data-region="deck-count"]')}`);
    await click('.ld-foot [data-lib="rename"]', 'Rename');
    await p.fill('.ld-dialog input', 'Bolts');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => document.querySelector('.ld-name')?.textContent === 'Bolts');
    steps.push('rename by typing');
    await click('.ld-foot [data-lib="code"]', 'Copy deck code');
    const code = await p.inputValue('.ld-code textarea');
    await expect(/^UTCG2\.[A-Za-z0-9_-]+$/.test(code) && code.length < 100, 'a compact deck code');
    await click('.ld-code [data-lib="cancel"]', 'Done');
    await click('[data-lib="close-deck"]', 'back to your decks');
    await click('[data-lib="import"]', 'Import deck code');
    await p.fill('.ld-import textarea', code.slice(0, -1) + (code.endsWith('a') ? 'b' : 'a'));
    await click('.ld-import [type="submit"]', 'Import a damaged code');
    await expect(/damaged/.test(await text('.ld-error')), 'the damaged code is refused, saying why');
    await p.fill('.ld-import textarea', code);
    await click('.ld-import [type="submit"]', 'Import the code');
    await expect((await text('.ld-name')) === 'Bolts (2)', 'imported as a new deck');
    await click('[data-lib="close-deck"]', 'back to your decks');
    await click('.ld-row.built-in [data-lib="duplicate"]', 'Duplicate "The first deck"');
    await expect(/A legal deck/.test(await text('[data-region="deck-issues"]')), 'the copy is legal');
    await click('.ld-foot [data-lib="rename"]', 'Rename the copy');
    await p.fill('.ld-dialog input', 'My First Copy');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => document.querySelector('.ld-name')?.textContent === 'My First Copy');
    await click('[data-lib="close-deck"]', 'back to your decks');
    const bolts2 = await p.evaluate(() => [...document.querySelectorAll('.ld-row')].findIndex((r) => r.querySelector('b')?.textContent === 'Bolts (2)'));
    await click('.ld-row [data-lib="delete"]', 'Delete', { i: bolts2 - 1 });
    await click('[data-lib="delete-yes"]', 'confirm Delete');
    const names = await p.$$eval('.ld-open b', (els) => els.map((e) => e.textContent));
    await expect(JSON.stringify(names) === JSON.stringify(['The first deck', 'Bolts', 'My First Copy']), `the decks: ${names.join(' | ')}`);
    await p.screenshot({ path: join(shots, `l-input-decks-${w}x${h}.png`) });
    // Still there after a reload; back to the title by Esc.
    await p.reload({ waitUntil: 'networkidle' });
    await click('[data-act="library"]', 'Card Library again');
    const after = await p.$$eval('.ld-open b', (els) => els.map((e) => e.textContent));
    await expect(JSON.stringify(after) === JSON.stringify(names), 'the decks are kept in the browser');
    await p.keyboard.press('Escape');
    await p.waitForFunction(() => document.body.dataset.screen === 'title');
    steps.push('Esc back to the title');
    // Match setup: your deck and the AI's, chosen by clicks; then the match deals them.
    await click('[data-act="play"]', 'Play');
    await p.waitForSelector('[data-region="setup"]');
    await click('[data-act="deck-menu"][data-side="p1"]', 'Choose your deck');
    const mine = await p.evaluate(() => [...document.querySelectorAll('[data-act="pick-deck"][data-side="p1"]')].findIndex((b) => b.textContent.includes('My First Copy')));
    await expect(mine >= 0, 'your legal deck is offered');
    await expect(!(await p.evaluate(() => [...document.querySelectorAll('[data-act="pick-deck"]')].some((b) => b.textContent.includes('Bolts')))), 'an unfinished deck is not offered');
    await click('[data-act="pick-deck"][data-side="p1"]', 'pick My First Copy', { i: mine });
    await expect((await text('[data-region="deck-you"]')).includes('My First Copy'), 'your side shows the deck');
    await click('[data-act="library"]', 'Card Library (setup)');
    await expect((await text('[data-lib="back"]')).includes('Match setup'), 'Back goes to match setup');
    await click('[data-lib="back"]', 'back to match setup');
    await expect((await text('[data-region="deck-you"]')).includes('My First Copy'), 'the choice is remembered');
    await click('[data-act="begin"]', 'Begin');
    await p.waitForFunction(() => window.__match?.state()?.players);
    const dealt = await p.evaluate(() => { const s = window.__match.state(); return ['p1', 'p2'].map((w) => [...s.players[w].hand, ...s.players[w].drawPile].map((c) => c.id).sort()); });
    const first = [...FIRST_DECK].sort();
    await expect(JSON.stringify(dealt[0]) === JSON.stringify(first) && JSON.stringify(dealt[1]) === JSON.stringify(first), 'the match dealt both chosen decks');
    steps.push('the match dealt the chosen decks');
    if (errors.length) throw new Error(errors.join('; '));
    console.log(`PASS  ${w}×${h}: ${steps.length} real inputs, each changed the page (${steps.slice(0, 6).join(', ')}, …)`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL  ${w}×${h}: ${err.message}${errors.length ? ` (${errors.join('; ')})` : ''}`);
    await p.screenshot({ path: join(shots, `l-input-fail-${w}x${h}.png`) }).catch(() => {});
  }
  await ctx.close();
}

for (const size of [[1920, 1080], [1366, 768], [1280, 720]]) await run(size);
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
