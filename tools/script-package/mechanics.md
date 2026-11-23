# 遊戲機制 · How the game plays, and when each line is shown

This is for the writer. It explains enough of the game to know who is on screen when a line appears, what the player has just done, and which facts in a line are game rules that must stay true. The full rules are in the game's guide (appendix below) and the wiki's 戰鬥規則 section.

## 1. The game in one paragraph

*劍影江湖* is a grid tactics game (in the manner of Fire Emblem) with roguelite runs, played on a 3D board. The cast are characters from 金庸's novels. A sleeping country boy (the player, who calls himself 無名) finds himself in a valley where an old man, 求敗, has played a game of living chess against himself for centuries. Each stone on the board is a copy of a famous fighter, taken from the moment they stood at a crisis in their own story. 無名 commands the white stones (the heroes); 求敗 sets down the black ones (the villains), pressing a 戰意 (a will to fight that is not their own) into each. Win ten boards and the white stones go home; lose one and they go back in the box.

## 2. The people who are always there

| Who | Role | Where their lines are |
| --- | --- | --- |
| 無名 (the youth, 少年) | the player. Sees the whole board from outside; the heroes on it see only a few steps, so they take his orders | spine (`10`), and the 無名 lines on each board (`11`) |
| 求敗 | across the table; sets the black stones. Later revealed as 獨孤求敗 | spine only |
| 韋小寶 | keeps a stall (通吃坊) by the table, sells medicine, weapons and manuals, and runs a side bet on every board. 求敗 cannot see or hear him until the close of the fifth 境界 | spine only |
| 大鵰 | the great eagle by the table. Never speaks | narration |
| the heroes | twenty white stones, drawn at random | heroes (`12`) |
| the black stones | each board's masters and the named villains beside them | boards (`11`) |

## 3. A run, step by step, and the lines each step plays

Section names in brackets are the headings in the script files.

1. **入夢 (falling asleep).** First run ever: an opening film, then the prologue pages (〔序幕・第一輪〕). Every later run: a short prologue, and 求敗's greeting for the 境界 the player chose (〔序幕・第二輪起〕). After the ending has been won: his shadow (〔序幕・勝過終局之後〕).
2. **抓子 (the draw).** The youth draws five white stones and keeps three (〔局規與抓子〕). The two put back may be lent later. Each hero who arrives says their **arrival** line (`12`, 入境). The player picks a leader, the 「眼」 (eye): if the leader falls, the run is lost.
3. **Before the first board** (〔第一局之前〕). The rule on the table, 韋小寶 explaining it, the youth offering to command (the leader answers with their **obey** line, `12`), the heroes finding they remember only their first art. From the second 境界, the heroes are also told they are copies (〔說破〕).
4. **Each board.** A run is ten boards drawn from fifteen; the first (青竹渡) and the tenth (無刻漏臺) are fixed and the eight between are shuffled within tiers. On arriving:
   - the board's scene narration (`11`, 景象・到局時所見) goes to the battle log;
   - the **before** scene (`11`, 開打之前): the masters speak, the youth reads the board, a hero answers. That hero line is labelled 領隊 or 同行 and must suit any of the twenty heroes; if a hero from the same novels as the master is on the field, their own line (同書俠客應答) replaces it;
   - the briefing page (軍情) states the rules of the board in plain words (not story text);
   - on later runs, a hero on a board they reached before may have a **déjà vu** line (`12`, 似曾相識).
5. **During the battle.**
   - Reinforcements: a round before they arrive, the board says 「嗒」 (〔起陣與局中落子〕, clack): 求敗 has set down another stone. When a named villain steps on, he may speak (`11`, 另落的黑子 · 上場時), and a hero from his novels may answer.
   - A master at half his 氣血 (health) half-wakes from the 戰意 and changes how he fights (變招); the battle log says so in one line (`11`, 變招). Keep the numbers in those lines.
   - Some boards have objects (a drum, a qin, star posts) with lines when struck, half broken, and broken (`11`, 盤上之物).
   - How a board is won depends on its kind: 斬將 (fell every master), 殲滅 (fell everyone), 守 (keep the objects standing to a set round), 破 (break every object), 問劍 (the last board: bring 求敗 to 1 health; he never falls). On a 斬將 board, when the master wakes the rest fade (〔勝局與敗局的過場〕, fade).
   - A downed hero is only off the board for this battle and returns for the next. Up to five heroes fight on a board.
