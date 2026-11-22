// 谷底棋臺 only: the four swords of the sword tomb, each standing in its own
// boulder on a star point of the board, and the mound of stones north of the
// table with its carved slab.
import { Model, circle } from '../scenery-kit.js';
import { MOUND, ground, tuft, leafLitter, faceUp, faceOut } from './valley-10.js';

// A blade standing point-down: a prism from y = 0 up to `len`, drawn from its
// cross-section [x, z] pairs. `bend(t)` moves it sideways as it rises.
function blade(m, len, section, tones, bend = () => 0, steps = 1) {
  const n = section.length;
  let last = section.map(([x, z]) => [x + bend(0), 0, z]);
  for (let k = 1; k <= steps; k++) {
    const t = k / steps,
      ring = section.map(([x, z]) => [x + bend(t), len * t, z]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      faceOut(m, [last[i], last[j], ring[j], ring[i]], tones[i % tones.length], [
        bend(t),
        len * t,
        0
      ]);
    }
    last = ring;
  }
  faceUp(m, last, tones[0]);
  return last[0][0] - section[0][0];
}
const diamond = (w, t) => [
  [-w / 2, 0],
  [0, t / 2],
  [w / 2, 0],
  [0, -t / 2]
];

// 利劍: straight, narrow and keen, bright steel with a plain bronze guard.
function keenSword(m) {
  // Painted brighter than white, so the steel still shines where it is turned from the sun.
  blade(
    m,
    0.76,
    diamond(0.095, 0.026),
    [0xffffff, 0xd3dde2, 0xf2f6f7, 0xc3cfd5].map((tone) => m.rgb(tone).map((v) => v * 1.7))
  );
  m.box(0, 0.775, 0, 0.23, 0.032, 0.05, 0xb08d4a);
  for (const s of [-1, 1]) m.box(s * 0.115, 0.765, 0, 0.03, 0.05, 0.055, 0x93743a);
  m.tube([0, 0.79, 0], [0, 0.96, 0], 0.021, 0.019, 0x27313b, 7);
  for (const h of [0.83, 0.875, 0.92]) m.hoop(0, h, 0, 0.022, 0.005, 0x4b6b78, 7);
  m.lathe(
    0,
    0.96,
    0,
    [
      [0, 0.022],
      [0.02, 0.034],
      [0.045, 0.02],
      [0.05, 0]
    ],
    0xb08d4a,
    8
  );
}
// 軟劍 (the Ziwei soft sword): slender, purple in the steel, and so supple that it bows over under its own hilt.
function softSword(m) {
  const bend = (t) => 0.2 * t * t;
  const lean = blade(
    m,
    0.8,
    diamond(0.06, 0.016),
    [0xb9a6e2, 0x7a62ad, 0x9a84cc, 0x66509a],
    bend,
    8
  );
  m.frame(
    lean,
    0.8,
    0,
    0,
    1,
    () => {
      m.lathe(
        0,
        0,
        0,
        [
          [0, 0.02],
          [0.008, 0.06],
          [0.02, 0.06],
          [0.03, 0.02]
        ],
        0x8f7440,
        9
      );
      m.tube([0, 0.03, 0], [0, 0.18, 0], 0.017, 0.015, 0x3a2a4a, 7);
      m.lathe(
        0,
        0.18,
        0,
        [
          [0, 0.016],
          [0.015, 0.026],
          [0.035, 0]
        ],
        0x8f7440,
        8
      );
      // A silk tassel from the pommel.
      m.line(
        [
          [0, 0.2, 0],
          [-0.05, 0.14, 0.01],
          [-0.07, 0.02, 0.015]
        ],
        0.006,
        0x8a55ad,
        4
      );
      m.lathe(
        -0.07,
        -0.05,
        0.015,
        [
          [0, 0.004],
          [0.03, 0.016],
          [0.07, 0.006]
        ],
        0x9a62bd,
        6
      );
    },
    0,
    -0.45
  );
}
// 玄鐵重劍: a great slab of black iron with no edge and no point, as thick as a man's wrist.
function heavySword(m) {
  const w = 0.13,
    t = 0.042,
    c = 0.026;
  blade(
    m,
    0.92,
    [
      [-w, t - c],
      [-w + c, t],
      [w - c, t],
      [w, t - c],
      [w, c - t],
      [w - c, -t],
      [-w + c, -t],
      [-w, c - t]
    ],
    [0x3b4048, 0x23262b, 0x3b4048, 0x1b1d21, 0x2c3037, 0x1e2125, 0x2c3037, 0x1b1d21]
  );
  // Old scars on the flat.
  for (const [x, y, l] of [
    [-0.05, 0.55, 0.16],
    [0.04, 0.3, 0.11],
    [0.06, 0.72, 0.08]
  ])
    m.box(x, y, t + 0.001, 0.012, l, 0.003, 0x4d535c);
  m.box(0, 0.955, 0, 0.42, 0.075, 0.12, 0x1b1d20);
  m.box(0, 0.955, 0, 0.3, 0.085, 0.13, 0x2a2d32);
  m.tube([0, 0.99, 0], [0, 1.3, 0], 0.047, 0.043, 0x2b231e, 8);
  for (const h of [1.05, 1.12, 1.19, 1.26]) m.hoop(0, h, 0, 0.049, 0.007, 0x171310, 8);
  m.box(0, 1.35, 0, 0.14, 0.1, 0.11, 0x24272b);
}
// 木劍: a plain wooden sword, split and weathered grey, its guard a lashed cross-piece.
function woodSword(m) {
  const w = 0.055,
    t = 0.019;
  blade(
    m,
    0.7,
    [
      [-w, 0],
      [-w * 0.7, t],
      [w * 0.7, t],
      [w, 0],
      [w * 0.7, -t],
      [-w * 0.7, -t]
    ],
    [0x9d9080, 0x8b7b66, 0x7c6c58, 0x6f604d, 0x85755f, 0x94866f],
    (k) => 0.012 * Math.sin(k * 3)
  );
  // A split along the grain.
  m.box(0.012, 0.42, t + 0.001, 0.007, 0.4, 0.003, 0x54483a);
  m.box(0, 0.7, 0, 0.21, 0.04, 0.045, 0x74654f);
  for (const s of [-1, 1]) m.hoop(s * 0.035, 0.7, 0, 0.03, 0.006, 0xb8a57a, 7, 'yz');
  m.box(0, 0.82, 0, 0.062, 0.2, 0.034, 0x85755f);
  m.box(0, 0.93, 0, 0.075, 0.03, 0.04, 0x74654f);
}

