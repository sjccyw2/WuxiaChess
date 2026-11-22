import { Model, circle, midway } from '../scenery-kit.js';
import { lantern, roof } from '../maze-models.js';
import { ground, fallenPetals } from './paving-14.js';
import { houseDetail } from './house-14.js';
import { gardenFurnishings, gardenLayer, cloudPine, taihuStone } from './garden-14.js';

// 黑木繡閣: the hidden garden on the very top of 黑木崖. The paved court stands on a
// crag of black rock that drops sheer into the cloud; garden ground lies behind it to
// the north and west, where the little embroidery house, the plum trees, the bamboo
// and the whitewashed wall are. The cliff path and its rope hoist arrive at the
// south-west corner. The camera stands to the south-east, so everything tall is kept
// north and west of the paving.

const SPOKES = 288;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (lo, hi, v) => {
  const t = clamp((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
// A cheap repeatable hash of an integer, 0 to 1.
const hash = (i, salt = 0) => {
  const n = Math.sin(i * 127.1 + salt * 311.7 + 1.3) * 43758.5453;
  return n - Math.floor(n);
};
// A compass bearing as a spoke: 0 is east, 90 south, 180 west, -90 north.
const degrees = (d) => ((((d / 360) * SPOKES) % SPOKES) + SPOKES) % SPOKES;

// Garden ground beyond the paving, as overlapping rounds [x, z, radius]: the house
// terrace, the north walk, the plum grove in the cut north-west corner, the west
// strip and the landing of the cliff path.
const beds = [
  [3.6, -7.9, 3.05],
  [0.4, -7.5, 2.6],
  [-2.6, -7.1, 2.6],
  [-5.1, -5.0, 2.3],
  [-6.4, -1.8, 1.5],
  [-6.4, 0.9, 1.4],
  [-6.5, 3.3, 1.4],
  [-6.75, 4.6, 1.55]
];
const house = { x: 3.6, z: -8.0 };
const pondLevel = -0.15;
const mistTone = 0xbac4c8;

// The top of the crag, measured along spokes from the middle of the board: where
// the paving ends, where the ground ends, how high its lip is and whether it is
// garden (1) or bare cliff edge (0).
function summit(layout) {
  const { width, height, mask } = layout;
  const paved = (x, z) => mask[Math.floor(z + height / 2)]?.[Math.floor(x + width / 2)] === '#';
  const ring = (f) => Array.from({ length: SPOKES }, (_, i) => f(i, (i * circle) / SPOKES));
  const widen = (values, reach) =>
    ring((i) => {
      let v = 0;
      for (let k = -reach; k <= reach; k++) v = Math.max(v, values[(i + k + SPOKES) % SPOKES]);
      return v;
    });
  const blur = (values, reach) =>
    ring((i) => {
      let sum = 0;
      for (let k = -reach; k <= reach; k++) sum += values[(i + k + SPOKES) % SPOKES];
      return sum / (2 * reach + 1);
    });
  const board = ring((i, a) => {
    let r = 9.2;
    while (r > 3 && !paved(Math.cos(a) * r, Math.sin(a) * r)) r -= 0.02;
    return r;
  });
  // The stepped corners are bridged, so the rock runs past them in one line.
  const rim = blur(widen(board, 3), 2);
  let top = ring((i, a) => {
    const c = Math.cos(a),
      s = Math.sin(a);
    let r = rim[i] + 0.27;
    for (const [x, z, rad] of beds) {
      const along = x * c + z * s,
        off = x * s - z * c;
      if (Math.abs(off) < rad) r = Math.max(r, along + Math.sqrt(rad * rad - off * off));
    }
    return r;
  });
  top = blur(blur(top, 3), 2).map((r, i) => Math.max(r, rim[i] + 0.25));
  const garden = top.map((r, i) => smooth(0.45, 1.1, r - rim[i]));
  top = top.map((r, i) => r + garden[i] * 0.14 * Math.sin(i * 0.37) * Math.sin(i * 0.11 + 1));
  const lip = garden.map((g) => lerp(-0.47, -0.075, g));
  const read = (values, f) => {
    const i = Math.floor(f),
      t = f - i;
    return lerp(values[i % SPOKES], values[(i + 1) % SPOKES], t);
  };
  const spoke = (x, z) => ((Math.atan2(z, x) / circle) * SPOKES + SPOKES) % SPOKES;
  // Height of the ground at a point outside the paving: level by the court, a
  // little rise and fall further into the garden, down to the lip at the edge.
  const ground = (x, z) => {
    const f = spoke(x, z),
      r = Math.hypot(x, z);
    const inland =
      smooth(0.4, 1.3, r - read(rim, f)) * smooth(0, 0.8, read(top, f) - r) * read(garden, f);
    return (
      read(lip, f) +
      inland * (0.07 + 0.05 * Math.sin(x * 1.3 + z * 0.7) + 0.04 * Math.sin(z * 1.9 - x * 0.8))
    );
  };
  return { rim, top, garden, lip, read, spoke, ground };
}

// The cliff in section, from the lip down: [flute set, reach beyond the lip, depth of
// the fluting, drop, ledge]. Each sheer face keeps one set of flutes from top to
// bottom; a narrow ledge, broken into blocks of its own, joins it to the next.
const strata = [
  [0, 0, 0, 0, 0],
  [0, 0.07, 0.16, 0.1, 0],
  [0, 0.1, 0.3, 1.0, 1],
  [1, 0.36, 0.45, 1.16, 1],
  [1, 0.42, 0.5, 2.55, 2],
  [2, 0.72, 0.6, 2.75, 2],
  [2, 0.8, 0.7, 4.3, 3],
  [3, 1.3, 0.8, 4.55, 3],
  [3, 1.45, 0.9, 6.7, 4],
  [3, 2.5, 1.1, 9.2, 4]
];
const fluteWidth = [4, 6, 8, 12];
const blockWidth = [0, 6, 8, 9, 12];
// Columns of rock side by side: each stands out by its own amount, with a sharp
// joint between neighbours.
function flute(set, i) {
  const cell = fluteWidth[set],
    count = SPOKES / cell,
    f = i / cell,
    c = Math.floor(f);
  return lerp(hash(c % count, set), hash((c + 1) % count, set), smooth(0.22, 0.78, f - c));
}
// The blocks a ledge is broken into: each has dropped by its own amount.
function block(ledge, i) {
  const cell = blockWidth[ledge],
    count = SPOKES / cell,
    f = i / cell,
    c = Math.floor(f);
  return lerp(
    hash(c % count, ledge + 30),
    hash((c + 1) % count, ledge + 30),
    smooth(0.38, 0.62, f - c)
  );
}
function cliffSection(land, i) {
  const a = (i * circle) / SPOKES;
  return strata.map(([set, out, depth, drop, ledge], k) => {
    const wave = 0.6 * Math.sin(a * 3 + ledge * 1.7) + 0.4 * Math.sin(a * 7 + ledge * 2.9);
    const loose = ledge > 0 && k < 9;
    return [
      land.top[i] + out + depth * flute(set, i),
      land.lip[i] - drop - (loose ? 0.14 * drop * wave + 0.75 * (block(ledge, i) - 0.5) : 0)
    ];
  });
}
// How far out the rock face stands at a spoke (which may fall between two) and height.
function faceRadius(sections, f, y) {
  const at = (i) => {
    const s = sections[i % SPOKES];
    let k = 0;
    while (k < s.length - 2 && s[k + 1][1] > y) k++;
    const t = clamp((s[k][1] - y) / Math.max(0.001, s[k][1] - s[k + 1][1]));
    return lerp(s[k][0], s[k + 1][0], t);
  };
  const i = Math.floor(f);
  return lerp(at(i), at(i + 1), f - i);
}

// Black rock: near-black columns, here and there a rusty seam, paler on the ledges
// where light and lichen reach, and lost in the cloud lower down.
function rockTone(m, land, i, k, y) {
  const set = strata[k][0],
    cell = Math.floor(i / fluteWidth[set]);
  let c = m.mix(0x17181c, 0x33353c, hash(cell, set + 5) * 0.75 + 0.25 * hash(i, k + 20));
  if (hash(cell, set + 9) > 0.8) c = m.mix(c, 0x3b2d29, 0.55);
  if (k === 3 || k === 5 || k === 7) c = m.mix(c, 0x585b5e, 0.2 + 0.3 * flute(set, i));
  if (k === 3 && hash(i, 3) > 0.45) c = m.mix(c, 0x4d5c3f, 0.5);
  if (k <= 1) c = m.mix(0x3a3c40, 0x505255, hash(i, 7));
  return m.mix(c, mistTone, 0.92 * smooth(-3.3, -6.9, y));
}
function groundTone(m, x, z, garden, edge) {
  const n = 0.5 + 0.3 * Math.sin(x * 2.1 + z * 1.3) + 0.2 * Math.sin(z * 3.7 - x * 1.9);
  const moss = m.mix(0x566843, 0x7d8a5b, n),
    earth = m.mix(0x6c6052, 0x8a7a64, n),
    rock = m.mix(0x3b3d42, 0x55575a, n);
  const soil = m.mix(moss, earth, smooth(0.5, 0.85, 0.5 + 0.5 * Math.sin(x * 0.9 - z * 1.1 + 2)));
  return m.mix(rock, soil, garden * smooth(0.05, 0.5, edge));
}

// A dark peak: sheer ribbed sides, a broken crown with a little green on it, paler
// toward its foot where the cloud takes it. Far ones are hazier all over.
function peak(m, x, z, base, w, d, H, haze, horizon, n = 14) {
  const r = m.rng,
    spin = r.range(0, circle),
    lean = [r.range(-0.2, 0.2), r.range(-0.2, 0.2)];
  const spokes = Array.from({ length: n }, (_, i) => [
    spin + (i / n) * circle + r.range(-0.15, 0.15),
    i % 2 ? r.range(0.58, 0.76) : r.range(0.92, 1.15),
    r.range(0.82, 1)
  ]);
  const levels = [
    [0, 1],
    [0.18, 0.92],
    [0.34, 0.84],
    [0.5, 0.77],
    [0.64, 0.69],
    [0.77, 0.58],
    [0.87, 0.46],
    [0.94, 0.33],
    [1, 0.15]
  ];
  // Each level is pushed in or out a little of its own, so the sides step and bulge.
  const bulge = levels.map(() => r.range(0.93, 1.07));
  const rings = levels.map(([k, s], j) =>
    spokes.map(([a, q, crest]) => [
      x + Math.cos(a) * w * q * s * bulge[j] + lean[0] * k * w,
      base + k * H * (k > 0.9 ? crest : 1),
      z + Math.sin(a) * d * q * s * bulge[j] + lean[1] * k * d
    ])
  );
  const rock = m.mix(0x1b1e24, 0x30353d, r.next()),
    crown = m.mix(0x2f4034, 0x44543f, r.next());
  const tone = (k, i) => {
    const lost = clamp(haze + 0.5 * (1 - k) ** 2.5);
    return m.mix(k > 0.95 ? crown : i % 2 ? rock : m.mix(rock, 0x4a4f57, 0.4), horizon, lost);
  };
  for (let j = 0; j < levels.length - 1; j++)
    for (let i = 0; i < n; i++) {
      const q = (i + 1) % n,
        lo = levels[j][0],
        hi = levels[j + 1][0];
      m.face(
        [rings[j][i], rings[j + 1][i], rings[j + 1][q], rings[j][q]],
        [tone(lo, i), tone(hi, i), tone(hi, i), tone(lo, i)],
        0.92 + 0.04 * ((i * 3 + j) % 3)
      );
    }
  const last = rings[levels.length - 1],
    tip = [x + lean[0] * w, base + H * 1.03, z + lean[1] * d];
  for (let i = 0; i < n; i++) m.face([tip, last[(i + 1) % n], last[i]], tone(1, 0));
  // Where a tree could root on its crown.
  return [tip[0], Math.min(...last.map((p) => p[1])), tip[2]];
}

// The crag itself: the ground round the court, the fluted cliff under it and the
// pinnacles that have come away from its south and east faces.
// Bedding planes across each stretch of the section, the same at every spoke.
const bedding = [0, 1, 0, 2, 0, 2, 0, 1, 0];
function crag(m, land, sections) {
  const stations = 6;
  const apron = [],
    tones = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = (i * circle) / SPOKES,
      c = Math.cos(a),
      s = Math.sin(a);
    const row = [],
      tone = [];
    for (let j = 0; j < stations; j++) {
      const inner = land.rim[i] - 0.35,
        r = j === 0 ? 4.6 : lerp(inner, land.top[i], (j - 1) / (stations - 2));
      const x = c * r,
        z = s * r;
      row.push([x, j === stations - 1 ? land.lip[i] : land.ground(x, z), z]);
      tone.push(groundTone(m, x, z, land.garden[i], land.top[i] - r));
    }
    apron.push(row);
    tones.push(tone);
  }
  for (let i = 0; i < SPOKES; i++) {
    const n = (i + 1) % SPOKES;
    for (let j = 0; j < stations - 1; j++)
      m.face(
        [apron[i][j], apron[i][j + 1], apron[n][j + 1], apron[n][j]],
        [tones[i][j], tones[i][j + 1], tones[n][j + 1], tones[n][j]]
      );
  }
  // The sheer faces are banded with beds of rock: at each bedding plane the face
  // above stands a little proud and steps back under a thin dark seam, so the
  // strata read across the columns.
  const wall = [],
    shade = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = (i * circle) / SPOKES,
      c = Math.cos(a),
      s = Math.sin(a),
      sec = sections[i],
      row = [],
      tone = [];
    for (let k = 0; k < sec.length; k++) {
      const [r, y] = sec[k];
      row.push([c * r, y, s * r]);
      tone.push(rockTone(m, land, i, k, y));
      if (k === sec.length - 1) break;
      const [r1, y1] = sec[k + 1],
        beds = bedding[k];
      for (let b = 1; b <= beds; b++) {
        const t = b / (beds + 1) + 0.06 * (hash(Math.floor(i / 5), k * 7 + b) - 0.5),
          rr = lerp(r, r1, t),
          yy = lerp(y, y1, t) + 0.05 * Math.sin(a * 5 + b + k),
          proud = 0.04 + 0.05 * hash(Math.floor(i / 3), k * 11 + b),
          base = rockTone(m, land, i, k, yy),
          band = m.mix(base, b % 2 ? 0x45484c : 0x121316, 0.3);
        row.push([c * (rr + proud), yy, s * (rr + proud)]);
        tone.push(m.mix(band, 0x6a6c6c, 0.2));
        row.push([c * (rr - 0.03), yy - 0.05, s * (rr - 0.03)]);
        tone.push(m.mix(base, 0x0c0d0f, 0.45));
      }
    }
    wall.push(row);
    shade.push(tone);
  }
  for (let i = 0; i < SPOKES; i++) {
    const n = (i + 1) % SPOKES;
    for (let k = 0; k < wall[i].length - 1; k++)
      m.face(
        [wall[i][k], wall[n][k], wall[n][k + 1], wall[i][k + 1]],
        [shade[i][k], shade[n][k], shade[n][k + 1], shade[i][k + 1]],
        0.93 + 0.07 * hash(i, k)
      );
  }
  // Pinnacles: [bearing, how far off the lip, top, girth]. The crowns of the higher
  // ones are kept, for the pines that grow on them.
  const crowns = [];
  for (const [bearing, off, top, girth] of [
    [61, 3.0, -1.5, 0.85],
    [68, 3.9, -3.1, 0.6],
    [112, 2.7, -2.3, 0.7],
    [24, 3.1, -2.0, 0.8],
    [-14, 2.8, -1.3, 0.7],
    [-21, 3.6, -3.4, 0.55],
    [188, 3.0, -1.0, 0.8],
    [226, 3.4, -1.8, 0.75]
  ]) {
    const i = Math.round(degrees(bearing)) % SPOKES,
      a = (i * circle) / SPOKES,
      d = land.top[i] + off;
    const crown = peak(
      m,
      Math.cos(a) * d,
      Math.sin(a) * d,
      -8,
      girth,
      girth * 0.9,
      top + 8,
      0,
      mistTone,
      12
    );
    if (top > -2) crowns.push(crown);
  }
  return crowns;
}

// Life on the ledges: tufts of grass and fern on the narrow shelves, and creepers
// hanging from their lips down the face below.
function ledgeGrowth(m, sections) {
  const r = m.rng;
  for (let j = 0; j < 64; j++) {
    const k = j % 2 ? 3 : 5,
      f = (j * 4.5 + r.range(0, 3)) % SPOKES,
      i = Math.floor(f),
      a = (f * circle) / SPOKES,
      [r0, y0] = sections[i][k - 1],
      [r1, y1] = sections[i][k],
      t = r.range(0.45, 0.8),
      rr = lerp(r0, r1, t),
      y = lerp(y0, y1, t),
      c = Math.cos(a),
      s = Math.sin(a);
    const green = r.pick([0x3c5a34, 0x4a6a3a, 0x56703e]);
    m.rock(
      c * rr,
      y - 0.06,
      s * rr,
      r.range(0.12, 0.22),
      r.range(0.08, 0.16),
      r.range(0.1, 0.18),
      m.mix(green, 0x1d2a1c, 0.5),
      green,
      6,
      r.range(0, 3)
    );
    for (let l = 0; l < 4; l++) {
      const turn = r.range(0, circle),
        len = r.range(0.12, 0.22),
        base = [c * rr, y + 0.02, s * rr];
      m.leaf(
        base,
        [base[0] + Math.cos(turn) * len, y + len * 0.5, base[2] + Math.sin(turn) * len],
        0.025,
        0x3f6a3a,
        0x7a9a50,
        0.03
      );
    }
    // A creeper from every other tuft, down over the lip of the ledge.
    if (j % 2 === 0) {
      const drop = r.range(0.7, 1.4),
        pts = [];
      for (let q = 0; q <= 6; q++) {
        const yy = y1 - (drop * q) / 6,
          out = faceRadius(sections, f, yy) + 0.04 + 0.03 * Math.sin(q * 1.7);
        pts.push([c * out + s * 0.04 * Math.sin(q), yy, s * out - c * 0.04 * Math.sin(q)]);
      }
      m.line(pts, 0.008, 0x3d4a2c, 3);
      for (let q = 1; q <= 6; q++) {
        const p = pts[q],
          turn = a + r.range(-1.2, 1.2);
        m.leaf(
          p,
          [p[0] + Math.cos(turn) * 0.08, p[1] - 0.03, p[2] + Math.sin(turn) * 0.08],
          0.03,
          0x355a30,
          0x6a8c48,
          0.01
        );
      }
    }
  }
}

// Flat stones let into the moss: from the house steps to the court, a walk
// westward under the plum trees, and across the landing of the cliff path.
function steppingStones(m, land) {
  const r = m.rng;
  for (const [x, z, size] of [
    [2.1, -6.75, 0.25],
    [1.35, -7.05, 0.28],
    [0.55, -6.95, 0.24],
    [-0.3, -7.2, 0.29],
    [-1.15, -7.0, 0.25],
    [-1.95, -7.3, 0.27],
    [-2.8, -7.05, 0.24],
    [-3.6, -6.6, 0.28],
    [-4.3, -6.0, 0.25],
    [-4.9, -5.3, 0.27],
    [-6.6, 3.7, 0.3],
    [-6.55, 4.5, 0.27],
    [-6.5, 5.25, 0.25]
  ])
    m.rock(
      x,
      land.ground(x, z) - 0.035,
      z,
      size,
      0.055,
      size * r.range(0.7, 0.95),
      0x7d786f,
      r.pick([0xa39d91, 0xaea898, 0x999489]),
      7,
      r.range(0, 3)
    );
}

const blossom = [0xb9263f, 0xd23f55, 0xe25f70, 0xc93349];
// One plum blossom, or a knot of them: a small red tent of petals.
function bloom(m, p, size, double = true) {
  const r = m.rng,
    a = r.range(0, circle),
    col = r.pick(blossom);
  for (let k = 0; k < (double ? 2 : 1); k++) {
    const t = a + k * 1.7,
      dx = Math.cos(t) * size,
      dz = Math.sin(t) * size;
    m.leaf(
      [p[0] - dx, p[1], p[2] - dz],
      [p[0] + dx, p[1] + size * 0.3, p[2] + dz],
      size * 0.55,
      col,
      m.mix(col, 0xf6a3ab, 0.45),
      size * 0.5
    );
  }
}
// An old red plum: a short twisted trunk, angular limbs, bare twigs thick with
// blossom and no leaf yet.
function plumTree(m, x, y, z, size, yaw) {
  const r = m.rng,
    bark = 0x2a2220,
    barkLit = 0x41332d;
  m.frame(x, y, z, yaw, size, () => {
    const trunk = [
      [0, -0.12, 0],
      [0.06, 0.14, 0.04],
      [0.12, 0.38, 0.02],
      [0.02, 0.56, -0.06],
      [-0.05, 0.74, -0.04],
      [0.13, 1.02, 0.02]
    ];
    const girth = [0.14, 0.12, 0.105, 0.095, 0.08, 0.06];
    for (let k = 1; k < trunk.length; k++)
      m.tube(trunk[k - 1], trunk[k], girth[k - 1], girth[k], k % 2 ? bark : barkLit, 8);
    // Old wood: burrs and a hollow on the trunk, a flare of root into the moss.
    for (const [k, side] of [
      [1, 1],
      [3, -1]
    ])
      m.rock(
        trunk[k][0] + side * 0.07,
        trunk[k][1] - 0.06,
        trunk[k][2],
        0.06,
        0.1,
        0.055,
        bark,
        barkLit,
        6
      );
    m.face(
      [
        [0.13, 0.42, 0.075],
        [0.17, 0.5, 0.06],
        [0.13, 0.58, 0.07],
        [0.09, 0.5, 0.085]
      ],
      0x120e0d
    );
    for (let k = 0; k < 4; k++) {
      const a = (k * circle) / 4 + 0.5;
      m.tube([0, 0.02, 0], [Math.cos(a) * 0.24, -0.08, Math.sin(a) * 0.24], 0.06, 0.02, bark, 5);
    }
    for (let k = 0; k < 8; k++) {
      const from = trunk[[2, 3, 3, 4, 4, 5, 5, 5][k]],
        a = k * 2.4 + r.range(-0.4, 0.4),
        len = r.range(0.75, 1.15);
      const elbow = [
        from[0] + Math.cos(a) * len * 0.45,
        from[1] + len * 0.28 + r.range(-0.05, 0.1),
        from[2] + Math.sin(a) * len * 0.45
      ];
      const turn = a + r.range(-0.9, 0.9);
      const tip = [
        elbow[0] + Math.cos(turn) * len * 0.55,
        elbow[1] + len * r.range(0.15, 0.5),
        elbow[2] + Math.sin(turn) * len * 0.55
      ];
      m.tube(from, elbow, 0.05, 0.034, bark, 6);
      m.tube(elbow, tip, 0.034, 0.011, barkLit, 5);
      for (let q = 1; q < 3; q++) {
        const at = midway(from, elbow, 0.35 + q * 0.25);
        bloom(m, [at[0] + r.range(-0.05, 0.05), at[1] + 0.04, at[2] + r.range(-0.05, 0.05)], 0.09);
      }
      for (let q = 1; q < 4; q++) {
        const at = midway(elbow, tip, q / 3.3);
        bloom(m, [at[0] + r.range(-0.06, 0.06), at[1] + 0.03, at[2] + r.range(-0.06, 0.06)], 0.1);
      }
      for (let j = 0; j < 3; j++) {
        const b = midway(elbow, tip, 0.2 + 0.3 * j),
          swing = turn + (j % 2 ? 1 : -1) * r.range(0.6, 1.3),
          l = r.range(0.26, 0.46);
        const end = [
          b[0] + Math.cos(swing) * l,
          b[1] + l * r.range(0.2, 0.7),
          b[2] + Math.sin(swing) * l
        ];
        m.tube(b, end, 0.017, 0.006, barkLit, 3);
        for (let q = 1; q <= 3; q++) {
          const at = midway(b, end, q / 3);
          bloom(
            m,
            [at[0] + r.range(-0.05, 0.05), at[1] + 0.02, at[2] + r.range(-0.05, 0.05)],
            r.range(0.075, 0.11)
          );
        }
      }
    }
    // Fallen petals round the foot.
    for (let k = 0; k < 8; k++) {
      const a = r.range(0, circle),
        d = r.range(0.25, 1.1);
      bloom(m, [Math.cos(a) * d, 0.0, Math.sin(a) * d], 0.04, false);
    }
  });
}
// A stand of tall bamboo: jointed culms that arch at the top under sprays of leaf.
function bambooStand(m, x, y, z, count, spread, height) {
  const r = m.rng;
  for (let j = 0; j < count; j++) {
    const a = r.range(0, circle),
      d = Math.sqrt(r.next()) * spread,
      bx = x + Math.cos(a) * d,
      bz = z + Math.sin(a) * d,
      h = height * r.range(0.68, 1.1),
      lean = r.range(0, circle),
      bend = h * r.range(0.1, 0.24);
    const culm = m.mix(0x557f44, 0x7da25a, r.next()),
      nodes = 6;
    let prev = [bx, y - 0.05, bz];
    for (let k = 1; k <= nodes; k++) {
      const t = k / nodes,
        p = [bx + Math.cos(lean) * bend * t * t, y + h * t, bz + Math.sin(lean) * bend * t * t];
      m.tube(
        prev,
        p,
        0.034 * (1 - 0.6 * (t - 1 / nodes)),
        0.034 * (1 - 0.6 * t),
        k % 2 ? culm : m.mix(culm, 0x3f6238, 0.35),
        5
      );
      if (k >= 3)
        for (let l = 0; l < 3; l++) {
          const turn = r.range(0, circle),
            len = r.range(0.34, 0.52) * (1.15 - 0.3 * t);
          m.leaf(
            p,
            [p[0] + Math.cos(turn) * len, p[1] - len * 0.4, p[2] + Math.sin(turn) * len],
            len * 0.16,
            0x47763b,
            0x86ad60,
            len * 0.22
          );
        }
      prev = p;
    }
  }
}
// A cypress: a dark flame of close foliage on a short trunk.
function cypress(m, x, y, z, height) {
  const r = m.rng,
    girth = [0.3, 0.37, 0.33, 0.25, 0.15].map((g) => g * height * 0.36);
  m.tube([x, y - 0.1, z], [x, y + height * 0.2, z], 0.09, 0.07, 0x4a3a30, 6);
  for (let k = 0; k < girth.length; k++) {
    const base = y + height * (0.1 + 0.17 * k);
    m.rock(
      x + r.range(-0.04, 0.04),
      base,
      z + r.range(-0.04, 0.04),
      girth[k],
      height * 0.3,
      girth[k] * r.range(0.85, 1),
      0x223a2b,
      k % 2 ? 0x3d5f44 : 0x466a48,
      7,
      r.range(0, 3)
    );
  }
}
// A flat shelf of pine needles: dark underneath, lit on top, tufts round the rim.
function needlePad(m, x, y, z, size) {
  const r = m.rng;
  m.rock(x, y - 0.04 * size, z, size * 0.85, 0.2 * size, size * 0.62, 0x1c3024, 0x38543a, 7);
  m.rock(
    x + size * r.range(-0.35, 0.35),
    y + 0.04 * size,
    z + size * r.range(-0.25, 0.25),
    size * 0.5,
    0.2 * size,
    size * 0.42,
    0x233a2a,
    r.pick([0x44603c, 0x4c683c]),
    6
  );
  for (let k = 0; k < 6; k++) {
    const a = (k * circle) / 6 + r.range(-0.3, 0.3),
      px = x + Math.cos(a) * size * 0.8,
      pz = z + Math.sin(a) * size * 0.6;
    m.leaf(
      [px, y + 0.03 * size, pz],
      [px + Math.cos(a) * size * 0.45, y - 0.03 * size, pz + Math.sin(a) * size * 0.4],
      0.11 * size,
      0x2a4430,
      0x50703f,
      0.04 * size
    );
  }
}
// A pine rooted in a joint of the cliff: the trunk leaves the rock sideways (+x is
// out from the face), turns up and holds its pads over the drop.
function cliffPine(m, x, y, z, yaw, size) {
  const r = m.rng;
  m.frame(x, y, z, yaw, size, () => {
    const sway = r.range(-0.12, 0.12);
    const trunk = [
      [-0.4, -0.18, 0],
      [0.22, 0.0, 0.03],
      [0.58, 0.28, -0.04 + sway],
      [0.76, 0.7, 0.02 + sway],
      [1.0, 1.05, sway * 2]
    ];
    const girth = [0.105, 0.095, 0.078, 0.058, 0.036];
    for (let k = 1; k < trunk.length; k++)
      m.tube(trunk[k - 1], trunk[k], girth[k - 1], girth[k], k % 2 ? 0x5c4838 : 0x6b5644, 6);
    for (const [from, to, pad] of [
      [2, [1.2, 0.3, 0.34], 0.4],
      [3, [0.5, 0.86, -0.56], 0.36],
      [3, [1.32, 0.8, 0.36], 0.38]
    ]) {
      const end = [to[0] + r.range(-0.08, 0.08), to[1], to[2] + r.range(-0.08, 0.08)];
      m.tube(trunk[from], end, 0.04, 0.018, 0x5e4a3a, 5);
      needlePad(m, end[0], end[1] + 0.04, end[2], pad);
    }
    needlePad(m, trunk[4][0] + 0.04, trunk[4][1] + 0.06, trunk[4][2], 0.42);
  });
}

// A potted flower: a glazed pot, a mound of leaf and a few blooms.
function flowerPot(m, x, y, z, size, petal, glaze = 0x52606c) {
  const r = m.rng;
  m.lathe(
    x,
    y,
    z,
    [
      [0, 0.065 * size],
      [0.1 * size, 0.1 * size],
      [0.13 * size, 0.085 * size]
    ],
    glaze,
    6
  );
  m.rock(x, y + 0.1 * size, z, 0.12 * size, 0.14 * size, 0.12 * size, 0x3d6639, 0x5f8a4c, 5);
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4 + r.range(-0.4, 0.4),
      d = 0.075 * size;
    m.crystal(
      x + Math.cos(a) * d,
      y + size * r.range(0.16, 0.23),
      z + Math.sin(a) * d,
      0.04 * size,
      0.05 * size,
      petal,
      m.mix(petal, 0xffffff, 0.5),
      6
    );
  }
}

