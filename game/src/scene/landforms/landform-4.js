import { Model, circle } from '../scenery-kit.js';
import { tileDressing } from './props-4.js';
import { oldPine, peaksAndClouds } from './peaks-4.js';

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
const smooth = (e0, e1, v) => {
  const t = clamp((v - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
// Deterministic value noise for colour patches and rock grain.
const hash = (x, z) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.545;
  return s - Math.floor(s);
};
function noise(x, z) {
  const i = Math.floor(x),
    j = Math.floor(z),
    u = x - i,
    v = z - j;
  const su = u * u * (3 - 2 * u),
    sv = v * v * (3 - 2 * v);
  const a = hash(i, j),
    b = hash(i + 1, j),
    c = hash(i, j + 1),
    d = hash(i + 1, j + 1);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}
// The granite splits into tall columns along joints that run down the slope.
// Each column has its own height and its own rhythm of ledges.
function columnAt(x, z) {
  const a = Math.atan2(z, x * 0.92);
  const u = (a / circle) * 52 + 0.5 * Math.sin(a * 5 + 0.7) + 0.06 * Math.hypot(x, z);
  const k = Math.floor(u);
  return [k, u - k];
}

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
    const [column] = columnAt(x, z);
    const grain = hash(column, 7.3);
    function bed(d, top) {
      const q = Math.max(0, d + fold * Math.min(d, 1));
      // Below a grassy apron the slope breaks into cliffs: flat ledges and
      // sheer risers, offset from column to column.
      const cliff = smooth(0.55, 1.6, q);
      const s = q * 1.45 + grain * 0.9,
        f = s - Math.floor(s);
      const stepped = (Math.floor(s) + smooth(0.42, 1, f) - grain * 0.9) / 1.45;
      const qq = q + (stepped - q) * cliff;
      return top + 0.16 * fold - 0.22 * qq - 0.42 * qq * qq - cliff * (grain - 0.5) * 0.6;
    }
    let y = bed(distance(x, z), -0.6);
    for (const [px, pz, width, depth, top] of spurs) {
      const radius = Math.hypot((x - px) / width, (z - pz) / depth);
      y = Math.max(y, bed(Math.max(0, (radius - 1) * Math.min(width, depth)), top));
    }
    return y;
  }
  return { distance, surface };
}

// Rock where the slope is steep, turf where it is not. Shaded faces carry
// moss, the rock has pale lichen and dark cracks, and the lower slopes fade
// into the mist below.
const sun = [-0.515, 0.798, 0.313];
function groundTone(m, ground, x, y, z, n) {
  const [column, across] = columnAt(x, z);
  const grain = hash(column, 3.7);
  const band = 0.5 + 0.5 * Math.sin(y * 2.7 + grain * 5);
  // Each column of granite has its own tone; the joints between them are dark.
  let rock = m.mix(0x656d68, 0xa8a493, 0.1 + 0.6 * grain + 0.25 * band);
  if (across < 0.12 || across > 0.9) rock = m.mix(rock, 0x404a45, 0.45);
  const lit = n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2];
  rock = m.mix(rock, 0x4f6447, clamp((0.42 - lit) * 1.3, 0, 0.5));
  const fleck = hash(x * 5.3 + y, z * 5.3);
  if (fleck > 0.88) rock = m.mix(rock, 0xcbc6a8, 0.42);
  else if (fleck < 0.1) rock = m.mix(rock, 0x3c4640, 0.4);
  const patch = noise(x * 0.42 + 3, z * 0.42),
    dry = noise(x * 1.1, z * 1.1 - 5);
  let turf = m.mix(0x526247, 0x7a7c58, 0.15 + 0.7 * patch);
  if (dry > 0.64) turf = m.mix(turf, 0x9c9573, (dry - 0.64) * 1.7);
  if (patch < 0.32) turf = m.mix(turf, 0x5e5b48, (0.32 - patch) * 1.6);
  const d = ground.distance(x, z);
  if (d < 1) turf = m.mix(turf, 0x4a5a3e, (1 - d) * 0.45);
  const grassy = smooth(0.66, 0.82, n[1]) * smooth(-5.4, -3.4, y);
  const c = m.mix(rock, turf, grassy);
  return [m.mix(c, 0xbcc6b8, smooth(-2.4, -6, y) * 0.55), grassy];
}