// One sword stone. Each boulder is as different as its sword: pale granite
// cut clean, violet-grey slate, black basalt cracked by the weight, and a
// mossy brown stone for the wooden sword. The blades are turned flat-on to
// the opening camera.
const stones = {
  keen: {
    rock: [0x858c87, 0xa9b0a6],
    size: [0.36, 0.5, 0.31],
    sword: keenSword,
    yaw: 0.75,
    tilt: [0.05, 0.07]
  },
  soft: {
    rock: [0x6d6a79, 0x928f9d],
    size: [0.35, 0.47, 0.32],
    sword: softSword,
    yaw: 0.6,
    tilt: [0.0, 0.03]
  },
  heavy: {
    rock: [0x45484a, 0x64676a],
    size: [0.42, 0.5, 0.36],
    sword: heavySword,
    yaw: 0.72,
    tilt: [0.02, -0.03]
  },
  wood: {
    rock: [0x6b6859, 0x7c8a5e],
    size: [0.36, 0.46, 0.32],
    sword: woodSword,
    yaw: 0.8,
    tilt: [0.05, -0.1]
  }
};
function swordStone(m, which) {
  const { rock, size, sword, yaw, tilt } = stones[which],
    [rx, h, rz] = size;
  m.rock(0, -0.02, -0.02, rx, h, rz, rock[0], rock[1], 9, which.length);
  m.rock(0.27, -0.02, 0.17, 0.14, 0.2, 0.12, rock[0], rock[1], 7, 2);
  m.rock(-0.3, -0.02, 0.1, 0.1, 0.13, 0.09, rock[0], rock[1], 7, 4);
  if (which === 'heavy')
    // The weight of it has cracked the stone.
    for (const a of [0.5, 2.4, 4.3])
      m.line(
        [
          [0.03, h + 0.012, -0.02],
          [0.03 + Math.cos(a) * 0.13, h + 0.004, -0.02 + Math.sin(a) * 0.11],
          [0.03 + Math.cos(a + 0.3) * 0.25, h * 0.78, -0.02 + Math.sin(a + 0.3) * 0.21]
        ],
        0.008,
        0x1c1e20,
        4
      );
  if (which === 'wood') {
    tuft(m, -0.18, 0.3, 0.16, 0.12);
    tuft(m, 0.2, 0.0, -0.3, 0.14);
  }
  // Drawn a quarter over life size, so each can be told from the others across the board.
  m.frame(0.02, h - 0.06, -0.02, yaw, 1.25, () => sword(m), tilt[0], tilt[1]);
}

