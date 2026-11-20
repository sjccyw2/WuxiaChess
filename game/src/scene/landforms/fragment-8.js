import { lantern } from '../maze-models.js';

// Stretches of the street that have broken away and drift on their own
// billows of cloud. Each is drawn with its paving at y 0; the far end (+x)
// is the fresh break: slabs missing course by course, the bedding crumbled,
// the timber joists snapped and splintered, a slab or two hanging loose.
const bedding = 0x6a6670;
const joist = 0x5e4a3c;
const kerb = 0xbab1a3;

function paver(m, x0, x1, z0, z1, color) {
  const c = 0.012;
  const top = [
    [x0 + c, 0, z0 + c],
    [x0 + c, 0, z1 - c],
    [x1 - c, 0, z1 - c],
    [x1 - c, 0, z0 + c]
  ];
  const foot = [
    [x0, -0.04, z0],
    [x0, -0.04, z1],
    [x1, -0.04, z1],
    [x1, -0.04, z0]
  ];
  m.face(top, color);
  for (let i = 0; i < 4; i++) {
    const k = (i + 1) % 4;
    m.face([foot[i], foot[k], top[k], top[i]], m.mix(color, 0x40464c, 0.3));
  }
  m.face([...foot].reverse(), m.mix(color, 0x40464c, 0.45));
}

// A timber that ends in a jagged, splintered stub.
function snapped(m, a, b, r, color) {
  m.tube(a, b, r, r * 0.92, color, 6);
  const d = b.map((v, k) => v - a[k]),
    len = Math.hypot(...d),
    u = d.map((v) => v / len);
  for (const [s, t, k] of [
    [0.18, 0.06, 1],
    [0.11, -0.05, -1],
    [0.07, 0.02, 0]
  ]) {
    const tip = [b[0] + u[0] * s + t * 0.4, b[1] + u[1] * s + k * r * 0.6, b[2] + u[2] * s + t];
    m.tube(
      [b[0], b[1] + k * r * 0.4, b[2] + t * 0.3],
      tip,
      r * 0.5,
      0.004,
      m.mix(color, 0xc8a882, 0.35),
      4
    );
  }
}

