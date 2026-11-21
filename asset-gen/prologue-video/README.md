# Prologue video

`prologue-30s.mp4` is a 30-second, 9:16 cut of the whole first-run prologue (入夢) in a manga
style, with comic-page cuts in the manner of *Into the Spider-Verse*: panels break into the frame
and expand, two panels share the screen as a manga page, the camera moves on twos, and impacts
flash, burst and misregister. The copy here is 720 × 1280; the cut was rendered at 1080 × 1920
and can be rendered again at that size with `make/` (see `make/README.md`). Made 2026-11-21;
roadmap 1.11. A 10-second first test came before it.

| Time | Panel | Entrance | Words |
| --- | --- | --- | --- |
| 0–2.0 s | `s1-asleep` | (opening) slow push in | 這一覺睡得好沉 |
| 2.0 s | `s2-eyes` | a slanted band slams across the middle, flash, burst lines, then fills the frame | 睜開眼來 |
| 3.4 s | `s3-valley` | halftone-dot wipe; the camera tilts down the whole tall panel | 竟不在自家床上 · 但見好大一座山谷 |
| 6.2 s | `d-selfplay` | a wedge breaks in from the lower right, then expands | 一個老者自己同自己對弈 |
| 8.4 s | `s4-board` | iris from the board; 「鏘」 | 棋子之上人影鬥得正緊 |
| 10.0 s | `s5-eagle` | breaks in from the left, two shakes (it looks twice) | |
| 11.2 s | `g-lost` | drops in from the top | 「這是甚麼地方？我是不是死了？」 |
| 13.0 s | `s6-qiubai` | breaks in from the right | 「咦。」「你是甚麼人？」 |
| 15.0 s | `i-name` | slides up as the lower panel of a manga page under 求敗 | 「我叫阿石。老伯，你又是誰？」 |
| 17.0 s | `j-reveal` | iris from his face, flash; 「求敗」 in big red lettering | 「世人叫我」 |
| 19.2 s | `k-disbelief` | breaks in from the right | 「天下哪有人盼著打敗仗的？」 |
| 20.6 s | `l-hands` | halftone-dot wipe | 「左手同右手，已下了幾百年。」 |
| 22.8 s | `m-box` | breaks in from the upper left | 「坐下。抓三枚。」 |
| 24.4 s | `n-cantplay` | the lower panel of a manga page under 求敗 | 「我不會下棋。」 |
| 25.6 s | `o-grab` | iris from the box | 「子自己會走，自己會打。」 |
| 27.4 s | `p-rise` | a band slams in, flash; 「嗒」 three times; title at 28.7 s | 三枚白子登時亮了 · 劍影江湖 · 一念江湖 |

- **Panels** (`panels/`): painted with an image model (OpenAI `gpt-image-2.6-flare`) in one manga
  style: bold ink line, spot blacks, screentone, speed lines, a muted ink-green, slate and ochre
  wash. The youth, the eagle and 求敗 were painted from their game portraits as references. The
  panels hold no lettering, as `prompts.md` asks of every picture. The youth's name is the default, 阿石.
- **Lettering**: narration boxes and speech balloons carry the prologue's own words, shortened (`MAZE_TALE.prologue` in
  `game/src/data/maze-tale.js`), set vertically in the game's serif (`river-serif` with the `extra-serif`
  supplement) when the frames are rendered.
- **Sound**: synthesised for the cut: a drone, plucked-string notes on a pentatonic scale, a whoosh on
  every panel entrance, thumps on impacts and three stone clicks. It is a placeholder for real music.
