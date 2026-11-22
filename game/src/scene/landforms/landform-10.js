// 神龍竹堂：《鹿鼎記》的神龍島。草木蔥鬱、遍地是蛇的海島：南灘登岸，北面是洪安通的大竹堂，
// 堂前五色龍旗，西、北兩面毛竹成林。棋盤以外的一切，和這張圖自己的幾種地塊，都在這裡。
import { Model, circle, midway } from '../scenery-kit.js';
import { lantern, reeds } from '../maze-models.js';

const sea = -0.62;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

const CANE = [0x6f9a4c, 0x84a955, 0x5d8a47, 0x97a85a]; // living culms
const LEAF = [0x5c8a43, 0x74a04d, 0x8db458, 0x4f7a3f];
const BROAD = [0x4f8a4a, 0x67a055, 0x7db562, 0x3f7a45]; // taro and plantain
const AGED = [0xc7ab66, 0xb89b55, 0xd3ba78, 0xab9450]; // cut, dried bamboo
const THATCH = [0xb9a468, 0xa8915a, 0xc6b47c, 0x93835f];
const SCALE = [0x3f7a58, 0x2f6652, 0x5b8a4a, 0x8a7a3c]; // snakes, carved or alive
// The five dragon banners, west to east before the hall, the master's yellow above its ridge.
const BANNERS = {
  white: [0xe9e4d4, 0xb5493a],
  black: [0x2c2d33, 0xd0aa58],
  red: [0xc23b2e, 0xe0bb62],
  green: [0x2f8d86, 0xe0bb62],
  yellow: [0xdcb43e, 0xb5493a]
};

// Value noise for the shoreline, colour patches and the clumping of plants. The hash is the
// usual sine trick, so the island is the same every time.
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz),
    b = hash(ix + 1, iz),
    c = hash(ix, iz + 1),
    d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) {
  return (
    0.55 * noise(x, z) +
    0.3 * noise(x * 2.1 + 5.2, z * 2.1 - 1.7) +
    0.15 * noise(x * 4.3 - 3.1, z * 4.3 + 7.9)
  );
}

// The hall stands north of the board, its stair foot on the board's edge. Everything of the
// hall is measured from that foot: +z toward the board, -z into the island.
const hallZ = -6.05;
const HALL = { floor: 0.5, plate: 2.8, porch: -1.9, wall: -3.0, back: -6.3, half: 4.4 };
// Packed earth round the hall and its forecourt: 1 on it, fading to 0 within a stride.
function court(x, z) {
  const dx = Math.max(Math.abs(x) - 5.9, 0),
    dz = Math.max(-13.2 - z, z + 5.9, 0);
  return 1 - smooth(Math.hypot(dx, dz) / 0.8);
}
// The path the reinforcements take from the west landing up to the board.
function trail(x, z) {
  if (x > -5.7) return 0;
  const line = 0.8 + 0.5 * Math.sin(x * 0.7 + 0.5);
  return (1 - smooth((Math.abs(z - line) - 0.3) / 0.45)) * smooth((-5.7 - x) / 0.4);
}

// The island as a field: where the board is, how far a point lies inside the waterline, how
// high the ground stands, and how tall a thing may be before it hides a tile.
function makeIsland(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const tiles = layout.cells.map(({ x, y }) => [x - cx, y - cz]);
  const onBoard = (x, z) =>
    layout.mask[Math.floor(z + cz + 0.5)]?.[Math.floor(x + cx + 0.5)] === '#';
  // Distance out from the board's edge, 0 on the board.
  function off(x, z) {
    let nearest = Infinity;
    for (const [tx, tz] of tiles) {
      const dx = Math.max(Math.abs(x - tx) - 0.5, 0),
        dz = Math.max(Math.abs(z - tz) - 0.5, 0);
      nearest = Math.min(nearest, dx * dx + dz * dz);
    }
    return Math.sqrt(nearest);
  }
  // A beach round the board, the body of the island to the north, a wooded spit to the west.
  function inland(x, z) {
    const body = (1 - Math.hypot((x + 1.5) / 12.5, (z + 10) / 9.5)) * 9.5,
      spit = (1 - Math.hypot((x + 7.4) / 3.9, (z - 0.4) / 6.6)) * 3.9;
    const wobble =
      (fbm(x * 0.31 + 4.1, z * 0.31 - 2.7) - 0.5) * 1.5 + 0.16 * Math.sin(x * 1.3 + z * 0.9);
    return Math.max(2.1 - off(x, z), body, spit) + Math.max(-0.42, wobble);
  }
  function heightAt(x, z) {
    const s = inland(x, z);
    if (s <= 0) return Math.max(-1.45, sea - 0.04 + s * 0.42);
    let y = sea - 0.04 + 0.5 * smooth(s / 1.5) + 0.1 * smooth((s - 1.3) / 1.4);
    y += 0.03 * (noise(x * 1.9 + 7, z * 1.9) - 0.5) * smooth(s / 0.9);
    // A wooded hill behind the hall and a knoll in the north-west grove.
    const deep = smooth((s - 2.4) / 3.2);
    y += deep * smooth((-z - 12.7) / 2.8) * (1.7 + 0.9 * fbm(x * 0.45 + 2, z * 0.45));
    y += 0.8 * deep * Math.exp(-(((x + 8.2) / 2.4) ** 2) - ((z + 8.6) / 2.8) ** 2);
    return y;
  }
  // The ground is laid on a half-tile grid whose lines fall on the tile edges.
  const step = 0.5,
    west = -14.5,
    north = -20.5,
    cols = 49,
    rows = 61;
  const heights = new Float32Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++)
      heights[j * (cols + 1) + i] = heightAt(west + i * step, north + j * step);
  const at = (i, j) => heights[j * (cols + 1) + i];
  // The height of the laid ground itself, on the same triangles the mesh uses.
  function surface(x, z) {
    const fx = (x - west) / step,
      fz = (z - north) / step,
      i = Math.floor(fx),
      j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= cols || j >= rows) return heightAt(x, z);
    const u = fx - i,
      v = fz - j,
      a = at(i, j),
      b = at(i, j + 1),
      c = at(i + 1, j + 1),
      d = at(i + 1, j);
    if ((i + j) % 2) return v >= u ? a + (b - a) * v + (c - b) * u : a + (d - a) * u + (c - d) * v;
    return u + v <= 1 ? a + (d - a) * u + (b - a) * v : c + (b - c) * (1 - u) + (d - c) * (1 - v);
  }
  // The usual cameras look north-west (wide screens) or nearly due north (phones). A thing
  // standing between them and the board may rise only so far before it hides a tile.
  function headroom(x, z) {
    let room = Infinity;
    for (const [dx, dz, slope] of [
      [-0.64, -0.77, 0.85],
      [-0.2, -0.98, 1.4]
    ])
      for (let t = 0.2; t <= 4.4; t += 0.2)
        if (onBoard(x + dx * t, z + dz * t)) {
          room = Math.min(room, t * slope);
          break;
        }
    return room;
  }
  return {
    onBoard,
    off,
    inland,
    heightAt,
    surface,
    headroom,
    grid: { step, west, north, cols, rows, at }
  };
}

// Where bamboo grows thick: inland on the north and west, clear of the hall, the path and the
// board's edge. 0 to 1.
function thicket(isle, x, z) {
  const s = isle.inland(x, z),
    out = isle.off(x, z);
  if (s < 1.6 || out < 0.85) return 0;
  const precinct = Math.abs(x) < 6.2 && z > -13.3;
  const north = z < -5.6 && !precinct,
    westward = x < -6.7 && z < 5.2;
  if ((!north && !westward) || trail(x, z) > 0.1) return 0;
  return smooth((s - 1.6) / 0.8) * smooth((out - 0.85) / 0.6);
}

// Ground colour: wet sand at the waterline, pale dry sand and patches of shingle above it, turf
// inland, darker under the groves, packed earth round the hall and along the west path.
function paint(m, isle, x, z, y) {
  const s = isle.inland(x, z);
  const n1 = fbm(x * 0.8 + 3.1, z * 0.8 - 1.3),
    n2 = fbm(x * 2.3 - 7.0, z * 2.3 + 2.2);
  if (y < sea - 0.05) return m.mix(0x91906f, 0x56746b, smooth((sea - y) / 0.55));
  let c = m.mix(0xcdbf94, 0xe2d7b2, smooth((n2 - 0.38) / 0.3));
  c = m.mix(c, 0xa09c8c, 0.6 * smooth((n1 - 0.5) / 0.12) * (1 - smooth((s - 1.9) / 0.7)));
  c = m.mix(c, 0x8c8266, 0.85 * smooth((sea + 0.13 - y) / 0.13));
  const bare = Math.max(court(x, z), trail(x, z));
  const turf = m.mix(0x8a9a5c, 0x6c8a4a, smooth((n1 - 0.35) / 0.3));
  c = m.mix(c, turf, 0.92 * smooth((s - 2.0) / 1.1) * (1 - 0.8 * bare));
  c = m.mix(c, 0x55703f, 0.55 * thicket(isle, x, z) + 0.3 * smooth((y - 0.2) / 1.2));
  c = m.mix(c, 0xbfae84, 0.5 * bare * smooth((s - 2.0) / 1.1));
  const grain = 0.94 + 0.12 * n2;
  return c.map((v) => v * grain);
}

