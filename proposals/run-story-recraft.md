# Proposal: the story of one run, rebuilt on the game as it now plays

> For the producer. Written 2026-11-21 by the story designer. 繁體中文版：`run-story-recraft.zh-Hant.md`（內容相同）。
> **Status: direction approved by the producer on 2026-11-21** (all fourteen questions answered in the session; section 9). Nothing in the game text, the two design documents or the wiki has been changed yet.
> Scope: the per-run story (`wiki/content/單輪劇本.md`). The world view (§0 to §6) and the five-volume arc (§8) are treated as fixed.
> Chinese lines below are samples to set the tone. The rewrite is a separate task, and it carries these decisions into the two design documents.

## 0. The proposal in six sentences

1. **The one opposite is playing, not posing a puzzle.** Every black stone lands with a 「嗒」 on the stone table. Stones he sets down during a board are the reinforcements, and the youth hears the stone one round before the person arrives.
2. **The 劍意 decides only that a black stone fights. How he fights is his own.** Each adversary's behaviour is the man showing through, and at half health he is half awake (半醒): his own habits come back before the will lets go.
3. **A board's kind is where its 劍意 sits:** on one brow (斬將), on two (兩位局主), on everyone (殲滅), and later on a thing or a place (破, 守, 奪, 脫出).
4. **Heroes remember their lives upward.** A single thought has no body, so only what the hands know best arrives. The rest returns one art at a time, and the art that made their name returns last, together with what it cost.
5. **A win is proof.** A half-lit white stone at the board's edge is someone holding the letter and hesitating. Win the board and that person believes the match can be won.
6. **The secondary is 韋小寶's side bet (盤口).** He cannot watch a game without opening a book on it. Twelve kinds of secondary are twelve bets, and he pays in silver, a manual from his stock, or a fight so well fought that the hands remember.

Three of these were real choices with alternatives (section 6). The producer chose the recommended direction in each; all fourteen answers are in section 9.

---

## 1. The premise of a run

**One paragraph.** A run is one sitting of a ten-board match that is being played live. The youth falls asleep in his own years, opens his eyes in the valley and holds white: he sees the whole board, and the heroes on it see only a few steps. The one opposite holds black and is never seen, only heard: each stone he sets down lands on the stone table with a 「嗒」, and a moment later a person stands on the board. Black stones did not choose to come. A 劍意 on their brows makes them fight whoever arrives, but it does not tell them how, so each fights exactly as he always has, and every blow that lands wakes him a little. White stones chose: they answered an unsigned letter at the edge of death. What answered is a single thought, and a thought has no body, so each hero arrives with only what the hands know best. They remember the rest of their lives as the boards press them, and the art that made their name comes back last, with its cost. Each board won is proof that the match can be won, and one more person who was holding the letter steps in. 韋小寶, the only living man there, opens a side bet on every board. Ten wins send the heroes home with 一悟. The youth climbs to the one who carved the stone, loses in one move, hears 「還不夠」, and closes his eyes.

**What changed from the current premise.**

| | Current script (v0.5) | Proposed |
|---|---|---|
| The opponent | Sets a board and waits. One 「嗒」 at the start of each board | Plays during the board. Every reinforcement is a stone heard as it is set down |
| Black stones | A master and a lieutenant per board, both pressed by one will | Any number. One will per board; the master is where it sits. Stones from other books are strangers to the master, under the same will |
| Rank and file | Not explained | 念中人: people the master's own thought brought with him. They are not summoned thoughts, so the rule 只見入道者 holds. They fade when he wakes |
| What the will does | Makes them fight | Makes them fight, and nothing more. Manner, habits and tricks are the man's own. Half health is half awake |
| Why this board is fought this way | One reason for all ten | The board's kind is where the 劍意 sits |
| Heroes' arts | One shared line; bios and tree introductions still describe the old state | Arts live in the body, and only a thought came. The hands keep what they know best; the famous art returns last, with its cost |
| A new hero | Came because the secondary was met | Comes because the board was won. A win is proof |
| The secondary | 盤外觀望的人 judging the win | 韋小寶's side bet |
| 軍情 and 起陣 | No voice | The youth reading the board before anyone steps onto it; the stone still in his hand |

**What survives unchanged.** Most of the script, and almost all of the written text:

- 睜眼 and 闔眼, the five fragments, the five marks on the stone, 留名／還名, 階盡, 眼破. All of `wake-tale.js` stands except two notes in the journal.
- The letter (英雄帖), word for word.
- The youth: no name, the name he says by reflex, why he commands (當局者迷), why he cannot step onto the board.
- 眼, 提子, the twelve-round limit (一念易散), the five 絕位, 收子, 通吃坊, 三盅通吃, 寄存, 賒帳, 破綻.
- The masters' core: black stones, the 劍意, 「這念頭不是我的」, waking on defeat, and each master's first act on waking. Every existing line of the ten board scenes stands; a few need a count corrected (「兩個人」 where three now stand).
- Every hero line: arrival, obey, the two deja vu lines, the two night-talk lines, farewell. All 23 same-book lines.
- Deja vu rules, the night talk, the cross-run table (script §8 to §10), and the three-layer rule.

