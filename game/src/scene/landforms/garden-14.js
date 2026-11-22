import { circle, midway } from '../scenery-kit.js';
import { bloom, flowerPot, needlePad } from './landform-14.js';

// The furnishings of 東方不敗's garden, and its middle layer of planting: pierced
// Taihu stones, a stone table laid for go and for tea, stone lanterns, a bronze
// censer before the house, a bird cage, a stand of orchids, a wisteria arbour on the
// west, camellias against the wall and a little cloud-pruned pine. Each takes its
// place (x, y, z) in the garden; heights are kept modest, and everything stands off
// the tiles.

// 太湖石: a tall pale stone, worn into necks, shoulders and holes. Built of lumps that
// leave gaps between them, with dark hollows let into its faces.
function taihuStone(m, x, y, z, h, yaw, sides = 7) {
  const r = m.rng,
    pale = 0xd2cfc2,
    shade = 0x8c8b82,
    hollow = 0x3e3f3c;
  m.frame(x, y, z, yaw, 1, () => {
    // Plinth stones half sunk in the moss.
    m.rock(0, -0.04, 0, h * 0.34, h * 0.12, h * 0.26, 0x6e7068, 0x8f9088, 7, r.range(0, 3));
    const lumps = [
      [-0.12, 0.05, 0.0, 0.16, 0.36, 0.13],
      [0.13, 0.02, 0.03, 0.13, 0.3, 0.11],
      [0.0, 0.34, 0.0, 0.25, 0.16, 0.13],
      [-0.08, 0.46, 0.02, 0.13, 0.26, 0.11],
      [0.14, 0.5, -0.02, 0.09, 0.2, 0.09],
      [0.02, 0.7, 0.0, 0.22, 0.14, 0.12],
      [-0.1, 0.8, 0.01, 0.1, 0.2, 0.09],
      [0.08, 0.86, 0.0, 0.14, 0.16, 0.1]
    ];
    for (const [lx, ly, lz, rx, rh, rz] of lumps)
      m.rock(
        lx * h + ly * h * 0.12,
        ly * h,
        lz * h,
        rx * h,
        rh * h,
        rz * h,
        shade,
        pale,
        sides,
        r.range(0, 3)
      );
    // The holes: dark ovals on the faces, front and back.
    for (const [hx, hy, hr] of [
      [0.0, 0.22, 0.05],
      [0.03, 0.58, 0.04],
      [-0.1, 0.36, 0.03],
      [0.06, 0.78, 0.035]
    ])
      for (const s of [-1, 1]) {
        const ring = [];
        for (let k = 0; k < 7; k++) {
          const a = (k * circle) / 7;
          ring.push([
            (hx + Math.cos(a) * hr) * h,
            (hy + Math.sin(a) * hr * 1.3) * h,
            s * 0.135 * h
          ]);
        }
        m.face(s > 0 ? ring : ring.reverse(), hollow);
      }
  });
  // Ferns and moss at its foot.
  for (let k = 0; k < 6; k++) {
    const a = (k * circle) / 6 + r.range(-0.3, 0.3),
      d = h * 0.32,
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d;
    const l = 0.16 * Math.min(1, h);
    m.leaf(
      [px, y, pz],
      [px + Math.cos(a) * l, y + l * 0.6, pz + Math.sin(a) * l],
      l * 0.2,
      0x3f5f36,
      0x6f8f4c,
      l * 0.3
    );
  }
}

