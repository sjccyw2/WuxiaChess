# 三盅通吃 and 支線: new items, new arts, new mechanisms

Proposal, 2026-11-28, asked by the producer: "improve the slot machine and the 支線 function … more exciting items and skills … new mechanisms … to make the game more fun". The questions it raised, Q-N170 to Q-N175, were answered the same day: the producer took every recommendation (`ROADMAP.md`, Decisions). The first slice (§7) is built (roadmap 0.68); the second and third are 0.69 and 0.70. Where the build differs from this text, the roadmap entry says so.

"The slot machine" is read here as 韋小寶's 三盅通吃 (`rules/ferry-market.js`, `ui/bowl-views.js`), the game's only game of chance. If the producer meant something else, say so and this proposal will be redone for it.

## 1. What is there today, and why it is flat

**三盅通吃.** It opens for sure after the first board won, then on 40% of boards. Three cups are shown face up (one weapon or armour, one manual, one medicine, all from the shelf's own pools), covered and shuffled; the player lifts one and keeps it. Since 2026-11-27 the shuffle is deliberately unfollowable (the producer's ruling, 0.62).

- **No decision.** The contents are known and every cup is equally likely, so the "game" is a free one-in-three draw. Nothing the player does changes the outcome.
- **No stakes.** It costs nothing and risks nothing.
- **No prize worth hoping for.** Every possible prize is something the shelf sells for 9 to 52 兩. A win is worth about half a board's silver.

**支線.** One bet a board is drawn from that board's pool of four (57 entries, 12 kinds). It pays one of three things: 24 + 3 per stage 兩 (24 to 51), 1 武學點 to each fielded hero still standing, or one of the 8 trade manuals.

Measured with `node tools/sim-battles.mjs --runs 200 --seed 1` (境界 1; the simulated player plays for the 支線, `SIDE_POLICY` in `tools/lib/hero-policy.mjs`):

| Finding | Evidence |
| --- | --- |
| Most bets are near-certain | 不假丹藥 95–100% on all five boards that have it; 全員生還 100% on 青竹渡, 神龍竹堂 and 鐵掌溪灘; 不容續命 97–100% |
| Some are near-impossible | 合招制敵 on 蘆花汀 0 of 18; 一回合連下兩人 on 寒玉石室 2 of 23; 親手了斷 on 襄陽殘垣 5 of 40 |
| Both pay the same | the reward is set per entry, not by how hard it is |
| One kind crowds the pools | 親手了斷 is 14 of the 57 entries; 搶在限時之前, 合招制敵 and 以招破招 are one each |
| Overall rate | 87% of bets met on board 1, falling to 49–54% on boards 9–10 |

The two features never touch: nothing won at one is used at the other.

**What this establishes, and what is inferred.** The rates are a fixed simple player in the easiest 境界; a person who reads the board will meet more, and harder 境界 will meet fewer. The *spread* (0% to 100% for the same pay) is large enough that it will survive both. That the features feel flat is my inference from the rules above, not from a playtest.

## 2. The core idea: tie them together with 籌碼