// The sword mound: a low heap of stones, grown over at the foot, with one
// upright slab that carries a few columns of worn strokes.
function swordMound(T) {
  const m = new Model(T, 100183),
    r = m.rng;
  const [cx, cz] = MOUND,
    base = ground(cx, cz) - 0.05;
  for (let k = 0; k < 40; k++) {
    const a = r.range(0, circle),
      d = 1.5 * Math.sqrt(r.next()),
      x = Math.cos(a) * d,
      z = Math.sin(a) * d * 0.85;
    const heap = 0.8 * (1 - (d / 1.5) ** 1.6),
      s = r.range(0.18, 0.38) * (1 - 0.25 * (d / 1.5));
    m.rock(
      x,
      ground(cx + x, cz + z) - 0.08 + heap * 0.8 - base,
      z,
      s,
      s * r.range(0.6, 0.95),
      s * r.range(0.7, 1),
      r.pick([0x4f5553, 0x5a5f59, 0x484e4f]),
      r.pick([0x7f857c, 0x8b8e82, 0x6c7859]),
      8,
      a
    );
  }
  // The slab stands in the top of the heap, leaning back a little, its face to the board.
  m.frame(
    0.0,
    0.56,
    -0.2,
    0.22,
    1,
    () => {
      const outline = [
        [-0.5, 0],
        [0.5, 0],
        [0.48, 1.42],
        [0.33, 1.68],
        [0.04, 1.8],
        [-0.3, 1.7],
        [-0.48, 1.44]
      ];
      const front = outline.map(([x, y]) => [x, y, 0.1]),
        back = outline.map(([x, y]) => [x * 0.96, y * 0.99, -0.1]);
      const heart = [0, 0.9, 0];
      faceOut(
        m,
        front,
        front.map(([, y]) => m.mix(0x7d887c, 0x98a191, y / 1.8)),
        heart
      );
      faceOut(m, back, 0x5d675f, heart);
      for (let i = 0; i < outline.length; i++) {
        const j = (i + 1) % outline.length;
        faceOut(m, [front[i], back[i], back[j], front[j]], i === 0 ? 0x525a54 : 0x6e786e, heart);
      }
      // Two columns of cut strokes: the marks of writing, too worn to read.
      const cut = 0x3d4641;
      for (const [x, strokes] of [
        [
          0.17,
          [
            [1.32, 0.2, 0],
            [1.14, 0.13, 0.5],
            [0.98, 0.18, -0.3],
            [0.8, 0.2, 0],
            [0.62, 0.11, 1.2],
            [0.46, 0.17, 0.2]
          ]
        ],
        [
          -0.16,
          [
            [1.24, 0.17, 0.2],
            [1.06, 0.2, -0.2],
            [0.88, 0.1, 1.1],
            [0.72, 0.18, 0],
            [0.54, 0.15, 0.6]
          ]
        ]
      ])
        for (const [y, len, turn] of strokes)
          m.frame(
            x + 0.025 * Math.sin(y * 91.7),
            y,
            0.101,
            0,
            1,
            () => m.box(0, 0, 0, len, 0.036, 0.004, cut),
            0,
            turn
          );
      // Lichen on the weather side.
      for (const [x, y, s] of [
        [-0.3, 1.45, 0.09],
        [0.34, 0.5, 0.07],
        [-0.36, 0.3, 0.1]
      ])
        faceOut(
          m,
          Array.from({ length: 7 }, (_, i) => [
            x + Math.cos((i * circle) / 7) * s,
            y + Math.sin((i * circle) / 7) * s * 0.8,
            0.1015
          ]),
          0x8c9668,
          heart
        );
    },
    -0.07
  );
  for (let k = 0; k < 10; k++) {
    const a = r.range(0, circle),
      d = r.range(1.4, 1.9);
    tuft(
      m,
      Math.cos(a) * d,
      ground(cx + Math.cos(a) * d, cz + Math.sin(a) * d * 0.85) - base,
      Math.sin(a) * d * 0.85,
      r.range(0.18, 0.32)
    );
  }
  for (let k = 0; k < 24; k++) {
    const a = r.range(0, circle),
      d = r.range(1.3, 2.0);
    leafLitter(
      m,
      Math.cos(a) * d,
      ground(cx + Math.cos(a) * d, cz + Math.sin(a) * d) - base + 0.015,
      Math.sin(a) * d
    );
  }
  const g = m.finish('劍塚', { occluder: true });
  g.position.set(cx, base, cz);
  return g;
}
export { swordStone, swordMound };
