// 谷底棋臺 only: the great eagle (神鵰) on its boulder west of the table,
// watching the board. Taller than a man, ugly and noble: a heavy body in dull
// brown-black feathers with bare patches, wings too short to fly, a bald
// wrinkled neck and head with a red wen on the crown, and a great hooked beak.
import { Model, circle } from '../scenery-kit.js';
import { PERCH, ground, tuft, leafLitter, faceUp, faceOut } from './valley-15.js';

const plume = [0x3a322a, 0x2f2924, 0x463c31, 0x51453a],
  skin = 0x8f7166,
  horn = 0xc6a548,
  shank = 0x8d7a48,
  claw = 0x26221d;

// Stacked oval rings, each [y, half-width, half-depth, z of its middle]; `paint`
// gives the colour at an angle round the ring (0 is the bird's right, a quarter turn its front).
function ovoid(m, rings, paint, n = 10, close = true) {
  let last = null;
  rings.forEach(([y, rx, rz, cz], k) => {
    const ring = Array.from({ length: n }, (_, i) => {
      const a = (i * circle) / n;
      return { p: [Math.cos(a) * rx, y, cz + Math.sin(a) * rz], c: paint(a, k) };
    });
    if (last)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        faceOut(
          m,
          [last[i].p, ring[i].p, ring[j].p, last[j].p],
          [last[i].c, ring[i].c, ring[j].c, last[j].c],
          [0, y, cz]
        );
      }
    last = ring;
  });
  if (close)
    faceUp(
      m,
      last.map((v) => v.p),
      last.map((v) => v.c)
    );
}
// One feather: a flat blade from root to tip.
function feather(m, root, tip, w, tone, edge = tone) {
  m.leaf(root, tip, w, tone, edge, w * 0.25);
}
function leg(m, s) {
  const x = s * 0.2;
  for (const a of [-0.55, 0, 0.55]) {
    const end = [x + Math.sin(a + s * 0.15) * 0.22, 0.035, 0.05 + Math.cos(a) * 0.22];
    m.tube([x, 0.06, 0.03], end, 0.034, 0.024, shank, 6);
    m.tube(
      end,
      [end[0] + Math.sin(a) * 0.07, -0.06, end[2] + Math.cos(a) * 0.07],
      0.022,
      0.004,
      claw,
      5
    );
  }
  m.tube([x, 0.06, 0.03], [x, 0.04, -0.12], 0.03, 0.022, shank, 6);
  m.tube([x, 0.04, -0.12], [x, -0.05, -0.18], 0.02, 0.004, claw, 5);
  m.tube([x, 0.05, 0.03], [x, 0.34, -0.02], 0.047, 0.052, shank, 7);
  for (const h of [0.13, 0.22]) m.hoop(x, h, 0.02 - h * 0.15, 0.052, 0.008, 0x75643a, 7);
  // Feathered thighs, ragged at the hem.
  m.frame(x, 0.28, -0.03, 0, 1, () => {
    ovoid(
      m,
      [
        [0, 0.06, 0.06, 0],
        [0.1, 0.14, 0.15, 0],
        [0.3, 0.18, 0.2, 0],
        [0.44, 0.13, 0.15, 0]
      ],
      (a, k) => m.rgb(plume[(k + (Math.sin(a * 3) > 0 ? 1 : 0)) % 3]),
      8,
      false
    );
    for (let k = 0; k < 7; k++) {
      const a = (k * circle) / 7;
      feather(
        m,
        [Math.cos(a) * 0.13, 0.14, Math.sin(a) * 0.14],
        [Math.cos(a) * 0.12, -0.03 - 0.04 * (k % 2), Math.sin(a) * 0.13],
        0.045,
        plume[k % 4]
      );
    }
  });
}
function wing(m, s) {
  // A short folded wing held close: a shallow shield over the bird's side...
  const edge = [
    [0.36, 1.44, 0.14],
    [0.33, 1.4, -0.2],
    [0.36, 0.98, -0.37],
    [0.3, 0.52, -0.3],
    [0.36, 0.72, 0.03],
    [0.4, 1.1, 0.17]
  ].map(([x, y, z]) => [s * x, y, z]);
  const boss = [s * 0.49, 1.02, -0.09];
  for (let i = 0; i < edge.length; i++)
    faceOut(
      m,
      [boss, edge[i], edge[(i + 1) % edge.length]],
      [m.rgb(0x332c26), m.rgb(0x251f1b), m.rgb(0x251f1b)],
      [0, 1, -0.1]
    );
  // ...with two rows of flight feathers down its trailing edge, some of them missing.
  for (let k = 0; k < 6; k++) {
    if (k === 3 && s > 0) continue;
    const t = k / 5;
    feather(
      m,
      [s * (0.46 - 0.05 * t), 1.25 - 0.5 * t, 0.05 - 0.3 * t],
      [s * (0.42 - 0.08 * t), 0.86 - 0.52 * t, -0.2 - 0.26 * t],
      0.075,
      plume[1],
      plume[3]
    );
  }
  for (let k = 0; k < 5; k++) {
    const t = k / 4;
    feather(
      m,
      [s * 0.48, 1.36 - 0.34 * t, 0.12 - 0.26 * t],
      [s * 0.47, 1.1 - 0.36 * t, -0.02 - 0.3 * t],
      0.065,
      plume[k % 2 ? 0 : 2],
      plume[3]
    );
  }
}
function head(m) {
  // Bald wrinkled skin from the ruff up, darker round the eyes.
  ovoid(
    m,
    [
      [-0.36, 0.2, 0.19, -0.1],
      [-0.22, 0.14, 0.14, -0.07],
      [-0.1, 0.108, 0.115, -0.04],
      [-0.02, 0.1, 0.115, -0.02],
      [0.05, 0.128, 0.155, 0.0],
      [0.12, 0.124, 0.155, 0.01],
      [0.18, 0.085, 0.105, 0.0]
    ],
    (a, k) => m.mix(k % 2 ? skin : 0x7a5d55, 0x5d463f, k > 3 && Math.sin(a) > 0.3 ? 0.35 : 0),
    10
  );
  // The wen on the crown.
  m.lathe(
    0,
    0.17,
    -0.01,
    [
      [0, 0.05],
      [0.03, 0.062],
      [0.065, 0.04],
      [0.08, 0]
    ],
    0xa5382c,
    7
  );
  m.lathe(
    0.03,
    0.2,
    0.04,
    [
      [0, 0.02],
      [0.02, 0.028],
      [0.04, 0]
    ],
    0x8f2f26,
    6
  );
  // Heavy brows over small bright eyes.
  for (const s of [-1, 1]) {
    m.frame(
      s * 0.085,
      0.118,
      0.1,
      0,
      1,
      () => m.box(0, 0, 0, 0.1, 0.028, 0.09, 0x4a3a33),
      0.25,
      s * -0.4
    );
    m.lathe(
      s * 0.098,
      0.066,
      0.1,
      [
        [0, 0.006],
        [0.012, 0.024],
        [0.026, 0.024],
        [0.038, 0.006]
      ],
      0xdca83a,
      7
    );
    m.box(s * 0.112, 0.086, 0.112, 0.016, 0.018, 0.018, 0x17120e);
  }
  // The beak: deep at the root, hooked far down over the lower bill.
  const ridge = [
    [0, 0.085, 0.13, 0.072],
    [0, 0.085, 0.25, 0.06],
    [0, 0.045, 0.34, 0.042],
    [0, -0.04, 0.36, 0.02],
    [0, -0.1, 0.33, 0.004]
  ];
  for (let k = 1; k < ridge.length; k++) {
    const [ax, ay, az, ar] = ridge[k - 1],
      [bx, by, bz, br] = ridge[k];
    m.tube([ax, ay, az], [bx, by, bz], ar, br, m.mix(horn, 0x3b3020, (k - 1) / 3.2), 7);
  }
  m.tube([0, 0.02, 0.12], [0, -0.01, 0.27], 0.045, 0.014, 0xa88c3e, 6);
  m.lathe(
    0,
    0.07,
    0.15,
    [
      [-0.03, 0.05],
      [0.0, 0.076],
      [0.03, 0.05]
    ],
    0xb49a52,
    7
  );
}
function bird(m) {
  const r = m.rng;
  leg(m, -1);
  leg(m, 1);
  // The body: darker down the back, the breast paler and patchy.
  ovoid(
    m,
    [
      [0.4, 0.1, 0.1, -0.14],
      [0.5, 0.27, 0.25, -0.11],
      [0.7, 0.37, 0.34, -0.07],
      [0.95, 0.41, 0.37, -0.03],
      [1.2, 0.38, 0.34, 0.01],
      [1.4, 0.29, 0.27, 0.04],
      [1.52, 0.2, 0.19, 0.06]
    ],
    (a, k) =>
      m.mix(
        plume[1],
        plume[3],
        Math.max(0, Math.sin(a)) * (0.5 + 0.3 * ((k * 7) % 3 === 0 ? 1 : 0))
      ),
    12
  );
  // Breast feathers lying over one another, a few gone and the grey skin showing.
  for (let row = 0; row < 5; row++) {
    const y = 1.36 - row * 0.17,
      wide = 0.24 + 0.1 * Math.sin((row + 0.6) * 0.8),
      depth = 0.3 + 0.06 * Math.sin((row + 0.6) * 0.8);
    for (let k = 0; k < 6; k++) {
      if (r.next() < 0.14) continue;
      const a = ((k + (row % 2) * 0.5) / 5.5 - 0.5) * 2.1,
        x = Math.sin(a) * wide,
        z = Math.cos(a) * depth + 0.03;
      feather(
        m,
        [x * 0.95, y, z],
        [x * 1.08, y - 0.2, z + 0.035 + 0.03 * Math.cos(a)],
        0.06,
        r.pick(plume),
        r.pick([plume[3], 0x5f5244])
      );
    }
  }
  for (const [x, y] of [
    [-0.12, 0.98],
    [0.15, 1.2]
  ])
    faceOut(
      m,
      Array.from({ length: 6 }, (_, i) => [
        x + Math.cos(i) * 0.05,
        y + Math.sin(i) * 0.06,
        0.36 + 0.02 * Math.cos(i)
      ]),
      0x6f6059,
      [0, 1, 0]
    );
  wing(m, -1);
  wing(m, 1);
  // A stub of a tail.
  for (let k = 0; k < 5; k++) {
    const a = (k - 2) * 0.24;
    feather(
      m,
      [Math.sin(a) * 0.1, 0.55, -0.3],
      [Math.sin(a) * 0.3, 0.14 + 0.03 * Math.abs(k - 2), -0.62],
      0.075,
      plume[k % 2],
      plume[3]
    );
  }
  // A ragged ruff where the feathers stop and the bare neck begins.
  for (let k = 0; k < 13; k++) {
    const a = (k * circle) / 13 + r.range(-0.12, 0.12),
      l = r.range(0.11, 0.2);
    feather(
      m,
      [Math.cos(a) * 0.16, 1.55, 0.07 + Math.sin(a) * 0.15],
      [Math.cos(a) * (0.17 + l), 1.5 - l * 0.6, 0.07 + Math.sin(a) * (0.16 + l)],
      0.055,
      r.pick([0x5c4d3d, 0x6e5d48, 0x4a3f33]),
      0x7b6a54
    );
  }
  // The head is carried forward and turned a little down, to the board.
  m.frame(0, 1.86, 0.17, 0.12, 1.22, () => head(m), 0.2);
}
function eagle(T) {
  const m = new Model(T, 100207),
    r = m.rng;
  const [x, z] = PERCH,
    base = ground(x, z);
  // Its boulder, bedded in the valley floor with smaller stones against it.
  m.rock(0, -0.25, 0, 0.98, 1.12, 0.88, 0x515755, 0x7d837a, 11, 0.7);
  m.rock(0.75, -0.2, 0.55, 0.42, 0.5, 0.36, 0x4b5150, 0x71786e, 8, 2);
  m.rock(-0.7, -0.2, -0.5, 0.5, 0.55, 0.4, 0x4f5553, 0x6c7859, 8, 4);
  m.rock(-0.35, -0.15, 0.85, 0.3, 0.3, 0.26, 0x484e4f, 0x7a8077, 7, 5);
  for (let k = 0; k < 7; k++) {
    const a = r.range(0, circle),
      d = r.range(1.0, 1.4);
    tuft(
      m,
      Math.cos(a) * d,
      ground(x + Math.cos(a) * d, z + Math.sin(a) * d) - base,
      Math.sin(a) * d,
      r.range(0.16, 0.28)
    );
    leafLitter(
      m,
      Math.cos(a + 1) * d,
      ground(x + Math.cos(a + 1) * d, z + Math.sin(a + 1) * d) - base + 0.015,
      Math.sin(a + 1) * d
    );
  }
  // It faces east, to the middle of the board.
  m.frame(0.05, 0.9, 0, Math.PI / 2 - 0.05, 0.95, () => bird(m));
  const g = m.finish('神鵰與巨石', { occluder: true });
  g.position.set(x, base, z);
  return g;
}

export { eagle };
