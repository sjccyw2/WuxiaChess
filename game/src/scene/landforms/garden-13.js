// 西夏夜苑's garden: old pines with real limbs and flat pads of needles, willows trailing long
// strands to the water, plum trees in blossom on crooked branches, cypress, clumps of bamboo,
// peony beds in stone edging, potted trees on carved stands, pierced Taihu rockeries, a stone
// table with drum stools, and the dowager's pleasure boat moored in the outer water.
import { circle, midway } from '../scenery-kit.js';

const GROUND = 0.02;
const WATER = -0.9;
const bark = 0x2e2926;
const barkLight = 0x4a403a;
const needle = 0x152824;
const needleLight = 0x2f4d3e;
const willowDark = 0x223b30;
const willowLight = 0x4a6e4a;
const plumWood = 0x3a2c2c;
const blossom = 0xe9c3cc;
const blossomDeep = 0xc98d9f;
const marble = 0xb3bac6;
const marbleShade = 0x7f8a9c;
const lacquer = 0xa23c2c;
const lacquerDark = 0x6a2722;
const gilt = 0xcfa85c;
const paper = 0xf4c57a;
const ink = 0x20232c;
const rockTone = 0x56616e;
const rockLight = 0x9aa5b0;

// A rounded mass of leaves: three rings and a crown, flattened by `ry`.
function clump(m, x, y, z, rx, ry, rz, base, light, n = 7) {
  const r = m.rng,
    turn = r.range(0, circle),
    rim = Array.from({ length: n }, () => r.range(0.8, 1.16));
  let last;
  for (const [h, s, f] of [
    [-0.5, 0.55, 0],
    [-0.05, 1, 0.3],
    [0.45, 0.72, 0.75]
  ]) {
    const ring = rim.map((k, i) => {
      const a = turn + (i * circle) / n;
      return [x + Math.cos(a) * rx * s * k, y + ry * h, z + Math.sin(a) * rz * s * k];
    });
    const col = m.mix(base, light, f);
    if (last)
      for (let i = 0; i < n; i++) {
        const q = (i + 1) % n;
        m.face([last.ring[i], ring[i], ring[q], last.ring[q]], [last.col, col, col, last.col]);
      }
    last = { ring, col };
  }
  for (let i = 0; i < n; i++)
    m.face(
      [[x, y + ry * 0.8, z], last.ring[(i + 1) % n], last.ring[i]],
      [m.rgb(light), last.col, last.col]
    );
}
// A point some way along a limb, bent a little off the straight.
function along(a, b, t, bend) {
  const p = midway(a, b, t),
    k = Math.sin(t * Math.PI) * bend;
  return [p[0] + k * 0.6, p[1] + k, p[2] - k * 0.4];
}

