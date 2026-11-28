// The Yuan capital round 萬安寺 at night. Near at hand, the streets outside the temple wall:
// lanes of flagstones, houses and shops with lit windows and lanterns at their doors, a willow
// or two. Far off, dark against the stars, the roofs of the city, its great wall and gate towers,
// a drum tower, and banks of pale mist lying in the low ground.
import { circle } from '../scenery-kit.js';
import { tiledRoof } from './roof-13.js';
import { cypress, trailingWillow } from './garden-13.js';
import { put, mark, lattice, hangLamp, stoneLantern, plaster, timber, stoneDark, greyTile } from './kit-17.js';
import { STREET } from './temple-17.js';

const flagTone = 0x3d4352;
const flagLight = 0x4f5666;
const houseWall = 0x6f6a62;
const shutter = 0x3b2d25;

// A town house in its own frame, front to +z: a plastered body on a low stone sill, a door and
// windows (some lit), a grey roof, a shop sign or a lantern at the door, and a second storey
// for the bigger ones.
function house(m, x, z, yaw, w, d, h, o = {}) {
  const { upper = false, lit = 0.5, lamp = true, sign = false } = o;
  const r = m.rng;
  m.frame(x, STREET, z, yaw, 1, () => {
    m.box(0, 0.1, 0, w + 0.2, 0.2, d + 0.2, stoneDark);
    m.box(0, 0.2 + h / 2, 0, w, h, d, m.mix(houseWall, 0x55504a, r.next() * 0.5));
    for (const s of [-1, 1]) m.box(s * (w / 2 - 0.06), 0.2 + h / 2, d / 2 + 0.03, 0.12, h, 0.08, timber);
    m.box(0, 0.2 + h - 0.08, d / 2 + 0.03, w, 0.14, 0.08, timber);
    // The door, and a window either side of it.
    m.box(0, 0.2 + 0.6, d / 2 + 0.01, 0.6, 1.2, 0.03, shutter);
    const n = Math.max(1, Math.floor((w - 1) / 1.1));
    for (let i = 0; i < n; i++) {
      const wx = -w / 2 + 0.55 + ((i + 0.5) * (w - 1.1)) / n;
      if (Math.abs(wx) < 0.5) continue;
      const on = r.next() < lit;
      m.frame(wx, 0.2 + h * 0.55, d / 2 + 0.02, 0, 1, () => lattice(m, 0.6, h * 0.38, 3, 3, on, timber));
      if (on) mark(m, wx, 0.2 + h * 0.55, d / 2 + 0.5, 0.8);
    }
    let top = 0.2 + h;
    if (upper) {
      // An upper storey set back a little behind a short roof over the shopfront.
      tiledRoof(m, w + 0.5, 0.9, top - 0.05, 0.25, { hip: 0, gable: true, lift: 0.05, rows: 1, rafters: false, tones: greyTile, tile: 0.9, beasts: 0 });
      m.box(0, top + 0.6, -0.15, w - 0.3, 1.2, d - 0.4, m.mix(houseWall, plaster, 0.3));
      for (let i = 0; i < n; i++) {
        const wx = -w / 2 + 0.55 + ((i + 0.5) * (w - 1.1)) / n,
          on = r.next() < lit * 0.6;
        m.frame(wx, top + 0.62, d / 2 - 0.34, 0, 1, () => lattice(m, 0.55, 0.5, 3, 2, on, timber));
      }
      top += 1.2;
    }
    tiledRoof(m, w + 0.6, (upper ? d - 0.4 : d) + 0.7, top + 0.02, Math.min(1.1, d * 0.32), {
      hip: 0,
      gable: true,
      lift: 0.08,
      rows: 2,
      rafters: false,
      tones: greyTile,
      tile: 0.75,
      beasts: 0
    });
    if (sign) {
      m.box(w / 2 - 0.25, 0.2 + h * 0.55, d / 2 + 0.25, 0.05, 1.0, 0.24, 0x2a2622);
      m.box(w / 2 - 0.25, 0.2 + h * 0.55, d / 2 + 0.25, 0.06, 0.85, 0.18, 0x8c6a3a);
    }
    if (lamp) hangLamp(m, -0.6, 0.2 + h - 0.35, d / 2 + 0.3, 0.75, r.next() < 0.5 ? 0xe0663c : 0xe8b060, 0.1);
  });
}