---

## 2. Each mechanic, what it means in the world, and how the player hears of it

Status: **K** kept as it is, **C** changed wording, **N** new.

| # | Mechanic | What it means in the world | How the player hears of it | |
|---|---|---|---|---|
| 1 | Heroes arrive with one entry art and recall the rest by spending 武學點 | Only a thought was borrowed (仙規一), and a thought has no body. Arts live in the body. What arrives is what the hands knew before the mind did. This is the script's own rule 手比心先記得 (§2.1), applied inside a run instead of across runs. Buying a node is the hero remembering a stretch of their life (world view §6: 經脈圖即生平) | Tree header `RECALL_NOTE` (kept, one sentence added). First-board scene: two new lines from 韋小寶, who has seen it every time. Each tree's `origin` paragraph and each bio rewritten to say what is in the hand on arrival | C |
| 1b | The famous art sits at the top and carries a price | The art that made their name was paid for with the hardest stretch of their life. To remember it is to remember that too, so it comes last and it costs. The prices already follow the books: 有攻無守 for 令狐冲, 留三分力 for 郭靖, 黯然 for 楊過 (in the novel the palm fails him when he is happy), 曲終 for 任盈盈, the chain for 向問天 | One new line per hero, said when the top art is recalled (hero layer, ten lines) | N |
| 1c | Every hero gains a point for each board won; a latecomer arrives with more points | Each win is one of the ten steps (仙規三, 登階). The higher the company stands, the more everyone remembers. Someone who steps in at the sixth step starts with what that height gives | One line after a win replaces 「同行俠客各得 1 武學點」: 「登了一級。同行的人，各自想起一點。」 | C |
| 2 | A win alone brings the next hero | Letters went to many; some hold the letter and hesitate (world view §6, kept). A half-lit white stone at the board's edge is one of them. Nobody believes at first (script §4.1). A board won is proof that 「十局皆勝」 can be done | 軍情, the 應帖 row (it already names who comes). After a win: one changed spine line, then the hero's own arrival line as today | C |
| 3 | Twelve kinds of secondary, one drawn per board per run, paying silver, 武學點 or a manual | 韋小寶 opens a side bet on every board (盤口). The win reward is already his 彩頭 (script §11); this is the same book, one line further. The draw changes each run because he calls a different bet each time. He pays in silver, in kind from his stock, or not at all, because a fight fought that well made the hands remember | 軍情, the 支線 row, prefixed 「韋小寶另開盤口」. After a win: one line from 韋小寶 by kind (twelve lines) and a tail by reward (three lines). Section 4 | N |
| 4 | Boards differ in kind: 斬將, 殲滅, two masters; later destroy, defend, carry, escape | One 劍意 per board, and the kind is where it sits. On one brow: wake him and the board is over. On two brows: both. On everyone: each must be woken. Later kinds: fixed in a thing (break it), aimed at a thing of ours (hold until the thought runs out), or laid on the place (bring it out, or get out). 無刻漏臺's 星索 already tells this in the game | 軍情, the 戰局 row: one line per kind in the youth's voice (three now, one more per future kind). Each board's own scene keeps its sentence on why this fight cannot be avoided | N |
| 4b | On a 斬將 board the rest need not fall | Rank and file are 念中人. A master's thought of himself includes his people: 丁春秋 cannot picture himself without disciples praising him. They are not summoned, so they are not 一念. When he wakes, they fade | One clause in a board's victory line: 「局主一醒，他心裡帶來的人便一個一個淡了。」 | N |
| 5 | Reinforcements are a surprise, announced one round ahead; some come when a master is first at half health | The opponent is playing. A stone set down on the table is heard at once, and the person arrives one round later. 軍情 cannot show it because it has not been played. A wave that comes when a master is half down is the opponent answering a stone in danger | When a wave is announced: 「嗒。石臺上多了一枚黑子。」 beside the rule line that names the place. When a named villain steps on: his own line (board layer). Guide paragraph 敵援, one lead sentence | N |
| 6 | Five villains joined existing boards, each with a troop type | Later moves by the same hand. They are strangers to the master, from other books and other years, under the same will. Like the heroes, they notice that the clothes around them are from no year they know. Their troops are their own 念中人 | Board scenes: one line each on arrival and one on waking. Bios in `VILLAINS` and `TROOPS`. Section 5 | N |
| 7 | Every adversary fights in a way of his own | The will says fight; it does not say how. The post he holds, the trick he keeps, whom he goes for: all his. At half health he is half awake and his own nature comes through: 岳不群 drops the gentleman's face, 血刀老祖's arithmetic returns and he goes to mend, 歐陽鋒 runs his channels backward | Bios gain one clause tying habit to behaviour. One line the first time a behaviour shows (three exist as `phase.log`; the rest are new). Enemy pages keep the rule text | C |
| 8a | 軍情 before 整備 | The youth reads the board from the stone table before anyone steps on. He can see where the 劍意 sits. He cannot see how a man will fight, because that is the man's own; the producer's ruling that 軍情 stops at 應帖 is therefore true in the world too | One lead line on the page. No information is added | N |
| 8b | 起陣: swap starting tiles before round one | The stone is still in his hand. 落子無悔: once the hand leaves it, it stays | The deployment tip: 「子還在手上，換得。一按『開戰』，落子無悔。」 | N |
| 9 | More heroes, villains and boards are coming | Nothing above counts stones or names a cast. A new black stone needs four sentences (section 5, the card). A new hero needs the five lines they have today and one more. A new board needs its own entry; the bets and the kinds are shared | Structure only | N |
| 10 | Recruitment, as shown on 軍情 | The half-lit stone has a name: the youth can see who is watching this board | 「盤邊一枚白子半亮著：〔名字〕持帖在看這一局。」 | C |
| 11 | The shop | Unchanged: objects are real, not thoughts. 韋小寶's side bets make him present on every board, not only at the stall | As today | K |
| 12 | A fallen hero returns on the next board | 提子, unchanged | As today | K |
| 13 | The twelve-round limit | 一念易散, unchanged: a borrowed thought does not last past twelve rounds | 「十二合已過。借來的一念撐不住，散了。」 as today | K |
| 14 | The leader is the 眼 | Unchanged. The bet 領隊無傷 now has a reason to exist: it is the eye | As today | K |

