import { TAU, lerp, stone, moss, pebble, timber, rope, cloth, bark, palm } from './kit-12.js';

// The works of 鐵掌幫 at the mountain gate: posts and lintel of coursed, jointed masonry with
// the gang's tablet, finials on the banner poles, the guards' shelter, a rack of spears and
// staves, goods stacked for carrying up the mountain and the pans of iron sand they harden
// their palms in.

const plank = 0x7a5a3f,
  plankDark = 0x5a4130,
  thatch = [0x7d6a48, 0x8a7550, 0x6c5b3e],
  iron = 0x2c2e30,
  gold = 0xb08a3e;

// A dressed block with chamfered edges, so it catches the light along each arris. The joint
// between it and the next block reads as the thin shadow of the chamfers.
function ashlar(m, x, y, z, w, h, d, col, bevel = 0.025) {
  const b = Math.min(bevel, w / 4, h / 4, d / 4),
    X = [x - w / 2, x - w / 2 + b, x + w / 2 - b, x + w / 2],
    Y = [y - h / 2, y - h / 2 + b, y + h / 2 - b, y + h / 2],
    Z = [z - d / 2, z - d / 2 + b, z + d / 2 - b, z + d / 2];
  const lit = m.mix(col, 0xd6d0c0, 0.18),
    dim = m.mix(col, 0x202020, 0.12);
  // The six faces, each inset by the chamfer.
  m.face(
    [
      [X[1], Y[3], Z[1]],
      [X[1], Y[3], Z[2]],
      [X[2], Y[3], Z[2]],
      [X[2], Y[3], Z[1]]
    ],
    lit
  );
  m.face(
    [
      [X[1], Y[1], Z[3]],
      [X[2], Y[1], Z[3]],
      [X[2], Y[2], Z[3]],
      [X[1], Y[2], Z[3]]
    ],
    col
  );
  m.face(
    [
      [X[1], Y[1], Z[0]],
      [X[1], Y[2], Z[0]],
      [X[2], Y[2], Z[0]],
      [X[2], Y[1], Z[0]]
    ],
    col
  );
  m.face(
    [
      [X[3], Y[1], Z[1]],
      [X[3], Y[2], Z[1]],
      [X[3], Y[2], Z[2]],
      [X[3], Y[1], Z[2]]
    ],
    col
  );
  m.face(
    [
      [X[0], Y[1], Z[1]],
      [X[0], Y[1], Z[2]],
      [X[0], Y[2], Z[2]],
      [X[0], Y[2], Z[1]]
    ],
    col
  );
  // Chamfers along the top edges and the four upright edges.
  m.face(
    [
      [X[1], Y[3], Z[2]],
      [X[1], Y[2], Z[3]],
      [X[2], Y[2], Z[3]],
      [X[2], Y[3], Z[2]]
    ],
    lit
  );
  m.face(
    [
      [X[1], Y[3], Z[1]],
      [X[2], Y[3], Z[1]],
      [X[2], Y[2], Z[0]],
      [X[1], Y[2], Z[0]]
    ],
    lit
  );
  m.face(
    [
      [X[2], Y[3], Z[1]],
      [X[2], Y[3], Z[2]],
      [X[3], Y[2], Z[2]],
      [X[3], Y[2], Z[1]]
    ],
    lit
  );
  m.face(
    [
      [X[1], Y[3], Z[1]],
      [X[0], Y[2], Z[1]],
      [X[0], Y[2], Z[2]],
      [X[1], Y[3], Z[2]]
    ],
    lit
  );
  for (const [xa, xb, za, zb] of [
    [X[2], X[3], Z[3], Z[2]],
    [X[0], X[1], Z[2], Z[3]],
    [X[3], X[2], Z[1], Z[0]],
    [X[1], X[0], Z[0], Z[1]]
  ])
    m.face(
      [
        [xa, Y[1], za],
        [xb, Y[1], zb],
        [xb, Y[2], zb],
        [xa, Y[2], za]
      ],
      dim
    );
  // The underside, seldom seen, as one face.
  m.face(
    [
      [X[0], Y[0], Z[0]],
      [X[3], Y[0], Z[0]],
      [X[3], Y[0], Z[3]],
      [X[0], Y[0], Z[3]]
    ],
    dim
  );
}

