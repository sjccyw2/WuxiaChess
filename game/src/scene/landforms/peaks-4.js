import { Model, circle } from '../scenery-kit.js';

// Old mountain pines, the granite spires around the terrace and the cloud sea
// they rise from.

const horizon = 0xbfc7b5;

// A flat shelf of needles, the way old pines hold their foliage: a few
// flattened clumps with dark undersides and lit crowns, and a fringe of
// needle tufts round the rim.
function needlePad(m, x, y, z, r, tufts = true) {
  const g = m.rng;
  m.rock(x, y - 0.05 * r, z, r * 0.8, 0.15 * r, r * 0.62, 0x223828, 0x3f5b3a, 8);
  for (let k = 0; k < 3; k++) {
    const a = (k * circle) / 3 + g.range(-0.5, 0.5),
      d = r * g.range(0.35, 0.55),
      s = r * g.range(0.42, 0.58);
    m.rock(
      x + Math.cos(a) * d,
      y + g.range(-0.02, 0.06) * r,
      z + Math.sin(a) * d * 0.8,
      s,
      0.22 * r,
      s * 0.75,
      0x2a4430,
      g.pick([0x4a663f, 0x536f42, 0x47613b]),
      7
    );
  }
  if (!tufts) return;
  for (let k = 0; k < 13; k++) {
    const a = (k * circle) / 13 + m.rng.range(-0.25, 0.25),
      reach = m.rng.range(0.3, 0.55),
      px = x + Math.cos(a) * r * 0.8,
      pz = z + Math.sin(a) * r * 0.62;
    m.leaf(
      [px, y + 0.03 * r, pz],
      [
        px + Math.cos(a) * r * reach,
        y + m.rng.range(-0.06, 0.04) * r,
        pz + Math.sin(a) * r * reach * 0.8
      ],
      0.1 * r,
      0x2f4a33,
      0x5d7a48,
      0.04 * r
    );
  }
}

// A gnarled pine. The trunk twists up through a few bends with flaking bark
// colours; near-level limbs carry the pads out over the drop on the lean side.
function oldPine(m, x, y, z, scale, yaw, lean = 0.5, limbs = 5) {
  const r = m.rng;
  m.frame(x, y, z, yaw, scale, () => {
    const trunk = [[0, -0.25, 0]];
    let px = 0,
      pz = 0;
    const height = 1.75;
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      px += lean * 0.11 + r.range(-0.07, 0.07) + (i === 2 ? lean * 0.15 : 0);
      pz += r.range(-0.08, 0.08);
      trunk.push([px, height * t, pz]);
    }
    for (let i = 1; i < trunk.length; i++) {
      const t0 = (i - 1) / 6,
        t1 = i / 6;
      m.tube(
        trunk[i - 1],
        trunk[i],
        0.13 * (1 - t0 * 0.72),
        0.13 * (1 - t1 * 0.72),
        i % 2 ? 0x5c4838 : 0x6b5644,
        7
      );
      // Plates of paler bark on the sunny side.
      if (i < 4)
        m.tube(
          [trunk[i - 1][0] - 0.05, trunk[i - 1][1] + 0.08, trunk[i - 1][2] + 0.04],
          [trunk[i][0] - 0.05, trunk[i][1] - 0.08, trunk[i][2] + 0.04],
          0.045 * (1 - t0 * 0.5),
          0.04 * (1 - t1 * 0.5),
          0x857057,
          5
        );
    }
    // Root flare gripping the rock.
    for (let k = 0; k < 4; k++) {
      const a = (k * circle) / 4 + 0.4;
      m.tube(
        [0, 0.18, 0],
        [Math.cos(a) * 0.26, -0.12, Math.sin(a) * 0.26],
        0.07,
        0.03,
        0x5a4636,
        5
      );
    }
    for (let k = 0; k < limbs; k++) {
      const t = 0.42 + (k / Math.max(1, limbs - 1)) * 0.58,
        i = Math.min(6, Math.round(t * 6)),
        from = trunk[i];
      const side = k % 2 ? 1 : -1,
        a = (lean >= 0 ? 0 : Math.PI) + side * r.range(0.5, 1.6) + (k === limbs - 1 ? 0 : 0),
        len = (1.1 - t * 0.55) * r.range(0.75, 1.05);
      const elbow = [
        from[0] + Math.cos(a) * len * 0.55,
        from[1] - 0.05 + r.range(-0.04, 0.06),
        from[2] + Math.sin(a) * len * 0.55
      ];
      const end = [
        from[0] + Math.cos(a) * len,
        from[1] + 0.06 + r.range(0, 0.1),
        from[2] + Math.sin(a) * len
      ];
      m.tube(from, elbow, 0.05 * (1.3 - t), 0.035 * (1.3 - t), 0x5e4a3a, 5);
      m.tube(elbow, end, 0.035 * (1.3 - t), 0.018, 0x63503e, 5);
      needlePad(m, end[0], end[1] + 0.04, end[2], 0.42 * (1.25 - t * 0.45));
    }
    needlePad(m, trunk[6][0] + 0.05, trunk[6][1] + 0.08, trunk[6][2], 0.4);
  });
}

