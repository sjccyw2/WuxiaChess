// The observatory terrace around the board: radial flagstones with two flush
// bronze rings, a coursed stone drum under a coping and a carved balustrade,
// dragon-head drain spouts, four gates whose stairs run down the face of the
// drum to the footing walk, and the gate lamps whose light is painted into
// the stone around them. Everything is measured from the centre of the board.
import { circle } from '../scenery-kit.js';

const TOP = -0.29; // upper face of the flags
const BED = -0.33; // mortar bed showing in the joints
const FOOT = -3.0; // footing walk at the base of the drum
const RADIUS = 12.6;
// The clepsydra stands on a round bastion that swells out of the drum.
const bastion = [-9.8, 5.33, 3.1];
const mix = (a, b, f) => a + (b - a) * f;

function edgeRadius(a) {
  const dx = Math.cos(a),
    dz = Math.sin(a),
    [x, z, r] = bastion;
  const b = x * dx + z * dz,
    disc = b * b - (x * x + z * z - r * r);
  const out = disc > 0 ? b + Math.sqrt(disc) + 0.35 : 0;
  const k = 2.2;
  return Math.log(Math.exp(k * RADIUS) + Math.exp(k * out)) / k;
}
const at = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];

// Gates at the four quarters. `turn` is the way each stair runs down the drum.
const gates = [
  { a: 0, turn: -1 },
  { a: Math.PI / 2, turn: -1 },
  { a: Math.PI, turn: 1 },
  { a: -Math.PI / 2, turn: -1 }
];
const gateHalf = 0.82;
// The clock's overflow leaves the terrace here, through the balustrade.
const spillAngle = Math.atan2(9.56, 7.99);

// Lamps: one on each gate post, plus any the caller adds (the clock's pair).
function gateLamps() {
  const out = [];
  for (const { a } of gates) {
    const e = edgeRadius(a);
    for (const s of [-1, 1]) {
      const b = a + (s * (gateHalf + 0.1)) / e;
      out.push(at(b, e - 0.12, 0.66));
    }
  }
  return out;
}
// Lamplight painted into vertex colours: warm, falling off within a few metres.
function painter(m, lamps) {
  return (code, x, y, z, k = 1) => {
    const c = m.rgb(code);
    let g = 0;
    for (const [lx, ly, lz] of lamps) {
      const d2 = (x - lx) ** 2 + 0.6 * (y - ly) ** 2 + (z - lz) ** 2;
      g += Math.exp(-d2 / 3.2);
    }
    g = Math.min(1, g) * 0.6 * k;
    return [c[0] * (1 + 1.1 * g), c[1] * (1 + 0.8 * g), c[2] * (1 + 0.35 * g)];
  };
}

// Faces are wound so their normal points along `hint`; the shadow's normal
// offset pushes a face wound the other way into its own shadow.
function put(m, pts, col, hint) {
  const [a, b, c] = pts,
    u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) {
    pts = [...pts].reverse();
    if (Array.isArray(col) && Array.isArray(col[0])) col = [...col].reverse();
  }
  m.face(pts, col);
}
const outward = (a, up = 0) => [Math.cos(a), up, Math.sin(a)];

// A stone laid flat with a narrow worn bevel; corners are [x, z] around.
function flag(m, light, corners, top, tone, edge, bevel = 0.028) {
  let area = 0;
  corners.forEach(([x, z], i) => {
    const [nx, nz] = corners[(i + 1) % corners.length];
    area += x * nz - nx * z;
  });
  if (area > 0) corners = [...corners].reverse();
  const n = corners.length;
  let cx = 0,
    cz = 0;
  for (const [x, z] of corners) {
    cx += x / n;
    cz += z / n;
  }
  const inner = corners.map(([x, z]) => {
    const dx = cx - x,
      dz = cz - z,
      l = Math.hypot(dx, dz) || 1;
    return [x + (dx / l) * bevel, z + (dz / l) * bevel];
  });
  m.face(
    inner.map(([x, z]) => [x, top, z]),
    inner.map(([x, z]) => light(tone, x, top, z))
  );
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n,
      [ax, az] = corners[i],
      [bx, bz] = corners[j],
      [ix, iz] = inner[i],
      [jx, jz] = inner[j];
    m.face(
      [
        [ax, top - bevel * 1.4, az],
        [bx, top - bevel * 1.4, bz],
        [jx, top, jz],
        [ix, top, iz]
      ],
      [
        light(edge, ax, top, az),
        light(edge, bx, top, bz),
        light(edge, jx, top, jz),
        light(edge, ix, top, iz)
      ]
    );
  }
}

