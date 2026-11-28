"""Paints the characters of the four boards added on 2026-11-28 (cast.py): a portrait each, then
a sprite sheet painted from that portrait in the roster pack's layout.

    python3 asset-gen/board-villains/make/paint.py                 # every character, both pictures
    python3 asset-gen/board-villains/make/paint.py portrait wenDa  # one picture of one character
    python3 asset-gen/board-villains/make/paint.py sheet wenDa heBi

Paintings land in asset-gen/board-villains/full/ as <id>-portrait.png (1024 square) and
<id>-sheet.png (1408 x 1072, transparent). fit.py makes the pack's files from them. The model is
called through api.py (the session proxy adds the key); the roster pack's own portrait and sheet
of a like character (cast.py `like`) are given as the reference for style, scale and layout.
"""
import os
import sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from api import generate  # noqa: E402
from cast import CAST  # noqa: E402

ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
PACK = os.path.join(ROOT, 'asset-gen', 'jianying-roster-art')
FULL = os.path.join(ROOT, 'asset-gen', 'board-villains', 'full')
REFS = os.path.join(FULL, 'refs')


def ref(kind, like):
    """The pack's picture as a PNG the API takes (WebP portraits are converted once)."""
    from PIL import Image
    os.makedirs(REFS, exist_ok=True)
    out = os.path.join(REFS, '%s-%s.png' % (kind, like))
    if not os.path.exists(out):
        src = os.path.join(PACK, 'portraits', like + '.webp') if kind == 'portrait' else \
            os.path.join(PACK, 'sprites', like + '.png')
        Image.open(src).save(out)
    return out


def portrait(k):
    c = CAST[k]
    framing = ('a head-and-shoulders bust, closer than half-length, as the reference troop portrait '
               'is framed' if c['group'] == 'troop' else 'half-length, framed as the reference is')
    prompt = (
        'A portrait painted in exactly the manner of the reference picture: the same brushwork, '
        'warm dramatic lighting, misty ink-wash mountain background in parchment and umber tones, '
        'and the same scale. ' + framing + '. The subject: ' + c['look'] + '; holding ' + c['weapon'] +
        '. A Chinese wuxia character of the novel ' + c['book'] + ', painted realistically. Face '
        'turned three-quarters to the viewer\'s left. No text, no seal, no border, no frame.')
    out = os.path.join(FULL, k + '-portrait.png')
    return generate(prompt, '1024x1024', out, refs=[ref('portrait', c['like'])])


def sheet(k):
    c = CAST[k]
    prompt = (
        'A game sprite sheet laid out exactly like the first reference picture: a grid of 8 columns '
        'by 5 rows of small full-body figures of one character on a fully transparent background, '
        'every figure the same height and scale as in the reference, each centred in its own cell '
        'with clear empty space between cells, feet on the same baseline in every row, in the same '
        'painterly realistic style. The character is the one in the second reference picture: ' +
        c['look'] + '; holding ' + c['weapon'] + '. In every frame the figure faces three-quarters '
        'to the right, as the reference figures do. '
        'Row 1: idle, standing at ease, breathing, eight nearly identical frames. '
        'Row 2: walking to the right, a full eight-frame walk cycle. '
        'Row 3: attack: two frames standing ready, then ' + c['attack'] + ', then recovering. '
        'Row 4: hurt: recoiling backward from a blow, flinching, then steadying. '
        'Row 5: special technique: ' + c['special'] + ', then returning to stance. '
        'No text, no grid lines, no labels, no ground shadow, no background.')
    out = os.path.join(FULL, k + '-sheet.png')
    return generate(prompt, '1408x1072', out, refs=[ref('sheet', c['like']), os.path.join(FULL, k + '-portrait.png')],
                    transparent=True)


if __name__ == '__main__':
    args = sys.argv[1:]
    kinds = [a for a in args if a in ('portrait', 'sheet')] or ['portrait', 'sheet']
    ids = [a for a in args if a in CAST] or list(CAST)
    os.makedirs(FULL, exist_ok=True)
    with ThreadPoolExecutor(6) as pool:
        if 'portrait' in kinds:
            for line in pool.map(portrait, ids):
                print(line, flush=True)
        if 'sheet' in kinds:
            for line in pool.map(sheet, ids):
                print(line, flush=True)