// A round window: lamplight behind a dark ring and a plain lattice, a rose-pink
// curtain drawn to one side. Drawn in the plane z = 0, looking toward +z.
function roundWindow(m, x, y, radius, wood, warm, pink) {
  const n = 14,
    point = (k, z, scale = 1) => {
      const a = (k * circle) / n;
      return [x + Math.cos(a) * radius * scale, y + Math.sin(a) * radius * scale, z];
    };
  m.glow(() => {
    for (let k = 0; k < n; k++) m.face([[x, y, 0.03], point(k, 0.03), point(k + 1, 0.03)], warm);
  });
  // The curtain hangs across the left third.
  const drape = [4, 5, 6, 7, 8, 9, 10];
  m.face(
    drape.map((k) => point(k, 0.04, 0.97)),
    drape.map((k) => m.rgb(k % 2 ? pink : 0xf0b3c2))
  );
  m.hoop(x, y, 0.05, radius, 0.034, wood, n, 'xy');
}
// A square lattice window with the same lamplight and curtain.
function latticeWindow(m, x, y, w, h, wood, warm, pink) {
  m.glow(() =>
    m.face(
      [
        [x - w / 2, y - h / 2, 0.03],
        [x + w / 2, y - h / 2, 0.03],
        [x + w / 2, y + h / 2, 0.03],
        [x - w / 2, y + h / 2, 0.03]
      ],
      warm
    )
  );
  m.face(
    [
      [x + w * 0.12, y - h / 2, 0.04],
      [x + w / 2, y - h / 2, 0.04],
      [x + w / 2, y + h / 2, 0.04],
      [x + w * 0.24, y + h / 2, 0.04]
    ],
    [m.rgb(pink), m.rgb(0xf0b3c2), m.rgb(pink), m.rgb(0xf0b3c2)]
  );
  for (let k = 0; k <= 4; k++)
    m.box(x - w / 2 + (k * w) / 4, y, 0.052, 0.026, h + 0.03, 0.03, wood);
  for (let k = 0; k <= 3; k++)
    m.box(x, y - h / 2 + (k * h) / 3, 0.052, w + 0.03, 0.026, 0.03, wood);
}

