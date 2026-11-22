// The valley master's homestead beyond the walls of his stone house: a porch over the hall
// door, a hearth under the alchemy room's cauldron, jars of physic by its door, and east of
// the hall a walled herb yard with its beds, drying racks and well.
import { circle } from '../scenery-kit.js';
import { lerp, stones, mossy, blade, blossom, tuft } from './flora-11.js';

// A porch before the hall door, drawn in the house's frame: two timber posts on stone
// bases, a beam, and a lean-to roof of stone slabs lapped from the eave up.
function porch(m) {
  const r = m.rng,
    timber = 0x5a4130,
    dark = 0x3e2d21,
    base = 0.24;
  for (const side of [-1, 1]) {
    const x = side * 0.78;
    m.box(x, base - 0.13, 0.98, 0.2, 0.1, 0.2, 0x9a9b93);
    m.tube([x, base - 0.08, 0.98], [x, base + 1.62, 0.98], 0.05, 0.045, timber, 6);
    // A bracket under the beam.
    m.tube([x, base + 1.38, 0.98], [x - side * 0.22, base + 1.6, 0.98], 0.022, 0.022, dark, 4);
    // A rafter back to the wall.
    m.tube([x, base + 1.66, 0.98], [x, base + 1.98, 0.02], 0.03, 0.03, dark, 4);
  }
  m.box(0, base + 1.66, 0.98, 1.9, 0.09, 0.1, timber);
  m.box(0, base + 1.98, 0.06, 1.9, 0.08, 0.1, dark);
  // The slabs of the lean-to.
  const rows = 3,
    zLow = 1.18,
    zHigh = 0.02,
    yLow = base + 1.72,
    yHigh = base + 2.06;
  for (let k = 0; k < rows; k++) {
    const t0 = k / rows,
      t1 = Math.min(1, (k + 1) / rows + 0.08),
      z0 = lerp(zLow, zHigh, t0),
      z1 = lerp(zLow, zHigh, t1),
      y0 = lerp(yLow, yHigh, t0) + 0.03,
      y1 = lerp(yLow, yHigh, t1);
    let x = -1.08 + r.range(0, 0.1);
    while (x < 1.05) {
      const e = Math.min(1.1, x + r.range(0.28, 0.42)),
        tone = m.mix(r.pick([0x5f666a, 0x6b7175, 0x565d60, 0x747a7b]), 0x2c2e2c, r.range(0, 0.2));
      m.face([[x + 0.008, y0, z0], [e - 0.008, y0, z0], [e - 0.008, y1, z1], [x + 0.008, y1, z1]], tone);
      m.face([[x + 0.008, y0, z0], [e - 0.008, y0, z0], [e - 0.008, y0 - 0.04, z0], [x + 0.008, y0 - 0.04, z0]], m.mix(tone, 0x2a2c2b, 0.5));
      m.face([[x + 0.008, y0 - 0.04, z0], [e - 0.008, y0 - 0.04, z0], [e - 0.008, y1 - 0.03, z1], [x + 0.008, y1 - 0.03, z1]], 0x34322e);
      x = e;
    }
  }
  // A worn mat of reeds on the threshold, and a pair of straw sandals left by the door.
  m.box(0, base + 0.006, 0.2, 0.7, 0.012, 0.28, 0x9a8a5a);
  for (const x of [0.42, 0.5]) m.box(x, base + 0.015, 0.36, 0.06, 0.02, 0.16, 0xb09a62);
}

// Iron studs in rows on the hall door's leaves (drawn in the house's frame).
function doorStuds(m, x, y, w, h) {
  for (let i = 0; i < 4; i++)
    for (const t of [0.28, 0.66])
      for (const side of [-1, 1]) {
        const cx = x + side * (w / 4) + (i - 1.5) * (w / 10);
        m.box(cx, y + h * t, 0.064, 0.026, 0.026, 0.018, 0x2f3030);
      }
}

