// 萬安寺's thirteen-storey pagoda. It rises from the stone block at the north of the board: a
// moulded 須彌座 plinth with a white rail round its top and steps down to the court in front,
// then an octagonal tower of thirteen storeys, each a little narrower and lower than the one
// below. Every storey has corner posts, a door or window on four faces and lattice on the
// others, a band of brackets under deep tiled eaves whose corners curl up, a bell hanging from
// every corner, and above each eave a railed gallery. A few windows are lit high up: the
// prisoners' floors. A bronze spire of nine rings closes it, chained to the last roof's corners.
import { circle } from '../scenery-kit.js';
import {
  OUT,
  put,
  mark,
  lattice,
  stone,
  stoneLight,
  stoneDark,
  plaster,
  lacquerDark,
  ink,
  gilt,
  giltDark,
  bronze
} from './kit-17.js';

const PZ = -6.0; // the pagoda's axis, on the board's north edge
const BASE = 0.6; // top of the plinth
const body = 0x565a68; // brick under a grey wash, dark against the sky
const bodyDark = 0x3e424e;
const eaveTones = [0x14171e, 0x252a35, 0x46506a];
const bracketTone = 0x3a4252;
const bracketPaint = 0x2c4c52;
const railTone = 0x7d8593;
const C8 = Math.cos(circle / 16); // apothem over corner radius of an octagon
const STOREYS = 13;
// The lit windows: [storey, face]. Faces count from east (0) round by south (2).
const LIT = [
  [2, 2],
  [3, 0],
  [4, 6],
  [5, 2],
  [6, 4],
  [7, 0],
  [8, 2],
  [9, 6],
  [10, 2],
  [11, 0]
];

const corner = (k, a, y = 0) => {
  const t = ((k - 0.5) * circle) / 8,
    r = a / C8;
  return [Math.cos(t) * r, y, PZ + Math.sin(t) * r];
};
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// A face of the octagon in its own frame: x along the face, +z out, y up from `y`.
function onFace(m, i, a, y, draw) {
  const phi = (i * circle) / 8;
  m.frame(Math.cos(phi) * a, y, PZ + Math.sin(phi) * a, Math.PI / 2 - phi, 1, draw);
}

