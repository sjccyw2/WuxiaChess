import { Model } from '../scenery-kit.js';
import { mapLayout } from '../../data/terrain.js';

// 鐵掌溪灘 only: the foot of 鐵掌山. A fast stream comes down the mountain's west skirt in
// steps, crosses the board from west to east and spills off its east edge into the widening
// river. North of the board the path climbs through a stone gate under the gang's black
// banners and between five tall crags; far behind stand the five peaks they echo, like the
// fingers of an open hand. The game's camera stands to the south-east, so the south and east
// sides are kept low and everything tall is north or west.

const TAU = Math.PI * 2;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
// Rises fast from zero and levels off: the profile of a bank leaving the water.
const rise = (v) => {
  const t = clamp(v);
  return t * (2 - t);
};
const lerp = (a, b, t) => a + (b - a) * t;

const stone = { dark: 0x45484a, mid: 0x5f6061, warm: 0x6b655e, pale: 0x918f86, rust: 0x76604f },
  wetStone = 0x30393b,
  pebble = [0x8a8780, 0xaaa596],
  turf = [0x5c6650, 0x74795a],
  earth = 0x7b7566,
  moss = 0x6c7a52,
  river = { water: 0x4f8791, dark: 0x53787c, foam: 0xe6eeea, spray: 0xbcd6d6 },
  needles = [0x33503f, 0x3f5d47, 0x4a684c],
  needleEdge = 0x5d7a55,
  needleLight = 0x7c9263,
  scrubLeaf = [0x4a5a40, 0x596845, 0x68714b],
  bark = 0x4b3b31,
  barkLight = 0x6a5646,
  cloth = 0x202328,
  clothEdge = 0x33373d,
  palmWhite = 0xd9d3c1,
  timber = 0x6b4d36,
  rope = 0xc9b88c;

// Value noise for the relief and its colour patches; the same map every time.
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz),
    b = hash(ix + 1, iz),
    c = hash(ix, iz + 1),
    d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) {
  return (
    0.55 * noise(x, z) +
    0.3 * noise(x * 2.1 + 5.2, z * 2.1 - 1.7) +
    0.15 * noise(x * 4.3 - 3.1, z * 4.3 + 7.9)
  );
}

// The upper stream: its centre line from the board's west edge up to the plunge pool, as a
// smooth run of points [x, z, distance upstream].
const knots = [
  [-4, 0],
  [-6, 0],
  [-8, 0],
  [-9.8, -0.6],
  [-11.2, -2.2],
  [-12, -4.3],
  [-12.3, -6.2],
  [-12.4, -7.8]
];
const run = [];
for (let i = 1; i < knots.length - 2; i++)
  for (let k = 0; k < 8; k++) {
    const t = k / 8,
      [a, b, c, d] = [knots[i - 1], knots[i], knots[i + 1], knots[i + 2]];
    run.push(
      [0, 1].map(
        (n) =>
          0.5 *
          (2 * b[n] +
            (c[n] - a[n]) * t +
            (2 * a[n] - 5 * b[n] + 4 * c[n] - d[n]) * t * t +
            (3 * b[n] - a[n] - 3 * c[n] + d[n]) * t * t * t)
      )
    );
  }
run.push(knots.at(-2).slice());
run[0][2] = 0;
for (let i = 1; i < run.length; i++)
  run[i][2] = run[i - 1][2] + Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
const runLength = run.at(-1)[2];
// Where the stream steps down: [distance upstream, height of the step].
const falls = [
  [1.9, 0.4],
  [4.2, 0.5],
  [6.5, 0.55],
  [8.45, 0.45]
];
const boardWater = -0.016;
function level(u) {
  let y = boardWater;
  for (const [at, drop] of falls) y += drop * smooth((u - at + 0.13) / 0.26);
  return y;
}
const poolLevel = level(runLength);
const width = (u) => 2 - 0.95 * smooth(u / 7) + 0.35 * smooth((u - 8.2) / 1.6);
// Distance from the centre line and how far upstream the nearest point lies.
function along(x, z) {
  let best = Infinity,
    at = 0;
  for (let i = 1; i < run.length; i++) {
    const [ax, az, au] = run[i - 1],
      [bx, bz, bu] = run[i];
    const dx = bx - ax,
      dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
    const d = Math.hypot(x - ax - t * dx, z - az - t * dz);
    if (d < best) {
      best = d;
      at = au + (bu - au) * t;
    }
  }
  return [best, at];
}
// The point of the centre line at a distance upstream, with the direction it runs in.
function pointAt(u) {
  let i = 1;
  while (i < run.length - 1 && run[i][2] < u) i++;
  const [ax, az, au] = run[i - 1],
    [bx, bz, bu] = run[i];
  const len = bu - au,
    tx = (bx - ax) / len,
    tz = (bz - az) / len;
  return [ax + tx * (u - au), az + tz * (u - au), tx, tz];
}
// The lower stream leaves the board's east edge and widens toward the river.
const lowWater = -0.5;
const lowerMid = (x) => {
  const t = Math.max(0, x - 6);
  return 0.1 * t + 0.018 * t * t;
};
const lowerHalf = (x) => {
  const t = Math.max(0, x - 6);
  return 2.15 + 0.3 * t + 0.022 * t * t;
};
// Gravel bars left in the lower stream: [x, z, length, breadth, height over the bed].
const bars = [
  [9.3, 2.3, 1.5, 0.6, 0.66],
  [10.7, -1.0, 1.3, 0.55, 0.64],
  [8.2, -1.55, 0.9, 0.42, 0.58],
  [14.6, 3.6, 2.6, 1.3, 0.7]
];
// Boulders standing in the lower stream, the first three on the brink where the water leaves
// the board: [x, z, radius, height from the bed].
const lowerBoulders = [
  [6.46, -1.52, 0.4, 1.12],
  [6.5, 0.3, 0.34, 1.02],
  [6.44, 1.74, 0.3, 1.05],
  [7.6, -0.6, 0.42, 0.95],
  [8.4, 0.9, 0.55, 1.1],
  [9.5, -0.2, 0.36, 0.86],
  [10.6, 1.0, 0.6, 1.2],
  [11.9, 2.9, 0.45, 0.95],
  [12.4, -1.9, 0.5, 1.05],
  [13.6, 0.9, 0.7, 1.3],
  [16.2, -1.4, 0.5, 1.0],
  [18.5, 3.4, 0.8, 1.35],
  [7.3, 2.5, 0.3, 0.8]
];
// The mountain path winds north from the gate.
const pathX = (z) => 0.6 + 0.55 * Math.sin(Math.max(0, -z - 7.9) * 0.62);
const gate = [0.6, -7.7];

