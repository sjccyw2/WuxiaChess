// 桃花島的岸與海：岸邊半浸的礁石、草地上的細碎點綴，以及霧中遠處的小島。
import { circle } from '../scenery-kit.js';
import { boulder, hash, noise, tuft } from './formation-5.js';
import { blossom, petal } from './peach-5.js';

const sea = -1.6;

// Weathered rocks along the waterline, in clusters, half drowned; the bigger ones
// stand where the bank is steepest.
function shoreRocks(m, field) {
  const r = m.rng;
  const steps = 120;
  for (let k = 0; k < steps; k++) {
    const a = (k * circle) / steps + r.range(-0.02, 0.02),
      dx = Math.cos(a),
      dz = Math.sin(a);
    let d = 6;
    while (d < 16 && field.sample(-0.24 + dx * d, -0.52 + dz * d).y > sea + 0.18) d += 0.08;
    // Ledges of bedrock break through the bank on the headlands.
    if (k % 3 === 0 && noise(a * 2, 1.5, 14) > 0.5) {
      let e = 6;
      while (e < 16 && field.sample(-0.24 + dx * e, -0.52 + dz * e).y > -0.75) e += 0.08;
      const x = -0.24 + dx * e,
        z = -0.52 + dz * e,
        size = r.range(0.35, 0.6);
      boulder(m, x, field.sample(x, z).y - size * 0.35, z, size, size * 0.7, size * 0.75, r, {
        n: 8,
        grey: 0x6b6c62,
        light: 0x9d9a88,
        lichen: 0xa3a172,
        foot: 0x4f5340
      });
    }
    const cluster = noise(a * 3, 0.5, 13);
    if (cluster < 0.45) continue;
    const count = 1 + Math.floor((cluster - 0.3) * 4);
    for (let j = 0; j < count; j++) {
      const reach = d + r.range(-0.25, 0.45),
        x = -0.24 + dx * reach + r.range(-0.2, 0.2),
        z = -0.52 + dz * reach + r.range(-0.2, 0.2);
      const size = Math.min(
          0.55,
          (j === 0 && r.next() < 0.3 ? r.range(0.35, 0.55) : r.range(0.1, 0.26)) * (0.6 + cluster)
        ),
        y = Math.max(field.sample(x, z).y, sea - 0.25) - size * 0.4;
      boulder(m, x, y, z, size, size * r.range(0.9, 1.6), size * r.range(0.7, 1), r, {
        n: 7,
        grey: 0x5d615a,
        light: 0x8e8c7d,
        lichen: 0x9e9b72,
        foot: 0x353d33
      });
    }
  }
}

// Tufts, wild flowers and the odd stone across the meadow, thinning on paths.
function meadow(m, field) {
  const r = m.rng;
  for (let k = 0; k < 900; k++) {
    const x = r.range(-12, 12),
      z = r.range(-11.5, 10.5);
    const f = field.sample(x, z);
    if (f.kind || f.insideWell || f.y < -1.2 || f.path < 0.35 || f.channel.distance < 0.32)
      continue;
    if (noise(x * 0.6, z * 0.6, 17) < 0.42) continue;
    const pick = r.next();
    if (pick < 0.62)
      tuft(m, x, f.y + 0.01, z, r.range(0.08, 0.15), r, r.pick([0x6d8650, 0x7f9455, 0x92975c]));
    else if (pick < 0.86) {
      // A low flowering weed: a rosette and a couple of blooms.
      const bloom = r.pick([0xf2ead6, 0xe7c86d, 0xd9b8de, 0xf0d3d6]);
      for (let j = 0; j < 4; j++) {
        const a = (j * circle) / 4 + r.range(0, 0.6);
        m.leaf(
          [x, f.y + 0.01, z],
          [x + Math.cos(a) * 0.07, f.y + 0.04, z + Math.sin(a) * 0.07],
          0.022,
          0x5f7c47,
          0x86a060,
          0.02
        );
      }
      for (let j = 0; j < 2; j++) {
        const u = x + r.range(-0.04, 0.04),
          v = z + r.range(-0.04, 0.04),
          top = f.y + r.range(0.08, 0.13);
        m.tube([u, f.y, v], [u, top, v], 0.004, 0.004, 0x6c8550, 3);
        m.leaf([u - 0.02, top, v], [u + 0.02, top + 0.005, v], 0.018, bloom, bloom, 0.006);
      }
    } else if (pick < 0.94)
      boulder(
        m,
        x,
        f.y - 0.02,
        z,
        r.range(0.05, 0.11),
        r.range(0.04, 0.09),
        r.range(0.04, 0.09),
        r,
        { n: 6 }
      );
    else
      for (let j = 0; j < 6; j++)
        petal(m, x + r.range(-0.2, 0.2), f.y + 0.012, z + r.range(-0.2, 0.2), r);
  }
}

