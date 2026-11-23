# Declutter audit: text on functional pages that gives the player nothing to use

Nothing in the game was changed by this audit. The three sentences the producer marked on 2026-11-23 were dealt with separately (ROADMAP 0.35).

Audit date 2026-11-23. Sources read: every file in `game/src/ui/`, `game/src/data/` (except the story scenes in `encounter-script.js` and `hero-voices.js`), `game/src/rules/journey.js`, the text in `game/src/rules/game.js`, `game/src/app.js`, `game/index.html`, and the full text listing built with the wiki's corpus (3,924 strings). Pages were also opened at 390 × 844 in the browser harness; pixel figures are CSS pixels at that size.

The three sentences the producer marked are not listed again. When I read the checkout the 戰局 lines were already plain (「斬將 · 擊敗局主即勝，其餘敵人不必打完。」) and the paragraph was already off the 武學 page.

## Summary

**73 candidates on 16 pages**: 25 *certain* (the player loses nothing), 41 *likely*, 7 *a matter of taste*.

Three patterns account for most of them:

1. **The same thing said twice in a row.** 軍情 states how to win under 戰局 and again under 勝利. 整備 opens with a 200 px block repeating the 軍情 page just left. The hero's name stands three times above the skill tree. A lost run is told with the same paragraph in the scene, in the shop's 本局紀錄 and on the summary page.
2. **Story voice where a rule or a number is wanted.** The 選境界 paragraph, the 抓子 instruction, the 起陣 tip, 「盤邊擱著一枚白子…」, 「黑子氣血略厚，出手略重」, 「十二合已過。拓來的一念撐不住，散了。」.
3. **Notes to the team that reached the player.** 61 of the 144 art notes carry 「…是本作的讀法／為本作演繹／為本作所擬」; every art's 招式解說 closes with a description of its drawn effect; the 師承與行功 fold carries a disclaimer about the adaptation.

One finding runs the other way and matters more than any of these: **in the shop, 15 of the items on sale describe themselves with no number at all** (青玉佩: 「溫玉貼身，能助運氣行功。」). What the item does (絕技威力 ＋7) is shown only later, in 裝備物資.

### The ten that free the most room or remove the most confusion on an upright phone

| # | Where | What | Proposal |
|---|---|---|---|
| 1 | 整備 › 陣容 (E1) | The 作戰目標 block, open by default, repeats 軍情: four rows, about 200 px above the line-up | Fold: closed by default; keep visible only the warning for a 支線 that names a hero |
| 2 | 通吃坊 item rows (H1) | Description hidden in a fold, and for 15 items it has no number: 「溫玉貼身，能助運氣行功。」 | Show the bonus line under the name always (「絕技威力 ＋7」); keep the prose folded |
| 3 | 選境界 (B1, B2) | A 104-character paragraph (6 lines, about 130 px) above the five choices, which say 「略厚」「略重」「更堅」 | Replace with: 「境界即難度，越後敵人越強。勝了已開的最高一重，下一重方開；無劍境界十局皆勝，接著打終局。」 and give each 境界 its numbers |
| 4 | 軍情 (D1–D3) | 戰局 and 勝利 say the same thing in two headed sections; 「韋小寶另開盤口：」; 「盤邊擱著一枚白子：這一局勝了，求敗便借出袁承志。」 | Merge 戰局 into 勝利 (one line); remove the 支線 lead; Replace 入局 with: 「取勝後，袁承志加入。」 |
| 5 | 抓子 (C1) | A 69-character instruction (3 lines) between the picture and the cards; the first card starts halfway down the screen | Replace with: 「從五位中留下三位，再選一位作領隊。領隊倒下，這一輪便結束。」 |
| 6 | 武學 › node detail (F4–F7) | On every art: a kind note, an origin note between the numbers and the 修習 button, and inside 招式解說 a description of the animation | Remove the kind note and the animation line; move the origin note into the fold and cut every 「本作…」 clause |
| 7 | 戰盤, 起陣 (I1) | A 51-character tip, three lines (74 px) over the board until the first tap: 「…子還在手上，換得：…一按「開戰」，落子無悔。」 | Replace with: 「起陣 · 點一位俠客，再點另一位或亮起的空格換位。按「開戰」後不能再換。」 |
| 8 | 通吃坊 header (H2–H4) | Two cards (about 180 px) before the first item: 「韋小寶的通吃坊」 under a page titled 通吃坊, 「此局已過」, a 貨架 label with nothing under it | One line: 「青竹渡 · 勝 · ＋36 兩 · 袁承志入隊」; one row for 三盅通吃; remove 貨架 |
| 9 | 地形圖 legend (K4) | Lists all eight kinds of ground on every board; on 15 of 16 boards some are not there (谷底棋臺 lists five it does not have) | List only the kinds on this board |
| 10 | 武學 tab, top (F1–F3, F11) | The hero's name three times in 200 px; 「根基 · 根基」; six words for spending a 武學點 (參悟, 修習, 研習, 習武, 想起, 修) | One name row; 「根基」 once; one word: 修習 |

### Count per page

| Page | Candidates |
|---|---|
| A. 群俠列傳 (title screen: none) | 1 |
| B. 選境界 | 3 |
| C. 抓子 | 3 |
| D. 軍情 | 6 |
| E. 整備／隊伍 › 陣容 | 5 |
| F. 整備／隊伍 › 武學 | 15 |
| G. 裝備物資 and 俠客詳情 | 5 |
| H. 通吃坊 and 三盅通吃 | 7 |
| I. 戰盤: tips, messages, menu | 7 |
| J. 敵情查探, 守物／破物, 交鋒預覽 | 5 |
| K. 目標, 地形圖 | 4 |
| L. 一輪結束 (run summary) | 3 |
| M. 石刻 | 1 |
| N. 設定 | 1 |
| O. 遊玩指南 | 6 |
| P. 新手指引 | 1 |
| **Total** | **73** |

**Reason** is the number from the brief: 1 nothing to act on; 2 a rule in roundabout words; 3 repeats the page or the page before; 4 explains what the control shows; 5 a label with nothing under it, or a legend entry for something absent; 6 a note to the team; 7 vertical room on a phone. **Sure** is how sure I am the player loses nothing. Every string is quoted as it stands in the source.

---

## A. Title screen and 群俠列傳

The title screen at 390 px shows only 武俠戰棋, 江湖誌 ↗, four icons, 入夢 and 群俠列傳. Nothing to remove.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| A1 | 群俠列傳, under the title, above the 20 portraits (3 lines, about 65 px) | 「每一輪開局抓五枚白子，留下三枚，三位俠客入局；另兩枚放回盒裡。每勝一局，求敗再借出一位。每局至多五人上盤。」 | 3, 7 | Remove. The page is a gallery of heroes; the rule is in the guide and on 抓子. | `ui/gates.js`, `codexPage` (third argument of `titleHead`) | The wiki's text listing only | likely |

