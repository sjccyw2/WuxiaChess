import { circle } from '../scenery-kit.js';

// Shared measures of 寒玉石室 for the cave's own modules: the plan of the cave
// wall and the true run of its bedded face, the lamps and jade that the light
// field paints into nearby rock, and a dripstone cone with a little more
// shape than a plain spire. Nothing here imports the cave modules, so they
// may all import it.

const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
function smooth(a, b, v) {
  const q = clamp((v - a) / (b - a), 0, 1);
  return q * q * (3 - 2 * q);
}
// Hex colours to the linear values three's vertex colours expect.
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255].map((v) => linear(v / 255));
const blend = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const waterLine = -1.0;
// The default camera looks in from the south-east.
const toViewer = [0.636, 0.772];

// Plan radius of the cave wall at its foot, by bearing.
function wallRadius(a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  const k = 1 / (Math.abs(c) ** 3 + Math.abs(s) ** 3) ** (1 / 3);
  return (
    12.5 * k +
    0.9 * Math.sin(3 * a + 1.1) +
    0.55 * Math.sin(7 * a + 0.3) +
    0.3 * Math.sin(13 * a + 2.2)
  );
}
// Height of the wall at a bearing: tall at the back, low toward the viewer.
function wallHeight(a) {
  const facing = Math.cos(a) * toViewer[0] + Math.sin(a) * toViewer[1];
  const back = smooth(-0.35, 0.85, -facing);
  return 6.2 + 4.8 * back + 1.1 * Math.sin(5 * a + 0.4) + 0.5 * Math.sin(11 * a);
}
// Radius of the wall's face at bearing a and height y, following the same
// courses as caveWall in cave-7.js (less its few centimetres of jitter).
function wallFace(a, y) {
  const R = wallRadius(a),
    H = wallHeight(a),
    rows = 11,
    foot = waterLine + 0.36;
  if (y <= foot) {
    if (y <= waterLine + 0.06) return R - 1.06 - (waterLine + 0.06 - y) * 0.95;
    if (y <= waterLine + 0.3) return R - 1.06 + ((y - waterLine - 0.06) / 0.24) * 0.11;
    return R - 0.95 + ((y - waterLine - 0.3) / 0.06) * 0.33;
  }
  const course = (k) => {
    const t = k / rows,
      yy = foot + t * (H - foot);
    if (k === 0) return [foot, R - 0.62];
    const ledge = k % 2 ? 0.06 : -0.04;
    const bulge = 0.3 * Math.sin(a * 7 + t * 1.2) + 0.08 * Math.sin(a * 17 - t * 1.6);
    return [yy, R - 0.55 + bulge + ledge - 0.36 * (yy - foot)];
  };
  const k = clamp(Math.floor(((y - foot) / (H - foot)) * rows), 0, rows - 1);
  const [y0, r0] = course(k),
    [y1, r1] = course(k + 1);
  return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
}
// A point standing `off` in front of the wall face, and the face's inward normal.
function onWall(a, y, off = 0) {
  const r = wallFace(a, y) - off,
    ca = Math.cos(a),
    sa = Math.sin(a);
  const n = Math.hypot(1, 0.36);
  return { p: [ca * r, y, sa * r], n: [-ca / n, -0.36 / n, -sa / n], in: [-ca, 0, -sa] };
}

// Lamps and jade added round the cave by its dressing modules, given to the
// light field of cave-7.js so that their glow is painted into the rock.
// x, y, z, reach, strength, colour ('jade' or 'warm').
const altarLights = [
  [-8.11, 0.75, -8.19, 1.2, 0.3, 'warm'],
  [-8.99, 0.75, -7.31, 1.2, 0.3, 'warm']
];
const bedLight = [6.4, 0.35, -6.65, 1.7, 0.34, 'jade'];
const passageLights = [
  // In the mouths of the side passages and the lower gallery (wall-7.js).
  [-2.05, 'jade'],
  [-0.6, 'jade'],
  [2.72, 'jade'],
  [2.2, 'jade'],
  [-1.62, 'jade']
];
const extraLights = [
  ...altarLights,
  bedLight,
  ...passageLights.map(([a, col]) => {
    const { p } = onWall(a, a === -1.62 ? 1.5 : -0.3, 0.7);
    return [p[0], p[1], p[2], 1.6, 0.34, col];
  })
];

// A dripstone cone with growth rings, a slight sway and a drop at its tip;
// length < 0 hangs from the base point. Colours are linear [r, g, b].
function drip(m, base, length, radius, col, tip, n = 6, sway = 0) {
  const steps = 6,
    dir = Math.sign(length),
    L = Math.abs(length),
    r = m.rng,
    phase = r.range(0, circle);
  let prev;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const ring = 1 + (k % 2 ? 0.1 : -0.04) + (k === steps - 1 ? 0.18 : 0);
    const rr = radius * (1 - t) ** 0.9 * ring + 0.003;
    const c = col.map((v, i) => v + (tip[i] - v) * t ** 0.8);
    const pts = [];
    for (let j = 0; j < n; j++) {
      const a = (j * circle) / n + phase,
        q = 1 + 0.12 * Math.sin(j * 2.1 + k);
      pts.push([
        base[0] + Math.cos(a) * rr * q + sway * t * t * L,
        base[1] + dir * t * L,
        base[2] + Math.sin(a) * rr * q + sway * 0.5 * t * t * L
      ]);
    }
    if (prev)
      for (let j = 0; j < n; j++) {
        const q = (j + 1) % n;
        if (dir > 0) m.face([prev.pts[j], pts[j], pts[q], prev.pts[q]], [prev.c, c, c, prev.c]);
        else m.face([prev.pts[q], pts[q], pts[j], prev.pts[j]], [prev.c, c, c, prev.c]);
      }
    prev = { pts, c };
  }
}

export {
  rgb,
  blend,
  clamp,
  smooth,
  waterLine,
  toViewer,
  wallRadius,
  wallHeight,
  wallFace,
  onWall,
  altarLights,
  bedLight,
  passageLights,
  extraLights,
  drip
};