// The ground beyond the board as one height function, with the measures the dressing needs.
function makeValley(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const tiles = layout.cells.map(({ x, y }) => [x - cx, y - cz]);
  const onBoard = (x, z) =>
    layout.mask[Math.floor(z + cz + 0.5)]?.[Math.floor(x + cx + 0.5)] === '#';
  // Distance beyond the edge of the board; 0 on it.
  function outside(x, z) {
    // Far off, the board's stepped corners no longer matter.
    const fx = Math.abs(x) - layout.width / 2,
      fz = Math.abs(z) - layout.height / 2;
    if (fx > 3 || fz > 3) return Math.hypot(Math.max(fx, 0), Math.max(fz, 0));
    let best = Infinity;
    for (const [tx, tz] of tiles) {
      const dx = Math.max(Math.abs(x - tx) - 0.5, 0),
        dz = Math.max(Math.abs(z - tz) - 0.5, 0),
        d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  // The lie of the land before the stream is cut into it.
  function region(x, z) {
    const broad = fbm(x * 0.19 + 3.1, z * 0.19 - 7.7),
      fine = fbm(x * 0.8 - 11.3, z * 0.8 + 5.9);
    let h = -0.04 + (fine - 0.5) * 0.12;
    // The mountain: a level apron behind the board, then spurs either side of the path's gully.
    const q = -z - 6.7 + 0.3 * Math.max(0, -x - 4) - 0.32 * Math.max(0, x - 5);
    if (q > 0) {
      const off = x - pathX(z),
        wide = Math.max(0, Math.abs(off) - 0.6);
      const gully = smooth(wide / 3.2),
        across = pathX(z) + Math.sign(off) * wide;
      const spur = 0.5 + 0.5 * Math.cos(across * 0.62 + broad * 3);
      const steep = 0.42 + gully * (0.5 + 0.5 * spur) + 0.25 * broad;
      const climb = Math.max(0, q - 2) * steep,
        cap = 9 + 5 * broad;
      h += 0.08 * Math.min(q, 2) + cap * (1 - Math.exp(-climb / cap));
      h += smooth(q / 4) * gully * (fbm(across * 0.8 - 11.3, z * 0.8 + 5.9) - 0.5) * 1.6;
    }
    // The west skirt the stream comes down, and the crag its last fall drops from.
    h += Math.max(0, -x - 7.3) * 0.3 * smooth((3.2 - z) / 5) * (0.8 + 0.5 * broad);
    h += 4.2 * Math.exp(-((x + 12.9) ** 2 / 6 + (z + 9.4) ** 2 / 4));
    // The south bank lies low and only lifts into hills far behind the party.
    const south = z - 6;
    if (south > 0) h += 0.015 * south + smooth((south - 10) / 12) * (1 + 3.5 * broad);
    return h;
  }
  // How far a point lies outside the nearest water's edge (negative in the stream), and
  // that water's level.
  function reach(x, z) {
    if (x > 5) return [Math.abs(z - lowerMid(x)) - lowerHalf(x), lowWater];
    if (x < -5) {
      const [d, u] = along(x, z);
      return [d - width(u), level(u)];
    }
    return [9, -9];
  }
  function surface(x, z) {
    const base = region(x, z),
      [e, water] = reach(x, z);
    let h = base;
    if (x > 5) {
      if (e < 0) {
        h = lowWater - 0.45 * rise(-e / 0.9);
        for (const [bx, bz, rx, rz, top] of bars) {
          const k = 1 - ((x - bx) / rx) ** 2 - ((z - bz) / rz) ** 2;
          if (k > 0) h += top * smooth(k * 1.6);
        }
      } else h = lerp(lowWater, base, rise(e / 1.5));
    } else if (x < -5) {
      if (e < 0) h = water - 0.3 * rise(-e / 0.6);
      else {
        // Where the land lies lower than a pool, a shoulder of rock holds the water in.
        const shoulder = water + 0.16 + 0.2 * smooth(water / 0.5) - 0.55 * Math.max(0, e - 1.3);
        h = lerp(water, Math.max(base, shoulder), rise(e / 1.1));
      }
    }
    // The banks meet the board just under its rim.
    if (e > 0.3) h = lerp(-0.02, h, smooth(outside(x, z) / 0.9));
    // The land sinks away at the edge of the world.
    const border = Math.min(x + 34, 30 - x, z + 36, 30 - z);
    if (h > -0.8) h = lerp(-0.8, h, smooth(border / 6));
    return h;
  }
  return { onBoard, outside, reach, surface };
}

// Ground colour: wet stone at the water, shingle on the strand and round the board, stony
// soil with patches of thin turf beyond, bare iron-grey rock where it is steep.
function tone(m, valley, x, z, y) {
  const s = 0.35,
    slope =
      Math.hypot(
        valley.surface(x + s, z) - valley.surface(x - s, z),
        valley.surface(x, z + s) - valley.surface(x, z - s)
      ) /
      (2 * s);
  const broad = fbm(x * 0.5 + 1.7, z * 0.5 - 4.2),
    patch = fbm(x * 1.3 - 6.1, z * 1.3 + 2.4),
    speck = hash(Math.round(x * 3.1) + 0.5, Math.round(z * 2.9) + 0.5);
  const [e, water] = valley.reach(x, z),
    over = y - water;
  const strand = smooth(1 - over / 0.6) * smooth(1 - e / 2.4),
    // The ground is trodden bare round the board and along the trail up from the south.
    trail = z > 6 ? smooth(1 - Math.abs(x - 0.4 - 0.9 * Math.sin(z * 0.35)) / 0.8) : 0,
    trodden = Math.max(smooth(1 - valley.outside(x, z) / 2.6), trail);
  const shingle = m.mix(pebble[0], pebble[1], speck * 0.8),
    soil = m.mix(m.mix(0x696458, earth, smooth(patch / 0.45)), shingle, 0.2 + 0.5 * patch),
    grass = m.mix(turf[0], turf[1], patch);
  const green =
    smooth((broad - 0.4) / 0.2) *
    (0.55 + 0.45 * smooth((patch - 0.35) / 0.3)) *
    (1 - strand) *
    (1 - 0.85 * trodden);
  let c = m.mix(m.mix(soil, shingle, Math.max(strand, trodden * 0.8)), grass, green);
  // Bars and beaches stay shingle however they slope.
  const bare =
    Math.max(smooth((slope - 0.5) / 0.5), smooth((y - 4) / 6) * 0.5) *
    (e < 1.5 ? smooth((over - 0.25) / 0.4) : 1);
  const crag = m.mix(
    m.mix(stone.dark, stone.mid, broad),
    stone.rust,
    smooth((speck - 0.55) / 0.45) * 0.4
  );
  c = m.mix(c, crag, bare);
  if (e < 1.2) c = m.mix(c, wetStone, smooth(1 - (over + 0.04) / 0.14) * 0.7);
  return c;
}

const ticks = (...spans) => {
  const out = [spans[0][0]];
  for (const [, to, step] of spans) while (out.at(-1) < to - 1e-6) out.push(out.at(-1) + step);
  return out;
};
// Lays the ground as a grid, fine round the board and the upper stream and coarse far off;
// the high ground goes to the mountain's own group so the cutaway can open it. Returns the
// height of the laid ground at any point, for seating things on it.
function layGround(low, high, valley) {
  const xs = ticks([-34, -18, 2], [-18, 12, 0.5], [12, 18, 1], [18, 30, 2]),
    zs = ticks([-36, -16, 2], [-16, -11, 1], [-11, 9, 0.5], [9, 16, 1], [16, 30, 2]);
  const grid = zs.map((z, j) =>
    xs.map((x, i) => {
      let px = x,
        pz = z;
      // Off the board's edge the corners are nudged so the facets do not line up.
      if (valley.outside(x, z) > 0.45) {
        px += (hash(i, j) - 0.5) * 0.44 * ((xs[i + 1] ?? x + 2) - x);
        pz += (hash(i + 71, j + 13) - 0.5) * 0.44 * ((zs[j + 1] ?? z + 2) - z);
      }
      const y = valley.surface(px, pz);
      return { p: [px, y, pz], c: tone(low, valley, px, pz, y) };
    })
  );
  for (let j = 0; j < zs.length - 1; j++)
    for (let i = 0; i < xs.length - 1; i++) {
      if (valley.onBoard((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) continue;
      const q = [grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1]];
      (Math.max(...q.map((v) => v.p[1])) > 1.3 ? high : low).face(
        q.map((v) => v.p),
        q.map((v) => v.c)
      );
    }
  const find = (list, v) => {
    let i = 0;
    while (i < list.length - 2 && list[i + 1] < v) i++;
    return i;
  };
  return (x, z) => {
    const i0 = find(xs, x),
      j0 = find(zs, z);
    for (let j = Math.max(0, j0 - 1); j <= Math.min(zs.length - 2, j0 + 1); j++)
      for (let i = Math.max(0, i0 - 1); i <= Math.min(xs.length - 2, i0 + 1); i++) {
        const a = grid[j][i].p,
          b = grid[j + 1][i].p,
          c = grid[j + 1][i + 1].p,
          d = grid[j][i + 1].p;
        for (const [p, q, r] of [
          [a, b, c],
          [a, c, d]
        ]) {
          const det = (q[2] - r[2]) * (p[0] - r[0]) + (r[0] - q[0]) * (p[2] - r[2]);
          const u = ((q[2] - r[2]) * (x - r[0]) + (r[0] - q[0]) * (z - r[2])) / det,
            v = ((r[2] - p[2]) * (x - r[0]) + (p[0] - r[0]) * (z - r[2])) / det;
          if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6)
            return u * p[1] + v * q[1] + (1 - u - v) * r[1];
        }
      }
    return valley.surface(x, z);
  };
}

// A water-worn boulder: a dark wet foot, grey flanks and a pale rounded crown.
function boulder(m, x, y, z, rx, h, rz, { wet = 0.2, green = 0, n = 8, turn = 0 } = {}) {
  const r = m.rng,
    spokes = Array.from({ length: n }, (_, i) => [
      turn + (i / n) * TAU + r.range(-0.14, 0.14),
      r.range(0.86, 1.12)
    ]);
  const body = m.mix(stone.mid, stone.warm, r.next()),
    crown = m.mix(m.mix(stone.pale, body, 0.25), moss, green),
    foot = m.mix(body, wetStone, wet > 0.1 ? 0.8 : 0.3);
  const levels = [
    [0, 0.82],
    [0.17, 1],
    [0.5, 0.96],
    [0.8, 0.72],
    [0.95, 0.4]
  ];
  const tones = levels.map(([k]) => (k <= wet ? foot : k > 0.7 ? crown : body));
  let last;
  for (let j = 0; j < levels.length; j++) {
    const [k, wide] = levels[j];
    const ring = spokes.map(([a, q], i) => [
      x + Math.cos(a) * rx * q * wide,
      y + h * (k + (j && j < 4 ? 0.05 * Math.sin(i * 2.3 + j) : 0)),
      z + Math.sin(a) * rz * q * wide
    ]);
    if (last)
      for (let i = 0; i < n; i++) {
        const q = (i + 1) % n;
        m.face(
          [last[i], ring[i], ring[q], last[q]],
          [tones[j - 1], tones[j], tones[j], tones[j - 1]],
          0.92 + 0.08 * Math.abs(Math.cos(i * 1.7))
        );
      }
    last = ring;
  }
  for (let i = 0; i < n; i++) m.face([[x, y + h, z], last[(i + 1) % n], last[i]], crown);
}

// A standing stone with straight sides and a flat, bevelled top.
function column(m, x, y, z, rad, h, n, foot, body, top) {
  const r = m.rng,
    turn = r.range(0, TAU),
    low = [],
    high = [],
    cap = [];
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * TAU + r.range(-0.12, 0.12),
      k = r.range(0.9, 1.08);
    const u = Math.cos(a) * rad * k,
      v = Math.sin(a) * rad * k;
    low.push([x + u * 1.08, y, z + v * 1.08]);
    high.push([x + u, y + h - Math.min(0.04, h * 0.1), z + v]);
    cap.push([x + u * 0.84, y + h, z + v * 0.84]);
  }
  const bevel = m.mix(body, top, 0.6);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face(
      [low[i], high[i], high[j], low[j]],
      [foot, body, body, foot],
      0.9 + (0.1 * ((i * 5) % 3)) / 2
    );
    m.face([high[i], cap[i], cap[j], high[j]], bevel);
  }
  m.face([...cap].reverse(), top);
}

