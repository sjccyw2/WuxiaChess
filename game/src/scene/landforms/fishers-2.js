// The fisherfolk of 蘆花汀: a thatched reed hut on stilts, a covered boat tied
// at a plank landing, a sampan poled into the mud, a sailing junk riding at
// anchor, a lifting net on the western bar and nets hung out to dry. Every
// post and hull is set on the relief it stands on, so nothing floats.
import { circle } from '../scenery-kit.js';
import { lantern } from '../maze-models.js';
import { reed } from './reeds-2.js';

const tide = -0.65;
const timber = 0x6d5d45,
  grey = 0x7d7360,
  plank = [0x8b7756, 0x96835f, 0x7f6c4f],
  thatch = [0x9c8a5f, 0xa8956a, 0x8f8160, 0xb19e70],
  rope = 0xab9c74,
  mat = [0x3d382f, 0x4a443a, 0x433d33],
  netCord = 0x6e5a44;

// A local frame on the ground: `at` maps local x, z to the world, `ground` reads
// the relief beneath a local point.
function site(x, z, yaw, surface) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  return { x, z, yaw, at, ground: (lx, lz) => surface(...at(lx, lz)) };
}
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// A post driven into the mud: wet and dark below the tide mark.
function pile(m, x, bottom, z, top, r, col = timber) {
  const mark = Math.min(top, tide + 0.07);
  if (bottom < mark) m.tube([x, bottom, z], [x, mark, z], r, r * 0.97, 0x4b4436, 6);
  m.tube([x, Math.max(bottom, mark), z], [x, top, z], r * 0.97, r * 0.9, col, 6);
}

// A sloping run of thatch laid in courses from eave to ridge. Each course
// laps over the next, so its lower edge stands proud.
function thatchSlope(m, eaveA, eaveB, ridgeB, ridgeA, courses = 4) {
  const r = m.rng;
  for (let c = 0; c < courses; c++) {
    const t0 = c / courses,
      t1 = (c + 1) / courses;
    const a0 = lerp(eaveA, ridgeA, t0),
      b0 = lerp(eaveB, ridgeB, t0);
    const a1 = lerp(eaveA, ridgeA, t1 + 0.05),
      b1 = lerp(eaveB, ridgeB, t1 + 0.05);
    const lip = 0.05;
    a0[1] += lip;
    b0[1] += lip;
    // Older straw near the ridge has greyed; the eaves stay golden.
    const tone = m.mix(r.pick(thatch), 0x8a8670, (c / courses) * 0.45);
    m.face([a0, b0, b1, a1], [tone, tone, m.mix(tone, 0x6e664c, 0.3), m.mix(tone, 0x6e664c, 0.3)]);
    // The butt ends of each course show as a darker, ragged step.
    const n = Math.max(2, Math.round(Math.hypot(b0[0] - a0[0], b0[2] - a0[2]) / 0.3));
    for (let k = 0; k < n; k++) {
      const p = lerp(a0, b0, k / n),
        q = lerp(a0, b0, (k + 1) / n),
        drop = 0.05 + r.range(0, 0.035);
      m.face(
        [p, q, [q[0], q[1] - drop, q[2]], [p[0], p[1] - drop, p[2]]],
        m.mix(tone, 0x5b5038, 0.45)
      );
    }
  }
}

