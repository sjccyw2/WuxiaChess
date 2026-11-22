import { Model, circle } from '../scenery-kit.js';
import { rgb, blend, smooth, waterLine, altarLights, bedLight, drip } from './kit-7.js';

// What the people of the tomb left on the dry rock round the board: the bed
// of cold jade in the north-east bay with the sleeping rope strung above it,
// an altar to the founder in the north-west bay with shelves of scrolls and
// medicine jars, chests, a stone table and stools, a bronze cauldron by the
// spring arch, a toppled stele, jade quarried from the polished face and
// stacked, boulders with a cut face, frost flowers along every edge, and
// drifts of pebbles and frozen seepage on the slopes round the walkway.

const granite = 0x56696a,
  dressed = 0x71877f,
  pale = 0x9ab0a4,
  dark = 0x394b4d,
  jade = 0x9fd2bd,
  jadeDeep = 0x5fa58f,
  bronze = 0x6d6a4c,
  verdigris = 0x5f8f7c,
  lacquer = 0x5a3a30,
  silk = 0x7d6f62,
  paper = 0xb3a98f,
  frostC = 0xd3e4e1;

// Stand a piece on the rock: the lowest of the ground under its footprint.
function footing(ground, x, z, rx, rz = rx) {
  let y = 9;
  for (const [u, v] of [
    [0, 0],
    [rx, rz],
    [-rx, rz],
    [rx, -rz],
    [-rx, -rz]
  ])
    y = Math.min(y, ground.terrain(x + u, z + v));
  return y;
}

