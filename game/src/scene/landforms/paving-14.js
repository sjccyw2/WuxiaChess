import { mapLayout } from '../../data/terrain.js';

// 黑木繡閣's ground, laid tile by tile as a scholar's garden lays it: a winding walk of
// fitted stone in a cracked-ice pattern, edged with dark pebbles, that runs from the
// head of the cliff path to the court before the house and branches west to the stone
// table and round the south of the pond; the court itself of square-cut slabs with a
// plum blossom of pebbles let into it; a pebble apron in bands round the pond's stone
// kerb; and between the walks, beds of moss and of raked fine gravel. Every tile stays
// level, its top a little under y = 0.045, and its middle plain enough for the pieces.

const layout = mapLayout(14),
  midX = (layout.width - 1) / 2,
  midZ = (layout.height - 1) / 2;
const onBoard = (cx, cy) => layout.mask[cy]?.[cx] === '#';
// Stones across one tile side, and the heights of the bedding, the stones and the
// pebbles.
const S = 4,
  bed = 0.031,
  stoneTop = 0.042;
const fract = (v) => v - Math.floor(v);
const hash2 = (i, j, salt = 0) => fract(Math.sin(i * 127.1 + j * 311.7 + salt * 74.7) * 43758.5453);
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = (lo, hi, v) => {
  const t = clamp((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};

// The walks as lines through world points: the main walk from the landing to the
// court, the branch to the stone table in the cut north-west corner, and the loop
// round the south and east of the pond.
const walks = [
  [
    [-4.6, 5.8],
    [-4.1, 4.2],
    [-3.2, 3.0],
    [-3.5, 1.4],
    [-2.5, 0.1],
    [-2.4, -1.5],
    [-1.1, -2.6],
    [0.5, -2.4],
    [1.5, -3.2]
  ],
  [
    [-2.4, -1.5],
    [-3.7, -2.5],
    [-4.1, -3.7],
    [-3.4, -4.8],
    [-2.9, -6.0]
  ],
  [
    [0.5, -2.4],
    [2.3, -1.5],
    [3.1, 0.2],
    [4.3, 1.4],
    [4.5, 3.2],
    [3.4, 4.3],
    [1.8, 3.9],
    [0.2, 4.5],
    [-1.5, 3.9],
    [-3.2, 3.0]
  ]
];
function walkDistance(x, z) {
  let best = 9;
  for (const line of walks)
    for (let k = 1; k < line.length; k++) {
      const [ax, az] = line[k - 1],
        [bx, bz] = line[k],
        dx = bx - ax,
        dz = bz - az,
        t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
      best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
    }
  return best;
}
// What the ground is at a world point.
function zone(x, z) {
  const pond = Math.max(Math.abs(x), Math.abs(z));
  if (pond < 1.13) return 'kerb';
  if (pond < 1.62) return 'apron';
  if (x > 1.0 && z < -3.0) return 'court';
  const d = walkDistance(x, z);
  if (d < 0.32) return 'walk';
  if (d < 0.48) return 'edge';
  return 'bed';
}
// Moss where this is above zero, raked gravel below, with a soft line between.
const mossiness = (x, z) =>
  0.2 +
  Math.sin(x * 0.83 + 1.3) * Math.sin(z * 0.71 - 0.4) +
  0.45 * Math.sin(x * 1.9 - z * 1.4 + 2.2);

function bedTone(m, x, z) {
  const n = 0.5 + 0.3 * Math.sin(x * 5.1 + z * 3.3) + 0.2 * Math.sin(z * 7.7 - x * 4.9);
  const gravel = m.mix(0xb4ad9f, 0xcac3b3, n),
    grout = m.mix(0x5f6650, 0x777863, n);
  const d = walkDistance(x, z),
    pond = Math.max(Math.abs(x), Math.abs(z));
  let c = gravel;
  // Mortar under the stones and pebbles; moss creeping into the walk's joints.
  if (pond < 1.62) c = m.mix(0x8e877a, 0xa39b8c, n);
  else if (x > 1.0 && z < -3.0) c = m.mix(0x5d594f, 0x6d685c, n);
  else c = m.mix(grout, c, smooth(0.44, 0.54, d));
  return c;
}

// Where moss grows: above zero, held back from the walks and the pond's apron.
const mossField = (x, z) =>
  Math.min(
    mossiness(x, z),
    (walkDistance(x, z) - 0.5) * 2.5,
    (Math.max(Math.abs(x), Math.abs(z)) - 1.66) * 2.5
  );
// The moss beds of one tile, cut cleanly along the line where mossField is zero
// (marching squares on a fine grid), darker at their edges and in their hollows.
function mossBeds(m, wx, wz) {
  const M = 8,
    f = [],
    g = [];
  for (let i = 0; i <= M; i++) {
    f.push([]);
    g.push([]);
    for (let j = 0; j <= M; j++) {
      const x = wx + i / M - 0.5,
        z = wz + j / M - 0.5,
        v = mossField(x, z),
        e = 0.02,
        slope =
          Math.hypot(
            mossField(x + e, z) - mossField(x - e, z),
            mossField(x, z + e) - mossField(x, z - e)
          ) /
          (2 * e);
      f[i].push(v);
      // Roughly the distance to the moss's edge, for the rake.
      g[i].push(v / Math.max(0.3, slope));
    }
  }
  const y = bed + 0.005;
  const tone = (x, z, v) => {
    const n =
      0.5 +
      0.3 * Math.sin((wx + x) * 6.1 + (wz + z) * 3.7) +
      0.2 * Math.sin((wz + z) * 9.3 - (wx + x) * 5.3);
    return m.mix(0x2f3f26, m.mix(0x435536, 0x627045, n), smooth(0, 0.3, v));
  };
  for (let i = 0; i < M; i++)
    for (let j = 0; j < M; j++) {
      const c = [
        [i, j],
        [i, j + 1],
        [i + 1, j + 1],
        [i + 1, j]
      ];
      ripples(m, c, g, M, wx, wz);
      if (c.every(([a, b]) => f[a][b] <= 0)) continue;
      const poly = [];
      for (let k = 0; k < 4; k++) {
        const [a0, b0] = c[k],
          [a1, b1] = c[(k + 1) % 4],
          v0 = f[a0][b0],
          v1 = f[a1][b1];
        if (v0 > 0) poly.push([a0 / M - 0.5, b0 / M - 0.5, v0]);
        if (v0 > 0 !== v1 > 0) {
          const t = v0 / (v0 - v1);
          poly.push([(a0 + (a1 - a0) * t) / M - 0.5, (b0 + (b1 - b0) * t) / M - 0.5, 0]);
        }
      }
      if (poly.length < 3) continue;
      m.face(
        poly.map(([x, z]) => [x, y, z]),
        poly.map(([x, z, v]) => tone(x, z, v))
      );
    }
}

// Raked gravel: furrows drawn round the moss and along the walks as water ripples
// round an island, at even steps away from the edge.
function ripples(m, c, g, M, wx, wz) {
  const y = bed + 0.003;
  for (let level = 1; level <= 6; level++) {
    const L = -0.075 * level,
      cut = [];
    for (let k = 0; k < 4; k++) {
      const [a0, b0] = c[k],
        [a1, b1] = c[(k + 1) % 4],
        v0 = g[a0][b0] - L,
        v1 = g[a1][b1] - L;
      if (v0 > 0 !== v1 > 0) {
        const t = v0 / (v0 - v1);
        cut.push([(a0 + (a1 - a0) * t) / M - 0.5, (b0 + (b1 - b0) * t) / M - 0.5]);
      }
    }
    if (cut.length !== 2) continue;
    const [[ax, az], [bx, bz]] = cut,
      mx = wx + (ax + bx) / 2,
      mz = wz + (az + bz) / 2;
    // Only in gravel: not over the walk's pebbles or the pond's apron.
    if (walkDistance(mx, mz) < 0.5 || Math.max(Math.abs(mx), Math.abs(mz)) < 1.64) continue;
    const l = Math.hypot(bx - ax, bz - az) || 1,
      nx = (-(bz - az) / l) * 0.004,
      nz = ((bx - ax) / l) * 0.004;
    m.face(
      [
        [ax - nx, y, az - nz],
        [ax + nx, y, az + nz],
        [bx + nx, y, bz + nz],
        [bx - nx, y, bz - nz]
      ],
      0x968e7f
    );
  }
}

// A low stone with a bevelled edge: its cap, then its sides down to the bedding.
function stone(m, pts, top, col) {
  // Wound so the cap faces up.
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i],
      [bx, bz] = pts[(i + 1) % pts.length];
    area += ax * bz - bx * az;
  }
  if (area > 0) pts = [...pts].reverse();
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length,
    cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const at = (k, y) => pts.map(([x, z]) => [cx + (x - cx) * k, y, cz + (z - cz) * k]);
  const foot = at(0.88, bed - 0.004),
    cap = at(0.78, top),
    side = m.mix(col, 0x3f4038, 0.35);
  m.face(cap, col);
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    m.face([foot[i], foot[j], cap[j], cap[i]], [side, side, col, col]);
  }
}
// A pebble set on end in mortar: a little domed hexagon.
function pebble(m, x, z, r, col, turn) {
  const ring = [];
  for (let k = 0; k < 6; k++) {
    const a = turn + (k * Math.PI) / 3;
    ring.push([x + Math.cos(a) * r, bed + 0.003, z + Math.sin(a) * r * 0.72]);
  }
  const top = [x, bed + 0.009 + r * 0.06, z],
    lit = m.mix(col, 0xffffff, 0.18);
  for (let k = 0; k < 6; k++) m.face([top, ring[(k + 1) % 6], ring[k]], [lit, col, col]);
}

