import { Model, circle } from '../scenery-kit.js';

const clamp = (value) => Math.max(0, Math.min(1, value));
const fade = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

function makeRoute(T, points, width) {
  const curve = new T.CatmullRomCurve3(points.map(([x, z]) => new T.Vector3(x, 0, z)));
  const samples = curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.28));
  const sections = samples.slice(1).map((b, i) => {
    const a = samples[i],
      dx = b.x - a.x,
      dz = b.z - a.z;
    return { x: a.x, z: a.z, dx, dz, length2: dx * dx + dz * dz };
  });
  return { curve, sections, width };
}

function routes(T, layout) {
  const west = -layout.width / 2,
    rim = layout.height / 2;
  return [
    makeRoute(
      T,
      [
        [4.5, -rim],
        [4.45, -rim - 0.8],
        [3.35, -7.15],
        [2.36, -8.18],
        [1.53, -10.32],
        [-0.72, -12.25]
      ],
      0.69
    ),
    makeRoute(
      T,
      [
        [5.5, rim],
        [5.51, rim + 0.8],
        [4.91, 7.13],
        [3.21, 8.02],
        [2.52, 9.48],
        [2.88, 12.1]
      ],
      0.74
    ),
    makeRoute(
      T,
      [
        [-5.48, -2.44],
        [-5.54, -3.16],
        [-6.42, -4.15],
        [-6.25, -5.62],
        [-7.49, -7.36],
        [-10.01, -8.23],
        [-13.52, -8.26]
      ],
      0.56
    ),
    makeRoute(
      T,
      [
        [-4.49, 2.45],
        [-4.35, 3.12],
        [-4.49, 3.72],
        [-5.53, 4.31],
        [-6.15, 5.78],
        [-7.78, 6.91]
      ],
      0.48
    ),
    makeRoute(
      T,
      [
        [west, 0.02],
        [west - 0.7, -0.02],
        [west - 1.56, -0.49]
      ],
      0.71
    )
  ];
}

function pathDistance(x, z, roads) {
  let nearest = Infinity;
  for (const { sections, width } of roads) {
    let squared = Infinity;
    for (const s of sections) {
      const px = x - s.x,
        pz = z - s.z;
      const t = clamp((px * s.dx + pz * s.dz) / s.length2);
      const ax = px - s.dx * t,
        az = pz - s.dz * t;
      squared = Math.min(squared, ax * ax + az * az);
    }
    nearest = Math.min(nearest, Math.sqrt(squared) / width);
  }
  return nearest;
}

