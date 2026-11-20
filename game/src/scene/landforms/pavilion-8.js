import { circle } from '../scenery-kit.js';
import { lantern } from '../maze-models.js';

// Storeyed shop-houses of the mirrored street. Each is drawn in its own frame:
// floor level at y 0, the shopfront facing +z. Timber follows the real order of
// a Chinese hall: stone plinth, lacquered columns on carved bases, painted
// architraves, bracket sets under the eaves, a pent roof with a balcony over
// it, an upper storey of lattice windows and a hipped roof with upswept
// corners and ridge ornaments.
const gilt = 0xc9a45e;
const ink = 0x2e2f3a;
const paper = 0xf2cf92;

function column(m, x, z, h, lacquer) {
  m.lathe(
    x,
    0,
    z,
    [
      [0, 0.1],
      [0.05, 0.105],
      [0.08, 0.078],
      [0.1, 0.07]
    ],
    0xa9a49a,
    8
  );
  m.tube([x, 0.09, z], [x, h, z], 0.064, 0.056, lacquer, 8);
}

// One bracket set: a bearing block, a cross-arm along the facade and a
// cantilever that reaches out under the eave purlin.
function bracket(m, x, y, z, out, wood, paint) {
  m.box(x, y + 0.03, z, 0.13, 0.06, 0.13, wood);
  m.box(x, y + 0.09, z, 0.42, 0.055, 0.075, paint);
  for (const s of [-1, 1]) m.box(x + s * 0.19, y + 0.135, z, 0.08, 0.045, 0.09, wood);
  m.box(x, y + 0.14, z + out * 0.14, 0.075, 0.06, 0.4, wood);
  m.box(x, y + 0.19, z + out * 0.3, 0.1, 0.05, 0.1, wood);
  m.box(x, y + 0.2, z + out * 0.06, 0.3, 0.05, 0.07, paint);
}

function latticePanel(m, x, y, z, w, h, frame, lit) {
  // Lit paper glows behind a grid of muntins.
  m.glow(() => m.box(x, y, z - 0.012, w, h, 0.02, lit ? paper : 0xb9ad94));
  for (const k of [-1, 1]) {
    m.box(x + (k * w) / 2, y, z + 0.01, 0.04, h + 0.04, 0.04, frame);
    m.box(x, y + (k * h) / 2, z + 0.01, w + 0.04, 0.04, 0.04, frame);
  }
  const cols = Math.max(2, Math.round(w / 0.11)),
    rows = Math.max(2, Math.round(h / 0.11));
  for (let j = 1; j < cols; j++)
    m.box(x - w / 2 + (j * w) / cols, y, z + 0.008, 0.016, h, 0.018, frame);
  for (let j = 1; j < rows; j++)
    m.box(x, y - h / 2 + (j * h) / rows, z + 0.008, w, 0.016, 0.018, frame);
}

function balustrade(m, ax, az, bx, bz, y, h, wood, cap) {
  const len = Math.hypot(bx - ax, bz - az),
    n = Math.max(2, Math.round(len / 0.4)),
    yaw = Math.atan2(-(bz - az), bx - ax);
  m.frame((ax + bx) / 2, y, (az + bz) / 2, yaw, 1, () => {
    m.box(0, h, 0, len + 0.05, 0.045, 0.06, cap);
    m.box(0, h * 0.42, 0, len, 0.03, 0.04, wood);
    m.box(0, 0.03, 0, len, 0.05, 0.06, wood);
    for (let i = 0; i <= n; i++) {
      const x = -len / 2 + (i * len) / n;
      m.box(x, h / 2, 0, 0.055, h + 0.04, 0.055, wood);
      if (i < n)
        for (let k = 1; k < 4; k++)
          m.box(x + (k * len) / n / 4, h * 0.21, 0, 0.022, h * 0.34, 0.022, cap);
    }
  });
}

