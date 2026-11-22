import { Model, circle } from '../scenery-kit.js';
import { wallRadius, extraLights } from './kit-7.js';

// The cavern around 寒玉石室: hewn jade paving on the walkway, the cave wall
// that closes the two grottoes in, rock spurs, columns and dripstone, the
// tomb's iron lamps and the stone coffin, and the props of three tile kinds
// (the jade outcrop, the broken jade seat and the frosted stone curtain).

const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
function smooth(a, b, v) {
  const q = clamp((v - a) / (b - a), 0, 1);
  return q * q * (3 - 2 * q);
}
// Hex colours to the linear values three's vertex colours expect.
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255].map((v) => linear(v / 255));
const blend = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// The default camera looks in from the south-east; walls on that side stay low.
const toViewer = [0.636, 0.772];
const waterLine = -1.0;

// Jade and lamp light baked into the vertex colours of floor and walls, so the
// crystals seem to light what is near them without any real-time light.
function lightField(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const jade = rgb(0x6fd8b4),
    warm = rgb(0xffb763);
  const sources = layout.cells
    .filter((c) => c.kind === 'rock')
    .map((c) => ({ x: c.x - cx, y: 0.45, z: c.y - cz, r: 0.9, k: 0.32, col: jade }));
  for (const [x, z, k] of wallCrystals)
    sources.push({ x, y: -0.4, z, r: 2.6, k: 0.42 * k, col: jade });
  sources.push({ x: -0.25, y: 0.8, z: 6.9, r: 1.6, k: 0.3, col: jade });
  sources.push({ x: 3.98, y: 0.3, z: 6.73, r: 1.15, k: 0.26, col: warm });
  for (const [x, z] of tombLamps) sources.push({ x, y: 1.0, z, r: 1.5, k: 0.3, col: warm });
  // The altar candles, the jade bed and the lamps of the side passages.
  for (const [x, y, z, r, k, col] of extraLights)
    sources.push({ x, y, z, r, k, col: col === 'warm' ? warm : jade });
  return (x, y, z, base) => {
    const out = base.slice();
    for (const s of sources) {
      const d2 = ((x - s.x) ** 2 + (y - s.y) ** 2 * 0.5 + (z - s.z) ** 2) / (s.r * s.r);
      if (d2 > 6) continue;
      const w = s.k * Math.exp(-d2);
      for (let i = 0; i < 3; i++) out[i] += s.col[i] * w * (0.35 + out[i]);
    }
    return out.map((v) => Math.min(1, v));
  };
}

// Clusters of cold jade grown from the rock: bearing and size of those at the
// foot of the cave wall, then x, z and size of those under the spurs.
const wallCrystals = [
  [-2.4, 1.0],
  [-1.85, 0.8],
  [-0.96, 1.1],
  [3.25, 0.9],
  [-0.56, 0.8],
  [2.56, 0.75],
  [0.14, 0.7],
  [-2.85, 0.6],
  [1.62, 0.5]
]
  .map(([a, s]) => {
    const rad = wallRadius(a) - 1.2;
    return [Math.cos(a) * rad, Math.sin(a) * rad, s];
  })
  .concat([
    [-6.2, -8.95, 0.55],
    [8.85, -3.0, 0.6],
    [-8.85, -5.2, 0.6]
  ]);
const tombLamps = [
  [-6.42, 0.62],
  [-6.42, 5.2]
];

