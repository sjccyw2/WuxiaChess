import { TAU, lerp, barkLight, moss, stone, pad } from './kit-12.js';

// 鐵掌溪灘's low growth: grass in clumps, ferns in the shade of rocks, cushions of heather on the
// open banks, leafy scrub, reeds at the water's edge and trunks the floods have thrown down.

const blades = [0x6f7c50, 0x7d8556, 0x8f8f60, 0x667548, 0x9a9466],
  straw = 0xb3a876,
  frond = [0x4f6b3e, 0x5d7a45, 0x6a8a4c],
  heath = [0x5f6046, 0x6a6448, 0x5a5a40, 0x666248],
  heathBloom = [0x8a6a78, 0x7d6470, 0x947a80],
  leaves = [0x5b7340, 0x6b8247, 0x7a8a4a, 0x8a8a4c, 0x55693d],
  reed = [0x8c9460, 0x7b8a55, 0xa3a06a],
  drift = 0x8f8676,
  driftDark = 0x6e6658;

// A clump of grass: blades fanning out from one root, bent over at their tips, the outer ones
// dry and pale.
function grassClump(m, x, y, z, s, n = 7) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r.range(-0.3, 0.3),
      l = s * r.range(0.65, 1.15),
      out = r.range(0.25, 0.6),
      base = [x + Math.cos(a) * s * 0.06, y, z + Math.sin(a) * s * 0.06],
      tip = [x + Math.cos(a) * l * out, y + l * (1.05 - out * 0.6), z + Math.sin(a) * l * out];
    const col = r.pick(blades);
    m.leaf(base, tip, l * 0.06, col, i % 3 ? col : straw, l * 0.16);
  }
}

// A fern: fronds arching out and down from a crown, each a row of leaflets that shorten
// toward its tip.
function fern(m, x, y, z, s, fronds = 6) {
  const r = m.rng,
    segs = 5;
  for (let f = 0; f < fronds; f++) {
    const a = (f / fronds) * TAU + r.range(-0.25, 0.25),
      len = s * r.range(0.8, 1.15),
      rise = r.range(0.45, 0.7),
      col = m.rgb(r.pick(frond)),
      light = m.mix(col, 0x9db26a, 0.35),
      ca = Math.cos(a),
      sa = Math.sin(a);
    let last = [x, y + s * 0.04, z];
    for (let k = 1; k <= segs; k++) {
      const t = k / segs,
        d = len * t,
        p = [x + ca * d, y + s * 0.04 + len * rise * (t * 1.6 - t * t * 1.25), z + sa * d];
      const w = len * 0.2 * (1 - t * 0.75),
        mid = [(last[0] + p[0]) / 2, (last[1] + p[1]) / 2, (last[2] + p[2]) / 2];
      for (const side of [-1, 1]) {
        const tipL = [
          mid[0] - sa * w * side + ca * w * 0.3,
          mid[1] - w * 0.25,
          mid[2] + ca * w * side + sa * w * 0.3
        ];
        m.face([last, tipL, p], side > 0 ? col : light, 0.85 + 0.15 * t);
      }
      last = p;
    }
  }
}

// A cushion of heather or ling: a low lumpy mound, brown-green, with sprigs of faded bloom.
function heather(m, x, y, z, s) {
  const r = m.rng,
    body = r.pick(heath);
  for (let i = 0; i < 2; i++) {
    const a = r.range(0, TAU),
      d = i ? s * 0.45 : 0;
    pad(
      m,
      x + Math.cos(a) * d,
      y + s * 0.12,
      z + Math.sin(a) * d,
      s * (i ? 0.6 : 0.85),
      true,
      heath,
      body,
      m.mix(r.pick(heathBloom), body, 0.45),
      7
    );
  }
  for (let i = 0; i < 4; i++) {
    const a = r.range(0, TAU),
      d = s * r.range(0.2, 0.75),
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d * 0.8,
      py = y + s * 0.25 * (1 - d / s) + s * 0.08;
    m.leaf(
      [px, py, pz],
      [px + r.range(-0.05, 0.05), py + s * 0.35, pz + r.range(-0.05, 0.05)],
      s * 0.08,
      body,
      r.pick(heathBloom),
      0.01
    );
  }
}

// A leafy bush of mountain scrub: a few stems from one root, each carrying leaves on short
// twigs, yellowing at its outer edge.
function bush(m, x, y, z, s, autumn = 0) {
  const r = m.rng,
    stems = 4;
  for (let j = 0; j < stems; j++) {
    const a = (j / stems) * TAU + r.range(-0.4, 0.4),
      d = s * r.range(0.25, 0.5),
      top = [x + Math.cos(a) * d, y + s * r.range(0.55, 0.9), z + Math.sin(a) * d],
      mid = [x + Math.cos(a) * d * 0.4, y + s * 0.35, z + Math.sin(a) * d * 0.4];
    m.line([[x, y - 0.02, z], mid, top], 0.018 * s, barkLight, 4);
    for (let k = 0; k < 7; k++) {
      const t = 0.3 + (k / 6) * 0.7,
        at = [lerp(mid[0], top[0], t), lerp(mid[1], top[1], t), lerp(mid[2], top[2], t)],
        b = a + (k % 2 ? 1.1 : -1.1) + r.range(-0.4, 0.4),
        l = s * r.range(0.2, 0.32),
        tip = [at[0] + Math.cos(b) * l, at[1] + l * r.range(-0.1, 0.35), at[2] + Math.sin(b) * l];
      const col = r.next() < autumn ? r.pick([0xa48a45, 0x9c6e3c]) : r.pick(leaves);
      m.leaf(at, tip, l * 0.36, col, m.mix(col, 0xa6b06a, 0.3), l * 0.1);
    }
  }
}

