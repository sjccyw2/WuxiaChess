# How the ending film is made

The prologue film's scripts (`../../prologue-video/make/`), copied and adapted. Run everything from
a working folder that holds these scripts. Nothing here touches the game.

1. **References.** Save as PNG beside the scripts: `ref-youth.png`
   (`asset-gen/story-characters/cards/youth.webp`), `ref-qiubai.png`
   (`asset-gen/story-characters/cards/qiubai.webp`), `ref-eagle.png` (`game/assets/npc-eagle.webp`)
   and `ref-wei.png` (`game/assets/npc-wei.webp`); and the prologue's upright panels as PNG in
   `pro/` (`../../prologue-video/panels/*.webp`), which show how each character is drawn in this
   style.
2. **Panels.** `python3 shots.py` paints the twelve upright panels (1152 × 2048) through the OpenAI
   Images API (`api.py`; the key is supplied by the environment, never written here), in three
   passes, because the sword panels are painted from `f6-stance` and the last two from `f9-sword`.
   `python3 shots169.py` then paints the wide panels (2048 × 1152) into `w/`, each from its upright
   panel. Either script takes panel names to repaint only those, and `x3` for three tries
   (`f9-sword-a.png`, `-b`, `-c`): look at the hands and the blade and save the cleanest under the
   panel's name. Now and then the API's moderation refuses a try (the lowered sword of `f1-twig` was
   once read as violence): run it again. The model is `gpt-image-2.6-flare` (`MODEL` in `shots.py`). The panels already
   painted are in `../panels/` and `../panels-wide/` as WebP; convert them back to PNG of the same
   names (the wide ones into `w/`) to re-cut without repainting (checked 2026-11-22: this rebuilds
   both cuts).
3. **Fonts.** Convert the game's serif to TTF beside the scripts: `river-serif.ttf` and
   `extra-serif.ttf` from `game/assets/*.woff2` (fontTools: open, set `flavor = None`, save). One
   character of the script (枯) is in neither, so install the font they were cut from:
   `apt-get install -y fonts-noto-cjk` (Noto Serif CJK TC Bold; `comic.py` names the path).
   WenQuanYi Zen Hei is the last fallback.
4. **Cut.** `python3 cut59.py` renders `silent59.mp4` (1080 × 1920, 30 fps) and `python3 cut169.py`
   renders `silent169.mp4` (1920 × 1080); `python3 cut59.py 8.5 30.5` saves stills at those times
   instead (`e-8.5.png`; the wide cut's are `wf-8.5.png`). `python3 sound59.py` writes
   `sound59.wav`. Then, for each cut,
   `ffmpeg -i silent59.mp4 -i sound59.wav -c:v copy -c:a aac -b:a 192k -shortest master59.mp4`,
   and from that master the copy kept here
   (`-vf scale=720:1280 -c:v libx264 -crf 25 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k`;
   `1280:720` for the wide cut) and the game's files (the command in `../README.md`).

`timeline.py` is the one timeline: when each panel enters, every word with its times, and the
fixed script the words are checked against. Change a time there and both cuts and the sound move
together. `cut59.py` and `cut169.py` hold only what differs between the cuts: the entrances, the
cameras and where each box and balloon sits. `comic.py` is the prologue's compositor (panels shown
through animated shapes, the camera on twos, misregistration, burst lines, a vignette, and the 港漫
lettering `box_hk`, `balloon_hk`, `name_card`) with three changes: a panel can be made from an
image in memory (the board before its stones light), `lights` draws the drifting lights, and a
camera pulled back past the edge of its picture no longer leaves a black block (the eagle's
entrance). Needs Pillow, NumPy, SciPy, fontTools and ffmpeg.
