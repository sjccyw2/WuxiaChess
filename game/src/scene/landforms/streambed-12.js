import {
  TAU,
  clamp,
  smooth,
  lerp,
  stone,
  wetStone,
  pebble,
  river,
  moss,
  barkLight,
  hash,
  column
} from './kit-12.js';
import {
  falls,
  level,
  width,
  pointAt,
  along,
  lowWater,
  lowerMid,
  lowerHalf,
  bars
} from './valley-12.js';
import { fallenTrunk } from './flora-12.js';

// 鐵掌溪灘's stream bed: the white water round every stone that stands in the current, the
// ledges each step of the upper stream pours over and the boil at their feet, the rock either
// side of the chute, the lower river's own water with its deep green channel, cobbles on its
// bars, jams of driftwood and the cut banks with roots hanging over the water.

const deep = 0x3c6a68,
  shallow = 0x5a8f93;

// Foam round a stone in the current. (fx, fz) is the way the water runs: the collar is broad
// on the upstream face, thin along the flanks, and a pale eddy trails off behind.
function foamRing(m, x, z, rad, y, fx, fz) {
  const r = m.rng,
    n = 12,
    white = m.rgb(river.foam),
    pale = m.mix(deep, river.foam, 0.45),
    faint = m.mix(deep, river.foam, 0.12);
  const inner = [],
    outer = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU,
      c = Math.cos(a),
      s = Math.sin(a),
      up = Math.max(0, -(c * fx + s * fz)),
      w = rad * (0.05 + 0.3 * up * up + r.range(0, 0.08));
    inner.push([x + c * rad * 0.98, y, z + s * rad * 0.98]);
    outer.push([x + c * (rad * 1.02 + w), y, z + s * (rad * 1.02 + w)]);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([inner[i], inner[j], outer[j], outer[i]], [white, white, pale, pale]);
  }
  // The eddy: a ragged tongue of pale water in the lee, split down its middle.
  const px = -fz,
    pz = fx,
    len = rad * r.range(1.5, 2.1);
  for (const s of [-1, 1]) {
    const a = [
        x + fx * rad * 0.9 + px * rad * 0.55 * s,
        y,
        z + fz * rad * 0.9 + pz * rad * 0.55 * s
      ],
      b = [x + fx * len * 0.55 + px * rad * 0.5 * s, y, z + fz * len * 0.55 + pz * rad * 0.5 * s],
      c = [x + fx * len + px * rad * 0.15 * s, y, z + fz * len + pz * rad * 0.15 * s],
      d = [x + fx * rad * 1.3, y, z + fz * rad * 1.3];
    m.face([a, b, c, d], [faint, faint, faint, pale]);
  }
}

// The water of the lower river from the foot of the chute to the edge of the world: a deep
// green channel down its middle, paler over the shallows by the banks and the bars, and white
// where it comes off the chute. Its edges run in under the banks.
function lowerWater(m) {
  const K = 12,
    rows = [];
  for (let x = 6.72; x < 30.5; x += x < 12 ? 0.35 : 0.8) {
    const mid = lowerMid(x),
      half = lowerHalf(x) + 0.18;
    rows.push(
      Array.from({ length: K + 1 }, (_, k) => {
        const s = (k / K) * 2 - 1,
          z = mid + s * half,
          depth = 1 - Math.abs(s) ** 1.6,
          churn = smooth(1 - (x - 6.72) / 1.6) * (0.6 + 0.4 * hash(k + 0.5, 3.3));
        let c = m.mix(shallow, deep, smooth(depth * 1.3 - 0.15));
        c = m.mix(
          c,
          m.mix(river.water, river.foam, 0.4),
          0.25 * hash(k * 1.3 + 0.5, Math.round(x * 2) + 0.5) * (1 - depth)
        );
        c = m.mix(c, river.foam, clamp(churn));
        return { p: [x, lowWater + 0.008, z], c };
      })
    );
  }
  for (let i = 1; i < rows.length; i++)
    for (let k = 0; k < K; k++) {
      const a = rows[i - 1],
        b = rows[i];
      m.face([a[k].p, a[k + 1].p, b[k + 1].p, b[k].p], [a[k].c, a[k + 1].c, b[k + 1].c, b[k].c]);
    }
  // Long pale streaks drawn out down the current.
  const r = m.rng;
  for (let i = 0; i < 40; i++) {
    const x = r.range(7.5, 22),
      s = r.range(-0.8, 0.8),
      z = lowerMid(x) + s * lowerHalf(x),
      len = r.range(0.6, 1.6),
      w = r.range(0.02, 0.05),
      y = lowWater + 0.014;
    m.face(
      [
        [x, y, z - w],
        [x + len * 0.4, y, z + w * 0.6],
        [x + len, y, z + r.range(-0.08, 0.08)]
      ],
      m.mix(deep, river.foam, r.range(0.3, 0.6))
    );
  }
}

