# Rule words: what to merge, rename, fold or remove

2026-11-23. A proposal for the producer's approval. **Nothing in the game has been changed.** The evidence is `inventory.md` beside this page; it follows, row by row, the rulings the draft was given by the agent leading the work (they are a starting position, not the producer's decisions), and every place where a row departs from them is marked **Departure** and listed again at the end.

The play figures quoted here are a simulated player's (`tools/sim-battles.mjs`, 200 runs, seed 1, first 境界, with a copy of the tool that also records what held at each blow). The scripts were not kept.

## The five verbs

| Verb | Meaning |
| --- | --- |
| **Keep** | Nothing changes. |
| **Fold** | The effect stays exactly as it is, but it stops being a named rule word: no glossary term, no separate name to learn. The art's or item's card says what it does in one plain sentence. Numbers do not change. |
| **Merge into X** | The carriers get X's rule and name. The row says exactly what changes in the rule for them and whether that is stronger or weaker than today. |
| **Rename to X** | Same rule, new name, because the old one collides with another word or with what the card already calls it. |
| **Remove** | The effect is deleted. The row says what each carrier gets instead so that it is not weaker, and how the number was set. |

## Summary

**How words are counted, both times:** a word counts if it has its own entry in the glossary, that is, a term in `game/src/data/rule-terms.js` or an entry of `FORM_RULES` in `game/src/rules/form-rules.js` not already a term.

| Family | Today | After | What goes |
| --- | --- | --- | --- |
| Basics of a strike (出招的基本) | 14 | 12 | 廣及, 回氣 |
| Tempo (出手節奏) | 6 | 4 | 號令, 留力 |
| Prices (絕技的代價) | 6 | 5 | 轉護 (反噬 becomes 亂氣) |
| Conditional power (看準時機) | 8 | 6 | 左右互搏, 傾力 |
| Guards and reactions (護人與布陣) | 10 | 8 | 卸勁, 後發 (護勁 becomes 護盾) |
| Conditions (附加狀態) | 13 | 11 | 吸勁, 失神 |
| Gear (器物) | 3 | 3 | 反刺 becomes 反震, which also takes in 借勁還手 |
| Leader boons (領隊陣法) | 3 | 1 | 越女試劍, 雪谷回生 |
| 戰鬥效果 | 17 | 6 | 留隙 and 收隙 become 破綻; 封穴 becomes 截勁; 餘氣護身, 借勁還手, 走勁, 催毒, 夾擊, 回生, 落步成陣, 定勢, 撞關, 以毒解毒 go |
| **The player's own side** | **80** | **56** | |
| Enemy traits (敵方行事) | 31 | 26 | 護駕, 刀陣, 獨行, 斬殘（敵） and 借力 take the heroes' names (護陣 becomes 星索) |
| Battle and run (戰局) | 12 | 12 | |
| **All** | **123** | **94** | |

Twenty of the 26 enemy words that remain belong to one enemy each and stay on that enemy's page. If those were not counted as words to learn, the total would be 74.

**Conditions shown on a piece:** 28 names today, 26 after (失神 and 卸勁 go). Every badge becomes a character of the condition's own name, or the number it changes with an arrow.

**What changes, by carrier:**

| | Number changes | Wording only | Untouched |
| --- | --- | --- | --- |
| Arts (147 of the twenty heroes, 10 of 無名's, 8 manuals) | 30 (28 hero arts, 2 manuals) | 65 (60 hero arts, 3 of 無名's, 2 manuals) | 70 |
| Items (34) | 9 | 9 | 16 |
| Enemy entries (70) | 0 | 10 | 60 |

"Number changes" includes every art whose rule changes in play, even where the average is meant to stay the same. Every such row is marked **Yes** in the tables.

**A first check of the numbers.** The proposed numbers that can be put into the art and item tables in memory were tried with the game's own tools (not the 黯然 step, 走勁, the four starting arts, or the "already beside you" clause of 牽引, which need rule changes):

- `check-skills`: 0 failures, as today (倚天劍 tried at both 1.35 and 1.40). One new warning: 降龍十八掌 sits above its band once 留力 becomes 調息.
- `sim-battles`, 200 runs: boards 1 to 8 within 1 point of today; board 9 at 91% against 95%, board 10 at 76% against 76%; whole runs won 132 against 139. All within the noise of 200 runs. No hero's damage per board moved more than 8%.

## Recommended scope

Added by the agent leading the work, after reading the whole list. The list below is everything that could be done; this is what I recommend doing, in three parts the producer can approve separately.

| Part | What | Words, all | Words, the player's own side | Numbers changed |
| --- | --- | --- | --- | --- |
| Today | | 123 | 80 | |
| **A. Names, badges and folds** (steps 1 and 2 below) | One name per rule, hero or enemy; no look-alike names; every badge a character of its own condition's name; a word carried by one art or item becomes that card's sentence | **102** | **64** | **None.** The simulator must give identical games before and after, which makes it safe to check |
| **B. Effects that go or merge** (steps 4 and 5) | 定勢, 夾擊, 撞關, 走勁, 失神, 卸勁, 留力 | 95 | 57 | About 25 arts and 9 items |
| **C. Conditional power** (step 3) | 左右互搏 as a word; optionally the 黯然 step | 94 | 56 | 小龍女's 玉女心經 in one case; 黯然銷魂掌 if the step is taken |

1. **Approve A as it stands.** It is most of the saving (21 of the 29 words) and changes no number.
2. **In B, take the variants that change no number where the list offers one**: 留力 folded instead of merged (judgement call 3), 走勁 folded (8), 撞關 made part of 擊退 only (9). Then decide 定勢 and 夾擊 (remove, with a flat number), 失神 into 定身, and 卸勁 into 固守 one at a time, each measured with the simulator as the steps say.
3. **In C, I withdraw one of my own rulings.** I asked for 合璧 to be removed from the three one-way pairs (趙敏 beside 張無忌, 程靈素 beside 胡斐, 虛竹 beside 蕭峰) and for 還報 to come off 洪七公's 神龍擺尾. Neither saves a word, since 合璧 and 還報 stay for other heroes; both change numbers; and the pairs were put in on purpose and are in both design documents (judgement call 12). I recommend leaving all four arts as they are. What is worth doing in C is removing 左右互搏 as a word (小龍女's summit keeps exactly today's numbers, and the line that does nothing for 郭靖 goes) and folding 傾力. The 黯然 step is optional: it makes the rule easier to say and changes how the art plays.
4. **Also worth doing whatever else is decided**: say in the forecast when 合璧, 還報, 斬殘 or 破招 is not met, as 孤行 already does, and rename the forecast row 「招式連攜」.

This trims the glossary. It is not the main cure for the confusion the playtest found: seven of the nine reviewers named the first battle's interaction as the worst thing, and one named vocabulary (`proposals/playtest-2026-11-22/README.md`).

## How to read the tables

Columns: the word; what it does today; who carries it today; the proposal; what the card or forecast would read afterwards; whether a number changes; files touched; what depends on it.

File names are shortened:

