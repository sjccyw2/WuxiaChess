from comic import *
DUR = 30.0
def cam(z0, z1, cx0, cx1, cy0, cy1, curve=ease):
    return lambda u: (lerp(z0, z1, curve(u)), lerp(cx0, cx1, curve(u)), lerp(cy0, cy1, curve(u)))
def punch(z0, z1, amt, cx, cy, d=.12):
    return lambda u: (lerp(z0, z1, ease(u)) * (1 + amt * (1 - out5(u / d))), cx, cy)
OFF_R = [(W + 60, 760), (W + 400, 700), (W + 400, 1100), (W + 60, 1160)]
SHAPES = {
 'band':  (OFF_R, [(-20, 760), (W + 20, 650), (W + 20, 1080), (-20, 1190)]),
 'wedge': ([(W + 20, H + 20), (W + 30, H + 20), (W + 30, H + 30), (W + 20, H + 30)], [(380, 1120), (W + 20, 760), (W + 20, H + 20), (180, H + 20)]),
 'left':  ([(-700, -20), (-60, -20), (-260, H + 20), (-700, H + 20)], [(-20, -20), (680, -20), (430, H + 20), (-20, H + 20)]),
 'right': ([(W + 60, -20), (W + 700, -20), (W + 700, H + 20), (W + 260, H + 20)], [(400, -20), (W + 20, -20), (W + 20, H + 20), (650, H + 20)]),
 'top':   ([(-20, -1000), (W + 20, -1000), (W + 20, -180), (-20, -20)], [(-20, -20), (W + 20, -20), (W + 20, 820), (-20, 1000)]),
 'tl':    ([(-20, -20), (0, -20), (0, 0), (-20, 0)], [(-20, -20), (820, -20), (560, 1000), (-20, 1180)]),
 'bottom':([(-20, H + 120), (W + 20, H + 20), (W + 20, H + 940), (-20, H + 940)], [(-20, 1030), (W + 20, 900), (W + 20, H + 20), (-20, H + 20)]),
}
def enter(t0, shape, hold=.35, grow=.4, slide=.18, stay=False):
    a, b = SHAPES[shape]
    keys = [(t0, a), (t0 + slide, b)]
    if not stay: keys += [(t0 + slide + hold, b), (t0 + slide + hold + grow, FULL)]
    return keys
def decay(t0, d=.45, a=1.0): return lambda t: a * clamp(1 - (t - t0) / d) if t >= t0 else 0
def shakes(*fs): return lambda t: max(f(t) for f in fs)
def dots(t0, d=.55): return lambda t: out3((t - t0) / d)
def iris(t0, d=.5): return lambda t: out5((t - t0) / d)

P = [
 Panel('s1-asleep.png', 0.0, 2.75, cam(1.0, 1.18, .5, .42, .55, .32)),
 Panel('s2-eyes.png', 2.0, 3.95, punch(1.05, 1.16, .5, .5, .45), poly=enter(2.0, 'band', hold=.3, grow=.25, slide=.1), shake=decay(2.0, .5)),
 Panel('s3-valley.png', 3.4, 6.75, cam(1.0, 1.0, .5, .5, 0.0, 1.0), mask='dots', reveal=dots(3.4)),
 Panel('d-selfplay.png', 6.2, 8.95, cam(1.12, 1.25, .5, .5, .35, .45), poly=enter(6.2, 'wedge', hold=.25)),
 Panel('s4-board.png', 8.4, 10.35, cam(1.4, 1.05, .55, .5, .45, .55, curve=out3), mask='iris', reveal=iris(8.4), center=(W / 2, H * .62), shake=decay(8.9, .3, .5)),
 Panel('s5-eagle.png', 10.0, 11.55, punch(1.0, 1.1, -.2, .5, .32), poly=enter(10.0, 'left', hold=.2, grow=.25, slide=.1), shake=shakes(decay(10.0, .4), decay(10.7, .35, .7))),
 Panel('g-lost.png', 11.2, 13.35, cam(1.05, 1.15, .45, .5, .25, .3), poly=enter(11.2, 'top', hold=.25)),
 Panel('s6-qiubai.png', 13.0, 17.35, cam(1.0, 1.12, .5, .5, .22, .2), poly=enter(13.0, 'right', hold=.2, grow=.3), shake=decay(13.45, .3, .6)),
 Panel('i-name.png', 15.0, 17.35, cam(1.0, 1.06, .5, .5, .08, .1), poly=enter(15.0, 'bottom', stay=True, slide=.22)),
 Panel('j-reveal.png', 17.0, 19.55, cam(1.0, 1.2, .5, .5, .3, .25), mask='iris', reveal=iris(17.0, .35), center=(W / 2, H * .33), shake=decay(17.0, .5)),
 Panel('k-disbelief.png', 19.2, 20.95, punch(1.0, 1.06, .25, .55, .2), poly=enter(19.2, 'right', hold=.15, grow=.2, slide=.1), shake=decay(19.2, .35, .6)),
 Panel('l-hands.png', 20.6, 23.15, cam(1.0, 1.12, .5, .5, .3, .4), mask='dots', reveal=dots(20.6, .5)),
 Panel('m-box.png', 22.8, 25.95, cam(1.0, 1.1, .5, .5, .25, .3), poly=enter(22.8, 'tl', hold=.25)),
 Panel('n-cantplay.png', 24.4, 25.95, cam(1.0, 1.05, .5, .5, .12, .14), poly=enter(24.4, 'bottom', stay=True, slide=.2)),
 Panel('o-grab.png', 25.6, 27.75, cam(1.0, 1.15, .5, .5, .45, .55), mask='iris', reveal=iris(25.6, .45), center=(W / 2, H * .7)),
 Panel('p-rise.png', 27.4, 30.0, cam(1.0, 1.12, .5, .5, .45, .5), poly=enter(27.4, 'band', hold=.15, grow=.3, slide=.08), shake=decay(27.4, .4, .6)),
]
def life(t, a, b): return (t - a) / (b - a) if a <= t < b else -1
O = []
def at(fn): O.append(fn); return fn
@at
def _(c, t):
    for t0, cen in ((2.0, (W / 2, H * .47)), (10.0, (W * .55, H * .35)), (17.0, (W / 2, H * .33)), (19.2, (W * .55, H * .22)), (27.4, (W / 2, H * .7))):
        burst(c, cen, 1 - clamp((t - t0) / .35) if t >= t0 else 0)
