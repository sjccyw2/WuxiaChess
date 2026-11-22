"""Paints the two pictures the youth needs as a piece on the board (the last board, and every run
after the ending): his full-length figure for the 整備 page and the picture of his sword, 利劍.

    python3 asset-gen/story-characters/make/paint.py            # paint both, three tries each
    python3 asset-gen/story-characters/make/paint.py figure     # only one

Paintings land in asset-gen/story-characters/full/ as <name>-<try>.png. The try chosen is kept there
as figure.webp (the second of three, 2026-11-22) and sword.png (the second of three); the others
are not kept. cut.py writes the game's files from those two. The image model is called through
api.py (the session proxy adds the key). Each is painted from pictures already in the game, so the
style matches theirs.
"""
import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api import generate  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FULL = os.path.join(ROOT, 'asset-gen', 'story-characters', 'full')
ASSETS = os.path.join(ROOT, 'game', 'assets')

JOBS = {
    # The 整備 page's full-length figure, as the ten heroes have (figure-<id>.webp, 280 x 440).
    'figure': dict(
        size='1024x1536',
        refs=[os.path.join(ROOT, 'asset-gen', 'story-characters', 'cards', 'youth.webp'),
              os.path.join(ASSETS, 'figure-hero.webp')],
        prompt=(
            'A full-length standing figure of the youth in the first reference picture, painted in '
            'exactly the manner of the second reference picture: a fine gongbi-style ink and wash '
            'costume plate on a plain, flat, warm parchment background with nothing else on it. '
            'The same youth: about seventeen, lean and sun-browned, plain features, long black hair '
            'tied back roughly with a strip of cloth and loose strands across the brow; a coarse '
            'undyed hemp tunic under a faded indigo outer layer patched at the shoulder, a rope '
            'belt, cloth leggings and worn boots; clothes of no identifiable dynasty, no ornaments. '
            'He stands facing the viewer, relaxed and steady, arms at his sides, a plain straight '
            'double-edged sword in a worn scabbard at his left hip. The whole body is shown from '
            'the top of the head to the soles of the boots, centred, with a little margin above '
            'and below. Even soft light, no shadow on the ground, no text, no border, no seal.')),
    # The sword he draws from the rock on the last board: 利劍, the first sword of the tomb.
    'sword': dict(
        size='1024x1024', transparent=True,
        refs=[os.path.join(ASSETS, 'item-starSteel.webp')],
        prompt=(
            'A single game item picture in exactly the manner of the reference picture: one sword '
            'painted alone on a fully transparent background, lying on the same diagonal, point to '
            'the upper right, hilt to the lower left, filling the frame as the reference does. '
            'This sword is plainer and older than the reference: a straight, narrow, double-edged '
            'steel blade about four feet long, ground very keen, bright along both edges with a '
            'faint blue-green sheen, a few fine nicks of long use; a small plain dark iron guard, '
            'a grip bound in worn dark cord, a plain iron pommel; no gold, no jewels, no '
            'engraving, no tassel. Painted realistically with soft highlights. No scabbard, no '
            'text, no shadow, no background.')),
}


def paint(name, k):
    job = JOBS[name]
    out = os.path.join(FULL, '%s-%d.png' % (name, k))
    return generate(job['prompt'], job['size'], out, refs=job['refs'],
                    transparent=job.get('transparent', False))


if __name__ == '__main__':
    names = sys.argv[1:] or list(JOBS)
    os.makedirs(FULL, exist_ok=True)
    with ThreadPoolExecutor(6) as pool:
        for line in pool.map(lambda a: paint(*a), [(n, k) for n in names for k in (1, 2, 3)]):
            print(line)
