import { circle } from '../scenery-kit.js';
import { lantern } from '../maze-models.js';

// The finer work of 繡閣, drawn in the house's own frame (it faces +z, its floor at
// y = 0.26, its eaves at 1.8): round tile-ends and drip tiles along the eaves, an
// openwork ridge with a gourd finial, bells at the upturned corners, brackets on the
// column heads, carved column bases, a balustrade with a "beauty's rest" bench to each
// side of the steps, and lanterns hung under the front eave.

const W = 3.0,
  D = 1.8,
  floor = 0.26,
  eave = 1.8;
const wood = 0x2c2321,
  woodLit = 0x4a382f,
  lacquer = 0x6b2a26,
  gilt = 0xc9a24f,
  tile = 0x3a4044,
  tileLit = 0x6a7377;

// The same curve the roof is laid on (roof() in maze-models.js, called with these
// sizes), so the tile-ends sit on its edge.
const roofW = W + 1.1,
  roofD = D + 0.84,
  rise = 0.85;
function onRoof(u, t, side) {
  return [
    u * (roofW * 0.5) * (1 - 0.34 * t),
    eave +
      rise * (0.15 * t + 0.85 * t * t) +
      rise * 0.38 * Math.pow(Math.abs(u), 3.2) * (1 - t) * (1 - 0.6 * t),
    side * roofD * 0.5 * (1 - t)
  ];
}

// Round tile-ends (瓦當) at the foot of each row of tiles, with a pointed drip tile
// (滴水) between each pair, along the front and back eaves.
function eaveEnds(m) {
  const rows = Math.max(12, Math.round(roofW * 4));
  for (const side of [-1, 1])
    for (let i = 0; i <= rows; i++) {
      const u = -1 + (2 * i) / rows,
        [x, y, z] = onRoof(u, 0, side);
      // The disc, faced outward and a little down.
      const disc = [];
      for (let k = 0; k < 8; k++) {
        const a = (k * circle) / 8;
        disc.push([x + Math.cos(a) * 0.045, y - 0.04 + Math.sin(a) * 0.045, z + side * 0.012]);
      }
      m.face(side > 0 ? disc : [...disc].reverse(), tileLit);
      const boss = disc.map(([px, py, pz]) => [
        x + (px - x) * 0.55,
        y - 0.04 + (py - y + 0.04) * 0.55,
        pz + side * 0.004
      ]);
      m.face(side > 0 ? boss : boss.reverse(), tile);
      if (i < rows) {
        const [x2, y2] = onRoof(u + 1 / rows, 0, side);
        const drip = [
          [x + 0.05, y - 0.07, z + side * 0.008],
          [(x + x2) / 2, (y + y2) / 2 - 0.13, z + side * 0.02],
          [x2 - 0.05, y2 - 0.07, z + side * 0.008]
        ];
        m.face(side > 0 ? drip : drip.reverse(), tile);
      }
    }
}

// The ridge: a band of openwork tiles in linked rings, and a gilt gourd in the middle.
function ridge(m) {
  const [lx, ly] = onRoof(-1, 1, 1),
    [rx] = onRoof(1, 1, 1),
    count = 11;
  m.box(0, ly + 0.07, 0, rx - lx - 0.2, 0.03, 0.09, tile);
  for (let k = 0; k < count; k++) {
    const x = lx + 0.2 + ((rx - lx - 0.4) * (k + 0.5)) / count;
    if (Math.abs(x) < 0.2) continue;
    m.hoop(x, ly + 0.145, 0, 0.055, 0.012, tileLit, 8, 'xy');
  }
  m.box(0, ly + 0.22, 0, rx - lx - 0.2, 0.025, 0.08, tile);
  m.lathe(
    0,
    ly + 0.06,
    0,
    [
      [0, 0.09],
      [0.06, 0.1],
      [0.1, 0.05],
      [0.17, 0.085],
      [0.25, 0.07],
      [0.3, 0.035],
      [0.38, 0.05],
      [0.45, 0.03],
      [0.5, 0.008]
    ],
    gilt,
    10
  );
}