// ---------------------------------------------------------------------------
// 寒玉床: a slab of cold jade on a stepped plinth, rimed, with a jade pillow;
// pale wisps of cold breathe off it.
function jadeBed(m, ground) {
  const [x, , z] = bedLight,
    yaw = 0.08,
    y = footing(ground, x, z, 1.15, 0.65) - 0.04;
  const r = m.rng;
  m.frame(x, y, z, yaw, 1, () => {
    m.box(0, 0.09, 0, 2.3, 0.22, 1.34, dark);
    m.box(0, 0.25, 0, 2.08, 0.14, 1.12, granite);
    m.box(0, 0.335, 0, 1.96, 0.04, 1.0, pale);
    // The jade itself: deep at the sides, pale and polished on top.
    m.box(0, 0.46, 0, 1.86, 0.2, 0.9, jadeDeep);
    const top = [
      [-0.9, 0.565, -0.42],
      [0.9, 0.565, -0.42],
      [0.9, 0.565, 0.42],
      [-0.9, 0.565, 0.42]
    ];
    m.face(top.slice().reverse(), [rgb(0xb9e6d3), rgb(0xd6f2e6), rgb(0xa8dcc6), rgb(0xc8eedf)]);
    // Glowing edges where the cold shows through the polish.
    m.glow(() => {
      for (const s of [-1, 1]) {
        m.box(0, 0.47, s * 0.452, 1.8, 0.12, 0.006, 0x8fe0c2);
        m.box(s * 0.932, 0.47, 0, 0.006, 0.12, 0.84, 0x8fe0c2);
      }
      // Wisps of cold rising from the slab.
      for (let k = 0; k < 9; k++) {
        const px = r.range(-0.8, 0.8),
          pz = r.range(-0.35, 0.35),
          h = r.range(0.25, 0.6),
          turn = r.range(0, circle);
        const pts = [];
        for (let j = 0; j <= 4; j++) {
          const t = j / 4;
          pts.push([
            px + Math.sin(t * 3 + turn) * 0.06 * t,
            0.58 + h * t,
            pz + Math.cos(t * 2.4 + turn) * 0.05 * t
          ]);
        }
        for (let j = 1; j < pts.length; j++) {
          const w = 0.03 * (1 - (j - 1) / 4) + 0.004;
          const a = pts[j - 1],
            b = pts[j];
          m.face(
            [
              [a[0] - w, a[1], a[2]],
              [a[0] + w, a[1], a[2]],
              [b[0] + w * 0.7, b[1], b[2]],
              [b[0] - w * 0.7, b[1], b[2]]
            ],
            blend(rgb(0xa9e8d0), rgb(0xe4fbf2), j / 4)
          );
        }
      }
    });
    // Frost crust and a jade pillow.
    for (let k = 0; k < 7; k++) {
      const px = r.range(-0.8, 0.8),
        pz = r.range(-0.36, 0.36),
        q = r.range(0.04, 0.1),
        ring = [];
      for (let j = 0; j < 7; j++) {
        const t = -(j * circle) / 7;
        ring.push([px + Math.cos(t) * q * r.range(0.6, 1), 0.567, pz + Math.sin(t) * q * 0.7]);
      }
      m.face(ring, frostC);
    }
    m.box(-0.72, 0.62, 0, 0.26, 0.1, 0.5, 0x8cc6b0);
    m.box(-0.72, 0.672, 0, 0.22, 0.01, 0.44, 0xbfe6d6);
    // A folded quilt of faded silk at the foot.
    m.box(0.66, 0.6, 0.02, 0.36, 0.07, 0.62, silk);
    m.box(0.66, 0.638, 0.02, 0.34, 0.01, 0.6, 0x938676);
    // Icicles along the plinth's lip.
    for (let k = 0; k < 16; k++) {
      const s = k % 2 ? 1 : -1,
        u = r.range(-1.0, 1.0);
      drip(m, [u, 0.31, s * 0.565], -r.range(0.05, 0.16), 0.016, rgb(0xa5c4c1), rgb(0xe6f2f1), 5);
    }
  });
  // 繩: the sleeping rope, strung between two stone posts above the bed.
  const posts = [
    [x - 1.55, z - 0.35],
    [x + 1.6, z + 0.15]
  ].map(([px, pz]) => {
    const py = footing(ground, px, pz, 0.15) - 0.04;
    m.box(px, py + 0.15, pz, 0.3, 0.3, 0.3, dark);
    m.lathe(px, py + 0.3, pz, [[0, 0.1], [1.15, 0.08], [1.25, 0.11], [1.36, 0.09], [1.4, 0.03]], dressed, 8);
    m.hoop(px, py + 1.32, pz, 0.11, 0.014, 0x2f3638, 10);
    return [px, py + 1.32, pz];
  });
  const [a, b] = posts,
    rope = [];
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    rope.push([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - 0.22 * Math.sin(Math.PI * t),
      a[2] + (b[2] - a[2]) * t
    ]);
  }
  m.line(rope, 0.016, 0xb6ab8c, 5);
  for (const p of [a, b]) m.line([p, [p[0] + 0.02, p[1] - 0.35, p[2] + 0.03]], 0.012, 0xa49a7c, 4);
}

