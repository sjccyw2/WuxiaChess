// 聽雪棧 only: the ring of distant peaks. Each is a granite horn with sharp
// ridges and snow-filled couloirs between them; the far ring fades into the
// valley mist so the range recedes in two steps.

const TAU = Math.PI * 2;

function peak(m, x, z, base, w, d, H, ridges, tint, snow, haze, fade) {
  const r = m.rng,
    n = ridges * 4,
    spin = r.range(0, TAU),
    lean = [r.range(-0.25, 0.25), r.range(-0.25, 0.25)];
  // Main ridges stick out, a lesser rib either side, couloirs cut in between;
  // each ridge has its own reach.
  const spokes = Array.from({ length: n }, (_, i) => {
    const kind = i % 4;
    return [
      spin + (i / n) * TAU + r.range(-0.07, 0.07),
      kind === 0 ? r.range(0.95, 1.18) : kind === 2 ? r.range(0.46, 0.6) : r.range(0.68, 0.84),
      kind
    ];
  });
  const levels = [
    [0, 1],
    [0.1, 0.93],
    [0.22, 0.84],
    [0.35, 0.71],
    [0.48, 0.58],
    [0.61, 0.45],
    [0.74, 0.31],
    [0.87, 0.17],
    [1, 0]
  ];
  const rings = levels.map(([k, s], j) =>
    spokes.map(([a, q, kind], i) => {
      // Ribs hold their reach as they climb, couloirs open into bowls.
      const g = kind === 2 ? Math.max(0.35, q + 0.2 * k) : q;
      const rough =
        1 + 0.11 * Math.sin(i * 2.7 + j * 1.9 + x) * (j && j < levels.length - 1 ? 1 : 0);
      // Ridge crests step up in towers, couloirs sit lower: a serrated skyline.
      const tower = k > 0.3 && k < 1 ? (kind === 0 ? 0.045 : kind === 2 ? -0.05 : 0) : 0;
      return [
        x + Math.cos(a) * w * g * s * rough + lean[0] * k * w,
        base + (k + tower) * H,
        z + Math.sin(a) * d * g * s * rough + lean[1] * k * d
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
        // the steep faces and the rib crests, darkest low down. Sunward faces
        // (the sun is low in the west) take a warmer white.
        const gully = spokes[i][2] === 2 || spokes[q][2] === 2 ? 0.1 : 0,
          rib = spokes[i][2] === 0 || spokes[q][2] === 0 ? 0.06 : 0;
        const band = 0.04 * Math.sin(height * 23 + x);
        const hold = Math.min(
          1,
          Math.max(0, (up - 0.34 + 1.6 * gully - rib + 0.42 * height + band) / 0.1)
        );
        const sunward = Math.max(0, -nx * Math.sign(ny || 1)) / Math.hypot(nx, ny, nz);
        const rock = m.mix(
          m.mix(tint, 0x2f383f, 0.25 * (1 - height)),
          haze,
          fade * 0.7 + 0.18 * height
        );
        const white = m.mix(m.mix(snow, 0xfaf3e6, sunward * 0.6), haze, fade * 0.45);
        m.face(
          tri,
          m.mix(rock, white, height < 0.1 ? hold * 0.4 : hold),
          0.92 + (0.1 * ((i * 3 + j) % 3)) / 2
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
  // A ring of lower snow ridges between the massif and the range: they show
  // under the near peaks from the low cameras and give the valley a far side.
  for (let j = 0; j < 22; j++) {
    const a = 0.11 + (j * TAU) / 22 + r.range(-0.05, 0.05),
      rad = 15.2 + r.range(-0.4, 0.9),
      s = r.range(1.3, 2.1);
    peak(
      m,
      Math.cos(a) * rad,
      Math.sin(a) * rad,
      style.level - 0.4,
      s * 1.5,
      s * 0.8,
      r.range(2.4, 4.4),
      r.pick([2, 3]),
      0x4c5861,
      0xf0f4f6,
      style.horizon,
      0.18
    );
  }
}

export { peaks3 };
