// What lies round the 溫 house: the ravine it is built over and the hills it sits in. The ravine
// runs east and west across the south of the court, four paces deep to a green stream; its north
// face is the house's own dressed masonry over raw rock, stepping out in two bastions to the
// bridgeheads, its south face rock under the landing. Ferns, grass and scrub grow on its ledges,
// vines hang from its lips, a small fall comes down its north face west of the house and mist
// lies along it. North of the house the land rises into wooded hills; south of the landing a
// grassy hillside falls away; far off, ranges of misty hills close the view on every side.
import { circle } from '../scenery-kit.js';
import { noise, fbm, boulder } from './kit-12.js';
import { fern, grassClump, bush } from './flora-12.js';
import { SHELF, WATER, put } from './kit-16.js';

const rockTone = 0x7a756a;
const rockDark = 0x56544e;
const rockPale = 0x9c988b;
const rockWet = 0x3c423e;
const mossTone = 0x5f7046;
const grass = [0x506a3e, 0x5b7445, 0x4b6339, 0x637a4b];
const earth = 0x857a60;
const streamDeep = 0x2f4e4a;
const streamLight = 0x5a7d74;
const foam = 0xdde5df;
const hillTones = [0x5d6f5a, 0x6f7f72, 0x8a9690, 0xa5aeab];

// The lips of the ravine: points with the height the face starts from ('wall' where the house's
// masonry stands above, 'land' where the face meets the natural ground). The north lip runs west
// to east and the south lip east to west, so the ravine always lies to the right of the line.
const NORTH = [
  { land: [[-36, 1.5], [-31, 2.1], [-26, 1.6], [-21, 2.4], [-16.5, 1.9], [-13.8, 2.1], [-12.4, 2.5], [-11.2, 2.32]] },
  { wall: [[-11.2, 2.32], [-6.5, 2.32], [-6.5, 2.0], [-5.5, 2.0], [-5.5, 3.0], [-3.5, 3.0], [-3.5, 4.0], [3.5, 4.0], [3.5, 3.0], [5.5, 3.0], [5.5, 2.0], [6.5, 2.0], [6.5, 2.32], [14.0, 2.32]] },
  { land: [[14.0, 2.32], [15.2, 2.6], [17.5, 2.1], [21, 2.6], [25, 1.8], [30, 2.3], [36, 1.6]] }
];
const SOUTH = [
  { land: [[36, 6.9], [30, 6.3], [25, 7.0], [20, 6.4], [15, 6.9], [11, 6.3], [7.5, 6.1], [5, 5.9], [3.5, 6.0]] },
  { wall: [[3.5, 6.0], [3.5, 5.0], [-3.5, 5.0], [-3.5, 6.0]] },
  { land: [[-3.5, 6.0], [-5, 5.85], [-7.5, 6.15], [-11, 6.5], [-15, 6.0], [-20, 6.7], [-25, 6.2], [-30, 6.9], [-36, 6.4]] }
];
// The lip's z at x, for the natural ground on either side.
function lipAt(sections, x) {
  let best = null;
  for (const s of sections) {
    const pts = s.land || s.wall;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i],
        [bx, bz] = pts[i + 1];
      const lo = Math.min(ax, bx),
        hi = Math.max(ax, bx);
      if (x < lo || x > hi || hi - lo < 1e-6) continue;
      const z = az + ((bz - az) * (x - ax)) / (bx - ax);
      if (best === null || (sections === NORTH ? z > best : z < best)) best = z;
    }
  }
  return best ?? (sections === NORTH ? 2 : 6.5);
}
const lipN = (x) => (x >= -11.2 && x <= 14.0 ? 2.32 : lipAt(NORTH, x));
const lipS = (x) => (Math.abs(x) <= 3.5 ? 6.0 : lipAt(SOUTH, x));

// The ground north of the ravine: level lanes beside the house, rising into the hills behind.
function heightN(x, z) {
  const back = Math.max(0, -z - 21),
    side = Math.max(0, Math.abs(x) - 16);
  const rise = back * 0.42 + side * 0.22 + Math.min(back, side) * 0.1;
  const bump = (fbm(x * 0.12 + 4, z * 0.12) - 0.5) * Math.min(1.6, 0.2 + rise * 0.3);
  return Math.min(9, rise) + bump - 0.03;
}
// The ground south of the landing: level by the bridge, then falling away down the hillside.
function heightS(x, z) {
  const away = Math.max(0, z - 7.2) + Math.max(0, Math.abs(x) - 5) * 0.3;
  const bump = (fbm(x * 0.16 - 2, z * 0.16 + 3) - 0.5) * Math.min(0.9, 0.08 + away * 0.12);
  return -0.025 - away * 0.2 + bump;
}

