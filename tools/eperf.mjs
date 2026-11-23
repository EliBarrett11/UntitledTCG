// Frame times for stage E's three moments (docs/22 section 4): each moment, old and new, staged by ?fxdemo and played at
// normal speed at 1920×1080, timing only the frames drawn while it plays. First at the top quality step (?vfxquality=0),
// then all of them in a row with automatic quality on, to see which step it settles on.
// This container renders WebGL in software, so the numbers are for comparing old with new here, not a 60 fps verdict.
//
// Usage: node tools/eperf.mjs [runs=2]
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const RUNS = Number(process.argv[2] ?? 2);
const PARTS = {
  attack: { new: ['e.attack.steel', 'e.defeat'], old: ['attack.oathsworn', 'defeat'] },
  'firebolt-adapt': { new: ['e.firebolt'], old: ['spell.firebolt'] },
  'firebolt-react': { new: ['e.firebolt.react'], old: ['firebolt.react'] },
  'firebolt-strat': { new: ['e.firebolt.strat'], old: ['firebolt.strat'] },
  prime: { new: ['e.prime'], old: ['prime.summon'] },
};
const renderer = await (async () => { const p = await browser.newPage(); const r = await p.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); const d = g?.getExtension('WEBGL_debug_renderer_info'); return g ? g.getParameter(d ? d.UNMASKED_RENDERER_WEBGL : g.RENDERER) : 'no WebGL2'; }); await p.close(); return r; })();
console.log(`Renderer: ${renderer}. 1920×1080, normal speed.`);

async function measure(name, mode, quality) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const q = `?seed=10&scene=mid&pace=100000&timer=off&speed=normal&lowmotion=0${mode === 'old' ? '&fx=old' : ''}${quality === null ? '' : `&vfxquality=${quality}`}`;
  await page.goto(`${base}${q}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return v && v.standIns.length === 0 && v.ready >= 110; }, null, { timeout: 120000, polling: 250 });
  await page.waitForTimeout(600);
  const parts = PARTS[name][mode];
  const times = await page.evaluate(async ([n, ps]) => {
    const all = [];
    let on = false;
    const watch = setInterval(() => {
      const e = document.body.dataset.effect ?? '';
      const now = ps.includes(e) && document.body.dataset.presenting === '1';
      if (now && !on) window.__match.resetVfxStats();
      if (!now && on) all.push(...window.__match.vfx().frameTimes);
      on = now;
    }, 10);
    await window.__match.fxDemo(n);
    clearInterval(watch);
    if (on) all.push(...window.__match.vfx().frameTimes);
    return all;
  }, [name, parts]);
  const q2 = await page.evaluate(() => window.__match.vfx().qualityName);
  await page.close();
  return { times, quality: q2 };
}
const stat = (xs) => (xs.length ? { avg: xs.reduce((a, b) => a + b, 0) / xs.length, worst: Math.max(...xs), n: xs.length } : { avg: NaN, worst: NaN, n: 0 });
const rows = [];
for (const name of Object.keys(PARTS)) {
  for (const mode of ['old', 'new']) {
    const all = [];
    for (let i = 0; i < RUNS; i++) all.push(...(await measure(name, mode, 0)).times);
    const s = stat(all);
    rows.push({ name, mode, ...s });
    console.log(`${name.padEnd(15)} ${mode}: average ${s.avg.toFixed(1)} ms (${(1000 / s.avg).toFixed(0)} fps), worst ${s.worst.toFixed(1)} ms, ${s.n} frames`);
  }
}
// Automatic quality: every new moment in turn on one page.
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${base}?seed=10&scene=mid&pace=100000&timer=off&speed=normal&lowmotion=0`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return v && v.standIns.length === 0 && v.ready >= 110; }, null, { timeout: 120000, polling: 250 });
  const steps = [];
  for (const name of Object.keys(PARTS)) { await page.evaluate((n) => window.__match.fxDemo(n), name); steps.push(`${name}: ${await page.evaluate(() => window.__match.vfx().qualityName)}`); }
  console.log(`Automatic quality, the moments in a row: ${steps.join('; ')}.`);
  await page.close();
}
await browser.close();
server.close();
