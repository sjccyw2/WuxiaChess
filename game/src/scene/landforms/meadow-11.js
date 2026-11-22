// The valley floor of 絕情谷 close up: tussocks of grass and wild flowers in the turf,
// the worn footpaths with their stepping stones and the slab bridge on the south path,
// damp hollows with rushes, mossed rocks gripped by roots, and a fallen bough or two.
import { circle } from '../scenery-kit.js';
import { reeds } from '../maze-models.js';
import { fade, lerp, noise, stones, mossy, leafy, clump, fern, tuft, blossom } from './flora-11.js';

// A tussock: blades bowing outward from a dark heart, lit at their tips.
const grassTones = [
  [0x3a5232, 0x7d9a54],
  [0x40583a, 0x8fa35e],
  [0x34502f, 0x6e8d4b],
  [0x4a5b36, 0x9a9b5e]
];
function tussock(m, x, y, z, s, tones = m.rng.pick(grassTones)) {
  const r = m.rng,
    count = 6 + Math.floor(r.next() * 4),
    turn = r.range(0, circle),
    base = m.rgb(tones[0]),
    tip = m.rgb(tones[1]);
  for (let j = 0; j < count; j++) {
    const a = turn + (j * circle) / count + r.range(-0.3, 0.3),
      out = r.range(0.05, 0.13) * s,
      high = r.range(0.12, 0.24) * s,
      w = 0.016 * s,
      ca = Math.cos(a),
      sa = Math.sin(a),
      mid = [x + ca * out * 0.45, y + high * 0.7, z + sa * out * 0.45],
      knee = m.mix(tones[0], tones[1], 0.55);
    m.face(
      [
        [x - sa * w, y, z + ca * w],
        [mid[0] - sa * w * 0.6, mid[1], mid[2] + ca * w * 0.6],
        [mid[0] + sa * w * 0.6, mid[1], mid[2] - ca * w * 0.6],
        [x + sa * w, y, z - ca * w]
      ],
      [base, knee, knee, base]
    );
    m.face(
      [
        [mid[0] - sa * w * 0.6, mid[1], mid[2] + ca * w * 0.6],
        [x + ca * out, y + high, z + sa * out],
        [mid[0] + sa * w * 0.6, mid[1], mid[2] - ca * w * 0.6]
      ],
      [knee, tip, knee]
    );
  }
}

// A knot of wild flowers on thin stems: white, gold, violet or pale blue.
const wildTones = [
  [0xe8e3cf, 0xfbf8ee],
  [0xd8b545, 0xf2dc78],
  [0x8a6cc0, 0xb9a0e0],
  [0x7e9fcf, 0xb9cfee]
];
function wildflowers(m, x, y, z, s) {
  const r = m.rng,
    tone = r.pick(wildTones),
    count = 4 + Math.floor(r.next() * 4);
  for (let j = 0; j < count; j++) {
    const a = r.range(0, circle),
      d = Math.sqrt(r.next()) * 0.09 * s,
      fx = x + Math.cos(a) * d,
      fz = z + Math.sin(a) * d,
      h = r.range(0.08, 0.16) * s;
    m.face(
      [
        [fx - 0.005, y, fz],
        [fx + 0.004, y + h, fz + 0.002],
        [fx + 0.005, y, fz]
      ],
      0x4c6a3c
    );
    blossom(m, fx + 0.004, y + h, fz + 0.002, 0.02 * s, a, r.range(0.1, 0.6), tone);
  }
  for (let j = 0; j < 3; j++) {
    const a = r.range(0, circle),
      l = r.range(0.04, 0.07) * s;
    m.face(
      [
        [x, y + 0.004, z],
        [x + Math.cos(a + 0.3) * l * 0.5, y + 0.02, z + Math.sin(a + 0.3) * l * 0.5],
        [x + Math.cos(a) * l, y + 0.012, z + Math.sin(a) * l],
        [x + Math.cos(a - 0.3) * l * 0.5, y + 0.02, z + Math.sin(a - 0.3) * l * 0.5]
      ],
      0x47663a
    );
  }
}

