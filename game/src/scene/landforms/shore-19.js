// 俠客島's sea: rocks in the tide channels and under the arches, the reef round the island's
// foot, the landing at the cave's mouth where the heroes came ashore (a jetty of dressed
// blocks and the boat that brought them), and out on the sea the stacks and the far islands.
import { Model, circle } from '../scenery-kit.js';
import {
  SEA,
  ZC,
  smooth,
  rgb,
  blend,
  noise,
  hash,
  onBoard,
  boardOff,
  footRadius,
  channel,
  channelZ,
  mouth,
  floorHeight,
  lightAt,
  toward
} from './kit-19.js';
import { character } from './carving-19.js';

// A sea-worn rock: wet and dark below the tide, a pale crust of barnacles and a fringe of weed
// at it, grey and salt-streaked above. Colours go by height against the sea, wherever it sits.
function seaRock(m, x, y, z, rx, h, rz, gloom = 0.5, n = 9) {
  const r = m.rng,
    turn = r.range(0, circle),
    lean = [r.range(-0.15, 0.15) * rx, r.range(-0.15, 0.15) * rz];
  const edge = Array.from({ length: n }, () => [r.range(0.82, 1.15), r.range(-0.06, 0.06)]);
  const levels = [0, 0.12, 0.3, 0.5, 0.72, 0.9, 1];
  const scales = [0.9, 1, 0.98, 0.93, 0.8, 0.6, 0.35];
  const tone = (yy) => {
    let c = blend(rgb(0x5b5a54), rgb(0x7f7b70), 0.5 + 0.5 * Math.sin(yy * 7 + x));
    c = blend(c, rgb(0x2f332f), smooth(SEA + 0.15, SEA - 0.05, yy));
    c = blend(c, rgb(0xb3ae99), 0.75 * Math.exp(-(((yy - SEA - 0.18) / 0.07) ** 2)));
    c = blend(c, rgb(0x3f5a3c), 0.7 * Math.exp(-(((yy - SEA - 0.02) / 0.06) ** 2)));
    c = blend(c, rgb(0x9b988a), 0.3 * smooth(SEA + 0.5, SEA + 1.4, yy));
    return c;
  };
  let last;
  levels.forEach((lv, li) => {
    const ring = edge.map(([k, v], i) => {
      const a = turn + (i * circle) / n,
        s = scales[li];
      const px = x + Math.cos(a) * rx * k * s + lean[0] * lv,
        py = y + h * (lv + (lv > 0 && lv < 1 ? v : 0)),
        pz = z + Math.sin(a) * rz * k * s + lean[1] * lv;
      return [px, py, pz, lightAt(px, py, pz, tone(py), gloom)];
    });
    if (last)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        m.face(
          [last[i].slice(0, 3), ring[i].slice(0, 3), ring[j].slice(0, 3), last[j].slice(0, 3)],
          [last[i][3], ring[i][3], ring[j][3], last[j][3]]
        );
      }
    last = ring;
  });
  const peak = [x + lean[0], y + h * 1.03, z + lean[1]];
  for (let i = 0; i < n; i++)
    m.face([peak, last[(i + 1) % n].slice(0, 3), last[i].slice(0, 3)], [last[i][3], last[i][3], last[i][3]]);
}
// A clump of kelp lying on the water.
function wrack(m, x, z, s) {
  const r = m.rng;
  for (let k = 0; k < 6; k++) {
    const a = r.range(0, circle),
      pts = [];
    for (let i = 0; i < 6; i++)
      pts.push([x + Math.cos(a) * i * 0.07 * s, SEA + 0.012, z + Math.sin(a) * i * 0.07 * s + 0.04 * Math.sin(i + k)]);
    m.line(pts, 0.014 * s, r.pick([0x3d5432, 0x56603a, 0x6a5a30]), 3);
  }
}