// A hearth of fire-blackened stones under the cauldron (drawn in the cauldron's frame),
// embers glowing in it and a little ash spilled before it.
function hearth(m) {
  const r = m.rng;
  for (let k = 0; k < 9; k++) {
    const a = (k * circle) / 9 + r.range(-0.1, 0.1),
      s = r.range(0.06, 0.085);
    m.rock(Math.cos(a) * 0.3, -0.03, Math.sin(a) * 0.3, s, s * 1.1, s * 0.8, m.mix(0x5a5650, 0x2e2c2a, r.next() * 0.6), 0x6a655c, 6);
  }
  m.face(
    Array.from({ length: 9 }, (_, k) => {
      const a = -(k * circle) / 9;
      return [Math.cos(a) * 0.27, 0.012, Math.sin(a) * 0.27];
    }),
    0x3a3532
  );
  m.glow(() => {
    for (let k = 0; k < 6; k++) {
      const a = r.range(0, circle),
        d = r.range(0, 0.13),
        x = Math.cos(a) * d,
        z = Math.sin(a) * d;
      m.face(
        [
          [x - 0.04, 0.02, z],
          [x, 0.05, z + 0.03],
          [x + 0.04, 0.02, z],
          [x, 0.025, z - 0.035]
        ],
        r.pick([0xd8662c, 0xe88a3a, 0xb8481f])
      );
    }
  });
  // Split logs laid in the fire.
  for (let k = 0; k < 3; k++) {
    const a = k * 2.1 + 0.3;
    m.tube([Math.cos(a) * 0.2, 0.03, Math.sin(a) * 0.2], [Math.cos(a) * 0.02, 0.06, Math.sin(a) * 0.02], 0.022, 0.018, 0x4a3828, 5);
  }
}

// Big glazed jars of physic in a row, lidded, one of them broken-lipped (house frame).
function jars(m, x, z) {
  const r = m.rng,
    glazes = [0x5a4030, 0x3f3a33, 0x7a5a3c, 0x55604e];
  for (let k = 0; k < 4; k++) {
    const cx = x + k * 0.27 + r.range(-0.03, 0.03),
      cz = z + r.range(-0.04, 0.06) + (k % 2) * 0.12,
      s = r.range(0.85, 1.15) * (k === 3 ? 0.7 : 1),
      col = r.pick(glazes);
    m.lathe(
      cx,
      0.03,
      cz,
      [
        [0, 0.07 * s],
        [0.04 * s, 0.1 * s],
        [0.14 * s, 0.13 * s],
        [0.24 * s, 0.11 * s],
        [0.3 * s, 0.065 * s],
        [0.33 * s, 0.07 * s],
        [0.34 * s, 0.002]
      ],
      col,
      10
    );
    // A shine where the glaze catches the light.
    m.face(
      [
        [cx + 0.09 * s, 0.17 * s, cz + 0.09 * s],
        [cx + 0.1 * s, 0.25 * s, cz + 0.07 * s],
        [cx + 0.07 * s, 0.24 * s, cz + 0.1 * s]
      ],
      m.mix(col, 0xd8d0c0, 0.55)
    );
    if (k !== 1) {
      m.lathe(cx, 0.03 + 0.335 * s, cz, [[0, 0.085 * s], [0.02 * s, 0.08 * s], [0.035 * s, 0.03 * s], [0.05 * s, 0.002]], 0x8a7a5a, 8);
      m.box(cx, 0.03 + 0.39 * s, cz, 0.02, 0.02, 0.02, 0xb5483a);
    }
  }
}