// One granite tower: stacked jointed blocks that narrow upward, joints shown
// as alternating light and shadowed faces, mossy ledges where a block steps
// in, and a rounded crown.
function tower(m, x, base, z, radius, height, haze, crown) {
  const r = m.rng,
    n = 8,
    segments = 3 + Math.floor(r.next() * 2);
  const rock = m.mix(m.mix(0x737a72, 0x9e9b8b, r.next()), horizon, haze),
    light = m.mix(0xb9b6a4, horizon, haze),
    dark = m.mix(0x4f5953, horizon, haze * 0.9),
    moss = m.mix(0x4b6442, horizon, haze * 0.85);
  let y = base,
    rr = radius,
    cx = x,
    cz = z;
  const rot = r.range(0, circle),
    bulge = Array.from({ length: n }, () => r.range(0.72, 1.2));
  for (let s = 0; s < segments; s++) {
    const last = s === segments - 1,
      h = (height / segments) * r.range(0.8, 1.2) * (s === 0 ? 1.3 : 1),
      top = rr * (last ? 0.68 : r.range(0.86, 0.95));
    const lo = [],
      hi = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i * circle) / n,
        k = bulge[i];
      lo.push([cx + Math.cos(a) * rr * k, y, cz + Math.sin(a) * rr * k]);
      hi.push([cx + Math.cos(a) * top * k, y + h, cz + Math.sin(a) * top * k]);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        face = (i + s) % 4 === 0 ? dark : i % 2 ? rock : m.mix(rock, light, 0.5);
      const foot = m.mix(face, dark, 0.35);
      m.face([lo[i], hi[i], hi[j], lo[j]], [foot, face, face, foot]);
    }
    y += h;
    if (last) {
      // A rounded crown of weathered granite under its pines.
      const dome = hi.map(([px, py, pz]) => [
          cx + (px - cx) * 0.7,
          py + top * 0.3,
          cz + (pz - cz) * 0.7
        ]),
        peak = [cx, y + top * 0.6, cz],
        cap = m.mix(moss, rock, 0.45);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        m.face([hi[i], dome[i], dome[j], hi[j]], [rock, cap, cap, rock]);
        m.face([dome[i], peak, dome[j]], cap);
      }
      if (crown) {
        // A wind-flattened pine leaning off the crown.
        const px = cx + top * 0.25,
          py = y + top * 0.35,
          green = m.mix(0x2b4231, horizon, haze),
          lit = m.mix(0x4d6a45, horizon, haze);
        m.tube(
          [px, py, cz],
          [px + top * 0.5, py + top * 0.55, cz],
          0.08,
          0.04,
          m.mix(0x4b3d33, horizon, haze),
          4
        );
        m.rock(
          px + top * 0.55,
          py + top * 0.5,
          cz,
          top * 0.75,
          top * 0.14,
          top * 0.45,
          green,
          lit,
          7
        );
      }
    } else {
      // The ledge: a mossy shelf where the next block steps in.
      m.face([...hi].reverse(), moss);
      const next = top * r.range(0.7, 0.86);
      cx += r.range(-0.15, 0.15) * top;
      cz += r.range(-0.15, 0.15) * top;
      rr = next;
    }
  }
}

