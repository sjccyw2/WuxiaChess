// 神龍島's landing beach: tide pools among the reef rocks, shells and footprints on the sand,
// woven fish traps, mooring posts and floats, and bamboo racks for drying fish.
// 都貼著沙面，低矮，不擋棋盤。
import { circle } from '../scenery-kit.js';
import { AGED, fbm, sea } from './landform-10.js';

// A pool left among the reef rock by the ebb: still green water in a ring of wet stones, a
// fringe of weed.
function tidePool(m, isle, x, z, rad, stone) {
  const r = m.rng,
    n = 9,
    y = isle.surface(x, z) + 0.012,
    edge = Array.from({ length: n }, () => r.range(0.75, 1.2));
  const at = (i, k) => {
    const a = (-i * circle) / n,
      e = edge[Math.floor(i) % n];
    return [x + Math.cos(a) * rad * e * k, y, z + Math.sin(a) * rad * e * k * 0.8];
  };
  m.face(Array.from({ length: n }, (_, i) => at(i, 1.12)), 0x6f7a5c);
  m.face(
    Array.from({ length: n }, (_, i) => {
      const p = at(i, 0.92);
      return [p[0], p[1] + 0.004, p[2]];
    }),
    0x3f6a66
  );
  for (let i = 0; i < n; i++) {
    if (r.next() < 0.35) continue;
    const p = at(i + 0.5, 1.12),
      s = rad * r.range(0.18, 0.32);
    stone(m, p[0], y - 0.03, p[2], s, s * r.range(0.6, 1.1), s * 0.8, 6, true);
  }
  for (let k = 0; k < 4; k++) {
    const p = at(Math.floor(r.next() * n), 0.95),
      a = r.range(0, circle);
    m.leaf(p, [p[0] + Math.cos(a) * 0.1, y + 0.006, p[2] + Math.sin(a) * 0.1], 0.025, 0x5d7a3a, 0x7a9448, 0.004);
  }
}

// A shell on the sand: a cockle fan or a spiral whelk.
function shell(m, x, y, z, s, kind, tone) {
  const r = m.rng,
    a = r.range(0, circle);
  if (kind) {
    m.crystal(x, y, z, s * 0.5, s * 1.1, tone, 0xf4ece0, 5, s * 0.3);
    return;
  }
  const ring = [[x, y + s * 0.25, z]];
  for (let k = 0; k <= 4; k++) {
    const b = a - 0.9 + (k * 1.8) / 4;
    ring.push([x + Math.cos(b) * s, y + 0.003, z + Math.sin(b) * s]);
  }
  m.face(ring, tone);
}

// A conical fish trap of split cane: a lathe of hoops and staves, its mouth turned in.
function fishTrap(m, x, y, z, yaw, tilt, s) {
  m.frame(
    x,
    y,
    z,
    yaw,
    s,
    () => {
      m.lathe(
        0,
        0,
        0,
        [
          [0, 0.17],
          [0.18, 0.2],
          [0.4, 0.17],
          [0.58, 0.1],
          [0.7, 0.03]
        ],
        0xb39a5e,
        9
      );
      for (const h of [0.02, 0.2, 0.42]) m.hoop(0, h, 0, h > 0.3 ? 0.165 : 0.2, 0.012, AGED[3], 9);
      m.face(
        Array.from({ length: 9 }, (_, j) => [Math.cos((j * circle) / 9) * 0.16, 0.005, Math.sin((j * circle) / 9) * 0.16]),
        0x4a3c28
      );
    },
    Math.PI / 2 - 0.12,
    tilt
  );
}

// Fish split and hung on a low cane frame to dry in the sun.
function fishRack(m, x, y, z, yaw) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const u of [-0.7, 0.7])
      for (const side of [-1, 1]) m.tube([u, 0, side * 0.22], [u, 0.62, 0], 0.022, 0.02, AGED[1], 4);
    m.tube([-0.82, 0.6, 0], [0.82, 0.6, 0], 0.022, 0.022, AGED[0], 4);
    for (let k = 0; k < 8; k++) {
      const u = -0.6 + k * 0.17;
      m.leaf([u, 0.6, 0], [u + 0.01, 0.38 - 0.03 * (k % 3), 0.02], 0.045, 0xa8a090, 0xc8bca0, 0.01);
    }
  });
}