// 繡閣: a small, tall house of dark timber on a stone plinth, three bays wide: an
// open door hung with rose-pink curtains, lamplit windows, flowers on the steps and
// a grey-tiled roof whose corners turn up. It faces +z (south), and its eaves are
// kept short so the front shows from above.
function embroideryHouse(m) {
  const W = 3.0,
    D = 1.8,
    floor = 0.26,
    eave = 1.8;
  const wood = 0x2c2321,
    woodLit = 0x4a382f,
    plaster = 0xd9cfbb,
    stone = 0x8b8880,
    stoneLit = 0xaaa69b,
    pink = 0xdf8aa3,
    pinkLit = 0xf0b3c2,
    pinkDeep = 0xc0627f,
    warm = 0xffd28c;
  const half = W / 2,
    front = D / 2,
    plinthFront = front + 0.35;
  // Plinth, the steps down to the garden and their cheek blocks.
  m.box(0, floor / 2 - 0.25, 0, W + 0.56, floor + 0.5, D + 0.7, stone);
  m.box(0, floor - 0.02, 0, W + 0.64, 0.05, D + 0.78, stoneLit);
  for (let k = 0; k < 3; k++) {
    const top = floor - 0.085 * (k + 1);
    m.box(
      0,
      (top - 0.5) / 2,
      plinthFront + 0.13 + k * 0.21,
      1.15,
      top + 0.5,
      0.22,
      k % 2 ? stone : stoneLit
    );
  }
  for (const s of [-1, 1]) m.box(s * 0.7, -0.14, plinthFront + 0.33, 0.24, 0.72, 0.66, stone);

  // Walls: pale infill in a dark frame, a dark dado below, a band of lattice above.
  m.box(0, floor + 0.75, 0, W, 1.5, D, plaster);
  m.box(0, floor + 0.17, front + 0.008, W, 0.34, 0.03, wood);
  m.box(0, floor + 1.29, front + 0.008, W, 0.17, 0.03, woodLit);
  for (let k = 0; k < 13; k++)
    m.box(-half + 0.2 + k * 0.217, floor + 1.29, front + 0.027, 0.02, 0.17, 0.01, wood);
  for (const s of [-1, 1]) {
    m.box(s * (half + 0.004), floor + 0.17, 0, 0.03, 0.34, D, wood);
    m.box(s * half, floor + 1.44, 0, 0.1, 0.12, D + 0.12, wood);
    m.box(s * half, floor + 0.04, 0, 0.1, 0.08, D + 0.12, wood);
    m.box(0, floor + 1.44, s * front, W + 0.12, 0.12, 0.1, wood);
    m.box(0, floor + 0.04, s * front, W + 0.12, 0.08, 0.1, wood);
    for (const z of [-front, front])
      m.tube([s * half, floor, z], [s * half, eave - 0.03, z], 0.066, 0.06, wood, 7);
    m.tube(
      [s * 0.5, floor, front + 0.02],
      [s * 0.5, eave - 0.03, front + 0.02],
      0.055,
      0.05,
      wood,
      6
    );
  }

  // The open door: lamplight within, both leaves folded back, curtains tied
  // aside under a scalloped pelmet.
  const sill = floor + 0.02,
    lintel = floor + 1.05,
    z = front;
  m.glow(() =>
    m.face(
      [
        [-0.38, sill, z + 0.036],
        [0.38, sill, z + 0.036],
        [0.38, lintel, z + 0.036],
        [-0.38, lintel, z + 0.036]
      ],
      [m.rgb(0xe89a48), m.rgb(0xe89a48), m.rgb(0xffd58a), m.rgb(0xffd58a)]
    )
  );
  // A table and a vase glimpsed inside.
  m.box(0.06, sill + 0.22, z + 0.04, 0.3, 0.035, 0.012, 0x6a3f2c);
  for (const s of [-1, 1])
    m.box(0.06 + s * 0.12, sill + 0.11, z + 0.04, 0.03, 0.22, 0.012, 0x6a3f2c);
  m.box(0.08, sill + 0.3, z + 0.04, 0.06, 0.13, 0.012, 0x7fa0a8);
  for (const s of [-1, 1]) {
    m.box(s * 0.42, floor + 0.54, z + 0.05, 0.07, 1.08, 0.07, wood);
    m.box(s * 0.47, floor + 0.52, z + 0.2, 0.04, 1.0, 0.3, woodLit);
    m.box(s * 0.472, floor + 0.74, z + 0.2, 0.045, 0.4, 0.24, 0x8a6f52);
    const fold = [
      [s * 0.38, lintel],
      [s * 0.03, lintel],
      [s * 0.1, floor + 0.82],
      [s * 0.24, floor + 0.56],
      [s * 0.3, floor + 0.43],
      [s * 0.28, floor + 0.05],
      [s * 0.38, floor + 0.05]
    ].map(([x, y]) => [x, y, z + 0.05]);
    m.face(
      fold,
      [pink, pinkLit, pink, pinkDeep, pink, pinkLit, pinkDeep].map((c) => m.rgb(c))
    );
    m.box(s * 0.31, floor + 0.44, z + 0.058, 0.06, 0.035, 0.02, 0xd8b25e);
  }
  m.box(0, lintel + 0.04, z + 0.05, 0.92, 0.07, 0.07, wood);
  for (let k = 0; k < 5; k++) {
    const x = -0.38 + k * 0.152;
    m.face(
      [
        [x, lintel, z + 0.06],
        [x + 0.152, lintel, z + 0.06],
        [x + 0.076, lintel - 0.14, z + 0.06]
      ],
      k % 2 ? pinkDeep : pink
    );
  }
  // Its name board.
  m.box(0, floor + 1.27, z + 0.06, 0.5, 0.17, 0.03, 0x1b1818);
  for (const s of [-1, 1]) m.box(s * 0.1, floor + 1.27, z + 0.078, 0.09, 0.09, 0.008, 0xcaa75c);

  // Windows: a round one west of the door and in each end wall, a square one east.
  m.frame(0, 0, z, 0, 1, () => {
    roundWindow(m, -1.0, floor + 0.68, 0.3, wood, warm, pink);
    latticeWindow(m, 1.0, floor + 0.7, 0.6, 0.52, wood, warm, pink);
  });
  for (const s of [-1, 1])
    m.frame(s * half, 0, 0, (s * Math.PI) / 2, 1, () =>
      roundWindow(m, 0, floor + 0.68, 0.3, wood, warm, pink)
    );

  m.box(0, eave - 0.02, 0, W + 0.8, 0.07, D + 0.66, wood);
  roof(m, W + 1.1, D + 0.84, eave, 0.85, [0x3a4044, 0x596266, 0x7f898b]);

  // A lantern on a post to each side of the path.
  for (const s of [-1, 1]) {
    const x = s * 1.08,
      lz = plinthFront + 0.72;
    m.tube([x, -0.12, lz], [x, 0.98, lz], 0.03, 0.024, wood, 5);
    m.tube([x + s * 0.03, 0.94, lz], [x - s * 0.2, 0.94, lz], 0.016, 0.014, wood, 4);
    lantern(m, x - s * 0.17, 0.78, lz, 0.4, 0xe7899f);
  }
  // Flowers everywhere: on the cheek blocks, along the plinth, at the corners.
  const petals = [0xe58aa8, 0xf4ede4, 0xc9486e, 0xf2b7c6, 0xd9a03c];
  for (const s of [-1, 1]) {
    flowerPot(m, s * 0.7, 0.22, plinthFront + 0.2, 1.25, petals[s > 0 ? 0 : 2]);
    flowerPot(m, s * 0.7, 0.22, plinthFront + 0.5, 1.0, petals[s > 0 ? 1 : 3], 0x8a5f4a);
    flowerPot(m, s * 0.85, floor, front + 0.1, 1.0, petals[s > 0 ? 3 : 1]);
    flowerPot(m, s * 1.25, floor, front + 0.1, 0.9, petals[s > 0 ? 2 : 4], 0x8a5f4a);
    flowerPot(m, s * 2.0, -0.06, plinthFront + 0.3, 1.6, petals[s > 0 ? 4 : 0], 0x3f5560);
  }
  flowerPot(m, half + 0.18, floor, 0.45, 1.0, petals[0], 0x8a5f4a);
  flowerPot(m, half + 0.18, floor, -0.5, 0.9, petals[1]);
  houseDetail(m);
}

