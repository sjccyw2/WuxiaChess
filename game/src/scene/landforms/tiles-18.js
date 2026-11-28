import { circle, midway } from '../scenery-kit.js';
import { mapLayout } from '../../data/terrain.js';
import { oldPine } from './peaks-4.js';
import { tuft } from './kit-12.js';

// 光明頂's tiles. The summit is bare granite, split by frost into slabs and laid
// here and there with dressed stone: a sacred way of flags runs up the middle from
// the head of the mountain road to the altar court before the hall, where the
// paving is square-cut and a ring of red stone with eight flames let into it goes
// round the altar on tile (6,2). Off the dressed stone the rock is wild: slabs of
// every size and tone, grit and a little turf in the joints, lichen on the tops.
// Every tile stays level, its top a little under y = 0.045.

const layout = mapLayout(18),
  midX = (layout.width - 1) / 2,
  midZ = (layout.height - 1) / 2;
const onBoard = (cx, cy) => layout.mask[cy]?.[cx] === '#';
// Stones across one tile side; the bedding, and the tops of the slabs.
const S = 3,
  bed = 0.02,
  stoneTop = 0.04;
const fract = (v) => v - Math.floor(v);
const hash2 = (i, j, salt = 0) => fract(Math.sin(i * 127.1 + j * 311.7 + salt * 74.7) * 43758.5453);
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = (lo, hi, v) => {
  const t = clamp((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
const wave = (x, z) =>
  0.5 + 0.28 * Math.sin(x * 1.7 + z * 0.9) + 0.22 * Math.sin(z * 2.9 - x * 2.3 + 1.1);

// The altar court before the hall and the sacred way up the middle of the board.
const altar = [0, -4];
const inCourt = (x, z) => Math.abs(x) <= 2.5 && z >= -5.5 && z <= -2.5;
const inWay = (x, z) =>
  (Math.abs(x) <= 0.5 && z >= -2.5 && z <= 6.5) || (Math.abs(x) <= 1.5 && z >= 4.5);
// How far a point lies outside the dressed stone (0 on it).
function offDressed(x, z) {
  const box = (x0, x1, z0, z1) =>
    Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
  return Math.min(
    box(-2.5, 2.5, -5.5, -2.5),
    box(-0.5, 0.5, -2.5, 6.5),
    box(-1.5, 1.5, 4.5, 6.5)
  );
}
// The corner of the stone lattice at index (I, J): on the dressed stone it is a
// true grid; off it the frost has split the rock wherever it liked. Points on a
// tile's edge only slide along it, so the squares of the board still read.
function corner(I, J) {
  const x = I / S - layout.width / 2,
    z = J / S - layout.height / 2,
    wild = smooth(0, 0.4, offDressed(x, z)) * 0.17;
  const onX = I % S === 0,
    onZ = J % S === 0;
  return [
    x + (onX ? 0 : (hash2(I, J, 1) - 0.5) * wild),
    z + (onZ ? 0 : (hash2(I, J, 2) - 0.5) * wild)
  ];
}

// One stone: a top a little rough on wild rock, a bevel and a flank down into the
// bedding. pts are [x, z] in the tile's frame; tone is the top's colour.
function slab(m, pts, h, tone, rough, salt) {
  const n = pts.length;
  let cx = 0,
    cz = 0;
  for (const [x, z] of pts) {
    cx += x / n;
    cz += z / n;
  }
  const lift = (k) => (rough ? (hash2(salt, k, 7) - 0.5) * 0.008 : 0);
  const at = (k, s, y) => [cx + (pts[k][0] - cx) * s, y, cz + (pts[k][1] - cz) * s];
  const top = pts.map((_, k) => at(k, 0.84, h + lift(k))),
    lip = pts.map((_, k) => at(k, 0.955, h - 0.011)),
    foot = pts.map((_, k) => at(k, 1, bed - 0.004));
  const worn = m.mix(tone, 0xe0d8c6, rough ? 0.1 : 0.22),
    side = m.mix(tone, 0x4e4a44, 0.38),
    mid = [cx, h + (rough ? 0.002 : 0.001), cz];
  for (let k = 0; k < n; k++) {
    const q = (k + 1) % n;
    m.face([mid, top[q], top[k]], [worn, m.rgb(tone), m.rgb(tone)]);
    m.face([top[k], top[q], lip[q], lip[k]], [m.rgb(tone), m.rgb(tone), side, side]);
    m.face([lip[k], lip[q], foot[q], foot[k]], side, 0.86);
  }
  return [cx, cz];
}

// The tone of a stone by what it is and where it lies.
function stoneTone(m, kind, x, z, salt) {
  const n = wave(x, z),
    h = hash2(salt, 3, 11);
  if (kind === 'court') {
    const c = m.mix(0xa9a59b, 0xc4bfb2, 0.35 * n + 0.65 * h);
    // A border of darker stone round the court's edge.
    return Math.abs(x) > 2.17 || z < -5.17 || z > -2.83 ? m.mix(c, 0x5f5c57, 0.45) : c;
  }
  if (kind === 'way') {
    const c = m.mix(0xaba69a, 0xc6c0b1, 0.4 * n + 0.6 * h);
    return Math.abs(x) > 0.36 && z < 4.5 ? m.mix(c, 0x6a6760, 0.4) : c;
  }
  // Wild granite: grey and buff plates side by side, a few stained rusty or dark, and
  // the rock greyer and more weathered in broad patches.
  const tones = [0x85837d, 0x928e86, 0x9b958a, 0x7a7974, 0xa39f95, 0x8e877b];
  let c = m.rgb(tones[Math.floor(hash2(salt, 9, 4) * tones.length)]);
  c = m.mix(c, 0x6f6e6a, 0.35 * smooth(0.55, 0.85, wave(x * 0.45 + 2, z * 0.5 - 1)));
  c = m.mix(c, 0xb0aa9d, 0.25 * h);
  const k = hash2(salt, 9, 7);
  if (k > 0.9) c = m.mix(c, 0x8a6e55, 0.4);
  else if (k < 0.08) c = m.mix(c, 0x5f5e5a, 0.45);
  return c;
}

// A crust of lichen on a slab top: a small ragged disc.
function lichen(m, x, z, y, s, col, salt) {
  const ring = [];
  for (let k = 0; k < 7; k++) {
    const a = (k * circle) / 7,
      d = s * (0.6 + 0.5 * hash2(salt, k, 21));
    ring.push([x + Math.cos(a) * d, y, z + Math.sin(a) * d]);
  }
  m.face(ring.reverse(), col);
}

// The red stone ring round the altar and the eight flames let into it, cut to the
// part that falls on this tile.
function altarRing(m, wx, wz) {
  const [ax, az] = altar,
    y = stoneTop + 0.0045,
    inTile = (x, z) => Math.abs(x - wx) <= 0.5 && Math.abs(z - wz) <= 0.5;
  const band = (r0, r1, col, n = 96) => {
    for (let k = 0; k < n; k++) {
      const a0 = (k * circle) / n,
        a1 = ((k + 1) * circle) / n,
        am = (a0 + a1) / 2;
      const mx = ax + Math.cos(am) * (r0 + r1) * 0.5,
        mz = az + Math.sin(am) * (r0 + r1) * 0.5;
      if (!inTile(mx, mz)) continue;
      const p = (a, r) => [ax + Math.cos(a) * r - wx, y, az + Math.sin(a) * r - wz];
      m.face([p(a0, r0), p(a0, r1), p(a1, r1), p(a1, r0)], col);
    }
  };
  band(1.18, 1.3, 0x8f4a3a);
  band(1.36, 1.39, 0x6e5a4c);
  band(0.98, 1.01, 0x6e5a4c);
  // Eight flames, points outward, set across the ring.
  for (let k = 0; k < 8; k++) {
    const a = (k * circle) / 8 + circle / 16,
      fx = ax + Math.cos(a) * 1.24,
      fz = az + Math.sin(a) * 1.24;
    if (!inTile(fx, fz)) continue;
    const ux = Math.cos(a),
      uz = Math.sin(a),
      vx = -uz,
      vz = ux;
    const flame = [
      [0, -0.13],
      [0.07, -0.07],
      [0.08, 0.0],
      [0.045, 0.07],
      [0.02, 0.17],
      [-0.01, 0.08],
      [-0.05, 0.11],
      [-0.07, 0.01],
      [-0.06, -0.08]
    ].map(([u, v]) => [fx + vx * u + ux * v - wx, y + 0.0007, fz + vz * u + uz * v - wz]);
    m.face(flame, 0xb0563a);
    const core = [
      [0, -0.07],
      [0.035, -0.02],
      [0.02, 0.06],
      [-0.03, -0.01]
    ].map(([u, v]) => [fx + vx * u + ux * v - wx, y + 0.0012, fz + vz * u + uz * v - wz]);
    m.face(core, 0xd59a4e);
  }
}

// The round dais the sacred fire's altar stands on.
function dais(m) {
  const y = stoneTop + 0.004;
  const ring = (r, h, col, n = 24) => {
    const pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k * circle) / n;
      pts.push([Math.cos(a) * r, h, Math.sin(a) * r]);
    }
    m.face(pts.reverse(), col);
  };
  for (let k = 0; k < 24; k++) {
    const a0 = (k * circle) / 24,
      a1 = ((k + 1) * circle) / 24;
    m.face(
      [
        [Math.cos(a0) * 0.47, y, Math.sin(a0) * 0.47],
        [Math.cos(a1) * 0.47, y, Math.sin(a1) * 0.47],
        [Math.cos(a1) * 0.48, bed, Math.sin(a1) * 0.48],
        [Math.cos(a0) * 0.48, bed, Math.sin(a0) * 0.48]
      ],
      0x7f786c
    );
  }
  ring(0.47, y, 0xa39b8b);
  ring(0.4, y + 0.0006, 0x8f4a3a);
  ring(0.37, y + 0.0012, 0xb3ab9a);
  ring(0.2, y + 0.0018, 0x9a9283);
}

function ground(m, p, cell) {
  const wx = cell.x - midX,
    wz = cell.y - midZ,
    r = m.rng;
  // The bedding: grit, with a little turf in the joints of the wild rock.
  const G = 3;
  for (let i = 0; i < G; i++)
    for (let j = 0; j < G; j++) {
      const q = [
        [i, j],
        [i, j + 1],
        [i + 1, j + 1],
        [i + 1, j]
      ].map(([a, b]) => {
        const u = a / G - 0.5,
          v = b / G - 0.5,
          x = wx + u,
          z = wz + v,
          n = wave(x * 2.3, z * 2.1),
          wild = smooth(0.1, 0.6, offDressed(x, z));
        const grit = m.mix(0x4c4a46, 0x625f58, n),
          turf = m.mix(0x56603f, 0x6e7449, n);
        return [[u, bed, v], m.mix(grit, turf, wild * smooth(0.45, 0.75, wave(x * 0.8 + 3, z * 0.7)))];
      });
      m.face(
        q.map(([pt]) => pt),
        q.map(([, c]) => c)
      );
    }
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
        [a[0], stoneTop - 0.01, a[1]],
        [b[0], stoneTop - 0.01, b[1]],
        [b[0], -0.06, b[1]],
        [a[0], -0.06, a[1]]
      ],
      m.mix(p[0], p[2], 0.5)
    );
  }
  // The stones, three to a tile side. On the way they are laid in running bond and in
  // the court as squares; the wild rock has split into plates of one to four cells.
  const I0 = cell.x * S,
    J0 = cell.y * S,
    kindAt = (I, J) => {
      const x = (I + 0.5) / S - layout.width / 2,
        z = (J + 0.5) / S - layout.height / 2;
      return inCourt(x, z) ? 'court' : inWay(x, z) ? 'way' : 'rock';
    };
  const taken = new Set(),
    groups = [];
  const free = (i, j, kind) =>
    i < S && j < S && !taken.has(i + j * S) && kindAt(I0 + i, J0 + j) === kind;
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      if (taken.has(i + j * S)) continue;
      const I = I0 + i,
        J = J0 + j,
        kind = kindAt(I, J),
        h = hash2(I, J, 5);
      let w = 1,
        d = 1;
      if (kind === 'rock') {
        if (h < 0.22 && free(i + 1, j, kind) && free(i, j + 1, kind) && free(i + 1, j + 1, kind)) w = d = 2;
        else if (h < 0.55 && free(i + 1, j, kind)) w = 2;
        else if (h < 0.8 && free(i, j + 1, kind)) d = 2;
      } else if (kind === 'way' && (J + (i === 0 ? 0 : 1)) % 2 === 0 && free(i + 1, j, kind)) w = 2;
      for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) taken.add(i + a + (j + b) * S);
      groups.push([I, J, w, d, kind]);
    }
  for (const [I, J, w, d, kind] of groups) {
    // The outline, corner by corner round the group, keeping the points between.
    const pts = [];
    for (let k = 0; k < w; k++) pts.push(corner(I + k, J));
    for (let k = 0; k < d; k++) pts.push(corner(I + w, J + k));
    for (let k = w; k > 0; k--) pts.push(corner(I + k, J + d));
    for (let k = d; k > 0; k--) pts.push(corner(I, J + k));
    const local = pts.map(([x, z]) => [x - wx, z - wz]);
    const cx = (I + w / 2) / S - layout.width / 2,
      cz = (J + d / 2) / S - layout.height / 2,
      salt = I * 131 + J * 17,
      h = stoneTop - (kind === 'rock' ? hash2(I, J, 6) * 0.01 : 0.002 * hash2(I, J, 6));
    const [sx, sz] = slab(m, local, h, stoneTone(m, kind, cx, cz, salt), kind === 'rock', salt);
    if (kind !== 'rock') continue;
    // Lichen: rusty orange, sulphur and grey-green crusts on the tops.
    const size = Math.sqrt(w * d);
    for (let q = 0; q < (size > 1.5 ? 3 : 1); q++) {
      const l = hash2(I + q, J, 8);
      if (l > 0.55) continue;
      const col =
        l < 0.08 ? 0xa8804a : l < 0.3 ? m.mix(0xa9a466, 0x96995e, l) : m.mix(0x9aa18c, 0xb6b9a4, l);
      const ox = (hash2(I, J + q, 9) - 0.5) * 0.12 * size,
        oz = (hash2(I, J + q, 10) - 0.5) * 0.12 * size;
      lichen(m, sx + ox, sz + oz, h + 0.0035, 0.03 + 0.04 * hash2(I, J + q, 11), col, salt + q);
      lichen(m, sx + ox + 0.05, sz + oz - 0.03, h + 0.004, 0.02, m.mix(col, 0xd2ac66, 0.3), salt + q + 5);
    }
    // A frost crack across the slab.
    if (hash2(I, J, 12) < 0.4) {
      const a = hash2(I, J, 13) * Math.PI,
        ca = Math.cos(a) * 0.09 * size,
        sa = Math.sin(a) * 0.09 * size,
        y = h + 0.003;
      m.face(
        [
          [sx - ca, y, sz - sa],
          [sx + ca * 0.1 - sa * 0.06, y, sz + sa * 0.1 + ca * 0.06],
          [sx + ca, y, sz + sa],
          [sx + ca * 0.1 - sa * 0.045, y, sz + sa * 0.1 + ca * 0.045]
        ],
        0x45423d
      );
    }
  }
  // Grit and chips in the joints of the wild rock, and a blade of grass or two.
  const wild = smooth(0.1, 0.6, offDressed(wx, wz));
  if (wild > 0.5) {
    for (let k = 0; k < 4; k++) {
      const x = r.range(-0.45, 0.45),
        z = r.range(-0.45, 0.45),
        s = r.range(0.012, 0.03);
      m.rock(x, bed - 0.004, z, s, s * 0.8, s * 0.8, 0x5e5a53, m.mix(p[0], p[1], 0.4), 5, r.range(0, 3));
    }
    if (hash2(cell.x, cell.y, 14) < 0.55)
      tuft(m, r.range(-0.4, 0.4), bed, r.range(-0.4, 0.4), 0.09);
  }
  if (cell.x === altar[0] + midX && cell.y === altar[1] + midZ) dais(m);
  if (inCourt(wx, wz) || Math.hypot(wx - altar[0], wz - altar[1]) < 2) altarRing(m, wx, wz);
  return true;
}

