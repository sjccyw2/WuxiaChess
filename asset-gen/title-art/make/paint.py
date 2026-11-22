# Paints the title calligraphy 劍影江湖 as black ink on white paper, a few takes at a time.
# The game's file is cut from the chosen take by cut.py.
#   python3 asset-gen/title-art/make/paint.py [take ...]
import sys, os
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../story-characters/make'))
from api import generate

HERE = os.path.dirname(os.path.abspath(__file__))
FULL = os.path.join(HERE, '../full')
BASE = (
    'Chinese brush calligraphy of exactly four characters, 劍影江湖, written in one horizontal line '
    'from left to right, the characters correct and legible. Pure black ink on plain flat white paper, '
    'no paper texture, no border, no seal, no signature, no other marks or text. Centered, with wide margins. '
)
TAKES = {
    'a': BASE + 'Bold, confident 行書 running script with sharp sword-like strokes: fast tapering hairline exits, '
         'dry-brush flying-white streaks in the long strokes, rich wet ink in the heavy dots. Balanced and dignified, '
         'like a title on a classic wuxia novel cover.',
    'b': BASE + 'Powerful 行草 semi-cursive script, dramatic thick-to-thin contrast, the final stroke of 劍 '
         'extended like a sword blade cutting across, splashes of dry brush. Energetic but still readable.',
    'c': BASE + 'Heavy, weighty 行楷 script in the manner of a master calligrapher, blunt square brush entries, '
         'crisp knife-edge exits and visible flying-white in the strokes; strong, grave and clean.',
}
takes = sys.argv[1:] or list(TAKES)
with ThreadPoolExecutor(len(takes)) as pool:
    for line in pool.map(lambda k: generate(TAKES[k], '1536x1024', os.path.join(FULL, f'ink-{k}.png')), takes):
        print(line)
