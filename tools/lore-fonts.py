#!/usr/bin/env python3
"""補字字型：為圖鑑補上兩套內嵌字型缺少的字。

遊戲的兩套字型（game/assets/river-serif.woff、river-sans.woff）只收錄遊戲
用到的字。世界觀原稿（wiki/content/世界觀設定.md）或遊戲文字出現新字時，
重跑本腳本：

    python3 tools/lore-fonts.py

它會找出缺字，從 Noto CJK 原字型取出這些字，寫成

    wiki/assets/lore-serif.woff2
    wiki/assets/lore-sans.woff2
    wiki/styles/lore-fonts.css   （以 unicode-range 補在原字型之後）

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

# family -> (file in game/assets, weight range, Noto family, Noto collection, output name)
FACES = {
    'RiverSerif': ('river-serif.woff', '650 900', 'Noto Serif CJK TC', 'NotoSerifCJK-Bold.ttc', 'lore-serif.woff2'),
    'RiverSans': ('river-sans.woff', '100 900', 'Noto Sans CJK TC', 'NotoSansCJK-Regular.ttc', 'lore-sans.woff2'),
}
HEADER = "/* Extra characters the game's two fonts lack. Written by tools/lore-fonts.py; do not edit by hand. */\n"


def shown_text() -> set[str]:
    """圖鑑可能顯示的所有非 ASCII 字：圖鑑本身、世界觀原稿，以及遊戲的文字。"""
    files = [ROOT / 'wiki/index.html', ROOT / 'game/index.html']
    files += sorted((ROOT / 'wiki/content').glob('*.md'))
    for folder in ('wiki/src', 'game/src'):
        files += sorted((ROOT / folder).rglob('*.js'))
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


def main() -> None:
    parser = argparse.ArgumentParser(description='為江湖志圖鑑產生補字字型')
    parser.add_argument('--serif', help='NotoSerifCJK-Bold.ttc 的路徑')
    parser.add_argument('--sans', help='NotoSansCJK-Regular.ttc 的路徑')
    parser.add_argument('--check', action='store_true', help='只列出缺字，不寫檔')
    args = parser.parse_args()
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        sys.exit('未安裝 fonttools（pip install fonttools brotli）')

    needed = shown_text()
    given = {'RiverSerif': args.serif, 'RiverSans': args.sans}
    blocks = []
    for family, (base, weight, noto_family, noto_file, out_name) in FACES.items():
        have = TTFont(str(ROOT / 'game/assets' / base)).getBestCmap()
        missing = sorted(c for c in needed if ord(c) not in have)
        if not missing:
            print(f'{family}：原字型已涵蓋全部用字')
            continue
        print(f'{family}：缺 {len(missing)} 字：{"".join(missing)}')
        if args.check:
            continue
        path = locate(noto_file, given[family])
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
        font.save(str(ROOT / 'wiki/assets' / out_name))
        size = (ROOT / 'wiki/assets' / out_name).stat().st_size
        blocks.append(
            '@font-face {\n'
            f'  font-family: {family};\n'
            f"  src: url('../assets/{out_name}') format('woff2');\n"
            f'  font-weight: {weight};\n'
            '  font-display: swap;\n'
            f'  unicode-range: {unicode_range(missing)};\n'
            '}\n'
        )
        print(f'  補 {len(missing)} 字，{size / 1024:.0f} KB → wiki/assets/{out_name}')
        if absent:
            print(f'  Noto 也沒有這些字，改用後備字型：{"".join(absent)}')
    if not args.check:
        (ROOT / 'wiki/styles/lore-fonts.css').write_text(HEADER + ''.join(blocks), encoding='utf-8')
        print('已寫入 wiki/styles/lore-fonts.css')


if __name__ == '__main__':
    main()