// The earth continues under the paving and the landmark foundations. Its outer
// edge sinks below the scene's existing survey plane around an irregular rim.
// The same triangulation is sampled when planting the verge and laying ruts.
function makeEarth(T, layout, roads, ditch) {
  const halfX = layout.width / 2,
    halfZ = layout.height / 2;
  const cells = layout.cells.map(({ x, y }) => [x + 0.5 - halfX, y + 0.5 - halfZ]);
  const base = -0.79,
    step = 0.49,
    nx = 67,
    nz = 55;
  const x0 = -((nx - 1) * step) / 2,
    z0 = -((nz - 1) * step) / 2;
  const positions = [],
    colors = [],
    indices = [],
    heights = [];
  const clay = new T.Color(0x947756),
    straw = new T.Color(0x898459),
    moss = new T.Color(0x62785a),
    wet = new T.Color(0x68694f),
    road = new T.Color(0xa88b6a),
    earth = new T.Color(0x675446),
    tint = new T.Color();
  // Old tree bases sit on survey plinths, so carry root soil over their caps.
  const knolls = [
    [4.75, -8.04, 2.4, 2.45, -0.016],
    [-3.63, -7.63, 1.96, 2.1, -0.019],
    [8.48, -2.11, 1.62, 1.75, -0.018],
    [-10.19, 2.78, 2.5, 3.6, -0.115],
    [-8.92, -2.68, 1.4, 2.29, -0.132],
    [8.85, -3.18, 1.8, 1.2, -0.15],
    [8.04, 2.77, 0.89, 1.98, -0.142]
  ];
  for (let row = 0; row < nz; row++) {
    for (let col = 0; col < nx; col++) {
      const x = x0 + col * step,
        z = z0 + row * step;
      let gap2 = Infinity;
      for (const [cx, cz] of cells) {
        const dx = Math.max(Math.abs(cx - x) - 0.5, 0);
        const dz = Math.max(Math.abs(cz - z) - 0.5, 0);
        gap2 = Math.min(gap2, dx * dx + dz * dz);
      }
      const distance = Math.sqrt(gap2),
        path = pathDistance(x, z, roads);
      const crest = Math.sin(x * 0.77 + Math.sin(z * 0.93)) * Math.cos(z * 0.51);
      const till = Math.sin(z * 1.71 + x * 0.53 + Math.sin(x)) * 0.5 + 0.5;
      const cuff = fade(distance / 2.35);
      const rim = Math.hypot(
        (x + 0.38 * Math.sin(z * 0.57)) / 15.1,
        (z - 0.4 * Math.sin(x * 0.61)) / 11.94
      );
      const approach = (1 - fade(path - 0.58)) * (1 - fade(distance / 2));
      const gutter = (1 - fade(Math.abs(path - 1.48) / 0.59)) * fade(distance / 0.65);
      const crown = -0.183 + 0.022 * crest + 0.043 * approach;
      const inner = crown + cuff * (-0.29 + 0.12 * crest + 0.04 * till) - gutter * 0.066;
      const wash = pathDistance(x, z, [ditch]);
      const damp = 1 - fade((wash - 0.24) / 0.93);
      let grade = inner + Math.min(0, -0.57 - 0.13 * fade((z - 4.7) / 5.5) - inner) * damp;
      for (const [cx, cz, rx, rz, crown] of knolls) {
        const radius = Math.hypot((x - cx) / rx, (z - cz) / rz);
        const mound = (1 - fade((radius - 0.47) / 0.65)) * fade(distance / 0.98);
        grade += Math.max(0, crown - grade) * mound;
      }
      const outer = fade((rim - 0.63) / 0.4);
      const height = grade * (1 - outer) + (base - 0.065) * outer;
      heights.push(height);
      positions.push(x, height, z);
      const grass = fade((path - 0.72) / 1.48);
      tint
        .copy(clay)
        .lerp(straw, grass * (0.29 + 0.36 * till))
        .lerp(moss, grass * (0.29 + 0.19 * crest));
      tint
        .lerp(road, (1 - fade((path - 0.55) / 0.58)) * 0.86)
        .lerp(wet, Math.max(gutter * 0.53, damp * 0.91))
        .lerp(earth, outer);
      colors.push(tint.r, tint.g, tint.b);
    }
  }
  for (let z = 0; z < nz - 1; z++) {
    for (let x = 0; x < nx - 1; x++) {
      const a = z * nx + x,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      if (Math.max(heights[a], heights[b], heights[c], heights[d]) < base - 0.008) continue;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const surface = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 })
  );
  surface.name = '驛道夯土、路肩與低窪草甸';
  surface.receiveShadow = true;
  const at = (x, z) => {
    const u = (x - x0) / step,
      v = (z - z0) / step;
    const i = Math.floor(u),
      j = Math.floor(v);
    if (i < 0 || i >= nx - 1 || j < 0 || j >= nz - 1) return base;
    const a = j * nx + i,
      du = u - i,
      dv = v - j;
    const a0 = heights[a],
      b0 = heights[a + 1],
      c0 = heights[a + nx],
      d0 = heights[a + nx + 1];
    return du + dv <= 1
      ? a0 + du * (b0 - a0) + dv * (c0 - a0)
      : d0 + (1 - du) * (c0 - d0) + (1 - dv) * (b0 - d0);
  };
  return { surface, at };
}

