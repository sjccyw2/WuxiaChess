# Paints the 16:9 panels for the wide cut, each from its 9:16 panel, so the characters, style and
# colours match. Run from the folder that holds the 9:16 panels as PNG; writes into w/.
import sys, concurrent.futures as cf
sys.path.insert(0, '.')
from api import generate
from shots import MANGA, AVOID
WIDE = ("Recompose the scene of the first reference image as a wide 16:9 cinematic manga panel: the same characters, faces, "
        "clothes, objects, ink style, screentone and colour wash, the same moment and mood, with the scenery extended to the left "
        "and right. Keep the main subject near the centre of the frame, fully in view, with room around it.")
CARD = {'youth': 'ref-youth.png', 'eagle': 'ref-eagle.png', 'qiubai': 'ref-qiubai.png'}
PANELS = {
 's1-asleep':   (['youth'], "The youth asleep on a low bed under a patched quilt, seen from above, moonlight through a lattice window in diagonal bars. The bed runs across the frame."),
 's2-eyes':     (['youth'], "Extreme close-up of the youth's eyes snapping wide open, both eyes on one horizontal line across the middle of the frame, speed lines bursting outward."),
 's3-valley':   ([], "An immense, deep mountain valley seen from high above, sheer cliffs on both sides, mist pouring between them; far below, tiny on the valley floor, a square stone go table with an old man and a huge bird beside it. A very tall panel: the sky and cliff tops at the top, the table at the very bottom."),
 'd-selfplay':  (['qiubai'], "The old man at the stone go table playing against himself, a black stone in his left hand and a white one in his right, a huge bird crouched beside the table, cliffs and mist around."),
 's4-board':    ([], "Low angle across a weathered stone go board: tiny warriors an inch tall fighting on top of the black and white stones, a sword lunge, a flying palm strike, a spear clash throwing sparks, the grid receding into mist."),
 's5-eagle':    (['eagle'], "The huge, ancient, ugly eagle turning its head sharply toward the viewer, one great yellow eye staring out, beak half open, motion lines around the head."),
 'e2-startle':  (['youth', 'eagle'], "The youth stumbling back in fright beside the stone table as the eagle, as tall as he is, thrusts its head at his face; the youth on the left, the bird on the right, side by side so its size is plain."),
 'g-lost':      (['youth'], "The youth, barefoot in plain sleeping clothes, turning in bewilderment on the valley floor, looking up at the towering cliffs, a sweat drop at his temple."),
 's6-qiubai':   (['qiubai'], "The old man seated at the stone table has just looked up at the viewer, eyes narrowed in surprise, a black go stone frozen between two fingers of his raised hand. He sits right of centre; open misty cliffs to the left."),
 'i-name':      (['youth'], "Medium close-up of the youth, a hand pressed to his chest, earnest and nervous, looking up and to the left at someone seated. He is right of centre."),
 'j-reveal':    (['qiubai'], "Dramatic close-up of the old man, eyes in shadow, a vast swirling ink vortex of go board grid lines and drifting black and white stones behind him. He sits right of centre; the left third is the vortex."),
 'l-hands':     (['qiubai'], "Close-up of the old man at the go board, both gnarled hands reaching in from left and right, the left placing a black stone, the right a white one, mirror images; the board crowded with stones."),
 'm-box':       (['qiubai'], "Forced perspective: the old man pushes a round black ebony box of go stones across the stone table toward the viewer, his hand large in the foreground, his stern face behind it. He is right of centre."),
}
def run(name):
    cards, scene = PANELS[name]
    refs = [name + '.png'] + [CARD[c] for c in cards]
    size = '1536x2816' if name == 's3-valley' else '2048x1152'
    return generate(MANGA.replace('vertical 9:16', 'wide 16:9') + "\n\n" + WIDE + " " + scene + "\n\n" + AVOID, size, 'w/' + name + '.png', refs=refs)
if __name__ == '__main__':
    want = sys.argv[1:] or list(PANELS)
    with cf.ThreadPoolExecutor(5) as ex:
        for r in ex.map(run, want): print(r, flush=True)
