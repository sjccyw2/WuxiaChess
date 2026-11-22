// What the observatory's people left: the watch bell and drum in the
// galleries, two reckoning tables with charts, counting rods and ink, stools
// pushed back, a bronze lamp stand by each, a star chart stone, a covered
// instrument, a ladder still against the armillary, oil jars, the night's
// water buckets by the clock, and a brazier gone cold. All of it stands on the
// flags (y -0.29) clear of the board; what lies on the camera's side is low.
import { TOP } from './terrace-9.js';
import { tint } from './roof-9.js';
import { arcs, inner, outer, eaveY } from './gates-9.js';
import { circle } from '../scenery-kit.js';

const wood = 0x4d3a2c,
  woodDark = 0x35281f,
  bronze = 0x6e5f3a,
  body = 0x4a4330,
  worn = 0xb7975a,
  verdigris = 0x4d8a78,
  paper = 0xbfb294,
  stone = 0x6c746e,
  stoneLight = 0x8b9087;

// Where the lamps of the tables and the chart stone burn (world, flame height).
const tables = [
  { x: 9.05, z: 4.15, yaw: -0.44 - Math.PI / 2 },
  { x: -4.55, z: -8.65, yaw: 0.48 }
];
const chartStone = { x: 7.75, z: 6.45 };
const lampStands = [
  [9.85, 3.1],
  [-3.55, -9.05],
  [8.65, 5.85]
];
function propLamps() {
  return lampStands.map(([x, z]) => [x, TOP + 1.42, z]);
}

// A raised band round a turned body: a short upright strip standing just
// proud of radius r. Cheaper than a tube hoop and reads the same at a distance.
function girdle(m, x, y, z, r, t, col, n = 14) {
  for (let j = 0; j < n; j++) {
    const a = (j * circle) / n,
      b = ((j + 1) * circle) / n;
    const p = (u, h) => [x + Math.cos(u) * (r + t), y + h, z + Math.sin(u) * (r + t)];
    m.face([p(a, -t), p(b, -t), p(b, t), p(a, t)], col);
  }
}
// A flat inlaid ring on a level face.
function inlay(m, x, y, z, r, t, col, n = 28) {
  for (let j = 0; j < n; j++) {
    const a = (j * circle) / n,
      b = ((j + 1) * circle) / n;
    const p = (u, k) => [x + Math.cos(u) * k, y, z + Math.sin(u) * k];
    m.face([p(a, r - t), p(a, r + t), p(b, r + t), p(b, r - t)], col);
  }
}

// A tall bronze lamp stand: a tripod foot, a knopped shaft and an oil cup.
function lampStand(m, light, x, z) {
  const c = (code, y, k = 1) => light(code, x, y, z, k);
  for (let j = 0; j < 3; j++) {
    const a = (j * circle) / 3 + 0.4;
    m.line(
      [
        [x + Math.cos(a) * 0.2, TOP + 0.01, z + Math.sin(a) * 0.2],
        [x + Math.cos(a) * 0.12, TOP + 0.08, z + Math.sin(a) * 0.12],
        [x, TOP + 0.16, z]
      ],
      0.018,
      c(body, TOP),
      5
    );
  }
  m.lathe(x, TOP + 0.12, z, [[0, 0.06], [0.06, 0.07], [0.1, 0.03]], c(bronze, TOP + 0.15), 8);
  m.tube([x, TOP + 0.2, z], [x, TOP + 1.3, z], 0.022, 0.018, c(bronze, TOP + 0.8), 6);
  for (const h of [0.55, 0.95]) m.lathe(x, TOP + h, z, [[0, 0.025], [0.025, 0.05], [0.05, 0.025]], c(worn, TOP + h, 0.7), 8);
  m.lathe(x, TOP + 1.3, z, [[0, 0.03], [0.05, 0.13], [0.09, 0.15], [0.1, 0.13], [0.07, 0.12]], c(worn, TOP + 1.35, 0.6), 10);
  m.glow(() => {
    m.crystal(x, TOP + 1.37, z, 0.035, 0.12, 0xf3c47c, 0xfff0c8, 5);
    m.lathe(x, TOP + 1.37, z, [[0, 0.11], [0.003, 0.11]], 0xd59a52, 10);
  });
}

