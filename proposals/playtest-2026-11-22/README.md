# Playtest review, 2026-11-22

A UI/UX review of the whole game by nine simulated first-time players, three on each screen format (phone portrait, phone landscape, desktop). Asked for by the producer. Nothing in the game was changed.

- This page: the consolidated review. Each finding has an id (`R-01` …) and names the reviewers' own findings it merges (`P1-03`, `L2-06` …). D2's report numbers its own findings `P-D2-NN`; they are cited here as `D2-NN`.
- `reports/`: the nine reviewers' full reports, each with a play diary, numbered findings and a verdict. Screenshot paths inside them point at the review session's scratch folder, which was not kept.
- `shots/`: ten screenshots that show the main problems.
- What to build from it is `ROADMAP.md` item 0.30; the decisions it needs are Q-N125 to Q-N131.

## 1. The short version

**The game makes a strong first impression and then loses people in the first battle.** Every reviewer praised the writing, the art, the attack preview (交鋒預覽) and the saving. Every reviewer also stumbled on the same few things, and none of them is about content: they are about being told what to do, and about taps doing what the player meant.

| | First impression | Clarity | Comfort on the format | Wants to keep playing |
| --- | --- | --- | --- | --- |
| Phone portrait (3 reviewers) | 7.3 | 5.0 | 4.7 | 6.3 |
| Phone landscape (3) | 7.7 | 4.3 | 5.3 | 5.7 |
| Desktop (3) | 8.0 | 5.3 | 5.3 | 7.0 |
| **All nine** | **7.7** | **4.9** | **5.1** | **6.3** |

Scores are out of 10, each reviewer's own. Clarity is the weak number on every format.

**The ten things to fix first**, in order:

1. **A tap outside a story box throws the player out to the title screen** (R-01). Five reviewers hit it; I reproduced it. Before the first board it also replays the 45-second film.
2. **There is no guided first battle** (R-10). The rules live in a sixteen-section text guide that tells phone players to use the mouse wheel and the Shift key (R-11).
3. **Tapping an enemy that is out of reach opens its profile card instead of saying why** (R-14). All nine hit it, most of them many times. The "out of range" message exists, but on a phone the card opens over it. Diagonal neighbours look adjacent on the turned board and nothing says they do not count.
4. **Tapping a figure's body or head misses it; only its feet count** (R-15).
5. **A hero who picks an art before walking has no visible way back to walking** (R-16). Reviewers lost turns to it and took it for a bug.
6. **On the last board 求敗 cannot be told from the other masters** (R-44): every enemy carries the same 主 tag, the tags pile up, and arrivals are barely announced. All three reviewers who played it honestly lost within two rounds.
7. **Progress can be lost without warning in two ways**: the game open in two tabs, which the wiki's own 進入遊戲 link causes (R-02), and 另開新局 with no confirmation (R-03).
8. **On a phone, a swipe to scroll the equipment list equips the item under the finger** (R-04).
9. **The wiki's front page, one tap from the title screen, gives away the ending** and shows internal design documents (R-53).
10. **Text of 9 to 12 px across most panels**, with no size option (R-51), and rule words that are never explained where they appear (R-12).

On desktop, add an eleventh: **Enter and Space do not confirm the main action** (R-59). Enter cancels the end-of-turn box and closes the attack preview, and Space can skip a whole scene.

## 2. How the review was done

Each reviewer was a separate Opus agent driving a real headless Chromium by taps, drags, pinches, key presses, reloads and screen turns, looking at screenshots as it went. Each was told to stay ignorant of the source and the documents while playing, to play as one named person, to keep a diary of how the game felt, and to log every problem with severity, steps, evidence and confidence. Between them they took about 1,400 screenshots and logged 221 findings, which merge into the 63 below.

| Id | Format | Persona | What they covered |
| --- | --- | --- | --- |
| P1 | Phone portrait, 390 × 844 | 阿芬, 34, office worker, 金庸 reader, casual one-thumb player, new to tactics games | Cold start with no shortcuts: front page to a win on board 1 (round 7), the shop, the start of board 2 |
| P2 | Phone portrait | 志豪, 27, tactics-game veteran, impatient, wants numbers | The loop between battles: three boards, the shop, 整備 in depth, a guard board, a break board, a loss |
| P3 | Phone portrait | 陳老師, 58, retired Chinese teacher, weak eyesight, cautious, not at home with technology | The guide, settings, the wiki, the last board, the ending, small and large screens, turning and locking the phone |
| L1 | Phone landscape, 844 × 390 | 小凱, 19, plays 原神 and 明日方舟, skips story, taps fast, has read no 金庸 | Cold start with no shortcuts: front page to a win on board 1 (round 9), the shop, the start of board 2 |
| L2 | Phone landscape | Mei, 31, overseas reader who loves the television 金庸, reads literary Chinese slowly, new to tactics | The loop between battles, judged for plain-language clarity: three boards, the shop, 整備, a guard board, a loss |
| L3 | Phone landscape | 阿哲, 40, father of two, played 金庸群俠傳 on DOS, interrupted constantly | Reload, lock and screen turn at every kind of moment; two tabs; the last board; the ending; other landscape sizes |
| D1 | Desktop, 1440 × 900 | 老王, 45, mouse-first, expects hover, right-click and Esc to behave as in PC games | Cold start with no shortcuts: front page to a win on board 1 (round 7), two rounds of board 2 |
| D2 | Desktop | Iris, 29, strategy-game streamer, keyboard-first, wants every number inspectable | The loop between battles with every key tried: three boards, the shop, 整備, a guard board, a break board, the two-master board, a loss, `?classic` |
| D3 | Desktop | 子軒, 23, UI designer, resizes the window constantly | Visual consistency, seven window sizes, keyboard focus, the last board, the ending, five more boards, the wiki |