// The fisher's hut: reed-mat walls under a heavy hipped thatch, raised on
// piles above the spring tides with a veranda toward the board.
function reedHut(m, surface) {
  const S = site(2.4545, -8.31, 0.09, surface),
    r = m.rng;
  const deck = 0.68;
  m.frame(S.x, 0, S.z, S.yaw, 1, () => {
    // Piles, braced in pairs.
    for (const lx of [-1.43, 0, 1.43])
      for (const lz of [-0.71, 0.71, 1.04]) {
        const g = S.ground(lx, lz) - 0.14;
        pile(m, lx, g, lz, deck - 0.06, lz > 1 ? 0.06 : 0.075);
      }
    for (const lz of [-0.71, 0.71])
      for (const [a, b] of [
        [-1.43, 0],
        [0, 1.43]
      ]) {
        m.tube([a, -0.25, lz + 0.06], [b, deck - 0.14, lz + 0.06], 0.022, 0.022, grey, 4);
        m.tube([b, -0.25, lz + 0.06], [a, deck - 0.14, lz + 0.06], 0.022, 0.022, grey, 4);
      }
    for (const lz of [-0.71, 0.71, 1.04]) m.box(0, deck - 0.09, lz, 3.1, 0.07, 0.09, 0x5f5240);
    // Deck boards run across the joists, a few of them warped or short.
    for (let k = 0; k < 16; k++) {
      const lz = -0.84 + k * 0.122,
        short = r.next() < 0.15 ? r.range(0.1, 0.3) : 0;
      m.box(short / 2, deck - 0.025, lz, 3.24 - short, 0.045, 0.112, r.pick(plank));
    }
    // Walls of reed bundles bound to bamboo rails.
    const y0 = deck,
      y1 = deck + 0.9,
      front = 0.43,
      back = -0.74,
      half = 1.32;
    m.box(0, (y0 + y1) / 2, (front + back) / 2, half * 2, y1 - y0, front - back, 0xa6925f);
    const strip = 0.09;
    for (let k = 0; k * strip < half * 2 - 1e-6; k++) {
      const x0 = -half + k * strip,
        x1 = Math.min(half, x0 + strip);
      const tone = k % 3 === 0 ? 0xb8a572 : k % 3 === 1 ? 0xa99766 : 0xc0ad7c;
      if (x1 > -0.18 && x0 < 0.38) continue;
      m.face(
        [
          [x0, y0, front + 0.012],
          [x1, y0, front + 0.012],
          [x1, y1 + r.range(-0.02, 0.03), front + 0.012],
          [x0, y1 + r.range(-0.02, 0.03), front + 0.012]
        ],
        [m.rgb(tone), m.rgb(tone), m.mix(tone, 0xd4c495, 0.4), m.mix(tone, 0xd4c495, 0.4)]
      );
    }
    for (const side of [-1, 1])
      for (let k = 0; k * strip < front - back - 1e-6; k++) {
        const z0 = back + k * strip,
          z1 = Math.min(front, z0 + strip),
          tone = k % 2 ? 0xa18f60 : 0xb3a06e;
        m.face(
          [
            [side * (half + 0.012), y0, z0],
            [side * (half + 0.012), y0, z1],
            [side * (half + 0.012), y1, z1],
            [side * (half + 0.012), y1, z0]
          ],
          tone
        );
      }
    for (const y of [y0 + 0.14, y0 + 0.5, y1 - 0.08])
      m.tube(
        [-half - 0.03, y, front + 0.03],
        [half + 0.03, y, front + 0.03],
        0.016,
        0.016,
        0x7a6a49,
        5
      );
    for (const x of [-half, half])
      m.tube([x, y0, front + 0.02], [x, y1 + 0.1, front + 0.02], 0.04, 0.035, timber, 6);
    // The doorway faces the stair; its reed blind is rolled up.
    m.face(
      [
        [-0.18, y0 + 0.02, front + 0.008],
        [0.38, y0 + 0.02, front + 0.008],
        [0.38, y0 + 0.78, front + 0.008],
        [-0.18, y0 + 0.78, front + 0.008]
      ],
      0x2c2822
    );
    for (const x of [-0.19, 0.39])
      m.tube([x, y0, front + 0.03], [x, y1 + 0.02, front + 0.03], 0.03, 0.028, timber, 5);
    m.tube(
      [-0.24, y0 + 0.8, front + 0.06],
      [0.44, y0 + 0.8, front + 0.06],
      0.045,
      0.045,
      0xb6a676,
      6
    );
    // A window with a mat shutter propped open.
    m.face(
      [
        [-1.0, y0 + 0.36, front + 0.014],
        [-0.6, y0 + 0.36, front + 0.014],
        [-0.6, y0 + 0.66, front + 0.014],
        [-1.0, y0 + 0.66, front + 0.014]
      ],
      0x2f2b24
    );
    for (const x of [-0.92, -0.8, -0.68])
      m.tube([x, y0 + 0.36, front + 0.03], [x, y0 + 0.66, front + 0.03], 0.012, 0.012, 0x8f7d57, 4);
    m.face(
      [
        [-1.04, y0 + 0.68, front + 0.03],
        [-0.56, y0 + 0.68, front + 0.03],
        [-0.56, y0 + 0.62, front + 0.33],
        [-1.04, y0 + 0.62, front + 0.33]
      ],
      0x8e7c52
    );
    m.tube([-0.8, y0 + 0.36, front + 0.04], [-0.8, y0 + 0.62, front + 0.3], 0.01, 0.01, timber, 4);
    // A straw rain cape and a bamboo hat hang beside the door.
    m.frame(0.8, y0 + 0.62, front + 0.04, 0, 1, () => {
      for (let k = 0; k < 7; k++) {
        const a = -0.21 + k * 0.07;
        m.face(
          [
            [a * 0.6, 0, 0],
            [(a + 0.07) * 0.6, 0, 0],
            [(a + 0.07) * 1.1, -0.42 - r.range(0, 0.05), 0.03],
            [a * 1.1, -0.42 - r.range(0, 0.05), 0.03]
          ],
          k % 2 ? 0x8a7a52 : 0x97875c
        );
      }
    });
    m.lathe(
      1.08,
      y0 + 0.55,
      front + 0.07,
      [
        [0, 0.17],
        [0.03, 0.15],
        [0.09, 0.05],
        [0.11, 0]
      ],
      0xb59f6c,
      10
    );
    // Veranda posts, rail and the hip-roofed thatch.
    for (const x of [-1.5, 1.5]) m.tube([x, deck, 1.0], [x, 1.66, 1.0], 0.045, 0.04, timber, 6);
    m.box(0, 1.64, 1.0, 3.15, 0.07, 0.08, 0x5f5240);
    for (const x of [-1.5, -1.0, -0.5, 0.65, 1.1, 1.5])
      m.tube([x, deck, 1.02], [x, deck + 0.34, 1.02], 0.022, 0.02, 0x8b7a58, 5);
    m.tube([-1.5, deck + 0.32, 1.02], [-0.5, deck + 0.32, 1.02], 0.02, 0.02, 0x8b7a58, 5);
    m.tube([0.65, deck + 0.32, 1.02], [1.5, deck + 0.32, 1.02], 0.02, 0.02, 0x8b7a58, 5);
    for (const side of [-1, 1]) {
      m.tube(
        [side * 1.58, deck + 0.32, 0.5],
        [side * 1.58, deck + 0.32, 1.02],
        0.02,
        0.02,
        0x8b7a58,
        5
      );
      m.tube([side * 1.58, deck, 0.5], [side * 1.58, deck + 0.34, 0.5], 0.022, 0.02, 0x8b7a58, 5);
    }
    const ey = 1.6,
      E = [
        [-1.9, ey, -1.12],
        [1.9, ey, -1.12],
        [1.9, ey, 1.28],
        [-1.9, ey, 1.28]
      ];
    const R = [
      [-0.72, 2.74, 0.08],
      [0.72, 2.74, 0.08]
    ];
    thatchSlope(m, E[3], E[2], R[1], R[0], 5);
    thatchSlope(m, E[1], E[0], R[0], R[1], 5);
    thatchSlope(m, E[2], E[1], R[1], R[1], 4);
    thatchSlope(m, E[0], E[3], R[0], R[0], 4);
    // Thickness at the eave, then a ragged fringe of straw ends.
    for (let k = 0; k < 4; k++) {
      const a = E[k],
        b = E[(k + 1) % 4];
      m.face([a, b, [b[0], b[1] - 0.13, b[2]], [a[0], a[1] - 0.13, a[2]]], 0x7d6f4e);
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]),
        n = Math.round(len / 0.09);
      for (let j = 0; j < n; j++) {
        const p = lerp(a, b, (j + 0.5) / n),
          out = [
            Math.sign(p[0]) * (Math.abs(p[0]) > 1.85 ? 0.04 : 0),
            0,
            Math.abs(p[2] - 0.08) > 1.1 ? Math.sign(p[2] - 0.08) * 0.04 : 0
          ];
        const dx = (b[0] - a[0]) / len,
          dz = (b[2] - a[2]) / len;
        m.face(
          [
            [p[0] - dx * 0.05, p[1] - 0.1, p[2] - dz * 0.05],
            [p[0] + dx * 0.05, p[1] - 0.1, p[2] + dz * 0.05],
            [p[0] + out[0] + r.range(-0.02, 0.02), p[1] - 0.17 - r.range(0, 0.06), p[2] + out[2]]
          ],
          r.pick([0x8e7d55, 0x9d8b5e, 0x857550])
        );
      }
    }
    // Ridge bundle with its bindings.
    m.tube([-0.86, 2.72, 0.08], [0.86, 2.72, 0.08], 0.1, 0.1, 0x7f7150, 7);
    for (const x of [-0.6, -0.2, 0.2, 0.6]) m.hoop(x, 2.72, 0.08, 0.11, 0.012, 0x5c5039, 8, 'yz');
    for (const side of [-1, 1])
      for (let j = 0; j < 4; j++)
        m.leaf(
          [side * 0.82, 2.72, 0.08],
          [side * (1.0 + j * 0.03), 2.84 + j * 0.03, 0.08 + (j - 1.5) * 0.08],
          0.03,
          0x9a8758,
          0xb09d6a,
          0.02
        );
    // Dried fish strung under the eave, baskets and a jar on the boards.
    m.tube([-1.4, 1.5, 1.18], [-0.35, 1.5, 1.18], 0.008, 0.008, rope, 4);
    for (let j = 0; j < 6; j++) {
      const x = -1.3 + j * 0.18;
      m.leaf([x, 1.49, 1.18], [x + 0.01, 1.25, 1.2], 0.04, 0x8a7a62, 0xa8977a, 0.01);
    }
    m.lathe(
      1.15,
      deck,
      0.75,
      [
        [0, 0.1],
        [0.08, 0.16],
        [0.22, 0.17],
        [0.3, 0.12],
        [0.33, 0.13]
      ],
      0x96804f,
      9
    );
    m.lathe(
      0.88,
      deck,
      0.6,
      [
        [0, 0.07],
        [0.12, 0.13],
        [0.24, 0.1],
        [0.3, 0.06],
        [0.33, 0.07]
      ],
      0x6c5f4c,
      9
    );
    m.tube([1.55, deck, 0.2], [1.25, deck + 1.0, 0.24], 0.02, 0.018, 0x8b7a58, 5);
    m.face(
      [
        [1.55, deck, 0.2],
        [1.61, deck + 0.3, 0.2],
        [1.5, deck + 0.3, 0.2],
        [1.47, deck, 0.2]
      ],
      0x8b7a58
    );
    lantern(m, 1.45, 1.3, 1.1, 0.55, 0xc86a3d);
    // A net hung over the east rail, falling in folds.
    netSheet(m, [1.6, deck + 0.33, 0.55], [1.6, deck + 0.33, 1.0], -0.5, 0.06, 6);
  });
}

