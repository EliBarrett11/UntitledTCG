// Stage X3 (docs/38, the play-test fixes): a Location leaving the board, recorded and checked frame by frame.
// Three real actions from the dev scenes, before (BEFORE, with only the scenes added) and after:
//   expire      your Pass ends the Battle Phase; at Dusk Gallows Hill expires with creatures on its lanes;
//   legend      your Gorran defeats the enemy's Ashen Wyrm; The Ashfall goes with it;
//   lastbattle  your Pass ends Round 9; at Dawn the Last Battle sweeps both Locations away.
// While each plays, the page logs on every frame what a jump would show: the Location tiles (and any burning copy),
// their labels and dominance lines, the Wilds labels, the wide Legendary (or its ghost) and its width, and the
// creatures' stat tabs. The check fails on:
//   a flash   a removed Location's tile is gone (nothing at its place) and later shows again;
//   a snap    its label, dominance line or a creature's stats change before its burn has begun;
//   a resize  the Legendary (or the copy that burns) is drawn narrower than its 3 lanes before its burn ends.
// Writes tools/clips/x3/x3-leave-<scene>-before-vs-after.webm, -strip.png and -frames.txt (kept out of git).
// Usage: node tools/x3leave.mjs [expire|legend|lastbattle …] [--new-only] [--check-only]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { staticServer, withDev } from './serve.mjs';
import { slowMo } from './slowmo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tools', 'clips', 'x3');
const raw = join(out, 'raw');
await mkdir(raw, { recursive: true });
const BEFORE = process.env.CLIPS_BEFORE ?? '2a52558';
const SCENES_COMMIT = '77e4bee';
const args = process.argv.slice(2);
const newOnly = args.includes('--new-only');
const checkOnly = args.includes('--check-only');
const only = args.filter((a) => !a.startsWith('--'));
const log = (...a) => console.log(...a);
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const K = checkOnly ? 4 : 10;
const LOW = process.env.LOWMOTION === '1';

const SCENES = {
  expire: { scene: 'x3-expire', go: () => window.__match.actWhere({ type: 'pass' }) },
  legend: { scene: 'x3-legend', go: () => { const a = window.__match.legal().find((x) => x.type === 'attack' && x.target?.space === 2); if (a) window.__match.act(a); return !!a; } },
  lastbattle: { scene: 'x3-lastbattle', go: () => window.__match.actWhere({ type: 'pass' }) },
};

// The before tree: BEFORE with only the scenes and dev aids added.
const beforeDir = join(root, '..', `utcg-before-x3-${BEFORE}`);
if (!newOnly && !existsSync(beforeDir)) {
  execFileSync('git', ['-C', root, 'worktree', 'add', '--detach', beforeDir, BEFORE], { stdio: 'ignore' });
  const patch = execFileSync('git', ['-C', root, 'diff', `${SCENES_COMMIT}~1`, SCENES_COMMIT, '--', 'src/ui/app.js']);
  execFileSync('git', ['-C', beforeDir, 'apply', '-'], { input: patch });
}
const serve = async (dir) => { const sv = staticServer(dir); await new Promise((r) => sv.listen(0, '127.0.0.1', r)); return { sv, base: `http://127.0.0.1:${sv.address().port}/` }; };
const NEW = await serve(process.env.NEW_DIR ?? root);   // (NEW_DIR: a snapshot of the tree, to keep working meanwhile)
const OLD = newOnly ? null : await serve(beforeDir);
const browser = await chromium.launch();

// The frame log, sampled on every animation frame in the page.
function sampler() {
  const rows = [];
  const op = (el) => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= Number(cs.opacity); } return o; };
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.width)]; };
  const snap = () => {
    const map = document.querySelector('[data-region="map"]');
    const row = { t: Math.round(performance.now()), fx: document.body.dataset.effect ?? '' };
    row.locs = [...document.querySelectorAll('.loc, .loc-ghost, .loc-hold')].filter((e) => op(e) > 0.02).map((e) => `${e.dataset.loc ?? e.className.split(' ')[0]}@${r(e).join('+')}:${op(e).toFixed(2)}${e.style.filter ? ':burn' : ''}`);
    row.labels = [...document.querySelectorAll('.loc-label')].filter((e) => op(e) > 0.02).map((e) => `${e.dataset.loc}:${op(e).toFixed(2)}`);
    row.wilds = [...document.querySelectorAll('.wilds')].filter((e) => op(e) > 0.02).length;
    row.doms = [...document.querySelectorAll('.dom-line')].filter((e) => op(e) > 0.02).map((e) => e.dataset.dom);
    row.wide = [...document.querySelectorAll('.slot-card.wide, .ghost, .ghost-wide')].filter((e) => op(e) > 0.02).map((e) => `${e.dataset.uid ?? e.dataset.ghost ?? '?'}@${r(e).join('+')}${e.style.filter ? ':burn' : ''}`);
    row.tabs = map ? [...map.querySelectorAll('.cell .tab-a')].filter((e) => op(e) > 0.02).map((e) => e.textContent.trim()).join(',') : '';
    row.lb = !!document.querySelector('.map.last-battle');
    rows.push(row);
  };
  const tick = () => { if (window.__x3stop) return; snap(); requestAnimationFrame(tick); };
  window.__x3rows = rows;
  snap();
  requestAnimationFrame(tick);
}

