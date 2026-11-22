# The 59 s ending film, wide (1920 x 1080). Same timeline, words and lettering as cut59.py (both read
# timeline.py); the panels are the 16:9 ones in w/, and the layout is made for a landscape frame:
# where the upright cut stacks the page of the hit (求敗's eyes above, the youth below), this one
# sets the two panels side by side (the youth on the left, the eyes on the right).
import os
os.environ['COMIC_FRAME'] = '1920x1080'
from comic import *
from PIL import ImageEnhance
from timeline import DUR, T, WORDS, NAME
PAN = 'w/'
def cam(z0, z1, cx0, cx1, cy0, cy1, curve=ease):
    return lambda u: (lerp(z0, z1, curve(u)), lerp(cx0, cx1, curve(u)), lerp(cy0, cy1, curve(u)))
def punch(z0, z1, amt, cx, cy, d=.12):
    return lambda u: (lerp(z0, z1, ease(u)) * (1 + amt * (1 - out5(u / d))), cx, cy)
LEFT_PAGE = [(-20, -20), (860, -20), (740, H + 20), (-20, H + 20)]
RIGHT_PAGE = [(860, -20), (W + 20, -20), (W + 20, H + 20), (740, H + 20)]
OFF_RIGHT = [(W + 60, -20), (W + 900, -20), (W + 900, H + 20), (W + 180, H + 20)]
SHAPES = {
 'eyes':  ([(W + 60, 470), (W + 400, 440), (W + 400, 640), (W + 60, 670)], [(-20, 490), (W + 20, 450), (W + 20, 660), (-20, 700)]),
 'left':  ([(-1100, -20), (-60, -20), (-280, H + 20), (-1100, H + 20)], [(-20, -20), (980, -20), (760, H + 20), (-20, H + 20)]),
 'right': (OFF_RIGHT, [(900, -20), (W + 20, -20), (W + 20, H + 20), (1020, H + 20)]),
 'page':  (OFF_RIGHT, RIGHT_PAGE),
}
def enter(t0, shape, slide=.18, hold=.35, grow=.4, stay=False):
    a, b = SHAPES[shape]
    keys = [(t0, a), (t0 + slide, b)]
    if not stay: keys += [(t0 + slide + hold, b), (t0 + slide + hold + grow, FULL)]
    return keys
def decay(t0, d=.45, a=1.0): return lambda t: a * clamp(1 - (t - t0) / d) if t >= t0 else 0
def reveal(t0, d): return lambda t: ease((t - t0) / d)

def stones_cam(t):   # holds on the board while the stones light, then follows the lights up the valley
    k = ease((t - (T['lit'] + .9)) / (T['f4'] - T['lit'] - .5))
    return lerp(1.34, 1.12, k), .5, lerp(.95, .05, k)
stones_cam.clock = True
LIT = Image.open(PAN + 'f3-stones.png').convert('RGB')
UNLIT = ImageEnhance.Brightness(ImageEnhance.Color(LIT).enhance(.3)).enhance(.6)   # the same picture before the stones light
P = [
 Panel(PAN + 'f1-twig.png',    T['f1'], T['f2'], cam(1.0, 1.08, .4, .38, .4, .4)),
 Panel(PAN + 'f2-setdown.png', T['f2'], T['f3'], cam(1.08, 1.03, .5, .5, .5, .6), mask='fade', reveal=reveal(T['f2'], .9)),
 Panel(UNLIT,                  T['f3'], T['f4'], stones_cam, mask='fade', reveal=reveal(T['f3'], 1.1)),
 Panel(LIT,                    T['lit'], T['f4'], stones_cam, mask='dots', reveal=reveal(T['lit'], 2.4)),
 Panel(PAN + 'f4-thanks.png',  T['f4'], T['f5'], cam(1.0, 1.06, .55, .6, .3, .3), mask='fade', reveal=reveal(T['f4'], .9)),
 Panel(PAN + 'f5-wei.png',     T['f5'], T['f6'], cam(1.1, 1.0, .5, .5, .4, .5), poly=enter(T['f5'], 'right', .5, .55, .7)),
 Panel(PAN + 'f6-stance.png',  T['f6'], T['f7'], lambda u: (1.0, .5, .5), poly=[(T['f6'], FULL), (T['eyes'], FULL), (T['eyes'] + .14, LEFT_PAGE)]),
 Panel(PAN + 'f6-eyes.png',    T['eyes'], T['f7'], lambda u: (1.0, .5, .5), poly=enter(T['eyes'], 'page', .14, stay=True), shake=decay(T['eyes'], .3, .5)),
 Panel(PAN + 'f7-leave.png',   T['f7'], T['f8'], cam(1.3, 1.0, .9, .5, .4, .5), mask='fade', reveal=reveal(T['f7'], 1.2)),
 Panel(PAN + 'f8-wake.png',    T['f8'], T['f9'], cam(1.08, 1.08, .5, .5, .45, .45), poly=enter(T['f8'], 'eyes', .1, .3, .25), shake=decay(T['f8'], .5), anchor=((1030, 600), (960, 575))),
 Panel(PAN + 'f9-sword.png',   T['f9'], T['f10'], cam(1.12, 1.0, .5, .5, .4, .5, curve=out3), mask='iris', reveal=reveal(T['f9'], .9), center=(W * .47, H * .42)),
 Panel(PAN + 'f10-eagle.png',  T['f10'], T['f11'], punch(1.0, 1.06, -.15, .5, .2), poly=enter(T['f10'], 'left', .12, .2, .25), shake=decay(T['f10'], .4)),
 Panel(PAN + 'f11-name.png',   T['f11'], DUR, cam(1.0, 1.08, .5, .5, .3, .3), mask='fade', reveal=reveal(T['f11'], 1.0)),
]
def life(t, a, b): return (t - a) / (b - a) if a <= t < b else -1
O = []
def at(fn): O.append(fn); return fn
TR, TL = W - 36, 36
def left_edge(cols, size=50): return TL + len(cols) * size * 1.25 + size * .65
def box_h(cols, size=50): return max(len(c) for c in cols) * size * 1.08 + size * .9
def box(c, t, key, side, y=40, **kw):
    """A narration box at the right ('r') or left ('l') edge; y < 0 measures from the bottom of the frame."""
    cols, a, b = WORDS[key]
    box_hk(c, cols, TR if side == 'r' else left_edge(cols), y if y >= 0 else H + y - box_h(cols), life(t, a, b), **{'fade_in': .2, **kw})