// A reckoning table in its own frame (x along the table), with what was on it.
function table(m, light, untidy) {
  const r = m.rng,
    T = (code, x, y, z, k = 1) => tint(m, light, code, x, y, z, k);
  const h = 0.74;
  m.box(0, h, 0, 1.36, 0.05, 0.64, T(wood, 0, h, 0));
  m.box(0, h - 0.06, 0, 1.24, 0.07, 0.56, T(woodDark, 0, h - 0.06, 0));
  // Rolled ends of the top, the legs and their stretchers.
  for (const s of [-1, 1]) m.tube([s * 0.7, h + 0.03, -0.32], [s * 0.7, h + 0.03, 0.32], 0.035, 0.035, T(wood, s * 0.7, h, 0), 6);
  for (const [x, z] of [[-0.58, -0.24], [0.58, -0.24], [0.58, 0.24], [-0.58, 0.24]])
    m.box(x, h / 2, z, 0.06, h, 0.06, T(woodDark, x, h / 2, z));
  for (const s of [-1, 1]) m.box(s * 0.58, 0.12, 0, 0.04, 0.04, 0.5, T(woodDark, s * 0.58, 0.12, 0));
  m.box(0, 0.12, 0, 1.12, 0.04, 0.04, T(woodDark, 0, 0.12, 0));
  const y = h + 0.03;
  // An unrolled star chart weighted at its ends.
  m.box(-0.1, y + 0.004, 0.02, 0.7, 0.006, 0.44, T(paper, -0.1, y, 0));
  for (const s of [-1, 1]) m.tube([-0.1 + s * 0.36, y + 0.022, -0.23], [-0.1 + s * 0.36, y + 0.022, 0.27], 0.022, 0.022, T(0x8b7a58, s, y, 0), 6);
  for (let i = 0; i < 9; i++) {
    const px = -0.38 + r.next() * 0.56,
      pz = -0.16 + r.next() * 0.36;
    m.box(px, y + 0.009, pz, 0.016, 0.003, 0.016, T(0x3a3127, px, y, pz));
  }
  m.box(-0.1, y + 0.008, 0.02, 0.66, 0.002, 0.008, T(0x8a3a2a, 0, y, 0));
  // Counting rods: a bundle, and some laid out in a sum left unfinished.
  for (let i = 0; i < 9; i++)
    m.box(0.48, y + 0.012 + (i % 3) * 0.012, -0.16 + Math.floor(i / 3) * 0.012, 0.012, 0.011, 0.24, T(0xb7a77d, 0.48, y, 0));
  for (let i = 0; i < 7; i++) {
    const px = 0.34 + (i % 4) * 0.04,
      pz = 0.06 + Math.floor(i / 4) * 0.12;
    m.frame(px, y + 0.008, pz, i % 3 ? 0 : Math.PI / 2, 1, () => m.box(0, 0, 0, 0.01, 0.008, 0.1, T(0xc4b48a, px, y, pz)));
  }
  // Ink stone, ink stick and a brush on its rest.
  m.box(0.5, y + 0.02, 0.2, 0.16, 0.04, 0.11, T(0x2a2f33, 0.5, y, 0.2));
  m.box(0.47, y + 0.041, 0.2, 0.07, 0.003, 0.06, T(0x141719, 0.47, y, 0.2));
  m.box(0.6, y + 0.015, 0.16, 0.02, 0.025, 0.07, T(0x1d1f22, 0.6, y, 0.16));
  m.box(0.34, y + 0.02, -0.22, 0.12, 0.04, 0.03, T(0x6e5f3a, 0.34, y, -0.22));
  m.tube([0.25, y + 0.05, -0.23], [0.45, y + 0.05, -0.21], 0.008, 0.006, T(0x5a3b26, 0.35, y, -0.22), 5);
  // A stack of bound records, one fallen open.
  for (let i = 0; i < 4; i++)
    m.frame(-0.55, y + 0.015 + i * 0.03, -0.18, 0.05 * (i % 2 ? 1 : -1), 1, () =>
      m.box(0, 0, 0, 0.2, 0.026, 0.27, T(i % 2 ? 0x6a5a44 : 0x5a4a3a, -0.55, y, -0.18))
    );
  if (untidy) {
    m.frame(-0.58, y + 0.006, 0.2, 0.3, 1, () => {
      m.box(-0.06, 0, 0, 0.12, 0.008, 0.17, T(paper, -0.58, y, 0.2));
      m.box(0.06, 0, 0, 0.12, 0.008, 0.17, T(0xb0a384, -0.58, y, 0.2));
    });
    // A tipped cup and a dried stain.
    m.frame(0.15, y + 0.03, 0.22, 0.6, 1, () => m.tube([0, 0, -0.04], [0, 0, 0.04], 0.03, 0.036, T(0x6f7a72, 0.15, y, 0.22), 8), 0, Math.PI / 2);
    m.box(0.23, y + 0.001, 0.24, 0.12, 0.002, 0.08, T(0x3a3127, 0.23, y, 0.24));
  }
  // Stools: one pushed back, one knocked over.
  const stool = (x, z, tipped) =>
    m.frame(x, tipped ? 0.17 : 0, z, tipped ? 0.7 : 0.2, 1, () => {
      const rows = [[0, 0.13], [0.05, 0.16], [0.2, 0.18], [0.38, 0.15], [0.42, 0.16], [0.44, 0.0]];
      m.lathe(0, tipped ? -0.22 : 0, 0, rows, T(0x6b4a34, x, 0.2, z), 10);
      girdle(m, 0, (tipped ? -0.22 : 0) + 0.21, 0, 0.18, 0.012, T(worn, x, 0.2, z, 0.6), 10);
    }, tipped ? Math.PI / 2 : 0);
  stool(-0.35, -0.68, false);
  stool(0.45, -0.85, untidy);
}

