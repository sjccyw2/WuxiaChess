# Art prompts for 一念江湖

Prompts for the pictures the new story still needs. Each entry gives the file name, the final size, where the picture appears, what must be true of the composition, and a prompt to paste into an image model.

The pictures are in three groups:

| Group | What it is | What happens when the file is added |
| --- | --- | --- |
| A | Replacements for pictures the game already shows | Nothing else to do. Save over the existing file and it appears. |
| B | New pictures for story moments that are text-only today | The file name is reserved here. The game needs a small change to show each one. |
| C | Cover art that still shows the old ferry | Save over the existing file. |

Group A is finished: all of its pictures are in the game. Group B and C remain.

---

## How to use this file

1. Paste **the house style for that kind of picture** (section 1), then **the entry's own prompt**, into the image model. If the model takes a negative prompt, paste the "avoid" list there; if not, append it as "Avoid: …".
2. Generate at the size given under "generate at", which is the nearest shape most models offer. Then crop and scale to the final size.
3. Save as WebP at about 85 quality, under the exact file name given, in the folder given.
4. Reload the game. Group A and C pictures appear at once.

Pictures in group A and C are cropped by the game, so each entry says where the subject must sit. Check that before accepting a result.

---

## 1. House style

These three blocks describe the art already in the game. Use the one that matches the kind of picture.

### People

```text
Semi-realistic Chinese wuxia character portrait, painterly digital painting in the manner of oil and gouache, visible brush strokes over a fine linen canvas texture. Muted earthy palette: ink green, umber, ochre, faded indigo, bone white. One soft warm rim light from the upper left. Naturalistic face and hands, weathered cloth with real folds and stitching, loose strands of hair. Head and shoulders, three-quarter view, face in the upper middle of the frame. Quiet, grounded, slightly melancholy mood of a Jin Yong novel.
```

### Scenes

```text
Painterly Chinese landscape illustration that blends ink-and-colour on silk with semi-realistic digital painting. Soft mist, layered depth, muted greens, ochres and slate blues, a faint woven silk texture. Natural light only. Still and quiet, with one small point of interest. No people unless the prompt asks for them.
```

### Objects

```text
A single object on a plain warm cream paper background with slight paper grain and a soft contact shadow. Painterly realism, visible brushwork, muted colours. Three-quarter view from slightly above, centred, with generous empty space around it.
```

### Avoid (all pictures)

```text
text, letters, Chinese characters, calligraphy, watermark, signature, seal stamp, logo, border, frame, anime, cel shading, chibi, 3D render, plastic skin, neon colours, glowing magic, energy aura, lens flare, modern clothing, extra fingers, deformed hands
```

---

## 2. Rules that apply to every picture

- **No readable writing.** Image models garble Chinese characters. Where the story has an inscription or a letter, ask for worn, illegible marks. The game supplies the words as text.
- **Never show who set the boards.** The story keeps his identity hidden. He may appear only from behind, with no face, no name, no sword, and nothing that points to a known character.
- **The youth belongs to no era.** His clothes must not be recognisably Song, Ming or Qing, and he wears no sect colours or ornaments.
- **韋小寶 is the opposite.** He is plainly from the Qing dynasty, later than everyone else. His shaved forehead and queue are the visual clue that this place holds people from different centuries.
- **The eagle is called 大鵰 in the game, not by its famous name.** Draw it as the novels describe it: huge, ugly and old, not a noble bird of prey.
- **His mother's face is never shown.** The fragments of his real life are sounds, smells and touch. Keep them soft and partial.

---

## Group A: replacements for pictures already in the game

### A1. The youth: `game/assets/npc-youth.webp` (done)

In the game. The source picture was taller than wide, so it was cropped square from the top edge to keep the whole head.

- **Final size:** 480 × 480. **Generate at:** 1024 × 1024.
- **Appears in:** every dialogue where the youth speaks, and the prologue.
- **Composition:** the game crops this to a tall panel around the upper middle. Keep the face in the upper third and the whole head inside the central 60% of the width. Nothing important in the bottom quarter.

```text
A Chinese youth of about seventeen, lean and sun-browned, with plain features that have not yet hardened into a man's face. Long black hair tied back roughly with a strip of cloth, loose strands across the brow. A coarse undyed hemp tunic under a faded indigo outer layer, patched at the shoulder; clothing of no identifiable dynasty, no sect colours, no ornaments. A plain straight double-edged sword in a worn leather scabbard at his waist, one hand resting near the hilt out of habit. He has just opened his eyes and does not know where he is or who he is: brows slightly drawn, searching eyes, lips a little parted, steady rather than frightened. He looks slightly past the viewer, as though at something only he can see. Behind him a dim valley floor, mist and the edge of a mossy stone.
```

