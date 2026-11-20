// 桃花島的石陣佔據舊泉臺。兩道石門、臨水的汲具與南坡苗圃共用一片起伏的園土。
import { Model, circle } from '../scenery-kit.js';
import { boulder, facing, formationTiles, hash, noise, petalDrift } from './formation-5.js';
import { peachTree, petal } from './peach-5.js';
import { farIslands, meadow, shoreRocks } from './island-5.js';
import { formationEye, moonGate, northGate, southGate } from './gates-5.js';

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
  // The formation well is the pocket of open cells enclosed by the board.
  const open = new Set(),
    outside = new Set();
  for (let y = 0; y < layout.height; y++)
    for (let x = 0; x < layout.width; x++)
      if (layout.mask[y][x] !== '#') open.add(y * layout.width + x);
  const queue = [...open].filter((k) => {
    const x = k % layout.width,
      y = Math.floor(k / layout.width);
    return x === 0 || y === 0 || x === layout.width - 1 || y === layout.height - 1;
  });
  for (const k of queue) outside.add(k);
  for (let i = 0; i < queue.length; i++) {
    const k = queue[i];
    for (const d of [1, -1, layout.width, -layout.width]) {
      const n = k + d;
      if (
        open.has(n) &&
        !outside.has(n) &&
        Math.abs((n % layout.width) - (k % layout.width)) <= 1
      ) {
        outside.add(n);
        queue.push(n);
      }
    }
  }
  const hole = [...open]
    .filter((k) => !outside.has(k))
    .map((k) => [k % layout.width, Math.floor(k / layout.width)]);
  const holeSet = new Set(hole.map(([c, r]) => r * layout.width + c));
  const inHole = (x, z) => {
    const col = Math.floor(x + cx + 0.5),
      row = Math.floor(z + cz + 0.5);
    return col >= 0 && col < layout.width && holeSet.has(row * layout.width + col);
  };
  function sample(x, z) {
    const kind = tile(x, z),
      path = nearest(paths, x, z).distance;
    const insideWell = !kind && inHole(x, z);
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
      // Bays and headlands break the outline of the island.
      const turn = Math.atan2(z + 0.52, x + 0.24);
      const edge =
        radius +
        0.045 * Math.sin(x * 0.49 + z * 0.48) +
        0.05 * Math.sin(3 * turn + 0.7) +
        0.035 * Math.sin(7 * turn + 2.1);
      // A gentle fall to the shore, then a short rocky drop into the sea.
      const ground =
        -0.14 + shoulder - 0.5 * smooth(0.72, 0.94, edge) - 1.4 * smooth(0.9, 1.1, edge);
      y = mix(fieldTop, ground, smooth(0.18, 1.79, rimDistance));
    }
    const channel = nearest(race, x, z);
    if (channel.distance < 0.6) {
      // The ground settles to the rill's lip; only under the rill itself does it drop away.
      const crest = waterHeight(channel.along) + 0.055;
      y = mix(y, crest, 1 - smooth(0.3, 0.6, channel.distance));
      if (channel.distance < 0.2) y = crest - 0.08;
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
  return { tile, sample, paths, race, hole, holeSet, inHole, cx, cz };
}