// A crag of jointed iron-grey rock: stacked blocks that narrow upward, pale on their ledges.
function crag(m, x, z, bottom, top, rx, rz) {
  const r = m.rng,
    tints = [stone.dark, stone.mid, stone.warm, 0x525456];
  let y = bottom,
    k = 0;
  while (y < top - 0.05) {
    const h = Math.min(top - y, r.range(0.5, 0.95)),
      t = (y - bottom) / Math.max(0.01, top - bottom),
      s = 1.1 - 0.3 * t,
      n = 5,
      turn = r.range(0, TAU),
      ox = x + r.range(-0.08, 0.08) * rx,
      oz = z + r.range(-0.08, 0.08) * rz;
    const low = [],
      high = [],
      cap = [];
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * TAU + r.range(-0.2, 0.2),
        q = r.range(0.85, 1.1);
      const u = Math.cos(a) * rx * s * q,
        v = Math.sin(a) * rz * s * q;
      low.push([ox + u, y, oz + v]);
      high.push([ox + u * 0.96, y + h * r.range(0.9, 1.03), oz + v * 0.96]);
      cap.push([ox + u * 0.8, y + h + 0.05, oz + v * 0.8]);
    }
    const body = m.mix(tints[k % 4], stone.rust, r.next() < 0.3 ? 0.35 : 0),
      last = y + h >= top - 0.05,
      ledge = m.mix(stone.pale, moss, last ? 0.45 : 0.15);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.face([low[i], high[i], high[j], low[j]], body, 0.88 + (0.12 * ((i * 7) % 3)) / 2);
      m.face([high[i], cap[i], cap[j], high[j]], m.mix(body, ledge, 0.6));
    }
    m.face([...cap].reverse(), ledge);
    y += h;
    k++;
  }
}

// One pad of pine needles: dark underneath, lighter toward its crown.
function pad(m, x, y, z, rad, rich, tones = needles, edge = needleEdge, light = needleLight) {
  const r = m.rng,
    n = 6,
    tint = m.rgb(r.pick(tones)),
    rim = [],
    inner = [];
  const turn = r.range(0, TAU),
    squash = r.range(0.75, 1);
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * TAU + r.range(-0.18, 0.18),
      k = r.range(0.82, 1.14);
    const u = Math.cos(a) * rad * k,
      v = Math.sin(a) * rad * k * squash;
    rim.push([x + u, y - 0.12 * rad * r.range(0.5, 1.3), z + v]);
    inner.push([x + u * 0.55, y + 0.17 * rad, z + v * 0.55]);
  }
  const crown = [x, y + 0.3 * rad, z],
    low = [x, y - 0.3 * rad, z],
    rimTone = m.rgb(edge),
    top = m.mix(edge, light, 0.7);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([low, rim[i], rim[j]], tint, 0.8);
    if (rich) {
      m.face([rim[j], rim[i], inner[i], inner[j]], [tint, tint, rimTone, rimTone]);
      m.face([inner[j], inner[i], crown], [rimTone, rimTone, top]);
    } else m.face([rim[j], rim[i], crown], [tint, tint, rimTone]);
  }
}

// A crooked mountain pine with level pads of needles, of height h.
function pine(m, x, y, z, h, { lean = 0.5, yaw = 0, boughs = 7, rich = true, spread = 1 } = {}) {
  const r = m.rng;
  m.frame(x, y, z, yaw, h, () => {
    const trunk = [
      [0, -0.12, 0],
      [0.03 * lean, 0.28, 0.02],
      [0.17 * lean, 0.55, -0.03],
      [0.1 * lean, 0.8, 0.02],
      [0.16 * lean, 1, 0]
    ];
    const girth = [0.062, 0.05, 0.038, 0.026, 0.012];
    for (let j = 0; j < 4; j++)
      m.tube(
        trunk[j],
        trunk[j + 1],
        girth[j],
        girth[j + 1],
        j % 2 ? bark : barkLight,
        rich ? 6 : 4
      );
    for (let j = 0; j < boughs; j++) {
      const t = j / Math.max(1, boughs - 1),
        a = j * 2.4 + r.range(-0.3, 0.3),
        k = 1.1 + t * 2.5,
        i = Math.min(3, Math.floor(k)),
        f = k - i;
      const from = trunk[i].map((v, n) => lerp(v, trunk[i + 1][n], f)),
        len = (0.36 - 0.2 * t) * r.range(0.85, 1.15);
      const tip = [from[0] + Math.cos(a) * len, from[1] + 0.04, from[2] + Math.sin(a) * len];
      m.tube(from, tip, 0.02 - 0.008 * t, 0.007, bark, rich ? 4 : 3);
      const size = (0.2 - 0.08 * t) * r.range(0.85, 1.15) * spread;
      pad(m, tip[0], tip[1] + 0.03, tip[2], size, rich);
      if (rich && j % 3 === 0)
        pad(
          m,
          (from[0] + tip[0]) / 2 + Math.sin(a) * size * 0.5,
          tip[1] + 0.02,
          (from[2] + tip[2]) / 2 - Math.cos(a) * size * 0.5,
          size * 0.7,
          rich
        );
    }
    pad(m, trunk[4][0], 1.02, trunk[4][2], 0.13 * spread, rich);
  });
}

// Low scrub: a few olive cushions on short twigs.
function scrub(m, x, y, z, s) {
  const r = m.rng;
  for (let i = 0; i < 3; i++) {
    const a = r.range(0, TAU),
      d = i ? s * r.range(0.3, 0.6) : 0,
      top = [x + Math.cos(a) * d, y + s * r.range(0.4, 0.75), z + Math.sin(a) * d];
    m.tube([x, y - 0.03, z], top, 0.02 * s, 0.01 * s, bark, 4);
    pad(m, top[0], top[1], top[2], s * r.range(0.4, 0.6), false, scrubLeaf, 0x66734c, 0x8c9063);
  }
}

// A tuft of dry grass.
function tuft(m, x, y, z, s) {
  const r = m.rng;
  for (let i = 0; i < 4; i++) {
    const a = r.range(0, TAU),
      l = s * r.range(0.6, 1.1);
    m.leaf(
      [x, y, z],
      [x + Math.cos(a) * l * 0.5, y + l, z + Math.sin(a) * l * 0.5],
      l * 0.07,
      r.pick([0x7d8556, 0x8f8f60, 0x6f7c50]),
      0xa3a06c,
      l * 0.12
    );
  }
}

// The open palm of 鐵掌幫, drawn on an upright plane facing south or north.
function palm(m, x, y, z, s, col) {
  const part = (points) =>
    m.face(
      points.map(([u, v]) => [x + u * s, y + v * s, z]),
      col
    );
  part([
    [-0.25, -0.42],
    [0.25, -0.42],
    [0.29, -0.2],
    [0.27, 0],
    [-0.27, 0],
    [-0.29, -0.2]
  ]);
  for (const [u, len, splay] of [
    [-0.2, 0.36, -0.1],
    [-0.068, 0.45, -0.03],
    [0.068, 0.42, 0.03],
    [0.2, 0.3, 0.12]
  ])
    part([
      [u - 0.054, -0.02],
      [u + 0.054, -0.02],
      [u + splay * len + 0.045, len],
      [u + splay * len - 0.045, len]
    ]);
  part([
    [-0.27, -0.32],
    [-0.27, -0.13],
    [-0.52, 0.07],
    [-0.59, -0.02]
  ]);
}

// A black banner hanging from a yard at height top, its foot cut to a swallowtail, with the
// pale palm on both faces.
function blackBanner(m, x, top, z, w, len, mark) {
  const rows = 6,
    grid = [];
  for (let j = 0; j <= rows; j++) {
    const v = j / rows,
      sway = v > 0.6 ? 0.09 * Math.sin((v - 0.6) * 5) : 0;
    grid.push(
      [-1, 0, 1].map((k) => [
        x + (k * w) / 2,
        top - len * (v - (j === rows && !k ? 0.13 : 0)),
        z + sway + (k ? 0 : 0.01 * v)
      ])
    );
  }
  for (let j = 0; j < rows; j++)
    for (let k = 0; k < 2; k++)
      m.face(
        [grid[j][k], grid[j][k + 1], grid[j + 1][k + 1], grid[j + 1][k]],
        (j + k) % 2 ? cloth : m.mix(cloth, clothEdge, 0.5)
      );
  m.box(x, top - 0.02, z, w + 0.02, 0.05, 0.03, clothEdge);
  for (const side of [0.016, -0.012])
    palm(m, x + 0.04 * mark, top - len * 0.36, z + side, mark, palmWhite);
}