The cold-start reviewers (P1, L1, D1) never used developer mode. The others used it only to skip ahead.

**What I checked myself.** I reproduced R-01, R-14 and R-16 in a browser of my own, read the code behind R-01, R-02, R-04, R-14, R-16 and R-29, confirmed the text slips in the data files, and looked at the evidence screenshots for the layout findings. Each finding below says how sure it is.

**What this kind of review cannot tell you.** The reviewers could not hear sound. The game was drawn without a graphics card on a shared machine, so nobody judged frame rate or loading time. Real thumbs, notches and browser bars were reasoned about, not seen. A simulated player is more patient and more systematic than a real one, so where a reviewer says "I nearly closed the tab", a real player probably would have.

## 3. How it felt

The nine diaries describe the same arc:

1. **Delight** at the title, the film and the first story scene. "That's 獨孤求敗! I'm hooked at once" (阿芬). "Whoever wrote this has read the book" (陳老師).
2. **Unease** at the hero pick and 整備: five famous faces with no word of what each is good at, then a skill tree full of unexplained terms. "I'm here for 黃藥師, not homework" (阿芬). "I felt stupid more often than challenged" (Mei).
3. **Frustration** in the first battle: taps on enemies that "did nothing", no step-by-step help. "This is where I'd close the tab" (小凱). "I thought the game was broken" (阿芬).
4. **Pride** the first time the attack preview appeared. "This is the moment it clicked" (阿芬). "I can see exactly what will happen before I commit. Excellent" (陳老師).
5. **A flat win**: no victory moment, one small line of rewards. "Glad, but cheated of the moment" (阿芬).
6. **Charm** again in 韋小寶's shop and the next board's story, which is what brings most of them back.

Persona by persona:

- **阿芬 (P1)** stayed for the characters and nearly left twice, once in 整備 and once when her taps on enemies opened profile cards. On an upright phone held in one hand the board sits out of her thumb's reach and the buttons she needs keep moving. She would come back, "for the characters".
- **志豪 (P2)** is the one reviewer who found the game clear (7 for clarity): the forecast, the skill tree's exact numbers and the guard board's rules are what he plays tactics games for. What irritated him was waiting and re-tapping: no enemy-phase speed-up, a confirmation on every end of turn, four taps to equip a learned art, and a swipe that equipped a sabre he did not want.
- **陳老師 (P3)** loved the prose and was moved to tears by the ending film, and could not read much of the interface. "The print is too small and I still am not sure what each tap will do." He was afraid of pressing the wrong thing, and at the hero pick touching a card to read about a hero put that hero back.
- **小凱 (L1)** gave the lowest score for wanting to continue (4). He was thrown to the title screen three times by taps outside the story box, lost three turns to a hero he could not un-commit, and failed about eight attacks on diagonal enemies before he worked out the rule. "If a friend told me the rule I'd give board 2 a go; on my own I'd probably drop it."
- **Mei (L2)** kept a list of more than thirty terms that are never explained where they appear. She praised the previews for saying what will happen "in words" and the kind tone of the defeat scene.
- **阿哲 (L3)** found saving inside a board better than most phone games: every reload, lock and turn brought him back to the exact place. Then a second tab silently wiped a won board, and 另開新局 replaced a run without asking. "Betrayed", and afterwards "very nervous near the 另開新局 button".
- **老王 (D1)** grumbled as a PC player: hovering over a piece tells him nothing, right-click does nothing, and Space skipped the film when he meant to pause it. He would still come back, "for the story".
- **Iris (D2)** called the forecast and the enemy notes "Into the Breach-grade honesty once you click", and the build choices worth theorycrafting on stream. Then she pressed E and Enter to end her turn and the box closed instead. "This is the moment I said 'who designed this?' on stream." Enemy turns that cannot be hurried bored her, and would bore her viewers.
- **子軒 (D3)** gave the highest first impression (9) and a designer's list: crowded boards he could not read, dialogs that float small on a large screen, three names for one product.

## 4. Findings

Severity: **Major** is likely to lose or badly confuse players; **Minor** is friction most push through; **Polish** is cosmetic. Formats: P phone portrait, L phone landscape, D desktop. "Verified" means I reproduced it or confirmed it in the code or data; otherwise the count of reviewers who met it is given.