One new currency, 籌碼 (韋小寶's chips), earned only from 支線 and spent only at 三盅通吃. That one link gives the bet a reason to be chased and gives the cups a reason to be planned for. Every other proposal below hangs off it, and each can be taken or left on its own.

## 3. 支線: new mechanisms

| # | Mechanism | Rule | Why it is more fun | Cost |
| --- | --- | --- | --- | --- |
| S1 | **賠率 (odds)** | Each pool entry carries odds set from its measured rate: met ≥ 80% → 一賠一; 40–80% → 一賠二; under 40% → 一賠三. The pay is today's reward × the odds, and the odds in 籌碼. Easy bets pay what they pay now; hard ones pay double or triple. Shown in 軍情 beside the bet. | A hard bet becomes a gamble worth taking; an easy one is still a small bonus. | Small: a number per entry, re-measured with sim-battles |
| S2 | **挑盤口 (choose your bet)** | 軍情 shows two entries from the pool with their odds; the player picks one before 應帖. The first drawn is preselected, so tapping on still works. | The player's first real decision about the 支線. | Small: draw two instead of one |
| S3 | **連中 (streak)** | Three bets met in a row and 韋小寶 gives a 彩頭盅 at the next shop: one cup, 珍品 or better, free. A missed bet resets the count; the count shows in 軍情. | Tension across the run, not just inside one board. | Small |
| S4 | **押注 (stake silver)** | Before 應帖, stake 0, 10, 20 or 30 兩. Met: the stake comes back × (odds + 1). Missed: it is lost. | Risk on even the easy bets. | Small, but adds a control to a page the producer is keeping plain (0.35) |
| S5 | **New pay kinds** | 籌碼 (S1), a 珍品 item (§5), a 秘笈 (§6), or, for a bet that names a hero, a 名號 for the rest of the run (e.g. 「一劍封喉」 攻擊 +2). | Prizes the shelf does not have. | Small to medium |

### New 支線 kinds

The pools lean on 親手了斷. Seven new kinds, each read from facts `s.tally` already records or nearly does:

| Kind | Name | Rule | Sort | Needs |
| --- | --- | --- | --- | --- |
| `spareLife` | 留活口 | Win with the named lieutenant still standing (斬將 and 守 boards only). | keep | nothing new |
| `summitFinish` | 絕技收官 | The master falls to a 成名絕技. | reach | the fall record gains the art's tier |
| `oneBlow` | 一擊斃命 | Fell an enemy at full 氣血 with one blow. | reach | the fall record gains the target's 氣血 before the blow |
| `counterFell` | 後發制人 | Fell an enemy with a 還擊. | reach | the fall record marks a counter |
| `turned` | 借刀殺人 | An enemy falls to a foe a hero has turned (受制). Drawn only with a hero who can turn foes in the line-up, as 合招制敵 is. | reach | the fall record marks the charmed striker |
| `fewer` | 以寡敵眾 | Field one hero fewer than the board's seats. Always 一賠三. | keep | 整備 must allow an empty seat |
| `chest` | 奪寶 | A 寶箱 stands on the board. A hero ends a move on it before any enemy does; it opens at once and holds a 珍品. | reach | a new board object and one tile per board |

## 4. 三盅通吃: new mechanisms

The producer's ruling of 2026-11-27 stands: watching the shuffle tells nothing. Every mechanism below adds a decision or a stake, never a way to follow the cups.

| # | Mechanism | Rule | Why it is more fun | Cost |
| --- | --- | --- | --- | --- |
| C1 | **三品 (tiers)** | Each cup is drawn from 常品 (the shelf's pools, as now), 珍品 (§5, never on the shelf) or 秘寶 (§5–6). The first lot is 70 / 25 / 5, with 珍品 rising two points a board. A revealed cup carries a seal in its tier's colour. | Something worth hoping for. | Small |
| C2 | **見好就收 (push your luck)** | Once a table, after lifting a cup that is not 秘寶, 韋小寶 asks 「敢不敢再賭？」. Put the prize back: the other two cups are dealt again, one holding the next tier up of the same kind and one an empty cup (a pebble). Fifty-fifty. | The slot machine's "one more pull". One tap, real loss possible. | Small |
| C3 | **再揭一盅 / 開盅 (spend 籌碼)** | After the first cup: lift another for 2 籌碼. On a board the table did not open: open it for 3 籌碼. Two buttons at most, to keep the page plain. | What the 支線 earned is spent here. | Small |
| C4 | **莊家運 (pity)** | Each table with no 秘寶 lifted adds a mark (shown as 韋小寶's tally sticks). At four, one cup at the next table is 秘寶. Resets when one is lifted. Per run. | Bad luck cannot last a whole run. | Small |
| C5 | **灌鉛骰子 (an item)** | A 珍品 token (§5): after the cups are covered, look under one. | Information from an item, not from watching, so the 2026-11-27 ruling holds. | Small, cup page only |

## 5. New items (珍品 and 秘寶)

None is on the shelf: they come only from the cups, 奪寶 and the 支線 (the shelf already supports this: `MARKET_STOCK` says "to keep an item for a quest … delete its line"). Each is a sidegrade with a twist, not a bigger number, so the boards are not made easier across the board. **A** = data only, using fields and forms that already exist; **B** = one small new rule; **C** = a new kind of thing.

| Item | Kind | Tier | Effect | Source | Class |
| --- | --- | --- | --- | --- | --- |
| 天山雪蓮 | medicine | 珍品 | 氣血 +40, 內力 +40, and clears every condition | 天龍八部 | A |
| 鴛刀 · 鴦刀 | weapons, a pair | 珍品 | 鴛刀 攻擊 +8 with 餘勁 (arc); 鴦刀 攻擊 +7 with 反震. Held by two heroes standing side by side: each 攻擊 +4, 防禦 +4 (「仁者無敵」). The cup gives one; the other turns up later. | 鴛鴦刀 | B: pair bonus |
| 莽牯朱蛤 | armour | 珍品 | 防禦 +3; poison never takes hold (百毒不侵) | 天龍八部 | B |
| 削鐵匕首 | weapon | 珍品 | 攻擊 +9; the basic attack passes half the target's 防禦, as 七傷拳 does | 鹿鼎記 (韋小寶's own) | B |
| 石灰包 | thrown | 珍品 | An enemy within 2: 定身 one round; a 局主 resists the next, as 彈指神通 | 鹿鼎記 (韋小寶's trick) | C: the first item aimed at an enemy |
| 霹靂雷火彈 | thrown | 珍品 | Within 3: 24 to the target, four tenths to every piece beside it, heroes included | 倚天屠龍記 (霹靂堂) | C |
| 灌鉛骰子 | token | 珍品 | At the cups: look under one covered cup (C5) | 鹿鼎記 | C, cup page only |
| 玄鐵令 | token | 珍品 | Once: at 軍情, swap the 支線 for another of the pool; or at the shop, take one shelf item free | 俠客行 | B |
| 護身寶衣 | armour | 秘寶 | 防禦 +6; once a board, a blow that would fell the wearer leaves 1 氣血 | 鹿鼎記 (韋小寶's own) | B: "endure", shared with 龜息功 |
| 九轉熊蛇丸 | medicine | 秘寶 | On a fallen hero beside the user: they rise with three tenths of their 氣血 | 天龍八部 | C: revival, which Q-N160 lists as a role the game lacks |
| 四十二章經 (one of eight) | relic | 秘寶 | Kept across runs in the profile. Each volume owned adds two points to the 珍品 chance; all eight open 鹿鼎寶藏: a 秘寶 cup at the start of every run, and a line from 韋小寶 | 鹿鼎記 | C: the cups' first cross-run goal |

Each item needs a picture (`asset-gen/prompts.md`), as the 32 on the shelf have.

## 6. New arts: eight 秘笈

The shelf has 8 trade manuals today. These eight are taught the same way (give the volume to a hero, spend 武學點), but come only as 秘寶 cups, from 一賠三 bets and from 奪寶. No name below is used by any art in the game.

| Art | Tier | Effect | Source | Class |
| --- | --- | --- | --- | --- |
| 化骨綿掌 | 2 | Adjacent; no counter; 內傷 three rounds | 鹿鼎記 (海大富) | A |
| 龍爪手 | 2 | Adjacent; 纏械 two rounds and pulls the target a tile | 倚天屠龍記 (空性) | A |
| 美人三招 | 2 | Self, no 內力: 閃身 from the next blow, then a step away | 鹿鼎記 (韋小寶's own) | B |
| 千蛛萬毒手 | 3 | Adjacent; poison 8 a round for three rounds; costs the user 6 氣血 | 倚天屠龍記 (殷離) | A |
| 獅子吼 | 3 | Every enemy within 2: 閉穴 one round. Every hero within 2 also loses 8 氣血, unless 固守 | 倚天屠龍記 (謝遜) | B: harms one's own side |
| 九陰白骨爪 | 3 | Adjacent; passes 護盾 and 固守; 破防 two rounds | 射鵰英雄傳 (梅超風) | B: the pierce 重劍 has, for a hero |
| 龜息功 | 3 | Self, once a board: until the next round a blow that would fell the user leaves 1 氣血, and the user is 定身 | 射鵰英雄傳 (九陰真經) | B: "endure" |
| 蛤蟆功 | 4 | Only if the user has not moved this turn: adjacent, power ×1.8, throws the target two tiles back; 調息 two rounds | 射鵰英雄傳 (歐陽鋒) | B: "stand still" |

`node tools/check-skills.mjs` measures each before it ships.

## 7. Recommended order

1. **First slice, all A and small B (one session):** 籌碼 with 賠率 (S1, C3); 三品 (C1) with 天山雪蓮, 鴛鴦刀, 莽牯朱蛤, 削鐵匕首, 玄鐵令; the three A 秘笈 (化骨綿掌, 龍爪手, 千蛛萬毒手) and 獅子吼; the new kind that needs nothing (留活口), taking two 親手了斷 entries out of the pools.
2. **Second:** 見好就收 (C2), 挑盤口 (S2), 連中 (S3), 莊家運 (C4), and the kinds that need a field on the fall record.
3. **Third, new mechanisms:** thrown items, "endure" (護身寶衣, 龜息功), revival (九轉熊蛇丸), 奪寶, 以寡敵眾, 四十二章經.

## 8. Risks and checks

- **Easier boards.** In 境界 1 boards 1–8 are already won 99–100% by the simulated player. Every slice re-runs `sim-battles --runs 200 --seed 1` and `--realm 3`, and is cut back if board 10 rises more than five points.
- **Odds measured too easy.** The rates are a simple player in 境界 1. S1's thresholds should be set from `--realm 3` runs and checked again after the first playtest.
- **Clutter.** The producer is keeping functional pages plain (0.35, the ink look). The cup page gains at most two buttons; 軍情 gains one choice and one count. S4 (stakes) is the one that most adds controls, and is left out of the first slice.
- **Gambling.** All stakes are in-game silver and 籌碼; nothing is bought with money.
- **Saves.** 籌碼, the streak, the pity count and the relics are new save fields; older saves load with them at zero.
