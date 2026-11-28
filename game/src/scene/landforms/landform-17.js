// 萬安寺: the court before the pagoda, in the Yuan capital, at night. The board is a raised court
// of temple brick, two steps above the paving round it. At its north edge the thirteen-storey
// pagoda rises from its plinth (the board's 3 by 2 block of rock), steps before its lit door
// between two great incense burners; behind it the great hall stands on its terrace between
// the bell and drum towers. Down the west side are the monks' quarters, down the east (nearest
// the camera, so kept low) an open corridor; the 山門 with its three arches closes the south.
// Outside the red precinct wall lie the streets of the city, and far off its roofs and walls.
// Everything is lit by its own lamps, whose warm light is painted into the stone round them.
import { Model, circle } from '../scenery-kit.js';
import { clump, cypress, oldPine } from './garden-13.js';
import { paveTile } from './paving-17.js';
import { props17 } from './props-17.js';
import { pagoda } from './pagoda-17.js';
import { mainHall, tower, quarters, corridor, gate, STREET } from './temple-17.js';
import { nearCity, farCity } from './city-17.js';
import {
  osmanthus,
  ginkgo,
  fallenLeaves,
  puddle,
  moss,
  crack,
  pottedShrub,
  bonsai
} from './flora-17.js';
import { prayerFlags, lanternString, mast, candleRack, smoke, well, bench } from './life-17.js';
import {
  OUT,
  LAMPS,
  courtLanterns,
  onBoard,
  isWall,
  isBed,
  doorways,
  coping,
  cap,
  wallRed,
  plaster,
  CX,
  CZ,
  WIDTH,
  HEIGHT,
  bathe,
  put,
  mark,
  stoneLantern,
  redWall,
  brick,
  brickLight,
  mortar,
  stone,
  stoneLight,
  stoneDark
} from './kit-17.js';

const patina = 0x46483c; // old bronze, dulled green-grey
const bronzeDark = 0x2c2e27;

// Ground that is not to be paved: the footprints of the buildings round the court.
const built = [
  [-8.3, 8.3, -18.2, -10.1], // the great hall's terrace
  [-12.6, -8.45, -7.0, 6.2], // the monks' quarters
  [9.1, 12.6, -6.9, 6.9], // the east corridor
  [-4.2, 4.2, 10.8, 13.4] // the gate
];
const isBuilt = (x, z) => built.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1);

// The court round the board: long bricks over mortar in a grid that runs on from the board's,
// the stone way down the middle, and a drip course of dark stone along the foot of the board.
function court(m, layout) {
  const { width, height } = layout,
    cx = (width - 1) / 2,
    cz = (height - 1) / 2,
    r = m.rng;
  for (let gx = -12; gx <= 12; gx++)
    for (let gz = -18; gz <= 11; gz++) {
      const x = gx,
        z = gz + 0.5;
      if (onBoard(x + cx, z + cz) || isBed(x + cx, z + cz) || isWall(x + cx, z + cz) || isBuilt(x, z))
        continue;
      put(
        m,
        [
          [x - 0.5, OUT - 0.004, z - 0.5],
          [x - 0.5, OUT - 0.004, z + 0.5],
          [x + 0.5, OUT - 0.004, z + 0.5],
          [x + 0.5, OUT - 0.004, z - 0.5]
        ],
        mortar
      );
      const way = Math.abs(x) < 0.6 && (z > 5.9 || (z < -7.4 && z > -10));
      if (way) {
        const a = z - 0.48,
          b = z + 0.48;
        put(
          m,
          [
            [x - 0.62, OUT, a],
            [x - 0.62, OUT, b],
            [x + 0.62, OUT, b],
            [x + 0.62, OUT, a]
          ],
          m.mix(stone, stoneLight, r.next() * 0.4)
        );
        continue;
      }
      // Two long bricks to a cell, laid across the cell's neighbours in alternate rows.
      const across = (gx + gz) % 2 === 0;
      for (const sx of [-1, 1]) {
        const lo = sx < 0 ? -0.49 : 0.012,
          hi = sx < 0 ? -0.012 : 0.49,
          [x0, x1, z0, z1] = across
            ? [x + lo, x + hi, z - 0.49, z + 0.49]
            : [x - 0.49, x + 0.49, z + lo, z + hi];
        put(
          m,
          [
            [x0, OUT, z0],
            [x0, OUT, z1],
            [x1, OUT, z1],
            [x1, OUT, z0]
          ],
          m.mix(brick, brickLight, r.next() * 0.55)
        );
      }
    }
  // The drip course: a band of dark stone along every exposed side of the board.
  for (const cell of layout.cells)
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      if (onBoard(cell.x + dx, cell.y + dz)) continue;
      const x = cell.x - cx + dx * 0.5,
        z = cell.y - cz + dz * 0.5;
      m.frame(x, OUT, z, Math.atan2(dx, dz), 1, () => {
        m.box(0, 0.012, 0.16, 1.0, 0.03, 0.3, stoneDark);
        m.box(0, 0.03, 0.31, 1.0, 0.03, 0.03, stone);
      });
    }
  // Stone lanterns round the board.
  for (const [x, z] of courtLanterns) stoneLantern(m, x, OUT, z, 1.0);
  furnishings(m);
  courtLife(m, layout);
  sideWalls(m);
  beds(m);
}

