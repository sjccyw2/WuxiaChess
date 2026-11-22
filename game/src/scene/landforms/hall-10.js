// The fine work of 神龍竹堂's hall: cane walls, the thatch's ragged eaves and rafters, the porch
// floor, door leaves, the plaque over the door, a drum, a weapon rack, censers and lanterns.
// 都畫在大竹堂自己的框裡（landform-10.js 的 HALL 尺寸），由 bambooHall 呼叫。
import { circle, midway } from '../scenery-kit.js';
import { lantern } from '../maze-models.js';
import { AGED, HALL, SCALE } from './landform-10.js';

const DARK = 0x3a2c1f; // the shadowed inside of the hall
const LACQUER = 0x6e2a22;
const GILT = 0xd2ab55;

// A wall of whole culms stood side by side in front of its matting, each with its nodes, two
// tie canes lashed across them. `out` pushes the culms off the matting toward the outside;
// gaps leave a window, its sill and lintel caned across.
function caneWall(m, a, b, low, high, gap, out, gaps = []) {
  const r = m.rng,
    dx = b[0] - a[0],
    dz = b[1] - a[1],
    span = Math.hypot(dx, dz),
    n = Math.max(2, Math.round(span / gap)),
    nx = (-dz / span) * out,
    nz = (dx / span) * out,
    rad = (span / n) * 0.47;
  const at = (t, y, push = 1) => [a[0] + dx * t + nx * push, y, a[1] + dz * t + nz * push];
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n,
      opening = gaps.find(([t0, t1]) => t > t0 && t < t1),
      tone = m.mix(r.pick(AGED), 0x8f7b4e, r.range(0, 0.35));
    // Nodes fall where each cane grew them, not in a level row.
    const pitch = r.range(0.36, 0.48),
      runs = opening
        ? [
            [low, opening[2]],
            [opening[3], high]
          ]
        : [[low, high]];
    for (const [y0, y1] of runs) {
      let y = y0;
      for (let j = 0; y < y1 - 0.01; j++) {
        const next = Math.min(y1, y0 + (j + 1) * pitch - (j ? 0 : r.range(0, 0.2)));
        m.tube(at(t, y), at(t, next), rad, rad, j % 2 ? m.mix(tone, 0xe0cf90, 0.12) : tone, 5);
        if (next < y1 - 0.02) m.tube(at(t, next - 0.012), at(t, next + 0.014), rad * 1.16, rad * 1.16, 0x8a7444, 5);
        y = next;
      }
    }
  }
  // Tie canes and their rattan.
  for (const y of [low + 0.32, high - 0.28])
    m.tube(at(0, y, 2.2), at(1, y, 2.2), 0.028, 0.028, AGED[3], 4);
  for (const [t0, t1, y0, y1] of gaps) {
    // The window's dark inside, its frame and a lattice of thin split cane.
    const p = (t, y) => at(t, y, 0.2);
    m.face([p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)], DARK);
    for (const y of [y0, y1]) m.tube(at(t0 - 0.02, y, 1.4), at(t1 + 0.02, y, 1.4), 0.035, 0.035, AGED[3], 4);
    const bars = Math.round(((t1 - t0) * span) / 0.13);
    for (let k = 1; k < bars; k++) {
      const t = t0 + ((t1 - t0) * k) / bars;
      m.tube(at(t, y0, 0.6), at(t, y1, 0.6), 0.012, 0.012, AGED[1], 4);
    }
    for (const f of [0.33, 0.66]) {
      const y = y0 + (y1 - y0) * f;
      m.tube(at(t0, y, 0.7), at(t1, y, 0.7), 0.012, 0.012, AGED[1], 4);
    }
  }
}

