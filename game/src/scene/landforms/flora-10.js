// 神龍島's plants in layers: coconut palms and screw-pines on the shore; ferns, hibiscus and wild
// ginger at the wood's edge; leaf litter and fallen canes under the bamboo. The bamboo, banana and
// taro themselves are in landform-10.js; this module only adds the layers between them.
import { circle, midway } from '../scenery-kit.js';
import { AGED, CANE, court, fbm, thicket, trail } from './landform-10.js';

const FROND = [0x5a8a3c, 0x6f9c45, 0x4f7f3a, 0x81a64e];
const SCREW = [0x5f8a52, 0x6f9658, 0x587f4c, 0x84a060];
const FERN = [0x4e8044, 0x5f9149, 0x417238, 0x6c9a4e];

// A coconut palm: a ringed trunk bowing away from the land, a crown of feathered fronds, a
// dead one hanging, nuts under the crown.
function palm(m, x, y, z, h, a, bow) {
  const r = m.rng,
    lean = [Math.cos(a), Math.sin(a)];
  const at = (t) => {
    const out = bow * h * Math.pow(t, 1.7);
    return [x + lean[0] * out, y + h * t * (1 - 0.08 * bow * t), z + lean[1] * out];
  };
  for (let k = 0; k < 9; k++) {
    const t0 = k / 9,
      t1 = (k + 1) / 9;
    m.tube(at(t0), at(t1), 0.1 - 0.035 * t0, 0.1 - 0.035 * t1, k % 2 ? 0x8d7c62 : 0x76684f, 6);
  }
  const top = at(1);
  m.tube([top[0], top[1] - 0.06, top[2]], [top[0], top[1] + 0.08, top[2]], 0.09, 0.06, 0x7f8a4a, 6);
  for (let k = 0; k < 3; k++) {
    const b = k * 2.1 + r.next();
    m.crystal(top[0] + Math.cos(b) * 0.09, top[1] - 0.16, top[2] + Math.sin(b) * 0.09, 0.06, 0.12, 0x6f7a3a, 0x9aa050, 5);
  }
  const fronds = 10;
  for (let f = 0; f < fronds; f++) {
    const b = (f * circle) / fronds + r.range(-0.2, 0.2),
      dead = f === 3,
      l = h * r.range(0.42, 0.55) * (dead ? 0.8 : 1),
      rise = dead ? -0.9 : r.range(0.15, 0.55),
      dir = [Math.cos(b), Math.sin(b)];
    const q = (s) => [
      top[0] + dir[0] * l * s * (dead ? 0.35 : 1),
      top[1] + l * (rise * s - (dead ? 0.2 : 0.75) * s * s),
      top[2] + dir[1] * l * s * (dead ? 0.35 : 1)
    ];
    m.line([q(0), q(0.33), q(0.66), q(1)], 0.012, dead ? 0x9a8455 : 0x6b7d3c, 3);
    const tone = dead ? 0xa08a52 : r.pick(FROND),
      light = dead ? 0xb59c62 : m.mix(tone, 0xb8c870, 0.3);
    for (let k = 1; k <= 8; k++) {
      const s = k / 9,
        p = q(s),
        size = l * 0.24 * Math.sin(Math.PI * (0.25 + 0.7 * s));
      for (const side of [-1, 1]) {
        const px = -dir[1] * side,
          pz = dir[0] * side;
        m.leaf(
          p,
          [p[0] + (px + dir[0] * 0.5) * size, p[1] - size * (dead ? 0.9 : 0.45), p[2] + (pz + dir[1] * 0.5) * size],
          size * 0.14,
          tone,
          light,
          size * 0.06
        );
      }
    }
  }
}

