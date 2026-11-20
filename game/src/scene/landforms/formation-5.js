// 桃花石陣的棋盤地面：冰裂紋落英石徑、陣中矮石、桃花叢、藥圃與一塊塊不同的太湖奇石。
// Every piece sits at or just below the tile surface (y 0.047) or stands in the back
// half of its tile, so the fighters at the tile centres stay in clear view.
import { circle } from '../scenery-kit.js';
import { peachBush, petal } from './peach-5.js';

// Deterministic hash of integer coordinates to [0, 1).
function hash(i, j, s = 0) {
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Smooth value noise in [0, 1).
function noise(x, z, s = 0) {
  const i = Math.floor(x),
    j = Math.floor(z),
    u = x - i,
    v = z - j;
  const a = u * u * (3 - 2 * u),
    b = v * v * (3 - 2 * v);
  const top = hash(i, j, s) + (hash(i + 1, j, s) - hash(i, j, s)) * a,
    low = hash(i, j + 1, s) + (hash(i + 1, j + 1, s) - hash(i, j + 1, s)) * a;
  return top + (low - top) * b;
}
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp3 = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t
];
// Draw a face wound so its normal points along `want`. The shadow's normal bias
// pushes along the wound normal, so a face wound backwards shades itself dark.
function facing(m, points, col, want) {
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  if (nx * want[0] + ny * want[1] + nz * want[2] >= 0) return m.face(points, col);
  const perVertex = Array.isArray(col) && Array.isArray(col[0]);
  m.face(points.slice().reverse(), perVertex ? col.slice().reverse() : col);
}
const UP = [0, 1, 0];

// The paving lattice: three joints per tile, with interior joints shaken loose so the
// flags read as laid stone, while tile edges stay straight between neighbours.
const third = 1 / 3;
function joint(I, J, width, height) {
  const x = -width / 2 + I * third,
    z = -height / 2 + J * third;
  return [
    x + (I % 3 ? (hash(I, J, 1) - 0.5) * 0.15 : 0),
    z + (J % 3 ? (hash(I, J, 2) - 0.5) * 0.15 : 0)
  ];
}

// One laid flag: the joint is left open, the corners are worn round and a narrow
// bevel takes the light. The lower edge sinks under the soil so nothing floats.
function flagstone(m, ring, top, col) {
  const cx = ring.reduce((n, p) => n + p[0], 0) / ring.length,
    cz = ring.reduce((n, p) => n + p[1], 0) / ring.length;
  const inset = ring.map(([x, z]) => {
    const d = Math.hypot(x - cx, z - cz) || 1,
      k = Math.max(0.4, 1 - 0.017 / d);
    return [cx + (x - cx) * k, cz + (z - cz) * k];
  });
  const worn = [];
  for (let i = 0; i < inset.length; i++) {
    const p = inset[i],
      a = inset[(i + inset.length - 1) % inset.length],
      b = inset[(i + 1) % inset.length];
    const cut = (q, d) => {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1,
        t = Math.min(0.3, d / len);
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    };
    worn.push(cut(a, 0.034), cut(b, 0.034));
  }
  const tilt = [(m.rng.next() - 0.5) * 0.02, (m.rng.next() - 0.5) * 0.02];
  const height = (x, z) => top + (x - cx) * tilt[0] + (z - cz) * tilt[1];
  const face = worn.map(([x, z]) => [cx + (x - cx) * 0.955, height(x, z), cz + (z - cz) * 0.955]);
  const foot = worn.map(([x, z]) => [x, 0.036, z]);
  const lit = m.mix(col, 0xd6ccb2, 0.12),
    edge = m.mix(col, 0x6f6a58, 0.32);
  facing(
    m,
    face,
    face.map((p, i) => (i % 5 === 2 ? m.mix(col, 0x8d9470, 0.3) : i % 3 ? m.rgb(col) : lit)),
    UP
  );
  for (let i = 0; i < face.length; i++) {
    const j = (i + 1) % face.length;
    const out = [(face[i][0] + face[j][0]) / 2 - cx, 0.3, (face[i][2] + face[j][2]) / 2 - cz];
    facing(m, [face[i], foot[i], foot[j], face[j]], edge, out);
  }
}