## B. 選境界

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| B1 | Paragraph above the five choices (104 characters, 6 lines, about 130 px) | 「棋臺邊的石上刻著五柄劍的來歷。… 無劍境界十局皆勝，便是終局：求敗與無名都放下棋子，親自入盤。」 | 2, 7 | Replace with: 「境界即難度，越後敵人越強。勝了已開的最高一重，下一重方開；無劍境界十局皆勝，接著打終局。」 | `ui/realm-views.js`, `realmView` (`realm-lead`) | `wiki/content/單輪劇本.md` §11, row 難度階梯 (its in-world reading can stay there) | likely |
| B2 | The line on each of the five cards; the first also heads 抓子 (「利劍境界　黑子如常。」) | 「黑子如常。」／「黑子氣血略厚，出手略重。」／「黑子氣血加一成，出手略重，防禦略堅。」／「黑子氣血加二成，出手加一成，防禦更堅。」／「黑子氣血加三成，出手加一成半，防禦更堅。」 | 2 | Replace with the numbers `realms.js` already holds (no rule changes): 「敵方數值不變。」／「敵方氣血 ＋6%、攻擊 ＋3%。」／「敵方氣血 ＋12%、攻擊 ＋6%、防禦 ＋1。」／「敵方氣血 ＋22%、攻擊 ＋11%、防禦 ＋2。」／「敵方氣血 ＋30%、攻擊 ＋15%、防禦 ＋2。」 Today 「略重」 stands for both 3% and 6%, and 「更堅」 for the same ＋2 twice. | `data/realms.js`, `REALMS[].note` | `wiki/src/catalog/story.js` reads `note`; `README.md` describes the five 境界 | likely |
| B3 | Under the list, once the ending has been seen, on every later run (109 characters) | 「求敗撒手而去，再不回來。此後再入夢，棋臺邊坐著的只是這盤棋記得的一道影子，… 九式要一式一式使將出來。」 | 1, 3, 7 | Replace with: 「無名入盤：開局連無名共四人。」 The long text stays on the ending's own page. | `ui/realm-views.js`, `realmView` (`realm-plus`); `MAZE_TALE.finale.plus.text` | The ending page uses the same string; `wiki/src/catalog/heroes.js` and `story.js` read `finale.plus` | likely |

## C. 抓子 (hero pick)

At 390 px: the 境界 line, a picture 170 px tall, the 局規 fold, the instruction (3 lines) and the count; the first card begins at y ≈ 420 of 844. The leader-effect card is below the fifth card.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| C1 | Instruction above the five cards (69 characters, 3 lines) | 「抓起五枚：點選留下三枚，另兩枚放回盒裡，日後求敗或會再借出。留下的三枚中選一枚先落的子作領隊，是為這一輪的「眼」。領隊倒下，這一輪便結束。」 | 2, 7 | Replace with: 「從五位中留下三位，再選一位作領隊。領隊倒下，這一輪便結束。」 (the count 「已留 3／3」 stays) | `ui/run-views.js`, `rollView` (`lot-instruction`) | `單輪劇本.md` §11, rows 抓子 and 定眼 | likely |
| C2 | The 局規 fold (closed), between the picture and the instruction | 「少年伸手入盒，一把抓起五枚白子，攤在盤上。… 求敗道：「說了三枚。留下三枚，餘下的放回盒裡。」」 (70 characters) and 「棋臺沿上刻著：「白子勝滿十局，放還本尊。中道而敗，收子入盒。」」 | 1 | Keep the fold but hold only the engraved line, or remove the fold: the first board's scene reads the rule aloud and 韋小寶 explains it. A fold named 局規 that opens on narration is not what its name promises. | `ui/run-views.js`, `rollView` (`draw-tale`); `MAZE_TALE.draw`, `MAZE_TALE.rule` | `單輪劇本.md` §11, row 抓子; `tools/check-story.mjs` sweeps `MAZE_TALE` but pins no wording | taste |
| C3 | The 歷輪紀錄與開局資源 fold, and the run summary | 「累積的悟 1 點」 | 2 | Replace the label with: 「悟 1 點（每點開局多 4 兩，計至 12 點）」. Nothing on either page says what 悟 does; the code gives 24 ＋ 4 for each point up to 12. | `ui/run-views.js`, `rollView` (`record('累積的悟', …)`); `ui/journey-pages.js`, `journeyEnding` | none | likely |

Considered and kept: 「按下「落子」時，這一輪會取代目前的存檔。」; the leader-effect card; 「無名自己也在盤上：連這三位，開局共是四人。」.

## D. 軍情 (briefing)

All sixteen boards were printed from `boardBrief`. Every kind shows the same doubling under 戰局 and 勝利:

- 斬將, one master: 「斬將 · 擊敗局主即勝，其餘敵人不必打完。」 then 「在第十二回合結束前擊敗余滄海。」
- 斬將, two masters: 「斬將 · 有兩名局主，兩人都擊敗才算勝。」 then 「在第十二回合結束前擊敗岳不群與鮮于通。」
- 殲滅: 「殲滅 · 擊敗所有敵人即勝。」 then 「在第十二回合結束前擊敗全部敵人。」
- 守: 「守 · 守住我方的器物到指定回合即勝；提前擊敗局主也算勝。」 then 「守住七弦琴，撐到第八回合結束；或在此之前擊敗左冷禪。」
- 破: 「破 · 擊毀指定的器物即勝。」 then 「在第十二回合結束前擊毀星索樁兩根。」
- 問劍: 「問劍 · 將求敗的氣血削至 1 點即勝。他不會倒下，其餘局主不必擊敗。…」 then 「在第十二回合結束前，將求敗的氣血削至 1 點。他不會倒下；其餘的人不必擊敗。」

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| D1 | 戰局 section and 勝利 section (a heading and a line each, about 68 px each) | As listed above | 3, 7 | Merge into one 勝利 section and drop 戰局. Replace with, by kind: 「斬將 · 在第十二回合結束前擊敗余滄海；其餘敵人不必打完。」／「斬將 · 在第十二回合結束前擊敗岳不群與鮮于通，兩人都要擊敗；其餘敵人不必打完。」／「殲滅 · 在第十二回合結束前擊敗全部敵人，援軍也算。」／「守 · 守住七弦琴到第八回合結束；或提前擊敗左冷禪。」／「破 · 在第十二回合結束前擊毀星索樁兩根；局主不必擊敗。」／「問劍 · 在第十二回合結束前將求敗的氣血削至 1 點；他不會倒下，其餘的人不必擊敗。」 | `rules/journey.js`, `boardModel` (`battle`, `win`); `MAZE_TALE.brief.slay` … `yield`; `ui/panels.js`, `briefPage` (`sect('brief-kind', …)`) | `tools/check-mechanics.mjs` pins `briefing().battle === '斬將 · ' + MAZE_TALE.brief.slayTwo` and the 倒影天街 `win` string, tests `win.includes('削至 1 點')` on the last board, and requires `m.battle && m.win`; `單輪劇本.md` §11 (row 主要目標) records the 2026-11-23 one-line-per-kind ruling | likely (a step past what the producer just approved, so his call) |
| D2 | 支線 section, small line above the 支線's name | 「韋小寶另開盤口：」 | 1, 3 | Remove. The heading already says 支線. | `MAZE_TALE.brief.side` → `boardModel` `sideLead` → `briefPage` | `單輪劇本.md` §11, row 支線／盤口 | certain |
| D3 | 入局 section, and the 入局 row of 整備's 作戰目標 | 「盤邊擱著一枚白子：這一局勝了，求敗便借出袁承志。」 | 2 | Replace with: 「取勝後，袁承志加入。」 | `MAZE_TALE.brief.next` | `世界觀設定.md`, decision Q-N52 (the 白子 wording was kept, then on 2026-11-23 the page was ruled to state rules plainly: this sentence is what is left of the old voice); `單輪劇本.md` §11, row 添子 | certain |
| D4 | 支線 reward line; four times in the pool list read from the shop | 「勝利時另得出陣生還的俠客各 1 武學點。」／「勝利時另得賞銀 24 兩。」／「勝利時另得武譜一卷（入公庫）。」 | 2, 3 | Replace with: 「獎勵：出陣生還的俠客各得 1 武學點」／「獎勵：賞銀 24 兩」／「獎勵：武譜一卷（入公庫）」. The first reads today as if the player were given heroes. | `rules/journey.js`, `boardModel` (`sideRow.rewardText`) and `rewardText` | `app.js` builds 「支線達成 · 取勝即得…」 from `rewardText` (unaffected) | likely |
| D5 | 軍情 read from the shop for the next board, above the pool of four | 「韋小寶另開盤口：」 then 「支線於入局時抽定。」 | 2 | Replace both with: 「下列四道，入局時抽出一道：」 | `boardModel` (`sideNote`), `briefPage` | none | likely |
| D6 | 終局 (谷底棋臺), end of the 戰局 line | 「無名親自入盤，比盤上拓來的人都強：氣血 ＋100、內力 ＋40、攻擊 ＋10、防禦 ＋6、移動 ＋1。」 | 2 | Replace with: 「無名上盤另加：氣血 ＋100、內力 ＋40、攻擊 ＋10、防禦 ＋6、移動 ＋1。」 on a line of its own. | `rules/journey.js`, `boonLine` | none found | likely |

