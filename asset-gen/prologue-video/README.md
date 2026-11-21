# Prologue video: first cut

`prologue-cut.mp4` is a 10-second, 9:16 (1080 × 1920, 30 fps) cut of the prologue (入夢) in a manga
style, with a light sound bed. Made 2026-11-21 as a test; roadmap 1.11.

| Time | Panel | Camera | Caption |
| --- | --- | --- | --- |
| 0–1.6 s | `s1-asleep` the youth asleep, moonlight through the window | slow push in | 這一覺睡得好沉 |
| 1.6–2.7 s | `s2-eyes` his eyes snap open | white flash, zoom punch, shake | 睜開眼來 |
| 2.7–4.7 s | `s3-valley` the valley from above, the table far below | tilt down the whole tall panel | 四面峭壁如削 |
| 4.7–6.2 s | `s4-board` tiny warriors fighting on the stones | snap pull-out from a tilt | 棋子之上鬥得正緊 |
| 6.2–7.5 s | `s5-eagle` the eagle turns its head | flash, punch, shake | |
| 7.5–10 s | `s6-qiubai` 求敗 looks up, a black stone in his fingers | slow push in; title at 9 s | balloon 「咦」, then 劍影江湖 · 一念江湖 |

- **Panels** (`panels/`): painted with an image model (OpenAI `gpt-image-2.6-flare`) in one manga
  style: bold ink line, spot blacks, screentone, speed lines, a muted ink-green, slate and ochre
  wash. The youth, the eagle and 求敗 were painted from their game portraits as references. The
  panels hold no lettering, as `prompts.md` asks of every picture.
- **Lettering**: the captions are the prologue's own words (`MAZE_TALE.prologue` in
  `game/src/data/maze-tale.js`), set in the game's serif (`river-serif` with the `extra-serif`
  supplement), vertical as in manga, added when the frames were rendered.
- **Sound**: synthesised for the cut: a low drone, a whoosh and a thump on each impact cut, a stone
  click when he sets the stone down. It is a placeholder for real music.