// A round stone table on a drum, four drum stools, a go board with a game left half
// played, and a tea tray: pot and cups.
function stoneTable(m, x, y, z) {
  const stone = 0x8d8a80,
    lit = 0xb3afa3;
  m.lathe(
    x,
    y - 0.04,
    z,
    [
      [0, 0.17],
      [0.06, 0.13],
      [0.32, 0.11],
      [0.38, 0.16],
      [0.4, 0.31],
      [0.46, 0.32],
      [0.47, 0.001]
    ],
    stone,
    18
  );
  m.lathe(
    x,
    y + 0.4,
    z,
    [
      [0, 0.315],
      [0.06, 0.32]
    ],
    lit,
    18
  );
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4 + 0.4,
      sx = x + Math.cos(a) * 0.55,
      sz = z + Math.sin(a) * 0.55;
    m.lathe(
      sx,
      y - 0.04,
      sz,
      [
        [0, 0.1],
        [0.06, 0.125],
        [0.17, 0.13],
        [0.27, 0.11],
        [0.3, 0.001]
      ],
      k % 2 ? stone : 0x9a968b,
      12
    );
    m.hoop(sx, y + 0.12, sz, 0.13, 0.008, 0x6e6b63, 12);
  }
  // The go board, its grid and the stones.
  const by = y + 0.475;
  m.frame(x - 0.06, by, z + 0.02, 0.35, 1, () => {
    m.box(0, 0.015, 0, 0.3, 0.03, 0.3, 0xc39a5b);
    for (let k = 0; k < 9; k++) {
      const t = -0.12 + k * 0.03;
      m.box(t, 0.031, 0, 0.003, 0.002, 0.24, 0x3a2a1c);
      m.box(0, 0.031, t, 0.24, 0.002, 0.003, 0x3a2a1c);
    }
    const r = m.rng;
    for (let k = 0; k < 16; k++) {
      const i = Math.floor(r.range(0, 9)),
        j = Math.floor(r.range(0, 9));
      m.lathe(
        -0.12 + i * 0.03,
        0.032,
        -0.12 + j * 0.03,
        [
          [0, 0.012],
          [0.006, 0.01],
          [0.008, 0.001]
        ],
        k % 2 ? 0xf2efe6 : 0x1e1e20,
        6
      );
    }
    // The two bowls of stones.
    for (const [bx, col] of [
      [-0.21, 0x1e1e20],
      [0.21, 0xf2efe6]
    ]) {
      m.lathe(
        bx,
        -0.005,
        0.1,
        [
          [0, 0.03],
          [0.03, 0.045],
          [0.05, 0.03]
        ],
        0x6b4a32,
        8
      );
      m.lathe(
        bx,
        0.03,
        0.1,
        [
          [0, 0.03],
          [0.012, 0.012]
        ],
        col,
        8
      );
    }
  });
  // The tea tray across the table.
  m.frame(x + 0.17, by, z - 0.12, -0.3, 1, () => {
    m.box(0, 0.006, 0, 0.18, 0.012, 0.12, 0x5a3626);
    m.lathe(
      -0.03,
      0.012,
      0,
      [
        [0, 0.03],
        [0.03, 0.042],
        [0.06, 0.03],
        [0.07, 0.012],
        [0.08, 0.004]
      ],
      0x7a4a36,
      8
    );
    m.tube([-0.0, 0.05, 0], [0.04, 0.07, 0], 0.006, 0.004, 0x7a4a36, 4);
    for (const [cx, cz] of [
      [0.05, -0.03],
      [0.06, 0.03],
      [0.02, 0.045]
    ])
      m.lathe(
        cx,
        0.012,
        cz,
        [
          [0, 0.01],
          [0.022, 0.017]
        ],
        0xe9e4d6,
        6
      );
  });
}

// 石燈籠: a stone lantern on a post, its fire box lit.
function stoneLantern(m, x, y, z, size = 1) {
  const stone = 0x8e8c84,
    lit = 0xafaca2;
  m.frame(x, y, z, 0.4, size, () => {
    m.lathe(
      0,
      -0.03,
      0,
      [
        [0, 0.16],
        [0.06, 0.14],
        [0.1, 0.07]
      ],
      stone,
      6
    );
    m.lathe(
      0,
      0.07,
      0,
      [
        [0, 0.055],
        [0.38, 0.045]
      ],
      lit,
      6
    );
    m.lathe(
      0,
      0.45,
      0,
      [
        [0, 0.07],
        [0.04, 0.13],
        [0.07, 0.12]
      ],
      stone,
      6
    );
    for (let k = 0; k < 6; k++) {
      const a = (k * circle) / 6;
      m.box(Math.cos(a) * 0.095, 0.6, Math.sin(a) * 0.095, 0.03, 0.16, 0.03, lit);
    }
    m.glow(() =>
      m.lathe(
        0,
        0.52,
        0,
        [
          [0, 0.075],
          [0.16, 0.075]
        ],
        0xffcf86,
        6
      )
    );
    m.lathe(
      0,
      0.68,
      0,
      [
        [0, 0.1],
        [0.02, 0.2],
        [0.05, 0.17],
        [0.12, 0.06],
        [0.15, 0.03]
      ],
      stone,
      6
    );
    m.lathe(
      0,
      0.82,
      0,
      [
        [0, 0.035],
        [0.04, 0.04],
        [0.08, 0.001]
      ],
      lit,
      6
    );
  });
}