function ground(m, isle) {
  const { step, west, north, cols, rows, at } = isle.grid;
  const tint = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++)
      tint.push(paint(m, isle, west + i * step, north + j * step, at(i, j)));
  const corner = ([i, j]) => [west + i * step, at(i, j), north + j * step],
    tone = ([i, j]) => tint[j * (cols + 1) + i];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      // The board lays its own ground; the sea bed stops where the water hides it.
      if (isle.onBoard(west + (i + 0.5) * step, north + (j + 0.5) * step)) continue;
      if (Math.max(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)) < -1.4) continue;
      const ring = [
        [i, j],
        [i, j + 1],
        [i + 1, j + 1],
        [i + 1, j]
      ];
      if (!((i + j) % 2)) ring.push(ring.shift());
      m.face(ring.map(corner), ring.map(tone));
    }
}
// The kit shades every face flat. Sand should roll, so the ground takes its normals from the
// slope of the height grid instead.
function soften(group, isle) {
  const { step, west, north, cols, rows, at } = isle.grid;
  const { position, normal } = group.children[0].geometry.attributes;
  const h = (i, j) => at(Math.max(0, Math.min(cols, i)), Math.max(0, Math.min(rows, j)));
  for (let k = 0; k < position.count; k++) {
    const i = Math.round((position.getX(k) - west) / step),
      j = Math.round((position.getZ(k) - north) / step);
    const nx = h(i - 1, j) - h(i + 1, j),
      nz = h(i, j - 1) - h(i, j + 1),
      l = Math.hypot(nx, 2 * step, nz);
    normal.setXYZ(k, nx / l, (2 * step) / l, nz / l);
  }
  normal.needsUpdate = true;
}

// Sea-worn reef rock: dark and wet at the foot, a pale line of salt and barnacles where the
// tide stands, weathered grey above. Small stones are cut plainer.
function reef(m, x, y, z, rx, h, rz, n = 8, plain = false) {
  const r = m.rng,
    turn = r.range(0, circle),
    lean = [r.range(-0.18, 0.18) * rx, r.range(-0.18, 0.18) * rz];
  const edge = Array.from({ length: n }, () => [r.range(0.8, 1.16), r.range(-0.07, 0.07)]);
  const levels = plain
    ? [
        [0, 0.92, 0x454c47],
        [0.24, 1, 0xb4b09a],
        [0.45, 0.92, 0x5c635a],
        [0.9, 0.48, 0x7c8172]
      ]
    : [
        [0, 0.9, 0x3d4541],
        [0.1, 1, 0x464e48],
        [0.16, 0.995, 0xc6c2ab],
        [0.29, 0.98, 0xb8b49e],
        [0.37, 0.95, 0x596058],
        [0.66, 0.78, 0x626a5f],
        [0.92, 0.45, 0x7c8172]
      ];
  let last;
  for (const [level, scale, tone] of levels) {
    const ring = edge.map(([k, v], i) => {
      const a = turn + (i * circle) / n;
      return [
        x + Math.cos(a) * rx * k * scale + lean[0] * level,
        y + h * (level + (level > 0.3 ? v : v * 0.15)),
        z + Math.sin(a) * rz * k * scale + lean[1] * level
      ];
    });
    const col = m.rgb(tone);
    if (last)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        m.face(
          [last.ring[i], ring[i], ring[j], last.ring[j]],
          [last.col, col, col, last.col],
          0.92 + 0.08 * Math.abs(Math.cos(i * 1.7))
        );
      }
    last = { ring, col };
  }
  const peak = [x + lean[0], y + h * 1.02, z + lean[1]];
  for (let i = 0; i < n; i++) m.face([peak, last.ring[(i + 1) % n], last.ring[i]], 0x878b79);
}

// One living cane: three lengths that lean further as they rise, with sprays of leaves on the
// upper half. Joints are marked on the canes that stand close to the eye.
function culm(m, x, y, z, h, sprays, sides = 5, joints = false) {
  const r = m.rng,
    a = r.range(0, circle),
    lean = h * r.range(0.04, 0.2),
    thick = 0.024 + h * 0.008,
    tone = r.pick(CANE);
  const at = (t) => [x + Math.cos(a) * lean * t * t, y + h * t, z + Math.sin(a) * lean * t * t];
  const cuts = [0, 0.34, 0.68, 1];
  for (let k = 0; k < 3; k++) {
    const from = at(cuts[k]),
      wide = thick * (1 - 0.2 * k);
    m.tube(
      from,
      at(cuts[k + 1]),
      wide,
      wide - thick * 0.2,
      k % 2 ? m.mix(tone, 0xd8d28c, 0.22) : tone,
      sides
    );
    if (joints && k)
      m.tube(from, [from[0], from[1] + 0.022, from[2]], wide * 1.3, wide * 1.3, 0x55733c, sides);
  }
  for (let k = 0; k < sprays; k++) {
    const from = at(0.46 + (0.54 * (k + r.next())) / sprays),
      b = k * 2.4 + r.range(-0.5, 0.5),
      l = h * r.range(0.13, 0.21);
    m.leaf(
      from,
      [from[0] + Math.cos(b) * l, from[1] - l * r.range(0.05, 0.5), from[2] + Math.sin(b) * l],
      l * 0.19,
      r.pick(LEAF),
      r.pick(LEAF),
      l * 0.3
    );
  }
}
// A tussock of coarse snake grass: stiff blades fanning from one root.
function tussock(m, x, y, z, h, blades) {
  const r = m.rng;
  for (let k = 0; k < blades; k++) {
    const a = (k * circle) / blades + r.range(-0.3, 0.3),
      l = h * r.range(0.6, 1.1),
      lean = l * r.range(0.15, 0.5);
    m.leaf(
      [x + Math.cos(a) * 0.02, y, z + Math.sin(a) * 0.02],
      [x + Math.cos(a) * lean, y + l, z + Math.sin(a) * lean],
      l * 0.075,
      r.pick([0x4f7f5a, 0x5f8f5a, 0x6f9a5c]),
      0x9fbf7a,
      l * 0.08
    );
  }
}
// Taro: a handful of heart-shaped leaves on arching stalks.
function taro(m, x, y, z, s) {
  const r = m.rng;
  for (let k = 0; k < 5; k++) {
    const a = (k * circle) / 5 + r.range(-0.4, 0.4),
      reach = s * r.range(0.25, 0.55),
      top = [x + Math.cos(a) * reach, y + s * r.range(0.45, 0.9), z + Math.sin(a) * reach],
      l = s * r.range(0.4, 0.62);
    m.tube([x, y, z], top, 0.01 + 0.012 * s, 0.008, 0x6f9050, 3);
    m.leaf(
      [top[0] - Math.cos(a) * l * 0.25, top[1] + 0.02, top[2] - Math.sin(a) * l * 0.25],
      [top[0] + Math.cos(a) * l * 0.75, top[1] - l * 0.3, top[2] + Math.sin(a) * l * 0.75],
      l * 0.36,
      r.pick(BROAD),
      r.pick(BROAD),
      l * 0.12
    );
  }
}
// 芭蕉: a fleshy stem and long arching blades, the newest still furled upright.
function plantain(m, x, y, z, s) {
  const r = m.rng,
    top = [x + r.range(-0.06, 0.06) * s, y + 0.75 * s, z + r.range(-0.06, 0.06) * s];
  m.tube([x, y, z], top, 0.08 * s, 0.05 * s, 0x86a060, 6);
  for (let k = 0; k < 6; k++) {
    const a = k * 2.3 + r.range(-0.3, 0.3),
      l = s * r.range(0.75, 1.1);
    m.leaf(
      top,
      [top[0] + Math.cos(a) * l, top[1] - l * r.range(0.05, 0.4), top[2] + Math.sin(a) * l],
      l * 0.2,
      r.pick(BROAD),
      r.pick(BROAD),
      l * r.range(0.3, 0.5)
    );
  }
  m.leaf(top, [top[0] + 0.02, top[1] + 0.6 * s, top[2] + 0.02], 0.05 * s, BROAD[2], BROAD[2], 0);
}
// A snake stretched out on the ground, the head a little raised.
function snake(m, x, y, z, yaw, l, col) {
  m.frame(x, y, z, yaw, l, () => {
    let last = [-0.5, 0.012, 0];
    for (let k = 1; k <= 9; k++) {
      const t = k / 9,
        p = [-0.5 + t, 0.014 + (k === 9 ? 0.05 : 0), 0.09 * Math.sin(t * 9.5) * (1 - 0.5 * t)];
      m.tube(
        last,
        p,
        0.008 + 0.02 * Math.sin(Math.PI * Math.min(1, t * 1.25)),
        0.008 + 0.02 * Math.sin(Math.PI * Math.min(1, (t + 0.11) * 1.25)),
        col,
        4
      );
      last = p;
    }
    m.tube(last, [last[0] + 0.07, last[1] + 0.01, last[2] + 0.02], 0.028, 0.008, col, 4);
  });
}
// A snake at rest: two turns of body, the head lifted from the middle.
function coil(m, x, y, z, s, col) {
  let last = [x + s, y, z];
  for (let k = 1; k <= 11; k++) {
    const t = k / 11,
      a = t * circle * 2.1,
      rad = s * (1 - 0.68 * t),
      p = [
        x + Math.cos(a) * rad,
        y + s * (0.22 * t + (k > 9 ? 0.3 * (k - 9) : 0)),
        z + Math.sin(a) * rad
      ];
    m.tube(
      last,
      p,
      s * (0.06 + 0.1 * Math.min(1, k / 4)),
      s * (0.06 + 0.1 * Math.min(1, (k + 1) / 4)),
      col,
      4
    );
    last = p;
  }
  m.tube(
    last,
    [last[0] + s * 0.3, last[1] + s * 0.05, last[2] + s * 0.12],
    s * 0.2,
    s * 0.05,
    col,
    4
  );
}
// A woven basket: bands of two straws in turn, so the weave reads, under a domed lid. An open
// one shows its dark inside.
function basket(m, x, y, z, s, lid = true) {
  const n = 10,
    profile = [
      [0, 0.18],
      [0.07, 0.235],
      [0.2, 0.27],
      [0.33, 0.265],
      [0.43, 0.22],
      [0.47, 0.2],
      [0.5, 0.218]
    ];
  const ring = ([h, rad]) =>
    Array.from({ length: n }, (_, j) => {
      const a = (j * circle) / n;
      return [x + Math.cos(a) * rad * s, y + h * s, z + Math.sin(a) * rad * s];
    });
  const band = (low, high, tone, k) => {
    for (let j = 0; j < n; j++) {
      const q = (j + 1) % n;
      m.face([low[j], high[j], high[q], low[q]], tone, 0.9 + 0.1 * ((j + k) % 2));
    }
  };
  let last = ring(profile[0]);
  for (let k = 1; k < profile.length; k++) {
    const next = ring(profile[k]);
    band(last, next, k === profile.length - 1 ? 0x7d5f38 : k % 2 ? 0xb8935a : 0x9c7a45, k);
    last = next;
  }
  if (lid) {
    const brim = ring([0.51, 0.235]),
      crown = ring([0.6, 0.11]);
    band(brim, crown, 0xa8854e, 0);
    m.face(crown.slice().reverse(), 0xb8935a);
    m.tube([x, y + 0.6 * s, z], [x, y + 0.66 * s, z], 0.03 * s, 0.04 * s, 0x7d5f38, 5);
  } else m.face(ring([0.4, 0.21]).reverse(), 0x39332a);
}
// A wine jar of 雄黃酒, its mouth tied down under red cloth.
function jar(m, x, y, z, s) {
  m.lathe(
    x,
    y,
    z,
    [
      [0, 0.12 * s],
      [0.08 * s, 0.2 * s],
      [0.27 * s, 0.24 * s],
      [0.39 * s, 0.17 * s],
      [0.44 * s, 0.1 * s]
    ],
    0x7a5a42,
    9
  );
  m.lathe(
    x,
    y,
    z,
    [
      [0.4 * s, 0.135 * s],
      [0.47 * s, 0.125 * s],
      [0.5 * s, 0.06 * s]
    ],
    0xb5493a,
    9
  );
}

