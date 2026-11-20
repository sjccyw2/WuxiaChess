#!/usr/bin/env python3
"""補字字型：為遊戲與圖鑑補上兩套字型缺少的字。

兩套字型（game/assets/river-serif.woff、river-sans.woff）只收錄當初遊戲
用到的字。遊戲文字或圖鑑原稿（wiki/content/*.md）出現新字時，重跑本腳本：

    python3 tools/extra-fonts.py

它會找出缺字，從 Noto CJK 原字型取出這些字，分成兩組：

    遊戲的缺字   game/assets/extra-serif.woff2、extra-sans.woff2
    圖鑑另缺的字 wiki/assets/lore-serif.woff2、lore-sans.woff2

並寫出兩份樣式表：

    game/styles/11-extra-fonts.css   遊戲用，只載入第一組
    wiki/styles/extra-fonts.css      圖鑑用，兩組都載入

分兩組是為了讓遊戲不必下載只有圖鑑原稿才用到的字。補字以 unicode-range
掛在原字型之外，瀏覽器只在頁面真的出現這些字時才下載。樣式表裡的
font-weight 必須與各自頁面裡原字型的宣告完全相同，否則瀏覽器不會把補字與
原字型合成同一套字。

原字型不動。不跑本腳本也不影響內容：缺的字會改用瀏覽器的後備字型顯示。

需要 fonttools 與 brotli（pip install fonttools brotli），以及
Noto Serif CJK Bold 與 Noto Sans CJK Regular 兩個 .ttc
（Debian/Ubuntu 的 fonts-noto-cjk 套件；或以 --serif、--sans 指定路徑）。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIRS = [Path('/usr/share/fonts/opentype/noto')]

# family -> (base font in game/assets, Noto family, Noto collection, file suffix)
FACES = {
    'RiverSerif': ('river-serif.woff', 'Noto Serif CJK TC', 'NotoSerifCJK-Bold.ttc', 'serif'),
    'RiverSans': ('river-sans.woff', 'Noto Sans CJK TC', 'NotoSansCJK-Regular.ttc', 'sans'),
}
# Each set: where its text comes from, and where its font files go. A later set leaves
# out the characters an earlier one already supplies.
SETS = {
    'game': (['game/index.html', 'game/src/**/*.js'], 'game/assets/extra-{}.woff2'),
    'wiki': (['wiki/index.html', 'wiki/content/*.md', 'wiki/src/**/*.js'], 'wiki/assets/lore-{}.woff2'),
}
# stylesheet -> (the sets it loads, the font-weight its page declares for the two fonts)
SHEETS = {
    'game/styles/11-extra-fonts.css': (['game'], {'RiverSerif': '200 900', 'RiverSans': '400 600'}),
    'wiki/styles/extra-fonts.css': (['game', 'wiki'], {'RiverSerif': '650 900', 'RiverSans': '100 900'}),
}
HEADER = "/* Extra characters the two River fonts lack. Written by tools/extra-fonts.py; do not edit by hand. */\n"


def shown_text(patterns: list[str]) -> set[str]:
    """這些檔案裡可能顯示的所有非 ASCII 字。"""
    files = [f for pattern in patterns for f in sorted(ROOT.glob(pattern))]
    text = ''.join(f.read_text(encoding='utf-8') for f in files)
    return {c for c in text if ord(c) > 0x7F}


def unicode_range(chars: list[str]) -> str:
    codes = sorted(ord(c) for c in chars)
    runs, start, prev = [], codes[0], codes[0]
    for code in codes[1:] + [None]:
        if code is not None and code == prev + 1:
            prev = code
            continue
        runs.append(f'U+{start:X}' if start == prev else f'U+{start:X}-{prev:X}')
        if code is not None:
            start = prev = code
    return ', '.join(runs)


def find_face(path: Path, family: str):
    from fontTools.ttLib import TTCollection, TTFont

    count = len(TTCollection(str(path), lazy=True).fonts)
    for number in range(count):
        font = TTFont(str(path), fontNumber=number, lazy=True, recalcTimestamp=False)
        if font['name'].getDebugName(1) == family:
            return font
    raise SystemExit(f'{path} 裡找不到 {family}')


def locate(name: str, given: str | None) -> Path | None:
    if given:
        return Path(given)
    for folder in FONT_DIRS:
        if (folder / name).exists():
            return folder / name
    return None


def relative(sheet: str, target: str) -> str:
    """樣式表 sheet 指向 target 的相對路徑。"""
    here, there = Path(sheet).parent.parts, Path(target).parts
    shared = 0
    while shared < len(here) and here[shared] == there[shared]:
        shared += 1
    return '/'.join(['..'] * (len(here) - shared) + list(there[shared:]))


def main() -> None:
    parser = argparse.ArgumentParser(description='為遊戲與江湖志圖鑑產生補字字型')
    parser.add_argument('--serif', help='NotoSerifCJK-Bold.ttc 的路徑')
    parser.add_argument('--sans', help='NotoSansCJK-Regular.ttc 的路徑')
    parser.add_argument('--check', action='store_true', help='只列出缺字，不寫檔')
    args = parser.parse_args()
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        sys.exit('未安裝 fonttools（pip install fonttools brotli）')

    given = {'RiverSerif': args.serif, 'RiverSans': args.sans}
    # (set, family) -> (font file, unicode-range) for every supplement that was written
    written = {}
    for family, (base, noto_family, noto_file, suffix) in FACES.items():
        have = set(TTFont(str(ROOT / 'game/assets' / base)).getBestCmap())
        path = locate(noto_file, given[family])
        for name, (patterns, out) in SETS.items():
            missing = sorted(c for c in shown_text(patterns) if ord(c) not in have)
            target = out.format(suffix)
            if not missing:
                print(f'{family}・{name}：沒有缺字')
                continue
            print(f'{family}・{name}：缺 {len(missing)} 字：{"".join(missing)}')
            if args.check:
                continue
            if not path or not path.exists():
                print(f'  找不到 {noto_file}，這些字改用後備字型')
                continue
            font = find_face(path, noto_family)
            options = subset.Options()
            options.flavor = 'woff2'
            options.desubroutinize = True
            options.notdef_outline = True
            subsetter = subset.Subsetter(options)
            subsetter.populate(text=''.join(missing))
            subsetter.subset(font)
            covered = font.getBestCmap()
            absent = [c for c in missing if ord(c) not in covered]
            missing = [c for c in missing if ord(c) in covered]
            font.flavor = 'woff2'
            font.save(str(ROOT / target))
            written[name, family] = (target, unicode_range(missing))
            have |= {ord(c) for c in missing}
            print(f'  補 {len(missing)} 字，{(ROOT / target).stat().st_size / 1024:.0f} KB → {target}')
            if absent:
                print(f'  Noto 也沒有這些字，改用後備字型：{"".join(absent)}')
    if args.check:
        return
    for sheet, (sets, weights) in SHEETS.items():
        blocks = [
            '@font-face {\n'
            f'  font-family: {family};\n'
            f"  src: url('{relative(sheet, written[name, family][0])}') format('woff2');\n"
            f'  font-weight: {weights[family]};\n'
            '  font-display: swap;\n'
            f'  unicode-range: {written[name, family][1]};\n'
            '}\n'
            for name in sets
            for family in FACES
            if (name, family) in written
        ]
        (ROOT / sheet).write_text(HEADER + ''.join(blocks), encoding='utf-8')
        print('已寫入 ' + sheet)


if __name__ == '__main__':
    main()
