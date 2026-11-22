# Paints the upright (9:16) panels of the ending film through the OpenAI Images API (api.py).
# Each panel is painted from the character cards AND from finished panels of the prologue film
# (pro/*.png), so the ending is drawn in the same hand. Run from the folder that holds the
# references (see README.md):
#   python3 shots.py                 paints every panel (in three passes: see PASSES)
#   python3 shots.py f4-thanks       repaints only that one
#   python3 shots.py f9-sword x3     three tries (f9-sword-a.png, -b, -c): keep the cleanest as f9-sword.png
import sys, concurrent.futures as cf
sys.path.insert(0, '.')
from api import generate
MODEL = "gpt-image-2.6-flare"
MANGA = ("A single dynamic manga / comic book panel, vertical 9:16. Bold confident black ink linework, heavy spot blacks, "
         "halftone screentone shading, dramatic perspective, expressive brush-ink texture, high contrast. A restrained colour wash "
         "over the ink: muted ink green, slate blue and ochre, with deep blacks. Cinematic, kinetic, the energy of a wuxia manga.")
SAME = ("The reference images named 'finished panels' are pages of the same comic: match their ink line, screentone, colour wash "
        "and the way each character is drawn exactly, so this panel belongs to the same book.")
AVOID = ("Avoid: any text, letters, Chinese characters, speech bubbles, sound-effect lettering, captions, panel borders, "
         "signature, watermark, logo, chibi, cute, 3D render, photorealism, neon, glowing magic aura, modern objects.")
# The stones and the box do light up in this film, so two panels may glow (softly).
AVOID_LIT = AVOID.replace("neon, glowing magic aura, ", "neon, ")
YOUTH = ("the youth from the references: a lean, sun-browned Chinese country boy of about fifteen or sixteen with plain features, long black "
         "hair tied up roughly at the crown with a strip of cloth, loose strands across the brow, a dark slate-blue ragged tunic over coarse "
         "undyed hemp, a rope belt, barefoot; no era, no ornaments")
QIU = ("求敗 from the references: an old Chinese swordsman with a long white beard to the chest, white hair tied back plainly in a topknot, "
       "a lean, gaunt, weathered face, a plain grey hemp robe with wide sleeves worn at the cuffs; no ornaments, and no sword anywhere on him")
EAGLE = ("an enormous, ancient, ugly eagle taller than a man, as in the references: sparse rough dark brown feathers with bare patches, "
         "a bald wrinkled head with a red fleshy knob on the crown, a heavy chipped hooked beak, fierce intelligent yellow eyes")
WEI = ("韋小寶 from the reference: a slim young Chinese pedlar of about twenty with a sly, cheerful face, the front of his head shaved and a "
       "long black braided queue down his back, a plain dark blue buttoned cloth jacket, undyed trousers, cloth shoes")
BOARD = ("The setting is the floor of a deep misty valley ringed by sheer cliffs like cut blades. The ground the figures stand on is the top "
         "of a gigantic square stone go table as wide as a courtyard: weathered grey stone with a grid of go lines carved deep into it. Huge "
         "round go stones, black ones and white ones, each as big as a millstone and knee-high, lie here and there on the crossings of the "
         "lines. At the board's star points stand rough boulders, each with an old sword driven point-down into it.")
SWORD = ("a Chinese jian, exactly the sword the boy holds in the finished panel where he stands alone on the board: a keen straight "
         "double-edged steel blade, a small plain cross guard, a short grip held in ONE hand; never a curved blade, never a katana, no disc guard")
HOME = ("The setting is the boy's real life: a poor, clean thatched country house in the hills of old China at dawn, and the bare dirt yard "
        "behind it under a rocky crag with a leaning pine.")
