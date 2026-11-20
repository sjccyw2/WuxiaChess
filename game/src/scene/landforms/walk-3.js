// 聽雪棧 only: dressing for the timber galleries (alpineWalk in maze-landmarks.js),
// drawn in the gallery's own frame. Snow banks on the treads either side of the
// trodden line, X-bracing between the paired posts, iron dogs at the joints and
// icicles along the outer stringers.

const snow = 0xf0f4f4,
  snowShade = 0xd5e0e5,
  brace = 0x5e4636,
  iron = 0x3e4549,
  ice = 0xcfe8ef;

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