// The watch bell hangs from a crossbar in a gallery bay.
function bell(m, light, a) {
  const r = (inner + outer) / 2,
    x = Math.cos(a) * r,
    z = Math.sin(a) * r,
    y = eaveY - 0.08;
  m.frame(x, 0, z, Math.PI / 2 - a, 1, () => {
    const c = (code, h, k = 1) => tint(m, light, code, 0, h, 0, k);
    m.box(0, y, 0, 0.12, 0.14, outer - inner + 0.2, c(wood, y));
    m.box(0, y - 0.11, 0, 0.12, 0.08, 0.16, c(body, y - 0.1));
    // The bell: a bronze body with bosses in bands, a lotus rim and a dragon loop.
    m.lathe(0, y - 0.88, 0, [[0, 0.3], [0.03, 0.31], [0.08, 0.29], [0.42, 0.24], [0.6, 0.22], [0.7, 0.16], [0.73, 0.0]], c(bronze, y - 0.5), 16);
    m.lathe(0, y - 0.88, 0, [[0, 0.315], [0.06, 0.315], [0.06, 0.3]], c(worn, y - 0.88, 0.7), 16);
    for (const h of [0.2, 0.44]) girdle(m, 0, y - 0.88 + h, 0, 0.27 - h * 0.1, 0.014, c(verdigris, y - 0.6), 16);
    for (let k = 0; k < 4; k++) {
      const t = (k * circle) / 4 + 0.4;
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 2; i++) {
          const yy = y - 0.88 + 0.5 + i * 0.07,
            rr = 0.235 - i * 0.012,
            tt = t + (j - 1) * 0.16;
          m.box(Math.cos(tt) * rr, yy, Math.sin(tt) * rr, 0.03, 0.03, 0.03, c(worn, yy, 0.6));
        }
    }
    m.line([[-0.07, y - 0.15, 0], [-0.05, y - 0.08, 0], [0.05, y - 0.08, 0], [0.07, y - 0.15, 0]], 0.025, c(body, y), 6);
    // The striking log, hung on two cords beside the bell.
    m.box(0.55, y - 0.55, 0, 0.75, 0.1, 0.1, c(0x5a4532, y - 0.5));
    for (const s of [0.3, 0.8]) m.line([[s, y - 0.06, 0], [s, y - 0.5, 0]], 0.008, c(0x6a5b45, y), 4);
  });
}

