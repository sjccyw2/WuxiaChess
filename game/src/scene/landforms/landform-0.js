// The ferry streets stand above a tidal creek. Their facing stones meet silt,
// gravel and reed banks, while the bridge bents and working landings reach the bed.
import { Model, circle } from '../scenery-kit.js';

const water = -0.65;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

function riverProfile(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const banks = layout.cells
    .filter((cell) => cell.kind !== 'bridge')
    .map(({ x, y }) => [x - cx, y - cz]);
  const fieldDistance = (x, z) => {
    let nearest = Infinity;
    for (const [xx, zz] of banks) {
      const dx = Math.max(0, Math.abs(x - xx) - 0.5);
      const dz = Math.max(0, Math.abs(z - zz) - 0.5);
      const sq = dx * dx + dz * dz;
      nearest = Math.min(nearest, sq);
      if (!nearest) break;
    }
    return Math.sqrt(nearest);
  };

  // The small east-bank slip and west gangplank each grow out of their own bank.
  // Bedrock below the wharf lies within reach of the existing five timber piles.
  function height(x, z) {
    const shoalX = 3.74 - 0.15 * (z - 5.1);
    const shoal = Math.hypot((x - shoalX) / 0.91, (z - 5.11) / 1.56);
    const gangplank = Math.hypot((x + 1.93) / 0.51, (z - 5.24) / 0.76);
    const distance = fieldDistance(x, z);
    const drift = 0.5 + 0.5 * Math.sin(2.02 * x + 1.33 * z + Math.sin(z * 1.7) * 0.49);
    const narrow = 0.35 + 0.28 * drift;
    const bed = -1.52 + 0.083 * Math.sin(z * 0.73 + x) + 0.027 * Math.cos(x * 2.36 - z * 2.1);
    // Only a narrow lip of wet silt shows at the foot of each quay; the channels
    // between the street blocks hold open water, not a dry ditch.
    const shore = lerp(-0.56, bed, smooth(0, narrow + 0.3, distance));
    const landing = lerp(-0.12, bed, smooth(0.27, 1.39, shoal));
    const boatFoot = lerp(-0.1, bed, smooth(0.29, 1.35, gangplank));
    const dockD = Math.hypot((x + 1.89) / 1.17, (z - 7.19) / 2.17);
    const dockBed = lerp(-0.975, bed, smooth(0.99, 1.6, dockD));
    // Deposits accumulate on the inside of the west meander and against the
    // stone approach to the east. Their toes taper into the tidal water.
    const west = Math.hypot((x + 5.62 + 0.25 * Math.sin(z * 1.1)) / 1.21, (z + 2.29) / 2.12);
    const east = Math.hypot((x - 5.38 + 0.23 * Math.sin(z * 1.26)) / 1.02, (z - 1.49) / 1.39);
    const bars = lerp(-0.5, bed, smooth(0.24, 1.23, Math.min(west, east)));
    return Math.max(shore, landing, boatFoot, dockBed, bars);
  }
  return { height, fieldDistance };
}

function alluvium(m, profile) {
  // Shared corner vertices keep the two irregular banks continuous across the
  // old street blocks; the outer edge of this mesh is entirely below water.
  const { p, c, i } = m.parts[0];
  function samples(start, bands) {
    const values = [start];
    for (const [end, spacing] of bands) {
      const origin = values.at(-1),
        count = Math.ceil((end - origin) / spacing);
      for (let j = 1; j <= count; j++) values.push(lerp(origin, end, j / count));
    }
    return values;
  }
  const xs = samples(-8.5, [
    [-5.9, 0.6],
    [5.95, 0.245],
    [12.5, 0.7]
  ]);
  const zs = samples(-10.7, [
    [-6.6, 0.61],
    [6.9, 0.245],
    [10.4, 0.44]
  ]);
  const columns = xs.length - 1;
  for (let iz = 0; iz < zs.length; iz++) {
    for (let ix = 0; ix < xs.length; ix++) {
      const x = xs[ix],
        z = zs[iz],
        y = profile.height(x, z),
        streak = 0.5 + 0.5 * Math.sin(0.84 * x + z * 4.7 + 1.7 * Math.cos(x * 1.8 + z * 0.4));
      const sediment = m.mix(0x4a5d58, 0x8b8665, smooth(water - 0.28, water + 0.45, y));
      const bank = m.mix(sediment, x < 1 ? 0x566744 : 0x6b7353, smooth(-0.53, -0.12, y) * 0.75);
      p.push(x, y, z);
      c.push(...bank.map((channel) => channel * (0.87 + 0.19 * streak)));
      if (ix && iz) {
        const d = iz * (columns + 1) + ix,
          a = d - columns - 2;
        if ((ix + iz) % 2) i.push(a, d - 1, d, a, d, a + 1);
        else i.push(a, d - 1, a + 1, a + 1, d - 1, d);
      }
    }
  }
}

