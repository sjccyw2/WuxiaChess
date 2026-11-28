// 俠客島's carved floor. The hall's floor is not bare: the island's masters cut into it what
// they cut into the walls. In the middle of the hall, between the four pillars, a great ring
// in a band of paler polished stone, ticked like a dial, with the eight trigrams inside it and
// the two fishes of the taiji at its heart; a paved walk of pale slabs runs down the middle of
// the hall from the mouth to the centre alcove; before every carved wall a roundel holds one of
// that wall's figures; and round the board's edge runs a key-pattern border. Everything is
// cut flush into the tile tops (a dark groove and its lit lip, or a slab of other stone a hair
// proud), so nothing stands up on a walkable tile.
import { circle } from '../scenery-kit.js';
import { TOP, CX, CZ, layout, walls, blend, rgb, toward } from './kit-19.js';
import { joints, POSES } from './carving-19.js';

const RING = { x: 0, z: 0.5, r1: 2.12, r2: 2.42, inner: 0.98 };
const WALK = new Set([-4, -3, -2, 3, 4, 5].map((z) => `0,${z}`));
// Every stroke of the floor, in world coordinates: grooves [a, b, width] and filled shapes.
const grooves = [],
  fills = [];
function arc(cx, cz, r, a0, a1, w, step = 0.085) {
  const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / step));
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n,
      t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    grooves.push([[cx + Math.cos(t0) * r, cz + Math.sin(t0) * r], [cx + Math.cos(t1) * r, cz + Math.sin(t1) * r], w]);
  }
}
function line(a, b, w) {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]),
    n = Math.max(1, Math.ceil(l / 0.3));
  for (let i = 0; i < n; i++)
    grooves.push([
      [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n],
      [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n],
      w
    ]);
}
// The great ring: the band, its two grooves and the ticks across it.
{
  const { x, z, r1, r2 } = RING,
    n = 168;
  for (let i = 0; i < n; i++) {
    const a0 = (i * circle) / n,
      a1 = ((i + 1) * circle) / n;
    const p = (a, r) => [x + Math.cos(a) * r, z + Math.sin(a) * r];
    fills.push({ poly: [p(a0, r1), p(a0, r2), p(a1, r2), p(a1, r1)], col: 'band' });
  }
  arc(x, z, r1, 0, circle, 0.014);
  arc(x, z, r2, 0, circle, 0.016);
  for (let i = 0; i < 64; i++) {
    const a = (i * circle) / 64,
      l = i % 8 === 0 ? 0.24 : i % 2 === 0 ? 0.13 : 0.07;
    line([x + Math.cos(a) * (r2 - 0.03), z + Math.sin(a) * (r2 - 0.03)], [x + Math.cos(a) * (r2 - 0.03 - l), z + Math.sin(a) * (r2 - 0.03 - l)], 0.008);
  }
  // The eight trigrams: three bars each, whole or broken, in a darker stone.
  for (let k = 0; k < 8; k++) {
    const a = (k * circle) / 8 + Math.PI / 8,
      ca = Math.cos(a),
      sa = Math.sin(a);
    for (let b = 0; b < 3; b++) {
      const r = 1.5 + b * 0.15,
        broken = (k >> b) & 1;
      const pieces = broken ? [[-0.17, -0.035], [0.035, 0.17]] : [[-0.17, 0.17]];
      for (const [s0, s1] of pieces) {
        const at = (s, d) => [x + ca * (r + d) - sa * s, z + sa * (r + d) + ca * s];
        fills.push({ poly: [at(s0, -0.03), at(s1, -0.03), at(s1, 0.03), at(s0, 0.03)], col: 'dark' });
      }
    }
  }
  // The taiji at the heart: its circle, the S between the fishes, and their eyes.
  arc(x, z, RING.inner, 0, circle, 0.014);
  arc(x, z - RING.inner / 2, RING.inner / 2, -Math.PI / 2, Math.PI / 2, 0.012);
  arc(x, z + RING.inner / 2, RING.inner / 2, Math.PI / 2, (3 * Math.PI) / 2, 0.012);
  // The dark fish, as a fan of thin wedges so it can be cut tile by tile.
  for (let i = 0; i < 24; i++) {
    const a0 = -Math.PI / 2 + (i / 24) * Math.PI,
      a1 = -Math.PI / 2 + ((i + 1) / 24) * Math.PI;
    const edge = (a) => {
      // Where the S lies at this angle's height: the fish runs from the outer rim in to it.
      const zz = Math.sin(a) * RING.inner,
        half = RING.inner / 2;
      const sx = zz < 0 ? Math.sqrt(Math.max(0, half * half - (zz + half) ** 2)) : -Math.sqrt(Math.max(0, half * half - (zz - half) ** 2));
      return [x + sx, z + zz];
    };
    const o0 = [x + Math.cos(a0) * RING.inner, z + Math.sin(a0) * RING.inner],
      o1 = [x + Math.cos(a1) * RING.inner, z + Math.sin(a1) * RING.inner];
    fills.push({ poly: [edge(a0), o0, o1, edge(a1)], col: 'dark' });
  }
  for (const [ez, col] of [
    [z - RING.inner / 2, 'dark'],
    [z + RING.inner / 2, 'band']
  ]) {
    const poly = [];
    for (let i = 0; i < 10; i++) poly.push([x + Math.cos((i * circle) / 10) * 0.08, ez + Math.sin((i * circle) / 10) * 0.08]);
    fills.push({ poly, col });
  }
}
// The roundels before the carved walls, each with a figure from its wall.
walls.forEach((wx, i) => {
  const cz = -4.0;
  arc(wx, cz, 0.37, 0, circle, 0.012, 0.07);
  arc(wx, cz, 0.32, 0, circle, 0.008, 0.07);
  const pose = POSES[(i * 2 + 1) % 5],
    s = 0.48;
  const j = joints(pose);
  const at = ([u, v]) => [wx + u * s, cz + (0.5 - v) * s];
  const path = (pts) => {
    for (let k = 1; k < pts.length; k++) grooves.push([at(pts[k - 1]), at(pts[k]), 0.011]);
  };
  path([j.hip, j.neck]);
  for (let k = 0; k < 2; k++) {
    path([j.hip, j.knees[k], j.feet[k]]);
    path([j.neck, j.elbows[k], j.hands[k]]);
  }
  if (j.sword) path(j.sword);
  const head = at(j.head);
  arc(head[0], head[1], 0.03, 0, circle, 0.008, 0.03);
});
// The border: two grooves round the board's outer edge with a running key between them.
for (const c of layout.cells) {
  if (c.kind === 'reeds' || c.kind === 'rock') continue;
  const x = c.x - CX,
    z = c.y - CZ;
  for (const [dx, dz] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ]) {
    if (layout.mask[c.y + dz]?.[c.x + dx] === '#') continue;
    // Along the side, s runs from -0.5 to 0.5; d is the distance in from the edge.
    const tx = -dz,
      tz = dx;
    const P = (s, d) => [x + dx * (0.5 - d) + tx * s, z + dz * (0.5 - d) + tz * s];
    line(P(-0.5, 0.07), P(0.5, 0.07), 0.009);
    line(P(-0.5, 0.2), P(0.5, 0.2), 0.009);
    for (let s = -0.5; s < 0.49; s += 0.25) {
      const pts = [P(s, 0.1), P(s, 0.17), P(s + 0.125, 0.17), P(s + 0.125, 0.1), P(s + 0.25, 0.1)];
      for (let k = 1; k < pts.length; k++) grooves.push([pts[k - 1], pts[k], 0.007]);
    }
  }
}
// Strokes sorted to the tiles they lie on.
const byTile = new Map();
const keyOf = (x, z) => `${Math.round(x)},${Math.round(z)}`;
const put = (k, v) => {
  if (!byTile.has(k)) byTile.set(k, { grooves: [], fills: [] });
  return byTile.get(k);
};
for (const g of grooves) put(keyOf((g[0][0] + g[1][0]) / 2, (g[0][1] + g[1][1]) / 2)).grooves.push(g);
for (const f of fills) {
  const cx = f.poly.reduce((t, p) => t + p[0], 0) / f.poly.length,
    cz = f.poly.reduce((t, p) => t + p[1], 0) / f.poly.length;
  put(keyOf(cx, cz)).fills.push(f);
}