function gardenSoil(T, field, trees) {
  const pos = [],
    col = [],
    ix = [];
  const shade = new T.Color(),
    lush = new T.Color(0x5f7d4a),
    dry = new T.Color(0x8d9461),
    clover = new T.Color(0x587047);
  const earth = new T.Color(0x9a8566),
    gravel = new T.Color(0xb5a88c),
    wet = new T.Color(0x4f5d44),
    mud = new T.Color(0x6f6450);
  const moss = new T.Color(0x4b5838),
    tilled = new T.Color(0x5e4a39),
    blush = new T.Color(0xd8a3ab);
  const sand = new T.Color(0xb3a585),
    cliff = new T.Color(0x7f7b69);
  // Joints line up with the tile edges, so the well's mouth and the paving are cut clean;
  // away from the board the lattice is shaken in plan so no grid shows in the meadow.
  const I0 = -21,
    J0 = -18,
    cols = 84,
    rows = 75,
    stride = cols + 1;
  const near = (x, z) =>
    [-0.45, 0.45].some((u) => [-0.45, 0.45].some((v) => field.tile(x + u, z + v))) ||
    field.inHole(x, z);
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      let x = -7 + (I0 + i) / 3,
        z = -6.5 + (J0 + j) / 3;
      if (!near(x, z)) {
        x += (hash(i, j, 21) - 0.5) * 0.2;
        z += (hash(i, j, 22) - 0.5) * 0.2;
      }
      const f = field.sample(x, z);
      const meadow = noise(x * 0.45, z * 0.45, 1),
        fine = noise(x * 1.7, z * 1.7, 2);
      shade.copy(lush).lerp(dry, clamp(meadow * 1.4 - 0.45));
      shade.lerp(clover, clamp((fine - 0.55) * 2.2) * 0.7);
      if (f.kind === 'plain') shade.copy(moss).lerp(lush, fine * 0.2);
      else if (f.kind === 'rock') shade.copy(moss).lerp(mud, 0.3 + fine * 0.3);
      else if (f.kind === 'herbs') shade.copy(tilled).lerp(mud, fine * 0.4);
      else if (f.kind) shade.lerp(lush, 0.3);
      // Worn earth paths outside the board.
      if (!f.kind) {
        const worn = (1 - smooth(0.18, 0.62, f.path)) * (0.75 + 0.25 * fine);
        shade.lerp(earth, worn * 0.85);
        shade.lerp(gravel, worn * 0.25 * fine);
      }
      // Fallen petals drift under the trees and in the wind's lee.
      const drift = petalDrift(x, z, trees);
      shade.lerp(blush, drift * (f.kind ? 0.18 : 0.42));
      // Dark wet margins along the rill and the pools.
      const damp = 1 - smooth(0.14, 0.5, f.channel.distance);
      shade.lerp(wet, damp * 0.8);
      // The shore: a bank of bare earth, a short rocky drop and wet sand at the waterline.
      if (!f.kind && !f.insideWell) {
        shade.lerp(earth, smooth(0.6, 1.0, -f.y) * 0.45);
        shade.lerp(cliff, smooth(1.0, 1.4, -f.y) * 0.75);
        shade.lerp(sand, smooth(1.38, 1.56, -f.y) * 0.7);
        shade.lerp(wet, smooth(1.58, 1.75, -f.y) * 0.8);
      }
      pos.push(x, f.y, z);
      col.push(shade.r, shade.g, shade.b);
    }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const n = j * stride + i,
        r = n + 1,
        b = n + stride,
        c = b + 1;
      const mx = (pos[n * 3] + pos[c * 3]) / 2,
        mz = (pos[n * 3 + 2] + pos[c * 3 + 2]) / 2;
      if (field.inHole(mx, mz)) continue;
      const exterior = Math.abs(mx) > 3.4 || Math.abs(mz) > 3.0;
      if (exterior && [n, r, b, c].every((v) => pos[v * 3 + 1] < -1.9)) continue;
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
    const count = Math.max(1, Math.floor(path.len / 0.62));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.52) / count;
      const off = r.range(-0.12, 0.12);
      const x = path.x + path.dx * t - (path.dz / path.len) * off,
        z = path.z + path.dz * t + (path.dx / path.len) * off;
      // On the board the tiles carry their own paving; stepping stones lead up to it.
      if (field.tile(x, z) || field.inHole(x, z) || field.sample(x, z).channel.distance < 0.3)
        continue;
      if (r.next() < 0.12) continue;
      flag(
        m,
        field,
        x,
        z,
        Math.atan2(path.dz, path.dx) + r.range(-0.19, 0.19),
        r.range(0.41, 0.62),
        r.range(0.39, 0.6),
        r.pick([0xb0ab93, 0xc2b49a, 0xa5a18b, 0xc3b99e])
      );
    }
  }
}

