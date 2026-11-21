# WuxiaChess Roadmap

> Started 2026-11-20. Owner: the producer (repository owner). Maintained by every agent that works here.
> The design documents stay the source of truth for story and rules: `wiki/content/世界觀設定.md` (world view, v1.0) and `wiki/content/單輪劇本.md` (single-run script, v1.0, a design draft on the new arc; the game's text is not yet rewritten to it). This file tracks **what to build next, in what order, and what is waiting on the producer**.

## How to use this file

- **Agents: read this file before starting work**, and update it in the same commit as your work: tick items, add items you discover, and record decisions.
- **Questions for the producer go in [Open questions](#open-questions).** Ask in the session first. If the producer has not answered by the time you finish, add the question there (next free ID, your workstream, the options and your recommendation) instead of leaving it only in chat, a PR body or a design document. Build on your recommended default only where the work can be undone easily, and say so in the entry.
- When the producer answers, move the entry to [Decisions](#decisions), and carry the answer into the design document it affects.
- Do not remove a question because you think it is resolved. Only the producer resolves questions.

## Where the game stands

- **Playable:** prologue (the youth opens his eyes, names himself), ten boards in shuffled order, ten heroes (令狐冲, 任盈盈, 向問天, 郭靖, 黃蓉, 小龍女, 楊過, 段譽, 張無忌, 胡斐), twenty-five named adversaries (a master and a lieutenant per board, plus five villains who joined the boards on 2026-11-21 with placeholder text), 韋小寶's shop and dice cups, the marked stone, night talk, endings. The game's text still tells the first volume of the old five-volume arc; the producer replaced that arc on 2026-11-21 (next bullet).
- **Story is three layers that never refer to each other** (spine, boards, heroes; see README). Any new text must keep that rule, and `node tools/check-story.mjs` must pass.
- **Same-book lines exist in one form only:** a hero from the same series as a board's master gets one line on that board (23 lines, `ENCOUNTER_SCRIPT[].heroLines`, matched by `sameSeries` in `game/src/data/hero-voices.js`). Hero-to-hero lines do not exist yet.
- **Heroes start with an early art and climb to the famous one.** Each of the ten has a class that the player is not shown, a starting art in the 根基 row, and a tree that ends in the art they are known for, which carries a price. Thirty-odd effects were added for this (see workstream 0). `node tools/check-skills.mjs` holds the trees to those rules and `node tools/check-mechanics.mjs` holds the rules engine to its specification.
- **The battle screen has no command bar.** Selecting a hero shows where they can go; the arts list opens beside the hero after a move; End turn stands alone. The whole presentation layer can be switched off piece by piece in `game/src/polish.js` (`game/?classic` shows the original).
- **Boards differ in kind.** Each board has a primary objective (斬將 or 殲滅), its own number of enemies, reinforcements on seven boards, two masters on 倒影天街, and a secondary drawn each run from the board's pool of twelve kinds. A win alone brings the next hero. The table is `game/src/data/battles.js`. Before 整備 a 軍情 page states all of it, and before round one the player can swap heroes' starting tiles on the board.
- **The art library** (`asset-gen/README.md`): of 30 painted characters, 5 villains and 5 troop types are in the game; 5 villains and their troops are kept for new stages; 10 new heroes wait for the producer. The 7 painted effects and every item picture are in the game.
- **The overarching arc was replaced on 2026-11-21 (world view v1.0).** 獨孤求敗 became an immortal and still cannot put down one question: the final secret of martial arts. He copied the art of every great fighter across time into a go board and has played himself for centuries. The player, his own younger self, falls into the board in his sleep; neither knows who the other is. Heroes and villains are copies (一念) that get out only by winning; the youth trusts his stones, 求敗 presses 戰意 on his. Over five won runs (五境: 利劍, 軟劍, 重劍, 木劍, 無劍) he loosens his grip, learns that the secret is 放下, and is gone; a final battle the producer will design follows, and the youth wakes, takes up a sword and meets the eagle. **Both design documents are rewritten (v1.0); the game is not.** The game text, `tools/check-story.mjs` (which still forbids naming him) and the wiki's story pages tell the old story until 1.8 is done.
- **The run's story has an approved direction and is not yet rewritten.** `proposals/run-story-recraft.md` (繁體中文版: `proposals/run-story-recraft.zh-Hant.md`, same content) rebuilds the story of one run on the mechanics above; the producer approved it on 2026-11-21 (decisions Q-N42 to Q-N53, Q-N26, Q-N27). The game text and the two design documents still tell the older story (1.8).
- **The wiki covers the rules.** 戰鬥規則 has a page for every rule word, listing the arts, items and enemies that carry it; the words live in `game/src/data/rule-terms.js`, which the in-game guide reads too. `node tools/check-wiki.mjs` fails when the game gains a mechanic, enemy, board piece or kind of secondary that no page covers.

---

## 0. Skill trees, enemy behaviour and the battle screen

Goal: no hero starts with their strongest art; every art has a job; heroes and adversaries each play differently; the battle reads and feels like a console tactics game.

- [x] **0.1 Presentation pass.** Board pieces, combat impact, lighting and water, panels, loading, each behind a switch in `game/src/polish.js` (README, "Presentation switches").
- [x] **0.2 Controls.** Danger zone (button and `D`), `Tab` to the next hero, the strike forecast docked beside the fighters, and the action flow that replaced the four-button bar (keys `1`–`4` pick an art, `Esc` takes back a move, heroes who have not struck brace when the turn ends).
- [x] **0.3 The ten trees and the eight manuals** rebuilt to the redesign's rules: the starting art is the root, everything downstream is an upgrade or a new job, lineage follows the books, the famous art is the summit and has a price, no two nodes do the same job, each hero has a class. Saves from before the redesign get every old tree node refunded once.
- [x] **0.4 Hero-side mechanics.** Tempo (連環, 回身, 號令, 留力, 壓箱, 調息), prices (曲終, 立樁, 露空, 無守, 反噬, 轉護), conditional power (破招, 孤行, 合璧, 黯然, 還報, 斬殘, 傾力), conditions (吸勁, 內傷, 失神, 纏械), and reactions (卸勁, 代受, 挑釁, 閃身, 挪移, 布陣, 後發).
- [x] **0.5 Adversary behaviour.** Every master and lieutenant has a class and plays by it: 坐鎮 (holding a post: 余滄海, 木高峰, 左冷禪, 費彬, 洪凌波, 寶象, 霍都), 變招 at half health (血刀老祖, 歐陽鋒, 岳不群, 慕容博), 偏好 (target preference), 代受 (星宿 disciples take blows for 丁春秋) with 化功 on contact, 盟令 (左冷禪 strengthens the others), 續命 (閻基 mends his master), 遁走 (血刀老祖 retreats to the herbs), 游擊 (岳不群 strikes and steps away), the mirror (慕容博 turns the first blow back), and named rank and file per board. Each behaviour is stated on the enemy's page, shown in the forecast before a blow, and respected by the danger zone. Two behaviours rarely show in simulated play (Q-N17).
- [x] **0.6 Clean-up after the redesign.** `check-skills` now measures each art as the game resolves it (conditional power in its plain and favourable cases, effects and tempo as capabilities, prices as prices) and exits zero with six warnings that are matters of judgement; the help page explains the new rules; 向問天's taunt radius is outlined while it is aimed; the arts list tags the 破X式 that answers the enemy under the pointer; the hero panel shows 留力 and 還報 when they are live. Not covered: the 破招 tag on touch screens, which have no pointer to hover with (the forecast's 破招 note does that job there).
- [ ] **0.7 Play it on real devices.** Everything in this workstream was verified in a headless desktop browser with software rendering, at desktop and phone sizes. Nothing has been run on a real GPU, a real phone, Safari or Firefox; frame rate, the feel of hit-stop and screen shake, and the loading veil's timing are unverified.
- [ ] **0.8 Difficulty.** Deliberately not tuned (decision of 2026-11-20). `node tools/sim-battles.mjs` is the measuring stick when the time comes; its player wins almost every board, with two exceptions since the new pieces arrived (50 to 200 simulated runs): 倒影天街 about 76% and 無刻漏臺 about 18 to 29% (it was about 90% with the old four pieces). On 無刻漏臺 the party now clears eight pieces before 慕容博 takes full damage; without the round-four wave the simulator wins 55%, without any added piece 97%. No rule is at fault. When tuning: let 吸勁 hold 慕容博's 斗轉星移 off for a round, and consider returning the secondary 不觸斗轉星移 to that board's pool (decision Q-N38; it was never met in 47 simulated draws and was replaced by 全員生還).
- [x] **0.9 Swapping heroes' starting tiles before the first round.** Decided (Q-N18). After 出陣 the board opens in a deployment step: the starting tiles are lit and numbered, a tap on a hero and then on another swaps them (or moves one to an empty lit tile), and the end-turn corner reads 「開戰」 (`E` and `Enter` work too). Nobody can act until it is pressed. A save made during deployment reopens there. The step is called 起陣 (Q-N40).
- [x] **0.10 A briefing before 整備.** A 軍情 page before every board: a plan of the board (starting tiles, enemies by rank, the secondary's lamp or zone), the primary objective and how the board is lost, the drawn secondary and what it pays, and who answers the summons on a win. By the producer's ruling it stops there: how the enemy fights and when reinforcements come are left for the player to find on the board. Reinforcements are not on the plan (Q-N41). 整備 has a 軍情 button that reopens it, and during the fight the goals page is the same page with live progress.
- [ ] **0.11 Battles that differ in kind.** Decided (Q-N18 to Q-N22), built in three stages (Q-N20). **Stage one, rules done:** `game/src/data/battles.js` gives each board its kind (斬將 or 殲滅), masters, extra pieces, waves and secondary pool; reinforcements are announced a round ahead; twelve kinds of secondary (`SIDE_KINDS`) pay silver, 武學點 or a manual; every non-final win brings the next hero; saves from before the change load as legacy boards. 1,169 mechanics checks pass. **Simulator done:** `tools/sim-battles.mjs` plays each kind, deploys, reads reinforcements a round ahead and has a policy for every kind of secondary. **Interface done:** entry markers that appear one round ahead and not before (switch `battleMarks`), an outline of what the arriving pieces could strike, a plaque line, tips when a wave is announced, enters or is blocked, a tip and a forecast line for the secondary, and the 軍情 page. **Stage one is complete.** Seen in a headless browser at desktop, phone portrait and phone landscape; not on a real device, and a 殲滅 board's live progress lines were not looked at. **Not started:** stage two (objects with 氣血 to destroy or defend: 空山琴臺, 襄陽殘垣, 無刻漏臺) and stage three (carry and escape: 紅楓驛, 聽雪棧, 寒玉石室). How each kind is told in the story is decided (a board's kind is where its 戰意 sits; Q-N44, Q-N26, Q-N27) and is written in 1.8.
- [x] **0.12 Use the new villain and troop art on the existing boards.** Decided (Q-N23, Q-N24). 鳳天南 and 五虎門棍徒 arrive at 青竹渡 in round three; 張召重 and 清營刀盾兵 hold the east court of 紅楓驛; 完顏洪烈 and 趙王府弓手 arrive at 襄陽殘垣 in round four; 鮮于通 is a second master at 倒影天街 with 華山刀陣弟子; 萬震山 and 萬門劍徒 stand at 無刻漏臺. Each troop type has a trait of its own (近身失準, 盾牆, 刀陣, 斬殘). Their text is placeholder (1.7). The other five villains and their troops are kept for new stages. Art debt: Q-N34.
- [ ] **0.13 Use the item and effect art.** `asset-gen/jianying-item-art/` holds 8 painted skill effects and 32 animated item pictures (4 × 2 frames). Decided (Q-N25): play the effects for the matching arts (all but 金蛇劍法, which is a new hero's); animate the item pictures in the shop and inventory; restore 青鋒劍; add 屠龍刀, 軟蝟甲, 九花玉露丸 and 玉蜂漿; hold 金蛇劍 and 烏蠶衣 for 袁承志 and 狄雲; use item pictures for the objects the new battle kinds need. **Done:** seven painted effects play for fourteen arts (the list is `ARTS` in `game/src/fx/painted-effects.js`; switch `paintedEffects`), timed so the painted impact lands with the numbers; every item has a new still (`item-<id>.webp`) and a loop (`item-<id>-motion.webp`) that plays in the shop, the inventory and 三盅通吃 and holds still under reduced motion; 青鋒劍 is back in the shop and 古墓長劍 keeps its own picture; 屠龍刀 (攻擊 +17, 移動 −1, 52 兩, from the fourth board), 軟蝟甲 (防禦 +4, 反刺 7), 九花玉露丸 and 玉蜂漿 are in the game. Their numbers are first guesses (Q-N35 to Q-N37). **Still to do:** item pictures as battle objects, which arrive with the second stage of 0.11. Not seen on the board yet: 歐陽鋒's 蛤蟆功 (he stands on the ninth board) and 軟蝟甲's 反刺 line in the forecast; both are covered by `check-mechanics` only.
- [ ] **0.14 Weapons earned, not bought.** The producer may set some powerful weapons aside for quests or other specific ways of earning them, instead of the shop. Not designed. Until it is, a powerful new weapon such as 屠龍刀 should be easy to move out of the shop's stock.
- [x] **0.15 The wiki covers every mechanic, item and character.** A 戰鬥規則 section (about 120 pages): each rule word with who carries it, the twelve kinds of secondary with every board's version, growth, the in-game guide, the keys and the marks on a piece. The five new villains have pages for themselves and their arts; troop pages say where they stand and how they act; board pages list the enemy force, the reinforcements and the secondary pool; map grids mark entry tiles; hero pages name the 合璧 partner; item pages say who starts with the item. The rule words moved to `game/src/data/rule-terms.js`, which the in-game guide also reads. The two design documents carry the battle decisions as mechanics (world view v0.8, run script v0.5); how the story tells them is decided and not yet written (1.8).

Checks: `node tools/check-skills.mjs`, `node tools/check-mechanics.mjs`, `node tools/sim-battles.mjs`.

## 1. Story refinement

Goal: each board, each hero and the run as a whole carry a story of their own, not only the shared premise that a force compels the masters to fight.

- [ ] **1.1 A story for each board.** Today all ten boards share one premise (run script §4.3, §7). Write, per board: why this master was chosen, which hero they have history with, and whether the side objective has its own reason. Waiting on Q-R8.
- [ ] **1.2 The five 境 across runs (replaces Volumes 2 to 5).** World view v1.0 §8: what 求敗 says and asks in each 境, what he sees in the youth, and which rule each 境 changes (Q-W7, direction set: each 境 loosens 戰意 and the black stones become more themselves, so stronger). The text below describes the old volumes. Only Volume 1 exists. Design how each volume unlocks and what it reveals (world view §8): 〈一念〉 after the first full run, 〈劍解〉 when 楊過 or 令狐冲 reaches the master, 〈無名〉, 〈求敗〉. The night talk and the endings should change with the volume.
- [ ] **1.3 Each hero's 心結 quest and 了緣 condition** (world view §9 item 4). Since 2026-11-21 every non-final win brings the next hero, whatever the secondary. Waiting on Q-W4.
- [ ] **1.4 The end of a run (replaces the 階盡 scene).** In v1.0 a run ends at the table: 「好棋。容老夫想一想。請回吧。」, and the youth wakes. The old scene: (the meeting with the one who set the boards, after the tenth board). Text-only today. Waiting on Q-R7; this merges into the finale (2.4).
- [ ] **1.5 Review existing text against the producer's answers** to Q-R2, Q-R3, Q-R4 and Q-R5 once they come in.
- [ ] **1.6 Bring the design documents to new versions** (world view v0.8, run script v0.5) as decisions land, and keep §0 of each in step. The battle decisions of 2026-11-21 are in both as mechanics; the passages that tell them as story (run script §4.4, §11) are marked 待寫.
- [ ] **1.8 Rewrite the run's story to the approved direction, on world view v1.0.** **Done:** the run script is rewritten as v1.0 on the new arc, with sample scenes in 金庸's manner (the opening, a board, the night talk, 求敗's lines by board and by 境, the telling in the second 境, waking) and the writing rules in its §15. **Decided since:** Q-N54 to Q-N66, 韋小寶's place among them (world view §4.6, run script §4.6 and §10.5). **Waiting on the producer:** his word to start on the game text. **Then:** every line of game text rewritten in that manner (all of it, not only the new lines: the producer's ruling of 2026-11-21 on style), 求敗 as a speaking character with a portrait, the hooks listed below, and `tools/check-story.mjs` changed to allow his name. What follows was written before v1.0 and still holds except where it speaks of the letter, the watchers or an unseen opponent. The proposal is `proposals/run-story-recraft.md`; every question in it is answered (Decisions, 2026-11-21). In short: the one opposite plays during the board, and each stone is heard as 「嗒」 a round before the person arrives; the 戰意 makes a black stone fight and leaves the manner to him, and half health is 半醒; a board's kind is where its 戰意 sits; rank and file are 念中人; heroes arrive with what the hands know best and recall the rest, the famous art last and with its cost; a win is proof and brings the half-lit stone in; the secondary is 韋小寶's 盤口. **To do, as one task:** the text in `encounter-script.js`, `hero-voices.js`, `maze-tale.js`, `wake-tale.js`, `mastery-catalog.js` and `encounters.js` (the proposal's section 8 has the counts, and the stale lines found elsewhere: ten hero bios, `ui/gates.js` line 27, three guide paragraphs in `rule-terms.js`); four small hooks (a hero's line when the top art is recalled, a story line when a wave is announced or a named villain enters, 韋小寶 speaking the secondary's line, same-book lines matched against any named black stone, with `tools/check-story.mjs` changed to match); the run script to v0.6 and the world view to v0.9, which is where these decisions are carried into the design documents (the proposal task was told not to edit them). This completes 1.7 and the 待寫 passages of 1.6, and gives 1.1 its frame: each named black stone is written from four sentences (the proposal's section 5).
- [ ] **1.7 Bring the text in line with the skill and enemy-behaviour redesign.** Heroes now start with an early art and climb to the famous one, and each adversary has its own behaviour. The shared reason is decided and shown above every tree (`RECALL_NOTE` in `game/src/data/mastery-catalog.js`); the prose around it is not yet rewritten: the eight hero bios that say the famous art is already held (`DETAILS` in `game/src/rules/game.js`, `game/src/data/new-heroes.js`), the ten tree origin paragraphs (`HERO_PATHS[].origin`, 「入境時…」), and the entry-moment table (run script §6). On the adversary side 霍都 and 寶象 now hold their posts as the story says, so their lines stand; 閻基 now mends his master and his bio has no hint of bone-setting; 歐陽克's snakes become foot soldiers. The producer will have this prose written with a story agent. The direction for it is decided (1.8): bios and tree introductions say what is in the hand on arrival (「手上最熟的」, Q-N51), and each adversary's behaviour is written as his own manner (Q-N46).

Checks: `node tools/check-story.mjs`, `node tools/check-wiki.mjs`, `python3 tools/extra-fonts.py --check` for new characters.

## 2. The eleventh board, the youth's sprite sheet and the grand finale

Goal: the final battle after the five 境 (world view v1.0 §8.4). **The producer will design it:** a new map, with 求敗 and the youth both stepping onto the board beside heroes and villains. He has put the stones down, so it is no longer his defeat that ends the story but his letting go. The items below were written for the old arc (the youth alone as a sixth piece, the immortal defeated) and wait for that design.

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
- [x] **3.6 Sprite format.** The game reads sheets of four or five rows and plays the fifth (絕技) for a villain's signature and for every art a hero uses; four-row sheets behave as before. `tools/roster-art.py` converts a roster character into the game's four files, `tools/roster-preview.html` stands any sprite on a real board, and `tools/shoot-roster.mjs` saves a contact sheet of every frame.
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
| Q-N17 | Enemies | Two adversary behaviours work but rarely appear in simulated play. 閻基 never mends: he has 60 氣血, starts nearest the heroes and falls in round 1, before his mend is first ready in round 2. 金輪國師's wheel passes through to a second hero only about once in ten boards, because it travels along a shared row or column only. | 閻基: (a) leave it; (b) start him behind his master or make the mend ready from round 1; (c) give him more 氣血. Recommendation: (b), ready from round 1. 金輪: (a) leave it; (b) let the wheel also pass along a diagonal step; (c) have him prefer lined-up targets more strongly. Recommendation: (c). Neither is done; both are small data or scoring changes. | adversary stage | 2026-11-20 |
| Q-N28 | Enemies | 完顏洪烈 joins 襄陽殘垣 as a lieutenant now and becomes its second master when the defend battle is built (stage two). | Default taken: yes. | battle variety spec | 2026-11-21 |
| Q-N29 | Enemies | 寒玉石室 stays at four enemies, as the one lean board, while others run to eleven. | Default taken: yes. | battle variety spec | 2026-11-21 |
| Q-N30 | Enemies | The new villains keep the technique and basic-attack names the art pack gives them; only their bios are replaced with placeholders. | Default taken: yes. | battle variety spec | 2026-11-21 |
| Q-N31 | Rules | Runs saved before the change: are heroes granted for boards already won without their secondary? | Default taken: no; the new rule applies from the next win. | battle variety spec | 2026-11-21 |
| Q-N32 | Rules | What a met secondary pays. | Default taken: one of three, set per objective: 賞銀 of 24 + 3 per stage (24 to 51 兩), or one 武學點 to each hero who fought and is still standing, or one manual for the stores. | battle variety spec | 2026-11-21 |
| Q-N33 | Rules | Secondaries that name a hero and an art: only 令狐冲's (fell someone with a 破招 form) exists. Add one per hero? | Default taken: only that one for now; more can be added as data. | battle variety spec | 2026-11-21 |
| Q-N34 | Art | Three weaknesses in the ten new sprite sheets that only repainting would fix: every hurt row barely moves; every strike row holds its first three frames almost still and then jumps to the blow; and the special pose of 趙王府弓手, 鮮于通, 完顏洪烈 and 萬震山 reads as a stronger strike rather than a move of its own. 萬門劍徒 is also painted about a tenth shorter than the other troops. | (a) leave them: they read correctly at board size; (b) repaint the hurt and strike rows when the other twenty characters are prepared. Recommendation: (a) now, (b) with the next batch. | roster art | 2026-11-21 |
| Q-N35 | Items | 軟蝟甲's 反刺: when does it prick? | (a) on every blow struck from the next tile, counters included; (b) only on the attacker's own blow, not on counters; (c) once a round. Default taken: (a), for 7 points, reduced by the striker's ward. Easy to change: one rule in `barbStrike` (`game/src/rules/game.js`). | item art | 2026-11-21 |
| Q-N36 | Items | 屠龍刀 before 0.14 is designed: shop or held back? | (a) in the shop from the fourth board at 52 兩, 攻擊 +17 and 移動 −1; (b) out of the shop until it can be earned. Default taken: (a). To hold it back, delete its line in `MARKET_STOCK` (`game/src/rules/ferry-market.js`); the item itself stays. | item art | 2026-11-21 |
| Q-N37 | Items | What the two new medicines do. | Default taken: 玉蜂漿 restores 30 氣血 and 20 內力 (12 兩, from the first board); 九花玉露丸 clears every condition and then restores 36 氣血 (22 兩, from the second board). The alternative is to make one of them a rarer, stronger cure found only in 三盅通吃. | item art | 2026-11-21 |
| Q-N14 | Books | Attributions the designers could not confirm from memory, written in each art's `source` as this game's reading. Do they hold? | 四象步, 春蠶掌法, 懷中抱月 and 纏身摘心刀 for 胡斐, and his learning 苗家劍法; whether 吸功入地小法 is a lesser relative of 吸星大法; 易筋經 and 令狐冲; 黑血神針 given to 任盈盈; the order of 段譽's channels; 第七層 placed after 聖火令 in 張無忌's tree. | skill redesign | 2026-11-20 |
| Q-N9 | Art | The ten pictures of the bystanders who used to be saved (`game/assets/npc-tale-0.webp` to `npc-tale-9.webp`) are no longer used. Delete them, or keep them for 1.1? | Recommendation: keep until 1.1 decides whether side objectives get their own story. | story rewrite (PR #12) | 2026-11-20 |

## 6. Decisions

Answers from the producer, newest first. Earlier decisions are listed in §0 of each design document.

| Date | ID | Decision |
| --- | --- | --- |
| 2026-11-21 | Q-N63 | 韋小寶 comes and goes because the wall of the realm is made of 求敗's 「求」 and stops only those who seek something from martial arts. He seeks nothing from them (three masters offered to teach him and he could not be bothered), so for him there is no wall: he walked in, and the door was never shut. That is also why 求敗, who sees only the accomplished, cannot see him, and why he is so easy about it: he has spent his life at home in places he had no business being. He is the answer 求敗 is looking for, standing beside the table: a man who can put things down. World view §4.6. This also answers Q-W6. |
| 2026-11-21 | Q-N64 | Asked how he came, 韋小寶 tells a different tall story every run (a collectible). The truth is one line, at the ending: 「走進來的啊。你又沒關門。」 |
| 2026-11-21 | Q-N65 | 求敗 sees 韋小寶 for the first time at the moment he lets go, at the close of the fifth 境 (run script §10.5). |
| 2026-11-21 | Q-N66 | 韋小寶's home in the world is 大理, with his seven wives, as 《鹿鼎記》 ends. He comes out for some peace and goes home to eat; the realm is outside time, so dinner is still warm. |
| 2026-11-21 | Q-N54 | A win brings the next hero because 求敗 adds a stone: 「再借你一子。」 A weak opponent shows him nothing. |
| 2026-11-21 | Q-N55 | White stones lost in a run go back in the box and stay there until 求敗 lets go, when every stone is released. |
| 2026-11-21 | Q-N56 | Only a won run advances a 境. |
| 2026-11-21 | Q-N57 | 應帖 becomes 入局 (the rule word, the 軍情 row, the draw screen). Not yet changed in the game; part of 1.8. |
| 2026-11-21 | Q-N58 | A copy is still called 一念, and the working title stands. 求敗 says 「拓了一份」. |
| 2026-11-21 | Q-N59 | 求敗 sees that the youth is himself in the moment before 破碎虛空: one line, unexplained. |
| 2026-11-21 | Q-N60 | The five marks on the stone become five lines 求敗 carves beside the table, one for each sword he lays down; the stone becomes the inscription 楊過 later finds. 留名／還名 is dropped. The waking fragments stay, and the youth knows his own name. |
| 2026-11-21 | Q-N61 | Heroes can see 求敗 and speak to him. In the first two 境 he does not answer them and says only 「你的子話多」 to the youth; from the third 境 he begins to answer. |
| 2026-11-21 | Q-N62 | Coarse words and catchphrases as the characters speak in the novels, sparingly. |
| 2026-11-21 | — | The story and the dialogue are written in 金庸's manner: plain classical mixed with vernacular, forms of address that fit each speaker, each character's own way of talking, no modern words. The manner is followed and the sentences are our own; no passage of the novels is copied. The rules and worked examples are in the run script §15. This applies to all game text in the rewrite (1.8), including lines that would otherwise have stood. |
| 2026-11-21 | — | **New overarching arc (world view v1.0).** 獨孤求敗, an immortal, still seeks the final secret of martial arts. He draws the essence of every great fighter across time into a go board and plays himself for centuries, as a simulation. The player is pulled in during sleep; 求敗 is surprised that anyone could enter, and they play. He is bored at first and comes to think he may learn something; he keeps setting new challenges. Each run ends with 「請回吧」 and the youth wakes with vague memories. After five runs (a baseline; may be more) he sees that the secret is 放下, reaches 破碎虛空, thanks the youth and never appears again. A final battle follows, designed later by the producer: a new map, 求敗 and the youth on the board themselves. The youth wakes, practises the sword and meets 神鵰: he was the young 求敗 all along. Heroes and villains are copies of their essence; winning is the only way out; the youth treats heroes as teammates, 求敗 treats stones as pawns and the villains strain against his control and cannot break it. 求敗 is stubborn and stern, so that his letting go lands. This overturns earlier rulings: thoughts were not copies; he wanted a defeat; he was unseen and unnamed before Volume 3; heroes answered a letter; the five volumes and the 歸去／留下 ending. |
| 2026-11-21 | — | The force on the black stones is called 戰意, not 劍意. Renamed everywhere: game text, both design documents, the proposals and this file. |
| 2026-11-21 | — | A hero who wins ten boards truly leaves: that copy is returned to the original, who takes it for a moment's insight. The next run 求敗 takes a fresh copy, so heroes arrive new each run. |
| 2026-11-21 | — | Heroes do not know at first that they are copies. From the second run 求敗 says so, coldly, and the youth answers that they still hurt and still want to go home. |
| 2026-11-21 | — | 放下 is built in five steps on the five swords of the tomb (利劍, 軟劍, 重劍, 木劍, 無劍). Each run the youth wins, 求敗 sees one thing in how he plays and loosens his grip; his black stones grow stronger for it, which is the difficulty ladder. The last thing in his hand is the board itself. |
| 2026-11-21 | — | 求敗 names himself in the first scene (「世人叫我求敗」; his own name he has forgotten). The rule that nothing may name him before Volume 3 is withdrawn; `tools/check-story.mjs` changes with the rewrite. |
| 2026-11-21 | — | The run's story is rebuilt on the current mechanics along the direction of `proposals/run-story-recraft.md`. All fourteen of its questions were answered in the session (the rows below). The proposal task did not edit game text or the design documents; the rewrite (1.8) carries these answers into `wiki/content/單輪劇本.md` and `wiki/content/世界觀設定.md`. |
| 2026-11-21 | Q-N42 | The secondary is 韋小寶's side bet (盤口): he opens a book on every board and shares what he wins, in silver, a manual from his stock, or a fight so well fought that the hands remember (武學點). The interface word stays 支線. Not chosen: a finer question from the one opposite; a gift from the watching hero. |
| 2026-11-21 | Q-N43 | **Superseded the same day by world view v1.0: there is no letter now. See Q-N54.** A win brings the next hero because a win is proof. A half-lit white stone at the board's edge is someone holding the letter and hesitating; a board won makes one more believe the match can be won. Not chosen: a master going home frees a place; a clause added to the letter. |
| 2026-11-21 | Q-N44 | The one opposite plays during the board. Reinforcements are black stones heard (「嗒」) as they are set down, one round before the person arrives. The five added villains, and any added later, are strangers from other books under the same will, not lieutenants written into the master's story. Not chosen: a set piece with reinforcements hidden in mist. |
| 2026-11-21 | Q-N45 | Rank and file are 念中人: people the master's own thought brought with him, not summoned thoughts. They fade when he wakes, which is why the rest need not fall on a 斬將 board. One sentence is added beside 仙規二 (world view §4.2, §4.4). |
| 2026-11-21 | Q-N46 | An adversary's health reads as how deeply the 戰意 holds him. Blows wake him; at half health he is half awake (半醒), and 變招 is his own nature coming through. The will compels the fight and not the manner. |
| 2026-11-21 | Q-N47 | Black stones from different books may learn something of their own future from one another (完顏洪烈 hearing from 金輪國師 that Jin has fallen). It is forgotten on waking, as everything is. |
| 2026-11-21 | Q-N48 | A hero's same-book line may answer any named black stone on a board, not only its master. Five are written now (胡斐 and 鳳天南; 郭靖, 黃蓉, 楊過 and 完顏洪烈; 張無忌 and 鮮于通) and move into the pair layer (workstream 4) when it exists. A line against a villain who arrives mid-battle plays when he steps on. `tools/check-story.mjs` changes with the rule. |
| 2026-11-21 | Q-N49 | The rewrite may add small hooks: one line per hero when the top art is recalled; a story line when a wave is announced and when a named villain enters; 韋小寶 speaking the secondary's line. No rule of play changes. |
| 2026-11-21 | Q-N50 | Who is on the other side of 韋小寶's book is left unsaid in Volume 1 and kept as a thread for a later volume (運 against 算). |
| 2026-11-21 | Q-N51 | 「入門的功夫」 is written as 「手上最熟的」 for all ten heroes. 「最早學的」 is said only where the book supports it (楊過, 小龍女, 段譽, 張無忌, 黃蓉, 郭靖, 胡斐), not for 令狐冲, 任盈盈 or 向問天. No starting art changes. |
| 2026-11-21 | Q-N52 | 軍情 gains one lead line, and its 戰局, 支線 and 應帖 rows are reworded in the youth's voice (where the 戰意 sits; 韋小寶's bet; the half-lit stone). No information is added; the page still ends at 應帖. |
| 2026-11-21 | Q-N53 | On 倒影天街, 岳不群 knows 鮮于通's name from the roll of 華山's past heads, and 鮮于通 has never heard of 岳不群. This is the game's reading: the novels do not join the two books' 華山 into one history. |
| 2026-11-21 | Q-N26 | After a win with the secondary missed, 韋小寶 says one short line (「這一口你沒押中。不打緊，局是贏了的。」 as the sample). The old line `unlit` is retired. Until the rewrite, the default stands: no line is shown. |
| 2026-11-21 | Q-N27 | A secondary met is marked by a line from 韋小寶 by kind (twelve lines) and a tail by pay (three lines); samples are in the proposal's section 4. They replace the shared placeholder in the rewrite. |
| 2026-11-21 | Q-N41 | Reinforcements come as a surprise. The plan in 軍情 and in 整備 no longer marks where they enter, and the board shows nothing of a wave (no marker, tip, tile label or enemy page) until it is announced, one round before it enters. The interface reads `announcedWaves` in `game/src/rules/game.js`, never `pendingWaves`. Two things still tell of reinforcements ahead of time: the secondary 拒敵於外, whose wording names them, and the wiki, which lists every board's waves. |
| 2026-11-21 | Q-N40 | The step before round one is called 起陣 everywhere (plaque, guide, tips, log), to match 起陣格. 布陣 means only the formation an art lays on the ground. |
| 2026-11-21 | Q-N39 | Approved: the end-turn corner reads 「開戰」 while deploying and `E` presses it; 整備 has a 軍情 button; the goals page (formerly 十局棋路) is the 軍情 page with live progress; and `Enter` also starts the battle. `Enter` on a focused control still presses that control. |
| 2026-11-21 | Q-N38 | 無刻漏臺's secondary 不觸斗轉星移 is replaced in that board's pool by 全員生還 (same reward, a manual). When difficulty is tuned, let 吸勁 hold 慕容博's 斗轉星移 off for a round and consider returning it (0.8). The kind itself stays in the rules. |
| 2026-11-21 | 軍情 | The 軍情 page says too much. It ends at 應帖: the plan of the board, 戰局, 勝利, 敗退, 支線 and 應帖. How each enemy fights, how many there are, when reinforcements come and the terrain note are removed, for the player to discover on the board; 整備's 兵力 line is removed with them. Nothing needs spelling out that the player can find out by playing. The wiki still lists all of it. |
| 2026-11-21 | Q-N23 | From the roster pack, five villains join the existing boards now, each with a troop type: 鳳天南 (青竹渡), 張召重 (紅楓驛), 完顏洪烈 (襄陽殘垣), 鮮于通 (倒影天街), 萬震山 (無刻漏臺). Five are kept for new stages with their troops: 東方不敗, 李秋水, 洪安通, 裘千仞, 公孫止. This answers part of Q-N5 for these five; how the kept five enter is still open there. |
| 2026-11-21 | Q-N24 | The new villains enter with placeholder text (a neutral line each: who they are and how they fight). Much of the story is to be refined anyway (3.2). |
| 2026-11-21 | Q-N25 | Items: restore 青鋒劍; add 屠龍刀, 軟蝟甲, 九花玉露丸 and 玉蜂漿 now; hold 金蛇劍 and 烏蠶衣 for 袁承志 and 狄雲. The producer may later set some powerful weapons aside for quests or other ways of earning them (0.14). |
| 2026-11-21 | — | The art library is sorted into one folder per pack, with `asset-gen/README.md` saying what each holds and who may be used. |
| 2026-11-21 | Q-N18 | Heroes' starting tiles are swapped on the board itself, in a short deployment step before round one; the 整備 seats stay for choosing who fights. |
| 2026-11-21 | Q-N19 | Each map has one designed primary objective; the secondary is drawn each run from a small pool for that map. |
| 2026-11-21 | Q-N20 | Battle kinds are built in three stages: first defeat-everyone, varied enemy counts, reinforcements, the briefing and the new secondaries; then objects with 氣血 (destroy, defend); then carrying and exits (capture, escape). |
| 2026-11-21 | Q-N21 | A win alone brings the next hero. The secondary objective pays a bonus instead (武學點, coins or a manual). This also bears on Q-W4. |
| 2026-11-21 | Q-N22 | Whatever is defended, destroyed or carried is an object, never a person, until the story says otherwise. |
| 2026-11-21 | — | From the new art, only the villains and their troop types may be used to enrich the existing boards (for example a second master or lieutenant). The ten new heroes wait for the producer, and some villains are to be kept back for new stages he will add. |
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
