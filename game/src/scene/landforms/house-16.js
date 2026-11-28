// The 溫 house round the court: the great hall (大堂) to the north on its granite terrace, its
// lattice doors open on a dark room with the family's long table and chairs, a black plaque
// over the middle bay and red lanterns under the eave; the east and west wings (廂房) with their
// verandas and lattice windows; the stepped horse-head gables (馬頭牆) that close every roof,
// the wings' south gables standing on the very lip of the ravine; and behind, the high outer
// walls, the two-storey rear building (後樓) and the roofs of the kitchen court.
import { circle } from '../scenery-kit.js';
import { tiledRoof } from './roof-13.js';
import {
  plaster,
  plasterShade,
  granite,
  graniteShade,
  graniteDark,
  brick,
  brickLight,
  tiles,
  ridgeTone,
  timber,
  timberDark,
  timberLight,
  interior,
  gilt,
  inkBoard,
  footing,
  SHELF,
  put,
  slab,
  plasteredWall,
  plasterBlock,
  horseHeadWall,
  column,
  latticePanel,
  tileCap
} from './kit-16.js';

const PLAT = 0.42; // the hall's terrace
const HALL = { x: 6.45, front: -6.75, back: -12.1, cols: -7.05, facade: -7.95, eave: 2.62, rise: 1.55 };
const WING = { plat: 0.25, front: 6.52, cols: 6.86, wall: 7.7, back: 10.7, north: -6.35, south: 2.0, eave: 2.25, rise: 1.05 };
const roofTones = tiles;
const lanternRed = 0xb8402e;
const squareTile = 0x8d908a; // 方磚 of the terrace

// Square floor tiles over a rectangle at height y.
function floorTiles(m, x0, x1, z0, z1, y, size = 0.5, col = squareTile) {
  const nx = Math.max(1, Math.round((x1 - x0) / size)),
    nz = Math.max(1, Math.round((z1 - z0) / size));
  put(m, [[x0, y - 0.006, z0], [x1, y - 0.006, z0], [x1, y - 0.006, z1], [x0, y - 0.006, z1]], 0x5a5d58);
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const a = x0 + ((x1 - x0) * i) / nx + 0.01,
        b = x0 + ((x1 - x0) * (i + 1)) / nx - 0.01,
        c = z0 + ((z1 - z0) * j) / nz + 0.01,
        d = z0 + ((z1 - z0) * (j + 1)) / nz - 0.01;
      put(m, [[a, y, c], [b, y, c], [b, y, d], [a, y, d]], m.mix(col, brickLight, m.rng.next() * 0.5));
    }
}
// A raised terrace: dressed granite kerb, coursed stone face down to the court.
function terrace(m, x0, x1, z0, z1, y, faces = [1, 1, 1, 1]) {
  const [n, e, s, w] = faces;
  const course = (ax, az, bx, bz, hint) => {
    const len = Math.hypot(bx - ax, bz - az),
      k = Math.max(1, Math.round(len / 0.9));
    for (let i = 0; i < k; i++) {
      const t0 = i / k,
        t1 = (i + 1) / k,
        p0 = [ax + (bx - ax) * t0, az + (bz - az) * t0],
        p1 = [ax + (bx - ax) * t1, az + (bz - az) * t1];
      put(m, [[p0[0], -0.05, p0[1]], [p1[0], -0.05, p1[1]], [p1[0], y - 0.1, p1[1]], [p0[0], y - 0.1, p0[1]]], m.mix(graniteShade, graniteDark, 0.15 + 0.3 * m.rng.next()), hint);
    }
    put(m, [[ax, y - 0.1, az], [bx, y - 0.1, bz], [bx, y, bz], [ax, y, az]], granite, hint);
  };
  if (s) course(x0, z1, x1, z1, [0, 0, 1]);
  if (n) course(x0, z0, x1, z0, [0, 0, -1]);
  if (w) course(x0, z0, x0, z1, [-1, 0, 0]);
  if (e) course(x1, z0, x1, z1, [1, 0, 0]);
}

