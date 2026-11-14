// A tiny static file server for the browser checks, like `python3 -m http.server`.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

export function staticServer(dir) {
  return createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = normalize(join(dir, path.endsWith('/') ? `${path}index.html` : path));
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    try { res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }).end(await readFile(file)); } catch { res.writeHead(404).end(); }
  });
}
