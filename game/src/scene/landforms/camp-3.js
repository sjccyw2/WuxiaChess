import { Model } from '../scenery-kit.js';
import { snowLight, spike } from './ground-3.js';

// 聽雪棧 only: signs of who holds the pass. 血刀門 have a watch hut and a
// fire on the north spur behind the shelf, a blade stuck in the snow, their
// blood-red banners at the camp and on the east bench, and wind shelters of
// planks; a wayside shrine stands on the west bench from the older road.

const log = 0x5d4a3c,
  logEnd = 0x8a7560,
  plank = 0x6d5a49,
  snow = 0xf0f3f2,
  snowShade = 0xc9d6df,
  blood = 0x8b1d1a,
  bloodDark = 0x5e1513,
  stone = 0x5d666b,
  ice = 0xcfe8ef;

// A watch hut of round logs, notched at the corners, under a roof sagging with
// snow; a smoke hole box on the ridge and a dark doorway facing the shelf.
function hut(m) {
  const w = 1.1,
    d = 0.84,
    courses = 6,
    r = 0.05;
  // A rubble plinth that levels the floor on the slope.
  m.box(0, -0.25, 0, w + 0.22, 0.56, d + 0.22, stone);
  m.box(0, 0.035, 0, w + 0.26, 0.04, d + 0.26, snowShade);
  for (let i = 0; i < courses; i++) {
    const y = 0.07 + i * r * 1.85;
    // Long walls and end walls alternate by half a log, as notched logs do.
    const lift = i % 2 ? r * 0.9 : 0;
    for (const s of [-1, 1]) {
      m.tube(
        [-w / 2 - 0.08, y + lift, (s * d) / 2],
        [w / 2 + 0.08, y + lift, (s * d) / 2],
        r,
        r,
        i % 2 ? log : 0x544235,
        6
      );
      // The front wall is cut for the door.
      if (s < 0 || i > 3)
        m.tube(
          [(s * w) / 2, y + r * 0.9 - lift, -d / 2 - 0.08],
          [(s * w) / 2, y + r * 0.9 - lift, d / 2 + 0.08],
          r,
          r,
          log,
          6
        );
      else if (s > 0) {
        m.tube(
          [w / 2, y + r * 0.9 - lift, -d / 2 - 0.08],
          [w / 2, y + r * 0.9 - lift, -0.12],
          r,
          r,
          log,
          6
        );
        m.tube(
          [w / 2, y + r * 0.9 - lift, 0.22],
          [w / 2, y + r * 0.9 - lift, d / 2 + 0.08],
          r,
          r,
          log,
          6
        );
      }
    }
  }
  // Doorway in the +x wall, with a jamb each side and a hide hung half across.
  m.box(w / 2 + 0.01, 0.27, 0.05, 0.02, 0.42, 0.32, 0x1b1f22);
  for (const z of [-0.12, 0.22]) m.box(w / 2 + 0.03, 0.28, z, 0.05, 0.46, 0.05, logEnd);
  m.box(w / 2 + 0.05, 0.36, 0.13, 0.015, 0.28, 0.16, 0x7a5a3e);
  // Gable ends.
  const top = 0.07 + courses * r * 1.85,
    ridge = top + 0.42;
  for (const s of [-1, 1])
    m.face(
      [
        [(s * w) / 2, top, -d / 2 - 0.05],
        [(s * w) / 2, top, d / 2 + 0.05],
        [(s * w) / 2, ridge, 0]
      ],
      plank
    );
  // The roof: each slope a sagging blanket of snow over its boards, a wind-
  // rounded lip at the eaves and icicles hung from it.
  const n = 6;
  for (const s of [-1, 1]) {
    const row = (t, out, y0) =>
      Array.from({ length: n + 1 }, (_, i) => {
        const x = -w / 2 - 0.16 + ((w + 0.32) * i) / n,
          sag = 0.035 * Math.sin((Math.PI * i) / n);
        return [x, y0 + (ridge - y0) * (1 - t) - sag * t, s * (d / 2 + out) * t];
      });
    const boards = row(1, 0.14, top - 0.02),
      peak = row(0, 0, ridge),
      blanket = row(1, 0.17, top + 0.06).map((p) => [p[0], p[1], p[2]]),
      crest = row(0, 0, ridge + 0.08);
    const lit = snowLight(m, 0, 1, s * 0.6),
      eave = snowLight(m, 0, 0.2, s, 0.06);
    for (let i = 0; i < n; i++) {
      m.face([peak[i], boards[i], boards[i + 1], peak[i + 1]], plank);
      m.face(
        [crest[i], blanket[i], blanket[i + 1], crest[i + 1]],
        [m.rgb(snow), lit, lit, m.rgb(snow)]
      );
      m.face(
        [blanket[i], boards[i], boards[i + 1], blanket[i + 1]],
        [eave, m.rgb(plank), m.rgb(plank), eave]
      );
      if (i % 2 === 0)
        for (let k = 0; k < 3; k++) {
          const p = boards[i],
            u = p[0] + (((w + 0.32) / n) * (k + 0.5)) / 3;
          spike(
            m,
            [u, p[1] + 0.01, p[2]],
            0.06 + 0.12 * Math.abs(Math.sin(u * 17 + s)),
            0.012,
            ice,
            4,
            0xf4fbfc
          );
        }
    }
    // Snow piled off the eaves along the wall foot.
    m.lathe(
      0,
      0.03,
      s * (d / 2 + 0.22),
      [
        [0, 0.24],
        [0.06, 0.19],
        [0.1, 0.0]
      ],
      snowShade,
      7
    );
  }
  // Smoke hole: a little boxed hood on the ridge, sooted at its mouth.
  m.box(-0.18, ridge + 0.1, 0, 0.2, 0.16, 0.2, plank);
  m.box(-0.18, ridge + 0.11, 0, 0.21, 0.07, 0.24, 0x2a2624);
  m.box(-0.18, ridge + 0.22, 0, 0.3, 0.05, 0.3, snow);
}