**Ties to the novels used above.** Each is to a passage, and none is needed for the mechanic to read.

- **Stones answered one by one:** 珍瓏棋局 in 《天龍八部》, where 蘇星河 answers each stone as it is set down and the players lose to themselves. The world view already rests on it (§4.5).
- **A swordsman remembering upward:** 風清揚's teaching in 《笑傲江湖》 that set moves are to be forgotten once learned, and the lesson in 《倚天屠龍記》 where the pupil is asked how much of the sword form he has forgotten. Here the order is turned round: the heroes arrive having forgotten, and the fight gives it back.
- **A price on the famous art:** 《神鵰俠侶》 says outright that 黯然銷魂掌 has no force when 楊過 is content; 《笑傲江湖》 calls the nine swords 有攻無守; 洪七公's first lesson on 亢龍有悔 is to hold strength back.
- **The will does not choose the manner:** 慕容氏's 以彼之道，還施彼身; 丁春秋's disciples, who in 《天龍八部》 praise him by rule; 閻基, a bone-setter in 《雪山飛狐》; 歐陽鋒, who ran the 九陰真經 backward in 《射鵰英雄傳》.
- **Go itself, not the novels:** 落子無悔, and the old Chinese custom that white moves first. The youth holds white and the player moves first.

---

## 3. The flow of one run

| # | Beat | Where | What happens | |
|---|---|---|---|---|
| 1 | 睜眼 | Prologue | He opens his eyes in the valley. The eagle. 韋小寶 asks his name. The board, the carved line, three white stones light | K |
| 2 | 應帖 | The draw | Three people answer from their own years. He picks the stone to set first: the 眼 | K |
| 3 | 石上的痕 | First board, before | He reads the stone. The three say the moment they came from. He explains that only he sees the whole board; the leader answers | K |
| 4 | 手上少了甚麼 | First board, before | Each of the three starts a move and stops halfway. 韋小寶 tells them not to worry, it is the same for everyone, and then denies having said 「個個」 | N, two lines |
| | *Every board, steps 5 to 11* | | | |
| 5 | 觀局 | 軍情 page | He looks the board over from the stone table: where the 劍意 sits, what 韋小寶 is betting, who is watching with a letter in hand | N voice, no new information |
| 6 | 整備 | 整備 | Who fights, what they carry, what they remember (the trees) | K |
| 7 | 落子 | 起陣 | The stones are still in his hand. He may change where each stands. 開戰 is the hand leaving the stone | N, one line |
| 8 | 局前 | Board scene | The master finds that the thought is not his. The youth says why the fight cannot be avoided. Where a stranger stone stands from the start, he has one line. A hero from the same book has their own line | K, one line added on three boards |
| 9 | 戰中 | Battle | 「嗒」: another black stone, a round before the person. A stranger who steps on says one line. The first time a behaviour shows, one line. At half health: 半醒. 提子, 破綻 and 十二合 as today | N and C |
| 10 | 局後・勝 | After | The 劍意 lifts. The master wakes and does the first thing that is his own; his people fade. 韋小寶 settles the bet, with a line for a bet met and a shorter one for a bet missed. The half-lit stone lights and a new hero arrives with their own arrival line. One step climbed: everyone remembers a little. Then the stall | K, C and N |
| 11 | 局後・敗 | After | The master has won and the will does not leave him. The white stones go dark. 韋小寶 packs up | K |
| 12 | 開張 | After the first win | 通吃坊 opens. Goods centuries apart side by side | K |
| 13 | 夜話 | Before the fifth board | By the stall's lamp. The youth's question changes with the number of runs | K |
| 14 | 最後一局 | Tenth board | The only fixed board. The will is no longer hidden. The sleepwalker stands beside the ropes (section 5) | K, one villain added |
| 15 | 階盡／眼破 | End | Farewells; the figure with no sword; one move; 「還不夠」. Or the eye breaks and everyone scatters | K |
| 16 | 留痕, 闔眼 | End | A mark on the stone. He closes his eyes; a fragment of his real life | K |