// A hipped roof with a sweeping, upturned eave. Rows of tile ribs run down
// each slope, the ridge carries a dragon-tail ornament at each end, and the
// four corners curl up past the eave line.
function hipRoof(m, width, depth, eave, rise, [dark, mid, hi], ridgeTone) {
  const nx = Math.max(12, Math.round(width * 4.4)),
    rows = 5;
  function sample(u, t, side) {
    const x = u * (width * 0.5) * (1 - 0.36 * t),
      z = side * depth * 0.5 * (1 - t * 0.94);
    const lift = 0.3 * Math.pow(Math.abs(u), 3.4) * (1 - t);
    return [x, eave + rise * (0.1 * t + 0.9 * t * t) + lift, z];
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < nx; i++) {
      const u0 = -1 + (2 * i) / nx,
        u1 = -1 + (2 * (i + 1)) / nx;
      for (let k = 0; k < rows; k++) {
        const p = [
          sample(u0, k / rows, side),
          sample(u1, k / rows, side),
          sample(u1, (k + 1) / rows, side),
          sample(u0, (k + 1) / rows, side)
        ];
        m.face(p, m.mix(mid, hi, ((i * 3 + k * 2) % 7) * 0.06));
      }
      // Fascia board and a round tile end at the foot of every rib.
      const a = sample(u0, 0, side),
        b = sample(u1, 0, side);
      m.face([a, b, [b[0], b[1] - 0.085, b[2]], [a[0], a[1] - 0.085, a[2]]], dark);
      m.face(
        [
          [a[0], a[1] - 0.085, a[2]],
          [b[0], b[1] - 0.085, b[2]],
          [b[0] * 0.97, b[1] - 0.06, b[2] * 0.88],
          [a[0] * 0.97, a[1] - 0.06, a[2] * 0.88]
        ],
        m.mix(dark, mid, 0.4)
      );
      const rib = Array.from({ length: rows + 1 }, (_, j) => {
        const v = sample(u0, j / rows, side);
        v[1] += 0.022;
        return v;
      });
      m.line(rib, 0.024, m.mix(mid, hi, 0.7), 4);
      m.tube(
        [a[0], a[1] + 0.01, a[2]],
        [a[0], a[1] + 0.012, a[2] + side * 0.035],
        0.036,
        0.036,
        hi,
        6
      );
    }
  }
  // Hip ends.
  for (const end of [-1, 1]) {
    const a = sample(end, 0, 1),
      b = sample(end, 0, -1),
      tip = sample(end, 1, 1);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const t0 = i / n,
        t1 = (i + 1) / n;
      const p = a.map((v, k) => v + (b[k] - v) * t0),
        q = a.map((v, k) => v + (b[k] - v) * t1);
      p[1] -= 0.22 * Math.sin(t0 * Math.PI);
      q[1] -= 0.22 * Math.sin(t1 * Math.PI);
      m.face([p, q, tip], i % 2 ? mid : m.mix(mid, hi, 0.25));
      m.face([p, q, [q[0], q[1] - 0.085, q[2]], [p[0], p[1] - 0.085, p[2]]], dark);
      m.line([p, tip], 0.022, m.mix(mid, hi, 0.7), 4);
    }
    // Hip ridges and the flying corners.
    for (const side of [-1, 1]) {
      const c = sample(end, 0, side),
        top = sample(end, 1, 1);
      const tail = [c[0] + end * 0.2, c[1] + 0.26, c[2] + side * 0.16];
      m.line([top, c, tail], 0.045, ridgeTone, 6);
      m.tube(
        tail,
        [tail[0] + end * 0.04, tail[1] + 0.09, tail[2] + side * 0.02],
        0.03,
        0.012,
        gilt,
        5
      );
      // A small bell hangs from each corner.
      m.tube([c[0], c[1] - 0.05, c[2]], [c[0], c[1] - 0.22, c[2]], 0.008, 0.008, ink, 4);
      m.lathe(
        c[0],
        c[1] - 0.3,
        c[2],
        [
          [0, 0.045],
          [0.06, 0.036],
          [0.1, 0.012]
        ],
        gilt,
        6
      );
    }
  }
  // Main ridge with a tile cap and dragon-tail ends.
  const l = sample(-1, 1, 1),
    r = sample(1, 1, 1);
  m.box(0, l[1] + 0.05, 0, r[0] - l[0] + 0.1, 0.12, 0.1, ridgeTone);
  m.box(0, l[1] + 0.12, 0, r[0] - l[0] + 0.12, 0.035, 0.13, hi);
  for (const end of [-1, 1]) {
    const x = end * (r[0] + 0.02),
      y = l[1] + 0.1;
    m.line(
      [
        [x, y, 0],
        [x + end * 0.06, y + 0.2, 0],
        [x - end * 0.02, y + 0.36, 0],
        [x - end * 0.13, y + 0.32, 0]
      ],
      0.05,
      ridgeTone,
      6
    );
    m.tube([x + end * 0.04, y + 0.3, 0], [x + end * 0.12, y + 0.37, 0], 0.024, 0.008, gilt, 5);
  }
  m.lathe(
    0,
    l[1] + 0.14,
    0,
    [
      [0, 0.07],
      [0.08, 0.09],
      [0.16, 0.05],
      [0.26, 0.02]
    ],
    gilt,
    8
  );
}