function pathPoints(sections) {
  // Resample each section every ~0.3 along its length, keeping corners, with a normal that
  // points into the ravine (to the right of the line).
  return sections.map((s) => {
    const pts = s.land || s.wall,
      out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i],
        [bx, bz] = pts[i + 1],
        len = Math.hypot(bx - ax, bz - az),
        n = Math.max(1, Math.round(len / (Math.min(Math.abs(ax), Math.abs(bx)) > 15 ? 0.6 : 0.3)));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const t = k / n;
        out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, seg: [(bx - ax) / len, (bz - az) / len], corner: k === 0 || k === n });
      }
    }
    // Normals: the segment's right-hand side, averaged at the corners.
    for (let i = 0; i < out.length; i++) {
      const a = out[Math.max(0, i - 1)].seg,
        b = out[i].seg;
      let nx = -(a[1] + b[1]) / 2,
        nz = (a[0] + b[0]) / 2;
      const l = Math.hypot(nx, nz) || 1;
      out[i].n = [nx / l, nz / l];
    }
    return { kind: s.land ? 'land' : 'wall', pts: out };
  });
}

// How far the rock stands out from (or is cut back behind) the lip at a point of the face.
function bulge(u, y, top) {
  const k = Math.min(1, (top - y) / 0.9);
  return k * ((fbm(u * 0.33 + 7, y * 0.42) - 0.5) * 0.75 + 0.06 * Math.sin(u * 1.7 + y));
}
// The colour of the rock at a point: grey-brown, paler on its upper faces, mossy in streaks,
// dark and wet by the water.
function rockColour(m, u, y) {
  const n = noise(u * 0.8, y * 0.6),
    streak = noise(u * 1.6 + 3, y * 0.15);
  let c = m.mix(rockDark, rockTone, 0.35 + 0.55 * n);
  if (y > -1.8) c = m.mix(c, rockPale, 0.25 * (1 - Math.abs(y + 0.9)));
  if (streak > 0.6) c = m.mix(c, mossTone, Math.min(0.7, (streak - 0.6) * 2.5));
  if (y < WATER + 0.55) c = m.mix(c, rockWet, Math.min(1, (WATER + 0.55 - y) / 0.5));
  return c;
}

// One face of the ravine along a lip line.
function face(m, line, topOf, salt) {
  const { pts } = line;
  let u = salt;
  const rows = [];
  for (let i = 0; i < pts.length; i++) {
    if (i) u += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    const p = pts[i],
      top = topOf(p),
      ends = i === 0 || i === pts.length - 1,
      ys = [top, top - 0.22, top - 0.6];
    for (let y = top - 1.05; y > WATER - 0.5; y -= 0.56) ys.push(y);
    ys.push(WATER - 0.6);
    const fall = Math.abs(p.x + 13.6) < 1.1 ? 0.2 : 1;
    rows.push(
      ys.map((y) => {
        const b = ends ? 0 : bulge(u, y, top) * fall;
        return { pos: [p.x + p.n[0] * b, y, p.z + p.n[1] * b], col: rockColour(m, u, y) };
      })
    );
  }
  // Rows can differ in length (their tops differ); join them by the shorter.
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i],
      b = rows[i + 1],
      n = Math.min(a.length, b.length);
    for (let j = 0; j < n - 1; j++) {
      const p = [a[j].pos, a[j + 1].pos, b[j + 1].pos, b[j].pos];
      m.face(p, [a[j].col, a[j + 1].col, b[j + 1].col, b[j].col]);
    }
  }
}

