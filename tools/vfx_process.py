#!/usr/bin/env python3
"""Process Elliott's generated VFX images into assets/vfx/.

Usage: python3 tools/vfx_process.py <id>=<source.png>[:solid] [...]
  :solid marks a solid object painted on black (cut out opaque, not turned into glow).
  :grid=RxC splits an atlas by an even grid of R rows and C columns, for pieces with loose droplets or sparks.
- Images on a black background become transparent: brightness is used as alpha,
  and colour is un-premultiplied, so they work with normal and additive blending.
- Images that already have transparency are kept as they are.
- Each texture is scaled to at most 1024 px on its longest side and saved as WebP.
- Atlases (ids ending in -atlas) are split into frames by finding each separate piece;
  frame rectangles go into assets/vfx/manifest.json.
Needs Pillow and NumPy (dev tool only; the game itself has no dependencies).
"""
import sys, json, os
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'vfx')
MAN = os.path.join(OUT, 'manifest.json')

def to_rgba(im, mode=''):
    if mode == 'solid':
        # a solid object painted on black: opaque wherever it isn't near-black
        rgb = np.asarray(im.convert('RGB')).astype(np.float32)
        mx = rgb.max(axis=2)
        a = np.clip((mx - 10.0) / 70.0, 0, 1)
        return np.dstack([rgb, a * 255.0]), 'alpha'
    if im.mode == 'RGBA':
        a = np.asarray(im)[..., 3]
        if a.min() < 250:
            return np.asarray(im).astype(np.float32), 'alpha'
        im = im.convert('RGB')
    rgb = np.asarray(im.convert('RGB')).astype(np.float32)
    mx = rgb.max(axis=2)
    a = np.clip((mx - 6.0) / 249.0, 0, 1)
    safe = np.maximum(a, 1e-3)[..., None]
    col = np.clip(rgb / 255.0 / safe, 0, 1) * 255.0
    col[a == 0] = 0
    out = np.dstack([col, a * 255.0])
    return out, 'light'

def frames(alpha, minarea=400):
    from collections import deque
    h, w = alpha.shape
    m = alpha > 24
    # dilate a little so fine strands stay with their piece
    k = 6
    pad = np.pad(m, k)
    d = np.zeros_like(m)
    for dy in range(-k, k + 1, 2):
        for dx in range(-k, k + 1, 2):
            d |= pad[k + dy:k + dy + h, k + dx:k + dx + w]
    seen = np.zeros_like(d)
    rects = []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if d[y, x] and not seen[y, x]:
                q = deque([(y, x)]); seen[y, x] = True
                x0 = x1 = x; y0 = y1 = y; n = 0
                while q:
                    cy, cx = q.popleft(); n += 1
                    x0 = min(x0, cx); x1 = max(x1, cx); y0 = min(y0, cy); y1 = max(y1, cy)
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and d[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; q.append((ny, nx))
                if n >= minarea:
                    rects.append([max(0, x0 - 2), max(0, y0 - 2), min(w, x1 + 3), min(h, y1 + 3)])
    rects.sort(key=lambda r: (round(r[1] / (h / 8)), r[0]))
    return [{'x': r[0], 'y': r[1], 'w': r[2] - r[0], 'h': r[3] - r[1]} for r in rects]

def grid_frames(alpha, rows, cols):
    """Split an atlas into an even rows x cols grid, trimming each cell to its piece."""
    h, w = alpha.shape
    out = []
    for r in range(rows):
        for c in range(cols):
            y0, y1 = r * h // rows, (r + 1) * h // rows
            x0, x1 = c * w // cols, (c + 1) * w // cols
            ys, xs = np.nonzero(alpha[y0:y1, x0:x1] > 8)
            if len(xs):
                out.append({'x': int(x0 + xs.min()), 'y': int(y0 + ys.min()), 'w': int(xs.max() - xs.min() + 1), 'h': int(ys.max() - ys.min() + 1)})
    return out

def main(pairs):
    os.makedirs(OUT, exist_ok=True)
    man = json.load(open(MAN)) if os.path.exists(MAN) else {'about': 'VFX textures. blend: light = painted on black (additive or normal), alpha = solid object.', 'textures': {}}
    for p in pairs:
        tid, src = p.split('=', 1)
        mode = ''
        grid = None
        if ':grid=' in src:
            src, g = src.split(':grid=')
            grid = tuple(int(v) for v in g.split('x'))
        if src.endswith(':solid'):
            src, mode = src[:-6], 'solid'
        im = Image.open(src)
        arr, blend = to_rgba(im, mode)
        img = Image.fromarray(arr.round().astype(np.uint8), 'RGBA')
        bbox = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        if bbox:
            pad = 12
            bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(img.width, bbox[2] + pad), min(img.height, bbox[3] + pad))
            img = img.crop(bbox)
        s = min(1.0, 1024 / max(img.size))
        if s < 1:
            img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
        path = os.path.join(OUT, f'{tid}.webp')
        img.save(path, 'WEBP', quality=88, method=6)
        entry = {'file': f'assets/vfx/{tid}.webp', 'w': img.width, 'h': img.height, 'blend': blend}
        if tid.endswith('-atlas'):
            a = np.asarray(img.getchannel('A'))
            entry['frames'] = grid_frames(a, *grid) if grid else frames(a)
        man['textures'][tid] = entry
        print(f"{tid}: {img.width}x{img.height} {blend} {os.path.getsize(path)//1024} KB" + (f" frames={len(entry['frames'])}" if 'frames' in entry else ''))
    man['textures'] = dict(sorted(man['textures'].items()))
    json.dump(man, open(MAN, 'w'), indent=1)

if __name__ == '__main__':
    main(sys.argv[1:])
