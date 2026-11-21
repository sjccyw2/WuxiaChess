# Sound bed for the 45 s cut, following its arc: a quiet start, a hit on the eyes, awe, mystery,
# the clash, the eagle, silence at 「咦」, a low bell under 求敗's name, a lift on the invitation,
# a comic pause, the three stones and a last low hit under the title. All synthesised; a placeholder.
import numpy as np, wave
SR, DUR = 44100, 45.0
n = int(SR * DUR); t = np.arange(n) / SR
rng = np.random.default_rng(11)
def env(points):
    xs, ys = zip(*points); return np.interp(t, xs, ys)
drone = (0.09 * np.sin(2 * np.pi * 55 * t) + 0.04 * np.sin(2 * np.pi * 82.4 * t) + 0.02 * np.sin(2 * np.pi * 110 * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * .11 * t))
mix = drone * env([(0, 0), (2, .7), (4.2, .8), (6.5, 1), (11, 1), (21, 1), (23.6, .25), (27.9, .2), (28.6, .9), (34, 1), (39.4, .9), (41.5, 1), (44, 1), (45, 0)])
def add(at, sig, gain=1.0):
    i = int(at * SR); m = min(len(sig), n - i)
    if m > 0: mix[i:i + m] += gain * sig[:m]
def pluck(freq, d=2.6, amp=.3):
    N = int(SR / freq); buf = rng.uniform(-1, 1, N); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % N]; buf[i % N] = 0.4975 * (buf[i % N] + buf[(i + 1) % N])
    return amp * out * np.exp(-np.arange(len(out)) / SR * 1.2)
def bell(freq, d=5.0, amp=.35):
    tt = np.arange(int(d * SR)) / SR
    parts = [(1, 1), (2.01, .5), (2.76, .35), (5.4, .15)]
    return amp * sum(a * np.sin(2 * np.pi * freq * r * tt) * np.exp(-tt * (0.6 + r * .35)) for r, a in parts)
def whoosh(d=.35, amp=.25):
    m = int(d * SR); x = np.convolve(rng.standard_normal(m), np.ones(30) / 30, 'same')
    return amp * 6 * x * np.sin(np.pi * np.arange(m) / m) ** 2
def thump(d=.6, amp=.85):
    m = int(d * SR); tt = np.arange(m) / SR; return amp * np.sin(2 * np.pi * (72 - 34 * tt / d) * tt) * np.exp(-tt * 7)
def click(amp=.55):
    m = int(.09 * SR); tt = np.arange(m) / SR
    return amp * (np.sin(2 * np.pi * 2300 * tt) + .5 * np.sin(2 * np.pi * 3700 * tt)) * np.exp(-tt * 65)
F = {'G3': 196.0, 'A3': 220.0, 'D4': 293.66, 'E4': 329.63, 'G4': 392.0, 'A4': 440.0, 'B4': 493.88, 'D5': 587.33, 'E5': 659.25}
notes = [(0.8, 'A3'), (2.6, 'E4'),                                   # asleep: sparse
         (6.6, 'D4'), (7.6, 'E4'), (8.8, 'G4'), (10.2, 'A4'),         # the valley: rising
         (11.2, 'G4'), (12.4, 'E4'), (13.6, 'D4'),                    # the old man: mystery
         (14.4, 'A4'), (14.95, 'B4'), (16.0, 'G4'),                    # the board
         (21.4, 'E4'), (22.6, 'D4'),                                   # lost
         (35.6, 'E4'), (35.98, 'G4'), (36.36, 'E4'), (36.74, 'A4'), (37.12, 'G4'), (37.5, 'B4'),   # his hands, fast
         (39.4, 'G4'), (40.2, 'A4'), (40.9, 'B4'),                     # the invitation lifts
         (41.55, 'A4'), (41.6, 'E5'), (43.5, 'A3'), (43.55, 'E4'), (43.6, 'A4')]
for at, nm in notes: add(at, pluck(F[nm]))
for at in (4.1, 6.4, 10.9, 14.3, 17.1, 18.6, 21.1, 26.5, 34.3, 38.5, 41.4): add(at, whoosh(amp=.22 if at not in (4.1, 17.1, 18.6) else .32))
for at in (4.2, 17.2): add(at, thump())
add(18.7, thump(.45, .55))
add(41.55, thump(.5, .6))
add(14.95, click(.5)); add(14.98, whoosh(.2, .3))
add(23.6, click(.25))                         # the stone stops in his fingers: 「咦」
add(28.6, bell(110, 6, .32)); add(31.6, bell(146.8, 6, .22))
for k in range(8): add(35.6 + k * .38, click(.18))   # stones set down, fast, while the camera snaps   # gravity under 罷了 and his name
add(41.55, click())
add(43.9, thump(1.4, .7))
mix = np.tanh(mix * 1.2) * .85
with wave.open('sound45.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('sound done')
