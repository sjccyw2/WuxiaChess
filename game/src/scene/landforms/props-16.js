// 石樑溫家's tile dressing: the screen wall (照壁) in the middle of the court with drum stones
// bracing its ends, stone lions at both bridgeheads, stone drums before the hall and along the
// sides, the two bronze censers, the two flagpole stones of a family with a degree, the stone
// lanterns, the bamboo in the corners and the herb beds before the wings. Everything on a tile
// a piece can stand on is kept low and to the back or outer side of the tile.
import { circle } from '../scenery-kit.js';
import { CX, TOP, tiles, put, slab, granite, graniteShade, graniteDark, plaster, plasterShade, plasterStain, brick, ridgeTone, bronze, bronzeDark, verdigris, gilt, timber, timberDark } from './kit-16.js';
import { ELEMENTS } from './paving-16.js';

const lionStone = 0xb3b0a3;
const lionShade = 0x8c897e;
const soil = 0x4e4236;

// Which way the outer side of the board lies from a tile: -1 west, 1 east.
const outward = (cell) => (cell.x < CX ? -1 : 1);

// 石鼓: a drum-shaped stone on a low base, lying on its side or standing; `stand` true for the
// seat drums, false for the 抱鼓石 that brace a gate or wall (a drum on a carved block).
function drum(m, x, z, yaw, s = 1, stand = false) {
  m.frame(x, TOP, z, yaw, s, () => {
    if (stand) {
      m.lathe(
        0,
        0,
        0,
        [
          [0, 0.13],
          [0.03, 0.155],
          [0.1, 0.18],
          [0.2, 0.18],
          [0.27, 0.155],
          [0.3, 0.13],
          [0.3, 0]
        ],
        lionStone,
        12
      );
      // The two rows of studs of a drum's skin.
      for (const y of [0.05, 0.25])
        for (let i = 0; i < 10; i++) {
          const a = (i * circle) / 10;
          m.box(Math.cos(a) * 0.16, y, Math.sin(a) * 0.16, 0.025, 0.025, 0.025, lionShade);
        }
      return;
    }
    // 抱鼓石: a carved block with a drum standing on it, its face toward +x.
    m.box(0, 0.1, 0, 0.34, 0.2, 0.22, graniteShade);
    m.box(0, 0.21, 0, 0.36, 0.03, 0.24, granite);
    m.box(0.02, 0.09, 0, 0.28, 0.1, 0.235, m.mix(graniteShade, graniteDark, 0.3));
    m.frame(0.02, 0.37, 0, 0, 1, () => {
      m.tube([0, 0, -0.08], [0, 0, 0.08], 0.16, 0.16, lionStone, 14);
      m.tube([0, 0, -0.08], [0, 0, -0.095], 0.13, 0.13, lionShade, 14);
      m.tube([0, 0, 0.08], [0, 0, 0.095], 0.13, 0.13, lionShade, 14);
      // A little crouching beast on top of the drum.
      m.box(0, 0.19, 0, 0.13, 0.06, 0.08, lionShade);
      m.box(0.06, 0.24, 0, 0.06, 0.07, 0.07, lionShade);
    });
  });
}