// A wind bell under each upturned corner, hung from the tip of the curl.
function cornerBells(m) {
  for (const end of [-1, 1])
    for (const side of [-1, 1]) {
      const p = onRoof(end, 0, side),
        tip = [p[0] + end * 0.13, p[1] + 0.1, p[2] + side * 0.08];
      m.tube(tip, [tip[0], tip[1] - 0.16, tip[2]], 0.005, 0.005, 0x2c2e31, 3);
      m.lathe(
        tip[0],
        tip[1] - 0.27,
        tip[2],
        [
          [0, 0.045],
          [0.03, 0.04],
          [0.09, 0.028],
          [0.11, 0.01]
        ],
        0x5d6b4c,
        8
      );
      m.tube(
        [tip[0], tip[1] - 0.27, tip[2]],
        [tip[0], tip[1] - 0.32, tip[2]],
        0.006,
        0.006,
        0x2c2e31,
        3
      );
      m.box(tip[0], tip[1] - 0.36, tip[2], 0.05, 0.07, 0.004, 0xb9263f);
    }
}

// A bracket set (斗拱) on a column head: a block, a cross-arm with blocks on its ends,
// and a second, longer arm above carrying the eave beam.
function bracket(m, x, z, out) {
  const y = eave - 0.15;
  z += out * 0.06;
  m.box(x, y - 0.06, z, 0.12, 0.06, 0.12, woodLit);
  m.box(x, y, z, 0.42, 0.045, 0.07, wood);
  m.box(x, y, z + out * 0.12, 0.07, 0.045, 0.3, wood);
  for (const s of [-1, 1]) {
    m.box(x + s * 0.19, y + 0.04, z, 0.07, 0.04, 0.08, woodLit);
    m.box(x, y + 0.04, z + out * (0.12 + s * 0.12), 0.08, 0.04, 0.07, woodLit);
  }
  m.box(x, y + 0.075, z, 0.62, 0.035, 0.06, lacquer);
}

// A drum-shaped stone under each column.
function columnBase(m, x, z) {
  m.lathe(
    x,
    floor - 0.005,
    z,
    [
      [0, 0.1],
      [0.03, 0.11],
      [0.07, 0.1],
      [0.09, 0.075]
    ],
    0xa29e93,
    10
  );
}

// A beauty's rest (靠背欄): a low balustrade whose top rail is a bench, its back of curved slats leaning
// out over the garden. Runs along x from x0 to x1 at z.
function beautyRest(m, x0, x1, z) {
  const seat = floor + 0.3,
    n = Math.round(Math.abs(x1 - x0) / 0.09);
  for (const x of [x0, x1]) {
    m.box(x, floor + 0.2, z, 0.06, 0.4, 0.06, wood);
    m.box(x, floor + 0.42, z, 0.08, 0.04, 0.08, woodLit);
  }
  // The panel under the seat: a frame and a lattice of upright and level bars.
  m.box((x0 + x1) / 2, floor + 0.04, z, Math.abs(x1 - x0), 0.04, 0.04, wood);
  m.box((x0 + x1) / 2, seat - 0.05, z, Math.abs(x1 - x0), 0.03, 0.04, wood);
  m.box((x0 + x1) / 2, floor + 0.15, z, Math.abs(x1 - x0), 0.018, 0.02, woodLit);
  for (let k = 1; k < n; k++) {
    const x = x0 + ((x1 - x0) * k) / n;
    m.box(x, floor + 0.15, z, 0.016, 0.18 + (k % 2) * 0.04, 0.018, woodLit);
  }
  // The seat plank and the curved back.
  m.box((x0 + x1) / 2, seat, z + 0.03, Math.abs(x1 - x0) + 0.04, 0.025, 0.16, woodLit);
  for (let k = 0; k <= n; k++) {
    const x = x0 + ((x1 - x0) * k) / n;
    m.line(
      [
        [x, seat + 0.01, z + 0.1],
        [x, seat + 0.13, z + 0.16],
        [x, seat + 0.24, z + 0.2],
        [x, seat + 0.3, z + 0.18]
      ],
      0.009,
      wood,
      4
    );
  }
  m.line(
    [
      [x0, seat + 0.3, z + 0.18],
      [x1, seat + 0.3, z + 0.18]
    ],
    0.018,
    lacquer,
    5
  );
  m.line(
    [
      [x0, seat + 0.14, z + 0.165],
      [x1, seat + 0.14, z + 0.165]
    ],
    0.01,
    wood,
    4
  );
}