// A sampan drawn up on the sand: plank hull, two thwarts, a low arched mat awning over the
// waist and the sculling oar shipped across the stern.
function sampan(m, x, y, z, yaw, pitch, heel) {
  m.frame(
    x,
    y,
    z,
    yaw,
    1,
    () => {
      // Each station: place along the keel, half beam, gunwale height, keel height.
      const stations = [
        [-1.2, 0.25, 0.36, 0.1],
        [-0.85, 0.33, 0.32, 0.03],
        [-0.3, 0.38, 0.3, 0],
        [0.3, 0.36, 0.3, 0],
        [0.8, 0.26, 0.34, 0.05],
        [1.25, 0.05, 0.48, 0.24]
      ];
      const rib = ([u, b, g, k]) => [
        [u, g, -b],
        [u, k + (g - k) * 0.35, -b * 0.72],
        [u, k, 0],
        [u, k + (g - k) * 0.35, b * 0.72],
        [u, g, b]
      ];
      let last = rib(stations[0]);
      m.face(last, 0x6f5a44);
      for (let k = 1; k < stations.length; k++) {
        const next = rib(stations[k]);
        for (let j = 0; j < 4; j++)
          m.face(
            [last[j], next[j], next[j + 1], last[j + 1]],
            j === 0 || j === 3 ? 0x8d7556 : 0x77624a,
            0.92 + 0.08 * ((k + j) % 2)
          );
        last = next;
      }
      for (const side of [0, 4])
        m.line(
          stations.map((s) => rib(s)[side]),
          0.022,
          0x5d4a36,
          4
        );
      m.face(
        [
          [-1.1, 0.14, -0.17],
          [-1.1, 0.14, 0.17],
          [0.9, 0.1, 0.15],
          [0.9, 0.1, -0.15]
        ],
        0xa08a66
      );
      m.box(-0.78, 0.28, 0, 0.14, 0.03, 0.64, 0x9a8362);
      m.box(0.66, 0.29, 0, 0.14, 0.03, 0.56, 0x9a8362);
      const arc = (u) =>
        Array.from({ length: 7 }, (_, j) => {
          const a = (j * Math.PI) / 6;
          return [u, 0.31 + Math.sin(a) * 0.36, -Math.cos(a) * 0.38];
        });
      const aft = arc(-0.5),
        fore = arc(0.3);
      for (let j = 0; j < 6; j++)
        m.face([aft[j], fore[j], fore[j + 1], aft[j + 1]], j % 2 ? 0xc4a25c : 0xab8748);
      m.line(aft, 0.018, AGED[3], 4);
      m.line(fore, 0.018, AGED[3], 4);
      m.tube([-1.62, 0.5, 0.2], [-0.2, 0.36, 0.3], 0.018, 0.018, 0x8d7556, 4);
      m.box(-1.72, 0.51, 0.19, 0.3, 0.012, 0.09, 0x8d7556);
    },
    heel,
    pitch
  );
}
// A bleached log thrown up by the sea, with the stub of a branch.
function driftwood(m, isle, x, z) {
  const r = m.rng,
    a = r.range(0, circle),
    l = r.range(0.45, 0.85),
    thick = r.range(0.045, 0.075),
    tone = r.pick([0xcfc6b0, 0xb9ae96, 0xd8d0bc]);
  const end = (k) => {
    const px = x + Math.cos(a) * l * k,
      pz = z + Math.sin(a) * l * k;
    return [px, isle.surface(px, pz) + thick * 0.7, pz];
  };
  const butt = end(-1),
    tip = end(1),
    fork = midway(butt, tip, r.range(0.35, 0.7)),
    b = a + r.pick([-1, 1]) * r.range(0.6, 1.1);
  m.tube(tip, butt, thick * 0.55, thick, tone, 6);
  m.tube(
    fork,
    [fork[0] + Math.cos(b) * l * 0.4, fork[1] + l * 0.2, fork[2] + Math.sin(b) * l * 0.4],
    thick * 0.5,
    thick * 0.2,
    tone,
    5
  );
}

