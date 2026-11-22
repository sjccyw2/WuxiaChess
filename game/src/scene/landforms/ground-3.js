// 聽雪棧 only: what the dressing modules share. Where the ground is (the massif,
// or the glacial valley floor below it), how steep it is there, how the snow is
// lit, and which places the landmarks have already taken.

// A cheap repeatable hash, 0 to 1.
function hash(a, b = 0, c = 0) {
  const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// The valley floor of landform-3.js (valleyFloor), as a height field. Its rings
// are polar, so the formula is read back at the polar position of a point.
function valleyHeight(x, z) {
  const a = Math.atan2(z / 1.08, x),
    warp = 1 + 0.068 * Math.cos(a * 3.0) + 0.038 * Math.sin(a * 5.0);
  const radius = Math.hypot(x, z / 1.08) / warp;
  const flow = Math.abs(x + 3.1 * Math.sin(z * 0.14) + 1.8 * Math.cos(z * 0.25));
  const eroded = 0.21 * Math.exp(-(flow * flow) / 6.5);
  const braid = Math.sin(a * 4.7 + radius * 0.54) * 0.12 + Math.cos(a * 7.1 - radius * 0.64) * 0.09;
  return -7.22 + braid - eroded - Math.max(0, radius - 31) * 0.15;
}

// The visible ground: the massif where it stands above the valley floor.
function groundOf(surface) {
  return (x, z) => Math.max(surface(x, z), valleyHeight(x, z) - 0.04);
}

// Uphill gradient of a height field at a point.
function slopeOf(height, x, z, e = 0.12) {
  const gx = (height(x + e, z) - height(x - e, z)) / (2 * e),
    gz = (height(x, z + e) - height(x, z - e)) / (2 * e);
  return { gx, gz, steep: Math.hypot(gx, gz) };
}

// Footprints of what maze-landmarks.js, landform-3.js, pines-3.js and
// crags-3.js already stand on: [x0, z0, x1, z1, radius] segments in world space.
const taken = [
  [-2.38, 8.49, -2.38, 8.49, 1.25], // 南麓報雪亭 on its crag
  [-7.45, -9.55, -2.6, -10.15, 1.05], // 覆雪懸棧
  [-7.45, 3.79, -6.87, -0.05, 0.95], // 峭壁木棧
  [-7.74, -8.92, -7.74, -8.92, 1.0],
  [-1.96, -9.57, -0.45, -10.81, 1.0],
  [-7.47, 4.04, -7.47, 4.04, 0.85],
  [-6.82, -0.36, -6.74, -1.13, 0.85],
  [3.51, -9.14, 3.51, -9.14, 1.45], // 雪脊古松
  [-7.02, 3.95, -7.02, 3.95, 1.3], // 霜崖雙松
  [7.15, -5.45, 7.15, -5.45, 0.95], // 棧外小松
  [5.73, -3.67, 8.97, -4.71, 0.85] // 冰瀑與岩壁
];

function segmentDistance(x, z, x0, z0, x1, z1) {
  const dx = x1 - x0,
    dz = z1 - z0,
    l = dx * dx + dz * dz;
  const t = l ? Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / l)) : 0;
  return Math.hypot(x - x0 - t * dx, z - z0 - t * dz);
}

// True when a thing of the given radius stands clear of every landmark.
function clearOf(x, z, radius = 0) {
  return taken.every(([x0, z0, x1, z1, r]) => segmentDistance(x, z, x0, z0, x1, z1) > r + radius);
}

// Snow is warm where the low western sun reaches it and blue-grey in the lee.
const sun = [-0.53, 0.82, 0.32];
function snowLight(m, nx, ny, nz, shade = 0) {
  const l = Math.hypot(nx, ny, nz) || 1,
    lit = Math.max(0, (nx * sun[0] + ny * sun[1] + nz * sun[2]) / l);
  const tone = m.mix(0xc3d1dc, 0xf7f4ec, Math.min(1, lit * 1.15));
  return m.mix(tone, 0x8fa3b3, shade);
}

// A thin cone with no base: icicles, grass blades, broken twigs.
function spike(m, top, length, radius, col, n = 4, tip = col, lean = [0, 0]) {
  const end = [top[0] + lean[0], top[1] - length, top[2] + lean[1]];
  const ring = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + top[0] * 3.1;
    ring.push([top[0] + Math.cos(a) * radius, top[1], top[2] + Math.sin(a) * radius]);
  }
  const base = m.rgb(col),
    point = m.rgb(tip);
  for (let i = 0; i < n; i++) m.face([ring[i], end, ring[(i + 1) % n]], [base, point, base]);
}

export { hash, valleyHeight, groundOf, slopeOf, clearOf, snowLight, spike };
