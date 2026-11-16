// Side by side (stage F): each approved feedback mockup (docs/mockups/feedback-v1/) next to the game at the same
// moment, both at 1920 × 1080, shown at half size. Saved to tools/screenshots/f-compare-<name>.png, with the game's
// own screenshots beside them (f-hand.png: the hand with Prime cards; f-react-*.png: each kind of React moment).
//   cards ← m1-hover.png: ?seed=10&scene=mid, hovering a creature in hand at its Prime (the Level well, the tab, the
//           series line)
//   react ← m5-react.png: ?seed=7&scene=react-attack, hovering the first React plate
//
// Usage: node tools/fcompare.mjs
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

async function open(query) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  return page;
}
async function hover(page, sel) {
  const el = await page.$(sel);
  if (!el) return false;
  const b = await el.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + Math.min(60, b.height / 2), { steps: 4 });
  await page.waitForTimeout(500);
  return true;
}
async function sideBySide(name, mock, game, label) {
  const page = await browser.newPage({ viewport: { width: 1980, height: 620 }, deviceScaleFactor: 1 });
  const m = (await readFile(join(root, 'docs', 'mockups', 'feedback-v1', mock))).toString('base64');
  await page.setContent(`<body style="margin:0;background:#080605;font-family:Georgia,serif;color:#c9b07a;display:inline-flex;gap:20px;padding:0 10px 10px">
    <div><div style="padding:10px 6px;font-size:18px;letter-spacing:3px">THE APPROVED MOCKUP · docs/mockups/feedback-v1/${mock}</div><img src="data:image/png;base64,${m}" style="display:block;width:960px;height:540px;object-fit:contain;object-position:top left"></div>
    <div><div style="padding:10px 6px;font-size:18px;letter-spacing:3px">THE GAME · ${label}</div><img src="data:image/png;base64,${game.toString('base64')}" style="display:block;width:960px;height:540px"></div></body>`);
  await page.waitForTimeout(200);
  await (await page.$('body')).screenshot({ path: join(shots, `f-compare-${name}.png`) });
  await page.close();
  console.log(`Saved f-compare-${name}.png`);
}

// 1–3: the Level well, the Prime tab in hand, the series line.
{
  const page = await open('?seed=10&scene=mid&pace=100000');
  await page.screenshot({ path: join(shots, 'f-hand.png'), clip: { x: 300, y: 740, width: 920, height: 340 } });
  await hover(page, '.hand-card.at-prime') || await hover(page, '.hand-card');
  const game = await page.screenshot();
  await sideBySide('cards', 'm1-hover.png', game, '?seed=10&scene=mid, hovering a card at its Prime');
  await page.close();
  console.log('Saved f-hand.png');
}
// 5: a React moment (the enemy attacks), with the first plate hovered.
{
  const page = await open('?seed=7&scene=react-attack&pace=100000&timer=off');
  await hover(page, '.rx-plate[data-i="0"]');
  const game = await page.screenshot();
  await sideBySide('react', 'm5-react.png', game, '?seed=7&scene=react-attack, the first plate hovered');
  await page.close();
}
// Each kind of React moment, at full size.
for (const [name, query] of [['attack', '?seed=7&scene=react-attack'], ['adapt', '?seed=2&scene=react-adapt'], ['strat', '?seed=5&scene=react-strat']]) {
  const page = await open(`${query}&pace=100000&timer=off`);
  await page.screenshot({ path: join(shots, `f-react-${name}.png`) });
  await page.close();
  console.log(`Saved f-react-${name}.png`);
}
await browser.close();
server.close();