// A seated stone lion on a carved plinth, facing +z of its frame. The male (ball) or female (cub)
// is set by `ball`. About 0.62 tall overall.
function lion(m, x, z, yaw, ball) {
  m.frame(x, TOP, z, yaw, 1, () => {
    // The plinth: a 須彌座 of base, waist and top.
    m.box(0, 0.05, 0, 0.36, 0.1, 0.44, graniteShade);
    m.box(0, 0.13, 0, 0.3, 0.06, 0.38, m.mix(graniteShade, graniteDark, 0.4));
    m.box(0, 0.18, 0, 0.36, 0.04, 0.44, granite);
    const body = lionStone,
      dark = lionShade;
    // Haunches, chest and forelegs.
    m.rock(0, 0.2, -0.06, 0.15, 0.2, 0.16, dark, body, 8);
    m.rock(0, 0.28, 0.04, 0.12, 0.24, 0.11, body, m.mix(body, 0xc9c6b8, 0.3), 8);
    for (const s of [-1, 1]) {
      m.tube([s * 0.07, 0.2, 0.12], [s * 0.07, 0.4, 0.08], 0.032, 0.03, body, 6);
      m.box(s * 0.07, 0.215, 0.15, 0.06, 0.03, 0.07, dark);
    }
    // The mane in curls, then the head with its square muzzle and bulging eyes.
    m.lathe(
      0,
      0.42,
      0.04,
      [
        [0, 0.08],
        [0.04, 0.13],
        [0.11, 0.14],
        [0.18, 0.1],
        [0.2, 0]
      ],
      dark,
      9
    );
    for (let i = 0; i < 7; i++) {
      const a = (i * circle) / 7;
      m.box(Math.cos(a) * 0.12, 0.5, 0.04 + Math.sin(a) * 0.12, 0.05, 0.05, 0.05, body);
    }
    m.box(0, 0.53, 0.12, 0.15, 0.13, 0.12, body);
    m.box(0, 0.5, 0.19, 0.1, 0.07, 0.05, m.mix(body, 0xc9c6b8, 0.25));
    for (const s of [-1, 1]) m.box(s * 0.045, 0.565, 0.18, 0.035, 0.03, 0.02, dark);
    m.box(0, 0.47, 0.17, 0.08, 0.02, 0.05, 0x6a4a40);
    // Under the forepaw: the embroidered ball, or the cub on its back.
    if (ball) {
      m.lathe(
        0.07,
        0.2,
        0.19,
        [
          [0, 0.0],
          [0.02, 0.045],
          [0.06, 0.055],
          [0.1, 0.045],
          [0.12, 0]
        ],
        body,
        8
      );
      m.hoop(0.07, 0.26, 0.19, 0.055, 0.008, dark, 10);
    } else {
      m.rock(-0.08, 0.2, 0.18, 0.05, 0.07, 0.05, dark, body, 6);
      m.box(-0.08, 0.27, 0.2, 0.04, 0.04, 0.04, body);
    }
  });
}

// 照壁: the screen wall in the middle of the court, along x, on a 須彌座 plinth: grey brick ends
// framing a white panel with a carved brick roundel of the five elements, under a little tiled
// roof. Drawn in the rock tile's frame.
function screenWall(m) {
  const len = 0.98,
    t = 0.26;
  // Plinth.
  slab(m, -len / 2, len / 2, TOP, TOP + 0.08, -t / 2 - 0.06, t / 2 + 0.06, graniteShade);
  slab(m, -len / 2 + 0.03, len / 2 - 0.03, TOP + 0.08, TOP + 0.15, -t / 2 - 0.02, t / 2 + 0.02, graniteDark);
  slab(m, -len / 2, len / 2, TOP + 0.15, TOP + 0.2, -t / 2 - 0.05, t / 2 + 0.05, granite);
  const y0 = TOP + 0.2,
    y1 = 1.12;
  // Brick piers at the ends and a brick frame round the panel.
  for (const s of [-1, 1]) slab(m, s * (len / 2 - 0.1), s * (len / 2), y0, y1, -t / 2 - 0.01, t / 2 + 0.01, brick);
  slab(m, -len / 2 + 0.1, len / 2 - 0.1, y0, y0 + 0.08, -t / 2 - 0.005, t / 2 + 0.005, brick);
  slab(m, -len / 2 + 0.1, len / 2 - 0.1, y1 - 0.12, y1, -t / 2 - 0.005, t / 2 + 0.005, brick);
  for (const s of [-1, 1]) {
    const z = (s * t) / 2;
    put(
      m,
      [
        [-len / 2 + 0.1, y0 + 0.08, z],
        [len / 2 - 0.1, y0 + 0.08, z],
        [len / 2 - 0.1, y1 - 0.12, z],
        [-len / 2 + 0.1, y1 - 0.12, z]
      ],
      [m.rgb(plaster), m.rgb(plaster), m.rgb(plasterStain), m.rgb(plasterStain)],
      [0, 0, s]
    );
    // The roundel: a ring of the five colours round a carved brick disc (太極 in two tones).
    const cy = (y0 + y1) / 2 - 0.02,
      zz = z + s * 0.012;
    m.frame(0, cy, zz, s > 0 ? 0 : Math.PI, 1, () => {
      for (let i = 0; i < 5; i++) {
        const a0 = (i * circle) / 5 + Math.PI / 2,
          a1 = ((i + 1) * circle) / 5 + Math.PI / 2;
        for (let q = 0; q < 4; q++) {
          const a = a0 + ((a1 - a0) * q) / 4,
            b = a0 + ((a1 - a0) * (q + 1)) / 4;
          put(
            m,
            [
              [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0],
              [Math.cos(b) * 0.2, Math.sin(b) * 0.2, 0],
              [Math.cos(b) * 0.16, Math.sin(b) * 0.16, 0],
              [Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0]
            ],
            m.mix(ELEMENTS[i].col, brick, 0.25),
            [0, 0, 1]
          );
        }
      }
      m.tube([0, 0, -0.01], [0, 0, 0.012], 0.155, 0.155, m.mix(brick, plasterShade, 0.3), 16);
      // The two fishes of the 太極.
      const fish = (s2, col) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const a = (i / 10) * Math.PI;
          pts.push([Math.cos(a + (s2 > 0 ? 0 : Math.PI)) * 0.13, Math.sin(a + (s2 > 0 ? 0 : Math.PI)) * 0.13, 0.014]);
        }
        put(m, pts, col, [0, 0, 1]);
        const c = [];
        for (let i = 0; i < 10; i++) {
          const a = (i * circle) / 10;
          c.push([s2 * 0.065 + Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0.0145]);
        }
        put(m, c, s2 > 0 ? 0x3d3b38 : 0xd8d2c2, [0, 0, 1]);
      };
      fish(1, 0xd8d2c2);
      fish(-1, 0x3d3b38);
    });
  }
  // Brick cornice and the little roof.
  slab(m, -len / 2 - 0.03, len / 2 + 0.03, y1, y1 + 0.05, -t / 2 - 0.04, t / 2 + 0.04, m.mix(brick, ridgeTone, 0.3));
  miniRoof(m, len + 0.26, t + 0.4, y1 + 0.05, 0.22);
}

