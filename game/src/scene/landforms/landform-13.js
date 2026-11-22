// 西夏夜苑: the dowager consort's palace garden at night. The board is an island of dressed
// marble in a lotus moat. North of it a broad flight of steps climbs to the terrace of the hall;
// a roofed gallery with a gate and a water pavilion runs down the far (west) bank; the near
// banks, east and south, are kept low: a dyke with a balustrade, lamp pillars and a hanging-
// flower gate, and a causeway to a moon gate. Everything is lit by its own lanterns, whose
// light is painted into the stone around them.
import { Model, circle } from '../scenery-kit.js';
import { paveTile } from './paving-13.js';
import { tiledRoof, bracketRow } from './roof-13.js';
import {
  oldPine,
  cypress,
  trailingWillow,
  plumTree,
  bamboo,
  peonyBed,
  pottedPine,
  taihuRock,
  stoneTable,
  pleasureBoat
} from './garden-13.js';

const marble = 0xb3bac6; // 漢白玉 under lamplight
const marbleShade = 0x7f8a9c;
const flag = 0x4a566b;
const flagLight = 0x65718a;
const mortar = 0x2a3140;
const masonry = 0x414c5f;
const coping = 0x8a93a3;
const stepDark = 0x4b5466; // 青石 of the hall steps
const turf = 0x263238;
const lacquer = 0xa23c2c;
const lacquerDark = 0x6a2722;
const wallRed = 0x7c3a33;
const plaster = 0x9a958f;
const teal = 0x2c6168;
const glaze = [0x111e23, 0x1b3236, 0x30544f]; // green-glazed tile: shadow, body, lit edge
const ridgeTone = 0x1b2e31;
const gilt = 0xcfa85c;
const giltDark = 0x9a7a3e;
const bronze = 0x5f5236; // old bronze, dark with patina
const bronzeDark = 0x3f3a2c;
const ink = 0x20232c;
const paper = 0xf4c57a;
const lampRed = 0xee6a3a;
const lotusLeaf = 0x28553f;
const lotusRim = 0x4a8060;
const petal = 0xe79aa8;
const up = [0, 1, 0];
const GROUND = 0.02; // paving of the banks, a finger below the board
const TERRACE = 0.88; // the hall's terrace
const FLOOR = -1.3; // foot of every bank, under the water
const WATER = -0.9;
const BANK = 8.2; // the moat's outer bank: east, west and south
const FRONT = -6.85; // the terrace's front wall

// Faces are wound so their normal points along `hint`; the shadow's normal offset pushes a
// face wound the other way into its own shadow.
function put(m, pts, col, hint = up) {
  const [a, b, c] = pts,
    u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) pts = [...pts].reverse();
  m.face(pts, col);
}
// A lamp remembers where it hangs (in the model's own space), so its light can be painted.
function mark(m, x, y, z) {
  if (!m.lamps) return;
  const e = m.matrix.elements;
  m.lamps.push([
    e[0] * x + e[4] * y + e[8] * z + e[12],
    e[1] * x + e[5] * y + e[9] * z + e[13],
    e[2] * x + e[6] * y + e[10] * z + e[14]
  ]);
}
// Lamplight painted into vertex colours: warm, and gone within a few paces.
function bathe(m, lamps, gain = 1) {
  const { p, c } = m.parts[0];
  for (let i = 0; i < p.length; i += 3) {
    let g = 0;
    for (const [x, y, z] of lamps) {
      const dx = p[i] - x,
        dy = p[i + 1] - y,
        dz = p[i + 2] - z,
        d2 = dx * dx + 0.45 * dy * dy + dz * dz;
      if (d2 < 9) g += Math.exp(-d2 / 1.7);
    }
    g = Math.min(1, g) * gain;
    c[i] *= 1 + 1.3 * g;
    c[i + 1] *= 1 + 0.86 * g;
    c[i + 2] *= 1 + 0.3 * g;
  }
}

// Flagstones over a dark mortar bed.
function pave(m, x0, x1, z0, z1, y, size = 0.74, tone = flag, vary = flagLight) {
  put(
    m,
    [
      [x0, y - 0.014, z0],
      [x0, y - 0.014, z1],
      [x1, y - 0.014, z1],
      [x1, y - 0.014, z0]
    ],
    mortar
  );
  const nx = Math.max(1, Math.round((x1 - x0) / size)),
    nz = Math.max(1, Math.round((z1 - z0) / size));
  const dx = (x1 - x0) / nx,
    dz = (z1 - z0) / nz,
    gap = 0.017;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx + (j % 2); i++) {
      const shift = j % 2 ? -dx / 2 : 0,
        a = Math.max(x0, x0 + i * dx + shift) + gap,
        b = Math.min(x1, x0 + (i + 1) * dx + shift) - gap,
        c = z0 + j * dz + gap,
        d = c + dz - 2 * gap;
      put(
        m,
        [
          [a, y, c],
          [a, y, d],
          [b, y, d],
          [b, y, c]
        ],
        m.mix(tone, vary, m.rng.next() * 0.55)
      );
    }
}
// Unpaved ground in broad dark squares.
function lawn(m, x0, x1, z0, z1, y) {
  const nx = Math.max(1, Math.round((x1 - x0) / 1.7)),
    nz = Math.max(1, Math.round((z1 - z0) / 1.7));
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const a = x0 + ((x1 - x0) * i) / nx,
        b = x0 + ((x1 - x0) * (i + 1)) / nx,
        c = z0 + ((z1 - z0) * j) / nz,
        d = z0 + ((z1 - z0) * (j + 1)) / nz;
      put(
        m,
        [
          [a, y, c],
          [a, y, d],
          [b, y, d],
          [b, y, c]
        ],
        m.mix(turf, 0x30413c, m.rng.next() * 0.6)
      );
    }
}
// An upright face from (ax, az) to (bx, bz), cut into panels so light can be painted along it.
function upright(m, ax, az, bx, bz, y0, y1, col, hint, step = 1.1) {
  const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step));
  for (let i = 0; i < n; i++) {
    const x0 = ax + ((bx - ax) * i) / n,
      z0 = az + ((bz - az) * i) / n,
      x1 = ax + ((bx - ax) * (i + 1)) / n,
      z1 = az + ((bz - az) * (i + 1)) / n;
    put(
      m,
      [
        [x0, y0, z0],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z0]
      ],
      col,
      hint
    );
  }
}
// A stone bank: a dressed coping over coursed masonry that goes on down under the water.
function bank(m, ax, az, bx, bz, top, hint, step = 1.1) {
  upright(m, ax, az, bx, bz, top - 0.13, top, coping, hint, step);
  upright(m, ax, az, bx, bz, top - 0.17, top - 0.13, mortar, hint, step * 3);
  upright(m, ax, az, bx, bz, -0.62, top - 0.17, masonry, hint, step);
  upright(m, ax, az, bx, bz, FLOOR, -0.62, m.mix(masonry, 0x18202c, 0.55), hint, step * 3);
}
// White stone balustrade: posts with lotus-bud heads, a handrail and solid carved panels.
function stoneRail(m, ax, az, bx, bz, y, h = 0.4, spacing = 0.8) {
  const len = Math.hypot(bx - ax, bz - az),
    n = Math.max(1, Math.round(len / spacing)),
    yaw = Math.atan2(-(bz - az), bx - ax);
  m.frame((ax + bx) / 2, y, (az + bz) / 2, yaw, 1, () => {
    m.box(0, h * 0.86, 0, len, 0.05, 0.07, marble);
    m.box(0, h * 0.37, 0, len, h * 0.5, 0.034, marbleShade);
    m.box(0, 0.025, 0, len, 0.05, 0.08, marbleShade);
    for (let i = 0; i <= n; i++) {
      const x = -len / 2 + (len * i) / n;
      m.box(x, h / 2, 0, 0.085, h, 0.085, marble);
      m.lathe(
        x,
        h,
        0,
        [
          [0, 0.036],
          [0.02, 0.05],
          [0.05, 0.054],
          [0.08, 0.04],
          [0.11, 0]
        ],
        marble,
        7
      );
      // 華板: each panel carries a raised, paler cartouche on both faces.
      if (i < n) {
        const cx = x + len / n / 2,
          pw = len / n - 0.2;
        if (pw > 0.12)
          for (const f of [-1, 1])
            m.box(cx, h * 0.37, f * 0.02, pw, h * 0.3, 0.008, m.mix(marble, marbleShade, 0.3));
      }
    }
  });
}
// A small hipped cap with lifted corners, for lamp pillars and gate posts.
function cap(m, y, half, rise, tone, light = tone) {
  const top = half * 0.22;
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4,
      c = Math.cos(a),
      s = Math.sin(a);
    // Each side in its own turn: `out` points away from the pillar, `along` runs down the eave.
    const at = (out, along, h) => [c * out - s * along, y + h, s * out + c * along];
    const l = at(half, -half, rise * 0.22),
      r = at(half, half, rise * 0.22),
      mid = at(half, 0, 0),
      tl = at(top, -top, rise),
      tr = at(top, top, rise),
      hint = [c, 0.6, s];
    put(m, [l, mid, tl], tone, hint);
    put(m, [mid, tr, tl], light, hint);
    put(m, [mid, r, tr], tone, hint);
    put(m, [l, r, at(half, 0, -0.05)], ink, [c, 0, s]);
  }
  m.box(0, y - 0.035, 0, half * 1.7, 0.05, half * 1.7, tone);
  m.box(0, y + rise + 0.03, 0, top * 2, 0.07, top * 2, light);
}
// 宮燈石柱: a carved stone pillar carrying a lit lantern box under a small stone cap.
function stoneLamp(m, s = 1) {
  m.frame(0, 0, 0, 0, s, () => {
    m.box(0, 0.05, 0, 0.38, 0.1, 0.38, marbleShade);
    m.box(0, 0.13, 0, 0.28, 0.07, 0.28, marble);
    m.lathe(
      0,
      0.16,
      0,
      [
        [0, 0.105],
        [0.07, 0.078],
        [0.3, 0.07],
        [0.33, 0.092],
        [0.37, 0.07],
        [0.52, 0.066],
        [0.6, 0.13]
      ],
      marble,
      6
    );
    m.box(0, 0.785, 0, 0.33, 0.05, 0.33, marble);
    m.glow(() => m.box(0, 0.925, 0, 0.215, 0.23, 0.215, paper));
    for (const i of [-1, 1])
      for (const j of [-1, 1]) m.box(i * 0.118, 0.925, j * 0.118, 0.034, 0.23, 0.034, marbleShade);
    cap(m, 1.075, 0.205, 0.14, marbleShade, marble);
  });
  mark(m, 0, 0.93 * s, 0);
}
// A hanging palace lantern: silk shade, gilt collars and a tassel.
function palaceLamp(m, x, y, z, s = 1, tone = lampRed) {
  m.frame(x, y, z, 0, s, () => {
    m.tube([0, 0.5, 0], [0, 0.2, 0], 0.011, 0.011, ink, 4);
    m.glow(() =>
      m.lathe(
        0,
        0,
        0,
        [
          [-0.18, 0.08],
          [-0.1, 0.15],
          [0.02, 0.178],
          [0.12, 0.15],
          [0.19, 0.085]
        ],
        tone,
        7
      )
    );
    m.lathe(
      0,
      0,
      0,
      [
        [0.185, 0.092],
        [0.225, 0.07]
      ],
      gilt,
      7
    );
    m.lathe(
      0,
      0,
      0,
      [
        [-0.215, 0.066],
        [-0.178, 0.088]
      ],
      gilt,
      7
    );
    m.tube([0, -0.2, 0], [0, -0.38, 0], 0.012, 0.032, 0xb8402c, 5);
  });
  mark(m, x, y, z);
}
// A lacquered column on a carved stone base.
function column(m, x, z, y, h, r = 0.09, tone = lacquer) {
  m.lathe(
    x,
    y,
    z,
    [
      [0, r * 1.75],
      [0.05, r * 1.8],
      [0.09, r * 1.15]
    ],
    marbleShade,
    8
  );
  m.tube([x, y + 0.08, z], [x, y + h, z], r, r * 0.92, tone, 8);
}
// A lit paper lattice, seen from +z of its own frame; the muntins are painted on the paper.
function lattice(m, w, h, nx = 4, ny = 4, lit = paper, bars = lacquerDark) {
  const flat = (x0, x1, y0, y1, z, col) =>
    put(
      m,
      [
        [x0, y0, z],
        [x1, y0, z],
        [x1, y1, z],
        [x0, y1, z]
      ],
      col,
      [0, 0, 1]
    );
  m.glow(() => flat(-w / 2, w / 2, -h / 2, h / 2, 0, lit));
  for (const k of [-1, 1]) {
    m.box((k * w) / 2, 0, 0.012, 0.05, h + 0.05, 0.045, bars);
    m.box(0, (k * h) / 2, 0.012, w + 0.05, 0.05, 0.045, bars);
  }
  for (let i = 1; i < nx; i++) {
    const x = -w / 2 + (i * w) / nx;
    flat(x - 0.011, x + 0.011, -h / 2, h / 2, 0.006, bars);
  }
  for (let j = 1; j < ny; j++) {
    const y = -h / 2 + (j * h) / ny;
    flat(-w / 2, w / 2, y - 0.011, y + 0.011, 0.007, bars);
  }
}

