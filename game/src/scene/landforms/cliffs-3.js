import { Model } from '../scenery-kit.js';
import { clearOf, groundOf, hash, slopeOf, snowLight, spike } from './ground-3.js';

// 聽雪棧 only: the rock of the massif below the shelf. Bedding ledges stand out
// of the steep faces with snow on their tops and icicles under their lips; ice
// seeps run down from the joints, blocks that have fallen lie at the cliff foot,
// two cave mouths open in the walls and the benches are wind-cut into drifts.

const granite = [0x4a5257, 0x566065, 0x5f676a, 0x515a5f, 0x676d6f];
const shadow = 0x1f262b,
  dust = 0xdfe7ea,
  ice = [0xc6e2ec, 0xe4f3f6, 0xa3c9d8];

// Rock grows colder and paler the deeper it stands in the gorge mist.
function cold(m, col, y) {
  return m.mix(col, 0x7e8f9c, Math.min(0.55, Math.max(0, (-y - 3.6) / 6)));
}

// One bedding ledge on a steep face. It runs along the contour, is buried at
// its back and stands out over the drop at its front, so where the face falls
// away faster than the ledge is thick there is an overhang hung with ice.
function ledge(m, surface, x, z, g, length, reach, thick) {
  const ox = -g.gx / g.steep,
    oz = -g.gz / g.steep,
    tx = -oz,
    tz = ox;
  const y = surface(x, z) + 0.02,
    n = 5;
  const rock = cold(m, m.rng.pick(granite), y);
  const back = [],
    front = [],
    lip = [],
    foot = [];
  for (let k = 0; k < n; k++) {
    const u = (k / (n - 1) - 0.5) * length,
      bulge = Math.sin((Math.PI * k) / (n - 1));
    const f = reach * (0.6 + 0.4 * bulge) * m.rng.range(0.8, 1.15);
    const px = x + tx * u,
      pz = z + tz * u,
      dip = -0.025 * bulge;
    back.push([px - ox * 0.4, y + 0.035, pz - oz * 0.4]);
    front.push([px + ox * f, y + dip, pz + oz * f]);
    lip.push([px + ox * (f + 0.035), y + dip + 0.02, pz + oz * (f + 0.035)]);
    foot.push([px + ox * f * 0.92, y + dip - thick * m.rng.range(0.8, 1.2), pz + oz * f * 0.92]);
  }
  const top = (p) => [p[0], p[1] + 0.03, p[2]];
  const lit = snowLight(m, ox * 0.2, 1, oz * 0.2),
    deep = snowLight(m, -ox * 0.3, 1, -oz * 0.3, 0.05),
    edge = snowLight(m, ox, 0.3, oz, 0.08);
  for (let k = 0; k < n - 1; k++) {
    // Snow on the ledge, a rounded lip over its front, the rock face below.
    m.face([back[k], top(lip[k]), top(lip[k + 1]), back[k + 1]], [deep, lit, lit, deep]);
    m.face([top(lip[k]), lip[k], lip[k + 1], top(lip[k + 1])], [lit, edge, edge, lit]);
    const hi = m.mix(rock, dust, 0.18),
      lo = m.mix(rock, shadow, 0.4);
    m.face([lip[k], foot[k], foot[k + 1], lip[k + 1]], [hi, lo, lo, hi]);
  }
  for (const k of [0, n - 1]) {
    const b = [back[k][0], foot[k][1], back[k][2]];
    m.face(
      k ? [back[k], top(lip[k]), foot[k], b] : [b, foot[k], top(lip[k]), back[k]],
      m.mix(rock, shadow, 0.2)
    );
  }
  // Where the lip hangs clear of the face below, a curtain of icicles.
  for (let k = 1; k < n - 1; k++) {
    const px = foot[k][0],
      pz = foot[k][2],
      gap = foot[k][1] - surface(px + ox * 0.05, pz + oz * 0.05);
    if (gap < 0.16) continue;
    const count = 2 + Math.floor(m.rng.next() * 3);
    for (let i = 0; i < count; i++) {
      const s = m.rng.range(-0.5, 0.5),
        nx = (foot[k][0] + foot[k + (s > 0 ? 1 : -1)][0]) / 2,
        nz = (foot[k][2] + foot[k + (s > 0 ? 1 : -1)][2]) / 2;
      const w = Math.abs(s) * 2,
        px2 = foot[k][0] + (nx - foot[k][0]) * w,
        pz2 = foot[k][2] + (nz - foot[k][2]) * w;
      const len = Math.min(gap * 0.85, 0.12 + m.rng.next() * 0.42);
      spike(
        m,
        [px2 - ox * 0.02, foot[k][1] + 0.01, pz2 - oz * 0.02],
        len,
        0.012 + 0.016 * m.rng.next(),
        ice[i % 3],
        4,
        0xf2fafc
      );
    }
  }
}