// ---------------------------------------------------------------------------------------
// The surroundings.

// Loose stone along both streams and about the banks, the trail's flat stones, boulders at
// every step of the water, drift logs on the bars.
function streamStones(m, valley, ground) {
  const r = m.rng;
  for (let i = 0; i < 210; i++) {
    const x = r.range(-15, 21),
      z = r.range(-9, 12),
      [e] = valley.reach(x, z);
    if (e < -0.3 || e > 1.4 || valley.outside(x, z) < 0.35) continue;
    const rad = r.range(0.07, 0.26) * (e < 0.4 ? 1.2 : 0.8);
    m.rock(
      x,
      ground(x, z) - rad * 0.3,
      z,
      rad,
      rad * r.range(0.7, 1.2),
      rad * r.range(0.7, 1),
      r.pick([stone.dark, stone.mid, 0x5c5d58]),
      r.pick([pebble[0], pebble[1], stone.pale]),
      6,
      r.range(0, 6)
    );
  }
  // Field stones lying about the banks.
  for (let i = 0; i < 90; i++) {
    const x = r.range(-12, 12),
      z = r.range(-9, 13),
      y = ground(x, z);
    if (valley.outside(x, z) < 0.5 || valley.reach(x, z)[0] < 1.3 || y > 1.3) continue;
    const rad = r.range(0.06, 0.2);
    m.rock(x, y - rad * 0.3, z, rad, rad * r.range(0.6, 1), rad * 0.8, stone.mid, pebble[1], 5, i);
  }
  // The trail the party came up by: flat stones trodden into the south bank.
  for (let i = 0; i < 14; i++) {
    const z = 6.5 + i * 0.62,
      x = 0.4 + 0.9 * Math.sin(z * 0.35) + r.range(-0.18, 0.18);
    m.frame(x, ground(x, z), z, r.range(0, TAU), 1, () =>
      m.rock(0, -0.03, 0, r.range(0.2, 0.3), 0.07, r.range(0.15, 0.22), stone.mid, pebble[1], 6)
    );
  }
  // Heaps of boulders left on the south bank by old floods.
  for (const [x, z] of [
    [-4.6, 9.4],
    [3.9, 10.3],
    [-8.2, 7.6],
    [7.6, 8.3],
    [-1.4, 12.6],
    [-10.5, 11.2],
    [10.2, 11.4],
    [-5.2, 16.6],
    [4.4, 18.2],
    [-11.5, 19.5]
  ])
    for (let i = 0; i < 4; i++) {
      const a = r.range(0, TAU),
        d = i ? r.range(0.35, 0.8) : 0,
        rad = i ? r.range(0.14, 0.3) : r.range(0.34, 0.46),
        px = x + Math.cos(a) * d,
        pz = z + Math.sin(a) * d;
      boulder(m, px, ground(px, pz) - rad * 0.3, pz, rad, rad * r.range(1, 1.5), rad * 0.85, {
        wet: 0,
        green: r.range(0.1, 0.5),
        n: 7,
        turn: r.range(0, TAU)
      });
    }
  // Boulders the water breaks on at the lip of each step of the upper stream.
  for (const [at, drop] of falls) {
    const [x, z, tx, tz] = pointAt(at),
      half = width(at),
      foot = level(at - 0.4) - 0.3;
    for (const s of [-0.95, -0.42, 0.18, 0.7, 1.05]) {
      if (r.next() < 0.2) continue;
      const k = s + r.range(-0.08, 0.08),
        back = r.range(-0.1, 0.25),
        rad = r.range(0.28, 0.45);
      boulder(
        m,
        x - tz * half * k + tx * back,
        foot,
        z + tx * half * k + tz * back,
        rad,
        drop + 0.3 + r.range(0.2, 0.55),
        rad * r.range(0.75, 1),
        { wet: 0.5, green: Math.abs(k) > 0.9 ? 0.4 : 0, turn: r.range(0, TAU) }
      );
    }
  }
  for (const [x, z, rad, h] of lowerBoulders)
    boulder(m, x, lowWater - 0.5, z, rad, h, rad * r.range(0.75, 0.95), {
      wet: 0.5,
      turn: r.range(0, TAU),
      n: 9
    });
  // Boulders standing in the pools of the upper stream.
  for (const [u, s, rad] of [
    [0.7, -0.55, 0.3],
    [1.1, 0.5, 0.36],
    [3.0, -0.3, 0.4],
    [3.5, 0.6, 0.28],
    [5.3, 0.2, 0.34],
    [7.6, -0.3, 0.3],
    [9.4, 0.5, 0.36]
  ]) {
    const [x, z, tx, tz] = pointAt(u),
      half = width(u);
    boulder(
      m,
      x - tz * half * s,
      level(u) - 0.3,
      z + tx * half * s,
      rad,
      rad * 1.5 + 0.3,
      rad * 0.85,
      {
        wet: 0.45,
        turn: r.range(0, TAU)
      }
    );
  }
  // Drift logs stranded on the gravel.
  for (const [x, z, len, yaw] of [
    [9.3, 2.3, 1.7, 0.25],
    [10.7, -1.0, 1.4, -0.15],
    [7.4, 4.6, 1.4, 1.1],
    [-7.2, 2.7, 1.5, 0.5]
  ]) {
    const y = ground(x, z) + 0.07,
      dx = (Math.cos(yaw) * len) / 2,
      dz = (Math.sin(yaw) * len) / 2;
    m.tube([x - dx, y, z - dz], [x + dx, y + 0.05, z + dz], 0.09, 0.06, 0x8f8676, 6);
    m.tube(
      [x + dx * 0.2, y + 0.03, z + dz * 0.2],
      [x + dx * 0.5 - dz * 0.3, y + 0.3, z + dz * 0.5 + dx * 0.3],
      0.035,
      0.012,
      0x8f8676,
      4
    );
  }
}

// How white the upper stream runs at a point: the falls themselves and the churn below them.
function froth(u, s, x, z) {
  let white = 0;
  for (const [at] of falls) {
    const below = at - 0.14 - u;
    if (below <= 0 && below > -0.3) white = Math.max(white, 0.9);
    else if (below > 0 && below < 1.2) white = Math.max(white, 0.95 * (1 - below / 1.2) ** 1.4);
  }
  // Under the high fall.
  white = Math.max(white, 0.95 * smooth(1 - Math.hypot(x + 12.42, z + 7.25) / 1.3));
  return clamp(white * (0.5 + 0.7 * hash(Math.round(s * 7) + 0.5, Math.round(u * 2.1) + 0.5)));
}

// The water of the upper stream: a ribbon that follows the pools and drops white at each
// step, with pale streaks drawn out along the current.
function upperStream(m) {
  const r = m.rng,
    K = 10,
    marks = [];
  // It starts just under the board's own water.
  for (let u = -0.1; u < runLength + 1.5; u += 0.3) marks.push(u);
  for (const [at] of falls) marks.push(at - 0.14, at + 0.14);
  marks.sort((a, b) => a - b);
  const rows = marks
    .filter((u, i, all) => !i || u - all[i - 1] > 0.07)
    .map((u) => {
      const [x, z, tx, tz] = pointAt(u),
        past = Math.max(0, u - runLength),
        pool = width(runLength);
      // The plunge pool closes in a round end.
      const half = past ? Math.sqrt(Math.max(0.02, pool * pool - past * past)) : width(u),
        y = level(u);
      // Level from bank to bank; only the outermost strip dips, under the banks.
      return Array.from({ length: K + 1 }, (_, k) => {
        const edge = k === 0 || k === K,
          s = edge ? (k ? 1 : -1) * (1 + 0.25 / half) : ((k - 1) / (K - 2)) * 2 - 1,
          px = x - tz * half * s,
          pz = z + tx * half * s;
        const deep = m.mix(river.water, river.dark, hash(k + 0.5, Math.round(u * 3) + 0.5));
        return {
          p: [px, y - (edge ? 0.08 : 0), pz],
          c: m.mix(deep, river.foam, froth(u, s, px, pz))
        };
      });
    });
  for (let i = 1; i < rows.length; i++)
    for (let k = 0; k < K; k++) {
      const a = rows[i - 1],
        b = rows[i];
      m.face([a[k].p, a[k + 1].p, b[k + 1].p, b[k].p], [a[k].c, a[k + 1].c, b[k + 1].c, b[k].c]);
    }
  for (let i = 0; i < 46; i++) {
    const u = r.range(0.1, runLength - 0.3),
      s = r.range(-0.8, 0.8),
      len = r.range(0.3, 0.75);
    if (falls.some(([at]) => u > at - 0.25 && u - len < at + 0.25)) continue;
    const [ax, az, tx, tz] = pointAt(u),
      [bx, bz] = pointAt(u - len),
      wa = width(u) * s,
      wb = width(u - len) * s,
      y = level(u) + 0.008,
      w = r.range(0.02, 0.045);
    m.face(
      [
        [ax - tz * wa, y, az + tx * wa],
        [bx - tz * (wb - w), y, bz + tx * (wb - w)],
        [bx - tz * (wb + w), y, bz + tx * (wb + w)]
      ],
      m.mix(river.water, river.foam, r.range(0.4, 0.8))
    );
  }
}

