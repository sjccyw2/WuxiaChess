import { Model } from '../scenery-kit.js';

// 聽雪棧 only: wind-trained pines rooted in cracks of the granite spurs. Each
// grows from a nest of boulders, flares into roots where it meets the rock and
// carries flat pads of dark needles with snow loaded on their upper faces.

const bark = 0x4b3b31,
  barkLight = 0x6a5646,
  needles = [0x34513f, 0x3e5d48, 0x48684f],
  needleEdge = 0x4f6e52,
  snow = 0xf0f4f4,
  snowShade = 0xd3dfe4;

// Faces listed clockwise seen from outside, flipped for the kit's normals.
function face(m, points, col) {
  const each = Array.isArray(col) && Array.isArray(col[0]);
  m.face([...points].reverse(), each ? [...col].reverse() : col);
}

// One pad of needles: a dark, slightly domed underside and a lighter rim, with
// a cap of snow that sits on top and stops short of the edge.
function pad(m, x, y, z, rx, rz, yaw) {
  const n = 9,
    rim = [],
    under = [],
    cap = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + m.rng.range(-0.15, 0.15),
      k = m.rng.range(0.82, 1.12);
    const u = Math.cos(a) * rx * k,
      v = Math.sin(a) * rz * k;
    const px = u * Math.cos(yaw) - v * Math.sin(yaw),
      pz = u * Math.sin(yaw) + v * Math.cos(yaw);
    const droop = -0.05 * (rx + rz) * m.rng.range(0.6, 1.2);
    rim.push([x + px, y + droop, z + pz]);
    under.push([x + px * 0.62, y - 0.26 * rx, z + pz * 0.62]);
    cap.push([x + px * 0.5, y + 0.07 * rx + droop * 0.3, z + pz * 0.5]);
  }
  const low = [x, y - 0.36 * rx, z],
    crown = [x, y + 0.17 * rx, z];
  const tone = m.rng.pick(needles);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([low, under[i], under[j]], tone);
    m.face(
      [under[i], rim[i], rim[j], under[j]],
      [m.rgb(tone), m.rgb(needleEdge), m.rgb(needleEdge), m.rgb(tone)]
    );
    // The needles that show between the rim and the snow.
    face(
      m,
      [rim[i], rim[j], cap[j], cap[i]],
      [m.rgb(needleEdge), m.rgb(needleEdge), m.rgb(snowShade), m.rgb(snowShade)]
    );
    face(m, [cap[i], cap[j], crown], [m.rgb(snowShade), m.rgb(snowShade), m.rgb(snow)]);
    // Tufts of needles hang out past the rim, so the pad has a ragged edge.
    const r = rim[i],
      s = rim[j],
      mid = [(r[0] + s[0]) / 2, (r[1] + s[1]) / 2, (r[2] + s[2]) / 2];
    for (const p of [r, mid]) {
      const ox = p[0] - x,
        oz = p[2] - z;
      m.face(
        [
          [p[0] - oz * 0.12, p[1] + 0.01, p[2] + ox * 0.12],
          [p[0] + ox * 0.22, p[1] - 0.09 * rx, p[2] + oz * 0.22],
          [p[0] + oz * 0.12, p[1] + 0.01, p[2] - ox * 0.12]
        ],
        [m.rgb(needleEdge), m.rgb(tone), m.rgb(needleEdge)]
      );
    }
  }
}

// A granite boulder with snow settled on top, bedded below the ground line.
function boulder(m, x, y, z, r, h) {
  m.rock(
    x,
    y - h * 0.35,
    z,
    r,
    h,
    r * m.rng.range(0.7, 0.95),
    0x4f585d,
    0xe8eeef,
    8,
    m.rng.range(0, 6)
  );
}