// A lattice corner of the cracked-ice walk, in world coordinates. Corners on a tile's
// edge slide only along it, so the stones of neighbouring tiles meet edge to edge.
function corner(I, J) {
  const jx = I % S === 0 ? 0 : (hash2(I, J, 1) - 0.5) * 0.13,
    jz = J % S === 0 ? 0 : (hash2(I, J, 2) - 0.5) * 0.13;
  return [I / S - midX - 0.5 + jx, J / S - midZ - 0.5 + jz];
}

function walkStones(m, I, J, wx, wz, p) {
  const q = [corner(I, J), corner(I + 1, J), corner(I + 1, J + 1), corner(I, J + 1)].map(
    ([x, z]) => [x - wx, z - wz]
  );
  const tone = () => {
    const t = hash2(I, J, 7),
      base = m.mix(0x5e5b56, 0x827b70, hash2(I, J, 3));
    return t > 0.86 ? m.mix(base, 0x7f8c68, 0.35) : t < 0.14 ? m.mix(base, 0xa88a6c, 0.35) : base;
  };
  const top = stoneTop - 0.004 * hash2(I, J, 4);
  // About one in three is cracked across into two, as ice cracks.
  if (hash2(I, J, 5) < 0.36) {
    const flip = hash2(I, J, 6) < 0.5;
    const [a, b, c, d] = flip ? [q[1], q[2], q[3], q[0]] : q;
    stone(m, [a, b, c], top, tone());
    stone(m, [a, c, d], top - 0.002, m.mix(tone(), p[0], 0.25));
  } else stone(m, q, top, tone());
}

