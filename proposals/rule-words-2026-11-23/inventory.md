# Rule words: the inventory, 2026-11-23

- **Date:** 2026-11-23, on the game as it stood at commit `a072d2b`.
- **What this is:** the evidence for `README.md` beside it, which proposes what to merge, rename, fold or remove. This page proposes nothing and changed nothing.
- **The play figures are a simulated player's.** Every figure for how often an art is equipped or used, or how often a condition holds, comes from `tools/sim-battles.mjs` or a copy of it. That player reads the forecast perfectly and chooses which arts to equip by their strength with the condition unmet. No figure here is from a person playing.
- **The scripts were not kept.** The counts and measurements were made with throwaway scripts outside the repository; each section says what was run, so it can be done again.

Each section says whether its content is **measured** (a script or tool was run), **read** (from code or data) or **inferred**.

## The five facts that matter most

1. **No starting art carries a conditional-power word, and the playtest's lists of unexplained words contain none of them.** Cutting the family would not reduce what a newcomer faces in the first battle.
2. **The game has 123 named rule words** (106 in `rule-terms.js` plus 17 more 戰鬥效果), and the conditional-power family is 8 of them. The in-game guide explains 20 of the 106; none of the 8 is among them.
3. **Conditional power sits on 23 of the 127 non-basic hero arts, and on 8 of 20 summits.** In the simulator these arts make about 15% of all art uses.
4. **Stripping the bonuses in memory moved no board's simulated win rate by more than 4 points over 200 runs**, which is within noise. Only 楊過 (damage per board −13%) and 阿青 (−8%) changed visibly.
5. **The wiki's six-aspect comparison barely depends on it.** The closest pair of heroes stays 12 points apart with the bonuses removed or flattened.

## 1. Everything a player is asked to learn

Measured by scripts that apply the wiki's own carrier tests (`wiki/src/catalog/terms.js`) to the game data. Denominators: 147 arts of the twenty heroes (20 starting, 20 basic-attack upgrades, 107 tree arts), 8 shop manuals, 34 items, 70 enemy entries. 無名's ten arts are noted separately.

| Family | Words | Source |
| --- | --- | --- |
| Basics of a strike (出招的基本) | 14 | `rule-terms.js` |
| Tempo (出手節奏) | 6 | same |
| Prices (絕技的代價) | 6 | same |
| Conditional power (看準時機) | 8 | same, lines 100–128 |
| Guards and reactions (護人與布陣) | 10 | same |
| Conditions (附加狀態) | 13 | same |
| Gear (器物) | 3 | same |
| Leader boons (領隊陣法) | 3 terms | same |
| Enemy traits (敵方行事) | 31 | same |
| Battle and run (戰局) | 12, of which 5 are board kinds | same |
| **Subtotal** | **106** | |
| 戰鬥效果 not already counted | 17 | `form-rules.js:2` has 21; 連環, 回身, 吸勁, 解厄 are counted above |
| **Named rule words** | **123** | |

Outside those 123, a player also meets:

- 21 named leader boons (`battle-mastery.js:4–122`);
- 12 kinds of secondary objective (`journey.js:1056`);
- 8 terrain kinds under 101 local names;
- 3 talents (淬鋒, 固本, 凝氣), 5 境界, 6 trial kinds for summits, 3 growth paces, 6 weapon classes, 6 named combinations;
- 28 condition names, shown over pieces as 22 one-character badges that often differ from the name: 絆足 is 縛, 破綻 is 隙, 破防 is 破, 借勁 is 返, 輕身 is 疾, 受制 is 倒 (`game/src/actors/tokens.js:221`).

Two long tails:

- 22 of the 55 art-carried rule terms sit on only one or two hero arts.
- 24 of the 31 enemy words belong to exactly one enemy entry.

### Per word

Columns: hero arts (heroes) / manuals / items. A dash means none.

**Basics**

| Word | Meaning | Carriers |
| --- | --- | --- |
| 還擊 | A struck survivor in reach hits back at 55% of a basic attack | universal |
| 免受還擊 | This art draws no counter | 25 (15) / 1 / – |
| 穿透 | Ignores part of the target's defence | 23 (12) / 1 / – |
| 濺射 | The target's four neighbours take a share | 15 (11) / 1 / – |
| 廣及 | The splash reaches two or three tiles | 6 (6) / – / – |
| 連擊 | One art lands as several hits | 4 (3) / – / – |
| 擊退 | Pushes a survivor one tile | 7 (5) / – / – |
| 身法 | Jump to an empty tile in range; ends the action | 2 (2) / 1 / – |
| 療傷 | Heals; halved on a piece with 內傷 | 10 (7) / 2 / – |
| 範圍 | The effect reaches allies around the target | 9 (7) / – / – |
| 回氣 | Regain 內力 on a hit | 1 / – / – |
| 吸元 | Heal self by a capped share of damage dealt | 2 (2) / – / – |
| 自耗氣血 | Costs the caster's own 氣血 | 7 (4) / – / – |
| 待命 | A hero who did not strike gets 防禦 +4 until next turn | universal |

**Tempo**