// Ledge plants, hanging vines and a few boulders along a face.
function faceLife(m, line, topOf) {
  const r = m.rng;
  for (let i = 2; i < line.pts.length - 2; i += 3) {
    const p = line.pts[i],
      top = topOf(p);
    const at = (y, out) => [p.x + p.n[0] * out, y, p.z + p.n[1] * out];
    const roll = r.next();
    if (roll < 0.28) {
      const y = r.range(WATER + 0.8, top - 0.5),
        q = at(y, 0.35);
      fern(m, q[0], q[1], q[2], r.range(0.25, 0.45), 5);
    } else if (roll < 0.45) {
      const y = r.range(WATER + 0.8, top - 0.4),
        q = at(y, 0.3);
      grassClump(m, q[0], q[1], q[2], r.range(0.22, 0.38), 6);
    } else if (roll < 0.55) {
      const q = at(r.range(-3, top - 0.6), 0.35);
      bush(m, q[0], q[1], q[2], r.range(0.35, 0.55));
    }
    // Vines hanging from the lip.
    if (r.next() < 0.22) {
      let q = at(top - 0.05, 0.08);
      const len = r.range(0.8, 2.4),
        steps = Math.round(len / 0.2);
      for (let k = 0; k < steps; k++) {
        const nx = [q[0] + r.range(-0.04, 0.04), q[1] - 0.2, q[2]];
        const off = 0.06 + 0.06 * Math.sin(k);
        nx[0] += p.n[0] * off * 0.2;
        nx[2] += p.n[1] * off * 0.2;
        m.tube(q, nx, 0.008, 0.007, 0x4d5a36, 3);
        if (k % 2 === 0) m.leaf(nx, [nx[0] + p.n[0] * 0.09 + r.range(-0.05, 0.05), nx[1] - 0.04, nx[2] + p.n[1] * 0.09], 0.04, 0x4f7a3c, 0x7fa058, 0.01);
        q = nx;
      }
    }
    // Boulders fallen to the stream's edge.
    if (r.next() < 0.18) {
      const q = at(WATER - 0.15, r.range(0.25, 0.7)),
        s = r.range(0.2, 0.45);
      boulder(m, q[0], q[1], q[2], s, s * r.range(0.6, 1.0), s * 0.8, { wet: 0.4, green: 0.2, n: 7, turn: r.range(0, 3) });
    }
  }
}

// The stream: a long ribbon down the ravine floor, streaked with current, foam along its edges
// and about the stones, and white water under the fall.
function stream(m) {
  const r = m.rng,
    step = 0.5;
  for (let x = -36; x < 36; x += step) {
    const z0 = (xx) => lipN(xx) - 0.6 + (Math.abs(xx) <= 3.5 ? 1.4 : Math.abs(xx) <= 5.5 ? 0.6 : 0),
      z1 = (xx) => lipS(xx) + 0.5 - (Math.abs(xx) <= 3.5 ? 1.0 : 0);
    const cols = 6;
    for (let j = 0; j < cols; j++) {
      const t0 = j / cols,
        t1 = (j + 1) / cols;
      const pt = (xx, t) => {
        const z = z0(xx) + (z1(xx) - z0(xx)) * t;
        return [xx, WATER + 0.008 * Math.sin(xx * 3 + t * 9), z];
      };
      const tone = (xx, t) => {
        const current = noise(xx * 0.9 + t * 3, t * 7 - xx * 0.2);
        let c = m.mix(streamDeep, streamLight, 0.25 + 0.5 * current * (1 - Math.abs(t - 0.5)));
        if (t < 0.1 || t > 0.9) c = m.mix(c, foam, 0.35);
        if (Math.abs(xx + 13.6) < 1.5) c = m.mix(c, foam, 0.6 * (1 - Math.abs(xx + 13.6) / 1.5) * (t < 0.6 ? 1 : 0.3));
        return c;
      };
      const a = pt(x, t0),
        b = pt(x + step, t0),
        c = pt(x + step, t1),
        d = pt(x, t1);
      put(m, [a, d, c, b], [tone(x, t0), tone(x, t1), tone(x + step, t1), tone(x + step, t0)]);
    }
    // Stones in mid-stream, with foam round their upstream side.
    if (r.next() < 0.12) {
      const t = r.range(0.25, 0.75),
        z = z0(x) + (z1(x) - z0(x)) * t,
        s = r.range(0.12, 0.3);
      boulder(m, x, WATER - 0.08, z, s, s * 0.7, s * 0.8, { wet: 0.6, green: 0.15, n: 7 });
      put(m, [[x - s * 1.4, WATER + 0.012, z - s * 0.5], [x - s * 1.4, WATER + 0.012, z + s * 0.5], [x + s * 0.2, WATER + 0.012, z + s * 0.9], [x + s * 0.2, WATER + 0.012, z - s * 0.9]], foam);
    }
  }
}

