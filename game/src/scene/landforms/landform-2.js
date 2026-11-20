import { Model } from '../scenery-kit.js';
import { reed, reedStand, sedge } from './reeds-2.js';
import { fisherfolk, inYard } from './fishers-2.js';

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

// Value noise for colour patches and the clustering of plants. The hash is the
// usual sine trick, so the same map always grows the same marsh.
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz),
    b = hash(ix + 1, iz),
    c = hash(ix, iz + 1),
    d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) {
  return (
    0.55 * noise(x, z) +
    0.3 * noise(x * 2.1 + 5.2, z * 2.1 - 1.7) +
    0.15 * noise(x * 4.3 - 3.1, z * 4.3 + 7.9)
  );
}

// Distance to the nearest spit, and how far along it that point lies (0 by
// the board, 1 at the drowned tip).
function spitDistance(x, z) {
  let nearest = Infinity,
    along = 0;
  for (const path of spits) {
    for (let i = 1; i < path.length; i++) {
      const [ax, az, ar] = path[i - 1],
        [bx, bz, br] = path[i];
      const dx = bx - ax,
        dz = bz - az;
      const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
      const radius = ar + (br - ar) * t;
      const d = Math.hypot(x - ax - t * dx, z - az - t * dz) - radius;
      if (d < nearest) {
        nearest = d;
        along = (i - 1 + t) / (path.length - 1);
      }
    }
  }
  return { d: nearest, along };
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
  // Distance from the walkable sand, 0 on a tile edge.
  function shoreAt(x, z) {
    let shore = Infinity;
    for (const bank of banks) {
      const dx = Math.max(Math.abs(x - bank.x) - 0.3, 0);
      const dz = Math.max(Math.abs(z - bank.z) - 0.3, 0);
      shore = Math.min(shore, Math.sqrt(dx * dx + dz * dz) - 0.2);
    }
    return shore;
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
    const course = Math.sin(z * 0.77 + x * 0.91);
    const ripple = Math.sin(3.6 * x + 1.4 * z + Math.sin(1.8 * z));
    const pointBar = 0.5 + 0.5 * Math.sin(2.26 * z - 1.04 * x + Math.sin(x + z));
    const lifted = smooth(-spit.d / 0.42);
    // The crown is cut back into a low bank. At its foot a damp apron of silt
    // runs out under the water; along the spits the sand itself sinks
    // toward the drowned tips.
    const fromBank = shore - 0.26,
      onSpit = !openChannel && spit.d < fromBank;
    const e = Math.max(0, (onSpit ? spit.d : fromBank) - 0.09 * pointBar);
    const w = insideFrame ? 0.24 + 0.03 * course : 1.0 + 0.2 * course;
    let foot = insideFrame ? -0.5 : -0.41 + 0.03 * course;
    foot += 0.012 * ripple;
    if (!openChannel) foot += 0.19 * lifted - 0.26 * spit.along * spit.along * smooth(1 - fromBank);
    const bottom = -1.3 - 0.14 * Math.cos(z * 0.58 + x * 0.33);
    const soil =
      foot +
      (Math.min(foot, -0.6) - foot) * smooth(e / (0.5 * w)) +
      -0.13 * smooth((e - 0.25 * w) / (0.7 * w)) +
      (bottom + 0.73) * smooth((e - 0.75 * w) / (1.7 * w));
    // The shared surface stays level across internal cell boundaries. It
    // continues a little past the old square banks before falling to the mud.
    const cap = 0.06 + 0.003 * ripple - 0.11 * pool;
    return soil + smooth((0.21 + 0.06 * pointBar - shore) / 0.15) * (cap - soil);
  }
  return { cx, cz, kindAt, heightAt, shoreAt };
}

