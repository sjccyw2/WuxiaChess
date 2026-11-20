// The dial, the instrument terraces and both cisterns are quarried from one
// annular outcrop. The opening goes through to the existing star field.
import { Model, circle } from '../scenery-kit.js';

const stone = 0x54636a;
const coping = 0x87928a;
const bronze = 0x89774e;
const gold = 0xbfa36e;
const patina = 0x517c75;
const water = 0x739f9a;
const clamp = (x, low, high) => Math.max(low, Math.min(x, high));
const mix = (a, b, f) => a + (b - a) * f;

// Bounds include the projecting feet of the existing instruments. The smaller
// southern terraces carry the conduit between the large clock and the divider.
const terraces = [
  [-9.8, 5.33, 2.42, 2.42],
  [-7.32, -8.39, 1.16, 1.13],
  [6.11, -8.62, 1.4, 1.36],
  [-8.5, -1.45, 1.38, 1.32],
  [8.47, -3.12, 1.46, 1.43],
  [0.52, -9.11, 1.42, 1.45],
  [3.39, 8.56, 1.5, 1.51],
  [-7.8, 7.3, 1.45, 0.93],
  [-5.4, 7.96, 1.86, 1.64],
  [-2.85, 8.12, 1.52, 0.93],
  [-0.33, 8.35, 1.71, 1.09],
  [5.57, 8.4, 1.78, 1.44]
];

function rayRectangle(dx, dz, x, z, half) {
  const ax =
    Math.abs(dx) < 1e-7
      ? Math.abs(x) <= half
        ? [-Infinity, Infinity]
        : null
      : [(x - half) / dx, (x + half) / dx];
  const az =
    Math.abs(dz) < 1e-7
      ? Math.abs(z) <= half
        ? [-Infinity, Infinity]
        : null
      : [(z - half) / dz, (z + half) / dz];
  if (!ax || !az) return null;
  const lo = Math.max(0, Math.min(...ax), Math.min(...az));
  const hi = Math.min(Math.max(...ax), Math.max(...az));
  return hi >= lo ? [lo, hi] : null;
}