// What stands in the court south of the board, between it and the 山門: a great bronze censer
// on the way, a stele on a tortoise either side, and bronze water vats down the east side.
function furnishings(m) {
  m.frame(0, OUT, 8.7, 0, 1, () => {
    m.box(0, 0.1, 0, 1.2, 0.2, 1.2, stoneDark);
    m.box(0, 0.23, 0, 1.0, 0.06, 1.0, stone);
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3 + 0.5;
      m.line(
        [
          [Math.cos(a) * 0.3, 0.26, Math.sin(a) * 0.3],
          [Math.cos(a) * 0.36, 0.4, Math.sin(a) * 0.36],
          [Math.cos(a) * 0.26, 0.55, Math.sin(a) * 0.26]
        ],
        0.05,
        bronzeDark,
        5
      );
    }
    m.lathe(
      0,
      0.5,
      0,
      [
        [0, 0.12],
        [0.05, 0.3],
        [0.16, 0.42],
        [0.3, 0.4],
        [0.36, 0.33],
        [0.4, 0.37],
        [0.43, 0.37]
      ],
      patina,
      12
    );
    for (const s of [-1, 1]) m.hoop(s * 0.41, 0.98, 0, 0.1, 0.022, bronzeDark, 6, 'xy');
    m.glow(() =>
      m.lathe(
        0,
        0.9,
        0,
        [
          [0, 0.32],
          [0.005, 0.32]
        ],
        0xd8642c,
        12
      )
    );
    // A pierced lid like a little pavilion roof, and a thread of smoke.
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + Math.PI / 4;
      m.tube(
        [Math.cos(a) * 0.26, 0.93, Math.sin(a) * 0.26],
        [Math.cos(a) * 0.2, 1.12, Math.sin(a) * 0.2],
        0.018,
        0.018,
        bronzeDark,
        4
      );
    }
    m.lathe(
      0,
      1.1,
      0,
      [
        [0, 0.36],
        [0.05, 0.3],
        [0.16, 0.12],
        [0.22, 0.05],
        [0.3, 0.07],
        [0.38, 0]
      ],
      patina,
      8
    );
    m.line(
      [
        [0, 1.45, 0],
        [0.04, 1.75, 0.02],
        [-0.03, 2.05, -0.02],
        [0.05, 2.4, 0]
      ],
      0.01,
      0x737c8c,
      4
    );
    mark(m, 0, 1.0, 0, 1.1);
  });
  // 石碑: a stele on the back of a stone tortoise, its top carved with dragons.
  for (const s of [-1, 1])
    m.frame(s * 5.5, OUT, 9.1, (-s * Math.PI) / 2, 1, () => {
      m.box(0, 0.06, 0, 1.0, 0.12, 1.5, stoneDark);
      m.rock(0, 0.1, 0, 0.42, 0.34, 0.62, stone, stoneLight, 9);
      m.rock(0, 0.18, 0.62, 0.15, 0.2, 0.2, stone, stoneLight, 7);
      for (const [x, z] of [
        [-0.38, 0.4],
        [0.38, 0.4],
        [-0.38, -0.4],
        [0.38, -0.4]
      ])
        m.rock(x, 0.1, z, 0.12, 0.12, 0.13, stoneDark, stone, 6);
      m.box(0, 0.98, -0.05, 0.84, 1.16, 0.2, stone);
      m.box(0, 0.98, -0.05, 0.66, 0.92, 0.205, m.mix(stone, stoneDark, 0.3));
      // Columns of characters cut into both faces.
      for (const f of [-1, 1])
        for (let c = 0; c < 6; c++)
          for (let r = 0; r < 7; r++) {
            const x = -0.25 + c * 0.1,
              y = 1.33 - r * 0.11,
              z = -0.05 + f * 0.104;
            put(
              m,
              [
                [x - 0.022, y - 0.03, z],
                [x + 0.022, y - 0.03, z],
                [x + 0.022, y + 0.03, z],
                [x - 0.022, y + 0.03, z]
              ],
              stoneDark,
              [0, 0, f]
            );
          }
      m.lathe(
        0,
        1.56,
        -0.05,
        [
          [0, 0.44],
          [0.12, 0.42],
          [0.26, 0.3],
          [0.34, 0]
        ],
        stone,
        8
      );
    });
  // Bronze water vats on stone stands down the east side of the court.
  for (const z of [-5.0, 0.0, 5.0])
    m.frame(8.2, OUT, z, 0, 1, () => {
      m.box(0, 0.08, 0, 0.7, 0.16, 0.7, stoneDark);
      m.lathe(
        0,
        0.16,
        0,
        [
          [0, 0.22],
          [0.08, 0.34],
          [0.42, 0.36],
          [0.5, 0.31],
          [0.52, 0.33]
        ],
        patina,
        12
      );
      m.lathe(
        0,
        0.64,
        0,
        [
          [0, 0.3],
          [0.002, 0.3]
        ],
        0x1d2a33,
        12
      );
      for (const s of [-1, 1]) m.hoop(s * 0.36, 0.5, 0, 0.06, 0.016, bronzeDark, 6, 'xy');
    });
}