// ---------------------------------------------------------------------------
// The founder's altar in the north-west bay: a long table with a tablet and a
// hanging portrait behind, an incense burner, offerings and two candles.
function altar(m, ground, flames) {
  const x = -8.55,
    z = -7.75,
    yaw = Math.PI / 4,
    y = footing(ground, x, z, 0.75, 0.45) - 0.03;
  m.frame(x, y, z, yaw, 1, () => {
    m.box(0, 0.05, 0, 1.6, 0.1, 0.72, dark);
    for (const s of [-1, 1]) {
      m.box(s * 0.66, 0.42, 0, 0.14, 0.64, 0.5, dressed);
      m.box(s * 0.66, 0.42, 0.252, 0.1, 0.5, 0.01, pale);
    }
    m.box(0, 0.78, 0, 1.56, 0.08, 0.62, 0x63776f);
    m.box(0, 0.83, 0, 1.6, 0.025, 0.66, pale);
    m.box(0, 0.6, 0.27, 1.18, 0.3, 0.03, 0x5a6f69);
    for (let j = 0; j < 5; j++) m.box(-0.44 + j * 0.22, 0.6, 0.29, 0.12, 0.16, 0.01, 0x85998d);
    // The tablet on its base, the portrait on a stand behind.
    m.box(0, 0.9, -0.18, 0.34, 0.1, 0.16, lacquer);
    m.box(0, 1.17, -0.18, 0.24, 0.46, 0.05, lacquer);
    m.box(0, 1.17, -0.15, 0.17, 0.38, 0.01, 0x9a7f4f);
    for (let j = 0; j < 4; j++) m.box(0, 1.3 - j * 0.08, -0.144, 0.05, 0.04, 0.004, 0x3a2a20);
    for (const s of [-1, 1]) m.box(s * 0.5, 1.15, -0.42, 0.05, 2.1, 0.05, lacquer);
    m.box(0, 2.15, -0.42, 1.12, 0.05, 0.06, lacquer);
    m.box(0, 1.42, -0.415, 0.72, 1.34, 0.012, paper);
    m.box(0, 1.42, -0.405, 0.6, 1.16, 0.006, 0xc9c0a4);
    // The founder in grey on the scroll: a few strokes of ink and colour.
    m.box(0, 1.33, -0.4, 0.16, 0.5, 0.004, 0x6c7270);
    m.box(0, 1.65, -0.4, 0.1, 0.1, 0.004, 0x43403b);
    m.box(0.2, 1.85, -0.4, 0.04, 0.24, 0.004, 0x2e2a26);
    for (const v of [0.74, 2.1]) m.tube([-0.38, v, -0.4], [0.38, v, -0.4], 0.02, 0.02, 0x4a3328, 6);
    // Incense burner, offerings and the candlesticks.
    m.lathe(0, 0.845, 0.1, [[0, 0.05], [0.03, 0.09], [0.11, 0.1], [0.13, 0.08], [0.14, 0.09]], bronze, 12);
    for (const s of [-1, 1]) m.tube([s * 0.09, 0.98, 0.1], [s * 0.11, 1.02, 0.1], 0.01, 0.01, bronze, 5);
    for (let j = 0; j < 3; j++) m.line([[-0.02 + j * 0.02, 0.98, 0.1], [-0.02 + j * 0.025, 1.2, 0.1]], 0.004, 0xb08a5a, 3);
    for (const s of [-1, 1]) {
      m.lathe(s * 0.3, 0.845, 0.12, [[0, 0.08], [0.02, 0.09], [0.035, 0.03]], 0x8f9f96, 10);
      for (let j = 0; j < 4; j++)
        m.lathe(s * 0.3 + (j % 2 ? 0.03 : -0.03), 0.88 + (j > 1 ? 0.045 : 0), 0.12 + (j % 3 ? 0.02 : -0.02), [[0, 0.03], [0.03, 0.035], [0.055, 0.0]], 0x9e6a3f, 7);
      m.lathe(s * 0.62, 0.845, 0.0, [[0, 0.06], [0.03, 0.025], [0.2, 0.02], [0.22, 0.05], [0.24, 0.045]], bronze, 8);
      m.tube([s * 0.62, 1.085, 0], [s * 0.62, 1.2, 0], 0.022, 0.02, 0xe6dccd, 6);
    }
  });
  // The candle flames go with the warm lamps, in their own glowing group.
  for (const [fx, , fz] of altarLights) flames.push([fx, y + 1.2, fz]);
}

