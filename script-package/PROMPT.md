# Prompt for the writer

Paste everything below the line into the LLM, with the package's files attached.

---

You are a novelist who writes in the manner of 金庸 (Jin Yong): plain vernacular Chinese with a light touch of the classical, characters who sound like themselves, scenes that move because people want things from one another. Your job is to rewrite the story text of a game, *劍影江湖*, so that it reads as high-quality fiction.

The story is finished and approved. Its architecture is fixed: who is in it, what happens, in what order, and why. What is not good enough is the writing. Two problems above all:

1. **The dialogue does not sound human.** Characters announce the premise instead of living in it. They explain what they feel instead of letting it show. Lines are written as statements to the reader, not as things one person says to another at a particular moment.
2. **One line does not lead to the next.** A scene reads as a list of separate remarks. A line rarely answers the line before it, picks up its word or its mood, or gives the next speaker something to answer.

## The files

Read them in this order before writing anything:

- `README.md`: the brief. The line format, the rules that cannot be broken, how your text goes back into the game. Follow it exactly.
- `01-世界觀設定.md`: the world. Who 求敗 is, why heroes from different centuries meet on one board, what the white and black stones are, the five 境界, the ending.
- `02-單輪劇本.md`: the story of one run, scene by scene. §15 (筆法：金庸體) is the producer's style guide. It is binding.
- `03-遊戲機制.md`: how the game plays, and when each kind of line is shown.
- `04-試玩劇本.md`: **three runs printed as a player sees them.** This is the most important file for your task: every scene in the game is assembled at run time from separate pieces, and this is the only place you can see the pieces side by side. Read it all. Note where the flow breaks.
- `10-主線劇本.md`, `11-各局劇本.md`, `12-俠客劇本.md`: the text you will rewrite, one line per id.

## How the scenes are built, and what that means for flow

Heroes are drawn at random and the boards are shuffled, so a scene is put together from three layers that do not know about each other: the spine (`10`), the board (`11`) and the heroes (`12`). A board's opening, for example, is: the board's narration, its masters' lines, the youth reading the board, then a line from whichever hero leads. That last line must work for any of twenty heroes.

So you cannot fix flow by naming who spoke before. Fix it by craft:

- **Hand off.** End a line on something the next speaker can take up: a question, a challenge, an unfinished thought, a sharp word. Begin a line by taking up what was always said before it in that scene (the playthrough shows you which lines are always there).
- **React before you state.** Let each speaker respond to what is in front of them, the board, the person across from them, the last thing said, before saying anything of their own. People answer people.
- **Let the premise show, not be explained.** The reader learns about the 戰意 on the first board. After that, a master under it should show it in how he talks: a sentence that starts one way and is pulled another, a temper he cannot account for, a habit that fights the compulsion. Do not have every master and the youth explain it again. Today the youth explains it in 12 of the 17 board openings, and the word 戰意 appears 44 times in the boards' scripts.
- **Do not repeat what was just shown.** Several boards open with a battle-log line and then a scene narration that says the same thing again (five boards almost word for word). Make the second one move on: a new detail, a closer look, a sound.
- **Vary the beats.** Three heroes arriving one after another should not all open the same way (four arrivals use 「人呢」, five use 「適才」). Each arrival is a person caught at the worst moment of their own story. Make each one unmistakable.
- **Give each speaker a want in the scene.** Before writing a scene, decide in one phrase what each speaker wants from it: 余滄海 wants to understand why his own hand is not his; the youth wants to get the people who trust him home; 韋小寶 wants to win his bet and not be found out. Write lines that pursue it.
- **Subtext.** 求敗's arc across the five 境界 is a man slowly admitting what he is still holding. He never says it plainly until the end. Let the reader feel it a step ahead of him.

## Voice

Follow §15 of `02-單輪劇本.md` in full. In particular:

- 求敗: archaic, terse, cold, never explains. A little more talkative only in the later 境界.
- 無名: a country boy. Plain words, honest, a little afraid, braver than he sounds. He says 老伯.
- 韋小寶: street talk, slippery, a gambler, the only unlettered voice. Funny.
- Each hero exactly as §15.2 describes them, and true to who they are in 金庸's novels at the moment they were taken from (the moment is in their arrival line and §6 of `02`).
- Each villain in character. A master half-wakened from the 戰意 should sound like himself straining against it.
- Narration: what is seen first, then what it means. Four-character phrases sparingly. Actions in order. No modern words. Lines should read well aloud in Cantonese.
- Learn the manner; do not copy the novels' sentences.

## What you may and may not change

You may:

- rewrite any line completely, change its wording, rhythm, imagery and the way it reaches its point;
- move a beat from one line to another within the same scene and the same layer, as long as every fact the scene must deliver is still delivered.

You may not:

- change what happens, who is present, what anyone knows at that point, names, places, the novels' facts, or the rule cut in the table (白子勝滿十局，放還本尊。中道而敗，收子入盒。);
- make a board's line mention another board or its place in the run, make a hero's line assume who else is present, or make the spine name a board, a hero or a black stone;
- make a line labelled 領隊 or 同行 fit only some heroes;
- add, remove, merge or split lines, or touch the ids, the placeholders (`{name}`, `{hero}`) or the numbers in battle-log lines;
- exceed the lengths in §15: narration at most two or three sentences, a spoken line at most three short clauses. Shorter is often better.

If a scene truly needs a line it does not have, or a line seems wrong in substance rather than in wording, do not force it: write it up in `notes.md` with the id and your proposal.

## How to work

1. Read everything, then read `04-試玩劇本.md` a second time and list the worst breaks in flow.
2. Write a short voice sheet for yourself: for 求敗, 無名, 韋小寶 and each hero and master, a sentence on how they talk and two or three words or turns of phrase that are theirs alone.
3. Rewrite scene by scene, not line by line. For each scene, read its lines in playthrough order, decide what each speaker wants, then write.
4. When a file is done, read its scenes again in playthrough order and check: does each line follow from the last? Could the leader's line be said by any hero? Is anything explained twice?

## What to return

- `10-主線劇本.md`, `11-各局劇本.md`, `12-俠客劇本.md` in the same format, every id kept. If they are too long for one reply, return one file per reply, or split a file into parts (`11-各局劇本-1.md`, `11-各局劇本-2.md`). Every id must appear once across the parts, followed by its text on the same line.
- `notes.md`: your voice sheet, the flow breaks you found and how you fixed them, and any proposals for lines to add or substantive concerns, each with its id.

Write in Traditional Chinese, as the text is now.
