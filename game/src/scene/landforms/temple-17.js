// 萬安寺's buildings round the court: the great hall behind the pagoda on its terrace, the bell
// and drum towers at the north corners, the monks' quarters down the west side, the open
// corridor down the east side (kept low, being nearest the camera), the 山門 at the south with
// its three arches, and the red precinct wall that closes it all.
import { circle } from '../scenery-kit.js';
import { tiledRoof, bracketRow } from './roof-13.js';
import {
  OUT,
  put,
  mark,
  lattice,
  column,
  hangLamp,
  stone,
  stoneLight,
  stoneDark,
  wallRed,
  wallRedDark,
  plaster,
  lacquerDark,
  ink,
  gilt,
  bronze,
  greyTile
} from './kit-17.js';

const STREET = -1.0; // the city's streets, below the temple's raised court
const teal = 0x2c5f66;
const yellowGlaze = [0x2a2418, 0x4c4230, 0x857152]; // the great hall's imperial glaze by night

// A painted architrave along x of the frame, with roundels at the middle of each bay.
function architrave(m, len, y, z, bays) {
  m.box(0, y, z, len, 0.16, 0.12, teal);
  m.box(0, y - 0.09, z, len, 0.03, 0.14, gilt);
  m.box(0, y + 0.12, z, len + 0.1, 0.08, 0.14, lacquerDark);
  for (let i = 0; i < bays; i++) {
    const x = -len / 2 + ((i + 0.5) * len) / bays;
    m.box(x, y, z + 0.065, 0.3, 0.1, 0.008, i % 2 ? 0x2b4f7a : 0x3f7f6f);
    m.box(x, y, z + 0.07, 0.1, 0.06, 0.006, gilt);
  }
}

// A hall in its own frame, front to +z, standing at y = 0: a stone plinth with steps, red walls
// round the back and sides, columns along an open porch, a row of lattice doors and windows
// (some lit), a painted architrave, and a tiled roof with lanterns hung from its front eave.
function hall(m, o) {
  const {
    w,
    d,
    h,
    base = 0.3,
    porch = 0.8,
    bays = 5,
    lit = () => false,
    door = -1,
    roof = {},
    over = 0.75,
    lamps = true,
    brackets = false,
    steps = true,
    back = true
  } = o;
  m.box(0, base / 2, 0, w + 0.9, base, d + 0.9, stoneDark);
  m.box(0, base - 0.03, 0, w + 0.96, 0.06, d + 0.96, stone);
  if (steps && base > 0.15) {
    const n = Math.max(2, Math.round(base / 0.15));
    for (let i = 0; i < n; i++) {
      const top = base - (base / n) * i;
      m.box(0, top / 2, d / 2 + 0.45 + 0.2 * i + 0.1, 1.8, top, 0.2, i % 2 ? stone : stoneLight);
    }
  }
  const posts = Array.from({ length: bays + 1 }, (_, i) => -w / 2 + (i * w) / bays),
    front = d / 2 - porch,
    y = base;
  if (back) m.box(0, y + h / 2, -d / 2 + 0.1, w, h, 0.2, wallRed);
  for (const s of [-1, 1]) {
    m.box(s * (w / 2 - 0.1), y + h / 2, (front - d / 2) / 2, 0.2, h, front + d / 2, wallRed);
    m.box(s * (w / 2 - 0.1), y + 0.15, (front - d / 2) / 2, 0.24, 0.3, front + d / 2 + 0.02, stoneDark);
  }
  if (back) m.box(0, y + 0.15, -d / 2 + 0.1, w + 0.02, 0.3, 0.24, stoneDark);
  for (const x of posts) column(m, x, d / 2, y, h, 0.085);
  if (porch > 0.05)
    for (let i = 0; i < bays; i++) {
      const x0 = posts[i] + 0.09,
        x1 = posts[i + 1] - 0.09,
        cx = (x0 + x1) / 2,
        bw = x1 - x0,
        isDoor = i === door,
        sill = isDoor ? 0.12 : 0.6,
        top = h - 0.3;
      m.box(cx, y + sill / 2, front, bw, sill, 0.1, isDoor ? lacquerDark : wallRedDark);
      m.box(cx, y + top + 0.15, front, bw, 0.3, 0.1, lacquerDark);
      if (isDoor && lit(i)) {
        m.glow(() =>
          put(
            m,
            [
              [x0 + 0.1, y + 0.12, front + 0.01],
              [x1 - 0.1, y + 0.12, front + 0.01],
              [x1 - 0.1, y + top, front + 0.01],
              [x0 + 0.1, y + top, front + 0.01]
            ],
            0xe39a4c,
            [0, 0, 1]
          )
        );
        for (const s of [-1, 1])
          m.frame(cx + s * (bw / 2 - 0.12), y + (top + 0.12) / 2, front + 0.05, 0, 1, () =>
            lattice(m, 0.22, top - 0.16, 1, 5, false)
          );
        mark(m, cx, y + top / 2, front + 0.6);
      } else
        m.frame(cx, y + (sill + top) / 2, front + 0.06, 0, 1, () =>
          lattice(m, bw - 0.05, top - sill - 0.05, isDoor ? 4 : 5, isDoor ? 6 : 4, lit(i))
        );
    }
  architrave(m, w + 0.2, y + h - 0.1, d / 2, bays);
  const eave = y + h + (brackets ? 0.55 : 0.12);
  if (brackets) bracketRow(m, posts, y + h + 0.06, d / 2, 0, 0.85);
  tiledRoof(m, w + over * 2, d + over * 2, eave, roof.rise ?? h * 0.62, { lift: 0.3, ...roof });
  if (lamps)
    for (let i = 0; i < bays; i++)
      if (i % 2 === 0 || bays < 4)
        hangLamp(m, (posts[i] + posts[i + 1]) / 2, eave - 0.62, d / 2 + over * 0.55, 0.8, 0xe0663c, 0.25);
}

