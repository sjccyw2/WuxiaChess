import { Model } from '../scenery-kit.js';
import { pines3 } from './pines-3.js';
import { crag, crags3 } from './crags-3.js';

// The trail is a cut into one massif. The service walks and the bell pavilion
// sit on secondary spurs, while the snowmelt channel leaves the trail to the west.
const packTrail = [
  [-2.38, 8.48],
  [-2.42, 7.04],
  [-2.74, 6.15],
  [-2.67, 5.08],
  [-2.28, 4.2],
  [-2.56, 3.23],
  [-1.71, 2.5],
  [-0.44, 2.13],
  [1.08, 2.03],
  [1.71, 1.35],
  [1.71, 0.39],
  [1.9, -0.29],
  [1.32, -0.85],
  [-0.72, -1.0],
  [-2.32, -1.04],
  [-3.43, -1.2],
  [-3.78, -1.93],
  [-3.8, -2.66],
  [-3.13, -3.26],
  [-2.94, -3.85],
  [-1.82, -4.09],
  [-1.08, -3.97],
  [-1.0, -3.45],
  [-0.48, -3.06],
  [0.5, -3.03],
  [1.65, -3.15],
  [2.81, -3.06],
  [3.73, -3.26],
  [4.01, -3.96],
  [3.51, -4.57],
  [3.03, -5.11],
  [2.81, -5.89],
  [1.75, -6.17],
  [0.54, -6.3],
  [-0.37, -6.47]
];
const gorgeRun = [
  [-1.0, 1],
  [-1.5, 1],
  [-2, 1],
  [-2.5, 1],
  [-3, 1],
  [-3.5, 1],
  [-4, 1],
  [-4.5, 1],
  [-5, 1],
  [-5.5, 1],
  [-6, 1],
  [-6.5, 0.5],
  [-7, 0],
  [-7.5, -0.5],
  [-8, -1],
  [-8.5, -1.5],
  [-9, -2],
  [-9.5, -2.5],
  [-10, -3],
  [-11, -4],
  [-12, -5]
];
const springChannel = [
  [-0.08, -4.68],
  [-0.03, -3.7],
  [0, -3.0],
  [-0.03, -1.95],
  [0.03, -0.93],
  [-0.06, 0.23],
  [-0.2, 0.53],
  [-0.54, 0.83],
  ...gorgeRun
];
const spurs = [
  // End points, radius, crest elevation. Each ridge continues into the main rock.
  [[-8.2, -9.24], [-2.55, -9.33], 1.24, -1.98],
  [[-1.53, -9.92], [3.69, -10.03], 1.91, -1.83],
  [[2.97, -9.75], [2.08, -6.92], 1.26, -1.46],
  [[6.43, -5.06], [8.6, -4.12], 1.59, -1.42],
  [[4.58, -4.18], [7.48, -4.72], 1.01, -1.75],
  [[-7.19, -0.51], [-7.47, 5.23], 1.18, -2.37],
  [[-7.64, 4.25], [-4.53, 3.87], 1.33, -1.97],
  [[-2.82, 6.89], [-2.06, 9.29], 1.13, -1.02]
];

function segmentDistance(x, z, a, b) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}

function pathDistance(x, z, points) {
  let distance = Infinity;
  for (let i = 1; i < points.length; i++) {
    distance = Math.min(distance, segmentDistance(x, z, points[i - 1], points[i]));
  }
  return distance;
}

function measureLand(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const beds = layout.cells
    .filter(({ kind }) => kind !== 'bridge' && kind !== 'reeds')
    .map((c) => [c.x - cx, c.y - cz]);
  return (x, z) => {
    let min = Infinity;
    for (const [u, v] of beds) {
      const dx = Math.max(Math.abs(x - u) - 0.5, 0);
      const dz = Math.max(Math.abs(z - v) - 0.5, 0);
      min = Math.min(min, dx * dx + dz * dz);
      if (min === 0) break;
    }
    return Math.sqrt(min);
  };
}