// The beach between the boats and the board: tide pools among the reef rock, shells and
// coral on the sand, the party's footprints up from the landing, traps and floats by the
// stage, a rack of fish drying, posts the boats tie up to.
function beachcombing(m, isle, stone) {
  const r = m.rng;
  for (let k = 0, made = 0; k < 4000 && made < 14; k++) {
    const x = r.range(-13, 9.5),
      z = r.range(-12, 9.8),
      s = isle.inland(x, z);
    if (s < 0.2 || s > 0.6 || isle.off(x, z) < 0.8 || fbm(x * 0.5 + 20, z * 0.5) < 0.42) continue;
    tidePool(m, isle, x, z, r.range(0.22, 0.38), stone);
    made++;
  }
  for (let k = 0; k < 2600; k++) {
    const x = r.range(-13, 9.5),
      z = r.range(-12, 9.8),
      s = isle.inland(x, z);
    if (s < 0.3 || s > 1.6 || isle.off(x, z) < 0.15 || r.next() < 0.75) continue;
    const kind = r.next() < 0.3 ? 1 : 0;
    shell(
      m,
      x,
      isle.surface(x, z) + 0.012,
      z,
      r.range(0.025, 0.05),
      kind,
      r.pick([0xf0e6d4, 0xe8c8b8, 0xd8b088, 0xf4f0e8, 0xc89a80])
    );
  }
  // Bits of white coral broken off the reef.
  for (let k = 0; k < 600; k++) {
    const x = r.range(-13, 9.5),
      z = r.range(-12, 9.8),
      s = isle.inland(x, z);
    if (Math.abs(s - 0.5) > 0.2 || r.next() < 0.7) continue;
    const y = isle.surface(x, z) + 0.01,
      a = r.range(0, circle);
    for (let j = 0; j < 3; j++) {
      const b = a + j * 1.4;
      m.tube([x, y, z], [x + Math.cos(b) * 0.06, y + 0.035, z + Math.sin(b) * 0.06], 0.012, 0.008, 0xe8e2d4, 3);
    }
  }
  // Footprints up from the two boats on the south beach to the board's foot.
  for (const [x0, z0, x1, z1] of [
    [-1.6, 7.6, -0.7, 6.15],
    [2.1, 7.7, 1.0, 6.15],
    [-1.1, 7.7, 0.4, 6.2]
  ]) {
    const steps = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.16),
      a = Math.atan2(z1 - z0, x1 - x0);
    for (let k = 0; k <= steps; k++) {
      const t = k / steps,
        side = k % 2 ? 1 : -1,
        x = x0 + (x1 - x0) * t - Math.sin(a) * side * 0.05,
        z = z0 + (z1 - z0) * t + Math.cos(a) * side * 0.05,
        y = isle.surface(x, z) + 0.011;
      m.face(
        Array.from({ length: 6 }, (_, j) => {
          const b = (-j * circle) / 6,
            u = Math.cos(b) * 0.045,
            v = Math.sin(b) * 0.022;
          return [x + Math.cos(a) * u - Math.sin(a) * v, y, z + Math.sin(a) * u + Math.cos(a) * v];
        }),
        0xa49870
      );
    }
  }
  // Traps and cork floats by the landing stage and the net.
  for (const [x, z, yaw, tilt, s] of [
    [6.45, 3.4, 0.4, 0.1, 0.62],
    [6.75, 3.8, 1.2, -0.05, 0.55],
    [-10.3, 2.2, -0.6, 0.1, 0.6],
    [-9.95, 2.45, 0.5, 0.05, 0.5]
  ])
    fishTrap(m, x, isle.surface(x, z) + 0.17 * s, z, yaw, tilt, s);
  for (let k = 0; k < 9; k++) {
    const x = 5.2 + 0.11 * k + r.range(-0.03, 0.03),
      z = 6.2 + 0.05 * Math.sin(k);
    m.crystal(x, isle.surface(x, z), z, 0.045, 0.06, 0xb5493a, 0xe0a060, 5);
  }
  fishRack(m, -9.6, isle.surface(-9.6, 3.4) - 0.02, 3.4, 1.1);
  fishRack(m, 7.6, isle.surface(7.6, 0.2) - 0.02, 0.2, 1.4);
  // Mooring posts standing in the shallows off the south beach, and the stage's bollards.
  for (const [x, z, h] of [
    [-3.2, 9.6, 0.5],
    [0.2, 9.9, 0.45],
    [3.9, 9.5, 0.55],
    [-12.2, 0.2, 0.5]
  ]) {
    const foot = Math.min(sea - 0.25, isle.surface(x, z));
    m.tube([x, foot, z], [x, sea + h, z], 0.045, 0.04, 0x6f5a44, 5);
    m.tube([x, sea + 0.02, z], [x, sea + 0.12, z], 0.05, 0.05, 0x3f4a3c, 5);
    m.tube([x, sea + h - 0.12, z], [x, sea + h - 0.08, z], 0.055, 0.055, 0xcabb94, 5);
  }
}

export { beachcombing };
