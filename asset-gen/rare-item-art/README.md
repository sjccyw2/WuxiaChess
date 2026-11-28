# Pictures for the 珍品 and 秘寶

The items and manuals that are never on the shelf: they come only from 三盅通吃 and the 支線
(roadmap 0.68; the producer's decisions of 2026-11-28, Q-N170 to Q-N175). Painted on 2026-11-28
in the manner of the item pictures already in the game (寒潭短劍 and 九花玉露丸 as references).

| File | In the game |
| --- | --- |
| `full/snowLotus.webp` | `game/assets/item-snowLotus.webp`, 天山雪蓮 |
| `full/yuanBlade.webp` | `game/assets/item-yuanBlade.webp`, 鴛刀 |
| `full/yangBlade.webp` | `game/assets/item-yangBlade.webp`, 鴦刀 |
| `full/scarletToad.webp` | `game/assets/item-scarletToad.webp`, 莽牯朱蛤 |
| `full/ironDagger.webp` | `game/assets/item-ironDagger.webp`, 削鐵匕首 |
| `full/loadedDice.webp` | `game/assets/item-loadedDice.webp`, 灌鉛骰子 (0.69) |
| `full/ironToken.webp` | `game/assets/item-ironToken.webp`, 玄鐵令 (0.69) |
| `full/lot-pebble.webp` | `game/assets/lot-pebble.webp`, the pebble of 見好就收 (0.69) |
| `full/limeBag.webp` | `game/assets/item-limeBag.webp`, 石灰包 (0.70) |
| `full/thunderBomb.webp` | `game/assets/item-thunderBomb.webp`, 霹靂雷火彈 (0.70): made by `make/fire-pot.py` from 九花玉露丸's jar, the image model having refused it |
| `full/bearPill.webp` | `game/assets/item-bearPill.webp`, 九轉熊蛇丸 (0.70) |
| `full/treasureVest.webp` | `game/assets/item-treasureVest.webp`, 護身寶衣 (0.70) |
| `full/sutra.webp` | `game/assets/item-sutra.webp`, 四十二章經 (0.70) |
| `full/guide-secret.webp` | `game/assets/guide-secret.webp`, the cover of a 秘笈, on the parchment of `guide-cover.webp` |

- `make/paint.py` paints them (1024 × 1024, transparent) through `make/api.py`; the session proxy adds the key.
- `make/cut.py` writes the game's files: items at 256 × 256, the cover at 360 × 360.
