// Clips for judging stage E (docs/22 section 5), at 1920×1080 and 60 fps, in tools/clips/:
//   e-<moment>-old-vs-new.webm  the old effect (left) and the new one (right), side by side, each from the same position
//   e-<moment>-strip.png        12 frames across the new moment's run
//   e-<moment>-low.webm         the new moment in low motion
//   e-match.webm                the new moments as they came up in a real match against the AI (autoplay)
// Moments: attack (Garrick, the Oathsworn Captain defeats a Barrow Shade), firebolt-adapt, firebolt-react, firebolt-strat,
// prime (a Prime summon). Each is staged by ?fxdemo's hook (src/ui/fxdemo.js) and played through the real presenter.
//
// The container renders WebGL in software (a few frames a second), so each moment is recorded in slow motion (the page's
// clock and animations K times slower: tools/slowmo.mjs) and sped back up: the clips show true timing at 60 fps.
//
// Usage: node tools/eclips.mjs [moment|match …]   (all by default)
// Needs Playwright with Chromium and ffmpeg (dev tools only; never runtime dependencies).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { staticServer, withDev } from './serve.mjs';
import { slowMo } from './slowmo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tools', 'clips');
const raw = join(out, 'raw-e');
await mkdir(raw, { recursive: true });
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const K = 36;
const only = process.argv.slice(2);
const want = (n) => !only.length || only.includes(n);
const log = (...a) => console.log(...a);

// The effects each moment is made of (new, and the old ones they replace).
const PARTS = {
  attack: { new: ['e.attack.steel', 'e.defeat'], old: ['attack.oathsworn', 'defeat'] },
  'firebolt-adapt': { new: ['e.firebolt'], old: ['spell.firebolt'] },
  'firebolt-react': { new: ['react', 'e.firebolt.react'], old: ['react', 'firebolt.react'] },
  'firebolt-strat': { new: ['strat.resolve', 'e.firebolt.strat'], old: ['strat.resolve', 'firebolt.strat'] },
  prime: { new: ['summon', 'e.prime'], old: ['summon', 'prime.summon'] },
};
const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

