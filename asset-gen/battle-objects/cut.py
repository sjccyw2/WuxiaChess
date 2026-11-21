# Makes the game's pictures of the board objects from the full-size paintings in full/:
#   python3 asset-gen/battle-objects/cut.py
# Each object's intact and broken pictures are cropped to the same box (the union of what both
# show), so the broken one stands exactly where the intact one stood, and written as
# game/assets/object-<id>.webp and object-<id>-broken.webp. The bottom of the box is the object's
# base: the board stands it there on its tile.
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'game', 'assets')
IDS = ['qin', 'drum', 'starPost']
HEIGHT = 288  # the longer side, in pixels; the board draws them at about a third of this or less


def box(*images):
    boxes = [im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox() for im in images]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


for id in IDS:
    whole = Image.open(os.path.join(HERE, 'full', id + '.png')).convert('RGBA')
    broken = Image.open(os.path.join(HERE, 'full', id + '-broken.png')).convert('RGBA')
    b = box(whole, broken)
    w, h = b[2] - b[0], b[3] - b[1]
    scale = HEIGHT / max(w, h)
    size = (max(1, round(w * scale)), max(1, round(h * scale)))
    for im, name in ((whole, id), (broken, id + '-broken')):
        out = os.path.join(ASSETS, 'object-' + name + '.webp')
        im.crop(b).resize(size, Image.LANCZOS).save(out, 'WEBP', quality=88, method=6)
        print(out, size, os.path.getsize(out), 'bytes')