### 4.1 Losing your place or your progress

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-01 | Major | P L D | **A tap on the dark area outside a story, briefing, 整備 or shop page closes it and goes to the title screen.** So does Esc on the first prologue page, and the corner × of 整備 (its accessible name is 返回主畫面, but it looks like "close"). Progress is kept once a board has begun, but it reads as a crash. Before the first board, 入夢 then replays the film and prologue. Fast tappers hit it constantly because 下一句 moves (R-31). (L1-01 three times, P2-01 twice, D3-08, D1-15, D2-06, D2-18, and me) | Verified: reproduced; `dismissLayer` and the dialog's click handler in `game/src/app.js` | Story pages ignore outside taps, or advance a line. Give 整備 and the shop a labelled 主畫面 button only, not a × |
| R-02 | Major | all | **The game open in two tabs loses progress silently.** The older tab keeps its own copy and overwrites the newer save on its next action: a won board, the silver and a bought item were all lost. The wiki's 進入遊戲 link opens exactly such a second tab (`target="_blank"`). (L3-01, P3-17) | Verified in code: no `storage` listener anywhere in `game/src`; `wiki/index.html` line 46 | Reload or lock a tab when the save changes under it; make 進入遊戲 return to the same tab |
| R-03 | Major | all | **另開新局 replaces a run in progress with no confirmation.** It sits beside 繼續第一局; two 略過 and 落子 later the old run is gone. The only guard is one line of small text on the hero-pick page. (L3-02 twice) | 1 reviewer, twice | Ask first, naming the board that would be lost |
| R-04 | Major | P L | **A swipe that starts on an equipment card equips it.** In 整備 › 裝備物資 the whole card is a drag handle, so scrolling the list with a finger on a card starts a drag, and releasing over the hero's figure swaps the hero's weapon. No confirmation, no undo message. (P2-02 twice) | Verified in code: `game/src/ui/panel-drag.js` starts a drag after 6 px from anywhere on a card | On touch, drag only after a long press or only from the ⠿ handle |
| R-05 | Minor | all | **Fast taps on 修習 spend every 武學點, with no undo.** Three quick taps put all three points into one talent. (L1-08) | 1 reviewer | Let points spent in this visit to 整備 be taken back |
| R-06 | Minor | all | **Before the first board there is no "continue".** A reload during the film, the prologue or the hero pick returns to a title that offers only 入夢, and the film and prologue play again. The picks are kept, but the player cannot know that. (P3-13 three times, L3-05) | 2 reviewers | Remember that the film has been seen; offer 繼續 back to the pick |
| R-07 | Minor | P L | **The browser's back button leaves the game.** A phone user's back swipe exits instead of closing the open panel. Progress is safe. (P3-14, L3-06) | 2 reviewers; no history entries in the code | Push a history entry per panel, or ask before leaving |
| R-08 | Polish | all | **A reload forgets the view.** The camera returns to the far default, 整備 returns to the 陣容 tab with another hero picked, and from the shop's team page it lands on the title, then the shop. The title's 繼續整備 opens 軍情. (L3-07, L3-08, D1-23, P2-22, D2-29) | 4 reviewers | Keep camera, tab and hero; name the button after the page it opens |
| R-09 | Minor | P L | **The films keep playing while the phone is locked.** (L3-04) | 1 reviewer, twice | Pause when the page is hidden |

### 4.2 Learning the game

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-10 | Major | all | **No guided first battle.** The only on-board help is the 起陣 hint, which disappears at the first tap. Nothing shows: tap a hero, tap a lit tile, pick an art, tap an enemy, confirm, end the turn. (P1-03, L1-04, L2-24, P3-07, D3-19) | 5 reviewers | A skippable guided first turn on 青竹渡 (Q-N125) |
| R-11 | Major | all, worst on phones | **The guide does not serve a beginner.** Sixteen folded sections of dense prose with no pictures. It tells phone players to use the 滾輪, hold Shift, press E or Enter and point at tiles, and shows a strip of keyboard keys on a touch screen. It never says that only straight-line neighbours are adjacent, or how to cancel a chosen art. Eight conditions share one paragraph. 求敗 and 韋小寶 are named before they are introduced. The button is 遊玩指南 and the panel is 操作指南. Nothing on the first board points to it. (P1 diary, P3-06, L1 diary, L2-24, L3-19, D3-19) | 6 reviewers | Touch wording on touch devices; a first page of five pictured steps; conditions as a list |
| R-12 | Major for newcomers | all | **Rule words are not explained where they appear.** Mei's list (L2-06) has more than thirty, among them 凶, 盟令, 蓄勢, 未扣防威力, 重, 參悟, 悟, 眼, 境界, 起陣格, 支線燈記, the shop's 【走勁】【留隙】【定勢】, and the badges 縛 毒 弱 卸 隙 破 over pieces. Four words (可修, 可參悟, 已習, 未習) carry two ideas. Rules also use compass words (靠北、再靠西; 西岸; 自南渡口) on a board with no compass that the player can turn freely, and side goals, enemy notes and the log name rows and columns (「第 11 列、第 7 行」, 「守在橋頭（13，5）」) that the board never labels. The 軍情 plan's key leaves out some of its own tile colours. (L2-06, L2-15, L2-16, P1-15, D1-19, D2-23, D2-24) | 5 reviewers | Make each term tappable for a one-line gloss; put a compass on the board and on the 軍情 plan |
| R-13 | Major | all | **The hero pick (抓子) gives nothing to choose by, and a tap to look puts the hero back.** Cards show a name, a book and one art name: no role, no numbers, no details view. Tapping a kept hero's card returns him to the box, and if he was the leader the 領隊 mark moves to someone else without a word. The leader is chosen for the player, may be the frailest of the three, and "if the leader falls the run ends" is not flagged as a reason to choose carefully. Layout: in landscape the cards start below the fold; on desktop the cards are 112 px wide and three-character names wrap; 立為領隊 is 68 × 25 px and was once covered by the footer; folding 局規 shifts the list by 117 px under the finger; a small ◡ mark is cut off at each card's corner. The spread is wide: 楊過 has 184 氣血 and 黃蓉 70, and the player learns it only in 整備. (P1-08, P1-09, P2-07, P3-05, P3-23, L1-07, L2-01, L2-09, D1-20, D2-11) See `shots/hero-pick-phone-portrait.webp` | 8 reviewers | A role line and the six numbers 整備 already shows; tap opens details, a separate button keeps or returns |