function paving(m, layout, cell, drift) {
  const { width, height } = layout,
    I0 = cell.x * 3,
    J0 = cell.y * 3,
    r = m.rng;
  const at = (a, b) => joint(I0 + a, J0 + b, width, height);
  const tones = [0xb3ab95, 0xa9a58f, 0xbcb29a, 0xa09f8a, 0xc2b8a0, 0x9fa286];
  for (let b = 0; b < 3; b++)
    for (let a = 0; a < 3; a++) {
      const salt = hash(I0 + a, J0 + b, 7);
      // A missing flag leaves a mossy hollow.
      if (salt < 0.05) continue;
      const tone = tones[Math.floor(hash(I0 + a, J0 + b, 9) * tones.length)];
      const top = 0.058 + (hash(I0 + a, J0 + b, 11) - 0.5) * 0.006;
      if (a < 2 && salt > 0.82 && hash(I0 + a + 1, J0 + b, 7) >= 0.05) {
        // A long slab spans two joints.
        flagstone(
          m,
          [at(a, b), at(a + 1, b), at(a + 2, b), at(a + 2, b + 1), at(a + 1, b + 1), at(a, b + 1)],
          top,
          tone
        );
        a++;
      } else if (salt > 0.68) {
        // A cracked flag: two pieces, one settled a little lower.
        const diag = salt > 0.71;
        const p = [at(a, b), at(a + 1, b), at(a + 1, b + 1), at(a, b + 1)];
        if (diag) {
          flagstone(m, [p[0], p[1], p[2]], top, tone);
          flagstone(m, [p[0], p[2], p[3]], top - 0.005, tone);
        } else {
          flagstone(m, [p[1], p[2], p[3]], top, tone);
          flagstone(m, [p[0], p[1], p[3]], top - 0.005, m.mix(tone, 0x8f9472, 0.2));
        }
      } else flagstone(m, [at(a, b), at(a + 1, b), at(a + 1, b + 1), at(a, b + 1)], top, tone);
    }
  // Grass and moss tufts in a few of the joints.
  for (let k = 0; k < 3; k++) {
    if (r.next() > 0.55) continue;
    const [x, z] = at(1 + Math.floor(r.next() * 2), 1 + Math.floor(r.next() * 2));
    tuft(m, x, 0.05, z, 0.07, r);
  }
  // Fallen petals; more where the wind leaves them.
  const cx = cell.x - (width - 1) / 2,
    cz = cell.y - (height - 1) / 2;
  const n = Math.round(drift * 9 + r.next() * 2);
  for (let k = 0; k < n; k++)
    petal(m, cx + r.range(-0.47, 0.47), 0.066, cz + r.range(-0.47, 0.47), r);
}

// A tuft of grass blades.
function tuft(m, x, y, z, h, r, col = 0x6d8650) {
  for (let k = 0; k < 4; k++) {
    const a = r.range(0, circle),
      l = h * r.range(0.6, 1.1),
      tip = [x + Math.cos(a) * l * 0.5, y + l, z + Math.sin(a) * l * 0.5];
    const w = 0.012;
    m.face(
      [
        [x - Math.sin(a) * w, y - 0.01, z + Math.cos(a) * w],
        [x + Math.sin(a) * w, y - 0.01, z - Math.cos(a) * w],
        tip
      ],
      [m.rgb(0x52653f), m.rgb(0x52653f), m.mix(col, 0xb6b878, k * 0.15)]
    );
  }
}