// ---------------------------------------------------------------------------
// Paving: courses of hewn jade slabs in running bond, laid across the tiles
// (the board draws its own grid), worn, cracked, damp by the spring and
// rimed with frost toward the cold walls.
function slab(m, x0, z0, x1, z1, top, foot, tint, lit, rng) {
  const cut = Math.min(0.045, (x1 - x0) * 0.18, (z1 - z0) * 0.18);
  const chip = rng.next() < 0.35 ? rng.range(0.02, 0.05) : 0;
  const corner = Math.floor(rng.next() * 4);
  const outline = [
    [x0 + cut + (corner === 0 ? chip : 0), z0],
    [x1 - cut - (corner === 1 ? chip : 0), z0],
    [x1, z0 + cut + (corner === 1 ? chip : 0)],
    [x1, z1 - cut - (corner === 2 ? chip : 0)],
    [x1 - cut - (corner === 2 ? chip : 0), z1],
    [x0 + cut + (corner === 3 ? chip : 0), z1],
    [x0, z1 - cut - (corner === 3 ? chip : 0)],
    [x0, z0 + cut + (corner === 0 ? chip : 0)]
  ].reverse();
  const mx = (x0 + x1) / 2,
    mz = (z0 + z1) / 2;
  // A slight settle: each slab tips a little, as old paving does.
  const tx = rng.range(-0.012, 0.012),
    tz = rng.range(-0.012, 0.012);
  const h = (x, z) => top + tx * (x - mx) + tz * (z - mz);
  const inset = 0.016;
  const cap = outline.map(([x, z]) => {
    const u = x - Math.sign(x - mx) * inset,
      v = z - Math.sign(z - mz) * inset;
    return [u, h(u, v), v];
  });
  const rim = outline.map(([x, z]) => [x, h(x, z) - 0.011, z]);
  const low = outline.map(([x, z]) => [x, foot, z]);
  const edge = blend(tint, [0.32, 0.4, 0.4], 0.28);
  const side = blend(tint, [0.2, 0.27, 0.28], 0.55);
  m.face(
    cap,
    cap.map((p) => lit(p[0], p[1], p[2], tint))
  );
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    m.face(
      [rim[i], rim[j], cap[j], cap[i]],
      [
        lit(rim[i][0], 0, rim[i][2], edge),
        lit(rim[j][0], 0, rim[j][2], edge),
        lit(cap[j][0], 0, cap[j][2], tint),
        lit(cap[i][0], 0, cap[i][2], tint)
      ]
    );
    m.face([low[i], low[j], rim[j], rim[i]], side);
  }
  return { cap, h, mx, mz };
}
function paving(m, layout, ground, lit, streamCenter) {
  const { width, height, mask, cells } = layout,
    cx = (width - 1) / 2,
    cz = (height - 1) / 2;
  const kinds = new Map(cells.map((c) => [c.y * width + c.x, c.kind]));
  const paved = (c, r) => {
    if (c < 0 || c >= width) return false;
    const k = kinds.get(r * width + c);
    return k && k !== 'bridge' && k !== 'reeds' && k !== 'herbs';
  };
  const inMask = (c, r) => mask[r]?.[c] === '#';
  const r = m.rng;
  const joint = rgb(0x324543);
  const stones = [rgb(0x7d9a91), rgb(0x87a299), rgb(0x90aa9f), rgb(0x83a09a), rgb(0x98b0a5)];
  const frost = rgb(0xc4d8d5),
    damp = rgb(0x5a7d73),
    polish = rgb(0xa5bcb1);
  // Distance (in tiles) from a point to the nearest edge of the walkway.
  const edgeDistance = (x, z) => {
    let best = 9;
    for (let dr = -3; dr <= 3; dr++)
      for (let dc = -3; dc <= 3; dc++) {
        const c = Math.round(x + cx + dc),
          rr = Math.round(z + cz + dr);
        if (inMask(c, rr)) continue;
        const ex = Math.max(0, Math.abs(x - (c - cx)) - 0.5),
          ez = Math.max(0, Math.abs(z - (rr - cz)) - 0.5);
        best = Math.min(best, Math.hypot(ex, ez));
      }
    return best;
  };
  for (let row = 0; row < height; row++) {
    // Three courses to a tile row, laid west to east in runs of paved tiles.
    for (let course = 0; course < 3; course++) {
      const z0 = row - cz - 0.5 + course / 3,
        z1 = z0 + 1 / 3;
      let col = 0;
      while (col < width) {
        if (!paved(col, row)) {
          col++;
          continue;
        }
        let end = col;
        while (paved(end + 1, row)) end++;
        const west = col - cx - 0.5,
          east = end - cx + 0.5;
        // Each course starts with a stone of a different length, so the
        // joints of neighbouring courses never line up.
        let x = west,
          first = true;
        while (x < east - 0.02) {
          let len = first ? r.range(0.18, 0.55) : r.range(0.36, 0.78);
          if (first) len += [0, 0.21, 0.43][course];
          first = false;
          if (east - (x + len) < 0.16) len = east - x;
          const x1 = Math.min(east, x + len);
          const mx = (x + x1) / 2,
            mz = (z0 + z1) / 2;
          const near = edgeDistance(mx, mz),
            spring = Math.abs(mx - streamCenter(mz));
          let tint = r.pick(stones);
          tint = blend(tint, rgb(0x7bab9a), 0.18 * r.next());
          // Damp and greener next to the cold spring, polished down the lanes
          // leading to the two stone beams, rimed with frost out by the walls.
          tint = blend(tint, damp, 0.42 * (1 - smooth(0.5, 1.7, spring)));
          tint = blend(
            tint,
            polish,
            0.3 *
              (1 - smooth(0.4, 1.4, Math.abs(Math.abs(mz) - 2))) *
              (1 - smooth(1.2, 3.4, spring))
          );
          tint = blend(tint, frost, 0.5 * (1 - smooth(0.05, 1.1, near)) * r.range(0.4, 1));
          const outer = near < 0.02;
          const s = slab(
            m,
            x + 0.012,
            z0 + 0.012,
            x1 - 0.012,
            z1 - 0.012,
            0.074 + r.range(-0.004, 0.004),
            outer ? -0.1 : 0.04,
            tint,
            lit,
            r
          );
          decorate(m, s, x + 0.012, z0 + 0.012, x1 - 0.012, z1 - 0.012, tint, near, spring, lit, r);
          x = x1;
        }
        col = end + 1;
      }
    }
  }
  // Dark bedding shows in the joints between the slabs.
  for (const cell of cells) {
    if (!paved(cell.x, cell.y)) continue;
    const x = cell.x - cx,
      z = cell.y - cz;
    m.face(
      [
        [x - 0.5, 0.066, z - 0.5],
        [x - 0.5, 0.066, z + 0.5],
        [x + 0.5, 0.066, z + 0.5],
        [x + 0.5, 0.066, z - 0.5]
      ],
      joint
    );
  }
  // The medicinal spring wells up in a kerbed basin on each herb tile.
  for (const cell of cells) {
    if (cell.kind !== 'herbs') continue;
    springBasin(m, cell.x - cx, cell.y - cz, lit, r);
  }
}
function springBasin(m, x, z, lit, r) {
  // Kerb stones on the four sides of the tile, a ring of wet moss, and the
  // pool itself with a pale mineral lip where the water has left its salts.
  for (const [ax, az, bx, bz] of [
    [-0.5, -0.5, 0.5, -0.36],
    [-0.5, 0.36, 0.5, 0.5],
    [-0.5, -0.36, -0.36, 0.36],
    [0.36, -0.36, 0.5, 0.36]
  ])
    slab(
      m,
      x + ax + 0.012,
      z + az + 0.012,
      x + bx - 0.012,
      z + bz - 0.012,
      0.074,
      0.04,
      rgb(0x8ba79c),
      lit,
      r
    );
  const ring = (rad, y, wob = 0.03) =>
    Array.from({ length: 14 }, (_, k) => {
      const a = -(k * circle) / 14,
        q = rad * (1 + wob * Math.sin(k * 2.7));
      return [x + Math.cos(a) * q, y, z + Math.sin(a) * q * 0.92];
    });
  const moss = ring(0.37, 0.068, 0),
    lip = ring(0.22, 0.072),
    edge = ring(0.19, 0.066),
    water = ring(0.18, 0.058);
  m.face(
    [
      [x - 0.36, 0.067, z - 0.36],
      [x - 0.36, 0.067, z + 0.36],
      [x + 0.36, 0.067, z + 0.36],
      [x + 0.36, 0.067, z - 0.36]
    ].reverse(),
    lit(x, 0, z, rgb(0x4d6f5f))
  );
  for (let k = 0; k < 14; k++) {
    const j = (k + 1) % 14;
    m.face([moss[k], moss[j], lip[j], lip[k]], lit(x, 0, z, rgb(k % 3 ? 0x5a7d62 : 0x6a8a68)));
    m.face([lip[k], lip[j], edge[j], edge[k]], rgb(0xb9d0c4));
    m.face([edge[k], edge[j], water[j], water[k]], rgb(0x6f9f94));
  }
  m.face(water, lit(x, 0, z, rgb(0x3a7f78)));
}
// The rock floor round the walkway: scree fallen from the walls, fissures,
// hoarfrost in the hollows and a few small rimstone puddles.
function caveFloor(m, ground, lit) {
  const r = m.rng;
  const at = (x, z) => ground.terrain(x, z);
  for (let k = 0; k < 900; k++) {
    const x = r.range(-11, 11),
      z = r.range(-10.5, 10.5),
      d = ground.margin(x, z),
      y = at(x, z);
    if (d < 0.12 || y < waterLine + 0.05) continue;
    const kind = r.next();
    if (kind < 0.55) {
      // Scree gathers in drifts at the foot of the spurs and the field's lip.
      const s = r.range(0.035, 0.11) * (1 + 0.6 * smooth(0.5, 2.5, d));
      const c = r.pick([0x4f6765, 0x5d7572, 0x6b827c, 0x465c5c]);
      m.rock(
        x,
        y - s * 0.3,
        z,
        s,
        s * r.range(0.5, 0.9),
        s * r.range(0.7, 1),
        c,
        m.mix(c, 0x9db3a9, 0.35),
        5,
        r.range(0, circle)
      );
    } else if (kind < 0.68) {
      // A patch of rime, laid on the rock's own slope.
      const rx = r.range(0.06, 0.17),
        rz = rx * r.range(0.5, 0.9),
        turn = r.range(0, circle),
        ring = [];
      for (let j = 0; j < 7; j++) {
        const a = -(j * circle) / 7,
          q = r.range(0.65, 1),
          u = Math.cos(a) * rx * q,
          v = Math.sin(a) * rz * q;
        const px = x + u * Math.cos(turn) - v * Math.sin(turn),
          pz = z + u * Math.sin(turn) + v * Math.cos(turn);
        ring.push([px, at(px, pz) + 0.01, pz]);
      }
      m.face(ring, lit(x, y, z, blend(rgb(0x6f8a86), rgb(0x9db4b0), r.next())));
    } else if (kind < 0.93) {
      // A fissure wandering across the rock.
      let px = x,
        pz = z,
        heading = r.range(0, circle);
      const crack = rgb(0x1c2b2e);
      for (let j = 0; j < 4; j++) {
        heading += r.range(-0.6, 0.6);
        const step = r.range(0.12, 0.26),
          qx = px + Math.cos(heading) * step,
          qz = pz + Math.sin(heading) * step,
          w = 0.012 * (1 - j / 5);
        const nx = -Math.sin(heading) * w,
          nz = Math.cos(heading) * w;
        if (ground.margin(qx, qz) < 0.1) break;
        m.face(
          [
            [px - nx, at(px, pz) + 0.008, pz - nz],
            [qx - nx, at(qx, qz) + 0.008, qz - nz],
            [qx + nx, at(qx, qz) + 0.008, qz + nz],
            [px + nx, at(px, pz) + 0.008, pz + nz]
          ],
          crack
        );
        px = qx;
        pz = qz;
      }
    } else if (d > 0.6 && r.next() < 0.5) {
      // A rimstone puddle: black water held in a pale calcite lip.
      const rad = r.range(0.12, 0.26),
        lip = [],
        pool = [];
      for (let j = 0; j < 9; j++) {
        const a = -(j * circle) / 9,
          q = r.range(0.8, 1.05);
        lip.push([x + Math.cos(a) * rad * q, y + 0.028, z + Math.sin(a) * rad * q * 0.8]);
        pool.push([x + Math.cos(a) * rad * q * 0.78, y + 0.024, z + Math.sin(a) * rad * q * 0.62]);
      }
      for (let j = 0; j < 9; j++) {
        const i = (j + 1) % 9;
        m.face([lip[j], lip[i], pool[i], pool[j]], rgb(0xa6bfb3));
        m.face(
          [[lip[j][0], y - 0.03, lip[j][2]], [lip[i][0], y - 0.03, lip[i][2]], lip[i], lip[j]],
          rgb(0x7f9a90)
        );
      }
      m.face(pool, rgb(0x13282b));
    }
  }
}
// Hairline cracks, frost crust and spring-fed slime sit on the slab tops.
function decorate(m, s, x0, z0, x1, z1, tint, near, spring, lit, r) {
  const y = (x, z) => s.h(x, z) + 0.0015;
  if (r.next() < 0.3) {
    const pts = [];
    let x = r.range(x0, x1),
      z = z0;
    const horizontal = r.next() < 0.5;
    if (horizontal) {
      x = x0;
      z = r.range(z0, z1);
    }
    for (let k = 0; k < 4; k++) {
      pts.push([x, z]);
      if (horizontal) {
        x += (x1 - x0) / 3;
        z = clamp(z + r.range(-0.06, 0.06), z0, z1);
      } else {
        z += (z1 - z0) / 3;
        x = clamp(x + r.range(-0.06, 0.06), x0, x1);
      }
    }
    const crack = blend(tint, [0.17, 0.24, 0.24], 0.62);
    for (let k = 1; k < pts.length; k++) {
      const [ax, az] = pts[k - 1],
        [bx, bz] = pts[k];
      const len = Math.hypot(bx - ax, bz - az) || 1,
        w = 0.0055;
      const nx = (-(bz - az) / len) * w,
        nz = ((bx - ax) / len) * w;
      m.face(
        [
          [ax + nx, y(ax, az), az + nz],
          [bx + nx, y(bx, bz), bz + nz],
          [bx - nx, y(bx, bz), bz - nz],
          [ax - nx, y(ax, az), az - nz]
        ],
        crack
      );
    }
  }
  const frosty = (1 - smooth(0.1, 1.2, near)) * 0.3 + (1 - smooth(0.4, 1.0, spring)) * 0.15;
  if (r.next() < frosty) {
    // An irregular crust of hoarfrost on part of the slab.
    const fx = r.range(x0 + 0.04, x1 - 0.04),
      fz = r.range(z0 + 0.04, z1 - 0.04),
      rx = Math.min(fx - x0, x1 - fx, r.range(0.03, 0.11)),
      rz = Math.min(fz - z0, z1 - fz, r.range(0.025, 0.07));
    const ring = [];
    for (let k = 0; k < 7; k++) {
      const a = (k * circle) / 7,
        q = r.range(0.6, 1);
      const px = fx + Math.cos(a) * rx * q,
        pz = fz + Math.sin(a) * rz * q;
      ring.push([px, y(px, pz) + 0.0005, pz]);
    }
    m.face(ring.reverse(), lit(fx, 0, fz, blend(tint, rgb(0xcfe2df), 0.3)));
  }
}

