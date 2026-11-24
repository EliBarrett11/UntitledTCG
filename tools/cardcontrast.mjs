// Card text contrast (stage A): every label on every card, at every Level of every form, at Full, Mini and Token size
// (three board states each), over its own art. Like the layout check's map labels: each card is shot as drawn, then
// with its letters made transparent (their shadows and the art stay), and every pixel the letters cover is compared
// with the text's colour (the WCAG ratio). The lowest tenth of a label's pixels must reach 4.5:1 (3:1 for large
// text: 24 px, or 18.7 px bold, as it shows). Badges in their own sockets (costs, Levels, stats) are not over the
// art, so they aren't measured.
//
// Usage: node tools/cardcontrast.mjs [--all]   (--all lists every label's ratio, lowest first)
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer, withDev } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
await page.goto(withDev(`http://127.0.0.1:${server.address().port}/?sheet=all`), { waitUntil: 'networkidle' });
await page.waitForSelector('body[data-done="true"]');
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; } .holo { display: none !important; }' });

// The text that sits over the art: names, titles, type lines, rules, a token's keywords, the speed word.
const SEL = '.cv-name, .cv-title, .cv-type, .cv-rules, .cv-tokkw, .cv-speed span, .cv-small';
const n = await page.$$eval('[data-sheet-card]', (els) => els.length);
const results = [];
for (let i = 0; i < n; i++) {
  const card = (await page.$$('[data-sheet-card]'))[i];
  await card.scrollIntoViewIfNeeded();
  const info = await card.evaluate((el, sel) => {
    const label = el.closest('.sheet-cell')?.querySelector('.sheet-label')?.textContent ?? '';
    const size = el.dataset.size ?? (el.querySelector('.card-mini') ? 'mini' : el.querySelector('.card-token') ? 'token' : 'full');
    const cb = el.getBoundingClientRect();
    const out = [];
    for (const t of el.querySelectorAll(sel)) {
      if (!t.textContent.trim()) continue;
      // (Each piece of its text, with its own colour: gold numbers and bold words included.)
      const walk = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
      for (let node = walk.nextNode(); node; node = walk.nextNode()) {
        if (!node.textContent.trim()) continue;
        const host = node.parentElement;
        if (host.closest('.en-word, .cv-well, [data-socket]')) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        const cs = getComputedStyle(host);
        const k = el.querySelector('.cv')?.getBoundingClientRect().width / el.querySelector('.cv')?.offsetWidth || 1;
        const px = parseFloat(cs.fontSize) * k;
        for (const b of range.getClientRects()) {
          if (b.width < 2 || b.height < 2) continue;
          out.push({ cls: t.className.split(' ')[0], text: node.textContent.trim().slice(0, 30), color: cs.color, big: px >= 24 || (px >= 18.7 && Number(cs.fontWeight) >= 700), x: b.left - cb.left, y: b.top - cb.top, w: b.width, h: b.height });
        }
      }
    }
    return { label, size, boxes: out, w: cb.width, h: cb.height };
  }, SEL);
  if (!info.boxes.length) continue;
  const a = await card.screenshot();
  await card.evaluate((el, sel) => { for (const t of el.querySelectorAll(sel)) for (const c of [t, ...t.querySelectorAll('*')]) c.style.setProperty('color', 'transparent', 'important'); }, SEL);
  const b = await card.screenshot();
  await card.evaluate((el, sel) => { for (const t of el.querySelectorAll(sel)) for (const c of [t, ...t.querySelectorAll('*')]) c.style.removeProperty('color'); }, SEL);
  const r = await page.evaluate(async ([a64, b64, boxes]) => {
    const load = async (s) => {
      const bm = await createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
      const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
      return { d: x.getImageData(0, 0, bm.width, bm.height).data, w: bm.width, h: bm.height };
    };
    const A = await load(a64); const B = await load(b64);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return boxes.map((bx) => {
      const [tr, tg, tb] = bx.color.match(/[\d.]+/g).map(Number);
      const lt = L(tr, tg, tb);
      const ratios = [];
      for (let y = Math.max(0, Math.floor(bx.y)); y < Math.min(A.h, Math.ceil(bx.y + bx.h)); y++) {
        for (let x = Math.max(0, Math.floor(bx.x)); x < Math.min(A.w, Math.ceil(bx.x + bx.w)); x++) {
          const i = (y * A.w + x) * 4;
          const d = Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1]) + Math.abs(A.d[i + 2] - B.d[i + 2]);
          if (d < 90) continue;   // only the pixels the letters cover
          const lb = L(B.d[i], B.d[i + 1], B.d[i + 2]);
          ratios.push((Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05));
        }
      }
      ratios.sort((x, y) => x - y);
      return ratios.length >= 6 ? ratios[Math.floor(ratios.length * 0.1)] : null;
    });
  }, [a.toString('base64'), b.toString('base64'), info.boxes]);
  info.boxes.forEach((bx, k) => { if (r[k] !== null) results.push({ card: info.label, size: info.size, cls: bx.cls, text: bx.text, low: r[k], need: bx.big ? 3 : 4.5 }); });
}
await browser.close();
server.close();

results.sort((x, y) => x.low / x.need - y.low / y.need);
const bad = results.filter((x) => x.low < x.need);
const worst = results[0];
const fmt = (x) => `${x.low.toFixed(2)}:1 (needs ${x.need}:1) · ${x.card} · ${x.size} · ${x.cls} "${x.text}"`;
if (process.argv.includes('--all')) for (const x of results.slice(0, 60)) console.log(`      ${fmt(x)}`);
console.log(`Card text contrast: ${results.length} labels on ${n} card renders; lowest ${worst ? fmt(worst) : 'none'}.`);
for (const x of bad.slice(0, 40)) console.log(`FAIL  ${fmt(x)}`);
if (errors.length) console.log(errors.join('\n'));
console.log(bad.length || errors.length ? `FAIL  ${bad.length} labels below the bar` : 'PASS  every label on every card reaches its contrast bar.');
process.exit(bad.length || errors.length ? 1 : 0);