// Where the stream leaves the board it runs down a short chute into the lower water: white
// water the length of the stream's four tiles, the churn at its foot, and the wakes the
// boulders trail downstream.
function brinkFall(m) {
  const r = m.rng,
    profile = [
      [6.0, -0.014, 0.3],
      [6.12, -0.04, 0.55],
      [6.4, -0.24, 0.85],
      [6.68, -0.45, 1],
      [6.8, -0.54, 1.1]
    ];
  const strand = (k) => 0.7 + 0.45 * hash(k * 1.7 + 0.3, 4.1);
  const white = m.rgb(river.foam),
    spray = m.mix(river.spray, river.foam, 0.4),
    faint = m.rgb(0xa9c9d6);
  for (let k = 0; k < 16; k++) {
    const z0 = -2 + k * 0.25,
      z1 = z0 + 0.25;
    for (let j = 1; j < profile.length; j++) {
      const [xa, ya, wa] = profile[j - 1],
        [xb, yb, wb] = profile[j];
      const c = (w, n) => m.mix(river.water, river.foam, clamp(w * strand(n)));
      m.face(
        [
          [xa, ya, z0],
          [xa, ya, z1],
          [xb, yb, z1],
          [xb, yb, z0]
        ],
        [c(wa, k), c(wa, k + 1), c(wb, k + 1), c(wb, k)]
      );
    }
    // The churn: tongues of white water running out from the foot of the curtain.
    const reach = r.range(0.3, 0.85),
      y = lowWater + 0.014;
    m.face(
      [
        [6.72, y, z0 - 0.02],
        [6.72, y, z1 + 0.02],
        [6.76 + reach * 0.6, y, z1 + r.range(-0.05, 0.05)],
        [6.76 + reach, y, (z0 + z1) / 2 + r.range(-0.1, 0.1)],
        [6.76 + reach * 0.55, y, z0 + r.range(-0.05, 0.05)]
      ],
      [white, white, spray, faint, spray]
    );
  }
  // Threads of white drawn down the smooth head of the chute.
  for (let i = 0; i < 18; i++) {
    const z = r.range(-1.95, 1.95),
      w = r.range(0.012, 0.03),
      from = i % 2;
    for (let j = from; j < from + 2; j++) {
      const [xa, ya] = profile[j],
        [xb, yb] = profile[j + 1],
        wa = j === from ? w * 0.3 : w,
        wb = j === from ? w : w * 0.5;
      m.face(
        [
          [xa, ya + 0.008, z - wa],
          [xa, ya + 0.008, z + wa],
          [xb, yb + 0.008, z + wb],
          [xb, yb + 0.008, z - wb]
        ],
        white
      );
    }
  }
  // The rock the chute runs over shows at either end of it.
  for (const z of [-2, 2])
    m.face(
      [...profile.map(([x, y]) => [x, y - 0.01, z]), [6.8, -0.62, z], [6, -0.62, z]],
      m.mix(stone.dark, wetStone, 0.5)
    );
  // The thin wake each boulder trails downstream.
  for (const [x, z, rad] of lowerBoulders) {
    const y = lowWater + 0.012,
      len = rad * r.range(2.6, 3.6),
      w = rad * 0.34,
      from = x + rad * 0.75;
    m.face(
      [
        [from, y, z - w],
        [from, y, z + w],
        [from + len, y, z + len * 0.12]
      ],
      [spray, spray, faint]
    );
  }
}

// The high fall at the head of the stream: the water comes out of a cleft between two
// crags and drops into the plunge pool.
function highFall(m, ground) {
  const r = m.rng,
    lip = [-12.45, 6.3, -7.74],
    K = 4,
    N = 7;
  crag(m, -12.45, -8.2, poolLevel - 0.5, lip[1] - 0.06, 0.8, 0.62);
  crag(m, -13.5, -8.05, ground(-13.5, -8.05) - 0.8, 7.7, 0.75, 0.7);
  crag(m, -11.45, -8.15, ground(-11.45, -8.15) - 0.8, 7.2, 0.7, 0.65);
  crag(m, -14.2, -7.0, ground(-14.2, -7.0) - 0.8, 5.2, 0.7, 0.75);
  crag(m, -10.6, -7.2, ground(-10.6, -7.2) - 0.8, 4.6, 0.65, 0.7);
  crag(m, -10.3, -5.3, ground(-10.3, -5.3) - 0.6, 3.5, 0.55, 0.6);
  const rows = [];
  // The stream above the lip, running out of the cleft.
  rows.push(
    Array.from({ length: K + 1 }, (_, k) => ({
      p: [lip[0] + (k / K - 0.5) * 0.7, lip[1], lip[2] - 0.95],
      c: m.rgb(river.dark)
    }))
  );
  for (let j = 0; j <= N; j++) {
    const t = j / N,
      half = 0.36 + 0.22 * t;
    rows.push(
      Array.from({ length: K + 1 }, (_, k) => {
        const s = k / K - 0.5;
        return {
          p: [
            lip[0] + s * 2 * half,
            lip[1] - (lip[1] - poolLevel + 0.05) * t * t,
            lip[2] + 0.5 * t + 0.05 * Math.cos(s * Math.PI)
          ],
          c: m.mix(
            m.mix(river.water, river.spray, 0.35 + 0.65 * t),
            river.foam,
            clamp((0.25 + 0.75 * t) * (0.45 + 0.8 * hash(k + 0.5, 7.3)))
          )
        };
      })
    );
  }
  for (let j = 1; j < rows.length; j++)
    for (let k = 0; k < K; k++)
      m.face(
        [rows[j - 1][k].p, rows[j - 1][k + 1].p, rows[j][k + 1].p, rows[j][k].p],
        [rows[j - 1][k].c, rows[j - 1][k + 1].c, rows[j][k + 1].c, rows[j][k].c]
      );
  // Spray thrown up where it lands.
  for (let i = 0; i < 7; i++) {
    const a = r.range(-0.4, Math.PI + 0.4),
      d = r.range(0.25, 0.6);
    m.rock(
      lip[0] + Math.cos(a) * d * 1.3,
      poolLevel - 0.05,
      lip[2] + 0.55 + Math.sin(a) * d * 0.7,
      r.range(0.16, 0.3),
      r.range(0.14, 0.3),
      r.range(0.14, 0.24),
      river.spray,
      river.foam,
      6
    );
  }
}

// Crags on the mountain's foot: either side of the path, along the west skirt and on the
// two back corners of the board.
function footCrags(m, ground) {
  const r = m.rng;
  // Behind the gate five tall crags stand in a row like the mountain's own five peaks, the
  // middle one tallest and the thumb set apart; the path climbs between two of them.
  // [x, z, height, breadth, how far its lesser blocks rise]
  for (const [x, z, h, w, lesser] of [
    [-4.4, -9.3, 2.7, 0.7, 0.4],
    [-2.3, -10.4, 4.3, 0.66, 0.4],
    [-0.5, -10.9, 5.5, 0.7, 0.4],
    [2.7, -10.7, 4.6, 0.66, 0.4],
    [4.6, -10.1, 3.4, 0.6, 0.4],
    [-1.6, -8.4, 1.5, 0.5, 0.8],
    [2.9, -8.4, 1.7, 0.5, 0.8],
    [-0.9, -13.4, 3.6, 0.9, 0.8],
    [2.6, -14.4, 4.2, 0.9, 0.8],
    [-6.6, -8.6, 2.6, 0.7, 0.8],
    [-8.3, -7.4, 3.0, 0.75, 0.8],
    [-5.25, -5.35, 1.5, 0.5, 0.8],
    [5.3, -5.4, 1.2, 0.45, 0.8],
    [-8.9, -2.9, 1.7, 0.55, 0.8],
    [-10.4, 1.3, 1.6, 0.6, 0.8],
    [8.2, -6.3, 1.6, 0.6, 0.8],
    [-4.2, -12.6, 3.4, 0.9, 0.8],
    [5.6, -12.8, 3.2, 0.9, 0.8]
  ])
    for (let i = 0; i < 3; i++) {
      const a = r.range(0, TAU),
        d = i ? w * r.range(0.7, 1.2) : 0,
        px = x + Math.cos(a) * d,
        pz = z + Math.sin(a) * d,
        k = i ? lesser * r.range(0.55, 1) : 1,
        y = ground(px, pz);
      crag(m, px, pz, y - 0.5 - 0.3 * w, y + h * k, w * (i ? 0.75 : 1), w * r.range(0.75, 1));
    }
}

