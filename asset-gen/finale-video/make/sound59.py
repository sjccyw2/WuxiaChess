# Soundtrack for the 59 s ending film, in the manner of the prologue's sound45.py: the same plucked
# string, hand drum and drone (A 羽 pentatonic), and sound effects only for what is on screen.
# Everything is synthesised here; no samples and no voices. Unlike the prologue's one steady piece,
# this one follows the story, calmer and more final: quiet while he lets go, a light step for 韋小寶,
# silence into the hit, a slow swell as he leaves, an accent as the boy's eyes open, the prologue's
# own tune (lighter) for the morning, then a low bell with a long tail on the name.
import numpy as np, wave
from scipy.signal import butter, sosfilt
from timeline import DUR, T as CUE
SR = 44100
N = int(SR * DUR); T = np.arange(N) / SR
rng = np.random.default_rng(59)
music = np.zeros(N); sfx = np.zeros(N)
def add(buf, at, sig, gain=1.0):
    i = int(at * SR); m = min(len(sig), N - i)
    if m > 0 and i >= 0: buf[i:i + m] += gain * sig[:m]

# ---------- instruments (the prologue's) ----------
def band(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'highpass', fs=SR, output='sos'), x)
def lowp(x, f): return sosfilt(butter(2, f, 'lowpass', fs=SR, output='sos'), x)
def pluck(freq, d=3.0, amp=.3, bright=.5):
    """Karplus-Strong string, computed a period at a time; a short body resonance makes it zither-like."""
    P = max(2, int(round(SR / freq - .5))); L = int(d * SR)
    out = np.zeros(L + P + 1)
    out[:P] = rng.uniform(-1, 1, P) * (1 - bright) + np.sign(rng.uniform(-1, 1, P)) * bright * .3
    out[:P] -= out[:P].mean()
    k = 0.4985
    for s in range(P, L, P):
        e = min(s + P, L)
        prev = out[s - P:e - P + 1]
        out[s:e] = k * (prev[:e - s] + prev[1:e - s + 1])
    x = out[:L] * np.exp(-np.arange(L) / SR * 1.1)
    body = np.convolve(x, np.exp(-np.arange(400) / 60) * np.sin(np.arange(400) * 2 * np.pi * 180 / SR), 'same') * .02
    return amp * hp(x + body, 50)
def drum(amp=.25):
    m = int(.45 * SR); t = np.arange(m) / SR
    return amp * (np.sin(2 * np.pi * (95 - 40 * t) * t) * np.exp(-t * 9) + .15 * rng.standard_normal(m) * np.exp(-t * 60))
def bell(f0=110.0, d=6.0, amp=.3):
    """A low temple bell: a soft mallet, then inharmonic partials that die away one by one, the hum last."""
    m = int(d * SR); t = np.arange(m) / SR
    parts = [(.5, .5, .35), (1, 1, .55), (1.003, .5, .55), (2.0, .55, .9), (2.4, .32, 1.2), (3.0, .26, 1.6), (4.1, .16, 2.4), (5.4, .09, 3.2), (6.8, .05, 4.2)]
    ring = sum(a * np.sin(2 * np.pi * f0 * r * t + i) * np.exp(-t * k) for i, (r, a, k) in enumerate(parts))
    mallet = lowp(rng.standard_normal(m), 500) * np.exp(-t * 40) * 1.5
    return amp * (ring * (1 - np.exp(-t * 180)) + mallet) / 2.2
def chime(freq, amp=.04, d=.9):
    """A small clear ping: a stone lighting."""
    m = int(d * SR); t = np.arange(m) / SR
    return amp * (np.sin(2 * np.pi * freq * t) + .3 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 9)) * np.exp(-t * 5.5) * (1 - np.exp(-t * 400))

