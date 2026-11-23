// Stage N2: a frame of each new effect (docs/36 section 4), each played through the real presenter from ?fxdemo's
// stage N2 moments (src/ui/fxdemo.js). The container renders WebGL in software, so the page runs in slow motion
// (tools/slowmo.mjs) and the frame is taken part-way into the effect: n2-fx-<moment>.png in tools/screenshots/.
//
// Usage: node tools/n2fx.mjs [moment …]   (all by default)
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';
import { slowMo } from './slowmo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const K = 12;
// moment: [the effect to catch, how far into it (0–1), what it shows]
const MOMENTS = {
  'n2-chill': ['kw.chill', 0.3, 'Chill: frost crust and ice shards on Hilde as the Rime Elemental freezes her'],
  'n2-venom': ['kw.venom', 0.4, 'Venom: venom drips down the creature the Mirefang bit'],
  'n2-frenzy': ['kw.frenzy', 0.35, 'Frenzy: the rage aura flares round the hurt Warbear'],
  'n2-deepmaw': ['water.surge', 0.35, 'The Deepmaw rising on its water surge'],
  'n2-chain': ['lightning.chain', 0.35, 'Chain Lightning forking across a Location'],
  'n2-stormbreak': ['location.storm', 0.25, 'Stormbreak Crags placed: forked lightning across its lanes'],
  'n2-stormwing': ['attack.soaring', 0.7, 'The Skyreach Stormwing\'s Soaring strike with forked lightning'],
  'n2-grusha': ['lightning.red', 0.35, 'Grusha the Stormcaller\'s On Dusk: red forked lightning'],
  'n2-drowned': ['water.dusk', 0.3, 'The Drowned Reach at Dusk: the water surges over the creature in it'],
};
const only = process.argv.slice(2);
let failures = 0;
for (const [name, [fx, frac, what]] of Object.entries(MOMENTS)) {
  if (only.length && !only.includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const slow = await slowMo(ctx, page, 1);
  await page.goto(`${base}?seed=10&scene=mid&pace=100000&timer=off&speed=normal`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return !v || (v.standIns.length === 0 && v.ready >= 110); }, null, { timeout: 120000, polling: 250 });
  await page.waitForTimeout(600);
  await slow.set(K);
  const run = page.evaluate((n) => window.__match.fxDemo(n), name);
  let done = false; let result = null;
  run.then((r) => { done = true; result = r; }, (e) => { done = true; result = { error: e.message }; });
  let caught = false;
  const t0 = Date.now();
  while (!done && Date.now() - t0 < 240000) {
    const e = await page.evaluate(() => document.body.dataset.effect ?? '').catch(() => '');
    if (e === fx) {
      const dur = 800;   // (frac is of 800 ms, at true speed)
      await page.waitForTimeout(dur * frac * K);
      await page.screenshot({ path: join(root, 'tools', 'screenshots', `n2-fx-${name.slice(3)}.png`) });
      caught = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  while (!done && Date.now() - t0 < 240000) await new Promise((r) => setTimeout(r, 100));
  const textures = await page.evaluate(() => window.__match.vfx()?.used ?? null).catch(() => null);
  if (!caught || result?.error || errors.length) { failures += 1; console.log(`FAIL  ${name}: ${!caught ? `${fx} never played` : ''} ${result?.error ?? ''} ${errors.join(' ')}`); }
  else console.log(`PASS  ${name}: ${what} (n2-fx-${name.slice(3)}.png)${textures ? `; ${textures}` : ''}`);
  await ctx.close();
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
