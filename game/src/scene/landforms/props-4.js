import { circle } from '../scenery-kit.js';

// The furniture of the qin terrace that stands on the playable tiles: echo
// screens (rock), low stone seats (cover), mountain bamboo (bamboo) and
// plantain lilies (herbs). Each stays inside its own tile and keeps the tile
// centre clear, so a fighter still stands on open stone.

// A carved stone screen on a plinth with drum-stone feet. The face is framed,
// with a recessed panel and a round "moon" relief on both sides.
function echoScreen(m, width) {
  const half = width / 2,
    stone = 0x6c7468,
    panel = 0x87907f,
    cap = 0x5d655b;
  m.box(0, 0.085, 0, width + 0.06, 0.07, 0.36, 0x7c8374);
  m.box(0, 0.145, 0, width - 0.04, 0.05, 0.27, 0x737a6c);
  for (const s of [-1, 1]) {
    // Drum stones brace the slab where it meets the plinth.
    m.frame(s * (half - 0.13), 0.29, 0, Math.PI / 2, 1, () => {
      for (const e of [-0.075, 0.075]) m.tube([0, 0, 0], [e, 0, 0], 0.115, 0.115, 0x7b8274, 10);
      for (const e of [-0.077, 0.077]) m.hoop(e, 0, 0, 0.07, 0.008, 0x666d60, 10, 'yz');
    });
    m.box(s * (half - 0.13), 0.2, 0, 0.16, 0.08, 0.3, 0x747b6d);
  }
  m.box(0, 0.53, 0, width, 0.74, 0.13, stone);
  for (const side of [-1, 1]) {
    const z = side * 0.068;
    // Raised frame around a sunken panel.
    m.face(
      [
        [-half + 0.08, 0.24, z],
        [-half + 0.08, 0.82, z],
        [half - 0.08, 0.82, z],
        [half - 0.08, 0.24, z]
      ].map(([x, y]) => [x, y, z]),
      panel
    );
    m.hoop(0, 0.55, side * 0.072, 0.17, 0.014, 0x5d6558, 18, 'xy');
    m.hoop(0, 0.55, side * 0.072, 0.075, 0.01, 0x5d6558, 12, 'xy');
    for (const x of [-half + 0.08, half - 0.08])
      m.box(x, 0.53, side * 0.07, 0.035, 0.6, 0.012, 0x737b6e);
    // Weather stain running down from the cap.
    m.face(
      [
        [half * 0.25, 0.89, z * 1.06],
        [half * 0.31, 0.6, z * 1.06],
        [half * 0.4, 0.45, z * 1.06],
        [half * 0.46, 0.89, z * 1.06]
      ],
      0x5f6a5c
    );
  }
  m.box(0, 0.925, 0, width + 0.08, 0.05, 0.2, cap);
  m.box(0, 0.965, 0, width - 0.14, 0.04, 0.11, 0x6a7265);
  // Moss gathers where the slab meets the plinth.
  for (const side of [-1, 1])
    for (let k = 0; k < 3; k++) {
      const x = m.rng.range(-half + 0.1, half - 0.1),
        w = m.rng.range(0.06, 0.13);
      m.face(
        [
          [x - w, 0.172, side * 0.135],
          [x - w * 0.6, 0.172, side * 0.18],
          [x + w * 0.7, 0.172, side * 0.17],
          [x + w, 0.172, side * 0.136]
        ],
        m.rng.pick([0x5c7448, 0x667c4c, 0x54683f])
      );
    }
}

// A long stone bench on two legs and a drum stool beside it, set at the back
// of the tile like the low walls of the other courts.
function stoneSeats(m, salt) {
  const r = m.rng,
    tone = m.mix(0x8b9281, 0xa7a690, r.range(0, 0.7));
  const bx = salt % 2 ? -0.1 : 0.08,
    sx = salt % 2 ? 0.3 : -0.3;
  m.frame(bx, 0, -0.3, r.range(-0.08, 0.08), 1, () => {
    for (const x of [-0.21, 0.21]) {
      m.box(x, 0.19, 0, 0.09, 0.28, 0.2, 0x767d6f);
      m.box(x, 0.06, 0, 0.13, 0.03, 0.23, 0x6e7468);
    }
    m.box(0, 0.355, 0, 0.64, 0.06, 0.26, tone);
    m.box(0, 0.32, 0.123, 0.6, 0.018, 0.012, m.mix(tone, 0x5f665b, 0.4));
  });
  m.frame(sx, 0.05, -0.22, r.range(0, circle), 1, () => {
    m.lathe(
      0,
      0,
      0,
      [
        [0, 0.1],
        [0.03, 0.115],
        [0.15, 0.13],
        [0.27, 0.115],
        [0.3, 0.1],
        [0.305, 0.0]
      ],
      tone,
      10
    );
    for (const y of [0.03, 0.27]) m.hoop(0, y, 0, 0.118, 0.01, 0x707769, 10);
  });
  // A little moss on the north foot of the bench.
  m.face(
    [
      [bx - 0.3, 0.051, -0.44],
      [bx - 0.16, 0.051, -0.47],
      [bx + 0.05, 0.051, -0.45],
      [bx - 0.05, 0.051, -0.41]
    ],
    0x637a4b
  );
}

