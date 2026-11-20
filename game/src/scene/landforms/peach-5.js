// 桃花島的桃樹：開心形的老樹與幼樹、枝頭成簇的花、樹下與水面的落英。
import { circle } from '../scenery-kit.js';

const pinks = [
  [0xc27382, 0xeda4b0, 0xfcd9d8],
  [0xcc8590, 0xf3b6bd, 0xfde6e2],
  [0xb8667a, 0xe596a6, 0xf8c9cc],
  [0xcfa0a6, 0xf5dcdc, 0xfff6f0]
];
const bark = [0x584038, 0x654b41, 0x735649];

// A cluster of blossom: a lumpy puff of two staggered rings, deep pink in its
// shade and almost white where the sun catches the open flowers.
function blossom(m, x, y, z, rad, r, tone = r.pick(pinks)) {
  const n = 5,
    turn = r.range(0, circle);
  const [deep, mid, pale] = tone.map((c) => m.rgb(c));
  const ring = (k, lift, spread) =>
    Array.from({ length: n }, (_, i) => {
      const a = turn + ((i + k * 0.5) * circle) / n + r.range(-0.2, 0.2),
        s = rad * spread * r.range(0.8, 1.15);
      return [x + Math.cos(a) * s, y + rad * (lift + r.range(-0.1, 0.1)), z + Math.sin(a) * s];
    });
  const upper = ring(1, 0.32, 0.82),
    lower = ring(0, -0.18, 1),
    top = [
      x + r.range(-0.15, 0.15) * rad,
      y + rad * r.range(0.72, 0.88),
      z + r.range(-0.15, 0.15) * rad
    ],
    low = [x, y - rad * 0.55, z];
  // Wound outward, so the shadow's normal bias does not darken the flowers.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([top, upper[j], upper[i]], [pale, i % 2 ? pale : mid, pale]);
    m.face([lower[i], upper[i], lower[j]], [mid, pale, mid]);
    m.face([lower[j], upper[i], upper[j]], [mid, pale, i % 2 ? mid : pale]);
    m.face([low, lower[i], lower[j]], [deep, deep, mid]);
  }
}

// One fallen petal lying flat.
function petal(m, x, y, z, r) {
  const a = r.range(0, circle),
    l = r.range(0.028, 0.05),
    c = r.pick([0xe8b5bd, 0xf2cdd0, 0xd99aa8, 0xf6e0dc]);
  const dx = Math.cos(a) * l,
    dz = Math.sin(a) * l;
  m.face(
    [
      [x - dx, y, z - dz],
      [x - dz * 0.6, y + 0.002, z + dx * 0.6],
      [x + dx, y, z + dz],
      [x + dz * 0.6, y + 0.002, z - dx * 0.6]
    ],
    c
  );
}

function unit(v) {
  const l = Math.hypot(...v) || 1;
  return v.map((n) => n / l);
}
// Bend a direction away from itself by `spread` radians around a random side.
function swerve(dir, spread, r, lift = 0) {
  const side = unit(Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [-dir[2], 0, dir[0]]);
  const up = unit([
    dir[1] * side[2] - dir[2] * side[1],
    dir[2] * side[0] - dir[0] * side[2],
    dir[0] * side[1] - dir[1] * side[0]
  ]);
  const a = r.range(0, circle),
    s = Math.sin(spread),
    c = Math.cos(spread);
  return unit([
    dir[0] * c + (side[0] * Math.cos(a) + up[0] * Math.sin(a)) * s,
    dir[1] * c + (side[1] * Math.cos(a) + up[1] * Math.sin(a)) * s + lift,
    dir[2] * c + (side[2] * Math.cos(a) + up[2] * Math.sin(a)) * s
  ]);
}

// A branch that forks until its twigs end in blossom. Each fork thins the wood;
// flowers sit along the last two orders of growth, as on a real peach.
function branch(m, from, dir, len, rad, order, r, bloom, look) {
  const kink = swerve(dir, r.range(0.1, 0.3), r, look.droop),
    mid = from.map((n, i) => n + dir[i] * len * 0.5),
    end = mid.map((n, i) => n + kink[i] * len * 0.5);
  const sides = order > 2 ? 7 : order > 1 ? 6 : order > 0 ? 5 : 4;
  const colour = bark[Math.min(2, 3 - Math.min(3, order))];
  m.tube(from, mid, rad, rad * 0.88, colour, sides);
  m.tube(mid, end, rad * 0.88, rad * 0.72, colour, sides);
  // Flowers crowd the young wood: several clusters along each twig, a few on older limbs.
  if (order <= 2) {
    const spots = order === 0 ? look.twig || [0.3, 0.6, 0.88] : order === 1 ? [0.35, 0.7] : [0.8];
    for (const t of spots) {
      if (r.next() > look.density * (order === 2 ? 0.6 : 1)) continue;
      const p = from.map((n, i) => n + (end[i] - n) * t + r.range(-0.04, 0.04));
      blossom(m, p[0], p[1] + 0.03, p[2], r.range(0.075, 0.12) * look.bloom, r, look.tone(r));
    }
  }
  if (order === 0) {
    blossom(m, end[0], end[1] + 0.02, end[2], r.range(0.11, 0.16) * look.bloom, r, look.tone(r));
    if (r.next() < look.leaf)
      m.leaf(
        end,
        [end[0] + kink[0] * 0.13, end[1] + 0.05, end[2] + kink[2] * 0.13],
        0.03,
        0x6f8a4c,
        0xa4b46c,
        0.02
      );
    bloom.push(end);
    return;
  }
  const forks = order >= 2 ? 3 : 2;
  for (let k = 0; k < forks; k++) {
    if (k === 2 && r.next() < 0.4) continue;
    const next = swerve(kink, r.range(0.35, 0.7), r, 0.12);
    branch(m, end, next, len * r.range(0.62, 0.76), rad * 0.62, order - 1, r, bloom, look);
  }
}

