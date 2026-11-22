import { TAU, lerp, stone, moss, hash, pine } from './kit-12.js';

// The five fingers of 鐵掌山 near at hand: tall columns of bedded rock rising just behind the
// gate, close enough to stand in the low, wide and phone views where the far peaks never come
// on screen. Each is laid in strata that step back in ledges, rust and iron grey, fluted with
// ribs and gullies, mossy and pine-grown on its ledges, with a rounded tip like a fingertip.

// [x, z, height above the ground, breadth, lean]: the thumb set apart to the west, the middle
// finger tallest, the path climbing between the middle and the fourth.
const fingers = [
  [-4.4, -9.4, 3.8, 0.72, -0.25],
  [-2.3, -10.5, 5.8, 0.7, -0.1],
  [-0.55, -11.0, 7.2, 0.74, 0.0],
  [2.8, -10.8, 6.2, 0.7, 0.08],
  [4.7, -10.2, 4.6, 0.64, 0.2]
];

function finger(m, x, z, base, H, w, lean) {
  const r = m.rng,
    n = 10,
    spokes = Array.from({ length: n }, (_, i) => [
      (i / n) * TAU + r.range(-0.12, 0.12),
      // Fluted: ribs and gullies run up the column.
      i % 2 ? r.range(0.78, 0.9) : r.range(0.98, 1.12)
    ]),
    bands = [stone.dark, stone.mid, stone.warm, 0x525456, stone.rust, stone.mid];
  const ledges = [];
  let y = 0,
    k = 0,
    last = null;
  while (y < H - 0.01) {
    const h = Math.min(H - y, r.range(0.7, 1.15)),
      t0 = y / H,
      t1 = (y + h) / H;
    // The radius narrows slowly, then rounds off over the top fifth.
    const wide = (t) =>
      t < 0.8
        ? 1 - 0.22 * t
        : 0.824 * (0.25 + 0.75 * Math.sqrt(Math.max(0, 1 - ((t - 0.8) / 0.2) ** 2)));
    const ringAt = (t, out) =>
      spokes.map(([a, q]) => [
        x + Math.cos(a) * w * q * wide(t) * out + lean * t * t * w * 2,
        base + t * H,
        z + Math.sin(a) * w * q * wide(t) * out * 0.9
      ]);
    // Each bed juts a little at its foot and is inset at its head: a ledge between beds.
    const foot = last ?? ringAt(t0, 1.04),
      head = ringAt(t1, 0.97);
    const body = m.mix(bands[k % bands.length], 0xa8b0b0, 0.08 + 0.25 * t0),
      lit = m.mix(body, stone.pale, 0.3);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        shade = 0.84 + 0.16 * (i % 2) + 0.05 * Math.cos(i * 1.7 + k);
      m.face([foot[i], foot[j], head[j], head[i]], [body, body, lit, lit], shade);
    }
    if (t1 < 0.97) {
      // The ledge: a narrow shelf out to the next bed's foot, green with moss.
      const next = ringAt(t1, 1.04).map(([px, , pz]) => [px, base + t1 * H + 0.04, pz]);
      const shelf = m.mix(stone.pale, moss, 0.35 + 0.3 * hash(k + 0.5, x));
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        m.face([head[i], head[j], next[j], next[i]], shelf);
      }
      ledges.push([t1, next]);
      last = next;
    } else last = head;
    y += h;
    k++;
  }
  m.face([...last].reverse(), m.mix(stone.pale, moss, 0.3));
  return ledges;
}

// One finger standing on the mountain's foot, with stunted pines clinging to its ledges.
function standingFinger(m, ground, x, z, H, w, lean) {
  const r = m.rng,
    base = ground(x, z) - 0.7,
    ledges = finger(m, x, z, base, H + 0.7, w, lean);
  for (const [t, ring] of ledges) {
    if (t < 0.25 || t > 0.85 || r.next() < 0.6) continue;
    const i = Math.floor(r.range(0, ring.length)),
      [px, py, pz] = ring[i];
    // Rooted on the shelf, set in from its edge toward the column's face.
    pine(m, lerp(px, x, 0.15), py - 0.04, lerp(pz, z, 0.15), r.range(0.6, 1.1), {
      lean: r.range(-1, 1),
      yaw: r.range(0, TAU),
      boughs: 4,
      rich: false,
      spread: 1.5
    });
  }
}

export { standingFinger, fingers };