// Rocks in the tide channels and round the arches, inside and out; the reef round the foot of
// the island's cliff.
function rocks(m) {
  const r = m.rng;
  for (const side of [-1, 1]) {
    for (let k = 0; k < 26; k++) {
      const x = side * r.range(6.75, 12.5),
        z = channelZ + r.range(-1.9, 1.9);
      if (onBoard(x, z) || boardOff(x, z) < 0.25) continue;
      const bed = floorHeight(x, z),
        s = r.range(0.12, 0.42) * (Math.abs(x) > 9 ? 1.4 : 1);
      if (channel(x, z) < 0.2 && bed > SEA + 0.1) continue;
      seaRock(m, x, Math.min(bed, SEA - 0.1) - 0.05, z, s, SEA - bed + s * r.range(0.6, 1.4), s * r.range(0.7, 1), 0.4);
      if (r.next() < 0.4) wrack(m, x + r.range(-0.3, 0.3), z + r.range(-0.3, 0.3), r.range(0.6, 1));
    }
  }
  // The reef: boulders round the cliff foot outside the wall, half awash.
  for (let k = 0; k < 120; k++) {
    const a = r.range(0, circle),
      R = footRadius(a),
      d = R + r.range(0.95, 2.6);
    const x = Math.cos(a) * d,
      z = ZC + Math.sin(a) * d;
    const bed = floorHeight(x, z);
    if (bed > SEA + 0.25) continue;
    const s = r.range(0.18, 0.6);
    seaRock(m, x, Math.max(bed, SEA - 1.2) - 0.1, z, s * r.range(0.9, 1.4), SEA - Math.max(bed, SEA - 1.2) + s * r.range(0.3, 1.1), s, 0.15, 8);
  }
  // Boulders on the ledges in the mouth.
  for (let k = 0; k < 26; k++) {
    const x = r.range(-6, 6),
      z = r.range(6.2, 10.5);
    if (Math.abs(x + 2.2) < 1.0 || boardOff(x, z) < 0.6) continue;
    const bed = floorHeight(x, z),
      s = r.range(0.14, 0.45);
    seaRock(m, x, bed - 0.08, z, s * 1.2, s * r.range(0.6, 1.2), s, 0.3, 8);
  }
}