// ---------------------------------------------------------------------------
// The tiles' own furnishings.

const granite = [0x7f7a71, 0x8f897e, 0x9d968a, 0x6f6c66],
  graniteLit = 0xbab3a4,
  snow = 0xeef1f2,
  carved = 0x3b3631,
  flameRed = 0xa3402e,
  flameGold = 0xd39a48;

// A flame of the 明教 cut in relief on an upright face (the frame's plane z = 0,
// facing +z): a red tongue round a gold heart.
function flameMark(m, x, y, z, s) {
  const outer = [
    [0, -0.5],
    [0.32, -0.36],
    [0.42, -0.05],
    [0.26, 0.2],
    [0.18, 0.5],
    [0.05, 0.22],
    [-0.1, 0.42],
    [-0.2, 0.12],
    [-0.38, 0.0],
    [-0.36, -0.3]
  ].map(([u, v]) => [x + u * s, y + v * s, z]);
  m.face(outer, flameRed);
  m.face(
    [
      [0, -0.36],
      [0.18, -0.2],
      [0.12, 0.08],
      [0.02, -0.02],
      [-0.1, 0.1],
      [-0.18, -0.18]
    ].map(([u, v]) => [x + u * s, y + v * s, z + 0.003]),
    flameGold
  );
}

// Columns of carved characters, worn shallow: dark dots on the stone's face.
function inscription(m, x0, x1, y0, y1, z, cols, rows, salt) {
  for (let c = 0; c < cols; c++)
    for (let k = 0; k < rows; k++) {
      if (hash2(salt, c * 13 + k, 31) < 0.18) continue;
      const x = x0 + ((c + 0.5) * (x1 - x0)) / cols,
        y = y1 - ((k + 0.5) * (y1 - y0)) / rows,
        s = Math.min((x1 - x0) / cols, (y1 - y0) / rows) * 0.62;
      m.box(x, y, z, s, s, 0.006, carved);
    }
}