// The watch drum on its stand, its face to the board.
function drum(m, light, a) {
  const r = (inner + outer) / 2,
    x = Math.cos(a) * r,
    z = Math.sin(a) * r;
  m.frame(x, TOP, z, Math.PI / 2 - a, 1, () => {
    const c = (code, h, k = 1) => tint(m, light, code, 0, h, 0, k);
    const cy = 0.82,
      half = 0.24;
    // The barrel bulges; studs hold the hides at both rims.
    const rows = [[-half, 0.36], [-half * 0.5, 0.41], [0, 0.43], [half * 0.5, 0.41], [half, 0.36]];
    m.frame(0, cy, 0, 0, 1, () => m.lathe(0, 0, 0, rows.map(([h, rr]) => [h, rr]), c(0x7a2f26, cy), 18), Math.PI / 2);
    for (const s of [-1, 1]) {
      m.frame(0, cy, s * (half + 0.004), 0, 1, () => m.lathe(0, 0, 0, [[0, 0.34], [0.002, 0.34]], c(0xa59a7a, cy), 18), (s * Math.PI) / 2);
      for (let k = 0; k < 20; k++) {
        const t = (k * circle) / 20;
        m.box(Math.cos(t) * 0.35, cy + Math.sin(t) * 0.35, s * (half - 0.03), 0.03, 0.03, 0.03, c(worn, cy, 0.7));
      }
    }
    for (const s of [-1, 1]) m.hoop(s * 0.42, cy, 0, 0.06, 0.012, c(worn, cy), 10, 'yz', Math.PI / 2);
    // The stand: two crossed trestles and a rail.
    for (const s of [-1, 1]) {
      m.tube([s * 0.5, 0, -0.32], [s * 0.36, cy + 0.05, 0.0], 0.04, 0.035, c(wood, 0.4), 6);
      m.tube([s * 0.5, 0, 0.32], [s * 0.36, cy + 0.05, 0.0], 0.04, 0.035, c(wood, 0.4), 6);
      m.box(s * 0.46, 0.2, 0, 0.05, 0.05, 0.6, c(woodDark, 0.2));
    }
    // Two beaters left across the rail.
    for (const s of [-0.06, 0.06]) m.tube([-0.5, 0.25, s + 0.1], [-0.18, 0.27, s - 0.05], 0.016, 0.014, c(0x6b4a34, 0.25), 5);
  });
}

// A round star chart stone: rings and the lodges' stars cut and inlaid.
function chart(m, light, x, z) {
  const r = m.rng,
    c = (code, y, k = 1) => light(code, x, y, z, k);
  m.lathe(x, TOP, z, [[0, 0.72], [0.08, 0.72], [0.1, 0.66], [0.22, 0.6], [0.26, 0.66], [0.3, 0.66], [0.3, 0]], c(stone, TOP), 24);
  m.lathe(x, TOP + 0.3, z, [[0, 0.62], [0.002, 0.62]], c(0x5c6762, TOP + 0.3), 24);
  for (const rr of [0.18, 0.36, 0.56]) inlay(m, x, TOP + 0.303, z, rr, 0.008, c(m.mix(bronze, worn, 0.3), TOP + 0.3, 0.8), 28);
  for (let k = 0; k < 28; k++) {
    const t = (k * circle) / 28;
    m.line([[x + Math.cos(t) * 0.36, TOP + 0.304, z + Math.sin(t) * 0.36], [x + Math.cos(t) * 0.56, TOP + 0.304, z + Math.sin(t) * 0.56]], 0.004, c(0x3c4542, TOP), 3);
  }
  for (let i = 0; i < 60; i++) {
    const t = r.next() * circle,
      rr = Math.sqrt(r.next()) * 0.58,
      s = 0.012 + 0.014 * r.next();
    m.box(x + Math.cos(t) * rr, TOP + 0.305, z + Math.sin(t) * rr, s, 0.004, s, c(0xd2b678, TOP + 0.3, 0.6));
  }
  // A worn groove where the chart was turned by hand.
  girdle(m, x, TOP + 0.255, z, 0.64, 0.014, c(stoneLight, TOP + 0.26), 24);
}

// A cloth over a small instrument, roped down; the folds hang to the flags.
function covered(m, light, x, z) {
  const n = 22,
    rows = [
      [0, 0.62],
      [0.15, 0.58],
      [0.55, 0.5],
      [0.95, 0.44],
      [1.12, 0.32],
      [1.22, 0.12],
      [1.25, 0.0]
    ];
  let last;
  for (const [h, rr] of rows) {
    const ring = [];
    for (let j = 0; j < n; j++) {
      const t = (j * circle) / n,
        fold = 1 + (h < 1 ? 0.09 * Math.sin(7 * t + h * 2) * (1 - h) : 0) + 0.04 * Math.sin(3 * t);
      ring.push([x + Math.cos(t) * rr * fold, TOP + h, z + Math.sin(t) * rr * fold * 0.85]);
    }
    if (last)
      for (let j = 0; j < n; j++) {
        const q = (j + 1) % n,
          quad = [last[j], ring[j], ring[q], last[q]];
        m.face(quad, quad.map((p) => light(m.mix(0x5b5a4e, 0x7c7a68, (p[1] - TOP) / 1.3), p[0], p[1], p[2])));
      }
    last = ring;
  }
  // A ring of the instrument shows through a tear; ropes bind the cloth.
  for (const h of [0.35, 0.9]) girdle(m, x, TOP + h, z, 0.5 - h * 0.08 + 0.03, 0.014, light(0x6a5b45, x, h, z), 18);
  m.line([[x - 0.5, TOP + 0.01, z + 0.3], [x - 0.3, TOP + 1.1, z + 0.25], [x + 0.3, TOP + 1.1, z - 0.25], [x + 0.5, TOP + 0.01, z - 0.3]], 0.011, light(0x6a5b45, x, 1, z), 4);
  for (const s of [-1, 1]) m.box(x + s * 0.55, TOP + 0.04, z + s * 0.32, 0.12, 0.08, 0.12, light(stone, x, TOP, z));
}