// The fall west of the house: a stream from the hills drops down the north face in two leaps
// into a pool of white water.
function fall(m) {
  const x0 = -14.1,
    x1 = -13.1,
    r = m.rng;
  const zAt = (y) => lipAt(NORTH, -13.6) + 0.14 + Math.max(0, -y) * 0.05;
  // Its channel across the lane, stone-lined.
  for (let z = -6; z < lipAt(NORTH, -13.6); z += 0.5) {
    const y = heightN(-13.6, z) + 0.02;
    put(m, [[x0 + 0.1, y - 0.04, z], [x1 - 0.1, y - 0.04, z], [x1 - 0.1, y - 0.04, z + 0.5], [x0 + 0.1, y - 0.04, z + 0.5]], m.mix(streamLight, foam, 0.2));
    for (const s of [x0, x1]) m.box(s, y, z + 0.25, 0.14, 0.12, 0.5, rockTone);
  }
  const strips = 7,
    rows = 12,
    top = heightN(-13.6, lipAt(NORTH, -13.6)) - 0.02;
  for (let i = 0; i < strips; i++) {
    const xa = x0 + ((x1 - x0) * i) / strips,
      xb = x0 + ((x1 - x0) * (i + 1)) / strips;
    for (let k = 0; k < rows; k++) {
      const ya = top + ((WATER - top) * k) / rows,
        yb = top + ((WATER - top) * (k + 1)) / rows;
      const c = m.mix(0xc9d8d4, 0xf2f5f1, noise(i * 1.3, k * 0.7) * 0.9),
        cb = m.mix(0xb4c8c4, 0xeef2ee, noise(i * 1.3 + 0.5, k * 0.7 + 0.7) * 0.9);
      put(m, [[xa, ya, zAt(ya)], [xb, ya, zAt(ya)], [xb, yb, zAt(yb)], [xa, yb, zAt(yb)]], [c, c, cb, cb], [0, 0, 1]);
    }
  }
  // The ledge it breaks on half way, and the spray and foam at its foot.
  boulder(m, -13.6, -2.3, zAt(-2.3) + 0.05, 0.6, 0.25, 0.3, { wet: 0.8, green: 0.3, n: 8 });
  for (let i = 0; i < 9; i++) {
    const a = (i * circle) / 9,
      d = r.range(0.2, 0.7);
    m.rock(-13.6 + Math.cos(a) * d, WATER - 0.05, zAt(WATER) + 0.4 + Math.sin(a) * d * 0.6, r.range(0.15, 0.3), r.range(0.06, 0.16), r.range(0.12, 0.25), 0xc6d4d0, 0xf4f6f2, 7);
  }
}

// A strip of natural ground beside a lip: rows run away from the lip to `reach`, sampled from
// `height`; `skip` leaves out the quads the house stands on.
function land(m, lip, sign, height, reach, skip, salt) {
  const xs = [];
  for (let x = -36; x <= 36.001; x += 0.6) xs.push(x);
  const ds = [0, 0.25, 0.6, 1.1, 1.8, 2.7, 3.8, 5.1, 6.6, 8.3, 10.2, 12.4, 15, 18, 21.5, 25.5, 30, 35, 40.5];
  const grid = xs.map((x) =>
    ds.filter((d) => d <= reach + 0.01).map((d) => {
      const z = lip(x) + sign * d,
        y = height(x, z);
      const g = noise(x * 0.5 + salt, z * 0.5);
      let c = m.mix(grass[Math.floor(g * 3.99)], grass[(Math.floor(g * 7) + 1) % 4], 0.4);
      c = m.mix(c, noise(x * 1.9, z * 1.9) > 0.5 ? 0x4c5a38 : 0x7d8458, Math.abs(noise(x * 1.9, z * 1.9) - 0.5) * 0.6);
      if (d < 0.7) c = m.mix(c, rockPale, 0.35 - d * 0.3);
      if (noise(x * 0.3 - salt, z * 0.3) > 0.68) c = m.mix(c, earth, 0.4);
      // Height turns the grass toward the blue of distance a little.
      if (y > 2) c = m.mix(c, 0x6a7a6a, Math.min(0.3, (y - 2) * 0.05));
      return { pos: [x, y, z], col: c };
    })
  );
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < grid[i].length - 1 && j < grid[i + 1].length - 1; j++) {
      const a = grid[i][j],
        b = grid[i + 1][j],
        c = grid[i + 1][j + 1],
        d = grid[i][j + 1];
      const cx = (a.pos[0] + c.pos[0]) / 2,
        cz = (a.pos[2] + c.pos[2]) / 2;
      if (skip(cx, cz)) continue;
      put(m, [a.pos, b.pos, c.pos, d.pos], [a.col, b.col, c.col, d.col]);
    }
}

