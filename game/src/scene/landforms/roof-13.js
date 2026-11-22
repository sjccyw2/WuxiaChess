// 西夏夜苑's roofs, built the way a palace roof is: rows of half-round tiles over dark pan tiles,
// a round eave-end tile (瓦當) and a pointed drip tile (滴水) at the foot of every row, two tiers
// of rafter ends under the painted fascia, hip ridges that curl up past the corners with a file
// of little ridge beasts behind a gilt immortal, and a main ridge closed by dragon-headed ends. The
// layered bracket sets (斗拱) that carry the hall's eaves are here too.
const up = [0, 1, 0];
const glaze = [0x111e23, 0x1b3236, 0x30544f]; // green-glazed tile: shadow, body, lit edge
const ridgeTone = 0x1b2e31;
const gilt = 0xcfa85c;
const lacquer = 0xa23c2c;
const lacquerDark = 0x6a2722;
const plaster = 0x9a958f;
const teal = 0x2c6168;
const azure = 0x2b4f7a; // 青綠彩畫: the blue of the painted brackets
const paint = 0x3f7f6f; // and their green

function put(m, pts, col, hint = up) {
  const [a, b, c] = pts,
    u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) pts = [...pts].reverse();
  m.face(pts, col);
}

// A tiled roof in its own frame, ridge along x, eaves w by d at height `eave`. `hip` is how
// far the ridge is shorter than the eave (1 makes a pyramid, 0 with `gable` a plain gable);
// the corners curl up by `lift`. `rows` is how finely the slope is cut along its curve;
// `rafters: false` leaves off the rafter ends, `beasts` is how many ridge beasts ride a hip.
function tiledRoof(m, w, d, eave, rise, options = {}) {
  const {
    hip = d / w,
    lift = 0.3,
    tile = 0.26,
    tones = glaze,
    gable = false,
    rows = 5,
    rafters = true,
    beasts = 3
  } = options;
  const [dark, mid, hi] = tones,
    pan = m.mix(dark, mid, 0.45),
    lit = m.mix(hi, 0xb7c7b0, 0.12);
  const prof = (t) => rise * (0.2 * t + 0.8 * t * t);
  const curl = (s, t) => lift * Math.pow(Math.abs(s), 3.2) * (1 - t) * (1 - t);
  const slope = (side) => (s, t) => [
    s * (w / 2) * (1 - hip * t),
    eave + prof(t) + curl(s, t),
    side * (d / 2) * (1 - t)
  ];
  const end = (side) => (s, t) => [
    side * (w / 2) * (1 - hip * t),
    eave + prof(t) + curl(s, t),
    s * (d / 2) * (1 - t)
  ];
  const same = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-5;
  // One slope: dark pan tiles, a half-round row over every seam, the eave tiles at their feet,
  // a painted fascia under the eave and the rafter ends below it.
  function sheet(at, n, across, out, narrow) {
    const [ex, ez] = across;
    for (let i = 0; i < n; i++) {
      const s0 = -1 + (2 * i) / n,
        s1 = -1 + (2 * (i + 1)) / n;
      for (let k = 0; k < rows; k++) {
        const t0 = k / rows,
          t1 = (k + 1) / rows,
          pts = [at(s0, t0), at(s1, t0), at(s1, t1), at(s0, t1)];
        if (same(pts[2], pts[3])) pts.pop();
        put(m, pts, m.mix(pan, mid, ((i * 5 + k * 3) % 7) * 0.05));
      }
      const a = at(s0, 0),
        b = at(s1, 0),
        drop = (p, h, inset) => [p[0] - out[0] * inset, p[1] - h, p[2] - out[2] * inset];
      put(m, [a, b, drop(b, 0.055, 0), drop(a, 0.055, 0)], hi, out);
      put(
        m,
        [drop(a, 0.055, 0), drop(b, 0.055, 0), drop(b, 0.15, 0.03), drop(a, 0.15, 0.03)],
        lacquerDark,
        out
      );
      // 滴水: a pointed drip tile hangs from the pan between two rows.
      const c = at((s0 + s1) / 2, 0),
        half = (0.3 * (s1 - s0) * w) / 2;
      put(
        m,
        [
          [c[0] - ex * half, c[1] + 0.005, c[2] - ez * half],
          [c[0] + ex * half, c[1] + 0.005, c[2] + ez * half],
          [c[0] + out[0] * 0.02, c[1] - 0.06, c[2] + out[2] * 0.02]
        ],
        mid,
        out
      );
    }
    for (let i = 1; i < n; i++) {
      const s = -1 + (2 * i) / n;
      // A half-round row of tiles, narrowing with the slope toward a hip or an apex.
      let last = null;
      for (let k = 0; k <= rows; k++) {
        const t = k / rows,
          p = at(s, t),
          r = 0.036 * Math.max(0.25, narrow(t)),
          h = 0.04 * Math.max(0.4, narrow(t)),
          ring = [];
        for (let q = 0; q <= 4; q++) {
          const a = (q * Math.PI) / 4;
          ring.push([p[0] + ex * r * Math.cos(a), p[1] + h * Math.sin(a), p[2] + ez * r * Math.cos(a)]);
        }
        if (last)
          for (let q = 0; q < 4; q++)
            put(m, [last[q], ring[q], ring[q + 1], last[q + 1]], [mid, hi, lit, dark][q]);
        last = ring;
      }
      // 瓦當: the round end tile facing out at the eave.
      const e = at(s, 0),
        disc = [];
      for (let q = 0; q < 6; q++) {
        const a = (q * Math.PI * 2) / 6;
        disc.push([
          e[0] + out[0] * 0.02 + ex * 0.036 * Math.cos(a),
          e[1] + 0.012 + 0.036 * Math.sin(a),
          e[2] + out[2] * 0.02 + ez * 0.036 * Math.cos(a)
        ]);
      }
      put(m, disc, lit, out);
      // Two tiers of rafter ends under the fascia: square flying rafters over round eave rafters.
      if (rafters) {
        const along = Math.abs(out[0]) > 0.5;
        const end = (inset, h, size, col) =>
          m.box(
            e[0] - out[0] * inset,
            e[1] - h,
            e[2] - out[2] * inset,
            along ? 0.16 : size,
            size,
            along ? size : 0.16,
            col
          );
        end(0.1, 0.2, 0.05, teal);
        end(0.2, 0.28, 0.058, lacquerDark);
      }
    }
  }
  const nx = Math.max(4, Math.round(w / tile)),
    nz = Math.max(3, Math.round(d / tile));
  for (const side of [-1, 1]) sheet(slope(side), nx, [1, 0], [0, 0, side], (t) => 1 - hip * t);
  const top = eave + rise,
    half = (w / 2) * (1 - hip);
  if (gable) {
    // Plastered gable ends under a barge board.
    for (const side of [-1, 1]) {
      const line = [];
      for (let k = 0; k <= rows; k++) line.push(slope(1)(side, k / rows));
      for (let k = rows - 1; k >= 0; k--) line.push(slope(-1)(side, k / rows));
      for (let k = 0; k < rows; k++)
        put(
          m,
          [line[k], line[k + 1], line[2 * rows - k - 1], line[2 * rows - k]],
          plaster,
          [side, 0, 0]
        );
      m.line(
        line.map(([x, y, z]) => [x + side * 0.03, y + 0.02, z]),
        0.04,
        ridgeTone,
        5
      );
      // A gilt 懸魚 under the apex of each gable.
      const apex = line[rows];
      m.box(apex[0] + side * 0.06, apex[1] - 0.16, apex[2], 0.03, 0.22, 0.09, gilt);
    }
  } else {
    for (const side of [-1, 1]) sheet(end(side), nz, [0, 1], [side, 0, 0], (t) => 1 - t);
    // Hip ridges run down to the corners and turn up past the eave; ridge beasts ride them.
    for (const e of [-1, 1])
      for (const f of [-1, 1]) {
        const pts = [];
        for (let k = rows; k >= 0; k--) {
          const p = slope(f)(e, k / rows);
          pts.push([p[0], p[1] + 0.045, p[2]]);
        }
        const c = pts.at(-1),
          tail = [c[0] + e * 0.2, c[1] + 0.2 + lift * 0.3, c[2] + f * 0.2];
        m.line([...pts, tail], 0.05, ridgeTone, 6);
        m.tube(tail, [tail[0] + e * 0.05, tail[1] + 0.1, tail[2] + f * 0.05], 0.032, 0.01, gilt, 5);
        const scale = Math.min(1, w / 6);
        for (let b = 0; b < beasts; b++) {
          const t = (0.1 + b * 0.075) / Math.max(1, w / 8),
            p = slope(f)(e, t),
            y = p[1] + 0.09,
            sz = 0.055 * scale;
          // The first rider is the gilt immortal on a hen; the rest are crouching beasts.
          const col = b === 0 ? gilt : ridgeTone;
          m.box(p[0], y, p[2], sz * 1.1, sz * 1.2, sz * 1.1, col);
          m.box(p[0] + e * sz * 0.35, y + sz * 0.95, p[2] + f * sz * 0.35, sz * 0.7, sz * 0.8, sz * 0.7, col);
        }
      }
  }
  if (half > 0.05) {
    // Main ridge under a cap course, a carved band along it, and a dragon-headed end at each end.
    m.box(0, top + 0.06, 0, half * 2 + 0.14, 0.17, 0.13, ridgeTone);
    m.box(0, top + 0.16, 0, half * 2 + 0.16, 0.035, 0.16, hi);
    m.box(0, top + 0.07, 0, half * 2 + 0.1, 0.05, 0.145, m.mix(ridgeTone, hi, 0.4));
    if (!gable)
      for (const e of [-1, 1]) {
        const x = e * (half + 0.03),
          k = Math.min(1.4, Math.max(0.8, w / 8));
        m.line(
          [
            [x, top + 0.08, 0],
            [x + e * 0.08 * k, top + 0.26 * k, 0],
            [x, top + 0.46 * k, 0],
            [x - e * 0.14 * k, top + 0.44 * k, 0],
            [x - e * 0.2 * k, top + 0.34 * k, 0]
          ],
          0.06 * k,
          ridgeTone,
          6
        );
        // The jaw and the fin of the ridge-end dragon.
        m.box(x + e * 0.02, top + 0.2 * k, 0, 0.16 * k, 0.12 * k, 0.1 * k, ridgeTone);
        m.tube([x + e * 0.02, top + 0.4 * k, 0], [x + e * 0.13, top + 0.5 * k, 0], 0.03, 0.008, gilt, 5);
        m.tube([x - e * 0.04, top + 0.3 * k, 0.06], [x - e * 0.04, top + 0.3 * k, -0.06], 0.02, 0.02, gilt, 5);
      }
  } else {
    // A gilt finial closes a pointed roof.
    m.lathe(
      0,
      top - 0.04,
      0,
      [
        [0, 0.16],
        [0.07, 0.17],
        [0.12, 0.07],
        [0.2, 0.11],
        [0.3, 0.06],
        [0.38, 0.08],
        [0.44, 0.03],
        [0.52, 0]
      ],
      gilt,
      10
    );
  }
}

