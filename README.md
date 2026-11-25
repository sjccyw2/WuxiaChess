# WuxiaChess · 劍影江湖

A 3D wuxia tactics game, and a wiki (江湖誌) that documents it by reading the game's own data.

- **Play:** `game/`
- **Wiki:** `wiki/`
- **Landing page:** `index.html`
- **Roadmap and open questions:** `ROADMAP.md`

There is no build step. Everything is plain HTML, CSS and JavaScript modules, served as-is.

## Run it locally

Browsers will not load JavaScript modules from a double-clicked file, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Deploy

GitHub Pages serves the `main` branch from the repository root (Settings → Pages → Deploy from a branch → `main` / root). Every push to `main` republishes the site:

- `https://sjccyw2.github.io/WuxiaChess/` — landing page
- `https://sjccyw2.github.io/WuxiaChess/game/` — the game
- `https://sjccyw2.github.io/WuxiaChess/wiki/` — the wiki

## Layout

```
index.html            landing page
game/
  index.html          page shell
  assets/             pictures, sprite sheets, fonts
  styles/             stylesheets, loaded in numbered order
  vendor/             three.js
  src/
    app.js            entry point: screens, input, save/load
    polish.js         presentation switches: one per visual upgrade (see below)
    loading.js        lifts the loading veil and fetches the dialog font early
    data/             content tables: heroes, arts, foes, maps, battles, rule words, story (see below)
    rules/            game logic: combat, journey, shop, formations
    scene/            3D battlefield, camera, scenery, landforms
    actors/           sprites and movement on the board
    fx/               technique and skill effects
    audio/            sound, synthesised in code: instruments, each event's sound, ambience
    ui/               panels, dialogs and views
wiki/
  index.html          page shell
  content/            hand-written pages (世界觀設定.md, 單輪劇本.md)
  assets/             pictures only the wiki uses
  styles/
  vendor/             acorn (JavaScript parser)
  src/
    main.js           entry point
    game-data.js      the one place the wiki imports the game from
    sources.js        reads the game's source files for citations and text
    catalog/          builds each wiki section from game data
    corpus/           lists every line of in-game text
    view/             draws the pages
asset-gen/            art not yet in the game (see asset-gen/README.md)
  prompts.md          prompts for the art the story still needs
  jianying-roster-art/  thirty characters: portrait and sprite sheet each
  jianying-item-art/    eight skill effects and thirty-two item pictures
  story-characters/     the youth and 求敗: cards, sprite sheets, the youth's figure and sword
  prologue-video/       the opening film and everything it is made from
  finale-video/         the ending film and everything it is made from
tools/
  check-wiki.mjs      builds the wiki outside a browser and checks its links
  check-story.mjs     plays hundreds of shuffled runs and checks the story holds
  script-package.mjs  writes script-package/ for a prose edit, and writes an edited one back (see below)
  script-package/     the brief, the writer's prompt, the mechanics overview and the sample runs that go into it
  extra-fonts.py      regenerates the extra font characters for the game and the wiki
  map-preview.html    draws one battlefield with the game's own board, camera and lighting
  shoot-map.mjs       photographs a battlefield from a set of camera angles
  roster-art.py       makes the game's files for characters from the roster pack
  roster-preview.html stands fighters on a battlefield and plays each row of their sheets
  shoot-roster.mjs    photographs every frame of a character's sheet on the board, beside another
  sound-check.mjs     renders every sound and fails if one clips or is out of balance
```

## Presentation switches

Every visual upgrade layered on the original look has a switch in `game/src/polish.js`: board
pieces, combat effects, lighting and water, panel finish, the loading veil, and the added
controls (danger zone, `Tab` to the next hero, the side-docked strike forecast, and the
action flow that replaces the four-button command bar), the painted skill effects, and the
marks for reinforcements and the secondary objective on the board. `statusLooks` draws the states that hold a piece on the board: 定身 freezes the figure frost-white, 閉穴 hangs a sealed talisman at its hands, 受制 turns its base, outline and health bar green-gold, 金剛 puts a gold ring and sheen on the hero and shows 無功 for a voided blow, and 固守 raises a stone ward, each with a short flourish as it starts and ends. (The outline of the tiles a two- or three-tile splash will catch is a rule the player needs, so it has no switch.) Set a switch to
`false` to turn that one feature off; nothing else needs to change.

To compare without editing the file:

- `game/?classic` turns every switch off and shows the original look.
- `game/?polish-off=hitStop,screenShake` turns off only the ones named.

Styles for these features live in `styles/12-combat.css` and `styles/13-panels.css`, and every
rule there is scoped under an `html.polish-…` class that the switch controls.

The briefing page (軍情) and the deployment step before round one are game flow, not polish:

整備 (and the team page in battle and in the shop) has three tabs, 陣容 · 武學 · 裝備物資. Each 陣容 card shows the hero's numbers, equipped arts and unspent 武學點; tapping a card opens a pane beside the line-up with the whole sheet, the line-up buttons and 修習, which opens the 武學 tab (the skill tree, the slots and the manuals) for that hero. Weapons, armour and manuals change only here and on the shop's team page; in battle the 裝備物資 tab only gives medicine (`canOutfit` in `game.js`; the producer, 2026-11-25). This is game flow, not polish: its styles are in `styles/17-preparation.css`, with no switch.
they have no switch. Their styles are in `styles/14-battles.css`.

## The five 境界 (difficulty)

The five 境界 are difficulty levels, listed in `game/src/data/realms.js` with what each does to
the enemies' numbers (the first 境界 changes nothing). The line each shows on the picker (`note`)
is built from those numbers, so the words cannot drift from the rule: 「敵方數值不變。」 for the
first, then 「敵方氣血 ＋6%、攻擊 ＋3%。」, 「敵方氣血 ＋12%、攻擊 ＋6%、防禦 ＋1。」,
「敵方氣血 ＋22%、攻擊 ＋11%、防禦 ＋2。」 and 「敵方氣血 ＋30%、攻擊 ＋15%、防禦 ＋2。」. Before
each run the player picks one from those open (選境界). The first is open from the start; winning
a run in the highest open 境界 opens the next. The profile keeps `realms` (highest open),
`cleared` (won), `finale` (times the last board was reached) and `ended` (times it was won);
saves from before work these out from the runs won.

## The last board (終局) and the ending

A run in the fifth 境界 does not end with its tenth board. 求敗 asks every stone to stay one board
more, and the run goes on to an eleventh: 谷底棋臺, the valley's own stone table (map 15, after the
fifteen boards a run draws from; the entry marked `last` in `game/src/data/battles.js`, `LAST_MAP`.
`FINAL_MAP` there is the tenth board, 無刻漏臺).

