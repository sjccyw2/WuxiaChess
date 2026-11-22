// Below and beyond the terrace. In the well where the dial's centre fell:
// snapped slabs still jutting from the rock under the coursed sides, a band
// of loose fill where masonry met bedrock, blocks wedged across the narrowing
// shaft and more tumbling away into the dark, with stars showing between
// them. Round the mountain: stunted pines and outcrops on the ledges under the
// footing walk. Far out over the cloud sea: the peaks of other mountains.
import { circle } from '../scenery-kit.js';
import { FOOT, edgeRadius, gates, spillAngle } from './terrace-9.js';

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Distance along a ray from the centre to the first and last tile it crosses;
// the same measure the mountain's inner wall is built from.
function rayRectangle(dx, dz, x, z, half) {
  const span = (d, c) =>
    Math.abs(d) < 1e-7 ? (Math.abs(c) <= half ? [-Infinity, Infinity] : null) : [(c - half) / d, (c + half) / d];
  const ax = span(dx, x),
    az = span(dz, z);
  if (!ax || !az) return null;
  const lo = Math.max(0, Math.min(...ax), Math.min(...az));
  const hi = Math.min(Math.max(...ax), Math.max(...az));
  return hi >= lo ? [lo, hi] : null;
}
function wellRadius(layout) {
  const cells = layout.cells.map((c) => [c.x - (layout.width - 1) / 2, c.y - (layout.height - 1) / 2]);
  return (a) => {
    const dx = Math.cos(a),
      dz = Math.sin(a);
    let inner = 20;
    for (const [x, z] of cells) {
      const cut = rayRectangle(dx, dz, x, z, 0.556);
      if (cut) inner = Math.min(inner, cut[0]);
    }
    return inner;
  };
}

// Colour falls toward the blue-black of the deep as the well goes down.
function deep(m, code, y) {
  const f = Math.min(1, Math.max(0, (-y - 2.2) / 7));
  return m.mix(code, 0x0e1626, 0.85 * f);
}

function gulf(m, layout) {
  const r = m.rng,
    radius = wellRadius(layout);
  // Keep clear of the four haunches that carry the clock's spouts.
  const nearHaunch = (a) => [0, Math.PI / 2, Math.PI, -Math.PI / 2].some((h) => Math.abs(wrap(a - h)) < 0.3);
  // Snapped paving slabs and their bedding, jutting from under the masonry.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * circle + r.range(-0.08, 0.08);
    if (nearHaunch(a)) continue;
    const wall = radius(a) - 0.2,
      y = r.range(-2.75, -2.45),
      out = r.range(0.22, 0.48),
      w = r.range(0.35, 0.7);
    m.frame(Math.cos(a) * (wall - out / 2 + 0.12), y, Math.sin(a) * (wall - out / 2 + 0.12), Math.PI / 2 - a, 1, () => {
      const tone = deep(m, r.next() < 0.5 ? 0x56646a : 0x67736f, y);
      m.box(0, 0, 0, w, 0.13, out + 0.24, tone);
      // The broken face is paler, rough with the fill showing beneath it.
      m.box(r.range(-0.05, 0.05), -0.01, -(out + 0.24) / 2 - 0.004, w * 0.9, 0.11, 0.012, deep(m, 0x8a918a, y));
      m.rock(r.range(-0.1, 0.1), -0.16, -0.02, w * 0.4, 0.12, out * 0.5, deep(m, 0x3e4644, y), deep(m, 0x5b6460, y), 6);
    }, r.range(-0.12, 0.05), r.range(-0.08, 0.08));
  }
  // A band of loose fill and rubble where masonry met the bedrock.
  for (let i = 0; i < 40; i++) {
    const a = r.next() * circle;
    if (nearHaunch(a)) continue;
    const wall = radius(a) - 0.3,
      y = r.range(-3.2, -2.85),
      s = r.range(0.08, 0.2);
    m.rock(Math.cos(a) * (wall - s * 0.4), y, Math.sin(a) * (wall - s * 0.4), s, s * 0.8, s * 0.9, deep(m, 0x4b5450, y), deep(m, 0x6d7570, y), 6, r.next() * circle);
  }
  // Blocks hanging out of the wall, half torn loose, held by bronze cramps.
  for (let i = 0; i < 9; i++) {
    const a = ((i + 0.5) / 9) * circle + r.range(-0.1, 0.1);
    if (nearHaunch(a)) continue;
    const y = r.range(-3.9, -3.3),
      wall = Math.max(1.86, radius(a) - 0.54) + 0.05;
    m.frame(Math.cos(a) * (wall - 0.28), y, Math.sin(a) * (wall - 0.28), Math.PI / 2 - a, 1, () => {
      const tone = deep(m, 0x5f6b6c, y);
      m.box(0, 0, 0, 0.55, 0.32, 0.5, tone);
      m.box(0, 0.165, 0, 0.5, 0.012, 0.45, deep(m, 0x7b8480, y));
      m.box(0.2, 0.18, 0.18, 0.06, 0.03, 0.22, deep(m, 0x6e5f3a, y));
    }, r.range(-0.5, -0.2), r.range(-0.25, 0.25));
  }
  // Blocks wedged across the narrowing shaft, and more falling away below.
  for (let i = 0; i < 42; i++) {
    const depth = i < 8 ? r.range(4.3, 5.0) : r.range(5.2, 10.2);
    const y = -depth,
      lim = depth < 6.6 ? 1.75 : 1.55;
    const a = r.next() * circle,
      d = i < 8 ? r.range(0.9, 1.4) : r.range(0, lim - 0.4);
    const s = i < 8 ? r.range(0.45, 0.7) : r.range(0.18, 0.5);
    const x = Math.cos(a) * d,
      z = Math.sin(a) * d;
    m.frame(x, y, z, r.next() * circle, 1, () => {
      const tone = deep(m, r.next() < 0.6 ? 0x56646a : 0x707a72, y);
      if (r.next() < 0.6) {
        m.box(0, 0, 0, s * 1.3, s * 0.62, s, tone);
        m.box(0, s * 0.31, 0, s * 1.22, 0.01, s * 0.92, deep(m, 0x87908a, y));
      } else m.rock(0, -s * 0.4, 0, s * 0.7, s * 0.8, s * 0.6, tone, deep(m, 0x7b847f, y), 7);
    }, r.range(-0.6, 0.6), r.range(-0.6, 0.6));
  }
  // Stars show far down between the falling blocks.
  m.glow(() => {
    for (let i = 0; i < 16; i++) {
      const y = -r.range(5.5, 10.5),
        a = r.next() * circle,
        d = r.range(0.1, 1.3);
      const x = Math.cos(a) * d,
        z = Math.sin(a) * d;
      const s = r.range(0.025, 0.05);
      m.crystal(x, y, z, s, s * 2, 0x9fb8c0, 0xe6dcb2, 4);
      m.crystal(x, y + s * 2, z, s * 0.8, -s * 1.6, 0x9fb8c0, 0xe6dcb2, 4);
    }
  });
}

