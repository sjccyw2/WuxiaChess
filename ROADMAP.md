# WuxiaChess Roadmap

> Started 2026-11-20. Owner: the producer (repository owner). Maintained by every agent that works here.
> The design documents stay the source of truth for story and rules: `wiki/content/世界觀設定.md` (world view, v0.7) and `wiki/content/單輪劇本.md` (single-run script, v0.4). This file tracks **what to build next, in what order, and what is waiting on the producer**.

## How to use this file

- **Agents: read this file before starting work**, and update it in the same commit as your work: tick items, add items you discover, and record decisions.
- **Questions for the producer go in [Open questions](#open-questions).** Ask in the session first. If the producer has not answered by the time you finish, add the question there (next free ID, your workstream, the options and your recommendation) instead of leaving it only in chat, a PR body or a design document. Build on your recommended default only where the work can be undone easily, and say so in the entry.
- When the producer answers, move the entry to [Decisions](#decisions), and carry the answer into the design document it affects.
- Do not remove a question because you think it is resolved. Only the producer resolves questions.

## Where the game stands

- **Playable:** prologue (the youth opens his eyes, names himself), ten boards in shuffled order, ten heroes (令狐冲, 任盈盈, 向問天, 郭靖, 黃蓉, 小龍女, 楊過, 段譽, 張無忌, 胡斐), twenty adversaries (a master and a lieutenant per board), 韋小寶's shop and dice cups, the marked stone, night talk, endings. Only Volume 1 (〈英雄帖〉) of the five-volume arc exists.
- **Story is three layers that never refer to each other** (spine, boards, heroes; see README). Any new text must keep that rule, and `node tools/check-story.mjs` must pass.
- **Same-book lines exist in one form only:** a hero from the same series as a board's master gets one line on that board (23 lines, `ENCOUNTER_SCRIPT[].heroLines`, matched by `sameSeries` in `game/src/data/hero-voices.js`). Hero-to-hero lines do not exist yet.
- **Heroes start with an early art and climb to the famous one.** Each of the ten has a class that the player is not shown, a starting art in the 根基 row, and a tree that ends in the art they are known for, which carries a price. Thirty-odd effects were added for this (see workstream 0). `node tools/check-skills.mjs` holds the trees to those rules and `node tools/check-mechanics.mjs` holds the rules engine to its specification.
- **The battle screen has no command bar.** Selecting a hero shows where they can go; the arts list opens beside the hero after a move; End turn stands alone. The whole presentation layer can be switched off piece by piece in `game/src/polish.js` (`game/?classic` shows the original).
- **New art has arrived but is not in the game:** `asset-gen/jianying-roster-art/` holds 30 portraits and sprite sheets: 10 heroes, 10 villains (marked 副將, lieutenant) and the 10 troop types that follow them. Each villain's troop link is in `manifest.json`.

---

## 0. Skill trees, enemy behaviour and the battle screen

Goal: no hero starts with their strongest art; every art has a job; heroes and adversaries each play differently; the battle reads and feels like a console tactics game.

- [x] **0.1 Presentation pass.** Board pieces, combat impact, lighting and water, panels, loading, each behind a switch in `game/src/polish.js` (README, "Presentation switches").
- [x] **0.2 Controls.** Danger zone (button and `D`), `Tab` to the next hero, the strike forecast docked beside the fighters, and the action flow that replaced the four-button bar (keys `1`–`4` pick an art, `Esc` takes back a move, heroes who have not struck brace when the turn ends).
- [x] **0.3 The ten trees and the eight manuals** rebuilt to the redesign's rules: the starting art is the root, everything downstream is an upgrade or a new job, lineage follows the books, the famous art is the summit and has a price, no two nodes do the same job, each hero has a class. Saves from before the redesign get every old tree node refunded once.
- [x] **0.4 Hero-side mechanics.** Tempo (連環, 回身, 號令, 留力, 壓箱, 調息), prices (曲終, 立樁, 露空, 無守, 反噬, 轉護), conditional power (破招, 孤行, 合璧, 黯然, 還報, 斬殘, 傾力), conditions (吸勁, 內傷, 失神, 纏械), and reactions (卸勁, 代受, 挑釁, 閃身, 挪移, 布陣, 後發).
- [ ] **0.5 Adversary behaviour.** Each master and lieutenant gets a class: holding a post, changing at half health, preferring certain targets, 丁春秋's disciples taking blows for him, 閻基 mending his master, 血刀老祖 retreating to the herbs, and per-board rank and file. In progress.
- [x] **0.6 Clean-up after the redesign.** `check-skills` now measures each art as the game resolves it (conditional power in its plain and favourable cases, effects and tempo as capabilities, prices as prices) and exits zero with six warnings that are matters of judgement; the help page explains the new rules; 向問天's taunt radius is outlined while it is aimed; the arts list tags the 破X式 that answers the enemy under the pointer; the hero panel shows 留力 and 還報 when they are live. Not covered: the 破招 tag on touch screens, which have no pointer to hover with (the forecast's 破招 note does that job there).
- [ ] **0.7 Play it on real devices.** Everything in this workstream was verified in a headless desktop browser with software rendering, at desktop and phone sizes. Nothing has been run on a real GPU, a real phone, Safari or Firefox; frame rate, the feel of hit-stop and screen shake, and the loading veil's timing are unverified.
- [ ] **0.8 Difficulty.** Deliberately not tuned (decision of 2026-11-20). `node tools/sim-battles.mjs` is the measuring stick when the time comes; its player wins almost every board today.

Checks: `node tools/check-skills.mjs`, `node tools/check-mechanics.mjs`, `node tools/sim-battles.mjs`.

## 1. Story refinement

Goal: each board, each hero and the run as a whole carry a story of their own, not only the shared premise that a force compels the masters to fight.

- [ ] **1.1 A story for each board.** Today all ten boards share one premise (run script §4.3, §7). Write, per board: why this master was chosen, which hero they have history with, and whether the side objective has its own reason. Waiting on Q-R8.
- [ ] **1.2 Volumes 2 to 5.** Only Volume 1 exists. Design how each volume unlocks and what it reveals (world view §8): 〈一念〉 after the first full run, 〈劍解〉 when 楊過 or 令狐冲 reaches the master, 〈無名〉, 〈求敗〉. The night talk and the endings should change with the volume.
- [ ] **1.3 Each hero's 心結 quest and 了緣 condition** (world view §9 item 4). Today any side objective plus a win brings the next hero. Waiting on Q-W4.
- [ ] **1.4 The 階盡 scene** (the meeting with the one who set the boards, after the tenth board). Text-only today. Waiting on Q-R7; this merges into the finale (2.4).
- [ ] **1.5 Review existing text against the producer's answers** to Q-R2, Q-R3, Q-R4 and Q-R5 once they come in.
- [ ] **1.6 Bring the design documents to new versions** (world view v0.8, run script v0.5) as decisions land, and keep §0 of each in step.
- [ ] **1.7 Bring the text in line with the skill and enemy-behaviour redesign.** Heroes now start with an early art and climb to the famous one, and each adversary has its own behaviour. The shared reason is decided and shown above every tree (`RECALL_NOTE` in `game/src/data/mastery-catalog.js`); the prose around it is not yet rewritten: the eight hero bios that say the famous art is already held (`DETAILS` in `game/src/rules/game.js`, `game/src/data/new-heroes.js`), the ten tree origin paragraphs (`HERO_PATHS[].origin`, 「入境時…」), and the entry-moment table (run script §6). On the adversary side 霍都 and 寶象 now hold their posts as the story says, so their lines stand; 閻基 now mends his master and his bio has no hint of bone-setting; 歐陽克's snakes become foot soldiers. The producer will have this prose written with a story agent.

Checks: `node tools/check-story.mjs`, `node tools/check-wiki.mjs`, `python3 tools/extra-fonts.py --check` for new characters.

## 2. The eleventh board, the youth's sprite sheet and the grand finale

Goal: the final board of the full arc (world view §8.3, §8.4). The youth steps onto the board himself as the sixth piece, breaking the five-seat limit. The moment the rule breaks is the sword immortal's defeat.

- [ ] **2.1 Design the eleventh board.** Setting, terrain, size, objective and opponents. Waiting on Q-N1, Q-N2.
- [ ] **2.2 Build the map.** A `terrain.js` entry, a landform module in `game/src/scene/landforms/` in the style of the reworked ten, ambience and sound, and a wiki picture taken with `tools/shoot-map.mjs` (`--bare --only opening --size 1560x992`, halved).
- [ ] **2.3 The youth's sprite sheet.** He has a portrait (`npc-youth.webp`) but no board piece. A sheet in the game's format: 8 frames per row, 144 × 176 cells, foot at y 162. Today the game reads 4 rows (idle, walk, attack, hurt); the new art pack adds a 5th row (絕技, special). Decide whether the game reads the 5th row (see 3.6). Needs a prompt in `asset-gen/prompts.md` if the producer will paint it. Waiting on Q-N3.
- [ ] **2.4 The finale rules.**
  - The sixth seat: the youth placed as a piece that can be lost.
  - His skill tree is 獨孤九劍: 總訣式, 破劍式, 破刀式, 破槍式, 破鞭式, 破索式, 破掌式, 破箭式, 破氣式. Each form is unlocked across runs (for example 破劍式 after enough sword-using foes defeated). Needs a cross-run counter in the save, and must pass `node tools/check-skills.mjs`. 令狐冲's tree now holds 總訣式, 破劍式, 破箭式, 破氣式 and 獨孤九劍; the overlap is accepted (decision of 2026-11-20): the youth keeps all nine, and his forms may differ in effect.
  - The three things the immortal lacks decide the fight: companions (情), the dice (運, 韋小寶), and the youth's resolve not to forget.
  - Endings: 歸去 (the true ending) and 留下 (endless mode).
- [ ] **2.5 Gating.** In the full arc the eleventh board opens in Volume 5. Waiting on Q-N4, which decides whether it can be built and tested before Volumes 2 to 4 exist.
- [ ] **2.6 Places that assume ten boards.** The wiki's 十局輿圖 section and its ten map pictures, the save format, the board shuffle, the 0–9 asset names (`captain-N`, `lieutenant-N`), the battle simulator's `--boards` range, and the README all assume ten. Change each one as the board is added.

## 3. More heroes and enemies

Goal: bring the uploaded roster into the game, and grow the pool so runs vary more.

From `asset-gen/jianying-roster-art/`:

| Heroes (book) | Villains, troop type (book) |
| --- | --- |
| 蕭峰, 虛竹 (天龍八部) | 鳳天南, 五虎門棍徒 (飛狐外傳) |
| 洪七公, 黃藥師 (射鵰英雄傳) | 張召重, 清營刀盾兵 (書劍恩仇錄) |
| 張三丰, 趙敏 (倚天屠龍記) | 李秋水, 西夏宮禁衛 (天龍八部) |
| 程靈素 (飛狐外傳) | 洪安通, 神龍教青龍門眾 (鹿鼎記) |
| 狄雲 (連城訣) | 東方不敗, 黑木崖侍衛 (笑傲江湖) |
| 袁承志 (碧血劍) | 裘千仞, 鐵掌幫拳手 (射鵰英雄傳) |
| 阿青 (越女劍) | 完顏洪烈, 趙王府弓手 (射鵰英雄傳) |
| | 公孫止, 絕情谷網手 (神鵰俠侶) |
| | 鮮于通, 華山刀陣弟子 (倚天屠龍記) |
| | 萬震山, 萬門劍徒 (連城訣) |

- [ ] **3.1 Decide how the new villains enter.** The pack marks all ten as lieutenants with their own troops, and several of their descriptions name a place (驛站, 汀, 漏臺) that matches an existing board. Waiting on Q-N5.
- [ ] **3.2 Review the pack's text against the current world view.** Some bios still use the old ferry framing (蕭峰's mentions 渡口兩岸). Every bio must fit v0.7: invited heroes, black stones compelled by the force. No names that reveal the board-setter before Volume 3.
- [ ] **3.3 Add each new hero.** For each: a data entry like `game/src/data/new-heroes.js`, a skill tree in `mastery-catalog.js` that passes `check-skills.mjs`, the five voice entries in `hero-voices.js` (arrival, obey, echoes, night, farewell), an arrival moment from their book (run script §6 table; waiting on Q-W3 for who and when), portrait, mini and sprite sheet in `game/assets/`, and fonts regenerated.
- [ ] **3.4 Add each new villain and troop type** according to the answer to Q-N5: combat data, AI style, art, and a board script entry.
- [ ] **3.5 Balance.** Run `node tools/sim-battles.mjs --runs 200 --seed 1` before and after, and `--compare` the two. Flag boards whose win rate moves by more than ten points.
- [ ] **3.6 Sprite format.** The new sheets are 1152 × 880 (8 × 5 cells of 144 × 176); the game expects 8 × 4. Either teach `game/src/actors/sprite-sheets.js` to read the 5th row and play it for 絕技, or crop it. Recommendation: read it. The special pose then also serves the existing rank 3 and 4 cut-ins.
- [ ] **3.7 Later candidates** (world view §9 items 3, 5 and 8): 周伯通 as a hero (run script §11 keeps him for this), villains who can be turned and recruited (鳩摩智, 裘千仞), characters by other authors. Waiting on Q-W5, Q-W8.
- [ ] **3.8 Wiki.** 群俠列傳, 群敵錄 and the corpus read game data, so they follow once the data is in. Run `check-wiki.mjs`.