// A hanging net: a row of drops from a rail, each cord sagging between knots.
function netSheet(m, a, b, drop, swing, cols) {
  const r = m.rng;
  const rows = 4,
    pts = [];
  for (let i = 0; i <= cols; i++) {
    const top = lerp(a, b, i / cols),
      col = [];
    for (let j = 0; j <= rows; j++) {
      const t = j / rows;
      col.push([
        top[0] + swing * Math.sin(i * 1.7 + j) * t + r.range(-0.01, 0.01),
        top[1] + drop * t * (0.85 + 0.15 * Math.sin(i * 2.3)),
        top[2] + swing * 0.5 * Math.cos(i * 1.3) * t
      ]);
    }
    pts.push(col);
  }
  // Tanned mesh, bark-brown, with the darker cords standing out.
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++)
      m.face(
        [pts[i][j], pts[i + 1][j], pts[i + 1][j + 1], pts[i][j + 1]].map((p, k, all) => {
          // Each panel is drawn a little smaller than its cell: the gaps read as mesh.
          const c = all.reduce((s, q) => s.map((v, n) => v + q[n] / 4), [0, 0, 0]);
          return p.map((v, n) => c[n] + (v - c[n]) * 0.72);
        }),
        (i + j) % 2 ? 0xa48667 : 0xae9271
      );
  for (let i = 0; i <= cols; i++) m.line(pts[i], 0.006, netCord, 3);
  for (let j = 0; j <= rows; j++)
    m.line(
      pts.map((c) => c[j]),
      0.006,
      netCord,
      3
    );
}