// ---------------------------------------------------------------------------
// The cave wall: one ring around both grottoes. It rises from a talus under
// the black water, carries bedding ledges and flowstone drapes, leans in
// toward a vault on the far side and stays low toward the viewer.
// wallRadius, the plan of the wall's foot, is shared from kit-7.js.
const drapes = [0.35, 1.05, 1.7, 2.2, 2.75, 3.3, 3.9, 4.4, 5.0, 5.6, 6.0];
// Faces of the wall are wound to face the middle of the cave, so that with
// front faces only the near wall disappears whenever the camera is behind it.
function inward(m, pts, cols) {
  const [a, b, c] = pts;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const nx = u[1] * v[2] - u[2] * v[1],
    nz = u[0] * v[1] - u[1] * v[0];
  const mx = pts.reduce((t, p) => t + p[0], 0),
    mz = pts.reduce((t, p) => t + p[2], 0);
  if (nx * -mx + nz * -mz < 0)
    m.face([...pts].reverse(), Array.isArray(cols[0]) ? [...cols].reverse() : cols);
  else m.face(pts, cols);
}
function caveWall(m, lit) {
  const N = 176,
    r = m.rng;
  const columns = [];
  for (let i = 0; i <= N; i++) {
    const a = (i * circle) / N,
      ca = Math.cos(a),
      sa = Math.sin(a);
    const facing = ca * toViewer[0] + sa * toViewer[1];
    const R = wallRadius(a);
    const back = smooth(-0.35, 0.85, -facing);
    const H = 6.2 + 4.8 * back + 1.1 * Math.sin(5 * a + 0.4) + 0.5 * Math.sin(11 * a);
    // From the drowned talus up the bedded face, which leans in toward the
    // vault by a fifth or so, stepping a little at every second course as the
    // softer beds weather out. The lean also keeps every face of the wall
    // turned away from a camera standing outside it.
    const profile = [
      [-2.7, R - 2.6],
      [-1.35, R - 1.45],
      [waterLine + 0.06, R - 1.06],
      [waterLine + 0.3, R - 0.95],
      [waterLine + 0.36, R - 0.62]
    ];
    const rows = 11;
    for (let k = 1; k <= rows; k++) {
      const t = k / rows,
        y = waterLine + 0.36 + t * (H - waterLine - 0.36);
      const ledge = k % 2 ? 0.06 : -0.04;
      const bulge = 0.3 * Math.sin(a * 7 + t * 1.2) + 0.08 * Math.sin(a * 17 - t * 1.6);
      profile.push([y, R - 0.55 + bulge + ledge - 0.36 * (y - waterLine - 0.36)]);
    }
    const drape = drapes.reduce(
      (best, d) => Math.max(best, Math.exp(-((((a - d + 9.42) % circle) - 3.14) ** 2) * 140)),
      0
    );
    const ring = profile.map(([y, rad], k) => {
      const wobble = k > 4 ? r.range(-0.02, 0.02) : 0;
      const p = [ca * (rad + wobble), y, sa * (rad + wobble)];
      // Colour: bedding bands, a pale calcite rim at the water, flowstone
      // drapes, and darkness gathering toward the unseen vault.
      const band = 0.5 + 0.5 * Math.sin(y * 2.9 + 0.7 * Math.sin(a * 4));
      let c = blend(rgb(0x223236), rgb(0x3d5253), 0.2 + 0.6 * band);
      if (k % 2 && k > 4) c = blend(c, rgb(0x4d6563), 0.35);
      if (k <= 2) c = blend(rgb(0x1b292d), rgb(0x2b3e40), band);
      if (k === 3) c = rgb(0x5d7a73);
      if (k === 4) c = blend(rgb(0x55716b), c, 0.5);
      c = blend(c, rgb(0x758f86), drape * 0.65 * smooth(-0.6, 1.5, y) * (1 - smooth(H - 2, H, y)));
      c = blend(c, rgb(0x0b1316), 0.85 * smooth(1.0, H, y));
      return { p, c: lit(p[0], p[1], p[2], c) };
    });
    columns.push(ring);
  }
  for (let i = 0; i < N; i++) {
    const A = columns[i],
      B = columns[i + 1];
    for (let k = 1; k < A.length; k++)
      inward(m, [A[k - 1].p, B[k - 1].p, B[k].p, A[k].p], [A[k - 1].c, B[k - 1].c, B[k].c, A[k].c]);
    // Dripstone fringes hang under the jutting courses: a ridged tooth
    // against the face, longer and denser at the back of the cave.
    for (let k = 6; k < A.length; k += 2) {
      if (r.next() > 0.42) continue;
      const L = A[k].p,
        Rr = B[k].p,
        w = r.range(0.3, 0.7),
        y = L[1] + (Rr[1] - L[1]) * w;
      const mid = [L[0] + (Rr[0] - L[0]) * w, y, L[2] + (Rr[2] - L[2]) * w],
        len = Math.hypot(mid[0], mid[2]) || 1;
      const ix = -mid[0] / len,
        iz = -mid[2] / len,
        drop = (0.2 + 1.4 * r.next() ** 2) * (y > 3 ? 1.5 : 0.8);
      // The tooth hangs a hand's breadth off the face and follows its lean,
      // so like the wall it turns its back on a camera outside.
      const off = (p, d) => [p[0] + ix * d, p[1], p[2] + iz * d];
      const ridge = off([mid[0], y - 0.08, mid[2]], 0.16),
        tip = off([mid[0], y - drop, mid[2]], 0.1 - 0.3 * drop);
      const c0 = blend(A[k].c, rgb(0x6e8a82), 0.3),
        c1 = blend(A[k].c, rgb(0x9fb8ad), 0.45);
      inward(m, [off(L, 0.05), ridge, tip], [c0, c1, c1]);
      inward(m, [ridge, off(Rr, 0.05), tip], [c1, c0, c1]);
    }
  }
}