// A little hipped roof of grey tiles, w by d with its eaves at y: rows of round tiles down both
// long slopes, a lit lip along the eaves, and a ridge whose ends curl up.
function miniRoof(m, w, d, y, rise) {
  const [dark, mid, hi] = tiles,
    half = (w - d) / 2,
    top = y + rise;
  const n = Math.max(4, Math.round(w / 0.09));
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const u0 = -w / 2 + (w * i) / n,
        u1 = -w / 2 + (w * (i + 1)) / n;
      // Where a strip meets the ridge (clamped to the ridge's length; past it, to the hips).
      const r0 = Math.max(-half, Math.min(half, u0)),
        r1 = Math.max(-half, Math.min(half, u1));
      put(m, [[u0, y, (s * d) / 2], [u1, y, (s * d) / 2], [r1, top, 0], [r0, top, 0]], i % 2 ? mid : m.mix(mid, dark, 0.4), [0, 1, s]);
      if (i % 2) m.line([[u0, y + 0.02, (s * d) / 2], [r0, top + 0.01, 0]], 0.014, hi, 4);
    }
    // The end slopes, and the lip of the eaves.
    put(m, [[s * (w / 2), y, -d / 2], [s * (w / 2), y, d / 2], [s * half, top, 0]], mid, [s, 1, 0]);
    put(m, [[-w / 2, y, (s * d) / 2], [w / 2, y, (s * d) / 2], [w / 2, y - 0.035, (s * d) / 2], [-w / 2, y - 0.035, (s * d) / 2]], hi, [0, 0, s]);
    put(m, [[s * (w / 2), y, -d / 2], [s * (w / 2), y, d / 2], [s * (w / 2), y - 0.035, d / 2], [s * (w / 2), y - 0.035, -d / 2]], hi, [s, 0, 0]);
  }
  m.box(0, top + 0.02, 0, 2 * half + 0.06, 0.06, 0.07, ridgeTone);
  for (const e of [-1, 1]) {
    m.tube([e * (half + 0.02), top + 0.03, 0], [e * (half + 0.1), top + 0.13, 0], 0.03, 0.012, ridgeTone, 5);
    // The hip ridges down to the corners.
    for (const f of [-1, 1]) m.line([[e * half, top + 0.02, 0], [e * (w / 2), y + 0.03, (f * d) / 2]], 0.02, ridgeTone, 4);
  }
}

