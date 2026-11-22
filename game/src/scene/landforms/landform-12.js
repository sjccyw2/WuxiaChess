import { Model } from '../scenery-kit.js';
import { mapLayout } from '../../data/terrain.js';
import {
  TAU,
  flagstone,
  clamp,
  smooth,
  lerp,
  stone,
  wetStone,
  pebble,
  moss,
  river,
  cloth,
  timber,
  rope,
  hash,
  fbm,
  boulder,
  column,
  crag,
  pine,
  scrub,
  tuft,
  palm,
  blackBanner
} from './kit-12.js';
import {
  runLength,
  falls,
  level,
  poolLevel,
  width,
  pointAt,
  lowWater,
  lowerBoulders,
  pathX,
  gate,
  makeValley,
  layGround
} from './valley-12.js';
import { fallenTrunk } from './flora-12.js';
import { streamGround, inStream } from './stepping-12.js';
import {
  foamRings,
  lowerWater,
  cascadeLedges,
  chuteRock,
  cobbles,
  driftJams,
  cutBanks
} from './streambed-12.js';
import {
  gateMasonry,
  finial,
  guardHut,
  weaponRack,
  goodsPile,
  sandPan,
  ashlar
} from './gang-12.js';
import { fingers, standingFinger } from './peaks-12.js';
import { bankCover } from './banks-12.js';

// 鐵掌溪灘 only: the foot of 鐵掌山. A fast stream comes down the mountain's west skirt in
// steps, crosses the board from west to east and spills off its east edge into the widening
// river. North of the board the path climbs through a stone gate under the gang's black
// banners and between five tall crags; far behind stand the five peaks they echo, like the
// fingers of an open hand. The game's camera stands to the south-east, so the south and east
// sides are kept low and everything tall is north or west.

// ---------------------------------------------------------------------------------------
// The surroundings.

