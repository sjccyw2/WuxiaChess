// 俠客島's carved walls (石壁). On each rock tile of the north row a pier of the island's rock
// stands out from the cave wall; its face is dressed flat and framed, and cut with four lines
// of the poem 〈俠客行〉 in large characters, right to left. Beside and below them are the
// figures the poem stands for, in low relief (swordsmen in their stances, a seated man with
// the paths of his breath drawn through him, swords and footwork), and round them, crowded in
// every gap, the small annotations of the scholars who have studied the walls for decades.
// No character is legible from the camera; the strokes are cut as Chinese is cut, so the wall
// reads as writing.
import { Model, circle } from '../scenery-kit.js';
import { TOP, smooth, rgb, blend, noise, hash, walls, lightAt, toward, Shell, fromInside } from './kit-19.js';

const FRONT = -4.72; // the dressed face of every pier
const PANEL = { x0: -0.37, x1: 0.37, y0: 0.9, y1: 2.84 };

// One pier of rock, from below the floor up into the wall, its face flat where it is dressed.
// Its foot, up to DADO, goes in `low`, a group that never fades: from the usual cameras it
// stands over its own rock tile, and is no taller than a lamp; the rest goes in `m`.
const DADO = 0.86;
function pier(m, low, wx, salt) {
  const back = -7.0;
  const heights = [-0.12, 0.22, 0.52, DADO];
  for (let k = 1; k <= 13; k++) heights.push(DADO + ((3.83 - DADO) * k) / 13);
  const outline = [];
  // Front edge (dressed, straight), then the rough flanks and the back buried in the wall.
  for (let i = 0; i <= 4; i++) outline.push([-0.46 + (0.92 * i) / 4, 0, 'front']);
  outline.push([0.49, -0.35, 'side'], [0.5, -0.8, 'side'], [0.52, -1.3, 'side'], [0.4, back - FRONT, 'back']);
  outline.push([-0.4, back - FRONT, 'back'], [-0.52, -1.3, 'side'], [-0.5, -0.8, 'side'], [-0.49, -0.35, 'side']);
  // Wound like the kit's lathes, so the faces turn outward.
  outline.reverse();
  const n = outline.length;
  let prev;
  heights.forEach((y, k) => {
    // Above the panel the rock leans back into the wall and narrows.
    const recede = 0.95 * smooth(3.0, 3.9, y) + 0.08 * smooth(2.9, 3.05, y);
    const ring = outline.map(([u, v, kind], i) => {
      const rough = kind === 'front' && y > 0.2 && y < 3.0 ? 0 : 1;
      const wob = rough * (0.045 * (noise(u * 6 + salt, y * 2.2) - 0.5) + 0.025 * Math.sin(y * 9 + i));
      const narrow = 1 - 0.18 * smooth(3.0, 3.9, y);
      const x = wx + u * narrow + (kind === 'side' ? Math.sign(u) * wob : 0),
        z = FRONT + v - recede + (kind === 'front' ? wob : 0);
      const band = 0.5 + 0.5 * Math.sin(y * 3.4 + salt);
      let c = blend(rgb(0x5a5a56), rgb(0x76746b), 0.3 + 0.5 * band);
      if (kind === 'front' && !rough) c = rgb(0x8d897d);
      c = blend(c, rgb(0x141516), 0.65 * smooth(2.9, 4.0, y));
      c = blend(c, rgb(0x3e3d38), 0.4 * smooth(0.5, -0.1, y));
      return [x, y, z, lightAt(x, y, z, c, 0.5)];
    });
    const into = y <= DADO ? low : m;
    // The base is closed at the top, so that with the wall folded away it shows as cut stone.
    if (y === DADO) {
      const mid = ring.reduce((t, p) => [t[0] + p[0] / n, t[1], t[2] + p[2] / n], [0, DADO, 0]);
      const cut = lightAt(mid[0], DADO, mid[2], rgb(0x6d6a62), 0.3);
      for (let i = 0; i < n; i++) toward(low, [ring[i].slice(0, 3), ring[(i + 1) % n].slice(0, 3), mid], cut);
    }
    if (prev)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        into.face(
          [prev[i].slice(0, 3), ring[i].slice(0, 3), ring[j].slice(0, 3), prev[j].slice(0, 3)],
          [prev[i][3], ring[i][3], ring[j][3], prev[j][3]]
        );
      }
    prev = ring;
  });
  // The dado under the panel: a moulded base with a band of waves cut between its mouldings,
  // standing on a plinth of set stones.
  const L = (c, y) => lightAt(wx, y, FRONT + 0.2, rgb(c), 0.5);
  for (let k = 0; k < 3; k++) {
    const x = wx - 0.31 + k * 0.31;
    const c = lightAt(x, 0.1, FRONT, rgb(0x6c6a62), 0.5);
    low.box(x, TOP + 0.07, FRONT + 0.05, 0.3, 0.14, 0.12, c);
    low.box(x, TOP + 0.145, FRONT + 0.05, 0.29, 0.012, 0.11, blend(c, rgb(0x9a958a), 0.4));
  }
  for (const [y, r] of [
    [0.3, 0.02],
    [0.8, 0.024]
  ])
    low.tube([wx - 0.44, y, FRONT + 0.01], [wx + 0.44, y, FRONT + 0.01], r, r, L(0x9e998c, y), 6);
  low.frame(wx, 0, FRONT + 0.004, 0, 1, () => {
    const dark = L(0x2d2c29, 0.5),
      lip = L(0xb8b2a3, 0.5);
    for (const v of [0.45, 0.62]) {
      const wave = [];
      for (let i = 0; i <= 24; i++) {
        const u = -0.4 + (0.8 * i) / 24;
        wave.push([u, v + 0.035 * Math.sin(i * 1.35 + v * 9)]);
      }
      incise(low, wave, 0.006, dark, lip);
    }
  });
}