// A clump of mountain bamboo: thin jointed culms rising from the back of the
// tile, each crowned with drooping sprays of narrow leaves.
function mountainBamboo(m, salt) {
  const r = m.rng;
  const count = 6 + (salt % 3);
  for (let j = 0; j < count; j++) {
    const x = r.range(-0.36, 0.36),
      z = r.range(-0.42, -0.16),
      h = r.range(0.66, 1.12),
      lean = [r.range(-0.07, 0.07), 0, r.range(-0.1, 0.02)];
    const nodes = 5,
      culm = m.mix(0x7f9757, 0xa2a76a, r.next());
    let prev = [x, 0.045, z];
    for (let k = 1; k <= nodes; k++) {
      const t = k / nodes,
        p = [x + lean[0] * t * t * 2, 0.045 + h * t, z + lean[2] * t * t * 2];
      m.tube(
        prev,
        p,
        0.021 - 0.004 * t,
        0.019 - 0.004 * t,
        k % 2 ? culm : m.mix(culm, 0x6a7a48, 0.3),
        5
      );
      if (k < nodes) m.hoop(p[0], p[1], p[2], 0.022, 0.006, 0xb6b07c, 5);
      if (k >= 3) {
        const a0 = r.range(0, circle);
        for (let l = 0; l < 4; l++) {
          const a = a0 + (l * circle) / 4 + r.range(-0.3, 0.3),
            len = r.range(0.14, 0.22);
          m.leaf(
            p,
            [p[0] + Math.cos(a) * len, p[1] - len * 0.35, p[2] + Math.sin(a) * len * 0.8],
            len * 0.16,
            0x55743f,
            0x88a660,
            0.04
          );
        }
      }
      prev = p;
    }
  }
  // Sheaths and dead leaves at the foot of the clump.
  for (let j = 0; j < 5; j++) {
    const x = r.range(-0.38, 0.38),
      z = r.range(-0.46, -0.12);
    m.leaf(
      [x, 0.05, z],
      [x + r.range(-0.1, 0.1), 0.052, z + 0.09],
      0.025,
      0xa99a6d,
      0xb7a777,
      0.004
    );
  }
}

// Plantain lilies (玉簪) ringed around the tile: broad ribbed leaves in two
// greens and white trumpet flowers on slender stalks.
function plantainLilies(m) {
  const r = m.rng;
  for (let j = 0; j < 8; j++) {
    const a = (j * circle) / 8 + r.range(-0.12, 0.12),
      rr = 0.31 + r.range(-0.05, 0.05),
      x = Math.cos(a) * rr,
      z = Math.sin(a) * rr;
    for (let k = 0; k < 5; k++) {
      const aa = a + (k - 2) * 0.62 + r.range(-0.15, 0.15),
        l = r.range(0.1, 0.16);
      m.leaf(
        [x, 0.05, z],
        [x + Math.cos(aa) * l, 0.07 + l * 0.35, z + Math.sin(aa) * l],
        l * 0.42,
        k % 2 ? 0x4f7a59 : 0x5e8a5c,
        k % 2 ? 0x8db07d : 0x9cba86,
        0.05
      );
    }
    if (j % 2 === 0) {
      const top = [x * 0.95, 0.31 + r.range(-0.03, 0.05), z * 0.95];
      m.tube([x, 0.06, z], top, 0.007, 0.005, 0x6f8c55, 4);
      for (let k = 0; k < 3; k++) {
        const y = top[1] - k * 0.06,
          a2 = a + k * 2.1;
        const bud = [x * 0.95 + Math.cos(a2) * 0.035, y, z * 0.95 + Math.sin(a2) * 0.035];
        m.leaf(
          [top[0], y + 0.01, top[2]],
          [bud[0], y - 0.035, bud[2]],
          0.018,
          0xf0efe2,
          0xfdfbf0,
          0.006
        );
      }
    }
  }
  // Damp dark soil in the bed between the leaves.
  const ring = [];
  for (let j = 0; j < 10; j++) {
    const a = (j * circle) / 10;
    ring.push([Math.cos(a) * 0.45, 0.0505, Math.sin(a) * 0.45]);
  }
  for (let j = 0; j < 10; j++) {
    const a = ring[j],
      b = ring[(j + 1) % 10];
    m.face(
      [a, b, [b[0] * 0.48, 0.0505, b[2] * 0.48], [a[0] * 0.48, 0.0505, a[2] * 0.48]],
      0x7c8262
    );
  }
}

function tileDressing(m, layout) {
  const { width, height, cells } = layout,
    cx = (width - 1) / 2,
    cz = (height - 1) / 2;
  const kinds = new Map(cells.map((c) => [c.y * width + c.x, c.kind]));
  const kindAt = (x, y) => (x >= 0 && x < width ? kinds.get(y * width + x) : undefined);
  // The echo screens ring the rehearsal stone and face its centre.
  const ringX = 5 - cx,
    ringZ = 5 - cz;
  for (const cell of cells) {
    const x = cell.x - cx,
      z = cell.y - cz,
      salt = cell.x * 31 + cell.y * 17;
    if (cell.kind === 'rock') {
      const across = kindAt(cell.x - 1, cell.y) === 'rock' || kindAt(cell.x + 1, cell.y) === 'rock';
      const along = kindAt(cell.x, cell.y - 1) === 'rock' || kindAt(cell.x, cell.y + 1) === 'rock';
      let yaw;
      if (across) yaw = 0;
      else if (along) yaw = Math.PI / 2;
      else {
        const a = Math.atan2(ringX - x, ringZ - z);
        yaw = Math.round(a / (Math.PI / 8)) * (Math.PI / 8);
      }
      m.frame(x, 0, z, yaw, 1, () => echoScreen(m, across || along ? 0.94 : 0.82));
    } else if (cell.kind === 'cover') m.frame(x, 0, z, 0, 1, () => stoneSeats(m, salt));
    else if (cell.kind === 'bamboo') m.frame(x, 0, z, 0, 1, () => mountainBamboo(m, salt));
    else if (cell.kind === 'herbs') m.frame(x, 0, z, 0, 1, () => plantainLilies(m));
  }
}

export { tileDressing };
