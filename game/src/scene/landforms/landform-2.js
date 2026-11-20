import { Model } from '../scenery-kit.js';

const tide = -0.65;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

// The three shoals bend beyond the board. Each point gives the centre line
// and local radius of the exposed sand bar.
const spits = [
  [
    [-4.1, -5.8, 0.85],
    [-4.5, -7.0, 0.79],
    [-5.4, -8.3, 0.71],
    [-6.0, -9.8, 0.1]
  ],
  [
    [-5.4, 2.6, 0.53],
    [-7.15, 2.47, 0.79],
    [-8.8, 3.3, 0.69],
    [-10.3, 4.45, 0.1]
  ],
  [
    [-0.25, -5.85, 0.74],
    [0.32, -7.08, 0.64],
    [1.66, -8.05, 0.82],
    [3.18, -8.65, 0.64],
    [3.5, -9.4, 0.1]
  ],
  [
    [5.2, -3.6, 0.6],
    [6.9, -3.2, 0.61],
    [8.56, -3.55, 0.62],
    [9.9, -4.45, 0.09]
  ],
  [
    [3.9, 5.8, 0.63],
    [3.9, 7.04, 0.76],
    [2.6, 8.05, 0.75],
    [1.33, 9.25, 0.12]
  ],
  [
    [-0.28, 5.9, 0.52],
    [-0.64, 7.02, 0.45],
    [-1.19, 7.97, 0.09]
  ]
];

function spitDistance(x, z) {
  let nearest = Infinity;
  for (const path of spits) {
    for (let i = 1; i < path.length; i++) {
      const [ax, az, ar] = path[i - 1],
        [bx, bz, br] = path[i];
      const dx = bx - ax,
        dz = bz - az;
      const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
      const radius = ar + (br - ar) * t;
      nearest = Math.min(nearest, Math.hypot(x - ax - t * dx, z - az - t * dz) - radius);
    }
  }
  return nearest;
}

function makeEstuary(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const banks = layout.cells
    .filter((cell) => cell.kind !== 'bridge')
    .map(({ x, y, kind }) => ({ x: x - cx, z: y - cz, wet: kind === 'reeds' }));
  const kinds = new Map(layout.cells.map((cell) => [cell.y * layout.width + cell.x, cell.kind]));
  function kindAt(x, z) {
    const col = Math.floor(x + cx + 0.5),
      row = Math.floor(z + cz + 0.5);
    if (col >= 0 && col < layout.width && row >= 0 && row < layout.height)
      return kinds.get(row * layout.width + col);
  }
  function heightAt(x, z) {
    let shore = Infinity,
      pool = 0;
    for (const bank of banks) {
      const dx = Math.max(Math.abs(x - bank.x) - 0.3, 0);
      const dz = Math.max(Math.abs(z - bank.z) - 0.3, 0);
      const d = Math.sqrt(dx * dx + dz * dz) - 0.2;
      shore = Math.min(shore, d);
      if (bank.wet && d < 0.16) {
        // Small pools left behind by the ebb wind between retained reed roots.
        const along = (z - bank.z) / 0.53;
        const across = (x - bank.x + 0.13 * Math.sin(2.3 * along + bank.z)) / 0.36;
        pool = Math.max(pool, smooth(1.12 - along * along - across * across));
      }
    }
    const insideFrame = Math.abs(x) < cx + 0.5 && Math.abs(z) < cz + 0.5;
    const kind = kindAt(x, z);
    const openChannel = insideFrame && (!kind || kind === 'bridge');
    const spit = spitDistance(x, z);
    const edge = openChannel ? shore : Math.min(shore, spit);
    const course = Math.sin(z * 0.77 + x * 0.91);
    const ripple = Math.sin(3.6 * x + 1.4 * z + Math.sin(1.8 * z));
    const margin = insideFrame ? 0.57 + 0.05 * course : 1.0 + 0.17 * course;
    const pointBar = 0.5 + 0.5 * Math.sin(2.26 * z - 1.04 * x + Math.sin(x + z));
    const lifted = smooth(-spit / 0.42);
    const shoal = -0.118 + 0.019 * course + 0.011 * ripple + 0.108 * lifted;
    const depth = smooth(Math.max(0, edge - 0.09 * pointBar) / margin);
    const bottom = -1.3 - 0.14 * Math.cos(z * 0.58 + x * 0.33);
    const soil = shoal + depth * (bottom - shoal);
    // The shared surface stays level across internal cell boundaries. It
    // continues a little past the old square banks before falling to the mud.
    const cap = 0.06 + 0.003 * ripple - 0.11 * pool;
    return soil + smooth((0.23 + 0.085 * pointBar - shore) / 0.14) * (cap - soil);
  }
  return { cx, cz, kindAt, heightAt };
}