// Whitewashed garden wall with a ridge of dark tile, following the lip of the
// garden from the landing round the west and north to the back of the house.
function gardenWall(m, land) {
  const from = Math.round(degrees(158)),
    to = Math.round(degrees(-53));
  const white = 0xe1dccf,
    tones = [white, 0x4b5155, 0x3c4246, 0x464c50, 0x555b5e, 0xd2cdbf];
  let last = null;
  for (let i = from; i <= to; i++) {
    const a = (i * circle) / SPOKES,
      c = Math.cos(a),
      s = Math.sin(a),
      r = land.top[i] - 0.3,
      pier = i % 16 < 2 || i === from || i === to,
      // Low along the west, higher behind the plum trees.
      h = lerp(0.58, 0.92, smooth(degrees(185), degrees(215), i)) + (pier ? 0.08 : 0);
    const base = land.ground(c * r, s * r) - 0.08,
      thick = pier ? 0.085 : 0.055;
    const post = (dr, y) => [c * (r + dr), base + y, s * (r + dr)];
    const row = [
      post(-thick, 0),
      post(-thick, h),
      post(-thick - 0.05, h),
      post(0, h + 0.09),
      post(thick + 0.05, h),
      post(thick, h),
      post(thick, 0)
    ];
    // Whitewash stained grey-green with damp toward the foot.
    const damp = m.mix(white, 0x8a8e7e, 0.55 + 0.2 * Math.sin(i * 0.7));
    const shade = [[damp, m.rgb(white)], null, null, null, null, [m.rgb(white), damp]];
    if (last)
      for (let k = 0; k < 6; k++)
        m.face(
          [last[k], last[k + 1], row[k + 1], row[k]],
          shade[k] ? [shade[k][0], shade[k][1], shade[k][1], shade[k][0]] : tones[k]
        );
    if (!last || i === to) m.face(row, white);
    // A rib of rounded tiles across the coping at every spoke.
    m.line(
      [post(-thick - 0.05, h + 0.006), post(0, h + 0.1), post(thick + 0.05, h + 0.006)],
      0.009,
      0x5d6468,
      4
    );
    // Lattice windows (漏窗) let into the high wall behind the plums.
    if (h > 0.84 && !pier && i % 18 === 9)
      leakWindow(m, post, h, thick, Math.atan2(c, s), (i / 18) % 3);
    last = row;
  }
}
// One window of grey tile lattice in the garden wall, drawn on both faces: a round,
// a hexagonal or a fan-shaped frame round a pattern of linked coins.
function leakWindow(m, post, h, thick, yaw, shape) {
  const [x, , z] = post(0, 0),
    y = post(0, h * 0.52)[1],
    frame = 0x6c7275,
    fill = 0x3b4043,
    n = shape === 1 ? 6 : 12,
    rad = shape === 2 ? 0.2 : 0.17;
  m.frame(x, y, z, yaw, 1, () => {
    for (const side of [-1, 1]) {
      const zz = side * (thick + 0.006),
        rim = [];
      for (let k = 0; k < n; k++) {
        const a = (k * circle) / n + (shape === 1 ? Math.PI / 6 : 0);
        // The fan is a ring's upper part cut flat across its foot.
        const ry = shape === 2 ? Math.max(Math.sin(a), -0.7) * rad : Math.sin(a) * rad;
        rim.push([Math.cos(a) * rad * (shape === 2 ? 1.25 : 1), ry, zz]);
      }
      m.face(side > 0 ? rim : [...rim].reverse(), fill);
      m.line([...rim, rim[0]], 0.022, frame, 4);
      for (const [cx, cy] of [
        [-0.07, 0.0],
        [0.07, 0.0],
        [0.0, 0.07],
        [0.0, -0.07]
      ])
        m.hoop(cx, cy, zz + side * 0.004, 0.07, 0.008, 0xb9bdb8, 8, 'xy');
    }
  });
}

