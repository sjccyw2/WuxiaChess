// 桃花島的石陣佔據舊泉臺。兩道石門、臨水的汲具與南坡苗圃共用一片起伏的園土。
import { Model, circle } from '../scenery-kit.js';

const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (lo, hi, x) => {
  const t = clamp((x - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
const well = [-0.52, -0.52];
const racePoints = [
  [7.22, 5.07],
  [7.35, 5.57],
  [7.17, 6.13],
  [6.74, 6.68],
  [6.11, 7.13],
  [5.19, 7.53],
  [4.09, 7.83],
  [3.05, 8.04],
  [1.99, 8.32],
  [1.1, 8.78],
  [0.65, 9.38]
];

function segments(points) {
  let length = 0;
  return points.slice(1).map(([x2, z2], i) => {
    const [x, z] = points[i],
      dx = x2 - x,
      dz = z2 - z,
      len = Math.hypot(dx, dz);
    const result = { x, z, dx, dz, len, station: length };
    length += len;
    return result;
  });
}
function nearest(lines, x, z) {
  let d2 = Infinity,
    along = 0;
  for (const line of lines) {
    const t = clamp(((x - line.x) * line.dx + (z - line.z) * line.dz) / (line.len * line.len));
    const dx = x - line.x - line.dx * t,
      dz = z - line.z - line.dz * t,
      n = dx * dx + dz * dz;
    if (n < d2) {
      d2 = n;
      along = line.station + line.len * t;
    }
  }
  return { distance: Math.sqrt(d2), along };
}
const waterHeight = (station) => -0.115 - station * 0.034;
const cisterns = [
  { x: 7.16, z: 4.92, rx: 0.42, rz: 0.39, y: -0.11 },
  {
    x: 0.16,
    z: 9.72,
    rx: 1.11,
    rz: 0.77,
    y: waterHeight(segments(racePoints).reduce((n, line) => n + line.len, 0)) - 0.015
  }
];
function bowlRadius(angle) {
  return 1 + 0.085 * Math.sin(3 * angle + 0.27) + 0.05 * Math.cos(5 * angle - 0.62);
}
const nursery = [
  [5.36, 6.37],
  [4.24, 6.91],
  [2.8, 7.17],
  [5.88, 8.0],
  [4.34, 8.64]
];
function garden(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const tiles = new Map(layout.cells.map((v) => [v.y * layout.width + v.x, v.kind]));
  const tile = (x, z) => {
    const col = Math.floor(x + cx + 0.5),
      row = Math.floor(z + cz + 0.5);
    return layout.mask[row]?.[col] === '#' ? tiles.get(row * layout.width + col) : null;
  };
  const borders = [];
  for (const c of layout.cells) {
    const x = c.x - cx,
      z = c.y - cz;
    for (const [dx, dz] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1]
    ]) {
      if (layout.mask[c.y + dz]?.[c.x + dx] === '#') continue;
      const h = x + dx / 2,
        v = z + dz / 2;
      borders.push(
        ...segments([
          [h - dz / 2, v + dx / 2],
          [h + dz / 2, v - dx / 2]
        ])
      );
    }
  }
  const fromCells = (points) => points.map(([x, y]) => [x - cx, y - cz]);
  const paths = [
    [
      [2.27, -8.6],
      [2.44, -7.64],
      ...fromCells([
        [9, 0],
        [9, 2],
        [9, 5],
        [9, 7],
        [10, 8],
        [10, 9],
        [11, 10],
        [12, 10]
      ]),
      [7.04, 4.1],
      [8.27, 3.6],
      [9.1, 3.57]
    ],
    [
      [-7.9, 4.82],
      [-6.51, 4.01],
      ...fromCells([
        [1, 9],
        [3, 9],
        [3, 8],
        [3, 7],
        [3, 4],
        [3, 2]
      ])
    ],
    [
      [-0.04, 8.3],
      [0.02, 6.4],
      ...fromCells([
        [6, 12],
        [6, 11],
        [6, 10],
        [5, 9],
        [4, 9],
        [3, 9]
      ])
    ],
    fromCells([
      [5, 9],
      [5, 8],
      [6, 8],
      [8, 8],
      [9, 8],
      [10, 8]
    ])
  ].flatMap(segments);
  const race = segments(racePoints);
  function sample(x, z) {
    const kind = tile(x, z),
      path = nearest(paths, x, z).distance;
    const insideWell = !kind && Math.abs(x - well[0]) < 2.8 && Math.abs(z - well[1]) < 2.25;
    const ripple = Math.sin(x * 1.54 + z * 0.38) * Math.cos(0.51 * x - z * 1.13);
    const swell = Math.sin(x * 0.79 - z * 0.54) + 0.61 * Math.sin(x * 1.74 + z * 1.43);
    const fieldTop = 0.047 + 0.0023 * ripple;
    const rimDistance = kind ? 0 : nearest(borders, x, z).distance;
    let y = fieldTop;
    if (insideWell) {
      y = fieldTop - (1.46 + 0.05 * swell) * smooth(0.05, 0.95, rimDistance);
    } else if (!kind) {
      const radius = Math.hypot((x + 0.24) / 12.4, (z + 0.52) / 11.46);
      const shoulder = 0.1 * swell + 0.08 * Math.cos(0.38 * z + 0.88 * x);
      const edge = radius + 0.045 * Math.sin(x * 0.49 + z * 0.48);
      const ground = -0.14 + shoulder - 0.88 * smooth(0.75, 1.09, edge);
      y = mix(fieldTop, ground, smooth(0.18, 1.79, rimDistance));
    }
    const channel = nearest(race, x, z);
    if (channel.distance < 0.56) {
      const crest = waterHeight(channel.along) + 0.055;
      const bed = crest - 0.207 * (1 - smooth(0.115, 0.31, channel.distance));
      y = mix(y, bed, 1 - smooth(0.26, 0.56, channel.distance));
    }
    for (const pond of cisterns) {
      const dx = (x - pond.x) / pond.rx,
        dz = (z - pond.z) / pond.rz,
        radius = Math.hypot(dx, dz);
      if (radius > 1.86) continue;
      const contour = radius / bowlRadius(Math.atan2(dz, dx));
      const basin = pond.y - 0.17 + 0.22 * smooth(0.74, 1.17, contour);
      y = mix(y, basin, 1 - smooth(1.12, 1.56, contour));
    }
    return { y, kind, path, rimDistance, insideWell, ripple, swell, channel };
  }
  return { tile, sample, paths, race };
}

function gardenSoil(T, field) {
  const pos = [],
    col = [],
    ix = [];
  const shade = new T.Color(),
    loam = new T.Color(0x74836e),
    sage = new T.Color(0x959a7a);
  const turf = new T.Color(0x607966),
    dust = new T.Color(0xb1a691),
    dark = new T.Color(0x545f55);
  const wash = new T.Color(0xa59271),
    gravel = new T.Color(0xc7b79e);
  const horizon = new T.Color(0x636e60);
  const cols = 70,
    rows = 62,
    stride = cols + 1;
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      // Displace the sample lattice in plan so the old square pavement never prints through the banks.
      const x = (i - cols / 2) * 0.404 + 0.056 * Math.sin(j * 7.71 + i * 3.81);
      const z = (j - rows / 2) * 0.4 + 0.053 * Math.sin(i * 5.88 + j * 8.19);
      const f = field.sample(x, z);
      const variation = clamp(0.45 + 0.18 * f.swell + 0.15 * f.ripple);
      shade.copy(loam).lerp(sage, variation);
      shade.lerp(turf, 0.18 + 0.18 * Math.sin(0.89 * z - 0.39 * x));
      if (f.kind === 'herbs' || f.kind === 'bamboo') shade.lerp(turf, 0.26);
      const a = Math.atan2(z, x);
      const oct =
        (Math.hypot(x, z) *
          Math.cos(((a + Math.PI * 2 + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8)) /
        Math.cos(Math.PI / 8);
      const promenade = 1 - smooth(0.24, 0.72, Math.abs(oct - 3.33));
      const pathStrength = 1 - smooth(0.22, 0.93, f.path);
      const footpath = Math.max(pathStrength, f.kind ? promenade * 0.87 : 0);
      shade.lerp(dust, footpath * 0.89);
      shade.lerp(gravel, footpath * 0.14 * (1 + f.ripple));
      if (f.insideWell) shade.lerp(dark, clamp(f.rimDistance * 0.66, 0.05, 0.82));
      shade.lerp(wash, (1 - smooth(0.16, 0.57, f.channel.distance)) * 0.72);
      if (!f.insideWell) shade.lerp(horizon, smooth(0.47, 0.88, -f.y) * 0.96);
      pos.push(x, f.y, z);
      col.push(shade.r, shade.g, shade.b);
    }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const n = j * stride + i,
        r = n + 1,
        b = n + stride,
        c = b + 1;
      const exterior = Math.abs(pos[n * 3]) > 3.4 || Math.abs(pos[n * 3 + 2]) > 3.0;
      if (exterior && [n, r, b, c].every((v) => pos[v * 3 + 1] < -0.93)) continue;
      if ((i + j) % 2) ix.push(n, b, r, b, c, r);
      else ix.push(n, b, c, n, c, r);
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  geometry.setIndex(ix);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 });
  const soil = new T.Mesh(geometry, mat);
  soil.name = '泉臺園土與雙門石徑';
  soil.receiveShadow = true;
  return soil;
}