// The slope as one mesh. Rock keeps its hard facets; turf is shaded smooth
// from the slope itself, so the grass rolls while the cliffs stay broken.
function rockAndSoil(T, ground) {
  const m = new Model(T, 470411);
  const step = 0.4,
    columns = 88,
    rows = 78,
    grid = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const x = -18.4 + step * (i + m.rng.range(-0.22, 0.22));
      const z = -15.4 + step * (j + m.rng.range(-0.22, 0.22));
      const y = ground.surface(x, z),
        e = 0.2;
      const sx = (ground.surface(x + e, z) - ground.surface(x - e, z)) / (2 * e),
        sz = (ground.surface(x, z + e) - ground.surface(x, z - e)) / (2 * e),
        k = 1 / Math.hypot(sx, 1, sz);
      grid.push([x, y, z, ground.distance(x, z), [-sx * k, k, -sz * k]]);
    }
  }
  const positions = [],
    normals = [],
    colors = [];
  function triangle(a, b, c) {
    const A = grid[a],
      B = grid[b],
      C = grid[c];
    if (Math.max(A[1], B[1], C[1]) < -6.06) return;
    // Hidden under the paved court.
    if (!A[3] && !B[3] && !C[3]) return;
    const ux = B[0] - A[0],
      uy = B[1] - A[1],
      uz = B[2] - A[2],
      vx = C[0] - A[0],
      vy = C[1] - A[1],
      vz = C[2] - A[2];
    let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const len = Math.hypot(...n) || 1;
    n = n.map((v) => (v / len) * (n[1] < 0 ? -1 : 1));
    const [col, grassy] = groundTone(
      m,
      ground,
      (A[0] + B[0] + C[0]) / 3,
      (A[1] + B[1] + C[1]) / 3,
      (A[2] + B[2] + C[2]) / 3,
      n
    );
    for (const P of [A, B, C]) {
      positions.push(P[0], P[1], P[2]);
      normals.push(...(grassy > 0.5 ? P[4] : n));
      colors.push(...col);
    }
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
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  const rock = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.94 })
  );
  rock.name = '層岩山脊與雲壑';
  rock.receiveShadow = true;
  rock.castShadow = true;
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
        0x56654a
      );
    }
  });
  // Slabs near an open edge or a damp hollow take on moss and darker stain.
  const inside = (x, z) => layout.mask[Math.floor(z + hh)]?.[Math.floor(x + hw)] === '#';
  function weathered(tone, x, z) {
    let open = 0;
    for (let k = 0; k < 8; k++) {
      const a = (k * circle) / 8;
      if (!inside(x + Math.cos(a) * 0.6, z + Math.sin(a) * 0.6)) open++;
    }
    const damp = noise(x * 0.55 + 11, z * 0.55);
    let c = m.mix(tone, 0x7b8a6a, (open / 8) * 0.75 * (0.5 + damp));
    c = m.mix(c, 0x7d8576, smooth(0.6, 0.9, damp) * 0.45);
    return c;
  }

  const seeds = [],
    angle = 0.27,
    cs = Math.cos(angle),
    sn = Math.sin(angle);
  for (let j = -11; j <= 11; j++) {
    for (let i = -8; i <= 8; i++) {
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
        bitten.push([x * 1.5 * cs - z * 0.92 * sn, x * 1.5 * sn + z * 0.92 * cs]);
      }
    }
    const minX = Math.min(...bitten.map((p) => p[0])),
      maxX = Math.max(...bitten.map((p) => p[0]));
    const minZ = Math.min(...bitten.map((p) => p[1])),
      maxZ = Math.max(...bitten.map((p) => p[1]));
    const tone = m.mix(
      m.mix(0x899484, 0xbdb89d, m.rng.range(0, 1)),
      m.rng.pick([0xa59d86, 0x8f9a91, 0xb0ae98]),
      0.3
    );
    for (const [left, right, near, far] of strips) {
      if (minX >= right || maxX <= left || minZ >= far || maxZ <= near) continue;
      let piece = clipStone(bitten, -1, 0, -left);
      piece = clipStone(piece, 1, 0, right);
      piece = clipStone(piece, 0, -1, -near);
      piece = clipStone(piece, 0, 1, far);
      if (piece.length >= 3)
        m.face(
          piece.map(([x, z]) => [x, 0.049, z]),
          piece.map(([x, z]) => weathered(tone, x, z))
        );
    }
  }
  // Rosettes of lichen and moss cushions dot the older slabs, thickest
  // toward the open edges.
  for (let k = 0; k < 260; k++) {
    const x = m.rng.range(-hw, hw),
      z = m.rng.range(-hh, hh);
    const edge = [-0.4, 0.4].some((d) => !inside(x + d, z) || !inside(x, z + d));
    if (!inside(x, z) || (!edge && k % 3)) continue;
    const r = m.rng.range(0.03, 0.08),
      col = m.rng.pick([0xbab792, 0xb3b590, 0x9ea67f]),
      ring = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * circle) / 8 + m.rng.range(-0.3, 0.3),
        d = r * m.rng.range(0.45, 1.25);
      ring.push([x + Math.cos(a) * d, 0.0502, z + Math.sin(a) * d]);
    }
    m.face(ring, col);
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

