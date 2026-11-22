import {
  clamp,
  smooth,
  rise,
  lerp,
  stone,
  wetStone,
  pebble,
  turf,
  earth,
  hash,
  fbm
} from './kit-12.js';

// The lie of 鐵掌溪灘 beyond the board: the stream's course and steps, the banks as one height
// function, their colour, and the ground laid as a grid.

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
    // Hummocks in the turf.
    h += (fbm(x * 2.4 + 0.7, z * 2.4 - 3.3) - 0.5) * 0.09;
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
    trodden = Math.max(smooth(1 - valley.outside(x, z) / 1.4), trail);
  const shingle = m.mix(pebble[0], pebble[1], speck * 0.8),
    soil = m.mix(m.mix(0x696458, earth, smooth(patch / 0.45)), shingle, 0.2 + 0.5 * patch),
    grass = m.mix(turf[0], turf[1], patch);
  // Turf holds wherever the floods do not reach, most of all on the south bank and the apron.
  const lush = 0.4 - 0.2 * smooth((Math.abs(z) - 3) / 4),
    green =
      smooth((broad - lush) / 0.2) *
      (0.55 + 0.45 * smooth((patch - 0.35) / 0.3)) *
      (1 - strand) *
      (1 - 0.8 * trodden);
  // Flood gravel lies in bands along the water, pale where it has dried.
  const flood = strand * (0.5 + 0.5 * Math.sin(e * 9 + patch * 4));
  let c = m.mix(m.mix(soil, shingle, Math.max(strand, trodden * 0.8)), grass, green);
  c = m.mix(c, m.mix(pebble[1], 0xc4bca8, 0.4), flood * 0.35);
  // Heather and ling darken the turf in drifts.
  const heath = smooth((fbm(x * 0.9 + 13.1, z * 0.9 - 2.3) - 0.55) / 0.12) * green;
  c = m.mix(c, m.mix(0x6a5a50, 0x5c5a44, patch), heath * 0.65);
  // The worn trail: bare earth down its middle, darker where feet and wheels have pressed.
  if (trail > 0) c = m.mix(c, m.mix(earth, 0x5f584c, smooth(trail * 2 - 1)), trail * 0.55);
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

export {
  run,
  runLength,
  falls,
  boardWater,
  level,
  poolLevel,
  width,
  along,
  pointAt,
  lowWater,
  lowerMid,
  lowerHalf,
  bars,
  lowerBoulders,
  pathX,
  gate,
  makeValley,
  tone,
  layGround
};