function plantedStreets(m, layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const gardens = layout.cells
    .filter((c) => c.kind === 'bamboo' || c.kind === 'herbs')
    .map(({ x, y, kind }) => [x - cx, y - cz, kind === 'bamboo' ? 0.73 : 0.67]);
  const roots = [];
  for (let a = 0; a < gardens.length; a++) {
    for (let b = a + 1; b < gardens.length; b++) {
      const [ax, az] = gardens[a],
        [bx, bz] = gardens[b];
      const dx = bx - ax,
        dz = bz - az,
        squared = dx * dx + dz * dz;
      if (squared <= 2) roots.push([ax, az, dx, dz, squared]);
    }
  }
  const solid = new Set(
    layout.cells.filter((c) => c.kind !== 'bridge').map((c) => c.y * layout.width + c.x)
  );
  const paved = (i, j) =>
    i >= 0 && j >= 0 && i < layout.width && j < layout.height && solid.has(j * layout.width + i);
  function soil(x, z) {
    const i = Math.round(x + cx),
      j = Math.round(z + cz);
    if (!paved(i, j)) return -0.29;
    let value = -2;
    for (const [px, pz, size] of gardens) {
      const dx = x - px,
        dz = z - pz;
      const d = Math.hypot(dx + 0.24 * Math.sin(pz + px) * dz, dz * (0.88 + 0.12 * Math.cos(px)));
      const lobe = 0.044 * Math.sin(3 * Math.atan2(dz, dx) + px);
      value = Math.max(value, size + lobe - d);
    }
    for (const [ax, az, dx, dz, squared] of roots) {
      const t = clamp(((x - ax) * dx + (z - az) * dz) / squared, 0, 1);
      const bend = 0.095 * Math.sin(Math.PI * t);
      const dist = Math.hypot(x - ax - t * dx + dz * bend, z - az - t * dz - dx * bend);
      value = Math.max(value, 0.6 - dist);
    }
    if (value < -0.16) return value;
    value += 0.053 * Math.sin(x * 6.1 + z * 3.1) + 0.034 * Math.cos(z * 7.8 - x * 3.5);
    // The planting can spill across fitted paving courses, ending inside a
    // real coping stone wherever its contour faces water.
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (paved(i + di, j + dj)) continue;
        const dx = Math.max(0, Math.abs(x - (i + di - cx)) - 0.5);
        const dz = Math.max(0, Math.abs(z - (j + dj - cz)) - 0.5);
        value = Math.min(value, 2.8 * (Math.hypot(dx, dz) - 0.075));
      }
    return value;
  }
  function patch(triangle) {
    const polygon = [];
    for (let i = 0; i < 3; i++) {
      const a = triangle[i],
        b = triangle[(i + 1) % 3];
      if (a[2] > 0) polygon.push(a);
      if (a[2] > 0 !== b[2] > 0) {
        const t = a[2] / (a[2] - b[2]);
        polygon.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), 0]);
      }
    }
    if (polygon.length < 3) return;
    const points = [],
      colors = [];
    for (const [x, z, amount] of polygon) {
      const growth = smooth(0, 0.2, amount);
      const fleck = 0.39 + 0.24 * Math.sin(x * 9.1 + z * 4.3) + 0.23 * Math.cos(z * 5.1 - x * 3.7);
      points.push([x, 0.052 + 0.017 * growth + 0.003 * fleck, z]);
      colors.push(m.mix(0x877d60, m.mix(0x4c634a, 0x839268, fleck), growth));
    }
    m.face(points, colors);
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      if (polygon[i][2] || polygon[j][2]) continue;
      const a = points[i],
        b = points[j];
      m.face([a, b, [b[0], -0.011, b[2]], [a[0], -0.011, a[2]]], 0x776b51);
    }
  }
  const step = 0.2,
    w = layout.width * 5,
    h = layout.height * 5;
  let last = [];
  for (let j = 0; j <= h; j++) {
    const row = [];
    for (let i = 0; i <= w; i++) {
      const x = i * step - layout.width / 2,
        z = j * step - layout.height / 2;
      row.push([x, z, soil(x, z)]);
      if (i && j) {
        patch([last[i - 1], row[i - 1], row[i]]);
        patch([last[i - 1], row[i], last[i]]);
      }
    }
    last = row;
  }
}

