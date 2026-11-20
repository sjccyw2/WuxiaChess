import { Model, circle } from '../scenery-kit.js';
import { valley, yardMaple, rick, milestone, reds, golds } from './country-1.js';

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
  // Runs of sections share a bounding box, so distant ones are skipped quickly.
  const runs = [];
  for (let i = 0; i < sections.length; i += 12) {
    const run = sections.slice(i, i + 12);
    const xs = run.flatMap((s) => [s.x, s.x + s.dx]),
      zs = run.flatMap((s) => [s.z, s.z + s.dz]);
    runs.push({
      run,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs)
    });
  }
  return { curve, sections, runs, width };
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
        [-0.72, -12.25],
        [-2.1, -17.5],
        [-1.2, -24.5],
        [-3.6, -34]
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
        [2.88, 12.1],
        [3.9, 17.2],
        [2.6, 23.5],
        [4.8, 32]
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
        [-13.52, -8.26],
        [-19.5, -9.7],
        [-26.5, -8.6],
        [-37, -11.5]
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
        [-7.78, 6.91],
        [-11.2, 9.1],
        [-17, 11.6],
        [-27, 16.5]
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
  for (const { runs, width } of roads) {
    for (const { run, minX, maxX, minZ, maxZ } of runs) {
      const bx = Math.max(minX - x, 0, x - maxX),
        bz = Math.max(minZ - z, 0, z - maxZ);
      if (Math.sqrt(bx * bx + bz * bz) / width >= nearest) continue;
      let squared = Infinity;
      for (const s of run) {
        const px = x - s.x,
          pz = z - s.z;
        const t = clamp((px * s.dx + pz * s.dz) / s.length2);
        const ax = px - s.dx * t,
          az = pz - s.dz * t;
        squared = Math.min(squared, ax * ax + az * az);
      }
      nearest = Math.min(nearest, Math.sqrt(squared) / width);
    }
  }
  return nearest;
}