// The landing: a jetty of dressed blocks from the mouth's ledge out into the sea, with stone
// bollards, and a step down at its end where a boat can lie.
const JETTY = { x: -2.2, z0: 6.9, z1: 10.5, w: 1.0, top: -0.02 };
function jetty(m) {
  const { x, z0, z1, w, top } = JETTY,
    r = m.rng;
  const wood = (k, y) => {
    let c = blend(rgb(0x6b5a45), rgb(0x8a7a62), hash(k, 5.1));
    c = blend(c, rgb(0x2c2a24), smooth(SEA + 0.2, SEA - 0.05, y));
    c = blend(c, rgb(0x55693f), 0.5 * Math.exp(-(((y - SEA) / 0.06) ** 2)));
    return lightAt(x, y, z0 + 1, c, 0.2);
  };
  // A stone abutment on the ledge, then the timber stage on its piles.
  const bed0 = floorHeight(x, z0);
  m.box(x, (top + bed0 - 0.3) / 2, z0 + 0.1, w * 1.1, top - bed0 + 0.3, 0.7, lightAt(x, top, z0, rgb(0x5d5a52), 0.3));
  m.box(x, top - 0.02, z0 + 0.1, w * 1.12, 0.05, 0.72, lightAt(x, top, z0, rgb(0x79756a), 0.3));
  let k = 0;
  for (let z = z0 + 0.7; z <= z1 + 0.01; z += 0.85, k++) {
    const bed = Math.min(floorHeight(x, z), SEA - 0.3);
    for (const s of [-1, 1]) {
      const px = x + s * w * 0.42,
        tall = z > z1 - 0.5 ? 0.32 : 0;
      for (let y = bed; y < top + tall - 0.05; y += 0.25)
        m.tube([px, y, z], [px, Math.min(top + tall, y + 0.26), z], 0.06, 0.058, wood(k * 7 + s, y + 0.12), 7);
      if (tall) m.hoop(px, top + 0.15, z, 0.075, 0.015, 0x9a8a62, 10);
    }
    m.box(x, top - 0.1, z, w, 0.08, 0.11, wood(k, top));
  }
  for (const s of [-1, 1]) m.box(x + s * w * 0.3, top - 0.05, (z0 + 0.45 + z1) / 2, 0.09, 0.07, z1 - z0 - 0.45, wood(s + 9, top));
  // The deck: planks laid across, weathered unevenly, one or two sprung or missing.
  let i = 0;
  for (let z = z0 + 0.47; z < z1 + 0.1; z += 0.155, i++) {
    if (hash(i, 3.3) < 0.06) continue;
    const lift = hash(i, 4.4) < 0.1 ? 0.02 : 0;
    m.frame(x, top + lift, z, 0.03 * (hash(i, 6.6) - 0.5), 1, () =>
      m.box(0, 0, 0, w * (0.98 + 0.06 * hash(i, 7)), 0.035, 0.14, wood(i + 20, top))
    );
  }
  // A ladder of rungs down to the water at the end.
  for (let k = 0; k < 4; k++) m.box(x, top - 0.12 - k * 0.16, z1 + 0.12, w * 0.5, 0.03, 0.05, wood(40 + k, top - 0.1 - k * 0.16));
  return [x + w * 0.42, top + 0.2, z1 - 0.04];
}
// A net hung to dry over two rocks by the landing, sagging between them.
function net(m, x, z, yaw) {
  const y = floorHeight(x, z);
  m.frame(x, y, z, yaw, 1, () => {
    m.rock(-0.5, -0.05, 0, 0.2, 0.42, 0.18, 0x55534c, 0x77736a, 7);
    m.rock(0.5, -0.05, 0.05, 0.18, 0.36, 0.16, 0x55534c, 0x77736a, 7);
    const at = (u, v) => [u, 0.4 - 0.25 * (1 - (u / 0.5) ** 2) - v * 0.35 + 0.04 * Math.sin(u * 9 + v * 5), v * 0.35];
    for (let j = 0; j <= 5; j++) {
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push(at(-0.5 + i * 0.1, j / 5));
      m.line(pts, 0.006, 0x8c7c58, 3);
    }
    for (let i = 0; i <= 10; i++) {
      const pts = [];
      for (let j = 0; j <= 5; j++) pts.push(at(-0.5 + i * 0.1, j / 5));
      m.line(pts, 0.006, 0x8c7c58, 3);
    }
    for (let i = 0; i < 4; i++) m.lathe(-0.4 + i * 0.27, 0.2 - 0.12 * Math.sin(i * 1.1), 0.01, [[0, 0.03], [0.03, 0.035], [0.06, 0.03]], 0xc9a85a, 7);
  });
}
// The drift line of the highest tide across the mouth: weed, shells, a crab's cast.
function driftLine(m) {
  const r = m.rng;
  for (let x = -5.6; x <= 5.6; x += 0.3) {
    if (Math.abs(x - JETTY.x) < 0.7) continue;
    let z = 6.2;
    while (z < 11 && floorHeight(x, z) > SEA + 0.12) z += 0.05;
    if (z >= 11) continue;
    const y = floorHeight(x, z) + 0.01;
    const a = r.range(-0.6, 0.6);
    const pts = [];
    for (let i = 0; i < 5; i++) pts.push([x + Math.cos(a) * i * 0.06, y + 0.004, z - 0.04 + Math.sin(a) * i * 0.06 + 0.02 * Math.sin(i * 2 + x)]);
    m.line(pts, 0.009, r.pick([0x5a6040, 0x6b6a48, 0x7a6a44, 0x5e5a3c]), 3);
    if (r.next() < 0.25) {
      const sx = x + r.range(-0.1, 0.1),
        sz = z - r.range(0.05, 0.2);
      m.rock(sx, floorHeight(sx, sz), sz, 0.03, 0.02, 0.025, 0xc9bca4, 0xe0d6c4, 5);
    }
  }
}

