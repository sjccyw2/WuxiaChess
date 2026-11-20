// Xiangyang after the long siege. Three raised wards share a western spine;
// their battlement lines are broken stretches of rammed earth and brick. The
// city wall closes the north with a burnt tower, a barbican guards the east
// gate, the defenders' camp fills the south terrace, and the dry country
// climbs to a far wall and the enemy's smoke.
import { Model, circle } from '../scenery-kit.js';
import { roof, banners, cargo } from '../maze-models.js';
import { terrain6, smooth, clamp } from './ground-6.js';
import {
  orient,
  ladder,
  palisade,
  wallAt,
  warShed,
  trebuchet,
  tent,
  deadFire,
  shield,
  arrow,
  weaponRack,
  abatis,
  supplyCart,
  brick,
  earth,
  soot,
  timber,
  charred,
  red
} from './siege-6.js';

// The ground mesh is dense under the board and thins toward the horizon.
function axis(n, span, centreStep) {
  const a = span / ((centreStep * (n - 1)) / 2) - 1;
  return Array.from({ length: n }, (_, i) => {
    const u = -1 + (2 * i) / (n - 1);
    return (span * (u + a * u ** 5)) / (1 + a);
  });
}
function locate(stops, v) {
  let lo = 0,
    hi = stops.length - 1;
  if (v <= stops[0] || v >= stops[hi]) return -1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (stops[mid] <= v) lo = mid;
    else hi = mid;
  }
  return lo;
}
// Dry grass grows where nothing has trodden it down.
function grassy(s, x, z) {
  // Fine variation fades where the ground mesh grows coarse.
  const fine = 1 - smooth((s.edge - 0.7) / 0.35);
  const n =
    0.5 +
    0.26 * Math.sin(x * 0.93 + Math.sin(z * 0.71) * 2.1) +
    0.22 * Math.sin(z * 1.53 - x * 0.57 + 1.2) +
    0.2 * s.grain * fine;
  return (
    smooth((n - 0.45) / 0.35) *
    (1 - s.bank * 0.85) *
    (1 - s.road) *
    (1 - s.track * 0.9) *
    (1 - s.camp * 0.65) *
    (1 - s.drain) *
    (1 - s.bastion * 0.6)
  );
}
// Old burns where pitch and fire pots fell.
const burns = [
  [-1.6, -6.45, 1.1],
  [4.4, -6.55, 0.8],
  [11.0, -5.0, 0.9],
  [-9.3, 0.4, 0.8],
  [5.1, 8.95, 0.5],
  [-6.6, 9.2, 0.45],
  [2.6, -2.95, 0.9],
  [-7.6, 9.9, 0.7]
];
const burnAt = (x, z) =>
  Math.max(
    0,
    ...burns.map(([bx, bz, r]) => {
      const q = Math.hypot(x - bx, z - bz) / r;
      return (1 - smooth(q)) * (0.75 + 0.25 * Math.sin(x * 5.1 + z * 3.7));
    })
  );

function field(T, layout) {
  const site = terrain6(layout);
  const xs = axis(97, 46, 0.42),
    zs = axis(81, 40, 0.42),
    nx = xs.length,
    nz = zs.length;
  const xyz = [],
    rgb = [],
    ix = [],
    heights = [];
  const C = (h) => new T.Color(h);
  const trodden = C(0x625b4f),
    dust = C(0x8a8171),
    olive = C(0x5f6243),
    straw = C(0x80795a),
    clay = C(0x8a7254),
    damp = C(0x4c4d43),
    wet = C(0x3c423d),
    scorch = C(0x35312c),
    farland = C(0x7c7a62),
    grass = new T.Color(),
    tint = new T.Color();
  for (let row = 0; row < nz; row++)
    for (let col = 0; col < nx; col++) {
      const x = xs[col],
        z = zs[row],
        s = site.sample(x, z);
      heights.push(s.y);
      xyz.push(x, s.y, z);
      grass.copy(olive).lerp(straw, clamp(0.5 + 0.5 * Math.sin(x * 0.33 - z * 0.41) + 0.2 * s.grain));
      tint
        .copy(trodden)
        .lerp(grass, grassy(s, x, z) * 0.55)
        .lerp(clay, s.bastion * 0.5)
        .lerp(dust, Math.max(s.road * 0.72, s.track * 0.62, s.silt * 0.55, s.camp * 0.22))
        .lerp(damp, s.drain * 0.8)
        .lerp(wet, s.bed * 0.85)
        .lerp(scorch, Math.max(s.pit * 0.55, burnAt(x, z) * 0.8))
        .lerp(farland, s.far * 0.55);
      tint.multiplyScalar(0.94 + 0.06 * s.grain * (1 - smooth((s.edge - 0.7) / 0.35)) + 0.03 * s.hills);
      rgb.push(tint.r, tint.g, tint.b);
    }
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      ix.push(a, c, b, b, c, d);
    }
  const geom = new T.BufferGeometry();
  geom.setAttribute('position', new T.Float32BufferAttribute(xyz, 3));
  geom.setAttribute('color', new T.Float32BufferAttribute(rgb, 3));
  geom.setIndex(ix);
  geom.computeVertexNormals();
  geom.computeBoundingSphere();
  const surface = new T.Mesh(
    geom,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 })
  );
  surface.name = '西城夯土、甕城緩坡、南營與遠野';
  surface.receiveShadow = true;
  // Interpolate the very triangles that are drawn, so feet meet the ground.
  function height(x, z) {
    const i = locate(xs, x),
      j = locate(zs, z);
    if (i < 0 || j < 0) return site.sample(x, z).y;
    const k = j * nx + i,
      p = (x - xs[i]) / (xs[i + 1] - xs[i]),
      q = (z - zs[j]) / (zs[j + 1] - zs[j]);
    const a = heights[k],
      b = heights[k + 1],
      c = heights[k + nx],
      d = heights[k + nx + 1];
    return p + q <= 1 ? a + p * (b - a) + q * (c - a) : d + (1 - p) * (c - d) + (1 - q) * (b - d);
  }
  return { ...site, surface, height, layout };
}
const ashlar = [0x74756f, 0x817f78, 0x8b887e, 0x6d6e69, 0x7e7c74];

