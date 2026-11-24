// Stage X1 (docs/38): clips of every core moment rebuilt, before and after, with a frame strip, in tools/clips/x1/ (kept
// out of git). Each moment is staged by ?fxdemo (src/ui/fxdemo.js, stageX1) and played through the real presenter.
//   x1-<moment>-before-vs-after.webm  the old moment (left) and the rebuilt one (right), side by side
//   x1-<moment>-strip.png             12 frames across the rebuilt moment
//   x1-<moment>-low.webm              the rebuilt moment in low motion
// "Before" is the game as it was before stage X1 (a git worktree of BEFORE, with this stage's fxdemo.js copied in so the
// same moments can be staged). The container renders WebGL in software, so each moment is recorded in slow motion
// (tools/slowmo.mjs) and sped back up: the clips show true timing at 60 fps.
//
// Usage: node tools/x1clips.mjs [moment …] [--new-only]   (all by default)
// Needs Playwright with Chromium, ffmpeg and git (dev tools only).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { staticServer, withDev } from './serve.mjs';
import { slowMo } from './slowmo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tools', 'clips', 'x1');
const raw = join(out, 'raw');
await mkdir(raw, { recursive: true });
export const BEFORE = 'd97f9db';
export const MOMENTS = {
  combat: ['attack', 'x1-arcane', 'x1-ranger', 'x1-rogue', 'x1-beast', 'x1-undead', 'x1-wyrm', 'x1-soaring', 'x1-stormwing', 'x1-hitback', 'x1-riposte', 'x1-armour', 'x1-guard', 'x1-warlord', 'x1-fizzle'],
  defeat: ['x1-defeat', 'x1-defeat-stone', 'x1-defeat-undead', 'x1-defeat-treant', 'x1-defeat-ice', 'x1-undying'],
  summon: ['x1-summon-light', 'x1-summon-mid', 'x1-summon-heavy', 'prime', 'x1-choose', 'x1-rally'],
  cards: ['x1-draw'],
};
const args = process.argv.slice(2);
const newOnly = args.includes('--new-only');
const only = args.filter((a) => !a.startsWith('--'));
const want = (n) => !only.length || only.includes(n) || Object.entries(MOMENTS).some(([g, l]) => only.includes(g) && l.includes(n));
const log = (...a) => console.log(...a);
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const K = 10;

// The "before" tree.
const beforeDir = join(root, '..', `utcg-before-${BEFORE}`);
if (!newOnly) {
  if (!existsSync(beforeDir)) execFileSync('git', ['-C', root, 'worktree', 'add', '--detach', beforeDir, BEFORE], { stdio: 'ignore' });
  await copyFile(join(root, 'src', 'ui', 'fxdemo.js'), join(beforeDir, 'src', 'ui', 'fxdemo.js'));
}
const serve = async (dir) => { const sv = staticServer(dir); await new Promise((r) => sv.listen(0, '127.0.0.1', r)); return { sv, base: `http://127.0.0.1:${sv.address().port}/` }; };
const NEW = await serve(root);
const OLD = newOnly ? null : await serve(beforeDir);
const browser = await chromium.launch();

