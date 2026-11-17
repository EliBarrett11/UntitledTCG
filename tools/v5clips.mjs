// Clips for review (V5), each with a frame strip (10 frames): tools/clips/v5-<name>.webm and v5-<name>-strip.png.
//   enemy-slow, enemy-normal, enemy-fast ← the enemy's turn at each pace (its think time, the dots, each action
//                                          announced over the board, then cleared)
//   thrown-item   ← Flask of Wildfire thrown at a creature: wind-up, eased launch, spin, trail, impact as it lands
//   effect-on-top ← an attack that defeats its target: the impact and the burn play over the card (and its ghost)
//   dusk-might    ← dominance at Dusk: each creature's Might pops up, counts into the totals, then the Renown flies
//   energy-spend  ← spending Energy, then Exert: the cost preview ("4 → 1"), the number counting down, the crystal
//                   pulsing, an Exert rune flaring into the number
//
// Usage: node tools/v5clips.mjs
// Needs Playwright with Chromium and ffmpeg (dev tools only; never runtime dependencies).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tools', 'clips');
const rawDir = join(outDir, 'raw-v5');
await mkdir(rawDir, { recursive: true });
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];

// (node tools/v5clips.mjs [name…]: only the clips whose names start with one of these.)
const only = process.argv.slice(2);
async function record(name, query, script) {
  if (only.length && !only.some((x) => name.startsWith(x))) return;
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  const t0 = Date.now();
  await page.goto(`${base}${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  let span;
  try { span = await script(page, () => (Date.now() - t0) / 1000); } catch (e) { errors.push(`${name}: ${e.message}`); }
  const video = page.video();
  await ctx.close();
  if (!span) return;
  const file = await video.path();
  const [from, to] = span;
  const dur = Math.max(0.6, to - from);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', from.toFixed(2), '-i', file, '-t', dur.toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '2M', '-row-mt', '1', '-an', join(outDir, `v5-${name}.webm`)]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', (from + 0.05).toFixed(2), '-i', file, '-t', (dur - 0.1).toFixed(2), '-vf', `fps=${(10 / (dur - 0.1)).toFixed(3)},scale=480:-1,tile=5x2`, '-frames:v', '1', join(outDir, `v5-${name}-strip.png`)]);
  console.log(`v5-${name}: ${dur.toFixed(1)} s`);
}
const until = async (page, fn, arg, ms = 240000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 20 });

// The enemy's turn at each pace (no ?pace: the pace setting decides its think time).
for (const speed of ['slow', 'normal', 'fast']) {
  // (Both sides play themselves for 12 s; the enemy's actions take its think time at this pace, and are announced.)
  await record(`enemy-${speed}`, `?seed=10&scene=mid&autoplay=1&speed=${speed}&lowmotion=0`, async (page, now) => {
    await page.waitForTimeout(600);
    const from = now();
    await page.waitForTimeout(12000);
    return [from, now()];
  });
}
// A thrown Item.
await record('thrown-item', '?seed=7&autoplay=1&pace=40&speed=normal&lowmotion=0&prefer=flask-of-wildfire:use', async (page, now) => {
  await until(page, () => document.querySelector('.fx.thrown'));
  const from = now() - 0.35;
  await until(page, () => !document.querySelector('.fx.thrown'), null, 8000);
  await page.waitForTimeout(1300);
  return [from, now()];
});
// An effect on a card, on top of it: an attack that defeats its target.
await record('effect-on-top', '?seed=7&scene=mid&autoplay=1&pace=300&speed=normal&lowmotion=0', async (page, now) => {
  for (;;) {
    await until(page, () => (document.body.dataset.effect ?? '').startsWith('attack.'));
    const from = now() - 0.2;
    let defeat = false;
    for (let j = 0; j < 400; j++) {
      const s2 = await page.evaluate(() => ({ e: document.body.dataset.effect, p: document.body.dataset.presenting === '1' }));
      if (s2.e === 'defeat') defeat = true;
      if (!s2.p) break;
      await page.waitForTimeout(20);
    }
    if (defeat) { await page.waitForTimeout(300); return [from, now()]; }
    await until(page, () => !(document.body.dataset.effect ?? '').startsWith('attack.'), null, 20000).catch(() => {});
  }
});
// Dusk: Might counted, then the Renown.
await record('dusk-might', '?seed=1&autoplay=1&pace=30&speed=normal&lowmotion=0', async (page, now) => {
  await until(page, () => document.querySelector('.fx.might-hex'));
  const from = now() - 0.3;
  await until(page, () => !document.querySelector('.fx.might-tally'), null, 10000).catch(() => {});
  await page.waitForTimeout(1800);
  return [from, now()];
});
// Spending Energy and Exert, by real clicks: The Ashen Wyrm costs 5 with 4 Energy left, so it spends the 4 and then
// an Exert point (one action per turn: a single card that needs both).
await record('energy-spend', '?seed=7&scene=mid&pace=100000&speed=normal&lowmotion=0', async (page, now) => {
  await page.waitForTimeout(800);
  const from = now();
  const play = async (cost) => {
    const i = await page.evaluate((c) => [...document.querySelectorAll('.hand-card')].findIndex((el) => window.__match.state().players.p1.hand.find((x) => x.uid === el.dataset.uid && (x.cardType === 'Character' || x.cardType === 'Monster') && x.cost === c)), cost);
    if (i < 0) throw new Error(`no ${cost}-cost creature in hand`);
    // (The hover preview first: the cost preview shows on the Energy display.)
    const b = await (await page.$$('.hand-card'))[i].boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + 80, { steps: 6 });
    await page.waitForTimeout(900);   // the cost preview
    await page.mouse.click(b.x + b.width / 2, b.y + 80);
    await page.waitForTimeout(300);
    const summon = await page.$('.menu-item:has-text("Summon")');
    if (summon) { await summon.click(); await page.waitForTimeout(300); }
    // (Then whatever it asks: its space, and a target for its On Summon.)
    for (let k = 0; k < 4 && (await page.evaluate(() => (document.body.dataset.step ?? '').startsWith('sel'))); k++) {
      const pick = await page.$('[data-pick]');
      if (!pick) break;
      await pick.click();
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(400);
    await until(page, () => document.body.dataset.presenting !== '1', null, 30000).catch(() => {});
    await page.waitForTimeout(900);
  };
  await play(5);
  return [from, now()];
});

await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
