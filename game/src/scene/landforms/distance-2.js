// The far marsh around 蘆花汀: reed islands that thin out over open water, the
// low wooded bank on the far side of the river with its village and pagoda,
// and a few sails working the channels. Everything here sits in the fog, so
// it is drawn with as few faces as will hold a silhouette.
import { circle } from '../scenery-kit.js';
import { wind } from './reeds-2.js';

const fringe = [0x7d8250, 0x8a8a58, 0x6f7a4c],
  tassel = [0xc9bca0, 0xbcab90, 0xd6cbb2];

// A low island of silt crowned with reeds, as single blades.
function reedIsland(m, x, z, rx, rz, turn, level, blades) {
  const r = m.rng,
    n = 12,
    ring = [];
  for (let j = 0; j < n; j++) {
    const a = (j * circle) / n,
      k = r.range(0.8, 1.15);
    const u = Math.cos(a) * rx * k * 0.85,
      v = Math.sin(a) * rz * k * 0.85;
    ring.push([
      x + u * Math.cos(turn) - v * Math.sin(turn),
      level + 0.008,
      z + u * Math.sin(turn) + v * Math.cos(turn)
    ]);
  }
  for (let j = 0; j < n; j++)
    m.face(
      [[x, level + 0.02, z], ring[(j + 1) % n], ring[j]],
      [m.rgb(0x5d6448), m.rgb(0x566048), m.rgb(0x566048)]
    );
  for (let i = 0; i < blades; i++) {
    const a = r.range(0, circle),
      d = Math.sqrt(r.next()) * 0.92;
    const u = Math.cos(a) * rx * d,
      v = Math.sin(a) * rz * d;
    const px = x + u * Math.cos(turn) - v * Math.sin(turn),
      pz = z + u * Math.sin(turn) + v * Math.cos(turn);
    const h = r.range(0.55, 1.15) * (1 - 0.5 * d * d),
      w = r.range(0.035, 0.06),
      t = r.range(0, circle);
    const lean = r.range(0.05, 0.2);
    const top = [px + wind[0] * lean, level + h, pz + wind[1] * lean];
    m.face(
      [
        [px - Math.cos(t) * w, level, pz - Math.sin(t) * w],
        [px + Math.cos(t) * w, level, pz + Math.sin(t) * w],
        top
      ],
      [m.rgb(r.pick(fringe)), m.rgb(r.pick(fringe)), m.mix(r.pick(fringe), 0xb9ad80, 0.6)]
    );
    if (r.next() < 0.55) {
      const p = r.pick(tassel);
      m.face(
        [
          [top[0] + Math.cos(t) * w * 0.7, top[1] - 0.05, top[2] + Math.sin(t) * w * 0.7],
          [top[0] - Math.cos(t) * w * 0.7, top[1] - 0.05, top[2] - Math.sin(t) * w * 0.7],
          [top[0] + wind[0] * 0.3, top[1] - 0.2, top[2] + wind[1] * 0.3]
        ],
        p
      );
    }
  }
}

// A willow or a clump of alders on the far bank: a short trunk under a
// rounded crown that leans with the wind.
function willow(m, x, y, z, s) {
  const r = m.rng;
  m.tube([x, y - 0.2, z], [x + 0.08 * s, y + 0.9 * s, z], 0.1 * s, 0.06 * s, 0x5d5444, 5);
  const tone = r.pick([0x6f7d52, 0x7a8758, 0x66744e]);
  m.rock(
    x + wind[0] * 0.15 * s,
    y + 0.55 * s,
    z + wind[1] * 0.15 * s,
    0.62 * s,
    1.15 * s,
    0.55 * s,
    m.mix(tone, 0x4f5a40, 0.4),
    m.mix(tone, 0xa2a874, 0.35),
    7
  );
  if (r.next() < 0.6)
    m.rock(
      x - 0.4 * s,
      y + 0.3 * s,
      z + 0.2 * s,
      0.4 * s,
      0.75 * s,
      0.38 * s,
      m.mix(tone, 0x4f5a40, 0.4),
      m.mix(tone, 0x9aa070, 0.3),
      6
    );
}

// A cottage of the far village: white walls under a dark hipped roof.
function cottage(m, x, y, z, yaw, s) {
  m.frame(x, y, z, yaw, s, () => {
    m.box(0, 0.45, 0, 1.6, 0.9, 0.9, 0xc9c4b2);
    const e = [
      [-1.0, 0.88, -0.65],
      [1.0, 0.88, -0.65],
      [1.0, 0.88, 0.65],
      [-1.0, 0.88, 0.65]
    ];
    const ridge = [
      [-0.5, 1.45, 0],
      [0.5, 1.45, 0]
    ];
    const roof = 0x58605f;
    m.face([e[0], ridge[0], ridge[1], e[1]], roof);
    m.face([e[2], ridge[1], ridge[0], e[3]], m.mix(roof, 0x7f8784, 0.4));
    m.face([e[1], ridge[1], e[2]], roof);
    m.face([e[3], ridge[0], e[0]], roof);
    m.box(0, 0.32, 0.46, 0.3, 0.55, 0.02, 0x4f4a42);
  });
}

