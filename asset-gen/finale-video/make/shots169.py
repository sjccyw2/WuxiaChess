# Paints the 16:9 panels for the wide cut, each from its 9:16 panel, so the characters, style and
# colours match. Run from the folder that holds the 9:16 panels as PNG; writes into w/.
#   python3 shots169.py                 paints every panel
#   python3 shots169.py f4-thanks x3    three tries (w/f4-thanks-a.png, -b, -c)
import sys, concurrent.futures as cf
sys.path.insert(0, '.')
from api import generate
from shots import MANGA, AVOID, AVOID_LIT, MODEL
WIDE = ("Recompose the scene of the first reference image as a wide 16:9 cinematic manga panel: the same characters, faces, "
        "clothes, objects, ink style, screentone and colour wash, the same moment and mood, with the scenery extended to the left "
        "and right. Keep the main subject fully in view, with room around it. "
        "Draw only the people and creatures that are in the first reference image: add no one.")
JIAN = " The sword is a straight Chinese jian with a small cross guard, held in one hand."   # added to the panels that show it
CARD = {'youth': 'ref-youth.png', 'eagle': 'ref-eagle.png', 'qiubai': 'ref-qiubai.png', 'wei': 'ref-wei.png'}
LIT = {'f3-stones', 'f4-thanks', 'f7-leave'}   # panels where small lights drift in the air
SWORDS = {'f1-twig', 'f6-stance', 'f9-sword', 'f10-eagle', 'f11-name'}
PANELS = {
 'f1-twig':    (['qiubai', 'youth'], "On the gigantic stone go board on the valley floor: the old man stands in the middle distance, left of centre, calm and upright, a dry twig hanging lowered from his right hand; the boy stands in the near foreground on the right, seen from behind, breathing hard, his straight sword lowered in his right hand. Huge black and white go stones on the carved lines, swords standing in boulders, cliffs and mist. The upper left and upper right corners are plain mist and cliff."),
 'f2-setdown': (['qiubai'], "Close-up near the surface of the carved stone board: one gnarled old hand in a frayed grey sleeve reaches down from the upper right and gently lays a thin dry twig flat on the stone, fingers just opening. The twig lies in the middle of the frame; great go stones and a sword in a boulder in the soft background. Exactly one hand with five fingers. The upper left of the frame is plain mist."),
 'f3-stones':  ([], "Seen from high above: the whole gigantic square go board on the valley floor, in the lower middle of the frame, every black and white stone on it shining softly from within; at its edge a round dark wooden box with its lid off, out of which hundreds of small warm lights rise like fireflies in a loose stream up the middle of the frame, past the cliffs, to the sky. Two tiny figures on the board. Dark cliffs frame the left and right."),
 'f4-thanks':  (['qiubai'], "Close-up of the old man's face and shoulders, right of centre, turned three-quarters to the viewer's left and smiling a small, warm smile, eyes soft; small lights drift up in the misty air behind him. He is alone in the frame: no other person. The left third of the frame is open mist and soft cliffs. No hands."),
 'f5-wei':     (['wei'], "The young pedlar with the shaved forehead and long braided queue walks away from the viewer toward the bright gap where the valley opens, seen from behind in three-quarter back view, glancing aside with a sly smile, cracking a melon seed at his teeth, his folded cloth stall hanging from the bamboo pole on his shoulder. He walks in the middle of the frame; the bright valley mouth is ahead of him; cliffs to the left and right. He is alone: there is no other person anywhere in the frame. The upper corners are plain cliff."),
 'f6-stance':  (['youth'], "The boy stands alone on the carved stone go board, whole figure in view in the very centre of the frame, in an easy natural stance, a straight sword held low in his right hand, the left hand empty, looking off to the viewer's right with a level, clear gaze. Great go stones on the board, swords in boulders, cliffs and mist to both sides. No speed lines."),
 'f6-eyes':    (['qiubai'], "Extreme close-up of the old man's face: the eyes widened in a sudden start of recognition, white brows lifted, a point of light in each eye. The face is in the very centre of the frame and both eyes lie on one horizontal line within the middle half of the frame's width; white hair and focus lines fill the left and right."),
 'f7-leave':   (['eagle', 'qiubai'], "A deep view down the valley toward its bright mouth. The huge eagle stands large in the left foreground, seen from behind, head turned, watching; far off, right of centre, already small, the old man walks away with his great grey sleeves flying, hands empty. Wind lines, a few drifting lights. The upper right corner and the top centre are plain mist and cliff."),
 'f8-wake':    (['youth'], "Extreme close-up of the boy's eyes just opened at dawn, calm, clear and resolved, both eyes on one horizontal line across the middle of the frame, a band of warm sunlight through a lattice falling across them, hair across the brow, the edge of a quilt below, fine lines of light radiating outward."),
 'f9-sword':   (['youth'], "Dawn in the dirt yard behind the poor thatched house under the crag: the boy practises alone, in the middle of a long flowing cut, the straight sword in his right hand drawing one clean arc of speed lines, the left hand held out for balance, dust at his bare feet. He is in the centre of the frame, whole figure in view; the house, woodpile and water jar to the right, the crag and pine behind. The upper corners are plain sky."),
 'f10-eagle':  (['eagle'], "Looking steeply up from the yard: the huge eagle stands on top of the rocky crag against the morning sky, right of centre, its head tilted sharply to one side, one yellow eye looking down, beak closed. In the lower left, small and seen from behind, the boy's head and shoulders as he looks up. A leaning pine, the thatched eave, focus lines converging on the bird."),
 'f11-name':   (['youth', 'eagle'], "Morning light under the crag: the boy stands right of centre, seen from the knees up, the straight sword held easily at his side in his right hand, point down, looking up and away to the viewer's left with quiet resolve; behind him at the right the huge eagle on a ledge, looking the same way, beak closed. The whole left third of the frame is a tall cliff face in deep plain ink shadow with no detail, the dawn glowing behind its edge."),
}
def run(job):
    name, out = job
    cards, scene = PANELS[name]
    refs = [name + '.png'] + [CARD[c] for c in cards]
    avoid = AVOID_LIT if name in LIT else AVOID
    if name in SWORDS: scene += JIAN
    return generate(MANGA.replace('vertical 9:16', 'wide 16:9') + "\n\n" + WIDE + " " + scene + "\n\n" + avoid, '2048x1152', 'w/' + out, refs=refs, model=MODEL)
if __name__ == '__main__':
    args = sys.argv[1:]
    tries = next((int(a[1:]) for a in args if a[0] == 'x' and a[1:].isdigit()), 1)
    want = [a for a in args if a in PANELS] or list(PANELS)
    jobs = [(n, n + '.png') for n in want] if tries == 1 else [(n, f'{n}-{"abcdefgh"[i]}.png') for n in want for i in range(tries)]
    with cf.ThreadPoolExecutor(4) as ex:
        for r in ex.map(run, jobs): print(r, flush=True)
