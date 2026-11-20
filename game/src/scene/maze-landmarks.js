import { circle, midway } from './scenery-kit.js';
import {
  hall,
  roof,
  tree,
  reeds,
  steps,
  rail,
  lantern,
  banners,
  cargo
} from './maze-models.js';
const wood = 0x70513c,
  oak = 0x9c7953,
  rope = 0xa99b75,
  bronze = 0x8b794c,
  gold = 0xc8a35d,
  patina = 0x557d74;
function postCart(m) {
  for (const side of [-1, 1]) {
    m.hoop(side * 0.52, 0.46, 0, 0.4, 0.042, wood, 16, 'yz');
    for (let i = 0; i < 8; i++) {
      const a = (i * circle) / 8;
      m.tube(
        [side * 0.52, 0.46, 0],
        [side * 0.52, 0.46 + Math.sin(a) * 0.38, Math.cos(a) * 0.38],
        0.02,
        0.02,
        oak,
        5
      );
    }
    m.tube([side * 0.36, 0.49, -0.4], [side * 0.44, 0.74, 1.78], 0.056, 0.039, wood, 6);
  }
  m.box(0, 0.56, 0, 0.95, 0.11, 1.53, oak);
  for (let i = 0; i < 7; i++)
    m.box(0, 0.635, -0.6 + i * 0.2, 0.91, 0.048, 0.169, i % 2 ? 0xab855a : 0x97774e);
  for (let j = 0; j < 3; j++) {
    m.frame((j % 2) * 0.35 - 0.17, 0.65, Math.floor(j / 2) * 0.41 - 0.29, j * 0.17, 0.64, () =>
      cargo(m, 0, 0, 0.72)
    );
  }
}
function net(m) {
  const tan = 0xb8ab82;
  m.box(0, 0.12, 0, 2.05, 0.24, 1.0, 0x887d62);
  for (const side of [-1, 1])
    m.tube([side * 0.75, 0, 0.2], [0, 2.93, -0.02], 0.115, 0.077, wood, 8);
  m.tube([-0.12, 0.9, -0.5], [0.08, 3.42, 1.72], 0.097, 0.06, oak, 8);
  m.tube([0.08, 3.42, 1.72], [0.08, 2.79, 1.72], 0.02, 0.02, rope, 5);
  const center = [0.08, 2.74, 1.72],
    corners = [];
  for (const [dx, dz] of [
    [-1, -1],
    [-1, 1],
    [1, 1],
    [1, -1]
  ]) {
    const tip = [0.08 + dx * 1.42, 1.19, 1.72 + dz * 0.95],
      elbow = [0.08 + dx * 0.81, 2.5, 1.72 + dz * 0.63];
    m.tube(center, elbow, 0.038, 0.026, oak, 6);
    m.tube(elbow, tip, 0.026, 0.013, oak, 5);
    corners.push(tip);
  }
  for (let i = 0; i < 4; i++) m.line([corners[i], corners[(i + 1) % 4]], 0.013, rope);
  const p = (u, v) => [0.08 + u * 1.42, 1.18 - 0.72 * (1 - u * u) * (1 - v * v), 1.72 + v * 0.95];
  for (let i = 0; i <= 10; i++) {
    const k = -1 + (2 * i) / 10;
    m.line(
      Array.from({ length: 10 }, (_, j) => p(k, -1 + (2 * j) / 9)),
      0.0075,
      tan,
      4
    );
    m.line(
      Array.from({ length: 10 }, (_, j) => p(-1 + (2 * j) / 9, k)),
      0.0075,
      tan,
      4
    );
  }
  m.lathe(
    -0.65,
    0,
    0.38,
    [
      [0.12, 0.21],
      [0.2, 0.23],
      [0.38, 0.2],
      [0.48, 0.15],
      [0.51, 0.16]
    ],
    0x947c56,
    12
  );
}
function boat(m, sail = false) {
  const rings = [],
    r = m.rng;
  for (let j = 0; j < 9; j++) {
    const u = -1 + j / 4,
      w = 0.51 * Math.pow(Math.max(0, 1 - u * u), 0.6) + 0.018,
      h = 0.1 + 0.29 * u * u;
    rings.push([
      [-w, h, u * 1.55],
      [-w * 0.7, -0.13 + 0.18 * u * u, u * 1.55],
      [w * 0.7, -0.13 + 0.18 * u * u, u * 1.55],
      [w, h, u * 1.55]
    ]);
  }
  for (let i = 0; i < 8; i++) {
    for (let k = 0; k < 3; k++)
      m.face(
        [rings[i][k], rings[i + 1][k], rings[i + 1][k + 1], rings[i][k + 1]],
        k === 1 ? wood : oak
      );
    m.face(
      [rings[i][0], rings[i + 1][0], rings[i + 1][3], rings[i][3]],
      i % 2 ? 0x8e7255 : 0x997a59
    );
    for (const k of [0, 3]) m.tube(rings[i][k], rings[i + 1][k], 0.027, 0.027, wood);
  }
  if (sail) {
    m.tube([0, 0.1, -0.1], [0, 2.61, -0.1], 0.052, 0.023, oak, 7);
    const p = (u, t) => [
      -0.89 + u * 1.69 + 0.28 * t,
      0.66 + t * (1.66 - 0.33 * u),
      -0.12 + 0.26 * Math.sin(Math.PI * u)
    ];
    for (let j = 0; j < 5; j++)
      for (let k = 0; k < 4; k++)
        m.face(
          [
            p(k / 4, j / 5),
            p((k + 1) / 4, j / 5),
            p((k + 1) / 4, (j + 1) / 5),
            p(k / 4, (j + 1) / 5)
          ],
          j % 2 ? 0xc0ae83 : 0xb5a47c
        );
    for (let j = 0; j < 6; j++)
      m.line(
        Array.from({ length: 5 }, (_, k) => p(k / 4, j / 5)),
        0.016,
        0x897955,
        5
      );
  } else {
    for (let j = 0; j < 6; j++)
      m.tube([-0.38, 0.44, -0.5 + j * 0.16], [0.38, 0.44, -0.5 + j * 0.16], 0.024, 0.024, oak, 6);
  }
  m.tube([-0.15, 0.31, 1.02], [0.68, -0.12, 1.81], 0.025, 0.047, wood, 6);
}
function belfry(m) {
  const red = 0x934f3c;
  for (const x of [-1.73, 1.73]) {
    m.box(x, 0.17, 0, 0.52, 0.34, 0.55, 0x7b8379);
    m.box(x, 1.4, 0, 0.18, 2.26, 0.2, red);
    m.tube([x, 1.74, 0], [x - Math.sign(x) * 0.42, 2.34, 0], 0.067, 0.067, oak, 6);
  }
  for (const y of [1.28, 2.37]) m.box(0, y, 0, 3.74, 0.16, 0.19, red);
  for (let j = 0; j < 6; j++)
    for (let tier = 0; tier < 2; tier++) {
      const x = -1.44 + j * 0.57,
        h = tier ? 2.26 : 1.17,
        size = 0.61 - 0.033 * j;
      m.tube([x, h, 0], [x, h - 0.16, 0], 0.025, 0.025, gold, 6);
      m.frame(x, h - 0.2, 0, 0, size, () => {
        m.lathe(
          0,
          0,
          0,
          [
            [0, 0.17],
            [-0.09, 0.25],
            [-0.45, 0.31],
            [-0.62, 0.38],
            [-0.66, 0.36],
            [-0.57, 0.29]
          ],
          bronze,
          12
        );
        for (let i = 0; i < 3; i++)
          m.hoop(0, -0.18 - i * 0.13, 0, 0.26 + i * 0.019, 0.015, gold, 12);
        for (const side of [-1, 1])
          for (let i = 0; i < 3; i++)
            m.crystal(side * 0.13, -0.3 - i * 0.086, 0.23, 0.026, 0.052, patina, gold, 5);
      });
    }
  for (const x of [-1.89, 1.89])
    m.lathe(
      x,
      2.42,
      0,
      [
        [0, 0.095],
        [0.1, 0.064],
        [0.2, 0.018]
      ],
      gold,
      8
    );
}
function qin(m) {
  m.lathe(
    0,
    0,
    0,
    [
      [0, 1.86],
      [0.13, 1.86],
      [0.17, 1.73],
      [0.29, 1.66]
    ],
    0x889085,
    10
  );
  for (const x of [-0.95, 0.95]) m.box(x, 0.55, 0, 0.27, 0.55, 0.72, 0x737b71);
  m.box(0, 0.85, 0, 3.03, 0.15, 0.91, 0x9aa18b);
  const profile = [
    [-1.27, 0.25],
    [-1.18, 0.29],
    [-0.82, 0.22],
    [-0.53, 0.25],
    [-0.34, 0.3],
    [0.15, 0.24],
    [0.82, 0.18],
    [1.25, 0.16]
  ];
  for (let j = 0; j < profile.length - 1; j++) {
    const [x, w] = profile[j],
      [xx, ww] = profile[j + 1],
      a = [x, 1.04, -w],
      b = [xx, 1.04, -ww],
      c = [xx, 1.04, ww],
      d = [x, 1.04, w];
    m.face([a, d, c, b], j % 3 ? 0x6c4032 : 0x724536);
    for (const [p, q] of [
      [a, b],
      [d, c]
    ])
      m.face([p, q, [q[0], 0.94, q[2]], [p[0], 0.94, p[2]]], 0x4a362e);
  }
  for (let j = 0; j < 7; j++)
    m.tube(
      [-1.15, 1.075, -0.15 + j * 0.048],
      [1.19, 1.065, -0.11 + j * 0.034],
      0.0055,
      0.0055,
      0xd1bf8c,
      4
    );
  for (let j = 0; j < 13; j++)
    m.lathe(
      -1.1 + j * 0.174,
      1.05,
      0.21 - (j > 8 ? 0.052 : 0),
      [
        [0, 0.02],
        [0.01, 0.018]
      ],
      0xddd4a4,
      7
    );
  m.lathe(
    0,
    0,
    1.03,
    [
      [0, 0.34],
      [0.15, 0.27],
      [0.3, 0.3],
      [0.36, 0.37]
    ],
    0x858c7b,
    10
  );
}
function standingStone(m, h, w, col, em) {
  m.rock(0, 0, 0, w * 0.67, h * 0.12, w * 0.58, 0x77776a, 0x838778, 8);
  m.rock(0, h * 0.05, 0, w * 0.49, h * 0.94, w * 0.37, col, m.mix(col, 0xc3bda2, 0.19), 8, 0.31);
  const front = w * 0.32;
  for (let k = 0; k < 4; k++) {
    const yy = h * (0.27 + k * 0.135),
      half = w * (k % 2 ? 0.125 : 0.105);
    m.line(
      [
        [-half, yy + 0.042, front],
        [0, yy + 0.13, front + 0.006],
        [half, yy + 0.042, front]
      ],
      0.013,
      em,
      5
    );
  }
}
function ruinedWall(m, length, height, tower = false) {
  const rng = m.rng,
    stone = [0x787b72, 0x868173, 0x8d8777, 0x777c79, 0x98917f],
    courses = Math.max(4, Math.round(height / 0.34));
  for (let j = 0; j < courses; j++) {
    let xx = -length / 2 - 0.29 * (j % 2);
    while (xx < length / 2 - 0.08) {
      const w = rng.range(0.6, 1.12),
        left = Math.max(xx, -length / 2),
        right = Math.min(xx + w, length / 2);
      const penalty = tower
        ? 0
        : Math.max(0, 0.61 - 1.03 * Math.abs((left + right) / length + 0.1));
      if (
        right > left + 0.05 &&
        j / courses < 1 - penalty &&
        (j < courses - 1 || rng.next() > 0.17)
      ) {
        m.box(
          (left + right) / 2,
          j * 0.34 + 0.164,
          0,
          right - left - 0.015,
          0.327,
          tower ? 1.39 : 0.95,
          rng.pick(stone)
        );
      }
      xx += w;
    }
  }
  for (let i = 0; i < length / 0.74; i++) {
    const x = -length * 0.5 + 0.31 + i * 0.74;
    if (x > length * 0.5 - 0.12 || (!tower && Math.abs(x / length + 0.05) < 0.26)) continue;
    m.box(x, height + 0.17, 0.34, 0.39, 0.35, 0.38, rng.pick(stone));
  }
  if (tower) {
    for (const v of [-0.52, 0.52]) m.box(0, height + 0.23, v, length + 0.12, 0.14, 0.19, 0x747875);
    m.box(0, height * 0.71, 0.71, 0.14, 0.57, 0.032, 0x3e413f);
    banners(m, -length * 0.22, 0.12, height + 1.13, 0x943f35);
  }
}
function siege(m) {
  for (const x of [-0.76, 0.76]) {
    m.box(x, 0.32, 0, 0.15, 0.18, 2.86, wood);
    for (const z of [-0.97, 0.97]) {
      m.hoop(x, 0.32, z, 0.27, 0.048, wood, 12, 'yz');
      m.tube([x - 0.14, 0.32, z], [x + 0.14, 0.32, z], 0.071, 0.071, oak);
      m.tube([x, 0.38, z], [x, 1.95, 0], 0.084, 0.071, oak, 6);
    }
  }
  m.tube([-0.96, 1.94, 0], [0.96, 1.94, 0], 0.08, 0.08, wood, 7);
  m.tube([0, 0.91, -0.87], [0, 3.61, 1.66], 0.123, 0.078, oak, 7);
  m.tube([0, 1.02, -0.78], [0, 0.62, -0.78], 0.038, 0.038, wood, 6);
  m.box(0, 0.55, -0.78, 0.79, 0.62, 0.54, 0x807b69);
  m.line(
    [
      [0, 3.61, 1.66],
      [0.05, 2.9, 1.89],
      [0.12, 2.01, 1.75]
    ],
    0.022,
    rope,
    5
  );
  m.rock(0.12, 1.98, 1.75, 0.17, 0.14, 0.13, 0x84765e);
}
function tomb(m) {
  const gray = 0x596a6b,
    pale = 0x8eaaa1;
  for (const x of [-1.45, 1.45]) {
    m.box(x, 1.51, 0, 0.69, 3.02, 0.9, gray);
    m.box(x, 0.22, 0.06, 0.91, 0.44, 1.08, pale);
    m.box(x, 2.78, 0.07, 0.86, 0.23, 1.07, pale);
  }
  m.box(0, 3.1, 0, 3.85, 0.52, 1.05, 0x677e7b);
  m.box(0, 2.99, 0.54, 3.56, 0.12, 0.12, pale);
  m.box(0, 3.38, 0, 3.6, 0.13, 0.91, 0x869a8f);
  m.box(0, 1.43, -0.3, 2.4, 2.85, 0.56, 0x414f54);
  for (const s of [-1, 1]) {
    m.box(s * 0.57, 1.36, 0.015, 1.05, 2.64, 0.14, 0x657c77);
    for (let j = 0; j < 3; j++) m.box(s * 0.57, 0.48 + j * 0.87, 0.115, 0.8, 0.05, 0.05, 0x8fa596);
    m.hoop(s * 0.57, 1.54, 0.115, 0.177, 0.023, 0x9eb897, 16, 'xy');
    m.box(s * 1.44, 1.52, 0.47, 0.14, 1.91, 0.07, 0x69817d);
    for (let j = 0; j < 5; j++)
      m.crystal(s * 1.44, 0.66 + j * 0.34, 0.52, 0.042, 0.16, 0x618d85, 0xa2d1bd, 5);
  }
  steps(m, 0, 1.51, 3.65, 4, 0.1, 0.3, 0x939f91);
}
function clock(m) {
  const dark = 0x655b46,
    worn = 0xa08c58,
    edge = 0xd0af6b,
    green = 0x5a8177;
  m.lathe(
    0,
    0,
    0,
    [
      [0, 2.12],
      [0.17, 2.12],
      [0.2, 1.97],
      [0.4, 1.93],
      [0.45, 1.76]
    ],
    0x666c69,
    12
  );
  m.hoop(0, 0.44, 0, 1.73, 0.026, edge, 48);
  const bowls = [
    [-0.33, 0.53, 0.29, 1.17],
    [0.11, 1.7, -0.14, 0.88],
    [0.41, 2.82, -0.46, 0.65]
  ];
  for (const [x, y, z, r] of bowls) {
    for (let j = 0; j < 4; j++) {
      const a = (j * circle) / 4 + 0.55,
        dx = Math.cos(a) * r * 0.63,
        dz = Math.sin(a) * r * 0.63;
      if (y > 0.55)
        m.tube(
          [x + dx * 1.1, 0.45, z + dz * 1.14],
          [x + dx, y + 0.17, z + dz],
          0.09,
          0.07,
          dark,
          8
        );
    }
    m.lathe(
      x,
      y,
      z,
      [
        [0, r * 0.46],
        [0.07, r * 0.56],
        [0.14, r * 0.52],
        [0.25, r * 0.71],
        [0.43, r * 0.93],
        [0.53, r],
        [0.6, r * 0.97],
        [0.59, r * 0.89],
        [0.43, r * 0.76]
      ],
      worn,
      28
    );
    for (const [h, rr] of [
      [0.1, 0.55],
      [0.42, 0.93],
      [0.54, 1]
    ])
      m.hoop(x, y + h, z, r * rr, 0.03, edge, 36);
    m.lathe(
      x,
      y + 0.464,
      z,
      [
        [0, r * 0.76],
        [0.008, r * 0.77]
      ],
      0x648b84,
      28
    );
    m.hoop(x, y + 0.575, z, r * 0.885, 0.029, edge, 36);
    m.hoop(x, y + 0.598, z, r * 0.98, 0.022, edge, 36);
    for (let k = 0; k < 12; k++) {
      const a = (k * circle) / 12,
        xx = x + Math.cos(a) * r * 0.955,
        zz = z + Math.sin(a) * r * 0.955;
      m.lathe(
        xx,
        y + 0.559,
        zz,
        [
          [0, 0.035],
          [0.033, 0.043],
          [0.047, 0.03]
        ],
        green,
        6
      );
    }
    for (let k = 0; k < 14; k++) {
      const a = (k * circle) / 14;
      m.lathe(
        x + Math.cos(a) * r * 0.89,
        y + 0.38,
        z + Math.sin(a) * r * 0.89,
        [
          [0, 0.035],
          [0.055, 0.034]
        ],
        green,
        6
      );
    }
    if (y > 1) {
      const sp = [x - 0.12, y + 0.48, z + r * 0.88],
        mouth = [x - 0.29, y + 0.39, z + r * 1.2];
      m.tube(sp, mouth, 0.082, 0.077, edge, 8);
      m.glow(() =>
        m.tube(mouth, [mouth[0] - 0.1, y - 0.54, mouth[2] + 0.07], 0.034, 0.023, 0x81ccc0, 8)
      );
    }
  }
  m.tube([0.38, 0.42, -0.46], [0.38, 4.79, -0.46], 0.08, 0.068, edge, 9);
  for (let j = 0; j < 15; j++)
    m.box(0.49, 1.37 + j * 0.205, -0.46, j % 3 === 0 ? 0.26 : 0.16, 0.027, 0.045, 0xe3c483);
  m.frame(0.39, 4.24, -0.46, 0.25, 1, () => {
    m.hoop(0, 0, 0, 0.72, 0.047, edge, 36, 'xy', 0.23);
    m.hoop(0, 0, 0, 0.68, 0.042, green, 36, 'yz', -0.34);
    m.hoop(0, 0, 0, 0.71, 0.025, edge, 36, 'xz', 0.18);
    m.crystal(0, -0.13, 0, 0.17, 0.3, green, 0xd9bd71, 8);
  });
}
function floatingGate(m) {
  for (const s of [-1, 1]) {
    m.box(s * 1.18, 1.5, 0, 0.23, 3, 0.26, 0x8a3428);
    m.lathe(
      s * 1.18,
      0,
      0,
      [
        [0, 0.28],
        [0.23, 0.24],
        [0.33, 0.17]
      ],
      0xa7a7a1,
      8
    );
    m.tube([s * 1.18, 2.23, 0], [s * 0.72, 2.69, 0], 0.075, 0.075, 0xab8666, 6);
    lantern(m, s * 1.34, 2.39, 0, 0.74, 0xd18c64);
  }
  m.box(0, 2.82, 0, 2.94, 0.24, 0.32, 0x8a6971);
  // A lower lintel, a name plaque between the two and bracket sets above.
  m.box(0, 2.3, 0, 2.2, 0.15, 0.2, 0x6f3a32);
  for (const z of [-0.105, 0.105]) {
    m.box(0, 2.82, z * 1.6, 2.8, 0.1, 0.01, 0x3b6d69);
    m.box(0, 2.3, z, 2.1, 0.07, 0.01, 0x3b6d69);
  }
  m.box(0, 2.56, 0, 0.86, 0.3, 0.1, gold);
  m.box(0, 2.56, 0, 0.78, 0.24, 0.14, 0x2f3442);
  for (const z of [-0.075, 0.075])
    for (let k = 0; k < 3; k++) m.box(-0.22 + k * 0.22, 2.56, z, 0.1, 0.1, 0.01, gold);
  for (let k = 0; k < 5; k++) {
    const x = -1.1 + k * 0.55;
    m.box(x, 2.97, 0, 0.12, 0.06, 0.12, 0x6f3a32);
    m.box(x, 3.02, 0, 0.36, 0.05, 0.08, 0x3b6d69);
    m.box(x, 3.03, 0, 0.08, 0.05, 0.5, 0x6f3a32);
  }
  for (const s of [-1, 1]) {
    m.box(s * 1.18, 3.0, 0, 0.29, 0.06, 0.31, gold);
    m.box(s * 0.92, 2.18, 0, 0.3, 0.08, 0.16, 0x6f3a32);
  }
  roof(m, 3.35, 1.04, 2.96, 0.7, [0x484f69, 0x64748a, 0x969fa9]);
}
function alpineWalk(m) {
  for (let i = 0; i < 17; i++) {
    const x = -2.16 + i * 0.27,
      h = 0.16 + i * 0.103;
    m.box(x, h, 0, 0.264, 0.12, 1.18, i % 3 ? 0x927b67 : 0xafaa96);
    if (i % 4 === 0) {
      for (const s of [-1, 1]) {
        m.tube([x, -2.9, s * 0.42], [x, h + 0.63, s * 0.48], 0.071, 0.055, wood, 8);
      }
    }
  }
  for (const s of [-1, 1]) {
    m.line(
      [
        [-2.16, 0.79, s * 0.49],
        [-1.08, 1.1, s * 0.49],
        [0, 1.55, s * 0.49],
        [1.08, 1.92, s * 0.49],
        [2.16, 2.42, s * 0.49]
      ],
      0.029,
      rope,
      6
    );
    m.tube([-2.37, -0.02, s * 0.43], [2.36, 1.72, s * 0.43], 0.091, 0.091, wood, 7);
  }
  m.frame(1.52, 1.72, 0, 0, 1, () => {
    for (const x of [-0.49, 0.49])
      for (const z of [-0.59, 0.59]) m.box(x, 0.78, z, 0.092, 1.56, 0.092, wood);
    roof(m, 1.71, 1.68, 1.6, 0.7, [0x6c7e80, 0xb5c6c9, 0xe5e9dc], true);
  });
}
function landmarks(index, add) {
  const makeTree = (name, x, z, k, type, yaw = 0) => add(name, x, z, yaw, (m) => tree(m, type, k));
  if (index === 1) {
    add(
      '紅楓驛樓',
      -7.3,
      2.78,
      1.42,
      (m) => {
        m.box(0, -0.25, 0, 5.32, 0.56, 2.82, 0x776f58);
        hall(m, 4.95, 2.48, true);
        steps(m, 0, 1.78, 2.12, 3, 0.1, 0.2, 0x9e9784);
      },
      { scale: 0.96 }
    );
    add('繫馬廊與驛旗', -6.92, -2.68, 1.28, (m) => {
      rail(m, 0, 0, 3.16, 0, 0.71);
      banners(m, -1.63, 0, 2.85, 0xa94e32);
      postCart(m);
    });
    makeTree('驛前丹楓', 3.73, -6.72, 1.29, 'maple', 0.48);
    makeTree('古道楓林', -2.85, -6.84, 1.03, 'maple', 0.55);
    makeTree('霜楓', 6.79, -2.11, 0.84, 'maple', 0.29);
    add('茶擔與燈柱', 6.33, -3.18, -0.29, (m) => {
      cargo(m, -0.48, 0, 0.78);
      cargo(m, 0.28, 0.1, 0.63);
      m.tube([0.87, 0, -0.12], [0.87, 2.53, -0.12], 0.077, 0.052, wood);
      m.tube([0.87, 2.47, -0.12], [0.26, 2.47, -0.12], 0.047, 0.044, oak);
      lantern(m, 0.3, 2.13, -0.12, 0.91);
    });
  } else if (index === 2) {
    add('罾網與木架', -6.83, 2.41, -0.91, net);
    add('蘆舍', 2.25, -7.31, 0.09, (m) => {
      for (const x of [-1.43, 1.43])
        for (const z of [-0.71, 0.71]) m.tube([x, -0.68, z], [x, 0.45, z], 0.1, 0.082, wood);
      m.frame(0, 0.36, 0, 0, 1, () => {
        hall(m, 3.31, 1.74, false, {
          post: 0x7f704d,
          plaster: 0xa1855f,
          tile: [0x746e50, 0x9c9164, 0xc2b482]
        });
        for (const side of [-1, 1])
          for (let j = 0; j < 38; j++) {
            const x = -1.7 + j * 0.092,
              h = 1.79 + 0.26 * Math.pow(Math.abs(x) / 1.7, 3);
            m.tube(
              [x, h, side * 1.04],
              [x + 0.017, h - 0.1 - m.rng.next() * 0.13, side * 1.2],
              0.017,
              0.009,
              0xb1a272,
              5
            );
          }
      });
    });
    add('沙洲上的風帆', 5.08, -8.6, -0.48, (m) => boat(m, true), { y: -0.46 });
    add('漁舟與魚簍', -3.15, 7.02, 0.55, (m) => boat(m, false), { y: -0.43 });
    for (const [x, z, k] of [
      [-6.6, 2.4, 1.1],
      [2.5, 6.65, 0.7],
      [6.34, -3.12, 0.9],
      [-4.65, -6.48, 1.0]
    ]) {
      add(
        '白花蘆叢',
        x,
        z,
        0,
        (m) => {
          for (let j = 0; j < 18; j++)
            reeds(
              m,
              m.rng.range(-0.97, 0.98),
              m.rng.range(-0.44, 0.42),
              m.rng.range(0.58, 1.03) * k,
              9,
              true,
              -0.16
            );
        },
        { fade: false }
      );
    }
  } else if (index === 3) {
    add('覆雪懸棧', -5.04, -7.23, 0.11, alpineWalk);
    add('峭壁木棧', -7.16, 1.37, 1.42, (m) => {
      m.frame(0, -0.96, 0, 0, 0.82, () => alpineWalk(m));
    });
    makeTree('雪脊古松', 3.51, -7.14, 1.3, 'snow', 1.3);
    makeTree('霜崖雙松', -7.02, 2.9, 1.1, 'snow', 2.17);
    makeTree('棧外小松', 6.49, -3.72, 0.71, 'snow', 0.62);
    add('冰瀑與岩壁', 6.95, -3.07, 0.31, (m) => {
      for (let i = 0; i < 7; i++) {
        const x = m.rng.range(-1.57, 1.58),
          z = m.rng.range(-0.65, 0.61),
          h = m.rng.range(0.69, 2.28);
        m.rock(x, -1.65, z, 0.81, h + 1.4, 0.7, 0x657784, 0xd0dad6, 8);
        m.frame(
          x,
          h - 0.1,
          z + 0.42,
          0,
          1,
          () => m.crystal(0, 0, 0, 0.19, m.rng.range(0.65, 1.46), 0x7ea6bb, 0xd1ebed),
          0,
          Math.PI
        );
      }
    });
  } else if (index === 4) {
    add('空山雙層編鐘', 3.31, -6.89, -0.05, belfry, { scale: 1.18 });
    add('七弦琴臺', -6.91, 2.57, 1.11, qin, { scale: 1.1 });
    add('洗心石門', -1.74, -7.1, -0.22, (m) => {
      for (const x of [-1.25, 1.25]) {
        m.box(x, 1.3, 0, 0.4, 2.6, 0.51, 0x8e9789);
        m.box(x, 0.19, 0, 0.62, 0.38, 0.65, 0x777f72);
      }
      m.box(0, 2.64, 0, 3.27, 0.42, 0.61, 0x8c978a);
      m.box(0, 2.92, 0, 3.7, 0.14, 0.78, 0xa8ae96);
    });
    makeTree('聽風松', -6.59, -2.03, 1.14, 'pine', 1.1);
    makeTree('琴臺側柏', 6.71, 0.62, 0.86, 'pine', 2.49);
  } else if (index === 5) {
    for (const [j, x, z, h, yaw] of [
      [0, -4.76, -6.69, 1.09, 0.41],
      [1, -1.42, -7.4, 1.22, 1.9],
      [2, 3.28, -7.0, 1.21, -0.7],
      [3, -7.06, -2.53, 1.26, 0.57],
      [4, -6.91, 3.18, 1.21, 1.84],
      [5, 6.77, -2.1, 1.0, 0.33]
    ]) {
      makeTree('桃林' + j, x, z, h, 'peach', yaw);
    }
    add('桃陣三石門', 1.11, -6.18, 0, (m) => {
      standingStone(m, 2.45, 0.96, 0x71786c, 0xcfb685);
      m.frame(1.74, 0, 0, 0.16, 1, () => standingStone(m, 2.27, 0.91, 0x818476, 0xc4ae85));
      m.rock(0.89, 2.03, 0, 1.4, 0.49, 0.42, 0x818477, 0x969783, 8, 0.1);
    });
    add('八方陣石', -6.26, 0.16, 1.1, (m) => standingStone(m, 2.14, 0.96, 0x748078, 0xd0ac84));
  } else if (index === 6) {
    add('襄陽破城牆', -1.25, -6.47, 0, (m) => ruinedWall(m, 7.2, 2.4));
    add('殘垣箭樓', 3.62, -6.77, 0.04, (m) => ruinedWall(m, 2.35, 3.34, true));
    add('西城的雉堞', -6.59, -2.22, 1.58, (m) => ruinedWall(m, 4.77, 1.98));
    add('霹靂車遺架', -7.11, 2.24, 0.43, siege);
    add('失守的旌旗', 6.52, -2.69, -0.3, (m) => {
      banners(m, 0, 0, 3.1, 0x973c34);
      cargo(m, -0.65, 0.12, 0.81);
      for (let i = 0; i < 6; i++) {
        const x = m.rng.range(-0.66, 0.71);
        m.rock(x, 0, m.rng.range(-0.37, 0.57), 0.29, 0.18, 0.23, 0x736b5e);
      }
    });
  } else if (index === 7) {
    add(
      '寒玉墓門',
      -6.78,
      2.68,
      1.49,
      (m) => {
        m.rock(0, -0.39, -0.54, 2.14, 3.19, 1.02, 0x4b5b61, 0x617273, 9);
        tomb(m);
        m.glow(() => {
          m.hoop(0, 2.05, 0.15, 0.29, 0.019, 0x8ec8b2, 24, 'xy');
          m.crystal(0, 1.91, 0.16, 0.067, 0.21, 0x9ac9b4, 0xc8dcbd);
        });
      },
      { scale: 1.1 }
    );
    for (const [j, x, z, yaw] of [
      [0, -5.22, -7.22, 0.1],
      [1, 4.31, -7.3, 0],
      [2, -7.13, -2.9, 1.3],
      [3, 7.23, -3.53, 1.25]
    ]) {
      add('洞壁與鐘乳石' + j, x, z, yaw, (m) => {
        for (let k = 0; k < 6; k++) {
          const xx = (k - 2.5) * 0.59,
            h = m.rng.range(2.45, 4.46);
          m.rock(
            xx,
            -0.67,
            -0.13,
            m.rng.range(0.58, 0.91),
            h,
            m.rng.range(0.72, 1.15),
            0x45565f,
            0x6e807e,
            8
          );
          if (k % 2 === 0) {
            m.frame(
              xx,
              h - 0.36,
              0.36,
              0,
              1,
              () => m.crystal(0, 0, 0, 0.21, m.rng.range(0.5, 1.27), 0x6d8b8b, 0xadccbf),
              0,
              Math.PI
            );
          }
        }
        m.glow(() => {
          for (let k = 0; k < 8; k++) {
            const x = m.rng.range(-1.45, 1.46),
              z = m.rng.range(0.11, 0.96);
            m.crystal(
              x,
              -0.05,
              z,
              m.rng.range(0.11, 0.32),
              m.rng.range(0.53, 1.85),
              0x477f79,
              0x9cdec3,
              6,
              m.rng.range(-0.26, 0.27)
            );
          }
        });
      });
    }
  } else if (index === 8) {
    // The two shop-houses on piers are drawn by landforms/pavilion-8.js.
    add(
      '空中折角樓',
      7.82,
      -3.19,
      -0.6,
      (m) => {
        m.frame(
          0.16,
          1.41,
          0.28,
          0.1,
          1,
          () => {
            roof(m, 3.04, 1.68, 0.76, 0.86, [0x50516c, 0x69748a, 0x9498aa]);
            for (const x of [-0.99, 0, 0.99]) {
              for (const z of [-0.46, 0.46]) m.box(x, 0.32, z, 0.095, 0.88, 0.092, 0x8a3428);
            }
            // Its plank floor, a lattice wall on one side and a rail on the other.
            m.box(0, 0.05, 0, 2.4, 0.05, 0.86, 0x9a7a5c);
            for (const x of [-0.5, 0.5]) {
              m.box(x, 0.4, -0.46, 0.9, 0.62, 0.05, 0xd8cdb9);
              m.glow(() => m.box(x, 0.44, -0.43, 0.6, 0.34, 0.02, 0xf2cf92));
              for (let k = 0; k < 6; k++)
                m.box(x - 0.3 + k * 0.12, 0.44, -0.41, 0.018, 0.34, 0.02, 0x5d3a2c);
              m.box(x, 0.36, 0.46, 0.9, 0.035, 0.05, 0xc4bcb0);
              for (let k = 1; k < 6; k++)
                m.box(x - 0.45 + k * 0.15, 0.22, 0.46, 0.025, 0.28, 0.025, 0x8a3428);
            }
            for (const z of [-0.48, 0.48]) {
              m.box(0, 0.02, z, 2.52, 0.12, 0.13, 0xad8a72);
              m.box(0, 0.69, z, 2.65, 0.13, 0.16, 0x80656e);
            }
            for (const x of [-1.2, -0.76, -0.32, 0.12, 0.56, 1.0])
              m.box(x, 0.72, 0, 0.077, 0.095, 1.42, 0xbb977c);
            lantern(m, -0.8, 0.27, 0.51, 0.62, 0xcf956a);
            lantern(m, 0.78, 0.27, 0.51, 0.62, 0xcf956a);
          },
          0.09,
          Math.PI * 0.71
        );
        m.line(
          [
            [-1.43, 0.98, -0.96],
            [-1.26, 1.87, -0.51],
            [-0.5, 2.43, -0.11]
          ],
          0.044,
          0xad9b78,
          6
        );
      },
      { y: 0.05 }
    );
    add('天街牌樓', -6.71, -2.11, 1.42, floatingGate);
    add('側懸的石階', 6.67, -2.79, 1.32, (m) => {
      for (let j = 0; j < 12; j++) {
        const x = j * 0.3 - 1.72,
          y = j * 0.19 - 0.36;
        m.box(x, y, 0, 0.34, 0.16, 0.97, j % 2 ? 0x969aa7 : 0xb1afad);
      }
      m.frame(1.63, 1.89, 0, -0.38, 0.66, () => floatingGate(m));
    });
    add('懸索與銅鈴', -6.19, 3.2, 0.64, (m) => {
      for (const x of [-0.82, 0.82]) m.tube([x, 0, 0], [x, 1.57, 0], 0.07, 0.054, 0x897b73);
      const pts = [
        [-0.82, 1.44, 0],
        [-0.42, 1.14, 0],
        [0, 1.03, 0],
        [0.42, 1.13, 0],
        [0.82, 1.44, 0]
      ];
      m.line(pts, 0.026, gold);
      for (const p of pts.slice(1, 4))
        m.lathe(
          p[0],
          p[1] - 0.28,
          p[2],
          [
            [0, 0.095],
            [0.045, 0.101],
            [0.21, 0.054]
          ],
          gold,
          9
        );
    });
  } else if (index === 9) {
    add(
      '古銅四時漏刻',
      -7.31,
      3.91,
      0.94,
      (m) => {
        m.lathe(
          0,
          -1.32,
          0,
          [
            [0, 1.62],
            [0.38, 1.81],
            [0.52, 1.73],
            [0.88, 2.01],
            [1.27, 2.18],
            [1.33, 2.1]
          ],
          0x575e5c,
          14
        );
        clock(m);
      },
      { scale: 1.02 }
    );
    for (const [j, x, z] of [
      [0, -5.37, -6.39],
      [1, 4.48, -6.62],
      [2, -6.46, -1.06],
      [3, 6.38, -2.29]
    ]) {
      add('列宿渾儀柱' + j, x, z, j * 0.34, (m) => {
        m.lathe(
          0,
          0,
          0,
          [
            [0, 0.48],
            [0.18, 0.48],
            [0.25, 0.34],
            [0.36, 0.27],
            [1.68, 0.24],
            [1.81, 0.34],
            [2.0, 0.27]
          ],
          patina,
          10
        );
        for (let i = 0; i < 4; i++) m.hoop(0, 0.38 + i * 0.38, 0, 0.26, 0.022, gold, 18);
        m.hoop(0, 2.34, 0, 0.47, 0.034, gold, 24, 'xy', 0.34);
        m.hoop(0, 2.34, 0, 0.42, 0.031, bronze, 24, 'yz', -0.26);
        m.glow(() => m.crystal(0, 2.23, 0, 0.11, 0.25, 0xa0a783, 0xe4c272));
      });
    }
    add('觀星石碑', 0.38, -7.11, -0.14, (m) => standingStone(m, 2.82, 0.97, 0x52636a, 0xd1b473));
  }
}

export { landmarks };
