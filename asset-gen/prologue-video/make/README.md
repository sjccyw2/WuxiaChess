# How the prologue video is made

Run everything from a working folder that holds these scripts. Nothing here touches the game.

1. **References.** Save as PNG: `ref-youth.png` (`asset-gen/story-characters/cards/youth.webp`),
   `ref-eagle.png` (`game/assets/npc-eagle.webp`), `ref-qiubai.png`
   (`asset-gen/story-characters/cards/qiubai.webp`).
2. **Panels.** `python3 shots.py`, `python3 s6.py`, `python3 shots2.py` and `python3 shots3.py` paint the thirteen panels
   through the OpenAI Images API (`api.py`; the key is supplied by the environment, never written
   here). Each script takes panel names to repaint only those (except `shots3.py`, which paints the startle
   panel and three tries at 「鏘」; pick the one written correctly and save it as `sfx-clang.png`; `shots4.py` does the same for 「嗒」,
   saved as `sfx-tap.png`). The panels already painted are in
   `../panels/` as WebP; convert them back to PNG of the same names, and copy `sfx-clang.png` and
   `sfx-tap.png` beside the scripts, to re-cut without repainting (checked 2026-11-21: this rebuilds
   the final cut).
   `s3-valley` is 1024 × 2816, every other panel 1152 × 2048.
3. **Fonts.** Convert the game's serif to TTF beside the scripts: `river-serif.ttf` and
   `extra-serif.ttf` from `game/assets/*.woff2` (fontTools: open, set `flavor = None`, save).
   WenQuanYi Zen Hei is the last fallback.
4. **Cut.** `python3 cut45.py` renders `silent45.mp4` (1080 × 1920, 30 fps); `python3 cut45.py 2.5 33`
   saves stills at those times instead. `python3 sound45.py` writes `sound45.wav`. Then
   `ffmpeg -i silent45.mp4 -i sound45.wav -c:v libx264 -crf 23 -c:a aac -shortest prologue-45s.mp4`.

`comic.py` holds the effects: panels shown through animated shapes (`poly`, `dots`, `iris`, `fade`),
the camera on twos, misregistration, burst lines, a vignette, and the 港漫 lettering (`box_hk`,
`balloon_hk`, `sfx_hk`, `name_card`). `cut45.py` is the timeline: one `Panel` per shot with its entrance,
and the lettering with its times. Needs Pillow, NumPy, fontTools and ffmpeg.