// Ground colour reads the material: sand and turf on the crown, a dark
// root mat at the lip of the cut, silt layers in its face, then the wet
// apron with the pale crust left by the last high water and a line of wrack.
const ground = {
  sand: 0xb6a57b,
  pale: 0xcbbb90,
  damp: 0x8f8865,
  grass: 0x78875a,
  moss: 0x67754b,
  straw: 0xb3a06a,
  lip: 0x5d5a3c,
  loam: 0x7f6c4f,
  silt: 0x9e9073,
  wet: 0x7a705a,
  crust: 0xcbc19f,
  wrack: 0x5a5442,
  mud: 0x4c5a4f,
  deep: 0x3f4c46
};
const swatches = new Map();
function paintGround(T, color, estuary, x, z, y, steep) {
  const c = (hex) => swatches.get(hex) || swatches.set(hex, new T.Color(hex)).get(hex);
  const n1 = fbm(x * 1.15 + 3.1, z * 1.15 - 1.3),
    n2 = fbm(x * 1.4 - 7.0, z * 1.4 + 2.2),
    n3 = fbm(x * 3.3 + 11.0, z * 3.3 - 5.0);
  const kind = estuary.kindAt(x, z);
  if (y > -0.035) {
    color.copy(c(ground.sand)).lerp(c(ground.pale), smooth((n3 - 0.45) / 0.3) * 0.7);
    let damp = smooth((n2 - 0.5) / 0.14) * 0.5;
    let green = smooth((n1 - 0.54) / 0.1) * 0.4;
    if (kind === 'reeds') damp = Math.max(damp, 0.65);
    if (kind === 'herbs' || kind === 'bamboo' || kind === 'cover')
      green = Math.max(green, 0.25 + 0.2 * n2);
    color.lerp(c(ground.damp), damp);
    color.lerp(c(n3 > 0.52 ? ground.grass : ground.moss), green);
    color.lerp(c(ground.straw), smooth((n3 - 0.62) / 0.08) * 0.45 * (1 - green));
    // The lip of the crown, where the turf rolls over the cut.
    const lip = smooth((estuary.shoreAt(x, z) - 0.07) / 0.1);
    color.lerp(c(ground.lip), lip * 0.7);
  } else if (y > -0.47 && steep > 0.9) {
    // The cut bank: dark roots at the top, then layered silt.
    const band = 0.5 + 0.5 * Math.sin(y * 31 + 1.7 * Math.sin(x * 1.3 + z * 0.9));
    color.copy(c(ground.loam)).lerp(c(ground.silt), band * 0.6 + smooth((-y - 0.25) / 0.2) * 0.4);
    color.lerp(c(ground.lip), smooth((y + 0.1) / 0.12) * 0.75);
  } else if (y > -0.665) {
    // Dry sand on the spits, darkening as it nears the waterline.
    const wet = smooth((-0.42 - y) / 0.2);
    color.copy(c(ground.silt)).lerp(c(ground.pale), smooth((n3 - 0.55) / 0.3) * 0.4);
    color.lerp(
      c(ground.grass),
      smooth((n1 - 0.55) / 0.1) * 0.55 * (1 - wet) * smooth((y + 0.4) / 0.15)
    );
    color.lerp(c(ground.damp), smooth((n2 - 0.45) / 0.2) * 0.6);
    color.lerp(c(ground.wet), 0.2 + wet * 0.7);
    const tideLine = 1 - smooth(Math.abs(y + 0.5 + 0.02 * Math.sin(x * 2.1 + z)) / 0.025);
    color.lerp(c(ground.crust), tideLine * (0.35 + 0.4 * n3));
    const wrackLine = 1 - smooth(Math.abs(y + 0.585) / 0.02);
    color.lerp(c(ground.wrack), wrackLine * 0.55 * smooth((n2 - 0.35) / 0.2));
  } else {
    color.copy(c(ground.mud)).lerp(c(ground.deep), smooth((-0.7 - y) / 0.4));
  }
  const grain = 0.94 + 0.08 * n3 + 0.03 * Math.sin(4.8 * x + 2.2 * z + 0.9 * Math.sin(1.5 * z));
  color.multiplyScalar(grain);
}

