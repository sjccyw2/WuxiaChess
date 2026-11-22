import { Model, circle } from '../scenery-kit.js';
import { paving, caveWalls, caveFeatures, caveFloor, lightField, tileProps } from './cave-7.js';
import { wallDressing } from './wall-7.js';
import { lakeDressing } from './lake-7.js';
import { tombDressing } from './tomb-7.js';

// A shallow spring has dissolved a neck through the floor of two chambers.
// The same limestone bed also carries the west tomb and the four wall groups.
const shoulders = [
  [-8.35, 2.85, 2.65, 2.96, 0.04],
  [-7.55, -2.98, 2.25, 3.15, 0.06],
  [-5.74, -7.6, 3.24, 1.75, 0.09],
  [4.65, -7.67, 3.2, 1.76, 0.08],
  [8.02, -3.82, 2.1, 3.05, 0.11],
  [-0.27, 6.98, 1.22, 1.28, 0.03],
  [-7.62, -6.49, 2.44, 2.42, -0.24],
  [6.97, -6.6, 2.48, 2.07, -0.2],
  [-6.11, 2.68, 2.38, 1.18, -0.06],
  [-1.09, -7.51, 1.6, 1.44, 0.03],
  [0.66, -7.6, 1.65, 1.42, 0.01],
  [4.2, 6.06, 2.28, 1.54, -0.08],
  [5.68, 5.27, 1.14, 2.23, -0.22]
];

const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
function smooth(a, b, v) {
  const q = clamp((v - a) / (b - a), 0, 1);
  return q * q * (3 - 2 * q);
}
function streamCenter(z) {
  return (
    -0.5 +
    0.052 * Math.sin(z * 1.64) +
    0.02 * Math.sin(z * 3.12) +
    2.58 * smooth(5.3, 8.7, z) -
    0.22 * smooth(6.8, 9.1, -z)
  );
}
const bankWidth = (z) => 0.368 + 0.057 * Math.sin(z * 1.43 + 0.39);
const waterLevel = (z) => -0.085 - (z + 8.2) * 0.0016 - 1.02 * smooth(6.5, 9.2, z);

