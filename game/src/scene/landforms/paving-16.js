// 石樑溫家's own paving for the board. The court is laid in grey brick in a basket weave (席紋),
// each tile framed by a border of bricks on edge; a walk of long granite slabs runs up the axis
// from the bridge to the hall, the row before the hall is a granite apron, and the five points of
// the 五行陣 round the screen wall are single great flagstones, each inlaid with its element's
// sign in its colour: 土 a square in ochre (north), 金 a disc in white (north-east), 水 waves in
// blue-black (south-east), 木 a standing bar in green (south-west), 火 a flame in red (north-west).
// A ring of inlaid stone runs round the screen wall through all five, shading from each colour to
// the next in the order they give birth to one another (相生). The brick is greener with moss and
// darker with damp toward the walls and in the corners; paler where feet have worn it.
import { circle } from '../scenery-kit.js';
import { noise } from './kit-12.js';
import { CX, CZ, walk, TOP, put, granite, graniteShade, graniteDark } from './kit-16.js';

const BED = 0.022;
const brickTone = 0x7d8382;
const brickPale = 0x9a9f9b;
const brickWarm = 0x8a8478;
const bedTone = 0x4b504b;
const moss = 0x66784c;
const slabTone = 0xa29f93;
const slabPale = 0xb9b6aa;

// The five points: tile, element, colour, and the sign's shape.
const ELEMENTS = [
  { at: [6, 2], name: '土', col: 0xb38a45, sign: 'square' },
  { at: [9, 4], name: '金', col: 0xe8e3d4, sign: 'disc' },
  { at: [8, 7], name: '水', col: 0x2b3442, sign: 'waves' },
  { at: [4, 7], name: '木', col: 0x4d7a43, sign: 'bar' },
  { at: [3, 4], name: '火', col: 0xb0412c, sign: 'flame' }
];
const elementAt = new Map(ELEMENTS.map((e) => [e.at.join(','), e]));
// The ring through the five, centred on the screen wall.
const RING = { x: 0, z: -0.65, r: 3.02, w: 0.075 };
const ringAngle = (e) => Math.atan2(e.at[1] - CZ - RING.z, e.at[0] - CX - RING.x);

// Moss, damp and wear across the court (world x, z): a colour multiplier and a moss amount.
function weather(x, z) {
  const edge = Math.max(Math.abs(x) - 4.6, 0) * 0.35 + Math.max(-z - 4.4, 0) * 0.3,
    damp = noise(x * 0.7 + 3.1, z * 0.7 - 1.7),
    path = Math.exp(-((x * 0.55) ** 2)) * 0.07;
  const mossy = Math.min(0.55, edge * 0.5 + Math.max(0, damp - 0.62) * 0.9);
  return { k: 0.9 + 0.14 * noise(x * 2.3, z * 2.3) - 0.08 * Math.max(0, damp - 0.5) + path, mossy };
}
function tone(m, col, x, z, k = 1) {
  const w = weather(x, z),
    c = m.mix(col, moss, w.mossy * 0.5);
  return [c[0] * w.k * k, c[1] * w.k * k, c[2] * w.k * k];
}
// One bevelled block over [x0, x1] by [z0, z1] of the tile's frame. `wx`, `wz` place the tile.
function block(m, x0, x1, z0, z1, col, wx, wz, top = TOP, bevel = 0.006, sides = [1, 2]) {
  const b = Math.min(bevel, (x1 - x0) * 0.2, (z1 - z0) * 0.2),
    lo = top - 0.012;
  const foot = [
    [x0, lo, z0],
    [x0, lo, z1],
    [x1, lo, z1],
    [x1, lo, z0]
  ];
  const cap = [
    [x0 + b, top, z0 + b],
    [x0 + b, top, z1 - b],
    [x1 - b, top, z1 - b],
    [x1 - b, top, z0 + b]
  ];
  const at = (p, f = 1) => tone(m, col, wx + p[0], wz + p[2], f);
  m.face(cap, cap.map((p) => at(p)));
  // The arrises toward the south and east (the side the game first looks from) are drawn; the
  // others show only as the dark joint.
  for (const i of sides) {
    const j = (i + 1) % 4;
    m.face([foot[i], foot[j], cap[j], cap[i]], [at(foot[i], 0.72), at(foot[j], 0.72), at(cap[j], 0.9), at(cap[i], 0.9)]);
  }
}
// Is a point of the tile's frame under the inlaid ring?
function onRing(wx, wz, x, z, pad = 0) {
  const d = Math.hypot(wx + x - RING.x, wz + z - RING.z);
  return Math.abs(d - RING.r) < RING.w + pad;
}
// A brick, unless it lies under the ring.
function brick(m, x0, x1, z0, z1, wx, wz, col) {
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2,
    half = Math.max(x1 - x0, z1 - z0) / 2;
  if (onRing(wx, wz, cx, cz, half * 0.55)) return;
  block(m, x0, x1, z0, z1, col, wx, wz, TOP, 0.005);
}
const allSides = [0, 1, 2, 3];

