# Characters of the four boards added on 2026-11-28

Fifteen characters for 石樑溫家, 萬安寺, 光明頂 and 俠客島 (maps 16 to 19), laid out as the roster
pack is (`../jianying-roster-art/`): a portrait and a sprite sheet each, with a `manifest.json`.
All are in the game.

| Board | Villains | Troop type |
| --- | --- | --- |
| 石樑溫家 | 溫方達 `wenDa`, 溫方義 `wenYi`, 溫方山 `wenShan`, 溫方施 `wenShi`, 溫方悟 `wenWu` | 石樑派弟子 `shiLiang` |
| 萬安寺 | 鹿杖客 `luZhang`, 鶴筆翁 `heBi` | 西域番僧 `fanSeng` |
| 光明頂 | 滅絕師太 `mieJue`, 成昆 `chengKun` | 峨嵋弟子 `emei` |
| 俠客島 | 張三 `zhangSan`, 李四 `liSi` | 俠客島弟子 `islander` |

- `portraits/<id>.webp`, 510 × 510, as the pack's.
- `sprites/<id>.png`, 1152 × 880: 8 columns × 5 rows of 144 × 176 cells, foot at y 162; the rows
  are idle, walk, attack, hurt and special (絕技), as the pack's.
- `full/`: the paintings as they came, `<id>-portrait.png` (1024 square) and `<id>-sheet.png`
  (1408 × 1072, transparent).

## How they were made

- `make/cast.py` describes each character: how he looks, what he holds, his attack and special.
- `make/paint.py` paints each portrait with the image model (`make/api.py`; the session proxy adds
  the key), with a like character's portrait from the roster pack as the reference for style; then
  each sheet, with that character's pack sheet as the reference for layout and scale and the new
  portrait for the face and costume. The five 溫 brothers wear the five colours of the 五行陣.
- `make/fit.py` fits a painted sheet to the pack's layout: it finds the rows and the figures from
  the transparency (each figure's connected parts, so a blade reaching into the next column stays
  with its figure), scales the sheet once so the idle row stands as tall as the pack's figures of
  its kind, and sets every frame on y 162, its body on the cell's centre line. It also writes the
  510 × 510 portraits and the manifest.
- `python3 tools/roster-art.py --pack board-villains <id> …` then writes the game's files.

The sheets were looked at frame by frame on contact sheets; none was repainted.
