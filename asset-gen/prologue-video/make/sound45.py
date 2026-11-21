# Soundtrack for the 45 s cut: one piece of music, the same tempo and mood throughout, under sound
# effects tied to what is on screen. Everything is synthesised here; no samples are used.
import numpy as np, wave
SR, DUR = 44100, 45.0
N = int(SR * DUR); T = np.arange(N) / SR
rng = np.random.default_rng(21)
music = np.zeros(N); sfx = np.zeros(N)
def add(buf, at, sig, gain=1.0):
    i = int(at * SR); m = min(len(sig), N - i)
    if m > 0 and i >= 0: buf[i:i + m] += gain * sig[:m]

# ---------- instruments ----------
from scipy.signal import butter, sosfilt
def band(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'highpass', fs=SR, output='sos'), x)
def lowp(x, f): return sosfilt(butter(2, f, 'lowpass', fs=SR, output='sos'), x)
def pluck(freq, d=3.0, amp=.3, bright=.5):
    """Karplus-Strong string, computed a period at a time; a short body resonance makes it zither-like."""
    P = max(2, int(round(SR / freq - .5))); L = int(d * SR)   # the averaging adds half a sample of delay
    out = np.zeros(L + P + 1)
    out[:P] = rng.uniform(-1, 1, P) * (1 - bright) + np.sign(rng.uniform(-1, 1, P)) * bright * .3
    out[:P] -= out[:P].mean()   # no DC: it would muddy the note
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
# ---------- the music: A 羽 pentatonic (A C D E G), 72 bpm, one mood throughout ----------
BEAT = 60 / 72
NOTE = {'A2': 110.0, 'E3': 164.81, 'A3': 220.0, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.0, 'A4': 440.0, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25}
# (beat, note, length in beats) for a 4-bar phrase; two phrases alternate, the second answering the first
A = [(0, 'E4', 1.5), (1.5, 'D4', .5), (2, 'C4', 1), (3, 'D4', 1), (4, 'E4', 1), (5, 'G4', 1), (6, 'A4', 2),
     (8, 'G4', 1), (9, 'E4', .5), (9.5, 'D4', .5), (10, 'E4', 2), (12, 'C4', 1), (13, 'D4', 1), (14, 'A3', 2)]
B = [(0, 'A4', 1), (1, 'C5', 1), (2, 'D5', 1.5), (3.5, 'C5', .5), (4, 'A4', 2), (6, 'G4', 1), (7, 'E4', 1),
     (8, 'D4', 1), (9, 'E4', 1), (10, 'G4', 1.5), (11.5, 'E4', .5), (12, 'D4', 1), (13, 'C4', 1), (14, 'A3', 2)]
start = 0.6; beat = 0
phrases = [A, B, A, B, A, B]
for ph in phrases:
    for b, nm, ln in ph:
        at = start + (beat + b) * BEAT
        if at < DUR - 1: add(music, at, pluck(NOTE[nm], d=max(1.6, ln * BEAT * 2.4), amp=.26))
        if ln >= 2 and at + BEAT * .5 < DUR - 1:   # a soft octave answer on long notes
            add(music, at + BEAT * .5, pluck(NOTE[nm] / 2, d=2.0, amp=.1, bright=.2))
    for bar in range(4):
        add(music, start + (beat + bar * 4) * BEAT, drum(.16))
        add(music, start + (beat + bar * 4 + 2.5) * BEAT, drum(.07))
    beat += 16
drone = .045 * np.sin(2 * np.pi * 110 * T) + .03 * np.sin(2 * np.pi * 164.81 * T) + .015 * np.sin(2 * np.pi * 220.5 * T)
music += drone * (1 + .08 * np.sin(2 * np.pi * .2 * T))
music *= np.clip(T / 2.0, 0, 1) * np.clip((DUR - T) / 2.5, 0, 1)   # fade in and out only

# ---------- sound effects ----------
def env_seg(a, b, fa=.3, fb=.3):
    return np.clip((T - a) / fa, 0, 1) * np.clip((b - T) / fb, 0, 1)
# crickets while he sleeps; they stop when he wakes (連蟲聲也無)
crick = np.zeros(N)
for at in np.arange(0.2, 4.1, 0.55):
    at += rng.uniform(-.08, .08)
    for p in range(3):
        m = int(.025 * SR); t = np.arange(m) / SR
        add(crick, at + p * .045, np.sin(2 * np.pi * 4700 * t) * np.sin(np.pi * t / .025) ** 2, .075)
