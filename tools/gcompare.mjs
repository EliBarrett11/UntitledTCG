// Side by side (stage G): each approved mockup in docs/mockups/feedback-v2/ next to the game at the same moment.
// Saved to tools/screenshots/:
//   g-compare-cards.png  ← m9-cards.png: one card of each type (?sheet=g-types), the mockup above the game
//   g-compare-board.png  ← m9-board.png (and m9-before.png): ?seed=10&scene=mid, the Energy panel and Gold in the Market
//   g-compare-codex.png  ← m9-codex.png: ?seed=10&scene=mid, the Codex opened by right-clicking Spire Magus in hand
//   g-market-afford.png, g-market-short.png: the Market's Buy button when you can afford the Item (seed 10) and can't (seed 6)
//   g-codex-<type>.png: the Codex for each card type (a creature in hand, a board token, an Action, an Event, an Item,
//   a Location, the Campaign, and something hidden: the enemy's hand)
//
// Usage: node tools/gcompare.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = join(root, 'tools', 'screenshots');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];

async function open(query, viewport = { width: 1920, height: 1080 }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(`${query}: ${e.message}`));
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  return page;
}
async function rightClick(page, sel, i = 0) {
  const pt = await page.evaluate(([s, k]) => {
    const el = document.querySelectorAll(s)[k];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[0.5, 0.3], [0.3, 0.2], [0.5, 0.6]]) {
      const x = r.left + r.width * fx; const y = r.top + r.height * fy;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit))) return { x, y };
    }
    return null;
  }, [sel, i]);
  if (!pt) return false;
  await page.mouse.click(pt.x, pt.y, { button: 'right' });
  await page.mouse.move(5, 540);
  await page.waitForTimeout(400);
  return true;
}
const handIndex = (page, type) => page.evaluate((t) => [...document.querySelectorAll('.hand-card')].findIndex((el) => window.__match.state().players.p1.hand.find((c) => c.uid === el.dataset.uid)?.cardType === t), type);

async function sideBySide(name, panels, { width = 960, height = 540, stack = false } = {}) {
  const page = await browser.newPage({ viewport: { width: stack ? width + 20 : panels.length * (width + 20) + 20, height: 400 }, deviceScaleFactor: 1 });
  const parts = panels.map((x) => `<div><div style="padding:10px 6px;font-size:18px;letter-spacing:3px">${x.label}</div><img src="data:image/png;base64,${x.png.toString('base64')}" style="display:block;width:${width}px;height:${height}px;object-fit:contain;object-position:top left"></div>`).join('');
  await page.setContent(`<body style="margin:0;background:#080605;font-family:Georgia,serif;color:#c9b07a;display:inline-flex;${stack ? 'flex-direction:column;' : ''}gap:${stack ? 6 : 20}px;padding:0 10px 10px">${parts}</body>`);
  await page.waitForTimeout(200);
  await (await page.$('body')).screenshot({ path: join(shots, `g-compare-${name}.png`) });
  await page.close();
  console.log(`Saved g-compare-${name}.png`);
}
const mock = (f) => readFile(join(root, 'docs', 'mockups', 'feedback-v2', f));

// 1–4: one card of each type.
{
  const page = await open('?sheet=g-types', { width: 2280, height: 640 });
  const game = await (await page.$('#cmp')).screenshot();
  await sideBySide('cards', [{ label: 'THE APPROVED MOCKUP · m9-cards.png', png: await mock('m9-cards.png') }, { label: 'THE GAME · ?sheet=g-types', png: game }], { width: 1710, height: 480, stack: true });
  await page.close();
}
// 5–6: the board (the Energy panel, your Gold in the Market).
{
  const page = await open('?seed=10&scene=mid&pace=100000&lowmotion=1');
  const game = await page.screenshot();
  await sideBySide('board', [{ label: 'BEFORE · m9-before.png', png: await mock('m9-before.png') }, { label: 'THE APPROVED MOCKUP · m9-board.png', png: await mock('m9-board.png') }, { label: 'THE GAME · ?seed=10&scene=mid', png: game }], { width: 640, height: 360 });
  await page.screenshot({ path: join(shots, 'g-market-afford.png'), clip: { x: 1290, y: 300, width: 630, height: 520 } });
  await page.close();
  const short = await open('?seed=6&scene=mid&pace=100000&lowmotion=1');
  await short.screenshot({ path: join(shots, 'g-market-short.png'), clip: { x: 1290, y: 300, width: 630, height: 520 } });
  await short.close();
  console.log('Saved g-market-afford.png and g-market-short.png');
}
// 8: the Codex.
{
  const page = await open('?seed=10&scene=mid&pace=100000&lowmotion=1');
  await rightClick(page, '.hand-card', await page.evaluate(() => [...document.querySelectorAll('.hand-card')].findIndex((el) => /Spire Magus/.test(el.textContent))));
  const game = await page.screenshot();
  await sideBySide('codex', [{ label: 'THE APPROVED MOCKUP · m9-codex.png', png: await mock('m9-codex.png') }, { label: 'THE GAME · right-click Spire Magus in hand', png: game }]);
  await page.close();
}
// The Codex for each card type.
const TYPES = [
  ['creature', 10, async (p) => rightClick(p, '.hand-card', await handIndex(p, 'Character'))],
  ['token', 2, (p) => rightClick(p, '[data-hover="board"][data-who="p1"]', 2)],
  ['action', 2, async (p) => rightClick(p, '.hand-card', await handIndex(p, 'Action'))],
  ['event', 10, async (p) => rightClick(p, '.hand-card', await handIndex(p, 'Event'))],
  ['item', 2, (p) => rightClick(p, '.market-card')],
  ['location', 2, (p) => rightClick(p, '.loc-label')],
  ['campaign', 2, (p) => rightClick(p, '[data-region="quest-p1"]')],
  ['hidden', 2, (p) => rightClick(p, '[data-region="enemy-hand"]')],
];
for (const [name, seed, go] of TYPES) {
  const page = await open(`?seed=${seed}&scene=mid&pace=100000&lowmotion=1`);
  const ok = await go(page);
  if (!ok || !(await page.$('#codex:not([hidden])'))) errors.push(`the Codex did not open for ${name}`);
  await page.screenshot({ path: join(shots, `g-codex-${name}.png`) });
  await page.close();
  console.log(`Saved g-codex-${name}.png`);
}

await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