// A weathered boulder: a ring stack sunk below the ground line, wet and dark at the
// foot, grey on the flanks and patched with lichen where it faces the sky.
function boulder(m, x, y, z, rx, h, rz, r, look = {}) {
  const n = look.n || 8,
    grey = look.grey || 0x8e9189,
    light = look.light || 0xb9b8a6,
    lichen = look.lichen || 0xa9a66c,
    foot = look.foot || 0x5b5a49;
  const edges = Array.from({ length: n }, (_, i) => [
    (i * circle) / n + r.range(-0.18, 0.18),
    r.range(0.78, 1.18)
  ]);
  const seed = Math.floor(r.next() * 1000);
  const levels = [
    [-0.12, 0.92],
    [0.16, 1],
    [0.5, 0.95 + r.range(-0.1, 0.06)],
    [0.8, 0.74 + r.range(-0.12, 0.08)],
    [1, 0.38]
  ];
  const rings = levels.map(([t, s]) =>
    edges.map(([a, k], i) => {
      const bump = 1 + 0.12 * (hash(i, Math.round(t * 10), seed) - 0.5);
      return [
        x + Math.cos(a) * rx * k * s * bump + rx * 0.08 * t,
        y + h * (t + 0.06 * (hash(i, 3, seed) - 0.5)),
        z + Math.sin(a) * rz * k * s * bump
      ];
    })
  );
  const tone = (p, t, i) => {
    let c = m.mix(grey, light, 0.25 + 0.45 * hash(i, Math.round(t * 7), seed + 1));
    if (t > 0.45 && hash(i, Math.round(t * 5), seed + 2) > 0.55) c = lerp3(c, m.rgb(lichen), 0.55);
    if (t < 0.2) c = lerp3(c, m.rgb(foot), 0.6);
    return c;
  };
  for (let j = 0; j < rings.length - 1; j++)
    for (let i = 0; i < n; i++) {
      const k = (i + 1) % n,
        a = rings[j],
        b = rings[j + 1];
      m.face(
        [a[i], b[i], b[k], a[k]],
        [
          tone(a[i], levels[j][0], i),
          tone(b[i], levels[j + 1][0], i),
          tone(b[k], levels[j + 1][0], k),
          tone(a[k], levels[j][0], k)
        ]
      );
    }
  const crown = rings.at(-1),
    apex = [x + rx * 0.1, y + h * 1.05, z];
  for (let i = 0; i < n; i++)
    m.face(
      [apex, crown[(i + 1) % n], crown[i]],
      [m.mix(light, lichen, 0.3), tone(0, 1, i + 1), tone(0, 1, i)]
    );
}

// A Taihu stone column: a ring stack with a broad foot, a pinched waist and a
// swelling, overhanging shoulder. Lumps wander round it with height, hollows are
// darker and the sky-facing shoulders carry lichen. Returns its rings for holes.
function column(m, h, rad, seed, lean, look) {
  const rr = (k) => hash(seed, k, 31);
  const n = 9,
    levels = 8;
  const phase = [rr(1) * 6, rr(2) * 6, rr(3) * 6];
  const twist = (rr(4) - 0.5) * 1.2,
    flat = 0.62 + 0.18 * rr(5);
  const profile = (t) =>
    0.95 -
    (0.16 + 0.14 * rr(7)) * Math.exp(-(((t - 0.4 - 0.15 * rr(6)) / 0.2) ** 2)) +
    0.1 * Math.sin(t * 8 + phase[2]) -
    (t > 0.88 ? (t - 0.88) * 1.6 : 0);
  const lump = (a, t) =>
    0.24 * Math.sin(3 * a + phase[0] + t * 4.5) + 0.13 * Math.sin(5 * a + phase[1] - t * 3.2);
  const rings = [];
  for (let k = 0; k <= levels; k++) {
    const t = k / levels,
      y = t * h - 0.1,
      ox = lean[0] * t * t + rad * 0.25 * Math.sin(t * 6 + phase[1]),
      oz = lean[1] * t * t + rad * 0.15 * Math.sin(t * 5 + phase[0]);
    rings.push(
      Array.from({ length: n }, (_, i) => {
        const a = (i * circle) / n + twist * t,
          l = lump(a, t),
          s = rad * profile(t) * (1 + l);
        // The crown slopes and dips instead of rounding off like a head.
        const slope = t > 0.7 ? (t - 0.7) * h * 0.35 * Math.cos(a - phase[2]) : 0;
        return {
          p: [ox + Math.cos(a) * s, y + l * 0.05 + slope, oz + Math.sin(a) * s * flat],
          l,
          t
        };
      })
    );
  }
  const tone = ({ l, t }, i) => {
    let c = m.mix(
      look.grey,
      look.pale,
      clamp(0.45 + l * 2.2 + 0.2 * (hash(i, Math.round(t * 8), seed) - 0.5))
    );
    if (t > 0.55 && l > 0.02 && hash(i, Math.round(t * 8), seed + 7) > 0.5)
      c = lerp3(c, m.rgb(look.lichen), 0.5);
    if (t < 0.12) c = lerp3(c, m.rgb(0x5a5b49), 0.6 * (1 - t / 0.12));
    return c;
  };
  for (let k = 0; k < levels; k++)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        a = rings[k],
        b = rings[k + 1];
      facing(
        m,
        [a[i].p, b[i].p, b[j].p, a[j].p],
        [tone(a[i], i), tone(b[i], i), tone(b[j], j), tone(a[j], j)],
        [
          Math.cos((i + 0.5) * (circle / n) + twist * a[i].t),
          0,
          Math.sin((i + 0.5) * (circle / n) + twist * a[i].t)
        ]
      );
    }
  // A knobbly crown.
  const top = rings[levels],
    apex = [
      top.reduce((s, v) => s + v.p[0], 0) / n,
      h - 0.1 + rad * 0.25,
      top.reduce((s, v) => s + v.p[2], 0) / n
    ];
  for (let i = 0; i < n; i++)
    facing(
      m,
      [apex, top[i].p, top[(i + 1) % n].p],
      [m.mix(look.pale, look.lichen, 0.4), tone(top[i], i), tone(top[(i + 1) % n], i + 1)],
      UP
    );
  return rings;
}

