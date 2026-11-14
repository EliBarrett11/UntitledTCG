// Performance check (stage V1): plays an AI-vs-AI match at 1920×1080 with the effects on (normal speed) and
// reports the frame time while effects play: the average, the 95th percentile and the worst. The target is
// 60 fps (16.7 ms). Frames are timed in the page with requestAnimationFrame, only while a beat is playing.
//
// Usage: node tools/perf.mjs [seed=5] [actions=120] [query]
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency). Note: headless Chromium here
// draws WebGL in software (SwiftShader), so these numbers are a floor, not a laptop GPU's.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir } from 'node:fs/promises';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available, so the performance check cannot run.'); process.exit(2); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED = Number(process.argv[2] ?? 5);
const ACTIONS = Number(process.argv[3] ?? 120);
const EXTRA = process.argv[4] ?? '';
const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ args: process.env.PERF_ARGS ? process.env.PERF_ARGS.split(' ') : [] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/?seed=${SEED}&autoplay=1&pace=300&speed=normal&lowmotion=0${EXTRA}`, { waitUntil: 'networkidle' });
const renderer = await page.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); const d = g?.getExtension('WEBGL_debug_renderer_info'); return g ? g.getParameter(d ? d.UNMASKED_RENDERER_WEBGL : g.RENDERER) : 'no WebGL2'; });
// Wait for the textures to load, then time frames while beats play.
await page.waitForTimeout(4000);
await page.evaluate(() => {
  window.__perf = { times: [], last: 0 };
  const tick = (t) => {
    const p = window.__perf;
    if (document.body.dataset.presenting === '1' && p.last) p.times.push(t - p.last);
    p.last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const t0 = Date.now();
for (;;) {
  const st = await page.evaluate(() => ({ v: Number(document.body.dataset.version), end: !!document.querySelector('[data-region="end"]') }));
  if (st.end || st.v >= ACTIONS || Date.now() - t0 > 15 * 60 * 1000) break;
  await page.waitForTimeout(500);
}
const res = await page.evaluate(() => ({ times: window.__perf.times, vfx: window.__match.vfx(), mode: document.body.dataset.vfx }));
await browser.close();
server.close();
const t = res.times.filter((x) => x < 1000).sort((a, b) => a - b);
const avg = t.reduce((a, b) => a + b, 0) / t.length;
const p95 = t[Math.floor(t.length * 0.95)];
const worst = t[t.length - 1];
const fps = 1000 / avg;
const lines = [
  `Performance at 1920×1080, seed ${SEED}, ${ACTIONS} actions, effects ${res.mode}${EXTRA ? ` (${EXTRA})` : ''}.`,
  `Renderer: ${renderer}.`,
  `Frames timed while beats played: ${t.length}.`,
  `Frame time: average ${avg.toFixed(1)} ms (${fps.toFixed(0)} fps), 95th percentile ${p95?.toFixed(1)} ms, worst ${worst?.toFixed(1)} ms.`,
  `Effects buffer at the end: ${res.vfx ? `${res.vfx.size.w}×${res.vfx.size.h} (quality ${res.vfx.quality.toFixed(2)})` : 'none (2D)'}; ${res.vfx?.ready ?? 0} painted textures loaded.`,
  `60 fps target (16.7 ms average): ${avg <= 16.7 ? 'met' : 'NOT met'}.`,
  ...(errors.length ? [`Page errors: ${errors.join('; ')}`] : []),
];
console.log(lines.join('\n'));
await mkdir(join(root, 'tools', 'reports'), { recursive: true });
await writeFile(join(root, 'tools', 'reports', `v1-perf${EXTRA ? EXTRA.replace(/[^a-z0-9]+/gi, '-') : ''}.txt`), `${lines.join('\n')}\n`);
process.exit(errors.length ? 1 : 0);