function paving(m, layout, light) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const onBoard = (x, z) =>
    layout.mask[Math.floor(z + cz + 0.5)]?.[Math.floor(x + cx + 0.5)] === '#';
  const r = m.rng;
  let lo = 5.4;
  const rings = [];
  while (lo < 15) {
    const w = 0.6 + 0.2 * r.next();
    rings.push([lo, lo + w]);
    lo += w;
  }
  // Flush bronze bands run in the joints of two courses.
  const bands = [rings[5][0], rings[9][0]];
  for (const [r0, r1] of rings) {
    const mid = (r0 + r1) / 2,
      n = Math.max(12, Math.round((circle * mid) / (0.85 + 0.35 * r.next())));
    const phase = r.next() * circle;
    // Uneven stone lengths: each joint wanders a little from the even division.
    const cuts = Array.from(
      { length: n },
      (_, j) => phase + ((j + 0.5 * (r.next() - 0.5)) * circle) / n
    );
    for (let j = 0; j < n; j++) {
      const a0 = cuts[j] + 0.012 / mid,
        a1 = (j + 1 < n ? cuts[j + 1] : cuts[0] + circle) - 0.012 / mid;
      const e0 = edgeRadius(a0) - 0.27,
        e1 = edgeRadius(a1) - 0.27;
      if (r0 >= Math.min(e0, e1)) continue;
      const q0 = Math.min(r1 - 0.012, e0),
        q1 = Math.min(r1 - 0.012, e1);
      const p = [
        [Math.cos(a0) * (r0 + 0.012), Math.sin(a0) * (r0 + 0.012)],
        [Math.cos(a0) * q0, Math.sin(a0) * q0],
        [Math.cos(a1) * q1, Math.sin(a1) * q1],
        [Math.cos(a1) * (r0 + 0.012), Math.sin(a1) * (r0 + 0.012)]
      ];
      if (p.every(([x, z]) => onBoard(x, z))) continue;
      const pick = r.next();
      const tone =
        pick < 0.08
          ? m.mix(0x4c5649, 0x58604f, r.next()) // lichen on the less trodden stones
          : pick < 0.16
            ? m.mix(0x6f7470, 0x7a7e78, r.next()) // newer, paler replacements
            : m.mix(0x4f5758, 0x666c69, 0.15 + 0.75 * r.next());
      // Feet have worn a paler, smoother path in from each gate.
      const middle = (a0 + a1) / 2,
        path = Math.min(...gates.map((g) => Math.abs(wrap(middle - g.a)) * r0));
      const trodden = path < 1.1 ? m.mix(tone, 0x7c817a, 0.4 * (1 - path / 1.1)) : tone;
      const edge = m.mix(trodden, 0x2c3436, 0.3);
      flag(m, light, p, TOP + 0.004 * (r.next() - 0.5), trodden, edge);
    }
  }
  // The bronze bands and the twenty-eight blank lodge plaques between them.
  for (const radius of bands) {
    const n = Math.round((circle * radius) / 0.42);
    for (let j = 0; j < n; j++) {
      const a0 = (j * circle) / n,
        a1 = ((j + 1) * circle) / n;
      const pts = [at(a0, radius - 0.035, 0), at(a0, radius + 0.035, 0), at(a1, radius + 0.035, 0), at(a1, radius - 0.035, 0)];
      if (pts.every(([x, , z]) => onBoard(x, z))) continue;
      const shine = 0.5 + 0.5 * Math.sin(j * 1.7);
      put(
        m,
        pts.map(([x, , z]) => [x, TOP + 0.003, z]),
        pts.map(([x, , z]) => light(m.mix(0x6a5a34, 0x977d47, shine), x, TOP, z)),
        [0, 1, 0]
      );
    }
  }
  const middle = (bands[0] + bands[1]) / 2;
  for (let j = 0; j < 28; j++) {
    const a = (j * circle) / 28 + 0.06;
    const [x, , z] = at(a, middle, 0);
    if (onBoard(x, z)) continue;
    const u = [Math.cos(a), Math.sin(a)],
      v = [-u[1], u[0]],
      s = 0.13;
    const plate = [
      [x + (u[0] + v[0]) * s, z + (u[1] + v[1]) * s],
      [x + (u[0] - v[0]) * s, z + (u[1] - v[1]) * s],
      [x - (u[0] + v[0]) * s, z - (u[1] + v[1]) * s],
      [x - (u[0] - v[0]) * s, z - (u[1] - v[1]) * s]
    ];
    flag(m, light, plate, TOP + 0.008, m.mix(0x4a5a4c, 0x5a5238, j % 3 ? 0.7 : 0.2), 0x7e7046, 0.02);
  }
}

