import { circle, midway } from '../scenery-kit.js';
import { oldPine } from './peaks-4.js';
import { pad, tuft } from './kit-12.js';

const needles = [0x1e3226, 0x23392a, 0x273f2b],
  needleEdge = 0x33503a,
  needleLight = 0x4a6242;
import { granite, graniteLit, snow, flameMark } from './tiles-18.js';

// The top of 光明頂: the summit rock round the board, its granite falling sheer on every
// side into the sea of cloud, the mountain road climbing the south face to the board,
// the spires that have split from the cliff and the pines in its joints, the knot of
// crags in the north-west with the mouth of the secret way, and cloud lying against
// the mountain's foot. The camera stands to the south-east, so what is tall is kept
// north and west.

const SPOKES = 288;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (lo, hi, v) => {
  const t = clamp((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
const hash = (i, salt = 0) => {
  const n = Math.sin(i * 127.1 + salt * 311.7 + 1.3) * 43758.5453;
  return n - Math.floor(n);
};
// A compass bearing as a spoke: 0 is east, 90 south, 180 west, -90 north.
const degrees = (d) => ((((d / 360) * SPOKES) % SPOKES) + SPOKES) % SPOKES;
const mist = 0xc6ced3;

// Summit ground beyond the board, as rounds [x, z, radius]: the terrace the hall
// stands on, the crags of the secret way in the north-west, a knoll in the
// north-east and the landing at the head of the road.
const beds = [
  [0, -8.4, 3.1],
  [-2.3, -9.1, 2.0],
  [2.3, -9.1, 2.0],
  [-5.7, -6.5, 1.9],
  [-6.9, -4.4, 1.0],
  [5.7, -6.5, 1.5],
  [0, 7.0, 1.4]
];

// The summit measured along spokes from the middle of the board: where the tiles
// end (rim), where the rock ends (top), how high its lip is and whether it is broad
// summit ground (1) or a bare edge (0).
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
    let r = 9.4;
    while (r > 3 && !paved(Math.cos(a) * r, Math.sin(a) * r)) r -= 0.02;
    return r;
  });
  const rim = blur(widen(board, 3), 2);
  let top = ring((i, a) => {
    const c = Math.cos(a),
      s = Math.sin(a);
    let r = rim[i] + 0.34;
    for (const [x, z, rad] of beds) {
      const along = x * c + z * s,
        off = x * s - z * c;
      if (Math.abs(off) < rad) r = Math.max(r, along + Math.sqrt(rad * rad - off * off));
    }
    return r;
  });
  top = blur(blur(top, 3), 2).map((r, i) => Math.max(r, rim[i] + 0.32));
  const broad = top.map((r, i) => smooth(0.45, 1.2, r - rim[i]));
  top = top.map((r, i) => r + 0.12 * Math.sin(i * 0.41) * Math.sin(i * 0.13 + 1) + 0.05 * Math.sin(i * 1.7));
  const lip = broad.map((g, i) => lerp(-0.46, -0.26, g) + 0.04 * Math.sin(i * 0.9));
  const read = (values, f) => {
    const i = Math.floor(f),
      t = f - i;
    return lerp(values[((i % SPOKES) + SPOKES) % SPOKES], values[(((i + 1) % SPOKES) + SPOKES) % SPOKES], t);
  };
  const spoke = (x, z) => ((Math.atan2(z, x) / circle) * SPOKES + SPOKES) % SPOKES;
  // Height of the rock outside the tiles: a cut step below the board's edge, a
  // little rise and fall over the broad ground, down to the lip at the edge.
  const ground = (x, z) => {
    const f = spoke(x, z),
      r = Math.hypot(x, z),
      R = read(rim, f),
      T = read(top, f);
    const inland = smooth(0.25, 1.2, r - R) * smooth(0, 0.9, T - r) * read(broad, f);
    const y =
      -0.3 + inland * (0.1 + 0.06 * Math.sin(x * 1.3 + z * 0.7) + 0.05 * Math.sin(z * 2.1 - x * 0.9));
    return lerp(y, read(lip, f), smooth(T - 0.5, T, r));
  };
  return { rim, top, broad, lip, read, spoke, ground };
}