async function record(name, which) {
  const sc = SCENES[name];
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ...(checkOnly ? {} : { recordVideo: { dir: raw, size: { width: 1920, height: 1080 } } }) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now(); const sec = () => (Date.now() - t0) / 1000;
  const slow = await slowMo(ctx, page, 1);
  const base = which === 'old' ? OLD.base : NEW.base;
  await page.goto(withDev(`${base}?seed=10&scene=${sc.scene}&pace=100000&timer=off&speed=normal&lowmotion=${LOW ? 1 : 0}&vfxquality=0`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return !v || (v.standIns.length === 0 && v.ready >= 60); }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  await page.waitForTimeout(600);
  await slow.set(K);
  const from = sec();
  await page.evaluate(sampler);
  const acted = await page.evaluate(sc.go);
  if (!acted) log(`  ${name} (${which}): no action to play`);
  // Until the presenter has played everything (the Last Battle's Dawn included), then a little more.
  await page.waitForFunction(() => !window.__match.presenting(), null, { timeout: 600000, polling: 500 }).catch(() => log(`  ${name} (${which}): still presenting`));
  await page.waitForTimeout(600 * K);
  const rows = await page.evaluate(() => { window.__x3stop = true; return window.__x3rows; });
  const to = sec();
  const video = page.video();
  await ctx.close();
  const file = video ? await video.path() : null;
  if (errors.length) log(`  ${name} (${which}): page errors: ${errors.join(' | ')}`);
  return { file, from: Math.max(0, from - 0.2 * K), to, rows };
}

// The frame check: what jumps.
function check(rows, name) {
  const bad = [];
  const lines = [];
  let prev = null;
  // The removed Locations: those shown in the first frame and gone in the last.
  const idOf = (x) => x.split('@')[0];
  const first = new Set((rows[0]?.locs ?? []).map(idOf).filter((x) => x.startsWith('loc-')));
  const last = new Set((rows.at(-1)?.locs ?? []).map(idOf));
  const gone = [...first].filter((x) => !last.has(x));
  const t0 = rows[0]?.t ?? 0;
  // When the burn of each began (a burning copy or the tile itself under the erosion filter, or a ghost burning).
  let burnAt = null; let wideBurnEnd = null;
  rows.forEach((r, i) => {
    const key = JSON.stringify({ ...r, t: 0, fx: 0 });
    if (key !== prev) lines.push(`${String(r.t - t0).padStart(6)} ms  ${r.fx.padEnd(16)} locs=[${r.locs.join(' ')}] labels=[${r.labels.join(' ')}] doms=[${r.doms.join(' ')}] wilds=${r.wilds} wide=[${r.wide.join(' ')}] tabs=${r.tabs}${r.lb ? ' LB' : ''}`);
    prev = key;
    if (burnAt == null && (r.locs.some((x) => x.includes(':burn')) || r.fx.includes('location.gone') || r.fx.includes('last'))) burnAt = i;
  });
  // A flash: a removed tile (by its lane span) has nothing at its place, then something again.
  for (const g of gone) {
    const xw = (x) => x.split('@')[1].split(':')[0].split('+').map(Number);
    const [x0, w0] = xw(rows[0].locs.find((y) => idOf(y) === g));
    const at = (r) => r.locs.find((x) => idOf(x) === g || (Math.abs(xw(x)[0] - x0) < 14 && Math.abs(xw(x)[1] - w0) < 8));
    let missing = null;
    rows.forEach((r, i) => {
      const here = !!at(r);
      if (!here && missing == null) missing = i;
      if (here && missing != null) { bad.push(`flash: ${g} missing at ${rows[missing].t - t0} ms, back at ${r.t - t0} ms`); missing = null; }
    });
    // A snap: it vanished whole (never burned or faded before it went).
    const seen = rows.map(at).filter(Boolean);
    if (!seen.some((x) => x.includes(':burn') || Number(x.split(':')[1]) < 0.9)) bad.push(`snap: ${g} vanished without burning away`);
    // A snap: its label or dominance line gone before its burn began.
    const lab = rows.findIndex((r) => !r.labels.some((x) => x.startsWith(g)));
    if (lab >= 0 && burnAt != null && lab < burnAt) bad.push(`snap: ${g}'s label gone at ${rows[lab].t - t0} ms, before its burn (${rows[burnAt].t - t0} ms)`);
    const dl = rows.findIndex((r) => !r.doms.includes(g));
    if (dl >= 0 && burnAt != null && dl < burnAt) bad.push(`snap: ${g}'s dominance line gone at ${rows[dl].t - t0} ms, before its burn (${rows[burnAt].t - t0} ms)`);
  }
  // Creatures' stats changing before the burn began (the Location's bonus taken away early).
  if (burnAt != null) {
    const tabs0 = rows[0].tabs;
    const ch = rows.findIndex((r) => r.tabs !== tabs0);
    if (ch >= 0 && ch < burnAt && name !== 'legend') bad.push(`snap: stats changed at ${rows[ch].t - t0} ms (${tabs0} → ${rows[ch].tabs}), before the burn (${rows[burnAt].t - t0} ms)`);
  }
  // A resize: the Wyrm (or its ghost) narrower than its 3 lanes while shown.
  if (name === 'legend') {
    const w0 = rows[0].wide.map((x) => Number(x.split('@')[1].split('+')[1]))[0] ?? 0;
    rows.forEach((r) => {
      for (const x of r.wide) { const w = Number(x.split('@')[1].split(':')[0].split('+')[1]); if (w > 0 && w < w0 * 0.9 && !x.includes(':burn')) { bad.push(`resize: ${x} at ${r.t - t0} ms (was ${w0} px wide)`); return; } }
    });
    if (!w0) bad.push('the Wyrm was not on the board');
    wideBurnEnd = rows.findIndex((r, i) => i > 0 && !r.wide.length);
  }
  // Duplicates of the same failure, once.
  return { bad: [...new Set(bad)].slice(0, 12), lines, gone };
}

const cut = (r, dest) => { ff(['-i', r.file, '-vf', `trim=start=${r.from.toFixed(2)}:end=${r.to.toFixed(2)},setpts=(PTS-STARTPTS)/${K},fps=60`, '-an', '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', dest]); return (r.to - r.from) / K; };
let fails = 0;
const tag = LOW ? '-low' : '';
for (const name of Object.keys(SCENES)) {
  if (only.length && !only.includes(name)) continue;
  const rn = await record(name, 'new');
  const ro = newOnly || checkOnly ? null : await record(name, 'old');
  const cn = check(rn.rows, name);
  const co = ro ? check(ro.rows, name) : null;
  await writeFile(join(out, `x3-leave-${name}${tag}-frames.txt`), [`AFTER: ${cn.bad.length ? cn.bad.join('\n  ') : 'no jump, flash or resize'}`, ...cn.lines, '', ro ? `BEFORE: ${co.bad.join('\n  ') || 'none found'}` : '', ...(co?.lines ?? [])].join('\n'));
  log(`${name}${tag}: after: ${cn.bad.length ? `FAIL\n  ${cn.bad.join('\n  ')}` : 'smooth'}${co ? `; before: ${co.bad.length} problem(s)${co.bad.length ? `\n  ${co.bad.slice(0, 4).join('\n  ')}` : ''}` : ''}`);
  if (cn.bad.length) fails++;
  if (checkOnly || !rn.file) continue;
  const tn = join(raw, `leave-${name}${tag}-new.webm`); const to = join(raw, `leave-${name}${tag}-old.webm`);
  const ln = cut(rn, tn); const lo = ro?.file ? cut(ro, to) : 0;
  ff(['-i', tn, '-vf', `fps=${(12 / ln).toFixed(4)},scale=480:-1,tile=6x2`, '-frames:v', '1', join(out, `x3-leave-${name}${tag}-strip.png`)]);
  if (ro?.file) ff(['-i', to, '-i', tn, '-filter_complex', '[0]scale=960:540,tpad=stop_mode=clone:stop_duration=8[a];[1]scale=960:540,tpad=stop_mode=clone:stop_duration=8[b];[a][b]hstack=inputs=2,fps=60[v]',
    '-map', '[v]', '-t', Math.max(lo, ln).toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', join(out, `x3-leave-${name}${tag}-before-vs-after.webm`)]);
  else ff(['-i', tn, '-c:v', 'copy', join(out, `x3-leave-${name}${tag}.webm`)]);
}
await browser.close();
NEW.sv.close(); OLD?.sv.close();
process.exit(fails ? 1 : 0);