### 4.3 The battle screen

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-14 | Major | all | **Tapping an enemy out of reach opens 敵情查探 instead of saying why.** With an art chosen, the game does raise 「目標在招式範圍外，可先移動或查探敵情。」, but the full profile card opens at the same instant: on a phone it covers the message; on desktop the message is a small grey line under it. The board is drawn turned 45°, 俯視 included, so diagonal neighbours look adjacent, and nothing says they are not. Reviewers failed four to eight attacks each before working it out. Art texts say 「1 格」 and never "four directions only". (P1-02, P2-03, P3-07, L1-03, L2-04, L2-05, L3-13, D1-12, D2-07, D2-08, D3-05) See `shots/out-of-range-card-phone.webp` | Verified: reproduced; the message sits under the dialog (`unitClick` in `app.js`) | While an art is chosen, do not open the card: flash the reason and the tiles in reach, and mark the enemies that can be hit |
| R-15 | Major | P L D | **Only a figure's feet are its target.** With the red reticle already on the master, a tap on his body opened his profile; a tap on his base opened the attack preview. A thumb aims at the figure. Tall figures also hide the tile behind them. (P1-01 twice, D3-05, P2-03) | 3 reviewers | While targeting, the whole figure resolves to its tile |
| R-16 | Major | all | **Picking an art before walking leaves no visible way back to walking.** Tapping the selected hero opens the arts list; picking an art puts him in aim mode; the move tiles vanish and there is no 撤步 (he has not moved) and no cancel. Tapping the ground and the hero again returns to the same state. Selecting another hero and coming back does restore the walk, but nothing says so, and it cannot help the last hero left to act. Reviewers ended the turn instead and lost the action. Related: after 撤步 the chosen art silently returns to the basic attack (P1-05), and after 撤步 a tap on another hero was read as a move order (L2-03). On desktop Esc closes a panel on the first press and silently undoes the move on the second (D1-09, D3-06). (L1-02 three times, L2-02) See `shots/art-picked-no-way-back.webp` | Verified: reproduced, including the way out | A 取消 in the arts list that returns to the move tiles; keep the art across 撤步; say 「已撤步」 |
| R-17 | Minor | P L | **One tap moves the hero who is already selected.** Each turn starts with the leader selected, so a tap meant to choose a hero, or to open his arts, walks him. 撤步 undoes it. (P1-18, L3-12, P2-10) | 3 reviewers | A clearer selected state, or a confirm step at far zoom |
| R-18 | Major on phones | P L | **The default view is too small and badly placed on phones.** Portrait: the board fills the upper half and the lower third is water, where the thumb is (already noted as 0.20 f). Landscape: figures are about 15 px tall, tiles 19 to 25 px. The view does not follow the selected hero, "reset" returns to the far view, a one-finger drag turns the board where phone players expect it to pan, and pinch, drag and the 視角 panel are never pointed out. (P1-04, L1-10, L3 diary, P3-22, L2-05) See `shots/battle-phone-portrait.webp` | 5 reviewers | Frame the heroes at about twice the size on phones; one hint the first time: 「雙指開合可放大」 |
| R-19 | Minor | all | **The arts list gets in the way and moves about.** Desktop: the pop-up opens over the enemies or the player's own heroes, with empty water to either side; at 900 px tall 撤步 is below its fold. Landscape: it jumps between the left and right edges, and the aim message at top centre covers where enemies stand. Portrait: its height changes with the hero, so the same button is at a different height each time, and the 已移動 message covers 撤步. After any modal it collapses to a pill that needs one or two taps to reopen. (D1-10, D1-11, D2-32, D3-13, L1-11, L1-12, L1-13, L2-25, P1-06, P3-20) See `shots/arts-popup-desktop.webp` | 7 reviewers | Dock it at one edge per format, with 撤步 always visible |
| R-20 | Major on desktop | D | **Pieces and marks do not explain themselves under the pointer.** Hovering a hero or an enemy shows no name, health or intent; the marks over heads (隙 破 毒 主 副 援, about 10 px) have no hover text; the pointer over the whole board is a grabbing hand. Tiles do get a route and a label. An enemy's ordinary move is named (快刀, 駝劍) and explained nowhere. To compare three enemies the player opens and closes three modal cards. Right-click does nothing anywhere. (D1-07, D1-08, D2-09, D2-10) | 2 reviewers, repeatedly | A small hover card (reuse the 敵情查探 summary); right-click cancels |
| R-21 | Minor | all | **The enemy's turn is hard to follow.** Conditions appear, heroes level up and heroes fall with no notice that stays; a hero felled in the enemy phase is simply gone. Opening 隊伍 or 藥囊 during the enemy phase hides the whole of it. There is no speed setting. The log under 選單 › 紀錄 is good and never pointed out. (P1-19, L1-09, D3-16, P2-05, D2-03, and 0.20 c) | 5 reviewers | A short "what happened" strip at the start of the player's turn; a speed option (Q-N131) |
| R-22 | Minor | all | **A win has no moment and no summary.** The last blow cuts to the story; rewards are one 12 px line (「此局已過 · ＋36 兩 · 張無忌入隊」); the side bet's result has no reason; 略過 skips the new hero's arrival. A win that lands during the enemy phase is not even seen. (P1-07, L1-16, P2-16, D1-14, D2-19) | 5 reviewers | A 勝 moment and one results card that skipping cannot jump past |
| R-23 | Minor | all | **Reading a crowded or busy board.** Health bars and badges overlap neighbours; a guarded object's bar hides under the heroes beside it. Pieces lose contrast on 寒玉石室, 黑木繡閣, 紅楓驛 and 桃花石陣. The purple danger overlay over the green move area turns to mud. Trees and roofs cover the board after a turn of the camera and do not fade. The grid toggle is nearly invisible on 青竹渡 and washes 紅楓驛 purple. (D3-14, D3-15, D3-21, P2-19, L2-17, L1-22, D1-25) | 5 reviewers | Outline-only overlays when two are on; fade scenery in front of pieces |
| R-24 | Minor | P L | **The top-right tools are icons without words, out of a thumb's reach.** The ⚠ danger zone is useful and found by accident. In full screen the button reads 「退出」 beside two red toggles and looks like "leave the battle". (P1-14, P3-10, L1-15) | 3 reviewers | Words under the icons; 退出全螢幕 in full |
| R-25 | Minor | all | **Medicine takes the long way round.** 藥囊 opens the selected hero's 俠客錄 on a tab with 兵器 and 護具 filters though only medicine can be used; to heal someone else the player must close it, select that hero and reopen. In landscape 服用一份 is below the fold. (L2-13, L3-11, D3-10, D2-33) | 4 reviewers | Pick the medicine, then pick who takes it |
| R-26 | Minor | all | **The break board has no counter on the board.** 空山琴臺 shows 「守 · 尚須 N 回合」 and was praised; 無刻漏臺 shows nothing for its posts outside the goals page, and the 破 badge sits over the master's own badges. One post stood hidden behind the master and his guard. (P2-18, P2-19, D2-22) | 2 reviewers | 「星索樁 0／2」 beside the round counter |
| R-27 | Minor | L | **A healing art gave no prompt and lit no tiles.** 藥王方脈 showed no 「選擇範圍內的友軍」 and tapping an ally did nothing; perhaps no ally was in reach, but then the game should say so. (L2-12) | 1 reviewer, once | Say why nothing can be targeted |
| R-28 | Minor | all | **Ending the turn.** With heroes still able to act it asks every round (two taps, with no "do not ask again"); at other times it ends at once though a hero had not acted. On the keyboard the confirmation's focus is on ×, so E then Enter cancels. (P2-05, D1-24) See R-59 for the keyboard | 2 reviewers | One consistent rule; an option not to ask |
| R-29 | Minor (bug) | all | **Two missing files are requested on 空山琴臺**: `assets/motion-undefined.webp` and `assets/poses-undefined.png`. No broken picture was seen. (P2-20, L2-18, D2-27, independently) | 3 reviewers; a piece with no `mini` reaches `warm` or `standIn` in `game/src/actors/actors.js` | Skip pieces with no sheet id |
| R-30 | Minor (bug) | all | **戰場紀錄 › 劇情 is out of order and mixes boards**: round 2 and round 1 of board 3, then round 4 of board 2, with no board label. Each 撤步 also adds two lines to the log. (L2-19, D2-26) | 2 reviewers | Group by board |

