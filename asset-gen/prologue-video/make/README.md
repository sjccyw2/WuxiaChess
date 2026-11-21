# How the prologue video is made

Run everything from a working folder that holds these scripts. Nothing here touches the game.

1. **References.** Save as PNG: `ref-youth.png` (`asset-gen/story-characters/cards/youth.webp`),
   `ref-eagle.png` (`game/assets/npc-eagle.webp`), `ref-qiubai.png`
   (`asset-gen/story-characters/cards/qiubai.webp`).
2. **Panels.** `python3 shots.py`, `python3 s6.py` and `python3 shots2.py` paint the sixteen panels
   through the OpenAI Images API (`api.py`; the key is supplied by the environment, never written
   here). Each script takes panel names to repaint only those. The panels already painted are in
   `../panels/` as WebP; convert them back to PNG of the same names to re-cut without repainting.
   `s3-valley` is 1024 × 2816, every other panel 1152 × 2048.
3. **Fonts.** Convert the game's serif to TTF beside the scripts: `river-serif.ttf` and
   `extra-serif.ttf` from `game/assets/*.woff2` (fontTools: open, set `flavor = None`, save).
   WenQuanYi Zen Hei is the last fallback.
4. **Cut.** `python3 cut30.py` renders `silent30.mp4` (1080 × 1920, 30 fps); `python3 cut30.py 2.5 13.6`
   saves stills at those times instead. `python3 sound30.py` writes `sound30.wav`. Then
   `ffmpeg -i silent30.mp4 -i sound30.wav -c:v copy -c:a aac -shortest prologue-30.mp4`.

`comic.py` holds the effects: panels shown through animated shapes (`poly`, `dots`, `iris`), the
camera on twos, misregistration, burst lines, sound-effect lettering, narration boxes and speech
balloons in vertical text. `cut30.py` is the timeline: one `Panel` per shot with its entrance,
and the lettering with its times. Needs Pillow, NumPy, fontTools and ffmpeg.
