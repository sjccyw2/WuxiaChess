# WuxiaChess · 劍影江湖

A 3D wuxia tactics game, and a wiki (江湖志) that documents it by reading the game's own data.

- **Play:** `game/`
- **Wiki:** `wiki/`
- **Landing page:** `index.html`

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
    data/             content tables: heroes, arts, foes, maps, story
    rules/            game logic: combat, journey, shop, formations
    scene/            3D battlefield, camera, scenery, landforms
    actors/           sprites and movement on the board
    fx/               technique and skill effects
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
tools/
  check-wiki.mjs      builds the wiki outside a browser and checks its links
  extra-fonts.py      regenerates the extra font characters for the game and the wiki
```

## How the wiki stays in step with the game

The wiki holds no copy of the game's data. When the page opens it imports the game's modules through `wiki/src/game-data.js` and builds every section from them:

| Wiki section | Built by | Read from the game |
| --- | --- | --- |
| 群俠列傳 | `catalog/heroes.js` | hero details, starting stats, leader commands, art trees |
| 武學總譜 | `catalog/skills.js` | every technique; numbers come from the game's own `moveFacts()` |
| 百物譜 | `catalog/items.js` | items, shop prices, manuals |
| 群敵錄 | `catalog/foes.js` | encounters and troop types |
| 江湖人物 | `catalog/folk.js` | the ferrywoman, the visitor, wayside travellers |
| 任務簿 | `catalog/missions.js` | side objectives, trials, rewards, growth numbers |
| 十渡輿圖 | `catalog/maps.js` | map layouts and terrain |
| 渡中紀事 | `catalog/story.js` | all scripted dialogue and narration |
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
```

Builds the catalog and the text listing from the game sources and fails if a page links to something that does not exist, a picture is missing, or a fact has no source reference. Run it after changing game data.

## Fonts

The two River fonts in `game/assets/` contain only the characters the game first used. Characters added later, in game text or in the wiki's manuscripts, fall back to a system font unless they are added to the supplements: `game/assets/extra-*.woff2` for characters the game needs, and `wiki/assets/lore-*.woff2` for the rest. One command rebuilds both:

```bash
python3 tools/extra-fonts.py
```

This needs `fonttools`, `brotli` and the Noto CJK fonts; the script's header has the details. `--check` lists the missing characters without writing anything.

## Third-party

- three.js (MIT) — `game/vendor/three.min.js`
- acorn (MIT) — `wiki/vendor/acorn.js`, licence alongside
- Noto CJK fonts (SIL OFL) — see `game/THIRD-PARTY-NOTICES.txt`