// A broad tilted flagstone follows the local ground, including at the stone gates.
function flag(m, field, x, z, angle, long, wide, color) {
  const fx = Math.cos(angle),
    fz = Math.sin(angle),
    dx = -fz,
    dz = fx;
  const ring = [
    [-0.48, -0.35],
    [-0.54, 0.26],
    [-0.29, 0.51],
    [0.37, 0.45],
    [0.52, 0.16],
    [0.43, -0.4],
    [0.13, -0.53]
  ];
  const top = ring.map(([a, b]) => {
    const u = x + fx * a * long + dx * b * wide,
      v = z + fz * a * long + dz * b * wide;
    return [u, field.sample(u, v).y + 0.012 + m.rng.range(-0.0015, 0.0015), v];
  });
  m.face(top, m.mix(color, 0xb5aa8c, 0.13));
  for (let i = 0; i < top.length; i++) {
    const a = top[i],
      b = top[(i + 1) % top.length];
    m.face([a, b, [b[0], b[1] - 0.029, b[2]], [a[0], a[1] - 0.029, a[2]]], 0x8a8973);
  }
}
function pathsAndStones(m, field) {
  const r = m.rng;
  for (const path of field.paths) {
    if (path.len < 0.61) continue;
    const count = Math.max(1, Math.floor(path.len / 0.72));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.52) / count;
      const off = r.range(-0.15, 0.15);
      const x = path.x + path.dx * t - (path.dz / path.len) * off,
        z = path.z + path.dz * t + (path.dx / path.len) * off;
      const kind = field.tile(x, z);
      if (kind === 'rock' || kind === 'herbs' || kind === 'cover' || r.next() < 0.16) continue;
      flag(
        m,
        field,
        x,
        z,
        Math.atan2(path.dz, path.dx) + r.range(-0.19, 0.19),
        r.range(0.41, 0.7),
        r.range(0.39, 0.69),
        r.pick([0xb0ab93, 0xc2b49a, 0xa5a18b, 0xc3b99e])
      );
    }
  }
  // Short broken and solid strokes form the eight trigrams inlaid around the lotus pool.
  const broken = [2, 4, 0, 1, 5, 3, 7, 6];
  for (let sector = 0; sector < 8; sector++) {
    const a = (sector * circle) / 8 + 0.11,
      cx = Math.cos(a),
      cz = Math.sin(a),
      tx = -cz,
      tz = cx;
    for (let k = 0; k < 3; k++) {
      const radius = 3.63 + k * 0.084;
      const x = cx * radius,
        z = cz * radius;
      if (!field.tile(x, z) || field.tile(x, z) === 'rock') continue;
      const spans =
        (broken[sector] >> k) & 1
          ? [
              [-0.225, -0.047],
              [0.047, 0.225]
            ]
          : [[-0.225, 0.225]];
      for (const [start, end] of spans) {
        const v = (along, depth) => [
          x + tx * along + cx * depth,
          0.059,
          z + tz * along + cz * depth
        ];
        m.face(
          [v(start, -0.022), v(start, 0.022), v(end, 0.022), v(end, -0.022)],
          sector % 2 ? 0x938669 : 0xab9572
        );
      }
    }
  }
}