// A landing stage of cane on the east beach: piles in pairs, two stringers, the deck laid
// across them. Returns its seaward end.
function jetty(m, isle, z) {
  const deck = sea + 0.24;
  let from = 6.6;
  while (from < 9 && isle.surface(from, z) > deck - 0.04) from += 0.1;
  const to = from + 2.7,
    run = (x) => z + (x - from) * 0.08;
  for (const side of [-1, 1])
    m.tube(
      [from - 0.3, deck - 0.05, run(from - 0.3) + side * 0.3],
      [to, deck - 0.05, run(to) + side * 0.3],
      0.04,
      0.04,
      AGED[3],
      5
    );
  m.face(
    [
      [from - 0.3, deck - 0.03, run(from - 0.3) - 0.38],
      [from - 0.3, deck - 0.03, run(from - 0.3) + 0.38],
      [to, deck - 0.03, run(to) + 0.38],
      [to, deck - 0.03, run(to) - 0.38]
    ],
    0x7d6a40
  );
  for (let k = 0; from - 0.25 + k * 0.115 < to; k++) {
    const x = from - 0.25 + k * 0.115;
    m.tube([x, deck, run(x) - 0.42], [x, deck, run(x) + 0.42], 0.034, 0.034, AGED[k % 3], 4);
  }
  for (let k = 0; k < 4; k++) {
    const x = from + 0.3 + k * 0.78;
    for (const side of [-1, 1])
      m.tube(
        [x, -1.5, run(x) + side * 0.46],
        [x, deck + (k === 3 ? 0.42 : 0.16), run(x) + side * 0.46],
        0.045,
        0.04,
        AGED[1],
        5
      );
  }
  return [to, run(to)];
}
// A fishing net hung to dry over a cane trestle.
function netRack(m, x, y, z, yaw) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const u of [-0.8, 0.8])
      for (const side of [-1, 1])
        m.tube([u, 0, side * 0.36], [u, 0.86, -side * 0.06], 0.028, 0.024, AGED[1], 4);
    m.tube([-1, 0.78, 0], [1, 0.78, 0], 0.028, 0.028, AGED[0], 4);
    const hang = (u, t, side) => [u, 0.8 - t * 0.76, side * (0.03 + t * 0.52)];
    for (const side of [-1, 1]) {
      for (let k = 0; k <= 8; k++) {
        const u = -0.7 + k * 0.175;
        m.face(
          [
            hang(u - 0.014, 0, side),
            hang(u + 0.014, 0, side),
            hang(u + 0.014, 1, side),
            hang(u - 0.014, 1, side)
          ],
          0x5f5a48
        );
      }
      for (const t of [0.25, 0.5, 0.75, 0.98])
        m.face(
          [
            hang(-0.71, t - 0.018, side),
            hang(0.71, t - 0.018, side),
            hang(0.71, t + 0.018, side),
            hang(-0.71, t + 0.018, side)
          ],
          0x6b6652
        );
    }
  });
}
// The day's catch hung from a cane rail to dry.
function snakeRack(m, x, y, z, yaw) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const u of [-0.6, 0.6]) m.tube([u, 0, 0], [u, 1.02, 0], 0.03, 0.026, AGED[1], 4);
    m.tube([-0.72, 0.96, 0], [0.72, 0.96, 0], 0.026, 0.026, AGED[0], 4);
    for (let k = 0; k < 6; k++) {
      const u = -0.48 + k * 0.19,
        l = 0.42 + 0.22 * hash(k, 3);
      m.leaf([u, 0.96, 0], [u + 0.02, 0.96 - l, 0.03], 0.03, SCALE[k % 4], SCALE[(k + 1) % 4], 0);
    }
  });
}
// Beach morning glory: a runner of round leaves flat on the sand, with a pink trumpet or two.
function vine(m, isle, x, z) {
  const r = m.rng;
  let a = r.range(0, circle),
    px = x,
    pz = z;
  for (let k = 0; k < 6; k++) {
    a += r.range(-0.7, 0.7);
    const qx = px + Math.cos(a) * 0.14,
      qz = pz + Math.sin(a) * 0.14,
      y = isle.surface(qx, qz) + 0.02;
    m.leaf([px, isle.surface(px, pz) + 0.02, pz], [qx, y, qz], 0.055, 0x5f8f50, 0x7aa860, 0.012);
    if (k % 3 === 1)
      m.face(
        [
          [qx + 0.04, y + 0.02, qz + 0.03],
          [qx + 0.075, y + 0.03, qz + 0.065],
          [qx + 0.04, y + 0.03, qz + 0.1],
          [qx + 0.005, y + 0.03, qz + 0.065]
        ],
        0xd98ab0
      );
    px = qx;
    pz = qz;
  }
}

// The shore and the low things on it: reef rock at the waterline, stacks off the far shores,
// shingle, wrack, driftwood, beach grass, taro by the turf, the boats, the cult's stores.
function strand(m, isle) {
  const r = m.rng;
  for (let k = 0; k < 950; k++) {
    const x = r.range(-14, 9.5),
      z = r.range(-20, 9.5),
      s = isle.inland(x, z);
    if (Math.abs(s - 0.1) > 0.45 || fbm(x * 0.5 + 20, z * 0.5) < 0.5) continue;
    const size = r.range(0.14, 0.4),
      tall = Math.min(size * r.range(0.9, 1.6), isle.headroom(x, z));
    reef(m, x, isle.surface(x, z) - tall * 0.3, z, size, tall, size * r.range(0.7, 1), 7, true);
  }
  for (const [x, z, size, tall] of [
    [-12.7, 4.3, 0.7, 1.1],
    [-13.5, 3.3, 0.4, 0.6],
    [10.4, -8.8, 0.8, 1.3],
    [11.1, -7.5, 0.45, 0.7],
    [8.9, 4.4, 0.5, 0.45],
    [-3.9, 9.8, 0.55, 0.4],
    [5.6, 9.2, 0.6, 0.5],
    [-9.6, 8.4, 0.6, 0.8]
  ])
    reef(m, x, sea - tall * 0.42, z, size, tall * 1.42, size * 0.8, 9);
  // Shingle: flat pebbles lying on the sand, thickest in the grey patches.
  for (let k = 0; k < 2400; k++) {
    const x = r.range(-13, 9.5),
      z = r.range(-12, 9.5),
      s = isle.inland(x, z);
    if (s < 0.15 || s > 2.0 || isle.off(x, z) < 0.12) continue;
    if (fbm(x * 0.8 + 3.1, z * 0.8 - 1.3) < 0.47 && r.next() < 0.8) continue;
    const size = r.range(0.035, 0.09),
      turn = r.range(0, circle),
      tone = r.pick([0x9a968a, 0xb3ad9c, 0x7f7d74, 0xc2b9a2, 0x8f8a7a]);
    m.face(
      Array.from({ length: 6 }, (_, j) => {
        const a = turn - (j * circle) / 6,
          px = x + Math.cos(a) * size,
          pz = z + Math.sin(a) * size * 0.72;
        return [px, isle.surface(px, pz) + 0.016, pz];
      }),
      tone
    );
  }
  // The wrack line: weed left by the last high water.
  for (let k = 0; k < 2600; k++) {
    const x = r.range(-13, 9.5),
      z = r.range(-12, 9.5),
      s = isle.inland(x, z);
    if (Math.abs(s - 0.55) > 0.13 || r.next() < 0.3) continue;
    const a = r.range(0, circle),
      l = r.range(0.07, 0.16),
      y = isle.surface(x, z) + 0.02;
    m.leaf(
      [x, y, z],
      [x + Math.cos(a) * l, y, z + Math.sin(a) * l],
      l * 0.3,
      0x5a5a3a,
      0x6f6a44,
      0.006
    );
  }
  let logs = 0;
  for (let k = 0; k < 500 && logs < 12; k++) {
    const x = r.range(-12, 9),
      z = r.range(-10, 9),
      s = isle.inland(x, z);
    if (s < 0.5 || s > 1.5 || isle.off(x, z) < 0.9 || r.next() < 0.8) continue;
    driftwood(m, isle, x, z);
    logs++;
  }
  // Coarse beach grass along the top of the sand, wherever it will not hide a tile.
  for (let k = 0; k < 700; k++) {
    const x = r.range(-12.5, 9),
      z = r.range(-12, 9),
      s = isle.inland(x, z),
      out = isle.off(x, z);
    if (s < 1.15 || s > 2.5 || out < 0.3 || court(x, z) > 0.2 || trail(x, z) > 0.2) continue;
    if (fbm(x * 1.1 + 31, z * 1.1 + 7) < 0.45) continue;
    const tall = Math.min(r.range(0.2, 0.42), isle.headroom(x, z) * 0.9);
    reeds(m, x, z, tall, 5, false, isle.surface(x, z) - 0.01);
  }
  // Taro in the damp turf close under the groves and the hall's forecourt.
  for (let k = 0; k < 900; k++) {
    const x = r.range(-9, 8.5),
      z = r.range(-9, 6),
      out = isle.off(x, z);
    if (out < 0.4 || out > 1.5 || isle.inland(x, z) < 2.6) continue;
    if (court(x, z) > 0.1 || trail(x, z) > 0.1 || fbm(x * 0.9 + 3, z * 0.9 + 17) < 0.42) continue;
    const size = Math.min(r.range(0.38, 0.62), isle.headroom(x, z));
    if (size > 0.25) taro(m, x, isle.surface(x, z) - 0.01, z, size);
  }
  // Morning glory creeping over the dry sand of the south and east beaches.
  for (let k = 0, made = 0; k < 900 && made < 22; k++) {
    const x = r.range(-6, 8.5),
      z = r.range(-3, 8.5),
      s = isle.inland(x, z);
    if (s < 1.0 || s > 2.3 || isle.off(x, z) < 0.35 || fbm(x * 1.3 + 5, z * 1.3 + 40) < 0.5)
      continue;
    vine(m, isle, x, z);
    made++;
  }
  // Two sampans on the south beach where the party came ashore, a third at the west landing.
  for (const [x, z, yaw, pitch, heel] of [
    [-1.9, 8.25, Math.PI / 2 + 0.22, 0.17, 0.12],
    [2.4, 8.4, Math.PI / 2 - 0.3, 0.16, -0.1],
    [-11.1, 1.0, -0.2, 0.15, 0.1]
  ]) {
    const bow = [x + Math.cos(yaw) * 1.1, z - Math.sin(yaw) * 1.1];
    sampan(m, x, Math.max(sea - 0.06, isle.surface(x, z) - 0.02), z, yaw, pitch, heel);
    // Moored by the bow to a stake in the sand.
    const post = [bow[0] + Math.cos(yaw) * 0.5 + 0.15, bow[1] - Math.sin(yaw) * 0.5],
      foot = isle.surface(post[0], post[1]);
    m.tube(
      [post[0], foot - 0.05, post[1]],
      [post[0], foot + 0.2, post[1]],
      0.025,
      0.02,
      0x6f5a44,
      5
    );
    m.tube(
      [bow[0], isle.surface(bow[0], bow[1]) + 0.3, bow[1]],
      [post[0], foot + 0.16, post[1]],
      0.008,
      0.008,
      0xcabb94,
      3
    );
  }
  // The east beach is where the islanders work: a cane landing stage with a boat tied up
  // alongside, and a net drying on its trestle.
  const [endX, endZ] = jetty(m, isle, 2.5);
  sampan(m, endX - 1.0, sea - 0.07, endZ + 0.95, 0.08, 0, 0.03);
  m.tube(
    [endX + 0.2, sea + 0.36, endZ + 0.9],
    [endX - 0.42, sea + 0.6, endZ + 0.46],
    0.008,
    0.008,
    0xcabb94,
    3
  );
  netRack(m, 5.05, isle.surface(5.05, 5.65) - 0.02, 5.65, 0.7);
  snakeRack(m, 7.0, isle.surface(7.0, -5.3) - 0.02, -5.3, 0.5);
  // The cult's stores east of the stair: jars of realgar wine and baskets for the catch.
  jar(m, 5.75, isle.surface(5.75, -6.5), -6.5, 1.25);
  jar(m, 6.25, isle.surface(6.25, -6.2), -6.2, 1.05);
  jar(m, 5.95, isle.surface(5.95, -5.95), -5.95, 0.9);
  basket(m, 6.55, isle.surface(6.55, -6.75), -6.75, 0.95);
  basket(m, 6.75, isle.surface(6.75, -6.3), -6.3, 0.75, false);
  coil(m, 6.75, isle.surface(6.75, -6.3) + 0.3, -6.3, 0.11, SCALE[2]);
  basket(m, -5.85, isle.surface(-5.85, -6.5), -6.5, 1.0);
  jar(m, -5.7, isle.surface(-5.7, -5.9), -5.9, 1.0);
  // The island is alive with snakes: on the warm sand, along the path, by the stores.
  for (const [x, z, yaw, l, tone] of [
    [0.6, 7.25, 0.5, 0.5, 0],
    [-3.4, 7.0, 2.4, 0.42, 2],
    [7.2, 1.6, 1.2, 0.46, 3],
    [-7.3, 0.2, -0.4, 0.5, 2],
    [5.3, -5.7, 2.1, 0.44, 0],
    [-4.3, -6.35, 0.3, 0.4, 3]
  ])
    snake(m, x, isle.surface(x, z) + 0.004, z, yaw, l, SCALE[tone]);
  coil(m, 7.35, isle.surface(7.35, 3.6), 3.6, 0.1, SCALE[0]);
  coil(m, -6.75, isle.surface(-6.75, -2.2), -2.2, 0.1, SCALE[3]);
}