function grasses(m, ground, x, z, scale, y = ground.surface(x, z) - 0.04) {
  const blades = 5 + Math.floor(m.rng.next() * 3),
    dry = m.rng.next() < 0.3;
  for (let i = 0; i < blades; i++) {
    const az = m.rng.range(0, circle);
    const dx = Math.cos(az) * scale * 0.7,
      dz = Math.sin(az) * scale * 0.7;
    m.leaf(
      [x, y, z],
      [x + dx, y + scale * m.rng.range(0.7, 1.4), z + dz],
      0.07 * scale,
      dry ? 0x86845e : 0x4f6446,
      dry ? 0xaaa27a : 0x84925f,
      0.35 * scale
    );
  }
}

// A low mountain shrub: a few lumps of small leaves on a woody base, now and
// then with a scatter of pale blossom.
function shrub(m, x, y, z, s, blossom) {
  const r = m.rng;
  for (let k = 0; k < 4; k++) {
    const a = r.range(0, circle),
      d = s * r.range(0.1, 0.45);
    const px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d,
      h = s * r.range(0.35, 0.6);
    m.tube([x, y, z], [px, y + h * 0.6, pz], 0.025 * s, 0.012 * s, 0x5e4d3c, 4);
    m.rock(
      px,
      y + h * 0.3,
      pz,
      s * r.range(0.28, 0.4),
      h * 0.75,
      s * r.range(0.22, 0.32),
      0x3f5a3a,
      0x6d8650,
      7
    );
    if (blossom)
      for (let l = 0; l < 3; l++)
        m.crystal(
          px + r.range(-0.15, 0.15) * s,
          y + h * 0.9,
          pz + r.range(-0.12, 0.12) * s,
          0.035 * s,
          0.05 * s,
          0xd9a2a8,
          0xf4d6d2,
          4
        );
  }
}

// A fern fan of long fronds, for the shady foot of rocks and walls.
function fern(m, x, y, z, s) {
  for (let k = 0; k < 6; k++) {
    const a = (k * circle) / 6 + m.rng.range(-0.3, 0.3),
      l = s * m.rng.range(0.7, 1.0);
    m.leaf(
      [x, y, z],
      [x + Math.cos(a) * l, y + l * 0.45, z + Math.sin(a) * l],
      l * 0.18,
      0x46663f,
      0x7b9a5a,
      l * 0.25
    );
  }
}

// One jointed column of granite: a five-sided prism with a slanting top,
// light and shadow alternating face to face, moss on the top.
function column(m, x, y, z, w, h, yaw, tone) {
  const n = 5,
    lo = [],
    hi = [];
  const tilt = m.rng.range(-0.18, 0.18);
  for (let i = 0; i < n; i++) {
    const a = yaw + (i * circle) / n + m.rng.range(-0.15, 0.15),
      k = m.rng.range(0.85, 1.1),
      dx = Math.cos(a) * w * k,
      dz = Math.sin(a) * w * k * 0.8;
    lo.push([x + dx, y, z + dz]);
    hi.push([x + dx * 0.88, y + h + dx * tilt, z + dz * 0.88]);
  }
  const light = m.mix(tone, 0xc0bca6, 0.4),
    dark = m.mix(tone, 0x46524a, 0.45),
    moss = m.mix(tone, 0x55703f, 0.65);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n,
      face = i % 2 ? tone : m.mix(tone, light, 0.4);
    m.face([lo[i], hi[i], hi[j], lo[j]], [dark, face, face, dark]);
  }
  m.face([...hi].reverse(), moss);
}