// A boat hull: flat-bottomed, with rocker and a rising sheer. `beam` is the
// half breadth; the hull is drawn with its waterline at y = 0, bow toward +z.
function hull(
  m,
  length,
  beam,
  { depth = 0.2, sheer = 0.16, tone = 0x7a6448, inside = 0x8f7655, keel = 0x4c4033 } = {}
) {
  const rings = [],
    n = 10;
  for (let j = 0; j <= n; j++) {
    const u = -1 + (2 * j) / n,
      w = beam * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.4)), 0.55) + 0.04,
      top = 0.16 + sheer * u * u,
      bottom = -depth + 0.13 * u * u * u * u + 0.05 * u * u;
    const z = (u * length) / 2;
    rings.push([
      [-w, top, z],
      [-w * 0.92, (top + bottom) / 2 + 0.02, z],
      [-w * 0.7, bottom, z],
      [w * 0.7, bottom, z],
      [w * 0.92, (top + bottom) / 2 + 0.02, z],
      [w, top, z]
    ]);
  }
  for (let j = 0; j < n; j++) {
    const a = rings[j],
      b = rings[j + 1];
    for (let k = 0; k < 5; k++) {
      const col = k === 2 ? keel : k === 0 || k === 4 ? tone : m.mix(tone, 0x3d342a, 0.35);
      m.face([a[k], b[k], b[k + 1], a[k + 1]], col);
    }
    // Floor boards and the inner face of the planking.
    m.face(
      [
        [a[1][0] * 0.95, a[2][1] + 0.06, a[0][2]],
        [b[1][0] * 0.95, b[2][1] + 0.06, b[0][2]],
        [b[4][0] * 0.95, b[2][1] + 0.06, b[0][2]],
        [a[4][0] * 0.95, a[2][1] + 0.06, a[0][2]]
      ],
      inside
    );
    for (const k of [0, 5]) m.tube(a[k], b[k], 0.022, 0.022, 0x5a4a37, 4);
  }
  // Square end boards at bow and stern.
  for (const end of [rings[0], rings[n]]) m.face(end, 0x6d5a42);
}

// An arched mat awning of split bamboo, with lighter hoops at its ends.
function awning(m, z0, z1, w, h, base, tones = mat) {
  const n = 7,
    arc = (z, s) =>
      Array.from({ length: n + 1 }, (_, i) => {
        const a = Math.PI * (i / n);
        return [-Math.cos(a) * w * s, base + Math.sin(a) * h * s, z];
      });
  const bands = 3;
  for (let b = 0; b < bands; b++) {
    const za = z0 + ((z1 - z0) * b) / bands,
      zb = z0 + ((z1 - z0) * (b + 1)) / bands;
    const A = arc(za, 1),
      B = arc(zb, 1);
    for (let i = 0; i < n; i++)
      m.face([A[i], B[i], B[i + 1], A[i + 1]], tones[(b + i) % tones.length]);
  }
  for (const z of [z0, z1]) m.line(arc(z, 1.02), 0.016, 0x8a7a55, 4);
}

// The covered boat tied alongside the landing.
function coveredBoat(m, x, z, yaw) {
  m.frame(x, tide, z, yaw, 1, () => {
    hull(m, 2.7, 0.36, { depth: 0.2 });
    for (const zz of [-0.95, -0.15, 0.75]) m.box(0, 0.12, zz, 0.62, 0.035, 0.1, 0x8f7655);
    awning(m, -0.55, 0.2, 0.36, 0.38, 0.14);
    awning(m, 0.18, 0.5, 0.39, 0.4, 0.13, [0x524a3d, 0x5e5545]);
    // Sculling oar trailing astern, punt pole along the gunwale.
    m.tube([0.05, 0.28, -1.2], [0.32, -0.08, -2.35], 0.022, 0.018, 0x8b7553, 5);
    m.face(
      [
        [0.29, -0.03, -2.25],
        [0.4, -0.02, -2.3],
        [0.37, -0.12, -2.62],
        [0.27, -0.12, -2.56]
      ],
      0x8b7553
    );
    m.tube([-0.33, 0.24, -1.25], [-0.3, 0.34, 1.45], 0.015, 0.012, 0x9f8d62, 5);
    m.lathe(
      0.12,
      0.08,
      0.9,
      [
        [0, 0.06],
        [0.1, 0.11],
        [0.2, 0.1],
        [0.25, 0.06],
        [0.28, 0.07]
      ],
      0x9a8455,
      8
    );
    m.lathe(
      -0.12,
      0.08,
      -0.85,
      [
        [0, 0.17],
        [0.03, 0.15],
        [0.08, 0.05],
        [0.1, 0]
      ],
      0xb59f6c,
      9
    );
  });
}