// 雀替: carved brackets at the head of a column, under the beam, reaching both ways along x.
function sparrowBraces(m, x, y, z, reach = 0.45) {
  for (const s of [-1, 1])
    put(
      m,
      [
        [x, y, z],
        [x + s * reach, y, z],
        [x + s * reach * 0.55, y - 0.1, z],
        [x + s * 0.08, y - 0.3, z]
      ],
      timberLight,
      [0, 0, 1]
    );
}
// A red paper lantern with gilt caps and a tassel, hung by a cord from y.
function lantern(m, x, y, z, s = 1) {
  m.line([[x, y, z], [x, y - 0.2 * s, z]], 0.006, 0x2a2420, 3);
  m.lathe(
    x,
    y - 0.56 * s,
    z,
    [
      [0, 0.06 * s],
      [0.02 * s, 0.11 * s],
      [0.1 * s, 0.16 * s],
      [0.18 * s, 0.165 * s],
      [0.26 * s, 0.11 * s],
      [0.28 * s, 0.06 * s]
    ],
    lanternRed,
    10
  );
  m.tube([x, y - 0.29 * s, z], [x, y - 0.2 * s, z], 0.06 * s, 0.06 * s, gilt, 8);
  m.tube([x, y - 0.6 * s, z], [x, y - 0.56 * s, z], 0.06 * s, 0.06 * s, gilt, 8);
  m.line([[x, y - 0.6 * s, z], [x, y - 0.78 * s, z]], 0.015 * s, 0xc04a2c, 3);
}

// The hall's dark interior seen through its open doors: the long table (條案) against a screen
// with a painted scroll, an eight-immortals table and two armchairs, and the room's columns.
function hallInterior(m) {
  const y = PLAT,
    back = -10.6;
  put(m, [[-6.2, y + 0.005, HALL.facade - 0.05], [6.2, y + 0.005, HALL.facade - 0.05], [6.2, y + 0.005, back], [-6.2, y + 0.005, back]], 0x3a3530);
  put(m, [[-6.2, y, back], [6.2, y, back], [6.2, 3.3, back], [-6.2, 3.3, back]], interior, [0, 0, 1]);
  // The screen and its scroll.
  slab(m, -1.5, 1.5, y, y + 2.3, back + 0.05, back + 0.12, timberDark);
  put(m, [[-0.45, y + 0.75, back + 0.13], [0.45, y + 0.75, back + 0.13], [0.45, y + 2.05, back + 0.13], [-0.45, y + 2.05, back + 0.13]], 0xd8ceb0, [0, 0, 1]);
  put(m, [[-0.3, y + 1.1, back + 0.135], [0.25, y + 1.1, back + 0.135], [0.1, y + 1.7, back + 0.135]], 0x6a7a6a, [0, 0, 1]);
  for (const s of [-1, 1])
    put(m, [[s * 0.95, y + 0.6, back + 0.13], [s * 0.75, y + 0.6, back + 0.13], [s * 0.75, y + 2.0, back + 0.13], [s * 0.95, y + 2.0, back + 0.13]], 0xa8382a, [0, 0, 1]);
  // 條案 and the table and chairs before it.
  slab(m, -1.2, 1.2, y + 0.85, y + 0.92, back + 0.25, back + 0.65, timber);
  for (const sx of [-1.1, 1.1]) slab(m, sx - 0.04, sx + 0.04, y, y + 0.85, back + 0.3, back + 0.6, timberDark);
  m.lathe(0, y + 0.92, back + 0.45, [[0, 0.06], [0.1, 0.1], [0.25, 0.04], [0.3, 0.06]], 0x3d5a6a, 8);
  slab(m, -0.5, 0.5, y + 0.72, y + 0.78, back + 1.0, back + 1.9, timber);
  for (const sx of [-0.45, 0.45]) for (const sz of [1.05, 1.85]) slab(m, sx - 0.03, sx + 0.03, y, y + 0.72, back + sz - 0.03, back + sz + 0.03, timberDark);
  for (const s of [-1, 1]) {
    const x = s * 0.95,
      z = back + 1.45;
    slab(m, x - 0.25, x + 0.25, y + 0.42, y + 0.47, z - 0.25, z + 0.25, timber);
    slab(m, x + s * 0.22, x + s * 0.27, y + 0.47, y + 1.05, z - 0.25, z + 0.25, timberDark);
    for (const sx of [-0.22, 0.22]) for (const sz of [-0.22, 0.22]) slab(m, x + sx - 0.025, x + sx + 0.025, y, y + 0.42, z + sz - 0.025, z + sz + 0.025, timberDark);
  }
  for (const x of [-4.0, -1.55, 1.55, 4.0]) m.tube([x, y, -9.4], [x, 3.4, -9.4], 0.12, 0.11, timberDark, 8);
}