// The boat that brought the heroes: a sampan with a mat awning over its waist, its sculling
// oar shipped, made fast to the jetty's last bollard.
function sampan(m, bx, bz, yaw, post) {
  m.frame(bx, SEA - 0.05, bz, yaw, 1, () => {
    const len = 2.5,
      beam = 0.42,
      n = 12;
    const sections = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        z = -len / 2 + len * t;
      const fullness = Math.sin(Math.PI * t) ** 0.55,
        sheer = 0.36 + 0.14 * Math.abs(t - 0.5) * 2;
      const half = beam * fullness + 0.02;
      sections.push([
        [-half, sheer, z],
        [-half * 0.92, 0.12, z],
        [-half * 0.5, 0.0, z],
        [0, -0.04 * fullness, z],
        [half * 0.5, 0.0, z],
        [half * 0.92, 0.12, z],
        [half, sheer, z]
      ]);
    }
    for (let i = 0; i < n; i++)
      for (let k = 0; k < 6; k++) {
        const plank = blend(rgb(0x6a4c31), rgb(0x8a6744), (k % 2) * 0.4 + 0.2 * hash(i, k));
        const tar = k === 2 || k === 3 ? blend(plank, rgb(0x2b2621), 0.5) : plank;
        m.face([sections[i][k + 1], sections[i + 1][k + 1], sections[i + 1][k], sections[i][k]], tar);
      }
    // Gunwales, thwarts and a floor of boards.
    for (const s of [0, 6]) m.line(sections.map((sec) => [sec[s][0], sec[s][1] + 0.015, sec[s][2]]), 0.022, 0x4f3a27, 5);
    for (const t of [0.3, 0.7]) {
      const i = Math.round(t * n),
        h = sections[i][6][0];
      m.box(0, 0.3, sections[i][0][2], h * 2, 0.03, 0.1, 0x7a5a3a);
    }
    m.box(0, 0.06, 0, 0.5, 0.02, len * 0.7, 0x5e4630);
    // The awning: hoops of split bamboo under a mat.
    const hoops = [-0.35, -0.12, 0.12, 0.35];
    for (const z of hoops) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI * (i / 8);
        pts.push([Math.cos(a) * 0.42, 0.33 + Math.sin(a) * 0.36, z]);
      }
      m.line(pts, 0.012, 0x8a7448, 4);
    }
    for (let i = 0; i < 8; i++) {
      const a0 = Math.PI * (i / 8),
        a1 = Math.PI * ((i + 1) / 8);
      const p = (a, z) => [Math.cos(a) * 0.43, 0.33 + Math.sin(a) * 0.37, z];
      m.face([p(a0, -0.42), p(a1, -0.42), p(a1, 0.42), p(a0, 0.42)], i % 2 ? 0x8f7b52 : 0x7d6b46);
    }
    // The sculling oar along the side, a coil of rope, a jar.
    m.line([[0.32, 0.4, -1.3], [0.28, 0.42, 0.6]], 0.02, 0x7a5a38, 5);
    m.box(0.27, 0.42, 0.72, 0.08, 0.015, 0.3, 0x7a5a38);
    m.hoop(-0.2, 0.08, 0.85, 0.08, 0.018, 0x9b8a62, 10);
    m.lathe(0.15, 0.06, -0.8, [[0, 0.06], [0.08, 0.1], [0.18, 0.08], [0.22, 0.04], [0.25, 0.05]], 0x5b4632, 9);
  });
  // The painter, from the bow to the bollard.
  const bow = [bx + Math.sin(yaw) * 1.2, SEA + 0.35, bz + Math.cos(yaw) * 1.2];
  const mid = [(bow[0] + post[0]) / 2, Math.min(bow[1], post[1]) - 0.12, (bow[2] + post[2]) / 2];
  m.line([bow, mid, post], 0.012, 0xa08f66, 4);
}