// Shelves of scrolls and medicine jars against the rock, and a lacquered
// chest beside them.
function shelves(m, ground) {
  const r = m.rng;
  for (const [x, z, yaw] of [
    [-9.32, -6.3, Math.PI / 2 + 0.12],
    [-9.2, 4.25, Math.PI / 2 - 0.1]
  ]) {
    const y = footing(ground, x, z, 0.3, 0.6) - 0.03;
    m.frame(x, y, z, yaw, 1, () => {
      for (const s of [-1, 1]) m.box(s * 0.55, 0.75, 0, 0.07, 1.5, 0.38, dressed);
      m.box(0, 0.75, -0.18, 1.1, 1.5, 0.03, dark);
      for (let j = 0; j < 4; j++) {
        const sy = 0.08 + j * 0.44;
        m.box(0, sy, 0, 1.12, 0.05, 0.38, pale);
        if (j === 3) break;
        // Scrolls on the upper boards, jars on the lower.
        if (j) {
          for (let k = 0; k < 9; k++) {
            const u = -0.44 + k * 0.11 + r.range(-0.02, 0.02),
              lie = r.next() < 0.7;
            if (lie) m.tube([u, sy + 0.07, -0.14], [u + r.range(-0.03, 0.03), sy + 0.07, 0.15], 0.042, 0.042, r.pick([paper, 0xa79c80, 0x8f8670, 0x9d7d5c]), 6);
            else m.tube([u, sy + 0.025, 0.02], [u, sy + 0.32, 0.02], 0.035, 0.035, r.pick([paper, 0xa18c6a]), 6);
            if (lie && r.next() < 0.5) m.box(u, sy + 0.07, 0.165, 0.03, 0.03, 0.01, 0x7a2f28);
          }
        } else {
          for (let k = 0; k < 6; k++) {
            const u = -0.42 + k * 0.17,
              h = r.range(0.16, 0.3),
              w = r.range(0.06, 0.08);
            m.lathe(u, sy + 0.025, 0, [[0, w * 0.7], [h * 0.2, w], [h * 0.75, w * 0.9], [h * 0.85, w * 0.45], [h, w * 0.5]], r.pick([0x7c8a7f, 0x6b5a48, 0x8e9b8c, 0x5b6b66]), 10);
            m.lathe(u, sy + 0.025 + h, 0, [[0, w * 0.55], [0.03, w * 0.2]], paper, 8);
          }
        }
      }
      // Rime along the top board and a frost crust at the foot.
      m.box(0, 1.355, 0.02, 1.1, 0.012, 0.36, frostC);
    });
  }
  // The chest, its lid banded with iron, a lock plate on the front.
  for (const [x, z, yaw] of [
    [-8.95, -5.35, 1.2],
    [-9.25, 3.25, 1.7]
  ]) {
    const y = footing(ground, x, z, 0.35, 0.25) - 0.02;
    m.frame(x, y, z, yaw, 1, () => {
      m.box(0, 0.2, 0, 0.72, 0.4, 0.44, lacquer);
      m.box(0, 0.44, 0, 0.76, 0.08, 0.48, 0x4a2f27);
      for (const u of [-0.24, 0.24]) m.box(u, 0.25, 0, 0.05, 0.5, 0.5, 0x2f3638);
      m.box(0, 0.3, 0.225, 0.1, 0.12, 0.02, 0x8b7b52);
      m.box(0, 0.485, 0, 0.74, 0.01, 0.46, frostC);
    });
  }
}

// A stone table with four drum stools and a tea set left out.
function tableAndStools(m, ground) {
  const x = -7.85,
    z = -6.75,
    y = footing(ground, x, z, 0.5) - 0.03;
  m.lathe(x, y, z, [[0, 0.32], [0.08, 0.24], [0.5, 0.18], [0.62, 0.3], [0.68, 0.5], [0.76, 0.5], [0.78, 0.46]], dressed, 14);
  m.lathe(x, y + 0.781, z, [[0, 0.46], [0.004, 0.0]], pale, 14);
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4 + 0.4,
      sx = x + Math.cos(a) * 0.82,
      sz = z + Math.sin(a) * 0.82,
      sy = footing(ground, sx, sz, 0.18) - 0.03;
    m.lathe(sx, sy, sz, [[0, 0.16], [0.08, 0.2], [0.3, 0.2], [0.42, 0.16], [0.44, 0.14]], granite, 10);
    m.lathe(sx, sy + 0.441, sz, [[0, 0.14], [0.004, 0]], frostC, 10);
  }
  m.lathe(x + 0.05, y + 0.785, z - 0.05, [[0, 0.05], [0.05, 0.08], [0.12, 0.07], [0.14, 0.03], [0.17, 0.035]], 0x9fb3a6, 10);
  m.tube([x + 0.12, y + 0.86, z - 0.05], [x + 0.2, y + 0.9, z - 0.05], 0.012, 0.008, 0x9fb3a6, 5);
  for (const [u, v] of [[-0.18, 0.12], [0.2, 0.15], [-0.05, -0.25]])
    m.lathe(x + u, y + 0.785, z + v, [[0, 0.025], [0.04, 0.045], [0.045, 0.04]], 0xbfcdc4, 8);
}

