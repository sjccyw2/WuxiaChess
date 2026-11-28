// 萬安寺's paving for the board: every dry tile of the raised court is laid in temple 青磚.
// A frame of dressed 青石 kerbs marks the tile; inside it the bricks are laid in a basket weave,
// each square of three bricks turned against its neighbours. Down the middle of the court, from
// the 山門 side to the pagoda steps, runs the 甬道 of great stone slabs, and the slab before the
// steps is carved with a lotus. The colour of every corner is worked out from where it lies:
// worn paler along the way feet have gone, cool blue in the open, warm round each burner.
import { circle } from '../scenery-kit.js';
import {
  CX,
  CZ,
  TOP,
  onBoard,
  lampLight,
  lit,
  put,
  brick,
  brickLight,
  mortar,
  stone,
  stoneLight
} from './kit-17.js';
import { fallenLeaves, puddle, crack } from './flora-17.js';

const BED = 0.024; // the mortar showing in the joints
const BEVEL = 0.007;
const kerb = 0x667082;
const moss = 0x2d3d36;
// Tiles where the evening's rain still stands in a shallow puddle.
const PUDDLES = new Set(['3,5', '8,8', '4,10', '10,3']);

// What lies on the paving: ginkgo leaves blown in from the court (thicker toward the north,
// under the trees), a crack here and there, and the puddles.
function litter(m, cell) {
  const r = m.rng;
  if (PUDDLES.has(cell.x + ',' + cell.y))
    lit(m, () => puddle(m, r.range(-0.1, 0.1), r.range(-0.1, 0.1), 0.3, 0.22, TOP, true));
  if (r.next() < (cell.y < 5 ? 0.6 : 0.32))
    lit(m, () => fallenLeaves(m, r.range(-0.15, 0.15), r.range(-0.15, 0.15), 0.42, 2 + Math.floor(r.next() * 4), TOP));
  if (r.next() < 0.2) crack(m, r.range(-0.3, 0.3), r.range(-0.3, 0.3), 0.45, TOP);
}

// Wear: paler along the middle of the court and the way to the pagoda.
function wear(x, z) {
  return 1 + Math.exp(-((x * 0.5) ** 2)) * 0.07 + Math.exp(-((x * 0.16) ** 2)) * 0.04;
}
function tone(m, col, x, z, k) {
  const c = m.rgb(col),
    g = lampLight(x, 0.04, z),
    w = wear(x, z) * k;
  return [c[0] * (0.8 + 1.95 * g) * w, c[1] * (0.84 + 1.15 * g) * w, c[2] * (1.0 + 0.12 * g) * w];
}
// One dressed stone or brick over [x0, x1] by [z0, z1] of the tile's frame, its top bevelled
// down to the joint. `wx`, `wz` place the tile on the board so its colours can be lit.
function block(m, x0, x1, z0, z1, col, wx, wz, k = 1, top = TOP) {
  const b = Math.min(BEVEL, (x1 - x0) * 0.2, (z1 - z0) * 0.2),
    lo = top - BEVEL * 1.3;
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
  m.face(
    cap,
    cap.map((p) => at(p))
  );
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    m.face(
      [foot[i], foot[j], cap[j], cap[i]],
      [at(foot[i], 0.78), at(foot[j], 0.78), at(cap[j], 0.92), at(cap[i], 0.92)]
    );
  }
}
// A lotus carved flat into the slab before the pagoda steps: petals round a seed pod.
function lotus(m, wx, wz, r) {
  const y = TOP + 0.003;
  for (const [n, k, turn, f] of [
    [12, 1, 0, 0.82],
    [8, 0.7, 0.2, 0.95]
  ])
    for (let i = 0; i < n; i++) {
      const a = (i * circle) / n + turn,
        w = (circle / n) * 0.42;
      const p = (rr, da) => [Math.cos(a + da) * rr, y + k * 0.0004, Math.sin(a + da) * rr];
      m.face(
        [p(r * k * 0.3, 0), p(r * k * 0.7, w), p(r * k, 0), p(r * k * 0.7, -w)],
        tone(m, i % 2 ? stoneLight : 0x9aa1ad, wx, wz, f)
      );
    }
  const pod = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * circle) / 10;
    pod.push([Math.cos(a) * r * 0.26, y + 0.001, Math.sin(a) * r * 0.26]);
  }
  put(m, pod, tone(m, 0x7d8594, wx, wz, 1));
}

