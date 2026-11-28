// What stands on 萬安寺's own tiles, each drawn in the tile's frame: the stone incense burners
// (a great square censer under a little roof either side of the pagoda steps, round three-legged
// burners elsewhere), the octagonal sutra pillars (石經幢), the old cypresses whose twisted
// trunks lean out over the board's edge, and the herb beds before the monks' quarters.
import { circle } from '../scenery-kit.js';
import { clump } from './garden-13.js';
import { onBoard, lit, put, cap, stone, stoneLight, stoneDark, ink, timber } from './kit-17.js';

const ember = 0xd8642c;
const smoke = 0x737c8c;
const bark = 0x3a302b;
const barkLight = 0x5a4c42;
const needle = 0x17291f;
const needleLight = 0x34503d;
const soil = 0x2e2621;

// Incense sticks in the ash, their tips glowing, and a thread of smoke rising.
function incense(m, y, n, spread) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const x = r.range(-spread, spread),
      z = r.range(-spread, spread),
      h = r.range(0.14, 0.24),
      lean = r.range(-0.03, 0.03);
    m.tube([x, y, z], [x + lean, y + h, z], 0.006, 0.006, 0x8a3a2a, 3);
    m.glow(() => m.box(x + lean, y + h + 0.01, z, 0.014, 0.02, 0.014, 0xf09040));
  }
  m.line(
    [
      [0, y + 0.25, 0],
      [0.03, y + 0.45, 0.01],
      [-0.02, y + 0.65, -0.02],
      [0.04, y + 0.85, 0],
      [0, y + 1.05, 0.03]
    ],
    0.007,
    smoke,
    4
  );
}
// 大香爐: a square stone censer on a moulded pedestal, two upright ears, four legs, and a small
// hipped roof on four posts over it to keep the rain off the ash.
function greatCenser(m) {
  m.box(0, 0.07, 0, 0.66, 0.06, 0.66, stoneDark);
  m.box(0, 0.14, 0, 0.56, 0.08, 0.56, stone);
  m.box(0, 0.21, 0, 0.5, 0.06, 0.5, stoneDark);
  m.box(0, 0.26, 0, 0.6, 0.04, 0.6, stoneLight);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      m.tube([sx * 0.17, 0.28, sz * 0.13], [sx * 0.15, 0.38, sz * 0.12], 0.035, 0.03, stoneDark, 5);
  m.box(0, 0.5, 0, 0.46, 0.24, 0.36, stone);
  m.box(0, 0.63, 0, 0.5, 0.04, 0.4, stoneLight);
  // Carved bands on the body: a key fret over a mask.
  for (const s of [-1, 1]) {
    m.box(0, 0.57, s * 0.182, 0.38, 0.03, 0.01, stoneDark);
    m.box(0, 0.47, s * 0.182, 0.12, 0.1, 0.012, stoneDark);
  }
  for (const s of [-1, 1]) {
    m.box(s * 0.2, 0.73, 0, 0.04, 0.16, 0.12, stone);
    m.box(s * 0.2, 0.8, 0, 0.05, 0.035, 0.18, stoneLight);
  }
  m.glow(() => m.box(0, 0.652, 0, 0.4, 0.01, 0.3, ember));
  incense(m, 0.655, 7, 0.12);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) m.box(sx * 0.27, 0.68, sz * 0.27, 0.04, 0.8, 0.04, stoneDark);
  cap(m, 1.1, 0.36, 0.2, stoneDark, stone);
}
// A round three-legged stone burner on a drum, with two loop handles.
function roundBurner(m) {
  m.lathe(
    0,
    0.04,
    0,
    [
      [0, 0.3],
      [0.05, 0.31],
      [0.08, 0.26],
      [0.16, 0.25],
      [0.19, 0.3],
      [0.22, 0.3]
    ],
    stone,
    10
  );
  for (let k = 0; k < 3; k++) {
    const a = (k * circle) / 3 + 0.5,
      c = Math.cos(a),
      s = Math.sin(a);
    m.line(
      [
        [c * 0.2, 0.26, s * 0.2],
        [c * 0.23, 0.33, s * 0.23],
        [c * 0.16, 0.42, s * 0.16]
      ],
      0.035,
      stoneDark,
      5
    );
  }
  m.lathe(
    0,
    0.38,
    0,
    [
      [0, 0.08],
      [0.04, 0.2],
      [0.12, 0.27],
      [0.22, 0.26],
      [0.27, 0.21],
      [0.29, 0.24],
      [0.31, 0.24]
    ],
    stone,
    12
  );
  for (const s of [-1, 1]) m.hoop(s * 0.27, 0.72, 0, 0.07, 0.016, stoneDark, 6, 'xy');
  m.glow(() =>
    m.lathe(
      0,
      0.67,
      0,
      [
        [0, 0.21],
        [0.005, 0.21]
      ],
      ember,
      10
    )
  );
  incense(m, 0.675, 5, 0.1);
}
// 石經幢: an octagonal stone pillar carved with sutra text, on a lotus base, under a canopy hung
// with tassels, with a niche storey, a lotus and a pearl above.
function sutraPillar(m) {
  m.box(0, 0.08, 0, 0.66, 0.08, 0.66, stoneDark);
  m.box(0, 0.15, 0, 0.56, 0.06, 0.56, stone);
  m.lathe(
    0,
    0.18,
    0,
    [
      [0, 0.27],
      [0.05, 0.27],
      [0.07, 0.2],
      [0.14, 0.19],
      [0.16, 0.25],
      [0.2, 0.24]
    ],
    stone,
    8
  );
  // Lotus petals turned up round the foot of the shaft.
  for (let i = 0; i < 12; i++) {
    const a = (i * circle) / 12,
      c = Math.cos(a),
      s = Math.sin(a),
      w = 0.06;
    put(
      m,
      [
        [c * 0.15 - s * w, 0.36, s * 0.15 + c * w],
        [c * 0.25, 0.44, s * 0.25],
        [c * 0.15 + s * w, 0.36, s * 0.15 - c * w],
        [c * 0.22, 0.36, s * 0.22]
      ],
      i % 2 ? stoneLight : stone,
      [c, 0.6, s]
    );
  }
  const shaft = 0.135;
  m.lathe(
    0,
    0.38,
    0,
    [
      [0, shaft],
      [0.82, shaft * 0.96]
    ],
    stoneLight,
    8
  );
  // The sutra: columns of characters cut into every face.
  for (let f = 0; f < 8; f++) {
    const a = ((f + 0.5) * circle) / 8,
      c = Math.cos(a),
      s = Math.sin(a),
      ap = shaft * Math.cos(circle / 16) + 0.002;
    for (let col = -1; col <= 1; col++)
      for (let row = 0; row < 7; row++) {
        const u = col * 0.03,
          y = 0.48 + row * 0.1,
          hw = 0.008,
          hh = 0.032;
        const at = (du, dy) => [c * ap - s * (u + du), y + dy, s * ap + c * (u + du)];
        put(m, [at(-hw, -hh), at(hw, -hh), at(hw, hh), at(-hw, hh)], stoneDark, [c, 0, s]);
      }
  }
  m.lathe(
    0,
    1.2,
    0,
    [
      [0, 0.15],
      [0.03, 0.3],
      [0.09, 0.28],
      [0.12, 0.15]
    ],
    stone,
    8
  );
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) * circle) / 8,
      x = Math.cos(a) * 0.29,
      z = Math.sin(a) * 0.29;
    m.tube([x, 1.21, z], [x, 1.1, z], 0.012, 0.004, stoneDark, 4);
  }
  m.lathe(
    0,
    1.32,
    0,
    [
      [0, 0.12],
      [0.24, 0.11]
    ],
    stone,
    8
  );
  for (let f = 0; f < 4; f++) {
    const a = (f * circle) / 4,
      c = Math.cos(a),
      s = Math.sin(a);
    m.frame(c * 0.105, 1.44, s * 0.105, Math.PI / 2 - a, 1, () => {
      m.box(0, 0, 0, 0.08, 0.14, 0.012, ink);
      m.box(0, -0.02, 0.008, 0.035, 0.07, 0.012, stoneDark);
    });
  }
  m.lathe(
    0,
    1.56,
    0,
    [
      [0, 0.12],
      [0.05, 0.2],
      [0.08, 0.16],
      [0.09, 0.22],
      [0.15, 0.1],
      [0.21, 0.05],
      [0.23, 0.07],
      [0.29, 0.06],
      [0.34, 0]
    ],
    stoneLight,
    8
  );
}
// 古柏: an old cypress whose twisted trunk stands at the tile's outer corner and leans out over
// the board's edge, its flat masses of foliage mostly beyond it; roots, a stone kerb, needles.
function oldCypress(m, cell) {
  const r = m.rng;
  let ox = 0,
    oz = 0;
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ])
    if (!onBoard(cell.x + dx, cell.y + dz)) {
      ox += dx;
      oz += dz;
    }
  const l = Math.hypot(ox, oz) || 1;
  ox /= l;
  oz /= l;
  const near = ox > 0.5, // the east side, nearest the camera, keeps its tree low
    s = near ? 0.78 : 1,
    bx = ox * 0.3,
    bz = oz * 0.3;
  // A low stone kerb round the foot of the trunk.
  for (const [x, z, w, d] of [
    [0, -0.17, 0.4, 0.05],
    [0, 0.17, 0.4, 0.05],
    [-0.17, 0, 0.05, 0.3],
    [0.17, 0, 0.05, 0.3]
  ])
    m.box(bx + x, 0.065, bz + z, w, 0.05, d, stoneDark);
  put(
    m,
    [
      [bx - 0.15, 0.06, bz - 0.15],
      [bx - 0.15, 0.06, bz + 0.15],
      [bx + 0.15, 0.06, bz + 0.15],
      [bx + 0.15, 0.06, bz - 0.15]
    ],
    soil
  );
  m.frame(bx, 0.05, bz, Math.atan2(-oz, ox), s, () => {
    // Local +x leans out over the edge. The trunk twists as it climbs.
    const trunk = [
      [0, 0, 0],
      [0.05, 0.25, 0.03],
      [0.02, 0.5, -0.04],
      [0.14, 0.72, 0.02],
      [0.3, 0.92, -0.03],
      [0.46, 1.06, 0.02]
    ];
    m.line(trunk, 0.07, bark, 6);
    m.tube([0, 0, 0], [0, 0.18, 0], 0.13, 0.07, bark, 6);
    // Ridges of bark spiralling round the trunk.
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let j = 0; j <= 6; j++) {
        const t = j / 6,
          a = k * 2.1 + t * 3.2,
          p = trunk[Math.min(5, Math.floor(t * 5))];
        pts.push([p[0] + Math.cos(a) * 0.065, p[1] + 0.04, p[2] + Math.sin(a) * 0.065]);
      }
      m.line(pts, 0.014, barkLight, 3);
    }
    // Roots across the paving.
    for (let k = 0; k < 4; k++) {
      const a = k * 1.6 + 0.4;
      m.line(
        [
          [0, 0.06, 0],
          [Math.cos(a) * 0.14, 0.03, Math.sin(a) * 0.14],
          [Math.cos(a) * 0.24, 0.0, Math.sin(a) * 0.22]
        ],
        0.025,
        bark,
        4
      );
    }
    // Limbs, each ending in a flat mass of scale-leaved foliage.
    for (const [x, y, z, k] of [
      [0.75, 1.18, 0.15, 0.36],
      [0.55, 1.32, -0.25, 0.3],
      [0.3, 0.98, 0.32, 0.26],
      [0.85, 0.96, -0.2, 0.28],
      [0.42, 1.44, 0.05, 0.26]
    ]) {
      const from = trunk[r.next() < 0.5 ? 4 : 5];
      m.line(
        [from, [(from[0] + x) / 2, (from[1] + y) / 2 + 0.04, (from[2] + z) / 2], [x, y - 0.05, z]],
        0.025,
        bark,
        4
      );
      clump(m, x, y, z, k, k * 0.42, k * 0.85, needle, needleLight, 7);
    }
    clump(m, 0.58, 1.56, -0.02, 0.22, 0.14, 0.2, needle, needleLight, 6);
  });
  // Fallen needles on the paving.
  for (let i = 0; i < 9; i++) {
    const x = r.range(-0.42, 0.42),
      z = r.range(-0.42, 0.42),
      a = r.range(0, circle);
    m.leaf(
      [x, 0.045, z],
      [x + Math.cos(a) * 0.05, 0.047, z + Math.sin(a) * 0.05],
      0.012,
      0x3b4a32,
      0x52603e,
      0.002
    );
  }
}
// 僧寮藥圃: a raised bed edged in brick, rows of herbs, a few in flower, a label stake.
function herbBed(m) {
  const r = m.rng;
  for (const s of [-1, 1]) {
    m.box(0, 0.08, s * 0.4, 0.84, 0.08, 0.06, 0x5a6070);
    m.box(s * 0.4, 0.08, 0, 0.06, 0.08, 0.74, 0x5a6070);
  }
  put(
    m,
    [
      [-0.37, 0.1, -0.37],
      [-0.37, 0.1, 0.37],
      [0.37, 0.1, 0.37],
      [0.37, 0.1, -0.37]
    ],
    soil
  );
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const x = -0.27 + i * 0.18,
        z = -0.27 + j * 0.18,
        hue = j % 2 ? 0x4f7a55 : 0x6a8a52;
      for (let k = 0; k < 4; k++) {
        const a = (k * circle) / 4 + r.range(0, 1.5),
          l = r.range(0.06, 0.1);
        m.leaf(
          [x, 0.1, z],
          [x + Math.cos(a) * l, 0.13 + l * 0.7, z + Math.sin(a) * l],
          l * 0.35,
          hue,
          0x93ad78,
          0.02
        );
      }
      if ((i + j) % 3 === 0) m.box(x, 0.19, z, 0.025, 0.025, 0.025, j % 2 ? 0xe6dca4 : 0xc8a0c8);
    }
  m.tube([0.34, 0.1, 0.34], [0.34, 0.3, 0.34], 0.012, 0.012, timber, 4);
  m.box(0.34, 0.28, 0.35, 0.08, 0.06, 0.01, 0xb4a27e);
  m.lathe(
    -0.43,
    0.04,
    0.44,
    [
      [0, 0.04],
      [0.03, 0.07],
      [0.1, 0.075],
      [0.14, 0.05],
      [0.16, 0.04]
    ],
    0x6a4a34,
    7
  );
}

const tile = (draw) => (m, p, cell) => lit(m, () => draw(m, cell));
const props17 = {
  cover: tile((m, cell) => (cell.y === 2 ? greatCenser(m) : roundBurner(m))),
  crate: tile((m) => sutraPillar(m)),
  bamboo: tile((m, cell) => oldCypress(m, cell)),
  herbs: tile((m) => herbBed(m))
};

export { props17 };
