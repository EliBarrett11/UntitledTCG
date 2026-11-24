// Stage X1b (docs/40): the proof frames. For each core moment, a side-by-side frame at impact and at +600 ms: the
// template's Firebolt (docs/vfx-template, ?v=adapt) on the left, the moment on the right, each at full 1920×1080.
// The page's clock is slowed (tools/slowmo.mjs) and frozen at the exact instants, so the software renderer can't skip
// them. "Impact" is the first hit-stop (body.dataset.impactSeq) plus 200 ms (past the hit-stop and the first 80 ms
// of white-hot light), then +600 ms after that; a moment with no hit (a summon, a draw) is caught at its peak instead (its first effect + 500 ms).
// Also reports the particles alive at impact.
//   tools/clips/x1b/x1b-<moment>-proof.jpg   2×2: template | moment, impact (top) and +600 ms (bottom), 3840×2160
//   tools/clips/x1b/x1b-proof-counts.json    particles alive at each frame
//
// Usage: node tools/x1bproof.mjs [moment|group …]   (all by default)
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { staticServer, withDev } from './serve.mjs';
import { slowMo } from './slowmo.mjs';
import { MOMENTS } from './x1moments.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tools', 'clips', 'x1b');
const raw = join(out, 'raw');
await mkdir(raw, { recursive: true });
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const want = (n) => !only.length || only.includes(n) || Object.entries(MOMENTS).some(([g, l]) => only.includes(g) && l.includes(n));
const log = (...a) => console.log(...a);
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const AFTER = 200; const LATER = 800; const K = 20; const FREEZE = 1e9;

const sv = staticServer(root); await new Promise((r) => sv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${sv.address().port}/`;
const browser = await chromium.launch();

// In the page: freeze the clock at a virtual time (a virtual timeout, so it lands on the instant).
const freezeAt = (page, ms) => page.evaluate((m) => new Promise((res) => setTimeout(() => { window.__slowMo(1e9); res(performance.now()); }, m)), ms);

async function template() {
  const f = join(raw, 'template-impact.png'); const g = join(raw, 'template-later.png'); const c = join(raw, 'template.json');
  if (existsSync(f) && existsSync(g) && existsSync(c)) return JSON.parse(await readFile(c, 'utf8'));
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await slowMo(ctx, page, FREEZE);
  await page.goto(`${base}docs/vfx-template/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 180000 });
  await page.addStyleTag({ content: 'body > *:not(canvas) { visibility: hidden !important } canvas { visibility: visible !important }' }).catch(() => {});
  const hit = 650 + 430;
  const counts = {};
  counts.impact = await page.evaluate((ms) => window.__seek('adapt', ms), hit + AFTER);
  await page.waitForTimeout(400); await page.screenshot({ path: f });
  counts.later = await page.evaluate((ms) => window.__seek('adapt', ms), hit + LATER);
  await page.waitForTimeout(400); await page.screenshot({ path: g });
  await ctx.close();
  await writeFile(c, JSON.stringify(counts));
  return counts;
}