sfx += crick
# valley wind from his waking on; a distant waterfall while the valley is in view
wind = lowp(np.cumsum(rng.standard_normal(N)) * .002, 500)
wind = hp(wind, 60) * (0.6 + 0.4 * np.sin(2 * np.pi * .07 * T + 1) * np.sin(2 * np.pi * .031 * T))
sfx += wind * 1.8 * env_seg(4.6, 45, 2.0, 1.5)
sfx += band(rng.standard_normal(N), 250, 1800) * .012 * env_seg(6.5, 17.2, 1.5, 1.2)
# a cloth rustle as his eyes open
def rustle(d=.5, amp=.08):
    m = int(d * SR); return amp * band(rng.standard_normal(m), 1500, 6000) * np.sin(np.pi * np.arange(m) / m) ** 1.5
add(sfx, 4.25, rustle())
# go stones on a stone board
def stone(amp=.32, pitch=1.0):
    m = int(.12 * SR); t = np.arange(m) / SR
    return amp * (np.sin(2 * np.pi * 2400 * pitch * t) * .7 + np.sin(2 * np.pi * 3650 * pitch * t) * .4 + band(rng.standard_normal(m), 1500, 7000) * .6) * np.exp(-t * 70)
for i, at in enumerate((11.9, 12.9, 13.7)): add(sfx, at, stone(.22, 1.0 if i % 2 else 1.08))
# blades: one ringing clash on 「鏘」, then smaller ones as the fight goes on
def clash(amp=.35, d=1.6):
    m = int(d * SR); t = np.arange(m) / SR
    parts = [(1180, 1), (1872, .7), (2937, .55), (4215, .4), (5630, .25)]
    ring = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * (2.5 + f / 2500)) for f, a in parts)
    hit = band(rng.standard_normal(m), 2000, 9000) * np.exp(-t * 45)
    return amp * (ring * .6 + hit)
add(sfx, 14.95, clash(.24)); add(sfx, 15.7, clash(.1, 1.0)); add(sfx, 16.5, clash(.075, .8))
# the eagle: wing beats and a hoarse croak
def flap(amp=.3):
    m = int(.16 * SR); t = np.arange(m) / SR
    return amp * lowp(rng.standard_normal(m), 900) * np.exp(-((t - .04) / .035) ** 2)
for at in (17.15, 17.35, 17.55): add(sfx, at, flap())
m = int(.6 * SR); t = np.arange(m) / SR
f = 340 - 120 * t / .6
croak = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 + rng.standard_normal(m) * .5
croak = band(croak, 500, 2600) * np.sin(np.pi * t / .6) ** .8 * (1 + .5 * np.sin(2 * np.pi * 28 * t))
add(sfx, 17.4, croak, .12)
# the youth: a scuff and a stumble on gravel when startled, footsteps when lost
def gravel(d=.35, amp=.16):
    m = int(d * SR); x = np.zeros(m)
    idx = rng.integers(0, m, int(d * 900)); x[idx] = rng.uniform(-1, 1, len(idx))
    return amp * hp(np.convolve(x, np.exp(-np.arange(60) / 8), 'same'), 800) * np.sin(np.pi * np.arange(m) / m)
def step(amp=.2):
    m = int(.18 * SR); t = np.arange(m) / SR
    return amp * (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 30)) + gravel(.18, amp * .6)
add(sfx, 18.75, gravel(.45, .22)); add(sfx, 18.95, step(.22)); add(sfx, 19.25, step(.18))
for at in (21.5, 22.05, 22.6): add(sfx, at, step(.14))
add(sfx, 23.45, stone(.18))   # the last stone he set down before he looked up
# his hands at speed: a run of stones, in time with the camera
for k in range(8): add(sfx, 35.6 + k * .38, stone(.2, 1.0 if k % 2 else 1.1))
# the box: scraped across the stone table, landing hard, the stones rattling inside
m = int(2.4 * SR); t = np.arange(m) / SR
scrape = band(rng.standard_normal(m), 300, 2400) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * t + rng.uniform(0, 6)))) * np.clip(t / .4, 0, 1)
add(sfx, 39.1, scrape, .07)
m = int(.5 * SR); t = np.arange(m) / SR
knock = (np.sin(2 * np.pi * 160 * t) * np.exp(-t * 18) * .8 + band(rng.standard_normal(m), 600, 5000) * np.exp(-t * 55)) * .45
add(sfx, 41.55, knock)
for k in range(6): add(sfx, 41.62 + k * .05 + rng.uniform(0, .02), stone(.07, rng.uniform(.9, 1.3)))
sfx *= np.clip((DUR - T) / 1.0, 0, 1)

mix = music * 1.0 + sfx * 1.0
mix = np.tanh(mix * 1.1) * .9
st = np.stack([mix, mix], axis=1)
with wave.open('sound45.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
for name, buf in (('music', music), ('sfx', sfx), ('mix', mix)):
    print(name, 'peak', round(float(np.abs(buf).max()), 3), 'rms', round(float(np.sqrt((buf ** 2).mean())), 4))
