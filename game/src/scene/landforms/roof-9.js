// Timber and tile for the observatory's gateways and galleries: lacquered
// columns on drum bases, stacked bracket sets, and roofs of rolled tiles that
// sag between ridge and eave and lift at the corners. Colours go through the
// terrace's lamplight painter at their world position, so a roof near a lamp
// is warm on its underside and the far eaves stay starlit blue.
import { circle } from '../scenery-kit.js';

const tile = 0x343d47,
  tileRoll = 0x47515a,
  ridgeTone = 0x2a3139,
  lacquer = 0x5e2e27,
  lacquerWorn = 0x7a4a36,
  beamGreen = 0x2f5856,
  beamBlue = 0x34476a,
  gilt = 0xb08e4f,
  timber = 0x4d3a2c;

// The world position of a point in the model's current frame.
function world(m, x, y, z) {
  const e = m.matrix.elements;
  return [
    e[0] * x + e[4] * y + e[8] * z + e[12],
    e[1] * x + e[5] * y + e[9] * z + e[13],
    e[2] * x + e[6] * y + e[10] * z + e[14]
  ];
}
// A colour painted with lamplight at a local point.
function tint(m, light, code, x, y, z, k = 1) {
  const [a, b, c] = world(m, x, y, z);
  return light(code, a, b, c, k);
}
function litBox(m, light, x, y, z, w, h, d, code, k = 1) {
  m.box(x, y, z, w, h, d, tint(m, light, code, x, y, z, k));
}

// A lacquered column from `y0` to `y1` on a carved stone drum base.
function column(m, light, x, z, y0, y1, r = 0.09) {
  const stone = tint(m, light, 0x737a74, x, y0, z);
  m.box(x, y0 + 0.03, z, r * 3.6, 0.06, r * 3.6, stone);
  m.lathe(x, y0 + 0.06, z, [[0, r * 1.75], [0.05, r * 1.85], [0.1, r * 1.45], [0.13, r * 1.12]], stone, 8);
  const lo = tint(m, light, lacquer, x, y0, z),
    hi = tint(m, light, lacquerWorn, x, y1, z);
  m.tube([x, y0 + 0.18, z], [x, y1, z], r, r * 0.93, m.mix(lo, hi, 0.4), 8);
  // A worn band where hands have rubbed the lacquer, and a bronze collar on top.
  m.tube([x, y0 + 0.75, z], [x, y0 + 1.0, z], r * 1.01, r * 1.01, hi, 8);
  m.tube([x, y1 - 0.06, z], [x, y1, z], r * 1.06, r * 1.06, tint(m, light, gilt, x, y1, z, 0.8), 8);
}

// A bracket set (dougong) on a column head or a beam: a bearing block, crossed arms
// in two tiers and small blocks under the next arm. `s` scales the whole set.
function bracket(m, light, x, y, z, s = 1, along = 1) {
  const c0 = tint(m, light, beamGreen, x, y, z),
    c1 = tint(m, light, beamBlue, x, y + 0.1, z),
    b = tint(m, light, timber, x, y, z),
    g = tint(m, light, gilt, x, y, z, 0.7);
  m.box(x, y + 0.04 * s, z, 0.16 * s, 0.08 * s, 0.16 * s, b);
  m.box(x, y + 0.1 * s, z, 0.42 * s * along + 0.12 * s * (1 - along), 0.05 * s, 0.07 * s + 0.35 * s * (1 - along), c0);
  m.box(x, y + 0.1 * s, z, 0.07 * s + 0.35 * s * (1 - along), 0.05 * s, 0.07 * s, c0);
  m.box(x, y + 0.1 * s, z, 0.07 * s, 0.05 * s, 0.34 * s, c0);
  for (const d of [-0.18, 0.18]) m.box(x + d * s * along, y + 0.15 * s, z + d * s * (1 - along), 0.08 * s, 0.05 * s, 0.08 * s, b);
  m.box(x, y + 0.2 * s, z, 0.6 * s * along + 0.1 * s, 0.05 * s, 0.08 * s, c1);
  m.box(x, y + 0.2 * s, z, 0.08 * s, 0.05 * s, 0.5 * s, c1);
  // The projecting arm ends in a gilt cap under the eave purlin.
  for (const d of [-0.25, 0.25]) m.box(x, y + 0.235 * s, z + d * s, 0.09 * s, 0.03 * s, 0.07 * s, g);
}