// The fire: a ring of stones, crossed logs, embers and low flames, an iron
// tripod with a pot hung over it.
function campfire(m) {
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    m.rock(
      Math.cos(a) * 0.27,
      -0.03,
      Math.sin(a) * 0.27,
      0.075,
      0.09,
      0.06,
      0x3f4549,
      0x9aa3a6,
      6,
      a
    );
  }
  m.lathe(
    0,
    -0.01,
    0,
    [
      [0, 0.24],
      [0.02, 0.16],
      [0.03, 0.0]
    ],
    0x2b2523,
    9
  );
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI + 0.3;
    m.tube(
      [Math.cos(a) * 0.22, 0.02, Math.sin(a) * 0.22],
      [-Math.cos(a) * 0.12, 0.09, -Math.sin(a) * 0.12],
      0.028,
      0.022,
      i % 2 ? 0x3a2a22 : 0x4c3a2c,
      5
    );
  }
  for (const [x, z, h, col] of [
    [0, 0, 0.26, 0xe0782f],
    [0.05, 0.04, 0.17, 0xf2b04e],
    [-0.05, -0.02, 0.19, 0xc9522a],
    [0.02, -0.06, 0.13, 0xf6cf74]
  ])
    m.crystal(x, 0.03, z, 0.05, h, col, 0xffe9a8, 5, 0.02);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    m.tube([Math.cos(a) * 0.36, -0.04, Math.sin(a) * 0.36], [0, 0.62, 0], 0.012, 0.01, 0x2d3235, 4);
  }
  m.line(
    [
      [0, 0.62, 0],
      [0, 0.42, 0]
    ],
    0.006,
    0x2d3235,
    3
  );
  m.lathe(
    0,
    0.3,
    0,
    [
      [0, 0.05],
      [0.03, 0.1],
      [0.08, 0.115],
      [0.12, 0.1],
      [0.13, 0.085]
    ],
    0x30363a,
    9
  );
  m.lathe(
    0,
    0.425,
    0,
    [
      [0, 0.086],
      [0.002, 0.0]
    ],
    0x8a6a4a,
    9
  );
}

