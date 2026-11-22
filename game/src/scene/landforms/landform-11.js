// 絕情花徑 (絕情谷): a hidden valley, green and still. The board is the flagged path
// that splits round the deep pool; past it lie the valley floor with its brook, the
// valley master's stone house and alchemy room in the north-east, drifts of 情花,
// wooded slopes, a thin waterfall on a crag, and the far valley walls.
import { Model, circle } from '../scenery-kit.js';
import { reeds } from '../maze-models.js';

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

// A smooth line through a few surveyed points on the ground.
function spline(points, steps) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)],
      p1 = points[i],
      p2 = points[i + 1],
      p3 = points[Math.min(points.length - 1, i + 2)];
    for (let k = 0; k < steps; k++) {
      const t = k / steps,
        t2 = t * t,
        t3 = t2 * t;
      out.push(
        [0, 1].map(
          (c) =>
            0.5 *
            (2 * p1[c] +
              (p2[c] - p0[c]) * t +
              (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 +
              (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)
        )
      );
    }
  }
  out.push(points.at(-1));
  return out;
}
function fromLine(points, x, z) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1],
      dx = points[i][0] - ax,
      dz = points[i][1] - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

// The brook falls from the crag north of the board, runs round the board's west and
// south sides under the footbridge and leaves by the valley mouth in the south-east.
// The party's path comes in from the west through a pass in the slope.
const brook = spline(
  [
    [-2.5, -7.1],
    [-3.6, -6.9],
    [-4.9, -7.2],
    [-6.2, -6.9],
    [-7.3, -5.6],
    [-8.3, -3.8],
    [-8.7, -1.6],
    [-8.6, 0.4],
    [-8.9, 2.4],
    [-8.7, 4.4],
    [-7.6, 6.3],
    [-5.8, 7.6],
    [-3.2, 8.2],
    [-0.6, 8.0],
    [1.8, 8.5],
    [4.2, 9.5],
    [6.4, 10.9],
    [8.3, 13],
    [9.6, 16],
    [10.5, 21],
    [11, 27]
  ],
  6
);
const track = spline(
  [
    [-6.5, 0.0],
    [-7.9, 0.1],
    [-8.65, 0.3],
    [-10.5, 0.5],
    [-12.6, 1.4],
    [-15.2, 1.6],
    [-18.2, 0.8],
    [-22.5, 1.3],
    [-29, 0.4]
  ],
  5
);
const plunge = [-2.5, -7.1];
// The stone house stands on a levelled terrace against the north slope: the hall's door
// is at (hall.x, hall.z), facing the board.
const hall = { x: 5.3, z: -7.3 };
const terrace = { x0: 0.5, x1: 7.9, z0: -10.5, z1: -5.5, y: -0.07 };

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