// A stand of reeds or rushes at the water's edge: tall blades, a few with a brown seed head.
function reeds(m, x, y, z, s, n = 9) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const a = r.range(0, TAU),
      d = s * r.range(0, 0.22),
      bx = x + Math.cos(a) * d,
      bz = z + Math.sin(a) * d,
      h = s * r.range(0.6, 1.1),
      lean = r.range(0.05, 0.22),
      b = r.range(0, TAU),
      tip = [bx + Math.cos(b) * h * lean, y + h, bz + Math.sin(b) * h * lean];
    const col = r.pick(reed);
    m.leaf([bx, y - 0.02, bz], tip, s * 0.025, col, m.mix(col, straw, 0.4), h * 0.06);
    if (i % 3 === 0)
      m.tube([tip[0], tip[1] - h * 0.18, tip[2]], tip, s * 0.018, s * 0.008, 0x6b4f35, 4);
  }
}

// A trunk thrown down by a flood: bark grey with weather and green with moss on top, the
// stubs of its boughs, and the plate of roots it tore out of the bank at one end.
function fallenTrunk(m, x, y, z, len, yaw, rad, { roots = true, wet = false } = {}) {
  const r = m.rng,
    dx = Math.cos(yaw),
    dz = Math.sin(yaw),
    a = [x - (dx * len) / 2, y + rad * 0.7, z - (dz * len) / 2],
    b = [x + (dx * len) / 2, y + rad * 0.55, z + (dz * len) / 2];
  const body = wet ? driftDark : drift;
  m.tube(a, b, rad, rad * 0.7, body, 8);
  // Moss along its crown.
  m.tube(
    [a[0], a[1] + rad * 0.55, a[2]],
    [lerp(a[0], b[0], 0.7), lerp(a[1], b[1], 0.7) + rad * 0.5, lerp(a[2], b[2], 0.7)],
    rad * 0.55,
    rad * 0.35,
    m.mix(moss, body, 0.25),
    6
  );
  // Broken boughs.
  for (let i = 0; i < 4; i++) {
    const t = r.range(0.25, 0.95),
      at = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
      side = i % 2 ? 1 : -1,
      l = r.range(0.2, 0.5) * rad * 4;
    m.tube(
      at,
      [
        at[0] - dz * side * l * 0.7 + dx * l * 0.3,
        at[1] + l * r.range(0.1, 0.6),
        at[2] + dx * side * l * 0.7 + dz * l * 0.3
      ],
      rad * 0.3,
      rad * 0.1,
      body,
      4
    );
  }
  if (!roots) return;
  // The root plate: a disc of earth and stones with roots radiating from it.
  // Its axis lies along the trunk, so the plate stands upright across the trunk's end.
  m.frame(
    a[0],
    a[1],
    a[2],
    Math.PI / 2 - yaw,
    1,
    () => {
      m.lathe(
        0,
        -rad * 0.9,
        0,
        [
          [0, rad * 1.1],
          [rad * 0.3, rad * 2.1],
          [rad * 0.8, rad * 2.3],
          [rad * 1.1, rad * 1.2],
          [rad * 1.2, 0]
        ],
        m.mix(0x6a5a48, stone.dark, 0.3),
        9
      );
      for (let i = 0; i < 9; i++) {
        const q = (i / 9) * TAU + r.range(-0.2, 0.2),
          reach = rad * r.range(2.6, 3.8);
        m.tube(
          [0, -rad * 0.3, 0],
          [Math.cos(q) * reach, -rad * r.range(0.5, 1.2), Math.sin(q) * reach],
          rad * 0.16,
          rad * 0.04,
          barkLight,
          4
        );
      }
    },
    Math.PI / 2
  );
}

// Fallen needles and dead leaves round the foot of a tree: a few flat flakes.
function litter(m, x, y, z, s, n = 6) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const a = r.range(0, TAU),
      d = s * Math.sqrt(r.next()),
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d,
      b = r.range(0, TAU),
      l = r.range(0.05, 0.09);
    m.face(
      [
        [px, y + 0.012, pz],
        [px + Math.cos(b + 0.4) * l * 0.5, y + 0.014, pz + Math.sin(b + 0.4) * l * 0.5],
        [px + Math.cos(b) * l, y + 0.012, pz + Math.sin(b) * l]
      ],
      r.pick([0x8a6f4a, 0x9a7d52, 0x7a6448])
    );
  }
}

export { grassClump, fern, heather, bush, reeds, fallenTrunk, litter };