// A stele snapped in its fall: the stump on its plinth, the top with its rounded,
// flame-carved head lying on the ground beside it, shards between.
function brokenStele(m, cell) {
  const r = m.rng,
    side = (cell.x * 3 + cell.y) % 2 ? 1 : -1,
    stone = m.mix(granite[1], granite[2], r.next()),
    lit = m.mix(stone, graniteLit, 0.4);
  m.frame(0, 0, -0.22, side * 0.18, 1.18, () => {
    // The plinth, in two steps.
    m.box(0, 0.065, 0, 0.56, 0.05, 0.25, m.mix(granite[0], lit, 0.2));
    m.box(0, 0.1, 0, 0.48, 0.04, 0.2, granite[0]);
    // The stump, its break running down from one shoulder.
    const w = 0.19,
      d = 0.055,
      hi = 0.48,
      lo = 0.3;
    const top = [
      [-w, hi],
      [-w * 0.4, hi - 0.03],
      [0, hi - 0.09],
      [w * 0.5, lo + 0.04],
      [w, lo]
    ];
    const front = [[-w, 0.12], ...top, [w, 0.12]];
    for (const s of [-1, 1])
      m.face(
        front.map(([u, v]) => [u, v, s * d]),
        s > 0 ? stone : m.mix(stone, 0x5a564f, 0.2)
      );
    for (let k = 0; k < front.length; k++) {
      const [u0, v0] = front[k],
        [u1, v1] = front[(k + 1) % front.length];
      m.face(
        [
          [u0, v0, -d],
          [u1, v1, -d],
          [u1, v1, d],
          [u0, v0, d]
        ],
        k >= 1 && k < top.length ? lit : m.mix(stone, 0x5a564f, 0.15)
      );
    }
    inscription(m, -0.15, 0.15, 0.15, 0.3, d + 0.002, 4, 4, cell.x * 7 + cell.y);
  });
  // The fallen top, face up, its arched head toward the board's middle.
  m.frame(side * 0.17, 0.02, 0.2, side * 1.25, 1, () => {
    const w = 0.19,
      t = 0.05;
    m.box(0, t / 2 + 0.01, 0, 0.38, t, 0.24, stone);
    const arch = [];
    for (let k = 0; k <= 8; k++) {
      const a = (k * Math.PI) / 8;
      arch.push([-Math.cos(a) * w, 0.12 + Math.sin(a) * 0.12]);
    }
    for (const y of [0.01, 0.01 + t]) {
      const pts = arch.map(([u, v]) => [u, y, -v]);
      m.face(pts, y > 0.02 ? lit : stone);
    }
    for (let k = 0; k < arch.length - 1; k++) {
      const [u0, v0] = arch[k],
        [u1, v1] = arch[k + 1];
      m.face(
        [
          [u0, 0.01, -v0],
          [u1, 0.01, -v1],
          [u1, 0.01 + t, -v1],
          [u0, 0.01 + t, -v0]
        ],
        m.mix(stone, 0x5a564f, 0.2)
      );
    }
    m.frame(0, 0.012 + t, -0.13, 0, 1, () => flameMark(m, 0, 0, 0, 0.16), -Math.PI / 2);
    inscription(m, -0.14, 0.14, -0.1, 0.1, 0, 4, 3, cell.y * 5 + cell.x);
  });
  for (let k = 0; k < 4; k++)
    m.rock(
      r.range(-0.35, 0.35),
      bed,
      r.range(0.05, 0.35),
      r.range(0.03, 0.06),
      r.range(0.03, 0.06),
      r.range(0.03, 0.05),
      granite[k % 4],
      lit,
      5,
      r.range(0, 3)
    );
}