function vault(m, radius, thickness, spring, depth, count) {
  for (let i = 0; i < count; i++) {
    const lo = (Math.PI * i) / count + 0.006,
      hi = (Math.PI * (i + 1)) / count - 0.006;
    const k = i === Math.floor(count / 2) ? thickness + 0.046 : thickness;
    const outline = [
      [radius, lo],
      [radius + k, lo],
      [radius + k, hi],
      [radius, hi]
    ];
    const at = (x, r, a) => [x, spring + Math.sin(a) * r, Math.cos(a) * r];
    const front = outline.map(([r, a]) => at(depth / 2, r, a)),
      back = outline.map(([r, a]) => at(-depth / 2, r, a));
    const tone = ashlar[(i * 3 + 1) % ashlar.length];
    m.face([...front].reverse(), tone);
    m.face(back, tone, 0.98);
    for (let j = 0; j < 4; j++) {
      const next = (j + 1) % 4;
      m.face([front[j], front[next], back[next], back[j]], tone, j === 3 ? 0.74 : 0.94);
    }
  }
}

function eastGate(m, height) {
  const x = 8.52,
    z = -5.04;
  m.frame(x, 0, z, 0, 1, () => {
    for (const sign of [-1, 1]) {
      // Deep through-stones seat the jambs in the real roadbed.
      const y = height(x, z + sign * 0.99);
      m.box(0, (y - 0.19 + 0.059) / 2, sign * 1.04, 0.98, 0.059 - y + 0.19, 0.71, 0x666861);
      for (let j = 0; j < 4; j++) {
        const yy = 0.051 + j * 0.193;
        m.box(0, yy + 0.096, sign * 0.996, 0.77 - j * 0.013, 0.197, 0.393, ashlar[(j + 2) % 5]);
        m.box(0, yy + 0.092, sign * 1.35, 0.73, 0.189, 0.3, ashlar[(j + 4) % 5]);
      }
      m.box(0, 0.808, sign * 1.118, 0.86, 0.092, 0.72, 0x8a877c);
      for (let j = 0; j < 3; j++)
        m.box(0, 0.92 + j * 0.155, sign * 1.35, 0.69, 0.157, 0.31, ashlar[j]);
      // Irregular shoulders continue into the barbican walls.
      for (let k = 0; k < 2; k++) {
        const u = sign * (1.68 + k * 0.35);
        const base = height(x, z + u);
        m.box(
          0,
          (base + 0.79 - k * 0.24) / 2,
          u,
          0.77,
          0.79 - k * 0.24 - base + 0.08,
          0.36,
          ashlar[k]
        );
        m.box(0, 0.82 - k * 0.24, u, 0.8, 0.075, 0.37, 0x8a877c);
      }
    }
    vault(m, 0.797, 0.255, 0.839, 0.75, 13);
    // Soot licks up the vault face from the burnt gate leaves.
    m.box(0.39, 1.4, 0, 0.012, 0.5, 1.3, 0x3a3631);
    // A small weathered copper tablet rests on the keystone.
    m.box(0, 1.909, 0, 0.8, 0.09, 0.48, 0x7d7d72);
    m.box(0.391, 1.765, 0, 0.045, 0.13, 0.31, 0x8f7853);
    for (const dz of [-0.089, 0.09]) m.box(0.42, 1.76, dz, 0.016, 0.057, 0.025, 0xc3a66a);
  });
}

function masonry(m, site) {
  const { height, channel, gateRoad } = site;
  // Stepped stone revetments line the ditch below the city paving.
  for (let i = 0; i < 12; i++) {
    const x = -0.65 + i * 0.76,
      z = channel(x);
    for (const side of [-1, 1]) {
      const zz = z + side * (0.29 + 0.018 * Math.sin(x)),
        base = height(x, zz);
      m.frame(x, base - 0.083, zz, Math.atan(0.104 * Math.cos(x * 0.42 + 0.5)), 1, () => {
        m.box(0, 0.1, 0, 0.7, 0.22, 0.11, ashlar[(i + (side > 0 ? 2 : 0)) % 5]);
        if (i % 4 === 1) m.box(0, 0.223, 0, 0.64, 0.026, 0.128, 0x878479);
      });
    }
    if (i % 4 === 2) {
      const y = height(x, z - 0.31);
      // Plank crossings rest on opposite banks above the wet bed.
      for (const dx of [-0.14, 0.06]) m.box(x + dx, y + 0.123, z, 0.14, 0.105, 0.78, 0x6b5a45);
    }
  }
  // Cart-polished wheel lines continue across the paving and out through the arch.
  for (const side of [-1, 1]) {
    let prior = null;
    for (let j = 0; j <= 48; j++) {
      const x = 2.93 + j * 0.249,
        z = gateRoad(x) + side * (0.384 + 0.027 * Math.sin(x * 1.17));
      const w = 0.029 + 0.007 * Math.sin(x + side);
      const grade = (zz) =>
        x <= 7.99 ? Math.max(0.041, height(x, zz) + 0.009) : height(x, zz) + 0.009;
      const pair = [
        [x, grade(z - w), z - w],
        [x, grade(z + w), z + w]
      ];
      if (prior && (x > 7.85 || j % 13 !== 0))
        m.face([prior[0], prior[1], pair[1], pair[0]], j % 5 ? 0x5d5244 : 0x675b4b);
      prior = pair;
    }
  }
  // Where the western spine meets the low drainage ward, stone steps sit on
  // an earth wedge. The lip starts beyond the original paving.
  for (let i = 0; i < 5; i++) {
    const x = -2.03 + 0.19 * i,
      z = 1.91,
      y = 0.025 - 0.093 * i;
    const low = Math.min(height(x, z - 0.28), height(x, z + 0.28), y - 0.075);
    m.box(x, (low + y) / 2, z, 0.27, y - low, 0.61, ashlar[(i + 1) % 5]);
  }
  eastGate(m, height);
}