function wheelMarks(m, at, route, end, size) {
  const count = Math.ceil((route.curve.getLength() * end) / 0.14);
  for (const side of [-1, 1]) {
    let previous;
    for (let i = 0; i <= count; i++) {
      const t = 0.025 + ((end - 0.025) * i) / count;
      const p = route.curve.getPointAt(t),
        v = route.curve.getTangentAt(t);
      const wear =
        (0.72 + 0.28 * Math.sin(i * 0.39 + side)) *
        (1 - 0.57 * fade((t - end * 0.8) / (end * 0.2)));
      const center = side * size + Math.sin(i * 0.2 + side) * 0.017;
      const edge = [-1, 1].map((n) => {
        const shift = center + n * 0.036 * wear;
        const x = p.x + v.z * shift,
          z = p.z - v.x * shift;
        return [x, at(x, z) + 0.012, z];
      });
      if (previous) m.face([previous[0], edge[0], edge[1], previous[1]], 0x887354);
      previous = edge;
    }
  }
}

// One threshold for each physical gate. Local depth always points off the road.
function aprons(m, at, layout) {
  const gates = [
    [-layout.width / 2, 0, -1, 0, 1.28],
    [4.5, -layout.height / 2, 0, -1, 0.84],
    [5.5, layout.height / 2, 0, 1, 0.87],
    [-5.5, -2.5, 0, -1, 0.76],
    [-4.5, 2.5, 0, 1, 0.78]
  ];
  for (const [x, z, dx, dz, w] of gates) {
    const end = 0.93;
    const point = (width, d, lift = 0) => {
      const px = x + dx * d - dz * width,
        pz = z + dz * d + dx * width;
      const weight = fade(d / end);
      return [px, 0.028 * (1 - weight) + (at(px, pz) + 0.014) * weight + lift, pz];
    };
    for (let i = 0; i < 5; i++) {
      const a = (end * i) / 5,
        b = (end * (i + 1)) / 5;
      // Compacted bedding also supports the joints between neighbouring stones.
      m.face(
        [
          point(-0.5 * w, a, -0.006),
          point(0.5 * w, a, -0.006),
          point(0.5 * w, b, -0.006),
          point(-0.5 * w, b, -0.006)
        ],
        0x8b7b61
      );
      const start = i % 2 === 0 ? -0.13 : 0.12;
      for (const [lo, hi] of [
        [-0.5, start - 0.007],
        [start + 0.007, 0.5]
      ]) {
        const y = m.rng.range(0.001, 0.003);
        m.face(
          [
            point(lo * w, a, y),
            point(hi * w, a, y),
            point(hi * w, b - 0.008, y),
            point(lo * w, b - 0.008, y)
          ],
          m.rng.pick([0xa99a79, 0xa38e71, 0xb4a482])
        );
      }
    }
    for (const side of [-1, 1]) {
      const p = point((side * w) / 2, 0),
        q = point((side * w) / 2, end * 0.55),
        r = point((side * w) / 2, end);
      for (const [u, v] of [
        [p, q],
        [q, r]
      ]) {
        const bottom = ([xx, , zz]) => [xx, at(xx, zz) - 0.025, zz];
        m.face([u, v, bottom(v), bottom(u)], 0x80745b);
      }
    }
  }
}

