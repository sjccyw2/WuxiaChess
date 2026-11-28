// 俠客島's cave hall: the rock floor round the board and the island's flank outside it, the
// cave wall that closes the hall in (with the two sea arches and the great mouth cut through
// it), and the two rock buttresses at the back corners with their lamp niches.
import { Model, circle } from '../scenery-kit.js';
import {
  SEA,
  ZC,
  clamp,
  smooth,
  rgb,
  blend,
  noise,
  fbm,
  hash,
  onBoard,
  boardOff,
  footRadius,
  wallHeight,
  openings,
  insideOpening,
  onOutline,
  channel,
  mouth,
  floorHeight,
  buttresses,
  lightAt,
  Shell,
  fromInside
} from './kit-19.js';

// ---------------------------------------------------------------------------
// The floor: one smooth sheet of rock under everything that is not the board.
function coordinates(from, to, fine, mid) {
  const out = [];
  let v = from;
  while (v <= to + 1e-6) {
    out.push(Math.round(v * 1000) / 1000);
    const a = Math.abs(v);
    v += a < fine ? 0.25 : a < mid ? 0.5 : 1.0;
  }
  return out;
}
// The rock's own colour at a point of the floor, before the light.
function floorTone(x, y, z) {
  const n1 = fbm(x * 0.8 + 1.7, z * 0.8 - 4.2),
    n2 = noise(x * 4.3 + 2.1, z * 4.3 - 1.3),
    off = boardOff(x, z);
  // Bedded sandstone: bands that cross the hall from south-west to north-east.
  const bed = 0.5 + 0.5 * Math.sin(x * 0.9 - z * 1.25 + 2.2 * n1);
  let c = blend(rgb(0x55534d), rgb(0x77736a), 0.25 + 0.45 * bed + 0.2 * n2);
  // Worn paler round the board, where the island's people have walked for decades.
  c = blend(c, rgb(0x8a8578), 0.35 * (1 - smooth(0.2, 1.6, off)) * (0.6 + 0.4 * n2));
  // The talus and rim: broken rock, darker in its gaps.
  const rubble = smooth(0.12, 0.7, y) * (1 - smooth(1.6, 2.4, y));
  c = blend(c, blend(rgb(0x3f3d39), rgb(0x67645b), n2), 0.6 * rubble);
  // Sand blown and washed into the mouth.
  const sand = mouth(x, z) * smooth(0.42, 0.62, n1 + 0.1 * smooth(5, 8, z));
  c = blend(c, blend(rgb(0x8f887a), rgb(0xa59d88), n2), 0.6 * sand);
  // The tide: wet dark rock below the high-water line, a pale crust of barnacles at it,
  // weed under it, and the pale sand of the sea floor below.
  const wet = 1 - smooth(SEA + 0.12, SEA + 0.42, y);
  c = blend(c, rgb(0x3e423d), 0.75 * wet);
  const crust = Math.exp(-(((y - SEA - 0.2) / 0.08) ** 2));
  c = blend(c, rgb(0xb2ad98), 0.55 * crust * (0.5 + 0.5 * n2));
  const weed = Math.exp(-(((y - SEA + 0.02) / 0.12) ** 2));
  c = blend(c, rgb(0x4c6a4c), 0.6 * weed * smooth(0.3, 0.7, n1));
  if (y < SEA - 0.1) c = blend(rgb(0x8d9479), rgb(0x2d4a4c), smooth(SEA - 0.1, SEA - 1.4, y));
  // Outside the wall, the island's weathered top: paler, crusted with salt and lichen.
  const d = Math.hypot(x, z - ZC),
    R = footRadius(Math.atan2(z - ZC, x));
  const outside = smooth(R + 0.2, R + 1.2, d) * smooth(SEA + 0.4, SEA + 0.9, y);
  c = blend(c, blend(rgb(0x4e4d48), rgb(0x6e6b64), n2), 0.75 * outside);
  return c.map((v) => v * (0.94 + 0.12 * n2));
}
function caveFloor(T) {
  const xs = coordinates(-19, 19, 11.01, 15.01),
    zs = coordinates(-17, 18, 10.51, 14.01);
  const W = xs.length,
    pos = [],
    col = [],
    idx = [];
  for (const z of zs)
    for (const x of xs) {
      const y = floorHeight(x, z);
      pos.push(x, y, z);
      const out = Math.hypot(x, z - ZC) > footRadius(Math.atan2(z - ZC, x)) + 0.5;
      col.push(...lightAt(x, y, z, floorTone(x, y, z), out ? 0.25 : 1));
    }
  for (let j = 1; j < zs.length; j++)
    for (let i = 1; i < W; i++) {
      const x = (xs[i] + xs[i - 1]) / 2,
        z = (zs[j] + zs[j - 1]) / 2;
      // The board lays its own ground; deep sea floor is hidden by the water.
      if (onBoard(x, z)) continue;
      const a = j * W + i,
        b = a - 1,
        c = a - W,
        d = c - 1;
      const ys = [a, b, c, d].map((k) => pos[k * 3 + 1]);
      if (Math.max(...ys) < SEA - 1.9) continue;
      if ((i + j) % 2) idx.push(d, b, a, d, a, c);
      else idx.push(d, b, c, b, a, c);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mesh = new T.Mesh(
    geo,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.03 })
  );
  mesh.material.name = 'Maze_Stone_Wood';
  mesh.name = '石洞地面與島岸';
  mesh.receiveShadow = true;
  const group = new T.Group();
  group.name = '石洞地面與島岸';
  group.userData = { occluder: false, distant: false, kind: 'maze-scenery' };
  group.add(mesh);
  return group;
}