function rayTerrace(dx, dz, [x, z, rx, rz]) {
  const a = (dx / rx) ** 2 + (dz / rz) ** 2;
  const b = (x * dx) / rx ** 2 + (z * dz) / rz ** 2;
  const c = (x / rx) ** 2 + (z / rz) ** 2 - 1;
  const discriminant = b * b - a * c;
  return discriminant < 0 ? 0 : (b + Math.sqrt(discriminant)) / a;
}
function geometry(T, name, verts, colors, indices) {
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mesh = new T.Mesh(
    geo,
    new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      side: T.DoubleSide,
      metalness: 0.045
    })
  );
  mesh.name = name;
  mesh.receiveShadow = mesh.castShadow = true;
  return mesh;
}
function mountain(T, layout) {
  const samples = 144,
    verts = [],
    colors = [],
    indices = [];
  const palette = new Model(T, 14981);
  const cells = layout.cells.map((c) => [
    c.x - (layout.width - 1) / 2,
    c.y - (layout.height - 1) / 2
  ]);
  const samplesAt = (i) => {
    const a = (circle * i) / samples,
      dx = Math.cos(a),
      dz = Math.sin(a);
    let inner = 20,
      rim = 0;
    for (const [x, z] of cells) {
      const cut = rayRectangle(dx, dz, x, z, 0.556);
      if (cut) {
        inner = Math.min(inner, cut[0]);
        rim = Math.max(rim, cut[1]);
      }
    }
    const radius = terraces.reduce((r, v) => Math.max(r, rayTerrace(dx, dz, v)), rim);
    return { inner, rim, radius };
  };
  const bounds = Array.from({ length: samples }, (_, i) => samplesAt(i));
  const at = (i) => bounds[(i + samples) % samples];
  let rowLength;
  for (let j = 0; j < samples; j++) {
    const a = (j * circle) / samples;
    const near = [at(j - 1), at(j), at(j + 1)],
      shoulder = [...near, at(j - 2), at(j + 2)];
    const inner = Math.min(...near.map((v) => v.inner)) - 0.055;
    const rim = Math.max(...near.map((v) => v.rim)) + 0.06;
    let summit = Math.max(rim + 0.45, ...shoulder.map((v) => v.radius)) + 0.24;
    for (let n = 3; n <= 10; n++) {
      const fall = 0.08 * (n - 2) ** 1.55;
      summit = Math.max(summit, at(j - n).radius + 0.23 - fall, at(j + n).radius + 0.23 - fall);
    }
    const ridge =
      0.25 * Math.sin(7 * a + 1.43) +
      0.2 * Math.sin(13 * a - 0.84) +
      0.12 * Math.sin(27 * a + 0.18);
    const crease = Math.sin(17 * a + 0.87) + 0.35 * Math.cos(34 * a);
    const shoulderHeight = -0.42 + 0.16 * ridge;
    // Left to right in section: bed of the well, inside wall, summit, outer
    // ledges, talus. All rings share their vertices around the full mountain.
    const profile = [
      [1.48 + 0.1 * ridge, -10.8 - 0.3 * ridge, 0],
      [1.68 + 0.21 * ridge, -7.52 + 0.26 * ridge, 0],
      [1.83 + 0.29 * ridge, -6.66 + 0.2 * crease, 0],
      [Math.max(1.8, inner - 0.47) + 0.07 * crease, -4.8 + 0.13 * crease, 1],
      [Math.max(1.86, inner - 0.54) + 0.12 * ridge, -3.83 + 0.12 * crease, 1],
      [inner - 0.18, -2.39 + 0.12 * ridge, 0],
      [inner - 0.33, -1.86 + 0.12 * ridge, 1],
      [inner - 0.18, -1.37 + 0.08 * crease, 1],
      [inner - 0.13, -0.7 + 0.08 * ridge, 1],
      [inner, -0.285 + 0.03 * ridge, 2],
      [mix(inner, rim, 0.35), -0.193 + 0.035 * ridge, 2],
      [mix(inner, rim, 0.72), -0.22 + 0.042 * ridge, 2],
      [rim, -0.3 + 0.06 * ridge, 2],
      [mix(rim, summit, 0.63), shoulderHeight + 0.035 * crease, 2],
      [summit, shoulderHeight - 0.11 + 0.045 * crease, 2],
      [summit + 0.25 + 0.16 * ridge, -1.04 + 0.13 * crease, 1],
      [summit + 0.17 + 0.25 * ridge, -1.6 + 0.13 * crease, 0],
      [summit + 0.64 + 0.37 * ridge, -2.11 + 0.19 * crease, 1],
      [summit + 0.78 + 0.38 * ridge, -2.38 + 0.23 * crease, 2],
      [summit + 0.48 + 0.36 * ridge, -3.35 + 0.19 * crease, 0],
      [summit + 0.67 + 0.58 * ridge, -3.98 + 0.15 * crease, 1],
      [summit + 1.27 + 0.68 * ridge, -4.6 + 0.21 * crease, 2],
      [summit + 1.39 + 0.66 * ridge, -4.9 + 0.14 * crease, 1],
      [summit + 1.23 + 0.63 * ridge, -5.68 + 0.2 * crease, 0],
      [summit + 1.9 + 0.83 * ridge, -6.29 + 0.2 * crease, 1],
      [summit + 2.6 + 0.98 * ridge, -7.29 + 0.22 * crease, 1],
      [summit + 3.8 + 1.1 * ridge, -9.85 + 0.21 * crease, 0]
    ];
    rowLength = profile.length;
    for (let k = 0; k < rowLength; k++) {
      const [r, y, band] = profile[k];
      const phase = a + (k < 8 || k > 14 ? 0.011 * Math.sin(k * 1.89 + 2 * a) : 0);
      const x = r * Math.cos(phase),
        z = r * Math.sin(phase);
      verts.push(x, y, z);
      const tone =
        band === 0
          ? [0x30414e, 0x536169]
          : band === 1
            ? [0x4b5b64, 0x808985]
            : [0x53665e, 0x858778];
      const mineral =
        0.42 +
        0.21 * Math.sin(0.71 * x - 0.63 * z + 0.61 * y) +
        0.11 * Math.sin(11 * a + 0.9 * k) +
        0.09 * ridge;
      colors.push(...palette.mix(tone[0], tone[1], clamp(mineral, 0, 1)));
    }
  }
  for (let j = 0; j < samples; j++) {
    const k = (j + 1) % samples;
    for (let i = 0; i < rowLength - 1; i++) {
      const a = j * rowLength + i,
        b = k * rowLength + i,
        c = k * rowLength + i + 1,
        d = j * rowLength + i + 1;
      if ((j + i) % 2) indices.push(a, b, c, a, c, d);
      else indices.push(a, b, d, b, c, d);
    }
  }
  return geometry(T, '貫入星霧的青石山根', verts, colors, indices);
}