// 大雄寶殿: the great hall behind the pagoda, on a terrace with a balustrade and a broad stair.
function mainHall(m) {
  const z = -13.9,
    terrace = 0.62;
  m.frame(0, OUT, z, 0, 1, () => {
    m.box(0, terrace / 2, -0.2, 16.4, terrace, 7.6, stoneDark);
    m.box(0, terrace - 0.04, -0.2, 16.5, 0.08, 7.7, stone);
    for (let i = 0; i < 4; i++) {
      const top = terrace - 0.155 * i;
      m.box(0, top / 2, 3.65 + 0.24 * i + 0.12, 3.4, top, 0.24, i % 2 ? stone : stoneLight);
    }
    // A low white rail along the terrace front, open at the stair.
    for (const s of [-1, 1]) {
      const a = s * 1.9,
        b = s * 8.1,
        len = Math.abs(b - a);
      m.frame((a + b) / 2, terrace, 3.55, 0, 1, () => {
        m.box(0, 0.26, 0, len, 0.04, 0.07, stoneLight);
        m.box(0, 0.12, 0, len, 0.1, 0.03, stone);
        for (let i = 0; i <= Math.round(len / 0.6); i++)
          m.box(-len / 2 + (len * i) / Math.round(len / 0.6), 0.15, 0, 0.07, 0.3, 0.07, stoneLight);
      });
    }
    m.frame(0, terrace, -0.8, 0, 1, () =>
      hall(m, {
        w: 11.2,
        d: 5,
        h: 2.4,
        base: 0.4,
        porch: 1.0,
        bays: 7,
        door: 3,
        lit: (i) => i >= 2 && i <= 4,
        brackets: true,
        over: 0.95,
        roof: { rise: 2.0, lift: 0.45, rows: 5, beasts: 5, tones: yellowGlaze, tile: 0.5 }
      })
    );
    // A great bronze cauldron before the stair, smouldering.
    m.frame(0, 0, 5.3, 0, 1, () => {
      m.lathe(0, 0, 0, [[0, 0.5], [0.12, 0.52], [0.2, 0.42], [0.28, 0.44]], stoneDark, 10);
      m.lathe(0, 0.28, 0, [[0, 0.1], [0.08, 0.42], [0.3, 0.55], [0.6, 0.52], [0.68, 0.58], [0.72, 0.58]], bronze, 12);
      m.glow(() => m.lathe(0, 0.66, 0, [[0, 0.5], [0.005, 0.5]], 0xd8642c, 12));
      for (const s of [-1, 1]) m.hoop(s * 0.56, 0.88, 0, 0.13, 0.03, bronze, 8, 'xy');
      mark(m, 0, 0.8, 0, 1.1);
    });
  });
}