// Straw hanging ragged from the cut edge of a thatch tier, between corners p and q, `out` the
// direction away from the roof.
function fringe(m, p, q, out, spacing, tone) {
  const r = m.rng,
    n = Math.max(2, Math.round(Math.hypot(q[0] - p[0], q[2] - p[2]) / spacing));
  for (let k = 0; k < n; k++) {
    const s = midway(p, q, (k + r.next()) / n),
      l = r.range(0.1, 0.24),
      reach = r.range(0.03, 0.09);
    m.leaf(
      [s[0] - out[0] * 0.05, s[1] + 0.03, s[2] - out[1] * 0.05],
      [s[0] + out[0] * reach + r.range(-0.03, 0.03), s[1] - l, s[2] + out[1] * reach + r.range(-0.03, 0.03)],
      r.range(0.03, 0.05),
      m.mix(tone, 0x6e5c3c, r.range(0, 0.45)),
      m.mix(tone, 0xd8c890, r.range(0, 0.3)),
      0.01
    );
  }
}
// Courses of straw bundles across a sloping face from low edge (a, b) to crest (c, d): each a
// short wedge whose butt stands proud, so the face reads as laid straw, not a board.
function courses(m, a, b, c, d, rows, width, shade) {
  const r = m.rng;
  for (let j = 0; j < rows; j++) {
    const t = (j + 0.6) / (rows + 0.4),
      lo = [midway(a, d, t), midway(b, c, t)],
      hi = [midway(a, d, t + 0.55 / rows), midway(b, c, t + 0.55 / rows)],
      n = Math.max(2, Math.round(Math.hypot(lo[1][0] - lo[0][0], lo[1][2] - lo[0][2]) / width));
    for (let k = 0; k < n; k++) {
      const u0 = (k + r.range(-0.08, 0.08)) / n,
        u1 = (k + 1 + r.range(-0.08, 0.08)) / n,
        lift = r.range(0.035, 0.06),
        p0 = midway(lo[0], lo[1], u0),
        p1 = midway(lo[0], lo[1], u1),
        q0 = midway(hi[0], hi[1], u0),
        q1 = midway(hi[0], hi[1], u1);
      const up = (p) => [p[0], p[1] + lift, p[2]],
        straw = m.mix(0xc8b679, 0x9d8b58, r.range(0, 0.6));
      m.face([up(p0), up(p1), q1, q0], straw, shade * r.range(0.95, 1.06));
      m.face([p0, p1, up(p1), up(p0)], 0x766540, shade);
    }
  }
}

// Rafters and a purlin showing under the eave, between the plate (y at `plate`) and the eave
// line, round all four sides.
function rafters(m, under, eaveDrop) {
  const { plate, porch, back, half } = HALL;
  const inner = [
    [-half, plate + 0.04, porch],
    [half, plate + 0.04, porch],
    [half, plate + 0.04, back],
    [-half, plate + 0.04, back]
  ];
  for (let e = 0; e < 4; e++) {
    const f = (e + 1) % 4,
      n = Math.round(Math.hypot(under[f][0] - under[e][0], under[f][2] - under[e][2]) / 0.36);
    for (let k = 1; k < n; k++) {
      const t = k / n,
        lo = midway(under[e], under[f], t),
        hi = midway(inner[e], inner[f], t);
      m.tube(hi, [lo[0], lo[1] - eaveDrop, lo[2]], 0.03, 0.026, AGED[k % 3], 4);
    }
    const mid = (t) => {
      const p = midway(midway(under[e], inner[e], 0.5), midway(under[f], inner[f], 0.5), t);
      return [p[0], p[1] - eaveDrop - 0.05, p[2]];
    };
    m.tube(mid(0), mid(1), 0.04, 0.04, AGED[3], 5);
  }
}

