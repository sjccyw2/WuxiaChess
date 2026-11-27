# A less machine-made interface: a layout mock-up (2026-11-27)

Asked by the producer on 2026-11-27: the game looks good but has a strong AI-made flavour, and should feel more like a AAA tactics game on phone and desktop. This is a mock-up of the layout to decide on before anything in the game changes. **Nothing in the game was changed.**

- `mockup.html`: the six artboards, built over clean captures of the game's own 3D scenes (`plates/`, the interface hidden) and the game's own art and fonts. Open it from a served copy of the repository (`python3 -m http.server`, then `/proposals/ui-direction-2026-11-27/mockup.html`).
- `shots/`: each artboard at 2× (`*.webp`), and `compare-*.jpg`, today's game on the left and the mock-up on the right.

## Why it reads as machine-made

Taken from screenshots of the game at `41f3c8d` (1440 × 900 and 390 × 844), not a general list.

1. **Website structure where a game is expected.** The title screen is a web page header: brand at the left, links and icons at the right, a hairline rule under them, 「江湖誌 ↗」 with an outbound arrow. 軍情 and 整備 are modal windows with a title bar, a close button, a tab strip and a footer, floating over a blurred game, which is how an admin dashboard looks.
2. **One box style for every container.** Each container is the same dark navy rectangle with a thin gold border and the same small radius, nested up to four deep (window, section, card, stat cell). Image generators default to this "card kit", and players recognise it.
3. **Flat type.** Nearly everything is 12 to 15 px; 氣血 148 is set no larger than its label; small labels (勝利, 敗退, 支線, 入局) sit over hairline dividers.
4. **Template filler.** Strings joined with middle dots (「第一局 · 青竹渡」, 「領隊 · 華山派」, 「出陣 · 5 人」, 「斬將 · 在第十二回合…」), chevrons on buttons, a generic set of line icons, helper sentences under controls.
5. **Three art styles at once** (not fixable by layout): photographic-looking painted portraits, pencil figures on paper, and a stylised low-poly board. AI portrait painting in particular has a recognisable finish. Noted here, not addressed.

## The direction

The fiction gives the interface its language: the whole game is 求敗's go board, the heroes are his white stones and the adversaries his black.

| Token | Value | Used for |
| --- | --- | --- |
| 白子 | `#f2eee6` | Primary text; the stone that moves the game on; hero rims |
| 黑子 | `#1b1e20` | The enemy's turn; enemy rims |
| 榧木 | `#c9a462` | The board's line: focus, the selected hero, progress |
| 青瓷 | `#8cc7b1` | Allies' 氣血 (kept from today) |
| 朱砂 | `#b5402c` | Seals only (領, 主), never buttons |

- **No windows.** Pages are full-screen. The board stays visible behind 整備, blurred, so preparing reads as part of the battle and not a form laid over it. Legibility over the 3D scene comes from ink-wash vignettes in the corners, not from boxes.
- **One control moves the game on.** Wherever the player is, the step forward is a white go stone at the bottom right: 出陣 in 整備, 結束回合 in battle; on the title screen a stone marks the chosen line. The round number is written on a stone at the top left, which would turn black for the enemy's turn.
- **Type with real contrast.** The game's own RiverSerif throughout; numbers at 34 to 48 px over 13 px labels; the hero's name set vertically and large (豎排) beside the figure, which hangs as a scroll.
- **Heroes as stones.** Portraits are cut round in a white rim (enemies in a black one), so the line-up and the selected-unit plate use the same piece as the board.
- **Cut:** middle-dot strings, helper sentences under controls, chevrons, the title screen's top bar, and most borders.

Checked against the generic defaults: a first sketch used a red primary button on a dark panel, itself one of the commonest generated looks, so red was kept to seals and the stone took the button's job.

## What the mock-up does not settle

- **Every other page.** 軍情, 武學 (the tree), 裝備物資, the shop, story pages, the hero pick, the arts list beside a hero and the strike forecast are not drawn. They would follow the same rules; the forecast and the arts list need their own sketch, since they hold the most numbers.
- **Phone landscape** (844 × 390) is not drawn.
- **Motion.** The stone turning black at the enemy's turn and the 出陣 stone being "played" onto the board are the intended moments, not shown here.
- **The portraits' style** (point 5).
- **Cost.** It is a restyle of most of `game/styles/` (about 13,800 lines in 20 files) and of the page templates in `game/src/ui/`. The switches in `game/src/polish.js` and `?classic` would keep the old look reachable while it is built.
