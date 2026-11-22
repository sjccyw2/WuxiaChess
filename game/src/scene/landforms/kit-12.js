// 鐵掌溪灘's own palette, noise and the shapes its scenery is built from: water-worn
// boulders, standing stones, jointed crags, mountain pines and the gang's black banners.

const TAU = Math.PI * 2;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
// Rises fast from zero and levels off: the profile of a bank leaving the water.
const rise = (v) => {
  const t = clamp(v);
  return t * (2 - t);
};
const lerp = (a, b, t) => a + (b - a) * t;

const stone = { dark: 0x45484a, mid: 0x5f6061, warm: 0x6b655e, pale: 0x918f86, rust: 0x76604f },
  wetStone = 0x30393b,
  pebble = [0x8a8780, 0xaaa596],
  turf = [0x5c6650, 0x74795a],
  earth = 0x7b7566,
  moss = 0x6c7a52,
  river = { water: 0x4f8791, dark: 0x53787c, foam: 0xe6eeea, spray: 0xbcd6d6 },
  needles = [0x33503f, 0x3f5d47, 0x4a684c],
  needleEdge = 0x5d7a55,
  needleLight = 0x7c9263,
  scrubLeaf = [0x4a5a40, 0x596845, 0x68714b],
  bark = 0x4b3b31,
  barkLight = 0x6a5646,
  cloth = 0x202328,
  clothEdge = 0x33373d,
  palmWhite = 0xd9d3c1,
  timber = 0x6b4d36,
  rope = 0xc9b88c;

// Value noise for the relief and its colour patches; the same map every time.
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz),
    b = hash(ix + 1, iz),
    c = hash(ix, iz + 1),
    d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) {
  return (
    0.55 * noise(x, z) +
    0.3 * noise(x * 2.1 + 5.2, z * 2.1 - 1.7) +
    0.15 * noise(x * 4.3 - 3.1, z * 4.3 + 7.9)
  );
}

// A water-worn boulder: a dark wet foot, grey flanks and a pale rounded crown.
function boulder(m, x, y, z, rx, h, rz, { wet = 0.2, green = 0, n = 8, turn = 0 } = {}) {
  const r = m.rng,
    spokes = Array.from({ length: n }, (_, i) => [
      turn + (i / n) * TAU + r.range(-0.14, 0.14),
      r.range(0.86, 1.12)
    ]);
  const body = m.mix(stone.mid, stone.warm, r.next()),
    crown = m.mix(m.mix(stone.pale, body, 0.25), moss, green),
    foot = m.mix(body, wetStone, wet > 0.1 ? 0.8 : 0.3);
  const levels = [
    [0, 0.82],
    [0.17, 1],
    [0.5, 0.96],
    [0.8, 0.72],
    [0.95, 0.4]
  ];
  const tones = levels.map(([k]) => (k <= wet ? foot : k > 0.7 ? crown : body));
  let last;
  for (let j = 0; j < levels.length; j++) {
    const [k, wide] = levels[j];
    const ring = spokes.map(([a, q], i) => [
      x + Math.cos(a) * rx * q * wide,
      y + h * (k + (j && j < 4 ? 0.05 * Math.sin(i * 2.3 + j) : 0)),
      z + Math.sin(a) * rz * q * wide
    ]);
    if (last)
      for (let i = 0; i < n; i++) {
        const q = (i + 1) % n;
        m.face(
          [last[i], ring[i], ring[q], last[q]],
          [tones[j - 1], tones[j], tones[j], tones[j - 1]],
          0.92 + 0.08 * Math.abs(Math.cos(i * 1.7))
        );
      }
    last = ring;
  }
  for (let i = 0; i < n; i++) m.face([[x, y + h, z], last[(i + 1) % n], last[i]], crown);
}

// A standing stone with straight sides and a flat, bevelled top.
function column(m, x, y, z, rad, h, n, foot, body, top) {
  const r = m.rng,
    turn = r.range(0, TAU),
    low = [],
    high = [],
    cap = [];
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * TAU + r.range(-0.12, 0.12),
      k = r.range(0.9, 1.08);
    const u = Math.cos(a) * rad * k,
      v = Math.sin(a) * rad * k;
    low.push([x + u * 1.08, y, z + v * 1.08]);
    high.push([x + u, y + h - Math.min(0.04, h * 0.1), z + v]);
    cap.push([x + u * 0.84, y + h, z + v * 0.84]);
  }
  const bevel = m.mix(body, top, 0.6);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face(
      [low[i], high[i], high[j], low[j]],
      [foot, body, body, foot],
      0.9 + (0.1 * ((i * 5) % 3)) / 2
    );
    m.face([high[i], cap[i], cap[j], high[j]], bevel);
  }
  m.face([...cap].reverse(), top);
}