function springWater(m, field) {
  const n = 64,
    banks = [];
  for (let i = 0; i < n; i++) {
    const a = (circle * i) / n,
      dx = Math.cos(a),
      dz = Math.sin(a);
    let r = 0;
    while (r < 3.75 && !field.tile(well[0] + r * dx, well[1] + r * dz)) r += 0.045;
    banks.push([dx, dz, r + 0.13]);
  }
  const palette = [0x3b605d, 0x4d776b, 0x689181, 0x8da387];
  let previous;
  const center = [well[0], -0.712, well[1]];
  for (const [k, ratio] of [0.26, 0.6, 0.83, 1].entries()) {
    const ring = banks.map(([dx, dz, r]) => [
      well[0] + dx * r * ratio,
      -0.712,
      well[1] + dz * r * ratio
    ]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        c = m.mix(palette[k], 0x8cab94, 0.026 + 0.018 * Math.sin(i * 0.37 + 0.7 * k));
      if (previous)
        m.face(
          [previous[i], previous[j], ring[j], ring[i]],
          [m.rgb(palette[k - 1]), m.rgb(palette[k - 1]), c, c]
        );
      else m.face([center, ring[j], ring[i]], c);
    }
    previous = ring;
  }
  // The lifting bucket touches the surface here. A broken circular reflection marks the contact.
  for (const r of [0.19, 0.36, 0.61]) {
    const points = [];
    for (let i = 0; i <= 15; i++) {
      const a = mix(-2.61, 0.8, i / 15);
      points.push([-1.3 + r * Math.cos(a), -0.704, -0.51 + 0.67 * r * Math.sin(a)]);
    }
    m.line(points, 0.008, 0x9cb39c, 4);
  }
}
function wellSweep(m) {
  const post = [-2.56, 0.43, -0.74],
    counter = [-3.05, 0.25, -0.82],
    bucket = [-1.3, 0.72, -0.51];
  const wood = 0x795942,
    bark = 0x685340,
    fiber = 0xbea57b;
  for (const z of [-0.88, -0.61]) {
    m.rock(-2.57, -0.69, z, 0.18, 0.47, 0.155, 0x647060, 0x909277, 7);
    m.tube([-2.57, -0.43, z], [post[0], 0.46, z], 0.058, 0.045, bark, 7);
  }
  m.tube([-2.57, 0.42, -0.93], [-2.57, 0.42, -0.57], 0.039, 0.039, 0x977451, 7);
  m.tube(counter, bucket, 0.06, 0.028, wood, 8);
  m.tube([-2.82, -0.4, -0.78], [-2.57, 0.32, -0.74], 0.034, 0.023, bark, 6);
  m.line([counter, [-3.03, 0.16, -0.82]], 0.018, fiber, 5);
  m.rock(-3.03, 0.05, -0.82, 0.105, 0.127, 0.09, 0x797764, 0x9b987d, 7);
  m.line([bucket, [-1.3, -0.535, -0.51]], 0.012, fiber, 5);
  m.line(
    [
      [-1.4, -0.59, -0.51],
      [-1.3, -0.515, -0.51],
      [-1.2, -0.59, -0.51]
    ],
    0.012,
    wood,
    5
  );
  m.lathe(
    -1.3,
    -0.724,
    -0.51,
    [
      [0, 0.079],
      [0.126, 0.103],
      [0.134, 0.095],
      [0.015, 0.07],
      [0.015, 0]
    ],
    wood,
    10
  );
  m.hoop(-1.3, -0.64, -0.51, 0.098, 0.008, 0x8e9078, 12);
}
function watercourse(m, field) {
  const sampled = [];
  for (const line of field.race) {
    const count = Math.ceil(line.len / 0.26);
    for (let j = 0; j < count; j++) {
      const t = j / count;
      sampled.push([line.x + line.dx * t, line.z + line.dz * t, line.station + t * line.len]);
    }
  }
  const end = field.race.at(-1);
  sampled.push([end.x + end.dx, end.z + end.dz, end.station + end.len]);
  let previous;
  for (let i = 0; i < sampled.length; i++) {
    const [x, z, station] = sampled[i],
      prev = sampled[Math.max(i - 1, 0)],
      next = sampled[Math.min(i + 1, sampled.length - 1)];
    const len = Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    const nx = (next[1] - prev[1]) / len,
      nz = -(next[0] - prev[0]) / len;
    const h = waterHeight(station);
    const v = (offset, height) => [x + nx * offset, height, z + nz * offset];
    const section = [
      v(-0.195, h + 0.055),
      v(-0.146, h + 0.057),
      v(-0.113, h - 0.104),
      v(0.113, h - 0.104),
      v(0.146, h + 0.057),
      v(0.195, h + 0.057)
    ];
    if (previous) {
      for (let j = 0; j < 5; j++) {
        const tone =
          j === 2 ? 0x807967 : j === 0 || j === 4 ? (i % 4 === 0 ? 0x91917a : 0xa6a187) : 0x777e6d;
        m.face([previous.wall[j], section[j], section[j + 1], previous.wall[j + 1]], tone);
      }
      m.face(
        [previous.l, v(-0.134, h + 0.002), v(0.134, h + 0.002), previous.r],
        [m.rgb(0x658677), m.rgb(0x648677), m.rgb(0x779586), m.rgb(0x779586)],
        0.83
      );
      // Masonry cheeks extend through the wet bed, including the two projecting mouths.
      for (const j of [0, 5]) {
        const top = section[j],
          last = previous.wall[j];
        const base = (p) => [p[0], Math.min(h - 0.22, field.sample(p[0], p[2]).y - 0.065), p[2]];
        m.face([last, top, base(top), base(last)], 0x737966);
      }
      if (i % 6 === 1) m.line([v(-0.063, h + 0.006), v(0.083, h + 0.006)], 0.007, 0xa5b49e, 4);
    }
    previous = { wall: section, l: v(-0.134, h + 0.002), r: v(0.134, h + 0.002) };
  }
  const lip = cisterns[1].y + 0.005;
  m.face(
    [
      previous.l,
      previous.r,
      [previous.r[0], lip, previous.r[2]],
      [previous.l[0], lip, previous.l[2]]
    ],
    0x82988a
  );
  // The paired gateposts bed into the sides of the channel. The lifted board leaves a little daylight below.
  const x = 7.32,
    z = 5.58,
    y = waterHeight(0.53);
  for (const d of [-0.24, 0.24]) {
    m.rock(x + d, y - 0.18, z, 0.14, 0.21, 0.16, 0x727866, 0xa39d83, 8);
    m.tube([x + d, y - 0.08, z], [x + d, y + 0.51, z], 0.054, 0.041, 0x8f7150, 7);
  }
  m.tube([x - 0.32, y + 0.48, z], [x + 0.32, y + 0.48, z], 0.04, 0.034, 0xa58659, 7);
  m.box(x, y + 0.19, z, 0.392, 0.23, 0.052, 0x8d7153);
  m.tube([x, y + 0.26, z], [x, y + 0.63, z], 0.022, 0.018, 0x947955, 6);
  m.tube([x - 0.083, y + 0.62, z], [x + 0.08, y + 0.62, z], 0.021, 0.017, 0xb29b69, 6);
}
function graftedPeaches(m, field) {
  const r = m.rng;
  for (const [idx, [x, z]] of nursery.entries()) {
    const ground = field.sample(x, z).y;
    m.frame(x, ground, z, idx * 0.97, idx % 2 ? 0.83 : 1, () => {
      // A dished mulch ring catches irrigation water at the graft. Its profile turns back to the trunk.
      m.lathe(
        0,
        -0.075,
        0,
        [
          [0, 0.55],
          [0.074, 0.48],
          [0.13, 0.34],
          [0.125, 0.28],
          [0.083, 0.18],
          [0.065, 0]
        ],
        0x8b7f62,
        16
      );
      m.tube([0, 0.005, 0], [0.014, 0.55, 0.012], 0.06, 0.031, 0x725b47, 8);
      m.tube([0.014, 0.53, 0.012], [-0.079, 0.77, 0.045], 0.033, 0.019, 0x795b49, 7);
      for (const h of [0.3, 0.32, 0.34]) m.hoop(0.01, h, 0.01, 0.045, 0.008, 0xbfaa7d, 9);
      m.tube([0.18, -0.115, 0.08], [0.12, 0.65, 0.065], 0.026, 0.021, 0x9a9162, 6);
      m.line(
        [
          [0.119, 0.43, 0.065],
          [0.008, 0.47, 0.008],
          [0.12, 0.49, 0.065]
        ],
        0.013,
        0xb69b71,
        4
      );
      for (let j = 0; j < 5; j++) {
        const a = j * 2.14 + 0.32,
          h = 0.48 + j * 0.063;
        const x1 = Math.cos(a) * (0.2 + (j % 2) * 0.09),
          z1 = Math.sin(a) * (0.16 + (j % 3) * 0.05);
        m.line(
          [
            [0, h, 0],
            [x1 * 0.51, h + 0.033, z1 * 0.57],
            [x1, h + 0.157, z1]
          ],
          0.017,
          0x795e49,
          5
        );
        for (let k = 0; k < 5; k++) {
          const t = 0.33 + k * 0.15,
            xx = x1 * t,
            zz = z1 * t,
            yy = h + 0.134 * t * t;
          const yaw = a + (k % 2 ? 1.1 : -1.2),
            size = r.range(0.069, 0.137);
          m.leaf(
            [xx, yy, zz],
            [xx + Math.cos(yaw) * size, yy + 0.049, zz + Math.sin(yaw) * size],
            0.031,
            0x849463,
            0xabb37c,
            0.015
          );
          if ((k + idx) % 2) {
            for (let p = 0; p < 5; p++) {
              const turn = (p * circle) / 5 + a,
                tip = [xx + 0.044 * Math.cos(turn), yy + 0.025, zz + 0.044 * Math.sin(turn)];
              m.leaf([xx, yy + 0.011, zz], tip, 0.022, 0xd39b9e, 0xeac5bb, 0.007);
            }
          }
        }
      }
    });
  }
}
function irrigationPonds(m, field) {
  for (const [index, pond] of cisterns.entries()) {
    const n = 32,
      water = [];
    for (let i = 0; i < n; i++) {
      const a = (circle * i) / n,
        r = bowlRadius(a) * 1.14;
      water.push([
        pond.x + Math.cos(a) * pond.rx * r,
        pond.y + 0.004,
        pond.z + Math.sin(a) * pond.rz * r
      ]);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.face(
        [[pond.x, pond.y + 0.004, pond.z], water[j], water[i]],
        [m.rgb(0x547d72), m.rgb(0x8fa491), m.rgb(0x8fa491)]
      );
    }
    const reeds = index ? 14 : 4;
    for (let i = 0; i < reeds; i++) {
      const a = index ? 0.12 + i * 0.22 : Math.PI + i * 0.36;
      const x = pond.x + Math.cos(a) * pond.rx * 0.87,
        z = pond.z + Math.sin(a) * pond.rz * 0.87;
      const y = Math.min(pond.y - 0.045, field.sample(x, z).y);
      m.rock(
        x,
        y - 0.028,
        z,
        0.105 + (i % 3) * 0.027,
        0.108 + (i % 2) * 0.069,
        0.094,
        0x707e6d,
        0x939780,
        7
      );
      for (let j = 0; j < 3; j++) {
        const yaw = a + 1.4 * j,
          dx = 0.083 * Math.cos(yaw),
          dz = 0.083 * Math.sin(yaw);
        m.leaf(
          [x, y, z],
          [x + dx * 1.8, y + 0.19 + 0.07 * (j % 2), z + dz * 1.8],
          0.023,
          0x6d875f,
          0x99a672,
          0.046
        );
      }
    }
  }
}
function scholarStones(m, layout) {
  // The openings are bored through both faces and lined with stone, so parallax survives a full rotation.
  const outline = [
    [-0.35, 0],
    [-0.14, -0.016],
    [0.27, 0],
    [0.32, 0.23],
    [0.25, 0.42],
    [0.39, 0.65],
    [0.36, 0.82],
    [0.46, 0.98],
    [0.38, 1.12],
    [0.28, 1.23],
    [0.32, 1.33],
    [0.18, 1.39],
    [0.12, 1.34],
    [0.026, 1.51],
    [-0.115, 1.46],
    [-0.22, 1.3],
    [-0.29, 1.33],
    [-0.36, 1.21],
    [-0.29, 1.09],
    [-0.41, 1.03],
    [-0.38, 0.9],
    [-0.25, 0.79],
    [-0.38, 0.65],
    [-0.31, 0.49],
    [-0.39, 0.3]
  ];
  const holes = [
    [
      [-0.18, 1.018],
      [-0.17, 1.12],
      [-0.08, 1.2],
      [0.06, 1.19],
      [0.12, 1.12],
      [0.085, 1.03],
      [0.004, 0.98],
      [-0.1, 0.95]
    ],
    [
      [0.093, 0.77],
      [0.08, 0.85],
      [0.14, 0.907],
      [0.22, 0.894],
      [0.24, 0.814],
      [0.206, 0.75],
      [0.157, 0.729]
    ]
  ];
  const shapes = [outline, ...holes],
    points = shapes.flat();
  const vectors = shapes.map((ring) => ring.map(([a, b]) => new m.T.Vector2(a, b)));
  const faces = m.T.ShapeUtils.triangulateShape(vectors[0], vectors.slice(1));
  for (const [col, row, yaw, scale] of [
    [4, 2, 0.39, 1.01],
    [11, 6, -0.68, 0.99],
    [2, 7, -0.23, 0.93]
  ]) {
    const x = col - (layout.width - 1) / 2,
      z = row - (layout.height - 1) / 2;
    m.frame(x, 0.04, z, yaw, scale, () => {
      const cast = (pt, sign) => {
        const [u, v] = pt;
        const depth = 0.113 + 0.035 * Math.sin(u * 13 + v * 8) + 0.027 * Math.cos(v * 16 - u * 5);
        return [u, v, sign * depth + 0.056 * Math.sin(v * 4.6)];
      };
      const side = [-1, 1].map((sign) => points.map((p) => cast(p, sign)));
      const tint = points.map(([a, b]) =>
        m.mix(0x748272, 0xa0a18b, 0.27 + 0.24 * Math.sin(b * 14 + a * 5))
      );
      for (const face of faces) {
        m.face(
          face.map((i) => side[1][i]),
          face.map((i) => tint[i])
        );
        const reverse = face.slice().reverse();
        m.face(
          reverse.map((i) => side[0][i]),
          reverse.map((i) => tint[i])
        );
      }
      let offset = 0;
      for (const [i, ring] of shapes.entries()) {
        for (let j = 0; j < ring.length; j++) {
          const a = offset + j,
            b = offset + ((j + 1) % ring.length);
          m.face([side[0][a], side[1][a], side[1][b], side[0][b]], i ? 0x707c6c : 0x89917b);
        }
        offset += ring.length;
      }
      for (const [a, b, c] of [
        [
          [-0.27, 0.48],
          [-0.18, 0.49],
          [-0.1, 0.5]
        ],
        [
          [-0.23, 1.28],
          [-0.13, 1.3],
          [-0.024, 1.27]
        ],
        [
          [0.12, 0.37],
          [0.22, 0.409],
          [0.25, 0.41]
        ]
      ]) {
        const vein = [a, b, c].map((point) => {
          const p = cast(point, 1);
          p[2] += 0.007;
          return p;
        });
        m.line(vein, 0.008, 0xb4ac8e, 4);
      }
    });
  }
}
function petalWinds(m, field) {
  const r = m.rng;
  for (const [x, z, angle] of [
    [-6.49, -4.32, 0.39],
    [-3.46, -5.54, -0.27],
    [3.32, -5.07, 1.14],
    [-5.6, 2.37, -0.55],
    [-6.85, 0.26, 0.87],
    [4.43, 1.9, 0.4],
    [5.66, 3.84, -0.97],
    [-2.53, 4.63, 0.97],
    [2.52, 5.89, 1.25],
    [-0.64, 1.67, -0.27]
  ]) {
    for (let j = 0; j < 17; j++) {
      const p = r.range(-0.83, 0.83),
        q = r.range(-0.27, 0.27) + 0.14 * p * p;
      const u = x + p * Math.cos(angle) - q * Math.sin(angle),
        v = z + p * Math.sin(angle) + q * Math.cos(angle);
      const y = field.sample(u, v).y;
      if (y < -0.64) continue;
      const size = r.range(0.046, 0.097),
        turn = r.range(0, circle);
      m.leaf(
        [u, y + 0.01, v],
        [u + size * Math.cos(turn), y + 0.011, v + size * Math.sin(turn)],
        size * 0.31,
        r.pick([0xc2958e, 0xd7adb0, 0xdebaae]),
        0xe6c4b9,
        0.003
      );
    }
  }
}

function landform5(T, layout) {
  const scene = new T.Group(),
    field = garden(layout);
  scene.name = '桃源泉臺與作圃';
  scene.add(gardenSoil(T, field));
  const stone = new Model(T, 51137);
  pathsAndStones(stone, field);
  scholarStones(stone, layout);
  petalWinds(stone, field);
  springWater(stone, field);
  watercourse(stone, field);
  irrigationPonds(stone, field);
  scene.add(stone.finish('八卦鋪地、蓮池與分水渠', { cast: false }));
  const tools = new Model(T, 51217);
  wellSweep(tools);
  graftedPeaches(tools, field);
  scene.add(tools.finish('泉邊桔槔與嫁接桃苗'));
  return scene;
}

export { landform5 };