// Fallen petals lying flat.
function petals(m, x, y, z, reach, count) {
  const r = m.rng;
  for (let k = 0; k < count; k++) {
    const a = r.range(0, circle),
      d = Math.sqrt(r.next()) * reach,
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d,
      b = r.range(0, circle),
      s = r.range(0.016, 0.028);
    m.face(
      [
        [px + Math.cos(b) * s, y, pz + Math.sin(b) * s],
        [px + Math.cos(b + 2.3) * s, y, pz + Math.sin(b + 2.3) * s],
        [px + Math.cos(b + 4) * s, y, pz + Math.sin(b + 4) * s]
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

// A broadleaf tree of the valley woods: a leaning trunk and a few boughs, each under its own crown.
function broadleaf(m, x, y, z, size) {
  const r = m.rng,
    turn = r.range(0, circle),
    lean = r.range(0.04, 0.14) * size,
    bark = r.pick(barks),
    [shade, light] = r.pick(leafy);
  const fork = [x + Math.cos(turn) * lean, y + size * 0.4, z + Math.sin(turn) * lean],
    heart = [
      fork[0] + Math.cos(turn) * lean * 0.5,
      y + size * 0.7,
      fork[2] + Math.sin(turn) * lean * 0.5
    ];
  m.tube([x, y - 0.25, z], fork, 0.075 * size, 0.05 * size, bark, 5);
  m.tube(fork, heart, 0.05 * size, 0.02 * size, bark, 4);
  const s = size * r.range(0.33, 0.4);
  clump(m, heart[0], heart[1] + s * 0.2, heart[2], s, s * 0.78, s * 0.95, shade, light, 7);
  const boughs = 3 + Math.floor(r.next() * 2);
  for (let k = 0; k < boughs; k++) {
    const a = turn + (k * circle) / boughs + r.range(-0.4, 0.4),
      d = s * r.range(0.7, 0.95),
      q = s * r.range(0.55, 0.75);
    const c = [
      heart[0] + Math.cos(a) * d,
      heart[1] - size * r.range(0.04, 0.2),
      heart[2] + Math.sin(a) * d
    ];
    m.tube(fork, [c[0], c[1] - q * 0.3, c[2]], 0.035 * size, 0.012 * size, bark, 4);
    clump(m, c[0], c[1], c[2], q, q * 0.72, q, k % 2 ? m.mix(shade, light, 0.25) : shade, light, 6);
  }
}

// A fir: drooping skirts of dark needles stacked up a straight stem.
function fir(m, x, y, z, size) {
  const r = m.rng,
    [shade, light] = r.pick(needles),
    under = m.mix(shade, 0x1c2a24, 0.4);
  m.tube([x, y - 0.25, z], [x, y + size * 0.3, z], 0.05 * size, 0.035 * size, barks[0], 5);
  for (let k = 0; k < 4; k++) {
    const base = y + size * (0.17 + 0.2 * k),
      w = size * (0.3 - 0.058 * k),
      h = size * (0.38 - 0.03 * k),
      turn = r.range(0, circle),
      ring = [];
    for (let i = 0; i < 6; i++) {
      const a = turn + (i * circle) / 6,
        q = w * r.range(0.86, 1.12);
      ring.push([x + Math.cos(a) * q, base - h * 0.14 * (i % 2), z + Math.sin(a) * q]);
    }
    const tip = [x, base + h, z],
      dark = m.rgb(shade),
      hi = m.rgb(light);
    for (let i = 0; i < 6; i++) {
      m.face([tip, ring[(i + 1) % 6], ring[i]], [hi, dark, dark]);
      m.face([[x, base + h * 0.22, z], ring[i], ring[(i + 1) % 6]], under);
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

// The lie of the land: the board's footprint, the pool it encloses, the valley floor
// and its slopes, and the height of the finished ground anywhere.
function survey(layout) {
  const halfX = layout.width / 2,
    halfZ = layout.height / 2,
    wide = layout.width;
  const tiles = layout.cells.map(({ x, y }) => [x + 0.5 - halfX, y + 0.5 - halfZ]);
  const taken = new Set(layout.cells.map(({ x, y }) => y * wide + x));
  // The pool: cells the board leaves open with tiles on every side of them.
  const pool = [];
  for (let y = 0; y < layout.height; y++)
    for (let x = 0; x < wide; x++) {
      if (taken.has(y * wide + x)) continue;
      const row = (from, to) => {
        for (let i = from; i < to; i++) if (taken.has(y * wide + i)) return true;
        return false;
      };
      const column = (from, to) => {
        for (let j = from; j < to; j++) if (taken.has(j * wide + x)) return true;
        return false;
      };
      if (row(0, x) && row(x + 1, wide) && column(0, y) && column(y + 1, layout.height))
        pool.push([x, y]);
    }
  const wet = new Set(pool.map(([x, y]) => y * wide + x));
  const cell = (x, z) => {
    const cx = Math.floor(x + halfX),
      cy = Math.floor(z + halfZ);
    return cx < 0 || cy < 0 || cx >= wide || cy >= layout.height ? -1 : cy * wide + cx;
  };
  const onTile = (x, z) => taken.has(cell(x, z)),
    inPool = (x, z) => wet.has(cell(x, z));
  // Distance from a point to the nearest tile: 0 on the board.
  const gap = (x, z) => {
    let best = Infinity;
    for (const [cx, cz] of tiles) {
      const dx = Math.max(Math.abs(cx - x) - 0.5, 0),
        dz = Math.max(Math.abs(cz - z) - 0.5, 0),
        d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  };
  const toBrook = (x, z) => fromLine(brook, x, z),
    toTrack = (x, z) => fromLine(track, x, z);
  const toTerrace = (x, z) =>
    Math.hypot(
      Math.max(terrace.x0 - x, 0, x - terrace.x1),
      Math.max(terrace.z0 - z, 0, z - terrace.z1)
    );
  // The valley floor lies a step below the flagged path and rolls gently; past its
  // foot the slopes climb, high in the north and west, low in the east and south where
  // the opening view looks in, never so steep that they would stand between a low
  // camera and the board.
  const lie = (x, z) => {
    const d = gap(x, z),
      len = Math.hypot(x, z) || 1,
      ux = x / len,
      uz = z / len;
    const n = Math.max(0, -uz) ** 2,
      s = Math.max(0, uz) ** 2,
      e = Math.max(0, ux) ** 2,
      w = Math.max(0, -ux) ** 2;
    const kerb = fade(d / 1.5),
      roll =
        0.12 * (noise(x * 0.29 + 3, z * 0.29 + 7) - 0.5) +
        0.05 * (noise(x * 0.83 - 2, z * 0.83 + 1) - 0.5);
    let h = -0.1 - 0.12 * kerb + roll * kerb;
    const b = toBrook(x, z),
      foot = 2.3 * n + 4.6 * e + 3 * w + 9 * s + 0.8 * (noise(x * 0.21 - 7, z * 0.21 + 2) - 0.5),
      out = d - foot;
    if (out > 0) {
      const steep = 0.38 * n + 0.26 * e + 0.36 * w + 0.15 * s,
        crest =
          (6.2 * n + 3.4 * e + 5.6 * w + 2.2 * s) *
          (0.75 + 0.5 * noise(x * 0.11 + 5, z * 0.11 - 3));
      // The path comes in by a pass in the west; the brook leaves by the mouth in the south-east.
      const pass = x < 0 ? fade((toTrack(x, z) - 0.9) / 3.2) : 1,
        mouth = z > 4 ? fade((b - 0.8) / 3.4) : 0.7 + 0.3 * fade((b - 0.3) / 1.6);
      h += crest * (1 - Math.exp((-steep * out) / crest)) * pass * mouth;
    }
    // The brook runs in a shallow bed of its own.
    return h - 0.1 * (1 - fade(b / 0.75)) * fade(d / 0.8);
  };
  const basin = lie(plunge[0], plunge[1]) - 0.1;
  const height = (x, z) => {
    // The plunge pool under the waterfall and the house terrace are levelled.
    const h = lerp(basin, lie(x, z), fade((Math.hypot(x - plunge[0], z - plunge[1]) - 0.75) / 0.9));
    return lerp(terrace.y, h, fade(toTerrace(x, z) / 1.1));
  };
  return { halfX, halfZ, pool, onTile, inPool, gap, toBrook, toTrack, toTerrace, height, basin };
}

// Grid lines at a fine spacing round the board, widening toward the valley walls.
function gridLines(half, step, extra, grow) {
  const core = Math.round((2 * half) / step),
    values = [];
  for (let i = 0; i <= core; i++) values.push(-half + (2 * half * i) / core);
  let width = step;
  for (let k = 0; k < extra; k++) {
    width *= grow;
    values.push(values.at(-1) + width);
    values.unshift(values[0] - width);
  }
  return values;
}
function locate(values, v) {
  let lo = 0,
    hi = values.length - 1;
  if (v <= values[0]) return [0, 0];
  if (v >= values[hi]) return [hi - 1, 1];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (values[mid] <= v) lo = mid;
    else hi = mid;
  }
  return [lo, (v - values[lo]) / (values[lo + 1] - values[lo])];
}

// The earth itself: one smooth skin from the board's edge to the valley walls, left open
// under the board and the pool. Returns the height of that skin anywhere.
function earth(m, land) {
  const xs = gridLines(land.halfX + 5, 0.55, 8, 1.3),
    zs = gridLines(land.halfZ + 5, 0.55, 8, 1.3),
    nx = xs.length,
    nz = zs.length;
  const heights = new Float32Array(nx * nz),
    sunk = new Uint8Array(nx * nz),
    part = m.parts[0],
    start = part.p.length / 3;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const x = xs[i],
        z = zs[j],
        k = j * nx + i;
      sunk[k] = land.onTile(x, z) || land.inPool(x, z) ? 1 : 0;
      heights[k] = sunk[k] ? -0.14 : land.height(x, z);
      part.p.push(x, heights[k], z);
    }
  const at = (x, z) => {
    const [i, u] = locate(xs, x),
      [j, v] = locate(zs, z),
      a = j * nx + i;
    const a0 = heights[a],
      b0 = heights[a + 1],
      c0 = heights[a + nx],
      d0 = heights[a + nx + 1];
    return u + v <= 1
      ? a0 + u * (b0 - a0) + v * (c0 - a0)
      : d0 + (1 - u) * (c0 - d0) + (1 - v) * (b0 - d0);
  };
  // Ground colour: turf in broad patches, moss in the hollows, dark woods on the slopes,
  // bare rock where they steepen, worn earth along the path and at the board's foot.
  const turf = m.rgb(0x4c6644),
    bright = m.rgb(0x5e7a4c),
    moss = m.rgb(0x3f573b),
    straw = m.rgb(0x7c8458),
    woodA = m.rgb(0x3d5639),
    woodB = m.rgb(0x344d36),
    rock = m.rgb(0x777c72),
    worn = m.rgb(0x8c7e60),
    gravel = m.rgb(0x666d5c),
    court = m.rgb(0x86826f);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const x = xs[i],
        z = zs[j],
        k = j * nx + i,
        h = heights[k];
      const il = Math.max(0, i - 1),
        ir = Math.min(nx - 1, i + 1),
        jl = Math.max(0, j - 1),
        jr = Math.min(nz - 1, j + 1);
      const steep = Math.hypot(
        (heights[j * nx + ir] - heights[j * nx + il]) / (xs[ir] - xs[il]),
        (heights[jr * nx + i] - heights[jl * nx + i]) / (zs[jr] - zs[jl])
      );
      const broad = noise(x * 0.33 + 4, z * 0.33 - 2),
        fine = noise(x * 1.1 - 7, z * 1.1 + 3),
        d = land.gap(x, z),
        b = land.toBrook(x, z),
        t = land.toTrack(x, z);
      let c = between(turf, bright, broad);
      c = between(c, moss, fade((0.42 - broad) / 0.2) * 0.7);
      c = between(c, straw, fade((fine - 0.66) / 0.2) * fade((broad - 0.45) / 0.2) * 0.5);
      c = between(
        c,
        between(woodA, woodB, noise(x * 0.45 + 11, z * 0.45 - 6)),
        fade((h - 0.05) / 0.7) * 0.85
      );
      c = between(c, rock, fade((steep - 0.3) / 0.14) * fade((fine - 0.3) / 0.3) * 0.75);
      c = between(c, worn, (1 - fade((t - 0.25) / 0.5)) * 0.85);
      c = between(c, gravel, (1 - fade((b - 0.3) / 0.45)) * 0.8);
      c = between(c, worn, (1 - fade(d / 0.45)) * 0.45);
      // The forecourt before the stone house is trodden bare.
      const yard = Math.hypot(Math.max(1.2 - x, 0, x - 7.4), Math.max(-7.4 - z, 0, z + 5.4));
      c = between(c, court, (1 - fade(yard / 0.7)) * 0.75);
      const tone = 0.92 + 0.16 * fine;
      part.c.push(c[0] * tone, c[1] * tone, c[2] * tone);
    }
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      if (sunk[a] && sunk[b] && sunk[c] && sunk[d]) continue;
      part.i.push(start + a, start + c, start + b, start + b, start + c, start + d);
    }
  return at;
}

// The deep pool the path splits round: still, dark green water paling toward its banks,
// lily pads in the lee of the bank and petals adrift on it.
function deepPool(m, land) {
  const y = -0.05,
    r = m.rng,
    n = 5;
  const rim = m.rgb(0x8ab096),
    mid = m.rgb(0x3f6f5c),
    deep = m.rgb(0x1c3b35);
  const tone = (x, z) => {
    const d = land.gap(x, z),
      c = d < 0.24 ? between(rim, mid, fade(d / 0.24)) : between(mid, deep, fade((d - 0.24) / 0.5));
    return between(c, mid, 0.22 * noise(x * 2.1 + 5, z * 2.1));
  };
  for (const [cx, cy] of land.pool)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x0 = cx - land.halfX + i / n,
          z0 = cy - land.halfZ + j / n,
          x1 = x0 + 1 / n,
          z1 = z0 + 1 / n;
        m.face(
          [
            [x0, y, z0],
            [x0, y, z1],
            [x1, y, z1],
            [x1, y, z0]
          ],
          [tone(x0, z0), tone(x0, z1), tone(x1, z1), tone(x1, z0)]
        );
      }
  // The sky lies on the water in a few pale streaks.
  for (let k = 0; k < 9; k++) {
    const x = r.range(-0.9, 1.6),
      z = r.range(-0.35, 0.3),
      w = r.range(0.18, 0.4);
    m.face(
      [
        [x, y + 0.003, z],
        [x + w * 0.2, y + 0.003, z + 0.016],
        [x + w, y + 0.003, z + 0.03],
        [x + w * 0.85, y + 0.003, z + 0.012]
      ],
      m.mix(0x3f6f5c, 0xb9cbc0, r.range(0.2, 0.45))
    );
  }
  // Lily pads gather under the banks, clear of the open water.
  const pads = [
    [-1.28, -0.3, 0.13],
    [-1.05, -0.36, 0.1],
    [-1.3, 0.02, 0.09],
    [-0.3, -1.3, 0.14],
    [0.0, -1.36, 0.1],
    [-0.12, -1.08, 0.08],
    [1.3, -1.32, 0.11],
    [2.28, 0.3, 0.12],
    [2.05, 0.37, 0.08],
    [1.33, 1.3, 0.12],
    [1.1, 1.36, 0.08],
    [-0.36, 1.28, 0.1]
  ];
  for (const [x, z, s] of pads) {
    const turn = r.range(0, circle),
      col = m.rgb(r.pick([0x3f6a3a, 0x4a7540, 0x3a6038])),
      heart = m.rgb(0x6a8f4c),
      ring = [];
    for (let i = 0; i <= 8; i++) {
      const a = turn + 0.25 + (i / 8) * (circle - 0.5);
      ring.push([x + Math.cos(a) * s, y + 0.008, z + Math.sin(a) * s]);
    }
    for (let i = 0; i < 8; i++) m.face([[x, y + 0.01, z], ring[i + 1], ring[i]], [heart, col, col]);
  }
  // Water lilies open among them.
  for (const [x, z] of [
    [-1.17, -0.2],
    [-0.17, -1.2],
    [2.17, 0.24]
  ]) {
    blossom(m, x, y + 0.02, z, 0.07, 0, 0.1, [0xe9a9b8, 0xfbeef0]);
    blossom(m, x, y + 0.035, z, 0.045, 1, 0.1, [0xf3c4cd, 0xffffff]);
  }
  for (const [cx, cy] of land.pool)
    petals(m, cx - land.halfX + 0.5, y + 0.004, cy - land.halfZ + 0.5, 0.5, 4);
}

// The brook: a bed of wet gravel, a ribbon of clear water over it, stones along its
// banks, and the plunge pool it rises from.
function brookWater(m, land, at) {
  const r = m.rng,
    bank = m.rgb(0x6c7361),
    edge = m.rgb(0x6f9c8c),
    clear = m.rgb(0x3d7264),
    white = m.rgb(0xe4eeea);
  let last = null;
  for (let i = 0; i < brook.length; i++) {
    const [x, z] = brook[i],
      [px, pz] = brook[Math.max(0, i - 1)],
      [qx, qz] = brook[Math.min(brook.length - 1, i + 1)],
      l = Math.hypot(qx - px, qz - pz) || 1,
      nx = -(qz - pz) / l,
      nz = (qx - px) / l;
    if (Math.abs(x) > 25 || Math.abs(z) > 25) break;
    const wide = 0.15 + 0.08 * noise(i * 0.37, 2.5),
      shore = wide + 0.16,
      // White water where the brook comes down off the slope.
      rush = fade((at(x, z) + 0.1) / 0.3) * 0.5 + fade((noise(i * 0.9, 6.5) - 0.7) / 0.2) * 0.3;
    const point = (off, lift) => {
      const sx = x + nx * off,
        sz = z + nz * off;
      return [sx, at(sx, sz) + lift, sz];
    };
    const row = [
        point(-shore, 0.012),
        point(-wide, 0.026),
        point(0, 0.03),
        point(wide, 0.026),
        point(shore, 0.012)
      ],
      tone = [
        bank,
        between(edge, white, rush),
        between(clear, white, rush * 0.7),
        between(edge, white, rush),
        bank
      ];
    if (last)
      for (let k = 0; k < 4; k++)
        m.face(
          [last.row[k], row[k], row[k + 1], last.row[k + 1]],
          [last.tone[k], tone[k], tone[k + 1], last.tone[k + 1]]
        );
    last = { row, tone };
    // Stones lie along the banks.
    if (i % 4 === 1) {
      const side = r.next() < 0.5 ? -1 : 1,
        off = side * (shore + r.range(0, 0.25)),
        s = r.range(0.07, 0.16),
        sx = x + nx * off,
        sz = z + nz * off;
      if (land.gap(sx, sz) > 0.3)
        m.rock(
          sx,
          at(sx, sz) - 0.03,
          sz,
          s,
          s * r.range(0.6, 0.9),
          s * r.range(0.7, 1),
          0x7e837b,
          m.mix(0x7e837b, mossy, r.next() * 0.7),
          5
        );
    }
  }
  // The plunge pool, churned white where the fall strikes it.
  const [px, pz] = plunge,
    y = land.basin + 0.06,
    ring = [],
    foam = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * circle) / 12,
      q = 0.82 * (0.9 + 0.2 * noise(i * 1.3, 9));
    ring.push([px + Math.cos(a) * q, y, pz + Math.sin(a) * q * 0.85]);
    foam.push([px + Math.cos(a) * 0.3, y + 0.006, pz - 0.12 + Math.sin(a) * 0.24]);
  }
  for (let i = 0; i < 12; i++) {
    m.face([[px, y, pz], ring[(i + 1) % 12], ring[i]], [m.rgb(0x3f7566), edge, edge]);
    m.face(
      [[px, y + 0.008, pz - 0.12], foam[(i + 1) % 12], foam[i]],
      [white, m.rgb(0xb9d5cc), m.rgb(0xb9d5cc)]
    );
  }
}

// Turf, flowers and loose stones the smooth ground cannot carry; the stepping stones of
// the west path and its footbridge; the flags of the forecourt.
function groundCover(m, land, at) {
  const r = m.rng;
  const open = (x, z, margin = 0) =>
    land.gap(x, z) > 0.12 + margin &&
    !land.inPool(x, z) &&
    land.toBrook(x, z) > 0.5 + margin &&
    land.toTrack(x, z) > 0.42 + margin &&
    !(x > 1 && x < 7.6 && z > -10.2 && z < -5.4) &&
    Math.hypot(x - plunge[0], z - plunge[1]) > 1.1;
  // Patches of deeper and drier turf, and of bare earth, break up the valley floor.
  for (let k = 0; k < 150; k++) {
    const x = r.range(-13, 12),
      z = r.range(-11, 12);
    if (!open(x, z, 0.5) || at(x, z) > 0.2) continue;
    const w = r.range(0.35, 0.9),
      d = r.range(0.2, 0.5),
      turn = r.range(0, circle),
      col = m.mix(
        r.pick([0x3c5638, 0x435d3c, 0x5a7548, 0x6b8250, 0x788056, 0x7f7558]),
        0x506a42,
        0.4
      ),
      rim = m.mix(col, 0x526c43, 0.85),
      ring = [];
    for (let j = 0; j < 8; j++) {
      const a = turn + (j * circle) / 8,
        q = r.range(0.7, 1.2),
        px = x + Math.cos(a) * w * q,
        pz = z + Math.sin(a) * d * q;
      ring.push([px, at(px, pz) + 0.012, pz]);
    }
    const middle = [x, at(x, z) + 0.016, z];
    for (let j = 0; j < 8; j++) m.face([middle, ring[(j + 1) % 8], ring[j]], [col, rim, rim]);
  }
  // Grass stands thickest at the foot of the board and along the brook.
  for (let k = 0; k < 1700; k++) {
    const x = r.range(-14, 12.5),
      z = r.range(-11.5, 12.5),
      chance = r.next();
    if (!open(x, z)) continue;
    const d = land.gap(x, z),
      b = land.toBrook(x, z);
    const want = Math.max(d < 0.9 ? 0.6 - d * 0.5 : 0, b < 1.3 ? 0.45 : 0, 0.08);
    if (chance > want) continue;
    tuft(m, x, at(x, z) - 0.01, z, r.range(0.75, 1.3));
  }
  // Small wild flowers in the turf: white, yellow and violet.
  for (let k = 0; k < 330; k++) {
    const x = r.range(-13, 12),
      z = r.range(-11, 11);
    if (!open(x, z, 0.1) || noise(x * 0.6 + 9, z * 0.6) < 0.5) continue;
    const y = at(x, z) + r.range(0.03, 0.06),
      s = r.range(0.018, 0.03),
      col = r.pick([0xf2efe0, 0xf2efe0, 0xe9d36a, 0xb49ad6]);
    m.face(
      [
        [x - s, y, z],
        [x, y + s * 0.3, z + s],
        [x + s, y, z],
        [x, y + s * 0.3, z - s]
      ],
      col
    );
  }
  // Loose stones, mossed over.
  for (let k = 0; k < 46; k++) {
    const x = r.range(-13, 12),
      z = r.range(-11, 11);
    if (!open(x, z, 0.25)) continue;
    const s = r.range(0.06, 0.15);
    m.rock(
      x,
      at(x, z) - 0.03,
      z,
      s,
      s * r.range(0.55, 0.9),
      s * r.range(0.7, 1),
      r.pick(stones),
      m.mix(0x8d8f88, mossy, r.next()),
      5
    );
  }
  // Stepping stones carry the west path from the pass to the board.
  const flag = (x, z, yaw, long, wide, col, sides = 6, lift = 0.02) => {
    const c = Math.cos(yaw),
      s = Math.sin(yaw),
      square = sides === 4 ? 1.36 : 1,
      ring = [];
    for (let i = 0; i < sides; i++) {
      const a = ((i + 0.5) * circle) / sides + r.range(-0.12, 0.12),
        u = Math.cos(a) * long * square * r.range(0.88, 1.08),
        v = Math.sin(a) * wide * square * r.range(0.88, 1.08),
        fx = x + u * c + v * s,
        fz = z - u * s + v * c;
      ring.push([fx, at(fx, fz) + lift, fz]);
    }
    m.face(ring.reverse(), col);
  };
  for (let i = 1; i < track.length - 1; i++) {
    const [x, z] = track[i],
      [qx, qz] = track[i + 1];
    if (x < -15 || Math.abs(land.toBrook(x, z)) < 0.75) continue;
    for (let k = 0; k < 2; k++) {
      const t = k / 2 + r.range(0.1, 0.3),
        fx = lerp(x, qx, t),
        fz = lerp(z, qz, t) + r.range(-0.1, 0.1);
      if (land.gap(fx, fz) < 0.25 || land.toBrook(fx, fz) < 0.75) continue;
      flag(
        fx,
        fz,
        Math.atan2(-(qz - z), qx - x),
        r.range(0.2, 0.27),
        r.range(0.15, 0.2),
        m.mix(r.pick(stones), 0x8f8a76, 0.5)
      );
    }
  }
  // The footbridge: two long slabs on stone abutments.
  let cross = track[0];
  for (const p of track) if (land.toBrook(p[0], p[1]) < land.toBrook(cross[0], cross[1])) cross = p;
  const [bx, bz] = cross,
    deck = Math.max(at(bx - 0.75, bz), at(bx + 0.75, bz)) + 0.07;
  m.frame(bx, deck, bz, -0.07, 1, () => {
    m.box(0, 0, -0.17, 1.7, 0.09, 0.31, 0x8f9088);
    m.box(0.03, 0.004, 0.17, 1.74, 0.09, 0.31, 0x9a9a90);
    for (const [x, z] of [
      [-0.78, -0.2],
      [-0.8, 0.2],
      [0.8, -0.18],
      [0.82, 0.22]
    ])
      m.rock(x, -0.32, z, 0.2, 0.26, 0.2, 0x7b8077, 0x6f7d5f, 6);
  });
  // The forecourt's flags run from the board to the hall door, and aside to the alchemy room.
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 3; j++) {
      const x = hall.x - 1.9 + i * 0.54 + r.range(-0.05, 0.05),
        z = -5.86 - j * 0.5 + r.range(-0.04, 0.04);
      if (r.next() < 0.12) continue;
      flag(x, z, r.range(-0.12, 0.12), 0.25, 0.22, m.mix(r.pick(stones), 0x8f8a76, 0.35), 4, 0.016);
    }
  for (let i = 0; i < 5; i++)
    flag(
      hall.x - 2.6 - i * 0.5,
      -6.75 + r.range(-0.08, 0.08),
      r.range(-0.3, 0.3),
      0.22,
      0.19,
      m.mix(r.pick(stones), 0x8f8a76, 0.35),
      4,
      0.016
    );
}