// 大堂: the hall.
function greatHall(m) {
  const { x: hx, front, back, cols, facade, eave, rise } = HALL;
  terrace(m, -hx - 0.15, hx + 0.15, back, front, PLAT);
  floorTiles(m, -hx - 0.15, hx + 0.15, facade, front, PLAT);
  // Steps up the middle, between sloping side stones.
  for (let k = 0; k < 3; k++) {
    const zf = front + 0.7 - (k * 0.7) / 3,
      y = ((k + 1) * PLAT) / 3;
    slab(m, -1.95, 1.95, 0, y, zf - 0.7 / 3 - 0.02, zf, k % 2 ? granite : m.mix(granite, graniteShade, 0.3));
    m.box(0, y - 0.01, zf - 0.005, 3.9, 0.02, 0.01, graniteShade);
  }
  for (const s of [-1, 1]) {
    const x = s * 2.05;
    put(m, [[x - 0.1, 0.12, front + 0.72], [x + 0.1, 0.12, front + 0.72], [x + 0.1, PLAT + 0.12, front], [x - 0.1, PLAT + 0.12, front]], granite);
    for (const sx of [-0.1, 0.1])
      put(m, [[x + sx, 0, front + 0.72], [x + sx, 0.12, front + 0.72], [x + sx, PLAT + 0.12, front], [x + sx, 0, front]], graniteShade, [sx, 0, 0]);
    put(m, [[x - 0.1, 0, front + 0.72], [x + 0.1, 0, front + 0.72], [x + 0.1, 0.12, front + 0.72], [x - 0.1, 0.12, front + 0.72]], graniteShade, [0, 0, 1]);
  }
  // Columns, beam and braces of the open front.
  const posts = [-hx + 0.25, -4.0, -1.55, 1.55, 4.0, hx - 0.25];
  for (const x of posts) {
    column(m, x, cols, PLAT, eave - 0.12, 0.13);
    if (Math.abs(x) < hx - 0.3) sparrowBraces(m, x, eave - 0.42, cols + 0.14);
  }
  slab(m, -hx, hx, eave - 0.42, eave - 0.12, cols - 0.1, cols + 0.1, timberDark);
  slab(m, -hx, hx, eave - 0.36, eave - 0.18, cols + 0.1, cols + 0.115, 0x3a5a5a);
  // Lanterns under the beam between the middle columns.
  for (const x of [-2.75, 2.75]) lantern(m, x, eave - 0.42, cols + 0.05, 1.05);
  // The facade: six doors in the middle bay (the two in the middle open), four in each of the
  // next, windows over a brick sill in the end bays; a frieze of boards above.
  const bay = (x0, x1, n, open, windows) => {
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const x = x0 + w * (i + 0.5);
      if (open && (i === n / 2 - 1 || i === n / 2)) {
        // The open leaf folded back against its neighbour.
        m.frame(x + (i < n / 2 ? -w * 0.42 : w * 0.42), PLAT, facade + 0.25, i < n / 2 ? 1.3 : -1.3, 1, () => latticePanel(m, w * 0.95, 1.95, { nx: 3, ny: 7, skirt: 0.5 }));
        continue;
      }
      if (windows) {
        slab(m, x - w / 2, x + w / 2, PLAT, PLAT + 0.75, facade - 0.12, facade + 0.08, brick);
        m.frame(x, PLAT + 0.75, facade + 0.02, 0, 1, () => latticePanel(m, w * 0.96, 1.2, { nx: 3, ny: 4, skirt: 0.06 }));
      } else m.frame(x, PLAT, facade, 0, 1, () => latticePanel(m, w * 0.96, 1.95, { nx: 3, ny: 7, skirt: 0.5 }));
    }
  };
  bay(-1.55, 1.55, 6, true, false);
  bay(1.55, 4.0, 4, false, false);
  bay(-4.0, -1.55, 4, false, false);
  bay(4.0, hx, 3, false, true);
  bay(-hx, -4.0, 3, false, true);
  slab(m, -hx, hx, PLAT + 1.95, PLAT + 2.05, facade - 0.06, facade + 0.06, timberDark);
  for (let i = 0; i < 16; i++) {
    const x0 = -hx + (2 * hx * i) / 16,
      x1 = x0 + (2 * hx) / 16 - 0.03;
    put(m, [[x0, PLAT + 2.05, facade + 0.03], [x1, PLAT + 2.05, facade + 0.03], [x1, eave + 0.45, facade + 0.03], [x0, eave + 0.45, facade + 0.03]], i % 2 ? timber : m.mix(timber, timberDark, 0.3), [0, 0, 1]);
  }
  // The plaque: a black board in a gilt frame with four pale characters.
  m.frame(0, eave + 0.08, facade + 0.12, 0, 1, () => {
    m.box(0, 0, 0, 1.9, 0.6, 0.06, gilt);
    m.box(0, 0, 0.02, 1.76, 0.48, 0.04, inkBoard);
    for (let i = 0; i < 4; i++) {
      const x = -0.6 + i * 0.4;
      m.box(x, 0.06, 0.045, 0.2, 0.05, 0.01, gilt);
      m.box(x, -0.03, 0.045, 0.05, 0.2, 0.01, gilt);
      m.box(x + 0.05, -0.1, 0.045, 0.16, 0.04, 0.01, gilt);
    }
  });
  hallInterior(m);
  // The gable walls (plaster under the roof) and the back wall.
  for (const s of [-1, 1])
    m.frame(s * (hx + 0.08), 0, (front + back) / 2 - 0.2, Math.PI / 2, 1, () => plasteredWall(m, -(front - back) / 2 + 0.1, (front - back) / 2 - 0.3, PLAT, eave + 0.2, 0.26, false));
  m.frame(0, 0, back + 0.2, 0, 1, () => plasteredWall(m, -hx, hx, PLAT, eave + 0.1, 0.26, false));
  // The roof, and the horse-head gables standing above it at each end.
  const zc = (front + 0.3 + back - 0.25) / 2,
    depth = back - 0.25 - (front + 0.3);
  m.frame(0, 0, zc, 0, 1, () => tiledRoof(m, 2 * hx + 0.1, Math.abs(depth), eave, rise, { hip: 0, gable: true, lift: 0.12, tones: roofTones, rafters: false, rows: 6 }));
  for (const s of [-1, 1])
    m.frame(s * (hx + 0.2), 0, zc, 0, 1, () => horseHeadWall(m, Math.abs(depth) + 0.3, 0, [eave + 0.42, eave + 1.05, eave + rise + 0.45], 0.3));
}