// A small open sampan held by its punt pole driven into the mud.
function sampan(m, surface, x, z, yaw) {
  const S = site(x, z, yaw, surface);
  m.frame(x, tide, z, yaw, 1, () => {
    hull(m, 2.0, 0.3, { depth: 0.16, sheer: 0.12, tone: 0x80694b });
    for (const zz of [-0.5, 0.35]) m.box(0, 0.11, zz, 0.5, 0.03, 0.09, 0x8f7655);
    m.lathe(
      0.0,
      0.06,
      -0.1,
      [
        [0, 0.08],
        [0.1, 0.13],
        [0.22, 0.13],
        [0.28, 0.08],
        [0.31, 0.09]
      ],
      0x9a8455,
      8
    );
    m.lathe(
      0.12,
      0.06,
      0.15,
      [
        [0, 0.06],
        [0.08, 0.1],
        [0.18, 0.09],
        [0.22, 0.05],
        [0.24, 0.06]
      ],
      0x8a744c,
      8
    );
  });
  const [px, pz] = S.at(0.42, 1.0);
  const g = surface(px, pz);
  m.tube([px, g - 0.2, pz], [px - 0.12, 1.15, pz + 0.1], 0.022, 0.017, 0x9f8d62, 5);
  const [bx, bz] = S.at(0, 1.0);
  m.line(
    [
      [bx, tide + 0.28, bz],
      [px - 0.04, tide + 0.45, pz + 0.03]
    ],
    0.008,
    rope,
    3
  );
}

// The plank landing at the south-east corner, and the covered boat at it.
function landing(m, surface) {
  const x = 4.7,
    z0 = 6.53,
    z1 = 8.55,
    top = -0.04;
  const r = m.rng;
  for (const dx of [-0.31, 0.31])
    m.box(x + dx, top - 0.07, (z0 + z1) / 2, 0.07, 0.07, z1 - z0, 0x5f5240);
  for (let zz = z0 + 0.06; zz < z1; zz += 0.125) {
    const w = 0.78 + r.range(-0.04, 0.04);
    m.frame(x + r.range(-0.015, 0.015), top - 0.02, zz, r.range(-0.03, 0.03), 1, () =>
      m.box(0, 0, 0, w, 0.04, 0.115, r.pick(plank))
    );
  }
  for (let zz = z0 + 0.35; zz < z1 + 0.01; zz += 0.66)
    for (const dx of [-0.36, 0.36]) {
      const g = surface(x + dx, zz) - 0.2;
      pile(m, x + dx, g, zz, zz > z1 - 0.5 ? 0.42 : top - 0.06, zz > z1 - 0.5 ? 0.06 : 0.05);
    }
  // A coil of rope on the boards and the mooring line to the boat.
  m.hoop(x - 0.12, top + 0.012, z1 - 0.3, 0.1, 0.014, rope, 10);
  m.hoop(x - 0.12, top + 0.03, z1 - 0.3, 0.07, 0.014, rope, 10);
  m.line(
    [
      [x + 0.36, 0.3, z1 - 0.32],
      [x + 0.62, tide + 0.12, z1 - 0.1],
      [x + 0.86, tide + 0.34, z1 + 0.2]
    ],
    0.009,
    rope,
    3
  );
  coveredBoat(m, x + 0.86, z1 - 0.95, -0.04);
}

// The lifting net (扳罾) on the western bar: a tripod sheers a long lever, and
// four bowed bamboo arms spread the net, half raised out of the shallows.
function liftingNet(m, surface) {
  const S = site(-7.7, 3.05, 0.12, surface);
  m.frame(S.x, 0, S.z, S.yaw, 1, () => {
    const apex = [0, 1.55, 0.25];
    for (const [lx, lz] of [
      [-0.45, -0.25],
      [0.45, -0.25],
      [0, 0.55]
    ]) {
      const g = S.ground(lx, lz);
      m.tube(
        [lx, g - 0.12, lz],
        [apex[0] + lx * 0.08, apex[1] + 0.12, apex[2] + lz * 0.06],
        0.045,
        0.035,
        timber,
        6
      );
    }
    m.hoop(apex[0], apex[1], apex[2], 0.07, 0.015, rope, 8);
    // The lever: a stone tied at the short end balances the wet net.
    const back = [0, 0.32 + S.ground(0, -1.25), -1.25],
      hub = [0, 1.75, 2.05];
    m.tube(back, hub, 0.05, 0.035, 0x8d7b55, 6);
    m.rock(back[0], back[1] - 0.24, back[2] - 0.06, 0.16, 0.2, 0.13, 0x6e6c5c, 0x8f8b76, 7);
    m.line([back, [back[0], back[1] - 0.1, back[2] - 0.05]], 0.012, rope, 3);
    const centre = [0, tide - 0.05, 2.4],
      corners = [];
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ]) {
      const tip = [centre[0] + sx * 0.95, tide + 0.42, centre[2] + sz * 0.95];
      const bend = lerp(hub, tip, 0.5);
      bend[0] += sx * 0.18;
      bend[2] += sz * 0.18;
      bend[1] += 0.12;
      m.line([hub, bend, tip], 0.022, 0x9b8a5f, 5);
      corners.push(tip);
    }
    m.line([hub, [hub[0], hub[1] + 0.2, hub[2]]], 0.012, rope, 3);
    // The mesh sags from the corners into the water.
    const P = (u, v) => {
      const a = lerp(lerp(corners[0], corners[1], u), lerp(corners[3], corners[2], u), v);
      const sag = 4 * u * (1 - u) * 4 * v * (1 - v);
      return [a[0], a[1] - sag * 0.62, a[2]];
    };
    const k = 8;
    for (let i = 0; i <= k; i++) {
      const row = [],
        col = [];
      for (let j = 0; j <= k; j++) {
        row.push(P(i / k, j / k));
        col.push(P(j / k, i / k));
      }
      for (const line of [row, col])
        for (let j = 1; j < line.length; j++)
          if (line[j][1] > tide + 0.005 || line[j - 1][1] > tide + 0.005)
            m.tube(line[j - 1], line[j], 0.007, 0.007, netCord, 3);
    }
    // The fisher's plank stand at the water's edge, and his basket.
    for (const [lx, lz] of [
      [0.35, 0.75],
      [0.95, 0.75],
      [0.35, 1.15],
      [0.95, 1.15]
    ])
      pile(m, lx, S.ground(lx, lz) - 0.15, lz, -0.3, 0.035);
    for (let j = 0; j < 4; j++) m.box(0.65, -0.28, 0.72 + j * 0.15, 0.7, 0.035, 0.13, plank[j % 3]);
    m.lathe(
      0.75,
      -0.26,
      1.0,
      [
        [0, 0.07],
        [0.1, 0.12],
        [0.2, 0.11],
        [0.26, 0.07],
        [0.29, 0.08]
      ],
      0x96804f,
      8
    );
  });
}