| Short | File |
| --- | --- |
| RT | `game/src/data/rule-terms.js` (terms, and `PLAIN_FIELDS`, which must list a folded field or `check-wiki` fails) |
| FR | `game/src/rules/form-rules.js` |
| FC | `game/src/data/form-catalog.js` |
| MC | `game/src/data/mastery-catalog.js` |
| MA | `game/src/data/martial-arts.js` |
| GJ | `game/src/rules/game.js` |
| BM | `game/src/rules/battle-mastery.js` |
| MF | `game/src/rules/move-facts.js` (the card's lines) |
| TK | `game/src/actors/tokens.js` (badges) |
| EN | `game/src/data/encounters.js` |
| PN | `game/src/ui/panels.js` |
| CM | `tools/check-mechanics.mjs` |
| CS | `tools/check-skills.mjs` with `tools/lib/skill-measure.mjs` |
| SIM | `tools/sim-battles.mjs` |

The wiki builds its pages from the game, so it follows without edits unless a row says otherwise. "—" means none.

Internal field names (`shield`, `seal`, `mark`, `riposte`, `backlash` …) stay as they are in every Rename, so saved games need nothing for those rows.

## 1. Basics of a strike (出招的基本): 14 today, 12 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 還擊 | A struck survivor in reach hits back at 55% of a basic attack | Universal | **Keep** | Unchanged | No | — | — |
| 免受還擊 | This art draws no counter | 25 hero arts, 2 of 無名's, 1 manual | **Keep** | The card's line 「敵人無法反擊」 (MF:137) should say the word: 「免受還擊」 | No | MF | — |
| 穿透 | Ignores part of the target's defence | 23 hero arts, 3 of 無名's, 1 manual | **Keep** | Unchanged | No | — | — |
| 濺射 | The target's four neighbours take a share | 15 hero arts, 1 of 無名's, 1 manual | **Keep**; it takes in 廣及 and replaces 走勁 | 「濺射 四鄰 35%」; with reach, 「濺射 兩格 40%」. Glossary: 「主目標四鄰的其他敵人也受到一部分傷害；寫明兩格、三格的，主目標該距離之內的其他敵人都受波及」 | No | RT, MF:129–132 | — |
| 廣及 | The splash reaches two or three tiles | 郭靖 降龍十八掌, 楊過 杞人憂天, 蕭峰 降龍廿八掌, 洪七公 震驚百里, 黃藥師 碧海潮生曲 (three tiles), 程靈素 七心海棠 | **Merge into 濺射**, written with its reach. The rule for these six is the one they have | 「濺射 兩格 40%」; 碧海潮生曲 「濺射 三格」 with its share | No | RT (term removed; `radius` stays as the reach), MF, CM "radius" block (names only) | — |
| 連擊 | One art lands as several hits | 郭靖 左右互搏術, 小龍女 左右互搏術, 小龍女 玉女素心劍法, 段譽 六脈齊發 | **Keep** | Unchanged | No | — | — |
| 擊退 | Pushes a survivor one tile | 蕭峰 太祖長拳 and 亢龍有悔, 郭靖 亢龍有悔 and 降龍十八掌, 段譽 關衝劍, 張無忌 移勁, 張三丰 雲手; 無名 破槍式 | **Keep**; 撞關 becomes part of its rule | 「擊退 · 推開一格；去路受阻則推不動，首段威力 ＋7」. Forecast: 「擊退受阻 · 首段 ＋7」 | No: every push art already has 撞關 | RT, FR:67–77, 98–102; MF:136 | 合招 前掌後刀 (FC:244) |
| 身法 | Jump to an empty tile in range; ends the action | 段譽 凌波微步, 袁承志 神行百變; manual 水上漂 | **Keep** | Unchanged | No | — | — |
| 療傷 | Heals; halved on a piece with 內傷 | 10 hero arts, 2 manuals | **Keep** | Unchanged | No | — | — |
| 範圍 | The effect reaches allies around the target | 9 hero arts | **Keep** | Unchanged | No | — | — |
| 回氣 | Regain 內力 on a hit | 向問天 返勁 | **Fold** (one art; leaves no state on a piece) | 「命中回復 6 點內力」, which the card already prints | No | RT | — |
| 吸元 | Heal self by a share of the damage dealt, capped | 令狐冲 吸星大法 (50%, up to 40), 狄雲 批紙削腐 (40%, up to 20) | **Keep**; it takes in 回生 | 「吸元 · 回復主目標損血的 50%，最多 40 氣血」 (unchanged) | No | — | — |
| 自耗氣血 | Costs the caster's own 氣血 | 7 hero arts (向問天 1, 楊過 2, 蕭峰 1, 趙敏 3) | **Keep** | Unchanged | No | — | — |
| 待命 | A hero who did not strike gets 防禦 +4 until next turn | Universal | **Keep** | Unchanged | No | — | — |

## 2. Tempo (出手節奏): 6 today, 4 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 連環 | Felling the target grants another action, once a round | 令狐冲 獨孤九劍, 胡斐 纏身摘心刀, 阿青 竹枝連環 | **Keep** | Unchanged | No | — | — |
| 回身 | After striking, may walk the steps left | 7 hero arts (阿青 2, 小龍女 2, 袁承志 2, 胡斐 1) | **Keep** | Unchanged | No | — | — |
| 號令 | A companion who has acted moves and acts again | 任盈盈 聖姑令 | **Fold** (one art; leaves no state) | Card: 「令一位本回合已行動的同伴再移動並出手一次」. Forecast: 「（同伴名）可再移動並出手一次（本局僅一次）」 | No | RT, MF:158–161, GJ:2450, PN:1308 | CM "order" block (wording); the guide's tempo paragraph |
| 留力 | Usable only if the hero did not attack in the round before | 郭靖 降龍十八掌 | **Merge into 調息**, one round. What changes: today the round between two uses must pass without an attack; afterwards he may attack in it with anything else. **Stronger** | 「調息 · 施展後隔 1 回合」 | **Yes.** In the trial run its uses doubled (0.6 to 1.2 a board equipped); 郭靖's damage rose 4%, his other changes included. `check-skills` prices 調息 at 0.20 and 留力 at 0.30, so the art goes from 2.60 to 2.70 against a band of 2.0–2.5: one new warning | MC:933, RT, GJ `artReady`, MF:47, PN:182–195 (the 留力 pip), CM "use restrictions", CS | 郭靖's summit line 「打出去的力道要留三分」 (`hero-voices.js:76`) and `世界觀設定.md:304` both speak of holding back |
| 壓箱 | Once per board | 任盈盈 聖姑令, 黃蓉 天下無狗, 程靈素 七心海棠; manual 易筋經 | **Keep** | Unchanged | No | — | — |
| 調息 | Some rounds before it can be used again | 8 hero arts, 3 manuals | **Keep**; gains 降龍十八掌 | Unchanged | No | — | — |

## 3. Prices (絕技的代價): 6 today, 5 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 露空 | Own 防禦 down until next turn | 令狐冲 獨孤九劍, 胡斐 懸崖一刀, 袁承志 金蛇劍法; 無名 破掌式 | **Keep** | Unchanged; badge 露 | No | — | — |
| 無守 | Cannot counter until next turn | 令狐冲 獨孤九劍, 阿青 越女劍 | **Keep**, not merged into 露空. I cannot show it changes little: one costs damage dealt (a counter is about 11 to 15), the other damage taken (0.65 a point of 防禦 on every blow), and which is worse depends on how many enemies reach the hero. 獨孤九劍 carries both and its story line is about exactly this | Unchanged; badge 無 | No | — | `hero-voices.js:31`; `世界觀設定.md:304` (「九劍有攻無守」) |
| 立樁 | Cannot move next turn | 向問天 涼亭鐵鏈, 張三丰 太極拳, 狄雲 神照經; manual 金剛護體圖 | **Keep** | Unchanged; badge 立 | No | — | — |
| 曲終 | Cannot use arts next turn; basic attacks still allowed | 任盈盈 笑傲江湖, 洪七公 打狗棒法 | **Keep** (my recommendation). Turning it into 調息 would free the hero's other arts next turn, which is much stronger for 任盈盈, whose turns are all arts. It leaves a state on the piece, and 任盈盈's summit line names it | Unchanged; badge 曲 | No | — | `hero-voices.js:45` (「曲終人散」), `:215` |
| 反噬 | Each use adds a layer of 亂氣; the third costs 20% of greatest 氣血 and clears them | 令狐冲 吸星大法; manual 七傷拳 | **Rename to 亂氣.** **Departure** from Fold: it leaves a lasting state on the piece with a layer count, and that state is already called 亂氣, so today one thing has two names | 「亂氣 · 每次施展積一層，滿三層自損兩成最大氣血並清空」; badge 亂 with the layers | No | RT:91–96, MF:55, MC (吸星大法's 「反噬自身」 becomes 「自損氣血」) | CM "backlash" block; 解厄 lifts 亂氣 |
| 轉護 | Needs the caster's own shield, which passes to the recipients | 張無忌 第七層 | **Fold** (one art; no state of its own) | 「須自身帶有護盾；施展時護盾移給受術者，各至多 24 點」 | No | RT, MF:48, GJ:2444–2448 | — |

## 4. Conditional power (看準時機): 8 today, 6 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 破招 | +0.30 when the target is the kind this form answers | 令狐冲 破劍式, 破箭式, 破氣式; 8 of 無名's forms | **Keep** | Unchanged. Suggested addition when unmet: 「破招未成 · 目標非遠攻」 | No | — | 以招破招 secondary; 無招 |
| 孤行 | Bonus when no companion is adjacent | 楊過 擊流, 杞人憂天, 黯然銷魂掌; 阿青 竹枝連環, 越女劍 | **Keep**; the enemy's 獨行 takes this name | Unchanged | No | — | `hero-voices.js:334` |
| 合璧 | A companion adjacent adds a little; the named partner adds more | 楊過 全真劍法; 小龍女 玉女心經, 玉女素心劍法; 虛竹 天山六陽掌; 趙敏 倚天劍; 程靈素 金針刺穴 | **Keep** on 楊過's and 小龍女's three arts. **Remove** from the other three, each given a flat multiplier: 天山六陽掌 1.40 to **1.50**, 倚天劍 1.20 to **1.40**, 金針刺穴 1.30 to **1.45** | 楊過 全真劍法, unchanged: 「合璧 · 有同伴相鄰 ＋0.15，小龍女相鄰 ＋0.40」. 小龍女: see 左右互搏. The three: the clause leaves the description, for example 「以天山六陽掌擊中相鄰敵人。」 | **Yes**, three arts. Set as base + the any-companion bonus × 0.78 (a companion was adjacent in 375 of 478 uses of all 合璧 arts), rounded to 0.05: 1.50, 1.45 and 1.35. 倚天劍 had a companion in all 9 of its own uses, so I took 1.40 to be sure it is not weaker. Measured average multiplier today, partner bonus included: 1.49, 1.46, 1.40 | MC, GJ:2110–2116 (`PARTNERS` loses 趙敏, 程靈素, 虛竹), MF:25–32, RT:111–116, CM "conditional power", CS | **The three one-way pairs are recorded as decided** in `單輪劇本.md:343` and `世界觀設定.md:29`; both need the new decision carried in. Hero pages' 合璧 link follows `PARTNERS` |
| 左右互搏 | Once learned, the hero's 合璧 arts count her as her own companion | 郭靖 左右互搏術, 小龍女 左右互搏術 | **Remove** the word and the clause. 小龍女's two 合璧 arts take the lesser bonus into their base and keep only the extra for 楊過 beside her. 左右互搏術 keeps its double strike | 左右互搏術: 「左右手各使一路，在兩格內連擊兩次。」 玉女心經: 「合璧 · 楊過相鄰時倍率 ＋0.20」. 玉女素心劍法: 「合璧 · 楊過相鄰時倍率 ＋0.25」 | **Yes, one case.** 玉女素心劍法: 1.45 without 楊過 and 1.70 with him, **the same as today** (it requires 左右互搏術, so the lesser bonus is always on). 玉女心經: base 1.35 to 1.55; 1.75 with 楊過, as today; the one difference is a blow with nobody adjacent before 左右互搏術 is learned, 1.35 today and 1.55 after (4 of its 21 uses in the simulation). 郭靖: nothing, the clause never did anything for him | MC:19 and the two arts, GJ:2165–2170, MF:33, RT:117–122, CM (its checks in the "conditional power" block) | 小龍女's summit line (`hero-voices.js:87`, 「我一個人，想起了兩個人的份」) still holds. `世界觀設定.md:167, 305` use 左右互搏 as lore, not as this rule |
| 黯然 | Bonus = 0.6 × min(1, share of 氣血 lost ÷ 0.75), on 氣血 after the art's cost | 楊過 黯然銷魂掌 | **Keep** the word; the rule becomes one step: **氣血 at three quarters or less after the cost: +0.45** | Card: 「黯然 · 自身氣血不過四分之三時倍率 ＋0.45」. Forecast: 「黯然 ＋0.45（氣血 120／184）」; unmet: 「黯然未成 · 氣血尚逾四分之三」 | **Yes.** Today's measured average is +0.23 over 487 uses. Candidates, with the average each would have given on those same uses: (a) three quarters or less, +0.45: **+0.22**, peak multiplier 2.60 against today's 2.75; (b) six tenths or less, +0.70: +0.235, peak 2.85; (c) half or less, +0.60: +0.13. (a) and (b) are equally close within the sample's error; I chose (a) because its peak is below today's, not above | GJ:2172–2176, MF:34, RT:123, CM (its checks in the "conditional power" block), CS (it sets the hero at a quarter, which still meets the step), wiki `compare.js:124` | `hero-voices.js:135`; `世界觀設定.md:304` |
| 還報 | Bonus if an enemy's action took 氣血 from the hero in the last enemy phase | 向問天 返勁, 涼亭鐵鏈; 蕭峰 龍戰於野, 降龍廿八掌; 洪七公 神龍擺尾; 狄雲 神照經 | **Keep** on 向問天, 蕭峰 and 狄雲. **Remove** from 神龍擺尾: 1.35 to **1.55** flat | 神龍擺尾: 「回身一掌擊中相鄰敵人。」 The others unchanged, with the pip on the hero's plate | **Yes**, one art. 1.35 + 0.30 × 0.60 (met in 28 of its 47 uses) = 1.53, rounded to 1.55; its measured average today is 1.53 | MC, CM, CS | `hero-voices.js:300` (狄雲) |
| 斬殘 | Bonus when the target is at half 氣血 or less | 胡斐 纏身摘心刀, 懸崖一刀 | **Keep**; one glossary entry with the enemy's | Unchanged | No | — | — |
| 傾力 | Spends all 內力; the more spent, the higher the multiplier, capped | 段譽 六脈齊發 | **Fold** (one art; no state) | Card: 「耗盡內力（至少 20 點）；每點內力倍率 ＋0.015，最高 1.55」. Forecast: 「耗內力 54 · 倍率 1.55」 | No | RT:126, MF:37–40, GJ:2150 | `hero-voices.js:104` |

## 5. Guards and reactions (護人與布陣): 10 today, 8 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 代受 | Until next turn, takes enemies' direct blows aimed at adjacent companions | 郭靖 見龍在田, 蕭峰 見龍在田, 張三丰 太極拳 | **Keep**; the enemies' 護駕 and 刀陣 take this name | Unchanged; badge 代 | No | — | — |
| 挑釁 | Until next turn, enemies within two tiles who can reach him must attack him | 向問天 鐵索並肩 | **Keep.** **Departure** from Fold: it leaves a state on the caster with its own badge (挑) that the enemy's behaviour reads | Unchanged | No | — | — |
| 布陣 | A five-tile formation: enemies entering stop and lose 2 move; heroes in it get 防禦 +4 | 黃蓉 五行布陣, 天下無狗; 黃藥師 五行布陣 | **Keep** | Unchanged; badge 陣 | No | — | — |
| 卸勁 | Until next turn, damage taken is cut 30% (20% on 羅漢拳) and counters are at full strength | 向問天 吸功入地小法 (starting), 返勁, 涼亭鐵鏈; 張三丰 羅漢拳 (starting) | **Merge into 固守**: 防禦 **+10** until next turn on 向問天's three, **+7** on 羅漢拳. They **lose** the full counter (back to 55%, or 75% under 太極圓轉). The cut becomes a flat 6.5 (or 4.5) off each blow: **stronger** against blows under about 22, **weaker** against heavier ones (a 40-point blow: 12 off today, 6.5 after) | 「固守 · 至下回合，自身防禦 ＋10」; badge 防↑ | **Yes**, four arts. Set where `check-skills` prices the two alike (卸勁 0.20; 固守 0.02 a point a turn). In the trial run (the two tree arts only, with his other changes) 向問天 took 4% more damage and dealt the same | MC:757, 799, GJ:1821–1842 (the two starting arts), GJ:762–780 (`counterRatio`, `stanceCut` stay for enemies), BM, MF, CM "stance" block (17 checks), CS, SIM | 向問天's payback arts read better with a full counter; 張三丰's boon 太極圓轉 is about fuller counters |
| 閃身 | The next direct attack misses | 段譽 凌波微步, 袁承志 神行百變, 阿青 白猿步 | **Keep** | Unchanged; badge 閃 | No | — | — |
| 挪移 | The next blow is halved and half is returned, capped | 張無忌 卸力, 第七層 | **Keep**; the enemy's 借力 takes this name | Unchanged; badge 挪 | No | — | — |
| 後發 | Counters at 80% instead of 55% | 張無忌 太極拳・攬雀尾, 張三丰 武當綿掌・黏勁 | **Fold** | 「還擊按八成計」 | No | RT:158 | — |
| 護勁 | Absorbs a set amount of damage; the stronger shield wins | 8 hero arts (任盈盈 1, 郭靖 1, 張無忌 1, 蕭峰 2, 張三丰 2, 程靈素 1) | **Rename to 護盾**, which the card and the art texts already say | 「護盾 · 可吸收 16 傷害 · 1 回合」; badge 護 | No | BM:170, RT:159 | — |
| 固守 | 防禦 +4 or +5 for two turns | 向問天 鐵索並肩, 郭靖 合陣, 張三丰 真武七截陣 | **Keep**; gains the four 卸勁 arts | Unchanged; badge 防↑ | No | — | — |
| 金剛 | For one enemy phase, enemy blows do nothing and lay nothing | 張三丰 太極拳; manual 金剛護體圖 | **Keep** | Unchanged; badge 金 | No | — | — |

## 6. Conditions (附加狀態): 13 today, 11 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 吸勁 | +8 內力, and the target's signature is put back a round | 段譽 北冥神功 (starting) | **Fold** (one art; it lays no condition on the target) | Card: 「命中回復 8 點內力，並使目標的絕技延後一回合」. Forecast: 「內力 ＋8，（敵名）絕技延後一回合」 | No | RT:175, FR:26–29, GJ:721–742 (notes) | The 蓄勢 term's sentence names 吸勁; CM "siphon" block (wording) |
| 內傷 | Healing halved; loses 氣血 after each attack it makes | 虛竹 生死符, 程靈素 七心海棠; manual 七傷拳; 李莫愁's signature lays it on heroes | **Keep**, not merged into 中毒. It cannot be made cost-neutral: 中毒 takes 氣血 every round whatever the piece does, 內傷 only when it attacks, and halving a hero's healing is what 李莫愁's board is about | Unchanged; badge 傷 | No | — | CM board 7 block |
| 失神 | Loses its next action, no move; still counters; a master resists the next round | 黃蓉 絆字訣 (only on a target under 纏械 or in a formation), 洪七公 轉字訣, 黃藥師 彈指神通; manual 彈指神通; 生死符 lays it on masters and lieutenants | **Merge into 定身** for one round. What changes: the target no longer counters, neither the blow that lays it nor any other that round, and cannot take a blow for its master: **stronger**. A master's resistance is shared with 定身's, so 洪七公 can no longer hold a master two rounds running with 轉字訣 and then 打狗棒法: **weaker** there | 「定身 · 1 回合不能移動、出手或還擊」. 絆字訣: 「目標兵刃遭纏或站在陣中時，定身一回合」. 生死符: 「局主與副手不受制，改為定身一回合」 | **Yes**, five arts. `check-skills` already prices one round of each alike. In the trial run (轉字訣 and both 彈指神通) no board moved beyond noise | MC, GJ:1658–1684 and 3755, BM:211, HELD_KINDS BM:124, FR:33 (解厄's list), RT:177, MF:56–57, CM "daze" block (23 checks), CS, SIM (`W.hold`) | 打狗陣法's and 解厄's lists of conditions; a save made mid-fight may hold a 失神 |
| 纏械 | 攻擊 down, and can strike adjacent tiles only | 黃蓉 纏字訣, 天下無狗; 虛竹 天山折梅手; 狄雲 去劍式; 袁承志 金蛇劍法; 無名 破索式 | **Keep** | Unchanged; badge 纏 | No | — | — |
| 定身 | No move, strike, signature or counter; a master one round | 洪七公 打狗棒法, 程靈素 醍醐香; manual 冰魄銀針 | **Keep**; gains the 失神 arts | Unchanged; badge 定 | No | — | — |
| 閉穴 | No strike, signature or counter, still walks; a master one round | 黃蓉 蘭花拂穴手, 小龍女 金鈴索, 洪七公 封字訣, 趙敏 十香軟筋散, 阿青 竹枝點目 | **Keep** | Unchanged; badge 閉 | No | — | — |
| 受制 | An ordinary enemy fights its own side for some enemy phases; masters and lieutenants lose an action instead | 虛竹 生死符 | **Keep.** By principle 1 it would fold, but it lays a lasting state with its own badge and its own look on the board (base, outline and gauge turn green-gold), so it needs a name | Unchanged; badge 制 in place of 倒 | No | TK | — |
| 中毒 | Loses 氣血 each round | 任盈盈 黑血神針, 小龍女 玉蜂針, 程靈素 赤蠍粉, 七心海棠; manual 冰魄銀針 | **Keep** | Unchanged; badge 毒 | No | — | — |
| 攻勢受挫 | 攻擊 down | 8 hero arts, 1 of 無名's; 余滄海 and other signatures | **Keep** | Unchanged; badge 攻↓ in place of 弱 | No | TK | — |
| 破防 | 防禦 down | 段譽 少澤劍, 胡斐 懷中抱月; some enemy signatures | **Keep** | Unchanged; badge 防↓ in place of 破 | No | TK | — |
| 振奮 | 攻擊 up | 任盈盈 琴簫引, 郭靖 合陣, 蕭峰 烈酒添勁, 張三丰 真武七截陣 | **Keep** | Unchanged; badge 攻↑ in place of 振 | No | TK | — |
| 輕身 | Move up | 黃蓉 開生門, 胡斐 四象步, 阿青 白猿步 | **Keep** | Unchanged; badge 移↑ in place of 疾 | No | TK | — |
| 解厄 | Lifts ten ailments before healing | 12 hero arts, 1 manual, 1 item (九花玉露丸) | **Keep** | The list becomes nine: 「中毒、攻勢受挫、破防、絆足、破綻、截勁、亂氣、內傷與纏械」 | No (失神 leaves the list because no enemy lays it on a hero) | FR:7, 33–46; MA (九花玉露丸's text) | — |

## 7. Gear (器物): 3 today, 3 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 反刺 | An adjacent enemy who hits the wearer, by attack or counter, takes 7, defence ignored | 軟蝟甲 | **Merge into 反震**, the one word for damage returned to whoever struck. Its own rule and number stay | 「反震 · 相鄰的敵人打中佩者時，受 7 點傷害，不計防禦」 | No | RT:202–206, MA (the item's text), GJ `barbStrike` (log wording) | CM "items" block (wording) |
| 服藥 | Shared medicine; costs no move or action | 大還丹, 九花玉露丸, 玉蜂漿, 金創藥, 回氣丹 | **Keep** | Unchanged | No | — | — |
| 兵器效果 | A weapon adds an effect to basic attacks or support arts | 19 weapons | **Keep** | The effects left on weapons are 破綻 (leave or exploit), 絆足, 牽引, 渡氣, 穿行, 反震, 濺射, and three plain sentences | No | — | — |

**反震 as a name.** It is not a rule word today. The game already uses it as a verb in 挪移's sentence, in 慕容博's trait and in the battle log (「斗轉星移反震…」, 「借勁反震…」), always for damage going back to the striker, so the name fits and collides with nothing. 挪移 stays its own word because it also halves the blow.

## 8. Leader boons (領隊陣法): 3 today, 1 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 領隊陣法 | The leader's boon reaches himself and allies within two tiles; it ends when he falls | 21 boons | **Keep** | Unchanged | No | — | — |
| 越女試劍 | The first counter-drawing strike each round draws none | 阿青's boon | **Fold** (one boon). Its own line carries the whole rule | 「每回合頭一次會招來還擊的出手，敵人不能還擊；本來就不受還擊的出手不算。」 | No | RT:223–227, BM:113–119 | — |
| 雪谷回生 | Once a board, the first hero in range who would fall keeps 1 氣血 | 狄雲's boon | **Fold** (one boon) | 「陣法所及的俠客將要倒下時留住 1 點氣血，毒發也算；每局只救頭一個。」 | No | RT:228–232, BM:99–105 | — |

## 9. 戰鬥效果: 17 today, 6 after

| Word | Today | Carriers today | Proposal | Card or forecast afterwards | Number changes? | Files | Depends on it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 留隙 | A hit leaves 破綻 on the target for two rounds | 11 hero arts (five of them basic-attack upgrades); weapons 華山長劍, 大理摺扇, 利劍, 鐵骨折扇 | **Rename to 破綻** (the leaving side). One idea, one word: the condition is already called 破綻 | 「留下破綻 · 兩回合」. Glossary, one entry 破綻: 「有的招式命中後在敵人身上留下破綻，為時兩回合；有的招式乘破綻出手，首段威力 ＋9，敵人無法還擊，破綻隨之收去」 | No | FR:3, RT, FC, MA (weapon texts), TK | 合招 拂花遞劍; 桃花迷陣's list; 合招制敵 secondary |
| 收隙 | Against a target with 破綻: first hit +9, no counter, and the mark is spent | 11 hero arts, 無名 總訣式; weapon 青鋒劍 | **Rename to 破綻** (the exploiting side) | Card: 「乘破綻 · 首段 ＋9，敵人無法還擊」. Forecast: 「乘破綻 · 首段 ＋9，封住還擊」 | No | FR:4, 82–88; GJ:3036 | The 合招制敵 secondary already says 「乘破綻」 (`journey.js:1160`) |
| 絆足 | Target's move −2 this round and next | 10 hero arts, 1 manual; weapons 精鋼軟鞭, 錦紋軟鞭; 鳳天南's signature and 墜網 lay it | **Keep** | Unchanged; badge 移↓ in place of 縛 | No | TK | — |
| 封穴 | This round the target cannot counter or use its signature; basic attacks still allowed; a master resists a second in a row | 黃蓉 蘭花拂穴手, 令狐冲 破氣式, 程靈素 金針刺穴, 狄雲 耳光式; 無名 破氣式 | **Rename to 截勁.** **Departure** from merging into 閉穴: the merge would take a whole turn's strike from the target as well. 蘭花拂穴手 would not change (it lays 閉穴 already); the other three, and 無名's, would each gain a full enemy turn denied, on a 1-point art (耳光式) and on masters (破氣式, at 1.60 with half the defence ignored). That is far above what 閉穴 arts pay for it today (1.05 on 黃蓉's, 調息 on 趙敏's) | 「截勁 · 本回合敵人不能還擊，也不能施展絕技」; badge 截 in place of 穴 | No | FR:6, 114–116; BM:175; RT; EN (化功, 蓄勢反擊 and 慕容博 say 「封穴時無效」); GJ notes; PN:1090 | 打狗陣法's list; 解厄's list; CM (several blocks, wording) |
| 渡氣 | Each companion reached regains 6 內力 | 郭靖 合陣, 虛竹 渡氣; manual 一陽指; weapons 綠竹短簫, 大理摺扇 | **Keep** | Unchanged | No | — | 合招 一指續孤掌, 踏浪回陣 |
| 餘氣護身 | Healing beyond what is missing becomes a one-round shield, up to 12 | 張無忌 蝶谷醫術, 任盈盈 回春, 虛竹 化符; weapon 鐵骨折扇 | **Fold**: a source of 護盾 | 「溢出的療傷量化為一回合護盾，至多 12 點」 | No | FR:9, MA | 合招 一指續孤掌 |
| 借勁還手 | The recipient's first loss to an enemy's direct blow this round is returned, up to 9 | 任盈盈 琴簫引; weapons 布纏護手, 明教護腕 | **Merge into 反震.** Its own rule and number stay | 「反震 · 受術者本回合首次受敵方直接傷害時，震回所失氣血，最多 9 點」. The condition 借勁 on the piece becomes 反震; badge 反 in place of 返 | No | FR:10, BM:176, TK, GJ:2616–2628, 2930–2941 | 合招 踏浪回陣 |
| 牽引 | Draws the survivor one tile nearer | 向問天 長鞭破陣, 小龍女 金鈴索, 張無忌 聖火令武功, 胡斐 懷中抱月, 蕭峰 擒龍功, 張三丰 太極劍; weapons 青竹棒, 錦紋軟鞭 | **Keep**; 撞關 becomes part of its rule, with one clause added: a foe already beside the puller has nowhere to come, and that does not count as blocked | 「牽引 · 拉近一格；去路受阻則拉不動，首段威力 ＋7。目標已在身旁不算」. Forecast: 「牽引受阻 · 首段 ＋7」 | **Yes**: see 撞關 | FR:11, 67–77, 98–102; RT; MF | 合招 牽敵成列 |
| 穿行 | Along a row or column, 45% carries to the first foe within two tiles behind | 令狐冲 華山劍法・白虹貫日, 段譽 少商劍 and 六脈齊發, 楊過 玄鐵劍法・重劍無鋒, 阿青 竹枝穿陣 and 越女劍; weapon 星紋精鋼劍 | **Keep** | Unchanged | No | — | 合招 牽敵成列 |
| 走勁 | 32% jumps to the nearest other foe within two tiles | 黃藥師 彈石・連珠 (basic upgrade); weapons 古墓雙劍 (小龍女's), 雁翎刀 (shop), 金蛇劍 (袁承志's) | **Remove**; each gets **濺射 兩格 25%**. **The rules do not allow this as they stand**: a weapon or a basic attack can carry a 戰鬥效果 but not a 濺射 share (`secondaryTargets` reads the art's only), so it needs a small rule change. If that is not wanted, the nearest thing with no rule change is **Fold** | 「濺射 兩格 25%」 | **Yes**, one art and three weapons. Measured over 1,055 blows: 走勁 found a foe in 42%, so it is worth 0.32 × 0.42 = 13% of the blow. A four-neighbour 濺射 of that worth would be 64% (0.20 foes adjacent on average, from a second sample of 423 blows), which is not small; a two-tile one finds 0.55 foes, so 23%, rounded up to 25% | FR:140–150, GJ:2601, FC:214–234, GJ `ITEMS` (a `splash` on a weapon), RT (`濺射` gains an item carrier), MC | — |
| 催毒 | Detonates the target's remaining poison as up to +16 power; the poison ends | 任盈盈 日月短劍・藏鋒, 郭靖 左右互搏術, 小龍女 左右互搏術, 程靈素 細針・透穴; weapon 寒潭短劍 | **Fold** | 「引爆目標身上的餘毒，一次加上尚餘毒量，至多 16 點；舊毒消散」. Forecast: 「餘毒轉成 12 威力」 | No | FR:17, 89–93 | 合招 飛針催毒; 合招制敵 secondary |
| 夾擊 | +7 on the first hit, and the partner regains 4 內力, when a companion stands directly behind the foe | Weapons 布纏護手 (郭靖's), 胡家單刀 (胡斐's) | **Remove**; 攻擊 **+1** on each (布纏護手 3 to 4, 胡家單刀 6 to 7) | The line leaves the weapon's text | **Yes**, two weapons. It held in 1 of 34 and 4 of 60 basic attacks, worth under half a point of damage a blow; +1 攻擊 is already more, on arts as well | FC:214–234, FR:18, 103–111; GJ `ITEMS` | **合招 前掌後刀 is built on it** (FC:244) and must be rewritten or dropped; the 合招制敵 secondary counts it (`journey.js:1160`, GJ:3036) |
| 回生 | Heal self a quarter of the damage dealt, up to 9 | 向問天 捨身截騎, 狄雲 流星經天, 神照經 | **Merge into 吸元** at 25%, up to 9: the same arithmetic in the rules (GJ:2511–2529), so nothing changes for them | 「吸元 · 回復主目標損血的 25%，最多 9 氣血」 | No | FC, MC (a `drain` on each), FR:19, GJ:2511–2517 | — |
| 落步成陣 | On landing, self and adjacent companions get 8 shield this round | Manual 水上漂 | **Fold**: a source of 護盾 | 「落地時自己與相鄰同伴各得 8 點護盾，至本回合結束」 | No | FR:20 | 合招 踏浪回陣 |
| 定勢 | +5 on the first hit if the hero has not moved this round | 楊過 蛤蟆功 (starting), 虛竹 韋陀掌 (starting), 郭靖 南山掌法・穩樁, 段譽 商陽劍, 張無忌 太極拳・攬雀尾, 袁承志 混元掌・發勁; manual 冰魄銀針; weapons 玄鐵重劍 (楊過's), 屠龍刀 (shop) | **Remove**; a flat number on each: 蛤蟆功 1.32 to **1.35**; 韋陀掌 1.30 to **1.40**; 商陽劍 1.15 to **1.20**; 穩樁 +6 to **+8**; 攬雀尾 +8 to **+10**; 發勁 +6 to **+8**; 冰魄銀針 1.00 to **1.05**; 玄鐵重劍 and 屠龍刀 攻擊 **+1** | The line leaves each text | **Yes**, seven arts and two weapons. Set as 5 × the share of blows struck without moving, rounded to the nearest point of damage or 0.05 of a multiplier: 蛤蟆功 9% (6 of 65), 韋陀掌 33%, 商陽劍 20% (64 of 322), 穩樁 47%, 攬雀尾 43%, 發勁 30%; the manual and the weapons at the average of all, 25% | MC, GJ:1821–1842, FC, FR:21, 94–97; GJ `ITEMS`; CS | 屠龍刀's text (「揮動須站穩腳步」) reads as 定勢; it keeps its −1 move |
| 撞關 | +7 on the first hit when a push or a pull is blocked | 蕭峰 太祖長拳, 擒龍功, 亢龍有悔; 郭靖 亢龍有悔, 降龍十八掌; 小龍女 金鈴索; 段譽 關衝劍; 張無忌 移勁; 張三丰 雲手; 無名 破槍式 | **Merge into 擊退 and 牽引** as part of their rule. Every push art has it already. **Four pull arts and two weapons gain it: 向問天 長鞭破陣, 張無忌 聖火令武功, 胡斐 懷中抱月, 張三丰 太極劍, 青竹棒, 錦紋軟鞭: stronger.** With the clause under 牽引, 金鈴索 and 擒龍功 lose it against a foe already beside them: slightly weaker | See 擊退 and 牽引 | **Yes.** Share of uses blocked by ground or another piece, and the average gain: 太極劍 42%, +2.9 a blow (5%); 聖火令武功 41%, +2.9 (4%); 懷中抱月 45%, +3.2 (6%); 長鞭破陣 62%, +4.3 (14%); 青竹棒 44%, +3.1 (14%); 錦紋軟鞭 20%, +1.4 (4%). Losses: 金鈴索 −1.1 a blow (2%), 擒龍功 −0.5 (1%). Without the clause the whips would gain +7 on nearly every blow at arm's length (錦紋軟鞭 87% of blows) | FR:22, 67–77, 98–102; FC; RT | 合招 前掌後刀; `reports/P2.md:35` praised 「撞關 +7」 in the forecast, which stays as 「擊退受阻 · 首段 ＋7」 |
| 以毒解毒 | Hitting a poisoned foe cures the striker's own poison | Weapons 古墓雙劍 (小龍女's), 明教護腕 (張無忌's) | **Fold** | 「擊中已中毒的敵人時，解去自身的毒」 | No | FR:23 | — |

(連環, 回身, 吸勁 and 解厄 are also entries of `FORM_RULES`; they are counted and listed in sections 2 and 6.)

## 10. Enemy traits (敵方行事): 31 today, 26 after

The enemy page already half follows principle 2: it prints 「門人代受」 on a master whose men cover him and 「挪移」 for a mirror that is not a signature (GJ:1056–1061, 1110–1111).

**Renamed to a hero's word, or because of a collision**

| Word | Today | Carriers today | Proposal | Enemy page afterwards | Number changes? | Files | Is it the same rule? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 護駕 | Returns to its master each turn; beside him, takes the heroes' direct blows for him | 星宿弟子 (two entries); the masters beside 求敗 on the last board | **Rename to 代受** | 「代受 · 每回合先回到局主身旁；與他相鄰時替他承受俠客的直接攻擊」 | No | RT:250–255, GJ:1062–1070, 1087–1091 | The same function (`coverer`, GJ:800). Differences: a hero's lasts until his next turn and covers any adjacent companion; the enemy's is permanent and covers the master only, and comes with walking back to him |
| 刀陣 | The healthier of an adjacent pair of the same kind takes the blow for the other | 華山刀陣弟子 | **Rename to 代受** | 「代受 · 相鄰的同袍氣血較少時，替他承受俠客的直接攻擊」 | No | RT:311–316, GJ:1142 | Same function. Difference: only for its own kind, and only while it has more 氣血 |
| 獨行 | 攻擊 +8 (and half the stage) on blows and counters when no other enemy is adjacent | 黑木崖侍衛 | **Rename to 孤行** | 「孤行 · 身旁沒有其他敵人時，出手或還擊攻擊 ＋8。此刻孤行。」 | No | RT:342, GJ:1163–1170, 2579 | The same test, mirrored. Differences: the hero's adds to an art's multiplier; the enemy's adds 攻擊 and counts on counters too |
| 斬殘（敵） | 攻擊 +6 (and half the stage) against heroes at half 氣血 or less | 萬門劍徒 | **Rename to 斬殘**: one glossary entry for both sides | Unchanged (it already prints 斬殘) | No | RT:304 | Same test. The hero's adds to the multiplier; the enemy's adds 攻擊 |
| 借力 | While charged, the first direct blow misses entirely and half is returned | 慕容博 | **Rename to 挪移** (my addition under principle 2; the enemy page already prints 挪移 for this trait) | 「挪移 · 蓄勢時，第一次受到的直接攻擊全數不中，反震一半給出手者（截勁時無效）」 | No | RT:289–294, EN:779 | Same function (`redirectOf`, GJ:837). Differences: the hero's keeps half, returns half up to a cap, and still counters; his keeps nothing, has no cap, does not counter, and works only while charged |
| 護陣 | Each standing 星索樁 cuts damage to the master | 星索樁 | **Rename to 星索**: after 護勁 becomes 護盾, 護陣 and 護盾 would be one character apart for different rules, and 布陣 is a third | 「星索 · 每根立著的星索樁替局主抵擋 N% 傷害」. The forecast row 「星索護陣」 (PN:1312) becomes 「星索」 | No | RT:296–300, GJ:1113–1124, PN:1312 | — |

**Keep (on the enemy's page)**

| Word | Today | Carriers | Proposal | Note after the changes above |
| --- | --- | --- | --- | --- |
| 蓄勢 | Masters and lieutenants charge a signature over some rounds | 31 entries | Keep | Its sentence names 封穴 and 吸勁: it becomes 「截勁時無法施展；有的招式可使它延後」 |
| 坐鎮 | Holds a post; some leave it when approached or struck | 16 entries | Keep | — |
| 變招 | Changes behaviour at half 氣血 | 5 masters | Keep | One character from 破招 and 無招, but a different idea and never on the same card. Flagged, not changed |
| 遁走 | Retreats to herbs to heal | 血刀老祖 | Keep | — |
| 偏好 | A target preference | 12 entries | Keep | — |
| 化功 | A hero who hits him from adjacent loses 內力 | 丁春秋 | Keep | 「封穴時無效」 becomes 「截勁時無效」 |
| 盟令 | While alive, the other enemies' 攻擊 is up | 左冷禪 | Keep | — |
| 續命 | His signature heals a hurt companion | 閻基 | Keep | — |
| 蓄勢反擊 | While charged, anyone striking him in reach takes a full counter | 歐陽鋒 | Keep | Reads as part of 蓄勢, which it is. 「封穴除外」 becomes 「截勁除外」 |
| 游擊 | Steps away after striking | 岳不群 | Keep | It is the enemy's 回身 (the trait's field is `glide`). Flagged as a judgement call |
| 毒手 | Basic attack lays 中毒 | 白駝山蛇奴 (two entries) | Keep | — |
| 近身失準 | 攻擊 −6 or −8 against heroes close by | 五虎門棍徒, 趙王府弓手 | Keep | — |
| 盾牆 | −40% damage while standing on its post | 清營刀盾兵 | Keep | With 卸勁 gone from the heroes, this and 沉樁 are the only percentage cuts left |
| 分刺 | After each blow, a second at 80% on another hero in reach | 東方不敗 | Keep | — |
| 轉折 | Blows ignore terrain defence and 代受 | 李秋水 | Keep | — |
| 擒拿 | The signature drags its target beside him | 洪安通 | Keep | It is a 牽引 of more than one tile. Flagged |
| 水上飄 | Every tile costs one step | 裘千仞 | Keep | The manual 《水上漂》 is one character away and does something else. Flagged |
| 陰陽倒亂 | Odd rounds 攻擊 +7; even rounds reach +1 | 公孫止 | Keep | — |
| 夾衛 | 攻擊 +8 when another enemy is beside its target | 西夏宮禁衛 | Keep | 夾擊 goes, so nothing collides |
| 步裡藏毒 | Basic attack lays 中毒 after it has walked | 神龍教青龍門眾 | Keep | — |
| 沉樁 | −50% damage at half 氣血 or less | 鐵掌幫拳手 | Keep | — |
| 墜網 | Basic attack lays 絆足 | 絕情谷網手 | Keep | — |
| 不敗 | Never below 1 氣血 | 求敗 | Keep | — |
| 無招 | No 破招 works on him | 求敗 | Keep | Defined by 破招, so the likeness is wanted |
| 退守 | Falls back behind his men when low | 求敗 | Keep | — |

## 11. Battle and run (戰局): 12 today, 12 after

| Word | Today | Where | Proposal |
| --- | --- | --- | --- |
| 斬將 | Fell the master, or both masters | 10 boards | **Keep** |
| 殲滅 | Fell every enemy, reinforcements included | 2 boards | **Keep** |
| 守 | An object must stand to a set round, or the master fall | 2 boards | **Keep** |
| 破 | Break every object | 1 board | **Keep** |
| 問劍 | Bring 求敗 to 1 氣血 | The last board | **Keep** |
| 敗退 | The leader falls, or round twelve ends | Every board | **Keep** |
| 援軍 | Reinforcements, announced one round ahead | 11 boards and the last | **Keep** |
| 軍情 | The briefing page | Every board | **Keep** |
| 起陣 | Swapping starting tiles before round one | Every board | **Keep** |
| 支線 | One secondary drawn per board | 15 boards | **Keep**. One kind needs new wording: 合招制敵 (「引爆餘毒或乘破綻的一擊」, 夾擊 gone) |
| 入局 | A new hero is lent after each win | Every board but the last | **Keep** |
| 敵方範圍 | The danger-zone overlay | Every board | **Keep** |

None of these changes a number or a file, except the secondary's sentence (`journey.js:1160`).

## 12. Badges

Today 21 conditions and the formation have a sign in `tokens.js:221–244`; seven more show the first character of their name (`tokens.js:366–369`). After: every condition has a sign of its own, taken from its name, and the six plain changes to a number show the number and an arrow.

| Condition (name after the proposal) | Badge today | Badge proposed | Why |
| --- | --- | --- | --- |
| 中毒 | 毒 | 毒 | — |
| 攻勢受挫 | 弱 | **攻↓** | 攻擊 down |
| 破防 | 破 | **防↓** | 防禦 down; 破 alone could be 破招, 破綻 or the board kind |
| 振奮 | 振 | **攻↑** | 攻擊 up |
| 固守 (now also the four 卸勁 arts) | 固 | **防↑** | 防禦 up |
| 輕身 | 疾 | **移↑** | 移動 up |
| 絆足 | 縛 | **移↓** | 移動 down |
| 護盾 (was 護勁) | 護 | 護 | — |
| 破綻 | 隙 | **綻** | From its own name; 破 is avoided for the reason above |
| 截勁 (was 封穴) | 穴 | **截** | 穴 would point at 閉穴 |
| 反震 (was 借勁) | 返 | **反** | From its own name |
| 卸勁 | 卸 | gone | Merged into 固守 |
| 失神 | 失 (first character) | gone | Merged into 定身 |
| 代受 | 代 | 代 | — |
| 挑釁 | 挑 | 挑 | — |
| 閃身 | 閃 | 閃 | — |
| 挪移 | 挪 | 挪 | — |
| 露空 | 露 (first character) | 露 | Made explicit. It is 防禦 down too, but as a price that 解厄 does not lift; it keeps its own sign so no two conditions share one |
| 無守 | 無 (first character) | 無 | Made explicit |
| 立樁 | 立 (first character) | 立 | Made explicit |
| 曲終 | 曲 (first character) | 曲 | Made explicit |
| 亂氣 | 亂 (first character) | 亂, with the layer count | Made explicit |
| 內傷 | 傷 | 傷 | — |
| 纏械 | 纏 (first character) | 纏 | Made explicit |
| 金剛 | 金 | 金 | — |
| 定身 | 定 | 定 | — |
| 閉穴 | 閉 | 閉 | — |
| 受制 | 倒 | **制** | From its own name |
| 布陣 (a piece standing in one) | 陣 | 陣 | — |

Files: TK:221–244 (the signs), TK:340–372 (the badge is one character in a square of 10 to 15 px; a number with an arrow needs either a wider badge or the character with a small ▲ or ▼ drawn in its corner, which I would prefer), BM:166–195 (the names), `tools/check-wiki.mjs:90`. The wiki's badge page reads the same table.

## The order I would do it in

Each step leaves the game working and all four checks passing (`check-wiki`, `check-story`, `check-mechanics`, `check-skills`), with `python3 tools/extra-fonts.py --check` after any new text. Before step 1, save a baseline: `node tools/sim-battles.mjs --runs 200 --seed 1 --arts --json before.json`.

| Step | What | Rows | What must hold afterwards |
| --- | --- | --- | --- |
| 1 | **Names and badges only.** No rule and no number changes | 護勁 to 護盾; 封穴 to 截勁; 反噬 to 亂氣; 借勁還手 and 反刺 to 反震; 留隙 and 收隙 to 破綻; 廣及 written as 濺射 with reach; 回生 as 吸元 25% up to 9; the six enemy renames; the badge table | `sim-battles --compare before.json after.json` shows **no difference at all**, to the last figure: the same seed gives the same games. `check-skills --report` prints the same numbers. `check-mechanics` fails only where a check quotes an old name, and those are updated in the same commit |
| 2 | **Folds.** Glossary terms removed, the card's sentence written | 回氣, 號令, 轉護, 傾力, 後發, 吸勁, 越女試劍, 雪谷回生, 餘氣護身, 落步成陣, 催毒, 以毒解毒; each folded field added to `PLAIN_FIELDS` | The same as step 1: no difference in the simulator, the same `check-skills` numbers |
| 3 | **Conditional power.** | 合璧 off three arts; 小龍女's bases and 左右互搏; 還報 off 神龍擺尾; the 黯然 step | `check-skills`: 0 failures, no new warning. `sim-battles`, 200 runs against the baseline: no board moves more than 5 points; damage per board of 虛竹, 趙敏, 程靈素, 小龍女, 洪七公 and 楊過 within 5% of before; with `--arts`, the six changed arts are still equipped and used at least as often. The design documents (`單輪劇本.md:343`, `世界觀設定.md:29`) carry the decision |
| 4 | **戰鬥效果 that go.** | 定勢 and 夾擊 removed with their flat numbers; 撞關 into 擊退 and 牽引 with the clause; 走勁 to 濺射 兩格 25% (with the small rule change), or folded | `check-skills`: 0 failures. Simulator: no board moves more than 5 points; damage per board of 楊過, 虛竹, 段譽, 郭靖, 張無忌, 袁承志, 胡斐, 黃藥師, 向問天 and 張三丰 within 5%, except that 向問天's may rise by the 14% measured for 長鞭破陣. 合招 前掌後刀 and the 合招制敵 secondary are rewritten; the secondary's rate on 蘆花汀 is read from the per-map table |
| 5 | **Holds, guards and tempo**, one commit each: (a) 失神 into 定身; (b) 卸勁 into 固守; (c) 留力 into 調息 | Those three rows | (a) `check-skills` 0 failures; simulator: 無刻漏臺 and 黑木繡閣 within 5 points (held masters matter most there); a save made mid-fight with a 失神 on a piece still loads and the piece still loses its turn. (b) 向問天's and 張三丰's damage taken per board within 10% of before, and their boards as leader not lost more often (the `L:ldr` column). (c) the new 降龍十八掌 warning is either accepted or removed by 調息 兩回合 or a multiplier of 2.40; 郭靖's damage within 10% |

After the last step: the wiki's comparison still has no two heroes within five points on all six aspects (ROADMAP 0.24), read from the 俠客對照 page's data; and a last whole run of the simulator at 200 runs in the first and the fifth 境界 (`--realm 5 --boards 1-11`).

## Judgement calls the producer may want to decide differently

1. **封穴 is renamed, not merged into 閉穴** (departure). The merge would hand three arts and one of 無名's a whole enemy turn denied.
2. **挑釁 is kept, not folded** (departure), and **反噬 is renamed to 亂氣, not folded** (departure). Both leave a state with a badge on a piece. If the badge exception is meant only for states laid on an enemy, both fold.
3. **留力 into 調息 makes 降龍十八掌 stronger** and loses the tie to 「力留三分」 in 郭靖's line. Folding it instead (「上一回合未曾出手方可施展」 on the card, no glossary word) would change no number.
4. **卸勁 into 固守 takes the full counter from 向問天 and 張三丰.** The +10 and +7 are set by `check-skills`' prices; a lower figure (+8, +5) trades protection early for less late.
5. **The 黯然 step**: three quarters and +0.45, or six tenths and +0.70, or half and +0.60 (weaker but the same words as 斬殘). The averages come from a simulated player; a person will sit just under the line on purpose, so the art will be a little stronger in real hands than the average says.
6. **合璧 keeps two shapes**: any companion and the partner on 楊過's 全真劍法, the partner only on 小龍女's. Making 楊過's partner-only as well (base 1.35, 小龍女 +0.30) would give the word one rule and end the pull between his tier-1 art, which wants a companion, and his later ones, which want none.
7. **倚天劍 at 1.40** where the formula gives 1.35, on nine uses.
8. **走勁** needs a small rule change to become a 濺射 on a weapon. Folding it changes nothing and costs nothing.
9. **撞關 on pulls**: four arts and two whips get stronger. The alternative that changes no number is to make it part of 擊退 only, and leave a plain sentence on 金鈴索 and 擒龍功.
10. **The clause "already beside you does not count"** is mine. It removes a free +7 on whip blows at arm's length, at a small cost to 金鈴索 and 擒龍功.
11. **借力 to 挪移** and **護陣 to 星索** are my additions; they were not in the rulings the draft was given.
12. **The three one-way pairs** (趙敏 with 張無忌, 程靈素 with 胡斐, 虛竹 with 蕭峰) were added on purpose and are written into both design documents. Removing them reverses that.
13. **The enemy words stay counted.** If single-enemy words are descriptions and not words to learn, the totals read 123 and 74.
14. **Number badges**: 攻↓ and the like are two glyphs in a badge drawn for one. A character with a small arrow in the corner is my preference.

## Not proposed, and why

| Considered | Why not |
| --- | --- |
| 封穴 into 閉穴 | Too strong for its carriers; see section 9 |
| 無守 into 露空 | Different in kind; no way to show it changes little; see section 3 |
| 內傷 into 中毒 | Cannot be made cost-neutral; 李莫愁's board depends on halved healing |
| 曲終 into 調息 | Stronger for both carriers, most of all 任盈盈 |
| 露空 into 破防, 立樁 into 絆足 | They are prices: 解厄 must not lift them, and 立樁 stops all movement where 絆足 takes 2 |
| 纏械 into 攻勢受挫 | 纏械 also holds reach to 1, which is what 黃蓉's 絆字訣 and 無名's 破索式 are built on |
| 壓箱 into 調息 | Once a board is a different promise from "wait a while", and four carriers rely on it |
| 連環 and 號令 as one "extra action" word | One is earned by a kill, the other given to a companion; 號令 is folded anyway |
| Removing 穿行 | Six arts and a weapon, and it reads on the board as what it is |
| Renaming the 身 words (回身, 閃身, 輕身, 定身) or the 招 words (破招, 變招, 無招) | One character apart, but different ideas that never meet on one card. Principle 3 is applied where the meanings are also close (封穴 and 閉穴; 護勁, 護駕 and 護陣; 借力 and 借勁) |
| Renaming 游擊 to 回身, 擒拿 to 牽引, 水上飄 | They sit on one enemy's page each; flagged in section 10 |
| Folding the single-enemy words out of the glossary | The draft's ruling was to leave them on the enemy's page; the wiki's pages for them cost the player nothing |
| Changing internal field names to match | It would need a migration of saved games for no gain to the player |
| Cutting conditional power as a whole | `inventory.md`: it is absent from the first battle, explained where it appears, and carries five heroes' identities |

## Could not be settled here

- **Whether the proposed numbers hold up in real hands.** Every share used to set a flat number is the simulated player's. It reads the forecast perfectly, equips arts by their plain strength and never buys a manual, so 冰魄銀針 and 彈指神通 (the manual) rest on the average of other carriers.
- **The parts not tried in the trial run**: the 黯然 step, 走勁 as a 濺射, the changes to the four starting arts (蛤蟆功, 韋陀掌, 吸功入地小法, 羅漢拳), 絆字訣's and 生死符's 失神, and the "already beside you" clause. They need the rule changes of steps 3 to 5 before they can be measured.
- **無名's arts** are not in the simulator's runs. None of his numbers change, but three of his cards change wording (總訣式, 破槍式, 破氣式).
- **How a number badge looks at 10 px** on a phone. It was not drawn.