// The cliff in section, from the lip down: [joint set, reach beyond the lip, depth of
// the jointing, drop, ledge]. Granite splits into tall columns; each face keeps one
// set of joints, and a ledge broken into blocks of its own joins it to the next.
const strata = [
  [0, 0, 0, 0, 0],
  [0, 0.06, 0.1, 0.1, 0],
  [0, 0.12, 0.24, 1.15, 1],
  [1, 0.44, 0.36, 1.3, 1],
  [1, 0.52, 0.48, 2.75, 2],
  [2, 0.92, 0.58, 2.95, 2],
  [2, 1.02, 0.7, 4.55, 3],
  [3, 1.62, 0.8, 4.8, 3],
  [3, 1.82, 0.95, 6.9, 4],
  [3, 3.0, 1.15, 9.8, 4]
];
// The faces whose top is a ledge, where snow lies.
const ledges = new Set([3, 5, 7]);
const jointWidth = [4, 5, 7, 10];
const blockWidth = [0, 6, 8, 9, 12];
function joint(set, i) {
  const cell = jointWidth[set],
    count = Math.floor(SPOKES / cell),
    f = i / cell,
    c = Math.floor(f);
  return lerp(hash(c % count, set), hash((c + 1) % count, set), smooth(0.25, 0.75, f - c));
}
function block(ledge, i) {
  const cell = blockWidth[ledge],
    count = SPOKES / cell,
    f = i / cell,
    c = Math.floor(f);
  return lerp(hash(c % count, ledge + 30), hash((c + 1) % count, ledge + 30), smooth(0.38, 0.62, f - c));
}
function cliffSection(land, i) {
  const a = (i * circle) / SPOKES;
  return strata.map(([set, out, depth, drop, ledge], k) => {
    const sway = 0.6 * Math.sin(a * 3 + ledge * 1.7) + 0.4 * Math.sin(a * 7 + ledge * 2.9);
    const loose = ledge > 0 && k < 9;
    return [
      land.top[i] + out + depth * joint(set, i),
      land.lip[i] - drop - (loose ? 0.13 * drop * sway + 0.7 * (block(ledge, i) - 0.5) : 0)
    ];
  });
}
// How far out the rock face stands at a spoke (which may fall between two) and height.
function faceRadius(sections, f, y) {
  const at = (i) => {
    const s = sections[((i % SPOKES) + SPOKES) % SPOKES];
    let k = 0;
    while (k < s.length - 2 && s[k + 1][1] > y) k++;
    const t = clamp((s[k][1] - y) / Math.max(0.001, s[k][1] - s[k + 1][1]));
    return lerp(s[k][0], s[k + 1][0], t);
  };
  const i = Math.floor(f);
  return lerp(at(i), at(i + 1), f - i);
}

// Granite: pale grey-buff columns, a rusty stain here and there, snow on the ledges
// (more on the shaded north), lost in the cloud lower down.
function rockTone(m, i, k, y) {
  const set = strata[k][0],
    cell = Math.floor(i / jointWidth[set]);
  let c = m.mix(0x6e6a63, 0x9a9488, hash(cell, set + 5) * 0.7 + 0.3 * hash(i, k + 20));
  if (hash(cell, set + 9) > 0.82) c = m.mix(c, 0x8a6a52, 0.45);
  if (hash(cell, set + 13) < 0.12) c = m.mix(c, 0x4f4e4b, 0.5);
  const a = (i * circle) / SPOKES,
    north = smooth(0.1, -0.9, Math.sin(a));
  if (ledges.has(k) && hash(Math.floor(i / 3), k + 40) < 0.55 + 0.35 * north)
    c = m.mix(c, snow, 0.75 + 0.2 * hash(i, k));
  if (k <= 1) c = m.mix(0x7d786f, 0x9a9387, hash(i, 7));
  return m.mix(c, mist, 0.9 * smooth(-3.2, -7.4, y));
}
function groundTone(m, x, z, broad, edge) {
  const n = 0.5 + 0.3 * Math.sin(x * 2.1 + z * 1.3) + 0.2 * Math.sin(z * 3.7 - x * 1.9);
  const rock = m.mix(0x7a756c, 0x968f83, n),
    grit = m.mix(0x6e675b, 0x857c6c, n),
    turf = m.mix(0x6a7048, 0x838458, n);
  const soil = m.mix(grit, turf, smooth(0.45, 0.85, 0.5 + 0.5 * Math.sin(x * 0.9 - z * 1.1 + 2)));
  return m.mix(rock, soil, broad * smooth(0.05, 0.6, edge) * 0.8);
}