### 4.4 Story pages and films

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-31 | Minor | all | **下一句 is never in the same place, and only the button advances.** The box is centred and resizes with each line, so the button moves by up to 60 px; tapping the text does nothing; 略過 sits beside it. For the keyboard see R-60. (P1-10, P2-01, P3 diary, D1-02, D1-03, D3-21) | 5 reviewers | Pin the button row; a tap anywhere in the box advances |
| R-32 | Minor | all | **The films.** No pause; Space skips. 略過 sits where a right thumb rests. On a landscape phone the video is taller than the screen: about 85 px of the bottom is cut, a caption runs under the sound button, and the ending's last title 獨孤求敗 loses its last character. The opening's last caption ends on a comma (「今天你我有緣，」). The films play with sound even when 遊戲音效 is off (decided in 1.11, asked again as Q-N128). (P1-11, P1-12, L1-05, L3-16, D1-01, P3-04) | 5 reviewers | Fit the video to the screen's height; Space pauses |
| R-33 | Polish | all | **The narration line is 12 px pale grey** above 16 px speech, in lines of 35 characters or more on wide screens. (L2-21, P3-08, L3-21) | 3 reviewers | 14 px, darker |
| R-34 | Polish | all | **No way to reread from inside the story.** 上一句 works; after 略過 nothing says the scene can be reread in the shop or the log. (L2-20) | 1 reviewer | A line after skipping: 「可在紀錄重讀」 |
| R-35 | Polish | all | **Small things in the text.** 「老伯，你又是誰？」 is never answered (D1-04). 余滄海's note on the last board still says he was set down at the bridge head (L3-10). The arrival message 「敵援入場 · 鳳天南率五虎門棍徒兩名自南渡口」 ends without a verb (P3-19). 鳳天南 arrives with 胡斐 on the board and nobody speaks (D1-26, once). | 1 reviewer each | For the producer's eye |