// Segments of a wall between two points, its outer face turned away from `inside`.
function wallBetween(m, height, a, b, inside, o) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    len = Math.hypot(dx, dz),
    mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let yaw = Math.atan2(-dz, dx);
  if (Math.sin(yaw) * (mid[0] - inside[0]) + Math.cos(yaw) * (mid[1] - inside[1]) < 0)
    yaw += Math.PI;
  return wallAt(m, height, mid[0], mid[1], yaw, { length: len + 0.3, ...o });
}

function fortifications(m, site) {
  const { height } = site,
    r = m.rng;
  // North curtain, breached in the middle where the camp road once ran out.
  wallAt(m, height, -1.75, -7.5, Math.PI, {
    length: 9.6,
    height: 2.3,
    base: 1.15,
    top: 0.85,
    breaches: [
      [-0.15, 2.4, 0.32, 1.6, 0.32],
      [4.3, 1.0, 1.55, 0.6, 0]
    ],
    loss: 0.32,
    burn: 0.35,
    phase: 1
  });
  // The tower (馬面) with its burnt war shed and the last standard.
  wallAt(m, height, 4.45, -7.72, Math.PI, {
    length: 2.6,
    height: 3.1,
    base: 1.75,
    top: 1.45,
    endFacing: true,
    loss: 0.2,
    burn: 0.55,
    phase: 3
  });
  m.frame(4.45, 3.1, -7.72, Math.PI, 1, () => warShed(m, 2.2, 1.2, 0));
  m.frame(3.55, 3.1, -7.25, 0.25, 1, () => banners(m, 0, 0, 1.55, red));
  // East curtain steps down toward the barbican.
  wallAt(m, height, 6.97, -7.5, Math.PI, {
    length: 2.45,
    height: 2.3,
    base: 1.1,
    top: 0.82,
    breaches: [[-1.15, 1.5, 0.85, 0.6, 0]],
    loss: 0.35,
    burn: 0.3,
    phase: 4
  });
  // Barbican (甕城) around the east gate; its outer gate has been burnt out.
  const inside = [9.4, -5.0],
    low = { height: 1.55, base: 0.9, top: 0.68, loss: 0.3, burn: 0.35, course: 0.14 };
  wallBetween(m, height, [8.35, -7.35], [10.05, -7.15], inside, { ...low, phase: 6 });
  wallBetween(m, height, [10.05, -7.15], [11.1, -6.0], inside, { ...low, phase: 7, ragged: 0.15 });
  wallBetween(m, height, [11.1, -3.95], [10.15, -2.75], inside, {
    ...low,
    phase: 8,
    breaches: [[0.2, 0.9, 0.5, 0.5, 0]]
  });
  wallBetween(m, height, [10.15, -2.75], [8.75, -2.45], inside, { ...low, phase: 9 });
  m.frame(10.7, height(10.7, -6.4) + 1.55, -6.4, -0.6, 1, () => banners(m, 0, 0, 1.3, red));
  for (const [x, z, yaw] of [
    [11.55, -5.35, 0.5],
    [11.7, -4.4, -0.35]
  ]) {
    const y = height(x, z);
    m.frame(x, y + 0.04, z, yaw, 1, () => {
      for (let i = 0; i < 4; i++) m.box(-0.33 + i * 0.22, 0, 0, 0.2, 0.06, 1.1, i % 2 ? charred : 0x3d3329);
      m.box(0, 0.04, 0.3, 0.9, 0.05, 0.08, 0x3a3733);
    }, 0.06, 0.04);
  }
  // West wall, the spine that joins the three lines.
  wallAt(m, height, -9.25, -2.6, -Math.PI / 2, {
    length: 7.0,
    height: 2.0,
    base: 1.05,
    top: 0.8,
    breaches: [[2.9, 1.7, 0.6, 1.0, 0.42]],
    loss: 0.35,
    burn: 0.25,
    phase: 5
  });
  // Cheval-de-frise across the approaches outside the walls.
  for (const [x, z, yaw, l] of [
    [12.3, -6.6, 1.2, 1.5],
    [12.4, -3.3, 1.9, 1.5],
    [-1.6, -9.5, 0.08, 1.8],
    [-4.6, -9.1, -0.12, 1.4],
    [1.4, -9.3, 0.2, 1.4],
    [-11.0, -4.5, 1.5, 1.6]
  ])
    abatis(m, x, height(x, z) - 0.03, z, yaw, l);
  // Rubble heaps where crews have stacked salvage for repairs.
  for (const [x, z, n] of [
    [-5.0, -8.95, 9],
    [7.0, -8.6, 7],
    [-10.4, -0.9, 7]
  ])
    for (let i = 0; i < n; i++) {
      const px = x + (i % 3) * 0.36 + r.range(-0.05, 0.05),
        pz = z + Math.floor(i / 3) * 0.24;
      m.frame(px, height(px, pz) + 0.06 + (i > 5 ? 0.14 : 0), pz, r.range(-0.15, 0.15), 1, () =>
        m.box(0, 0, 0, 0.34, 0.14, 0.2, r.pick(brick))
      );
    }
}