// A granite spire split from the cliff: jointed columns that narrow upward in steps,
// a broken crown with a cap of snow. Returns where a pine could root on its crown.
function spire(m, x, z, base, w, H, n = 9) {
  const r = m.rng,
    spin = r.range(0, circle),
    lean = [r.range(-0.15, 0.15), r.range(-0.15, 0.15)];
  const spokes = Array.from({ length: n }, (_, i) => [
    spin + (i / n) * circle + r.range(-0.15, 0.15),
    i % 2 ? r.range(0.62, 0.8) : r.range(0.92, 1.12),
    r.range(0.84, 1)
  ]);
  const levels = [
    [0, 1],
    [0.2, 0.94],
    [0.38, 0.86],
    [0.54, 0.78],
    [0.68, 0.68],
    [0.8, 0.57],
    [0.89, 0.45],
    [0.95, 0.32],
    [1, 0.16]
  ];
  const bulge = levels.map(() => r.range(0.92, 1.08));
  const rings = levels.map(([k, s], j) =>
    spokes.map(([a, q, crest]) => [
      x + Math.cos(a) * w * q * s * bulge[j] + lean[0] * k * w,
      base + k * H * (k > 0.9 ? crest : 1),
      z + Math.sin(a) * w * q * s * bulge[j] + lean[1] * k * w
    ])
  );
  const body = m.mix(0x77726a, 0x948e83, r.next());
  const tone = (k, i) => {
    const y = base + k * H;
    let c = i % 2 ? body : m.mix(body, 0xaaa396, 0.35);
    if (k > 0.94) c = m.mix(c, snow, 0.8);
    return m.mix(c, mist, 0.9 * smooth(-3.2, -7.4, y));
  };
  for (let j = 0; j < levels.length - 1; j++)
    for (let i = 0; i < n; i++) {
      const q = (i + 1) % n,
        lo = levels[j][0],
        hi = levels[j + 1][0];
      m.face(
        [rings[j][i], rings[j + 1][i], rings[j + 1][q], rings[j][q]],
        [tone(lo, i), tone(hi, i), tone(hi, i), tone(lo, i)],
        0.9 + 0.05 * ((i * 3 + j) % 3)
      );
    }
  const last = rings[levels.length - 1],
    tip = [x + lean[0] * w, base + H * 1.02, z + lean[1] * w];
  for (let i = 0; i < n; i++) m.face([tip, last[(i + 1) % n], last[i]], snow);
  return [tip[0], Math.min(...last.map((p) => p[1])), tip[2]];
}

