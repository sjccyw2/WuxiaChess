import { Model, circle } from '../scenery-kit.js';

// The court has two narrow necks. The north gate and bell court, the western
// qin bench and the eastern tuning rack were cut into the same mountain spur.
const spurs = [
  [-2, -7.75, 2.42, 1.15, -0.46],
  [3.9, -7.8, 3.05, 1.0, -0.57],
  [-8.5, -2.3, 1.45, 1.71, -0.59],
  [-9.24, 3.0, 2.68, 2.11, -0.54],
  [-6.79, -0.03, 1.97, 1.29, -0.4],
  [7.79, 0.82, 1.67, 1.42, -0.51],
  [-2.58, -9.78, 1.25, 0.81, -1.08],
  [-4.72, -11.15, 1.36, 0.83, -2.36],
  [-8.59, 5.79, 1.87, 0.93, -1.86],
  [0.79, 7.68, 2.75, 0.89, -1.84],
  [6.75, 3.48, 1.44, 0.77, -2.09],
  [7.09, -3.72, 1.18, 0.87, -2.98]
];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function mountain(layout) {
  const strips = [];
  const cx = (layout.width - 1) / 2;
  const cz = (layout.height - 1) / 2;
  layout.mask.forEach((row, j) => {
    for (const run of row.matchAll(/#+/g)) {
      const lo = run.index - cx - 0.5;
      strips.push([lo, lo + run[0].length, j - cz]);
    }
  });
  function distance(x, z) {
    let nearest = Infinity;
    for (const [left, right, middle] of strips) {
      const dx = Math.max(left - x, 0, x - right);
      const dz = Math.max(0, Math.abs(z - middle) - 0.5);
      nearest = Math.min(nearest, dx * dx + dz * dz);
    }
    return Math.sqrt(nearest);
  }
  function surface(x, z) {
    const fold =
      Math.sin(x * 0.89 - z * 0.46) * 0.24 +
      Math.sin(x * 1.81 + z * 0.59) * 0.13 +
      Math.cos(z * 1.76 + 0.44) * 0.1;
    function bed(d, top) {
      const q = Math.max(0, d + fold * Math.min(d, 1));
      const strata = (1 - Math.cos(q * 7.1 + 0.22 * x)) * Math.min(q, 1) * 0.12;
      return top + 0.16 * fold - 0.24 * q - 0.44 * q * q - strata;
    }
    let y = bed(distance(x, z), -0.31);
    for (const [px, pz, width, depth, top] of spurs) {
      const radius = Math.hypot((x - px) / width, (z - pz) / depth);
      y = Math.max(y, bed(Math.max(0, (radius - 1) * Math.min(width, depth)), top));
    }
    return y;
  }
  return { distance, surface };
}

function rockAndSoil(T, ground) {
  const m = new Model(T, 470411);
  const columns = 63,
    rows = 56,
    meshPoints = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const x = -18.25 + 0.55 * (i + m.rng.range(-0.21, 0.21));
      const z = -15.25 + 0.55 * (j + m.rng.range(-0.21, 0.21));
      meshPoints.push([x, ground.surface(x, z), z]);
    }
  }
  const positions = [],
    colors = [],
    indices = [],
    seen = new Map();
  function vertex(k) {
    if (seen.has(k)) return seen.get(k);
    const [x, y, z] = meshPoints[k];
    const loX = meshPoints[k % columns ? k - 1 : k];
    const hiX = meshPoints[(k + 1) % columns ? k + 1 : k];
    const loZ = meshPoints[k - columns] || meshPoints[k];
    const hiZ = meshPoints[k + columns] || meshPoints[k];
    const steep = Math.hypot(
      (hiX[1] - loX[1]) / (hiX[0] - loX[0]),
      (hiZ[1] - loZ[1]) / (hiZ[2] - loZ[2])
    );
    const folded = 0.5 + 0.5 * Math.sin(4.15 * y + 0.62 * x - 0.26 * z);
    const stone = m.mix(0x506465, 0x92917b, 0.17 + 0.69 * folded);
    const cover = m.mix(
      0x526e56,
      0x909571,
      0.47 + 0.18 * Math.sin(0.52 * x - 0.83 * z) + 0.2 * Math.sin(0.79 * z + 0.31 * x)
    );
    const turf = clamp(1.4 - 0.94 * steep, 0, 1) * clamp((y + 4.1) / 1.8, 0, 1);
    const index = positions.length / 3;
    positions.push(x, y, z);
    colors.push(...m.mix(stone, cover, turf));
    seen.set(k, index);
    return index;
  }
  function triangle(a, b, c) {
    if (Math.max(meshPoints[a][1], meshPoints[b][1], meshPoints[c][1]) > -6.06)
      indices.push(vertex(a), vertex(b), vertex(c));
  }
  for (let j = 1; j < rows; j++) {
    for (let i = 1; i < columns; i++) {
      const c = j * columns + i,
        b = c - 1,
        d = c - columns,
        a = d - 1;
      if (m.rng.next() > 0.5) {
        triangle(a, b, d);
        triangle(b, c, d);
      } else {
        triangle(a, b, c);
        triangle(a, c, d);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const rock = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.94 })
  );
  rock.name = '層岩山脊與雲壑';
  rock.receiveShadow = true;
  return rock;
}

