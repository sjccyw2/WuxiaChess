// 紅楓驛's valley beyond the station: maple woods on the hills, harvested fields
// with their stooks, a farmstead on the west road, and young maples by the yard.
import { Model, circle } from '../scenery-kit.js';

const bark = [0x4f4236, 0x5a4a3c, 0x625142];
const reds = [0x7e2f24, 0x9b3a26, 0xb24a2a, 0xc9612f, 0xd9803a];
const golds = [0xa9792f, 0xc39434, 0xd4ad4c];
const greens = [0x5d6a43, 0x6e7647];
const pines = [0x3c5244, 0x48604b, 0x56694c];

// A rounded crown of leaves: a squashed, ragged lump with a lit top. Near
// trees get a fuller profile, so their crowns do not read as flat-bottomed caps.
const coarse = [
  [-0.45, 0.55],
  [-0.08, 1],
  [0.42, 0.74]
];
const full = [
  [-0.62, 0.18],
  [-0.42, 0.72],
  [-0.1, 1],
  [0.24, 0.93],
  [0.52, 0.56]
];
function crown(m, x, y, z, rx, ry, rz, shade, light, n = 8) {
  const r = m.rng,
    phase = r.range(0, circle);
  const edge = Array.from({ length: n }, (_, i) => [
    phase + ((i + r.range(-0.18, 0.18)) * circle) / n,
    r.range(0.78, 1.14)
  ]);
  let last;
  for (const [off, scale] of n > 8 ? full : coarse) {
    const ring = edge.map(([a, k]) => [
      x + rx * Math.cos(a) * k * scale,
      y + ry * (off + 0.14 * Math.sin(a * 3 + off)),
      z + rz * Math.sin(a) * k * scale
    ]);
    if (last)
      for (let j = 0; j < n; j++) {
        const q = (j + 1) % n,
          mid = m.mix(shade, light, 0.35 + off * 0.5 + r.next() * 0.18);
        m.face([last[j], ring[j], ring[q], last[q]], [m.rgb(shade), mid, mid, m.rgb(shade)]);
      }
    last = ring;
  }
  for (let j = 0; j < n; j++) m.face([[x, y + ry * 0.78, z], last[(j + 1) % n], last[j]], light);
}

// A maple seen from afar: a short leaning trunk under a dome of clustered crowns.
function farMaple(m, x, y, z, size, palette) {
  const r = m.rng,
    lean = r.range(-0.1, 0.1),
    turn = r.range(0, circle);
  const top = [x + Math.cos(turn) * lean * size, y + size * 0.36, z + Math.sin(turn) * lean * size];
  m.tube([x, y - 0.1, z], top, 0.06 * size, 0.035 * size, r.pick(bark), 5);
  const shade = r.pick(palette),
    light = m.mix(r.pick(palette), 0xf0b060, 0.2);
  const s = size * r.range(0.5, 0.6);
  crown(m, top[0], top[1] + size * 0.26, top[2], s, s * 0.72, s * 0.95, shade, light, 6);
  const count = 1 + Math.floor(r.next() * 3);
  for (let k = 0; k < count; k++) {
    const a = turn + (k * circle) / count + r.range(-0.5, 0.5),
      d = s * r.range(0.55, 0.8),
      q = s * r.range(0.55, 0.72);
    crown(
      m,
      top[0] + Math.cos(a) * d,
      top[1] + size * r.range(0.06, 0.16),
      top[2] + Math.sin(a) * d,
      q,
      q * 0.7,
      q,
      k % 2 ? light : shade,
      light,
      6
    );
  }
}

// A dark fir among the maples: stacked, drooping skirts.
function farFir(m, x, y, z, size) {
  const r = m.rng,
    col = r.pick(pines);
  m.tube([x, y - 0.1, z], [x, y + size * 0.3, z], 0.05 * size, 0.04 * size, bark[0], 5);
  for (let k = 0; k < 3; k++) {
    const h = y + size * (0.22 + k * 0.27),
      w = size * (0.36 - k * 0.09);
    m.crystal(x, h, z, w, size * (0.5 - k * 0.08), col, m.mix(col, 0x9aa070, 0.32), 6);
  }
}

