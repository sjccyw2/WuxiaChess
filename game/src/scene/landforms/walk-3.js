// 聽雪棧 only: dressing for the timber galleries (alpineWalk in maze-landmarks.js),
// drawn in the gallery's own frame. Snow banks on the treads either side of the
// trodden line, X-bracing between the paired posts, iron dogs at the joints and
// icicles along the outer stringers.

const snow = 0xf0f4f4,
  snowShade = 0xd5e0e5,
  brace = 0x5e4636,
  iron = 0x3e4549,
  ice = 0xcfe8ef,
  rope = 0x8a7a5e,
  rag = 0x8b1d1a,
  ragDark = 0x5e1513;

function walkDressing(m) {
  for (let i = 0; i < 17; i++) {
    const x = -2.16 + i * 0.27,
      h = 0.16 + i * 0.103;
    // Snow banked against the rails, worn away down the middle of each tread.
    for (const s of [-1, 1]) {
      const w = 0.2 + 0.08 * Math.sin(i * 2.3 + s);
      m.box(x, h + 0.075, s * (0.59 - w / 2), 0.25, 0.03, w, i % 2 ? snow : snowShade);
    }
    if (i % 3 === 1) m.box(x, h + 0.064, 0, 0.2, 0.012, 0.3, snowShade);
    // Icicles from the tread ends on both sides.
    if (i % 2 === 0)
      for (const s of [-1, 1]) {
        const len = 0.12 + 0.14 * Math.abs(Math.sin(i * 1.7 + s));
        m.tube([x, h - 0.06, s * 0.6], [x + 0.01, h - 0.06 - len, s * 0.6], 0.018, 0.002, ice, 5);
      }
  }
  // Snow lying along the top of each rope rail, and a cap on every post.
  const railAt = [
    [-2.16, 0.79],
    [-1.08, 1.1],
    [0, 1.55],
    [1.08, 1.92],
    [2.16, 2.42]
  ];
  for (const s of [-1, 1]) {
    m.line(
      railAt.map(([x, y]) => [x, y + 0.026, s * 0.49]),
      0.017,
      snow,
      3
    );
    for (let i = 0; i < 17; i += 4) {
      const x = -2.16 + i * 0.27,
        h = 0.16 + i * 0.103;
      m.box(x, h + 0.645, s * 0.48, 0.13, 0.035, 0.13, snow);
      // Rags of 血刀門 red knotted to the posts, stiff with frost.
      if ((i / 4 + (s > 0 ? 1 : 0)) % 2 === 0) {
        const y = h + 0.45;
        m.face(
          [
            [x + 0.05, y, s * 0.53],
            [x + 0.08, y - 0.01, s * 0.53],
            [x + 0.14, y - 0.26, s * 0.57],
            [x + 0.07, y - 0.22, s * 0.56]
          ],
          i % 8 ? rag : ragDark
        );
      }
    }
  }
  // A string of prayer rags from the roof of the landing down to the first
  // post, sagging under the frost.
  const from = [1.0, 3.05, 0.6],
    to = [-2.16, 0.9, 0.5];
  const string = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    string.push([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t - 0.35 * Math.sin(Math.PI * t),
      from[2] + (to[2] - from[2]) * t
    ]);
  }
  m.line(string, 0.006, rope, 3);
  for (let k = 1; k < 12; k++) {
    const [x, y, z] = string[k];
    m.face(
      [
        [x - 0.06, y, z],
        [x + 0.06, y, z],
        [x + 0.01, y - 0.14, z + 0.01]
      ],
      [rag, 0xd8cfb8, 0x3b4a66][k % 3]
    );
  }
  // A lantern hung under the landing roof.
  m.line(
    [
      [1.52, 3.2, 0],
      [1.52, 2.95, 0]
    ],
    0.006,
    iron,
    3
  );
  m.lathe(
    1.52,
    2.7,
    0,
    [
      [0, 0.04],
      [0.04, 0.08],
      [0.15, 0.09],
      [0.24, 0.06],
      [0.27, 0.03]
    ],
    0xd39a52,
    8
  );
  m.box(1.52, 2.98, 0, 0.12, 0.02, 0.12, 0x2e2a26);

  // X-bracing and iron dogs between each pair of posts.
  for (let i = 0; i < 16; i += 4) {
    const a = -2.16 + i * 0.27,
      b = -2.16 + (i + 4) * 0.27;
    const ha = 0.16 + i * 0.103,
      hb = 0.16 + (i + 4) * 0.103;
    for (const s of [-1, 1]) {
      const z = s * 0.46;
      m.tube([a, ha - 1.3, z], [b, hb - 0.2, z], 0.03, 0.03, brace, 5);
      m.tube([a, ha - 0.2, z], [b, hb - 1.3, z], 0.03, 0.03, brace, 5);
      m.box(a, ha - 0.2, z + s * 0.03, 0.08, 0.05, 0.02, iron);
    }
  }
}

export { walkDressing };