// The garden behind the court: plum trees, bamboo, cypress, a few garden rocks.
function gardenPlants(m, land) {
  const set = (x, z) => [x, land.ground(x, z), z];
  for (const [x, z, size, yaw] of [
    [-0.2, -7.75, 1.15, 0.4],
    [-2.5, -7.85, 1.25, 3.3],
    [-4.35, -6.75, 1.1, 5.0],
    [-6.0, -5.0, 1.1, 1.2],
    [-7.1, -2.4, 0.85, 4.1],
    [-7.1, 1.7, 0.85, 2.7]
  ])
    plumTree(m, ...set(x, z), size, yaw);
  bambooStand(m, ...set(-1.25, -9.0), 8, 0.55, 2.7);
  bambooStand(m, ...set(-3.9, -8.3), 6, 0.5, 2.4);
  bambooStand(m, ...set(-6.2, -6.0), 5, 0.45, 2.2);
  bambooStand(m, ...set(-6.9, 2.5), 4, 0.3, 1.7);
  cypress(m, ...set(1.1, -9.6), 3.6);
  cypress(m, ...set(0.3, -9.3), 2.9);
  cypress(m, ...set(-5.0, -6.6), 3.1);
  gardenLayer(m, land);
}

// Stone posts and an iron chain along the open edge of the court, south and east.
function chainRail(m, land) {
  const iron = 0x2c2e31;
  let last = null,
    peg = null;
  for (let n = Math.round(degrees(-36)) - SPOKES; n <= Math.round(degrees(127)); n++) {
    const i = (n + SPOKES) % SPOKES,
      a = (i * circle) / SPOKES,
      r = land.rim[i] + 0.15,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    if (last && Math.hypot(x - last[0], z - last[1]) < 1.2) continue;
    const foot = land.lip[i] - 0.05,
      next = [x, 0.14, z];
    m.box(x, (foot + 0.19) / 2, z, 0.085, 0.19 - foot, 0.085, 0x77746d);
    m.box(x, 0.2, z, 0.115, 0.035, 0.115, 0x8d8a82);
    if (peg) {
      const sag = midway(peg, next, 0.5);
      sag[1] -= 0.075;
      m.line([peg, sag, next], 0.013, iron, 4);
    }
    peg = next;
    last = [x, z];
  }
}

// A ring of wall between heights, open at both ends: profile is [height, radius].
function sleeve(m, profile, col, n = 10) {
  for (let k = 1; k < profile.length; k++) {
    const [h0, r0] = profile[k - 1],
      [h1, r1] = profile[k];
    for (let i = 0; i < n; i++) {
      const a = (i * circle) / n,
        b = ((i + 1) * circle) / n;
      m.face(
        [
          [Math.cos(a) * r0, h0, Math.sin(a) * r0],
          [Math.cos(a) * r1, h1, Math.sin(a) * r1],
          [Math.cos(b) * r1, h1, Math.sin(b) * r1],
          [Math.cos(b) * r0, h0, Math.sin(b) * r0]
        ],
        col
      );
    }
  }
}
// A great basket of woven cane, big enough for two, slung from four ropes.
function basket(m, x, y, z, size, ropes) {
  m.frame(x, y, z, 0, size, () => {
    sleeve(
      m,
      [
        [0, 0.002],
        [0, 0.27],
        [0.09, 0.36],
        [0.2, 0.4]
      ],
      0x7d6039
    );
    sleeve(
      m,
      [
        [0.2, 0.4],
        [0.4, 0.44],
        [0.5, 0.45]
      ],
      0xa88856
    );
    sleeve(
      m,
      [
        [0.5, 0.45],
        [0.58, 0.47],
        [0.58, 0.41]
      ],
      0x8a6c42
    );
    sleeve(
      m,
      [
        [0.58, 0.41],
        [0.2, 0.33],
        [0.2, 0.002]
      ],
      0x4a3826
    );
    if (ropes)
      for (let k = 0; k < 4; k++) {
        const a = (k * circle) / 4 + 0.6;
        m.tube(
          [Math.cos(a) * 0.44, 0.56, Math.sin(a) * 0.44],
          [0, 1.3, 0],
          0.014,
          0.014,
          0xbba679,
          4
        );
      }
  });
}
// The hoist at the head of the cliff path: an A-frame of timber with a jib over the
// drop, a windlass behind it and a basket coming up on the rope. +x is out over
// the edge.
function hoist(m) {
  const timber = 0x4c382c,
    pale = 0x6d5442,
    rope = 0xbba679,
    iron = 0x2c2e31;
  for (const z of [-0.45, 0.45]) {
    m.tube([-1.0, -0.1, z], [-0.3, 1.95, z * 0.75], 0.07, 0.058, timber, 6);
    m.tube([0.05, -0.1, z], [-0.3, 1.95, z * 0.75], 0.07, 0.058, timber, 6);
    m.tube([-0.72, 0.75, z * 0.9], [-0.1, 0.75, z * 0.9], 0.04, 0.04, pale, 5);
  }
  m.tube([-0.3, 1.95, -0.48], [-0.3, 1.95, 0.48], 0.065, 0.065, timber, 6);
  m.tube([-0.5, 0.9, -0.42], [-0.3, 1.9, 0.33], 0.035, 0.035, pale, 5);
  // The jib rests on the ridge beam and is chained down at its heel.
  const heel = [-1.25, 1.52, 0],
    head = [1.12, 2.3, 0];
  m.tube(heel, head, 0.075, 0.06, timber, 6);
  m.line([heel, [-1.3, 0.7, 0], [-1.38, -0.05, 0]], 0.02, iron, 4);
  m.tube([1.1, 2.18, -0.06], [1.1, 2.18, 0.06], 0.13, 0.13, iron, 9);
  m.tube([1.1, 2.18, -0.09], [1.1, 2.18, 0.09], 0.03, 0.03, pale, 5);
  // The rope: down to the basket, and back over the frame to the windlass.
  m.tube([1.23, 2.16, 0], [1.23, 0.56, 0], 0.017, 0.017, rope, 4);
  m.tube([0.98, 2.24, 0], [-0.78, 0.6, 0], 0.017, 0.017, rope, 4);
  basket(m, 1.23, -0.74, 0, 1, true);
  for (const z of [-0.42, 0.42]) {
    m.tube([-1.02, -0.1, z], [-0.62, 0.68, z], 0.04, 0.035, timber, 5);
    m.tube([-0.54, -0.1, z], [-0.94, 0.68, z], 0.04, 0.035, timber, 5);
    for (let k = 0; k < 4; k++) {
      const a = (k * circle) / 4 + 0.5,
        zz = z * 1.25;
      m.tube(
        [-0.78, 0.52, zz],
        [-0.78 + Math.cos(a) * 0.3, 0.52 + Math.sin(a) * 0.3, zz],
        0.022,
        0.018,
        pale,
        4
      );
    }
  }
  m.tube([-0.78, 0.52, -0.56], [-0.78, 0.52, 0.56], 0.045, 0.045, timber, 6);
  m.tube([-0.78, 0.52, -0.33], [-0.78, 0.52, 0.33], 0.12, 0.12, pale, 8);
  m.tube([-0.78, 0.52, -0.14], [-0.78, 0.52, 0.14], 0.145, 0.145, rope, 8);
}