// A flat stone set in the ground, its top a little domed, its edge showing.
function setStone(m, at, x, z, yaw, long, wide, col, lift = 0.02, sides = 7) {
  const r = m.rng,
    c = Math.cos(yaw),
    s = Math.sin(yaw),
    top = [],
    low = [];
  for (let i = 0; i < sides; i++) {
    const a = ((i + 0.5) * circle) / sides + r.range(-0.15, 0.15),
      u = Math.cos(a) * long * r.range(0.86, 1.08),
      v = Math.sin(a) * wide * r.range(0.86, 1.08),
      fx = x + u * c + v * s,
      fz = z - u * s + v * c,
      g = at(fx, fz);
    top.push([fx, g + lift, fz]);
    low.push([fx, g - 0.02, fz]);
  }
  const hi = m.mix(col, 0xc4c0b0, 0.18),
    side = m.mix(col, 0x3c3f38, 0.35);
  const middle = [x, at(x, z) + lift + 0.012, z];
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    m.face([middle, top[j], top[i]], [hi, m.rgb(col), m.rgb(col)]);
    m.face([low[i], top[i], top[j], low[j]], side);
  }
}

// A bough fallen long ago, grey and mossed, with a stub or two of its branches.
function fallenBough(m, at, x, z, yaw, length) {
  const r = m.rng,
    c = Math.cos(yaw),
    s = Math.sin(yaw),
    a = [x - (c * length) / 2, 0, z - (s * length) / 2],
    b = [x + (c * length) / 2, 0, z + (s * length) / 2];
  a[1] = at(a[0], a[2]) + 0.035;
  b[1] = at(b[0], b[2]) + 0.025;
  m.tube(a, b, 0.055, 0.035, 0x6d6553, 6);
  m.tube(a, [a[0] - c * 0.03, a[1] + 0.01, a[2] - s * 0.03], 0.058, 0.0, 0x9a8a6a, 6);
  for (let k = 0; k < 3; k++) {
    const t = 0.25 + 0.25 * k,
      p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t) + 0.02, lerp(a[2], b[2], t)],
      side = k % 2 ? 1 : -1,
      q = [p[0] - s * side * 0.16 + c * 0.05, p[1] + r.range(0.03, 0.09), p[2] + c * side * 0.16 + s * 0.05];
    m.tube(p, q, 0.018, 0.008, 0x6d6553, 4);
  }
  for (let k = 0; k < 4; k++) {
    const t = r.range(0.1, 0.9),
      p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t) + 0.04, lerp(a[2], b[2], t)];
    m.face(
      [
        [p[0] - c * 0.06, p[1], p[2] - s * 0.06],
        [p[0] - s * 0.03, p[1] + 0.012, p[2] + c * 0.03],
        [p[0] + c * 0.06, p[1], p[2] + s * 0.06],
        [p[0] + s * 0.03, p[1] + 0.012, p[2] - c * 0.03]
      ],
      0x58763f
    );
  }
}

// A mossed boulder half sunk in the turf, roots of an unseen tree gripping it, ferns at its foot.
function rootedRock(m, at, x, z, s) {
  const r = m.rng,
    y = at(x, z),
    grey = r.pick(stones);
  m.rock(x, y - s * 0.3, z, s, s * r.range(0.75, 1.1), s * r.range(0.7, 0.95), grey, m.mix(grey, mossy, r.range(0.55, 0.9)), 8, r.range(0, 3));
  m.rock(x + s * 0.9, y - s * 0.2, z + s * 0.35, s * 0.45, s * 0.4, s * 0.4, grey, m.mix(grey, mossy, 0.6), 6);
  const turn = r.range(0, circle);
  for (let k = 0; k < 3; k++) {
    const a = turn + k * 0.7,
      from = [x + Math.cos(a) * s * 0.55, y + s * 0.45, z + Math.sin(a) * s * 0.5],
      over = [x + Math.cos(a) * s * 0.95, y + s * 0.2, z + Math.sin(a) * s * 0.85],
      down = [x + Math.cos(a) * s * 1.35, at(x + Math.cos(a) * s * 1.35, z + Math.sin(a) * s * 1.35) - 0.02, z + Math.sin(a) * s * 1.25];
    m.line([from, over, down], 0.016, 0x5a4a38, 4);
  }
  fern(m, x - s * 0.8, y - 0.01, z + s * 0.6, s * 0.9);
  if (r.next() < 0.6) fern(m, x + s * 0.4, y - 0.01, z + s * 0.95, s * 0.7);
  tussock(m, x - s * 0.2, y - 0.01, z - s * 1.05, 0.9);
}