// A cheap repeatable hash of an integer block, 0 to 1.
function hash(i, j, salt = 0) {
  const n = Math.sin(i * 127.1 + j * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// Granite breaks along two sets of joints into blocks. Each block steps down in
// its own rhythm, so neighbouring blocks leave short vertical faces between them
// and the benches never line up into clean contour rings.
function jointed(x, z, descent) {
  const u = x * 0.89 + z * 0.45,
    v = -x * 0.45 + z * 0.89;
  const i = Math.floor(u / 2.1),
    j = Math.floor(v / 1.45);
  const phase = hash(i, j),
    step = 0.85 + 0.5 * hash(i, j, 1);
  const s = descent / step + phase,
    k = Math.floor(s),
    f = s - k;
  // A narrow, slightly tilted bench, then a steep riser of bare rock.
  const g = f < 0.5 ? 0.08 * (f / 0.5) : 0.08 + 0.92 * ((f - 0.5) / 0.5) ** 0.85;
  const stepped = step * (k + g - phase);
  const t = Math.min(1, Math.max(0, (descent - 0.28) / 0.6));
  return descent + (stepped - descent) * t * t * (3 - 2 * t);
}

function mountainProfile(landDistance, x, z) {
  const shore = landDistance(x, z);
  const grain =
    0.51 * Math.sin(x * 1.21 + z * 0.83) +
    0.29 * Math.sin(z * 2.6 - x * 0.68) +
    0.2 * Math.cos(x * 3.5 - z * 1.93);
  const snow = 0.064 + 0.006 * grain;
  // The shelf was hewn out of the rock: its dressed face stands a couple of metres
  // proud before the natural cliff takes over below it.
  const foot = -1.75 + 0.4 * grain;
  let height = foot - (8.36 + foot) * (1 - Math.exp(-shore * (0.78 + 0.18 * grain)));
  for (const [a, b, radius, crest] of spurs) {
    const t = segmentDistance(x, z, a, b) / radius;
    const ledge = crest + 0.22 * grain - 1.12 * Math.max(0, t - 0.6) ** 1.58;
    height = Math.max(height, ledge);
  }
  height = snow - jointed(x, z, snow - height);
  // A hanging stream has cut through the thinner ridge. Keep clear air under the
  // wooden deck, including its centreline; meltwater is visible through its slats.
  const channel = pathDistance(x, z, springChannel);
  if (channel < 0.57 && z > -4.8 && x > -0.55 && z < 0.53) {
    const trench = (1 - Math.max(0, (channel - 0.17) / 0.4)) ** 1.15;
    height = Math.min(height, snow - 1.32 * trench);
  }
  if ((z > 0.45 || x < -3.6) && x < 0.2 && channel < 0.78) {
    const run = Math.max(0, -x);
    const width = 0.48 + Math.min(0.3, run * 0.056);
    const core = Math.max(0, Math.min(1, (width - channel) / (width - 0.17)));
    const gradient = -1.73 - 0.49 * run;
    height += (gradient - height) * core;
  }
  return Math.max(-8.54, height);
}

function axis(inner, low, high) {
  const points = [low, low + 2.65, -inner - 2, -inner - 1];
  for (let i = -inner * 4; i <= inner * 4; i++) points.push(i * 0.25);
  points.push(inner + 1, inner + 2, high - 2.65, high);
  return points;
}

function interval(values, p) {
  let i = 0;
  while (i < values.length - 2 && values[i + 1] < p) i++;
  return i;
}

function massif(m, layout) {
  const land = measureLand(layout);
  const profile = (x, z) => mountainProfile(land, x, z);
  const xs = axis(10, -17, 17),
    zs = axis(12, -19, 19);
  const nodes = zs.map((z) => xs.map((x) => [x, profile(x, z), z]));
  const surface = (x, z) => {
    const i = interval(xs, x),
      j = interval(zs, z);
    const a = nodes[j][i],
      b = nodes[j][i + 1],
      c = nodes[j + 1][i],
      d = nodes[j + 1][i + 1];
    const u = (x - a[0]) / (b[0] - a[0]),
      v = (z - a[2]) / (c[2] - a[2]);
    if ((i + j) % 2) {
      return u < v
        ? a[1] * (1 - v) + c[1] * (v - u) + d[1] * u
        : a[1] * (1 - u) + b[1] * (u - v) + d[1] * v;
    }
    return u + v <= 1
      ? a[1] * (1 - u - v) + b[1] * u + c[1] * v
      : d[1] * (u + v - 1) + b[1] * (1 - v) + c[1] * (1 - u);
  };
  const colours = nodes.map((row) =>
    row.map(([x, y, z]) => {
      const wind = Math.cos(x * 1.54 - z * 0.93 + Math.sin(z * 0.88)) * 0.5 + 0.5;
      const track = pathDistance(x, z, packTrail);
      const traffic = Math.max(0, 1 - track / 0.65);
      const packed = m.mix(0xa9b4b4, 0x8f9790, 0.18 + 0.21 * wind);
      const snow = m.mix(0xf1f4f3, 0xdbe5ea, 0.62 * wind);
      // Grey granite, warmer where iron weathers out, cold where meltwater stains it.
      const i = Math.floor((x * 0.89 + z * 0.45) / 2.1),
        j = Math.floor((-x * 0.45 + z * 0.89) / 1.45);
      const block = hash(i, j, 2),
        streak = 0.5 + 0.5 * Math.sin(x * 5.3 + z * 1.7 + y * 0.9);
      let rock = m.mix(0x434b51, 0x6c7274, 0.2 + 0.55 * block * (0.6 + 0.4 * streak));
      if (hash(i, j, 3) > 0.78) rock = m.mix(rock, 0x6d6255, 0.45);
      // Deep in the gorge the rock takes the cold of the mist.
      rock = m.mix(rock, 0x7e8f9c, Math.min(0.55, Math.max(0, (-y - 4.2) / 6)));
      // How level the ground is around this node, so snow patches follow the
      // benches rather than flickering from one triangle to the next.
      const e = 0.2,
        gx = (profile(x + e, z) - profile(x - e, z)) / (2 * e),
        gz = (profile(x, z + e) - profile(x, z - e)) / (2 * e);
      const level = 1 / Math.hypot(gx, 1, gz);
      return { snow: m.mix(snow, packed, traffic * 0.95), rock, level, lee: gx * 0.55 + gz * 0.83 };
    })
  );
  function facet(points, palette) {
    const [a, b, c] = points;
    if (Math.max(a[1], b[1], c[1]) < -7.86) return;
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = ab[1] * ac[2] - ab[2] * ac[1];
    const ny = ab[2] * ac[0] - ab[0] * ac[2];
    const nz = ab[0] * ac[1] - ab[1] * ac[0];
    const normalY = Math.abs(ny) / Math.hypot(nx, ny, nz);
    // Snow holds on benches and drifts in on the lee of each step; anything
    // steeper than about fifty degrees sheds it and shows the rock.
    m.face(
      points,
      palette.map((p, k) => {
        const level = 0.72 * p.level + 0.28 * normalY,
          hold = 0.7 + 0.06 * Math.max(-1, Math.min(1, p.lee));
        const t = Math.min(1, Math.max(0, (level - hold) / 0.14));
        const cover = t * t * (3 - 2 * t) * Math.min(1, (points[k][1] + 8.5) / 2.8);
        return m.mix(p.rock, p.snow, cover);
      })
    );
  }
  for (let j = 0; j < zs.length - 1; j++) {
    for (let i = 0; i < xs.length - 1; i++) {
      const a = nodes[j][i],
        b = nodes[j][i + 1],
        c = nodes[j + 1][i],
        d = nodes[j + 1][i + 1];
      const A = colours[j][i],
        B = colours[j][i + 1],
        C = colours[j + 1][i],
        D = colours[j + 1][i + 1];
      if ((i + j) % 2) {
        facet([a, c, d], [A, C, D]);
        facet([a, d, b], [A, D, B]);
      } else {
        facet([a, c, b], [A, C, B]);
        facet([c, d, b], [C, D, B]);
      }
    }
  }
  return surface;
}

// A glacial valley floor conjoins the surrounding mountain bases below the
// playable massif. The outer edge submerges back into the original valley mist.
function valleyFloor(m) {
  const n = 68,
    rings = [];
  for (const radius of [0.3, 5.0, 8.5, 11.6, 15.4, 19.5, 24.1, 29.3, 36.5, 46]) {
    const loop = [];
    for (let i = 0; i < n; i++) {
      const a = (i * Math.PI * 2) / n,
        warp = 1 + 0.068 * Math.cos(a * 3.0) + 0.038 * Math.sin(a * 5.0);
      const x = radius * Math.cos(a) * warp,
        z = radius * Math.sin(a) * warp * 1.08;
      const flow = Math.abs(x + 3.1 * Math.sin(z * 0.14) + 1.8 * Math.cos(z * 0.25));
      const eroded = 0.21 * Math.exp(-(flow * flow) / 6.5);
      const braid =
        Math.sin(a * 4.7 + radius * 0.54) * 0.12 + Math.cos(a * 7.1 - radius * 0.64) * 0.09;
      const depth = -7.22 + braid - eroded - Math.max(0, radius - 31) * 0.15;
      const till = m.mix(
        0x8fa8b6,
        0xb1c2c6,
        0.42 + 0.19 * Math.cos(radius * 0.59 + a * 3.6) + 0.13 * Math.cos(a * 2.0)
      );
      loop.push({ point: [x, depth, z], color: till });
    }
    rings.push(loop);
  }
  for (let j = 1; j < rings.length; j++) {
    const p = rings[j - 1],
      q = rings[j];
    for (let i = 0; i < n; i++) {
      const k = (i + 1) % n;
      m.face(
        [p[i].point, p[k].point, q[k].point, q[i].point],
        [p[i].color, p[k].color, q[k].color, q[i].color]
      );
    }
  }
}

// Follow the outside of the dry shelves. Shared corner samples make one snow
// cornice around each spur, with a smaller overhang in the one-cell-wide ravines.
function snowCornices(m, layout, floor) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const dry = new Set(
    layout.cells
      .filter((c) => c.kind !== 'bridge' && c.kind !== 'reeds')
      .map((c) => c.x + ',' + c.y)
  );
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1]
  ];
  const edges = [],
    at = new Map();
  const key = (x, z) => x + ',' + z;
  for (const c of layout.cells) {
    if (!dry.has(key(c.x, c.y))) continue;
    const corners = [
      [c.x - 0.5, c.y - 0.5],
      [c.x + 0.5, c.y - 0.5],
      [c.x + 0.5, c.y + 0.5],
      [c.x - 0.5, c.y + 0.5]
    ];
    for (let i = 0; i < 4; i++) {
      const [dx, dz] = dirs[i];
      if (dry.has(key(c.x + dz, c.y - dx))) continue;
      const [x, z] = corners[i],
        id = key(x, z);
      const edge = { x, z, dir: i, used: false };
      edges.push(edge);
      if (!at.has(id)) at.set(id, []);
      at.get(id).push(edge);
    }
  }
  for (const first of edges) {
    if (first.used) continue;
    const loop = [];
    let edge = first;
    while (edge && !edge.used) {
      edge.used = true;
      loop.push(edge);
      const [dx, dz] = dirs[edge.dir];
      const successors = at.get(key(edge.x + dx, edge.z + dz)) || [];
      // At a diagonal contact the right turn stays on this side of the ravine.
      const choices = [1, 0, 3].map((turn) => (edge.dir + turn) % 4);
      edge = choices.map((d) => successors.find((e) => e.dir === d)).find(Boolean);
    }
    const samples = [];
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i],
        prev = loop[(i + loop.length - 1) % loop.length],
        next = loop[(i + 1) % loop.length];
      const [dx, dz] = dirs[a.dir],
        [px, pz] = dirs[prev.dir],
        [qx, qz] = dirs[next.dir];
      for (let j = 0; j < 4; j++) {
        const t = j / 4,
          begin = Math.max(0, 1 - t * 2.8),
          end = Math.max(0, 1 - (1 - t) * 2.8);
        let nx = dz + pz * begin + qz * end,
          nz = -dx - px * begin - qx * end;
        const length = Math.hypot(nx, nz);
        nx /= length;
        nz /= length;
        const x = a.x + t * dx - cx,
          z = a.z + t * dz - cz;
        const facing = [0.68, 1.23, 1.52].some((step) =>
          dry.has(key(Math.round(x + cx + nx * step), Math.round(z + cz + nz * step)))
        );
        const vein = Math.sin(x * 1.8 + z * 0.82) * 0.51 + Math.sin(x * 3.1 - z * 1.77) * 0.32;
        const channel = pathDistance(x, z, springChannel) < 0.64 && x > -1.1 && z < 0.89;
        const width = (channel ? 0.07 : facing ? 0.12 : 0.2) * (1 + 0.34 * vein);
        // A wind-rounded lip of snow that curls back under itself onto the rock.
        samples.push(
          [
            [0, 0.068],
            [0.55, 0.05],
            [0.9, 0.0 - 0.02 * vein],
            [1, -0.08 - 0.04 * vein],
            [0.62, -0.15 - 0.05 * vein],
            [0.05, -0.17 - 0.04 * vein]
          ].map(([fraction, y]) => [x + nx * width * fraction, y, z + nz * width * fraction])
        );
      }
    }
    const colors = [0xf0f4f3, 0xe6eeef, 0xd4e1e6, 0xb3c8d2, 0x9fb5c1];
    for (let i = 0; i < samples.length; i++) {
      const a = samples[i],
        b = samples[(i + 1) % samples.length];
      for (let j = 0; j < 5; j++) m.face([a[j], b[j], b[j + 1], a[j + 1]], colors[j]);
    }
  }
}