// The walls between the side courts and the centre, built on the board's void tiles: a stone
// foot filling the tile up to the board, a low red wall under a tile coping with a lattice
// window, and a pier with a lamp in its face either side of each doorway.
function sideWalls(m) {
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      if (!isWall(x, y)) continue;
      const wx = x - CX,
        wz = y - CZ;
      m.box(wx, (OUT + 0.1) / 2, wz, 1.0, 0.1 - OUT, 1.0, stoneDark);
      m.box(wx, 0.09, wz, 1.03, 0.04, 1.03, stone);
      m.box(wx, 0.45, wz, 0.42, 0.7, 1.0, wallRed);
      m.box(wx, 0.77, wz, 0.44, 0.06, 1.0, plaster);
      m.frame(wx, 0, wz, Math.PI / 2, 1, () => coping(m, 1.0, 0.8, 0.3, 0.15));
      const door = doorways.find((c) => c.x === x && Math.abs(c.y - y) === 1);
      if (door) {
        // A pier at the doorway, a lamp set in a niche on either face.
        const pz = wz + (door.y - y) * 0.38;
        m.box(wx, 0.6, pz, 0.6, 1.0, 0.26, wallRed);
        m.box(wx, 1.11, pz, 0.64, 0.04, 0.3, plaster);
        m.frame(wx, 0, pz, 0, 1, () => cap(m, 1.16, 0.22, 0.14, stoneDark, stone));
        for (const s of [-1, 1]) {
          m.glow(() => m.box(wx + s * 0.3, 0.8, pz, 0.02, 0.16, 0.12, 0xf0b060));
          m.box(wx + s * 0.31, 0.89, pz, 0.03, 0.03, 0.18, stoneDark);
        }
        mark(m, wx, 0.8, pz, 0.8);
      } else
        // A lattice window through the wall, framed in stone.
        for (const s of [-1, 1]) {
          const fx = wx + s * 0.215;
          m.box(fx, 0.45, wz, 0.02, 0.42, 0.56, stone);
          m.box(fx + s * 0.002, 0.45, wz, 0.02, 0.34, 0.48, 0x23262e);
          for (const k of [-1, 0, 1]) {
            m.box(fx + s * 0.006, 0.45 + k * 0.1, wz, 0.02, 0.025, 0.48, plaster);
            m.box(fx + s * 0.006, 0.45, wz + k * 0.14, 0.02, 0.34, 0.025, plaster);
          }
        }
    }
}