// A stone tortoise (bixi) on its plinth carrying the stump of a stele, the flame
// still on what is left of its face.
function tortoiseStele(m, cell) {
  const r = m.rng,
    side = cell.x < midX ? 1 : -1,
    stone = m.mix(granite[0], granite[1], r.next()),
    lit = m.mix(stone, graniteLit, 0.45);
  m.frame(0, 0, -0.08, side * 0.25, 1.3, () => {
    m.box(0, 0.06, 0, 0.66, 0.05, 0.5, m.mix(granite[3], lit, 0.2));
    // Shell, head and feet.
    m.rock(0, 0.07, 0, 0.27, 0.17, 0.21, stone, lit, 10, 0.3);
    m.hoop(0, 0.14, 0, 0.25, 0.012, m.mix(stone, 0x4a463f, 0.4), 14, 'xz');
    m.rock(0, 0.075, 0.26, 0.07, 0.1, 0.08, stone, lit, 7);
    m.box(0, 0.13, 0.32, 0.07, 0.05, 0.06, m.mix(stone, lit, 0.3));
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        m.rock(sx * 0.21, 0.07, sz * 0.15, 0.06, 0.05, 0.05, stone, lit, 6);
    // The stele's foot in its socket on the shell.
    m.box(0, 0.25, -0.02, 0.32, 0.03, 0.12, granite[3]);
    const w = 0.13,
      d = 0.045;
    const outline = [
      [-w, 0.26],
      [w, 0.26],
      [w, 0.44],
      [w * 0.3, 0.52],
      [-w * 0.2, 0.47],
      [-w, 0.57]
    ];
    for (const s of [-1, 1])
      m.face(
        outline.map(([u, v]) => [u, v, -0.02 + s * d]),
        s > 0 ? stone : m.mix(stone, 0x5a564f, 0.2)
      );
    for (let k = 0; k < outline.length; k++) {
      const [u0, v0] = outline[k],
        [u1, v1] = outline[(k + 1) % outline.length];
      m.face(
        [
          [u0, v0, -0.02 - d],
          [u1, v1, -0.02 - d],
          [u1, v1, -0.02 + d],
          [u0, v0, -0.02 + d]
        ],
        k >= 2 ? lit : m.mix(stone, 0x5a564f, 0.15)
      );
    }
    flameMark(m, 0, 0.4, -0.02 + d + 0.002, 0.13);
    inscription(m, -0.1, 0.1, 0.27, 0.33, -0.02 + d + 0.002, 3, 1, cell.x + cell.y * 3);
  });
}