function packedTrail(m, layout, floor) {
  const kinds = new Map(layout.cells.map((c) => [[c.x, c.y].join(','), c.kind]));
  const cellAt = (x, z) =>
    kinds.get(
      [Math.round(x + (layout.width - 1) / 2), Math.round(z + (layout.height - 1) / 2)].join(',')
    );
  const travel = (p) => p && p !== 'bridge' && p !== 'reeds' && p !== 'rock';
  let last = null,
    total = 0,
    mark = 0.42;
  for (let i = 1; i < packTrail.length; i++) {
    const a = packTrail[i - 1],
      b = packTrail[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1];
    const len = Math.hypot(dx, dz),
      n = Math.ceil(len / 0.17),
      nx = -dz / len,
      nz = dx / len;
    for (let j = i === 1 ? 0 : 1; j <= n; j++) {
      const t = j / n,
        x = a[0] + dx * t,
        z = a[1] + dz * t;
      const w = 0.16 + 0.037 * Math.sin(x * 3.5 + z * 1.18) + 0.017 * Math.cos(x * 1.1 - z * 4.57);
      const row = [-w, -w * 0.65, w * 0.54, w].map((s) => {
        const u = x + nx * s,
          v = z + nz * s;
        return [u, floor(u, v) + 0.006, v];
      });
      if (row.some(([u, y, v]) => y < 0.052 || !travel(cellAt(u, v)))) {
        last = null;
        continue;
      }
      if (last) {
        for (let k = 0; k < 3; k++)
          m.face([last[k], last[k + 1], row[k + 1], row[k]], k === 1 ? 0xa7b4b5 : 0xbdcdd0);
        total += len / n;
        // Human and pack-animal prints survive in a few sheltered bends.
        if (total > mark && (z > 3.4 || (z < -4.4 && x > 1.75))) {
          const offset = Math.round(mark * 2.8) % 2 ? 0.064 : -0.064;
          const u = x + nx * offset,
            v = z + nz * offset,
            h = floor(u, v) + 0.011;
          const advance = 0.054,
            side = 0.021,
            ux = dx / len,
            uz = dz / len;
          m.face(
            [
              [u + ux * advance, h, v + uz * advance],
              [u - nx * side, h, v - nz * side],
              [u - ux * advance * 0.62, h, v - uz * advance * 0.62],
              [u + nx * side, h, v + nz * side]
            ],
            0x859898
          );
          mark = total + 0.31;
        } else if (total > mark) mark = total + 0.31;
      }
      last = row;
    }
  }
}