function buildBed(T, estuary, layout) {
  const { heightAt } = estuary;
  const axis = (half) => {
    const inner = half + 0.5,
      samples = [];
    for (let n = -inner; n <= inner; n += 0.25) samples.push(n);
    for (const distance of [0.38, 0.8, 1.28, 1.85, 2.48, 3.16, 3.94, 4.86]) {
      samples.unshift(-inner - distance);
      samples.push(inner + distance);
    }
    return samples;
  };
  const xs = axis(layout.width / 2),
    zs = axis(layout.height / 2);
  const positions = [],
    colors = [],
    indices = [];
  const dark = new T.Color(0x48594e),
    clay = new T.Color(0x7c7860);
  const sand = new T.Color(0xb1a078),
    turf = new T.Color(0x74855f);
  const color = new T.Color();
  for (let j = 0; j < zs.length; j++) {
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i],
        z = zs[j],
        y = heightAt(x, z);
      positions.push(x, y, z);
      const ripple = 0.5 + 0.5 * Math.sin(4.8 * x + 2.2 * z + 0.9 * Math.sin(1.5 * z));
      const sweep = 0.5 + 0.5 * Math.sin(0.83 * x - 0.44 * z + 0.7 * Math.cos(x + z));
      color.copy(dark).lerp(clay, clamp((y + 1.1) / 0.7));
      color.lerp(sand, clamp((y + 0.57) / 0.43) * (0.78 + 0.12 * ripple));
      color.lerp(turf, clamp((y + 0.29) / 0.31) * (0.33 + 0.51 * sweep));
      color.multiplyScalar(0.83 + 0.12 * ripple + 0.08 * sweep);
      colors.push(color.r, color.g, color.b);
      if (i && j) {
        const se = j * xs.length + i,
          sw = se - 1;
        const ne = se - xs.length,
          nw = ne - 1;
        if ((i + j) % 2) indices.push(nw, sw, ne, ne, sw, se);
        else indices.push(nw, sw, se, nw, se, ne);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const bed = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.97,
      metalness: 0.01
    })
  );
  bed.name = '三汊潮床與彎曲沙嘴';
  bed.receiveShadow = true;
  // Ground decorations elsewhere in the pass use the same triangle, including
  // on the coarser mudflats outside the board.
  function surface(x, z) {
    const i = xs.findIndex((v) => v >= x),
      j = zs.findIndex((v) => v >= z);
    if (i < 1 || j < 1) return heightAt(x, z);
    const u = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    const v = (z - zs[j - 1]) / (zs[j] - zs[j - 1]);
    const se = j * xs.length + i,
      sw = se - 1,
      ne = se - xs.length,
      nw = ne - 1;
    const h = (n) => positions[3 * n + 1];
    if ((i + j) % 2) {
      if (u + v <= 1) return h(nw) * (1 - u - v) + h(ne) * u + h(sw) * v;
      return h(se) * (u + v - 1) + h(ne) * (1 - v) + h(sw) * (1 - u);
    }
    if (u <= v) return h(nw) * (1 - v) + h(sw) * (v - u) + h(se) * u;
    return h(nw) * (1 - u) + h(ne) * (u - v) + h(se) * v;
  }
  return { bed, surface };
}