// Arc-length table so posts and coping blocks keep an even pitch on the bastion.
function perimeter(samples = 720) {
  const angles = [0],
    lengths = [0];
  let total = 0;
  for (let i = 1; i <= samples; i++) {
    const a = (i * circle) / samples,
      b = ((i - 1) * circle) / samples;
    const p = at(a, edgeRadius(a), 0),
      q = at(b, edgeRadius(b), 0);
    total += Math.hypot(p[0] - q[0], p[2] - q[2]);
    angles.push(a);
    lengths.push(total);
  }
  const angleAt = (s) => {
    s = ((s % total) + total) % total;
    let i = 1;
    while (lengths[i] < s) i++;
    const f = (s - lengths[i - 1]) / (lengths[i] - lengths[i - 1]);
    return mix(angles[i - 1], angles[i], f);
  };
  return { total, angleAt };
}
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function inGap(a, extra = 0) {
  for (const g of gates) {
    const e = edgeRadius(g.a);
    if (Math.abs(wrap(a - g.a)) * e < gateHalf + extra) return true;
  }
  return Math.abs(wrap(a - spillAngle)) * edgeRadius(spillAngle) < 0.32 + extra;
}

// Coursed ashlar on the face of the drum, each block standing a little proud
// of the mortar with a bevelled arris.
function drum(m, light) {
  const r = m.rng,
    courses = 7,
    high = -0.47,
    h = (high - FOOT) / courses;
  for (let k = 0; k < courses; k++) {
    const y1 = high - k * h,
      y0 = y1 - h;
    let a = r.next() * 0.2;
    const end = a + circle;
    while (a < end - 1e-6) {
      const e = edgeRadius(a);
      let da = (0.85 + 0.55 * r.next()) / e;
      if (a + da > end - 0.25 / e) da = end - a;
      const b = a + da,
        damp = k / (courses - 1);
      const tone = m.mix(
        m.mix(0x6c7471, 0x8a8f88, r.next()),
        0x48585a,
        0.1 + 0.4 * damp * damp
      );
      const arris = m.mix(tone, 0xa6a99b, 0.3);
      const ea = edgeRadius(a),
        eb = edgeRadius(b);
      const g = 0.012 / ea,
        bev = 0.03;
      const back = [
        at(a + g, ea + 0.012, y0 + 0.012),
        at(b - g, eb + 0.012, y0 + 0.012),
        at(b - g, eb + 0.012, y1 - 0.012),
        at(a + g, ea + 0.012, y1 - 0.012)
      ];
      const t = (bev + 0.012) / ea;
      const front = [
        at(a + t, ea + 0.05, y0 + bev),
        at(b - t, eb + 0.05, y0 + bev),
        at(b - t, eb + 0.05, y1 - bev),
        at(a + t, ea + 0.05, y1 - bev)
      ];
      const paint = (p, c) => light(c, p[0], p[1], p[2], 0.8);
      const mid = outward((a + b) / 2);
      put(m, front, front.map((p) => paint(p, tone)), mid);
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4,
          quad = [back[i], back[j], front[j], front[i]];
        put(m, quad, quad.map((p) => paint(p, i === 2 ? arris : tone)), mid);
      }
      a = b;
    }
  }
}

