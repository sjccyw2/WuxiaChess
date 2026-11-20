// 桃花石陣的門：北面的石坊門、南徑的望柱門、東門外的月洞石屏，以及西面的陣眼奇石。
// Each is drawn in its own local frame, opening along x, and set into the ground.
import { circle } from '../scenery-kit.js';
import { boulder, collar, facing, hash, taihu, tuft } from './formation-5.js';
import { peachBush } from './peach-5.js';

const granite = [0x9d998a, 0xa8a493, 0x928f81, 0xb1ab98];
// A dressed block, its top lighter and its foot stained by the ground.
function block(m, x, y, z, w, h, d, col, r) {
  const lo = y - h / 2,
    hi = y + h / 2;
  const top = m.mix(col, 0xd2cab4, 0.25),
    foot = m.mix(col, 0x5b5d4b, y < 0.4 ? 0.45 : 0.1),
    side = m.rgb(col);
  const c = (px, py, pz) => [x + (px * w) / 2, py, z + (pz * d) / 2];
  const A = c(-1, hi, -1),
    B = c(1, hi, -1),
    C = c(1, hi, 1),
    D = c(-1, hi, 1);
  const a = c(-1, lo, -1),
    b = c(1, lo, -1),
    cc = c(1, lo, 1),
    dd = c(-1, lo, 1);
  m.face([A, D, C, B], top);
  m.face([a, A, B, b], [foot, side, side, foot]);
  m.face([b, B, C, cc], [foot, side, side, foot]);
  m.face([cc, C, D, dd], [foot, side, side, foot]);
  m.face([dd, D, A, a], [foot, side, side, foot]);
  if (r && r.next() < 0.35)
    m.face(
      [A, D, C, B].map(([px, py, pz]) => [px, py + 0.002, pz]),
      m.mix(col, 0xa9a46a, 0.45)
    );
}

// A stone pier of stacked courses, each block a touch off true.
function pier(m, x, z, h, w, r) {
  block(m, x, 0.06, z, w * 1.5, 0.24, w * 1.5, 0x8d8a7c, r);
  block(m, x, 0.21, z, w * 1.25, 0.08, w * 1.25, 0x9a9686, r);
  let y = 0.25;
  while (y < h - 0.05) {
    const ch = Math.min(r.range(0.28, 0.4), h - y);
    block(
      m,
      x + r.range(-0.012, 0.012),
      y + ch / 2,
      z + r.range(-0.012, 0.012),
      w,
      ch - 0.012,
      w,
      r.pick(granite),
      r
    );
    y += ch;
  }
  // A drum stone braces each face of the foot.
  for (const s of [-1, 1]) {
    m.frame(x, 0.3, z + s * w * 0.95, 0, 1, () => {
      m.tube([-0.0, 0, -0.06], [0, 0, 0.06], 0.17, 0.17, 0xa29e8d, 10);
      m.tube([-0.0, -0.14, -0.08], [0, -0.14, 0.08], 0.03, 0.03, 0x8e8a7b, 4);
    });
    m.frame(x, 0.0, z + s * w * 0.95, 0, 1, () => m.box(0, 0.08, 0, 0.16, 0.16, 0.26, 0x8f8b7c));
  }
}

// A low stone roof cap: a ridge and two shallow pitches with a carved eave line.
function stoneRoof(m, w, d, y, col = 0x6b6f68) {
  const e = 0.12;
  const ridge = [
    [-w / 2, y + 0.28, 0],
    [w / 2, y + 0.28, 0]
  ];
  const eave = (s) => [
    [-w / 2 - e, y + 0.04, s * (d / 2 + e)],
    [w / 2 + e, y + 0.04, s * (d / 2 + e)]
  ];
  const front = eave(1),
    back = eave(-1);
  m.face([ridge[0], front[0], front[1], ridge[1]], m.mix(col, 0x9a9a8d, 0.25));
  m.face([ridge[1], back[1], back[0], ridge[0]], col);
  m.face([ridge[0], back[0], front[0]], m.mix(col, 0x505550, 0.3));
  m.face([ridge[1], front[1], back[1]], m.mix(col, 0x505550, 0.3));
  // Eave edge and ridge roll.
  m.box(0, y + 0.02, 0, w + e * 2, 0.05, d + e * 2, 0x585c56);
  m.tube([-w / 2 - 0.05, y + 0.3, 0], [w / 2 + 0.05, y + 0.3, 0], 0.045, 0.045, 0x5c605a, 6);
  for (const s of [-1, 1]) {
    // Upturned ridge ends.
    m.tube(
      [s * (w / 2 + 0.03), y + 0.3, 0],
      [s * (w / 2 + 0.16), y + 0.42, 0],
      0.045,
      0.02,
      0x5c605a,
      6
    );
  }
}

