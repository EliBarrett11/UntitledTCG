// Layout check: loads the page at 1920×1080, 1366×768 and 1280×720, checks the stage
// fits the window with nothing off-screen and no console or page errors, and saves
// screenshots to tools/screenshots/.
//
// Usage: node tools/layout.mjs
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not available, so the layout check cannot run.');
  process.exit(2);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotDir = join(root, 'tools', 'screenshots');
const SIZES = [[1920, 1080], [1366, 768], [1280, 720]];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml' };

// A tiny static server, like `python3 -m http.server`.
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = normalize(join(root, path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

await mkdir(shotDir, { recursive: true });
const browser = await chromium.launch();
let failures = 0;

for (const [w, h] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });

  await page.goto(url, { waitUntil: 'networkidle' });

  const problems = await page.evaluate(() => {
    const out = [];
    const vw = innerWidth, vh = innerHeight, tol = 1;
    const stage = document.getElementById('stage');
    const s = stage.getBoundingClientRect();
    if (s.left < -tol || s.top < -tol || s.right > vw + tol || s.bottom > vh + tol) {
      out.push(`stage off-screen: ${JSON.stringify(s)}`);
    }
    // The stage should fill the window on its limiting side.
    if (Math.abs(s.width - vw) > 2 && Math.abs(s.height - vh) > 2) {
      out.push(`stage does not fill the window: ${s.width}×${s.height} in ${vw}×${vh}`);
    }
    // Every visible element sits inside the stage and the window.
    for (const el of stage.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const name = el.id ? `#${el.id}` : `.${[...el.classList].join('.')}`;
      if (r.left < s.left - tol || r.top < s.top - tol || r.right > s.right + tol || r.bottom > s.bottom + tol) {
        out.push(`${name} outside the stage`);
      }
      // Text is never clipped inside its own box.
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') {
        out.push(`${name} text clipped`);
      }
    }
    const title = document.getElementById('game-title').textContent;
    if (!title) out.push('title missing');
    if (document.documentElement.scrollWidth > vw || document.documentElement.scrollHeight > vh) {
      out.push('page scrolls');
    }
    return out;
  });

  const shot = join(shotDir, `s0-${w}x${h}.png`);
  await page.screenshot({ path: shot });
  const all = [...problems, ...errors];
  if (all.length) {
    failures++;
    console.log(`FAIL  ${w}×${h}`);
    for (const p of all) console.log(`      ${p}`);
  } else {
    console.log(`PASS  ${w}×${h}  → tools/screenshots/s0-${w}x${h}.png`);
  }
  await page.close();
}

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