// A gate post of coursed blocks, one or two to a course with the joints staggered, the lower
// courses darker with damp and the upper ones streaked with moss.
function masonryPost(m, x, y0, y1, w, d) {
  const r = m.rng;
  let y = y0,
    k = 0;
  while (y < y1 - 0.05) {
    const h = Math.min(y1 - y, r.range(0.3, 0.4)),
      t = (y - y0) / (y1 - y0),
      inset = r.range(0, 0.02),
      tint = () =>
        m.mix(
          m.mix(stone.mid, stone.warm, r.next()),
          t < 0.2 ? stone.dark : moss,
          t < 0.2 ? 0.35 : r.next() < 0.2 ? 0.25 : 0
        );
    if (k % 2) {
      const split = r.range(-0.1, 0.1);
      ashlar(
        m,
        x - w / 4 + split / 2,
        y + h / 2,
        0,
        w / 2 + split - 0.012,
        h - 0.012,
        d - inset,
        tint()
      );
      ashlar(
        m,
        x + w / 4 + split / 2,
        y + h / 2,
        0,
        w / 2 - split - 0.012,
        h - 0.012,
        d - inset,
        tint()
      );
    } else ashlar(m, x, y + h / 2, 0, w - inset, h - 0.012, d - inset * 2, tint());
    y += h;
    k++;
  }
  // The core, darker, shows only as the joints between the blocks.
  m.box(x, (y0 + y1) / 2, 0, w - 0.05, y1 - y0, d - 0.05, stone.dark);
}

// The gate in the frame of its own ground: two coursed posts, a lintel of three dressed blocks
// and the gang's tablet on its face, the black palm on a field of iron grey.
function gateMasonry(m) {
  for (const s of [-1, 1]) {
    masonryPost(m, s * 1.2, -0.3, 2.72, 0.64, 0.6);
    // A plinth block at the foot of each post.
    ashlar(m, s * 1.2, -0.06, 0, 0.82, 0.24, 0.78, m.mix(stone.dark, stone.mid, 0.4), 0.04);
  }
  ashlar(m, -1.15, 2.92, 0, 1.0, 0.4, 0.66, m.mix(stone.mid, stone.warm, 0.3), 0.04);
  ashlar(m, 0, 2.94, 0, 1.32, 0.44, 0.7, m.mix(stone.mid, stone.warm, 0.6), 0.04);
  ashlar(m, 1.15, 2.92, 0, 1.0, 0.4, 0.66, m.mix(stone.mid, stone.dark, 0.2), 0.04);
  // A coping slab along the top, its ends turned up like a roof ridge.
  ashlar(m, 0, 3.2, 0, 3.6, 0.12, 0.8, m.mix(stone.dark, stone.mid, 0.5), 0.03);
  for (const s of [-1, 1]) ashlar(m, s * 1.72, 3.32, 0, 0.18, 0.16, 0.78, stone.dark, 0.03);
  // The tablet: a timber frame round a black field, the palm in gilt, on both faces.
  for (const face of [1, -1]) {
    const z = face * 0.37;
    m.box(0, 2.94, z, 1.02, 0.4, 0.04, plankDark);
    m.box(0, 2.94, z + face * 0.022, 0.86, 0.3, 0.012, cloth);
    palm(m, 0.03, 2.95, z + face * 0.03, 0.34, gold);
    for (const s of [-1, 1])
      palm(m, s * 0.33 + 0.02, 2.96, z + face * 0.03, 0.16, m.mix(gold, cloth, 0.3));
  }
}

// A spear-head finial and a tassel at the top of a banner pole.
function finial(m, x, y, z) {
  m.lathe(
    x,
    y,
    z,
    [
      [0, 0.05],
      [0.04, 0.06],
      [0.07, 0.04],
      [0.09, 0.0]
    ],
    iron,
    8
  );
  m.crystal(x, y + 0.08, z, 0.035, 0.26, 0x5a5d60, 0xa9adb0, 4);
  m.tube([x, y + 0.03, z], [x + 0.03, y - 0.16, z + 0.02], 0.025, 0.012, 0x8a2a22, 5);
}

