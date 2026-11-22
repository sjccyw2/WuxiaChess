// 西夏夜苑's own paving for the board: every dry tile is laid as a dressed court of 青石 and
// marble. A ring of border stones (four corner blocks and four kerbs) frames two or four large
// slabs; the slabs along the hall's axis are carved 御路 stones with a flat inlaid medallion, and
// the apron before the steps is a darker slate so the figure standing there reads against it.
// The colour of every corner is worked out from where it lies: polished paler where feet have
// passed, cool blue in the open, and warm in a pool round each of the board's lamp pillars.
import { circle } from '../scenery-kit.js';
import { fieldCells } from '../../data/terrain.js';

const TOP = 0.04; // the board's top
const BED = 0.024; // the mortar showing in the joints
const BEVEL = 0.008;
const stone = 0x6f7c90; // 青石 under the night sky
const stoneLight = 0x8a96a8;
const kerb = 0x6a778b;
const slateDark = 0x434d60; // the apron before the hall steps
const inlay = 0xb3b2ad; // white marble set in the axis stones
const inlayDark = 0x77808d;
const mortar = 0x3a4252;

// The board's own facts: its size, its walkable tiles, and its lamp pillars.
const cells = fieldCells(13);
const width = Math.max(...cells.map((c) => c.x)) + 1,
  height = Math.max(...cells.map((c) => c.y)) + 1;
const walk = new Set(cells.map((c) => c.x + ',' + c.y));
const lamps = cells
  .filter((c) => c.kind === 'rock')
  .map((c) => [c.x - (width - 1) / 2, c.y - (height - 1) / 2]);
const axis = (width - 1) / 2;

// Light on the paving at a point of the board (world x, z): returns an [r, g, b] multiplier.
function light(x, z) {
  let g = 0;
  for (const [lx, lz] of lamps) {
    const d2 = (x - lx) ** 2 + (z - lz) ** 2 + 0.36;
    if (d2 < 6) g += Math.exp(-d2 / 1.25);
  }
  g = Math.min(1, g * 0.9);
  // Cool in the open; warm, and a little brighter, under the lamps.
  return [0.92 + 1.25 * g, 0.95 + 0.72 * g, 1.04 - 0.14 * g];
}
// Wear: the stone is paler and smoother along the middle of the court and the axis.
function wear(x, z) {
  const across = Math.exp(-((x * 0.22) ** 2)) * 0.06,
    middle = Math.exp(-((x * 0.9) ** 2 + ((z - 0.5) * 0.18) ** 2)) * 0.05;
  return 1 + across + middle;
}

function tone(m, col, x, z, k) {
  const c = m.rgb(col),
    l = light(x, z),
    w = wear(x, z);
  return [c[0] * l[0] * w * k, c[1] * l[1] * w * k, c[2] * l[2] * w * k];
}
// One dressed stone over the footprint [x0, x1] by [z0, z1] of the tile's frame, its top bevelled
// down to the joint. `wx`, `wz` place the tile in the world so its colours can be lit.
function block(m, x0, x1, z0, z1, col, wx, wz, k = 1, top = TOP) {
  const b = Math.min(BEVEL, (x1 - x0) * 0.2, (z1 - z0) * 0.2),
    lo = top - BEVEL * 1.1;
  const foot = [
    [x0, lo, z0],
    [x0, lo, z1],
    [x1, lo, z1],
    [x1, lo, z0]
  ];
  const cap = [
    [x0 + b, top, z0 + b],
    [x0 + b, top, z1 - b],
    [x1 - b, top, z1 - b],
    [x1 - b, top, z0 + b]
  ];
  const at = (p, f = 1) => tone(m, col, wx + p[0], wz + p[2], k * f);
  m.face(cap, cap.map((p) => at(p)));
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    m.face(
      [foot[i], foot[j], cap[j], cap[i]],
      [at(foot[i], 0.8), at(foot[j], 0.8), at(cap[j], 0.92), at(cap[i], 0.92)]
    );
  }
}
// A flat medallion inlaid in a slab: a ring of cloud-scroll petals round a round boss, all in
// one plane a hair above the slab, so it reads as colour and never as a bump under the pieces.
function medallion(m, wx, wz, r, col) {
  const y = TOP + 0.0035,
    n = 12,
    ring = [],
    inner = [];
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n;
    ring.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    inner.push([Math.cos(a) * r * 0.78, y + 0.0004, Math.sin(a) * r * 0.78]);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n,
      a = ((i + 0.5) * circle) / n;
    // The outer band, and a petal standing out from it between each pair of spokes.
    m.face([ring[i], ring[j], inner[j], inner[i]], tone(m, col, wx, wz, 0.95));
    m.face(
      [ring[i], [Math.cos(a) * r * 1.32, y, Math.sin(a) * r * 1.32], ring[j]],
      tone(m, col, wx, wz, 0.88)
    );
  }
  m.face(
    inner.map(([x, , z]) => [x, y + 0.0004, z]),
    tone(m, inlayDark, wx, wz, 1)
  );
  const boss = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * circle) / 8;
    boss.push([Math.cos(a) * r * 0.36, y + 0.0009, Math.sin(a) * r * 0.36]);
  }
  m.face(boss, tone(m, col, wx, wz, 1.05));
}

