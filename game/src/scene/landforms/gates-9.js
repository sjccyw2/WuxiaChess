// The four gateways and the roofed galleries round the back of the terrace.
// Each gate is a two-column archway (牌樓) standing just inside the opening
// in the balustrade, with a blank name board, bracket sets under a tiled
// roof, clasping drum stones at its feet and a pair of stone lions. The
// galleries run on the inside of the balustrade between the gates and the
// instruments: two rows of lacquered columns, lattice screens on the outer
// row, a lantern hanging in each, and a roof bent round the terrace.
import { TOP, edgeRadius, gates } from './terrace-9.js';
import { tint, litBox, column, bracket, roof, ringRoof, beamGreen, beamBlue, gilt } from './roof-9.js';

const stone = 0x737a74,
  stoneDark = 0x4b5555,
  stoneLight = 0x8f938a;

// Galleries: arcs [from, to] in angle about the centre of the board. They stop
// short of the gates and leave the instruments their own ground.
const arcs = [
  [-2.94, -2.46],
  [-2.13, -1.77],
  [-1.37, -1.15],
  [-0.79, -0.2]
];
const inner = 10.95,
  outer = 12.16,
  eaveY = 1.66,
  ridgeRise = 0.72;

// The hanging lanterns, one in the middle of each gallery, for the painter.
function galleryLamps() {
  return arcs.map(([a0, a1]) => {
    const a = (a0 + a1) / 2,
      r = (inner + outer) / 2;
    return [Math.cos(a) * r, 1.05, Math.sin(a) * r];
  });
}

// A seated stone lion on a moulded base, facing +z in its own frame.
function lion(m, light, flip) {
  const c = (code, y) => tint(m, light, code, 0, y, 0);
  m.box(0, 0.06, 0, 0.5, 0.12, 0.62, c(stoneDark, 0.06));
  m.box(0, 0.16, 0, 0.44, 0.08, 0.56, c(stone, 0.16));
  m.box(0, 0.24, 0, 0.48, 0.08, 0.6, c(stoneLight, 0.24));
  // Haunches, chest and mane.
  m.rock(0, 0.27, -0.08, 0.19, 0.3, 0.2, c(stone, 0.4), c(stoneLight, 0.5), 9);
  m.rock(0, 0.36, 0.08, 0.15, 0.42, 0.14, c(stone, 0.5), c(stoneLight, 0.6), 9);
  m.rock(0, 0.72, 0.1, 0.16, 0.24, 0.15, c(0x6d756f, 0.8), c(stoneLight, 0.9), 9);
  // Muzzle and the brow.
  m.box(0, 0.83, 0.25, 0.14, 0.09, 0.08, c(stone, 0.83));
  m.box(0, 0.91, 0.2, 0.2, 0.04, 0.06, c(stoneLight, 0.91));
  for (const s of [-1, 1]) m.box(s * 0.055, 0.88, 0.25, 0.03, 0.03, 0.02, c(0x2a3133, 0.88));
  // Forelegs, and under one paw the ball (or the cub).
  for (const s of [-1, 1]) m.tube([s * 0.08, 0.28, 0.16], [s * 0.08, 0.6, 0.12], 0.045, 0.04, c(stone, 0.4), 6);
  const s = flip ? -1 : 1;
  m.lathe(s * 0.17, 0.28, 0.16, [[0, 0.02], [0.03, 0.07], [0.09, 0.08], [0.15, 0.05], [0.17, 0.0]], c(stoneLight, 0.35), 8);
  m.tube([s * 0.14, 0.45, 0.06], [s * 0.17, 0.44, 0.16], 0.04, 0.035, c(stone, 0.45), 6);
  // The curled tail on the back.
  m.line([[0, 0.35, -0.24], [0, 0.55, -0.3], [0, 0.66, -0.22]], 0.04, c(stone, 0.5), 5);
}

