// 萬安寺's plants and the life of its paving: old ginkgos gone gold, their leaves drifting over
// the bricks; dwarf pines and shrubs in glazed pots; bamboo behind the walls; puddles from the
// evening's rain holding the lamplight; moss and cracks in the old brick.
import { circle } from '../scenery-kit.js';
import { clump, pottedPine, bamboo } from './garden-13.js';
import { put, OUT } from './kit-17.js';

const bark = 0x3b322c;
const barkLight = 0x5a4c40;
const gold = 0x9c7a26; // ginkgo in autumn, in shadow
const goldLight = 0xe2bb52;
const leafTones = [0xc89a34, 0xdcb24a, 0xb0842c, 0xe6c662];
const GARDEN = 0.02; // where garden-13's plants stand of themselves

// A garden-13 plant drawn standing on ground at height y instead of its own.
function standing(m, y, draw) {
  m.frame(0, y - GARDEN, 0, 0, 1, draw);
}

// 銀杏: an old ginkgo, a straight grey trunk with limbs rising steeply, its crown in gold.
function ginkgo(m, x, z, s = 1, y = OUT) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    m.tube([0, 0, 0], [0, 0.35, 0], 0.22, 0.14, bark, 7);
    const trunk = [
      [0, 0, 0],
      [0.04, 1.0, 0.02],
      [-0.02, 1.9, -0.03],
      [0.03, 2.7, 0.01],
      [0, 3.3, 0]
    ];
    m.line(trunk, 0.12, bark, 7);
    for (let k = 0; k < 7; k++) {
      const a = k * 2.3 + r.range(-0.3, 0.3),
        h = 1.3 + k * 0.28,
        reach = (1.05 - k * 0.08) * r.range(0.85, 1.1),
        seat = [0, h, 0],
        tip = [Math.cos(a) * reach, h + 0.55 + r.range(0, 0.2), Math.sin(a) * reach];
      m.line([seat, [tip[0] * 0.5, h + 0.35, tip[2] * 0.5], tip], 0.045 - k * 0.004, barkLight, 4);
      clump(m, tip[0], tip[1] + 0.12, tip[2], 0.5 - k * 0.03, 0.4, 0.46 - k * 0.03, gold, goldLight, 7);
    }
    clump(m, 0, 3.45, 0, 0.55, 0.45, 0.5, gold, goldLight, 7);
    clump(m, 0.25, 2.6, -0.2, 0.6, 0.45, 0.55, gold, goldLight, 7);
  });
}
// Fallen leaves on the ground about (x, z), thinning out to radius `spread`.
function fallenLeaves(m, x, z, spread, n, y = OUT, tones = leafTones) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const a = r.range(0, circle),
      d = spread * Math.sqrt(r.next()),
      px = x + Math.cos(a) * d,
      pz = z + Math.sin(a) * d,
      b = r.range(0, circle),
      l = r.range(0.05, 0.08);
    m.leaf(
      [px, y + 0.004, pz],
      [px + Math.cos(b) * l, y + 0.006, pz + Math.sin(b) * l],
      l * 0.55,
      r.pick(tones),
      r.pick(tones),
      0.004
    );
  }
}
// A puddle left by the rain: dark water holding a paler sky, and a warm glint of the nearest lamp.
function puddle(m, x, z, rx, rz, y = OUT, glint = true) {
  const r = m.rng,
    n = 11,
    rim = [],
    mid = [];
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n,
      k = r.range(0.75, 1.15);
    rim.push([x + Math.cos(a) * rx * k, y + 0.003, z + Math.sin(a) * rz * k]);
    mid.push([x + Math.cos(a) * rx * k * 0.62, y + 0.004, z + Math.sin(a) * rz * k * 0.62]);
  }
  // Wet brick round the edge, the water a paler grey-blue holding the sky.
  put(m, rim, 0x3a4152);
  put(m, mid, 0x56637c);
  if (glint) {
    const g = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * circle) / 8;
      g.push([x + rx * 0.12 + Math.cos(a) * rx * 0.28, y + 0.005, z - rz * 0.1 + Math.sin(a) * rz * 0.16]);
    }
    put(m, g, 0x9c8c74);
  }
}
// Moss creeping over the joints of the paving round (x, z).
function moss(m, x, z, spread, n, y = OUT) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const px = x + r.range(-spread, spread),
      pz = z + r.range(-spread, spread),
      w = r.range(0.06, 0.16),
      d = r.range(0.04, 0.1);
    put(
      m,
      [
        [px - w, y + 0.002, pz],
        [px - w * 0.3, y + 0.002, pz + d],
        [px + w, y + 0.002, pz + d * 0.4],
        [px + w * 0.4, y + 0.002, pz - d]
      ],
      m.mix(0x24382c, 0x3d5636, r.next())
    );
  }
}
// A crack wandering across the paving from (x, z).
function crack(m, x, z, len, y = OUT) {
  const r = m.rng;
  let a = r.range(0, circle),
    p = [x, z];
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    a += r.range(-0.7, 0.7);
    const q = [p[0] + (Math.cos(a) * len) / steps, p[1] + (Math.sin(a) * len) / steps],
      nx = -Math.sin(a) * 0.008,
      nz = Math.cos(a) * 0.008;
    put(
      m,
      [
        [p[0] - nx, y + 0.002, p[1] - nz],
        [q[0] - nx, y + 0.002, q[1] - nz],
        [q[0] + nx, y + 0.002, q[1] + nz],
        [p[0] + nx, y + 0.002, p[1] + nz]
      ],
      0x171a21
    );
    p = q;
  }
}
// A shrub in a big glazed pot.
function pottedShrub(m, x, z, s = 1, y = OUT, flowers = 0) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    m.lathe(
      0,
      0,
      0,
      [
        [0, 0.16],
        [0.05, 0.2],
        [0.3, 0.25],
        [0.36, 0.22],
        [0.38, 0.24],
        [0.4, 0.2]
      ],
      r.pick([0x2d4f5e, 0x5a3328, 0x3c3a48]),
      9
    );
    m.lathe(0, 0.37, 0, [[0, 0.21], [0.002, 0.21]], 0x2a221c, 9);
    for (const [px, py, pz, k] of [
      [0, 0.62, 0, 0.27],
      [0.13, 0.54, 0.1, 0.18],
      [-0.12, 0.52, -0.08, 0.17]
    ])
      clump(m, px, py, pz, k, k * 0.85, k, 0x1f3a2a, 0x3f6646, 7);
    for (let i = 0; i < flowers; i++) {
      const a = r.range(0, circle),
        d = r.range(0.1, 0.24);
      m.box(Math.cos(a) * d, r.range(0.6, 0.78), Math.sin(a) * d, 0.045, 0.045, 0.045, r.pick([0xe8d07a, 0xd8a8c8, 0xf0e8d8]));
    }
  });
}
// A dwarf pine on its stand, standing at y.
function bonsai(m, x, z, s = 1, yaw = 0, y = OUT) {
  standing(m, y, () => pottedPine(m, x, z, s, yaw));
}
// A clump of bamboo standing at y.
function bambooAt(m, x, z, s = 1, n = 9, y = OUT) {
  standing(m, y, () => bamboo(m, x, z, s, n));
}

export { ginkgo, fallenLeaves, puddle, moss, crack, pottedShrub, bonsai, bambooAt, standing, leafTones };
