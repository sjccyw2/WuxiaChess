import sys, concurrent.futures as cf
sys.path.insert(0, '.')
from api import generate
MANGA = ("A single dynamic manga / comic book panel, vertical 9:16. Bold confident black ink linework, heavy spot blacks, "
         "halftone screentone shading, dramatic perspective, expressive brush-ink texture, high contrast. A restrained colour wash "
         "over the ink: muted ink green, slate blue and ochre, with deep blacks. Cinematic, kinetic, the energy of a wuxia manga.")
AVOID = ("Avoid: any text, letters, Chinese characters, speech bubbles, sound-effect lettering, captions, panel borders, "
         "signature, watermark, logo, chibi, cute, 3D render, photorealism, neon, glowing magic aura, modern objects.")
YOUTH = ("the youth from the reference: a lean, sun-browned Chinese youth of about seventeen with plain features, long black hair "
         "tied back roughly with a strip of cloth, loose strands across the brow, coarse undyed hemp clothes; no era, no ornaments")
EAGLE = ("an enormous, ancient, ugly eagle taller than a man, as in the reference: sparse rough dark brown feathers with bare patches, "
         "a bald wrinkled head with a red fleshy knob on the crown, a heavy chipped hooked beak, fierce intelligent yellow eyes")
SHOTS = {
 's1-asleep': ("1152x2048", ["ref-youth.png"], f"Night in a poor, clean rural Chinese house. Seen from above at a steep angle, {YOUTH} lies fast asleep on a low bed under a coarse patched quilt, one arm flung out, face peaceful. Cold moonlight falls through a lattice paper window in long diagonal bars across him. Deep silence; most of the panel is black shadow."),
 's2-eyes': ("1152x2048", ["ref-youth.png"], f"Extreme close-up of the youth's eyes snapping wide open: {YOUTH}. The eyes fill the middle of the panel, pupils small with shock, loose hair across the brow. Radiating manga speed lines burst outward from the eyes to the edges of the panel. Stark white and black."),
 's3-valley': ("1024x2816", [], "A very tall vertical panel: an immense, deep mountain valley seen from high above, sheer cliff walls like cut blades rising on both sides, pines clinging to them, mist pouring down between them. Far, far below at the very bottom of the panel, tiny on the valley floor, a square stone go table with an old man seated at it and a huge bird crouched beside it. Pale light falls from a narrow strip of sky at the top. Vertigo, scale, awe."),
 's4-board': ("1152x2048", [], "Close, low angle across the surface of a weathered stone go table: black and white go stones on the grid, and standing on top of the stones, tiny warriors only an inch tall locked in furious combat: a swordsman lunging, a palm fighter leaping, a spear thrust, a blade clash throwing sparks. Strong diagonal composition, motion lines, flying grit, the huge grid lines receding into mist behind them."),
 's5-eagle': ("1152x2048", ["ref-eagle.png"], f"{EAGLE}. It has just turned its huge head sharply toward the viewer, filling the panel, one great yellow eye staring straight out, beak half open. Dramatic low angle, motion lines sweeping around the turning head, feathers ruffled."),
}
def run(item):
    name, (size, refs, prompt) = item
    return generate(MANGA + "\n\n" + prompt + "\n\n" + AVOID, size, name + ".png", refs=refs)
if __name__ == '__main__':
    want = sys.argv[1:] or list(SHOTS)
    with cf.ThreadPoolExecutor(3) as ex:
        for r in ex.map(run, [(k, SHOTS[k]) for k in want]): print(r, flush=True)