function bed(m, y = BED, col = bedTone) {
  put(
    m,
    [
      [-0.5, y, -0.5],
      [-0.5, y, 0.5],
      [0.5, y, 0.5],
      [0.5, y, -0.5]
    ],
    col
  );
}
// The face down to the shelf wherever the tile is the board's edge.
function edges(m, cell, wx, wz) {
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    if (walk.has(cell.x + dx + ',' + (cell.y + dz))) continue;
    const ax = dx ? dx * 0.5 : -0.5,
      bx = dx ? dx * 0.5 : 0.5,
      az = dz ? dz * 0.5 : -0.5,
      bz = dz ? dz * 0.5 : 0.5;
    put(
      m,
      [
        [ax, -0.06, az],
        [bx, -0.06, bz],
        [bx, TOP - 0.01, bz],
        [ax, TOP - 0.01, az]
      ],
      tone(m, graniteShade, wx + dx * 0.5, wz + dz * 0.5, 0.85),
      [dx, 0, dz]
    );
  }
}

// Brick in a basket weave inside a border of bricks laid lengthwise round the tile.
function brickTile(m, cell, wx, wz) {
  const r = m.rng,
    o = 0.497,
    bw = 0.075,
    j = 0.007;
  const shade = () => m.mix(brickTone, r.next() < 0.5 ? brickPale : brickWarm, r.next() * 0.55);
  // The border: four runs, each of three bricks.
  for (let k = 0; k < 3; k++) {
    const a = -o + bw + j + ((2 * (o - bw - j)) * k) / 3 + j / 2,
      b = -o + bw + j + ((2 * (o - bw - j)) * (k + 1)) / 3 - j / 2;
    brick(m, a, b, -o, -o + bw, wx, wz, shade());
    brick(m, a, b, o - bw, o, wx, wz, shade());
    brick(m, -o, -o + bw, a, b, wx, wz, shade());
    brick(m, o - bw, o, a, b, wx, wz, shade());
  }
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const x0 = sx < 0 ? -o : o - bw,
        z0 = sz < 0 ? -o : o - bw;
      brick(m, x0, x0 + bw, z0, z0 + bw, wx, wz, m.mix(shade(), graniteDark, 0.2));
    }
  // The field: three by three squares, each of two bricks, turned alternately.
  const f = o - bw - j,
    n = 3,
    s = (2 * f) / n;
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++) {
      const x0 = -f + i * s,
        z0 = -f + k * s,
        turn = (i + k + cell.x + cell.y) % 2;
      for (let q = 0; q < 2; q++) {
        const a = q * (s / 2) + j / 2,
          b = (q + 1) * (s / 2) - j / 2;
        if (turn) brick(m, x0 + a, x0 + b, z0 + j / 2, z0 + s - j / 2, wx, wz, shade());
        else brick(m, x0 + j / 2, x0 + s - j / 2, z0 + a, z0 + b, wx, wz, shade());
      }
    }
}