// Saddle bags, a rolled hide and a sack, dumped by the fire.
function baggage(m) {
  for (const [x, z, a] of [
    [0, 0, 0.3],
    [0.3, 0.12, -0.5]
  ])
    m.frame(x, 0.07, z, a, 1, () => {
      m.box(0, 0, 0, 0.26, 0.15, 0.17, 0x6b4a33);
      m.box(0, 0.06, 0.04, 0.27, 0.05, 0.12, 0x5a3c29);
      m.box(0.08, 0.02, 0, 0.03, 0.16, 0.18, 0x3c2a1f);
      m.box(-0.08, 0.02, 0, 0.03, 0.16, 0.18, 0x3c2a1f);
      m.box(0, 0.085, 0, 0.2, 0.012, 0.13, snow);
    });
  m.tube([-0.2, 0.06, 0.25], [0.25, 0.06, 0.38], 0.06, 0.06, 0x6e3a2c, 7);
  m.lathe(
    -0.28,
    -0.02,
    -0.12,
    [
      [0, 0.1],
      [0.12, 0.12],
      [0.2, 0.08],
      [0.24, 0.03]
    ],
    0x8c7a5c,
    7
  );
}

// 血刀: a thin, slightly curved blade driven point-first into the snow, a red
// cord knotted to its hilt.
function blade(m) {
  const pts = [
    [0, -0.12, 0],
    [0.02, 0.1, 0],
    [0.055, 0.32, 0],
    [0.1, 0.52, 0]
  ];
  for (let i = 0; i < 3; i++) {
    const a = pts[i],
      b = pts[i + 1];
    m.face(
      [
        [a[0] - 0.02, a[1], 0.004],
        [a[0] + 0.02, a[1], 0.004],
        [b[0] + 0.022, b[1], 0.004],
        [b[0] - 0.018, b[1], 0.004]
      ],
      0xb4bcc0
    );
    m.face(
      [
        [a[0] + 0.02, a[1], 0.004],
        [a[0] + 0.02, a[1], -0.004],
        [b[0] + 0.022, b[1], -0.004],
        [b[0] + 0.022, b[1], 0.004]
      ],
      0x8a2622
    );
  }
  m.box(0.1, 0.54, 0, 0.1, 0.022, 0.05, 0x2c2a28);
  m.tube([0.1, 0.55, 0], [0.12, 0.72, 0], 0.016, 0.014, 0x3b2420, 5);
  m.line(
    [
      [0.115, 0.7, 0],
      [0.16, 0.6, 0.02],
      [0.15, 0.46, 0.04]
    ],
    0.008,
    blood,
    3
  );
  m.lathe(
    0,
    -0.03,
    0,
    [
      [0, 0.07],
      [0.025, 0.04],
      [0.04, 0.0]
    ],
    snowShade,
    6
  );
}

// Old bones, half under the snow: a long bone or two and a skull.
function bones(m) {
  m.tube([-0.12, 0.02, 0], [0.14, 0.03, 0.05], 0.014, 0.013, 0xd6ccb4, 5);
  m.tube([0.0, 0.015, 0.1], [0.18, 0.02, 0.2], 0.012, 0.011, 0xcfc4aa, 5);
  m.rock(-0.2, -0.02, 0.12, 0.05, 0.07, 0.045, 0xd9cfb6, 0xe8e2d0, 6, 1);
}

// A banner of the sect: a pole, a cross-arm and a long blood-red cloth that
// the wind has pulled out to one side, frayed and stiff with frost.
function banner(m, height, flutter) {
  m.tube([0, -0.3, 0], [0, height, 0], 0.03, 0.022, 0x3f2f26, 6);
  m.tube([-0.05, height - 0.06, 0], [0.42, height - 0.06, 0], 0.016, 0.014, 0x3f2f26, 5);
  m.box(0.2, height - 0.035, 0, 0.44, 0.014, 0.035, snow);
  const rows = 7,
    cols = 3,
    grid = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const t = j / rows,
        u = i / cols;
      const wave = Math.sin(t * 5.2 + u * 2.1 + flutter) * 0.05 * t + 0.12 * t * t * flutter;
      grid.push([0.02 + u * 0.38 + 0.12 * t * t, height - 0.07 - t * height * 0.5, wave]);
    }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = grid[j * (cols + 1) + i],
        b = grid[j * (cols + 1) + i + 1],
        c = grid[(j + 1) * (cols + 1) + i + 1],
        e = grid[(j + 1) * (cols + 1) + i];
      const tone = (i + j) % 2 ? blood : m.mix(blood, bloodDark, 0.5);
      m.face([a, b, c, e], [m.rgb(blood), m.rgb(tone), m.rgb(bloodDark), m.rgb(tone)]);
    }
  // The torn foot of the cloth.
  for (let i = 0; i < cols; i++) {
    const a = grid[rows * (cols + 1) + i],
      b = grid[rows * (cols + 1) + i + 1];
    m.face([a, b, [(a[0] + b[0]) / 2, a[1] - 0.12 - 0.05 * i, a[2]]], bloodDark);
  }
}