Considered and kept: the 支線 detail lines (「由狄雲給余滄海最後一擊（招式、普攻、還擊或其所下的毒皆算）。」 and the other eleven kinds); 敗退; the plan and its key (the key lists only what the plan shows).

## E. 整備／隊伍 › 陣容

With three heroes on the first board this tab is 1,456 px tall in a 677 px window: more than two screens.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| E1 | The 作戰目標 block, first thing on the tab, open by default (about 200 px) | 「勝利　在第十二回合結束前擊敗余滄海。」「敗退　趙敏倒下，或第十二回合結束仍未取勝。」「支線　親手了斷　由狄雲給余滄海最後一擊（…）。勝利時另得出陣生還的俠客各 1 武學點。」「入局　盤邊擱著一枚白子：這一局勝了，求敗便借出袁承志。」 | 3, 7 | Fold: closed by default (`missionShut` starts true). Keep the 支線's name on the closed header, and keep visible the warning 「狄雲未在出陣名單中，此支線無法達成。」 when it applies: the only line here that bears on the line-up. The 軍情 button beside it opens the whole page. | `ui/company-views.js`, `memberLine`; `app.js`, `teamUI` | none | likely |
| E2 | Same block, opened from the shop for the next board | 「支線　支線於入局時抽定。」 | 1 | Remove the row when no 支線 is drawn yet. | `ui/company-views.js`, `memberLine`; `boardModel` (`sideNote`) | none | certain |
| E3 | Two empty posts, each a dashed box about 100 px tall, when there is no one to put there (the first board has three heroes and five posts) | 「陣位 四」「陣位 五」 | 5, 7 | Replace the two boxes with one short row (「陣位 四、五　空」), or draw empty posts only when someone is on the bench. | `ui/armory-views.js`, `formationCards` (`fo-seat empty`, `fo-vacancy`) | none | likely |
| E4 | The 候補 box when nobody is on the bench | 「候補」 over 「無候補俠客」 | 5 | Remove the heading and the line while the bench is empty. | `ui/armory-views.js`, `formationCards` (`fo-bench`) | none | certain |
| E5 | The 地勢與敵情 fold's second line | 「雙岸竹渡 · 90 格」 | 1 | Remove. A nickname for the board's shape and a count of tiles; nothing follows from either. | `ui/company-views.js`, `memberLine` (`fy-brief`); `data/terrain.js`, `shapeName` | `wiki/src/catalog/maps.js` uses `shapeName` (unaffected) | certain |

Considered and kept: 「出陣後可在戰盤上再換位置。」 and 「拖曳俠客，或先點選俠客再選陣位。」; the board's 地勢 text inside the fold (it says where the bridges and herbs are, and it is folded); 「敵軍善尋落單領隊。與同伴相鄰，或踏上有防禦加成的地形，可打亂對方選擇目標的次序。」.

## F. 整備／隊伍 › 武學

