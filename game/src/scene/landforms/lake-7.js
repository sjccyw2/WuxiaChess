import { Model, circle } from '../scenery-kit.js';
import {
  rgb,
  blend,
  smooth,
  waterLine,
  toViewer,
  wallRadius,
  wallFace,
  onWall,
  passageLights,
  drip
} from './kit-7.js';

// The black lake round the two grottoes of 寒玉石室: a skin of ice in the
// shallows and along the wall's foot, crazed with cracks and ridged where it
// has pushed against the rock, loose floes on the open water, stepping stones
// out to the side passages, fallen blocks, jade breaking up through the ice,
// and clumps of stalagmites. (The columns that meet the wall hang on it, in
// wall-7.js, so that they go when it goes.)

const ice = rgb(0x8fb3b6),
  snow = rgb(0xcfe2e2),
  deepIce = rgb(0x4f7a82),
  crack = rgb(0x1a2d33);
const sheetY = waterLine + 0.028;

// Jade clusters breaking up through the ice: x, z, size.
const iceJade = [
  [-9.6, -2.2, 0.5],
  [-10.1, 1.6, 0.42],
  [-3.2, -9.7, 0.46],
  [3.4, -9.8, 0.38],
  [9.7, -5.6, 0.44],
  [-8.4, 6.8, 0.36],
  [8.0, 1.4, 0.34],
  [-6.4, -9.9, 0.3],
  [10.3, -1.0, 0.3],
  [-10.6, -5.2, 0.28],
  [0.9, -10.6, 0.32],
  [6.6, -9.6, 0.26],
  [-11.2, 4.4, 0.3],
  [10.8, 3.2, 0.28]
];
function glowAt(x, z) {
  let g = 0;
  for (const [jx, jz, s] of iceJade) g += s * Math.exp(-((x - jx) ** 2 + (z - jz) ** 2) / 1.6);
  return Math.min(1, g * 1.6);
}
const jadeLight = rgb(0x6fd8b4);

// The skin of ice: a ragged sheet over the shallows, by cells.
function iceSheet(m, ground) {
  const step = 0.3,
    r = m.rng;
  const noise = (x, z) =>
    0.5 +
    0.3 * Math.sin(x * 1.7 + Math.sin(z * 1.3) * 1.5) * Math.sin(z * 1.9 - x * 0.6) +
    0.2 * Math.sin(x * 4.3 - z * 3.1);
  // How much ice wants to be at a point: thick by the shore and the wall,
  // breaking up into open water in between.
  const want = (x, z) => {
    const t = ground.terrain(x, z);
    if (t > sheetY - 0.01) return -1;
    const a = Math.atan2(z, x),
      toWall = wallRadius(a) - 1.05 - Math.hypot(x, z);
    if (toWall < 0.05) return -1;
    // The spring's outfall to the south stays open water.
    if (z > 7.4 && x > 0.4 && x < 3.9) return -1;
    const shore = 1 - smooth(0, 1, (-1.0 - t) / 0.75);
    const wall = 1 - smooth(0.2, 1.8, toWall);
    return Math.max(shore, wall * 0.85) - 0.3 - 0.25 * noise(x, z);
  };
  const N = Math.round(24 / step);
  const jitter = (i, j) => [
    -12 + i * step + 0.09 * Math.sin(i * 12.9898 + j * 78.233),
    -12 + j * step + 0.09 * Math.sin(i * 39.346 + j * 11.135)
  ];
  const colour = (x, z) => {
    const n = noise(x * 1.3, z * 1.3);
    let c = blend(deepIce, ice, 0.35 + 0.5 * n);
    c = blend(c, snow, 0.45 * smooth(0.62, 0.9, n));
    const g = glowAt(x, z);
    return c.map((v, k) => Math.min(1, v + jadeLight[k] * g * (0.3 + v)));
  };
  const edges = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const [x, z] = jitter(i, j);
      if (want(x + step / 2, z + step / 2) < 0.05) continue;
      const corners = [jitter(i, j), jitter(i + 1, j), jitter(i + 1, j + 1), jitter(i, j + 1)];
      const pts = corners.map(([u, v]) => [u, sheetY, v]);
      m.face(
        pts,
        corners.map(([u, v]) => colour(u, v))
      );
      // Remember the open sides, to give the sheet a broken edge.
      const open = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0]
      ];
      open.forEach(([di, dj], s) => {
        const [nx, nz] = jitter(i + di, j + dj);
        if (want(nx + step / 2, nz + step / 2) < 0.05) edges.push([pts[s], pts[(s + 1) % 4]]);
      });
    }
  // The broken edge: a pale lip with a thin wall dropping into the water.
  for (const [p, q] of edges) {
    const lo = (v) => [v[0], waterLine - 0.02, v[2]],
      up = (v) => [v[0], sheetY + 0.006, v[2]];
    m.face([up(p), up(q), lo(q), lo(p)], blend(ice, deepIce, 0.2 + 0.3 * r.next()));
  }
  // Cracks wandering across the sheet, and pressure ridges by the rock.
  for (let k = 0; k < 260; k++) {
    let x = r.range(-11.5, 11.5),
      z = r.range(-11.5, 11.5),
      heading = r.range(0, circle);
    if (want(x, z) < 0.15) continue;
    const ridge = r.next() < 0.18;
    const n = 3 + Math.floor(r.next() * 5);
    for (let j = 0; j < n; j++) {
      heading += r.range(-0.7, 0.7);
      const len = r.range(0.12, 0.35),
        qx = x + Math.cos(heading) * len,
        qz = z + Math.sin(heading) * len;
      if (want(qx, qz) < 0.1) break;
      const w = ridge ? 0.03 : 0.008 * (1 - j / (n + 1)) + 0.003;
      const nx = -Math.sin(heading) * w,
        nz = Math.cos(heading) * w;
      const y = sheetY + 0.003;
      if (ridge) {
        const h = r.range(0.02, 0.05);
        m.face([[x - nx, y, z - nz], [qx - nx, y, qz - nz], [qx, y + h, qz], [x, y + h, z]], ice);
        m.face([[x, y + h, z], [qx, y + h, qz], [qx + nx, y, qz + nz], [x + nx, y, z + nz]], snow);
      } else
        m.face(
          [
            [x - nx, y, z - nz],
            [qx - nx, y, qz - nz],
            [qx + nx, y, qz + nz],
            [x + nx, y, z + nz]
          ],
          crack
        );
      // Now and then a branch.
      if (!ridge && r.next() < 0.3) {
        const b = heading + r.range(0.6, 1.2) * (r.next() < 0.5 ? -1 : 1),
          bl = len * 0.6,
          bx = qx + Math.cos(b) * bl,
          bz = qz + Math.sin(b) * bl;
        m.face([[qx, y, qz], [bx, y, bz], [qx + nx * 0.6, y, qz + nz * 0.6]], crack);
      }
      x = qx;
      z = qz;
    }
  }
  return want;
}

