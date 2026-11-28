// 俠客島's own tiles, drawn by maze-scenery.js in each tile's frame (x and z from -0.5 to 0.5,
// the board's top at TOP). The hall floor is the island's rock dressed flat: each tile a
// hewn square with chisel-tooling, cracks and wear, scored at its edges, darker and wet by the
// tide channels, sand-drifted toward the mouth, warm where a lamp stands near and worn into
// hollows before the carved walls where students have sat for decades. The stone benches and
// tables, the herb bed and the tidal shallows have their own dressing here; the carved walls
// and the pillars on the rock tiles are drawn whole in carving-19.js and pillars-19.js.
import { circle } from '../scenery-kit.js';
import {
  TOP,
  CX,
  CZ,
  smooth,
  rgb,
  blend,
  noise,
  fbm,
  hash,
  channelZ,
  walls,
  lightAt,
  toward
} from './kit-19.js';

const G = 6;
// The rock of the floor at a point of the board, before light.
function stone(x, z) {
  const n1 = fbm(x * 0.7 + 4.1, z * 0.7 - 2.6),
    n2 = noise(x * 5.3 - 1.4, z * 5.3 + 3.8);
  const bed = 0.5 + 0.5 * Math.sin(x * 0.9 - z * 1.25 + 2.2 * n1);
  let c = blend(rgb(0x6c6a63), rgb(0x8d897e), 0.2 + 0.4 * bed + 0.3 * n2);
  // Polished paler down the middle of the hall, where every foot passes.
  c = blend(c, rgb(0x9b978a), 0.3 * Math.exp(-((x / 3.2) ** 2)) * smooth(-5, 0, z) * (0.5 + 0.5 * n2));
  // Damp toward the tide channels, greening at the shallows' edge.
  const damp = smooth(3.5, 6.2, Math.abs(x)) * Math.exp(-(((z - channelZ) / 2.2) ** 2));
  c = blend(c, rgb(0x4d5650), 0.55 * damp);
  // Sand the wind and the waves have carried in at the mouth.
  const sand = smooth(2.2, 5.2, z) * smooth(0.45, 0.7, n1 + 0.12 * (z - 3));
  c = blend(c, blend(rgb(0xa79d82), rgb(0xbfb497), n2), 0.6 * sand);
  return c;
}
// Worn hollows before each carved wall: where students have knelt, generation after
// generation, the stone is dished and smoothed paler.
function hollow(x, z) {
  let h = 0;
  for (const wx of walls) h = Math.max(h, Math.exp(-(((x - wx) / 0.32) ** 2) - ((z + 3.95) / 0.3) ** 2));
  return h;
}
function tone(x, y, z, k = 1) {
  const c = blend(stone(x, z), rgb(0xa29d90), 0.45 * hollow(x, z));
  return lightAt(x, y, z, c.map((v) => v * k), 0.4);
}
// The ground of one dry tile: a gently uneven hewn surface scored at its edges.
function ground(m, p, cell) {
  const wx = cell.x - CX,
    wz = cell.y - CZ;
  const h = (u, v) => {
    const x = wx + u,
      z = wz + v;
    const edge = Math.max(Math.abs(u), Math.abs(v));
    if (edge > 0.499) return TOP - 0.02;
    return TOP + 0.007 * (noise(x * 3.7, z * 3.7) - 0.5) - 0.012 * hollow(x, z) - 0.004 * smooth(0.42, 0.5, edge);
  };
  const pts = [];
  for (let j = 0; j <= G; j++)
    for (let i = 0; i <= G; i++) {
      // The inner ring of vertices sits just inside the edge, so the score is narrow.
      const s = (t) => (t === 0 ? -0.5 : t === G ? 0.5 : t === 1 ? -0.47 : t === G - 1 ? 0.47 : -0.5 + t / G);
      const u = s(i),
        v = s(j),
        y = h(u, v);
      pts.push([[u, y, v], tone(wx + u, y, wz + v, 0.97 + 0.06 * hash(wx + u * 3, wz + v * 3))]);
    }
  const at = (i, j) => pts[j * (G + 1) + i];
  for (let j = 0; j < G; j++)
    for (let i = 0; i < G; i++) {
      const q = [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)];
      if ((i + j) % 2) q.push(q.shift());
      m.face(
        q.map((t) => t[0]),
        q.map((t) => t[1])
      );
    }
  // A skirt down into the joint, closing the score against its neighbour.
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4;
    m.frame(0, 0, 0, a, 1, () => {
      const c = tone(wx, TOP, wz, 0.55);
      m.face(
        [
          [-0.5, -0.05, 0.5],
          [0.5, -0.05, 0.5],
          [0.5, TOP - 0.02, 0.5],
          [-0.5, TOP - 0.02, 0.5]
        ],
        c
      );
    });
  }
  dress(m, cell, wx, wz);
  return true;
}
// The marks on a tile's face: tooling, cracks, grit, a drift of sand, weed by the water.
function dress(m, cell, wx, wz) {
  const r = m.rng,
    salt = hash(wx * 1.3 + 0.7, wz * 2.1 - 0.4),
    y = TOP + 0.0015;
  const dark = (x, z, k = 0.55) => tone(wx + x, y, wz + z, k);
  // Chisel tooling: short parallel strokes across part of the tile.
  if (salt < 0.45) {
    const a = r.range(0, Math.PI),
      ca = Math.cos(a),
      sa = Math.sin(a);
    const cx = r.range(-0.2, 0.2),
      cz = r.range(-0.2, 0.2),
      n = 6 + Math.floor(r.range(0, 6));
    for (let k = 0; k < n; k++) {
      const o = (k - n / 2) * 0.045,
        l = r.range(0.08, 0.2);
      const x0 = cx + -sa * o,
        z0 = cz + ca * o;
      const pts = [
        [x0 - ca * l, y, z0 - sa * l],
        [x0 + ca * l, y, z0 + sa * l],
        [x0 + ca * l - sa * 0.008, y, z0 + sa * l + ca * 0.008],
        [x0 - ca * l - sa * 0.008, y, z0 - sa * l + ca * 0.008]
      ];
      if (pts.every(([u, , v]) => Math.abs(u) < 0.46 && Math.abs(v) < 0.46)) toward(m, pts, dark(x0, z0, 0.72));
    }
  }
  // A hairline crack wandering across.
  if (salt > 0.7) {
    let x = r.range(-0.45, -0.2),
      z = r.range(-0.4, 0.4);
    const dz = r.range(-0.3, 0.3);
    for (let k = 0; k < 7; k++) {
      const nx = x + 0.12,
        nz = z + dz * 0.12 + r.range(-0.05, 0.05);
      if (Math.abs(nz) > 0.47 || nx > 0.47) break;
      const w = 0.006 + 0.006 * Math.sin((k / 6) * Math.PI);
      toward(m, 
        [
          [x, y, z - w],
          [nx, y, nz - w],
          [nx, y, nz + w],
          [x, y, z + w]
        ],
        dark(x, z, 0.45)
      );
      x = nx;
      z = nz;
    }
  }
  // Grit and chips.
  for (let k = 0; k < 3; k++) {
    if (r.next() > 0.5) continue;
    const x = r.range(-0.42, 0.42),
      z = r.range(-0.42, 0.42),
      s = r.range(0.012, 0.03);
    m.rock(x, TOP - 0.004, z, s, s * 0.7, s * 0.8, dark(x, z, 0.8), dark(x, z, 1.1), 5);
  }
  // Sand blown in at the mouth: drifts with ripples.
  if (wz >= 2 && fbm(wx * 0.7 + 4.1, wz * 0.7 - 2.6) + 0.12 * (wz - 3) > 0.5) {
    const n = 2 + Math.floor(r.range(0, 3));
    for (let k = 0; k < n; k++) {
      const x = r.range(-0.3, 0.3),
        z = r.range(-0.3, 0.3),
        rx = r.range(0.12, 0.24),
        rz = r.range(0.08, 0.16);
      const ring = [];
      for (let i = 0; i < 9; i++) {
        const a = (i * circle) / 9,
          q = 0.8 + 0.3 * hash(x + i, z - i);
        ring.push([x + Math.cos(a) * rx * q, TOP + 0.002, z + Math.sin(a) * rz * q]);
      }
      const c = tone(wx + x, TOP, wz + z, 1.0),
        sand = blend(c, rgb(0xa9a088), 0.4);
      toward(m, ring, sand);
      for (let i = -1; i <= 1; i++)
        toward(m, 
          [
            [x - rx * 0.7, TOP + 0.0035, z + i * rz * 0.45],
            [x + rx * 0.7, TOP + 0.0035, z + i * rz * 0.45 + 0.01],
            [x + rx * 0.7, TOP + 0.0035, z + i * rz * 0.45 + 0.02],
            [x - rx * 0.7, TOP + 0.0035, z + i * rz * 0.45 + 0.01]
          ],
          blend(sand, rgb(0x857c66), 0.3)
        );
    }
  }
  // Weed and a shell or two cast up by the tide near the shallows.
  const damp = smooth(3.5, 5.6, Math.abs(wx)) * Math.exp(-(((wz - channelZ) / 1.6) ** 2));
  if (damp > 0.3 && cell.kind !== 'reeds') {
    for (let k = 0; k < 3; k++) {
      const x = r.range(-0.4, 0.4),
        z = r.range(-0.4, 0.4),
        a = r.range(0, circle);
      const pts = [];
      for (let i = 0; i < 5; i++) pts.push([x + Math.cos(a) * i * 0.05, TOP + 0.003, z + Math.sin(a) * i * 0.05 + 0.02 * Math.sin(i * 1.7)]);
      m.line(pts, 0.007, r.pick([0x3c5a3c, 0x55663a, 0x6b5a32]), 3);
    }
    if (r.next() < 0.6) shell(m, r.range(-0.35, 0.35), r.range(-0.35, 0.35), r.range(0, circle));
  }
}
function shell(m, x, z, a) {
  m.frame(x, TOP, z, a, 1, () => {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = -0.9 + (i / 6) * 1.8;
      pts.push([Math.sin(t) * 0.03, 0.006 * Math.cos(t), Math.cos(t) * 0.025 - 0.012]);
    }
    for (let i = 0; i < 6; i++) toward(m, [[0, 0.012, -0.015], pts[i], pts[i + 1]], i % 2 ? 0xd8cbb3 : 0xbba98f);
  });
}

