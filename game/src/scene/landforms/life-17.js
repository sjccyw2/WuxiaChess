// The life of 萬安寺's court by night: strings of prayer flags from the pagoda to its masts,
// strings of lanterns, racks of votive candles, the monks' things left on the porch of their
// quarters, and incense smoke drifting up from the great burners.
import { circle } from '../scenery-kit.js';
import { put, mark, hangLamp, ink, stoneDark, gilt } from './kit-17.js';

const flagTones = [0x2f5a9a, 0xd8d2c2, 0xa83a2a, 0x3a7a4c, 0xd0a23e]; // 五色經幡
const rope = 0x2a2420;

// A rope sagging from a to b, as points.
function sag(a, b, drop, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - drop * 4 * t * (1 - t),
      a[2] + (b[2] - a[2]) * t
    ]);
  }
  return pts;
}
// A string of prayer flags in the five colours, hanging from a sagging rope.
function prayerFlags(m, a, b, drop, n) {
  const pts = sag(a, b, drop, 8);
  m.line(pts, 0.008, rope, 3);
  const at = (t) => {
    const f = t * 8,
      i = Math.min(7, Math.floor(f)),
      k = f - i;
    return pts[i].map((v, j) => v + (pts[i + 1][j] - v) * k);
  };
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n,
      p = at(t),
      q = at(Math.min(1, t + 0.6 / n)),
      w = [q[0] - p[0], q[2] - p[2]],
      l = Math.hypot(...w) || 1,
      ex = (w[0] / l) * 0.09,
      ez = (w[1] / l) * 0.09,
      sway = Math.sin(i * 1.7) * 0.03;
    put(
      m,
      [
        [p[0] - ex, p[1], p[2] - ez],
        [p[0] + ex, p[1], p[2] + ez],
        [p[0] + ex + sway, p[1] - 0.2, p[2] + ez + sway],
        [p[0] - ex + sway, p[1] - 0.2, p[2] - ez + sway]
      ],
      flagTones[i % 5],
      [-ez, 0, ex]
    );
  }
}
// A string of small lanterns on a sagging rope.
function lanternString(m, a, b, drop, n, tones = [0xe0583a, 0xe8a050]) {
  const pts = sag(a, b, drop, 8);
  m.line(pts, 0.008, rope, 3);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n,
      f = t * 8,
      j = Math.min(7, Math.floor(f)),
      k = f - j,
      p = pts[j].map((v, q) => v + (pts[j + 1][q] - v) * k);
    hangLamp(m, p[0], p[1] - 0.26, p[2], 0.5, tones[i % tones.length], 0.08);
  }
}
// 經幡杆: a tall mast with a gilt finial and a furled banner, on a stone foot.
function mast(m, x, z, h, y) {
  m.box(x, y + 0.15, z, 0.5, 0.3, 0.5, stoneDark);
  m.tube([x, y + 0.3, z], [x, y + h, z], 0.06, 0.04, 0x4a2a22, 6);
  m.lathe(
    x,
    y + h,
    z,
    [
      [0, 0.07],
      [0.12, 0.1],
      [0.22, 0.04],
      [0.36, 0]
    ],
    gilt,
    6
  );
  // A long banner hanging furled down the mast.
  m.tube([x + 0.07, y + h - 0.3, z], [x + 0.07, y + h - 2.2, z], 0.06, 0.05, 0x8a2a22, 5);
  m.hoop(x + 0.07, y + h - 0.3, z, 0.07, 0.012, gilt, 6);
  return [x, y + h - 0.1, z];
}
// 燭架: an iron rack of votive candles, three tiers of flames before the censer.
function candleRack(m, x, z, y, yaw = 0) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const s of [-1, 1]) m.box(s * 0.55, 0.32, 0, 0.04, 0.64, 0.36, ink);
    for (let t = 0; t < 3; t++) {
      const ty = 0.36 + t * 0.14,
        tz = 0.1 - t * 0.1;
      m.box(0, ty, tz, 1.1, 0.025, 0.1, 0x2a2622);
      for (let i = 0; i < 9; i++) {
        const cx = -0.48 + i * 0.12,
          h = 0.05 + ((i * 7 + t * 3) % 5) * 0.02;
        m.box(cx, ty + h / 2 + 0.012, tz, 0.022, h, 0.022, 0xe8dcc0);
        m.glow(() => m.box(cx, ty + h + 0.03, tz, 0.018, 0.035, 0.018, 0xf3a648));
      }
    }
    // Wax run down in pale streaks on the tray below.
    m.box(0, 0.06, 0, 1.0, 0.02, 0.32, 0x8a826e);
  });
  mark(m, x, y + 0.6, z, 1.1);
}
// 井: a well with a stone curb, a wooden frame and pulley, its bucket resting on the curb.
function well(m, x, z, y, yaw = 0) {
  m.frame(x, y, z, yaw, 1, () => {
    m.lathe(
      0,
      0,
      0,
      [
        [0, 0.46],
        [0.36, 0.46],
        [0.4, 0.4],
        [0.42, 0.32]
      ],
      0x5e6676,
      10
    );
    m.lathe(
      0,
      0.3,
      0,
      [
        [0, 0.32],
        [0.002, 0.32]
      ],
      0x121820,
      10
    );
    for (const s of [-1, 1]) m.box(s * 0.52, 0.75, 0, 0.08, 1.5, 0.08, 0x4a3a2c);
    m.box(0, 1.46, 0, 1.2, 0.08, 0.08, 0x4a3a2c);
    m.hoop(0, 1.3, 0, 0.12, 0.02, 0x3a2e24, 8, 'xy');
    m.tube([0, 1.18, 0], [0, 0.55, 0], 0.008, 0.008, rope, 3);
    m.lathe(
      0.32,
      0.42,
      0.22,
      [
        [0, 0.09],
        [0.16, 0.11]
      ],
      0x5a4632,
      7
    );
    m.hoop(0.32, 0.52, 0.22, 0.1, 0.008, ink, 7);
  });
}
// A stone bench, a long slab on two drums.
function bench(m, x, z, y, yaw = 0) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const s of [-1, 1])
      m.lathe(
        s * 0.38,
        0,
        0,
        [
          [0, 0.13],
          [0.3, 0.11]
        ],
        0x5a6272,
        7
      );
    m.box(0, 0.33, 0, 1.1, 0.07, 0.34, 0x6a7383);
  });
}
// Incense smoke: a few pale ribbons curling up from a burner.
function smoke(m, x, y, z, h = 1.6, n = 3) {
  const r = m.rng;
  for (let k = 0; k < n; k++) {
    let p = [x + r.range(-0.08, 0.08), y, z + r.range(-0.08, 0.08)];
    const steps = 6,
      drift = r.range(0, circle);
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps,
        q = [
          p[0] + Math.cos(drift + i) * 0.06 + t * 0.05,
          y + h * t,
          p[2] + Math.sin(drift + i) * 0.06 - t * 0.03
        ],
        w = 0.015 + t * 0.06,
        tone = m.mix(0x7d8696, 0x4a5262, t);
      put(
        m,
        [
          [p[0] - w, p[1], p[2]],
          [p[0] + w, p[1], p[2]],
          [q[0] + w, q[1], q[2]],
          [q[0] - w, q[1], q[2]]
        ],
        tone,
        [0, 0, 1]
      );
      p = q;
    }
  }
}
// The monks' things on the porch of their quarters, in the quarters' own frame (x along the
// porch, +z toward the court): a broom against a column, a table with bundles of sutras and a
// lamp, buckets and a carrying pole, a wooden fish on a cushion, and straw sandals.
function monksThings(m) {
  // A bamboo broom leaning on the wall.
  m.frame(-4.6, 0, 0.6, 0.2, 1, () => {
    m.tube([0, 0.05, 0], [0.05, 1.25, -0.25], 0.018, 0.016, 0x8a7a4a, 4);
    m.lathe(
      0,
      0,
      0.02,
      [
        [0, 0.14],
        [0.22, 0.07],
        [0.32, 0.03]
      ],
      0x6a5a34,
      7
    );
  });
  // A low table with sutras wrapped in yellow cloth, a lamp and a bell.
  m.frame(-1.6, 0, 0.62, 0, 1, () => {
    m.box(0, 0.36, 0, 1.0, 0.05, 0.42, 0x3a2c22);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) m.box(sx * 0.44, 0.17, sz * 0.17, 0.05, 0.34, 0.05, 0x2a2018);
    for (let i = 0; i < 5; i++)
      m.box(
        -0.3 + (i % 3) * 0.09,
        0.42 + Math.floor(i / 3) * 0.06,
        -0.04,
        0.08,
        0.06,
        0.26,
        i % 2 ? 0xc89a3a : 0xb0782a
      );
    m.box(0.18, 0.41, 0.04, 0.26, 0.04, 0.2, 0xd8cca8);
    m.lathe(
      0.36,
      0.39,
      -0.08,
      [
        [0, 0.05],
        [0.04, 0.04],
        [0.06, 0.02]
      ],
      0x5a4e36,
      6
    );
    m.glow(() => m.box(0.36, 0.48, -0.08, 0.03, 0.05, 0.03, 0xf3a648));
    m.lathe(
      0.36,
      0.39,
      0.1,
      [
        [0, 0.06],
        [0.06, 0.06],
        [0.1, 0.03],
        [0.11, 0]
      ],
      0x6a5a3a,
      7
    );
  });
  mark(m, -1.24, 0.5, 0.54, 0.7);
  // Wooden buckets and a carrying pole.
  for (const [x, z] of [
    [1.9, 0.6],
    [2.35, 0.55]
  ])
    m.frame(x, 0, z, 0, 1, () => {
      m.lathe(
        0,
        0,
        0,
        [
          [0, 0.15],
          [0.3, 0.17]
        ],
        0x5a4632,
        8
      );
      m.hoop(0, 0.08, 0, 0.165, 0.01, ink, 8);
      m.hoop(0, 0.24, 0, 0.17, 0.01, ink, 8);
      m.lathe(
        0,
        0.27,
        0,
        [
          [0, 0.15],
          [0.002, 0.15]
        ],
        0x1d2a33,
        8
      );
    });
  m.tube([1.6, 0.04, 0.85], [2.9, 0.04, 0.75], 0.025, 0.025, 0x7a6a44, 4);
  // A wooden fish on a cushion, its striker beside it.
  m.frame(3.6, 0, 0.55, 0, 1, () => {
    m.lathe(
      0,
      0,
      0,
      [
        [0, 0.2],
        [0.06, 0.22],
        [0.08, 0]
      ],
      0x7a2a22,
      8
    );
    m.rock(0, 0.08, 0, 0.13, 0.15, 0.1, 0x6a3a22, 0x9a5a32, 7);
    m.tube([0.15, 0.1, 0.1], [0.32, 0.12, 0.02], 0.012, 0.016, 0x8a6a42, 4);
  });
  // Straw sandals by the door.
  for (const x of [0.25, 0.42]) m.box(x, 0.012, 0.75, 0.1, 0.02, 0.26, 0x9a8a5a);
}

export { well, bench, prayerFlags, lanternString, mast, candleRack, smoke, monksThings, sag };