// Boulders fallen from the wall, lying on the talus at its foot inside the hall.
function talus(m) {
  const r = m.rng;
  for (let k = 0; k < 130; k++) {
    const a = r.range(0, circle),
      R = footRadius(a),
      d = R - r.range(0.1, 1.45);
    const x = Math.cos(a) * d,
      z = ZC + Math.sin(a) * d;
    if (boardOff(x, z) < 0.5 || channel(x, z) > 0.05 || mouth(x, z) > 0.2) continue;
    const y = floorHeight(x, z),
      s = r.range(0.08, 0.42) * (d > R - 0.6 ? 1.3 : 0.8);
    const col = lightAt(x, y, z, rgb(r.pick([0x4a4944, 0x55534d, 0x5f5c55])), 0.8),
      cap = lightAt(x, y + s, z, rgb(r.pick([0x6e6b63, 0x7b776d])), 0.8);
    m.rock(x, y - s * 0.25, z, s, s * r.range(0.6, 1.1), s * r.range(0.6, 0.95), col, cap, 8, r.range(0, circle));
  }
  // Pebbles and grit spread over the floor round the board.
  for (let k = 0; k < 260; k++) {
    const x = r.range(-8.5, 8.5),
      z = r.range(-6.6, 7.5);
    const off = boardOff(x, z);
    if (off < 0.12 || off > 2.6 || channel(x, z) > 0.2) continue;
    const y = floorHeight(x, z);
    if (y < SEA + 0.05) continue;
    const s = r.range(0.025, 0.07);
    const c = lightAt(x, y, z, rgb(r.pick([0x5c5a54, 0x6f6c64, 0x847f73, 0x4c4b46])), 0.8);
    m.rock(x, y - 0.01, z, s, s * 0.6, s * 0.8, c, blend(c, rgb(0x9a958a), 0.3), 6);
  }
}
// The strand in the mouth: the heroes' footprints from the jetty to the board, pools left by
// the tide on the ledges, driftwood, and the island's name stone by the landing.
function strand(m) {
  const r = m.rng;
  const trails = [
    [[-2.2, 6.95], [-1.6, 6.3], [-1.1, 5.6]],
    [[-2.0, 6.95], [-0.9, 6.4], [0.1, 5.6]],
    [[-2.35, 6.95], [-0.2, 6.6], [1.2, 5.6]],
    [[-2.5, 6.9], [-2.6, 6.2], [-2.2, 5.6]]
  ];
  for (const path of trails) {
    let side = 1;
    for (let s = 1; s < path.length; s++) {
      const [ax, az] = path[s - 1],
        [bx, bz] = path[s],
        len = Math.hypot(bx - ax, bz - az);
      const dx = (bx - ax) / len,
        dz = (bz - az) / len;
      for (let t = 0.1; t < len; t += 0.17) {
        side = -side;
        const x = ax + dx * t - dz * 0.05 * side + r.range(-0.015, 0.015),
          z = az + dz * t + dx * 0.05 * side;
        const y = floorHeight(x, z) + 0.006,
          yaw = Math.atan2(dx, dz);
        const c = lightAt(x, y, z, rgb(0x4a463d), 0.5);
        const ring = [];
        for (let i = 0; i < 7; i++) {
          const a = (i * circle) / 7,
            u = Math.cos(a) * 0.03,
            v = Math.sin(a) * 0.055;
          ring.push([x + u * Math.cos(yaw) + v * Math.sin(yaw), y, z - u * Math.sin(yaw) + v * Math.cos(yaw)]);
        }
        toward(m, ring, c);
      }
    }
  }
  // Pools on the ledges, each a mirror of dark water in a pale rim.
  let pools = 0;
  for (let k = 0; k < 200 && pools < 5; k++) {
    const x = r.range(-5.5, 5.5),
      z = r.range(6.0, 10.0);
    const y = floorHeight(x, z);
    if (y < SEA + 0.04 || y > SEA + 0.35 || Math.abs(x - JETTY.x) < 0.9) continue;
    pools++;
    const rx = r.range(0.15, 0.45),
      rz = rx * r.range(0.5, 0.9),
      ring = [],
      rim = [];
    for (let i = 0; i < 12; i++) {
      const a = (i * circle) / 12,
        q = 0.85 + 0.3 * hash(x * 3 + i, z);
      ring.push([x + Math.cos(a) * rx * q, y + 0.025, z + Math.sin(a) * rz * q]);
      rim.push([x + Math.cos(a) * (rx * q + 0.05), y + 0.02, z + Math.sin(a) * (rz * q + 0.05)]);
    }
    for (let i = 0; i < 12; i++) {
      const j = (i + 1) % 12;
      toward(m, [rim[i], rim[j], ring[j], ring[i]], [lightAt(...rim[i], rgb(0x55554e), 0.5), lightAt(...rim[j], rgb(0x55554e), 0.5), rgb(0x3a4a48), rgb(0x3a4a48)]);
    }
    toward(m, ring, rgb(0x3a4f50));
    for (let i = 0; i < 3; i++) m.rock(x + r.range(-rx, rx) * 0.6, y, z + r.range(-rz, rz) * 0.6, 0.03, 0.04, 0.025, 0x3d4a3a, 0x8c8a74, 5);
  }
  // Driftwood, bleached grey, thrown up at the highest tide.
  for (const [x, z, yaw, l] of [
    [3.2, 7.4, 0.4, 1.3],
    [-4.6, 7.9, -0.7, 0.9],
    [5.1, 6.6, 1.6, 0.8]
  ]) {
    const y = floorHeight(x, z) + 0.05;
    const a = [x - Math.sin(yaw) * l * 0.5, y, z - Math.cos(yaw) * l * 0.5],
      b = [x + Math.sin(yaw) * l * 0.5, y + 0.03, z + Math.cos(yaw) * l * 0.5];
    m.tube(a, b, 0.07, 0.05, 0x8f877a, 7);
    m.tube([x, y + 0.02, z], [x + 0.25, y + 0.12, z - 0.15], 0.025, 0.015, 0x9a9284, 5);
  }
  // 俠客島's name stone at the head of the landing: a rough slab set on end, three great
  // characters cut down its face.
  const sx = -3.55,
    sz = 7.0,
    sy = floorHeight(sx, sz);
  m.frame(sx, sy, sz, 0.35, 1, () => {
    m.rock(0, -0.15, 0, 0.5, 0.35, 0.36, 0x4d4b45, 0x6a675e, 8);
    const face = [];
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (i / 8);
      face.push([Math.cos(a) * 0.3, 1.25 + Math.sin(a) * 0.18]);
    }
    const outline = [[0.3, 0.05], ...face, [-0.3, 0.05]];
    const front = outline.map(([u, v]) => [u, v, 0.08]),
      back = outline.map(([u, v]) => [u * 1.02, v, -0.08]);
    const stone = lightAt(sx, 0.8, sz, rgb(0x6d6a61), 0.3),
      side = lightAt(sx, 0.8, sz, rgb(0x55534c), 0.3);
    toward(m, front, stone, [0, 0, 1]);
    toward(m, back, side, [0, 0, -1]);
    for (let i = 0; i < outline.length - 1; i++)
      m.face([back[i], back[i + 1], front[i + 1], front[i]], side);
    m.face([back.at(-1), back[0], front[0], front.at(-1)], side);
    const dark = lightAt(sx, 0.8, sz, rgb(0x23221f), 0.3),
      lip = lightAt(sx, 0.8, sz, rgb(0x9c978a), 0.3);
    m.frame(0, 0, 0.082, 0, 1, () => {
      for (let k = 0; k < 3; k++) character(m, 0, 1.12 - k * 0.32, 0.27, 900 + k * 17, dark, lip, 0.016);
    });
  });
}