// The gate of 鐵掌幫 and the things they built: two rough stone posts under a lintel with
// the black banner between them, two taller banners, braziers, the stepped path up the
// mountain, the pan of iron sand and striking posts they train at, and a log bridge over
// the upper stream.
function gangWorks(m, ground) {
  const r = m.rng,
    [gx, gz] = gate,
    gy = ground(gx, gz);
  const grey = m.mix(stone.mid, stone.warm, 0.4),
    foot = m.mix(stone.dark, wetStone, 0.2),
    top = m.mix(stone.pale, moss, 0.2);
  m.frame(gx, gy, gz, 0, 1, () => {
    for (const s of [-1, 1]) {
      column(m, s * 1.2, -0.3, 0, 0.34, 3.05, 5, foot, grey, top);
      // Packing stones at the foot of each post.
      for (let i = 0; i < 3; i++)
        m.rock(
          s * 1.2 + r.range(-0.4, 0.4),
          -0.12,
          r.range(-0.4, 0.4),
          0.2,
          0.22,
          0.17,
          stone.dark,
          stone.pale,
          6
        );
    }
    // The lintel, a single rough slab, and the pole the banner hangs from.
    m.frame(0, 2.92, 0, 0, [1.72, 0.2, 0.36], () =>
      column(m, 0, -1, 0, 1, 2, 6, m.rgb(stone.dark), grey, top)
    );
    m.tube([-1.02, 2.5, 0.12], [1.02, 2.5, 0.12], 0.035, 0.035, timber, 6);
    for (const s of [-0.5, 0.5]) m.tube([s, 2.5, 0.12], [s, 2.74, 0.05], 0.012, 0.012, rope, 4);
    blackBanner(m, 0, 2.48, 0.12, 1.25, 1.02, 0.66);
    // Tall banners on poles either side, stepped in stone.
    for (const s of [-1, 1]) {
      const x = s * 2.35,
        z = 0.7,
        y = ground(gx + x, gz + z) - gy;
      column(m, x, y - 0.3, z, 0.26, 0.62, 6, foot, grey, top);
      m.tube([x, y, z], [x, y + 4.3, z], 0.055, 0.035, 0x55463a, 6);
      m.tube(
        [x - 0.42, y + 4.12, z + 0.05],
        [x + 0.42, y + 4.12, z + 0.05],
        0.028,
        0.028,
        timber,
        5
      );
      blackBanner(m, x, y + 4.1, z + 0.05, 0.66, 2.15, 0.56);
    }
    // Iron braziers on three legs.
    for (const s of [-1, 1]) {
      const x = s * 0.92,
        z = 0.85,
        y = ground(gx + x, gz + z) - gy;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU + 0.5;
        m.tube(
          [x + Math.cos(a) * 0.2, y - 0.05, z + Math.sin(a) * 0.2],
          [x + Math.cos(a) * 0.07, y + 0.62, z + Math.sin(a) * 0.07],
          0.018,
          0.018,
          0x2c2e30,
          4
        );
      }
      m.lathe(
        x,
        y + 0.56,
        z,
        [
          [0, 0.05],
          [0.06, 0.15],
          [0.16, 0.19],
          [0.18, 0.17],
          [0.13, 0.12]
        ],
        0x34363a,
        8
      );
      m.glow(() => m.crystal(x, y + 0.66, z, 0.1, 0.2, 0xd8642c, 0xf2b25a, 5));
    }
  });
  // The path: worn slabs across the apron, then steps climbing the gully.
  for (let i = 0; i < 44; i++) {
    const z = -6.24 - i * 0.34,
      x = pathX(z) + r.range(-0.05, 0.05),
      yaw = Math.atan2(pathX(z - 0.3) - pathX(z + 0.3), -0.6);
    m.frame(x, ground(x, z), z, yaw, 1, () =>
      m.box(0, -0.02, 0, r.range(0.8, 1.05), 0.16, 0.3, m.mix(pebble[0], pebble[1], r.next()))
    );
    if (i % 4 === 2 && i > 5) {
      const side = i % 8 === 2 ? 0.66 : -0.66,
        sx = x + side * Math.cos(yaw);
      m.rock(sx, ground(sx, z) - 0.06, z, 0.16, 0.2, 0.13, stone.dark, stone.pale, 6);
    }
  }
  // Where the gang harden their palms: an iron pan of hot iron sand on a stone hearth, and
  // three striking posts bound with rope.
  {
    const x = -3.2,
      z = -6.9,
      y = ground(x, z);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3;
      m.rock(
        x + Math.cos(a) * 0.4,
        y - 0.04,
        z + Math.sin(a) * 0.4,
        0.15,
        0.24,
        0.13,
        stone.dark,
        stone.pale,
        6,
        a
      );
    }
    m.glow(() => m.rock(x, y, z, 0.27, 0.12, 0.27, 0xb8431f, 0xf0a040, 6));
    m.lathe(
      x,
      y,
      z,
      [
        [0.15, 0.12],
        [0.2, 0.32],
        [0.31, 0.47],
        [0.42, 0.55],
        [0.44, 0.57],
        [0.41, 0.52]
      ],
      0x2b2d30,
      10
    );
    m.lathe(
      x,
      y,
      z,
      [
        [0.4, 0.52],
        [0.44, 0.28],
        [0.47, 0]
      ],
      0x5a534b,
      10
    );
    for (const [px, pz, h] of [
      [3.6, -6.8, 1.2],
      [4.25, -6.95, 1.05],
      [3.95, -7.4, 1.3]
    ]) {
      const py = ground(px, pz);
      m.tube([px, py - 0.2, pz], [px, py + h, pz], 0.095, 0.085, 0x6b5440, 7);
      m.tube([px, py + h * 0.55, pz], [px, py + h * 0.86, pz], 0.1, 0.1, rope, 7);
    }
  }
  // The log bridge: three trunks laid from bank to bank on boulder piers above the third step.
  const [bx, bz, tx, tz] = pointAt(5.4),
    half = width(5.4) + 0.5,
    deck = level(5.4) + 0.5;
  const ends = [-1, 1].map((s) => [bx - tz * half * s, bz + tx * half * s]);
  for (const [x, z] of ends) {
    const y = ground(x, z);
    boulder(m, x, y - 0.4, z, 0.5, deck - y + 0.32, 0.45, {
      wet: 0,
      green: 0.3,
      turn: r.range(0, TAU)
    });
  }
  for (const k of [-0.15, 0, 0.15])
    m.tube(
      [ends[0][0] + tx * k, deck + r.range(0, 0.03), ends[0][1] + tz * k],
      [ends[1][0] + tx * k, deck + r.range(0, 0.03), ends[1][1] + tz * k],
      0.08,
      0.07,
      k ? 0x7b6248 : 0x8a7052,
      6
    );
  for (const t of [0.22, 0.78]) {
    const x = lerp(ends[0][0], ends[1][0], t),
      z = lerp(ends[0][1], ends[1][1], t);
    m.tube(
      [x - tx * 0.26, deck + 0.075, z - tz * 0.26],
      [x + tx * 0.26, deck + 0.075, z + tz * 0.26],
      0.022,
      0.022,
      rope,
      4
    );
  }
}

// Pines rooted in the crags and on the apron north and west of the board.
function cragPines(m, valley, ground) {
  const r = m.rng;
  for (const [x, z, h, lean] of [
    [-3.9, -7.9, 2.5, 0.8],
    [-5.5, -8.2, 3.0, -0.6],
    [4.7, -7.7, 2.3, -0.9],
    [5.4, -8.3, 3.1, 0.7],
    [-5.3, -5.4, 1.5, 1],
    [5.25, -5.45, 1.3, -1],
    [-7.3, -3.6, 2.3, 0.6],
    [-8.9, -5.0, 2.9, -0.8],
    [-6.8, -6.9, 2.6, 0.9],
    [-9.4, 2.4, 2.1, 0.8],
    [-11.4, 0.9, 2.5, -0.7],
    [-13.8, -2.6, 2.8, 0.9],
    [-10.5, -6.9, 2.2, 1],
    [7.6, -5.6, 2.0, 0.8],
    [9.4, -6.8, 2.6, -0.6],
    [-3.4, -12.0, 3.0, -0.9],
    [4.2, -12.2, 3.0, 0.8]
  ])
    pine(m, x, ground(x, z) + (valley.outside(x, z) < 0.8 ? 1.2 : 0), z, h, {
      lean,
      yaw: r.range(0, TAU)
    });
  // Smaller, plainer pines up the slopes behind.
  for (let i = 0; i < 40; i++) {
    const x = r.range(-22, 16),
      z = r.range(-24, -6.5),
      y = ground(x, z);
    if (y < 1.2 || Math.abs(x - pathX(z)) < 1.1 || valley.reach(x, z)[0] < 1) continue;
    if (fbm(x * 0.4 + 9, z * 0.4) < 0.42) continue;
    pine(m, x, y, z, r.range(1.6, 3), {
      lean: r.range(-1, 1),
      yaw: r.range(0, TAU),
      boughs: 5,
      rich: false,
      spread: 1.3
    });
  }
}

