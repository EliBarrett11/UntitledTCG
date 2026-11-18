#!/usr/bin/env python3
"""Presentation art (stage A): assets/ui/ from the full-size pieces in assets/ui-v3/ (kept as the source).

- war-table, title-key-art, victory-backdrop: 3:2 -> 16:9 (the stage's shape), centred.
- campaign-map and campaign-map-scorched: 3:2 -> the board's shape (1532 x 644), with ONE crop box for both, so the
  Last Battle's crossfade to the scorched map stays lined up.
- banner-crimson and banner-blue: cut out of their near-black backdrops to PNG with a soft alpha edge; the edge
  colours are decontaminated (the dark backdrop un-mixed from them), so no dark halo shows on lighter art.
- card-back: 2:3 -> 5:7, centred, so its central emblem stays in the middle (1060 x 1484, the cards' size).

Usage: python3 tools/uiart.py
Needs Pillow and NumPy (dev tools only; never runtime dependencies).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'ui-v3'
OUT = ROOT / 'assets' / 'ui'
BOARD = (1532, 644)


def crop_aspect(im, aspect, cy=0.5):
    """The largest window of the given aspect (w / h), centred horizontally and at cy vertically."""
    w, h = im.size
    if w / h > aspect:
        nw = round(h * aspect)
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = round(w / aspect)
    top = round((h - nh) * cy)
    return im.crop((0, top, w, top + nh))


def save_jpg(im, name, size=None):
    if size:
        im = im.resize(size, Image.LANCZOS)
    im.convert('RGB').save(OUT / f'{name}.jpg', quality=86, optimize=True, progressive=True)
    return im.size


def cut_banner(name, size=(720, 1080)):
    """A banner on near-black, cut out: alpha from how far each pixel stands out from the backdrop, the largest
    shape kept and its holes filled, a soft edge, and the backdrop un-mixed from the edge colours."""
    im = Image.open(SRC / f'{name}.jpg').convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255.0
    # The backdrop's colour: the median of the image's outer border.
    border = np.concatenate([a[:24].reshape(-1, 3), a[-24:].reshape(-1, 3), a[:, :24].reshape(-1, 3), a[:, -24:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    # How far a pixel stands out: its distance from the backdrop, weighted to brightness and colour.
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    lum = a.max(axis=2) - bg.max()
    score = np.maximum(d, lum * 1.2)
    lo, hi = 0.10, 0.30
    alpha = np.clip((score - lo) / (hi - lo), 0, 1)
    # The banner as one solid shape: threshold, keep only the shape connected to the banner's middle (so stray
    # wisps of smoke go), fill its holes (from the outside in), then keep the soft ramp only within 4 px of it.
    solid = Image.fromarray((alpha > 0.5).astype(np.uint8) * 255)
    solid = solid.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    ImageDraw.floodfill(solid, (solid.width // 2, int(solid.height * 0.45)), 200)
    shape = Image.fromarray((np.asarray(solid) == 200).astype(np.uint8) * 255)
    outside = Image.new('L', (shape.width + 2, shape.height + 2), 0)
    outside.paste(shape, (1, 1))
    ImageDraw.floodfill(outside, (0, 0), 128)
    inside = (np.asarray(outside)[1:-1, 1:-1] != 128)
    near = np.asarray(Image.fromarray(inside.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))) > 0
    filled = np.where(near, np.maximum(alpha, inside.astype(np.float32)), 0.0)
    # (Inside the shape the alpha is full; at its edge it keeps the soft ramp, feathered by 1.5 px.)
    a_img = Image.fromarray((filled * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    al = np.asarray(a_img).astype(np.float32) / 255.0
    # Decontaminate: c = a * fg + (1 - a) * bg, so fg = (c - (1 - a) * bg) / a.
    safe = np.maximum(al, 0.05)[..., None]
    fg = np.clip((a - (1 - safe) * bg) / safe, 0, 1)
    rgba = np.dstack([fg, al]) * 255
    out = Image.fromarray(rgba.astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS)
    out.save(OUT / f'{name}.png', optimize=True)
    return out.size


def main():
    OUT.mkdir(exist_ok=True)
    done = []
    for name in ('war-table', 'title-key-art', 'victory-backdrop'):
        done.append((name, save_jpg(crop_aspect(Image.open(SRC / f'{name}.jpg'), 16 / 9), name)))
    # One crop box for both maps (the same layout), so the crossfade stays lined up.
    for name in ('campaign-map', 'campaign-map-scorched'):
        done.append((name, save_jpg(crop_aspect(Image.open(SRC / f'{name}.jpg'), BOARD[0] / BOARD[1]), name)))
    back = crop_aspect(Image.open(SRC / 'card-back.jpg'), 5 / 7)
    done.append(('card-back', save_jpg(back, 'card-back', (1060, 1484))))
    for name in ('banner-crimson', 'banner-blue'):
        done.append((name + '.png', cut_banner(name)))
    for n, s in done:
        print(f'assets/ui/{n}: {s[0]} x {s[1]}')


if __name__ == '__main__':
    main()
