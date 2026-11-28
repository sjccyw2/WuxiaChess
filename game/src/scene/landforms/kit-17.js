// 萬安寺's shared parts: the board's own facts, the colours of the temple by night, and the
// small pieces every other module of the board builds with (lamps, lit lattices, columns,
// red walls under a tile coping). Everything is lit by lamps whose warm light is painted into
// the vertex colours round them, as 西夏夜苑 does.
import { circle } from '../scenery-kit.js';
import { fieldCells } from '../../data/terrain.js';

const cells = fieldCells(17);
const WIDTH = Math.max(...cells.map((c) => c.x)) + 1,
  HEIGHT = Math.max(...cells.map((c) => c.y)) + 1;
const CX = (WIDTH - 1) / 2,
  CZ = (HEIGHT - 1) / 2;
const walk = new Set(cells.map((c) => c.x + ',' + c.y));
const onBoard = (x, y) => walk.has(x + ',' + y);

const TOP = 0.04; // the board's top
const OUT = -0.36; // the temple court round the raised board, two steps down

// Colours of the temple at night.
const brick = 0x596071; // 青磚
const brickLight = 0x737b8e;
const mortar = 0x262a35;
const stone = 0x6a7383; // 青石
const stoneLight = 0x8e97a6;
const stoneDark = 0x474e5c;
const wallRed = 0x6c2f2a;
const wallRedDark = 0x4c221f;
const plaster = 0x8b8984;
const lacquer = 0x8c3127;
const lacquerDark = 0x58211c;
const timber = 0x3a2c25;
const ink = 0x1c1f27;
const gilt = 0xc9a45c;
const giltDark = 0x8f733e;
const bronze = 0x5a4e36;
const paper = 0xf4c57a;
const lampRed = 0xe4643a;
const greyTile = [0x14171e, 0x232833, 0x3b4252]; // grey temple tile: shadow, body, lit edge
const ridgeGrey = 0x1a1d25;
const up = [0, 1, 0];

// The lamps that light the board: the embers of every incense burner on it, and the stone
// lanterns that stand round it in the court (the landform sets those at these places).
const burners = cells
  .filter((c) => c.kind === 'cover')
  .map((c) => [c.x - CX, 0.7, c.y - CZ, 0.85]);
const courtLanterns = [
  [-7.45, -3.0],
  [-7.45, 3.0],
  [7.75, -3.0],
  [7.75, 3.0],
  [-3.2, 7.05],
  [3.2, 7.05],
  [-2.65, -6.75],
  [2.65, -6.75]
];
const LAMPS = [...burners, ...courtLanterns.map(([x, z]) => [x, 0.6, z, 1])];

// How much lamplight falls at a point: 0 in the open, 1 close under a lamp.
function lampLight(x, y, z, lamps = LAMPS, reach = 1.7) {
  let g = 0;
  for (const [lx, ly, lz, k = 1] of lamps) {
    const dx = x - lx,
      dy = y - ly,
      dz = z - lz,
      d2 = dx * dx + 0.45 * dy * dy + dz * dz;
    if (d2 < reach * 5.5) g += k * Math.exp(-d2 / reach);
  }
  return Math.min(1, g);
}
// Lamplight painted into the vertex colours of a model (from vertex `from` of its solid part):
// warm and brighter under the lamps, cool blue in the open.
function bathe(m, lamps = LAMPS, gain = 1, from = 0, reach = 1.7) {
  const { p, c } = m.parts[0];
  for (let i = from * 3; i < p.length; i += 3) {
    const g = lampLight(p[i], p[i + 1], p[i + 2], lamps, reach) * gain;
    c[i] *= 0.94 + 1.35 * g;
    c[i + 1] *= 0.96 + 0.82 * g;
    c[i + 2] *= 1.04 + 0.22 * g;
  }
}
// Draw something and light only what it added.
function lit(m, draw, lamps = LAMPS, gain = 1) {
  const from = m.parts[0].p.length / 3;
  draw();
  bathe(m, lamps, gain, from);
}