// A pent roof skirting the top of the ground storey on three sides.
function pentRoof(m, w, d, y, reach, drop, [dark, mid, hi]) {
  const edges = [
    [-w / 2, d / 2, w / 2, d / 2],
    [w / 2, d / 2, w / 2, -d / 2],
    [-w / 2, -d / 2, -w / 2, d / 2]
  ];
  for (const [ax, az, bx, bz] of edges) {
    const len = Math.hypot(bx - ax, bz - az),
      ox = (bz - az) / len,
      oz = -(bx - ax) / len;
    const n = Math.round(len / 0.16);
    for (let i = 0; i < n; i++) {
      const t0 = i / n,
        t1 = (i + 1) / n;
      const inner = (t) => [ax + (bx - ax) * t, y, az + (bz - az) * t];
      // Corners spread so neighbouring sides meet in a mitre.
      const outer = (t) => {
        const spread = (t - 0.5) * 2;
        return [
          ax + (bx - ax) * t + ox * reach + ((bx - ax) / len) * reach * spread,
          y - drop + 0.06 * Math.pow(Math.abs(spread), 4),
          az + (bz - az) * t + oz * reach + ((bz - az) / len) * reach * spread
        ];
      };
      m.face([inner(t0), inner(t1), outer(t1), outer(t0)], m.mix(mid, hi, (i % 3) * 0.12));
      const o0 = outer(t0),
        o1 = outer(t1);
      m.face([o0, o1, [o1[0], o1[1] - 0.07, o1[2]], [o0[0], o0[1] - 0.07, o0[2]]], dark);
      m.line(
        [[...inner(t0)].map((v, k) => v + (k === 1 ? 0.02 : 0)), [o0[0], o0[1] + 0.02, o0[2]]],
        0.02,
        hi,
        4
      );
    }
  }
}

function signboard(m, x, y, z, h, board, letters) {
  m.box(x, y, z, 0.2, h, 0.035, board);
  for (const s of [-1, 1]) m.box(x + s * 0.11, y, z, 0.025, h + 0.06, 0.05, gilt);
  for (let k = 0; k < 3; k++) {
    const yy = y + h * 0.3 - k * h * 0.3;
    m.box(x, yy, z + 0.022, 0.1, 0.022, 0.01, letters);
    m.box(x - 0.02, yy - 0.03, z + 0.022, 0.02, 0.07, 0.01, letters);
    m.box(x + 0.03, yy - 0.04, z + 0.022, 0.05, 0.02, 0.01, letters);
  }
}

// A cloth shop banner hung from a pole that leans out from the facade.
function streetBanner(m, x, y, z, side, cloth, hem) {
  m.tube([x, y, z], [x + side * 0.85, y + 0.32, z + 0.12], 0.022, 0.018, 0x5b4636, 6);
  m.tube(
    [x + side * 0.85, y + 0.32, z + 0.12],
    [x + side * 0.88, y + 0.38, z + 0.12],
    0.03,
    0.01,
    gilt,
    5
  );
  const top = (t) => [x + side * (0.25 + t * 0.5), y + 0.09 + t * 0.19, z + 0.04 + t * 0.07];
  const n = 4;
  for (let k = 0; k < n; k++) {
    const a = top(k / n),
      b = top((k + 1) / n),
      sway = (t) => 0.04 * Math.sin(t * 5 + k);
    const length = 0.95;
    const lo = (p, t) => [p[0] + sway(t), p[1] - length + 0.05 * Math.sin(k * 1.7), p[2] + 0.05];
    m.face([a, b, lo(b, k + 1), lo(a, k)], k % 2 ? cloth : m.mix(cloth, 0xffffff, 0.08));
    m.face(
      [
        lo(a, k),
        lo(b, k + 1),
        [lo(b, k + 1)[0], lo(b, k + 1)[1] + 0.09, lo(b, k + 1)[2]],
        [lo(a, k)[0], lo(a, k)[1] + 0.09, lo(a, k)[2]]
      ],
      hem
    );
  }
}