// An incised stroke: a dark groove along a path on the face, with the lit lip below it.
function incise(m, pts, w, dark, lip) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1],
      [bx, by] = pts[i];
    const dx = bx - ax,
      dy = by - ay,
      l = Math.hypot(dx, dy) || 1;
    const nx = (-dy / l) * w,
      ny = (dx / l) * w;
    toward(
      m,
      [
        [ax - nx, ay - ny, 0.004],
        [bx - nx, by - ny, 0.004],
        [bx + nx, by + ny, 0.004],
        [ax + nx, ay + ny, 0.004]
      ],
      dark,
      [0, 0, 1]
    );
    // The smallest notes are too fine for a lip to show.
    if (w < 0.004) continue;
    toward(
      m,
      [
        [ax - nx, ay - ny - w * 0.9, 0.0035],
        [bx - nx, by - ny - w * 0.9, 0.0035],
        [bx - nx, by - ny, 0.0035],
        [ax - nx, ay - ny, 0.0035]
      ],
      lip,
      [0, 0, 1]
    );
  }
}
// The strokes of one character in a cell of size s centred at (cx, cy): one, two or three
// parts, each built of the strokes Chinese is written with.
function character(m, cx, cy, s, seed, dark, lip, w) {
  const h = (k) => hash(seed * 1.37 + k * 0.71, seed * 0.29 - k * 1.13);
  const parts = h(0) < 0.45 ? [[-0.5, 0.5, -0.5, 0.5]] : h(0) < 0.8 ? [[-0.5, -0.05, -0.5, 0.5], [0.05, 0.5, -0.5, 0.5]] : [[-0.5, 0.5, 0.05, 0.5], [-0.5, 0.5, -0.5, -0.02]];
  let k = 1;
  for (const [u0, u1, v0, v1] of parts) {
    const n = 2 + Math.floor(h(k++) * 3);
    for (let j = 0; j < n; j++) {
      const t = h(k++),
        a = u0 + (u1 - u0) * (0.15 + 0.7 * h(k++)),
        b = v0 + (v1 - v0) * (0.12 + 0.76 * h(k++));
      const P = (u, v) => [cx + u * s, cy + v * s];
      let pts;
      if (t < 0.32) pts = [P(u0 + 0.05, b), P(u1 - 0.05, b + 0.03)]; // 橫
      else if (t < 0.56) pts = [P(a, v1 - 0.04), P(a, v0 + 0.04)]; // 豎
      else if (t < 0.72) pts = [P(a + 0.12, v1 - 0.06), P(a, b), P(a - 0.2, v0 + 0.06)]; // 撇
      else if (t < 0.86) pts = [P(a - 0.1, b + 0.15), P(a + 0.08, b - 0.05), P(a + 0.25, v0 + 0.05)]; // 捺
      else if (t < 0.95) pts = [P(a, b + 0.06), P(a + 0.06, b - 0.04)]; // 點
      else pts = [P(u0 + 0.05, b), P(u1 - 0.08, b), P(u1 - 0.08, v0 + 0.08), P(u1 - 0.16, v0 + 0.14)]; // 橫折鉤
      incise(m, pts, w, dark, lip);
    }
  }
}
// A column of small annotation characters, from (x, top) downward.
function annotate(m, x, top, bottom, s, seed, dark, lip) {
  for (let y = top - s / 2, k = 0; y > bottom + s / 2; y -= s * 1.2, k++)
    character(m, x, y, s, seed * 31 + k, dark, lip, s * 0.075);
}
// A figure in low relief, raised a little from the face: head, body and limbs as rounded
// strokes, posed by the angles given (radians from straight down for each limb).
function figure(m, x, y, s, pose, col) {
  const R = 0.011 * s * 2;
  const at = (p) => [x + p[0] * s, y + p[1] * s, 0.006];
  const hip = [0, 0.42 + pose.crouch * -0.08],
    neck = [pose.lean * 0.25, hip[1] + 0.34];
  const limb = (from, a, l) => [from[0] + Math.sin(a) * l, from[1] - Math.cos(a) * l];
  const knees = pose.legs.map((a) => limb(hip, a[0], 0.22)),
    feet = pose.legs.map((a, i) => limb(knees[i], a[1], 0.22));
  const elbows = pose.arms.map((a) => limb(neck, a[0], 0.16)),
    hands = pose.arms.map((a, i) => limb(elbows[i], a[1], 0.15));
  m.line([at(hip), at(neck)], R * 1.5, col, 5);
  for (let i = 0; i < 2; i++) {
    m.line([at(hip), at(knees[i]), at(feet[i])], R, col, 5);
    m.line([at(neck), at(elbows[i]), at(hands[i])], R * 0.9, col, 5);
  }
  const head = at([neck[0] + pose.lean * 0.05, neck[1] + 0.09]);
  m.lathe(head[0], head[1] - 0.045 * s, head[2] - 0.004, [[0, 0.002], [0.02 * s, 0.035 * s], [0.06 * s, 0.04 * s], [0.09 * s, 0.002]], col, 7);
  if (pose.sword) {
    const hand = hands[pose.sword - 1],
      a = pose.swordAngle;
    m.line([at(hand), at([hand[0] + Math.sin(a) * 0.42, hand[1] + Math.cos(a) * 0.42])], R * 0.5, col, 4);
  }
  return { hands: hands.map(at), feet: feet.map(at), neck: at(neck), hip: at(hip) };
}
const POSES = [
  { legs: [[-0.5, 0.1], [0.45, 0.2]], arms: [[-1.9, -2.5], [1.2, 2.0]], lean: 0.1, crouch: 0.5, sword: 2, swordAngle: 0.6 },
  { legs: [[-0.2, 0.0], [1.1, 1.6]], arms: [[-2.6, -3.0], [2.2, 1.6]], lean: -0.1, crouch: 0, sword: 1, swordAngle: -0.3 },
  { legs: [[-0.7, -0.2], [0.7, 0.2]], arms: [[-1.5, -1.5], [1.5, 1.5]], lean: 0, crouch: 0.7 },
  { legs: [[-0.3, 0.4], [0.8, -0.2]], arms: [[-0.6, -2.2], [2.6, 2.9]], lean: 0.2, crouch: 0.3, sword: 2, swordAngle: 1.2 },
  { legs: [[0.2, 0.1], [1.5, 0.6]], arms: [[-2.0, -1.2], [0.9, 2.4]], lean: 0.25, crouch: 0.2 },
  { legs: [[-1.3, -1.5], [1.3, 1.5]], arms: [[-1.0, -0.4], [1.0, 0.4]], lean: 0, crouch: 1.0 }
];
// A seated figure with the paths of its breath drawn through it and the points marked.
function meridians(m, x, y, s, dark, lip, col) {
  const f = figure(m, x, y, s, POSES[5], col);
  const path = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    path.push([x + 0.05 * s * Math.sin(t * 7), y + s * (0.3 + 0.55 * t)]);
  }
  incise(m, path, 0.004, dark, lip);
  for (let i = 0; i < 7; i++) {
    const [px, py] = path[1 + i];
    incise(m, [[px - 0.007, py], [px + 0.007, py + 0.004]], 0.007, dark, lip);
  }
  incise(m, [[f.neck[0], f.neck[1]], [f.hands[0][0], f.hands[0][1]]], 0.003, dark, lip);
  incise(m, [[f.neck[0], f.neck[1]], [f.hands[1][0], f.hands[1][1]]], 0.003, dark, lip);
}
// Footwork: footprints round a ring, with arrows of the order of the steps.
function footwork(m, x, y, s, dark, lip) {
  const ring = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i * circle) / 16;
    ring.push([x + Math.cos(a) * s, y + Math.sin(a) * s * 0.55]);
  }
  incise(m, ring, 0.003, dark, lip);
  for (let i = 0; i < 6; i++) {
    const a = (i * circle) / 6 + 0.3,
      px = x + Math.cos(a) * s,
      py = y + Math.sin(a) * s * 0.55;
    incise(m, [[px - 0.008, py - 0.012], [px + 0.004, py + 0.014]], 0.008, dark, lip);
  }
}

