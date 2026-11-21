# Prologue video

`prologue-45s.mp4` is a 45-second, 9:16 cut of the whole first-run prologue (入夢) in a manga style,
lettered like a Hong Kong comic (港漫). The copy here is 720 × 1280; it was rendered at 1080 × 1920
and can be rendered again with `make/` (see `make/README.md`). Made 2026-11-21 (roadmap 1.11),
after a 10-second test and a 30-second cut that the producer asked to slow down.

**Pacing.** About three seconds a panel on average, but each beat has its own length, and only
three moments hit hard: the eyes opening, the eagle, and the box landing on 求敗's last words. The rest enter gently
(dissolves, slow slides, hard quiet cuts) so that the hits land. A picture stays on screen until
the next panel has fully covered it, so no transition shows the bare page.

| Time | Panel | Beat | Entrance | Words |
| --- | --- | --- | --- | --- |
| 0 s | `s1-asleep` | quiet | (opening) slow push in | 這一覺，睡得好沉。 |
| 4.2 s | `s2-eyes` | **impact** | a band slams across at the height of his eyes, flash, burst lines; the eyes stay put as it opens | 睜開眼來。 |
| 6.5 s | `s3-valley` | awe | slow halftone-dot dissolve; the camera tilts down the tall panel | 竟不在自家床上。 · 但見好大一座山谷，四面峭壁如削。 |
| 11.0 s | `d-selfplay` | mystery | a wedge slides in slowly, then opens | 谷底一方青石棋臺。 · 一個老者，正自己同自己對弈。 |
| 14.4 s | `s4-board` | energy | iris; the painted 「鏘」 (`panels/sfx-clang.png`) | 棋子之上，人影鬥得正緊。 |
| 17.2 s | `s5-eagle` | **jolt** | breaks in from the left | |
| 18.7 s | `e2-startle` | the eagle's size | slides up as the lower panel under its face, then takes the frame: the bird as tall as the startled youth | |
| 21.2 s | `g-lost` | bewildered | drops in from the top | 「這……這是甚麼地方？」 |
| 23.6 s | `s6-qiubai` | tension | a hard, quiet cut; the music drops away | 「咦。」 · 「來者何人？」 |
| 26.6 s | `i-name` | hesitation | slides up as the lower panel of a page | 「我……我叫……」, cut off by 「罷了。」 from the panel above |
| 28.6 s | `j-reveal` | gravity | a slow dissolve; the frame darkens; a low bell | 「老夫三百年沒見過一個活人，」 · then his full name, 獨孤求敗, alone |
| 34.4 s | `l-hands` | his speed | a slow dissolve, then the camera snaps between his two hands as the stones click | 但見他左右手依次下棋，動作飛快。 |
| 38.6 s | `m-box` | **the invitation** (last scene) | breaks in from the upper left; the box lands with the painted 「嗒」 (`panels/sfx-tap.png`); a hold, then a fade to black at 44 s | 「今天你我有緣，」 · 「就陪老夫下盤棋吧！」 |

- **Words.** Only the lines that carry the scene. The youth never says his name, so the player
  can still give him one in the game; 求敗 cuts him off with 「罷了，老夫三百年沒見過一個活人，今天
  你我有緣，就陪老夫下盤棋吧！」, a line the producer wrote for the video, carried across three
  panels and ending the video. How the game is played (the stones that walk and fight, drawing
  three) is left to the game itself: it reads as tutorial, not prologue. The game's own prologue (where the youth names himself and 求敗 says 幾百年) is unchanged.
- **Lettering, 港漫 fashion.** Narration in rectangular boxes with a double rule, set flush to the
  panel's corners and stacked. Dialogue in ovals, vertical,
  right to left. Sound effects in the manner of 港漫: both are painted: 「鏘」 in steel and white brush calligraphy with a thick
  black outline, 「嗒」 compact and ivory like polished stone; each is the cleanest of three tries at
  the character. There is no title card: the video ends on 求敗. 獨孤求敗 is named once, as a 港漫 character is introduced, but calmly: his full name settles
  in large and white beside him, with no caption, flash or shake.
- **Panels** (`panels/`): painted with an image model (OpenAI `gpt-image-2.6-flare`) in one manga
  style: bold ink line, spot blacks, screentone, speed lines, a muted ink-green, slate and ochre
  wash. The youth, the eagle and 求敗 were painted from their game portraits as references. The
  panels hold no lettering, as `prompts.md` asks of every picture. 
- **Type**: the words are (`MAZE_TALE.prologue` in
  `game/src/data/maze-tale.js`), set vertically in the game's serif (`river-serif` with the `extra-serif`
  supplement) when the frames are rendered.
- **Sound**: synthesised to follow the arc: a drone that drops away at 「咦」, plucked-string notes on a
  pentatonic scale, a low bell under 求敗's name, thumps on the three impacts, a click as the box lands. It
  is a placeholder for real music.
