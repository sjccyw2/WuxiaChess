import { Model, circle, midway } from './scenery-kit.js';
import { banners, cargo, lantern, rail, reeds, roof } from './maze-models.js';
import { landmarks } from './maze-landmarks.js';
import { mapleScrub } from './landforms/country-1.js';
import { setting } from './maze-atmosphere.js';
import { armsChest, bramble, breastwork, paving, ruinTile } from './landforms/siege-6.js';
import { mapLayout } from '../data/terrain.js';
import { hewnSide, iceTile, snowTile } from './landforms/shelf-3.js';
import { pavilionCrag } from './landforms/crags-3.js';
import { peaks3 } from './landforms/peaks-3.js';
import { farMarsh } from './landforms/distance-2.js';
import { tiles10 } from './landforms/landform-10.js';
import { tiles11 } from './landforms/landform-11.js';
import { tiles12 } from './landforms/landform-12.js';
import { tiles13 } from './landforms/landform-13.js';
import { tiles14 } from './landforms/landform-14.js';
import { tiles16 } from './landforms/landform-16.js';
import { tiles17 } from './landforms/landform-17.js';
import { tiles18 } from './landforms/landform-18.js';
import { tiles19 } from './landforms/landform-19.js';

const stonework = [
  null,
  [0x8c8478, 0xb0a593, 0x6b665c, 0x80786b, 0xa69a7c, 0x79856f],
  [0x788669, 0xa5aa82, 0x606d59, 0x748366, 0xb9b28b, 0x54857b],
  [0xb8c7ca, 0xe4e5d7, 0x5a646b, 0x7c8589, 0xd0dcd7, 0x7fa2ae],
  [0x929c91, 0xb5bca3, 0x6c7a70, 0x86937f, 0xbba679, 0x819a93],
  [0x9a9b83, 0xc2b29c, 0x737a68, 0x839077, 0xcbac80, 0x829989],
  [0x8b887f, 0xa29d91, 0x57544d, 0x6c6558, 0x8f8a7e, 0x5d6763],
  [0x728e89, 0x9ab6a1, 0x4e6468, 0x5d7475, 0x9abaa3, 0x4f8b86],
  [0x939aa8, 0xc4beb1, 0x6c7586, 0x898c98, 0xc8ad84, 0x8295ad],
  [0x4d606a, 0x778381, 0x394954, 0x475b61, 0xd0ad6a, 0x527f82],
  [0x9a9a7a, 0xc4b98e, 0x66705a, 0x7f8a6a, 0xb9a878, 0x4f8a80], // 神龍竹堂: sand and sea grass
  [0x8f8a76, 0xb3a98c, 0x69685a, 0x7d7c68, 0xb98f7a, 0x5a8a7c], // 絕情花徑: warm valley stone
  [0x8a8780, 0xaaa596, 0x5c5d58, 0x74746a, 0x9c917c, 0x4f8791], // 鐵掌溪灘: river rock
  [0x5d6b80, 0x8792a0, 0x3e4860, 0x4f5a70, 0xc9a560, 0x3f6f86], // 西夏夜苑: palace marble by lantern
  [0x9b958c, 0xc2b8a6, 0x6e6b66, 0x868078, 0xb8947e, 0x6f9aa0], // 黑木繡閣: garden paths
  [0x8a9a8e, 0xa9b5a3, 0x566159, 0x6f7d73, 0xb9b28b, 0x4f867f], // 谷底棋臺: valley stone and moss
  [0x8e8a80, 0xb0aa9c, 0x5e5c56, 0x77746a, 0xa89a7c, 0x55786e], // 石樑溫家: grey brick and old stone
  [0x5e6272, 0x878b98, 0x3d4150, 0x50566a, 0xc39a5c, 0x40566a], // 萬安寺: temple brick by lamplight
  [0x9a968e, 0xbab4a8, 0x66635d, 0x86827a, 0xa9a397, 0x7f98a6], // 光明頂: summit granite
  [0x7c8580, 0x9da59c, 0x4e5753, 0x66706a, 0xa8a088, 0x3f6f74] // 俠客島: cave stone and sea
];
// The boards built round one villain (10 on) borrow the tile language of an earlier board (how
// its ground, sides and rims are cut) and dress the tiles that are theirs alone through their own
// landform module: { plain, cover, bamboo, herbs, rock, crate, reeds }, each (m, p, cell) drawn in
// the tile's own frame after its ground, and `ground` (m, p, cell), which may lay a dry tile's
// ground itself (it returns true when it has). Their palette, depth, surroundings and landmarks
// are their own.
const LOOKS = { 10: 2, 11: 1, 12: 2, 13: 8, 14: 1, 16: 8, 17: 6, 18: 6, 19: 6 };
const OWN_TILES = { 10: tiles10, 11: tiles11, 12: tiles12, 13: tiles13, 14: tiles14, 16: tiles16, 17: tiles17, 18: tiles18, 19: tiles19 };
const lookOf = (index) => LOOKS[index] ?? index;
const directions = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
];
const landDepth = [0, 1.18, 1.04, 3.67, 2.83, 1.27, 1.64, 1.75, 3.09, 2.32, 1.1, 1.3, 1.0, 1.6, 3.2, 0.3, 1.0,0.5, 1.0, 1.4];
// Each side is measured in local coordinates. The first and last point of
// every course meet the neighbouring side even along a re-entrant corner.
function exposedSide(m, index, p, cell, salt, depth = landDepth[index]) {
  if (index === 3) return hewnSide(m, cell, salt, depth);
  const r = m.rng;
  const masonry = [1, 4, 6, 8, 9].includes(index);
  const levels = masonry
    ? [
        [-0.056, 0.045],
        [-0.145, 0.06],
        [-0.19, 0.026],
        [-0.25, 0.042],
        [-0.31, 0.017],
        [-depth * 0.57, 0.024],
        [-depth * 0.63, 0.04],
        [-depth, 0.012]
      ]
    : [
        [-0.055, 0.045],
        [-0.17, 0.09],
        [-depth * 0.31, 0.115],
        [-depth * 0.48, 0.021],
        [-depth * 0.58, 0.062],
        [-depth * 0.79, 0.041],
        [-depth, 0.085]
      ];
  const cols = masonry ? 3 : 4;
  const top = cell.kind === 'reeds' ? -0.136 : -0.055;
  const rings = levels.map(([height, spread], j) =>
    Array.from({ length: cols + 1 }, (_, k) => {
      const x = k / cols - 0.5,
        end = k === 0 || k === cols;
      const grain = end ? 0 : Math.sin(salt * 0.23 + k * 2.13 + j * 0.67);
      const y = j === 0 ? top : Math.min(top - 0.03, height + (masonry ? 0 : grain * 0.033));
      return [x, y, end ? 0 : spread + grain * (masonry ? 0.007 : 0.023)];
    })
  );
  const inner = rings[0].map(([x, y]) => [x, y, -0.02]);
  for (let k = 0; k < cols; k++)
    m.face([inner[k], rings[0][k], rings[0][k + 1], inner[k + 1]], p[3]);
  for (let j = 0; j < rings.length - 1; j++)
    for (let k = 0; k < cols; k++) {
      const hi = rings[j],
        lo = rings[j + 1];
      const faceTone =
        j === 0
          ? m.mix(p[0], p[3], 0.62)
          : j === 2 && masonry
            ? m.mix(p[4], p[3], 0.54)
            : m.mix(p[2], p[3], 0.25 + 0.19 * Math.sin(salt * 0.61 + k * 1.76 + j * 2.16));
      const shade = 1 - Math.min(0.36, j * 0.048);
      m.face([hi[k], lo[k], lo[k + 1], hi[k + 1]], faceTone, shade);
    }
  if (cell.kind === 'reeds' || index === 2) {
    if (salt % 4 === 0)
      reeds(m, r.range(-0.28, 0.28), 0.12, r.range(0.16, 0.48), 6, index === 2, -0.29);
    if (salt % 3 === 0) m.rock(0.16, -0.62, 0.135, 0.115, 0.31, 0.12, p[2], p[3], 7);
  } else if (index === 3) {
    if (salt % 3 === 0)
      for (const x of [-0.26, 0.02, 0.29])
        m.frame(
          x,
          -0.19,
          0.085,
          0,
          1,
          () => {
            m.crystal(
              0,
              0,
              0,
              r.range(0.038, 0.083),
              r.range(0.27, 0.74),
              0x83a9be,
              0xcce4e7,
              6,
              0.05
            );
          },
          0,
          Math.PI
        );
    if (salt % 4 === 0) m.rock(-0.15, -0.79, 0.09, 0.21, 0.33, 0.12, p[2], 0xb8c9d2, 7);
  } else if (index === 4 || index === 8 || index === 9) {
    m.box(0, -0.17, 0.056, 0.99, 0.032, 0.036, p[4]);
    if (salt % 3 === 0) m.box(0, -0.274, 0.066, 0.18, 0.16, 0.052, m.mix(p[4], p[0], 0.22));
    if (index === 9) {
      for (const x of [-0.31, 0.31])
        m.frame(x, -0.38, 0.058, 0, 1, () =>
          m.tube([0, 0, 0], [0, 0, 0.067], 0.044, 0.038, p[4], 9)
        );
      if (salt % 3 === 1)
        m.glow(() =>
          m.line(
            [
              [-0.3, -0.6, 0.075],
              [-0.11, -0.55, 0.087],
              [0.11, -0.67, 0.074],
              [0.37, -0.6, 0.086]
            ],
            0.016,
            0x82a49b,
            5
          )
        );
    } else if (index === 8 && salt % 3 === 0) {
      m.tube([0, -0.29, 0.054], [0.015, -0.86, 0.085], 0.014, 0.012, 0x9e8d72, 6);
      m.lathe(
        0.015,
        -0.99,
        0.085,
        [
          [0, 0.077],
          [0.055, 0.084],
          [0.14, 0.042]
        ],
        0xc3a883,
        9
      );
    }
  } else if (index === 6 || index === 1) {
    for (let k = 0; k < 2; k++) {
      const x = (k - 0.5) * 0.47 + (salt % 2 ? 0.048 : -0.036);
      m.box(
        x,
        -0.37,
        0.043,
        0.409,
        0.155,
        0.066,
        m.mix(p[2], p[0], 0.31 + 0.16 * ((k + salt) % 3))
      );
      if (index === 6) m.box(x + 0.054, -0.62, 0.043, 0.38, 0.16, 0.054, m.mix(p[2], p[3], 0.45));
    }
    if (index === 1 && salt % 7 === 1) reeds(m, 0.07, 0.09, 0.24, 7, false, -0.18);
  } else if (index === 7) {
    if (salt % 3 === 0)
      m.glow(() => m.crystal(-0.16, -0.57, 0.1, 0.073, 0.29, 0x5e958c, 0xa5cfbb, 6, 0.08));
    if (salt % 2 === 0)
      m.line(
        [
          [-0.36, -0.27, 0.071],
          [-0.14, -0.36, 0.095],
          [0.06, -0.34, 0.084],
          [0.34, -0.55, 0.079]
        ],
        0.013,
        0x77a296,
        5
      );
  } else if (index === 5 && salt % 4 === 0) {
    m.rock(0.13, -0.39, 0.095, 0.19, 0.26, 0.12, p[2], 0x8d9b75, 7);
    if (salt % 8 === 0) shrub(m, -0.14, -0.19, 0.09, 0.29, [0x65825d, 0x8a9d70], true);
  }
}
// A playable bridge has a deck and open air or water below it. Every other
// actual tile contributes one top; walls are emitted only along exposed sides.
function shapedShelf(m, index, p, layout, depth = landDepth[index]) {
  // 桃花石陣 lays its own ground and well shaft in landforms/landform-5.js.
  if (index === 5) return;
  // 谷底棋臺 is one slab of stone, cut and edged in landforms/table-15.js.
  if (index === 15) return;
  const { width, height, cells, mask } = layout;
  const cx = (width - 1) / 2,
    cz = (height - 1) / 2;
  const decks = new Set(cells.filter((c) => c.kind === 'bridge').map((c) => c.y * width + c.x));
  for (const cell of cells) {
    if (cell.kind === 'bridge') continue;
    const x = cell.x - cx,
      z = cell.y - cz,
      y = cell.kind === 'reeds' ? -0.136 : -0.055;
    m.face(
      [
        [x - 0.5, y, z - 0.5],
        [x - 0.5, y, z + 0.5],
        [x + 0.5, y, z + 0.5],
        [x + 0.5, y, z - 0.5]
      ],
      p[3]
    );
    for (let n = 0; n < directions.length; n++) {
      const [dx, dz] = directions[n],
        tx = cell.x + dx,
        tz = cell.y + dz;
      if (mask[tz]?.[tx] === '#' && !decks.has(tz * width + tx)) continue;
      const salt = 31 * cell.x + 53 * cell.y + n * 17 + index;
      m.frame(x + dx * 0.5, 0, z + dz * 0.5, Math.atan2(dx, dz), 1, () =>
        exposedSide(m, index, p, cell, salt, depth)
      );
    }
  }
}
function rimInlay(m, index, p, layout) {
  const { width, height, mask, cells } = layout,
    cx = (width - 1) / 2,
    cz = (height - 1) / 2;
  const formal = [4, 6, 8, 9].includes(index);
  for (const cell of cells) {
    if (cell.kind === 'bridge' || cell.kind === 'reeds') continue;
    for (let side = 0; side < directions.length; side++) {
      const [dx, dz] = directions[side];
      if (mask[cell.y + dz]?.[cell.x + dx] === '#') continue;
      const x = cell.x - cx + dx * 0.5,
        z = cell.y - cz + dz * 0.5,
        salt = cell.x * 17 + cell.y * 29 + side;
      m.frame(x, 0, z, Math.atan2(dx, dz), 1, () => {
        const tone = formal ? p[4] : m.mix(p[4], p[0], 0.39);
        m.box(0, 0.044, -0.018, 0.985, 0.016, formal ? 0.036 : 0.026, tone);
        if (formal && salt % 2 === 0) {
          for (const v of [-0.32, 0.27]) m.box(v, 0.053, -0.058, 0.073, 0.007, 0.035, tone);
        } else if ((index === 1 || index === 5) && salt % 3 === 0) {
          const c = index === 5 ? 0xd0a89f : 0xba6c47;
          for (let k = 0; k < 3; k++) {
            const xx = -0.31 + k * 0.21 + Math.sin((salt + k) * 2.648) * 0.07,
              zz = -0.075 - 0.054 * k;
            m.leaf([xx, 0.049, zz], [xx + 0.073, 0.051, zz + 0.038], 0.024, c, c, 0.005);
          }
        }
      });
    }
  }
}

