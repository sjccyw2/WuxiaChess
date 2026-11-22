import { TAU, river, wetStone, stone, moss } from './kit-12.js';

// 鐵掌溪灘's stepping stones. A dry tile inside the stream (rows 4 to 7) is no square of
// pebbled ground but a broad flat-topped slab standing out of the water: its top level at the
// board's height and pale where it dries, its edges rounded and dark with wet, foam piled on
// its upstream side and trailing off downstream. Stones that are not to be stood on (the
// great boulder) keep only the water round them.

const inStream = (cell) => cell.y >= 4 && cell.y <= 7;
const top = 0.04,
  surface = -0.012;

// The water under and round a stone: the stream's colour, darker toward the slab, with the
// pale streaks the current draws out.
function waterFloor(m, p) {
  const r = m.rng,
    col = m.rgb(p[5]),
    dark = m.mix(p[5], 0x35585e, 0.45);
  m.face(
    [
      [-0.502, surface, -0.502],
      [-0.502, surface, 0.502],
      [0.502, surface, 0.502],
      [0.502, surface, -0.502]
    ],
    [col, dark, col, dark]
  );
  for (let i = 0; i < 4; i++) {
    const x = r.range(-0.45, 0.2),
      z = r.range(-0.46, 0.46),
      len = r.range(0.16, 0.3),
      w = r.range(0.01, 0.022);
    m.face(
      [
        [x, surface + 0.003, z - w],
        [x + len * 0.35, surface + 0.003, z + w],
        [x + len, surface + 0.003, z]
      ],
      m.mix(p[5], river.foam, r.range(0.3, 0.6))
    );
  }
}

// The outline of a slab: a rounded square, nicked here and there, that keeps within the tile.
function outline(m, n, reach) {
  const r = m.rng,
    turn = r.range(-0.15, 0.15);
  return Array.from({ length: n }, (_, i) => {
    const a = turn + (i / n) * TAU,
      c = Math.cos(a),
      s = Math.sin(a),
      // A superellipse: square-shouldered, round-cornered.
      k = reach / Math.pow(Math.abs(c) ** 4 + Math.abs(s) ** 4, 0.25),
      nick = r.next() < 0.18 ? r.range(0.86, 0.93) : r.range(0.96, 1.02);
    return [
      Math.max(-0.49, Math.min(0.49, c * k * nick)),
      Math.max(-0.49, Math.min(0.49, s * k * nick))
    ];
  });
}

// One stepping slab. Its top stays flat and level at the board's height over the middle of
// the tile; lichen and dry patches only change its colour.
function slab(m, p) {
  const r = m.rng,
    n = 18,
    rim = outline(m, n, r.range(0.4, 0.44));
  const dry = m.mix(p[0], p[1], 0.55),
    worn = m.mix(p[1], 0xc9c2ad, 0.3),
    damp = m.mix(p[0], p[2], 0.5),
    wet = m.mix(p[2], wetStone, 0.65),
    lichen = m.mix(dry, moss, 0.35);
  // The top: a fan from a worn centre through a ring of patches out to the edge of the bevel.
  const centre = [r.range(-0.03, 0.03), top, r.range(-0.03, 0.03)],
    ring = rim.map(([x, z]) => [x * 0.55, top, z * 0.55]),
    edge = rim.map(([x, z]) => [x * 0.9, top, z * 0.9]);
  const ringTone = ring.map(() => (r.next() < 0.25 ? lichen : m.mix(dry, worn, r.range(0, 0.6)))),
    edgeTone = edge.map(() => (r.next() < 0.3 ? lichen : m.mix(dry, damp, r.range(0.1, 0.35))));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([centre, ring[j], ring[i]], [worn, ringTone[j], ringTone[i]]);
    m.face(
      [ring[i], ring[j], edge[j], edge[i]],
      [ringTone[i], ringTone[j], edgeTone[j], edgeTone[i]]
    );
  }
  // The rounded edge, the flank darkening toward the water and the wet foot under it.
  const shoulder = rim.map(([x, z]) => [x * 0.98, top - 0.014, z * 0.98]),
    waterline = rim.map(([x, z]) => [x * 1.02, surface + 0.006, z * 1.02]),
    foot = rim.map(([x, z]) => [x * 1.05, surface - 0.07, z * 1.05]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n,
      lit = 0.92 + 0.08 * Math.cos(i * 1.9);
    m.face(
      [edge[i], edge[j], shoulder[j], shoulder[i]],
      [edgeTone[i], edgeTone[j], damp, damp],
      lit
    );
    m.face([shoulder[i], shoulder[j], waterline[j], waterline[i]], [damp, damp, wet, wet], lit);
    m.face([waterline[i], waterline[j], foot[j], foot[i]], wet, lit * 0.9);
  }
  return rim;
}