function brokenStreet(m, len, wide, lamp = true) {
  const courses = 4,
    w = wide / courses,
    left = -len / 2;
  const breaks = Array.from({ length: courses }, () => len / 2 - m.rng.range(0.05, 0.85));
  // Paving, course by course, each stopping at its own break.
  for (let c = 0; c < courses; c++) {
    const z = -wide / 2 + c * w;
    let x = left;
    while (x < breaks[c] - 0.12) {
      const edge = Math.min(breaks[c], x + m.rng.range(0.45, 0.9));
      const roll = m.rng.next();
      const color = m.mix(
        m.mix(0x7a868c, 0xa89e8a, m.rng.range(0.25, 0.75)),
        roll < 0.15 ? 0xc4bcaa : 0x5f676d,
        roll < 0.15 ? 0.55 : roll > 0.85 ? 0.4 : 0
      );
      paver(m, x + 0.006, edge - 0.006, z + 0.006, z + w - 0.006, color);
      x = edge;
    }
    // Bedding beneath, a little shorter than the slabs it lost.
    const end = breaks[c] - m.rng.range(0.02, 0.2);
    m.box((left + end) / 2, -0.09, z + w / 2, end - left, 0.1, w, bedding);
  }
  // Kerbstones on the near side, cut short before the break.
  const kerbEnd = Math.min(...breaks) - 0.2;
  for (let x = left; x < kerbEnd - 0.1; x += 0.52)
    m.box(x + 0.25, 0.03, wide / 2 + 0.06, Math.min(0.5, kerbEnd - x), 0.16, 0.12, kerb);
  // The masonry deck: a thick slab with a moulded edge, ragged at the break.
  const deckEnd = Math.min(...breaks) - 0.1;
  m.box((left + deckEnd) / 2, -0.26, 0, deckEnd - left, 0.26, wide + 0.12, 0x8a8590);
  m.box((left + deckEnd) / 2, -0.15, 0, deckEnd - left + 0.04, 0.05, wide + 0.18, kerb);
  for (let k = 0; k < 4; k++) {
    const z = -wide / 2 + (k + 0.5) * (wide / 4),
      reach = m.rng.range(0.08, 0.4);
    m.box(
      deckEnd + reach / 2,
      -0.26 + m.rng.range(-0.04, 0.04),
      z,
      reach,
      m.rng.range(0.12, 0.24),
      wide / 4 - 0.02,
      k % 2 ? 0x7d7883 : 0x8f8a94
    );
  }
  // Joists below, two of them snapped and splintered past the edge.
  for (const z of [-wide * 0.32, wide * 0.32]) {
    const out = len / 2 + m.rng.range(0.15, 0.45);
    snapped(m, [left + 0.1, -0.47, z], [out, -0.47 - m.rng.range(0, 0.08), z], 0.07, joist);
  }
  for (let x = left + 0.3; x < deckEnd; x += 0.55) m.box(x, -0.47, 0, 0.1, 0.1, wide + 0.05, joist);
  m.box(left - 0.04, -0.2, 0, 0.12, 0.42, wide + 0.16, 0x7d7883);
  // Loose slabs dangle from the break and one falls away beneath it.
  m.frame(
    breaks[1] + 0.1,
    -0.12,
    -wide / 2 + w * 1.5,
    0,
    1,
    () => paver(m, 0, 0.4, -w / 2, w / 2 - 0.01, 0x8d8c8c),
    0,
    -1.05
  );
  m.frame(
    breaks[3] + 0.06,
    -0.08,
    -wide / 2 + w * 3.5,
    0.2,
    1,
    () => paver(m, 0, 0.32, -w / 2, w / 2, 0x9b958a),
    0,
    -0.62
  );
  m.frame(
    len / 2 + 0.5,
    -1.05,
    0.1,
    0.7,
    1,
    () => paver(m, -0.2, 0.2, -0.14, 0.14, 0x868a8e),
    0.4,
    0.5
  );
  m.frame(
    len / 2 + 0.25,
    -1.6,
    -0.3,
    1.9,
    1,
    () => paver(m, -0.13, 0.13, -0.1, 0.1, 0x9a948a),
    -0.3,
    0.8
  );
  // Balustrade on the far side; its last bay is torn and leaning out.
  const railZ = -wide / 2 - 0.04,
    posts = [];
  for (let x = left + 0.12; x < deckEnd - 0.2; x += 0.46) posts.push(x);
  for (const x of posts) {
    m.box(x, 0.2, railZ, 0.07, 0.42, 0.07, 0x7e3a2d);
    m.box(x, 0.42, railZ, 0.1, 0.04, 0.1, 0xc9a45e);
  }
  const last = posts.at(-1);
  m.box((posts[0] + last) / 2, 0.36, railZ, last - posts[0] + 0.05, 0.045, 0.06, 0x8b4535);
  m.box((posts[0] + last) / 2, 0.14, railZ, last - posts[0], 0.03, 0.04, 0x8b4535);
  m.frame(last, 0.36, railZ, 0, 1, () => m.box(0.24, 0, 0, 0.48, 0.045, 0.06, 0x8b4535), 0, -0.55);
  m.frame(
    last + 0.3,
    0.02,
    railZ - 0.02,
    0,
    1,
    () => m.box(0, -0.18, 0, 0.07, 0.4, 0.07, 0x7e3a2d),
    0.25,
    0.4
  );
  if (lamp) {
    // A street lamp still stands at the sound end, and a stall's jars.
    m.tube(
      [left + 0.25, 0.02, wide / 2 - 0.1],
      [left + 0.25, 1.32, wide / 2 - 0.1],
      0.04,
      0.032,
      0x4d3f35,
      7
    );
    m.tube(
      [left + 0.25, 1.28, wide / 2 - 0.1],
      [left + 0.62, 1.34, wide / 2 - 0.1],
      0.025,
      0.02,
      0x4d3f35,
      6
    );
    lantern(m, left + 0.58, 1.02, wide / 2 - 0.1, 0.62, 0xd8763f);
    for (const [x, z, s] of [
      [left + 0.75, -0.15, 0.3],
      [left + 1.0, 0.05, 0.24],
      [left + 0.62, 0.15, 0.2]
    ])
      m.lathe(
        x,
        0,
        z,
        [
          [0, 0.07 * s * 3],
          [0.1 * s * 3, 0.12 * s * 3],
          [0.22 * s * 3, 0.09 * s * 3],
          [0.26 * s * 3, 0.05 * s * 3]
        ],
        m.rng.next() < 0.5 ? 0x7b5340 : 0x9cb4ab,
        8
      );
    // A fallen shop sign lies across the paving.
    m.frame(left + 1.45, 0.025, -0.1, 0.4, 1, () => {
      m.box(0, 0, 0, 0.7, 0.03, 0.2, 0x2f3442);
      for (let k = 0; k < 3; k++) m.box(-0.2 + k * 0.2, 0.018, 0, 0.09, 0.008, 0.09, 0xc9a45e);
    });
  }
}

export { brokenStreet };