// A wall of squared stone laid in courses, seen from the side `facing` points to. Its
// mortar bed shows in the joints and inside the door and window openings (`gaps`, each
// [from, to, low, high] along the wall); `gable` adds a gable of that height on top.
function blockWall(
  m,
  a,
  b,
  y0,
  y1,
  facing,
  { gable = 0, gaps = [], long = 0.46, high = 0.2 } = {}
) {
  const r = m.rng,
    [ax, az] = a,
    len = Math.hypot(b[0] - ax, b[1] - az),
    ux = (b[0] - ax) / len,
    uz = (b[1] - az) / len,
    [nx, nz] = facing;
  const at = (s, y, out) => [ax + ux * s + nx * out, y, az + uz * s + nz * out],
    bed = 0x30322d,
    top = y1 + gable;
  m.face([at(0, y0, 0), at(len, y0, 0), at(len, y1, 0), at(0, y1, 0)], bed);
  if (gable) m.face([at(0, y1, 0), at(len, y1, 0), at(len / 2, top, 0)], bed);
  for (let c0 = y0, course = 0; c0 < top - 0.04; course++) {
    let c1 = Math.min(top, c0 + high * r.range(0.88, 1.14));
    if (c0 < y1 && c1 > y1 - 0.07) c1 = y1;
    // Under a gable a course stops where the roof crosses it.
    const inset = gable && c0 >= y1 - 1e-6 ? ((len / 2) * ((c0 + c1) / 2 - y1)) / gable : 0;
    if (inset > len / 2 - 0.1) break;
    const middle = (c0 + c1) / 2,
      holes = gaps.filter(([, , lo, hi]) => middle > lo && middle < hi);
    let s = inset,
      e = inset + long * (course % 2 ? 0.5 : 1) * r.range(0.8, 1.2);
    while (s < len - inset - 0.02) {
      if (len - inset - e < long * 0.35) e = len - inset;
      let pieces = [[s, e]];
      for (const [h0, h1] of holes)
        pieces = pieces.flatMap(([p0, p1]) =>
          p1 <= h0 || p0 >= h1
            ? [[p0, p1]]
            : [
                [p0, h0],
                [h1, p1]
              ].filter(([q0, q1]) => q1 - q0 > 0.04)
        );
      for (const [p0, p1] of pieces) {
        const out = r.range(0.03, 0.055),
          damp = c0 < y0 + 0.5 && r.next() < 0.4,
          tone = m.mix(r.pick(stones), damp ? 0x66755a : 0x70736c, damp ? 0.45 : r.next() * 0.3);
        m.face(
          [
            at(p0 + 0.008, c0 + 0.008, out),
            at(p1 - 0.008, c0 + 0.008, out),
            at(p1 - 0.008, c1 - 0.008, out),
            at(p0 + 0.008, c1 - 0.008, out)
          ],
          tone
        );
      }
      s = e;
      e = s + long * r.range(0.7, 1.35);
    }
    c0 = c1;
  }
}