// 林投 (screw-pine): stilt roots, a forked grey trunk, a spiral tuft of long saw-edged blades
// at each tip, and the orange pineapple fruit hanging in one.
function screwPine(m, x, y, z, h) {
  const r = m.rng,
    base = [x, y + h * 0.28, z];
  for (let k = 0; k < 5; k++) {
    const a = (k * circle) / 5 + r.range(-0.3, 0.3),
      reach = h * r.range(0.18, 0.28);
    m.line(
      [base, [x + Math.cos(a) * reach * 0.6, y + h * 0.12, z + Math.sin(a) * reach * 0.6], [x + Math.cos(a) * reach, y - 0.02, z + Math.sin(a) * reach]],
      0.02,
      0x8a7d68,
      4
    );
  }
  const fork = [x + r.range(-0.08, 0.08), y + h * 0.6, z + r.range(-0.08, 0.08)];
  m.tube(base, fork, 0.06, 0.05, 0x8c8272, 5);
  const tips = 2 + (r.next() < 0.5 ? 1 : 0);
  for (let t = 0; t < tips; t++) {
    const a = (t * circle) / tips + r.range(0, 1),
      tip = [fork[0] + Math.cos(a) * h * 0.22, fork[1] + h * r.range(0.25, 0.38), fork[2] + Math.sin(a) * h * 0.22];
    m.tube(fork, tip, 0.04, 0.03, 0x8c8272, 5);
    for (let k = 0; k < 13; k++) {
      const b = k * 2.4,
        l = h * r.range(0.3, 0.45),
        up = r.range(-0.2, 0.6);
      m.leaf(
        tip,
        [tip[0] + Math.cos(b) * l, tip[1] + l * up - (up < 0.2 ? 0.2 * l : 0), tip[2] + Math.sin(b) * l],
        l * 0.07,
        r.pick(SCREW),
        0xa4b878,
        l * 0.18
      );
    }
    if (t === 0) m.crystal(tip[0], tip[1] - 0.22, tip[2], 0.08, 0.18, 0xc8702c, 0xe8a040, 6);
  }
}

// A fern: fronds arching out of one crown, each with its leaflets in pairs, shorter toward
// the tip.
function fern(m, x, y, z, s) {
  const r = m.rng,
    n = 6 + Math.floor(r.next() * 3),
    tone = r.pick(FERN);
  for (let f = 0; f < n; f++) {
    const b = (f * circle) / n + r.range(-0.25, 0.25),
      l = s * r.range(0.7, 1),
      rise = r.range(0.5, 0.9),
      dir = [Math.cos(b), Math.sin(b)];
    const q = (t) => [x + dir[0] * l * t * 0.8, y + l * (rise * t - 0.7 * t * t), z + dir[1] * l * t * 0.8];
    for (let k = 1; k <= 5; k++) {
      const t = k / 6,
        p = q(t),
        size = l * 0.26 * (1 - t * 0.7);
      for (const side of [-1, 1])
        m.leaf(
          p,
          [p[0] + (-dir[1] * side + dir[0] * 0.4) * size, p[1] - size * 0.25, p[2] + (dir[0] * side + dir[1] * 0.4) * size],
          size * 0.22,
          tone,
          m.mix(tone, 0xa8c070, 0.35),
          size * 0.05
        );
    }
    m.leaf(q(0.8), q(1.05), l * 0.04, tone, tone, 0);
  }
}

// 扶桑: a low bush of glossy leaves starred with red flowers.
function hibiscus(m, x, y, z, s) {
  const r = m.rng;
  for (let j = 0; j < 6; j++) {
    const a = (j * circle) / 6 + r.range(-0.3, 0.3),
      end = [x + Math.cos(a) * s * 0.45, y + s * r.range(0.55, 0.95), z + Math.sin(a) * s * 0.45];
    m.tube([x, y, z], end, 0.012, 0.008, 0x6a5a40, 3);
    for (let k = 0; k < 4; k++) {
      const p = midway([x, y + s * 0.2, z], end, 0.4 + k * 0.2),
        b = a + (k % 2 ? 1 : -1) * r.range(0.6, 1.4),
        l = s * r.range(0.18, 0.26);
      m.leaf(p, [p[0] + Math.cos(b) * l, p[1] + l * 0.15, p[2] + Math.sin(b) * l], l * 0.42, 0x3f7a3a, 0x5f9a4a, l * 0.1);
    }
    if (j % 2 === 0)
      for (let k = 0; k < 5; k++) {
        const b = (k * circle) / 5 + j;
        m.leaf(end, [end[0] + Math.cos(b) * s * 0.11, end[1] + s * 0.04, end[2] + Math.sin(b) * s * 0.11], s * 0.05, 0xd8382e, 0xf06a4a, s * 0.02);
      }
  }
}
// Wild ginger: a clump of ginger, tall stalks of paired blades and a hanging spray of white-and-pink
// flowers.
function ginger(m, x, y, z, s) {
  const r = m.rng;
  for (let j = 0; j < 5; j++) {
    const a = r.range(0, circle),
      foot = [x + Math.cos(a) * s * 0.12, y, z + Math.sin(a) * s * 0.12],
      tip = [foot[0] + Math.cos(a) * s * 0.25, y + s * r.range(0.8, 1.15), foot[2] + Math.sin(a) * s * 0.25];
    m.tube(foot, tip, 0.012, 0.008, 0x6f9050, 3);
    for (let k = 1; k <= 4; k++) {
      const p = midway(foot, tip, k / 5),
        b = a + (k % 2 ? 1.5 : -1.5),
        l = s * 0.32;
      m.leaf(p, [p[0] + Math.cos(b) * l, p[1] - l * 0.15, p[2] + Math.sin(b) * l], l * 0.18, 0x4f8a4a, 0x7db562, l * 0.1);
    }
    if (j === 0) {
      m.tube(tip, [tip[0] + 0.05, tip[1] - 0.16, tip[2]], 0.025, 0.018, 0xf0e4d8, 4);
      m.crystal(tip[0] + 0.05, tip[1] - 0.2, tip[2], 0.022, 0.05, 0xe07a8a, 0xf0b0b8, 4);
    }
  }
}