function mountainWalks(m, ground) {
  // Abutments meet the actual ends of the two off-field timber galleries.
  for (const [angle, bearings] of [
    [
      0.11,
      [
        [-7.74, -8.92, 0.99, 0.66, 0.055],
        [-1.96, -9.57, 1.04, 0.79, 1.73],
        [-1.12, -10.16, 0.92, 0.81, 1.64],
        [-0.45, -10.81, 0.78, 0.75, 1.41]
      ]
    ],
    [
      1.42,
      [
        [-7.47, 4.04, 0.77, 0.58, -0.9],
        [-6.82, -0.36, 0.84, 0.61, 0.49],
        [-6.74, -1.13, 0.76, 0.58, 0.36]
      ]
    ]
  ]) {
    for (const [x, z, rx, rz, y] of bearings) {
      const base = ground(x, z);
      crag(m, x, z, Math.min(base - 0.5, y - 1), Math.max(base + 0.08, y), rx, rz);
    }
  }
  const timber = 0x695649,
    endGrain = 0x8e7964,
    iron = 0x556468;
  // Support every original set of columns with a bed-driven footing and bracing.
  for (const [px, pz, yaw, scale, lift] of [
    [-5.04, -9.23, 0.11, 1, 0],
    [-7.16, (1.37 * 7.5) / 5.5, 1.42, 0.82, -0.96]
  ]) {
    const world = (x, y, z) => [
      px + scale * (x * Math.cos(yaw) + z * Math.sin(yaw)),
      lift + scale * y,
      pz + scale * (-x * Math.sin(yaw) + z * Math.cos(yaw))
    ];
    for (let i = 0; i <= 16; i += 4) {
      const x = -2.16 + i * 0.27,
        h = 0.16 + i * 0.103;
      const feet = [-0.42, 0.42].map((v) => {
        const [u, , w] = world(x, 0, v);
        const bed = ground(u, w);
        m.tube([u, bed - 0.3, w], [u, bed + 0.16, w], 0.157 * scale, 0.119 * scale, 0x73818a, 6);
        m.tube([u, bed + 0.09, w], world(x, h - 0.02, v), 0.073 * scale, 0.067 * scale, timber, 6);
        return [u, bed + 0.18, w];
      });
      for (let side = 0; side < feet.length; side++) {
        const other = side ? -0.42 : 0.42;
        m.tube(feet[side], world(x, h - 0.16, other), 0.052 * scale, 0.043 * scale, endGrain, 5);
      }
      m.tube(
        world(x, h - 0.13, -0.61),
        world(x, h - 0.13, 0.61),
        0.086 * scale,
        0.086 * scale,
        timber,
        6
      );
    }
  }
  // This is the tactical east–west crossing. Its crossheads meet the two
  // existing stringers at z ±0.27; a pair of raked bents rests in the streambed.
  for (const x of [-0.34, 0.34]) {
    const feet = [-0.3, 0.3].map((v) => {
      const z = -3 + v * 1.07,
        y = ground(x * 0.86, z);
      const foot = [x * 0.86, y + 0.08, z];
      m.tube([foot[0], y - 0.13, z], [foot[0], y + 0.14, z], 0.087, 0.081, 0x596971, 6);
      m.tube(foot, [x, -0.078, -3 + v], 0.058, 0.053, timber, 7);
      return foot;
    });
    m.box(x, -0.073, -3, 0.102, 0.12, 0.84, timber);
    m.tube(feet[0], [x, -0.1, -2.71], 0.035, 0.032, endGrain, 5);
    m.tube(feet[1], [x, -0.1, -3.29], 0.035, 0.032, endGrain, 5);
    for (const z of [-3.29, -2.71]) m.box(x, -0.116, z, 0.122, 0.042, 0.065, iron);
  }
  for (const z of [-3.27, -2.73]) m.box(0, -0.052, z, 1.13, 0.085, 0.085, endGrain);
}