// The battlement lines run off the board to meet the outer walls. They stand
// no taller than the rubble tiles, so like those they never fade.
function brokenLines(m, site) {
  const { height } = site;
  const stub = { base: 0.7, top: 0.52, parapet: false, course: 0.11, litter: 0, loss: 0.25, burn: 0.15 };
  wallAt(m, height, 7.35, -0.06, 0, {
    ...stub,
    length: 2.7,
    height: 0.8,
    ragged: 0.22,
    ends: [false, true],
    breaches: [[0.9, 0.9, 0.22, 0.4, 0]],
    phase: 11
  });
  wallAt(m, height, -8.36, -0.06, 0, { ...stub, length: 0.75, height: 0.9, ragged: 0.15, ends: [false, false] });
  wallAt(m, height, -7.86, -3.06, 0, { ...stub, length: 1.73, height: 0.85, ragged: 0.2, ends: [false, false] });
  // The middle line is down: a low ridge of core and spilled brick.
  wallAt(m, height, 3.0, -3.04, 0, {
    ...stub,
    length: 10.0,
    height: 0.55,
    base: 0.66,
    top: 0.5,
    loss: 0.8,
    ragged: 0.3,
    ends: [false, true],
    breaches: [
      [-3.2, 1.6, 0.08, 0.12, 0.12],
      [0.6, 2.6, 0.05, 0.14, 0.14],
      [3.7, 1.2, 0.12, 0.12, 0.12]
    ],
    phase: 13
  });
}

function bakehouse(m, site) {
  const { height } = site,
    x = -2.25,
    z = 8.17;
  const floor = -0.375;
  // Earth and rubble plinth runs continuously beneath all the timber posts.
  const foot =
    Math.min(...[-1.25, 1.25].flatMap((dx) => [-0.66, 0.66].map((dz) => height(x + dx, z + dz)))) -
    0.16;
  m.frame(x, floor, z, -0.035, 1, () => {
    m.box(0, (foot - floor) / 2, 0, 2.57, floor - foot, 1.45, 0x6f6c60);
    m.box(0, 0.032, 0, 2.52, 0.078, 1.43, 0x827b6d);
    for (const dx of [-1.12, 0, 1.12]) {
      for (const dz of [-0.51, 0.51]) {
        m.box(dx, 0.115, dz, 0.167, 0.159, 0.165, 0x7a776b);
        m.box(dx, 0.57, dz, 0.109, 0.923, 0.109, 0x55432f);
      }
      m.box(dx, 1.013, 0, 0.14, 0.104, 1.4, 0x574836);
    }
    for (const side of [-1, 1]) m.box(side * 1.1, 0.535, 0, 0.105, 0.878, 1.02, 0xa8987a);
    m.box(0, 0.533, 0.516, 2.17, 0.843, 0.085, 0xb0a283);
    m.box(0, 0.971, -0.51, 2.42, 0.137, 0.143, 0x5f4a35);
    m.box(-0.58, 0.482, -0.51, 0.97, 0.73, 0.071, 0xa39476);
    // Open shutter bay with a serving ledge and a shallow woven bread tray.
    m.box(-0.57, 0.622, -0.557, 0.64, 0.325, 0.035, 0x403e34);
    for (let j = 0; j < 6; j++)
      m.box(-0.84 + j * 0.107, 0.622, -0.583, 0.025, 0.31, 0.027, 0x7d6649);
    m.box(0.58, 0.357, -0.607, 1.08, 0.066, 0.358, 0x7a5f40);
    basket(m, 0.59, 0.393, -0.579, 0.155, 0.11);
    m.box(0, 1.059, 0, 2.42, 0.094, 1.28, 0x564838);
    roof(m, 2.92, 1.81, 1.12, 0.375, [0x3a403f, 0x4b5353, 0x67706a]);
    // The bake oven is integral to the masonry end wall.
    m.lathe(
      1.36,
      0.071,
      0.025,
      [
        [0, 0.36],
        [0.31, 0.36],
        [0.47, 0.32],
        [0.57, 0.2],
        [0.59, 0.13]
      ],
      0x8a6b52,
      10
    );
    m.box(1.36, 0.27, -0.303, 0.25, 0.235, 0.047, 0x2f2c27);
    m.box(1.36, 0.158, -0.385, 0.29, 0.047, 0.17, 0x76685a);
    m.lathe(
      1.42,
      0.622,
      0.12,
      [
        [0, 0.081],
        [0.265, 0.073],
        [0.294, 0.087]
      ],
      0x6d5d4c,
      8
    );
  });
  // The threshold and doorway apron connect with the south ward at the base of the slope.
  for (let k = 0; k < 6; k++) {
    const u = (k - 2.5) * 0.32,
      zz = z - 0.89 - 0.1 * Math.cos(u * 2.0),
      b = height(x + u, zz) - 0.06;
    const y = Math.max(b + 0.08, -0.392);
    m.box(x + u, (b + y) / 2, zz, 0.309, y - b, 0.26, ashlar[k % 5]);
  }
}

function basket(m, x, y, z, r, h, produce = false) {
  m.frame(x, y, z, 0, 1, () => {
    const floor = [
      [0, r * 0.63],
      [0.1 * h, r * 0.67],
      [0.91 * h, r],
      [h, r * 0.985]
    ];
    m.lathe(0, 0, 0, floor, 0x937446, 9);
    m.lathe(
      0,
      h * 0.91,
      0,
      [
        [0, r * 0.84],
        [0.014, r * 0.84]
      ],
      0x6c5336,
      9
    );
    for (const [fraction, radius] of [
      [0.31, 0.76],
      [0.62, 0.89],
      [0.96, 1.0]
    ]) {
      m.lathe(
        0,
        h * fraction,
        0,
        [
          [0, r * radius + 0.004],
          [0.018, r * radius + 0.004]
        ],
        0xae8e57,
        9
      );
    }
    for (let n = 0; n < 9; n++) {
      const a = (n * circle) / 9;
      m.tube(
        [Math.cos(a) * r * 0.63, 0.021, Math.sin(a) * r * 0.63],
        [Math.cos(a) * r, h * 0.96, Math.sin(a) * r],
        0.009,
        0.009,
        0xb39864,
        4
      );
    }
    if (produce)
      for (let k = 0; k < 6; k++) {
        const a = (k * circle) / 5,
          rr = k === 5 ? 0 : r * 0.53;
        m.rock(
          Math.cos(a) * rr,
          h - 0.025,
          Math.sin(a) * rr,
          0.056,
          0.077,
          0.047,
          k % 2 ? 0x6f8354 : 0x82925b,
          0x96a76a,
          5
        );
      }
  });
}