// One pitch of a roof of split stone slabs laid from the eave up, each course lapping
// the one below it.
function slabPitch(m, x0, x1, zLow, zHigh, yLow, yHigh, rows) {
  const r = m.rng;
  m.face(
    [
      [x0, yLow - 0.012, zLow],
      [x1, yLow - 0.012, zLow],
      [x1, yHigh - 0.012, zHigh],
      [x0, yHigh - 0.012, zHigh]
    ],
    0x3b3f40
  );
  for (let k = 0; k < rows; k++) {
    const t0 = k / rows,
      t1 = Math.min(1, (k + 1) / rows + 0.05);
    const z0 = lerp(zLow, zHigh, t0),
      z1 = lerp(zLow, zHigh, t1),
      y0 = lerp(yLow, yHigh, t0) + 0.04,
      y1 = lerp(yLow, yHigh, t1) + 0.006;
    let x = x0 - r.range(0, 0.12);
    while (x < x1 - 0.05) {
      const e = Math.min(x1 + 0.02, x + r.range(0.3, 0.55)),
        from = Math.max(x0 - 0.02, x) + 0.008,
        tone = m.mix(r.pick(slates), r.next() < 0.14 ? 0x66755a : 0x2c2e2c, r.range(0, 0.22)),
        lift = r.range(0, 0.016);
      m.face(
        [
          [from, y0 + lift, z0],
          [e - 0.008, y0 + lift, z0],
          [e - 0.008, y1, z1],
          [from, y1, z1]
        ],
        tone
      );
      // The split edge of the slab.
      m.face(
        [
          [from, y0 + lift, z0],
          [e - 0.008, y0 + lift, z0],
          [e - 0.008, y0 - 0.045, z0],
          [from, y0 - 0.045, z0]
        ],
        m.mix(tone, 0x2a2c2b, 0.5)
      );
      x = e;
    }
  }
}

// A plank door hung in a dressed-stone frame: jambs, a lintel, iron straps and a ring.
function plankDoor(m, x, y, z, w, h, leaves) {
  const wood = 0x4d3828,
    iron = 0x2b2c2c,
    dressed = 0xa7a69d;
  for (const side of [-1, 1])
    m.box(x + side * (w / 2 + 0.07), y + h / 2, z + 0.05, 0.15, h, 0.2, dressed);
  m.box(x, y + h + 0.1, z + 0.06, w + 0.5, 0.2, 0.24, m.mix(dressed, 0x8d8f88, 0.4));
  const each = w / leaves;
  for (let k = 0; k < leaves; k++) {
    const cx = x - w / 2 + each * (k + 0.5);
    m.box(
      cx,
      y + h / 2,
      z + 0.02,
      each - 0.012,
      h - 0.01,
      0.05,
      k % 2 ? wood : m.mix(wood, 0x6a4c34, 0.3)
    );
    for (const t of [0.16, 0.5, 0.84])
      m.box(cx, y + h * t, z + 0.05, each - 0.04, 0.04, 0.014, iron);
    for (let j = 1; j < 3; j++)
      m.box(cx - each / 2 + (each * j) / 3, y + h / 2, z + 0.046, 0.012, h - 0.04, 0.008, 0x35261b);
    const hand = leaves > 1 ? (k ? -1 : 1) : 1;
    m.hoop(cx + hand * (each / 2 - 0.1), y + h * 0.5, z + 0.07, 0.045, 0.009, 0x8a7a55, 6, 'xy');
  }
}

// A small window: a dark opening behind upright stone bars, on a stone sill.
function barredWindow(m, x, y, z, w, h) {
  m.box(x, y - 0.03, z + 0.05, w + 0.16, 0.06, 0.16, 0xa7a69d);
  m.box(x, y + h + 0.04, z + 0.05, w + 0.2, 0.08, 0.14, 0x9a9b93);
  for (let k = 0; k < 3; k++)
    m.box(x - w / 2 + (w * (k + 0.5)) / 3, y + h / 2, z + 0.03, 0.04, h, 0.04, 0x8d8f88);
}