// 鼎: a bronze censer on three legs, with two upright handles and a lid of openwork.
function censer(m, x, y, z) {
  const bronze = 0x4f5a45,
    gold = 0x9a7d3e;
  m.frame(x, y, z, 0.3, 1, () => {
    m.lathe(
      0,
      -0.02,
      0,
      [
        [0, 0.2],
        [0.06, 0.17],
        [0.09, 0.1]
      ],
      0x8b8880,
      8
    );
    for (let k = 0; k < 3; k++) {
      const a = (k * circle) / 3;
      m.tube(
        [Math.cos(a) * 0.1, 0.09, Math.sin(a) * 0.1],
        [Math.cos(a) * 0.13, 0.2, Math.sin(a) * 0.13],
        0.02,
        0.026,
        bronze,
        5
      );
    }
    m.lathe(
      0,
      0.18,
      0,
      [
        [0, 0.08],
        [0.04, 0.16],
        [0.14, 0.17],
        [0.18, 0.15],
        [0.2, 0.16]
      ],
      bronze,
      12
    );
    m.hoop(0, 0.3, 0, 0.16, 0.012, gold, 12);
    for (const s of [-1, 1]) {
      m.tube([s * 0.13, 0.36, 0], [s * 0.13, 0.46, 0], 0.012, 0.012, bronze, 4);
      m.tube([s * 0.13, 0.46, 0], [s * 0.18, 0.46, 0], 0.012, 0.012, bronze, 4);
      m.tube([s * 0.18, 0.46, 0], [s * 0.17, 0.36, 0], 0.012, 0.012, bronze, 4);
    }
    m.lathe(
      0,
      0.38,
      0,
      [
        [0, 0.15],
        [0.06, 0.12],
        [0.12, 0.05],
        [0.18, 0.03],
        [0.21, 0.001]
      ],
      m.mix(bronze, gold, 0.3),
      10
    );
  });
}

// A bird cage of bamboo hung from a stand: a domed cage, its bars, a hook and a little
// white-eye on its perch.
function birdCage(m, x, y, z) {
  const bamboo = 0xa8894f,
    dark = 0x5c4630;
  m.tube([x - 0.2, y - 0.05, z], [x - 0.2, y + 1.3, z], 0.022, 0.018, dark, 5);
  m.lathe(
    x - 0.2,
    y - 0.04,
    z,
    [
      [0, 0.1],
      [0.05, 0.07]
    ],
    0x7a756b,
    6
  );
  m.line(
    [
      [x - 0.2, y + 1.28, z],
      [x + 0.08, y + 1.32, z],
      [x + 0.14, y + 1.26, z]
    ],
    0.012,
    dark,
    4
  );
  const top = y + 1.2,
    cy = y + 0.78;
  m.tube([x + 0.14, top + 0.06, z], [x + 0.14, top, z], 0.004, 0.004, 0x2c2e31, 3);
  m.lathe(
    x + 0.14,
    cy,
    z,
    [
      [0, 0.14],
      [0.03, 0.14]
    ],
    dark,
    12
  );
  for (let k = 0; k < 16; k++) {
    const a = (k * circle) / 16,
      c = Math.cos(a),
      s = Math.sin(a);
    m.line(
      [
        [x + 0.14 + c * 0.14, cy + 0.03, z + s * 0.14],
        [x + 0.14 + c * 0.14, cy + 0.28, z + s * 0.14],
        [x + 0.14 + c * 0.09, cy + 0.38, z + s * 0.09],
        [x + 0.14, cy + 0.42, z]
      ],
      0.0035,
      bamboo,
      3
    );
  }
  m.hoop(x + 0.14, cy + 0.28, z, 0.14, 0.006, dark, 12);
  m.tube([x + 0.04, cy + 0.12, z], [x + 0.24, cy + 0.12, z], 0.005, 0.005, bamboo, 3);
  m.rock(x + 0.14, cy + 0.125, z, 0.03, 0.04, 0.022, 0x7f9a4a, 0xa9bf62, 5);
  m.box(x + 0.165, cy + 0.16, z, 0.014, 0.008, 0.012, 0xf3efe6);
}