async function record(name, which, low = false) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: raw, size: { width: 1920, height: 1080 } } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now(); const sec = () => (Date.now() - t0) / 1000;
  const slow = await slowMo(ctx, page, 1);
  const base = which === 'old' ? OLD.base : NEW.base;
  await page.goto(withDev(`${base}?seed=10&scene=mid&pace=100000&timer=off&speed=normal&lowmotion=${low ? 1 : 0}`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return !v || (v.standIns.length === 0 && v.ready >= 60); }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  await page.waitForTimeout(600);
  await slow.set(K);
  const e0 = await page.evaluate(() => document.body.dataset.effectSeq ?? '0');
  const run = page.evaluate((n) => window.__match.fxDemo(n), name);
  let done = false; let res = null;
  run.then((r) => { done = true; res = r; }, (e) => { done = true; res = { error: e.message }; });
  let from = null;
  const tmax = Date.now() + 300000;
  while (!done && Date.now() < tmax) {
    const seq = await page.evaluate(() => document.body.dataset.effectSeq ?? '0').catch(() => e0);
    if (from === null && seq !== e0) from = sec();
    await new Promise((r) => setTimeout(r, 50));
  }
  const to = sec();
  await page.waitForTimeout(700 * K);
  const end = sec();
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  if (res?.error || from === null) { log(`  ${name} (${which}${low ? ', low' : ''}): ${res?.error ?? 'nothing played'} ${errors.join(' ')}`); return null; }
  if (errors.length) log(`  ${name} (${which}): page errors: ${errors.join(' | ')}`);
  return { file, from: Math.max(0, from - 0.3 * K), to: Math.min(end, to + 0.6 * K) };
}
const cut = (r, dest) => { ff(['-i', r.file, '-vf', `trim=start=${r.from.toFixed(2)}:end=${r.to.toFixed(2)},setpts=(PTS-STARTPTS)/${K},fps=60`, '-an', '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', dest]); return (r.to - r.from) / K; };

const summary = [];
for (const [group, list] of Object.entries(MOMENTS)) {
  for (const name of list) {
    if (!want(name)) continue;
    log(`${name}:`);
    const rec = { new: await record(name, 'new'), low: await record(name, 'new', true), old: newOnly ? null : await record(name, 'old') };
    const tmp = {}; const len = {};
    for (const k of ['old', 'new', 'low']) if (rec[k]) { tmp[k] = join(raw, `${name}-${k}.webm`); len[k] = cut(rec[k], tmp[k]); }
    if (tmp.new) {
      ff(['-i', tmp.new, '-vf', `fps=${(12 / len.new).toFixed(4)},scale=480:-1,tile=6x2`, '-frames:v', '1', join(out, `x1-${name}-strip.png`)]);
      if (tmp.old) {
        ff(['-i', tmp.old, '-i', tmp.new, '-filter_complex', '[0]scale=960:540,tpad=stop_mode=clone:stop_duration=6[a];[1]scale=960:540,tpad=stop_mode=clone:stop_duration=6[b];[a][b]hstack=inputs=2,fps=60[v]',
          '-map', '[v]', '-t', Math.max(len.old, len.new).toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', join(out, `x1-${name}-before-vs-after.webm`)]);
      } else ff(['-i', tmp.new, '-c:v', 'copy', join(out, `x1-${name}.webm`)]);
    }
    if (tmp.low) ff(['-i', tmp.low, '-c:v', 'copy', join(out, `x1-${name}-low.webm`)]);
    summary.push({ group, name, ok: !!tmp.new, s: len.new?.toFixed(2) });
    log(`  ${tmp.new ? `${len.new.toFixed(2)} s` : 'FAILED'}${tmp.old ? ` (before ${len.old.toFixed(2)} s)` : ''}`);
  }
}
// One contact video per group: the before-vs-after clips one after another.
for (const group of Object.keys(MOMENTS)) {
  const files = MOMENTS[group].map((n) => join(out, newOnly ? `x1-${n}.webm` : `x1-${n}-before-vs-after.webm`)).filter(existsSync);
  if (!files.length || (only.length && !only.includes(group))) continue;
  const list = join(raw, `${group}.txt`);
  (await import('node:fs')).writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', join(out, `x1-${group}-contact.webm`)]);
  log(`saved x1-${group}-contact.webm (${files.length} moments)`);
}
await browser.close();
NEW.sv.close(); OLD?.sv.close();
const failed = summary.filter((x) => !x.ok);
log(failed.length ? `FAILED: ${failed.map((x) => x.name).join(', ')}` : `All ${summary.length} moments recorded.`);
process.exit(failed.length ? 1 : 0);