### 4.5 整備, 武學 and equipment

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-36 | Minor | all | **A learned art is not equipped.** After 修習 the art sits unused until the player opens 招式配置, which opens with slot one (the basic attack) selected, so 配置此格 would replace the basic attack. Three or four taps per art, and nothing warns at 出陣 about an empty slot or unspent points. (P1-16, P2-06 four times, L2-10, D1-16, D2-15) | 5 reviewers | Drop a new art into the first empty slot; warn at 出陣 |
| R-37 | Major on small screens | P L D | **The 武學 tab buries the tree and the learn button.** Six header rows and a four-line paragraph stand above the tree; in landscape the tree begins after one full scroll and 修習 is two scrolls from the node's name, under the footer; on desktop the button sits at the bottom edge. Node states are 10 px. The detail reads 「根基 · 根基」. The learn button is greyed with its reason in a list above it. (L2-07, L1-08, L2-11, D1-16, D2-18, P2-13, P2-14) See `shots/skill-tree-phone-landscape.webp` | 5 reviewers; duplicate label seen in the screenshot | Fold the paragraph; pin the detail and its button |
| R-38 | Minor | P L D | **陣容.** 作戰目標, already read on 軍情, takes the first screen. Tapping a hero's card only highlights it: the pane with 任為領隊 and 轉為候補 is three to five scrolls below, and nothing says it is there. The helper line sits half off the bottom edge. Empty seats four and five suggest missing heroes on board 1. With five heroes the fifth chip is off-screen with no cue. On desktop, dropping a hero on seat one makes him the leader without a word, though the leader decides defeat. (L2-08, P2-23, P3-12, L1-21, P2-09, D2-31) | 5 reviewers | Start 作戰目標 folded; scroll to the pane on tap |
| R-39 | Minor | P | **裝備物資 on a phone.** An item's 裝備 button lands under the fixed footer; the whole sheet shifts 20 px between heroes and tabs; 氣血 carried over between boards is shown in red with no rule stated. (P2-08, P2-24, P2-26, D2-21) | 2 reviewers | Keep the action above the footer |

### 4.6 The shop

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-40 | Minor | all | **Buying blind.** One long scroll; an item's effect is behind ▶; no comparison with what a hero wears; nothing says who can use it; buying is one tap with no confirmation or undo; nothing can be sold. Item texts are dense rules at 10.9 to 12 px. On desktop the list is an 810 px column that scrolls with a third of the screen empty on each side; in landscape the cups and the prize are under the footer. One item's description is open at a time, so two swords cannot be compared, and an item shows 「攻擊 ＋10」 but not what the hero's 攻擊 becomes. 「持有」 reads 0 for an item that is equipped. (P2-17, L2-14, L2-15, L1-17, L3-20, D1-21, D2-17, D2-20) | 7 reviewers | A plain first line per item; "worn now" beside it |
| R-41 | Major for planners | all | **A manual's requirement is hidden until it is granted.** 《彈指神通》 needs 淬鋒一重; the shop does not say so, a manual can be granted to one hero only, and the requirement appears after granting. Granting is one click with no confirmation. (P2-04, D2-16) | 2 reviewers | Show 修習條件 in the shop and on the grant button |
| R-42 | Polish | all | **Text slips.** 錦紋軟鞭 is 錦紋長鞭 in its own description. The note 「是本作的讀法」 ("this is this game's reading") closes twelve art descriptions and reads as a note to the team. 五行布陣 says five tiles and its preview says three or four, with no reason. The forecast files a cooldown under 招式連攜 (also 0.20 b). 青鋒劍's description begins 青鋼劍身. (D1-18, D1-17, P2-11, P2-12, P1-20) | Verified in `game/src/data/martial-arts.js` and `mastery-catalog.js` for the first two | Fix the name; decide whether the note stays |

