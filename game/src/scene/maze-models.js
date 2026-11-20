import { circle, midway } from './scenery-kit.js';
import { POLISH } from '../polish.js';
const timber = 0x644637,
  heart = 0x916246,
  lightWood = 0xb18a5c,
  gilt = 0xc39b61;
function steps(m, x, z, width, count, rise, depth, col) {
  for (let i = 0; i < count; i++)
    m.box(x, ((i + 1) * rise) / 2, z - i * depth, width, (i + 1) * rise, depth * 1.05, col);
}
function rail(m, x, z, width, y, height, col = timber) {
  const n = Math.ceil(width / 0.68);
  m.box(x, y + height, z, width + 0.1, 0.062, 0.067, col);
  m.box(x, y + height * 0.49, z, width, 0.047, 0.051, col);
  for (let i = 0; i <= n; i++) {
    const px = x - width / 2 + (width * i) / n;
    m.box(px, y + height / 2, z, 0.073, height, 0.083, col);
    m.lathe(
      px,
      y + height,
      z,
      [
        [0, 0.073],
        [0.035, 0.065],
        [0.065, 0.025]
      ],
      lightWood,
      6
    );
  }
}
function lantern(m, x, y, z, size = 1, col = 0xd86743) {
  m.frame(x, y, z, 0, size, () => {
    m.tube([0, 0.34, 0], [0, 0.22, 0], 0.014, 0.014, timber, 5);
    const paper = () =>
      m.lathe(
        0,
        0,
        0,
        [
          [-0.22, 0.101],
          [-0.18, 0.143],
          [-0.1, 0.188],
          [0.09, 0.19],
          [0.17, 0.151],
          [0.21, 0.103]
        ],
        col,
        12
      );
    // Lit stages treat the paper shade as a light source, so it glows.
    if (POLISH.lighting) m.glow(paper);
    else paper();
    for (let j = 0; j < 8; j++) {
      const a = (j * circle) / 8;
      m.line(
        [
          [-0.13 * Math.cos(a), -0.16, -0.13 * Math.sin(a)],
          [-0.19 * Math.cos(a), 0, -0.19 * Math.sin(a)],
          [-0.13 * Math.cos(a), 0.16, -0.13 * Math.sin(a)]
        ],
        0.007,
        0xaf8150,
        4
      );
    }
    m.lathe(
      0,
      0,
      0,
      [
        [-0.237, 0.105],
        [-0.21, 0.133]
      ],
      gilt,
      10
    );
    m.lathe(
      0,
      0,
      0,
      [
        [0.18, 0.12],
        [0.23, 0.111]
      ],
      gilt,
      10
    );
    m.tube([0, -0.23, 0], [0, -0.37, 0], 0.015, 0.025, 0xb14437, 6);
  });
}
function roof(m, width, depth, eave, rise, colors, snow = false) {
  const [dark, mid, hi] = colors,
    nx = Math.max(12, Math.round(width * 4)),
    rows = 5;
  function sample(u, t, side) {
    const x = u * (width * 0.5) * (1 - 0.34 * t),
      z = side * depth * 0.5 * (1 - t);
    return [
      x,
      eave +
        rise * (0.15 * t + 0.85 * t * t) +
        rise * 0.38 * Math.pow(Math.abs(u), 3.2) * (1 - t) * (1 - 0.6 * t),
      z
    ];
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < nx; i++) {
      const u0 = -1 + (2 * i) / nx,
        u1 = -1 + (2 * (i + 1)) / nx;
      for (let k = 0; k < rows; k++) {
        const low = k / rows,
          up = (k + 1) / rows;
        const p = [
          sample(u0, low, side),
          sample(u1, low, side),
          sample(u1, up, side),
          sample(u0, up, side)
        ];
        if (side < 0) p.reverse();
        const pat = snow
          ? m.mix(mid, hi, 0.4 + 0.34 * Math.sin((i + 1) * 2.1 + k))
          : m.mix(mid, hi, ((i + k * 2) % 7) * 0.068);
        m.face(p, pat);
        if (k === 0) {
          const a = sample(u0, 0, side),
            b = sample(u1, 0, side),
            c = b.slice(),
            d = a.slice();
          c[1] -= 0.095;
          d[1] -= 0.095;
          m.face([a, b, c, d], dark);
        }
      }
      const rib = Array.from({ length: rows + 1 }, (_, j) => {
        const v = sample(u0, j / rows, side);
        v[1] += 0.013;
        return v;
      });
      m.line(rib, snow ? 0.019 : 0.021, snow ? hi : m.mix(mid, hi, 0.64), 5);
    }
    for (let j = 1; j < rows; j++) {
      const points = Array.from({ length: 11 }, (_, i) => sample(-1 + i / 5, j / rows, side));
      m.line(points, 0.012, snow ? mid : dark, 4);
    }
  }
  for (const end of [-1, 1]) {
    const a = sample(end, 0, 1),
      b = sample(end, 0, -1),
      tip = sample(end, 1, 1);
    for (let i = 0; i < 8; i++) {
      const p = midway(a, b, i / 8),
        q = midway(a, b, (i + 1) / 8);
      p[1] -= 0.2 * Math.sin((i / 8) * Math.PI);
      q[1] -= 0.2 * Math.sin(((i + 1) / 8) * Math.PI);
      const arr = [p, q, tip];
      if (end < 0) arr.reverse();
      m.face(arr, i % 2 ? mid : dark);
      m.line([p, tip], 0.02, hi, 5);
    }
    for (const side of [-1, 1]) {
      const p = sample(end, 0, side),
        t = sample(end, 0.28, side);
      const tail = [p[0] + end * 0.13, p[1] + 0.14, p[2] + side * 0.08];
      m.line([t, p, tail], 0.044, dark, 6);
      if (snow)
        for (let j = 0; j < 5; j++) {
          const u = end * (1 - j * 0.15),
            pt = sample(u, 0, side);
          m.tube(pt, [pt[0], pt[1] - 0.14 - 0.13 * (j % 3), pt[2]], 0.023, 0.001, 0xb9dbe4, 5);
        }
    }
  }
  const l = sample(-1, 1, 1),
    r = sample(1, 1, 1);
  m.tube(l, r, 0.052, 0.052, hi, 7);
  for (const end of [-1, 1]) {
    const p = sample(end, 1, 1);
    m.line(
      [p, [p[0] + end * 0.1, p[1] + 0.046, 0], [p[0] + end * 0.14, p[1] + 0.16, -0.012]],
      0.039,
      gilt,
      6
    );
  }
}
function lattice(m, x, y, z, w, h, col) {
  m.box(x, y, z, w, h, 0.035, 0x373c38);
  for (const k of [-1, 1]) {
    m.box(x + k * w * 0.5, y, z + 0.034, 0.045, h + 0.05, 0.063, col);
    m.box(x, y + k * h * 0.5, z + 0.034, w, 0.048, 0.063, col);
  }
  for (let j = 1; j < 5; j++) m.box(x - w * 0.5 + (j * w) / 5, y, z + 0.039, 0.025, h, 0.039, col);
  for (let j = 1; j < 4; j++) m.box(x, y - h * 0.5 + (j * h) / 4, z + 0.043, w, 0.025, 0.042, col);
}
function hall(m, w = 4, d = 2.1, two = false, options = {}) {
  const post = options.post || 0x8e4d37,
    plaster = options.plaster || 0xb9a384;
  const tile = options.tile || [0x43575a, 0x657474, 0x84918b],
    snow = options.snow;
  const y = 0.37,
    baseH = two ? 1.52 : 1.33;
  m.box(0, 0.13, 0, w + 0.24, 0.26, d + 0.28, 0x827c6e);
  m.box(0, 0.29, 0, w + 0.16, 0.1, d + 0.18, 0xa49c86);
  m.box(0, y + baseH * 0.49, -0.12, w * 0.92, baseH * 0.99, d * 0.8, plaster);
  const front = d * 0.39,
    door = w * 0.26;
  m.box(0, y + baseH * 0.47, front + 0.017, door, baseH * 0.92, 0.046, timber);
  m.box(0, y + baseH * 0.49, front + 0.051, 0.025, baseH * 0.9, 0.045, lightWood);
  for (const side of [-1, 1]) {
    lattice(m, side * w * 0.31, y + baseH * 0.56, front + 0.033, w * 0.26, baseH * 0.54, heart);
    m.box(side * w * 0.49, y + baseH * 0.52, -d * 0.44, 0.113, baseH * 1.06, 0.12, post);
  }
  for (const u of [-0.49, -0.21, 0.21, 0.49]) {
    m.box(u * w, y + baseH * 0.53, d * 0.49, 0.104, baseH * 1.07, 0.124, post);
    m.box(u * w, y + 0.08, d * 0.49, 0.154, 0.16, 0.158, 0x938e79);
    for (const side of [-1, 1])
      m.tube(
        [u * w, y + baseH - 0.2, d * 0.49],
        [u * w + side * 0.2, y + baseH + 0.01, d * 0.49],
        0.034,
        0.041,
        heart,
        5
      );
  }
  m.box(0, y + baseH, d * 0.49, w + 0.15, 0.133, 0.155, post);
  if (two) {
    m.box(0, y + baseH + 0.1, 0, w * 1.08, 0.17, d * 1.14, heart);
    rail(m, 0, d * 0.58, w * 0.98, y + baseH + 0.17, 0.34, post);
    m.box(0, y + baseH + 0.82, -0.11, w * 0.9, 1.35, d * 0.77, plaster);
    for (const u of [-0.32, 0, 0.32])
      lattice(m, u * w, y + baseH + 0.84, d * 0.35, w * 0.22, 0.63, heart);
    for (const u of [-0.48, -0.17, 0.17, 0.48])
      m.box(u * w, y + baseH + 0.82, d * 0.48, 0.115, 1.35, 0.115, post);
    m.frame(0, y + baseH + 0.03, d * 0.48, 0, 1, () =>
      roof(m, w * 1.14, 0.78, 0.08, 0.25, tile, snow)
    );
  }
  const high = y + baseH + (two ? 1.52 : 0.09);
  m.box(0, high - 0.05, 0, w * 1.02, 0.14, d * 1.04, heart);
  roof(m, w * 1.17, d * 1.38, high, 0.31 * w, tile, snow);
  for (const side of [-1, 1])
    lantern(m, side * w * 0.42, high - 0.37, d * 0.55, 0.72, options.lantern || 0xcd6545);
}
function foliage(m, x, y, z, rx, ry, rz, base, light, n = 11) {
  const rng = m.rng,
    phase = rng.range(0, circle);
  const edge = Array.from({ length: n }, (_, i) => [
    phase + ((i + rng.range(-0.13, 0.13)) * circle) / n,
    rng.range(0.77, 1.12)
  ]);
  let last;
  for (const [off, scale] of [
    [-0.5, 0.58],
    [-0.13, 0.96],
    [0.27, 1],
    [0.66, 0.49]
  ]) {
    const ring = edge.map(([a, k]) => [
      x + rx * Math.cos(a) * k * scale,
      y + ry * (off + 0.12 * Math.sin(a * 3 + off)),
      z + rz * Math.sin(a) * k * scale
    ]);
    if (last)
      for (let j = 0; j < n; j++) {
        const q = (j + 1) % n,
          mid = m.mix(base, light, off * 0.56 + 0.2 + rng.next() * 0.14);
        m.face([last[j], ring[j], ring[q], last[q]], [m.rgb(base), mid, mid, m.rgb(base)]);
      }
    last = ring;
  }
  for (let j = 0; j < n; j++) m.face([[x, y + ry * 0.87, z], last[(j + 1) % n], last[j]], light);
}
const canopy = {
  maple: [0x83382a, 0xb54a2b, 0xd16a32, 0xe49344, 0x9d3b2a],
  peach: [0x984f67, 0xca8292, 0xe7a3ac, 0xf4c6c3, 0xd7899b],
  pine: [0x3e5c4f, 0x596e50, 0x748357, 0x869666, 0x4a6853],
  snow: [0x587174, 0x77918f, 0xc4d2cd, 0xe4e8db, 0x66817c],
  moon: [0x44556c, 0x617486, 0x98a6a2, 0xc1c2ac, 0x627888]
};
function tree(m, type = 'maple', size = 1, rotation = 0) {
  m.frame(0, 0, 0, rotation, size, () => {
    const rng = m.rng,
      P = canopy[type],
      conifer = type === 'pine' || type === 'snow',
      wood = type === 'peach' ? 0x69534c : 0x594d40;
    const trunk = [
      [0, -0.05, 0],
      [-0.08, 0.44, 0.04],
      [0.09, 0.97, 0.05],
      [0.02, 1.43, -0.12],
      [0.17, 1.98, -0.05],
      [0.12, 2.43, 0.07],
      [0.27, 2.78, 0]
    ];
    const radii = [0.169, 0.14, 0.112, 0.085, 0.063, 0.04, 0.009];
    for (let j = 0; j < trunk.length - 1; j++)
      m.tube(trunk[j], trunk[j + 1], radii[j], radii[j + 1], wood, 8);
    for (let j = 0; j < 5; j++) {
      const a = (circle * j) / 5;
      m.tube([0, 0.12, 0], [Math.cos(a) * 0.42, -0.03, Math.sin(a) * 0.34], 0.066, 0.013, wood, 6);
    }
    const pads = [];
    for (let j = 0; j < 10; j++) {
      const a = j * 2.34 + rng.range(-0.33, 0.33),
        h = 1.02 + j * 0.156,
        len = (1.33 - j * 0.071) * rng.range(0.85, 1.12);
      const a0 = [0.05, h - 0.24, -0.02],
        el = [Math.cos(a - 0.21) * len * 0.58, h + len * 0.23, Math.sin(a - 0.21) * len * 0.58],
        tip = [Math.cos(a) * len, h + len * 0.49, Math.sin(a) * len];
      m.tube(a0, el, 0.075 - j * 0.003, 0.036, wood, 7);
      m.tube(el, tip, 0.036, 0.009, wood, 6);
      for (let k = 0; k < 3; k++) {
        const a2 = a + (k - 1) * 0.94,
          reach = 0.27 + rng.next() * 0.24,
          b = midway(el, tip, 0.28 + 0.26 * k);
        const leaf = [
          b[0] + Math.cos(a2) * reach,
          b[1] + rng.range(0.12, 0.39),
          b[2] + Math.sin(a2) * reach
        ];
        m.tube(b, leaf, 0.023, 0.006, wood, 5);
        pads.push(leaf);
      }
    }
    pads.push([0.2, 2.82, 0.06]);
    for (const [x, y, z] of pads) {
      const k = rng.range(0.32, 0.59),
        bright = P[rng.next() < 0.46 ? 3 : 2],
        shade = P[rng.next() < 0.45 ? 0 : 1];
      foliage(
        m,
        x,
        y,
        z,
        k,
        conifer ? k * 0.42 : k * 0.69,
        k * rng.range(0.69, 1.09),
        shade,
        bright,
        conifer ? 9 : 11
      );
      for (let j = 0; j < (conifer ? 6 : 13); j++) {
        const a = rng.range(0, circle),
          r = Math.sqrt(rng.next()),
          p = [
            x + Math.cos(a) * k * r,
            y + k * (0.4 - 0.3 * r * r) + rng.range(0, 0.08),
            z + Math.sin(a) * k * r * 0.89
          ];
        if (type === 'peach') {
          const rad = rng.range(0.048, 0.091);
          for (let t = 0; t < 4; t++) {
            const a2 = (t * circle) / 4 + a;
            m.leaf(
              p,
              [p[0] + Math.cos(a2) * rad, p[1] + rad * 0.25, p[2] + Math.sin(a2) * rad],
              rad * 0.42,
              rng.pick(P.slice(1, 4)),
              bright,
              0.009
            );
          }
        } else {
          const len = rng.range(0.11, 0.19);
          m.leaf(
            p,
            [p[0] + Math.cos(a) * len, p[1] - len * 0.21, p[2] + Math.sin(a) * len],
            len * (conifer ? 0.13 : 0.4),
            rng.pick(P),
            bright,
            len * 0.07
          );
        }
      }
    }
  });
}
function reeds(m, x, z, h = 0.57, n = 12, white = false, y = 0.05) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n + r.range(-0.25, 0.25),
      d = r.range(0.013, 0.21),
      sx = x + Math.cos(a) * d,
      sz = z + Math.sin(a) * d,
      l = h * r.range(0.53, 1.13),
      lean = l * r.range(0.24, 0.64);
    const origin = [sx, y, sz],
      tip = [sx + Math.cos(a) * lean, y + l, sz + Math.sin(a) * lean];
    m.leaf(origin, tip, l * 0.039, r.pick([0x78845a, 0x898c58, 0x73835a]), 0xa3a46e, l * 0.1);
    if (white && i % 4 === 0) {
      const e = [
        tip[0] + Math.cos(a) * l * 0.11,
        tip[1] + l * 0.18,
        tip[2] + Math.sin(a) * l * 0.11
      ];
      m.tube(tip, e, l * 0.026, l * 0.006, 0xded1a6, 6);
    }
  }
}
function cargo(m, x, z, s = 0.63, col = 0x926e51) {
  const h = s * 0.75;
  m.box(x, h / 2 + 0.055, z, s, h, s * 0.77, col);
  for (const k of [-1, 1]) {
    m.box(x + s * 0.32 * k, h / 2 + 0.055, z, 0.037, h + 0.026, s * 0.8, 0x725b45);
    m.box(x, h * k * 0.32 + h * 0.5 + 0.055, z, s * 1.018, 0.043, s * 0.79, 0xb18a63);
  }
  m.tube(
    [x - s * 0.38, 0.12, z + s * 0.4],
    [x + s * 0.38, h + 0.015, z + s * 0.4],
    0.024,
    0.024,
    0xb59a6e,
    4
  );
}
function banners(m, x, z, h, col) {
  m.tube([x, 0, z], [x, h, z], 0.057, 0.037, 0x655649, 7);
  m.tube([x - 0.75, h - 0.09, z], [x + 0.12, h - 0.09, z], 0.035, 0.035, gilt, 6);
  const top = [],
    bottom = [];
  for (let j = 0; j <= 6; j++) {
    const a = j / 6,
      dx = x - 0.07 - a * 0.65,
      sag = Math.sin(a * 3.8) * 0.13;
    top.push([dx, h - 0.14 - 0.06 * Math.sin(Math.PI * a), z + sag]);
    bottom.push([dx + 0.058, h - 0.89 - (j % 3) * 0.13, z + sag + 0.1 * Math.sin(a * 5.3)]);
  }
  for (let i = 0; i < 6; i++) {
    m.face([top[i], top[i + 1], bottom[i + 1], bottom[i]], i % 3 ? col : m.mix(col, gilt, 0.17));
  }
  m.line(top, 0.015, gilt, 4);
}

export { steps, rail, lantern, roof, hall, tree, reeds, cargo, banners };