// The near banks: short pines, scrub and dry grass, a boundary stone with the palm cut in it.
function lowGrowth(m, valley, ground) {
  const r = m.rng;
  for (const [x, z, h] of [
    [-3.4, 8.3, 1.25],
    [2.9, 8.9, 1.1],
    [6.6, 9.6, 1.3],
    [-7.4, 6.3, 1.5],
    [-9.8, 8.6, 1.7],
    [2.0, 11.6, 1.6],
    [-5.6, 11.6, 1.8],
    [9.3, 7.2, 1.0],
    [4.6, 12.4, 1.9],
    [-12.2, 5.2, 2.0],
    [-2.8, 15.4, 2.0],
    [7.2, 15.8, 2.2],
    [-8.6, 17.6, 2.3],
    [1.6, 19.4, 2.4],
    [10.8, 19.8, 2.2]
  ])
    pine(m, x, ground(x, z), z, h, {
      lean: r.range(-1, 1),
      yaw: r.range(0, TAU),
      boughs: 6,
      rich: false,
      spread: 1.3
    });
  for (let i = 0; i < 330; i++) {
    const x = r.range(-14, 16),
      z = r.range(-9, 15),
      out = valley.outside(x, z),
      y = ground(x, z);
    if (out < 0.5 || valley.reach(x, z)[0] < 0.5 || y > 1.2) continue;
    if (z < -6 && Math.abs(x - pathX(z)) < 1) continue;
    const green = fbm(x * 0.5 + 1.7, z * 0.5 - 4.2);
    if (green > 0.5 && i % 3 === 0) scrub(m, x, y, z, r.range(0.25, 0.5) * (out < 1.5 ? 0.7 : 1));
    else if (green > 0.34) tuft(m, x, y, z, r.range(0.14, 0.3));
  }
  // The boundary stone on the south bank.
  const x = -2.7,
    z = 7.9,
    y = ground(x, z);
  m.frame(x, y, z, -0.25, 1, () => {
    m.box(0, 0.02, 0, 0.74, 0.16, 0.44, stone.dark);
    m.frame(0, 0.08, 0, 0, [0.3, 1, 0.1], () =>
      column(
        m,
        0,
        0,
        0,
        1,
        0.98,
        6,
        m.rgb(stone.dark),
        m.mix(stone.mid, stone.warm, 0.5),
        m.rgb(stone.pale)
      )
    );
    palm(m, 0.01, 0.62, 0.104, 0.42, 0x2f3234);
    for (let i = 0; i < 3; i++)
      m.rock(
        r.range(-0.45, 0.45),
        -0.04,
        0.3 + r.range(0, 0.15),
        0.1,
        0.1,
        0.08,
        stone.mid,
        stone.pale,
        6
      );
  });
}

// One far peak: a steep horn with ridges and gullies that keeps its breadth most of the
// way up, like a finger.
function horn(m, x, z, base, w, d, H, lean, tint, haze, fade) {
  const r = m.rng,
    n = 8,
    turn = r.range(0, TAU);
  const spokes = Array.from({ length: n }, (_, i) => [
    turn + (i / n) * TAU + r.range(-0.12, 0.12),
    i % 2 ? r.range(0.66, 0.8) : r.range(0.95, 1.15)
  ]);
  const levels = [
    [0, 1.35],
    [0.2, 1],
    [0.45, 0.82],
    [0.7, 0.7],
    [0.86, 0.56],
    [0.95, 0.36],
    [1, 0.1]
  ];
  let last;
  for (const [k, wide] of levels) {
    const ring = spokes.map(([a, q]) => [
      x + Math.cos(a) * w * q * wide + lean * k * k * w,
      base + k * H,
      z + Math.sin(a) * d * q * wide
    ]);
    if (last)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n,
          c = m.mix(tint, haze, fade + 0.3 * (1 - k));
        m.face(
          [last[i], ring[i], ring[j], last[j]],
          c,
          0.9 + 0.1 * (i % 2) + 0.06 * Math.cos(i * 2.1)
        );
      }
    last = ring;
  }
  m.face([...last].reverse(), m.mix(tint, haze, fade));
}

// The far view: 鐵掌山's five peaks standing in a row like the fingers of an open hand, the
// middle one tallest and the thumb set apart; lower hills either side and across the river.
function fiveFingers(m, haze) {
  const r = m.rng,
    centre = [-11.5, -30],
    row = [0.925, -0.38];
  for (const [off, back, H, w, lean] of [
    [-10.5, 2.5, 13.5, 2.5, -0.5],
    [-4.6, 0, 20, 2.3, -0.12],
    [0, -0.8, 25.5, 2.4, 0],
    [4.6, 0, 21.5, 2.3, 0.1],
    [9, 1.2, 16, 2.2, 0.24]
  ])
    horn(
      m,
      centre[0] + row[0] * off - row[1] * back,
      centre[1] + row[1] * off + row[0] * back,
      2,
      w,
      w * 0.9,
      H,
      lean,
      0x3f4a54,
      haze,
      0.12
    );
  // The heel of the hand they rise from.
  for (let i = 0; i < 7; i++) {
    const off = -12 + i * 4 + r.range(-0.8, 0.8);
    horn(
      m,
      centre[0] + row[0] * off + row[1] * 2.5,
      centre[1] + row[1] * off - row[0] * 2.5,
      -0.5,
      r.range(3.4, 4.6),
      3.2,
      r.range(8, 11),
      0,
      0x46515a,
      haze,
      0.28
    );
  }
  // Lower hills round the rest of the horizon.
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU + r.range(-0.08, 0.08),
      rad = r.range(40, 47),
      x = Math.cos(a) * rad,
      z = Math.sin(a) * rad;
    // The hand itself keeps the northern sky.
    if (z < -20 && x < 12 && x > -36) continue;
    horn(m, x, z, -1, r.range(5, 8), r.range(4, 6), r.range(3, 7.5), 0, 0x55626a, haze, 0.5);
  }
}

// ---------------------------------------------------------------------------------------
// The tiles that are this board's own.

const inStream = (cell) => cell.y >= 4 && cell.y <= 7;
let kinds = null;
// Whether the tile next to this one, dx east and dy south, is anything but stream water.
function dryBeside(cell, dx, dy) {
  if (!kinds) {
    const layout = mapLayout(12);
    kinds = new Map(layout.cells.map((c) => [c.y * 100 + c.x, c.kind]));
  }
  const kind = kinds.get((cell.y + dy) * 100 + cell.x + dx);
  return kind !== undefined && kind !== 'reeds';
}

// 溪中石樁: in the stream, flat-topped stone posts standing at the back of their stepping
// stone; on the banks, a few low bank stones.
function stonePosts(m, p, cell) {
  const r = m.rng;
  if (inStream(cell)) {
    const foot = m.mix(p[2], wetStone, 0.7),
      top = m.mix(p[0], p[1], 0.6);
    for (const [x, z, rad, h] of [
      [-0.23, -0.29, 0.17, 0.37],
      [0.13, -0.34, 0.135, 0.25],
      [0.37, -0.22, 0.1, 0.16]
    ])
      column(
        m,
        x + r.range(-0.03, 0.03),
        0.012,
        z + r.range(-0.03, 0.03),
        rad,
        h * r.range(0.88, 1.1),
        7,
        foot,
        m.mix(p[2], p[3], r.range(0.2, 0.8)),
        top
      );
    m.rock(-0.41, 0.01, -0.12, 0.07, 0.07, 0.06, p[2], p[0], 6);
    return;
  }
  for (const [x, z, rad] of [
    [-0.3, -0.29, 0.16],
    [-0.02, -0.33, 0.13],
    [0.25, -0.27, 0.17],
    [0.4, -0.05, 0.08]
  ])
    boulder(
      m,
      x + r.range(-0.03, 0.03),
      0.0,
      z + r.range(-0.03, 0.03),
      rad,
      rad * r.range(1, 1.5),
      rad * r.range(0.75, 1),
      {
        wet: 0,
        green: r.range(0.1, 0.5),
        n: 7,
        turn: r.range(0, TAU)
      }
    );
  tuft(m, -0.42, 0.02, -0.38, 0.14);
}

// 溪心巨岩: a great water-worn boulder. In the stream its foot is dark and wet, with foam
// piled against it; on the banks moss has taken its crown.
function greatBoulder(m, p, cell) {
  const r = m.rng,
    wet = inStream(cell);
  boulder(m, -0.02, -0.02, -0.03, 0.41, r.range(0.74, 0.92), 0.38, {
    wet: wet ? 0.3 : 0.05,
    green: wet ? 0.08 : 0.45,
    n: 9,
    turn: r.range(0, TAU)
  });
  boulder(m, 0.29, -0.02, 0.24, 0.16, 0.3, 0.14, { wet: wet ? 0.3 : 0, green: 0.2, n: 7 });
  if (wet) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + r.range(-0.15, 0.15),
        d = r.range(0.41, 0.47),
        x = Math.max(-0.49, Math.min(0.49, Math.cos(a) * d * 1.08)),
        z = Math.max(-0.49, Math.min(0.49, Math.sin(a) * d));
      m.rock(
        x,
        0.012,
        z,
        r.range(0.05, 0.085),
        0.03,
        r.range(0.04, 0.06),
        river.spray,
        river.foam,
        5,
        a
      );
    }
  } else {
    tuft(m, -0.4, 0.02, 0.36, 0.16);
    tuft(m, 0.42, 0.02, -0.3, 0.13);
  }
}