// A cluster of columns standing out of the slope, buried at the root, with
// grass and a fern in its lee.
function outcrop(m, ground, x, z, size, yaw) {
  const r = m.rng,
    count = 4 + Math.floor(r.next() * 4),
    tone = m.mix(0x6c746c, 0x969483, r.next());
  for (let k = 0; k < count; k++) {
    const t = (k - (count - 1) / 2) / count,
      along = t * count * size * 0.3 + r.range(-0.05, 0.05),
      out = r.range(-0.12, 0.12) * size;
    const px = x + Math.cos(yaw) * along - Math.sin(yaw) * out,
      pz = z + Math.sin(yaw) * along + Math.cos(yaw) * out;
    // Taller in the middle of the cluster, broken unevenly at the ends.
    const h = size * (1 - Math.abs(t) * 1.1) * r.range(0.55, 1.1);
    const y = ground.surface(px, pz);
    column(
      m,
      px,
      y - 0.5 * size,
      pz,
      size * r.range(0.2, 0.27),
      Math.max(0.1, h) + 0.5 * size,
      yaw,
      tone
    );
  }
  for (let k = 0; k < 2; k++) {
    const a = r.range(0, circle),
      d = size * r.range(0.35, 0.6),
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d;
    if (ground.distance(px, pz) > 0.3) grasses(m, ground, px, pz, r.range(0.16, 0.28));
  }
  const fx = x - Math.sin(yaw) * size * 0.4,
    fz = z + Math.cos(yaw) * size * 0.4;
  if (ground.distance(fx, fz) > 0.3) fern(m, fx, ground.surface(fx, fz) - 0.02, fz, size * 0.32);
}

// A dressed block seen only from outside the wall: its face, bed and ends.
function ashlar(m, x, y, z, w, h, d, tone) {
  const l = x - w / 2,
    r = x + w / 2,
    b = z - d / 2,
    f = z + d / 2,
    lo = y - h / 2,
    hi = y + h / 2;
  m.face(
    [
      [l, hi, b],
      [l, hi, f],
      [r, hi, f],
      [r, hi, b]
    ],
    m.mix(tone, 0xc4c1ab, 0.15)
  );
  m.face(
    [
      [l, lo, f],
      [r, lo, f],
      [r, hi, f],
      [l, hi, f]
    ],
    tone
  );
  for (const e of [l, r])
    m.face(
      [
        [e, lo, b],
        [e, lo, f],
        [e, hi, f],
        [e, hi, b]
      ],
      m.mix(tone, 0x4b5247, 0.2)
    );
}