// A water-worn hole: a dark recess with a pale worn lip, laid on one facet.
function bore(m, rings, k, i, scale) {
  const n = rings[0].length,
    a = rings[k][i].p,
    b = rings[k][(i + 1) % n].p,
    c = rings[k + 1][(i + 1) % n].p,
    d = rings[k + 1][i].p;
  const mid = [0, 1, 2].map((q) => (a[q] + b[q] + c[q] + d[q]) / 4);
  const across = [0, 1, 2].map((q) => (b[q] - a[q] + c[q] - d[q]) / 2),
    up = [0, 1, 2].map((q) => (d[q] - a[q] + c[q] - b[q]) / 2);
  const normal = [
    across[1] * up[2] - across[2] * up[1],
    across[2] * up[0] - across[0] * up[2],
    across[0] * up[1] - across[1] * up[0]
  ];
  const len = Math.hypot(...normal) || 1;
  // Point the normal away from the column's axis.
  let out = normal.map((v) => v / len);
  if (out[0] * mid[0] + out[2] * mid[2] < 0) out = out.map((v) => -v);
  const at = (u, v, lift) =>
    [0, 1, 2].map((q) => mid[q] + across[q] * u + up[q] * v + out[q] * lift);
  const lip = [],
    pit = [];
  for (let s = 0; s < 7; s++) {
    const t = (s * circle) / 7,
      w = 0.32 * scale * (1 + 0.15 * Math.sin(s * 2.3)),
      v = 0.36 * scale * (1 + 0.12 * Math.cos(s * 1.7));
    lip.push(at(Math.cos(t) * w, Math.sin(t) * v, 0.022));
    pit.push(at(Math.cos(t) * w * 0.66, Math.sin(t) * v * 0.62 - 0.05 * scale, 0.012));
  }
  for (let s = 0; s < 7; s++) {
    const q = (s + 1) % 7;
    facing(
      m,
      [lip[s], lip[q], pit[q], pit[s]],
      [m.rgb(0xc2c1b0), m.rgb(0xc2c1b0), m.rgb(0x3c403a), m.rgb(0x3c403a)],
      out
    );
  }
  facing(m, pit, 0x22261f, out);
}

// A Taihu stone: one waisted column, or two leaning together under a shared cap so
// daylight shows through between them. Each is shaped by its seed.
function taihu(m, h, w, seed) {
  const rr = (k) => hash(seed, k, 37);
  const look = {
    grey: rr(1) > 0.5 ? 0x7f8582 : 0x88877b,
    pale: rr(2) > 0.5 ? 0xcfcfc2 : 0xc8c6b4,
    lichen: rr(3) > 0.5 ? 0xb3a964 : 0x9fa86f
  };
  const twin = rr(4) > 0.62;
  if (twin) {
    const lean = w * (0.15 + 0.06 * rr(5));
    m.frame(-w * 0.3, 0, 0, 0, 1, () => {
      const rings = column(m, h * 0.88, w * 0.27, seed * 3 + 1, [lean, 0], look);
      bore(m, rings, 5, Math.floor(rr(6) * 9), 0.9);
    });
    m.frame(w * 0.3, 0, 0, 0, 1, () => {
      const rings = column(m, h * 0.74, w * 0.25, seed * 3 + 2, [-lean, 0.03], look);
      bore(m, rings, 3, Math.floor(rr(7) * 9), 0.8);
    });
    // The shared cap bridges the two heads.
    boulder(m, 0, h * 0.62, 0, w * 0.34, h * 0.2, w * 0.2, m.rng, {
      n: 8,
      grey: look.grey,
      light: look.pale,
      lichen: look.lichen,
      foot: look.grey
    });
    return;
  }
  const rings = column(m, h, w * 0.42, seed * 3, [(rr(8) - 0.5) * 0.3, (rr(9) - 0.5) * 0.2], look);
  const holes = 1 + Math.floor(rr(10) * 3);
  for (let q = 0; q < holes; q++)
    bore(m, rings, 2 + ((q * 2 + Math.floor(rr(11) * 2)) % 5), Math.floor(rr(12 + q) * 9), 1);
}

