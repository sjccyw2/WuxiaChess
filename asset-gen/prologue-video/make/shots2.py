import sys, concurrent.futures as cf
sys.path.insert(0, '.')
from api import generate
from shots import MANGA, AVOID, YOUTH, EAGLE
QIU = ("求敗 from the reference: an old Chinese swordsman with a long white beard to the chest, white hair tied back plainly in a topknot, "
       "a lean, weathered, stern face, a plain grey hemp robe worn at the cuffs; no ornaments, no sword")
C = "Keep the main subject in the middle of the frame, with room around it, so the panel can also be cropped to a square."
SHOTS = {
 'd-selfplay': (["ref-qiubai.png"], f"Seen from a little way off across a misty valley floor: a square stone go table under towering cliffs. Seated at it, {QIU}, playing against himself, holding a black go stone in his left hand and a white go stone in his right, both hands poised over the board, utterly absorbed. No bird or other creature anywhere in the panel. Mist, silence, a single shaft of pale light from above. {C}"),
 'g-lost': (["ref-youth.png"], f"{YOUTH}, standing on a valley floor in his plain sleeping clothes, barefoot, turning on the spot in bewilderment, one hand half raised, looking up at the impossibly high cliffs around him. Low angle, the cliffs towering, swirling manga motion lines around him, a tiny sweat drop at his temple. {C}"),
 'i-name': (["ref-youth.png"], f"Medium close-up of {YOUTH}, standing straight, one hand pressed to his chest as he says his name, earnest and a little nervous, looking slightly up and to the side at someone seated. Soft focus lines behind him. {C}"),
 'j-reveal': (["ref-qiubai.png"], f"Extreme dramatic close-up of {QIU}: his eyes in deep shadow under his brows, the beard lit from below, an air of immense age and loneliness. Behind him, a huge swirling ink-wash vortex of go board grid lines and drifting black and white go stones, spiralling outward like the centuries he has spent at the board. Heavy blacks, radial focus lines, a moment of revelation. No crosses, no gravestones, no religious symbols. {C}"),
 'l-hands': (["ref-qiubai.png"], f"Top-down close-up over a weathered stone go board crowded with black and white stones: two old, gnarled hands from the same grey-sleeved man reach in from opposite sides, the left hand placing a black stone, the right hand holding a white stone, mirror images of each other, as if two opponents. Strong symmetrical composition, deep shadows, ink texture. {C}"),
 'm-box': (["ref-qiubai.png"], f"Strong forced perspective: {QIU}, seated at the stone table, pushes a round black ebony box of go stones across the table straight toward the viewer, his hand large in the foreground, his stern face behind it looking straight at the viewer. Motion lines along the table. {C}"),
}
def run(item):
    name, (refs, prompt) = item
    return generate(MANGA + "\n\n" + prompt + "\n\n" + AVOID, "1152x2048", name + ".png", refs=refs)
if __name__ == '__main__':
    want = sys.argv[1:] or list(SHOTS)
    with cf.ThreadPoolExecutor(5) as ex:
        for r in ex.map(run, [(k, SHOTS[k]) for k in want]): print(r, flush=True)