// A stretch of woven matting between two posts: strips of two straws, with cane rails.
function matting(m, a, b, low, high) {
  const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.3));
  for (let k = 0; k < n; k++) {
    const p = midway(a, b, k / n),
      q = midway(a, b, (k + 1) / n);
    m.face(
      [
        [p[0], low, p[1]],
        [q[0], low, q[1]],
        [q[0], high, q[1]],
        [p[0], high, p[1]]
      ],
      k % 2 ? 0xa88f58 : 0x94793f
    );
  }
  for (const y of [low + 0.05, (low + high) / 2, high - 0.05])
    m.tube([a[0], y, a[1]], [b[0], y, b[1]], 0.03, 0.03, AGED[3], 4);
}
// The heavy thatch: tiers hipped all round, each with its thick cut edge over the one below,
// the topmost gabled; cane battens tie the straw down.
function thatchRoof(m, zc, hx0, hz0, eave, rise) {
  const r = m.rng;
  const ring = (t, lift = 0, out = 0) => {
    const hx = hx0 - 2.6 * t + out,
      hz = hz0 * (1 - t) + out,
      y = eave + rise * t + lift;
    return [
      [-hx, y, zc + hz],
      [hx, y, zc + hz],
      [hx, y, zc - hz],
      [-hx, y, zc - hz]
    ];
  };
  const tiers = [0, 0.27, 0.51, 0.72],
    top = eave + rise + 0.12,
    gable = hx0 - 2.6 * 0.72,
    ridge = [
      [-gable - 0.22, top, zc],
      [gable + 0.22, top, zc]
    ];
  for (let k = 0; k < tiers.length; k++) {
    const hipped = k < tiers.length - 1,
      low = ring(tiers[k], k ? 0.12 : 0, k ? 0.09 : 0),
      butt = ring(tiers[k], k ? -0.08 : -0.22, k ? 0.09 : -0.02),
      high = hipped ? ring(tiers[k + 1]) : null;
    for (let e = 0; e < 4; e++) {
      const f = (e + 1) % 4,
        long = e % 2 === 0;
      if (!hipped && !long) continue;
      const crest = hipped ? [high[e], high[f]] : e ? [ridge[1], ridge[0]] : ridge;
      // Narrow runs of straw, the lower tiers longer in the weather and greyer for it.
      const n = long ? 30 - 4 * k : 11 - 2 * k,
        shade = [1, 0.9, 0.82, 0.94][e],
        straw = m.mix(0xc4b074, 0xa3925f, 0.22 * (3 - k));
      for (let q = 0; q < n; q++)
        m.face(
          [
            midway(low[e], low[f], q / n),
            midway(low[e], low[f], (q + 1) / n),
            midway(crest[0], crest[1], (q + 1) / n),
            midway(crest[0], crest[1], q / n)
          ],
          // Moss takes hold on the weather side, away from the sun.
          m.mix(straw, e === 2 && r.next() < 0.3 ? 0x7f8a55 : r.pick(THATCH), 0.4),
          shade * (r.next() < 0.12 ? 0.9 : r.range(0.96, 1.04))
        );
      const cuts = long ? 6 : 3;
      for (let q = 0; q < cuts; q++)
        m.face(
          [
            midway(butt[e], butt[f], q / cuts),
            midway(butt[e], butt[f], (q + 1) / cuts),
            midway(low[e], low[f], (q + 1) / cuts),
            midway(low[e], low[f], q / cuts)
          ],
          0x7b6943,
          shade * (0.9 + 0.08 * (q % 2))
        );
    }
    // A cane batten round each tier, pegged through the straw.
    const t = tiers[k] + (hipped ? 0.4 * (tiers[k + 1] - tiers[k]) : 0.1),
      loop = ring(t, hipped ? 0.07 : 0.16, hipped ? 0.04 : 0.1);
    if (hipped) m.line([...loop, loop[0]], 0.03, AGED[0], 4);
    else for (const e of [0, 2]) m.tube(loop[e], loop[e + 1], 0.03, 0.03, AGED[0], 4);
  }
  // Under the eaves, and the little gables of woven cane at the ridge ends.
  const under = ring(0, -0.22, -0.02);
  const plate = [
    [-HALL.half - 0.05, HALL.plate + 0.08, HALL.porch + 0.05],
    [HALL.half + 0.05, HALL.plate + 0.08, HALL.porch + 0.05],
    [HALL.half + 0.05, HALL.plate + 0.08, HALL.back - 0.05],
    [-HALL.half - 0.05, HALL.plate + 0.08, HALL.back - 0.05]
  ];
  for (let e = 0; e < 4; e++) {
    const f = (e + 1) % 4;
    m.face([under[e], under[f], plate[f], plate[e]], 0x6e5c3c);
  }
  const shoulder = ring(0.72, 0.12, 0.09);
  for (const side of [-1, 1]) {
    const x = side * gable,
      reach = shoulder[0][2] - zc;
    m.face(
      [
        [x, shoulder[0][1], zc + reach],
        [x, shoulder[0][1], zc - reach],
        [x, top - 0.03, zc]
      ],
      0x6a5836
    );
    for (const u of [-0.5, 0, 0.5])
      m.tube(
        [x + side * 0.02, shoulder[0][1], zc + u * reach],
        [
          x + side * 0.02,
          shoulder[0][1] + (top - shoulder[0][1]) * (1 - Math.abs(u)) - 0.04,
          zc + u * reach
        ],
        0.022,
        0.022,
        AGED[1],
        4
      );
  }
  return { top, gable };
}
// 大竹堂: the great hall of the 神龍教, built wholly of bamboo. A terrace faced with cane
// courses, a wide stair either side of a carved serpent ramp, posts of three culms lashed
// together, walls of woven matting, and one great thatch with the divine dragon on its ridge.
function bambooHall(m) {
  const { floor, plate, porch, wall, back, half } = HALL;
  // The terrace: rammed earth behind stacked canes held by stakes, decked with split bamboo.
  m.box(0, 0.16, -4.15, 10.7, 0.62, 5.5, 0x9d8d68);
  m.box(0, floor - 0.015, -4.15, 10.84, 0.03, 5.62, 0xc0aa72);
  for (let k = 0; k < 21; k++) {
    const x = -5.2 + k * 0.52;
    m.face(
      [
        [x - 0.012, floor + 0.003, -1.36],
        [x + 0.012, floor + 0.003, -1.36],
        [x + 0.012, floor + 0.003, porch - 0.2],
        [x - 0.012, floor + 0.003, porch - 0.2]
      ],
      0x8f7b4e
    );
  }
  for (let k = 0; k < 4; k++) {
    const y = -0.03 + k * 0.145,
      tone = AGED[(k + 1) % 4];
    for (const side of [-1, 1]) {
      m.tube([side * 2.05, y, -1.33], [side * 5.47, y, -1.33], 0.075, 0.075, tone, 6);
      m.tube([side * 5.43, y, -1.3], [side * 5.43, y, -6.95], 0.075, 0.075, tone, 6);
    }
  }
  for (const side of [-1, 1]) {
    for (const x of [2.12, 3.2, 4.3, 5.47])
      m.tube([side * x, -0.16, -1.25], [side * x, 0.6, -1.25], 0.06, 0.055, AGED[3], 6);
    for (const z of [-2.7, -4.1, -5.5, -6.95])
      m.tube([side * 5.52, -0.16, z], [side * 5.52, 0.6, z], 0.06, 0.055, AGED[3], 6);
  }
  // The stair: four treads of laid cane each side, round nosings, a cane rail down each flank.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const front = -0.02 - k * 0.3375,
        tread = (k + 1) * 0.125;
      m.box(
        side * 1.25,
        (tread - 0.16) / 2,
        (front - 1.37) / 2,
        1.5,
        tread + 0.16,
        front + 1.37,
        AGED[k % 2]
      );
      m.tube(
        [side * 0.5, tread - 0.035, front],
        [side * 2, tread - 0.035, front],
        0.04,
        0.04,
        AGED[2],
        5
      );
    }
    m.tube([side * 2.07, 0.12, 0.02], [side * 2.07, 0.66, -1.4], 0.06, 0.06, AGED[3], 6);
  }
  // Between the flights, a stone ramp carved with the serpent no follower may tread on.
  const slab = (x, y, z) => [x, 0.03 + y + (-z - 0.02) * (0.5 / 1.34), z];
  m.face(
    [slab(-0.5, 0, -0.02), slab(0.5, 0, -0.02), slab(0.5, 0, -1.36), slab(-0.5, 0, -1.36)],
    0x8c9283
  );
  m.face(
    [[-0.5, -0.16, -0.02], [0.5, -0.16, -0.02], slab(0.5, 0, -0.02), slab(-0.5, 0, -0.02)],
    0x7a8072
  );
  for (const side of [-1, 1])
    m.tube(
      slab(side * 0.47, 0.02, -0.02),
      slab(side * 0.47, 0.02, -1.36),
      0.035,
      0.035,
      0x7a8072,
      5
    );
  let last = slab(0, 0.03, -1.3);
  for (let k = 1; k <= 12; k++) {
    const t = k / 12,
      p = slab(0.26 * Math.sin(t * 9.4), 0.03, -1.3 + t * 1.12);
    m.tube(
      last,
      p,
      0.022 + 0.03 * Math.min(1, t * 3),
      0.022 + 0.03 * Math.min(1, (t + 0.08) * 3),
      0x4c6b58,
      5
    );
    last = p;
  }
  m.tube(last, slab(last[0] - 0.05, 0.05, -0.06), 0.075, 0.03, 0x4c6b58, 5);
  // A low cane balustrade along the terrace front, either side of the stair head.
  for (const side of [-1, 1]) {
    for (const y of [0.74, 0.94])
      m.tube([side * 2.12, y, -1.44], [side * 5.3, y, -1.44], 0.028, 0.028, AGED[0], 4);
    for (let k = 0; k < 5; k++)
      m.tube(
        [side * (2.12 + k * 0.795), floor, -1.44],
        [side * (2.12 + k * 0.795), 1.0, -1.44],
        0.035,
        0.03,
        AGED[1],
        4
      );
  }
  // Posts. Along the porch each is three culms lashed with rattan; the middle bay is left wide.
  const bays = Array.from({ length: 8 }, (_, k) => -half + (k * half * 2) / 7);
  for (const [k, x] of bays.entries()) {
    if (k !== 3 && k !== 4) {
      for (let j = 0; j < 3; j++) {
        const a = (j * circle) / 3 + 0.5;
        m.tube(
          [x + Math.cos(a) * 0.075, floor, porch + Math.sin(a) * 0.075],
          [x + Math.cos(a) * 0.075, plate, porch + Math.sin(a) * 0.075],
          0.07,
          0.062,
          AGED[(j + k) % 3],
          5
        );
      }
      for (const y of [0.92, 1.75, 2.55])
        m.tube([x, y, porch], [x, y + 0.07, porch], 0.16, 0.16, 0x6b5637, 6);
    }
    for (const z of [wall, back])
      m.tube([x, floor, z], [x, plate, z], 0.095, 0.085, AGED[k % 3], 5);
    m.tube([x, plate - 0.12, porch], [x, plate - 0.12, wall], 0.055, 0.055, AGED[1], 4);
  }
  for (const side of [-1, 1])
    for (const z of [-4.1, -5.2])
      m.tube([side * half, floor, z], [side * half, plate, z], 0.095, 0.085, AGED[1], 5);
  // Plates on the post heads.
  for (const z of [porch, wall, back])
    m.tube([-half - 0.35, plate + 0.06, z], [half + 0.35, plate + 0.06, z], 0.09, 0.09, AGED[3], 6);
  for (const side of [-1, 1])
    m.tube(
      [side * half, plate + 0.06, porch + 0.3],
      [side * half, plate + 0.06, back - 0.3],
      0.09,
      0.09,
      AGED[3],
      6
    );
  // Walls of matting; the three middle bays stand open as the hall's door.
  matting(m, [bays[0], wall], [bays[2], wall], floor, plate);
  matting(m, [bays[5], wall], [bays[7], wall], floor, plate);
  matting(m, [bays[2], wall], [bays[5], wall], 2.3, plate);
  matting(m, [-half, wall], [-half, back], floor, plate);
  matting(m, [half, wall], [half, back], floor, plate);
  matting(m, [-half, back], [half, back], floor, plate);
  // Inside, the master's seat on its dais before a lacquer screen.
  m.box(0, floor + 0.08, -5.5, 2.4, 0.16, 1.2, 0x8a6a45);
  m.box(0, floor + 0.36, -5.6, 0.72, 0.1, 0.55, AGED[1]);
  m.box(0, floor + 0.8, -5.86, 0.8, 0.9, 0.07, AGED[3]);
  m.box(0, floor + 1.0, -6.2, 3.1, 1.9, 0.06, 0x5e2f26);
  const zc = (porch + back) / 2,
    over = 0.7,
    eave = plate + 0.3 - over * 0.9,
    rise = ((back - porch) / -2 + over) * 0.9;
  const { top, gable } = thatchRoof(m, zc, half + 0.75, (porch - back) / 2 + over, eave, rise);
  // Crossed canes ride the ridge and cradle the divine dragon that lies along it, tail to the
  // west, head reared over the eastern gable.
  for (const x of [-gable - 0.1, -2.2, -1.1, 0, 1.1, 2.2, gable + 0.1])
    for (const side of [-1, 1])
      m.tube(
        [x, top - 0.42, zc + side * 0.6],
        [x + 0.03 * side, top + 0.36, zc - side * 0.42],
        0.045,
        0.04,
        AGED[2],
        5
      );
  const spine = [];
  for (let k = 0; k <= 22; k++)
    spine.push([
      -3.3 + k * 0.29,
      top + 0.19 + 0.05 * Math.sin(k * 1.1),
      zc + 0.07 * Math.sin(k * 0.8)
    ]);
  spine.push(
    [3.42, top + 0.42, zc + 0.03],
    [3.68, top + 0.68, zc + 0.02],
    [3.98, top + 0.8, zc + 0.04]
  );
  const girth = (k) => 0.035 + 0.085 * smooth(k / 7) - 0.03 * smooth((k - 21) / 4);
  for (let k = 1; k < spine.length; k++)
    m.tube(
      spine[k - 1],
      spine[k],
      girth(k - 1),
      girth(k),
      k % 2 ? SCALE[1] : m.mix(SCALE[1], SCALE[0], 0.5),
      5
    );
  const head = spine.at(-1);
  m.tube(head, [head[0] + 0.42, head[1] - 0.1, head[2] + 0.06], 0.15, 0.055, SCALE[0], 6);
  for (const side of [-1, 1])
    m.tube(
      [head[0] + 0.05, head[1] + 0.1, head[2] + side * 0.07],
      [head[0] - 0.2, head[1] + 0.3, head[2] + side * 0.14],
      0.025,
      0.008,
      0xd0aa58,
      4
    );
  m.leaf(
    [head[0] + 0.4, head[1] - 0.1, head[2] + 0.06],
    [head[0] + 0.62, head[1] - 0.16, head[2] + 0.08],
    0.02,
    0xb5493a,
    0xb5493a,
    0.01
  );
  // Paper lanterns under the front eave, either side of the stair.
  for (const side of [-1, 1]) lantern(m, side * 2.75, eave - 0.5, porch + over - 0.1, 0.8);
}

