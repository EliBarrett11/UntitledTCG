// Stage X1: frame times for each rebuilt core moment, staged by ?fxdemo and played at normal speed at 1920×1080, timing
// only the frames drawn while it plays: first at the top quality step (?vfxquality=0), then every moment in a row with
// automatic quality on, to see which step the game settles on. This container renders WebGL in software, so the numbers
// compare moments with each other and with stage E's, not a 60 fps verdict for real hardware.
//
// Usage: node tools/x1perf.mjs [moment …]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer, withDev } from './serve.mjs';
import { MOMENTS } from './x1moments.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const only = process.argv.slice(2);
const list = Object.values(MOMENTS).flat().filter((n) => !only.length || only.includes(n));
const stats = (t) => { const s = [...t].sort((a, b) => a - b); const avg = s.reduce((a, b) => a + b, 0) / (s.length || 1); return { n: s.length, avg, p95: s[Math.floor(s.length * 0.95)] ?? 0, worst: s[s.length - 1] ?? 0 }; };

async function page(quality) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(withDev(`${base}?seed=10&scene=mid&pace=100000&timer=off&speed=normal&lowmotion=0${quality === null ? '' : `&vfxquality=${quality}`}`), { waitUntil: 'networkidle' });
  await p.waitForFunction(() => { const v = window.__match?.vfx(); return v && v.standIns.length === 0 && v.ready >= 60; }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  await p.waitForTimeout(500);
  return p;
}
async function play(p, name) {
  await p.evaluate(() => window.__match.resetVfxStats());
  await p.evaluate((n) => window.__match.fxDemo(n), name);
  return p.evaluate(() => window.__match.vfx().frameTimes);
}
const renderer = await (async () => { const p = await browser.newPage(); const r = await p.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); const d = g?.getExtension('WEBGL_debug_renderer_info'); return g ? g.getParameter(d ? d.UNMASKED_RENDERER_WEBGL : g.RENDERER) : 'no WebGL2'; }); await p.close(); return r; })();
console.log(`Renderer: ${renderer}. 1920×1080, normal speed, the top quality step.`);
console.log('moment                 frames   avg ms   p95 ms  worst ms');
for (const name of list) {
  const p = await page(0);
  const s = stats(await play(p, name));
  console.log(`${name.padEnd(22)} ${String(s.n).padStart(6)} ${s.avg.toFixed(1).padStart(8)} ${s.p95.toFixed(1).padStart(8)} ${s.worst.toFixed(1).padStart(9)}`);
  await p.close();
}
const p = await page(null);
for (const name of list) await play(p, name);
const q = await p.evaluate(() => window.__match.vfx());
console.log(`Automatic quality, all ${list.length} moments in a row: settled on step ${q.quality} (${q.qualityName}).`);
await browser.close();
server.close();
