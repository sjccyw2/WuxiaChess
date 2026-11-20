# WuxiaChess · 劍影江湖

A 3D wuxia tactics game, and a wiki (江湖志) that documents it by reading the game's own data.

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
    data/             content tables: heroes, arts, foes, maps, story (see below)
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
asset-gen/
  prompts.md          prompts for the art the story still needs
tools/
  check-wiki.mjs      builds the wiki outside a browser and checks its links
  check-story.mjs     plays hundreds of shuffled runs and checks the story holds
  extra-fonts.py      regenerates the extra font characters for the game and the wiki
  map-preview.html    draws one battlefield with the game's own board, camera and lighting
  shoot-map.mjs       photographs a battlefield from a set of camera angles
  sound-check.mjs     renders every sound and fails if one clips or is out of balance
```

## Presentation switches

Every visual upgrade layered on the original look has a switch in `game/src/polish.js`: board
pieces, combat effects, lighting and water, panel finish, the loading veil, and the added
controls (danger zone, `Tab` to the next hero, the side-docked strike forecast, and the
action flow that replaces the four-button command bar). Set a switch to
`false` to turn that one feature off; nothing else needs to change.

To compare without editing the file:

- `game/?classic` turns every switch off and shows the original look.
- `game/?polish-off=hitStop,screenShake` turns off only the ones named.

Styles for these features live in `styles/12-combat.css` and `styles/13-panels.css`, and every
rule there is scoped under an `html.polish-…` class that the switch controls.

## How the story is put together

Heroes are drawn at random and the boards come in a different order each run, so the story text is kept in three layers that never refer to one another:

| Layer | File | Tied to |
| --- | --- | --- |
| The spine | `game/src/data/maze-tale.js`, `wake-tale.js` | a position in the run: opening his eyes, the first board, the night talk, the end |
| The boards | `game/src/data/encounter-script.js` | one map: its master's obsession and the shadow to be saved |
| The heroes | `game/src/data/hero-voices.js` | one hero: arrival, deja vu, night talk, farewell |

To add a board, write its own entry; to add a hero, write their own lines. Neither needs changes elsewhere. `rules/journey.js` (`dialogue`) assembles a scene from the three. The design is described in `wiki/content/單輪劇本.md`.

Prompts for the pictures the story still needs are in `asset-gen/prompts.md`, with each file's name, size and where its subject must sit. Pictures the game already shows (its group A) are all in place; the rest are new scenes that are text-only today.

The marked stone is six files, `stone-marks-0.webp` to `stone-marks-5.webp`, showing none to five marks. They were made from one painting by covering the later marks with bare stone from the same picture, so the journal can show exactly as many marks as runs have been finished.

## How the wiki stays in step with the game

The wiki holds no copy of the game's data. When the page opens it imports the game's modules through `wiki/src/game-data.js` and builds every section from them:

| Wiki section | Built by | Read from the game |
| --- | --- | --- |
| 群俠列傳 | `catalog/heroes.js` | hero details, starting stats, leader commands, art trees |
| 武學總譜 | `catalog/skills.js` | every technique; numbers come from the game's own `moveFacts()` |
| 百物譜 | `catalog/items.js` | items, shop prices, manuals |
| 群敵錄 | `catalog/foes.js` | encounters and troop types |
| 江湖人物 | `catalog/folk.js` | the youth, 韋小寶, and the shadow to be saved on each board |
| 任務簿 | `catalog/missions.js` | side objectives, trials, rewards, growth numbers |
| 十局輿圖 | `catalog/maps.js` | map layouts and terrain |
| 局中紀事 | `catalog/story.js` | all scripted dialogue and narration |
| 遊戲原文 | `corpus/` | every Chinese string in the game's source, found by parsing the files |

Change a number, a name or a line of dialogue in `game/src/` and the wiki shows it on the next reload.

What is written by hand in the wiki:

- `wiki/content/世界觀設定.md` — the world view. Edit the Markdown and reload; each `## N. 標題` becomes a page.
- `wiki/content/單輪劇本.md` — the story of a single run, mapped to the existing mechanics. Same format. To add another manuscript, list it in `MANUSCRIPTS` in `wiki/src/catalog/lore.js` and give it a category in `wiki/src/view/html.js`.
- `wiki/src/catalog/notes.js` — a few sentences explaining rules that exist only as code (how medicine is used, when a boss charges its signature art, late-stage enemy behaviour). Revisit this file if those rules change.
- Page titles and section headings in `wiki/src/catalog/`.
- `wiki/src/corpus/sections.js` — which heading each line of game text is filed under. New game code that is not listed still appears, under its function name.
- The ten map pictures in `wiki/assets/`. The clickable terrain grid beside them is live.

When the wiki needs something new from the game, export it from the game module and add that module to `game-data.js`. Do not copy values into the wiki.

## Checks

```bash
node tools/check-wiki.mjs
node tools/check-story.mjs
```

Builds the catalog and the text listing from the game sources and fails if a page links to something that does not exist, a picture is missing, or a fact has no source reference. Run it after changing game data.