// A wind shelter: planks leant on a frame against the north-west wind, snow
// banked up its back and a skin of ice on its edge.
function shelter(m) {
  for (const x of [-0.45, 0.45]) {
    m.tube([x, -0.2, 0.25], [x, 0.62, 0.0], 0.03, 0.025, log, 5);
    m.tube([x, -0.2, -0.32], [x, 0.62, 0.0], 0.03, 0.025, log, 5);
  }
  m.tube([-0.55, 0.62, 0], [0.55, 0.62, 0], 0.03, 0.03, log, 5);
  for (let i = 0; i < 6; i++) {
    const x = -0.45 + i * 0.18;
    m.frame(
      x,
      0.21,
      -0.17,
      0,
      1,
      () => m.box(0, 0, 0, 0.16, 0.86, 0.025, i % 2 ? plank : 0x5f4e40),
      0.66
    );
  }
  m.frame(0, 0.25, -0.23, 0, 1, () => m.box(0, 0, 0, 1.08, 0.8, 0.07, snow), 0.66);
  m.lathe(
    0,
    -0.02,
    -0.42,
    [
      [0, 0.5],
      [0.12, 0.38],
      [0.22, 0.0]
    ],
    snowShade,
    8
  );
  m.box(0, 0.0, 0.15, 0.5, 0.06, 0.34, 0x6a5a4a);
}

// A wayside shrine of the old road: a stone niche on a plinth with a little
// stone roof, a guttered lamp and offerings inside.
function shrine(m) {
  m.box(0, -0.2, 0, 0.5, 0.5, 0.44, stone);
  m.box(0, 0.08, 0, 0.56, 0.06, 0.5, 0x6b7378);
  m.box(0, 0.33, 0, 0.42, 0.44, 0.36, 0x737b80);
  m.box(0, 0.33, 0.17, 0.26, 0.3, 0.04, 0x1d2226);
  m.lathe(
    0,
    0.2,
    0.12,
    [
      [0, 0.04],
      [0.03, 0.05],
      [0.05, 0.02]
    ],
    0x8a7650,
    7
  );
  m.crystal(0, 0.25, 0.12, 0.012, 0.05, 0xf0a84c, 0xffeab0, 4);
  m.box(0, 0.58, 0, 0.6, 0.06, 0.52, 0x5f676c);
  m.box(0, 0.64, 0, 0.44, 0.08, 0.36, 0x687075);
  m.box(0, 0.69, 0, 0.62, 0.04, 0.54, snow);
  m.lathe(
    0,
    0.7,
    0,
    [
      [0, 0.24],
      [0.05, 0.16],
      [0.09, 0.0]
    ],
    snow,
    8
  );
  m.box(0, 0.12, 0.28, 0.3, 0.04, 0.08, snowShade);
  m.line(
    [
      [-0.2, 0.55, 0.19],
      [0, 0.5, 0.2],
      [0.2, 0.55, 0.19]
    ],
    0.006,
    0x8b2a22,
    3
  );
}

function camp3(T, surface) {
  const m = new Model(T, 39751);
  const place = (x, z, yaw, draw, sink = 0) => m.frame(x, surface(x, z) - sink, z, yaw, 1, draw);
  place(1.75, -10.75, -1.75, () => hut(m), 0.02);
  place(0.85, -9.15, 0, () => campfire(m));
  place(0.15, -9.6, 0.4, () => baggage(m));
  place(1.45, -8.75, 0.9, () => blade(m));
  place(0.05, -8.85, 1.2, () => bones(m));
  place(0.45, -10.55, -0.93, () => banner(m, 2.0, 0.9), 0.1);
  place(2.55, -10.0, -0.93, () => banner(m, 1.7, 0.6), 0.1);
  place(9.0, -3.0, 0.65, () => shelter(m));
  place(9.35, -2.25, -0.93, () => banner(m, 1.8, 1.1), 0.1);
  place(5.5, -8.0, 0.65, () => shelter(m));
  place(5.05, -7.55, 0.2, () => bones(m));
  place(-5.75, 6.4, 1.27, () => shrine(m), 0.05);
  return [m.finish('血刀門營與雪中旗', { occluder: true })];
}

export { camp3 };