function landingStone(m, x, z, rx, rz, top, base, tint) {
  const corners = [
    [-0.76, -1],
    [-1, -0.62],
    [-1, 0.61],
    [-0.63, 1],
    [0.74, 1],
    [1, 0.57],
    [1, -0.65],
    [0.72, -1]
  ];
  const dark = m.mix(tint, 0x324b48, 0.68);
  let previous;
  for (const [y, scale, color] of [
    [base, 1.22, dark],
    [lerp(base, top, 0.65), 1.05, dark],
    [top - 0.042, 1, tint],
    [top, 0.91, m.mix(tint, 0xb1b097, 0.21)]
  ]) {
    const ring = corners.map(([dx, dz]) => [x + dx * rx * scale, y, z + dz * rz * scale]);
    if (previous) {
      for (let k = 0; k < ring.length; k++) {
        const j = (k + 1) % ring.length;
        m.face([previous[k], ring[k], ring[j], previous[j]], color);
      }
    }
    previous = ring;
  }
  m.face(previous, tint);
}

function timberBents(m, layout, profile) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  for (const cell of layout.cells.filter((c) => c.kind === 'bridge')) {
    const middle = cell.x - cx,
      z = cell.y - cz;
    for (const side of [-1, 1]) {
      const x = middle + side * 0.404;
      // This stone riser is keyed back into the faced quay at each bank.
      landingStone(m, middle + side * 0.489, z, 0.16, 0.51, -0.194, -1.51, 0x818879);
      m.box(x, -0.188, z, 0.135, 0.091, 0.928, 0x786044);
      for (const edge of [-1, 1]) {
        const zz = z + 0.384 * edge;
        const foot = Math.min(-1.3, profile.height(x, zz) - 0.12);
        m.tube([x, foot, zz], [x, -0.217, zz], 0.073, 0.054, 0x645645, 8);
        for (const y of [-0.33, -0.307]) {
          m.tube([x, y, zz], [x, y + 0.012, zz], 0.059, 0.059, 0xad9268, 8);
        }
      }
      m.tube([x, -0.77, z - 0.39], [x, -0.225, z + 0.39], 0.031, 0.031, 0x715c46, 6);
    }
  }
}

function sampleGauge(m, x, z, base, top) {
  m.box(x, (base + top) / 2, z, 0.067, top - base, 0.061, 0x6c5842);
  const low = water + 0.012;
  for (let n = 0; low + n * 0.075 < top - 0.022; n++) {
    m.box(x, low + n * 0.075, z + 0.032, n % 4 ? 0.029 : 0.049, 0.012, 0.006, 0xd9c999);
  }
}