// Flagstones of a street from (x0, z0) to (x1, z1), in rows of irregular slabs.
function street(m, x0, x1, z0, z1, along) {
  const r = m.rng,
    y = STREET + 0.012;
  put(m, [[x0, y - 0.006, z0], [x0, y - 0.006, z1], [x1, y - 0.006, z1], [x1, y - 0.006, z0]], 0x242833);
  const long = along === 'x',
    a0 = long ? x0 : z0,
    a1 = long ? x1 : z1,
    b0 = long ? z0 : x0,
    b1 = long ? z1 : x1,
    rows = Math.max(1, Math.round((b1 - b0) / 0.7));
  for (let j = 0; j < rows; j++) {
    let a = a0 + r.range(0, 0.4);
    const c = b0 + ((b1 - b0) * j) / rows + 0.025,
      e = b0 + ((b1 - b0) * (j + 1)) / rows - 0.025;
    while (a < a1 - 0.2) {
      const len = r.range(0.6, 1.2),
        b = Math.min(a1, a + len) - 0.03,
        col = m.mix(flagTone, flagLight, r.next() * 0.7);
      if (long) put(m, [[a, y, c], [a, y, e], [b, y, e], [b, y, c]], col);
      else put(m, [[c, y, a], [c, y, b], [e, y, b], [e, y, a]], col);
      a += len;
    }
  }
}

// The streets outside the temple wall.
function nearCity(m) {
  street(m, -24, 26, 14.8, 17.6, 'x');
  street(m, 13.1, 15.9, -26, 14.8, 'z');
  street(m, -15.9, -13.1, -26, 14.8, 'z');
  // South of the gate, facing it across the street.
  const south = [
    [-11.6, 5.2, 3.2, 1.8, false],
    [-5.6, 5.4, 3.0, 1.7, false],
    [0.4, 5.4, 3.4, 1.9, true],
    [6.4, 5.2, 3.0, 1.7, false],
    [12.2, 5.0, 3.2, 1.8, false],
    [18.0, 5.2, 3.0, 1.7, false]
  ];
  for (const [x, w, d, h, upper] of south)
    house(m, x, 17.8 + d / 2 + 0.3, Math.PI, w, d, h, { upper, sign: upper, lit: 0.6 });
  // East of the temple, facing its wall.
  for (let i = 0; i < 5; i++) {
    const z = -15.4 + i * 6.0,
      upper = i === 2;
    house(m, 17.8, z, -Math.PI / 2, 5.2, 3.2, 1.75, { upper, sign: upper, lit: 0.55 });
  }
  // West of the temple, the backs of houses across a lane.
  for (let i = 0; i < 2; i++) house(m, -17.8, -6.0 + i * 8.0, Math.PI / 2, 5.4, 3.2, 1.7, { lit: 0.35, lamp: i % 2 === 0 });
  // Street lanterns on posts, and trees along the lanes.
  for (const [x, z] of [
    [-6.2, 14.4],
    [6.2, 14.4],
    [12.9, 17.2],
    [13.5, 4.0],
    [13.5, -10.0],
    [-13.5, -4.0]
  ])
    stoneLantern(m, x, STREET, z, 1.05);
  trailingWillow(m, 20.6, 15.6, 0.95, 2.6, 12);
  for (const [x, z, s] of [
    [-14.6, -20.6, 1.1],
    [14.6, 8.5, 0.9],
    [-14.4, 7.2, 1.0],
    [7.8, 15.2, 0.75],
    [-9.2, 15.4, 0.8]
  ])
    cypress(m, x, z, s, STREET);
  // A cart left by a door, and jars stacked against a wall.
  m.frame(9.2, STREET, 15.6, 0.3, 1, () => {
    m.box(0, 0.45, 0, 1.3, 0.08, 0.8, timber);
    for (const s of [-1, 1]) m.box(0, 0.6, s * 0.4, 1.3, 0.25, 0.04, timber);
    for (const s of [-1, 1]) m.hoop(0, 0.38, s * 0.47, 0.36, 0.03, 0x2c241e, 12, 'xy');
    m.line([[0.65, 0.48, 0.3], [1.6, 0.2, 0.32]], 0.03, timber, 4);
    m.line([[0.65, 0.48, -0.3], [1.6, 0.2, -0.32]], 0.03, timber, 4);
  });
  for (const [x, z] of [
    [-5.4, 15.2],
    [-5.0, 15.3],
    [-5.2, 15.65]
  ])
    m.lathe(x, STREET, z, [[0, 0.12], [0.1, 0.2], [0.32, 0.2], [0.42, 0.12], [0.46, 0.13]], 0x4a3a2e, 8);
}

