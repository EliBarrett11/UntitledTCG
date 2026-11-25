// Stage X3 (docs/38): the final pass over every moment together. A complete AI-vs-AI match (both seats played by the
// AI, every action presented as in play) recorded at 1920×1080 at Normal speed, then again in low motion; while it
// plays, every animation frame is timed against the moment showing (body[data-effect]), for a frame-time report by
// moment, and the effects' quality step is read at the end.
//   tools/clips/x3/x3-match-normal.webm, x3-match-low.webm, x3-match-frames.txt
// The clock runs at true speed (no slow-down): in this container WebGL is software-rendered at a few frames a second,
// so the recording is choppy where the effects are heavy; the frame times say how heavy. On a real GPU, ?fps=1.
// Usage: node tools/x3match.mjs [seed] [--normal-only] [--low-only] [--quality=auto|0]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { staticServer, withDev } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tools', 'clips', 'x3');
const raw = join(out, 'raw');
await mkdir(raw, { recursive: true });
const args = process.argv.slice(2);
const seed = Number(args.find((a) => /^\d+$/.test(a)) ?? 21);
const quality = (args.find((a) => a.startsWith('--quality=')) ?? '--quality=0').split('=')[1];
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const sv = staticServer(root); await new Promise((r) => sv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${sv.address().port}/`;
const browser = await chromium.launch();
const report = join(out, 'x3-match-frames.txt');

async function match(low) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: raw, size: { width: 1920, height: 1080 } } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'warning' && /beat failed/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  const t0 = Date.now();
  await page.goto(withDev(`${base}?seed=${seed}&autoplay=1&pace=500&timer=off&speed=normal&lowmotion=${low ? 1 : 0}${quality === 'auto' ? '' : `&vfxquality=${quality}`}`), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const v = window.__match?.vfx?.(); return !v || (v.standIns.length === 0 && v.ready >= 60); }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  // Every frame: its time since the last, and the moment showing.
  await page.evaluate(() => {
    const by = new Map(); let last = performance.now(); let frames = 0;
    const tick = (t) => { const dt = t - last; last = t; frames++; const k = document.body.dataset.presenting === '1' ? (document.body.dataset.effect || document.body.dataset.beat || 'presenting') : 'idle';
      let e = by.get(k); if (!e) by.set(k, (e = [])); if (frames > 2) e.push(dt); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    window.__x3frames = by;
  });
  const start = Date.now();
  await page.waitForFunction(() => document.body.dataset.screen === 'end' || window.__match.state()?.phase === 'gameOver' && !window.__match.presenting(), null, { timeout: 5400000, polling: 1000 }).catch(() => errors.push('the match did not end in 90 minutes'));
  await page.waitForTimeout(4000);
  const res = await page.evaluate(() => {
    const st = (t) => { const s = [...t].sort((a, b) => a - b); return { n: s.length, avg: s.reduce((a, b) => a + b, 0) / (s.length || 1), p95: s[Math.floor(s.length * 0.95)] ?? 0, worst: s[s.length - 1] ?? 0 }; };
    const s = window.__match.state();
    const v = window.__match.vfx?.() ?? {};
    return { rows: [...window.__x3frames].map(([k, t]) => [k, st(t)]).sort((a, b) => b[1].n - a[1].n), round: s.round, winner: s.result?.winner ?? null, how: s.result?.how ?? null, quality: v.quality, qualityName: v.qualityName, beats: window.__match.beats() };
  });
  const secs = (Date.now() - start) / 1000;
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  const dest = join(out, `x3-match-${low ? 'low' : 'normal'}.webm`);
  ff(['-i', file, '-ss', ((start - t0) / 1000).toFixed(1), '-vf', 'scale=1280:720,fps=24', '-an', '-c:v', 'libvpx-vp9', '-b:v', '1.6M', '-row-mt', '1', dest]);
  const lines = [`== ${low ? 'Low motion' : 'Normal speed'}: seed ${seed}, ${res.beats.started} beats, ${(secs / 60).toFixed(1)} min, ended Round ${res.round} (${res.winner ?? 'a draw'}, ${res.how}); quality step at the end: ${res.quality} (${res.qualityName})${errors.length ? `; problems: ${errors.slice(0, 5).join(' | ')}` : ''}`,
    'moment                                   frames   avg ms   p95 ms  worst ms',
    ...res.rows.map(([k, s]) => `${k.padEnd(40)} ${String(s.n).padStart(6)} ${s.avg.toFixed(1).padStart(8)} ${s.p95.toFixed(1).padStart(8)} ${s.worst.toFixed(1).padStart(9)}`)];
  console.log(lines.join('\n'));
  await appendFile(report, `${lines.join('\n')}\n\n`);
  return errors.length;
}
await writeFile(report, `Stage X3: a complete match, every moment together (tools/x3match.mjs). 1920×1080, the quality step ${quality === 'auto' ? 'chosen automatically' : quality}.\n\n`);
let bad = 0;
if (!args.includes('--low-only')) bad += await match(false);
if (!args.includes('--normal-only')) bad += await match(true);
await browser.close();
sv.close();
process.exit(bad ? 1 : 0);