Above the tree at 390 px: the tab row, the hero picker, a row with the hero's name and 俠客詳情, the three sub-tabs, a card with the hero's name again, the book and the tree's title. The tree starts at y ≈ 325.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| F1 | Row under the hero picker (about 50 px) | 「趙敏」 and the button 「俠客詳情」 | 3, 7 | Remove the row; put 俠客詳情 on the header card. The picker above already marks 趙敏 and the card below names her. | `ui/company-views.js`, `teamPage` (`fy-recipient`) | none | likely |
| F2 | Header card above the tree (about 65 px) | 「趙敏｜《倚天屠龍記》」「靈蛇島三劍錄」「3 武學點」 | 1, 3 | Shrink to one line: the tree's title and the 武學點. The name is a repeat, the book is nothing to act on, and the points also sit on the picker chip. | `ui/mastery-views.js`, `skillHeading`; `HERO_PATHS[].title` | `wiki/src/catalog/heroes.js` shows the title (unaffected) | taste |
| F3 | Small line at the top of the detail pane, for the three root nodes and the starting art | 「根基 · 根基」 | 3 | Replace with: 「根基」. The kind and the tier are the same word. | `ui/mastery-views.js`, `nodeDetails` (`kindNames`, `tiers`) | none | certain |
| F4 | Line under the art's name, on every new art and every 成名絕技 | 「新招：另成一招，配入招式欄的一格。」／「成名絕技：另成一招，配入招式欄的一格。」 | 3, 4 | Remove these two; the line above already says 「新招 · 一階」. Keep 「普攻精進：取代原本的普攻。」. | `ui/mastery-views.js`, `kindNotes` | none | likely |
| F5 | Between the numbers and the 修習 button, always shown, on all 144 arts (average 31 characters, longest 77: one to three lines) | For example 「趙敏以十香軟筋散擒住六大派高手，囚於萬安寺。」 | 1, 7 | Fold: move it inside 招式解說, which is closed by default, so the button follows the numbers. | `data/mastery-catalog.js`, each art's `source`; `rules/journey.js`, `studyState` (`sourceNote`); `ui/mastery-views.js`, `nodeDetails` (`mj-source`) | `wiki/src/catalog/skills.js` and `wiki/src/view/lore.js` read `source` | likely |
| F6 | The same notes: 61 of 144 carry a statement about the adaptation | 「…是本作的讀法」 ×12, 「…為本作的讀法」 ×2, 「…為本作演繹」 ×14, 「…是本作的演繹」 ×4, 「…為本作所擬…」 ×15, 「…是本作所擬…」 ×5, 「本作由此式進入…」 ×3, 「…出自本作」 ×2 (the shop manuals), four others. Whole notes: 「捨身截騎為本作給向問天的搏命招式。」 「纏身摘心刀取作胡家刀法的一式名，是本作的讀法。」 「流星經天取作血刀刀法的一式名，是本作的讀法。」 | 6 | Remove the clause from what the game shows and keep the half about the novel: 「獨孤九劍中破解天下各家劍法的一式。以射程分辨對手是本作的讀法。」 becomes 「獨孤九劍中破解天下各家劍法的一式。」 In 13 notes the statement is the whole note or cannot be cut without rewriting (日月短劍・藏鋒, 回春, 長鞭破陣, 返勁, 捨身截騎, 玉女劍法・收鋒, 點指截脈・認穴, 擊流, 胡家快刀・藏鋒, 懷中抱月, 春蠶掌法, 纏身摘心刀, 流星經天): show no note for those. The wiki can keep the full text if a second field is wanted. | `data/mastery-catalog.js`, `source` on 61 arts | the wiki as in F5 | certain |
| F7 | Last line inside 招式解說, one for every art (about 165 lines) | 「藥粉散作層疊的雲絮，綿綿外散。」 「九柄劍影張扇，劍尖同指一處。」 | 1, 6 | Remove from the page. It describes what the effect drawing looks like; the player sees the effect when the art is used. | `fx/technique-strokes.js`, `RECIPES[…][5]` → `STROKE_NOTES` → `rules/move-facts.js` (`animation`) → `nodeDetails` | the wiki's text listing files these under `RECIPES` | certain |
| F8 | The 師承與行功 fold (closed), under the tree: first paragraph, one per hero (21 texts, 53 to 87 characters) | 「入境之時，趙敏手上只剩在萬安寺中向各派高手偷學來的零碎劍招。靈蛇島上那三招與敵偕亡的劍法，要一招一招想起；天地同壽，須到最後。」 | 1, 3 | Keep folded, or remove with the paragraph the producer has just taken off this page: it is the same thought told per hero, and each hero's 人物小傳 ends with the same sentence again. | `data/mastery-catalog.js`, `HERO_PATHS[].origin`; `ui/mastery-views.js`, `pathOrigin` | `wiki/src/catalog/heroes.js` shows `origin`; `單輪劇本.md` §11, row 從根長起 (「十段引言」) | taste |
| F9 | Same fold, second paragraph | 「傳承所記為原著人物、武學或器物。招式分支、戰棋效果、武譜流傳與參悟條件為本作演繹。」 | 6 | Remove from the game. The wiki already prints it as its convention. | `data/mastery-catalog.js`, `CATALOG_NOTE`; `rules/journey.js`, `treeModel` (`originNote`) | `wiki/src/catalog/index.js` (`convention`) | certain |
| F10 | Same fold, the two rows at its foot | 「基本招式　王府快劍」「領隊效果　軟筋餘香 距離領隊兩格內的敵人攻擊減少 3。」 | 3 | Remove. Both are on the 陣容 pane, and the basic attack is the first box of 招式配置. | `ui/mastery-views.js`, `pathOrigin` | none | certain |
| F11 | Across the tab and the pages around it: six words for spending a 武學點 | Tree nodes 「可修」「已習」「未習」; status 「可參悟」; cost row 「研習所需 1 武學點」; buttons 「修習此招」「研習根基」「精進一重」; card badge 「可參悟 3」; pane button 「習武」; shop 「另花 2 武學點參悟」; 公庫 row 「參悟 2 點」; log 「想起「…」」; messages 「新招已悟…」「修習有成。」; and the points are 「武學點」 here but 「武學點數」 in the guide and the log | 2 | Replace with one word, 修習, and one name, 武學點: 「可修習」, 「修習所需 1 武學點」, 「修習此招」, 「可修習 3」, 「另花 2 武學點修習」. The log's 「想起」 can stay as the story's word. | `rules/journey.js` (`studyState.status`, `learn`, `campModel`); `ui/mastery-views.js` (`schoolMap`, `nodeDetails`); `ui/armory-views.js` (`formationCards`); `ui/company-views.js` (`heroPane`, `arts`); `app.js` (`command` messages); `data/rule-terms.js` | `單輪劇本.md` §11, row 從根長起 uses 想起 as the in-world word | likely |
| F12 | 招式配置, under the heading 可用招式 | 「選擇招式，裝入第一格。」 | 4 | Remove. Each row's button already reads 「配置此格」. Keep the two variants that explain a disabled state: 「可於戰前整備、通吃坊，或全隊尚未行動時換招。」 and 「可將剛參悟的招式配置一次。」 | `ui/mastery-views.js`, `loadout` | none | likely |
| F13 | 招式配置, text links under the list | 「查看門派武學」「修習已授武譜」 | 3, 4 | Remove. The sub-tabs 門派武學 and 授業武譜 a few lines above do the same. | `ui/mastery-views.js`, `loadout` (`studyLinks`) | none | certain |
| F14 | 招式配置, the 合招譜 fold: six entries, each for named heroes, shown under every hero whoever is in the company | For example 「前掌後刀」: 「郭靖和胡斐各站在敵人南北相鄰的一格。胡斐持胡家單刀先攻，夾擊多打 7 點，郭靖回 4 點內力。…」 | 5 | Keep the fold; list only the 合招 whose heroes are in the company now (or grey the rest). With 趙敏, 狄雲 and 洪七公 none of the six can be made. | `ui/company-views.js`, `arts`; `data/form-catalog.js`, `COMBINATIONS` | the wiki lists `COMBINATIONS` (unaffected) | likely |
| F15 | 授業武譜, each row of 公庫武譜 | 「公庫 ×1 · 參悟 2 點」 | 2 | Replace with: 「公庫 ×1 · 修習需 2 武學點」 (with F11). | `ui/company-views.js`, `arts` | none | likely |

Considered and kept: the fact badges and the 招式解說 prose (it repeats the badges in sentences, but it is folded and is the readable version); 「攻擊倍率 × 0.8」; the cost, range and 修習條件 rows; the empty state of 授業武譜.

## G. 裝備物資 and 俠客詳情

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| G1 | 裝備物資, two rows one under the other | 「趙敏」 with the button 「俠客詳情」, then 「趙敏　氣血 70／70 · 內力 34／34」 | 3 | Merge into one row: name, 氣血 and 內力, 俠客詳情. | `ui/company-views.js`, `teamPage` (`fy-recipient`); `ui/armory-views.js`, `armory` | none | certain |
| G2 | The shared store has two names, sometimes side by side | Section heading 「行囊」 with a button 「公庫」 in it; items marked 「公庫 ×1」; messages 「已收入隊伍行囊。」, 「隊伍公庫已收下…」, 「抄本已入公庫，可在「隊伍・武學」授予俠客。」; the hero page's tab is 「行裝」 and the team tab 「裝備物資」 | 2 | Replace with one name, 公庫, for the store (heading 「公庫」, message 「已收入公庫。」), and one name for the tab. | `ui/armory-views.js`, `armory`; `app.js`, `command`; `ui/bowl-views.js`, `bowlsPage`; `ui/company-views.js`, `personTabs` | none | likely |
| G3 | 俠客詳情 › 人物, footnote under the numbers, outside a battle | 「整備中」／「通吃坊・歇手中」／「盤邊候補」 | 1 | Remove outside a battle. In a battle the same line gives the tile and its effect, which is useful. | `ui/panels.js`, `profileContents` (`footing`) | none | certain |
| G4 | 俠客詳情 › 人物, two text buttons | 「整理行囊 ›」「修習 ›」 | 3 | Remove. The tabs 行裝 and 武學 at the top of the same page do the same. | `ui/panels.js`, `profileContents`; `app.js`, `command` (`inventory`, `skills`) | none | likely |
| G5 | 裝備物資, with nothing picked | 「拖曳兵器或護具至俠客立像，也可點選器物裝備。」 | 4 | Keep on desktop; on a phone Replace with: 「點選器物，再按「裝備」。」 | `ui/armory-views.js`, `armory` (`inspector`) | none | taste |

