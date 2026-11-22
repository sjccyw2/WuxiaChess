# Paints the board objects (roadmap 0.11, stage two): an intact and a broken picture of each.
#   python3 asset-gen/battle-objects/paint.py [intact|broken] [id ...]
# The intact pictures are painted with two of the item pack's pictures beside the prompt for the
# style; each broken one is painted from its intact picture so the two match. Full-size PNGs go
# to full/, and cut.py makes the game's small webp files from them.
import os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(__file__))
from api import generate

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
ITEMS = os.path.join(ROOT, 'asset-gen', 'jianying-item-art', 'gear')

STYLE = (
    "Painted in the same style as the reference item pictures: painterly realism, fine detail, soft "
    "even light from the upper left, muted natural colours, a game prop shown whole. Seen in "
    "three-quarter view from slightly above, standing on its own base as if on the ground, its base "
    "near the bottom of the picture. Only this one object, centred, on a fully transparent background: "
    "no ground plane, no cast-shadow block, no frame, no text, no characters or writing anywhere, "
    "no people.")

INTACT = {
    # 空山琴臺 (board 4): the qin 曲洋 and 劉正風 played their 笑傲江湖 on. Grey mountain stone,
    # jade-hairpin flowers, mountain bamboo.
    'qin': "A seven-string guqin of dark brown lacquered paulownia wood, with small mother-of-pearl "
           "hui dots along the near edge, silk strings and jade tuning pegs, lying across a low, "
           "weathered grey stone qin table with plain carved legs. Two or three white jade-hairpin "
           "blossoms have fallen on the stone beside it. Quiet, untouched, a little dusty.",
    # 襄陽殘垣 (board 6): the city's war drum, silent on the broken wall. Brick, dust, old red.
    'drum': "A large war drum from the walls of a besieged Song-dynasty city: a barrel drum of old "
            "red lacquered wood with rows of brass studs and an ox-hide face, set upright, slightly "
            "tilted, in a sturdy dark wooden frame stand. Two heavy drumsticks with faded red cloth "
            "tied at the grips rest in the frame. The lacquer is worn and dusty from a long siege.",
    # 無刻漏臺 (board 9): one of the two posts the star ropes are tied to. Bronze, carved stone,
    # night blue.
    'starPost': "A squat octagonal bronze mooring post from an ancient astronomical water-clock "
                "terrace, green-bronze with patina, its sides engraved with star charts and "
                "constellation lines, set on a round carved stone base. A thick rope of twisted, "
                "faintly glowing silver-blue starlight is knotted around the post and rises straight "
                "up out of the top edge of the picture, taut, as if hanging down from the sky.",
}

BROKEN = {
    'qin': "The same guqin and stone table, broken by a palm blow: the strings snapped and curling "
           "loose, a long split down the lacquered body, one end cracked off and lying on the "
           "table, a corner of the stone table chipped. The fallen blossoms scattered.",
    'drum': "The same war drum, broken: the hide face torn open in a long rent, one side of the "
            "wooden frame cracked and sagging so the drum leans further, one drumstick snapped in "
            "two, a few brass studs fallen out.",
    'starPost': "The same bronze post, its rope cut: the glowing star rope snapped just above the "
                "knot, the loose end frayed and curling down, its light gone dim and drifting away "
                "in a few faint sparks; nothing rises from the top of the picture any more. The "
                "post itself is cracked and leans a little on its stone base.",
}

KEEP = ("Keep the object exactly the same: the same angle, size, position in the picture, "
        "materials and painting style. Fully transparent background, no ground, no text.")


def style_refs():
    # The first frame of two item sheets, cut to temporary files.
    from PIL import Image
    import tempfile
    refs = []
    for name in ('hedgehogVest', 'bellJade'):
        path = os.path.join(tempfile.gettempdir(), f'battle-objects-style-{name}.png')
        Image.open(os.path.join(ITEMS, name + '.png')).crop((0, 0, 256, 256)).save(path)
        refs.append(path)
    return refs


def paint(kind, id):
    out = os.path.join(HERE, 'full', f'{id}{"-broken" if kind == "broken" else ""}.png')
    if kind == 'intact':
        return generate(INTACT[id] + ' ' + STYLE, '1024x1024', out, refs=style_refs(), transparent=True)
    return generate(BROKEN[id] + ' ' + KEEP, '1024x1024', out,
                    refs=[os.path.join(HERE, 'full', f'{id}.png')], transparent=True)


if __name__ == '__main__':
    kind = sys.argv[1] if len(sys.argv) > 1 else 'intact'
    ids = sys.argv[2:] or list(INTACT)
    with ThreadPoolExecutor(len(ids)) as pool:
        for line in pool.map(lambda id: paint(kind, id), ids):
            print(line, flush=True)
