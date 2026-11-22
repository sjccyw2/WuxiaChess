// 谷底棋臺 only: the stone table itself. One slab of pale grey-green stone
// with a go board of thirteen lines cut into it, a line through the middle of
// every tile so that whoever stands on a tile stands on a point of the board.
// It is a plain square with nothing on it but what blocks the way: the four
// sword stones at its star points, seven great go stones, and 韋小寶's stall
// on the south-east corner. The pond lies beside it, off the board.
import { circle } from '../scenery-kit.js';
import { oldPine } from './peaks-4.js';
import { FLOOR, fbm, hash, mix, noise, smooth, leafLitter, faceUp, faceOut } from './valley-15.js';
import { swordStone } from './swords-15.js';

const TOP = 0.039; // the walking face, level with the flags of every other map
const GROOVE = 0.024; // half the width of a cut line
const CUT = 0.02; // and its depth
const sides = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
];
const wet = (kind) => kind === 'reeds' || kind === 'bridge';

function board(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const kinds = new Map(layout.cells.map((c) => [c.y * layout.width + c.x, c.kind]));
  const kind = (x, y) =>
    x < 0 || y < 0 || x >= layout.width || y >= layout.height
      ? null
      : kinds.get(y * layout.width + x) || null;
  const pools = layout.cells.filter((c) => wet(c.kind)).map((c) => [c.x - cx, c.y - cz]);
  // How far a point of the slab lies from the nearest pool tile.
  const dry = (x, z) =>
    pools.reduce(
      (d, [px, pz]) =>
        Math.min(
          d,
          Math.hypot(Math.max(0, Math.abs(x - px) - 0.5), Math.max(0, Math.abs(z - pz) - 0.5))
        ),
      9
    );
  return { cx, cz, kind, dry };
}
// The colour of the stone at a point. It runs unbroken from tile to tile, so
// the table reads as one slab: broad clouding, a pale vein here and there,
// lichen, and a darker damp margin round the pool.
function stoneTone(m, b, x, z) {
  let c = m.mix(0x7fa29d, 0xb0c8c1, fbm(x * 0.24 + 11, z * 0.24 + 5));
  c = m.mix(
    c,
    0xc6d8d1,
    0.5 * smooth(0.93, 1, Math.abs(Math.sin(x * 0.83 + z * 0.47 + 3.4 * noise(x * 0.4, z * 0.4))))
  );
  c = m.mix(c, 0x93a88c, 0.3 * smooth(0.66, 0.8, noise(x * 1.9 + 40, z * 1.9 - 21)));
  c = m.mix(c, 0x67857f, 0.24 * smooth(0.55, 0.3, noise(x * 0.9 - 14, z * 0.9 + 33)));
  // The last sun lies on the north-east of the table; the rest is in the cliff's shade.
  c = m.mix(c, 0x6a8492, 0.16 * smooth(4.5, -8, x - z * 0.5));
  return m.mix(c, 0x58706c, 0.55 * smooth(1.5, 0.1, b.dry(x, z)));
}
function slab(m, layout) {
  const b = board(layout),
    tone = (x, z) => stoneTone(m, b, x, z);
  const flat = (x0, z0, x1, z1) =>
    faceUp(
      m,
      [
        [x0, TOP, z0],
        [x0, TOP, z1],
        [x1, TOP, z1],
        [x1, TOP, z0]
      ],
      [tone(x0, z0), tone(x0, z1), tone(x1, z1), tone(x1, z0)]
    );
  // The cut lines are the same stone with the dust of years in them.
  const dark = (c, k) => c.map((v) => v * k);
  for (const cell of layout.cells) {
    if (wet(cell.kind)) continue;
    const x = cell.x - b.cx,
      z = cell.y - b.cz;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        flat(
          Math.min(x + sx * 0.5, x + sx * GROOVE),
          Math.min(z + sz * 0.5, z + sz * GROOVE),
          Math.max(x + sx * 0.5, x + sx * GROOVE),
          Math.max(z + sz * 0.5, z + sz * GROOVE)
        );
    // A line runs from this tile's middle toward each neighbour, so the outer
    // lines stop at the middle of the edge tiles, as on a go board.
    const arms = sides.map(([dx, dz]) => b.kind(cell.x + dx, cell.y + dz) !== null);
    const low = TOP - CUT,
      mid = sides.map(([dx, dz], k) => [x + dx * GROOVE, arms[k] ? low : TOP, z + dz * GROOVE]);
    sides.forEach(([dx, dz], k) => {
      // Across the arm: u is the way the line runs, v is across it.
      const at = (u, v, y) => [x + dx * u - dz * v, y, z + dz * u + dx * v];
      if (!arms[k]) {
        const p = [
          at(GROOVE, -GROOVE, TOP),
          at(0.5, -GROOVE, TOP),
          at(0.5, GROOVE, TOP),
          at(GROOVE, GROOVE, TOP)
        ];
        faceUp(
          m,
          p,
          p.map((q) => tone(q[0], q[2]))
        );
        return;
      }
      for (const s of [-1, 1]) {
        const p = [
          at(GROOVE, s * GROOVE, TOP),
          at(0.5, s * GROOVE, TOP),
          at(0.5, 0, low),
          at(GROOVE, 0, low)
        ];
        faceUp(
          m,
          p,
          p.map((q, i) => dark(tone(q[0], q[2]), i < 2 ? 0.7 : 0.4))
        );
      }
    });
    // Where the lines cross.
    const cut = arms.some(Boolean),
      centre = [x, cut ? low : TOP, z];
    for (let k = 0; k < 4; k++) {
      const [ax, az] = sides[k],
        [bx, bz] = sides[(k + 1) % 4];
      const corner = [x + (ax + bx) * GROOVE, TOP, z + (az + bz) * GROOVE],
        c = tone(x, z);
      faceUp(m, [corner, mid[k], mid[(k + 1) % 4]], [dark(c, 0.7), dark(c, 0.4), dark(c, 0.4)]);
      faceUp(m, [centre, mid[(k + 1) % 4], mid[k]], dark(c, 0.4));
    }
  }
  edges(m, layout, b, tone);
  wear(m, layout, b, tone);
}
// The edge of the slab. Toward the valley it is rounded by weather and stands
// a hand above the ground; toward the pool it is worn into a slope that runs
// under the water. `chip` breaks the line of it.
const rim = [
  [0, TOP],
  [0.09, TOP - 0.003],
  [0.19, TOP - 0.028],
  [0.25, TOP - 0.085],
  [0.275, FLOOR - 0.045]
];
const shore = [
  [0, TOP],
  [0.04, TOP - 0.012],
  [0.1, -0.05],
  [0.18, -0.16],
  [0.3, -0.38]
];
function edges(m, layout, b, tone) {
  const chip = (x, z) =>
    0.72 +
    0.56 * noise(x * 2.7 + 3, z * 2.7 - 8) +
    (hash(Math.round(x * 4), Math.round(z * 4)) > 0.9 ? 0.25 : 0);
  // One section of the edge at (x, z), run outward along (dx, dz); `f` blends rim into shore.
  const section = (x, z, dx, dz, f) => {
    const k = chip(x, z),
      c = tone(x, z);
    return rim.map(([d, y], i) => {
      const run = (d + (shore[i][0] - d) * f) * (i ? k : 1),
        h = y + (shore[i][1] - y) * f;
      const paint =
        i === 0
          ? c
          : i === 1
            ? m.mix(c, 0xc9d4cb, 0.3 * (1 - f))
            : i === 2
              ? m.mix(c, 0x6f8079, 0.3 + 0.3 * f)
              : i === 3
                ? m.mix(c, 0x55645c, 0.55 + 0.2 * f)
                : m.mix(m.mix(c, 0x4b5b49, 0.75), 0x2f4442, 0.6 * f);
      return { p: [x + dx * run, h, z + dz * run], c: paint };
    });
  };
  const join = (A, B) => {
    for (let i = 1; i < A.length; i++)
      faceUp(m, [A[i - 1].p, A[i].p, B[i].p, B[i - 1].p], [A[i - 1].c, A[i].c, B[i].c, B[i - 1].c]);
  };
  const open = (cell, [dx, dz]) => {
    const k = b.kind(cell.x + dx, cell.y + dz);
    return k === null ? 0 : wet(k) ? 1 : -1;
  };
  for (const cell of layout.cells) {
    if (wet(cell.kind)) continue;
    const x = cell.x - b.cx,
      z = cell.y - b.cz;
    sides.forEach((side, k) => {
      const f = open(cell, side);
      if (f < 0) return;
      const [dx, dz] = side;
      let last = null;
      for (let j = 0; j <= 4; j++) {
        const t = j / 4 - 0.5,
          next = section(x + dx * 0.5 - dz * t, z + dz * 0.5 + dx * t, dx, dz, f);
        if (last) join(last, next);
        last = next;
      }
      // Round the corner where the next side is open as well.
      const other = sides[(k + 1) % 4],
        g = open(cell, other);
      if (g < 0) return;
      const px = x + (dx + other[0]) * 0.5,
        pz = z + (dz + other[1]) * 0.5;
      last = null;
      for (let j = 0; j <= 3; j++) {
        const a = (j / 3) * (Math.PI / 2),
          next = section(
            px,
            pz,
            dx * Math.cos(a) + other[0] * Math.sin(a),
            dz * Math.cos(a) + other[1] * Math.sin(a),
            f + (g - f) * (j / 3)
          );
        if (last) join(last, next);
        last = next;
      }
    });
  }
}
// Centuries on the slab: hairline cracks, the dot cut at 天元, fallen leaves.
function wear(m, layout, b, tone) {
  const r = m.rng,
    half = layout.width / 2 - 0.06;
  const dryAt = (x, z) => {
    const k = b.kind(Math.floor(x + layout.width / 2), Math.floor(z + layout.height / 2));
    return k !== null && !wet(k);
  };
  for (let n = 0; n < 7; n++) {
    let x = r.range(-half, half),
      z = r.range(-half, half),
      a = r.range(0, circle);
    for (let k = 0; k < 13; k++) {
      a += r.range(-0.55, 0.55);
      const nx = x + Math.cos(a) * 0.36,
        nz = z + Math.sin(a) * 0.36;
      if (Math.abs(nx) > half || Math.abs(nz) > half) break;
      if (dryAt(x, z) && dryAt(nx, nz)) {
        const w = 0.007 + 0.006 * r.next(),
          ox = -Math.sin(a) * w,
          oz = Math.cos(a) * w,
          y = TOP + 0.0012;
        faceUp(
          m,
          [
            [x - ox, y, z - oz],
            [x + ox, y, z + oz],
            [nx + ox, y, nz + oz],
            [nx - ox, y, nz - oz]
          ],
          tone(x, z).map((v) => v * 0.5)
        );
      }
      x = nx;
      z = nz;
    }
  }
  // 天元, the middle point of the board.
  const dot = Array.from({ length: 10 }, (_, i) => [
    Math.cos((i * circle) / 10) * 0.075,
    TOP + 0.0016,
    Math.sin((i * circle) / 10) * 0.075
  ]);
  faceUp(
    m,
    dot.reverse(),
    tone(0, 0).map((v) => v * 0.48)
  );
  for (let n = 0; n < 70; n++) {
    const x = r.range(-half, half),
      z = r.range(-half, half);
    if (dryAt(x, z)) leafLitter(m, x, TOP + 0.004, z);
  }
}