// A stook of cut millet, bound at the neck.
function stook(m, x, y, z, s) {
  const r = m.rng,
    straw = r.pick([0xb99a59, 0xc4a764, 0xa98c50]);
  m.lathe(
    x,
    y - 0.04,
    z,
    [
      [0, 0.2 * s],
      [0.22 * s, 0.17 * s],
      [0.42 * s, 0.07 * s],
      [0.5 * s, 0.09 * s],
      [0.66 * s, 0.002]
    ],
    straw,
    7
  );
  m.hoop(x, y + 0.42 * s, z, 0.072 * s, 0.012, 0x7d6a45, 7);
}

// A harvested plot: furrows of turned earth between pale stubble ridges, laid
// in short strips so they follow the ground's swell, with stooks along them.
function field(m, at, cx, cz, yaw, w, d, rows) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw),
    r = m.rng;
  // Each furrow's ends wander a little, so the plot edge is hand-dug, not ruled.
  const ends = Array.from({ length: rows + 1 }, () => [r.range(-0.22, 0.12), r.range(-0.12, 0.22)]);
  const spot = (u, v, lift) => {
    const x = cx + u * c + v * s,
      z = cz - u * s + v * c;
    return [x, at(x, z) + lift, z];
  };
  const earth = r.pick([0x7b6545, 0x806a49]),
    stubble = r.pick([0x9d8c5b, 0xa39161]);
  const strips = Math.ceil(d / 0.8),
    along = (t, e) => -d / 2 + e[0] + (d + e[1] - e[0]) * t;
  for (let k = 0; k < rows; k++) {
    const u0 = -w / 2 + (w * k) / rows,
      u1 = u0 + w / rows,
      um = u0 + (w / rows) * 0.55,
      a0 = ends[k],
      a1 = ends[k + 1];
    for (let j = 0; j < strips; j++) {
      const t0 = j / strips,
        t1 = (j + 1) / strips;
      m.face(
        [
          spot(u0, along(t0, a0), 0.028),
          spot(u0, along(t1, a0), 0.028),
          spot(um, along(t1, a1), 0.028),
          spot(um, along(t0, a1), 0.028)
        ],
        m.mix(earth, stubble, r.next() * 0.15)
      );
      m.face(
        [
          spot(um, along(t0, a1), 0.036),
          spot(um, along(t1, a1), 0.036),
          spot(u1, along(t1, a1), 0.036),
          spot(u1, along(t0, a1), 0.036)
        ],
        m.mix(stubble, earth, r.next() * 0.2)
      );
    }
  }
  for (let k = 0; k < rows; k += 2)
    for (let j = 1; j < 4; j++) {
      if (r.next() < 0.45) continue;
      const p = spot(
        -w / 2 + (w * (k + 0.75)) / rows + r.range(-0.06, 0.06),
        -d / 2 + (d * j) / 4 + r.range(-0.2, 0.2),
        0
      );
      stook(m, p[0], p[1], p[2], r.range(0.8, 1.1));
    }
}

// A small farmstead: plastered walls, a grey tile gable roof and a lean-to.
function farmstead(m, at, x, z, yaw) {
  const y = at(x, z);
  m.frame(x, y, z, yaw, 1, () => {
    m.box(0, -0.05, 0, 2.5, 0.3, 1.5, 0x80786a);
    m.box(0, 0.55, 0, 2.2, 1.0, 1.2, 0xc2b195);
    for (const u of [-1.1, 1.1]) m.box(u, 0.55, 0.61, 0.1, 1.0, 0.08, 0x5b4636);
    m.box(0, 0.42, 0.61, 0.5, 0.78, 0.05, 0x4f3b2e);
    for (const side of [-1, 1]) {
      const eave = [
        [-1.38, 1.0, side * 0.86],
        [1.38, 1.0, side * 0.86],
        [1.32, 1.62, 0],
        [-1.32, 1.62, 0]
      ];
      if (side < 0) eave.reverse();
      m.face(eave, side > 0 ? 0x56606a : 0x4a535c);
      m.box(0, 1.0, side * 0.86, 2.8, 0.05, 0.06, 0x3f474e);
    }
    for (const end of [-1.1, 1.1])
      m.face(
        [
          [end, 1.04, -0.6],
          [end, 1.04, 0.6],
          [end, 1.58, 0]
        ],
        0xb7a689
      );
    m.tube([-1.35, 1.64, 0], [1.35, 1.64, 0], 0.05, 0.05, 0x6b747a, 6);
    // Lean-to woodshed against the east gable.
    m.box(1.62, 0.32, 0, 0.5, 0.56, 1.0, 0x8d6c4d);
    m.face(
      [
        [1.3, 0.9, -0.62],
        [1.3, 0.9, 0.62],
        [2.0, 0.6, 0.62],
        [2.0, 0.6, -0.62]
      ],
      0x8f8360
    );
    // Firewood stacked under the lean-to.
    for (let k = 0; k < 4; k++)
      m.tube([1.5, 0.08 + k * 0.09, -0.45], [1.5, 0.08 + k * 0.09, 0.45], 0.05, 0.05, 0x9a7650, 5);
  });
}