// The brook's banks: wet stones along both edges, a few laid across it where it drops in
// little falls with foam below them, and clumps of rushes in its slack water.
function brookBanks(m, land, at) {
  const r = m.rng,
    brook = land.brook,
    foam = m.rgb(0xe8f1ee),
    swirl = m.rgb(0xa9c9c0);
  for (let i = 1; i < brook.length - 1; i++) {
    const [x, z] = brook[i],
      [px, pz] = brook[i - 1],
      [qx, qz] = brook[i + 1],
      l = Math.hypot(qx - px, qz - pz) || 1,
      nx = -(qz - pz) / l,
      nz = (qx - px) / l;
    if (Math.abs(x) > 14 || Math.abs(z) > 14) break;
    // Stones on both banks, small and close together, some half in the water.
    for (const side of [-1, 1]) {
      if (r.next() < 0.5) continue;
      const off = side * r.range(0.2, 0.33),
        t = r.range(-0.4, 0.4),
        sx = x + nx * off + (qx - px) * t * 0.5,
        sz = z + nz * off + (qz - pz) * t * 0.5,
        s = r.range(0.045, 0.1);
      if (land.gap(sx, sz) < 0.2) continue;
      m.rock(
        sx,
        at(sx, sz) - 0.02,
        sz,
        s,
        s * r.range(0.5, 0.8),
        s * 0.8,
        m.mix(r.pick(stones), 0x4f5a50, 0.35),
        m.mix(0x8d8f88, mossy, r.next() * 0.8),
        5
      );
    }
    // Ripples and streaks of light on the running water.
    if (i % 2 === 0) {
      const t = r.range(-0.08, 0.08),
        y = at(x, z) + 0.034,
        dx = (qx - px) / l,
        dz = (qz - pz) / l,
        len = r.range(0.12, 0.22),
        cx = x + nx * t,
        cz = z + nz * t;
      m.face(
        [
          [cx - dx * len, y, cz - dz * len],
          [cx + nx * 0.012, y, cz + nz * 0.012],
          [cx + dx * len, y, cz + dz * len],
          [cx - nx * 0.012, y, cz - nz * 0.012]
        ],
        swirl
      );
    }
    // Rushes in the slack water of the bends.
    if (i % 9 === 4 && land.gap(x, z) > 0.6) {
      const side = r.next() < 0.5 ? -1 : 1,
        sx = x + nx * side * 0.3,
        sz = z + nz * side * 0.3;
      reeds(m, sx, sz, r.range(0.28, 0.4), 6, false, at(sx, sz) + 0.01);
    }
  }
  // Little falls where the brook comes down off the slope below the plunge pool: a sill of
  // stones across it, white water spilling over, foam spread below.
  for (const i of [5, 11, 17, 24]) {
    const [x, z] = brook[i],
      [px, pz] = brook[i - 1],
      [qx, qz] = brook[i + 1],
      l = Math.hypot(qx - px, qz - pz) || 1,
      nx = -(qz - pz) / l,
      nz = (qx - px) / l,
      dx = (qx - px) / l,
      dz = (qz - pz) / l,
      y = at(x, z);
    for (let k = -2; k <= 2; k++) {
      const off = k * 0.085 + r.range(-0.02, 0.02),
        sx = x + nx * off,
        sz = z + nz * off,
        s = r.range(0.05, 0.075);
      if (k === 0 && r.next() < 0.6) continue;
      m.rock(sx, y - 0.01, sz, s, s * 0.9, s * 0.7, m.mix(r.pick(stones), 0x4f5a50, 0.4), 0x7d8a78, 5);
    }
    for (let k = 0; k < 5; k++) {
      const off = r.range(-0.15, 0.15),
        ahead = r.range(0.05, 0.3),
        fx = x + nx * off + dx * ahead,
        fz = z + nz * off + dz * ahead,
        s = r.range(0.03, 0.06);
      m.face(
        [
          [fx - dx * s * 1.6, y + 0.04, fz - dz * s * 1.6],
          [fx + nx * s, y + 0.043, fz + nz * s],
          [fx + dx * s * 1.6, y + 0.04, fz + dz * s * 1.6],
          [fx - nx * s, y + 0.043, fz - nz * s]
        ],
        foam
      );
    }
  }
}