// A stretch of the old precinct wall: dressed courses, broken down in the middle,
// its blocks tumbled at its foot.
function ruinedWall(m, cell) {
  const r = m.rng,
    flip = (cell.x * 5 + cell.y) % 2 ? 1 : -1;
  m.frame(0, 0, -0.27, 0, 1, () => {
    const courses = [0.11, 0.1, 0.1, 0.09],
      len = 0.92;
    let y = bed;
    for (let c = 0; c < courses.length; c++) {
      const h = courses[c];
      let x = -len / 2 + (c % 2 ? 0.1 : 0);
      if (c % 2) m.box(-len / 2 + 0.05, y + h / 2, 0, 0.09, h - 0.008, 0.2, granite[c % 4]);
      while (x < len / 2 - 0.02) {
        const w = Math.min(len / 2 - x, r.range(0.17, 0.26));
        // The wall has fallen in on one side: the higher courses stop short.
        const gone = flip * (x + w / 2) > 0.45 - c * 0.12 || (c >= 2 && Math.abs(x + w / 2 + flip * 0.05) < 0.14);
        if (!gone)
          m.box(
            x + w / 2,
            y + h / 2,
            r.range(-0.006, 0.006),
            w - 0.012,
            h - 0.008,
            0.2 - c * 0.01,
            m.mix(granite[(c + Math.floor(x * 9)) & 3], graniteLit, r.range(0, 0.25))
          );
        x += w;
      }
      y += h;
    }
    // Coping stones still on the standing end.
    m.box(-flip * 0.28, y + 0.025, 0, 0.36, 0.05, 0.24, m.mix(granite[2], graniteLit, 0.35));
    // Tumbled blocks and rubble on the board side.
    for (let k = 0; k < 4; k++)
      m.frame(
        flip * r.range(0.05, 0.4),
        bed + 0.04,
        r.range(0.15, 0.32),
        r.range(0, circle),
        1,
        () => m.box(0, 0, 0, r.range(0.12, 0.2), 0.08, r.range(0.09, 0.13), granite[k % 4]),
        r.range(-0.3, 0.3),
        r.range(-0.2, 0.2)
      );
    for (let k = 0; k < 5; k++)
      m.rock(
        r.range(-0.4, 0.4),
        bed,
        r.range(0.12, 0.38),
        r.range(0.025, 0.05),
        r.range(0.03, 0.05),
        r.range(0.025, 0.045),
        granite[k % 4],
        graniteLit,
        5,
        r.range(0, 3)
      );
    tuft(m, flip * -0.38, bed, 0.13, 0.12);
  });
}

