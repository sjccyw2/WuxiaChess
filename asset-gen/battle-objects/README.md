# Board objects

The things that stand on a board and are not people (roadmap 0.11, stage two; decision Q-N22):
what the heroes keep on a 守 board and what they break on a 破 board. Each has an intact picture
and a broken one. The game's rules for them are in `game/src/data/board-objects.js` (numbers,
bios) and `game/src/data/battles.js` (where each stands); their story lines are the board's own,
in `game/src/data/encounter-script.js` (`objects`).

| Id | Name | Board | Kind | Why this thing |
| --- | --- | --- | --- | --- |
| `guqin` (art `qin`) | 七弦琴 | 空山琴臺 | 守 | The qin on the terrace that "nobody plays" in the board's opening line. 〈笑傲江湖〉 was a qin and a xiao together, and 嵩山 hated that music; 左冷禪's cold runs "along broken strings". The board's victory line already ends on its string sounding in the wind. |
| `warDrum` (art `drum`) | 城頭戰鼓 | 襄陽殘垣 | 守 | The city's war drum: the opening line says 更鼓不響, and the victory line says the drumstick finally falls. It stands where the one passage south opens. |
| `starPost` | 星索樁 | 無刻漏臺 | 破 | One of the two bronze posts the star ropes are tied to, beside a rope-keeper each. The board's story already says 先斷索 and ends on both ropes breaking. While a post stands it takes 35% off 慕容博's blows. |
| `cage` | 鐵籠 | 萬安寺 | 破 | One of two iron cages by the temple walls. Nobody is inside: the board's 戰意 is locked in them, and breaking both wins (added 2026-11-28). |
| `holyFire` | 聖火 | 光明頂 | 守 | The 明教's sacred fire in its bronze brazier on the altar before the hall. Its going out loses the board (added 2026-11-28). |

## Files

- `full/<art>.png`, `full/<art>-broken.png`: the paintings, 1024 × 1024, transparent.
- `paint.py`: paints them with the OpenAI Images API (the session proxy supplies the key; model
  `gpt-image-2.6-flare`, as for the prologue film). `python3 asset-gen/battle-objects/paint.py
  intact [id …]` paints the intact pictures, with two of the item pack's pictures given for the
  style; `paint.py broken [id …]` paints each broken one from its intact picture, so they match.
  The prompts are in the script.
- `cut.py`: makes the game's files, `game/assets/object-<art>.webp` and
  `object-<art>-broken.webp` (288 px on the longer side), each pair cropped to the same box so the
  broken picture stands where the intact one stood. The bottom of the box is the object's base.
- `api.py`: the call to the Images API (a copy of `prologue-video/make/api.py`).

The board draws an object standing on its tile at a share of a fighter's height (`size` in
`board-objects.js`), never wider than a tile and a half, with a gauge and a 守 or 破 mark, and
switches to the broken picture once it breaks. The 軍情 plan shows the same pictures.