// 鐘樓 and 鼓樓: a brick base pierced by arches, and an open upper room under a hipped roof
// with the great bell, or the drum, hanging in it.
function tower(m, x, z, yaw, bell) {
  m.frame(x, OUT, z, yaw, 1, () => {
    const s = 3.0,
      lower = 1.9;
    m.box(0, lower / 2, 0, s, lower, s, m.mix(wallRed, stoneDark, 0.35));
    m.box(0, 0.15, 0, s + 0.08, 0.3, s + 0.08, stoneDark);
    m.box(0, lower - 0.06, 0, s + 0.12, 0.12, s + 0.12, stone);
    for (let f = 0; f < 4; f++)
      m.frame(0, 0, 0, (f * circle) / 4, 1, () => {
        m.box(0, 0.7, s / 2 + 0.005, 0.8, 1.1, 0.02, ink);
        m.lathe(0, 1.25, s / 2 + 0.006, [[0, 0.4], [0.001, 0.4]], ink, 10);
        m.box(0, 1.3, s / 2 + 0.01, 1.0, 0.06, 0.03, stone);
      });
    const y = lower,
      half = 1.25;
    m.box(0, y + 0.04, 0, 2.9, 0.08, 2.9, stoneLight);
    for (const px of [-half, -half / 3, half / 3, half])
      for (const pz of [-half, half]) {
        column(m, px, pz, y, 1.6, 0.06);
        if (Math.abs(px) < half) column(m, pz, px, y, 1.6, 0.06);
      }
    for (let f = 0; f < 4; f++)
      m.frame(0, 0, 0, (f * circle) / 4, 1, () => {
        architrave(m, 2.7, y + 1.5, half, 3);
        m.box(0, y + 0.3, half, 2.5, 0.04, 0.05, lacquerDark);
        m.box(0, y + 0.15, half, 2.5, 0.03, 0.03, lacquerDark);
      });
    if (bell) {
      m.box(0, y + 1.38, 0, 1.6, 0.08, 0.1, lacquerDark);
      m.lathe(0, y + 0.45, 0, [[0, 0.42], [0.08, 0.4], [0.5, 0.32], [0.8, 0.3], [0.9, 0.18], [0.94, 0]], bronze, 12);
      m.hoop(0, y + 0.62, 0, 0.36, 0.02, gilt, 12);
      m.tube([0.9, y + 0.75, 0], [0.4, y + 0.75, 0], 0.06, 0.06, 0x4a3a2a, 6);
    } else {
      m.frame(0, y + 0.85, 0, 0, 1, () => {
        m.tube([0, 0, -0.36], [0, 0, 0.36], 0.5, 0.5, 0x7a2a22, 12);
        m.hoop(0, 0, 0.36, 0.5, 0.03, gilt, 14, 'xy');
        m.hoop(0, 0, -0.36, 0.5, 0.03, gilt, 14, 'xy');
        m.lathe(0, 0, 0.37, [[0, 0.46], [0.001, 0.46]], 0xb59a6a, 12);
      });
      m.box(0, y + 0.2, 0, 0.9, 0.4, 0.5, lacquerDark);
    }
    tiledRoof(m, 4.2, 4.2, y + 1.66, 1.45, { hip: 0.55, lift: 0.4, rows: 4, beasts: 3, tones: greyTile, tile: 0.46 });
    for (const [lx, lz] of [
      [-1.6, 1.6],
      [1.6, 1.6]
    ])
      hangLamp(m, lx, y + 1.1, lz, 0.7, 0xe0663c, 0.2);
  });
}

