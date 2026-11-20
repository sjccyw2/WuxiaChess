// 聽雪棧 only: the faces of the playing shelf, its snow and its icicles.
// maze-scenery.js calls these from its map 3 branches; the drawing is done in
// each side's local frame (x along the edge, z pointing out, y up).

import { packTrail, pathDistance } from './landform-3.js';

// A cheap repeatable hash, 0 to 1.
function hash(a, b = 0, c = 0) {
  const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// Faces here are listed clockwise seen from outside; the kit wants them the
// other way round for its normals (and so for shadows), so flip them on the way in.
function face(m, points, col, brightness) {
  const each = Array.isArray(col) && Array.isArray(col[0]);
  m.face([...points].reverse(), each ? [...col].reverse() : col, brightness);
}

const granite = [0x4b5459, 0x5a6266, 0x666d6f, 0x535b61, 0x707578, 0x5f6466];
const joint = 0x2c3337;
const snow = 0xeef2f2;
const ice = [0xbfe0ea, 0xe3f3f6, 0x9cc5d6];

// One dressed or rough block standing proud of the wall plane. Its front is
// inset by a chamfer; the upper chamfer catches a dusting of snow.
function block(m, x0, x1, top, bottom, out, tone, rough, salt) {
  const c = Math.min(0.03, (x1 - x0) * 0.2, (top - bottom) * 0.2);
  // Rough blocks lean: the top sits further in or out than the foot.
  const lean = rough ? (hash(salt, 7) - 0.45) * 0.12 : 0;
  const zt = out + lean,
    zb = out - lean * 0.4;
  const j = (k) => (rough ? (hash(salt, k) - 0.5) * 0.05 : 0);
  const back = [
    [x0, top, 0],
    [x1, top, 0],
    [x1, bottom, 0],
    [x0, bottom, 0]
  ];
  const front = [
    [x0 + c + j(1), top - c, zt + j(2) * 0.5],
    [x1 - c + j(3), top - c, zt + j(4) * 0.5],
    [x1 - c + j(5), bottom + c, zb],
    [x0 + c + j(6), bottom + c, zb]
  ];
  const dusted = m.mix(tone, snow, rough ? 0.55 : 0.75),
    shade = m.mix(tone, joint, 0.35);
  face(m, [front[0], front[1], front[2], front[3]], tone, 0.92 + 0.12 * hash(salt, 9));
  face(m, [back[0], back[1], front[1], front[0]], dusted);
  face(m, [back[1], back[2], front[2], front[1]], m.mix(tone, shade, 0.4));
  face(m, [back[2], back[3], front[3], front[2]], shade);
  face(m, [back[3], back[0], front[0], front[3]], m.mix(tone, shade, 0.4));
}

// A cluster of icicles under the snow lip: thin, pale and longest in the middle.
function icicles(m, x, y, z, width, salt) {
  const n = 3 + Math.floor(hash(salt, 21) * 4);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1),
      u = x + (t - 0.5) * width + (hash(salt, i, 3) - 0.5) * 0.04;
    const long = (0.08 + 0.3 * Math.sin(Math.PI * t) * hash(salt, i, 4)) * (0.6 + hash(salt, 22));
    const r = 0.012 + 0.014 * hash(salt, i, 5),
      w = z + (hash(salt, i, 6) - 0.5) * 0.05;
    m.tube([u, y, w], [u + 0.006, y - long, w + 0.004], r, 0.0015, ice[i % 3], 5);
  }
}