// ---------------------------------------------------------------------------
// 石凳石案: a stone table at the back of the tile with drum stools, and on it what the
// island's people left: bowls of the 臘八粥, a book of notes, an inkstone and brush.
function bowl(m, x, y, z, s, fill) {
  m.lathe(x, y, z, [[0, 0.02 * s], [0.004, 0.03 * s], [0.025 * s, 0.05 * s], [0.035 * s, 0.056 * s], [0.03 * s, 0.05 * s]], 0xd7d2c2, 10);
  if (fill) m.lathe(x, y + 0.026 * s, z, [[0, 0.046 * s], [0.002, 0]], fill, 10);
}
function bench(m, p, cell) {
  const r = m.rng,
    wx = cell.x - CX,
    wz = cell.y - CZ,
    flip = wx < 0 ? -1 : 1;
  const lit = (c, x = 0, y = 0.3, z = -0.2) => lightAt(wx + x, y, wz + z, rgb(c), 0.4);
  const slab = 0x8a8578,
    pale = 0x9e998b,
    darker = 0x5f5b53;
  // The table: a thick hewn slab on two block legs.
  m.frame(0.04 * flip, 0, -0.22, 0.05 * flip, 1, () => {
    for (const s of [-1, 1]) {
      m.box(s * 0.24, TOP + 0.17, 0, 0.09, 0.34, 0.28, lit(darker));
      m.box(s * 0.24, TOP + 0.015, 0, 0.13, 0.03, 0.32, lit(darker, 0, 0.1));
    }
    m.box(0, TOP + 0.37, 0, 0.7, 0.065, 0.38, lit(slab, 0, 0.45));
    m.box(0, TOP + 0.405, 0, 0.66, 0.008, 0.34, lit(pale, 0, 0.45));
    // On it: porridge bowls, a book held open by a stone, an inkstone and a brush.
    const t = TOP + 0.41;
    bowl(m, -0.2, t, 0.05, 1.0, lit(0x6b4a33, 0, 0.45));
    bowl(m, -0.08, t, -0.07, 0.9, lit(0x6b4a33, 0, 0.45));
    m.line([[-0.24, t + 0.06, 0.1], [-0.12, t + 0.05, 0.12]], 0.004, 0x3a2a1c, 4);
    m.line([[-0.23, t + 0.062, 0.115], [-0.115, t + 0.052, 0.132]], 0.004, 0x3a2a1c, 4);
    m.frame(0.12, t + 0.006, 0.02, 0.2, 1, () => {
      m.box(-0.055, 0, 0, 0.11, 0.012, 0.15, lit(0xd8ceb0, 0, 0.45));
      m.box(0.055, 0, 0, 0.11, 0.012, 0.15, lit(0xe0d6b8, 0, 0.45));
      for (let k = 0; k < 4; k++)
        for (const s of [-1, 1]) m.box(s * (0.03 + k * 0.018), 0.007, 0, 0.003, 0.002, 0.12, 0x4a4036);
      m.rock(0.05, 0.006, 0.05, 0.02, 0.018, 0.016, 0x55534d, 0x777268, 5);
    });
    m.box(0.27, t + 0.01, -0.08, 0.1, 0.02, 0.07, lit(0x2d2c2a, 0, 0.45));
    m.line([[0.2, t + 0.008, 0.08], [0.31, t + 0.008, 0.05]], 0.006, 0x8b6a3e, 4);
  });
  // Drum stools, one each side and one pushed out toward the board.
  for (const [x, z] of [
    [-0.4 * flip, -0.12],
    [0.42 * flip, -0.3],
    [r.range(-0.15, 0.15), 0.12]
  ]) {
    if (z > 0 && r.next() < 0.5) continue;
    m.lathe(x, TOP, z, [[0, 0.1], [0.04, 0.115], [0.16, 0.11], [0.2, 0.1], [0.22, 0.085]], lit(slab, x, 0.15, z), 12);
  }
}