// The coping caps the drum; posts, carved panels and a round handrail stand on
// it, and a dragon-head spout projects beneath every ordinary post.
function parapet(m, light) {
  const r = m.rng,
    { total, angleAt } = perimeter();
  const blocks = Math.round(total / 1.15);
  for (let i = 0; i < blocks; i++) {
    const a = angleAt((i * total) / blocks) + 0.006,
      b = angleAt(((i + 1) * total) / blocks) - 0.006;
    const ea = edgeRadius(a),
      eb = edgeRadius(b);
    const tone = m.mix(0x7b827c, 0x969a90, r.next()),
      worn = m.mix(tone, 0xb2b3a5, 0.35);
    const ring = (dr, y) => [at(a, ea + dr, y), at(b, eb + dr, y)];
    const rows = [ring(-0.3, TOP + 0.02), ring(0.08, TOP + 0.02), ring(0.12, TOP - 0.01), ring(0.12, -0.45), ring(0.0, -0.47)];
    const cols = [worn, worn, tone, m.mix(tone, 0x2f3a3b, 0.4), tone];
    const facing = [[0, 1, 0], outward(a, 1), outward(a), [0, -1, 0]];
    for (let k = 0; k < rows.length - 1; k++) {
      const [p, q] = rows[k],
        [s, t] = rows[k + 1];
      put(m, [p, q, t, s], [p, q, t, s].map((v, n) => light(n < 2 ? cols[k] : cols[k + 1], v[0], v[1], v[2])), facing[k]);
    }
  }
  // Posts at an even pitch, skipping the gates and the spillway.
  const pitch = 1.42,
    count = Math.round(total / pitch),
    posts = [];
  for (let i = 0; i < count; i++) {
    const a = angleAt((i * total) / count);
    if (!inGap(a, 0.15)) posts.push({ a, gate: false });
  }
  for (const g of gates) {
    const e = edgeRadius(g.a);
    for (const s of [-1, 1]) posts.push({ a: g.a + (s * (gateHalf + 0.1)) / e, gate: true });
  }
  for (const s of [-1, 1]) {
    const e = edgeRadius(spillAngle);
    posts.push({ a: spillAngle + (s * 0.42) / e, gate: false, spill: true });
  }
  posts.sort((p, q) => p.a - q.a);
  const base = TOP + 0.02;
  for (const post of posts) {
    const e = edgeRadius(post.a) - 0.11;
    m.frame(Math.cos(post.a) * e, base, Math.sin(post.a) * e, Math.PI / 2 - post.a, 1, () => {
      const tone = m.mix(0x767d76, 0x8d9188, r.next());
      if (post.gate) {
        // Gate posts carry the stone lanterns.
        m.box(0, 0.05, 0, 0.34, 0.1, 0.34, 0x646b66);
        m.box(0, 0.42, 0, 0.26, 0.66, 0.26, tone);
        m.box(0, 0.78, 0, 0.32, 0.06, 0.32, m.mix(tone, 0xa3a597, 0.4));
        m.glow(() => m.box(0, 0.92, 0, 0.17, 0.2, 0.17, 0xf2c98a));
        for (const [x, z] of [[-0.11, -0.11], [0.11, -0.11], [0.11, 0.11], [-0.11, 0.11]])
          m.box(x, 0.92, z, 0.05, 0.22, 0.05, 0x5c625d);
        m.lathe(0, 1.03, 0, [[0, 0.24], [0.05, 0.2], [0.17, 0.05], [0.21, 0.0]], 0x5d6662, 4);
      } else {
        m.box(0, 0.27, 0, 0.15, 0.54, 0.15, tone);
        m.box(0, 0.555, 0, 0.18, 0.04, 0.18, m.mix(tone, 0xa3a597, 0.35));
        m.lathe(0, 0.575, 0, [[0, 0.07], [0.06, 0.085], [0.12, 0.05], [0.15, 0.0]], tone, 6);
      }
    });
    if (post.gate || post.spill) continue;
    // Spout: a stone dragon head under the coping, mouth open to the sky.
    const e2 = edgeRadius(post.a);
    const p0 = at(post.a, e2 + 0.06, -0.38),
      p1 = at(post.a, e2 + 0.36, -0.36),
      p2 = at(post.a, e2 + 0.44, -0.31);
    m.tube(p0, p1, 0.062, 0.048, 0x7a807a, 6);
    m.tube(p1, p2, 0.048, 0.026, 0x8a8f86, 6);
    if (r.next() < 0.55) {
      // Rain from the spout has left a dark streak down the drum.
      const w = 0.07 / e2,
        drop = 0.9 + 1.1 * r.next();
      put(
        m,
        [at(post.a - w, e2 + 0.054, -0.5), at(post.a + w, e2 + 0.054, -0.5), at(post.a + w * 1.6, e2 + 0.054, -0.5 - drop), at(post.a - w * 1.6, e2 + 0.054, -0.5 - drop)],
        [m.rgb(0x3a4545), m.rgb(0x3a4545), m.rgb(0x4d5757), m.rgb(0x4d5757)],
        outward(post.a)
      );
    }
  }
  // Carved panels with a round handrail on vase-shaped balusters.
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i],
      q = posts[(i + 1) % posts.length];
    const ea = edgeRadius(p.a) - 0.11,
      eb = edgeRadius(q.a) - 0.11;
    const A = at(p.a, ea, 0),
      B = at(q.a, eb, 0);
    const len = Math.hypot(B[0] - A[0], B[2] - A[2]);
    if (len > 2.1 || len < 0.3) continue;
    const mx = (A[0] + B[0]) / 2,
      mz = (A[2] + B[2]) / 2,
      yaw = -Math.atan2(B[2] - A[2], B[0] - A[0]);
    const span = len - 0.15;
    m.frame(mx, base, mz, yaw, 1, () => {
      const tone = m.mix(0x737a73, 0x899087, r.next());
      m.box(0, 0.04, 0, span, 0.08, 0.17, m.mix(tone, 0x4c5554, 0.3));
      m.box(0, 0.2, 0, span, 0.24, 0.065, tone);
      for (const side of [-1, 1])
        put(
          m,
          [
            [-span / 2 + 0.07, 0.12, side * 0.034],
            [span / 2 - 0.07, 0.12, side * 0.034],
            [span / 2 - 0.07, 0.27, side * 0.034],
            [-span / 2 + 0.07, 0.27, side * 0.034]
          ].map(([x, y, z]) => (side > 0 ? [x, y, z] : [-x, y, z])),
          m.mix(tone, 0x3d4747, 0.35),
          [0, 0, side]
        );
      for (const u of [-0.25, 0.25])
        m.lathe(u * span, 0.32, 0, [[0, 0.03], [0.04, 0.045], [0.09, 0.022], [0.12, 0.035]], tone, 5);
      m.tube([-span / 2, 0.47, 0], [span / 2, 0.47, 0], 0.032, 0.032, m.mix(tone, 0xa3a597, 0.3), 6);
    });
  }
}