// Deterministic value noise: patches of grass, bare clay and fallen leaves,
// and the shape of the wooded hills that close the valley.
const hash = (x, z) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x, z) {
  const i = Math.floor(x),
    j = Math.floor(z),
    u = fade(x - i),
    v = fade(z - j);
  const a = hash(i, j),
    b = hash(i + 1, j),
    c = hash(i, j + 1),
    d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// The grid keeps its fine spacing over the station and stretches beyond it,
// so the valley floor and its hills reach the haze without many more faces.
function stretchedAxis(cells, step, extra, grow) {
  const half = ((cells - 1) * step) / 2;
  const coordinate = (i) => {
    const u = -half + (i - extra) * step,
      t = Math.abs(u) - half;
    return t <= 0 ? u : Math.sign(u) * (half + t + grow * t * t);
  };
  const values = Array.from({ length: cells + 2 * extra }, (_, i) => coordinate(i));
  // Finds the cell holding a coordinate and the fraction across it.
  const locate = (x) => {
    const a = Math.abs(x) - half,
      u = a <= 0 ? x : Math.sign(x) * (half + (-1 + Math.sqrt(1 + 4 * grow * a)) / (2 * grow));
    const i = Math.min(values.length - 2, Math.max(0, Math.floor((u + half) / step + extra)));
    return [i, (x - values[i]) / (values[i + 1] - values[i])];
  };
  return { values, locate };
}

// Maples whose leaves drift onto the ground around them.
const maples = [
  [4.75, -8.04, 2.9],
  [-3.63, -7.63, 2.4],
  [8.48, -2.11, 2.2],
  [-9.6, -5.6, 1.9],
  [10.4, 4.6, 2.1],
  [-3.2, 8.4, 1.8]
];

// Low wooded hills ring the valley; the post roads leave through gaps in them.
function countryHeight(x, z, path) {
  const reach = Math.hypot(x, z * 1.14);
  const roll = 0.2 * (noise(x * 0.17, z * 0.17) - 0.5) + 0.07 * (noise(x * 0.53, z * 0.53) - 0.5);
  const gap = Math.max(fade((path - 1.6) / 7), fade((reach - 28) / 6));
  const rise = fade((reach - 17.5) / 14) * (1.5 + 3.4 * noise(x * 0.062 + 3.1, z * 0.062 + 7.7));
  const ridge = fade((reach - 22) / 9) * 1.1 * (noise(x * 0.21 + 9, z * 0.21 - 4) - 0.35);
  return -0.36 + roll + (rise + ridge) * gap;
}

// The earth continues under the paving and the landmark foundations, then
// rolls out across the valley floor to the wooded hills at its rim.
// The same triangulation is sampled when planting the verge and laying ruts.
function makeEarth(T, layout, roads, ditch) {
  const halfX = layout.width / 2,
    halfZ = layout.height / 2;
  const cells = layout.cells.map(({ x, y }) => [x + 0.5 - halfX, y + 0.5 - halfZ]);
  const base = -0.79,
    step = 0.49;
  const columns = stretchedAxis(67, step, 24, 0.052),
    rowsAxis = stretchedAxis(55, step, 22, 0.052);
  const nx = columns.values.length,
    nz = rowsAxis.values.length;
  const positions = [],
    colors = [],
    indices = [],
    heights = [];
  const clay = new T.Color(0x8a6f55),
    straw = new T.Color(0x898155),
    hay = new T.Color(0x9c9170),
    moss = new T.Color(0x5a6b44),
    wet = new T.Color(0x66674d),
    road = new T.Color(0xa88b6a),
    rust = new T.Color(0x95492c),
    tint = new T.Color(),
    wood = new T.Color();
  const woods = [0x7c3326, 0xa2452a, 0xbb6431, 0x5d5a3c, 0xb38a3a, 0x8c3d2a].map(
    (c) => new T.Color(c)
  );
  // Old tree bases and the station's platforms sit on survey plinths, so carry
  // soil over their caps; the platforms keep their full height even beside the paving.
  const knolls = [
    [4.75, -8.04, 3.0, 3.0, -0.016],
    [-3.63, -7.63, 2.5, 2.6, -0.019],
    [8.48, -2.11, 2.1, 2.2, -0.018],
    [-10.19, 2.78, 2.7, 4.6, -0.036],
    [-8.92, -2.68, 2.3, 3.3, -0.036],
    [8.85, -3.18, 2.1, 1.5, -0.036],
    [8.04, 2.77, 1.5, 3.1, -0.036]
  ];
  for (let row = 0; row < nz; row++) {
    for (let col = 0; col < nx; col++) {
      const x = columns.values[col],
        z = rowsAxis.values[row];
      // Beyond three units every use of the distance has levelled out.
      const clear = Math.abs(x) > halfX + 3 || Math.abs(z) > halfZ + 3;
      let gap2 = clear ? 9 : Infinity;
      if (!clear)
        for (const [cx, cz] of cells) {
          const dx = Math.max(Math.abs(cx - x) - 0.5, 0);
          const dz = Math.max(Math.abs(cz - z) - 0.5, 0);
          gap2 = Math.min(gap2, dx * dx + dz * dz);
        }
      const distance = Math.sqrt(gap2),
        path = pathDistance(x, z, roads);
      const crest = Math.sin(x * 0.77 + Math.sin(z * 0.93)) * Math.cos(z * 0.51);
      const till = Math.sin(z * 1.71 + x * 0.53 + Math.sin(x)) * 0.5 + 0.5;
      const cuff = fade(distance / 2.6);
      const rim = Math.hypot(
        (x + 0.38 * Math.sin(z * 0.57)) / 15.1,
        (z - 0.4 * Math.sin(x * 0.61)) / 11.94
      );
      const approach = (1 - fade(path - 0.58)) * (1 - fade(distance / 2));
      const gutter = (1 - fade(Math.abs(path - 1.48) / 0.59)) * fade(distance / 0.65);
      const crown = -0.128 + 0.022 * crest + 0.03 * approach;
      const inner = crown + cuff * (-0.3 + 0.12 * crest + 0.04 * till) - gutter * 0.066;
      const wash = pathDistance(x, z, [ditch]);
      const damp = 1 - fade((wash - 0.24) / 0.93);
      let grade = inner + Math.min(0, -0.57 - 0.13 * fade((z - 4.7) / 5.5) - inner) * damp;
      for (const [cx, cz, rx, rz, crown] of knolls) {
        const radius = Math.hypot((x - cx) / rx, (z - cz) / rz);
        const mound =
          (1 - fade((radius - 0.47) / 0.65)) * (crown < -0.03 ? 1 : fade(distance / 0.98));
        grade += Math.max(0, crown - grade) * mound;
      }
      const outer = fade((rim - 0.66) / 0.5);
      const height = grade * (1 - outer) + countryHeight(x, z, path) * outer;
      heights.push(height);
      positions.push(x, height, z);
      // Ground colour: dry grass in broad patches, greener in the hollows,
      // bare clay where feet and wheels wear it, red leaf fall under the maples.
      const broad = noise(x * 0.31 + 4, z * 0.31 - 2),
        fine = noise(x * 1.07 - 7, z * 1.07 + 3),
        grass = fade((path - 0.72) / 1.48);
      tint
        .copy(clay)
        .lerp(straw, grass * (0.45 + 0.4 * broad))
        .lerp(moss, grass * fade((0.62 - broad) / 0.4) * (0.75 + 0.2 * crest))
        .lerp(hay, grass * fade((fine - 0.62) / 0.25) * 0.55)
        .lerp(clay, grass * fade((fine - 0.78) / 0.15) * 0.5 * (1 - outer));
      let fall = 0;
      for (const [mx, mz, r] of maples) {
        const d = Math.hypot(x - mx, z - mz) / r;
        fall = Math.max(fall, (1 - fade((d - 0.35) / 0.8)) * (0.45 + 0.35 * fine));
      }
      tint.lerp(rust, fall * grass * 0.5);
      tint
        .lerp(road, (1 - fade((path - 0.55) / 0.58)) * 0.86)
        .lerp(wet, Math.max(gutter * 0.53, damp * 0.91));
      // Leaf canopies colour the wooded hillsides when seen from the board.
      const forest = fade((height + 0.05) / 0.9) * outer;
      if (forest > 0) {
        const pick = noise(x * 0.42 + 11, z * 0.42 - 6) * (woods.length - 0.01);
        wood
          .copy(woods[Math.floor(pick)])
          .lerp(woods[Math.min(woods.length - 1, Math.floor(pick) + 1)], pick % 1);
        tint.lerp(wood, forest * 0.85);
      }
      const hush = fade((Math.hypot(x, z) - 24) / 14) * 0.35;
      tint.multiplyScalar(0.94 + 0.12 * fine - hush * 0.25);
      colors.push(tint.r, tint.g, tint.b);
    }
  }
  for (let z = 0; z < nz - 1; z++) {
    for (let x = 0; x < nx - 1; x++) {
      const a = z * nx + x,
        b = a + 1,
        c = a + nx,
        d = c + 1;
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
    const [i, du] = columns.locate(x),
      [j, dv] = rowsAxis.locate(z);
    if (du < 0 || du > 1 || dv < 0 || dv > 1) return base;
    const a = j * nx + i;
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

// Small-scale ground cover the coarse earth grid cannot carry: patches of
// greener and drier grass, tufts along the paving and the road verges, and
// drifts of maple leaves under the trees.
function meadow(m, at, layout, roads) {
  const halfX = layout.width / 2,
    halfZ = layout.height / 2;
  const cells = layout.cells.map(({ x, y }) => [x + 0.5 - halfX, y + 0.5 - halfZ]);
  const fromPaving = (x, z) => {
    let nearest = Infinity;
    for (const [cx, cz] of cells) {
      const dx = Math.max(Math.abs(cx - x) - 0.5, 0),
        dz = Math.max(Math.abs(cz - z) - 0.5, 0);
      nearest = Math.min(nearest, dx * dx + dz * dz);
    }
    return Math.sqrt(nearest);
  };
  const r = m.rng;
  const blades = [0x6d7a4c, 0x7f8752, 0x8f8c58, 0x99905c, 0x5f6e45];
  const tuft = (x, z, size) => {
    const y = at(x, z) - 0.01,
      count = 4 + Math.floor(r.next() * 4);
    for (let j = 0; j < count; j++) {
      const a = r.range(0, circle),
        length = r.range(0.05, 0.13) * size,
        high = r.range(0.09, 0.2) * size,
        w = r.range(0.012, 0.022);
      const dx = Math.cos(a) * length,
        dz = Math.sin(a) * length;
      m.face(
        [
          [x - Math.sin(a) * w, y, z + Math.cos(a) * w],
          [x + 0.35 * dx, y + high * 0.62, z + 0.35 * dz],
          [x + dx, y + high, z + dz],
          [x + Math.sin(a) * w, y, z - Math.cos(a) * w]
        ],
        r.pick(blades)
      );
    }
  };
  const patch = (x, z, w, d, col) => {
    const k = 9,
      turn = r.range(0, circle),
      ring = [];
    for (let j = 0; j < k; j++) {
      const a = turn + (circle * j) / k,
        q = r.range(0.7, 1.2),
        px = x + Math.cos(a) * w * q,
        pz = z + Math.sin(a) * d * q;
      ring.push([px, at(px, pz) + 0.009, pz]);
    }
    const middle = [x, at(x, z) + 0.011, z],
      edge = m.mix(col, 0x857a55, 0.85);
    for (let j = 0; j < k; j++)
      m.face([middle, ring[(j + 1) % k], ring[j]], [m.rgb(col), m.rgb(edge), m.rgb(edge)]);
  };
  // Patches: greener in the hollows south of the yard, drier on the crowns.
  for (let k = 0; k < 400; k++) {
    const x = r.range(-15, 15),
      z = r.range(-12.5, 12.5);
    if (Math.hypot(x / 15, z / 12.5) > 1) continue;
    if (fromPaving(x, z) < 0.35 || pathDistance(x, z, roads) < 1.15) continue;
    const green = noise(x * 0.31 + 4, z * 0.31 - 2) < 0.5;
    const col = green
      ? r.pick([0x6b6e4a, 0x707550, 0x666a48])
      : r.pick([0x857c56, 0x7d7451, 0x8a6f52]);
    patch(x, z, r.range(0.3, 0.75), r.range(0.15, 0.4), col);
    if (r.next() < 0.55) tuft(x + r.range(-0.2, 0.2), z + r.range(-0.2, 0.2), r.range(0.8, 1.3));
  }
  // Tufts crowd the foot of the paving and the shoulders of the roads, where
  // wheels and hooves never reach.
  for (let k = 0; k < 1500; k++) {
    const x = r.range(-14, 14),
      z = r.range(-11.5, 11.5),
      chance = r.next();
    const paving = fromPaving(x, z),
      edge = paving < 0.9 ? 0.7 - paving * 0.55 : 0;
    // The road is only measured when it could still decide the matter.
    if (paving < 0.08 || chance > Math.max(edge, 0.45, 0.06)) continue;
    const road = pathDistance(x, z, roads);
    if (road < 0.95) continue;
    const want = Math.max(edge, road < 2.2 ? 0.45 * (1 - Math.abs(road - 1.5) / 0.7) : 0, 0.06);
    if (chance > want) continue;
    tuft(x, z, r.range(0.7, 1.25));
  }
  // Leaves drift into the grass beneath each maple, thickest toward the trunk.
  for (const [mx, mz, reach] of maples) {
    for (let k = 0; k < 120; k++) {
      const a = r.range(0, circle),
        q = reach * Math.pow(r.next(), 0.7),
        x = mx + Math.cos(a) * q,
        z = mz + Math.sin(a) * q * 0.85;
      if (fromPaving(x, z) < 0.05) continue;
      const y = at(x, z) + 0.014,
        b = r.range(0, circle),
        len = r.range(0.05, 0.09);
      m.leaf(
        [x, y, z],
        [x + Math.cos(b) * len, y + 0.004, z + Math.sin(b) * len],
        len * 0.45,
        r.pick([0x9c3d26, 0xb5512c, 0xc76c35, 0xb28a45, 0x8a3a28]),
        r.pick([0xc65a2f, 0xd98a44]),
        0.004
      );
    }
  }
}

// Last night's rain still stands in the wheel ruts near the station, and the
// road shoulders carry loose gravel kicked out by hooves.
function roadside(m, at, roads) {
  const r = m.rng;
  roads.slice(0, 4).forEach((route, n) => {
    const size = n === 3 ? 0.19 : 0.31,
      length = route.curve.getLength();
    for (let t = 0.03; t < Math.min(0.9, 13 / length); t += 0.9 / length) {
      const p = route.curve.getPointAt(t),
        v = route.curve.getTangentAt(t);
      if (r.next() < 0.17) {
        const side = r.next() < 0.5 ? -1 : 1,
          long = r.range(0.24, 0.5),
          wide = r.range(0.06, 0.1),
          cx = p.x + v.z * side * size,
          cz = p.z - v.x * side * size;
        const ring = Array.from({ length: 8 }, (_, j) => {
          const a = (j * circle) / 8,
            u = Math.cos(a) * long * r.range(0.85, 1.1),
            w = Math.sin(a) * wide * r.range(0.8, 1.15);
          const x = cx + v.x * u + v.z * w,
            z = cz + v.z * u - v.x * w;
          return [x, at(x, z) + 0.017, z];
        });
        const middle = [cx, at(cx, cz) + 0.018, cz];
        for (let j = 0; j < 8; j++)
          m.face(
            [middle, ring[(j + 1) % 8], ring[j]],
            [m.rgb(0xa7b4ad), m.rgb(0x6c766f), m.rgb(0x6c766f)]
          );
      }
      for (let k = 0; k < 2; k++) {
        if (r.next() < 0.35) continue;
        const side = r.next() < 0.5 ? -1 : 1,
          off = side * r.range(0.45, 0.75),
          x = p.x + v.z * off + r.range(-0.2, 0.2),
          z = p.z - v.x * off + r.range(-0.2, 0.2),
          s = r.range(0.025, 0.05);
        m.rock(x, at(x, z) - 0.01, z, s, s * 0.7, s * 0.85, 0x8a8273, 0xaaa290, 5);
      }
    }
  });
}

// Leaves blown across the brick road settle in its joints, more of them on
// the tiles nearest the maples; the paving itself stays clear to read.
function strewnLeaves(m, layout) {
  const halfX = layout.width / 2,
    halfZ = layout.height / 2,
    r = m.rng;
  for (const { x, y, kind } of layout.cells) {
    if (kind !== 'plain') continue;
    const cx = x + 0.5 - halfX,
      cz = y + 0.5 - halfZ;
    let near = 0;
    for (const [mx, mz, reach] of maples)
      near = Math.max(near, 1 - Math.hypot(cx - mx, cz - mz) / (reach * 2.6));
    const count = Math.floor(r.next() * 2.2 + near * 6);
    for (let k = 0; k < count; k++) {
      const px = cx + r.range(-0.44, 0.44),
        pz = cz + r.range(-0.44, 0.44),
        b = r.range(0, circle),
        len = r.range(0.05, 0.08);
      m.leaf(
        [px, 0.041, pz],
        [px + Math.cos(b) * len, 0.043, pz + Math.sin(b) * len],
        len * 0.45,
        r.pick([0xa8442a, 0xbf5a2e, 0xcf7a3a, 0xb98d46]),
        r.pick([0xc65a2f, 0xd98a44]),
        0.003
      );
    }
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
  meadow(verge, at, layout, roads);
  strewnLeaves(verge, layout);
  roadside(verge, at, roads);
  group.add(verge.finish('轍印、石質緩坡與秋葉', { cast: false }));
  const yard = new Model(T, 157933);
  drainage(yard, at, ditch, roads);
  trough(yard, at);
  physicGarden(yard, at);
  milestone(yard, at, 6.75, 7.35, 0.9);
  group.add(yard.finish('飲馬槽、繫韁欄與藥畦'));
  group.add(valley(T, at, (x, z) => pathDistance(x, z, roads) * 0.6));
  group.add(
    yardMaple(T, at, '驛後小楓與草垛', -9.6, -5.6, 0.95, golds, 51127, (m) =>
      rick(m, at, -10.9, -3.9, 0.95)
    )
  );
  group.add(yardMaple(T, at, '東院紅楓', 10.4, 4.6, 1.05, reds, 77713));
  group.add(yardMaple(T, at, '槽邊幼楓', -3.2, 8.4, 0.85, reds, 90313));
  return group;
}

export { landform1 };