// The guards' shelter: a timber frame on a stone footing, plank walls on three sides open to
// the south, under a hipped roof of bark and thatch laid in courses; a bench inside and
// spears leant against it.
function guardHut(m, ground, x, z, yaw) {
  const r = m.rng,
    w = 1.36,
    d = 0.92,
    wall = 0.95,
    y = Math.max(ground(x - 0.6, z - 0.4), ground(x + 0.6, z - 0.4), ground(x, z + 0.4));
  m.frame(x, y, z, yaw, 1, () => {
    // Footing of rough blocks.
    ashlar(m, 0, -0.08, 0, w + 0.12, 0.28, d + 0.12, m.mix(stone.dark, stone.mid, 0.45), 0.04);
    ashlar(m, 0, 0.065, 0, w + 0.04, 0.03, d + 0.04, m.mix(plank, pebble[0], 0.3), 0.01);
    // Corner posts.
    for (const [px, pz] of [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [-w / 2, d / 2],
      [w / 2, d / 2]
    ])
      m.tube([px, 0.05, pz], [px, wall + 0.05, pz], 0.04, 0.035, bark, 6);
    // Plank walls: the back and the two sides, each board a slightly different brown.
    for (let i = 0; i < 9; i++) {
      const px = -w / 2 + 0.08 + i * ((w - 0.16) / 8);
      m.box(
        px,
        wall / 2 + 0.06,
        -d / 2 + 0.02,
        (w - 0.16) / 8 - 0.008,
        wall - 0.04,
        0.035,
        m.mix(plank, plankDark, r.next() * 0.6)
      );
    }
    for (const s of [-1, 1])
      for (let i = 0; i < 6; i++) {
        const pz = -d / 2 + 0.1 + i * ((d - 0.2) / 5);
        m.box(
          s * (w / 2 - 0.02),
          wall / 2 + 0.06,
          pz,
          0.035,
          wall - 0.04,
          (d - 0.2) / 5 - 0.008,
          m.mix(plank, plankDark, r.next() * 0.6)
        );
      }
    // Beams round the top of the walls.
    m.box(0, wall + 0.06, d / 2, w + 0.08, 0.07, 0.07, plankDark);
    m.box(0, wall + 0.06, -d / 2, w + 0.08, 0.07, 0.07, plankDark);
    // The roof: four sloping planes rising to a short ridge, laid in courses that overlap
    // downward, the lowest pale with weather.
    const eaves = wall + 0.08,
      ridge = eaves + 0.62,
      ox = w / 2 + 0.24,
      oz = d / 2 + 0.26,
      rx = 0.28;
    const courses = 5;
    for (let c = 0; c < courses; c++) {
      const t0 = c / courses,
        t1 = (c + 1.25) / courses,
        tint = m.mix(r.pick(thatch), 0xa0916c, c === 0 ? 0.3 : 0);
      const ring = (t) => {
        const hx = lerp(ox, rx, t),
          hz = lerp(oz, 0.02, t),
          hy = lerp(eaves, ridge, t) + (t === t0 ? -0.025 : 0);
        return [
          [-hx, hy, hz],
          [hx, hy, hz],
          [hx, hy, -hz],
          [-hx, hy, -hz]
        ];
      };
      const a = ring(t0),
        b = ring(Math.min(1, t1));
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        m.face([a[i], a[j], b[j], b[i]], tint, 0.9 + 0.1 * (i % 2));
      }
    }
    m.tube([-rx - 0.06, ridge + 0.02, 0], [rx + 0.06, ridge + 0.02, 0], 0.05, 0.05, plankDark, 6);
    // Inside: a bench along the back, a water jar and a lantern hanging under the eaves.
    m.box(0, 0.3, -d / 2 + 0.2, w - 0.3, 0.05, 0.22, plank);
    for (const s of [-1, 1])
      m.box(s * (w / 2 - 0.25), 0.18, -d / 2 + 0.2, 0.05, 0.24, 0.18, plankDark);
    m.lathe(
      -w / 2 + 0.22,
      0.07,
      d / 2 - 0.2,
      [
        [0, 0.07],
        [0.12, 0.13],
        [0.24, 0.12],
        [0.3, 0.08],
        [0.31, 0.09]
      ],
      0x5a4a3c,
      8
    );
    m.tube(
      [0.35, wall + 0.02, d / 2 + 0.02],
      [0.35, wall - 0.12, d / 2 + 0.02],
      0.006,
      0.006,
      rope,
      3
    );
    m.glow(() =>
      m.lathe(
        0.35,
        wall - 0.3,
        d / 2 + 0.02,
        [
          [0, 0.04],
          [0.04, 0.07],
          [0.16, 0.07],
          [0.2, 0.04]
        ],
        0xd8853c,
        6
      )
    );
    // Spears and a staff leant against the side wall.
    for (let i = 0; i < 3; i++) {
      const px = w / 2 + 0.07,
        pz = d / 2 - 0.15 - i * 0.14;
      m.tube(
        [px + 0.12, 0.06, pz],
        [px - 0.02, 1.25 + i * 0.05, pz + 0.02],
        0.014,
        0.012,
        i === 1 ? 0x8a6a48 : timber,
        4
      );
      if (i !== 1)
        m.crystal(px - 0.025, 1.24 + i * 0.05, pz + 0.02, 0.022, 0.14, iron, 0x9a9da0, 4, -0.01);
    }
  });
}