// Each step of the upper stream pours over a ledge of jointed rock: blocks stand across its
// lip and break the fall into tongues of white water, and the water boils white at its foot.
function cascadeLedges(m) {
  const r = m.rng,
    foot = m.mix(stone.dark, wetStone, 0.7),
    body = m.mix(stone.mid, wetStone, 0.35),
    lit = m.mix(stone.pale, stone.mid, 0.4);
  for (const [at] of falls) {
    const [x, z, tx, tz] = pointAt(at - 0.06),
      half = width(at),
      upper = level(at + 0.2),
      lower = level(at - 0.4);
    for (let s = -0.92; s < 0.95; s += r.range(0.26, 0.42)) {
      const px = x - tz * half * s,
        pz = z + tx * half * s,
        rad = r.range(0.11, 0.2),
        topY = upper - r.range(0.0, 0.06) + (Math.abs(s) > 0.7 ? 0.08 : 0);
      column(m, px, lower - 0.25, pz, rad, topY - lower + 0.25, 5, foot, body, lit);
    }
    // The boil at the foot: low white humps across the pool and the spray hanging over them.
    for (let i = 0; i < 6; i++) {
      const u = at - r.range(0.25, 0.7),
        [bx, bz, bx2, bz2] = pointAt(u),
        s = r.range(-0.7, 0.7),
        w = width(u);
      m.rock(
        bx - bz2 * w * s,
        level(u) - 0.03,
        bz + bx2 * w * s,
        r.range(0.12, 0.24),
        r.range(0.05, 0.1),
        r.range(0.1, 0.18),
        river.spray,
        river.foam,
        6
      );
    }
    // Tongues of white falling between the blocks, just proud of the water's face.
    for (let i = 0; i < 5; i++) {
      const s = r.range(-0.8, 0.8),
        w = r.range(0.04, 0.09);
      const pts = [0.16, 0.06, -0.04, -0.16].map((du) => {
        const u = at + du,
          [cx, cz, ctx, ctz] = pointAt(u),
          h = width(at);
        return [
          cx - ctz * h * s,
          level(u) + 0.02 + 0.03 * Math.sin((du + 0.16) * 9.8),
          cz + ctx * h * s,
          ctx,
          ctz
        ];
      });
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay, az, atx, atz] = pts[k - 1],
          [bx, by, bz, btx, btz] = pts[k];
        m.face(
          [
            [ax - atz * w, ay, az + atx * w],
            [ax + atz * w, ay, az - atx * w],
            [bx + btz * w * 1.2, by, bz - btx * w * 1.2],
            [bx - btz * w * 1.2, by, bz + btx * w * 1.2]
          ],
          m.mix(river.spray, river.foam, 0.4 + 0.2 * k)
        );
      }
    }
  }
}

// The rock either side of the chute where the stream leaves the board, and low blocks in the
// chute itself that the water humps over.
function chuteRock(m, ground) {
  const r = m.rng,
    foot = m.mix(stone.dark, wetStone, 0.6),
    body = m.mix(stone.mid, stone.dark, 0.3),
    lit = m.mix(stone.pale, moss, 0.2);
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const x = 6.12 + i * 0.16 + r.range(-0.04, 0.04),
        z = side * (2.12 + r.range(0, 0.3)),
        y = Math.max(ground(x, z), lowWater),
        rad = r.range(0.14, 0.24);
      column(
        m,
        x,
        lowWater - 0.2,
        z,
        rad,
        y - lowWater + 0.2 + r.range(0.02, 0.12),
        5,
        foot,
        body,
        lit
      );
    }
  for (const z of [-1.0, -0.35, 1.05]) {
    const x = 6.34 + r.range(-0.04, 0.04);
    m.rock(x, -0.32, z, 0.12, 0.14, 0.1, foot, body, 6);
    foamRing(m, x, z, 0.1, -0.205, 0.85, 0);
  }
}

// Cobbles and pebbles thick on the lower river's bars and its strands, some dry and pale,
// some awash and dark.
function cobbles(m, valley, ground) {
  const r = m.rng;
  let placed = 0;
  for (let i = 0; i < 2600 && placed < 100; i++) {
    const x = r.range(6.6, 22),
      z = r.range(-6, 9),
      [e] = valley.reach(x, z),
      onBar = bars.some(([bx, bz, rx, rz]) => ((x - bx) / rx) ** 2 + ((z - bz) / rz) ** 2 < 1.1);
    if (!onBar && (e < -0.3 || e > 0.9)) continue;
    const y = ground(x, z);
    if (y < lowWater - 0.05) continue;
    const rad = r.range(0.035, 0.11),
      awash = y < lowWater + 0.04;
    m.rock(
      x,
      y - rad * 0.35,
      z,
      rad,
      rad * r.range(0.45, 0.8),
      rad * r.range(0.6, 0.9),
      awash ? m.mix(stone.dark, wetStone, 0.6) : r.pick([stone.mid, 0x6b6a62, stone.warm]),
      awash ? stone.mid : r.pick([pebble[0], pebble[1], 0xbdb6a4]),
      5,
      r.range(0, TAU)
    );
    placed++;
  }
}