// Nets hung to dry on pole trestles along the southern bar, and an old
// sampan turned over on blocks for caulking, its tar pot beside it.
function dryingGround(m, surface) {
  const r = m.rng,
    trestles = [
      [2.15, 8.75],
      [2.75, 8.15],
      [3.35, 7.55]
    ];
  const tops = [];
  for (const [x, z] of trestles) {
    const g = surface(x, z);
    for (const s of [-1, 1]) {
      const fx = x + s * 0.22 * 0.7,
        fz = z + s * 0.22 * 0.7;
      m.tube(
        [fx, surface(fx, fz) - 0.1, fz],
        [x - s * 0.04, g + 1.1, z - s * 0.04],
        0.025,
        0.02,
        0x8d7b55,
        5
      );
    }
    tops.push([x, g + 1.08, z]);
  }
  m.line(
    [
      [tops[0][0] - 0.25, tops[0][1] + 0.02, tops[0][2] + 0.25],
      ...tops,
      [tops[2][0] + 0.25, tops[2][1] - 0.02, tops[2][2] - 0.25]
    ],
    0.02,
    0x9f8d62,
    5
  );
  // The net hangs on both sides of the pole, longer on the windward side.
  for (let i = 0; i < 2; i++) {
    const a = tops[i],
      b = tops[i + 1];
    for (const side of [-1, 1]) {
      const off = [side * 0.12 * 0.7, 0, -side * 0.12 * 0.7];
      netSheet(
        m,
        [a[0] + off[0], a[1], a[2] + off[2]],
        [b[0] + off[0], b[1], b[2] + off[2]],
        side > 0 ? -0.82 : -0.62,
        side * 0.12,
        5
      );
    }
  }
  // Floats strung along the head rope.
  for (let j = 0; j < 7; j++) {
    const p = lerp(tops[0], tops[2], j / 6);
    m.lathe(
      p[0],
      p[1] - 0.06,
      p[2],
      [
        [0, 0.02],
        [0.03, 0.045],
        [0.07, 0.04],
        [0.09, 0]
      ],
      0xb48a52,
      6
    );
  }
  // An old sampan hauled up on chocks for caulking, heeled onto one bilge.
  const x = 1.6,
    z = 8.45,
    yaw = 2.35,
    g = surface(x, z);
  for (const d of [-0.5, 0.5]) {
    const bx = x + Math.sin(yaw) * d,
      bz = z + Math.cos(yaw) * d;
    m.frame(bx, surface(bx, bz) + 0.03, bz, yaw, 1, () => m.box(0, 0, 0, 0.5, 0.1, 0.14, 0x6a5b45));
  }
  m.frame(
    x,
    g + 0.2,
    z,
    yaw,
    1,
    () =>
      hull(m, 1.7, 0.27, {
        depth: 0.15,
        sheer: 0.1,
        tone: 0x8a7a60,
        inside: 0x9a8562,
        keel: 0x5c4f3e
      }),
    0,
    0.28
  );
  m.lathe(
    x + 0.55,
    surface(x + 0.55, z - 0.45),
    z - 0.45,
    [
      [0, 0.07],
      [0.13, 0.1],
      [0.17, 0.09],
      [0.18, 0]
    ],
    0x3b352d,
    8
  );
  m.tube(
    [x + 0.55, surface(x + 0.55, z - 0.45) + 0.16, z - 0.45],
    [x + 0.75, surface(x + 0.55, z - 0.45) + 0.42, z - 0.52],
    0.012,
    0.01,
    0x8d7b55,
    4
  );
  // Baskets and a coil of rope dropped on the sand.
  for (const [bx, bz, s] of [
    [3.05, 8.45, 1],
    [2.45, 7.75, 0.8]
  ])
    m.lathe(
      bx,
      surface(bx, bz) - 0.02,
      bz,
      [
        [0, 0.1 * s],
        [0.08 * s, 0.15 * s],
        [0.2 * s, 0.14 * s],
        [0.27 * s, 0.09 * s],
        [0.3 * s, 0.1 * s]
      ],
      0x96804f,
      8
    );
  m.hoop(3.45, surface(3.45, 8.1) + 0.015, 8.1, 0.11, 0.015, rope, 10);
  m.hoop(3.45, surface(3.45, 8.1) + 0.035, 8.1, 0.07, 0.015, rope, 10);
  r.next();
}

