// Modelled Jiangnan riverbank. All coordinates are grid units, with Y up.
function buildLandscape(T) {
  const landscape = new T.Group();
  landscape.name = 'Qingzhudu river landscape';
  const TAU = Math.PI * 2;
  let seed = 0x6b51d32f;
  function rand() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const range = (lo, hi) => lo + (hi - lo) * rand();
  // Fine shape detail draws on a second stream, so adding it never moves what rand() places.
  let grain = 0x2c1b7e45;
  const jitter = (lo, hi) => {
    grain = (Math.imul(grain, 1103515245) + 12345) >>> 0;
    return lo + (hi - lo) * (grain / 4294967296);
  };
  const choose = (v) => v[Math.floor(rand() * v.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const point = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const minus = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const unit = (a) => {
    const n = Math.hypot(...a) || 1;
    return a.map((v) => v / n);
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const tint = new Map();
  function rgb(hex) {
    if (Array.isArray(hex)) return hex;
    if (!tint.has(hex)) {
      const c = new T.Color(hex);
      tint.set(hex, [c.r, c.g, c.b]);
    }
    return tint.get(hex);
  }
  function mix(a, b, t) {
    a = rgb(a);
    b = rgb(b);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  }
  class Surface {
    constructor() {
      this.vertices = [];
      this.colors = [];
    }
    tri(a, b, c, ca, cb = ca, cc = ca) {
      this.vertices.push(...a, ...b, ...c);
      this.colors.push(...rgb(ca), ...rgb(cb), ...rgb(cc));
    }
    quad(a, b, c, d, ca, cb = ca, cc = ca, cd = ca) {
      this.tri(a, b, c, ca, cb, cc);
      this.tri(a, c, d, ca, cc, cd);
    }
    finish(name, options = {}) {
      const { fade = false, distant = false, shadows = !distant, kind = 'terrain' } = options;
      if (!this.vertices.length) return;
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(this.vertices, 3));
      geo.setAttribute('color', new T.Float32BufferAttribute(this.colors, 3));
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      const center = geo.boundingBox.getCenter(new T.Vector3());
      geo.translate(-center.x, -center.y, -center.z);
      geo.computeBoundingSphere();
      const mat = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
      mat.name = 'Ferry_' + kind.replace(/[^a-zA-Z0-9_]/g, '_');
      const mesh = new T.Mesh(geo, mat);
      mesh.name = name;
      mesh.position.copy(center);
      mesh.castShadow = shadows;
      mesh.receiveShadow = !distant;
      mesh.userData = { environment: true, occluder: fade, fadeable: fade, distant, kind };
      landscape.add(mesh);
    }
  }

  // A bent, tapered tube with a constant cross-section frame down its length.
  function limb(s, pts, radii, color, sides = 6, fleck = 0) {
    let axis = unit(minus(pts[pts.length - 1], pts[0]));
    const ref = Math.abs(axis[1]) > 0.82 ? [1, 0, 0] : [0, 1, 0];
    const twist = range(0, TAU);
    let prev;
    const wood = Array.from({ length: sides }, () =>
      fleck ? mix(color, fleck, range(0.06, 0.48)) : color
    );
    for (let k = 0; k < pts.length; k++) {
      axis = unit(minus(pts[Math.min(k + 1, pts.length - 1)], pts[Math.max(k - 1, 0)]));
      let u = unit(cross(axis, ref));
      if (Math.hypot(...u) < 0.01) u = unit(cross(axis, [0, 0, 1]));
      const v = cross(axis, u);
      const ring = [];
      for (let i = 0; i < sides; i++) {
        const theta = (i * TAU) / sides + twist,
          x = Math.cos(theta) * radii[k],
          y = Math.sin(theta) * radii[k];
        ring.push(pts[k].map((p, j) => p + u[j] * x + v[j] * y));
      }
      if (prev)
        for (let i = 0; i < sides; i++) {
          const j = (i + 1) % sides;
          s.quad(prev[i], prev[j], ring[j], ring[i], wood[i]);
        }
      prev = ring;
    }
    for (let i = 1; i < sides - 1; i++) s.tri(prev[0], prev[i], prev[i + 1], color);
  }
  const stone = [0x566364, 0x636b68, 0x6d706c, 0x72716a, 0x626a63, 0x71756c];
  const earth = [0x615c44, 0x666549, 0x727052, 0x7c7856];
  const moss = [0x626e45, 0x738052, 0x80875b, 0x687647, 0x8c9062];
  const greys = [0x788176, 0x878779, 0x7d8071, 0x84887b];
  function stoneBlock(s, x, y, z, sx, sy, sz, angle = 0, green = 0.4, wet = false) {
    const n = Math.floor(range(6, 9)),
      outline = [];
    for (let i = 0; i < n; i++) {
      const theta = ((i + range(-0.18, 0.18)) * TAU) / n,
        d = range(0.85, 1.15);
      outline.push([Math.cos(theta) * d * sx, Math.sin(theta) * d * sz, range(-0.055, 0.055)]);
    }
    // Larger stones get a bulging point between each pair of corners, so their
    // outline reads as a worn boulder rather than a cut hexagon.
    if (Math.max(sx, sz) > 0.3) {
      const corners = outline.splice(0);
      for (let i = 0; i < corners.length; i++) {
        const a = corners[i],
          b = corners[(i + 1) % corners.length],
          bulge = jitter(1.02, 1.12);
        outline.push(a, [
          ((a[0] + b[0]) / 2) * bulge,
          ((a[1] + b[1]) / 2) * bulge,
          (a[2] + b[2]) / 2
        ]);
      }
    }
    const c = Math.cos(angle),
      h = Math.sin(angle);
    const vertex = (u, v, hei, k) => [x + (u * c - v * h) * k, y + hei * sy, z + (u * h + v * c) * k];
    const cap = wet ? mix(choose(greys), 0x718069, 0.26) : mix(choose(greys), choose(moss), green);
    const faces = Array.from({ length: n }, () =>
      wet ? mix(choose(stone), 0x344e4d, 0.35) : choose(stone)
    );
    // The crown is weathered round and leans a little off the stone's axis, so
    // no two read as the same cut prism. Its shape draws on its own stream.
    const leanU = jitter(-0.1, 0.1) * sx,
      leanV = jitter(-0.1, 0.1) * sz;
    const sides = outline.length,
      side = (i) => faces[Math.floor((i * n) / sides)];
    const tone = (level, i) =>
      level > 0.3
        ? mix(side(i), cap, 0.8)
        : level > 0.2
          ? mix(side(i), cap, 0.42)
          : level < -0.3 && wet
            ? mix(side(i), 0x2f4644, 0.3)
            : side(i);
    let prev, prevLevel;
    for (const [level, width] of [
      [-0.46, 0.8],
      [-0.2, 1.0],
      [0.1, 1.0],
      [0.27, 0.87],
      [0.38, 0.6]
    ]) {
      const lift = Math.max(0, level) * 2;
      const loop = outline.map(([u, v, noise]) =>
        vertex(
          u + leanU * lift,
          v + leanV * lift,
          level + noise * (level > 0.3 ? 0.5 : 1),
          width * (level > 0 ? jitter(0.92, 1.06) : 1)
        )
      );
      if (prev)
        for (let i = 0; i < sides; i++) {
          const j = (i + 1) % sides;
          const low = tone(prevLevel, i),
            high = tone(level, i);
          s.quad(prev[i], loop[i], loop[j], prev[j], low, high, high, low);
        }
      prev = loop;
      prevLevel = level;
    }
    const top = vertex(sx * 0.12 + leanU, sz * 0.14 + leanV, 0.45, 1);
    for (let i = 0; i < sides; i++)
      s.tri(
        top,
        prev[(i + 1) % sides],
        prev[i],
        cap,
        mix(cap, side(i), 0.12),
        mix(cap, side(i), 0.06)
      );
  }
  const mainShore = [
    [-4.33, 2.92],
    [-3.82, 3.64],
    [-2.92, 3.8],
    [-2.12, 3.64],
    [-1.32, 3.63],
    [-0.46, 3.67],
    [0.42, 3.79],
    [1.22, 3.69],
    [2.04, 3.86],
    [2.99, 3.72],
    [3.59, 3.65],
    [3.89, 3.07],
    [3.84, 2.43],
    [3.67, 1.81],
    [3.7, 1.28],
    [3.7, 0.71],
    [3.71, 0.09],
    [3.93, -0.6],
    [3.77, -1.31],
    [3.89, -2.05],
    [4.08, -2.74],
    [4.72, -3.12],
    [5.7, -3.18],
    [6.6, -3.38],
    [7.05, -3.96],
    [7.12, -4.9],
    [6.78, -5.85],
    [6.38, -6.64],
    [5.63, -7.16],
    [4.54, -7.2],
    [3.74, -7.08],
    [2.79, -7.25],
    [2.03, -7.03],
    [1.02, -7.31],
    [0.04, -7.34],
    [-1.21, -7.28],
    [-2.19, -7.44],
    [-3.52, -7.37],
    [-4.5, -7.28],
    [-5.38, -6.79],
    [-5.78, -5.89],
    [-5.6, -4.83],
    [-5.86, -3.93],
    [-6.16, -3.12],
    [-6.38, -2.23],
    [-6.19, -1.59],
    [-5.54, -1.0],
    [-5.4, -0.21],
    [-5.08, 0.51],
    [-4.86, 1.12],
    [-4.75, 1.91]
  ];
  const eastShore = [
    [6.93, 0.82],
    [6.97, 1.66],
    [7.38, 2.39],
    [7.53, 3.25],
    [8.33, 3.85],
    [9.0, 4.47],
    [10.32, 4.86],
    [11.12, 4.45],
    [11.65, 3.31],
    [11.4, 2.45],
    [11.63, 1.04],
    [10.81, -0.23],
    [10.08, -1.16],
    [9.06, -1.6],
    [8.39, -1.28],
    [7.76, -0.67],
    [7.52, -0.09]
  ];
  function shore(s, polygon) {
    // The supplied coastline runs counterclockwise as seen from above.
    const edge = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % polygon.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const len = Math.hypot(dx, dz),
        ticks = Math.max(1, Math.ceil(len / 0.49));
      for (let t = 0; t < ticks; t++) {
        const off = t === 0 ? 0 : range(-0.055, 0.065);
        edge.push([
          lerp(a[0], b[0], t / ticks) - (dz / len) * off,
          lerp(a[1], b[1], t / ticks) + (dx / len) * off
        ]);
      }
    }
    const n = edge.length,
      dirs = edge.map((v, i) => {
        const a = edge[(i + n - 1) % n],
          b = edge[(i + 1) % n],
          l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
      });
    const ridge = edge.map(() => range(-0.045, 0.036)),
      bump = edge.map(() => range(0.8, 1.22));
    const fault = edge.map(
      ([x, z]) => 0.054 * Math.sin(x * 1.29 + z * 0.64) + 0.037 * Math.sin(z * 1.91 - x * 0.38)
    );
    const lipColors = edge.map(() => choose(moss)),
      rockColors = edge.map(() => choose(stone));
    const faceAt = (y, i) => {
      if (y < -0.55) return mix(rockColors[i], 0x314e4b, 0.6);
      if (y < -0.35) return mix(rockColors[i], 0x425955, 0.3);
      if (y < -0.12) return mix(rockColors[i], 0x695e4a, 0.19);
      return lipColors[i];
    };
    let previous, previousY;
    // Geological strata with flared bases, a sandstone seam and a moss overhang.
    for (const [y, d] of [
      [-1.5, 0.53],
      [-0.77, 0.4],
      [-0.61, 0.33],
      [-0.49, 0.13],
      [-0.452, 0.165],
      [-0.414, 0.096],
      [-0.3, 0.03],
      [-0.215, 0.077],
      [-0.187, 0.018],
      [-0.088, 0.035],
      [-0.052, -0.055],
      [-0.056, -0.26]
    ]) {
      const loop = edge.map(([x, z], i) => [
        x + dirs[i][0] * d * bump[i],
        y + ridge[i] * (y < -0.18 ? 1 : 0.45) + fault[i] * Math.min(1, Math.max(0, (-0.08 - y) * 3.8)),
        z + dirs[i][1] * d * bump[i]
      ]);
      if (previous)
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n,
            top = faceAt(y, i),
            bottom = faceAt(previousY, i);
          let seam = top;
          if (y === -0.452 || y === -0.187) seam = mix(top, 0xb7ad86, 0.29);
          s.quad(previous[i], loop[i], loop[j], previous[j], bottom, seam, mix(seam, top, 0.15), bottom);
        }
      previous = loop;
      previousY = y;
    }
    const cap = previous.map((p) => new T.Vector2(p[0], p[2]));
    const faces = T.ShapeUtils.triangulateShape(cap, []);
    const paint = previous.map((p, i) => mix(choose(earth), lipColors[i], range(0.2, 0.55)));
    for (const [a, b, c] of faces)
      s.tri(previous[a], previous[c], previous[b], paint[a], paint[c], paint[b]);
    function topAt(x, z) {
      for (const [a, b, c] of faces) {
        const A = previous[a],
          B = previous[b],
          C = previous[c];
        const det = (B[2] - C[2]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[2] - C[2]);
        if (Math.abs(det) < 1e-8) continue;
        const u = ((B[2] - C[2]) * (x - C[0]) + (C[0] - B[0]) * (z - C[2])) / det;
        const v = ((C[2] - A[2]) * (x - C[0]) + (A[0] - C[0]) * (z - C[2])) / det,
          w = 1 - u - v;
        if (u < 0 || v < 0 || w < 0) continue;
        return {
          y: A[1] * u + B[1] * v + C[1] * w,
          color: rgb(paint[a]).map((k, j) => k * u + rgb(paint[b])[j] * v + rgb(paint[c])[j] * w)
        };
      }
      return null;
    }
    return { edge, dirs, topAt };
  }
  const bank = new Surface(),
    main = shore(bank, mainShore),
    east = shore(bank, eastShore);
  bank.finish('Terraced slate riverbanks');

  function bankStones(coast, label, dense) {
    const s = new Surface();
    for (let i = 0; i < coast.edge.length; i++) {
      const [x, z] = coast.edge[i],
        [dx, dz] = coast.dirs[i];
      const landing =
        (x > 3.38 && x < 8 && Math.abs(z - 1) < 0.57) || (Math.abs(x + 1.2) < 0.62 && z > 2.9);
      if (landing) continue;
      if (rand() < dense) {
        const d = range(0.11, 0.7),
          k = range(0.4, 1.04);
        stoneBlock(
          s,
          x + dx * d,
          -0.48 + range(-0.11, 0.05),
          z + dz * d,
          k * range(0.25, 0.61),
          k * range(0.25, 0.72),
          k * range(0.2, 0.52),
          range(0, TAU),
          0.28,
          true
        );
      }
      if (rand() < 0.48) {
        const d = range(-0.05, 0.14),
          k = range(0.34, 0.66);
        stoneBlock(
          s,
          x + dx * d,
          range(-0.23, -0.11),
          z + dz * d,
          k * range(0.35, 0.77),
          k * range(0.26, 0.53),
          k * range(0.28, 0.62),
          range(0, TAU),
          0.74
        );
      }
    }
    s.finish(label);
  }
  bankStones(main, 'Slate talus and moss of the west bank', 0.65);
  bankStones(east, 'Weathered stones beyond the bridge', 0.7);
  const paving = new Surface();
  for (let i = 0; i < 14; i++) {
    const x = -3.74 + i * 0.7,
      z = -3.9 + Math.sin(i * 1.46) * 0.1;
    if (x > 2.8 && x < 3.8) continue;
    stoneBlock(
      paving,
      x,
      -0.036,
      z,
      range(0.2, 0.33),
      range(0.052, 0.081),
      range(0.24, 0.38),
      range(-0.25, 0.25),
      0.29
    );
  }
  for (let i = 0; i < 10; i++) {
    stoneBlock(
      paving,
      range(7.04, 9.45),
      -0.033,
      range(0.57, 1.58),
      range(0.14, 0.32),
      0.065,
      range(0.18, 0.34),
      range(0, TAU),
      0.29
    );
  }
  paving.finish('Worn riverside stepping stones');

  function blade(s, a, b, width, bend, baseColor, tipColor = baseColor) {
    // A folded lanceolate leaf, broad at its first third and pointed at the tip.
    const dx = b[0] - a[0],
      dz = b[2] - a[2],
      span = Math.hypot(dx, dz) || 0.001;
    const mid = point(a, b, 0.39);
    mid[1] += bend;
    const left = [mid[0] - (dz / span) * width, mid[1] - 0.12 * width, mid[2] + (dx / span) * width];
    const right = [mid[0] + (dz / span) * width, mid[1] - 0.2 * width, mid[2] - (dx / span) * width];
    const ridge = [mid[0], mid[1] + width * 0.23, mid[2]];
    s.tri(a, left, ridge, baseColor, baseColor, tipColor);
    s.tri(left, b, ridge, baseColor, tipColor, tipColor);
    s.tri(a, ridge, right, baseColor, tipColor, baseColor);
    s.tri(ridge, b, right, tipColor, tipColor, baseColor);
  }
  const bambooGreens = [0x496b45, 0x5c794b, 0x709055, 0x82955c, 0x506f49, 0x6f8250];
  const bambooSunny = [0x8c9f64, 0xa1ad6d, 0x899d63, 0x97a85f];
  function bambooGrove(x, z, spread, count, height, label) {
    const s = new Surface();
    for (let c = 0; c < count; c++) {
      const theta = range(0, TAU),
        radial = Math.sqrt(rand()) * spread;
      const bx = x + Math.cos(theta) * radial,
        bz = z + Math.sin(theta) * radial;
      const h = height * range(0.57, 1.08),
        segments = Math.floor(range(6, 9));
      const lean = range(0.11, 0.49),
        leanX = Math.cos(theta) * lean - 0.1,
        leanZ = Math.sin(theta) * lean + 0.065;
      const radius = range(0.029, 0.049),
        col = choose([0x5f7948, 0x7f8752, 0x7a8b56, 0x8d9260, 0x677e4e]);
      const nodeAt = (t) => [
        bx + leanX * (0.26 * t + 0.74 * t * t),
        -0.05 + h * t,
        bz + leanZ * (0.25 * t + 0.76 * t * t)
      ];
      const nodes = Array.from({ length: segments + 1 }, (_, j) => nodeAt(j / segments));
      limb(
        s,
        nodes,
        nodes.map((v, j) => radius * (1 - (0.73 * j) / segments)),
        col,
        7,
        0xb5ab72
      );
      for (let j = 1; j < segments; j++) {
        const t = j / segments,
          p = nodes[j],
          r = radius * (1 - 0.67 * t);
        const low = nodeAt(t - 0.0044),
          cap = nodeAt(t + 0.0075);
        limb(s, [low, p, cap], [r * 1.15, r * 1.3, r * 1.02], mix(col, 0xcdc990, 0.37), 7);
        if (t < 0.32 && rand() < 0.82) continue;
        const shoots = t > 0.54 ? 2 : 1;
        for (let k = 0; k < shoots; k++) {
          const ang = theta + j * 2.03 + k * 2.5 + range(-0.6, 0.6);
          const side = (1.03 - t * 0.39) * range(0.39, 0.85),
            lift = range(0.12, 0.45);
          const tip = [p[0] + Math.cos(ang) * side, p[1] + lift, p[2] + Math.sin(ang) * side];
          const elbow = [lerp(p[0], tip[0], 0.47), p[1] + lift * 0.95 + 0.04, lerp(p[2], tip[2], 0.47)];
          limb(s, [p, elbow, tip], [0.013, 0.011, 0.0028], mix(col, 0x505d35, 0.4), 4);
          const pairs = Math.floor(range(4, 7));
          for (let v = 0; v < pairs; v++) {
            const f = 0.28 + (0.67 * v) / (pairs - 1),
              attach = point(elbow, tip, (f - 0.28) / 0.67);
            for (let direction = -1; direction <= 1; direction += 2) {
              const leafAng = ang + direction * range(0.29, 0.99);
              const len = range(0.14, 0.29) * (1.12 - 0.28 * f),
                end = [
                  attach[0] + Math.cos(leafAng) * len,
                  attach[1] - len * range(0.25, 0.72),
                  attach[2] + Math.sin(leafAng) * len
                ];
              const bright = choose(t > 0.67 ? bambooSunny : bambooGreens);
              blade(
                s,
                attach,
                end,
                len * range(0.078, 0.117),
                len * 0.126,
                mix(choose(bambooGreens), bright, 0.2),
                bright
              );
            }
          }
        }
      }
      for (let k = 0; k < 3; k++) {
        const ang = theta + k * 2.2,
          base = nodes[segments - 1],
          len = range(0.15, 0.26);
        blade(
          s,
          base,
          [base[0] + Math.cos(ang) * len, base[1] + range(0.1, 0.26), base[2] + Math.sin(ang) * len],
          len * 0.1,
          0.025,
          col,
          choose(bambooSunny)
        );
      }
    }
    s.finish(label, { fade: true, kind: 'bamboo' });
  }
  bambooGrove(-5.16, -1.96, 0.67, 7, 3.36, 'Bamboo grove at the west inlet');
  bambooGrove(-5.05, -4.36, 0.57, 8, 3.62, 'Bamboo beside the pavilion');
  bambooGrove(-4.4, -6.53, 0.72, 6, 3.51, 'Bamboo on the back terrace');

  // Broken, overlapping pads form the inner silhouette of each leafy bough.
  function foliagePad(s, x, y, z, rx, rz, thick, shade, sun, n = 13) {
    const rim = [],
      lower = [],
      upper = [];
    const phase = range(0, TAU);
    for (let j = 0; j < n; j++) {
      const a = ((j + range(-0.17, 0.17)) * TAU) / n + phase,
        r = range(0.78, 1.11);
      const px = Math.cos(a) * r * rx,
        pz = Math.sin(a) * r * rz;
      rim.push([x + px, y + range(-0.17, 0.13) * thick, z + pz]);
      lower.push([x + px * 0.67, y - thick * range(0.36, 0.73), z + pz * 0.67]);
      upper.push([x + px * 0.54, y + thick * range(0.31, 0.72), z + pz * 0.55]);
    }
    const cap = [x + rx * 0.065, y + thick * 0.82, z - rz * 0.075],
      belly = [x, y - thick * 0.68, z];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        outside = mix(shade, sun, range(0.15, 0.49));
      const hi = mix(shade, sun, range(0.58, 0.93));
      s.tri(belly, lower[i], lower[j], shade);
      s.quad(lower[i], rim[i], rim[j], lower[j], shade, outside, outside, shade);
      s.quad(rim[i], upper[i], upper[j], rim[j], outside, hi, sun, outside);
      s.tri(upper[i], cap, upper[j], hi, sun, hi);
    }
  }
  const redMaple = [0x952e24, 0xa63d27, 0xb64429, 0xc3532d, 0xba492a, 0xb54b2c, 0xd26936, 0xcb5c33];
  const sunMaple = [0xd2763c, 0xd77939, 0xe58c4a, 0xe6a153, 0xe99445, 0xde7f41, 0xeb9d52, 0xd86736];
  const darkMaple = [0x7a3026, 0x873327, 0x924125, 0x823126, 0x93402a, 0x973523];
  const lobes = [
    [-0.57, -0.19],
    [-0.4, 0.07],
    [-0.89, 0.36],
    [-0.45, 0.38],
    [-0.65, 0.84],
    [-0.21, 0.66],
    [0, 1.24],
    [0.22, 0.64],
    [0.65, 0.83],
    [0.46, 0.37],
    [0.88, 0.35],
    [0.37, 0.03],
    [0.56, -0.18],
    [0, 0]
  ];
  function mapleLeaf(s, base, len, angle, pitch, color) {
    const ca = Math.cos(angle),
      sa = Math.sin(angle),
      p = [base[0], base[1] + len * 0.09, base[2]];
    const outline = lobes.map(([w, l]) => [
      base[0] + len * (l * ca - w * sa * 0.8),
      base[1] + len * (pitch * l - Math.abs(w) * 0.2),
      base[2] + len * (l * sa + w * ca * 0.8)
    ]);
    const shadow = mix(color, 0x813c28, 0.14);
    for (let i = 0; i < outline.length - 1; i++)
      s.tri(p, outline[i], outline[i + 1], color, i < 6 ? color : shadow, color);
  }
  function maple() {
    const s = new Surface(),
      x = 3.26,
      z = -4.1,
      dark = 0x513c32,
      light = 0x806249;
    const trunk = [
      [x - 0.03, -0.15, z + 0.02],
      [x + 0.03, 0.31, z],
      [x - 0.12, 0.78, z + 0.01],
      [x - 0.06, 1.24, z - 0.07],
      [x + 0.21, 1.68, z - 0.07],
      [x + 0.15, 2.17, z - 0.19],
      [x + 0.32, 2.64, z - 0.18],
      [x + 0.51, 2.99, z - 0.06]
    ];
    limb(s, trunk, [0.247, 0.17, 0.138, 0.121, 0.094, 0.081, 0.043, 0.009], dark, 11, light);
    for (let i = 0; i < 7; i++) {
      const a = (i * TAU) / 7 + range(-0.25, 0.25),
        reach = range(0.29, 0.63);
      const base = [x + Math.cos(a) * 0.07, 0.15, z + Math.sin(a) * 0.07];
      const elbow = [x + Math.cos(a) * reach * 0.39, 0.012, z + Math.sin(a) * reach * 0.39];
      const toe = [x + Math.cos(a + 0.2) * reach, -0.062, z + Math.sin(a + 0.2) * reach];
      limb(s, [base, elbow, toe], [0.067, 0.06, 0.017], dark, 6, light);
    }
    const pads = [];
    // Several mature scaffold branches have visible elbows, open air beneath
    // the boughs and different lengths on the windward and sheltered sides.
    const branches = [
      [1.04, 2.96, 1.4, 2.25],
      [1.24, 5.83, 1.27, 2.4],
      [1.42, 1.32, 1.03, 2.37],
      [1.58, 3.77, 1.45, 2.76],
      [1.65, 5.28, 1.09, 2.79],
      [1.9, 0.22, 1.22, 2.88],
      [2.03, 2.24, 1.22, 2.92],
      [2.18, 4.31, 0.98, 3.11],
      [2.3, 0.9, 0.92, 3.15],
      [2.5, 3.11, 0.79, 3.29],
      [2.7, 5.34, 0.6, 3.49],
      [2.79, 1.72, 0.55, 3.62]
    ];
    for (let i = 0; i < branches.length; i++) {
      const [start, angle, length, top] = branches[i],
        ox = x + (start < 1.5 ? -0.11 : 0.18),
        oz = z - (start < 1.5 ? 0.02 : 0.12);
      const reach = (d, ang, y) => [ox + Math.cos(ang) * d, y, oz + Math.sin(ang) * d];
      const base = reach(0, angle, start),
        elbow = reach(length * 0.41, angle - 0.14, lerp(start, top, 0.45));
      const bend = reach(length * 0.68, angle + 0.06, lerp(start, top, 0.61)),
        end = reach(length, angle - 0.025, top);
      limb(
        s,
        [base, elbow, bend, end],
        [Math.max(0.032, 0.09 - 0.0044 * i), 0.05, 0.028, 0.008],
        dark,
        7,
        light
      );
      for (let k = 0; k < 3; k++) {
        const f = 0.47 + k * 0.2,
          a = angle + (k % 2 ? -1 : 1) * range(0.38, 1.1);
        const crotch = point(elbow, end, (f - 0.4) / 0.6);
        const span = range(0.25, 0.49),
          tip = [
            crotch[0] + Math.cos(a) * span,
            crotch[1] + range(0.23, 0.45),
            crotch[2] + Math.sin(a) * span
          ];
        const mid = point(crotch, tip, 0.55);
        mid[1] -= 0.08;
        limb(s, [crotch, mid, tip], [0.028, 0.017, 0.004], mix(dark, light, 0.25), 5);
        pads.push([...tip, range(0.28, 0.48), range(0.27, 0.47), range(0.15, 0.22), top]);
        if (k === 1) {
          const sid = point(mid, tip, 0.29),
            fork = angle - 1.28;
          const tip2 = [sid[0] + Math.cos(fork) * 0.28, sid[1] + 0.2, sid[2] + Math.sin(fork) * 0.28];
          limb(s, [sid, tip2], [0.013, 0.003], light, 4);
          pads.push([...tip2, 0.27, 0.3, 0.17, top]);
        }
      }
      pads.push([end[0], end[1] + 0.045, end[2], 0.39, 0.39, 0.2, top]);
    }
    for (const [px, py, pz, rx, rz, th, top] of pads) {
      const amber = top > 3.15 || rand() < 0.16,
        shade = choose(darkMaple),
        sun = choose(amber ? sunMaple : redMaple);
      foliagePad(s, px, py, pz, rx, rz, th, mix(shade, sun, 0.15), sun, 13);
      for (let i = 0; i < 21; i++) {
        const a = range(0, TAU),
          r = Math.sqrt(rand()) * 1.1;
        const p = [
          px + Math.cos(a) * r * rx,
          py + th * (0.15 + 0.59 * (1 - r * r)) + range(0.008, 0.051),
          pz + Math.sin(a) * r * rz
        ];
        const col = choose(amber || rand() < 0.25 ? sunMaple : redMaple);
        mapleLeaf(s, p, range(0.063, 0.132), a + range(-0.8, 0.8), range(-0.5, 0.21), col);
      }
    }
    s.finish('Vermilion maple of Qingzhudu', { fade: true, kind: 'maple' });
    const fallen = new Surface();
    for (let i = 0; i < 70; i++) {
      const r = Math.sqrt(rand()) * 1.95,
        a = range(0, TAU),
        bx = x + Math.cos(a) * r,
        bz = z + Math.sin(a) * r;
      if ((bx < 3.52 && bz > -3.54) || bz < -5.1 || (bx > 4.19 && bz > -3.1)) continue;
      mapleLeaf(
        fallen,
        [bx, -0.029 + range(0, 0.012), bz],
        range(0.043, 0.074),
        range(0, TAU),
        0.05,
        choose(redMaple)
      );
    }
    fallen.finish('Fallen maple leaves', { shadows: false, kind: 'groundcover' });
  }
  maple();

  const pineShadow = [0x36564a, 0x375b49, 0x415d46],
    pineLight = [0x688051, 0x73895d, 0x74845a];
  function pine(s, x, y, z, size, rotation, far = false) {
    const ca = Math.cos(rotation),
      sa = Math.sin(rotation);
    const at = (u, v, w) => [x + (u * ca - w * sa) * size, y + v * size, z + (u * sa + w * ca) * size];
    const wood = far ? 0x586a5d : 0x5b4d40,
      warm = far ? 0x728272 : 0x8c795a;
    const path = [
      [0, -0.04, 0],
      [-0.06, 0.32, 0.04],
      [0.14, 0.57, 0.04],
      [0.06, 0.85, -0.01],
      [0.29, 1.16, -0.01],
      [0.29, 1.48, 0.03],
      [0.43, 1.66, 0.015]
    ];
    limb(
      s,
      path.map((p) => at(...p)),
      [0.096, 0.083, 0.069, 0.059, 0.046, 0.025, 0.006].map((n) => n * size),
      wood,
      far ? 4 : 7,
      warm
    );
    const arms = [
      [-0.06, 0.76, 0, -0.65, 0.97, 0.09],
      [0.15, 1.01, -0.01, 0.76, 1.21, -0.09],
      [0.23, 1.19, 0.0, -0.31, 1.36, -0.38],
      [0.27, 1.33, 0, 0.56, 1.46, 0.38],
      [0.3, 1.49, 0.02, -0.09, 1.6, 0.22]
    ];
    const pads = [];
    for (const [bx, by, bz, ex, ey, ez] of arms) {
      const a = at(bx, by, bz),
        b = at(lerp(bx, ex, 0.49), ey - 0.16, lerp(bz, ez, 0.58)),
        c = at(ex, ey, ez);
      limb(s, [a, b, c], [0.046 * size, 0.032 * size, 0.009 * size], wood, far ? 4 : 6, warm);
      const span = range(0.27, 0.4) * size;
      pads.push([...c, span, span * range(0.75, 1.1)]);
      if (!far) {
        const tw = at(lerp(bx, ex, 0.75), ey + 0.08, lerp(bz, ez, 0.74) + 0.19);
        limb(s, [point(b, c, 0.44), tw], [0.017 * size, 0.003 * size], wood, 4);
        pads.push([...tw, span * 0.76, span * 0.6]);
      }
    }
    pads.push([...at(0.41, 1.68, 0.01), size * 0.31, size * 0.29]);
    for (const [px, py, pz, rx, rz] of pads) {
      const dark = choose(pineShadow),
        hi = choose(pineLight);
      // Far pines have no needle tufts, so their pads are fuller to keep their mass.
      const depth = rx * (far ? 0.46 : 0.33);
      foliagePad(s, px, py + 0.03 * size, pz, rx, rz, depth, dark, hi, far ? 7 : 12);
      if (far) continue;
      for (let j = 0; j < 25; j++) {
        const a = range(0, TAU),
          r = Math.sqrt(rand()),
          c = [px + Math.cos(a) * r * rx, py + rx * (0.26 - 0.22 * r * r), pz + Math.sin(a) * r * rz];
        const len = size * range(0.065, 0.13);
        for (let k = -1; k <= 1; k++) {
          const q = a + k * 0.36,
            left = [c[0] - 0.014 * size * Math.sin(q), c[1], c[2] + 0.014 * size * Math.cos(q)],
            tip = [
              c[0] + Math.cos(q) * len,
              c[1] + size * range(0.016, 0.066),
              c[2] + Math.sin(q) * len
            ];
          s.tri(c, left, tip, dark, hi, hi);
        }
      }
    }
  }
  const pineLand = new Surface();
  stoneBlock(pineLand, 8.33, 0.1, 2.59, 0.79, 0.57, 0.6, 0.73, 0.66);
  stoneBlock(pineLand, 8.74, -0.01, 2.78, 0.49, 0.42, 0.55, 1.5, 0.69);
  pine(pineLand, 8.38, 0.22, 2.62, 1.5, 2.04);
  pineLand.finish('Wind-shaped pine on the bridge landing', { fade: true, kind: 'pine' });
  const backPine = new Surface();
  stoneBlock(backPine, 1.72, -0.09, -6.94, 0.71, 0.7, 0.46, 1.15, 0.51);
  pine(backPine, 1.77, 0.12, -6.86, 1.18, 2.86);
  backPine.finish('Pine at the northern headland', { fade: true, kind: 'pine' });

  const grasses = [0x5e7749, 0x6e844c, 0x85935b, 0x909958, 0x798957, 0x768e5c];
  const reeds = [0x808e57, 0x84965c, 0x939e63, 0x9ca868, 0xb0ab72];
  function tuft(s, x, y, z, height, count, spread, wet = false) {
    const palette = wet ? reeds : grasses;
    for (let i = 0; i < count; i++) {
      const a = range(0, TAU),
        r = Math.sqrt(rand()) * spread,
        h = height * range(0.49, 1.06);
      const px = x + Math.cos(a) * r,
        pz = z + Math.sin(a) * r,
        angle = a + range(-0.74, 0.74);
      const reach = h * range(0.2, 0.81),
        tip = [px + Math.cos(angle) * reach, y + h * range(0.65, 0.98), pz + Math.sin(angle) * reach];
      const col = choose(palette);
      blade(
        s,
        [px, y, pz],
        tip,
        h * range(0.036, 0.066),
        h * range(0.08, 0.19),
        mix(col, 0x455940, 0.5),
        col
      );
    }
  }
  function fern(s, x, y, z, size) {
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + range(-0.36, 0.36),
        len = size * range(0.53, 1.04);
      const stem = (t) => [
        x + Math.cos(a) * len * t,
        y + len * (0.13 * t + 0.4 * Math.sin(t * Math.PI * 0.86)),
        z + Math.sin(a) * len * t
      ];
      const color = choose([0x688254, 0x5c7c4c, 0x7a8d58, 0x82955c]);
      for (let k = 1; k <= 6; k++) {
        const f = k / 7,
          base = stem(f),
          prev = stem((k - 1) / 7);
        const r = 0.0075 * size,
          edge = [prev[0] + Math.sin(a) * r, prev[1], prev[2] - Math.cos(a) * r];
        s.tri(prev, edge, base, color);
        for (const dir of [-1, 1]) {
          const l = len * 0.25 * Math.sin(Math.PI * (0.08 + 0.84 * f)),
            ang = a + dir * (1.07 - 0.28 * f),
            tip = [base[0] + Math.cos(ang) * l, base[1] + l * 0.085, base[2] + Math.sin(ang) * l];
          blade(s, base, tip, l * 0.112, l * 0.07, color, mix(color, 0xabac73, 0.25));
        }
      }
    }
  }
  function bankPlants(coast, label) {
    const s = new Surface();
    for (let i = 0; i < coast.edge.length; i++) {
      const [x, z] = coast.edge[i],
        [dx, dz] = coast.dirs[i];
      if ((x > 3.33 && x < 7.85 && Math.abs(z - 1) < 0.43) || (Math.abs(x + 1.2) < 0.51 && z > 2.9))
        continue;
      if (rand() < 0.61) {
        const d = range(-0.24, -0.07),
          k = range(0.13, 0.36);
        tuft(s, x + dx * d, -0.065, z + dz * d, k, Math.floor(range(7, 14)), k * 0.24);
      }
      if (rand() < 0.11) {
        const d = range(-0.38, -0.13);
        fern(s, x + dx * d, -0.053, z + dz * d, range(0.26, 0.49));
      }
      if (rand() < 0.18) {
        const d = range(0.26, 0.6);
        tuft(s, x + dx * d, -0.69, z + dz * d, range(0.28, 0.57), Math.floor(range(8, 14)), 0.095, true);
      }
    }
    s.finish(label, { shadows: false, kind: 'groundcover' });
  }
  bankPlants(main, 'Sedge, ferns and rushes along the terrace');
  bankPlants(east, 'Grass beneath the eastern pine');
  const understory = new Surface();
  for (let i = 0; i < 25; i++) {
    const x = range(-5.1, -3.71),
      z = range(-5.8, 1.07);
    if (i % 3 === 0) fern(understory, x, -0.047, z, range(0.25, 0.43));
    else tuft(understory, x, -0.054, z, range(0.12, 0.34), Math.floor(range(7, 13)), 0.09);
    if (rand() < 0.35)
      stoneBlock(
        understory,
        x,
        -0.048,
        z,
        range(0.11, 0.31),
        range(0.1, 0.29),
        range(0.11, 0.31),
        range(0, TAU),
        0.72
      );
  }
  understory.finish('Fern and moss understory', { shadows: false, kind: 'groundcover' });

  const lotusGreens = [0x708b55, 0x89a160, 0x769461, 0x83a06d, 0x7e9a66, 0x99a667];
  function lotusPad(s, x, z, r, y) {
    const angle = range(0, TAU),
      center = [x, y + 0.012, z],
      n = 13,
      edge = [];
    const col = choose(lotusGreens),
      rim = mix(col, 0xb8b67c, 0.35),
      central = mix(col, 0xb7bd85, 0.31);
    for (let j = 0; j <= n; j++) {
      const a = angle + 0.13 + (j / n) * (TAU - 0.4),
        d = r * range(0.93, 1.03);
      edge.push([
        x + Math.cos(a) * d,
        y + 0.015 + (0.5 + 0.5 * Math.sin(a * 3 + angle)) * 0.022,
        z + Math.sin(a) * d
      ]);
    }
    for (let j = 0; j < n; j++) {
      const rib = mix(col, rim, range(0.15, 0.73));
      s.tri(center, edge[j + 1], edge[j], central, j % 3 === 0 ? rim : rib, col);
    }
  }
  function lotusFlower(s, x, z, scale) {
    const by = -0.655,
      h = range(0.14, 0.32) * scale,
      y = by + h,
      rose = [0xd79c91, 0xdeaaa2, 0xeab8ab, 0xedc5b8];
    limb(
      s,
      [
        [x + 0.008, by - 0.05, z],
        [x + 0.02, by + 0.09, z - 0.018],
        [x, y, z]
      ],
      [0.011 * scale, 0.01 * scale, 0.007 * scale],
      0x72834c,
      5
    );
    for (let layer = 0; layer < 2; layer++) {
      const n = layer ? 7 : 9,
        off = layer * 0.43,
        len = (layer ? 0.096 : 0.141) * scale;
      for (let i = 0; i < n; i++) {
        const a = (i * TAU) / n + off,
          col = choose(rose),
          ca = Math.cos(a),
          sa = Math.sin(a);
        const pet = (f, w, up) => [
          x + len * (ca * f - sa * w),
          y + len * up,
          z + len * (sa * f + ca * w)
        ];
        const b = pet(0.08, 0, -0.02),
          left = pet(0.57, 0.23, 0.3),
          right = pet(0.57, -0.23, 0.3),
          ridge = pet(0.54, 0, 0.18);
        const tip = pet(layer ? 0.78 : 1, 0, layer ? 1.0 : 0.57),
          shine = mix(col, 0xffebd6, 0.48);
        s.tri(b, left, ridge, col, shine, col);
        s.tri(left, tip, ridge, shine, col, shine);
        s.tri(b, ridge, right, col, col, shine);
        s.tri(ridge, tip, right, shine, col, shine);
      }
    }
    const a = [x, y + 0.038 * scale, z],
      b = [x, y + 0.055 * scale, z];
    limb(s, [a, b], [0.023 * scale, 0.034 * scale], 0xd9b15b, 9);
  }
  function lotusBed(cx, cz, n, wx, wz, label) {
    const s = new Surface();
    for (let i = 0; i < n; i++) {
      const a = range(0, TAU),
        d = Math.sqrt(rand()),
        x = cx + Math.cos(a) * d * wx,
        z = cz + Math.sin(a) * d * wz;
      lotusPad(s, x, z, range(0.095, 0.205), -0.631 + range(0, 0.009));
      if (i % 7 === 2) lotusFlower(s, x + range(0.052, 0.12), z + range(-0.11, -0.04), range(0.82, 1.2));
    }
    s.finish(label, { shadows: false, kind: 'lotus' });
  }
  lotusBed(1.76, 4.64, 18, 1.14, 0.55, 'White lotus in the old ferry pool');
  lotusBed(-3.5, 4.4, 13, 0.73, 0.4, 'Lotus and lily pads below the west bank');
  lotusBed(6.92, -2.01, 17, 0.86, 0.56, 'Lotus beneath the ferry house');
  lotusBed(8.06, 4.89, 13, 0.91, 0.48, 'Lotus beyond the eastern cove');

  function lowIslet(x, z, rx, rz, vegetation, label) {
    const s = new Surface();
    const angle = range(0, TAU);
    stoneBlock(s, x, -0.53, z, rx, range(0.57, 0.83), rz, angle, 0.8, true);
    for (let i = 0; i < 9; i++) {
      const a = (i * TAU) / 9 + range(-0.31, 0.31),
        d = range(0.71, 1.27);
      stoneBlock(
        s,
        x + Math.cos(a) * rx * d,
        -0.55 + range(-0.17, 0.06),
        z + Math.sin(a) * rz * d,
        range(0.18, 0.56),
        range(0.22, 0.75),
        range(0.19, 0.53),
        range(0, TAU),
        0.66,
        true
      );
    }
    if (vegetation) {
      pine(s, x + 0.03, -0.23, z, 0.71 * vegetation, range(0, TAU), true);
      for (let i = 0; i < 5; i++)
        tuft(s, x + range(-0.26, 0.26), -0.29, z + range(-0.21, 0.21), 0.31, 8, 0.08);
    }
    s.finish(label, { kind: 'islet' });
  }
  lowIslet(-7.9, 2.68, 0.84, 0.66, 0.87, 'Pine on the western river rocks');
  lowIslet(-5.54, 8.52, 1.28, 0.78, 0.64, 'Low polished islet in the main channel');
  lowIslet(2.74, 10.89, 1.19, 0.66, 0, 'Outlying southern river rocks');
  lowIslet(9.37, -6.9, 0.98, 0.79, 1.1, 'Pine on the distant northeast islet');
  lowIslet(-8.9, -7.37, 1.27, 1.0, 1.19, 'Twin crags off the headland');
  lowIslet(11.89, 7.4, 0.88, 0.94, 0.91, 'Low rocks beyond the eastern inlet');

  // Ground patinas follow the actual triangulated top of their bank. These
  // are irregular connected fragments of moss and exposed grit, not decals.
  const savedSeed = seed;
  function meadow(coast, bounds, count, name) {
    const s = new Surface();
    const allowed = (x, z) => Math.abs(x) > 3.52 || Math.abs(z) > 3.52;
    for (let i = 0; i < count; i++) {
      const cx = range(bounds[0], bounds[1]),
        cz = range(bounds[2], bounds[3]);
      if (!allowed(cx, cz)) continue;
      const sample = coast.topAt(cx, cz);
      if (!sample) continue;
      const radius = range(0.11, 0.46),
        w = radius * range(0.54, 1.1),
        angle = range(0, TAU);
      const n = 9,
        ring = [],
        colors = [];
      const tint = choose([0x8a865e, 0x757e50, 0x625f48, 0x9a9169, 0x858b58, 0x898e59]);
      for (let j = 0; j < n; j++) {
        const a = (j * TAU) / n + angle,
          k = range(0.64, 1.12);
        const x = cx + Math.cos(a) * radius * k,
          z = cz + Math.sin(a) * w * k;
        const edge = coast.topAt(x, z);
        if (!edge || !allowed(x, z)) break;
        ring.push([x, edge.y + 0.0052, z]);
        colors.push(mix(edge.color, tint, range(0.1, 0.28)));
      }
      if (ring.length !== n) continue;
      const mid = [cx, sample.y + 0.0075, cz],
        center = mix(sample.color, tint, range(0.43, 0.67));
      for (let j = 0; j < n; j++)
        s.tri(mid, ring[(j + 1) % n], ring[j], center, colors[(j + 1) % n], colors[j]);
      if (i % 3 !== 1) continue;
      const gravelCount = Math.floor(range(3, 8));
      for (let k = 0; k < gravelCount; k++) {
        const a = range(0, TAU),
          off = range(0.05, 0.4),
          x = cx + Math.cos(a) * off,
          z = cz + Math.sin(a) * off;
        const g = coast.topAt(x, z);
        if (!g || !allowed(x, z)) continue;
        const rad = range(0.012, 0.056),
          short = rad * range(0.45, 0.86),
          yaw = range(0, TAU),
          pebble = [];
        const tone = mix(choose(greys), g.color, 0.46),
          shine = mix(tone, 0xb4b29a, 0.2);
        for (let j = 0; j < 5; j++) {
          const v = ((j + range(-0.14, 0.14)) * TAU) / 5,
            u = Math.cos(v) * rad,
            w = Math.sin(v) * short;
          pebble.push([
            x + u * Math.cos(yaw) - w * Math.sin(yaw),
            g.y + 0.008,
            z + u * Math.sin(yaw) + w * Math.cos(yaw)
          ]);
        }
        const apex = [x + 0.14 * rad, g.y + 0.008 + rad * 0.21, z];
        for (let j = 0; j < 5; j++) s.tri(pebble[j], apex, pebble[(j + 1) % 5], tone, shine, tone);
      }
    }
    s.finish(name, { kind: 'groundcover', shadows: false });
  }
  meadow(main, [-6.41, 7.02, -7.47, 3.76], 410, 'Patches of thyme moss and river gravel');
  meadow(east, [6.8, 11.6, -1.5, 4.88], 115, 'Sunlit moss between the eastern stones');

  // Broad, soft drifts of deep moss and warm bare soil break up the open bank
  // tops. Each drift has an inner ring so it follows the ground it lies on.
  function groundTones(coast, bounds, count, name) {
    const s = new Surface();
    const allowed = (x, z) => Math.abs(x) > 3.52 || Math.abs(z) > 3.52;
    const tones = [0x4f5f39, 0x5a6b40, 0x667749, 0x8a7a54, 0x7b6a48, 0x5f7050];
    for (let i = 0; i < count; i++) {
      const cx = jitter(bounds[0], bounds[1]),
        cz = jitter(bounds[2], bounds[3]);
      const centre = coast.topAt(cx, cz);
      if (!centre || !allowed(cx, cz)) continue;
      const radius = jitter(0.35, 0.85),
        squash = jitter(0.5, 1),
        turn = jitter(0, TAU);
      const tint = tones[Math.floor(jitter(0, tones.length))],
        strength = jitter(0.34, 0.6);
      const n = 11,
        rings = [[], []],
        paints = [[], []];
      let whole = true;
      for (let j = 0; j < n && whole; j++) {
        const a = (j * TAU) / n,
          k = jitter(0.7, 1.15);
        for (const [r, f] of [
          [0, 0.5],
          [1, 1]
        ]) {
          const lx = Math.cos(a) * radius * k * f,
            lz = Math.sin(a) * radius * squash * k * f;
          const x = cx + lx * Math.cos(turn) - lz * Math.sin(turn),
            z = cz + lx * Math.sin(turn) + lz * Math.cos(turn);
          const g = coast.topAt(x, z);
          if (!g || !allowed(x, z)) {
            whole = false;
            break;
          }
          rings[r].push([x, g.y + 0.0035, z]);
          paints[r].push(mix(g.color, tint, strength * (r ? 0.2 : 0.75)));
        }
      }
      if (!whole) continue;
      const mid = [cx, centre.y + 0.0035, cz],
        core = mix(centre.color, tint, strength);
      for (let j = 0; j < n; j++) {
        const k = (j + 1) % n;
        s.tri(mid, rings[0][k], rings[0][j], core, paints[0][k], paints[0][j]);
        s.quad(
          rings[0][j],
          rings[0][k],
          rings[1][k],
          rings[1][j],
          paints[0][j],
          paints[0][k],
          paints[1][k],
          paints[1][j]
        );
      }
    }
    s.finish(name, { kind: 'groundcover', shadows: false });
  }
  groundTones(main, [-6.41, 7.02, -7.47, 3.76], 150, 'Deep moss and bare soil on the west bank');
  groundTones(east, [6.8, 11.6, -1.5, 4.88], 40, 'Deep moss and bare soil beyond the bridge');

  const shrubs = new Surface();
  const bushColors = [0x526e56, 0x698468, 0x798c63, 0x7d905d, 0x68816a];
  for (const [x, z, sz] of [
    [-4.25, 0.62, 0.43],
    [-4.14, -0.58, 0.48],
    [-4.92, -1.41, 0.56],
    [-4.03, -2.36, 0.38],
    [-4.16, -3.62, 0.51],
    [-3.45, -6.95, 0.48],
    [-1.64, -7.03, 0.38],
    [0.93, -5.47, 0.43],
    [1.77, -4.13, 0.37],
    [3.37, -6.58, 0.52],
    [5.97, -6.38, 0.59],
    [6.46, -4.13, 0.51],
    [7.83, 2.5, 0.34],
    [8.17, 2.83, 0.45],
    [8.72, -0.85, 0.44],
    [10.31, 2.85, 0.62]
  ]) {
    const g = main.topAt(x, z) || east.topAt(x, z);
    if (!g) continue;
    for (let j = 0; j < 7; j++) {
      const a = (j * TAU) / 7 + range(-0.29, 0.29),
        h = sz * range(0.57, 0.96),
        r = sz * range(0.37, 0.82);
      const base = [x, g.y, z],
        end = [x + Math.cos(a) * r, g.y + h, z + Math.sin(a) * r],
        mid = point(base, end, 0.48);
      mid[1] += 0.054;
      const green = choose(bushColors);
      limb(shrubs, [base, mid, end], [sz * 0.027, sz * 0.016, sz * 0.005], 0x737350, 4);
      for (let k = 0; k < 4; k++) {
        const t = 0.35 + 0.18 * k,
          p = point(base, end, t);
        p[1] += 0.044 * Math.sin(t * Math.PI);
        for (const side of [-1, 1]) {
          const ang = a + side * range(0.43, 1.27),
            l = sz * range(0.23, 0.38);
          blade(
            shrubs,
            p,
            [p[0] + Math.cos(ang) * l, p[1] + l * range(-0.11, 0.4), p[2] + Math.sin(ang) * l],
            l * range(0.16, 0.25),
            l * 0.12,
            mix(green, 0x4c674b, 0.38),
            mix(green, 0xa3ae78, range(0.23, 0.52))
          );
        }
      }
    }
  }
  shrubs.finish('Wild tea bushes along the edge of the clearing', { kind: 'groundcover' });
  const rushes = new Surface();
  for (const [x, z] of [
    [-3.99, 3.73],
    [-3.15, 4.18],
    [1.19, 4.15],
    [3.93, 3.35],
    [6.87, 2.99],
    [6.73, -2.42],
    [8.23, 4.28],
    [-5.87, -0.66]
  ]) {
    const reedCount = Math.floor(range(4, 8));
    for (let j = 0; j < reedCount; j++) {
      const a = range(0, TAU),
        d = range(0.04, 0.28),
        px = x + Math.cos(a) * d,
        pz = z + Math.sin(a) * d;
      const h = range(0.38, 0.68),
        sx = range(-0.08, 0.08),
        sz = range(-0.09, 0.09),
        top = [px + sx, -0.7 + h, pz + sz];
      const bot = [px, -0.71, pz],
        mid = point(bot, top, 0.64);
      limb(rushes, [bot, mid, top], [0.01, 0.007, 0.004], 0x8b9862, 4);
      const end = [top[0] + sx * 0.16, top[1] + 0.12, top[2] + sz * 0.16],
        base = point(top, end, 0.11),
        high = point(top, end, 0.9);
      limb(
        rushes,
        [top, base, high, end],
        [0.008, 0.022, 0.02, 0.005],
        choose([0x755c43, 0x806348, 0x926f4d]),
        6
      );
    }
    tuft(rushes, x, -0.7, z, 0.43, 10, 0.14, true);
  }
  rushes.finish('Cattails in the sheltered shallows', { kind: 'groundcover', shadows: false });
  seed = savedSeed;

  // Irregular lofts expose limestone ribs within asymmetric, vegetated karst
  // ridges. Overlapping peaks leave channels and glimpses of the next range.
  const hillPalettes = [
    { base: 0x63796d, face: 0x839181, rock: 0x989b87, leaf: 0x72856d, head: 0x85937a },
    { base: 0x768c80, face: 0x909e90, rock: 0xa1a697, leaf: 0x879882, head: 0x9da78f },
    { base: 0x92a59b, face: 0xa7b3a7, rock: 0xb7beb0, leaf: 0xa1b09e, head: 0xb3bcac }
  ];
  function peak(s, x, z, rx, rz, height, yaw, palette, near) {
    const n = near ? 17 : 14,
      phase = range(0, TAU),
      f2 = range(0, TAU),
      f3 = range(0, TAU);
    const rough = Array.from({ length: n }, () => range(0.93, 1.07));
    const rib = Array.from({ length: n }, () => range(-0.15, 0.6));
    // Vertical streaks of wet and dry limestone, and a dark wooded skirt at the water.
    const streak = Array.from({ length: n }, () => jitter(near ? 0.78 : 0.84, 1.12)),
      forest = mix(palette.base, 0x3f5749, near ? 0.5 : 0.25);
    const tipX = range(-0.27, 0.27),
      tipZ = range(-0.32, 0.32),
      ca = Math.cos(yaw),
      sa = Math.sin(yaw);
    const shoulder = range(0.9, 1.18),
      ascent = range(0.7, 1.2);
    let previous, previousColors;
    for (const [v, r] of [
      [0, 1],
      [0.11, 0.94],
      [0.27, 0.79],
      [0.49, 0.64],
      [0.65, 0.58],
      [0.8, 0.47],
      [0.93, 0.32],
      [0.971, 0.2],
      [1, 0.065]
    ]) {
      const ring = [],
        colors = [];
      for (let i = 0; i < n; i++) {
        const a = (i * TAU) / n,
          crease =
            Math.sin(a * 3 + phase) * 0.11 + Math.sin(a * 5 + f3) * 0.07 + Math.cos(a * 2 + f2) * 0.12;
        const radius = Math.pow(r, ascent) * (1 + crease * (0.8 + v * 0.5)) * rough[i];
        const u = Math.cos(a) * radius * rx + rx * tipX * v * v,
          w = Math.sin(a) * radius * rz + rz * tipZ * v;
        const lip =
          (Math.sin(a * 2.0 + phase + v * 1.4) * 0.041 + Math.sin(a * 4.0 + f2) * 0.024) *
          Math.sin(v * Math.PI);
        ring.push([
          x + u * ca - w * sa,
          -0.92 + height * (Math.pow(v, shoulder) + lip),
          z + u * sa + w * ca
        ]);
        const rocky = Math.max(0, Math.min(1, rib[i] + 0.28 * Math.sin(a * 2 + phase + v * 4.1)));
        let green = mix(palette.base, palette.face, Math.min(1, 0.16 + v * 0.76));
        if (v > 0.7) green = mix(green, palette.leaf, 0.42);
        if (v > 0.91) green = mix(green, palette.head, 0.48);
        if (v < 0.12) green = mix(green, forest, 0.75);
        const tone = mix(green, palette.rock, Math.min(0.72, rocky * (v > 0.8 ? 0.47 : 1.0)));
        const k = v > 0.05 ? streak[i] : 1;
        colors.push(tone.map((channel) => Math.min(1, channel * k)));
      }
      if (previous)
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          s.quad(
            previous[i],
            ring[i],
            ring[j],
            previous[j],
            previousColors[i],
            colors[i],
            colors[j],
            previousColors[j]
          );
        }
      previous = ring;
      previousColors = colors;
    }
    const u = rx * tipX,
      w = rz * tipZ,
      top = [x + u * ca - w * sa, -0.92 + height + 0.025, z + u * sa + w * ca];
    for (let i = 0; i < n; i++)
      s.tri(
        previous[i],
        top,
        previous[(i + 1) % n],
        previousColors[i],
        palette.head,
        previousColors[(i + 1) % n]
      );
    return top;
  }
  const rings = [
    { radius: 17.8, groups: 8, peakLo: 2, peakHi: 4, sz: [1.82, 3.65], h: [2.45, 4.72] },
    { radius: 25.7, groups: 10, peakLo: 2, peakHi: 5, sz: [2.3, 4.25], h: [3.7, 7.92] },
    { radius: 34.6, groups: 11, peakLo: 3, peakHi: 5, sz: [2.5, 4.8], h: [4.9, 9.45] }
  ];
  for (let tier = 0; tier < rings.length; tier++) {
    const r = rings[tier],
      p = hillPalettes[tier];
    const hills = new Surface();
    const phase = tier * 0.37 + range(0, 0.21);
    for (let j = 0; j < r.groups; j++) {
      const a = (j * TAU) / r.groups + phase + range(-0.1, 0.1),
        rr = r.radius + range(-1.3, 1.4);
      const sideX = -Math.sin(a),
        sideZ = Math.cos(a),
        centerX = Math.cos(a) * rr,
        centerZ = Math.sin(a) * rr;
      const n = Math.floor(range(r.peakLo, r.peakHi + 0.99));
      for (let i = 0; i < n; i++) {
        const shift = (i - (n - 1) / 2) * range(1.59, 2.8) + range(-0.51, 0.51),
          depth = range(-1.19, 1.3);
        const x = centerX + sideX * shift + Math.cos(a) * depth,
          z = centerZ + sideZ * shift + Math.sin(a) * depth;
        const size = range(...r.sz),
          h = range(...r.h) * (i === Math.floor(n / 2) ? 1.12 : 0.94);
        const tip = peak(
          hills,
          x,
          z,
          size * range(0.81, 1.18),
          size * range(0.64, 1.03),
          h,
          a + range(-0.91, 0.91),
          p,
          tier === 0
        );
        if (tier === 0 && rand() < 0.37)
          pine(hills, tip[0], tip[1] - 0.019, tip[2], range(0.19, 0.37), range(0, TAU), true);
      }
      if (tier === 0) {
        const x = centerX - Math.cos(a) * 2.22,
          z = centerZ - Math.sin(a) * 2.22;
        peak(hills, x, z, range(1.6, 2.36), range(1.12, 1.83), range(1.49, 2.37), a, p, true);
      }
    }
    hills.finish(
      [
        'Limestone hills across the river',
        'Jade karst middle distance',
        'Pale mountains at the horizon'
      ][tier],
      {
        distant: true,
        shadows: false,
        kind: 'mountains'
      }
    );
  }
  return landscape;
}

export { buildLandscape };
