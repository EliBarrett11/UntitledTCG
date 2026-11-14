// Layout check: the board at 1920×1080, 1366×768 and 1280×720, in each scene (the opening and mulligan,
// mid-match with the hover preview on a hand card and on a board card, a React window, the Last Battle and
// the end screen): nothing off-screen, no text clipped or cut off, no panel covering another, the
// "ENEMY ▲ · ▼ YOU" marker off the lanes, every Location label on one line; and no page errors. It also
// plays one debug match (?debug=1). Screenshots go to tools/screenshots/.
//
// Usage: node tools/layout.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available, so the layout check cannot run.'); process.exit(2); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotDir = join(root, 'tools', 'screenshots');
const SIZES = [[1920, 1080], [1366, 768], [1280, 720]];
const STAGE = 's3';
const SEED = 7;

// Each scene: a URL, then optional real-input steps to reach it.
const SCENES = [
  { name: 'opening', query: `?seed=${SEED}&pace=100000` },
  { name: 'opening-board', query: `?seed=${SEED}&pace=100000`, steps: async (p) => { await p.click('[data-act="mull-keep"]'); } },
  { name: 'mid', query: `?seed=${SEED}&scene=mid&pace=100000` },
  { name: 'hover-hand', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.hand-card', 2); }, preview: true },
  { name: 'hover-board', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.slot-card', 0); }, preview: true },
  { name: 'menu', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await clickTop(p, '[data-act="hand"]', 0); } },
  { name: 'react', query: `?seed=${SEED}&scene=react&pace=100000`, need: '[data-region="react-bar"]' },
  { name: 'lastbattle', query: `?seed=${SEED}&scene=lastbattle&pace=100000`, need: '.map.last-battle' },
  { name: 'end', query: `?seed=${SEED}&scene=end&pace=100000`, need: '[data-region="end"]' },
];
const SHOT_ALL_SIZES = new Set(['mid', 'react']);

async function topPoint(p, sel, i) {
  return p.evaluate(([s, k]) => {
    const el = document.querySelectorAll(s)[k];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[0.5, 0.3], [0.2, 0.25], [0.5, 0.5], [0.15, 0.6]]) {
      const x = r.left + r.width * fx; const y = r.top + r.height * fy;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit))) return { x, y };
    }
    return null;
  }, [sel, i]);
}
async function hoverTop(p, sel, i) { const pt = await topPoint(p, sel, i); if (pt) { await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(250); } }
async function clickTop(p, sel, i) { const pt = await topPoint(p, sel, i); if (pt) { await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250); } }