// The other voids inside the board's bounds are raised beds, filled to a little under the board
// and kerbed where they meet the court: low shrubs, grasses and flowers, a stone here and
// there, and a sweet osmanthus in each corner bed.
const BED = -0.1;
function beds(m) {
  const r = m.rng;
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      if (!isBed(x, y)) continue;
      const wx = x - CX,
        wz = y - CZ;
      put(
        m,
        [
          [wx - 0.5, BED, wz - 0.5],
          [wx - 0.5, BED, wz + 0.5],
          [wx + 0.5, BED, wz + 0.5],
          [wx + 0.5, BED, wz - 0.5]
        ],
        m.mix(0x2a231d, 0x342a22, r.next())
      );
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nx = x + dx,
          ny = y + dz;
        if (onBoard(nx, ny) || isBed(nx, ny) || isWall(nx, ny)) continue;
        m.box(
          wx + dx * 0.44,
          (OUT + BED + 0.05) / 2,
          wz + dz * 0.44,
          dx ? 0.12 : 1.0,
          BED + 0.05 - OUT,
          dz ? 0.12 : 1.0,
          stone
        );
      }
      // Low shrubs and grass, kept under knee height.
      for (let k = 0; k < 1 + ((x + y) % 2); k++) {
        const px = wx + r.range(-0.3, 0.3),
          pz = wz + r.range(-0.3, 0.3),
          s = r.range(0.16, 0.26);
        clump(m, px, BED + s * 0.7, pz, s, s * 0.8, s, 0x1d3526, 0x3c5f42, 6);
      }
      for (let k = 0; k < 4; k++) {
        const px = wx + r.range(-0.42, 0.42),
          pz = wz + r.range(-0.42, 0.42),
          a = r.range(0, circle),
          l = r.range(0.12, 0.2);
        m.leaf([px, BED, pz], [px + Math.cos(a) * l * 0.4, BED + l, pz + Math.sin(a) * l * 0.4], 0.02, 0x3d5a34, 0x6a8a4c, 0.03);
      }
      if (r.next() < 0.45)
        for (let k = 0; k < 3; k++)
          m.box(wx + r.range(-0.35, 0.35), BED + r.range(0.12, 0.3), wz + r.range(-0.35, 0.35), 0.04, 0.04, 0.04, r.pick([0xd8c070, 0xc888a8, 0xe8e0d0]));
      if (r.next() < 0.3) m.rock(wx + r.range(-0.3, 0.3), BED - 0.02, wz + r.range(-0.3, 0.3), 0.14, 0.14, 0.11, 0x56606e, 0x8a94a2, 7);
    }
  for (const sx of [-1, 1]) {
    osmanthus(m, sx * 5.75, -5.45, 0.95, BED);
    osmanthus(m, sx * 5.55, 4.85, 0.9, BED);
  }
}

// Old trees in the court: columnar cypresses and pines in the corners and by the walls.
function courtTrees(m, side) {
  const sets = {
    north: [
      [-11.4, -15.6, 1.4, 'c'],
      [11.2, -16.0, 1.3, 'c'],
      [-9.6, -16.6, 1.2, 'c'],
      [-7.6, -16.9, 1.15, 'c'],
      [8.0, -17.0, 1.1, 'c'],
      [9.6, -15.4, 1.0, 'c']
    ],
    west: [
      [-12.0, -8.3, 1.1, 'g'],
      [-8.2, 7.6, 1.2, 'c'],
      [-11.2, 8.4, 1.1, 'c'],
      [-8.6, -8.6, 0.9, 'c'],
      [-14.3, -2.0, 1.4, 'c'],
      [-14.3, 4.6, 1.3, 'c']
    ],
    east: [
      [8.8, -7.7, 1.0, 'g'],
      [11.6, 9.6, 1.0, 'c']
    ],
    south: [
      [-8.6, 9.4, 0.95, 'g'],
      [6.8, 9.9, 0.95, 'c'],
      [-6.6, 14.1, 1.0, 'p'],
      [6.6, 14.1, 0.95, 'p']
    ]
  };
  for (const [x, z, s, kind] of sets[side]) {
    const y = z > 13 || x < -13 ? STREET : OUT;
    if (kind === 'p') oldPine(m, x, z, s, y);
    else if (kind === 'g') ginkgo(m, x, z, s, y);
    else cypress(m, x, z, s, y);
  }
}

