// 谷底棋臺 only: the floor of the valley round the stone table, the pond the
// waterfall fills, and the four cliffs that close the valley in. Everything is
// measured from the centre of the board; x runs east and z runs south.
import { Model, circle } from '../scenery-kit.js';
import { oldPine } from './peaks-4.js';

// The pond is the map's own water plane (maze-atmosphere.js gives 谷底棋臺 this
// level), so every other piece of ground has to stay above it.
const WATER = -0.13;
const FLOOR = -0.1;
const HALF = 6.5;
// Mist and dusk light painted into the rock. `haze` is the map's horizon colour.
const haze = 0xb0b5b6;
const gold = 0xc9aa7c;
// Where the sword mound and the eagle's boulder stand, for the ground and its litter.
const MOUND = [1.7, -8.75];
const PERCH = [-8.0, 0.4];

const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
const mix = (a, b, t) => a + (b - a) * t;
function smooth(a, b, v) {
  const q = clamp((v - a) / (b - a), 0, 1);
  return q * q * (3 - 2 * q);
}
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  return mix(
    mix(hash(ix, iz), hash(ix + 1, iz), u),
    mix(hash(ix, iz + 1), hash(ix + 1, iz + 1), u),
    v
  );
}
const fbm = (x, z) =>
  0.55 * noise(x, z) +
  0.3 * noise(x * 2.1 + 17.3, z * 2.1 - 9.1) +
  0.15 * noise(x * 4.3 - 5.7, z * 4.3 + 3.3);

// The kit draws a face as it is wound, and the shadow pass pushes each lookup
// along the wound normal: a face wound away from the light shades itself and
// goes dark and blue. These wind a face to look along `way`, upward, or away
// from a point inside the thing it belongs to.
function faceAlong(m, pts, col, way) {
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  if (nx * way[0] + ny * way[1] + nz * way[2] >= 0) m.face(pts, col);
  else
    m.face(
      [...pts].reverse(),
      Array.isArray(col) && Array.isArray(col[0]) ? [...col].reverse() : col
    );
}
const faceUp = (m, pts, col) => faceAlong(m, pts, col, [0, 1, 0]);
function faceOut(m, pts, col, from) {
  const way = [0, 1, 2].map((k) => pts.reduce((t, q) => t + q[k], 0) / pts.length - from[k]);
  faceAlong(m, pts, col, way);
}

// ---------------------------------------------------------------------------
// The foot of the cliffs in plan, walked from the south-east corner northward.
// North of the pond the east wall stands a step nearer the table; the fall
// leaps from the face of that step, which looks south, to the opening camera.
// Every stretch of the wall looks toward the middle of the board, so a camera
// outside the valley sees only the far walls. A third number marks a corner
// that stays sharp.
const plan = [
  [10.2, 8.6],
  [10.5, 6.0],
  [10.7, 3.2],
  [10.8, 0.4],
  [10.75, -2.2, 1],
  [9.9, -2.4],
  [8.95, -2.6, 1],
  [9.0, -4.5],
  [9.2, -6.6],
  [8.9, -8.6],
  [7.8, -10.0],
  [5.5, -10.7],
  [2.0, -10.9],
  [-2.0, -10.6],
  [-5.5, -10.8],
  [-8.2, -10.1],
  [-9.8, -8.3],
  [-10.4, -5.0],
  [-10.2, -1.5],
  [-10.5, 2.5],
  [-10.3, 6.0],
  [-9.6, 8.8],
  [-7.8, 10.4],
  [-4.2, 11.0],
  [0.5, 10.8],
  [4.6, 11.0],
  [8.0, 10.3]
];
function inside(ring, x, z) {
  let odd = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) odd = !odd;
  }
  return odd;
}
// The plan cut into steps of about half a pace, eased everywhere but at the
// sharp corners, with each point's distance along the wall and the direction
// that looks into the valley.
const ring = (() => {
  const pts = [];
  for (let i = 0; i < plan.length; i++) {
    const [ax, az, sharp] = plan[i],
      [bx, bz] = plan[(i + 1) % plan.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.56));
    for (let j = 0; j < steps; j++)
      pts.push({ x: mix(ax, bx, j / steps), z: mix(az, bz, j / steps), sharp: j === 0 && !!sharp });
  }
  const n = pts.length,
    at = (i) => pts[(i + n) % n];
  for (let pass = 0; pass < 3; pass++) {
    const next = pts.map((p, i) => {
      if ([-1, 0, 1].some((d) => at(i + d).sharp)) return p;
      const a = at(i - 1),
        b = at(i + 1);
      return { ...p, x: (a.x + 2 * p.x + b.x) / 4, z: (a.z + 2 * p.z + b.z) / 4 };
    });
    next.forEach((p, i) => (pts[i] = p));
  }
  let s = 0;
  pts.forEach((p, i) => {
    const a = at(i - 1),
      b = at(i + 1);
    let nx = -(b.z - a.z),
      nz = b.x - a.x;
    const l = Math.hypot(nx, nz) || 1;
    nx /= l;
    nz /= l;
    if (!inside(pts, p.x + nx * 0.2, p.z + nz * 0.2)) {
      nx = -nx;
      nz = -nz;
    }
    p.nx = nx;
    p.nz = nz;
    p.s = s;
    s += Math.hypot(b.x - p.x, b.z - p.z);
  });
  return pts;
})();
// Distance to the cliff foot: positive in the valley, negative behind the wall.
function wallDistance(x, z) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j],
      b = ring[i];
    const ux = b.x - a.x,
      uz = b.z - a.z;
    const t = clamp(((x - a.x) * ux + (z - a.z) * uz) / (ux * ux + uz * uz || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - a.x - ux * t, z - a.z - uz * t));
  }
  return inside(ring, x, z) ? best : -best;
}
const nearest = (x, z) =>
  ring.reduce(
    (best, p, i) =>
      Math.hypot(p.x - x, p.z - z) < Math.hypot(ring[best].x - x, ring[best].z - z) ? i : best,
    0
  );