// The north gate: a stone archway of two piers, a double architrave with an
// inscribed panel between, under a stone roof.
function northGate(m) {
  const r = m.rng,
    span = 0.82,
    h = 2.05,
    w = 0.32;
  for (const s of [-1, 1]) pier(m, s * span, 0, h, w, r);
  block(m, 0, h + 0.07, 0, span * 2 + w + 0.14, 0.15, w + 0.04, 0xa19c8a, r);
  block(m, 0, h - 0.33, 0, span * 2 - w, 0.12, w * 0.8, 0x9c9886, r);
  // Panel between the beams, with a framed recess.
  block(m, 0, h - 0.13, 0, 0.9, 0.3, w * 0.55, 0x8f8b7b, r);
  for (const s of [-1, 1]) {
    facing(
      m,
      [
        [-0.36, h - 0.24, s * w * 0.29],
        [0.36, h - 0.24, s * w * 0.29],
        [0.36, h - 0.02, s * w * 0.29],
        [-0.36, h - 0.02, s * w * 0.29]
      ],
      0x6f6152,
      [0, 0, s]
    );
    // Short struts between the beams.
    for (const x of [-0.6, 0.6]) block(m, x, h - 0.13, 0, 0.1, 0.28, w * 0.55, 0x96927f, r);
  }
  stoneRoof(m, span * 2 + w + 0.2, w + 0.2, h + 0.15);
  // Threshold and worn step.
  block(m, 0, 0.03, 0, span * 2 - w - 0.02, 0.08, w * 0.9, 0xa49f8b, r);
  for (const s of [-1, 1]) {
    collar(m, s * span, 0, 0.42, 0.38, r);
    tuft(m, s * span + 0.3, 0.04, 0.3, 0.14, r);
    tuft(m, s * span - 0.25, 0.04, -0.32, 0.12, r);
  }
  peachBush(m, span + 0.55, 0.04, -0.25, 0.75, r);
}

// The south gate: two slim posts under a little stone roof, low and plain,
// with a pair of boundary stones.
function southGate(m) {
  const r = m.rng,
    span = 0.62,
    h = 1.45;
  for (const s of [-1, 1]) {
    const x = s * span;
    block(m, x, 0.08, 0, 0.4, 0.22, 0.4, 0x8e8b7d, r);
    block(m, x, 0.19 + (h - 0.19) / 2, 0, 0.22, h - 0.19, 0.22, r.pick(granite), r);
    collar(m, x, 0, 0.3, 0.3, r);
    boulder(m, s * (span + 0.45), 0, 0.1, 0.16, 0.34, 0.13, r, { n: 7 });
  }
  block(m, 0, h + 0.06, 0, span * 2 + 0.36, 0.12, 0.3, 0x9e9a88, r);
  block(m, 0, h - 0.22, 0, span * 2 - 0.22, 0.08, 0.14, 0x928e7e, r);
  stoneRoof(m, span * 2 + 0.4, 0.42, h + 0.12);
  block(m, 0, 0.03, 0, span * 2 - 0.24, 0.07, 0.24, 0xa49f8b, r);
}