function innerWaterAndStars(m, index, layout) {
  if (index !== 5 && index !== 9) return;
  const { width, height, mask } = layout;
  const air = new Set();
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) if (mask[y][x] !== '#') air.add(y * width + x);
  const exterior = [],
    seen = new Set();
  for (const k of air) {
    const x = k % width,
      y = Math.floor(k / width);
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      seen.add(k);
      exterior.push(k);
    }
  }
  for (let i = 0; i < exterior.length; i++) {
    const k = exterior[i],
      x = k % width,
      y = Math.floor(k / width);
    for (const [dx, dz] of directions) {
      const xx = x + dx,
        yy = y + dz,
        kk = yy * width + xx;
      if (xx >= 0 && xx < width && yy >= 0 && yy < height && air.has(kk) && !seen.has(kk)) {
        seen.add(kk);
        exterior.push(kk);
      }
    }
  }
  const cx = (width - 1) / 2,
    cz = (height - 1) / 2;
  for (const k of air) {
    if (seen.has(k)) continue;
    const x = (k % width) - cx,
      z = Math.floor(k / width) - cz;
    if (index === 5) {
      // The well's deep water is drawn with its shaft in landforms/landform-5.js.
    } else if (k % 4 === 1) {
      const a = [x, -3.3 - 0.29 * Math.sin(k), z],
        b = [x + 0.41, a[1] + 0.063, z - 0.23];
      m.glow(() => {
        m.crystal(...a, 0.039, 0.078, 0x97b4b3, 0xd5c78e, 6);
        m.crystal(...b, 0.022, 0.045, 0xaab9b8, 0xefddb1, 5);
        m.line([a, b], 0.007, 0x738b9c, 4);
      });
    }
  }
}
function slate(m, x, z, w, d, top, base, hi = 0.04, cut = 0.06) {
  cut = Math.min(cut, w * 0.13, d * 0.15);
  const a = w / 2,
    b = d / 2;
  const p = [
    [-a + cut, -b],
    [-a, -b + cut],
    [-a, b - cut],
    [-a + cut, b],
    [a - cut, b],
    [a, b - cut],
    [a, -b + cut],
    [a - cut, -b]
  ];
  const low = p.map(([u, v]) => [x + u, -0.05, z + v]),
    rim = p.map(([u, v]) => [x + u, hi - 0.014, z + v]),
    cap = p.map(([u, v]) => [x + u * 0.987, hi, z + v * 0.983]);
  m.face(cap, top);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    m.face([rim[i], rim[j], cap[j], cap[i]], m.mix(top, base, 0.24));
    m.face([low[i], low[j], rim[j], rim[i]], base);
  }
}
function puddle(m, x, z, index, p, bridge) {
  if (index === 3 && !bridge) return iceTile(m, x, z);
  const col = p[5],
    dark = m.mix(col, p[2], 0.3);
  if (!bridge) {
    m.face(
      [
        [x - 0.502, -0.012, z - 0.502],
        [x - 0.502, -0.012, z + 0.502],
        [x + 0.502, -0.012, z + 0.502],
        [x + 0.502, -0.012, z - 0.502]
      ],
      [m.rgb(col), m.rgb(dark), m.rgb(col), m.rgb(dark)]
    );
    for (let i = 0; i < 6; i++) {
      const xx = x + m.rng.range(-0.39, 0.29),
        zz = z + m.rng.range(-0.46, 0.47),
        w = m.rng.range(0.062, 0.15);
      const c = m.mix(col, index === 7 ? 0xb2decc : 0xbac9bd, m.rng.range(0.14, 0.34));
      m.face(
        [
          [xx, -0.003, zz],
          [xx - w * 0.18, -0.003, zz + 0.012],
          [xx + w, -0.003, zz + 0.025],
          [xx + w * 1.15, -0.003, zz + 0.018]
        ],
        c
      );
    }
  }
  if (bridge) {
    if ([4, 7, 8, 9].includes(index)) {
      for (let j = -1; j < 2; j++)
        slate(m, x + j * 0.32, z, 0.316, 0.79, m.mix(p[1], p[0], 0.49), p[2], 0.062, 0.043);
      if (index === 8 || index === 9)
        for (const s of [-1, 1]) m.box(x, 0.074, z + s * 0.37, 0.89, 0.013, 0.018, p[4]);
    } else {
      const wood = index === 3 ? 0x99968a : 0x94795a;
      m.box(x, 0.008, z - 0.27, 1.01, 0.061, 0.061, 0x675947);
      m.box(x, 0.008, z + 0.27, 1.01, 0.061, 0.061, 0x675947);
      for (let j = 0; j < 8; j++)
        slate(
          m,
          x - 0.435 + j * 0.124,
          z,
          0.117,
          0.81 + m.rng.range(-0.03, 0.03),
          m.mix(wood, p[1], m.rng.next() * 0.22),
          0x625e51,
          0.062,
          0.011
        );
    }
  }
}
function plain(m, x, z, index, p) {
  if (index === 6) return paving(m, x, z, p);
  const c = m.mix(p[0], p[1], m.rng.range(0.07, 0.48)),
    lo = p[2];
  if (index === 1 || index === 6) {
    for (let j = 0; j < 3; j++) {
      const split = (j + Math.round(x + z)) % 2 ? 0.68 : 0.31,
        dz = z - 0.333 + j * 0.333;
      slate(
        m,
        x - 0.499 + split / 2,
        dz,
        split - 0.014,
        0.32,
        m.mix(c, p[1], m.rng.next() * 0.21),
        lo,
        0.035,
        0.028
      );
      slate(
        m,
        x + split * 0.5,
        dz,
        0.985 - split,
        0.32,
        m.mix(c, lo, m.rng.next() * 0.15),
        lo,
        0.035,
        0.028
      );
    }
  } else if (index === 2) {
    m.face(
      [
        [x - 0.501, 0.014, z - 0.501],
        [x - 0.501, 0.014, z + 0.501],
        [x + 0.501, 0.014, z + 0.501],
        [x + 0.501, 0.014, z - 0.501]
      ],
      c
    );
    for (let j = 0; j < 5; j++) {
      const s = m.rng.range(0.046, 0.16);
      m.rock(
        x + m.rng.range(-0.38, 0.38),
        0.014,
        z + m.rng.range(-0.37, 0.37),
        s,
        m.rng.range(0.006, 0.02),
        s * 0.62,
        lo,
        m.mix(c, p[1], 0.25),
        6
      );
    }
  } else if (index === 3) {
    snowTile(m, x, z);
  } else {
    slate(m, x, z, 0.989, 0.989, c, lo, 0.039, [4, 9].includes(index) ? 0.095 : 0.055);
    if ([4, 8, 9].includes(index)) {
      const sz = index === 9 ? 0.071 : 0.054;
      m.face(
        [
          [x - 0.447, 0.044, z - 0.447 + sz],
          [x - 0.447 + sz, 0.044, z - 0.447],
          [x - 0.447, 0.044, z - 0.447 - sz * 0.28],
          [x - 0.447 - sz * 0.27, 0.044, z - 0.447]
        ],
        m.mix(p[4], p[0], 0.32)
      );
    }
    if (index === 5 && m.rng.next() < 0.47) {
      for (let i = 0; i < 3; i++) {
        const xx = x + m.rng.range(-0.43, 0.43),
          zz = z + m.rng.range(-0.39, 0.4);
        m.leaf([xx, 0.045, zz], [xx + 0.064, 0.047, zz + 0.049], 0.022, 0xc69493, 0xdab3a4, 0.003);
      }
    }
    if (index === 7 && m.rng.next() < 0.32) {
      const xx = x + m.rng.range(-0.32, 0.12);
      m.line(
        [
          [xx, 0.044, z - 0.37],
          [xx + 0.17, 0.045, z - 0.073],
          [xx + 0.1, 0.045, z + 0.2]
        ],
        0.01,
        m.mix(0x96b9ac, c, 0.4),
        4
      );
    }
  }
}
function cover(m, index, p) {
  if (index === 6) return breastwork(m);
  const r = m.rng;
  // Map 7's broken jade seats are drawn with its cave, in landforms/cave-7.js.
  if (index === 7) return;
  if ([4, 6, 8, 9].includes(index)) {
    for (let i = 0; i < 3; i++) {
      const x = -0.28 + 0.25 * i,
        z = -0.28 + r.range(-0.052, 0.065);
      m.box(x, 0.1, z, 0.26, 0.16, 0.22, m.mix(p[2], p[0], r.next() * 0.65));
      if (i !== 1) m.box(x + 0.06, 0.218, z, 0.24, 0.077, 0.19, p[0]);
    }
  } else
    for (let j = 0; j < 4; j++) {
      const x = -0.34 + j * 0.17,
        z = -0.28 + r.range(-0.07, 0.12),
        a = r.range(0.1, 0.18);
      m.rock(
        x,
        0.044,
        z,
        a,
        r.range(0.14, 0.29),
        a * r.range(0.73, 1.08),
        p[2],
        index === 3 ? 0xd8dfd5 : m.mix(p[0], p[3], 0.38),
        7
      );
    }
}
function herbs(m, index, p) {
  const r = m.rng,
    hue = index === 7 ? 0x83b5a0 : index === 9 ? 0xb4a775 : 0x6d895d,
    flower = index === 5 ? 0xe5a5ad : index === 7 ? 0xc2e4d8 : 0xd7c796;
  for (let j = 0; j < 9; j++) {
    const a = (j * circle) / 9,
      rr = 0.27 + r.range(-0.07, 0.08),
      x = Math.cos(a) * rr,
      z = Math.sin(a) * rr;
    for (let k = 0; k < 4; k++) {
      const aa = (k * circle) / 4 + 0.44 * j,
        l = r.range(0.087, 0.153);
      m.leaf(
        [x, 0.05, z],
        [x + Math.cos(aa) * l, 0.095 + l * 0.31, z + Math.sin(aa) * l],
        l * 0.24,
        hue,
        m.mix(hue, p[1], 0.31),
        0.032
      );
    }
    if (j % 2 === 0) {
      m.tube([x, 0.08, z], [x, 0.17, z], 0.008, 0.006, hue, 4);
      for (let k = 0; k < 4; k++) {
        const t = (k * circle) / 4;
        m.leaf(
          [x, 0.17, z],
          [x + Math.cos(t) * 0.047, 0.18, z + Math.sin(t) * 0.047],
          0.02,
          flower,
          flower,
          0.005
        );
      }
    }
  }
}
function brush(m, index, p) {
  const r = m.rng;
  // 紅楓驛 grows maple saplings of its own (landforms/country-1.js).
  if (index === 1) return mapleScrub(m);
  // Map 7's frosted stone curtains are drawn with its cave, in landforms/cave-7.js.
  if (index === 7) return;
  if ([1, 2, 5].includes(index)) {
    const col = index === 1 ? 0xc66a38 : index === 5 ? 0xdba0a5 : 0x94a76b;
    for (let j = 0; j < 5; j++) {
      const x = r.range(-0.37, 0.37),
        z = r.range(-0.39, -0.19),
        h = r.range(0.31, 0.61);
      m.tube([x, 0.05, z], [x + 0.03, h, z], 0.022, 0.013, index === 2 ? 0x839059 : 0x7b705b, 5);
      for (let k = 0; k < 5; k++) {
        const a = k * 2.23,
          l = r.range(0.11, 0.2),
          origin = [x + 0.019, h * (0.49 + k * 0.091), z];
        m.leaf(
          origin,
          [origin[0] + Math.cos(a) * l, origin[1] + 0.073, origin[2] + Math.sin(a) * l],
          l * 0.2,
          m.mix(col, p[3], 0.31),
          col,
          0.026
        );
      }
    }
  } else if (index === 7 || index === 9) {
    for (let j = 0; j < 5; j++) {
      const x = r.range(-0.36, 0.35),
        z = r.range(-0.37, -0.22);
      m.crystal(
        x,
        0.05,
        z,
        r.range(0.035, 0.08),
        r.range(0.22, 0.52),
        p[2],
        index === 7 ? 0x96cabb : 0xab9a6c,
        6,
        r.range(-0.09, 0.09)
      );
    }
  } else if (index === 6) {
    bramble(m);
  } else {
    for (let j = 0; j < 4; j++) {
      const x = r.range(-0.34, 0.34),
        z = r.range(-0.37, -0.25);
      m.rock(x, 0.04, z, 0.1, r.range(0.2, 0.43), 0.093, p[2], index === 3 ? 0xd6dfd6 : p[1], 7);
    }
  }
}
function obstacle(m, index, p, crate) {
  if (index === 6) return crate ? armsChest(m) : ruinTile(m);
  const r = m.rng;
  if (crate && [1, 2, 3, 6].includes(index)) {
    cargo(m, -0.075, -0.08, 0.72, index === 3 ? 0x968777 : index === 6 ? 0x857059 : 0xa28259);
    m.frame(0.18, 0.59, 0.02, 0.17, 0.57, () => cargo(m, 0, 0, 0.68));
    return;
  }
  // Map 7's jade outcrops are drawn with its cave, in landforms/cave-7.js.
  if (index === 7) return;
  if (index === 8 || index === 9) {
    if (crate) {
      m.lathe(
        0,
        0.045,
        0,
        [
          [0, 0.32],
          [0.105, 0.34],
          [0.14, 0.25],
          [0.49, 0.23],
          [0.54, 0.33],
          [0.65, 0.28]
        ],
        p[2],
        8
      );
      m.hoop(0, 0.59, 0, 0.27, 0.019, p[4], 12);
      m.crystal(0, 0.67, 0, 0.12, 0.23, p[3], p[4], 6);
    } else {
      m.rock(0, 0.05, 0, 0.34, 0.63, 0.29, p[2], p[0], 7);
      m.crystal(-0.12, 0.44, -0.07, 0.14, 0.46, p[3], p[4], 6, -0.08);
    }
    return;
  }
  if (index === 5 || index === 4) {
    const h = crate ? 0.59 : 0.9;
    m.rock(-0.05, 0.05, 0, 0.31, h, 0.25, p[2], p[0], 8);
    m.rock(0.21, 0.04, 0.13, 0.16, 0.34, 0.14, p[3], p[0], 7);
    for (let j = 0; j < 3; j++) m.box(-0.055, 0.23 + j * 0.14, 0.206, 0.13, 0.027, 0.027, p[4]);
    return;
  }
  m.rock(
    -0.025,
    0.05,
    -0.04,
    0.39,
    r.range(0.66, 0.88),
    0.32,
    p[2],
    index === 3 ? 0xe0e4d6 : p[0],
    9
  );
  m.rock(0.24, 0.05, 0.16, 0.15, 0.27, 0.13, p[3], p[0], 7);
}
function field(m, index, cells, p, size, own = null) {
  // 桃花石陣 dresses its tiles in landforms/formation-5.js.
  if (index === 5) return;
  // 谷底棋臺 carves its go lines and sets its stones and swords in landforms/table-15.js.
  if (index === 15) return;
  const centerX = (size.width - 1) / 2;
  const centerZ = (size.height - 1) / 2;
  for (const cell of cells) {
    const x = cell.x - centerX,
      z = cell.y - centerZ,
      k = cell.kind;
    if (index === 7 && k === 'reeds') continue;
    if (k === 'reeds' || k === 'bridge') puddle(m, x, z, index, p, k === 'bridge');
    else if (index !== 4) {
      // A board built round one villain may lay a dry tile's ground itself: its `ground` hook,
      // drawn in the tile's frame, returns true when it has.
      let laid = false;
      if (own?.ground)
        m.frame(x, 0, z, 0, 1, () => {
          laid = own.ground(m, p, cell) === true;
        });
      if (!laid) plain(m, x, z, index, p);
    }
    // 空山琴臺 dresses its own tiles in landforms/props-4.js.
    if (index === 4) continue;
    m.frame(x, 0, z, 0, 1, () => {
      // A board built round one villain dresses the tiles that are its own.
      if (own?.[k]) own[k](m, p, cell);
      else if (k === 'cover') cover(m, index, p);
      else if (k === 'bamboo') brush(m, index, p);
      else if (k === 'herbs') herbs(m, index, p);
      else if (k === 'rock' || k === 'crate') obstacle(m, index, p, k === 'crate');
      else if (k === 'reeds') {
        if (index === 2 || index === 1 || index === 5) {
          reeds(m, -0.19, -0.27, 0.31, 6, index === 2, 0.01);
          reeds(m, 0.24, 0.14, 0.19, 4, index === 2, 0.0);
        } else
          for (let j = 0; j < 3; j++) {
            const r = m.rng,
              xx = r.range(-0.38, 0.38),
              zz = r.range(-0.38, 0.38);
            m.rock(xx, -0.02, zz, 0.063, 0.039, 0.043, p[2], p[0], 6);
          }
      }
    });
  }
  cutRing(m, index, p, size);
  if (index !== 5) rimInlay(m, index, p, size);
}
function shrub(m, x, y, z, s, p, blossom = false) {
  const r = m.rng;
  for (let j = 0; j < 7; j++) {
    const a = (j * circle) / 7 + r.range(-0.2, 0.2),
      rad = s * r.range(0.26, 0.64),
      end = [x + Math.cos(a) * rad, y + s * r.range(0.49, 0.89), z + Math.sin(a) * rad];
    const mid = [x + Math.cos(a) * rad * 0.44, y + s * 0.37, z + Math.sin(a) * rad * 0.44];
    m.line([[x, y, z], mid, end], 0.015 * s, 0x75674e, 4);
    for (let k = 0; k < 5; k++) {
      const t = k / 5,
        attach = midway(mid, end, t),
        ang = a + (k % 2 ? -0.8 : 0.8),
        l = r.range(0.15, 0.33) * s,
        tip = [attach[0] + Math.cos(ang) * l, attach[1] + l * 0.24, attach[2] + Math.sin(ang) * l];
      m.leaf(attach, tip, l * 0.29, r.pick(p), r.pick(p), l * 0.1);
      if (blossom && k % 2 === 0)
        for (let petal = 0; petal < 4; petal++) {
          const a2 = (petal * circle) / 4 + 0.31 * j;
          m.leaf(
            tip,
            [
              tip[0] + s * 0.074 * Math.cos(a2),
              tip[1] + s * 0.026,
              tip[2] + s * 0.074 * Math.sin(a2)
            ],
            s * 0.032,
            0xd78e9f,
            0xf1bcbb,
            s * 0.013
          );
        }
    }
  }
}
function lotus(m, x, z, y, s) {
  const r = m.rng;
  for (let j = 0; j < 10; j++) {
    const a = j * 2.29 + r.next() * 0.56,
      d = Math.sqrt(r.next()) * s * 0.97,
      xx = x + Math.cos(a) * d,
      zz = z + Math.sin(a) * d * 0.66,
      rad = s * r.range(0.11, 0.23),
      ring = [];
    for (let i = 0; i <= 12; i++) {
      const aa = a + 0.18 + (i / 12) * (circle - 0.36);
      ring.push([
        xx + Math.cos(aa) * rad,
        y + 0.005 + 0.018 * Math.sin(i * 0.69),
        zz + Math.sin(aa) * rad
      ]);
    }
    const c = r.pick([0x779361, 0x8aa06c, 0x839a68, 0x9aa66e]);
    for (let i = 0; i < 12; i++)
      m.face([[xx, y + 0.018, zz], ring[i + 1], ring[i]], [m.rgb(0xa6ac77), m.rgb(c), m.rgb(c)]);
    if (j % 4 === 0) {
      const base = [xx + rad * 0.58, y + 0.13, zz - rad * 0.44];
      m.tube([base[0], y - 0.08, base[2]], base, 0.01, 0.008, 0x778650, 5);
      for (let i = 0; i < 12; i++) {
        const aa = (i * circle) / 6 + (i > 5 ? 0.54 : 0),
          l = (i > 5 ? 0.078 : 0.111) * s;
        m.leaf(
          base,
          [
            base[0] + Math.cos(aa) * l,
            base[1] + l * (i > 5 ? 0.95 : 0.49),
            base[2] + Math.sin(aa) * l
          ],
          l * 0.3,
          0xe5b5a8,
          0xf0d1bd,
          l * 0.1
        );
      }
    }
  }
}
// Buildings, trees and signposts stand on their own dry footholds. Their
// foundations are sized from the actual feet of each model. Fishing boats and
// suspended buildings already carry their appropriate hulls and undercrofts.
function landmarkFoundation(m, index, name, p) {
  if (
    index === 8 ||
    (index === 2 && (name.includes('帆') || name.includes('漁舟') || name === '蘆舍')) ||
    name === '古銅四時漏刻'
  )
    return;
  const r = m.rng,
    verts = m.parts[0].p;
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (let j = 0; j < verts.length; j += 3) {
    const h = verts[j + 1];
    if (h < -0.45 || h > 0.37) continue;
    minX = Math.min(minX, verts[j]);
    maxX = Math.max(maxX, verts[j]);
    minZ = Math.min(minZ, verts[j + 2]);
    maxZ = Math.max(maxZ, verts[j + 2]);
  }
  if (!Number.isFinite(minX)) return;
  const cx = (minX + maxX) / 2,
    cz = (minZ + maxZ) / 2;
  const rx = Math.max(0.56, (maxX - minX) * 0.52 + 0.3),
    rz = Math.max(0.54, (maxZ - minZ) * 0.52 + 0.27);
  const natural = [1, 2, 3, 5, 7].includes(index),
    n = natural ? 18 : 12;
  const depth = landDepth[index] * (natural ? 0.88 : 0.72),
    ring = [];
  for (let j = 0; j < n; j++) {
    const a = ((j + 0.5) * circle) / n,
      u = Math.cos(a),
      v = Math.sin(a);
    const k = 1 / (Math.abs(u) ** 3.8 + Math.abs(v) ** 3.8) ** (1 / 3.8);
    const s = natural ? r.range(0.955, 1.049) : 1;
    ring.push([k * u * rx * s, k * v * rz * s]);
  }
  const grounded = [1, 5, 6].includes(index);
  const base = setting(index).level;
  const courses = grounded
    ? [
        [base + 0.012, 1.44],
        [base * 0.72, 1.21],
        [base * 0.39, 1.08],
        [-0.12, 1.009],
        [-0.048, 0.976]
      ]
    : [
        [-depth, 0.77],
        [-0.56 * depth, 0.93],
        [-0.21, 1],
        [-0.085, 1.016],
        [-0.048, 0.976]
      ];
  let prev;
  for (const [y, scale] of courses) {
    const row = ring.map(([a, b]) => [cx + a * scale, y, cz + b * scale]);
    if (prev)
      for (let j = 0; j < n; j++) {
        const k = (j + 1) % n,
          tint = m.mix(p[2], p[3], 0.28 + 0.19 * Math.sin(j * 2.14));
        m.face([prev[j], row[j], row[k], prev[k]], tint);
      }
    prev = row;
  }
  for (let j = 0; j < n; j++)
    m.face(
      [[cx, -0.047, cz], prev[(j + 1) % n], prev[j]],
      m.mix(p[0], p[3], 0.62 + 0.09 * Math.sin(j * 0.62))
    );
  if ([1, 5].includes(index)) {
    for (let j = 1; j < n; j += 8) {
      const [x, z] = ring[j];
      shrub(
        m,
        cx + x * 0.86,
        -0.045,
        cz + z * 0.86,
        r.range(0.21, 0.43),
        [0x73825c, 0x94a06b],
        index === 5
      );
    }
  } else if (index === 2)
    for (let j = 0; j < 2; j++) {
      const [x, z] = ring[j * 7 + 2];
      lotus(m, cx + x * 1.34, cz + z * 1.34, -0.614, 0.51);
    }
}
function cutRing(m, index, p, layout) {
  if (index !== 4 && index !== 5 && index !== 9) return;
  const { width, height, mask } = layout,
    cx = index === 4 ? 5 - (width - 1) / 2 : 0,
    cz = index === 4 ? 5 - (height - 1) / 2 : 0;
  const inMap = (x, z) => mask[Math.floor(z + height / 2)]?.[Math.floor(x + width / 2)] === '#';
  function stroke(a, b, tone, radius) {
    const mid = midway(a, b, 0.5);
    if ([a, b, mid].every((v) => inMap(v[0], v[2]))) m.tube(a, b, radius, radius, tone, 5);
  }
  const radii = index === 9 ? [3.81, 3.91, 5.13, 6.06] : index === 4 ? [2.3, 2.37] : [3.23, 3.37];
  for (const radius of radii) {
    const tone = m.mix(p[4], p[0], 0.21),
      n = index === 5 ? 64 : 112;
    const point = (i) => {
      const a = (circle * i) / n;
      let k = radius;
      if (index === 5)
        k *= Math.cos(Math.PI / 8) / Math.cos(((a + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8);
      return [cx + Math.cos(a) * k, 0.055, cz + Math.sin(a) * k];
    };
    for (let j = 0; j < n; j++) stroke(point(j), point(j + 1), tone, index === 9 ? 0.014 : 0.011);
  }
  if (index === 9)
    for (let j = 0; j < 64; j++) {
      const a = (circle * j) / 64,
        rad = 5.13,
        len = j % 8 === 0 ? 0.31 : j % 2 === 0 ? 0.16 : 0.087;
      stroke(
        [cx + Math.cos(a) * (rad - len), 0.056, cz + Math.sin(a) * (rad - len)],
        [cx + Math.cos(a) * rad, 0.056, cz + Math.sin(a) * rad],
        p[4],
        0.013
      );
    }
}
function lowerLandscape(m, index, p, layout) {
  // 紅楓驛's own relief covers this low ground (landforms/landform-1.js).
  if (index === 1) return;
  if (index === 6) return; // landform-6 lays its own ground and litter
  // 桃花石陣 is an island; its shore and the sea beyond are in landforms/landform-5.js.
  if (index === 5) return;
  const water = index === 2,
    dry = [1, 5, 6].includes(index);
  if (!water && !dry) return;
  const { width, height, mask } = layout,
    level = setting(index).level;
  const cx = width / 2,
    cz = height / 2,
    random = m.rng;
  const occupied = (xx, zz) => mask[Math.floor(zz + cz)]?.[Math.floor(xx + cx)] === '#';
  function patch(x, z, w, d, col, edge) {
    const ring = [],
      k = 10,
      y = level + 0.026;
    for (let j = 0; j < k; j++) {
      const a = (circle * j) / k,
        noise = random.range(0.77, 1.19);
      ring.push([
        x + Math.cos(a) * w * noise,
        y + random.range(-0.011, 0.011),
        z + Math.sin(a) * d * noise
      ]);
    }
    for (let j = 0; j < k; j++)
      m.face(
        [[x, y + 0.007, z], ring[(j + 1) % k], ring[j]],
        [m.rgb(col), m.rgb(edge), m.rgb(edge)],
        0.54
      );
  }
  const soil =
    index === 1
      ? [0x927459, 0xa18260, 0xab8b64, 0x987955]
      : index === 5
        ? [0x849373, 0x73876b, 0x94a17a, 0x7f916e]
        : [0x877660, 0x93816a, 0x9c866c, 0x827057];
  const ground = setting(index).base;
  for (let j = 0; j < (water ? 53 : 485); j++) {
    const x = random.range(-cx - 5.5, cx + 5.5),
      z = random.range(-cz - 4.2, cz + 4.3);
    if (occupied(x, z)) continue;
    const rad = Math.max(Math.abs(x) / (cx + 5.4), Math.abs(z) / (cz + 4.4));
    if (rad > 0.93 && random.next() > 0.38) continue;
    if (water) {
      // 蘆花汀 floats its own lily pads in the lee of the reed beds (landforms/fishers-2.js).
      continue;
    }
    const spread = random.range(0.12, 0.52),
      chosen = random.pick(soil);
    if (j % 2 === 0) patch(x, z, 1.2 * spread, 0.65 * spread, chosen, m.mix(ground, chosen, 0.29));
    if (j % 3 === 0) {
      const col =
        index === 1
          ? random.pick([0xa76b3f, 0xc88750, 0xae925f])
          : index === 5
            ? random.pick([0xb09585, 0xd4a89e, 0x9a9977])
            : random.pick([0x8b806c, 0x998b73]);
      for (let k = 0; k < 5; k++) {
        const xx = x + random.range(-0.26, 0.26),
          zz = z + random.range(-0.19, 0.19);
        m.leaf(
          [xx, level + 0.05, zz],
          [xx + 0.064, level + 0.054, zz + 0.037],
          0.023,
          col,
          col,
          0.004
        );
      }
    }
    if (j % 8 === 0) {
      if (index === 6)
        m.frame(x, level + 0.022, z, random.range(0, circle), 1, () =>
          m.box(0, 0.035, 0, 0.19, 0.09, 0.13, random.pick(soil))
        );
      else reeds(m, x, z, random.range(0.08, 0.2), 5, false, level + 0.02);
    }
  }
  if (index === 1 || index === 6) {
    const paths =
      index === 1
        ? [
            [
              [-cx - 1.5, 1.6],
              [-cx + 1.4, 2.4],
              [-cx + 3.4, 4.2],
              [-cx + 5.2, cz + 3.8]
            ],
            [
              [cx + 1.6, -cz - 1.4],
              [cx + 2.6, -cz + 0.9],
              [cx + 2.0, 1.05],
              [cx + 0.3, cz + 3.3]
            ]
          ]
        : [
            [
              [-cx - 1.2, 1.9],
              [-cx + 1, 3.4],
              [-cx + 4.7, cz + 0.6],
              [-cx + 7, cz + 3.6]
            ],
            [
              [cx + 1.1, -cz - 1.8],
              [cx + 2.3, -cz + 1],
              [cx + 1.8, 1.2],
              [cx + 2.9, cz + 3.4]
            ]
          ];
    for (const path of paths)
      for (let seg = 1; seg < path.length; seg++) {
        const a = path[seg - 1],
          b = path[seg];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let t = 0; t < 1; t += 0.27 / len) {
          const x = a[0] + (b[0] - a[0]) * t,
            z = a[1] + (b[1] - a[1]) * t;
          if (!occupied(x, z)) patch(x, z, 0.55, 0.48, index === 1 ? 0xaf8e66 : 0x96836a, soil[0]);
        }
      }
  }
}

function ranges(m, index, p) {
  // 紅楓驛 is closed by its own wooded hills (landforms/landform-1.js).
  if (index === 1) return;
  if (index === 6) return; // landform-6 draws its own horizon
  // 桃花石陣's distant islets are in landforms/island-5.js.
  if (index === 5) return;
  // 谷底棋臺 is walled in by its own cliffs (landforms/valley-15.js).
  if (index === 15) return;
  const r = m.rng,
    style = setting(index);
  if (index === 3) return peaks3(m, style);
  // 空山琴臺 raises its own spires and cloud banks in landforms/peaks-4.js.
  if (index === 4) return;
  if (index === 9) {
    // The cloud sea and far peaks are drawn with the terrace in landform-9.js.
    return;
  }
  if (index === 2) return farMarsh(m, style);
  for (let tier = 0; tier < 2; tier++)
    for (let j = 0; j < (tier ? 19 : 13); j++) {
      const a = tier * 0.23 + (j * circle) / (tier ? 19 : 13) + r.range(-0.07, 0.07),
        rad = (tier ? 26 : 17.5) + r.range(-1.3, 1.7);
      const x = Math.cos(a) * rad,
        z = Math.sin(a) * rad,
        s = r.range(1.7, 3.9) * (tier ? 1.32 : 1.0),
        tint = m.mix(p[2], style.horizon, tier ? 0.5 : 0.23),
        hi = m.mix(p[3], style.horizon, tier ? 0.56 : 0.33);
      if (index === 8) {
        if (j % 3 === 0)
          m.frame(x, r.range(-1.75, 0.11), z, -a, 1, () => {
            m.rock(0, -1.25, 0, s * 0.61, 1.28, s * 0.56, 0x9a9bba, 0xd9d3dc, 8);
            m.box(0, 0.34, 0, s * 0.62, 0.68, s * 0.48, 0xa1979b);
            roof(m, s * 0.85, s * 0.71, 0.68, 0.66, [0x606781, 0x798396, 0x959ba7]);
            m.frame(
              0,
              -1.11,
              0,
              0,
              1,
              () => m.crystal(0, 0, 0, s * 0.4, 1.91, 0x8a8eae, 0xb3b1c9, 6),
              0,
              Math.PI
            );
          });
        continue;
      }
      // Map 7 is closed in by its own cave wall (landforms/cave-7.js).
      if (index === 7) continue;
      const base = style.level - 0.65,
        w = index === 2 ? s * 1.24 : s;
      const H =
        index === 2
          ? r.range(1.42, 2.61)
          : index === 3
            ? r.range(6.87, 12.09)
            : index === 4
              ? r.range(5.78, 10.18)
              : r.range(2.14, 5.23);
      const n = index === 3 ? 10 : 14,
        rot = r.range(0, circle),
        poly = Array.from({ length: n }, (_, i) => [
          rot + (i * circle) / n + r.range(-0.1, 0.11),
          r.range(0.8, 1.13)
        ]);
      const snow = index === 3,
        steep = [3, 4].includes(index);
      let prev;
      for (const [k, d] of [
        [0, 1],
        [0.24, 0.88],
        [0.55, steep ? 0.57 : 0.65],
        [0.74, steep ? 0.36 : 0.55],
        [0.93, steep ? 0.15 : 0.26],
        [1, steep ? 0.034 : 0.08]
      ]) {
        const ring = poly.map(([a, q]) => [
          x + Math.cos(a) * q * w * d + k * k * w * 0.26,
          base + k * H + Math.sin(a * 3.2) * H * 0.075 * Math.sin(k * Math.PI),
          z + Math.sin(a) * s * 0.8 * q * d
        ]);
        if (prev)
          for (let l = 0; l < n; l++) {
            const next = (l + 1) % n;
            const top =
              snow && k > 0.69
                ? m.mix(0xc8d3d7, style.horizon, tier ? 0.28 : 0.047)
                : m.mix(tint, hi, k * 0.88);
            m.face(
              [prev[l], ring[l], ring[next], prev[next]],
              [m.rgb(k > 0.91 ? top : tint), m.rgb(top), m.rgb(top), m.rgb(k > 0.91 ? top : tint)]
            );
          }
        prev = ring;
      }
      m.face([...prev].reverse(), snow ? 0xd5e0df : hi);
    }
}
// The original landmark sketches describe an eleven-cell court. Distribute
// its banks along the new edges; beyond an edge keep all physical clearances.
const oldHalf = 5.5;
function onWiderCourt(coordinate, halfExtent) {
  const a = Math.abs(coordinate);
  return (
    Math.sign(coordinate) * (a < oldHalf ? (a * halfExtent) / oldHalf : halfExtent + a - oldHalf)
  );
}
function fitOuterMesh(group, size) {
  const hw = size.width / 2,
    hh = size.height / 2;
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const geo = mesh.geometry,
      pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, onWiderCourt(pos.getX(i), hw));
      pos.setZ(i, onWiderCourt(pos.getZ(i), hh));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
  });
  return group;
}
function clearField(T, group, size) {
  const hw = size.width / 2 + 0.08,
    hh = size.height / 2 + 0.08;
  const box = new T.Box3().setFromObject(group, true);
  if (box.max.x <= -hw || box.min.x >= hw || box.max.z <= -hh || box.min.z >= hh) return;
  const dx = group.position.x < 0 ? -hw - box.max.x : hw - box.min.x;
  const dz = group.position.z < 0 ? -hh - box.max.z : hh - box.min.z;
  if (Math.abs(dx) < Math.abs(dz)) group.position.x += dx;
  else group.position.z += dz;
}

