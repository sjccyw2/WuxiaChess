import { circle } from '../scenery-kit.js';
import { tiledRoof, bracketRow } from './roof-13.js';
import { granite, graniteLit, flameMark, flameRed, flameGold } from './tiles-18.js';

// 聖火廳: the hall of the sacred fire on the summit behind the board. A podium of dressed
// granite with a carved waist, its steps coming down onto the three rock tiles in the
// middle of the board's north edge; thick stone walls at the ends and back; a timber
// front of five bays on red columns, the middle door open on the glow of the fire kept
// within; a double-eaved hipped roof of dark tile whose ridge carries a gilt flame;
// hanging banners of the 明教 between the columns and two great banners streaming in
// the wind before it. Drawn about its own middle, facing +z (south).

const lacquer = 0x9a2f24,
  lacquerDark = 0x5e1f1a,
  timber = 0x3d2a20,
  gilt = 0xcfa85c,
  plaster = 0xd8d0c0,
  tiles = [0x1a1d20, 0x2e3337, 0x4b5359],
  glowDeep = 0xd8642e,
  glowHot = 0xffc067;

// The hall's measures: podium, walls and columns.
const P = { w: 6.6, d: 4.1, top: 0.42, front: 1.95 },
  H = { w: 5.4, d: 2.9, porch: 0.55, column: 1.5 };
const colX = [-2.7, -1.62, -0.54, 0.54, 1.62, 2.7];

// The podium (須彌座): a plinth, a recessed waist under a dark band, a cornice, and
// the front stair with its carved ramp between two flights.
function podium(m) {
  const { w, d, top, front } = P,
    back = front - d,
    zc = (front + back) / 2;
  m.box(0, (top - 0.95) / 2 - 0.02, zc, w + 0.2, top + 0.95, d + 0.2, granite[0]);
  m.box(0, top - 0.32, zc, w + 0.34, 0.1, d + 0.34, granite[2]);
  m.box(0, top - 0.19, zc, w + 0.06, 0.16, d + 0.06, granite[3]);
  m.box(0, top - 0.19, zc, w + 0.08, 0.04, d + 0.08, 0x57524c);
  m.box(0, top - 0.04, zc, w + 0.3, 0.08, d + 0.3, m.mix(granite[2], graniteLit, 0.4));
  // Carved panels in the waist along the front.
  for (let k = 0; k < 8; k++) {
    const x = -w / 2 + 0.4 + (k * (w - 0.8)) / 7;
    if (Math.abs(x) < 1.4) continue;
    m.box(x, top - 0.19, front + 0.045, 0.34, 0.1, 0.01, m.mix(granite[3], graniteLit, 0.3));
  }
  // The stair down to the board: two flights either side of a carved ramp.
  const steps = 4,
    rise = (top - 0.04) / steps,
    tread = 0.2;
  for (let k = 0; k < steps; k++) {
    const y = top - (k + 1) * rise,
      z = front + 0.1 + (k + 0.5) * tread;
    for (const s of [-1, 1]) {
      m.box(s * 0.78, (y + 0.04 - 0.3) / 2 + rise / 2, z, 0.95, y + rise + 0.3 - 0.04, tread + 0.02, k % 2 ? granite[1] : granite[2]);
      m.box(s * 0.78, y + rise + 0.002, z - 0.03, 0.85, 0.006, 0.08, m.mix(granite[2], graniteLit, 0.6));
    }
  }
  // The ramp (御路): a sloping slab carved with a flame between clouds.
  const zA = front + 0.1,
    zB = front + 0.1 + steps * tread;
  m.face(
    [
      [-0.28, top + 0.01, zA],
      [0.28, top + 0.01, zA],
      [0.28, 0.05, zB],
      [-0.28, 0.05, zB]
    ],
    m.mix(granite[2], graniteLit, 0.35)
  );
  for (const s of [-1, 1])
    m.face(
      [
        [s * 0.28, top + 0.01, zA],
        [s * 0.28, 0.05, zB],
        [s * 0.28, -0.3, zB],
        [s * 0.28, -0.3, zA]
      ],
      granite[3]
    );
  const slope = Math.atan2(top - 0.04, zB - zA);
  m.frame(0, (top + 0.05) / 2 + 0.012, (zA + zB) / 2, 0, 1, () => flameMark(m, 0, 0, 0, 0.42), -Math.PI / 2 + slope);
  // Cheek walls with a rail down each side of the stair.
  for (const s of [-1, 1]) {
    const x = s * 1.34;
    m.face(
      [
        [x, top + 0.08, front],
        [x, 0.1, zB + 0.05],
        [x, -0.3, zB + 0.05],
        [x, -0.3, front]
      ],
      granite[1]
    );
    m.tube([x, top + 0.1, front], [x, 0.12, zB + 0.05], 0.07, 0.07, m.mix(granite[2], graniteLit, 0.3), 5);
    m.tube([x, top + 0.26, front - 0.02], [x, 0.3, zB - 0.05], 0.03, 0.03, granite[2], 5);
    for (const t of [0, 0.5, 1]) {
      const z = front - 0.02 + t * (zB - 0.05 - front + 0.02),
        y = top + 0.1 + t * (0.12 - top - 0.1);
      m.box(x, y + 0.1, z, 0.08, 0.2, 0.08, granite[2]);
      m.lathe(x, y + 0.2, z, [[0, 0.05], [0.04, 0.06], [0.09, 0.0]], graniteLit, 6);
    }
  }
  // A stone balustrade round the podium's edge, open at the head of the stair.
  const rail = (x0, z0, x1, z1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.55));
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n,
        z = z0 + ((z1 - z0) * k) / n;
      m.box(x, top + 0.15, z, 0.09, 0.3, 0.09, granite[2]);
      m.lathe(x, top + 0.3, z, [[0, 0.055], [0.05, 0.065], [0.1, 0.0]], graniteLit, 6);
    }
    m.tube([x0, top + 0.25, z0], [x1, top + 0.25, z1], 0.028, 0.028, m.mix(granite[2], graniteLit, 0.3), 5);
    const dx = x1 - x0,
      dz = z1 - z0,
      l = Math.hypot(dx, dz);
    m.frame((x0 + x1) / 2, top + 0.1, (z0 + z1) / 2, -Math.atan2(dz, dx), 1, () => m.box(0, 0, 0, l, 0.12, 0.035, granite[1]));
  };
  const e = 0.12;
  rail(-w / 2 + e, front - e, -1.34, front - e);
  rail(1.34, front - e, w / 2 - e, front - e);
  rail(-w / 2 + e, front - e, -w / 2 + e, back + e);
  rail(w / 2 - e, front - e, w / 2 - e, back + e);
}