// 銅香爐: a round bronze censer on three legs with a pierced lid, on a granite stand, with
// smoke rising thin from it. About 0.95 tall.
function censer(m) {
  m.box(0, TOP + 0.06, 0, 0.62, 0.12, 0.62, graniteShade);
  m.box(0, TOP + 0.13, 0, 0.56, 0.03, 0.56, granite);
  const y = TOP + 0.145;
  for (let k = 0; k < 3; k++) {
    const a = (k * circle) / 3 + 0.5;
    m.line(
      [
        [Math.cos(a) * 0.19, y, Math.sin(a) * 0.19],
        [Math.cos(a) * 0.21, y + 0.12, Math.sin(a) * 0.21],
        [Math.cos(a) * 0.15, y + 0.22, Math.sin(a) * 0.15]
      ],
      0.032,
      bronzeDark,
      5
    );
  }
  m.lathe(
    0,
    y + 0.18,
    0,
    [
      [0, 0.1],
      [0.04, 0.19],
      [0.12, 0.25],
      [0.22, 0.24],
      [0.27, 0.2],
      [0.29, 0.22]
    ],
    m.mix(bronze, verdigris, 0.3),
    14
  );
  for (const s of [-1, 1]) m.hoop(s * 0.24, y + 0.47, 0, 0.06, 0.014, bronzeDark, 8, 'xy');
  m.lathe(
    0,
    y + 0.47,
    0,
    [
      [0, 0.22],
      [0.02, 0.21],
      [0.09, 0.16],
      [0.15, 0.08],
      [0.19, 0.04],
      [0.2, 0.05],
      [0.25, 0]
    ],
    bronzeDark,
    12
  );
  m.box(0, y + 0.74, 0, 0.05, 0.05, 0.05, gilt);
  m.line(
    [
      [0, y + 0.78, 0],
      [0.03, y + 0.95, 0.01],
      [-0.02, y + 1.12, -0.02],
      [0.04, y + 1.3, 0],
      [0, y + 1.5, 0.03]
    ],
    0.009,
    0xb9bab4,
    4
  );
}

// 旗杆石: a flagpole of a family that has passed the examinations, clamped between two tall
// granite slabs on a plinth, with a square 斗 part way up and a gilt finial. Drawn on a rock tile.
function flagpole(m) {
  m.box(0, TOP + 0.06, 0, 0.7, 0.12, 0.5, graniteShade);
  m.box(0, TOP + 0.14, 0, 0.6, 0.04, 0.42, granite);
  for (const s of [-1, 1]) {
    m.box(s * 0.1, TOP + 0.55, 0, 0.09, 0.8, 0.3, granite);
    m.box(s * 0.1, TOP + 0.97, 0, 0.1, 0.05, 0.31, graniteShade);
    // The carved panel on the clamp's face, and the iron pins through both.
    m.box(s * 0.147, TOP + 0.5, 0, 0.005, 0.4, 0.2, graniteShade);
  }
  for (const y of [0.35, 0.75]) m.tube([-0.16, TOP + y, 0], [0.16, TOP + y, 0], 0.018, 0.018, 0x3a3836, 6);
  m.tube([0, TOP + 0.16, 0], [0, 3.3, 0], 0.055, 0.035, timber, 8);
  // The 斗: an inverted square box a third of the way up.
  m.frame(0, 2.1, 0, 0.785, 1, () => {
    put(m, [[-0.16, 0.14, -0.16], [0.16, 0.14, -0.16], [0.16, 0.14, 0.16], [-0.16, 0.14, 0.16]], timberDark);
    for (let i = 0; i < 4; i++)
      m.frame(0, 0, 0, (i * circle) / 4, 1, () =>
        put(m, [[-0.16, 0.14, 0.16], [0.16, 0.14, 0.16], [0.08, 0, 0.08], [-0.08, 0, 0.08]], i % 2 ? timber : 0x8a3a2a, [0, -0.3, 1])
      );
  });
  m.lathe(0, 3.28, 0, [[0, 0.05], [0.06, 0.07], [0.13, 0.03], [0.2, 0]], gilt, 8);
}

