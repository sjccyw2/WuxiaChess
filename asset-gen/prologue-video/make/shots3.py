import sys, concurrent.futures as cf
sys.path.insert(0, '.')
from api import generate
from shots import MANGA, AVOID, YOUTH, EAGLE
CLANG = ("Hong Kong comic (港漫) sound-effect lettering: one single Chinese character, 鏘, the ringing clang of blades meeting. "
         "Written as heavy, explosive brush calligraphy with sharp, flying, tapered strokes and a few ink splatters; a bright white "
         "fill with a cold steel-blue metallic glint, wrapped in a thick, solid black outline; tilted with energy, short speed streaks "
         "and sparks trailing from its strokes. The character must be written correctly: the metal radical 金 on the left and 將 on the "
         "right, every stroke present. Only this one character, large and centred, nothing else. Fully transparent background. "
         "No other characters, no frame, no border, no signature.")
JOBS = {
 'e2-startle': ("1152x2048", ["ref-youth.png", "ref-eagle.png"], False, MANGA + f"\n\nBeside the stone go table on the misty valley floor: {YOUTH} stumbles backward in fright, arms flung up, eyes wide, as {EAGLE}, as tall as he is, suddenly thrusts its huge head close to his face. The bird and the youth are the same height, side by side, so its size is plain; the bird is calm and curious, the youth terrified. Comic shock lines around the youth, a little dust kicked up, cliffs and mist behind. Keep the youth and the bird in the middle of the frame.\n\n" + AVOID),
 'clang-1': ("1024x1024", [], True, CLANG),
 'clang-2': ("1024x1024", [], True, CLANG + " A slightly different, more slanted composition."),
 'clang-3': ("1024x1024", [], True, CLANG + " Rougher, drier brush, more splatter."),
}
def run(item):
    name, (size, refs, tr, prompt) = item
    return generate(prompt, size, name + ".png", refs=refs, transparent=tr)
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(run, list(JOBS.items())): print(r, flush=True)