A board's scene is now made of four things instead of three: how the master feels that he is not his own; why this fight cannot be avoided; **how each black stone on it fights, which is his own**; and the moment he wakes.

---

## 4. The twelve secondaries

**One reading for the family.** Whether the board is won is between the youth and the one opposite. How it is won is 韋小寶's side bet. He bets on the youth's side, calls the bet before the board, and shares what he wins. He never says who is on the other side of his book, exactly as the script leaves the 彩頭 today.

Why this reading fits what the game does:

- **Drawn at random each run:** he calls a different bet each time. Chance is his element; go has none (world view §7).
- **Three kinds of pay:** silver; a manual in kind from his own stock; or no silver at all, because the fielded heroes fought so well that the hands remembered (武學點 to those still standing).
- **Bets that name what an enemy will do** (不容續命, 斷其退路, 拒敵於外): he is the one person who remembers earlier runs. He knows the monk goes for the herbs because he has seen it. The game's one leak of a surprise becomes his character.
- **It gives every board a living voice** that is not grim, and puts 運 into a game of calculation on every board, which is one of the three things the ending turns on.

**The interface word stays 支線.** In his mouth it is 「盤口」, and the pay is 「花紅」.

**A line for each kind**, said by 韋小寶 after a win when the bet was met. None names a board or a person, so each reads on any board.

| Kind | In the game | 韋小寶 |
|---|---|---|
| lamp | 點亮引路燈 | 「燈點著了。盤外的人看這一局，看得清清楚楚。這一口，算你贏。」 |
| swift | 搶在限時之前 | 「這麼快？我這壺茶還沒泡開。我押你們快，押對了。」 |
| intact | 全員生還 | 「上去幾個，下來幾個，我點過了，一個不少。」 |
| lastBlow | 親手了斷 | 「我指明要哪一位收這一局，便是哪一位收的。夠面子。」 |
| order | 先折羽翼 | 「先剪翅膀，再拿正主。這個次序，我押中了。」 |
| double | 一回合連下兩人 | 「一合之內倒了兩個。我擲骰子擲出一對，也沒有這麼齊整。」 |
| spare | 不容續命, 斷其退路, 不觸斗轉星移 | 「他那手看家本領，從頭到尾沒使得出來。我押的就是『使不出』。」 |
| combo | 合招制敵 | 「一個起手，一個收尾，兩個人打的是同一招。這叫做一對。」 |
| noMedicine | 不假丹藥 | 「一粒丸子也沒吃？我攤上的藥賣不出去，這一口還要賠給你。蝕本生意。」 |
| unhurt | 領隊無傷 | 「你那隻『眼』，連油皮也沒擦破。押這一口的，只得我一個。」 |
| holdLine | 拒敵於外 | 「後來的那幾個，一步也沒踏過那條線。我在盤外替你數著的。」 |
| answer | 以招破招 | 「他出甚麼，你們那位便破甚麼。這不叫打架，叫拆招。」 |

**A tail for each kind of pay**, said after the line above:

| Pay | 韋小寶 |
|---|---|
| Silver | 「這是你那一份。點一點。」 |
| A manual | 「銀子周轉不來，拿這卷譜抵數。貨真價實。」 |
| 武學點 | 「這一口贏回來的不是銀子。瞧他們幾個的神氣，各自像想起了點甚麼。」 |

**The lamp.** 引路燈 keeps its place and most of its meaning. It no longer lights a way in. It lets those holding a letter outside the board see the game clearly.

**Q-N26 (a win with the secondary missed). Decided:** 韋小寶 says one short line, and the old line `unlit` is retired. It must not sting, because the board was won and a hero is about to arrive:

> 「這一口你沒押中。不打緊，局是贏了的。」

**Q-N27 (the line for a secondary met). Decided:** the twelve lines and three tails above replace the shared placeholder.

---

## 5. The five new villains

**The card.** Every named black stone, now and later, is written from four sentences. The first and last exist today for the ten masters (script §7). The middle two are new and are where the behaviours go.

1. What he has never done, which the 劍意 now makes him do.
2. How he fights, which stays his own (his trait).
3. What comes through when he is half awake (if he changes at half health).
4. The first thing he does on waking.

Rank and file get one sentence: they are how the man pictures his own people.

### 鳳天南, at 青竹渡