// The valley master's house: a hall of grey squared stone under a roof of stone slabs,
// its heavy door facing the board; against its west gable the low alchemy room, whose
// chimney carries a thin thread of smoke. Drawn about the middle of the hall's front
// wall, at terrace level, the board toward +z.
function stoneHouse(m) {
  const r = m.rng,
    footing = 0x767a72;
  // The hall.
  const W = 1.9,
    D = 2.5,
    base = 0.24,
    eave = base + 1.9,
    rise = 0.86;
  m.box(0, base / 2 - 0.1, -D / 2, 2 * W + 0.3, base + 0.2, D + 0.3, footing);
  const doorTop = base + 1.42,
    sill = base + 0.9;
  blockWall(m, [-W, 0], [W, 0], base, eave, [0, 1], {
    gaps: [
      [W - 0.5, W + 0.5, base - 1, doorTop],
      [W - 1.5, W - 1.0, sill, sill + 0.42],
      [W + 1.0, W + 1.5, sill, sill + 0.42]
    ]
  });
  blockWall(m, [W, 0], [W, -D], base, eave, [1, 0], { gable: rise });
  blockWall(m, [W, -D], [-W, -D], base, eave, [0, -1]);
  blockWall(m, [-W, -D], [-W, 0], base, eave, [-1, 0], { gable: rise });
  // Long quoins bind the corners, stopping under the eave.
  for (const [x, z] of [
    [-W, 0],
    [W, 0],
    [W, -D],
    [-W, -D]
  ])
    for (let y = base, k = 0; y < eave - 0.12; k++) {
      const h = Math.min(0.3, eave - 0.1 - y);
      m.box(
        x,
        y + h / 2,
        z,
        0.19 + (k % 2) * 0.05,
        h - 0.012,
        0.19 + ((k + 1) % 2) * 0.05,
        m.mix(0xa5a39a, 0x878b82, r.next())
      );
      y += h;
    }
  plankDoor(m, 0, base, 0, 0.96, 1.42, 2);
  barredWindow(m, -1.25, sill, 0, 0.5, 0.42);
  barredWindow(m, 1.25, sill, 0, 0.5, 0.42);
  // Two worn steps up to the threshold.
  m.box(0, base - 0.06, 0.33, 1.5, 0.12, 0.36, 0x9a9b93);
  m.box(0, base - 0.18, 0.6, 1.9, 0.12, 0.4, 0x8d8f88);
  const over = 0.3,
    drop = (rise / (D / 2)) * over,
    ridge = eave + rise + 0.03;
  slabPitch(m, -W - 0.22, W + 0.22, over, -D / 2, eave - drop + 0.03, ridge, 6);
  slabPitch(m, -W - 0.22, W + 0.22, -D - over, -D / 2, eave - drop + 0.03, ridge, 6);
  // Ridge stones cap the meeting of the pitches.
  for (let x = -W - 0.2; x < W + 0.1; x += 0.45)
    m.box(x + 0.22, ridge + 0.035, -D / 2, 0.43, 0.11, 0.2, m.mix(0x5f666a, 0x747a7b, r.next()));
  // The alchemy room against the west gable, lower and set back a little.
  const x1 = -W,
    x0 = -W - 2.4,
    zf = -0.3,
    zb = -2.3,
    low = 0.18,
    lowEave = low + 1.3,
    lowRise = 0.62,
    zm = (zf + zb) / 2;
  m.box((x0 + x1) / 2, low / 2 - 0.1, zm, x1 - x0 + 0.2, low + 0.2, zf - zb + 0.3, footing);
  const lowDoor = low + 1.12;
  blockWall(m, [x0, zf], [x1, zf], low, lowEave, [0, 1], {
    long: 0.4,
    gaps: [
      [0.75, 1.4, low - 1, lowDoor],
      [1.75, 2.1, low + 0.75, low + 1.05]
    ]
  });
  blockWall(m, [x1, zb], [x0, zb], low, lowEave, [0, -1], { long: 0.4 });
  blockWall(m, [x0, zb], [x0, zf], low, lowEave, [-1, 0], { long: 0.4, gable: lowRise });
  for (const z of [zf, zb]) m.box(x0, low + 0.6, z, 0.2, 1.2, 0.2, 0x9a9b93);
  plankDoor(m, x0 + 1.075, low, zf, 0.62, 1.12, 1);
  barredWindow(m, x0 + 1.925, low + 0.75, zf, 0.35, 0.3);
  m.box(x0 + 1.075, low - 0.06, zf + 0.3, 0.95, 0.12, 0.34, 0x8d8f88);
  const lowDrop = (lowRise / ((zf - zb) / 2)) * 0.24,
    lowRidge = lowEave + lowRise + 0.03;
  slabPitch(m, x0 - 0.18, x1 - 0.02, zf + 0.24, zm, lowEave - lowDrop + 0.03, lowRidge, 5);
  slabPitch(m, x0 - 0.18, x1 - 0.02, zb - 0.24, zm, lowEave - lowDrop + 0.03, lowRidge, 5);
  for (let x = x0 - 0.16; x < x1 - 0.3; x += 0.45)
    m.box(x + 0.22, lowRidge + 0.03, zm, 0.43, 0.1, 0.18, m.mix(0x5f666a, 0x747a7b, r.next()));
  // The furnace chimney climbs the gable: a square stack under a slab cap on four stones.
  const cx = x0 - 0.2,
    stack = 3.0;
  for (const [a, b, f] of [
    [
      [cx - 0.22, zm + 0.22],
      [cx + 0.22, zm + 0.22],
      [0, 1]
    ],
    [
      [cx + 0.22, zm - 0.22],
      [cx - 0.22, zm - 0.22],
      [0, -1]
    ],
    [
      [cx - 0.22, zm - 0.22],
      [cx - 0.22, zm + 0.22],
      [-1, 0]
    ],
    [
      [cx + 0.22, zm + 0.22],
      [cx + 0.22, zm - 0.22],
      [1, 0]
    ]
  ])
    blockWall(m, a, b, -0.1, stack, f, { long: 0.3, high: 0.22 });
  m.box(cx, stack + 0.02, zm, 0.56, 0.06, 0.56, 0x80837c);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      m.box(cx + sx * 0.2, stack + 0.11, zm + sz * 0.2, 0.1, 0.12, 0.1, 0x878b82);
  m.box(cx, stack + 0.2, zm, 0.66, 0.07, 0.66, 0x6b7175);
  m.box(cx, stack + 0.06, zm, 0.3, 0.02, 0.3, 0x1f1f1e);
  // A thin thread of smoke drifts up and away on the still air.
  const smoke = [];
  for (let k = 0; k <= 9; k++) {
    const t = k / 9;
    smoke.push([
      cx + 0.5 * t * t + 0.07 * Math.sin(k * 1.9),
      stack + 0.2 + 2.3 * t,
      zm - 0.35 * t * t + 0.06 * Math.cos(k * 1.4)
    ]);
  }
  for (let k = 0; k < 9; k++)
    m.tube(
      smoke[k],
      smoke[k + 1],
      0.012 + 0.0045 * k,
      0.012 + 0.0045 * (k + 1),
      m.mix(0xbfbcb6, 0xdcd7d1, k / 9),
      5
    );
  // Before the alchemy room: a bronze cauldron on three legs, split firewood against
  // the wall, a water vat, and herbs hung to dry on a rack.
  m.frame(x0 + 0.3, -0.02, 0.75, 0, 1, () => {
    const bronze = 0x6f7a5c;
    for (let k = 0; k < 3; k++) {
      const a = (k * circle) / 3 + 0.5;
      m.tube(
        [Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17],
        [Math.cos(a) * 0.14, 0.24, Math.sin(a) * 0.14],
        0.026,
        0.034,
        bronze,
        5
      );
    }
    m.lathe(
      0,
      0.2,
      0,
      [
        [0, 0.1],
        [0.06, 0.2],
        [0.2, 0.24],
        [0.33, 0.2],
        [0.37, 0.215],
        [0.4, 0.15],
        [0.5, 0.06],
        [0.56, 0.07],
        [0.6, 0.002]
      ],
      bronze,
      9
    );
    m.hoop(0, 0.42, 0, 0.228, 0.012, 0x9aa37a, 9);
    for (const side of [-1, 1]) m.hoop(side * 0.235, 0.47, 0, 0.05, 0.012, bronze, 6, 'xy');
  });
  for (let k = 0; k < 9; k++) {
    const row = k % 4,
      tier = Math.floor(k / 4);
    m.tube(
      [x1 - 0.42 + row * 0.085 - tier * 0.04, 0.03 + tier * 0.085, zf + 0.09],
      [x1 - 0.42 + row * 0.085 - tier * 0.04, 0.03 + tier * 0.085, zf + 0.5],
      0.042,
      0.042,
      m.mix(0x8a6a48, 0xb08a5c, r.next()),
      5
    );
  }
  m.lathe(
    W + 0.45,
    -0.04,
    0.35,
    [
      [0, 0.17],
      [0.2, 0.27],
      [0.42, 0.26],
      [0.52, 0.19],
      [0.56, 0.21],
      [0.5, 0.17]
    ],
    0x6e5a4a,
    9
  );
  m.lathe(
    W + 0.45,
    0.44,
    0.35,
    [
      [0, 0.002],
      [0.002, 0.17]
    ],
    0x2f4a44,
    9
  );
  m.frame(x0 - 0.1, -0.04, 1.35, 0.5, 1, () => {
    for (const x of [-0.5, 0.5]) m.tube([x, 0, 0], [x, 0.95, 0], 0.025, 0.022, 0x7c6a48, 5);
    m.tube([-0.58, 0.9, 0], [0.58, 0.9, 0], 0.02, 0.02, 0x8a7650, 5);
    for (let k = 0; k < 6; k++) {
      const x = -0.4 + k * 0.16,
        l = r.range(0.22, 0.34);
      m.tube(
        [x, 0.88, 0],
        [x, 0.88 - l, 0],
        0.012,
        0.045,
        r.pick([0x6d8050, 0x8a8a52, 0x59704a, 0x9a7f52]),
        5
      );
    }
  });
}

