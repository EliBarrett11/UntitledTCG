// Clips for review (stages V1 and V2): records AI-vs-AI matches with the effects on (Playwright video, normal
// speed) and cuts a short clip of each moment, plus a frame strip (10 frames) of each.
// Saved to tools/clips/<name>.webm and tools/clips/<name>-strip.png.
//
// Usage: node tools/clips.mjs [v1|v2|p]   (v2 by default)
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

// The moments: a clip name, the effect (with a flag) that starts it, and whether it lasts one beat or until the
// whole action has been shown (a cinematic, Dusk's scoring).
const SETS = {
  v1: {
    want: [
      { name: 'martial-attack', effect: 'attack.martial' },
      { name: 'arcane-attack', effect: 'attack.arcane' },
      { name: 'defeat', effect: 'defeat' },
      { name: 'heavy-summon', effect: 'summon', flag: 'heavy' },
      { name: 'renown', effect: 'renown' },
      { name: 'strat-resolving', effect: 'strat.resolve' },
      { name: 'wyrm-on-summon', effect: 'wyrm.onsummon' },
      { name: 'heal', effect: 'heal' },
    ],
    runs: [7, 5, 11, 3, 21, 42, 8, 13].map((seed) => `?seed=${seed}&scene=mid`),
  },
  v2: {
    want: [
      { name: 'v2-martial-attack', effect: 'attack.oathsworn', flag: '!final' },
      { name: 'v2-defeat', effect: 'defeat' },
      { name: 'v2-ironhide', effect: 'attack.ironhide' },
      { name: 'v2-archmagus', effect: 'attack.spire', flag: 'lightning' },
      { name: 'v2-pathfinder', effect: 'attack.thornwood', flag: 'final' },
      { name: 'v2-firebolt-strat', effect: 'firebolt.strat' },
      { name: 'v2-night-raid-strat', effect: 'nightraid.strat' },
      { name: 'v2-call-to-arms-favour', effect: 'event', flag: 'horn+favour' },
      { name: 'v2-location', effect: 'location' },
      { name: 'v2-dusk-scoring', effect: 'dusk', until: 'action', need: 'dominance.scored' },
      { name: 'v2-cinematic-wyrm', effect: 'cine.wyrm', until: 'action' },
      { name: 'v2-cinematic-aldric', effect: /^cine\.aldric(\.quest)?$/, until: 'action' },
      { name: 'v2-cinematic-last-battle', effect: 'cine.last', until: 'action' },
    ],
    runs: [
      ...[7, 5, 11, 3, 21, 42].map((seed) => `?seed=${seed}&scene=mid&prefer=firebolt:strat,night-raid:strat,call-to-arms:favour`),
      ...[7, 5, 11, 3, 21, 8, 13, 17].map((seed) => `?seed=${seed}&scene=quest&prefer=night-raid:strat,call-to-arms:favour`),
    ],
  },
};
// Stage P: a summon at Prime (the gold flare and the +1 Renown), and its low-motion version.
SETS.p = {
  want: [
    { name: 'p-prime-summon', effect: 'prime.summon' },
    { name: 'p-prime-summon-low', effect: 'prime.summon.low' },
  ],
  runs: [3, 5, 9, 2].map((seed) => `?seed=${seed}&scene=mid`).flatMap((q) => [q, `${q}&lowmotion=1`]),
};
const SET = SETS[process.argv[2] ?? 'v2'];
const matches = (w, st) => {
  if (w.effect instanceof RegExp ? !w.effect.test(st.e) : w.effect !== st.e) return false;
  if (!w.flag) return true;
  const fl = st.f.split(' ');
  return w.flag.split('+').every((x) => (x.startsWith('!') ? !fl.includes(x.slice(1)) : fl.includes(x)));
};

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const found = new Map();
for (const query of SET.runs) {
  if (found.size === SET.want.length) break;
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const hits = [];
  await page.goto(`http://127.0.0.1:${server.address().port}/${query}&autoplay=1&pace=400&speed=normal&lowmotion=0`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);   // the painted textures load
  let last = '';
  const started = Date.now();
  while (found.size + hits.length < SET.want.length && Date.now() - started < 9 * 60 * 1000) {
    const st = await page.evaluate(() => ({ e: document.body.dataset.effect ?? '', f: document.body.dataset.effectFlags ?? '', n: document.body.dataset.beatsStarted, end: !!document.querySelector('[data-region="end"]') }));
    const key = `${st.n}:${st.e}`;
    if (key !== last) {
      last = key;
      const w = SET.want.find((x) => matches(x, st) && !found.has(x.name) && !hits.some((h) => h.name === x.name));
      if (w) {
        const at = Date.now() - t0;
        const n = st.n;
        const seen = new Set([st.e]);
        // Until that beat is done, or until the whole action has been shown.
        for (let i = 0; i < 1200; i++) {
          const now = await page.evaluate((k) => ({ beatDone: Number(document.body.dataset.beatsDone) >= Number(k), presenting: document.body.dataset.presenting === '1', e: document.body.dataset.effect }), n);
          seen.add(now.e);
          if (w.until === 'action' ? !now.presenting : now.beatDone) break;
          await page.waitForTimeout(20);
        }
        if (!w.need || seen.has(w.need)) hits.push({ ...w, from: at / 1000, to: (Date.now() - t0) / 1000 });
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
    const dur = Math.min(h.until === 'action' ? 12 : 4, h.to - h.from + 0.9);
    const clip = join(outDir, `${h.name}.webm`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', ss.toFixed(2), '-i', file, '-t', dur.toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '2M', '-an', clip]);
    // A strip of 10 frames across the moment.
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', (ss + 0.3).toFixed(2), '-i', file, '-t', (dur - 0.4).toFixed(2), '-vf', `fps=${(10 / (dur - 0.4)).toFixed(3)},scale=480:-1,tile=5x2`, '-frames:v', '1', join(outDir, `${h.name}-strip.png`)]);
    found.set(h.name, { query, file: clip });
    console.log(`${h.name}: ${query}, ${dur.toFixed(1)} s`);
  }
}
await browser.close();
server.close();
await rm(rawDir, { recursive: true, force: true });
const missing = SET.want.filter((w) => !found.has(w.name)).map((w) => w.name);
console.log(missing.length ? `Not seen: ${missing.join(', ')}` : `All ${SET.want.length} clips recorded in tools/clips/.`);
process.exit(missing.length ? 1 : 0);