// A tiered stand of dark wood with orchids in blue-and-white pots: arching blades,
// a few spikes of pale flowers.
function orchidStand(m, x, y, z, yaw) {
  const wood = 0x3a2a22;
  m.frame(x, y, z, yaw, 1, () => {
    for (const [sx, sz] of [
      [-0.32, -0.12],
      [0.32, -0.12],
      [-0.32, 0.12],
      [0.32, 0.12]
    ])
      m.box(sx, 0.35, sz, 0.035, 0.74, 0.035, wood);
    for (const [ty, tz] of [
      [0.38, 0.0],
      [0.7, -0.04]
    ]) {
      m.box(0, ty, tz, 0.72, 0.03, 0.26, 0x4c382c);
      for (let k = 0; k < 3; k++) {
        const px = -0.22 + k * 0.22;
        m.lathe(
          px,
          ty + 0.015,
          tz,
          [
            [0, 0.04],
            [0.05, 0.06],
            [0.09, 0.065],
            [0.1, 0.07]
          ],
          k % 2 ? 0xe8e8e2 : 0x5a7a9a,
          8
        );
        const r = m.rng;
        for (let l = 0; l < 7; l++) {
          const a = (l * circle) / 7 + r.range(-0.3, 0.3),
            len = r.range(0.14, 0.24),
            base = [px, ty + 0.11, tz],
            mid = [
              px + Math.cos(a) * len * 0.45,
              ty + 0.11 + len * 0.6,
              tz + Math.sin(a) * len * 0.45
            ],
            tip = [px + Math.cos(a) * len, ty + 0.1 + len * 0.35, tz + Math.sin(a) * len];
          m.leaf(base, mid, 0.012, 0x2f5a32, 0x4f7a42, 0.01);
          m.leaf(mid, tip, 0.01, 0x2f5a32, 0x4f7a42, 0.004);
        }
        const spike = [px + 0.03, ty + 0.36, tz];
        m.line([[px, ty + 0.11, tz], [px + 0.02, ty + 0.25, tz], spike], 0.004, 0x5f7a42, 3);
        for (let f = 0; f < 3; f++) {
          const at = midway([px + 0.02, ty + 0.25, tz], spike, 0.3 + f * 0.35);
          m.crystal(
            at[0] + 0.02,
            at[1],
            at[2],
            0.022,
            0.025,
            k === 1 ? 0xd9c7e8 : 0xf1ecd6,
            0xffffff,
            5
          );
        }
      }
    }
  });
}