function valley(T, at, nearRoad) {
  const m = new Model(T, 640271);
  const r = m.rng;
  // Woods cover the hills; scattered maples dot the valley floor.
  for (let k = 0; k < 250; k++) {
    const gx = r.range(-38, 38),
      gz = r.range(-33, 33);
    if (Math.hypot(gx, gz * 1.14) < 17) continue;
    const wood = Math.max(0, Math.min(1, (at(gx, gz) + 0.05) / 0.7));
    if (r.next() > 0.04 + 0.96 * wood) continue;
    // Trees stand in groves: a few crowded together on the slopes, alone below.
    const grove = 1 + Math.floor(wood * r.range(1.5, 4.2));
    for (let j = 0; j < grove; j++) {
      const x = gx + (j ? r.range(-1.3, 1.3) : 0),
        z = gz + (j ? r.range(-1.3, 1.3) : 0);
      if (Math.hypot(x, z * 1.14) < 16.5 || nearRoad(x, z) < 1.6) continue;
      const y = at(x, z),
        size = r.range(1.5, 2.4) * (0.85 + 0.3 * wood),
        roll = r.next();
      if (roll < 0.14) farFir(m, x, y, z, size * 1.15);
      else farMaple(m, x, y, z, size, roll < 0.32 ? golds : roll < 0.4 ? greens : reds);
    }
  }
  // Harvested fields lie on the open valley floor around the station.
  field(m, at, -17.2, -5.2, 0.12, 4.2, 3.0, 9);
  field(m, at, -16.4, 3.6, -0.08, 3.4, 3.6, 8);
  field(m, at, 6.8, -15.4, 0.3, 4.8, 2.6, 10);
  field(m, at, -6.6, -14.2, -0.22, 3.6, 2.4, 8);
  field(m, at, 13.8, 9.4, 0.5, 3.6, 2.8, 8);
  farmstead(m, at, -17.6, -0.6, Math.PI / 2 + 0.1);
  // A lone maple between the plots, and a few along the field edges.
  for (const [x, z, s] of [
    [-14.6, -7.6, 2.2],
    [-19.4, 1.5, 2.0],
    [9.8, -13.2, 2.1],
    [3.2, -15.8, 1.8],
    [-9.4, -14.6, 1.9],
    [16.2, 7.0, 2.0]
  ])
    farMaple(m, x, at(x, z), z, s, reds);
  return m.finish('楓林山谷與秋收田', { distant: true, cast: false });
}

