// The neat-text test: every card, at every Level of every form, at Full, Mini and Token size (Tokens in
// three board states: plain; raised, Ready and holding an Item; Spent and damaged), plus Chips at 24, 32 and
// 40 px. It fails on any text that overflows its box, wraps where it shouldn't (costs, stats, chips, the
// type line), is cut off or shortened with "…", leaves its card, or overlaps a badge or other text.
//
// Usage: node tools/cardtext.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available, so the neat-text test cannot run.'); process.exit(2); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
await page.goto(`http://127.0.0.1:${server.address().port}/?sheet=all`, { waitUntil: 'networkidle' });
await page.waitForSelector('body[data-done="true"]');
await page.evaluate(() => document.fonts.ready);

const result = await page.evaluate(() => {
  const problems = [];
  let cards = 0;
  const bySize = { full: 0, mini: 0, token: 0 };
  const r = (el) => el.getBoundingClientRect();
  const overlap = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
  // One line: every text node inside sits on a single line, and nothing is wider than its box.
  const singleLine = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const tops = new Set([...range.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top / 3)));
      if (tops.size > 1) return false;
    }
    return el.scrollWidth <= el.clientWidth + 1;
  };
  for (const holder of document.querySelectorAll('[data-sheet-card]')) {
    const card = holder.querySelector('.card');
    const size = holder.dataset.size;
    const label = `${holder.closest('.sheet-cell').querySelector('.sheet-label').textContent} (${size}${holder.dataset.i ? ` ${holder.dataset.i}` : ''})`;
    cards++;
    bySize[size]++;
    const box = r(card);
    const texts = [...card.querySelectorAll('[data-z="text"]')];
    const badges = [...card.querySelectorAll('[data-z="badge"]')];
    for (const el of [...texts, ...badges, ...card.querySelectorAll('.name, .rule, .type, .sub, .mode-text, .favour-text')]) {
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) problems.push(`${label}: text overflows its box: "${el.textContent.trim().slice(0, 40)}"`);
    }
    for (const el of card.querySelectorAll('.nowrap, .type, .tab, .gem, .price-coin, .notch-cost, .seal, .pill, .held-band, .guard-badge, .legend-banner')) {
      if (!singleLine(el)) problems.push(`${label}: wraps where it shouldn't: "${el.textContent.trim().slice(0, 40)}"`);
    }
    // The text block stays inside the card and clear of its top (the frame's shape and the badges).
    for (const el of texts) {
      const t = r(el);
      if (!inside(t, box)) problems.push(`${label}: text leaves the card: "${el.textContent.trim().slice(0, 40)}"`);
      for (const b of badges) if (!b.contains(el) && !el.contains(b) && overlap(t, r(b))) problems.push(`${label}: text overlaps a badge: "${el.textContent.trim().slice(0, 30)}" / "${b.textContent.trim().slice(0, 20)}"`);
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]; const b = texts[j];
      if (a.contains(b) || b.contains(a)) continue;
      if (overlap(r(a), r(b))) problems.push(`${label}: two lines of text overlap: "${a.textContent.trim().slice(0, 25)}" / "${b.textContent.trim().slice(0, 25)}"`);
    }
    for (let i = 0; i < badges.length; i++) for (let j = i + 1; j < badges.length; j++) {
      if (overlap(r(badges[i]), r(badges[j]))) problems.push(`${label}: two badges overlap: "${badges[i].textContent.trim().slice(0, 20)}" / "${badges[j].textContent.trim().slice(0, 20)}"`);
    }
    const body = card.querySelector('.body');
    if (body && r(body).top < box.top + 8) problems.push(`${label}: the text block reaches the top edge`);
  }
  let chips = 0;
  for (const holder of document.querySelectorAll('[data-sheet-chip]')) {
    chips++;
    const c = holder.querySelector('.card-chip');
    const w = r(c).width;
    if (w < 24 - 0.5 || w > 40 + 0.5) problems.push(`a chip is ${w}px wide`);
    const lvl = c.querySelector('.chip-lvl');
    if (lvl && !singleLine(lvl)) problems.push(`a chip's Level wraps: "${lvl.textContent}"`);
  }
  if (/…/.test(document.body.textContent)) problems.push('text shortened with "…"');
  return { problems, cards, chips, bySize };
});

await browser.close();
server.close();
const problems = [...new Set([...result.problems, ...errors])];
console.log(`Neat-text test: ${result.cards} card renders (Full ${result.bySize.full}, Mini ${result.bySize.mini}, Token ${result.bySize.token}) and ${result.chips} chips.`);
if (problems.length) {
  console.log(`FAIL  ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  for (const p of problems.slice(0, 60)) console.log(`      ${p}`);
  process.exit(1);
}
console.log('PASS  no text overflows, wraps where it shouldn\'t, is cut off, leaves its card or overlaps anything.');