// Rocks and growth on the open ground: boulders half sunk in the grass, clumps of grass and fern.
function groundLife(m, height, area, count, skip) {
  const r = m.rng;
  for (let i = 0; i < count; i++) {
    const x = r.range(area[0], area[1]),
      z = r.range(area[2], area[3]);
    if (skip(x, z)) continue;
    const y = height(x, z),
      roll = r.next();
    if (roll < 0.14) {
      const s = r.range(0.15, 0.38);
      boulder(m, x, y - s * 0.3, z, s, s * r.range(0.45, 0.75), s * 0.8, { wet: 0.3, green: 0.6, n: 7, turn: r.range(0, 3) });
    } else if (roll < 0.7) grassClump(m, x, y, z, r.range(0.2, 0.4), 7);
    else if (roll < 0.85) fern(m, x, y, z, r.range(0.25, 0.4), 5);
    else bush(m, x, y, z, r.range(0.35, 0.6));
  }
}

// The stone path from the landing down the hillside, and whether a point is on it.
const PATH = [
  [0, 6.1],
  [0.3, 7.5],
  [1.4, 9.2],
  [3.2, 10.6],
  [5.6, 11.8],
  [8.4, 13.4],
  [10.5, 15.6],
  [12.0, 18.5]
];
function nearPath(x, z, d = 0.95) {
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i],
      [bx, bz] = PATH[i + 1],
      dx = bx - ax,
      dz = bz - az,
      t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    if (Math.hypot(x - ax - dx * t, z - az - dz * t) < d) return true;
  }
  return false;
}

// Its steps.
function hillPath(m) {
  const pts = PATH;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i],
      [bx, bz] = pts[i + 1],
      len = Math.hypot(bx - ax, bz - az),
      n = Math.max(1, Math.round(len / 0.55)),
      yaw = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n,
        x = ax + (bx - ax) * t,
        z = az + (bz - az) * t,
        y = heightS(x, z);
      m.frame(x, y, z, yaw, 1, () => {
        m.box(0, 0.0, 0, 1.15, 0.12, 0.5, m.mix(0x9a978c, 0x7d7b72, m.rng.next()));
        m.box(0, 0.065, 0.03, 1.1, 0.01, 0.4, m.mix(0xa8a598, 0x8d8b80, m.rng.next()));
      });
    }
  }
}

// Ranges of hills all round, each further one paler and bluer in the haze; the nearest dotted
// with trees.
function farHills(m) {
  const r = m.rng;
  const layers = [
    { rad: 34, h: [3, 11], tone: 0x5f736c, n: 120, salt: 1 },
    { rad: 47, h: [7, 14], tone: hillTones[0], n: 110, salt: 5 },
    { rad: 63, h: [10, 19], tone: hillTones[1], n: 96, salt: 9 },
    { rad: 82, h: [14, 25], tone: hillTones[2], n: 80, salt: 13 }
  ];
  for (const L of layers) {
    const ring = [];
    for (let i = 0; i <= L.n; i++) {
      const a = (i * circle) / L.n,
        k = fbm(Math.cos(a) * 3 + L.salt, Math.sin(a) * 3 - L.salt),
        peak = Math.pow(k, L.rad < 40 ? 2.2 : 1.6) * (L.rad < 40 ? 1.25 : 1),
        rad = L.rad * (0.92 + 0.16 * noise(a * 4 + L.salt, 2));
      ring.push({ a, rad, h: L.h[0] + (L.h[1] - L.h[0]) * peak * 1.4 });
    }
    const base = -7;
    for (let i = 0; i < L.n; i++) {
      const p = ring[i],
        q = ring[i + 1];
      const at = (s, f, y) => [Math.cos(s.a) * s.rad * f, y, Math.sin(s.a) * s.rad * f];
      const shoulder = (s) => base + (s.h - base) * 0.55;
      const lo = m.mix(L.tone, 0x9aa49c, 0.2),
        hi = m.mix(L.tone, 0xb8c0b8, 0.25);
      put(m, [at(p, 1.12, base), at(q, 1.12, base), at(q, 1.04, shoulder(q)), at(p, 1.04, shoulder(p))], [lo, lo, L.tone, L.tone], [-Math.cos(p.a), 0, -Math.sin(p.a)]);
      put(m, [at(p, 1.04, shoulder(p)), at(q, 1.04, shoulder(q)), at(q, 1, q.h), at(p, 1, p.h)], [m.rgb(L.tone), m.rgb(L.tone), hi, hi], [-Math.cos(p.a), 0.5, -Math.sin(p.a)]);
      put(m, [at(p, 1, p.h), at(q, 1, q.h), at(q, 1.06, q.h - 2), at(p, 1.06, p.h - 2)], m.mix(L.tone, 0x8a948c, 0.3), [0, 1, 0]);
      // Trees along the crest and the near flank of the nearest range.
      if (L.rad < 40)
        for (let t = 0; t < 1; t++) {
          const f = r.range(0, 1),
            s = { a: p.a + (q.a - p.a) * f, rad: p.rad + (q.rad - p.rad) * f, h: p.h + (q.h - p.h) * f };
          const up = r.range(0.55, 1);
          const y = base + (s.h - base) * up,
            g = at(s, 1.04 - 0.04 * up, y);
          const hh = r.range(0.9, 1.7);
          m.tube(g, [g[0], g[1] + hh, g[2]], hh * 0.35, 0.0, m.mix(0x3f5444, L.tone, 0.35), 5);
        }
    }
  }
}