// A wooden ladder leaning on the armillary's horizon ring.
function ladder(m, light) {
  const foot = [9.85, TOP + 0.005, -2.75],
    head = [9.33, 1.06, -2.9];
  const side = [0, 0, 0.22];
  const c = (h) => light(0x6b5136, foot[0], h, foot[2]);
  for (const s of [-1, 1]) m.tube(foot.map((v, i) => v + side[i] * s), head.map((v, i) => v + side[i] * s), 0.025, 0.022, c(0.3), 6);
  for (let k = 1; k < 6; k++) {
    const f = k / 6,
      p = foot.map((v, i) => v + (head[i] - v) * f);
    m.tube([p[0], p[1], p[2] - 0.22], [p[0], p[1], p[2] + 0.22], 0.016, 0.016, c(p[1]), 5);
  }
}

// Glazed oil jars, one with its lid off and one cracked and empty.
function jars(m, light, x, z) {
  const r = m.rng;
  const spots = [[0, 0, 1], [0.48, 0.12, 0.85], [0.18, 0.5, 0.95], [-0.42, 0.3, 0.7], [0.62, 0.62, 0.6]];
  spots.forEach(([dx, dz, s], i) => {
    const px = x + dx,
      pz = z + dz;
    const tone = r.next() < 0.5 ? 0x4a3a2c : 0x3b3f36;
    const glaze = m.mix(tone, 0x7a6a4a, 0.35);
    m.lathe(px, TOP, pz, [[0, 0.16 * s], [0.08 * s, 0.24 * s], [0.3 * s, 0.3 * s], [0.5 * s, 0.25 * s], [0.6 * s, 0.13 * s], [0.66 * s, 0.14 * s], [0.66 * s, 0.11 * s]].map(([h, rr]) => [h, rr]), light(glaze, px, TOP + 0.3, pz), 12);
    if (i !== 1) m.lathe(px, TOP + 0.66 * s, pz, [[0, 0.15 * s], [0.04 * s, 0.13 * s], [0.07 * s, 0.03 * s], [0.08 * s, 0]], light(0x5b4a36, px, TOP + 0.7, pz), 10);
    else m.lathe(px, TOP + 0.6 * s, pz, [[0, 0.1 * s], [0.002, 0.1 * s]], light(0x2a241c, px, TOP + 0.6, pz), 10);
    // A rope sling round the neck of the larger jars.
    if (s > 0.8) girdle(m, px, TOP + 0.56 * s, pz, 0.2 * s, 0.012, light(0x7a6a4f, px, TOP + 0.5, pz), 12);
  });
  // A lid set down beside them, and a dipper.
  m.lathe(x + 0.8, TOP, z + 0.05, [[0, 0.13], [0.03, 0.12], [0.06, 0.03], [0.07, 0]], light(0x5b4a36, x + 0.8, TOP, z), 10);
  m.tube([x + 0.62, TOP + 0.02, z - 0.25], [x + 0.95, TOP + 0.04, z - 0.42], 0.012, 0.012, light(0x6b5136, x, TOP, z), 5);
  m.lathe(x + 0.6, TOP, z - 0.24, [[0, 0.03], [0.04, 0.06], [0.05, 0.06]], light(bronze, x, TOP, z), 8);
}