function clip(points, axis, limit, sign) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    const da = (a[axis] - limit) * sign,
      db = (b[axis] - limit) * sign;
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const f = da / (da - db);
      out.push([mix(a[0], b[0], f), mix(a[1], b[1], f)]);
    }
  }
  return out;
}
function dialPaving(m, layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const cells = layout.cells
    .filter((c) => c.kind !== 'reeds' && c.kind !== 'bridge')
    .map((c) => [c.x - cx, c.y - cz]);
  const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const rings = [2.1, 3.35, 3.81, 4.52, 5.13, 5.97, 6.8, 7.59, 8.5, 10];
  // Wedge joints continue across tactical cell boundaries. Only channels and
  // the playable silhouette interrupt the compass-rose paving.
  for (let k = 0; k < rings.length - 1; k++) {
    const r = rings[k] + 0.009,
      R = rings[k + 1] - 0.009,
      n = k < 4 ? 22 : 36;
    const phase = ((k % 2) * Math.PI) / n;
    for (let j = 0; j < n; j++) {
      const a = phase + (j * circle) / n + 0.002,
        b = phase + ((j + 1) * circle) / n - 0.002;
      const middle = (a + b) / 2;
      const top = 0.0465 + 0.0008 * Math.sin(j * 0.61 + k * 1.7);
      const tone = m.mix(
        0x455b65,
        0x96a098,
        0.3 + 0.2 * Math.sin(j * 2.37 + k * 0.79) + 0.075 * Math.cos(k)
      );
      // Each piece uses two small, convex sectors so the inner curve remains open.
      for (const [start, end] of [
        [a, middle],
        [middle, b]
      ]) {
        const poly = [polar(r, start), polar(r, end), polar(R, end), polar(R, start)];
        const xs = poly.map((p) => p[0]),
          zs = poly.map((p) => p[1]);
        const loX = Math.min(...xs),
          hiX = Math.max(...xs),
          loZ = Math.min(...zs),
          hiZ = Math.max(...zs);
        for (const [x, z] of cells) {
          if (x + 0.502 <= loX || x - 0.502 >= hiX || z + 0.502 <= loZ || z - 0.502 >= hiZ)
            continue;
          let clipped = clip(poly, 0, x - 0.501, 1);
          clipped = clip(clipped, 0, x + 0.501, -1);
          clipped = clip(clipped, 1, z - 0.501, 1);
          clipped = clip(clipped, 1, z + 0.501, -1);
          if (clipped.length >= 3)
            m.face(
              clipped.map(([u, v]) => [u, top, v]),
              tone
            );
        }
      }
    }
  }
}
function sluiceSupports(m, layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  for (const c of layout.cells.filter((v) => v.kind === 'bridge')) {
    const x = c.x - cx,
      z = c.y - cz;
    for (const d of [-0.3, 0.3]) {
      m.box(x, -0.47, z + d, 0.92, 0.97, 0.112, stone);
      m.box(x, -0.031, z + d, 0.96, 0.047, 0.143, bronze);
      m.box(x, -0.49, z + d, 1, 0.12, 0.2, coping);
    }
    for (const d of [-0.48, 0.48]) m.box(x + d, -0.101, z, 0.13, 0.21, 0.78, stone);
  }
}
function race(m, nodes) {
  // In section the race is an open trapezoid. Its bed, wetted floor and two
  // retaining cheeks join exactly even where its course bends.
  const sides = nodes.map(([x, y, z], i) => {
    const a = nodes[Math.max(0, i - 1)],
      b = nodes[Math.min(nodes.length - 1, i + 1)];
    const dx = b[0] - a[0],
      dz = b[2] - a[2],
      l = Math.hypot(dx, dz);
    const offsets = [
      [-0.221, -0.092],
      [-0.215, 0.115],
      [-0.148, 0.115],
      [-0.114, -0.036],
      [0.114, -0.036],
      [0.148, 0.115],
      [0.215, 0.115],
      [0.221, -0.092]
    ];
    return offsets.map(([w, h]) => [x - (dz / l) * w, y + h, z + (dx / l) * w]);
  });
  for (let i = 1; i < sides.length; i++) {
    const a = sides[i - 1],
      b = sides[i];
    for (let k = 0; k < 7; k++) {
      const color = k === 1 || k === 5 ? gold : k === 3 ? patina : bronze;
      m.face([a[k], a[k + 1], b[k + 1], b[k]], color);
    }
    const aa = mixPoint(a[2], a[3], 0.64),
      ab = mixPoint(a[5], a[4], 0.64);
    const ba = mixPoint(b[2], b[3], 0.64),
      bb = mixPoint(b[5], b[4], 0.64);
    m.face([aa, ab, bb, ba], water);
    m.line([mixPoint(aa, ab, 0.67), mixPoint(ba, bb, 0.59)], 0.008, 0xb4c8b6, 4);
  }
}
const mixPoint = (a, b, f) => a.map((v, i) => mix(v, b[i], f));
function arch(m, a, b) {
  const dx = b[0] - a[0],
    dz = b[2] - a[2],
    length = Math.hypot(dx, dz);
  const x = (a[0] + b[0]) / 2,
    y = (a[1] + b[1]) / 2,
    z = (a[2] + b[2]) / 2;
  const span = length * 0.84;
  m.frame(x, y, z, -Math.atan2(dz, dx), 1, () => {
    for (const p of [-length / 2, length / 2]) {
      m.box(p, -1.3, 0, 0.36, 2.15, 0.51, stone);
      m.box(p, -0.39, 0, 0.47, 0.12, 0.55, coping);
      m.box(p, -1.44, 0, 0.49, 0.18, 0.62, stone);
    }
    const make = (f, back, outer) => {
      const u = (f - 0.5) * span;
      const h = outer ? -0.125 : -0.72 + 0.47 * Math.sqrt(Math.max(0, 1 - ((2 * u) / span) ** 2));
      return [u, h, back * 0.235];
    };
    for (let n = 0; n < 9; n++) {
      const s = n / 9 + 0.0015,
        e = (n + 1) / 9 - 0.0015;
      const c = n === 4 ? 0x909184 : n % 3 === 0 ? 0x6e7b76 : 0x78857e;
      for (const side of [-1, 1])
        m.face(
          [make(s, side, false), make(e, side, false), make(e, side, true), make(s, side, true)],
          c
        );
      m.face([make(s, -1, false), make(e, -1, false), make(e, 1, false), make(s, 1, false)], stone);
    }
    m.box(0, -0.109, 0, length, 0.1, 0.49, coping);
  });
}
function settlingTank(m, x, z, y, rx, rz, inBearing, outBearing) {
  const n = 28;
  const vertex = (i, r, h) => [
    x + rx * r * Math.cos((i * circle) / n),
    y + h,
    z + rz * r * Math.sin((i * circle) / n)
  ];
  const angles = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  for (let i = 0; i < n; i++) {
    const arc = ((i + 0.5) * circle) / n;
    const cut = Math.min(angles(arc, inBearing), angles(arc, outBearing)) < 0.21;
    const h = cut ? 0.004 : 0.131;
    const tone = i % 5 === 0 ? 0x929589 : i % 2 === 0 ? 0x75847d : 0x687a77;
    m.face(
      [vertex(i, 0.99, -1.53), vertex(i + 1, 0.99, -1.53), vertex(i + 1, 1, h), vertex(i, 1, h)],
      tone
    );
    m.face(
      [vertex(i, 1, h), vertex(i + 1, 1, h), vertex(i + 1, 0.88, h), vertex(i, 0.88, h)],
      coping
    );
    m.face(
      [
        vertex(i, 0.88, h),
        vertex(i + 1, 0.88, h),
        vertex(i + 1, 0.82, -0.29),
        vertex(i, 0.82, -0.29)
      ],
      patina
    );
    m.face([[x, y + 0.002, z], vertex(i + 1, 0.87, 0.002), vertex(i, 0.87, 0.002)], water);
  }
  // A float and calibrated rod are confined to the receiving bowl.
  const gx = x - rx * 0.26,
    gz = z + rz * 0.12;
  m.lathe(
    gx,
    y + 0.003,
    gz,
    [
      [0, 0.178],
      [0.025, 0.19],
      [0.077, 0.148],
      [0.083, 0.03]
    ],
    bronze,
    14
  );
  m.tube([gx, y + 0.05, gz], [gx, y + 0.93, gz], 0.033, 0.023, gold, 8);
  for (let j = 0; j < 7; j++)
    m.box(
      gx + 0.031,
      y + 0.19 + j * 0.1,
      gz,
      0.077 + (j % 3 === 0 ? 0.042 : 0),
      0.014,
      0.026,
      0xd8bf86
    );
  m.line(
    [
      [x - 0.36 * rx, y + 0.018, z - 0.34 * rz],
      [x - 0.2 * rx, y + 0.02, z - 0.39 * rz],
      [x + 0.03 * rx, y + 0.018, z - 0.31 * rz]
    ],
    0.013,
    0xa3bcb1,
    5
  );
}
function waterWorks(m) {
  const west = [
    [-9.05, 0.948, 6.29],
    [-8.35, 0.908, 6.96],
    [-7.42, 0.86, 7.46],
    [-6.27, 0.814, 7.8]
  ];
  const south = [
    [-4.6, 0.773, 8.01],
    [-3.31, 0.756, 8.08],
    [-2.02, 0.738, 8.15],
    [-0.73, 0.718, 8.29],
    [0.56, 0.698, 8.36],
    [1.73, 0.678, 8.43],
    [2.97, 0.661, 8.51]
  ];
  const discharge = [
    [3.79, 0.594, 8.62],
    [4.37, 0.532, 8.7],
    [4.73, 0.485, 8.7]
  ];
  for (const run of [west, south, discharge]) {
    for (let i = 1; i < run.length; i++) arch(m, run[i - 1], run[i]);
    race(m, run);
  }
  settlingTank(m, -5.43, 7.94, 0.785, 0.9, 0.66, Math.PI + 0.16, 0.09);
  settlingTank(m, 5.56, 8.64, 0.222, 0.92, 0.73, Math.PI - 0.06, -0.55);
  // The free nappe breaks into the second pool below its lower lip.
  m.line(
    [
      [4.72, 0.515, 8.7],
      [4.81, 0.456, 8.7],
      [4.86, 0.351, 8.7],
      [4.89, 0.235, 8.7]
    ],
    0.052,
    water,
    8
  );
  const end = [
    [6.29, 0.218, 8.31],
    [6.71, 0.14, 8.03],
    [6.98, -0.05, 7.66]
  ];
  race(m, end);
  for (const [x, y, z] of [end[0], end[1], end[2]]) m.box(x, y - 0.56, z, 0.35, 1.1, 0.32, stone);
  m.line(
    [
      [6.98, -0.02, 7.66],
      [7.1, -0.12, 7.55],
      [7.15, -0.33, 7.51],
      [7.16, -0.72, 7.5]
    ],
    0.047,
    water,
    7
  );
  // Overspill stones collect the final discharge on the shoulder.
  for (let j = 0; j < 5; j++) {
    m.rock(
      7.03 + 0.14 * Math.cos(j),
      -0.66 + j * 0.014,
      7.53 + 0.24 * Math.sin(j),
      0.24,
      0.21,
      0.14,
      0x647571,
      0x8b9c8d,
      7,
      j * 0.8
    );
  }
}
function serviceWays(T, m, bed, layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const occupied = (x, z) =>
    layout.mask[Math.floor(z + cz + 0.5)]?.[Math.floor(x + cx + 0.5)] === '#';
  const ray = new T.Raycaster(),
    up = new T.Vector3(),
    down = new T.Vector3(0, -1, 0);
  const height = (x, z) => {
    ray.set(up.set(x, 2, z), down);
    return ray.intersectObject(bed, false)[0]?.point.y ?? -9;
  };
  const roads = [
    [
      [-6.42, 3.91],
      [-7.06, 4.14],
      [-7.77, 4.44],
      [-8.32, 4.64]
    ],
    [
      [-4.67, -5.52],
      [-5.32, -6.36],
      [-6.27, -7.06],
      [-7.04, -7.83]
    ],
    [
      [4.45, -5.52],
      [4.8, -6.35],
      [5.5, -7.17],
      [5.91, -8.02]
    ],
    [
      [-0.09, -7.51],
      [0.08, -7.99],
      [0.31, -8.59]
    ],
    [
      [-7.54, -0.73],
      [-8.03, -0.87],
      [-8.23, -1.12]
    ],
    [
      [6.46, -3.42],
      [7.12, -3.64],
      [7.64, -3.47],
      [7.93, -3.27]
    ],
    [
      [2.22, 7.45],
      [2.49, 7.96],
      [2.91, 8.28]
    ]
  ];
  for (const road of roads) {
    for (let i = 1; i < road.length; i++) {
      const [a, b] = [road[i - 1], road[i]],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz);
      const count = Math.ceil(len / 0.32),
        w = 0.26;
      for (let j = 0; j < count; j++) {
        const q = (j + 0.5) / count;
        const x = mix(a[0], b[0], q),
          z = mix(a[1], b[1], q);
        if (occupied(x, z)) continue;
        const h = height(x, z);
        const step = mix(0.06, 0.16, ((j + i) % 3) / 2);
        m.frame(x, h, z, -Math.atan2(dz, dx), 1, () => {
          m.box(
            0,
            step / 2 - 0.06,
            0,
            len / count - 0.018,
            0.2,
            w * 2,
            (i + j) % 4 === 2 ? 0x828a7e : 0x748079
          );
          if (j % 3 === 1) m.box(0, step / 2 + 0.044, 0, 0.021, 0.008, w * 1.52, 0x998c70);
        });
      }
    }
  }
  // Local quartz seams and scree mark water-worn slopes beneath the conduits.
  // Each trace follows the surface instead of floating across a gully.
  for (const [sx, sz, r, direction] of [
    [-10.53, 7.72, 1.6, 1.59],
    [-8.44, 8.98, 1.21, 0.51],
    [-4.48, 9.09, 1.45, -0.15],
    [1.63, 9.56, 1.32, 0.31],
    [6.87, 9.1, 1.17, -0.64],
    [8.62, -4.83, 1.24, 0.59],
    [-8.61, -6.92, 1.22, -0.53],
    [4.97, -9.62, 1.36, -0.82]
  ]) {
    const strokes = [];
    for (let i = 0; i <= 7; i++) {
      const t = i / 7,
        a = direction + 0.19 * Math.sin(t * 9 + sx);
      const x = sx + Math.cos(a) * r * t,
        z = sz + Math.sin(a) * r * t;
      const h = height(x, z);
      strokes.push([x, h + 0.007, z]);
      if (i === 2 || i === 5) {
        const scale = 0.1 + 0.052 * m.rng.next();
        m.rock(x, h - 0.045, z, scale * 0.82, 0.13, scale * 1.29, 0x475b59, 0x829085, 7, a);
      }
    }
    m.line(strokes, 0.013, 0x95a48d, 4);
  }
}
function innerWell(m, layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  for (const [dx, dz] of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1]
  ]) {
    let x = cx,
      z = cz;
    while (layout.mask[z]?.[x] !== '#') {
      x += dx;
      z += dz;
    }
    const sx = x - cx - dx * 0.5,
      sz = z - cz - dz * 0.5;
    m.frame(sx, 0, sz, Math.atan2(dx, dz), 1, () => {
      // The narrow end of each haunch bites into the rock wall below.
      const sections = [
        [-3.77, 0.51, 0.04],
        [-3.2, 0.46, -0.12],
        [-2.08, 0.39, -0.22],
        [-1.71, 0.54, -0.3],
        [-1.55, 0.53, -0.3],
        [-0.93, 0.33, -0.19]
      ];
      let previous;
      for (const [y, w, q] of sections) {
        const row = [
          [-w, y, 0.18],
          [-w, y, q],
          [w, y, q],
          [w, y, 0.18]
        ];
        if (previous)
          for (let i = 0; i < 3; i++)
            m.face([row[i], row[i + 1], previous[i + 1], previous[i]], stone);
        previous = row;
      }
      m.box(0, -0.9, 0, 0.8, 0.18, 0.55, coping);
      // A bronze throat, stone corbels and an oxidised lip opening into the well.
      m.tube([0, -0.76, 0.24], [0, -0.76, -0.49], 0.129, 0.116, bronze, 11);
      m.tube([0, -0.76, -0.42], [0, -0.76, -0.53], 0.144, 0.129, gold, 12);
      m.line(
        [
          [0, -0.79, -0.54],
          [0, -0.88, -0.65],
          [0, -1.17, -0.72],
          [0, -1.64, -0.74],
          [0, -2.13, -0.79],
          [0, -2.72, -0.8]
        ],
        0.032,
        water,
        6
      );
      for (const side of [-1, 1]) m.box(side * 0.235, -0.76, -0.07, 0.075, 0.16, 0.42, patina);
    });
  }
}
function landform9(T, layout) {
  const site = new T.Group();
  site.name = '漏臺山根與分水工事';
  site.userData = { kind: 'maze-scenery', occluder: false };
  const bed = mountain(T, layout);
  site.add(bed);
  const structure = new Model(T, 42097);
  dialPaving(structure, layout);
  sluiceSupports(structure, layout);
  innerWell(structure, layout);
  site.add(structure.finish('分瓣石盤與四門泄洪嘴'));
  const hydraulics = new Model(T, 74347);
  waterWorks(hydraulics);
  serviceWays(T, hydraulics, bed, layout);
  site.add(hydraulics.finish('漏刻引渠與兩級沉澱池'));
  site.updateMatrixWorld(true);
  return site;
}

export { landform9 };
