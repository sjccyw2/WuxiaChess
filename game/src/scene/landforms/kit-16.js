// 石樑溫家's palette and the small pieces its buildings are made of: white plastered walls on a
// dark stone footing with a coping of grey tiles, stepped horse-head gables (馬頭牆), chestnut
// columns on drum bases, lattice panels, and the board's own facts (its size and walkable
// tiles, and the line of the ravine's lips).
import { circle } from '../scenery-kit.js';
import { fieldCells } from '../../data/terrain.js';

// Plaster, stone and timber of a late-Ming gentry house in the Zhejiang hills, by daylight.
const plaster = 0xe6e1d3; // 粉牆, whitewashed
const plasterShade = 0xc9c3b3;
const plasterStain = 0xa9a596; // rain streaks under the coping
const footing = 0x6c6c66; // 勒腳: the dark stone dado
const granite = 0xaaa79b; // 青石 of steps, kerbs and bases
const graniteShade = 0x85837a;
const graniteDark = 0x66655f;
const brick = 0x7f8483; // 青磚
const brickLight = 0x989d9a;
const mortar = 0x555a56;
const tiles = [0x2f3336, 0x464b4e, 0x6f7477]; // 黛瓦: shadow, body, lit edge
const ridgeTone = 0x2a2d30;
const timber = 0x5b3b2a; // chestnut lacquer of the columns
const timberDark = 0x3a281e;
const timberLight = 0x7a5640;
const lattice = 0x6e4c35;
const paperLit = 0xe9dcc0; // window paper
const interior = 0x221c18;
const bronze = 0x5e5442;
const bronzeDark = 0x3e392e;
const verdigris = 0x5f7a68;
const gilt = 0xc8a45a;
const inkBoard = 0x2a2522; // the plaque's ground
const up = [0, 1, 0];

// The board: 13 by 12, its centre at the origin.
const cells = fieldCells(16);
const WIDTH = 13,
  HEIGHT = 12;
const CX = (WIDTH - 1) / 2,
  CZ = (HEIGHT - 1) / 2;
const walk = new Set(cells.map((c) => c.x + ',' + c.y));
const TOP = 0.04; // the paving's top
const GROUND = 0.0; // the court round the board
const SHELF = 1.0; // depth of the board's own masonry sides (maze-scenery landDepth)
const WATER = -4.3; // the stream at the foot of the ravine

// Faces are wound so their normal points along `hint`.
function put(m, pts, col, hint = up) {
  const [a, b, c] = pts,
    u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) pts = [...pts].reverse();
  m.face(pts, col);
}

// A box between two corners, so long runs can be given by their ends.
function slab(m, x0, x1, y0, y1, z0, z1, col) {
  m.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), col);
}

// A double-pitched coping of grey tiles along x of the frame, `len` long, its ridge at `y`:
// two slopes of pan tiles, a row of round eave tiles under each, and a ridge course.
function tileCap(m, len, y, half = 0.2, rise = 0.12, ends = true) {
  const n = Math.max(2, Math.round(len / 0.16));
  const [dark, mid, hi] = tiles;
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const x0 = -len / 2 + (len * i) / n,
        x1 = -len / 2 + (len * (i + 1)) / n;
      put(
        m,
        [
          [x0, y, 0],
          [x1, y, 0],
          [x1, y - rise, s * half],
          [x0, y - rise, s * half]
        ],
        i % 2 ? mid : m.mix(mid, dark, 0.35),
        [0, 1, s * 0.5]
      );
    }
    // The eave: a thin dark band and the lit lip of the tiles.
    put(
      m,
      [
        [-len / 2, y - rise, s * half],
        [len / 2, y - rise, s * half],
        [len / 2, y - rise - 0.045, s * half],
        [-len / 2, y - rise - 0.045, s * half]
      ],
      hi,
      [0, 0, s]
    );
  }
  m.box(0, y + 0.02, 0, len + 0.04, 0.07, 0.1, ridgeTone);
  if (ends)
    for (const e of [-1, 1]) {
      // A small upturned end to the ridge.
      m.tube([e * (len / 2 + 0.01), y + 0.03, 0], [e * (len / 2 + 0.09), y + 0.13, 0], 0.035, 0.015, ridgeTone, 5);
    }
}

// A plastered wall along x of the frame, from x0 to x1, `thick` deep, standing from y0 to y1:
// a dark stone footing, white plaster above with a grey band under the coping, and a coping of
// tiles (`cap` false leaves it off, for walls under a roof).
function plasteredWall(m, x0, x1, y0, y1, thick = 0.24, cap = true, foot = 0.45) {
  const len = x1 - x0,
    cx = (x0 + x1) / 2,
    t = thick / 2;
  slab(m, x0, x1, y0, Math.min(y1, y0 + foot), -t - 0.012, t + 0.012, footing);
  if (y1 > y0 + foot) {
    const n = Math.max(1, Math.round(len / 1.4));
    for (let i = 0; i < n; i++) plasterBlock(m, x0 + (len * i) / n, x0 + (len * (i + 1)) / n, y0 + foot, y1, -t, t);
    m.box(cx, y1 - 0.05, 0, len + 0.01, 0.1, thick + 0.03, m.mix(brick, ridgeTone, 0.3));
  }
  if (cap) m.frame(cx, 0, 0, 0, 1, () => tileCap(m, len + 0.1, y1 + 0.16, t + 0.13, 0.12, false));
}