// Driftwood jammed against boulders: trunks and branches laid across the current on the
// upstream face of a stone, where the floods left them, the lowest dark and awash.
function driftJams(m) {
  const r = m.rng;
  for (const [x, z, n, roots] of [
    [11.72, -1.85, 4, true],
    [9.82, 1.0, 3, false],
    [15.55, -1.4, 3, false]
  ]) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + r.range(-0.22, 0.22),
        len = r.range(0.8, 1.25),
        rad = r.range(0.05, 0.08);
      fallenTrunk(
        m,
        x - i * 0.1,
        lowWater - 0.07 + (i % 2) * 0.06,
        z + r.range(-0.1, 0.1),
        len,
        a,
        rad,
        {
          roots: roots && i === 0,
          wet: i < 2
        }
      );
    }
  }
}

// Cut banks along the outer bends of the lower river: a face of dark earth and stones from
// the water up to an overhanging lip of turf, with roots hanging out of it into the stream.
function cutBanks(m, ground) {
  const r = m.rng,
    soil = m.mix(0x5e5246, stone.dark, 0.25),
    soilLight = 0x7a6a56,
    turfLip = m.mix(0x5c6650, 0x6e6a48, 0.4);
  for (const [from, to, side] of [
    [8.4, 13.2, -1],
    [14.5, 19, 1]
  ]) {
    let last = null;
    for (let x = from; x <= to + 1e-6; x += 0.25) {
      const edge = lowerMid(x) + side * lowerHalf(x),
        zIn = edge - side * 0.04,
        zTop = edge + side * 0.32,
        zLip = edge + side * 0.22,
        top = ground(x, zTop) + 0.05,
        wobble = 0.03 * Math.sin(x * 5.3);
      const cur = {
        foot: [x, lowWater - 0.04, zIn + side * wobble],
        mid: [x, lerp(lowWater, top, 0.55), edge + side * (0.08 + wobble)],
        lip: [x, top + 0.02, zLip],
        back: [x, ground(x, edge + side * 0.6) + 0.015, edge + side * 0.6],
        tone: hash(x * 3.1, side + 0.5)
      };
      if (last) {
        const c0 = m.mix(soil, soilLight, last.tone * 0.5),
          c1 = m.mix(soil, soilLight, cur.tone * 0.5),
          wet = m.mix(soil, wetStone, 0.6);
        m.face([last.foot, cur.foot, cur.mid, last.mid], [wet, wet, c1, c0]);
        m.face(
          [last.mid, cur.mid, cur.lip, last.lip],
          [c0, c1, m.mix(c1, turfLip, 0.5), m.mix(c0, turfLip, 0.5)]
        );
        m.face([last.lip, cur.lip, cur.back, last.back], turfLip);
      }
      // Roots hanging from the lip, and stones showing in the face.
      if (r.next() < 0.55) {
        const k = r.range(0.1, 0.4);
        m.line(
          [
            cur.lip,
            [
              x + r.range(-0.05, 0.05),
              lerp(cur.lip[1], lowWater, 0.5),
              cur.mid[2] - side * k * 0.2
            ],
            [x + r.range(-0.08, 0.08), lowWater - 0.02, zIn - side * k * 0.3]
          ],
          r.range(0.008, 0.016),
          barkLight,
          3
        );
      }
      if (r.next() < 0.3)
        m.rock(
          x,
          cur.mid[1] - 0.04,
          cur.mid[2] - side * 0.03,
          0.05,
          0.06,
          0.04,
          stone.mid,
          stone.pale,
          5
        );
      last = cur;
    }
  }
}

// White water round every stone that stands in the current: `rocks` is [x, z, radius, water
// level] for each.
function foamRings(m, rocks) {
  for (const [x, z, rad, y] of rocks) {
    let fx = 1,
      fz = 0;
    if (x < -5) {
      // The upper stream runs back down its centre line, toward the board.
      const [, u] = along(x, z),
        [, , tx, tz] = pointAt(u);
      fx = -tx;
      fz = -tz;
    } else {
      const dz = lowerMid(x + 0.5) - lowerMid(x - 0.5);
      fx = 1 / Math.hypot(1, dz);
      fz = dz * fx;
    }
    foamRing(m, x, z, rad, y + 0.012, fx, fz);
  }
}

export { foamRing, foamRings, lowerWater, cascadeLedges, chuteRock, cobbles, driftJams, cutBanks };