function bridgeSupports(m, layout, estuary, surface) {
  const { cx, cz } = estuary;
  for (let row = 0; row < layout.height; row++) {
    const planks = layout.cells
      .filter((c) => c.y === row && c.kind === 'bridge')
      .map((c) => c.x)
      .sort((a, b) => a - b);
    for (let i = 0; i < planks.length; i++) {
      let end = i;
      while (end + 1 < planks.length && planks[end + 1] === planks[end] + 1) end++;
      const a = planks[i] - cx - 0.5,
        b = planks[end] - cx + 0.5,
        z = row - cz;
      const mid = (a + b) / 2;
      const bents = b - a > 1.6 ? [a + 0.14, mid, b - 0.14] : [a + 0.14, b - 0.14];
      for (const dz of [-0.275, 0.275])
        m.box(mid, -0.068, z + dz, b - a + 0.24, 0.097, 0.087, 0x68573e);
      for (const x of bents) {
        m.box(x, -0.16, z, 0.15, 0.091, 0.78, 0x796648);
        for (const side of [-1, 1]) {
          const dz = side * 0.3,
            bottom = Math.min(-0.38, surface(x, z + dz) - 0.22);
          m.tube([x, bottom, z + dz * 1.14], [x, -0.17, z + dz], 0.064, 0.052, 0x675a42, 7);
        }
        m.tube([x, -0.54, z - 0.31], [x, -0.185, z + 0.29], 0.026, 0.023, 0x827452, 6);
      }
      for (const endX of [a, b]) {
        const shoreX = endX + (endX < mid ? -0.09 : 0.09);
        m.box(shoreX, -0.108, z, 0.22, 0.15, 0.84, 0x887c60);
        for (const dz of [-0.38, 0.38]) {
          m.rock(shoreX, -0.35, z + dz, 0.16, 0.27, 0.125, 0x6b705d, 0x97947b, 7);
        }
      }
      i = end;
    }
  }
}

// The two wings of the bamboo weir taper towards a single pot. Their feet
// follow the profile of the creek bed even where it slopes behind the grass.
function fishingWeir(m, surface) {
  const wings = [
    [
      [6.43, -0.78],
      [7.21, 0.04],
      [7.62, 0.83]
    ],
    [
      [6.22, 2.81],
      [7.05, 1.95],
      [7.54, 1.14]
    ]
  ];
  for (const wing of wings) {
    for (let i = 1; i < wing.length; i++) {
      const [ax, az] = wing[i - 1],
        [bx, bz] = wing[i];
      const len = Math.hypot(bx - ax, bz - az),
        count = Math.ceil(len / 0.14);
      for (let j = 0; j < count + (i === wing.length - 1 ? 1 : 0); j++) {
        const t = j / count,
          x = ax + (bx - ax) * t,
          z = az + (bz - az) * t;
        const main = j === 0 || j === count,
          y = surface(x, z);
        const top = tide + (main ? 0.59 : 0.36) + 0.033 * Math.sin(x * 23 + z);
        m.tube(
          [x, y - 0.12, z],
          [x + 0.034, top, z - 0.02],
          main ? 0.037 : 0.024,
          main ? 0.032 : 0.018,
          main ? 0x756b4f : 0x9b8759,
          5
        );
      }
      for (const y of [tide + 0.27, tide + 0.075])
        m.tube([ax, y, az], [bx, y, bz], 0.017, 0.017, 0x625f46, 5);
    }
  }
  const cx = 7.76,
    cz = 1.03,
    floor = surface(cx, cz);
  const length = 0.86,
    radius = 0.145,
    cy = floor + radius * 0.84;
  // The soaked funnel lies in the channel. A cord to its floating gourd marks it.
  for (const x of [-0.4, -0.22, 0.07, 0.32])
    m.hoop(cx + x, cy, cz, radius * (x > 0.3 ? 0.65 : 1), 0.012, 0x9b865e, 10, 'yz');
  for (let i = 0; i < 9; i++) {
    const angle = (i * Math.PI * 2) / 9;
    const dy = Math.sin(angle) * radius,
      dz = Math.cos(angle) * radius;
    m.tube(
      [cx - length / 2, cy + dy, cz + dz],
      [cx + length / 2, cy + dy * 0.56, cz + dz * 0.56],
      0.011,
      0.009,
      0x887654,
      4
    );
  }
  m.line(
    [
      [cx + 0.24, cy, cz],
      [cx + 0.32, tide - 0.2, cz + 0.11],
      [cx + 0.44, tide + 0.01, cz + 0.13]
    ],
    0.012,
    0x806e4c,
    5
  );
  m.lathe(
    cx + 0.44,
    tide - 0.045,
    cz + 0.13,
    [
      [0, 0.045],
      [0.06, 0.086],
      [0.11, 0.075],
      [0.14, 0.038],
      [0.17, 0.034]
    ],
    0xaa8953,
    9
  );
}