// A plain tile coping for a garden wall, along x of its own frame.
function wallCoping(m, len, y, half, rise) {
  const n = Math.max(1, Math.round(len / 1.3));
  for (let i = 0; i < n; i++) {
    const x0 = -len / 2 + (len * i) / n,
      x1 = -len / 2 + (len * (i + 1)) / n;
    for (const s of [-1, 1]) {
      put(
        m,
        [
          [x0, y, s * half],
          [x1, y, s * half],
          [x1, y + rise, 0],
          [x0, y + rise, 0]
        ],
        i % 2 ? glaze[1] : m.mix(glaze[1], glaze[2], 0.3)
      );
      put(
        m,
        [
          [x0, y, s * half],
          [x1, y, s * half],
          [x1, y - 0.07, s * half * 0.88],
          [x0, y - 0.07, s * half * 0.88]
        ],
        glaze[0],
        [0, 0, s]
      );
    }
  }
  m.box(0, y + rise + 0.02, 0, len, 0.07, 0.09, ridgeTone);
}
// A painted architrave with a row of bracket blocks, running along x of its own frame.
function beam(m, len, y = 0, depth = 0.14, blocks = true) {
  m.box(0, y + 0.09, 0, len, 0.18, depth, teal);
  m.box(0, y + 0.012, 0, len, 0.03, depth + 0.02, gilt);
  // 旋子彩畫: painted roundels and a gilt-edged panel at the middle of the beam.
  const bands = Math.max(1, Math.round(len / 1.4));
  for (let i = 0; i < bands; i++) {
    const x = -len / 2 + ((i + 0.5) * len) / bands;
    m.box(x, y + 0.09, depth / 2 + 0.004, 0.32, 0.12, 0.008, i % 2 ? 0x2b4f7a : 0x3f7f6f);
    m.box(x, y + 0.09, depth / 2 + 0.009, 0.12, 0.07, 0.006, gilt);
  }
  if (!blocks) return;
  const n = Math.max(1, Math.round(len / 0.46));
  for (let i = 0; i <= n; i++)
    m.box(
      -len / 2 + (len * i) / n,
      y + 0.255,
      0.03,
      0.16,
      0.15,
      depth + 0.16,
      i % 2 ? teal : lacquerDark
    );
}
// A rounded mass of leaves: three rings and a crown.
function clump(m, x, y, z, rx, ry, rz, base, light, n = 7) {
  const r = m.rng,
    turn = r.range(0, circle),
    rim = Array.from({ length: n }, () => r.range(0.8, 1.16));
  let last;
  for (const [h, s, f] of [
    [-0.5, 0.55, 0],
    [-0.05, 1, 0.3],
    [0.45, 0.72, 0.75]
  ]) {
    const ring = rim.map((k, i) => {
      const a = turn + (i * circle) / n;
      return [x + Math.cos(a) * rx * s * k, y + ry * h, z + Math.sin(a) * rz * s * k];
    });
    const col = m.mix(base, light, f);
    if (last)
      for (let i = 0; i < n; i++) {
        const q = (i + 1) % n;
        m.face([last.ring[i], ring[i], ring[q], last.ring[q]], [last.col, col, col, last.col]);
      }
    last = { ring, col };
  }
  for (let i = 0; i < n; i++)
    m.face(
      [[x, y + ry * 0.8, z], last.ring[(i + 1) % n], last.ring[i]],
      [m.rgb(light), last.col, last.col]
    );
}
// A dark pine in flat tiers.
function pine(m, x, z, s) {
  const r = m.rng;
  m.frame(x, GROUND, z, r.range(0, circle), s, () => {
    m.line(
      [
        [0, 0, 0],
        [0.06, 0.9, 0.03],
        [-0.05, 1.8, -0.04],
        [0.03, 2.6, 0]
      ],
      0.085,
      0x2c2826,
      5
    );
    for (let k = 0; k < 4; k++) {
      const a = k * 2.2 + r.range(-0.3, 0.3),
        reach = 0.75 - k * 0.13,
        y = 1.25 + k * 0.5;
      clump(
        m,
        Math.cos(a) * reach * 0.6,
        y,
        Math.sin(a) * reach * 0.6,
        reach * 1.3,
        0.34,
        reach,
        0x162a27,
        0x2c4a3d,
        7
      );
    }
    clump(m, 0.02, 3.0, 0, 0.42, 0.4, 0.38, 0x162a27, 0x31503f, 6);
  });
}
// A willow leaning over the water, its crown hung with long strands.
function willow(m, x, z, s, lean) {
  const r = m.rng;
  m.frame(x, GROUND, z, lean, s, () => {
    m.line(
      [
        [0, 0, 0],
        [0.12, 0.8, 0],
        [0.4, 1.6, 0.05],
        [0.75, 2.2, 0]
      ],
      0.1,
      0x322d29,
      6
    );
    for (const [cx, cy, cz, k] of [
      [0.8, 2.5, 0, 1],
      [0.2, 2.35, 0.45, 0.8],
      [1.25, 2.25, -0.3, 0.75],
      [0.5, 2.3, -0.55, 0.7]
    ]) {
      clump(m, cx, cy, cz, 0.7 * k, 0.42 * k, 0.62 * k, 0x21392f, 0x3c5c42, 7);
      for (let j = 0; j < 7; j++) {
        const a = (j * circle) / 7 + r.range(-0.3, 0.3),
          px = cx + Math.cos(a) * 0.62 * k,
          pz = cz + Math.sin(a) * 0.55 * k,
          drop = r.range(0.9, 1.6);
        m.leaf(
          [px, cy - 0.05, pz],
          [px + Math.cos(a) * 0.12, cy - drop, pz + Math.sin(a) * 0.12],
          0.05,
          0x2a4a38,
          0x466a48,
          0.02
        );
      }
    }
  });
}
// A flowering garden tree: a slender dark trunk under pale blossom.
function blossomTree(m, x, z, s, y = GROUND) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    m.line(
      [
        [0, 0, 0],
        [0.07, 0.5, 0.03],
        [-0.04, 1.0, 0],
        [0.05, 1.4, -0.03]
      ],
      0.055,
      0x3a2f2d,
      5
    );
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4 + r.range(-0.3, 0.3),
        reach = r.range(0.22, 0.58),
        h = 1.15 + k * 0.085,
        tip = [Math.cos(a) * reach, h + 0.2, Math.sin(a) * reach],
        size = r.range(0.24, 0.34);
      m.tube([0, h - 0.2, 0], tip, 0.026, 0.01, 0x3a2f2d, 4);
      clump(
        m,
        tip[0],
        tip[1] + 0.08,
        tip[2],
        size,
        size * 0.95,
        size * 0.92,
        0x8f6c7d,
        0xe3c6ce,
        7
      );
    }
    clump(m, 0.03, 2.05, 0, 0.3, 0.28, 0.28, 0x9a7787, 0xead2d8, 7);
  });
}
// 太湖石: a pitted scholar's rock set up on end.
function scholarRock(m, x, z, s) {
  m.frame(x, GROUND, z, m.rng.range(0, circle), s, () => {
    m.rock(0, 0, 0, 0.32, 0.5, 0.25, 0x56616e, 0x8c97a3, 8);
    m.rock(0.08, 0.42, 0.02, 0.24, 0.5, 0.2, 0x56616e, 0x97a2ad, 7);
    m.rock(-0.05, 0.86, 0, 0.17, 0.36, 0.14, 0x5d6875, 0xa3adb7, 7);
  });
}