// 島上藥圃: a bed of the island's herbs edged with set stones, soil dark between them.
function herbBed(m, p, cell) {
  const r = m.rng,
    wx = cell.x - CX,
    wz = cell.y - CZ;
  const lit = (c, x = 0, y = 0.1, z = 0) => lightAt(wx + x, y, wz + z, rgb(c), 0.4);
  // Kerb stones round the bed.
  for (let k = 0; k < 16; k++) {
    const side = Math.floor(k / 4),
      t = ((k % 4) + 0.5) / 4 - 0.5;
    const a = (side * circle) / 4;
    m.frame(0, 0, 0, a, 1, () =>
      m.rock(t * 0.8, TOP - 0.01, 0.4, 0.09, 0.05 + 0.02 * r.next(), 0.05, lit(0x6c6961), lit(0x8f8a7e), 6)
    );
  }
  // The soil.
  const ring = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * circle) / 12,
      k = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    ring.push([Math.cos(a) * 0.37 * Math.min(k, 1.25), TOP + 0.02, Math.sin(a) * 0.37 * Math.min(k, 1.25)]);
  }
  toward(m, ring, lit(0x3e3428));
  // Herbs: rosettes of dark leaves, the taller ones with purple-red flower heads.
  for (let j = 0; j < 9; j++) {
    const x = -0.24 + (j % 3) * 0.24 + r.range(-0.04, 0.04),
      z = -0.24 + Math.floor(j / 3) * 0.24 + r.range(-0.04, 0.04);
    const hue = r.pick([0x3f6a3a, 0x4d7a3f, 0x587f45]),
      tall = j % 2 === 0;
    for (let k = 0; k < 7; k++) {
      const a = (k * circle) / 7 + j,
        l = r.range(0.07, 0.12);
      m.leaf([x, TOP + 0.03, z], [x + Math.cos(a) * l, TOP + 0.06 + l * 0.4, z + Math.sin(a) * l], l * 0.3, lit(hue, x, 0.1, z), lit(0x7a9a5a, x, 0.1, z), 0.02);
    }
    if (tall) {
      const top = [x + r.range(-0.02, 0.02), TOP + r.range(0.16, 0.24), z];
      m.tube([x, TOP + 0.03, z], top, 0.006, 0.004, 0x4a6a35, 4);
      const flower = r.pick([0x8e3a5a, 0xa04868, 0x7a3a78]);
      for (let k = 0; k < 6; k++) {
        const a = (k * circle) / 6;
        m.leaf(top, [top[0] + Math.cos(a) * 0.035, top[1] + 0.012, top[2] + Math.sin(a) * 0.035], 0.012, flower, 0xc46a8a, 0.006);
      }
    }
  }
}