// Islets out on the sea, fading into the haze: steep crags of grey rock in twos
// and threes, green on their shoulders, a blossoming crown or two on the lower ones.
function farIslands(m) {
  const r = m.rng;
  const isles = [
    [-15, -12, 2.2, 3.4],
    [-21, 3, 3, 4.6],
    [-13, 15, 1.8, 2.6],
    [6, 18.5, 2.4, 3.2],
    [18.5, 10, 2, 3.8],
    [21, -5.5, 2.8, 5.2],
    [11, -18.5, 2.3, 3.6],
    [-4, -23, 3.2, 5.6],
    [27, 3, 1.6, 2.2],
    [-27, -8, 2, 3]
  ];
  for (const [k, [ix, iz, irad, ih]] of isles.entries()) {
    // Set well out on the water and kept low, so they sit near the horizon.
    const x = ix * 1.35,
      z = iz * 1.35,
      rad = irad * 1.25,
      h = ih * 0.55;
    const far = Math.min(1, Math.hypot(x, z) / 38);
    const haze = 0xc9c8c0;
    const rock = m.mix(0x5b6667, haze, 0.25 + far * 0.35),
      lit = m.mix(0x8a9391, haze, 0.25 + far * 0.35),
      green = m.mix(0x5f7a56, haze, 0.25 + far * 0.35);
    const crags = 1 + (k % 3);
    for (let c = 0; c < crags; c++) {
      const a0 = r.range(0, circle),
        cx = x + (c ? Math.cos(a0) * rad * 0.9 : 0),
        cz = z + (c ? Math.sin(a0) * rad * 0.7 : 0),
        cr = rad * (c ? r.range(0.45, 0.65) : 1),
        ch = h * (c ? r.range(0.4, 0.7) : 1);
      const n = 9,
        phase = r.range(0, circle),
        lean = r.range(-0.25, 0.25) * cr;
      const edge = Array.from(
        { length: n },
        (_, i) => r.range(0.8, 1.15) * (1 + 0.15 * Math.sin(i * 2 + phase))
      );
      let prev;
      for (const [t, sc, col] of [
        [-0.15, 1.15, rock],
        [0.12, 1, rock],
        [0.4, 0.8, lit],
        [0.68, 0.58, green],
        [0.9, 0.32, green]
      ]) {
        const ring = edge.map((e, i) => {
          const a = (i * circle) / n + phase;
          return [
            cx + Math.cos(a) * cr * e * sc + lean * t,
            sea + t * ch + (hash(k * 7 + c, i, 3) - 0.5) * ch * 0.08,
            cz + Math.sin(a) * cr * e * sc
          ];
        });
        if (prev)
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            m.face([prev.ring[i], ring[i], ring[j], prev.ring[j]], [prev.col, col, col, prev.col]);
          }
        prev = { ring, col };
      }
      const peak = [cx + lean, sea + ch, cz];
      for (let i = 0; i < n; i++) m.face([peak, prev.ring[(i + 1) % n], prev.ring[i]], green);
      // Trees in flower on the lower, gentler crags.
      if (c && ch < 3) {
        const tone = [0xc89aa2, 0xe8c2c6, 0xf2dcda].map((col) =>
          m.mix(col, haze, 0.25 + far * 0.35)
        );
        for (let b = 0; b < 2; b++)
          blossom(
            m,
            cx + r.range(-0.3, 0.3) * cr,
            sea + ch * 0.8,
            cz + r.range(-0.3, 0.3) * cr,
            r.range(0.35, 0.55),
            r,
            tone
          );
      }
    }
  }
}

export { shoreRocks, meadow, farIslands };
