// 萬安寺: the court before the pagoda, in the Yuan capital, at night. The board is a raised court
// of temple brick, two steps above the paving round it. At its north edge the thirteen-storey
// pagoda rises from its plinth (the board's 3 by 2 block of rock), steps before its lit door
// between two great incense burners; behind it the great hall stands on its terrace between
// the bell and drum towers. Down the west side are the monks' quarters, down the east (nearest
// the camera, so kept low) an open corridor; the 山門 with its three arches closes the south.
// Outside the red precinct wall lie the streets of the city, and far off its roofs and walls.
// Everything is lit by its own lamps, whose warm light is painted into the stone round them.
import { Model, circle } from '../scenery-kit.js';
import { cypress, oldPine } from './garden-13.js';
import { paveTile } from './paving-17.js';
import { props17 } from './props-17.js';
import { pagoda } from './pagoda-17.js';
import { mainHall, tower, quarters, corridor, gate, STREET } from './temple-17.js';
import { nearCity, farCity } from './city-17.js';
import {
  OUT,
  LAMPS,
  courtLanterns,
  onBoard,
  bathe,
  put,
  stoneLantern,
  redWall,
  brick,
  brickLight,
  mortar,
  stone,
  stoneLight,
  stoneDark
} from './kit-17.js';

// Ground that is not to be paved: the footprints of the buildings round the court.
const built = [
  [-8.3, 8.3, -18.2, -10.1], // the great hall's terrace
  [-12.6, -8.45, -7.0, 6.2], // the monks' quarters
  [8.2, 12.6, -6.9, 6.9], // the east corridor
  [-4.2, 4.2, 9.6, 12.6] // the gate
];
const isBuilt = (x, z) => built.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1);

// The court round the board: square bricks over mortar in a grid that runs on from the board's,
// the stone way down the middle, and a drip course of dark stone along the foot of the board.
function court(m, layout) {
  const { width, height } = layout,
    cx = (width - 1) / 2,
    cz = (height - 1) / 2,
    r = m.rng;
  for (let gx = -12; gx <= 12; gx++)
    for (let gz = -18; gz <= 10; gz++) {
      const x = gx,
        z = gz + 0.5;
      if (onBoard(x + cx, z + cz) || isBuilt(x, z)) continue;
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
      for (const [sx, sz] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ]) {
        const x0 = x + (sx < 0 ? -0.49 : 0.012),
          x1 = x + (sx < 0 ? -0.012 : 0.49),
          z0 = z + (sz < 0 ? -0.49 : 0.012),
          z1 = z + (sz < 0 ? -0.012 : 0.49);
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
}

// Old trees in the court: columnar cypresses and pines in the corners and by the walls.
function courtTrees(m, side) {
  const sets = {
    north: [
      [-5.8, -8.6, 1.25, 'c'],
      [5.8, -8.6, 1.25, 'c'],
      [-3.6, -9.2, 1.1, 'c'],
      [3.6, -9.2, 1.1, 'c'],
      [-11.4, -15.6, 1.4, 'p'],
      [11.2, -16.0, 1.3, 'p']
    ],
    west: [
      [-7.8, -7.8, 1.3, 'p'],
      [-8.2, 7.6, 1.2, 'c'],
      [-11.2, 8.4, 1.1, 'c']
    ],
    east: [
      [8.0, -8.0, 1.15, 'c'],
      [11.4, 8.6, 1.0, 'c']
    ],
    south: [
      [-6.6, 8.8, 1.05, 'c'],
      [6.6, 8.8, 0.95, 'c']
    ]
  };
  for (const [x, z, s, kind] of sets[side]) {
    if (kind === 'p') oldPine(m, x, z, s, OUT);
    else cypress(m, x, z, s, OUT);
  }
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
  add(170829, pagoda, '十三層寶塔', { occluder: true });
  add(171253, (m) => {
    mainHall(m);
    tower(m, -10.0, -11.0, 0, true);
    tower(m, 10.0, -11.0, 0, false);
    redWall(m, -12.6, -18.2, 12.6, -18.2, STREET, 2.95);
    courtTrees(m, 'north');
  }, '大雄寶殿與鐘鼓樓', { occluder: true });
  add(171637, (m) => {
    quarters(m);
    redWall(m, -12.6, -18.2, -12.6, 10.9, STREET, 2.95);
    courtTrees(m, 'west');
  }, '西側僧寮', { occluder: true });
  add(172049, (m) => {
    corridor(m);
    redWall(m, 10.55, -6.9, 10.55, 6.9, OUT, 2.0, 0.26);
    redWall(m, 12.6, -18.2, 12.6, 10.9, STREET, 2.95);
    courtTrees(m, 'east');
  }, '東廊', { occluder: true });
  add(172463, (m) => {
    gate(m);
    redWall(m, -12.6, 10.9, -3.85, 10.9, STREET, 2.95);
    redWall(m, 3.85, 10.9, 12.6, 10.9, STREET, 2.95);
    courtTrees(m, 'south');
  }, '山門', { occluder: true });
  add(172871, nearCity, '寺外街巷', {}, 0.9);
  add(173297, farCity, '大都夜色', { distant: true, cast: false }, 0);
  for (const { m, name, options, gain } of parts) {
    if (gain) bathe(m, lamps, gain);
    group.add(m.finish(name, options));
  }
  return group;
}

export { landform17, tiles17 };