// ---------------------------------------------------------------------------
// The cave wall: a ring round the hall, rising from under the talus, leaning in as it goes
// up, bedded in courses, wet and crusted where the tide reaches it, dark toward the roof.
const N = 320,
  K = 26,
  BASE = -1.3;
function lean(y) {
  const h = Math.max(0, y - 0.4);
  return 0.13 * h + 0.012 * h * h;
}
// Jointed granite: the face breaks into blocks, each standing a little proud of or back from
// its neighbours, so the wall reads as rock split along its joints rather than as a curtain.
function joint(a, y) {
  const u = (a * 8.9) / 1.15,
    v = y / 0.95 + 0.5 * Math.floor(u) * 0.37;
  const bu = Math.floor(u + 0.3 * Math.sin(v * 1.3)),
    bv = Math.floor(v);
  return hash(bu * 1.7 + 3.1, bv * 2.3 - 1.9) - 0.5;
}
function wallPoint(a, y) {
  const R = footRadius(a);
  const block = 0.2 * joint(a, y) * smooth(0.2, 1.4, y);
  const bulge =
    (0.18 * Math.sin(a * 5 + 0.7) + 0.12 * (fbm(a * 4.1, y * 0.35) - 0.5)) * smooth(0.3, 1.8, y);
  const flare = 0.3 * smooth(0.8, -0.6, y);
  const r = R + flare - lean(y) + bulge + block;
  return [Math.cos(a) * r, y, ZC + Math.sin(a) * r];
}
// How near a point of the wall lies to an opening, for its tide marks and sea light.
function nearOpening(a, y) {
  let best = -9;
  for (const o of openings) best = Math.max(best, insideOpening(o, a, y));
  return best;
}
function wallTone(a, y, H) {
  const n = noise(a * 14, y * 1.7),
    j = joint(a, y);
  let c = blend(rgb(0x45464a), rgb(0x66675f), 0.35 + 0.4 * n + 0.5 * j);
  // Iron staining runs down from some joints; a pale quartz vein here and there.
  c = blend(c, rgb(0x6b5a46), 0.35 * smooth(0.55, 0.8, noise(a * 31, y * 0.25)));
  const vein = Math.exp(-(((Math.sin(a * 23 + y * 0.9) - 0.96) / 0.03) ** 2));
  c = blend(c, rgb(0xa49d8a), 0.45 * vein * smooth(0.5, 2, y));
  // Wet and dark low down; tide marks round the openings.
  c = blend(c, rgb(0x34352f), 0.5 * smooth(1.4, 0.2, y));
  const tide = smooth(-2.2, -0.4, nearOpening(a, y) - 0.0) * smooth(-2.4, -1.0, nearOpening(a, SEA));
  const crust = Math.exp(-(((y - SEA - 0.28) / 0.13) ** 2)),
    weed = Math.exp(-(((y - SEA) / 0.16) ** 2));
  c = blend(c, rgb(0xaaa591), 0.7 * crust * tide);
  c = blend(c, rgb(0x3f5a43), 0.65 * weed * tide);
  // Darkness gathers up toward the unseen roof.
  c = blend(c, rgb(0x121314), 0.72 * smooth(2.6, H, y));
  return c;
}
function caveWall(T) {
  const m = new Model(T, 191407),
    shell = new Shell(m),
    r = m.rng;
  const heights = [],
    params = [];
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI / 2 + (i * circle) / N,
      H = wallHeight(a),
      col = [];
    heights.push(H);
    for (let k = 0; k <= K; k++) col.push([a, BASE + (H - BASE) * (k / K) ** 1.18]);
    params.push(col);
  }
  // Which quads lie in an opening, and in which.
  const hole = [];
  for (let i = 0; i < N; i++) {
    const row = [];
    for (let k = 0; k < K; k++) {
      const a = (params[i][k][0] + params[i + 1][k][0]) / 2,
        y = (params[i][k][1] + params[i][k + 1][1]) / 2;
      row.push(openings.find((o) => insideOpening(o, a, y) > 0) || null);
    }
    hole.push(row);
  }
  const holeAt = (i, k) => (i < 0 || i >= N || k < 0 || k >= K ? undefined : hole[i][k]);
  // A corner shared by a kept quad and an opening is moved onto the opening's outline, so the
  // arches have clean edges rather than the steps of the grid.
  for (let i = 0; i <= N; i++)
    for (let k = 0; k <= K; k++) {
      const around = [holeAt(i - 1, k - 1), holeAt(i, k - 1), holeAt(i - 1, k), holeAt(i, k)].filter(
        (q) => q !== undefined
      );
      const o = around.find((q) => q);
      if (o && around.some((q) => !q)) params[i][k] = onOutline(o, ...params[i][k]);
    }
  const point = (i, k) => wallPoint(...params[i][k]);
  const tone = (i, k) => {
    const [a, y] = params[i][k],
      p = point(i, k);
    return lightAt(p[0], p[1], p[2], wallTone(a, y, heights[i]), 0.55);
  };
  const pts = [],
    cols = [];
  for (let i = 0; i <= N; i++) {
    pts.push([]);
    cols.push([]);
    for (let k = 0; k <= K; k++) {
      pts[i].push(point(i, k));
      cols[i].push(tone(i, k));
    }
  }
  // Each quad is wound to face into the cave, and remembers that direction.
  const normals = [];
  function inward(q, c, a) {
    const [p0, p1, p2] = q;
    const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]],
      v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1;
    n = n.map((t) => t / l);
    if (n[0] * Math.cos(a) + n[2] * Math.sin(a) > 0) {
      q = [...q].reverse();
      c = [...c].reverse();
      n = n.map((t) => -t);
    }
    shell.face(q, c, n);
    return n;
  }
  for (let i = 0; i < N; i++) {
    normals.push([]);
    const a = params[i][0][0];
    for (let k = 0; k < K; k++) {
      if (hole[i][k]) {
        normals[i].push(null);
        continue;
      }
      normals[i].push(
        inward(
          [pts[i][k], pts[i + 1][k], pts[i + 1][k + 1], pts[i][k + 1]],
          [cols[i][k], cols[i + 1][k], cols[i + 1][k + 1], cols[i][k + 1]],
          a
        )
      );
    }
  }
  // The thickness of the rock round each opening: a lining run outward from its edge.
  const outward = (p, d) => {
    const a = Math.atan2(p[2] - ZC, p[0]);
    return [p[0] + Math.cos(a) * d, p[1], p[2] + Math.sin(a) * d];
  };
  const depth = (p) => 1.25 + 0.35 * noise(p[0] * 2.1, p[1] * 2.1 + p[2]);
  function lining(p, q, cp, cq, n, o) {
    const p2 = outward(p, depth(p)),
      q2 = outward(q, depth(q));
    const outside = (c, pp) => lightAt(pp[0], pp[1], pp[2], blend(c, rgb(0x8c897a), 0.25), 0.2);
    const quad = [p, q, q2, p2],
      col = [cp, cq, outside(cq, q2), outside(cp, p2)];
    // Turned toward the middle of the opening.
    const mid = quad.reduce((s, t) => s.map((v, j) => v + t[j] / 4), [0, 0, 0]);
    const centre = [Math.cos(o.a) * footRadius(o.a), (o.spring + o.crown) / 2.6, ZC + Math.sin(o.a) * footRadius(o.a)];
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]],
      v = [p2[0] - p[0], p2[1] - p[1], p2[2] - p[2]];
    const nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const toward = [centre[0] - mid[0], centre[1] - mid[1], centre[2] - mid[2]];
    if (nn[0] * toward[0] + nn[1] * toward[1] + nn[2] * toward[2] < 0) {
      quad.reverse();
      col.reverse();
    }
    shell.face(quad, col, n);
  }
  for (let i = 0; i < N; i++)
    for (let k = 0; k < K; k++) {
      const n = normals[i][k];
      if (!n) continue;
      const nb = [
        [i - 1, k, [i, k], [i, k + 1]],
        [i + 1, k, [i + 1, k], [i + 1, k + 1]],
        [i, k - 1, [i, k], [i + 1, k]],
        [i, k + 1, [i, k + 1], [i + 1, k + 1]]
      ];
      for (const [ii, kk, A, B] of nb) {
        const o = holeAt(ii, kk);
        if (!o) continue;
        lining(pts[A[0]][A[1]], pts[B[0]][B[1]], cols[A[0]][A[1]], cols[B[0]][B[1]], n, o);
      }
    }
  // Cracks down the face, and a fringe of short dripstone under the jutting courses.
  for (let j = 0; j < 90; j++) {
    const i = Math.floor(r.range(0, N)),
      k0 = Math.floor(r.range(3, K - 6)),
      len = Math.floor(r.range(2, 7));
    let prev = null;
    for (let k = k0; k < Math.min(K, k0 + len); k++) {
      if (!normals[i][k]) break;
      const n = normals[i][k],
        p = pts[i][k],
        q = pts[i + 1][k];
      const t = 0.3 + 0.4 * hash(j, k),
        at = [p[0] + (q[0] - p[0]) * t + n[0] * 0.02, p[1], p[2] + (q[2] - p[2]) * t + n[2] * 0.02];
      if (prev) {
        const w = 0.025,
          tx = q[0] - p[0],
          tz = q[2] - p[2],
          l = Math.hypot(tx, tz) || 1;
        const sx = (tx / l) * w,
          sz = (tz / l) * w;
        const dark = blend(cols[i][k], rgb(0x0e0f10), 0.7);
        shell.face(
          [
            [prev[0] - sx, prev[1], prev[2] - sz],
            [prev[0] + sx, prev[1], prev[2] + sz],
            [at[0] + sx, at[1], at[2] + sz],
            [at[0] - sx, at[1], at[2] - sz]
          ],
          [dark, dark, dark, dark],
          n
        );
      }
      prev = at;
    }
  }
  for (let i = 0; i < N; i++)
    for (let k = 9; k < K; k += 2) {
      if (!normals[i][k] || r.next() > 0.3) continue;
      const n = normals[i][k],
        L = pts[i][k],
        Rr = pts[i + 1][k],
        w = r.range(0.3, 0.7);
      const mid = [L[0] + (Rr[0] - L[0]) * w, L[1] + (Rr[1] - L[1]) * w, L[2] + (Rr[2] - L[2]) * w];
      const drop = 0.15 + 0.8 * r.next() ** 2;
      const off = (p, d) => [p[0] + n[0] * d, p[1], p[2] + n[2] * d];
      const ridge = off([mid[0], mid[1] - 0.06, mid[2]], 0.12),
        tip = off([mid[0], mid[1] - drop, mid[2]], 0.05);
      const c0 = cols[i][k],
        c1 = blend(c0, rgb(0x7a7466), 0.3);
      shell.face([off(L, 0.03), ridge, tip], [c0, c1, c1], n);
      shell.face([ridge, off(Rr, 0.03), tip], [c1, c0, c1], n);
    }
  // Sea pinks and fern in the damp by the arches.
  for (let j = 0; j < 140; j++) {
    const o = openings[j % 2],
      a = o.a + r.range(-1, 1) * (o.half + 1.4) / footRadius(o.a),
      y = r.range(0.4, 3.6);
    if (insideOpening(o, a, y) > -0.1) continue;
    const i = Math.floor(((a + Math.PI / 2) / circle) * N + N) % N,
      k = params[i].findIndex((p) => p[1] > y) - 1;
    const n = normals[i]?.[k];
    if (!n || n[1] < -0.35) continue;
    const base = wallPoint(a, y).map((v, t) => v + n[t] * 0.03);
    const green = r.pick([0x4f6b45, 0x5d7a4c, 0x6b8456]);
    for (let f = 0; f < 5; f++) {
      const s = r.range(-1.1, 1.1),
        l = r.range(0.12, 0.26);
      const dir = [n[0] + Math.cos(a + Math.PI / 2) * s * 0.6, 0.55 + 0.2 * f / 5, n[2] + Math.sin(a + Math.PI / 2) * s * 0.6];
      const tip = base.map((v, t) => v + dir[t] * l);
      const side = [Math.cos(a + Math.PI / 2) * l * 0.18, 0, Math.sin(a + Math.PI / 2) * l * 0.18];
      const mid = base.map((v, t) => v + dir[t] * l * 0.5);
      const lit = lightAt(...base, rgb(green), 0.55);
      shell.face(
        [base, [mid[0] + side[0], mid[1] + 0.02, mid[2] + side[2]], tip, [mid[0] - side[0], mid[1], mid[2] - side[2]]],
        [lit, lit, blend(lit, rgb(0x9fb07a), 0.3), lit],
        n
      );
    }
  }
  const group = m.finish('洞壁、海門與洞口', { cast: false });
  fromInside(T, group, shell);
  return group;
}