// A tapering cone of dripstone with a few growth rings; length < 0 hangs down.
function spire(m, base, length, radius, lean, col, tip, n = 7) {
  const steps = 5,
    dir = Math.sign(length),
    L = Math.abs(length);
  let prev;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps,
      rr = radius * (1 - t) ** 0.85 * (1 + (k % 2 ? 0.12 : 0)) + 0.004;
    const c = blend(rgb(col), rgb(tip), t * 0.85);
    const ring = [];
    for (let j = 0; j < n; j++) {
      const a = (j * circle) / n;
      ring.push([
        base[0] + Math.cos(a) * rr + lean * t * t * L,
        base[1] + dir * t * L,
        base[2] + Math.sin(a) * rr + lean * 0.6 * t * t * L
      ]);
    }
    if (prev)
      for (let j = 0; j < n; j++) {
        const q = (j + 1) % n;
        if (dir > 0) m.face([prev.ring[j], ring[j], ring[q], prev.ring[q]], [prev.c, c, c, prev.c]);
        else m.face([prev.ring[q], ring[q], ring[j], prev.ring[j]], [prev.c, c, c, prev.c]);
      }
    prev = { ring, c };
  }
}

// A rock buttress of the cave wall: stacked, slightly leaning bedded courses.
function crag(m, x, y, z, rx, rz, h, yaw, lit, salt) {
  const n = 13,
    rows = 12,
    r = m.rng;
  const poly = Array.from({ length: n }, (_, i) => [
    (i * circle) / n + 0.25 * Math.sin(i * 2.3 + salt),
    0.82 + 0.26 * Math.abs(Math.sin(i * 1.7 + salt * 0.7))
  ]);
  let prev;
  for (let k = 0; k <= rows; k++) {
    const t = k / rows,
      taper = (1 - 0.72 * t ** 1.4) * (k % 2 ? 1.06 : 0.95),
      yy = y + h * t;
    const ring = poly.map(([a, q]) => {
      const jitter = 1 + r.range(-0.05, 0.05);
      const u = Math.cos(a) * rx * q * taper * jitter,
        v = Math.sin(a) * rz * q * taper * jitter;
      const px = x + u * Math.cos(yaw) - v * Math.sin(yaw) + 0.18 * t * t * rx,
        pz = z + u * Math.sin(yaw) + v * Math.cos(yaw);
      const band = 0.5 + 0.5 * Math.sin(yy * 3.3 + salt);
      let c = blend(rgb(0x26373b), rgb(0x435a5a), 0.2 + 0.6 * band);
      if (yy < waterLine + 0.25 && yy > waterLine - 0.2) c = rgb(0x7f9d93);
      c = blend(c, rgb(0x6f8a80), 0.55 * Math.max(0, Math.sin(a * 3 + salt)) ** 6);
      c = blend(c, rgb(0x141e21), 0.55 * smooth(1.0, h, yy));
      return { p: [px, yy, pz], c: lit(px, yy, pz, c) };
    });
    if (prev)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        m.face(
          [prev[i].p, ring[i].p, ring[j].p, prev[j].p],
          [prev[i].c, ring[i].c, ring[j].c, prev[j].c]
        );
      }
    prev = ring;
  }
  const top = [x + 0.18 * rx, y + h * 1.04, z];
  for (let i = 0; i < n; i++)
    m.face([prev[i].p, prev[(i + 1) % n].p, top], [prev[i].c, prev[(i + 1) % n].c, rgb(0x2b3a3e)]);
}