function shore(T) {
  const m = new Model(T, 196013);
  rocks(m);
  talus(m);
  strand(m);
  const post = jetty(m);
  sampan(m, JETTY.x + 1.05, JETTY.z1 - 0.6, Math.PI + 0.12, post);
  wrack(m, JETTY.x - 1.1, 9.2, 1.2);
  wrack(m, 3.5, 9.6, 1.0);
  net(m, -4.3, 6.55, 0.5);
  driftLine(m);
  return m.finish('海門礁石與南口渡頭');
}

// Far out: stacks of the island's rock standing in the sea, and other islands in the haze.
function farSea(T) {
  const m = new Model(T, 196411),
    r = m.rng;
  const stacks = [
    [-15.5, 13.5, 1.6, 5.5],
    [-11.8, 17.2, 1.0, 3.2],
    [6.5, 18.5, 1.3, 4.4],
    [17.5, 9.5, 1.2, 3.6],
    [-19, -3, 1.5, 4.8],
    [19.5, -6.5, 1.8, 6.2],
    [13.0, 15.5, 0.7, 2.1]
  ];
  for (const [x, z, s, h] of stacks) {
    const n = 11,
      rows = 9;
    const poly = Array.from({ length: n }, (_, i) => [(i * circle) / n + r.range(-0.1, 0.1), r.range(0.8, 1.15)]);
    let prev;
    for (let k = 0; k <= rows; k++) {
      const t = k / rows,
        y = SEA - 0.8 + (h + 0.8) * t,
        taper = 1 - 0.45 * t ** 1.5 + (k % 2 ? 0.04 : 0);
      const ring = poly.map(([a, q]) => {
        let c = blend(rgb(0x5d5f5c), rgb(0x8a8a80), 0.4 + 0.4 * Math.sin(y * 2.3 + a));
        c = blend(c, rgb(0x2f3532), smooth(SEA + 0.4, SEA - 0.1, y));
        c = blend(c, rgb(0xb9b6a6), 0.6 * Math.exp(-(((y - SEA - 0.3) / 0.15) ** 2)));
        if (k === rows) c = blend(c, rgb(0x6e7a52), 0.6);
        return [x + Math.cos(a) * s * q * taper, y, z + Math.sin(a) * s * q * taper * 0.8, c];
      });
      if (prev)
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          m.face(
            [prev[i].slice(0, 3), ring[i].slice(0, 3), ring[j].slice(0, 3), prev[j].slice(0, 3)],
            [prev[i][3], ring[i][3], ring[j][3], prev[j][3]]
          );
        }
      prev = ring;
    }
    m.face([...prev].reverse().map((p) => p.slice(0, 3)), rgb(0x6e7a52));
    // Gulls' white on the top, scrub in the crevices.
    for (let k = 0; k < 5; k++) {
      const a = r.range(0, circle);
      m.rock(x + Math.cos(a) * s * 0.4, SEA + h - 0.1, z + Math.sin(a) * s * 0.3, 0.2 * s, 0.25, 0.15 * s, 0x5d6a45, 0x7d8a5a, 6);
    }
  }
  // Islands on the horizon: low humps, blue in the haze.
  for (let k = 0; k < 9; k++) {
    const a = -0.4 + (k / 9) * circle * 0.9 + r.range(-0.15, 0.15),
      d = r.range(38, 60);
    const x = Math.cos(a) * d,
      z = Math.sin(a) * d,
      w = r.range(4, 11),
      h = r.range(1.2, 4.2);
    const n = 16;
    let prev;
    for (const [t, q] of [
      [0, 1],
      [0.35, 0.8],
      [0.7, 0.48],
      [1, 0.12]
    ]) {
      const ring = [];
      for (let i = 0; i < n; i++) {
        const b = (i * circle) / n;
        ring.push([x + Math.cos(b) * w * q * (0.9 + 0.2 * noise(i, k)), SEA - 0.3 + h * t, z + Math.sin(b) * w * 0.4 * q]);
      }
      if (prev)
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          m.face([prev[i], ring[i], ring[j], prev[j]], m.mix(0x6f8288, 0x8fa0a2, t));
        }
      prev = ring;
    }
  }
  return m.finish('海上石柱與遠島', { distant: true, cast: false });
}

export { shore, farSea, seaRock, JETTY };