// The banks of the moat, the dykes, the palace ground behind them, and the three crossings.
function grounds(m) {
  // Paved walks: west bank, the two corners beside the terrace, east dyke, south dyke.
  pave(m, -10.6, -BANK, FRONT, 10.4, GROUND);
  pave(m, -10.6, -7.2, -11.9, FRONT, GROUND);
  pave(m, 7.2, 10.2, -11.9, FRONT, GROUND);
  pave(m, BANK, 10.2, FRONT, 10.4, GROUND);
  pave(m, -BANK, BANK, BANK, 10.4, GROUND);
  // Dark palace ground to the west and north.
  lawn(m, -21, -10.6, -21, 10.4, GROUND);
  lawn(m, -10.6, 10.2, -21, -11.9, GROUND);
  // Inner banks of the moat.
  bank(m, -BANK, FRONT, -BANK, BANK, GROUND, [1, 0, 0]);
  bank(m, -BANK, BANK, -1.6, BANK, GROUND, [0, 0, -1]);
  bank(m, 1.6, BANK, BANK, BANK, GROUND, [0, 0, -1]);
  bank(m, BANK, BANK, BANK, FRONT, GROUND, [-1, 0, 0]);
  bank(m, -BANK, FRONT, -7.2, FRONT, GROUND, [0, 0, 1]);
  bank(m, 7.2, FRONT, BANK, FRONT, GROUND, [0, 0, 1]);
  // Outer faces, toward the open water.
  bank(m, 10.2, -21, 10.2, 10.4, GROUND, [1, 0, 0], 2.2);
  bank(m, -21, 10.4, 10.2, 10.4, GROUND, [0, 0, 1], 2.2);
  bank(m, -21, -21, -21, 10.4, GROUND, [-1, 0, 0], 4);
  bank(m, -21, -21, 10.2, -21, GROUND, [0, 0, -1], 4);
  // South causeway from the dyke to the board, with a low kerb.
  pave(m, -1.6, 1.6, 5.5, BANK, GROUND, 0.8);
  bank(m, -1.6, 5.5, -1.6, BANK, GROUND, [-1, 0, 0]);
  bank(m, 1.6, BANK, 1.6, 5.5, GROUND, [1, 0, 0]);
  for (const s of [-1, 1]) {
    m.box(s * 1.52, GROUND + 0.07, 6.9, 0.12, 0.14, 2.6, marbleShade);
    m.box(s * 1.52, GROUND + 0.16, 6.9, 0.16, 0.04, 2.64, marble);
  }
  // The flat stone bridges of the west and east gates.
  for (const s of [-1, 1]) {
    m.box(s * 7.35, -0.04, -2, 1.72, 0.14, 1.12, coping);
    m.box(s * 7.35, -0.72, -2, 0.3, 1.22, 0.9, masonry);
    for (const k of [-1, 1]) {
      m.box(s * 7.35, 0.085, -2 + k * 0.5, 1.7, 0.11, 0.09, marble);
      for (const e of [-0.78, 0.78])
        m.box(s * 7.35 + e, 0.13, -2 + k * 0.5, 0.11, 0.2, 0.11, marbleShade);
      // A small lamp on the middle of each kerb.
      m.frame(s * 7.35, 0.13, -2 + k * 0.5, 0, 1, () => stoneLamp(m, 0.5));
    }
    for (let j = 0; j < 3; j++)
      put(
        m,
        [
          [s * 7.35 - 0.8, 0.032, -2.4 + j * 0.27],
          [s * 7.35 + 0.8, 0.032, -2.4 + j * 0.27],
          [s * 7.35 + 0.8, 0.032, -2.15 + j * 0.27],
          [s * 7.35 - 0.8, 0.032, -2.15 + j * 0.27]
        ],
        m.mix(flag, flagLight, 0.3 + 0.3 * (j % 2))
      );
  }
  pondBridge(m);
}
// 池上曲橋: the body of the bridge under its slabs: three small arches standing in the lotus
// pond, and a low kerb with four posts along each side, clear of the tile centres.
function pondBridge(m) {
  const top = -0.055,
    spring = -0.98,
    crown = -0.26,
    seg = 7;
  put(
    m,
    [
      [-1.5, top, -0.47],
      [-1.5, top, 0.47],
      [1.5, top, 0.47],
      [1.5, top, -0.47]
    ],
    masonry
  );
  const curve = (x0, x1, i) => {
    const u = -1 + (2 * i) / seg;
    return [
      (x0 + x1) / 2 + (u * (x1 - x0)) / 2,
      spring + (crown - spring) * Math.sqrt(Math.max(0, 1 - u * u))
    ];
  };
  for (let k = -1; k <= 1; k++) {
    const x0 = k - 0.41,
      x1 = k + 0.41;
    for (let i = 0; i < seg; i++) {
      const [ax, ay] = curve(x0, x1, i),
        [bx, by] = curve(x0, x1, i + 1);
      for (const s of [-1, 1])
        put(
          m,
          [
            [ax, ay, s * 0.47],
            [bx, by, s * 0.47],
            [bx, top, s * 0.47],
            [ax, top, s * 0.47]
          ],
          m.mix(coping, masonry, 0.4),
          [0, 0, s]
        );
      put(
        m,
        [
          [ax, ay, -0.47],
          [bx, by, -0.47],
          [bx, by, 0.47],
          [ax, ay, 0.47]
        ],
        0x232b38,
        [0, -1, 0]
      );
    }
  }
  // A ring of lighter voussoirs round each arch.
  for (let k = -1; k <= 1; k++)
    for (const s of [-1, 1]) {
      const ring = [];
      for (let i = 0; i <= seg; i++) {
        const [x, y] = curve(k - 0.41, k + 0.41, i);
        ring.push([x, y + 0.02, s * 0.475]);
      }
      m.line(ring, 0.022, marble, 4);
    }
  // Piers between the arches.
  for (const x of [-1.5, -0.5, 0.5, 1.5])
    m.box(x, (top + FLOOR) / 2, 0, 0.18, top - FLOOR, 0.94, m.mix(coping, masonry, 0.5));
  for (const s of [-1, 1]) {
    m.box(0, 0.085, s * 0.455, 3, 0.075, 0.06, marble);
    m.box(0, 0.02, s * 0.455, 3, 0.07, 0.075, marbleShade);
    for (const x of [-1.5, -0.5, 0.5, 1.5]) {
      m.box(x, 0.115, s * 0.455, 0.09, 0.23, 0.09, marble);
      m.lathe(
        x,
        0.23,
        s * 0.455,
        [
          [0, 0.034],
          [0.03, 0.05],
          [0.07, 0.03],
          [0.09, 0]
        ],
        marble,
        5
      );
    }
  }
}