function buildBed(T, estuary, layout) {
  const { heightAt } = estuary;
  // Fine steps over the board and its banks so the colour patches and the
  // cut bank resolve, coarser over the outer flats.
  const axis = (half) => {
    const inner = half + 0.5,
      samples = [];
    for (let k = 0; k <= inner * 12 + 1e-6; k++) samples.push(-inner + k / 6);
    for (let d = 0.25; d <= 3.51; d += 0.25) {
      samples.unshift(-inner - d);
      samples.push(inner + d);
    }
    for (const d of [4.5, 5.3, 6.3, 7.5]) {
      samples.unshift(-inner - d);
      samples.push(inner + d);
    }
    return samples;
  };
  const xs = axis(layout.width / 2),
    zs = axis(layout.height / 2);
  const positions = [],
    colors = [],
    indices = [];
  const color = new T.Color();
  for (let j = 0; j < zs.length; j++) {
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i],
        z = zs[j],
        y = heightAt(x, z);
      positions.push(x, y, z);
      const steep =
        Math.hypot(
          heightAt(x + 0.06, z) - heightAt(x - 0.06, z),
          heightAt(x, z + 0.06) - heightAt(x, z - 0.06)
        ) / 0.12;
      paintGround(T, color, estuary, x, z, y, steep);
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

// Patches of turf on the crown, cut as irregular sods with a lighter, sunlit
// rim, the way grass takes hold in the lee of a sand ridge.
function turfPatches(m, estuary, surface) {
  const r = m.rng;
  let placed = 0;
  for (let i = 0; i < 900 && placed < 80; i++) {
    const x = r.range(-6.3, 6.3),
      z = r.range(-6.8, 6.8);
    const kind = estuary.kindAt(x, z);
    if (!kind || kind === 'bridge' || kind === 'reeds' || kind === 'rock' || kind === 'crate')
      continue;
    if (fbm(x * 0.9 - 4, z * 0.9 + 6) < (kind === 'plain' ? 0.52 : 0.38)) continue;
    placed++;
    const inner = r.pick([0x5f6c40, 0x67724a, 0x5a6a3f]),
      rim = m.mix(inner, 0x8c8a5c, 0.3);
    // Each sod is two or three overlapping lobes.
    for (let lobe = 0; lobe < 3; lobe++) {
      const n = 9,
        rx = r.range(0.07, 0.2),
        rz = rx * r.range(0.55, 1),
        turn = r.range(0, Math.PI);
      const ox = x + (lobe ? r.range(-0.16, 0.16) : 0),
        oz = z + (lobe ? r.range(-0.12, 0.12) : 0);
      const ring = [];
      for (let j = 0; j < n; j++) {
        const a = (j * Math.PI * 2) / n,
          k = r.range(0.65, 1.2);
        const u = Math.cos(a) * rx * k,
          v = Math.sin(a) * rz * k;
        const px = ox + u * Math.cos(turn) - v * Math.sin(turn),
          pz = oz + u * Math.sin(turn) + v * Math.cos(turn);
        ring.push([px, surface(px, pz) + 0.006 + lobe * 0.001, pz]);
      }
      const centre = [ox, surface(ox, oz) + 0.008 + lobe * 0.001, oz];
      for (let j = 0; j < n; j++)
        m.face([centre, ring[(j + 1) % n], ring[j]], [m.rgb(inner), rim, rim]);
    }
    const centre = [x, surface(x, z) + 0.008, z],
      ring = [
        [x + 0.1, 0, z],
        [x - 0.1, 0, z + 0.05],
        [x, 0, z - 0.08]
      ],
      n = ring.length;
    // A few blades standing out of the sod.
    for (let k = 0; k < 3; k++) {
      const p = ring[Math.floor(r.next() * n)];
      const bx = (p[0] + x) / 2,
        bz = (p[2] + z) / 2;
      m.leaf(
        [bx, centre[1], bz],
        [bx + r.range(-0.05, 0.05), centre[1] + r.range(0.05, 0.11), bz + r.range(-0.05, 0.05)],
        0.012,
        inner,
        0x9fa86f,
        0.01
      );
    }
  }
}

// The cut bank where the crown breaks off: roots hang from the turf at the
// lip, sods that have slumped lie part way down, and crumbled clods and
// pebbles gather at the foot.
function bankDetails(m, layout, estuary, surface) {
  const r = m.rng,
    { cx, cz } = estuary;
  const solid = new Set(
    layout.cells.filter((c) => c.kind !== 'bridge').map((c) => c.y * layout.width + c.x)
  );
  const sides = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ];
  for (const cell of layout.cells) {
    if (cell.kind === 'bridge') continue;
    for (const [dx, dz] of sides) {
      const nx = cell.x + dx,
        nz = cell.y + dz;
      if (solid.has(nz * layout.width + nx)) continue;
      const x0 = cell.x - cx,
        z0 = cell.y - cz;
      for (let k = 0; k < 1; k++) {
        const t = r.range(-0.42, 0.42);
        const ex = x0 + dx * 0.5 + dz * t,
          ez = z0 + dz * 0.5 + dx * t;
        // Walk outward to the lip and then to the foot of the cut.
        let lip = 0.06,
          foot = 0.3;
        for (let d = 0.04; d < 0.6; d += 0.03) {
          const y = surface(ex + dx * d, ez + dz * d);
          if (y > 0.03) lip = d;
          if (y > -0.36) foot = d;
        }
        const lx = ex + dx * (lip + 0.03),
          lz = ez + dz * (lip + 0.03),
          ly = surface(lx, lz);
        if (r.next() < 0.7) {
          // Roots hanging from the turf.
          const len = r.range(0.1, 0.24);
          m.line(
            [
              [lx, ly - 0.01, lz],
              [
                lx + dx * 0.05 + dz * r.range(-0.03, 0.03),
                ly - len * 0.55,
                lz + dz * 0.05 + dx * r.range(-0.03, 0.03)
              ],
              [
                lx + dx * 0.04 + dz * r.range(-0.05, 0.05),
                ly - len,
                lz + dz * 0.04 + dx * r.range(-0.05, 0.05)
              ]
            ],
            0.008,
            0x4e4535,
            3
          );
        }
        const fx = ex + dx * (foot + r.range(0.02, 0.12)) + dz * r.range(-0.08, 0.08),
          fz = ez + dz * (foot + r.range(0.02, 0.12)) + dx * r.range(-0.08, 0.08);
        const fy = surface(fx, fz);
        if (fy > tide + 0.02)
          m.rock(
            fx,
            fy - 0.03,
            fz,
            r.range(0.04, 0.09),
            r.range(0.04, 0.08),
            r.range(0.035, 0.07),
            0x7a6a4e,
            r.pick([0x9c8c6c, 0x8a8062]),
            6
          );
      }
      // Bands of darker loam and pale silt run along the face of the cut.
      for (const [band, high, tone] of [
        [-0.13, 0.03, 0x655539],
        [-0.25, 0.022, 0xb0a07a],
        [-0.33, 0.03, 0x76674a]
      ]) {
        const row = [];
        for (let k = 0; k <= 4; k++) {
          const t = -0.5 + k / 4 + (k % 4 ? r.range(-0.04, 0.04) : 0);
          const bx = x0 + dx * 0.5 + dz * t,
            bz = z0 + dz * 0.5 + dx * t;
          let d = 0.05;
          while (d < 0.6 && surface(bx + dx * d, bz + dz * d) > band) d += 0.02;
          const y = band + 0.012 * Math.sin(bx * 5.3 + bz * 3.1);
          row.push([bx + dx * (d + 0.012), y, bz + dz * (d + 0.012)]);
        }
        for (let k = 0; k < 4; k++) {
          const a = row[k],
            b = row[k + 1];
          m.face([a, b, [b[0], b[1] + high, b[2]], [a[0], a[1] + high, a[2]]], tone);
        }
      }
      // Now and then a sod has slumped down the face, turf still on top.
      if (r.next() < 0.12) {
        const t = r.range(-0.3, 0.3),
          d = 0.2;
        const sx = x0 + dx * (0.5 + d) + dz * t,
          sz = z0 + dz * (0.5 + d) + dx * t,
          sy = surface(sx, sz);
        m.frame(
          sx,
          sy + 0.02,
          sz,
          Math.atan2(dx, dz) + r.range(-0.4, 0.4),
          1,
          () => {
            m.box(0, 0, 0, 0.2, 0.08, 0.14, 0x7c6a4c);
            m.box(0, 0.045, 0, 0.21, 0.025, 0.15, 0x66744a);
          },
          r.range(-0.5, 0.5),
          r.range(-0.3, 0.3)
        );
      }
    }
  }
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
  // The reed hut (fishers-2.js) stands on this inlet; its stair is laid here.
  const x = (2.25 * (estuary.cx + 0.5)) / 5.5,
    z = -estuary.cz - 0.5 - (7.31 - 5.5);
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

// Reed beds fringe every bar and choke the shallows between them. Near the
// board they stay below the crown so each tile reads; out on the flats they
// stand taller than a man.
function reedBeds(m, estuary, surface) {
  const r = m.rng,
    { cx, cz } = estuary;
  const ground = (x, z) => {
    const kind = estuary.kindAt(x, z);
    if (kind) return null;
    if (estuary.shoreAt(x, z) < 0.24) return null;
    if (inYard(x, z)) return null;
    const y = surface(x, z);
    return y < -0.92 || y > -0.15 ? null : y;
  };
  for (let gx = -13; gx <= 13; gx += 0.62)
    for (let gz = -13; gz <= 13; gz += 0.62) {
      const x = gx + r.range(-0.25, 0.25),
        z = gz + r.range(-0.25, 0.25);
      const f = fbm(x * 0.34 + 20, z * 0.34 - 4);
      if (f < 0.46 || ground(x, z) === null) continue;
      const shore = estuary.shoreAt(x, z),
        inside = Math.abs(x) < cx + 0.5 && Math.abs(z) < cz + 0.5;
      const radius = (0.32 + 0.55 * smooth((f - 0.46) / 0.25)) * (inside ? 0.6 : 1);
      const height = (0.42 + 0.75 * smooth((shore - 0.4) / 2.6)) * (inside ? 0.6 : 1);
      reedStand(m, x, z, radius, height, Math.round(radius * radius * 70 + 4), ground, {
        stretch: r.range(1, 1.6),
        angle: r.range(0, Math.PI)
      });
    }
  // A thin fringe of short reed along the foot of every cut, below the crown.
  for (let i = 0; i < 1400; i++) {
    const x = r.range(-cx - 1.2, cx + 1.2),
      z = r.range(-cz - 1.2, cz + 1.2);
    const shore = estuary.shoreAt(x, z);
    if (shore < 0.3 || shore > 0.75 || fbm(x * 1.7, z * 1.7) < 0.5) continue;
    const y = ground(x, z);
    if (y === null || y > -0.3) continue;
    reed(m, x, y - 0.03, z, r.range(0.3, 0.5), { plume: r.next() < 0.4, dead: r.next() < 0.2 });
  }
  // Sedge on the dry sand of the beaches.
  for (let i = 0; i < 420; i++) {
    const x = r.range(-12, 12),
      z = r.range(-12, 12),
      y = ground(x, z);
    if (y === null || y < -0.6) continue;
    sedge(m, x, y, z, r.range(0.1, 0.2), r.pick([0x7c8a5a, 0x8b8f5c, 0x6f7f52]));
  }
}

function landform2(T, layout) {
  const estuary = makeEstuary(layout);
  const { bed, surface } = buildBed(T, estuary, layout);
  const bridges = new Model(T, 31123),
    shores = new Model(T, 48026),
    reeds = new Model(T, 52817),
    folk = new Model(T, 60331);
  bridgeSupports(bridges, layout, estuary, surface);
  fishingWeir(shores, surface);
  shoreDetails(shores, estuary, surface);
  mudflatMarks(shores, estuary, surface);
  turfPatches(shores, estuary, surface);
  bankDetails(shores, layout, estuary, surface);
  reedBeds(reeds, estuary, surface);
  fisherfolk(folk, shores, surface);
  const group = new T.Group();
  group.name = '蘆花汀・潮汊漁堰';
  group.add(
    bed,
    bridges.finish('六橋排架與橋臺'),
    shores.finish('簖塘、泥灘與蘆根'),
    reeds.finish('汀岸蘆蕩', { occluder: true, cast: false }),
    folk.finish('漁家蘆舍與舟網', { occluder: true })
  );
  return group;
}

export { landform2 };