function pebbles(m, x0, z0, size, n, colorAt, scale = 1) {
  const step = size / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = x0 + (i + 0.5) * step,
        z = z0 + (j + 0.5) * step,
        h = hash2(Math.round(x * 97), Math.round(z * 89), 11);
      pebble(
        m,
        x + (h - 0.5) * step * 0.25,
        z + (hash2(Math.round(x * 53), Math.round(z * 61), 12) - 0.5) * step * 0.25,
        step * 0.43 * scale,
        colorAt(x, z, h),
        h * 3
      );
    }
}

// The plum blossom let into the court: five round petals of rose pebbles about a
// golden heart, ringed in black, on a field of pale pebbles.
function blossomMedallion(m, wx, wz) {
  pebbles(m, -0.5, -0.5, 1, 9, (x, z, h) => {
    const r = Math.hypot(x, z),
      a = Math.atan2(z, x);
    const petal = Math.hypot(
      x - Math.cos(Math.round(a / 1.2566) * 1.2566) * 0.2,
      z - Math.sin(Math.round(a / 1.2566) * 1.2566) * 0.2
    );
    if (r < 0.07) return m.mix(0xd2a347, 0xe6c26a, h);
    if (petal < 0.11) return m.mix(0xb8455a, 0xd06a7c, h);
    if (r > 0.36 && r < 0.45) return m.mix(0x2f3032, 0x45464a, h);
    return m.mix(0xcfc8b8, 0xe2dccd, h);
  });
}

