# 劍影江湖 · Script package for a prose edit

This package holds the whole story of the game *劍影江湖* (WuxiaChess): the world, the story design, every line of in-game story text, and how the game plays. It is meant for a writer, human or AI, who will **rewrite the text as good fiction without changing the story**. The instructions for that writer are in `PROMPT.md`.

## Your task

The story, the structure and every plot beat are approved and stay as they are. What needs work is the writing: dialogue that sounds like people talking to each other, one line leading to the next, and prose worthy of 金庸. Rewrite lines in `10-主線劇本.md`, `11-各局劇本.md` and `12-俠客劇本.md`, and return those three files. `PROMPT.md` sets out the task in full.

Lines in this package: S001–S271 (271 lines), B001–B370 (370), H001–H223 (223): 864 lines, about 26,000 characters.

## What to read first

| File | What it is | Edit it? |
| --- | --- | --- |
| `README.md` | this brief | no |
| `PROMPT.md` | the task for the writer: what is wrong with the writing now, and how to work | no |
| `01-世界觀設定.md` | the world: who 求敗 is, why heroes from different centuries meet on one board, the rules of the sword realm (劍境), the five 境界 and the ending | no, background |
| `02-單輪劇本.md` | the story of one run, scene by scene, and **§15 筆法：金庸體, the style rules** | no, background |
| `03-遊戲機制.md` | how the game plays and when each kind of line appears | no, background |
| `04-試玩劇本.md` | three runs played by the game and printed as a player sees them, with each line's id as ［S012］. The only place to see how lines from different files follow one another | no, read it closely |
| `10-主線劇本.md` | the spine: prologue, 求敗's lines, 韋小寶, the close of each run, the last board and the ending | **yes** |
| `11-各局劇本.md` | the fifteen boards and the last board: each board's scene, its masters' lines, bios | **yes** |
| `12-俠客劇本.md` | the twenty heroes: bio, tree introduction, and their own lines | **yes** |
| `manifest.json` | maps each line id back to the game's source | no, leave it alone |

## The format: one line, one id

Every editable line looks like this:

```
- **求敗**　〔S012〕咦。老夫這劍境之中，幾百年來不曾有人闖得進來。
```

- `〔S012〕` is the line's id. **Keep every id exactly as it is**, once each, on its own line.
- **Only the text after the id, up to the end of the line, is yours to change.** The label before it (`**求敗**`) says who speaks; changing it does nothing.
- Keep one line per id. Do not split a line in two, merge two lines, add new ids or delete ids. A line that needs no change may be left as it is.
- No line breaks inside a line. No Markdown inside the text.
- Headings and the `>` notes explain when a line is shown. You may ignore them in what you return; only the id lines are read back.
- **Placeholders** such as `{name}` (the youth's name) and `{hero}` (a hero's name) must stay, spelt exactly. A line whose placeholders change is rejected.
- Numbers in battle-log lines (`攻擊增加 4`) are game rules: keep them.

## The rules the story depends on

These are not style preferences. Breaking one breaks the game, because the game assembles each scene at run time from pieces that do not know about one another.

1. **Three layers that never refer to one another.** Heroes are drawn at random and the boards are shuffled every run.
   - A **board's** lines (`11`) never mention another board, a board's place in the order ("the third board"), or any particular hero, except in the lines marked 同書俠客應答, which belong to one named hero.
   - A **hero's** lines (`12`) never assume who else is present or which board is being played.
   - The **spine** (`10`) never names a board, a hero or a black stone. 求敗 never says which board was just won.
   - Lines labelled 領隊 or 同行 may be said by any of the twenty heroes, man or woman, young or old. Keep them neutral.
2. **Who knows what.** The youth forgets each run when he wakes; 求敗 remembers every move; the heroes are fresh copies each run and know nothing of earlier runs (their 似曾相識 lines are only a feeling). 求敗 cannot see or hear 韋小寶 until the close of the fifth 境界. Until the second 境界 the heroes do not know they are copies.
3. **Facts stay.** Names, places, the rule cut in the table (白子勝滿十局，放還本尊。中道而敗，收子入盒。), what each scene says happens, and every reference to the original novels. Do not add events, characters or backstory, and do not take any away.
4. **Length.** Narration is at most two or three sentences; a spoken line at most three short clauses (§15). The text is shown in a small dialogue box. A line may be shorter or longer than it is now within those limits.

## The style the producer wants

The producer's instruction is that all story text is written in 金庸's manner. The full rules, with examples, are §15 of `02-單輪劇本.md`. In short:

- **Narration:** plain vernacular as the bone, a touch of classical function words (只見、但見、當下、登時、不由得、兀自、便如). What is seen first, then what is thought. Four-character phrases to set a scene, mixed with longer sentences; never more than three in a row. Actions in order.
- **No modern words.** No 複本, 模擬, 系統, 數據, 狀態, and nothing that sounds like a game interface.
- **Forms of address fit the speaker** (老夫, 在下, 老子, 小僧, 老叫化 …; the list is in §15.2). Each hero's voice is set out in §15.2: 郭靖 plain, 黃蓉 quick and fond of rhetorical questions, 令狐冲 never three lines from wine, 小龍女 spare, 段譽 bookish, and so on.
- **求敗:** archaic, short, cold; few exclamations; he does not explain. He grows a little more talkative only in the later 境界.
- **The youth (無名):** a country boy. Honest, plain words, no literary airs. He says 老伯, not 閣下.
- **韋小寶:** street talk, slippery, a gambler, the only unlettered voice in the game; the occasional 辣塊媽媽.
- **Black stones (the villains):** each in character: 岳不群 all propriety, 丁春秋 boasting, 血刀老祖 coarse, 歐陽鋒 scrambled.
- **Reads well in Cantonese.** Avoid northern colloquialisms (no 兒化; 咱們 and 您 only for characters who speak that way in the novels, and rarely).
- Learn the manner; do not copy passages from the novels. Quote martial-art mottos or inscriptions only in short phrases.
- Traditional Chinese characters throughout, as now.

## What to send back

The three files `10-主線劇本.md`, `11-各局劇本.md` and `12-俠客劇本.md`, with every id line still in them. If they are too long for one reply, return them one at a time, or split a file into parts (`11-各局劇本-1.md`, `11-各局劇本-2.md`): every id must appear once across the parts. An id left out keeps its current text. If you want to explain a choice or flag a line you think is wrong in substance (not only in wording), put it in a separate file, `notes.md`, citing the id. Do not change the substance of a line to fix it; flag it.

## For the producer: bringing the edit back

Put the returned files in a folder (for example `script-edit/`), and run, from the repository:

```bash
node tools/script-package.mjs --apply script-edit --dry   # report what would change
node tools/script-package.mjs --apply script-edit         # write the changes into the game
node tools/check-story.mjs && node tools/check-wiki.mjs
python3 tools/extra-fonts.py --check                       # new characters need the font supplements rebuilt
```

The tool reads only the files whose names start with `10-`, `11-` or `12-`, so `notes.md` and the rest are never taken as edits. It writes each changed line back into the game data file it came from, and only that line. It refuses a line whose placeholders changed, a line that came back empty, and a line whose source has been edited since the package was made. `node tools/script-package.mjs` rebuilds this package from the current game.
