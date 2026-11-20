// 聽雪棧 only: the ring of distant peaks. Each is a granite horn with sharp
// ridges and snow-filled couloirs between them; the far ring fades into the
// valley mist so the range recedes in two steps.

const TAU = Math.PI * 2;

function peak(m, x, z, base, w, d, H, ridges, tint, snow, haze, fade) {
  const r = m.rng,
    n = ridges * 2,
    spin = r.range(0, TAU),
    lean = [r.range(-0.25, 0.25), r.range(-0.25, 0.25)];
  // Ridges stick out, gullies cut in; each ridge has its own reach.
  const spokes = Array.from({ length: n }, (_, i) => [
    spin + (i / n) * TAU + r.range(-0.12, 0.12),
    i % 2 ? r.range(0.48, 0.62) : r.range(0.9, 1.15)
  ]);
  const levels = [
    [0, 1],
    [0.22, 0.86],
    [0.45, 0.64],
    [0.66, 0.44],
    [0.84, 0.22],
    [1, 0]
  ];
  const rings = levels.map(([k, s]) =>
    spokes.map(([a, q], i) => {
      const g = i % 2 ? Math.max(0.35, q + 0.15 * k) : q;
      return [
        x + Math.cos(a) * w * g * s + lean[0] * k * w,
        base + k * H * (1 + (i % 2 ? -0.05 : 0.04) * Math.sin(k * Math.PI)),
        z + Math.sin(a) * d * g * s + lean[1] * k * d
      ];
    })
  );
  for (let j = 0; j < levels.length - 1; j++) {
    const lo = rings[j],
      hi = rings[j + 1];
    for (let i = 0; i < n; i++) {
      const q = (i + 1) % n;
      for (const tri of [
        [lo[i], hi[i], hi[q]],
        [lo[i], hi[q], lo[q]]
      ]) {
        const [a, b, c] = tri;
        const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const nx = ab[1] * ac[2] - ab[2] * ac[1],
          ny = ab[2] * ac[0] - ab[0] * ac[2],
          nz = ab[0] * ac[1] - ab[1] * ac[0];
        const up = Math.abs(ny) / Math.hypot(nx, ny, nz);
        const height = ((a[1] + b[1] + c[1]) / 3 - base) / H;
        // Snow on the gentler faces high up and in the couloirs; bare rock on
        // the steep faces, darkest low down.
        const gully = (j + (i % 2)) % 2 === 1 ? 0.12 : 0;
        const hold = Math.min(1, Math.max(0, (up - 0.3 + 1.6 * gully + 0.4 * height) / 0.12));
        const rock = m.mix(tint, haze, fade * 0.7 + 0.18 * height);
        const white = m.mix(snow, haze, fade * 0.45);
        m.face(
          tri,
          m.mix(rock, white, height < 0.12 ? hold * 0.4 : hold),
          0.94 + (0.08 * ((i * 3 + j) % 3)) / 2
        );
      }
    }
  }
}

function peaks3(m, style) {
  const r = m.rng;
  for (let tier = 0; tier < 2; tier++)
    for (let j = 0; j < (tier ? 19 : 13); j++) {
      const a = tier * 0.23 + (j * TAU) / (tier ? 19 : 13) + r.range(-0.07, 0.07),
        rad = (tier ? 26 : 17.5) + r.range(-1.3, 1.7);
      const s = r.range(1.9, 3.9) * (tier ? 1.4 : 1.0);
      peak(
        m,
        Math.cos(a) * rad,
        Math.sin(a) * rad,
        style.level - 0.65,
        s,
        s * 0.85,
        r.range(6.9, 12.1) * (tier ? 1.2 : 1),
        r.pick([3, 4, 5]),
        tier ? 0x66737e : 0x515d66,
        0xeef3f5,
        style.horizon,
        tier ? 0.7 : 0.42
      );
    }
}

export { peaks3 };