function court(m, cell, wx, wz, p) {
  if (cell.x === 8 && cell.y === 1) return blossomMedallion(m, wx, wz);
  // Square slabs, two by two, framed by a border of narrow stones.
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const x = -0.25 + i * 0.5,
        z = -0.25 + j * 0.5,
        h = 0.21,
        tint = m.mix(0x9c9486, 0xb9b09e, hash2(cell.x * 2 + i, cell.y * 2 + j, 21));
      stone(
        m,
        [
          [x - h, z - h],
          [x + h, z - h],
          [x + h, z + h],
          [x - h, z + h]
        ],
        stoneTop + 0.001,
        tint
      );
    }
  for (const [x, z, w, d] of [
    [0, -0.47, 0.94, 0.06],
    [0, 0.47, 0.94, 0.06],
    [-0.47, 0, 0.06, 0.82],
    [0.47, 0, 0.06, 0.82]
  ])
    stone(
      m,
      [
        [x - w / 2, z - d / 2],
        [x + w / 2, z - d / 2],
        [x + w / 2, z + d / 2],
        [x - w / 2, z + d / 2]
      ],
      stoneTop - 0.002,
      m.mix(0x6f6a60, 0x857e70, hash2(cell.x, cell.y, 22))
    );
}

// Dark pebbles laid along the walk's edges.
const edgeTone = (m) => (x, z, h) => m.mix(0x343538, 0x55565a, h);
// The apron in bands round the pond: pale, dark, warm, as the ripples go.
const apronTone = (m, wx, wz) => (x, z, h) => {
  const band = Math.floor((Math.max(Math.abs(x + wx), Math.abs(z + wz)) - 1.13) / 0.1);
  const tones = [
    [0x3a3b3e, 0x505155],
    [0xd6d0c2, 0xe6e0d2],
    [0x8f7458, 0xa88b6a],
    [0xd6d0c2, 0xe6e0d2],
    [0x3a3b3e, 0x505155]
  ];
  const [a, b] = tones[clamp(band, 0, 4)];
  return m.mix(a, b, h);
};