// An ice seep: water that wept from a joint and froze in a glassy ribbon down
// the face, widening and bulging as it went.
function seep(m, surface, x, z) {
  let last = null;
  for (let step = 0; step < 34; step++) {
    const g = slopeOf(surface, x, z);
    if (g.steep < 0.7 || surface(x, z) < -6.9) break;
    const ox = -g.gx / g.steep,
      oz = -g.gz / g.steep;
    const w = 0.035 + 0.0035 * step + 0.02 * Math.sin(step * 1.7 + x),
      y = surface(x, z);
    const row = [
      [x - oz * w + ox * 0.02, y + 0.045, z + ox * w + oz * 0.02],
      [x + ox * 0.05, y + 0.07, z + oz * 0.05],
      [x + oz * w + ox * 0.02, y + 0.045, z - ox * w + oz * 0.02]
    ];
    if (last) {
      const c = m.rgb(step % 3 ? ice[0] : ice[1]);
      m.face([last[0], row[0], row[1], last[1]], [m.rgb(ice[2]), m.rgb(ice[2]), c, c]);
      m.face([last[1], row[1], row[2], last[2]], [c, c, m.rgb(ice[2]), m.rgb(ice[2])]);
    }
    last = row;
    x += ox * 0.11 + Math.sin(step * 0.9 + z) * 0.012;
    z += oz * 0.11;
  }
}

// A block that came down off the face and lies half sunk in the snow.
function fallen(m, ground, x, z, r) {
  const y = Math.min(ground(x - r, z), ground(x + r, z), ground(x, z - r), ground(x, z + r));
  m.rock(
    x,
    y - r * 0.25,
    z,
    r,
    r * m.rng.range(0.75, 1.25),
    r * m.rng.range(0.6, 0.9),
    cold(m, m.rng.pick(granite), y),
    m.rng.next() < 0.75 ? 0xe9eff1 : 0xb7c6cf,
    7,
    m.rng.range(0, 6)
  );
}

// A cave mouth in a cliff: a dark arch framed by a ring of rough stones, with
// jambs back to the face, a sill of rubble and a fringe of ice from the lintel.
function cave(m, surface, x, z, width, height) {
  const g = slopeOf(surface, x, z, 0.2);
  const ox = -g.gx / g.steep,
    oz = -g.gz / g.steep,
    tx = -oz,
    tz = ox;
  const y = surface(x, z) - 0.05;
  const arch = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI,
      u = -Math.cos(a) * width * 0.5,
      v = Math.sin(a) ** 0.8 * height;
    arch.push([x + tx * u + ox * 0.12, y + v, z + tz * u + oz * 0.12]);
  }
  const mid = [x + ox * 0.12, y + height * 0.35, z + oz * 0.12];
  for (let i = 0; i < 10; i++) m.face([mid, arch[i + 1], arch[i]], 0x161c21);
  // Jambs: from the arch back to where the face stands at that height.
  for (let i = 0; i < 10; i++) {
    const a = arch[i],
      b = arch[i + 1];
    const back = (p) => {
      const d = Math.max(0.15, (p[1] - y) / Math.max(0.6, g.steep) + 0.15);
      return [p[0] - ox * d, p[1], p[2] - oz * d];
    };
    m.face([a, b, back(b), back(a)], cold(m, 0x3a4247, y));
  }
  for (let i = 0; i <= 10; i += 2) {
    const p = arch[i];
    m.rock(
      p[0] + ox * 0.02,
      p[1] - 0.1,
      p[2] + oz * 0.02,
      0.11 + 0.04 * hash(i, x),
      0.2,
      0.1,
      cold(m, granite[i % granite.length], y),
      i > 2 && i < 8 ? 0xedf2f3 : 0x8d9aa2,
      6,
      i
    );
  }
  for (let i = 0; i < 9; i++) {
    const t = 0.18 + (0.64 * i) / 8,
      p = arch[Math.round(t * 10)];
    spike(
      m,
      [p[0] + ox * 0.03, p[1] - 0.05, p[2] + oz * 0.03],
      0.1 + 0.25 * hash(i, z),
      0.016,
      ice[i % 3],
      4
    );
  }
  for (let i = 0; i < 4; i++) {
    const u = (i / 3 - 0.5) * width * 0.9;
    m.rock(
      x + tx * u + ox * 0.3,
      y - 0.05,
      z + tz * u + oz * 0.3,
      0.08 + 0.05 * hash(i, 2),
      0.1,
      0.07,
      cold(m, 0x535b60, y),
      0xe6edef,
      6,
      i
    );
  }
}