// A wisteria arbour: two rows of posts, beams and rafters, the old vine twisting up
// the posts and along the top, its flowers hanging in long mauve trusses.
function wisteria(m, x0, z0, x1, z1, height) {
  const r = m.rng,
    wood = 0x4a3a30,
    vine = 0x4d3b2e,
    len = Math.hypot(x1 - x0, z1 - z0),
    along = [(x1 - x0) / len, (z1 - z0) / len],
    across = [-along[1] * 0.55, along[0] * 0.55],
    posts = Math.round(len / 1.1);
  const at = (t, s, y) => [
    x0 + (x1 - x0) * t + across[0] * s,
    y,
    z0 + (z1 - z0) * t + across[1] * s
  ];
  for (let k = 0; k <= posts; k++)
    for (const s of [-1, 1]) {
      const t = k / posts;
      m.tube(at(t, s, -0.05), at(t, s, height), 0.04, 0.035, wood, 6);
      m.lathe(
        ...at(t, s, -0.04),
        [
          [0, 0.07],
          [0.08, 0.06]
        ],
        0x8b8880,
        6
      );
    }
  for (const s of [-1, 1]) m.tube(at(-0.05, s, height), at(1.05, s, height), 0.035, 0.035, wood, 5);
  for (let k = 0; k <= posts * 3; k++) {
    const t = k / (posts * 3);
    m.tube(
      at(t, -1.35, height + 0.06),
      at(t, 1.35, height + 0.06),
      0.022,
      0.022,
      m.mix(wood, 0x6d5442, 0.4),
      4
    );
  }
  // The vine: up two posts, then wandering along the top.
  for (const s of [-1, 1]) {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8,
        twist = k * 1.4;
      const p = at(s > 0 ? 0 : 1, s, height * t);
      pts.push([p[0] + Math.cos(twist) * 0.05, p[1], p[2] + Math.sin(twist) * 0.05]);
    }
    m.line(pts, 0.03, vine, 5);
  }
  const crown = [];
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    crown.push(at(t, Math.sin(k * 0.9) * 0.7, height + 0.1 + 0.04 * Math.sin(k * 1.7)));
  }
  m.line(crown, 0.022, vine, 4);
  // Leaves along the top and the hanging trusses of flower.
  const flowers = [0x9b7fc4, 0xb69bd8, 0x8667b4, 0xcdb8e6];
  for (let k = 0; k < 70; k++) {
    const t = r.range(0, 1),
      s = r.range(-1.3, 1.3),
      top = at(t, s, height + 0.1 + r.range(0, 0.06));
    if (k % 2) {
      const a = r.range(0, circle);
      m.leaf(
        top,
        [top[0] + Math.cos(a) * 0.2, top[1] + r.range(-0.04, 0.05), top[2] + Math.sin(a) * 0.2],
        0.05,
        0x4a7038,
        0x7a9c50,
        0.03
      );
    } else {
      const drop = r.range(0.25, 0.45),
        col = r.pick(flowers);
      for (let q = 0; q < 4; q++) {
        const w = 0.05 * (1 - q * 0.2);
        m.crystal(
          top[0],
          top[1] - drop * (q + 1) * 0.25,
          top[2],
          w,
          drop * 0.3,
          m.mix(col, 0x6d4f9a, q * 0.15),
          m.mix(col, 0xffffff, 0.35),
          5,
          0
        );
      }
    }
  }
}

// 山茶: a camellia bush, dark glossy leaf in clumps, red and pink flowers set in it.
function camellia(m, x, y, z, size) {
  const r = m.rng;
  m.tube([x, y - 0.05, z], [x, y + 0.25 * size, z], 0.035 * size, 0.025 * size, 0x4a3a30, 5);
  for (let k = 0; k < 6; k++) {
    const a = (k * circle) / 6 + r.range(-0.3, 0.3),
      d = k === 5 ? 0 : 0.2 * size,
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d,
      py = y + size * (k === 5 ? 0.45 : r.range(0.15, 0.35));
    m.rock(px, py, pz, 0.22 * size, 0.32 * size, 0.2 * size, 0x1f3a26, 0x3f6a40, 7, r.range(0, 3));
  }
  const col = r.pick([0xc0283c, 0xd84a62, 0xe9909f]);
  for (let k = 0; k < 14; k++) {
    const a = r.range(0, circle),
      t = r.range(0.2, 1),
      px = x + Math.cos(a) * 0.36 * size * t,
      pz = z + Math.sin(a) * 0.36 * size * t,
      py = y + size * (0.25 + 0.45 * (1 - t * 0.6));
    m.crystal(px, py, pz, 0.045 * size, 0.04 * size, col, m.mix(col, 0xfff0d0, 0.4), 6);
  }
}

