// Three raised wards share a western spine. Rain leaves the upper precinct
// through a breach and the lower market drains east towards the Han River.
import { Model, circle } from '../scenery-kit.js';
import { roof } from '../maze-models.js';

const clamp = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const blend = (a, b, t) => a + (b - a) * t;
const rectDistance = (x, z, r) =>
  Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));

function wardRuns(layout) {
  const bounds = [];
  layout.mask.forEach((row, j) => {
    for (const match of row.matchAll(/#+/g)) {
      const x = match.index - layout.width / 2,
        z = j - layout.height / 2;
      bounds.push([x, z, x + match[0].length, z + 1]);
    }
  });
  return bounds;
}

function field(T, layout) {
  const wards = wardRuns(layout);
  // The old masonry and tower are on a common L-shaped clay rampart. The
  // eastern watch post and standard stand on the continuation of the gate road.
  const toes = [
    [-6.0, -8.12, 3.7, -7.18],
    [3.8, -8.8, 6.6, -7.24],
    [-9.7, -5.29, -8.73, -0.14],
    [-11.7, 1.85, -9.32, 3.6],
    [9.08, -3.6, 10.62, -2.65],
    [8.99, -2.3, 9.94, -1.33],
    [7.98, -6.44, 9.17, -3.73]
  ];
  const cx = (layout.width - 1) / 2;
  const channel = (x) => 1.12 + 0.18 * Math.sin(x * 0.42 + 0.5);
  const gateRoad = (x) =>
    -5.04 + 0.95 * smooth((x - 8) / 6.8) + 0.24 * Math.sin(Math.max(0, x - 10) * 0.58);
  function sample(x, z) {
    const hills =
      Math.sin(x * 0.51 + Math.sin(z * 0.81)) * 0.5 +
      Math.sin(z * 0.72 - x * 0.2) * 0.32 +
      Math.cos(x * 1.57 + z * 1.22) * 0.18;
    const edge =
      Math.hypot(x / 16.1, (z + 0.3) / 12.7) +
      0.035 * Math.sin(z * 0.58) +
      0.027 * Math.sin(x * 0.64);
    const ground = blend(-0.67 + 0.1 * hills, -1.21, smooth((edge - 0.788) / 0.2));
    const d = Math.min(...wards.map((r) => rectDistance(x, z, r)));
    const fort = Math.min(...toes.map((r) => rectDistance(x, z, r)));
    const bank = 1 - smooth((d - 0.06) / 1.18);
    const bastion = 1 - smooth((fort - 0.1) / 1.72);
    let y = blend(ground, -0.048 + 0.01 * hills, bank);
    y = blend(y, -0.037 + 0.009 * hills, bastion);
    const drain = (1 - smooth((Math.abs(z - channel(x)) - 0.2) / 0.4)) * smooth((x + 0.9) / 1.6);
    y -= 0.255 * drain;
    const marketBank = 1 - smooth(rectDistance(x, z, [2.35, 1.72, 6.45, 2.52]) / 0.42);
    y = blend(y, -0.26, marketBank);
    const road =
      (1 - smooth((Math.abs(z - gateRoad(x)) - 0.65) / 0.5)) * smooth((x - (cx - 1.6)) / 0.75);
    const grade = blend(0.037, -0.71, smooth((x - (cx + 0.57)) / 6.1));
    y = blend(y, grade, road * (1 - smooth((edge - 0.82) / 0.33)));
    // Imported stone flags are laid throughout these old wards. Decades of
    // hoof traffic and silty floods have left connected bands of beaten earth.
    const westLane =
      (1 - smooth((Math.abs(x + 5.1 + 0.48 * Math.sin(z * 0.5)) - 0.47) / 0.9)) *
      smooth((z + 6.45) / 0.9) *
      (1 - smooth((z - 5.5) / 1.14));
    const southLane =
      (1 - smooth((Math.abs(z - 4.1 - 0.34 * Math.sin(x * 0.59)) - 0.55) / 1.08)) *
      smooth((x + 6.09) / 1.12) *
      (1 - smooth((x - 5.48) / 1.23));
    const ashDrift =
      (1 - smooth(Math.hypot((x - 1.72) / 3.4, (z + 0.79) / 0.92))) *
      (0.76 + 0.2 * Math.sin(x * 1.6 + z * 0.9));
    const silt = Math.max(westLane, southLane, ashDrift) * (1 - smooth(d / 0.32));
    y = Math.max(y, blend(-1.24, 0.056 + 0.005 * hills, smooth(silt / 0.6)));
    const ovenBase = 1 - smooth(rectDistance(x, z, [-3.5, 7.55, -1.0, 8.69]) / 0.68);
    y = blend(y, -0.43, ovenBase);
    return { y, hills, bank, bastion, drain, road, edge, silt };
  }
  const step = 0.46,
    nx = 77,
    nz = 61,
    x0 = (-(nx - 1) * step) / 2,
    z0 = (-(nz - 1) * step) / 2;
  const xyz = [],
    rgb = [],
    ix = [],
    heights = [];
  const clay = new T.Color(0x98816e),
    ash = new T.Color(0x716d61),
    damp = new T.Color(0x5c6559),
    roadTint = new T.Color(0xb5a086),
    straw = new T.Color(0x928a63),
    tint = new T.Color();
  for (let row = 0; row < nz; row++)
    for (let col = 0; col < nx; col++) {
      const x = x0 + col * step,
        z = z0 + row * step,
        site = sample(x, z);
      heights.push(site.y);
      xyz.push(x, site.y, z);
      tint
        .copy(clay)
        .lerp(ash, clamp(0.22 + 0.24 * site.hills + site.bastion * 0.14))
        .lerp(straw, clamp(0.26 + 0.32 * Math.sin(x * 0.94 - z * 0.67)) * (1 - site.bank))
        .lerp(damp, site.drain * 0.81)
        .lerp(roadTint, site.road * 0.79)
        .lerp(clay, site.silt * 0.65);
      tint.multiplyScalar(1 - smooth((site.edge - 0.76) / 0.27) * 0.28);
      tint.multiplyScalar(
        0.94 + 0.06 * Math.sin(x * 3.79 + Math.cos(z * 5.1)) + 0.025 * site.hills
      );
      rgb.push(tint.r, tint.g, tint.b);
    }
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      if (Math.max(heights[a], heights[b], heights[c], heights[d]) > -1.02)
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
  surface.name = '西城夯土、甕城緩坡與東門官道';
  surface.receiveShadow = true;
  // Interpolate the very triangles that are drawn for wheels, stones and water.
  function height(x, z) {
    const u = (x - x0) / step,
      v = (z - z0) / step,
      i = Math.floor(u),
      j = Math.floor(v);
    if (i < 0 || j < 0 || i >= nx - 1 || j >= nz - 1) return -1;
    const k = j * nx + i,
      p = u - i,
      q = v - j;
    const a = heights[k],
      b = heights[k + 1],
      c = heights[k + nx],
      d = heights[k + nx + 1];
    return p + q <= 1 ? a + p * (b - a) + q * (c - a) : d + (1 - p) * (c - d) + (1 - q) * (b - d);
  }
  return { surface, height, gateRoad, channel };
}
const ashlar = [0x7d8078, 0x8a877a, 0x9b9380, 0x827e73, 0x8e8c80];

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
      m.box(0, (y - 0.19 + 0.059) / 2, sign * 1.04, 0.98, 0.059 - y + 0.19, 0.71, 0x6f7165);
      for (let j = 0; j < 4; j++) {
        const yy = 0.051 + j * 0.193;
        m.box(0, yy + 0.096, sign * 0.996, 0.77 - j * 0.013, 0.197, 0.393, ashlar[(j + 2) % 5]);
        m.box(0, yy + 0.092, sign * 1.35, 0.73, 0.189, 0.3, ashlar[(j + 4) % 5]);
      }
      m.box(0, 0.808, sign * 1.118, 0.86, 0.092, 0.72, 0x9b9785);
      for (let j = 0; j < 3; j++)
        m.box(0, 0.92 + j * 0.155, sign * 1.35, 0.69, 0.157, 0.31, ashlar[j]);
      // Irregular shoulders continue into the existing curtain and guard post.
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
        m.box(0, 0.82 - k * 0.24, u, 0.8, 0.075, 0.37, 0x96917d);
      }
    }
    vault(m, 0.797, 0.255, 0.839, 0.75, 13);
    // A small weathered copper tablet rests on the keystone.
    m.box(0, 1.909, 0, 0.8, 0.09, 0.48, 0x8b8b78);
    m.box(0.391, 1.765, 0, 0.045, 0.13, 0.31, 0x8f7853);
    for (const dz of [-0.089, 0.09]) m.box(0.42, 1.76, dz, 0.016, 0.057, 0.025, 0xc3a66a);
  });
}