## 4. Connections: dialogue when characters from the same book meet

Goal: when two characters with a history in the same book meet in a run, hero and hero or hero and villain, they speak to each other. These lines are collectible and are the main way the world reveals itself (world view §8.2 跨代對話).

Design, keeping the layer rule:

- [ ] **4.1 A fourth story layer: pairs.** A new file, for example `game/src/data/bonds.js`, keyed by an unordered pair of character IDs. Each entry gives the relationship (師徒, 夫妻, 情人, 結義, 父女, 同門, 宿敵, 仇人, 跨代) and lines for one or more moments. A pair's lines may refer only to the two characters in it. They may never name a board, a position in the run, or a third character, so any shuffle still reads.
- [ ] **4.2 Moments where a pair can speak:**
  - hero and hero: when the second joins the party (arrival), at the night talk, at the farewell, and in battle when one is downed beside the other (optional);
  - hero and villain: at the board's opening when the villain is its master or lieutenant (this replaces today's same-book line for that hero), and when one defeats the other;
  - later runs: a deja vu variant (run script §8.1 already reserves 「面善」 lines between heroes for this).
- [ ] **4.3 Fallback.** If no pair line exists, today's same-series line plays. Same-series lines stay as the general case; pair lines are the specific case.
- [ ] **4.4 Saved and collected.** Record which pair lines the player has heard, and show them in the wiki's 局中紀事 and in an in-game collection if the producer wants one. Waiting on Q-N6.
- [ ] **4.5 Extend `check-story.mjs`.** Every pair entry names two real characters; no pair line names a board or a third person; every scene that can hold a pair line still has a speaker and text for every line.
- [ ] **4.6 Write the first set.** Starting list, to be checked against the books before writing:

  | Pair | Relationship |
  | --- | --- |
  | 令狐冲 – 任盈盈 | lovers; she is carrying a dying 令狐冲 when she is called (run script §6) |
  | 令狐冲 – 向問天 | sworn friends |
  | 郭靖 – 黃蓉 | husband and wife |
  | 楊過 – 小龍女 | the same cliff sixteen years apart (run script §6; marked as the key scene) |
  | 郭靖 / 黃蓉 – 楊過 | guardians and the boy they raised |
  | 黃蓉 – 黃藥師 * | father and daughter |
  | 郭靖 / 黃蓉 – 洪七公 * | master and disciples |
  | 張無忌 – 張三丰 * | his father's master, the 武當 founder |
  | 張無忌 – 趙敏 * | lovers |
  | 胡斐 – 程靈素 * | sworn siblings; she loves him |
  | 段譽 – 蕭峰 * – 虛竹 * | sworn brothers |
  | 楊過 – 令狐冲 | both heirs of the sword immortal's art (world view §8.2; only after Volume 3) |
  | 張三丰 * – 郭襄 | cross-generation (郭襄 is not in the roster) |
  | 胡斐 – 鳳天南 * | his sworn enemy (胡斐's bio already mentions him) |
  | 胡斐 – 田歸農 | enemy of his father |
  | 郭靖 – 完顏洪烈 *, 歐陽鋒 | the man behind his father's death; a long-time foe |
  | 黃蓉 – 裘千仞 * | the 鐵掌 that nearly killed her |
  | 楊過 / 小龍女 – 公孫止 *, 李莫愁 | the master of 絕情谷; 小龍女's elder fellow disciple, who hunted them both |
  | 令狐冲 / 任盈盈 / 向問天 – 東方不敗 *, 岳不群, 左冷禪 | 笑傲江湖's main enmities |
  | 張無忌 – 鮮于通 * | the 華山 head he exposed |
  | 狄雲 * – 萬震山 *, 血刀老祖 | his master's brother and his betrayer; the man whose blade he carries |
  | 蕭峰 * – 慕容博 | the man behind the ambush that killed his mother |
  | 虛竹 * – 李秋水 *, 丁春秋 | 逍遙派 elders and a traitor |
  | 韋小寶 (NPC) – 洪安通 * | his old cult master; a shop-side line |

  \* not yet in the game; the line waits on 3.3 or 3.4.

## 5. Open questions

All questions waiting on the producer. IDs are stable; do not renumber. Prefix: **W** from the world view §9, **R** from the run script §13, **N** new from this roadmap or later work.

| ID | Area | Question | Options and recommendation | Source | Asked |
| --- | --- | --- | --- | --- | --- |
| Q-W1 | Story | The game's title. | 《一念江湖》 (in use as a working subtitle), 《求敗》, 《劍解》. Also the run script's §13 item 9. | world view §9.1, run script §13.9 | 2026-11-20 |
| Q-W2 | Story | Which villain, scene from the book and hero history belongs to each board. | Today all ten share one premise. Recommendation: write one board at a time, pairing each with the pair lines in workstream 4. Same as Q-R8. | world view §9.2 | 2026-11-20 |
| Q-W3 | Heroes | The final hero list, the moment each is called from, and whether one character can come in two versions (young 郭靖 and 郭靖 of Xiangyang). | Ten moments are written (run script §6). The ten new heroes need theirs. | world view §9.3 | 2026-11-20 |
| Q-W4 | Story | Each hero's 心結 quest and 了緣 condition. | Today any side objective plus a win brings the next hero. | world view §9.4 | 2026-11-20 |
| Q-W5 | Enemies | Can villains be reconciled and recruited (鳩摩智, 裘千仞 repent in the books)? | Recommendation: yes, as a later reward, after the base roster is in. | world view §9.5 | 2026-11-20 |
| Q-W6 | Story | How 韋小寶 entered the realm. | Left blank on purpose; could be a side mystery. | world view §9.6 | 2026-11-20 |
| Q-W7 | Rules | Which rule each of the five 劍塚 difficulty tiers (利劍, 軟劍, 重劍, 木劍, 無劍) changes. | Not designed. | world view §9.7 | 2026-11-20 |
| Q-W8 | Heroes | Characters by authors other than 金庸 (古龍, 梁羽生) as "another board". | Not started. Note the licensing reminder in world view §10. | world view §9.8 | 2026-11-20 |
| Q-R1 | Story | 桑婆婆 and 周伯通 have left the game; their roles went to the youth, 韋小寶 and the stone. Keep either? | Recommendation: 周伯通 returns later as a hero (3.7). | run script §13.1 | 2026-11-20 |
| Q-R2 | Story | Are the five closing-eyes fragments right (a dog, his mother cooking, his name being called, a cock crowing, a hand held)? Add or remove any? | | run script §13.2 | 2026-11-20 |
| Q-R3 | Story | Why the youth has no name: the board-setter forgot his own; the youth says the same name every run. Accept? | | run script §13.3 | 2026-11-20 |
| Q-R4 | Story | The ten heroes' arrival moments, especially 楊過 and 小龍女 at the same cliff sixteen years apart, and 胡斐's raised blade. | | run script §13.4 | 2026-11-20 |
| Q-R5 | Maps | Place names (青竹渡, 無刻漏臺 and others) carry the old world view. Rename? Renaming means changing scenery too. | | run script §13.5 | 2026-11-20 |
| Q-R6 | Rules | Should deja vu carry a numeric benefit, for example cheaper relearning for a hero who has travelled with the youth before? | None today. | run script §13.6 | 2026-11-20 |
| Q-R7 | Finale | The 階盡 move: keep it as text, or make it a playable fight that cannot be won? | Recommendation: playable and unwinnable before Volume 5, then the real eleventh board. It ties into Q-N1. | run script §13.7 | 2026-11-20 |
| Q-R8 | Story | Each board's own story (why its master was chosen, which hero they have history with, whether the side objective has a reason). | Same as Q-W2. | run script §13.8 | 2026-11-20 |
| Q-N1 | Finale | Where is the eleventh board, and who is on the far side? The design says the immortal is only ever seen from behind, with no face. On a board he would be a piece. | (a) 劍塚 or the valley stone table, the immortal as the master, drawn only from behind; (b) the master is an echo made from the ten masters; (c) no master: the board itself is the opponent and the win is placing the sixth piece. Recommendation: (a). | this roadmap, 2.1 | 2026-11-20 |
| Q-N2 | Finale | How the eleventh board is won: defeat the master, survive, or something tied to 情, 運 and resolve (a 韋小寶 dice event, every companion alive)? | Recommendation: the youth must take the field and the party must hold until his turn; the dice and companions shape the last round. | this roadmap, 2.4 | 2026-11-20 |
| Q-N3 | Art | Will you paint the youth's sprite sheet as you did the roster pack, or should an agent write a prompt in `asset-gen/prompts.md`? | Recommendation: an agent writes the prompt in the pack's 8 × 5 format; you paint it. | this roadmap, 2.3 | 2026-11-20 |
| Q-N4 | Finale | Can the eleventh board be built and playtested before Volumes 2 to 4 exist (for example as a test-only start), or must the volumes come first? | Recommendation: build it now behind a test entry, then wire it to Volume 5. | this roadmap, 2.5 | 2026-11-20 |
| Q-N5 | Enemies | How do the ten new villains enter? | (a) a random lieutenant pool per board, so a board's lieutenant changes from run to run; (b) new boards built around them; (c) replace current lieutenants. Recommendation: (a) now, (b) as new maps are made. Their bios name places that match current boards (驛站, 汀, 漏臺), which suggests (a) or (c). | this roadmap, 3.1 | 2026-11-20 |
| Q-N6 | Connections | Should a pair's history carry a gameplay effect (a small bonus when adjacent, like a support bond), or stay dialogue only? And do you want an in-game collection of heard lines? | Recommendation: dialogue and a collection first; effects later if wanted. | this roadmap, 4.4 | 2026-11-20 |
| Q-N16 | Rules | The shop manual 七傷拳 out-damages 楊過's summit 黯然銷魂掌 in the plain case (75 against 71). The summit is far ahead only when he is alone and badly hurt (104). Intended? | (a) leave it: the summit's worth is conditional by design, and the manual costs coins, a slot and its own backlash; (b) lower 七傷拳; (c) raise the summit's plain case. Recommendation: (a) for now, and revisit with difficulty (0.8). | clean-up pass | 2026-11-20 |
| Q-N14 | Books | Attributions the designers could not confirm from memory, written in each art's `source` as this game's reading. Do they hold? | 四象步, 春蠶掌法, 懷中抱月 and 纏身摘心刀 for 胡斐, and his learning 苗家劍法; whether 吸功入地小法 is a lesser relative of 吸星大法; 易筋經 and 令狐冲; 黑血神針 given to 任盈盈; the order of 段譽's channels; 第七層 placed after 聖火令 in 張無忌's tree. | skill redesign | 2026-11-20 |
| Q-N9 | Art | The ten pictures of the bystanders who used to be saved (`game/assets/npc-tale-0.webp` to `npc-tale-9.webp`) are no longer used. Delete them, or keep them for 1.1? | Recommendation: keep until 1.1 decides whether side objectives get their own story. | story rewrite (PR #12) | 2026-11-20 |

## 6. Decisions

Answers from the producer, newest first. Earlier decisions are listed in §0 of each design document.

| Date | ID | Decision |
| --- | --- | --- |
| 2026-11-20 | Q-N8 | Where a starting art out-damages a later strike, the later art is raised; the starting art is not lowered. Of the five raised to make `check-skills` pass, 玉簫劍法 and 春蠶掌法 were truly weaker and keep their raise; 吸星大法, 打狗棒法・絆字訣 and 全真劍法 only looked weaker because the checker could not value absorbing 內力, costing an action, or fighting beside a partner, and are being re-judged once it can (0.6). |
| 2026-11-20 | Q-N10 | 玄鐵劍法・重劍無鋒 and the 玄鐵重劍 item stay separate: learning the art neither requires nor grants the sword. |
| 2026-11-20 | Q-N11 | On a phone held sideways the tip line moves to the top row, clear of the buttons. Done (switch `tipClear`). |
| 2026-11-20 | Q-N12 | The six presentation defaults stand: the cut-in pause, the technique caption at top centre, water moving during actions, key `4`, the chip naming the ready art, and End turn confirming only when a hero is untouched or could still strike. |
| 2026-11-20 | Q-N13 | The wiki loads the smaller `.woff2` fonts. Done. |
| 2026-11-20 | Q-N15 | No new art is required for the presentation pass. The optional pieces remain a wish list: wide cut-in portrait strips (about 1600 × 520), one hand-painted brush stroke (about 2048 × 256, transparent), a lacquer panel frame and a cinnabar seal texture for the HUD, and sprite sheets at twice the 144 × 176 cell. |
| 2026-11-20 | Q-N7 | Heroes arrive having forgotten their later arts; the same holds for all ten. The line the player sees, above every tree: 「應帖而來的只是一念。入門的功夫還在手上；後來所學，要在局中一招一招想起來。」 The bios, origins and entry-moment table are still to be rewritten (1.7). |
| 2026-11-20 | — | Where the rewritten story and the adversary design disagree, the story wins: 霍都 and 寶象 hold their posts. |
| 2026-11-20 | — | The eleventh-board tree keeps all nine forms of 獨孤九劍 although 令狐冲's tree now holds four of them (2.4). |
| 2026-11-20 | — | 楊過's basic attack is 古墓劍法 and he starts with 古墓長劍; 玄鐵 arrives later (the tier-2 upgrade, and 玄鐵重劍 bought in the shop). 古墓長劍 took the picture and shelf place of 青鋒劍, which left the game. |
| 2026-11-20 | — | Hero class names and role labels are not shown to the player. Adversaries and the people off the board keep their labels. |
| 2026-11-20 | — | Adversary strength stays tied to the stage, so paired boards may swap strength by route; the variety comes from how each adversary acts. |
| 2026-11-20 | — | 丁春秋's disciples take blows for him. 閻基 mends his master with 接骨續筋, an invented name. 左右互搏 may appear on more than one hero (小龍女 and 郭靖). |
| 2026-11-20 | — | Skill redesign: the starting art sits in the 根基 row and is not the hero's famous art; everything downstream is an upgrade; lineage follows the books; the famous art is the summit; new effects, conditions and trade-offs are wanted. |
| 2026-11-20 | — | Difficulty is not a goal for now: the game may be very easy while mechanisms and play are being built. |
| 2026-11-20 | — | Battle screen: no command bar. Skills open after a move, undo appears only after a move, waiting is automatic at the end of the turn, End turn stands alone; a picked art can be changed before a target is chosen. The loadout tab shows the basic attack as a fixed box and every art's reach and 內力 cost. |
| 2026-11-20 | — | Roadmap started. Workstreams: story refinement, the eleventh board and finale, more characters, connections between characters from the same book, and this question register. |

## Suggested order

1. Q-N5, then 3.1 to 3.6: bring the roster pack in. Its art is ready, and workstream 4 needs the characters.
2. 4.1 to 4.5: the pair layer and its check, written first for the pairs among the current ten heroes and twenty adversaries.
3. 4.6 for the new characters, alongside 1.1 (each board's story, which the hero-and-villain pairs feed).
4. Q-N1 to Q-N4, then workstream 2. Its rules work (the sixth seat, 獨孤九劍) can start once Q-N1 and Q-N4 are answered.
5. 1.2 to 1.4: the volumes, 心結 and 階盡, which lead into the finale.