function ruins(m, p, cell) {
  const { x, y } = cell;
  if ((x === 4 || x === 8) && y === 0) return ruinedWall(m, cell);
  if ((x === 0 || x === 12) && y === 7) return ruinedWall(m, cell);
  if ((x === 5 || x === 7) && (y === 5 || y === 10)) return tortoiseStele(m, cell);
  return brokenStele(m, cell);
}

// A jagged shard of granite: a leaning prism whose top is cut off on a slant.
function shard(m, x, z, base, h, rx, rz, lean, yaw, tone) {
  const r = m.rng,
    n = 5,
    lit = m.mix(tone, graniteLit, 0.45);
  m.frame(x, base, z, yaw, 1, () => {
    const low = [],
      high = [];
    for (let k = 0; k < n; k++) {
      const a = (k * circle) / n + r.range(-0.25, 0.25),
        q = r.range(0.8, 1.15);
      low.push([Math.cos(a) * rx * q, 0, Math.sin(a) * rz * q]);
      const top = h * (0.78 + 0.22 * Math.cos(a - 0.6));
      high.push([Math.cos(a) * rx * q * 0.55 + lean * h, top, Math.sin(a) * rz * q * 0.55]);
    }
    for (let k = 0; k < n; k++) {
      const q = (k + 1) % n;
      m.face([low[k], high[k], high[q], low[q]], [m.rgb(tone), lit, lit, m.rgb(tone)], 0.86 + 0.14 * ((k * 3) % 5) / 4);
    }
    m.face([...high].reverse(), lit);
    // A cap of snow lodged on the slanted top, and a seam of it lower down.
    if (h > 0.45) {
      const c = high.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n, s[2] + p[2] / n], [0, 0, 0]);
      m.face(
        high.map((p) => [c[0] + (p[0] - c[0]) * 0.7, p[1] + 0.012, c[2] + (p[2] - c[2]) * 0.7]).reverse(),
        snow
      );
    }
  });
}