- **Who he is here.** In 《飛狐外傳》 he owns one town and has never fought anywhere else; when trouble came for him he burned his own house and ran. He is set down behind the heroes in round three, at a crossing that is not his, and bars a bridge he has no use for: 「不是自己的地頭，鳳某從不出頭。」
- **And the master.** Nothing joins him to 余滄海 and 木高峰. They are strangers from another book, and the two on the bridge notice only that the newcomer's clothes are of no year they know. He is a later move by the same hand.
- **His own way.** The staff across the bridge trips people (絆足). His men strike from a tile away and are lost when someone closes in, as men are who count on numbers and a long stick.
- **Same book.** 胡斐, who chased him across the country, has a line when he steps on.

### 張召重, at 紅楓驛

- **Who he is here.** In 《書劍恩仇錄》 he is a court officer who does nothing without an order from above. This order has no seal and no rank on it, and he obeys it all the same. What galls him more is that it presses a commoner exactly as hard as it presses him.
- **And the master.** 田歸農 sees an official's cap and thinks he has found backing. 張召重 will not leave his courtyard to save him: he holds his post until he is struck. The bet 先折羽翼 on this board rides on that.
- **His own way.** He goes for the leader, as an officer goes for the head of a band. His shield men keep the wall only while they stand in their places.
- **Same book.** None of the ten heroes is from his book, so no hero line.

### 完顏洪烈, at 襄陽殘垣

- **Who he is here.** In 《射鵰英雄傳》 he never fights with his own hands. He hires, he commands, and everything he does is for his country. In round four he raises the flag over a wall he has no plan for.
- **And the master.** He stands beside the 國師 of the people who will destroy that country. 金輪國師 knows that Jin has fallen; the prince may not. One exchange tells it, and he forgets it on waking, as everyone does. This is the cross-era talk the world view wants (§8.2), on the black side for the first time.
- **His own way.** The flag exposes whoever it points at. His archers are lost when anyone gets close: he was never a man for the charge.
- **Same book.** 郭靖, whose father died by his arrangement. 楊過, whose father called him 父王 for eighteen years. By decision Q-N28 he becomes the second master when the defend battle is built, and two invaders of two generations before one wall can carry that.

### 鮮于通, at 倒影天街

- **Who he is here.** A head of 華山 from 《倚天屠龍記》, on the same street as a head of 華山 from 《笑傲江湖》, centuries later. The board is called a street of reflections, and that is the reason it has two masters: the will sits on two brows, and waking one is not enough.
- **And the master.** Each is the other's reflection: a gentleman's face over something hidden. 岳不群 cannot find his pretext (理). 鮮于通, the 神機子 who never fights without a scheme, has no time to lay one (計). 岳不群 knows the name from the roll of past heads; 鮮于通 has never heard of 岳不群.
- **His own way.** Poison in the fan, and he goes for whoever is already hurt. His disciples fight in pairs and cover each other, as the 華山 elders do with their paired blade work on 光明頂. The second pair arrives when either master is first at half health: the opponent answering a stone in danger.
- **Same book.** 張無忌 exposed him on 光明頂, moments before the sword that sent 張無忌 here. For him it was just now.

### 萬震山, at 無刻漏臺

- **Who he is here.** In 《連城訣》 he walled a man up, and every night since his hands get up and lay bricks while he sleeps. Being moved without willing it is nothing new to him. On the last board, where the will hangs down as two ropes for all to see, he is the one who needs no rope.
- **And the master.** 慕容博 and he each spent a life on one secret and did murder in the dark for it: a kingdom to restore, a treasure hidden in a poem. 慕容博 has just learned what it is to be moved by another hand. Beside him stands a man who has been moved for years and calls it nothing strange.
- **For the youth.** He does not know that he is asleep (睜眼是入夢). On the board before he meets the one who carved the stone, he watches a man fight in his sleep. The player, who has known since the dog at the end of the first run, hears it differently. This serves Volume 4 and changes nothing in it.
- **His own way.** He and his disciples strike hardest at whoever is already badly hurt, as his school does in the novel.
- **Same book.** None of the ten heroes is from his book.

---

## 6. Where there is a real choice

### Choice A. Who is behind the secondary?

| | Direction | For | Against |
|---|---|---|---|
| **A1** | **韋小寶's side bet (盤口).** Recommended | Explains the random draw, all three kinds of pay and the bets that foretell an enemy's trick. One voice, already in the cast, already running the 彩頭. Lightens ten grim boards. Puts 運 on every board | A gambling frame over a story of 求不得. The silver's source is left unsaid |
| A2 | **A finer question from the one opposite (題).** A small line carved at the corner of each board, in the hand that carved 「勝我者，得其名」. He wants a worthy opponent, so winning is not enough | Serious, and close to the centre of the story. The twelve kinds become twelve principles the youth later distils into his nine forms. 武學點 fits perfectly | Silver and manuals fit badly. It makes him speak twenty times a run, where the script says he neither shows himself nor speaks (§4.5). Hard to keep him unnamed |
| A3 | **A gift from the one watching.** The half-lit stone is impressed and arrives carrying something | Keeps most of the old text | Breaks when nobody is left to come (with ten heroes the pool is empty after the seventh win) and on the last board. Blurs the clean rule that a win alone brings the hero |