// 石燈籠: a granite lantern: base, shaft, firebox with open windows, a hipped cap and a knob.
function stoneLantern(m) {
  const y = TOP;
  m.box(0, y + 0.06, 0, 0.42, 0.12, 0.42, graniteShade);
  m.lathe(0, y + 0.12, 0, [[0, 0.17], [0.06, 0.12], [0.14, 0.1]], granite, 8);
  m.tube([0, y + 0.2, 0], [0, y + 0.6, 0], 0.075, 0.07, granite, 8);
  m.box(0, y + 0.63, 0, 0.3, 0.06, 0.3, graniteShade);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) m.box(sx * 0.11, y + 0.76, sz * 0.11, 0.05, 0.2, 0.05, granite);
  m.glow(() => m.box(0, y + 0.76, 0, 0.14, 0.14, 0.14, 0xf0c070));
  m.box(0, y + 0.88, 0, 0.32, 0.04, 0.32, graniteShade);
  m.lathe(0, y + 0.9, 0, [[0, 0.26], [0.03, 0.27], [0.12, 0.13], [0.18, 0.05], [0.2, 0]], granite, 8);
  m.lathe(0, y + 1.09, 0, [[0, 0.04], [0.04, 0.05], [0.09, 0]], graniteShade, 6);
  // Moss on the cap's north side.
  m.box(0, y + 0.95, -0.12, 0.2, 0.02, 0.06, 0x6a7a4c);
}

// 竹: a clump of bamboo at the outer back corner of the tile, a ring of shoots and fallen
// sheaths at its foot. About 1.2 tall.
function bambooClump(m, p, cell) {
  const r = m.rng,
    out = outward(cell),
    bx = out * 0.26,
    bz = -0.26;
  m.lathe(bx, TOP, bz, [[0, 0.24], [0.04, 0.23], [0.05, 0]], 0x5a5140, 9);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = r.range(0, circle),
      d = r.range(0, 0.16),
      x = bx + Math.cos(a) * d,
      z = bz + Math.sin(a) * d,
      h = r.range(0.85, 1.35),
      tx = x + out * r.range(0.02, 0.16),
      tz = z - r.range(0.0, 0.12),
      green = m.mix(0x5d8a48, 0x8aa85a, r.next());
    let prev = [x, TOP + 0.04, z];
    for (let k = 1; k <= 4; k++) {
      const t = k / 4,
        at = [x + (tx - x) * t * t, TOP + 0.04 + h * t, z + (tz - z) * t * t];
      m.tube(prev, at, 0.02 - k * 0.002, 0.018 - k * 0.002, k % 2 ? green : m.mix(green, 0x3f6a38, 0.3), 5);
      m.box(at[0], at[1], at[2], 0.04, 0.008, 0.04, m.mix(green, 0xc9c08a, 0.4));
      prev = at;
    }
    for (let k = 0; k < 6; k++) {
      const t = 0.5 + k * 0.09,
        pt = [x + (tx - x) * t * t, TOP + 0.04 + h * t, z + (tz - z) * t * t],
        b = r.range(0, circle),
        l = r.range(0.13, 0.22);
      m.leaf(pt, [pt[0] + Math.cos(b) * l, pt[1] - 0.06, pt[2] + Math.sin(b) * l], 0.028, 0x35633a, 0x6f9a55, 0.02);
      m.leaf(pt, [pt[0] + Math.cos(b + 0.6) * l * 0.8, pt[1] - 0.03, pt[2] + Math.sin(b + 0.6) * l * 0.8], 0.024, 0x2f5a35, 0x5f8a4a, 0.02);
    }
  }
  // Shoots and sheaths.
  for (let k = 0; k < 3; k++) {
    const x = bx + r.range(-0.25, 0.2) * -out,
      z = bz + r.range(0.05, 0.3);
    m.tube([x, TOP, z], [x, TOP + r.range(0.08, 0.16), z], 0.025, 0.003, 0x8a7a50, 5);
  }
  for (let k = 0; k < 4; k++) {
    const x = r.range(-0.4, 0.4),
      z = r.range(-0.4, 0.2),
      a = r.range(0, circle);
    m.leaf([x, TOP + 0.004, z], [x + Math.cos(a) * 0.1, TOP + 0.006, z + Math.sin(a) * 0.1], 0.02, 0xb0a070, 0xc8b884, 0.003);
  }
}

