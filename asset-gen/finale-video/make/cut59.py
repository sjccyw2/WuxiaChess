# The 59 s ending film, upright (1080 x 1920). Calmer than the prologue: most beats dissolve or slide
# in; only three hit (求敗's eyes, the boy's eyes opening, the eagle). The times and the words are in
# timeline.py; this file holds the upright layout: entrances, cameras and where the lettering sits.
from comic import *
from PIL import ImageEnhance
from timeline import DUR, T, WORDS, NAME
def cam(z0, z1, cx0, cx1, cy0, cy1, curve=ease):
    return lambda u: (lerp(z0, z1, curve(u)), lerp(cx0, cx1, curve(u)), lerp(cy0, cy1, curve(u)))
def punch(z0, z1, amt, cx, cy, d=.12):
    return lambda u: (lerp(z0, z1, ease(u)) * (1 + amt * (1 - out5(u / d))), cx, cy)
# The page of the hit: 求敗's eyes above, the youth below (the prologue's page had 求敗 above too).
BAND = [(-20, -20), (W + 20, -20), (W + 20, 690), (-20, 790)]
LOWER = [(-20, 790), (W + 20, 690), (W + 20, H + 20), (-20, H + 20)]   # shares the band's lower edge: one rule between them
SHAPES = {
 'eyes':  ([(W + 60, 940), (W + 400, 880), (W + 400, 1280), (W + 60, 1340)], [(-20, 940), (W + 20, 830), (W + 20, 1260), (-20, 1370)]),
 'left':  ([(-700, -20), (-60, -20), (-260, H + 20), (-700, H + 20)], [(-20, -20), (680, -20), (430, H + 20), (-20, H + 20)]),
 'right': ([(W + 60, -20), (W + 800, -20), (W + 800, H + 20), (W + 260, H + 20)], [(300, -20), (W + 20, -20), (W + 20, H + 20), (520, H + 20)]),
 'band':  ([(-20, -900), (W + 20, -900), (W + 20, -130), (-20, -30)], BAND),
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
    return lerp(1.34, 1.1, k), .5, lerp(.93, .12, k)
stones_cam.clock = True
LIT = Image.open('f3-stones.png').convert('RGB')
UNLIT = ImageEnhance.Brightness(ImageEnhance.Color(LIT).enhance(.3)).enhance(.6)   # the same picture before the stones light
P = [
 Panel('f1-twig.png',    T['f1'], T['f2'], cam(1.0, 1.1, .45, .4, .4, .4)),
 Panel('f2-setdown.png', T['f2'], T['f3'], cam(1.1, 1.04, .5, .5, .5, .6), mask='fade', reveal=reveal(T['f2'], .9)),
 Panel(UNLIT,            T['f3'], T['f4'], stones_cam, mask='fade', reveal=reveal(T['f3'], 1.1)),
 Panel(LIT,              T['lit'], T['f4'], stones_cam, mask='dots', reveal=reveal(T['lit'], 2.4)),
 Panel('f4-thanks.png',  T['f4'], T['f5'], cam(1.0, 1.08, .5, .5, .3, .3), mask='fade', reveal=reveal(T['f4'], .9)),
 Panel('f5-wei.png',     T['f5'], T['f6'], cam(1.12, 1.0, .5, .5, .35, .45), poly=enter(T['f5'], 'right', .5, .55, .7)),
 Panel('f6-stance.png',  T['f6'], T['f7'], lambda u: (1.0, .5, .42), poly=[(T['f6'], FULL), (T['eyes'], FULL), (T['eyes'] + .14, LOWER)]),
 Panel('f6-eyes.png',    T['eyes'], T['f7'], lambda u: (1.0, .5, .38), poly=enter(T['eyes'], 'band', .14, stay=True), shake=decay(T['eyes'], .3, .5)),
 Panel('f7-leave.png',   T['f7'], T['f8'], cam(1.3, 1.0, .9, .5, .3, .5), mask='fade', reveal=reveal(T['f7'], 1.2)),
 Panel('f8-wake.png',    T['f8'], T['f9'], cam(1.08, 1.08, .5, .5, .45, .45), poly=enter(T['f8'], 'eyes', .1, .3, .25), shake=decay(T['f8'], .5), anchor=((627, 1165), (540, 1100))),
 Panel('f9-sword.png',   T['f9'], T['f10'], cam(1.14, 1.0, .5, .5, .4, .5, curve=out3), mask='iris', reveal=reveal(T['f9'], .9), center=(W / 2, H * .42)),
 Panel('f10-eagle.png',  T['f10'], T['f11'], punch(1.0, 1.08, -.18, .5, .2), poly=enter(T['f10'], 'left', .12, .2, .25), shake=decay(T['f10'], .4)),
 Panel('f11-name.png',   T['f11'], DUR, cam(1.0, 1.1, .5, .5, .3, .3), mask='fade', reveal=reveal(T['f11'], 1.0)),
]
def life(t, a, b): return (t - a) / (b - a) if a <= t < b else -1
O = []
def at(fn): O.append(fn); return fn
TR, TL = W - 36, 36   # flush to the panel's corners, as 港漫 set their boxes
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
def _(c, t):   # the gravity beat: the frame darkens toward the edges before the name
    vignette(c, .55 * ease((t - (T['bell'] - .9)) / 1.5))
@at
def _(c, t):   # burst lines for the one impact: the boy's eyes opening
    burst(c, (W / 2, H * .57), 1 - clamp((t - T['f8']) / .35) if t >= T['f8'] else 0)
@at
def _(c, t):   # the stones going home: lights drift up the valley, a few linger around 求敗 and as he leaves
    lights(c, t, ease((t - T['lit'] - .4) / 1.6) * (1 - ease((t - T['f4'] + .3) / 1.0)), n=80, seed=5)
    k = .75 * ease((t - T['f4'] - .6) / 1.0) * (1 - ease((t - T['f5'] + .5) / .5))
    lights(c, t, k, n=10, seed=8, rise=30, box=(0, .05, .2, .95)); lights(c, t, k, n=10, seed=9, rise=30, box=(.82, .05, 1, .95))
    lights(c, t, .6 * ease((t - T['f7'] - .8) / 1.2) * (1 - ease((t - T['f8'] + 1.6) / 1.4)), n=16, seed=11, rise=34, box=(.3, .1, 1, .8))
@at
def _(c, t):
    box(c, t, '1', 'r', fade_in=.25)
    box(c, t, '2a', 'l'); box(c, t, '2b', 'l', 560)
    box(c, t, '3a', 'r'); box(c, t, '3b', 'l')
    box(c, t, '6a', 'r'); box(c, t, '6b', 'l')
    box(c, t, '7a', 'r'); box(c, t, '7b', 'l', 850)
    box(c, t, '8a', 'r'); box(c, t, '8b', 'l')
    box(c, t, '9a', 'r'); box(c, t, '9b', 'l')
    box(c, t, '10a', 'r'); box(c, t, '10b', 'l')
    box(c, t, '11', 'r', -40)
    box(c, t, '12', 'l')
@at
def _(c, t):
    say(c, t, 'q2', (880, 330), (980, 90), size=70)            # 「夠了。」: he is above the frame, so the tail points up off the panel
    say(c, t, 'q4', (850, 520), (575, 905))
    say(c, t, 'q5', (850, 520), (575, 905), size=62)
    say(c, t, 'q7', (955, 1090), (700, 735))                   # hangs under his panel, the tail reaching up into it
@at
def _(c, t):   # the name he will take, set beside the youth exactly as the prologue set it beside the old man
    name_card(c, NAME[0], '', 165, 380, life(t, NAME[1], NAME[2] + 1.0), size=180)
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
def _(c, t):   # the end: hold on the name, then fade to black
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
        for s in sys.argv[1:]: frame_at(float(s)).resize((540, 960)).save(f'e-{s}.png')
    else:
        render(P, O, 'silent59.mp4', DUR); print('video done')