// Earth, moss and pebbles heaped against a stone's foot so it is set into the ground.
function collar(m, x, z, rx, rz, r, col = 0x66704c) {
  const n = 9,
    ring = [],
    outer = [];
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n,
      k = r.range(0.85, 1.15);
    ring.push([x + Math.cos(a) * rx * k * 0.75, 0.085, z + Math.sin(a) * rz * k * 0.75]);
    outer.push([x + Math.cos(a) * rx * k * 1.25, 0.04, z + Math.sin(a) * rz * k * 1.25]);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    facing(
      m,
      [ring[i], outer[i], outer[j], ring[j]],
      [m.mix(col, 0x7d8a58, 0.4), m.rgb(col), m.rgb(col), m.mix(col, 0x7d8a58, 0.4)],
      UP
    );
  }
  for (let k = 0; k < 3; k++) {
    const a = r.range(0, circle),
      d = r.range(1, 1.3);
    boulder(m, x + Math.cos(a) * rx * d, 0.03, z + Math.sin(a) * rz * d, 0.05, 0.045, 0.04, r, {
      n: 5
    });
  }
}

function rockTile(m, x, z, cell, r) {
  const seed = cell.x * 31 + cell.y * 17;
  const h = 0.92 + 0.3 * hash(cell.x, cell.y, 3),
    w = 0.7 + 0.18 * hash(cell.x, cell.y, 4);
  const yaw = hash(cell.x, cell.y, 5) * circle;
  m.frame(x + (hash(cell.x, cell.y, 6) - 0.5) * 0.08, 0, z - 0.04, yaw, 1, () =>
    taihu(m, h, w, seed)
  );
  collar(m, x, z - 0.04, 0.3, 0.26, r);
  // A companion stone or two at the foot.
  if (hash(cell.x, cell.y, 8) > 0.3)
    boulder(
      m,
      x + 0.24 * Math.cos(yaw + 1.9),
      0.0,
      z + 0.22 * Math.sin(yaw + 1.9),
      0.13,
      0.22,
      0.11,
      r,
      { n: 7 }
    );
  for (let k = 0; k < 2; k++)
    tuft(m, x + r.range(-0.35, 0.35), 0.05, z + r.range(0.2, 0.4), 0.1, r);
}

function coverTile(m, x, z, r, drift) {
  // Low knee-high stones along the back of the tile, half sunk in turf.
  const n = 2 + Math.floor(r.next() * 2);
  for (let k = 0; k < n; k++) {
    const u = x - 0.3 + (0.6 * (k + 0.5)) / n + r.range(-0.05, 0.05),
      v = z - 0.27 + r.range(-0.06, 0.08);
    const s = r.range(0.13, 0.19);
    boulder(m, u, 0.0, v, s, r.range(0.2, 0.32), s * r.range(0.7, 0.95), r, { n: 7 });
  }
  boulder(m, x + r.range(-0.3, 0.3), 0.01, z + r.range(0.12, 0.35), 0.07, 0.06, 0.06, r, { n: 6 });
  for (let k = 0; k < 4; k++)
    tuft(m, x + r.range(-0.42, 0.42), 0.05, z + r.range(-0.42, 0.42), 0.1, r);
  for (let k = 0; k < Math.round(drift * 5); k++)
    petal(m, x + r.range(-0.45, 0.45), 0.052, z + r.range(-0.1, 0.45), r);
}

