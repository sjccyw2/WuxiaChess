# The sixth panel of the first cut: 求敗 looks up from the board. Paints s6-qiubai.png.
import sys
sys.path.insert(0, '.')
from api import generate
from shots import MANGA, AVOID
QIU = ("求敗 from the reference: an old Chinese swordsman with a long white beard to the chest, white hair tied back plainly in a topknot, "
       "a lean weathered stern face, a plain grey hemp robe worn at the cuffs, no ornaments, no sword")
print(generate(MANGA + f"\n\nClose shot of {QIU}, seated at the stone go table. He has just looked up from the board, straight at the viewer, eyes narrowed in sudden surprise and suspicion; a black go stone frozen in mid-air between two fingers of his raised hand, close to the viewer. Dramatic manga focus lines converge on his eyes; wisps of mist; sheer cliffs behind him in black ink.\n\n" + AVOID,
               "1152x2048", "s6-qiubai.png", refs=["ref-qiubai.png"]))