// Everything the page checks about itself (in stage pixels, so every size is judged the same way).
function inspect() {
  const out = [];
  const stage = document.getElementById('stage');
  const sr = stage.getBoundingClientRect();
  const scale = sr.width / 1920;
  const box = (el) => { const r = el.getBoundingClientRect(); return { l: (r.left - sr.left) / scale, t: (r.top - sr.top) / scale, r: (r.right - sr.left) / scale, b: (r.bottom - sr.top) / scale }; };
  const name = (el) => el.dataset.region ?? (el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : el.tagName);
  const visible = (el) => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden]') && el.getBoundingClientRect().width > 0; };
  // The stage fits the window.
  if (sr.left < -1 || sr.top < -1 || sr.right > innerWidth + 1 || sr.bottom > innerHeight + 1) out.push('the stage is off-screen');
  if (document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight) out.push('the page scrolls');
  // Nothing off-screen.
  for (const el of stage.querySelectorAll('[data-region], .hand-card, .preview, .menu, .react-opt, .dialog, .slot-card, .loc-label, .side-marker, .caption, .prompt, .toast')) {
    if (!visible(el)) continue;
    const b = box(el);
    if (b.l < -1 || b.t < -1 || b.r > 1921 || b.b > 1081) out.push(`${name(el)} is off-screen (${b.l | 0},${b.t | 0} → ${b.r | 0},${b.b | 0})`);
  }
  // No text clipped or cut off.
  for (const el of stage.querySelectorAll('.token, .token-body, .face, .face-body, .loc-label, .loc-line, .quest, .panel, .react-bar, .react-text, .react-opt, .prompt, .caption, .market-info, .market-name, .dialog, .warlord, .log-panel, .btn, .menu-item, .tag, .held, .guard, .lb-label, .side-marker, .toast')) {
    if (!visible(el)) continue;
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) out.push(`text clipped in ${name(el)}: "${el.textContent.trim().slice(0, 50)}"`);
  }
  if (/…/.test(stage.textContent)) out.push('text trimmed with "…"');
  // Each Location label on one line.
  for (const el of stage.querySelectorAll('.loc-line')) if (el.getBoundingClientRect().height / scale > 22) out.push(`a Location label wraps: "${el.textContent}"`);
  // Panels that must not cover each other.
  const one = (sel) => [...stage.querySelectorAll(sel)].filter(visible);
  const overlap = (a, b) => { const x = box(a); const y = box(b); return x.l < y.r - 1 && y.l < x.r - 1 && x.t < y.b - 1 && y.t < x.b - 1; };
  const pairs = [
    ['[data-region="topbar"]', '[data-region="map"]'], ['[data-region="topbar"]', '[data-region="column"]'], ['[data-region="map"]', '[data-region="column"]'],
    ['.hand-card', '.me-piles .piles'], ['.hand-card', '.me-left .quest'], ['.hand-card', '.me-left .warlord'], ['.hand-card', '[data-region="column"]'],
    ['.side-marker', '[data-region="map"]'], ['.side-marker', '.hand-card'], ['.side-marker', '.me-left .quest'],
    ['[data-region="react-bar"]', '.warlord-enemy'], ['[data-region="react-bar"]', '[data-region="quest-p2"]'], ['[data-region="react-bar"]', '[data-region="piles-p2"]'],
    ['[data-region="react-tray"]', '[data-region="map"]'], ['[data-region="react-tray"]', '.side-marker'], ['[data-region="react-tray"]', '.me-piles .piles'], ['[data-region="react-tray"]', '.me-left .quest'],
    ['.caption', '.loc-label'], ['.prompt', '.loc-label'], ['.caption', '.prompt'], ['.caption', '.slot-card'], ['.prompt', '.slot-card'],
    ['.loc-label', '.slot-card'], ['.menu', '[data-region="map"] .slot-card.ready'],
  ];
  for (const [a, b] of pairs) for (const x of one(a)) for (const y of one(b)) if (x !== y && overlap(x, y)) out.push(`${name(x)} covers ${name(y)}`);
  const labels = one('.loc-label');
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (overlap(labels[i], labels[j])) out.push('two Location labels overlap');
  return out;
}

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;
await mkdir(shotDir, { recursive: true });
const browser = await chromium.launch();
let failures = 0;

for (const [w, h] of SIZES) {
  for (const sc of SCENES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
    await page.goto(`${url}${sc.query}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (sc.steps) await sc.steps(page);
    const problems = [];
    if (sc.need && !(await page.$(sc.need))) problems.push(`the scene didn't reach ${sc.need}`);
    if (sc.preview && !(await page.$('.preview:not([hidden]) .face-full'))) problems.push('the hover preview did not show');
    problems.push(...(await page.evaluate(inspect)), ...errors);
    const file = `${STAGE}-${sc.name}-${w}x${h}.png`;
    if (w === 1920 || SHOT_ALL_SIZES.has(sc.name)) await page.screenshot({ path: join(shotDir, file) });
    if (problems.length) {
      failures++;
      console.log(`FAIL  ${w}×${h} ${sc.name}`);
      for (const p of [...new Set(problems)].slice(0, 12)) console.log(`      ${p}`);
    } else console.log(`PASS  ${w}×${h} ${sc.name}`);
    await page.close();
  }
}

// The debug view (?debug=1): one seeded AI-vs-AI match plays to the end with no page errors.
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  await page.goto(`${url}?debug=1&seed=3`, { waitUntil: 'networkidle' });
  try { await page.waitForSelector('body[data-done="true"]', { timeout: 180000 }); } catch { errors.push('the debug match did not finish'); }
  const status = await page.textContent('#debug-status').catch(() => '');
  const lines = await page.evaluate(() => document.getElementById('debug-log')?.textContent.split('\n').length ?? 0);
  if (errors.length || lines < 50) {
    failures++;
    console.log('FAIL  debug view');
    for (const p of errors) console.log(`      ${p}`);
  } else console.log(`PASS  debug view: ${status} (${lines} log lines)`);
  await page.close();
}

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