// 藥圃: a raised bed of medicinal herbs in a brick kerb, the plants in rows, a few in flower,
// and a dipper of water at its corner.
function herbBed(m, p, cell) {
  const r = m.rng,
    o = 0.44;
  for (const s of [-1, 1]) {
    slab(m, -o, o, TOP, TOP + 0.09, s * o - 0.035, s * o + 0.035, brick);
    slab(m, s * o - 0.035, s * o + 0.035, TOP, TOP + 0.09, -o, o, brick);
  }
  put(m, [[-o, TOP + 0.075, -o], [-o, TOP + 0.075, o], [o, TOP + 0.075, o], [o, TOP + 0.075, -o]], soil);
  const kinds = [
    [0x5e8a4e, 0x9ab86e, 0xe9e2c2], // 白芍
    [0x4f7a4a, 0x86a868, 0xd9a03c], // 金銀花
    [0x6a8f58, 0xa4c07c, 0xb68ac8], // 紫蘇 in flower
    [0x56804a, 0x8fb06a, 0xf0d860] // chrysanthemum
  ];
  for (let row = 0; row < 3; row++) {
    const [dark, light, flower] = kinds[(row + cell.x) % kinds.length],
      z = -0.27 + row * 0.27;
    for (let i = 0; i < 4; i++) {
      const x = -0.3 + i * 0.2 + r.range(-0.03, 0.03),
        h = r.range(0.1, 0.17);
      for (let k = 0; k < 5; k++) {
        const a = (k * circle) / 5 + r.range(0, 1),
          l = r.range(0.07, 0.11);
        m.leaf([x, TOP + 0.08, z], [x + Math.cos(a) * l, TOP + 0.08 + h * 0.7, z + Math.sin(a) * l], l * 0.35, dark, light, 0.02);
      }
      if ((i + row) % 2 === 0) m.box(x, TOP + 0.08 + h, z, 0.035, 0.03, 0.035, flower);
    }
  }
}

const lions = new Set(['3,9', '9,9', '3,11', '9,11']);
const braces = new Set(['5,5', '7,5']);
// Cover tiles: lions at the bridgeheads, drum stones bracing the screen wall, and seat drums
// elsewhere, each pushed to the back or outer side of its tile.
function coverTile(m, p, cell) {
  const key = cell.x + ',' + cell.y,
    out = outward(cell);
  if (lions.has(key)) {
    // They sit on the outer side, facing across the approach toward the bridge; the north pair
    // faces south, down the bridge, the south pair north.
    const north = cell.y === 9;
    lion(m, out * 0.2, north ? -0.1 : 0.12, north ? -out * 0.45 : Math.PI + out * 0.45, cell.x < CX);
    return;
  }
  if (braces.has(key)) {
    // The drum faces away from the wall, its block against the wall's end.
    const toward = cell.x < CX ? 1 : -1;
    m.frame(toward * 0.28, 0, 0, toward > 0 ? Math.PI : 0, 1, () => drum(m, 0, 0, 0, 1, false));
    return;
  }
  if (cell.y === 0) {
    // Drums before the hall: a pair of seat drums at the back of the tile.
    drum(m, -0.2, -0.26, 0, 0.8, true);
    drum(m, 0.2, -0.3, 0.6, 0.75, true);
    return;
  }
  // Along the sides: a stone bench with drum stools against the outer edge.
  const x = out * 0.34;
  slab(m, x - 0.1, x + 0.1, TOP, TOP + 0.07, -0.42, 0.42, graniteShade);
  for (const z of [-0.28, 0.28]) slab(m, x - 0.07, x + 0.07, TOP + 0.07, TOP + 0.2, z - 0.06, z + 0.06, graniteDark);
  slab(m, x - 0.13, x + 0.13, TOP + 0.2, TOP + 0.26, -0.44, 0.44, granite);
  drum(m, x - out * 0.32, -0.3, 0, 0.62, true);
}

function rockTile(m, p, cell) {
  if (cell.y === 0) return flagpole(m);
  if (cell.x === CX) return screenWall(m);
  return stoneLantern(m);
}

export { lion, drum, censer, stoneLantern, bambooClump, herbBed, coverTile, rockTile };
