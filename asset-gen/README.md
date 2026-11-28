# Art library

The full-size source art painted for the game, and the prompts the story pictures were painted from.
Nothing in this folder is loaded by the game: a picture enters the game when it is copied (and
usually resized) into `game/assets/` and named in the game's data. `ROADMAP.md` says what is
planned for each pack and which decisions are waiting on the producer.

| Path | What it holds |
| --- | --- |
| `prompts.md` | Prompts for the story's pictures: file name, size, where it appears. |
| `story-characters/` | The youth and 求敗 (`qiubai`): a character card (`cards/`, 1024 × 1024) and a sprite sheet (`sprites/`, the roster pack's 8 × 5 format) each. 求敗's card is also his portrait in the game (`npc-qiubai.webp`). Both sheets are in the game since 2026-11-22, cut by `tools/roster-art.py --story youth qiubai`: the two stand on the last board, and the youth on every board after the ending. 求敗 holds a twig, not a sword. `make/` paints, and `full/` keeps, the two further pictures the youth needs as a piece: his full-length figure (`game/assets/figure-youth.webp`) and his sword, 利劍 (`game/assets/item-keenSword.webp`). |
| `prologue-video/` | The 45-second manga-style prologue film lettered like a Hong Kong comic, in an upright (9:16) and a wide (16:9) cut, the painted panels of each, and the scripts that paint and cut them (`make/`). |
| `finale-video/` | The 59-second manga-style ending film (放下, and the name the youth will take), made as the prologue film was and lettered like a Hong Kong comic, in an upright (9:16) and a wide (16:9) cut, the painted panels of each, and the scripts that paint and cut them (`make/`). |
| `title-art/` | The title calligraphy 劍影江湖: three painted takes in black ink (`full/ink-a.png` to `ink-c.png`), the script that paints them (`make/paint.py`) and the one that cuts the game's ivory, transparent title from take c (`make/cut.py` → `game/assets/title-jianying.webp`). |
| `story-art/` | Story pictures painted for the old story that the v1.0 story has no place for (`prompts.md` B4, B7). |
| `battle-objects/` | The board objects of the 守 and 破 boards: 七弦琴 (空山琴臺), 城頭戰鼓 (襄陽殘垣) and 星索樁 (無刻漏臺), each intact and broken, with the script that painted them and the one that cuts the game's files. All are in the game (`game/assets/object-*.webp`). |
| `hero-figures/` | The twenty heroes' full-length figures repainted in high definition on 2026-11-28 (`full/<id>.webp`, 1024 × 1536), each from the hero's portrait and earlier figure so face and costume are kept; `make/paint.py` paints them and `make/cut.py` writes `game/assets/figure-<id>.webp` at 560 × 880 (was 280 × 440). |
| `jianying-roster-art/` | Thirty characters: a portrait and a sprite sheet each. |
| `jianying-item-art/` | Eight skill effects and thirty-two item pictures, all animated. |
| `rare-item-art/` | The 珍品 and 秘寶 that are never on the shelf (2026-11-28, roadmap 0.68): five item pictures (天山雪蓮, 鴛刀, 鴦刀, 莽牯朱蛤, 削鐵匕首), two tokens (灌鉛骰子, 玄鐵令, 0.69), five more for 0.70 (石灰包, 霹靂雷火彈, 九轉熊蛇丸, 護身寶衣, 四十二章經), 見好就收's pebble and the cover of a 秘笈, painted in the manner of the item pictures in the game; `make/paint.py` paints, `make/cut.py` writes `game/assets/item-<id>.webp` and `guide-secret.webp`. |

Each pack has an `index.html` that previews its sheets, and a `manifest.json` / `manifest.csv`
with every file, its frame layout and its checksum. Open the preview through a local web server
from the repository root (see the main README), not as a file.

## `jianying-roster-art/`: characters

- `portraits/<id>.webp`, 510 × 510.
- `sprites/<id>.png`, 1152 × 880: 8 columns × 5 rows of 144 × 176 cells, foot at y 162. The rows
  are idle, walk, attack, hurt and special (絕技). The game's own sheets have the first four rows
  only, stored at half size; reading the fifth row is roadmap item 3.6.
- Ten of the twenty sheets in the game (the five villains on the first ten boards and their troops) are not as
  the pack came: on 2026-11-21 every strike and hurt row was repainted, and the special rows of
  萬震山, 完顏洪烈, 鮮于通 and 趙王府弓手; 萬門劍徒 was repainted whole at the height of the other troops
  (roadmap Q-N34). Both manifests carry the new checksums.
- `manifest.json` gives each character's name, book, school, technique and bio. The bios were
  written for an earlier version of the story and are not to be copied into the game as they
  stand (roadmap 3.2). The ten heroes' bios in the game were rewritten for world view v1.0; the
  manifest still holds the old ones.

Who may be used, by the producer's ruling of 2026-11-21:

| Group | Characters | Status |
| --- | --- | --- |
| Villains to join the existing boards now, each with a troop type | 鳳天南 `fengTiannan` + 五虎門棍徒 `fiveTiger` (青竹渡); 張召重 `zhaoZhong` + 清營刀盾兵 `qingShield` (紅楓驛); 完顏洪烈 `wanYan` + 趙王府弓手 `jinBow` (襄陽殘垣); 鮮于通 `xianYu` + 華山刀陣弟子 `huaBlade` (倒影天街); 萬震山 `wanZhen` + 萬門劍徒 `wanDisciple` (無刻漏臺) | In the game since 2026-11-21, on the boards named (`game/src/data/battles.js`), with placeholder text (roadmap 0.12). |
| Villains kept for new stages, each with a troop type | 東方不敗 `dongFang` + 黑木崖侍衛 `heiMuGuard` (黑木繡閣); 李秋水 `liQiu` + 西夏宮禁衛 `xiaGuard` (西夏夜苑); 洪安通 `hongAn` + 神龍教青龍門眾 `shenLong` (神龍竹堂); 裘千仞 `qiuRen` + 鐵掌幫拳手 `ironPalm` (鐵掌溪灘); 公孫止 `gongSun` + 絕情谷網手 `netHand` (絕情花徑) | In the game since 2026-11-22, each as the 局主 of a board of his own with his troop type (roadmap 3.4). Not used on the first ten boards. Their sheets are as the pack came. |
| New heroes | 蕭峰 `qiaoFeng`, 虛竹 `xuZhu`, 洪七公 `hongQi`, 黃藥師 `yaoShi`, 張三丰 `sanFeng`, 趙敏 `zhaoMin`, 程靈素 `lingSu`, 狄雲 `diYun`, 袁承志 `chengZhi`, 阿青 `aQing` | In the game since 2026-11-22 as playable heroes, under these ids (roadmap 3.3). The pack has no full-length painting of them, so the wardrobe's standing figure is the first idle frame enlarged, and none has a weapon picture of their own. |

## `jianying-item-art/`: effects and items

Every sheet is a transparent PNG of 4 columns × 2 rows, read left to right and top to bottom,
anchored at the centre of each cell. `manifest.json` lists the game id each one is meant for and
a suggested time for each frame.

- `effects/`, 1536 × 512 (cells of 384 × 256): 蛤蟆功, 降龍十八掌, 六脈神劍, 獨孤九劍, 彈指神通,
  打狗棒法, 黯然銷魂掌 and 金蛇劍法. The game ids in the manifest predate the skill redesign;
  match by the art's name. 金蛇劍法 plays for 袁承志's summit and the form below it.
- `weapons/`, `gear/`, `consumables/`, 1024 × 512 (cells of 256 × 256): one sheet for every item.
  All are in the game. 金蛇劍 `goldSerpentBlade` and 烏蠶衣 `silkwormCoat` came in with 袁承志 and
  狄雲 on 2026-11-22: the sword is on the shop's shelf when 袁承志 is in the company, and 狄雲
  arrives wearing the coat. The producer may later set some powerful weapons aside for quests
  rather than the shop (roadmap 0.14).
- In the game: eight effects are `game/assets/fx-<name>.webp` (which art plays which is `ARTS` in
  `game/src/fx/painted-effects.js`); each item is a still `item-<id>.webp`, the first frame
  of its sheet, cut by `tools/item-art.py`. Items are shown still, so the other frames are not used.