// A coping of dressed stone round the deep pool, laid just inside its water so that it
// never touches a tile; reeds stand in its corners.
function poolRim(m, land) {
  const r = m.rng,
    wet = new Set(land.pool.map(([x, y]) => x + ',' + y)),
    y = -0.05;
  for (const [cx, cy] of land.pool) {
    const x0 = cx - land.halfX,
      z0 = cy - land.halfZ;
    // Each side of the cell that faces a tile gets a row of coping stones.
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      if (wet.has(cx + dx + ',' + (cy + dy))) continue;
      const along = dx === 0,
        edge = dx === 1 || dy === 1 ? 1 : 0;
      let s = 0;
      while (s < 0.99) {
        const l = Math.min(1 - s, r.range(0.22, 0.36)),
          mid = s + l / 2,
          inset = edge ? -0.045 : 0.045,
          px = along ? x0 + mid : x0 + edge + inset,
          pz = along ? z0 + edge + inset : z0 + mid,
          tone = m.mix(r.pick(stones), r.next() < 0.3 ? mossy : 0x6f736c, r.range(0.1, 0.4));
        m.box(px, y + 0.02, pz, along ? l - 0.016 : 0.08, 0.06, along ? 0.08 : l - 0.016, tone);
        s += l;
      }
    }
  }
  // Reeds in the corners where the coping meets.
  for (const [x, z] of [
    [-1.35, -0.42],
    [-0.42, -1.38],
    [1.42, -1.38],
    [2.38, 0.42],
    [1.42, 1.38],
    [-0.42, 1.38]
  ])
    if (land.inPool(x, z) && r.next() < 0.8) reeds(m, x, z, r.range(0.26, 0.38), 6, false, y);
}

// Round shrubs of the valley floor's outer ring, low on the near sides, with ferns and grass
// gathered at their feet: the green between the 情花 drifts and the woods.
function outerShrubs(m, land, at, open) {
  const r = m.rng,
    stood = [];
  for (let k = 0; k < 4000 && stood.length < 62; k++) {
    const x = r.range(-13.5, 14),
      z = r.range(-11, 18.5),
      d = land.gap(x, z);
    if (d < 2.4 || d > 14 || !open(x, z, 0.4)) continue;
    if (noise(x * 0.4 - 17, z * 0.4 + 5) < 0.5) continue;
    if (stood.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 0.7)) continue;
    stood.push([x, z]);
    const near = z > land.halfZ || x > land.halfX,
      s = near ? r.range(0.18, 0.3) : r.range(0.25, 0.45),
      y = at(x, z),
      [shade, light] = r.pick(leafy);
    clump(m, x, y + s * 0.25, z, s, s * 0.85, s * r.range(0.8, 1), shade, light, 7);
    clump(m, x + s * 0.6, y + s * 0.1, z + s * 0.3, s * 0.6, s * 0.6, s * 0.6, m.mix(shade, light, 0.3), light, 6);
    if (r.next() < 0.6) fern(m, x - s * 0.9, y - 0.01, z + s * 0.5, s * 0.7);
    tussock(m, x + s * 0.2, y - 0.01, z + s * 1.0, 1.0);
  }
}