function jar(m, x, z, s, tone) {
  m.lathe(
    x,
    0.1,
    z,
    [
      [0, 0.07 * s],
      [0.08 * s, 0.13 * s],
      [0.2 * s, 0.15 * s],
      [0.3 * s, 0.09 * s],
      [0.34 * s, 0.07 * s]
    ],
    tone,
    9
  );
  m.lathe(
    x,
    0.1 + 0.34 * s,
    z,
    [
      [0, 0.08 * s],
      [0.04 * s, 0.04 * s]
    ],
    0xb9a27c,
    9
  );
}

const wards = {
  // The south-west ward: red lacquer, grey tile, white plaster, a wine shop.
  red: {
    lacquer: 0x8a3428,
    wood: 0x5d3a2c,
    paint: 0x3b6d69,
    plaster: 0xd8cdb9,
    dado: 0x6b4434,
    tile: [0x353a4c, 0x5b6377, 0x8c93a3],
    ridge: 0x4a5064,
    board: 0x2f3442,
    letters: gilt,
    cloth: 0xc1543c,
    hem: 0xe4cc93,
    stone: 0x9d978f,
    kerb: 0xc4bcb0
  },
  // The north ward: green lacquer, blue-glazed tile, gilt, a tea house.
  green: {
    lacquer: 0x2f5b4f,
    wood: 0x43382f,
    paint: 0x7a3a31,
    plaster: 0xcfc6b4,
    dado: 0x3f4a3f,
    tile: [0x283850, 0x3f5674, 0x7189a6],
    ridge: 0x2f3e55,
    board: 0x6b2c25,
    letters: 0xe8d39a,
    cloth: 0x405e86,
    hem: 0xd9c38c,
    stone: 0x958f8a,
    kerb: 0xbdb5ab
  }
};