// The plinth: a broad base course, a moulded 須彌座 with a lotus waist, a stone rail round the
// top, and three steps down the front between cheek walls.
function plinth(m) {
  const x = 1.5,
    z0 = -7.5,
    z1 = -4.5;
  m.box(0, (OUT + 0.2) / 2, (z0 - 0.08 + -4.05) / 2, 3.0, 0.2 - OUT, -4.05 - z0 + 0.08, stoneDark);
  const tiers = [
    [0.2, 0.27, 1.02, stone],
    [0.27, 0.31, 0.985, stoneLight],
    [0.31, 0.45, 0.95, bodyDark],
    [0.45, 0.5, 0.985, stoneLight],
    [0.5, 0.6, 1.0, stone]
  ];
  for (const [lo, hi, k, col] of tiers)
    m.box(0, (lo + hi) / 2, (z0 + z1) / 2, 2 * x * k - 0.06, hi - lo, (z1 - z0) * k - 0.06, col);
  // Lotus petals round the waist, and posts between carved panels.
  for (const [ax, az, bx, bz, out] of [
    [-x, z1, x, z1, [0, 0, 1]],
    [x, z0, -x, z0, [0, 0, -1]],
    [x, z1, x, z0, [1, 0, 0]],
    [-x, z0, -x, z1, [-1, 0, 0]]
  ]) {
    const len = Math.hypot(bx - ax, bz - az),
      n = Math.round(len / 0.2);
    const inset = (p, d) => [p[0] - out[0] * d, p[1], p[2] - out[2] * d];
    for (let i = 0; i < n; i++) {
      const t0 = i / n,
        t1 = (i + 1) / n,
        tm = (t0 + t1) / 2;
      const a = inset([ax + (bx - ax) * t0, 0.45, az + (bz - az) * t0], 0.025),
        b = inset([ax + (bx - ax) * t1, 0.45, az + (bz - az) * t1], 0.025),
        c = inset([ax + (bx - ax) * tm, 0.5, az + (bz - az) * tm], -0.005);
      put(m, [a, b, c], stoneLight, out);
      const d = inset([ax + (bx - ax) * t0, 0.31, az + (bz - az) * t0], 0.025),
        e = inset([ax + (bx - ax) * t1, 0.31, az + (bz - az) * t1], 0.025),
        f = inset([ax + (bx - ax) * tm, 0.27, az + (bz - az) * tm], -0.005);
      put(m, [d, e, f], stone, out);
    }
    for (let i = 0; i <= 4; i++) {
      const t = i / 4,
        p = inset([ax + (bx - ax) * t, 0.38, az + (bz - az) * t], 0.03);
      m.box(p[0], 0.38, p[2], out[2] ? 0.07 : 0.06, 0.14, out[2] ? 0.06 : 0.07, stone);
    }
  }
  // Steps down the front, between sloping cheek walls.
  for (let i = 1; i <= 3; i++) {
    const zf = -4.05 - 0.15 * (i - 1),
      top = 0.2 + 0.133 * i;
    m.box(0, (top + 0.2) / 2, (zf + z1 - 0.1) / 2, 1.1, top - 0.2, zf - z1 + 0.1, i % 2 ? stone : stoneLight);
  }
  for (const s of [-1, 1]) {
    const xa = s * 0.55,
      xb = s * 0.7;
    put(
      m,
      [
        [xa, 0.33, -4.05],
        [xb, 0.33, -4.05],
        [xb, 0.68, -4.55],
        [xa, 0.68, -4.55]
      ],
      stoneLight
    );
    put(
      m,
      [
        [xb, 0.2, -4.05],
        [xb, 0.33, -4.05],
        [xb, 0.68, -4.55],
        [xb, 0.6, -4.55],
        [xb, 0.2, -4.55]
      ],
      stone,
      [s, 0, 0]
    );
    put(
      m,
      [
        [xa, 0.2, -4.05],
        [xb, 0.2, -4.05],
        [xb, 0.33, -4.05],
        [xa, 0.33, -4.05]
      ],
      stone,
      [0, 0, 1]
    );
  }
  // The rail round the top, open at the head of the steps.
  const rail = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az),
      n = Math.max(1, Math.round(len / 0.5)),
      yaw = Math.atan2(-(bz - az), bx - ax);
    m.frame((ax + bx) / 2, BASE, (az + bz) / 2, yaw, 1, () => {
      m.box(0, 0.25, 0, len, 0.04, 0.06, railTone);
      m.box(0, 0.12, 0, len - 0.04, 0.12, 0.03, m.mix(railTone, stoneDark, 0.4));
      for (let i = 0; i <= n; i++) {
        const px = -len / 2 + (len * i) / n;
        m.box(px, 0.14, 0, 0.07, 0.28, 0.07, railTone);
        m.box(px, 0.3, 0, 0.045, 0.05, 0.045, stoneLight);
      }
    });
  };
  const e = 1.42,
    f0 = -7.42,
    f1 = -4.58;
  rail(-e, f1, -0.72, f1);
  rail(0.72, f1, e, f1);
  rail(e, f1, e, f0);
  rail(-e, f0, -e, f1);
  rail(-e, f0, e, f0);
}