function handcart(m, x, z, height) {
  const yaw = -0.12;
  const wheelGround = (offset) => height(x + Math.sin(yaw) * offset, z + Math.cos(yaw) * offset);
  const left = wheelGround(-0.278),
    right = wheelGround(0.278);
  const camber = -Math.atan2(right - left, 0.556);
  m.frame(
    x,
    (left + right) / 2 + 0.012,
    z,
    yaw,
    1,
    () => {
      for (const q of [-1, 1]) {
        const axleZ = q * 0.278,
          radius = 0.268;
        // A continuous iron tyre encloses the wooden felloe and six spokes.
        m.hoop(0, radius, axleZ, radius, 0.028, 0x665544, 14, 'xy');
        m.hoop(0, radius, axleZ + q * 0.013, radius + 0.008, 0.014, 0x444b45, 14, 'xy');
        for (let j = 0; j < 6; j++) {
          const a = (circle * j) / 6;
          m.tube(
            [0, radius, axleZ],
            [Math.cos(a) * radius * 0.94, radius + Math.sin(a) * radius * 0.94, axleZ],
            0.017,
            0.014,
            0x8d7452,
            4
          );
        }
        m.tube([0, radius, axleZ - 0.047], [0, radius, axleZ + 0.047], 0.048, 0.044, 0x594d39, 8);
        m.tube([-0.34, 0.345, q * 0.182], [1.06, 0.084, q * 0.24], 0.037, 0.026, 0x6d593f, 5);
        m.tube([0.702, 0.021, q * 0.2], [0.705, 0.182, q * 0.2], 0.022, 0.022, 0x68543b, 4);
      }
      m.tube([0, 0.268, -0.355], [0, 0.268, 0.355], 0.03, 0.03, 0x53483a, 6);
      for (let i = 0; i < 5; i++)
        m.box(-0.037, 0.371, (i - 2) * 0.091, 0.85, 0.066, 0.086, i % 2 ? 0x9f8359 : 0x917650);
      for (const q of [-1, 1]) m.box(-0.115, 0.448, q * 0.219, 0.73, 0.107, 0.035, 0x836a49);
      m.box(-0.449, 0.454, 0, 0.042, 0.113, 0.472, 0x7d6344);
    },
    camber
  );
}

function market(m, site) {
  const { height } = site;
  // The gate keeper's stall in the lower court beside the ditch; the last
  // evacuation cart stands on the dry southern bank.
  const tableX = 4.92,
    tableZ = 2.22;
  const top = height(tableX, tableZ) + 0.28;
  for (const dx of [-0.48, 0.47])
    for (const dz of [-0.19, 0.19]) {
      const x = tableX + dx,
        z = tableZ + dz,
        bottom = height(x, z) - 0.038;
      m.box(x, (top + bottom) / 2, z, 0.053, top - bottom, 0.054, 0x775b3e);
    }
  for (let i = 0; i < 4; i++)
    m.box(
      tableX,
      top + 0.022,
      tableZ + (i - 1.5) * 0.12,
      1.12,
      0.053,
      0.114,
      i % 2 ? 0x97784e : 0x8a6f4b
    );
  basket(m, tableX - 0.25, top + 0.053, tableZ, 0.15, 0.15, true);
  m.lathe(
    tableX + 0.227,
    top + 0.048,
    tableZ,
    [
      [0, 0.14],
      [0.028, 0.17],
      [0.047, 0.16]
    ],
    0xb89355,
    10
  );
  for (const [dx, dz] of [
    [0.2, -0.05],
    [0.27, 0.04],
    [0.15, 0.05]
  ])
    m.lathe(
      tableX + dx,
      top + 0.095,
      tableZ + dz,
      [
        [0, 0.048],
        [0.027, 0.053],
        [0.041, 0.045]
      ],
      0xc9a56c,
      8
    );
  handcart(m, 3.2, 2.12, height);
  for (const [x, z, r, h] of [
    [5.76, 2.12, 0.19, 0.22],
    [5.93, 2.28, 0.12, 0.18],
    [6.03, 2.06, 0.145, 0.16]
  ])
    basket(m, x, height(x, z) - 0.013, z, r, h);
  // Rushes and puddles in the wet bed of the ditch.
  for (let i = 0; i < 36; i++) {
    const x = m.rng.range(-0.56, 9.5),
      side = m.rng.next() > 0.5 ? 1 : -1,
      z = site.channel(x) + side * m.rng.range(0.09, 0.24);
    const y = height(x, z) - 0.025;
    if (i % 3) {
      for (let k = 0; k < 3; k++) {
        const xx = x + m.rng.range(-0.04, 0.04),
          zz = z + m.rng.range(-0.04, 0.04);
        m.face(
          [
            [xx - 0.014, y, zz],
            [xx + 0.014, y, zz],
            [xx + m.rng.range(-0.04, 0.05), y + m.rng.range(0.09, 0.18), zz + 0.039]
          ],
          k % 2 ? 0x6f7550 : 0x5c6a4e
        );
      }
    } else m.rock(x, y, z, 0.086, 0.079, 0.057, 0x6b6a62, 0x7e7c72, 5);
  }
  for (let i = 0; i < 6; i++) {
    const x = 0.4 + i * 1.5 + m.rng.range(-0.3, 0.3),
      z = site.channel(x) + m.rng.range(-0.05, 0.05),
      y = height(x, z) + 0.012,
      w = m.rng.range(0.25, 0.5);
    const ring = [];
    for (let k = 0; k < 8; k++) {
      const a = (k * circle) / 8;
      ring.push([x + Math.cos(a) * w * m.rng.range(0.8, 1.1), y, z + Math.sin(a) * 0.11 * m.rng.range(0.8, 1.1)]);
    }
    orient(m, ring, 0x56645f, [0, 1, 0]);
  }
}