// A young maple of the yard: a leaning trunk forking into limbs that carry a
// full dome of overlapping leaf clumps, fringed with loose leaf cards.
function youngMaple(m, palette) {
  const r = m.rng,
    lean = r.range(0.08, 0.18),
    turn = r.range(0, circle);
  const fork = [Math.cos(turn) * lean, 0.95, Math.sin(turn) * lean];
  m.tube([0, -0.08, 0], [fork[0] * 0.5, 0.5, fork[2] * 0.5], 0.13, 0.095, bark[1], 7);
  m.tube([fork[0] * 0.5, 0.5, fork[2] * 0.5], fork, 0.095, 0.08, bark[1], 7);
  for (let j = 0; j < 4; j++) {
    const a = (j * circle) / 4 + r.range(-0.3, 0.3);
    m.tube([0, 0.08, 0], [Math.cos(a) * 0.34, -0.06, Math.sin(a) * 0.3], 0.055, 0.012, bark[0], 5);
  }
  const middle = [fork[0] * 1.6, 1.85, fork[2] * 1.6],
    light = m.mix(r.pick(palette), 0xf3b25a, 0.24);
  // Clumps sit on a squashed dome around the middle of the crown.
  const clumps = [[0, 0.42, 0, 0.62]];
  for (let k = 0; k < 7; k++) {
    const a = turn + (k * circle) / 7 + r.range(-0.25, 0.25),
      high = k % 2 ? 0.1 : -0.18;
    clumps.push([Math.cos(a) * 0.72, high, Math.sin(a) * 0.66, r.range(0.42, 0.56)]);
  }
  for (const [dx, dy, dz, s] of clumps) {
    const c = [middle[0] + dx, middle[1] + dy, middle[2] + dz];
    if (dy < 0.4) m.tube(fork, [c[0] * 0.8, c[1] - 0.15, c[2] * 0.8], 0.055, 0.02, bark[1], 5);
    const shade = r.pick(palette);
    crown(
      m,
      c[0],
      c[1],
      c[2],
      s,
      s * 0.74,
      s * 0.94,
      shade,
      m.mix(light, shade, r.next() * 0.3),
      9
    );
    for (let j = 0; j < 9; j++) {
      const b = r.range(0, circle),
        q = s * r.range(0.6, 1.05),
        p = [c[0] + Math.cos(b) * q, c[1] + s * r.range(-0.3, 0.35), c[2] + Math.sin(b) * q],
        len = r.range(0.1, 0.16);
      m.leaf(
        p,
        [p[0] + Math.cos(b) * len, p[1] - len * 0.35, p[2] + Math.sin(b) * len],
        len * 0.42,
        r.pick(palette),
        light,
        len * 0.08
      );
    }
  }
}

function yardMaple(T, at, name, x, z, size, palette, seed, extra) {
  const m = new Model(T, seed);
  m.frame(x, at(x, z), z, 0, size, () => youngMaple(m, palette));
  if (extra) extra(m);
  return m.finish(name, { occluder: true });
}

// A round hay rick for the relay horses: a straw drum on a ring of stones,
// a thatched cone tied down with rope, and a pole through the middle.
function rick(m, at, x, z, s) {
  const y = at(x, z) - 0.03;
  m.frame(x, y, z, m.rng.range(0, circle), s, () => {
    for (let j = 0; j < 9; j++) {
      const a = (j * circle) / 9;
      m.rock(Math.cos(a) * 0.5, -0.04, Math.sin(a) * 0.5, 0.11, 0.09, 0.1, 0x7d776a, 0x989382, 5);
    }
    m.lathe(
      0,
      0,
      0,
      [
        [0, 0.46],
        [0.08, 0.52],
        [0.42, 0.55],
        [0.62, 0.5],
        [0.66, 0.6],
        [0.92, 0.36],
        [1.1, 0.14],
        [1.18, 0.002]
      ],
      0xae9356,
      11
    );
    for (const h of [0.72, 0.9]) m.hoop(0, h, 0, h < 0.8 ? 0.5 : 0.31, 0.014, 0x6f5b3a, 11);
    m.tube([0, 1.0, 0], [0.03, 1.42, 0.02], 0.028, 0.02, bark[1], 5);
    // Straw pulled from the rick lies round its foot.
    for (let j = 0; j < 14; j++) {
      const a = m.rng.range(0, circle),
        q = m.rng.range(0.5, 0.8),
        len = m.rng.range(0.12, 0.22),
        b = a + m.rng.range(-1, 1);
      const p = [Math.cos(a) * q, 0.04, Math.sin(a) * q];
      m.face(
        [
          p,
          [p[0] + Math.cos(b) * len, 0.045, p[2] + Math.sin(b) * len],
          [p[0] + 0.03, 0.05, p[2] + 0.03]
        ],
        m.rng.pick([0xb99c5c, 0xa48a52, 0xc6ab6a])
      );
    }
  });
}

