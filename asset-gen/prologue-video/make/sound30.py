# Sound bed for the 30 s cut: a drone, plucked-string notes on a pentatonic scale (Karplus-Strong),
# a whoosh on each panel entrance, thumps on impacts, the stone clicks, a low hit under the title.
import numpy as np, wave
SR, DUR = 44100, 30.0
n = int(SR * DUR); t = np.arange(n) / SR
rng = np.random.default_rng(7)
mix = 0.09 * np.sin(2 * np.pi * 55 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * .15 * t)) + 0.045 * np.sin(2 * np.pi * 82.4 * t)
mix *= np.clip(t / 1.5, 0, 1)
def add(at, sig, gain=1.0):
    i = int(at * SR); m = min(len(sig), n - i)
    if m > 0: mix[i:i + m] += gain * sig[:m]
def pluck(freq, d=2.2, amp=.32):
    N = int(SR / freq); buf = rng.uniform(-1, 1, N); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % N]; buf[i % N] = 0.497 * (buf[i % N] + buf[(i + 1) % N])
    return amp * out * np.exp(-np.arange(len(out)) / SR * 1.4)
def whoosh(d=.32, amp=.3):
    m = int(d * SR); x = np.convolve(rng.standard_normal(m), np.ones(30) / 30, 'same')
    return amp * 6 * x * np.sin(np.pi * np.arange(m) / m) ** 2
def thump(d=.5, amp=.8):
    m = int(d * SR); tt = np.arange(m) / SR; return amp * np.sin(2 * np.pi * (72 - 34 * tt / d) * tt) * np.exp(-tt * 8)
def click(amp=.55):
    m = int(.09 * SR); tt = np.arange(m) / SR
    return amp * (np.sin(2 * np.pi * 2300 * tt) + .5 * np.sin(2 * np.pi * 3700 * tt)) * np.exp(-tt * 65)
D = {'D4': 293.66, 'E4': 329.63, 'G4': 392.0, 'A4': 440.0, 'B4': 493.88, 'D5': 587.33, 'E5': 659.25, 'A3': 220.0, 'G3': 196.0}
melody = [(0.4, 'A3'), (2.0, 'E4'), (3.4, 'D4'), (4.6, 'E4'), (5.4, 'G4'), (6.2, 'A4'), (7.4, 'G4'), (8.4, 'B4'), (10.0, 'E4'),
          (11.2, 'D4'), (12.4, 'E4'), (13.0, 'A4'), (15.0, 'G4'), (16.2, 'E4'), (17.0, 'A3'), (17.05, 'E4'), (19.2, 'B4'), (20.6, 'D5'),
          (21.8, 'B4'), (22.8, 'A4'), (24.4, 'G4'), (25.6, 'E4'), (26.6, 'G4'), (27.4, 'A4'), (27.45, 'E5'), (28.7, 'A3'), (28.75, 'E4'), (28.8, 'A4')]
for at, note in melody: add(at, pluck(D[note]))
for at in (1.9, 3.35, 6.1, 8.3, 9.9, 11.1, 12.9, 14.9, 16.9, 19.1, 20.5, 22.7, 24.3, 25.5, 27.3): add(at, whoosh())
for at in (2.0, 10.0, 17.0, 19.2, 27.4): add(at, thump())
add(10.7, thump(.35, .5)); add(8.85, click(.4)); add(13.4, click(.3))
for at in (27.5, 27.75, 28.0): add(at, click())
add(28.7, thump(1.2, .9))
mix = np.tanh(mix * 1.25) * .85
mix *= np.clip((DUR - t) / .6, 0, 1)
with wave.open('sound30.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('sound done')