// A dry-stone wall from a to b over the ground: rough stones in two or three courses and a
// row of cap stones, darker and mossed toward the foot.
function dryWall(m, at, a, b, high = 0.42) {
  const r = m.rng,
    dx = b[0] - a[0],
    dz = b[1] - a[1],
    len = Math.hypot(dx, dz),
    yaw = Math.atan2(-dz, dx);
  const courses = 3,
    thick = 0.26;
  for (let c = 0; c <= courses; c++) {
    const cap = c === courses,
      y0 = (high * c) / courses,
      h = cap ? 0.07 : high / courses;
    let s = cap ? 0 : -r.range(0, 0.12);
    while (s < len) {
      const l = Math.min(len - s, cap ? r.range(0.16, 0.24) : r.range(0.18, 0.34));
      if (l < 0.05) break;
      const mid = s + l / 2,
        x = a[0] + (dx / len) * mid,
        z = a[1] + (dz / len) * mid,
        g = Math.min(at(x - (dz / len) * 0.12, z + (dx / len) * 0.12), at(x + (dz / len) * 0.12, z - (dx / len) * 0.12)),
        tone = cap
          ? m.mix(r.pick(stones), mossy, r.range(0.2, 0.6))
          : m.mix(r.pick(stones), c === 0 ? 0x55604a : 0x6f6f66, r.range(0.15, 0.5));
      m.frame(x, g + y0 + h / 2 - 0.02, z, yaw + r.range(-0.06, 0.06), 1, () =>
        m.box(0, 0, r.range(-0.015, 0.015), l - 0.022, h - 0.014, cap ? thick + 0.04 : thick - 0.02 * c, tone)
      );
      s += l;
    }
  }
}