// A crag of jointed iron-grey rock: stacked blocks that narrow upward, pale on their ledges.
function crag(m, x, z, bottom, top, rx, rz) {
  const r = m.rng,
    tints = [stone.dark, stone.mid, stone.warm, 0x525456];
  let y = bottom,
    k = 0;
  while (y < top - 0.05) {
    const h = Math.min(top - y, r.range(0.5, 0.95)),
      t = (y - bottom) / Math.max(0.01, top - bottom),
      s = 1.1 - 0.3 * t,
      n = 5,
      turn = r.range(0, TAU),
      ox = x + r.range(-0.08, 0.08) * rx,
      oz = z + r.range(-0.08, 0.08) * rz;
    const low = [],
      high = [],
      cap = [];
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * TAU + r.range(-0.2, 0.2),
        q = r.range(0.85, 1.1);
      const u = Math.cos(a) * rx * s * q,
        v = Math.sin(a) * rz * s * q;
      low.push([ox + u, y, oz + v]);
      high.push([ox + u * 0.96, y + h * r.range(0.9, 1.03), oz + v * 0.96]);
      cap.push([ox + u * 0.8, y + h + 0.05, oz + v * 0.8]);
    }
    const body = m.mix(tints[k % 4], stone.rust, r.next() < 0.3 ? 0.35 : 0),
      last = y + h >= top - 0.05,
      ledge = m.mix(stone.pale, moss, last ? 0.45 : 0.15);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.face([low[i], high[i], high[j], low[j]], body, 0.88 + (0.12 * ((i * 7) % 3)) / 2);
      m.face([high[i], cap[i], cap[j], high[j]], m.mix(body, ledge, 0.6));
    }
    m.face([...cap].reverse(), ledge);
    y += h;
    k++;
  }
}

// A flag of flat stone set into the ground: an irregular rounded top, a bevel and a short
// flank that sinks into the earth; worn pale in the middle where feet fall.
function flagstone(m, x, y, z, w, d, yaw, tint = stone.mid) {
  const r = m.rng,
    n = 9,
    turn = r.range(0, TAU);
  const pts = Array.from({ length: n }, (_, i) => {
    const a = turn + (i / n) * TAU + r.range(-0.15, 0.15),
      k = r.range(0.82, 1.08);
    return [Math.cos(a) * w * k, Math.sin(a) * d * k];
  });
  const top = m.mix(tint, pebble[1], r.range(0.35, 0.65)),
    worn = m.mix(top, 0xc8c0aa, 0.35),
    side = m.mix(tint, stone.dark, 0.4);
  m.frame(x, y, z, yaw, 1, () => {
    const centre = [0, 0.035, 0],
      edge = pts.map(([u, v]) => [u * 0.86, 0.035, v * 0.86]),
      lip = pts.map(([u, v]) => [u, 0.018, v]),
      foot = pts.map(([u, v]) => [u * 1.04, -0.05, v * 1.04]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.face([centre, edge[j], edge[i]], [worn, top, top]);
      m.face([edge[i], edge[j], lip[j], lip[i]], [top, top, side, side]);
      m.face([lip[i], lip[j], foot[j], foot[i]], side, 0.85);
    }
  });
}

// One pad of pine needles: dark underneath, lighter toward its crown; `shade` darkens or
// lightens the whole pad (low in the tree, or in its own shadow).
function pad(
  m,
  x,
  y,
  z,
  rad,
  rich,
  tones = needles,
  edge = needleEdge,
  light = needleLight,
  n = 6,
  shade = 1
) {
  const r = m.rng,
    tint = m.rgb(r.pick(tones)).map((c) => c * shade),
    rim = [],
    inner = [];
  const turn = r.range(0, TAU),
    squash = r.range(0.75, 1);
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * TAU + r.range(-0.18, 0.18),
      k = r.range(0.82, 1.14);
    const u = Math.cos(a) * rad * k,
      v = Math.sin(a) * rad * k * squash;
    rim.push([x + u, y - 0.12 * rad * r.range(0.5, 1.3), z + v]);
    inner.push([x + u * 0.55, y + 0.17 * rad, z + v * 0.55]);
  }
  const crown = [x, y + 0.3 * rad, z],
    low = [x, y - 0.3 * rad, z],
    rimTone = m.rgb(edge).map((c) => c * shade),
    top = m.mix(edge, light, 0.7).map((c) => Math.min(1, c * shade));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([low, rim[i], rim[j]], tint, 0.8);
    if (rich) {
      m.face([rim[j], rim[i], inner[i], inner[j]], [tint, tint, rimTone, rimTone]);
      m.face([inner[j], inner[i], crown], [rimTone, rimTone, top]);
    } else m.face([rim[j], rim[i], crown], [tint, tint, rimTone]);
  }
}