// The dressed retaining wall that holds the court: a coping course flush
// with the paving, battered courses of staggered ashlar below it running
// into the slope, drain spouts with their stains, and moss at the foot.
function retainingWalls(m, layout, ground) {
  const { width, height, mask, cells } = layout,
    cx = (width - 1) / 2,
    cz = (height - 1) / 2;
  const open = (x, y) => mask[y]?.[x] !== '#';
  const sides = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ];
  const r = m.rng;
  for (const cell of cells) {
    for (const [dx, dz] of sides) {
      if (!open(cell.x + dx, cell.y + dz)) continue;
      const salt = cell.x * 37 + cell.y * 91 + dx * 13 + dz * 7 + 40;
      const ex = cell.x - cx + dx * 0.5,
        ez = cell.y - cz + dz * 0.5;
      // Convex corners: extend so the two walls lap like quoins.
      const before = open(cell.x - dz, cell.y + dx) ? 0.13 : 0,
        after = open(cell.x + dz, cell.y - dx) ? 0.13 : 0;
      let foot = Infinity;
      for (const t of [-0.5, 0, 0.5]) {
        const wx = ex + dz * t + dx * 0.25,
          wz = ez - dx * t + dz * 0.25;
        foot = Math.min(foot, ground.surface(wx, wz));
      }
      foot -= 0.18;
      const lo = -0.5 - before,
        hi = 0.5 + after;
      const front = (y) => 0.085 + 0.06 * (-0.05 - y);
      m.frame(ex, 0, ez, Math.atan2(dx, dz), 1, () => {
        // Mortar bed seen through the joints.
        m.face(
          [
            [lo, -0.04, 0.078],
            [lo, foot, front(foot) - 0.01],
            [hi, foot, front(foot) - 0.01],
            [hi, -0.04, 0.078]
          ],
          0x4b5247
        );
        // Coping slabs.
        let x = lo;
        while (x < hi - 0.02) {
          const len = Math.min(hi - x, r.range(0.45, 0.75));
          const tone = m.mix(0x9fa18d, 0xb5b29a, r.next());
          ashlar(m, x + len / 2, 0.0, 0.058, len - 0.012, 0.1, 0.12, tone);
          x += len;
        }
        // Ashlar courses, staggered.
        let y = -0.06,
          course = 0;
        while (y > foot) {
          const h = [0.19, 0.15, 0.21, 0.17, 0.2][(course + salt) % 5];
          const yc = y - h / 2,
            f = front(yc) + r.range(-0.006, 0.006);
          const depthShade = clamp((-0.06 - yc) / 0.9, 0, 1);
          x = lo;
          let first = true;
          while (x < hi - 0.03) {
            const len = Math.min(hi - x, first ? r.range(0.18, 0.42) : r.range(0.32, 0.56));
            first = false;
            let tone = m.mix(0x7a8172, 0xa29e89, r.next());
            if (r.next() < 0.15) tone = m.mix(tone, 0x646b60, 0.5);
            tone = m.mix(tone, 0x5a6d49, depthShade * r.range(0.15, 0.6));
            ashlar(m, x + len / 2, yc, f - 0.065, len - 0.016, h - 0.016, 0.13, tone);
            x += len;
          }
          y -= h;
          course++;
        }
        // A drain spout every few bays, with the stain it leaves below.
        if (salt % 5 === 0 && !before && !after) {
          const sy = -0.2;
          m.box(0, sy, front(sy) + 0.07, 0.11, 0.07, 0.18, 0x8e917f);
          m.box(0, sy + 0.03, front(sy) + 0.08, 0.05, 0.014, 0.18, 0x4f5649);
          m.face(
            [
              [-0.055, sy - 0.04, front(sy) + 0.004],
              [-0.08, foot + 0.1, front(foot) + 0.004],
              [0.07, foot + 0.1, front(foot) + 0.004],
              [0.05, sy - 0.04, front(sy) + 0.004]
            ],
            0x4c5848
          );
        }
      });
      // Moss, grass and fallen stone where the wall meets the slope.
      for (let k = 0; k < (salt % 3 ? 1 : 0); k++) {
        const t = r.range(-0.45, 0.45),
          o = r.range(0.2, 0.42);
        const wx = ex + dz * t + dx * o,
          wz = ez - dx * t + dz * o;
        const y = ground.surface(wx, wz);
        if (y > -1.4) {
          if ((salt + k) % 3 === 0) fern(m, wx, y - 0.02, wz, 0.22);
          else grasses(m, ground, wx, wz, r.range(0.14, 0.24), y - 0.03);
        }
      }
      if (salt % 4 === 1) {
        const wx = ex + dx * 0.35,
          wz = ez + dz * 0.35;
        m.rock(wx, ground.surface(wx, wz) - 0.05, wz, 0.13, 0.11, 0.1, 0x6f766b, 0x8f937f, 6);
      }
    }
  }
}