// The granite walk up the axis: two long slabs side by side, with a kerb of brick on edge.
function axisTile(m, cell, wx, wz) {
  const r = m.rng,
    j = 0.008;
  for (const s of [-1, 1]) brick(m, s < 0 ? -0.497 : 0.42, s < 0 ? -0.42 : 0.497, -0.497, 0.497, wx, wz, m.mix(brickTone, brickPale, r.next() * 0.4));
  const split = cell.y % 2 ? 0.1 : -0.1;
  for (const [a, b] of [
    [-0.412, split - j],
    [split + j, 0.412]
  ])
    block(m, a, b, -0.497, 0.497, m.mix(slabTone, slabPale, r.next() * 0.6), wx, wz, TOP + 0.004, 0.01, allSides);
}
// The apron before the hall: long granite slabs laid east to west.
function apronTile(m, cell, wx, wz) {
  const r = m.rng,
    j = 0.008,
    rows = [-0.497, -0.16, 0.18, 0.497];
  for (let k = 0; k < 3; k++) {
    const cut = (cell.x + k) % 2 ? 0.25 : -0.3;
    for (const [a, b] of [
      [-0.497, cut - j],
      [cut + j, 0.497]
    ])
      block(m, a, b, rows[k] + j, rows[k + 1] - j, m.mix(slabTone, slabPale, r.next() * 0.5), wx, wz, TOP, 0.01, allSides);
  }
}

// One element stone: a great flagstone with a ring and a sign inlaid flush in the element's
// colour, a hair above the stone so it reads as colour and never as a step under a piece.
function elementTile(m, cell, wx, wz, e) {
  const r = m.rng,
    o = 0.497,
    y = TOP + 0.0035,
    col = e.col;
  block(m, -o, o, -o, o, m.mix(slabTone, slabPale, 0.3), wx, wz, TOP, 0.012, allSides);
  const ring = (r0, r1, c, n = 24, h = y) => {
    for (let i = 0; i < n; i++) {
      const a = (i * circle) / n,
        b = ((i + 1) * circle) / n;
      put(
        m,
        [
          [Math.cos(a) * r1, h, Math.sin(a) * r1],
          [Math.cos(b) * r1, h, Math.sin(b) * r1],
          [Math.cos(b) * r0, h, Math.sin(b) * r0],
          [Math.cos(a) * r0, h, Math.sin(a) * r0]
        ],
        c
      );
    }
  };
  ring(0.33, 0.4, tone(m, col, wx, wz, 0.95));
  ring(0.29, 0.31, tone(m, col, wx, wz, 0.85), 24, y + 0.0002);
  // Eight little studs round the ring, the 八卦 points.
  for (let i = 0; i < 8; i++) {
    const a = (i * circle) / 8 + circle / 16;
    put(
      m,
      [0, 1, 2, 3].map((q) => {
        const t = a + (q * circle) / 4;
        return [Math.cos(a) * 0.445 + Math.cos(t) * 0.022, y, Math.sin(a) * 0.445 + Math.sin(t) * 0.022];
      }),
      tone(m, graniteDark, wx, wz)
    );
  }
  const c = tone(m, col, wx, wz, 1.02),
    h = y + 0.0005;
  if (e.sign === 'square') {
    put(m, [[-0.15, h, -0.15], [-0.15, h, 0.15], [0.15, h, 0.15], [0.15, h, -0.15]], c);
    put(m, [[-0.07, h + 0.0003, -0.07], [-0.07, h + 0.0003, 0.07], [0.07, h + 0.0003, 0.07], [0.07, h + 0.0003, -0.07]], tone(m, slabPale, wx, wz));
  } else if (e.sign === 'disc') {
    const pts = [];
    for (let i = 0; i < 20; i++) pts.push([Math.cos((i * circle) / 20) * 0.17, h, Math.sin((i * circle) / 20) * 0.17]);
    put(m, pts, c);
  } else if (e.sign === 'waves') {
    for (const dz of [-0.1, 0, 0.1]) {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const x0 = -0.19 + (0.38 * i) / n,
          x1 = -0.19 + (0.38 * (i + 1)) / n,
          z0 = dz + 0.03 * Math.sin(x0 * 22),
          z1 = dz + 0.03 * Math.sin(x1 * 22);
        put(m, [[x0, h, z0 - 0.02], [x0, h, z0 + 0.02], [x1, h, z1 + 0.02], [x1, h, z1 - 0.02]], c);
      }
    }
  } else if (e.sign === 'bar') {
    put(m, [[-0.045, h, -0.2], [-0.045, h, 0.2], [0.045, h, 0.2], [0.045, h, -0.2]], c);
    for (const s of [-1, 1])
      put(m, [[0, h, -0.02], [s * 0.15, h, -0.14], [s * 0.15, h, -0.08], [0, h, 0.05]], c);
  } else {
    // 火: a three-tongued flame pointing north, up the court.
    put(m, [[-0.16, h, 0.15], [0.16, h, 0.15], [0, h, -0.2]], c);
    for (const s of [-1, 1]) put(m, [[s * 0.08, h, 0.12], [s * 0.21, h, 0.12], [s * 0.19, h, -0.08]], c);
  }
  // Bits of the brick border showing at the corners.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) put(m, [[sx * 0.44, y, sz * 0.47], [sx * 0.47, y, sz * 0.47], [sx * 0.47, y, sz * 0.44]], tone(m, graniteDark, wx, wz));
  void r;
}