// A dragon banner: a cane staff with a spearhead, a yard, and a long cloth with a toothed foot,
// bordered in its trim, the serpent drawn down its face.
function dragonBanner(m, x, y, z, h, [cloth, trim], side, phase) {
  m.frame(x, y, z, 0, 1, () => {
    const cuts = [0, 0.36, 0.7, 1];
    for (let k = 0; k < 3; k++) {
      m.tube(
        [0, h * cuts[k], 0],
        [0, h * cuts[k + 1], 0],
        0.05 - k * 0.006,
        0.044 - k * 0.006,
        AGED[k],
        6
      );
      if (k)
        m.tube(
          [0, h * cuts[k], 0],
          [0, h * cuts[k] + 0.03, 0],
          0.062 - k * 0.006,
          0.062 - k * 0.006,
          0x8a6f3a,
          6
        );
    }
    m.crystal(0, h, 0, 0.04, 0.2, 0xa8905a, 0xe6d59a, 5);
    const yard = h - 0.14,
      width = 0.66,
      length = 1.6,
      rows = 6;
    m.tube([-side * 0.1, yard, 0], [side * (width + 0.14), yard, 0], 0.024, 0.024, AGED[0], 5);
    // The cloth hangs flat across and sways down its length.
    const sway = (v) => 0.09 * Math.sin(v * 2.6 + phase) * (0.3 + v / length),
      spot = (u, v) => [side * (0.06 + u), yard - 0.03 - v, sway(v)];
    const across = [0, 0.075, width - 0.075, width];
    for (let j = 0; j < rows; j++)
      for (let c = 0; c < 3; c++)
        m.face(
          [
            spot(across[c], (j * length) / rows),
            spot(across[c + 1], (j * length) / rows),
            spot(across[c + 1], ((j + 1) * length) / rows),
            spot(across[c], ((j + 1) * length) / rows)
          ],
          c === 1 ? cloth : trim,
          c === 1 ? 0.94 + 0.06 * (j % 2) : 1
        );
    for (let k = 0; k < 3; k++)
      m.face(
        [
          spot((k * width) / 3, length),
          spot(((k + 1) * width) / 3, length),
          spot(((k + 0.5) * width) / 3, length + 0.24)
        ],
        k === 1 ? trim : cloth
      );
    const serpent = [];
    for (let k = 0; k <= 9; k++) {
      const v = 0.2 + (k * (length - 0.4)) / 9,
        p = spot(width / 2 + 0.15 * Math.sin(k * 1.25), v);
      serpent.push([p[0], p[1], p[2] + 0.014]);
    }
    m.line(serpent, 0.016, trim, 4);
    // Twin ribbons from the staff head.
    for (const lean of [0.05, 0.16])
      m.leaf(
        [0, h - 0.02, 0],
        [-side * (0.3 + lean), h - 0.5 - lean, 0.08],
        0.03,
        trim,
        cloth,
        0.06
      );
  });
}
// A serpent post: a carved stone shaft on a plinth, the snake wound up it, its head over the top.
function serpentPost(m, x, y, z, s, yaw) {
  m.frame(x, y, z, yaw, s, () => {
    m.box(0, 0.05, 0, 0.36, 0.18, 0.36, 0x7a8072);
    m.tube([0, 0.12, 0], [0, 1.08, 0], 0.115, 0.095, 0x8c9283, 7);
    m.tube([0, 1.08, 0], [0, 1.13, 0], 0.13, 0.12, 0x7a8072, 7);
    let last = [0.16, 0.2, 0];
    for (let k = 1; k <= 14; k++) {
      const t = k / 14,
        a = t * circle * 2.2,
        p = [Math.cos(a) * 0.16, 0.2 + t * 0.95, Math.sin(a) * 0.16];
      m.tube(last, p, 0.028 + 0.03 * t, 0.03 + 0.03 * t, SCALE[1], 4);
      last = p;
    }
    const neck = [0.02, 1.32, 0.06];
    m.tube(last, neck, 0.06, 0.055, SCALE[1], 5);
    m.tube(neck, [0.02, 1.3, 0.3], 0.1, 0.035, SCALE[0], 6);
  });
}
function standards(m, isle) {
  const ground = (x, z) => isle.surface(x, z) - 0.03;
  for (const [x, colours, side, phase] of [
    [-4.5, BANNERS.white, -1, 0.4],
    [-2.95, BANNERS.black, -1, 2.1],
    [2.95, BANNERS.red, 1, 1.2],
    [4.5, BANNERS.green, 1, 3.0]
  ])
    dragonBanner(m, x, ground(x, hallZ - 0.7), hallZ - 0.7, 3.4, colours, side, phase);
  for (const side of [-1, 1])
    serpentPost(m, side * 2.38, ground(side * 2.38, hallZ - 0.28), hallZ - 0.28, 1, 0);
  // The post that marks the west path where it leaves the grove.
  serpentPost(m, -6.85, ground(-6.85, 1.95), 1.95, 1.2, Math.PI / 2);
}