// 正殿: the terrace with its steps and carved ramp, and the hall: lit lattice doors between red
// columns, a painted architrave, a deep green-tiled hip roof, a row of lanterns under the eave.
function hall(m) {
  const back = -11.9,
    side = 7.2;
  pave(m, -side, side, back, FRONT, TERRACE, 0.82, 0x505d73, 0x6f7b92);
  // Terrace walls: a moulded base, a plain die and a projecting coping.
  const face = (ax, az, bx, bz, hint) => {
    upright(m, ax, az, bx, bz, TERRACE - 0.14, TERRACE, marble, hint);
    upright(m, ax, az, bx, bz, TERRACE - 0.2, TERRACE - 0.14, mortar, hint, 3);
    upright(m, ax, az, bx, bz, 0.2, TERRACE - 0.2, marbleShade, hint);
    upright(m, ax, az, bx, bz, 0.1, 0.2, mortar, hint, 3);
    upright(m, ax, az, bx, bz, -0.62, 0.1, coping, hint);
    upright(m, ax, az, bx, bz, FLOOR, -0.62, m.mix(masonry, 0x18202c, 0.55), hint, 3);
  };
  face(-side, FRONT, -2.74, FRONT, [0, 0, 1]);
  face(2.74, FRONT, side, FRONT, [0, 0, 1]);
  face(-side, back, -side, FRONT, [-1, 0, 0]);
  face(side, FRONT, side, back, [1, 0, 0]);
  face(-side, back, side, back, [0, 0, -1]);
  // Six steps from the board's edge, in two flights beside a carved ramp. They are dark 青石,
  // paling only toward the top, so a white figure standing before them reads at once.
  for (let i = 1; i <= 6; i++) {
    const top = 0.04 + 0.14 * i,
      z0 = -5.5 - 0.22 * (i - 1),
      tone = i <= 4 ? (i % 2 ? stepDark : m.mix(stepDark, mortar, 0.25)) : m.mix(stepDark, marbleShade, 0.4);
    m.box(0, (top + FLOOR) / 2, (z0 + FRONT) / 2, 5, top - FLOOR, z0 - FRONT, tone);
    // A worn nosing along the outer flights, clear of the ramp.
    for (const s of [-1, 1])
      m.box(s * 1.56, top + 0.004, z0 - 0.03, 1.8, 0.012, 0.05, m.mix(stepDark, marbleShade, 0.35));
  }
  const ramp = (x0, x1, lift, col) =>
    put(
      m,
      [
        [x0, 0.1 + lift, -5.5],
        [x1, 0.1 + lift, -5.5],
        [x1, TERRACE + lift, -6.8],
        [x0, TERRACE + lift, -6.8]
      ],
      col
    );
  ramp(-0.62, 0.62, 0.035, m.mix(stepDark, mortar, 0.35));
  ramp(-0.5, 0.5, 0.045, m.mix(stepDark, mortar, 0.15));
  for (const s of [-1, 1]) {
    put(
      m,
      [
        [s * 0.62, 0.04, -5.5],
        [s * 0.62, 0.135, -5.5],
        [s * 0.62, TERRACE + 0.035, -6.8],
        [s * 0.62, TERRACE, -6.8]
      ],
      marbleShade,
      [s, 0, 0]
    );
    // Cheek walls down the outside of each flight.
    const x0 = s * 2.5,
      x1 = s * 2.74;
    put(
      m,
      [
        [x0, 0.22, -5.5],
        [x1, 0.22, -5.5],
        [x1, TERRACE + 0.12, -6.72],
        [x0, TERRACE + 0.12, -6.72]
      ],
      marble
    );
    put(
      m,
      [
        [x1, FLOOR, -5.5],
        [x1, 0.22, -5.5],
        [x1, TERRACE + 0.12, -6.72],
        [x1, TERRACE + 0.12, FRONT],
        [x1, FLOOR, FRONT]
      ],
      marbleShade,
      [s, 0, 0]
    );
    put(
      m,
      [
        [x0, FLOOR, -5.5],
        [x1, FLOOR, -5.5],
        [x1, 0.22, -5.5],
        [x0, 0.22, -5.5]
      ],
      marbleShade,
      [0, 0, 1]
    );
    put(
      m,
      [
        [x0, 0.18, -5.5],
        [x0, 0.22, -5.5],
        [x0, TERRACE + 0.12, -6.72],
        [x0, TERRACE, -6.72]
      ],
      marbleShade,
      [-s, 0, 0]
    );
    m.box(s * 2.62, TERRACE + 0.06, -6.79, 0.26, 0.12, 0.14, marble);
    // Balustrade along the front and down the sides of the terrace.
    stoneRail(m, s * 2.86, FRONT - 0.1, s * (side - 0.1), FRONT - 0.1, TERRACE, 0.42);
    stoneRail(m, s * (side - 0.1), FRONT - 0.1, s * (side - 0.1), back + 0.1, TERRACE, 0.42);
    // Lamp pillars at the head of the steps and the front corners.
    for (const [x, z, k] of [
      [3.25, FRONT - 0.5, 0.95],
      [6.55, FRONT - 0.55, 0.95]
    ])
      m.frame(s * x, TERRACE, z, 0, 1, () => stoneLamp(m, k));
  }
  // Relief on the ramp: lozenges of cloud scroll.
  for (let k = 0; k < 4; k++) {
    const t = 0.16 + k * 0.23,
      y = 0.1 + (TERRACE - 0.1) * t + 0.052,
      z = -5.5 - 1.3 * t;
    put(
      m,
      [
        [0, y - 0.075, z + 0.12],
        [0.3, y, z],
        [0, y + 0.075, z - 0.12],
        [-0.3, y, z]
      ],
      k % 2 ? m.mix(stepDark, marbleShade, 0.25) : m.mix(stepDark, mortar, 0.45)
    );
  }
  // The hall stands on its own low plinth.
  const floor = TERRACE + 0.12,
    colZ = -7.75,
    wallZ = -7.86,
    rear = -10.75,
    posts = [-5, -3.65, -2.3, -0.95, 0.95, 2.3, 3.65, 5],
    high = 2.0;
  m.box(0, TERRACE + 0.06, -9.25, 11.1, 0.12, 4.1, marble);
  m.box(0, TERRACE + 0.03, -7.1, 2.4, 0.06, 0.34, marbleShade);
  // Body: red walls round the back and sides, a dark core up under the roof.
  m.box(0, floor + high / 2, (wallZ + rear) / 2 - 0.02, 10, high, wallZ - rear - 0.04, wallRed);
  m.box(0, floor + 0.2, (wallZ + rear) / 2 - 0.02, 10.06, 0.4, wallZ - rear, marbleShade);
  m.box(0, floor + high + 0.36, -9.3, 9.7, 0.72, 2.6, 0x1c2026);
  for (const x of posts) column(m, x, colZ, floor, high, 0.1);
  for (const s of [-1, 1]) {
    column(m, s * 5, rear, floor, high, 0.1);
    column(m, s * 5, (colZ + rear) / 2, floor, high, 0.1);
  }
  // Seven bays: the middle door stands open on the lamplit hall, the others are lattice.
  for (let i = 0; i < 7; i++) {
    const x0 = posts[i] + 0.1,
      x1 = posts[i + 1] - 0.1,
      cx = (x0 + x1) / 2,
      w = x1 - x0,
      door = i > 0 && i < 6,
      sill = door ? 0.3 : 0.85,
      top = high - 0.28;
    m.box(cx, floor + sill / 2, wallZ + 0.02, w, sill, 0.06, door ? lacquerDark : marbleShade);
    m.box(cx, floor + top + 0.14, wallZ + 0.02, w, 0.28, 0.06, teal);
    if (i === 3) {
      m.glow(() =>
        put(
          m,
          [
            [x0 + 0.3, floor + 0.02, wallZ + 0.035],
            [x1 - 0.3, floor + 0.02, wallZ + 0.035],
            [x1 - 0.3, floor + top, wallZ + 0.035],
            [x0 + 0.3, floor + top, wallZ + 0.035]
          ],
          0xe9a652,
          [0, 0, 1]
        )
      );
      for (const s of [-1, 1])
        m.frame(
          cx + s * (w / 2 - 0.15),
          floor + top / 2 + 0.01,
          wallZ + 0.06,
          0,
          1,
          () => lattice(m, 0.28, top - 0.06, 1, 6)
        );
      // The name board over the door.
      m.box(cx, floor + high + 0.02, colZ + 0.16, 0.9, 0.36, 0.05, 0x23406a);
      m.box(cx, floor + high + 0.02, colZ + 0.19, 0.62, 0.16, 0.02, gilt);
    } else
      m.frame(cx, floor + (sill + top) / 2, wallZ + 0.055, 0, 1, () =>
        lattice(m, w - 0.06, top - sill - 0.06, door ? 4 : 5, door ? 6 : 4)
      );
  }
  m.frame(0, floor + high - 0.12, colZ, 0, 1, () => beam(m, 10.3, 0, 0.14, false));
  m.frame(0, floor + high - 0.12, rear, 0, 1, () => beam(m, 10.3, 0, 0.14, false));
  for (const s of [-1, 1])
    m.frame(
      s * 5,
      floor + high - 0.12,
      (colZ + rear) / 2,
      Math.PI / 2,
      1,
      () => beam(m, colZ - rear, 0, 0.14, false)
    );
  // 斗拱: bracket sets over every column and in every bay carry the deep eaves.
  const tier = floor + high + 0.07,
    sides = [colZ, (colZ + rear) / 2, rear];
  bracketRow(m, posts, tier, colZ, 1, 0.9);
  bracketRow(m, posts, tier, -rear, 1, 0.9, Math.PI);
  bracketRow(m, sides.map((z) => -z), tier, 5, 1, 0.9, Math.PI / 2);
  bracketRow(m, sides.reverse(), tier, 5, 1, 0.9, -Math.PI / 2);
  // The roof, and a row of lanterns hung from its front eave.
  const eave = floor + high + 0.52,
    roofZ = -9.3,
    depth = 4.4,
    width = 11.7;
  m.frame(0, 0, roofZ, 0, 1, () =>
    tiledRoof(m, width, depth, eave, 1.75, { lift: 0.4, rows: 6, beasts: 5 })
  );
  // Bronze cranes on the porch and great bronze water vats on the terrace beside the hall.
  for (const s of [-1, 1]) {
    m.frame(s * 4.32, floor, -7.42, s * 0.5, 1, () => bronzeCrane(m));
    for (const z of [-8.6, -10.4]) m.frame(s * 6.38, TERRACE, z, 0, 1, () => waterVat(m));
  }
  for (let i = 0; i < 7; i++) {
    const x = (posts[i] + posts[i + 1]) / 2,
      s = x / (width / 2),
      y = eave + 0.4 * Math.pow(Math.abs(s), 3.2);
    palaceLamp(m, x * 1.04, y - 0.78, roofZ + depth / 2 + 0.12, i === 3 ? 1.05 : 0.9);
  }
}

// 西迴廊: a roofed gallery down the west bank: red columns on a plinth, a back wall with lit
// windows, a raised gate roof where the guards come in, and a water pavilion at its south end.
function gallery(m) {
  const front = -8.55,
    rear = -10.15,
    floor = GROUND + 0.1,
    high = 1.9,
    posts = [];
  for (let k = -4; k <= 4; k++) posts.push(-2 + 1.36 * k - 0.68);
  posts.push(-2 + 1.36 * 4 + 0.68);
  const z0 = posts[0],
    z1 = posts.at(-1),
    mid = (z0 + z1) / 2;
  m.box(
    (front + rear) / 2,
    GROUND + 0.05,
    mid,
    front - rear + 0.5,
    0.1,
    z1 - z0 + 0.5,
    marbleShade
  );
  pave(m, rear - 0.2, front + 0.2, z0 - 0.2, z1 + 0.2, floor + 0.02, 0.66, 0x55617a, 0x707c94);
  // Back wall: white plaster over a red dado, pierced by lit lattice windows.
  m.box(rear - 0.04, floor + high / 2, mid, 0.14, high, z1 - z0, plaster);
  m.box(rear + 0.01, floor + 0.3, mid, 0.16, 0.6, z1 - z0 + 0.02, wallRed);
  for (let i = 0; i < posts.length; i++) {
    const z = posts[i];
    column(m, front, z, floor, high, 0.075);
    m.box(rear + 0.04, floor + high / 2, z, 0.14, high, 0.15, lacquer);
    if (i === posts.length - 1) break;
    const zc = (z + posts[i + 1]) / 2,
      gate = Math.abs(zc + 2) < 0.1;
    if (i % 2 === 1 && !gate)
      m.frame(rear + 0.04, floor + 1.15, zc, Math.PI / 2, 1, () => lattice(m, 0.62, 0.62, 4, 4));
    // A bench rail between the columns, open at the gate; a lantern in every bay.
    if (!gate) {
      m.box(front, floor + 0.3, zc, 0.12, 0.045, 1.2, lacquerDark);
      for (let j = -2; j <= 2; j++)
        m.box(front, floor + 0.15, zc + j * 0.25, 0.03, 0.3, 0.03, lacquerDark);
    }
    if (gate)
      for (const s of [-1, 1])
        palaceLamp(m, front + 0.42, floor + high - 0.52, zc + s * 0.42, 0.85);
    else palaceLamp(m, front + 0.48, floor + high - 0.42, zc, 0.62, 0xf0a04c);
  }
  m.frame(front, floor + high - 0.2, mid, Math.PI / 2, 1, () => {
    m.box(0, 0.09, 0, z1 - z0 + 0.2, 0.16, 0.12, teal);
    m.box(0, 0.0, 0, z1 - z0 + 0.2, 0.03, 0.14, gilt);
  });
  m.frame((front + rear) / 2, 0, mid, Math.PI / 2, 1, () =>
    tiledRoof(
      m,
      z1 - z0 + 0.9,
      2.7,
      floor + high + 0.05,
      0.8,
      { hip: 0, gable: true, lift: 0.14, tile: 0.3 }
    )
  );
  // The gate: a short storey of painted boards and a roof of its own above the gallery's.
  m.box((front + rear) / 2, floor + high + 0.55, -2, front - rear + 0.5, 0.5, 1.7, teal);
  m.box((front + rear) / 2, floor + high + 0.32, -2, front - rear + 0.56, 0.06, 1.76, gilt);
  m.box(front + 0.3, floor + high + 0.2, -2, 0.05, 0.3, 0.8, 0x23406a);
  m.frame((front + rear) / 2, 0, -2, Math.PI / 2, 1, () =>
    tiledRoof(m, 2.5, 3.2, floor + high + 0.72, 0.8, { hip: 0.6, lift: 0.3 })
  );
  // A balustrade along the water, open at the bridge.
  stoneRail(m, -BANK - 0.12, FRONT + 0.15, -BANK - 0.12, -2.62, GROUND, 0.4);
  stoneRail(m, -BANK - 0.12, -1.38, -BANK - 0.12, 8.1, GROUND, 0.4);
  // Steps from the north end of the gallery up to the terrace.
  for (let i = 1; i <= 6; i++) {
    const top = GROUND + ((TERRACE - GROUND) * i) / 6,
      x0 = -8.25 + 0.17 * (i - 1);
    m.box(
      (x0 - 7.2) / 2,
      top / 2,
      -8.0,
      -7.2 - x0,
      top,
      1.1,
      i % 2 ? marble : m.mix(marble, marbleShade, 0.5)
    );
  }
  // 水亭: a square pavilion on a plinth at the gallery's south end, over the water's edge.
  m.frame(-9.35, 0, z1 + 1.85, 0, 1, () => {
    const base = GROUND + 0.2;
    m.box(0, GROUND + 0.1, 0, 2.7, 0.2, 2.7, marbleShade);
    m.box(0, GROUND + 0.05, 0, 3.0, 0.1, 3.0, coping);
    pave(m, -1.3, 1.3, -1.3, 1.3, base + 0.02, 0.65, 0x55617a, 0x707c94);
    for (const i of [-1, 1])
      for (const j of [-1, 1]) {
        column(m, i * 1.05, j * 1.05, base, 2.05, 0.085);
        palaceLamp(m, i * 1.5, base + 1.62, j * 1.5, 0.6, 0xf0a04c);
      }
    for (const [yaw, open] of [
      [0, false],
      [Math.PI / 2, false],
      [Math.PI, true],
      [-Math.PI / 2, false]
    ])
      m.frame(0, base, 0, yaw, 1, () => {
        m.box(0, 1.94, 1.05, 2.2, 0.16, 0.11, teal);
        m.box(0, 1.85, 1.05, 2.2, 0.03, 0.13, gilt);
        if (!open) {
          m.box(0, 0.32, 1.05, 1.95, 0.05, 0.14, lacquerDark);
          for (let j = -3; j <= 3; j++) m.box(j * 0.3, 0.16, 1.05, 0.035, 0.32, 0.035, lacquerDark);
        }
      });
    // A stone table and drum stools inside.
    m.lathe(
      0,
      base,
      0,
      [
        [0, 0.14],
        [0.3, 0.1],
        [0.34, 0.34],
        [0.4, 0.34]
      ],
      marble,
      8
    );
    tiledRoof(m, 3.2, 3.2, base + 2.1, 1.25, { hip: 1, lift: 0.42 });
    palaceLamp(m, 0, base + 1.5, 0, 0.8);
  });
}