// 僧寮: the monks' quarters down the west side of the court, facing it across a porch.
function quarters(m) {
  m.frame(-10.35, OUT, -0.4, Math.PI / 2, 1, () =>
    hall(m, {
      w: 12.4,
      d: 3.0,
      h: 1.85,
      base: 0.3,
      porch: 0.85,
      bays: 9,
      door: 4,
      lit: (i) => [1, 2, 4, 6, 7].includes(i),
      over: 0.6,
      roof: { rise: 1.05, gable: true, hip: 0, lift: 0.08, rows: 4, rafters: false, tones: greyTile, tile: 0.4 }
    })
  );
  // A water vat and a stack of firewood at the north end of the porch, and a bench.
  m.frame(-8.75, OUT + 0.3, -6.0, 0, 1, () => {
    m.lathe(0, 0, 0, [[0, 0.24], [0.1, 0.3], [0.42, 0.33], [0.48, 0.3], [0.5, 0.31]], 0x3c3a3a, 10);
    m.lathe(0, 0.45, 0, [[0, 0.29], [0.002, 0.29]], 0x1d2a33, 10);
  });
  for (let i = 0; i < 6; i++)
    m.tube([-9.0, OUT + 0.36 + (i % 3) * 0.09, 5.3 + Math.floor(i / 3) * 0.1 - 0.25], [-9.0 + 0.0, OUT + 0.36 + (i % 3) * 0.09, 5.3 + Math.floor(i / 3) * 0.1 + 0.45], 0.045, 0.045, 0x4a3a2c, 5);
  m.box(-8.75, OUT + 0.52, 2.0, 0.3, 0.05, 1.4, 0x4a3a2c);
  for (const z of [1.4, 2.6]) m.box(-8.75, OUT + 0.4, z, 0.24, 0.22, 0.06, 0x3a2e26);
}

// 東廊: an open corridor down the east side, kept low, a red wall at its back with small
// lit windows, its roof hung with lanterns.
function corridor(m) {
  m.frame(10.45, OUT, 0, -Math.PI / 2, 1, () => {
    hall(m, {
      w: 13.0,
      d: 1.9,
      h: 1.4,
      base: 0.18,
      porch: 0,
      bays: 9,
      over: 0.42,
      lamps: false,
      steps: false,
      roof: { rise: 0.62, hip: 0.08, lift: 0.18, rows: 3, rafters: false, tones: greyTile, tile: 0.36, beasts: 0 }
    });
    // Little lit windows in the back wall, and benches between the columns.
    for (let i = 0; i < 9; i++) {
      const x = -6.5 + (i + 0.5) * (13 / 9);
      if (i % 2 === 0) m.frame(x, 0.18 + 0.95, -0.83, 0, 1, () => lattice(m, 0.42, 0.42, 3, 3, i % 4 === 0));
      if (i % 2) {
        m.box(x, 0.18 + 0.32, -0.55, 0.9, 0.05, 0.28, 0x4a3a2c);
        for (const s of [-1, 1]) m.box(x + s * 0.36, 0.18 + 0.16, -0.55, 0.06, 0.3, 0.22, 0x3a2e26);
      }
    }
    for (let i = 0; i < 9; i += 2) hangLamp(m, -6.5 + (i + 0.5) * (13 / 9), 1.08, 0.75, 0.62, 0xe0663c, 0.12);
  });
}