// The head of the cliff path: steps hewn across the rock face below the south-west
// corner, an iron chain on stakes along their open side, the hoist on the landing.
function cliffPath(m, land, sections) {
  const iron = 0x2c2e31;
  const start = degrees(138.5),
    count = 19;
  const reach = [];
  for (let k = 0; k < count; k++) {
    const f = start - k * 1.2,
      y = land.read(land.lip, start) - 0.08 - 0.14 * k;
    let r = 0;
    for (let d = -2; d <= 2; d++) r = Math.max(r, faceRadius(sections, f + d + SPOKES, y - 0.1));
    reach.push([f, y, r]);
  }
  let peg = null;
  for (let k = 0; k < count; k++) {
    const [f, y] = reach[k];
    let r = 0,
      n = 0;
    for (let d = -2; d <= 2; d++)
      if (reach[k + d]) {
        r += reach[k + d][2];
        n++;
      }
    r = r / n + 0.2;
    const a = (f * circle) / SPOKES;
    m.frame(Math.cos(a) * r, y, Math.sin(a) * r, -a, 1, () => {
      m.box(-0.1, -0.13, 0, 0.98, 0.26, 0.34, k % 2 ? 0x4f5154 : 0x5d5f61);
      m.box(0.02, 0.006, 0, 0.7, 0.012, 0.3, 0x76787a);
    });
    if (k % 3 === 0) {
      const out = r + 0.33,
        top = [Math.cos(a) * out, y + 0.5, Math.sin(a) * out];
      m.tube([top[0], y - 0.05, top[2]], top, 0.022, 0.018, iron, 5);
      if (peg) {
        const sag = midway(peg, top, 0.5);
        sag[1] -= 0.09;
        m.line([peg, sag, top], 0.014, iron, 4);
      }
      peg = top;
    }
  }
  // The last steps come up out of a notch between two leaning slabs.
  const [f, y, r] = reach[count - 1],
    a = ((f - 2.6) * circle) / SPOKES;
  m.rock(
    Math.cos(a) * (r + 0.2),
    y - 1.7,
    Math.sin(a) * (r + 0.2),
    0.75,
    2.1,
    0.6,
    0x24262b,
    0x4a4d50,
    7,
    1
  );

  const at = degrees(147.5),
    angle = (at * circle) / SPOKES,
    edge = land.read(land.top, at) - 0.12;
  m.frame(
    Math.cos(angle) * edge,
    land.read(land.lip, at),
    Math.sin(angle) * edge,
    -angle,
    1,
    () => {
      hoist(m);
      // A spare basket and a coil of rope by the windlass.
      basket(m, -0.75, 0.0, 1.05, 0.72, false);
      m.hoop(-1.25, 0.03, 0.75, 0.17, 0.026, 0xbba679, 9);
      m.hoop(-1.25, 0.075, 0.75, 0.14, 0.026, 0xa9946a, 9);
    }
  );
}

// A mandarin duck, afloat. The drake has his orange sails, green and russet crest and
// white brow; the hen is grey-brown with a white ring round the eye. +x is ahead.
function duck(m, x, z, yaw, size, drake) {
  m.frame(x, pondLevel, z, yaw, size, () => {
    if (drake) {
      m.rock(0, -0.012, 0, 0.088, 0.066, 0.052, 0xc98a4a, 0x6b4a34, 7);
      m.rock(0.055, -0.01, 0, 0.042, 0.062, 0.038, 0x5b2b52, 0x7a3b62, 6);
      m.box(0.068, 0.066, 0, 0.05, 0.036, 0.058, 0xdc8431);
      m.box(0.086, 0.092, 0, 0.05, 0.04, 0.042, 0xf3efe6);
      m.box(0.082, 0.118, 0, 0.056, 0.02, 0.036, 0x2f6b52);
      m.leaf([0.07, 0.122, 0], [-0.03, 0.1, 0], 0.02, 0x8a3a2a, 0x2f6b52, 0.012);
      m.box(0.122, 0.086, 0, 0.03, 0.013, 0.018, 0xd9372c);
      for (const s of [-1, 1]) {
        m.face(
          [
            [-0.005, 0.045, s * 0.022],
            [-0.07, 0.05, s * 0.034],
            [-0.04, 0.125, s * 0.012]
          ],
          0xec952f
        );
        m.box(0.092, 0.097, s * 0.022, 0.012, 0.012, 0.004, 0x1c1c1c);
      }
      m.leaf([-0.06, 0.04, 0], [-0.13, 0.05, 0], 0.022, 0x4a3628, 0x6b4f38, 0.008);
    } else {
      m.rock(0, -0.012, 0, 0.08, 0.058, 0.047, 0x847a6b, 0x5f574d, 7);
      m.rock(0.05, -0.01, 0, 0.038, 0.055, 0.034, 0x9a9080, 0xb2a996, 6);
      m.box(0.078, 0.078, 0, 0.046, 0.042, 0.038, 0x6f6a66);
      m.box(0.112, 0.074, 0, 0.028, 0.012, 0.016, 0x4a4a4c);
      for (const s of [-1, 1]) m.box(0.086, 0.086, s * 0.02, 0.022, 0.01, 0.004, 0xf3efe6);
      m.leaf([-0.055, 0.035, 0], [-0.125, 0.045, 0], 0.02, 0x5f574d, 0x7b7163, 0.008);
    }
    // The ripple pushed ahead.
    m.line(
      [
        [0.02, 0.006, 0.075],
        [0.13, 0.006, 0],
        [0.02, 0.006, -0.075]
      ],
      0.004,
      0xcfe3da,
      3
    );
  });
}
// 鴛鴦池: clear water in the hole in the paving, deeper green in the middle, with
// pale stones at its corners, lily pads, a few lotus flowers and pairs of ducks.
function pond(m) {
  const r = m.rng,
    half = 1.07,
    n = 8;
  const at = (i, j) => {
    const x = -half + (2 * half * i) / n,
      z = -half + (2 * half * j) / n,
      shore = 1 - Math.max(Math.abs(x), Math.abs(z)) / half;
    const depth = smooth(0, 0.75, shore + 0.12 * Math.sin(x * 4.1 + z * 2.3));
    return [[x, pondLevel, z], m.mix(0x9cc4ae, 0x3c7873, depth)];
  };
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const q = [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)];
      m.face(
        q.map(([p]) => p),
        q.map(([, c]) => c)
      );
    }
  // Stones of the pond's edge, all inside the hole.
  for (const [x, z, size, h] of [
    [-0.74, -0.76, 0.19, 0.3],
    [-0.45, -0.84, 0.12, 0.17],
    [0.76, -0.74, 0.16, 0.26],
    [0.84, -0.42, 0.1, 0.14],
    [-0.84, 0.5, 0.11, 0.13],
    [0.76, 0.78, 0.14, 0.16],
    [0.48, 0.85, 0.09, 0.1]
  ])
    m.rock(
      x,
      pondLevel - 0.06,
      z,
      size,
      h + 0.06,
      size * 0.8,
      0x8a8c85,
      0xcbc9be,
      7,
      r.range(0, 3)
    );
  // Lily pads, each a disc with a notch; here and there a lotus bud standing clear.
  const pads = [
    [-0.55, 0.62],
    [-0.32, 0.72],
    [-0.68, 0.36],
    [0.55, 0.45],
    [0.7, 0.2],
    [0.38, 0.66],
    [-0.1, -0.7],
    [0.15, -0.62],
    [0.6, -0.55],
    [-0.72, -0.3],
    [0.02, 0.05],
    [-0.2, 0.42]
  ];
  for (const [k, [x, z]] of pads.entries()) {
    const rad = r.range(0.07, 0.115),
      a = r.range(0, circle),
      rim = [];
    for (let i = 0; i <= 8; i++) {
      const t = a + 0.3 + (i / 8) * (circle - 0.6);
      rim.push([x + Math.cos(t) * rad, pondLevel + 0.007, z + Math.sin(t) * rad]);
    }
    for (let i = 0; i < 8; i++)
      m.face(
        [[x, pondLevel + 0.009, z], rim[i + 1], rim[i]],
        [m.rgb(0x93ad6c), m.rgb(0x5f8450), m.rgb(0x5f8450)]
      );
    if (k % 4 === 0) {
      m.tube([x + 0.03, pondLevel, z], [x + 0.04, pondLevel + 0.1, z], 0.006, 0.005, 0x5f8450, 4);
      for (let i = 0; i < 5; i++) {
        const t = (i * circle) / 5;
        m.leaf(
          [x + 0.04, pondLevel + 0.1, z],
          [x + 0.04 + Math.cos(t) * 0.05, pondLevel + 0.14, z + Math.sin(t) * 0.05],
          0.02,
          0xe58aa8,
          0xf8d3dc,
          0.02
        );
      }
    }
  }
  // Pebbles seen through the clear water near the shore.
  for (let k = 0; k < 60; k++) {
    const side = k % 4,
      t = r.range(-0.95, 0.95),
      d = r.range(0.84, 1.03),
      x = side < 2 ? t : side === 2 ? d : -d,
      z = side < 2 ? (side ? d : -d) : t,
      rad = r.range(0.014, 0.03),
      col = m.mix(r.pick([0xd8d2c4, 0x8f8a80, 0xb9a58a]), 0x9cc4ae, 0.45),
      ring = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * circle) / 6 + k;
      ring.push([x + Math.cos(a) * rad, pondLevel + 0.002, z + Math.sin(a) * rad * 0.75]);
    }
    m.face(ring.reverse(), col);
  }
  // Carp turning just under the surface: red, gold and white.
  for (const [x, z, yaw, col, spot] of [
    [0.25, 0.45, 0.6, 0xe0602c, 0xf3efe6],
    [0.38, 0.52, 2.2, 0xf1ece0, 0xd9372c],
    [-0.62, 0.05, -1.4, 0xe8a03a, 0xe8a03a],
    [0.62, -0.05, 3.6, 0xd9372c, 0xf3efe6],
    [-0.1, -0.35, 1.0, 0xf1ece0, 0xe0602c]
  ])
    m.frame(x, pondLevel + 0.004, z, yaw, 1, () => {
      m.face(
        [
          [0.07, 0, 0],
          [0.03, 0, 0.022],
          [-0.03, 0, 0.016],
          [-0.06, 0, 0],
          [-0.03, 0, -0.016],
          [0.03, 0, -0.022]
        ].reverse(),
        col
      );
      m.face(
        [
          [0.05, 0.001, 0],
          [0.015, 0.001, 0.012],
          [-0.01, 0.001, 0]
        ].reverse(),
        spot
      );
      m.face(
        [
          [-0.055, 0, 0],
          [-0.1, 0, 0.03],
          [-0.085, 0, 0],
          [-0.1, 0, -0.03]
        ].reverse(),
        m.mix(col, 0xffffff, 0.3)
      );
    });
  // Open lotus flowers on their stalks, petals in two rings about a golden pod.
  for (const [x, z, h] of [
    [-0.45, 0.66, 0.11],
    [0.62, 0.32, 0.09],
    [0.28, -0.7, 0.12],
    [-0.75, -0.15, 0.08]
  ]) {
    m.tube([x, pondLevel, z], [x, pondLevel + h, z], 0.006, 0.005, 0x5f8450, 4);
    const top = [x, pondLevel + h, z];
    for (let ring = 0; ring < 2; ring++)
      for (let i = 0; i < 8; i++) {
        const a = (i * circle) / 8 + ring * 0.4,
          l = ring ? 0.045 : 0.065;
        m.leaf(
          top,
          [x + Math.cos(a) * l, top[1] + (ring ? 0.05 : 0.025), z + Math.sin(a) * l],
          l * 0.42,
          ring ? 0xf3c4cf : 0xe58aa8,
          0xfbe4ea,
          0.015
        );
      }
    m.lathe(
      x,
      top[1],
      z,
      [
        [0, 0.012],
        [0.02, 0.018],
        [0.022, 0.001]
      ],
      0xd8b84e,
      6
    );
  }
  // Big lotus leaves held up above the water, cupped.
  for (const [x, z, rad] of [
    [-0.6, 0.48, 0.12],
    [0.5, 0.6, 0.1],
    [0.45, -0.75, 0.11],
    [-0.8, -0.35, 0.1],
    [0.78, 0.1, 0.09]
  ]) {
    const y = pondLevel + 0.06,
      rim = [];
    m.tube([x, pondLevel, z], [x, y, z], 0.005, 0.005, 0x5f8450, 4);
    for (let i = 0; i <= 12; i++) {
      const a = (i * circle) / 12;
      rim.push([x + Math.cos(a) * rad, y + 0.025 + 0.008 * Math.sin(a * 3), z + Math.sin(a) * rad]);
    }
    for (let i = 0; i < 12; i++)
      m.face([[x, y, z], rim[i + 1], rim[i]], [m.rgb(0x8fae62), m.rgb(0x4f7a42), m.rgb(0x4f7a42)]);
  }
  // Irises in the two north corners, below the paving's edge.
  for (const [x, z] of [
    [-0.86, -0.86],
    [0.88, -0.6],
    [-0.88, 0.75]
  ])
    for (let i = 0; i < 9; i++) {
      const a = (i * circle) / 9 + r.range(-0.2, 0.2),
        l = r.range(0.1, 0.17),
        base = [x + Math.cos(a) * 0.03, pondLevel, z + Math.sin(a) * 0.03];
      m.leaf(
        base,
        [base[0] + Math.cos(a) * 0.05, pondLevel + l, base[2] + Math.sin(a) * 0.05],
        0.01,
        0x3f6a3c,
        0x6b9450,
        0.01
      );
      if (i % 3 === 0)
        m.crystal(
          base[0] + Math.cos(a) * 0.04,
          pondLevel + l * 0.9,
          base[2] + Math.sin(a) * 0.04,
          0.02,
          0.03,
          0x6a4fa8,
          0xc4b2e8,
          5
        );
    }
  // Three pairs, each drake close by his hen.
  for (const [x, z, yaw] of [
    [-0.28, 0.12, 0.35],
    [0.42, -0.25, 2.5],
    [-0.42, -0.52, -1.1]
  ]) {
    duck(m, x, z, yaw, 1.6, true);
    duck(
      m,
      x - Math.sin(yaw) * 0.2 - Math.cos(yaw) * 0.07,
      z - Math.cos(yaw) * 0.2 + Math.sin(yaw) * 0.07,
      yaw + 0.25,
      1.45,
      false
    );
  }
}

