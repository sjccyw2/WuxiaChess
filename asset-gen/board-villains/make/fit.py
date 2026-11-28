"""Makes the pack's files from the paintings in full/ (paint.py):

    python3 asset-gen/board-villains/make/fit.py [id ...]

  portraits/<id>.webp  the portrait at 510 x 510, as the roster pack's
  sprites/<id>.png     the sheet in the roster pack's layout: 1152 x 880, 8 columns by 5 rows of
                       144 x 176 cells, every figure standing on y 162

A painted sheet is a grid of 8 x 5 figures, but not on exact cells. Each row and column is found
from the gaps in the alpha; each figure is cut out whole (its own connected parts) and the sheet is
scaled once, so that the idle row stands as tall as the pack's figures of its kind. Every frame is
then set down with its foot on y 162 and its body (the middle band of its height, which a blade
held out does not pull) on the cell's centre line, and shifted no further than keeps it in its
cell. manifest.json is rewritten from cast.py. tools/roster-art.py --pack board-villains then makes
the game's files.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from cast import CAST  # noqa: E402

PACK = os.path.normpath(os.path.join(HERE, '..'))
FULL = os.path.join(PACK, 'full')
CELL_W, CELL_H, FOOT_Y, COLS, ROWS = 144, 176, 162, 8, 5
# The idle height of the roster pack's figures (measured from its sheets).
HEIGHT = {'villain': 139, 'troop': 142}
FEMALE = {'mieJue': 134, 'emei': 134}


def bands(profile, n):
    """n runs of the profile above its noise, merged or split until there are n."""
    on = profile > profile.max() * 0.01
    runs, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        if not v and start is not None:
            runs.append([start, i])
            start = None
    if start is not None:
        runs.append([start, len(on)])
    runs = [r for r in runs if r[1] - r[0] > 4]
    while len(runs) > n:  # join the closest pair
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = int(np.argmin(gaps))
        runs[i:i + 2] = [[runs[i][0], runs[i + 1][1]]]
    if len(runs) < n:  # fall back to an even split
        step = len(profile) / n
        runs = [[int(i * step), int((i + 1) * step)] for i in range(n)]
    return runs


def components(mask):
    """Connected parts of a boolean mask (8-neighbour), as a label array and a count."""
    h, w = mask.shape
    label = np.zeros((h, w), dtype=np.int32)
    n = 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if label[y0, x0]:
            continue
        n += 1
        label[y0, x0] = n
        stack = [(y0, x0)]
        while stack:
            y, x = stack.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not label[yy, xx]:
                        label[yy, xx] = n
                        stack.append((yy, xx))
    return label, n


def row_frames(a, r0, r1):
    """The eight figures of one painted row. Each connected part goes to the column band its
    centre lies in, so a blade reaching into the next band stays with its figure; a small loose
    part goes to the nearest figure."""
    band = a[r0:r1]
    mask = band[:, :, 3] > 8
    cols = bands(band[:, :, 3].astype(float).sum(axis=0), COLS)
    label, n = components(mask[::2, ::2])  # half resolution is enough to tell parts apart
    label = np.repeat(np.repeat(label, 2, axis=0), 2, axis=1)[:mask.shape[0], :mask.shape[1]] * mask
    owner = {}
    sizes = np.bincount(label.ravel(), minlength=n + 1)
    big = sizes[1:].max() if n else 0
    centres = {}
    for i in range(1, n + 1):
        if not sizes[i]:
            continue
        xs = np.nonzero(label == i)[1]
        centres[i] = xs.mean()
    for i, cx in centres.items():
        owner[i] = int(np.argmin([abs((c0 + c1) / 2 - cx) if not (c0 <= cx < c1) else -1
                                  for c0, c1 in cols]))
    # Specks far smaller than a figure join the column whose figure is nearest them.
    for i, cx in centres.items():
        if sizes[i] < big * 0.02:
            owner[i] = int(np.argmin([min(abs(c0 - cx), abs(c1 - cx)) if not (c0 <= cx < c1) else -1
                                      for c0, c1 in cols]))
    out = []
    for col in range(COLS):
        keep = np.isin(label, [i for i, o in owner.items() if o == col])
        if not keep.any():
            out.append(None)
            continue
        f = band.copy()
        f[~keep] = 0
        ys, xs = np.nonzero(keep)
        out.append(f[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    return out


def body_x(f):
    """The centre of the middle band of the figure's height."""
    h = f.shape[0]
    band = f[int(h * 0.2):int(h * 0.55), :, 3] > 40
    xs = np.nonzero(band.any(axis=0))[0]
    if not len(xs):
        return f.shape[1] / 2
    cols = band.sum(axis=0)
    return float((np.arange(len(cols)) * cols).sum() / max(cols.sum(), 1))


def fit(k):
    c = CAST[k]
    a = np.array(Image.open(os.path.join(FULL, k + '-sheet.png')).convert('RGBA'))
    frames = [row_frames(a, r0, r1) for r0, r1 in bands(a[:, :, 3].astype(float).sum(axis=1), ROWS)]
    idle = [f.shape[0] for f in frames[0] if f is not None]
    target = FEMALE.get(k, HEIGHT[c['group']])
    scale = target / float(np.median(idle))
    out = Image.new('RGBA', (COLS * CELL_W, ROWS * CELL_H), (0, 0, 0, 0))
    for r, row in enumerate(frames):
        for col, f in enumerate(row):
            if f is None:
                continue
            img = Image.fromarray(f, 'RGBA')
            w, h = max(1, round(img.width * scale)), max(1, round(img.height * scale))
            img = img.resize((w, h), Image.LANCZOS)
            # A figure taller than the cell above the foot line is shrunk to fit.
            if h > FOOT_Y - 2:
                k2 = (FOOT_Y - 2) / h
                img = img.resize((max(1, round(w * k2)), FOOT_Y - 2), Image.LANCZOS)
                w, h = img.size
            bx = body_x(np.array(img))
            x = round(CELL_W / 2 - bx)
            x = min(max(x, min(0, CELL_W - w)), max(0, CELL_W - w)) if w <= CELL_W else round((CELL_W - w) / 2)
            y = FOOT_Y + 1 - h
            cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
            cell.alpha_composite(img, (x, y)) if x >= 0 else cell.paste(img, (x, y), img)
            out.alpha_composite(cell, (col * CELL_W, r * CELL_H))
    out.save(os.path.join(PACK, 'sprites', k + '.png'), optimize=True)
    Image.open(os.path.join(FULL, k + '-portrait.png')).convert('RGB').resize(
        (510, 510), Image.LANCZOS).save(os.path.join(PACK, 'portraits', k + '.webp'), 'WEBP', quality=90)
    return '%s scale %.3f, idle %d px' % (k, scale, target)


def manifest():
    chars = [dict(id=k, group=c['group'], name=c['name'], book=c['book'],
                  portrait='portraits/%s.webp' % k, sheet='sprites/%s.png' % k) for k, c in CAST.items()]
    with open(os.path.join(PACK, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(title='Characters of the boards added on 2026-11-28',
                       spriteSheet=dict(columns=COLS, rows=ROWS, cell=[CELL_W, CELL_H], foot=FOOT_Y,
                                        rowNames=['idle', 'walk', 'attack', 'hurt', 'special']),
                       characters=chars), f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    ids = sys.argv[1:] or [k for k in CAST if os.path.exists(os.path.join(FULL, k + '-sheet.png'))]
    for k in ids:
        print(fit(k))
    manifest()
