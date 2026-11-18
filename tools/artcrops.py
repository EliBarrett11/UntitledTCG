#!/usr/bin/env python3
"""Card art crops (stage A): the game's card images from the full-art scenes.

assets/cards-v3/<id>.jpg holds each full scene (1536 x 1024, 3:2) and assets/cards-v3/crops.json its crop centre
(cardX, in pixels of the full image). The card crop is a 5:7 window the full height of the image (731 x 1024),
centred on cardX and clamped to the image; it is written to assets/cards/<id>.jpg at the size the game uses
(1060 x 1484). Board tokens, Mini cards, chips and hover previews all use that one image. assets/cards-v3 stays
as the source (the Codex's "View full art" and the Location tiles draw from it).

Usage: python3 tools/artcrops.py          (writes every crop)
       python3 tools/artcrops.py --check  (exit 1 if a crop is missing or a scene has no crop centre)
Needs Pillow (a dev tool only; never a runtime dependency).
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'cards-v3'
OUT = ROOT / 'assets' / 'cards'
OUT_SIZE = (1060, 1484)


def crop_box(width, height, card_x):
    """The 5:7 window, the full height, centred on card_x and clamped to the image."""
    w = round(height * 5 / 7)
    left = round(card_x - w / 2)
    left = max(0, min(width - w, left))
    return (left, 0, left + w, height)


def main():
    crops = json.loads((SRC / 'crops.json').read_text())
    scenes = sorted(p.stem for p in SRC.glob('*.jpg'))
    problems = [f'{s}: no crop centre in crops.json' for s in scenes if s not in crops]
    problems += [f'{k}: in crops.json but no scene' for k in crops if k not in scenes]
    if '--check' in sys.argv:
        problems += [f'{s}: assets/cards/{s}.jpg is missing' for s in scenes if not (OUT / f'{s}.jpg').exists()]
        if problems:
            print('\n'.join(problems))
            sys.exit(1)
        print(f'All {len(scenes)} card crops are present.')
        return
    if problems:
        print('\n'.join(problems))
        sys.exit(1)
    OUT.mkdir(exist_ok=True)
    for s in scenes:
        im = Image.open(SRC / f'{s}.jpg').convert('RGB')
        box = crop_box(*im.size, crops[s]['cardX'])
        card = im.crop(box).resize(OUT_SIZE, Image.LANCZOS)
        card.save(OUT / f'{s}.jpg', quality=86, optimize=True, progressive=True)
    print(f'Wrote {len(scenes)} card crops to assets/cards/ ({OUT_SIZE[0]} x {OUT_SIZE[1]}).')


if __name__ == '__main__':
    main()