// The walled herb yard east of the hall, in world coordinates: beds of physic herbs in
// rows, two drying racks hung with bundles, baskets, and a well by its gate.
function herbYard(m, at) {
  const r = m.rng,
    x0 = 8.0,
    x1 = 10.25,
    z0 = -9.9,
    z1 = -6.75,
    gate = 8.8;
  dryWall(m, at, [x0, z0], [x1, z0]);
  dryWall(m, at, [x1, z0], [x1, z1]);
  dryWall(m, at, [x1, z1], [gate + 0.45, z1]);
  dryWall(m, at, [gate - 0.45, z1], [x0, z1]);
  dryWall(m, at, [x0, z1], [x0, z0]);
  // Gateposts.
  for (const x of [gate - 0.45, gate + 0.45]) m.box(x, at(x, z1) + 0.27, z1, 0.16, 0.6, 0.3, 0x8f959a);
  // The beds: tilled earth in long strips, a herb in rows down each.
  const herbs = [
    [0x3d6a3e, 0x6f9a52, null],
    [0x56704a, 0x8aa070, [0xe9e2c8, 0xfbf8ee]],
    [0x4a6a52, 0x7a9a80, [0x8a6cc0, 0xb9a0e0]],
    [0x5d7a3a, 0x9ab05a, [0xd8b545, 0xf2dc78]]
  ];
  for (let b = 0; b < 4; b++) {
    const bx = x0 + 0.42 + b * 0.47,
      bz0 = z0 + 0.4,
      bz1 = z1 - 1.05,
      [shade, light, bloom] = herbs[b];
    const g0 = at(bx, bz0),
      g1 = at(bx, bz1);
    m.face(
      [
        [bx - 0.17, g0 + 0.03, bz0],
        [bx + 0.17, g0 + 0.03, bz0],
        [bx + 0.17, g1 + 0.03, bz1],
        [bx - 0.17, g1 + 0.03, bz1]
      ],
      r.pick([0x5f5540, 0x6a5d46, 0x585039])
    );
    for (let z = bz0 + 0.12; z < bz1 - 0.05; z += 0.2) {
      const y = lerp(g0, g1, (z - bz0) / (bz1 - bz0)) + 0.03,
        turn = r.range(0, circle);
      for (let j = 0; j < 5; j++) {
        const a = turn + (j * circle) / 5,
          l = r.range(0.07, 0.11);
        blade(m, [bx, y, z], [bx + Math.cos(a) * l, y + l * 0.9, z + Math.sin(a) * l], l * 0.3, shade, light);
      }
      if (bloom && r.next() < 0.7) blossom(m, bx + r.range(-0.03, 0.03), y + 0.13, z, 0.025, 0, 0.3, bloom);
    }
  }
  // Drying racks: two poles and three bars hung with bundles of herbs and roots.
  for (const [rx, rz, yaw] of [
    [9.8, -8.6, 1.57],
    [9.75, -6.3, 0.1]
  ]) {
    const g = at(rx, rz) - 0.03;
    m.frame(rx, g, rz, yaw, 1, () => {
      for (const x of [-0.45, 0.45]) m.tube([x, 0, 0], [x, 0.9, 0], 0.022, 0.02, 0x7c6a48, 5);
      for (const y of [0.86, 0.6]) {
        m.tube([-0.52, y, 0], [0.52, y, 0], 0.014, 0.014, 0x8a7650, 4);
        for (let k = 0; k < 6; k++) {
          const x = -0.37 + k * 0.15 + r.range(-0.02, 0.02),
            l = r.range(0.14, 0.24);
          m.tube([x, y - 0.01, 0], [x, y - l, 0], 0.008, r.range(0.03, 0.045), r.pick([0x6d8050, 0x8a8a52, 0x59704a, 0x9a7f52, 0x7a5a3a]), 5);
        }
      }
    });
  }
  // Round baskets of gathered leaves by the beds.
  for (const [bx, bz] of [
    [8.35, -7.3],
    [10.0, -9.6]
  ]) {
    const g = at(bx, bz) - 0.01;
    m.lathe(bx, g, bz, [[0, 0.1], [0.08, 0.13], [0.1, 0.13], [0.09, 0.115], [0.02, 0.1]], 0xa8905a, 10);
    for (let k = 0; k < 5; k++) {
      const a = r.range(0, circle);
      blade(m, [bx, g + 0.09, bz], [bx + Math.cos(a) * 0.09, g + 0.12, bz + Math.sin(a) * 0.09], 0.03, 0x4a6a3c, 0x7a9a58);
    }
  }
  // The well: a round curb of dressed stone, a timber frame with a windlass and its bucket.
  const wx = 9.45,
    wz = -7.37,
    wy = at(wx, wz) - 0.04;
  m.frame(wx, wy, wz, 0.3, 1, () => {
    m.lathe(0, 0, 0, [[0, 0.33], [0.36, 0.34], [0.4, 0.36], [0.44, 0.35], [0.44, 0.27], [0.36, 0.26], [0.36, 0.25]], 0x989a90, 14);
    m.lathe(0, 0.3, 0, [[0, 0.25], [0.002, 0.0]], 0x1d2a28, 14);
    for (const x of [-0.42, 0.42]) {
      m.tube([x, 0, 0], [x, 0.95, 0], 0.035, 0.03, 0x5e4a36, 5);
      m.box(x, 0.97, 0, 0.1, 0.05, 0.1, 0x4a3a2a);
    }
    m.tube([-0.46, 0.82, 0], [0.46, 0.82, 0], 0.045, 0.045, 0x7a6448, 7);
    m.tube([0.46, 0.82, 0], [0.56, 0.82, 0], 0.012, 0.012, 0x3a3a38, 4);
    m.tube([0.56, 0.82, 0], [0.56, 0.68, 0], 0.012, 0.012, 0x3a3a38, 4);
    m.tube([0.05, 0.8, 0], [0.05, 0.52, 0], 0.005, 0.005, 0x9a8a6a, 3);
    m.lathe(0.05, 0.36, 0, [[0, 0.06], [0.12, 0.075], [0.16, 0.002]], 0x6a5038, 8);
    // A little roof over the windlass.
    m.face([[-0.6, 1.0, -0.32], [0.6, 1.0, -0.32], [0.6, 1.18, 0], [-0.6, 1.18, 0]], 0x5f666a);
    m.face([[-0.6, 1.0, 0.32], [0.6, 1.0, 0.32], [0.6, 1.18, 0], [-0.6, 1.18, 0]], 0x6b7175);
  });
  // Weeds in the angles of the walls.
  for (let k = 0; k < 14; k++) {
    const onX = k % 2,
      x = onX ? r.range(x0 + 0.2, x1 - 0.2) : k % 4 === 0 ? x0 + 0.18 : x1 - 0.18,
      z = onX ? (k % 4 === 1 ? z0 + 0.18 : z1 - 0.18) : r.range(z0 + 0.2, z1 - 0.2);
    tuft(m, x, at(x, z) - 0.01, z, 1.1);
  }
}

export { porch, doorStuds, hearth, jars, herbYard };