// A far roof: a dark block under a plain hipped roof with lifted corners.
function farHall(m, x, z, yaw, w, d, h, rise, base = STREET) {
  const body = 0x161c30,
    tile = 0x1f2840,
    edge = 0x313d5a;
  m.frame(x, base, z, yaw, 1, () => {
    m.box(0, h / 2, 0, w, h, d, body);
    const ow = w / 2 + 0.7,
      od = d / 2 + 0.7,
      rw = Math.max(0, w / 2 - d / 2),
      e = h,
      lift = 0.4;
    const c = [
      [-ow, e + lift, od],
      [ow, e + lift, od],
      [ow, e + lift, -od],
      [-ow, e + lift, -od]
    ];
    const l = [-rw, e + rise, 0],
      r = [rw, e + rise, 0],
      mid = [
        [0, e, od],
        [ow, e, 0],
        [0, e, -od],
        [-ow, e, 0]
      ];
    put(m, [c[0], mid[0], l], tile);
    put(m, [mid[0], r, l], edge);
    put(m, [mid[0], c[1], r], tile);
    put(m, [c[1], mid[1], r], edge);
    put(m, [mid[1], c[2], r], tile);
    put(m, [c[2], mid[2], r], tile);
    put(m, [mid[2], l, r], edge);
    put(m, [mid[2], c[3], l], tile);
    put(m, [c[3], mid[3], l], edge);
    put(m, [mid[3], c[0], l], tile);
    m.box(0, e + rise + 0.1, 0, rw * 2 + 0.4, 0.25, 0.25, edge);
  });
}