| Word | Meaning | Carriers |
| --- | --- | --- |
| 連環 | Felling the target grants another action, once a round | 3 (3) / – / – |
| 回身 | After striking, may walk the steps left | 7 (4) / – / – |
| 號令 | A companion who has acted moves and acts again | 1 / – / – |
| 留力 | Usable only if the hero did not attack last round | 1 (郭靖's summit) / – / – |
| 壓箱 | Once per board | 3 (3) / 1 / – |
| 調息 | Some rounds before it can be used again | 8 (6) / 3 / – |

**Prices**

| Word | Meaning | Carriers |
| --- | --- | --- |
| 露空 | Own 防禦 down until next turn | 3 summits / – / – (and 無名's summit) |
| 無守 | Cannot counter until next turn | 2 summits / – / – |
| 立樁 | Cannot move next turn | 3 summits / 1 / – |
| 曲終 | Cannot use arts next turn | 2 summits / – / – |
| 反噬 | Each use adds a layer of 亂氣; the third costs 20% of greatest 氣血 | 1 / 1 / – |
| 轉護 | Needs the caster's own shield, which passes to the recipients | 1 (張無忌's summit) / – / – |

**Conditional power**

| Word | Meaning | Carriers |
| --- | --- | --- |
| 破招 | +0.30 when the target is the kind this form answers | 3 (令狐冲), and 8 of 無名's |
| 孤行 | Bonus when no companion is adjacent | 5 (2) |
| 合璧 | Bonus when a companion is adjacent; more for one named partner | 6 (5) |
| 左右互搏 | Once learned, 合璧 arts count the hero as her own companion | 2 (2) |
| 黯然 | Bonus grows as own 氣血 falls | 1 |
| 還報 | Bonus if hurt by an enemy in the last enemy phase | 6 (4) |
| 斬殘 | Bonus when the target is at half 氣血 or less | 2 (1) |
| 傾力 | Spends all 內力; more spent, more power, capped | 1 |

**Guards and reactions**

| Word | Meaning | Carriers |
| --- | --- | --- |
| 代受 | Until next turn, takes direct blows aimed at adjacent companions | 3 (3) |
| 挑釁 | Until next turn, enemies within two tiles who can reach him must attack him | 1 |
| 布陣 | Five-tile formation: enemies entering stop and lose 2 move; heroes in it get 防禦 +4 | 3 (2) |
| 卸勁 | Until next turn damage taken is cut 20–30%; counters at full | 4 (2) |
| 閃身 | The next direct attack misses | 3 (3) |
| 挪移 | The next blow is halved and half returned, capped | 2 (張無忌) |
| 後發 | Counters at 80% instead of 55% | 2 (2) |
| 護勁 | Absorbs a set amount of damage; the stronger shield wins | 8 (6) |
| 固守 | 防禦 +4 or +5 for two turns | 3 (3) |
| 金剛 | For one enemy phase enemy blows do nothing and lay nothing | 1 / 1 manual |

**Conditions**

| Word | Meaning | Carriers |
| --- | --- | --- |
| 吸勁 | +8 內力 and the target's signature is put back a round | 1 (段譽's starting art) |
| 內傷 | Healing halved; loses 氣血 after each attack it makes | 2 (2) / 1 |
| 失神 | Loses its next action, still counters; a master resists the next round | 3 (3) / 1 |
| 纏械 | 攻擊 down and can strike adjacent tiles only | 5 (4) |
| 定身 | No move, strike, signature or counter; a master one round | 2 (2) / 1 |
| 閉穴 | No strike, signature or counter, still moves; a master one round | 5 (5) |
| 受制 | An ordinary enemy fights its own side; masters and lieutenants lose an action instead | 1 (虛竹's summit) |
| 中毒 | Loses 氣血 each round | 4 (3) / 1 |
| 攻勢受挫 | 攻擊 down | 8 (7) |
| 破防 | 防禦 down | 2 (2) |
| 振奮 | 攻擊 up | 4 (4) |
| 輕身 | Move up | 3 (3) |
| 解厄 | Lifts ten ailments before healing | 12 (8) / 1 / 1 item |

**Gear and leader boons**

| Word | Meaning | Carriers |
| --- | --- | --- |
| 反刺 | An adjacent enemy who hits the wearer takes 7 | 1 item |
| 服藥 | Shared medicine; costs no move or action | 5 items |
| 兵器效果 | A weapon adds a 戰鬥效果 to basic attacks or support arts | 19 items |
| 領隊陣法 | The leader's boon reaches himself and allies within two tiles | 21 boons |
| 越女試劍 | The first counter-drawing strike each round draws none | 阿青's boon |
| 雪谷回生 | Once a board, the first hero who would fall keeps 1 氣血 | 狄雲's boon |

**戰鬥效果 (the 17 not counted above)**

| Word | Meaning | Hero arts / weapons |
| --- | --- | --- |
| 留隙 | A hit leaves 破綻 for two rounds | 11 (10) / 4 |
| 收隙 | Against 破綻: first hit +9, no counter, and the mark is spent | 11 (6) / 1 |
| 絆足 | Target's move −2 this round and next | 10 (9) / 2, and 1 manual |
| 封穴 | This round the target cannot counter or use its signature | 4 (4) / – |
| 渡氣 | Each companion reached regains 6 內力 | 2 / 2, and 1 manual |
| 餘氣護身 | Excess healing becomes a one-round shield, up to 12 | 3 / 1 |
| 借勁還手 | The recipient's first enemy blow this round is returned, up to 9 | 1 / 2 |
| 牽引 | Draws the survivor one tile nearer | 6 / 2 |
| 穿行 | Along a row or column, 45% carries to the first foe within two tiles behind | 6 (4) / 1 |
| 走勁 | 32% jumps to the nearest other foe within two tiles | 1 / 3 |
| 催毒 | Detonates remaining poison as up to +16 power | 4 / 1 |
| 夾擊 | +7 and the partner +4 內力 when a companion stands directly behind the foe | – / 2 |
| 回生 | Heals self a quarter of damage dealt, up to 9 | 3 (2) / – |
| 落步成陣 | On landing, self and neighbours get 8 shield this round | 1 manual only |
| 定勢 | +5 if the hero has not moved this round | 6 / 2, and 1 manual |
| 撞關 | +7 when a push or pull is blocked | 9 (6) / – |
| 以毒解毒 | Hitting a poisoned foe cures the striker's own poison | – / 2 |

**Enemy traits**

| Word | Meaning | Entries | Earliest stage |
| --- | --- | --- | --- |
| 蓄勢 | Masters and lieutenants charge a signature over some rounds | 31 | 1 |
| 坐鎮 | Holds a post; some leave it when approached or struck | 16 | 1 |
| 近身失準 | 攻擊 −6 or −8 against heroes close by | 2 | 1 (wave, round 3) |
| 偏好 | A target preference | 12 | 2–3 |
| 護駕 | Returns to the master and takes direct blows for him | 2 | 2–3 |
| 化功 | A hero who hits him from adjacent loses 內力 | 1 | 2–3 |
| 續命 | His signature heals a hurt companion | 1 | 2–3 |
| 盾牆 | −40% damage while on its post | 1 | 2–3 |
| 擒拿 | Signature drags the target beside him | 1 | 2–3 |
| 步裡藏毒 | Basic attack poisons after it has walked | 1 | 2–3 |
| 變招 | Changes behaviour at half 氣血 | 5 | 4–5 |
| 遁走 | Retreats to herbs to heal | 1 | 4–5 |
| 盟令 | While alive, other enemies' 攻擊 is up | 1 | 4–5 |
| 陰陽倒亂 | Odd rounds 攻擊 +7; even rounds reach +1 | 1 | 4–5 |
| 墜網 | Basic attack lays 絆足 | 1 | 4–5 |
| 蓄勢反擊 | Counters at full while charged | 1 | 6–7 |
| 毒手 | Basic attack poisons | 2 | 6–7 |
| 水上飄 | Every tile costs one step | 1 | 6–7 |
| 沉樁 | −50% damage at half 氣血 or less | 1 | 6–7 |
| 轉折 | Blows ignore terrain defence and 代受 | 1 | 8 |
| 夾衛 | 攻擊 +8 when another enemy is beside its target | 1 | 8 |
| 游擊 | Steps away after striking | 1 | 9 |
| 刀陣 | The healthier of an adjacent pair takes the blow | 1 | 9 |
| 分刺 | A second needle at 80% on another hero | 1 | 9 |
| 獨行 | 攻擊 +8 when no other enemy is adjacent | 1 | 9 |
| 借力 | While charged, the first direct blow misses and half returns | 1 | 10 |
| 護陣 | Each standing post cuts damage to the master | 1 | 10 |
| 斬殘（敵） | 攻擊 +6 against heroes at half or less | 1 | 10 |
| 不敗, 無招, 退守 | 求敗: never below 1 氣血; no 破招 works; falls back when low | 1 each | last board |

The +6, +7 and +8 above also grow by half the run's stage (`game.js:2213`, `2225`).

**Battle and run:** 斬將 (10 boards), 殲滅 (2), 守 (2), 破 (1), 問劍 (the last board), 敗退, 援軍 (11 of 15 boards and the last), 軍情, 起陣, 支線, 入局, 敵方範圍.

## 2. When each word is first met

Measured by scripts over all 1,140 possible companies of three.

**The first board (青竹渡), whoever the heroes are** (read from `battles.js:36–58` and a built board):

- Enemy words: 蓄勢 and 坐鎮 (余滄海, 木高峰), and 近身失準 from round 3 (五虎門棍徒). That is 3 of 31.
- States their signatures lay: 攻勢受挫, 中毒, 絆足.
- 7 of the 8 terrain kinds.
- One reinforcement wave, in round 3.
- One secondary drawn from four kinds: 點亮引路燈, 親手了斷, 全員生還, 拒敵於外.
- The universal words: 還擊, 待命, 斬將, 敗退, 援軍, 軍情, 起陣, 支線, 入局, 敵方範圍, 領隊陣法 and the leader's own boon.

**Words on the heroes' arts and starting weapons** (71 distinct words across the twenty heroes):

| What the player has seen | Distinct words, three-hero company: median (range) | Across all twenty |
| --- | --- | --- |
| Starting arts and starting weapons | 5 (1–11) | 23 |
| Plus tier-1 nodes | 12 (6–19) | 39 |
| Plus tier 2 | 21 (10–28) | 52 |
| The three whole trees | 31 (20–39) | 71 |

A hero starts with 3 武學點 (`game.js:1392`, `journey.js:224`): enough for tier-1 nodes, or one tier-1 and one tier-2. The tree page builds every node with its text (`studyState`, `journey.js:1909`), so the "whole trees" row is what the first visit to 武學 can show. That is read from code; it was not looked at in a browser.

**Where each art word first appears, among the twenty heroes:**

| First at | Words |
| --- | --- |
| Starting art or starting weapon (23) | 收隙, 留隙, 療傷, 解厄, 渡氣, 免受還擊, 卸勁, 絆足, 攻勢受挫, 夾擊, 借勁還手, 走勁, 以毒解毒, 吸勁, 閉穴, 封穴, 牽引, 定勢, 餘氣護身, 擊退, 撞關, 穿透, 回身 |
| Tier 1 (16) | 穿行, 催毒, 中毒, 範圍, 護勁, 挑釁, 固守, **還報**, **合璧**, 調息, 身法, 閃身, 破防, 布陣, 輕身, 後發 |
| Tier 2 (13) | **破招**, 濺射, 吸元, 反噬, 連環, 振奮, 回氣, 自耗氣血, 代受, 纏械, 失神, 挪移, **斬殘** |
| Tier 3 (8) | 號令, 壓箱, 回生, 連擊, **左右互搏**, 廣及, **孤行**, 定身 |
| Summit only (11) | 露空, 無守, 曲終, 立樁, 留力, **傾力**, **黯然**, 轉護, 內傷, 受制, 金剛 |

The conditional-power family (bold):

- None is on a starting art.
- Two can be bought with the first points: 合璧 on 楊過's 全真劍法 and 還報 on 洪七公's 神龍擺尾.
- Situational bonuses under other names are there from the first turn: 定勢 (楊過's and 虛竹's starting arts), 收隙 (令狐冲's), 撞關 (蕭峰's), 夾擊 (郭靖's and 胡斐's starting weapons).

**The playtest** (read): the two lists of unexplained words (`proposals/playtest-2026-11-22/reports/L2.md:95–125`, `reports/P1.md:167`) contain no conditional-power word. They do contain 定勢, 走勁, 留隙, 餘氣護身, 破綻, 絆足, 卸勁, 蓄勢, 盟令, the badges, 「攻擊倍率 × 0.8」 and the forecast's row label 「招式連攜」. The tactics veteran praised 「撞關 +7」 in the forecast (`reports/P2.md:35`). The review's own first line says the nine players were simulated.

## 3. The conditional-power family in detail

Read from code, with numbers from the data. The rule is `strikeFactor`, `game/src/rules/game.js:2140–2181`: each bonus that holds is added to the art's multiplier on 攻擊.

| Word | Exact rule | Carriers (tier, base multiplier, bonus) |
| --- | --- | --- |
| 破招 | +0.30 if the target matches (`answers`, `game.js:2129`): reach 1; reach 2 or more; master or lieutenant; or a weapon class | 令狐冲: 破劍式 (2, 1.30), 破箭式 (2, 1.10), 破氣式 (3, 1.60). 無名: 8 of his 9 forms |
| 孤行 | Bonus if no living companion is adjacent | 楊過: 擊流 (3, 1.55, +0.25), 杞人憂天 (3, 1.60, +0.20), 黯然銷魂掌 (summit, 1.90, +0.25). 阿青: 竹枝連環 (3, 1.45, +0.30), 越女劍 (summit, 2.00, +0.30) |
| 合璧 | Any adjacent companion gives the lesser bonus, the named partner the greater (`PARTNERS`, `game.js:2110`) | 楊過 全真劍法 (1, +0.15, +0.40 with 小龍女). 小龍女 玉女心經 (2, +0.20/+0.40), 玉女素心劍法 (summit, +0.20/+0.45). 虛竹 天山六陽掌 (2, +0.15/+0.40 with 蕭峰). 趙敏 倚天劍 (2, +0.20/+0.40 with 張無忌). 程靈素 金針刺穴 (2, +0.20/+0.40 with 胡斐) |
| 左右互搏 | Once learned, the hero's 合璧 arts get the lesser bonus with no one adjacent (`game.js:2166`) | 小龍女's and 郭靖's 左右互搏術 (3) |
| 黯然 | Bonus = 0.6 × min(1, (1 − 氣血/greatest 氣血) / 0.75), on 氣血 after the art's own cost; the full +0.60 at a quarter or less | 楊過 黯然銷魂掌 only |
| 還報 | Bonus if an enemy's own action took 氣血 from the hero in the last enemy phase. Counters taken on his own turn, poison, and blows a shield caught do not count (`game.js:3850`) | 向問天 返勁 (2, +0.4), 涼亭鐵鏈 (summit, +0.4). 蕭峰 龍戰於野 (3, +0.3), 降龍廿八掌 (summit, +0.3). 洪七公 神龍擺尾 (1, +0.3). 狄雲 神照經 (summit, +0.5) |
| 斬殘 | Bonus if the target is at half 氣血 or less | 胡斐 纏身摘心刀 (2, +0.5), 懸崖一刀 (summit, +0.4) |
| 傾力 | Multiplier = min(1.55, 0.8 + 0.015 × 內力 held); spends all of it, at least 20 | 段譽 六脈齊發 (summit) |

In damage, `check-skills --report` measures the bonuses at +3 to +32 a blow. For example 黯然銷魂掌 goes from 73 to 105 alone at a quarter 氣血, and 天山六陽掌 from 24 to 27.

**Leader boons, 戰鬥效果 and enemy traits whose strength depends on the situation:**

- 雪野追鋒 (胡斐): +8 damage against a foe at half or less (`game.js:2188`).
- 打狗陣法 (洪七公): +8 against a foe under 絆足, 封穴, 纏械, 失神, 定身 or 閉穴 (`game.js:2194`).
- 聚賢豪氣 (蕭峰): 攻擊 +3 per adjacent foe, up to +6 (`game.js:1774`).
- 越女試劍 and 雪谷回生 are once a round and once a board. Every boon also depends on standing within two tiles of the leader.
- 戰鬥效果: 收隙 +9, 定勢 +5, 撞關 +7, 夾擊 +7, 催毒 up to +16 (`form-rules.js:78–135`).
- 失神 on 黃蓉's 絆字訣 lands only on a target under 纏械 or standing in a formation (`game.js:1663`).
- Enemy traits: 斬殘（敵）, 獨行, 夾衛, 近身失準, 陰陽倒亂, 盟令 (`traitEdge`, `game.js:2199–2208`).

**Does a hero's best-known art rest on it?**

| Hero | Arts carrying it | Summit carries it | ROADMAP 0.19 niche names it |
| --- | --- | --- | --- |
| 楊過 | 4 of 6 non-basic tree arts | yes: 孤行 and 黯然 | yes: "hits hardest alone and hurt" |
| 阿青 | 2 | yes: 孤行 | yes: "threads a line alone" |
| 胡斐 | 2, and his boon | yes: 斬殘 | yes: "chases down the wounded" |
| 狄雲 | 1 | yes: 還報 | yes: "striking back when hurt" |
| 令狐冲 | 3 | no | yes: "answers each kind of enemy" |
| 無名 | 8 of 9 | yes | his nine forms are defined by what each answers |
| 小龍女 | 3, with 左右互搏 | yes: 合璧 | no; but she and 楊過 are the only two-way pair |
| 蕭峰 | 2, and his boon | yes: 還報 | no |
| 向問天 | 2 | yes: 還報 | no |
| 段譽 | 1 | yes: 傾力 | no |
| 洪七公, 虛竹, 趙敏, 程靈素 | 1 each, tier 1 or 2 | no | no |
| 郭靖 | 左右互搏 only | no | no |
| 任盈盈, 黃蓉, 張無忌, 黃藥師, 張三丰, 袁承志 | none | | |

Three oddities in the data:

- 郭靖 has no 合璧 art, so the 左右互搏 line on his 左右互搏術 does nothing for him.
- 小龍女's summit requires 左右互搏術, so the lesser 合璧 bonus on it is always on.
- 楊過's tier-1 art wants a companion adjacent, and his tier-3 and summit arts want none.

**How the game shows it before a blow:**

- **On the art's card:** `bonusLines` (`rules/move-facts.js:21–42`) prints the word with its rule and number, for example 「孤行 · 四鄰沒有同伴時倍率 ＋0.25」. The art's description says the same in prose without the number. So this family is explained where it appears; a 戰鬥效果 shows only its name there, with its rule inside a fold.
- **In the arts list:** the figure 未扣防威力 is worked out where the hero stands with no target (`move-facts.js:112`). It therefore already includes 孤行, 合璧, 黯然, 還報 and 傾力 as they stand, and never 破招 or 斬殘.
- **In 交鋒預覽:** the damage includes the bonus, and a row labelled 「招式連攜」 carries the note (`game.js:2466`, `ui/panels.js:1306–1311`), for example 「合璧 · 小龍女在旁 ＋0.40」 or 「黯然 ＋0.32（氣血 80／184）」.
- **When the condition is not met:** only 孤行 says so (「孤行未成 · 郭靖在旁」), and 破招 against 求敗 (「無招 · 破招不成」). 合璧, 還報, 斬殘 and an ordinary unmet 破招 print nothing.
- **On the hero's plate:** a 還報 pip while it is ready (`panels.js:182–195`).
- **On the board:** no marking was found of the tiles where 孤行 or 合璧 would hold. The forecast is worked out from where the hero stands, so the player walks, looks, and takes the step back if it is wrong. Inferred from the code, not seen in a browser.
- **Boons:** 打狗陣法, 越女試劍 and 雪谷回生 print a forecast note (`boonPlan`, `game.js:2345`). 雪野追鋒 and 聚賢豪氣 change the number and print none.
- **Enemy traits:** shown on the enemy's page, which says 「此刻獨行」 live (`game.js:1163`), and in the counter line of the forecast (`game.js:2574–2583`).
- **In the in-game guide:** nothing. It prints the paragraphs for tempo, prices, guards and conditions only (`rule-terms.js:492–495`).

**What else is built on it:**

- **Story:** five summit lines speak the mechanic (`hero-voices.js:87` 小龍女, `:104` 段譽, `:135` 楊過, `:300` 狄雲, `:334` 阿青); `wiki/content/單輪劇本.md:332–343`; `世界觀設定.md:29, 304, 324`.
- **A secondary objective:** 以招破招, drawn on 倒影天街 for 令狐冲 (`battles.js:282`, `journey.js:1192`, `maze-tale.js:542`).
- **The last board:** 求敗's 無招, and the weapon classes in `encounters.js:1074–1091`.
- **Wiki:** the 破招 page's table of weapon classes (`catalog/rules.js:66`), partner and 破招 links on hero pages (`catalog/heroes.js:43, 83, 85`), and the comparison's expected and peak blow (`catalog/compare.js:31, 111–157`).
- **`check-skills`:** an art is measured with the condition unmet and met, and passes as an upgrade if no more than 10% weaker unmet (`check-skills.mjs:63–66, 166–176`; `lib/skill-measure.mjs:49–70`). Its budget assumes each bonus holds a set share of turns.
- **`check-mechanics`:** a block of 32 checks (lines 647–772); 60 of its 1,766 checks name a word of the family. All 1,766 pass today.
- **The simulator:** it knows no art. It scores moves with `forecast`, so it meets conditions when that costs little. It chooses which arts to equip by their unmet strength (`sim-battles.mjs:827`), which works against these arts. It has a weight for the 以招破招 secondary (lines 349, 417, 465).

## 4. How much they matter in play

Measured with `node tools/sim-battles.mjs --runs 40 --seed 1 --arts`.

**Baseline win rate per board (40 runs, seed 1, first 境界):**

| Board | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Win | 100% | 100% | 100% | 100% | 98% | 100% | 100% | 100% | 95% | 84% |

By map, the only ones below 100% are 無刻漏臺 84%, 黑木繡閣 87% and 空山琴臺 96%.

**Equipped and used (40 runs):**

| Group | Arts seen | Hero-boards equipped | Uses | Uses per board equipped |
| --- | --- | --- | --- | --- |
| Conditional-power arts | 22 | 972 | 944 | 0.97 |
| Other tree arts | 75 | 3,744 | 4,794 | 1.28 |
| of which strikes | 57 | 3,251 | 4,035 | 1.24 |
| Starting arts | 20 | 715 | 333 | 0.47 |

- They make 15.5% of all art uses (15.2% over 200 runs).
- Most used per board equipped: 黯然銷魂掌 2.3, 六脈齊發 1.9, 降龍廿八掌 1.9, 越女劍 1.8, 破箭式 1.5 (equipped on 98% of 令狐冲's boards).
- Least used: 天山六陽掌 0.1 (equipped on 84% of 虛竹's boards, used 6 times), 全真劍法 0.2, 倚天劍 0.2, 玉女心經 0.2, 神龍擺尾 0.2.
- 胡斐's 纏身摘心刀 was never equipped, in 40 or in 200 runs.
- The 以招破招 secondary was drawn 4 times and met 0 times.

**How often the condition was met.** The simulator's own output does not say: it reports boards equipped and uses only. To find out, a copy of the simulator was run that also asks `strikeFactor` what held at each use. Its table matches the real tool's line for line, so the added figures describe the same games.

| Word | Met, 40 runs | Met, 200 runs | Share `check-skills` and the wiki assume |
| --- | --- | --- | --- |
| 孤行 | 295 of 351 (84%) | 1,325 of 1,567 (85%) | 60% |
| 合璧, any companion | 68 of 77 (88%) | 375 of 478 (78%) | 70% |
| 合璧, the named partner | 2 of 77 | 27 of 478 (6%) | not counted |
| 破招 | 139 of 228 (61%) | 559 of 911 (61%) | 50% |
| 斬殘 | 36 of 58 (62%) | 193 of 410 (47%) | 50% |
| 還報 | 66 of 145 (46%) | 405 of 928 (44%) | 70% |
| 黯然 | mean bonus +0.24 of 0.60 | +0.23; at a quarter 氣血 or less in 11 of 499 uses | 40% |
| 傾力 | mean 52 內力 spent; at the cap in 44 of 85 uses | 54; 165 of 311 | none |

Of 小龍女's 181 uses of her summit over 200 runs, the 合璧 bonus came from 左右互搏 in 125 and from 楊過 in 5.

**What if they were gone** (an experiment: bonuses stripped in memory, 200 runs, seed 1; nothing in the repository changed):

| Variant | Board 9 | Board 10 | Whole runs won |
| --- | --- | --- | --- |
| As the game is | 95% | 76% | 139 of 200 |
| Bonuses removed, nothing given back | 92% | 75% | 135 |
| Replaced by a flat multiplier (base + bonus × assumed share) | 91% | 72% | 125 |

- Boards 1 to 8 are within 2 points in all three.
- The gaps on boards 9 and 10 are within the noise of 200 runs (one standard error is about 3 points there), so no effect on win rate can be claimed.
- Damage per board with the bonuses removed: 楊過 400 to 348, 阿青 309 to 284; every other hero within about 3%.

## 5. What cutting would cost

Read from the files, plus two measurements. Not done.

**Files that would change:**

| Area | File and place | Change |
| --- | --- | --- |
| Data | `game/src/data/mastery-catalog.js` | 25 hero arts and 8 of 無名's: remove the fields, set a flat multiplier, rewrite each description; `PAIRED_HANDS_DESC` (line 19) |
| Rule words | `game/src/data/rule-terms.js:100–128`, and 無招 at line 358 | Remove 8 terms; 無招 loses its meaning |
| Rules | `game/src/rules/game.js` | `PARTNERS` (2110), `ANSWERS` and `answers` (2119–2135), `strikeFactor` (2140–2181), the 傾力 cost (2410), the hurt-round marks (3851, 3877, 4113, 4156), the `answered` record (3037, 3395), the 無招 lines (1092, 2130, 2154) |
| Art cards | `game/src/rules/move-facts.js:13–42` | Remove `bonusLines` |
| HUD | `game/src/ui/panels.js:182–195` | Remove the 還報 pip |
| Secondary | `battles.js:282`, `journey.js:1192–1200` and `1255–1264`, `maze-tale.js:542`, `ui/journey-pages.js:175` | 以招破招 goes or is redefined |
| Last board | `encounters.js:1074–1091` and 求敗's `formless` (line 875) | Weapon classes and 無招 have nothing left to do |
| Story | `hero-voices.js:87, 104, 135, 300, 334` | Five summit lines describe a rule that would be gone |
| Design documents | `世界觀設定.md:29, 304, 324`; `單輪劇本.md:332–343` | Carry the decision in |
| Wiki | `catalog/compare.js:31, 43, 111–157`; `catalog/heroes.js:43, 83, 85`; `catalog/rules.js:66–80` | Links to the removed pages become dead links, which `check-wiki` fails on |
| `check-skills` | `lib/skill-measure.mjs:36–70, 314–355, 548`; `check-skills.mjs:63–66, 166–176` | Remove the two-case measurement |
| `check-mechanics` | Lines 647–772 (32 checks), part of the last-board block (83 checks), the 以招破招 checks near 4743–4776 | Delete or rewrite |
| Simulator | `sim-battles.mjs:349, 417, 465` | Only the 以招破招 weights; the policy needs nothing |
| `check-story` | Line 224 | The 以招破招 case |
| README, ROADMAP | "Skill trees"; "How the story is put together" (names `PARTNERS`); items 0.4, 0.19 | Text |
| Fonts | `python3 tools/extra-fonts.py --check` | After the text changes |

**Saved games:** arts are saved by id and their fields are read from the catalogue, so removing fields needs no migration. Two cases need care:

- A run saved with 以招破招 as its drawn secondary breaks if that kind is deleted.
- If any node is removed, not just flattened, its points must be refunded as `migrateSave` did before (`journey.js:267–321`).

**Would the checks still pass?** Measured on in-memory copies:

- `check-skills` with flat multipliers: 0 failures, 1 warning, the same as today.
- `check-skills` with the bonuses removed and nothing given back: 5 failures (全真劍法, 破刀式 and 破劍式 fall below their starting arts).
- The wiki's six aspects at level 12: the closest pair stays 令狐冲 and 黃藥師, 12 points apart on their widest aspect, in all three variants. No score moves more than 4 with flat multipliers; 楊過's 近身攻擊 goes 95 to 91. So the rule in 0.24 (no two heroes within five points on all six) is not at risk.

**Who would lose what tells them apart** (inferred from the table in section 3 and the niches in 0.19):

- **Most:** 楊過 (four arts, and "alone and hurt" is his niche), 阿青 ("alone"), 無名 (five weapon forms would differ only by their riders), 令狐冲 ("answers each kind of enemy").
- **Some:** 胡斐 (his boon would still chase the wounded), 狄雲, 小龍女 with 楊過 (the only two-way pair, and her summit line is about it), 段譽 (his summit's all-in price), 蕭峰 and 向問天 (payback as tanks).
- **Little:** 洪七公, 虛竹, 趙敏, 程靈素 (one low-tier art each, 0.1 to 1.0 uses per board), and 郭靖 (his line is already inert).

## 6. Near-duplicates

Read from the rules. Line numbers are in `game/src/rules/game.js` unless said.

| Group | Members | How they differ exactly |
| --- | --- | --- |
| Stop an enemy acting | 失神, 定身, 閉穴, 封穴, 受制 | 失神: loses one turn, no move, still counters (`3755`, `1677`). 定身: several turns, no move, strike, signature, counter or cover (`762`, `806`, `1738`). 閉穴: the same but it still walks (`3758`). 封穴: this round only; stops the counter and the signature, not basic attacks; also switches off 化功, 借力 and 蓄勢反擊 (`714`, `2684`, `3904`). 受制: turns rank and file; on a master or lieutenant it becomes 失神 (`1696–1735`). A master takes one turn of each and resists the next |
| "This blow draws no counter" | 免受還擊, 收隙, 封穴, 定身, 閉穴, 越女試劍, 無守 | One outcome reached seven ways: the art itself; spending 破綻; a condition on the target; the leader's boon once a round; 無守 is the same thing laid on a hero as a price (`762–765`, `2539–2555`) |
| Less 攻擊 | 攻勢受挫, 纏械, 軟筋餘香 | 纏械 is 攻勢受挫 plus reach held to 1 (`746`). 軟筋餘香 is a −3 aura round the leader. All three subtract in the same line of `stat` (`1797–1802`) |
| Less 防禦 | 破防, 露空 | The same subtraction (`1804–1805`). 破防 goes on a foe and 解厄 lifts it; 露空 is a price on the caster and 解厄 does not (`form-rules.js:33–46`) |
| Less move | 絆足, 立樁, 布陣's slow, 墜網 | 絆足 −2 for two rounds; 立樁 no move at all, as a price; a formation −2 at the start of the turn; 墜網 is an enemy laying 絆足 |
| More 防禦 or less damage | 固守, 待命, 布陣, terrain, 肝膽相照, 卸勁, 護勁, 金剛 | Flat 防禦: 固守 +4 or +5, 待命 +4, a formation +4, cover +3 or +5, the boon +5. 卸勁 cuts by a percentage and makes counters full. 護勁 absorbs a fixed amount. 金剛 voids everything for a phase |
| Shields under three names | 護勁, 餘氣護身, 落步成陣 | All lay the same condition; they differ in where the amount comes from (the art, excess healing up to 12, a landing worth 8) |
| Turning a blow back | 挪移, 借勁還手, 反刺, 借力 | 挪移: halves the next blow and returns half, capped. 借勁還手: returns the first loss, up to 9. 反刺: a flat 7 to adjacent strikers. 借力: the enemy's version, the whole blow missing and half returned (`837–845`) |
| Taking a blow for someone | 代受, 護駕, 刀陣 | One function, `coverer` (`800–817`). A hero for any adjacent companion; an enemy for its master; one of a like pair for the other. Three names for one rule |
| Bonus against the wounded | 斬殘, 斬殘（敵）, 雪野追鋒 | All test half 氣血 or less. The art adds to the multiplier, the enemy trait adds 攻擊, the boon adds 8 damage |
| Bonus by who stands beside | 孤行 and 獨行; 合璧, 夾衛 and 夾擊 | 孤行 and 獨行 are the same test on each side under two names. 合璧 looks beside the striker, 夾衛 beside the target, 夾擊 directly behind the target |
| Splash | 濺射, 廣及, 穿行, 走勁 | Four neighbours; within two or three tiles; the first foe within two tiles behind, in a line, at 45%; the nearest other foe within two at 32%. A foe caught twice takes the stronger once (`form-rules.js:140`) |
| Healing from the blow | 吸元, 回生 | 吸元: 40–50% of damage, capped at 20 or 40. 回生: a quarter, capped at 9 |
| 內力 back | 回氣, 吸勁, 北冥真氣, 渡氣 | +6 on a hit; +8 and a delayed signature; the boon's +3 on a hit; +6 to each companion reached |
| Limits on use | 壓箱, 調息, 留力, 曲終 | Once a board; wait some rounds; only if he did not attack last round; no arts at all next turn |
| An extra action | 連環, 號令 | 連環 after a kill, for the striker; 號令 for a companion who has acted |
| Poison sources | 中毒, 毒手, 步裡藏毒, 碧蠶毒蠱, 催毒 | One condition from an art, an enemy's basic attack, the same only after it walks, a boon. 催毒 spends it |
| Names that read alike | 封穴 and 閉穴; 破招, 破防, 破綻, 破 (a board kind) and the badge 破; 借力, 借勁, 借勁還手; 蓄勢 and 蓄勢反擊; 護勁, 護駕, 護陣 | Different rules under names one character apart. The card says 護盾 where the condition is named 護勁 (`move-facts.js:165`, `battle-mastery.js:170`) |

## What could not be determined

- **How often a human meets these conditions.** Every play figure is the simulated player's. It reads the forecast perfectly and equips arts by their unmet strength.
- **Whether newcomers are confused by this family.** The playtest neither lists these words nor shows a reviewer using such an art; its reviewers were simulated and mostly played the early boards.
- **無名's eight 破招 forms in play.** The simulator's runs do not include him.
- **Manuals in play.** The simulator never buys one.
- **How the tree page and the forecast look on screen.** The code that builds them was read; no browser was opened.

## The author's view (opinion, not fact)

- **I would not cut the family as a whole.** The facts do not point to it as the source of overload: it is absent from the first battle, it is one of the few families explained on the card where it appears, and it holds up the identities of 楊過, 阿青, 胡斐, 令狐冲 and 無名 and five summit story lines. The cost in files and checks is moderate, and the gain in first-hour vocabulary is close to nothing.
- **I would trim inside it.** The cheap cuts are the instances that do little: the one-way 合璧 arts of 虛竹 and 趙敏, 還報 on 洪七公's tier-1 art, the named-partner tier (met in 6% of uses) outside 楊過 and 小龍女, and the dead 左右互搏 line on 郭靖. 黯然's formula could be a plain step ("at half or less").
- **The bigger savings are in section 6.** One name where hero and enemy share a rule (代受, 護駕, 刀陣; 孤行, 獨行), one badge per condition matching its name, and the 17 戰鬥效果, which reach the player first, through starting weapons and the shop, with their rules inside a fold.
- **Three small fixes would help the family itself:** say in the forecast when 合璧, 還報, 斬殘 or 破招 is not met, as 孤行 already does; give 雪野追鋒 and 聚賢豪氣 a forecast note; rename the row 「招式連攜」, which two reviewers found misleading.
- **The assumed shares are off from the simulated ones** (孤行 0.6 against 85%, 還報 0.7 against 44%). If the family stays, the budget in `check-skills` and the wiki's comparison could use the measured figures.
