// The observatory stands on a mountain top above a sea of cloud: the board is
// a raised dial in the middle of a round paved terrace, walled by a coursed
// drum. The well in the middle goes down through the rock, and the clock's
// conduit crosses the terrace and spills over the balustrade.
import { Model, circle } from '../scenery-kit.js';
import { BED, FOOT, edgeRadius, gateLamps, painter, paving, drum, parapet, footing, spillAngle } from './terrace-9.js';
import { instruments9, clockLamps } from './instruments-9.js';
import { gateways, galleries, galleryLamps } from './gates-9.js';
import { relics9, propLamps } from './props-9.js';
import { gulf, mountainside, farPeaks } from './gulf-9.js';

const stone = 0x54636a;
const coping = 0x87928a;
const bronze = 0x89774e;
const gold = 0xbfa36e;
const patina = 0x517c75;
const water = 0x739f9a;
const clamp = (x, low, high) => Math.max(low, Math.min(x, high));
const mix = (a, b, f) => a + (b - a) * f;

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
    return { inner, rim };
  };
  const bounds = Array.from({ length: samples }, (_, i) => samplesAt(i));
  const at = (i) => bounds[(i + samples) % samples];
  let rowLength;
  for (let j = 0; j < samples; j++) {
    const a = (j * circle) / samples;
    const near = [at(j - 1), at(j), at(j + 1)];
    const inner = Math.min(...near.map((v) => v.inner)) - 0.055;
    const rim = Math.max(...near.map((v) => v.rim)) + 0.06;
    const edge = edgeRadius(a);
    const ridge =
      0.25 * Math.sin(7 * a + 1.43) +
      0.2 * Math.sin(13 * a - 0.84) +
      0.12 * Math.sin(27 * a + 0.18);
    const crease = Math.sin(17 * a + 0.87) + 0.35 * Math.cos(34 * a);
    // Left to right in section: bed of the well, inside wall, the mortar bed
    // under the flags, the backing of the drum, the footing walk, and the
    // bedrock falling away into the cloud. Band 3 is mortar, never seen bare.
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
      [mix(inner, rim, 0.35), BED, 3],
      [mix(inner, rim, 0.72), BED, 3],
      [rim, BED, 3],
      [edge - 0.01, BED, 3],
      [edge - 0.01, FOOT - 0.02, 3],
      [edge + 1.76, FOOT - 0.02, 3],
      [edge + 1.76, FOOT - 0.52, 0],
      [edge + 2.05 + 0.3 * ridge, FOOT - 0.8 + 0.1 * crease, 2],
      [edge + 1.75 + 0.4 * ridge, FOOT - 1.5 + 0.15 * crease, 0],
      [edge + 2.6 + 0.5 * ridge, FOOT - 2.05 + 0.2 * crease, 2],
      [edge + 2.35 + 0.5 * ridge, FOOT - 2.8 + 0.2 * crease, 1],
      [edge + 3.5 + 0.7 * ridge, FOOT - 3.5 + 0.2 * crease, 2],
      [edge + 4.9 + 0.9 * ridge, FOOT - 5.4 + 0.2 * crease, 0]
    ];
    rowLength = profile.length;
    for (let k = 0; k < rowLength; k++) {
      const [r, y, band] = profile[k];
      const phase = a + (k < 8 || k > 16 ? 0.011 * Math.sin(k * 1.89 + 2 * a) : 0);
      const x = r * Math.cos(phase),
        z = r * Math.sin(phase);
      verts.push(x, y, z);
      const tone =
        band === 0
          ? [0x30414e, 0x536169]
          : band === 1
            ? [0x4b5b64, 0x808985]
            : band === 2
              ? [0x4f5f66, 0x7c8887]
              : [0x222a2c, 0x2f383a];
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
  // The last reach runs out across the flags and leaves through a bronze
  // spout in the balustrade, falling down the drum to a basin on the walk.
  const lip = edgeRadius(spillAngle);
  const out = (r, y) => [Math.cos(spillAngle) * r, y, Math.sin(spillAngle) * r];
  const end = [[6.29, 0.218, 8.31], [6.85, 0.15, 8.2], out(11.4, 0.0), out(lip - 0.02, -0.1)];
  race(m, end);
  for (const p of end.slice(1, 3)) m.box(p[0], p[1] - 0.25, p[2], 0.35, 0.5, 0.32, stone);
  m.tube(out(lip - 0.1, -0.07), out(lip + 0.36, -0.09), 0.1, 0.075, bronze, 8);
  m.tube(out(lip + 0.36, -0.09), out(lip + 0.46, -0.03), 0.075, 0.045, gold, 8);
  const fall = [out(lip + 0.42, -0.12), out(lip + 0.5, -0.35), out(lip + 0.55, -0.9), out(lip + 0.56, -1.9), out(lip + 0.56, FOOT + 0.1)];
  m.line(fall, 0.048, 0xa6c7c3, 7);
  m.line(fall.map(([x, y, z]) => [x + 0.04, y - 0.05, z - 0.03]), 0.03, water, 5);
  // The basin on the footing walk, and its overflow off the lip of the walk.
  const [bx, , bz] = out(lip + 0.62, 0);
  m.lathe(bx, FOOT + 0.04, bz, [[0, 0.42], [0.2, 0.46], [0.24, 0.42], [0.18, 0.36]], coping, 16);
  m.lathe(bx, FOOT + 0.2, bz, [[0, 0.37], [0.003, 0.37]], water, 16);
  for (let j = 0; j < 4; j++)
    m.line(
      [
        [bx + Math.cos(j * 1.6) * 0.12, FOOT + 0.21, bz + Math.sin(j * 1.6) * 0.12],
        [bx + Math.cos(j * 1.6 + 0.5) * 0.28, FOOT + 0.21, bz + Math.sin(j * 1.6 + 0.5) * 0.28]
      ],
      0.01,
      0xc2d8d2,
      4
    );
  m.line([out(lip + 1.0, FOOT + 0.16), out(lip + 1.78, FOOT + 0.05), out(lip + 1.86, FOOT - 0.3), out(lip + 2.1, FOOT - 1.2)], 0.035, water, 5);
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
// Banks of moonlit cloud around the foot of the mountain and far out to the
// horizon. Each bank is a low
// dome whose rim takes the colour of the cloud sea below, so it settles in.
function puff(m, x, y, z, rx, h, rz, top) {
  const r = m.rng,
    n = 9,
    turn = r.range(0, circle);
  const rings = [
    [0, 1, 0x2d3a55],
    [0.45, 0.86, m.mix(0x2d3a55, top, 0.55)],
    [0.82, 0.55, top],
    [1, 0.12, m.mix(top, 0x9ba7c0, 0.25)]
  ];
  const jitter = Array.from({ length: n }, () => r.range(0.8, 1.18));
  let last;
  for (const [k, s, col] of rings) {
    const ring = jitter.map((j, i) => {
      const a = turn + (i * circle) / n;
      return [x + Math.cos(a) * rx * s * j, y + h * k, z + Math.sin(a) * rz * s * j];
    });
    if (last)
      for (let i = 0; i < n; i++) {
        const q = (i + 1) % n;
        m.face([last.ring[i], ring[i], ring[q], last.ring[q]], [m.rgb(last.col), m.rgb(col), m.rgb(col), m.rgb(last.col)]);
      }
    last = { ring, col };
  }
  m.face([...last.ring].reverse(), last.col);
}
function cloudSea(m) {
  const r = m.rng;
  for (let i = 0; i < 64; i++) {
    const near = i < 24;
    const a = (i / (near ? 24 : 40)) * circle + r.range(-0.12, 0.12),
      rad = near ? r.range(16, 19.5) : r.range(22, 50);
    const x = Math.cos(a) * rad,
      z = Math.sin(a) * rad,
      y = -7.15 + r.range(0, 0.35);
    const puffs = near ? 4 : 3,
      size = near ? 1.9 : 2.4 + rad * 0.04;
    for (let k = 0; k < puffs; k++) {
      const s = size * r.range(0.6, 1.3),
        t = a + Math.PI / 2;
      const along = (k - (puffs - 1) / 2) * size * 1.25;
      puff(
        m,
        x + Math.cos(t) * along + r.range(-0.6, 0.6),
        y,
        z + Math.sin(t) * along + r.range(-0.6, 0.6),
        s * 1.7,
        s * r.range(0.2, 0.32),
        s * 1.25,
        m.mix(0x56627f, 0x76819b, r.next())
      );
    }
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
  // The terrace, its drum and balustrade, painted with the light of its lamps.
  const terrace = new Model(T, 52361);
  const lamps = [...gateLamps(), ...clockLamps(), ...galleryLamps(), ...propLamps()];
  const light = painter(terrace, lamps);
  paving(terrace, layout, light);
  drum(terrace, light);
  parapet(terrace, light);
  footing(terrace, light);
  site.add(terrace.finish('環臺石鋪與欄杆'));
  // Gateways and galleries: tall, so the cutaway may fade them from any side.
  const timber = new Model(T, 92011);
  const lit = painter(timber, lamps);
  gateways(timber, lit);
  galleries(timber, lit);
  site.add(timber.finish('四門牌樓與迴廊', { occluder: true }));
  // The observatory's furniture, left as its keepers left it.
  const relics = new Model(T, 93029);
  relics9(relics, painter(relics, lamps));
  site.add(relics.finish('觀星臺遺物', { occluder: true }));
  const hydraulics = new Model(T, 74347);
  waterWorks(hydraulics);
  site.add(hydraulics.finish('漏刻引渠與兩級沉澱池'));
  site.add(...instruments9(T));
  // The fallen centre and the mountain's flanks.
  const fall = new Model(T, 94057);
  gulf(fall, layout);
  mountainside(fall);
  site.add(fall.finish('墜心亂石與山松'));
  const sky = new Model(T, 61813);
  cloudSea(sky);
  farPeaks(sky);
  site.add(sky.finish('臺下雲海', { distant: true, cast: false }));
  site.updateMatrixWorld(true);
  return site;
}

export { landform9 };