// One leaf of a lattice door, hinged at its own origin and drawn toward +x.
function doorLeaf(m, w, h) {
  for (const [x0, y0, x1, y1] of [
    [0, 0, 0, h],
    [w, 0, w, h],
    [0, h, w, h],
    [0, 0.04, w, 0.04],
    [0, h * 0.36, w, h * 0.36]
  ])
    m.tube([x0, y0, 0], [x1, y1, 0], 0.034, 0.034, LACQUER, 4);
  m.face(
    [
      [0, 0.04, 0],
      [w, 0.04, 0],
      [w, h * 0.36, 0],
      [0, h * 0.36, 0]
    ],
    0x5a2620
  );
  for (let k = 1; k < 5; k++) m.tube([(w * k) / 5, h * 0.36, 0], [(w * k) / 5, h, 0], 0.011, 0.011, 0x8a4a32, 4);
  for (let k = 1; k < 7; k++) {
    const y = h * 0.36 + ((h * 0.64) * k) / 7;
    m.tube([0, y, 0], [w, y, 0], 0.011, 0.011, 0x8a4a32, 4);
  }
  m.hoop(w - 0.1, h * 0.5, 0.03, 0.035, 0.007, GILT, 8, 'xy');
}

// The great drum of the 神龍教 on its cane stand, lying across the porch.
function drum(m, x, y, z, yaw) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const side of [-1, 1]) {
      m.tube([side * 0.36, 0, -0.2], [side * 0.36, 0.62, 0], 0.03, 0.026, AGED[3], 4);
      m.tube([side * 0.36, 0, 0.2], [side * 0.36, 0.62, 0], 0.03, 0.026, AGED[3], 4);
    }
    m.frame(0, 0.68, 0, 0, 1, () => {
      m.lathe(
        0,
        -0.3,
        0,
        [
          [0, 0.3],
          [0.08, 0.34],
          [0.3, 0.37],
          [0.52, 0.34],
          [0.6, 0.3]
        ],
        0x9a3a2a,
        14
      );
      for (const h of [-0.3, 0.3]) m.hoop(0, h, 0, 0.305, 0.012, GILT, 14);
      for (const h of [-0.305, 0.305])
        m.face(
          Array.from({ length: 14 }, (_, j) => [Math.cos((j * circle) / 14) * 0.29, h, Math.sin((j * circle) / 14) * 0.29]),
          0xd8c49a
        );
    }, 0, Math.PI / 2);
    m.tube([0.5, 0.05, 0.3], [0.32, 0.8, 0.12], 0.016, 0.022, 0x6b4a2e, 4);
  });
}
// Spears and a 大刀 on a cane rack.
function weaponRack(m, x, y, z, yaw) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const u of [-0.55, 0.55]) m.tube([u, 0, 0], [u, 1.25, 0], 0.03, 0.026, AGED[1], 4);
    for (const h of [0.35, 1.15]) m.tube([-0.62, h, 0], [0.62, h, 0], 0.024, 0.024, AGED[0], 4);
    for (let k = 0; k < 5; k++) {
      const u = -0.4 + k * 0.2,
        top = 1.75 + 0.08 * (k % 2);
      m.tube([u, 0.02, 0.06], [u + 0.02, top, -0.05], 0.014, 0.012, 0x5a3e28, 4);
      if (k === 2) m.leaf([u + 0.02, top, -0.05], [u + 0.04, top + 0.34, -0.07], 0.05, 0xc9ccc6, 0x9da3a0, 0.01);
      else {
        m.crystal(u + 0.02, top, -0.05, 0.025, 0.18, 0x9da3a0, 0xe0e4e0, 4);
        m.tube([u + 0.02, top - 0.03, -0.05], [u + 0.02, top - 0.12, -0.05], 0.03, 0.015, 0xb5493a, 4);
      }
    }
  });
}
// A bronze tripod censer, three thin sticks of incense standing in its ash.
function censer(m, x, y, z, s) {
  m.frame(x, y, z, 0.3, s, () => {
    for (let k = 0; k < 3; k++) {
      const a = (k * circle) / 3;
      m.tube([Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13], [Math.cos(a) * 0.1, 0.14, Math.sin(a) * 0.1], 0.025, 0.02, 0x4f5a4c, 4);
    }
    m.lathe(
      0,
      0.12,
      0,
      [
        [0, 0.1],
        [0.05, 0.17],
        [0.14, 0.19],
        [0.2, 0.17],
        [0.21, 0.18],
        [0.2, 0.15]
      ],
      0x5d6a58,
      10
    );
    for (const side of [-1, 1])
      m.tube([side * 0.15, 0.3, 0], [side * 0.15, 0.4, 0], 0.025, 0.025, 0x5d6a58, 4);
    for (let k = 0; k < 3; k++) m.tube([-0.04 + k * 0.04, 0.3, 0.01 * k], [-0.04 + k * 0.045, 0.52, 0.01 * k], 0.005, 0.004, 0xb5493a, 3);
  });
}
// A tall candle stand inside the hall; its flame glows.
function candle(m, x, y, z) {
  m.tube([x, y, z], [x, y + 0.95, z], 0.025, 0.02, 0x4a3524, 5);
  m.lathe(x, y, z, [[0, 0.12], [0.04, 0.06], [0.05, 0]], 0x4a3524, 6);
  m.lathe(x, y + 0.95, z, [[0, 0.07], [0.03, 0.08], [0.035, 0]], 0x4a3524, 6);
  m.tube([x, y + 0.98, z], [x, y + 1.18, z], 0.03, 0.028, 0xc23b2e, 6);
  m.glow(() => m.crystal(x, y + 1.18, z, 0.025, 0.09, 0xf0b040, 0xfff0b0, 4));
}