// One octagonal eave: from apothem `ai` at height `yi` out and down to apothem `ao` at `yo`,
// its corners curling up by `lift`. Pan tiles under rows of half-round tiles, a fascia, hip
// ridges with an upturned tip, and a bell hanging from each tip.
function octEave(m, ai, yi, ao, yo, lift, bells = true) {
  const [dark, mid, hi] = eaveTones;
  const rows = 3,
    rise = yi - yo;
  const prof = (t) => rise * (0.2 * t + 0.8 * t * t);
  for (let i = 0; i < 8; i++) {
    const oa = corner(i, ao),
      ob = corner(i + 1, ao),
      ia = corner(i, ai),
      ib = corner(i + 1, ai),
      phi = (i * circle) / 8,
      out = [Math.cos(phi), 0, Math.sin(phi)];
    const at = (s, t) => {
      const p = lerp3(lerp3(oa, ob, s), lerp3(ia, ib, s), t);
      p[1] = yo + prof(t) + lift * Math.pow(Math.abs(2 * s - 1), 3) * (1 - t) * (1 - t);
      return p;
    };
    const n = Math.max(4, Math.round((ao * 0.83) / 0.21));
    for (let a = 0; a < n; a++)
      for (let k = 0; k < rows; k++) {
        const s0 = a / n,
          s1 = (a + 1) / n,
          t0 = k / rows,
          t1 = (k + 1) / rows;
        put(m, [at(s0, t0), at(s1, t0), at(s1, t1), at(s0, t1)], m.mix(dark, mid, ((a * 3 + k) % 5) * 0.12), [
          out[0],
          1.2,
          out[2]
        ]);
      }
    // The fascia under the eave, and a lit edge of eave tiles along it.
    for (let a = 0; a < n; a++) {
      const p = at(a / n, 0),
        q = at((a + 1) / n, 0);
      put(m, [p, q, [q[0], q[1] - 0.07, q[2]], [p[0], p[1] - 0.07, p[2]]], lacquerDark, out);
      put(m, [p, q, [q[0] - out[0] * 0.05, q[1] + 0.02, q[2] - out[2] * 0.05], [p[0] - out[0] * 0.05, p[1] + 0.02, p[2] - out[2] * 0.05]], hi, [out[0], 1, out[2]]);
    }
    // Half-round tiles over the seams.
    for (let a = 1; a < n; a++) {
      const s = a / n;
      let last = null;
      const along = [ob[0] - oa[0], ob[2] - oa[2]],
        l = Math.hypot(...along),
        ex = along[0] / l,
        ez = along[1] / l;
      for (let k = 0; k <= rows; k++) {
        const p = at(s, k / rows),
          r = 0.03,
          ring = [];
        for (let q = 0; q <= 2; q++) {
          const ang = (q * Math.PI) / 2;
          ring.push([p[0] + ex * r * Math.cos(ang), p[1] + 0.03 * Math.sin(ang) + 0.004, p[2] + ez * r * Math.cos(ang)]);
        }
        if (last) for (let q = 0; q < 2; q++) put(m, [last[q], ring[q], ring[q + 1], last[q + 1]], [hi, mid][q], [out[0], 1, out[2]]);
        last = ring;
      }
    }
    // The hip ridge at the corner, turning up past the eave, and its bell.
    const hip = [];
    for (let k = rows; k >= 0; k--) {
      const p = at(0, k / rows);
      hip.push([p[0], p[1] + 0.035, p[2]]);
    }
    const c = hip.at(-1),
      dir = [c[0], c[2] - PZ],
      dl = Math.hypot(...dir),
      tip = [c[0] + (dir[0] / dl) * 0.14, c[1] + 0.13, c[2] + (dir[1] / dl) * 0.14];
    m.line([...hip, tip], 0.034, 0x161a21, 5);
    m.tube(tip, [tip[0] + (dir[0] / dl) * 0.03, tip[1] + 0.07, tip[2] + (dir[1] / dl) * 0.03], 0.024, 0.006, giltDark, 4);
    if (bells) {
      const b = [c[0] + (dir[0] / dl) * 0.06, c[1] - 0.03, c[2] + (dir[1] / dl) * 0.06];
      m.tube(b, [b[0], b[1] - 0.12, b[2]], 0.006, 0.006, ink, 3);
      m.lathe(
        b[0],
        b[1] - 0.25,
        b[2],
        [
          [0, 0.05],
          [0.1, 0.032],
          [0.13, 0]
        ],
        bronze,
        5
      );
      m.box(b[0], b[1] - 0.28, b[2], 0.012, 0.05, 0.012, gilt);
    }
  }
}

// A ring of bracket blocks under an eave: three to a face, the corner ones reaching out.
function brackets(m, a, y) {
  for (let i = 0; i < 8; i++) {
    onFace(m, i, a, y, () => {
      const w = 0.83 * a;
      m.box(0, 0.03, 0.02, w + 0.02, 0.06, 0.06, bracketPaint);
      m.box(0, 0.12, 0.06, 0.08, 0.12, 0.1, bracketTone);
      m.box(0, 0.18, 0.1, w * 0.5, 0.05, 0.06, bracketPaint);
    });
    const c = corner(i, a + 0.02, y);
    const out = [c[0], c[2] - PZ],
      l = Math.hypot(...out);
    m.tube([c[0], y + 0.12, c[2]], [c[0] + (out[0] / l) * 0.2, y + 0.2, c[2] + (out[1] / l) * 0.2], 0.035, 0.03, bracketTone, 4);
  }
}