// The groves: culms wherever the thicket is dense, in clumps with glades between; plantains
// along the edges where the light gets in.
function grove(m, isle, inside, canes, plants) {
  const r = m.rng;
  for (let k = 0, made = 0; k < 9000 && made < canes; k++) {
    const x = r.range(-13.5, 9.5),
      z = r.range(-19.5, 5.5);
    if (!inside(x, z)) continue;
    const dense = thicket(isle, x, z);
    if (dense < 0.25 || fbm(x * 0.7 + 9, z * 0.7 + 4) < 0.34 || r.next() > dense) continue;
    const tall = r.range(2.5, 3.9) * (0.75 + 0.25 * smooth((isle.off(x, z) - 1) / 2.5));
    if (tall > isle.headroom(x, z)) continue;
    culm(m, x, isle.surface(x, z) - 0.03, z, tall, 8, 4);
    made++;
  }
  for (let k = 0, made = 0; k < 6000 && made < plants; k++) {
    const x = r.range(-13, 9),
      z = r.range(-14, 5.5);
    if (!inside(x, z)) continue;
    const out = isle.off(x, z);
    if (out < 0.7 || out > 2.6 || isle.inland(x, z) < 2.2) continue;
    if (court(x, z) > 0.05 || trail(x, z) > 0.1 || r.next() < 0.6) continue;
    const size = r.range(0.75, 1.15);
    if (size * 1.4 > isle.headroom(x, z)) continue;
    plantain(m, x, isle.surface(x, z) - 0.02, z, size);
    made++;
  }
}

// Islets out in the sea haze: steep grey crags in twos and threes, green on their shoulders.
function farIslets(m) {
  const r = m.rng,
    haze = 0xb9cdc4;
  for (const [k, [x, z, rad, h]] of [
    [-27, -19, 3.6, 3.8],
    [-9, -37, 5.5, 5.6],
    [16, -31, 3.6, 3.8],
    [31, -13, 4.0, 4.6],
    [36, 12, 3.2, 3.0],
    [-33, 6, 3.6, 3.4],
    [9, 33, 3.8, 3.2],
    [-18, 29, 3.2, 3.8]
  ].entries()) {
    const far = 0.2 + 0.3 * Math.min(1, Math.hypot(x, z) / 42);
    const rock = m.mix(0x596664, haze, far),
      lit = m.mix(0x8a938d, haze, far),
      green = m.mix(0x5c7c54, haze, far);
    for (let c = 0; c < 1 + (k % 3); c++) {
      const a0 = r.range(0, circle),
        cx = x + (c ? Math.cos(a0) * rad * 0.95 : 0),
        cz = z + (c ? Math.sin(a0) * rad * 0.75 : 0),
        cr = rad * (c ? r.range(0.4, 0.62) : 1),
        ch = h * (c ? r.range(0.35, 0.65) : 1);
      const n = 9,
        turn = r.range(0, circle),
        lean = r.range(-0.25, 0.25) * cr;
      const edge = Array.from(
        { length: n },
        (_, i) => r.range(0.8, 1.15) * (1 + 0.15 * Math.sin(i * 2 + turn))
      );
      let last;
      for (const [t, scale, col] of [
        [-0.12, 1.15, rock],
        [0.14, 1, rock],
        [0.42, 0.8, lit],
        [0.7, 0.56, green],
        [0.9, 0.3, green]
      ]) {
        const ring = edge.map((e, i) => {
          const a = (i * circle) / n + turn;
          return [
            cx + Math.cos(a) * cr * e * scale + lean * t,
            sea + t * ch + (hash(k * 7 + c, i) - 0.5) * ch * 0.08,
            cz + Math.sin(a) * cr * e * scale
          ];
        });
        if (last)
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            m.face([last.ring[i], ring[i], ring[j], last.ring[j]], [last.col, col, col, last.col]);
          }
        last = { ring, col };
      }
      const peak = [cx + lean, sea + ch, cz];
      for (let i = 0; i < n; i++) m.face([peak, last.ring[(i + 1) % n], last.ring[i]], green);
    }
  }
}

