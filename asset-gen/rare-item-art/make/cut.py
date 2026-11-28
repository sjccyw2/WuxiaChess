"""Writes the game's files from full/<id>.webp (the paintings, kept at quality 90): item-<id>.webp (256 x 256) for each item, and
guide-secret.webp, the cover of a 秘笈, at the size of guide-cover.webp.

    python3 asset-gen/rare-item-art/make/cut.py
"""
import os
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FULL = os.path.join(ROOT, 'asset-gen', 'rare-item-art', 'full')
ASSETS = os.path.join(ROOT, 'game', 'assets')
for name in sorted(os.listdir(FULL)):
    if not name.endswith('.webp'):
        continue
    id = name[:-5]
    im = Image.open(os.path.join(FULL, name)).convert('RGBA')
    if id.startswith('guide-'):
        # On the parchment of guide-cover.webp, as the plain manual's cover is.
        cover = Image.open(os.path.join(ASSETS, 'guide-cover.webp')).convert('RGBA')
        size = cover.size
        ground = Image.new('RGBA', im.size, cover.getpixel((4, 4)))
        ground.alpha_composite(im)
        im = ground
        out = os.path.join(ASSETS, id + '.webp')
    else:
        size = (256, 256)
        out = os.path.join(ASSETS, 'item-' + id + '.webp')
    im.resize(size, Image.LANCZOS).save(out, 'WEBP', quality=88, method=6)
    print(out)