// Clasping drum stones either side of a column foot, along local z.
function drumStone(m, light, x) {
  for (const s of [-1, 1]) {
    const z = s * 0.25;
    m.box(x, 0.12, z, 0.14, 0.24, 0.26, tint(m, light, stoneDark, x, 0.12, z));
    m.box(x, 0.26, z, 0.16, 0.05, 0.3, tint(m, light, stone, x, 0.26, z));
    m.frame(x, 0.47, z + s * 0.02, 0, 1, () => m.tube([-0.065, 0, 0], [0.065, 0, 0], 0.17, 0.17, tint(m, light, stoneLight, x, 0.47, z), 12));
    m.tube([x - 0.07, 0.47, z + s * 0.02], [x + 0.07, 0.47, z + s * 0.02], 0.1, 0.1, tint(m, light, stone, x, 0.47, z), 12);
  }
}

// A gateway in its own frame: x along the gate, +z outward, y up from the flags.
function gateway(m, light) {
  const half = 1.2,
    top = 2.05;
  for (const s of [-1, 1]) {
    column(m, light, s * half, 0, 0, top + 0.12, 0.1);
    drumStone(m, light, s * half);
  }
  // Two lintels with the name board between them, and painted panels.
  litBox(m, light, 0, top, 0, 2 * half + 0.34, 0.17, 0.17, beamGreen);
  litBox(m, light, 0, top + 0.1, 0, 2 * half + 0.4, 0.03, 0.2, gilt, 0.6);
  litBox(m, light, 0, top - 0.42, 0, 2 * half, 0.13, 0.14, beamBlue);
  for (const s of [-1, 1]) {
    // Bands of painted decoration on the lintel faces.
    for (const u of [-0.75, 0, 0.75])
      litBox(m, light, u, top, s * 0.087, 0.22, 0.1, 0.006, u ? 0x6d5a35 : 0x8d7a48, 0.7);
  }
  // The name board: dark, gilt-framed, and empty.
  litBox(m, light, 0, top - 0.21, 0, 0.82, 0.32, 0.07, gilt, 0.8);
  for (const s of [-1, 1]) litBox(m, light, 0, top - 0.21, s * 0.036, 0.72, 0.24, 0.006, 0x1f2a33);
  for (const s of [-1, 1]) {
    // Carved panels between the lintels, and cusped braces under the ends.
    const x = s * 0.82;
    litBox(m, light, x, top - 0.21, 0, 0.6, 0.26, 0.05, 0x41504e);
    for (let k = 0; k < 4; k++) litBox(m, light, x - 0.22 + k * 0.147, top - 0.21, 0, 0.025, 0.24, 0.07, gilt, 0.5);
    litBox(m, light, x, top - 0.21, 0, 0.58, 0.022, 0.07, gilt, 0.5);
    const q = [
      [s * (half - 0.08), top - 0.5, 0],
      [s * (half - 0.5), top - 0.5, 0],
      [s * (half - 0.08), top - 0.86, 0]
    ];
    for (const z of [-0.05, 0.05]) {
      const tri = q.map(([a, b]) => [a, b, z]);
      m.face(tri, tri.map((p) => tint(m, light, 0x6b3a2c, ...p)));
    }
  }
  // Bracket sets carry the eave purlins.
  for (const u of [-1.2, -0.6, 0, 0.6, 1.2]) bracket(m, light, u, top + 0.115, 0, 0.82, 1);
  litBox(m, light, 0, top + 0.33, 0, 2 * half + 0.6, 0.06, 0.62, 0x3d2f27);
  m.frame(0, top + 0.36, 0, 0, 1, () =>
    roof(m, light, 0, { length: 3.25, depth: 1.36, rise: 0.48, sag: 0.08, lift: 0.2 })
  );
}