PRO = lambda *n: ['pro/' + x + '.png' for x in n]
# name: (references, [the finished panels among them], prompt, avoid)
SHOTS = {
 # painted after f6-stance, with it as a reference, so the sword is the same
 'f1-twig': (['f6-stance.png'] + PRO('s6-qiubai', 'g-lost') + ['ref-qiubai.png', 'ref-youth.png'],
    f"{BOARD}\n\nStillness after a long duel on the board. In the middle distance, left of centre, facing the viewer, {QIU}, stands upright, unhurt and perfectly calm, "
    "his right arm relaxed at his side with a thin dry bare twig hanging lowered from his fingers, its tip pointing at the ground; he will not raise it again. "
    f"In the near foreground on the right, seen from behind over his shoulder, {YOUTH}, faces the old man, shoulders heaving, breathing hard, sweat on his neck, "
    f"his sword gripped in his right hand with its point lowered toward the stone: {SWORD}. Between them the carved go lines run away in perspective; "
    "two or three of the huge go stones lie around them; to one side a boulder with a sword standing in it. Sheer cliffs and drifting mist behind. "
    "The two upper corners of the panel are plain cliff, mist and sky, with nothing important in them.", AVOID),
 'f2-setdown': (PRO('l-hands', 'm-box') + ['ref-qiubai.png'],
    f"{BOARD}\n\nClose-up, low and near the surface of the board: one lean, gnarled old hand reaching down from the upper right, in a frayed wide grey hemp sleeve, "
    "gently laying a thin dry bare twig down flat on the carved stone, the fingers just opening to let it go. This is not the placing of a go stone: it is a "
    "laying down. The twig lies across one of the deep carved go lines, in the middle of the panel. In the soft-focus background a great black go stone and a great white one, "
    "and mist. Quiet light, no motion lines. Exactly one hand with five correctly drawn fingers; no go stone in the hand; no sword. The upper left corner of the panel is plain mist.", AVOID),
 'f3-stones': (PRO('s3-valley', 'm-box', 's4-board'),
    f"{BOARD}\n\nSeen from high above, looking steeply down into the valley: the whole gigantic square go board lies in the lower half of the panel, its carved grid plain, "
    "scattered with dozens of black and white go stones, and every stone has begun to shine with a soft warm light from within, one after another, like lamps being lit. "
    "At one edge of the board stands a round dark wooden go-stone box (the box of the finished panels), its lid off, and out of it hundreds of small points of warm light "
    "rise like fireflies in a long loose stream, climbing past the cliffs to the narrow strip of sky at the top of the panel. Two tiny figures stand on the board, "
    "an old man in grey and a boy, very small. Dark cliffs frame both sides. Awe and release; the lights are small, soft and many, not beams and not flames.", AVOID_LIT),
 'f4-thanks': (PRO('s6-qiubai', 'j-reveal') + ['ref-qiubai.png'],
    f"Close-up of the face and shoulders of {QIU}. He stands in the valley, turned three-quarters toward the viewer's left, looking gently at a boy who is out of frame, "
    "and he is smiling: a small, warm, unpractised smile, the first in centuries. The stern brows have let go, the eyes are soft and bright with crow's-feet at their "
    "corners, the mouth curved under the white moustache. It is the same severe face as in the finished panels, now at peace. Soft warm light on his face; a few small "
    "points of light drift upward like fireflies in the misty air behind him; cliffs in soft ink beyond. His face is left of centre and in the middle of the panel's height; "
    "the upper right part of the panel is plain mist and sky. No hands in the frame.", AVOID_LIT),
 'f5-wei': (['ref-wei.png'] + PRO('g-lost', 's3-valley'),
    f"The mouth of the deep valley: the sheer cliffs on both sides open in a narrow gap filled with bright daylight, like a door that has always stood open. "
    f"Walking away from the viewer toward that light, in the middle of the panel, {WEI}, seen from behind in three-quarter back view, glancing a little aside so that "
    "his sly, contented half-smile shows. Over one shoulder he carries a bamboo pole with his folded cloth stall hanging from it: a rolled awning, a bundled cloth, "
    "a small folded trestle, tied with cord at both ends of the pole. His free hand lifts a melon seed to his teeth to crack it. Light, unhurried, jaunty; a little "
    "dust at his heels; a few soft motion lines. The finished panels show only the comic's style and the valley: draw this man from the pedlar's portrait, not from the youth. "
    "The two upper corners of the panel are plain cliff.", AVOID),
 'f6-stance': (PRO('g-lost', 'i-name') + ['ref-youth.png'],
    f"{BOARD}\n\n{YOUTH}, stands alone on the board, the whole figure in view, turned three-quarters to the viewer, in an easy, natural stance that seems born in him: "
    "feet apart, weight settled, shoulders loose, a keen straight steel sword held low in his right hand with the blade slanting down and outward, the left hand "
    "empty and relaxed at his side. His breathing has steadied; his gaze is level and clear, looking up and off to the side at someone. The figure fills the lower "
    "two thirds of the panel, his head a little above the middle of its height; the whole upper third is open cliffs, mist and sky. Carved go lines under his bare feet, "
    "one great white go stone behind him. Quiet and still: no speed lines. One sword, straight, with a small plain guard; both hands correctly drawn.", AVOID),
 'f6-eyes': (PRO('s6-qiubai', 'j-reveal') + ['ref-qiubai.png'],
    f"Extreme close-up of the eyes and brows of {QIU}, both eyes on one horizontal line across the middle of the panel and filling its width. The eyes have just "
    "widened in a sudden start of recognition: white brows lifted, pupils small, a point of light caught in each eye. Above them the lined forehead and strands of "
    "white hair, below them the bridge of the nose, the cheekbones and the top of the white moustache. Fine focus lines converge on the eyes. Not anger and not fear: "
    "astonishment, as of a man who suddenly sees his own younger self standing in front of him.", AVOID),
 'f7-leave': (PRO('e2-startle', 'd-selfplay', 's3-valley') + ['ref-eagle.png'],
    f"A deep view down the valley toward its mouth, where the cliffs open on bright light. Far off in the middle of the panel, already small, {QIU}, walks away from "
    "the viewer with an easy stride, seen from behind, his great wide grey sleeves and the skirts of his robe flying out on the wind, both hands empty and open, white "
    f"hair in a topknot. In the near foreground at the bottom of the panel, large, {EAGLE}, stands at the edge of the stone go board, seen from behind in three-quarter "
    "back view, perfectly still, wings folded, its head turned to watch him go; it does not follow. A few long wind lines run down the valley and a few last small "
    "lights drift upward. Vast, quiet, without sorrow. The two upper corners of the panel are plain cliff and mist.", AVOID_LIT),
 'f8-wake': (PRO('s2-eyes', 's1-asleep') + ['ref-youth.png'],
    f"Extreme close-up of the eyes of {YOUTH}, just opened, as he lies on his pillow at dawn: the same framing as the finished panel of his eyes, both eyes on one "
    "horizontal line across the middle of the panel, loose hair across the brow, the edge of a coarse patched quilt at the bottom. This time the eyes are not shocked: "
    "they are wide awake, calm, clear and resolved, and a first band of warm dawn sunlight from a lattice window falls across them. Fine straight lines of light "
    "radiate from the eyes to the edges of the panel. Warm ochre light on the skin, deep ink shadow around.", AVOID),
 'f9-sword': (['f6-stance.png'] + PRO('g-lost', 's1-asleep') + ['ref-youth.png'],
    f"{HOME}\n\nIn the yard at dawn, {YOUTH}, practises alone with a plain sword: {SWORD}. He is caught in the middle of a long, sure, flowing cut: knees bent, "
    "body low and balanced, the right arm extended with the sword in that one hand, the empty left hand held back for balance with two fingers pointing, "
    "the straight blade drawing one clean arc of speed lines through the air, dust lifting at his bare feet, hair and ragged "
    "sleeves swinging with the turn. The movement is assured, as if his hands remember what he himself has forgotten. Low golden sunlight rakes across the yard from "
    "one side; behind him the back wall and thatched eave of the house, a woodpile, a water jar, the foot of the crag. He is in the middle of the panel, whole figure in "
    "view; the two upper corners of the panel are plain sky and thatch. One sword only, its blade perfectly straight; two hands, correctly drawn.", AVOID),
 # painted after f9-sword, with it as a reference, so the yard, the crag and the sword are the same
 'f10-eagle': (['f9-sword.png'] + PRO('s5-eagle', 'e2-startle') + ['ref-eagle.png'],
    f"{HOME}\n\nLooking steeply up from the yard at the top of the rocky crag against the bright morning sky. On the crag stands {EAGLE}, upright and huge, its head "
    "tilted sharply to one side, one yellow eye looking straight down at the viewer with curious, knowing attention, as if it has been waiting. The bird is in the upper "
    "middle of the panel. In the bottom of the panel, small and seen from behind, the head and shoulders of the youth of the first finished panel as he looks up at it, "
    "the tip of his lowered sword beside him. A leaning pine, drifting cloud, focus lines converging on the bird. The bird's beak is closed: it makes no sound.", AVOID),
 'f11-name': (['f9-sword.png', 'f6-stance.png'] + PRO('e2-startle') + ['ref-youth.png', 'ref-eagle.png'],
    f"{HOME}\n\nMorning light under the crag. {YOUTH}, stands right of the centre of the panel, seen from the knees up in three-quarter view, the plain straight sword "
    "of the first finished panel held easily at his side in his right hand with its point down, looking up and away toward the sunrise with quiet resolve. Behind "
    f"him and a little above, on a ledge of the crag at the right edge, stands {EAGLE}, looking the same way, beak closed: the two of them together, like companions at the start "
    "of a long road. The left third of the panel is a tall cliff face in deep, plain ink shadow with no detail. Low golden light rims the youth and the bird. "
    "Stillness and gravity. His face is in the middle of the panel's height. One sword; both hands correctly drawn.", AVOID),
}
SIZE = "1152x2048"
def refs_note(refs):
    """Tells the model which references are finished panels of the comic and which are character portraits."""
    names = []
    for i, r in enumerate(refs, 1):
        kind = "a character portrait (for the likeness only, not the painting style)" if r.startswith('ref-') else "a finished panel of this comic"
        names.append(f"reference {i} is {kind}")
    return "References: " + "; ".join(names) + ". " + SAME
def run(job):
    name, out = job
    refs, prompt, avoid = SHOTS[name]
    return generate(MANGA + "\n\n" + refs_note(refs) + "\n\n" + prompt + "\n\n" + avoid, SIZE, out, refs=refs, model=MODEL)
# Three passes when painting everything: a panel painted from another panel waits for it.
PASSES = [['f2-setdown', 'f3-stones', 'f4-thanks', 'f5-wei', 'f6-stance', 'f6-eyes', 'f7-leave', 'f8-wake'],
          ['f1-twig', 'f9-sword'],          # from f6-stance (the sword)
          ['f10-eagle', 'f11-name']]        # from f9-sword (the yard) and f6-stance
if __name__ == '__main__':
    args = sys.argv[1:]
    tries = next((int(a[1:]) for a in args if a[0] == 'x' and a[1:].isdigit()), 1)
    want = [a for a in args if a in SHOTS]
    for group in ([want] if want else PASSES):
        jobs = [(n, n + '.png') for n in group] if tries == 1 else [(n, f'{n}-{"abcdefgh"[i]}.png') for n in group for i in range(tries)]
        with cf.ThreadPoolExecutor(4) as ex:
            for r in ex.map(run, jobs): print(r, flush=True)