// 岸邊松叢: three short crooked pines at the back and one side of the tile, the middle
// left open to stand in.
function pineClump(m, p) {
  const r = m.rng;
  for (const [x, z, h, boughs] of [
    [-0.29, -0.31, 0.84, 4],
    [0.27, -0.35, 0.66, 4],
    [0.4, 0.1, 0.42, 2]
  ])
    pine(m, x + r.range(-0.04, 0.04), 0.03, z + r.range(-0.03, 0.03), h * r.range(0.9, 1.1), {
      lean: r.range(-1, 1),
      yaw: r.range(0, TAU),
      boughs,
      rich: false,
      spread: 1.4
    });
  m.rock(-0.02, 0.01, -0.4, 0.08, 0.07, 0.06, p[2], p[0], 5);
  // Fallen needles.
  for (let i = 0; i < 5; i++) {
    const x = r.range(-0.42, 0.42),
      z = r.range(-0.44, -0.12);
    m.leaf([x, 0.03, z], [x + 0.07, 0.032, z + 0.03], 0.012, 0x8a6f4a, 0x9a7d52, 0.003);
  }
}

// 幫眾貨擔: a porter's load set down: two roped baskets and the carrying pole laid across them.
function porterLoad(m, p, cell) {
  const r = m.rng,
    weave = [0xa88c5a, 0x97794c];
  m.frame(0, 0.02, 0, cell.x % 2 ? 0.3 : -0.25, 1, () => {
    for (const s of [-1, 1]) {
      const x = s * 0.25;
      m.lathe(
        x,
        0,
        0,
        [
          [0, 0.14],
          [0.06, 0.185],
          [0.27, 0.2],
          [0.31, 0.185],
          [0.33, 0.13],
          [0.385, 0.05]
        ],
        weave[(s + 1) / 2],
        10
      );
      // Rope bands round the basket and the loops the pole passes through.
      for (const y of [0.09, 0.24])
        m.lathe(
          x,
          y,
          0,
          [
            [-0.012, 0.203],
            [0.012, 0.205]
          ],
          rope,
          10
        );
      for (const k of [-1, 1]) {
        m.tube([x + k * 0.15, 0.3, 0.1], [x + k * 0.03, 0.455, 0.0], 0.008, 0.008, rope, 4);
        m.tube([x + k * 0.15, 0.3, -0.1], [x + k * 0.03, 0.455, 0.0], 0.008, 0.008, rope, 4);
      }
    }
    // The pole, bowed by years of loads.
    m.line(
      [
        [-0.47, 0.4, 0.01],
        [-0.25, 0.425, 0],
        [0, 0.44, 0],
        [0.25, 0.425, 0],
        [0.47, 0.4, 0.01]
      ],
      0.022,
      timber,
      6
    );
    // A bundle in the gang's black cloth, and a sack leaning on the baskets.
    m.frame(-0.25, 0.39, 0, 0.4, 1, () => m.box(0, 0.05, 0, 0.2, 0.1, 0.16, cloth));
    m.frame(0.04, 0, 0.27, r.range(-0.3, 0.3), 1, () =>
      m.rock(0, 0, 0, 0.17, 0.2, 0.11, 0x8f8062, 0xb4a47f, 7)
    );
    m.frame(0.02, 0, -0.3, 0.2, 1, () => m.box(0, 0.09, 0, 0.3, 0.18, 0.2, 0x7a6248));
  });
}

// 湍溪淺水: fast shallow water. Foam breaks along every stone and bank it runs against and
// on the brink it falls from; pale streaks are drawn out down the current, and here and
// there a small stone trails a wake.
function rapids(m, p, cell) {
  const r = m.rng,
    white = m.rgb(river.foam),
    pale = m.mix(p[5], river.foam, 0.55);
  const brink = !dryBeside(cell, 1, 0) && cell.x === mapLayout(12).width - 1;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    const land = dryBeside(cell, dx, dy);
    if (!land && !(dx === 1 && brink)) continue;
    // A line of foam along that edge, ragged on its inner side, in the tile's own frame.
    const at = (t, depth) => (dx ? [dx * (0.5 - depth), 0.002, t] : [t, 0.002, dy * (0.5 - depth)]);
    const n = 7,
      inner = [];
    for (let i = 0; i <= n; i++)
      inner.push(i % 2 ? r.range(0.05, land ? 0.12 : 0.085) : r.range(0.012, 0.03));
    for (let i = 0; i < n; i++) {
      const a = -0.5 + i / n,
        b = a + 1 / n;
      m.face(
        [at(a, 0), at(b, 0), at(b, inner[i + 1]), at(a, inner[i])],
        [white, white, pale, pale]
      );
    }
  }
  for (let i = 0; i < 3; i++) {
    const x = r.range(-0.42, 0.1),
      z = r.range(-0.42, 0.42),
      len = r.range(0.18, 0.36),
      w = r.range(0.012, 0.026);
    m.face(
      [
        [x, 0, z - w],
        [x + len * 0.3, 0, z + w],
        [x + len, 0, z + r.range(-0.02, 0.02)]
      ],
      m.mix(p[5], river.foam, r.range(0.35, 0.7))
    );
  }
  if (r.next() < 0.55) {
    // A stone breaking the surface off the middle of the tile, and its wake.
    const a = r.range(0, TAU),
      x = Math.cos(a) * 0.34 - 0.06,
      z = Math.sin(a) * 0.34,
      rad = r.range(0.045, 0.075);
    m.rock(x, -0.03, z, rad, 0.07, rad * 0.8, m.mix(p[2], wetStone, 0.5), p[0], 6);
    m.face(
      [
        [x - rad * 0.4, 0.003, z - rad],
        [x + 0.1, 0.003, z - rad * 0.5],
        [x + 0.2 + rad, 0.003, z],
        [x + 0.1, 0.003, z + rad * 0.5],
        [x - rad * 0.4, 0.003, z + rad]
      ],
      [white, pale, pale, pale, white]
    );
  }
}

// 山藥坡: yam vines trained up short canes at the back of the tile, their runners along
// its edges.
function yamPatch(m, p) {
  const r = m.rng,
    leaf = [0x5f7e4c, 0x71905a, 0x82995f];
  for (const [x, z] of [
    [-0.32, -0.3],
    [0.02, -0.36],
    [0.33, -0.28]
  ]) {
    const h = r.range(0.36, 0.48);
    m.tube([x, 0.02, z], [x + r.range(-0.03, 0.03), h, z], 0.011, 0.008, 0x9a8a5e, 4);
    for (let k = 0; k < 7; k++) {
      const a = k * 2.1 + r.range(-0.3, 0.3),
        y = 0.06 + (h - 0.08) * (k / 6),
        l = r.range(0.1, 0.16);
      m.leaf(
        [x, y, z],
        [x + Math.cos(a) * l, y + 0.02, z + Math.sin(a) * l * 0.8],
        l * 0.42,
        r.pick(leaf),
        m.mix(r.pick(leaf), p[1], 0.25),
        0.02
      );
    }
  }
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1,
      x = side * r.range(0.3, 0.44),
      z = r.range(-0.2, 0.42),
      a = r.range(0, TAU),
      l = r.range(0.09, 0.14);
    m.leaf(
      [x, 0.03, z],
      [x + Math.cos(a) * l, 0.05, z + Math.sin(a) * l],
      l * 0.42,
      r.pick(leaf),
      leaf[2],
      0.012
    );
  }
}

const tiles12 = {
  cover: stonePosts,
  rock: greatBoulder,
  bamboo: pineClump,
  crate: porterLoad,
  reeds: rapids,
  herbs: yamPatch
};

function landform12(T, layout) {
  const valley = makeValley(layout);
  const banks = new Model(T, 51211),
    mountain = new Model(T, 51229),
    water = new Model(T, 51241),
    works = new Model(T, 51257),
    pines = new Model(T, 51263),
    growth = new Model(T, 51283),
    far = new Model(T, 51307);
  const ground = layGround(banks, mountain, valley);
  streamStones(banks, valley, ground);
  footCrags(mountain, ground);
  highFall(mountain, ground);
  upperStream(water);
  brinkFall(water);
  gangWorks(works, ground);
  cragPines(pines, valley, ground);
  lowGrowth(growth, valley, ground);
  fiveFingers(far, 0xbfc8c0);
  const group = new T.Group();
  group.name = '鐵掌溪灘・山門與五指峰';
  group.add(
    banks.finish('兩岸灘地與溪床亂石'),
    mountain.finish('鐵掌山麓與懸瀑崖', { occluder: true }),
    water.finish('上游疊水與溪口跌水', { cast: false }),
    works.finish('山門黑旗與石磴木橋', { occluder: true }),
    pines.finish('崖上松', { occluder: true }),
    growth.finish('南岸矮松灌叢與界石', { occluder: true }),
    far.finish('五指峰遠景', { distant: true, cast: false })
  );
  return group;
}

export { landform12, tiles12 };