function trough(m, at) {
  const x = -3.74,
    z = 4.37,
    yaw = -0.55,
    c = Math.cos(yaw),
    s = Math.sin(yaw);
  const foot = (a, b) => at(x + a * c + b * s, z - a * s + b * c);
  const corners = [
    [-0.92, -0.33],
    [-0.92, 0.33],
    [0.92, -0.33],
    [0.92, 0.33]
  ].map(([a, b]) => foot(a, b));
  const floor = Math.min(...corners) - 0.055,
    seat = Math.max(...corners) + 0.018;
  const stone = 0x827d66,
    rim = 0xa6a58a,
    iron = 0x5e675b,
    wood = 0x846447;
  m.frame(x, 0, z, yaw, 1, () => {
    m.box(0, (floor + seat) / 2, 0, 1.84, seat - floor, 0.72, stone);
    m.box(0, seat + 0.07, 0, 1.72, 0.14, 0.63, 0x8d8a72);
    for (const depth of [-0.265, 0.265]) {
      m.box(0, seat + 0.265, depth, 1.72, 0.33, 0.085, stone);
      m.box(0, seat + 0.442, depth, 1.78, 0.054, 0.105, rim);
    }
    for (const side of [-1, 1]) {
      m.box(0.814 * side, seat + 0.27, 0, 0.095, 0.34, 0.49, stone);
      m.box(0.814 * side, seat + 0.444, 0, 0.119, 0.05, 0.49, rim);
    }
    // A bored outlet discharges into the swale below the east end.
    m.tube([0.82, seat + 0.286, 0.026], [1.015, seat + 0.256, 0.026], 0.055, 0.047, 0x596a61, 9);
    m.tube([1.015, seat + 0.256, 0.026], [1.018, seat + 0.255, 0.026], 0.032, 0.032, 0x35463e, 8);
    const water = seat + 0.353;
    m.face(
      [
        [-0.766, water, -0.23],
        [-0.766, water, 0.23],
        [0.766, water, 0.23],
        [0.766, water, -0.23]
      ],
      0x72988b
    );
    for (const [a, b, len] of [
      [-0.65, 0.104, 0.33],
      [0.12, -0.074, 0.47],
      [-0.32, -0.14, 0.15]
    ]) {
      m.face(
        [
          [a, water + 0.002, b],
          [a + len * 0.67, water + 0.002, b + 0.016],
          [a + len, water + 0.002, b + 0.009]
        ],
        0xb1c1a9
      );
    }
    const rail = 0.68,
      y = seat + 0.62;
    for (const end of [-0.69, 0.69]) {
      const soil = foot(end, rail) - 0.045;
      m.rock(end, soil, rail, 0.127, 0.13, 0.13, stone, rim, 6);
      m.tube([end, soil, rail], [end, y + 0.075, rail], 0.061, 0.054, wood, 7);
    }
    m.tube([-0.8, y, rail], [0.8, y, rail], 0.048, 0.047, wood, 7);
    for (const end of [-0.52, 0.54]) m.hoop(end, y - 0.053, rail, 0.061, 0.012, iron, 13, 'xy');
    m.line(
      [
        [-0.51, y - 0.1, rail],
        [-0.27, y - 0.24, rail + 0.06],
        [-0.06, y - 0.25, rail + 0.06],
        [0.18, y - 0.17, rail + 0.03],
        [0.44, y + 0.016, rail]
      ],
      0.014,
      0xb59969,
      5
    );
  });
}

function physicGarden(m, at) {
  const c = Math.cos(0.18),
    s = Math.sin(0.18),
    x = -1.69,
    z = -4.1;
  const locate = (a, b, lift) => {
    const px = x + a * c + b * s,
      pz = z - a * s + b * c;
    return [px, at(px, pz) + lift, pz];
  };
  for (const center of [-0.38, 0.37]) {
    const edges = [];
    for (let i = 0; i <= 9; i++) {
      const a = -1.13 + (2.26 * i) / 9;
      const row = [-0.24, -0.14, 0.12, 0.24].map((b, j) =>
        locate(a, center + b, j === 1 || j === 2 ? 0.092 : 0.004)
      );
      if (edges.length) {
        const prev = edges.at(-1);
        for (let k = 0; k < 3; k++)
          m.face([prev[k], prev[k + 1], row[k + 1], row[k]], k === 1 ? 0x866744 : 0x937855);
      }
      edges.push(row);
      if (!i || i === 9) continue;
      const plant = locate(a + m.rng.range(-0.05, 0.05), center + m.rng.range(-0.05, 0.05), 0.077);
      for (let leaf = 0; leaf < 6; leaf++) {
        const angle = (circle * leaf) / 6 + m.rng.range(-0.3, 0.3);
        const len = m.rng.range(0.09, 0.15);
        m.leaf(
          plant,
          [
            plant[0] + Math.cos(angle) * len,
            plant[1] + (i % 3 ? 0.1 : 0.16),
            plant[2] + Math.sin(angle) * len
          ],
          0.031,
          0x61764e,
          0x93a065,
          0.045
        );
      }
    }
  }
  // Short reed hurdles keep the medicinal plots clear of the relay horses.
  const posts = Array.from({ length: 9 }, (_, i) => locate(-1.32 + i * 0.33, -0.88, -0.035));
  for (const p of posts) m.tube(p, [p[0] + 0.018, p[1] + 0.41, p[2]], 0.028, 0.019, 0x8f7252, 6);
  for (let j = 0; j < 4; j++) {
    const reed = posts.map(([px, py, pz], i) => [
      px,
      py + 0.1 + 0.066 * j,
      pz + ((i + j) % 2 ? 0.027 : -0.027)
    ]);
    m.line(reed, 0.018, j % 2 ? 0xa88d60 : 0xb59a68, 4);
  }
}

