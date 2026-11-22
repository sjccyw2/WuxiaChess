// 絕情谷's crag and its thin waterfall. The water does not leap clear of the rock: it slides
// down a cleft cut back into a leaning face, between two buttresses, so that from behind
// the crag hides all of it, and whenever the cutaway thins the rock in front of it, the
// fall thins with it.
import { circle } from '../scenery-kit.js';
import { clamp, fade, lerp, noise, crag, mossy, clump, fern, pine, tuft } from './flora-11.js';

// Where a point of the face lies: `u` across it (0 in the cleft), `v` up it from 0 to 1.
function faceShape(cx, faceZ, foot, high, half) {
  const lean = (v) => 0.78 * v - 0.12 * v * v,
    cleft = (u, v) => 0.3 * Math.exp(-((u / 0.34) ** 2)) * (0.45 + 0.55 * v),
    curl = (u) => 0.62 * (u / half) ** 2;
  return (u, v, out = 0) => {
    const rough =
      0.1 * (noise(u * 2.6 + 3, v * 4.4) - 0.5) +
      0.035 * Math.sin(v * high * 8.5 + 2.4 * noise(u * 1.3, v * 2)) * fade((Math.abs(u) - 0.3) / 0.3);
    return [
      cx + u + 0.05 * (noise(v * 3 + 9, u) - 0.5),
      foot + v * high,
      faceZ - lean(v) - cleft(u, v) + curl(u) + rough * fade((Math.abs(u) - 0.12) / 0.25) + out
    ];
  };
}