// The defenders' camp on the south terrace, and the engine by the west wall.
function encampment(m, site) {
  const { height } = site,
    r = m.rng;
  const at = (x, z) => height(x, z);
  for (const [x, z, yaw, s, trim] of [
    [4.2, 7.55, 0.08, 1, null],
    [6.05, 7.85, -0.06, 1, null],
    [8.05, 7.45, 0.16, 1.05, red],
    [-6.0, 7.65, -0.1, 1, null],
    [-8.0, 7.15, 0.32, 0.95, null],
    [-5.0, 10.9, 0.05, 1, null],
    [4.5, 11.15, -0.1, 1, null],
    [7.3, 11.55, 0.12, 1, null],
    [-7.9, 11.3, -0.2, 1, null]
  ])
    tent(m, x, at(x, z) - 0.02, z, yaw - Math.PI / 2, s, trim);
  // The commander's tent, wider and trimmed red, with standards either side.
  tent(m, 1.35, at(1.35, 10.85) - 0.02, 10.85, -Math.PI / 2, 1.45, red);
  for (const dx of [-1.05, 1.05])
    m.frame(1.35 + dx, at(1.35 + dx, 10.0), 10.0, 0, 1, () => banners(m, 0, 0, 1.75, red));
  weaponRack(m, 2.75, at(2.75, 7.6), 7.6, 0.05);
  weaponRack(m, -4.65, at(-4.65, 7.5), 7.5, -0.12);
  supplyCart(m, -0.4, at(-0.4, 10.1), 10.1, 0.35);
  supplyCart(m, 9.4, at(9.4, 9.5), 9.5, -0.6);
  for (const [x, z, pot] of [
    [5.1, 8.95, true],
    [-6.6, 9.2, false],
    [2.6, 12.4, true]
  ])
    deadFire(m, x, at(x, z), z, pot);
  // Logs to sit on around the fires.
  for (const [x, z, yaw] of [
    [5.75, 8.7, 0.4],
    [4.5, 9.35, -0.3],
    [-6.0, 9.6, 1.1]
  ])
    m.tube([x - Math.cos(yaw) * 0.35, at(x, z) + 0.06, z - Math.sin(yaw) * 0.35], [x + Math.cos(yaw) * 0.35, at(x, z) + 0.06, z + Math.sin(yaw) * 0.35], 0.07, 0.065, timber, 6);
  // Stacked stores under a lean-to.
  m.frame(-8.6, at(-8.6, 9.3), 9.3, 0.2, 1, () => {
    for (const [x, z] of [
      [-0.35, -0.12],
      [0.25, -0.15],
      [-0.05, 0.3]
    ])
      cargo(m, x, z, 0.48, 0x6e5a44);
    m.frame(-0.1, 0.42, -0.1, 0.3, 1, () => cargo(m, 0, 0, 0.42, 0x7a6449));
    for (const x of [-0.75, 0.75]) {
      m.tube([x, 0, -0.45], [x, 1.0, -0.45], 0.025, 0.022, timber, 5);
      m.tube([x, 0, 0.55], [x, 0.62, 0.55], 0.025, 0.022, timber, 5);
    }
    orient(
      m,
      [
        [-0.85, 1.02, -0.52],
        [0.85, 1.02, -0.52],
        [0.85, 0.62, 0.65],
        [-0.85, 0.62, 0.65]
      ],
      0xa89e86,
      [0, 1, 0]
    );
  });
  // The camp is fenced on its open east and south sides.
  palisade(
    m,
    [
      [10.6, 5.2],
      [11.0, 7.6],
      [10.9, 10.2],
      [9.9, 12.4]
    ],
    at
  );
  palisade(
    m,
    [
      [-3.6, 12.9],
      [-6.4, 12.9],
      [-9.4, 12.2]
    ],
    at
  );
  // Ladders from the last assault: one still against the west wall, others broken.
  ladder(m, [-10.5, at(-10.5, -1.6) + 0.02, -1.6], [-9.72, 1.85, -1.3]);
  ladder(m, [-2.6, at(-2.6, -9.7) + 0.04, -9.7], [-0.4, at(-0.4, -10.1) + 0.04, -10.1], 0.3);
  ladder(m, [10.2, at(10.2, 4.4) + 0.04, 4.4], [8.4, at(8.4, 5.0) + 0.04, 5.0]);
  ladder(m, [9.8, at(9.8, 5.0) + 0.08, 5.0], [8.0, at(8.0, 5.6) + 0.08, 5.6], 0.25);
  // Spare timbers and stones for the engine, stacked by the camp gate.
  m.frame(9.0, at(9.0, 6.3), 6.3, 0.25, 1, () => {
    for (let i = 0; i < 5; i++)
      m.tube([-0.8, 0.07 + Math.floor(i / 3) * 0.12, -0.2 + (i % 3) * 0.14 + Math.floor(i / 3) * 0.07], [0.8, 0.07 + Math.floor(i / 3) * 0.12, -0.2 + (i % 3) * 0.14 + Math.floor(i / 3) * 0.07], 0.065, 0.06, i % 2 ? timber : 0x6a5139, 6);
  });
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4,
      d = Math.sqrt(i) * 0.16,
      x = 9.6 + Math.cos(a) * d,
      z = 7.4 + Math.sin(a) * d;
    m.rock(x, at(x, z) - 0.02 + (i === 0 ? 0.14 : 0), z, 0.14, 0.22, 0.14, 0x77756c, 0x96938a, 6);
  }
  // Firewood under a tarpaulin beside the kitchen fire.
  m.frame(6.5, at(6.5, 9.6), 9.6, -0.3, 1, () => {
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 4),
        k = i % 4;
      m.tube([-0.35, 0.05 + row * 0.08, -0.13 + k * 0.085 + row * 0.04], [0.35, 0.05 + row * 0.08, -0.13 + k * 0.085 + row * 0.04], 0.04, 0.04, k % 2 ? 0x6e563c : 0x5b4631, 5);
    }
  });
  // The trebuchet by the west wall, with its stock of dressed stones.
  m.frame(-10.35, 0, 3.7, 0.75, 1, () => trebuchet(m, () => at(-10.35, 3.7)));
  for (let i = 0; i < 11; i++) {
    const a = i * 2.4,
      d = Math.sqrt(i) * 0.17,
      x = -11.45 + Math.cos(a) * d,
      z = 5.0 + Math.sin(a) * d;
    m.rock(x, at(x, z) - 0.02 + (i === 0 ? 0.16 : 0), z, 0.15, 0.24, 0.15, 0x77756c, 0x96938a, 6);
  }
}