// The ring through the five, laid on any tile it crosses: short flush strips of stone whose
// colour runs from one element's to the next round the circle.
function ringStrips(m, wx, wz) {
  const order = ELEMENTS.map((e) => ({ a: ringAngle(e), col: e.col })).sort((p, q) => p.a - q.a);
  const colourAt = (a) => {
    for (let i = 0; i < order.length; i++) {
      const p = order[i],
        q = order[(i + 1) % order.length];
      let span = q.a - p.a,
        t = a - p.a;
      if (span <= 0) span += circle;
      if (t < 0) t += circle;
      if (t <= span) return m.mix(m.mix(p.col, q.col, t / span), slabPale, 0.42);
    }
    return m.rgb(slabPale);
  };
  const n = 260,
    y = TOP - 0.002;
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n,
      b = ((i + 1) * circle) / n;
    const pts = [
      [RING.r - RING.w, a],
      [RING.r + RING.w, a],
      [RING.r + RING.w, b],
      [RING.r - RING.w, b]
    ].map(([d, t]) => [RING.x + Math.cos(t) * d - wx, y, RING.z + Math.sin(t) * d - wz]);
    if (!pts.every(([x, , z]) => Math.abs(x) <= 0.5 && Math.abs(z) <= 0.5)) continue;
    // Not across the element stones, which carry their own rings.
    const mx = (pts[0][0] + pts[2][0]) / 2,
      mz = (pts[0][2] + pts[2][2]) / 2;
    if (Math.abs(mx) < 0.5 && Math.abs(mz) < 0.5 && elementAt.has(Math.round(wx + CX) + ',' + Math.round(wz + CZ))) continue;
    const c = colourAt((a + b) / 2);
    put(m, pts, tone(m, c, wx, wz));
  }
}

// The ground hook: lays the whole tile and returns true.
function ground(m, p, cell) {
  const wx = cell.x - CX,
    wz = cell.y - CZ,
    e = elementAt.get(cell.x + ',' + cell.y);
  bed(m);
  edges(m, cell, wx, wz);
  if (e) elementTile(m, cell, wx, wz, e);
  else if (cell.y === 0) apronTile(m, cell, wx, wz);
  else if (cell.x === CX && cell.y >= 1 && cell.y <= 9 && cell.y !== 5) axisTile(m, cell, wx, wz);
  else brickTile(m, cell, wx, wz);
  if (!e && cell.y > 0) ringStrips(m, wx, wz);
  return true;
}

