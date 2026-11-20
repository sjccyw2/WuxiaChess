import { Model, circle } from '../scenery-kit.js';

// The street does not stand on earth: it rests on banks of cloud that step
// down in level tiers to the mirror. Sunlit tops are warm white, the shaded
// flanks and the undersides seen in the reflection turn lavender.
const sunlit = 0xebe5e3;
const pearl = 0xd8d3de;
const shade = 0xaba8c6;
const deep = 0x8e92b4;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Tier floors from the street's foot down to the water line.
const tiers = [-0.74, -1.14, -1.53, -1.9, -2.26];

function cloudTone(m, v, dim) {
  // v runs from the tucked underside (0) to the crown (1).
  const lower = m.mix(deep, pearl, clamp(v * 1.7, 0, 1));
  const tone = m.mix(lower, sunlit, clamp((v - 0.55) * 2.4, 0, 1));
  return m.mix(tone, shade, dim);
}

// One billow: a flattened, lopsided dome with a tucked-in underside. Its
// rings share vertices so the dome shades smoothly, like vapour, not stone.
function puff(m, mesh, x, y, z, r, h, dim = 0) {
  const n = 10,
    rings = [
      [-0.5, 0],
      [-0.3, 0.66],
      [-0.05, 0.95],
      [0.3, 0.98],
      [0.62, 0.74],
      [0.88, 0.36],
      [1, 0]
    ];
  const twist = m.rng.range(0, circle),
    phase = m.rng.range(0, circle),
    lobes = Array.from(
      { length: n },
      (_, i) => 1 + 0.08 * Math.sin(i * 2.4 + phase) + m.rng.range(-0.05, 0.05)
    ),
    squash = m.rng.range(0.8, 1);
  const { p, c, i: ix } = mesh,
    start = p.length / 3;
  for (const [v, k] of rings) {
    const tone = cloudTone(m, (v + 0.4) / 1.4, dim);
    for (let i = 0; i < n; i++) {
      const a = twist + (i * circle) / n;
      p.push(
        x + Math.cos(a) * r * k * lobes[i],
        y + v * h,
        z + Math.sin(a) * r * k * lobes[i] * squash
      );
      c.push(...tone);
    }
  }
  for (let j = 0; j < rings.length - 1; j++)
    for (let i = 0; i < n; i++) {
      const k = (i + 1) % n,
        a = start + j * n + i,
        b = start + j * n + k,
        d = start + (j + 1) * n + i,
        e = start + (j + 1) * n + k;
      ix.push(a, d, b, b, d, e);
    }
}

function near(x, z, [ax, az, bx, bz, r]) {
  const dx = bx - ax,
    dz = bz - az,
    t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
  return Math.hypot(x - ax - dx * t, z - az - dz * t) < r;
}

// Billows are laid on a jittered grid over every patch of the old talus.
// Each settles on the highest tier the ground beneath it reaches, so the
// banks read as broad steps; stairs, drains and the ferry berth stay clear.
function cloudSteps(T, layout, surface, keepClear, billows = []) {
  const m = new Model(T, 81611),
    mesh = { p: [], c: [], i: [] };
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const tiles = layout.cells.map((c) => [c.x - cx, c.y - cz]);
  const fromBoard = (x, z) => {
    let best = Infinity;
    for (const [tx, tz] of tiles) {
      const dx = Math.max(Math.abs(x - tx) - 0.5, 0),
        dz = Math.max(Math.abs(z - tz) - 0.5, 0);
      best = Math.min(best, dx * dx + dz * dz);
    }
    return Math.sqrt(best);
  };
  const step = 0.82;
  for (let gz = -11; gz <= 11; gz += step)
    for (let gx = -13.5; gx <= 13.5; gx += step) {
      const x = gx + m.rng.range(-0.3, 0.3),
        z = gz + m.rng.range(-0.3, 0.3);
      const ground = surface(x, z);
      if (ground < tiers.at(-1) - 0.2) continue;
      if (keepClear.some((zone) => near(x, z, zone))) continue;
      const d = fromBoard(x, z);
      if (d < 0.05) continue;
      // Wavy tier edges: the reach of each step swells and narrows.
      const swell = 0.17 * Math.sin(x * 1.3 + z * 0.7) + 0.12 * Math.sin(z * 2.1 - x * 0.9);
      const level = tiers.find((t) => t <= ground + 0.12 + swell) ?? tiers.at(-1);
      const tier = tiers.indexOf(level);
      const big = m.rng.next() < 0.2;
      const r = (big ? m.rng.range(1.0, 1.3) : m.rng.range(0.55, 0.95)) * (1 + tier * 0.05),
        h = Math.min(0.56, r * m.rng.range(0.44, 0.6));
      puff(m, mesh, x, level + m.rng.range(-0.04, 0.04), z, r, h, tier * 0.09);
    }
  // Loose billows that carry the floating fragments of street.
  for (const [x, y, z, r, h] of billows) puff(m, mesh, x, y, z, r, h, 0.05);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(mesh.p, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(mesh.c, 3));
  geometry.setIndex(mesh.i);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const cloud = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
  );
  cloud.receiveShadow = true;
  const group = new T.Group();
  group.name = '雲階';
  group.userData = { occluder: false, distant: false, kind: 'maze-scenery' };
  group.add(cloud);
  return group;
}

export { cloudSteps, cloudTone };
