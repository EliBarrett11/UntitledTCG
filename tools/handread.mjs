// How well the hand reads (stage H): for each card in your hand, how much of its name and of its cost and Level wells
// a neighbouring card hides (sampled points of the text itself, not its box). Used by tools/layout.mjs for the 7- to
// 10-card scenes; run directly, it prints each hand size at each screen size.
//
// Usage: node tools/handread.mjs [query]   (default: ?seed=10&scene=mid&pace=100000&lowmotion=1)
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// In the page: { worst: {name, cost, level}, cards: [{name, cost, level}] }, each the fraction (0–1) hidden by another hand card.
export async function measureHand(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('.hand-card')];
    const hiddenIn = (card, rects) => {
      let n = 0; let hid = 0;
      for (const r of rects) {
        for (let i = 0; i < 24; i++) for (let j = 0; j < 3; j++) {
          const x = r.left + ((i + 0.5) / 24) * r.width;
          const y = r.top + ((j + 0.5) / 3) * r.height;
          if (y > innerHeight - 1 || x > innerWidth - 1) continue;
          const top = document.elementFromPoint(x, y);
          n += 1;
          const other = top?.closest('.hand-card');
          if (other && other !== card) hid += 1;
        }
      }
      return n ? hid / n : 0;
    };
    const textRects = (el) => {
      const out = [];
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let t = walk.nextNode(); t; t = walk.nextNode()) {
        if (!t.textContent.trim()) continue;
        const r = document.createRange(); r.selectNodeContents(t);
        for (const b of r.getClientRects()) if (b.width > 1 && b.height > 1) out.push(b);
      }
      return out;
    };
    const per = cards.map((card) => {
      const name = card.querySelector('.cv-name');
      // (The cost well is the leftmost; a creature's Level well is at the top right.)
      const wells = [...card.querySelectorAll('.cv-well')].map((w) => w.getBoundingClientRect()).filter((b) => b.width > 1).sort((a, b) => a.left - b.left);
      return { name: name ? hiddenIn(card, textRects(name)) : 0, cost: wells.length ? hiddenIn(card, [wells[0]]) : 0, level: wells.length > 1 ? hiddenIn(card, wells.slice(1)) : 0 };
    });
    const worst = { name: Math.max(0, ...per.map((x) => x.name)), cost: Math.max(0, ...per.map((x) => x.cost)), level: Math.max(0, ...per.map((x) => x.level)) };
    return { worst, cards: per };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const { staticServer, withDev } = await import('./serve.mjs');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const server = staticServer(root);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const query = process.argv[2] ?? '?seed=10&scene=mid&pace=100000&lowmotion=1';
  for (const [w, h] of [[1920, 1080], [1366, 768], [1280, 720]]) {
    for (const n of [7, 8, 9, 10]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      await page.goto(withDev(`${base}${query}&hand=${n}`), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(5, 5);
      await page.waitForTimeout(700);
      const m = await measureHand(page);
      console.log(`${w}×${h} ${n} cards: name hidden up to ${(100 * m.worst.name).toFixed(0)}%, cost ${(100 * m.worst.cost).toFixed(0)}%, Level ${(100 * m.worst.level).toFixed(0)}%   [names ${m.cards.map((c) => Math.round(100 * c.name)).join(' ')}]`);
      await page.close();
    }
  }
  await browser.close();
  server.close();
}