// The tiles that are this island's own, each drawn in its tile's frame. Pieces stand at the
// middle, so what grows on a walkable tile keeps to the back and the edges.
const tiles10 = {
  // 毛竹林: tall culms along the back of the tile, a new shoot, last year's leaves.
  bamboo(m, p, cell) {
    const r = m.rng,
      n = 4 + ((cell.x * 3 + cell.y * 5) % 3);
    for (let k = 0; k < n; k++) {
      const x = -0.42 + (0.84 * (k + r.range(0.2, 0.8))) / n;
      culm(
        m,
        x,
        0.02,
        r.range(-0.44, Math.abs(x) > 0.3 ? -0.1 : -0.27),
        r.range(0.95, 1.4),
        6,
        4,
        k % 2 === 0
      );
    }
    const sx = r.range(-0.3, 0.3);
    m.tube([sx, 0.02, -0.2], [sx + 0.01, 0.17, -0.2], 0.035, 0.004, 0x7b6548, 5);
    for (let k = 0; k < 3; k++) {
      const x = r.range(-0.4, 0.4),
        z = r.range(-0.4, 0.4),
        a = r.range(0, circle);
      m.leaf(
        [x, 0.04, z],
        [x + Math.cos(a) * 0.09, 0.042, z + Math.sin(a) * 0.09],
        0.016,
        0xc9b77c,
        0xb3a064,
        0.004
      );
    }
  },
  // 蛇簍竹籠: the cult's snake baskets, lidded; one has lost its lid and shows what it holds.
  crate(m, p, cell) {
    basket(m, -0.15, 0.03, -0.12, 1.3);
    basket(m, 0.25, 0.03, 0.14, 0.95, false);
    coil(m, 0.25, 0.39, 0.14, 0.13, SCALE[(cell.x + cell.y) % 3]);
    basket(m, 0.24, 0.03, -0.31, 0.7);
    // Its lid, leaning where it fell, and a carrying pole.
    m.frame(
      -0.2,
      0.05,
      0.33,
      0.4,
      1,
      () =>
        m.lathe(
          0,
          0,
          0,
          [
            [0, 0.21],
            [0.07, 0.1],
            [0.085, 0.0]
          ],
          0xb89a58,
          10
        ),
      -0.9
    );
    m.tube([-0.45, 0.06, 0.1], [0.42, 0.09, 0.42], 0.02, 0.018, AGED[1], 5);
  },
  // 海蝕礁岩: a stack of dark reef rock with the tide line on it.
  rock(m) {
    const r = m.rng;
    reef(m, -0.03, 0, -0.03, 0.4, r.range(0.72, 0.92), 0.33, 9);
    reef(m, 0.27, 0, 0.2, 0.17, 0.32, 0.14, 7);
    reef(m, -0.3, 0, 0.27, 0.12, 0.2, 0.1, 6, true);
  },
  // 礁岸矮石: low shore stones along the back, a tuft of grass in their lee.
  cover(m) {
    const r = m.rng;
    for (let k = 0; k < 4; k++) {
      const a = r.range(0.11, 0.17);
      reef(
        m,
        -0.33 + k * 0.21 + r.range(-0.03, 0.03),
        0,
        -0.29 + r.range(-0.06, 0.08),
        a,
        r.range(0.16, 0.3),
        a * r.range(0.75, 1),
        6,
        true
      );
    }
    reef(m, r.pick([-0.4, 0.4]), 0, r.range(0, 0.2), 0.09, 0.13, 0.08, 6, true);
    reeds(m, r.range(-0.2, 0.2), -0.44, 0.2, 4, false, 0.03);
  },
  // 雄黃藥圃: a bed of yellow-flowered herbs ringed round the standing place, lumps of
  // realgar at the back and its orange dust on the soil.
  herbs(m) {
    const r = m.rng;
    for (let j = 0; j < 9; j++) {
      const a = (j * circle) / 9 + 0.2,
        rad = 0.3 + r.range(-0.05, 0.07),
        x = Math.cos(a) * rad,
        z = Math.sin(a) * rad;
      for (let k = 0; k < 4; k++) {
        const b = (k * circle) / 4 + 0.44 * j,
          l = r.range(0.08, 0.14);
        m.leaf(
          [x, 0.04, z],
          [x + Math.cos(b) * l, 0.085 + l * 0.3, z + Math.sin(b) * l],
          l * 0.25,
          0x5f8a48,
          0x86a85a,
          0.03
        );
      }
      if (j % 3 !== 1) {
        const top = 0.15 + r.range(0, 0.05);
        m.tube([x, 0.05, z], [x, top, z], 0.007, 0.005, 0x6f8f4f, 4);
        for (let k = 0; k < 5; k++) {
          const b = (k * circle) / 5 + j;
          m.leaf(
            [x, top, z],
            [x + Math.cos(b) * 0.045, top + 0.012, z + Math.sin(b) * 0.045],
            0.02,
            0xf0b63a,
            0xe98a2c,
            0.006
          );
        }
      }
      const dx = Math.cos(a + 0.35) * (rad + 0.02),
        dz = Math.sin(a + 0.35) * (rad + 0.02);
      m.face(
        [
          [dx - 0.05, 0.038, dz],
          [dx, 0.038, dz + 0.035],
          [dx + 0.05, 0.038, dz],
          [dx, 0.038, dz - 0.035]
        ],
        0xd9772b,
        r.range(0.85, 1.05)
      );
    }
    for (const [x, z, s] of [
      [-0.38, -0.38, 1],
      [-0.29, -0.42, 0.7],
      [0.39, -0.4, 0.8]
    ])
      m.crystal(x, 0.03, z, 0.05 * s, 0.11 * s, 0xc8502a, 0xf09a3a, 5, 0.01);
  },
  // 蛇草淺沼: tussocks of coarse snake grass at the edges of the shallows, duckweed between
  // them; here and there a swimmer.
  reeds(m, p, cell) {
    const r = m.rng;
    for (const [x, z, tall, blades] of [
      [-0.34, -0.36, 0.42, 6],
      [0.05, -0.43, 0.3, 4],
      [0.36, -0.32, 0.36, 5],
      [-0.42, 0.08, 0.26, 4],
      [0.42, 0.3, 0.24, 4]
    ])
      tussock(m, x + r.range(-0.03, 0.03), -0.02, z + r.range(-0.03, 0.03), tall, blades);
    for (let k = 0; k < 5; k++) {
      const a = r.range(0, circle),
        x = Math.cos(a) * r.range(0.32, 0.45),
        z = Math.sin(a) * r.range(0.32, 0.45),
        size = r.range(0.025, 0.05);
      m.face(
        Array.from({ length: 6 }, (_, j) => [
          x + Math.cos((-j * circle) / 6) * size,
          -0.001,
          z + Math.sin((-j * circle) / 6) * size
        ]),
        0x8fb46a,
        r.range(0.9, 1.05)
      );
    }
    if ((cell.x + cell.y * 2) % 3 === 0)
      snake(m, 0.12, -0.012, -0.24, r.range(0, circle), 0.36, SCALE[0]);
  }
};

function landform10(T, layout) {
  const group = new T.Group();
  group.name = '神龍竹堂';
  const isle = makeIsland(layout);
  const sand = new Model(T, 100101);
  ground(sand, isle);
  const shore = sand.finish('神龍島沙岸', { cast: false });
  soften(shore, isle);
  const beach = new Model(T, 100102);
  strand(beach, isle);
  const hall = new Model(T, 100103);
  hall.frame(0, 0, hallZ, 0, 1, () => {
    bambooHall(hall);
    // The master's yellow banner flies from a staff lashed to the ridge.
    dragonBanner(hall, 0, 4.9, -4.42, 2.5, BANNERS.yellow, 1, 0.8);
  });
  const flags = new Model(T, 100104);
  standards(flags, isle);
  const north = new Model(T, 100105);
  grove(north, isle, (x, z) => z < -5.6, 165, 16);
  const west = new Model(T, 100106);
  grove(west, isle, (x, z) => z >= -5.6, 85, 10);
  const far = new Model(T, 100107);
  farIslets(far);
  group.add(
    shore,
    beach.finish('礁石浮木與舢舨'),
    hall.finish('神龍大竹堂', { occluder: true }),
    flags.finish('五色龍旗與蛇柱', { occluder: true }),
    north.finish('島北竹林', { occluder: true }),
    west.finish('島西竹林', { occluder: true }),
    far.finish('遠海霧島', { distant: true, cast: false })
  );
  return group;
}

export { landform10, tiles10 };
