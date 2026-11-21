# Comic-page compositor for the prologue cut: panels whose shapes animate (slanted entrances that
# expand to the full frame, halftone-dot wipes, an iris), a camera that moves "on twos", print
# misregistration on impacts, burst lines, sound-effect lettering, narration boxes and speech
# balloons with vertical text in the game's serif. Frames are piped to ffmpeg.
import math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageChops
from fontTools.ttLib import TTFont
W, H, FPS = 1080, 1920, 30
STEP = 2 / FPS   # camera moves on twos
INK, PAPER = (12, 12, 14), (246, 240, 226)
FONT_FILES = [('river-serif.ttf', 0), ('extra-serif.ttf', 0), ('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 0)]
CMAPS = [TTFont(f, fontNumber=i).getBestCmap() for f, i in FONT_FILES]
_fc = {}
def font(ch, size):
    for k, (f, i) in enumerate(FONT_FILES):
        if ord(ch) in CMAPS[k]:
            key = (k, size)
            if key not in _fc: _fc[key] = ImageFont.truetype(f, size, index=i)
            return _fc[key]
    return font('口', size)
clamp = lambda x, a=0, b=1: min(b, max(a, x))
ease = lambda t: 0.5 - 0.5 * math.cos(math.pi * clamp(t))
out3 = lambda t: 1 - (1 - clamp(t)) ** 3
out5 = lambda t: 1 - (1 - clamp(t)) ** 5
lerp = lambda a, b, k: a + (b - a) * k
FULL = [(-40, -40), (W + 40, -40), (W + 40, H + 40), (-40, H + 40)]

def interp(keys, t, curve=out3):
    """keys: [(time, value)], value a number, tuple or list of points."""
    if t <= keys[0][0]: return keys[0][1]
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t < t1:
            k = curve((t - t0) / (t1 - t0))
            if isinstance(a, (int, float)): return lerp(a, b, k)
            if isinstance(a[0], (int, float)): return tuple(lerp(x, y, k) for x, y in zip(a, b))
            return [(lerp(p[0], q[0], k), lerp(p[1], q[1], k)) for p, q in zip(a, b)]
    return keys[-1][1]

class Panel:
    """An image shown through an animated shape. cam(u) -> (zoom, cx, cy) over the panel's life
    u in [0, 1]; poly: keyframes of four screen points; mask 'poly', 'dots' or 'iris'."""
    def __init__(self, src, t_in, t_out, cam, poly=None, mask='poly', reveal=None, center=(W / 2, H / 2), border=True, shake=None, anchor=None):
        self.im = Image.open(src).convert('RGB')
        self.t_in, self.t_out, self.cam = t_in, t_out, cam
        self.poly = poly or [(t_in, FULL)]
        self.mask, self.reveal, self.center, self.border, self.shake = mask, reveal, center, border, shake
        self.anchor = anchor   # ((image x, image y), (screen x, screen y)): pin that point of the picture to that spot
    def active(self, t): return self.t_in <= t < self.t_out
    def full_at(self):
        """When this panel first covers the whole frame (None if it never does: a lower page panel)."""
        if self.mask == 'poly':
            return self.poly[-1][0] if self.poly[-1][1] is FULL else None
        t = self.t_in
        while t < self.t_in + 5 and self.reveal(t) < .999: t += 1 / FPS
        return t
    def render(self, canvas, t):
        tc = math.floor(t / STEP) * STEP
        u = (tc - self.t_in) / max(1e-6, self.t_out - self.t_in)
        pts = interp(self.poly, t)
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        bx0, by0, bx1, by1 = max(-40, min(xs)), max(-40, min(ys)), min(W + 40, max(xs)), min(H + 40, max(ys))
        bw, bh = int(bx1 - bx0), int(by1 - by0)
        if bw < 4 or bh < 4: return
        zoom, cx, cy = self.cam(u)
        iw, ih = self.im.size
        cw = iw / zoom; ch = cw * bh / bw
        if ch > ih: ch = ih / zoom * 1.0; cw = ch * bw / bh
        if cw > iw: cw = iw; ch = cw * bh / bw
        sx = sy = 0
        if self.shake:
            a = self.shake(t)
            sx, sy = a * math.sin(t * 93) * 26, a * math.cos(t * 71) * 26
        x = clamp((iw - cw) * cx + sx, 0, iw - cw); y = clamp((ih - ch) * cy + sy, 0, ih - ch)
        if self.anchor:
            (ix, iy), (px, py) = self.anchor; k = cw / bw
            x = clamp(ix - (px - bx0) * k + sx, 0, iw - cw); y = clamp(iy - (py - by0) * k + sy, 0, ih - ch)
        tile = self.im.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((bw, bh), Image.BILINEAR)
        m = Image.new('L', (W + 80, H + 80))
        d = ImageDraw.Draw(m)
        off = lambda p: (p[0] + 40, p[1] + 40)
        if self.mask == 'poly':
            d.polygon([off(p) for p in pts], fill=255)
        elif self.mask == 'dots':
            k = self.reveal(t); sp = 60
            r = k * sp * 0.75
            if r > 0.5:
                for gy in range(-sp, H + 80 + sp, sp):
                    for gx in range(-sp, W + 80 + sp, sp):
                        ox = (gy // sp % 2) * sp / 2
                        dist = math.hypot(gx - W / 2 - 40, gy - H / 2 - 40) / (H / 2)
                        rr = r * clamp(1.6 - dist * 0.6 + k * 0.6, 0, 1.4)
                        d.ellipse((gx + ox - rr, gy - rr, gx + ox + rr, gy + rr), fill=255)
        elif self.mask == 'fade':
            d.rectangle((0, 0, W + 80, H + 80), fill=int(255 * clamp(self.reveal(t))))
        elif self.mask == 'iris':
            k = self.reveal(t); R = k * math.hypot(W, H)
            cx0, cy0 = self.center
            d.ellipse((cx0 + 40 - R, cy0 + 40 - R, cx0 + 40 + R, cy0 + 40 + R), fill=255)
        mask = m.crop((40 + int(bx0), 40 + int(by0), 40 + int(bx0) + bw, 40 + int(by0) + bh))
        canvas.paste(tile, (int(bx0), int(by0)), mask)
        if self.border and self.mask == 'poly' and (max(xs) - min(xs) < W + 60 or max(ys) - min(ys) < H + 60):
            d2 = ImageDraw.Draw(canvas)
            d2.line(pts + [pts[0]], fill=PAPER, width=22, joint='curve')
            d2.line(pts + [pts[0]], fill=INK, width=9, joint='curve')

# ---------- overlays ----------
def misregister(canvas, k):
    if k <= 0: return canvas
    r, g, b = canvas.split()
    s = int(14 * k)
    r = ImageChops.offset(r, s, 0); b = ImageChops.offset(b, -s, int(s * .4))
    return Image.merge('RGB', (r, g, b))

def burst(canvas, center, k, n=72, color=INK):
    if k <= 0: return
    d = ImageDraw.Draw(canvas); cx, cy = center
    rng = np.random.default_rng(int(center[0] + center[1]))
    for i in range(n):
        a = i / n * 2 * math.pi + rng.uniform(-.03, .03)
        r0 = lerp(H * .9, H * .28, k) + rng.uniform(0, 160); r1 = H * 1.2
        w = int(rng.uniform(3, 11) * k) + 1
        d.polygon([(cx + math.cos(a) * r0, cy + math.sin(a) * r0),
                   (cx + math.cos(a + .012) * r1, cy + math.sin(a + .012) * r1),
                   (cx + math.cos(a - .012) * r1, cy + math.sin(a - .012) * r1)], fill=color, outline=color, width=w)

def text_layer(size_wh):
    return Image.new('RGBA', size_wh), None

def sfx(canvas, text, center, size, k, rot=-8, fill=(236, 70, 50), stroke=INK):
    """Big sound-effect lettering that pops in (k: 0..1 life)."""
    if k <= 0 or k >= 1: return
    pop = out5(k / .18) * (1 + .25 * (1 - out3(k / .3)))
    fade = 1 - clamp((k - .8) / .2)
    sz = int(size * pop)
    if sz < 8: return
    L = Image.new('RGBA', (sz * len(text) + 120, sz + 120)); d = ImageDraw.Draw(L)
    for i, ch in enumerate(text):
        d.text((60 + i * sz, 40), ch, font=font(ch, sz), fill=fill + (int(255 * fade),), stroke_width=max(4, sz // 14), stroke_fill=stroke + (int(255 * fade),))
    L = L.rotate(rot, resample=Image.BICUBIC, expand=True)
    canvas.paste(L, (int(center[0] - L.width / 2), int(center[1] - L.height / 2)), L)

def vertical_columns(d, cols, x_right, y_top, size, fill, gap=1.06, col_gap=1.2):
    """Draws columns right to left, each top to bottom (traditional vertical text)."""
    for c, col in enumerate(cols):
        x = x_right - (c + 1) * size * col_gap
        for i, ch in enumerate(col):
            y = y_top + i * size * gap
            if ch in '。，、': d.text((x + size * .5, y - size * .22), ch, font=font(ch, size), fill=fill)
            elif ch in '？！': d.text((x, y), ch, font=font(ch, size), fill=fill)
            elif ch == '…': d.text((x + size * .1, y), '︙', font=font('︙', size), fill=fill)
            elif ch in '「': d.text((x, y), '﹁', font=font('﹁', size), fill=fill)
            elif ch in '」': d.text((x, y), '﹂', font=font('﹂', size), fill=fill)
            else: d.text((x, y), ch, font=font(ch, size), fill=fill)

def column_box(cols, size, gap=1.06, col_gap=1.2):
    return len(cols) * size * col_gap, max(len(c) for c in cols) * size * gap

def balloon(canvas, cols, center, tail, k, size=58, shout=False):
    if k <= 0 or k >= 1: return
    pop = out5(k / .12); fade = 1 - clamp((k - .9) / .1)
    bw, bh = column_box(cols, size)
    rx, ry = (bw / 2 + size * 1.05) * 1.18 * pop, (bh / 2 + size * .85) * 1.12 * pop
    cx, cy = center
    L = Image.new('RGBA', canvas.size); d = ImageDraw.Draw(L)
    a = int(255 * fade)
    if pop > .05:
        tx, ty = tail
        base = math.atan2(ty - cy, tx - cx)
        p1 = (cx + math.cos(base + .25) * rx * .8, cy + math.sin(base + .25) * ry * .8)
        p2 = (cx + math.cos(base - .25) * rx * .8, cy + math.sin(base - .25) * ry * .8)
        tip = (lerp(cx, tx, pop), lerp(cy, ty, pop))
        if shout:
            pts = []
            for i in range(28):
                ang = i / 28 * 2 * math.pi; rr = 1.0 if i % 2 == 0 else 0.82
                pts.append((cx + math.cos(ang) * rx * rr * 1.08, cy + math.sin(ang) * ry * rr * 1.08))
            d.polygon(pts, fill=PAPER + (a,), outline=INK + (a,), width=8)
        else:
            d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=PAPER + (a,), outline=INK + (a,), width=8)
        d.polygon([p1, tip, p2], fill=PAPER + (a,))
        d.line([p1, tip, p2], fill=INK + (a,), width=8)
        if not shout: d.ellipse((cx - rx + 4, cy - ry + 4, cx + rx - 4, cy + ry - 4), fill=PAPER + (a,))
    if pop > .85:
        vertical_columns(d, cols, cx + bw / 2 + size * .1, cy - bh / 2 + size * .05, size, INK + (a,))
    canvas.paste(L, (0, 0), L)

def narration(canvas, cols, x_right, y_top, k, size=54):
    if k <= 0 or k >= 1: return
    slide = out5(k / .1); fade = 1 - clamp((k - .9) / .1)
    bw, bh = column_box(cols, size)
    pad = size * .5
    x1 = x_right; x0 = x1 - bw - pad * 2 + size * .15
    y0 = y_top - (1 - slide) * 80
    L = Image.new('RGBA', canvas.size); d = ImageDraw.Draw(L); a = int(255 * fade * slide)
    d.rectangle((x0 + 10, y0 + 10, x1 + 10, y0 + bh + pad * 2 + 10), fill=INK + (a,))
    d.rectangle((x0, y0, x1, y0 + bh + pad * 2), fill=(250, 244, 228, a), outline=INK + (a,), width=6)
    vertical_columns(d, cols, x1 - pad + size * .1, y0 + pad, size, INK + (a,))
    canvas.paste(L, (0, 0), L)

def flash(canvas, k, color=(255, 252, 240)):
    if 0 < k < 1:
        canvas.paste(Image.new('RGB', canvas.size, color), (0, 0), Image.new('L', canvas.size, int(255 * (1 - k))))

def hold_until_covered(panels):
    """A picture stays on screen until the next panel that fills the frame has finished coming in,
    so a transition never shows the bare page behind it."""
    for i, pn in enumerate(panels):
        for nxt in panels[i + 1:]:
            full = nxt.full_at()
            if full is not None and nxt.t_in < pn.t_out + .5:
                pn.t_out = max(pn.t_out, full + 1 / FPS)
                break

def render(panels, overlays, out, dur):
    hold_until_covered(panels)
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
                         stdin=subprocess.PIPE)
    for n in range(int(round(dur * FPS))):
        t = n / FPS
        canvas = Image.new('RGB', (W, H), PAPER)
        for pn in panels:
            if pn.active(t): pn.render(canvas, t)
        for o in overlays:
            canvas = o(canvas, t) or canvas
        p.stdin.write(canvas.tobytes())
    p.stdin.close(); p.wait()

# ---------- Hong Kong comic lettering ----------
def _cell(d, ch, x, y, size, fill):
    """One character of vertical text, with punctuation placed for vertical setting."""
    if ch == '…':   # vertical ellipsis: three dots down the middle of the cell
        r = max(3, size * .07)
        for i in range(3):
            cy = y + size * (.22 + i * .28); cx = x + size * .5
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)
    elif ch in '。，、': d.text((x + size * .5, y - size * .22), ch, font=font(ch, size), fill=fill)
    else: d.text((x, y), ch, font=font(ch, size), fill=fill)

def columns_hk(d, cols, x_right, y_top, size, fill, gap=1.08, col_gap=1.25):
    for c, col in enumerate(cols):
        x = x_right - (c + 1) * size * col_gap + size * (col_gap - 1)
        for i, ch in enumerate(col):
            _cell(d, ch, x, y_top + i * size * gap, size, fill)

def box_hk(canvas, cols, x_right, y_top, k, size=50, dark=False, fade_in=.12):
    """港漫 narration box: a rectangle with a double rule, flush to a corner, vertical text."""
    if k <= 0 or k >= 1: return
    a = int(255 * min(out3(k / fade_in), 1 - clamp((k - .9) / .1)))
    bw = len(cols) * size * 1.25; bh = max(len(c) for c in cols) * size * 1.08
    pad = size * .45
    x1, y0 = x_right, y_top
    x0, y1 = x1 - bw - pad * 2 + size * .25, y0 + bh + pad * 2
    bg, fg = ((18, 18, 20), (244, 236, 216)) if dark else ((250, 245, 230), INK)
    L = Image.new('RGBA', canvas.size); d = ImageDraw.Draw(L)
    d.rectangle((x0, y0, x1, y1), fill=bg + (int(a * .94),), outline=INK + (a,), width=5)
    d.rectangle((x0 + 9, y0 + 9, x1 - 9, y1 - 9), outline=fg + (int(a * .8),), width=2)
    columns_hk(d, cols, x1 - pad + size * .05, y0 + pad, size, fg + (a,))
    canvas.paste(L, (0, 0), L)

def balloon_hk(canvas, cols, center, tail, k, size=54, shout=False, appear=.1):
    """Oval balloon with vertical text; the tail points at the speaker (or off the panel)."""
    if k <= 0 or k >= 1: return
    pop = out3(k / appear); a = int(255 * (1 - clamp((k - .92) / .08)))
    bw = len(cols) * size * 1.25; bh = max(len(c) for c in cols) * size * 1.08
    rx, ry = (bw / 2 + size * 1.0) * 1.15 * (.9 + .1 * pop), (bh / 2 + size * .8) * 1.1 * (.9 + .1 * pop)
    cx, cy = center; tx, ty = tail
    L = Image.new('RGBA', canvas.size); d = ImageDraw.Draw(L)
    al = int(a * pop)
    base = math.atan2(ty - cy, tx - cx)
    p1 = (cx + math.cos(base + .22) * rx * .82, cy + math.sin(base + .22) * ry * .82)
    p2 = (cx + math.cos(base - .22) * rx * .82, cy + math.sin(base - .22) * ry * .82)
    if shout:
        pts = [(cx + math.cos(i / 30 * 2 * math.pi) * rx * (1.1 if i % 2 else .94), cy + math.sin(i / 30 * 2 * math.pi) * ry * (1.1 if i % 2 else .94)) for i in range(30)]
        d.polygon(pts, fill=PAPER + (al,), outline=INK + (al,), width=6)
    else:
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=PAPER + (al,), outline=INK + (al,), width=6)
    d.polygon([p1, (tx, ty), p2], fill=PAPER + (al,)); d.line([p1, (tx, ty), p2], fill=INK + (al,), width=6)
    if not shout: d.ellipse((cx - rx + 4, cy - ry + 4, cx + rx - 4, cy + ry - 4), fill=PAPER + (al,))
    columns_hk(d, cols, cx + bw / 2 - size * .1, cy - bh / 2, size, INK + (al,))
    canvas.paste(L, (0, 0), L)

def sfx_hk(canvas, text, center, size, k, rot=-10, trail=(1, 0), fill=(250, 248, 238)):
    """港漫 sound effect: a heavy white character with a thick black outline and motion trails."""
    if k <= 0 or k >= 1: return
    pop = out5(k / .12); a = 1 - clamp((k - .75) / .25)
    sz = int(size * (1.15 - .15 * pop))
    L = Image.new('RGBA', (int(sz * len(text) * 1.1) + 240, sz + 240)); d = ImageDraw.Draw(L)
    for e in range(4, 0, -1):   # trails behind the stroke direction
        off = e * sz * .05
        for i, ch in enumerate(text):
            d.text((120 + i * sz * 1.05 - trail[0] * off, 100 - trail[1] * off), ch, font=font(ch, sz),
                   fill=INK + (int(70 * a / e),))
    for i, ch in enumerate(text):
        d.text((120 + i * sz * 1.05, 100), ch, font=font(ch, sz), fill=fill + (int(255 * a),),
               stroke_width=max(6, sz // 11), stroke_fill=INK + (int(255 * a),))
    L = L.rotate(rot, resample=Image.BICUBIC, expand=True)
    canvas.paste(L, (int(center[0] - L.width / 2), int(center[1] - L.height / 2)), L)

def name_card(canvas, name, lead, x_center, y_top, k, size=210):
    """lead may be '' for the name alone."""
    """A character's first naming, 港漫 fashion but calm: the name settles in, large and still."""
    if k <= 0 or k >= 1: return
    a = out3(k / .3) * (1 - clamp((k - .9) / .1))
    s = 1.04 - .04 * out3(k / .5)
    sz = int(size * s)
    L = Image.new('RGBA', canvas.size); d = ImageDraw.Draw(L)
    for i, ch in enumerate(name):
        d.text((x_center - sz / 2, y_top + i * sz * 1.02), ch, font=font(ch, sz), fill=(246, 240, 226, int(255 * a)),
               stroke_width=5, stroke_fill=(10, 10, 12, int(255 * a)))
    d.line((x_center - sz * .62, y_top + 10, x_center - sz * .62, y_top + len(name) * sz * 1.02 - 10), fill=(246, 240, 226, int(200 * a)), width=3)
    canvas.paste(L, (0, 0), L)
    if lead:   # an optional lead line above the name, in a small dark caption box
        box_hk(canvas, [lead], x_center + 50, y_top - 250, k / .9 if k < .9 else .999, size=40, dark=True, fade_in=.15)

def vignette(canvas, amount):
    if amount <= 0: return
    yy, xx = np.mgrid[0:H:8, 0:W:8]
    r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
    m = (np.clip(r - .55, 0, 1) / .9 * 255 * amount).clip(0, 255).astype(np.uint8)
    mask = Image.fromarray(m, 'L').resize((W, H), Image.BILINEAR)
    canvas.paste(Image.new('RGB', (W, H), (6, 6, 8)), (0, 0), mask)

def sfx_image(canvas, img, center, width, k, rot=0):
    """A painted sound effect (transparent PNG): slams in a little large, settles, then fades."""
    if k <= 0 or k >= 1: return
    pop = out5(k / .1); a = 1 - clamp((k - .7) / .3)
    w = int(width * (1.25 - .25 * pop)); h = int(img.height * w / img.width)
    im = img.resize((w, h), Image.LANCZOS)
    if rot: im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    if a < 1: im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    jit = (1 - clamp(k / .25)) * 10
    canvas.paste(im, (int(center[0] - im.width / 2 + jit * math.sin(k * 90)), int(center[1] - im.height / 2)), im)