// ---------------------------------------------------------------------------
// The ground. A pond lies against the east wall and reaches into the table's
// east edge; elsewhere the floor is a little above the water beside the table
// and climbs to a bank of scree at the foot of the cliffs.
const outside = (x, z) =>
  Math.hypot(Math.max(0, Math.abs(x) - HALF - 0.3), Math.max(0, Math.abs(z) - HALF - 0.3));
function pond(x, z) {
  const e =
    Math.hypot((x - 8.6) / 2.4, (z - 0.3) / 2.8) + 0.16 * (noise(x * 0.9 + 3, z * 0.9) - 0.5);
  return smooth(1.06, 0.8, e);
}
function ground(x, z) {
  const d = outside(x, z),
    w = wallDistance(x, z);
  const hill = fbm(x * 0.29 + 4.2, z * 0.29 - 1.7),
    ripple = noise(x * 1.9 - 2, z * 1.9 + 5) - 0.5;
  let y =
    FLOOR +
    0.02 * ripple * smooth(0.2, 1.4, d) +
    0.16 * smooth(0.8, 3.2, d) +
    0.42 * hill * smooth(0.6, 3.0, d);
  // Scree banked against the wall, and behind the wall the ground only climbs.
  y += 1.1 * smooth(2.0, 0, w) ** 1.6;
  if (w < 0) y += Math.min(3.2, -w * 0.5);
  y += 0.25 * Math.exp(-((x - MOUND[0]) ** 2 + (z - MOUND[1]) ** 2) / 2.4);
  return mix(y, -0.62, pond(x, z));
}

const earth = [0x3f4440, 0x52574f],
  moss = 0x485c40,
  scree = 0x696f6f,
  damp = 0x343d3c,
  litter = 0x66604c;
function soil(m, x, z, y) {
  const w = wallDistance(x, z);
  let c = m.mix(earth[0], earth[1], fbm(x * 0.7 + 9, z * 0.7));
  c = m.mix(c, moss, 0.6 * smooth(0.42, 0.72, noise(x * 0.55 - 7, z * 0.55 + 2)));
  c = m.mix(c, litter, 0.32 * smooth(0.62, 0.85, noise(x * 1.3 + 31, z * 1.3 - 13)));
  c = m.mix(c, scree, 0.7 * smooth(1.8, 0.3, w) + 0.3 * smooth(0.4, 1.3, y));
  c = m.mix(c, damp, 0.7 * smooth(0.5, 1.0, pond(x * 0.93 + 0.6, z * 0.93)) + 0.5 * pond(x, z));
  // The west and south walls stand between the floor and the sun; the last
  // light reaches only the north-east of the valley.
  const shade = smooth(4.5, -8, x - z * 0.5);
  c = m.mix(c, 0x323c48, 0.34 * shade);
  c = m.mix(c, 0x857a58, 0.08 * (1 - shade));
  // Behind the walls the ground is lost in mist.
  return m.mix(c, haze, 0.8 * smooth(-0.3, -7, w));
}
function valleyFloor(m) {
  const axis = [-36, -29, -23, -18.5, -16];
  for (let v = -14.5; v <= 14.5; v += 0.5) axis.push(v);
  axis.push(16, 18.5, 23, 29, 36);
  const n = axis.length;
  const grid = axis.map((z, j) =>
    axis.map((x, i) => {
      // Points near the table stay on the half-tile grid; the rest are shaken loose.
      const loose =
        Math.max(Math.abs(x), Math.abs(z)) > HALF + 0.6 && Math.max(Math.abs(x), Math.abs(z)) < 15;
      const px = x + (loose ? (hash(i * 1.37, j * 2.11) - 0.5) * 0.3 : 0),
        pz = z + (loose ? (hash(i * 3.71 + 5, j * 1.19) - 0.5) * 0.3 : 0);
      const y = ground(px, pz);
      return { p: [px, y, pz], c: soil(m, px, pz, y) };
    })
  );
  for (let j = 0; j < n - 1; j++)
    for (let i = 0; i < n - 1; i++) {
      const cx = (axis[i] + axis[i + 1]) / 2,
        cz = (axis[j] + axis[j + 1]) / 2;
      // The table covers its own square, and its pool tiles are under water.
      if (Math.abs(cx) < HALF && Math.abs(cz) < HALF) continue;
      const a = grid[j][i],
        b = grid[j][i + 1],
        c = grid[j + 1][i + 1],
        d = grid[j + 1][i];
      if ((i + j) % 2) {
        faceUp(m, [a.p, d.p, c.p], [a.c, d.c, c.c]);
        faceUp(m, [a.p, c.p, b.p], [a.c, c.c, b.c]);
      } else {
        faceUp(m, [a.p, d.p, b.p], [a.c, d.c, b.c]);
        faceUp(m, [b.p, d.p, c.p], [b.c, d.c, c.c]);
      }
    }
}