// The cut face of the shelf. Dressed courses below the lip (the trail was hewn
// out of the mountain), then rough jointed granite that runs down into the cliff.
function hewnSide(m, cell, salt, depth) {
  const top = cell.kind === 'reeds' ? -0.136 : -0.055;
  // Dark joints behind the blocks.
  face(
    m,
    [
      [-0.5, top, 0.004],
      [0.5, top, 0.004],
      [0.5, -depth, 0.004],
      [-0.5, -depth, 0.004]
    ],
    joint
  );
  let y = top,
    course = 0;
  while (y > -depth + 0.05) {
    const rough = y < -0.8;
    const h = Math.min(
      y + depth,
      rough ? 0.45 + 0.5 * hash(salt, course, 1) : 0.24 + 0.2 * hash(salt, course, 1)
    );
    const bottom = y - h;
    // Stagger the vertical joints from course to course.
    const count = rough
      ? 1 + Math.floor(hash(salt, course, 2) * 2)
      : 2 + Math.floor(hash(salt, course, 2) * 2);
    const cuts = [-0.5];
    for (let k = 1; k < count; k++)
      cuts.push(-0.5 + (k + (hash(salt, course, k + 3) - 0.5) * 0.5) / count);
    cuts.push(0.5);
    for (let k = 0; k < count; k++) {
      const s = salt * 13 + course * 7 + k;
      const out = rough ? 0.03 + 0.13 * hash(s, 11) : 0.02 + 0.035 * hash(s, 11);
      const tone = granite[Math.floor(hash(s, 12) * granite.length)];
      // Darker and colder further down, where the gorge mist settles.
      const cold = m.mix(tone, 0x6d7e89, Math.min(0.45, -bottom / 7));
      block(
        m,
        cuts[k] + 0.007,
        cuts[k + 1] - 0.007,
        y - 0.007,
        bottom + 0.007,
        out,
        cold,
        rough,
        s
      );
    }
    y = bottom;
    course++;
  }
  if (cell.kind !== 'reeds' && hash(salt, 31) < 0.55)
    icicles(m, (hash(salt, 32) - 0.5) * 0.5, top - 0.13, 0.1, 0.28 + 0.2 * hash(salt, 33), salt);
}

// One flagstone with a bevelled rim, its top at y.
function flag(m, x0, z0, x1, z1, y, tone) {
  const c = 0.025,
    lo = -0.05;
  const ring = [
    [x0 + c, z0],
    [x1 - c, z0],
    [x1, z0 + c],
    [x1, z1 - c],
    [x1 - c, z1],
    [x0 + c, z1],
    [x0, z1 - c],
    [x0, z0 + c]
  ];
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const cap = ring.map(([u, v]) => [cx + (u - cx) * 0.96, y, cz + (v - cz) * 0.96]),
    rim = ring.map(([u, v]) => [u, y - 0.014, v]),
    foot = ring.map(([u, v]) => [u, lo, v]);
  face(m, cap, tone);
  const edge = m.mix(tone, 0x40484d, 0.3);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    face(m, [rim[i], rim[j], cap[j], cap[i]], m.mix(tone, snow, 0.25));
    face(m, [foot[i], foot[j], rim[j], rim[i]], edge);
  }
}

// How much snow lies at a point of the shelf, 0 to 1. The pattern is one field
// across the whole pass, so drifts run on from tile to tile.
function snowAt(x, z) {
  const n =
    0.5 * Math.sin(x * 2.3 + z * 1.1) +
    0.3 * Math.sin(-x * 1.3 + z * 3.1 + 1.7) +
    0.2 * Math.sin(x * 5.1 - z * 4.3);
  const worn = Math.max(0, 1 - pathDistance(x, z, packTrail) / 0.42);
  const t = Math.min(1, Math.max(0, (0.5 + 0.5 * n + 0.2 - worn * 0.85) / 0.22));
  return { cover: t * t * (3 - 2 * t), worn };
}