// The east gate: a moon gate through a stone screen wall, capped with dark tiles,
// a flat stone ring framing the opening.
function moonGate(m) {
  const T = m.T,
    r = m.rng;
  const half = 1.25,
    h = 1.75,
    d = 0.14,
    cy = 0.86,
    rad = 0.66;
  const outline = [
    [-half, 0],
    [half, 0],
    [half, h],
    [-half, h]
  ];
  const n = 20,
    hole = [];
  for (let i = 0; i < n; i++) {
    const a = (-i * circle) / n - Math.PI / 2;
    hole.push([Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  const tris = T.ShapeUtils.triangulateShape(
    outline.map(([a, b]) => new T.Vector2(a, b)),
    [hole.map(([a, b]) => new T.Vector2(a, b))]
  );
  const pts = [...outline, ...hole];
  // Lime-washed stone: pale, greying with rain streaks and green at the foot.
  const tint = pts.map(([u, v]) => {
    const streak = hash(Math.round(u * 6), 0, 5) * 0.35;
    let c = m.mix(0xe2ddcf, 0xa9a698, streak * (1 - v / h) + 0.08);
    if (v < 0.25) c = m.mix(0xb4b29d, 0x6f7a55, 0.5);
    return c;
  });
  for (const s of [-1, 1])
    for (const tri of tris)
      facing(
        m,
        tri.map((i) => [pts[i][0], pts[i][1], s * d]),
        tri.map((i) => tint[i]),
        [0, 0, s]
      );
  // Wall ends and the bore of the opening.
  for (const s of [-1, 1])
    facing(
      m,
      [
        [s * half, 0, -d],
        [s * half, h, -d],
        [s * half, h, d],
        [s * half, 0, d]
      ],
      0xcfcabb,
      [s, 0, 0]
    );
  for (let i = 0; i < n; i++) {
    const a = hole[i],
      b = hole[(i + 1) % n];
    facing(
      m,
      [
        [a[0], a[1], -d],
        [a[0], a[1], d],
        [b[0], b[1], d],
        [b[0], b[1], -d]
      ],
      a[1] < cy - rad * 0.8 ? 0x9c9a8a : 0xbfbaa9,
      [-a[0] - b[0], 2 * cy - a[1] - b[1], 0]
    );
  }
  // A ring of dressed voussoirs framing the opening on both faces.
  for (const s of [-1, 1])
    for (let i = 0; i < n; i++) {
      const a = (i * circle) / n,
        b = ((i + 0.92) * circle) / n;
      const p = (t, k) => [Math.cos(t) * (rad + k), cy + Math.sin(t) * (rad + k), s * (d + 0.012)];
      facing(m, [p(a, 0), p(b, 0), p(b, 0.1), p(a, 0.1)], i % 2 ? 0x9f9b8b : 0xaaa592, [0, 0, s]);
    }
  // Threshold stone through the opening.
  m.box(0, 0.05, 0, rad * 1.3, 0.1, d * 2 + 0.16, 0xa29d8a);
  // Coping of dark tiles with a ridge.
  m.box(0, h + 0.03, 0, half * 2 + 0.06, 0.06, d * 2 + 0.06, 0x8f8b7e);
  stoneRoof(m, half * 2, d * 2 + 0.06, h + 0.04, 0x585e5f);
  // Plinth course, and the wall's footing in the turf.
  m.box(0, 0.09, 0, half * 2 + 0.08, 0.2, d * 2 + 0.08, 0x87857a);
  for (const s of [-1, 1]) {
    collar(m, s * (half - 0.2), 0.2, 0.35, 0.18, r);
    collar(m, s * (half - 0.2), -0.2, 0.35, 0.18, r);
  }
  // A tall screen stone stands off one end, as in a garden court.
  m.frame(half + 0.45, 0, 0.25, 0.6, 1, () => taihu(m, 1.5, 0.75, 913));
  collar(m, half + 0.45, 0.25, 0.3, 0.26, r);
  for (let k = 0; k < 5; k++)
    tuft(m, r.range(-half, half), 0.04, r.pick([-1, 1]) * r.range(0.22, 0.4), 0.13, r);
}

// The west stone: the formation's eye, a great Taihu rock on a carved plinth.
function formationEye(m) {
  const r = m.rng;
  // A low octagonal plinth of two steps.
  for (const [y, rad, col] of [
    [0.0, 0.85, 0x8c897b],
    [0.16, 0.66, 0x9d998a]
  ]) {
    const ring = [],
      top = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * circle) / 8 + Math.PI / 8;
      ring.push([Math.cos(a) * rad, y - 0.2, Math.sin(a) * rad]);
      top.push([Math.cos(a) * rad, y + 0.14, Math.sin(a) * rad]);
    }
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      m.face([ring[i], top[i], top[j], ring[j]], i % 2 ? col : m.mix(col, 0x5d5f4f, 0.15));
    }
    m.face(top.slice().reverse(), m.mix(col, 0xc9c2ab, 0.2));
  }
  m.frame(0, 0.3, 0, 0.4, 1, () => taihu(m, 2.25, 1.15, 5051));
  collar(m, 0, 0, 0.95, 0.95, r, 0x6a744f);
  for (let k = 0; k < 6; k++) {
    const a = r.range(0, circle);
    tuft(m, Math.cos(a) * 0.9, 0.04, Math.sin(a) * 0.9, 0.14, r);
  }
  boulder(m, 0.8, 0, 0.55, 0.22, 0.3, 0.18, r, { n: 7 });
}

export { northGate, southGate, moonGate, formationEye };