// The ground hook: lays the whole tile and returns true. The pagoda's plinth covers its tiles.
function paveTile(m, p, cell) {
  if (cell.kind === 'rock') return true;
  const wx = cell.x - CX,
    wz = cell.y - CZ,
    r = m.rng,
    way = cell.x === CX && cell.y >= 2;
  m.face(
    [
      [-0.5, BED, -0.5],
      [-0.5, BED, 0.5],
      [0.5, BED, 0.5],
      [0.5, BED, -0.5]
    ],
    mortar
  );
  // Where the tile is the board's edge, a dressed face goes down to the masonry below.
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    if (onBoard(cell.x + dx, cell.y + dz)) continue;
    const ax = dx ? dx * 0.5 : -0.5,
      bx = dx ? dx * 0.5 : 0.5,
      az = dz ? dz * 0.5 : -0.5,
      bz = dz ? dz * 0.5 : 0.5;
    m.face(
      [
        [ax, -0.06, az],
        [bx, -0.06, bz],
        [bx, TOP - 0.01, bz],
        [ax, TOP - 0.01, az]
      ],
      tone(m, kerb, wx + dx * 0.5, wz + dz * 0.5, 0.7)
    );
  }
  const o = 0.496,
    w = 0.075,
    j = 0.006,
    shade = (k) => k * (0.93 + r.next() * 0.12);
  // The kerb frame: four corner blocks and four kerbs.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const x0 = sx < 0 ? -o : o - w,
        z0 = sz < 0 ? -o : o - w;
      block(m, x0, x0 + w, z0, z0 + w, kerb, wx, wz, shade(0.92));
    }
  for (const s of [-1, 1]) {
    const z0 = s < 0 ? -o : o - w,
      x0 = s < 0 ? -o : o - w;
    block(m, -o + w + j, o - w - j, z0, z0 + w, kerb, wx, wz, shade(1));
    block(m, x0, x0 + w, -o + w + j, o - w - j, kerb, wx, wz, shade(1));
  }
  const f = o - w - j;
  if (way) {
    // 甬道: great slabs of 青石, the one before the steps carved with a lotus.
    if (cell.y === 2) {
      block(m, -f, f, -f, f, m.mix(stone, stoneLight, 0.3), wx, wz, shade(1.02));
      lotus(m, wx, wz, 0.3);
    } else
      for (const s of [-1, 1]) {
        const a = s < 0 ? -f : j / 2,
          b = s < 0 ? -j / 2 : f;
        block(m, -f, f, a, b, m.mix(stone, stoneLight, r.next() * 0.4), wx, wz, shade(1));
      }
    litter(m, cell);
    return true;
  }
  // Basket weave: four squares of three bricks, each turned against its neighbours.
  const half = f,
    turn = (cell.x + cell.y) % 2;
  for (let qx = 0; qx < 2; qx++)
    for (let qz = 0; qz < 2; qz++) {
      const x0 = qx ? j / 2 : -half,
        x1 = qx ? half : -j / 2,
        z0 = qz ? j / 2 : -half,
        z1 = qz ? half : -j / 2,
        across = (qx + qz + turn) % 2;
      for (let b = 0; b < 3; b++) {
        const t0 = b / 3,
          t1 = (b + 1) / 3,
          worn = r.next(),
          col = worn < 0.06 ? m.mix(brick, mortar, 0.35) : m.mix(brick, brickLight, worn * 0.6);
        if (across)
          block(
            m,
            x0,
            x1,
            z0 + (z1 - z0) * t0 + j / 2,
            z0 + (z1 - z0) * t1 - j / 2,
            col,
            wx,
            wz,
            shade(1)
          );
        else
          block(
            m,
            x0 + (x1 - x0) * t0 + j / 2,
            x0 + (x1 - x0) * t1 - j / 2,
            z0,
            z1,
            col,
            wx,
            wz,
            shade(1)
          );
      }
    }
  // Moss in the joints along the court's quiet edges, away from the way.
  if (Math.abs(wx) > 3.5 && r.next() < 0.45)
    for (let k = 0; k < 3; k++) {
      const x = r.range(-0.42, 0.42),
        z = r.next() < 0.5 ? -0.003 : r.range(-0.42, 0.42);
      m.face(
        [
          [x - 0.05, TOP + 0.001, z - 0.006],
          [x - 0.05, TOP + 0.001, z + 0.006],
          [x + 0.05, TOP + 0.001, z + 0.006],
          [x + 0.05, TOP + 0.001, z - 0.006]
        ],
        tone(m, moss, wx, wz, 1)
      );
    }
  litter(m, cell);
  return true;
}

export { paveTile };