### Choice B. Why does a win bring the next hero?

| | Direction | For | Against |
|---|---|---|---|
| **B1** | **Belief.** A win is proof; one more who held the letter and hesitated steps in. Recommended | Uses the script's own three steps (不信, 輸不起, 信了) and the world view's 持帖觀望. One sentence. Fits 軍情 naming who comes | How the watcher knows is left unsaid |
| B2 | **Room.** He is the lowest rank of immortal and can hold only so many thoughts. When a master wakes and goes home, there is room for one more | Exact cause and effect; fits 仙規 | Cold. Turns 應者隨緣 into a headcount, and adds a rule to the world view |
| B3 | **A clause in the letter:** each board won adds a stone | Stated up front | Changes the letter, which is settled text, and reads as a rule of the game, not a reason |

### Choice C. What is the black side?

| | Direction | For | Against |
|---|---|---|---|
| **C1** | **A live game.** Stones are set down during the board. Stones from other books are strangers under one will. Rank and file are 念中人. Recommended | One idea covers reinforcements, the surprise, the one-round warning, the five villains and every villain still to come. Extends a line the script already has (「嗒」). Makes the opponent felt without showing him | The script's premise sentence 「每局一位局主、一位副手」 is rewritten. Rank and file need one new sentence in the world view |
| C2 | **A set piece in mist.** Everything is laid before the board. Reinforcements wait in mist beyond what even the youth can see. Each new villain is written into his master's story as a true lieutenant | Keeps 「一位局主、一位副手」 nearly whole | The youth 「看得見整盤棋」, so mist needs explaining. Each villain needs a made-up tie to a master from another book and century, and five more are coming. It does not scale |

**Recommended, and decided by the producer on 2026-11-21: A1, B1, C1.** The other directions are kept above as the record of what was weighed.

---

## 7. Sample lines

Drafts to set tone. All are written to be read aloud in Cantonese, name no one who set the boards, and show no class name or role label.

### 7.1 A hero recalling an art

First board, after the leader's answer (spine; 韋小寶 is the one who would know):

| Who | Line |
|---|---|
| 旁白 | 三個人各自起了個手勢，都只起到一半，停住了。 |
| 韋小寶 | 「不用慌，個個來到都是這樣。最熟的那一樣還在手上，後來的，打幾場自己會回來。……我說了『個個』麼？你聽錯了。」 |

Above every tree (`RECALL_NOTE`, the decided line kept, one sentence added):

> 應帖而來的只是一念。入門的功夫還在手上；後來所學，要在局中一招一招想起來。成名的那一招排在最後：要連換來它的那段日子，一併想起。

A tree's introduction (`origin`), rewritten on this pattern:

> **楊過。** 入境時，他手上只剩義父教的蛤蟆功，和古墓裡練熟的劍。重劍是後來的事，那一路掌更在後頭，要一局一局想回去。
>
> **小龍女。** 入境時，她手上只剩古墓入門的天羅地網勢：伸手攔得住滿室麻雀的那一路。一人使兩柄劍，是很後來的事。

A hero's line when the top art comes back (hero layer; one each):

| Hero | Line |
|---|---|
| 楊過 | 「想起來了。這一路掌，是等她的那些年裡自己湊出來的。……原來要先想起那些年，才使得出這一掌。」 |
| 小龍女 | 「這套劍要兩個人使。我一個人，想起了兩個人的份。」 |
| 郭靖 | 「師父教頭一掌的時候說，打出去的力要留三分。我學了許多年才懂，如今又從頭懂了一次。」 |
| 胡斐 | 「這一刀想起來了。……就是我舉著來的那一刀。」 |

### 7.2 A win bringing a new hero

On 軍情 (the 應帖 row):

> 盤邊一枚白子半亮著：〔名字〕持帖在看這一局。

After the win (spine), then the hero's own arrival line unchanged:

| Who | Line |
|---|---|
| 旁白 | 盤邊那枚半亮的白子，全亮了。 |
| 少年 | 「盤外又有一個人信了：這盤棋，贏得了。」 |
| 旁白 | 登了一級。同行的人，各自想起一點。 |

### 7.3 Reinforcements

When a wave is announced (spine; the rule line naming the place stays beside it):

> 嗒。石臺上多了一枚黑子。下一合，人便到。

When the wave comes because a master is half down:

> 嗒。對面見子危急，補了一手。

When a stranger steps on (board layer):