// The crag in the north and its thin waterfall, leaping clear of the rock into the
// plunge pool the brook rises from.
function cascade(m, land, at) {
  const r = m.rng,
    [px, pz] = plunge,
    cx = px + 0.1,
    cz = pz - 1.95,
    base = at(cx, cz) - 0.6,
    high = 3.4,
    cap = m.mix(crag, mossy, 0.6);
  m.rock(cx, base, cz, 1.9, high, 1.2, crag, cap, 11, 0.3);
  m.rock(cx - 1.9, base + 0.2, cz + 0.1, 1.25, 2.3, 1.0, m.mix(crag, 0x696e68, 0.4), cap, 9, 1.1);
  m.rock(cx + 1.75, base + 0.1, cz + 0.05, 1.1, 2.6, 0.95, m.mix(crag, 0x8a8e86, 0.4), cap, 9, 2);
  m.rock(cx - 3.2, base + 0.2, cz + 0.5, 0.8, 1.3, 0.7, crag, cap, 8, 0.7);
  m.rock(cx + 2.5, base + 0.4, cz - 1.0, 1.0, 2.0, 0.9, crag, cap, 8, 2.6);
  m.rock(cx - 0.4, base + 0.6, cz - 1.5, 1.6, 2.3, 1.1, m.mix(crag, 0x696e68, 0.3), cap, 8, 1.6);
  // Boulders ring the plunge pool.
  for (let k = 0; k < 9; k++) {
    const a = 0.5 + (k * (circle - 1.9)) / 8 + Math.PI * 0.5,
      d = r.range(0.85, 1.05),
      s = r.range(0.16, 0.34),
      x = px + Math.cos(a) * d,
      z = pz + Math.sin(a) * d * 0.9;
    m.rock(x, land.basin - 0.08, z, s, s * r.range(0.7, 1.3), s * 0.85, crag, cap, 6);
  }
  // The lip the water leaves by, and the fall itself.
  const top = base + high,
    lipZ = cz + 0.66;
  m.rock(cx, top - 0.7, lipZ, 0.42, 0.6, 0.34, crag, cap, 7);
  const y0 = top - 0.06,
    z0 = lipZ + 0.2,
    y1 = land.basin + 0.05,
    z1 = pz - 0.1;
  const pale = m.rgb(0xcfe2de),
    white = m.rgb(0xf6faf8);
  m.face(
    [
      [cx - 0.1, y0 + 0.01, lipZ - 0.3],
      [cx + 0.1, y0 + 0.01, lipZ - 0.3],
      [cx + 0.1, y0, z0],
      [cx - 0.1, y0, z0]
    ],
    [pale, pale, white, white]
  );
  let last;
  for (let k = 0; k <= 10; k++) {
    const t = k / 10,
      y = lerp(y0, y1, t * t * 0.35 + t * 0.65),
      z = z0 + (z1 - z0) * Math.sqrt((y0 - y) / (y0 - y1)),
      w = 0.1 + 0.1 * t,
      sway = 0.03 * Math.sin(k * 1.7);
    const row = [
      [cx - w + sway, y, z - 0.03],
      [cx - w * 0.35 + sway, y, z + 0.02],
      [cx + w * 0.35 + sway, y, z + 0.02],
      [cx + w + sway, y, z - 0.03]
    ];
    if (last)
      for (let i = 0; i < 3; i++)
        m.face(
          [last[i], row[i], row[i + 1], last[i + 1]],
          i === 1 ? white : [pale, pale, white, white]
        );
    last = row;
  }
  // Spray hangs where it strikes.
  for (const [dx, dz, s] of [
    [0, 0, 0.3],
    [-0.25, 0.12, 0.2],
    [0.22, 0.1, 0.22]
  ])
    clump(m, cx + dx, y1 + s * 0.3, z1 + dz, s, s * 0.6, s, 0xd3e3df, 0xf4f8f6, 6);
  // A pine has found a hold on the crag's shoulder.
  pine(m, cx - 1.75, base + 2.3, cz + 0.1, 1.4);
  fern(m, cx + 0.9, y1 + 0.1, z1 + 0.1, 0.3);
  fern(m, cx - 1.0, y1 + 0.1, z1 + 0.2, 0.3);
}

// The valley's boundary stone stands by the footbridge, its three characters cut and
// painted red on the face toward the board.
function boundaryStone(m, at) {
  const x = -9.75,
    z = -0.75;
  m.frame(x, at(x, z) - 0.05, z, 1.1, 1, () => {
    m.rock(0, 0, 0, 0.34, 0.16, 0.24, 0x7c8288, 0x6f7d66, 7);
    m.box(0, 0.62, 0, 0.36, 1.0, 0.13, 0x8f959a);
    m.box(0, 1.14, 0, 0.3, 0.06, 0.11, 0x83898d);
    for (let k = 0; k < 3; k++) {
      const y = 0.92 - k * 0.27;
      m.box(0, y, 0.068, 0.15, 0.022, 0.006, 0xa8332c);
      m.box(0, y - 0.07, 0.068, 0.11, 0.022, 0.006, 0xa8332c);
      m.box(k % 2 ? 0.035 : -0.02, y - 0.035, 0.068, 0.022, 0.15, 0.006, 0xa8332c);
      m.box(k % 2 ? -0.05 : 0.055, y - 0.1, 0.068, 0.022, 0.07, 0.006, 0xa8332c);
    }
  });
  fern(m, x + 0.3, at(x + 0.3, z + 0.25), z + 0.25, 0.22);
}

// Which side of the valley a spot lies on: 0 north, 1 west, 2 east and south.
function sideOf(x, z) {
  const len = Math.hypot(x, z) || 1;
  if (-z / len > 0.62) return 0;
  return x < 0 && z / len < 0.8 ? 1 : 2;
}

// The woods of one side of the valley: broadleaf trees, firs and a few old pines on the
// slopes, with underwood and outcrops of rock among them.
function woods(m, land, at, side, count) {
  const r = m.rng,
    stood = [];
  const free = (x, z, margin) =>
    land.toBrook(x, z) > 0.9 + margin &&
    land.toTrack(x, z) > 1.2 + margin &&
    land.toTerrace(x, z) > 0.5 + margin &&
    Math.hypot((x - plunge[0]) / 4.2, (z - plunge[1] + 1.3) / 2.8) > 1;
  // Trees keep to the slopes; nothing tall stands close on the sides of the board
  // the opening view looks across.
  const need = (x, z) => (side === 0 ? 3 : side === 1 ? 3.6 : z > land.halfZ ? 8 : 5.4);
  for (let tries = 0; tries < 4000 && stood.length < count; tries++) {
    const x = r.range(-15.5, 15.5),
      z = r.range(-15, 15);
    if (sideOf(x, z) !== side || !free(x, z, 0)) continue;
    const d = land.gap(x, z),
      h = at(x, z);
    if (d < need(x, z) || (h < 0.1 && r.next() > 0.06)) continue;
    if (stood.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 1.25)) continue;
    stood.push([x, z]);
    const y = Math.min(h, at(x + 0.3, z), at(x - 0.3, z), at(x, z + 0.3), at(x, z - 0.3)),
      size = r.range(2.3, 3.5) * (side === 2 ? 0.8 : 1),
      kind = r.next();
    if (kind < 0.3) fir(m, x, y, z, size * 1.12);
    else if (kind < 0.38) pine(m, x, y, z, size * 0.92);
    else broadleaf(m, x, y, z, size);
  }
  // Underwood fills the foot of the slope, and rock breaks through it.
  for (let k = 0; k < count * 1.6; k++) {
    const x = r.range(-15, 15),
      z = r.range(-14.5, 14.5);
    if (sideOf(x, z) !== side || !free(x, z, -0.2)) continue;
    const d = land.gap(x, z),
      y = at(x, z);
    if (d < need(x, z) - 0.8 || y < -0.05) continue;
    if (r.next() < 0.36) {
      const s = r.range(0.3, 0.75);
      m.rock(
        x,
        y - s * 0.25,
        z,
        s,
        s * r.range(0.7, 1.5),
        s * r.range(0.6, 0.9),
        m.mix(crag, 0x8a8e86, r.next() * 0.5),
        m.mix(crag, mossy, r.range(0.3, 0.8)),
        7,
        r.range(0, 3)
      );
    } else {
      const s = r.range(0.3, 0.55),
        [shade, light] = r.pick(leafy);
      clump(m, x, y + s * 0.3, z, s, s * 0.7, s * r.range(0.8, 1), shade, light, 6);
    }
  }
}

// Drifts of 情花 round the board: taller on the far sides, kept low on the near ones;
// mossed boulders lie among them.
function drifts(m, land, at) {
  const r = m.rng,
    stood = [];
  for (let tries = 0; tries < 3600 && stood.length < 68; tries++) {
    const x = r.range(-10.5, 11.5),
      z = r.range(-9.2, 10.5),
      d = land.gap(x, z);
    const near = z > land.halfZ - 0.3 || x > land.halfX - 0.3;
    if (d < (near ? 0.8 : 0.5) || d > (near ? 5 : 3.3) || land.inPool(x, z)) continue;
    if (land.toBrook(x, z) < 0.75 || land.toTrack(x, z) < 0.75) continue;
    if (x > 0.9 && x < 7.7 && z < -5.3) continue;
    // The bushes grow in drifts, not evenly.
    if (noise(x * 0.55 + 21, z * 0.55 - 8) < 0.42 + 0.06 * (d - 0.5)) continue;
    if (stood.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 0.46)) continue;
    stood.push([x, z]);
    const h = near ? r.range(0.26, 0.4) : r.range(0.4, 0.72),
      spread = Math.min(h * r.range(0.7, 0.9), d - 0.12),
      y = at(x, z) - 0.02;
    loveBush(m, x, y, z, h, spread, stood.length % 3 === 0);
    petals(m, x, y + 0.04, z, h * 1.3, 3);
  }
  for (let k = 0; k < 34; k++) {
    const x = r.range(-10, 11),
      z = r.range(-9, 10),
      d = land.gap(x, z);
    if (d < 0.7 || d > 4 || land.inPool(x, z)) continue;
    if (land.toBrook(x, z) < 0.8 || land.toTrack(x, z) < 0.7) continue;
    if (x > 0.9 && x < 7.7 && z < -5.3) continue;
    if (stood.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 0.45)) continue;
    const s = r.range(0.14, 0.3);
    m.rock(
      x,
      at(x, z) - 0.05,
      z,
      s,
      s * r.range(0.7, 1.2),
      s * r.range(0.7, 0.95),
      r.pick(stones),
      m.mix(0x8d8f88, mossy, r.range(0.4, 0.9)),
      6,
      r.range(0, 3)
    );
    if (k % 2) fern(m, x + s * 0.9, at(x + s * 0.9, z) - 0.01, z + s * 0.4, 0.2);
  }
}