// A wind-cut drift on a bench: a long low ridge, smooth and sunlit on the
// windward side, cut off short and blue on the lee.
function drift(m, ground, x, z, length, width, height, wind) {
  const wx = Math.cos(wind),
    wz = Math.sin(wind),
    sx = -wz,
    sz = wx;
  const rows = [];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6,
      along = (t - 0.5) * length,
      swell = Math.sin(Math.PI * t) ** 0.7,
      curve = 0.12 * width * Math.sin(t * 3.1 + x);
    const cx = x + wx * along + sx * curve,
      cz = z + wz * along + sz * curve;
    const at = (s, h) => {
      const u = cx + sx * s * width * (0.3 + 0.7 * swell),
        v = cz + sz * s * width * (0.3 + 0.7 * swell);
      return [u, ground(u, v) + h, v];
    };
    rows.push([
      at(-1, -0.02),
      at(-0.15, height * swell),
      at(0.32, height * swell * 0.92),
      at(0.55, -0.02)
    ]);
  }
  const lit = snowLight(m, -sx, 1.6, -sz),
    top = snowLight(m, 0, 1, 0),
    lee = snowLight(m, sx, 0.4, sz, 0.1);
  for (let k = 0; k < 6; k++) {
    const a = rows[k],
      b = rows[k + 1];
    m.face([a[0], a[1], b[1], b[0]], [top, lit, lit, top]);
    m.face([a[1], a[2], b[2], b[1]], [lit, top, top, lit]);
    m.face([a[2], a[3], b[3], b[2]], [lee, top, top, lee]);
  }
}

// The beds of the granite dip gently, so the ledges of one bed line up round
// the massif at about the same height: a band every 0.6 or so.
function inBand(x, z, y) {
  const level = (y - 0.16 * Math.sin(x * 0.37 + z * 0.21) - 0.1 * Math.sin(z * 0.9)) / 0.62;
  return level - Math.floor(level) < 0.2;
}

function cliffs3(T, surface, land) {
  const m = new Model(T, 39917);
  const ground = groundOf(surface);
  const foot = (x, z) => surface(x, z) > -7.05;
  // Ledges: a jittered sweep over the steep ground off the shelf, kept to the beds.
  for (let gz = -15; gz <= 15; gz += 0.36)
    for (let gx = -14; gx <= 14; gx += 0.36) {
      const x = gx + m.rng.range(-0.15, 0.15),
        z = gz + m.rng.range(-0.15, 0.15),
        roll = m.rng.next();
      const y = surface(x, z);
      if (y > -0.45 || y < -7.0 || land(x, z) < 0.4 || !clearOf(x, z, 0.3)) continue;
      if (!inBand(x, z, y) || roll > 0.42) continue;
      const g = slopeOf(surface, x, z);
      if (g.steep < 0.85) continue;
      ledge(
        m,
        surface,
        x,
        z,
        g,
        m.rng.range(0.7, 1.35),
        m.rng.range(0.07, 0.2),
        m.rng.range(0.2, 0.42)
      );
    }
  // Ice seeps from joints high on the faces.
  for (let i = 0, made = 0; i < 400 && made < 16; i++) {
    const x = m.rng.range(-12, 12),
      z = m.rng.range(-13, 13),
      y = surface(x, z);
    if (y > -0.8 || y < -4.5 || land(x, z) < 0.5 || !clearOf(x, z, 0.3)) continue;
    if (slopeOf(surface, x, z).steep < 1.5) continue;
    seep(m, surface, x, z);
    made++;
  }
  // Blocks fallen to the foot of the faces, in heaps of one big and a few small.
  for (let i = 0, made = 0; i < 3000 && made < 46; i++) {
    const x = m.rng.range(-14, 14),
      z = m.rng.range(-15, 15),
      y = surface(x, z);
    if (y > -0.9 || !foot(x, z) || land(x, z) < 0.7 || !clearOf(x, z, 0.4)) continue;
    const g = slopeOf(surface, x, z);
    if (g.steep > 0.5) continue;
    // Only under a face: somewhere within a metre and a half the rock stands high.
    const above = Math.max(
      ...[0, 1, 2, 3, 4, 5].map((k) =>
        surface(x + Math.cos(k * 1.05) * 1.4, z + Math.sin(k * 1.05) * 1.4)
      )
    );
    if (above - y < 0.9) continue;
    const r = m.rng.range(0.16, 0.36);
    fallen(m, ground, x, z, r);
    for (let k = 0; k < 3; k++)
      if (m.rng.next() < 0.7)
        fallen(
          m,
          ground,
          x + m.rng.range(-0.55, 0.55),
          z + m.rng.range(-0.55, 0.55),
          r * m.rng.range(0.3, 0.55)
        );
    made++;
  }
  // Two caves: one in the east wall under the frozen fall, one in the west gorge.
  for (const [x, z, w, h] of [
    [6.35, 1.6, 0.62, 0.55],
    [-5.2, -4.65, 0.55, 0.48]
  ])
    cave(m, surface, x, z, w, h);
  // Wind-cut drifts on the benches, aligned with the north-west wind.
  for (let i = 0, made = 0; i < 1500 && made < 60; i++) {
    const x = m.rng.range(-12, 12),
      z = m.rng.range(-13, 13),
      y = surface(x, z);
    if (y > -0.6 || y < -6.6 || land(x, z) < 0.55 || !clearOf(x, z, 0.5)) continue;
    if (slopeOf(surface, x, z).steep > 0.32) continue;
    drift(
      m,
      surface,
      x,
      z,
      m.rng.range(0.7, 1.7),
      m.rng.range(0.14, 0.28),
      m.rng.range(0.04, 0.09),
      0.62 + m.rng.range(-0.2, 0.2)
    );
    made++;
  }
  return [m.finish('層岩雪簷與冰凌')];
}

export { cliffs3 };