// Silt curls and patches of sedge run along the flow, crossing tactical cell
// boundaries. Low plants leave sightlines to movement and attack targets open.
function mudflatMarks(m, estuary, surface) {
  const r = m.rng;
  const darkGrass = [0x617755, 0x697b56, 0x657653];
  for (let j = 0; j < 310; j++) {
    const x = r.range(-6.35, 6.35),
      z = r.range(-7.15, 7.15);
    const kind = estuary.kindAt(x, z);
    if (kind === 'bridge' || kind === 'crate' || kind === 'rock' || surface(x, z) < -0.49) continue;
    const course = 0.38 * Math.sin(1.8 * x - 0.28 * z) - 0.22;
    // One band curves, widens and fades into a point on the actual sediment.
    const length = r.range(0.29, 0.69),
      breadth = r.range(0.012, 0.029);
    const col = r.pick([0x998b68, 0x8a8564, 0xb1a47c, 0x838565, 0xaba57c]);
    let last = null;
    for (let k = 0; k <= 5; k++) {
      const n = k / 5,
        dz = (n - 0.5) * length,
        zz = z + dz;
      const xx = x + course * dz + 0.075 * Math.sin(Math.PI * n);
      const half = breadth * Math.max(0.03, Math.sin(Math.PI * n));
      const row = [
        [xx - half, surface(xx - half, zz) + 0.003, zz],
        [xx + half, surface(xx + half, zz) + 0.003, zz]
      ];
      if (last && estuary.kindAt(xx, zz) !== 'bridge' && row[0][1] > tide + 0.01) {
        m.face([last[0], row[0], row[1], last[1]], col);
      }
      last = row;
    }
    if (kind === 'bamboo' || kind === 'reeds' || (!kind && j % 5 === 0)) {
      for (let k = 0; k < 5; k++) {
        const px = x + r.range(-0.17, 0.17),
          pz = z + r.range(-0.13, 0.13);
        const py = surface(px, pz) - 0.015;
        if (py < tide + 0.055 || estuary.kindAt(px, pz) === 'bridge') continue;
        const angle = r.range(0, 6.28),
          spread = r.range(0.08, 0.17);
        m.leaf(
          [px, py, pz],
          [
            px + Math.cos(angle) * spread + 0.09,
            py + r.range(0.12, 0.34),
            pz + Math.sin(angle) * spread
          ],
          0.027,
          r.pick(darkGrass),
          0x9aa875,
          0.03
        );
      }
    }
  }
}