// Low litter of the fight: arrows, brick, shields, grass, stones in their pits.
function battlefield(m, site) {
  const { height, layout } = site,
    r = m.rng;
  const onBoard = (x, z, pad = 0.12) => {
    for (const dx of [-pad, pad])
      for (const dz of [-pad, pad])
        if (layout.mask[Math.floor(z + dz + layout.height / 2)]?.[Math.floor(x + dx + layout.width / 2)] === '#')
          return true;
    return false;
  };
  const blade = [0x8f8656, 0xa39a68, 0x7a7a4a, 0x6b6e44, 0xb0a272];
  for (let i = 0; i < 1500; i++) {
    const x = r.range(-21, 21),
      z = r.range(-15, 17);
    if (onBoard(x, z)) continue;
    const s = site.sample(x, z),
      g = grassy(s, x, z);
    if (r.next() > g * 1.1 + 0.04) continue;
    const y = height(x, z) - 0.01,
      h = r.range(0.1, 0.22) * (0.7 + g * 0.5);
    for (let k = 0; k < 4; k++) {
      const a = k * 1.6 + r.range(-0.3, 0.3),
        xx = x + Math.cos(a) * 0.035,
        zz = z + Math.sin(a) * 0.035;
      orient(
        m,
        [
          [xx - Math.sin(a) * 0.02, y, zz + Math.cos(a) * 0.02],
          [xx + Math.sin(a) * 0.02, y, zz - Math.cos(a) * 0.02],
          [xx + Math.cos(a) * h * 0.4, y + h, zz + Math.sin(a) * h * 0.4]
        ],
        r.pick(blade),
        [0, 1, 0]
      );
    }
  }
  // Volleys that fell short of the walls and the camp.
  const volleys = [
    [-1.6, -6.3, 2.2, 22],
    [4.4, -6.45, 1.2, 10],
    [-8.4, -2.4, 1.6, 14],
    [9.8, -4.9, 1.6, 16],
    [3.0, -3.0, 3.0, 14],
    [2.0, 1.4, 3.0, 14],
    [0.0, 7.4, 5.0, 26],
    [-7.5, 6.6, 1.5, 10]
  ];
  for (const [cx, cz, spread, n] of volleys)
    for (let i = 0; i < n; i++) {
      const x = cx + r.range(-spread, spread),
        z = cz + r.range(-spread * 0.45, spread * 0.45);
      if (onBoard(x, z, 0.05)) continue;
      const y = height(x, z);
      if (r.next() < 0.7) arrow(m, x, y, z, 1.2 + r.range(-0.3, 0.3), r.range(0.5, 0.9), 0.32);
      else arrow(m, x, y + 0.005, z, r.range(0, circle), 0.03, 0.3, false);
    }
  // Brick and stone fragments.
  for (let i = 0; i < 240; i++) {
    const x = r.range(-14, 14),
      z = r.range(-11, 13);
    if (onBoard(x, z)) continue;
    const s = r.range(0.04, 0.11);
    m.frame(x, height(x, z) + s * 0.15, z, r.range(0, circle), 1, () =>
      m.box(0, 0, 0, s * 1.6, s * 0.7, s, r.next() < 0.6 ? r.pick(brick) : r.pick(earth))
    , r.range(-0.3, 0.3), r.range(-0.3, 0.3));
  }
  // Shields dropped in the retreat.
  for (let i = 0; i < 10; i++) {
    const x = r.range(-11, 12),
      z = r.range(-9.5, 12.5);
    if (onBoard(x, z, 0.25)) continue;
    shield(m, x, height(x, z) + 0.005, z, r.range(0, circle), r.range(-0.15, 0.15), r.range(0.9, 1.1), i % 3 === 0);
  }
  // Stones from the enemy engines, half sunk in their own pits.
  for (const [x, z, s] of site.craters) {
    const y = height(x, z);
    m.rock(x + 0.05, y - 0.08, z - 0.04, 0.2 * (s + 0.4), 0.3 * (s + 0.4), 0.19 * (s + 0.4), 0x75736a, 0x938f85, 8);
    for (let k = 0; k < 5; k++) {
      const a = k * 1.3 + r.range(-0.2, 0.2),
        d = s * r.range(0.6, 1.0);
      m.rock(x + Math.cos(a) * d, height(x + Math.cos(a) * d, z + Math.sin(a) * d) - 0.02, z + Math.sin(a) * d, 0.07, 0.05, 0.06, 0x6f6a5f, 0x857f72, 5);
    }
  }
  // Ruts of the supply carts along the camp road.
  for (const side of [-1, 1]) {
    let prior = null;
    for (let j = 0; j <= 70; j++) {
      const x = -10 + j * 0.3,
        z = site.campRoad(x) + side * 0.3,
        w = 0.035;
      const pair = [
        [x, height(x, z - w) + 0.01, z - w],
        [x, height(x, z + w) + 0.01, z + w]
      ];
      if (prior && !onBoard(x, z)) m.face([prior[0], prior[1], pair[1], pair[0]], 0x4f473d);
      prior = pair;
    }
  }
}