// Plain tiles: now and then a few fallen bamboo or osmanthus leaves, and moss in the joints
// toward the walls.
function plainLitter(m, p, cell) {
  const r = m.rng,
    wx = cell.x - CX,
    wz = cell.y - CZ,
    w = weather(wx, wz);
  if (r.next() < 0.35)
    for (let i = 0; i < 3; i++) {
      const x = r.range(-0.4, 0.4),
        z = r.range(-0.4, 0.4),
        a = r.range(0, circle),
        l = r.range(0.05, 0.08);
      m.leaf([x, TOP + 0.004, z], [x + Math.cos(a) * l, TOP + 0.006, z + Math.sin(a) * l], 0.012, r.pick([0x9a8a4c, 0x7d8a4a, 0xa89a5c]), 0xb8ac70, 0.003);
    }
  if (w.mossy > 0.18)
    for (let i = 0; i < 4; i++) {
      const x = r.range(-0.45, 0.45),
        z = r.range(-0.45, 0.45),
        s = r.range(0.04, 0.08);
      put(m, [[x - s, TOP + 0.002, z], [x, TOP + 0.002, z + s * 0.7], [x + s, TOP + 0.002, z], [x, TOP + 0.002, z - s * 0.7]], m.mix(moss, 0x8a9a5c, r.next() * 0.5));
    }
}

// The stone beam bridge: the deck is cut by the borrowed tile language (three long slabs on each
// tile); this adds the beams' bevelled ends resting on the abutments, a low kerb along the outer
// edge, the beams' undersides, and moss and ferns along their joints.
function beamBridge(m, p, cell) {
  const r = m.rng,
    west = !walk.has(cell.x - 1 + ',' + cell.y),
    east = !walk.has(cell.x + 1 + ',' + cell.y);
  // The deep beams themselves, under the deck slabs.
  for (let j = -1; j < 2; j++) {
    const x = j * 0.32;
    m.box(x, -0.17, 0, 0.3, 0.22, 1.08, m.mix(granite, graniteShade, 0.5 + 0.2 * j));
    m.box(x, -0.29, 0, 0.27, 0.04, 1.08, graniteDark);
  }
  // Threshold stones where the deck meets the abutments, and bearing stones under the beam ends.
  for (const s of [-1, 1]) m.box(0, 0.0, s * 0.447, 1.0, 0.124, 0.106, m.mix(granite, graniteShade, 0.25));
  for (const s of [-1, 1]) m.box(0, -0.38, s * 0.5, 1.02, 0.18, 0.22, graniteShade);
  for (const [side, on] of [
    [-1, west],
    [1, east]
  ]) {
    if (!on) continue;
    const x = side * 0.46;
    m.box(x, 0.1, 0, 0.07, 0.09, 1.0, m.mix(granite, graniteShade, 0.3));
    m.box(x, 0.15, 0, 0.09, 0.02, 1.02, granite);
    for (const z of [-0.5, 0.5]) m.box(x, 0.16, z, 0.11, 0.17, 0.11, granite);
    // Ferns and moss hanging from the beam's outer face.
    for (let k = 0; k < 3; k++) {
      const z = r.range(-0.4, 0.4),
        len = r.range(0.12, 0.3);
      m.leaf([x + side * 0.05, -0.08, z], [x + side * 0.12, -0.08 - len, z + r.range(-0.05, 0.05)], 0.035, 0x55703f, 0x7d9a58, 0.02);
    }
  }
  for (let k = 0; k < 2; k++) {
    const x = r.range(-0.3, 0.3);
    put(m, [[x - 0.05, 0.064, -0.5], [x + 0.05, 0.064, -0.5], [x + 0.03, 0.064, -0.42], [x - 0.04, 0.064, -0.43]], moss);
  }
}

export { ground, plainLitter, beamBridge, ELEMENTS, RING, weather };