function shoreDetails(m, estuary, surface) {
  const r = m.rng;
  for (let i = 0; i < 460; i++) {
    const x = r.range(-9.8, 10),
      z = r.range(-10.3, 10.1);
    if (estuary.kindAt(x, z)) continue;
    const y = surface(x, z);
    if (y < tide - 0.07 || y > -0.075) continue;
    if (i % 4 === 0) {
      // Each stem is sunk into the mud; restrict thick tufts to the upper wash.
      if (y > tide + 0.08) {
        for (let stem = 0; stem < 5; stem++) {
          const angle = stem * 1.25 + r.range(-0.2, 0.2);
          const px = x + 0.11 * Math.cos(angle),
            pz = z + 0.11 * Math.sin(angle);
          const root = surface(px, pz) - 0.018,
            h = r.range(0.17, 0.37);
          const tip = [px + 0.13 * Math.cos(angle) + 0.01, root + h, pz + 0.12 * Math.sin(angle)];
          m.leaf([px, root, pz], tip, 0.022, 0x7c8a60, 0x9ba975, 0.025);
          if (stem % 2 === 0)
            m.tube(tip, [tip[0] + 0.023, tip[1] + 0.094, tip[2] + 0.01], 0.012, 0.003, 0xd6c89b, 5);
        }
      }
    } else if (i % 3 === 0) {
      m.rock(
        x,
        y - 0.082,
        z,
        r.range(0.05, 0.14),
        0.11,
        r.range(0.045, 0.095),
        0x736f5c,
        r.pick([0xa69c7b, 0xb1a88b, 0x8f9579]),
        6
      );
    }
  }
  // Stilt feet beneath the northern reed house enter the alluvium. The house
  // sits in the existing scenery at this inlet; the two boats keep open water.
  const x = (2.25 * (estuary.cx + 0.5)) / 5.5,
    z = -estuary.cz - 0.5 - (7.31 - 5.5);
  for (const dx of [-1.43, 1.43])
    for (const dz of [-0.71, 0.71]) {
      const px = x + dx * Math.cos(0.09) + dz * Math.sin(0.09);
      const pz = z - dx * Math.sin(0.09) + dz * Math.cos(0.09);
      const y = surface(px, pz) - 0.16;
      if (y < -0.64) m.tube([px, y, pz], [px, -0.66, pz], 0.114, 0.097, 0x645942, 8);
    }
  // The door of the stilt house opens above the tide. The stairs turn toward
  // the eastern tongue, where their bottom sleeper actually rests in the sand.
  const ax = x + 0.09,
    az = z + 1.01,
    bx = 3.55,
    bz = -estuary.cz - 0.51;
  const len = Math.hypot(bx - ax, bz - az);
  const nx = (bz - az) / len,
    nz = -(bx - ax) / len;
  const angle = Math.atan2(bx - ax, bz - az),
    low = surface(bx, bz) + 0.024;
  for (let tread = 0; tread <= 6; tread++) {
    const t = tread / 6,
      px = ax + t * (bx - ax),
      pz = az + t * (bz - az);
    const py = 0.68 + t * (low - 0.68);
    m.frame(px, py - 0.041, pz, angle, 1, () =>
      m.box(0, 0, 0, 0.64, 0.082, len / 6 + 0.016, tread % 2 ? 0x8b7756 : 0x958363)
    );
  }
  for (const side of [-0.24, 0.24]) {
    m.tube(
      [ax + nx * side, 0.594, az + nz * side],
      [bx + nx * side, low - 0.085, bz + nz * side],
      0.059,
      0.051,
      0x72654b,
      7
    );
    const px = 0.5 * (ax + bx) + nx * side,
      pz = 0.5 * (az + bz) + nz * side;
    m.tube(
      [px, surface(px, pz) - 0.12, pz],
      [px, (0.68 + low) / 2 - 0.085, pz],
      0.052,
      0.044,
      0x76694e,
      7
    );
  }
}

function landform2(T, layout) {
  const estuary = makeEstuary(layout);
  const { bed, surface } = buildBed(T, estuary, layout);
  const bridges = new Model(T, 31123),
    shores = new Model(T, 48026);
  bridgeSupports(bridges, layout, estuary, surface);
  fishingWeir(shores, surface);
  shoreDetails(shores, estuary, surface);
  mudflatMarks(shores, estuary, surface);
  const group = new T.Group();
  group.name = '蘆花汀・潮汊漁堰';
  group.add(bed, bridges.finish('六橋排架與橋臺'), shores.finish('簖塘、泥灘與蘆根'));
  return group;
}

export { landform2 };