function upperQuays(m, profile) {
  const span = 11 / 7,
    z = -3.76 * span;
  // The original two lengths of rail each require a foundation at every post.
  // A narrow gauge jetty stops in the upstream channel, with water below it.
  for (const [a, b, bays] of [
    [-3.46 * span, -2.69 * span, 1],
    [-1.08 * span, 1.31 * span, 3]
  ]) {
    const half = (b - a) / bays / 2;
    for (let n = 0; n <= bays; n++) {
      const x = lerp(a, b, n / bays);
      landingStone(m, x, z, 0.121, 0.215, -0.093, -1.64, 0x808578);
      m.box(x, -0.054, z, 0.23, 0.09, 0.46, 0x75644d);
      if (n === bays) continue;
      m.box(x + half, -0.074, z - 0.103, half * 2 + 0.01, 0.113, 0.086, 0x675541);
      m.box(x + half, -0.074, z + 0.103, half * 2 + 0.01, 0.113, 0.086, 0x675541);
      const boards = Math.ceil((half * 2) / 0.13);
      for (let j = 0; j < boards; j++) {
        m.box(
          x + ((j + 0.5) * (half * 2)) / boards,
          -0.014,
          z,
          (half * 2) / boards - 0.007,
          0.061,
          0.366,
          m.rng.pick([0x957552, 0xa1845f, 0x91724d])
        );
      }
    }
  }
  sampleGauge(m, 2.04, z + 0.171, profile.height(2.04, z) - 0.05, 0.18);
  // Low flared footings carry the two ends of the old limestone arch to the bed.
  for (const x of [(5.29 - 1.67) * span, (5.29 + 1.67) * span]) {
    landingStone(m, x, span, 0.48, 0.98, -0.14, -1.61, 0x859082);
    for (const edge of [-1, 1]) {
      landingStone(m, x, span + edge * 0.74, 0.27, 0.31, -0.31, -1.6, 0x788073);
    }
  }
  landingStone(m, -1.89, 5.6, 0.48, 0.27, -0.044, -1.36, 0x88917e);
}

function reedBed(m, profile) {
  const r = m.rng;
  // Isolated shoals leave the boating channel and both crossing mouths open.
  for (let n = 0, count = 0; n < 1450 && count < 27; n++) {
    const x = r.range(-5.8, 5.85),
      z = r.range(-6.0, 6.45);
    const y = profile.height(x, z);
    if (y < -0.95 || y > -0.19 || (Math.abs(Math.abs(z) - 2) < 0.85 && Math.abs(x - 1) < 1.24))
      continue;
    const distance = profile.fieldDistance(x, z);
    if (distance < 0.24 || (x > 3.1 && z > 5.4)) continue;
    count++;
    for (let k = 0; k < 6; k++) {
      const xx = x + r.range(-0.115, 0.115),
        zz = z + r.range(-0.105, 0.105);
      const base = profile.height(xx, zz) - 0.025;
      // Reeds rooted in deeper silt grow taller to reach the light.
      const h = r.range(0.21, 0.47) + Math.max(0, water - base),
        lean = r.range(-0.067, 0.04);
      m.tube([xx, base, zz], [xx + lean, base + h, zz + 0.035], 0.011, 0.004, 0x899059, 4);
      m.leaf(
        [xx, base + h * 0.34, zz],
        [xx + r.range(-0.15, 0.14), base + h * 0.76, zz + 0.082],
        0.026,
        0x657949,
        0x92a066,
        0.061
      );
      if (k % 3 === 0) {
        m.tube(
          [xx + lean, base + h - 0.042, zz + 0.035],
          [xx + lean * 1.22, base + h + 0.074, zz + 0.038],
          0.018,
          0.006,
          0xa39365,
          5
        );
      }
    }
    if (count % 3 === 0) {
      m.rock(x - 0.04, y - 0.09, z + 0.013, 0.15, 0.15, 0.096, 0x606f69, 0x82907e, 7);
    }
  }
}