`check-story.mjs` plays several hundred runs without a browser, with different heroes and board orders, and fails if any scene has a line with no speaker or text, if a hero lacks one of their own lines, if a board's script mentions another board, or if a save made mid-run no longer loads. Run it after changing story text.

### Mechanics

```bash
node tools/check-mechanics.mjs
```

Builds small battles with the real rules and checks each mechanic of the skill and villain redesign against its specification: conditions from application to expiry, conditional bonuses on and off, use restrictions and their reasons, villain traits, and old saves loading. One line per check; exits 1 on any failure. Each mechanic is its own block in the file, so a new mechanic adds a block.

### Skill trees

```bash
node tools/check-skills.mjs            # fails (exit 1) on any violation
node tools/check-skills.mjs --report   # the same listing, always exits 0
node tools/check-skills.mjs --verbose hero guo   # only these heroes, and why each comparison passed
```

Prints each hero's tree as a table and then every problem it finds against the skill-redesign rules: the tree's structure (layout and `MASTERY_ARTS` agree, tiers, prerequisites in earlier tiers, everything reachable, one basic upgrade, a single gated summit that costs the most, total points), R2 (no node weaker than an ancestor at that ancestor's job unless it adds reach, safety, an effect or a lower cost), R4 (the summit is the hero's best at its job; the starting art does not out-damage later strikes), R5 (no two nodes doing the same job equally well) and, as warnings only, R9 (each art's plain strike equivalent against its tier band). It also lists the shop manuals in the same measures and warns where one duplicates a node of the hero most likely to buy it. Every number is the game's own `forecast` on a small scene on a real board, against enemies taken from real boards, including a favourable case for arts whose power depends on the situation. An art with conditional power (破招, 孤行, 合璧, 黯然, 還報, 斬殘, 傾力) is measured twice, with its condition unmet and in the situation its rule describes laid out on the board, and is an upgrade where it is at least as strong in that situation and not much weaker outside it; a later strike bought for a capability (吸勁, 失神, 纏械, 代受, 挑釁 …) is not held to the starting art's damage; prices (露空, 無守, 立樁, 留力, 調息, 反噬, 壓箱) are deducted in R9. How each field is read (bookkeeping, measured, conditional, capability, price) is in one block at the top of `tools/lib/skill-measure.mjs`; any other field counts as a mechanic, so new mechanics need no change to the tool. Thresholds, prices and the reference levels are in one block at the top of `check-skills.mjs`.

### Battle simulator

```bash
node tools/sim-battles.mjs --runs 200 --seed 1 --json before.json
node tools/sim-battles.mjs --boards 1-4 --runs 50      # only the first four boards
node tools/sim-battles.mjs --compare before.json after.json
node tools/sim-battles.mjs --runs 1 --trace            # the battle log of one run
```

A fixed, deterministic headless player fights whole runs with the real rules and enemy code: it draws heroes, starts the run, spends points (cheapest node toward the summit, spare points into talents), equips its three strongest arts with distinct jobs, buys medicine and gear, and on every turn scores each legal move-and-action with `forecast` (kills, damage minus counter, cover, the enemy reach it ends in, the leader's safety, the board's marker or time limit). Per board it reports win rate, rounds to win, health left, heroes downed, side objectives and how often the basic attack, the starting art and each tier were used; per hero, damage dealt and taken, share of kills and damage, and level and points at each board. `--compare` prints what moved between two saved runs and flags boards whose win rate changed by more than ten points. The same seed always gives the same result, so compare runs made with the same `--runs` and `--seed`.

### Scenery and sound

Two more tools help when the scenery or the sound changes. Both need Playwright with Chromium, and neither needs a web server:

```bash
node tools/shoot-map.mjs 3 pictures/     # map 3 from nine camera angles, with draw calls and triangles
node tools/sound-check.mjs               # every sound: no clipping, clean start and end, balanced loudness
```

The ten map pictures in `wiki/assets/` are `shoot-map.mjs` pictures: `--bare --only opening --size 1560x992`, halved to 780 by 496. Take them again after changing a map's scenery.

## Fonts

The two River fonts in `game/assets/` contain only the characters the game first used. Each exists twice with the same characters: the game loads `river-*.woff2`; the `.woff` files are what the wiki loads, the fallback for browsers without WOFF2, and what `tools/extra-fonts.py` reads. The `.woff2` files hold the Traditional Chinese glyphs only: the alternate Japanese, Korean, Simplified and Hong Kong shapes of the same characters are left out, which halves them and changes nothing on a page marked `lang="zh-Hant"`, as the game is. Characters added later, in game text or in the wiki's manuscripts, fall back to a system font unless they are added to the supplements: `game/assets/extra-*.woff2` for characters the game needs, and `wiki/assets/lore-*.woff2` for the rest. One command rebuilds both:

```bash
python3 tools/extra-fonts.py
```

This needs `fonttools`, `brotli` and the Noto CJK fonts; the script's header has the details. `--check` lists the missing characters without writing anything.

## Third-party

- three.js (MIT) — `game/vendor/three.min.js`
- acorn (MIT) — `wiki/vendor/acorn.js`, licence alongside
- Noto CJK fonts (SIL OFL) — see `game/THIRD-PARTY-NOTICES.txt`
