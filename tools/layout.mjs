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
const STAGE = 'g';
const SEED = 7;

// Each scene: a URL, then optional real-input steps to reach it.
const SCENES = [
  { name: 'opening', query: `?seed=${SEED}&pace=100000` },
  { name: 'opening-board', query: `?seed=${SEED}&pace=100000`, steps: async (p) => { await p.click('[data-act="mull-keep"]'); } },
  { name: 'mid', query: `?seed=${SEED}&scene=mid&pace=100000` },
  { name: 'hover-hand', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.hand-card', 2); }, preview: true },
  { name: 'hover-board', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.slot-card', 0); }, preview: true },
  { name: 'menu', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await clickTop(p, '[data-act="hand"]', 0); } },
  { name: 'settings', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await clickTop(p, '[data-act="settings"]', 0); }, need: '[data-region="settings"]' },
  { name: 'attack-preview', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await clickTop(p, '[data-act="attacker"]', 0); }, need: '.preview-badge' },
  // Stage F: a React moment of each kind (an attack, an Adapt, a resolving Strat), and a plate's preview on hover.
  { name: 'react', query: `?seed=${SEED}&scene=react-attack&pace=100000&timer=off`, need: '[data-region="react-moment"][data-kind="attack"]' },
  { name: 'react-hover', query: `?seed=${SEED}&scene=react-attack&pace=100000&timer=off`, steps: async (p) => { await hoverTop(p, '.rx-plate[data-i="0"]', 0); }, need: '.rx.previewing' },
  { name: 'react-adapt', query: '?seed=2&scene=react-adapt&pace=100000&timer=off', need: '[data-region="react-moment"][data-kind="adapt"]' },
  { name: 'react-strat', query: '?seed=5&scene=react-strat&pace=100000&timer=off', need: '[data-region="react-moment"][data-kind="strat"]' },
  { name: 'lastbattle', query: `?seed=${SEED}&scene=lastbattle&pace=100000`, need: '.map.last-battle' },
  { name: 'end', query: `?seed=${SEED}&scene=end&pace=100000`, need: '[data-region="end"]' },
  // Stage V3's screens around a match.
  { name: 'title', query: '?screen=title', need: '[data-region="title"]' },
  { name: 'title-settings', query: '?screen=title', steps: async (p) => { await clickTop(p, '[data-act="settings"]', 0); }, need: '[data-region="settings"]' },
  { name: 'setup', query: '?screen=setup', need: '[data-region="setup"]' },
  { name: 'victory', query: '?seed=9&scene=end&pace=100000', need: '.screen-end.victory' },
  { name: 'defeat', query: '?seed=7&scene=end&pace=100000', need: '.screen-end.defeat' },
  // Stage P: two Location tiles mid-match, and the hover preview of a creature in hand with its series curve strip.
  { name: 'tiles', query: '?seed=1&scene=mid&pace=100000', need: '.loc .loc-art' },
  { name: 'series', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.hand-card:has(.cv-level)', 0); }, need: '.preview:not([hidden]) .series-line', preview: true },
  // Stage M: playing a friend: the title with a match to resume, each lobby screen, and online match setup from both
  // seats (?lobby=…: drawn with sample words; nothing connects).
  { name: 'm-title', query: '?lobby=title', need: '[data-act="net-resume"]' },
  ...['waiting', 'join', 'connecting', 'error', 'mismatch', 'full'].map((k) => ({ name: `m-lobby-${k}`, query: `?lobby=${k}`, need: '[data-region="lobby"] .lobby-panel' })),
  { name: 'm-setup-host', query: '?lobby=setup-host', need: '[data-region="setup"] [data-act="begin"]' },
  { name: 'm-setup-guest', query: '?lobby=setup-guest', need: '[data-region="setup"] .setup-wait' },
  // Stage G: the Codex, opened by a real right-click, for each kind of card.
  { name: 'codex-hand', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await rightClickHand(p, 'Character'); }, need: '#codex:not([hidden]) .cx-tab' },
  { name: 'codex-board', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await rightClickTop(p, '[data-hover="board"][data-who="p2"]', 0); }, need: '#codex:not([hidden]) .cx-tab' },
  { name: 'codex-action', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await rightClickHand(p, 'Action'); }, need: '#codex:not([hidden]) .cx-mode' },
  { name: 'codex-event', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await rightClickHand(p, 'Event'); }, need: '#codex:not([hidden]) .cx-mode' },
  { name: 'codex-location', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await rightClickTop(p, '.loc-label', 0); }, need: '#codex:not([hidden]) .cx-kv' },
  { name: 'codex-campaign', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await rightClickTop(p, '[data-region="quest-p1"]', 0); }, need: '#codex:not([hidden]) .cx-segs' },
];
// The labels on the painted map, checked for contrast in these scenes.
const CONTRAST = new Set(['opening-board', 'mid', 'lastbattle', 'tiles']);
const SHOT_ALL_SIZES = new Set(['mid', 'react', 'tiles', 'codex-hand']);

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
async function rightClickTop(p, sel, i) { const pt = await topPoint(p, sel, i); if (pt) { await p.mouse.click(pt.x, pt.y, { button: 'right' }); await p.waitForTimeout(300); } }
async function rightClickHand(p, type) {
  const i = await p.evaluate((t) => [...document.querySelectorAll('.hand-card')].findIndex((el) => window.__match.state().players.p1.hand.find((c) => c.uid === el.dataset.uid)?.cardType === t), type);
  if (i >= 0) await rightClickTop(p, '.hand-card', i);
}
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
  for (const el of stage.querySelectorAll('[data-region], .hand-card, .preview, .menu, .react-opt, .dialog, .slot-card, .loc-label, .side-marker, .caption, .prompt, .toast, .preview-badge, .gear, .scr-btn, .end-panel, .end-head, .end-heroes, .end-buttons, .title-block, .setup-side, .setup-mid, .lobby-panel, .title-resume, .rx-panel, .rx-plate, .rx-chip, .rx-dmg, .rx-lift:not(.opt)')) {
    if (!visible(el)) continue;
    const b = box(el);
    if (b.l < -1 || b.t < -1 || b.r > 1921 || b.b > 1081) out.push(`${name(el)} is off-screen (${b.l | 0},${b.t | 0} → ${b.r | 0},${b.b | 0})`);
  }
  // No text clipped or cut off.
  for (const el of stage.querySelectorAll('.card .name, .card .rule, .card .type, .card .sub, .card .tab, .card .gem, .loc-label, .loc-line, .quest, .panel, .react-bar, .react-text, .react-opt, .prompt, .caption, .market-info, .market-name, .dialog, .warlord, .log-panel, .btn, .menu-item, .tag, .held, .guard, .lb-label, .side-marker, .toast, .loc-name, .loc-time, .prime-tab, .sl-t, .sl-c b, .scr-btn, .set, .fact, .st-row, .st-l, .end-totals, .end-how, .end-title, .hero-note, .title-kicker, .title-main, .title-sub, .title-note, .setup-who, .setup-deck, .setup-title, .lobby-h, .lobby-code, .lobby-k, .lobby-p, .lobby-wait, .lobby-err, .title-notice, .title-resume-sub, .setup-wait, .opening-text, .rx-n, .rx-e, .rx-r, .rx-h1, .rx-h2, .rx-h3, .rx-chip, .rx-lab, .rx-ring b')) {
    if (!visible(el)) continue;
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) out.push(`text clipped in ${name(el)}: "${el.textContent.trim().slice(0, 50)}"`);
  }
  if (/…/.test(stage.textContent)) out.push('text trimmed with "…"');
  // Stage G: the Codex (in its own layer, scaled with the stage): inside the window, nothing clipped, its card beside its text.
  const cx = document.querySelector('#codex:not([hidden])');
  if (cx) {
    const b = box(cx);
    if (b.l < -1 || b.t < -1 || b.r > 1921 || b.b > 1081) out.push(`the Codex is off-screen (${b.l | 0},${b.t | 0} → ${b.r | 0},${b.b | 0})`);
    for (const el of cx.querySelectorAll('.cx-crumb, .cx-search, .cx-id h2, .cx-th, .cx-tl, .cx-now, .cx-lv, .cx-tab td, .cx-ab, .cx-gl, .cx-mode, .cx-cost, .cx-fm, .cx-foot, .cx-res a')) {
      if (!visible(el)) continue;
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) out.push(`text clipped in the Codex ${name(el)}: "${el.textContent.trim().slice(0, 50)}"`);
      const e = box(el);
      if (e.r > b.r + 1 || e.l < b.l - 1) out.push(`the Codex ${name(el)} sticks out of its panel`);
    }
    const cw = cx.querySelector('.cx-cw'); const id = cx.querySelector('.cx-id');
    if (cw && id && box(cw).r > box(id).l + 1) out.push('the Codex card covers its text');
  }
  // Each Location label on one line.
  for (const el of stage.querySelectorAll('.loc-line')) if (el.getBoundingClientRect().height / scale > 22) out.push(`a Location label wraps: "${el.textContent}"`);
  // Panels that must not cover each other.
  const one = (sel) => [...stage.querySelectorAll(sel)].filter(visible);
  const overlap = (a, b) => { const x = box(a); const y = box(b); return x.l < y.r - 1 && y.l < x.r - 1 && x.t < y.b - 1 && y.t < x.b - 1; };
  const pairs = [
    ['[data-region="topbar"]', '[data-region="map"]'], ['[data-region="topbar"]', '[data-region="column"]'], ['[data-region="map"]', '[data-region="column"]'],
    ['.hand-card', '.me-piles .piles'], ['.hand-card', '.me-left .quest'], ['.hand-card', '.me-left .warlord'], ['.hand-card', '[data-region="column"]'],
    ['.side-marker', '[data-region="map"]'], ['.side-marker', '.hand-card'], ['.side-marker', '.me-left .quest'],
    // (Stage F: in a React moment, the plates and headline never cover a card involved, a mark or each other.)
    ['.rx-panel', '.rx-lift:not(.opt)'], ['.rx-panel', '.rx-lift.opt'], ['.rx-panel', '.rx-chip'], ['.rx-panel', '.rx-dmg'], ['.rx-chip', '.rx-chip'], ['.rx-plate', '.rx-plate'],
    ['.caption', '.loc-label'], ['.prompt', '.loc-label'], ['.caption', '.prompt'], ['.caption', '.slot-card'], ['.prompt', '.slot-card'],
    ['.loc-label', '.slot-card'], ['.menu', '[data-region="map"] .slot-card.ready'],
    ['.gear', '[data-region="piles-p2"]'], ['.gear', '[data-region="column"]'], ['.preview-badge', '.preview-badge'], ['.preview-badge', '.loc-label'],
    ['.end-panel', '.end-panel'], ['.end-panel', '.end-heroes'], ['.end-panel', '.end-heroes-label'], ['.end-how', '.end-panel'], ['.end-buttons', '.hero-note'],
    ['.loc-label', '.slot-card'], ['.preview .series-line', '.preview .card'],
    ['.prime-tab', '.hand-card .cv-well'], ['.prime-tab', '.hand-card .cv-name'], ['.prime-tab', '.slot-card'], ['.end-panel', '.end-head'], ['.end-heroes', '.end-buttons'], ['.hero', '.hero'],
    ['.setup-side', '.setup-mid'], ['.title-block', '.title-note'], ['.lobby-panel', '.title-note'], ['.scr-btn', '.scr-btn'],
  ];
  for (const [a, b] of pairs) for (const x of one(a)) for (const y of one(b)) if (x !== y && overlap(x, y)) out.push(`${name(x)} covers ${name(y)}`);
  const labels = one('.loc-label');
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (overlap(labels[i], labels[j])) out.push('two Location labels overlap');
  return out;
}