// The east dyke, on the near side and kept low: balustrades, lamp pillars, a hanging-flower
// gate over the bridge where the guards come in, a scholar's rock and two flowering trees.
function eastDyke(m) {
  stoneRail(m, BANK + 0.12, FRONT + 0.15, BANK + 0.12, -2.62, GROUND, 0.4);
  stoneRail(m, BANK + 0.12, -1.38, BANK + 0.12, 8.1, GROUND, 0.4);
  stoneRail(m, 10.08, -11.8, 10.08, 10.3, GROUND, 0.4, 0.95);
  for (const z of [-5.3, 0.6, 3.2, 5.8])
    m.frame(BANK + 0.55, GROUND, z, 0, 1, () => stoneLamp(m, 1));
  // 垂花門: two red posts, painted beams, a little gable roof and a pair of lanterns.
  m.frame(BANK + 0.38, GROUND, -2, 0, 1, () => {
    for (const s of [-1, 1]) {
      column(m, 0, s * 0.74, 0, 2.05, 0.085);
      m.box(0, 0.12, s * 0.74, 0.3, 0.24, 0.3, marble);
      m.tube([0, 1.9, s * 0.98], [0, 1.42, s * 0.98], 0.05, 0.045, lacquer, 6);
      m.lathe(
        0,
        1.3,
        s * 0.98,
        [
          [0, 0.01],
          [0.05, 0.06],
          [0.12, 0.05]
        ],
        gilt,
        6
      );
      palaceLamp(m, -0.02, 1.02, s * 0.36, 0.62);
    }
    m.box(0, 1.84, 0, 0.12, 0.18, 2.2, teal);
    m.box(0, 1.64, 0, 0.09, 0.1, 1.5, lacquerDark);
    m.box(0, 1.74, 0, 0.14, 0.03, 2.2, gilt);
    m.frame(
      0,
      0,
      0,
      Math.PI / 2,
      1,
      () => tiledRoof(m, 2.5, 1.3, 2.0, 0.5, { hip: 0, gable: true, lift: 0.16, tile: 0.25 })
    );
  });
  taihuRock(m, 9.35, 1.9, 0.85);
  taihuRock(m, 9.5, -8.6, 1.0);
  plumTree(m, 9.3, 4.5, 0.95);
  plumTree(m, 9.2, -6.2, 1.0);
  plumTree(m, 8.75, -10.2, 1.15);
  // Peony beds and potted pines along the dyke, all kept below the eye.
  peonyBed(m, 9.45, 7.0, 0.8, 1.0);
  peonyBed(m, 9.45, -3.95, 0.75, 0.95);
  peonyBed(m, 8.9, -11.25, 1.3, 0.6);
  for (const [x, z] of [
    [9.7, 2.65],
    [9.7, -7.35],
    [7.95, -7.35],
    [9.7, -0.5]
  ])
    pottedPine(m, x, z, 1, m.rng.range(0, circle));
  // The pleasure boat, moored in the outer water off the dyke.
  m.frame(11.05, 0, 2.6, -Math.PI / 2, 1, () =>
    pleasureBoat(
      m,
      (w, d, eave, rise) =>
        tiledRoof(m, w, d, eave, rise, { hip: 0, gable: true, lift: 0.12, tile: 0.2, rows: 4 }),
      (x, y, z) => palaceLamp(m, x, y, z, 0.5)
    )
  );
}

// South, nearest the eye: the causeway's lamp pillars, and across the dyke a low tiled wall
// that rises to a moon gate on the axis of the hall.
function southGate(m) {
  for (const s of [-1, 1]) {
    m.frame(s * 1.52, GROUND + 0.16, 6.75, 0, 1, () => stoneLamp(m, 0.72));
    m.frame(s * 1.52, GROUND + 0.16, BANK - 0.05, 0, 1, () => stoneLamp(m, 0.72));
    stoneRail(m, s * 1.75, BANK + 0.12, s * 8.1, BANK + 0.12, GROUND, 0.36, 0.9);
  }
  const z = 9.45,
    t = 0.3,
    half = 1.85,
    top = 2.4,
    cy = 1.14,
    rad = 1.0,
    seg = 28;
  // 月洞門: a round opening through a plastered wall.
  const edge = (a) => {
    const c = Math.cos(a),
      s = Math.sin(a);
    let k = Infinity;
    if (c > 1e-6) k = Math.min(k, half / c);
    if (c < -1e-6) k = Math.min(k, -half / c);
    if (s > 1e-6) k = Math.min(k, (top - cy) / s);
    if (s < -1e-6) k = Math.min(k, (GROUND - cy) / s);
    return [c * k, cy + s * k];
  };
  for (let i = 0; i < seg; i++) {
    const a = (i * circle) / seg,
      b = ((i + 1) * circle) / seg,
      p = [Math.cos(a) * rad, cy + Math.sin(a) * rad],
      q = [Math.cos(b) * rad, cy + Math.sin(b) * rad];
    if (Math.max(p[1], q[1]) < GROUND) continue;
    const pe = edge(a),
      qe = edge(b);
    for (const s of [-1, 1])
      put(
        m,
        [
          [p[0], p[1], z + (s * t) / 2],
          [q[0], q[1], z + (s * t) / 2],
          [qe[0], qe[1], z + (s * t) / 2],
          [pe[0], pe[1], z + (s * t) / 2]
        ],
        plaster,
        [0, 0, s]
      );
    put(
      m,
      [
        [p[0], p[1], z - t / 2],
        [q[0], q[1], z - t / 2],
        [q[0], q[1], z + t / 2],
        [p[0], p[1], z + t / 2]
      ],
      marble,
      [-Math.cos(a), -Math.sin(a), 0]
    );
  }
  // The gate's corners, which the fan of faces leaves open, and its ends.
  for (const sx of [-1, 1]) {
    for (const s of [-1, 1])
      put(
        m,
        [
          [sx * half, top, z + (s * t) / 2],
          [sx * half, cy + half * Math.tan(Math.atan2(top - cy, half)), z + (s * t) / 2],
          [sx * half * 0.999, top, z + (s * t) / 2]
        ],
        plaster,
        [0, 0, s]
      );
    put(
      m,
      [
        [sx * half, GROUND, z - t / 2],
        [sx * half, GROUND, z + t / 2],
        [sx * half, top, z + t / 2],
        [sx * half, top, z - t / 2]
      ],
      plaster,
      [sx, 0, 0]
    );
  }
  m.box(0, GROUND + 0.02, z, 1.2, 0.05, t + 0.1, marbleShade);
  m.frame(
    0,
    0,
    z,
    0,
    1,
    () => tiledRoof(
      m,
      half * 2 + 0.5,
      0.9,
      top,
      0.3,
      { hip: 0, gable: true, lift: 0.12, tile: 0.3 }
    )
  );
  // Low walls either side under a tile coping, ending in lamp pillars.
  for (const s of [-1, 1]) {
    const x0 = s * half,
      x1 = s * 8.0,
      cx = (x0 + x1) / 2,
      len = Math.abs(x1 - x0);
    m.box(cx, GROUND + 0.5, z, len, 1.0, 0.24, plaster);
    m.box(cx, GROUND + 0.12, z, len + 0.02, 0.24, 0.28, marbleShade);
    m.frame(cx, 0, z, 0, 1, () => wallCoping(m, len, GROUND + 1.0, 0.31, 0.2));
    m.frame(s * 8.55, GROUND, z, 0, 1, () => stoneLamp(m, 1));
    m.frame(s * 2.45, GROUND, z - 0.75, 0, 1, () => stoneLamp(m, 0.8));
    peonyBed(m, s * 4.3, z - 0.55, 1.5, 0.48);
    peonyBed(m, s * 6.5, z - 0.55, 1.5, 0.48);
  }
}