Avoid also: `armour, jewellery, crown, embroidered robes, heroic pose, smirk`

### A2. 韋小寶: `game/assets/npc-wei.webp` (done)

In the game, cropped square from the top edge.

- **Final size:** 480 × 480. **Generate at:** 1024 × 1024.
- **Appears in:** the shop, the three-cup game, the prologue, and after a lost run.
- **Composition:** same crop as A1. The shop also shows it as a small square thumbnail, so the face must read clearly when tiny. Keep the dice in the lower half but inside the frame.

```text
A wiry young Chinese man in his early twenties from the Qing dynasty. Shaved forehead and a long braided queue lying over one shoulder. Quick, clever eyes and a crooked, knowing grin, the look of someone who has talked his way out of trouble all his life. A dark blue silk magua jacket with knotted frog buttons over a long gown, a little too fine for a shopkeeper. One hand raised near his chest, rolling three ivory dice between his fingers. Behind him, out of focus, the edge of a lantern-lit market stall hung with old weapons. Warm lantern light on one side of his face.
```

Avoid also: `official's hat, peacock feather, court robes, old man, beard, martial arts stance`

### A3. The shop, 通吃坊: `game/assets/run-merchant.webp` (done)

In the game. Cropped to 2:1, leaving out a faint seal-like mark the model put in the bottom right corner.

- **Final size:** 1000 × 500. **Generate at:** 1536 × 768 (2:1), or 16:9 and crop.
- **Appears in:** the banner at the top of the shop page, with the shop's name printed over the left side.
- **Composition:** the stall sits right of centre, at about 70% across and halfway down. The left third is calm and fairly dark, because text sits on it. No people.

```text
A makeshift gambling stall and shop at the foot of a cliff in a misty valley at dusk. A long wooden trestle counter under a patched cloth awning, lit by paper lanterns; a plain cloth banner with nothing written on it. On a rack behind the counter, objects from very different centuries hang side by side: a green-patinated bronze sword, a heavy black iron greatsword with no cutting edge, a slender ornate sword, porcelain medicine jars, bundles of thread-bound books. Three upturned wooden dice cups stand in a row on the counter. Wide view; the stall is right of centre, the left side opens into mist and dark rock.
```

Avoid also: `boat, river, bridge, crowd, shopkeeper, signboard writing`

### A4. The marked stone: `game/assets/stone-marks-0.webp` to `stone-marks-5.webp` (done)

In the game as six files showing none to five marks, all made from the one painting: later marks are covered with bare stone taken from unmarked parts of the same picture. The journal shows the file that matches the number of runs finished. If the painting is ever redone, keep the marks well apart, as below, so the same can be done again.

- **Final size:** 1000 × 360. **Generate at:** 21:9, then crop to 25:9.
- **Appears in:** the 石上的痕 journal, above a row of five labels numbered one to five.
- **Composition:** five marks in a single row, evenly spaced, each inside its own fifth of the width with bare stone between them. This matters: with the marks kept apart, the game can later reveal them one at a time as the player finishes runs.

```text
A flat, weathered grey rock face seen straight on and filling the frame, lit by soft slanting daylight, with moss creeping in at the edges. Five separate marks are cut into it in one row, evenly spaced from left to right, each well apart from the next. First: a single diagonal scratch made by a sword point. Second: two small drilled points side by side, one deep and one shallow. Third: a short horizontal row of small rough carved strokes, like a line of writing worn past reading. Fourth: two such rows one above the other, the upper one far older, shallower and more weathered than the lower. Fifth: several overlapping handprints of different sizes pressed into the stone. Even lighting across the whole width.
```

Avoid also: `readable characters, paint, colour pigment, blood, cracks through the marks`

### A5. The dice cup: `game/assets/bowl-cover.webp` (done)

- **Final size:** 360 × 360. **Generate at:** 1024 × 1024.
- **Appears in:** the three-cup game, three times side by side, as the cover over each prize.
- **Note:** this replaced an upturned wooden bowl left over from the old three-bowl game.

```text
An upturned dice cup of dark lacquered wood, taller than it is wide, with a worn brass band around the rim that rests on the surface. Fine scratches and the polish of long handling.
```

Use the **Objects** house style.

---

## Group B: new pictures for moments that are text-only today

These file names are reserved. Each needs a small change in the game before it shows; say when the art is ready.

### B1. The eagle: `game/assets/npc-eagle.webp` (done)