function masonry(m, site) {
  const { height, channel, gateRoad } = site;
  // Three stepped drains lead from the city paving to a lower planted gutter.
  for (let i = 0; i < 12; i++) {
    const x = -0.65 + i * 0.76,
      z = channel(x);
    for (const side of [-1, 1]) {
      const zz = z + side * (0.29 + 0.018 * Math.sin(x)),
        base = height(x, zz);
      m.frame(x, base - 0.083, zz, Math.atan(0.104 * Math.cos(x * 0.42 + 0.5)), 1, () => {
        m.box(0, 0.1, 0, 0.7, 0.22, 0.11, ashlar[(i + (side > 0 ? 2 : 0)) % 5]);
        if (i % 4 === 1) m.box(0, 0.223, 0, 0.64, 0.026, 0.128, 0x969183);
      });
    }
    if (i % 4 === 2) {
      const y = height(x, z - 0.31);
      // These cover stones rest on opposite banks. Their open intervals expose the silt.
      for (const dx of [-0.14, 0.06]) m.box(x + dx, y + 0.123, z, 0.14, 0.105, 0.78, 0x898876);
    }
  }
  // Remains of a fallen retaining course in the narrow northern breach.
  for (let i = 0; i < 31; i++) {
    const x = -0.67 + i * 0.27,
      z = -3.06 + 0.12 * Math.sin(x * 1.2) + m.rng.range(-0.19, 0.19);
    const h = m.rng.range(0.065, 0.19),
      w = m.rng.range(0.17, 0.32),
      y = height(x, z);
    m.frame(x, y - 0.045, z, m.rng.range(-0.67, 0.72), 1, () =>
      m.box(0, h * 0.48, 0, w, h, 0.15 + m.rng.next() * 0.1, ashlar[i % 5])
    );
    if (i % 4 === 1)
      m.rock(x + 0.075, y - 0.034, z - 0.06, 0.17, 0.18, 0.14, 0x817868, 0x949080, 6);
  }
  // Mason's salvage beside the missing middle reach of the north parapet.
  for (let i = 0; i < 13; i++) {
    const x = -2.67 + (i % 5) * 0.52,
      z = -9.15 - Math.floor(i / 5) * 0.31;
    const y = height(x, z);
    m.frame(x, y - 0.05, z, m.rng.range(-0.16, 0.17), 1, () =>
      m.box(0, 0.115, 0, 0.47, 0.23, 0.25, ashlar[i % 5])
    );
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
        m.face([prior[0], prior[1], pair[1], pair[0]], j % 5 ? 0x88765e : 0x938169);
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

// The old sketch left some merlons hanging over missing upper courses.
// Smaller staggered stones under their footprints carry the masonry down
// into the surviving wall. The fractured outer silhouette stays visible.
function wallBearings(m) {
  const curtains = [
    [
      -1.818,
      -7.678,
      0,
      2.4,
      [
        [-3.29, 2.027],
        [-2.55, 2.368],
        [1.89, 2.368],
        [2.63, 2.368],
        [3.37, 1.347]
      ]
    ],
    [
      5.265,
      -8.029,
      0.04,
      3.34,
      [
        [-0.865, 3.047],
        [-0.125, 3.047],
        [0.615, 3.047]
      ]
    ],
    [
      -9.188,
      -2.624,
      1.58,
      1.98,
      [
        [-2.075, 1.701],
        [1.625, 1.701]
      ]
    ]
  ];
  for (const [x, z, yaw, top, piers] of curtains)
    m.frame(x, 0, z, yaw, 1, () => {
      for (const [offset, foot] of piers) {
        const n = Math.max(1, Math.ceil((top - foot) / 0.25)),
          h = (top - foot + 0.046) / n;
        for (let j = 0; j < n; j++) {
          const width = 0.443 + (n - j - 1) * 0.046;
          m.box(
            offset,
            foot - 0.04 + (j + 0.5) * h,
            0.183,
            width,
            h + 0.002,
            0.639,
            ashlar[(j + 3) % 5]
          );
        }
        m.box(offset, top - 0.012, 0.24, 0.486, 0.041, 0.55, 0x888a7d);
      }
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
    m.box(0, (foot - floor) / 2, 0, 2.57, floor - foot, 1.45, 0x7d7a68);
    m.box(0, 0.032, 0, 2.52, 0.078, 1.43, 0x928775);
    for (const dx of [-1.12, 0, 1.12]) {
      for (const dz of [-0.51, 0.51]) {
        m.box(dx, 0.115, dz, 0.167, 0.159, 0.165, 0x878373);
        m.box(dx, 0.57, dz, 0.109, 0.923, 0.109, 0x68533d);
      }
      m.box(dx, 1.013, 0, 0.14, 0.104, 1.4, 0x6a5945);
    }
    for (const side of [-1, 1]) m.box(side * 1.1, 0.535, 0, 0.105, 0.878, 1.02, 0xb29b79);
    m.box(0, 0.533, 0.516, 2.17, 0.843, 0.085, 0xb6a585);
    m.box(0, 0.971, -0.51, 2.42, 0.137, 0.143, 0x755b40);
    m.box(-0.58, 0.482, -0.51, 0.97, 0.73, 0.071, 0xaa9778);
    // Open shutter bay with a serving ledge and a shallow woven bread tray.
    m.box(-0.57, 0.622, -0.557, 0.64, 0.325, 0.035, 0x514f40);
    for (let j = 0; j < 6; j++)
      m.box(-0.84 + j * 0.107, 0.622, -0.583, 0.025, 0.31, 0.027, 0x967c58);
    m.box(0.58, 0.357, -0.607, 1.08, 0.066, 0.358, 0x917049);
    basket(m, 0.59, 0.393, -0.579, 0.155, 0.11);
    m.box(0, 1.059, 0, 2.42, 0.094, 1.28, 0x685746);
    roof(m, 2.92, 1.81, 1.12, 0.375, [0x454e4c, 0x596464, 0x77827a]);
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
      0x9a7457,
      10
    );
    m.box(1.36, 0.27, -0.303, 0.25, 0.235, 0.047, 0x514c40);
    m.box(1.36, 0.158, -0.385, 0.29, 0.047, 0.17, 0x86755d);
    m.lathe(
      1.42,
      0.622,
      0.12,
      [
        [0, 0.081],
        [0.265, 0.073],
        [0.294, 0.087]
      ],
      0x806d58,
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
function market(m, site) {
  const { height, channel } = site;
  // Civilian market in the lower court. The last evacuation cart stands on
  // the dry southern bank. The folded awning no longer obscures either wing.
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
  // Short runs of rushes and rounded silt interrupt the formal ashlar gutter.
  for (let i = 0; i < 36; i++) {
    const x = m.rng.range(-0.56, 9.5),
      side = m.rng.next() > 0.5 ? 1 : -1,
      z = channel(x) + side * m.rng.range(0.09, 0.24);
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
          k % 2 ? 0x7f845c : 0x69795b
        );
      }
    } else m.rock(x, y, z, 0.086, 0.079, 0.057, 0x7c7765, 0x898774, 5);
  }
}

function landform6(T, layout) {
  const group = new T.Group();
  group.name = '襄陽三翼城垣、東門與菜市';
  const site = field(T, layout);
  group.add(site.surface);
  const stones = new Model(T, 61837),
    stalls = new Model(T, 61847);
  masonry(stones, site);
  wallBearings(stones);
  const oven = new Model(T, 61853);
  bakehouse(oven, site);
  market(stalls, site);
  group.add(
    stones.finish('東門券洞、雨溝與築城舊跡', { occluder: true }),
    stalls.finish('賣餅菜攤與守門空車'),
    oven.finish('城南餅鋪與磚窯', { occluder: true })
  );
  return group;
}

export { landform6 };
