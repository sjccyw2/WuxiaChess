// 俠客島's shared measures, for the board's own modules: the plan of the cave hall (where its
// wall stands, how tall it is, where the sea comes in), the lie of the floor round the board,
// the light that the sea openings and the lamps paint into the rock, and the finishing of the
// cave's shell so that, like 寒玉石室's, it is only ever seen from inside. Nothing here imports
// the other *-19.js modules, so they may all import it.
import { circle } from '../scenery-kit.js';
import { mapLayout } from '../../data/terrain.js';
import { hash, noise, fbm } from './landform-10.js';

// The sea's level in the cave; the stage water of 俠客島 (maze-atmosphere.js) lies at it.
const SEA = -0.25;
// The board's top, where a fighter stands.
const TOP = 0.04;
// The cave is measured from a point a little south of the board's middle.
const ZC = 0.3;

const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
function smooth(a, b, v) {
  const q = clamp((v - a) / (b - a), 0, 1);
  return q * q * (3 - 2 * q);
}
const lerp = (a, b, t) => a + (b - a) * t;
// Hex colours to the linear values three's vertex colours expect.
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255].map((v) => linear(v / 255));
const blend = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const scale = (c, k) => c.map((v) => v * k);

// The board: its size, its tiles, and a test for whether a point lies on it.
const layout = mapLayout(19);
const CX = (layout.width - 1) / 2,
  CZ = (layout.height - 1) / 2;
