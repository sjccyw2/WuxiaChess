import sys, concurrent.futures as cf
sys.path.insert(0, '.')
from api import generate
TAP = ("Hong Kong comic (港漫) sound-effect lettering: one single Chinese character, 嗒, the crisp, solid click of a box of go stones "
       "set down hard on a stone table. Written as bold, compact brush calligraphy with sharp, decisive strokes and a little dry-brush "
       "texture; a warm ivory-white fill like polished stone, wrapped in a thick, solid black outline; a few short impact lines and "
       "tiny chips flying from its base. The character must be written correctly: the mouth radical 口 on the left, and 荅 on the right "
       "(the grass radical 艹 on top of 合), every stroke present. Only this one character, large and centred, nothing else. Fully "
       "transparent background. No other characters, no frame, no border, no signature.")
JOBS = {'tap-1': TAP, 'tap-2': TAP + " Slightly tilted, heavier strokes.", 'tap-3': TAP + " Drier brush, more texture."}
def run(item):
    name, prompt = item
    return generate(prompt, "1024x1024", name + ".png", transparent=True)
with cf.ThreadPoolExecutor(3) as ex:
    for r in ex.map(run, list(JOBS.items())): print(r, flush=True)