// The well-worn upper slabs of a stair rest on embedded masonry rather than
// hovering at the average height of the slope. Each flight stops at its landing.
function stairs(m, surface, from, to, count, width, levelStart = 0, levelEnd = 0) {
  const [ax, ay, az] = from,
    [bx, by, bz] = to;
  const dx = bx - ax,
    dz = bz - az,
    yaw = Math.atan2(dx, dz);
  const length = Math.hypot(dx, dz),
    depth = length / count;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = ax + t * dx,
      z = az + t * dz;
    const rise = clamp((length * t - levelStart) / (length - levelStart - levelEnd), 0, 1);
    const sx = Math.cos(yaw) * width * 0.4,
      sz = -Math.sin(yaw) * width * 0.4;
    const soil = Math.max(surface(x, z), surface(x + sx, z + sz), surface(x - sx, z - sz));
    const y = Math.max(ay + (by - ay) * rise, soil + 0.037);
    const base = Math.min(surface(x, z) - 0.46, y - 0.25);
    m.frame(x, 0, z, yaw, 1, () => {
      m.box(0, (base + y) / 2, 0, width + 0.06, y - base, depth + 0.021, 0x718073);
      m.box(
        0,
        y + 0.021,
        -0.016,
        width + 0.09,
        0.05,
        depth - 0.015,
        i % 3 === 1 ? 0xabaa8d : 0xa0a38b
      );
      m.box(0, y - 0.052, depth * 0.49, width * 0.96, 0.035, 0.04, 0x7c8977);
    });
  }
}

// Clip convex paving to the stepped court outline. Stone boundaries run on
// their own bedding angle and may cross several movement squares.
function clipStone(points, nx, nz, limit) {
  const out = [];
  let previous = points.at(-1);
  for (const current of points) {
    const pa = previous[0] * nx + previous[1] * nz - limit;
    const pb = current[0] * nx + current[1] * nz - limit;
    if (pa < 0 !== pb < 0) {
      const t = pa / (pa - pb);
      out.push([
        previous[0] + t * (current[0] - previous[0]),
        previous[1] + t * (current[1] - previous[1])
      ]);
    }
    if (pb <= 0) out.push(current);
    previous = current;
  }
  return out;
}