// A crooked mountain pine of height h. Its trunk flares into roots that grip the ground; each
// bough kinks out from the trunk and carries a spray of needle pads, the largest at its tip
// and smaller ones along it, darker low in the tree and lighter toward the crown. A plain
// pine (rich false) is the same tree with fewer sides and pads, for slopes far off.
function pine(m, x, y, z, h, { lean = 0.5, yaw = 0, boughs = 7, rich = true, spread = 1 } = {}) {
  const r = m.rng,
    sides = rich ? 7 : 5;
  m.frame(x, y, z, yaw, h, () => {
    const trunk = [
      [0, -0.12, 0],
      [0.03 * lean, 0.28, 0.02],
      [0.17 * lean, 0.55, -0.03],
      [0.1 * lean, 0.8, 0.02],
      [0.16 * lean, 1, 0]
    ];
    const girth = [0.062, 0.05, 0.038, 0.026, 0.012],
      grey = m.mix(bark, 0x77706a, 0.35);
    for (let j = 0; j < 4; j++)
      m.tube(
        trunk[j],
        trunk[j + 1],
        girth[j],
        girth[j + 1],
        j ? (j % 2 ? bark : barkLight) : grey,
        sides
      );
    // Roots spread over the ground and into it.
    for (let k = 0; k < (rich ? 4 : 3); k++) {
      const a = (k / (rich ? 4 : 3)) * TAU + r.range(-0.4, 0.4),
        reach = r.range(0.1, 0.16);
      m.tube(
        [Math.cos(a) * 0.02, 0.06, Math.sin(a) * 0.02],
        [Math.cos(a) * reach, -0.025, Math.sin(a) * reach],
        0.032,
        0.008,
        grey,
        4
      );
    }
    for (let j = 0; j < boughs; j++) {
      const t = j / Math.max(1, boughs - 1),
        a = j * 2.4 + r.range(-0.3, 0.3),
        k = 1.1 + t * 2.5,
        i = Math.min(3, Math.floor(k)),
        f = k - i;
      const from = trunk[i].map((v, n) => lerp(v, trunk[i + 1][n], f)),
        len = (0.38 - 0.2 * t) * r.range(0.85, 1.15),
        bend = a + r.range(-0.35, 0.35);
      // The bough droops from the trunk, then turns up toward the light.
      const elbow = [
        from[0] + Math.cos(a) * len * 0.5,
        from[1] - 0.025 + 0.01 * t,
        from[2] + Math.sin(a) * len * 0.5
      ];
      const tip = [
        elbow[0] + Math.cos(bend) * len * 0.5,
        from[1] + 0.05,
        elbow[2] + Math.sin(bend) * len * 0.5
      ];
      m.tube(from, elbow, 0.021 - 0.008 * t, 0.012 - 0.004 * t, bark, rich ? 4 : 3);
      m.tube(elbow, tip, 0.012 - 0.004 * t, 0.006, bark, 3);
      const size = (0.17 - 0.065 * t) * r.range(0.85, 1.15) * spread,
        dark = 0.82 + 0.2 * t;
      pad(
        m,
        tip[0],
        tip[1] + 0.03,
        tip[2],
        size,
        true,
        needles,
        needleEdge,
        needleLight,
        sides,
        dark
      );
      // Lesser pads along the bough, to either side of it.
      const along = rich && j % 2 ? 2 : 1;
      for (let q = 0; q < along; q++) {
        const s = q % 2 ? 1 : -1,
          w = 0.45 + 0.3 * q;
        pad(
          m,
          lerp(from[0], tip[0], w) + Math.sin(bend) * size * 0.55 * s,
          lerp(from[1], tip[1], w) + 0.03,
          lerp(from[2], tip[2], w) - Math.cos(bend) * size * 0.55 * s,
          size * r.range(0.6, 0.75),
          rich,
          needles,
          needleEdge,
          needleLight,
          6,
          dark * 0.94
        );
      }
      // On a rich tree a twig runs on past the tip with a small pad of its own.
      if (rich && j % 2 === 0) {
        const end = [
          tip[0] + Math.cos(bend) * size * 0.8,
          tip[1] + 0.05,
          tip[2] + Math.sin(bend) * size * 0.8
        ];
        m.tube(tip, end, 0.006, 0.003, bark, 3);
        pad(
          m,
          end[0],
          end[1] + 0.02,
          end[2],
          size * 0.55,
          true,
          needles,
          needleEdge,
          needleLight,
          6,
          dark * 1.05
        );
      }
    }
    // The crown: a small pad on the leader and two beside it.
    pad(
      m,
      trunk[4][0],
      1.02,
      trunk[4][2],
      0.12 * spread,
      true,
      needles,
      needleEdge,
      needleLight,
      sides,
      1.08
    );
    if (rich)
      for (const s of [-1, 1])
        pad(
          m,
          trunk[4][0] + s * 0.07 * spread,
          0.95,
          trunk[4][2] - s * 0.04 * spread,
          0.09 * spread,
          true,
          needles,
          needleEdge,
          needleLight,
          6,
          1.04
        );
  });
}