// An open-centred peach: a short leaning trunk, three to five scaffold limbs
// spreading like a vase, flowers carried out on the young wood.
// look: { size, age (0 young .. 1 ancient), density, leaf }
function peachTree(m, opts, r) {
  const size = opts.size || 1,
    age = opts.age ?? 0.5;
  const look = {
    density: opts.density ?? 0.85,
    leaf: opts.leaf ?? 0.15,
    bloom: 1 + age * 0.25,
    droop: -0.05 - age * 0.06,
    tone: opts.white ? () => pinks[3] : (rr) => pinks[Math.floor(rr.next() * 3)]
  };
  const bloom = [];
  m.frame(0, 0, 0, 0, size, () => {
    const trunkH = 0.62 + age * 0.35,
      girth = 0.09 + age * 0.08,
      lean = [r.range(-0.25, 0.25), 1, r.range(-0.25, 0.25)];
    // Root flare.
    for (let k = 0; k < 5; k++) {
      const a = (k * circle) / 5 + r.range(-0.3, 0.3);
      m.tube(
        [0, 0.14, 0],
        [Math.cos(a) * girth * 2, -0.1, Math.sin(a) * girth * 2],
        girth * 0.7,
        girth * 0.25,
        bark[0],
        5
      );
    }
    // A gnarled trunk in three crooked runs.
    let p = [0, -0.08, 0];
    const crook = [
      unit(lean),
      unit([lean[0] * -0.6 + r.range(-0.2, 0.2), 1, lean[2] * -0.6]),
      unit(lean)
    ];
    for (let k = 0; k < 3; k++) {
      const q = p.map((n, i) => n + crook[k][i] * (trunkH / 3) * (k === 0 ? 1.1 : 1));
      m.tube(p, q, girth * (1 - k * 0.12), girth * (0.88 - k * 0.12), bark[k % 2], 8);
      p = q;
    }
    // Old trees carry a dark wound where a limb was lost.
    if (age > 0.6)
      m.tube(
        [0, trunkH * 0.45, girth * 0.7],
        [0.05, trunkH * 0.6, girth * 0.95],
        girth * 0.35,
        girth * 0.12,
        0x3d2d29,
        5
      );
    const limbs = 3 + Math.round(age * 2),
      turn = r.range(0, circle);
    for (let k = 0; k < limbs; k++) {
      const a = turn + (k * circle) / limbs + r.range(-0.3, 0.3),
        rise = r.range(0.75, 1.1);
      const dir = unit([Math.cos(a), rise, Math.sin(a)]);
      branch(m, p, dir, r.range(0.55, 0.72) * (1 + age * 0.25), girth * 0.62, 3, r, bloom, look);
    }
  });
  return bloom.map((v) => v.map((n) => n * size));
}

// A young peach bush for the thicket tiles: a few stems from the ground, branching
// once or twice, carrying blossom almost to the ground.
function peachBush(m, x, y, z, h, r) {
  const look = {
    density: 0.95,
    leaf: 0.3,
    bloom: 0.72,
    twig: [0.6],
    droop: -0.02,
    tone: (rr) => pinks[Math.floor(rr.next() * 3)]
  };
  const stems = 2;
  for (let k = 0; k < stems; k++) {
    const a = (k * circle) / stems + r.range(-0.4, 0.4);
    const dir = unit([Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35]);
    branch(m, [x, y - 0.03, z], dir, h * 0.55, 0.018, 1, r, [], look);
  }
  blossom(m, x, y + h * 0.7, z, 0.12, r);
  // A few new leaves low on the stems.
  for (let k = 0; k < 4; k++) {
    const a = r.range(0, circle);
    m.leaf(
      [x, y + 0.08, z],
      [x + Math.cos(a) * 0.12, y + 0.14, z + Math.sin(a) * 0.12],
      0.035,
      0x5f7c45,
      0x93ab64,
      0.03
    );
  }
}

export { blossom, petal, peachTree, peachBush, pinks };