In the game: beside the prologue line where the youth first sees it, and on the screen after a lost run. Cropped from a full-body picture to the head and upper body.

- **Final size:** 480 × 480. **Generate at:** 1024 × 1024.
- **For:** the prologue and the screen after a lost run. It never speaks.
- **Composition:** head and upper body, same crop rules as A1.

```text
An enormous, ancient, ugly eagle, taller than a man. Sparse, rough, dark brown feathers with bare patches; a bald, wrinkled head with a red fleshy knob on the crown; a heavy hooked beak, chipped with age; fierce, intelligent yellow eyes. Short stubby wings held against a thick body, a bird too heavy to fly. It stands beside a mossy rock and looks down at the viewer with patience and recognition, as if it has waited a long time for someone it knows.
```

Use the **People** house style. Avoid also: `majestic soaring eagle, spread wings, bald eagle, phoenix, fire`

### B2. Opening his eyes: `game/assets/scene-open-eyes.webp`

- **Final size:** 1000 × 500. **Generate at:** 1536 × 768.
- **For:** the first page of the prologue.
- **Composition:** seen from where the youth lies. Soft and darkened at the edges, as eyes that have just opened.

```text
The view of someone lying on their back on a valley floor, having just opened their eyes. High cliff walls rise on both sides and close in overhead, leaving a narrow strip of pale sky from which light falls. The head of a huge, old, rough-feathered eagle leans into the frame from above and one side, looking down, close and slightly out of focus. The edges of the picture are soft and dark, the centre brighter.
```

Use the **Scenes** house style.

### B3. The stone table and the board: `game/assets/scene-board.webp`

- **Final size:** 1000 × 500. **Generate at:** 1536 × 768.
- **For:** the top of the draw page, where three heroes answer the invitation.
- **Composition:** the board in the lower centre, seen from just above and behind where a player would sit.

```text
A weathered stone table in a misty valley with a go board cut into its top. One black stone already sits on the far side. On the near side three white stones catch the light and seem faintly luminous against the grey. A row of worn, illegible carved marks runs along the near edge of the table. Behind, soft with mist, the dark shape of a large bird and the foot of a cliff. Seen from just above the near edge, as if by someone about to place a stone.
```

Use the **Scenes** house style. Avoid also: `chess pieces, xiangqi, hands, players`

### B4. The last step: `game/assets/scene-summit.webp`

- **Final size:** 1000 × 500. **Generate at:** 1536 × 768.
- **For:** the ending after ten boards are won.
- **Composition:** the standing figure in the upper right, the youth small in the lower left. Both are seen from behind. **The figure's face must not be visible.**

```text
Ten worn stone steps climb to a bare summit above the mist. At the top stands a tall, lean figure in a plain grey robe, seen from behind, long grey hair loose down the back, perfectly still. He holds no sword: only a thin bare twig, loosely, at his side. At the foot of the steps, small in the foreground and also seen from behind, a youth has just drawn a plain straight sword. Wide empty sky, cold even light, a great sense of distance between the two.
```

Use the **Scenes** house style. Avoid also: `face, sword in the old man's hand, duel in progress, clashing blades, lightning`

### B5. The stones go dark: `game/assets/scene-dark-stones.webp`

- **Final size:** 1000 × 500. **Generate at:** 1536 × 768.
- **For:** the ending after a lost run.

```text
The same weathered stone table and go board as dusk falls. The white stones on the near side have gone dull and grey, hard to tell from the stone beneath them; the single black stone on the far side is unchanged. Nobody is at the table. Beside it a huge old eagle stands with its head lowered. Mist is closing in from the cliffs.
```

Use the **Scenes** house style.

### B6. Closing his eyes: five fragments

- **Files:** `game/assets/fragment-1.webp` to `fragment-5.webp`.
- **Final size:** 720 × 400 each. **Generate at:** 16:9.
- **For:** the last thing shown at the end of each run. They appear in this order, one per run, then repeat.
- **Composition for all five:** as if seen through eyes that are barely open. Very shallow focus, warm low light, heavy dark softness at the edges, nothing sharp. They should feel like one morning in one small house.

Add this to the **Scenes** house style for all five:

```text
Seen through barely open eyes on waking: extremely shallow focus, warm early light, heavy soft darkness around the edges, nothing in the picture fully sharp. A poor, clean rural Chinese house of no particular dynasty.
```

**fragment-1**, a dog licking his face:

```text
Very close and out of focus, the muzzle and tongue of a yellow-brown village dog pressed toward the viewer, one soft ear, morning light behind it.
```

**fragment-2**, his mother cooking:

```text
Across a dim room, a clay stove with a fire in its mouth and an iron wok steaming. A woman stands at it with her back turned, sleeves rolled, one hand holding a spatula. Her face is not visible.
```

**fragment-3**, his mother calling his name:

```text
A doorway filled with bright morning light. In it, the dark outline of a woman leaning in to call someone awake, one hand on the door frame. Her face is lost in the brightness.
```

**fragment-4**, cock-crow:

```text
A paper window turning pale grey-blue at dawn, seen from a low bed. The rough edge of a quilt fills the bottom of the frame. The room is cold and still.
```

**fragment-5**, the hand that still holds on:

```text
A boy's hand resting on a coarse patched quilt, fingers loosely curled as though they had just been holding someone else's hand. Soft side light, the rest of the bed in shadow.
```

Avoid also, for all five: `faces, readable expressions, swords, martial arts, bright colours`

### B7. The invitation, 英雄帖: `game/assets/letter.webp`

- **Final size:** 480 × 480. **Generate at:** 1024 × 1024.
- **For:** the draw page, beside the invitation's text.
- **Composition:** the bottom of the sheet, where a signature would be, is clearly empty.

```text
A single sheet of old cream paper, folded once and opened flat, slightly curled at the corners. Several vertical columns of brushed ink run down it, blurred and worn so that no character can be read. The lower left corner of the sheet, where a letter would be signed and sealed, is completely blank.
```

Use the **Objects** house style. Avoid also: `red seal, stamp, signature, envelope`

---

## Group C: cover art that still shows the old ferry

Both are 1550 × 620. Generate at 21:9 and crop to 5:2.

### C1. Wiki and landing page cover: `wiki/assets/jianghu-cover.webp`

- **Appears in:** the top of the wiki's home page and behind the landing page, with a large title printed over the left.
- **Composition:** the left third is pale, calm and nearly empty. The subject sits at about 70% across.

```text
A deep, narrow valley in morning mist, painted wide. On the right, at the foot of a cliff, a weathered stone table with a go board on it; beside it stands a huge, old, rough-feathered eagle; a youth with a plain sword at his waist stands before the table with his back to the viewer, looking down at the board. Pines cling to the cliff above them. The left third of the picture is pale mist and distant, faint ridges, with nothing else in it.
```

Use the **Scenes** house style. Avoid also: `boat, river, ferry, pavilion, bridge`

### C2. Panel header: `game/assets/panel-river.webp`

- **Appears in:** a thin strip across the top of the game's dialogue and menu panels. Only a narrow horizontal band around the middle is ever visible, with the panel's title over the left.
- **Composition:** everything of interest lies in a band across the middle of the picture, at about 70% across. The top and bottom thirds can be plain mist.

```text
A misty valley in muted blue-grey and ink green, painted very wide. In a horizontal band across the middle, toward the right: the small silhouette of a youth standing beside a stone table, and the larger dark shape of an eagle near him, with a single pine above. Everything else is soft mist and the faint edges of cliffs. Low contrast, dark enough for pale text to be read over it.
```

Use the **Scenes** house style. Avoid also: `boat, river, ferry, bright sky`

---

## Checklist

| File | Folder | Size | Group |
| --- | --- | --- | --- |
| `npc-youth.webp` (done) | `game/assets/` | 480 × 480 | A |
| `npc-wei.webp` (done) | `game/assets/` | 480 × 480 | A |
| `run-merchant.webp` (done) | `game/assets/` | 1000 × 500 | A |
| `stone-marks-0.webp` to `-5.webp` (done) | `game/assets/` | 1000 × 360 | A |
| `bowl-cover.webp` (done) | `game/assets/` | 360 × 360 | A |
| `npc-eagle.webp` (done) | `game/assets/` | 480 × 480 | B |
| `scene-open-eyes.webp` | `game/assets/` | 1000 × 500 | B |
| `scene-board.webp` | `game/assets/` | 1000 × 500 | B |
| `scene-summit.webp` | `game/assets/` | 1000 × 500 | B |
| `scene-dark-stones.webp` | `game/assets/` | 1000 × 500 | B |
| `fragment-1.webp` to `fragment-5.webp` | `game/assets/` | 720 × 400 | B |
| `letter.webp` | `game/assets/` | 480 × 480 | B |
| `jianghu-cover.webp` | `wiki/assets/` | 1550 × 620 | C |
| `panel-river.webp` | `game/assets/` | 1550 × 620 | C |

Not on this list, because the existing art still fits the new story: the ten heroes, the ten board masters and their lieutenants, the ten figures to be saved, the ten map pictures, and all items.
