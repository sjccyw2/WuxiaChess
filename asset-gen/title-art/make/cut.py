# Cuts the game's title picture from a painted take: the ink becomes the alpha, coloured ivory,
# trimmed to the ink with a small margin.
#   python3 asset-gen/title-art/make/cut.py [take]     (default c)
# writes game/assets/title-jianying.webp
import sys, os
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
take = sys.argv[1] if len(sys.argv) > 1 else 'c'
src = Image.open(os.path.join(HERE, f'../full/ink-{take}.png')).convert('L')
# Paper to 0, ink to 255, with a gentle ramp so the dry-brush edges keep their grain.
ink = ImageOps.invert(src).point(lambda v: 0 if v < 28 else min(255, int((v - 28) * 255 / 170)))
box = ink.getbbox()
pad = 12
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(ink.width, box[2] + pad), min(ink.height, box[3] + pad))
ink = ink.crop(box)
out = Image.new('RGBA', ink.size, (245, 237, 218, 0))
out.putalpha(ink)
W = 1200
out = out.resize((W, round(ink.height * W / ink.width)), Image.LANCZOS)
dest = os.path.join(HERE, '../../../game/assets/title-jianying.webp')
out.save(dest, 'WEBP', quality=90, method=6)
print(dest, out.size, os.path.getsize(dest), 'bytes')