const tiles = layout.cells.map((c) => ({ x: c.x - CX, z: c.y - CZ, kind: c.kind }));
const onBoard = (x, z) => layout.mask[Math.floor(z + CZ + 0.5)]?.[Math.floor(x + CX + 0.5)] === '#';
const kindAt = (x, z) => layout.cells.find((c) => c.x === x + CX && c.y === z + CZ)?.kind;
// How far a point lies outside the board's edge (0 on it).
function boardOff(x, z) {
  let best = Infinity;
  for (const t of tiles) {
    const dx = Math.max(Math.abs(x - t.x) - 0.5, 0),
      dz = Math.max(Math.abs(z - t.z) - 0.5, 0);
    const d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
// The carved walls stand on the rock tiles of the north row; the pillars on the others.
const walls = tiles.filter((t) => t.kind === 'rock' && t.z === -CZ).map((t) => t.x);
const pillars = tiles.filter((t) => t.kind === 'rock' && t.z !== -CZ).map((t) => [t.x, t.z]);

// ---------------------------------------------------------------------------
// The plan. A bearing a runs x = cos a, z = sin a (south is +z) round (0, ZC).
function footRadius(a) {
  const c = Math.cos(a),
    s = Math.sin(a),
    rz = s < 0 ? 6.75 : 7.7;
  const k = 1 / ((Math.abs(c) / 8.9) ** 4 + (Math.abs(s) / rz) ** 4) ** 0.25;
  return k + 0.26 * Math.sin(3 * a + 1.1) + 0.17 * Math.sin(7 * a + 0.3) + 0.09 * Math.sin(13 * a + 2.2);
}
// Height of the wall's crown: tallest behind the carved walls, lower round the mouth.
function wallHeight(a) {
  const north = smooth(-0.15, 0.85, -Math.sin(a));
  return 7.4 + 2.4 * north + 0.7 * Math.sin(5 * a + 0.4) + 0.35 * Math.sin(11 * a + 1.3);
}
// The openings of the cave: the two sea arches at the ends of the hall and the great mouth
// on the south. Each is centred on a bearing, `half` metres either side along the wall at its
// foot, with straight cheeks up to `spring` and an arched head up to `crown`.
const openings = [
  { name: 'west', a: Math.PI - 0.02, half: 1.18, spring: 1.15, crown: 3.1 },
  { name: 'east', a: 0.02, half: 1.18, spring: 1.0, crown: 2.85 },
  { name: 'mouth', a: Math.PI / 2, half: 5.0, spring: 2.6, crown: 5.4 }
];
// Arc distance along the wall foot from an opening's centre.
function along(o, a) {
  let d = a - o.a;
  d = ((d + Math.PI) % circle + circle) % circle - Math.PI;
  return d * footRadius(o.a);
}
// Distance inside an opening's outline (positive inside), in metres, for bearing a, height y.
function insideOpening(o, a, y) {
  const u = along(o, a),
    wob = 0.08 * Math.sin(y * 3.1 + o.a * 5) + 0.06 * Math.sin(y * 7.3);
  const w = o.half + wob;
  if (y <= o.spring) return w - Math.abs(u);
  const v = (y - o.spring) / (o.crown - o.spring);
  return w * (1 - Math.hypot(u / w, v));
}
// The nearest point of an opening's outline to (u, y), as [bearing, height].
function onOutline(o, a, y) {
  const u = along(o, a),
    R = footRadius(o.a),
    wob = 0.08 * Math.sin(y * 3.1 + o.a * 5) + 0.06 * Math.sin(y * 7.3),
    w = o.half + wob;
  if (y <= o.spring) return [o.a + (Math.sign(u || 1) * w) / R, y];
  const h = o.crown - o.spring,
    t = Math.atan2((y - o.spring) / h, u / w);
  return [o.a + (w * Math.cos(t)) / R, o.spring + h * Math.sin(t)];
}

// ---------------------------------------------------------------------------
// The floor. The hall's floor lies just under the board's top round it, rises in a rocky
// talus to a rim at the foot of the wall, and outside falls in shelves to the sea. The two
// tide channels run from the arches to the board's shallows, and the mouth slopes down to a
// landing on the south.
const channelZ = 0.5;
function channel(x, z) {
  const ax = Math.abs(x);
  if (ax < 5.6) return 0;
  const w = 1.0 + 0.16 * Math.sin(x * 1.7) + 0.22 * smooth(8.3, 11, ax);
  return smooth(5.6, 6.6, ax) * (1 - smooth(w - 0.35, w + 0.3, Math.abs(z - channelZ - 0.08 * Math.sin(x * 2.3))));
}
// 1 in the mouth's throat, fading out at its sides.
function mouth(x, z) {
  return smooth(4.4, 6.0, z) * (1 - smooth(4.6, 6.2, Math.abs(x)));
}
// The cut stair from the board's south edge down to the landing.
const STAIR = { x0: -0.95, x1: 0.95, z0: 5.5, z1: 7.3, steps: 5, foot: -0.42 };
function floorHeight(x, z) {
  if (onBoard(x, z) && boardOff(x, z) === 0) return -0.12;
  const a = Math.atan2(z - ZC, x),
    R = footRadius(a),
    d = Math.hypot(x, z - ZC);
  const n1 = fbm(x * 0.9 + 3.3, z * 0.9 - 1.1),
    n2 = noise(x * 3.1 - 2.2, z * 3.1 + 4.4);
  const off = boardOff(x, z);
  // The hall floor: nearly flat by the board, a little rougher away from it.
  let y = -0.025 + 0.02 * (n2 - 0.5) + 0.05 * smooth(0.4, 2.2, off) * (n1 - 0.45);
  // The talus and rim at the wall's foot, where no opening cuts it.
  const open = Math.max(channel(x, z), mouth(x, z));
  const rim = (0.42 + 0.5 * n1 + 0.08 * Math.sin(a * 9)) * (1 - open);
  y += rim * smooth(R - 1.35, R - 0.15, d) * smooth(0.15, 0.9, off);
  // Past the wall, the island's flank drops in a short cliff to a wave-cut ledge and the sea.
  const t = d - R + 0.25 * (n2 - 0.5);
  if (t > 0.55) {
    const ledge = SEA + 0.06 + 0.06 * n1;
    let outer;
    if (t < 1.05) outer = lerp(y, ledge, smooth(0.55, 1.05, t));
    else if (t < 1.6 + 0.6 * n1) outer = ledge - 0.04 * (t - 1.05);
    else outer = lerp(ledge, SEA - 1.5, smooth(1.6 + 0.6 * n1, 2.5 + 0.6 * n1, t));
    y = outer;
  }
  // The tide channels, scoured below the sea.
  const ch = channel(x, z);
  if (ch > 0) {
    const bed = SEA - 0.42 - 0.18 * n1 - 0.3 * smooth(8.5, 11.5, Math.abs(x));
    y = lerp(y, bed, ch);
  }
  // The mouth: ledges going down to the sea south of the board.
  const mo = mouth(x, z);
  if (mo > 0) {
    const fall = smooth(5.3, 9.6, z + 0.25 * Math.sin(x * 1.3)),
      ledges = Math.floor(fall * 5) / 5;
    const target = -0.03 - 1.6 * (0.6 * ledges + 0.4 * fall) + 0.06 * (n2 - 0.5);
    y = lerp(y, target, mo);
    // The stair is cut straight; its treads are drawn in tide-19.js on this ground.
    if (x > STAIR.x0 - 0.25 && x < STAIR.x1 + 0.25 && z > STAIR.z0 && z < STAIR.z1 + 0.2) {
      const t = clamp((z - STAIR.z0) / (STAIR.z1 - STAIR.z0), 0, 1);
      y = Math.min(y, lerp(-0.06, STAIR.foot, t) - 0.08);
    }
  }
  return Math.max(y, SEA - 2.2);
}

// ---------------------------------------------------------------------------
// Light painted into the rock: cool daylight where the sea comes in, warm round the lamps,
// and the cave's gloom gathering away from both. `lamps` are [x, y, z] of every flame.
const COOL = rgb(0xcfe7ea),
  WARM = rgb(0xffb466);
const seaLights = [
  [-9.4, 0.9, 0.5, 2.6, 0.75],
  [9.4, 0.9, 0.5, 2.6, 0.7],
  [0, 1.6, 8.6, 5.2, 0.6]
];
// The rock buttresses at the hall's two back corners, each with a lamp niche toward the board.
const buttresses = [
  { x: -7.55, z: -5.05, rx: 1.05, rz: 0.95, h: 7.2, niche: [-6.72, 1.55, -4.5] },
  { x: 7.55, z: -5.05, rx: 1.05, rz: 0.95, h: 7.0, niche: [6.72, 1.55, -4.5] }
];
const alcoveLamps = [-4, -2, 0, 2, 4].map((x) => [x, floorHeight(x, -5.86) + 0.2, -5.86]);
const pillarLamps = pillars.map(([x, z]) => [x, 1.92, z + 0.47]);
const lamps = [...alcoveLamps, ...pillarLamps, ...buttresses.map((b) => b.niche)];
function lightAt(x, y, z, base, gloom = 1) {
  const out = base.slice();
  // The gloom: deeper toward the back wall and up the walls, never on the board itself.
  const back = smooth(-2, -7, z) * 0.22 + smooth(1.5, 9, y) * 0.55,
    away = smooth(1.0, 3.5, boardOff(x, z)) * 0.18;
  const dark = 1 - gloom * Math.min(0.78, back + away);
  for (let i = 0; i < 3; i++) out[i] *= dark;
  for (const [sx, sy, sz, r, k] of seaLights) {
    const d2 = ((x - sx) ** 2 + (y - sy) ** 2 * 0.6 + (z - sz) ** 2) / (r * r);
    if (d2 > 7) continue;
    const w = k * Math.exp(-d2);
    for (let i = 0; i < 3; i++) out[i] += COOL[i] * w * (0.22 + out[i]);
  }
  for (const [lx, ly, lz] of lamps) {
    const d2 = ((x - lx) ** 2 + (y - ly) ** 2 * 0.7 + (z - lz) ** 2) / 1.7;
    if (d2 > 6) continue;
    const w = 0.42 * Math.exp(-d2);
    for (let i = 0; i < 3; i++) out[i] += WARM[i] * w * (0.3 + out[i]);
  }
  return out.map((v) => Math.min(1, v));
}

// ---------------------------------------------------------------------------
// The shell is drawn from inside only. Each face carries the direction it faces into the
// cave (`facing`, given when it is drawn, so that what hangs on a stretch of wall goes with
// it): when the camera stands behind that stretch, the face is folded away in the vertex
// shader. The software renderer draws every face whichever way it turns, so its position
// attribute is a collapsed copy far below the stage; the GPU reads the true shape.
class Shell {
  constructor(m) {
    this.m = m;
    this.facing = [];
  }
  face(points, cols, facing) {
    const m = this.m,
      before = m.parts[0].p.length / 3;
    m.face(points, cols);
    const added = m.parts[0].p.length / 3 - before;
    const c = [0, 0, 0];
    for (const p of points) for (let i = 0; i < 3; i++) c[i] += p[i] / points.length;
    for (let i = 0; i < added; i++) this.facing.push([c, facing]);
  }
}
function fromInside(T, group, shell) {
  const mesh = group.children.find((c) => c.isMesh && c.material.name === 'Maze_Stone_Wood');
  if (!mesh) return;
  const g = mesh.geometry,
    shape = g.attributes.position,
    n = shape.count;
  const centre = new Float32Array(n * 3),
    facing = new Float32Array(n * 3),
    hidden = new Float32Array(n * 3);
  shell.facing.forEach(([c, f], i) => {
    centre.set(c, i * 3);
    facing.set(f, i * 3);
  });
  for (let i = 1; i < hidden.length; i += 3) hidden[i] = -400;
  g.setAttribute('caveShape', shape);
  g.setAttribute('caveCentre', new T.Float32BufferAttribute(centre, 3));
  g.setAttribute('caveFacing', new T.Float32BufferAttribute(facing, 3));
  g.setAttribute('position', new T.Float32BufferAttribute(hidden, 3));
  g.boundingSphere = new T.Sphere(new T.Vector3(0, 3, 0), 30);
  const mat = mesh.material;
  mat.side = T.FrontSide;
  mat.fog = false;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'attribute vec3 caveShape, caveCentre, caveFacing;\n' +
      shader.vertexShader
        .replace('#include <begin_vertex>', 'vec3 transformed = caveShape;')
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
          // The water's mirror looks from below the sea; it judges as the camera above does.
          vec3 caveFrom = cameraPosition;
          if (caveFrom.y < ${SEA.toFixed(3)}) caveFrom.y = ${(2 * SEA).toFixed(3)} - caveFrom.y;
          vec3 caveEye = normalize(caveFrom - (modelMatrix * vec4(caveCentre, 1.)).xyz);
          vec3 caveTurn = normalize(mat3(modelMatrix) * caveFacing);
          if (dot(caveFacing, caveFacing) > .5 && dot(caveTurn, caveEye) < .16)
            gl_Position = vec4(2., 2., 2., 1.);`
        );
  };
}

export {
  SEA,
  TOP,
  ZC,
  CX,
  CZ,
  clamp,
  smooth,
  lerp,
  rgb,
  blend,
  scale,
  hash,
  noise,
  fbm,
  layout,
  tiles,
  onBoard,
  kindAt,
  boardOff,
  walls,
  pillars,
  footRadius,
  wallHeight,
  openings,
  along,
  insideOpening,
  onOutline,
  channel,
  mouth,
  channelZ,
  STAIR,
  floorHeight,
  buttresses,
  alcoveLamps,
  pillarLamps,
  lamps,
  lightAt,
  Shell,
  fromInside
};