function litter(m, at, layout) {
  const inside = (x, z) =>
    layout.mask[Math.floor(z + layout.height / 2)]?.[Math.floor(x + layout.width / 2)] === '#';
  for (const [cx, cz, rx, rz] of [
    [-4.05, -3.18, 1.35, 0.6],
    [-5.92, 3.34, 1.14, 0.5],
    [1.89, -6.48, 1.29, 0.7],
    [5.63, 6.9, 1.22, 0.76],
    [-1.46, 3.28, 0.83, 0.48]
  ]) {
    for (let i = 0; i < 27; i++) {
      const angle = m.rng.range(0, circle),
        radius = Math.sqrt(m.rng.next());
      const x = cx + rx * Math.cos(angle) * radius,
        z = cz + rz * Math.sin(angle) * radius;
      if (inside(x, z)) continue;
      const length = m.rng.range(0.048, 0.088),
        yaw = m.rng.range(0, circle),
        c = Math.cos(yaw),
        s = Math.sin(yaw);
      const center = [x, at(x, z) + 0.011, z];
      const outline = Array.from({ length: 11 }, (_, j) => {
        const a = ((j - 5) * Math.PI) / 7.6,
          l = length * (j % 2 === 0 ? 1 : 0.39);
        const dx = Math.sin(a) * l,
          dz = Math.cos(a) * l;
        const xx = x + dx * c + dz * s,
          zz = z - dx * s + dz * c;
        return [xx, at(xx, zz) + 0.008, zz];
      });
      const leaf = m.rng.pick([0xa04d30, 0xb85932, 0xc77942, 0xb79249, 0xaa7141]);
      for (let j = 1; j < outline.length; j++)
        m.face([center, outline[j - 1], outline[j]], leaf, j % 2 ? 1 : 0.91);
    }
  }
}