// The horizon: the far reach of the city wall, enemy camps on the ridges and their smoke.
function horizon(m, site) {
  const r = m.rng,
    at = (x, z) => site.sample(x, z).y;
  const course = [
    [-46, -20],
    [-30, -29],
    [-12, -32],
    [8, -31.5],
    [26, -26],
    [40, -13],
    [47, 4]
  ];
  for (let s = 1; s < course.length; s++) {
    const [ax, az] = course[s - 1],
      [bx, bz] = course[s],
      len = Math.hypot(bx - ax, bz - az),
      n = Math.ceil(len / 1.5),
      yaw = Math.atan2(-(bz - az), bx - ax);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n,
        x = ax + (bx - ax) * t,
        z = az + (bz - az) * t,
        g = at(x, z),
        gap = Math.sin(x * 0.37 + s) > 0.86;
      const h = gap ? 0.7 + r.next() * 0.5 : 2.3 + r.range(-0.15, 0.1);
      m.frame(x, g, z, yaw, 1, () => {
        m.box(0, h / 2 - 0.8, 0, len / n + 0.05, h + 1.6, 1.6, gap ? 0x7b6c58 : r.pick([0x6e6f6a, 0x75746d, 0x686a66]));
        if (!gap)
          for (const u of [-0.4, 0.35]) m.box(u, h + 0.2, 0.7, 0.42, 0.4, 0.24, 0x6a6b66);
      });
      if (!gap && i % 4 === 2)
        m.frame(x, g, z, yaw, 1, () => {
          m.box(0, 1.1, 0.4, 2.0, 4.0, 2.6, 0x727169);
          m.box(0, 3.4, 0.4, 1.6, 0.6, 2.0, 0x564b40);
          m.face([[-1.2, 3.7, -0.9], [1.2, 3.7, -0.9], [0, 4.5, 0.4]], 0x3f4241);
          m.face([[1.2, 3.7, 1.7], [-1.2, 3.7, 1.7], [0, 4.5, 0.4]], 0x4b4e4c);
          m.face([[-1.2, 3.7, -0.9], [-1.2, 3.7, 1.7], [0, 4.5, 0.4]], 0x454847);
          m.face([[1.2, 3.7, 1.7], [1.2, 3.7, -0.9], [0, 4.5, 0.4]], 0x454847);
        });
    }
  }
  // Enemy camps: rows of tents, palisades and standards on the far ridges.
  for (const [cx, cz, rows, cols, yaw] of [
    [-22, 16, 3, 6, 0.4],
    [14, 21, 3, 7, -0.25],
    [-33, -2, 4, 3, 1.3],
    [31, 12, 3, 4, -0.9]
  ]) {
    for (let a = 0; a < rows; a++)
      for (let b = 0; b < cols; b++) {
        const u = (b - cols / 2) * 1.5 + r.range(-0.2, 0.2),
          v = (a - rows / 2) * 1.6,
          x = cx + Math.cos(yaw) * u + Math.sin(yaw) * v,
          z = cz - Math.sin(yaw) * u + Math.cos(yaw) * v,
          y = at(x, z);
        m.frame(x, y - 0.05, z, yaw, 1, () => {
          const tone = r.pick([0xb9ae94, 0xa89d84, 0xc3b8a0]);
          m.face([[-0.55, 0, -0.45], [0.55, 0, -0.45], [0.5, 0.75, 0], [-0.5, 0.75, 0]], tone);
          m.face([[-0.55, 0, 0.45], [0.55, 0, 0.45], [0.5, 0.75, 0], [-0.5, 0.75, 0]], m.mix(tone, 0x6c6253, 0.3));
          m.face([[0.55, 0, -0.45], [0.55, 0, 0.45], [0.5, 0.75, 0]], m.mix(tone, 0x6c6253, 0.15));
        });
      }
    for (let k = 0; k < 3; k++) {
      const x = cx + r.range(-4, 4),
        z = cz + r.range(-2.5, 2.5);
      m.tube([x, at(x, z), z], [x, at(x, z) + 2.6, z], 0.07, 0.05, 0x4b3f33, 4);
      m.face([[x, at(x, z) + 2.55, z], [x - 1.0, at(x, z) + 2.45, z + 0.1], [x - 0.9, at(x, z) + 1.65, z + 0.15], [x, at(x, z) + 1.75, z]], 0x7e2f27);
    }
    for (let k = -6; k <= 6; k++) {
      const u = k * 0.7,
        v = rows * 0.9 + 0.6,
        x = cx + Math.cos(yaw) * u + Math.sin(yaw) * v,
        z = cz - Math.sin(yaw) * u + Math.cos(yaw) * v;
      m.tube([x, at(x, z) - 0.1, z], [x, at(x, z) + 0.75, z], 0.07, 0.03, 0x5a4a3a, 4);
    }
  }
  // Smoke still rising from the far side of the city and the enemy lines.
  for (const [x, z, h] of [
    [-16, -35, 15],
    [10, -34, 12],
    [35, -18, 10],
    [-30, 12, 8]
  ]) {
    const g = at(x, z);
    for (let k = 0; k < 9; k++) {
      const t = k / 8,
        drift = t * t * 4.5;
      m.rock(
        x + drift,
        g + t * h,
        z - drift * 0.4,
        0.9 + t * 2.4,
        1.4 + t * 1.2,
        0.8 + t * 2.0,
        m.mix(0x57524c, 0xa8a196, t * 0.85),
        m.mix(0x6d675f, 0xb7b0a5, t * 0.85),
        7
      );
    }
  }
}

function landform6(T, layout) {
  const group = new T.Group();
  group.name = '襄陽三翼城垣、東甕城與南營';
  const site = field(T, layout);
  group.add(site.surface);
  const works = new Model(T, 61837),
    camp = new Model(T, 61853),
    litter = new Model(T, 61847),
    far = new Model(T, 61861);
  masonry(works, site);
  fortifications(works, site);
  bakehouse(camp, site);
  encampment(camp, site);
  market(litter, site);
  brokenLines(litter, site);
  battlefield(litter, site);
  horizon(far, site);
  group.add(
    works.finish('襄陽城牆、箭樓、甕城與殘垣', { occluder: true }),
    camp.finish('南營帳幕、餅鋪與回回砲', { occluder: true }),
    litter.finish('箭矢、碎磚、溝渠與菜攤'),
    far.finish('遠城、敵營與烽煙', { distant: true, cast: false })
  );
  return group;
}

export { landform6 };