@at
def _(c, t):
    narration(c, ['這一覺', '睡得好沉'], 1030, 90, life(t, .25, 2.2))
    narration(c, ['睜開眼來'], 300, 1250, life(t, 2.45, 3.6))
    narration(c, ['竟不在', '自家床上'], 1030, 110, life(t, 3.6, 5.0))
    narration(c, ['但見好大', '一座山谷'], 300, 1100, life(t, 5.0, 6.4))
    narration(c, ['一個老者', '自己同自己', '對弈'], 1030, 100, life(t, 6.55, 8.5))
    narration(c, ['棋子之上', '人影鬥得正緊'], 1030, 100, life(t, 8.9, 10.1))
    narration(c, ['三枚白子', '登時亮了'], 1030, 90, life(t, 27.9, 29.0))
@at
def _(c, t):
    sfx(c, '鏘', (W * .62, H * .42), 260, life(t, 8.85, 9.85), rot=10)
    sfx(c, '嗒', (W * .2, H * .66), 170, life(t, 27.5, 28.4), rot=-12, fill=(250, 246, 232))
    sfx(c, '嗒', (W * .5, H * .62), 190, life(t, 27.75, 28.6), rot=6, fill=(250, 246, 232))
    sfx(c, '嗒', (W * .8, H * .66), 210, life(t, 28.0, 28.8), rot=-4, fill=(250, 246, 232))
    sfx(c, '求敗', (W / 2, H * .74), 330, life(t, 17.6, 19.45), rot=-7)
@at
def _(c, t):
    balloon(c, ['這是甚麼地方？', '我是不是死了？'], (830, 520), (560, 420), life(t, 11.6, 13.1))
    balloon(c, ['咦。'], (860, 230), (690, 420), life(t, 13.4, 14.3), size=90, shout=True)
    balloon(c, ['你是甚麼人？'], (190, 560), (430, 520), life(t, 14.2, 15.3))
    balloon(c, ['我叫阿石。', '老伯，你又是誰？'], (880, 1450), (650, 1330), life(t, 15.3, 17.0))
    balloon(c, ['世人叫我'], (880, 260), (700, 470), life(t, 17.25, 19.4))
    balloon(c, ['天下哪有人', '盼著打敗仗的？'], (230, 650), (430, 470), life(t, 19.35, 20.9), shout=True)
    balloon(c, ['左手同右手，', '已下了幾百年。'], (860, 420), (600, 520), life(t, 21.0, 23.0))
    balloon(c, ['坐下。', '抓三枚。'], (870, 330), (620, 420), life(t, 23.15, 24.5))
    balloon(c, ['我不會下棋。'], (220, 1400), (430, 1330), life(t, 24.65, 25.9))
    balloon(c, ['子自己會走，', '自己會打。'], (300, 470), (340, -80), life(t, 26.0, 27.6))
@at
def _(c, t):
    for t0 in (2.0, 10.0, 17.0, 19.2, 27.4):
        flash(c, (t - t0) / .12 if t >= t0 else 1)
@at
def _(c, t):
    k = 0
    for t0 in (2.0, 3.4, 8.4, 10.0, 10.7, 13.4, 17.0, 19.2, 20.6, 27.4):
        if t0 <= t < t0 + .2: k = max(k, 1 - (t - t0) / .2)
    return misregister(c, k)
@at
def _(c, t):
    if t < 28.7: return
    a = out3((t - 28.7) / .5)
    g = np.zeros((H, W, 4), np.uint8); ramp = np.clip((np.arange(H) - H * .5) / (H * .5), 0, 1)
    g[..., 3] = (ramp[:, None] * 225 * a).astype(np.uint8)
    L = Image.fromarray(g, 'RGBA'); d = ImageDraw.Draw(L)
    k = out5((t - 28.7) / .35); sz = int(150 * (1.25 - .25 * k))
    for i, ch in enumerate('劍影江湖'):
        x = W / 2 - 2 * sz * 1.15 + i * sz * 1.15
        d.text((x, 1450 - (sz - 150) / 2), ch, font=font(ch, sz), fill=PAPER + (int(255 * a),), stroke_width=6, stroke_fill=INK + (int(255 * a),))
    b = clamp((t - 29.1) / .4)
    for i, ch in enumerate('一念江湖'):
        d.text((W / 2 - 2 * 66 + i * 66, 1660), ch, font=font(ch, 46), fill=(218, 183, 120, int(255 * b)), stroke_width=3, stroke_fill=INK + (int(255 * b),))
    c.paste(L, (0, 0), L)
    if t > DUR - .35: flash(c, 1 - (DUR - t) / .35 * 0 + 0, color=(0, 0, 0)) if False else None
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:   # stills at given times
        for s in sys.argv[1:]:
            t = float(s); canvas = Image.new('RGB', (W, H), PAPER)
            for pn in P:
                if pn.active(t): pn.render(canvas, t)
            for o in O: canvas = o(canvas, t) or canvas
            canvas.resize((270, 480)).save(f'c-{s}.png')
    else:
        render(P, O, 'silent30.mp4', DUR); print('video done')