// 嶙峋山石: a knot of frost-split granite, shards leaning together over a boulder,
// lichen on the faces and snow lodged in its clefts.
function crags(m, p, cell) {
  const { x, y } = cell;
  // The hall's steps come down onto these three: nothing of the tile's own.
  if (y === 0 && x >= 5 && x <= 7) return;
  const r = m.rng,
    big = y <= 1;
  m.rock(0, bed - 0.02, 0, 0.42, big ? 0.32 : 0.26, 0.38, granite[3], graniteLit, 9, r.range(0, 3));
  const shards = big ? 6 : 5;
  for (let k = 0; k < shards; k++) {
    const a = (k * circle) / shards + r.range(-0.3, 0.3),
      d = k === 0 ? 0 : r.range(0.14, 0.3),
      h = (k === 0 ? 1 : r.range(0.45, 0.8)) * (big ? 1.35 : 1.05);
    shard(
      m,
      Math.cos(a) * d,
      Math.sin(a) * d - 0.04,
      bed,
      h,
      r.range(0.1, 0.16) * (k === 0 ? 1.35 : 1),
      r.range(0.09, 0.14),
      r.range(-0.12, 0.12),
      r.range(0, circle),
      granite[(k + x) % 4]
    );
  }
  // Boulders at the foot, snow in the hollows between them.
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4 + r.range(-0.4, 0.4) + 0.5;
    m.rock(
      Math.cos(a) * 0.36,
      bed - 0.01,
      Math.sin(a) * 0.34,
      r.range(0.08, 0.13),
      r.range(0.08, 0.15),
      r.range(0.07, 0.11),
      granite[k % 4],
      graniteLit,
      7,
      r.range(0, 3)
    );
  }
  for (let k = 0; k < 2; k++) {
    const a = r.range(0, circle);
    m.rock(Math.cos(a) * 0.3, bed - 0.01, Math.sin(a) * 0.28, 0.1, 0.025, 0.07, 0xd9dee2, snow, 7, a);
  }
  tuft(m, r.range(-0.35, 0.35), bed, 0.38, 0.13);
  tuft(m, -0.38, bed, r.range(-0.3, 0.3), 0.11);
}

// 崖上古松: an old pine gripping a knob of rock at the back of the tile, leaning out
// toward the nearer drop.
function clingingPine(m, p, cell) {
  const r = m.rng,
    wx = cell.x - midX,
    wz = cell.y - midZ;
  // Lean away from the middle of the board, and never toward the camera (south-east).
  let a = Math.atan2(wz, wx);
  if (Math.abs(wx) < 4) a = wx < 0 ? Math.PI * 0.95 : 0.05 - 0.4;
  const bx = -Math.cos(a) * 0.05,
    bz = -0.18;
  m.rock(bx, bed - 0.03, bz, 0.3, 0.2, 0.25, granite[3], m.mix(graniteLit, 0x8a9070, 0.3), 8, r.range(0, 3));
  m.rock(bx + 0.18, bed - 0.02, bz + 0.16, 0.13, 0.1, 0.11, granite[1], graniteLit, 7, r.range(0, 3));
  oldPine(m, bx, 0.16, bz, 0.56 + 0.06 * hash2(cell.x, cell.y, 40), -a, 0.65, 5);
  // Needles and cones fallen round it.
  for (let k = 0; k < 10; k++) {
    const x = r.range(-0.45, 0.45),
      z = r.range(-0.1, 0.45),
      t = r.range(0, circle);
    m.face(
      [
        [x, bed + 0.025, z],
        [x + Math.cos(t) * 0.05, bed + 0.026, z + Math.sin(t) * 0.05],
        [x + Math.cos(t + 0.3) * 0.05, bed + 0.026, z + Math.sin(t + 0.3) * 0.05]
      ],
      0x7a6440
    );
  }
  for (let k = 0; k < 3; k++)
    m.rock(r.range(-0.4, 0.4), bed + 0.015, r.range(0.05, 0.4), 0.022, 0.03, 0.018, 0x6b5032, 0x8c6a42, 6);
  tuft(m, bx - 0.25, bed, bz + 0.1, 0.12);
}