NOTE = {'A2': 110.0, 'E3': 164.81, 'A3': 220.0, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.0, 'A4': 440.0, 'C5': 523.25,
        'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.0, 'C6': 1046.5, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98, 'A6': 1760.0}
# The prologue's two phrases (beat, note, length in beats); the second answers the first.
A = [(0, 'E4', 1.5), (1.5, 'D4', .5), (2, 'C4', 1), (3, 'D4', 1), (4, 'E4', 1), (5, 'G4', 1), (6, 'A4', 2),
     (8, 'G4', 1), (9, 'E4', .5), (9.5, 'D4', .5), (10, 'E4', 2), (12, 'C4', 1), (13, 'D4', 1), (14, 'A3', 2)]
B = [(0, 'A4', 1), (1, 'C5', 1), (2, 'D5', 1.5), (3.5, 'C5', .5), (4, 'A4', 2)]
def play(phrase, start, beat, until, amp=.22, octave=False, ring=2.4):
    for b, nm, ln in phrase:
        at = start + b * beat
        if at >= until: continue
        add(music, at, pluck(NOTE[nm], d=max(1.6, ln * beat * ring), amp=amp))
        if ln >= 2: add(music, at + beat * .5, pluck(NOTE[nm] / 2, d=2.0, amp=amp * .4, bright=.2))   # a soft octave answer on long notes
        if octave: add(music, at, pluck(NOTE[nm] * 2, d=1.2, amp=amp * .3, bright=.6))                # an octave above: morning light
def stop(at, d=.25): music[:] *= np.clip((at - T) / d, 0, 1)   # cuts off everything played so far (later notes are added after)
def seg(a, b, fa=.3, fb=.3): return np.clip((T - a) / fa, 0, 1) * np.clip((b - T) / fb, 0, 1)

# 1-5  quiet: the prologue's tune at a slower walk (60 bpm), no drum
play(A, 0.8, 1.0, CUE['f5'] - .3, amp=.2)
play(B, 16.8, 1.0, CUE['f5'] - .6, amp=.17)
# 6    a light step for 韋小寶: short notes at 96 bpm, a tapped drum
STEP = 60 / 96; s6 = CUE['f5'] + .35
for b, nm in [(0, 'G4'), (.5, 'A4'), (1, 'C5'), (1.5, 'A4'), (2, 'G4'), (2.5, 'E4'), (3, 'G4'), (4, 'A4'), (4.5, 'C5'), (5, 'D5'), (5.5, 'C5'), (6, 'A4')]:
    add(music, s6 + b * STEP, pluck(NOTE[nm], d=.9, amp=.17, bright=.6))
for b in range(7):
    add(music, s6 + b * STEP, drum(.07)); add(music, s6 + (b + .5) * STEP, drum(.035))
# 7    silence: the music drops away at the cut; the hit itself is one soft drum and one far, high string
stop(CUE['f6'])
add(music, CUE['eyes'], drum(.2)); add(music, CUE['eyes'] + .02, pluck(NOTE['E5'], d=3.2, amp=.07, bright=.2))
# 8    a slow swell as he leaves: strings climbing out of the drone
climb = ['A2', 'E3', 'A3', 'C4', 'E4', 'A4', 'C5', 'E5', 'A5']
for i, nm in enumerate(climb):
    at = CUE['f7'] + .3 + i * .68
    add(music, at, pluck(NOTE[nm], d=3.4, amp=.13 + .014 * i, bright=.35))
# 9    the accent: his eyes open
stop(CUE['f8'], .05)                                           # the swell stops dead on the cut
tail_cut = np.clip((CUE['f8'] - T) / .05, 0, 1)
add(music, CUE['f8'], drum(.36))
for i, nm in enumerate(('A3', 'E4', 'A4', 'E5')): add(music, CUE['f8'] + i * .018, pluck(NOTE[nm], d=3.0, amp=.24, bright=.6))
# 10-11 morning: the prologue's tune at its own pace (72 bpm) with the hand drum, an octave of light on top
BEAT = 60 / 72; s10 = CUE['f8'] + 1.3
play(A, s10, BEAT, CUE['f11'] - .3, amp=.2, octave=True)
for bar in range(4):
    for b, a in ((0, .13), (2.5, .06)):
        at = s10 + (bar * 4 + b) * BEAT
        if at < CUE['f11'] - .4: add(music, at, drum(a))
add(music, CUE['f10'], drum(.26))                               # the jolt: the eagle
# 12   gravity: three falling notes, then the low bell, left to ring to the end
for at, nm in ((CUE['f11'] + .5, 'E4'), (CUE['f11'] + 1.6, 'D4'), (CUE['f11'] + 2.7, 'A3')):
    add(music, at, pluck(NOTE[nm], d=3.0, amp=.17, bright=.3))
add(music, CUE['bell'], bell(110.0, d=DUR - CUE['bell'], amp=.34))
# the drone under it all, shaped by the same sections
drone = .045 * np.sin(2 * np.pi * 110 * T) + .03 * np.sin(2 * np.pi * 164.81 * T) + .015 * np.sin(2 * np.pi * 220.5 * T)
swell = np.clip((T - CUE['f7']) / (CUE['f8'] - CUE['f7']), 0, 1) ** 1.6 * (T < CUE['f8'])
level = (seg(0, CUE['f6'] - .2, 2.0, .4) * .9 + swell * 2.0 * tail_cut
         + seg(CUE['f8'] + .8, CUE['f11'], 1.5, 1.0) * .6 + seg(CUE['f11'], DUR + 1, 1.5, 1) * .9)
music += drone * level * (1 + .08 * np.sin(2 * np.pi * .2 * T))
music += (.03 * np.sin(2 * np.pi * 329.63 * T) + .02 * np.sin(2 * np.pi * 440.4 * T)) * swell * tail_cut   # the swell opens upward
music *= np.clip(T / 2.0, 0, 1) * np.clip((DUR - T) / 1.4, 0, 1)

# ---------- sound effects ----------
def rustle(d=.5, amp=.08):
    m = int(d * SR); return amp * band(rng.standard_normal(m), 1500, 6000) * np.sin(np.pi * np.arange(m) / m) ** 1.5
def gravel(d=.35, amp=.16):
    m = int(d * SR); x = np.zeros(m)
    idx = rng.integers(0, m, int(d * 900)); x[idx] = rng.uniform(-1, 1, len(idx))
    return amp * hp(np.convolve(x, np.exp(-np.arange(60) / 8), 'same'), 800) * np.sin(np.pi * np.arange(m) / m)
def step(amp=.2):
    m = int(.18 * SR); t = np.arange(m) / SR
    return amp * (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 30)) + gravel(.18, amp * .6)