function streetHouse(m, w, d, ward) {
  const c = wards[ward];
  const base = 0.1,
    h1 = 1.22,
    h2 = 0.92,
    front = d / 2,
    back = -d / 2;
  // Plinth: a dressed stone platform with a kerb course and a porch in front.
  m.box(0, base / 2 - 0.04, 0.16, w + 0.42, base + 0.08, d + 0.74, c.stone);
  m.box(0, base - 0.012, 0.16, w + 0.48, 0.03, d + 0.8, c.kerb);
  // Stepped stone corbels carry the porch out past the piers below.
  for (const x of [-w / 2 + 0.1, 0, w / 2 - 0.1]) {
    m.box(x, -0.1, front + 0.3, 0.3, 0.1, 0.42, c.stone);
    m.box(x, -0.21, front + 0.2, 0.25, 0.13, 0.3, m.mix(c.stone, 0x6f6a72, 0.3));
    m.box(x, -0.37, front + 0.08, 0.2, 0.2, 0.2, m.mix(c.stone, 0x6f6a72, 0.5));
  }
  for (let i = 0; i < 9; i++) {
    const x = -w / 2 - 0.1 + ((i + 0.5) * (w + 0.2)) / 9;
    m.box(
      x,
      base + 0.004,
      front + 0.36,
      (w + 0.2) / 9 - 0.03,
      0.006,
      0.44,
      m.mix(c.kerb, c.stone, (i % 3) * 0.3)
    );
  }
  // Ground storey.
  const half = w / 2 - 0.12,
    xs = [-half, -half / 3, half / 3, half];
  for (const z of [front - 0.06, back + 0.06])
    for (const x of xs) column(m, x, z, base + h1, c.lacquer);
  for (const x of [-half, half]) column(m, x, 0, base + h1, c.lacquer);
  // Walls: plaster over a timber dado at the back and sides.
  m.box(0, base + h1 / 2, back + 0.06, w - 0.24, h1, 0.08, c.plaster);
  m.box(0, base + 0.2, back + 0.11, w - 0.24, 0.4, 0.03, c.dado);
  for (const x of [(xs[0] + xs[1]) / 2, (xs[2] + xs[3]) / 2]) {
    m.frame(x, 0, back + 0.02, Math.PI, 1, () =>
      latticePanel(m, 0, base + h1 * 0.62, 0, (xs[1] - xs[0]) * 0.6, h1 * 0.38, c.wood, true)
    );
  }
  for (const s of [-1, 1]) {
    m.box(s * half, base + h1 / 2, 0, 0.08, h1, d - 0.12, c.plaster);
    m.box(s * (half + 0.045), base + 0.2, 0, 0.03, 0.4, d - 0.12, c.dado);
    m.box(s * (half + 0.045), base + h1 * 0.62, 0, 0.03, 0.06, d - 0.12, c.wood);
  }
  // Shopfront: an open centre bay with a lit interior and counter, lattice
  // windows over timber panels in the side bays.
  const bay = (xs[2] - xs[1]) * 0.92;
  m.glow(() => m.box(0, base + h1 * 0.5, back + 0.13, bay, h1 * 0.9, 0.02, 0xe0b27a));
  m.box(0, base + 0.22, front - 0.2, bay * 0.86, 0.44, 0.22, c.wood);
  m.box(0, base + 0.45, front - 0.2, bay * 0.92, 0.04, 0.28, 0xa98060);
  for (const x of [-0.25, 0.05, 0.27])
    jar(m, x * bay, front - 0.2, 0.42, x > 0 ? 0x9cb4ab : 0x7b5340);
  for (const s of [-1, 1]) {
    const x = (s * (xs[3] + xs[2])) / 2,
      bw = (xs[3] - xs[2]) * 0.86;
    m.box(x, base + 0.24, front - 0.06, bw, 0.48, 0.05, c.dado);
    for (const k of [-1, 1])
      m.box(x + k * bw * 0.22, base + 0.24, front - 0.03, bw * 0.34, 0.3, 0.02, c.wood);
    latticePanel(m, x, base + 0.48 + (h1 - 0.62) / 2, front - 0.06, bw, h1 - 0.62, c.wood, true);
  }
  // Architrave, painted band and the bracket sets.
  const top = base + h1;
  for (const z of [front - 0.06, back + 0.06]) {
    m.box(0, top - 0.06, z, w - 0.1, 0.12, 0.11, c.wood);
    m.box(0, top - 0.06, z + Math.sign(z) * 0.058, w - 0.16, 0.08, 0.008, c.paint);
    m.box(0, top - 0.06, z + Math.sign(z) * 0.063, w - 0.16, 0.012, 0.008, gilt);
  }
  for (const s of [-1, 1]) m.box(s * half, top - 0.06, 0, 0.11, 0.12, d - 0.1, c.wood);
  for (const x of [...xs, (xs[0] + xs[1]) / 2, (xs[1] + xs[2]) / 2, (xs[2] + xs[3]) / 2])
    bracket(m, x, top, front - 0.06, 1, c.wood, c.paint);
  for (const s of [-1, 1]) bracket(m, s * half, top, 0, 0, c.wood, c.paint);
  // Pent roof over the shopfront and its balcony floor.
  const deck = top + 0.26;
  m.box(0, deck - 0.03, 0.04, w + 0.06, 0.08, d + 0.14, c.wood);
  pentRoof(m, w + 0.04, d + 0.06, deck - 0.03, 0.5, 0.36, c.tile);
  // Upper storey, set back behind a balustraded gallery.
  const uw = w - 0.42,
    ud = d - 0.42,
    uf = ud / 2;
  balustrade(
    m,
    -w / 2 + 0.05,
    front + 0.03,
    w / 2 - 0.05,
    front + 0.03,
    deck,
    0.34,
    c.lacquer,
    c.kerb
  );
  for (const s of [-1, 1])
    balustrade(
      m,
      s * (w / 2 - 0.05),
      front + 0.03,
      s * (w / 2 - 0.05),
      back + 0.25,
      deck,
      0.34,
      c.lacquer,
      c.kerb
    );
  const uxs = [-uw / 2 + 0.06, -uw / 6, uw / 6, uw / 2 - 0.06];
  m.frame(0, deck, 0, 0, 1, () => {
    for (const z of [uf - 0.04, -uf + 0.04]) for (const x of uxs) column(m, x, z, h2, c.lacquer);
    m.box(0, h2 / 2, -uf + 0.06, uw - 0.12, h2, 0.07, c.plaster);
    m.frame(0, 0, -uf + 0.01, Math.PI, 1, () =>
      latticePanel(m, 0, h2 * 0.55, 0, uw * 0.4, h2 * 0.4, c.wood, true)
    );
    for (const s of [-1, 1])
      m.box((s * uw) / 2 - s * 0.06, h2 / 2, 0, 0.07, h2, ud - 0.1, c.plaster);
    for (let j = 0; j < 3; j++) {
      const x = (uxs[j] + uxs[j + 1]) / 2,
        bw = (uxs[j + 1] - uxs[j]) * 0.84;
      m.box(x, 0.16, uf - 0.04, bw, 0.32, 0.04, c.dado);
      latticePanel(m, x, 0.32 + (h2 - 0.44) / 2, uf - 0.04, bw, h2 - 0.44, c.wood, j !== 1);
    }
    for (const z of [uf - 0.04, -uf + 0.04]) {
      m.box(0, h2 - 0.05, z, uw, 0.1, 0.09, c.wood);
      m.box(0, h2 - 0.05, z + Math.sign(z) * 0.048, uw - 0.06, 0.06, 0.008, c.paint);
    }
    for (const x of [...uxs, 0]) bracket(m, x, h2, uf - 0.04, 1, c.wood, c.paint);
    // Name plaque between the upper columns.
    m.box(0, h2 - 0.2, uf + 0.03, 0.7, 0.2, 0.03, c.board);
    m.box(0, h2 - 0.2, uf + 0.02, 0.76, 0.26, 0.02, gilt);
    for (let k = 0; k < 3; k++)
      m.box(-0.2 + k * 0.2, h2 - 0.2, uf + 0.05, 0.09, 0.09, 0.01, c.letters);
    m.box(0, h2 + 0.17, 0, uw + 0.1, 0.1, ud + 0.1, c.wood);
    hipRoof(m, uw + 1.0, ud + 1.05, h2 + 0.18, 0.62 + uw * 0.1, c.tile, c.ridge);
  });
  // Hanging lanterns, a vertical shop sign and a cloth banner.
  for (const s of [-1, 1]) lantern(m, s * (half + 0.08), top - 0.36, front + 0.36, 0.7, 0xd2643f);
  lantern(m, 0, deck + h2 - 0.38, front + 0.1, 0.62, 0xd88b4a);
  signboard(m, xs[1] + 0.12, base + h1 * 0.62, front + 0.02, 0.66, c.board, c.letters);
  streetBanner(m, xs[3] + 0.05, top - 0.1, front - 0.04, 1, c.cloth, c.hem);
  // Life on the porch: wine jars, a bench and a potted shrub.
  jar(m, -half - 0.02, front + 0.32, 0.62, 0x6d4a3a);
  jar(m, -half + 0.2, front + 0.4, 0.5, 0x7d5743);
  m.box(half - 0.3, base + 0.17, front + 0.3, 0.56, 0.04, 0.16, 0x8d6b4f);
  for (const s of [-1, 1])
    m.box(half - 0.3 + s * 0.22, base + 0.08, front + 0.3, 0.04, 0.16, 0.12, 0x5d4535);
  m.lathe(
    half + 0.12,
    base,
    front + 0.36,
    [
      [0, 0.07],
      [0.14, 0.1],
      [0.15, 0.085]
    ],
    0x8d8a85,
    8
  );
  for (let k = 0; k < 7; k++) {
    const a = (k * circle) / 7;
    m.leaf(
      [half + 0.12, base + 0.15, front + 0.36],
      [
        half + 0.12 + Math.cos(a) * 0.17,
        base + 0.33 + 0.05 * (k % 3),
        front + 0.36 + Math.sin(a) * 0.17
      ],
      0.05,
      0x4f6d4c,
      0x7a9563,
      0.04
    );
  }
}

export { streetHouse };
