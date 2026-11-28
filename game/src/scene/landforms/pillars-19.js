// 俠客島's pillars: four columns of the island's rock, left standing when the hall was cut
// and dressed round, rising toward the roof. Each stands on a plinth of set stones, carries a
// line of characters cut down its face, and hangs an oil lamp from an iron arm toward the
// south; above a carved band of capital the cutaway takes it off on its way into the roof.
import { Model, circle } from '../scenery-kit.js';
import { TOP, smooth, rgb, blend, noise, hash, pillars, lightAt } from './kit-19.js';

const HEIGHT = 2.9;
function column(m, px, pz, salt) {
  const n = 8,
    rows = 26;
  const sides = Array.from({ length: n }, (_, i) => (i * circle) / n + Math.PI / 8);
  let prev;
  for (let k = 0; k <= rows; k++) {
    const t = k / rows,
      y = TOP + 0.3 + (HEIGHT - 0.3) * t;
    // A slight swell in the shaft, and a carved band of a capital under the cut.
    const cap = smooth(2.36, 2.42, y) * (1 - smooth(2.58, 2.64, y));
    const base = 0.4 - 0.02 * Math.sin(t * Math.PI) + 0.045 * cap;
    const ring = sides.map((a, i) => {
      const rough = 0.012 * (noise(a * 3 + salt, y * 4) - 0.5);
      const rr = base + rough;
      const x = px + Math.cos(a) * rr,
        z = pz + Math.sin(a) * rr;
      const band = 0.5 + 0.5 * Math.sin(y * 2.9 + salt + Math.cos(a * 2) * 0.4);
      let c = blend(rgb(0x5d5c57), rgb(0x7c786e), 0.3 + 0.5 * band);
      c = blend(c, rgb(0x8f8a7d), 0.6 * cap);
      c = blend(c, rgb(0x3d3c37), 0.35 * smooth(0.9, 0.3, y));
      c = blend(c, rgb(0x1c1d1e), 0.55 * smooth(2.0, HEIGHT, y));
      return [x, y, z, lightAt(x, y, z, c, 0.45)];
    });
    if (prev)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        m.face(
          [prev[i].slice(0, 3), ring[i].slice(0, 3), ring[j].slice(0, 3), prev[j].slice(0, 3)],
          [prev[i][3], ring[i][3], ring[j][3], prev[j][3]]
        );
      }
    prev = ring;
  }
  // The top, where the cutaway takes the column off on its way into the roof: a clean section
  // of the stone, a shade paler than its weathered skin.
  const centre = [px, HEIGHT + 0.004, pz];
  for (let i = 0; i < n; i++) {
    const a = prev[i].slice(0, 3),
      b = prev[(i + 1) % n].slice(0, 3);
    const inner = (p) => [p[0] + (px - p[0]) * 0.12, HEIGHT + 0.004, p[2] + (pz - p[2]) * 0.12];
    m.face([a, inner(a), inner(b), b], rgb(0x3b3a37));
    m.face([inner(a), centre, inner(b)], lightAt(px, HEIGHT, pz, rgb(0x77736a), 0.2));
  }
  // The plinth: a ring of set stones under a moulded drum.
  const c = (col, y) => lightAt(px, y, pz, rgb(col), 0.45);
  m.frame(px, 0, pz, Math.PI / 8, 1, () => {
    m.lathe(0, TOP - 0.02, 0, [[0, 0.6], [0.12, 0.6], [0.14, 0.56], [0.2, 0.52], [0.27, 0.47], [0.33, 0.44]], c(0x77736a, 0.2), 8);
    m.lathe(0, TOP + 0.115, 0, [[0, 0.585], [0.02, 0.585]], c(0x908b7e, 0.2), 8);
  });
  // A line of characters cut down the south face.
  for (let k = 0; k < 7; k++) {
    const y = 2.12 - k * 0.2;
    for (let s = 0; s < 4; s++) {
      const h = hash(salt * 3 + k, s * 1.7),
        u = (h - 0.5) * 0.12,
        v = y + (hash(s, salt + k) - 0.5) * 0.12,
        len = 0.025 + 0.04 * hash(k + s, salt);
      const p0 = h > 0.5 ? [px + u, v + len, pz + 0.375] : [px + u - len, v, pz + 0.375];
      const p1 = h > 0.5 ? [px + u, v - len, pz + 0.375] : [px + u + len, v + 0.01, pz + 0.375];
      m.line([p0, p1], 0.007, c(0x24231f, y), 4);
    }
  }
}
// The lamp: an iron arm from the column, a chain, a shallow bowl of oil with its wick.
function hangingLamp(m, px, pz) {
  const iron = 0x2b2a27;
  m.line(
    [
      [px, 2.35, pz + 0.37],
      [px, 2.42, pz + 0.47],
      [px, 2.36, pz + 0.55]
    ],
    0.014,
    iron,
    5
  );
  m.box(px, 2.3, pz + 0.38, 0.1, 0.16, 0.02, iron);
  for (let k = 0; k < 3; k++) {
    const a = (k * circle) / 3;
    m.line(
      [
        [px, 2.34, pz + 0.47],
        [px + Math.cos(a) * 0.08, 1.92, pz + 0.47 + Math.sin(a) * 0.08]
      ],
      0.0035,
      iron,
      3
    );
  }
  m.lathe(px, 1.86, pz + 0.47, [[0, 0.02], [0.02, 0.06], [0.05, 0.09], [0.06, 0.095], [0.055, 0.08]], 0x6e5a3a, 12);
}
function pillarGroups(T) {
  return pillars.map(([px, pz], i) => {
    const m = new Model(T, 195101 + i * 37);
    column(m, px, pz, i * 2.3 + 0.7);
    hangingLamp(m, px, pz);
    // Only plain tiles lie behind a pillar from any of the usual cameras, and the fighters
    // and the tile marks are drawn over the world, so a pillar stands solid rather than fading.
    return m.finish('石柱' + (i + 1));
  });
}

export { pillarGroups, HEIGHT };