// Loose plates of ice on the open water.
function floes(m, ground, want) {
  const r = m.rng;
  for (let k = 0; k < 90; k++) {
    const a = r.range(0, circle),
      rad = wallRadius(a) - r.range(1.6, 4.5),
      x = Math.cos(a) * rad,
      z = Math.sin(a) * rad;
    if (ground.terrain(x, z) > waterLine - 0.25 || want(x, z) > -0.12 || ground.margin(x, z) < 1.4)
      continue;
    // A jagged plate, thinner and darker than the shore ice, its broken
    // rim catching a little light.
    const s = r.range(0.1, 0.3),
      n = 7 + Math.floor(r.next() * 3),
      turn = r.range(0, circle),
      stretch = r.range(0.5, 0.9),
      top = [],
      low = [];
    for (let j = 0; j < n; j++) {
      const t = turn + (j * circle) / n,
        q = s * r.range(0.72, 1.08);
      const u = Math.cos(t) * q,
        v = Math.sin(t) * q * stretch;
      top.push([x + u * Math.cos(turn) - v * Math.sin(turn), sheetY + 0.006, z + u * Math.sin(turn) + v * Math.cos(turn)]);
      low.push([top[j][0], waterLine - 0.02, top[j][2]]);
    }
    const c = blend(deepIce, ice, r.range(0.3, 0.75));
    m.face(
      top.slice().reverse(),
      top
        .slice()
        .reverse()
        .map((p, j) => blend(c, deepIce, 0.25 * Math.sin(j * 1.3) ** 2))
    );
    for (let j = 0; j < n; j++) {
      const i = (j + 1) % n;
      m.face([top[j], top[i], low[i], low[j]], blend(c, snow, 0.25));
    }
  }
}