// The ground hook: lays the whole tile and returns true.
function paveTile(m, p, cell) {
  const wx = cell.x - (width - 1) / 2,
    wz = cell.y - (height - 1) / 2,
    r = m.rng,
    apron = cell.y <= 2 && Math.abs(cell.x - axis) <= 1,
    onAxis = cell.x === axis && !apron,
    base = apron ? slateDark : stone,
    edge = apron ? m.mix(slateDark, mortar, 0.25) : kerb;
  // The mortar bed under the joints.
  m.face(
    [
      [-0.5, BED, -0.5],
      [-0.5, BED, 0.5],
      [0.5, BED, 0.5],
      [0.5, BED, -0.5]
    ],
    mortar
  );
  // Where the tile is the board's edge, a dressed face goes down to the shelf.
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    if (walk.has(cell.x + dx + ',' + (cell.y + dz))) continue;
    const ax = dx ? dx * 0.5 : -0.5,
      bx = dx ? dx * 0.5 : 0.5,
      az = dz ? dz * 0.5 : -0.5,
      bz = dz ? dz * 0.5 : 0.5;
    const pts = [
      [ax, -0.05, az],
      [bx, -0.05, bz],
      [bx, TOP - 0.012, bz],
      [ax, TOP - 0.012, az]
    ];
    m.face(pts, tone(m, edge, wx + dx * 0.5, wz + dz * 0.5, 0.75));
  }
  // The frame: four corner blocks and four kerbs between them.
  const o = 0.496,
    w = 0.085,
    j = 0.006,
    shade = (k) => k * (0.94 + r.next() * 0.1);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const x0 = sx < 0 ? -o : o - w,
        z0 = sz < 0 ? -o : o - w;
      block(m, x0, x0 + w, z0, z0 + w, edge, wx, wz, shade(0.96));
    }
  for (const s of [-1, 1]) {
    const z0 = s < 0 ? -o : o - w,
      x0 = s < 0 ? -o : o - w;
    block(m, -o + w + j, o - w - j, z0, z0 + w, edge, wx, wz, shade(1));
    block(m, x0, x0 + w, -o + w + j, o - w - j, edge, wx, wz, shade(1));
  }
  // The field inside the frame.
  const f = o - w - j;
  if (onAxis) {
    // 御路: one great slab carved with a medallion.
    block(m, -f, f, -f, f, m.mix(stone, stoneLight, 0.35), wx, wz, shade(1));
    medallion(m, wx, wz, 0.17, inlay);
    return true;
  }
  const split = (cell.x + cell.y) % 2,
    four = !apron && r.next() < 0.3,
    tint = () => m.mix(base, apron ? 0x515c70 : stoneLight, r.next() * 0.5);
  if (four)
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const x0 = sx < 0 ? -f : j / 2,
          z0 = sz < 0 ? -f : j / 2;
        block(m, x0, x0 + f - j / 2, z0, z0 + f - j / 2, tint(), wx, wz, shade(1));
      }
  else
    for (const s of [-1, 1]) {
      const a = s < 0 ? -f : j / 2,
        b = s < 0 ? -j / 2 : f;
      if (split) block(m, a, b, -f, f, tint(), wx, wz, shade(1));
      else block(m, -f, f, a, b, tint(), wx, wz, shade(1));
    }
  return true;
}

export { paveTile };