function cavern(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const strips = [];
  layout.mask.forEach((row, j) => {
    for (const run of row.matchAll(/#+/g))
      strips.push([run.index - cx - 0.5, run.index - cx - 0.5 + run[0].length, j - cz]);
  });
  function margin(x, z) {
    let d = 20;
    for (const [left, right, middle] of strips) {
      d = Math.min(
        d,
        Math.hypot(Math.max(0, left - x, x - right), Math.max(0, Math.abs(middle - z) - 0.5))
      );
    }
    return d;
  }
  function terrain(x, z) {
    const d = margin(x, z);
    const bedding = Math.sin(1.26 * x + 0.58 * z) + 0.45 * Math.sin(2.61 * z - 0.76 * x);
    const bevel = 0.32 + 0.12 * Math.sin(x * 1.76 - z * 1.09);
    // The polished walkway sits below the picking plane, with a weathered
    // lip outside it. The two lateral coves descend below the cave lake.
    let y =
      0.061 +
      0.004 * bedding -
      0.4 * smooth(0.03, bevel + 0.62, d) -
      1.77 * smooth(bevel + 0.26, bevel + 2.12, d);
    for (const [px, pz, rx, rz, top] of shoulders) {
      const r = Math.hypot((x - px) / rx, (z - pz) / rz);
      const edge = r + 0.065 * bedding;
      const wall = top + 0.055 * bedding - 2.15 * smooth(0.68, 1.51, edge);
      y = Math.max(y, wall);
    }
    const dry = 0.06 + 0.006 * Math.sin(x * 0.63 - z * 0.38);
    y = Math.min(y, dry + smooth(0.01, 0.5, d) * 0.42);
    const gx = Math.abs(x - streamCenter(z));
    if (z > -9.35 && z < 10.2 && gx < 1.64) {
      const head = smooth(4.9, 6.1, Math.abs(z));
      const braid = 0.12 * Math.sin(2.3 * z + x * 1.5);
      const skirt =
        waterLevel(z) +
        0.16 -
        1.82 * smooth(0.56, 1.59, gx + braid) -
        0.82 * smooth(9.05, 10.2, z) -
        0.91 * smooth(8.48, 9.35, -z);
      y = Math.max(y, y + (skirt - y) * head);
    }
    if (z > -10.0 && z < 10.6 && gx < 0.89) {
      const bank = bankWidth(z);
      const bottom = waterLevel(z) - 0.16 - 0.04 * Math.cos(z * 1.67);
      y = Math.min(y, bottom + (y - bottom) * smooth(bank - 0.03, bank + 0.17, gx));
    }
    return Math.max(-2.58 + 0.117 * bedding, y);
  }
  return { terrain, margin };
}
function coordinates(from, to, extra = []) {
  const a = [from, to, ...extra];
  let v = from;
  while (v < to) {
    v += Math.abs(v) < 6.35 ? 0.39 : Math.abs(v) < 10.0 ? 0.53 : 0.86;
    if (v < to) a.push(v);
  }
  return a.sort((u, v) => u - v).filter((v, i, s) => i === 0 || v - s[i - 1] > 0.035);
}
function limestone(T, ground, lit) {
  const m = new Model(T, 170721);
  const xs = coordinates(
    -15.1,
    15.1,
    [-1.045, -0.948, -0.85, -0.7, -0.5, -0.25, -0.15, -0.052, 0.052]
  );
  const zs = coordinates(-14.1, 14.1);
  const points = [],
    colors = [],
    triangles = [];
  for (let j = 0; j < zs.length; j++) {
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i],
        z = zs[j],
        y = ground.terrain(x, z);
      const d = ground.margin(x, z);
      const damp = Math.max(
        1 - smooth(0.34, 1.5, Math.abs(x - streamCenter(z))),
        smooth(0.1, 1.9, d)
      );
      const fault = x * 0.82 + z * 1.0 + 0.34 * Math.sin(z * 1.14) + 0.08 * Math.sin(x * 2.8);
      const folia = 0.5 + 0.5 * Math.sin(fault * 2.14);
      const warm = 0.5 + 0.5 * Math.sin(x * 0.47 - z * 1.01 + 0.32 * Math.sin(x * 1.23));
      let stone = m.mix(0x687b72, 0xa8b8a6, 0.34 + 0.29 * folia + 0.18 * warm);
      stone = m.mix(stone, 0x41665f, 0.31 * damp + 0.13 * (1 - folia));
      if (y < -0.47) stone = m.mix(stone, 0x364d53, smooth(0.46, 1.88, -y) * 0.76);
      // Away from the walkway the rock sinks into the cave's gloom, so the
      // paved floor reads as the lit heart of the chamber.
      const grain =
        0.5 + 0.5 * Math.sin(x * 4.1 + Math.sin(z * 2.3) * 2) * Math.sin(z * 3.7 - x * 1.3);
      stone = m.mix(stone, 0x2a3d40, 0.22 * grain);
      stone = m.mix(stone, 0x1c2c30, 0.62 * smooth(0.12, 2.4, d));
      points.push(x, y, z);
      colors.push(...lit(x, y, z, stone));
      if (i && j) {
        const d0 = j * xs.length + i,
          a = d0 - xs.length - 1,
          b = a + 1,
          c = d0 - 1;
        if ((i + j) % 2) triangles.push(a, c, d0, a, d0, b);
        else triangles.push(a, c, b, c, d0, b);
      }
    }
  }
  const geom = new T.BufferGeometry();
  geom.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  geom.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geom.setIndex(triangles);
  geom.computeVertexNormals();
  geom.computeBoundingSphere();
  const mesh = new T.Mesh(
    geom,
    new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.84,
      metalness: 0.05,
      side: T.DoubleSide
    })
  );
  mesh.name = '雙窟連續灰岩與泉床';
  mesh.receiveShadow = true;
  return mesh;
}