// One storey's walls: corner posts, a door or window on the four main faces, lattice between.
function walls(m, k, a, y, h) {
  const top = [],
    bot = [];
  for (let i = 0; i < 8; i++) {
    top.push(corner(i, a, y + h));
    bot.push(corner(i, a, y));
  }
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8,
      phi = (i * circle) / 8;
    put(m, [bot[i], bot[j], top[j], top[i]], k % 2 ? body : m.mix(body, bodyDark, 0.2), [Math.cos(phi), 0, Math.sin(phi)]);
    m.tube(bot[i], top[i], 0.035, 0.032, lacquerDark, 5);
  }
  // A lintel band round the top and a plinth band round the foot.
  for (let i = 0; i < 8; i++)
    onFace(m, i, a, y, () => {
      const w = 0.83 * a;
      m.box(0, h - 0.06, 0.012, w, 0.1, 0.03, lacquerDark);
      m.box(0, 0.04, 0.012, w, 0.08, 0.03, bodyDark);
    });
  for (let face = 0; face < 8; face++) {
    onFace(m, face, a, y, () => {
      const w = 0.83 * a,
        main = face % 2 === 0,
        lit = LIT.some(([s, f]) => s === k && f === face);
      if (k === 0) {
        if (face === 2) return;
        if (main) {
          // A shut door of studded leaves under an arched head.
          m.box(0, 0.62, 0.02, 0.56, 1.06, 0.03, lacquerDark);
          m.box(0, 1.17, 0.02, 0.62, 0.06, 0.04, stoneDark);
          for (let r = 0; r < 4; r++)
            for (const sx of [-1, 1])
              for (let c = 0; c < 2; c++) m.box(sx * (0.07 + c * 0.1), 0.3 + r * 0.22, 0.04, 0.03, 0.03, 0.015, giltDark);
          m.box(0, 0.62, 0.04, 0.012, 1.0, 0.012, ink);
        } else {
          // A niche with a seated figure in relief.
          m.box(0, 0.72, 0.012, 0.42, 0.62, 0.02, ink);
          m.lathe(0, 0.46, 0.04, [[0, 0.1], [0.12, 0.08], [0.18, 0.05], [0.25, 0.045], [0.29, 0]], stoneDark, 6);
          m.box(0, 1.08, 0.025, 0.5, 0.06, 0.04, stone);
        }
        return;
      }
      if (main) {
        const ww = Math.min(0.36, w * 0.5),
          wh = h * 0.5;
        if (lit) {
          m.frame(0, h * 0.47, 0.02, 0, 1, () => lattice(m, ww, wh, 2, 3, true, ink));
          mark(m, 0, h * 0.47, 0.35, 0.8);
        } else {
          m.box(0, h * 0.47, 0.015, ww, wh, 0.02, ink);
          m.box(0, h * 0.47, 0.03, 0.02, wh, 0.02, bodyDark);
        }
      } else {
        // A blind window: a dark panel crossed by a bar.
        m.box(0, h * 0.47, 0.012, w * 0.42, h * 0.42, 0.02, bodyDark);
        m.box(0, h * 0.47, 0.024, w * 0.42, 0.025, 0.02, lacquerDark);
      }
    });
  }
}

// The ground storey's door: open on a lamplit shrine, the leaves folded back.
function doorway(m) {
  onFace(m, 2, 1.12, BASE, () => {
    m.glow(() =>
      put(
        m,
        [
          [-0.3, 0.02, 0.01],
          [0.3, 0.02, 0.01],
          [0.3, 1.0, 0.01],
          [0.2, 1.12, 0.01],
          [-0.2, 1.12, 0.01],
          [-0.3, 1.0, 0.01]
        ],
        0xe8a250,
        [0, 0, 1]
      )
    );
    // A figure of the Buddha within, dark against the lamp.
    m.lathe(0, 0.08, 0.03, [[0, 0.13], [0.16, 0.1], [0.36, 0.08], [0.48, 0.07], [0.56, 0.05], [0.66, 0]], 0x6a4a2c, 6);
    for (const s of [-1, 1]) {
      m.box(s * 0.36, 0.55, 0.18, 0.04, 1.06, 0.3, lacquerDark);
      m.box(s * 0.34, 0.6, 0.04, 0.08, 1.2, 0.06, stoneDark);
    }
    m.box(0, 1.2, 0.05, 0.8, 0.08, 0.08, stoneDark);
    // A name board over the door.
    m.box(0, 1.33, 0.07, 0.46, 0.17, 0.03, 0x22385a);
    m.box(0, 1.33, 0.09, 0.32, 0.08, 0.01, gilt);
  });
  mark(m, 0, BASE + 0.6, PZ + 1.6, 1.2);
}

// A railed gallery round a storey's foot.
function gallery(m, a, y) {
  const o = a + 0.2;
  for (let i = 0; i < 8; i++) {
    const p = corner(i, a - 0.02, y),
      q = corner(i + 1, a - 0.02, y),
      r = corner(i + 1, o, y),
      s = corner(i, o, y);
    put(m, [p, q, r, s], m.mix(bodyDark, stoneDark, 0.5));
    put(m, [s, r, [r[0], y - 0.07, r[2]], [s[0], y - 0.07, s[2]]], lacquerDark, [Math.cos((i * circle) / 8), 0, Math.sin((i * circle) / 8)]);
  }
  const ring = [];
  for (let i = 0; i <= 8; i++) ring.push(corner(i, o - 0.03, y + 0.2));
  m.line(ring, 0.014, railTone, 4);
  for (let i = 0; i < 8; i++) {
    const c = corner(i, o - 0.03, y);
    m.box(c[0], y + 0.1, c[2], 0.03, 0.2, 0.03, railTone);
  }
}