Considered and kept: 人物小傳 (a biography on the hero's own page, already folded); 「全隊共用 · 每次一份 · 保留行動」.

## H. 通吃坊 and 三盅通吃

At 390 px the first item starts at y ≈ 395: above it are the 貨架 bar, the 三盅通吃 card (about 90 px) and the board card (about 90 px) with the 本局紀錄 fold.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| H1 | Every item row: the name is the handle of a closed fold that holds only the item's description. For 15 of the items on sale the description has no number. The same text is the caption under a prize in 三盅通吃. | 青玉佩 「溫玉貼身，能助運氣行功。」 (it gives 絕技威力 ＋7); 玄鐵護腕 「皮革內縫有薄鐵片，能替佩者卸勁。」 (防禦 ＋3); 古墓長劍 「古墓派的輕劍，劍身細窄，出手極快。」 (攻擊 ＋5); likewise 青竹棒, 玄鐵重劍, 明教護腕, 胡家單刀, 金蛇劍, 華山長劍, 綠竹短簫, 精鋼軟鞭, 布纏護手, 古墓雙劍, 大理摺扇, 寒潭短劍 | 1 | Show the bonus line the armoury already builds (「絕技威力 ＋7」, 「攻擊 ＋5」) under the name on every row, always visible; keep the prose in the fold. The same line under a prize in 三盅通吃. | `ui/mastery-views.js`, `productRow`; `rules/journey.js`, `campModel` (`offers.description`); `ui/bowl-views.js`, `bowlsPage`; texts are `ITEMS[…].desc` in `rules/game.js`; the line is `itemBonus` in `ui/panels.js` | `tools/check-mechanics.mjs` checks 九花玉露丸's `desc` names every ailment (unaffected); `wiki/src/catalog/items.js` reads `desc` | certain |
| H2 | The board card under the 三盅通吃 card | 「韋小寶的通吃坊」「青竹渡」「此局已過 · ＋36 兩 · 袁承志入隊」 (after a loss: 「此局失利」) | 1, 3, 7 | Replace the card with one line: 「青竹渡 · 勝 · ＋36 兩 · 袁承志入隊」 (after a loss 「紅楓驛 · 敗」). 「韋小寶的通吃坊」 repeats the page's title, 「此局已過」 says nothing, and 韋小寶's portrait is already on the card above. | `ui/mastery-views.js`, `campRecap` | none | likely |
| H3 | The bar under the title | 「貨架」 beside the silver | 5 | Remove. It heads nothing: the bar holds only the purse, and the shelves below have their own headings. | `ui/mastery-views.js`, `campView` (`fy-shopbar`) | none | certain |
| H4 | The 三盅通吃 card (about 90 px) | 「通吃坊開局」「三盅通吃」「韋小寶 · 免費揭一盅」 and the button 「同他賭一手」 | 3 | Replace with one row: 「三盅通吃 · 免費揭一盅」 and the button 「揭盅」. | `ui/bowl-views.js`, `visitorInvite`; `VISITOR.title` | none | likely |
| H5 | The 本局紀錄 fold: what the 支線 paid is inside it, under a sentence of story | 「橋頭的鐵鏈鬆了。兩人眉心的戰意一散，各自退了半步，橋下流水重又穿過橋孔。」 then 「支線　支線達成：親手了斷。出陣生還的俠客各 1 武學點。」 | 7 | Put the 支線 result on the visible line (「支線達成：親手了斷，各得 1 武學點」 or 「支線未成：親手了斷」); keep the story sentence folded or drop it (it is also the log's 破關 line). | `ui/mastery-views.js`, `campRecap`; `rules/journey.js`, `campModel` (`objective`, `story`) | none | likely |
| H6 | 本局紀錄 after the leader falls | 「趙敏倒下，這一輪的眼破了。這一輪的眼破了。盤上的白子一齊暗了下去，收回盒中。求敗說道：「還差得遠。請回吧。」」 (the second sentence twice: the board's reason and `MAZE_TALE.loss` are joined) | 3 | Replace with the board's reason alone: 「趙敏倒下，這一輪的眼破了。」 The rest is the banner of the very next page. | `rules/journey.js`, `campModel` (`story: s.reason + MAZE_TALE.loss`) | none | certain |
| H7 | The parcel note in the last shop of a run, and the note on the next page | 「此處購得的物品與武譜將寄存，於下次啟程時領取。」 then on the summary 「買下的東西寄在通吃坊，下一輪照舊取用。」 | 3 | Keep the shop's, in the words the rest of the game uses: 「在此買下的東西會寄存，下一輪開局領取。」 Remove the one on the summary (it is shown even when nothing was bought). | `ui/mastery-views.js`, `shop` (`mj-parcel`); `MAZE_TALE.winNote`; `ui/journey-pages.js`, `journeyEnding` | `wiki/src/catalog/story.js` may quote `winNote` | likely |

Considered and kept: item descriptions that pair one flavour clause with the number (「青鋼劍身輕捷，攻擊增加 10。」); the manual's closing clause 「每冊限授一人，另花 2 武學點參悟。」; what 韋小寶 says over the bowls; the fold 這些東西的來歷; 「看清三樣東西後，扣盅換位。」 and 「選擇一盅，揭開即領取。」.

## I. 戰盤: tips, messages and the menu

The battle screen itself is clean at 390 px: the plaque, four icons, the hero card, three tools and 結束回合. The arts list is two compact boxes.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| I1 | Tip over the board during 起陣, three lines (74 px), held until the first tap | 「起陣 · 子還在手上，換得：點選一位俠客，再點另一位俠客或亮起的空格互換位置。一按「開戰」，落子無悔。」 | 2, 7 | Replace with: 「起陣 · 點一位俠客，再點另一位或亮起的空格換位。按「開戰」後不能再換。」 | `app.js`, `DEPLOY_TIP` | `單輪劇本.md` §11, row 落子無悔 (「一句」); `MAZE_TALE.deploy` and `MAZE_TALE.inHand` hold the same wording and the game no longer uses them (the wiki quotes `inHand`) | likely |
| I2 | Tip when a master changes at half 氣血, held 4.8 seconds: it shows the story line when the board has one, not the rule | 「半血變招 · 遁走 · 血刀老祖刀勢一收，踏雪往藥草地退去。打到半醒，他那本算盤回來了：先養傷，再砍人。」 (likewise 歐陽鋒 and 岳不群) | 2 | Replace the tip with the plain line the same entry already has: 「血刀老祖 半血變招 · 遁走 · 氣血過半後退向最近的藥草地，三回合內只打身邊的人；在藥草地每回合回復最大氣血的 8%，回到七成五即止。」 Leave the story line in the log. | `app.js`, `notePhases` (it takes `phase.log` before `phase.note`); `data/encounters.js` | `單輪劇本.md` §11, row 半醒 | likely |
| I3 | Log line when the 引路燈 is lit | 「點亮了引路燈。盤外瞧這一局，瞧得清清楚楚了。」 | 1 | Replace with: 「點亮了引路燈。」 (the tip 「支線達成 · 取勝即得…」 follows at once) | `rules/game.js`, `holdObjective` | none | certain |
| I4 | The reason a board is lost on time (log, and the shop's 本局紀錄) | 「十二合已過。拓來的一念撐不住，散了。」 | 2 | Replace with: 「第十二回合結束仍未取勝，這一局輸了。」 Every other page says 回合, and 敗退 on 軍情 is worded exactly so. | `rules/game.js`, `check` | `單輪劇本.md` §11, row 一念易散 | likely |
| I5 | Log, two lines one after the other when a board is won | 「分得彩頭 36 兩，同行俠客各得 1 武學點。」 then 「又勝一局。同行的人，各自想起一點。」 | 3 | Remove the second from the log (or keep it and cut 「同行俠客各得 1 武學點」 from the first). | `rules/journey.js`, `settle`; `MAZE_TALE.step` | `單輪劇本.md` §11, row 想起一點 (「一句」) | taste |
| I6 | 選單: one entry, and a heading in 設定, use a word nothing else in the game uses | 「章回」 (it replays the scene before the board) and 「章回存檔」 | 2 | Replace with: 「臨陣對白」 and 「存檔」. | `app.js`, `navItems`; `ui/panels.js`, `settingsPage` | none | likely |
| I7 | A button and the page it opens carry different names | 選單 「目標」 and the plaque's 「查看戰役目標」 open a page titled 「軍情」; 「石刻」 opens 「臺邊的五行字」; 「指南」, the title screen's 「遊玩指南」 and the tutorial's 「「選單」的「指南」」 open a page titled 「操作指南」 | 2 | One name each: in battle title the page 「目標」 (it is 軍情 only before the board); 「石刻」; 「遊玩指南」. | `ui/panels.js`, `briefPage`, `helpPage`; `ui/wake-views.js`, `journalPage`; `app.js`, `navItems`; `game/index.html` | `tools/check-wiki.mjs` matches the wiki's tag 「操作指南」 against the guide's paragraph count; `data/tutorial-text.js` names 「指南」 | likely |

Considered and kept: every short board tip (「請選擇範圍內的敵方棋子」, 「已回到走位 · 點選青綠色地格移動」, the reinforcement and 支線 tips); the out-of-reach message (「余滄海站在斜角，斜角不算相鄰，「王府快劍」打不到。再點一次可查探敵情。」: long, but it answers the commonest confusion on a turned board); the status words over a piece (「金剛護體，2 回合刀槍不入」); the end-of-turn box (「尚有 2 位俠客 可行動。」); the 選單 itself.

## J. 敵情查探, 守物／破物 and 交鋒預覽

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| J1 | 敵情查探, the biography beside the portrait, above everything the page was opened for (four lines, about 80 px, for a master) | 「青城派掌門，為林家的辟邪劍譜結下滿門血仇。他給落在橋頭，心裡只剩一個念頭：誰上橋便打誰。森冷一掌，能壓低對手的攻勢。」 | 3, 7 | Fold, as the hero's page does with 人物小傳. Its last clause is what the next block states with the number: 「摧心掌 … 令目標攻擊降低 3，持續至下回合。」 | `ui/panels.js`, `enemyPage`; `data/encounters.js` (bios) | `單輪劇本.md` §11, row 半醒 (「小傳與首次出現的一句」) | likely |
| J2 | 敵情查探, for a piece with no biography | 「對面落下的一枚黑子，守著這一局的要道。」 | 1 | Remove (show nothing). | `ui/panels.js`, `enemyPage` | none | certain |
| J3 | 守物／破物 page, the object's text (58 to 83 characters) and the rule line under its 氣血 | 七弦琴: 「琴臺上一張七弦琴，… 這一局的戰意對著它：琴斷，這一局便輸了。」 then 「守住它：撐過第八回合，或擊敗左冷禪。它一毀，這一局便輸了。」 | 3 | Cut the object text's last sentence (the rule line says it exactly), or fold the text. | `data/board-objects.js`, `BOARD_OBJECTS[].bio`; `ui/panels.js`, `objectPage` | none found | likely |
| J4 | 破物 page for a 星索樁 | 「星索護陣 · 立著一日，慕容博所受之傷便減 35%。」 | 2 | Replace with: 「星索護陣 · 未被擊毀時，慕容博所受傷害減 35%。」 | `ui/panels.js`, `objectPage` | none | certain |
| J5 | 交鋒預覽, the label on every row that is not one of six named kinds | 「招式連攜」 beside rows such as 「盾牆 · 傷害 −40%」, 「蓄勢反擊 · 還擊全力」, 「金剛 · 還擊無功」, 「回身 · 出招後尚可走 2 步」 | 5 | Use each row's own first word as its label, as the page already does for 代受, 號令, 化功, 不敗, 無招 and 問劍, and drop 「招式連攜」. Most of these rows are an enemy's trait, not a link between arts. | `ui/panels.js`, `attackPage` (the `f.notes` loop) | none | likely |

Considered and kept: the trait lines (「守在橋頭不動；有俠客踏入他的攻擊範圍，或他受到攻擊後，才離位追擊。」 and the rest); the few with a flavour clause before the rule (「掌力曲直如意：無視目標所在地形的防禦加成…」); 「立於苔石掩體。移動消耗 1 步，防禦增加 3 點。」; the preview's 招式與兵器特性 fold.

## K. 目標 (in battle) and 地形圖

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| K1 | 目標 in battle: the plan of the board (about 250 px) stands above the progress lines the page was opened for; the board itself is on screen behind the page | The plan and its key 「起陣格　局主　副手　敵方」, then at y ≈ 425 「戰局」, at y ≈ 545 「余滄海 氣血 104／104」 | 7 | In battle put the text first and fold the plan. Before the board (軍情) the plan stays where it is. | `ui/panels.js`, `briefPage` (`live`) | none | likely |
| K2 | 目標, the 棋局次序 fold, each row | 「青竹渡 · 雙岸竹渡 · 90 格」 | 1 | Replace with: 「青竹渡」. | `ui/panels.js`, `goalsPage` | none | certain |
| K3 | 地形圖, line under the title | 「雙岸竹渡 · 90 格 · 12 × 12」 | 1 | Remove. | `ui/panels.js`, `terrainPage` (`fy-geometry`) | none | certain |
| K4 | 地形圖, the list of ground kinds: all eight on every board | Listed though not on the board: 青竹渡 蘆葦淺灘; 紅楓驛 木棧橋, 蘆葦淺灘, 太湖石; 聽雪棧 渡口茶箱; 空山琴臺 and 桃花石陣 木棧橋, 蘆葦淺灘, 渡口茶箱; 襄陽殘垣 木棧橋, 蘆葦淺灘; 寒玉石室 and 無刻漏臺 渡口茶箱; 倒影天街 太湖石; 神龍竹堂 竹排; 絕情花徑 石樑; 鐵掌溪灘 獨木橋; 西夏夜苑 池畔淺水; 黑木繡閣 小石橋, 池畔淺水; 谷底棋臺 木棧橋, 蘆葦淺灘, 苔石掩體, 疏竹林, 藥草地. Only 蘆花汀 has all eight. | 5 | List only the kinds present on this board. (Several absent ones also carry the first board's names: a 渡口茶箱 on a snow ledge.) | `ui/panels.js`, `terrainPage` (`legend`); `data/terrain.js`, `terrainTypes` | `wiki/src/catalog/maps.js` builds its own lists | certain |

Considered and kept: the notes beside each kind (「移動消耗 2 步，防禦增加 5 點。」); 北 and 南; the log page and its filters.

## L. 一輪結束 (the run's last page)

This page is half story (the line on the stone, 夢醒) and half summary. Only the summary half is listed.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| L1 | The banner after a loss: the outcome four times | Title 「眼破」, seal 「破」, heading 「白子俱暗」, paragraph 「這一輪的眼破了。盤上的白子一齊暗了下去，收回盒中。求敗說道：「還差得遠。請回吧。」」 | 3 | Remove the paragraph on this page: the scene two pages earlier ends on 求敗 gathering the stones and saying 「還差得遠。請回吧。」, and the shop's 本局紀錄 printed it again. (After a win the same holds for 「十局下完，… 「好棋。容老夫想一想。請回吧。」」.) | `ui/journey-pages.js`, `journeyEnding`; `MAZE_TALE.loss`, `MAZE_TALE.win` | `wiki/src/catalog/story.js` quotes both; `單輪劇本.md` §11, row 一輪結束的結語 | taste |
| L2 | The section 臺邊的石 after a loss | 「這一輪沒有下完。臺邊的石上，沒有多一行字。」 | 1, 5 | Remove the section after a loss: a heading over a sentence that says nothing happened. | `data/wake-tale.js`, `NO_MARK`; `ui/journey-pages.js`, `journeyEnding` | `tools/check-story.mjs` imports `NO_MARK` (sweep only); `wiki/src/catalog/story.js` | likely |
| L3 | The 臺邊的五行字 fold at the foot of the page | After a win it repeats, under 「第一行・利劍」, the paragraph shown in full a few lines above (「少年臨去回頭，見求敗取過一柄舊劍，在臺邊石上刻了一行字，…」) | 3 | Remove the fold from this page. It is on 抓子 and under 石刻. | `ui/journey-pages.js`, `journeyEnding` (`wakeJournal`) | none | likely |

Considered and kept: the three figures (此輪破局, 最遠走到, and 悟 once C3 explains it); 「此輪同行　趙敏、狄雲、洪七公、袁承志」; 「軟劍境界已開。下一輪入夢之前，可以選它。」; the line on the stone and 夢醒 after a win.

## M. 石刻

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| M1 | The page's title, and directly under it the handle of a fold with the same words | 「臺邊的五行字」 then 「臺邊的五行字　0／5 行」 | 3, 5 | On this page draw the contents without the fold; put 「0／5 行」 beside the title. | `ui/wake-views.js`, `journalPage`, `wakeJournal` | none | certain |

## N. 設定

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| N1 | Line under one of the three switches | 「棋格邊線」 over 「顯示全戰場地格輪廓」 | 4 | Remove the second line (it restates the first). 「章回存檔」 is under I6. | `ui/panels.js`, `settingsPage` | none | taste |

Considered and kept: 「移動、交鋒及回合提示音」, 「關閉後使用簡化特效。」, 「行動後自動存檔於此瀏覽器。」.

## O. 遊玩指南

Sixteen folded paragraphs, all closed when the page opens, so the page is short (907 px). Ten are fine as they are: 棋格與面板 (52 characters), 通吃坊與武譜 (74), 選擇俠客 (57), 攻擊與絕技 (152), 出手節奏 (130), 絕技的代價 (97), 護人與布陣 (139), 附加狀態 (253), 起陣 (90), 回合與養成 (149). 附加狀態 would read better as a list, one state to a line. The rest:

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| O1 | 一念江湖 (181 characters) | 「你在夢裡同求敗對弈。每一輪開局抓五枚白子，… 十局各有局主，給求敗的一道戰意壓著心神，非戰不可；勝了，他才醒得過來。白子勝滿十局，放還本尊。… 其他人倒下，下一局仍會回來。」 | 2, 3 | Retitle 「一輪的流程」 and Replace with: 「每一輪開局從五位俠客中留下三位，由你指揮。一輪十局，每局達成該局的勝利條件即過關，十局全勝便贏了這一輪。不是最後一局時，每勝一局加入一位新俠客；每局至多五人上盤。領隊倒下，這一輪便結束；其他人倒下，下一局仍會回來。」 (the 支線 sentence goes, since 支線 has its own paragraph) | `data/rule-terms.js`, `guideEntries` | `wiki/src/catalog/rules.js` prints every paragraph; `tools/check-wiki.mjs` requires the wiki to show as many as the guide has (the count does not change) | likely |
| O2 | 走位與地形 (121 characters) | Opens 「十局各有其形。」; names the first board's ground on every board: 「遇敵軍、太湖石與茶箱須繞道。淺灘和竹林耗兩步，過木橋只耗一步。」 | 1, 2 | Remove the opening sentence. Replace the middle with: 「遇敵軍和擋路的石頭、箱子須繞道。淺水與林叢耗兩步，橋與平地耗一步。」 | `data/rule-terms.js`, `guideEntries` | as O1 | likely |
| O3 | 環視戰場 (66 characters), and the keys named in 起陣 | 「拖曳可旋轉，滾輪或雙指開合可縮放。按住 Shift 拖曳可平移，觸控放大後以雙指平移。…」; 起陣: 「…或按 E、Enter…」 | 5 | Show the wording for the device, as the tutorial already does (`viewTouch`, `viewMouse`). On touch: 「單指拖曳可旋轉，雙指開合可縮放，放大後以雙指平移。按準星可定位目前俠客，按縮放百分比可回到全圖。」 | `data/rule-terms.js`, `guideEntries`; `data/tutorial-text.js` has the model | as O1 | likely |
| O4 | 想起武學 (75 characters) | 「俠客入局時只帶著手上最熟的一招，放在武學樹的根基一行。其餘的招式要花武學點數一招一招學回來，越往上越近他的成名絕學。成名的那一招排在最後，並帶著代價。」 | 2 | Retitle 「武學樹」 and Replace with: 「俠客入局時只會一招，列在武學樹最上面的「根基」一行。其餘招式要花武學點修習，越往下階數越高；最後一招最強，並帶著代價。」 On screen 根基 is the top row and 四階 the bottom, so 「越往上」 points the wrong way. | `data/rule-terms.js`, `guideEntries` | as O1; `單輪劇本.md` §11, row 從根長起 | likely |
| O5 | 敵援 (130 characters), first sentence; 支線 (98 characters) | 「求敗在局中也落子：棋臺上「嗒」的一聲，下一回合援軍便到。」; 「每局的支線在入局時抽定，是韋小寶另開的盤口，… 支線成也好、不成也好，只要取勝，求敗便再借出一位俠客。」 | 2, 3 | 敵援: remove the first sentence (the next says it plainly: 「援軍入場前一整個回合，入場處標出「援」字，…」). 支線: Replace with: 「每局入局時抽出一道支線，「軍情」與「目標」都看得到。點了名的支線，那位俠客須出陣。達成支線並取勝，另得賞銀、武學點或武譜。支線不影響過關，也不影響新俠客加入。」 | `data/rule-terms.js`, `guideEntries` | as O1; `單輪劇本.md` §11, rows 「嗒」 and 支線 | likely |
| O6 | The line of keys at the foot of the page, on a phone (two lines, 50 px) | 「1–4 招式　G 棋格　[ ] 旋轉　E 結束回合　Esc 撤步・返回　? 指南　D 敵方範圍　Tab 下一位」 | 5 | Hide where there is no keyboard. Also Remove the note beside 重看新手指引: 「在這一局把新手指引從頭再看一遍。」 (it restates the button). | `ui/panels.js`, `helpPage`; `ui/action-flow.js`, `flowHotkeys`; `ui/field-extras.js`, `extraHotkeys`; `data/tutorial-text.js`, `replayNote` | none | certain |

## P. 新手指引 (tutorial cards)

Eleven cards on the first board. They are the plainest text in the game, two short sentences each, written to this register on purpose. I would keep all of them, with one cut.

| ID | Where | Text today | Reason | Proposal | Held in | Depends on | Sure |
|---|---|---|---|---|---|---|---|
| P1 | The last card | 「其餘規則都在「選單」的「指南」裡，也可從那裡重看這份指引。指引到此為止。」 | 4 | Remove the last sentence; the card's button reads 「完成」. | `data/tutorial-text.js`, `TUTORIAL_TEXT.steps.guide` | none | certain |

---

## Text I looked at and would keep

- **The tutorial's cards and its skip message.** Plain, short, in the guide's register.
- **The 支線 lines** (twelve kinds: name, what to do, progress, why it was lost): 「於第 9 列、第 9 行的燈記結束一名俠客的行動，且該俠客仍須生還。」
- **Leader effects** (「距離領隊兩格內的敵人攻擊減少 3。」) and **the terrain notes** (「移動消耗 2 步，防禦增加 5 點。」).
- **The rule words** on fact badges, in the preview and on the enemy page. Terse, with the numbers.
- **Item texts that join one flavour clause to the number**: 「青鋼劍身輕捷，攻擊增加 10。」, 「刀身烏沉，重逾百斤，揮動須站穩腳步。攻擊增加 17，移動減少 1 格。」
- **The titles on the 境界 cards** (「深谷一枰逢稚子」 and the other four). Seven characters on the name's own line; they cost no room.
- **The names of the trees** (思過崖劍訣, 靈蛇島三劍錄 …) and of the leader effects. One phrase each.
- **The status words over a piece** (「定身，2 回合動彈不得」, 「金剛護體，2 回合刀槍不入」). Short, and the number is in them.
- **The enemy trait lines**, including the few with a clause of colour before the rule.
- **The board's 地勢 text** inside its fold on 整備. It says where the bridges, cover and herbs are.
- **Warnings and one-line instructions for controls that are not obvious**: 「按下「落子」時，這一輪會取代目前的存檔。」, 「出陣後可在戰盤上再換位置。」, 「可於戰前整備、通吃坊，或全隊尚未行動時換招。」, the out-of-reach message.
- **設定**, apart from N1.
- **Everything the brief set aside as story**: the prologue, the scenes, the night talk, what 求敗, 韋小寶 and the heroes say, the ending and its page, biographies on a character's own page.

## Pages where the problem is the layout, not the words

1. **軍情.** Five headed sections (戰局, 勝利, 敗退, 支線, 入局), four of them one line long. Merge 戰局 into 勝利 (D1) and put 入局 as a small line under 勝利: three sections, about 140 px less.
2. **整備 › 陣容.** In order: the 作戰目標 block (a copy of 軍情), the line-up cards, two empty posts, the 候補 box, an instruction, the 起陣圖 fold, then a pane for the picked hero that shows again the level, 氣血, 攻擊, 防禦 and 移動 already on his card, then the 地勢與敵情 fold. Fold 作戰目標 (E1), collapse the empty posts (E3, E4), and let the pane show only what the card does not: 內力, 射程, the leader effect, the arts by name, the buttons.
3. **武學 tab.** The tree starts at y ≈ 325 of 844. Removing the name row (F1) and thinning the header card (F2) brings it up about 100 px. Below the tree, the detail pane would end on its button if the origin note went into the fold (F5).
4. **裝備物資.** The hero's full-length figure (about 280 px) stands between the hero's name and the bag, so on a phone the items begin below the screen. A smaller figure, or the two slots beside the portrait, would show the bag at once.
5. **抓子.** A picture 170 px tall and three lines of instruction put the first card halfway down the screen, and the leader-effect card (the one thing that helps choose a leader) is below the fifth card. Shorten the picture on a phone, shorten the instruction (C1), and show the leader effect on the leader's card.
6. **通吃坊.** Two cards before the first shelf (H2, H4), and each item's effect behind a fold (H1).
7. **目標 in battle.** The plan before the progress (K1).
8. **一輪結束.** After a loss a picture 265 px tall stands between the banner and the three figures; the journal fold repeats what is above it (L3).
9. **The same thing in several places.** The journal 臺邊的五行字 is on 抓子, on the run summary and under 石刻. The paragraph for a lost run is in the scene, in the shop and on the summary. The reward for 支線 is said on 軍情, in 作戰目標, as a tip when it is met, in the log and in 本局紀錄. One home each would do.
10. **Dead text.** `ui/panels.js` still holds page builders nothing calls (`sheetPage`, `inventoryPage`, `skillPage`, `storyPage`, `resultPage`, `goalRows`, and the branch of `goalsPage` for a game without a run), and `rules/game.js` the lines of the old single board (`STORIES`, `VOICES`, `chapterScenes`, the `newGame` log lines; 「曲譜得全」 and 「渡口失守」 in `resultPage`). No player sees them, but the wiki's text listing shows them as game text. `MAZE_TALE.deploy` and `MAZE_TALE.inHand` are likewise unused by the game.

## In the story's own pages: text that I think overstays even as story (list only)

- **The premise retold in every enemy biography.** About thirty biographies each stop to say that the 戰意 is not the man's own (「他給落在橋頭，心裡只剩一個念頭」, 「這一回由不得他，兩隻腳自己往前走」, 「他認得出心裡那個念頭不是自己的，偏偏掙不開」 …).
- **「入局之時 … 手上只剩 … 要在局中想起」** closes every hero's 人物小傳 and is the whole of the same hero's 師承與行功 text: twice within one hero's pages, for all twenty-one.
- **The shop's opening paragraph twice after the first win**: 韋小寶 says it in the scene (`MAZE_TALE.opened`) and the log records a second version (`MAZE_TALE.shop`).
- **「請回吧」 three times at the end of a run**: in the last scene, quoted in the summary's banner, and in 夢醒's opening 「那一聲「請回吧」猶在耳邊。」
- **少年在棋臺邊瞧明白的事** (seven paragraphs, 36 to 105 characters, inside the journal): the rules of the scenes and the guide retold in the youth's voice.
- **The log's story twins**: 「嗒。求敗又落一子。下一合，人便到。」 beside 「下一回合，…自…入場。」; 「局主一醒，他心裡帶來的人便一個一個淡了。」 after every 斬將 win.
- **The 無名入盤 paragraph** on the ending's page and again on 選境界 before every later run (B3).
- **The board's victory sentence** (`CHAMBER_TALES[].victory`) as the log's 破關 line and again as the first line of the shop's 本局紀錄.

## What I could not check

- **交鋒預覽 on screen.** I read its rows from `attackPage` and did not play a blow, so J5 is from the code.
- **The half-氣血 tip (I2)** and **a real leader's fall (H6)**: both read from the code. The loss I saw was the developer window's 速敗, which showed 「（開發者模式）這一局作負。這一輪的眼破了。…」 in 本局紀錄.
- **The last board and what follows the ending.** The 問劍 briefing was printed from `boardBrief`, not seen; the 無名入盤 lines on 選境界 and 抓子 (B3), the summary after a won run (L3) and the ending's page were read from the code.
- **Which pieces reach the fallback biography (J2).** Every piece I checked in `encounters.js` has one; the line may be reachable only by old saves.
- **Landscape phone and desktop.** All measurements are from the upright phone (390 × 844).
- **Tutorial cards on screen** beyond the first (the rest were read in `tutorial-text.js`).
- **The story scenes** (`encounter-script.js`, `hero-voices.js`) were not audited, as instructed.