// One lotus leaf: a shallow dish with a notch, lifted on its stalk above the water.
function lotusPad(m, x, y, z, rad, tilt) {
  const r = m.rng,
    n = 9,
    turn = r.range(0, circle),
    c = m.mix(lotusLeaf, lotusRim, r.range(0, 0.5)),
    rim = m.mix(c, lotusRim, 0.7);
  const ring = [];
  for (let i = 0; i <= n; i++) {
    const a = turn + 0.2 + (i / n) * (circle - 0.4);
    ring.push([
      x + Math.cos(a) * rad,
      y + rad * (0.16 + 0.07 * Math.sin(i * 2.1)) + Math.cos(a - turn) * tilt * rad,
      z + Math.sin(a) * rad
    ]);
  }
  for (let i = 0; i < n; i++)
    m.face([[x, y, z], ring[i + 1], ring[i]], [m.rgb(lotusLeaf), rim, rim]);
  if (y > WATER + 0.06) m.tube([x, WATER - 0.05, z], [x, y, z], 0.012, 0.01, 0x3f6b4c, 3);
}
// A bud or an open flower on a tall stalk.
function lotusBloom(m, x, y, z, open) {
  m.tube([x + 0.03, WATER - 0.05, z], [x, y, z], 0.011, 0.009, 0x4a7450, 3);
  if (!open) {
    m.lathe(
      x,
      y,
      z,
      [
        [0, 0.012],
        [0.035, 0.036],
        [0.08, 0.03],
        [0.125, 0]
      ],
      petal,
      5
    );
    return;
  }
  for (let i = 0; i < 10; i++) {
    const a = (i * circle) / 5 + (i > 4 ? 0.6 : 0),
      l = i > 4 ? 0.07 : 0.1;
    m.leaf(
      [x, y, z],
      [x + Math.cos(a) * l, y + l * (i > 4 ? 1.0 : 0.5), z + Math.sin(a) * l],
      l * 0.34,
      petal,
      0xf6cfd0,
      l * 0.12
    );
  }
  m.box(x, y + 0.035, z, 0.03, 0.03, 0.03, 0xe6c15a);
}
// A lotus seed head left when the petals have fallen, its flat face dotted with seeds.
function seedHead(m, x, y, z) {
  m.tube([x - 0.02, WATER - 0.05, z], [x, y, z], 0.01, 0.009, 0x4a7450, 3);
  m.lathe(
    x,
    y,
    z,
    [
      [0, 0.012],
      [0.03, 0.04],
      [0.055, 0.052],
      [0.06, 0]
    ],
    0x7f8f55,
    7
  );
  for (let i = 0; i < 4; i++) {
    const a = (i * circle) / 4;
    m.box(x + Math.cos(a) * 0.025, y + 0.062, z + Math.sin(a) * 0.025, 0.012, 0.006, 0.012, 0x4b5634);
  }
}
// 河燈: a paper lotus set adrift with a candle in it.
function riverLamp(m, x, z) {
  const y = WATER + 0.012;
  for (let i = 0; i < 6; i++) {
    const a = (i * circle) / 6;
    m.leaf(
      [x, y, z],
      [x + Math.cos(a) * 0.1, y + 0.05, z + Math.sin(a) * 0.1],
      0.04,
      0xd98a98,
      0xf2bfc0,
      0.02
    );
  }
  m.glow(() => m.box(x, y + 0.055, z, 0.06, 0.08, 0.06, 0xf8c670));
}
// The lotus of the pond and the moat: leaves standing high in the two wells either side of
// the bridge, flatter drifts along the moat, pink buds, and lamps set adrift.
function lotusWater(m) {
  const r = m.rng;
  for (const zc of [-1, 1]) {
    for (let i = 0; i < 26; i++) {
      const x = -1.34 + ((i % 13) / 12) * 2.68 + r.range(-0.07, 0.07),
        z = zc + (i < 13 ? -0.2 : 0.22) + r.range(-0.1, 0.1);
      lotusPad(m, x, r.range(-0.62, -0.17), z, r.range(0.13, 0.2), r.range(-0.25, 0.25));
    }
    for (let i = 0; i < 7; i++)
      lotusPad(
        m,
        r.range(-1.3, 1.3),
        WATER + 0.01,
        zc + r.range(-0.36, 0.36),
        r.range(0.1, 0.16),
        0
      );
    for (let i = 0; i < 7; i++)
      lotusBloom(
        m,
        -1.2 + i * 0.4 + r.range(-0.08, 0.08),
        r.range(-0.2, 0.04),
        zc + r.range(-0.24, 0.24),
        i % 3 === 1
      );
    riverLamp(m, -0.72 * zc, zc - 0.36);
    riverLamp(m, 0.55 * zc, zc - 0.3);
  }
  // Drifts in the moat: in the cut corners of the island and along the banks.
  const drifts = [
    [-5.6, -5.0, 0.8, 0.5, 9],
    [5.6, -5.0, 0.8, 0.5, 9],
    [-5.7, 5.0, 0.8, 0.5, 9],
    [5.7, 5.0, 0.8, 0.5, 9],
    [-7.5, 1.6, 0.4, 1.6, 12],
    [-7.4, -4.6, 0.45, 1.0, 8],
    [7.45, 2.0, 0.4, 1.7, 12],
    [7.4, -4.8, 0.45, 0.9, 7],
    [-3.6, 7.1, 1.4, 0.7, 12],
    [3.9, 7.0, 1.5, 0.75, 13],
    [-4.6, -6.25, 1.2, 0.32, 7],
    [4.6, -6.25, 1.2, 0.32, 7],
    // Out in the open water beyond the dykes.
    [12.4, 6.6, 0.9, 1.2, 12],
    [12.6, -1.6, 0.8, 0.9, 9],
    [-3.2, 12.0, 1.4, 0.8, 12],
    [5.4, 12.2, 1.2, 0.8, 11],
    [12.2, 11.6, 1.0, 0.9, 10],
    [-9.0, 12.4, 1.2, 0.7, 9]
  ];
  for (const [cx, cz, rx, rz, n] of drifts) {
    for (let i = 0; i < n; i++) {
      const a = r.range(0, circle),
        d = Math.sqrt(r.next()),
        x = cx + Math.cos(a) * d * rx,
        z = cz + Math.sin(a) * d * rz,
        high = i % 3 === 0;
      lotusPad(
        m,
        x,
        high ? WATER + r.range(0.18, 0.42) : WATER + 0.012,
        z,
        r.range(0.14, 0.24),
        high ? r.range(-0.25, 0.25) : 0
      );
      if (i % 4 === 1) lotusBloom(m, x + 0.2, WATER + r.range(0.3, 0.55), z + 0.1, i % 8 === 1);
      if (i % 5 === 3) seedHead(m, x - 0.15, WATER + r.range(0.35, 0.6), z - 0.12);
    }
  }
  for (const [x, z] of [
    [-7.3, -0.4],
    [-7.6, 3.6],
    [7.2, 0.3],
    [7.5, 4.4],
    [-2.3, 6.4],
    [2.6, 6.2],
    [5.4, 7.4],
    [-5.9, 6.9],
    [-6.1, -5.9],
    [6.2, -5.8],
    [12.0, 3.5],
    [11.4, 8.9],
    [3.0, 11.6],
    [-4.5, 11.9]
  ])
    riverLamp(m, x, z);
}

// A lesser hall of the palace: a dark body under a tiled roof, a few windows still lit.
function sideHall(m, x, z, yaw, w, d, h, lit) {
  m.frame(x, GROUND, z, yaw, 1, () => {
    m.box(0, 0.12, 0, w + 0.5, 0.24, d + 0.5, coping);
    m.box(0, 0.24 + h / 2, 0, w, h, d, wallRed);
    for (let i = 0; i < lit; i++) {
      const u = lit === 1 ? 0 : -0.5 + i / (lit - 1);
      m.frame(
        u * (w - 1.3),
        0.24 + h * 0.55,
        d / 2 + 0.02,
        0,
        1,
        () => lattice(m, 0.8, h * 0.5, 3, 3)
      );
    }
    for (const s of [-1, 1]) column(m, s * (w / 2), d / 2, 0.24, h, 0.09);
    tiledRoof(m, w + 1.5, d + 1.5, 0.24 + h + 0.05, h * 0.62, { lift: 0.32, tile: 0.42 });
    for (const s of [-1, 1]) palaceLamp(m, s * (w / 2 + 0.2), h - 0.25, d / 2 + 0.72, 0.7);
  });
}
// The palace beyond the garden: pines and willows, flowering trees by the terrace, two lesser
// halls, and the red inner wall that closes the grounds on the west and north.
function palaceGrounds(m) {
  for (const [x, z, s] of [
    [-12.2, -4.8, 1.25],
    [-13.4, -1.2, 1.0],
    [-12.0, 1.8, 1.15],
    [-14.6, 4.6, 1.3],
    [-12.6, 7.6, 1.0],
    [-16.5, -3.4, 1.35],
    [-11.9, -10.6, 1.2],
    [-9.2, -14.2, 1.3],
    [-4.4, -13.8, 1.1],
    [5.2, -14.0, 1.25],
    [8.9, -13.4, 1.05],
    [0.6, -15.6, 1.4],
    [-17.2, 8.2, 1.2]
  ])
    oldPine(m, x, z, s);
  trailingWillow(m, -9.6, 8.9, 1.05, 2.4);
  trailingWillow(m, -11.6, -7.9, 0.9, 0.4);
  trailingWillow(m, -12.4, 9.6, 0.95, 3.0, 18);
  plumTree(m, -9.0, -10.4, 1.2);
  plumTree(m, -11.3, 5.9, 1.05);
  plumTree(m, -11.4, -3.0, 1.0);
  taihuRock(m, -11.2, 0.2, 1.15);
  taihuRock(m, -13.6, 3.0, 0.9);
  // Cypress in pairs before the lesser halls, bamboo behind the gallery, a stone table.
  for (const [x, z] of [
    [-13.2, -7.6],
    [-13.2, -10.8],
    [-5.6, -15.4],
    [-0.8, -15.4]
  ])
    cypress(m, x, z, 1.1);
  for (const [x, z, s] of [
    [-11.2, -5.6, 1],
    [-11.0, 3.4, 0.9],
    [-11.4, -1.6, 0.85],
    [-6.8, -12.6, 1]
  ])
    bamboo(m, x, z, s);
  stoneTable(m, -14.0, -2.6, 1);
  sideHall(m, -15.2, -9.2, Math.PI / 2, 4.6, 2.6, 1.9, 3);
  sideHall(m, -3.2, -17.2, 0, 5.2, 2.6, 2.0, 3);
  // Inner wall under a tile coping, with a lamp pillar at each turn.
  const wall = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az),
      yaw = Math.atan2(-(bz - az), bx - ax);
    m.frame((ax + bx) / 2, GROUND, (az + bz) / 2, yaw, 1, () => {
      m.box(0, 0.95, 0, len, 1.9, 0.3, wallRed);
      m.box(0, 0.2, 0, len + 0.02, 0.4, 0.36, masonry);
      wallCoping(m, len + 0.3, 1.9, 0.4, 0.26);
    });
  };
  wall(-19.6, -19.6, -19.6, 10.2);
  wall(-19.6, -19.6, 10.0, -19.6);
}