// 廂房: one wing, `s` -1 west, 1 east.
function wing(m, s) {
  const { plat, front, cols, wall, back, north, south, eave, rise } = WING;
  const x = (v) => s * v;
  const zc = (north + south) / 2,
    len = south - north;
  // Terrace.
  m.frame(0, 0, 0, 0, 1, () => {
    const x0 = Math.min(x(front), x(back + 0.1)),
      x1 = Math.max(x(front), x(back + 0.1));
    terrace(m, x0, x1, north, south, plat, s > 0 ? [1, 0, 0, 1] : [1, 1, 0, 0]);
    floorTiles(m, Math.min(x(front), x(wall)), Math.max(x(front), x(wall)), north, south, plat, 0.45);
  });
  // Steps down to the court in the middle bay.
  for (let k = 0; k < 2; k++) {
    const xf = front - 0.32 + k * 0.16;
    slab(m, x(xf), x(xf + 0.16), 0, (plat * (k + 1)) / 2, -2.6, -1.3, k ? granite : graniteShade);
  }
  // Veranda columns and their beam.
  const posts = [north + 0.25, -4.2, -1.95, 0.3, south - 0.25];
  for (const z of posts) column(m, x(cols), z, plat, eave - 0.1, 0.1);
  m.frame(x(cols), 0, zc, Math.PI / 2, 1, () => {
    slab(m, -len / 2, len / 2, eave - 0.36, eave - 0.1, -0.08, 0.08, timberDark);
    for (const z of posts.slice(1, -1)) sparrowBraces(m, -(z - zc), eave - 0.36, s * 0.0, 0.38);
  });
  // The front wall: windows over a brick sill in the end bays, doors in the middle two.
  const bays = [
    [north + 0.25, -4.2, 'window'],
    [-4.2, -1.95, 'door'],
    [-1.95, 0.3, 'door'],
    [0.3, south - 0.25, 'window']
  ];
  for (const [z0, z1, kind] of bays) {
    const n = kind === 'door' ? 4 : 3,
      w = (z1 - z0) / n;
    for (let i = 0; i < n; i++) {
      const z = z0 + w * (i + 0.5);
      // Panels face the court: yaw turns the panel's +z toward -s along x.
      m.frame(x(wall), plat, z, -s * Math.PI / 2, 1, () => {
        if (kind === 'door') latticePanel(m, w * 0.96, 1.7, { nx: 3, ny: 6, skirt: 0.45, dark: i === 1 && z0 < -3 });
        else {
          slab(m, -w / 2, w / 2, 0, 0.7, -0.1, 0.08, brick);
          m.frame(0, 0.7, 0.02, 0, 1, () => latticePanel(m, w * 0.96, 1.0, { nx: 3, ny: 4, skirt: 0.05 }));
        }
      });
    }
  }
  m.frame(x(wall), 0, zc, Math.PI / 2, 1, () => {
    slab(m, -len / 2, len / 2, plat + 1.7, eave + 0.3, -0.06, 0.06, timber);
    slab(m, -len / 2, len / 2, plat + 1.7, plat + 1.78, -0.08, 0.08, timberDark);
  });
  // The back wall is the house's outer wall, plastered both sides.
  m.frame(x(back), 0, zc, Math.PI / 2, 1, () => plasteredWall(m, -len / 2, len / 2, plat, eave + 0.15, 0.3, false));
  // Roof and gables. The south gable stands on the ravine's lip; its footing goes down to the rock.
  const rx = s * (front + back + 0.35) / 2,
    depth = back + 0.35 - (front - 0.2);
  m.frame(rx, 0, zc, Math.PI / 2, 1, () => tiledRoof(m, len + 0.35, depth, eave, rise, { hip: 0, gable: true, lift: 0.1, tones: roofTones, rafters: false, rows: 5 }));
  for (const [z, foot] of [
    [north - 0.12, plat],
    [south + 0.12, plat]
  ])
    m.frame(rx, 0, z, Math.PI / 2, 1, () => horseHeadWall(m, depth + 0.3, foot - plat, [eave + 0.35, eave + 0.72, eave + rise + 0.42], 0.28));
  // The masonry under the south gable, down the ravine's face to the rock.
  slab(m, Math.min(x(front - 0.05), x(back + 0.5)), Math.max(x(front - 0.05), x(back + 0.5)), -SHELF - 0.05, 0.02, south - 0.02, south + 0.32, graniteShade);
  for (let k = 1; k < 4; k++) m.box(rx, -k * 0.25, south + 0.33, depth + 0.3, 0.03, 0.01, graniteDark);
}