// Foam round a stone in the current, which runs east: a broad ragged collar on the upstream
// (west) side, a thin one along the flanks and a pale wake drawn off downstream.
function collar(m, rim, p, scale = 1) {
  const r = m.rng,
    n = rim.length,
    white = m.rgb(river.foam),
    pale = m.mix(p[5], river.foam, 0.5),
    y = surface + 0.004;
  const inner = rim.map(([x, z]) => [x * 1.03, y, z * 1.03]);
  const outer = rim.map(([x, z]) => {
    const len = Math.hypot(x, z) || 1,
      up = Math.max(0, -x / len),
      w = (0.02 + 0.07 * up * up + r.range(0, 0.025)) * scale;
    return [
      Math.max(-0.5, Math.min(0.5, x * 1.03 + (x / len) * w)),
      y,
      Math.max(-0.5, Math.min(0.5, z * 1.03 + (z / len) * w))
    ];
  });
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([inner[i], inner[j], outer[j], outer[i]], [white, white, pale, pale]);
  }
  // The wake: two pale tongues trailing east from the downstream shoulder.
  const east = rim.reduce((a, b) => (b[0] > a[0] ? b : a));
  for (const s of [-1, 1]) {
    const z0 = east[1] + s * 0.12,
      x0 = Math.min(0.47, east[0] * 1.04);
    m.face(
      [
        [x0, y, z0 - 0.02],
        [x0, y, z0 + 0.02],
        [0.5, y, z0 + s * r.range(0.02, 0.06)]
      ],
      [pale, pale, m.mix(p[5], river.foam, 0.2)]
    );
  }
}

// Small wet stones in the corners of a stepping tile, each with a ring of foam.
function pebblesInWater(m, p, rim) {
  const r = m.rng,
    white = m.rgb(river.foam);
  for (const [cx, cz] of [
    [-0.45, -0.45],
    [0.45, -0.45],
    [0.45, 0.45],
    [-0.45, 0.45]
  ]) {
    if (r.next() < 0.35) continue;
    // Keep clear of the slab.
    const x = cx + r.range(-0.03, 0.03),
      z = cz + r.range(-0.03, 0.03),
      rad = r.range(0.025, 0.045);
    if (rim.some(([u, v]) => Math.hypot(u - x, v - z) < rad + 0.02)) continue;
    m.rock(
      x,
      surface - 0.02,
      z,
      rad,
      rad * 1.1,
      rad * 0.85,
      m.mix(p[2], wetStone, 0.6),
      m.mix(p[0], stone.pale, 0.3),
      6
    );
    m.face(
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * TAU;
        return [x + Math.cos(a) * rad * 1.5, surface + 0.003, z + Math.sin(a) * rad * 1.5];
      }),
      m.mix(p[5], river.foam, 0.45)
    );
    m.face(
      [
        [x - rad * 1.4, surface + 0.004, z - rad * 0.6],
        [x - rad * 1.4, surface + 0.004, z + rad * 0.6],
        [x - rad * 0.6, surface + 0.004, z]
      ],
      white
    );
  }
}

// The `ground` hook: lays the stream's dry tiles itself and leaves the banks to the board.
function streamGround(m, p, cell) {
  if (!inStream(cell)) return false;
  waterFloor(m, p);
  if (cell.kind === 'rock') return true;
  const rim = slab(m, p);
  collar(m, rim, p);
  pebblesInWater(m, p, rim);
  return true;
}

export { streamGround, inStream, collar };