// What lies on the floor: rocks fallen from the walls, tufts of valley grass,
// the year's leaves, and the stones round the pond. Nothing here stands more
// than knee high near the table.
function free(x, z, margin = 0.5) {
  return (
    outside(x, z) > margin &&
    wallDistance(x, z) > 0.4 &&
    pond(x, z) < 0.04 &&
    Math.hypot(x - MOUND[0], z - MOUND[1]) > 2.5 &&
    Math.hypot(x - PERCH[0], z - PERCH[1]) > 1.5
  );
}
const leafTones = [0xb08a3c, 0x9a5a33, 0xc2a552, 0x7a5a3a, 0xa6703a];
function leafLitter(m, x, y, z) {
  const r = m.rng,
    a = r.range(0, circle),
    l = r.range(0.07, 0.12),
    tone = r.pick(leafTones);
  m.leaf(
    [x, y, z],
    [x + Math.cos(a) * l, y + r.range(0, 0.012), z + Math.sin(a) * l],
    l * 0.34,
    tone,
    m.mix(tone, 0xd8c070, 0.25),
    0.006
  );
}
function tuft(m, x, y, z, s) {
  const r = m.rng;
  for (let k = 0; k < 6; k++) {
    const a = (k * circle) / 6 + r.range(-0.4, 0.4),
      l = s * r.range(0.6, 1.1);
    m.leaf(
      [x, y, z],
      [x + Math.cos(a) * l, y + l * r.range(0.25, 0.7), z + Math.sin(a) * l],
      l * 0.13,
      r.pick([0x55683f, 0x62754a, 0x6f7f4e]),
      r.pick([0x8a9560, 0x9a9a62]),
      l * 0.55
    );
  }
}
// A fern: a ring of arching fronds, each a pair of blades.
function fern(m, x, y, z, s) {
  const r = m.rng;
  for (let k = 0; k < 7; k++) {
    const a = (k * circle) / 7 + r.range(-0.3, 0.3),
      l = s * r.range(0.7, 1.1),
      tone = r.pick([0x3f5f3c, 0x4a6b42, 0x567548]);
    const tip = [x + Math.cos(a) * l, y + l * 0.18, z + Math.sin(a) * l];
    m.leaf([x, y, z], tip, l * 0.2, tone, m.mix(tone, 0x8a9a5a, 0.35), l * 0.42);
  }
}
function litterFloor(m) {
  const r = m.rng;
  for (let k = 0; k < 190; k++) {
    const x = r.range(-10.6, 10.8),
      z = r.range(-11, 11);
    if (!free(x, z, 0.45)) continue;
    const w = wallDistance(x, z),
      near = outside(x, z);
    // Big blocks only under the walls they fell from.
    const big = w < 1.9 && r.next() < 0.5;
    const s = big ? r.range(0.35, 0.8) : r.range(0.08, 0.26),
      h = big ? s * r.range(0.5, 0.9) : s * r.range(0.5, 1.0);
    if (near < 2.2 && s > 0.3) continue;
    m.rock(
      x,
      ground(x, z) - h * 0.22,
      z,
      s,
      h,
      s * r.range(0.65, 1),
      r.pick([0x535856, 0x5e625c, 0x4b5152]),
      r.pick([0x7d8279, 0x8a8d80, 0x6f7a5c]),
      big ? 9 : 7,
      r.range(0, circle)
    );
  }
  for (let k = 0; k < 170; k++) {
    const x = r.range(-10.4, 10.6),
      z = r.range(-10.8, 10.8);
    if (!free(x, z, 0.35)) continue;
    tuft(m, x, ground(x, z) - 0.01, z, r.range(0.13, 0.3));
  }
  for (let k = 0; k < 950; k++) {
    const x = r.range(-10.4, 10.6),
      z = r.range(-10.8, 10.8);
    if (!free(x, z, 0.3)) continue;
    // Leaves gather where the litter is painted into the soil.
    if (noise(x * 1.3 + 31, z * 1.3 - 13) < 0.45 && r.next() < 0.7) continue;
    leafLitter(m, x, ground(x, z) + 0.012, z);
  }
  // Grass has grown up against the foot of the table all round.
  for (let k = 0; k < 64; k++) {
    const side = k % 4,
      t = r.range(-HALF - 0.2, HALF + 0.2),
      d = HALF + r.range(0.36, 0.5);
    const x = side === 0 ? t : side === 1 ? d : side === 2 ? t : -d,
      z = side === 0 ? -d : side === 1 ? t : side === 2 ? d : t;
    if (pond(x, z) > 0.02) continue;
    tuft(m, x, ground(x, z) - 0.01, z, r.range(0.1, 0.19));
  }
  // Ferns in the damp under the walls and round the pond.
  for (let k = 0; k < 70; k++) {
    const x = r.range(-10.4, 10.6),
      z = r.range(-10.8, 10.8);
    const w = wallDistance(x, z);
    if (!free(x, z, 0.9) || (w > 1.7 && pond(x * 0.9 + 0.86, z * 0.9 + 0.03) < 0.02)) continue;
    fern(m, x, ground(x, z), z, r.range(0.28, 0.5));
  }
  // Stones set round the pond by the water, and a few standing in it.
  for (let k = 0; k < 26; k++) {
    const a = (k * circle) / 26 + r.range(-0.08, 0.08);
    const x = 8.6 + Math.cos(a) * 2.4 * r.range(0.93, 1.04),
      z = 0.3 + Math.sin(a) * 2.8 * r.range(0.93, 1.04);
    if (outside(x, z) < 0.45 || wallDistance(x, z) < 0.3) continue;
    const s = r.range(0.12, 0.3);
    m.rock(
      x,
      WATER - 0.1,
      z,
      s,
      s * r.range(0.9, 1.5),
      s * r.range(0.7, 1),
      0x4a5350,
      r.pick([0x7b837a, 0x69755f]),
      7,
      a
    );
  }
  for (const [x, z, s] of [
    [10.15, -0.75, 0.4],
    [8.5, -1.5, 0.27],
    [9.0, -0.35, 0.24],
    [9.2, 1.9, 0.22],
    [7.6, 2.35, 0.18]
  ])
    m.rock(x, WATER - 0.18, z, s, s * 1.15, s * 0.8, 0x47504e, 0x76807a, 8, x);
  // White water where the fall lands.
  for (let k = 0; k < 9; k++) {
    const a = (k * circle) / 9,
      d = k % 2 ? 0.34 : 0.62;
    foam(m, 9.45 + Math.cos(a) * d * 1.3, -1.6 + Math.sin(a) * d * 0.7, r.range(0.16, 0.3));
  }
  foam(m, 9.45, -1.65, 0.5);
  foam(m, 10.45, -1.7, 0.2);
}
function foam(m, x, z, s) {
  const r = m.rng,
    n = 7,
    turn = r.range(0, circle);
  const rim = Array.from({ length: n }, (_, i) => {
    const a = turn + (i * circle) / n,
      k = r.range(0.75, 1.15);
    return [x + Math.cos(a) * s * k, WATER + 0.004, z + Math.sin(a) * s * k * 0.8];
  });
  for (let i = 0; i < n; i++)
    faceUp(
      m,
      [[x, WATER + s * 0.22, z], rim[(i + 1) % n], rim[i]],
      [m.rgb(0xf2f6f4), m.rgb(0xc3d9d8), m.rgb(0xc3d9d8)]
    );
}