// Water buckets and a carrying pole by the clock, for the night's refilling.
function buckets(m, light, x, z) {
  for (const [dx, dz] of [[0, 0], [0.42, 0.18]]) {
    const px = x + dx,
      pz = z + dz;
    m.lathe(px, TOP, pz, [[0, 0.15], [0.32, 0.19], [0.32, 0.17], [0.03, 0.135]], light(0x5c4532, px, TOP, pz), 12);
    m.lathe(px, TOP + 0.03, pz, [[0, 0.14], [0.002, 0.14]], light(0x62857e, px, TOP, pz), 12);
    for (const h of [0.06, 0.26]) girdle(m, px, TOP + h, pz, 0.15 + h * 0.13, 0.012, light(body, px, TOP + h, pz), 12);
    m.line([[px - 0.18, TOP + 0.3, pz], [px, TOP + 0.5, pz], [px + 0.18, TOP + 0.3, pz]], 0.008, light(0x2c2a26, px, TOP, pz), 4);
  }
  m.tube([x - 0.4, TOP + 0.03, z - 0.3], [x + 1.0, TOP + 0.03, z - 0.05], 0.028, 0.028, light(0x6b5136, x, TOP, z), 6);
}

// A tripod brazier, its coals long dead and grey with ash.
function brazier(m, light, x, z) {
  const r = m.rng,
    c = (code, y, k = 1) => light(code, x, y, z, k);
  for (let j = 0; j < 3; j++) {
    const a = (j * circle) / 3 + 0.3;
    m.line(
      [
        [x + Math.cos(a) * 0.4, TOP, z + Math.sin(a) * 0.4],
        [x + Math.cos(a) * 0.36, TOP + 0.2, z + Math.sin(a) * 0.36],
        [x + Math.cos(a) * 0.3, TOP + 0.45, z + Math.sin(a) * 0.3]
      ],
      0.035,
      c(body, TOP + 0.2),
      6
    );
    m.box(x + Math.cos(a) * 0.4, TOP + 0.02, z + Math.sin(a) * 0.4, 0.1, 0.04, 0.1, c(verdigris, TOP));
  }
  m.lathe(x, TOP + 0.4, z, [[0, 0.12], [0.06, 0.3], [0.2, 0.42], [0.24, 0.45], [0.26, 0.43], [0.2, 0.38]], c(bronze, TOP + 0.55), 16);
  girdle(m, x, TOP + 0.64, z, 0.445, 0.016, c(worn, TOP + 0.64, 0.6), 16);
  for (const s of [-1, 1]) m.hoop(x + s * 0.47, TOP + 0.58, z, 0.06, 0.012, c(worn, TOP + 0.6), 8, 'yz', Math.PI / 2);
  m.lathe(x, TOP + 0.58, z, [[0, 0.37], [0.03, 0.3], [0.04, 0.0]], c(0x4f4e4a, TOP + 0.6), 14);
  for (let i = 0; i < 14; i++) {
    const t = r.next() * circle,
      rr = Math.sqrt(r.next()) * 0.26;
    m.rock(x + Math.cos(t) * rr, TOP + 0.6, z + Math.sin(t) * rr, 0.05, 0.04, 0.04, c(0x24221f, TOP), c(0x77746c, TOP), 5);
  }
  // A poker left in it, and spilt ash on the flags.
  m.tube([x + 0.1, TOP + 0.62, z], [x + 0.62, TOP + 0.95, z - 0.2], 0.012, 0.01, c(0x2e2c28, TOP), 5);
  m.face(
    Array.from({ length: 9 }, (_, j) => {
      const t = -(j * circle) / 9;
      const rr = 0.5 + 0.1 * Math.sin(3 * t);
      return [x + 0.15 + Math.cos(t) * rr, TOP + 0.004, z + 0.1 + Math.sin(t) * rr * 0.7];
    }),
    c(0x6a6a64, TOP)
  );
}

function relics9(m, light) {
  table_(m, light, tables[0], true);
  table_(m, light, tables[1], false);
  for (const [x, z] of lampStands) lampStand(m, light, x, z);
  chart(m, light, chartStone.x, chartStone.z);
  // The bell hangs in the first bay of the north-east gallery, the drum stands
  // in the first bay of the west gallery.
  const [e0, e1] = arcs[3];
  bell(m, light, e0 + 0.012 + (e1 - e0 - 0.024) * 0.1);
  const [w0, w1] = arcs[0];
  drum(m, light, w0 + 0.012 + (w1 - w0 - 0.024) * 0.125);
  covered(m, light, -9.75, -4.35);
  ladder(m, light);
  jars(m, light, -2.85, 10.25);
  buckets(m, light, -7.75, 3.55);
  brazier(m, light, 3.25, -9.45);
}
function table_(m, light, { x, z, yaw }, untidy) {
  m.frame(x, TOP, z, yaw, 1, () => table(m, light, untidy));
}

export { relics9, propLamps };