// The face of one carved wall: frame, head, the poem's lines, the figures, the annotations.
function panel(m, wx, index) {
  const y = (PANEL.y0 + PANEL.y1) / 2;
  const L = (c, yy = y) => lightAt(wx, yy, FRONT + 0.3, rgb(c), 0.45);
  const field = L(0x9b968a),
    border = L(0xa7a295),
    dark = L(0x2c2b28),
    lip = L(0xc2bcad),
    relief = L(0xa8a294);
  m.frame(wx, 0, FRONT + 0.002, 0, 1, () => {
    const { x0, x1, y0, y1 } = PANEL;
    // The dressed field, a hair proud of the pier.
    m.face(
      [
        [x0, y0, 0.002],
        [x1, y0, 0.002],
        [x1, y1, 0.002],
        [x0, y1, 0.002]
      ],
      [L(0x8e897d, y0), L(0x8e897d, y0), field, field]
    );
    // A raised moulding round it, with a round-headed top over the poem.
    const rim = (a, b) => m.tube([a[0], a[1], 0.006], [b[0], b[1], 0.006], 0.016, 0.016, border, 5);
    rim([x0 - 0.02, y0 - 0.02], [x1 + 0.02, y0 - 0.02]);
    rim([x0 - 0.02, y0 - 0.02], [x0 - 0.02, y1 - 0.05]);
    rim([x1 + 0.02, y0 - 0.02], [x1 + 0.02, y1 - 0.05]);
    let prev = [x0 - 0.02, y1 - 0.05];
    for (let i = 1; i <= 10; i++) {
      const t = Math.PI - (i / 10) * Math.PI,
        p = [Math.cos(t) * (x1 + 0.02), y1 - 0.05 + Math.sin(t) * 0.16];
      rim(prev, p);
      prev = p;
    }
    // The head: cloud scrolls in relief either side of a blank seal.
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const a = (i / 14) * circle * 1.3,
          rr = 0.055 * (1 - i / 18);
        pts.push([s * 0.16 + Math.cos(a) * rr * s, y1 + 0.02 + Math.sin(a) * rr, 0.006]);
      }
      m.line(pts, 0.007, relief, 4);
    }
    m.box(0, y1 + 0.03, 0.006, 0.08, 0.08, 0.008, L(0x8a8478));
    incise(m, [[-0.025, y1 + 0.03], [0.025, y1 + 0.03]], 0.004, dark, lip);
    incise(m, [[0, y1 + 0.055], [0, y1 + 0.005]], 0.004, dark, lip);
    // Four lines of the poem, five characters each, right to left at the top.
    const S = 0.112;
    for (let c = 0; c < 4; c++) {
      const cx = x1 - 0.07 - c * 0.143;
      for (let k = 0; k < 5; k++)
        character(m, cx, y1 - 0.1 - k * 0.128, S, index * 97 + c * 13 + k * 3 + 1, dark, lip, 0.0085);
    }
    // Beneath them, the figures, different on every wall, with the scholars' notes round them.
    const v = index % 3;
    if (v === 0) {
      figure(m, x0 + 0.19, 1.2, 0.56, POSES[(index + 0) % 5], relief);
      figure(m, x1 - 0.18, 1.24, 0.48, POSES[(index + 2) % 5], relief);
    } else if (v === 1) {
      meridians(m, 0, 1.18, 0.62, dark, lip, relief);
    } else {
      figure(m, x0 + 0.17, 1.2, 0.52, POSES[(index + 1) % 5], relief);
      footwork(m, x1 - 0.17, 1.5, 0.11, dark, lip);
      for (let k = 0; k < 3; k++)
        incise(m, [[x1 - 0.3 + k * 0.05, 1.04], [x1 - 0.24 + k * 0.05, 1.3]], 0.0045, dark, lip);
    }
    // The notes: small columns wherever there is room, by many hands.
    const small = 0.034;
    for (let k = 0; k < 4; k++) annotate(m, x0 + 0.035 + k * 0.045, y1 - 0.1, 2.02, small, index * 7 + k, dark, lip);
    for (let k = 0; k < 15; k++) {
      const x = x0 + 0.03 + k * 0.047;
      if (hash(index + k, 4.2) < 0.3) continue;
      annotate(m, x, 1.14, y0 + 0.03, small, index * 11 + k + 50, dark, lip);
    }
    const mid = v === 1 ? [x0 + 0.035, x0 + 0.08, x1 - 0.08, x1 - 0.035] : [0.0, 0.045];
    for (const x of mid) annotate(m, x, 2.0, 1.2, small, index * 13 + Math.round(x * 100), dark, lip);
  });
}

