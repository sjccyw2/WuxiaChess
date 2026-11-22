"""Writes the game's files from the paintings chosen in asset-gen/story-characters/full/.

    python3 asset-gen/story-characters/make/cut.py

  full/figure.webp  ->  game/assets/figure-youth.webp   280 x 440, the 整備 page's full-length figure
  full/sword.png    ->  game/assets/item-keenSword.webp 256 x 256, 利劍's item picture

The figure is cropped to the game's 7:11 about its centre line; the sword is set a little smaller
in its frame, as the other item pictures are. Needs Pillow.
"""
import os

from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FULL = os.path.join(ROOT, 'asset-gen', 'story-characters', 'full')
ASSETS = os.path.join(ROOT, 'game', 'assets')

figure = Image.open(os.path.join(FULL, 'figure.webp')).convert('RGB')
w = round(figure.height * 280 / 440)
left = (figure.width - w) // 2
figure.crop((left, 0, left + w, figure.height)).resize((280, 440), Image.LANCZOS).save(
    os.path.join(ASSETS, 'figure-youth.webp'), 'WEBP', quality=86, method=6)

sword = Image.open(os.path.join(FULL, 'sword.png')).convert('RGBA')
box = sword.getbbox()
blade = sword.crop(box)
side = 196  # the longest side of the sword inside the 256 frame
scale = side / max(blade.size)
blade = blade.resize((round(blade.width * scale), round(blade.height * scale)), Image.LANCZOS)
frame = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
frame.alpha_composite(blade, ((256 - blade.width) // 2, (256 - blade.height) // 2))
frame.save(os.path.join(ASSETS, 'item-keenSword.webp'), 'WEBP', quality=90, method=6, alpha_quality=100)
print('figure-youth.webp', os.path.getsize(os.path.join(ASSETS, 'figure-youth.webp')) // 1024, 'KB;',
      'item-keenSword.webp', os.path.getsize(os.path.join(ASSETS, 'item-keenSword.webp')) // 1024, 'KB')