// 古松: a leaning trunk that forks, limbs reaching out level, each ending in flat pads of needles.
function oldPine(m, x, z, s, y = GROUND) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    const lean = r.range(0.15, 0.35),
      trunk = [
        [0, 0, 0],
        [lean * 0.3, 0.7, 0.05],
        [lean * 0.8, 1.4, -0.06],
        [lean * 0.6, 2.1, 0.04],
        [lean * 0.9, 2.8, 0]
      ];
    m.line(trunk, 0.1, bark, 6);
    m.tube([0, 0, 0], [0, 0.25, 0], 0.17, 0.1, bark, 6);
    for (let k = 0; k < 6; k++) {
      const h = 1.1 + k * 0.32,
        seat = along(trunk[1], trunk[4], (h - 0.7) / 2.1, 0),
        a = k * 2.4 + r.range(-0.4, 0.4),
        reach = (1.15 - k * 0.12) * r.range(0.85, 1.1),
        tip = [seat[0] + Math.cos(a) * reach, h + r.range(0.05, 0.25), seat[2] + Math.sin(a) * reach],
        elbow = along(seat, tip, 0.5, -0.12);
      m.line([seat, elbow, tip], 0.04 - k * 0.003, barkLight, 5);
      const pad = (p, w) =>
        clump(m, p[0], p[1] + 0.1, p[2], w, 0.16, w * 0.85, needle, needleLight, 7);
      pad(tip, 0.42 - k * 0.03);
      // Two side twigs, each with its own smaller pad.
      for (const side of [-1, 1]) {
        const b = a + side * 0.9,
          from = along(seat, tip, 0.55, -0.12),
          end = [from[0] + Math.cos(b) * reach * 0.4, from[1] + 0.12, from[2] + Math.sin(b) * reach * 0.4];
        m.tube(from, end, 0.022, 0.012, barkLight, 4);
        pad(end, 0.28 - k * 0.02);
      }
    }
    clump(m, trunk[4][0], 3.0, 0, 0.5, 0.26, 0.45, needle, needleLight, 7);
  });
}
// 側柏: a dark columnar cypress in stacked rounded masses.
function cypress(m, x, z, s, y = GROUND) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    m.tube([0, 0, 0], [0.02, 1.0, 0], 0.08, 0.06, bark, 5);
    for (let k = 0; k < 5; k++) {
      const h = 0.7 + k * 0.42,
        w = 0.5 - k * 0.07;
      clump(m, r.range(-0.05, 0.05), h, r.range(-0.05, 0.05), w, 0.36, w * 0.92, 0x132420, 0x2a4536, 8);
    }
  });
}
// 垂柳: a gnarled trunk under a loose crown, hung all round with long tapering strands.
function trailingWillow(m, x, z, s, lean, strands = 22) {
  const r = m.rng;
  m.frame(x, GROUND, z, lean, s, () => {
    m.line(
      [
        [0, 0, 0],
        [0.15, 0.7, 0.03],
        [0.45, 1.4, -0.05],
        [0.7, 2.0, 0.02],
        [0.9, 2.35, 0]
      ],
      0.11,
      0x322d29,
      6
    );
    for (const [cx, cy, cz, k] of [
      [0.95, 2.55, 0, 1],
      [0.35, 2.35, 0.5, 0.8],
      [1.45, 2.3, -0.35, 0.75],
      [0.55, 2.4, -0.55, 0.72],
      [1.2, 2.45, 0.45, 0.7]
    ]) {
      m.tube([0.8, 2.2, 0], [cx, cy - 0.1, cz], 0.04, 0.02, 0x322d29, 4);
      clump(m, cx, cy, cz, 0.62 * k, 0.3 * k, 0.56 * k, willowDark, willowLight, 7);
      for (let j = 0; j < strands; j++) {
        const a = (j * circle) / strands + r.range(-0.15, 0.15),
          rr = r.range(0.35, 0.65) * k,
          len = r.range(1.0, 1.9) * (0.8 + 0.2 * k),
          segs = 4;
        let p = [cx + Math.cos(a) * rr, cy - 0.05, cz + Math.sin(a) * rr];
        for (let q = 0; q < segs; q++) {
          const out = 0.05 * (1 - q / segs),
            next = [p[0] + Math.cos(a) * out, p[1] - len / segs, p[2] + Math.sin(a) * out];
          m.leaf(p, next, 0.028 * (1 - q / (segs + 1)), willowDark, willowLight, 0.01);
          p = next;
        }
      }
    }
  });
}
// 梅: a crooked plum in blossom: trunk and limbs in three orders, the twigs strung with flowers.
function plumTree(m, x, z, s, y = GROUND) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    const trunk = [
      [0, 0, 0],
      [0.1, 0.45, 0.04],
      [-0.06, 0.9, -0.02],
      [0.05, 1.25, 0.03]
    ];
    m.line(trunk, 0.065, plumWood, 5);
    const flower = (p, k) => {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * circle) / 5 + k;
        pts.push([p[0] + Math.cos(a) * 0.045, p[1] + 0.012 * Math.sin(a * 2), p[2] + Math.sin(a) * 0.045]);
      }
      m.face(pts, r.next() < 0.3 ? blossomDeep : blossom);
    };
    for (let k = 0; k < 5; k++) {
      const from = trunk[1 + (k % 3)],
        a = k * 2.5 + r.range(-0.3, 0.3),
        reach = r.range(0.5, 0.8),
        tip = [from[0] + Math.cos(a) * reach, from[1] + r.range(0.35, 0.7), from[2] + Math.sin(a) * reach],
        elbow = along(from, tip, 0.5, 0.1);
      m.line([from, elbow, tip], 0.03, plumWood, 4);
      // Twigs off the limb, each strung with flowers.
      for (let t = 0; t < 4; t++) {
        const base = along(from, tip, 0.35 + t * 0.2, 0.1),
          b = a + r.range(-1.2, 1.2),
          end = [base[0] + Math.cos(b) * 0.3, base[1] + r.range(0.12, 0.3), base[2] + Math.sin(b) * 0.3];
        m.tube(base, end, 0.013, 0.006, plumWood, 3);
        for (let f = 0; f < 5; f++) flower(midway(base, end, 0.25 + f * 0.17), f);
      }
      clump(m, tip[0], tip[1] + 0.05, tip[2], 0.12, 0.09, 0.11, blossomDeep, blossom, 5);
    }
    clump(m, trunk[3][0], 1.4, trunk[3][2], 0.16, 0.12, 0.15, blossomDeep, blossom, 6);
  });
}
// 竹: a clump of slender jointed culms with sprays of leaves.
function bamboo(m, x, z, s, n = 9) {
  const r = m.rng;
  m.frame(x, GROUND, z, r.range(0, circle), s, () => {
    for (let i = 0; i < n; i++) {
      const a = r.range(0, circle),
        d = r.range(0, 0.3),
        bx = Math.cos(a) * d,
        bz = Math.sin(a) * d,
        h = r.range(1.6, 2.6),
        tx = bx + r.range(-0.25, 0.25),
        tz = bz + r.range(-0.25, 0.25);
      m.tube([bx, 0, bz], [tx, h, tz], 0.028, 0.016, 0x4f7348, 5);
      for (let k = 0; k < 6; k++) {
        const t = 0.45 + k * 0.1,
          p = [bx + (tx - bx) * t, h * t, bz + (tz - bz) * t],
          b = r.range(0, circle),
          l = r.range(0.16, 0.26);
        m.leaf(p, [p[0] + Math.cos(b) * l, p[1] - 0.05, p[2] + Math.sin(b) * l], 0.03, 0x2f5a3c, 0x5c8a56, 0.02);
      }
    }
  });
}
// 花圃: a raised bed of peonies in marble edging, its bushes in heavy flower.
function peonyBed(m, x, z, w, d, yaw = 0) {
  const r = m.rng;
  m.frame(x, GROUND, z, yaw, 1, () => {
    for (const s of [-1, 1]) {
      m.box(0, 0.09, (s * d) / 2, w + 0.08, 0.18, 0.08, marble);
      m.box((s * w) / 2, 0.09, 0, 0.08, 0.18, d, marble);
    }
    m.box(0, 0.12, 0, w, 0.04, d, 0x2a2b28);
    const nx = Math.max(1, Math.round(w / 0.42)),
      nz = Math.max(1, Math.round(d / 0.42));
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const px = -w / 2 + ((i + 0.5) * w) / nx + r.range(-0.05, 0.05),
          pz = -d / 2 + ((j + 0.5) * d) / nz + r.range(-0.05, 0.05);
        clump(m, px, 0.28, pz, 0.2, 0.14, 0.18, 0x22402e, 0x46704a, 6);
        const hue = r.pick([0xd8566b, 0xe891a6, 0xf2d6dc, 0xb03c5a]);
        for (let f = 0; f < 2; f++) {
          const fx = px + r.range(-0.1, 0.1),
            fz = pz + r.range(-0.1, 0.1),
            fy = 0.4 + r.range(0, 0.04);
          for (let q = 0; q < 6; q++) {
            const a = (q * circle) / 6 + f;
            m.leaf([fx, fy, fz], [fx + Math.cos(a) * 0.07, fy + 0.04, fz + Math.sin(a) * 0.07], 0.035, hue, m.mix(hue, 0xffffff, 0.35), 0.02);
          }
        }
      }
  });
}
// 盆景: a dwarf pine in a glazed pot on a carved stand.
function pottedPine(m, x, z, s = 1, yaw = 0) {
  const r = m.rng;
  m.frame(x, GROUND, z, yaw, s, () => {
    m.box(0, 0.28, 0, 0.42, 0.04, 0.42, lacquerDark);
    for (const i of [-1, 1])
      for (const j of [-1, 1]) m.tube([i * 0.17, 0, j * 0.17], [i * 0.17, 0.27, j * 0.17], 0.022, 0.018, lacquerDark, 4);
    m.lathe(
      0,
      0.3,
      0,
      [
        [0, 0.13],
        [0.04, 0.16],
        [0.16, 0.19],
        [0.19, 0.2],
        [0.17, 0]
      ],
      0x2d5a6a,
      9
    );
    m.line(
      [
        [0, 0.47, 0],
        [0.08, 0.62, 0.02],
        [-0.05, 0.76, 0],
        [0.1, 0.86, -0.02]
      ],
      0.025,
      bark,
      4
    );
    for (const [px, py, pz, w] of [
      [0.16, 0.66, 0.04, 0.14],
      [-0.15, 0.78, -0.03, 0.12],
      [0.12, 0.92, 0, 0.11]
    ])
      clump(m, px + r.range(-0.02, 0.02), py, pz, w, 0.06, w * 0.85, needle, needleLight, 6);
  });
}
// 太湖石: a pierced, waisted rock of stacked lobes, set up on a low base.
function taihuRock(m, x, z, s, y = GROUND) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    m.box(0, 0.05, 0, 0.7, 0.1, 0.55, marbleShade);
    let h = 0.1;
    for (let k = 0; k < 5; k++) {
      const w = [0.3, 0.2, 0.27, 0.18, 0.23][k],
        t = [0.42, 0.32, 0.38, 0.3, 0.34][k],
        dx = r.range(-0.08, 0.08);
      m.rock(dx, h, r.range(-0.04, 0.04), w, t, w * 0.8, rockTone, rockLight, 8, k);
      // A dark hollow, the hole worn through the stone.
      if (k % 2 === 1)
        m.box(dx + w * 0.3, h + t * 0.5, w * 0.62, w * 0.36, t * 0.34, 0.02, 0x1d2228);
      h += t * 0.78;
    }
  });
}
// 石桌鼓凳: a round stone table and four drum stools.
function stoneTable(m, x, z, s = 1) {
  m.frame(x, GROUND, z, 0.4, s, () => {
    m.lathe(
      0,
      0,
      0,
      [
        [0, 0.17],
        [0.06, 0.12],
        [0.48, 0.1],
        [0.52, 0.34],
        [0.6, 0.36],
        [0.63, 0.33],
        [0.63, 0]
      ],
      marble,
      12
    );
    for (let k = 0; k < 4; k++) {
      const a = (k * circle) / 4 + 0.4;
      m.lathe(
        Math.cos(a) * 0.62,
        0,
        Math.sin(a) * 0.62,
        [
          [0, 0.11],
          [0.05, 0.15],
          [0.2, 0.16],
          [0.35, 0.12],
          [0.37, 0]
        ],
        marbleShade,
        9
      );
    }
  });
}