// Low scrub: a few olive cushions on short twigs.
function scrub(m, x, y, z, s) {
  const r = m.rng;
  for (let i = 0; i < 3; i++) {
    const a = r.range(0, TAU),
      d = i ? s * r.range(0.3, 0.6) : 0,
      top = [x + Math.cos(a) * d, y + s * r.range(0.4, 0.75), z + Math.sin(a) * d];
    m.tube([x, y - 0.03, z], top, 0.02 * s, 0.01 * s, bark, 4);
    pad(m, top[0], top[1], top[2], s * r.range(0.4, 0.6), false, scrubLeaf, 0x66734c, 0x8c9063);
  }
}

// A tuft of dry grass.
function tuft(m, x, y, z, s) {
  const r = m.rng;
  for (let i = 0; i < 4; i++) {
    const a = r.range(0, TAU),
      l = s * r.range(0.6, 1.1);
    m.leaf(
      [x, y, z],
      [x + Math.cos(a) * l * 0.5, y + l, z + Math.sin(a) * l * 0.5],
      l * 0.07,
      r.pick([0x7d8556, 0x8f8f60, 0x6f7c50]),
      0xa3a06c,
      l * 0.12
    );
  }
}

// The open palm of 鐵掌幫, drawn on an upright plane facing south or north.
function palm(m, x, y, z, s, col) {
  const part = (points) =>
    m.face(
      points.map(([u, v]) => [x + u * s, y + v * s, z]),
      col
    );
  part([
    [-0.25, -0.42],
    [0.25, -0.42],
    [0.29, -0.2],
    [0.27, 0],
    [-0.27, 0],
    [-0.29, -0.2]
  ]);
  for (const [u, len, splay] of [
    [-0.2, 0.36, -0.1],
    [-0.068, 0.45, -0.03],
    [0.068, 0.42, 0.03],
    [0.2, 0.3, 0.12]
  ])
    part([
      [u - 0.054, -0.02],
      [u + 0.054, -0.02],
      [u + splay * len + 0.045, len],
      [u + splay * len - 0.045, len]
    ]);
  part([
    [-0.27, -0.32],
    [-0.27, -0.13],
    [-0.52, 0.07],
    [-0.59, -0.02]
  ]);
}

// A black banner hanging from a yard at height top, its foot cut to a swallowtail, with the
// pale palm on both faces.
function blackBanner(m, x, top, z, w, len, mark) {
  const rows = 6,
    grid = [];
  for (let j = 0; j <= rows; j++) {
    const v = j / rows,
      sway = v > 0.6 ? 0.09 * Math.sin((v - 0.6) * 5) : 0;
    grid.push(
      [-1, 0, 1].map((k) => [
        x + (k * w) / 2,
        top - len * (v - (j === rows && !k ? 0.13 : 0)),
        z + sway + (k ? 0 : 0.01 * v)
      ])
    );
  }
  for (let j = 0; j < rows; j++)
    for (let k = 0; k < 2; k++)
      m.face(
        [grid[j][k], grid[j][k + 1], grid[j + 1][k + 1], grid[j + 1][k]],
        (j + k) % 2 ? cloth : m.mix(cloth, clothEdge, 0.5)
      );
  m.box(x, top - 0.02, z, w + 0.02, 0.05, 0.03, clothEdge);
  for (const side of [0.016, -0.012])
    palm(m, x + 0.04 * mark, top - len * 0.36, z + side, mark, palmWhite);
}

export {
  TAU,
  flagstone,
  clamp,
  smooth,
  rise,
  lerp,
  stone,
  wetStone,
  pebble,
  turf,
  earth,
  moss,
  river,
  needles,
  needleEdge,
  needleLight,
  scrubLeaf,
  bark,
  barkLight,
  cloth,
  clothEdge,
  palmWhite,
  timber,
  rope,
  hash,
  noise,
  fbm,
  boulder,
  column,
  crag,
  pad,
  pine,
  scrub,
  tuft,
  palm,
  blackBanner
};
