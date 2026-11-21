#!/usr/bin/env python3
"""Converts the painted item and effect sheets in asset-gen/jianying-item-art/ for the game.

    python3 tools/item-art.py            # every effect and item the game uses
    python3 tools/item-art.py effects    # only the effect sheets
    python3 tools/item-art.py items      # only the item pictures

The source sheets are transparent PNGs of 4 x 2 frames (effects 384 x 256 a frame, items
256 x 256), far larger than the game shows them. This writes, into game/assets/:

    fx-<effect>.webp         an effect sheet, still 4 x 2 frames, at 288 x 192 a frame. The board
                             draws a frame at most about 140 CSS px wide at its normal zoom.
    item-<id>.webp           an item's still picture: its first frame, 256 x 256. Items are shown
                             still, never animated (decision of 2026-11-21), so the other seven
                             frames of an item sheet are not used.

Which items: those the game has (read from game/src/rules/game.js), less KEEP, whose pictures
stay as they are. Which effects: those named in game/src/fx/painted-effects.js. Nothing in
asset-gen/ is changed. Needs Pillow; node must be on the path to read the game's item list.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / 'asset-gen' / 'jianying-item-art'
ASSETS = ROOT / 'game' / 'assets'

# 古墓長劍 keeps the old still picture of 青鋒劍; the pack has no sheet of its own for it.
KEEP = {'tombSword'}
EFFECT_WIDTH = 1152  # 4 frames of 288 px
ITEM_SIZE = 256  # the still
STILL_QUALITY = 82
EFFECT_QUALITY = 80


def game_items() -> list[str]:
    script = "const G = await import('./game/src/rules/game.js'); console.log(JSON.stringify(Object.keys(G.ITEMS)));"
    out = subprocess.run(
        ['node', '--input-type=module', '-e', script], cwd=ROOT, check=True, capture_output=True, text=True
    )
    return json.loads(out.stdout.strip().splitlines()[-1])


def game_effects() -> list[str]:
    source = (ROOT / 'game' / 'src' / 'fx' / 'painted-effects.js').read_text(encoding='utf-8')
    return sorted(set(re.findall(r"file: 'fx-([a-z-]+)\.webp'", source)))


def frames(sheet: dict) -> tuple[Image.Image, list[Image.Image], list[int]]:
    image = Image.open(PACK / sheet['path']).convert('RGBA')
    cells = [image.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])) for f in sheet['frames']]
    return image, cells, [f['previewDurationMs'] for f in sheet['frames']]


def convert_effect(asset: dict) -> str:
    image, _, _ = frames(asset['sheet'])
    height = EFFECT_WIDTH * image.height // image.width
    out = ASSETS / ('fx-' + asset['id'] + '.webp')
    image.resize((EFFECT_WIDTH, height), Image.LANCZOS).save(
        out, 'WEBP', quality=EFFECT_QUALITY, alpha_quality=85, method=6
    )
    return f'{out.name} {out.stat().st_size // 1024} KB'


def convert_item(asset: dict) -> str:
    _, cells, _ = frames(asset['sheet'])
    still = ASSETS / ('item-' + asset['id'] + '.webp')
    cells[0].resize((ITEM_SIZE, ITEM_SIZE), Image.LANCZOS).save(
        still, 'WEBP', quality=STILL_QUALITY, alpha_quality=90, method=6
    )
    return f'{still.name} {still.stat().st_size // 1024} KB'


def main() -> int:
    which = set(sys.argv[1:]) or {'effects', 'items'}
    manifest = json.loads((PACK / 'manifest.json').read_text(encoding='utf-8'))
    jobs = []
    if 'effects' in which:
        wanted = set(game_effects())
        jobs += [(convert_effect, a) for a in manifest['assets'] if a['group'] == 'effect' and a['id'] in wanted]
    if 'items' in which:
        wanted = set(game_items()) - KEEP
        jobs += [(convert_item, a) for a in manifest['assets'] if a['group'] != 'effect' and a['id'] in wanted]
    with ProcessPoolExecutor() as pool:
        results = [pool.submit(fn, asset) for fn, asset in jobs]
        for result in results:
            print(result.result())
    return 0


if __name__ == '__main__':
    sys.exit(main())