// A cluster of jade crystals growing out of rock at x, y, z.
function cluster(m, x, y, z, size, toward, rng, count = 7) {
  for (let k = 0; k < count; k++) {
    const yaw = toward + rng.range(-1.2, 1.2),
      tilt = rng.range(0.15, 0.85) * (k ? 1 : 0.4);
    const h = size * rng.range(0.45, 1.25) * (k ? 1 : 1.5),
      w = size * rng.range(0.09, 0.17) * (k ? 1 : 1.3);
    m.frame(
      x + rng.range(-0.25, 0.25) * size,
      y,
      z + rng.range(-0.25, 0.25) * size,
      yaw,
      1,
      () => m.crystal(0, -0.05, 0, w, h, 0x2f7d6e, 0x8fdcc0, 6, 0),
      tilt
    );
  }
}

function caveWalls(T, ground, layout) {
  const lit = lightField(layout),
    m = new Model(T, 707311);
  caveWall(m, lit);
  const shell = m.parts[0].p.length / 3;
  const r = m.rng;
  // Stalagmites stand on the drowned talus and in the shallows of the lake.
  for (let k = 0; k < 70; k++) {
    const a = r.range(0, circle),
      ca = Math.cos(a),
      sa = Math.sin(a);
    const rad = wallRadius(a) - r.range(1.0, 3.6);
    const x = ca * rad,
      z = sa * rad;
    if (ground.margin(x, z) < 2.2) continue;
    const base = Math.max(waterLine - 0.5, ground.terrain(x, z)) - 0.1;
    const facing = ca * toViewer[0] + sa * toViewer[1];
    // None on the viewer's side, where they would stand before the camera.
    if (facing > 0.45) continue;
    const h = r.range(0.4, 1.6) * (facing > 0 ? 0.7 : 1.1);
    spire(
      m,
      [x, base, z],
      h,
      r.range(0.12, 0.3) * (0.6 + h * 0.3),
      r.range(-0.05, 0.05),
      0x4d6666,
      0xa5bbb0
    );
  }
  m.glow(() => {
    for (const [x, z, s] of wallCrystals) {
      const base = Math.max(waterLine - 0.2, ground.terrain(x, z)) - 0.05;
      cluster(m, x, base, z, 1.15 * s, Math.atan2(-x, -z), r, 8);
    }
  });
  // The shell is not an occluder: it never stands between a camera and the
  // field, because only its inner faces are drawn (see inward above).
  const walls = m.finish('寒玉洞壁', { cast: false });
  walls.traverse((mesh) => {
    if (!mesh.isMesh) return;
    // The cave's own darkness, not the lighter mist, closes in on its walls.
    mesh.material.fog = false;
    if (mesh.material.name === 'Maze_Stone_Wood') drawnFromInside(T, mesh, shell);
  });
  return walls;
}
// Front faces only, so the near wall vanishes whenever the camera is behind
// it; faces seen almost edge-on are dropped as well, or the wall's flank
// would show as a thin dark seam across the picture. Each face is judged
// whole, from its centre and its own normal, so it never half-disappears.
// Only the shell's own faces (the first `shell` vertices) are judged; the
// closed stalagmites drawn after it keep all of theirs. The software renderer draws every face whichever way it turns, so it is
// given a collapsed copy of the shell (far below the stage, where it draws
// nothing) while the GPU reads the true shape from its own attribute.
function drawnFromInside(T, mesh, shell) {
  const g = mesh.geometry,
    shape = g.attributes.position,
    index = g.index.array,
    n = shape.count;
  const centre = new Float32Array(n * 3),
    facing = new Float32Array(n * 3),
    hidden = new Float32Array(n * 3);
  // Model.face fans every face from its first vertex: group by that vertex.
  const faces = new Map();
  for (let i = 0; i < index.length; i += 3) {
    const lead = index[i];
    if (!faces.has(lead)) faces.set(lead, new Set());
    for (let k = 0; k < 3; k++) faces.get(lead).add(index[i + k]);
  }
  const a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3(),
    sum = new T.Vector3();
  for (const [lead, set] of faces) {
    const list = [...set];
    sum.set(0, 0, 0);
    for (const v of list) sum.add(a.fromBufferAttribute(shape, v));
    sum.multiplyScalar(1 / list.length);
    a.fromBufferAttribute(shape, lead);
    b.fromBufferAttribute(shape, list[1]).sub(a);
    c.fromBufferAttribute(shape, list[2]).sub(a);
    b.cross(c).normalize();
    for (const v of list) {
      sum.toArray(centre, v * 3);
      if (lead < shell) b.toArray(facing, v * 3);
    }
  }
  for (let i = 1; i < hidden.length; i += 3) hidden[i] = -400;
  g.setAttribute('caveShape', shape);
  g.setAttribute('caveCentre', new T.Float32BufferAttribute(centre, 3));
  g.setAttribute('caveFacing', new T.Float32BufferAttribute(facing, 3));
  g.setAttribute('position', new T.Float32BufferAttribute(hidden, 3));
  // The bounds still describe the true shell, for frustum culling.
  g.boundingSphere = new T.Sphere(new T.Vector3(0, 3, 0), 30);
  const mat = mesh.material;
  mat.side = T.FrontSide;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'attribute vec3 caveShape, caveCentre, caveFacing;\n' +
      shader.vertexShader
        .replace('#include <begin_vertex>', 'vec3 transformed = caveShape;')
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
          vec3 caveEye = normalize(cameraPosition - (modelMatrix * vec4(caveCentre, 1.)).xyz);
          vec3 caveTurn = normalize(mat3(modelMatrix) * caveFacing);
          if (dot(caveFacing, caveFacing) > .5 && dot(caveTurn, caveEye) < .2)
            gl_Position = vec4(2., 2., 2., 1.);`
        );
  };
}

// ---------------------------------------------------------------------------
// Rock spurs on the four wall shoulders, three columns in the lake, the
// tomb's iron lamps and a stone coffin in the north-west grotto.
const spurs = [
  // x, z, rx, rz, h, yaw
  [-5.7, -8.15, 1.25, 0.8, 3.6, 0.1],
  [-4.0, -8.6, 0.8, 0.6, 2.3, 0.4],
  [4.75, -8.25, 1.2, 0.85, 4.0, 0],
  [6.5, -7.85, 0.75, 0.6, 2.4, 0.7],
  [-8.25, -3.3, 0.8, 1.3, 3.7, 1.3],
  [-8.3, -1.2, 0.6, 0.7, 2.2, 1.0],
  [8.25, -4.1, 0.85, 1.25, 3.4, 1.25],
  [8.05, -1.9, 0.55, 0.6, 1.9, 0.6]
];
const lakeColumns = [
  [9.6, -8.6, 3.4],
  [-9.9, 4.2, 2.6],
  [-3.6, -11.0, 3.8],
  [11.2, -2.6, 2.4]
];
function ironLamp(m, x, y, z) {
  const iron = 0x2f3638,
    rust = 0x5a4a3e;
  m.lathe(
    x,
    y,
    z,
    [
      [0, 0.2],
      [0.08, 0.21],
      [0.11, 0.15],
      [0.2, 0.1],
      [0.24, 0.12],
      [0.28, 0.1]
    ],
    0x667b76,
    8
  );
  m.tube([x, y + 0.27, z], [x, y + 1.02, z], 0.035, 0.028, iron, 6);
  for (const k of [0.45, 0.8]) m.hoop(x, y + k, z, 0.042, 0.012, rust, 8);
  // A pierced iron cage on a bowl, the flame inside it.
  m.lathe(
    x,
    y + 1.0,
    z,
    [
      [0, 0.03],
      [0.04, 0.12],
      [0.07, 0.15]
    ],
    iron,
    8
  );
  m.hoop(x, y + 1.07, z, 0.15, 0.011, iron, 10);
  m.hoop(x, y + 1.36, z, 0.1, 0.011, iron, 10);
  for (let k = 0; k < 4; k++) {
    const a = (k * circle) / 4 + 0.4;
    m.tube(
      [x + Math.cos(a) * 0.15, y + 1.07, z + Math.sin(a) * 0.15],
      [x + Math.cos(a) * 0.1, y + 1.36, z + Math.sin(a) * 0.1],
      0.01,
      0.01,
      iron,
      4
    );
  }
  m.lathe(
    x,
    y + 1.36,
    z,
    [
      [0, 0.12],
      [0.07, 0.05],
      [0.12, 0.012]
    ],
    iron,
    8
  );
  m.glow(() => m.crystal(x, y + 1.09, z, 0.05, 0.19, 0xe49a4c, 0xffe3a2, 6, 0.01));
}
function coffin(m, x, y, z, yaw) {
  m.frame(x, y, z, yaw, 1, () => {
    const stone = 0x66807a,
      pale = 0x9fb5aa,
      dark = 0x41575a;
    m.box(0, 0.06, 0, 1.55, 0.14, 0.86, dark);
    m.box(0, 0.36, 0, 1.38, 0.48, 0.66, stone);
    m.box(0, 0.62, 0, 1.36, 0.05, 0.64, dark);
    // The lid has been pushed aside long ago and rests askew on the chest.
    m.frame(0.12, 0.69, 0.11, 0.09, 1, () => {
      m.box(0, 0, 0, 1.48, 0.1, 0.74, pale);
      m.box(0, 0.075, 0, 1.24, 0.06, 0.5, stone);
    });
    for (const s of [-1, 1]) {
      m.box(s * 0.5, 0.36, 0.335, 0.05, 0.4, 0.02, pale);
      m.hoop(s * 0.5, 0.42, 0.35, 0.06, 0.011, 0x3a4142, 10, 'xy');
    }
    m.box(0, 0.36, 0.335, 0.62, 0.05, 0.02, pale);
    m.box(0, 0.24, 0.335, 0.62, 0.05, 0.02, pale);
  });
}
function caveFeatures(T, ground, layout, flame) {
  const lit = lightField(layout),
    m = new Model(T, 707913);
  const r = m.rng;
  spurs.forEach(([x, z, rx, rz, h, yaw], k) => {
    const base = Math.min(ground.terrain(x, z), waterLine) - 0.6;
    crag(m, x, base, z, rx, rz, h + (0 - base), yaw, lit, k * 1.7);
    // Stubby dripstone at the spur foot, where water runs off it.
    for (let j = 0; j < 4; j++) {
      const a = r.range(0, circle),
        px = x + Math.cos(a) * rx * 1.15,
        pz = z + Math.sin(a) * rz * 1.15;
      if (ground.margin(px, pz) < 0.75) continue;
      spire(
        m,
        [px, ground.terrain(px, pz) - 0.05, pz],
        r.range(0.3, 0.75),
        r.range(0.08, 0.15),
        0,
        0x506a69,
        0xa4bab0
      );
    }
  });
  // Old stalagmites rising out of the lake, each with its younger brood.
  for (const [x, z, h] of lakeColumns) {
    const base = waterLine - 1.2;
    spire(m, [x, base, z], h + 1.2, 0.58, 0.02, 0x3c5356, 0x8aa398, 9);
    spire(m, [x - 0.45, base, z + 0.3], h * 0.45 + 1.2, 0.3, 0.06, 0x3c5356, 0x9cb3a8, 7);
    spire(m, [x + 0.35, base, z - 0.4], h * 0.3 + 1.2, 0.22, -0.05, 0x3c5356, 0x9cb3a8, 7);
  }
  coffin(m, -6.75, ground.terrain(-6.75, -5.75) - 0.02, -5.75, 0.62);
  for (const [x, z] of tombLamps) ironLamp(m, x, ground.terrain(x, z) - 0.04, z);
  // The flame of the oil lamp at the care station by the medicinal spring;
  // it shares this group's warm glow rather than the floor's jade one.
  m.glow(() => m.crystal(...flame, 0.037, 0.129, 0xdfa359, 0xffdf91, 6, 0.012));
  return m.finish('石筍石柱與墓燈', { occluder: true });
}

// ---------------------------------------------------------------------------
// Tile props asked for by the shared scenery (local tile frame, floor at 0.045).

// 寒玉石壁: a bedded boulder with jade crystals pushing out of it.
function jadeOutcrop(m) {
  const r = m.rng;
  m.rock(0, 0.02, 0, 0.36, r.range(0.36, 0.5), 0.31, 0x46605f, 0x7c968c, 9, r.range(0, circle));
  m.rock(r.range(-0.2, 0.2), 0.02, 0.22, 0.17, 0.17, 0.13, 0x50696a, 0x86a095, 7);
  const n = 3 + Math.floor(r.next() * 3);
  m.glow(() => {
    for (let k = 0; k < n; k++) {
      const a = (k * circle) / n + r.range(-0.4, 0.4);
      m.frame(
        Math.cos(a) * 0.13,
        0.2 + r.range(0, 0.15),
        Math.sin(a) * 0.11,
        -a + Math.PI / 2,
        1,
        () =>
          m.crystal(
            0,
            0,
            0,
            r.range(0.06, 0.11),
            r.range(0.32, 0.62) * (k ? 1 : 1.35),
            0x2c7468,
            0x86d4b6,
            6,
            0
          ),
        k ? r.range(0.25, 0.6) : 0.08
      );
    }
  });
}
// 玉臺殘座: the broken footing of a jade dais, its slab cracked and tilted.
function jadeSeat(m) {
  const r = m.rng,
    plinth = 0x58736e,
    jade = 0x84a597,
    dark = 0x3d5352;
  m.box(0, 0.075, -0.24, 0.84, 0.07, 0.42, dark);
  m.box(-0.18, 0.15, -0.25, 0.42, 0.1, 0.36, plinth);
  m.box(0.22, 0.14, -0.25, 0.32, 0.08, 0.34, plinth);
  m.frame(-0.17, 0.215, -0.25, r.range(-0.08, 0.08), 1, () => {
    m.box(0, 0, 0, 0.4, 0.045, 0.34, jade);
    m.box(0, 0.026, 0.155, 0.4, 0.012, 0.03, 0xa9c4b6);
  });
  // The other half has slid off and leans against the footing.
  m.frame(0.24, 0.2, -0.22, 0.25, 1, () => m.box(0, 0, 0, 0.32, 0.04, 0.3, jade), 0, -0.3);
  m.lathe(
    -0.33,
    0.2,
    -0.36,
    [
      [0, 0.06],
      [0.06, 0.055],
      [0.13, 0.05],
      [0.16, 0.035]
    ],
    0x7e9c90,
    8
  );
  for (let k = 0; k < 3; k++)
    m.rock(
      r.range(-0.3, 0.35),
      0.045,
      r.range(-0.02, 0.06),
      r.range(0.03, 0.05),
      0.04,
      0.03,
      dark,
      jade,
      5
    );
}

// 垂冰石簾: a frosted curtain of flowstone across the back of the tile, its
// folds hung with ice, and a few icicle stumps grown up in front of it.
function iceCurtain(m) {
  const r = m.rng;
  m.box(0, 0.09, -0.3, 0.84, 0.05, 0.17, 0x3f5755);
  const n = 9,
    fold = [];
  for (let j = 0; j <= n; j++) {
    const x = -0.4 + (j * 0.8) / n,
      z = -0.3 + 0.085 * (j % 2 ? 1 : -1) + 0.02 * Math.sin(j * 1.9),
      top = 0.46 + 0.1 * Math.sin(j * 2.3) + r.range(-0.03, 0.03);
    fold.push([x, z, top]);
  }
  for (let j = 0; j < n; j++) {
    const [ax, az, at] = fold[j],
      [bx, bz, bt] = fold[j + 1];
    for (const side of [-1, 1]) {
      const pts = [
        [ax, 0.1, az + side * 0.025],
        [bx, 0.1, bz + side * 0.025],
        [bx, bt, bz + side * 0.012],
        [ax, at, az + side * 0.012]
      ];
      m.face(side > 0 ? pts : pts.reverse(), [
        m.rgb(0x6f908a),
        m.rgb(0x6f908a),
        m.rgb(0xc4dcd8),
        m.rgb(0xc4dcd8)
      ]);
    }
    m.face(
      [
        [ax, at, az - 0.012],
        [ax, at, az + 0.012],
        [bx, bt, bz + 0.012],
        [bx, bt, bz - 0.012]
      ],
      0xd5e7e4
    );
  }
  for (let k = 0; k < 4; k++)
    m.crystal(
      r.range(-0.32, 0.32),
      0.08,
      r.range(-0.17, -0.08),
      r.range(0.025, 0.045),
      r.range(0.12, 0.24),
      0x8fb2ab,
      0xdcecea,
      5,
      r.range(-0.03, 0.03)
    );
}

// Outcrops and seats on their tiles, in world coordinates.
function tileProps(m, layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  for (const cell of layout.cells) {
    const draw =
      cell.kind === 'rock'
        ? jadeOutcrop
        : cell.kind === 'cover'
          ? jadeSeat
          : cell.kind === 'bamboo'
            ? iceCurtain
            : null;
    if (draw) m.frame(cell.x - cx, 0.025, cell.y - cz, 0, 1, () => draw(m));
  }
}

export { caveFloor, tileProps, paving, caveWalls, caveFeatures, jadeOutcrop, jadeSeat, lightField };