// Calcite forms irregular low terrace dams. Each wall is built from the
// lower terrace upward, so the thin crust never floats over its pool.
function gour(m, x, z, rx, rz, surface, bottom, yaw) {
  function point(i, scale, h) {
    const a = (circle * i) / 26;
    const n = 1 + 0.065 * Math.sin(3 * a + 0.8) + 0.045 * Math.cos(5 * a - 0.5);
    const X = rx * scale * n * Math.cos(a),
      Z = rz * scale * n * Math.sin(a);
    return [
      x + X * Math.cos(yaw) - Z * Math.sin(yaw),
      h,
      z + X * Math.sin(yaw) + Z * Math.cos(yaw)
    ];
  }
  for (let i = 0; i < 26; i++) {
    const j = (i + 1) % 26;
    const brim = (k) => surface + 0.041 + 0.021 * Math.sin((k * circle * 3) / 26);
    m.face(
      [
        point(i, 1.17, bottom),
        point(j, 1.17, bottom),
        point(j, 1.0, brim(j)),
        point(i, 1.0, brim(i))
      ],
      m.mix(0x79988a, 0xb5c5ad, 0.39 + 0.22 * Math.sin(i / 3))
    );
    m.face(
      [
        point(i, 1.0, brim(i)),
        point(j, 1.0, brim(j)),
        point(j, 0.89, surface + 0.017),
        point(i, 0.89, surface + 0.017)
      ],
      0xc5d1b7
    );
    m.face(
      [
        point(i, 0.89, surface + 0.017),
        point(j, 0.89, surface + 0.017),
        point(j, 0.85, surface),
        point(i, 0.85, surface)
      ],
      0x91b3a1
    );
    m.face(
      [[x, surface - 0.006, z], point(j, 0.86, surface), point(i, 0.86, surface)],
      m.mix(0x408982, 0x769e89, 0.24 + 0.17 * Math.sin(i / 5))
    );
  }
}
function stoneSpan(m, layer, z) {
  for (const side of [-1, 1]) {
    const x = -0.5 + 0.56 * side;
    // Rock cuttings key the shoulders of the beam into each bank. Both
    // coursed feet reach below the actual bed instead of hanging off the deck.
    m.box(x, -0.231, z, 0.29, 0.548, 0.82, 0x637772);
    m.box(x, -0.047, z, 0.31, 0.115, 0.89, 0x839588);
    m.box(x, 0.019, z, 0.31, 0.045, 0.92, 0x9fac99);
    const hint = x + side * 0.41;
    const base = layer.terrain(hint, z);
    m.box(hint, base + 0.003, z, 0.37, 0.013, 0.72, 0x8e9c88);
  }
  for (const v of [-0.27, 0.27]) m.box(-0.5, -0.036, z + v, 1.17, 0.111, 0.128, 0x627d73);
  for (const zEdge of [-0.399, 0.399]) m.box(-0.5, 0.026, z + zEdge, 1.16, 0.061, 0.071, 0x768c79);
}
function spring(m) {
  const rows = [];
  for (let i = 0; i <= 94; i++) {
    const z = -8.62 + i * 0.19,
      x = streamCenter(z),
      w = bankWidth(z) + 0.08;
    const y = waterLevel(z);
    const points = [-1, -0.51, 0, 0.51, 1].map((k, j) => {
      const ribbon = j === 0 || j === 4 ? 0 : 0.07 * Math.sin(i * 0.37 + j * 2.26);
      return [x + (k + ribbon) * w, y + 0.0015 * Math.sin(i * 0.57 + k), z];
    });
    rows.push(points);
    if (i === 0) continue;
    const past = rows[i - 1];
    for (let k = 0; k < 4; k++) {
      let shade = m.mix(
        0x386665,
        0x729e90,
        (k === 0 || k === 3 ? 0.5 : 0.25) + 0.12 * Math.sin(i * 0.43 + k)
      );
      shade = m.mix(shade, 0x385b63, smooth(7.3, 9.1, z) * 0.87);
      m.face([past[k], points[k], points[k + 1], past[k + 1]], shade);
    }
    if (i % 4 === 0) {
      const off = Math.sin(i * 2.7) * 0.11,
        r = (i % 3) * 0.023 + 0.073;
      m.face(
        [
          [x + off - r, y + 0.005, z],
          [x + off, y + 0.005, z - 0.013],
          [x + off + r * 0.7, y + 0.005, z + 0.008],
          [x + off + 0.013, y + 0.005, z + 0.003]
        ],
        0x89b3a5
      );
    }
  }
}
function sourceArch(m, ground) {
  // The cross-section is thicker where the vault bears on either side of
  // the spring mouth. Open front and rear let the water come through.
  const cx = -0.63,
    cz = -7.51;
  function arch(i, outer, back) {
    const a = (Math.PI * i) / 16,
      f = 0.045 * Math.sin(3 * a + 0.6) + 0.017 * Math.sin(8 * a - 0.2);
    const x = cx + (outer ? 1.96 : 0.84) * (1 + f) * Math.cos(a);
    const bottom = ground.terrain(x, cz);
    const h = (outer ? 2.11 : 0.92) * (1 + f) * Math.sin(a);
    return [
      x,
      bottom - 0.12 + h,
      cz + (back ? -0.59 : 0.53) + 0.075 * Math.cos(4 * a) + (outer ? -0.05 : 0.1)
    ];
  }
  for (let i = 0; i < 16; i++) {
    const k = i + 1,
      stone = m.mix(0x536b69, 0x8d9d8c, 0.2 + 0.4 * Math.sin(i * 0.74) ** 2);
    m.face(
      [arch(i, true, false), arch(k, true, false), arch(k, false, false), arch(i, false, false)],
      stone
    );
    m.face(
      [arch(i, true, true), arch(k, true, true), arch(k, true, false), arch(i, true, false)],
      m.mix(stone, 0xa4b0a2, 0.24)
    );
    m.face(
      [arch(i, true, true), arch(i, false, true), arch(k, false, true), arch(k, true, true)],
      stone
    );
    m.face(
      [arch(i, false, false), arch(k, false, false), arch(k, false, true), arch(i, false, true)],
      m.mix(stone, 0x36494b, 0.36)
    );
  }
  for (const side of [-1, 1]) {
    const x = cx + side * 1.35;
    m.rock(x, ground.terrain(x, cz) - 0.13, cz, 0.81, 0.96, 0.85, 0x596e6d, 0x859686);
  }
  for (let i = 3; i <= 13; i += 2) {
    const toe = arch(i, false, false),
      rear = arch(i, false, true);
    const z = 0.71 * toe[2] + 0.29 * rear[2],
      h = 0.11 + 0.16 * Math.abs(Math.sin(i));
    m.tube(
      [toe[0], toe[1] + 0.063, z],
      [toe[0] + 0.018, toe[1] - h, z + 0.025],
      0.077,
      0.01,
      0xa0b7a8,
      6
    );
  }
  // Bands of flowstone follow the arch face and turn down at its feet.
  for (const offset of [0.29, 0.47, 0.76]) {
    let prev;
    for (let i = 1; i <= 15; i++) {
      const lo = arch(i, false, false),
        hi = arch(i, true, false);
      const at = (v) => lo.map((p, k) => p + (hi[k] - p) * v + (k === 2 ? 0.009 : 0));
      const t = offset + 0.035 * Math.sin(1.4 * i);
      const curr = [at(t), at(t + 0.017 + 0.008 * Math.sin(i))];
      if (prev) m.face([prev[0], curr[0], curr[1], prev[1]], offset < 0.35 ? 0x93aaa0 : 0x76978a);
      prev = curr;
    }
  }
}
function limestoneRib(m, ground, a, b, h, w, n) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    len = Math.hypot(dx, dz),
    nx = -dz / len,
    nz = dx / len;
  let old;
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      end = Math.max(0, Math.sin(Math.PI * t)) ** 0.53;
    const cx = a[0] + dx * t + nx * (0.19 * Math.sin(t * 8.7)),
      cz = a[1] + dz * t + nz * (0.19 * Math.sin(t * 8.7));
    const span = w * (0.55 + end * (0.34 + 0.14 * Math.sin(i * 0.93 + 2.1)));
    const height = h * (0.27 + 0.73 * end) * (0.92 + 0.13 * Math.sin(i * 1.34));
    const base = ground.terrain(cx, cz);
    const section = [
      [-1, -0.16],
      [-0.7, 0.29],
      [-0.41, 0.59],
      [-0.23, 0.64],
      [-0.17, 0.88],
      [0.14, 1],
      [0.41, 0.75],
      [0.61, 0.46],
      [1, -0.16]
    ];
    const row = section.map(([k, v]) => {
      const x = cx + nx * k * span,
        z = cz + nz * k * span;
      return [x, v < 0 ? Math.min(base, ground.terrain(x, z)) - 0.13 : base + height * v, z];
    });
    if (old)
      for (let j = 1; j < row.length; j++) {
        const tint = [
          0x56706d, 0x6a8179, 0x92a595, 0xa7b8a0, 0x617c76, 0x9aa997, 0x759086, 0x536968
        ][j - 1];
        m.face(
          [old[j - 1], row[j - 1], row[j], old[j]],
          m.mix(tint, 0x63766f, 0.1 + 0.16 * Math.sin(i * 0.82) ** 2)
        );
      }
    if (i === 0 || i === n) m.face(row, 0x627c74);
    old = row;
  }
}
function wornPaths(m, ground) {
  // Tool-polished footholds lead out of the west gate at the old staircase.
  for (let k = 0; k < 7; k++) {
    const x = -7.12 + k * 0.23,
      z = 2.75 - (k / 6) * 0.22;
    const y = ground.terrain(x, z);
    m.frame(x, 0, z, 0.07 + Math.sin(k) * 0.025, 1, () => {
      m.box(0, y - 0.09, 0, 0.3, 0.215, 0.91 - 0.08 * Math.cos(k), 0x82908b);
      m.box(-0.12, y + 0.02, 0, 0.018, 0.004, 0.78, 0xa6b1a0);
    });
  }
  // The care station by the medicinal spring is outside the deployment row.
  const x = 4.45,
    z = 6.36,
    b = ground.terrain(x, z);
  m.rock(x, b - 0.1, z, 0.42, 0.26, 0.26, 0x7a8f85, 0xb3b6a1, 8);
  const v = b + 0.08;
  m.lathe(
    x - 0.06,
    v,
    z,
    [
      [0, 0.085],
      [0.045, 0.12],
      [0.19, 0.1],
      [0.22, 0.067],
      [0.25, 0.079]
    ],
    0xb3a07a,
    10
  );
  m.lathe(
    x + 0.13,
    v,
    z + 0.05,
    [
      [0, 0.057],
      [0.027, 0.085],
      [0.057, 0.094]
    ],
    0x8f725d,
    10
  );
  m.tube([x + 0.09, v + 0.073, z + 0.2], [x + 0.23, v + 0.08, z - 0.05], 0.016, 0.019, 0x806b54, 6);
  const lx = 3.98,
    lz = 6.73,
    base = ground.terrain(lx, lz) - 0.035;
  m.rock(lx, base - 0.035, lz, 0.2, 0.13, 0.19, 0x667975, 0xa0a99b);
  m.lathe(
    lx,
    base + 0.071,
    lz,
    [
      [0, 0.071],
      [0.065, 0.073],
      [0.083, 0.143],
      [0.145, 0.152]
    ],
    0x9a865e,
    10
  );
  // The flame goes with the warm lamps of caveFeatures, so that this group's
  // glow stays the jade of the outcrops.
  return [lx, base + 0.202, lz];
}
function terrace(m, ground) {
  const basins = [
    [5.42, 4.54, 0.57, 0.37, 0.04, -0.38, 0.64],
    [5.82, 5.1, 0.71, 0.43, -0.083, -0.62, 0.82],
    [6.18, 5.96, 0.91, 0.51, -0.26, -0.93, 1.1],
    [6.45, 7.04, 1.02, 0.57, -0.62, -1.53, 1.31]
  ];
  for (const [x, z, rx, rz, top, base, yaw] of basins)
    gour(m, x, z, rx, rz, top, Math.min(base, ground.terrain(x, z) - 0.09), yaw);
  // A thick white lip on the downhill edge of each pool feeds the next.
  for (let i = 0; i < basins.length - 1; i++) {
    const a = basins[i],
      b = basins[i + 1],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz);
    const x = a[0] + dx * 0.54,
      z = a[1] + dz * 0.54,
      nx = (-dz / len) * 0.041,
      nz = (dx / len) * 0.041;
    m.face(
      [
        [x - nx, a[4] + 0.033, z - nz],
        [x + nx, a[4] + 0.033, z + nz],
        [x + dx * 0.13 + nx, b[4] + 0.006, z + dz * 0.13 + nz],
        [x + dx * 0.13 - nx, b[4] + 0.006, z + dz * 0.13 - nz]
      ],
      0x9ebfb0
    );
  }
}
function polishedWall(m, ground) {
  const x = 1.68,
    z = -6.61,
    base = ground.terrain(x, z) - 0.095;
  m.frame(x, base, z, -0.16, 1, () => {
    m.rock(-0.03, -0.1, -0.19, 1.18, 1.4, 0.5, 0x536e6e, 0x8fa297, 8);
    for (const side of [-1, 1]) {
      m.frame(side * 0.43, 0, 0.16, side * 0.09, 1, () => {
        const border = [
          [-0.47, -0.04],
          [-0.48, 0.68],
          [-0.34, 1.13],
          [0.17, 1.28],
          [0.42, 1.06],
          [0.45, 0.24],
          [0.35, -0.04]
        ];
        const front = border.map(([u, v]) => [u, v, 0.12]);
        const polished = border.map(([u, v]) => [u * 0.88, 0.55 + (v - 0.55) * 0.89, 0.143]);
        const low = front.map((q) => [q[0], q[1], -0.14]);
        for (let i = 0; i < front.length; i++) {
          const k = (i + 1) % front.length;
          m.face([low[i], low[k], front[k], front[i]], 0x5f8179);
          m.face([front[i], front[k], polished[k], polished[i]], 0x99afa0);
        }
        m.face(
          polished,
          polished.map(([u, v]) => m.mix(0x34565b, 0x72968a, 0.12 + 0.45 * (v / 1.38) + u * 0.13))
        );
        const band = (a, b, c, d, col) =>
          m.face(
            [a, b, c, d].map(([u, v]) => [u, v, 0.146]),
            col
          );
        band([-0.37, 0.64], [-0.37, 0.695], [0.32, 0.9], [0.31, 0.885], 0x70978b);
        band([-0.39, 0.77], [-0.38, 0.785], [0.19, 0.968], [0.12, 0.935], 0x8ba497);
        band([-0.33, 0.2], [-0.31, 0.217], [0.27, 0.413], [0.25, 0.39], 0x4c766f);
      });
    }
    m.rock(-0.78, -0.11, 0.26, 0.31, 0.42, 0.29, 0x637c74, 0x91a292, 7);
    m.rock(0.8, -0.12, 0.24, 0.38, 0.56, 0.37, 0x60766f, 0x8ba094, 8);
  });
}
function mineralTraces(m, ground) {
  const r = m.rng;
  // Chlorite ribbons and narrower calcite fissures cross several tactical
  // cells at once. Their shared direction runs through both rock chambers.
  for (let j = 0; j < 39; j++) {
    let x = r.range(-6.65, 5.0),
      z = r.range(-5.89, 5.67);
    const dx = r.range(0.16, 0.24),
      dz = r.range(-0.11, 0.01),
      phase = r.range(0, circle);
    let prev;
    const n = Math.floor(r.range(8, 26));
    for (let i = 0; i <= n; i++) {
      const y = ground.terrain(x, z);
      const visible =
        y > 0.051 && ground.margin(x, z) < 0.25 && Math.abs(x - streamCenter(z)) > 0.6;
      const slope = dz + 0.07 * Math.sin(i * 0.59 + phase) + 0.043 * Math.sin(i * 1.29);
      const width =
        (0.006 + 0.035 * Math.max(0, Math.sin((Math.PI * i) / n)) ** 0.75) *
        (0.61 + 0.47 * Math.sin(0.8 * i + phase) ** 2);
      const xs = x - (width * slope) / dx;
      const now = [
        [x, y + 0.007, z],
        [xs, y + 0.007, z + width]
      ];
      if (visible && prev)
        m.face(
          [prev[0], prev[1], now[1], now[0]],
          j % 4 === 0 ? 0xb3c1af : j % 3 === 0 ? 0x7a9586 : 0x688578
        );
      prev = visible ? now : null;
      x += dx;
      z += slope;
    }
  }
  for (let k = 0; k < 32; k++) {
    const z = r.range(-7.23, 8.15);
    if (Math.min(Math.abs(z + 2.5), Math.abs(z - 1.5)) < 0.5) continue;
    const side = k % 2 ? 1 : -1,
      x = streamCenter(z) + side * (bankWidth(z) + r.range(-0.03, 0.13));
    const base = ground.terrain(x, z) - 0.058,
      h = r.range(0.074, 0.15);
    m.rock(x, base, z, r.range(0.06, 0.13), h, r.range(0.08, 0.18), 0x667f75, 0x8b9f8c, 6);
  }
}
function landform7(T, layout) {
  const group = new T.Group(),
    ground = cavern(layout);
  group.name = '寒泉共生石窟';
  const lit = lightField(layout);
  group.add(limestone(T, ground, lit));
  const m = new Model(T, 718319);
  paving(m, layout, ground, lit, streamCenter);
  caveFloor(m, ground, lit);
  spring(m);
  for (const cell of layout.cells.filter((c) => c.kind === 'bridge'))
    stoneSpan(m, ground, cell.y - (layout.height - 1) / 2);
  sourceArch(m, ground);
  polishedWall(m, ground);
  mineralTraces(m, ground);
  for (const [a, b, h, w, n] of [
    [[-6.33, -8.55], [-2.39, -8.37], 0.98, 0.88, 9],
    [[1.03, -8.22], [5.63, -8.85], 1.19, 0.91, 11],
    [[-9.21, -4.67], [-9.78, 1.71], 1.33, 0.89, 12],
    [[8.7, -5.74], [8.45, -1.45], 1.08, 0.77, 8],
    [[-4.35, -0.67], [-2.71, -0.24], 0.53, 0.48, 6],
    [[3.82, -0.81], [5.19, -0.16], 0.4, 0.47, 7]
  ])
    limestoneRib(m, ground, a, b, h, w, n);
  terrace(m, ground);
  const flame = wornPaths(m, ground);
  tileProps(m, layout);
  group.add(m.finish('石樑、泉眼與藥池'));
  group.add(caveWalls(T, ground, layout), caveFeatures(T, ground, layout, flame));
  // The wall's dripstone, jade seams and side passages (wall-7.js).
  group.add(wallDressing(T, layout));
  // Ice, stalagmites and stepping stones on the black lake (lake-7.js).
  group.add(lakeDressing(T, ground));
  // The jade bed, the altar and what else the tomb's people left (tomb-7.js).
  group.add(...tombDressing(T, ground));
  return group;
}

export { landform7 };