// 畫舫: the dowager's pleasure boat, a long lacquered hull with a lit cabin under a tiled roof
// and lanterns at bow and stern, moored to the bank. Drawn along x of its own frame.
function pleasureBoat(m, roof, lamp) {
  const len = 3.6,
    beam = 0.95,
    deck = WATER + 0.32,
    n = 10;
  // The hull in sections: a keel line, a chine and the gunwale, lifted toward both ends.
  const section = (u) => {
    const t = u * 2 - 1,
      rise = 0.22 * t * t * t * t,
      half = (beam / 2) * Math.sqrt(Math.max(0.02, 1 - t * t * 0.92));
    return [
      [u * len - len / 2, WATER - 0.12 + rise * 0.6, 0],
      [u * len - len / 2, WATER + 0.05 + rise, half * 0.86],
      [u * len - len / 2, deck + rise, half]
    ];
  };
  let last = null;
  for (let i = 0; i <= n; i++) {
    const sec = section(i / n);
    if (last)
      for (const side of [-1, 1]) {
        const f = (p) => [p[0], p[1], p[2] * side];
        m.face([f(last[0]), f(sec[0]), f(sec[1]), f(last[1])], 0x3b1d1a);
        m.face([f(last[1]), f(sec[1]), f(sec[2]), f(last[2])], lacquer);
        // The gunwale's gilt rail.
        m.tube(f([last[2][0], last[2][1] + 0.02, last[2][2]]), f([sec[2][0], sec[2][1] + 0.02, sec[2][2]]), 0.018, 0.018, gilt, 4);
      }
    last = sec;
  }
  // Deck planking.
  for (let i = 1; i < n - 1; i++) {
    const a = section(i / n)[2],
      b = section((i + 1) / n)[2];
    m.face(
      [
        [a[0], a[1] - 0.01, -a[2] * 0.97],
        [a[0], a[1] - 0.01, a[2] * 0.97],
        [b[0], b[1] - 0.01, b[2] * 0.97],
        [b[0], b[1] - 0.01, -b[2] * 0.97]
      ],
      i % 2 ? 0x5a3f30 : 0x664836
    );
  }
  // The cabin: red posts, lit lattice sides and a roof.
  const cw = 1.7,
    cd = 0.72,
    ch = 0.72;
  for (const i of [-1, 1])
    for (const j of [-1, 1]) m.tube([(i * cw) / 2, deck, (j * cd) / 2], [(i * cw) / 2, deck + ch, (j * cd) / 2], 0.03, 0.028, lacquer, 5);
  for (const j of [-1, 1]) {
    m.glow(() =>
      m.face(
        [
          [-cw / 2 + 0.05, deck + 0.2, (j * cd) / 2],
          [cw / 2 - 0.05, deck + 0.2, (j * cd) / 2],
          [cw / 2 - 0.05, deck + ch - 0.08, (j * cd) / 2],
          [-cw / 2 + 0.05, deck + ch - 0.08, (j * cd) / 2]
        ],
        paper
      )
    );
    m.box(0, deck + 0.1, (j * cd) / 2, cw, 0.2, 0.03, lacquerDark);
    for (let k = -3; k <= 3; k++) m.box((k * cw) / 7, deck + 0.42, (j * cd) / 2 + j * 0.012, 0.02, ch - 0.3, 0.012, lacquerDark);
    m.box(0, deck + 0.42, (j * cd) / 2 + j * 0.012, cw, 0.02, 0.012, lacquerDark);
  }
  for (const i of [-1, 1]) m.box((i * cw) / 2, deck + 0.1, 0, 0.03, 0.2, cd, lacquerDark);
  roof(cw + 0.36, cd + 0.3, deck + ch, 0.26);
  // Bow and stern lanterns on short posts.
  for (const e of [-1, 1]) {
    const x = e * (len / 2 - 0.35);
    m.tube([x, deck, 0], [x, deck + 0.75, 0], 0.02, 0.02, ink, 4);
    m.tube([x, deck + 0.75, 0], [x + e * 0.22, deck + 0.8, 0], 0.012, 0.012, ink, 4);
    lamp(x + e * 0.22, deck + 0.55, 0);
  }
  // The mooring line to the bank, and a ripple ring round the hull.
  m.line(
    [
      [len / 2 - 0.2, deck + 0.05, beam / 2],
      [len / 2 + 0.1, WATER + 0.25, beam / 2 + 0.6],
      [len / 2 + 0.3, GROUND + 0.05, beam / 2 + 1.25]
    ],
    0.008,
    0x8a7a5e,
    3
  );
  m.frame(0, 0, 0, 0, [2.1, 1, 0.75], () => m.hoop(0, WATER + 0.006, 0, 1, 0.012, 0x5d7395, 22));
}

export {
  clump,
  oldPine,
  cypress,
  trailingWillow,
  plumTree,
  bamboo,
  peonyBed,
  pottedPine,
  taihuRock,
  stoneTable,
  pleasureBoat
};
