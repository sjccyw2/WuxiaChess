// 俠客島's pillars: four columns of the island's rock, left standing when the hall was cut
// and dressed round, rising toward the roof. Each stands on a plinth of set stones, carries a
// line of characters cut down its face, and hangs an oil lamp from an iron arm toward the
// south; above head height it flares into the roof, which the cutaway takes away. Each is its
// own group, so the cutaway fades only the one that stands before a tile.
import { Model, circle } from '../scenery-kit.js';
import { TOP, smooth, rgb, blend, noise, hash, pillars, lightAt } from './kit-19.js';

const HEIGHT = 3.05;
function column(m, px, pz, salt) {
  const n = 14,
    rows = 22;
  const sides = Array.from({ length: n }, (_, i) => (i * circle) / n + 0.08 * Math.sin(i * 2.7 + salt));
  let prev;
  for (let k = 0; k <= rows; k++) {
    const t = k / rows,
      y = TOP + 0.3 + (HEIGHT - 0.3) * t;
    // A slight swell in the shaft, then the flare into the roof, ragged where it was broken.
    const flare = 0.36 * smooth(2.45, HEIGHT, y) ** 1.6;
    const base = 0.33 - 0.025 * Math.sin(t * Math.PI) + flare;
    const ring = sides.map((a, i) => {
      const rough = 0.012 * (noise(a * 3 + salt, y * 4) - 0.5) + flare * 0.25 * (hash(i + salt, k) - 0.5);
      const rr = base + rough + (k === 4 || k === 5 ? 0.02 : 0);
      const x = px + Math.cos(a) * rr,
        z = pz + Math.sin(a) * rr;
      const band = 0.5 + 0.5 * Math.sin(y * 2.9 + salt + Math.cos(a * 2) * 0.4);
      let c = blend(rgb(0x5d5c57), rgb(0x7c786e), 0.3 + 0.5 * band);
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
  // The top, where the cutaway takes the column off on its way into the roof: a rough
  // section of the rock, its broken face pale against the dark edge.
  const top = [px + 0.04, HEIGHT + 0.06, pz - 0.03];
  for (let i = 0; i < n; i++) {
    const a = prev[i].slice(0, 3),
      b = prev[(i + 1) % n].slice(0, 3);
    const mid = (p) => [p[0] + (top[0] - p[0]) * 0.25, p[1] + 0.035 * hash(i, salt), p[2] + (top[2] - p[2]) * 0.25];
    m.face([a, mid(a), mid(b), b], rgb(0x3a3936));
    m.face([mid(a), top, mid(b)], blend(rgb(0x55534d), rgb(0x6c6960), hash(i * 3, salt)));
  }
  // The plinth: a ring of set stones under a moulded drum.
  const c = (col, y) => lightAt(px, y, pz, rgb(col), 0.45);
  m.lathe(px, TOP - 0.02, pz, [[0, 0.47], [0.12, 0.47], [0.14, 0.44], [0.2, 0.41], [0.26, 0.37], [0.32, 0.345]], c(0x77736a, 0.2), 16);
  m.hoop(px, TOP + 0.14, pz, 0.445, 0.012, c(0x908b7e, 0.2), 20);
  // A line of characters cut down the south face.
  const face = Math.PI / 2;
  for (let k = 0; k < 6; k++) {
    const y = 2.35 - k * 0.2;
    for (let s = 0; s < 4; s++) {
      const h = hash(salt * 3 + k, s * 1.7);
      const u = (h - 0.5) * 0.12,
        a = face + u / 0.33,
        v = y + (hash(s, salt + k) - 0.5) * 0.12;
      const len = 0.03 + 0.05 * hash(k + s, salt);
      const vertical = h > 0.5;
      const p0 = [px + Math.cos(a) * 0.345, v + (vertical ? len : 0), pz + Math.sin(a) * 0.345];
      const p1 = vertical
        ? [p0[0], v - len, p0[2]]
        : [px + Math.cos(a + len / 0.33) * 0.345, v, pz + Math.sin(a + len / 0.33) * 0.345];
      m.line([p0, p1], 0.007, c(0x24231f, y), 4);
    }
  }
}
// The lamp: an iron arm from the column, a chain, a shallow bowl of oil with its wick.
function hangingLamp(m, px, pz) {
  const iron = 0x2b2a27;
  m.line(
    [
      [px, 2.35, pz + 0.31],
      [px, 2.42, pz + 0.47],
      [px, 2.36, pz + 0.55]
    ],
    0.014,
    iron,
    5
  );
  m.hoop(px, 2.27, pz + 0.31, 0.06, 0.012, iron, 10, 'xz');
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
    return m.finish('石柱' + (i + 1), { occluder: true });
  });
}

export { pillarGroups, HEIGHT };
