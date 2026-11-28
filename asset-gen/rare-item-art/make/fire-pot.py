"""霹靂雷火彈's picture, made from 九花玉露丸's painted jar (the image model would not paint it):
the jar recoloured to dark glazed clay with bronze light, and a short twisted red wick drawn on top.

    python3 asset-gen/rare-item-art/make/fire-pot.py    # writes full/thunderBomb.webp; cut.py does the rest
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
src = Image.open(os.path.join(ROOT, 'game', 'assets', 'item-nineFlowerPill.webp')).convert('RGBA').resize((1024, 1024), Image.LANCZOS)
alpha = src.getchannel('A')
grey = ImageOps.grayscale(src)
# Dark clay: shadows near black, highlights a warm bronze.
tinted = ImageOps.colorize(grey, black=(18, 14, 12), mid=(70, 48, 30), white=(196, 150, 92)).convert('RGBA')
tinted.putalpha(alpha)
# The wick: a short twisted red cord rising from the lid's top centre.
box = alpha.getbbox()
cx, top = (box[0] + box[2]) // 2, box[1]
wick = Image.new('RGBA', tinted.size, (0, 0, 0, 0))
d = ImageDraw.Draw(wick)
pts = [(cx, top + 60), (cx + 16, top + 10), (cx - 6, top - 30), (cx + 14, top - 70)]
d.line(pts, fill=(176, 36, 28, 255), width=40, joint='curve')
d.line(pts, fill=(222, 92, 60, 255), width=16, joint='curve')
wick = wick.filter(ImageFilter.GaussianBlur(1.2))
out = Image.alpha_composite(tinted, wick)
out.save(os.path.join(ROOT, 'asset-gen', 'rare-item-art', 'full', 'thunderBomb.webp'), 'WEBP', quality=90)
print('full/thunderBomb.webp')