// A bank of cloud: soft, uneven domes run together, grey below and pale on top.
function cloudBank(m, x, y, z, length, depth, yaw, puffs) {
  const r = m.rng,
    n = 8;
  const rings = [
    [0, 1],
    [0.45, 0.9],
    [0.85, 0.52],
    [1, 0]
  ];
  m.frame(x, y, z, yaw, 1, () => {
    for (let k = 0; k < puffs; k++) {
      const t = puffs > 1 ? k / (puffs - 1) - 0.5 : 0,
        px = t * length + r.range(-0.3, 0.3),
        pz = r.range(-0.4, 0.4) * depth,
        rad = depth * r.range(0.75, 1.15) * (1 - Math.abs(t) * 0.5),
        h = rad * r.range(0.3, 0.5),
        edge = Array.from({ length: n }, () => r.range(0.72, 1.15));
      let prev = null,
        below = null;
      for (const [k2, s] of rings) {
        const ring = edge.map((e, i) => {
          const a = (i * circle) / n + k;
          return [px + Math.cos(a) * rad * s * e * 1.5, k2 * h, pz + Math.sin(a) * rad * s * e];
        });
        const tone = m.mix(0x98a4ab, 0xbec8cd, smooth(0, 0.85, k2));
        if (prev)
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            m.face([prev[i], ring[i], ring[j], prev[j]], [below, tone, tone, below]);
          }
        prev = ring;
        below = tone;
      }
    }
  });
}
// Far off: black peaks in two rings, each hazier than the last, standing in twos
// and threes, with cloud lying against their feet and against the foot of 黑木崖.
function farPeaks(m, land) {
  const r = m.rng,
    horizon = 0xcfd3d6;
  for (const [radius, count, haze, size, tall] of [
    [23, 9, 0.1, 2.0, 10.5],
    [33, 12, 0.4, 3.1, 16]
  ])
    for (let j = 0; j < count; j++) {
      const a = (j * circle) / count + r.range(-0.2, 0.2) + radius * 0.07,
        d = radius + r.range(-2, 3),
        x = Math.cos(a) * d,
        z = Math.sin(a) * d,
        w = size * r.range(0.75, 1.25),
        h = tall * r.range(0.6, 1.1);
      peak(m, x, z, -7.6, w, w * r.range(0.75, 1), h, haze, horizon);
      for (let k = 0; k < (haze < 0.3 ? 2 : 1); k++) {
        const turn = r.range(0, circle),
          off = w * r.range(0.9, 1.4);
        peak(
          m,
          x + Math.cos(turn) * off,
          z + Math.sin(turn) * off,
          -7.6,
          w * r.range(0.4, 0.6),
          w * r.range(0.35, 0.55),
          h * r.range(0.4, 0.75),
          haze,
          horizon,
          10
        );
      }
      if (j % 3 === 0) cloudBank(m, x, -6.7, z, w * 3.4, w * 1.1, -a + Math.PI / 2, 5);
    }
  for (let j = 0; j < 8; j++) {
    const i = Math.round((j * SPOKES) / 8 + r.range(-6, 6) + SPOKES) % SPOKES,
      a = (i * circle) / SPOKES,
      d = land.top[i] + r.range(2.8, 4.2);
    cloudBank(
      m,
      Math.cos(a) * d,
      -6.8,
      Math.sin(a) * d,
      r.range(5, 7),
      r.range(1.3, 1.9),
      -a + Math.PI / 2,
      5
    );
  }
}