def say(c, t, key, center, tail, **kw):
    cols, a, b = WORDS[key]
    balloon_hk(c, cols, center, tail, life(t, a, b), **kw)
@at
def _(c, t):
    vignette(c, .55 * ease((t - (T['bell'] - .9)) / 1.5))
@at
def _(c, t):
    burst(c, (W / 2, 575), 1 - clamp((t - T['f8']) / .35) if t >= T['f8'] else 0)
@at
def _(c, t):
    lights(c, t, ease((t - T['lit'] - .4) / 1.6) * (1 - ease((t - T['f4'] + .3) / 1.0)), n=90, seed=5, box=(.15, 0, .85, 1))
    k = .75 * ease((t - T['f4'] - .6) / 1.0) * (1 - ease((t - T['f5'] + .5) / .5))
    lights(c, t, k, n=14, seed=8, rise=30, box=(0, .05, .45, .95)); lights(c, t, k, n=8, seed=9, rise=30, box=(.84, .05, 1, .95))
    lights(c, t, .6 * ease((t - T['f7'] - .8) / 1.2) * (1 - ease((t - T['f8'] + 1.6) / 1.4)), n=18, seed=11, rise=34, box=(.4, .1, 1, .8))
@at
def _(c, t):
    box(c, t, '1', 'r', fade_in=.25)
    box(c, t, '2a', 'l'); box(c, t, '2b', 'l', 395)
    box(c, t, '3a', 'r'); box(c, t, '3b', 'l')
    box(c, t, '6a', 'r'); box(c, t, '6b', 'l')
    box(c, t, '7a', 'r'); box(c, t, '7b', 'l')
    box(c, t, '8a', 'r'); box(c, t, '8b', 'r', -40)
    box(c, t, '9a', 'r'); box(c, t, '9b', 'l')
    box(c, t, '10a', 'r'); box(c, t, '10b', 'l')
    box(c, t, '11', 'r')
    box(c, t, '12', 'l')
@at
def _(c, t):
    say(c, t, 'q2', (1010, 230), (1230, 30), size=70)          # 「夠了。」: he is above the frame, so the tail points up off the panel
    say(c, t, 'q4', (820, 330), (1160, 545))
    say(c, t, 'q5', (820, 330), (1160, 545), size=62)
    say(c, t, 'q7', (790, 330), (935, 650))                    # straddles the gutter, the tail reaching into his panel
@at
def _(c, t):
    name_card(c, NAME[0], '', 330, 150, life(t, NAME[1], NAME[2] + 1.0), size=180)
@at
def _(c, t):
    flash(c, (t - T['f8']) / .14 if t >= T['f8'] else 1)
@at
def _(c, t):
    k = 0
    for t0, a in ((T['eyes'], .45), (T['f8'], 1), (T['f10'], .6)):
        if t0 <= t < t0 + .2: k = max(k, a * (1 - (t - t0) / .2))
    return misregister(c, k)
@at
def _(c, t):
    if t >= T['fade']: flash(c, 1 - ease((t - T['fade']) / 1.0), color=(0, 0, 0))
hold_until_covered(P)
def frame_at(t):
    canvas = Image.new('RGB', (W, H), PAPER)
    for pn in P:
        if pn.active(t): pn.render(canvas, t)
    for o in O: canvas = o(canvas, t) or canvas
    return canvas
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        for s in sys.argv[1:]: frame_at(float(s)).resize((960, 540)).save(f'wf-{s}.png')
    else:
        render(P, O, 'silent169.mp4', DUR); print('video done')