// 山門: the gate hall at the south, a red masonry body pierced by three arches, under a hipped
// roof; a name board over the middle arch, lanterns, and stone lions on the street side.
function gate(m) {
  const z = 12.1,
    w = 7.6,
    d = 2.6,
    h = 2.5;
  m.frame(0, STREET, z, 0, 1, () => {
    const g = OUT - STREET; // the court stands this much above the street
    m.box(0, g / 2, 0, w + 0.8, g, d + 0.8, stoneDark);
    // Steps down from the gate to the street.
    for (let i = 0; i < 4; i++) {
      const top = g - (g / 4) * i;
      m.box(0, top / 2, d / 2 + 0.4 + 0.22 * i + 0.11, 3.4, top, 0.22, i % 2 ? stone : stoneLight);
    }
    const y = g;
    // The arches: [centre x, width, height to the spring of the arch].
    const arches = [
      [0, 1.5, 1.55],
      [-2.55, 0.95, 1.2],
      [2.55, 0.95, 1.2]
    ];
    // Piers and the wall over the arches, on both faces.
    const edges = [-w / 2, -3.03, -2.07, -0.75, 0.75, 2.07, 3.03, w / 2];
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i],
        b = edges[i + 1];
      m.box((a + b) / 2, y + h / 2, 0, b - a, h, d, wallRed);
    }
    for (const [cx, aw, spring] of arches) {
      const r = aw / 2,
        top = spring + r;
      m.box(cx, y + (top + h) / 2, 0, aw, h - top, d, wallRed);
      // The arch: spandrels filled on both faces and a soffit through the wall.
      const n = 10,
        ring = [];
      for (let k = 0; k <= n; k++) {
        const a = (k * Math.PI) / n;
        ring.push([cx + Math.cos(a) * r, y + spring + Math.sin(a) * r]);
      }
      for (const s of [-1, 1]) {
        const fz = (s * d) / 2;
        for (let k = 0; k < n; k++) {
          const [x0, y0] = ring[k],
            [x1, y1] = ring[k + 1],
            cxr = k < n / 2 ? cx + r : cx - r;
          put(
            m,
            [
              [x0, y0, fz],
              [x1, y1, fz],
              [cxr, y + top, fz]
            ],
            wallRed,
            [0, 0, s]
          );
        }
        // A white stone rim round the arch.
        m.line(
          ring.map(([px, py]) => [cx + (px - cx) * 1.06, y + spring + (py - y - spring) * 1.06, fz + s * 0.02]),
          0.05,
          stoneLight,
          4
        );
        for (const e of [-1, 1]) m.box(cx + e * (r + 0.04), y + spring / 2, fz + s * 0.02, 0.1, spring, 0.05, stoneLight);
      }
      for (let k = 0; k < n; k++) {
        const [x0, y0] = ring[k],
          [x1, y1] = ring[k + 1];
        put(
          m,
          [
            [x0, y0, -d / 2],
            [x1, y1, -d / 2],
            [x1, y1, d / 2],
            [x0, y0, d / 2]
          ],
          wallRedDark,
          [-(x0 + x1) / 2 + cx, -(y0 + y1) / 2 + y + spring, 0]
        );
      }
      // Door leaves folded back inside the arch.
      for (const e of [-1, 1]) m.box(cx + e * (r - 0.05), y + spring * 0.55, -0.4, 0.06, spring * 1.05, r * 0.9, lacquerDark);
    }
    m.box(0, y + 0.2, 0, w + 0.06, 0.4, d + 0.06, stoneDark);
    m.box(0, y + h - 0.12, 0, w + 0.1, 0.24, d + 0.1, plaster);
    for (const s of [-1, 1]) {
      m.frame(0, 0, (s * d) / 2, 0, 1, () => architrave(m, w + 0.1, y + h + 0.06, 0.02 * s, 5));
    }
    // The name board over the middle arch, on the street side.
    m.box(0, y + 2.08, d / 2 + 0.06, 1.3, 0.4, 0.05, 0x1f3354);
    m.box(0, y + 2.08, d / 2 + 0.09, 1.1, 0.26, 0.02, 0x2b4670);
    for (let k = 0; k < 3; k++) m.box(-0.32 + k * 0.32, y + 2.08, d / 2 + 0.105, 0.18, 0.18, 0.01, gilt);
    tiledRoof(m, w + 1.5, d + 1.4, y + h + 0.22, 1.5, { hip: 0.42, lift: 0.4, rows: 4, beasts: 4, tones: greyTile, tile: 0.36 });
    for (const s of [-1, 1])
      for (const e of [-1, 1]) hangLamp(m, e * 1.35, y + h - 0.35, s * (d / 2 + 0.45), 1.05, 0xe0583a, 0.2);
    // Stone lions on drums either side of the street steps.
    for (const e of [-1, 1])
      m.frame(e * 2.2, 0, d / 2 + 1.2, e * -0.25, 1, () => {
        m.box(0, 0.2, 0, 0.6, 0.4, 0.8, stoneDark);
        m.box(0, 0.44, 0, 0.55, 0.08, 0.75, stone);
        m.rock(0, 0.48, 0.05, 0.2, 0.32, 0.28, stone, stoneLight, 7);
        m.rock(0, 0.72, 0.18, 0.2, 0.35, 0.18, stone, stoneLight, 7);
        m.rock(0, 1.02, 0.28, 0.16, 0.18, 0.14, stoneLight, 0xb0b8c4, 6);
        m.lathe(-e * 0.12, 0.5, 0.3, [[0, 0.07], [0.07, 0.08], [0.14, 0]], stoneLight, 6);
      });
  });
}

export { mainHall, tower, quarters, corridor, gate, STREET };