async function moment(name) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const slow = await slowMo(ctx, page, 1);
  await page.goto(withDev(`${base}?seed=10&scene=mid&pace=100000&timer=off&speed=normal&lowmotion=0&vfxquality=0`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return !v || (v.standIns.length === 0 && v.ready >= 60); }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  await page.waitForTimeout(600);
  // Catch the instant in the page itself: the first hit-stop (or, failing one, the first effect + 500 ms).
  await page.evaluate(({ after, later }) => {
    const b = document.body; const i0 = b.dataset.impactSeq ?? '0'; const e0 = b.dataset.effectSeq ?? '0';
    window.__proof = { phase: 0, kind: null, t0: null };
    const arm = (kind, delay) => {
      if (window.__proof.kind) return;
      window.__proof.kind = kind; window.__proof.t0 = performance.now();
      setTimeout(() => { window.__slowMo(1e9); window.__proof.phase = 1; window.__proof.alive = window.__match.vfx()?.alive ?? 0; }, delay);
      window.__proof.next = () => { window.__proof.phase = 2; setTimeout(() => { window.__slowMo(1e9); window.__proof.phase = 3; window.__proof.alive2 = window.__match.vfx()?.alive ?? 0; }, later - delay); };
    };
    new MutationObserver(() => {
      if ((b.dataset.impactSeq ?? '0') !== i0) arm('impact', after);
    }).observe(b, { attributes: true, attributeFilter: ['data-impact-seq'] });
    new MutationObserver(() => {
      if ((b.dataset.effectSeq ?? '0') !== e0) setTimeout(() => arm('peak', 0), 500);
    }).observe(b, { attributes: true, attributeFilter: ['data-effect-seq'] });
  }, { after: AFTER, later: LATER });
  await slow.set(K);
  page.evaluate((n) => window.__match.fxDemo(n), name).catch((e) => { if (!/closed/.test(e.message)) errors.push(e.message); });
  const waitPhase = async (p) => { const t = Date.now() + 400000; while (Date.now() < t) { if ((await page.evaluate(() => window.__proof.phase)) >= p) return true; await new Promise((r) => setTimeout(r, 40)); } return false; };
  const shots = {};
  if (await waitPhase(1)) {
    await slow.cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await page.waitForTimeout(500);
    shots.impact = join(raw, `${name}-impact.png`); await page.screenshot({ path: shots.impact });
    if (process.env.PROOF_DEBUG) { log(JSON.stringify(await page.evaluate(() => window.__match.vfxApi.debugState()))); log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.slot-card')].map((e) => { const r = e.getBoundingClientRect(); return [e.textContent.slice(0, 20), Math.round(r.x), Math.round(r.y), Math.round(r.width)]; })))); await page.addStyleTag({ content: 'canvas{visibility:hidden!important}', }).then((h) => h); await page.screenshot({ path: join(raw, `${name}-impact-nogl.png`) }); await page.evaluate(() => { const s = [...document.querySelectorAll('style')].pop(); s.remove(); }); }
    await slow.cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / K });
    await page.evaluate((k) => { window.__slowMo(k); window.__proof.next(); }, K);
    if (await waitPhase(3)) {
      await slow.cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
      await page.waitForTimeout(500);
      shots.later = join(raw, `${name}-later.png`); await page.screenshot({ path: shots.later });
    }
  }
  const info = await page.evaluate(() => ({ q: window.__match.vfx()?.qualityName, kind: window.__proof.kind, alive: window.__proof.alive, alive2: window.__proof.alive2 }));
  await ctx.close();
  return { ...info, shots, errors };
}

const T = await template();
log(`template: ${T.impact} particles at impact, ${T.later} at +600 ms`);
const counts = existsSync(join(out, 'x1b-proof-counts.json')) ? JSON.parse(await readFile(join(out, 'x1b-proof-counts.json'), 'utf8')) : {};
counts.template = { impact: T.impact, later: T.later };
const label = (txt) => `drawtext=text='${txt}':x=24:y=20:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=10`;
for (const list of Object.values(MOMENTS)) for (const name of list) {
  if (!want(name)) continue;
  const r = await moment(name);
  if (!r.shots.impact || !r.shots.later) { log(`${name}: FAILED ${r.errors.join(' | ')}`); counts[name] = { failed: true }; continue; }
  counts[name] = { kind: r.kind, impact: r.alive, later: r.alive2 };
  const at = r.kind === 'impact' ? 'impact' : 'peak';
  ff(['-i', join(raw, 'template-impact.png'), '-i', r.shots.impact, '-i', join(raw, 'template-later.png'), '-i', r.shots.later, '-filter_complex',
    `[0]${label('Template Firebolt · impact')}[a];[1]${label(`${name} · ${at} · ${r.alive} particles`)}[b];[2]${label(`Template · +600 ms`)}[c];[3]${label(`${name} · +600 ms`)}[d];[a][b]hstack[t];[c][d]hstack[u];[t][u]vstack`,
    '-q:v', '3', join(out, `x1b-${name}-proof.jpg`)]);
  log(`${name} [${r.q}]: ${r.kind}, ${r.alive} particles at ${at}, ${r.alive2} at +600 ms${r.errors.length ? `  errors: ${r.errors.join(' | ')}` : ''}`);
  await writeFile(join(out, 'x1b-proof-counts.json'), JSON.stringify(counts, null, 1));
}
await browser.close(); sv.close();