// Contrast of the map's labels on the painted map: each label is shot as drawn, then with its letters made
// transparent (the halo and the map stay), and every pixel the letters cover is compared with the text colour
// (the WCAG contrast ratio). The lowest tenth of those pixels must reach 4.5:1 (3:1 for large text: 24 px, or
// 18.7 px bold).
async function contrast(page) {
  const out = [];
  // Hold everything still (the embers and fog drift), so the two shots differ only by the letters.
  const still = await page.addStyleTag({ content: '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; } #vfx { visibility: hidden !important; }' });
  await page.waitForTimeout(100);
  const els = await page.$$('.wilds, .lane-num, .lb-label, .loc-label .loc-name, .loc-label .loc-line, .loc-label .loc-time');
  for (const el of els) {
    const info = await el.evaluate((e) => {
      const cs = getComputedStyle(e);
      const st = document.getElementById('stage').getBoundingClientRect().width / 1920;
      const px = parseFloat(cs.fontSize) / st;
      return { color: cs.color, big: px >= 24 || (px >= 18.7 && Number(cs.fontWeight) >= 700), text: e.textContent.trim().slice(0, 24), cls: String(e.className).split(' ')[0] };
    });
    const box = await el.boundingBox();
    if (!box || box.width < 2) continue;
    const a = await page.screenshot({ clip: box });
    await el.evaluate((e) => { for (const c of [e, ...e.querySelectorAll('*')]) c.style.setProperty('color', 'transparent', 'important'); });
    const b = await page.screenshot({ clip: box });
    await el.evaluate((e) => { for (const c of [e, ...e.querySelectorAll('*')]) c.style.removeProperty('color'); });
    const r = await page.evaluate(async ([a64, b64, color]) => {
      const load = async (s) => {
        const bm = await createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
        const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
        return x.getImageData(0, 0, bm.width, bm.height).data;
      };
      const A = await load(a64); const B = await load(b64);
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const [tr, tg, tb] = color.match(/[\d.]+/g).map(Number);
      const lt = L(tr, tg, tb);
      const ratios = [];
      for (let i = 0; i < A.length; i += 4) {
        const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
        if (d < 90) continue; // only the pixels the letters cover
        const lb = L(B[i], B[i + 1], B[i + 2]);
        ratios.push((Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05));
      }
      ratios.sort((x, y) => x - y);
      return ratios.length ? { low: ratios[Math.floor(ratios.length * 0.1)], n: ratios.length } : null;
    }, [a.toString('base64'), b.toString('base64'), info.color]);
    if (!r) continue;
    const need = info.big ? 3 : 4.5;
    out.push({ label: `${info.cls} "${info.text}"`, low: r.low, ok: r.low >= need, need });
  }
  await still.evaluate((e) => e.remove());
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
    if (sc.preview && !(await page.$('.preview:not([hidden]) .card-full'))) problems.push('the hover preview did not show');
    problems.push(...(await page.evaluate(inspect)), ...errors);
    if (CONTRAST.has(sc.name)) {
      const cs = await contrast(page);
      for (const c of cs) if (!c.ok) problems.push(`low contrast on the map: ${c.label} ${c.low.toFixed(2)}:1 (needs ${c.need}:1)`);
      const worst = cs.reduce((m, c) => (!m || c.low < m.low ? c : m), null);
      if (worst) console.log(`      contrast (${sc.name}, ${w}×${h}): ${cs.length} labels, lowest ${worst.low.toFixed(2)}:1 (${worst.label})`);
    }
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

// Screenshots for the report: the contact sheet (every card at Full size), the foil cards, the hand.
{
  const page = await browser.newPage({ viewport: { width: 2600, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(`${url}?sheet=full`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(shotDir, `${STAGE}-contact-sheet.png`), fullPage: true });
  await page.goto(`${url}?sheet=foil`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(shotDir, `${STAGE}-foil.png`), clip: { x: 0, y: 0, width: 1260, height: 620 } });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${url}?seed=${SEED}&scene=mid&pace=100000`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(shotDir, `${STAGE}-hand.png`), clip: { x: 300, y: 740, width: 920, height: 340 } });
  await page.close();
  console.log(`Saved ${STAGE}-contact-sheet.png, ${STAGE}-foil.png and ${STAGE}-hand.png`);
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