// A walkable tile on the pass: a dressed granite flag under wind-packed snow.
// Where the pack trail runs the snow is trodden grey and the stone shows through.
function snowTile(m, x, z) {
  const salt = Math.round(x * 7.3 + z * 13.1 + 100);
  const stone = [0x9fa6a8, 0x939a9d, 0xa8acab, 0x989ea0];
  const tone = stone[salt % stone.length];
  flag(m, x - 0.494, z - 0.494, x + 0.494, z + 0.494, 0.03, tone);
  const n = 8,
    half = 0.47,
    grid = [];
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      const u = x - half + (2 * half * i) / n,
        v = z - half + (2 * half * j) / n;
      const { cover, worn } = snowAt(u, v);
      const fresh = m.mix(0xdfe7ea, 0xf4f6f6, cover),
        trodden = m.mix(fresh, 0xa9b3b6, Math.min(1, worn * 1.3));
      const ground = m.mix(tone, 0x7b8487, 0.25 + 0.25 * Math.sin(u * 9.1 + v * 6.7));
      grid.push({
        p: [u, 0.032 + 0.022 * cover * (1 - worn * 0.6), v],
        c: m.mix(ground, trodden, Math.min(1, cover * 1.15))
      });
    }
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const a = grid[j * (n + 1) + i],
        b = grid[j * (n + 1) + i + 1],
        c = grid[(j + 1) * (n + 1) + i + 1],
        d = grid[(j + 1) * (n + 1) + i];
      m.face([a.p, d.p, c.p, b.p], [a.c, d.c, c.c, b.c]);
    }
  // Boot prints pressed into the trodden snow.
  if (snowAt(x, z).worn > 0.45)
    for (let i = 0; i < 4; i++) {
      const u = x + (hash(salt, i, 11) - 0.5) * 0.6,
        v = z + (hash(salt, i, 12) - 0.5) * 0.6,
        a = hash(salt, 13) * Math.PI;
      const ca = Math.cos(a) * 0.05,
        sa = Math.sin(a) * 0.05,
        y = 0.04;
      face(
        m,
        [
          [u + ca, y, v + sa],
          [u - sa * 0.4, y, v + ca * 0.4],
          [u - ca * 0.7, y, v - sa * 0.7],
          [u + sa * 0.4, y, v - ca * 0.4]
        ],
        0x8a969a
      );
    }
}

// A tile of the meltwater channel: dark running water in the middle, and shelves
// of ice grown out from both banks with a frosted, cracked upper face.
function iceTile(m, x, z) {
  const salt = Math.round(x * 5.1 + z * 17.3 + 300);
  const water = [0x5f8fa3, 0x78a7b8];
  m.face(
    [
      [x - 0.502, -0.03, z - 0.502],
      [x - 0.502, -0.03, z + 0.502],
      [x + 0.502, -0.03, z + 0.502],
      [x + 0.502, -0.03, z - 0.502]
    ],
    [m.rgb(water[0]), m.rgb(water[1]), m.rgb(water[0]), m.rgb(water[1])]
  );
  // Slow ripples on the open lead.
  for (let i = 0; i < 3; i++) {
    const v = z - 0.35 + i * 0.33 + (hash(salt, i, 1) - 0.5) * 0.1;
    m.line(
      [
        [x - 0.14, -0.027, v],
        [x, -0.027, v + 0.03],
        [x + 0.13, -0.027, v - 0.01]
      ],
      0.006,
      0x9cc4d2,
      4
    );
  }
  for (const side of [-1, 1]) {
    const edge = [],
      n = 6;
    for (let i = 0; i <= n; i++) {
      const v = z - 0.502 + (1.004 * i) / n;
      // The shelves meet their neighbours at the same reach across tile seams.
      const reach = 0.2 + 0.11 * Math.sin(v * 4.1 + side * 1.3) + 0.05 * Math.sin(v * 11.7 + side);
      edge.push([x + side * (0.5 - reach), v]);
    }
    const y = -0.006,
      lip = -0.034;
    for (let i = 0; i < n; i++) {
      const [a, va] = edge[i],
        [b, vb] = edge[i + 1];
      const pts = [
        [x + side * 0.502, y, va],
        [a, y, va],
        [b, y, vb],
        [x + side * 0.502, y, vb]
      ];
      const tone = m.mix(0xd7ebf0, 0xeaf5f6, hash(salt, side, i));
      m.face(side > 0 ? pts : [...pts].reverse(), [
        m.rgb(0xeef5f5),
        m.rgb(tone),
        m.rgb(tone),
        m.rgb(0xeef5f5)
      ]);
      // The broken edge of the shelf, glassy blue where it meets the water.
      m.face(
        side > 0
          ? [
              [a, y, va],
              [a, lip, va],
              [b, lip, vb],
              [b, y, vb]
            ]
          : [
              [b, y, vb],
              [b, lip, vb],
              [a, lip, va],
              [a, y, va]
            ],
        0x9cc8d6
      );
    }
    // Cracks in the ice.
    const v0 = z + (hash(salt, side, 7) - 0.5) * 0.6;
    m.line(
      [
        [x + side * 0.49, y + 0.002, v0],
        [x + side * 0.4, y + 0.002, v0 + 0.06],
        [x + side * 0.33, y + 0.002, v0 + 0.02]
      ],
      0.004,
      0x9ab7c2,
      3
    );
  }
}

export { hewnSide, icicles, snowTile, iceTile };