// 斗拱: one bracket set in its own frame, standing at y = 0 on the architrave and reaching out
// along +z toward the eave: a great block, crossed arms in two tiers with small blocks on their
// ends, two projecting cantilevers (昂) and a carved head under the eave purlin.
function bracketSet(m, s = 1, corner = false) {
  m.frame(0, 0, 0, 0, s, () => {
    m.box(0, 0.045, 0, 0.18, 0.09, 0.18, azure);
    m.box(0, 0.12, 0, 0.5, 0.06, 0.07, paint);
    for (const x of [-0.21, 0, 0.21]) m.box(x, 0.175, 0, 0.09, 0.05, 0.09, azure);
    m.box(0, 0.235, 0.02, 0.76, 0.06, 0.07, paint);
    for (const x of [-0.33, 0, 0.33]) m.box(x, 0.29, 0.02, 0.09, 0.05, 0.09, azure);
    // The cantilevers step out, each tipped with a small block.
    m.box(0, 0.15, 0.17, 0.07, 0.06, 0.36, paint);
    m.box(0, 0.2, 0.33, 0.09, 0.05, 0.09, azure);
    m.box(0, 0.26, 0.29, 0.07, 0.06, 0.42, azure);
    m.box(0, 0.31, 0.47, 0.09, 0.05, 0.09, paint);
    m.box(0, 0.36, 0.33, 0.5, 0.06, 0.07, paint);
    m.box(0, 0.37, 0.56, 0.07, 0.08, 0.14, gilt);
    // A thin gilt edge along the arms picks them out under the lamps.
    m.box(0, 0.152, 0.036, 0.5, 0.012, 0.004, gilt);
    m.box(0, 0.267, 0.056, 0.76, 0.012, 0.004, gilt);
    if (corner) m.box(0, 0.42, 0.62, 0.08, 0.06, 0.2, lacquer);
  });
}
// A row of bracket sets along x of the frame, one over each column and `between` in each bay.
function bracketRow(m, posts, y, z, between = 1, s = 1, yaw = 0) {
  const at = [];
  for (let i = 0; i < posts.length; i++) {
    at.push(posts[i]);
    if (i < posts.length - 1)
      for (let k = 1; k <= between; k++)
        at.push(posts[i] + ((posts[i + 1] - posts[i]) * k) / (between + 1));
  }
  m.frame(0, 0, 0, yaw, 1, () => {
    for (const x of at) m.frame(x, y, z, 0, 1, () => bracketSet(m, s));
    // The plank they stand on and the eave purlin they carry.
    const a = Math.min(...at),
      b = Math.max(...at);
    m.box((a + b) / 2, y - 0.03, z, b - a + 0.4, 0.06, 0.2, lacquerDark);
    m.box((a + b) / 2, y + 0.42 * s, z + 0.5 * s, b - a + 0.6, 0.1, 0.12, teal);
  });
}

export { tiledRoof, bracketSet, bracketRow };
