// Clips for review (stage F), each with a frame strip (10 frames): tools/clips/f-<name>.webm and f-<name>-strip.png.
//   f-attack-defeat ← an AI-vs-AI match until an attack defeats its target: the wind-up, the lunge, the impact, the
//                     defeated card staying through the hit, its cracks and burn-away, the ash to the Released Pile
//   f-react-moment  ← a React moment from start to finish: the enemy attacks, the board dims, the plates; the pointer
//                     hovers a plate (its preview on the board), then lets it happen; the dimming lifts, the attack plays
//   f-target-arrow  ← choosing a target: an attacker is picked, the arrow draws out and follows the pointer across the
//                     board, tightens on a legal target, and the target is chosen (the arrow goes; the attack plays)
//
// Usage: node tools/fclips.mjs
// Needs Playwright with Chromium and ffmpeg (dev tools only; never runtime dependencies).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tools', 'clips');
const rawDir = join(outDir, 'raw-f');
await mkdir(rawDir, { recursive: true });
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();

async function record(name, query, script) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const span = await script(page, () => (Date.now() - t0) / 1000);
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  const [from, to] = span;
  const clip = join(outDir, `f-${name}.webm`);
  const dur = to - from;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', from.toFixed(2), '-i', file, '-t', dur.toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '2M', '-row-mt', '1', '-an', clip]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', (from + 0.1).toFixed(2), '-i', file, '-t', (dur - 0.2).toFixed(2), '-vf', `fps=${(10 / (dur - 0.2)).toFixed(3)},scale=480:-1,tile=5x2`, '-frames:v', '1', join(outDir, `f-${name}-strip.png`)]);
  console.log(`f-${name}: ${dur.toFixed(1)} s`);
}
const centreOf = async (page, sel, i = 0) => { const els = await page.$$(sel); const b = els[i] ? await els[i].boundingBox() : null; return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; };

// An attack that defeats its target, at normal speed.
await record('attack-defeat', '?seed=7&scene=mid&autoplay=1&pace=400&speed=normal&lowmotion=0', async (page, now) => {
  await page.waitForTimeout(2500);
  for (let i = 0; i < 4000; i++) {
    const st = await page.evaluate(() => ({ e: document.body.dataset.effect ?? '', n: document.body.dataset.beatsStarted }));
    if (st.e.startsWith('attack.')) {
      const from = now();
      // Until a defeat in this action has burnt away (or the action ends without one: keep looking).
      let defeat = false;
      for (let j = 0; j < 400; j++) {
        const s2 = await page.evaluate(() => ({ e: document.body.dataset.effect, presenting: document.body.dataset.presenting === '1' }));
        if (s2.e === 'defeat') defeat = true;
        if (!s2.presenting) break;
        await page.waitForTimeout(20);
      }
      if (defeat) return [Math.max(0, from - 0.4), now() + 0.4];
    }
    await page.waitForTimeout(15);
  }
  throw new Error('no attack with a defeat was seen');
});

// A React moment, from the enemy's attack to the result.
await record('react-moment', '?seed=7&scene=react-attack&pace=100000&speed=normal&lowmotion=0', async (page, now) => {
  await page.waitForSelector('[data-region="react-moment"]');
  const from = now() - 0.3;
  await page.mouse.move(1500, 950);
  await page.waitForTimeout(900);
  const plate = await centreOf(page, '.rx-plate[data-i="0"]');
  if (plate) { await page.mouse.move(plate.x, plate.y, { steps: 18 }); await page.waitForTimeout(1600); }
  const let1 = await centreOf(page, '.rx-plate.let');
  if (let1) { await page.mouse.move(let1.x, let1.y, { steps: 10 }); await page.waitForTimeout(900); await page.mouse.click(let1.x, let1.y); }
  await page.waitForTimeout(300);
  for (let i = 0; i < 300 && (await page.evaluate(() => document.body.dataset.presenting === '1')); i++) await page.waitForTimeout(20);
  await page.waitForTimeout(500);
  return [Math.max(0, from), now()];
});

// Choosing a target with the arrow.
await record('target-arrow', '?seed=2&scene=mid&pace=100000&speed=normal&lowmotion=0', async (page, now) => {
  await page.waitForTimeout(1200);
  const a = await centreOf(page, '[data-act="attacker"]');
  await page.mouse.move(a.x, a.y - 40, { steps: 6 });
  await page.waitForTimeout(300);
  const from = now() - 0.2;
  await page.mouse.click(a.x, a.y - 40);
  await page.waitForTimeout(250);
  // Across open board, then onto a legal target.
  for (const [x, y] of [[900, 640], [1100, 420], [800, 330]]) { await page.mouse.move(x, y, { steps: 14 }); await page.waitForTimeout(150); }
  const t = await centreOf(page, '[data-pick]');
  await page.mouse.move(t.x, t.y, { steps: 16 });
  await page.waitForTimeout(700);
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(200);
  for (let i = 0; i < 300 && (await page.evaluate(() => document.body.dataset.presenting === '1')); i++) await page.waitForTimeout(20);
  await page.waitForTimeout(400);
  return [Math.max(0, from), now()];
});

await browser.close();
server.close();
await rm(rawDir, { recursive: true, force: true });