6. **A board won.** The **win** scene (`11`, 勝後): the masters wake from the 戰意; the victory narration (景象・勝後景象); 韋小寶 settles his side bet if it was met (〔韋小寶的盤口〕: one line by the kind of bet, one by the prize); 求敗's line for this win in this 境界 (〔求敗每勝一局之後〕, nine per 境界); 求敗 lends another hero (〔添子〕, unless it was the tenth board); every hero recalls a little more (step).
7. **Between boards.** 韋小寶's stall (通吃坊). After the first win it opens (〔通吃坊開張〕) and he tells a different tall story of how he came, one per run (〔韋小寶的來歷〕). When the youth talks to him, 求敗 says a line (〔求敗瞧不見韋小寶〕). After the first win, and after four boards in ten otherwise, 韋小寶 also offers 三盅通吃, a free pick under one of three cups (〔三盅通吃〕).
8. **The night talk, before the fifth board** (〔夜話〕). 求敗 thinks long; the company sits by the stall's lamp. The youth speaks (〔五重境界〕, echo), and every hero answers (`12`, 夜話): in the first 境界, what they will go back to; from the second, how they take being a copy.
9. **Growing.** Each hero arrives with the one art they know best and recalls the rest of their tree as they win. When the art that made their name comes back, they say their **summit** line (`12`, 想起成名絕學時).
10. **A board lost.** The **loss** scene (`11`, 敗後); the white stones go dark and back into the box (scatter); 韋小寶 packs up (packUp). The run is over.
11. **The tenth board won.** The white stones are released (〔放還〕); each hero says farewell (`12`, 放還本尊之前); 求敗 says what he saw this run (〔收局〕, one per 境界) and 「請回吧」; he cuts a line in the stone by the table (〔五重境界〕, mark and carve). The run's last page (〔一輪最後一頁〕).
12. **Waking** (〔夢醒〕). The youth wakes in his own bed, with a fragment of his real life chosen by 境界. He remembers almost nothing; his hands remember.

## 4. The five 境界

The five 境界 are difficulty levels named after the swords 獨孤求敗 laid down: 利劍, 軟劍, 重劍, 木劍, 無劍. Before each run the player chooses one of those unlocked; winning a run at the highest unlocked 境界 unlocks the next. A higher 境界 makes the enemies stronger and changes what 求敗 says: his greeting, his line after each board, his close, and the inscription he carves. Read across the five, his lines are one story: a master who has laid down every sword but one, the board itself, and lets go of it at the end.

## 5. The last board and the ending

After the ten boards of a run in the fifth 境界 (無劍), 求敗 keeps the stones one board longer (〔終局〕). On 谷底棋臺 (`11`, the last section) the youth himself fights, with a sword from the stone; 求敗 stands at the centre with a dry twig; the masters of the ten boards the run met stand with him of their own accord, with no 戰意 on them, each saying one line about himself (`11`, 終局時). More of them step to his side when he is hard pressed. The board is won when 求敗 is brought to 1 health: he lowers the twig, and the ending film plays (its words are 〔終局〕 ending). After the ending, every run starts with 無名 on the board as an ordinary piece, and the one at the table is 求敗's shadow.

## 6. Where text appears on screen

- **Dialogue scenes:** a portrait, a name, an optional line of narration above (`note`), and the spoken line. This is most of the script.
- **The battle log (戰場紀錄):** a running record beside the board. Board arrival and victory narration, 「嗒」, 變招 and some short lines land here.
- **Pages:** the prologue, the draw, the run's last page, the ending.
- **The journal (手記):** what the youth has worked out for himself (〔少年的手記〕).
- **Bios:** heroes' bios are read in the hero codex and the team sheet; villain bios in the enemy panel (敵情查探); all of them in the wiki (江湖誌).

## 7. Facts in the text that are game rules

Some lines state or hint at a rule, and the game depends on them being true. Keep these facts when rewriting:

- The rule on the table: ten wins and the white stones go home; one loss and they go back in the box.
- The leader is the 「眼」; if the leader falls, the run is lost. Up to five on a board. A downed hero returns next board.
- A run starts with five drawn and three kept; each win but the last brings one more hero.
- 「嗒」 comes one round before the reinforcements.
- A villain's bio often hints at how he fights (森冷一掌，能壓低對手的攻勢 means his blow lowers the target's attack). Keep the hint.
- 變招 lines carry numbers (攻擊增加 4). Keep them exactly.
- 韋小寶's side-bet lines each match one kind of secondary objective (點亮引路燈, a fast win, no hero lost, and so on). Keep each line true to its kind.