// 草海桐: a low mound of fleshy spoon-shaped leaves at the top of the beach, white half-flowers
// among them.
function naupaka(m, x, y, z, s) {
  const r = m.rng;
  for (let k = 0; k < 16; k++) {
    const a = k * 2.4 + r.range(-0.3, 0.3),
      reach = s * Math.sqrt((k + 1) / 16) * 0.55,
      p = [x + Math.cos(a) * reach * 0.4, y + s * (0.5 - 0.3 * (reach / s)), z + Math.sin(a) * reach * 0.4],
      l = s * r.range(0.3, 0.42);
    m.leaf(p, [p[0] + Math.cos(a) * l, p[1] + l * r.range(-0.1, 0.35), p[2] + Math.sin(a) * l], l * 0.32, r.pick([0x5f9a58, 0x74a860, 0x4f8a4e]), 0x9cc680, l * 0.12);
  }
  for (let k = 0; k < 3; k++) {
    const a = r.range(0, circle),
      p = [x + Math.cos(a) * s * 0.3, y + s * 0.55, z + Math.sin(a) * s * 0.3];
    m.leaf(p, [p[0] + 0.05, p[1] + 0.02, p[2] + 0.03], 0.025, 0xf4f0e4, 0xffffff, 0.01);
  }
}

// A cane felled by the wind, lying across the grove floor, its nodes standing out.
function fallenCulm(m, isle, x, z) {
  const r = m.rng,
    a = r.range(0, circle),
    l = r.range(1.6, 2.6),
    thick = r.range(0.035, 0.05),
    tone = r.pick([AGED[0], AGED[2], m.mix(CANE[1], AGED[1], 0.6)]);
  const p = (t) => {
    const px = x + Math.cos(a) * l * t,
      pz = z + Math.sin(a) * l * t;
    return [px, isle.surface(px, pz) + thick * 0.8 + 0.1 * t * t, pz];
  };
  for (let k = 0; k < 5; k++) {
    m.tube(p(k / 5), p((k + 1) / 5), thick, thick * 0.94, tone, 5);
    if (k) {
      const n = p(k / 5);
      m.tube([n[0] - Math.cos(a) * 0.012, n[1], n[2] - Math.sin(a) * 0.012], [n[0] + Math.cos(a) * 0.012, n[1], n[2] + Math.sin(a) * 0.012], thick * 1.2, thick * 1.2, 0x8a7444, 5);
    }
  }
  const end = p(1);
  for (let k = 0; k < 4; k++) {
    const b = a + r.range(-1, 1);
    m.leaf(end, [end[0] + Math.cos(b) * 0.3, end[1] - 0.05, end[2] + Math.sin(b) * 0.3], 0.04, 0xb8a466, 0x9c8a50, 0.02);
  }
}