// Loose stone along both streams and about the banks, the trail's flat stones, boulders at
// every step of the water, drift logs on the bars.
function streamStones(m, valley, ground) {
  const r = m.rng,
    // Every stone the current breaks on, for the foam round it: [x, z, radius, water level].
    wetRocks = [];
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
  // The trail the party came up by: worn flags trodden into the south bank, two abreast where
  // it is wide, running up to the board's edge.
  for (let i = 0; i < 26; i++) {
    const z = 6.45 + i * 0.36,
      x = 0.4 + 0.9 * Math.sin(z * 0.35),
      off = i % 3 === 1 ? 0 : (i % 2 ? 1 : -1) * r.range(0.14, 0.24);
    if (r.next() < 0.12) continue;
    const px = x + off + r.range(-0.06, 0.06);
    flagstone(
      m,
      px,
      ground(px, z),
      z,
      r.range(0.22, 0.34),
      r.range(0.16, 0.24),
      r.range(-0.5, 0.5)
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
      const bx = x - tz * half * k + tx * back,
        bz = z + tx * half * k + tz * back;
      boulder(m, bx, foot, bz, rad, drop + 0.3 + r.range(0.2, 0.55), rad * r.range(0.75, 1), {
        wet: 0.5,
        green: Math.abs(k) > 0.9 ? 0.4 : 0,
        turn: r.range(0, TAU)
      });
    }
  }
  for (const [x, z, rad, h] of lowerBoulders) {
    if (x > 6.7) wetRocks.push([x, z, rad, lowWater]);
    boulder(m, x, lowWater - 0.5, z, rad, h, rad * r.range(0.75, 0.95), {
      wet: 0.5,
      turn: r.range(0, TAU),
      n: 9
    });
  }
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
    wetRocks.push([x - tz * half * s, z + tx * half * s, rad, level(u)]);
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
  // Trunks the floods stranded on the gravel.
  for (const [x, z, len, yaw, rad] of [
    [9.3, 2.3, 1.7, 0.25, 0.08],
    [10.7, -1.0, 1.4, -0.15, 0.07],
    [7.4, 4.6, 1.4, 1.1, 0.07],
    [-7.2, 2.7, 1.5, 0.5, 0.075]
  ])
    fallenTrunk(m, x, ground(x, z) - 0.02, z, len, yaw, rad, { roots: true });
  return wetRocks;
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
        // A deeper green channel runs down the middle of each pool.
        const deep = m.mix(
          m.mix(river.water, river.dark, hash(k + 0.5, Math.round(u * 3) + 0.5)),
          0x3c6a68,
          0.55 * (1 - s * s)
        );
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
      y = lowWater + 0.02;
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
  // Behind the gate five rock fingers stand in a row like the mountain's own five peaks (see
  // peaks-12.js), with crags at their feet; the path climbs between two of them.
  for (const [x, z, h, w, lean] of fingers) {
    standingFinger(m, ground, x, z, h, w, lean);
    for (let i = 0; i < 2; i++) {
      const a = r.range(0, TAU),
        d = w * r.range(0.9, 1.3),
        px = x + Math.cos(a) * d,
        pz = z + Math.sin(a) * d,
        y = ground(px, pz);
      crag(m, px, pz, y - 0.6, y + r.range(0.6, 1.3), w * 0.6, w * r.range(0.45, 0.6));
    }
  }
  // [x, z, height, breadth, how far its lesser blocks rise]
  for (const [x, z, h, w, lesser] of [
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
    gateMasonry(m);
    for (const s of [-1, 1]) {
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
    // The pole the banner hangs from under the lintel.
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
      finial(m, x, y + 4.3, z);
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
    // Each step a dressed block, worn pale and hollow along the middle where feet fall.
    const tread = m.mix(pebble[0], pebble[1], r.next()),
      span = r.range(0.8, 1.05);
    m.frame(x, ground(x, z), z, yaw, 1, () => {
      ashlar(m, 0, -0.02, 0, span, 0.16, 0.3, tread, 0.03);
      m.face(
        [
          [-span * 0.22, 0.065, -0.1],
          [-span * 0.3, 0.065, 0],
          [-span * 0.22, 0.065, 0.1],
          [span * 0.22, 0.065, 0.1],
          [span * 0.3, 0.065, 0],
          [span * 0.22, 0.065, -0.1]
        ],
        m.mix(tread, 0xd0c8b4, 0.3)
      );
    });
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
  // Two lesser pans for the novices, the guards' shelter, goods waiting to go up the mountain
  // and a rack of spears by the striking posts.
  sandPan(m, ground, -4.35, -6.75, 0.85);
  sandPan(m, ground, -2.3, -7.35, 0.75);
  guardHut(m, ground, -2.95, -8.6, 0.12);
  goodsPile(m, ground, -4.25, -8.05, 0.5);
  weaponRack(m, ground, 4.9, -6.65, -0.35);
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
    [-4.95, -7.35, 2.5, 0.8],
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
      boughs: 4,
      rich: false,
      spread: 1.35
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
  for (let i = 0; i < 200; i++) {
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

// Open ground on the banks: now and then a tuft of grass or a few washed stones in a corner
// of the tile, its middle left bare to stand on. The stepping stones need nothing more.
function bankEdges(m, p, cell) {
  if (inStream(cell)) return;
  const r = m.rng;
  for (const [x, z] of [
    [-0.4, -0.4],
    [0.4, -0.4],
    [0.4, 0.4],
    [-0.4, 0.4]
  ]) {
    const roll = r.next();
    if (roll < 0.22)
      tuft(m, x + r.range(-0.04, 0.04), 0.014, z + r.range(-0.04, 0.04), r.range(0.1, 0.16));
    else if (roll < 0.32)
      for (let i = 0; i < 3; i++)
        m.rock(
          x + r.range(-0.06, 0.06),
          0.008,
          z + r.range(-0.06, 0.06),
          r.range(0.025, 0.045),
          0.03,
          0.03,
          p[2],
          p[1],
          5
        );
  }
}

const tiles12 = {
  ground: streamGround,
  plain: bankEdges,
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
    far = new Model(T, 51307),
    cover = new Model(T, 51341);
  const ground = layGround(banks, mountain, valley);
  const wetRocks = streamStones(banks, valley, ground);
  cobbles(banks, valley, ground);
  driftJams(banks);
  cutBanks(banks, ground);
  footCrags(mountain, ground);
  highFall(mountain, ground);
  cascadeLedges(mountain);
  upperStream(water);
  brinkFall(water);
  lowerWater(water);
  foamRings(water, wetRocks);
  chuteRock(banks, ground);
  gangWorks(works, ground);
  cragPines(pines, valley, ground);
  lowGrowth(growth, valley, ground);
  bankCover(cover, valley, ground);
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
    cover.finish('兩岸草叢蘆葦與倒木', { occluder: true }),
    far.finish('五指峰遠景', { distant: true, cast: false })
  );
  return group;
}

export { landform12, tiles12 };
