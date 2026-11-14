// Clips for review (stage V1): records AI-vs-AI matches with the effects on (Playwright video, normal speed)
// and cuts a short clip of each storyboard moment, plus a frame strip (10 frames) of each.
// Saved to tools/clips/<name>.webm and tools/clips/<name>-strip.png.
//
// Usage: node tools/clips.mjs
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
const rawDir = join(outDir, 'raw');
await mkdir(rawDir, { recursive: true });

// The moments: a clip name and the effect (with flags) that starts it.
const WANT = [
  { name: 'martial-attack', effect: 'attack.martial' },
  { name: 'arcane-attack', effect: 'attack.arcane' },
  { name: 'defeat', effect: 'defeat' },
  { name: 'heavy-summon', effect: 'summon', flag: 'heavy' },
  { name: 'renown', effect: 'renown' },
  { name: 'strat-resolving', effect: 'strat.resolve' },
  { name: 'wyrm-on-summon', effect: 'wyrm.onsummon' },
  { name: 'heal', effect: 'heal' },
];
const SEEDS = (process.argv[2] ?? '7,5,11,3,21,42,8,13,17,29').split(',').map(Number);

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const found = new Map();
for (const seed of SEEDS) {
  if (found.size === WANT.length) break;
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const hits = [];
  await page.goto(`http://127.0.0.1:${server.address().port}/?seed=${seed}&scene=mid&autoplay=1&pace=400&speed=normal&lowmotion=0`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);   // the painted textures load
  let last = '';
  const started = Date.now();
  while (found.size + hits.length < WANT.length && Date.now() - started < 8 * 60 * 1000) {
    const st = await page.evaluate(() => ({ e: document.body.dataset.effect ?? '', f: document.body.dataset.effectFlags ?? '', n: document.body.dataset.beatsStarted, end: !!document.querySelector('[data-region="end"]') }));
    const key = `${st.n}:${st.e}`;
    if (key !== last) {
      last = key;
      const w = WANT.find((x) => x.effect === st.e && (!x.flag || st.f.split(' ').includes(x.flag)) && !found.has(x.name) && !hits.some((h) => h.name === x.name));
      if (w) {
        const at = Date.now() - t0;
        const n = st.n;
        // Until that beat is done.
        for (let i = 0; i < 400 && (await page.evaluate((k) => Number(document.body.dataset.beatsDone) < Number(k), n)); i++) await page.waitForTimeout(20);
        hits.push({ ...w, from: at / 1000, to: (Date.now() - t0) / 1000 });
      }
    }
    if (st.end) break;
    await page.waitForTimeout(15);
  }
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  for (const h of hits) {
    const ss = Math.max(0, h.from - 0.4);
    const dur = Math.min(4, h.to - h.from + 0.9);
    const clip = join(outDir, `${h.name}.webm`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', ss.toFixed(2), '-i', file, '-t', dur.toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '2M', '-an', clip]);
    // A strip of 10 frames across the moment.
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', (ss + 0.3).toFixed(2), '-i', file, '-t', (dur - 0.4).toFixed(2), '-vf', `fps=${(10 / (dur - 0.4)).toFixed(3)},scale=480:-1,tile=5x2`, '-frames:v', '1', join(outDir, `${h.name}-strip.png`)]);
    found.set(h.name, { seed, file: clip });
    console.log(`${h.name}: seed ${seed}, ${dur.toFixed(1)} s`);
  }
}
await browser.close();
server.close();
await rm(rawDir, { recursive: true, force: true });
const missing = WANT.filter((w) => !found.has(w.name)).map((w) => w.name);
console.log(missing.length ? `Not seen: ${missing.join(', ')}` : `All ${WANT.length} clips recorded in tools/clips/.`);