function pine(m, k, lean) {
  // The nest of rock the roots have split.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + m.rng.range(-0.4, 0.4),
      d = m.rng.range(0.35, 0.6) * k;
    boulder(
      m,
      Math.cos(a) * d,
      0,
      Math.sin(a) * d,
      m.rng.range(0.18, 0.32) * k,
      m.rng.range(0.22, 0.42) * k
    );
  }
  m.frame(0, 0, 0, 0, k, () => {
    // A trunk that leans out over the drop and turns back toward the light.
    const trunk = [
      [0, -0.2, 0],
      [0.02, 0.35, 0],
      [0.1 * lean, 0.85, 0.04],
      [0.26 * lean, 1.3, -0.02],
      [0.3 * lean, 1.8, -0.08],
      [0.22 * lean, 2.25, 0],
      [0.28 * lean, 2.6, 0.04]
    ];
    const radii = [0.21, 0.165, 0.13, 0.1, 0.075, 0.05, 0.02];
    for (let j = 0; j < trunk.length - 1; j++)
      m.tube(trunk[j], trunk[j + 1], radii[j], radii[j + 1], j % 2 ? bark : barkLight, 8);
    // Root flare: buttresses that run down and out into the cracks.
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2 + m.rng.range(-0.3, 0.3),
        reach = m.rng.range(0.38, 0.6);
      const mid = [Math.cos(a) * reach * 0.45, 0.02, Math.sin(a) * reach * 0.45];
      m.line([[0, 0.32, 0], mid], 0.075, bark, 6);
      m.tube(mid, [Math.cos(a) * reach, -0.14, Math.sin(a) * reach], 0.07, 0.018, bark, 6);
    }
    // Tiers of branches, long and level low down, short near the top.
    for (let j = 0; j < 12; j++) {
      const t = j / 11,
        a = j * 2.4 + m.rng.range(-0.3, 0.3);
      const from = trunk[2 + Math.min(4, Math.floor(t * 4.5))];
      const len = (1.15 - 0.62 * t) * m.rng.range(0.85, 1.1);
      const elbow = [
        from[0] + Math.cos(a) * len * 0.5,
        from[1] + 0.12 + 0.04 * j,
        from[2] + Math.sin(a) * len * 0.5
      ];
      const tip = [from[0] + Math.cos(a) * len, elbow[1] + 0.1, from[2] + Math.sin(a) * len];
      m.tube(from, elbow, 0.06 - 0.005 * j, 0.035, bark, 6);
      m.tube(elbow, tip, 0.035, 0.012, bark, 5);
      const size = (0.58 - 0.26 * t) * m.rng.range(0.85, 1.15);
      pad(m, tip[0], tip[1] + 0.05, tip[2], size, size * 0.8, a);
      pad(m, elbow[0], elbow[1] + 0.08, elbow[2], size * 0.72, size * 0.6, a + 1);
      const side = a + (j % 2 ? 0.7 : -0.7);
      pad(
        m,
        (elbow[0] + tip[0]) / 2 + Math.cos(side) * size * 0.45,
        elbow[1] + 0.02,
        (elbow[2] + tip[2]) / 2 + Math.sin(side) * size * 0.45,
        size * 0.6,
        size * 0.5,
        side
      );
    }
    const top = trunk.at(-1);
    pad(m, top[0], top[1] + 0.06, top[2], 0.36, 0.3, 0.4);
  });
}

// Each pine is its own cutaway object, so only the one in the way fades.
function pines3(T, surface) {
  const groups = [];
  for (const [name, x, z, k, lean, seed] of [
    ['雪脊古松', 3.51, -9.14, 1.5, 1, 39601],
    ['霜崖雙松', -7.02, 3.95, 1.35, -1, 39613],
    ['棧外小松', 7.15, -5.45, 0.85, 0.7, 39627]
  ]) {
    const m = new Model(T, seed);
    pine(m, k, lean);
    const g = m.finish(name, { occluder: true });
    g.position.set(x, surface(x, z) - 0.05, z);
    g.rotation.y = m.rng.range(0, Math.PI * 2);
    groups.push(g);
  }
  return groups;
}

export { pines3 };