// The far valley walls: a ring of green cliffs with bare rock at their crests, the
// woods thinning up their feet, and a far waterfall, all in haze.
function farWalls(m, at) {
  const r = m.rng,
    columns = 72,
    rows = [
      [0.9, -0.06],
      [1.08, 0.6],
      [1.24, 0.9],
      [1.4, 1],
      [1.6, 0.62],
      [1.95, 0.1]
    ];
  const wood = m.rgb(0x3f5a40),
    high = m.rgb(0x587352),
    bare = m.rgb(0x8c938a),
    pale = m.rgb(0xa3aaa0);
  const edge = (a) =>
    Math.min(27 / Math.abs(Math.cos(a) || 1e-6), 26 / Math.abs(Math.sin(a) || 1e-6));
  const grid = [];
  for (let i = 0; i < columns; i++) {
    const a = (i * circle) / columns,
      c = Math.cos(a),
      s = Math.sin(a),
      reach = edge(a);
    // The walls stand highest in the north and lowest over the valley mouth in the south-east.
    const top =
        (8 + 3 * Math.max(0, -s) + 4 * noise(i * 0.31, 4.2)) *
        (0.7 + 0.3 * fade((Math.abs(a - 1.12) - 0.12) / 0.5)),
      peak = 1 + 0.3 * (hash(i, 7) - 0.3);
    grid.push(
      rows.map(([q, f], k) => {
        const rr = reach * q + (k ? r.range(-0.6, 0.6) : 0),
          y = k === 3 ? top * peak : top * f * (0.9 + 0.2 * r.next());
        const tone =
          k < 2
            ? wood
            : k === 2
              ? between(high, bare, r.next() * 0.7)
              : k === 3
                ? between(bare, pale, r.next())
                : between(high, bare, 0.5);
        return [[c * rr, y - 0.4, s * rr], tone];
      })
    );
  }
  for (let i = 0; i < columns; i++) {
    const a = grid[i],
      b = grid[(i + 1) % columns];
    for (let k = 0; k < rows.length - 1; k++)
      m.face(
        [a[k][0], b[k][0], b[k + 1][0], a[k + 1][0]],
        [a[k][1], b[k][1], b[k + 1][1], a[k + 1][1]]
      );
  }
  // A far fall hangs down the north-west wall, from its crest to the woods at its foot.
  const fall = Math.round((4.05 / circle) * columns),
    fc = Math.cos((fall * circle) / columns),
    fs = Math.sin((fall * circle) / columns),
    white = m.rgb(0xeef3f1);
  let last;
  for (let k = 3; k >= 1; k--) {
    const [x, y, z] = grid[fall][k][0],
      w = 0.16 + 0.07 * (3 - k),
      row = [
        [x - fc * 0.35 + fs * w, y + 0.1, z - fs * 0.35 - fc * w],
        [x - fc * 0.35 - fs * w, y + 0.1, z - fs * 0.35 + fc * w]
      ];
    if (last) m.face([last[0], row[0], row[1], last[1]], white);
    last = row;
  }
  // Woods climb the slopes below the walls: far crowns and dark firs.
  for (let k = 0; k < 360; k++) {
    const x = r.range(-27, 27),
      z = r.range(-26, 26);
    if (Math.max(Math.abs(x), Math.abs(z)) < 15.5) continue;
    const y = at(x, z);
    if (y < 0.3 && r.next() > 0.1) continue;
    const size = r.range(2.2, 3.6);
    if (r.next() < 0.3) {
      const [shade, light] = r.pick(needles);
      for (let t = 0; t < 2; t++) {
        const base = y + size * (0.1 + 0.3 * t),
          w = size * (0.3 - 0.09 * t),
          turn = r.range(0, circle);
        for (let i = 0; i < 5; i++) {
          const a0 = turn + (i * circle) / 5,
            a1 = turn + ((i + 1) * circle) / 5;
          m.face(
            [
              [x, base + size * 0.5, z],
              [x + Math.cos(a1) * w, base, z + Math.sin(a1) * w],
              [x + Math.cos(a0) * w, base, z + Math.sin(a0) * w]
            ],
            [m.rgb(light), m.rgb(shade), m.rgb(shade)]
          );
        }
      }
    } else {
      const [shade, light] = r.pick(leafy),
        s = size * r.range(0.36, 0.46);
      clump(m, x, y + size * 0.42, z, s, s * 0.8, s * 0.95, shade, light, 5);
    }
  }
}

// 情花叢: thorn bushes in full blossom along the back of the tile, a low sprig at one
// side, petals fallen on the flags.
function loveFlowerTile(m) {
  const r = m.rng,
    count = 2 + (r.next() < 0.3 ? 1 : 0);
  for (let j = 0; j < count; j++) {
    const x = -0.36 + (0.72 * (j + r.range(0.25, 0.75))) / count,
      z = r.range(-0.36, -0.24),
      h = r.range(0.32, 0.5) * (count === 3 ? 0.9 : 1);
    loveBush(m, x, 0.04, z, h, r.range(0.2, 0.25), true);
  }
  const side = r.next() < 0.5 ? -1 : 1;
  loveBush(
    m,
    side * r.range(0.37, 0.42),
    0.04,
    r.range(-0.06, 0.12),
    r.range(0.17, 0.23),
    0.11,
    false,
    2
  );
  petals(m, 0, 0.047, 0, 0.45, 7);
}

// 斷腸草圃: a tilled bed round the back and sides of the tile, set with slender dark
// plants in small purple flower.
function heartbreakBed(m) {
  const r = m.rng,
    soil = [0x5f5540, 0x6a5d46, 0x585039],
    violet = [
      [0x6a3f9c, 0xa884d6],
      [0x7b4fb0, 0xc3a3e6],
      [0x5a3590, 0x9670c8]
    ];
  for (const [x, z, w, d] of [
    [0, -0.33, 0.9, 0.24],
    [-0.36, 0.04, 0.2, 0.5],
    [0.36, 0.04, 0.2, 0.5]
  ])
    m.box(x, 0.044, z, w, 0.012, d, r.pick(soil));
  // A row of edging stones holds the bed.
  for (let k = 0; k < 7; k++)
    m.rock(
      -0.39 + k * 0.13,
      0.04,
      -0.2 + r.range(-0.01, 0.01),
      0.05,
      0.035,
      0.03,
      0x8a8c84,
      0x9a9b93,
      5
    );
  const spots = [];
  for (let k = 0; k < 7; k++)
    spots.push([-0.39 + k * 0.13 + r.range(-0.02, 0.02), r.range(-0.42, -0.28)]);
  for (const side of [-1, 1])
    for (let k = 0; k < 4; k++) spots.push([side * r.range(0.31, 0.42), -0.16 + k * 0.13]);
  for (const [x, z] of spots) {
    const turn = r.range(0, circle);
    for (let j = 0; j < 5; j++) {
      const a = turn + (j * circle) / 5 + r.range(-0.3, 0.3),
        out = r.range(0.03, 0.075),
        high = r.range(0.1, 0.2);
      m.face(
        [
          [x - Math.sin(a) * 0.012, 0.05, z + Math.cos(a) * 0.012],
          [x + Math.cos(a) * out, 0.05 + high, z + Math.sin(a) * out],
          [x + Math.sin(a) * 0.012, 0.05, z - Math.cos(a) * 0.012]
        ],
        r.pick([0x2e4d3a, 0x37593f, 0x284436, 0x416647])
      );
    }
    for (let j = 0; j < 2; j++) {
      const a = r.range(0, circle),
        top = [x + Math.cos(a) * 0.035, 0.05 + r.range(0.17, 0.25), z + Math.sin(a) * 0.035];
      m.face([[x - 0.006, 0.05, z], top, [x + 0.006, 0.05, z]], 0x3f6147);
      blossom(m, top[0], top[1], top[2], 0.03, a, 0.5, r.pick(violet));
    }
  }
}

// 谷壁巨石: a tall grey boulder of the valley wall, mossed on its shoulders, ferns at its foot.
function wallBoulder(m, p) {
  const r = m.rng,
    grey = m.mix(p[2], 0x848a84, 0.6),
    cap = m.mix(grey, mossy, 0.75);
  m.rock(-0.04, 0.02, -0.06, 0.4, r.range(1.0, 1.25), 0.34, grey, cap, 9, r.range(0, 3));
  m.rock(
    0.25,
    0.03,
    0.2,
    0.19,
    r.range(0.32, 0.45),
    0.16,
    m.mix(grey, 0x5f645f, 0.3),
    cap,
    7,
    r.range(0, 3)
  );
  m.rock(-0.3, 0.03, 0.26, 0.13, 0.2, 0.12, grey, cap, 6);
  // Moss creeps down the faces in patches.
  for (let k = 0; k < 6; k++) {
    const a = r.range(0, circle),
      y = r.range(0.45, 0.95),
      q = 0.39 * lerp(1, 0.84, y / 1.1),
      x = -0.04 + Math.cos(a) * q,
      z = -0.06 + Math.sin(a) * q * 0.85;
    clump(m, x, y, z, 0.07, 0.05, 0.07, 0x4f6b41, 0x7a9655, 5);
  }
  fern(m, 0.08, 0.04, 0.33, 0.17);
  fern(m, -0.4, 0.04, 0.02, 0.14);
}

