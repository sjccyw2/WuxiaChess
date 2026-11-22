"""Makes the game's files for characters from the roster pack (asset-gen/jianying-roster-art).

    python3 tools/roster-art.py fengTiannan jinBow ...

For each id it writes into game/assets/:
  motion-<id>.webp  the sheet at full size (1152 x 880, eight frames by five rows), WebP q85
  poses-<id>.png    the same at half size, 256 colours, drawn while the full sheet loads
  mini-<id>.webp    the first idle frame, cut about the cell's centre line down to the foot
  npc-<id>.webp     the portrait, 400 x 400 head and shoulders, from the 510 x 510 painting
Then name the id in game/src/data/roster-art.js. The pack's files are only read.

A sheet's specks of alpha 1 to 3 are cleared; the half-size sheet is averaged with colour
weighted by alpha, so no dark fringe bleeds in from the transparent pixels round a figure.
The pack paints villains half-length and troops closer, so a villain's portrait is cut from a
340 square and enlarged, a troop's from a 400 square as it is. FACE_X says where each face is.
Needs Pillow and NumPy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PACK = os.path.join(ROOT, 'asset-gen', 'jianying-roster-art')
OUT = os.path.join(ROOT, 'game', 'assets')
CELL_W, CELL_H, FOOT_Y = 144, 176, 162
# The horizontal centre of each face in the pack's portrait, as a share of its width.
FACE_X = dict(fengTiannan=.44, zhaoZhong=.52, wanYan=.55, xianYu=.52, wanZhen=.55,
              fiveTiger=.45, qingShield=.5, jinBow=.5, huaBlade=.55, wanDisciple=.55,
              dongFang=.55, liQiu=.51, hongAn=.57, qiuRen=.55, gongSun=.57,
              heiMuGuard=.55, xiaGuard=.53, shenLong=.55, ironPalm=.53, netHand=.59)


def cleaned(path):
    a = np.array(Image.open(path).convert('RGBA'))
    a[a[:, :, 3] <= 3] = 0
    return Image.fromarray(a, 'RGBA')


def halved(sheet):
    a = np.array(sheet, dtype=np.float64)
    weighted = np.concatenate([a[:, :, :3] * a[:, :, 3:] / 255, a[:, :, 3:]], axis=2)
    h, w = weighted.shape[:2]
    mean = weighted.reshape(h // 2, 2, w // 2, 2, 4).mean(axis=(1, 3))
    alpha = mean[:, :, 3:]
    rgb = np.where(alpha > 0, mean[:, :, :3] * 255 / np.maximum(alpha, 1e-6), 0)
    return Image.fromarray(
        np.concatenate([rgb, alpha], axis=2).round().clip(0, 255).astype(np.uint8), 'RGBA')


def still(sheet):
    cell = sheet.crop((0, 0, CELL_W, CELL_H))
    ys, xs = np.nonzero(np.array(cell)[:, :, 3])
    reach = int(max(CELL_W / 2 - xs.min(), xs.max() + 1 - CELL_W / 2)) + 1
    return cell.crop((CELL_W // 2 - reach, max(0, ys.min() - 1), CELL_W // 2 + reach, FOOT_Y + 1))


def portrait(path, face_x, villain):
    p = Image.open(path).convert('RGB')
    side = 340 if villain else 400
    x = int(min(p.width - side, max(0, face_x * p.width - side / 2)))
    face = p.crop((x, 0, x + side, side))
    return face if side == 400 else face.resize((400, 400), Image.LANCZOS)


def main(ids):
    with open(os.path.join(PACK, 'manifest.json'), encoding='utf-8') as f:
        group = {c['id']: c['group'] for c in json.load(f)['characters']}
    for k in ids:
        sheet = cleaned(os.path.join(PACK, 'sprites', k + '.png'))
        assert sheet.size == (8 * CELL_W, 5 * CELL_H), (k, sheet.size)
        files = {
            'motion': ('motion-%s.webp' % k, lambda f: sheet.save(
                f, 'WEBP', quality=85, method=6, alpha_quality=100)),
            'poses': ('poses-%s.png' % k, lambda f: halved(sheet).quantize(
                256, Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(f, optimize=True)),
            'mini': ('mini-%s.webp' % k, lambda f: still(sheet).save(
                f, 'WEBP', quality=88, method=6, alpha_quality=100)),
            'npc': ('npc-%s.webp' % k, lambda f: portrait(
                os.path.join(PACK, 'portraits', k + '.webp'), FACE_X.get(k, .5),
                group[k] == 'villain').save(f, 'WEBP', quality=82, method=6)),
        }
        for name, write in files.values():
            write(os.path.join(OUT, name))
        print(k, ' '.join('%s %d KB' % (n, os.path.getsize(os.path.join(OUT, n)) // 1024)
                          for n, _ in files.values()))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