// The groves' floor and edges: litter of dry leaves under the canes, fallen canes, ferns and
// ginger where the light comes in, red hibiscus by the hall.
function undergrowth(m, isle) {
  const r = m.rng;
  for (let k = 0; k < 6000; k++) {
    const x = r.range(-13.5, 9.5),
      z = r.range(-19.5, 5.5),
      dense = thicket(isle, x, z);
    if (dense < 0.15 || r.next() > dense) continue;
    const a = r.range(0, circle),
      l = r.range(0.05, 0.1),
      y = isle.surface(x, z) + 0.012;
    m.face(
      [
        [x, y, z],
        [x + Math.cos(a + 0.4) * l * 0.5, y, z + Math.sin(a + 0.4) * l * 0.5],
        [x + Math.cos(a) * l, y, z + Math.sin(a) * l],
        [x + Math.cos(a - 0.4) * l * 0.5, y, z + Math.sin(a - 0.4) * l * 0.5]
      ],
      r.pick([0xc2ad6e, 0xa8925a, 0x8f7c4c, 0xb8a060]),
      r.range(0.85, 1.05)
    );
  }
  for (let k = 0, made = 0; k < 3000 && made < 16; k++) {
    const x = r.range(-13, 9),
      z = r.range(-18, 5);
    if (thicket(isle, x, z) < 0.5 || isle.off(x, z) < 1.4) continue;
    fallenCulm(m, isle, x, z);
    made++;
  }
  // Ferns and ginger along the edges of the groves and in their glades.
  for (let k = 0, made = 0; k < 8000 && made < 50; k++) {
    const x = r.range(-13.5, 9.5),
      z = r.range(-19.5, 5.5),
      dense = thicket(isle, x, z),
      out = isle.off(x, z);
    if (dense < 0.05 || dense > 0.85 || out < 0.6 || court(x, z) > 0.05 || trail(x, z) > 0.05) continue;
    const size = Math.min(r.range(0.35, 0.62), isle.headroom(x, z) * 0.9);
    if (size < 0.25) continue;
    const y = isle.surface(x, z) - 0.01;
    if (made % 4 === 3) ginger(m, x, y, z, size * 1.4);
    else fern(m, x, y, z, size);
    made++;
  }
  // Hibiscus round the hall's terrace and the forecourt corners.
  for (const [x, z, s] of [
    [-6.3, -7.6, 0.75],
    [-6.6, -9.2, 0.85],
    [6.4, -7.9, 0.8],
    [6.6, -9.6, 0.7],
    [-6.0, -11.5, 0.9],
    [6.2, -11.9, 0.85],
    [-7.4, -5.4, 0.6],
    [7.6, -4.9, 0.6]
  ])
    hibiscus(m, x, isle.surface(x, z) - 0.02, z, s);
}

// Palms and screw-pines along the top of the beach, leaning seaward, wherever they will not
// stand between the cameras and a tile.
function shoreTrees(m, isle) {
  const r = m.rng,
    placed = [];
  const clear = (x, z, gap) => placed.every(([px, pz]) => Math.hypot(px - x, pz - z) > gap);
  const seaward = (x, z) => {
    const gx = isle.inland(x + 0.3, z) - isle.inland(x - 0.3, z),
      gz = isle.inland(x, z + 0.3) - isle.inland(x, z - 0.3);
    return Math.atan2(-gz, -gx);
  };
  for (let k = 0, made = 0; k < 6000 && made < 16; k++) {
    const x = r.range(-14, 11),
      z = r.range(-19, 10),
      s = isle.inland(x, z);
    if (s < 0.75 || s > 2.6 || isle.off(x, z) < 1.3 || court(x, z) > 0.05 || trail(x, z) > 0.05) continue;
    if (thicket(isle, x, z) > 0.5 || !clear(x, z, 1.5)) continue;
    const h = r.range(2.6, 3.8),
      a = seaward(x, z),
      bow = r.range(0.25, 0.5),
      tx = x + Math.cos(a) * bow * h,
      tz = z + Math.sin(a) * bow * h;
    if (isle.headroom(tx, tz) < h + 0.6 || isle.headroom(x, z) < h * 0.6) continue;
    palm(m, x, isle.surface(x, z) - 0.05, z, h, a, bow);
    placed.push([x, z]);
    made++;
  }
  for (let k = 0, made = 0; k < 6000 && made < 16; k++) {
    const x = r.range(-14, 11),
      z = r.range(-19, 10),
      s = isle.inland(x, z);
    if (s < 0.6 || s > 2.4 || isle.off(x, z) < 0.9 || court(x, z) > 0.05 || trail(x, z) > 0.05) continue;
    if (!clear(x, z, 1.0) || fbm(x * 0.6 + 11, z * 0.6 - 4) < 0.4) continue;
    const h = r.range(1.3, 2.0);
    if (isle.headroom(x, z) < h + 0.3) continue;
    screwPine(m, x, isle.surface(x, z), z, h);
    placed.push([x, z]);
    made++;
  }
  // Beach scrub along the top of the sand, low enough to stand anywhere off the board.
  for (let k = 0, made = 0; k < 5000 && made < 26; k++) {
    const x = r.range(-13, 10),
      z = r.range(-13, 9.5),
      s = isle.inland(x, z);
    if (s < 1.0 || s > 2.3 || isle.off(x, z) < 0.45 || court(x, z) > 0.05 || trail(x, z) > 0.05) continue;
    if (!clear(x, z, 0.7)) continue;
    const size = Math.min(r.range(0.45, 0.7), isle.headroom(x, z));
    if (size < 0.3) continue;
    naupaka(m, x, isle.surface(x, z) - 0.03, z, size);
    placed.push([x, z]);
    made++;
  }
}

export { shoreTrees, undergrowth };