// The footing walk at the foot of the drum, and the four stairs down to it.
function footing(m, light) {
  const r = m.rng,
    { total, angleAt } = perimeter();
  const n = Math.round(total / 1.0);
  for (let i = 0; i < n; i++) {
    const a = angleAt((i * total) / n) + 0.005,
      b = angleAt(((i + 1) * total) / n) - 0.005;
    const ea = edgeRadius(a),
      eb = edgeRadius(b);
    const tone = m.mix(0x636b69, 0x7c827c, r.next());
    for (const [r0, r1] of [
      [0.02, 0.86],
      [0.88, 1.72]
    ]) {
      const off = (r1 > 1 ? 0.5 : 0) / ea;
      flag(
        m,
        light,
        [
          [Math.cos(a + off) * (ea + r0), Math.sin(a + off) * (ea + r0)],
          [Math.cos(a + off) * (ea + r1), Math.sin(a + off) * (ea + r1)],
          [Math.cos(b + off) * (eb + r1), Math.sin(b + off) * (eb + r1)],
          [Math.cos(b + off) * (eb + r0), Math.sin(b + off) * (eb + r0)]
        ],
        FOOT + 0.05,
        m.mix(tone, 0x7a8079, r1 > 1 ? 0.15 : 0),
        m.mix(tone, 0x2a3234, 0.3),
        0.03
      );
    }
    // Kerb on the outer lip.
    const k0 = at(a, ea + 1.74, FOOT + 0.07),
      k1 = at(b, eb + 1.74, FOOT + 0.07),
      k2 = at(b, eb + 1.74, FOOT - 0.5),
      k3 = at(a, ea + 1.74, FOOT - 0.5);
    put(m, [k0, k1, k2, k3], [0x656c67, 0x656c67, 0x3c4646, 0x3c4646].map((c) => m.rgb(c)), outward(a));
  }
  for (const g of gates) stair(m, light, g);
}
function stair(m, light, { a, turn }) {
  const e = edgeRadius(a),
    inner = e + 0.04,
    outer = e + 1.42,
    wall = e + 1.62;
  const steps = 9,
    rise = (TOP - FOOT) / (steps + 1),
    tread = 0.36;
  const mid = (inner + outer) / 2;
  const landing = [a - (turn * (gateHalf + 0.25)) / mid, a + (turn * gateHalf) / mid];
  const stone = 0x6a716c,
    dark = 0x3e4848;
  const body = (a0, a1, y, tone) => {
    // A solid sector from the footing up to `y`, walked on at its top.
    const lo = Math.min(a0, a1),
      hi = Math.max(a0, a1);
    const corners = [
      [Math.cos(lo) * inner, Math.sin(lo) * inner],
      [Math.cos(lo) * outer, Math.sin(lo) * outer],
      [Math.cos(hi) * outer, Math.sin(hi) * outer],
      [Math.cos(hi) * inner, Math.sin(hi) * inner]
    ];
    flag(m, light, corners, y, tone, m.mix(tone, 0xa3a597, 0.25), 0.02);
    // Riser and outer face.
    const side = turn > 0 ? hi : lo;
    const riser = [at(side, inner, y - 0.03), at(side, outer, y - 0.03), at(side, outer, FOOT), at(side, inner, FOOT)];
    const down = [-Math.sin(side) * turn, 0, Math.cos(side) * turn];
    put(m, riser, riser.map((p) => light(m.mix(tone, dark, 0.25), p[0], p[1], p[2])), down);
  };
  body(landing[0], landing[1], TOP + 0.01, stone);
  for (let i = 0; i < steps; i++) {
    const a0 = landing[1] + (turn * i * tread) / mid,
      a1 = a0 + (turn * tread) / mid;
    body(a0, a1, TOP - (i + 1) * rise, m.mix(stone, 0x7b827b, (i % 3) / 3));
  }
  // The outer cheek wall: a parapet rising with the flight and closing the landing.
  const start = landing[0],
    turnAt = landing[1],
    end = landing[1] + (turn * steps * tread) / mid;
  const parts = 14;
  const heightAt = (s) => {
    const t = Math.max(0, (s - turnAt) * turn) / ((steps * tread) / mid);
    return mix(TOP + 0.01, FOOT + rise, Math.min(1, t)) + 0.46;
  };
  for (let i = 0; i < parts; i++) {
    const s0 = mix(start, end, i / parts),
      s1 = mix(start, end, (i + 1) / parts);
    const h0 = heightAt(s0),
      h1 = heightAt(s1);
    const out = [at(s0, wall, FOOT - 0.5), at(s1, wall, FOOT - 0.5), at(s1, wall, h1), at(s0, wall, h0)];
    const o = outward((s0 + s1) / 2);
    put(m, out, out.map((p, k) => light(k < 2 ? dark : 0x626a66, p[0], p[1], p[2], 0.7)), o);
    const inside = [at(s0, outer, h0 - 0.5), at(s1, outer, h1 - 0.5), at(s1, outer, h1), at(s0, outer, h0)];
    put(m, inside, inside.map((p) => light(0x5d6561, p[0], p[1], p[2])), o.map((v) => -v));
    const cap = [at(s0, outer - 0.02, h0 + 0.04), at(s1, outer - 0.02, h1 + 0.04), at(s1, wall + 0.03, h1 + 0.04), at(s0, wall + 0.03, h0 + 0.04)];
    put(m, cap, cap.map((p) => light(0x858a81, p[0], p[1], p[2])), [0, 1, 0]);
    // Course lines on the outer face of the flight.
    for (let y = FOOT + 0.36; y < Math.min(h0, h1) - 0.1; y += 0.36) {
      const line = [at(s0, wall + 0.006, y), at(s1, wall + 0.006, y), at(s1, wall + 0.006, y + 0.022), at(s0, wall + 0.006, y + 0.022)];
      put(m, line, 0x323c3d, o);
    }
  }
  // End wall closing the top landing on the side away from the flight.
  const cap = [at(start, inner, TOP + 0.47), at(start, wall + 0.03, TOP + 0.47), at(start, wall + 0.03, FOOT - 0.5), at(start, inner, FOOT - 0.5)];
  put(m, cap, cap.map((p, k) => light(k < 2 ? 0x6b726d : dark, p[0], p[1], p[2])), [Math.sin(start) * turn, 0, -Math.cos(start) * turn]);
}

export {
  TOP,
  BED,
  FOOT,
  edgeRadius,
  gateLamps,
  painter,
  paving,
  drum,
  parapet,
  footing,
  spillAngle,
  gates,
  gateHalf,
  at,
  put,
  flag
};