// The same outer profile the mountain is built from, sampled at angle `a`.
function ledge(a, k) {
  const edge = edgeRadius(a);
  const ridge = 0.25 * Math.sin(7 * a + 1.43) + 0.2 * Math.sin(13 * a - 0.84) + 0.12 * Math.sin(27 * a + 0.18);
  const crease = Math.sin(17 * a + 0.87) + 0.35 * Math.cos(34 * a);
  const rows = {
    17: [edge + 2.05 + 0.3 * ridge, FOOT - 0.8 + 0.1 * crease],
    19: [edge + 2.6 + 0.5 * ridge, FOOT - 2.05 + 0.2 * crease],
    21: [edge + 3.5 + 0.7 * ridge, FOOT - 3.5 + 0.2 * crease]
  };
  const [rad, y] = rows[k];
  const phase = a + 0.011 * Math.sin(k * 1.89 + 2 * a);
  return [Math.cos(phase) * rad, y, Math.sin(phase) * rad];
}

// A stunted mountain pine, wind-bent away from the summit: a crooked trunk,
// short limbs, and the needles in flat dark clouds that overlap.
function pine(m, x, y, z, a, h) {
  const r = m.rng,
    lean = [Math.cos(a), 0, Math.sin(a)];
  const bark = 0x30261f,
    needles = r.next() < 0.5 ? 0x1c302f : 0x213634,
    lit = r.next() < 0.5 ? 0x3b5a50 : 0x34524c;
  const p = (t, sway) => [
    x + lean[0] * (t * h * 0.5 + sway) - lean[2] * sway * 0.5,
    y + t * h * (1 - 0.15 * t),
    z + lean[2] * (t * h * 0.5 + sway) + lean[0] * sway * 0.5
  ];
  const trunk = [p(-0.06, 0), p(0.25, -0.12), p(0.5, 0.06), p(0.78, -0.1), p(1, 0.02)];
  for (let i = 1; i < trunk.length; i++) {
    const w = (0.06 + 0.035 * h) * (1 - (0.6 * i) / trunk.length);
    m.tube(trunk[i - 1], trunk[i], w * 1.15, w, bark, 5);
  }
  // Each limb carries a cloud of needles close along it, lit on top.
  const layers = 3 + (r.next() < 0.5 ? 1 : 0);
  for (let k = 0; k < layers; k++) {
    const t = 0.42 + (0.5 * k) / (layers - 1),
      base = p(t, 0);
    const turn = a + r.range(-1.8, 1.8),
      len = h * r.range(0.2, 0.32) * (1 - 0.3 * (k / layers));
    const tip = [base[0] + Math.cos(turn) * len, base[1] + r.range(0.0, 0.1), base[2] + Math.sin(turn) * len];
    m.tube(base, tip, 0.03, 0.015, bark, 4);
    for (const f of [0.45, 0.95]) {
      const c = [base[0] + (tip[0] - base[0]) * f, base[1] + (tip[1] - base[1]) * f, base[2] + (tip[2] - base[2]) * f];
      const w = len * (f > 0.5 ? 0.62 : 0.5) + 0.12;
      m.rock(c[0], c[1] - 0.03, c[2], w, 0.12 + 0.03 * h, w * 0.72, needles, lit, 6, turn + r.range(-0.3, 0.3));
    }
  }
  const crown = trunk[4];
  m.rock(crown[0], crown[1] - 0.08, crown[2], 0.18 + h * 0.14, 0.2, 0.14 + h * 0.12, needles, lit, 7);
}