// Stalagmites in the lake, with their brood. The viewer's side keeps only a
// few low ones.
function dripstone(m, ground) {
  const r = m.rng;
  const stone = rgb(0x4d6667),
    pale = rgb(0xb3c8c0),
    wet = rgb(0x354a4d);
  for (let k = 0; k < 60; k++) {
    const a = r.range(0, circle),
      rad = wallRadius(a) - r.range(1.4, 4.4),
      x = Math.cos(a) * rad,
      z = Math.sin(a) * rad;
    if (ground.margin(x, z) < 1.7) continue;
    const facing = Math.cos(a) * toViewer[0] + Math.sin(a) * toViewer[1];
    if (facing > 0.3 && r.next() < 0.6) continue;
    const cap = facing > 0.3 ? 0.5 : facing > -0.1 ? 1.3 : 2.6;
    const n = 1 + Math.floor(r.next() * 5);
    // A clump: one old stalagmite and its younger brood, each standing on
    // the rock where it is dry and a hand's depth into the water elsewhere.
    for (let j = 0; j < n; j++) {
      const t = r.range(0, circle),
        d = j ? r.range(0.25, 0.7) : 0,
        px = x + Math.cos(t) * d,
        pz = z + Math.sin(t) * d;
      const ground0 = ground.terrain(px, pz),
        dry = ground0 > waterLine;
      const base = dry ? ground0 - 0.05 : waterLine - 0.06;
      const h = Math.min(cap, r.range(0.35, 1.1) * (j ? r.range(0.3, 0.7) : r.next() < 0.3 ? 2.3 : 1.2));
      const rr = (0.1 + h * r.range(0.12, 0.2)) * (j ? 0.8 : 1.15);
      const tone = blend(wet, stone, r.next());
      drip(m, [px, base, pz], h + (dry ? 0.05 : 0.06), rr, tone, blend(stone, pale, r.range(0.6, 0.95)), rr > 0.2 ? 8 : 6, r.range(-0.05, 0.05));
      // A collar of calcite and rime where it meets the water.
      if (!dry && !j)
        m.lathe(px, waterLine + 0.008, pz, [[0, rr * 1.25 + 0.04], [0.012, rr * 1.05 + 0.01], [0.02, rr * 0.92]], 0x7f9c96, 9);
    }
  }
}

// Stepping stones from the foot of each side passage's stair across the
// water to the nearest dry rock.
function steppingStones(m, ground) {
  const r = m.rng;
  for (const [a] of passageLights) {
    if (a === -1.62) continue;
    // The stair of the doorway ends about 1.8 in front of the wall.
    const back = onWall(a, 1.5, 0.06),
      [ix, , iz] = back.in;
    let d = 1.9;
    const at = (d) => [back.p[0] + ix * d, back.p[2] + iz * d];
    while (d < 8 && ground.terrain(...at(d)) < waterLine + 0.04) d += 0.1;
    const n = Math.round((d - 1.9) / 0.6);
    for (let k = 1; k <= n; k++) {
      const [x, z] = at(1.9 + ((d - 1.9) * k) / (n + 1)),
        jx = r.range(-0.15, 0.15),
        jz = r.range(-0.15, 0.15);
      const s = r.range(0.2, 0.27);
      m.rock(x + jx, waterLine - 0.3, z + jz, s, 0.38, s * 0.85, 0x4e6564, 0x9db2aa, 8, r.range(0, circle));
      m.lathe(x + jx, waterLine + 0.082, z + jz, [[0, s * 0.6], [0.01, s * 0.5]], 0xc5d8d4, 8);
    }
  }
}

// Blocks fallen from the vault, half drowned near the wall.
function fallenBlocks(m, ground) {
  const r = m.rng;
  for (let k = 0; k < 26; k++) {
    const a = r.range(0, circle),
      rad = wallRadius(a) - r.range(1.3, 2.6),
      x = Math.cos(a) * rad,
      z = Math.sin(a) * rad;
    if (ground.margin(x, z) < 1.4) continue;
    const facing = Math.cos(a) * toViewer[0] + Math.sin(a) * toViewer[1];
    const s = r.range(0.25, 0.6) * (facing > 0.3 ? 0.6 : 1);
    m.frame(
      x,
      waterLine - s * 0.35,
      z,
      r.range(0, circle),
      1,
      () => {
        m.box(0, 0, 0, s * 1.6, s, s * 1.1, 0x3d5455);
        m.box(0, s * 0.5 + 0.004, 0, s * 1.5, 0.012, s * 1.0, 0xbcd0cc);
        m.box(s * 0.35, s * 0.15, s * 0.551, s * 0.5, s * 0.12, 0.01, 0x6fa892);
      },
      r.range(-0.25, 0.25),
      r.range(-0.25, 0.25)
    );
  }
}

function jadeThroughIce(m) {
  const r = m.rng;
  m.glow(() => {
    for (const [x, z, s] of iceJade)
      for (let k = 0; k < 7; k++) {
        const yaw = r.range(0, circle),
          tilt = r.range(0.1, 0.7) * (k ? 1 : 0.3);
        const h = s * r.range(0.5, 1.3) * (k ? 1 : 1.5),
          w = s * r.range(0.1, 0.18);
        m.frame(
          x + r.range(-0.3, 0.3) * s,
          waterLine - 0.06,
          z + r.range(-0.3, 0.3) * s,
          yaw,
          1,
          () => m.crystal(0, 0, 0, w, h, 0x2f7d6e, 0x9fe4c8, 6, 0),
          tilt
        );
      }
  });
}

function lakeDressing(T, ground) {
  const m = new Model(T, 771905);
  const want = iceSheet(m, ground);
  floes(m, ground, want);
  dripstone(m, ground);
  steppingStones(m, ground);
  fallenBlocks(m, ground);
  jadeThroughIce(m);
  return m.finish('寒潭冰面與石筍', { occluder: true });
}

export { lakeDressing };
