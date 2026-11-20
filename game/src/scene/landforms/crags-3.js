import { Model } from '../scenery-kit.js';

// 聽雪棧 only: granite crags that carry the bell pavilion, and the frozen fall
// on the east spur.

const granite = [0x4d565b, 0x5b6367, 0x666c6f, 0x535b60];
const capSnow = 0xedf2f3;

// One squared granite block: straight sides, a narrow bevel round the top and
// snow on the upper face when it is the last of its column.
function block(m, x, y, z, rx, h, rz, angle, col, top) {
  const n = 5,
    low = [],
    high = [],
    cap = [];
  for (let i = 0; i < n; i++) {
    const a = angle + (i / n) * Math.PI * 2 + m.rng.range(-0.18, 0.18),
      k = m.rng.range(0.85, 1.1);
    const u = Math.cos(a) * rx * k,
      v = Math.sin(a) * rz * k;
    low.push([x + u, y, z + v]);
    high.push([x + u * 0.97, y + h * m.rng.range(0.9, 1.04), z + v * 0.97]);
    cap.push([x + u * 0.84, y + h + 0.04, z + v * 0.84]);
  }
  const bevel = m.mix(col, top, 0.6);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([low[i], high[i], high[j], low[j]], col, 0.9 + (0.1 * ((i * 7) % 3)) / 2);
    m.face([high[i], cap[i], cap[j], high[j]], bevel);
  }
  m.face([...cap].reverse(), top);
}

// A column of jointed granite: stacked, slightly offset blocks that narrow
// upward, snow lying on every ledge the block above leaves bare.
function crag(m, x, z, bottom, top, rx, rz) {
  let y = bottom,
    k = 0;
  while (y < top - 0.05) {
    const h = Math.min(top - y, m.rng.range(0.38, 0.7));
    const t = (y - bottom) / Math.max(0.01, top - bottom);
    const s = 1.08 - 0.22 * t;
    block(
      m,
      x + m.rng.range(-0.06, 0.06),
      y,
      z + m.rng.range(-0.05, 0.05),
      rx * s,
      h,
      rz * s,
      m.rng.range(0, 6),
      granite[k % granite.length],
      y + h >= top - 0.05 ? capSnow : 0xb9c5ca
    );
    y += h;
    k++;
  }
}

// The flat bed of the pavilion: a dressed slab on its crag, snow at the edges.
function pavilionCrag(m) {
  crag(m, 0, 0, -3.3, -0.12, 0.95, 0.55);
  m.box(0, -0.08, 0, 1.78, 0.12, 0.72, 0x7d8589);
  m.box(0, -0.015, 0, 1.7, 0.02, 0.64, 0x9aa2a5);
  for (const s of [-1, 1]) m.box(s * 0.82, 0.0, 0, 0.16, 0.035, 0.66, capSnow);
}

// A frozen waterfall: a dark granite face with a curtain of ice hanging from
// each overhang, thickest where the water ran, and a frozen pool at its foot.
function iceFall(m) {
  const ice = [0xbfe0ea, 0xdff1f5, 0x9cc8d8, 0xaed4e2];
  for (let i = 0; i < 6; i++) {
    const x = -1.4 + i * 0.56 + m.rng.range(-0.12, 0.12),
      z = m.rng.range(-0.3, 0.3),
      top = 0.5 + 1.7 * Math.sin(((i + 0.5) / 6) * Math.PI) * m.rng.range(0.75, 1.1);
    crag(m, x, z, -2.2, top, 0.5, 0.46);
  }
  // Ice: long hanging columns down the front, short ones at the sides.
  for (let i = 0; i < 26; i++) {
    const u = m.rng.range(-1.3, 1.3),
      fall = Math.cos((u / 1.4) * (Math.PI / 2));
    const y = 0.2 + 1.6 * fall * m.rng.range(0.7, 1.05),
      len = (0.4 + 1.6 * fall) * m.rng.range(0.6, 1.1);
    const r = (0.05 + 0.08 * fall) * m.rng.range(0.6, 1.2);
    m.tube([u, y, 0.42], [u + m.rng.range(-0.04, 0.04), y - len, 0.48], r, 0.008, ice[i % 4], 6);
  }
  // Thick columns where the water ran over the lip.
  for (let i = 0; i < 6; i++) {
    const u = m.rng.range(-0.45, 0.45),
      y = 1.5 + m.rng.range(0, 0.4);
    m.tube([u, y, 0.36], [u * 0.8, -1.4, 0.5], m.rng.range(0.1, 0.16), 0.05, ice[i % 4], 7);
  }
}

function crags3(T) {
  const fall = new Model(T, 39811);
  iceFall(fall);
  const g = fall.finish('冰瀑與岩壁', { occluder: true });
  g.position.set(7.35, 0, -4.19);
  g.rotation.y = 0.31;
  return [g];
}

export { crags3, pavilionCrag, crag };