function terraceFloor(m, layout) {
  const hw = layout.width / 2,
    hh = layout.height / 2;
  const strips = [];
  layout.mask.forEach((row, y) => {
    for (const section of row.matchAll(/#+/g)) {
      const left = section.index - hw,
        right = left + section[0].length;
      const near = y - hh,
        far = near + 1;
      strips.push([left, right, near, far]);
      m.face(
        [
          [left, 0.046, near],
          [left, 0.046, far],
          [right, 0.046, far],
          [right, 0.046, near]
        ],
        0x748277
      );
    }
  });

  const seeds = [],
    angle = 0.27,
    cs = Math.cos(angle),
    sn = Math.sin(angle);
  for (let j = -8; j <= 8; j++) {
    for (let i = -6; i <= 6; i++) {
      seeds.push([i + (j & 1) * 0.42 + m.rng.range(-0.3, 0.3), j + m.rng.range(-0.32, 0.32)]);
    }
  }
  for (const [u, v] of seeds) {
    let plate = [
      [u - 2, v - 2],
      [u - 2, v + 2],
      [u + 2, v + 2],
      [u + 2, v - 2]
    ];
    for (const [x, z] of seeds) {
      const nx = x - u,
        nz = z - v,
        d = nx * nx + nz * nz;
      if (!d || d > 9) continue;
      plate = clipStone(plate, nx, nz, (x * x + z * z - u * u - v * v) / 2);
    }
    if (plate.length < 3) continue;
    // Broad split limestone slabs have short chipped corners and a worn joint.
    const bitten = [];
    for (let i = 0; i < plate.length; i++) {
      const a = plate[i],
        before = plate[(i + plate.length - 1) % plate.length],
        next = plate[(i + 1) % plate.length];
      const bite = m.rng.range(0.035, 0.089);
      for (const b of [before, next]) {
        const x = u + (a[0] - u) * 0.988 + (b[0] - a[0]) * bite;
        const z = v + (a[1] - v) * 0.981 + (b[1] - a[1]) * bite;
        bitten.push([x * 2.38 * cs - z * 1.32 * sn, x * 2.38 * sn + z * 1.32 * cs]);
      }
    }
    const minX = Math.min(...bitten.map((p) => p[0])),
      maxX = Math.max(...bitten.map((p) => p[0]));
    const minZ = Math.min(...bitten.map((p) => p[1])),
      maxZ = Math.max(...bitten.map((p) => p[1]));
    const tone = m.mix(0x8c9b8c, 0xb1b39a, m.rng.range(0.17, 0.78));
    for (const [left, right, near, far] of strips) {
      if (minX >= right || maxX <= left || minZ >= far || maxZ <= near) continue;
      let piece = clipStone(bitten, -1, 0, -left);
      piece = clipStone(piece, 1, 0, right);
      piece = clipStone(piece, 0, -1, -near);
      piece = clipStone(piece, 0, 1, far);
      if (piece.length >= 3)
        m.face(
          piece.map(([x, z]) => [x, 0.049, z]),
          tone
        );
    }
  }
}

function processionalPath(m, T, points, width) {
  const curve = new T.CatmullRomCurve3(points.map(([x, z]) => new T.Vector3(x, 0, z)));
  const length = curve.getLength(),
    pieces = Math.ceil(length / 0.48);
  function across(t) {
    const p = curve.getPointAt(t),
      tangent = curve.getTangentAt(t);
    const span = width * (0.5 + 0.03 * Math.sin(t * 17.0));
    return [
      [p.x - tangent.z * span, 0.056, p.z + tangent.x * span],
      [p.x + tangent.z * span, 0.056, p.z - tangent.x * span]
    ];
  }
  let before = across(0),
    stone = m.mix(0x9fa48e, 0xc0b99c, 0.55);
  for (let i = 1; i <= pieces; i++) {
    const t = i / pieces,
      [l, r] = across(t);
    m.face([before[1], before[0], l, r], stone);
    if (i % 3 === 0 && i < pieces) {
      const [ll, rr] = across(t + 0.013 / length);
      m.face(
        [r, l, ll, rr].map(([x, , z]) => [x, 0.059, z]),
        0x818e7d
      );
      stone = m.mix(0x9fa48e, 0xc0b99c, m.rng.range(0.35, 0.77));
    }
    before = [l, r];
  }
}

function landing(m, surface, x, z, y, width, depth, yaw) {
  const a = width / 2,
    b = depth / 2,
    corner = Math.min(a, b) * 0.22,
    cs = Math.cos(yaw),
    sn = Math.sin(yaw);
  const rim = [
    [-a + corner, -b],
    [-a, -b + corner],
    [-a, b - corner],
    [-a + corner, b],
    [a - corner, b],
    [a, b - corner],
    [a, -b + corner],
    [a - corner, -b]
  ].map(([u, v]) => [x + u * cs + v * sn, y, z - u * sn + v * cs]);
  const base = rim.map(([xx, , zz]) => [xx, Math.min(y - 0.24, surface(xx, zz) - 0.35), zz]);
  for (let i = 0; i < rim.length; i++) {
    const j = (i + 1) % rim.length;
    m.face([rim[i], base[i], base[j], rim[j]], 0x7c8678);
  }
  m.face(rim, 0xa4aa93);
}

function rehearsalStone(m, layout) {
  const x = 5 - (layout.width - 1) / 2,
    z = 5 - (layout.height - 1) / 2;
  const at = (radius, a) => [x + radius * Math.cos(a), 0.063, z + radius * Math.sin(a)];
  const sectors = [
    [0.015, 0.55, 6, 0.34],
    [0.58, 1.17, 9, -0.18],
    [1.2, 1.73, 13, 0.15],
    [1.76, 2.24, 16, -0.07]
  ];
  for (const [inner, outer, count, shift] of sectors) {
    for (let i = 0; i < count; i++) {
      const a = (i * circle) / count + shift + 0.007;
      const b = ((i + 1) * circle) / count + shift - 0.007;
      const mid = (a + b) * 0.5;
      const tone = m.mix(0x607e76, 0x9ba994, m.rng.range(0.23, 0.71));
      m.face([at(inner, a), at(inner, b), at(outer, b), at(outer, mid), at(outer, a)], tone);
    }
  }
  for (let i = 0; i < 7; i++) {
    const a = (i * circle) / 7 - 0.36,
      point = at(2.01, a);
    const [px, , pz] = point;
    m.lathe(
      px,
      0.064,
      pz,
      [
        [0, 0.075],
        [0.006, 0.078]
      ],
      0xb6a274,
      10
    );
    m.lathe(
      px,
      0.071,
      pz,
      [
        [0, 0.048],
        [0.004, 0.047]
      ],
      i === 6 ? 0x5a7069 : 0xcdd0b4,
      10
    );
  }
}

function guideLight(m, x, y, z) {
  m.frame(x, y, z, -0.24, 1, () => {
    m.lathe(
      0,
      0,
      0,
      [
        [-0.24, 0.25],
        [0.1, 0.26],
        [0.18, 0.18],
        [0.23, 0.16]
      ],
      0x788779,
      8
    );
    m.lathe(
      0,
      0.2,
      0,
      [
        [0, 0.16],
        [0.05, 0.19],
        [0.17, 0.135],
        [0.39, 0.14],
        [0.45, 0.23],
        [0.51, 0.25]
      ],
      0x879080,
      8
    );
    m.lathe(
      0,
      0.69,
      0,
      [
        [0, 0.18],
        [0.07, 0.205],
        [0.09, 0.14],
        [0.055, 0.09]
      ],
      0x806746,
      12
    );
    for (const a of [-2.3, -0.45, 1.45]) {
      const dx = Math.cos(a) * 0.16,
        dz = Math.sin(a) * 0.16;
      m.tube([dx, 0.75, dz], [dx, 1.09, dz], 0.022, 0.017, 0x665c47, 5);
    }
    m.lathe(
      0,
      1.08,
      0,
      [
        [0, 0.27],
        [0.04, 0.29],
        [0.115, 0.12],
        [0.16, 0.055],
        [0.21, 0.014]
      ],
      0x6a796a,
      8
    );
    m.glow(() => m.rock(0.015, 0.76, -0.014, 0.062, 0.143, 0.045, 0xc87738, 0xffcb72, 7));
  });
}

function grasses(m, ground, x, z, scale) {
  const y = ground.surface(x, z) - 0.06;
  for (let i = 0; i < 4; i++) {
    const az = m.rng.range(0, circle);
    const dx = Math.cos(az) * scale,
      dz = Math.sin(az) * scale;
    m.leaf(
      [x, y, z],
      [x + dx, y + scale * m.rng.range(0.78, 1.48), z + dz],
      0.09 * scale,
      0x586d4c,
      0x9ca276,
      0.35 * scale
    );
  }
}

function bentPine(m, ground, x, z, scale) {
  const y = ground.surface(x, z) - 0.14;
  const yaw = Math.atan2(
    ground.surface(x, z + 0.27) - ground.surface(x, z - 0.27),
    ground.surface(x - 0.27, z) - ground.surface(x + 0.27, z)
  );
  m.frame(x, y, z, yaw, scale, () => {
    const ankle = [-0.13, 0.42, 0.03],
      bend = [0.05, 0.58, 0.09],
      tip = [0.36, 0.8, 0.04];
    m.tube([0, -0.08, 0], ankle, 0.102, 0.063, 0x655b49, 7);
    m.tube(ankle, bend, 0.069, 0.047, 0x71624e, 7);
    m.tube(bend, tip, 0.052, 0.022, 0x74654f, 6);
    for (const [from, px, h, pz, span] of [
      [ankle, -0.45, 0.57, -0.09, 0.34],
      [bend, 0.16, 0.67, 0.36, 0.34],
      [tip, 0.53, 0.88, -0.11, 0.44],
      [tip, 0.31, 1.03, 0.1, 0.32]
    ]) {
      m.tube(from, [px, h, pz], 0.035, 0.015, 0x73654f, 5);
      m.rock(px, h - 0.045, pz, span, 0.154, span * 0.77, 0x486353, 0x6d815f, 7);
    }
  });
}

function cliffGarden(m, ground) {
  // A weathered toe of bedrock and grasses marks the outside of each ledge.
  // The crown can lean over a slope; its root always intersects the subgrade.
  const ledges = [
    [-7.3, -3.8, 1.25, 0.6],
    [-5.5, -4.8, 1.35, 0.5],
    [-11.1, 5.67, 1.3, 0.65],
    [-8.2, 6.4, 0.83, 0.43],
    [-3.04, 7.45, 1.12, 0.51],
    [3.0, 7.48, 0.9, 0.39],
    [5.4, 4.55, 1.12, 0.44],
    [7.8, -2.73, 1.04, 0.46],
    [4.9, -4.96, 1.1, 0.44],
    [7.27, -8.82, 1.21, 0.64]
  ];
  for (const [x, z, width, height] of ledges) {
    const root = ground.surface(x, z) - height * 0.85 - 0.1;
    m.rock(x, root, z, width, height * 1.47, width * 0.48, 0x616f6c, 0x8a907b, 9, -0.33);
    for (let i = 0; i < 6; i++) {
      const px = x + m.rng.range(-width * 0.72, width * 0.72);
      const pz = z + m.rng.range(0.3, 0.83) * (z > 0 ? 1 : -1);
      if (ground.distance(px, pz) > 0.18) grasses(m, ground, px, pz, m.rng.range(0.16, 0.31));
    }
  }
  for (const [x, z, scale] of [
    [-5.5, 5.38, 1.13],
    [-5.89, 5.69, 0.61],
    [6.54, -3.61, 1.07],
    [-6.5, -6.1, 0.81],
    [3.79, 8.01, 0.77]
  ]) {
    bentPine(m, ground, x, z, scale);
  }
}

function landform4(T, layout) {
  const scene = new T.Group();
  scene.name = '束腰琴臺山骨';
  const ground = mountain(layout);
  scene.add(rockAndSoil(T, ground));

  const court = new Model(T, 470433);
  terraceFloor(court, layout);
  processionalPath(
    court,
    T,
    [
      [-2.06, -6.47],
      [-1.24, -5.74],
      [-1.0, -4.61],
      [-1.0, -3.55],
      [-1.0, -2.73]
    ],
    1.03
  );
  processionalPath(
    court,
    T,
    [
      [-1.0, 0.75],
      [-1.0, 1.47],
      [-0.95, 2.68],
      [-1.02, 4.12],
      [-0.81, 5.08],
      [0, 6.45]
    ],
    1.13
  );
  processionalPath(
    court,
    T,
    [
      [-6.46, -0.39],
      [-5.23, -0.73],
      [-4.38, -0.98],
      [-3.12, -1.12],
      [-2.73, -1.1]
    ],
    0.96
  );
  processionalPath(
    court,
    T,
    [
      [0.85, -1.0],
      [2.43, -1.1],
      [3.55, -0.82],
      [4.63, -0.56],
      [6.46, -0.85]
    ],
    0.92
  );
  rehearsalStone(court, layout);

  // Route through the gateway, across the bell court and down the far slope.
  // Upper treads overlap their landings in both directions.
  stairs(court, ground.surface, [-2.05, 0.008, -6.36], [-2.25, -0.02, -7.53], 4, 1.41);
  landing(court, ground.surface, -2.06, -8.1, 0.022, 1.76, 2.17, -0.22);
  stairs(
    court,
    ground.surface,
    [-1.87, -0.024, -8.93],
    [-2.96, -0.84, -10.4],
    14,
    1.04,
    0.51,
    0.43
  );
  landing(court, ground.surface, -2.96, -10.4, -0.79, 1.35, 1.05, -0.58);
  stairs(court, ground.surface, [-2.87, -0.84, -10.34], [-5.7, -2.22, -11.72], 18, 0.98, 0.82, 0.4);
  landing(court, ground.surface, -5.7, -11.72, -2.17, 1.24, 0.91, -1.08);
  stairs(court, ground.surface, [-1.55, -0.034, -7.62], [0.27, -0.12, -7.69], 5, 0.87);
  stairs(court, ground.surface, [0.2, -0.12, -7.69], [1.89, -0.035, -7.8], 5, 0.87);

  // This turn spans the longer diagonal gap to the raised qin dais. Its second
  // flight reaches the top of the old platform, beyond its masonry foundation.
  stairs(court, ground.surface, [-6.37, 0.008, -0.39], [-7.97, -0.112, 0.92], 7, 0.95);
  landing(court, ground.surface, -7.89, 0.85, -0.058, 1.29, 1.02, -0.83);
  stairs(court, ground.surface, [-7.86, -0.108, 0.83], [-8.67, 0.291, 1.95], 5, 0.94);
  landing(court, ground.surface, -8.67, 1.95, 0.326, 1.07, 0.61, -0.63);
  stairs(court, ground.surface, [6.39, 0.008, -0.85], [7.46, -0.112, 0.26], 5, 0.78);
  landing(court, ground.surface, 7.46, 0.27, -0.065, 1.0, 0.67, 0.69);
  guideLight(court, 7.21, ground.surface(7.21, -1.12), -1.12);
  scene.add(court.finish('琴心石坪與引聲燈'));

  const plants = new Model(T, 470449);
  cliffGarden(plants, ground);
  scene.add(plants.finish('石罅與崖草'));
  return scene;
}

export { landform4 };