### 4.7 Losing, the last board and the ending

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-43 | Minor | all | **The loss pages do not say what is lost.** They are kind in tone and clear that the run is over, and say that bought goods are kept. They do not say whether levels and arts reset, 累積的悟 is never explained, and the shop's button becomes 結束此行 with no warning that it ends the run. 「最遠走到 2 局」 after losing on the third board is ambiguous. (L2-23, P2-21, D2-34) | 3 reviewers | One line: what resets, what stays |
| R-44 | Major | all | **On 谷底棋臺 the player cannot find 求敗.** The goal is about him alone, and he carries the same red 主 tag as every master; only a yellow gauge differs. The 軍情 plan keys all six red squares as 局主. Once the others arrive there are eleven or twelve figures in one clump with their tags and gauges on top of one another, and no names on the board. Arrivals are a three-second message the first time and nothing the second. (P3-02, L3-09, D3-03, D3-04) See `shots/last-board-desktop.webp` and `shots/last-board-phone-landscape.webp` | 3 reviewers; seen in the screenshots | His own tag; his 氣血 beside the round counter; names on hover or tap; the camera turns to arrivals |
| R-45 | Major | all | **The leader dies without warning, and the price is ten boards.** All three reviewers who played the last board honestly lost in round one or two: 無名 stepped toward 求敗 and fell in a single enemy phase. The only hint is 偏好 專挑領隊 at 11 px inside 求敗's profile. The loss page then says the ten boards must be won again, which for a player with ten minutes a night "is a big wall". (P3-03, L3-14, D3) | 3 reviewers | Say 「求敗與局主專挑領隊」 in 軍情; show the danger zone by default here (Q-N129) |
| R-46 | Minor | all | **The ending leaves little behind.** The reveal 「獨孤求敗」 sits half-way down a scrolling box over the dimmed board, with 10 px captions beneath. Afterwards the title screen differs by one button label, there is no record of past runs, and the next run's prologue is word for word the same. (D3-18, L3-15) | 2 reviewers | A full page for the epilogue; a mark on the title; a list of runs |

### 4.8 Settings, sound, names, text size

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-47 | Minor | all | **Settings are thin and hard to press.** Three switches of 34 × 19 px; tapping the label does nothing; no 開 or 關; no text size, volume or speed. What 完整動作與特效 changes is not said. Every choice did survive a reload. (P1-13, P2-15, P3-09, L1-19, L3-18, D3-07) | 6 reviewers | The whole row toggles; say what each changes |
| R-48 | Polish | all | **Sound starts off and only a small icon says so.** (L1-20, D3-07) | 2 reviewers | Offer sound once, at 入夢 |
| R-49 | Minor | all | **One product, three or four names**: 劍影江湖 (title and front page), 一念江湖 (the front page's door, the wiki), 武俠戰棋 (the game's corner), 「（暫名）」 (the wiki). Seven reviewers asked which is the name. (L1-06, L2-22, L3-23, P3-18, D1-05, D3-09) Already open as Q-W1 and Q-N124 | Verified | Settle Q-N124 |
| R-50 | Polish | all | **Buttons named differently from what they open.** 遊玩指南 opens 操作指南; 藥囊 opens 俠客錄; the story's 進入整備 opens 軍情, which has its own 進入整備. (D3-10, P3-06) | 2 reviewers | One name each |
| R-51 | Major for weak eyes | all | **Small text.** "Hard to read on a stream at 720p." Measured sizes: wiki map letters 8 px; the 領隊 tag 9 px; skill-tree states and tiers, 軍情 plan numerals, shop 購買, log time stamps 10 px; stat captions, enemy-card labels, 敵援 line, 利劍境界 line 11 px; 作戰目標 lines 11.3 to 11.5 px; narration 12 px. There is no size option. (P1-17, P2-14, P3-08, L1-18, L2-09, L3-21, D1-21, D2-24, D2-25, D3-21) | all nine | A floor of 12 px on phones and 13 px on desktop; later a 字級 option (Q-N130) |
| R-52 | Minor | P L | **Small targets.** Close buttons 38 × 31; 立為領隊 68 × 25; settings switches 34 × 19. (L1-19, L2-09, P1-13) | 3 reviewers | 44 × 44 |

### 4.9 The wiki and the front page

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-53 | Major for story readers | all | **The wiki's front page gives away the ending and shows the workshop.** Its first paragraph ends 「那個少年，是年輕時的他自己」. It says 五場 where the game says 十局, and 「（暫名）」 in its banner. 單輪劇本 opens with 「這份文件定了甚麼」, 「製作人已定案的事」 and 「協作須知」. Every entry ends with a source path such as `game/src/data/new-heroes.js:75`. The hero list and the ranking include 無名, and the maps include the last board. The game's title screen links straight to it. (P3-15, L3-17, D3-01) See `shots/wiki-home-phone-landscape.webp` | Verified in `wiki/content/世界觀設定.md`, `wiki/src/view/pages.js` | Q-N127 |
| R-54 | Polish | all | **Wiki details.** 俠客對照's cards scroll sideways with no cue on a phone; a second click on a ranking column does not reverse the sort; 令狐冲's page is `#heroes/hero`; removing a hero leaves `#compare?h=,huang…`; map letters are 8 px and the legend lists terrain the map does not have (0.20 e). (P3-16, D3-20) | 2 reviewers | Small fixes |
| R-55 | Minor | L | **The front page is 425 px tall on a 390 px landscape phone**, so both doors' lower halves are cut with no sign that it scrolls. (L1-06) | 1 reviewer | Fit one screen |

### 4.10 Window and screen sizes

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-56 | Minor | D | **Large screens.** At 1920 × 1080 and 2560 × 1080 every dialog keeps its 1440 size and floats in dimmed space with 12 to 14 px text; the story box is about 800 px wide on a 2560 px screen. (D3-11) See `shots/story-ultrawide.webp` | 1 reviewer, with a sheet of all seven sizes | Scale dialogs with the window up to a limit |
| R-57 | Minor | D P L | **Small and narrow screens.** A desktop window of 700 or 500 wide switches to the phone layout, where the shop shows about two items between its header and footer. At 1280 × 720 the 整備 portrait is cropped. At 320 × 568 the battle header covers 我方行動 and the settings gear is off the edge. At 568 × 320 整備 and the shop have about 115 px of scrolling area. Sizes that were fine: 360 × 640, 768 × 1024, 667 × 375, 932 × 430, 1024 × 768, and a page zoomed to 200%. (D3-12, P3-10, P3-11, L3-20) | 3 reviewers | Decide the smallest size to support |
| R-58 | Polish | all | **Finish.** A bracket ornament is cut off at the left of every dialog header and looks like a rendering fault. The film's end card uses flat buttons unlike the rest. Cream cards and navy cards share one page in 裝備物資. 全螢幕 has a label in battle and none on the title. (D3-17) | 1 reviewer | For a polish pass |

