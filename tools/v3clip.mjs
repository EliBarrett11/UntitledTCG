// The flow clip (stage V3): title → Play → setup → Begin → the opening → a fast AI-vs-AI match → the Last Battle's
// scorch → victory → Play again (back to setup). Real clicks on the screens; the match itself plays on autoplay at
// fast speed. The long middle stretches of the match are sped up 16× in the cut so the clip stays short; the screens,
// the opening, the scorch and the end are kept at real speed. Saved to tools/clips/v3-flow.webm and
// tools/clips/v3-flow-strip.png (12 frames across the clip).
//
// Usage: node tools/v3clip.mjs [seed]   (seed 9: a win for you, with the Last Battle)
// Needs Playwright with Chromium and ffmpeg (dev tools only; never runtime dependencies).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { staticServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tools', 'clips');
const rawDir = join(outDir, 'raw');
await mkdir(rawDir, { recursive: true });
const SEED = Number(process.argv[2] ?? 9);
// Re-cut a kept recording without playing again: node tools/v3clip.mjs --cut <raw.webm> '<marks json>'
if (process.argv[2] === '--cut') {
  const dur = cut(process.argv[3], JSON.parse(process.argv[4]));
  console.log(`Clip ${dur.toFixed(1)} s → tools/clips/v3-flow.webm`);
  process.exit(0);
}

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const t0 = Date.now();
const at = () => (Date.now() - t0) / 1000;
const marks = {};
const clickAct = async (act) => {
  const el = await page.waitForSelector(`[data-act="${act}"]`, { timeout: 10000 });
  const b = await el.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.waitForTimeout(250);
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
};
await page.goto(`http://127.0.0.1:${server.address().port}/?title=1&autoplay=1&speed=fast&seed=${SEED}&lowmotion=0`, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-region="title"]');
marks.title = at();
await page.waitForTimeout(3500);
await clickAct('play');
await page.waitForSelector('[data-region="setup"]');
marks.setup = at();
await page.waitForTimeout(3000);
await clickAct('begin');
marks.begin = at();
const started = Date.now();
while (Date.now() - started < 12 * 60 * 1000) {
  const st = await page.evaluate(() => ({ lb: !!document.querySelector('.map.last-battle'), end: !!document.querySelector('[data-region="end"]') }));
  if (st.lb && marks.last == null) marks.last = at();
  if (st.end) { marks.end = at(); break; }
  await page.waitForTimeout(50);
}
if (marks.end == null) throw new Error('the match did not reach the end screen');
const result = await page.$eval('[data-region="end"] .end-title', (e) => e.textContent);
await page.waitForTimeout(4500);
await clickAct('again');
await page.waitForSelector('[data-region="setup"]');
marks.again = at();
await page.waitForTimeout(2200);
marks.stop = at();
const video = page.video();
await ctx.close();
const file = await video.path();
await browser.close();
server.close();

console.log(`Marks (s): ${JSON.stringify(Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, Number(v.toFixed(2))])))}`);
const dur = cut(file, marks);
await rm(rawDir, { recursive: true, force: true });
console.log(`The match ended: ${result}. Clip ${dur.toFixed(1)} s → tools/clips/v3-flow.webm${errors.length ? `; page errors: ${errors.join('; ')}` : ''}`);
process.exit(errors.length ? 1 : 0);

// The cut: real speed around each moment, SPEEDUP× between them. Each part is encoded on its own, then they are
// joined (one filter graph over a long recording runs out of memory).
function cut(file, marks) {
  const SPEEDUP = 16;
  const keep = [[0, marks.begin + 7]];
  if (marks.last != null) keep.push([marks.last - 1, marks.last + 6]);
  keep.push([marks.end - 1, marks.stop]);
  const parts = [];
  let pos = 0;
  for (const [a, b] of keep) {
    if (a > pos + 0.5) parts.push([pos, a, SPEEDUP]);
    parts.push([Math.max(a, pos), b, 1]);
    pos = b;
  }
  const list = parts.map(([a, b, k], i) => {
    const out = join(rawDir, `part-${i}.webm`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', a.toFixed(2), '-t', (b - a).toFixed(2), '-i', file, '-vf', `setpts=PTS/${k},fps=25`, '-c:v', 'libvpx-vp9', '-b:v', '2M', '-row-mt', '1', '-an', out]);
    return `file '${out}'`;
  }).join('\n');
  const listFile = join(rawDir, 'parts.txt');
  writeFileSync(listFile, list);
  const clip = join(outDir, 'v3-flow.webm');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', clip]);
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', clip]).toString());
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', clip, '-vf', `fps=${(12 / dur).toFixed(4)},scale=480:-1,tile=4x3`, '-frames:v', '1', join(outDir, 'v3-flow-strip.png')]);
  return dur;
}