// The outer walls and what stands behind the hall: the rear court with its own little
// buildings, the two-storey rear building (後樓) and the kitchen roofs, the high back wall.
function rearCourt(m) {
  const outer = 10.85;
  // Walls joining the hall's back corners to the wings' backs, and the long side walls behind.
  for (const s of [-1, 1]) {
    m.frame(s * (HALL.x + outer) / 2, 0, HALL.back + 0.1, 0, 1, () => plasteredWall(m, -(outer - HALL.x) / 2, (outer - HALL.x) / 2, 0, 3.0, 0.3, true));
    m.frame(s * outer, 0, (WING.north + -19.5) / 2, Math.PI / 2, 1, () => plasteredWall(m, -(WING.north + 19.5) / 2, (WING.north + 19.5) / 2, 0, 3.2, 0.3, true));
  }
  m.frame(0, 0, -19.5, 0, 1, () => plasteredWall(m, -outer, outer, 0, 3.2, 0.3, true));
  // Paving of the rear court.
  floorTiles(m, -outer, outer, -19.4, HALL.back - 0.1, 0.0, 1.1, 0x7f8380);
  // 後樓: two storeys, a balcony with a railing along the upper floor, a roof over each.
  const z0 = -17.8,
    z1 = -14.2,
    w = 7.2;
  m.frame(0, 0, (z0 + z1) / 2, 0, 1, () => {
    const d = z1 - z0;
    slab(m, -w, w, 0, 0.3, -d / 2, d / 2, graniteShade);
    for (const s of [-1, 1]) m.frame(s * w, 0, 0, Math.PI / 2, 1, () => plasteredWall(m, -d / 2, d / 2, 0.3, 5.0, 0.28, false));
    m.frame(0, 0, -d / 2, 0, 1, () => plasteredWall(m, -w, w, 0.3, 5.0, 0.28, false));
    // Ground floor front: columns and lattice.
    for (let i = 0; i < 9; i++) {
      const x = -w + 0.4 + ((2 * w - 0.8) * i) / 8;
      column(m, x, d / 2 - 0.1, 0.3, 2.5, 0.09);
    }
    for (let i = 0; i < 12; i++) {
      const x = -w + 0.3 + ((2 * w - 0.6) * (i + 0.5)) / 12;
      m.frame(x, 0.3, d / 2 - 0.6, 0, 1, () => latticePanel(m, (2 * w - 0.6) / 12 * 0.95, 2.0, { nx: 3, ny: 6, skirt: 0.45 }));
    }
    // The lean-to roof over the ground floor, the balcony and the upper floor.
    m.frame(0, 0, d / 2 + 0.2, 0, 1, () => {
      const n = 40;
      for (let i = 0; i < n; i++) {
        const xa = -w - 0.2 + ((2 * w + 0.4) * i) / n,
          xb = xa + (2 * w + 0.4) / n;
        put(m, [[xa, 2.55, 0.35], [xb, 2.55, 0.35], [xb, 2.95, -0.75], [xa, 2.95, -0.75]], m.mix(tiles[1], tiles[0], (i % 2) * 0.35), [0, 1, 0.3]);
      }
      m.box(0, 2.53, 0.35, 2 * w + 0.4, 0.05, 0.05, tiles[2]);
    });
    slab(m, -w, w, 3.0, 3.1, d / 2 - 0.75, d / 2 - 0.55, timberDark);
    for (let i = 0; i <= 28; i++) m.box(-w + (2 * w * i) / 28, 3.4, d / 2 - 0.6, 0.04, 0.6, 0.04, timber);
    slab(m, -w, w, 3.68, 3.75, d / 2 - 0.65, d / 2 - 0.55, timber);
    for (let i = 0; i < 12; i++) {
      const x = -w + 0.3 + ((2 * w - 0.6) * (i + 0.5)) / 12;
      m.frame(x, 3.1, d / 2 - 1.0, 0, 1, () => latticePanel(m, (2 * w - 0.6) / 12 * 0.95, 1.6, { nx: 3, ny: 5, skirt: 0.3 }));
    }
    tiledRoof(m, 2 * w + 0.5, d + 0.6, 5.0, 1.35, { hip: 0, gable: true, lift: 0.1, tones: roofTones, rafters: false, rows: 5 });
    for (const s of [-1, 1]) m.frame(s * (w + 0.12), 0, 0, 0, 1, () => horseHeadWall(m, d + 0.9, 0.3, [5.3, 5.8, 6.75], 0.3));
  });
  // Kitchen and store roofs along the sides of the rear court.
  for (const s of [-1, 1]) {
    m.frame(s * 9.2, 0, -16.5, Math.PI / 2, 1, () => {
      slab(m, -2.6, 2.6, 0, 2.0, -1.4, 1.4, plaster);
      tiledRoof(m, 5.4, 3.2, 2.0, 0.8, { hip: 0, gable: true, lift: 0.06, tones: roofTones, rafters: false, rows: 4 });
      for (const e of [-1, 1]) m.frame(e * 2.65, 0, 0, 0, 1, () => horseHeadWall(m, 3.4, 0, [2.25, 2.95], 0.24));
    });
    // A chimney with a wisp of smoke from the east kitchen.
    if (s > 0) {
      slab(m, 9.6, 10.0, 2.0, 3.3, -15.6, -15.2, brick);
      m.line([[9.8, 3.35, -15.4], [9.9, 3.8, -15.5], [9.7, 4.3, -15.7], [9.95, 4.9, -15.8]], 0.05, 0xc9c8c0, 4);
    }
  }
  // A well with its stone curb in the rear court.
  m.lathe(-3.5, 0, -12.9, [[0, 0.42], [0.45, 0.42], [0.5, 0.36], [0.5, 0]], graniteShade, 12);
  m.lathe(-3.5, 0.48, -12.9, [[0, 0.33], [0.01, 0.33]], 0x2a3436, 12);
  // Its windlass frame.
  for (const s of [-1, 1]) m.box(-3.5 + s * 0.5, 0.9, -12.9, 0.06, 0.9, 0.06, timber);
  m.tube([-4.0, 1.25, -12.9], [-3.0, 1.25, -12.9], 0.06, 0.06, timberDark, 6);
  void circle;
  void plasterShade;
  void footing;
  void tileCap;
  void plasterBlock;
}

export { greatHall, wing, rearCourt, lantern, floorTiles, terrace, HALL, WING, PLAT };