function drainage(m, at, ditch, roads) {
  const stone = [0x88765d, 0x8f8569, 0x93896d],
    stem = [0x657954, 0x8b915b, 0x9c955f];
  let previous;
  for (let i = 0; i <= 50; i++) {
    const t = i / 50,
      point = ditch.curve.getPointAt(t),
      v = ditch.curve.getTangentAt(t);
    const width =
      (0.075 + 0.018 * Math.sin(i * 0.62) + 0.028 * t) * (1 - 0.95 * fade((t - 0.78) / 0.22));
    const edge = [-1, 1].map((side) => {
      const x = point.x + side * v.z * width,
        z = point.z - side * v.x * width;
      return [x, at(x, z) + 0.011, z];
    });
    if (previous)
      m.face([previous[0], edge[0], edge[1], previous[1]], i < 22 ? 0x667967 : 0x74735a);
    previous = edge;
    if (i < 3 || i > 44 || i % 3 === 0) continue;
    const side = i % 2 === 0 ? -1 : 1,
      step = m.rng.range(0.15, 0.32) * side;
    const x = point.x + v.z * step,
      z = point.z - v.x * step;
    m.rock(
      x,
      at(x, z) - 0.024,
      z,
      m.rng.range(0.08, 0.16),
      m.rng.range(0.07, 0.13),
      m.rng.range(0.08, 0.15),
      m.rng.pick(stone),
      0x9b9677,
      6,
      i
    );
  }
  for (const [x, z, rx, rz, count] of [
    [-1.2, 5.5, 1.4, 0.7, 17],
    [-1.5, 7, 0.8, 1.3, 14],
    [-2.5, -6.25, 1.35, 0.7, 18],
    [-4.9, -5.0, 0.75, 0.89, 12],
    [0.45, -4.08, 0.39, 1.18, 13],
    [4.0, 6.88, 1.0, 0.86, 11],
    [-4.27, 6.7, 1.09, 0.62, 12],
    [9.4, 0.09, 1.34, 0.62, 10]
  ]) {
    for (let k = 0; k < count; k++) {
      const a = m.rng.range(0, circle),
        r = Math.sqrt(m.rng.next());
      const xx = x + Math.cos(a) * r * rx,
        zz = z + Math.sin(a) * r * rz;
      if (pathDistance(xx, zz, roads) < 1.12) continue;
      const y = at(xx, zz) - 0.018;
      for (let j = 0; j < 6; j++) {
        const az = m.rng.range(0, circle),
          length = m.rng.range(0.071, 0.18);
        const dx = Math.cos(az) * length,
          dz = Math.sin(az) * length,
          high = m.rng.range(0.102, 0.245),
          w = m.rng.range(0.014, 0.026);
        m.face(
          [
            [xx - (dz * w) / length, y, zz + (dx * w) / length],
            [xx + 0.32 * dx, y + high * 0.6, zz + 0.32 * dz],
            [xx + dx, y + high, zz + dz],
            [xx + (dz * w) / length, y, zz - (dx * w) / length]
          ],
          m.rng.pick(stem)
        );
      }
    }
  }
  // Set a few rounded stones into the dry ridge above the swale.
  for (const [x, z, r] of [
    [0.1, 4.1, 0.39],
    [-0.28, 4.07, 0.21],
    [0.05, 4.38, 0.17],
    [-2.74, 6.15, 0.25],
    [-3.02, 6.07, 0.16],
    [-4.69, -5.2, 0.3],
    [-4.97, -5.21, 0.19],
    [0.63, -5.11, 0.29]
  ]) {
    m.rock(x, at(x, z) - r * 0.22, z, r, r * 0.77, r * 0.83, 0x7b7761, 0x949575, 8);
  }
}

function landform1(T, layout) {
  const group = new T.Group();
  group.name = '紅楓驛・三路驛堤';
  const roads = routes(T, layout),
    ditch = makeRoute(
      T,
      [
        [-2.9, 4.88],
        [-2.28, 5.23],
        [-1.68, 5.27],
        [-1.05, 5.79],
        [-1.31, 6.56],
        [-1.06, 7.3],
        [-0.29, 7.92],
        [-0.61, 9.13],
        [-1.42, 10.65]
      ],
      0.57
    ),
    { surface, at } = makeEarth(T, layout, roads, ditch);
  group.add(surface);
  const verge = new Model(T, 823319);
  roads
    .slice(0, 4)
    .forEach((road, i) =>
      wheelMarks(verge, at, road, i === 3 ? 0.88 : 0.89, i === 3 ? 0.19 : 0.31)
    );
  aprons(verge, at, layout);
  litter(verge, at, layout);
  group.add(verge.finish('轍印、石質緩坡與秋葉', { cast: false }));
  const yard = new Model(T, 157933);
  drainage(yard, at, ditch, roads);
  trough(yard, at);
  physicGarden(yard, at);
  group.add(yard.finish('飲馬槽、繫韁欄與藥畦'));
  return group;
}

export { landform1 };