// 紅梅翠竹: a gnarled little plum thick with red blossom to one side of the tile's
// back edge, two or three green bamboo culms to the other.
function plumAndBamboo(m, p, cell) {
  const r = m.rng,
    side = (cell.x + cell.y) % 2 ? 1 : -1,
    bark = 0x2a2220;
  const bx = side * r.range(0.14, 0.22),
    bz = r.range(-0.36, -0.3);
  const trunk = [
    [bx, 0.035, bz],
    [bx + side * 0.07, 0.24, bz - 0.02],
    [bx - side * 0.06, 0.43, bz + 0.03],
    [bx + side * 0.04, 0.6, bz - 0.03]
  ];
  for (let k = 1; k < trunk.length; k++)
    m.tube(trunk[k - 1], trunk[k], 0.05 - k * 0.009, 0.041 - k * 0.009, bark, 5);
  for (let k = 0; k < 5; k++) {
    const from = trunk[1 + (k % 3)],
      a = (k % 2 ? 0 : Math.PI) + r.range(-0.7, 0.7),
      len = r.range(0.24, 0.38);
    const elbow = [
      clamp(from[0] + Math.cos(a) * len * 0.5, -0.46, 0.46),
      from[1] + len * 0.3,
      Math.min(-0.17, from[2] + Math.sin(a) * len * 0.3)
    ];
    const tip = [
      clamp(elbow[0] + Math.cos(a + 0.5) * len * 0.6, -0.48, 0.48),
      elbow[1] + len * r.range(0.2, 0.6),
      Math.min(-0.15, elbow[2] + Math.sin(a + 0.5) * len * 0.4)
    ];
    m.tube(from, elbow, 0.02, 0.014, bark, 4);
    m.tube(elbow, tip, 0.014, 0.006, 0x41332d, 3);
    for (let q = 0; q < 5; q++) {
      const at = midway(q < 2 ? from : elbow, q < 2 ? elbow : tip, [0.5, 0.95, 0.35, 0.7, 1][q]);
      bloom(
        m,
        [at[0] + r.range(-0.03, 0.03), at[1] + 0.02, at[2] + r.range(-0.03, 0.02)],
        r.range(0.055, 0.075),
        q % 2 === 1
      );
    }
  }
  bloom(m, [trunk[3][0], trunk[3][1] + 0.04, trunk[3][2]], 0.07);
  for (let k = 0; k < 3; k++)
    bloom(m, [bx + r.range(-0.22, 0.22), 0.05, bz + r.range(0, 0.16)], 0.025, false);
  // The bamboo, taller than the plum and arching a little away from it.
  const culms = 2 + ((cell.x * 3 + cell.y) % 2);
  for (let j = 0; j < culms; j++) {
    const x = -side * r.range(0.12, 0.4),
      z = r.range(-0.43, -0.27),
      h = r.range(0.78, 1.05),
      bend = r.range(0.04, 0.12),
      culm = m.mix(0x5a8a48, 0x82a85e, r.next());
    let prev = [x, 0.035, z];
    for (let k = 1; k <= 4; k++) {
      const t = k / 4,
        at = [x - side * bend * t * t, 0.04 + h * t, z - 0.04 * t * t];
      m.tube(
        prev,
        at,
        0.026 - 0.004 * k,
        0.023 - 0.004 * k,
        k % 2 ? culm : m.mix(culm, 0x3f6238, 0.4),
        4
      );
      if (k >= 2)
        for (let l = 0; l < 3; l++) {
          const turn = r.range(0, circle),
            len = r.range(0.17, 0.27);
          m.leaf(
            at,
            [
              at[0] + Math.cos(turn) * len,
              at[1] - len * 0.3,
              Math.min(-0.1, at[2] + Math.sin(turn) * len * 0.7)
            ],
            len * 0.19,
            0x47763b,
            0x86ad60,
            len * 0.2
          );
        }
      prev = at;
    }
  }
}
// 玲瓏湖石: a pale Taihu stone stood on end at the back of the tile, worn through.
function piercedRock(m, p, cell) {
  const side = (cell.x * 5 + cell.y * 3) % 2 ? 1 : -1;
  taihuStone(m, side * 0.08, 0.035, -0.25, 0.6, side * m.rng.range(0.1, 0.5), 5);
}
// 假山: a rockery piled to a peak, moss in its hollows and a little pine growing
// from its shoulder.
function rockery(m, p, cell) {
  const r = m.rng,
    side = (cell.x + cell.y * 3) % 2 ? 1 : -1,
    grey = 0x6b6d69,
    lit = 0xa7a89c,
    moss = 0x74855a;
  m.rock(0, 0.03, -0.02, 0.42, 0.42, 0.36, grey, lit, 9, r.range(0, 3));
  m.rock(-side * 0.1, 0.3, -0.06, 0.29, 0.42, 0.25, grey, moss, 8, r.range(0, 3));
  m.rock(-side * 0.04, 0.62, -0.09, 0.16, 0.42, 0.14, 0x777974, lit, 7, r.range(0, 3));
  m.rock(side * 0.27, 0.03, 0.17, 0.17, 0.3, 0.15, grey, moss, 7, r.range(0, 3));
  m.rock(-side * 0.3, 0.03, 0.2, 0.14, 0.2, 0.12, 0x777974, lit, 6, r.range(0, 3));
  // The pine leans out over the low side.
  const root = [side * 0.16, 0.42, 0.02],
    bend = [side * 0.27, 0.62, 0.08],
    crown = [side * 0.36, 0.8, 0.06];
  m.tube(root, bend, 0.03, 0.022, 0x5c4838, 5);
  m.tube(bend, crown, 0.022, 0.012, 0x6b5644, 5);
  m.rock(crown[0], crown[1] - 0.02, crown[2], 0.15, 0.06, 0.11, 0x22382a, 0x4a6740, 7);
  m.rock(
    bend[0] + side * 0.1,
    bend[1] - 0.03,
    bend[2] + 0.1,
    0.1,
    0.045,
    0.08,
    0x22382a,
    0x567140,
    6
  );
  for (let k = 0; k < 5; k++) {
    const a = r.range(0, circle),
      x = Math.cos(a) * 0.36,
      z = Math.sin(a) * 0.3;
    m.leaf(
      [x, 0.06, z],
      [x + Math.cos(a) * 0.09, 0.14, z + Math.sin(a) * 0.09],
      0.02,
      0x5f7d4a,
      0x8aa364,
      0.03
    );
  }
}
// 芍藥圃: a bed of turned earth round the back and sides of the tile, planted with
// peonies in pink, white and deep rose; the middle stays paving.
function peonyBed(m, p, cell) {
  const r = m.rng,
    earth = 0x6a5847,
    kerb = m.mix(p[2], p[0], 0.4);
  for (const [x, z, w, d] of [
    [0, -0.33, 0.92, 0.27],
    [-0.36, 0.06, 0.2, 0.52],
    [0.36, 0.06, 0.2, 0.52]
  ]) {
    m.box(x, 0.05, z, w + 0.03, 0.03, d + 0.03, kerb);
    m.box(x, 0.054, z, w - 0.03, 0.032, d - 0.03, earth);
  }
  const petals = [
    [0xe58aa8, 0xf8cdd8],
    [0xf1e9df, 0xfffaf2],
    [0xc9486e, 0xea8aa6],
    [0xf2b7c6, 0xfde3e8]
  ];
  const plants = [
    [-0.36, -0.35, 1],
    [-0.12, -0.38, 1.15],
    [0.13, -0.34, 1.1],
    [0.37, -0.37, 1],
    [-0.37, -0.1, 0.85],
    [0.37, -0.08, 0.85],
    [-0.37, 0.16, 0.75],
    [0.37, 0.18, 0.75]
  ];
  for (const [k, [x, z, size]] of plants.entries()) {
    const [petal, light] = petals[(k + cell.x) % petals.length],
      h = 0.11 + 0.12 * size * (z < -0.2 ? 1 : 0.55);
    for (let l = 0; l < 5; l++) {
      const a = (l * circle) / 5 + r.range(-0.3, 0.3),
        len = 0.11 * size;
      m.leaf(
        [x, 0.07, z],
        [x + Math.cos(a) * len, h * 0.75, z + Math.sin(a) * len],
        len * 0.3,
        0x3f6a3c,
        0x6b9450,
        0.04
      );
    }
    m.tube([x, 0.07, z], [x, h, z], 0.007, 0.006, 0x3f6a3c, 3);
    m.crystal(x, h - 0.01, z, 0.066 * size, 0.085 * size, petal, light, 6);
    m.crystal(x + 0.07 * size, h * 0.7, z + 0.03, 0.04 * size, 0.055 * size, petal, light, 5);
  }
}
// 繡架屏風: an embroidery frame on its stand, a cloth stretched in it with a peony half
// worked in silk, a stool and a basket of thread beside it; behind, a small folding
// screen of three leaves.
function embroideryFrame(m) {
  const wood = 0x33261f,
    woodLit = 0x5a4334,
    silk = 0xe9e0cd;
  // The screen: three leaves set zigzag, a plum branch painted across them.
  for (let k = -1; k <= 1; k++)
    m.frame(k * 0.29, 0.04, -0.33 + (k === 0 ? 0.03 : -0.02), k * -0.42, 1, () => {
      m.box(0, 0.44, 0, 0.3, 0.86, 0.022, wood);
      m.box(0, 0.5, 0.013, 0.24, 0.62, 0.006, silk);
      m.box(0, 0.1, 0.013, 0.24, 0.1, 0.006, woodLit);
      m.box(0.02 - k * 0.03, 0.44 + k * 0.07, 0.019, 0.2, 0.014, 0.004, 0x4a3a30);
      m.box(0.05, 0.56 + k * 0.05, 0.019, 0.012, 0.16, 0.004, 0x4a3a30);
      for (const [x, y] of [
        [-0.05, 0.5],
        [0.07, 0.62],
        [0.02, 0.4],
        [-0.07, 0.68]
      ])
        m.box(x + k * 0.01, y + k * 0.06, 0.02, 0.03, 0.03, 0.004, 0xc93349);
    });
  // The frame, turned a little toward the south-east.
  m.frame(-0.02, 0.04, 0.1, 0.3, 1, () => {
    for (const s of [-1, 1]) {
      m.box(s * 0.31, 0.02, 0, 0.05, 0.04, 0.34, wood);
      m.box(s * 0.31, 0.28, -0.02, 0.04, 0.52, 0.045, wood);
    }
    m.box(0, 0.12, -0.02, 0.62, 0.035, 0.035, woodLit);
    // The stretcher leans back on its pivots.
    m.frame(
      0,
      0.47,
      -0.02,
      0,
      1,
      () => {
        for (const s of [-1, 1]) {
          m.box(0, s * 0.19, 0, 0.6, 0.04, 0.035, woodLit);
          m.box(s * 0.28, 0, 0, 0.04, 0.42, 0.035, woodLit);
        }
        m.box(0, 0, 0.004, 0.52, 0.34, 0.008, 0xf6ece6);
        // The peony: finished petals, a leaf, the outline of what is still to do.
        for (const [x, y, w, h, tone] of [
          [-0.04, 0.02, 0.1, 0.09, 0xd9456a],
          [-0.09, 0.06, 0.07, 0.06, 0xe8748f],
          [0.02, 0.07, 0.07, 0.06, 0xf09bb0],
          [-0.03, -0.04, 0.08, 0.05, 0xc0345a],
          [-0.15, -0.04, 0.08, 0.035, 0x5f8a4c],
          [0.1, -0.07, 0.07, 0.03, 0x6f9a58]
        ])
          m.box(x, y, 0.01, w, h, 0.006, tone);
        m.line(
          [
            [0.07, 0.0, 0.012],
            [0.14, 0.06, 0.012],
            [0.2, 0.02, 0.012],
            [0.15, -0.03, 0.012],
            [0.07, 0.0, 0.012]
          ],
          0.004,
          0xb9a9a2,
          3
        );
        // The needle, left in the cloth on its red thread.
        m.line(
          [
            [0.06, 0.03, 0.014],
            [0.1, -0.12, 0.03],
            [0.2, -0.3, 0.1]
          ],
          0.004,
          0xc93349,
          3
        );
      },
      -0.42
    );
  });
  // The embroiderer's stool and a basket of coloured silks.
  m.lathe(
    0.27,
    0.04,
    0.33,
    [
      [0, 0.075],
      [0.07, 0.095],
      [0.15, 0.08],
      [0.17, 0.09]
    ],
    0x7a4a3c,
    8
  );
  m.lathe(
    -0.33,
    0.04,
    0.34,
    [
      [0, 0.06],
      [0.06, 0.085],
      [0.07, 0.07],
      [0.04, 0.002]
    ],
    0xa88856,
    8
  );
  for (const [x, z, tone] of [
    [-0.36, 0.33, 0xd9456a],
    [-0.31, 0.37, 0xf0b3c2],
    [-0.31, 0.31, 0x5f8a4c],
    [-0.35, 0.37, 0xd9a03c]
  ])
    m.box(x, 0.105, z, 0.035, 0.03, 0.035, tone);
}

const tiles14 = {
  ground,
  plain: fallenPetals,
  cover: piercedRock,
  bamboo: plumAndBamboo,
  herbs: peonyBed,
  rock: rockery,
  crate: embroideryFrame
};

function landform14(T, layout) {
  const land = summit(layout),
    sections = Array.from({ length: SPOKES }, (_, i) => cliffSection(land, i));
  const group = new T.Group();
  group.name = '黑木繡閣';

  const rock = new Model(T, 140101);
  const crowns = crag(rock, land, sections);
  steppingStones(rock, land);

  const water = new Model(T, 140203);
  pond(water);

  const home = new Model(T, 140309);
  home.frame(house.x, 0, house.z, 0, 1, () => embroideryHouse(home));

  const plants = new Model(T, 140411);
  gardenWall(plants, land);
  gardenPlants(plants, land);

  const things = new Model(T, 140823);
  gardenFurnishings(things, land);

  const path = new Model(T, 140513);
  cliffPath(path, land, sections);
  chainRail(path, land);

  // Pines in the joints of the cliff: [bearing, stratum they root in, size].
  const pines = new Model(T, 140617);
  for (const [bearing, k, size] of [
    [70, 2, 0.95],
    [102, 4, 1.35],
    [49, 4, 1.5],
    [14, 2, 0.9],
    [-17, 4, 1.4],
    [171, 2, 1.1],
    [203, 4, 1.45]
  ]) {
    const i = Math.round(degrees(bearing)) % SPOKES,
      a = (i * circle) / SPOKES,
      [r, y] = sections[i][k];
    cliffPine(
      pines,
      Math.cos(a) * r,
      y - 0.25,
      Math.sin(a) * r,
      -a + pines.rng.range(-0.3, 0.3),
      size
    );
  }

  for (const [x, y, z] of crowns)
    cloudPine(pines, x, y - 0.12, z, 0.75, pines.rng.range(0, circle));
  ledgeGrowth(pines, sections);

  const far = new Model(T, 140719);
  farPeaks(far, land);

  group.add(
    rock.finish('黑木崖身與園土'),
    water.finish('鴛鴦池', { cast: false }),
    home.finish('繡閣', { occluder: true }),
    plants.finish('紅梅翠竹與粉牆', { occluder: true }),
    things.finish('石桌湖石燈鼎', { occluder: true }),
    path.finish('崖道絞架與鐵索', { occluder: true }),
    pines.finish('崖壁蒼松', { occluder: true }),
    far.finish('雲海遠峰', { distant: true, cast: false })
  );
  return group;
}

export { landform14, tiles14, bloom, flowerPot, needlePad };