// A block of whitewashed wall between two corners: the faces graded from clean plaster at the
// foot to a grey rain stain under the top.
function plasterBlock(m, x0, x1, y0, y1, z0, z1) {
  const stain = m.mix(plaster, plasterStain, 0.3 + 0.3 * m.rng.next()),
    body = m.rgb(m.mix(plaster, plasterShade, 0.15 * m.rng.next()));
  const sides = [
    [[x0, z0], [x1, z0], [0, 0, -1]],
    [[x1, z1], [x0, z1], [0, 0, 1]],
    [[x0, z1], [x0, z0], [-1, 0, 0]],
    [[x1, z0], [x1, z1], [1, 0, 0]]
  ];
  for (const [[ax, az], [bx, bz], hint] of sides)
    put(m, [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], [body, body, stain, stain], hint);
  put(m, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], plasterShade);
}

// 馬頭牆: a stepped gable wall standing from y0, thin along x of the frame and `depth` long
// along z (front to back of the building). `steps` gives the height of each step, outermost
// first; each is capped with tiles and its outer end rises into an upturned horse head.
function horseHeadWall(m, depth, y0, steps, thick = 0.26) {
  const k = steps.length,
    half = depth / 2,
    t = thick / 2;
  slab(m, -t - 0.012, t + 0.012, y0, y0 + 0.55, -half, half, footing);
  for (let i = 0; i < k; i++) {
    const outer = half * (1 - i / k),
      inner = i === k - 1 ? 0 : half * (1 - (i + 1) / k),
      h = steps[i];
    for (const s of i === k - 1 ? [0] : [-1, 1]) {
      const z0 = s ? Math.min(s * inner, s * outer) : -outer,
        z1 = s ? Math.max(s * inner, s * outer) : outer;
      plasterBlock(m, -t, t, y0 + 0.55, h, z0, z1);
      m.box(0, h - 0.05, (z0 + z1) / 2, thick + 0.03, 0.1, z1 - z0, m.mix(brick, ridgeTone, 0.3));
      m.frame(0, 0, (z0 + z1) / 2, Math.PI / 2, 1, () => tileCap(m, z1 - z0 + 0.12, h + 0.17, t + 0.12, 0.11, false));
      for (const e of s ? [s] : [-1, 1]) {
        const z = e * (outer + 0.04);
        m.box(0, h + 0.24, z - e * 0.06, 0.15, 0.12, 0.2, ridgeTone);
        m.tube([0, h + 0.26, z], [0, h + 0.42, z + e * 0.13], 0.05, 0.018, ridgeTone, 5);
      }
    }
  }
}

// A column of chestnut lacquer on a stone drum base, from y0 to y1.
function column(m, x, z, y0, y1, r = 0.11) {
  m.lathe(
    x,
    y0,
    z,
    [
      [0, r * 1.75],
      [0.06, r * 1.8],
      [0.1, r * 1.6],
      [0.15, r * 1.25],
      [0.17, 0]
    ],
    granite,
    10
  );
  m.tube([x, y0 + 0.16, z], [x, y1, z], r, r * 0.92, timber, 9);
}

// A lattice panel in the x-y plane of the frame, w by h, its foot at the origin: a stout frame,
// a grid of thin bars over paper (lit or dark), and a solid skirt panel below.
function latticePanel(m, w, h, { nx = 4, ny = 6, skirt = 0.32, glow = paperLit, dark = false } = {}) {
  const t = 0.05,
    back = dark ? interior : glow;
  // The paper (or the dark room) behind the bars.
  put(
    m,
    [
      [-w / 2, skirt, -0.01],
      [w / 2, skirt, -0.01],
      [w / 2, h, -0.01],
      [-w / 2, h, -0.01]
    ],
    back,
    [0, 0, 1]
  );
  m.box(0, skirt / 2, 0, w, skirt, 0.04, timberDark);
  m.box(0, skirt * 0.5, 0.022, w * 0.7, skirt * 0.5, 0.01, timber);
  for (const s of [-1, 1]) m.box((s * (w - t)) / 2, h / 2, 0.01, t, h, 0.06, timber);
  m.box(0, h - t / 2, 0.01, w, t, 0.06, timber);
  m.box(0, skirt + t / 2, 0.01, w, t, 0.06, timber);
  for (let i = 1; i < nx; i++) m.box(-w / 2 + (w * i) / nx, (skirt + h) / 2, 0.012, 0.016, h - skirt, 0.02, lattice);
  for (let j = 1; j < ny; j++) m.box(0, skirt + ((h - skirt) * j) / ny, 0.012, w, 0.016, 0.02, lattice);
}

// A round or flat inlay a hair above a surface, for paving signs.
function disc(m, x, y, z, r, col, n = 16) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n;
    pts.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
  }
  put(m, pts, col);
}

export {
  plaster,
  plasterShade,
  plasterStain,
  footing,
  granite,
  graniteShade,
  graniteDark,
  brick,
  brickLight,
  mortar,
  tiles,
  ridgeTone,
  timber,
  timberDark,
  timberLight,
  lattice,
  paperLit,
  interior,
  bronze,
  bronzeDark,
  verdigris,
  gilt,
  inkBoard,
  cells,
  WIDTH,
  HEIGHT,
  CX,
  CZ,
  walk,
  TOP,
  GROUND,
  SHELF,
  WATER,
  put,
  slab,
  plasterBlock,
  tileCap,
  plasteredWall,
  horseHeadWall,
  column,
  latticePanel,
  disc
};