// The masts before the great hall and the strings of five-coloured prayer flags that run from
// them, and from the pagoda's galleries, out over the north court.
function prayerMasts(m) {
  const tops = [-1, 1].map((s) => mast(m, s * 5.6, -9.0, 4.7, OUT));
  for (const s of [-1, 1]) {
    const top = tops[(s + 1) / 2];
    prayerFlags(m, [s * 1.33, 5.0, -6.55], top, 0.45, 16);
    prayerFlags(m, [s * 1.2, 7.75, -6.5], [s * 8.7, 3.6, -12.4], 0.9, 26);
    prayerFlags(m, top, [s * (s < 0 ? 9.4 : 9.2), s < 0 ? 2.6 : 1.9, -6.9], 0.35, 12);
  }
}

// The life of the court: ginkgo leaves blown over the paving, puddles holding the lamplight,
// moss and cracks, plants in pots, racks of votive candles before the censer, a string of
// lanterns across the way, and smoke from the great burners.
function courtLife(m, layout) {
  const { width, height } = layout,
    cx = (width - 1) / 2,
    cz = (height - 1) / 2,
    r = m.rng,
    free = (x, z) =>
      !onBoard(Math.round(x + cx), Math.round(z + cz)) &&
      !isBed(Math.round(x + cx), Math.round(z + cz)) &&
      !isWall(Math.round(x + cx), Math.round(z + cz)) &&
      !isBuilt(x, z) &&
      Math.abs(x) < 12.3 &&
      z > -17.9 &&
      z < 11.8;
  fallenLeaves(m, -11.2, -8.3, 2.0, 55);
  fallenLeaves(m, 8.8, -7.7, 2.4, 60);
  fallenLeaves(m, -8.6, 9.4, 2.4, 60);
  for (let i = 0; i < 50; i++) {
    const x = r.range(-12, 12),
      z = r.range(-17.5, 11.5);
    if (free(x, z)) fallenLeaves(m, x, z, 0.3, 2);
  }
  for (const [x, z, rx, rz] of [
    [-7.2, 5.2, 0.5, 0.3],
    [7.3, 1.3, 0.45, 0.3],
    [-2.3, 7.8, 0.55, 0.32],
    [4.4, 7.5, 0.4, 0.28],
    [-3.6, -7.9, 0.5, 0.3],
    [3.4, -8.3, 0.35, 0.25],
    [9.6, 8.6, 0.5, 0.3],
    [-10.6, -12.6, 0.6, 0.35]
  ])
    puddle(m, x, z, rx, rz);
  for (const [x, z] of [
    [-12.0, -6.0],
    [-12.0, 6.5],
    [11.9, 8.5],
    [-11.8, 11.4],
    [11.8, 11.4],
    [-11.6, -8.3],
    [8.8, -7.7],
    [-8.6, 9.4],
    [-4.8, -9.6],
    [4.8, -9.8]
  ])
    moss(m, x, z, 0.7, 9);
  for (let i = 0; i < 40; i++) {
    const x = r.range(-12, 12),
      z = r.range(-17.5, 11.5);
    if (free(x, z)) crack(m, x, z, r.range(0.4, 0.9));
  }
  // Plants in pots by the steps, the porches and the gate.
  for (const s of [-1, 1]) {
    bonsai(m, s * 2.4, -9.1, 1.2, s * 0.4);
    pottedShrub(m, s * 2.6, 10.1, 1.1, OUT, 5);
    for (const z of [-6.6, -1.6, 1.6, 6.6]) pottedShrub(m, 8.4, z * s, 0.9, OUT, z === 1.6 ? 4 : 0);
  }
  pottedShrub(m, -7.9, -1.9, 1.0, OUT, 3);
  pottedShrub(m, -7.9, 1.1, 1.0, OUT, 0);
  bonsai(m, -7.6, -5.4, 1.0, 0.3);
  bonsai(m, -7.6, 4.8, 1.0, -0.4);
  // Sweet osmanthus in planters at the south corners of the board, a well and stone benches.
  osmanthus(m, -6.5, 7.5, 1.0);
  osmanthus(m, 6.7, 7.7, 0.95);
  osmanthus(m, -7.6, -6.9, 1.0);
  well(m, 9.4, 9.4, OUT, 0.5);
  for (const s of [-1, 1]) bench(m, 8.75, s * 4.0, OUT, Math.PI / 2);
  bench(m, -3.65, 10.0, OUT, 0);
  bench(m, 3.65, 10.0, OUT, 0);
  // Votive candles either side of the censer, and a string of lanterns across the way.
  for (const s of [-1, 1]) candleRack(m, s * 1.55, 8.75, OUT, 0);
  for (const s of [-1, 1]) {
    m.box(s * 4.4, OUT + 0.08, 9.5, 0.3, 0.16, 0.3, stoneDark);
    m.tube([s * 4.4, OUT, 9.5], [s * 4.4, OUT + 2.15, 9.5], 0.045, 0.035, 0x4a2a22, 5);
    m.lathe(
      s * 4.4,
      OUT + 2.15,
      9.5,
      [
        [0, 0.05],
        [0.08, 0.06],
        [0.14, 0]
      ],
      0xc9a45c,
      5
    );
  }
  lanternString(m, [-4.4, OUT + 2.08, 9.5], [4.4, OUT + 2.08, 9.5], 0.32, 8);
  // Smoke from the censer on the way and from the cauldron before the hall.
  smoke(m, 0, OUT + 1.45, 8.7, 1.9, 3);
  smoke(m, 0, OUT + 1.55, -8.6, 1.7, 2);
}