function runoff(m, surface) {
  const points = [
    [-0.03, 0.38],
    [-0.045, 0.51],
    [-0.062, 0.59],
    [-0.09, 0.64],
    [-0.14, 0.67],
    [-0.23, 0.71],
    [-0.46, 0.84],
    [-0.78, 0.96],
    ...gorgeRun
  ];
  let last;
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i],
      ahead = points[Math.min(i + 1, points.length - 1)];
    const behind = points[Math.max(0, i - 1)],
      dx = ahead[0] - behind[0],
      dz = ahead[1] - behind[1];
    const len = Math.hypot(dx, dz),
      half = 0.085 + 0.045 * Math.min(1, i / 9);
    const row = [-half, 0, half].map((s) => {
      const u = x - (dz / len) * s,
        v = z + (dx / len) * s;
      const bed = surface(u, v) + 0.035;
      const crest = [-0.003, -0.008, -0.076, -0.38, -0.85];
      return [u, i < crest.length ? Math.max(bed, crest[i]) : bed, v];
    });
    if (last) {
      m.face([last[0], last[1], row[1], row[0]], 0x739ba5);
      m.face([last[1], last[2], row[2], row[1]], i % 3 ? 0x86aeb8 : 0xb4d3d6);
      if (i < 6 && i % 2) m.line([last[1], row[1]], 0.014, 0xc9dedd, 4);
    }
    last = row;
  }
}