// The rock round the board: the apron of summit ground and the jointed cliff below.
const bedding = [0, 1, 0, 2, 0, 2, 0, 1, 0];
function crag(m, land, sections) {
  const stations = 7,
    apron = [],
    tones = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = (i * circle) / SPOKES,
      c = Math.cos(a),
      s = Math.sin(a),
      row = [],
      tone = [];
    for (let j = 0; j < stations; j++) {
      const inner = land.rim[i] - 0.35,
        r = j === 0 ? 4.5 : lerp(inner, land.top[i], (j - 1) / (stations - 2));
      const x = c * r,
        z = s * r;
      row.push([x, j === stations - 1 ? land.lip[i] : land.ground(x, z), z]);
      tone.push(groundTone(m, x, z, land.broad[i], land.top[i] - r));
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
      tone.push(rockTone(m, i, k, y));
      if (k === sec.length - 1) break;
      const [r1, y1] = sec[k + 1],
        n = bedding[k];
      for (let b = 1; b <= n; b++) {
        const t = b / (n + 1) + 0.06 * (hash(Math.floor(i / 5), k * 7 + b) - 0.5),
          rr = lerp(r, r1, t),
          yy = lerp(y, y1, t) + 0.05 * Math.sin(a * 5 + b + k),
          proud = 0.04 + 0.05 * hash(Math.floor(i / 3), k * 11 + b),
          base = rockTone(m, i, k + 1 < strata.length && ledges.has(k + 1) ? k + 1 : k, yy);
        const plain = m.mix(base, b % 2 ? 0xb2ab9e : 0x55514b, 0.25);
        row.push([c * (rr + proud), yy, s * (rr + proud)]);
        tone.push(ledges.has(k + 1) ? m.mix(rockTone(m, i, k, yy), 0xb2ab9e, 0.2) : plain);
        row.push([c * (rr - 0.03), yy - 0.05, s * (rr - 0.03)]);
        tone.push(m.mix(rockTone(m, i, k, yy), 0x2c2a27, 0.42));
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
  // Spires off the south and east faces and the far side: [bearing, off the lip,
  // top, girth]. The crowns of the higher ones carry pines.
  const crowns = [];
  for (const [bearing, off, topY, girth] of [
    [38, 3.0, -1.6, 0.8],
    [52, 4.1, -3.3, 0.6],
    [118, 2.9, -2.2, 0.7],
    [140, 3.6, -1.2, 0.85],
    [14, 3.2, -2.4, 0.75],
    [-24, 3.1, -0.9, 0.8],
    [-58, 3.6, -1.9, 0.75],
    [-130, 3.4, -0.6, 0.9],
    [-160, 3.1, -1.5, 0.7],
    [200, 3.6, -2.8, 0.65],
    [76, 3.8, -3.9, 0.55]
  ]) {
    const i = Math.round(degrees(bearing)) % SPOKES,
      a = (i * circle) / SPOKES,
      d = land.top[i] + off;
    const crown = spire(m, Math.cos(a) * d, Math.sin(a) * d, -8.5, girth, topY + 8.5);
    if (topY > -2.5) crowns.push(crown);
  }
  return crowns;
}

// Snow: drifts lying in the hollows of the summit ground, most on the north.
function snowPatches(m, land) {
  const r = m.rng;
  for (let k = 0; k < 46; k++) {
    const i = Math.floor(r.range(0, SPOKES)),
      a = (i * circle) / SPOKES,
      north = smooth(0.3, -0.8, Math.sin(a));
    if (r.next() > 0.25 + 0.75 * north) continue;
    const R = land.rim[i] + 0.15,
      T = land.top[i] - 0.15;
    if (T - R < 0.2) continue;
    const d = r.range(R, T),
      cx = Math.cos(a) * d,
      cz = Math.sin(a) * d,
      size = r.range(0.14, 0.42) * Math.min(1, (T - R) * 0.8),
      spin = r.range(0, circle),
      ring = [];
    for (let q = 0; q < 9; q++) {
      const t = spin + (q * circle) / 9,
        s = size * r.range(0.6, 1.15),
        x = cx + Math.cos(t) * s * 1.4,
        z = cz + Math.sin(t) * s;
      ring.push([x, land.ground(x, z) + 0.012, z]);
    }
    const mid = [cx, land.ground(cx, cz) + 0.03, cz];
    for (let q = 0; q < 9; q++)
      m.face([mid, ring[(q + 1) % 9], ring[q]], [m.rgb(snow), m.rgb(0xdfe6ec), m.rgb(0xdfe6ec)]);
  }
}

// Scree and grass along the foot of the board's cut edge, and on the summit ground
// beyond it: frost-split stones lying where they fell, all of them low.
function apronScree(m, land) {
  const r = m.rng;
  for (let k = 0; k < 150; k++) {
    const i = Math.floor(r.range(0, SPOKES)),
      a = (i * circle) / SPOKES,
      R = land.rim[i] + 0.12,
      T = land.top[i] - 0.12;
    if (T <= R) continue;
    const d = r.range(R, Math.min(T, R + 1.6)),
      x = Math.cos(a) * d,
      z = Math.sin(a) * d;
    // Keep clear of the hall's podium and the head of the road.
    if (Math.abs(x) < 3.6 && z < -6.2) continue;
    if (Math.abs(x) < 1.8 && z > 6.4) continue;
    const y = land.ground(x, z);
    if (k % 3 === 0) tuft(m, x, y, z, r.range(0.12, 0.2));
    else
      m.rock(x, y - 0.03, z, r.range(0.05, 0.14), r.range(0.05, 0.12), r.range(0.05, 0.12), granite[k % 4], graniteLit, 6, r.range(0, 3));
  }
}

// Life in the joints: tufts of grass on the narrow ledges, cushions of moss, and a
// few stones fallen onto the shelves.
function ledgeLife(m, sections) {
  const r = m.rng;
  for (let j = 0; j < 70; j++) {
    const k = j % 2 ? 3 : 5,
      f = (j * 4.1 + r.range(0, 3)) % SPOKES,
      i = Math.floor(f),
      a = (f * circle) / SPOKES,
      [r0, y0] = sections[i][k - 1],
      [r1, y1] = sections[i][k],
      t = r.range(0.45, 0.8),
      rr = lerp(r0, r1, t),
      y = lerp(y0, y1, t),
      c = Math.cos(a),
      s = Math.sin(a);
    if (j % 3 === 0)
      m.rock(c * rr, y - 0.05, s * rr, r.range(0.1, 0.2), r.range(0.08, 0.16), r.range(0.1, 0.16), granite[j % 4], graniteLit, 6, r.range(0, 3));
    else tuft(m, c * rr, y - 0.02, s * rr, r.range(0.16, 0.26));
    if (j % 4 === 1)
      m.rock(c * (rr - 0.12), y - 0.04, s * (rr - 0.12), 0.16, 0.06, 0.12, 0x4f5e3c, 0x6f7f4d, 6, r.range(0, 3));
  }
}

// A pine rooted in a joint of the cliff: the trunk leaves the rock sideways (+x is
// out from the face), turns up and holds its pads out over the drop.
function cliffPine(m, x, y, z, yaw, size) {
  const r = m.rng;
  m.frame(x, y, z, yaw, size, () => {
    const sway = r.range(-0.12, 0.12);
    const trunk = [
      [-0.4, -0.18, 0],
      [0.22, 0.0, 0.03],
      [0.6, 0.26, -0.04 + sway],
      [0.78, 0.68, 0.02 + sway],
      [1.0, 1.02, sway * 2]
    ];
    const girth = [0.1, 0.09, 0.075, 0.056, 0.034];
    for (let k = 1; k < trunk.length; k++)
      m.tube(trunk[k - 1], trunk[k], girth[k - 1], girth[k], k % 2 ? 0x5c4838 : 0x6b5644, 6);
    for (const [from, to, size] of [
      [2, [1.25, 0.3, 0.32], 0.38],
      [3, [0.5, 0.84, -0.56], 0.34],
      [3, [1.32, 0.8, 0.36], 0.36],
      [1, [0.7, 0.12, -0.4], 0.3]
    ]) {
      const end = [to[0] + r.range(-0.08, 0.08), to[1], to[2] + r.range(-0.08, 0.08)];
      m.tube(trunk[from], end, 0.038, 0.016, 0x5e4a3a, 5);
      pad(m, end[0], end[1] + 0.04, end[2], size, true, needles, needleEdge, needleLight, 7, 0.85);
      pad(m, end[0] - 0.12, end[1] + 0.01, end[2] + 0.1, size * 0.65, true, needles, needleEdge, needleLight, 6, 0.75);
    }
    pad(m, trunk[4][0] + 0.04, trunk[4][1] + 0.06, trunk[4][2], 0.4, true, needles, needleEdge, needleLight, 7, 0.92);
  });
}

// The mountain road: it comes up the south face in a flight of steps hewn against the
// rock, turns on a landing, and climbs the last steps onto the board between two
// stone posts; an iron chain on stakes runs along its open side.
function mountainRoad(m, land, sections) {
  const iron = 0x2c2e31,
    step = (k) => (k % 2 ? 0x8a8479 : 0x9a9488),
    worn = 0xb1aa9b;
  // From the board's south edge down to the landing.
  const head = land.ground(0, 7.2);
  for (let k = 0; k < 3; k++) {
    const y = 0.04 - (k + 1) * ((0.04 - head) / 3.4),
      z = 6.62 + k * 0.24;
    m.box(0, (y - 0.6) / 2, z, 2.6 - k * 0.2, y + 0.6, 0.26, step(k));
    m.box(0, y + 0.002, z - 0.02, 2.2 - k * 0.2, 0.006, 0.12, worn);
  }
  // The landing's paving.
  for (let i = -2; i <= 2; i++)
    for (let j = 0; j < 3; j++) {
      const x = i * 0.42 + (j % 2) * 0.2,
        z = 7.48 + j * 0.42;
      if (Math.hypot(x, z - 7.2) > 1.25) continue;
      m.box(x, land.ground(x, z) - 0.03, z, 0.4, 0.08, 0.4, m.mix(step(i + j), worn, m.rng.range(0, 0.4)));
    }
  // Two posts at the road's head with flames carved on their faces.
  for (const s of [-1, 1]) {
    const x = s * 1.45,
      z = 7.0,
      y = land.ground(x, z);
    m.box(x, y + 0.05, z, 0.34, 0.14, 0.34, granite[0]);
    m.box(x, y + 0.45, z, 0.22, 0.7, 0.22, granite[2]);
    m.box(x, y + 0.83, z, 0.3, 0.06, 0.3, granite[1]);
    m.lathe(x, y + 0.86, z, [[0, 0.1], [0.08, 0.12], [0.16, 0.07], [0.24, 0.0]], graniteLit, 8);
    m.frame(x, y + 0.5, z + 0.111, 0, 1, () => flameMark(m, 0, 0, 0, 0.16));
  }
  // The flights down the south face: the first goes west, the second turns back east
  // below it. Each step is a block against the rock.
  let peg = null;
  const flight = (start, dir, count, y0) => {
    const steps = [];
    for (let k = 0; k < count; k++) {
      const f = start + dir * k * 1.15,
        y = y0 - 0.15 * k;
      let r = 0;
      for (let d = -2; d <= 2; d++) r = Math.max(r, faceRadius(sections, f + d + SPOKES, y - 0.1));
      steps.push([f, y, r + 0.22]);
    }
    for (let k = 0; k < count; k++) {
      const [f, y, r] = steps[k],
        a = (f * circle) / SPOKES;
      m.frame(Math.cos(a) * r, y, Math.sin(a) * r, -a, 1, () => {
        m.box(-0.12, -0.16, 0, 1.0, 0.32, 0.36, k % 2 ? 0x77726a : 0x857f74);
        m.box(0.02, 0.006, 0, 0.72, 0.012, 0.31, 0x9e978a);
      });
      if (k % 3 === 0) {
        const out = r + 0.36,
          top = [Math.cos(a) * out, y + 0.48, Math.sin(a) * out];
        m.tube([top[0], y - 0.06, top[2]], top, 0.022, 0.018, iron, 5);
        if (peg && Math.hypot(peg[0] - top[0], peg[2] - top[2]) < 1.6) {
          const sag = midway(peg, top, 0.5);
          sag[1] -= 0.09;
          m.line([peg, sag, top], 0.013, iron, 4);
        }
        peg = top;
      }
    }
    return steps[count - 1];
  };
  const startY = land.read(land.lip, degrees(92)) - 0.05;
  const end = flight(degrees(95), 1, 20, startY);
  peg = null;
  flight(end[0] + 1, -1, 22, end[1] - 0.35);
}

// The knot of crags in the north-west and the mouth of the secret way that comes up
// through them: a dark cleft between two leaning slabs, a boulder wedged over it, worn
// steps going down into the dark and the old door that once shut it, fallen aside.
function secretWay(m, land) {
  const r = m.rng;
  const at = (x, z) => [x, land.ground(x, z), z];
  // The crags round about.
  for (const [x, z, w, h, d] of [
    [-6.9, -6.9, 0.9, 2.6, 0.8],
    [-5.6, -7.6, 0.8, 2.1, 0.7],
    [-7.5, -5.6, 0.7, 1.8, 0.7],
    [-4.6, -7.9, 0.6, 1.3, 0.5],
    [-7.8, -4.3, 0.55, 1.1, 0.5],
    [-6.2, -8.2, 0.7, 1.6, 0.6]
  ]) {
    const [, y] = at(x, z);
    m.rock(x, y - 0.1, z, w, h, d, granite[r.range(0, 4) | 0], graniteLit, 9, r.range(0, 3));
    m.rock(x + w * 0.3, y + h * 0.85, z - d * 0.2, w * 0.6, h * 0.35, d * 0.55, granite[1], snow, 7, r.range(0, 3));
  }
  // The cleft faces the board, toward the tile the way comes out at.
  const cx = -6.35,
    cz = -5.75,
    yaw = Math.atan2(1.2, 1.05),
    base = land.ground(cx, cz);
  m.frame(cx, base, cz, yaw, 1, () => {
    const dark = 0x0f0e0d,
      deep = 0x1d1b19;
    // Two great slabs lean together over the mouth.
    for (const s of [-1, 1])
      m.frame(s * 0.62, -0.1, -0.15, s * 0.25, 1, () => {
        m.rock(0, 0, 0, 0.45, 1.9, 0.55, granite[s > 0 ? 3 : 0], graniteLit, 8, 0.4);
      }, 0, -s * 0.2);
    m.rock(0, 1.45, -0.25, 0.75, 0.55, 0.5, granite[1], snow, 8, 1.1);
    // The dark of the passage: a pointed opening, deep inside.
    const mouth = [
      [-0.36, -0.05],
      [0.36, -0.05],
      [0.3, 0.6],
      [0.14, 1.12],
      [0.0, 1.3],
      [-0.16, 1.08],
      [-0.3, 0.62]
    ];
    m.face(mouth.map(([u, v]) => [u, v, -0.42]), dark);
    for (let k = 0; k < mouth.length; k++) {
      const [u0, v0] = mouth[k],
        [u1, v1] = mouth[(k + 1) % mouth.length];
      if (k === 0) continue;
      m.face(
        [
          [u0, v0, -0.42],
          [u1, v1, -0.42],
          [u1 * 1.3, v1 * 1.05, 0.12],
          [u0 * 1.3, v0 * 1.05, 0.12]
        ],
        [m.rgb(dark), m.rgb(dark), m.rgb(deep), m.rgb(deep)]
      );
    }
    // Steps worn hollow, going down into the dark.
    for (let k = 0; k < 4; k++)
      m.box(0, -0.04 - k * 0.09, 0.3 - k * 0.2, 0.62 - k * 0.04, 0.08, 0.22, m.mix(0x8a8479, 0x2a2826, k / 4));
    // The door, an iron-bound plank leaf fallen against the rock.
    m.frame(0.62, 0.02, 0.42, -0.6, 1, () => {
      m.box(0, 0.4, 0, 0.5, 0.8, 0.05, 0x4c3a2c);
      for (const v of [0.15, 0.4, 0.65]) m.box(0, v, 0.03, 0.52, 0.05, 0.012, 0x2b2b2d);
      for (const u of [-0.14, 0.12]) m.box(u, 0.4, 0.028, 0.012, 0.8, 0.012, 0x3a2c22);
      m.hoop(0.12, 0.42, 0.04, 0.04, 0.008, 0x2b2b2d, 8, 'xy');
    }, -0.35, 0.1);
    // Stones fallen from the lintel; grass at the foot.
    for (let k = 0; k < 6; k++)
      m.rock(r.range(-0.7, 0.7), -0.02, r.range(0.2, 0.8), r.range(0.05, 0.12), r.range(0.04, 0.1), r.range(0.05, 0.1), granite[k % 4], graniteLit, 6, r.range(0, 3));
    for (let k = 0; k < 5; k++) tuft(m, r.range(-0.9, 0.9), 0, r.range(0.1, 0.7), r.range(0.12, 0.2));
  });
  // Pines on the crags.
  oldPine(m, ...at(-6.7, -7.6), 0.8, 2.6, 0.7, 6);
  oldPine(m, ...at(-7.9, -5.2), 0.62, 3.3, 0.55, 5);
}

// A bank of cloud: soft, uneven domes run together, grey below and bright on top.
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
        const tone = m.mix(0xaeb6bc, 0xf1f3f4, smooth(0, 0.85, k2));
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
function clouds(m, land) {
  const r = m.rng;
  for (let j = 0; j < 10; j++) {
    const i = Math.round((j * SPOKES) / 10 + r.range(-6, 6) + SPOKES) % SPOKES,
      a = (i * circle) / SPOKES,
      d = land.top[i] + r.range(2.8, 4.6);
    cloudBank(m, Math.cos(a) * d, -6.85, Math.sin(a) * d, r.range(5, 8), r.range(1.3, 2.0), -a + Math.PI / 2, 5);
  }
  for (let j = 0; j < 9; j++) {
    const a = (j * circle) / 9 + r.range(-0.2, 0.2),
      d = r.range(14, 22);
    cloudBank(m, Math.cos(a) * d, -6.9, Math.sin(a) * d, r.range(8, 13), r.range(2, 3), -a + Math.PI / 2, 6);
  }
}

export {
  SPOKES,
  degrees,
  summit,
  cliffSection,
  crag,
  snowPatches,
  apronScree,
  ledgeLife,
  cliffPine,
  mountainRoad,
  secretWay,
  clouds
};