| Board | Line |
|---|---|
| 青竹渡 | 鳳天南：「這渡口不是鳳某的地頭，鳳某來封它做甚麼？……棍子倒先橫過來了。」 |
| 青竹渡, if 胡斐 is fielded | 胡斐：「鳳天南。你從佛山一路逃到這裡來了？……不對。你這雙眼，不是在逃。」 |
| 襄陽殘垣 | 完顏洪烈：「攻城？本王要的是一部兵書，不是這堵殘牆。……令旗怎麼自己舉起來了。」 |
| 襄陽殘垣 | 金輪國師：「王爺，貴國亡了有些年了。你我今日，都是替旁人打這一仗。」 |
| 襄陽殘垣, if 楊過 is fielded | 楊過：「聽說我爹叫了你十八年父王。……我該叫你甚麼？」 |

Strangers who stand on the board from the start (in the board's opening scene):

| Board | Line |
|---|---|
| 紅楓驛 | 張召重：「下官一生，上頭有令才動手。今日這道令沒有印信，下官竟也照辦了。更可惱的是，它壓這個草莽，同壓下官一般重。」 |
| 倒影天街 | 鮮于通：「鮮于某向來動口不動手，動手必先留後著。今日連後著也來不及佈。」 |
| 倒影天街 | 岳不群：「鮮于……華山歷代掌門的名錄上，有這兩個字。」 |
| 倒影天街, if 張無忌 is fielded | 張無忌：「鮮于掌門，方才在光明頂上，你扇裡的東西已經露過一回了。」 |
| 無刻漏臺 | 萬震山：「這不希奇。老夫夜夜如此：人睡著，手自己起來砌牆，醒來一身的灰。今日不過換了一堵牆。」 |
| 無刻漏臺 | 少年：「旁人要兩條索才牽得動。他不用。……人睡著了，原來也能動手。」 |

### 7.4 A secondary met

Section 4 has all twelve and the three tails. One in sequence, after a board won with nobody down and a manual as the pay:

| Who | Line |
|---|---|
| 韋小寶 | 「上去幾個，下來幾個，我點過了，一個不少。」 |
| 韋小寶 | 「銀子周轉不來，拿這卷譜抵數。貨真價實。」 |

### 7.5 The other new moments

| Moment | Line |
|---|---|
| 軍情, lead | 入盤之前，他在石臺邊把這一局先看一遍。入了盤的人，只看得見身邊幾步。 |
| 軍情, 斬將 | 這一局的劍意只壓在一個人眉心。打醒他，他心裡帶來的人自然散。 |
| 軍情, two masters | 這一局的劍意壓著兩個人。醒了一個不算，要兩個都醒。 |
| 軍情, 殲滅 | 這一局的劍意不在一個人身上，散在每一個人身上。要一個一個打醒。 |
| 軍情, a later kind (破) | 這一局的劍意釘在一件東西上。毀了它，人人都醒。 |
| 起陣 | 子還在手上，換得。一按「開戰」，落子無悔。 |
| A behaviour first shown (續命) | 閻基的手搭上了同夥的傷處。逼他動手的是劍意；替人接骨，卻是他自己的老本行。 |
| A behaviour first shown (護駕) | 師父未動，弟子先撲上來挨打。這不是劍意，是他們門中的規矩。 |
| Half awake (遁走), after the existing line | 打到半醒，他那本算盤回來了：先養傷，再砍人。 |
| A 斬將 board won with others still standing | 局主一醒，他心裡帶來的人便一個一個淡了。 |

---

## 8. What would have to be rewritten if approved

Line counts are estimates of lines of story text, not of code.

| File | Today | Stays | New or changed |
|---|---|---|---|
| `game/src/data/encounter-script.js` | 412 lines, ten scenes | Every existing line, apart from about six that count 「兩個人」 | About 70: an opening line and a waking line for each of five villains; five same-book lines against them (胡斐; 郭靖, 黃蓉, 楊過; 張無忌); one entry line for each of two wave villains and a reply from the master; the fading of rank and file on 斬將 boards; the header comment |
| `game/src/data/hero-voices.js` | 168 lines, five things per hero | All of it | 10 to 20: one line per hero for the top art, and optionally one for the first art recalled |
| `game/src/data/maze-tale.js` | 144 lines | Prologue, letter, draw, command, shop, night, scatter, win, loss, closing | About 35: `SIDE_TALES` from four lines to twelve, three tails and one line for a bet missed; `join` rewritten and `unlit` retired; the recall beat; the 「嗒」 lines; one line per kind of board; the 軍情 lead; the 起陣 line; three `CHAMBER_TALES` arrivals that count the people standing there |
| `game/src/data/wake-tale.js` | 159 lines | Marks, fragments, closings, 留名／還名 | About 6: two journal notes are out of date (不同年月的人 says the lamp or a clean win brings a hero; 對面的人 says a master and a lieutenant per board), and one note is added for 韋小寶's book |
| `game/src/data/mastery-catalog.js` | 1,490 lines | Every art, its numbers and its `source` | About 25: `RECALL_NOTE` gains a sentence; the ten `origin` paragraphs are rewritten |
| `game/src/data/encounters.js` | 832 lines | Traits, numbers, `GISTS` (rule text) | About 45: five `VILLAINS` bios and five `TROOPS` bios replace placeholders; about eight master and lieutenant bios gain a clause on their behaviour (閻基's bone-setting, 歐陽克's snakes among them); about fifteen first-shown lines beside the three `phase.log` lines that exist |
| Not on the list, found while reading | | | Hero bios that say the famous art is already held: six in `rules/game.js` (`DETAILS`), four in `data/new-heroes.js`. `ui/gates.js` line 27 still says a secondary brings the hero. `rules/game.js` line 2174, the lamp's log line. Three guide paragraphs in `data/rule-terms.js` (一念江湖, 支線, 敵援). The 應帖 sentence and the 「支線達成」 log line in `rules/journey.js` |

**Small hooks the text needs** (code, for the rewrite task to request, not story):

- Show a hero's line when their top art is recalled.
- Show a story line when a wave is announced and when a named villain enters, and skip a wave villain's waking line if he never arrived.
- Let 韋小寶 speak the secondary's line, by kind and by pay.
- Match same-book lines against any named black stone on a board, not only its master. `tools/check-story.mjs` enforces the present rule and would change with it.

**Design documents.**

| Document | Sections |
|---|---|
| `wiki/content/單輪劇本.md` to v0.6 | §0 (decisions); §1 (the paragraph); §4.3 (strangers, manner is their own, 半醒, 念中人); §4.4, rewritten whole as 韋小寶's 盤口; §4.5 (he plays during the board); §5 (the flow table and 5.3, where the same-book rule widens); §6 (a column: what is in the hand on arrival); §7 (two columns: where the 劍意 sits, and the stones set down later; the 支線 column goes); §11 (every row marked 待寫, and 11.1); §13; §14 (盤口, 花紅, 半醒, 念中人, 觀局; 引路燈 redefined) |
| `wiki/content/世界觀設定.md` to v0.9 | §0 (a v0.9 note). §4.4, two sentences: the will compels the fight and not the manner; rank and file are 念中人. §6, three rows that v0.8 itself marks 待故事細化時重寫 (十張地圖; 勝局得新英雄；支線另有獎賞). §11 (引路燈, and the new terms). Nothing in §1 to §5, §7 or §8 |

**Checks at the end of the rewrite:** `node tools/check-story.mjs`, `node tools/check-wiki.mjs`, and `python3 tools/extra-fonts.py --check` for any new character.

---

## 9. The producer's decisions

All fourteen questions were asked in the session on 2026-11-21 and answered. They are recorded in `ROADMAP.md` under Decisions. The rewrite task carries them into the two design documents; this task was told not to edit those.

| ID | Question | Decision |
|---|---|---|
| Q-N42 | Who is behind the secondary? | **韋小寶's side bet (盤口).** Not a finer question from the one opposite, and not a gift from the watching hero |
| Q-N43 | Why does a win bring the next hero? | **A win is proof.** A half-lit white stone is someone holding the letter; a board won makes one more believe |
| Q-N44 | Is the opponent playing during the board? | **Yes, a live game.** Reinforcements are stones heard as they are set down. Added villains are strangers from other books under the same will |
| Q-N45 | Rank and file | **念中人.** People in the master's thought, not summoned thoughts; they fade when he wakes. One sentence beside 仙規二 |
| Q-N46 | Half health as half awake (半醒) | **Yes.** Blows wake a black stone, and 變招 is his own nature coming through |
| Q-N47 | May black stones from different books learn of their own future from one another? | **Yes, forgotten on waking** |
| Q-N48 | Same-book lines against any named black stone, not only the master | **Yes, written now.** Five lines; they move into the pair layer (workstream 4) when it exists. A line against a villain who arrives mid-battle plays when he steps on |
| Q-N49 | A line per hero for the top art, and the small hooks in section 8 | **Yes, the rewrite may add them.** No rule of play changes |
| Q-N50 | The other side of 韋小寶's book | **Left unsaid, kept as a thread for a later volume** (運 against 算) |
| Q-N51 | Does 「入門的功夫」 mean the first thing each was taught? | **Write 「手上最熟的」 for all ten;** say 「最早學的」 only for the seven the books support. No starting art changes |
| Q-N52 | 軍情 wording | **Accepted:** one lead line, and the 戰局, 支線 and 應帖 rows in the youth's voice, with no new information |
| Q-N53 | 岳不群 knowing 鮮于通's name from the roll of 華山's past heads | **Accepted** as this game's reading |
| Q-N26 | A win with the secondary missed | **One short line from 韋小寶** (section 4). `unlit` is retired |
| Q-N27 | The line for a secondary met | **Twelve lines by kind and three tails by pay,** in 韋小寶's voice (section 4) |

No question is left open by this proposal.

This file is the record of the approved direction. Once the rewrite is done its content belongs in the two design documents, and the file can go.