function fishingSlip(m, profile) {
  // The low stepped loading slip runs down the east point into the estuary.
  for (let k = 0; k < 7; k++) {
    const x = 3.58 - 0.082 * k,
      z = 5.51 + 0.178 * k,
      top = 0.007 - 0.084 * k;
    landingStone(m, x, z, 0.35 - 0.012 * k, 0.143, top, -1.34, k % 2 ? 0x8b907c : 0x93957d);
  }
  // A fine knotted seine hangs above the exposed shoal. Each crossed diagonal
  // meets the same sagging headrope at its top, and the weighted footrope below.
  const a = [3.98, 0.52, 6.21],
    b = [4.74, 0.46, 6.1];
  for (const pt of [a, b]) {
    const foot = Math.min(-1.18, profile.height(pt[0], pt[2]) - 0.12);
    m.tube([pt[0], foot, pt[2]], [pt[0], pt[1] + 0.051, pt[2]], 0.047, 0.029, 0x73664b, 8);
    for (let h = 0; h < 3; h++) {
      const y = pt[1] - 0.013 * h;
      m.tube([pt[0], y, pt[2]], [pt[0], y + 0.009, pt[2]], 0.035, 0.036, 0xb6a173, 7);
    }
  }
  const point = (u, v) => [
    lerp(a[0], b[0], u),
    lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * 0.075 - v * (0.3 + 0.076 * Math.sin(Math.PI * u)),
    lerp(a[2], b[2], u) + v * 0.048 * Math.sin(Math.PI * u)
  ];
  for (const v of [0, 1]) {
    m.line(
      Array.from({ length: 11 }, (_, i) => point(i / 10, v)),
      v ? 0.009 : 0.015,
      0x978561,
      5
    );
  }
  for (let k = 0; k < 10; k++) {
    m.line([point(k / 10, 0), point((k + 1) / 10, 0.5), point(k / 10, 1)], 0.004, 0x918668, 4);
    m.line(
      [point((k + 1) / 10, 0), point(k / 10, 0.5), point((k + 1) / 10, 1)],
      0.004,
      0xa19977,
      4
    );
    if (!(k % 2)) {
      const [x, y, z] = point((k + 0.5) / 10, 0);
      m.tube([x - 0.022, y, z], [x + 0.022, y, z], 0.019, 0.018, 0xb4a481, 6);
    }
  }
  const bollardX = 3.99,
    bollardZ = 5.72;
  landingStone(m, bollardX, bollardZ, 0.113, 0.127, 0.021, -0.65, 0x8b8e7c);
  m.lathe(
    bollardX,
    0.019,
    bollardZ,
    [
      [0, 0.085],
      [0.046, 0.085],
      [0.058, 0.048],
      [0.139, 0.047],
      [0.156, 0.078],
      [0.188, 0.069]
    ],
    0x797d70,
    9
  );
  const coil = [];
  for (let k = 0; k <= 32; k++) {
    const t = k / 32,
      angle = t * circle * 3.1;
    coil.push([
      bollardX + Math.cos(angle) * 0.065,
      0.066 + 0.046 * t,
      bollardZ + Math.sin(angle) * 0.065
    ]);
  }
  m.line(coil, 0.008, 0xb7a378, 5);
}

function landform0(T, layout) {
  const profile = riverProfile(layout);
  const sediment = new Model(T, 0x51a7ed);
  const works = new Model(T, 0x27c830);
  const plants = new Model(T, 0x91d2c5);
  alluvium(sediment, profile);
  plantedStreets(sediment, layout);
  timberBents(works, layout, profile);
  upperQuays(works, profile);
  fishingSlip(works, profile);
  reedBed(plants, profile);
  const group = new T.Group();
  group.name = '青竹渡潮溝與漁埠';
  group.add(
    sediment.finish('相連的洲岸與河床', { cast: false }),
    works.finish('渡橋橋腳、驗水棧與魚埠'),
    plants.finish('蘆根與河口卵石')
  );
  return group;
}

export { landform0 };