// One lattice door leaf in its frame, plane z = 0 facing +z, centred at its foot.
function doorLeaf(m, w, h, open = false) {
  m.box(0, h / 2, 0, w, h, 0.04, timber);
  if (open) return;
  const lattice = 0x6d3a2a;
  m.box(0, h * 0.68, 0.025, w * 0.82, h * 0.5, 0.01, 0xe6dcc5);
  for (let k = 1; k < 5; k++) m.box(-w * 0.41 + (k * w * 0.82) / 5, h * 0.68, 0.033, 0.016, h * 0.5, 0.012, lattice);
  for (let k = 1; k < 6; k++) m.box(0, h * 0.43 + (k * h * 0.5) / 6, 0.033, w * 0.82, 0.016, 0.012, lattice);
  m.box(0, h * 0.22, 0.026, w * 0.7, h * 0.24, 0.012, m.mix(timber, lacquer, 0.4));
  flameMark(m, 0, h * 0.22, 0.034, h * 0.14);
}

// The hall itself, standing on the podium.
function hallBody(m) {
  const { w, d, porch, column } = H,
    base = P.top,
    front = P.front - 0.35,
    wallZ = front - porch,
    backZ = front - d,
    zc = (front + backZ) / 2,
    eave = base + column;
  // Floor of the porch.
  m.box(0, base + 0.01, front - porch / 2 + 0.05, w + 0.3, 0.02, porch + 0.3, m.mix(granite[2], graniteLit, 0.5));
  // Thick stone end and back walls, in courses.
  const wall = (x, z, ww, dd) => {
    m.box(x, base + column / 2, z, ww, column, dd, m.mix(granite[1], granite[2], 0.5));
    for (let c = 1; c < 7; c++) {
      const y = base + (c * column) / 7;
      m.box(x, y, z, ww + 0.012, 0.014, dd + 0.012, 0x5d5953);
    }
  };
  wall(-w / 2 + 0.2, (wallZ + backZ) / 2, 0.4, wallZ - backZ);
  wall(w / 2 - 0.2, (wallZ + backZ) / 2, 0.4, wallZ - backZ);
  wall(0, backZ + 0.2, w, 0.4);
  // Columns on stone bases, the porch's front row and the corners.
  for (const x of colX) {
    m.lathe(x, base, front, [[0, 0.17], [0.06, 0.17], [0.1, 0.13], [0.12, 0.12]], graniteLit, 8);
    m.tube([x, base + 0.1, front], [x, eave, front], 0.11, 0.1, lacquer, 9);
  }
  // The timber front between the stone ends: doors in the three middle bays, lattice
  // windows over a stone dado in the outer two.
  for (let b = 0; b < 5; b++) {
    const x0 = colX[b] + 0.1,
      x1 = colX[b + 1] - 0.1,
      x = (x0 + x1) / 2,
      bw = x1 - x0;
    if (b === 0 || b === 4) {
      m.box(x, base + 0.25, wallZ, bw, 0.5, 0.18, granite[2]);
      m.box(x, base + 0.98, wallZ, bw, 0.96, 0.06, timber);
      m.box(x, base + 0.86, wallZ + 0.035, bw * 0.86, 0.6, 0.01, 0xe2d8c2);
      for (let k = 1; k < 6; k++) m.box(x - bw * 0.43 + (k * bw * 0.86) / 6, base + 0.86, wallZ + 0.045, 0.016, 0.6, 0.012, 0x6d3a2a);
      for (let k = 1; k < 4; k++) m.box(x, base + 0.56 + (k * 0.6) / 4, wallZ + 0.045, bw * 0.86, 0.016, 0.012, 0x6d3a2a);
      // A flame painted on a round white ground over the window.
      m.frame(x, base + 1.3, wallZ + 0.03, 0, 1, () => m.lathe(0, 0, 0, [[0, 0.13], [0.012, 0.13], [0.014, 0.0]], plaster, 12), Math.PI / 2);
      m.frame(x, base + 1.3, wallZ + 0.05, 0, 1, () => flameMark(m, 0, 0, 0, 0.17));
      continue;
    }
    const open = b === 2,
      leaf = bw / 2;
    for (const s of [-1, 1])
      m.frame(x + s * (open ? bw / 2 + 0.02 : leaf / 2), base + 0.02, wallZ + (open ? 0.24 : 0), open ? s * 1.35 : 0, 1, () =>
        doorLeaf(m, leaf, column - 0.32)
      );
    m.box(x, base + column - 0.15, wallZ, bw, 0.3, 0.08, timber);
    m.box(x, base + column - 0.15, wallZ + 0.045, bw * 0.9, 0.2, 0.01, m.mix(lacquer, timber, 0.3));
    if (open) {
      // Within: the warm dark of the hall, an altar where a second fire burns, and a
      // great flame banner on the back wall.
      const deep = wallZ - 0.02;
      m.glow(() =>
        m.face(
          [
            [x0, base + 0.02, deep],
            [x1, base + 0.02, deep],
            [x1, base + column - 0.3, deep],
            [x0, base + column - 0.3, deep]
          ],
          [m.rgb(0x7a2c1a), m.rgb(0x7a2c1a), m.rgb(0x3a1a12), m.rgb(0x3a1a12)]
        )
      );
      m.box(x, base + 0.2, deep + 0.03, 0.6, 0.36, 0.02, 0x4a3a30);
      m.glow(() => {
        m.crystal(x, base + 0.38, deep + 0.05, 0.12, 0.42, glowDeep, glowHot, 6);
        m.crystal(x - 0.08, base + 0.38, deep + 0.05, 0.07, 0.26, glowDeep, glowHot, 5);
        m.crystal(x + 0.09, base + 0.38, deep + 0.05, 0.07, 0.3, glowDeep, glowHot, 5);
      });
      m.box(x, base + 1.05, deep + 0.02, 0.36, 0.5, 0.01, 0x8a2a20);
      m.frame(x, base + 1.08, deep + 0.03, 0, 1, () => flameMark(m, 0, 0, 0, 0.26));
    }
  }
  // Beams over the columns, a painted band, the bracket sets and the eave purlin.
  m.box(0, eave - 0.06, front, w + 0.24, 0.16, 0.18, lacquer);
  m.box(0, eave + 0.07, front, w + 0.24, 0.1, 0.2, 0x2c6168);
  m.box(0, eave + 0.07, front + 0.102, w * 0.98, 0.04, 0.004, gilt);
  for (const x of colX) m.box(x, eave - 0.06, front + 0.095, 0.16, 0.12, 0.01, gilt);
  bracketRow(m, colX, eave + 0.13, front, 1, 0.62);
  // The roof's lower eave carried round the walls, then a clerestory and the upper roof.
  m.box(0, eave + 0.36, zc, w + 0.5, 0.16, d + 0.5, timber);
  m.frame(0, 0, zc, 0, 1, () => {
    tiledRoof(m, w + 1.5, d + 1.35, eave + 0.42, 0.72, { tones: tiles, lift: 0.32, tile: 0.27, rows: 5, beasts: 3 });
    const up = eave + 0.62;
    m.box(0, up + 0.22, 0, w * 0.66, 0.46, d * 0.55, m.mix(granite[1], granite[2], 0.5));
    for (const s of [-1, 1]) {
      m.box(0, up + 0.24, s * d * 0.277, w * 0.6, 0.3, 0.02, 0x2a1d17);
      for (let k = 0; k < 13; k++)
        m.box(-w * 0.29 + (k * w * 0.58) / 12, up + 0.24, s * (d * 0.277 + 0.012), 0.03, 0.3, 0.014, lacquer);
    }
    m.box(0, up + 0.47, 0, w * 0.7, 0.08, d * 0.6, timber);
    tiledRoof(m, w * 0.94, d * 0.95, up + 0.5, 0.85, { tones: tiles, lift: 0.34, tile: 0.27, rows: 5, beasts: 4 });
    // The plaque between the eaves: gilt glyphs on black, a flame above.
    const z = d * 0.29;
    m.box(0, up + 0.24, z + 0.03, 0.8, 0.32, 0.04, 0x161414);
    m.box(0, up + 0.24, z + 0.02, 0.88, 0.4, 0.03, gilt);
    for (const gx of [-0.2, 0.2]) {
      m.box(gx, up + 0.24, z + 0.053, 0.17, 0.025, 0.006, gilt);
      m.box(gx, up + 0.24, z + 0.053, 0.025, 0.2, 0.006, gilt);
      m.box(gx - 0.045, up + 0.3, z + 0.053, 0.07, 0.022, 0.006, gilt);
      m.box(gx + 0.045, up + 0.18, z + 0.053, 0.07, 0.022, 0.006, gilt);
    }
    // The gilt flame on the middle of the ridge.
    const ridgeTop = up + 0.5 + 0.85 + 0.2;
    m.lathe(0, ridgeTop - 0.06, 0, [[0, 0.16], [0.08, 0.18], [0.14, 0.09], [0.18, 0.12], [0.22, 0.0]], gilt, 10);
    for (const t of [0, Math.PI / 2])
      m.frame(0, ridgeTop + 0.3, 0, t, 1, () => {
        flameMark(m, 0, 0, 0.005, 0.5);
        m.frame(0, 0, 0, Math.PI, 1, () => flameMark(m, 0, 0, 0.005, 0.5));
      });
  });
}