// ---------------------------------------------------------------------------
// The cliffs: one wall round the whole valley, sheer as if cut, in blocky beds
// that lean back a little as they rise. Late sun comes over the lower west
// wall and gilds the upper east and north faces; the feet stand in mist.
const levels = [0.5, 1.15, 1.95, 2.9, 4.0, 5.2, 6.6, 8.2, 10.0, 12.0, 14.2, 16.6, 19.2, 22.2, 26];
// The fall leaves the wall through a notch in its crest.
const fallAt = nearest(9.45, -2.5);
function crest(i) {
  const p = ring[i];
  let h = 20.2 + 3.4 * fbm(p.s * 0.13, 7.7) + 1.2 * hash(i * 0.37, 2.2);
  // The west wall is the low one: the evening light comes in over it.
  h = mix(h, 15.2 + 2.2 * fbm(p.s * 0.17, 1.3), smooth(-7.5, -9.5, p.x));
  const d = Math.abs(i - fallAt);
  return mix(h, 14.6, smooth(3.2, 1.2, d));
}
function wallColumn(m, i) {
  const p = ring[i],
    top = crest(i);
  const foot = [p.x + p.nx * 0.85, 0, p.z + p.nz * 0.85];
  foot[1] = ground(foot[0], foot[2]) - 0.3;
  const out = [{ p: foot, c: m.mix(scree, haze, 0.35) }];
  for (let k = 0; k < levels.length; k++) {
    const y = Math.min(levels[k], top),
      last = levels[k] >= top;
    // Sheer faces: runs of two to four columns stand forward or back together
    // through four beds at a time, like pillars split off along upright joints.
    const tier = Math.floor(k / 4),
      width = 2 + ((tier + 1) % 3),
      block = Math.floor((i + Math.floor(hash(tier, 3.3) * 7)) / width),
      joint = hash(block * 1.31, tier * 2.17);
    const inward =
      0.78 * (1 - smooth(0, 1.6, y)) ** 1.5 -
      0.07 * y +
      (k && k % 4 === 0 ? 0.16 : 0) +
      (joint - 0.5) * 0.6 +
      (fbm(p.s * 0.21, y * 0.13) - 0.5) * 1.0 +
      (hash(i * 0.91, k * 0.63) - 0.5) * 0.06;
    const at = [
      p.x + p.nx * inward,
      y + (last ? 0 : (hash(i * 0.3, k) - 0.5) * 0.12),
      p.z + p.nz * inward
    ];
    // Faint bedding, the pillars a shade apart, old water stains, moss low down and on the ledges.
    const band = 0.5 + 0.5 * Math.sin(y * 1.1 + 2.4 * fbm(p.s * 0.1, 3.1));
    let c = m.mix(0x474e52, 0x6f7775, 0.25 + 0.45 * band);
    c = c.map((v) => v * (0.92 + 0.16 * joint));
    if (hash(i * 7.13, 1.7) > 0.72) c = m.mix(c, 0x33393c, 0.28 * smooth(1.5, 4, y));
    c = m.mix(c, 0x56664a, 0.45 * smooth(3.4, 0.5, y) + (k && k % 4 === 0 ? 0.25 : 0));
    // The late sun comes in over the low west wall. The scene's own key light
    // gilds the faces turned to it; what is painted here is the west wall's
    // shadow lying across their lower part, and a little warmth above its edge.
    const facing = Math.max(0, p.nx * -0.86 + p.nz * 0.5) ** 0.5,
      edge = 13.5 - (p.x + 10.3) * 0.5,
      lit = smooth(edge - 1.2, edge + 2.6, y);
    c = m
      .mix(c, 0x3a4654, 0.55 * facing * (1 - lit))
      .map((v) => v * (1 - facing * mix(0.5, 0.3, lit)));
    // Their rock is painted a little blue, so that the orange light leaves it grey and not brown.
    c = m.mix(c, 0x55687c, 0.4 * facing);
    c = m.mix(c, gold, 0.12 * facing * lit);
    // The rock behind the fall is dark with wet.
    c = m.mix(c, 0x2c3a38, 0.5 * smooth(5, 1.5, Math.abs(i - fallAt)));
    c = m.mix(c, haze, 0.04 + 0.22 * smooth(2.6, 0, y));
    out.push({ p: at, c });
    if (last) break;
  }
  return out;
}
// Each face of the wall remembers its own middle and the way its stretch of
// wall looks, so the shader can drop it whole when the camera is behind it
// (see seenFromWithin). Whatever hangs on the wall is tied to a spot of it
// and goes with it.
function tied(wall, centre, facing, draw) {
  const from = wall.m.parts[0].p.length / 3;
  draw();
  for (let v = from; v < wall.m.parts[0].p.length / 3; v++) {
    wall.centres.push(...centre);
    wall.facings.push(...facing);
  }
}
function wallFace(wall, pts, cols, hint) {
  // Newell's normal, so a face that has closed to a triangle at the crest still counts.
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const l = Math.hypot(nx, ny, nz);
  if (l < 1e-7) return;
  // Wound so the face looks into the valley (and upward where it is a ledge).
  const flip = nx * hint[0] + ny * 0.4 + nz * hint[1] < 0;
  const centre = [0, 1, 2].map((k) => pts.reduce((t, q) => t + q[k], 0) / pts.length);
  // Judged by the way its stretch of wall looks, not its own facet, so a wall
  // goes as a whole and leaves no ledge or foot behind.
  tied(wall, centre, [hint[0], 0.12, hint[1]], () =>
    wall.m.face(flip ? [...pts].reverse() : pts, flip ? [...cols].reverse() : cols)
  );
}
// A point on the face of the wall, `col` columns along (fractions allowed) and y up.
function onWall(columns, col, y) {
  const n = columns.length,
    i = Math.floor(col),
    f = col - i;
  const at = (column) => {
    for (let k = 1; k < column.length; k++) {
      const a = column[k - 1].p,
        b = column[k].p;
      if (y <= b[1] || k === column.length - 1) {
        const t = clamp((y - a[1]) / (b[1] - a[1] || 1), 0, 1);
        return [mix(a[0], b[0], t), y, mix(a[2], b[2], t)];
      }
    }
    return column[0].p;
  };
  const a = at(columns[((i % n) + n) % n]),
    b = at(columns[(((i + 1) % n) + n) % n]);
  return [mix(a[0], b[0], f), y, mix(a[2], b[2], f)];
}
// Falling water. It leaps clear of the lip and drops free, so it reads as a
// fall and not as a pale streak on the rock: strands side by side, spreading
// as they drop, ragged at the edges, whitest where they break at the foot.
function fall(wall, columns, col, half, top, bottom, salt, reach = 1.7) {
  const steps = 16,
    strands = 6,
    p = ring[Math.round(col)];
  const tones = [0x9ccdf0, 0x6fb0e0, 0x5598d0];
  const row = (k) => {
    const t = k / steps,
      y = mix(top, bottom, t * t),
      w = half * (1 + 0.8 * t);
    return Array.from({ length: strands + 1 }, (_, j) => {
      const lip = onWall(
        columns,
        col + mix(-w, w, j / strands) + 0.14 * w * (hash(j * 1.7 + salt, k * 0.9) - 0.5),
        top
      );
      const off = 0.12 + reach * t + 0.07 * hash(j + salt, k);
      return [lip[0] + p.nx * off, y, lip[2] + p.nz * off];
    });
  };
  // The fall stands clear of its wall, so it is seen from the west as well as
  // the south: round the corner of the step, against the wall behind the pond.
  // Only from the north-east, where every wall near it has gone, does it go too.
  tied(wall, onWall(columns, col, (top + bottom) / 2), [-0.75, 0.14, 0.65], () => {
    let last = row(0);
    for (let k = 1; k <= steps; k++) {
      const next = row(k),
        t = k / steps;
      for (let j = 0; j < strands; j++) {
        const outer = j === 0 || j === strands - 1;
        if (hash(j + salt * 5.3, Math.floor(k / 2)) < (outer ? 0.45 : 0.12) * (1 - t)) continue;
        const tone = (dk, dj) =>
          wall.m.mix(
            tones[(j + dj + salt) % 3],
            0xdcedfb,
            clamp(
              0.7 * hash(j + dj + salt * 3.1, Math.floor((k + dk) / 2)) * (0.3 + 0.7 * t) +
                (outer ? 0 : 0.12) +
                0.6 * smooth(0.8, 1, t),
              0,
              1
            )
          );
        faceAlong(
          wall.m,
          [last[j], last[j + 1], next[j + 1], next[j]],
          [tone(-1, 0), tone(-1, 1), tone(0, 1), tone(0, 0)],
          [p.nx, 0.2, p.nz]
        );
      }
      last = next;
    }
    // The dark slot it issues from, worn into the lip.
    const a = onWall(columns, col - half * 1.3, top - 0.1),
      b = onWall(columns, col + half * 1.3, top - 0.1);
    const out = (q, d, y) => [q[0] + p.nx * d, y, q[2] + p.nz * d];
    faceAlong(
      wall.m,
      [
        out(a, 0.06, top + 0.25),
        out(b, 0.06, top + 0.25),
        out(b, 0.1, top - 0.9),
        out(a, 0.1, top - 0.9)
      ],
      0x2e3538,
      [p.nx, 0, p.nz]
    );
  });
}
// An old pine on a shelf of rock that juts from the face.
function ledgePine(wall, columns, x, z, y, scale, turn) {
  const i = nearest(x, z),
    p = ring[i],
    at = onWall(columns, i, y);
  tied(wall, at, [p.nx, 0.15, p.nz], () => {
    const m = wall.m,
      sx = at[0] + p.nx * 0.35,
      sz = at[2] + p.nz * 0.35;
    m.rock(sx, y - 0.5, sz, 0.75 * scale, 0.5, 0.6 * scale, 0x4a504e, 0x66715a, 8, turn);
    m.rock(
      sx + p.nz * 0.5,
      y - 0.75,
      sz - p.nx * 0.5,
      0.45 * scale,
      0.5,
      0.4 * scale,
      0x444a49,
      0x5f6a58,
      7,
      turn + 1
    );
    // Leaning out over the drop, the way they grow from a crack.
    oldPine(
      m,
      sx + p.nx * 0.2,
      y - 0.02,
      sz + p.nz * 0.2,
      scale,
      Math.atan2(-p.nz, p.nx) + turn,
      0.7,
      4
    );
    for (let k = 0; k < 3; k++)
      tuft(m, sx + p.nz * (k - 1) * 0.4, y + 0.02, sz - p.nx * (k - 1) * 0.4, 0.3 * scale);
  });
}
function cliffs(T) {
  const m = new Model(T, 100129),
    wall = { m, centres: [], facings: [] };
  const columns = ring.map((_, i) => wallColumn(m, i)),
    n = columns.length;
  for (let i = 0; i < n; i++) {
    const A = columns[i],
      B = columns[(i + 1) % n],
      p = ring[i];
    const rows = Math.max(A.length, B.length),
      a = (k) => A[Math.min(k, A.length - 1)],
      b = (k) => B[Math.min(k, B.length - 1)];
    for (let k = 1; k < rows; k++)
      wallFace(
        wall,
        [a(k - 1).p, b(k - 1).p, b(k).p, a(k).p],
        [a(k - 1).c, b(k - 1).c, b(k).c, a(k).c],
        [p.nx, p.nz]
      );
    // The top of the wall runs back into the mist. It belongs to its face of
    // the wall and goes with it, or a near wall's top would hang in the air.
    const ta = a(rows).p,
      tb = b(rows).p,
      q = ring[(i + 1) % n];
    const back = (t, s, lift) => [t[0] - s.nx * 4.5, t[1] + lift, t[2] - s.nz * 4.5];
    const lip = m.mix(m.mix(0x4e5a4a, 0x5d6650, hash(i, 9.1)), haze, 0.25),
      far = m.mix(0x4e5a4a, haze, 0.8);
    tied(wall, [(ta[0] + tb[0]) / 2, ta[1], (ta[2] + tb[2]) / 2], [p.nx, 0.12, p.nz], () =>
      faceUp(m, [ta, tb, back(tb, q, 0.9), back(ta, p, 0.9)], [lip, lip, far, far])
    );
  }
  // The fall: one broad ribbon from the notch in the crest of the step to the
  // pond, and a thin thread beside it.
  fall(wall, columns, fallAt, 0.8, crest(fallAt) + 0.05, WATER - 0.05, 0);
  fall(wall, columns, fallAt - 2.3, 0.16, crest(fallAt - 2) + 0.05, WATER - 0.05, 1, 1.2);
  // Old pines on ledges: low on the north and west walls where the opening
  // camera looks, and one each on the others for whoever turns round.
  for (const [x, z, y, s, turn] of [
    [-4.4, -10.7, 3.0, 1.2, 0.3],
    [5.2, -10.7, 4.5, 1.4, -0.4],
    [-10.3, -3.6, 3.7, 1.3, 0.5],
    [-10.4, 4.4, 2.6, 1.05, -0.3],
    [-9.1, -9.2, 6.6, 1.5, 0],
    [10.5, 5.8, 4.6, 1.25, 0.4],
    [-1.4, 10.9, 3.8, 1.25, -0.5],
    [9.1, -6.4, 6.4, 1.3, 0.2]
  ])
    ledgePine(wall, columns, x, z, y, s, turn);
  // And along the crests, against the sky for a camera that looks up.
  for (const [x, z, s, turn] of [
    [-2.4, -10.6, 1.5, 0.4],
    [7.2, -10.3, 1.3, -0.3],
    [-10.3, 0.8, 1.4, 0.2],
    [10.7, 2.0, 1.4, -0.2],
    [4.4, 11.0, 1.3, 0.3]
  ])
    ledgePine(wall, columns, x, z, crest(nearest(x, z)) - 0.15, s, turn);
  // Creepers hang from the ledges where the beds step back.
  const r = m.rng;
  for (let k = 0; k < 70; k++) {
    const i = Math.floor(r.range(0, n)),
      p = ring[i],
      y = levels[4 * Math.floor(r.range(1, 3)) - 1] + 0.15;
    if (y > crest(i) - 1 || Math.abs(i - fallAt) < 4) continue;
    const at = onWall(columns, i + r.next(), y);
    tied(wall, at, [p.nx, 0.12, p.nz], () => {
      for (let j = 0; j < 3; j++) {
        const side = (j - 1) * 0.11,
          l = r.range(0.4, 1.0),
          from = [at[0] + p.nx * 0.16 - p.nz * side, y, at[2] + p.nz * 0.16 + p.nx * side];
        m.leaf(
          from,
          [from[0] + p.nx * 0.1, y - l, from[2] + p.nz * 0.1],
          0.05,
          r.pick([0x2c4530, 0x355037, 0x3f5a3c]),
          0x4a6644,
          0.04
        );
      }
    });
  }
  const group = m.finish('四面峭壁與飛瀑', { cast: false });
  group.traverse((mesh) => {
    if (mesh.isMesh) seenFromWithin(T, mesh, wall);
  });
  return group;
}
// The camera is free to stand outside the valley, so a wall is drawn only
// from in front: each face is judged whole, from its own middle and the way it
// looks, and a face seen from behind or nearly edge-on is thrown off screen
// (the same idea as the cave of 寒玉石室, landforms/cave-7.js). A wall that
// still stands before the board, as the rib can from the east, is stippled
// there like any other scenery in the way. The software renderer draws every
// face whichever way it turns, so it is given a collapsed copy of the walls
// (far below the stage, where it draws nothing) while the GPU reads the true
// shape from an attribute of its own.
function seenFromWithin(T, mesh, wall) {
  const g = mesh.geometry,
    shape = g.attributes.position,
    hidden = new Float32Array(shape.count * 3);
  for (let i = 1; i < hidden.length; i += 3) hidden[i] = -400;
  g.setAttribute('wallShape', shape);
  g.setAttribute('wallCentre', new T.Float32BufferAttribute(wall.centres, 3));
  g.setAttribute('wallFacing', new T.Float32BufferAttribute(wall.facings, 3));
  g.setAttribute('position', new T.Float32BufferAttribute(hidden, 3));
  // The bounds still describe the true walls, for frustum culling.
  g.boundingSphere = new T.Sphere(new T.Vector3(0, 10, 0), 42);
  mesh.material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'attribute vec3 wallShape, wallCentre, wallFacing;\nvarying vec3 wallWorld;\n' +
      shader.vertexShader
        .replace('#include <begin_vertex>', 'vec3 transformed = wallShape;')
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
          wallWorld = (modelMatrix * vec4(wallShape, 1.)).xyz;
          vec3 wallEye = normalize(cameraPosition - (modelMatrix * vec4(wallCentre, 1.)).xyz);
          if (dot(normalize(mat3(modelMatrix) * wallFacing), wallEye) < .2)
            gl_Position = vec4(2., 2., 2., 1.);`
        );
    shader.fragmentShader =
      'varying vec3 wallWorld;\n' +
      shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float wallT = (cameraPosition.y - .14) / max(.0001, cameraPosition.y - wallWorld.y);
        vec2 wallHit = mix(cameraPosition.xz, wallWorld.xz, wallT);
        if (wallT > 1. && abs(wallHit.x) < ${HALF.toFixed(1)} && abs(wallHit.y) < ${HALF.toFixed(1)}) {
          vec2 p = mod(floor(gl_FragCoord.xy), 4.);
          if (mod(p.x * 2. + p.y * 3. + mod(p.x * p.y, 5.), 16.) / 16. > .29) discard;
        }`
      );
  };
}