// The formation well: a shaft of coursed stone that drops into darkness below the
// open cells, with a worn coping at the mouth and black water far down.
const wellWater = -1.45;
function wellShaft(m, field, layout) {
  const r = m.rng,
    { width } = layout;
  const edges = [];
  for (const [c, row] of field.hole) {
    const x = c - field.cx,
      z = row - field.cz;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      if (field.holeSet.has((row + dz) * width + c + dx)) continue;
      // The wall runs along the shared edge; `in` points back into the shaft.
      const ex = x + dx / 2,
        ez = z + dz / 2;
      // Wound so every face looks into the shaft.
      edges.push({ a: [ex - dz / 2, ez + dx / 2], b: [ex + dz / 2, ez - dx / 2], in: [-dx, -dz] });
    }
  }
  const stone = [0x8f8f80, 0x9a9887, 0x85887a, 0xa29d89, 0x7e8274],
    mortar = m.rgb(0x3e423a),
    dark = m.rgb(0x18201e);
  const depthTone = (c, y) => {
    const t = smooth(0.05, -1.25, y);
    return [c[0] + (dark[0] - c[0]) * t, c[1] + (dark[1] - c[1]) * t, c[2] + (dark[2] - c[2]) * t];
  };
  const courses = [];
  for (let y = 0.0; y > wellWater - 0.2; ) {
    const h = r.range(0.13, 0.19);
    courses.push([y - h, y]);
    y -= h;
  }
  for (const [e, edge] of edges.entries()) {
    const [ax, az] = edge.a,
      [bx, bz] = edge.b,
      [nx, nz] = edge.in;
    const at = (t, y, out) => [ax + (bx - ax) * t + nx * out, y, az + (bz - az) * t + nz * out];
    // Mortar bed behind the blocks.
    m.face(
      [
        at(0, 0.04, -0.004),
        at(1, 0.04, -0.004),
        at(1, wellWater - 0.2, -0.004),
        at(0, wellWater - 0.2, -0.004)
      ],
      [mortar, mortar, dark, dark]
    );
    for (const [k, [lo, hi]] of courses.entries()) {
      const splits = [0];
      let t = ((k + e) % 2) * 0.17 + r.range(0.18, 0.3);
      while (t < 0.92) {
        splits.push(t);
        t += r.range(0.26, 0.42);
      }
      splits.push(1);
      for (let s = 0; s < splits.length - 1; s++) {
        const t0 = splits[s] + 0.008,
          t1 = splits[s + 1] - 0.008,
          y0 = lo + 0.008,
          y1 = hi - 0.008,
          out = r.range(0.006, 0.02);
        const c = m.rgb(r.pick(stone));
        // Moss creeps over the upper courses, and seeps stain the lower.
        const tone = hi > -0.35 && r.next() < 0.35 ? m.mix(c, 0x5f7445, 0.5) : c;
        const col = (y) => depthTone(tone, y);
        m.face(
          [at(t0, y1, out), at(t1, y1, out), at(t1, y0, out), at(t0, y0, out)],
          [col(y1), col(y1), col(y0), col(y0)]
        );
        // A chamfer along the top of each block catches the light.
        m.face(
          [at(t0, y1 + 0.006, 0), at(t1, y1 + 0.006, 0), at(t1, y1, out), at(t0, y1, out)],
          depthTone(m.mix(tone, 0xcfc8b0, 0.25), y1)
        );
      }
    }
    // Coping: worn slabs with a rounded lip hanging over the shaft.
    const pieces = 2 + (e % 2);
    for (let s = 0; s < pieces; s++) {
      const t0 = s / pieces + 0.006,
        t1 = (s + 1) / pieces - 0.006,
        lip = 0.11 + r.range(-0.015, 0.015),
        top = 0.072 + r.range(-0.006, 0.004);
      const tone = m.mix(
        r.pick([0xa7a28c, 0xb2ab93, 0x9c9c88]),
        0xa3a46c,
        r.next() < 0.3 ? 0.35 : 0
      );
      const front = m.mix(tone, 0x5e6353, 0.35);
      m.face(
        [
          at(t0, top, -0.03),
          at(t1, top, -0.03),
          at(t1, top - 0.004, lip - 0.02),
          at(t0, top - 0.004, lip - 0.02)
        ],
        tone
      );
      m.face(
        [
          at(t0, top - 0.004, lip - 0.02),
          at(t1, top - 0.004, lip - 0.02),
          at(t1, top - 0.03, lip),
          at(t0, top - 0.03, lip)
        ],
        m.mix(tone, front, 0.5)
      );
      m.face(
        [
          at(t0, top - 0.03, lip),
          at(t1, top - 0.03, lip),
          at(t1, top - 0.085, lip - 0.012),
          at(t0, top - 0.085, lip - 0.012)
        ],
        front
      );
      m.face(
        [
          at(t0, top - 0.085, lip - 0.012),
          at(t1, top - 0.085, lip - 0.012),
          at(t1, 0.0, 0),
          at(t0, 0.0, 0)
        ],
        depthTone(front, -0.1)
      );
      for (const t of [t0, t1])
        m.face(
          [
            at(t, top, -0.03),
            at(t, top - 0.004, lip - 0.02),
            at(t, top - 0.03, lip),
            at(t, top - 0.085, lip - 0.012),
            at(t, 0, 0),
            at(t, 0.04, -0.03)
          ],
          front
        );
    }
    // Ferns and trailing moss hang from some joints near the mouth.
    if (r.next() < 0.55) {
      const t = r.range(0.2, 0.8),
        base = at(t, -0.02, 0.03);
      for (let k = 0; k < 4; k++) {
        const a = (k - 1.5) * 0.5;
        const tip = at(t + Math.sin(a) * 0.12, -0.16 - r.next() * 0.12, 0.1 + Math.cos(a) * 0.05);
        m.leaf(base, tip, 0.03, 0x4f6a3c, 0x7c9555, -0.02);
      }
    }
  }
  // Deep, still water: nearly black, a little light gathered at the walls.
  const rim = m.rgb(0x2b3c38),
    deep = m.rgb(0x0e1716);
  for (const [c, row] of field.hole) {
    const x = c - field.cx,
      z = row - field.cz;
    const corner = (u, v) => {
      const d = Math.min(1, Math.hypot(x + u - well[0], z + v - well[1]) / 2.4);
      return [
        deep[0] + (rim[0] - deep[0]) * d,
        deep[1] + (rim[1] - deep[1]) * d,
        deep[2] + (rim[2] - deep[2]) * d
      ];
    };
    m.face(
      [
        [x - 0.5, wellWater, z - 0.5],
        [x - 0.5, wellWater, z + 0.5],
        [x + 0.5, wellWater, z + 0.5],
        [x + 0.5, wellWater, z - 0.5]
      ],
      [corner(-0.5, -0.5), corner(-0.5, 0.5), corner(0.5, 0.5), corner(0.5, -0.5)]
    );
  }
  // Faint rings where a drip falls from the sweep's bucket, and a few drowned petals.
  for (const rad of [0.16, 0.31, 0.5]) {
    const points = [];
    for (let i = 0; i <= 14; i++) {
      const a = mix(-2.4, 0.9, i / 14);
      points.push([-1.3 + rad * Math.cos(a), wellWater + 0.006, -0.51 + 0.8 * rad * Math.sin(a)]);
    }
    m.line(points, 0.006, 0x3e5752, 4);
  }
  for (let k = 0; k < 26; k++) {
    const [c, row] = r.pick(field.hole);
    petal(
      m,
      c - field.cx + r.range(-0.45, 0.45),
      wellWater + 0.004,
      row - field.cz + r.range(-0.45, 0.45),
      r
    );
  }
}
function wellSweep(m) {
  const post = [-2.56, 0.43, -0.74],
    counter = [-3.05, 0.25, -0.82],
    bucket = [-1.3, 0.72, -0.51];
  const wood = 0x795942,
    bark = 0x685340,
    fiber = 0xbea57b;
  // The posts stand on a stone pier built out from the shaft wall.
  for (let k = 0; k < 6; k++) {
    const top = -0.43 - k * 0.16,
      tone = [0x8d8c7c, 0x7f8275, 0x969483][k % 3];
    const t = smooth(0, 5, k);
    const c = [0, 1, 2].map((i) => m.rgb(tone)[i] * (1 - 0.75 * t));
    m.box(-2.66 + (k % 2) * 0.01, top - 0.08, -0.745, 0.68 - (k % 2) * 0.02, 0.15, 0.5, c);
  }
  m.box(-2.64, -0.415, -0.745, 0.72, 0.04, 0.54, 0xa29f8a);
  for (const z of [-0.88, -0.61])
    m.tube([-2.57, -0.4, z], [post[0], 0.46, z], 0.058, 0.045, bark, 7);
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
    const skirt = [-0.46, 0.46].map((off) => {
      const [px, , pz] = v(off, 0);
      return [px, Math.max(field.sample(px, pz).y, h + 0.03) + 0.006, pz];
    });
    if (previous) {
      // Turf runs to the lip; the inner faces are wet, mossy stone.
      for (let j = 0; j < 5; j++) {
        const tone =
          j === 2 ? 0x4c5a4c : j === 0 || j === 4 ? (i % 3 === 0 ? 0x6b7a4c : 0x627448) : 0x56634c;
        m.face([previous.wall[j], section[j], section[j + 1], previous.wall[j + 1]], tone);
      }
      m.face(
        [previous.l, v(-0.14, h + 0.002), v(0.14, h + 0.002), previous.r],
        [m.rgb(0x5d827a), m.rgb(0x5d827a), m.rgb(0x426a64), m.rgb(0x426a64)]
      );
      // Earthen cheeks reach down through the wet bed so no gap shows beside the bank.
      for (const j of [0, 5]) {
        const top = section[j],
          last = previous.wall[j];
        const base = (p) => [p[0], Math.min(h - 0.22, field.sample(p[0], p[2]).y - 0.065), p[2]];
        m.face([last, top, base(top), base(last)], 0x5a5847);
      }
      // A skirt of wet turf laps over the lip, hiding where the coarse soil dips.
      const pondside = cisterns.some((c) => Math.hypot((x - c.x) / c.rx, (z - c.z) / c.rz) < 1.9);
      for (const [k, j] of [0, 5].entries()) {
        if (pondside) break;
        const turf = m.rgb(i % 2 ? 0x56683f : 0x5b6c47);
        facing(
          m,
          [previous.wall[j], section[j], skirt[k], previous.skirt[k]],
          [turf, turf, m.rgb(0x5d6f45), m.rgb(0x5d6f45)],
          [0, 1, 0]
        );
      }
      // A riffle of white water where the bed steps down.
      if (i % 6 === 1)
        m.line([v(-0.11, h + 0.006), v(-0.02, h + 0.009), v(0.1, h + 0.006)], 0.008, 0xd5e1d8, 4);
      // Stones bed along both lips, a few standing in the current.
      for (const side of [-1, 1])
        if (m.rng.next() < 0.7) {
          const off = side * m.rng.range(0.15, 0.2),
            s = m.rng.range(0.045, 0.1);
          const [px, , pz] = v(off, 0);
          boulder(m, px, h + 0.02, pz, s, s * m.rng.range(0.5, 0.9), s * 0.8, m.rng, {
            n: 6,
            grey: 0x6f7368,
            light: 0xa5a28f,
            lichen: 0x8f9a5c,
            foot: 0x3f4a3d
          });
        }
      if (m.rng.next() < 0.18) {
        const [px, , pz] = v(m.rng.range(-0.06, 0.06), 0);
        boulder(m, px, h - 0.03, pz, 0.05, 0.05, 0.04, m.rng, {
          n: 6,
          grey: 0x5f665c,
          foot: 0x354037
        });
      }
      for (let k = 0; k < 2; k++)
        if (m.rng.next() < 0.5) {
          const [px, , pz] = v(m.rng.range(-0.11, 0.11), 0);
          petal(m, px, h + 0.006, pz, m.rng);
        }
    }
    previous = { wall: section, skirt, l: v(-0.14, h + 0.002), r: v(0.14, h + 0.002) };
  }
  // A granite slab bridge, and stepping stones lower down, carry the paths over.
  const across = (t, draw) => {
    const [x, z, station] = sampled[Math.round(t * (sampled.length - 1))],
      [x2, z2] = sampled[Math.round(t * (sampled.length - 1)) + 1];
    m.frame(x, waterHeight(station), z, -Math.atan2(z2 - z, x2 - x), 1, draw);
  };
  across(0.33, () => {
    m.box(0, 0.09, 0, 0.36, 0.07, 0.78, 0xa7a28e);
    m.box(0, 0.05, 0, 0.32, 0.03, 0.74, 0x7d7a6c);
    for (const s of [-1, 1]) boulder(m, 0, 0.0, s * 0.33, 0.13, 0.08, 0.1, m.rng, { n: 6 });
  });
  across(0.72, () => {
    for (const [u, w] of [
      [-0.3, 0.13],
      [0.02, 0.11],
      [0.31, 0.13]
    ])
      boulder(m, 0.03 * Math.sign(u), u ? 0.02 : -0.05, u, w, 0.08, w * 0.85, m.rng, {
        n: 7,
        grey: 0x8f8d7e,
        light: 0xbdb7a2
      });
  });
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
          [0, 0.38],
          [0.062, 0.33],
          [0.092, 0.24],
          [0.088, 0.17],
          [0.07, 0.1],
          [0.064, 0]
        ],
        0x5c5545,
        11
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
        [m.rgb(0x3b625d), m.rgb(0x6a8c83), m.rgb(0x6a8c83)]
      );
    }
    // Lily pads and fallen petals drift on the still water.
    const r = m.rng;
    for (let k = 0; k < (index ? 7 : 2); k++) {
      const a = r.range(0, circle),
        d = r.range(0.2, 0.75);
      const x = pond.x + Math.cos(a) * pond.rx * d,
        z = pond.z + Math.sin(a) * pond.rz * d,
        rad = r.range(0.06, 0.11),
        pad = [];
      for (let i = 0; i <= 8; i++) {
        const t = a + 0.3 + (i / 8) * (circle - 0.6);
        pad.push([x + Math.cos(t) * rad, pond.y + 0.008, z + Math.sin(t) * rad]);
      }
      for (let i = 0; i < 8; i++)
        m.face(
          [[x, pond.y + 0.01, z], pad[i + 1], pad[i]],
          [m.rgb(0x8ea56a), m.rgb(0x6d8a52), m.rgb(0x6d8a52)]
        );
    }
    for (let k = 0; k < (index ? 30 : 8); k++) {
      const a = r.range(0, circle),
        d = Math.sqrt(r.next()) * 0.9;
      petal(
        m,
        pond.x + Math.cos(a) * pond.rx * d,
        pond.y + 0.007,
        pond.z + Math.sin(a) * pond.rz * d,
        r
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
// Peach trees around the formation: [x, z, size, age, blossom density, white flowers].
// Old trees lean and carry fewer, larger flowers; young ones are all blossom.
const orchard = [
  [-6.15, -7.65, 1.12, 0.95, 0.8],
  [-1.85, -8.5, 0.92, 0.45, 0.92],
  [4.25, -8.1, 1.04, 0.7, 0.86],
  [-8.6, -3.0, 0.98, 0.55, 0.9, true],
  [-8.45, 3.85, 1.18, 1, 0.7],
  [8.35, -2.55, 0.84, 0.25, 1],
  [-5.3, 8.55, 0.9, 0.4, 0.9]
];

function landform5(T, layout) {
  const scene = new T.Group(),
    field = garden(layout);
  scene.name = '桃源泉臺與作圃';
  const fall = orchard.map(([x, z, size]) => [x, z, 2.3 * size]);
  scene.add(gardenSoil(T, field, fall));
  const board = new Model(T, 51311);
  formationTiles(board, layout, fall);
  scene.add(board.finish('落英石徑、陣石與桃花叢'));
  const stone = new Model(T, 51137);
  pathsAndStones(stone, field);
  wellShaft(stone, field, layout);
  watercourse(stone, field);
  irrigationPonds(stone, field);
  shoreRocks(stone, field);
  meadow(stone, field);
  scene.add(stone.finish('無底陣井、石徑與分水渠', { cast: false }));
  const far = new Model(T, 51401);
  farIslands(far);
  scene.add(far.finish('海上遠島', { distant: true, cast: false }));
  const tools = new Model(T, 51217);
  wellSweep(tools);
  graftedPeaches(tools, field);
  scene.add(tools.finish('泉邊桔槔與嫁接桃苗'));
  // The gates stand where the outer paths reach the board.
  for (const [k, [name, x, z, yaw, draw]] of [
    ['北面石坊門', 2.4, -7.55, 0, northGate],
    ['南徑望柱門', -0.05, 7.55, 0, southGate],
    ['東門月洞石屏', 8.2, 3.6, Math.PI / 2, moonGate],
    ['西面陣眼奇石', -8.0, 0.3, 0, formationEye]
  ].entries()) {
    const m = new Model(T, 53001 + k * 89);
    m.frame(x, field.sample(x, z).y, z, yaw, 1, () => draw(m));
    scene.add(m.finish(name, { occluder: true }));
  }
  for (const [k, [x, z, size, age, density, white]] of orchard.entries()) {
    const m = new Model(T, 52001 + k * 97);
    // Seat the trunk at the low side of the slope so no root floats.
    let y = field.sample(x, z).y;
    for (let a = 0; a < 6; a++)
      y = Math.min(y, field.sample(x + 0.3 * Math.cos(a), z + 0.3 * Math.sin(a)).y);
    m.frame(x, y, z, k * 1.7, 1, () =>
      peachTree(m, { size: size * 1.35, age, density, white, leaf: 0.1 + age * 0.3 }, m.rng)
    );
    // Petals fallen beneath the crown.
    for (let j = 0; j < 70; j++) {
      const a = m.rng.range(0, circle),
        d = Math.sqrt(m.rng.next()) * 2.1 * size;
      const u = x + Math.cos(a) * d,
        v = z + Math.sin(a) * d;
      if (field.tile(u, v) || field.inHole(u, v)) continue;
      petal(m, u, field.sample(u, v).y + 0.008, v, m.rng);
    }
    scene.add(m.finish('桃林' + k, { occluder: true }));
  }
  return scene;
}

export { landform5 };