// Everything the hall gains over its bare frame, in the hall's own frame. `eave` is the height
// of the roof's lowest cut edge, `under` the four corners of its soffit.
function hallDetail(m, eave, under) {
  const { floor, plate, porch, wall, back, half } = HALL;
  const bays = Array.from({ length: 8 }, (_, k) => -half + (k * half * 2) / 7);
  const third = (bays[2] - bays[1]) / (bays[2] - bays[0]);
  // Culm walls: the front with a latticed window either side of the door, the gable ends and
  // the back plainer.
  caneWall(m, [bays[0], wall], [bays[2], wall], floor, plate, 0.1, 0.07, [[third + 0.06, 0.94, 1.2, 1.95]]);
  caneWall(m, [bays[5], wall], [bays[7], wall], floor, plate, 0.1, 0.07, [[0.06, 1 - third - 0.06, 1.2, 1.95]]);
  caneWall(m, [bays[2], wall], [bays[5], wall], 2.3, plate, 0.1, 0.07);
  caneWall(m, [half, wall], [half, back], floor, plate, 0.11, 0.07, [[0.3, 0.7, 1.25, 1.9]]);
  caneWall(m, [-half, back], [-half, wall], floor, plate, 0.11, 0.07, [[0.3, 0.7, 1.25, 1.9]]);
  caneWall(m, [half, back], [-half, back], floor, plate, 0.19, 0.07);
  // The porch floor: split canes laid edge to edge across the deck, worn pale down the middle.
  for (let k = 0; k < 18; k++) {
    const z = -1.42 - k * 0.083;
    m.tube([-5.3, floor + 0.01, z], [-0.5, floor + 0.01, z], 0.038, 0.038, AGED[k % 4], 4);
    m.tube([0.5, floor + 0.01, z], [5.3, floor + 0.01, z], 0.038, 0.038, AGED[(k + 2) % 4], 4);
    m.tube([-0.5, floor + 0.01, z], [0.5, floor + 0.01, z], 0.038, 0.038, m.mix(AGED[2], 0xe8dcae, 0.4), 4);
  }
  // The open door: two lattice leaves swung back against the wall, a plaque over the lintel,
  // the hall's dark inside behind.
  m.tube([bays[2], 2.3, wall + 0.05], [bays[5], 2.3, wall + 0.05], 0.06, 0.06, LACQUER, 5);
  for (const side of [-1, 1]) {
    m.tube([side * bays[5], floor, wall + 0.05], [side * bays[5], 2.3, wall + 0.05], 0.06, 0.06, LACQUER, 5);
    m.frame(side * bays[5], floor, wall + 0.14, side > 0 ? -0.3 : 0.3 - Math.PI, 1, () => doorLeaf(m, 0.92, 1.76));
  }
  m.box(0, 2.56, wall + 0.12, 1.5, 0.42, 0.05, 0x2c2d33);
  m.line(
    [
      [-0.78, 2.35, wall + 0.15],
      [0.78, 2.35, wall + 0.15],
      [0.78, 2.77, wall + 0.15],
      [-0.78, 2.77, wall + 0.15],
      [-0.78, 2.35, wall + 0.15]
    ],
    0.02,
    GILT,
    4
  );
  for (const x of [-0.45, 0, 0.45]) {
    m.box(x, 2.56, wall + 0.155, 0.24, 0.05, 0.01, GILT);
    m.box(x, 2.56, wall + 0.155, 0.05, 0.26, 0.01, GILT);
  }
  // Inside: a tiger skin before the master's seat, candles and a censer either side, the seat's
  // arms carved as rearing snakes.
  m.face(
    Array.from({ length: 10 }, (_, j) => {
      const a = (-j * circle) / 10,
        rad = j % 5 === 0 ? 0.55 : j % 5 === 2 || j % 5 === 3 ? 0.42 : 0.36;
      return [Math.cos(a) * rad, floor + 0.006, -4.65 + Math.sin(a) * rad * 0.6];
    }),
    0xc98a3a
  );
  for (let k = 0; k < 5; k++)
    m.box(-0.3 + k * 0.15, floor + 0.009, -4.65, 0.035, 0.004, 0.45, 0x2c2420);
  for (const side of [-1, 1]) {
    candle(m, side * 1.05, floor + 0.16, -5.15);
    let last = [side * 0.38, floor + 0.42, -5.35];
    for (let k = 1; k <= 5; k++) {
      const p = [side * (0.38 + 0.03 * Math.sin(k)), floor + 0.42 + k * 0.08, -5.35 - 0.05 * k + (k > 3 ? 0.12 : 0)];
      m.tube(last, p, 0.04, 0.04, SCALE[1], 5);
      last = p;
    }
    m.tube(last, [last[0], last[1] + 0.02, last[2] + 0.14], 0.055, 0.02, SCALE[0], 5);
    // Censers flank the stair head on the terrace.
    censer(m, side * 1.55, floor, -1.68, 0.9);
  }
  censer(m, 0, floor + 0.16, -4.95, 0.75);
  // The drum at the east end of the porch, the weapon rack at the west.
  drum(m, 3.75, floor, -2.45, 0.25);
  weaponRack(m, -3.75, floor, -2.72, 0);
  // Rafters, purlins and lamps under the eaves.
  rafters(m, under, 0.06);
  for (const x of [-4.1, 4.1, -0.95, 0.95]) lantern(m, x, eave - 0.45, porch + 0.45, 0.62, x * x < 2 ? 0xd8a743 : 0xd86743);
  // Treads worn darker where feet fall, either side of the serpent ramp.
  for (const side of [-1, 1])
    for (let k = 0; k < 4; k++) {
      const front = -0.02 - k * 0.3375,
        y = (k + 1) * 0.125 + 0.003,
        x = side * 1.25;
      m.face(
        Array.from({ length: 8 }, (_, j) => {
          const a = (-j * circle) / 8;
          return [x + Math.cos(a) * 0.42, y, front - 0.17 + Math.sin(a) * 0.1];
        }),
        m.mix(AGED[k % 2], 0x7a6640, 0.35)
      );
    }
  // The verandah rail returns along both ends of the porch.
  for (const side of [-1, 1]) {
    for (const y of [0.74, 0.94]) m.tube([side * 5.3, y, -1.44], [side * 5.3, y, wall + 0.1], 0.028, 0.028, AGED[0], 4);
    for (const z of [-2.1, -2.75]) m.tube([side * 5.3, floor, z], [side * 5.3, 1.0, z], 0.035, 0.03, AGED[1], 4);
  }
}

export { hallDetail, fringe, courses };
