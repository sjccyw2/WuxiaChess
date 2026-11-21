# Art library

The full-size source art painted for the game, and the prompts for art still to be painted.
Nothing in this folder is loaded by the game: a picture enters the game when it is copied (and
usually resized) into `game/assets/` and named in the game's data. `ROADMAP.md` says what is
planned for each pack and which decisions are waiting on the producer.

| Path | What it holds |
| --- | --- |
| `prompts.md` | Prompts for pictures the story still needs: file name, size, where it appears. |
| `jianying-roster-art/` | Thirty characters: a portrait and a sprite sheet each. |
| `jianying-item-art/` | Eight skill effects and thirty-two item pictures, all animated. |

Each pack has an `index.html` that previews its sheets, and a `manifest.json` / `manifest.csv`
with every file, its frame layout and its checksum. Open the preview through a local web server
from the repository root (see the main README), not as a file.

## `jianying-roster-art/`: characters

- `portraits/<id>.webp`, 510 × 510.
- `sprites/<id>.png`, 1152 × 880: 8 columns × 5 rows of 144 × 176 cells, foot at y 162. The rows
  are idle, walk, attack, hurt and special (絕技). The game's own sheets have the first four rows
  only, stored at half size; reading the fifth row is roadmap item 3.6.
- `manifest.json` gives each character's name, book, school, technique and bio. The bios were
  written for an earlier version of the story and are not to be copied into the game as they
  stand (roadmap 3.2).

Who may be used, by the producer's ruling of 2026-11-21:

| Group | Characters | Status |
| --- | --- | --- |
| Villains to join the existing boards now, each with a troop type | 鳳天南 `fengTiannan` + 五虎門棍徒 `fiveTiger` (青竹渡); 張召重 `zhaoZhong` + 清營刀盾兵 `qingShield` (紅楓驛); 完顏洪烈 `wanYan` + 趙王府弓手 `jinBow` (襄陽殘垣); 鮮于通 `xianYu` + 華山刀陣弟子 `huaBlade` (倒影天街); 萬震山 `wanZhen` + 萬門劍徒 `wanDisciple` (無刻漏臺) | Art is in `game/assets/` (roadmap 0.12). Their places on the boards and placeholder text arrive with the battle variety work (0.11). |
| Villains kept for new stages, each with a troop type | 東方不敗 `dongFang` + 黑木崖侍衛 `heiMuGuard`; 李秋水 `liQiu` + 西夏宮禁衛 `xiaGuard`; 洪安通 `hongAn` + 神龍教青龍門眾 `shenLong`; 裘千仞 `qiuRen` + 鐵掌幫拳手 `ironPalm`; 公孫止 `gongSun` + 絕情谷網手 `netHand` | Do not use on the existing boards. |
| New heroes | 蕭峰 `qiaoFeng`, 虛竹 `xuZhu`, 洪七公 `hongQi`, 黃藥師 `yaoShi`, 張三丰 `sanFeng`, 趙敏 `zhaoMin`, 程靈素 `lingSu`, 狄雲 `diYun`, 袁承志 `chengZhi`, 阿青 `aQing` | Do not use. The producer will add them (roadmap 3.3). |

## `jianying-item-art/`: effects and items

Every sheet is a transparent PNG of 4 columns × 2 rows, read left to right and top to bottom,
anchored at the centre of each cell. `manifest.json` lists the game id each one is meant for and
a suggested time for each frame.

- `effects/`, 1536 × 512 (cells of 384 × 256): 蛤蟆功, 降龍十八掌, 六脈神劍, 獨孤九劍, 彈指神通,
  打狗棒法, 黯然銷魂掌 and 金蛇劍法. The game ids in the manifest predate the skill redesign;
  match by the art's name. 金蛇劍法 belongs to 袁承志, a new hero, and waits for him.
- `weapons/`, `gear/`, `consumables/`, 1024 × 512 (cells of 256 × 256): one sheet for every item.
  All are in the game except 金蛇劍 `goldSerpentBlade` and 烏蠶衣 `silkwormCoat`, which wait for
  袁承志 and 狄雲. The producer may later set some powerful weapons aside for quests rather than
  the shop (roadmap 0.14).
- In the game: seven effects are `game/assets/fx-<name>.webp` (which art plays which is `ARTS` in
  `game/src/fx/painted-effects.js`); each item is a still `item-<id>.webp` and a loop
  `item-<id>-motion.webp`, both cut from these sheets by `tools/item-art.py`.
