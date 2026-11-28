import { circle } from '../scenery-kit.js';

// The Kunlun range round 光明頂: great snow peaks standing out of the sea of cloud in
// two rings, the nearer dark-ribbed with snow in its couloirs and on its crowns, the
// farther paler and lost in the blue of the high air. Every peak stands from the
// cloud's level up, so nothing of it is buried.

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// One peak: main ridges standing out, couloirs cut between, the crest stepping up in
// towers. Snow holds on the gentler faces high up and fills the couloirs.
function snowPeak(m, x, z, base, w, d, H, ridges, haze, horizon) {
  const r = m.rng,
    n = ridges * 4,
    spin = r.range(0, circle),
    lean = [r.range(-0.2, 0.2), r.range(-0.2, 0.2)];
  const spokes = Array.from({ length: n }, (_, i) => {
    const kind = i % 4;
    return [
      spin + (i / n) * circle + r.range(-0.08, 0.08),
      kind === 0 ? r.range(0.95, 1.2) : kind === 2 ? r.range(0.45, 0.6) : r.range(0.68, 0.84),
      kind
    ];
  });
  const levels = [
    [0, 1],
    [0.14, 0.9],
    [0.3, 0.77],
    [0.46, 0.62],
    [0.6, 0.48],
    [0.73, 0.35],
    [0.85, 0.22],
    [0.94, 0.11],
    [1, 0]
  ];
  const rings = levels.map(([k, s], j) =>
    spokes.map(([a, q, kind], i) => {
      const g = kind === 2 ? Math.max(0.35, q + 0.2 * k) : q;
      const rough = 1 + 0.1 * Math.sin(i * 2.7 + j * 1.9 + x) * (j && j < levels.length - 1 ? 1 : 0);
      const tower = k > 0.3 && k < 1 ? (kind === 0 ? 0.04 : kind === 2 ? -0.05 : 0) : 0;
      return [
        x + Math.cos(a) * w * g * s * rough + lean[0] * k * w,
        base + (k + tower) * H,
        z + Math.sin(a) * d * g * s * rough + lean[1] * k * d
      ];
    })
  );
  const rock = m.mix(0x4a5560, 0x5e6873, r.next()),
    white = 0xf2f5f7;
  for (let j = 0; j < levels.length - 1; j++)
    for (let i = 0; i < n; i++) {
      const q = (i + 1) % n,
        lo = rings[j],
        hi = rings[j + 1];
      for (const tri of [
        [lo[i], hi[i], hi[q]],
        [lo[i], hi[q], lo[q]]
      ]) {
        const [a, b, c] = tri,
          ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const nx = ab[1] * ac[2] - ab[2] * ac[1],
          ny = ab[2] * ac[0] - ab[0] * ac[2],
          nz = ab[0] * ac[1] - ab[1] * ac[0],
          len = Math.hypot(nx, ny, nz) || 1,
          up = Math.abs(ny) / len;
        const h = ((a[1] + b[1] + c[1]) / 3 - base) / H,
          gully = spokes[i][2] === 2 || spokes[q][2] === 2 ? 0.12 : 0,
          rib = spokes[i][2] === 0 || spokes[q][2] === 0 ? 0.08 : 0;
        const hold = clamp((up - 0.42 + 1.5 * gully - rib + 0.55 * h + 0.04 * Math.sin(h * 21 + x)) / 0.1);
        // The faces toward the sun (south-west) take a warmer white.
        const sun = clamp((-nx * 0.6 + nz * 0.4) / len);
        const stone = m.mix(m.mix(rock, 0x2e353c, 0.3 * (1 - h)), horizon, haze * 0.75);
        const snowTone = m.mix(m.mix(white, 0xfff3e2, sun * 0.5), horizon, haze * 0.4);
        m.face(tri, m.mix(stone, snowTone, h < 0.18 ? hold * 0.3 : hold), 0.9 + 0.05 * ((i * 3 + j) % 3));
      }
    }
}

function kunlunRange(m, level, horizon) {
  const r = m.rng;
  for (const [radius, count, haze, size, tall, spin] of [
    [21, 11, 0.15, 2.6, 9, 0.2],
    [33, 15, 0.5, 4.2, 15, 0.45]
  ])
    for (let j = 0; j < count; j++) {
      const a = spin + (j * circle) / count + r.range(-0.12, 0.12),
        d = radius + r.range(-2, 3),
        x = Math.cos(a) * d,
        z = Math.sin(a) * d,
        w = size * r.range(0.75, 1.25),
        h = tall * r.range(0.65, 1.1);
      snowPeak(m, x, z, level, w, w * r.range(0.75, 1), h, r.pick([3, 4, 5]), haze, horizon);
      // A shoulder or two beside the summit.
      for (let k = 0; k < 2; k++) {
        const turn = r.range(0, circle),
          off = w * r.range(0.8, 1.3);
        snowPeak(
          m,
          x + Math.cos(turn) * off,
          z + Math.sin(turn) * off,
          level,
          w * r.range(0.45, 0.65),
          w * r.range(0.4, 0.55),
          h * r.range(0.45, 0.7),
          r.pick([2, 3]),
          haze,
          horizon
        );
      }
    }
}

export { kunlunRange };