// Cut the floor's strokes into one tile. `tone(x, z, k)` is the floor's lit colour.
function inlay(m, cell, tone) {
  const wx = cell.x - CX,
    wz = cell.y - CZ;
  if (cell.kind === 'herbs') return;
  const own = byTile.get(`${wx},${wz}`);
  const y = TOP + 0.0015;
  const local = ([x, z]) => [x - wx, z - wz];
  // The walk: a pale slab laid down the tile, bordered by grooves, with a joint across.
  if (WALK.has(`${wx},${wz}`)) {
    const pale = blend(tone(wx, wz, 1.0), rgb(0xb3ad9f), 0.45);
    toward(m, [[-0.4, TOP + 0.003, -0.48], [0.4, TOP + 0.003, -0.48], [0.4, TOP + 0.003, 0.48], [-0.4, TOP + 0.003, 0.48]], pale);
    for (const u of [-0.42, 0.42]) groove(m, [u, -0.48], [u, 0.48], 0.012, tone(wx + u, wz, 0.45), tone(wx + u, wz, 1.25), TOP + 0.0035);
    groove(m, [-0.4, 0.0], [0.4, 0.0], 0.008, tone(wx, wz, 0.5), tone(wx, wz, 1.2), TOP + 0.0035);
  }
  if (!own) return;
  for (const f of own.fills) {
    const [cx, cz] = f.poly[0];
    const base = tone(cx, cz, 1.0);
    const col = f.col === 'band' ? blend(base, rgb(0xb9b3a4), 0.45) : blend(base, rgb(0x2f302c), 0.6);
    toward(
      m,
      f.poly.map((p) => {
        const [u, v] = local(p);
        return [u, y, v];
      }),
      col
    );
  }
  for (const [a, b, w] of own.grooves) {
    const [ax, az] = local(a),
      [bx, bz] = local(b);
    const mx = (a[0] + b[0]) / 2,
      mz = (a[1] + b[1]) / 2;
    groove(m, [ax, az], [bx, bz], w, tone(mx, mz, 0.42), tone(mx, mz, 1.25), y + 0.0008);
  }
}
// A groove on the floor: the dark cut, and the lit lip along its far side.
function groove(m, [ax, az], [bx, bz], w, dark, lip, y) {
  const dx = bx - ax,
    dz = bz - az,
    l = Math.hypot(dx, dz) || 1;
  const nx = (-dz / l) * w,
    nz = (dx / l) * w;
  toward(m, [[ax - nx, y, az - nz], [bx - nx, y, bz - nz], [bx + nx, y, bz + nz], [ax + nx, y, az + nz]], dark);
  if (w > 0.0085)
    toward(m, [[ax + nx, y, az + nz], [bx + nx, y, bz + nz], [bx + nx * 1.8, y, bz + nz * 1.8], [ax + nx * 1.8, y, az + nz * 1.8]], lip);
}

export { inlay, RING, WALK };
