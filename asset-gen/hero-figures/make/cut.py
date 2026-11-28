"""Writes the game's figure files from the paintings in asset-gen/hero-figures/full/.

    python3 asset-gen/hero-figures/make/cut.py

  full/<id>.webp (1024 x 1536)  ->  game/assets/figure-<id>.webp  560 x 880

Twice the old 280 x 440, at the same 7:11, cropped about the centre line, so every page that shows
a figure (整備, 抓子, the wardrobe) keeps its layout and is sharp on a phone's screen. Needs Pillow.
"""
import os

from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FULL = os.path.join(ROOT, 'asset-gen', 'hero-figures', 'full')
ASSETS = os.path.join(ROOT, 'game', 'assets')
total = 0
for name in sorted(os.listdir(FULL)):
    if not name.endswith('.webp'):
        continue
    id = name[:-5]
    im = Image.open(os.path.join(FULL, name)).convert('RGB')
    w = round(im.height * 7 / 11)
    left = (im.width - w) // 2
    out = os.path.join(ASSETS, 'figure-' + id + '.webp')
    im.crop((left, 0, left + w, im.height)).resize((560, 880), Image.LANCZOS).save(out, 'WEBP', quality=84, method=6)
    total += os.path.getsize(out)
    print('figure-%s.webp %d KB' % (id, os.path.getsize(out) // 1024))
print('total %d KB' % (total // 1024))
