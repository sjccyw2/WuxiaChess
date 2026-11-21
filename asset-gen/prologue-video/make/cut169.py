# The 45 s prologue cut, wide (1920 x 1080). Same timeline, words and lettering as cut45.py; the
# panels are the 16:9 ones in w/, and the comic cuts are laid out for a landscape frame: where the
# tall cut stacks two panels as a manga page, this one sets them side by side.
import os
os.environ['COMIC_FRAME'] = '1920x1080'
from comic import *
DUR = 45.0
PAN = 'w/'
def cam(z0, z1, cx0, cx1, cy0, cy1, curve=ease):
    return lambda u: (lerp(z0, z1, curve(u)), lerp(cx0, cx1, curve(u)), lerp(cy0, cy1, curve(u)))
def punch(z0, z1, amt, cx, cy, d=.12):
    return lambda u: (lerp(z0, z1, ease(u)) * (1 + amt * (1 - out5(u / d))), cx, cy)
LEFT_PAGE = [(-20, -20), (1010, -20), (890, H + 20), (-20, H + 20)]
RIGHT_PAGE = [(1010, -20), (W + 20, -20), (W + 20, H + 20), (890, H + 20)]
OFF_RIGHT = [(W + 60, -20), (W + 700, -20), (W + 700, H + 20), (W + 180, H + 20)]
SHAPES = {
 'eyes':  ([(W + 60, 470), (W + 400, 440), (W + 400, 640), (W + 60, 670)], [(-20, 490), (W + 20, 450), (W + 20, 660), (-20, 700)]),
 'wedge': ([(W + 20, H + 20), (W + 30, H + 20), (W + 30, H + 30), (W + 20, H + 30)], [(760, 620), (W + 20, 380), (W + 20, H + 20), (560, H + 20)]),
 'left':  ([(-1100, -20), (-60, -20), (-280, H + 20), (-1100, H + 20)], [(-20, -20), (980, -20), (760, H + 20), (-20, H + 20)]),
 'right': (OFF_RIGHT, [(900, -20), (W + 20, -20), (W + 20, H + 20), (1020, H + 20)]),
 'page':  (OFF_RIGHT, RIGHT_PAGE),
 'top':   ([(-20, -700), (W + 20, -700), (W + 20, -60), (-20, -20)], [(-20, -20), (W + 20, -20), (W + 20, 560), (-20, 700)]),
 'tl':    ([(-20, -20), (0, -20), (0, 0), (-20, 0)], [(-20, -20), (1300, -20), (1000, H + 20), (-20, H + 20)]),
}
def enter(t0, shape, slide=.18, hold=.35, grow=.4, stay=False):
    a, b = SHAPES[shape]
    keys = [(t0, a), (t0 + slide, b)]
    if not stay: keys += [(t0 + slide + hold, b), (t0 + slide + hold + grow, FULL)]
    return keys
def decay(t0, d=.45, a=1.0): return lambda t: a * clamp(1 - (t - t0) / d) if t >= t0 else 0
def reveal(t0, d): return lambda t: ease((t - t0) / d)
def snap(t0, d): return lambda t: out5((t - t0) / d)
def hands_cam(u):   # snaps between his two hands, on twos
    t = u
    if t < 35.6: return lerp(1.0, 1.06, ease((t - 34.4) / 1.2)), .5, .4
    side = int((t - 35.6) / .38) % 2
    return 1.9, (.02 if side == 0 else .78), .98
def mbox_cam(u):
    t = u; k = clamp((t - 38.6) / 6.4)
    z = lerp(1.0, 1.1, ease(k)); land = t - 41.55
    if 0 <= land < .25: z *= 1 + .06 * (1 - out5(land / .25))
    return z, .5, lerp(.3, .45, ease(k))