// The bronze cauldron by the spring arch, green with age, on three legs.
function cauldron(m, ground) {
  const x = -3.35,
    z = -7.25,
    y = footing(ground, x, z, 0.4) - 0.02;
  m.box(x, y + 0.04, z, 0.9, 0.1, 0.9, dark);
  for (let k = 0; k < 3; k++) {
    const a = (k * circle) / 3 + 0.3;
    m.tube([x + Math.cos(a) * 0.26, y + 0.08, z + Math.sin(a) * 0.26], [x + Math.cos(a) * 0.22, y + 0.42, z + Math.sin(a) * 0.22], 0.055, 0.05, bronze, 7);
  }
  m.lathe(x, y + 0.36, z, [[0, 0.12], [0.08, 0.3], [0.28, 0.36], [0.4, 0.34], [0.43, 0.37], [0.46, 0.36], [0.44, 0.3]], verdigris, 16);
  m.hoop(x, y + 0.6, z, 0.25, 0.03, bronze, 18);
  for (const s of [-1, 1]) {
    m.hoop(x + s * 0.3, y + 0.92, z, 0.1, 0.022, bronze, 10, 'xy');
    m.box(x + s * 0.3, y + 0.82, z, 0.05, 0.08, 0.05, bronze);
  }
  // A ring of frost on the rim and taotie bosses round the belly.
  m.hoop(x, y + 0.83, z, 0.365, 0.012, frostC, 18);
  for (let k = 0; k < 6; k++) {
    const a = (k * circle) / 6;
    m.box(x + Math.cos(a) * 0.36, y + 0.62, z + Math.sin(a) * 0.36, 0.08, 0.08, 0.08, 0x8a8456);
  }
}

// A stele toppled on the east rock, its inscription face up, and its base.
function stele(m, ground) {
  const x = 7.55,
    z = -1.05,
    y = footing(ground, x, z, 0.8, 0.3) - 0.02;
  m.frame(x, y, z, 0.35, 1, () => {
    m.box(0, 0.1, 0, 1.55, 0.2, 0.52, dressed);
    m.box(0, 0.205, 0, 1.4, 0.012, 0.4, 0x5e736d);
    for (let c = 0; c < 4; c++)
      for (let j = 0; j < 8; j++)
        m.box(-0.55 + j * 0.155, 0.212, -0.13 + c * 0.09, 0.06, 0.004, 0.05, 0x2f4141);
    m.box(-0.86, 0.2, 0, 0.3, 0.4, 0.6, granite);
    m.box(0.3, 0.215, 0.05, 0.5, 0.01, 0.3, frostC);
  }, 0, 0.06);
  m.rock(x + 0.95, y - 0.04, z + 0.6, 0.32, 0.36, 0.28, granite, 0x8aa197, 7);
  m.box(x + 0.9, y + 0.14, z + 0.6, 0.6, 0.28, 0.4, dark);
}