// A seven-storey brick pagoda on the far rise.
function pagoda(m, x, y, z, s) {
  m.frame(x, y, z, 0.3, s, () => {
    let h = 0;
    for (let k = 0; k < 7; k++) {
      const w = 0.62 - k * 0.055,
        tall = 0.62 - k * 0.03;
      m.lathe(
        0,
        h,
        0,
        [
          [0, w],
          [tall, w * 0.94]
        ],
        0xbfb3a0,
        8
      );
      m.lathe(
        0,
        h + tall,
        0,
        [
          [0, w * 1.55],
          [0.07, w * 1.35],
          [0.16, w * 0.75]
        ],
        0x5c5d58,
        8
      );
      h += tall + 0.12;
    }
    m.tube([0, h, 0], [0, h + 0.6, 0], 0.05, 0.01, 0x6c6250, 5);
  });
}

// A working boat far off: a slim hull under a battened lug sail.
function farSail(m, x, z, yaw, level, s) {
  m.frame(x, level, z, yaw, s, () => {
    m.face(
      [
        [0, 0.06, -1.1],
        [0.3, 0.12, -0.3],
        [0.3, 0.12, 0.6],
        [0, 0.18, 1.0],
        [-0.3, 0.12, 0.6],
        [-0.3, 0.12, -0.3]
      ],
      0x4e4538
    );
    m.tube([0, 0.1, 0.1], [0, 2.3, 0.1], 0.04, 0.025, 0x5b4d3b, 4);
    const sail = [
      [0.03, 0.45, -0.5],
      [0.03, 0.4, 0.75],
      [0.03, 2.05, 0.45],
      [0.03, 2.2, -0.65]
    ];
    m.face(sail, [m.rgb(0xa58a62), m.rgb(0x977c56), m.rgb(0xb79c72), m.rgb(0xb09670)]);
    for (let j = 1; j < 5; j++) {
      const t = j / 5;
      const a = sail[0].map((v, i) => v + (sail[3][i] - v) * t),
        b = sail[1].map((v, i) => v + (sail[2][i] - v) * t);
      m.line(
        [
          [a[0] + 0.01, a[1], a[2]],
          [b[0] + 0.01, b[1], b[2]]
        ],
        0.015,
        0x5d4c38,
        3
      );
    }
  });
}

// The far bank: a long low shore, its willows and roofs, rising to a ridge.
function farBank(m, level) {
  const r = m.rng;
  for (const [from, to, rad, height, tone, top] of [
    [2.3, 5.3, 29, 0.9, 0x7b8a6c, 0x8e9c78],
    [5.1, 8.7, 31, 1.3, 0x7f8d70, 0x92a07c],
    [-1.6, 2.5, 33, 1.6, 0x83917a, 0x95a385],
    [2.7, 4.6, 40, 4.2, 0x8d9d93, 0x9fb0a6],
    [4.9, 7.2, 42, 3.4, 0x8a9a8c, 0x9aab9b],
    [0.1, 2.2, 44, 3.8, 0x8f9e98, 0xa1b0aa]
  ]) {
    const steps = 22;
    let last = null;
    for (let i = 0; i <= steps; i++) {
      const a = from + ((to - from) * i) / steps;
      const swell = Math.sin((i / steps) * Math.PI);
      const h = height * (0.35 + 0.65 * swell) * r.range(0.8, 1.15);
      const ca = Math.cos(a),
        sa = Math.sin(a);
      const foot = [ca * (rad - 2.5), level - 0.1, sa * (rad - 2.5)],
        crest = [ca * (rad + r.range(-0.5, 0.5)), level + h, sa * (rad + r.range(-0.5, 0.5))],
        back = [ca * (rad + 4), level + h * 0.6, sa * (rad + 4)];
      if (last) {
        m.face([last[0], foot, crest, last[1]], [m.rgb(tone), m.rgb(tone), m.rgb(top), m.rgb(top)]);
        m.face([last[1], crest, back, last[2]], top);
      }
      last = [foot, crest, back];
    }
  }
  // Willows and cottages along the nearest bank, which faces the opening view.
  for (let i = 0; i < 44; i++) {
    const a = r.range(2.4, 8.5),
      rad = (a > 5.2 ? 28.6 : 26.6) + r.range(0, 1.2);
    willow(m, Math.cos(a) * rad, level + 0.15, Math.sin(a) * rad, r.range(1.0, 1.7));
  }
  for (let i = 0; i < 7; i++) {
    const a = 3.35 + i * 0.09 + r.range(-0.02, 0.02),
      rad = r.range(27.6, 28.4);
    cottage(
      m,
      Math.cos(a) * rad,
      level + 0.2,
      Math.sin(a) * rad,
      -a + Math.PI / 2,
      r.range(0.9, 1.2)
    );
  }
  pagoda(m, Math.cos(3.9) * 38, level + 2.6, Math.sin(3.9) * 38, 1.35);
}

function farMarsh(m, style) {
  const r = m.rng,
    level = style.level;
  // Reed islands, thicker toward the board and scattering over open water.
  for (let i = 0; i < 46; i++) {
    const a = r.range(0, circle),
      rad = r.range(15, 25);
    const size = r.range(0.7, 1.9);
    reedIsland(
      m,
      Math.cos(a) * rad,
      Math.sin(a) * rad,
      size * r.range(1.3, 2.2),
      size,
      r.range(0, Math.PI),
      level,
      Math.round(size * size * 95)
    );
  }
  for (const [a, rad, yaw, s] of [
    [3.55, 21, 0.4, 1.0],
    [4.45, 25, -0.9, 1.2],
    [2.6, 19, 2.1, 0.9],
    [0.9, 23, 1.2, 1.0]
  ])
    farSail(m, Math.cos(a) * rad, Math.sin(a) * rad, yaw, level, s);
  farBank(m, level);
}

export { farMarsh };
