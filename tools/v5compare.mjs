// Side by side (V5): each mockup beside the game at the same moment, and the new Energy display at each size.
// Saved to tools/screenshots/:
//   v5-compare-turn.png       ← docs/mockups/v5/v5-turn.png: ?seed=10&scene=mid, hovering the WARD on a token (its tip),
//                               the turn plaque and MUST ATTACK BEFORE YOU PASS (the plaque is in the column, as asked)
//   v5-compare-enemy.png      ← docs/mockups/v5/v5-enemy.png: the enemy's turn with an action announced
//   v5-compare-dominance.png  ← docs/mockups/dominance-v1/dom-crop.png: a Location's dominance line, hovered (the Might
//                               hexagons)
//   v5-energy-<size>.png      the Energy display beside the hand (ready and exhausted Exert, a cost preview) at
//                               1920×1080, 1366×768 and 1280×720
//
// Usage: node tools/v5compare.mjs
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
async function hoverText(page, word, within) {
  const pt = await page.evaluate(([w, sel]) => {
    for (const host of document.querySelectorAll(sel)) {
      const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const i = n.textContent.indexOf(w);
        if (i < 0) continue;
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + w.length);
        const b = r.getBoundingClientRect();
        const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (b.width > 1 && top && (n.parentElement === top || n.parentElement.contains(top) || top.contains(n.parentElement))) return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      }
    }
    return null;
  }, [word, within]);
  if (!pt) { errors.push(`no "${word}" to hover`); return; }
  await page.mouse.move(pt.x - 40, pt.y - 40);
  await page.mouse.move(pt.x, pt.y, { steps: 4 });
  await page.waitForTimeout(900);
}
async function hover(page, sel, i = 0) {
  const b = await (await page.$$(sel))[i]?.boundingBox();
  if (!b) { errors.push(`nothing to hover: ${sel}`); return; }
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await page.waitForTimeout(700);
}
async function sideBySide(name, panels, { width = 960, height = 540 } = {}) {
  const page = await browser.newPage({ viewport: { width: panels.length * (width + 20) + 20, height: 400 }, deviceScaleFactor: 1 });
  const parts = panels.map((x) => `<div><div style="padding:10px 6px;font-size:18px;letter-spacing:3px">${x.label}</div><img src="data:image/png;base64,${x.png.toString('base64')}" style="display:block;width:${width}px;height:${height}px;object-fit:contain;object-position:top left"></div>`).join('');
  await page.setContent(`<body style="margin:0;background:#080605;font-family:Georgia,serif;color:#c9b07a;display:inline-flex;gap:20px;padding:0 10px 10px">${parts}</body>`);
  await page.waitForTimeout(200);
  await (await page.$('body')).screenshot({ path: join(shots, `v5-compare-${name}.png`) });
  await page.close();
  console.log(`Saved v5-compare-${name}.png`);
}
const mock = (dir, f) => readFile(join(root, 'docs', 'mockups', dir, f));

// The keyword tip and the turn plaque.
{
  const page = await open('?seed=10&scene=mid&pace=100000&lowmotion=1');
  await hoverText(page, 'Ward', '.slot-card');
  const game = await page.screenshot();
  await sideBySide('turn', [{ label: 'THE MOCKUP · v5-turn.png (the keyword tip)', png: await mock('v5', 'v5-turn.png') }, { label: 'THE GAME · ?seed=10&scene=mid, the tip on a WARD', png: game }]);
  await page.close();
}
// The enemy's turn, an action announced.
{
  const page = await open('?seed=10&scene=mid&autoplay=1&pace=600&speed=slow&lowmotion=1');
  await page.waitForFunction(() => /SUMMONS/.test(document.querySelector('[data-region="announce"]')?.textContent ?? ''), null, { timeout: 120000 });
  await page.waitForTimeout(250);
  const game = await page.screenshot();
  await sideBySide('enemy', [{ label: 'THE MOCKUP · v5-enemy.png', png: await mock('v5', 'v5-enemy.png') }, { label: 'THE GAME · the enemy summons, announced', png: game }]);
  await page.close();
}
// A Location's dominance line, hovered.
{
  const page = await open('?seed=11&scene=mid&pace=100000&lowmotion=1');
  await hover(page, '.dom-line');
  const b = await (await page.$('.loc-label-wrap')).boundingBox();
  const game = await page.screenshot({ clip: { x: Math.max(0, b.x - 40), y: 128, width: Math.min(730, 1920 - b.x + 40), height: 660 } });
  await sideBySide('dominance', [{ label: 'THE MOCKUP · dominance-v1/dom-crop.png', png: await mock('dominance-v1', 'dom-crop.png') }, { label: 'THE GAME · ?seed=11&scene=mid, the line hovered', png: game }], { width: 730, height: 660 });
  await page.close();
}
// The Energy display at each size, with a cost preview (hovering a card in hand).
for (const [w, h] of [[1920, 1080], [1366, 768], [1280, 720]]) {
  const page = await open('?seed=10&scene=mid&pace=100000&lowmotion=1', { width: w, height: h });
  await hover(page, '.hand-card', 1);
  const k = w / 1920;
  await page.screenshot({ path: join(shots, `v5-energy-${w}x${h}.png`), clip: { x: Math.round(300 * k), y: Math.round(760 * k), width: Math.round(1300 * k), height: Math.round(320 * k) } });
  console.log(`Saved v5-energy-${w}x${h}.png`);
  await page.close();
}

await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