// Jade quarried from the polished face and stacked by it, ready to move.
function quarry(m, ground) {
  const x = 3.35,
    z = -7.0,
    y = footing(ground, x, z, 0.5, 0.4) - 0.02;
  const r = m.rng;
  m.frame(x, y, z, -0.25, 1, () => {
    let h = 0;
    for (let j = 0; j < 4; j++) {
      const t = 0.12 + r.range(0, 0.06),
        w = 0.9 - j * 0.08,
        d = 0.55 - j * 0.04;
      m.frame(r.range(-0.05, 0.05), h + t / 2, r.range(-0.04, 0.04), r.range(-0.12, 0.12), 1, () => {
        m.box(0, 0, 0, w, t, d, j % 2 ? jadeDeep : 0x7fb6a0);
        m.box(0, t / 2 + 0.002, 0, w - 0.04, 0.004, d - 0.04, j === 3 ? frostC : jade);
      });
      h += t;
    }
    // Wedges and a mallet left on the rock.
    for (let k = 0; k < 3; k++) m.box(0.62 + k * 0.08, 0.03, 0.2, 0.05, 0.05, 0.14, 0x3a4244);
    m.box(0.7, 0.05, -0.18, 0.12, 0.1, 0.2, 0x5b4a3c);
    m.tube([0.7, 0.05, -0.08], [0.72, 0.05, 0.3], 0.018, 0.018, 0x7a6450, 5);
  });
}

// Boulders with a sawn face of jade, scree, and frost flowers on the rock.
function boulders(m, ground, keep) {
  const r = m.rng;
  let placed = 0;
  // Kept to the far and side rock: on the near side they would stand
  // between the camera and the board.
  for (let k = 0; k < 900 && placed < 18; k++) {
    const x = r.range(-10.5, 10.5),
      z = r.range(-9.5, 3.5),
      d = ground.margin(x, z),
      y = ground.terrain(x, z);
    if (d < 0.9 || y < waterLine + 0.15 || !keep(x, z, 0.5)) continue;
    placed++;
    const s = r.range(0.13, 0.3),
      turn = r.range(0, circle);
    m.rock(x, y - s * 0.3, z, s, s * r.range(0.7, 1.1), s * r.range(0.7, 1), 0x5f7672, 0xb4c7c0, 8, turn);
    // The sawn face: a flat of polished jade on the side toward the board.
    const toward = Math.atan2(-z, -x),
      fx = x + Math.cos(toward) * s * 0.78,
      fz = z + Math.sin(toward) * s * 0.66;
    if (r.next() < 0.6)
      m.frame(fx, y + s * 0.35, fz, -toward + Math.PI / 2, 1, () => {
        const ring = [];
        for (let j = 0; j < 7; j++) {
          const t = (j * circle) / 7;
          ring.push([Math.cos(t) * s * 0.5, Math.sin(t) * s * 0.4, 0]);
        }
        m.face(ring, ring.map(([, v]) => m.mix(0x5fa58f, 0xc5ecdc, 0.5 + v / s)));
      }, 0.2);
  }
  // Frost flowers: little rosettes of rime blades at the edge of the rock.
  for (let k = 0; k < 2400 && placed < 18 + 190; k++) {
    const x = r.range(-11, 11),
      z = r.range(-10, 9.5),
      d = ground.margin(x, z),
      y = ground.terrain(x, z);
    if (d < 0.12 || y < waterLine + 0.02 || !keep(x, z, 0.2)) continue;
    placed++;
    const n = 5 + Math.floor(r.next() * 4),
      size = r.range(0.04, 0.11),
      turn = r.range(0, circle);
    for (let j = 0; j < n; j++) {
      const a = turn + (j * circle) / n + r.range(-0.2, 0.2),
        l = size * r.range(0.6, 1.2);
      m.leaf(
        [x, y + 0.012, z],
        [x + Math.cos(a) * l, y + 0.016 + l * 0.15, z + Math.sin(a) * l],
        l * 0.22,
        0xb7cfcb,
        0xe2efed,
        0.01
      );
    }
  }
}