function ground(m, p, cell) {
  const wx = cell.x - midX,
    wz = cell.y - midZ;
  // The bedding: a fine grid so moss and gravel shade into each other.
  const G = 6,
    grid = [];
  for (let i = 0; i <= G; i++) {
    const row = [];
    for (let j = 0; j <= G; j++) {
      const u = i / G - 0.5,
        v = j / G - 0.5,
        c = bedTone(m, wx + u, wz + v);
      row.push([[u, bed, v], c]);
    }
    grid.push(row);
  }
  for (let i = 0; i < G; i++)
    for (let j = 0; j < G; j++) {
      const q = [grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]];
      m.face(
        q.map(([pt]) => pt),
        q.map(([, c]) => c)
      );
    }
  // A fine dark joint round the tile, so the squares of the board still read.
  for (const [x, z, w, d] of [
    [0, -0.494, 1, 0.012],
    [0, 0.494, 1, 0.012],
    [-0.494, 0, 0.012, 0.976],
    [0.494, 0, 0.012, 0.976]
  ])
    m.face(
      [
        [x - w / 2, bed + 0.007, z - d / 2],
        [x - w / 2, bed + 0.007, z + d / 2],
        [x + w / 2, bed + 0.007, z + d / 2],
        [x + w / 2, bed + 0.007, z - d / 2]
      ],
      0x4a4a40
    );
  // A skirt down to the board's side wherever the tile has no neighbour.
  for (const [dx, dz] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ]) {
    if (onBoard(cell.x + dx, cell.y + dz)) continue;
    const a = [dx * 0.5 + dz * 0.5, dz * 0.5 - dx * 0.5],
      b = [dx * 0.5 - dz * 0.5, dz * 0.5 + dx * 0.5];
    m.face(
      [
        [a[0], bed, a[1]],
        [b[0], bed, b[1]],
        [b[0], -0.058, b[1]],
        [a[0], -0.058, a[1]]
      ],
      m.mix(p[0], p[3], 0.6)
    );
  }
  if (cell.x >= 7 && cell.y <= 2) {
    court(m, cell, wx, wz, p);
    return true;
  }
  mossBeds(m, wx, wz);
  const step = 1 / S,
    edge = edgeTone(m),
    apron = apronTone(m, wx, wz);
  for (let i = 0; i < S; i++)
    for (let j = 0; j < S; j++) {
      const u = -0.5 + (i + 0.5) * step,
        v = -0.5 + (j + 0.5) * step,
        I = cell.x * S + i,
        J = cell.y * S + j,
        kind = zone(wx + u, wz + v);
      if (kind === 'walk') walkStones(m, I, J, wx, wz, p);
      else if (kind === 'edge') pebbles(m, u - step / 2, v - step / 2, step, 3, edge, 1.12);
      else if (kind === 'apron') pebbles(m, u - step / 2, v - step / 2, step, 3, apron);
      else if (kind === 'kerb') {
        // Dressed kerb stones round the pond, two to a stretch of a tile.
        const along = Math.abs(wx + u) < Math.abs(wz + v);
        if ((along ? i : j) % 2 === 0) {
          const w = along ? step * 2 : step,
            d = along ? step : step * 2,
            x = along ? u + step / 2 : u,
            z = along ? v : v + step / 2;
          stone(
            m,
            [
              [x - w / 2 + 0.01, z - d / 2 + 0.01],
              [x + w / 2 - 0.01, z - d / 2 + 0.01],
              [x + w / 2 - 0.01, z + d / 2 - 0.01],
              [x - w / 2 + 0.01, z + d / 2 - 0.01]
            ],
            stoneTop + 0.002,
            m.mix(0xb3ada0, 0xc9c2b2, hash2(I, J, 31))
          );
        }
      }
    }
  return true;
}

// Petals blown off the plum trees onto the open tiles: thickest in the north-west,
// where the grove is.
function fallenPetals(m, p, cell) {
  const wx = cell.x - midX,
    wz = cell.y - midZ,
    r = m.rng,
    count = Math.round(2 + 5 * smooth(4, -6, wx + wz));
  for (let k = 0; k < count; k++) {
    const x = r.range(-0.46, 0.46),
      z = r.range(-0.46, 0.46);
    if (Math.abs(x) < 0.22 && Math.abs(z) < 0.22) continue;
    const a = r.range(0, Math.PI * 2),
      s = r.range(0.018, 0.028),
      col = r.pick([0xd23f55, 0xe25f70, 0xf0a0ad, 0xc93349]);
    m.face(
      [
        [x + Math.cos(a) * s, 0.0465, z + Math.sin(a) * s],
        [x + Math.cos(a + 3.9) * s * 0.8, 0.046, z + Math.sin(a + 3.9) * s * 0.8],
        [x + Math.cos(a + 2.3) * s * 0.8, 0.0455, z + Math.sin(a + 2.3) * s * 0.8]
      ],
      col
    );
  }
}

export { ground, fallenPetals, zone };
