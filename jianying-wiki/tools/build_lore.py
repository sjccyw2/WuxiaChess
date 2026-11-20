#!/usr/bin/env python3
"""把《世界觀設定.md》嵌入《江湖志.html》。

世界觀的原稿是 jianying-wiki/世界觀設定.md。改完原稿後重跑本腳本，
圖鑑裡的「世界觀設定」分類、首頁摘要與下載用的 Markdown 就會一併更新：

    python3 jianying-wiki/tools/build_lore.py

腳本只改寫圖鑑內嵌的資料與補字字型，可以重複執行：

1. 解析原稿，寫入內嵌 catalog.json 的 groups.lore 與 worldview。
2. 把舊世界觀條目（story/world）的分類改標為「舊世界觀」。
3. 找出內嵌字型缺少的字，從 Noto CJK 原字型取出補字，
   以 unicode-range 補在原字型之後。原字型不動。

補字需要 fonttools 與 brotli（pip install fonttools brotli），以及
Noto Serif CJK Bold 與 Noto Sans CJK Regular 兩個 .ttc
（Debian/Ubuntu 的 fonts-noto-cjk 套件）。找不到字型時仍會更新資料，
缺字改由瀏覽器的後備字型顯示，並在結尾列出缺了哪些字。

頁面的版面與繪製程式直接寫在《江湖志.html》裡，不由本腳本產生。
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import re
import sys
from pathlib import Path

WIKI_DIR = Path(__file__).resolve().parent.parent
FONT_DIRS = [Path('/usr/share/fonts/opentype/noto')]

# 各節在圖鑑裡的網址代號、分類與一句導讀。導讀只說明該節談甚麼，
# 設定內容一律以原稿為準。原稿新增的節若未列在這裡，會自動取首段作導讀。
SECTIONS = {
    0: ('brief', '協作須知', '哪些設定已定案、哪些已否決、哪些尚待決定，以及補白而不改寫的寫作原則。'),
    1: ('premise', '機制', '世界觀要解釋的機制前提：一輪十張地圖、開局隨機三人、五人上場、養成、經濟與局外主線。'),
    2: ('logline', '核心設定', '把整個世界觀濃縮成一句話。'),
    3: ('dugu', '核心設定', '從無名少年到卡住的劍仙：獨孤求敗如何無敵、劍解成仙，又為何開出劍境、設下十局。'),
    4: ('rules', '核心設定', '劍境為何能跨越時代，三條仙規與兩個例外，記憶與功力如何留存，英雄與反派為何而戰。'),
    5: ('player', '核心設定', '玩家的身分、造就獨孤求敗的因果閉環、這個設定的三層意思，以及玩家在盤上的位置。'),
    6: ('mechanics', '機制', '每一項遊戲機制在世界內的解釋，附「了緣」條件示例，以及裝備這第一個破綻。'),
    7: ('npcs', '人物與主線', '神鵰、韋小寶與劍仙本人：不上場作戰的人物各自的身分與作用。'),
    8: ('volumes', '人物與主線', '玩家在多輪遊玩中揭開真相的五卷主線、卷四的伏筆、跨代對話、第十一局與結局。'),
    9: ('open', '未定案', '尚待製作人決定的問題，由遊戲名稱到金庸以外的人物。'),
    10: ('rights', '協作須知', '金庸人物的授權提醒，以及無法取得授權時的替代方案。'),
    11: ('glossary', '名詞表', '劍境、一念、劍解、了緣、絕位等專有名詞的釋義。'),
}

OLD_WORLD_TAG = ('世界觀', '舊世界觀')
FONT_START = '/* lore-fonts:start（由 tools/build_lore.py 產生，請勿手改） */'
FONT_END = '/* lore-fonts:end */'


# ── 解析原稿 ────────────────────────────────────────────────────────────

def plain(text: str) -> str:
    return text.replace('**', '')


def parse_markdown(source: str) -> dict:
    """解析原稿用到的 Markdown 子集：標題、引言、段落、清單與表格。"""
    lines = source.split('\n')
    doc = {'title': '', 'meta': [], 'sections': []}
    section = part = None
    i = 0

    def cells(row: str) -> list[str]:
        return [c.strip() for c in row.strip().strip('|').split('|')]

    def add(block: dict) -> None:
        if part is None:
            raise SystemExit(f'原稿第 {i + 1} 行：內容出現在第一個「## 節」之前')
        part['blocks'].append(block)

    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip() or re.fullmatch(r'-{3,}', line.strip()):
            i += 1
            continue
        if m := re.match(r'# (.+)', line):
            doc['title'] = m[1].strip()
            i += 1
            continue
        if section is None and line.startswith('>'):
            doc['meta'].append(line.lstrip('> ').strip())
            i += 1
            continue
        if m := re.match(r'## (\d+)\. (.+)', line):
            if section:
                section['endLine'] = i
            part = {'blocks': []}
            section = {'num': int(m[1]), 'name': m[2].strip(), 'line': i + 1, 'sections': [part]}
            doc['sections'].append(section)
            i += 1
            continue
        if m := re.match(r'### (.+)', line):
            part = {'title': m[1].strip(), 'blocks': []}
            section['sections'].append(part)
            i += 1
            continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(cells(lines[i]))
                i += 1
            if len(rows) < 2 or not all(re.fullmatch(r':?-+:?', c) for c in rows[1]):
                raise SystemExit(f'原稿第 {i} 行：表格缺少表頭分隔列')
            add({'table': {'head': rows[0], 'rows': rows[2:]}})
            continue
        for kind, pattern in (('ul', r'- (.+)'), ('ol', r'\d+\. (.+)')):
            if re.match(pattern, line):
                items = []
                while i < len(lines) and (m := re.match(pattern, lines[i].rstrip())):
                    items.append(m[1].strip())
                    i += 1
                add({kind: items})
                break
        else:
            add({'p': line.strip()})
            i += 1
    if section:
        section['endLine'] = len(lines)
    for s in doc['sections']:
        s['sections'] = [p for p in s['sections'] if p['blocks'] or p.get('title')]
        while lines[s['endLine'] - 1].strip() in ('', '---'):
            s['endLine'] -= 1
    return doc


def first_paragraph(section: dict) -> str:
    for part in section['sections']:
        for block in part['blocks']:
            if 'p' in block:
                return plain(block['p'])
    return ''


def build_lore(doc: dict, md_name: str) -> list[dict]:
    entries = []
    for s in doc['sections']:
        slug, tag, summary = SECTIONS.get(s['num'], (f"sec-{s['num']}", '設定', None))
        entries.append({
            'id': slug,
            'num': s['num'],
            'name': s['name'],
            'tag': tag,
            'summary': summary or first_paragraph(s),
            'sections': s['sections'],
            'sources': [{'file': md_name, 'line': s['line'], 'endLine': s['endLine']}],
        })
    ids = [e['id'] for e in entries]
    if len(set(ids)) != len(ids):
        raise SystemExit('原稿有重複的節號')
    return entries


def build_worldview(doc: dict, source: str, md_name: str) -> dict:
    logline = next((first_paragraph(s) for s in doc['sections'] if s['num'] == 2), '')
    return {
        'title': doc['title'],
        'meta': doc['meta'],
        'logline': logline,
        'source': md_name,
        'markdown': source,
    }


# ── 讀寫圖鑑內嵌的資料 ──────────────────────────────────────────────────

def embedded(html: str, name: str) -> tuple[int, int]:
    """回傳內嵌文件 name 的 base64 字串在 html 裡的起訖位置。"""
    key = f'"{name}":"'
    start = html.index(key, html.index('id="offline-files"')) + len(key)
    return start, html.index('"', start)


def read_embedded(html: str, name: str):
    start, end = embedded(html, name)
    return json.loads(base64.b64decode(html[start:end]).decode('utf-8'))


def write_embedded(html: str, name: str, value) -> str:
    start, end = embedded(html, name)
    raw = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    return html[:start] + base64.b64encode(raw).decode('ascii') + html[end:]


# ── 補字字型 ────────────────────────────────────────────────────────────

FACE = re.compile(
    r'@font-face \{\s*font-family: (\w+);\s*src: url\(data:font/woff;base64,([A-Za-z0-9+/=]+)\)[^}]*?'
    r'font-weight: ([\d ]+);'
)
BASE_FONTS = {'RiverSerif': ('Noto Serif CJK TC', 'NotoSerifCJK-Bold.ttc'),
              'RiverSans': ('Noto Sans CJK TC', 'NotoSansCJK-Regular.ttc')}


def strip_font_block(html: str) -> str:
    if FONT_START in html:
        a, b = html.index(FONT_START), html.index(FONT_END) + len(FONT_END)
        return html[:a].rstrip('\n') + '\n' + html[b:].lstrip('\n')
    return html


def page_text(html: str, documents: list) -> set[str]:
    """圖鑑會顯示的所有字：頁面本身的文字，加上各份內嵌文件。"""
    shell = re.sub(r'[A-Za-z0-9+/=]{400,}', '', html[: html.index('<!-- Font license')])
    text = shell + ''.join(json.dumps(d, ensure_ascii=False) for d in documents)
    return {c for c in text if ord(c) > 0x20}


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


def supplement_fonts(html: str, documents: list, font_paths: dict[str, Path | None]) -> tuple[str, list[str]]:
    """重建補字字型區塊。回傳新的 html 與各項說明。"""
    html = strip_font_block(html)
    notes = []
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        return html, ['未安裝 fonttools，略過補字（pip install fonttools brotli）']

    needed = page_text(html, documents)
    blocks = []
    for family, data, weight in FACE.findall(html):
        if family not in BASE_FONTS:
            continue
        have = TTFont(io.BytesIO(base64.b64decode(data))).getBestCmap()
        missing = sorted(c for c in needed if ord(c) not in have)
        if not missing:
            notes.append(f'{family}：原字型已涵蓋全部用字')
            continue
        path = font_paths.get(family)
        if not path or not path.exists():
            notes.append(f'{family}：找不到 {BASE_FONTS[family][1]}，以下 {len(missing)} 字改用後備字型：{"".join(missing)}')
            continue
        font = find_face(path, BASE_FONTS[family][0])
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
        out = io.BytesIO()
        font.flavor = 'woff2'
        font.save(out)
        blocks.append(
            '@font-face {\n'
            f'  font-family: {family};\n'
            f'  src: url(data:font/woff2;base64,{base64.b64encode(out.getvalue()).decode("ascii")}) format(\'woff2\');\n'
            f'  font-weight: {weight};\n'
            '  font-display: swap;\n'
            f'  unicode-range: {unicode_range(missing)};\n'
            '}'
        )
        notes.append(f'{family}：補 {len(missing)} 字，{len(out.getvalue()) / 1024:.0f} KB')
        if absent:
            notes.append(f'{family}：原字型也沒有這些字，改用後備字型：{"".join(absent)}')
    if blocks:
        anchor = html.index(':root {')
        html = html[:anchor] + '\n'.join([FONT_START, *blocks, FONT_END]) + '\n' + html[anchor:]
    return html, notes


def locate_font(name: str, given: str | None) -> Path | None:
    if given:
        return Path(given)
    for folder in FONT_DIRS:
        if (folder / name).exists():
            return folder / name
    return None


# ── 主流程 ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description='把世界觀設定嵌入江湖志圖鑑')
    parser.add_argument('--wiki', default=str(WIKI_DIR / '江湖志.html'))
    parser.add_argument('--md', default=str(WIKI_DIR / '世界觀設定.md'))
    parser.add_argument('--serif', help='NotoSerifCJK-Bold.ttc 的路徑')
    parser.add_argument('--sans', help='NotoSansCJK-Regular.ttc 的路徑')
    args = parser.parse_args()

    md_path, wiki_path = Path(args.md), Path(args.wiki)
    source = md_path.read_text(encoding='utf-8')
    doc = parse_markdown(source)
    if not doc['title'] or not doc['sections']:
        raise SystemExit('原稿缺少標題或章節')
    lore = build_lore(doc, md_path.name)

    html = wiki_path.read_text(encoding='utf-8')
    catalog = read_embedded(html, 'catalog.json')
    groups = catalog['groups']
    catalog['groups'] = {'lore': lore, **{k: v for k, v in groups.items() if k != 'lore'}}
    catalog['worldview'] = build_worldview(doc, source, md_path.name)
    for entry in catalog['groups'].get('story', []):
        if entry['id'] == 'world' and entry['tag'] == OLD_WORLD_TAG[0]:
            entry['tag'] = OLD_WORLD_TAG[1]
    html = write_embedded(html, 'catalog.json', catalog)

    corpus = read_embedded(html, 'text.json')
    html, notes = supplement_fonts(html, [catalog, corpus], {
        'RiverSerif': locate_font(BASE_FONTS['RiverSerif'][1], args.serif),
        'RiverSans': locate_font(BASE_FONTS['RiverSans'][1], args.sans),
    })
    wiki_path.write_text(html, encoding='utf-8')

    print(f'{doc["title"]}：{len(lore)} 節 → {wiki_path.name}')
    for entry in lore:
        parts = sum(len(p['blocks']) for p in entry['sections'])
        print(f'  {entry["num"]:>2} {entry["id"]:<10} {entry["name"]}（{parts} 段）')
    for note in notes:
        print('字型 · ' + note)


if __name__ == '__main__':
    sys.exit(main())