- **Who is on it.** 無名, the youth, takes the field himself as its leader (眼) and cannot be
  benched; four heroes stand with him, and every hero remembers every art of their tree. 無名 is
  stronger there than a copied piece (`LAST_BOON` in `journey.js`: 氣血 +100, 內力 +40, 攻擊 +10,
  防禦 +6, a step more), added once as the company is mustered. Across the board are 求敗, at the
  centre with a dry twig, and the masters of the ten boards the run met (`guest` pieces): the
  first five from the start; two more step to his side the moment he is at half his 氣血, and
  the last three when a quarter is left (waves with `when: { below }`, `rally` in `game.js`;
  they enter at once on the free tiles nearest him, with no round's notice).
- **How they guard him.** From half on, a master beside 求敗 takes the heroes' direct blows for
  him (`coverer`), and the masters keep to his side. With a quarter left he falls back
  (`withdraw` in his traits): to the tile in his walk farthest from the heroes with most of his
  own beside it, striking from there only if someone is in reach.
- **No secondary.** 韋小寶 opens no book on the last board (`sides: []`, `run.side` is null),
  and its pages show no 支線.
- **How it is won (問劍, kind `yield`).** 求敗 is 不敗 and never falls: bring him to 1 氣血. No 破招
  answers him (無招), and he does not counter the blow that ends it. If 無名 falls or the twelve
  rounds run out the board is lost, and the ten boards of 無劍境界 must be won again to reach it.
  The masters there are their own men: no post, no change at half, and their traits as strong as
  when the run met their boards.
- **無名's arts.** Nine forms (`HERO_PATHS.youth`). The four 令狐冲 learns too are the same arts for both: 破劍式,
  破箭式 and 破氣式 are copied from his (`SHARED_FORMS`), and 無名's starting 總訣式 reads his; the other five each answer one kind of
  weapon (`ARM_OF` in `game/src/data/encounters.js` gives each enemy its kind; archers, 完顏洪烈 and
  求敗 have none).
- **The ending.** Winning it plays a 59-second film (`game/assets/finale-film*.mp4`, made in
  `asset-gen/finale-video/`), then the run's last page, which carries the film's words as text
  (`MAZE_TALE.finale.ending`). There is no shop after it, so the board pays no silver.
- **Afterwards (無名入盤).** Once it has been won, every run starts with four pieces: the three
  drawn and 無名, an ordinary piece who grows his nine forms from the first like anyone. 求敗 has
  left the world and does not return: the one across the table in these runs is his shadow
  (`QIUBAI_SHADOW` in `maze-tale.js`), which says what he said; the speaker's name and the
  narration change with `run.plus`, the lines do not. The last board is earned again each time,
  and 重看終局 on the 選境界 page replays the film.

Its numbers are its own (`LAST_ROWS` in `game/src/rules/game.js`), measured with
`node tools/sim-battles.mjs --last`. The design is in `wiki/content/世界觀設定.md` §8.4 and
`wiki/content/單輪劇本.md` §9.5.

## Developer mode

`game/?dev` turns on a small floating window (folded to a bar that reads 開發); the browser
remembers it, and `game/?dev=off` turns it off.

- **Moving it.** Drag the bar, with the mouse or a finger; the button on the bar folds the window
  down to the bar and opens it again (by a tap, or Enter or Space; held and moved, it drags like
  the rest of the bar); a double tap or double click on the bar sends it back to its default
  corner. It cannot leave the screen: it is kept inside when dragged, when the window
  is resized and when the phone is turned. It stays where it was put as pages open and close.
- **What it remembers.** Where it was put (by the two screen edges it was nearest, so it holds
  its corner when the phone is turned) and whether it was folded, in `jianying.dev-window.v1`.
  In the lower half of the screen it opens upward, the bar under its buttons.
- **Its default corner.** Upright phone: the left edge, under the board and over where the arts
  list opens (clear of both, of the top row, the tutorial's card and 結束回合). Sideways phone: the
  top edge, right of the board's plaque (off the board, and in the empty middle of a page's title
  bar). Desktop: the left edge, a little above the middle (beside the pages, off the board).
- **How it stays above the pages.** The game's pages are modal dialogs, and everything outside
  an open one is inert, so the window is moved inside the open dialog (`refreshDev` in
  `app.js`). It is also shown as a popover (`devWindow` in `game/src/ui/dev-mode.js`), which puts
  it in the browser's top layer in its own right: placed against the screen, not against a
  dialog that is easing in. A browser without popovers gets an ordinary fixed element whose
  place is corrected for the dialog. It hides while a film plays.

In a battle, from its story, briefing or 整備 as well:

- 速勝 wins the board now, its secondary missed;
- 速勝・支線 wins it with the secondary met, whatever its kind (not shown on the last board, which
  has none);
- 速敗 loses it;
- 局主半血, once the fight is on, takes half of what 氣血 the board's master has, as a blow would
  (`devPress`): his 變招 follows, and on the last board two presses bring all ten masters on.
- 重試此局 puts the run back to the board's 起陣, everything as it was then: the heroes, the purse
  and the record (`retryPoint` in `app.js`). The run is copied the first time a board reaches
  起陣 and kept for the tab in `sessionStorage` (`jianying.dev-retry.v1`). The button stays while
  the run is still on that board, so it also works from the page after a win or a loss.

Each goes through the game's own settling (`devFinish` in `game/src/rules/journey.js`), so
rewards, the next hero, the story and the end of the run follow as in play. 跳至終局, always
there, starts the last board at once with the heroes last picked on the 試局 page, against the ten
masters of a run of ten boards drawn at random. Outside a battle, 開五重境界 opens all five 境界
(the first four counted as won); 看終局影片 plays the ending film; and 開無名入盤 opens what the
ending opens, so the next run starts with 無名 on the board.

試局, always there, sets up a test battle: pick any of the fifteen boards or the last board, any
境界 (open or not) and any heroes, in order (the first leads, the first five fight, the rest wait on
the bench; the last board is always in the fifth 境界, with 無名 leading and the first four heroes
beside him). The run
starts at that board's 軍情 page, its enemies as strong as at the board's usual place in a run and
in the 境界 picked; every hero has 20 武學點 and the purse 1000 兩 (`DEV_TEST` and `devTestRun` in
`game/src/rules/journey.js`). After the board the run goes on as usual. The last pick is
remembered. Starting a test battle replaces the save, and its result counts in the profile like
any run.

Two more buttons, always there and set apart, are for seeing the first visit again (the opening
film, the empty record, the first board's tutorial):

- 清空紀錄 puts this browser back to the state of someone who has never opened the game and loads
  the page again at the title. Every key the game keeps in the browser goes (all begin with
  `jianying.`: the save, the settings, the draw being set up, the tutorial's record), except
  developer mode's own, which begin with `jianying.dev-` (that it is on, the last 試局 pick, the
  window's place).
- 清空・首局 does the same and then opens on the first board's 起陣 in an ordinary first run: a
  fresh draw kept as the game keeps one (the first three of the five, the first leading), with
  the film, the prologue, the draw, the story, 軍情 and 整備 skipped (`devFirstBoard` in
  `game/src/rules/journey.js`, which is the run 落子 starts, taken on by the game's own steps). It
  is not a 試局, so the tutorial shows.

Both destroy the save in that browser, so each takes two presses: the first arms the button for
four seconds and its label asks (確定清空？); a second press on it, not sooner than 0.4 seconds
after the first, clears. A press anywhere else, any other key, or the four seconds passing lets
go of it.

## The first board's tutorial

The first time someone plays, the first board (青竹渡) carries coach marks: a small card says what the step in hand is (起陣, walking, the arts list and 撤步, aiming and the rule that only straight lines count, 交鋒預覽, the other heroes, ending the turn, and from round two the danger zone, the view, the goal and the leader, the guide), and a gold outline marks what to tap. It is not a scripted battle: the step is worked out from the state of the game, so it blocks nothing, catches up with a player who ignores it, and resumes after a reload.

What the board does for every player, tutorial or not (the playtest of 2026-11-22, R-14 to R-16, and the producer's notes of 2026-11-23):

- **An enemy out of reach.** With an art ready, the first tap on an enemy the art cannot reach says why in the board's message (naming the diagonal case: 斜角不算相鄰) and swells the tiles the art does reach (`pulseReach` in `scene/board.js`); the same enemy tapped again opens 敵情查探 (`unitClick` in `app.js`). With no art ready a tap opens it at once.
- **The whole figure is the target.** A tap is measured against each figure as it is drawn, the sprite's own shape and not only the tile under it (`actors/figure-pick.js`, `resolveBoardPick` in `scene/board.js`): the figure in front wins, an aimed art prefers a piece it can be used on, and a fingertip may land a little beside a figure. Open ground beside a figure is still the tile.
- **A way back to walking.** While an art is ready and the hero has not walked, the arts list ends with 走位, which shows the walk tiles again (`walkRow` in `ui/action-flow.js`); a tap on open ground the art has no use for does the same, and so does Esc.
- **Enemies in a crowd** (2026-11-23). A tap again on the same spot within six seconds takes the next enemy behind the one taken last, then the front one again (`tapPick` in `scene/board.js`); heroes are left out, since a second tap on a hero opens his list. The second tap that an out-of-reach message asks for stays on the same enemy (`holdCycle`). The view also zooms to 340% (`MAX_ZOOM` in `scene/camera.js`; it was 240%).
- **No reach drawn until an art is picked** (2026-11-23). A hero who has walked, or is held in place, has the basic strike ready, but its red tiles appear only once an art (the basic strike included) is picked from the list (`aimHidden` in `app.js`, `hideAim` in the board and the actor layer). A tap on an enemy in the basic strike's reach still opens 交鋒預覽 for it.
- **An art's full rules.** A long press on an entry of the arts list, a resting mouse pointer or keyboard focus shows a card with everything `moveFacts` knows about the art (濺射, 擊退, 連擊, conditions, 破招 …) and its description (`ui/art-detail.js`, `styles/19-art-detail.css`). The press only reads: the tap that ends it does not pick the art.

- **When it shows.** Once per browser (`jianying.tutorial.v1` in the browser's storage), on the first board of an ordinary run, for a record with no board won and no run finished; not in a 試局, not in a run with 無名 on the board, and not under `game/?classic`. 略過指引 ends it at once, and so does the end of the board.
- **Seeing it again.** In any battle, 選單 › 指南 › 重看新手指引 plays it from the top on the board being fought.
- **Where it is.** `game/src/ui/tutorial.js` (the steps and how each ends), `game/src/data/tutorial-text.js` (every word it shows, in one place) and `game/styles/18-tutorial.css` (where the card sits on each screen format). `app.js` only installs it and calls it when the game repaints.

## How the story is put together

Heroes are drawn at random (five are drawn and the player keeps three; the two put back may be lent later, `drawLots` and `keptLots` in `rules/journey.js`) and the boards come in a different order each run, so the story text is kept in three layers that never refer to one another:

| Layer | File | Tied to |
| --- | --- | --- |
| The spine | `game/src/data/maze-tale.js`, `wake-tale.js` | a position in the run and its 境界 (the difficulty the player picked for the run): falling asleep into the valley, the first board, the night talk, what 求敗 says after each board, the end, and the last board and the ending (`finale`). Everything 求敗 and 韋小寶 say is here |
| The boards | `game/src/data/encounter-script.js` | one map: its black stones, on whom 求敗 has pressed a 戰意 that makes them fight, the named stones he sets down beside them, the things on the board (`objects`: the qin, the drum, the star posts), and what its master says on the last board, where he stands of his own accord (`guest`) |
| The heroes | `game/src/data/hero-voices.js` | one hero: arrival, deja vu, night talk, the art that made their name coming back, farewell |

To add a board, write its own entry (with its master's `guest` line for the last board, which is about himself only); to add a hero, write their own lines. Neither needs changes elsewhere (what else a new board needs is under "The fifteen boards" below). (A hero from the same series of books as a board's master may also be given a line on that board; that is optional.)

A hero is the same id in seven tables: the entry in `data/new-heroes.js` (name, bio, starting art; `role` is the class the player is not shown), starting numbers and the starting art's rule in `rules/game.js` (`HERO_STATS`, `SIGNATURE_RULES_BY_HERO`; `PARTNERS` for a 合璧 partner, `STARTING_GEAR` for what they arrive wearing), the leader's boon in `rules/battle-mastery.js` (`COMMANDS`), the tree in `data/mastery-catalog.js` (`HERO_PATHS`, `MASTERY_ARTS`), each art's form tags in `data/form-catalog.js`, its ink stroke in `fx/technique-strokes.js`, and the lines in `data/hero-voices.js`. The wiki, the draw and 試局 follow from those. 無名 has no lines in the heroes' layer: his are the spine's, on the board or off it. `rules/journey.js` (`dialogue`) assembles a scene from the three. The design is described in `wiki/content/單輪劇本.md`, and the world behind it in `wiki/content/世界觀設定.md`.

All story text is written in 金庸's manner: plain classical mixed with vernacular, forms of address that fit each speaker, no modern words. The rules and worked examples are in `wiki/content/單輪劇本.md` §15.

The one who set the boards is 求敗 (`QIUBAI` in `maze-tale.js`), who sits across the table from the first scene; his portrait is `game/assets/npc-qiubai.webp`. On the last board he is a piece (`qiubai` in `VILLAINS`), drawn with his own sheet.

Prompts for the pictures the story still needs are in `asset-gen/prompts.md`, with each file's name, size and where its subject must sit. Pictures the game already shows (its group A) are all in place; the rest are new scenes that are text-only today.

The marked stone is six files, `stone-marks-0.webp` to `stone-marks-5.webp`, showing none to five marks. They were made from one painting by covering the later marks with bare stone from the same picture, so the journal can show exactly as many marks as runs have been finished.

## The fifteen boards

A run is ten boards drawn from fifteen (`routeFor` in `game/src/rules/journey.js`). 青竹渡 is always the first and 無刻漏臺 the last; the eight between stand in tiers of like strength, and each tier holds one of the five boards added on 2026-11-22, so about three of them turn up in a run:

| Stage of the run | Drawn from |
| --- | --- |
| 2nd and 3rd | two of 紅楓驛, 蘆花汀, **神龍竹堂** (洪安通) |
| 4th and 5th | two of 聽雪棧, 空山琴臺, **絕情花徑** (公孫止) |
| 6th and 7th | two of 桃花石陣, 襄陽殘垣, **鐵掌溪灘** (裘千仞) |
| 8th | 寒玉石室 or **西夏夜苑** (李秋水) |
| 9th | 倒影天街 or **黑木繡閣** (東方不敗) |

A run saved before then has no `routes` field and keeps the route its seed made at the time (the first ten boards only).

The five added boards are each built round one villain: he is the 局主, there is no lieutenant, and the other three of the board's fixed four pieces are his troop type (`GARRISONS` in `game/src/data/encounters.js`). A board needs an entry in each of these, by map index: `data/terrain.js` (layout), `data/encounters.js` (`ENCOUNTERS`, `RANKS`, and `GARRISONS` if it has no lieutenant), `data/martial-arts.js` (`CAPTAINS`), `data/battles.js`, `data/encounter-script.js`, `data/maze-tale.js` (`CHAMBER_TALES`), a tier in `routeFor`, `scene/maze-atmosphere.js` (sky and the plane below), `scene/stage-light.js` (light rig), `audio/ambience.js` (sound bed), `scene/maze-scenery.js` (palette, depth and, for boards 10 on, the earlier board whose tile language it borrows) and a landform module `scene/landforms/landform-N.js` listed in `scene/environment.js`, plus a picture `wiki/assets/map-N.webp`. For the last board it also needs its master's `guest` line (`data/encounter-script.js`, said when he walks onto 谷底棋臺 of his own accord), his `GUEST_GISTS` note if his own board's note speaks of things only that board has, and a kind of weapon in `ARM_OF` for each of its enemies (`data/encounters.js`; what 無名's nine forms answer). The last board itself is map 15 and stays there: a new board takes the next free index after it (16 on), and nothing reads the last board as the last index (`LAST_MAP` finds it by its `last` mark).

## A script package for a prose edit

`script-package/` holds everything a writer, or another LLM, needs to rewrite the story's prose
without touching the story: a brief (`README.md`), the prompt to give the writer (`PROMPT.md`), the
two design documents, an overview of how the game plays and when each line is shown, a sample
playthrough (`04-試玩劇本.md`: three runs played by the game's own `dialogue` and printed scene by
scene with each line's id, the one place to see how lines from different layers follow one
another), and the three script files, one per story layer
(`10-主線劇本.md`, `11-各局劇本.md`, `12-俠客劇本.md`). Every editable line is listed once, with an id
(`〔S012〕`), who says it and a note on when it plays: 860 lines, from the spine, the boards (with the
villains' bios and 變招 lines) and the heroes (with their bios and tree introductions). Names and
labels are left out.

```bash
node tools/script-package.mjs                          # rebuild the package from the game
node tools/script-package.mjs --apply DIR --dry        # report what an edited package would change
node tools/script-package.mjs --apply DIR              # write the edited lines back into the game
```

`--apply` reads every `〔id〕` line in the files in `DIR` whose names start with `10-`, `11-` or `12-`
(so a returned `notes.md` is never read as an edit), finds each line's string literal by
its path in `manifest.json` (`MAZE_TALE.after[2][4].text`) and replaces only the ones whose text
changed. It refuses a line that came back empty, a line whose placeholders (`{name}`, `{hero}`)
changed, and a line whose source was edited after the package was made. Run the story, wiki and
font checks afterwards. Rebuild the package after changing story text, so the next editor gets the
current lines. The hand-written parts are in `tools/script-package/` (`brief.md`, `prompt.md`, `mechanics.md`,
and `playthrough.mjs`, which picks the three sample runs).

## How the wiki stays in step with the game

The wiki holds no copy of the game's data. When the page opens it imports the game's modules through `wiki/src/game-data.js` and builds every section from them:

| Wiki section | Built by | Read from the game |
| --- | --- | --- |
| 群俠列傳 | `catalog/heroes.js` | hero details, starting stats, leader commands, art trees: the ten heroes and 無名 |
| 俠客對照 | `catalog/compare.js`, `view/compare.js` | up to five heroes side by side (`#compare?h=guo,huang`): six aspects scored bare-handed (no weapon or gear) with the game's own `forecast` and `damage` at level 12, a growth curve by level, every art at level 12, and a ranking of every hero (`&s=<aspect>` to sort). 群俠列傳 shows each hero's 綜合 from the same module. Its weights are named at the top of `catalog/compare.js` |
| 武學總譜 | `catalog/skills.js` | every technique; numbers come from the game's own `moveFacts()` |
| 百物譜 | `catalog/items.js` | items, shop prices, manuals |
| 群敵錄 | `catalog/foes.js` | each board's master and lieutenant, the villains who join them, 求敗 on the last board, and troop types |
| 江湖人物 | `catalog/folk.js` | the youth, the eagle and 韋小寶 |
| 任務簿 | `catalog/missions.js` | each board's battle (how it is won, its enemies and reinforcements, its pool of secondaries) and the heroes' trials |
| 戰鬥規則 | `catalog/rules.js` | every rule word (`data/rule-terms.js`) with the arts, items and enemies that carry it; the kinds of secondary; growth numbers; the in-game guide and its keys |
| 棋局輿圖 | `catalog/maps.js` | map layouts and terrain: the fifteen boards and the last board |
| 局中紀事 | `catalog/story.js` | all scripted dialogue and narration |
| 遊戲原文 | `corpus/` | every Chinese string in the game's source, found by parsing the files |

Change a number, a name or a line of dialogue in `game/src/` and the wiki shows it on the next reload.

What is written by hand in the wiki:

- `wiki/content/世界觀設定.md` — the world view. Edit the Markdown and reload; each `## N. 標題` becomes a page.
- `wiki/content/單輪劇本.md` — the story of a single run, mapped to the existing mechanics. Same format. To add another manuscript, list it in `MANUSCRIPTS` in `wiki/src/catalog/lore.js` and give it a category in `wiki/src/view/html.js`.
- `wiki/src/catalog/notes.js` — a few sentences explaining rules that exist only as code (how medicine is used, when a boss charges its signature art, late-stage enemy behaviour). Revisit this file if those rules change.
- Page titles and section headings in `wiki/src/catalog/`.
- `wiki/src/corpus/sections.js` — which heading each line of game text is filed under. New game code that is not listed still appears, under its function name.
- The sixteen map pictures in `wiki/assets/`. The clickable terrain grid beside them is live.

When the wiki needs something new from the game, export it from the game module and add that module to `game-data.js`. Do not copy values into the wiki.

### Rule words

`game/src/data/rule-terms.js` holds the game's rule words (連環, 代價, 升降, 坐鎮, 勝負 …), one sentence each, and the paragraphs of the in-game guide. The guide (`ui/panels.js`, `helpPage`) and the wiki's 戰鬥規則 section both read it, so a rule is worded once.

- **Few words, on purpose.** A rule is a word only if it leaves a state on a piece the player must track, or many cards share it, and the player meets it often (the producer, Q-N132 and Q-N152; 0.46). Everything else is said in a plain sentence on its own card (`rules/move-facts.js`), item or enemy page (`enemyTraitLines` in `rules/game.js`), and its field is listed in `PLAIN_FIELDS`; a 戰鬥效果 of that kind is in `PLAIN_FORMS` (`rules/form-rules.js`), whose name is a short phrase rather than a word. The six stat ups and downs share one word, 升降, and the four prices of a summit one word, 代價; the 勝負 entry has a line for each way a board is won (`OUTCOMES`), and the wiki a page for each.
- **Adding a mechanic:** add its term there, with the field that carries it (`art`, `item`, `trait`, `condition` or `form`; a term may name a list of them), or list the field in `PLAIN_FIELDS` and have the card say it. The wiki gives a term a page and lists every art, item and enemy that has it, and those pages link back.
- **The marks on a piece** (`STATUS_SIGNS` in `game/src/actors/tokens.js`): one character from each condition's name; a stat that went up or down shows 攻, 防 or 移 with an arrow in the badge's corner, a price what it holds back with a lock (解厄 cannot lift it), and 亂氣 its layers (`STATUS_MARKS`). The wiki's 棋子上的記號 lists them as 「攻（升）」, 「防（降、鎖）」.
- **What stops the wiki falling behind:** `node tools/check-wiki.mjs` fails when an art, item or enemy carries a field no term accounts for, when an enemy, board piece, kind of battle or kind of secondary has no page, or when a page shows a value that failed to resolve.


## Checks

```bash
node tools/check-wiki.mjs
node tools/check-story.mjs
```

Builds the catalog and the text listing from the game sources and fails if a page links to something that does not exist, a picture is missing, or a fact has no source reference. Run it after changing game data.

`check-story.mjs` plays several hundred runs without a browser, with different heroes and board orders, through all five 境界 (picked, opened and won in every order), on to the last board (won and lost) and into the runs after the ending with 無名 on the board, and fails if any scene has a line with no speaker or text, if a hero lacks one of their own lines, if a board's script mentions another board, if a named black stone has no lines or a hero answers one from another series of books, if 求敗 or 韋小寶 misses a line the story promises (after each board, the side bet, 請回吧), if the last board is not cast from the run's ten masters or one of them has no line there, if the ending's words or the film's files are missing, or if a save made mid-run no longer loads. Run it after changing story text.

### Mechanics

```bash
node tools/check-mechanics.mjs
```

Builds small battles with the real rules and checks each mechanic of the skill and villain redesign against its specification: conditions from application to expiry, conditional bonuses on and off, use restrictions and their reasons, villain traits, the last board (問劍, 不敗, 無招, the forms that answer a weapon, 無名 joining and leading, new game plus), and old saves loading. One line per check; exits 1 on any failure. Each mechanic is its own block in the file, so a new mechanic adds a block.

### Skill trees

```bash
node tools/check-skills.mjs            # fails (exit 1) on any violation
node tools/check-skills.mjs --report   # the same listing, always exits 0
node tools/check-skills.mjs --verbose hero guo   # only these heroes, and why each comparison passed
```

Prints each hero's tree as a table and then every problem it finds against the skill-redesign rules: the tree's structure (layout and `MASTERY_ARTS` agree, tiers, prerequisites in earlier tiers, everything reachable, one basic upgrade, a single gated summit that costs the most, total points), R2 (no node weaker than an ancestor at that ancestor's job unless it adds reach, safety, an effect or a lower cost), R4 (the summit is the hero's best at its job; the starting art does not out-damage later strikes), R5 (no two nodes doing the same job equally well) and, as warnings only, R9 (each art's plain strike equivalent against its tier band). It also lists the shop manuals in the same measures and warns where one duplicates a node of the hero most likely to buy it. Every number is the game's own `forecast` on a small scene on a real board, against enemies taken from real boards, including a favourable case for arts whose power depends on the situation. An art with conditional power (破招, 孤行, 合璧, 黯然, 還報, 斬殘, 傾力) is measured twice, with its condition unmet and in the situation its rule describes laid out on the board, and is an upgrade where it is at least as strong in that situation and not much weaker outside it; a later strike bought for a capability (吸勁, 定身, 纏械, 代受, 挑釁 …) is not held to the starting art's damage; prices (露空, 無守, 立樁, 留力, 調息, 反噬, 壓箱) are deducted in R9. The effects that hold an enemy or guard a hero (定身, 閉穴, 受制, 金剛, 固守) and 吸元 are capabilities too, priced by how many turns they last; a splash that reaches two or three tiles (濺射 with reach) is measured on a scene with enemies standing that far out. How each field is read (bookkeeping, measured, conditional, capability, price) is in one block at the top of `tools/lib/skill-measure.mjs`; any other field counts as a mechanic, so new mechanics need no change to the tool. Thresholds, prices and the reference levels are in one block at the top of `check-skills.mjs`.

### Battle simulator

```bash
node tools/sim-battles.mjs --runs 200 --seed 1 --json before.json
node tools/sim-battles.mjs --boards 1-4 --runs 50      # only the first four boards
node tools/sim-battles.mjs --realm 5 --boards 1-11     # whole runs in 無劍境界, on to the last board
node tools/sim-battles.mjs --last --runs 200           # the last board alone, heroes at level 11
node tools/sim-battles.mjs --compare before.json after.json
node tools/sim-battles.mjs --runs 1 --trace            # the battle log of one run
node tools/sim-battles.mjs --runs 40 --arts            # also: how often each art was equipped and used
```

A fixed, deterministic headless player fights whole runs with the real rules and enemy code: it draws heroes, starts the run, spends points (cheapest node toward the summit, spare points into talents), equips its three strongest arts with distinct jobs, buys medicine and gear, and on every turn scores each legal move-and-action with `forecast` (kills, damage minus counter, cover, the enemy reach it ends in, the leader's safety, the board's marker or time limit), with a value for every enemy turn an art takes away (定身, 閉穴, 受制) and every blow a guard voids (金剛, 固守). Per board it reports win rate, rounds to win, health left, heroes downed, side objectives and how often the basic attack, the starting art and each tier were used; per hero, damage dealt and taken, share of kills and damage, and level and points at each board. `--compare` prints what moved between two saved runs and flags boards whose win rate changed by more than ten points. `--growth` adds a table, per board won, of the average level and points of the heroes who fought it, of those on the bench, and of the hero who joins (the simulated player never changes its line-up, so everyone recruited after the second board stays on the bench). The same seed always gives the same result, so compare runs made with the same `--runs` and `--seed`.

### Scenery and sound

Two more tools help when the scenery or the sound changes. Both need Playwright with Chromium, and neither needs a web server:

```bash
node tools/shoot-map.mjs 3 pictures/     # map 3 (0 to 15; 15 is the last board) from nine camera angles, with draw calls and triangles
node tools/sound-check.mjs               # every sound: no clipping, clean start and end, balanced loudness
```

A character from the roster pack enters the game with `python3 tools/roster-art.py <id>`, which writes its sheets, still and portrait into `game/assets/`; its id is then added to `game/src/data/roster-art.js`. The youth and 求敗 come from `asset-gen/story-characters/` instead (`python3 tools/roster-art.py --story youth qiubai`). A piece then becomes that character by naming the id as its `mini`. For one of the pack's heroes the tool also writes the standing figure the 整備 wardrobe shows (`figure-<id>.webp`, the first idle frame enlarged) and keeps the portrait at the heroes' size. To check how a sheet draws, `node tools/shoot-roster.mjs pictures/ --ids <id> --beside chief` saves every frame of its five rows on a real board beside a piece already in the game (add `--mobile` for a phone), and `tools/roster-preview.html?ids=<id>,chief` shows them playing. Both need Playwright with Chromium, and no web server.

The sixteen map pictures in `wiki/assets/` are `shoot-map.mjs` pictures: `--bare --only opening --size 1560x992`, halved to 780 by 496. Take them again after changing a map's scenery.

## Fonts

The two River fonts in `game/assets/` contain only the characters the game first used. Each exists twice with the same characters: the game and the wiki load `river-*.woff2`; the `.woff` files are the fallback for browsers without WOFF2 and what `tools/extra-fonts.py` reads. The `.woff2` files hold the Traditional Chinese glyphs only: the alternate Japanese, Korean, Simplified and Hong Kong shapes of the same characters are left out, which halves them and changes nothing on a page marked `lang="zh-Hant"`, as the game is. Characters added later, in game text or in the wiki's manuscripts, fall back to a system font unless they are added to the supplements: `game/assets/extra-*.woff2` for characters the game needs, and `wiki/assets/lore-*.woff2` for the rest. One command rebuilds both:

```bash
python3 tools/extra-fonts.py
```

This needs `fonttools`, `brotli` and the Noto CJK fonts; the script's header has the details. `--check` lists the missing characters without writing anything.

## Third-party

- three.js (MIT) — `game/vendor/three.min.js`
- acorn (MIT) — `wiki/vendor/acorn.js`, licence alongside
- Noto CJK fonts (SIL OFL) — see `game/THIRD-PARTY-NOTICES.txt`