// Banks of mist lying in the folds of the far hills.
function mistBanks(m) {
  const r = m.rng,
    drift = (x, y, z, len, depth, tone) => {
      const n = 9;
      for (let k = 0; k < 3; k++) {
        const cx = x + r.range(-len, len) * 0.4,
          cz = z + r.range(-depth, depth) * 0.3,
          rx = len * r.range(0.45, 0.7),
          rz = depth * r.range(0.5, 0.8),
          top = [cx, y + r.range(0.12, 0.3), cz],
          ring = [];
        for (let i = 0; i < n; i++) {
          const a = (i * circle) / n;
          ring.push([cx + Math.cos(a) * rx * r.range(0.85, 1.1), y, cz + Math.sin(a) * rz * r.range(0.85, 1.1)]);
        }
        for (let i = 0; i < n; i++) put(m, [ring[i], ring[(i + 1) % n], top], [m.rgb(tone), m.rgb(tone), m.mix(tone, 0xffffff, 0.25)]);
      }
    };
  for (let i = 0; i < 18; i++) {
    const a = r.range(0, circle),
      d = r.range(40, 70);
    drift(Math.cos(a) * d, r.range(-3, 1.5), Math.sin(a) * d, r.range(6, 12), r.range(2.5, 4), 0xcfd0c6);
  }
}

// 茶園: rows of clipped tea bushes along the hillside south of the ravine, each row a rounded
// hedge following the ground, its top flushed with new leaves; the path passes through gaps.
function teaRows(m) {
  const r = m.rng;
  const dark = 0x1f301d,
    body = 0x2c4128,
    top = 0x3d5432,
    flush = 0x5f7646;
  for (let k = 0; k < 10; k++) {
    const z0 = 7.9 + k * 0.95,
      phase = r.range(0, 1);
    let run = null;
    const flushRun = () => {
      if (run && run.length > 1) {
        for (let i = 0; i < run.length - 1; i++) {
          const a = run[i],
            b = run[i + 1];
          for (let q = 0; q < a.pts.length - 1; q++)
            put(m, [a.pts[q], b.pts[q], b.pts[q + 1], a.pts[q + 1]], [a.col[q], b.col[q], b.col[q + 1], a.col[q + 1]]);
        }
        // Close both ends of the row.
        for (const end of [run[0], run[run.length - 1]]) put(m, end.pts, body, [end === run[0] ? -1 : 1, 0, 0]);
      }
      run = null;
    };
    for (let x = -24; x <= 24; x += 0.32) {
      const z = z0 + 0.25 * Math.sin(x * 0.21 + k) + 0.15 * noise(x * 0.3, k);
      if (z < lipS(x) + 0.9 || nearPath(x, z) || Math.abs(x) > 23.6 || noise(x * 0.45 + k * 7, k) > 0.8) {
        flushRun();
        continue;
      }
      // Each bush is about half a pace long; the row pinches a little between them.
      const lump = Math.pow(Math.abs(Math.sin((x / 0.56 + phase) * Math.PI)), 0.6),
        y = heightS(x, z),
        w = (0.25 + 0.05 * noise(x * 1.7, k * 3)) * (0.62 + 0.38 * lump),
        h = (0.3 + 0.08 * noise(x * 1.3 + 4, k * 2)) * (0.6 + 0.4 * lump);
      const prof = [
        [w, -0.05],
        [w * 1.02, h * 0.5],
        [w * 0.62, h * 0.92],
        [0, h],
        [-w * 0.62, h * 0.92],
        [-w * 1.02, h * 0.5],
        [-w, -0.05]
      ].map(([dz, dy], q) => {
        const j = q === 0 || q === 6 ? 0 : 0.035 * (noise(x * 5.3 + q * 1.7, k * 2.9 + q) - 0.5) * 2;
        return [x + j * 0.6, y + dy + j, z + dz * (1 + j * 1.5)];
      });
      const n = noise(x * 2.1, k * 1.3),
        crown = m.mix(top, flush, Math.max(0, n - 0.35) * 1.4),
        shade = 0.85 + 0.25 * lump;
      const col = [dark, body, top, crown, m.mix(top, crown, 0.5), body, dark].map((c) => (Array.isArray(c) ? c : m.rgb(c)).map((v) => v * shade));
      (run ||= []).push({ pts: prof, col });
    }
    flushRun();
  }
}

