// Reed beds of 蘆花汀. Common reed grows in stands: tufts of tall flowering
// stems, shorter and sparser toward the edge, with last year's dead straw at
// the foot, a few stems snapped by the wind and every plume combed the same
// way by it.

// The prevailing wind, along which plumes droop and stems bow.
const wind = [-0.35, 0.94];

const greens = [0x7d8754, 0x8a8d55, 0x73804f, 0x939057];
const straws = [0xb4a26d, 0xa8955f, 0xc0b07c];
const plumes = [0xab9782, 0xb5a38b, 0xa18c78, 0xbcab92];
const lights = [0xcbbea4, 0xc4b69b, 0xd2c6ad];

// A flat ribbon between two points, narrowing from `w0` to `w1`. Thin stems
// cost two triangles a segment this way and still catch the light.
function ribbon(m, a, b, w0, w1, col, light = col, twist = 0) {
  const dx = b[0] - a[0],
    dz = b[2] - a[2],
    l = Math.hypot(dx, dz);
  // Turn the flat side across the stem's lean, or across the wind when upright.
  const ux = l > 0.01 ? -dz / l : -wind[1],
    uz = l > 0.01 ? dx / l : wind[0];
  const nx = ux * Math.cos(twist) - uz * Math.sin(twist),
    nz = uz * Math.cos(twist) + ux * Math.sin(twist);
  m.face(
    [
      [a[0] - nx * w0, a[1], a[2] - nz * w0],
      [a[0] + nx * w0, a[1], a[2] + nz * w0],
      [b[0] + nx * w1, b[1], b[2] + nz * w1],
      [b[0] - nx * w1, b[1], b[2] - nz * w1]
    ],
    [m.rgb(col), m.rgb(col), m.rgb(light), m.rgb(light)]
  );
}

// One stem with a strap leaf and, when flowering, a drooping plume.
function reed(m, x, y, z, h, { dead = false, broken = false, plume = true, sway = 1 } = {}) {
  const r = m.rng;
  const bow = h * r.range(0.06, 0.3) * sway,
    side = r.range(-0.4, 0.4);
  const wx = wind[0] + side * wind[1],
    wz = wind[1] - side * wind[0];
  const stem = dead ? r.pick(straws) : r.pick(greens),
    top = dead ? 0xcdbf90 : m.mix(stem, 0xbcae78, 0.55);
  const base = [x, y, z],
    mid = [x + wx * bow * 0.28, y + h * 0.56, z + wz * bow * 0.28];
  const thick = 0.008 + h * 0.011,
    twist = r.range(-0.9, 0.9);
  if (broken) {
    // Snapped at the knee; the top hangs down beside the stem.
    const tip = [mid[0] + wx * h * 0.3, mid[1] - h * 0.2, mid[2] + wz * h * 0.3];
    ribbon(m, base, mid, thick, thick * 0.8, stem, top, twist);
    ribbon(m, mid, tip, thick * 0.8, thick * 0.3, 0xb4a26d, 0xcbbd8e, twist);
    return;
  }
  const tip = [x + wx * bow, y + h, z + wz * bow];
  ribbon(m, base, mid, thick, thick * 0.7, stem, top, twist);
  ribbon(m, mid, tip, thick * 0.7, thick * 0.25, top, top, twist);
  // A strap leaf leaves the stem and arches over, downwind.
  if (r.next() < 0.75) {
    const t = r.range(0.3, 0.6),
      a = [x + wx * bow * t * t, y + h * t, z + wz * bow * t * t];
    const turn = r.range(-1.3, 1.3),
      dx = wx * Math.cos(turn) - wz * Math.sin(turn),
      dz = wz * Math.cos(turn) + wx * Math.sin(turn);
    const reach = h * r.range(0.22, 0.36);
    m.leaf(
      a,
      [a[0] + dx * reach, a[1] + h * r.range(-0.08, 0.06), a[2] + dz * reach],
      h * 0.03,
      dead ? r.pick(straws) : stem,
      dead ? 0xc8b98a : 0xa9a46c,
      h * 0.06
    );
  }
  if (!plume) return;
  // The panicle: a soft feather that leans out and droops with the wind.
  const len = h * r.range(0.26, 0.36),
    tone = r.pick(plumes),
    light = r.pick(lights);
  for (const turn of [-0.22, 0.22]) {
    const dx = wx * Math.cos(turn) - wz * Math.sin(turn),
      dz = wz * Math.cos(turn) + wx * Math.sin(turn);
    m.leaf(
      [tip[0] - wx * len * 0.1, tip[1] - len * 0.04, tip[2] - wz * len * 0.1],
      [tip[0] + dx * len * 0.62, tip[1] - len * (0.42 + turn * 0.3), tip[2] + dz * len * 0.62],
      len * 0.1,
      tone,
      light,
      len * 0.2
    );
  }
}