// One course of rolled tiles as a ridged strip down the slope, closed at the
// eave by the round end tile.
function rollTile(m, left, crest, right, col, shade) {
  for (let k = 1; k < crest.length; k++) {
    m.face([left[k - 1], left[k], crest[k], crest[k - 1]], [shade, shade, col, col]);
    m.face([crest[k - 1], crest[k], right[k], right[k - 1]], col);
  }
  const n = crest.length - 1,
    e = crest[n],
    down = [e[0], e[1] - 0.05, e[2]];
  m.face([left[n], e, right[n], down], shade);
}

// The surface of one slope: u runs along the roof from -1 to 1, v from the
// ridge (0) to the eave (1). Between them the slope sags; at the ends of the
// eave it sweeps up into the corners.
function slopePoint(spec, u, v, side) {
  const { length, depth, rise, sag = 0.12, lift = 0.16, flare = 0.08 } = spec;
  const x = u * (length / 2) * (1 + flare * v);
  const z = side * v * (depth / 2);
  const y = rise * (1 - v) - sag * 4 * v * (1 - v) + lift * v * v * Math.pow(Math.abs(u), 6);
  return [x, y, z];
}

// A straight roof in the current frame, eave level at y0, ridge along x.
function roof(m, light, y0, spec) {
  const { length, depth, rise, ends = true } = spec;
  const nu = Math.max(6, Math.round(length / 0.32)),
    nv = 4;
  const P = (u, v, side, up = 0) => {
    const [x, y, z] = slopePoint(spec, u, v, side);
    return [x, y0 + y + up, z];
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < nu; i++)
      for (let k = 0; k < nv; k++) {
        const u0 = -1 + (2 * i) / nu,
          u1 = -1 + (2 * (i + 1)) / nu,
          v0 = k / nv,
          v1 = (k + 1) / nv;
        const q = [P(u0, v0, side), P(u1, v0, side), P(u1, v1, side), P(u0, v1, side)];
        m.face(q, q.map((p) => tint(m, light, m.mix(tile, ridgeTone, 0.3 * (1 - p[1] + y0)), ...p, 0.7)));
      }
    // The eave board, a dark strip under the last course.
    for (let i = 0; i < nu; i++) {
      const u0 = -1 + (2 * i) / nu,
        u1 = -1 + (2 * (i + 1)) / nu;
      const a = P(u0, 1, side),
        b = P(u1, 1, side);
      m.face(
        [a, b, [b[0], b[1] - 0.07, b[2]], [a[0], a[1] - 0.07, a[2]]],
        tint(m, light, 0x3d2f27, a[0], a[1], a[2])
      );
    }
    // Rolled tiles run down the slope, each ending in a round eave tile.
    const rolls = Math.round((length * 1.06) / 0.15);
    for (let j = 0; j <= rolls; j++) {
      const u = -0.985 + (1.97 * j) / rolls;
      const du = 0.028 / (length / 2);
      const vs = [0.02, 0.4, 0.74, 1];
      const crest = vs.map((v) => P(u, v, side, 0.035));
      const left = vs.map((v) => P(u - du, v, side, 0.004));
      const right = vs.map((v) => P(u + du, v, side, 0.004));
      const col = tint(m, light, j % 7 === 3 ? 0x56605f : tileRoll, ...crest[2], 0.7);
      rollTile(m, left, crest, right, col, m.mix(col, 0x1c2228, 0.35));
    }
  }
  // Ridge with its upturned owl-tail ends.
  const top = P(0, 0, 1)[1],
    half = (length / 2) * 1.0;
  litBox(m, light, 0, top + 0.05, 0, length * 1.02, 0.1, 0.1, ridgeTone);
  litBox(m, light, 0, top + 0.115, 0, length * 1.0, 0.03, 0.06, 0x3e4750);
  for (const s of [-1, 1]) {
    const c = tint(m, light, 0x3b444c, s * half, top, 0);
    m.line(
      [
        [s * (half - 0.02), top + 0.05, 0],
        [s * (half + 0.03), top + 0.2, 0],
        [s * (half - 0.04), top + 0.33, 0],
        [s * (half - 0.14), top + 0.36, 0]
      ],
      0.045,
      c,
      6
    );
  }
  if (!ends) return;
  // Gable ends: a lacquered board in the triangle under the roof's end.
  for (const s of [-1, 1]) {
    const x = s * (length / 2) * 0.96;
    const tri = [
      [x, y0 + rise - 0.02, 0],
      [x, y0 + 0.04, depth * 0.42],
      [x, y0 + 0.04, -depth * 0.42]
    ];
    m.face(tri, tri.map((p) => tint(m, light, 0x4a3029, ...p)));
    const g = tint(m, light, gilt, x, y0 + rise * 0.6, 0, 0.6);
    m.line([[x + s * 0.01, y0 + rise * 0.62, 0], [x + s * 0.03, y0 + rise * 0.36, 0]], 0.025, g, 5);
  }
}