// A far roof: a dark block under a plain hipped roof with lifted corners.
function farHall(m, x, z, yaw, w, d, h, rise, base = 0) {
  const body = 0x18203a,
    tile = 0x222c47,
    edge = 0x33405e;
  m.frame(x, base, z, yaw, 1, () => {
    m.box(0, h / 2, 0, w, h, d, body);
    const e = h,
      ow = w / 2 + 0.9,
      od = d / 2 + 0.9,
      rw = Math.max(0, w / 2 - d / 2),
      lift = 0.45;
    const corners = [
      [-ow, e + lift, od],
      [ow, e + lift, od],
      [ow, e + lift, -od],
      [-ow, e + lift, -od]
    ];
    const l = [-rw, e + rise, 0],
      r = [rw, e + rise, 0];
    const mids = [
      [0, e, od],
      [ow, e, 0],
      [0, e, -od],
      [-ow, e, 0]
    ];
    put(m, [corners[0], mids[0], l], tile);
    put(m, [mids[0], r, l], edge);
    put(m, [mids[0], corners[1], r], tile);
    put(m, [corners[1], mids[1], r], edge);
    put(m, [mids[1], corners[2], r], tile);
    put(m, [corners[2], mids[2], r], tile);
    put(m, [mids[2], l, r], edge);
    put(m, [mids[2], corners[3], l], tile);
    put(m, [corners[3], mids[3], l], edge);
    put(m, [mids[3], corners[0], l], tile);
    m.box(0, e + rise + 0.12, 0, rw * 2 + 0.5, 0.3, 0.3, edge);
  });
}
// Far off, against the stars: the roofs of the palace city, its wall and gate towers, and
// banks of pale mist lying on the water between.
function farPalace(m) {
  const r = m.rng;
  const stone = 0x161d33,
    cap = 0x2a3552;
  // The city wall, a square about the palace, with a tower over each gate and each corner.
  const reach = 43;
  for (const [ax, az, bx, bz] of [
    [-reach, -reach, reach, -reach],
    [-reach, -reach, -reach, reach],
    [reach, -reach, reach, reach],
    [-reach, reach, reach, reach]
  ]) {
    const len = Math.hypot(bx - ax, bz - az),
      yaw = Math.atan2(-(bz - az), bx - ax);
    m.frame((ax + bx) / 2, WATER, (az + bz) / 2, yaw, 1, () => {
      m.box(0, 2.3, 0, len, 4.6, 2.4, stone);
      m.box(0, 4.75, 0, len, 0.3, 2.7, cap);
      for (let i = -11; i <= 11; i++) m.box((i * len) / 23, 5.15, 1.2, 1.5, 0.6, 0.3, cap);
    });
  }
  for (const [x, z, yaw, big] of [
    [0, -reach, 0, 1],
    [-reach, 0, Math.PI / 2, 1],
    [reach, 0, Math.PI / 2, 1],
    [0, reach, 0, 1],
    [-reach, -reach, 0, 0],
    [reach, -reach, 0, 0],
    [-reach, reach, 0, 0],
    [reach, reach, 0, 0],
    [-21, -reach, 0, 0],
    [21, -reach, 0, 0],
    [-reach, -21, Math.PI / 2, 0],
    [-reach, 21, Math.PI / 2, 0]
  ]) {
    const y = WATER + 4.6;
    if (big) {
      farHall(m, x, z, yaw, 11, 5, 3, 2.2, y);
      farHall(m, x, z, yaw, 8, 3.6, 2.6, 2.4, y + 3.6);
    } else farHall(m, x, z, yaw, 5, 4.4, 2.6, 2.2, y);
  }
  // Palace roofs between the garden and the wall, thickest to the north and west.
  for (const [x, z, yaw, w, d, h, rise] of [
    [-27, -8, Math.PI / 2, 10, 5, 3.4, 2.6],
    [-28, 6, Math.PI / 2, 8, 4.5, 3.0, 2.4],
    [-33, -22, Math.PI / 2, 9, 5, 4.4, 2.8],
    [-25, -27, 0, 9, 5, 3.6, 2.6],
    [-10, -29, 0, 13, 6, 4.6, 3.2],
    [6, -30, 0, 10, 5, 3.6, 2.6],
    [20, -27, 0, 9, 5, 3.2, 2.4],
    [-34, 20, Math.PI / 2, 8, 4.5, 3.2, 2.4],
    [27, -14, Math.PI / 2, 8, 4.5, 3.0, 2.4],
    [29, 6, Math.PI / 2, 9, 5, 3.4, 2.4],
    [26, 24, Math.PI / 2, 8, 4.5, 3.0, 2.3],
    [-8, 30, 0, 10, 5, 3.2, 2.4],
    [12, 31, 0, 9, 5, 3.0, 2.3]
  ]) {
    m.box(x, WATER + 0.5, z, yaw ? d + 5 : w + 5, 1.0, yaw ? w + 5 : d + 5, stone);
    farHall(m, x, z, yaw, w, d, h, rise, WATER + 1.0);
  }
  // A storeyed tower stands over the roofs to the north-west, under the moon.
  for (let k = 0; k < 3; k++)
    farHall(m, -22, -33, 0, 7 - k * 1.4, 6 - k * 1.2, 3, 2.0, WATER + 1 + k * 3.7);
  m.box(-22, WATER + 0.5, -33, 12, 1.0, 11, stone);
  // An octagonal brick pagoda of eleven storeys rising over the north roofs, and a
  // drum tower on its tall terrace to the north-east, both dark against the night sky.
  m.frame(10, WATER, -37, 0.2, 1, () => {
    m.box(0, 0.6, 0, 7, 1.2, 7, stone);
    let y = 1.2,
      r = 2.1;
    for (let k = 0; k < 11; k++) {
      const h = k ? 1.05 - k * 0.03 : 2.2;
      m.lathe(
        0,
        y,
        0,
        [
          [0, r],
          [h, r * 0.97]
        ],
        0x1a2238,
        8
      );
      m.lathe(
        0,
        y + h,
        0,
        [
          [-0.05, r * 0.97],
          [0.05, r + 0.75],
          [0.22, r + 0.68],
          [0.42, r * 0.82]
        ],
        k % 2 ? 0x222c47 : 0x26304c,
        8
      );
      y += h + 0.32;
      r *= 0.93;
    }
    m.lathe(
      0,
      y,
      0,
      [
        [0, 0.5],
        [0.5, 0.36],
        [0.8, 0.12],
        [2.2, 0.04],
        [2.4, 0]
      ],
      0x3b3a3a,
      8
    );
    m.glow(() => {
      for (const k of [3, 6]) m.box(0, 1.2 + 2.5 + k * 1.2, 1.9 - k * 0.1, 0.32, 0.42, 0.1, 0xe9b060);
    });
  });
  m.frame(27, WATER, -20, -0.6, 1, () => {
    m.box(0, 3, 0, 8, 6, 6, stone);
    m.box(0, 6.15, 0, 8.4, 0.3, 6.4, cap);
    m.glow(() => m.box(0, 2.2, 3.02, 1.4, 2.2, 0.06, 0x9a6a3a));
  });
  farHall(m, 27, -20, -0.6, 5.6, 3.8, 2.4, 2.0, WATER + 6.3);
  farHall(m, 27, -20, -0.6, 4.2, 2.8, 1.8, 1.8, WATER + 9.6);
  // A few windows still lit.
  m.glow(() => {
    for (const [x, y, z] of [
      [-21.9, 5.2, -29.9],
      [-10, 3.2, -25.9],
      [-23.4, 2.6, -8],
      [6, 2.6, -27.4],
      [0, 6.4, -40.4],
      [-40.4, 6.4, 0]
    ])
      m.box(x, y + WATER, z, 0.5, 0.5, 0.12, 0xe9b060);
  });
  // Moon-pale mist: long low banks whose rims take the colour of the water.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * circle + r.range(-0.1, 0.1),
      rad = r.range(25, 40),
      x = Math.cos(a) * rad,
      z = Math.sin(a) * rad,
      len = r.range(5, 10),
      wide = r.range(1.6, 2.8),
      tone = m.mix(0x6f7fa2, 0x93a1bf, r.next());
    m.frame(x, WATER + 0.05, z, -a + Math.PI / 2 + r.range(-0.3, 0.3), 1, () => {
      const n = 10,
        low = [],
        mid = [];
      for (let k = 0; k < n; k++) {
        const t = (k * circle) / n,
          j = r.range(0.85, 1.15);
        low.push([Math.cos(t) * len * j, 0, Math.sin(t) * wide * j]);
        mid.push([Math.cos(t) * len * 0.6 * j, r.range(0.18, 0.32), Math.sin(t) * wide * 0.55 * j]);
      }
      for (let k = 0; k < n; k++) {
        const q = (k + 1) % n;
        m.face([low[k], mid[k], mid[q], low[q]], [m.rgb(0x33425f), tone, tone, m.rgb(0x33425f)]);
      }
      m.face([...mid].reverse(), tone);
    });
  }
}

