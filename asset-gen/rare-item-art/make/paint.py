"""Paints the pictures for the items and manuals that are never on the shelf: the 珍品 and 秘寶 of
三盅通吃 and the 支線 (roadmap 0.68, the producer's decisions of 2026-11-28, Q-N170 to Q-N175).

    python3 asset-gen/rare-item-art/make/paint.py              # every picture, one try each
    python3 asset-gen/rare-item-art/make/paint.py snowLotus    # only these

Each is painted in the manner of two item pictures already in the game (寒潭短劍 and 九花玉露丸),
on a transparent ground, into full/<id>.png (1024 x 1024), kept as full/<id>.webp (quality 90).
cut.py writes the game's files.
The image model is called through api.py (the session proxy adds the key).
"""
import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api import generate  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FULL = os.path.join(ROOT, 'asset-gen', 'rare-item-art', 'full')
ASSETS = os.path.join(ROOT, 'game', 'assets')
ITEMS = {
    'snowLotus': 'a single 天山雪蓮, a snow lotus of the Tianshan mountains: a large pale white-and-faint-green lotus-like '
                 'flower with long pointed petals, frost crystals on its tips, on a short stem with two leaves',
    'yuanBlade': '鴛刀, the "drake" sabre of a matched pair: a straight-backed single-edged Chinese dao with a dark steel blade, '
                 'a gilded guard shaped like a drake mandarin duck, and a red silk tassel on the pommel',
    'yangBlade': '鴦刀, the "duck" sabre of a matched pair: a slightly shorter, slenderer single-edged Chinese dao with a '
                 'bright silver blade, a gilded guard shaped like a hen mandarin duck, and a jade-green silk tassel',
    'scarletToad': '莽牯朱蛤, a tiny vivid crimson toad with gold flecks on its back, carved in red coral and hung as a '
                   'pendant on a braided gold cord with a small jade bead',
    'ironDagger': '削鐵匕首, a short dagger that cuts iron like mud: a narrow, very keen blue-black blade with a faint '
                  'cold sheen, a plain gilt guard, a hilt wrapped in black sharkskin, in no scabbard',
    'loadedDice': '灌鉛骰子, 韋小寶\'s loaded dice: three small old ivory Chinese dice with red one-pips and black pips, '
                  'one of them cracked open a little to show a bead of grey lead inside, lying together',
    'ironToken': '玄鐵令, a black iron token of command: a thick, round-cornered rectangular plaque of dull blue-black '
                 'meteoric iron, an archaic seal-script character raised on its face, a short black silk cord through a hole at the top',
    'lot-pebble': 'a single plain, smooth, flat grey river pebble, nothing else: the empty prize of a cup game',
    'guide-secret': 'a secret martial-arts manual (秘笈): an old thread-bound Chinese book with a dark indigo cover, a '
                    'blank vermilion title slip, its corners worn and a red silk ribbon tied round it',
}


def prompt(id):
    return ('A single object: ' + ITEMS[id] + '. Paint it in exactly the manner of the two reference pictures: '
            'a detailed, softly lit, semi-realistic painted game item icon, the object alone and centred, seen '
            'slightly from above at a gentle diagonal, filling about two thirds of the frame. Transparent background, '
            'no ground, no shadow, no text, no border, no seal, no frame.')


def paint(id):
    from PIL import Image
    refs = []
    for i, name in enumerate(['item-frost', 'item-nineFlowerPill']):
        p = os.path.join(FULL, '.ref-%d.png' % i)
        if not os.path.exists(p):
            Image.open(os.path.join(ASSETS, name + '.webp')).convert('RGBA').resize((512, 512), Image.LANCZOS).save(p)
        refs.append(p)
    out = os.path.join(FULL, id + '.png')
    line = generate(prompt(id), '1024x1024', out, refs=refs, transparent=True)
    if os.path.exists(out):
        Image.open(out).save(os.path.join(FULL, id + '.webp'), 'WEBP', quality=90)
        os.remove(out)
    return line


if __name__ == '__main__':
    os.makedirs(FULL, exist_ok=True)
    ids = sys.argv[1:] or list(ITEMS)
    with ThreadPoolExecutor(6) as pool:
        for line in pool.map(paint, ids):
            print(line, flush=True)