// 丹房藥櫃: a tall cabinet of small labelled drawers, jars and a gourd on its top, a
// mortar on a stool before it.
function medicineCabinet(m) {
  const r = m.rng,
    wood = 0x6b4a33,
    dark = 0x493223,
    brass = 0xc9a45c,
    zf = -0.04;
  for (const x of [-0.33, 0.33])
    for (const z of [-0.34, -0.08]) m.box(x, 0.075, z, 0.06, 0.07, 0.06, dark);
  m.box(0, 0.56, -0.21, 0.76, 0.92, 0.34, wood);
  m.box(0, 0.125, -0.21, 0.8, 0.05, 0.38, dark);
  m.box(0, 1.04, -0.21, 0.84, 0.05, 0.42, dark);
  const columns = 6,
    rows = 7,
    w = 0.7 / columns,
    h = 0.84 / rows;
  for (let i = 0; i < columns; i++)
    for (let j = 0; j < rows; j++) {
      const x = -0.35 + w * (i + 0.5),
        y = 0.16 + h * (j + 0.5),
        tone = m.mix(0x8a6540, 0x9c744a, r.next());
      m.face(
        [
          [x - w / 2 + 0.008, y - h / 2 + 0.008, zf + 0.012],
          [x + w / 2 - 0.008, y - h / 2 + 0.008, zf + 0.012],
          [x + w / 2 - 0.008, y + h / 2 - 0.008, zf + 0.012],
          [x - w / 2 + 0.008, y + h / 2 - 0.008, zf + 0.012]
        ],
        tone
      );
      // A paper label, and a brass pull under it.
      m.face(
        [
          [x - 0.026, y + 0.004, zf + 0.015],
          [x + 0.026, y + 0.004, zf + 0.015],
          [x + 0.026, y + 0.04, zf + 0.015],
          [x - 0.026, y + 0.04, zf + 0.015]
        ],
        r.next() < 0.14 ? 0xb5483a : 0xe3d6b3
      );
      m.face(
        [
          [x - 0.011, y - 0.034, zf + 0.018],
          [x + 0.011, y - 0.034, zf + 0.018],
          [x, y - 0.012, zf + 0.022]
        ],
        brass
      );
    }
  // Jars of physic and a dried gourd stand on top.
  const jar = (x, z, s, col) => {
    m.lathe(
      x,
      1.065,
      z,
      [
        [0, 0.05 * s],
        [0.05 * s, 0.075 * s],
        [0.13 * s, 0.07 * s],
        [0.17 * s, 0.035 * s],
        [0.19 * s, 0.045 * s]
      ],
      col,
      7
    );
    m.box(x, 1.065 + 0.2 * s, z, 0.07 * s, 0.03 * s, 0.07 * s, 0xb5483a);
  };
  jar(-0.26, -0.2, 1, 0x4f6f78);
  jar(-0.08, -0.26, 0.8, 0xd9d3c0);
  jar(0.07, -0.16, 0.9, 0x7c5a44);
  m.lathe(
    0.27,
    1.065,
    -0.22,
    [
      [0, 0.03],
      [0.04, 0.085],
      [0.1, 0.08],
      [0.14, 0.035],
      [0.17, 0.055],
      [0.21, 0.045],
      [0.25, 0.012]
    ],
    0xc8a85a,
    7
  );
  // A stool with a bronze mortar and its pestle; a tray of gathered herbs beside it.
  m.box(0.24, 0.12, 0.24, 0.24, 0.03, 0.2, 0x8a6540);
  for (const x of [0.15, 0.33])
    for (const z of [0.17, 0.31]) m.box(x, 0.07, z, 0.03, 0.08, 0.03, dark);
  m.lathe(
    0.24,
    0.135,
    0.24,
    [
      [0, 0.045],
      [0.02, 0.06],
      [0.09, 0.075],
      [0.1, 0.065],
      [0.04, 0.05]
    ],
    0x8f8a5c,
    8
  );
  m.tube([0.25, 0.17, 0.24], [0.31, 0.3, 0.2], 0.014, 0.02, 0xa9a48a, 5);
  m.lathe(
    -0.2,
    0.04,
    0.24,
    [
      [0, 0.13],
      [0.035, 0.16],
      [0.045, 0.15],
      [0.02, 0.13]
    ],
    0xb59a62,
    9
  );
  for (let k = 0; k < 9; k++) {
    const a = r.range(0, circle),
      d = r.range(0, 0.09),
      x = -0.2 + Math.cos(a) * d,
      z = 0.24 + Math.sin(a) * d;
    blade(
      m,
      [x, 0.07, z],
      [x + Math.cos(a * 3) * 0.06, 0.085, z + Math.sin(a * 3) * 0.06],
      0.016,
      0x56753f,
      0x86a058
    );
  }
}

// 谷中山石: low mossed rocks across the back of the tile, grass between them.
function valleyRocks(m, p) {
  const r = m.rng,
    grey = m.mix(p[2], 0x848a84, 0.55);
  for (let j = 0; j < 4; j++) {
    const x = -0.34 + j * 0.2 + r.range(-0.03, 0.03),
      z = -0.3 + r.range(-0.08, 0.1),
      a = r.range(0.1, 0.18);
    m.rock(
      x,
      0.04,
      z,
      a,
      r.range(0.14, 0.3),
      a * r.range(0.75, 1.05),
      m.mix(grey, 0x6a6f69, r.next() * 0.4),
      m.mix(grey, mossy, r.range(0.35, 0.9)),
      6,
      r.range(0, 3)
    );
  }
  for (let j = 0; j < 4; j++) tuft(m, r.range(-0.42, 0.42), 0.04, r.range(-0.44, -0.12), 0.8);
  if (r.next() < 0.6) fern(m, r.range(-0.3, 0.3), 0.04, -0.12, 0.13);
}

// 潭畔淺水: clear shallows over pebbles, a few rushes at the back, a lily pad, petals adrift.
function shallows(m, p) {
  const r = m.rng,
    y = -0.012;
  reeds(m, r.range(-0.36, -0.2), r.range(-0.4, -0.3), 0.3, 6, false, y);
  if (r.next() < 0.6) reeds(m, r.range(0.25, 0.38), r.range(-0.36, -0.2), 0.22, 4, false, y);
  for (let k = 0; k < 4; k++) {
    const x = r.range(-0.42, 0.42),
      z = r.range(-0.42, 0.42);
    if (Math.hypot(x, z) < 0.2) continue;
    m.rock(x, y - 0.02, z, 0.05, 0.035, 0.04, p[2], m.mix(p[0], 0x9aa39a, 0.5), 5);
  }
  const x = r.range(0.2, 0.38) * (r.next() < 0.5 ? -1 : 1),
    z = r.range(0.1, 0.36),
    turn = r.range(0, circle),
    ring = [];
  for (let i = 0; i <= 7; i++) {
    const a = turn + 0.25 + (i / 7) * (circle - 0.5);
    ring.push([x + Math.cos(a) * 0.075, y + 0.006, z + Math.sin(a) * 0.075]);
  }
  for (let i = 0; i < 7; i++)
    m.face(
      [[x, y + 0.008, z], ring[i + 1], ring[i]],
      [m.rgb(0x6a8f4c), m.rgb(0x3f6a3a), m.rgb(0x3f6a3a)]
    );
  petals(m, 0, y + 0.004, 0, 0.45, 4);
}

const tiles11 = {
  cover: valleyRocks,
  bamboo: loveFlowerTile,
  herbs: heartbreakBed,
  rock: wallBoulder,
  crate: medicineCabinet,
  reeds: shallows
};

function landform11(T, layout) {
  const group = new T.Group();
  group.name = '絕情花徑・絕情谷';
  const land = survey(layout);
  const floor = new Model(T, 411007);
  const at = earth(floor, land);
  brookWater(floor, land, at);
  deepPool(floor, land);
  groundCover(floor, land, at);
  group.add(floor.finish('谷底草坡、溪澗與碧潭', { cast: false }));
  const house = new Model(T, 411113);
  house.frame(hall.x, terrace.y, hall.z, 0, 1, () => stoneHouse(house));
  group.add(house.finish('谷主石屋與丹房', { occluder: true }));
  const north = new Model(T, 411229);
  cascade(north, land, at);
  woods(north, land, at, 0, 24);
  // An old pine leans over the east end of the hall.
  pine(north, 8.75, at(8.75, -7.6) - 0.05, -7.6, 3.5);
  group.add(north.finish('北坡林木與飛瀑', { occluder: true }));
  const west = new Model(T, 411337);
  woods(west, land, at, 1, 23);
  boundaryStone(west, at);
  group.add(west.finish('西谷口林木', { occluder: true }));
  const east = new Model(T, 411443);
  woods(east, land, at, 2, 15);
  group.add(east.finish('東坡與南麓林木', { occluder: true }));
  const flowers = new Model(T, 411557);
  drifts(flowers, land, at);
  group.add(flowers.finish('谷中情花叢與山石', { occluder: true }));
  const far = new Model(T, 411667);
  farWalls(far, at);
  group.add(far.finish('遠谷峭壁與遠林', { distant: true, cast: false }));
  return group;
}

export { landform11, tiles11 };