// The spire: a dome on a lotus, nine rings, a canopy hung with bells, a pearl, and chains.
function spire(m, y, a) {
  m.lathe(
    0,
    y,
    PZ,
    [
      [0, 0.34],
      [0.12, 0.36],
      [0.2, 0.3],
      [0.36, 0.33],
      [0.52, 0.26],
      [0.62, 0.12]
    ],
    bronze,
    10
  );
  const prof = [];
  for (let k = 0; k < 9; k++) {
    const r = 0.2 - k * 0.011;
    prof.push([0.62 + k * 0.17, r * 0.55], [0.62 + k * 0.17 + 0.05, r], [0.62 + k * 0.17 + 0.12, r]);
  }
  prof.push([2.2, 0.06]);
  m.lathe(0, y, PZ, prof, giltDark, 8);
  m.lathe(0, y + 2.2, PZ, [[0, 0.06], [0.04, 0.34], [0.1, 0.3], [0.13, 0.08]], gilt, 10);
  for (let i = 0; i < 8; i++) {
    const t = (i * circle) / 8,
      x = Math.cos(t) * 0.33,
      z = PZ + Math.sin(t) * 0.33;
    m.tube([x, y + 2.23, z], [x, y + 2.11, z], 0.005, 0.005, ink, 3);
    m.lathe(x, y + 2.03, z, [[0, 0.03], [0.07, 0.02], [0.08, 0]], bronze, 5);
  }
  m.lathe(0, y + 2.33, PZ, [[0, 0.06], [0.12, 0.14], [0.26, 0.12], [0.36, 0.05], [0.46, 0.08], [0.58, 0]], gilt, 8);
  for (let i = 0; i < 8; i++) {
    const c = corner(i, a, y - 0.35);
    const mid = [c[0] * 0.5, y + 1.0, PZ + (c[2] - PZ) * 0.5];
    m.line([[0, y + 2.25, PZ], mid, c], 0.008, ink, 3);
  }
}

// The pagoda in two parts: its foot (the plinth and the ground storey), which never hides the
// board, and the tower of twelve storeys over it, which the camera may see through.
function pagoda(m, part) {
  if (part === 'foot') plinth(m);
  let y = BASE;
  for (let k = 0; k < STOREYS; k++) {
    const a = k ? 1.05 - 0.03 * k : 1.12,
      h = k ? 0.78 - 0.012 * k : 1.45,
      over = k ? 0.4 - 0.006 * k : 0.55,
      draw = (part === 'foot') === (k === 0);
    if (!draw) {
      y += h + 0.28;
      continue;
    }
    if (k) gallery(m, a, y);
    walls(m, k, a, y, h);
    brackets(m, a, y + h - 0.02);
    const yi = y + h + 0.25;
    octEave(m, a + 0.02, yi, a + over, y + h + 0.03, k ? 0.13 : 0.18);
    // The floor of the storey above, laid over the top of the eave.
    const next = k < STOREYS - 1 ? 1.05 - 0.03 * (k + 1) : 0;
    if (k < STOREYS - 1) {
      for (let i = 0; i < 8; i++) {
        const p = corner(i, a + 0.03, yi),
          q = corner(i + 1, a + 0.03, yi),
          c = corner(i, next, yi),
          d = corner(i + 1, next, yi);
        put(m, [p, q, d, c], eaveTones[1]);
      }
      y = yi + 0.03;
    } else {
      // The last roof closes in a low octagonal cone.
      const peak = [0, yi + 0.55, PZ];
      for (let i = 0; i < 8; i++) {
        const p = corner(i, a + 0.03, yi),
          q = corner(i + 1, a + 0.03, yi);
        put(m, [p, q, peak], m.mix(eaveTones[1], eaveTones[2], i % 2 ? 0.2 : 0.45));
        m.line([[p[0], p[1] + 0.03, p[2]], [peak[0], peak[1] + 0.02, peak[2]]], 0.03, 0x161a21, 4);
      }
      spire(m, yi + 0.45, a + 0.3);
      y = yi;
    }
  }
  if (part === 'foot') doorway(m);
  return y;
}

export { pagoda, PZ };