// Faces are wound so their normal points along `hint`.
function put(m, pts, col, hint = up) {
  const [a, b, c] = pts,
    u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) pts = [...pts].reverse();
  m.face(pts, col);
}
// A lamp remembers where it hangs (in the model's own space), so its light can be painted.
function mark(m, x, y, z, k = 1) {
  if (!m.lamps) return;
  const e = m.matrix.elements;
  m.lamps.push([
    e[0] * x + e[4] * y + e[8] * z + e[12],
    e[1] * x + e[5] * y + e[9] * z + e[13],
    e[2] * x + e[6] * y + e[10] * z + e[14],
    k
  ]);
}
// A flat quad in the xz plane at height y.
function slab(m, x0, x1, z0, z1, y, col) {
  put(
    m,
    [
      [x0, y, z0],
      [x0, y, z1],
      [x1, y, z1],
      [x1, y, z0]
    ],
    col
  );
}
// A lit paper lattice, seen from +z of its own frame; the muntins are painted on the paper.
function lattice(m, w, h, nx = 4, ny = 4, glow = true, bars = lacquerDark) {
  const flat = (x0, x1, y0, y1, z, col) =>
    put(
      m,
      [
        [x0, y0, z],
        [x1, y0, z],
        [x1, y1, z],
        [x0, y1, z]
      ],
      col,
      [0, 0, 1]
    );
  if (glow) m.glow(() => flat(-w / 2, w / 2, -h / 2, h / 2, 0, paper));
  else flat(-w / 2, w / 2, -h / 2, h / 2, 0, 0x2a2620);
  for (const k of [-1, 1]) {
    m.box((k * w) / 2, 0, 0.012, 0.05, h + 0.05, 0.045, bars);
    m.box(0, (k * h) / 2, 0.012, w + 0.05, 0.05, 0.045, bars);
  }
  for (let i = 1; i < nx; i++) {
    const x = -w / 2 + (i * w) / nx;
    flat(x - 0.012, x + 0.012, -h / 2, h / 2, 0.006, bars);
  }
  for (let j = 1; j < ny; j++) {
    const y = -h / 2 + (j * h) / ny;
    flat(-w / 2, w / 2, y - 0.012, y + 0.012, 0.007, bars);
  }
}
// A lacquered column on a stone base.
function column(m, x, z, y, h, r = 0.09, tone = lacquer) {
  m.lathe(
    x,
    y,
    z,
    [
      [0, r * 1.7],
      [0.05, r * 1.75],
      [0.09, r * 1.12]
    ],
    stoneDark,
    8
  );
  m.tube([x, y + 0.08, z], [x, y + h, z], r, r * 0.92, tone, 7);
}
// A hanging lantern: a paper or silk shade between two collars, a tassel below.
function hangLamp(m, x, y, z, s = 1, tone = lampRed, cord = 0.4) {
  m.frame(x, y, z, 0, s, () => {
    m.tube([0, 0.2 + cord, 0], [0, 0.18, 0], 0.011, 0.011, ink, 4);
    m.glow(() =>
      m.lathe(
        0,
        0,
        0,
        [
          [-0.17, 0.07],
          [-0.1, 0.14],
          [0.02, 0.165],
          [0.12, 0.14],
          [0.18, 0.075]
        ],
        tone,
        7
      )
    );
    for (const [a, b, r] of [
      [0.175, 0.21, 0.08],
      [-0.205, -0.165, 0.078]
    ])
      m.lathe(
        0,
        0,
        0,
        [
          [a, r],
          [b, r * 0.8]
        ],
        ink,
        7
      );
    m.tube([0, -0.2, 0], [0, -0.36, 0], 0.01, 0.028, 0xa83a28, 5);
  });
  mark(m, x, y, z);
}
// A small hipped cap with lifted corners, for lanterns and pillars.
function cap(m, y, half, rise, tone, light = tone) {
  const top = half * 0.22;
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4,
      c = Math.cos(a),
      s = Math.sin(a);
    const at = (out, along, h) => [c * out - s * along, y + h, s * out + c * along];
    const l = at(half, -half, rise * 0.24),
      r = at(half, half, rise * 0.24),
      mid = at(half, 0, 0),
      tl = at(top, -top, rise),
      tr = at(top, top, rise),
      hint = [c, 0.6, s];
    put(m, [l, mid, tl], tone, hint);
    put(m, [mid, tr, tl], light, hint);
    put(m, [mid, r, tr], tone, hint);
    put(m, [l, r, at(half, 0, -0.05)], ink, [c, 0, s]);
  }
  m.box(0, y - 0.03, 0, half * 1.7, 0.05, half * 1.7, tone);
  m.lathe(
    0,
    y + rise,
    0,
    [
      [0, top * 1.2],
      [0.05, top * 1.4],
      [0.12, top * 0.6],
      [0.17, 0]
    ],
    light,
    6
  );
}
// 石燈: a stone lantern on an octagonal post, its lamp chamber lit through four openings.
function stoneLantern(m, x, y, z, s = 1) {
  m.frame(x, y, z, 0, s, () => {
    m.box(0, 0.06, 0, 0.42, 0.12, 0.42, stoneDark);
    m.lathe(
      0,
      0.12,
      0,
      [
        [0, 0.17],
        [0.06, 0.12],
        [0.12, 0.085],
        [0.5, 0.072],
        [0.56, 0.1],
        [0.62, 0.17],
        [0.66, 0.17]
      ],
      stone,
      8
    );
    m.glow(() => m.box(0, 0.86, 0, 0.2, 0.22, 0.2, paper));
    for (const i of [-1, 1])
      for (const j of [-1, 1]) m.box(i * 0.115, 0.86, j * 0.115, 0.05, 0.22, 0.05, stone);
    cap(m, 1.0, 0.24, 0.17, stoneDark, stone);
  });
  mark(m, x, y + 0.86 * s, z);
}
// A red wall under a grey tile coping from (ax, az) to (bx, bz), standing at y.
function redWall(m, ax, az, bx, bz, y, h = 1.9, thick = 0.34) {
  const len = Math.hypot(bx - ax, bz - az),
    yaw = Math.atan2(-(bz - az), bx - ax);
  m.frame((ax + bx) / 2, y, (az + bz) / 2, yaw, 1, () => {
    const n = Math.max(1, Math.round(len / 1.6));
    // Plastered red in panels, a dark stone plinth, a white band under the coping.
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + ((i + 0.5) * len) / n,
        w = len / n;
      m.box(x, 0.3 + (h - 0.45) / 2, 0, w + 0.002, h - 0.45, thick, i % 2 ? wallRed : m.mix(wallRed, wallRedDark, 0.25));
    }
    m.box(0, 0.15, 0, len + 0.02, 0.3, thick + 0.06, stoneDark);
    m.box(0, h - 0.07, 0, len + 0.01, 0.14, thick + 0.01, plaster);
    coping(m, len + 0.3, h, thick / 2 + 0.16, 0.22);
  });
}
// A tile coping along x of its own frame: two slopes of half-round tiles under a ridge.
function coping(m, len, y, half, rise, tones = greyTile) {
  const n = Math.max(2, Math.round(len / 0.22));
  for (const s of [-1, 1]) {
    put(
      m,
      [
        [-len / 2, y, s * half],
        [len / 2, y, s * half],
        [len / 2, y + rise, 0],
        [-len / 2, y + rise, 0]
      ],
      tones[1],
      [0, 0.5, s]
    );
    put(
      m,
      [
        [-len / 2, y, s * half],
        [len / 2, y, s * half],
        [len / 2, y - 0.06, s * half * 0.9],
        [-len / 2, y - 0.06, s * half * 0.9]
      ],
      tones[0],
      [0, 0, s]
    );
    for (let i = 0; i <= n; i++) {
      const x = -len / 2 + (len * i) / n;
      m.tube([x, y + 0.012, s * half], [x, y + rise + 0.01, 0], 0.022, 0.022, tones[2], 4);
    }
  }
  m.box(0, y + rise + 0.03, 0, len, 0.08, 0.1, ridgeGrey);
}

export {
  WIDTH,
  HEIGHT,
  CX,
  CZ,
  TOP,
  OUT,
  LAMPS,
  courtLanterns,
  onBoard,
  lampLight,
  bathe,
  lit,
  put,
  mark,
  slab,
  lattice,
  column,
  hangLamp,
  cap,
  stoneLantern,
  redWall,
  coping,
  brick,
  brickLight,
  mortar,
  stone,
  stoneLight,
  stoneDark,
  wallRed,
  wallRedDark,
  plaster,
  lacquer,
  lacquerDark,
  timber,
  ink,
  gilt,
  giltDark,
  bronze,
  paper,
  lampRed,
  greyTile,
  ridgeGrey
};