// A little pine clipped into clouds of needle on a twisting trunk.
function cloudPine(m, x, y, z, size, yaw) {
  m.frame(x, y, z, yaw, size, () => {
    const trunk = [
      [0, -0.05, 0],
      [0.12, 0.3, 0.02],
      [-0.08, 0.6, -0.03],
      [0.06, 0.9, 0.02],
      [-0.02, 1.1, 0]
    ];
    for (let k = 1; k < trunk.length; k++)
      m.tube(
        trunk[k - 1],
        trunk[k],
        0.07 - k * 0.012,
        0.06 - k * 0.012,
        k % 2 ? 0x5c4838 : 0x6b5644,
        6
      );
    for (const [from, to, pad] of [
      [1, [0.48, 0.45, 0.1], 0.32],
      [2, [-0.42, 0.7, -0.08], 0.3],
      [3, [0.36, 0.95, -0.12], 0.26]
    ]) {
      m.tube(trunk[from], to, 0.025, 0.015, 0x5e4a3a, 5);
      needlePad(m, to[0], to[1] + 0.03, to[2], pad);
    }
    needlePad(m, -0.02, 1.15, 0, 0.3);
  });
}

// The furnishings, given the ground's height function.
function gardenFurnishings(m, land) {
  const set = (x, z) => [x, land.ground(x, z), z];
  stoneTable(m, ...set(-3.0, -5.75));
  for (const [x, z, h, yaw] of [
    [-1.0, -7.9, 1.25, 0.3],
    [-3.5, -7.5, 1.5, 2.1],
    [-5.4, -5.9, 1.05, 4.0],
    [-6.75, -3.4, 0.95, 1.2],
    [1.2, -8.0, 1.0, 5.3]
  ])
    taihuStone(m, ...set(x, z), h, yaw);
  stoneLantern(m, ...set(-6.6, 3.0));
  stoneLantern(m, ...set(0.75, -6.55), 0.9);
  censer(m, ...set(1.9, -6.5));
  birdCage(m, ...set(0.3, -6.7));
  orchidStand(m, ...set(1.3, -8.75), 0.15);
}
function gardenLayer(m, land) {
  const set = (x, z) => [x, land.ground(x, z), z];
  wisteria(m, -6.8, -1.25, -6.8, 0.75, 1.55);
  for (const [x, z, size] of [
    [-0.6, -8.75, 1.0],
    [-2.3, -8.45, 1.1],
    [-4.7, -7.6, 0.95],
    [-6.4, -6.8, 0.9],
    [-7.35, -3.9, 0.85],
    [-6.5, 2.0, 0.8],
    [1.5, -7.3, 0.7]
  ])
    camellia(m, ...set(x, z), size);
  cloudPine(m, ...set(-1.85, -6.8), 0.8, 2.2);
  cloudPine(m, ...set(-6.4, -4.4), 0.8, 0.6);
  // Peonies and chrysanthemums in pots along the north walk.
  const petals = [0xe58aa8, 0xf4ede4, 0xc9486e, 0xd9a03c];
  for (const [k, [x, z]] of [
    [-0.2, -6.45],
    [-1.2, -6.5],
    [-4.0, -6.2],
    [-6.5, -2.1],
    [-6.45, 1.4]
  ].entries())
    flowerPot(m, ...set(x, z), 1.2, petals[k % petals.length], k % 2 ? 0x8a5f4a : 0x52606c);
  // Fallen petals drifting across the garden ground under the plums.
  const r = m.rng;
  for (let k = 0; k < 90; k++) {
    const a = r.range(0, circle),
      d = r.range(0, 2.4),
      cx = [-2.5, -4.6, -6.6, -0.4][k % 4],
      cz = [-7.6, -6.4, -3.0, -7.6][k % 4],
      x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d;
    if ((x > -6.0 && z > -6.0) || Math.hypot(x, z) > land.read(land.top, land.spoke(x, z)) - 0.45)
      continue;
    bloom(m, [x, land.ground(x, z) + 0.01, z], 0.035, false);
  }
}

export { gardenFurnishings, gardenLayer, cloudPine, taihuStone };