// A bronze crane on a rock base, neck raised, its crown picked out in red.
function bronzeCrane(m) {
  m.lathe(
    0,
    0,
    0,
    [
      [0, 0.17],
      [0.06, 0.16],
      [0.1, 0.11],
      [0.12, 0]
    ],
    bronzeDark,
    8
  );
  for (const s of [-1, 1])
    m.line(
      [
        [s * 0.04, 0.11, 0],
        [s * 0.045, 0.32, 0.02],
        [s * 0.04, 0.5, 0]
      ],
      0.012,
      bronzeDark,
      4
    );
  m.frame(0, 0.6, 0, 0, [1, 0.8, 1.6], () =>
    m.lathe(
      0,
      -0.1,
      0,
      [
        [0, 0.02],
        [0.05, 0.09],
        [0.12, 0.1],
        [0.19, 0.06],
        [0.22, 0]
      ],
      bronze,
      8
    )
  );
  m.line(
    [
      [0, 0.66, 0.12],
      [0, 0.82, 0.16],
      [0, 1.0, 0.12],
      [0, 1.08, 0.17]
    ],
    0.022,
    bronze,
    5
  );
  m.tube([0, 1.08, 0.17], [0, 1.06, 0.33], 0.025, 0.004, giltDark, 5);
  m.box(0, 1.105, 0.17, 0.035, 0.03, 0.04, 0x8a3a2c);
  m.tube([0, 0.62, -0.18], [0, 0.66, -0.36], 0.05, 0.01, bronzeDark, 5);
}
// A great bronze water vat on a stone stand, with ring handles.
function waterVat(m) {
  m.box(0, 0.06, 0, 0.66, 0.12, 0.66, marbleShade);
  m.lathe(
    0,
    0.12,
    0,
    [
      [0, 0.22],
      [0.05, 0.27],
      [0.2, 0.33],
      [0.38, 0.31],
      [0.46, 0.28],
      [0.49, 0.3],
      [0.47, 0.26],
      [0.43, 0]
    ],
    bronze,
    14
  );
  m.lathe(
    0,
    0.55,
    0,
    [
      [0, 0.26],
      [0.004, 0.26]
    ],
    0x1e2a33,
    14
  );
  for (const s of [-1, 1]) m.hoop(s * 0.33, 0.42, 0, 0.05, 0.012, giltDark, 8, 'yz', Math.PI / 2);
}
// 鎏金香爐: a three-legged gilt bronze censer with a domed lid, embers showing under the lid's
// rim and a thread of incense rising from it. It stands on a stone drum at the foot of the steps.
function censer(m) {
  m.lathe(
    0,
    0.04,
    0,
    [
      [0, 0.37],
      [0.04, 0.39],
      [0.09, 0.34],
      [0.15, 0.34],
      [0.19, 0.38],
      [0.22, 0.36]
    ],
    marbleShade,
    10
  );
  for (let k = 0; k < 3; k++) {
    const a = (k * circle) / 3 + 0.52,
      c = Math.cos(a),
      s = Math.sin(a);
    m.line(
      [
        [c * 0.25, 0.26, s * 0.25],
        [c * 0.28, 0.38, s * 0.28],
        [c * 0.2, 0.56, s * 0.2]
      ],
      0.042,
      giltDark,
      5
    );
    m.box(c * 0.25, 0.28, s * 0.25, 0.1, 0.05, 0.1, gilt);
  }
  m.lathe(
    0,
    0.5,
    0,
    [
      [0, 0.1],
      [0.04, 0.22],
      [0.13, 0.3],
      [0.24, 0.29],
      [0.3, 0.23],
      [0.325, 0.26],
      [0.345, 0.26]
    ],
    bronze,
    12
  );
  m.hoop(0, 0.68, 0, 0.3, 0.014, giltDark, 12);
  m.glow(() =>
    m.lathe(
      0,
      0.845,
      0,
      [
        [0, 0.2],
        [0.018, 0.2]
      ],
      0xc0582c,
      10
    )
  );
  m.lathe(
    0,
    0.875,
    0,
    [
      [0, 0.25],
      [0.02, 0.24],
      [0.1, 0.19],
      [0.17, 0.1],
      [0.2, 0.04],
      [0.23, 0.05],
      [0.27, 0]
    ],
    bronzeDark,
    10
  );
  for (const s of [-1, 1]) m.hoop(s * 0.29, 0.9, 0, 0.075, 0.018, giltDark, 7, 'xy');
  // A thin thread of smoke, grey against the dark steps.
  m.line(
    [
      [0, 1.14, 0],
      [0.03, 1.32, 0.01],
      [-0.02, 1.5, -0.02],
      [0.04, 1.7, 0],
      [0, 1.9, 0.03],
      [0.05, 2.1, 0.01]
    ],
    0.008,
    0x6f7888,
    4
  );
}
// 白石欄: a short run of white stone balustrade along the back of the tile, between two
// posts with drum stones at their feet.
function balustrade(m) {
  const z = -0.37,
    h = 0.34;
  m.box(0, 0.065, z, 0.9, 0.05, 0.13, marbleShade);
  m.box(0, 0.09 + h * 0.4, z, 0.7, h * 0.56, 0.04, marbleShade);
  m.box(0, 0.09 + h * 0.86, z, 0.72, 0.05, 0.075, marble);
  for (const k of [-0.18, 0.18]) m.box(k, 0.09 + h * 0.4, z + 0.022, 0.2, h * 0.3, 0.012, marble);
  for (const s of [-1, 1]) {
    m.box(s * 0.36, 0.09 + h / 2, z, 0.095, h, 0.095, marble);
    m.lathe(
      s * 0.36,
      0.09 + h,
      z,
      [
        [0, 0.036],
        [0.03, 0.054],
        [0.075, 0.036],
        [0.105, 0]
      ],
      marble,
      6
    );
    m.tube([s * 0.445, 0.16, z - 0.022], [s * 0.445, 0.16, z + 0.022], 0.07, 0.07, marble, 8);
  }
}
// 苑中花樹: a small flowering tree in pale blossom, its slender trunk set back from the middle
// of the tile, with a low shrub beside it and fallen petals on the flags.
function gardenTree(m) {
  const r = m.rng,
    lean = r.range(-0.08, 0.08);
  const trunk = [
    [-0.2, 0.04, -0.33],
    [-0.16 + lean, 0.26, -0.3],
    [-0.2 + lean, 0.44, -0.31]
  ];
  m.line(trunk, 0.026, 0x3b302e, 5);
  for (const [x, y, z, k] of [
    [-0.34, 0.62, -0.3, 0.14],
    [-0.1, 0.68, -0.34, 0.15],
    [-0.22, 0.56, -0.2, 0.11],
    [0.06, 0.54, -0.33, 0.11]
  ]) {
    m.tube(trunk[2], [x, y - 0.05, z], 0.014, 0.008, 0x3b302e, 4);
    clump(m, x + r.range(-0.02, 0.02), y, z, k, k * 0.95, k * 0.9, 0xa98093, 0xf0d8dd, 7);
  }
  clump(m, 0.3, 0.14, -0.35, 0.13, 0.12, 0.1, 0x2f5a47, 0x5a8a62, 6);
  for (let i = 0; i < 6; i++) {
    const x = r.range(-0.42, 0.42),
      z = r.range(-0.44, -0.14);
    m.leaf([x, 0.046, z], [x + 0.045, 0.048, z + 0.03], 0.018, 0xe6b9c2, 0xf5dfe0, 0.003);
  }
}
// 御藥圃: a neat bed of low herbs in rows inside a stone edging, clear in the middle.
function physicBed(m) {
  const r = m.rng;
  for (const s of [-1, 1]) {
    m.box(0, 0.06, s * 0.43, 0.9, 0.04, 0.04, marbleShade);
    m.box(s * 0.43, 0.06, 0, 0.04, 0.04, 0.82, marbleShade);
  }
  for (const s of [-1, 1])
    put(
      m,
      [
        [-0.41, 0.047, s * 0.41],
        [0.41, 0.047, s * 0.41],
        [0.41, 0.047, s * 0.2],
        [-0.41, 0.047, s * 0.2]
      ],
      0x2c3832
    );
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      const x = -0.32 + i * 0.16,
        z = -0.32 + j * 0.16;
      if (Math.abs(z) < 0.2) continue;
      const hue = j % 2 ? 0x5f8d62 : 0x7d9a5c;
      for (let k = 0; k < 3; k++) {
        const a = (k * circle) / 3 + r.range(0, 2),
          l = r.range(0.065, 0.1);
        m.leaf(
          [x, 0.048, z],
          [x + Math.cos(a) * l, 0.075 + l * 0.6, z + Math.sin(a) * l],
          l * 0.34,
          hue,
          0xa5bd80,
          0.02
        );
      }
      if ((i + j) % 3 === 0) m.box(x, 0.12, z, 0.022, 0.022, 0.022, j % 2 ? 0xe8d6a0 : 0xd9a7c4);
    }
}
const tiles13 = {
  ground: (m, p, cell) => paveTile(m, p, cell),
  cover: (m) => balustrade(m),
  bamboo: (m) => gardenTree(m),
  herbs: (m) => physicBed(m),
  rock: (m) => m.frame(0, 0.04, 0, 0, 1, () => stoneLamp(m, 0.98)),
  crate: (m) => censer(m)
};

function landform13(T, layout) {
  const group = new T.Group();
  group.name = '西夏夜苑・環池宮苑';
  // Every lamp in the garden, the board's own lamp pillars among them.
  const lamps = layout.cells
    .filter((c) => c.kind === 'rock')
    .map((c) => [c.x - (layout.width - 1) / 2, 0.95, c.y - (layout.height - 1) / 2]);
  const make = (seed) => Object.assign(new Model(T, seed), { lamps });
  const parts = [];
  const add = (seed, draw, name, options, gain = 1) => {
    const m = make(seed);
    draw(m);
    parts.push({ m, name, options, gain });
  };
  add(130417, grounds, '石岸、堤與三橋', {});
  add(130829, hall, '正殿與月臺', { occluder: true });
  add(131251, gallery, '西迴廊與水亭', { occluder: true });
  add(131627, eastDyke, '東堤欄杆與垂花門', { occluder: true });
  add(132043, southGate, '南堤矮牆與月洞門', { occluder: true });
  add(132467, lotusWater, '荷葉、蓮苞與河燈', { cast: false }, 0.6);
  add(132851, palaceGrounds, '苑外松柳、偏殿與宮牆', { occluder: true });
  add(133279, farPalace, '遠處宮闕與城樓', { distant: true, cast: false }, 0);
  for (const { m, name, options, gain } of parts) {
    if (gain) bathe(m, lamps, gain);
    group.add(m.finish(name, options));
  }
  return group;
}

export { landform13, tiles13 };
