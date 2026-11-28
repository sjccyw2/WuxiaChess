"""Repaints the twenty heroes' full-length figures (整備's scroll, 抓子, the wardrobe) in high
definition. The game's figures were 280 x 440, and the ten heroes added on 2026-11-22 had only an
enlarged sprite frame; shown large in the ink look (2026-11-27) they read soft. Asked by the
producer on 2026-11-28.

    python3 asset-gen/hero-figures/make/paint.py              # all twenty, one try each
    python3 asset-gen/hero-figures/make/paint.py hero guo     # only these

Each figure is painted from two pictures already in the game: the hero's portrait (the face) and
the hero's present figure (the clothes, colours and what they carry), in the manner of 令狐冲's
painted figure. Paintings land in full/<id>.png (1024 x 1536) and are kept as full/<id>.webp (quality 90);
cut.py writes the game's files.
The image model is called through api.py (the session proxy adds the key).
"""
import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api import generate  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FULL = os.path.join(ROOT, 'asset-gen', 'hero-figures', 'full')
ASSETS = os.path.join(ROOT, 'game', 'assets')
# Portrait file for each hero (panels.js `portraits` and the heroes' portraitFile).
PORTRAIT = {'hero': 'portraits-shen', 'medic': 'portraits-lu', 'guard': 'portraits-pei', 'guo': 'portraits-guo',
            'xiao': 'portraits-xiao', 'duan': 'portraits-duan', 'huang': 'portraits-huang', 'yang': 'portraits-yang',
            'zhang': 'portraits-zhang', 'hu': 'portraits-hu'}
HEROES = {
    'hero': '令狐冲, a free-spirited young swordsman of the Huashan sect',
    'medic': '任盈盈, an elegant young woman, a musician of the Sun Moon sect',
    'guard': '向問天, a burly, fierce middle-aged warrior of the Sun Moon sect',
    'guo': '郭靖, a broad, honest young hero from the northern steppes',
    'xiao': '小龍女, a serene, ethereal young woman in white of the Ancient Tomb sect',
    'duan': '段譽, a gentle young scholar-prince of Dali',
    'huang': '黃蓉, a clever, lively young woman of Peach Blossom Island',
    'yang': '楊過, a one-armed wandering swordsman, his empty right sleeve hanging',
    'zhang': '張無忌, a young leader of the Ming cult',
    'hu': '胡斐, a bold young fox-like swordsman of the Liaodong Hu clan',
    'qiaoFeng': '蕭峰, a towering, rugged beggar-sect hero with wild hair',
    'xuZhu': '虛竹, a gentle young shaven-headed monk',
    'hongQi': '洪七公, an old, cheerful beggar-sect chief with a gourd',
    'yaoShi': '黃藥師, an aloof, refined master of Peach Blossom Island',
    'sanFeng': '張三丰, a very old Taoist grandmaster of Wudang',
    'zhaoMin': '趙敏, a bold, elegant young Mongol princess',
    'lingSu': '程靈素, a plain, quiet young herbalist woman',
    'diYun': '狄雲, a rough, honest young countryman',
    'chengZhi': '袁承志, a steady young hero of the Huashan sect',
    'aQing': '阿青, a simple young shepherd girl of Yue with a bamboo staff',
}


def prompt(id):
    return (
        'A full-length standing figure of ' + HEROES[id] + '. The first reference picture is this '
        'character\'s face: keep the same face, hair and age exactly. The second reference picture is '
        'this character\'s present full-length figure: keep the same clothes, colours, build, stance '
        'and whatever they hold or carry, but paint it new in high definition. Paint in the manner of '
        'the third reference picture: a fine gongbi-style ink and wash costume plate on a plain, flat, '
        'warm parchment background with nothing else on it. The whole body is shown from the top of '
        'the head to the soles of the feet, centred, with a little margin above and below, facing the '
        'viewer or three-quarters. Crisp, detailed linework and fabric. Even soft light, no shadow on '
        'the ground, no text, no border, no seal, no frame.')


def paint(id):
    refs = [os.path.join(ASSETS, (PORTRAIT.get(id) or 'npc-' + id) + '.webp'),
            os.path.join(ASSETS, 'figure-' + id + '.webp'),
            os.path.join(ASSETS, 'figure-hero.webp')]
    # The API takes PNG references.
    from PIL import Image
    pngs = []
    for i, r in enumerate(refs):
        p = os.path.join(FULL, '.ref-%s-%d.png' % (id, i))
        im = Image.open(r).convert('RGB')
        if im.width < 512:
            im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
        im.save(p)
        pngs.append(p)
    out = os.path.join(FULL, id + '.png')
    line = generate(prompt(id), '1024x1536', out, refs=pngs)
    for p in pngs:
        os.remove(p)
    return line


if __name__ == '__main__':
    ids = sys.argv[1:] or list(HEROES)
    os.makedirs(FULL, exist_ok=True)
    with ThreadPoolExecutor(5) as pool:
        for line in pool.map(paint, ids):
            print(line, flush=True)
