# Rule words, second pass: from 94 to about 39

2026-11-25. A proposal for the producer, after the producer approved the recommended scope of the first pass (`rule-words-2026-11-23/README.md`, Q-N132) and asked for more: 「94 rule words are still too many … I want to lessen the burden on the player to understand all the words.」 **Nothing built.**

## The test a word must pass

The first pass asked "is this rule the same as another?". This pass asks what a player must *learn*. A rule word stays only if both hold:

1. **It leaves a state on a piece that the player must track over rounds**, and that state is more than a number going up or down; or it names a mechanic shared by many cards whose plain sentence would be long.
2. **The player meets it often**: on many cards, or on every board.

Everything else stays in the game exactly as it is, but becomes **a plain sentence on its card** (the first pass's "Fold"). The card already prints the rule in full; the glossary becomes optional reading. No number changes in any row below, so the simulator must give identical games before and after, as in the first pass's part A.

## The cuts, by family (counts after the first pass as approved)

| # | Family | After pass 1 | After pass 2 | What happens |
| --- | --- | --- | --- | --- |
| P1 | Enemy traits | 26 | 3 | Twenty belong to one enemy each; they become sentences on that enemy's page (敵情查探 already prints them). Keep the three that many enemies share: 蓄勢 (31 entries), 坐鎮 (16), 變招 (5). 偏好 becomes a sentence (「專找落單的俠客」). |
| P2 | Battle and run (戰局) | 12 | 3 | 軍情, 起陣, 入局 and 敵方範圍 are screen names, not rules: they leave the glossary for the guide's how-to page. The five win kinds (斬將, 殲滅, 守, 破, 問劍) and 敗退 become one entry, **勝負**, with a line for each; the briefing already states the board's own. Keep 援軍 and 支線. |
| P3 | Stat ups and downs | 6 | 1 | 攻勢受挫, 破防, 振奮, 輕身, 絆足 and 固守 only move a number for some turns. With the first pass's arrow badges (攻↓ 防↓ 攻↑ 移↑ 移↓ 防↑) the badge says it all. One entry, **升降**, explains the arrows; the six names leave cards, badges and the log (「攻擊 −5，兩回合」). 解厄 still lifts the downs. |
| P4 | Prices of an art (絕技的代價) | 5 | 1 | 露空, 無守, 立樁 and 曲終 each limit the caster next turn. One word, **代價**, and the card says which: 「代價：下回合防禦 −6」, 「代價：下回合不能還擊」, 「…不能移動」, 「…不能施展武學」. The badge on the piece is the matching arrow or limit, drawn with a lock so it reads as unliftable. 亂氣 stays (it stacks to a burst). |
| P5 | Conditional power (看準時機) | 6 | 2 | 孤行, 黯然, 還報 and 斬殘 become plain conditions on the card (「身旁無同伴時倍率 ＋0.30」, 「自身氣血不過四分之三時 ＋0.45」). The preview already says met or unmet (first pass C5). Keep 破招 (令狐冲 and 無名 are built on it, and 求敗's 無招 reads by it) and 合璧 (the pairs are story). |
| P6 | Basics of a strike | 12 | 7 | Fold 範圍 (「及身旁兩格的同伴」), 連擊 (「連擊三次」 reads itself), 身法 (three carriers), 吸元 (「回復所造成傷害的 50%」) and 自耗氣血 (shown as a cost beside 內力). Keep 還擊, 免受還擊, 穿透, 濺射, 擊退, 療傷, 待命. |
| P7 | Tempo | 4 | 2 | 壓箱 and 調息 are use limits: the card prints 「每局一次」 or 「隔兩回合」 and the art list greys it with the rounds left. Keep 連環 and 回身, which give actions. |
| P8 | 戰鬥效果 | 6 | 4 | 渡氣 becomes a sentence (「同伴回復 6 內力」). 穿行 becomes a 濺射 shape (「濺射 · 身後兩格 45%」), as 廣及 did. 絆足 went in P3. Keep 破綻, 截勁, 牽引. |
| P9 | Gear | 3 | 2 | 兵器效果 is a heading, not a rule. Keep 反震 and 服藥. |
| — | Guards, conditions, leader | 8 + 11 + 1 | 5 + 9 + 1 | Guards keep 代受, 挑釁, 布陣, 閃身, 挪移, with 護盾 and 金剛 counted with the conditions (固守 went in P3). Conditions keep 中毒, 內傷, 纏械, 截勁's ladder 閉穴 and 定身, 受制, 護盾, 金剛, 亂氣, 解厄; the stat ones went in P3. Keep 領隊陣法. |

**Result:** about 39 words, against 94 after the first pass and 123 today. The exact count moves by one or two with how 護盾 and 金剛 are filed.

## Two changes in how words are taught, not counted

- **A first tier of about 12.** The words of the first boards, taught by the tutorial and shown first in the guide: 還擊, 免受還擊, 濺射, 擊退, 療傷, 待命, 連環, 截勁 / 閉穴 / 定身 as one ladder (點穴), 中毒, 護盾, 領隊陣法, 勝負. The guide's `guide: true` flag (20 terms today) becomes this tier.
- **Show only what is on the board.** The guide and the arts list name a word only when a fielded hero's art, an item in the stores or a piece on this board carries it, with the rest one tap away. A player meets a word when it matters, not in a list of forty.

## What it touches

`game/src/data/rule-terms.js` (the terms and `PLAIN_FIELDS`), `game/src/rules/move-facts.js` (the card sentences), `game/src/data/encounters.js` and `enemyTraitLines` in `game.js` (enemy sentences), `game/src/actors/tokens.js` (badges), `game/src/ui/panels.js` (the guide), the tutorial text, and the wiki's rule pages, which `check-wiki` builds from the terms. `check-wiki` fails when a mechanic has no page; a folded field must be listed in `PLAIN_FIELDS`, as in the first pass.

## Judgement calls

1. **P3 drops six familiar names.** Players who have read 破防 on a card lose the word; the arrow replaces it. The 金庸 flavour of 振奮 and 輕身 goes with them. Alternative: keep the names in the log and on the art card, and use only arrows on badges.
2. **P1 makes enemy pages sentences only.** The wiki would list enemy behaviour per enemy rather than per word.
3. **P4 keeps the badge but loses the name.** 獨孤九劍's line 「有攻無守」 still reads, but 無守 is no longer a term.
4. **P5 folds 孤行 and 黯然,** which are 楊過's identity. The words can stay in his lines and art names without being rule words.