function thicketTile(m, x, z, cell, r, drift) {
  // Three young peach bushes along the back of the tile, flowers spilling forward.
  for (let k = 0; k < 3; k++) {
    const u = x - 0.3 + 0.3 * k + r.range(-0.05, 0.05),
      v = z - 0.25 + r.range(-0.06, 0.06) + (k === 1 ? -0.04 : 0.04);
    peachBush(m, u, 0.04, v, r.range(0.5, 0.7) * (k === 1 ? 1.1 : 0.9), r);
  }
  for (let k = 0; k < 3; k++)
    tuft(m, x + r.range(-0.42, 0.42), 0.05, z + r.range(-0.1, 0.42), 0.1, r);
  for (let k = 0; k < 10 + Math.round(drift * 8); k++)
    petal(m, x + r.range(-0.46, 0.46), 0.052, z + r.range(-0.46, 0.46), r);
}

function herbTile(m, x, z, r) {
  // A low bed of tilled earth edged with stones, set out in rows of medicinal herbs.
  const edge = 0.41;
  for (let k = 0; k < 14; k++) {
    const t = k / 14,
      side = Math.floor(t * 4),
      f = (t * 4) % 1;
    const corners = [
      [-edge, -edge],
      [edge, -edge],
      [edge, edge],
      [-edge, edge],
      [-edge, -edge]
    ];
    const [a, b] = [corners[side], corners[side + 1]];
    boulder(
      m,
      x + a[0] + (b[0] - a[0]) * f,
      0.015,
      z + a[1] + (b[1] - a[1]) * f,
      0.055,
      0.05,
      0.045,
      r,
      {
        n: 5,
        grey: 0x8a8775
      }
    );
  }
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const u = x - 0.24 + col * 0.24 + r.range(-0.03, 0.03),
        v = z - 0.24 + row * 0.24 + r.range(-0.03, 0.03);
      if ((row + col) % 2) {
        // A broad-leafed rosette.
        for (let k = 0; k < 6; k++) {
          const a = (k * circle) / 6 + r.range(-0.2, 0.2),
            l = r.range(0.08, 0.12);
          m.leaf(
            [u, 0.05, v],
            [u + Math.cos(a) * l, 0.09, v + Math.sin(a) * l],
            l * 0.32,
            0x5d7d4c,
            0x8fa868,
            0.03
          );
        }
      } else {
        // An upright flowering herb.
        for (let k = 0; k < 3; k++) {
          const a = (k * circle) / 3 + r.range(0, 1),
            top = [u + Math.cos(a) * 0.035, r.range(0.15, 0.22), v + Math.sin(a) * 0.035];
          m.tube([u, 0.05, v], top, 0.007, 0.005, 0x6c8550, 4);
          m.leaf(
            [u, 0.08, v],
            [u + Math.cos(a + 1) * 0.07, 0.12, v + Math.sin(a + 1) * 0.07],
            0.02,
            0x6a8a52,
            0x95ad6b,
            0.01
          );
          const bloom = r.pick([0xf1e6dc, 0xd9b8de, 0xf0d9a0]);
          m.leaf(top, [top[0] + 0.03, top[1] + 0.01, top[2]], 0.02, bloom, bloom, 0.01);
          m.leaf(top, [top[0] - 0.015, top[1] + 0.01, top[2] + 0.026], 0.02, bloom, bloom, 0.01);
        }
      }
    }
}

// How thickly petals lie: drifts swept by the wind plus a fall near each tree.
function petalDrift(x, z, trees = []) {
  let d =
    0.25 * noise(x * 0.35 + 4, z * 0.35 - 2, 5) +
    0.35 * Math.max(0, noise(x * 0.7, z * 0.7, 6) - 0.45);
  for (const [tx, tz, reach] of trees)
    d += Math.max(0, 1 - Math.hypot(x - tx, z - tz) / reach) * 0.9;
  return Math.min(1, d);
}

function formationTiles(m, layout, trees) {
  const { width, height } = layout,
    r = m.rng;
  for (const cell of layout.cells) {
    const x = cell.x - (width - 1) / 2,
      z = cell.y - (height - 1) / 2;
    const drift = petalDrift(x, z, trees);
    if (cell.kind === 'plain') paving(m, layout, cell, drift);
    else if (cell.kind === 'rock') rockTile(m, x, z, cell, r);
    else if (cell.kind === 'cover') coverTile(m, x, z, r, drift);
    else if (cell.kind === 'bamboo') thicketTile(m, x, z, cell, r, drift);
    else if (cell.kind === 'herbs') herbTile(m, x, z, r);
  }
}

export { hash, noise, facing, tuft, boulder, taihu, collar, petalDrift, formationTiles };