// 山徑藥草: cushions of mountain herbs between stones: snow lotus (雪蓮) with their
// pale bracts closed round the flower, blue gentians and woolly edelweiss.
function snowLotus(m, x, z, s) {
  const r = m.rng;
  for (let k = 0; k < 7; k++) {
    const a = (k * circle) / 7 + r.range(-0.2, 0.2);
    m.leaf(
      [x, bed + 0.01, z],
      [x + Math.cos(a) * 0.12 * s, bed + 0.04 * s, z + Math.sin(a) * 0.12 * s],
      0.035 * s,
      0x51703f,
      0x7f9a5c,
      0.02 * s
    );
  }
  // The flower: a globe of pale yellow-green bracts cupped round a purple heart.
  for (let ring = 0; ring < 2; ring++)
    for (let k = 0; k < 6; k++) {
      const a = (k * circle) / 6 + ring * 0.5,
        l = (ring ? 0.07 : 0.09) * s;
      m.leaf(
        [x, bed + 0.03 * s, z],
        [x + Math.cos(a) * l * 0.55, bed + (0.1 + 0.04 * ring) * s, z + Math.sin(a) * l * 0.55],
        l * 0.42,
        ring ? 0xe6ecd2 : 0xcfdcb4,
        0xf6f7ea,
        0.035 * s
      );
    }
  m.lathe(x, bed + 0.03 * s, z, [[0, 0.025 * s], [0.06 * s, 0.03 * s], [0.09 * s, 0.002]], 0x6a4a7a, 6);
}
function gentian(m, x, z, s) {
  const r = m.rng;
  for (let k = 0; k < 5; k++) {
    const a = r.range(0, circle),
      l = r.range(0.04, 0.07) * s;
    m.leaf([x, bed + 0.005, z], [x + Math.cos(a) * l, bed + 0.02, z + Math.sin(a) * l], 0.012 * s, 0x4f6a3e, 0x6f8a52, 0.01);
  }
  for (let k = 0; k < 3; k++) {
    const a = r.range(0, circle),
      px = x + Math.cos(a) * 0.025 * s,
      pz = z + Math.sin(a) * 0.025 * s;
    m.crystal(px, bed + 0.02, pz, 0.016 * s, 0.05 * s, 0x2f4fa0, 0x6f8fd8, 5);
  }
}
function edelweiss(m, x, z, s) {
  for (let k = 0; k < 5; k++) {
    const a = (k * circle) / 5;
    m.leaf(
      [x, bed + 0.03 * s, z],
      [x + Math.cos(a) * 0.035 * s, bed + 0.034 * s, z + Math.sin(a) * 0.035 * s],
      0.012 * s,
      0xdedfd2,
      0xf3f2e8,
      0.005
    );
  }
  m.tube([x, bed, z], [x, bed + 0.03 * s, z], 0.004, 0.003, 0x9aa38a, 3);
}
function mountainHerbs(m, p, cell) {
  const r = m.rng;
  for (const [x, z, s] of [
    [-0.3, -0.28, 1.1],
    [0.22, -0.32, 0.95],
    [0.34, 0.1, 0.8],
    [-0.36, 0.18, 0.85]
  ])
    snowLotus(m, x + r.range(-0.03, 0.03), z + r.range(-0.03, 0.03), s);
  for (let k = 0; k < 7; k++) {
    const a = (k * circle) / 7 + r.range(-0.3, 0.3),
      d = r.range(0.25, 0.44);
    if (k % 2) gentian(m, Math.cos(a) * d, Math.sin(a) * d, r.range(0.8, 1.2));
    else edelweiss(m, Math.cos(a) * d, Math.sin(a) * d, r.range(0.9, 1.3));
  }
  for (let k = 0; k < 5; k++) {
    const a = r.range(0, circle),
      d = r.range(0.3, 0.46);
    m.rock(Math.cos(a) * d, bed - 0.01, Math.sin(a) * d, 0.05, 0.05, 0.04, granite[k % 4], graniteLit, 6, a);
  }
  tuft(m, -0.05, bed, -0.42, 0.12);
  tuft(m, 0.42, bed, -0.05, 0.1);
}

// Open ground: now and then a pebble or a pine cone blown out over the rock.
function scatter(m, p, cell) {
  const r = m.rng,
    wx = cell.x - midX,
    wz = cell.y - midZ;
  if (inCourt(wx, wz) || inWay(wx, wz)) return;
  const n = Math.floor(hash2(cell.x, cell.y, 50) * 3);
  for (let k = 0; k < n; k++) {
    const x = r.range(-0.44, 0.44),
      z = r.range(-0.44, 0.44);
    if (Math.abs(x) < 0.25 && Math.abs(z) < 0.25) continue;
    m.rock(x, stoneTop - 0.01, z, 0.025, 0.02, 0.02, granite[k % 4], graniteLit, 5, r.range(0, 3));
  }
}

const tiles18 = {
  ground,
  plain: scatter,
  cover: ruins,
  bamboo: clingingPine,
  herbs: mountainHerbs,
  rock: crags
};

export { tiles18, flameMark, inscription, shard, granite, graniteLit, snow, flameRed, flameGold };