// ---------------------------------------------------------------------------
// A buttress of the wall at each back corner of the hall: bedded courses of rock leaning a
// little as they rise, with a lamp niche cut toward the board.
function buttress(m, b) {
  const n = 15,
    rows = 16,
    r = m.rng,
    salt = b.x;
  const poly = Array.from({ length: n }, (_, i) => [
    (i * circle) / n + 0.2 * Math.sin(i * 2.3 + salt),
    0.82 + 0.24 * Math.abs(Math.sin(i * 1.7 + salt * 0.7))
  ]);
  const base = -0.4;
  let prev;
  for (let k = 0; k <= rows; k++) {
    const t = k / rows,
      y = base + (b.h - base) * t,
      taper = (1 - 0.45 * t ** 1.3) * (k % 2 ? 1.04 : 0.97);
    const ring = poly.map(([a, q]) => {
      const j = 1 + r.range(-0.04, 0.04);
      const px = b.x + Math.cos(a) * b.rx * q * taper * j - Math.sign(b.x) * 0.5 * t * t,
        pz = b.z + Math.sin(a) * b.rz * q * taper * j - 0.6 * t * t;
      const band = 0.5 + 0.5 * Math.sin(y * 3.1 + salt);
      let c = blend(rgb(0x45443f), rgb(0x625f57), 0.2 + 0.6 * band);
      c = blend(c, rgb(0x34352f), 0.5 * smooth(1.2, 0, y));
      c = blend(c, rgb(0x111214), 0.7 * smooth(2.4, b.h, y));
      return [px, y, pz, lightAt(px, y, pz, c, 0.6)];
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
  // The niche: a round-headed recess with a stone sill, the lamp standing on it.
  const [nx, ny, nz] = b.niche,
    yaw = Math.atan2(nx - b.x, nz - b.z);
  m.frame(nx, ny, nz, yaw, 1, () => {
    const dark = lightAt(nx, ny, nz, rgb(0x2a2723)),
      lip = lightAt(nx, ny, nz, rgb(0x8a8371));
    const arch = [];
    for (let i = 0; i <= 10; i++) {
      const t = (i / 10) * Math.PI;
      arch.push([Math.cos(t) * 0.2, 0.32 + Math.sin(t) * 0.2]);
    }
    const outline = [[0.2, -0.12], ...arch, [-0.2, -0.12]];
    const back = outline.map(([u, v]) => [u * 0.85, v, -0.28]),
      front = outline.map(([u, v]) => [u, v, 0.05]);
    m.face(back, dark);
    for (let i = 0; i < outline.length - 1; i++)
      m.face([back[i], back[i + 1], front[i + 1], front[i]], blend(dark, lip, 0.35));
    m.box(0, -0.15, 0.0, 0.5, 0.07, 0.34, lip);
    m.box(0, -0.24, 0.08, 0.42, 0.1, 0.12, blend(lip, dark, 0.4));
    // The lamp: a squat bronze bowl on a foot, with a wick.
    m.lathe(0, -0.115, 0, [[0, 0.04], [0.03, 0.05], [0.05, 0.03], [0.09, 0.08], [0.1, 0.075]], 0x7d6441, 10);
    m.box(0, 0.06, -0.255, 0.3, 0.16, 0.02, blend(dark, rgb(0x5a3a1a), 0.4));
  });
  // Weed and crust at the buttress foot, where spray reaches it.
  for (let j = 0; j < 7; j++) {
    const a = r.range(0, circle),
      px = b.x + Math.cos(a) * b.rx * 1.05,
      pz = b.z + Math.sin(a) * b.rz * 1.05;
    if (onBoard(px, pz)) continue;
    m.rock(px, floorHeight(px, pz) - 0.06, pz, r.range(0.12, 0.3), r.range(0.1, 0.28), r.range(0.1, 0.24), 0x57534a, 0x8c8676, 7);
  }
}
function cornerButtresses(T) {
  const m = new Model(T, 192233);
  for (const b of buttresses) buttress(m, b);
  return m.finish('洞角石壁與燈龕', { occluder: true });
}

export { caveFloor, caveWall, cornerButtresses, wallPoint, lean };