def flap(amp=.3):
    m = int(.16 * SR); t = np.arange(m) / SR
    return amp * lowp(rng.standard_normal(m), 900) * np.exp(-((t - .04) / .035) ** 2)
def swish(d=.3, amp=.12):
    """A blade through air: a short breath of noise whose pitch rises and falls."""
    m = int(d * SR); x = rng.standard_normal(m); u = np.arange(m) / m
    lo = band(x, 500, 1400); hi = band(x, 1800, 5200)
    return amp * (lo * (1 - np.sin(np.pi * u)) * .5 + hi * np.sin(np.pi * u)) * np.sin(np.pi * u) ** 1.2
def chirp(amp=.035):
    m = int(rng.uniform(.05, .09) * SR); u = np.arange(m) / m
    f = rng.uniform(2800, 4200) + rng.uniform(600, 1500) * np.sin(np.pi * u * rng.uniform(.5, 1.5))
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * u) ** 2
# the valley: wind from the first frame until the boy wakes, thinner in the silence, rising as the old man leaves
wind = lowp(np.cumsum(rng.standard_normal(N)) * .002, 500)
wind = hp(wind, 60) * (0.6 + 0.4 * np.sin(2 * np.pi * .07 * T + 1) * np.sin(2 * np.pi * .031 * T))
wind_level = (seg(0, CUE['f8'], 1.5, .06) * (1.3 - .5 * seg(CUE['f6'], CUE['f7'], .4, 1.0))
              + 1.1 * np.clip((T - CUE['f7']) / 5.5, 0, 1) * (T < CUE['f8']) * tail_cut
              + seg(CUE['f8'] + .6, DUR, 2.0, 1.5) * .35)        # a morning breeze afterwards
sfx += wind * wind_level
# the twig laid on the stone: one small dry tick
m = int(.09 * SR); t = np.arange(m) / SR
add(sfx, CUE['f2'] + 2.1, (band(rng.standard_normal(m), 900, 5200) * np.exp(-t * 70) + .4 * np.sin(2 * np.pi * 640 * t) * np.exp(-t * 45)) * .11)
# the stones lighting one by one, then the box: small clear pings, climbing
ladder = ['A5', 'C6', 'D6', 'E6', 'G6', 'A6']
at = CUE['lit'] + .1; i = 0
while at < CUE['f4'] - .5:
    add(sfx, at, chime(NOTE[ladder[int(rng.integers(0, 3)) + min(3, i // 5)]], amp=.03 + .008 * rng.random()))
    at += rng.uniform(.14, .34); i += 1
# 韋小寶 walking out: unhurried steps on gravel in time with his tune, a melon seed cracked between the teeth
for b in range(7): add(sfx, s6 + b * STEP + .02, step(.11 if b % 2 else .13))
for at in (CUE['f5'] + 1.3, CUE['f5'] + 3.45):
    m = int(.03 * SR); t = np.arange(m) / SR
    add(sfx, at, band(rng.standard_normal(m), 2500, 9000) * np.exp(-t * 160) * .1)
# the old man leaving: his great sleeves on the wind
for at in (CUE['f7'] + 1.1, CUE['f7'] + 2.4, CUE['f7'] + 4.0): add(sfx, at, np.repeat(flap(.1), 3)[:int(.4 * SR)])
# the boy wakes: the quilt
add(sfx, CUE['f8'] + .05, rustle())
# morning: small birds, from his waking to the end
at = CUE['f8'] + 1.0
while at < DUR - 2.2:
    for k in range(int(rng.integers(2, 5))): add(sfx, at + k * rng.uniform(.09, .13), chirp(rng.uniform(.02, .04)))
    at += rng.uniform(.9, 2.3)
# sword practice: three cuts through the air, a bare foot turning in the dust
for at in (CUE['f9'] + .75, CUE['f9'] + 2.2, CUE['f9'] + 3.6):
    add(sfx, at, swish()); add(sfx, at + .18, gravel(.3, .07))
# the eagle on the crag: one settling of its wings (it makes no other sound)
for at in (CUE['f10'] - .03, CUE['f10'] + .17): add(sfx, at, flap(.26))
sfx *= np.clip((DUR - T) / 1.4, 0, 1)

mix = music * 1.0 + sfx * 1.0
peak_in = float(np.abs(mix).max())
mix = np.tanh(mix * 1.1) * .9
st = np.stack([mix, mix], axis=1)
with wave.open('sound59.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
for name, buf in (('music', music), ('sfx', sfx), ('mix', mix)):
    print(name, 'peak', round(float(np.abs(buf).max()), 3), 'rms', round(float(np.sqrt((buf ** 2).mean())), 4))
print('peak before the soft limiter', round(peak_in, 3), '(the limiter is close to linear below about 0.5)')