// A rack of spears and staves: two posts, two rails, the shafts standing in the lower rail
// with their heads up.
function weaponRack(m, ground, x, z, yaw) {
  const r = m.rng,
    y = ground(x, z);
  m.frame(x, y, z, yaw, 1, () => {
    for (const s of [-1, 1])
      m.tube([s * 0.55, -0.1, 0], [s * 0.55, 0.95, 0], 0.035, 0.03, plankDark, 6);
    m.box(0, 0.3, 0, 1.22, 0.06, 0.1, plank);
    m.box(0, 0.88, 0, 1.22, 0.06, 0.08, plank);
    for (let i = 0; i < 7; i++) {
      const px = -0.45 + i * 0.15,
        h = r.range(1.35, 1.7),
        lean = r.range(0.03, 0.08);
      m.tube(
        [px, 0.02, 0.04],
        [px + r.range(-0.02, 0.02), h, -lean],
        0.014,
        0.012,
        i % 3 === 2 ? 0x8a6a48 : timber,
        4
      );
      if (i % 3 !== 2) {
        m.crystal(px, h - 0.01, -lean, 0.024, 0.17, iron, 0xa2a6a8, 4);
        m.tube(
          [px, h - 0.02, -lean],
          [px + 0.02, h - 0.14, -lean + 0.01],
          0.018,
          0.006,
          0x8a2a22,
          4
        );
      }
    }
  });
}

// Goods waiting to be carried up the mountain: crates roped shut, jars of wine and oil, sacks,
// and the carrying poles leant against the pile.
function goodsPile(m, ground, x, z, yaw) {
  const r = m.rng,
    y = ground(x, z);
  m.frame(x, y, z, yaw, 1, () => {
    for (const [px, py, pz, s] of [
      [-0.25, 0.17, 0, 0.36],
      [0.18, 0.15, 0.04, 0.32],
      [-0.08, 0.5, 0.02, 0.3]
    ]) {
      ashlar(m, px, py, pz, s, s * 0.95, s * 0.9, m.mix(plank, 0x9a7a52, r.next() * 0.5), 0.015);
      m.box(px, py, pz, s + 0.012, 0.02, s * 0.9 + 0.012, rope);
      m.box(px, py, pz, 0.02, s * 0.95 + 0.012, s * 0.9 + 0.012, rope);
    }
    for (let i = 0; i < 3; i++) {
      const px = 0.5 + i * 0.22,
        pz = r.range(-0.1, 0.12);
      m.lathe(
        px,
        0,
        pz,
        [
          [0, 0.07],
          [0.08, 0.11],
          [0.2, 0.12],
          [0.3, 0.07],
          [0.33, 0.045],
          [0.36, 0.05]
        ],
        i % 2 ? 0x6e4e38 : 0x58463a,
        9
      );
      m.lathe(
        px,
        0.36,
        pz,
        [
          [0, 0.05],
          [0.04, 0.04],
          [0.06, 0]
        ],
        cloth,
        6
      );
    }
    for (let i = 0; i < 2; i++)
      m.frame(-0.62, 0, 0.1 - i * 0.24, r.range(0, TAU), 1, () =>
        m.rock(0, 0, 0, 0.16, 0.24, 0.13, 0x8f8062, 0xb4a47f, 7)
      );
    for (const s of [-1, 1])
      m.tube([-0.5 + s * 0.08, 0.0, -0.32], [-0.3 + s * 0.12, 1.3, -0.12], 0.02, 0.02, timber, 5);
  });
}

// A pan of iron sand on a stone stand, the kind 鐵掌幫 thrust their hands into: low and wide,
// the sand dark and glinting, a fire banked under it.
function sandPan(m, ground, x, z, s = 1) {
  const y = ground(x, z);
  m.frame(x, y, z, 0, s, () => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      ashlar(
        m,
        Math.cos(a) * 0.25,
        0.1,
        Math.sin(a) * 0.25,
        0.16,
        0.3,
        0.14,
        m.mix(stone.dark, stone.mid, 0.3),
        0.03
      );
    }
    m.glow(() => m.rock(0, 0.04, 0, 0.18, 0.08, 0.18, 0xb8431f, 0xf0a040, 6));
    m.lathe(
      0,
      0.24,
      0,
      [
        [0, 0.1],
        [0.06, 0.28],
        [0.12, 0.36],
        [0.14, 0.37],
        [0.13, 0.34]
      ],
      iron,
      12
    );
    m.lathe(
      0,
      0.24,
      0,
      [
        [0.11, 0.34],
        [0.12, 0.2],
        [0.125, 0]
      ],
      0x47423d,
      12
    );
  });
}

export { ashlar, masonryPost, gateMasonry, finial, guardHut, weaponRack, goodsPile, sandPan };