// A massif: a crowd of towers fused at the foot, the tallest in the middle.
function massif(m, x, z, size, haze) {
  const r = m.rng,
    count = 3 + Math.floor(r.next() * 3);
  for (let k = 0; k < count; k++) {
    const a = r.range(0, circle),
      d = k ? r.range(1.1, 2.2) * size : 0;
    tower(
      m,
      x + Math.cos(a) * d,
      -9.5,
      z + Math.sin(a) * d,
      size * r.range(1.2, 1.6) * (k ? 0.8 : 1),
      size * r.range(5.2, 7.6) * (k ? r.range(0.6, 0.85) : 1),
      haze,
      k < 2
    );
  }
}

// A bank of cloud: overlapping soft domes on a flat floor, grey-blue below and
// sunlit white on top.
function cloudBank(m, x, y, z, length, depth, yaw, puffs) {
  const r = m.rng;
  const rings = [
    [0, 1],
    [0.3, 0.98],
    [0.58, 0.84],
    [0.82, 0.56],
    [0.96, 0.22],
    [1, 0]
  ];
  m.frame(x, y, z, yaw, 1, () => {
    for (let k = 0; k < puffs; k++) {
      const t = puffs > 1 ? k / (puffs - 1) - 0.5 : 0,
        px = t * length + r.range(-0.3, 0.3),
        pz = r.range(-0.3, 0.3) * depth,
        rad = depth * r.range(0.7, 1.05) * (1 - Math.abs(t) * 0.7),
        h = rad * r.range(0.7, 1.05),
        sink = h * r.range(0.05, 0.4);
      const n = 9;
      let prev;
      for (const [k2, s] of rings) {
        const ring = [];
        for (let i = 0; i < n; i++) {
          const a = (i * circle) / n + k;
          ring.push([px + Math.cos(a) * rad * s * 1.35, k2 * h - sink, pz + Math.sin(a) * rad * s]);
        }
        if (prev) {
          // Shadowed grey-blue round the foot, sunlit white over the crown.
          const tone = (t) =>
            t < 0.6
              ? m.mix(0xa8b4b7, 0xe4e7e2, t / 0.6)
              : m.mix(0xe4e7e2, 0xfcfcf6, (t - 0.6) / 0.4);
          const lo = tone((prev[0][1] + sink) / h),
            hi = tone(k2);
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            m.face([prev[i], ring[i], ring[j], prev[j]], [lo, hi, hi, lo]);
          }
        }
        prev = ring;
      }
    }
  });
}

// The far scene: massifs in three hazier rings, banks of cloud wrapped round
// their feet and round the terrace's own mountain.
function peaksAndClouds(T) {
  const m = new Model(T, 470501);
  const r = m.rng;
  const tiers = [
    [19.5, 7, 0.18, 1.25],
    [25, 9, 0.34, 1.6],
    [34, 11, 0.56, 2.0]
  ];
  for (const [rad, count, haze, size] of tiers) {
    for (let j = 0; j < count; j++) {
      const a = (j * circle) / count + r.range(-0.2, 0.2) + rad * 0.09,
        d = rad + r.range(-2, 2.5),
        x = Math.cos(a) * d,
        z = Math.sin(a) * d * 0.92;
      massif(m, x, z, size * r.range(0.8, 1.15), haze);
      cloudBank(m, x, -5.6, z, r.range(5, 8) * size, r.range(1.5, 2.2) * size, -a + Math.PI / 2, 5);
    }
  }
  // Cloud wrapping the foot of the terrace's own mountain.
  for (let j = 0; j < 12; j++) {
    const a = (j * circle) / 12 + r.range(-0.1, 0.1),
      d = r.range(11.5, 14),
      x = Math.cos(a) * d,
      z = Math.sin(a) * d * 0.9;
    cloudBank(m, x, -5.95, z, r.range(5, 8), r.range(1.4, 2.1), -a + Math.PI / 2, 5);
  }
  return m.finish('雲海與峰林', { distant: true, cast: false });
}

export { oldPine, peaksAndClouds };