// One recording: the page at normal speed until every painted texture is in, then slow motion for the moment.
// Returns { file, from, to } (seconds of the raw video) for the moment's run.
async function recordMoment(name, mode) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: raw, size: { width: 1920, height: 1080 } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const sec = () => (Date.now() - t0) / 1000;
  page.on('pageerror', (e) => log(`  page error: ${e.message}`));
  const slow = await slowMo(ctx, page, 1);
  const q = `?seed=10&scene=mid&pace=100000&timer=off&speed=normal&lowmotion=${mode === 'low' ? 1 : 0}${mode === 'old' ? '&fx=old' : ''}`;
  await page.goto(withDev(`${base}${q}`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return !v || (v.standIns.length === 0 && v.ready >= 110); }, null, { timeout: 120000, polling: 250 });
  await page.waitForTimeout(800);
  await slow.set(K);
  const parts = new Set(PARTS[name][mode === 'old' ? 'old' : 'new']);
  let from = null; let to = null; let last = '';
  const run = page.evaluate((n) => window.__match.fxDemo(n), name);
  let done = false;
  run.then(() => { done = true; }, () => { done = true; });
  // Watch the effect running: the clip spans the moment's parts, with a little lead-in and settle.
  while (!done) {
    const e = await page.evaluate(() => document.body.dataset.effect ?? '').catch(() => '');
    if (e !== last) {
      if (parts.has(e) && from === null) from = sec();
      if (from !== null && !parts.has(e) && parts.has(last)) to = sec();
      last = e;
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  if (from !== null && to === null) to = sec();
  // (The settle after the last part: 0.7 s at true speed.)
  await page.waitForTimeout(700 * K);
  const end = sec();
  const res = await run.catch((err) => ({ error: err.message }));
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  if (res?.error || from === null) { log(`  ${name} (${mode}): ${res?.error ?? 'the moment never played'}`); return null; }
  return { file, from: Math.max(0, from - 0.25 * K), to: Math.min(end, to + 0.7 * K) };
}
// The raw stretch, sped back up K times, at 60 fps.
function cut(r, dest, { w = 1920, h = 1080 } = {}) {
  ff(['-i', r.file, '-vf', `trim=start=${r.from.toFixed(2)}:end=${r.to.toFixed(2)},setpts=(PTS-STARTPTS)/${K},fps=60,scale=${w}:${h}`, '-an', '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', dest]);
  return (r.to - r.from) / K;
}

for (const name of Object.keys(PARTS)) {
  if (!want(name)) continue;
  log(`${name}:`);
  const recs = {};
  for (const mode of ['old', 'new', 'low']) recs[mode] = await recordMoment(name, mode);
  const tmp = {};
  for (const mode of ['old', 'new', 'low']) {
    if (!recs[mode]) continue;
    tmp[mode] = join(raw, `${name}-${mode}.webm`);
    const d = cut(recs[mode], tmp[mode]);
    log(`  ${mode}: ${d.toFixed(2)} s`);
  }
  if (tmp.old && tmp.new) {
    ff(['-i', tmp.old, '-i', tmp.new, '-filter_complex', '[0]scale=960:540,tpad=stop_mode=clone:stop_duration=4[a];[1]scale=960:540,tpad=stop_mode=clone:stop_duration=4[b];[a][b]hstack=inputs=2,fps=60[v]',
      '-map', '[v]', '-t', Math.max(...['old', 'new'].map((m) => (recs[m].to - recs[m].from) / K)).toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', join(out, `e-${name}-old-vs-new.webm`)]);
    log(`  saved e-${name}-old-vs-new.webm`);
  }
  if (tmp.new) {
    const d = (recs.new.to - recs.new.from) / K;
    ff(['-i', tmp.new, '-vf', `fps=${(12 / d).toFixed(4)},scale=480:-1,tile=6x2`, '-frames:v', '1', join(out, `e-${name}-strip.png`)]);
    log(`  saved e-${name}-strip.png`);
  }
  if (tmp.low) { ff(['-i', tmp.low, '-c:v', 'copy', join(out, `e-${name}-low.webm`)]); log(`  saved e-${name}-low.webm`); }
}

// A real match against the AI: autoplay at normal speed. The page slows itself the instant one of the new moments starts
// (a watch on the presenter's effect counter), and the tool speeds it back up once that effect's length has passed; those
// stretches, in the order they came, make the clip.
if (want('match')) {
  log('match:');
  const LEN = { 'e.attack.steel': 1250, 'e.defeat': 1000, 'e.firebolt': 1000, 'e.firebolt.react': 600, 'e.firebolt.strat': 1300, 'e.prime': 900 };
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: raw, size: { width: 1920, height: 1080 } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const sec = () => (Date.now() - t0) / 1000;
  const slow = await slowMo(ctx, page, 1);
  await page.goto(withDev(`${base}?seed=7&autoplay=1&pace=60&speed=normal&lowmotion=0&prefer=firebolt:react,firebolt:strat,firebolt:adapt`), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return !v || (v.standIns.length === 0 && v.ready >= 110); }, null, { timeout: 120000, polling: 250 });
  await page.evaluate(([names, k]) => {
    window.__eHits = [];
    new MutationObserver(() => {
      const e = document.body.dataset.effect ?? '';
      if (names.includes(e) && window.__slowK() === 1) { window.__slowMo(k); window.__eHits.push(e); }
    }).observe(document.body, { attributes: true, attributeFilter: ['data-effect-seq'] });
  }, [Object.keys(LEN), K]);
  const spans = []; let done = 0;
  const t1 = Date.now();
  while (Date.now() - t1 < 25 * 60 * 1000 && spans.length < 7) {
    const st = await page.evaluate(() => ({ hits: window.__eHits.slice(), over: !!document.querySelector('[data-region="end"]') })).catch(() => null);
    if (!st || st.over) break;
    if (st.hits.length > done) {
      const what = st.hits[done]; done += 1;
      await slow.set(K);
      const from = sec() - 1;   // (the page slowed itself at the start; this only covers the poll's delay)
      await page.waitForTimeout((LEN[what] + 700) * K);
      spans.push({ from, to: sec(), what });
      await slow.set(1);
      // (Skip the moments that came while this one was slowed: they start a span of their own only after it.)
      done = await page.evaluate(() => window.__eHits.length);
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  await writeFile(join(raw, 'match-spans.json'), JSON.stringify({ file, spans }, null, 1));
  const parts = [];
  spans.forEach((s, i) => { const f = join(raw, `match-${i}.webm`); cut({ file, from: Math.max(0, s.from), to: s.to }, f); parts.push(f); });
  if (parts.length) {
    ff([...parts.flatMap((f) => ['-i', f]), '-filter_complex', `${parts.map((_, i) => `[${i}:v]`).join('')}concat=n=${parts.length}:v=1[v]`, '-map', '[v]', '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', join(out, 'e-match.webm')]);
    log(`  saved e-match.webm: ${spans.map((s) => s.what).join(', ')}`);
  } else log('  no new moment came up');
}

await browser.close();
server.close();
await rm(raw, { recursive: true, force: true });