// Mist lies at the foot of the walls, in the corners of the valley and over
// the pond where the fall breaks. Each bank is a low dome that is thickest in
// the middle and fades to nothing at its rim. Like the walls it gives the
// software renderer, which cannot blend, a collapsed copy that draws nothing.
const banks = [
  // x, y, z, half-width, half-depth, strength
  [-6.2, 0.9, -9.5, 3.3, 1.7, 0.34],
  [-1.2, 1.3, -9.9, 3.0, 1.5, 0.3],
  [5.2, 1.0, -9.7, 3.2, 1.5, 0.3],
  [-9.3, 1.0, -5.4, 1.7, 3.1, 0.32],
  [-9.5, 1.4, 1.8, 1.6, 3.2, 0.3],
  [-9.1, 0.8, 6.8, 1.7, 2.6, 0.28],
  [-8.4, 3.4, -8.4, 3.0, 3.0, 0.3],
  [0.5, 5.6, -10.4, 5.2, 1.7, 0.22],
  [-10.0, 6.2, 0.4, 1.7, 5.2, 0.22],
  [9.45, 0.45, -1.6, 1.6, 1.25, 0.42],
  [9.45, 1.7, -1.9, 1.15, 0.9, 0.3],
  [8.6, 0.2, 0.7, 2.2, 2.4, 0.14],
  [0.4, 1.0, 9.9, 4.2, 1.5, 0.28],
  [-6.2, 1.1, 9.8, 3.0, 1.4, 0.28],
  [6.2, 1.0, 9.8, 3.0, 1.4, 0.28],
  [9.7, 1.2, 6.0, 1.4, 2.7, 0.28],
  [8.6, 4.8, -7.0, 1.5, 2.6, 0.22]
];
function mist(T) {
  const shape = [],
    thick = [],
    index = [],
    n = 16;
  for (const [x, y, z, rx, rz, strength] of banks) {
    const first = shape.length / 3;
    shape.push(x, y + 0.35, z);
    thick.push(strength);
    for (const [k, share, lift] of [
      [0.55, 0.72, 0.2],
      [1, 0, 0]
    ])
      for (let i = 0; i < n; i++) {
        const a = (i * circle) / n,
          wobble = 0.85 + 0.3 * hash(x + i * 1.3, z + k);
        shape.push(x + Math.cos(a) * rx * k * wobble, y + lift, z + Math.sin(a) * rz * k * wobble);
        thick.push(strength * share);
      }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        inner = first + 1,
        outer = first + 1 + n;
      index.push(
        first,
        inner + j,
        inner + i,
        inner + i,
        inner + j,
        outer + j,
        inner + i,
        outer + j,
        outer + i
      );
    }
  }
  const hidden = new Float32Array(shape.length);
  for (let i = 1; i < hidden.length; i += 3) hidden[i] = -400;
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(hidden, 3));
  geo.setAttribute('veilShape', new T.Float32BufferAttribute(shape, 3));
  geo.setAttribute('veilThick', new T.Float32BufferAttribute(thick, 1));
  geo.setIndex(index);
  geo.boundingSphere = new T.Sphere(new T.Vector3(0, 3, 0), 16);
  const veil = new T.Mesh(
    geo,
    new T.ShaderMaterial({
      name: 'Valley_Mist',
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      uniforms: { tint: { value: new T.Color(haze).lerp(new T.Color(0xffffff), 0.3) } },
      vertexShader: `attribute vec3 veilShape; attribute float veilThick; varying float thick;
        void main(){ thick = veilThick; gl_Position = projectionMatrix * modelViewMatrix * vec4(veilShape, 1.); }`,
      fragmentShader: `uniform vec3 tint; varying float thick;
        void main(){ gl_FragColor = vec4(tint, thick * thick * 1.9);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    })
  );
  veil.renderOrder = 4;
  const group = new T.Group();
  group.name = '谷底霧氣';
  group.userData = { kind: 'maze-scenery', occluder: false, distant: true };
  group.add(veil);
  return group;
}

export {
  FLOOR,
  MOUND,
  PERCH,
  mix,
  smooth,
  hash,
  noise,
  fbm,
  faceUp,
  faceOut,
  ground,
  valleyFloor,
  litterFloor,
  tuft,
  leafLitter,
  cliffs,
  mist
};