// A plum-blossom grille set in a round window (drawn in the plane z = 0, looking +z).
function blossomGrille(m, x, y, radius, col) {
  for (let k = 0; k < 5; k++) {
    const a = (k * circle) / 5 + Math.PI / 2;
    m.hoop(
      x + Math.cos(a) * radius * 0.42,
      y + Math.sin(a) * radius * 0.42,
      0.058,
      radius * 0.3,
      0.008,
      col,
      10,
      'xy'
    );
  }
  m.hoop(x, y, 0.058, radius * 0.14, 0.009, col, 8, 'xy');
}

// Lamplit things glimpsed through the door: a long table with a vase of plum, a
// hanging scroll of embroidered peonies behind it.
function interior(m, z) {
  m.box(-0.2, floor + 0.62, z - 0.05, 0.36, 0.5, 0.01, 0xefe4d0);
  m.box(-0.2, floor + 0.89, z - 0.05, 0.4, 0.03, 0.02, wood);
  m.box(-0.2, floor + 0.36, z - 0.05, 0.4, 0.03, 0.02, wood);
  for (const [x, y, s, c] of [
    [-0.24, 0.66, 0.07, 0xd9456a],
    [-0.15, 0.6, 0.05, 0xf09bb0],
    [-0.27, 0.56, 0.04, 0x5f8a4c],
    [-0.12, 0.7, 0.04, 0xc0345a]
  ])
    m.box(x, floor + y, z - 0.04, s, s, 0.008, c);
  m.lathe(
    -0.04,
    floor + 0.26,
    z - 0.02,
    [
      [0, 0.03],
      [0.05, 0.05],
      [0.12, 0.035],
      [0.16, 0.018],
      [0.2, 0.026]
    ],
    0x6f9aa8,
    8
  );
  for (let k = 0; k < 3; k++) {
    const a = -0.6 + k * 0.6,
      end = [-0.04 + Math.sin(a) * 0.16, floor + 0.64 + 0.04 * k, z - 0.02];
    m.line(
      [[-0.04, floor + 0.45, z - 0.02], [-0.04 + Math.sin(a) * 0.07, floor + 0.55, z - 0.02], end],
      0.006,
      0x2a2220,
      3
    );
    m.box(end[0], end[1], end[2], 0.035, 0.035, 0.01, 0xd23f55);
  }
}

function houseDetail(m) {
  const half = W / 2,
    front = D / 2;
  eaveEnds(m);
  ridge(m);
  cornerBells(m);
  for (const s of [-1, 1]) {
    for (const z of [-front, front]) {
      bracket(m, s * half, z, Math.sign(z));
      columnBase(m, s * half, z);
    }
    bracket(m, s * 0.5, front + 0.02, 1);
    columnBase(m, s * 0.5, front + 0.02);
    beautyRest(m, s * 0.62, s * 1.72, front + 0.27);
    // Lanterns hung under the front eave, between the columns.
    m.tube(
      [s * 1.0, eave - 0.05, front + 0.2],
      [s * 1.0, eave - 0.2, front + 0.2],
      0.006,
      0.006,
      0x2c2e31,
      3
    );
    lantern(m, s * 1.0, eave - 0.32, front + 0.2, 0.42, 0xe7899f);
  }
  m.frame(0, 0, front, 0, 1, () => blossomGrille(m, -1.0, floor + 0.68, 0.3, wood));
  for (const s of [-1, 1])
    m.frame(s * half, 0, 0, (s * Math.PI) / 2, 1, () =>
      blossomGrille(m, 0, floor + 0.68, 0.3, wood)
    );
  interior(m, front + 0.09);
}

export { houseDetail };