// The rock that spans from pier to pier over the alcoves, so each alcove is a round-headed
// niche in the wall and the piers read as parts of one carved face, not stones set apart.
function cornice(m) {
  const step = 0.1,
    x0 = -6.4,
    x1 = 6.4;
  let prev;
  for (let x = x0; x <= x1 + 1e-6; x += step) {
    const d = Math.abs(x - 2 * Math.round(x / 2)),
      under = 3.02 + 0.32 * Math.sqrt(Math.max(0, 1 - (d / 0.56) ** 2));
    const j = (k) => 0.05 * (noise(x * 2.3 + k, k * 1.7) - 0.5);
    const front = FRONT - 0.08 + j(1);
    const section = [
      [-7.0, under - 0.1],
      [-6.1, under + j(2)],
      [-5.3, under + 0.02 + j(3)],
      [front, under],
      [front - 0.04 + j(4), under + 0.22],
      [front - 0.2 + j(5), under + 0.52],
      [front - 0.75 + j(6), under + 0.92 + j(7)],
      [-6.0 + j(8), 4.45],
      [-7.1, 4.8]
    ];
    const ring = section.map(([z, y], k) => {
      const band = 0.5 + 0.5 * Math.sin(y * 3.1 + x * 0.4);
      let c = blend(rgb(0x55554f), rgb(0x706d64), 0.3 + 0.5 * band);
      if (k === 3 || k === 4) c = blend(c, rgb(0x87827a), 0.35);
      c = blend(c, rgb(0x141516), 0.7 * smooth(3.1, 4.6, y));
      return [x, y, z, lightAt(x, y, z, c, 0.5)];
    });
    if (prev)
      for (let k = 0; k < ring.length - 1; k++)
        toward(
          m,
          [prev[k].slice(0, 3), ring[k].slice(0, 3), ring[k + 1].slice(0, 3), prev[k + 1].slice(0, 3)],
          [prev[k][3], ring[k][3], ring[k + 1][3], prev[k + 1][3]],
          k < 3 ? [0, -1, 0] : [0, 0.6, 0.8]
        );
    prev = ring;
  }
}

// The carved walls and their piers.
function carvedWalls(T) {
  const m = new Model(T, 194423),
    low = new Model(T, 194427);
  walls.forEach((wx, i) => {
    pier(m, low, wx, i * 1.7 + 0.4);
    panel(m, wx, i);
  });
  cornice(m);
  // Above their bases the walls belong to the cave's north wall: seen only from the hall, they
  // fold away whole, with it, for a camera behind them, instead of standing dark before the
  // board. They never stand between the hall's own cameras and a tile.
  const shell = new Shell(m);
  shell.mark([0, 0, 1], [0, 1.6, -5.3]);
  const group = m.finish('刻字石壁', { cast: false });
  fromInside(T, group, shell);
  return [group, low.finish('石壁基座')];
}

export { carvedWalls, character, incise, FRONT };
