# The 45 s prologue cut: paced as an arc (quiet, a jolt, awe, mystery, energy, tension, gravity,
# a comic beat, the climax), with 港漫 lettering. Three impacts only: the eyes, the eagle, the stones.
from comic import *
DUR = 45.0
def cam(z0, z1, cx0, cx1, cy0, cy1, curve=ease):
    return lambda u: (lerp(z0, z1, curve(u)), lerp(cx0, cx1, curve(u)), lerp(cy0, cy1, curve(u)))
def punch(z0, z1, amt, cx, cy, d=.12):
    return lambda u: (lerp(z0, z1, ease(u)) * (1 + amt * (1 - out5(u / d))), cx, cy)
OFF_R = [(W + 60, 760), (W + 400, 700), (W + 400, 1100), (W + 60, 1160)]
SHAPES = {
 'band':  (OFF_R, [(-20, 760), (W + 20, 650), (W + 20, 1080), (-20, 1190)]),
 'wedge': ([(W + 20, H + 20), (W + 30, H + 20), (W + 30, H + 30), (W + 20, H + 30)], [(380, 1120), (W + 20, 760), (W + 20, H + 20), (180, H + 20)]),
 'left':  ([(-700, -20), (-60, -20), (-260, H + 20), (-700, H + 20)], [(-20, -20), (680, -20), (430, H + 20), (-20, H + 20)]),
 'top':   ([(-20, -1000), (W + 20, -1000), (W + 20, -180), (-20, -20)], [(-20, -20), (W + 20, -20), (W + 20, 820), (-20, 1000)]),
 'tl':    ([(-20, -20), (0, -20), (0, 0), (-20, 0)], [(-20, -20), (820, -20), (560, 1000), (-20, 1180)]),
 'bottom':([(-20, H + 120), (W + 20, H + 20), (W + 20, H + 940), (-20, H + 940)], [(-20, 1030), (W + 20, 900), (W + 20, H + 20), (-20, H + 20)]),
}
def enter(t0, shape, slide=.18, hold=.35, grow=.4, stay=False):
    a, b = SHAPES[shape]
    keys = [(t0, a), (t0 + slide, b)]
    if not stay: keys += [(t0 + slide + hold, b), (t0 + slide + hold + grow, FULL)]
    return keys
def decay(t0, d=.45, a=1.0): return lambda t: a * clamp(1 - (t - t0) / d) if t >= t0 else 0
def shakes(*fs): return lambda t: max(f(t) for f in fs)
def reveal(t0, d): return lambda t: ease((t - t0) / d)
def snap(t0, d): return lambda t: out5((t - t0) / d)

P = [
 Panel('s1-asleep.png',   0.0,  4.75, cam(1.0, 1.14, .5, .45, .55, .38)),
 Panel('s2-eyes.png',     4.2,  6.95, punch(1.05, 1.15, .45, .5, .45), poly=enter(4.2, 'band', .1, .3, .25), shake=decay(4.2, .5)),
 Panel('s3-valley.png',   6.5, 11.85, cam(1.0, 1.0, .5, .5, 0.0, 1.0), mask='dots', reveal=reveal(6.5, 1.1)),
 Panel('d-selfplay.png', 11.4, 15.3, cam(1.12, 1.24, .5, .5, .35, .45), poly=enter(11.4, 'wedge', .55, .7, .8)),
 Panel('s4-board.png',   14.8, 17.9, cam(1.35, 1.05, .55, .5, .45, .55, curve=out3), mask='iris', reveal=snap(14.8, .6), center=(W / 2, H * .62), shake=decay(15.4, .3, .4)),
 Panel('s5-eagle.png',   17.6, 20.65, punch(1.0, 1.08, -.18, .5, .32), poly=enter(17.6, 'left', .12, .2, .25), shake=shakes(decay(17.6, .4), decay(18.6, .35, .7))),
 Panel('g-lost.png',     20.0, 23.0, cam(1.05, 1.12, .45, .5, .25, .3), poly=enter(20.0, 'top', .35, .45, .55)),
 Panel('s6-qiubai.png',  23.0, 28.6, cam(1.0, 1.1, .5, .5, .22, .2)),
 Panel('i-name.png',     26.4, 28.6, cam(1.0, 1.05, .5, .5, .08, .1), poly=enter(26.4, 'bottom', .4, stay=True)),
 Panel('j-reveal.png',   28.6, 35.2, cam(1.0, 1.14, .5, .5, .3, .24), mask='fade', reveal=reveal(28.6, .9)),
 Panel('l-hands.png',    34.4, 37.6, cam(1.0, 1.1, .5, .5, .3, .38), mask='fade', reveal=reveal(34.4, .8)),
 Panel('m-box.png',      37.0, 40.6, cam(1.0, 1.08, .5, .5, .25, .3), poly=enter(37.0, 'tl', .22, .3, .45)),
 Panel('n-cantplay.png', 38.9, 40.6, cam(1.0, 1.04, .5, .5, .12, .14), poly=enter(38.9, 'bottom', .2, stay=True)),
 Panel('o-grab.png',     40.6, 43.0, cam(1.0, 1.12, .5, .5, .45, .55), mask='iris', reveal=snap(40.6, .55), center=(W / 2, H * .7)),
 Panel('p-rise.png',     42.6, 45.0, cam(1.0, 1.1, .5, .5, .45, .5), poly=enter(42.6, 'band', .08, .15, .3), shake=decay(42.6, .4, .6)),
]
def life(t, a, b): return (t - a) / (b - a) if a <= t < b else -1
O = []
def at(fn): O.append(fn); return fn
TR, TL = W - 36, 36   # flush to the panel's corners, as 港漫 set their boxes
def left_edge(cols, size=50): return TL + len(cols) * size * 1.25 + size * .65
@at
def _(c, t):   # the gravity beat: the frame darkens toward the edges around 求敗
    vignette(c, .55 * ease((t - 28.8) / 1.5) * (1 - ease((t - 34.6) / .6)) if 28.8 <= t < 35.2 else 0)