// The city far off: roofs in their thousands, the wall of 大都, its gate towers, the drum
// tower, a few windows still lit, and mist in the low ground.
function farCity(m) {
  const r = m.rng;
  // Rings of roofs, thinning with distance.
  for (let i = 0; i < 70; i++) {
    const a = r.range(0, circle),
      rad = r.range(25, 47),
      x = Math.cos(a) * rad,
      z = Math.sin(a) * rad,
      yaw = Math.round(r.range(0, 1)) * (Math.PI / 2) + r.range(-0.04, 0.04),
      w = r.range(4, 8),
      d = r.range(2.6, 4),
      h = r.range(1.4, 2.6);
    if (Math.max(Math.abs(x), Math.abs(z)) < 26.5) continue;
    farHall(m, x, z, yaw, w, d, h, r.range(1.0, 1.6));
  }
  // The city wall, a square about the temple's quarter, with towers on its gates and corners.
  const reach = 52;
  for (const [ax, az, bx, bz] of [
    [-reach, -reach, reach, -reach],
    [-reach, -reach, -reach, reach],
    [reach, -reach, reach, reach],
    [-reach, reach, reach, reach]
  ]) {
    const len = Math.hypot(bx - ax, bz - az),
      yaw = Math.atan2(-(bz - az), bx - ax);
    m.frame((ax + bx) / 2, STREET, (az + bz) / 2, yaw, 1, () => {
      m.box(0, 2.6, 0, len, 5.2, 2.6, 0x151b2e);
      m.box(0, 5.35, 0, len, 0.3, 2.9, 0x273250);
      for (let i = -14; i <= 14; i++) m.box((i * len) / 29, 5.75, 1.3, 1.6, 0.6, 0.3, 0x273250);
    });
  }
  for (const [x, z, yaw] of [
    [0, -reach, 0],
    [-reach, 0, Math.PI / 2],
    [reach, 0, Math.PI / 2],
    [0, reach, 0],
    [-26, -reach, 0],
    [26, -reach, 0],
    [-reach, -26, Math.PI / 2],
    [reach, -26, Math.PI / 2]
  ]) {
    farHall(m, x, z, yaw, 10, 5, 3, 2.2, STREET + 5.2);
    farHall(m, x, z, yaw, 7.5, 3.6, 2.4, 2.2, STREET + 8.4);
  }
  // The drum tower of the capital, on a tall terrace to the north-east.
  m.frame(24, STREET, -34, 0.1, 1, () => {
    m.box(0, 3.4, 0, 11, 6.8, 7, 0x151b2e);
    m.box(0, 6.95, 0, 11.4, 0.3, 7.4, 0x273250);
    m.glow(() => m.box(0, 2.4, 3.52, 1.6, 2.4, 0.06, 0x9a6a3a));
  });
  farHall(m, 24, -34, 0.1, 8, 4.6, 2.8, 2.2, STREET + 7.1);
  farHall(m, 24, -34, 0.1, 6, 3.4, 2.0, 2.0, STREET + 10.8);
  // A white stupa over the roofs to the west.
  m.frame(-34, STREET, -14, 0, 1, () => {
    m.box(0, 1.2, 0, 7, 2.4, 7, 0x2a3046);
    m.lathe(0, 2.4, 0, [[0, 2.6], [0.6, 2.6], [0.8, 2.2], [1.6, 2.4], [3.2, 2.5], [4.2, 2.1], [4.8, 1.2], [5.0, 0.9]], 0x8f96a8, 12);
    m.lathe(0, 7.4, 0, [[0, 0.8], [3.0, 0.45], [3.3, 1.2], [3.5, 1.1], [3.8, 0.3], [4.4, 0]], 0x6f6a5a, 10);
  });
  // A few windows still lit.
  m.glow(() => {
    for (let i = 0; i < 40; i++) {
      const a = r.range(0, circle),
        rad = r.range(23, 44);
      m.box(Math.cos(a) * rad, STREET + r.range(0.8, 1.8), Math.sin(a) * rad, 0.5, 0.45, 0.5, 0xe0a858);
    }
  });
  // Mist lying in long low banks between the roofs.
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * circle + r.range(-0.1, 0.1),
      rad = r.range(26, 44),
      x = Math.cos(a) * rad,
      z = Math.sin(a) * rad,
      len = r.range(5, 9),
      wide = r.range(1.5, 2.6),
      tone = m.mix(0x5a6684, 0x7d8aa8, r.next());
    m.frame(x, STREET + 0.3, z, -a + Math.PI / 2 + r.range(-0.3, 0.3), 1, () => {
      const n = 10,
        low = [],
        mid = [];
      for (let k = 0; k < n; k++) {
        const t = (k * circle) / n,
          j = r.range(0.85, 1.15);
        low.push([Math.cos(t) * len * j, 0, Math.sin(t) * wide * j]);
        mid.push([Math.cos(t) * len * 0.6 * j, r.range(0.4, 0.7), Math.sin(t) * wide * 0.55 * j]);
      }
      for (let k = 0; k < n; k++) {
        const q = (k + 1) % n;
        m.face([low[k], mid[k], mid[q], low[q]], [m.rgb(0x2a3450), tone, tone, m.rgb(0x2a3450)]);
      }
      m.face([...mid].reverse(), tone);
    });
  }
  // Dark trees over the far roofs.
  for (let i = 0; i < 16; i++) {
    const a = r.range(0, circle),
      rad = r.range(21, 30);
    cypress(m, Math.cos(a) * rad, Math.sin(a) * rad, r.range(1.3, 1.8), STREET);
  }
}

export { nearCity, farCity };