// Pebbles drifted at the foot of the rock, and glazes of ice where seepage
// has frozen on the slope between the walkway and the lake. All of it lies
// flat, so it may lie on the near side too.
function litter(m, ground) {
  const r = m.rng,
    at = (x, z) => ground.terrain(x, z);
  let n = 0;
  for (let k = 0; k < 4000 && n < 430; k++) {
    const x = r.range(-10.5, 10.5),
      z = r.range(-10, 9.5),
      d = ground.margin(x, z),
      y = at(x, z);
    if (d < 0.15 || d > 2.4 || y < waterLine + 0.03) continue;
    // Gathered in drifts: thicker in the hollows of a slow noise.
    const drift = 0.5 + 0.5 * Math.sin(x * 1.9 + Math.sin(z * 1.3) * 2) * Math.sin(z * 2.2 - x * 0.7);
    if (r.next() > drift) continue;
    n++;
    if (r.next() < 0.82) {
      const s = r.range(0.03, 0.085),
        c = r.pick([0x5b716e, 0x687f7a, 0x4f6563, 0x7b908a]);
      m.rock(x, y - s * 0.35, z, s, s * r.range(0.5, 0.8), s * r.range(0.6, 1), c, m.mix(c, 0xc4d6d1, 0.5), 5, r.range(0, circle));
    } else {
      // A glaze of seep ice: a flat, pale, irregular sheet on the slope.
      const rx = r.range(0.08, 0.22),
        rz = rx * r.range(0.4, 0.8),
        turn = r.range(0, circle),
        ring = [];
      for (let j = 0; j < 8; j++) {
        const a = -(j * circle) / 8,
          q = r.range(0.7, 1),
          u = Math.cos(a) * rx * q,
          v = Math.sin(a) * rz * q,
          px = x + u * Math.cos(turn) - v * Math.sin(turn),
          pz = z + u * Math.sin(turn) + v * Math.cos(turn);
        ring.push([px, at(px, pz) + 0.014, pz]);
      }
      m.face(ring, ring.map((p, j) => m.mix(0x9fbcb8, 0xd9e9e6, (j % 3) / 3)));
    }
  }
}

function tombDressing(T, ground) {
  const m = new Model(T, 772233),
    flames = [];
  // Places already taken by the cave's own pieces and by those here.
  const taken = [
    [-5.7, -8.15, 1.4], [-4.0, -8.6, 0.9], [4.75, -8.25, 1.35], [6.5, -7.85, 0.9],
    [-8.25, -3.3, 1.4], [-8.3, -1.2, 0.8], [8.25, -4.1, 1.4], [8.05, -1.9, 0.7],
    [-6.75, -5.75, 1.0], [-6.42, 0.62, 0.4], [-6.42, 5.2, 0.4], [1.68, -6.61, 1.4],
    [4.45, 6.36, 0.6], [3.98, 6.73, 0.4], [-0.25, 6.9, 0.9], [-0.63, -7.51, 2.1],
    [bedLight[0], bedLight[2], 1.6], [-8.55, -7.75, 1.0], [-9.32, -6.3, 0.7], [-9.2, 4.25, 0.7],
    [-7.85, -6.75, 1.1], [-3.35, -7.25, 0.6], [7.55, -1.05, 1.1], [3.35, -7.0, 0.7],
    [-8.95, -5.35, 0.5], [-9.25, 3.25, 0.5]
  ];
  const keep = (x, z, pad) =>
    !taken.some(([u, v, rr]) => Math.hypot(x - u, z - v) < rr + pad) &&
    !(x > -8.7 && x < -5.6 && z > 0.3 && z < 5.0);
  jadeBed(m, ground);
  altar(m, ground, flames);
  shelves(m, ground);
  tableAndStools(m, ground);
  cauldron(m, ground);
  stele(m, ground);
  quarry(m, ground);
  boulders(m, ground, keep);
  litter(m, ground);
  const things = m.finish('古墓陳設', { occluder: true });
  // The two candle flames shine warm, apart from the jade of the bed.
  const f = new Model(T, 772239);
  f.glow(() => {
    for (const [x, y, z] of flames) f.crystal(x, y, z, 0.022, 0.08, 0xe49a4c, 0xffe3a2, 6, 0.004);
  });
  return [things, f.finish('古墓燈火', { cast: false })];
}

export { tombDressing };
