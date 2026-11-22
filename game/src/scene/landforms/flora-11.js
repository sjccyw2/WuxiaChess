// 絕情谷 plants and palette, shared by the modules of 絕情花徑: value noise for the lie
// of the land, the 情花 bush and its petals, grass, ferns and the trees of the valley woods.
import { circle } from '../scenery-kit.js';

const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));
const fade = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const between = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// Deterministic value noise: the swell of the ground, patches of colour, where woods stand.
const hash = (x, z) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x, z) {
  const i = Math.floor(x),
    j = Math.floor(z),
    u = fade(x - i),
    v = fade(z - j);
  const a = hash(i, j),
    b = hash(i + 1, j),
    c = hash(i, j + 1),
    d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// 情花: blossoms from deep red to pale pink, dark leaves, brown thorny canes.
const flush = [
  [0x9e1b30, 0xd9405c],
  [0xb8283f, 0xea6f88],
  [0xc93f5e, 0xf4a3b4],
  [0xd65a78, 0xf9c9d2]
];
const thornLeaf = [0x27402e, 0x2f4a32, 0x385637];
const cane = 0x5b4a36;
const barks = [0x4c4336, 0x574a3a, 0x5f5242];
const leafy = [
  [0x2c4632, 0x4b6b42],
  [0x33503a, 0x577848],
  [0x29422f, 0x446640],
  [0x3a5536, 0x62804a],
  [0x2e4a3a, 0x4e7150]
];
const needles = [
  [0x263f34, 0x466a4b],
  [0x2d4838, 0x52754f],
  [0x223a30, 0x40634a]
];
const blades = [0x5f7d47, 0x74904f, 0x4f6f40, 0x87975a];
const stones = [0x898e92, 0x979b9e, 0x7c8288, 0xa1a3a4, 0x83898d, 0x8f959a];
const slates = [0x5f666a, 0x6b7175, 0x565d60, 0x747a7b, 0x646a62];
const crag = 0x777f88,
  mossy = 0x4f6a40;

// A rounded mass of leaves: a squashed, ragged lump with a lit top.
const lumpy = [
  [-0.45, 0.55],
  [-0.08, 1],
  [0.42, 0.74]
];
const rounded = [
  [-0.6, 0.2],
  [-0.42, 0.72],
  [-0.1, 1],
  [0.24, 0.93],
  [0.52, 0.56]
];
function clump(m, x, y, z, rx, ry, rz, shade, light, n = 6) {
  const r = m.rng,
    phase = r.range(0, circle),
    dark = m.rgb(shade);
  const edge = Array.from({ length: n }, (_, i) => [
    phase + ((i + r.range(-0.18, 0.18)) * circle) / n,
    r.range(0.8, 1.14)
  ]);
  let last;
  for (const [off, scale] of n > 6 ? rounded : lumpy) {
    const ring = edge.map(([a, k]) => [
      x + rx * Math.cos(a) * k * scale,
      y + ry * (off + 0.14 * Math.sin(a * 3 + off)),
      z + rz * Math.sin(a) * k * scale
    ]);
    if (last)
      for (let j = 0; j < n; j++) {
        const q = (j + 1) % n,
          mid = m.mix(shade, light, clamp(0.35 + off * 0.5 + r.next() * 0.18));
        m.face([last[j], ring[j], ring[q], last[q]], [dark, mid, mid, dark]);
      }
    last = ring;
  }
  for (let j = 0; j < n; j++) m.face([[x, y + ry * 0.78, z], last[(j + 1) % n], last[j]], light);
}

// A single leaf or blade as one flat kite.
function blade(m, a, b, w, col, light = col) {
  const dx = b[0] - a[0],
    dz = b[2] - a[2],
    l = Math.hypot(dx, dz) || 1,
    mid = between(a, b, 0.45);
  const sx = (-dz / l) * w,
    sz = (dx / l) * w,
    c = m.rgb(col),
    hi = m.rgb(light);
  m.face(
    [
      a,
      [mid[0] + sx, mid[1] + w * 0.3, mid[2] + sz],
      b,
      [mid[0] - sx, mid[1] + w * 0.3, mid[2] - sz]
    ],
    [c, c, hi, hi]
  );
}

// One blossom of five broad petals cupped round a gold eye. It faces up, tipped by
// `tilt` toward the bearing `lean`.
function blossom(m, x, y, z, s, lean, tilt, tone) {
  const sl = Math.sin(tilt),
    cl = Math.cos(tilt),
    cd = Math.cos(lean),
    sd = Math.sin(lean);
  const n = [sl * cd, cl, sl * sd],
    u = [-sd, 0, cd],
    v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const at = (a, q, lift) => {
    const c = Math.cos(a) * q,
      d = Math.sin(a) * q;
    return [
      x + s * (c * u[0] + d * v[0] + lift * n[0]),
      y + s * (c * u[1] + d * v[1] + lift * n[1]),
      z + s * (c * u[2] + d * v[2] + lift * n[2])
    ];
  };
  const turn = m.rng.range(0, circle),
    deep = m.rgb(tone[0]),
    pale = m.rgb(tone[1]);
  for (let i = 0; i < 5; i++) {
    const a = turn + (i * circle) / 5;
    m.face([[x, y, z], at(a - 0.54, 1, 0.34), at(a + 0.54, 1, 0.34)], [deep, pale, pale]);
  }
  m.face([at(turn, 0.24, 0.22), at(turn + 2.1, 0.24, 0.22), at(turn + 4.2, 0.24, 0.22)], 0xf0d27a);
}

// A 情花 bush: a dark leafy heart, arching thorny canes, leaves standing out all round,
// and blossoms at the cane tips and over the crown. `lush` bushes carry their canes.
function loveBush(m, x, y, z, h, spread, lush = true, blooms = lush ? 4 : 5) {
  const r = m.rng,
    tone = r.pick(flush),
    shade = r.pick(thornLeaf),
    light = m.mix(shade, 0x55763f, 0.5);
  const rx = spread * 0.6,
    ry = h * 0.42,
    cy = y + h * 0.47,
    size = clamp(h * 0.155, 0.04, 0.072);
  clump(m, x, cy, z, rx, ry, rx * r.range(0.85, 1.05), shade, m.mix(shade, light, 0.6), 6);
  const canes = lush ? 4 : 3,
    turn = r.range(0, circle);
  for (let j = 0; j < canes; j++) {
    const a = turn + (j * circle) / canes + r.range(-0.3, 0.3),
      reach = spread * r.range(0.72, 1.05),
      top = y + h * r.range(0.76, 1.04);
    const tip = [x + Math.cos(a) * reach, top, z + Math.sin(a) * reach],
      knee = [x + Math.cos(a) * reach * 0.4, y + (top - y) * 0.7, z + Math.sin(a) * reach * 0.4];
    if (lush && j < 2) {
      m.tube(knee, tip, 0.009, 0.004, cane, 3);
      // A thorn on the bare cane.
      const p = between(knee, tip, 0.5),
        b = a + (j % 2 ? 1.4 : -1.4);
      m.face(
        [
          p,
          [p[0] + Math.cos(a) * 0.018, p[1] + 0.004, p[2] + Math.sin(a) * 0.018],
          [p[0] + Math.cos(b) * 0.036, p[1] + 0.024, p[2] + Math.sin(b) * 0.036]
        ],
        0x7a6248
      );
    }
    // A pair of leaves on the cane, and one low on the bush that stands out from its heart.
    for (let k = 0; k < 3; k++) {
      const from =
          k < 2
            ? between(knee, tip, 0.15 + 0.5 * k)
            : [x + Math.cos(a + 0.8) * rx * 0.6, cy - ry * 0.1, z + Math.sin(a + 0.8) * rx * 0.6],
        b = k < 2 ? a + (k ? 1 : -1) * r.range(0.8, 1.3) : a + 0.8,
        l = h * r.range(0.22, 0.32);
      blade(
        m,
        from,
        [from[0] + Math.cos(b) * l, from[1] + l * (k < 2 ? 0.12 : -0.2), from[2] + Math.sin(b) * l],
        l * 0.34,
        shade,
        light
      );
    }
    blossom(m, tip[0], tip[1] + 0.006, tip[2], size, a, r.range(0.3, 0.75), tone);
    if (lush || j === 0) {
      const p = between(knee, tip, r.range(0.25, 0.55));
      blossom(
        m,
        p[0],
        p[1] + size * 0.5,
        p[2],
        size * 0.85,
        a + r.range(-1, 1),
        r.range(0.2, 0.6),
        tone
      );
    }
  }
  // Blossoms stud the leafy heart, more of them toward the light.
  for (let j = 0; j < blooms; j++) {
    const a = r.range(0, circle),
      f = r.range(0.05, 0.7),
      q = f < 0.42 ? lerp(1, 0.74, (f + 0.08) / 0.5) : lerp(0.74, 0.12, (f - 0.42) / 0.36);
    blossom(
      m,
      x + Math.cos(a) * rx * q * 1.04,
      cy + ry * f + size * 0.3,
      z + Math.sin(a) * rx * q * 1.04,
      size * r.range(0.8, 1.05),
      a,
      lerp(1.0, 0.15, f / 0.7),
      r.next() < 0.75 ? tone : r.pick(flush)
    );
  }
}

// Fallen petals lying flat; given the ground's height `at`, they lie `y` above it instead.
function petals(m, x, y, z, reach, count, at = null) {
  const r = m.rng;
  for (let k = 0; k < count; k++) {
    const a = r.range(0, circle),
      d = Math.sqrt(r.next()) * reach,
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d,
      b = r.range(0, circle),
      s = r.range(0.016, 0.028),
      py = at ? at(px, pz) + y : y;
    m.face(
      [
        [px + Math.cos(b) * s, py, pz + Math.sin(b) * s],
        [px + Math.cos(b + 2.3) * s, py, pz + Math.sin(b + 2.3) * s],
        [px + Math.cos(b + 4) * s, py, pz + Math.sin(b + 4) * s]
      ],
      r.pick(r.pick(flush))
    );
  }
}

// A tuft of grass: a few upright blades.
function tuft(m, x, y, z, s, tones = blades) {
  const r = m.rng,
    count = 3 + Math.floor(r.next() * 3);
  for (let j = 0; j < count; j++) {
    const a = r.range(0, circle),
      out = r.range(0.03, 0.11) * s,
      high = r.range(0.09, 0.2) * s,
      w = 0.018 * s;
    m.face(
      [
        [x - Math.sin(a) * w, y, z + Math.cos(a) * w],
        [x + Math.cos(a) * out, y + high, z + Math.sin(a) * out],
        [x + Math.sin(a) * w, y, z - Math.cos(a) * w]
      ],
      r.pick(tones)
    );
  }
}

// Ferns in the damp at the foot of a rock.
function fern(m, x, y, z, s) {
  const r = m.rng,
    turn = r.range(0, circle);
  for (let j = 0; j < 5; j++) {
    const a = turn + (j * circle) / 5 + r.range(-0.3, 0.3),
      l = s * r.range(0.7, 1.1);
    blade(
      m,
      [x, y, z],
      [x + Math.cos(a) * l, y + l * 0.5, z + Math.sin(a) * l],
      l * 0.2,
      0x4a6f46,
      0x7a9c5a
    );
  }
}

// A broadleaf tree of the valley woods: a leaning trunk flared at its roots, forking into
// limbs that each carry a crown of their own and a twig with a smaller one, the whole
// crown built of many lumps of leaves, dark beneath and lit on top, the branches showing
// between them.
function broadleaf(m, x, y, z, size) {
  const r = m.rng,
    turn = r.range(0, circle),
    lean = r.range(0.04, 0.14) * size,
    bark = r.pick(barks),
    [shade, light] = r.pick(leafy),
    deep = m.mix(shade, 0x1d2b22, 0.35);
  const fork = [x + Math.cos(turn) * lean, y + size * 0.38, z + Math.sin(turn) * lean],
    heart = [
      fork[0] + Math.cos(turn) * lean * 0.5,
      y + size * 0.68,
      fork[2] + Math.sin(turn) * lean * 0.5
    ];
  // Roots spread from the foot of the trunk into the ground.
  for (let k = 0; k < 4; k++) {
    const a = turn + 0.4 + (k * circle) / 4 + r.range(-0.3, 0.3);
    m.tube(
      [x + Math.cos(a) * 0.03 * size, y + 0.1 * size, z + Math.sin(a) * 0.03 * size],
      [x + Math.cos(a) * 0.17 * size, y - 0.04, z + Math.sin(a) * 0.17 * size],
      0.04 * size,
      0.012 * size,
      bark,
      4
    );
  }
  m.tube([x, y - 0.25, z], fork, 0.078 * size, 0.052 * size, bark, 6);
  m.tube(fork, heart, 0.05 * size, 0.022 * size, bark, 5);
  const s = size * r.range(0.27, 0.32);
  clump(m, heart[0], heart[1] + s * 0.25, heart[2], s, s * 0.8, s * 0.95, shade, light, 7);
  const limbs = 4 + Math.floor(r.next() * 2);
  for (let k = 0; k < limbs; k++) {
    const a = turn + (k * circle) / limbs + r.range(-0.35, 0.35),
      reach = s * r.range(1.0, 1.3),
      rise = size * r.range(0.5, 0.68),
      elbow = [
        fork[0] + Math.cos(a) * reach * 0.45,
        y + size * r.range(0.46, 0.54),
        fork[2] + Math.sin(a) * reach * 0.45
      ],
      end = [heart[0] + Math.cos(a) * reach, y + rise, heart[2] + Math.sin(a) * reach],
      q = s * r.range(0.55, 0.7);
    m.tube(fork, elbow, 0.036 * size, 0.024 * size, bark, 5);
    m.tube(elbow, end, 0.024 * size, 0.01 * size, bark, 4);
    clump(m, end[0], end[1], end[2], q, q * 0.72, q, k % 2 ? m.mix(shade, light, 0.2) : shade, light, 7);
    // Shade hangs under each crown.
    clump(m, end[0], end[1] - q * 0.35, end[2], q * 0.8, q * 0.4, q * 0.8, deep, shade, 6);
    const b = a + r.range(0.6, 1.1) * (k % 2 ? 1 : -1),
      t = [elbow[0] + Math.cos(b) * q * 1.3, elbow[1] + size * r.range(0.06, 0.14), elbow[2] + Math.sin(b) * q * 1.3],
      tq = q * r.range(0.5, 0.65);
    m.tube(elbow, t, 0.015 * size, 0.006 * size, bark, 4);
    clump(m, t[0], t[1], t[2], tq, tq * 0.7, tq, m.mix(shade, light, 0.35), light, 6);
  }
  // The crown rises in a few lit lumps over the heart.
  for (let k = 0; k < 3; k++) {
    const a = turn + k * 2.1 + r.range(-0.4, 0.4),
      d = s * r.range(0.3, 0.6),
      q = s * r.range(0.45, 0.6);
    clump(
      m,
      heart[0] + Math.cos(a) * d,
      heart[1] + s * r.range(0.65, 0.9),
      heart[2] + Math.sin(a) * d,
      q,
      q * 0.7,
      q,
      m.mix(shade, light, 0.4),
      m.mix(light, 0x9fb070, 0.25),
      6
    );
  }
}

// A fir: drooping skirts of dark needles stacked up a straight stem, ragged at their edges.
function fir(m, x, y, z, size) {
  const r = m.rng,
    [shade, light] = r.pick(needles),
    under = m.mix(shade, 0x1c2a24, 0.4);
  m.tube([x, y - 0.25, z], [x, y + size * 0.3, z], 0.05 * size, 0.035 * size, barks[0], 5);
  for (let k = 0; k < 6; k++) {
    const base = y + size * (0.15 + 0.135 * k),
      w = size * (0.31 - 0.042 * k),
      h = size * (0.3 - 0.018 * k),
      turn = r.range(0, circle),
      ring = [];
    for (let i = 0; i < 10; i++) {
      const a = turn + (i * circle) / 10,
        q = w * (i % 2 ? 0.78 : 1) * r.range(0.88, 1.1);
      ring.push([x + Math.cos(a) * q, base - h * (i % 2 ? 0.05 : 0.2), z + Math.sin(a) * q]);
    }
    const tip = [x, base + h, z],
      dark = m.rgb(shade),
      hi = m.rgb(m.mix(light, shade, (k % 2) * 0.25));
    for (let i = 0; i < 10; i++) {
      m.face([tip, ring[(i + 1) % 10], ring[i]], [hi, dark, dark]);
      m.face([[x, base + h * 0.25, z], ring[i], ring[(i + 1) % 10]], under);
    }
  }
}

// An old pine: a bent trunk carrying flat pads of needles on outstretched limbs.
function pine(m, x, y, z, size) {
  const r = m.rng,
    turn = r.range(0, circle),
    bark = 0x5a4638,
    [shade, light] = needles[1];
  const bend = (h, d) => [
    x + Math.cos(turn) * d * size,
    y + h * size,
    z + Math.sin(turn) * d * size
  ];
  const stem = [bend(-0.1, 0), bend(0.3, 0.07), bend(0.6, -0.02), bend(0.88, 0.1)];
  for (let i = 0; i < 3; i++)
    m.tube(stem[i], stem[i + 1], (0.06 - i * 0.014) * size, (0.046 - i * 0.014) * size, bark, 5);
  const pads = 4 + Math.floor(r.next() * 2);
  for (let k = 0; k < pads; k++) {
    const t = 0.35 + (0.65 * k) / (pads - 1),
      from = between(stem[1], stem[3], t),
      a = turn + k * 2.4 + r.range(-0.4, 0.4),
      d = size * (0.38 - 0.2 * t) * r.range(0.8, 1.15),
      q = size * (0.3 - 0.1 * t);
    const c =
      k === pads - 1
        ? [from[0], from[1] + q * 0.2, from[2]]
        : [from[0] + Math.cos(a) * d, from[1] + size * 0.05, from[2] + Math.sin(a) * d];
    if (k < pads - 1) m.tube(from, c, 0.02 * size, 0.01 * size, bark, 4);
    clump(m, c[0], c[1] + q * 0.12, c[2], q, q * 0.36, q * 0.85, shade, light, 7);
  }
}

export {
  clamp,
  fade,
  lerp,
  between,
  hash,
  noise,
  flush,
  thornLeaf,
  cane,
  barks,
  leafy,
  needles,
  blades,
  stones,
  slates,
  crag,
  mossy,
  clump,
  blade,
  blossom,
  loveBush,
  petals,
  tuft,
  fern,
  broadleaf,
  fir,
  pine
};