// A post-road milestone: a dressed slab on a squat base, its face cut with the
// distance to the next station, a little shrine lamp and offerings at its foot.
function milestone(m, at, x, z, yaw) {
  const y = at(x, z);
  m.frame(x, y, z, yaw, 1, () => {
    m.rock(0, -0.06, 0, 0.36, 0.14, 0.3, 0x77736a, 0x8f8b7f, 7);
    m.box(0, 0.12, 0, 0.42, 0.14, 0.3, 0x8a8579);
    m.box(0, 0.5, 0, 0.3, 0.64, 0.12, 0x9a9486);
    m.face(
      [
        [-0.15, 0.82, -0.06],
        [0.15, 0.82, -0.06],
        [0.15, 0.82, 0.06],
        [-0.15, 0.82, 0.06]
      ],
      0xa6a092
    );
    m.box(0, 0.88, 0, 0.36, 0.06, 0.16, 0x7f7a6e);
    // Carved characters, read as a column of dark nicks down the face.
    for (let j = 0; j < 7; j++) m.box(0, 0.76 - j * 0.07, 0.062, 0.05, 0.035, 0.006, 0x625e54);
    m.box(0.3, 0.06, 0.12, 0.12, 0.1, 0.1, 0x6e6a61);
    m.lathe(
      0.3,
      0.11,
      0.12,
      [
        [0, 0.04],
        [0.03, 0.05],
        [0.05, 0.03]
      ],
      0x5f6a62,
      7
    );
    for (const [u, w] of [
      [-0.18, 0.05],
      [-0.08, 0.04]
    ])
      m.lathe(
        u,
        0.19,
        0.17,
        [
          [0, w],
          [0.03, w * 0.9]
        ],
        0xc28a4a,
        7
      );
  });
}

// The 紅楓疏林 tile: a few maple saplings along the back of the tile, each a
// thin leaning stem with side twigs and small clumps of red leaves, so the
// tile reads as young woodland while the front stays open for a fighter.
function mapleScrub(m) {
  const r = m.rng,
    count = 3 + Math.floor(r.next() * 2),
    palette = r.next() < 0.25 ? golds : reds;
  for (let j = 0; j < count; j++) {
    const x = -0.36 + (0.72 * (j + r.range(0.15, 0.85))) / count,
      z = r.range(-0.4, -0.2),
      h = r.range(0.34, 0.62),
      lean = r.range(-0.05, 0.05);
    const top = [x + lean, h, z + r.range(-0.03, 0.03)];
    m.tube([x, 0.04, z], top, 0.019, 0.009, bark[2], 5);
    const shade = r.pick(palette),
      light = m.mix(r.pick(palette), 0xf3b25a, 0.2);
    for (let k = 0; k < 2; k++) {
      const a = r.range(0, circle),
        t = 0.45 + k * 0.2,
        from = [x + lean * t, h * t, z],
        tip = [from[0] + Math.cos(a) * 0.13, from[1] + 0.07, from[2] + Math.sin(a) * 0.1];
      m.tube(from, tip, 0.008, 0.004, bark[1], 4);
      crown(m, tip[0], tip[1] + 0.02, tip[2], 0.075, 0.055, 0.07, shade, light, 6);
    }
    crown(m, top[0], top[1] + 0.03, top[2], 0.11, 0.08, 0.1, shade, light, 6);
    for (let k = 0; k < 5; k++) {
      const a = r.range(0, circle),
        q = r.range(0.06, 0.13),
        p = [top[0] + Math.cos(a) * q, top[1] + r.range(-0.08, 0.06), top[2] + Math.sin(a) * q],
        len = r.range(0.05, 0.08);
      m.leaf(
        p,
        [p[0] + Math.cos(a) * len, p[1] - len * 0.3, p[2] + Math.sin(a) * len],
        len * 0.45,
        r.pick(palette),
        light,
        0.006
      );
    }
  }
}

export { valley, yardMaple, mapleScrub, rick, milestone, reds, golds };