// Outcrops ring the court where the apron breaks into cliff, kept clear of
// the stairs and the landmarks, with shrubs and ferns on the ledges.
function cliffGarden(m, ground) {
  const keepClear = [
    [-2.06, -8.1, 2.2],
    [3.91, -7.89, 2.6],
    [-7.91, 3.04, 2.4],
    [-3.6, -10.6, 1.8],
    [-8.2, 1.3, 1.5],
    [7.3, 0.6, 1.6],
    [8.55, 1.7, 1.0],
    [-7.65, -2.45, 1.0]
  ];
  const clear = (x, z) => keepClear.every(([a, b, d]) => Math.hypot(x - a, z - b) > d);
  function rim(angle, reach) {
    // March out from the middle until the slope is `reach` from the court.
    const dx = Math.cos(angle),
      dz = Math.sin(angle);
    let t = 3;
    while (t < 20 && ground.distance(dx * t, dz * t) < reach) t += 0.1;
    return [dx * t, dz * t];
  }
  for (let j = 0; j < 40; j++) {
    const a = (j * circle) / 40 + m.rng.range(-0.05, 0.05),
      [x, z] = rim(a, j % 2 ? m.rng.range(1.5, 2.2) : m.rng.range(2.4, 3.2));
    if (!clear(x, z) || ground.surface(x, z) < -4.6) continue;
    outcrop(m, ground, x, z, m.rng.range(0.7, 1.25), a + Math.PI / 2);
  }
  for (let j = 0; j < 34; j++) {
    const a = (j * circle) / 34 + m.rng.range(-0.08, 0.08),
      [x, z] = rim(a, m.rng.range(0.6, 1.4));
    if (!clear(x, z)) continue;
    const y = ground.surface(x, z);
    if (j % 3 === 0) shrub(m, x, y - 0.04, z, m.rng.range(0.4, 0.65), j % 2 === 0);
    else if (j % 3 === 1)
      // A clump of tussocks rather than a scatter of single blades.
      for (let k = 0; k < 3; k++)
        grasses(
          m,
          ground,
          x + m.rng.range(-0.2, 0.2),
          z + m.rng.range(-0.2, 0.2),
          m.rng.range(0.18, 0.3)
        );
    else fern(m, x, y - 0.02, z, 0.3);
  }
}

// Pines stand tall beside the court, so they are drawn as one group the
// cutaway can thin out of the way.
function pines(T, ground) {
  const m = new Model(T, 470467);
  for (const [x, z, scale, yaw, lean, limbs] of [
    [-7.65, -2.45, 1.85, Math.PI + 0.2, 0.7, 6],
    [8.55, 1.7, 1.55, -0.35, 0.95, 4],
    [-6.35, 5.75, 0.62, 2.4, 0.9, 4],
    [6.75, -3.75, 0.66, 0.5, 0.8, 4],
    [-6.6, -6.2, 0.58, 2.0, 0.8, 4],
    [3.9, 8.05, 0.6, -1.4, 0.9, 4],
    [5.9, 5.6, 0.5, -0.9, 0.8, 3],
    [-4.0, 8.15, 0.52, -1.9, 0.9, 3]
  ])
    oldPine(m, x, ground.surface(x, z) - 0.05, z, scale, yaw, lean, limbs);
  // Fallen needles drift on the ground below the two old pines.
  for (const [x, z] of [
    [-7.65, -2.45],
    [8.55, 1.7]
  ])
    for (let k = 0; k < 40; k++) {
      const a = m.rng.range(0, circle),
        d = Math.sqrt(m.rng.next()) * 1.6,
        px = x + Math.cos(a) * d,
        pz = z + Math.sin(a) * d;
      const y = (ground.distance(px, pz) < 0.01 ? 0.05 : ground.surface(px, pz)) + 0.012;
      const t = m.rng.range(0, circle);
      m.face(
        [
          [px, y, pz],
          [px + Math.cos(t) * 0.09, y, pz + Math.sin(t) * 0.09],
          [px + Math.cos(t) * 0.09 + 0.012, y, pz + Math.sin(t) * 0.09 + 0.012]
        ],
        m.rng.pick([0x8a6a45, 0x9b7a4e, 0x7a5d40])
      );
    }
  return m.finish('松影', { occluder: true });
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
  retainingWalls(court, layout, ground);
  tileDressing(court, layout);
  scene.add(court.finish('琴心石坪與引聲燈'));

  const plants = new Model(T, 470449);
  cliffGarden(plants, ground);
  scene.add(plants.finish('石罅與崖草'));
  scene.add(pines(T, ground));
  scene.add(peaksAndClouds(T));
  return scene;
}

export { landform4 };