hands_cam.clock = mbox_cam.clock = True
P = [
 Panel(PAN + 's1-asleep.png',   0.0,  4.75, cam(1.05, 1.05, .45, .45, .45, .45)),
 Panel(PAN + 's2-eyes.png',     4.2,  6.95, cam(1.08, 1.08, .5, .5, .45, .45), poly=enter(4.2, 'eyes', .1, .3, .25), shake=decay(4.2, .5), anchor=((1075, 590), (960, 575))),
 Panel(PAN + 's3-valley.png',   6.5, 11.45, cam(1.0, 1.0, .5, .5, 0.0, 1.0), mask='dots', reveal=reveal(6.5, 1.1)),
 Panel(PAN + 'd-selfplay.png', 11.0, 14.9, cam(1.05, 1.15, .5, .5, .4, .5), poly=enter(11.0, 'wedge', .55, .7, .8)),
 Panel(PAN + 's4-board.png',   14.4, 17.45, cam(1.3, 1.04, .5, .5, .4, .5, curve=out3), mask='iris', reveal=snap(14.4, .6), center=(W * .48, H * .4), shake=decay(14.95, .3, .4)),
 Panel(PAN + 's5-eagle.png',   17.2, 21.45, punch(1.0, 1.06, -.15, .3, .3), poly=enter(17.2, 'left', .12, .2, .25), shake=decay(17.2, .4)),
 Panel(PAN + 'e2-startle.png', 18.7, 21.45, cam(1.0, 1.06, .5, .5, .3, .35), poly=enter(18.7, 'right', .16, .7, .45), shake=decay(18.7, .45, .8)),
 Panel(PAN + 'g-lost.png',     21.2, 23.6, cam(1.04, 1.1, .5, .5, .2, .3), poly=enter(21.2, 'top', .3, .35, .45)),
 Panel(PAN + 's6-qiubai.png',  23.6, 28.6, cam(1.0, 1.06, .5, .5, .2, .2), poly=[(23.6, FULL), (26.6, FULL), (27.0, LEFT_PAGE)]),
 Panel(PAN + 'i-name.png',     26.6, 28.6, cam(1.0, 1.04, .56, .56, .1, .12), poly=enter(26.6, 'page', .4, stay=True)),
 Panel(PAN + 'j-reveal.png',   28.6, 35.2, cam(1.0, 1.12, .5, .55, .3, .25), mask='fade', reveal=reveal(28.6, .9)),
 Panel(PAN + 'l-hands.png',    34.4, 38.85, hands_cam, mask='fade', reveal=reveal(34.4, 1.0)),
 Panel(PAN + 'm-box.png',      38.6, 45.0, mbox_cam, poly=enter(38.6, 'tl', .35, .45, .6), shake=decay(41.55, .3, .45)),
]
SFX_CLANG = Image.open('sfx-clang.png').convert('RGBA')
SFX_TAP = Image.open('sfx-tap.png').convert('RGBA')
def life(t, a, b): return (t - a) / (b - a) if a <= t < b else -1
O = []
def at(fn): O.append(fn); return fn
TR, TL = W - 36, 36
def left_edge(cols, size=50): return TL + len(cols) * size * 1.25 + size * .65
@at
def _(c, t):
    vignette(c, .55 * ease((t - 28.8) / 1.5) * (1 - ease((t - 34.6) / .6)) if 28.8 <= t < 35.2 else 0)
@at
def _(c, t):
    for t0, cen in ((4.2, (W / 2, 575)), (41.55, (W * .45, H * .9))):
        burst(c, cen, 1 - clamp((t - t0) / .35) if t >= t0 else 0)
@at
def _(c, t):
    box_hk(c, ['這一覺，', '睡得好沉。'], TR, 40, life(t, .7, 4.0), fade_in=.25)
    box_hk(c, ['睜開眼來。'], left_edge(['睜開眼來。']), 700, life(t, 4.7, 6.4))
    box_hk(c, ['竟不在', '自家床上。'], TR, 40, life(t, 7.1, 9.0), fade_in=.2)
    cols = ['但見好大一座山谷，', '四面峭壁如削。']; box_hk(c, cols, left_edge(cols), 40, life(t, 9.0, 11.2), fade_in=.2)
    box_hk(c, ['谷底一方青石棋臺。'], TR, 40, life(t, 11.7, 14.6), fade_in=.2)
    cols = ['一個老者，', '正自己同自己對弈。']; box_hk(c, cols, left_edge(cols), 40, life(t, 12.6, 14.6), fade_in=.2)
    box_hk(c, ['棋子之上，', '人影鬥得正緊。'], TR, 40, life(t, 14.6, 17.2))
    box_hk(c, ['但見他', '左右手依次下棋，', '動作飛快。'], TR, 40, life(t, 35.0, 38.7), fade_in=.2)
@at
def _(c, t):
    sfx_image(c, SFX_CLANG, (W * .5, H * .36), 560, life(t, 14.95, 16.3), rot=4)
    sfx_image(c, SFX_TAP, (W * .3, H * .66), 360, life(t, 41.55, 42.9), rot=-6)
@at
def _(c, t):
    balloon_hk(c, ['這……', '這是甚麼地方？'], (1330, 400), (955, 255), life(t, 21.6, 23.55))
    balloon_hk(c, ['咦。'], (1460, 320), (1195, 390), life(t, 24.2, 25.4), size=70)
    balloon_hk(c, ['來者何人？'], (580, 400), (960, 390), life(t, 25.4, 27.0), size=62)
    balloon_hk(c, ['我……', '我叫……'], (1745, 580), (1515, 320), life(t, 27.1, 28.55))
    balloon_hk(c, ['罷了。'], (250, 650), (565, 405), life(t, 27.95, 28.6), size=60, appear=.25)
    balloon_hk(c, ['老夫三百年', '沒見過一個活人，'], (1650, 340), (1355, 440), life(t, 29.3, 31.8))
    balloon_hk(c, ['今天你我有緣，'], (1600, 320), (1240, 360), life(t, 39.4, 41.5))
    balloon_hk(c, ['就陪老夫', '下盤棋吧！'], (1600, 320), (1240, 360), life(t, 41.5, 43.7))
@at
def _(c, t):
    name_card(c, '獨孤求敗', '', 330, 150, life(t, 31.6, 35.0), size=180)
@at
def _(c, t):
    flash(c, (t - 4.2) / .14 if t >= 4.2 else 1)
@at
def _(c, t):
    k = 0
    for t0, a in ((4.2, 1), (14.95, .35), (17.2, .6), (18.7, .5), (41.55, .5)):
        if t0 <= t < t0 + .2: k = max(k, a * (1 - (t - t0) / .2))
    return misregister(c, k)
@at
def _(c, t):
    if t >= 44.0: flash(c, 1 - out3((t - 44.0) / .9), color=(0, 0, 0))
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
        for s in sys.argv[1:]: frame_at(float(s)).resize((480, 270)).save(f'wf-{s}.png')
    else:
        render(P, O, 'silent169.mp4', DUR); print('video done')