function mountainside(m) {
  const r = m.rng;
  const clear = (a, w) =>
    gates.every((g) => Math.abs(wrap(a - g.a)) > w) && Math.abs(wrap(a - spillAngle)) > 0.16;
  // Pines on the first ledge below the footing walk, and lower down.
  for (let j = 0; j < 144; j += 4) {
    const a = (j * circle) / 144 + (r.next() < 0.5 ? (circle / 144) * 2 : 0);
    if (!clear(a, 0.32) || r.next() < 0.35) continue;
    const k = r.next() < 0.7 ? 17 : 19;
    const [x, y, z] = ledge(a, k);
    pine(m, x, y - 0.08, z, a + r.range(-0.4, 0.4), r.range(1.1, 2.1) * (k === 17 ? 1 : 1.25));
  }
  // Outcrops of the bedrock breaking the slope.
  for (let j = 2; j < 144; j += 5) {
    const a = (j * circle) / 144;
    if (!clear(a, 0.28)) continue;
    const k = r.next() < 0.5 ? 19 : 21;
    const [x, y, z] = ledge(a, k);
    const s = r.range(0.5, 1.1);
    m.rock(x, y - 0.35, z, s, s * r.range(0.8, 1.4), s * 0.8, 0x3d4c55, 0x6a7678, 7, a);
  }
}

// Peaks of the mountains around, rising out of the cloud sea in the dark:
// crooked, with shoulders and gullies, their moonward faces a little paler.
function farPeaks(m) {
  const r = m.rng;
  const peak = (x, z, h, w) => {
    const n = 10,
      turn = r.next() * circle,
      tip = [r.range(-0.25, 0.25) * w, r.range(-0.25, 0.25) * w];
    const rows = [
      [-8.2, 1],
      [-7.4 + h * 0.12, 0.82],
      [-7.4 + h * 0.3, 0.6],
      [-7.4 + h * 0.5, 0.42],
      [-7.4 + h * 0.68, 0.27],
      [-7.4 + h * 0.86, 0.12],
      [-7.4 + h, 0.015]
    ];
    // Ridges run the height of the peak; gullies between them.
    const ridge = Array.from({ length: n }, (_, i) => (i % 3 === 0 ? 1.18 : i % 3 === 1 ? 0.92 : 0.8) * r.range(0.85, 1.15));
    const tone = (k) => m.mix(0x1b243b, 0x5f6d8b, Math.pow(k / (rows.length - 1), 1.6));
    let last;
    rows.forEach(([y, s], k) => {
      const f = k / (rows.length - 1);
      const ring = ridge.map((q, i) => {
        const a = turn + (i * circle) / n;
        const sk = s * (k ? q * r.range(0.9, 1.1) : 1);
        return [x + tip[0] * f + Math.cos(a) * w * sk, y, z + tip[1] * f + Math.sin(a) * w * sk * 0.8];
      });
      if (last)
        for (let i = 0; i < n; i++) {
          const q = (i + 1) % n,
            facing = 0.5 + 0.5 * Math.cos(turn + ((i + 0.5) * circle) / n + 2.4);
          const shade = 0.42 * (1 - facing) + (ridge[i] < 0.9 ? 0.12 : 0);
          const lo = m.mix(tone(k - 1), 0x111829, shade),
            hi = m.mix(tone(k), 0x111829, shade);
          m.face([last[i], ring[i], ring[q], last[q]], [lo, hi, hi, lo]);
        }
      last = ring;
    });
  };
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * circle + r.range(-0.12, 0.12),
      d = r.range(32, 54);
    const x = Math.cos(a) * d,
      z = Math.sin(a) * d,
      h = r.range(4.5, 9.5) * (d / 42);
    peak(x, z, h, h * r.range(0.38, 0.55));
    // Lesser summits shouldering the main one.
    for (let k = 0; k < 2; k++) {
      const t = a + (k ? 1 : -1) * r.range(0.05, 0.1);
      const dd = d + r.range(-3, 3),
        hh = h * r.range(0.4, 0.7);
      peak(Math.cos(t) * dd, Math.sin(t) * dd, hh, hh * r.range(0.5, 0.75));
    }
  }
}

export { gulf, mountainside, farPeaks };