function talus(m, surface, land) {
  const fans = [
    [-1.9, -5.06],
    [-4.63, -4.62],
    [3.81, -1.63],
    [4.81, 0.29],
    [-0.76, 4.69],
    [1.05, 5.37],
    [-4.22, 1.15],
    [3.93, 5.91],
    [-4.75, 7.03],
    [2.76, -8.14]
  ];
  for (const [x, z] of fans) {
    for (let i = 0; i < 10; i++) {
      const u = x + m.rng.range(-0.85, 0.85),
        v = z + m.rng.range(-0.49, 0.49);
      const h = surface(u, v),
        radius = m.rng.range(0.075, 0.24);
      if (land(u, v) < radius + 0.08 || h < -6.52 || pathDistance(u, v, springChannel) < 0.25)
        continue;
      // Scree is socketed into the down-slope edge as well as at its centre.
      const floor =
        Math.min(
          h,
          surface(u - radius, v),
          surface(u + radius, v),
          surface(u, v - radius),
          surface(u, v + radius)
        ) - 0.04;
      m.rock(
        u,
        floor,
        v,
        radius,
        h - floor + radius * 0.64,
        radius * 0.73,
        0x737f85,
        i % 3 ? 0xa6b3b4 : 0xd1d9d4,
        6,
        m.rng.range(0, 3.2)
      );
    }
  }
}

function landform3(T, layout) {
  const ground = new Model(T, 39031);
  const surface = massif(ground, layout);
  valleyFloor(ground);
  snowCornices(ground, layout, surface);
  const stream = new Model(T, 39203);
  packedTrail(stream, layout, surface);
  runoff(stream, surface);
  talus(stream, surface, measureLand(layout));
  const trestles = new Model(T, 39439);
  mountainWalks(trestles, surface);
  const group = new T.Group();
  group.name = '聽雪棧・花崗絕壑';
  group.add(
    ground.finish('冰蝕崖身與踏雪馬道'),
    stream.finish('西流雪水與坡積石'),
    trestles.finish('落岩懸棧與雪溝支架', { occluder: true }),
    ...pines3(T, surface),
    ...crags3(T)
  );
  return group;
}

export { landform3, packTrail, pathDistance };