// A roof bent round the terrace: angles a0..a1 about the centre, ridge on
// radius `rc`, eaves on r0 (inside) and r1 (outside), eave level y0.
function ringRoof(m, light, a0, a1, rc, r0, r1, y0, rise) {
  const span = (a1 - a0) * rc,
    nu = Math.max(8, Math.round(span / 0.34)),
    nv = 4;
  const P = (u, v, side, up = 0) => {
    // The corner lift is measured on the eave's own length.
    const lift = 0.2 * v * v * Math.pow(Math.abs(2 * u - 1), 8);
    const ends = 0.12 * v * (Math.abs(2 * u - 1) > 0.98 ? 1 : 0);
    const a = a0 + (a1 - a0) * u + (u < 0.5 ? -1 : 1) * ends * 0.0;
    const r = rc + ((side > 0 ? r1 : r0) - rc) * v;
    const y = y0 + rise * (1 - v) - 0.13 * 4 * v * (1 - v) + lift + up;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < nu; i++)
      for (let k = 0; k < nv; k++) {
        const u0 = i / nu,
          u1 = (i + 1) / nu,
          v0 = k / nv,
          v1 = (k + 1) / nv;
        const q = [P(u0, v0, side), P(u1, v0, side), P(u1, v1, side), P(u0, v1, side)];
        m.face(q, q.map((p) => light(m.mix(tile, ridgeTone, 0.25 * k / nv), p[0], p[1], p[2], 0.7)));
      }
    for (let i = 0; i < nu; i++) {
      const a = P(i / nu, 1, side),
        b = P((i + 1) / nu, 1, side);
      m.face([a, b, [b[0], b[1] - 0.08, b[2]], [a[0], a[1] - 0.08, a[2]]], light(0x3d2f27, a[0], a[1], a[2]));
    }
    const rolls = Math.round(span / 0.155);
    for (let j = 0; j <= rolls; j++) {
      const u = 0.006 + (0.988 * j) / rolls;
      const du = 0.028 / ((a1 - a0) * rc);
      const vs = [0.02, 0.4, 0.74, 1];
      const crest = vs.map((v) => P(u, v, side, 0.037));
      const left = vs.map((v) => P(u - du, v, side, 0.004));
      const right = vs.map((v) => P(u + du, v, side, 0.004));
      const mid = crest[2];
      const col = light(j % 9 === 4 ? 0x56605f : tileRoll, mid[0], mid[1], mid[2], 0.7);
      rollTile(m, left, crest, right, col, m.mix(col, 0x1c2228, 0.35));
    }
  }
  // The ridge follows the arc in short straight lengths.
  const top = y0 + rise;
  for (let i = 0; i < nu; i++) {
    const a = a0 + ((a1 - a0) * i) / nu,
      b = a0 + ((a1 - a0) * (i + 1)) / nu;
    const pa = [Math.cos(a) * rc, top + 0.05, Math.sin(a) * rc],
      pb = [Math.cos(b) * rc, top + 0.05, Math.sin(b) * rc];
    m.tube(pa, pb, 0.065, 0.065, light(ridgeTone, pa[0], pa[1], pa[2]), 4);
  }
  for (const a of [a0, a1]) {
    const s = a === a0 ? 1 : -1,
      t = [-Math.sin(a) * s, 0, Math.cos(a) * s],
      p = [Math.cos(a) * rc, top + 0.05, Math.sin(a) * rc];
    const q = (k, h) => [p[0] - t[0] * k, p[1] + h, p[2] - t[2] * k];
    m.line([q(0, 0), q(0.05, 0.17), q(-0.02, 0.3), q(-0.12, 0.33)], 0.045, light(0x3b444c, ...p), 6);
    // Gable boards close the ends of the gallery.
    const tri = [
      [Math.cos(a) * rc, top - 0.03, Math.sin(a) * rc],
      [Math.cos(a) * (rc - (rc - r0) * 0.85), y0 + 0.03, Math.sin(a) * (rc - (rc - r0) * 0.85)],
      [Math.cos(a) * (rc + (r1 - rc) * 0.85), y0 + 0.03, Math.sin(a) * (rc + (r1 - rc) * 0.85)]
    ];
    m.face(tri, tri.map((v) => light(0x4a3029, v[0], v[1], v[2])));
  }
}

export { world, tint, litBox, column, bracket, roof, ringRoof, lacquer, beamGreen, beamBlue, gilt, timber, circle };
