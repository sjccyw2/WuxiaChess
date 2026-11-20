import { Model } from '../scenery-kit.js';
import { cloudSteps, cloudTone } from './cloud-8.js';
import { streetHouse } from './pavilion-8.js';
import { brokenStreet } from './fragment-8.js';
import { lantern } from '../maze-models.js';

// The city stands on banks of cloud that step down to a mirror of still
// water. The three shallow headraces up on the shopping street spill into
// it through carved stone outlets.
const river = -2.18;
const facing = 0x81828b;
const mortar = 0x565963;
const capstone = 0xb4aaa0;
const wetStone = 0x586469;
const wood = 0x736255;
const rope = 0xad9872;
const basinFloor = -9.75;
const deepWater = 0x8c90b0;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const topOfQuay = -0.04;

function earthwork(layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const rows = [];
  layout.mask.forEach((line, iz) => {
    for (const run of line.matchAll(/#+/g)) {
      rows.push([run.index - cx - 0.5, run.index - cx + run[0].length - 0.5, iz - cz]);
    }
  });
  // The mirror houses sit on pairs of piers. The intervening gaps leave
  // their inverted eaves visible, almost touching the river.
  const moles = [
    [-8.7, -2.3, 0.92, 1.83, -0.29, 0],
    [-8.34, 3.46, 1.19, 1.12, -0.24, 0.6],
    [8.55, 2.95, 0.99, 1.35, -0.25, -0.15],
    [8.71, -3.1, 1.03, 2.12, -0.62, -0.21],
    [9.86, -3.48, 0.85, 0.85, -0.68, 0],
    [4.24, -6.54, 0.87, 0.87, -0.43, 0],
    [-8.42, 4.31, 0.98, 0.91, -0.29, -0.2]
  ];
  for (const [x, z, width, angle] of [
    [-9.71, 3.098, 3.16, 1.15],
    [4.827, -7.99, 2.87, -0.18]
  ]) {
    for (const side of [-1, 1]) {
      const offset = side * width * 0.49;
      moles.push([
        x + offset * Math.cos(angle),
        z - offset * Math.sin(angle),
        0.46,
        1.02,
        -0.82,
        angle
      ]);
    }
  }
  // Rounded rubble toes and submerged talus replace the staircase
  // silhouette of an otherwise perfectly vertical cell perimeter.
  function fall(distance, top, x, z) {
    const rough = Math.sin(x * 1.34 + z * 1.19) * 0.09 + Math.sin(z * 2.9 - x * 0.58) * 0.055;
    const j = Math.max(0, distance + rough * Math.min(1, distance * 2));
    const shelf = 0.045 * Math.sin(8 * j - z * 0.53) * Math.min(1, j * 2);
    return top - j * 0.47 - Math.pow(j, 1.9) * 0.92 + shelf;
  }
  function surface(x, z) {
    let d2 = Infinity;
    for (const [lo, hi, rowZ] of rows) {
      const dx = Math.max(lo - x, x - hi, 0),
        dz = Math.max(Math.abs(z - rowZ) - 0.5, 0);
      d2 = Math.min(d2, dx * dx + dz * dz);
    }
    const grain = 0.029 * Math.sin(x * 1.64 + z * 0.53) + 0.019 * Math.cos(z * 1.3 - x);
    let h = fall(Math.sqrt(d2), -0.2 + grain, x, z);
    for (const [a, b, w, d, top, yaw] of moles) {
      const dx = x - a,
        dz = z - b;
      const u = (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / w,
        v = (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d;
      const dist = Math.max(0, Math.hypot(u, v) - 1) * Math.min(w, d);
      h = Math.max(h, fall(dist, top + grain, x, z));
    }
    return Math.max(basinFloor + 0.16 * Math.sin(x * 0.51 - z * 0.28), h);
  }
  return surface;
}

function basin(T, surface) {
  const m = new Model(T, 81021);
  const pos = [],
    col = [],
    ix = [],
    nc = 59,
    nr = 47;
  for (let j = 0; j < nr; j++) {
    for (let i = 0; i < nc; i++) {
      const x0 = -14.5 + i * 0.5,
        z0 = -11.5 + j * 0.5;
      // Exact grid corner samples guarantee subgrade beneath every overlying
      // slab. Jitter is confined to the organic offshore reaches.
      const regular = Math.abs(x0) <= 7.55 && Math.abs(z0) <= 6.05;
      const x = x0 + (regular ? 0 : m.rng.range(-0.068, 0.068));
      const z = z0 + (regular ? 0 : m.rng.range(-0.068, 0.068));
      const y = surface(x, z);
      pos.push(x, y, z);
      // The bed is the shaded heart of the cloud bank, seen between billows.
      const v = clamp((y - river) / 1.98, 0, 1);
      col.push(...m.mix(cloudTone(m, v * 0.8, 0.25), deepWater, clamp(-0.4 - v * 3, 0, 1)));
      if (i && j) {
        const d = j * nc + i,
          a = d - nc - 1,
          b = d - 1,
          c = d - nc;
        if ((i + j) % 2) ix.push(a, b, c, b, d, c);
        else ix.push(a, b, d, a, d, c);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  geometry.setIndex(ix);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mesh = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })
  );
  mesh.name = '雲階深處';
  mesh.receiveShadow = true;
  return mesh;
}
function flat(m, x0, x1, z0, z1, h, color) {
  m.face(
    [
      [x0, h, z0],
      [x0, h, z1],
      [x1, h, z1],
      [x1, h, z0]
    ],
    color
  );
}
// A flagstone with a narrow chamfer, so each slab catches light on its rim.
function slab(m, x0, x1, z0, z1, h, color) {
  const c = 0.014,
    low = 0.049,
    rim = m.mix(color, 0x40464c, 0.28);
  const top = [
      [x0 + c, h, z0 + c],
      [x0 + c, h, z1 - c],
      [x1 - c, h, z1 - c],
      [x1 - c, h, z0 + c]
    ],
    foot = [
      [x0, low, z0],
      [x0, low, z1],
      [x1, low, z1],
      [x1, low, z0]
    ];
  m.face(top, color);
  for (let i = 0; i < 4; i++) {
    const k = (i + 1) % 4;
    m.face([foot[i], foot[k], top[k], top[i]], rim);
  }
}
function surfaceStreets(m, layout) {
  const cx = (layout.width - 1) / 2,
    cz = (layout.height - 1) / 2;
  const cells = new Map(layout.cells.map((c) => [c.x + ',' + c.y, c]));
  // Stagger the flagstone joints in long, continuous drainside courses.
  // The paving terminates at the real board boundary and at every canal.
  for (let j = 0; j < layout.height; j++) {
    const dry = Array.from({ length: layout.width }, (_, i) => {
      const k = cells.get(i + ',' + j)?.kind;
      return k && k !== 'reeds' && k !== 'bridge' ? '#' : '.';
    }).join('');
    for (const run of dry.matchAll(/#+/g)) {
      const left = run.index - cx - 0.498,
        right = left + run[0].length - 0.004,
        near = j - cz - 0.5;
      flat(m, left, right, near + 0.002, near + 0.998, 0.048, 0x5e676a);
      for (let l = 0; l < 3; l++) {
        const z = near + l / 3 + 0.008;
        let x = left;
        while (x < right - 0.016) {
          const edge = Math.min(
            right,
            x + (x === left ? m.rng.range(0.24, 0.85) : m.rng.range(0.72, 1.45))
          );
          const roll = m.rng.next();
          let color = m.mix(
            0x74828a,
            0xa49b87,
            0.35 + 0.17 * Math.sin(j * 0.88 + l) + m.rng.range(0, 0.26)
          );
          // A few slabs were relaid in pale stone; others are dark and worn.
          if (roll < 0.11) color = m.mix(color, 0xc4bcaa, 0.62);
          else if (roll < 0.2) color = m.mix(color, 0x5f676d, 0.45);
          const mid = (x + edge) / 2,
            ix = Math.round(mid + cx),
            outside = (dj) => {
              const k = cells.get(ix + ',' + (j + dj))?.kind;
              return !k || k === 'reeds' || k === 'bridge';
            };
          slab(m, x + 0.008, edge - 0.005, z, z + 0.318, 0.053 + m.rng.range(0.001, 0.004), color);
          // Moss creeps into the joints along the street's outer edges.
          const verge = (l === 0 && outside(-1)) || (l === 2 && outside(1));
          if (verge || m.rng.next() < 0.06) {
            const zz = l === 2 && verge ? z + 0.3 : z + 0.004,
              a = x + m.rng.range(0.02, 0.25) * (edge - x),
              b = Math.min(edge - 0.02, a + m.rng.range(0.25, 0.6));
            flat(
              m,
              a,
              b,
              zz,
              zz + m.rng.range(0.018, 0.034),
              0.0575,
              m.mix(0x56704b, 0x84955f, m.rng.next())
            );
          }
          x = edge;
        }
      }
    }
  }
  // Adjoining wet cells form a single shallow ornamental race. Flush curb
  // slabs keep the crossing or ford usable across the full width.
  const outlets = [];
  for (const x of [
    ...new Set(
      layout.cells.filter((c) => c.kind === 'reeds' || c.kind === 'bridge').map((c) => c.x)
    )
  ]) {
    const col = Array.from({ length: layout.height }, (_, y) => {
      const k = cells.get(x + ',' + y)?.kind;
      return k === 'reeds' || k === 'bridge' ? '#' : '.';
    }).join('');
    for (const run of col.matchAll(/#+/g)) {
      const xx = x - cx,
        z0 = run.index - cz - 0.5,
        z1 = z0 + run[0].length;
      flat(m, xx - 0.422, xx + 0.422, z0, z1, -0.008, [
        m.rgb(0x537a7e),
        m.rgb(0x4c737a),
        m.rgb(0x739497),
        m.rgb(0x668d91)
      ]);
      for (const side of [-1, 1]) {
        const left = xx + side * 0.458;
        m.box(left, 0.001, (z0 + z1) / 2, 0.076, 0.087, z1 - z0, 0x858794);
        for (let z = z0; z < z1 - 0.01; z += 0.77) {
          const end = Math.min(z + 0.755, z1);
          if (end > z) flat(m, left - 0.039, left + 0.039, z, end, 0.047, 0xc2b8a5);
        }
      }
      for (let j = run.index; j < run.index + run[0].length; j++) {
        const cell = cells.get(x + ',' + j),
          z = j - cz;
        if (cell.kind === 'bridge') {
          // Corbel the slab into both banks. An open throat remains below.
          m.box(xx, -0.032, z, 1.15, 0.079, 0.725, facing);
          for (const side of [-1, 1]) {
            m.box(xx + side * 0.39, -0.14, z, 0.36, 0.2, 0.74, mortar);
            m.box(xx + side * 0.48, -0.24, z, 0.3, 0.38, 0.76, wetStone);
          }
          continue;
        }
        for (let k = 0; k < 3; k++) {
          const w = 0.208 + 0.12 * Math.sin(j * 0.81 + k * 0.68);
          const zz = z - 0.3 + k * 0.24;
          for (const side of [-1, 1]) {
            const tone = m.mix(0x547a7f, 0x9aa9a7, 0.24 + 0.2 * Math.cos(zz * 2 + side));
            flat(
              m,
              xx + (side < 0 ? -w : 0.035),
              xx + (side < 0 ? -0.035 : w),
              zz,
              zz + 0.013,
              -0.001,
              tone
            );
          }
        }
      }
      const beyond = run.index + run[0].length;
      if (!cells.has(x + ',' + beyond) && run[0].length >= 3) outlets.push([xx, z1]);
    }
  }
  return outlets;
}

// A segmental masonry vault is an open tunnel all the way from one arch
// face to the other. Separate voussoirs make its load path legible at orbit.
function arch(m, ax, az, bx, bz, width, top, count = 1) {
  const length = Math.hypot(bx - ax, bz - az),
    yaw = Math.atan2(-(bz - az), bx - ax);
  m.frame((ax + bx) / 2, 0, (az + bz) / 2, yaw, 1, () => {
    const span = length / count,
      radius = span * 0.37;
    const soffit = top - 0.28,
      spring = soffit - Math.min(1.03, span * 0.3);
    const rises = soffit - spring;
    for (let k = 0; k < count; k++) {
      const center = -length / 2 + (k + 0.5) * span;
      for (let j = 0; j < 13; j++) {
        const azimuth = (j / 13) * Math.PI,
          next = ((j + 1) / 13) * Math.PI;
        const a = center + Math.cos(azimuth) * radius,
          b = center + Math.cos(next) * radius,
          h = spring + Math.sin(azimuth) * rises,
          i = spring + Math.sin(next) * rises;
        const front = -width / 2,
          back = width / 2;
        const faceCol = m.mix(0x787985, 0xa9a3a0, 0.31 + (j % 4) * 0.095);
        for (const edge of [front, back]) {
          m.face(
            [
              [a, h, edge],
              [b, i, edge],
              [b, top - 0.095, edge],
              [a, top - 0.095, edge]
            ],
            facing
          );
          const x0 = center + Math.cos(azimuth - 0.002) * (radius + 0.116);
          const x1 = center + Math.cos(next + 0.002) * (radius + 0.116);
          m.face(
            [
              [a, h - 0.004, edge + Math.sign(edge) * 0.012],
              [b, i - 0.004, edge + Math.sign(edge) * 0.012],
              [x1, i + 0.13 * Math.sin(next), edge + Math.sign(edge) * 0.013],
              [x0, h + 0.13 * Math.sin(azimuth), edge + Math.sign(edge) * 0.013]
            ],
            faceCol
          );
        }
        m.face(
          [
            [a, h, front],
            [b, i, front],
            [b, i, back],
            [a, h, back]
          ],
          m.mix(facing, mortar, 0.56)
        );
      }
    }
    for (let k = 0; k <= count; k++) {
      const x = -length / 2 + k * span;
      const base = river - 1.62,
        pierW = (span - radius * 2) * (k === 0 || k === count ? 0.5 : 1);
      const inner = x + (k === 0 ? 1 : k === count ? -1 : 0) * pierW * 0.5;
      m.box(inner, (top + base) / 2 - 0.054, 0, pierW, top - base - 0.1, width, facing);
      m.box(inner, river - 0.39, 0, pierW + 0.19, 0.83, width + 0.21, wetStone);
      m.box(inner, spring - 0.07, 0, pierW + 0.1, 0.13, width + 0.07, capstone);
    }
    m.box(0, top - 0.049, 0, length, 0.1, width + 0.065, capstone);
    // The balustrade stops short of the tactical bank at both approaches.
    const run = length * 0.54;
    for (const side of [-1, 1]) {
      const z = side * (width / 2 - 0.028);
      const piers = [-run / 2, 0, run / 2];
      for (const x of piers) {
        m.box(x, top + 0.15, z, 0.073, 0.3, 0.08, 0x7f8586);
        m.lathe(
          x,
          top + 0.29,
          z,
          [
            [0, 0.055],
            [0.035, 0.058],
            [0.07, 0.017]
          ],
          capstone,
          6
        );
      }
      m.box(0, top + 0.231, z, run, 0.046, 0.056, 0x9ba09b);
      m.box(0, top + 0.092, z, run, 0.036, 0.042, 0x8c9393);
    }
    for (let x = -length / 2 + 0.12; x < length / 2 - 0.14; x += 0.42) {
      m.box(x, top + 0.008, 0, 0.013, 0.012, width - 0.042, 0x8d8990);
    }
  });
}

function dais(m, x, z, y, w, d, yaw = 0) {
  m.frame(x, 0, z, yaw, 1, () => {
    const bottom = river - 0.84;
    m.box(0, (y + bottom) / 2, 0, w - 0.06, y - bottom, d - 0.06, facing);
    m.box(0, y - 0.13, 0, w + 0.075, 0.17, d + 0.075, 0x929097);
    m.box(0, y - 0.028, 0, w + 0.15, 0.065, d + 0.15, capstone);
  });
}
function houseFeet(m, x, z, width, yaw, y) {
  m.frame(x, 0, z, yaw, 1, () => {
    const floor = y - 0.015,
      bottom = river - 1.24;
    for (const side of [-1, 1]) {
      const dx = side * width * 0.47;
      m.box(dx, (bottom + floor) / 2, 0, 0.39, floor - bottom, width * 0.53, facing);
      m.box(dx, river - 0.11, 0, 0.66, 0.54, width * 0.62, wetStone);
      m.box(dx, floor - 0.12, 0, 0.59, 0.25, width * 0.58, capstone);
      for (const zz of [-1, 1]) {
        const sx = dx + side * 0.2,
          sz = zz * width * 0.24;
        m.tube(
          [sx, floor - 0.82, sz],
          [dx + side * 0.48, floor - 0.1, sz],
          0.085,
          0.077,
          0x776869,
          6
        );
      }
    }
    for (const zz of [-1, 1])
      m.box(0, floor - 0.075, zz * width * 0.253, width + 0.28, 0.14, 0.14, 0x80747a);
  });
}

function slopingStair(m, T) {
  // Match each of the twelve existing steps on both sides, including the
  // high landing beyond the last tread. The back wall is below the treads.
  m.frame(8.67, 0, -3.044, 1.32, 1, () => {
    const base = river - 0.9;
    for (let i = 0; i < 12; i++) {
      const x = i * 0.3 - 1.72,
        top = i * 0.19 - 0.439;
      for (const side of [-1, 1]) {
        m.box(x, (base + top) / 2, side * 0.367, 0.301, top - base, 0.2, i % 2 ? facing : 0x898590);
        m.box(x, top - 0.066, side * 0.48, 0.298, 0.12, 0.112, capstone);
      }
    }
    m.box(2.12, 0.72, 0, 0.7, 2.2, 1.14, facing);
    m.box(2.12, 1.838, 0, 0.73, 0.1, 1.22, capstone);
    // The left post of the turned gate overhangs a lower tread. Give
    // that individual foot its own pedestal so the last treads stay open.
    const footX = 1.63 - 1.18 * 0.66 * Math.cos(-0.38);
    const footZ = 1.18 * 0.66 * Math.sin(-0.38);
    m.box(footX, 1.59, footZ, 0.23, 0.6, 0.28, facing);
  });
  // The tilted loggia is tied to the same island as the stair. Its two
  // bamboo-shore frames bear directly on its original tilted tie beams.
  const rotation = new T.Euler(0.09, 0.1, Math.PI * 0.71, 'YXZ');
  m.frame(9.82, 0.05, -3.48, -0.6, 1, () => {
    for (const end of [-1, 1]) {
      const q = new T.Vector3(end * 1.1, 0.02, 0.48)
        .applyEuler(rotation)
        .add(new T.Vector3(0.16, 1.41, 0.28));
      const bottom = river - 0.85;
      m.box(q.x, (bottom - 0.35) / 2, q.z, 0.36, -0.35 - bottom, 0.42, wetStone);
      m.tube([q.x, -0.39, q.z], [q.x, q.y + 0.01, q.z], 0.114, 0.09, wood, 7);
      m.tube([q.x + 0.31, -0.47, q.z - 0.42], [q.x, q.y - 0.04, q.z], 0.072, 0.061, wood, 6);
    }
  });
}

const spans = [
  // endpoints enter the old gate and both main street shoulders.
  [-8.49, -2.3, -5.08, -2.52, 0.94, 1],
  [-8.18, 3.35, -4.95, 1.55, 0.85, 1],
  [1.56, -3.95, 4.16, -6.45, 0.82, 1],
  [5.2, 2.36, 8.1, 2.75, 0.72, 1]
];
function stairFlight(m, ax, az, bx, bz, low, high, width, n, surface) {
  const yaw = Math.atan2(bx - ax, bz - az),
    step = Math.hypot(bx - ax, bz - az) / n;
  m.frame(ax, 0, az, yaw, 1, () => {
    for (let j = 0; j < n; j++) {
      const top = low + ((high - low) * (j + 1)) / n,
        z = (j + 0.5) * step;
      const ground = surface
        ? Math.min(river - 1, surface(ax + Math.sin(yaw) * z, az + Math.cos(yaw) * z) - 0.64)
        : river - 1;
      m.box(0, (top + ground) / 2, z, width, top - ground, step + 0.002, facing);
      m.box(
        0,
        top - 0.026,
        z,
        width + 0.054,
        0.052,
        step + 0.025,
        j % 3 === 1 ? 0xa8a0a0 : capstone
      );
    }
  });
}
function drain(m, x, z, surface) {
  // The street race cuts a channel across the quayside lip and drops above
  // the river; it is anchored to the bank along its complete length.
  let end = z + 0.25;
  while (end < z + 3.3 && surface(x, end) > river - 0.28) end += 0.12;
  if (end >= z + 3.25) return;
  const mouth = end + 0.16,
    w = 0.28;
  const lip = river + 0.34;
  for (let j = 0; j < 8; j++) {
    const a = z + ((mouth - z) * j) / 8,
      b = z + ((mouth - z) * (j + 1)) / 8,
      cy = -0.042 + (lip + 0.042) * Math.pow(j / 7, 1.34);
    const base = Math.min(surface(x, (a + b) / 2) - 0.14, cy - 0.12);
    m.box(x, (cy + base) / 2, (a + b) / 2, w * 2, cy - base, b - a + 0.012, wetStone);
    for (const side of [-1, 1])
      m.box(x + side * (w - 0.026), cy + 0.044, (a + b) / 2, 0.062, 0.1, b - a + 0.01, 0xb5ada0);
    flat(m, x - w + 0.06, x + w - 0.06, a, b, cy + 0.014, 0x83a5a5);
  }
  m.face(
    [
      [x - w + 0.062, lip, mouth],
      [x + w - 0.062, lip, mouth],
      [x + w - 0.15, river - 0.016, mouth + 0.2],
      [x - w + 0.11, river - 0.016, mouth + 0.2]
    ],
    0xa1bcc0
  );
  for (let k = 0; k < 2; k++) {
    const zz = mouth + 0.3 + k * 0.13;
    m.face(
      [
        [x - 0.26, river + 0.008, zz],
        [x - 0.14, river + 0.008, zz + 0.022],
        [x + 0.25, river + 0.008, zz + 0.052],
        [x + 0.15, river + 0.008, zz + 0.032]
      ],
      0xb1c1b8
    );
  }
}

function plumWineShop(m) {
  // Folded cloth belonged to two schools. Both halves are stitched to the
  // same crossbar in the opening conversation.
  m.frame(-8.71, 0, -2.302, 1.42, 1, () => {
    m.tube([-0.9, 2.68, 0.2], [0.9, 2.68, 0.2], 0.031, 0.031, wood, 8);
    for (const x of [-0.82, 0.82]) m.tube([x, 2.68, 0.2], [x, 2.8, 0.06], 0.018, 0.018, rope, 6);
    for (let k = 0; k < 8; k++) {
      const a = -0.75 + k * 0.1875,
        b = a + 0.1875;
      const p = (x, h) => [x, h, 0.21 + 0.052 * Math.sin(x * 6.4) + 0.05 * (2.68 - h)];
      const bottom = (x) => 1.94 + 0.117 * Math.cos(x * 4.8) + 0.026 * Math.sin(x * 15);
      const tone =
        k < 4
          ? m.mix(0xb8795d, 0xca957d, (k % 3) * 0.19)
          : m.mix(0x687785, 0x99a0a5, (k % 3) * 0.2);
      m.face([p(a, 2.66), p(a, bottom(a)), p(b, bottom(b)), p(b, 2.66)], tone);
      m.face(
        [
          p(a, bottom(a) + 0.077),
          p(a, bottom(a) + 0.046),
          p(b, bottom(b) + 0.046),
          p(b, bottom(b) + 0.077)
        ],
        0xdbc79c
      );
    }
    for (let k = 0; k < 5; k++)
      m.tube(
        [-0.017, 2.13 + 0.095 * k, 0.235],
        [0.016, 2.16 + 0.095 * k, 0.244],
        0.008,
        0.008,
        0xe8d6a1,
        4
      );
  });
  m.frame(-8.53, -0.033, 4.37, -0.3, 1, () => {
    const brown = 0x815f55,
      tea = 0x6a574f,
      celadon = 0xa6bdb5;
    for (const x of [-0.34, 0.34])
      for (const z of [-0.19, 0.19]) m.box(x, 0.225, z, 0.083, 0.45, 0.084, brown);
    m.box(0, 0.465, 0, 0.91, 0.066, 0.58, 0xa38568);
    for (const [x, z] of [
      [-0.24, 0.12],
      [0.06, 0.12],
      [0.24, -0.1]
    ]) {
      m.lathe(
        x,
        0.5,
        z,
        [
          [0, 0.039],
          [0.016, 0.043],
          [0.066, 0.079],
          [0.073, 0.073],
          [0.037, 0.037]
        ],
        celadon,
        9
      );
      m.lathe(
        x,
        0.542,
        z,
        [
          [0, 0.042],
          [0.005, 0.053]
        ],
        tea,
        9
      );
    }
    m.lathe(
      -0.2,
      0.5,
      -0.12,
      [
        [0, 0.057],
        [0.04, 0.11],
        [0.13, 0.12],
        [0.19, 0.071],
        [0.215, 0.074]
      ],
      0x8d655b,
      11
    );
    m.tube([-0.2, 0.702, -0.12], [-0.2, 0.736, -0.12], 0.082, 0.067, 0xb99a75, 9);
    for (const [xx, zz] of [
      [-0.6, 0.12],
      [0.5, 0.48]
    ]) {
      for (const x of [-0.103, 0.103])
        for (const z of [-0.09, 0.09]) m.box(xx + x, 0.13, zz + z, 0.045, 0.26, 0.046, brown);
      m.box(xx, 0.265, zz, 0.32, 0.05, 0.27, 0xab8c6d);
    }
  });
}
function sampan(m, x, z, yaw) {
  m.frame(x, river, z, yaw, 1, () => {
    const n = 12,
      stations = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        w = 0.042 + 0.34 * Math.pow(Math.sin(Math.PI * t), 0.7);
      const zz = (t - 0.5) * 2.43,
        curve = 0.15 * Math.pow(Math.abs(2 * t - 1), 2.8);
      stations.push([w, zz, curve]);
    }
    for (let i = 0; i < n; i++) {
      const [a, z0, h0] = stations[i],
        [b, z1, h1] = stations[i + 1];
      for (const sign of [-1, 1]) {
        m.face(
          [
            [sign * a, 0.23 + h0, z0],
            [sign * b, 0.23 + h1, z1],
            [sign * b * 0.67, -0.06, z1],
            [sign * a * 0.67, -0.06, z0]
          ],
          i % 4 === 0 ? 0x796b5e : 0x8b7360
        );
        m.face(
          [
            [sign * a, 0.23 + h0, z0],
            [sign * a * 0.72, 0.09 + h0, z0],
            [sign * b * 0.72, 0.09 + h1, z1],
            [sign * b, 0.23 + h1, z1]
          ],
          0x665d55
        );
        m.tube([sign * a, 0.24 + h0, z0], [sign * b, 0.24 + h1, z1], 0.029, 0.029, 0xb29373, 6);
      }
      m.face(
        [
          [-a * 0.73, 0.087 + h0, z0],
          [-b * 0.73, 0.087 + h1, z1],
          [b * 0.73, 0.087 + h1, z1],
          [a * 0.73, 0.087 + h0, z0]
        ],
        0x8d765d
      );
    }
    for (const z of [-0.57, 0.49]) m.box(0, 0.205, z, 0.6, 0.045, 0.15, 0xb59a72);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI,
        b = (i + 1) * Math.PI;
      const curve = (angle, zz) => [Math.cos(angle) * 0.342, 0.237 + Math.sin(angle) * 0.37, zz];
      const ends = [-0.035, 0.64];
      m.face(
        [curve(a, ends[0]), curve(a, ends[1]), curve(b, ends[1]), curve(b, ends[0])],
        i % 2 ? 0xb99964 : 0xc5a471
      );
      for (const zz of ends) m.tube(curve(a, zz), curve(b, zz), 0.021, 0.021, wood, 5);
    }
    m.tube([-0.25, 0.27, 0.85], [0.49, 0.44, -0.82], 0.026, 0.02, 0x9e7d55, 7);
    m.tube([0.49, 0.44, -0.82], [0.58, 0.46, -1.08], 0.05, 0.046, 0xa68a62, 6);
  });
}

function lowerLanding(m, surface) {
  // A passenger can descend from the east ferry sign all the way to the
  // mooring. Mooring posts penetrate the same bed as the stone flight.
  stairFlight(m, 9.72, 5.49, 8.76, 3.82, river + 0.08, -0.05, 0.91, 11, surface);
  m.frame(9.72, 0, 5.59, 0.34, 1, () => {
    for (const x of [-0.59, 0.59])
      for (const z of [-0.42, 0.42]) {
        const ground = surface(
          9.72 + x * Math.cos(0.34) + z * Math.sin(0.34),
          5.59 - x * Math.sin(0.34) + z * Math.cos(0.34)
        );
        m.tube(
          [x, Math.min(river - 1.9, ground - 0.62), z],
          [x, river + 0.34, z],
          0.073,
          0.068,
          0x615b54,
          8
        );
      }
    for (const z of [-0.32, 0.32]) m.box(0, river + 0.087, z, 1.43, 0.105, 0.083, 0x79685b);
    for (let j = 0; j < 8; j++)
      m.box(
        -0.62 + j * 0.178,
        river + 0.171,
        0,
        0.173,
        0.085,
        1.03,
        j % 3 === 0 ? 0xb49c78 : 0x9e8a70
      );
    m.tube([0.52, river + 0.195, 0.33], [0.52, river + 0.69, 0.33], 0.082, 0.074, wood, 8);
    for (let i = 0; i < 3; i++)
      m.hoop(0.52, river + 0.37 + i * 0.024, 0.33, 0.081, 0.014, rope, 11);
  });
  const bx = 10.4,
    bz = 6.45,
    angle = 1.05;
  sampan(m, bx, bz, angle);
  const bow = [bx - Math.sin(angle) * 1.19, river + 0.36, bz - Math.cos(angle) * 1.19];
  m.line(
    [[10.322, river + 0.44, 5.727], [10.02, river + 0.29, 5.78], [9.66, river + 0.25, 5.82], bow],
    0.016,
    rope,
    6
  );
}

function ticketCounter(m, surface) {
  // The child with the copper fare waits beside the northwest gate.
  const x = -5.68,
    z = -6.6,
    w = 1.56,
    d = 1.02,
    floor = -0.043;
  m.frame(x, 0, z, 0, 1, () => {
    for (const a of [-0.66, 0.66])
      for (const b of [-0.4, 0.4]) {
        const footing = surface(x + a, z + b) - 0.29;
        m.box(a, (footing + floor) / 2, b, 0.21, floor - footing, 0.23, wetStone);
        m.box(a, (b < 0 ? 1.07 : 0.88) / 2, b, 0.063, b < 0 ? 1.07 : 0.88, 0.063, wood);
      }
    for (let j = 0; j < 7; j++)
      m.box(-w / 2 + ((j + 0.5) * w) / 7, floor, 0, w / 7 - 0.006, 0.07, d, 0x958571);
    m.box(0, 0.234, 0.31, 1.29, 0.41, 0.17, 0x896343);
    m.box(0, 0.446, 0.28, 1.44, 0.071, 0.43, 0xaf9073);
    for (const a of [-0.43, -0.21, 0.06]) m.box(a, 0.494, 0.27, 0.16, 0.024, 0.21, 0xe0cda9);
    // Open centre square on the large brass counter token.
    for (const side of [-1, 1]) {
      m.box(0.43 + side * 0.058, 0.495, 0.27, 0.052, 0.027, 0.156, 0xc8a45d);
      m.box(0.43, 0.495, 0.27 + side * 0.054, 0.071, 0.027, 0.047, 0xc8a45d);
    }
    for (const a of [-0.64, 0, 0.64])
      m.tube([a, 1.07, -0.48], [a, 0.88, 0.47], 0.025, 0.025, wood, 5);
    const eave = (x, front) => [
      x,
      front ? 0.865 + 0.024 * Math.cos(x * 7) : 1.083,
      front ? 0.51 : -0.51
    ];
    for (let k = 0; k < 8; k++) {
      const a = -0.82 + k * 0.205,
        b = a + 0.205;
      const tone = k === 1 || k === 6 ? 0x96a69a : k % 2 === 1 ? 0x496d68 : 0x597e74;
      m.face([eave(a, false), eave(a, true), eave(b, true), eave(b, false)], tone);
      const pa = eave(a, true),
        pb = eave(b, true);
      m.face([pa, [a, pa[1] - 0.099, 0.52], [b, pb[1] - 0.094, 0.52], pb], tone);
    }
    m.box(0, 1.065, -0.42, 1.61, 0.064, 0.07, wood);
    m.tube([-0.58, 0.91, 0.4], [-0.58, 0.78, 0.4], 0.014, 0.014, rope, 5);
    m.lathe(
      -0.58,
      0.663,
      0.4,
      [
        [-0.052, 0.032],
        [-0.039, 0.065],
        [0.039, 0.083],
        [0.088, 0.058],
        [0.109, 0.027]
      ],
      0xba6c49,
      8
    );
  });
}

function festoon(m, a, b, sag, count) {
  const at = (t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t),
    a[2] + (b[2] - a[2]) * t
  ];
  m.line(
    Array.from({ length: 11 }, (_, i) => at(i / 10)),
    0.012,
    rope,
    4
  );
  for (let k = 1; k <= count; k++) {
    const p = at(k / (count + 1));
    lantern(m, p[0], p[1] - 0.19, p[2], 0.42, k % 2 ? 0xd2643f : 0xdc9a52);
  }
}

function landform8(T, layout) {
  const group = new T.Group();
  group.name = '倒影天街・拱渠與水坊';
  const base = earthwork(layout);
  function surface(x, z) {
    let height = base(x, z);
    const cx = (layout.width - 1) / 2,
      cz = (layout.height - 1) / 2;
    for (const ex of [-0.1, 0.1])
      for (const ez of [-0.1, 0.1]) {
        if (layout.mask[Math.floor(z + ez + cz + 0.5)]?.[Math.floor(x + ex + cx + 0.5)] === '#')
          return height;
      }
    for (const [ax, az, bx, bz, width] of spans) {
      const dx = bx - ax,
        dz = bz - az,
        len = Math.hypot(dx, dz),
        u = ((x - ax) * dx + (z - az) * dz) / len;
      const cross = Math.abs((x - ax) * dz - (z - az) * dx) / len;
      const channel =
        clamp((len * 0.46 - Math.abs(u - len * 0.5)) / (len * 0.27), 0, 1) *
        clamp((width * 3.15 - cross) / (width * 1.37), 0, 1);
      const invert = river - 0.52 + 0.06 * Math.cos(2 * z - x);
      if (height > invert) height += channel * (invert - height);
    }
    // Dredged ferry berth: the landward corners of the timber landing
    // remain clear even where the natural riverbank would silt them in.
    const berthRadius = Math.hypot((x - 10.09) / 1.76, (z - 6.05) / 1.57);
    const dredged = clamp((1.36 - berthRadius) / 0.57, 0, 1);
    const quayBed = river - 0.62;
    if (height > quayBed) height += (quayBed - height) * dredged;
    return height;
  }
  const bed = basin(T, surface);
  group.add(bed);
  const stone = new Model(T, 81047);
  const outlets = surfaceStreets(stone, layout);
  for (const [ax, az, bx, bz, w, n] of spans) arch(stone, ax, az, bx, bz, w, topOfQuay, n);
  for (const [x, z, y, w, d, yaw] of [
    [-8.71, -2.302, -0.005, 2.85, 1.04, 1.42],
    [-8.31, 3.49, -0.008, 2.19, 1.19, 0.64],
    [-8.54, 4.36, -0.038, 1.93, 1.27, -0.3],
    [8.54, 2.9, -0.032, 1.55, 2.11, -0.1],
    [4.29, -6.5, -0.034, 1.23, 0.97, -0.18]
  ])
    dais(stone, x, z, y, w, d, yaw);
  houseFeet(stone, -9.71, 3.098, 3.16, 1.15, 0.98);
  houseFeet(stone, 4.827, -7.99, 2.87, -0.18, 0.77);
  stairFlight(stone, -8.39, 4.25, -8.57, 3.54, -0.03, 0.97, 0.8, 6);
  stairFlight(stone, 4.25, -6.52, 4.58, -7.19, -0.026, 0.76, 0.77, 6);
  stairFlight(stone, 8.32, -1.43, 7.28, -1.53, -0.44, -0.044, 0.84, 4);
  slopingStair(stone, T);
  for (const [x, z] of outlets) drain(stone, x, z, surface);
  group.add(stone.finish('三渠街基、通水拱巷與樓座'));
  const cloud = cloudSteps(
    T,
    layout,
    surface,
    [
      [9.72, 5.49, 8.76, 3.82, 0.75],
      [8.32, -1.43, 7.28, -1.53, 0.65],
      [8.24, -1.37, 9.2, -5.09, 0.8],
      ...outlets.map(([x, z]) => [x, z, x, z + 2.6, 0.42])
    ],
    [
      [-5.15, -0.42, 5.75, 1.05, 0.52],
      [-4.45, -0.5, 5.15, 0.75, 0.42],
      [-5.85, -0.62, 6.1, 0.8, 0.45],
      [-5.3, -1.05, 6.0, 0.7, 0.4],
      [-2.5, -0.25, -7.95, 0.8, 0.42],
      [-1.95, -0.4, -8.35, 0.6, 0.36],
      [-2.7, -0.7, -8.3, 0.55, 0.34]
    ]
  );
  group.add(cloud);
  const life = new Model(T, 81339);
  plumWineShop(life);
  lowerLanding(life, surface);
  group.add(life.finish('雙色店幡、茶肆與烏篷渡船'));
  // The two storeyed shop-houses stand on the paired piers above.
  const houses = new Model(T, 81723);
  houses.frame(-9.71, 0.98, 3.098, 1.15, 1, () => streetHouse(houses, 3.16, 1.61, 'red'));
  houses.frame(4.827, 0.77, -7.99, -0.18, 1, () => streetHouse(houses, 2.87, 1.57, 'green'));
  // A festoon of paper lanterns hangs from the street gate to the red house.
  festoon(houses, [-8.86, 2.62, -1.2], [-8.36, 2.32, 1.92], 0.42, 5);
  group.add(houses.finish('兩坊重樓', { occluder: true }));
  // Two stretches of street have broken loose and drift beside the ward.
  const adrift = new Model(T, 81877);
  adrift.frame(-4.7, 0.35, 5.3, 0.8, 1, () => brokenStreet(adrift, 2.8, 1.3), 0.06, -0.05);
  adrift.frame(
    -2.2,
    0.6,
    -7.75,
    -1.27,
    1,
    () => brokenStreet(adrift, 1.9, 1.0, false),
    -0.05,
    0.07
  );
  group.add(adrift.finish('斷街浮段', { occluder: true }));
  const stall = new Model(T, 81533);
  ticketCounter(stall, surface);
  group.add(stall.finish('西北坊船資攤', { occluder: true }));
  return group;
}

export { landform8 };