// 潮水淺灘: the tide washing over the floor's edge. Wet stones crusted with barnacles,
// wrack lying in the shallows, a line of foam where each wave stops.
function shallows(m, p, cell) {
  const r = m.rng,
    wx = cell.x - CX;
  for (let k = 0; k < 4; k++) {
    const x = r.range(-0.38, 0.38),
      z = r.range(-0.38, 0.38),
      s = r.range(0.04, 0.1);
    m.rock(x, -0.06, z, s, s * 0.9 + 0.04, s * 0.85, 0x3d403b, 0x9c9884, 7);
  }
  for (let k = 0; k < 5; k++) {
    const x = r.range(-0.4, 0.4),
      z = r.range(-0.4, 0.4),
      a = r.range(0, circle);
    const pts = [];
    for (let i = 0; i < 6; i++) pts.push([x + Math.cos(a) * i * 0.05, -0.006, z + Math.sin(a) * i * 0.05 + 0.025 * Math.sin(i * 1.3 + k)]);
    m.line(pts, 0.009, r.pick([0x3c5a3c, 0x55663a, 0x6b5a32]), 3);
  }
  // Foam: a broken arc where the wave runs out, toward the board.
  const inland = wx < 0 ? 1 : -1;
  for (let k = 0; k < 2; k++) {
    const cx = -inland * (0.2 + 0.25 * k) + r.range(-0.05, 0.05),
      rad = 0.35 + 0.1 * k;
    let prev;
    for (let i = 0; i <= 10; i++) {
      const a = -0.9 + (i / 10) * 1.8;
      const pt = [cx + inland * Math.cos(a) * rad, -0.004, Math.sin(a) * rad * 1.1];
      if (prev && Math.abs(pt[0]) < 0.49 && Math.abs(pt[2]) < 0.49 && Math.abs(prev[0]) < 0.49 && Math.abs(prev[2]) < 0.49 && hash(i, k + wx) > 0.25) {
        const w = 0.012 + 0.008 * Math.sin(i);
        toward(m, 
          [
            [prev[0] - w, prev[1], prev[2]],
            [pt[0] - w, pt[1], pt[2]],
            [pt[0] + w, pt[1], pt[2]],
            [prev[0] + w, prev[1], prev[2]]
          ],
          0xdfe6e0
        );
      }
      prev = pt;
    }
  }
  if (r.next() < 0.7) shell(m, r.range(-0.3, 0.3), r.range(-0.3, 0.3), r.range(0, circle));
}