// Everything above in three models' worth: the near (ravine and ground), the life on it, and the far.
function ravine(m) {
  const north = pathPoints(NORTH),
    south = pathPoints(SOUTH);
  const topN = (line) => (p) => (line.kind === 'wall' ? -SHELF + 0.02 : heightN(p.x, p.z)),
    topS = (line) => (p) => (line.kind === 'wall' ? -SHELF + 0.02 : heightS(p.x, p.z));
  north.forEach((line, i) => face(m, line, topN(line), 11 + i * 50));
  south.forEach((line, i) => face(m, line, topS(line), 211 + i * 50));
  stream(m);
  fall(m);
}
function ravineLife(m) {
  const north = pathPoints(NORTH),
    south = pathPoints(SOUTH);
  north.forEach((line) => faceLife(m, line, line.kind === 'wall' ? () => -SHELF : (p) => heightN(p.x, p.z)));
  south.forEach((line) => faceLife(m, line, line.kind === 'wall' ? () => -SHELF : (p) => heightS(p.x, p.z)));
}
// The compound, and the court and terraces the house builds for itself, are not natural ground.
const inHouse = (x, z) => x > -10.95 && x < 13.8 && z > -19.65;
const onLanding = (x, z) => Math.abs(x) < 3.5 && z < 6.0;
function grounds(m) {
  land(m, lipN, -1, heightN, 40.5, inHouse, 3);
  land(m, lipS, 1, heightS, 18, onLanding, 7);
  hillPath(m);
}
function groundCover(m) {
  groundLife(m, heightN, [-22, 22, -22, 1.5], 18, (x, z) => inHouse(x, z) || Math.abs(x + 12.2) < 0.8 || Math.abs(x - 14.9) < 0.8 || z > lipN(x) - 0.3);
  teaRows(m);
  // Grass and small flowers thick about the head of the path, where the eye first falls.
  const r = m.rng;
  for (let i = 0; i < 120; i++) {
    const x = r.range(-9, 9),
      z = r.range(5.6, 9.5);
    if (z < lipS(x) + 0.15 || (Math.abs(x) < 3.6 && z < 6.15) || nearPath(x, z, 0.7)) continue;
    const y = heightS(x, z);
    if (i % 5 === 0) {
      const col = r.pick([0xe9e2c8, 0xd9b84a, 0xb88ac0]);
      m.tube([x, y, z], [x, y + 0.12, z], 0.006, 0.004, 0x5d7a45, 3);
      m.box(x, y + 0.13, z, 0.035, 0.02, 0.035, col);
    } else grassClump(m, x, y, z, r.range(0.12, 0.26), 6);
  }
  groundLife(m, heightS, [-24, 24, 6.2, 20], 60, (x, z) => z < lipS(x) + 0.3 || nearPath(x, z, 0.8));
}

export { ravine, ravineLife, grounds, groundCover, farHills, mistBanks, heightN, heightS, lipN, lipS, inHouse };