// The sailing junk at anchor north of the hut: battened lug sail half
// lowered, a mat cabin aft, rudder and anchor rope.
function junk(m) {
  m.frame(5.65, tide, -9.45, -0.48, 1, () => {
    hull(m, 3.5, 0.5, { depth: 0.26, sheer: 0.22, tone: 0x6c5840 });
    awning(m, -1.3, -0.45, 0.48, 0.42, 0.2, [0x8a7650, 0x96825a, 0x7f6d4b]);
    for (const zz of [-0.2, 0.55, 1.15]) m.box(0, 0.18, zz, 0.85, 0.04, 0.1, 0x8f7655);
    m.tube([0, -0.1, 0.45], [0, 2.75, 0.4], 0.055, 0.03, 0x7b6646, 7);
    // The sail: panels between bamboo battens, bellied a little and patched.
    const P = (u, t) => [
      0.06 + 0.12 * Math.sin(Math.PI * u) * (0.6 + t),
      0.85 + t * 1.65 - 0.25 * u,
      0.82 - u * 1.55 + 0.28 * t
    ];
    const rows = 5,
      cols = 3;
    for (let j = 0; j < rows; j++)
      for (let k = 0; k < cols; k++)
        m.face(
          [
            P(k / cols, j / rows),
            P((k + 1) / cols, j / rows),
            P((k + 1) / cols, (j + 1) / rows),
            P(k / cols, (j + 1) / rows)
          ],
          (j * 3 + k) % 5 === 2 ? 0x7f6646 : j % 2 ? 0xa48660 : 0x9a7d58
        );
    for (let j = 0; j <= rows; j++)
      m.line(
        Array.from({ length: cols + 1 }, (_, k) => {
          const p = P(k / cols, j / rows);
          return [p[0] + 0.015, p[1], p[2]];
        }),
        0.016,
        0x5d4c38,
        4
      );
    // The lowered part of the sail lies bundled at the boom.
    m.tube(P(0, 0), P(1, 0), 0.06, 0.05, 0x8b7050, 6);
    m.line([P(1, 1), [0, 2.7, 0.4]], 0.008, rope, 3);
    m.line([P(1, 0.5), [0.1, 0.3, -1.6]], 0.008, rope, 3);
    m.box(0.02, -0.05, -1.82, 0.05, 0.4, 0.3, 0x5a4a37);
    m.tube([0.02, 0.3, -1.7], [0.02, 0.45, -1.2], 0.02, 0.02, 0x8b7553, 5);
    // Anchor rope running down from the bow.
    m.line(
      [
        [0, 0.38, 1.72],
        [0.05, 0.05, 2.25],
        [0.08, -0.05, 2.5]
      ],
      0.012,
      rope,
      4
    );
  });
}

// Egrets wading in the shallows: white body, S-necked, on black legs.
function egret(m, x, y, z, yaw, s = 1, stoop = 0) {
  m.frame(x, y, z, yaw, s, () => {
    m.frame(
      0,
      0.36,
      0,
      0,
      1,
      () =>
        m.lathe(
          0,
          -0.15,
          0,
          [
            [0, 0],
            [0.04, 0.045],
            [0.14, 0.06],
            [0.24, 0.035],
            [0.3, 0.008]
          ],
          0xeeeee6,
          7
        ),
      -Math.PI / 2 + 0.35,
      0
    );
    const neck = [
      [0, 0.42, 0.09],
      [0, 0.5 - stoop * 0.2, 0.06 + stoop * 0.1],
      [0, 0.6 - stoop * 0.3, 0.12 + stoop * 0.15],
      [0, 0.64 - stoop * 0.35, 0.16 + stoop * 0.22]
    ];
    m.line(neck, 0.017, 0xf2f1ea, 5);
    const head = neck[3];
    m.lathe(
      head[0],
      head[1] - 0.025,
      head[2],
      [
        [0, 0.015],
        [0.025, 0.028],
        [0.05, 0.012]
      ],
      0xf4f3ec,
      6
    );
    m.tube(
      [head[0], head[1], head[2] + 0.02],
      [head[0], head[1] - 0.02 - stoop * 0.04, head[2] + 0.13],
      0.009,
      0.002,
      0x3a3328,
      4
    );
    for (const lx of [-0.025, 0.025])
      m.tube([lx, 0.3, -0.01], [lx * 1.4, -0.12, 0.0], 0.007, 0.006, 0x2a2622, 4);
  });
}

