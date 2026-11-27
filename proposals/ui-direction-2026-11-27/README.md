# A less machine-made interface: a layout mock-up (2026-11-27)

Asked by the producer on 2026-11-27: the game looks good but has a strong AI-made flavour, and should feel more like a AAA tactics game on phone and desktop. This is a mock-up of the layout to decide on before anything in the game changes. **Decided and built on 2026-11-27** (ROADMAP Q-N169, 0.61): as sketched, except that 軍情 keeps its square plan, the enemy's turn keeps the red banner, and the skill tree keeps its curved lines. The look is the switch `inkLook` in `game/src/polish.js`; `?polish-off=inkLook` or `?classic` rolls it back.

- `mockup.html`: the first six artboards (title, 整備, battle), built over clean captures of the game's own 3D scenes (`plates/`, the interface hidden) and the game's own art and fonts. Open it from a served copy of the repository (`python3 -m http.server`, then `/proposals/ui-direction-2026-11-27/mockup.html`).
- `mockup-pages.html`: sixteen more artboards for the other pages (below), added the same day at the producer's word to sketch every page before building. Both files share `mockup.css`.
- `shots/`: each artboard at 2× (`*.webp`); `compare-*.jpg`, today's game on the left and the mock-up on the right; `phones-pages.jpg`, the six phone pages side by side.

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

## The other pages (sketched 2026-11-27)

Each follows the rules above. What each one changes:

| Page | Today | Sketch | Files |
| --- | --- | --- | --- |
| 選境界 | A window with five bordered rows | Five tall columns, each 境界's name set vertically with its line beside it; won ones carry a 勝 seal; the enemy's numbers at the foot of each | `realm-desk` |
| 抓子 | A window: a painting, then five portrait cards with tags | Five full-length figures hung as scrolls; kept ones lit with a 留 stone, put-back ones greyed, the leader sealed 領隊; 落子 is the stone. Upright phone: the scrolls slide sideways, the third showing at the edge | `draw-desk`, `draw-phone` |
| 軍情 | A window: a tile plan and four labelled sections | The plan drawn as a go board in kaya wood: white stones numbered for the starting places, black stones for the enemy, the master sealed 主. The four sections are headed by one large character each: 勝, 敗, 支, 入 | `brief-desk`, `brief-phone` |
| 武學 | Three rows of tabs over a boxed tree of boxed nodes | One row of hero stones. The tree drawn as a go diagram: an art learned is a white stone, one that can be learned is a ring, one locked is a small dot, the summit is a larger empty point. The chosen node's gain is shown at 44 px | `arts-desk`, `arts-phone` |
| 裝備 | Slots and stock in boxes | The hero's scroll, two round slots, the change to his numbers shown large (攻擊 29 → 33); the stock as item art on round grounds | `gear-desk` |
| Arts list and forecast | A boxed list beside the hero; the forecast docked beside the fighters | The list sits on an ink wash with no frame, and a line of kaya gold joins the chosen art to the hero. While aiming, the forecast takes the bottom of the screen: the two fighters face each other, the blow is shown at 64 px and both 氣血 go from before to after. The corner stone reads 出招. On an upright phone the forecast is a band under the round and the arts sit at the foot | `aim-desk`, `aim-phone` |
| Enemy turn | A red banner reading 敵方行動 | The round's stone turns black, a black band reads 敵方落子, and 結束回合 dims | `enemy-desk` |
| Story | A window: a portrait in a frame, text on cream, buttons | The speaker painted large and fading into the scene, the line in 26 px type at the foot, small stones for progress, and a small white stone (續) to go on | `story-desk`, `story-phone` |
| 通吃坊 | A window of cream cards in four boxed groups | 韋小寶 large at the left fading into the room, the purse at 46 px, the goods as rows with prices as numbers, the dice cup by his hand, 啟程 the stone | `shop-desk`, `shop-phone` |
| Battle, sideways phone | Not drawn before | The desktop layout made smaller | `battle-wide` |

Found while sketching:

- **Points or squares.** Go puts its stones on the points where lines cross, but this board's pieces stand on squares. The 軍情 sketch uses points, so its water patches (on squares) and its stones (on points) do not line up. Recommendation: when it is built, draw the plan as squares with the stones in their centres, and keep the go look in the stones, the wood and the line colour.
- **Larger portraits show their finish more.** The story and shop pages paint the speaker large, and that makes the near-photographic portraits (point 5) more noticeable, not less.
- **One corner stone, several meanings.** The stone at the bottom right reads 入夢, 整備, 出陣, 出招, 結束回合, 啟程, 落子 or 續 as the step forward changes. That is the rule working as intended, but 出招 and 結束回合 share a corner, so a hurried second tap could end the turn. When building, the stone should not change meaning under a press that has already started.

## What the mock-up does not settle

- **Pages still not drawn:** the title's settings, the save slots, the guide, 群俠列傳, the dice game, the hero sheet (俠客詳情), the run summary after a loss, and the last board's 求敗 gauge. They are smaller and would follow the same parts.
- **Phone landscape** is drawn for the battle only.
- **Motion.** The intended moments are the round's stone turning black at the enemy's turn, the 出陣 stone being played onto the board, and the gold line drawing out from the chosen art to the hero. None of them is shown here.
- **The portraits' style** (point 5).
- **Cost.** It is a restyle of most of `game/styles/` (about 13,800 lines in 20 files) and of the page templates in `game/src/ui/`. The switches in `game/src/polish.js` and `?classic` would keep the old look reachable while it is built.