// A small landmark on each expanded approach ties the new route to its
// terrain. These live beyond the last walkable cell and never take a move.
function approachLandmark(index, size, add, p) {
  const east = size.width / 2,
    south = size.height / 2;
  const wood = 0x795941,
    brass = 0xb69b65,
    slate = p[2];
  if (index === 1) {
    add('東院換馬燈', east + 1.04, 2.77, -Math.PI / 2, (m) => {
      rail(m, 0, 0, 2.1, 0, 0.52, wood);
      m.tube([-0.61, 0, 0], [-0.61, 1.76, 0], 0.062, 0.054, wood, 7);
      m.tube([-0.77, 1.75, 0], [0.14, 1.75, 0], 0.055, 0.044, wood, 6);
      lantern(m, 0.07, 1.46, 0, 0.71, 0xba5635);
      cargo(m, 0.66, 0.1, 0.64, 0x977755);
    });
  } else if (index === 2) {
    // The southern landing is part of landforms/fishers-2.js.
  } else if (index === 3) {
    add('南麓報雪亭', -2.38, south + 0.99, Math.PI, (m) => {
      pavilionCrag(m);
      for (const x of [-0.64, 0.64]) {
        m.box(x, 0.77, 0, 0.11, 1.54, 0.13, wood);
        m.box(x, 0.12, 0, 0.22, 0.24, 0.24, slate);
      }
      m.box(0, 1.5, 0, 1.52, 0.11, 0.17, wood);
      roof(m, 1.95, 0.94, 1.59, 0.49, [0x7c8787, 0xbacacc, 0xe6e9df], true);
      m.hoop(0, 1.04, 0.04, 0.28, 0.032, brass, 18, 'xy');
      m.tube([0, 1.51, 0.04], [0, 1.32, 0.04], 0.018, 0.016, wood, 5);
    });
  } else if (index === 4) {
    add('東翼定音架', east + 1, 1.18, -Math.PI / 2, (m) => {
      for (const x of [-0.72, 0.72]) {
        m.lathe(
          x,
          0,
          0,
          [
            [0, 0.2],
            [0.15, 0.17],
            [0.21, 0.1]
          ],
          0x91a08c,
          8
        );
        m.box(x, 0.85, 0, 0.105, 1.36, 0.12, 0x885e46);
      }
      m.box(0, 1.55, 0, 1.79, 0.12, 0.16, 0x986b48);
      for (let j = 0; j < 4; j++) {
        const x = -0.49 + j * 0.34;
        m.tube([x, 1.49, 0], [x, 1.36, 0], 0.022, 0.02, brass, 6);
        m.lathe(
          x,
          1.37,
          0,
          [
            [0, 0.09],
            [-0.1, 0.14],
            [-0.38 + j * 0.031, 0.18],
            [-0.4 + j * 0.031, 0.16]
          ],
          brass,
          12
        );
      }
    });
  } else if (index === 5) {
    // The east gate's moon-gate screen is built in landforms/gates-5.js.
  } else if (index === 6) {
    // The barbican and its standards are part of landforms/landform-6.js.
  } else if (index === 7) {
    add('南泉玉座', -0.25, south + 0.91, Math.PI, (m) => {
      m.lathe(
        0,
        0,
        0,
        [
          [0, 0.56],
          [0.11, 0.59],
          [0.16, 0.47],
          [0.29, 0.43]
        ],
        0x6e847e,
        8
      );
      m.glow(() => {
        for (const [x, z, h] of [
          [0, 0, 1.17],
          [-0.23, 0.06, 0.62],
          [0.16, 0.12, 0.73],
          [0.17, -0.16, 0.47]
        ])
          m.crystal(x, 0.24, z, 0.13, h, 0x598f85, 0xa8d3bc, 6, x * 0.48);
      });
    });
  } else if (index === 8) {
    add('東坊引渡牌', east + 1.04, 2.72, -Math.PI / 2, (m) => {
      m.lathe(
        0,
        -0.53,
        0,
        [
          [0, 0.38],
          [0.24, 0.43],
          [0.36, 0.39],
          [0.55, 0.55]
        ],
        slate,
        8
      );
      m.tube([0, 0, 0], [0, 1.73, 0], 0.088, 0.062, 0x827072, 8);
      m.box(0, 1.64, 0, 1.23, 0.12, 0.15, brass);
      for (const x of [-0.45, 0.45]) lantern(m, x, 1.25, 0, 0.72, 0xc58762);
      roof(m, 1.47, 0.71, 1.78, 0.35, [0x5b667a, 0x788397, 0x989da5]);
    });
  } else if (index === 9) {
    add('南廊分水銅漏', 3.39, south + 0.99, Math.PI, (m) => {
      m.lathe(
        0,
        -0.19,
        0,
        [
          [-0.14, 0.62],
          [0.16, 0.7],
          [0.29, 0.59],
          [0.37, 0.62]
        ],
        slate,
        10
      );
      m.lathe(
        0,
        0.19,
        0,
        [
          [0, 0.28],
          [0.13, 0.31],
          [0.34, 0.43],
          [0.45, 0.53],
          [0.51, 0.48],
          [0.45, 0.4]
        ],
        0x988657,
        18
      );
      m.hoop(0, 0.68, 0, 0.51, 0.025, brass, 26);
      m.lathe(
        0,
        0.62,
        0,
        [
          [0, 0.39],
          [0.009, 0.39]
        ],
        0x658f86,
        20
      );
      m.tube([0, 0.62, 0], [0, 1.49, 0], 0.034, 0.026, brass, 7);
      m.hoop(0, 1.39, 0, 0.18, 0.019, brass, 18, 'xy', 0.27);
    });
  } else if (index === 15) {
    // Nothing stands on the approaches: the valley floor is in landforms/valley-15.js.
  }
}
function mazeScenery(T, index, cells) {
  const scenery = new T.Group(),
    size = mapLayout(index);
  scenery.name = setting(index).name;
  scenery.userData = {
    mapIndex: index,
    width: size.width,
    height: size.height,
    shapeName: size.shapeName,
    count: size.count
  };
  const p = stonework[index],
    seed = 4099 + 7919 * index,
    look = lookOf(index);
  const bank = new Model(T, seed);
  shapedShelf(bank, look, p, size, landDepth[index]);
  scenery.add(bank.finish('場地與峭岸'));
  const floor = new Model(T, seed + 51);
  field(floor, look, cells, p, size, OWN_TILES[index]);
  scenery.add(floor.finish('可行走地形與掩體'));
  // Past the tiles, such a board is all its own landform module's (environment.js).
  if (look !== index) {
    scenery.updateMatrixWorld(true);
    return scenery;
  }
  const air = new Model(T, seed + 79);
  innerWaterAndStars(air, index, size);
  lowerLandscape(air, index, p, size);
  if (air.parts.some((part) => part.i.length)) scenery.add(air.finish('陣井與深淵'));
  let serial = 0;
  const add = (name, x, z, yaw, draw, { fade = true, y = 0, scale = 1 } = {}) => {
    const m = new Model(T, seed + ++serial * 103);
    draw(m);
    if (index !== 3 || !['覆雪懸棧','峭壁木棧','南麓報雪亭'].includes(name)) landmarkFoundation(m, index, name, p);
    const g = m.finish(name, { occluder: fade });
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    g.scale.setScalar(scale);
    clearField(T, g, size);
    scenery.add(g);
  };
  landmarks(index, (name, x, z, yaw, draw, options) =>
    add(name, onWiderCourt(x, size.width / 2), onWiderCourt(z, size.height / 2), yaw, draw, options)
  );
  approachLandmark(index, size, add, p);
  const backdrop = new Model(T, seed + 1011);
  ranges(backdrop, index, p);
  scenery.add(fitOuterMesh(backdrop.finish('遠景與山勢', { distant: true, cast: false }), size));
  scenery.updateMatrixWorld(true);
  return scenery;
}

export { mazeScenery };