// Lily pads in the lee of the reeds, a few curling and yellowing with the year.
function lilies(m, surface, clear) {
  const r = m.rng;
  let placed = 0;
  for (let i = 0; i < 400 && placed < 22; i++) {
    const x = r.range(-11, 11),
      z = r.range(-11, 11);
    const y = surface(x, z);
    if (y > tide - 0.12 || y < tide - 0.55 || clear(x, z)) continue;
    placed++;
    const n = Math.round(r.range(3, 8));
    for (let k = 0; k < n; k++) {
      const px = x + r.range(-0.45, 0.45),
        pz = z + r.range(-0.35, 0.35);
      if (surface(px, pz) > tide - 0.08) continue;
      const rad = r.range(0.07, 0.15),
        notch = r.range(0, circle),
        tone = r.next() < 0.25 ? 0xa59a5a : r.pick([0x6f8a4f, 0x7d9256, 0x66804a]);
      const ring = [];
      for (let j = 0; j <= 8; j++) {
        const a = notch + 0.35 + (j * (circle - 0.7)) / 8;
        ring.push([px + Math.cos(a) * rad, tide + 0.012, pz + Math.sin(a) * rad]);
      }
      for (let j = 0; j < 8; j++)
        m.face(
          [[px, tide + 0.014, pz], ring[j], ring[j + 1]],
          j % 2 ? tone : m.mix(tone, 0xa9b37a, 0.25)
        );
    }
  }
}

// Driftwood and old stakes along the tide line and in the shallows.
function flotsam(m, surface, clear) {
  const r = m.rng;
  let placed = 0;
  for (let i = 0; i < 600 && placed < 14; i++) {
    const x = r.range(-11, 11),
      z = r.range(-11, 11);
    const y = surface(x, z);
    if (y > -0.5 || y < tide - 0.02 || clear(x, z)) continue;
    placed++;
    const a = r.range(0, circle),
      l = r.range(0.35, 0.9);
    const end = [
      x + Math.cos(a) * l,
      surface(x + Math.cos(a) * l, z + Math.sin(a) * l) + 0.02,
      z + Math.sin(a) * l
    ];
    const col = r.pick([0x9b927c, 0x8a806b, 0xa8a08a]);
    m.tube([x, y + 0.02, z], end, r.range(0.03, 0.055), 0.025, col, 5);
    const b = lerp([x, y + 0.02, z], end, 0.4);
    m.tube(
      b,
      [b[0] + Math.cos(a + 1.2) * 0.22, b[1] + 0.1, b[2] + Math.sin(a + 1.2) * 0.22],
      0.018,
      0.008,
      col,
      4
    );
  }
  // Rows of old net stakes standing in the water, some leaning, some gone.
  for (const [x, z, a, n] of [
    [-9.3, -1.6, 0.4, 9],
    [8.6, 4.4, 1.9, 8],
    [-2.6, -9.3, 2.6, 7],
    [9.4, -6.6, 0.9, 7]
  ])
    for (let k = 0; k < n; k++) {
      if (r.next() < 0.2) continue;
      const px = x + Math.cos(a) * k * 0.32,
        pz = z + Math.sin(a) * k * 0.32;
      const g = surface(px, pz);
      if (g > tide - 0.05) continue;
      const lean = r.range(-0.12, 0.12);
      m.tube(
        [px, g - 0.1, pz],
        [px + lean, tide + r.range(0.25, 0.6), pz + lean * 0.5],
        0.022,
        0.018,
        0x7d7563,
        5
      );
    }
}

// Reeds that grow right up to the hut piles and the landing.
function fringe(m, surface) {
  const r = m.rng;
  for (const [x, z, n] of [
    [3.95, -7.35, 10],
    [0.75, -8.9, 12],
    [5.25, 6.75, 8],
    [-6.6, 3.9, 10]
  ])
    for (let k = 0; k < n; k++) {
      const px = x + r.range(-0.3, 0.3),
        pz = z + r.range(-0.3, 0.3),
        g = surface(px, pz);
      // Never on the crown of the board.
      if (g > -0.3) continue;
      reed(m, px, g - 0.03, pz, r.range(0.5, 0.9), { plume: r.next() > 0.3 });
    }
}

const yards = [
  [2.45, -8.31, 2.1],
  [5.65, -9.45, 1.9],
  [4.7, 7.5, 1.2],
  [5.55, 7.7, 1.5],
  [-3.7, 8.4, 1.3],
  [-7.6, 3.6, 1.6],
  [2.7, 8.2, 1.15],
  [1.6, 8.5, 0.9],
  [7.15, 1.0, 1.15]
];
const inYard = (x, z) => yards.some(([a, b, rad]) => Math.hypot(x - a, z - b) < rad);

// Everything tall is drawn into `m` (a cutaway occluder); low dressing on the
// beaches and the water goes into `low`.
function fisherfolk(m, low, surface) {
  reedHut(m, surface);
  landing(m, surface);
  sampan(m, surface, -3.7, 8.4, 0.95);
  liftingNet(m, surface);
  dryingGround(m, surface);
  junk(m);
  fringe(m, surface);
  egret(low, 6.55, tide - 0.06, 3.35, 2.2, 1);
  egret(low, -4.85, tide - 0.05, 7.55, -0.6, 0.95, 0.8);
  egret(low, -1.1, tide - 0.06, -8.9, 0.9, 1.05);
  lilies(low, surface, inYard);
  flotsam(low, surface, inYard);
}

export { fisherfolk, yards, inYard };