function gateways(m, light) {
  for (const { a } of gates) {
    const e = edgeRadius(a),
      r = e - 0.82;
    m.frame(Math.cos(a) * r, TOP, Math.sin(a) * r, Math.PI / 2 - a, 1, () => {
      gateway(m, light);
      // Lions on the inner side, facing in toward the board.
      for (const s of [-1, 1])
        m.frame(s * 1.62, 0, -0.32, Math.PI, 1, () => lion(m, light, s > 0));
    });
  }
}

// A straight member between two world points, as a box of section w by h.
function beam(m, light, p, q, w, h, code, k = 1) {
  const dx = q[0] - p[0],
    dz = q[2] - p[2],
    l = Math.hypot(dx, dz);
  const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
  m.frame(mid[0], mid[1], mid[2], -Math.atan2(dz, dx), 1, () =>
    m.box(0, 0, 0, l, h, w, light(code, mid[0], mid[1], mid[2], k))
  );
}

function gallery(m, light, a0, a1) {
  const span = (a1 - a0) * ((inner + outer) / 2),
    bays = Math.max(2, Math.round(span / 1.45));
  const top = eaveY - 0.18;
  const at = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
  const r = m.rng;
  for (let i = 0; i <= bays; i++) {
    const a = a0 + 0.012 + ((a1 - a0 - 0.024) * i) / bays;
    for (const rad of [inner, outer]) {
      const [x, , z] = at(a, rad, 0);
      m.frame(x, TOP, z, Math.PI / 2 - a, 1, () => {
        column(m, light, 0, 0, 0, top - TOP, 0.085);
        bracket(m, light, 0, top - TOP + 0.03, 0, 0.75, 0);
      });
    }
    // Tie beam across the gallery at each pair of columns.
    beam(m, light, at(a, inner - 0.15, top + 0.1), at(a, outer + 0.15, top + 0.1), 0.1, 0.12, beamGreen);
    if (i === bays) break;
    const b = a0 + 0.012 + ((a1 - a0 - 0.024) * (i + 1)) / bays,
      mid = (a + b) / 2;
    for (const rad of [inner, outer]) {
      beam(m, light, at(a, rad, top), at(b, rad, top), 0.12, 0.14, i % 2 ? beamBlue : beamGreen);
      beam(m, light, at(a, rad, top + 0.2), at(b, rad, top + 0.2), 0.1, 0.06, 0x3d2f27);
      // A painted cartouche in the middle of each architrave.
      const [cx, , cz] = at(mid, rad + (rad === inner ? -0.065 : 0.065), 0);
      m.frame(cx, top, cz, Math.PI / 2 - mid, 1, () => m.box(0, 0, 0, 0.36, 0.09, 0.012, light(0x8d7a48, cx, top, cz, 0.7)));
      // A bracket set between the columns, on the side that faces the terrace.
      const [bx, , bz] = at(mid, rad, 0);
      if (rad === inner) m.frame(bx, top + 0.07, bz, Math.PI / 2 - mid, 1, () => bracket(m, light, 0, 0, 0, 0.6, 0));
    }
    // Sill along the inner row.
    beam(m, light, at(a, inner, TOP + 0.04), at(b, inner, TOP + 0.04), 0.2, 0.08, stoneLight);
    // Lattice screen on the outer row, above the balustrade's handrail.
    const lo = 0.32,
      hi = top - 0.12;
    const pa = at(a, outer, 0),
      pb = at(b, outer, 0);
    const len = Math.hypot(pb[0] - pa[0], pb[2] - pa[2]) - 0.2;
    const [sx, , sz] = at(mid, outer * Math.cos((b - a) / 2), 0);
    m.frame(sx, 0, sz, Math.PI / 2 - mid, 1, () => {
      const frame = (x, y, w, h, code) => m.box(x, y, 0, w, h, 0.05, tint(m, light, code, x, y, 0));
      frame(0, lo, len, 0.07, 0x4d2b24);
      frame(0, hi, len, 0.07, 0x4d2b24);
      for (const s of [-1, 1]) frame((s * len) / 2, (lo + hi) / 2, 0.07, hi - lo, 0x4d2b24);
      const cols = Math.round(len / 0.16),
        rows = Math.round((hi - lo) / 0.16);
      for (let k = 1; k < cols; k++) frame(-len / 2 + (k * len) / cols, (lo + hi) / 2, 0.022, hi - lo, 0x5a3a2c);
      for (let k = 1; k < rows; k++) frame(0, lo + (k * (hi - lo)) / rows, len, 0.022, 0x5a3a2c);
      // Every other bay has a round window cut in the lattice.
      if (i % 2 === 0) m.hoop(0, (lo + hi) / 2, 0, 0.26, 0.022, tint(m, light, gilt, 0, (lo + hi) / 2, 0, 0.5), 12, 'xy', 0);
    });
    // Benches against the screen in some bays; scroll racks in others.
    const [ix, , iz] = at(mid, outer - 0.45, 0);
    if (r.next() < 0.5)
      m.frame(ix, TOP, iz, Math.PI / 2 - mid, 1, () => {
        m.box(0, 0.36, 0, len * 0.7, 0.05, 0.32, tint(m, light, 0x4d3a2c, 0, 0.36, 0));
        for (const s of [-1, 1]) m.box((s * len * 0.7) / 2 - s * 0.08, 0.17, 0, 0.06, 0.34, 0.28, tint(m, light, 0x3d2f27, 0, 0.17, 0));
      });
    else
      m.frame(ix, TOP, iz, Math.PI / 2 - mid, 1, () => {
        const w = len * 0.6;
        for (const s of [-1, 1]) m.box((s * w) / 2, 0.6, 0, 0.05, 1.2, 0.3, tint(m, light, 0x4d3a2c, 0, 0.6, 0));
        for (let k = 0; k < 4; k++) {
          const y = 0.15 + k * 0.32;
          m.box(0, y, 0, w, 0.03, 0.3, tint(m, light, 0x4d3a2c, 0, y, 0));
          // Rolled charts, their ends showing.
          for (let j = 0; j < 6; j++) {
            if (r.next() < 0.25) continue;
            const x = -w / 2 + 0.08 + (j * (w - 0.16)) / 5;
            const tone = r.next() < 0.5 ? 0xb9ab88 : 0x9f8f6c;
            m.tube([x, y + 0.055, -0.13], [x, y + 0.055, 0.13], 0.04, 0.04, tint(m, light, tone, x, y, 0), 6);
          }
        }
      });
  }
  // The roof, bent round on the arc of the terrace.
  ringRoof(m, light, a0 - 0.035, a1 + 0.035, (inner + outer) / 2, inner - 0.62, outer + 0.6, eaveY, ridgeRise);
  // The lantern hangs from the middle tie beam.
  const amid = (a0 + a1) / 2,
    [lx, , lz] = at(amid, (inner + outer) / 2, 0);
  m.line([[lx, eaveY + ridgeRise - 0.04, lz], [lx, 1.2, lz]], 0.008, light(0x2c2a26, lx, 1.2, lz), 4);
  m.lathe(lx, 1.17, lz, [[0, 0.07], [0.04, 0.1], [0.05, 0.0]], light(0x4a3a2a, lx, 1.2, lz), 8);
  m.glow(() => m.lathe(lx, 0.88, lz, [[0, 0.06], [0.06, 0.14], [0.2, 0.15], [0.28, 0.08], [0.3, 0.0]], 0xf0c27e, 10));
  m.lathe(lx, 0.84, lz, [[0, 0.0], [0.04, 0.08], [0.06, 0.08]], light(0x4a3a2a, lx, 0.86, lz), 8);
  m.line([[lx, 0.84, lz], [lx, 0.7, lz]], 0.012, 0xa33a2a, 4);
}

function galleries(m, light) {
  for (const [a0, a1] of arcs) gallery(m, light, a0, a1);
}

export { gateways, galleries, galleryLamps, arcs, inner, outer, eaveY };