function meadow(m, land, at) {
  const r = m.rng,
    [px, pz] = land.plunge;
  const open = (x, z, margin = 0) =>
    land.gap(x, z) > 0.1 + margin &&
    !land.inPool(x, z) &&
    land.toBrook(x, z) > 0.42 + margin &&
    land.toTrack(x, z) > 0.4 + margin &&
    land.toLane(x, z) > 0.32 + margin &&
    !(x > 0.6 && x < 10.6 && z > -10.4 && z < -5.45) &&
    Math.hypot(x - px, z - pz) > 1.1 + margin;

  // Tussocks: thickest at the board's foot, along the brook and the paths' verges, thinning
  // up the slopes into the woods.
  for (let k = 0; k < 1400; k++) {
    const x = r.range(-14, 14),
      z = r.range(-11.5, 17.5),
      chance = r.next();
    if (!open(x, z)) continue;
    const d = land.gap(x, z),
      b = land.toBrook(x, z),
      l = Math.min(land.toLane(x, z), land.toTrack(x, z)),
      h = at(x, z);
    const want =
      Math.max(d < 1.2 ? 0.55 - d * 0.3 : 0, b < 1.2 ? 0.5 : 0, l < 0.9 ? 0.45 : 0, 0.13) *
      (0.55 + 0.9 * noise(x * 0.7 + 13, z * 0.7 - 4)) *
      (1 - fade((h - 0.6) / 1.2) * 0.8);
    if (chance > want) continue;
    tussock(m, x, h - 0.012, z, r.range(0.7, 1.35) * (d < 0.5 ? 0.75 : 1));
  }
  // Wild flowers in drifts of their own across the turf.
  for (let k = 0; k < 420; k++) {
    const x = r.range(-13, 12.5),
      z = r.range(-11, 12.5);
    if (!open(x, z, 0.05) || noise(x * 0.45 - 6, z * 0.45 + 12) < 0.55 || at(x, z) > 0.6) continue;
    if (r.next() < 0.45) continue;
    wildflowers(m, x, at(x, z) - 0.005, z, r.range(0.8, 1.25));
  }

  // The footpaths: stepping stones down the middle, pebbles on the verges.
  for (const lane of land.lanes)
    for (let i = 0; i < lane.length - 1; i++) {
      const [x, z] = lane[i],
        [qx, qz] = lane[i + 1],
        yaw = Math.atan2(-(qz - z), qx - x);
      if (Math.abs(x) > 14 || Math.abs(z) > 14) break;
      // A stone every pace or so where the path is soft, none where it is firm.
      if (noise(x * 0.8 + 2, z * 0.8) > 0.42) {
        const t = r.range(0.1, 0.9),
          fx = lerp(x, qx, t) + r.range(-0.07, 0.07),
          fz = lerp(z, qz, t) + r.range(-0.07, 0.07);
        if (land.gap(fx, fz) > 0.28 && land.toBrook(fx, fz) > 0.5)
          setStone(
            m,
            at,
            fx,
            fz,
            yaw + r.range(-0.3, 0.3),
            r.range(0.14, 0.2),
            r.range(0.1, 0.14),
            m.mix(r.pick(stones), 0x6f6a58, 0.45),
            0.014
          );
      }
      // Pebbles kicked to the verges.
      const side = r.next() < 0.5 ? -1 : 1,
        off = side * r.range(0.28, 0.42),
        l = Math.hypot(qx - x, qz - z) || 1,
        t = r.next(),
        fx = lerp(x, qx, t) - ((qz - z) / l) * off,
        fz = lerp(z, qz, t) + ((qx - x) / l) * off;
      if (land.gap(fx, fz) > 0.2 && land.toBrook(fx, fz) > 0.45) {
        const s = r.range(0.035, 0.07);
        m.rock(fx, at(fx, fz) - 0.015, fz, s, s * 0.6, s * 0.8, r.pick(stones), m.mix(0x9a9a90, mossy, r.next() * 0.5), 5);
      }
    }
  // The slab bridge where the south path crosses the brook.
  let cross = land.lanes[0][0];
  for (const p of land.lanes[0]) if (land.toBrook(p[0], p[1]) < land.toBrook(cross[0], cross[1])) cross = p;
  {
    const [bx, bz] = cross,
      i = land.lanes[0].indexOf(cross),
      [nx, nz] = land.lanes[0][i + 1],
      yaw = Math.atan2(-(nz - bz), nx - bx),
      deck = Math.max(at(bx - 0.6, bz - 0.4), at(bx + 0.6, bz + 0.4), at(bx, bz)) + 0.08;
    m.frame(bx, deck, bz, yaw, 1, () => {
      m.box(0, 0, -0.13, 1.35, 0.08, 0.24, 0x8f9088);
      m.box(0.02, 0.006, 0.13, 1.3, 0.08, 0.25, 0x9a9a90);
      m.box(0, 0.042, -0.13, 1.25, 0.006, 0.2, 0xa3a39a);
      for (const side of [-1, 1]) {
        m.rock(side * 0.62, -0.3, -0.18, 0.18, 0.26, 0.17, 0x7b8077, 0x6f7d5f, 6);
        m.rock(side * 0.64, -0.3, 0.18, 0.17, 0.24, 0.18, 0x80857b, 0x6f7d5f, 6);
      }
    });
    for (let k = 0; k < 4; k++) tussock(m, bx + r.range(-0.8, 0.8), at(bx, bz) - 0.01, bz + r.range(-0.6, 0.6), 1.1);
  }

  // Damp hollows: a seep of standing water in dark moss, rushes round it.
  for (let k = 0, made = 0; k < 400 && made < 9; k++) {
    const x = r.range(-12, 11),
      z = r.range(-9, 11);
    if (!open(x, z, 0.5) || noise(x * 0.29 + 3, z * 0.29 + 7) > 0.36 || at(x, z) > 0.1) continue;
    made++;
    const y = at(x, z),
      w = r.range(0.22, 0.38),
      turn = r.range(0, circle),
      ring = [],
      rim = [];
    for (let j = 0; j < 9; j++) {
      const a = turn + (j * circle) / 9,
        q = r.range(0.8, 1.15),
        rx = x + Math.cos(a) * w * q,
        rz = z + Math.sin(a) * w * 0.7 * q,
        ox = x + Math.cos(a) * w * q * 1.7,
        oz = z + Math.sin(a) * w * 1.2 * q;
      ring.push([rx, Math.min(y, at(rx, rz)) + 0.012, rz]);
      rim.push([ox, at(ox, oz) + 0.008, oz]);
    }
    const water = m.rgb(0x40655a),
      sky = m.rgb(0x7d9f96),
      dark = m.rgb(0x2f4a37);
    for (let j = 0; j < 9; j++) {
      const q = (j + 1) % 9;
      m.face([[x, y + 0.012, z], ring[q], ring[j]], [sky, water, water]);
      m.face([ring[j], ring[q], rim[q], rim[j]], [dark, dark, m.rgb(0x40593c), m.rgb(0x40593c)]);
    }
    for (let j = 0; j < 4; j++) {
      const a = turn + j * 1.7,
        sx = x + Math.cos(a) * w * 1.25,
        sz = z + Math.sin(a) * w * 0.9;
      tuft(m, sx, at(sx, sz) - 0.01, sz, r.range(1.3, 1.8), [0x4f6f40, 0x5c7a45, 0x6c8148]);
    }
  }
  // Mossed rocks gripped by roots, and fallen boughs, out on the turf.
  for (let k = 0, made = 0; k < 600 && made < 16; k++) {
    const x = r.range(-12.5, 12),
      z = r.range(-10.5, 12);
    if (!open(x, z, 0.4) || land.gap(x, z) < 1.4) continue;
    made++;
    rootedRock(m, at, x, z, r.range(0.14, 0.26));
  }
  for (let k = 0, made = 0; k < 300 && made < 5; k++) {
    const x = r.range(-12, 11),
      z = r.range(-9.5, 11);
    if (!open(x, z, 0.7) || land.gap(x, z) < 1.6) continue;
    made++;
    fallenBough(m, at, x, z, r.range(0, circle), r.range(0.8, 1.3));
  }
  brookBanks(m, land, at);
  poolRim(m, land);
  outerShrubs(m, land, at, open);
  return open;
}

export { meadow, tussock, wildflowers, setStone, rootedRock };