// A tussock of reed leaves at the base of a stand: a fan of broad blades,
// one triangle each, that gives the bed its body.
function tussock(m, x, y, z, h) {
  const r = m.rng,
    n = 6;
  const spin = r.range(0, Math.PI * 2);
  for (let k = 0; k < n; k++) {
    const a = spin + (k * Math.PI * 2) / n + r.range(-0.3, 0.3),
      l = h * r.range(0.7, 1.15),
      out = l * r.range(0.25, 0.5);
    const w = 0.025 + h * 0.06;
    const col = r.pick(greens);
    m.face(
      [
        [x - Math.sin(a) * w, y, z + Math.cos(a) * w],
        [x + Math.sin(a) * w, y, z - Math.cos(a) * w],
        [
          x + Math.cos(a) * out + wind[0] * l * 0.25,
          y + l,
          z + Math.sin(a) * out + wind[1] * l * 0.25
        ]
      ],
      [m.rgb(col), m.rgb(col), m.mix(col, k % 3 ? 0xa9a66c : 0xc2b27e, 0.6)]
    );
  }
}

// A stand: `ground(x, z)` gives the height the stems spring from, or null where
// nothing may grow (a walkable tile, deep water, a building).
function reedStand(m, x, z, radius, height, count, ground, { stretch = 1, angle = 0 } = {}) {
  const r = m.rng;
  const ca = Math.cos(angle),
    sa = Math.sin(angle);
  // Reed spreads by runners, so stems come up in tufts rather than evenly.
  let tuft = null;
  for (let i = 0; i < count; i++) {
    if (!tuft || r.next() < 0.22) {
      const d = Math.sqrt(r.next()),
        a = r.range(0, Math.PI * 2);
      tuft = {
        d,
        u: Math.cos(a) * d * radius * stretch,
        v: Math.sin(a) * d * radius,
        k: r.range(0.8, 1.15)
      };
      const px = x + tuft.u * ca - tuft.v * sa,
        pz = z + tuft.u * sa + tuft.v * ca,
        y = ground(px, pz);
      if (y !== null) tussock(m, px, y - 0.03, pz, height * tuft.k * r.range(0.35, 0.55));
    }
    const u = tuft.u + r.range(-0.1, 0.1),
      v = tuft.v + r.range(-0.1, 0.1);
    const px = x + u * ca - v * sa,
      pz = z + u * sa + v * ca;
    const y = ground(px, pz);
    if (y === null) continue;
    const h = height * tuft.k * (1 - 0.45 * tuft.d * tuft.d) * r.range(0.72, 1.1);
    const roll = r.next();
    reed(m, px, y - 0.03, pz, h, {
      dead: roll < 0.14,
      broken: roll > 0.95,
      plume: roll > 0.25 && h > 0.3
    });
  }
  // Last year's straw lies flattened at the foot of the stand.
  for (let i = 0; i < count * 0.15; i++) {
    const a = r.range(0, Math.PI * 2),
      d = r.range(0.4, 1.05) * radius;
    const px = x + Math.cos(a) * d * stretch * ca - Math.sin(a) * d * sa,
      pz = z + Math.cos(a) * d * stretch * sa + Math.sin(a) * d * ca;
    const y = ground(px, pz);
    if (y === null) continue;
    const l = r.range(0.15, 0.32),
      t = r.range(0, Math.PI * 2);
    ribbon(
      m,
      [px, y + 0.012, pz],
      [px + Math.cos(t) * l, y + 0.02, pz + Math.sin(t) * l],
      0.012,
      0.004,
      r.pick(straws),
      0xcbbd8e
    );
  }
}

// A low clump of sedge for the beaches and the board's margins.
function sedge(m, x, y, z, h, tone = 0x7c8a5a) {
  const r = m.rng;
  for (let k = 0; k < 4; k++) {
    const a = k * 1.57 + r.range(-0.4, 0.4),
      l = h * r.range(0.7, 1.1);
    ribbon(
      m,
      [x, y - 0.01, z],
      [
        x + Math.cos(a) * l * 0.45 + wind[0] * l * 0.2,
        y + l,
        z + Math.sin(a) * l * 0.45 + wind[1] * l * 0.2
      ],
      0.02,
      0.002,
      tone,
      0xa0a874
    );
  }
}

export { wind, ribbon, reed, tussock, reedStand, sedge };
