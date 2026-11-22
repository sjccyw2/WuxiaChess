# Ending film

`finale-59s.mp4` is a 59-second, 9:16 film of the game's ending (放下): 求敗 lays the twig down,
the stones go home, he knows the boy at last and walks away; the boy wakes, takes up a sword, and
the name 獨孤求敗 settles beside him. It is made exactly as the prologue film
(`../prologue-video/`) was: manga panels, lettered like a Hong Kong comic (港漫), cut by the same
compositor. The copy here is 720 × 1280; it was rendered at 1080 × 1920 and can be rendered again
with `make/` (see `make/README.md`). Made 2026-11-22. Everything it was made from is kept:
`panels/` and `panels-wide/` (twelve panels each) and `make/` (the prompts, the compositor, the
timeline and the sound).

**Two cuts, one timeline.** `finale-59s.mp4` is the upright cut (9:16) and `finale-59s-wide.mp4`
the wide cut (16:9, rendered at 1920 × 1080; the copy here is 1280 × 720). They share every time,
word and sound: both cuts and the soundtrack read `make/timeline.py`, so they cannot drift apart.
The wide cut's panels (`panels-wide/`) were painted from the upright ones, each with its 9:16 panel
as the reference, so the characters, style and colours match. Where the upright cut stacks two
panels as a manga page (求敗's eyes above, the youth below), the wide cut sets them side by side
(the youth on the left, the eyes on the right); the captions and balloons are placed anew for each
wide composition.

**In the game.** The film plays after the last board is won, through the same player as the
prologue film (`game/src/ui/intro-film.js`; the files are named in `game/src/data/maze-tale.js`):
the upright cut (`game/assets/finale-film.mp4`, 720 × 1280, 15.1 MB) on a screen taller than wide,
the wide cut (`game/assets/finale-film-wide.mp4`, 1600 × 900, 22.2 MB) otherwise. Both are
re-encoded for streaming from the full-size renders:
`ffmpeg -i <cut> -vf scale=<size> -c:v libx264 -profile:v high -level 4.0 -crf 28 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k <file>`.
Their posters, `finale-film.webp` and `finale-film-wide.webp`, are the frame at 1.2 s (WebP,
quality 75). Replace all four when a cut changes.

**Pacing.** Calmer than the prologue and about five seconds a panel: an ending, not an opening.
Only three moments hit: 求敗's start of recognition, the boy's eyes opening, and the eagle on the
crag. Everything else dissolves or slides in, so that those three land and the name can arrive
without any emphasis at all. A picture stays on screen until the next panel has fully covered it.

| Time | Panel | Beat | Entrance | Words |
| --- | --- | --- | --- | --- |
| 0 s | `f1-twig` | quiet | (opening) slow push in | 那根枯枝，求敗沒有再舉起來。 |
| 4.6 s | `f2-setdown` | gentle | slow dissolve; the camera eases back from the hand | 他俯下身去，將枯枝輕輕擱在盤上。 · 不是落子，是放下。 · 「夠了。」 |
| 9.2 s | `f3-stones` | awe | slow dissolve onto the board with its stones still dark; from 10.7 s the lit board spreads through halftone dots from the middle; lights drift up and the camera follows them up the valley | 盤上的黑子白子，一枚一枚亮了。 · 盒中收了幾百年的子，也都亮了起來，各回各的年月。 |
| 14.8 s | `f4-thanks` | warm | slow dissolve; a few lights linger beside him | 「老夫求了一世，求的原來便是這一放。」 · then 「小兄弟，多謝你。」 |
| 21.2 s | `f5-wei` | light | a slanted panel slides in slowly from the right, then opens | 韋小寶收了攤子，挑在肩上，自谷口走了出去。 · 那道門，原來一直開著。 |
| 26.0 s | `f6-stance` | stillness | a hard, quiet cut; the music has dropped away | 少年提劍而立。 |
| 28.0 s | `f6-eyes` | **the hit** | 求敗's eyes cut in as the second panel of the page (above the youth; in the wide cut, beside him), with one soft drum and nothing else | 求敗向他瞧了一眼，忽地一怔。 · 「……原來是你。」 |
| 31.8 s | `f7-leave` | gravity | slow dissolve; the camera starts on the small figure walking away and draws back until the eagle fills the foreground | 他向少年拱了拱手，大袖飄飄，撒手而去，不知所終。 · 那頭大鵰望著他的背影，沒有跟去。 |
| 38.4 s | `f8-wake` | **impact** | a band slams across at the height of his eyes, flash, burst lines; the eyes stay put as it opens (the prologue's `s2-eyes`, answered) | 少年醒了。 · 這一回，他沒有再睡回去。 |
| 42.6 s | `f9-sword` | energy | a soft iris opens on him; the camera eases back | 他提了枕邊那柄劍，到屋後練將起來。 · 夢裡的事一件也記不起，手卻都記得。 |
| 47.6 s | `f10-eagle` | **jolt** | breaks in from the left, as the prologue's eagle did | 練罷抬頭，崖上立著一頭大鵰，正側過了頭瞧他。 |
| 51.6 s | `f11-name` | gravity (last scene) | slow dissolve; the frame darkens from 54.3 s; a low bell at 55.2 s; the name from 55.3 s; fade to black from 57.9 s, black by 58.9 s | 許多年後，他劍下再無一合之敵，給自己取了一個名字。 · then the name 獨孤求敗, alone |

- **Words.** The twelve lines are fixed and are lettered exactly, in order (`make/timeline.py`
  holds them and refuses to run if the boxes no longer join into the script). A line is broken
  across two boxes only at its punctuation. Nothing explains the ending: the last thing on screen
  is the name 獨孤求敗 settling beside the youth, set exactly as the prologue's `j-reveal` set the
  same four characters beside the old man (the same size, place and calm: no flash, no shake), so
  that the player sees the boy was the young 求敗 all along. There is no title card.
- **What is never shown.** 求敗 is not defeated, hurt or kneeling: he lets go of his own accord.
  He holds a twig, never a sword. The eagle makes no sound but its wings. The phrase the story
  does not use for his leaving (破碎虛空, which `tools/check-story.mjs` refuses in the spine)
  appears nowhere: he 撒手而去，不知所終.
- **Lettering, 港漫 fashion**, as in the prologue: narration in rectangular boxes with a double
  rule, set flush to the panel's corners and stacked; 求敗's speech in ovals, vertical, right to
  left. On 「夠了。」 he is above the frame, so the balloon's tail points up off the panel. This film
  has no painted sound effects: nothing in it is loud.
- **Panels** (`panels/`, 1152 × 2048; `panels-wide/`, 2048 × 1152): painted with an image model
  (OpenAI `gpt-image-2.6-flare`, the prologue's) in the prologue's manga style: bold ink line, spot
  blacks, screentone, a muted ink-green, slate and ochre wash. Each was painted from the game's
  portraits (the youth, 求敗, the eagle, 韋小寶) and from finished panels of the prologue film, so
  the ending is drawn in the same hand; the sword panels were painted from `f6-stance` so that the
  sword stays one sword, and the last two from `f9-sword` so that the yard stays one yard. Each is
  the cleanest of two or three tries, judged on hands and blades. The panels hold no lettering.
  The stones lighting is one panel shown twice: darkened and drained of colour, then as painted.
  The drifting lights are drawn by the compositor.
- **Type**: the game's serif (`river-serif` with the `extra-serif` supplement), set vertically when
  the frames are rendered. One character, 枯, was in neither file when the film was rendered, so
  the film sets it from the font they were both cut from (Noto Serif CJK TC Bold), and it matches.
  The game's text now shows 枯枝 too, and `tools/extra-fonts.py` has since added 枯 to the supplement.
- **Sound**: synthesised in `make/sound59.py` with the prologue's instruments (a plucked string in
  the spirit of a guzheng, a soft hand drum, a low drone; A 羽 pentatonic) and no samples or
  voices. Unlike the prologue's one steady piece it follows the story: the prologue's tune at a
  slower walk while he lets go; a light step for 韋小寶; silence into the hit, which is one soft
  drum and one far string; strings climbing out of the drone as he leaves, cut dead as the boy's
  eyes open; the prologue's tune again, lighter, for the morning; three falling notes, a low bell,
  and a long tail on the name. Under it, only what is on screen: valley wind, the twig touching the
  stone, small pings as the stones light, steps on gravel and a melon seed cracked, sleeves on the
  wind, a quilt, small birds, a blade through the air, the eagle settling its wings. Real recorded
  music and effects would sound better.