// A banner of the 明教 streaming from a tall pole: red, a gold flame on it, a black
// border, its tail cut to a swallowtail and blown out downwind (+x).
function streamer(m, x, y, z, h, len, wide, salt) {
  m.tube([x, y - 0.1, z], [x, y + h, z], 0.05, 0.035, timber, 7);
  m.lathe(x, y + h, z, [[0, 0.05], [0.08, 0.06], [0.2, 0.0]], gilt, 8);
  m.box(x, y - 0.05, z, 0.3, 0.14, 0.3, granite[2]);
  const rows = 9,
    top = y + h - 0.12,
    grid = [];
  for (let j = 0; j <= rows; j++) {
    const u = j / rows,
      flutter = (q) => 0.12 * u * Math.sin(u * 7 + salt + q * 0.6),
      droop = 0.18 * u * u;
    grid.push([0, 0.5, 1].map((q) => [x + 0.04 + u * len, top - q * wide - droop + (j === rows && q === 0.5 ? 0.0 : 0), z + flutter(q)]));
  }
  // The swallowtail: the middle of the last row pulled back in.
  grid[rows][1][0] -= len * 0.14;
  for (let j = 0; j < rows; j++)
    for (let q = 0; q < 2; q++) {
      const col = j === 0 ? 0x151313 : (j + q) % 2 ? flameRed : m.mix(flameRed, 0xc24a32, 0.5);
      m.face([grid[j][q], grid[j + 1][q], grid[j + 1][q + 1], grid[j][q + 1]], col);
    }
  // Black edges top and bottom.
  m.line(grid.map((r) => r[0]), 0.012, 0x151313, 4);
  m.line(grid.map((r) => r[2]), 0.012, 0x151313, 4);
  // The flame on both faces, near the pole.
  const at = grid[2][1];
  for (const s of [-1, 1])
    m.frame(at[0] + 0.12, at[1], at[2] + s * 0.012, s > 0 ? 0 : Math.PI, 1, () => flameMark(m, 0, 0, 0, wide * 0.5));
}

