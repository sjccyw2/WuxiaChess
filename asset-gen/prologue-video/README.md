# Prologue video

`prologue-45s.mp4` is a 45-second, 9:16 cut of the whole first-run prologue (入夢) in a manga style,
lettered like a Hong Kong comic (港漫). The copy here is 720 × 1280; it was rendered at 1080 × 1920
and can be rendered again with `make/` (see `make/README.md`). Made 2026-11-21 (roadmap 1.11),
after a 10-second test and a 30-second cut that the producer asked to slow down. Only the final
cut is kept, with everything it was made from: `panels/` (thirteen panels and the two painted
sound effects) and `make/` (the prompts, the compositor, the timeline and the sound).

**Two cuts, one timeline.** `prologue-45s.mp4` is the upright cut (9:16) and `prologue-45s-wide.mp4`
the wide cut (16:9, rendered at 1920 × 1080; the copy here is 1280 × 720). They share every time,
word and sound, so one soundtrack serves both. The wide cut's panels (`panels-wide/`) were painted
from the upright ones, each with its 9:16 panel as the reference, so the characters, style and
colours match; its valley is a taller panel (1536 × 2816) for the tilt. Where the upright cut stacks
two panels as a manga page (求敗 above, the youth below), the wide cut sets them side by side; the
captions and balloons are placed anew for each wide composition.

**In the game.** A first visit plays the film on every screen (roadmap 1.11): the upright cut
(`game/assets/prologue-film.mp4`, 720 × 1280) on a screen taller than wide, the wide cut
(`game/assets/prologue-film-wide.mp4`, 1600 × 900) otherwise. A screen turned mid-film switches
cuts and keeps its place. Both are re-encoded for streaming:
`ffmpeg -i <cut> -vf scale=<size> -c:v libx264 -profile:v high -level 4.0 -crf 28 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k <file>`.
Their posters, `prologue-film.webp` and `prologue-film-wide.webp`, are each film's first frame, so playback starts exactly where the poster leaves off (a later frame showed the first caption, which then appeared a second time). Replace
all four when a cut changes.

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
- **Sound**: one piece of music from start to finish, at one tempo and in one mood that does not follow
  the story: a plucked-string melody in the spirit of a guzheng (A 羽 pentatonic, 72 bpm) over a
  low drone and a soft hand drum, fading in and out only. Under it, sound effects for what is on
  screen and nothing else: crickets while he sleeps that stop when he wakes (連蟲聲也無), valley
  wind and a distant waterfall, go stones on the board, a ringing blade clash on 「鏘」, the eagle's
  wing beats and croak, a scuff and stumble on gravel, footsteps, the run of stones as his hands
  play, and the box scraped across the table landing on 「嗒」 with the stones rattling inside. No
  whooshes or impact hits. All of it is synthesised in `make/sound45.py`; no samples are used.
  Real recorded music and effects would sound better.