### 4.11 Keyboard play (desktop)

Focus handling is sound in general: the ring is visible, focus is kept inside an open dialog and returns to the opener, and keys do not fire behind a dialog. The problems are in which button has the focus and in keys that mean several things.

| Id | Severity | Formats | Finding | How sure | Suggestion |
| --- | --- | --- | --- | --- | --- |
| R-59 | Major on the keyboard | D | **Enter and Space do not confirm the main action.** E opens 結束我方回合 with the focus on ×, so Enter cancels; ending a turn takes E, Tab, Tab, Tab, Enter. In 交鋒預覽 the focus is also on ×, so Enter closes the preview and every attack needs a click on 確認出招. (D2-01, D2-02, D1-13, D3-08) | 3 reviewers, each several times | Focus the primary button; a second E confirms |
| R-60 | Major on the keyboard | D | **In story pages the keyboard skips or dies.** The prologue opens with the focus on 略過, so Space skips all of it, while later scenes focus 下一句. A click on the story text moves the focus to the text, after which Enter, Space and → do nothing. The film has no pause and Space skips it. (D2-04, D2-05, D1-01, D1-02, D3-08) | 3 reviewers | Space, Enter and → always mean "next line" |
| R-61 | Minor | D | **Esc means three things.** It goes to the title screen from a story, 整備 or the shop (R-01); it closes a panel in battle; pressed once more it takes back the move, with only a small message. It never opens the menu. (D2-06, D1-09, D3-06) | 3 reviewers | Esc closes the top panel only; 撤步 is its own key |
| R-62 | Minor | D | **The keys are hard to find and some expected ones are missing.** The key list is the last thing in the guide, at 11 px with no heading, after sixteen folded sections; one reviewer never found it. `?` opens the guide only in battle. No button shows its key. Arrows, WASD, + and − and Space do nothing in battle; no key resets the view. `E` both starts the battle and ends the turn. On the title, Tab reaches 入夢 sixth, and after a reload Enter does nothing until Tab is pressed. Tab's order among heroes changed from round to round. (D2-12, D2-13, D2-14, D2-30, D1-22) | 2 reviewers | Key hints on the buttons; a 按鍵 section first in the guide; focus 入夢 or 繼續 |
| R-63 | Minor | D | **`?classic` no longer matches the guide.** With the visual upgrades off, D, Tab and the number keys do nothing though the guide lists them, there is no danger-zone button, and pieces overlap heavily. Players are unlikely to find this address. (D2-28) | 1 reviewer | Decide whether the classic look is still supported |

## 5. What works and should be kept

Every one of these was praised by at least three reviewers without being asked:

- **交鋒預覽.** Health before and after, the counter-blow, cost and effects, in words and numbers, with two large buttons. "The clearest screen in the game."
- **Saving.** After a board has begun, every reload, lock and screen turn returned to the exact place, and the title's button names it (繼續第一局, 繼續戰後劇情, 返回通吃坊, 繼續終局). No action was duplicated or skipped in any single-tab reload.
- **撤步**, with its 「移動已撤回」; the reason shown for a blocked tile; the warning before ending a turn with heroes still to act.
- **The writing.** Heroes arriving mid-scene from their own books, 韋小寶's patter, 求敗's dry lines, the losing scene, the epilogue. The three readers of the novels among the reviewers all called it faithful.
- **The art.** The boards, the portraits, the ink films, the shop's item cards and the cup game.
- **The guard board.** 「守 · 尚須 N 回合」 on the board, 援 marks a round ahead, object cards with exact numbers.
- **The skill tree's numbers**, 合招譜, 選境界, the 軍情 pages, the enemy notes (蓄勢 countdown, 坐鎮, 偏好) and the filterable battle log.
- **Fast tapping never double-fired** a line, an attack or a cup pick. The console showed no script errors in any session.

## 6. Reported, but not the game's fault

- **"The film restarts when the phone is turned"** (P3-01, L3-03, D3-02). The code carries the film's position across the two cuts. It fails only on `python3 -m http.server`, which cannot serve part of a file; on a server that can, as GitHub Pages does, the film kept its place when I turned the screen at 9 s and at 24 s. Worth knowing because the README recommends that server for local play.
- **"此輪破局 10 / 10 beside 最遠走到 0 局", and 無劍境界 still 未勝 after the ending** (P3-21, L3-14, D3-22). These come from reaching the last board with the developer jump: a real run marks the fifth 境界 when its tenth board is won.
- **"The first tap on 入夢 opened the guide"** (P2-25). Another reviewer's command reached this browser by mistake in the first minute of the session.
- Slowness, long enemy turns and timeouts in the reports are the test machine.