function cascade(m, land, at) {
  const r = m.rng,
    [px, pz] = land.plunge,
    cx = px + 0.05,
    faceZ = pz - 0.9,
    foot = land.basin - 0.12,
    high = 3.25,
    half = 1.75,
    cap = m.mix(crag, mossy, 0.6),
    point = faceShape(cx, faceZ, foot, high, half);
  // The mass of the crag behind its face, and its shoulders.
  const back = faceZ - 1.55,
    base = at(cx, back) - 0.5;
  m.rock(cx, base, back - 0.25, 1.95, foot + high - base + 0.15, 1.15, crag, cap, 11, 0.3);
  m.rock(cx - 1.9, base + 0.2, back + 0.15, 1.25, 2.6, 1.0, m.mix(crag, 0x696e68, 0.4), cap, 9, 1.1);
  m.rock(cx + 1.85, base + 0.1, back + 0.1, 1.15, 2.8, 0.95, m.mix(crag, 0x8a8e86, 0.4), cap, 9, 2);
  m.rock(cx - 3.25, base + 0.2, back + 0.6, 0.85, 1.4, 0.75, crag, cap, 8, 0.7);
  m.rock(cx + 2.6, base + 0.4, back - 0.9, 1.0, 2.1, 0.9, crag, cap, 8, 2.6);
  m.rock(cx - 0.4, base + 0.7, back - 1.4, 1.6, 2.3, 1.1, m.mix(crag, 0x696e68, 0.3), cap, 8, 1.6);

  // The face: a sheet of rock in rough strata, wet and dark at its foot and in the cleft,
  // paler and mossed toward the crest; its top row folds back into the crag's crown.
  const cols = 22,
    rows = 14,
    wet = m.rgb(0x48514d),
    dry = m.rgb(0x8b9196),
    pale = m.rgb(0xa2a7a6),
    moss = m.rgb(0x52693f),
    grid = [];
  for (let j = 0; j <= rows + 1; j++) {
    const row = [];
    for (let i = 0; i <= cols; i++) {
      const u = -half + (2 * half * i) / cols,
        v = Math.min(1, j / rows);
      let p = point(u, v);
      if (j > rows) p = [p[0], p[1] + 0.12, p[2] - 0.75 + 0.1 * Math.sin(i * 1.7)];
      const damp = Math.max(1 - fade(v / 0.35), Math.exp(-((u / 0.42) ** 2)) * 0.85),
        band = 0.5 + 0.5 * Math.sin(v * high * 8.5 + 2.4 * noise(u * 1.3, v * 2));
      let c = lerp(0, 1, fade(v / 0.9));
      c = [0, 1, 2].map((k) => lerp(dry[k] * 0.86, pale[k], c * 0.5 + band * 0.2));
      c = c.map((n, k) => lerp(n, wet[k], damp * 0.75));
      const green = j > rows ? 0.85 : fade((noise(u * 1.9 + 4, v * 3.1) - 0.55) / 0.2) * 0.6;
      row.push([p, c.map((n, k) => lerp(n, moss[k], green))]);
    }
    grid.push(row);
  }
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = grid[j][i],
        b = grid[j][i + 1],
        c = grid[j + 1][i + 1],
        d = grid[j + 1][i];
      m.face([a[0], b[0], c[0], d[0]], [a[1], b[1], c[1], d[1]]);
    }
  // Ledges jut from the face where its strata are hardest, mossed on top.
  for (let k = 0; k < 9; k++) {
    const side = k % 2 ? 1 : -1,
      u = side * r.range(0.5, 1.45),
      v = r.range(0.15, 0.85),
      [x, y, z] = point(u, v, 0.02),
      s = r.range(0.14, 0.26);
    m.rock(x, y - s * 0.3, z - s * 0.4, s * 1.4, s * 0.55, s, m.mix(crag, 0x5d6460, 0.4), cap, 6);
  }
  // Buttresses frame the cleft, standing out from the face to either side.
  for (const side of [-1, 1]) {
    const [x, , z] = point(side * half * 0.92, 0);
    m.rock(x + side * 0.2, foot - 0.3, z - 0.35, 0.75, high * 0.9, 0.7, m.mix(crag, 0x6c726e, 0.3), cap, 9, side);
    m.rock(x - side * 0.25, foot - 0.2, z + 0.1, 0.42, high * 0.45, 0.4, crag, cap, 7, side * 2);
  }
  // The crown: mossy boulders along the crest, a notch between them where the water comes over.
  for (let k = 0; k < 7; k++) {
    const u = -half * 0.9 + (k * half * 1.8) / 6;
    if (Math.abs(u) < 0.32) continue;
    const [x, y, z] = point(u, 1),
      s = r.range(0.32, 0.5);
    m.rock(x, y - s * 0.4, z - 0.45, s * 1.2, s * 0.9, s, crag, m.mix(cap, 0x5e7a48, 0.5), 7, k);
  }
  // A pine has found a hold on the crag's shoulder, ferns and grass in the damp of its ledges.
  pine(m, cx - 1.95, base + 2.5, back + 0.15, 1.4);
  for (let k = 0; k < 10; k++) {
    const u = (k % 2 ? 1 : -1) * r.range(0.55, 1.6),
      v = r.range(0.05, 0.9),
      [x, y, z] = point(u, v, 0.06);
    if (k % 3) tuft(m, x, y, z + 0.03, 1.1, [0x4f6f40, 0x5f7d47, 0x6f8a4c]);
    else fern(m, x, y, z + 0.05, 0.22);
  }

  // The fall: a ribbon sliding down the cleft a hand's breadth off the rock, widening as it
  // goes, white at the core, threads of spray beside it, foam where it strikes the ledges.
  const white = m.rgb(0xf4f8f6),
    mist = m.rgb(0xd5e5e1),
    glass = m.rgb(0x9fc3bd),
    steps = 18;
  let last = null;
  for (let k = 0; k <= steps; k++) {
    const v = 1 - k / steps,
      w = 0.07 + 0.12 * (1 - v) + 0.02 * Math.sin(k * 1.3),
      sway = 0.02 * Math.sin(k * 0.9),
      foam = 1 - fade(Math.abs(v - 0.55) / 0.06) + (1 - fade(Math.abs(v - 0.27) / 0.05));
    const row = [-1, -0.45, 0, 0.45, 1].map((q) => {
      const p = point(q * w + sway, v, 0.05 + 0.025 * (1 - Math.abs(q)) + 0.03 * foam);
      return p;
    });
    const tone = [glass, mist, white, mist, glass].map((c, i) =>
      i === 2 ? c : c.map((n, ch) => lerp(n, white[ch], clamp(foam)))
    );
    if (last)
      for (let i = 0; i < 4; i++)
        m.face([last.row[i], row[i], row[i + 1], last.row[i + 1]], [last.tone[i], tone[i], tone[i + 1], last.tone[i + 1]]);
    last = { row, tone };
  }
  // Two thin threads that spill wide of the main fall.
  for (const side of [-1, 1]) {
    let prev = null;
    for (let k = 0; k <= 10; k++) {
      const v = 0.92 - (0.9 * k) / 10,
        u = side * (0.13 + 0.06 * (1 - v)),
        a = point(u - 0.018, v, 0.04),
        b = point(u + 0.018, v, 0.04);
      if (prev) m.face([prev[0], a, b, prev[1]], mist);
      prev = [a, b];
    }
  }
  // Over the lip: the stream comes out of the notch in the crown.
  const [lx, ly, lz] = point(0, 1, 0.05);
  m.face(
    [
      [lx - 0.08, ly + 0.03, lz - 0.6],
      [lx + 0.08, ly + 0.03, lz - 0.6],
      [lx + 0.09, ly + 0.005, lz],
      [lx - 0.09, ly + 0.005, lz]
    ],
    [glass, glass, white, white]
  );
  m.rock(lx, ly - 0.25, lz - 0.05, 0.22, 0.27, 0.18, m.mix(crag, 0x5d6460, 0.5), cap, 6);

  // The plunge pool's churned water: low foam rings and spray held close to the surface,
  // pale rocks wet with mist about it.
  const fy = land.basin + 0.07,
    [bx, , bz] = point(0, 0.02, 0.18);
  for (const [dx, dz, s] of [
    [0, 0.04, 0.17],
    [-0.16, 0.12, 0.1],
    [0.15, 0.1, 0.11]
  ])
    clump(m, bx + dx, fy + s * 0.1, bz + dz, s, s * 0.5, s * 0.8, 0xcfe0dc, 0xf6faf8, 6);
  for (let k = 0; k < 7; k++) {
    const a = 0.3 + (k * (Math.PI - 0.6)) / 6,
      d = r.range(0.42, 0.62),
      s = r.range(0.08, 0.15);
    m.rock(bx + Math.cos(a) * d, fy - 0.06, bz + Math.sin(a) * d * 0.6 - 0.1, s, s * 0.8, s * 0.8, 0x9aa3a2, 0xb6c2bf, 6);
  }
  // Boulders ring the plunge pool, mossy on the side away from the spray.
  for (let k = 0; k < 11; k++) {
    const a = 0.25 + (k * (circle - 1.6)) / 10 + Math.PI * 0.5,
      d = r.range(0.85, 1.05),
      s = r.range(0.14, 0.32),
      x = px + Math.cos(a) * d,
      z = pz + Math.sin(a) * d * 0.9;
    if (z < faceZ - 0.2) continue;
    m.rock(x, land.basin - 0.08, z, s, s * r.range(0.7, 1.3), s * 0.85, crag, cap, 7);
  }
  fern(m, cx + 1.0, foot + 0.2, faceZ + 0.75, 0.3);
  fern(m, cx - 1.05, foot + 0.2, faceZ + 0.8, 0.3);
}

export { cascade };