const tiles17 = {
  ground: (m, p, cell) => paveTile(m, p, cell),
  ...props17
};

function landform17(T, layout) {
  const group = new T.Group();
  group.name = '萬安寺・寶塔前庭';
  const lamps = LAMPS.slice();
  const make = (seed) => Object.assign(new Model(T, seed), { lamps });
  const parts = [];
  const add = (seed, draw, name, options, gain = 1) => {
    const m = make(seed);
    draw(m);
    parts.push({ m, name, options, gain });
  };
  add(170413, (m) => court(m, layout), '前庭磚地與石燈', {});
  add(170829, (m) => pagoda(m, 'foot'), '寶塔塔基與底層', {});
  add(170857, (m) => pagoda(m, 'tower'), '十三層寶塔', { occluder: true });
  add(
    171253,
    (m) => {
      mainHall(m);
      tower(m, -10.0, -11.0, 0, true);
      tower(m, 10.0, -11.0, 0, false);
      redWall(m, -12.6, -18.2, 12.6, -18.2, STREET, 2.95);
      courtTrees(m, 'north');
      prayerMasts(m);
    },
    '大雄寶殿與鐘鼓樓',
    { occluder: true }
  );
  add(
    171637,
    (m) => {
      quarters(m);
      redWall(m, -12.6, -18.2, -12.6, 12.1, STREET, 2.95);
      courtTrees(m, 'west');
    },
    '西側僧寮',
    { occluder: true }
  );
  add(
    172049,
    (m) => {
      corridor(m);
      redWall(m, 12.6, -18.2, 12.6, 12.1, STREET, 2.95);
      courtTrees(m, 'east');
    },
    '東廊',
    { occluder: true }
  );
  add(
    172463,
    (m) => {
      gate(m);
      redWall(m, -12.6, 12.1, -3.85, 12.1, STREET, 2.95);
      redWall(m, 3.85, 12.1, 12.6, 12.1, STREET, 2.95);
      courtTrees(m, 'south');
    },
    '山門',
    { occluder: true }
  );
  add(172871, nearCity, '寺外街巷', {}, 0.9);
  add(173297, farCity, '大都夜色', { distant: true, cast: false }, 0);
  for (const { m, name, options, gain } of parts) {
    if (gain) bathe(m, lamps, gain);
    group.add(m.finish(name, options));
  }
  return group;
}

export { landform17, tiles17 };