@at
def _(c, t):
    for t0, cen in ((4.2, (W / 2, H * .47)), (42.6, (W / 2, H * .7))):
        burst(c, cen, 1 - clamp((t - t0) / .35) if t >= t0 else 0)
@at
def _(c, t):
    cols = ['這一覺，', '睡得好沉。']; box_hk(c, cols, TR, 40, life(t, .7, 4.0), dark=True, fade_in=.25)
    box_hk(c, ['睜開眼來。'], left_edge(['睜開眼來。']), 1300, life(t, 4.7, 6.4))
    box_hk(c, ['竟不在', '自家床上。'], TR, 40, life(t, 7.2, 9.2), fade_in=.2)
    cols = ['但見好大一座山谷，', '四面峭壁如削。']; box_hk(c, cols, left_edge(cols), 40, life(t, 9.2, 11.6), fade_in=.2)
    box_hk(c, ['谷底一方青石棋臺。'], TR, 40, life(t, 12.1, 15.0), fade_in=.2)
    cols = ['一個老者，', '正自己同自己對弈。']; box_hk(c, cols, left_edge(cols), 40, life(t, 13.0, 15.0), fade_in=.2)
    box_hk(c, ['棋子之上，', '人影鬥得正緊。'], TR, 40, life(t, 15.0, 17.6))
    box_hk(c, ['三枚白子，', '登時亮了。'], TR, 40, life(t, 43.0, 44.4), dark=True)
@at
def _(c, t):
    sfx_hk(c, '鏘', (W * .62, H * .42), 230, life(t, 15.35, 16.5), rot=8, trail=(-1, .3))
    for t0, x, sz, r in ((42.85, .2, 140, -8), (43.1, .5, 160, 4), (43.35, .8, 180, -3)):
        sfx_hk(c, '嗒', (W * x, H * .6), sz, life(t, t0, t0 + .9), rot=r, trail=(0, -1))
@at
def _(c, t):
    balloon_hk(c, ['這……', '這是甚麼地方？'], (820, 540), (560, 420), life(t, 20.7, 22.95))
    balloon_hk(c, ['咦。'], (870, 250), (690, 420), life(t, 23.8, 25.1), size=70)
    balloon_hk(c, ['你是甚麼人？'], (200, 560), (430, 520), life(t, 25.1, 26.9))
    balloon_hk(c, ['我……', '我叫……'], (880, 1470), (650, 1330), life(t, 27.0, 28.55))
    balloon_hk(c, ['罷了。'], (230, 930), (470, 640), life(t, 27.95, 28.6), size=60, appear=.25)
    balloon_hk(c, ['老夫三百年', '沒見過一個活人，'], (870, 330), (690, 520), life(t, 29.3, 31.8))
    balloon_hk(c, ['今天你我有緣，'], (860, 420), (620, 520), life(t, 34.9, 37.0))
    balloon_hk(c, ['就陪老夫', '下盤棋吧！'], (870, 330), (620, 420), life(t, 37.35, 39.6))
    balloon_hk(c, ['我不會下棋。'], (220, 1400), (430, 1330), life(t, 39.2, 40.6))
    balloon_hk(c, ['子自己會走，', '自己會打。'], (300, 470), (340, -80), life(t, 40.95, 42.6))
@at
def _(c, t):   # 求敗 is named once, calmly, while the frame is darkest
    name_card(c, '求敗', '世人叫他', 175, 520, life(t, 31.6, 35.0))
@at
def _(c, t):
    for t0 in (4.2, 42.6):
        flash(c, (t - t0) / .14 if t >= t0 else 1)
@at
def _(c, t):
    k = 0
    for t0, a in ((4.2, 1), (17.6, .6), (18.6, .4), (42.6, 1)):
        if t0 <= t < t0 + .2: k = max(k, a * (1 - (t - t0) / .2))
    return misregister(c, k)
@at
def _(c, t):
    if t < 43.6: return
    a = out3((t - 43.6) / .6)
    g = np.zeros((H, W, 4), np.uint8); ramp = np.clip((np.arange(H) - H * .5) / (H * .5), 0, 1)
    g[..., 3] = (ramp[:, None] * 225 * a).astype(np.uint8)
    L = Image.fromarray(g, 'RGBA'); d = ImageDraw.Draw(L)
    k = out5((t - 43.6) / .45); sz = int(150 * (1.2 - .2 * k))
    for i, ch in enumerate('劍影江湖'):
        d.text((W / 2 - 2 * sz * 1.15 + i * sz * 1.15, 1450 - (sz - 150) / 2), ch, font=font(ch, sz), fill=PAPER + (int(255 * a),), stroke_width=6, stroke_fill=INK + (int(255 * a),))
    b = clamp((t - 44.0) / .4)
    for i, ch in enumerate('一念江湖'):
        d.text((W / 2 - 2 * 66 + i * 66, 1660), ch, font=font(ch, 46), fill=(218, 183, 120, int(255 * b)), stroke_width=3, stroke_fill=INK + (int(255 * b),))
    c.paste(L, (0, 0), L)
def frame_at(t):
    canvas = Image.new('RGB', (W, H), PAPER)
    for pn in P:
        if pn.active(t): pn.render(canvas, t)
    for o in O: canvas = o(canvas, t) or canvas
    return canvas
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        for s in sys.argv[1:]: frame_at(float(s)).resize((270, 480)).save(f'e-{s}.png')
    else:
        render(P, O, 'silent45.mp4', DUR); print('video done')
