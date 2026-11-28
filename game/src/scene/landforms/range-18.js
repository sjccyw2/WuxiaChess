import { circle } from '../scenery-kit.js';

// The Kunlun range round 光明頂 and the sea of cloud it stands in.
//
// The peaks stand in three rings, each further into the blue of the high air: near
// massifs of dark slaty rock banded with strata, ribbed with ridges that spread as they
// fall and cut by gullies between them, snow lying on the gentler upper faces and down
// the gullies, the rock darker toward the cloud; a middle ring paler; a far ring that is
// little more than snow-lit silhouettes. Every peak stands from the cloud up.
//
// The clouds are built as their own smooth-shaded mesh: banks of overlapping domes,
// shaded grey-blue beneath and bright on their crowns, in broken rings with gaps
// between them, so the sea below shows through.

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = (lo, hi, v) => {
  const t = clamp((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
const hash = (a, b = 0) => {
  const n = Math.sin(a * 127.1 + b * 311.7 + 0.7) * 43758.5453;
  return n - Math.floor(n);
};

// One mountain on a polar grid of `spokes` round and `levels` up. Its ridges are
// lobes that stand out further toward its foot; the crest is jagged; each level is
// set in or out a little of its own, so strata step across the faces.
function mountain(m, x, z, base, w, d, H, opts) {
  const { spokes: n, levels: L, ridges, haze, horizon, seed } = opts,
    r = m.rng,
    spin = r.range(0, circle),
    lean = [r.range(-0.18, 0.18), r.range(-0.18, 0.18)];
  const crests = Array.from({ length: ridges }, (_, j) => [
    spin + (j / ridges) * circle + r.range(-0.35, 0.35),
    r.range(0.35, 0.7),
    r.range(4, 9)
  ]);
  const ridge = (a, t) => {
    let v = 0;
    for (const [c, amp, sharp] of crests) v += amp * Math.pow(Math.max(0, Math.cos(a - c)), sharp);
    return v * (0.25 + 0.9 * (1 - t));
  };
  const step = Array.from({ length: L + 1 }, () => r.range(0.94, 1.06));
  const heights = Array.from({ length: L + 1 }, (_, k) => Math.pow(k / L, 0.85));
  const grid = [];
  for (let k = 0; k <= L; k++) {
    const t = heights[k],
      row = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * circle,
        wobble = 1 + 0.07 * Math.sin(a * 5 + k * 1.3 + seed) + 0.05 * Math.sin(a * 11 - k * 2.1 + seed);
      const k1 = k === L ? 0 : Math.pow(1 - t, 0.95) * (1 + ridge(a, t)) * wobble * step[k];
      const jag = t > 0.62 && k < L ? H * 0.05 * Math.sin(a * 3 + seed) * (t - 0.62) * 2.6 : 0;
      row.push([
        x + Math.cos(a) * w * k1 + lean[0] * t * w,
        base + t * H + jag,
        z + Math.sin(a) * d * k1 + lean[1] * t * d
      ]);
    }
    grid.push(row);
  }
  // Which spokes lie in a gully: their reach below the mean of their neighbours'.
  const gully = (k, i) => {
    const row = grid[Math.min(k, L - 1)],
      p = row[i],
      a = row[(i + n - 1) % n],
      b = row[(i + 1) % n],
      rad = (q) => Math.hypot(q[0] - x, q[2] - z);
    return clamp((0.5 * (rad(a) + rad(b)) - rad(p)) / (0.12 * w) + 0.3);
  };
  const rock = m.mix(0x343a41, 0x474d55, r.next()),
    band = [m.rgb(rock), m.mix(rock, 0x5b5650, 0.55), m.mix(rock, 0x23272c, 0.4), m.mix(rock, 0x6a6c6e, 0.35)],
    snowLine = r.range(0.42, 0.55);
  for (let k = 0; k < L; k++)
    for (let i = 0; i < n; i++) {
      const q = (i + 1) % n,
        lo = grid[k],
        hi = grid[k + 1];
      const tris =
        k === L - 1
          ? [[lo[i], hi[i], lo[q]]]
          : [
              [lo[i], hi[i], hi[q]],
              [lo[i], hi[q], lo[q]]
            ];
      for (const tri of tris) {
        const [a, b, c] = tri,
          ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const nx = ab[1] * ac[2] - ab[2] * ac[1],
          ny = ab[2] * ac[0] - ab[0] * ac[2],
          nz = ab[0] * ac[1] - ab[1] * ac[0],
          len = Math.hypot(nx, ny, nz) || 1,
          up = Math.abs(ny) / len;
        const t = ((a[1] + b[1] + c[1]) / 3 - base) / H,
          g = 0.5 * (gully(k, i) + gully(k, q));
        const hold =
          smooth(0.06, 0.18, up - 0.5 + 0.9 * (t - snowLine) + 0.45 * g + 0.04 * Math.sin(t * 25 + seed)) *
          smooth(snowLine - 0.3, snowLine, t + 0.25 * g);
        const sun = clamp((-nx * 0.7 + nz * 0.3) / len + 0.3);
        let stone = band[(k + (hash(seed, k) > 0.7 ? 1 : 0)) % 4];
        stone = m.mix(stone, 0x1c2025, 0.35 * (1 - t));
        stone = m.mix(stone, horizon, haze * 0.8 + 0.35 * (1 - smooth(0, 0.3, t)));
        const white = m.mix(m.mix(0xdde6ef, 0xfff6ea, sun), horizon, haze * 0.45);
        m.face(tri, m.mix(stone, white, hold), 0.9 + 0.06 * ((i * 3 + k) % 3));
      }
    }
}

function kunlunRange(m, level, horizon) {
  const r = m.rng;
  // [radius, count, haze, girth, height, spokes, levels, shoulders]
  for (const [radius, count, haze, size, tall, spokes, levels, shoulders] of [
    [23, 9, 0.06, 3.0, 10, 24, 12, 2],
    [33, 12, 0.36, 4.2, 15, 20, 10, 1],
    [46, 16, 0.62, 5.5, 19, 14, 7, 0]
  ]) {
    const spin = radius * 0.11;
    for (let j = 0; j < count; j++) {
      const a = spin + (j * circle) / count + r.range(-0.12, 0.12),
        dd = radius + r.range(-2, 3),
        x = Math.cos(a) * dd,
        z = Math.sin(a) * dd,
        w = size * r.range(0.75, 1.25),
        h = tall * r.range(0.65, 1.1),
        opts = { spokes, levels, ridges: r.pick([3, 4, 5]), haze, horizon, seed: j + radius };
      mountain(m, x, z, level, w, w * r.range(0.75, 1), h, opts);
      for (let k = 0; k < shoulders; k++) {
        const turn = a + Math.PI / 2 + (k ? Math.PI : 0) + r.range(-0.5, 0.5),
          off = w * r.range(0.8, 1.2);
        mountain(m, x + Math.cos(turn) * off, z + Math.sin(turn) * off, level, w * r.range(0.5, 0.7), w * r.range(0.45, 0.6), h * r.range(0.45, 0.7), {
          ...opts,
          spokes: Math.round(spokes * 0.7),
          levels: Math.round(levels * 0.7),
          seed: opts.seed + 7 * (k + 1)
        });
      }
    }
  }
}

// The cloud: banks of smooth domes. Each bank is [x, y, z, length, depth, yaw, puffs].
function cloudSea(T, banks, seed) {
  let s = seed >>> 0;
  const rand = (a, b) => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return a + ((b - a) * s) / 4294967296;
  };
  const pos = [],
    col = [],
    idx = [];
  const lon = 9,
    lat = 4;
  const low = new T.Color(0xaab4bf),
    mid = new T.Color(0xdfe5ea),
    top = new T.Color(0xffffff),
    warm = new T.Color(0xfff3e4),
    c = new T.Color();
  const dome = (cx, cy, cz, rx, ry, rz, yaw, shade) => {
    const start = pos.length / 3;
    for (let k = 0; k <= lat; k++) {
      // From a little below the dome's widest ring up to its crown.
      const v = -0.25 + (k / lat) * (Math.PI / 2 + 0.25),
        ring = Math.cos(v),
        y = Math.sin(v);
      const count = k === lat ? 1 : lon;
      for (let i = 0; i < count; i++) {
        const a = (i / lon) * Math.PI * 2 + k * 0.3,
          bump = k === lat ? 1 : 1 + 0.12 * Math.sin(a * 3 + cx) * ring,
          lx = Math.cos(a) * rx * ring * bump,
          lz = Math.sin(a) * rz * ring * bump;
        pos.push(cx + lx * Math.cos(yaw) - lz * Math.sin(yaw), cy + y * ry, cz + lx * Math.sin(yaw) + lz * Math.cos(yaw));
        const t = clamp((y + 0.25) / 1.25);
        c.copy(low).lerp(mid, smooth(0, 0.5, t)).lerp(top, smooth(0.45, 1, t) * shade);
        c.lerp(warm, 0.35 * clamp(-Math.cos(a + yaw - 2.6)) * t);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let k = 0; k < lat; k++) {
      const a0 = start + k * lon,
        a1 = start + (k + 1) * lon;
      for (let i = 0; i < lon; i++) {
        const j = (i + 1) % lon;
        if (k === lat - 1) idx.push(a0 + i, a0 + j, a1);
        else idx.push(a0 + i, a0 + j, a1 + j, a0 + i, a1 + j, a1 + i);
      }
    }
  };
  for (const [x, y, z, length, depth, yaw, puffs] of banks) {
    for (let k = 0; k < puffs; k++) {
      const t = puffs > 1 ? k / (puffs - 1) - 0.5 : 0,
        along = t * length + rand(-0.3, 0.3) * depth,
        across = rand(-0.45, 0.45) * depth,
        px = x + along * Math.cos(yaw) - across * Math.sin(yaw),
        pz = z + along * Math.sin(yaw) + across * Math.cos(yaw),
        size = depth * rand(0.6, 1.05) * (1 - Math.abs(t) * 0.55);
      // A broad low base, then a billow riding on it.
      dome(px, y, pz, size * 1.5, size * 0.32, size, yaw, 0.8);
      if (rand(0, 1) < 0.8)
        dome(px + rand(-0.3, 0.3) * size, y + size * 0.12, pz + rand(-0.3, 0.3) * size, size * 0.8, size * 0.55, size * 0.7, yaw + rand(-1, 1), 1);
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: T.DoubleSide });
  mat.name = 'Maze_Cloud';
  const mesh = new T.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  const g = new T.Group();
  g.name = '雲海';
  g.userData = { occluder: false, distant: true, kind: 'maze-scenery' };
  g.add(mesh);
  return g;
}

export { kunlunRange, cloudSea };