// A plain tile in an alcove of the north row may have a worn straw cushion on it, and the
// tiles before the walls now and then a sheet of notes weighted with a stone.
function plain(m, p, cell) {
  const wx = cell.x - CX,
    wz = cell.y - CZ,
    r = m.rng;
  if (wz === -CZ && hash(wx, 7.1) < 0.8) cushion(m, r.range(-0.12, 0.12), -0.18, wx, wz);
  if (wz === -CZ + 1 && hash(wx, 3.3) < 0.35) notes(m, r.range(-0.3, 0.3), r.range(-0.25, 0.3), r.range(0, circle), wx, wz);
}
function cushion(m, x, z, wx, wz) {
  const straw = lightAt(wx + x, 0.1, wz + z, rgb(0xa08a5c), 0.4),
    dark = lightAt(wx + x, 0.1, wz + z, rgb(0x6d5c3c), 0.4);
  m.lathe(x, TOP, z, [[0, 0.15], [0.03, 0.17], [0.06, 0.16], [0.075, 0.12], [0.08, 0]], straw, 14);
  for (const k of [0.07, 0.11, 0.145]) m.hoop(x, TOP + 0.075 - k * 0.15, z, k, 0.006, dark, 14);
}
function notes(m, x, z, a, wx, wz) {
  const paper = lightAt(wx + x, 0.1, wz + z, rgb(0xd9cfb2), 0.4);
  m.frame(x, TOP + 0.003, z, a, 1, () => {
    m.box(0, 0, 0, 0.16, 0.003, 0.22, paper);
    for (let k = 0; k < 6; k++) m.box(-0.06 + k * 0.024, 0.002, 0, 0.004, 0.002, 0.18, 0x3a332a);
    m.rock(0.05, 0.0, -0.08, 0.025, 0.022, 0.02, 0x5a5850, 0x77736a, 5);
  });
}

// Under a carved wall or a pillar: chips of stone at its foot.
function rockFoot(m, p, cell) {
  const r = m.rng,
    wx = cell.x - CX,
    wz = cell.y - CZ;
  for (let k = 0; k < 4; k++) {
    const a = r.range(0, circle),
      d = r.range(0.38, 0.46);
    const x = Math.cos(a) * d,
      z = Math.sin(a) * d;
    if (wz === -CZ && z < 0) continue;
    m.rock(x, TOP - 0.006, z, 0.03, 0.025, 0.025, tone(wx + x, TOP, wz + z, 0.7), tone(wx + x, TOP, wz + z, 1), 5);
  }
}

const tiles19 = {
  ground,
  plain,
  cover: bench,
  herbs: herbBed,
  reeds: shallows,
  rock: rockFoot
};

export { tiles19 };