// A go stone a tile wide, lying on its point: a low lens of black slate or
// white shell, low enough to stand on and wide enough to show round the feet
// of whoever does.
const lens = [
  [0.06, 0.008, 0],
  [0.24, 0.024, 0],
  [0.37, 0.054, 0],
  [0.44, 0.088, 1],
  [0.458, 0.107, 1],
  [0.437, 0.128, 1],
  [0.366, 0.16, 2],
  [0.25, 0.184, 2],
  [0.12, 0.197, 3]
];
const slate = [0x17191c, 0x282b2f, 0x343940, 0x474d55],
  shell = [0xa39f8f, 0xcbc6b7, 0xe0ddd0, 0xf0eee5];
// A great go stone, big enough to block its tile: a tile wide and knee-high to a piece.
const WIDE = 1.12,
  HIGH = 1.9;
function goStone(m, black) {
  const r = m.rng,
    tones = black ? slate : shell,
    n = 18;
  m.frame(
    0,
    TOP + 0.003,
    0,
    r.range(0, circle),
    1,
    () => {
      let last = null;
      for (const [rad, y, tone] of lens) {
        const ring = Array.from({ length: n }, (_, i) => [
          Math.cos((i * circle) / n) * rad * WIDE,
          y * HIGH,
          Math.sin((i * circle) / n) * rad * WIDE
        ]);
        if (last)
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n,
              a = m.rgb(tones[last.tone]),
              c = m.rgb(tones[tone]);
            faceOut(m, [last.ring[i], ring[i], ring[j], last.ring[j]], [a, c, c, a], [0, 0.09, 0]);
          }
        last = { ring, tone };
      }
      const crown = [0, 0.201 * HIGH, 0];
      for (let i = 0; i < n; i++)
        faceUp(m, [crown, last.ring[(i + 1) % n], last.ring[i]], tones[3]);
    },
    r.range(-0.035, 0.035),
    r.range(-0.035, 0.035)
  );
}
// A scrub pine rooted at the outer corner of an edge tile, leaning out over
// the edge of the slab with a few rocks at its foot; the tile stays clear.
function scrubPine(m, out) {
  const r = m.rng;
  for (const [x, z, s] of [
    [0.33, -0.33, 0.13],
    [0.44, -0.1, 0.1],
    [0.1, -0.41, 0.09],
    [0.42, 0.22, 0.07]
  ])
    m.rock(
      x * out,
      TOP - 0.03,
      z,
      s,
      s * r.range(1.0, 1.5),
      s * 0.85,
      0x545a56,
      r.pick([0x7d8279, 0x6c775c]),
      7,
      x * 9
    );
  oldPine(m, 0.3 * out, TOP - 0.02, -0.24, 0.52, Math.atan2(0.4, out), 0.8, 3);
}
// Valley orchids in the cracks at the corners of the tile: long arching
// blades and a few pale flowers on thin stalks.
function orchids(m) {
  const r = m.rng;
  for (const [x, z] of [
    [-0.29, -0.28],
    [0.28, -0.31],
    [0.31, 0.25],
    [-0.31, 0.27]
  ]) {
    const soil = Array.from({ length: 7 }, (_, i) => {
      const a = (i * circle) / 7,
        k = r.range(0.09, 0.15);
      return [x + Math.cos(a) * k, TOP + 0.002, z + Math.sin(a) * k];
    });
    faceUp(m, soil, r.pick([0x47533f, 0x505b42]));
    for (let k = 0; k < 8; k++) {
      const a = (k * circle) / 8 + r.range(-0.3, 0.3),
        l = r.range(0.18, 0.33);
      m.leaf(
        [x, TOP, z],
        [x + Math.cos(a) * l, TOP + r.range(0.02, 0.1), z + Math.sin(a) * l],
        0.022,
        r.pick([0x4f7248, 0x5c7f50, 0x6a8a55]),
        0x8fa66d,
        l * 0.62
      );
    }
    for (let k = 0; k < 2; k++) {
      const a = r.range(0, circle),
        h = r.range(0.19, 0.27),
        fx = x + Math.cos(a) * 0.06,
        fz = z + Math.sin(a) * 0.06;
      m.tube([x, TOP, z], [fx, TOP + h, fz], 0.007, 0.005, 0x7f9a63, 4);
      for (let p = 0; p < 5; p++) {
        const t = (p * circle) / 5 + a;
        m.leaf(
          [fx, TOP + h, fz],
          [fx + Math.cos(t) * 0.055, TOP + h + (p % 2 ? 0.03 : 0.012), fz + Math.sin(t) * 0.055],
          0.016,
          p === 0 ? 0xd9c7e2 : 0xeeecd2,
          0xf7f5e6,
          0.012
        );
      }
    }
  }
}
// The stone beam over the pool's western arm: one rough flat block standing in the water.
function steppingStone(m) {
  const r = m.rng,
    n = 9;
  const edge = Array.from({ length: n }, (_, i) => {
    const a = (i * circle) / n + 0.2,
      k = r.range(0.9, 1.06);
    return [Math.cos(a) * 0.47 * k, Math.sin(a) * 0.41 * k];
  });
  const top = edge.map(([x, z]) => [x * 0.94, TOP, z * 0.94]),
    lip = edge.map(([x, z]) => [x, TOP - 0.03, z]),
    foot = edge.map(([x, z]) => [x * 1.06, -0.42, z * 1.06]);
  faceUp(
    m,
    top,
    top.map(([x, , z]) => m.mix(0x9aa697, 0x7f8f86, Math.hypot(x, z) * 1.6))
  );
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faceOut(m, [top[i], top[j], lip[j], lip[i]], 0x8a988d, [0, -0.3, 0]);
    faceOut(
      m,
      [lip[i], lip[j], foot[j], foot[i]],
      [m.rgb(0x66766f), m.rgb(0x66766f), m.rgb(0x35474a), m.rgb(0x35474a)],
      [0, -0.3, 0]
    );
  }
}
// 韋小寶's stall: a trestle under a patched awning on two bamboo poles, dice
// cups and a few wares on the cloth, a stool behind. It faces the board; the
// awning stands on the side away from the opening camera, so the table shows
// beneath it.
const patches = [0xb5523c, 0xd8c69a, 0x3f5f8a, 0xc79a3e, 0x6a8f5a, 0xb5523c, 0xd8c69a, 0x8a4a6e];
function stall(m) {
  const r = m.rng,
    wood = 0x80603f,
    bamboo = 0xa48d55;
  // The trestle and its cloth: faded red, an ochre hem, two patches.
  for (const [x, z] of [
    [-0.26, -0.03],
    [0.3, -0.03],
    [-0.26, 0.23],
    [0.3, 0.23]
  ])
    m.box(x, TOP + 0.12, z, 0.03, 0.24, 0.03, wood);
  m.box(0.02, TOP + 0.255, 0.1, 0.62, 0.03, 0.32, wood);
  const cloth = TOP + 0.274;
  m.box(0.02, cloth, 0.1, 0.65, 0.008, 0.35, 0xb24a3a);
  m.box(0.02, cloth - 0.07, 0.277, 0.65, 0.14, 0.008, 0xb24a3a);
  m.box(0.02, cloth - 0.147, 0.278, 0.65, 0.022, 0.01, 0xcf9f45);
  m.box(-0.14, cloth - 0.06, 0.283, 0.13, 0.09, 0.006, 0x3f6592);
  m.box(0.22, cloth + 0.005, 0.0, 0.13, 0.004, 0.1, 0x5f8f5c);
  const y = cloth + 0.005;
  // Three dice cups and the dice.
  for (const [x, z, tip] of [
    [-0.2, 0.07, 0],
    [-0.11, 0.15, 0],
    [-0.03, 0.06, 0.5]
  ])
    m.frame(
      x,
      y,
      z,
      x * 20,
      1,
      () => {
        m.tube([0, 0, 0], [0, 0.07, 0], 0.034, 0.028, 0x7a5c36, 9);
        m.tube([0, 0, 0], [0, 0.012, 0], 0.037, 0.037, 0x5d4528, 9);
      },
      0,
      tip
    );
  for (const [x, z] of [
    [-0.1, 0.22],
    [-0.055, 0.235]
  ])
    m.frame(x, y + 0.011, z, x * 30, 1, () => m.box(0, 0, 0, 0.022, 0.022, 0.022, 0xf0ead8));
  // A bowl of coppers, a string of them, two gourds, two jars, bolts of cloth.
  m.lathe(
    0.08,
    y,
    0.17,
    [
      [0, 0.02],
      [0.02, 0.045],
      [0.035, 0.05],
      [0.03, 0.04]
    ],
    0xc9d6dc,
    10
  );
  m.lathe(
    0.08,
    y + 0.026,
    0.17,
    [
      [0, 0.036],
      [0.002, 0.036]
    ],
    0xb9903f,
    8
  );
  m.hoop(0.21, y + 0.008, 0.2, 0.04, 0.008, 0xc2a04a, 10);
  for (const [x, z, s] of [
    [0.19, 0.05, 1],
    [0.265, 0.1, 0.8]
  ]) {
    m.lathe(
      x,
      y,
      z,
      [
        [0, 0.015],
        [0.03, 0.04],
        [0.06, 0.022],
        [0.085, 0.03],
        [0.105, 0.012],
        [0.12, 0.006]
      ].map(([h, q]) => [h * s, q * s]),
      0xc98f3c,
      9
    );
    m.hoop(x, y + 0.06 * s, z, 0.024 * s, 0.004, 0xa33a2c, 8);
  }
  for (const [x, z, tone] of [
    [0.0, -0.02, 0x8fb8a6],
    [0.075, -0.03, 0xd9d4c4]
  ]) {
    m.lathe(
      x,
      y,
      z,
      [
        [0, 0.02],
        [0.03, 0.03],
        [0.06, 0.024],
        [0.07, 0.012]
      ],
      tone,
      8
    );
    m.box(x, y + 0.078, z, 0.02, 0.016, 0.02, 0xa33a2c);
  }
  m.box(-0.2, y + 0.018, -0.02, 0.13, 0.036, 0.07, 0x35507f);
  m.box(-0.19, y + 0.05, -0.02, 0.11, 0.03, 0.065, 0xc0513f);
  // Two poles on the far side, the awning tied to their tops and guyed forward.
  const high = TOP + 1.0,
    low = TOP + 0.86;
  const poles = [
    [-0.36, -0.2],
    [0.38, -0.2]
  ];
  for (const [x, z] of poles) {
    m.tube([x, TOP, z], [x * 1.02, high + 0.06, z - 0.02], 0.017, 0.014, bamboo, 6);
    for (const h of [0.3, 0.62, 0.9])
      m.hoop(x * (1 + 0.02 * h), TOP + h, z - 0.02 * h, 0.018, 0.004, 0x7d6a3c, 6);
  }
  const cols = 4,
    rows = 2;
  const at = (i, j) => {
    const u = i / cols,
      v = j / rows;
    // The cloth sags between its four corners.
    const sag = 0.05 * Math.sin(u * Math.PI) * (0.5 + 0.5 * Math.sin(v * Math.PI));
    return [mix(-0.4, 0.42, u), mix(high, low, v) - sag, mix(-0.22, 0.3, v)];
  };
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const tone = patches[(i + j * cols + 3 * j) % patches.length];
      faceUp(
        m,
        [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)],
        m.mix(tone, 0x8d8370, 0.18 + 0.1 * r.next())
      );
    }
  // A darker patch sewn over a tear, and the fringe of the front hem.
  faceUp(
    m,
    [
      [0.05, at(2, 1)[1] + 0.012, 0.0],
      [0.05, at(2, 1)[1] - 0.004, 0.13],
      [0.2, at(3, 1)[1] - 0.004, 0.13],
      [0.2, at(3, 1)[1] + 0.012, 0.0]
    ],
    0x7b3f2f
  );
  for (const s of [-1, 1]) {
    const corner = at(s < 0 ? 0 : cols, rows);
    m.tube(corner, [s * 0.4, TOP + 0.01, 0.26], 0.004, 0.004, 0x8b7a55, 4);
    m.rock(s * 0.4, TOP - 0.01, 0.26, 0.035, 0.04, 0.03, 0x5a5f58, 0x7b8076, 6);
  }
  // The stool, and a covered basket beside the trestle.
  m.lathe(
    0.06,
    TOP + 0.15,
    0.4,
    [
      [0, 0.07],
      [0.02, 0.075],
      [0.03, 0.065]
    ],
    wood,
    9
  );
  for (let k = 0; k < 3; k++) {
    const a = (k * circle) / 3 + 0.5;
    m.tube(
      [0.06 + Math.cos(a) * 0.04, TOP + 0.15, 0.4 + Math.sin(a) * 0.04],
      [0.06 + Math.cos(a) * 0.065, TOP, 0.4 + Math.sin(a) * 0.065],
      0.011,
      0.01,
      0x6b4f33,
      5
    );
  }
  m.lathe(
    -0.4,
    TOP,
    0.13,
    [
      [0, 0.055],
      [0.05, 0.075],
      [0.1, 0.07],
      [0.105, 0.06]
    ],
    0x9c8552,
    9
  );
  m.lathe(
    -0.4,
    TOP + 0.1,
    0.13,
    [
      [0, 0.062],
      [0.018, 0.045],
      [0.026, 0.0]
    ],
    0xc0513f,
    9
  );
}
// Everything that stands on the tiles.
function tileDressing(m, layout) {
  const b = board(layout);
  let stones = 0;
  for (const cell of layout.cells) {
    const x = cell.x - b.cx,
      z = cell.y - b.cz;
    const place = (yaw, draw) => m.frame(x, 0, z, yaw, 1, draw);
    // A blocked tile is a sword stone at one of the four star points, a great go stone elsewhere.
    const star = Math.abs(x) === 3 && Math.abs(z) === 3;
    if (cell.kind === 'cover' || (cell.kind === 'rock' && !star)) place(0, () => goStone(m, stones++ % 2 === 0));
    else if (cell.kind === 'rock')
      // The four swords of the tomb: 利劍 south-west, 軟劍 south-east, 重劍 north-east, 木劍 north-west.
      place(0, () =>
        m.frame(0, TOP, 0, 0, 1, () =>
          swordStone(m, x < 0 ? (z > 0 ? 'keen' : 'wood') : z > 0 ? 'soft' : 'heavy')
        )
      );
    else if (cell.kind === 'bamboo') place(0, () => scrubPine(m, x < 0 ? -1 : 1));
    else if (cell.kind === 'herbs') place(0, () => orchids(m));
    else if (cell.kind === 'bridge') place(0.3, () => steppingStone(m));
    // The stall is turned square to the opening camera.
    else if (cell.kind === 'crate') place(0.69, () => stall(m));
  }
}

export { TOP, slab, tileDressing };