// A long banner hanging still from the eave beam in a bay of the porch.
function hangingBanner(m, x, y, z, len) {
  m.box(x, y, z, 0.32, 0.04, 0.04, timber);
  const rows = 5;
  const pts = [];
  for (let j = 0; j <= rows; j++) {
    const v = j / rows,
      sway = 0.05 * v * Math.sin(v * 4 + x);
    pts.push([
      [x - 0.13, y - v * len, z + sway],
      [x + 0.13, y - v * len - (j === rows ? 0.08 : 0), z + sway]
    ]);
  }
  for (let j = 0; j < rows; j++)
    m.face([pts[j][0], pts[j][1], pts[j + 1][1], pts[j + 1][0]], j % 2 ? flameRed : m.mix(flameRed, 0x7a2018, 0.4));
  m.frame(x, y - len * 0.35, z + 0.012, 0, 1, () => flameMark(m, 0, 0, 0, 0.12));
}

// An iron fire basket on a stone post: the coals and flames glow.
function fireBasket(m, x, y, z) {
  m.box(x, y + 0.25, z, 0.2, 0.5, 0.2, granite[2]);
  m.box(x, y + 0.52, z, 0.28, 0.05, 0.28, graniteLit);
  for (let k = 0; k < 6; k++) {
    const a = (k * circle) / 6;
    m.tube([x + Math.cos(a) * 0.06, y + 0.55, z + Math.sin(a) * 0.06], [x + Math.cos(a) * 0.16, y + 0.8, z + Math.sin(a) * 0.16], 0.012, 0.012, 0x2b2b2d, 4);
  }
  m.hoop(x, y + 0.8, z, 0.16, 0.014, 0x2b2b2d, 12);
  m.hoop(x, y + 0.66, z, 0.11, 0.012, 0x2b2b2d, 10);
  m.glow(() => {
    m.crystal(x, y + 0.66, z, 0.1, 0.36, glowDeep, glowHot, 6);
    m.crystal(x + 0.05, y + 0.66, z - 0.03, 0.06, 0.24, glowDeep, glowHot, 5);
    m.crystal(x - 0.05, y + 0.66, z + 0.03, 0.06, 0.2, glowDeep, glowHot, 5);
  });
}

function sacredHall(m) {
  podium(m);
  hallBody(m);
  // Hanging banners in the two outer bays and either side of the doors.
  const front = P.front - 0.35,
    eave = P.top + H.column;
  for (const x of [-2.16, 2.16]) hangingBanner(m, x, eave - 0.16, front + 0.02, 0.95);
  // Fire baskets at the head of the stair, streamers at the podium's front corners.
  for (const s of [-1, 1]) fireBasket(m, s * 1.6, P.top, P.front - 0.25);
  streamer(m, -3.05, P.top, P.front - 0.2, 3.1, 1.9, 0.62, 1);
  streamer(m, 3.05, P.top, P.front - 0.2, 3.1, 1.9, 0.62, 2.5);
}

export { sacredHall, streamer, fireBasket, P as podiumSize };
