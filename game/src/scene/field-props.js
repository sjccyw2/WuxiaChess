// Hand-modelled terrain details. All positions are in tactical tile units.
function buildFieldProps(T, cells, center) {
  const group = new T.Group();
  group.name = '渡口地形';
  const batches = [];
  function batch(name, roughness, metalness, shadow) {
    const b = { name, roughness, metalness, shadow, p: [], c: [], i: [] };
    batches.push(b);
    return b;
  }
  const solid = batch('湖石、橋板與茶箱', 0.91, 0.012, true);
  const foliage = batch('竹葉、蘆草與藥花', 0.87, 0, true);
  const water = batch('淺灘水色與波紋', 0.4, 0.11, false);
  const colorCache = new Map();
  const up = [0, 1, 0];
  const pi = Math.PI,
    tau = pi * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const v = (x, y, z) => [x, y, z];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const norm = (a) => {
    const d = Math.hypot(...a) || 1;
    return [a[0] / d, a[1] / d, a[2] / d];
  };
  let frameX = 0,
    frameZ = 0,
    angle = 0,
    cs = 1,
    sn = 0;
  let seed = 1;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const between = (a, b) => lerp(a, b, random());
  const pick = (list) => list[Math.floor(random() * list.length)];
  const tileKinds = new Map(cells.map((c) => [c.x + ',' + c.y, c.kind]));
  const kindAt = (x, z) => tileKinds.get(x + ',' + z);

  function setFrame(x, z, a) {
    frameX = x;
    frameZ = z;
    angle = a;
    cs = Math.cos(a);
    sn = Math.sin(a);
  }
  function local(x, z, a, build) {
    const ox = frameX,
      oz = frameZ,
      oa = angle;
    setFrame(ox + x * cs - z * sn, oz + x * sn + z * cs, oa + a);
    build();
    setFrame(ox, oz, oa);
  }

  function color(hex) {
    let c = colorCache.get(hex);
    if (!c) {
      c = new T.Color(hex);
      colorCache.set(hex, c);
    }
    return c;
  }
  function face(b, verts, colors, outward = up, light = 1) {
    const start = b.p.length / 3;
    const n = cross(sub(verts[1], verts[0]), sub(verts[2], verts[0]));
    const reverse = dot(n, outward) < 0;
    for (let i = 0; i < verts.length; i++) {
      const [x, y, z] = verts[i],
        c = color(Array.isArray(colors) ? colors[i] : colors);
      b.p.push(frameX + x * cs - z * sn, y, frameZ + x * sn + z * cs);
      b.c.push(c.r * light, c.g * light, c.b * light);
    }
    for (let i = 1; i < verts.length - 1; i++) {
      if (reverse) b.i.push(start, start + i + 1, start + i);
      else b.i.push(start, start + i, start + i + 1);
    }
  }

  function box(b, x, y, z, w, h, d, col) {
    const l = x - w / 2,
      r = x + w / 2,
      n = z - d / 2,
      s = z + d / 2,
      lo = y - h / 2,
      hi = y + h / 2;
    face(b, [v(l, hi, n), v(l, hi, s), v(r, hi, s), v(r, hi, n)], col);
    face(b, [v(l, lo, s), v(r, lo, s), v(r, hi, s), v(l, hi, s)], col, [0, 0, 1], 0.95);
    face(b, [v(l, lo, n), v(l, hi, n), v(r, hi, n), v(r, lo, n)], col, [0, 0, -1], 0.93);
    face(b, [v(l, lo, n), v(l, lo, s), v(l, hi, s), v(l, hi, n)], col, [-1, 0, 0], 0.92);
    face(b, [v(r, lo, n), v(r, hi, n), v(r, hi, s), v(r, lo, s)], col, [1, 0, 0], 0.97);
  }
  function rod(b, a, e, r0, r1, col, sides = 5, cap = false) {
    const axis = norm(sub(e, a));
    const u = norm(cross(Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : up, axis));
    const w = cross(axis, u),
      rad = [],
      low = [],
      high = [];
    for (let i = 0; i < sides; i++) {
      const t = (tau * i) / sides,
        c = Math.cos(t),
        s = Math.sin(t);
      const d = u.map((k, j) => k * c + w[j] * s);
      rad.push(d);
      low.push(a.map((k, j) => k + r0 * d[j]));
      high.push(e.map((k, j) => k + r1 * d[j]));
    }
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      face(b, [low[i], low[j], high[j], high[i]], col, rad[i]);
    }
    if (cap) face(b, high, col, axis, 1.03);
  }
  function swatch(b, x, z, rx, rz, y, col) {
    const outline = [];
    for (let i = 0; i < 8; i++) {
      const t = (i * pi) / 4,
        mag = between(0.86, 1);
      outline.push(v(x + Math.cos(t) * rx * mag, y, z + Math.sin(t) * rz * mag));
    }
    face(b, outline, col);
  }

  const mosses = [0x708352, 0x7f905d, 0x87935e, 0x657d55];
  const rockHues = [0x809187, 0x93a095, 0x89978d, 0x9ca599, 0x74887f];
  const lightStone = [0x9eaa9b, 0xa6ad9d, 0xb0b19f, 0x95a49a];
  const grass = [0x56805a, 0x729558, 0x76965b, 0x849b61];
  const leafDeep = [0x397359, 0x407956, 0x568658, 0x638e5b];
  const leafLit = [0x72a266, 0x87a667, 0x86aa70, 0x7d9b58];
  const bambooStem = [0x7e995c, 0x799958, 0x739256, 0x829c5f];
  const reedHues = [0x8a9b60, 0x839655, 0xa0a96c, 0x80915b];
  const petalTones = [0xd9d6b8, 0xd1c6d8, 0xc6afd4, 0xd7c4db, 0xe3d9be];
  const wood = [0x967247, 0xa17b4d, 0xa98456, 0x9f7a4d, 0xb18b58];

  // A faceted clast with a chipped shoulder and occasional moss on its crown.
  function clast(x, z, rx, rz, height, rocky, moss = false, base = 0.051) {
    const n = rocky ? 8 : 6,
      phi = random() * tau;
    const offsetX = between(-0.16, 0.16) * rx,
      offsetZ = between(-0.15, 0.15) * rz;
    const bottom = [],
      shoulder = [],
      crown = [];
    for (let i = 0; i < n; i++) {
      const a = (tau * i) / n + phi + between(-0.105, 0.105),
        rr = between(0.91, 1.06),
        dx = Math.cos(a) * rr,
        dz = Math.sin(a) * rr;
      bottom.push(v(x + rx * dx * 0.88, base, z + rz * dz * 0.88));
      shoulder.push(v(x + rx * dx, base + height * between(0.21, 0.47), z + rz * dz));
      const f = between(0.47, 0.73);
      crown.push(
        v(x + offsetX + rx * dx * f, base + height * between(0.73, 0.92), z + offsetZ + rz * dz * f)
      );
    }
    const top = v(x + offsetX, base + height, z + offsetZ);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        p = shoulder[i],
        out = v(p[0] - x, 0.12, p[2] - z),
        c = pick(rockHues);
      face(solid, [bottom[i], bottom[j], shoulder[j], shoulder[i]], c, out, 0.81);
      face(
        solid,
        [shoulder[i], shoulder[j], crown[j], crown[i]],
        moss && i % 5 === 1 ? pick(mosses) : c,
        out
      );
      face(solid, [crown[i], crown[j], top], moss && i % 5 !== 1 ? pick(mosses) : pick(lightStone));
    }
  }

  // Folded leaves have a raised midrib and two independently shaded surfaces.
  function leaf(b, start, dx, dy, dz, halfWidth, arch, shade, lit) {
    const [x, y, z] = start,
      d = Math.hypot(dx, dz) || 1,
      vx = -dz / d,
      vz = dx / d;
    const tip = v(x + dx, y + dy, z + dz),
      mid = v(x + dx * 0.46, y + dy * 0.46 + arch, z + dz * 0.46);
    const left = v(mid[0] + vx * halfWidth, mid[1] - 0.011, mid[2] + vz * halfWidth);
    const right = v(mid[0] - vx * halfWidth, mid[1] - 0.011, mid[2] - vz * halfWidth);
    face(b, [start, left, mid], shade);
    face(b, [left, tip, mid], shade);
    face(b, [start, mid, right], lit);
    face(b, [mid, tip, right], lit);
  }

  function bamboo() {
    local(0, 0, (Math.floor(random() * 4) * pi) / 2, () => {
      const sites = [
        [-0.276, -0.267],
        [-0.143, -0.319],
        [0.25, -0.272]
      ];
      for (let i = 0; i < sites.length; i++) {
        const x = sites[i][0] + between(-0.024, 0.024),
          z = sites[i][1] + between(-0.019, 0.019);
        const h = i === 0 ? between(0.56, 0.65) : between(0.36, 0.54);
        const leanX = between(-0.042, 0.039),
          leanZ = between(-0.036, 0.025),
          bark = pick(bambooStem);
        const p = (t) => v(x + leanX * t, 0.058 + h * t, z + leanZ * t);
        swatch(foliage, x, z, i === 0 ? 0.122 : 0.092, 0.067, 0.058, 0x738365);
        rod(foliage, p(0), p(1), i === 0 ? 0.018 : 0.014, 0.01, bark, 6, true);
        for (const t of [0.21, 0.48, 0.76]) {
          const r = (1 - t) * 0.007 + 0.015;
          rod(foliage, p(t), p(t + 0.018), r, r * 0.98, 0xa2aa6c, 6);
          if (t < 0.4) continue;
          const dir = between(0, tau),
            l = between(0.055, 0.091),
            a = p(t + 0.02);
          const end = v(a[0] + l * Math.cos(dir), a[1] + h * 0.1, a[2] + l * Math.sin(dir));
          rod(foliage, a, end, 0.007, 0.004, 0x627f4a, 4);
          for (let j = 0; j < 5; j++) {
            const phi = dir + (j - 2) * 0.61 + between(-0.19, 0.19),
              len = between(0.09, 0.153);
            const tipX = Math.max(-0.477, Math.min(0.477, end[0] + len * Math.cos(phi)));
            const tipZ = Math.max(-0.477, Math.min(0.477, end[2] + len * Math.sin(phi)));
            leaf(
              foliage,
              end,
              tipX - end[0],
              between(-0.048, 0.017),
              tipZ - end[2],
              between(0.015, 0.023),
              0.018,
              pick(leafDeep),
              pick(leafLit)
            );
          }
        }
        const p1 = p(0.9);
        leaf(foliage, p1, 0.054, 0.087, -0.037, 0.018, 0.012, pick(leafDeep), pick(leafLit));
        leaf(foliage, p1, -0.072, 0.059, 0.031, 0.017, 0.018, pick(leafDeep), pick(leafLit));
      }
      for (let i = 0; i < 4; i++) {
        const x = between(-0.34, 0.32),
          z = between(-0.42, -0.29),
          phi = between(0, tau);
        leaf(
          foliage,
          v(x, 0.06, z),
          0.067 * Math.cos(phi),
          0.001,
          0.067 * Math.sin(phi),
          0.01,
          0.004,
          0x94884f,
          0xa9a46a
        );
      }
    });
  }

  function plantingBed(cell) {
    const bamboo = cell.kind === 'bamboo';
    const earth = bamboo ? 0x536443 : 0x756549;
    const moss = bamboo ? 0x647d51 : 0x708553;
    const rim = [],
      inner = [];
    for (let k = 0; k < 16; k++) {
      const a = (k * tau) / 16,
        cx = Math.cos(a),
        cz = Math.sin(a);
      const bound = Math.max(Math.abs(cx), Math.abs(cz));
      const dx = Math.abs(cx) > 0.55 ? Math.sign(cx) : 0;
      const dz = Math.abs(cz) > 0.55 ? Math.sign(cz) : 0;
      const linked = kindAt(cell.x + dx, cell.y + dz) === cell.kind;
      const distance = (linked ? 0.498 : between(0.39, 0.46)) / bound;
      const x = cx * distance,
        z = cz * distance;
      rim.push(v(x, 0.055, z));
      inner.push(v(x * 0.81, 0.062 + 0.003 * random(), z * 0.81));
    }
    for (let k = 0; k < rim.length; k++) {
      const j = (k + 1) % rim.length;
      face(foliage, [rim[k], rim[j], inner[j], inner[k]], [earth, earth, moss, moss]);
      face(foliage, [inner[k], inner[j], v(0, 0.065, 0)], [moss, moss, earth]);
    }
    // Low leaf litter leaves space to read a fighter's feet on a planted tile.
    for (let i = 0; i < 12; i++) {
      const x = between(-0.32, 0.32),
        z = between(-0.32, 0.32),
        phi = random() * tau;
      const length = between(0.033, 0.082);
      leaf(
        foliage,
        v(x, 0.066, z),
        Math.cos(phi) * length,
        0.003,
        Math.sin(phi) * length,
        0.009,
        0.003,
        0x657750,
        bamboo ? 0x95a36b : 0x9d9972
      );
    }
  }

  const isChannel = (k) => k === 'bridge' || k === 'reeds';
  function channel(cell) {
    const west = isChannel(kindAt(cell.x - 1, cell.y)),
      east = isChannel(kindAt(cell.x + 1, cell.y));
    const north = isChannel(kindAt(cell.x, cell.y - 1)),
      south = isChannel(kindAt(cell.x, cell.y + 1));
    const ts = [0, 0.17, 0.35, 0.52, 0.68, 0.84, 1],
      us = [0, 0.15, 0.4, 0.66, 0.87, 1];
    function bankX(z, s) {
      if ((s < 0 && west) || (s > 0 && east)) return s * 0.5;
      const edgeX = cell.x + 0.5 * s;
      const ripple = 0.019 * Math.sin(z * 5.03 + edgeX * 2.31) + 0.012 * Math.sin(z * 7.14 - edgeX);
      return s * (0.444 + ripple);
    }
    function sample(u, t) {
      const z = t - 0.5,
        waveZ = cell.y + z,
        edge = Math.abs(2 * u - 1);
      let zz = z;
      if (!north) zz += (1 - t) ** 4 * (0.006 + 0.067 * edge ** 3);
      if (!south) zz -= t ** 4 * (0.006 + 0.067 * edge ** 3);
      const current =
        u +
        Math.sin(pi * u) *
          (0.03 * Math.sin(waveZ * 4.8 + cell.x) + 0.013 * Math.sin(waveZ * 8.2 - cell.x));
      return v(lerp(bankX(waveZ, -1), bankX(waveZ, 1), current), 0.0605, zz);
    }
    const bands = [0x658676, 0x467e77, 0x306966, 0x367773, 0x55867d, 0x708e77];
    for (let ti = 0; ti < ts.length - 1; ti++)
      for (let ui = 0; ui < us.length - 1; ui++) {
        const u0 = us[ui],
          u1 = us[ui + 1],
          t0 = ts[ti],
          t1 = ts[ti + 1];
        face(
          water,
          [sample(u0, t0), sample(u1, t0), sample(u1, t1), sample(u0, t1)],
          [bands[ui], bands[ui + 1], bands[ui + 1], bands[ui]],
          up,
          1 + 0.025 * Math.sin((cell.y + t0) * 5)
        );
      }
    for (const s of [-1, 1]) {
      if (s < 0 ? west : east) continue;
      for (let i = 0; i < 4; i++) {
        const z = -0.375 + i * 0.25;
        box(
          solid,
          s * 0.468,
          0.07,
          z,
          0.06,
          between(0.027, 0.048),
          between(0.224, 0.244),
          pick([0x526754, 0x627566, 0x727d69, 0x64796b])
        );
      }
      for (let i = 0; i < ts.length - 1; i++) {
        const a = sample(s < 0 ? 0 : 1, ts[i]),
          d = sample(s < 0 ? 0 : 1, ts[i + 1]);
        const b = v(s * Math.min(0.5, Math.abs(a[0]) + 0.033), 0.0568, a[2]),
          c = v(s * Math.min(0.5, Math.abs(d[0]) + 0.033), 0.0568, d[2]);
        face(water, [a, b, c, d], i % 3 === 0 ? 0x8e9b7f : 0x81927e);
      }
    }
    for (let i = 0; i < (cell.kind === 'bridge' ? 2 : 5); i++) {
      const x = between(-0.34, 0.33),
        z = between(-0.365, 0.33),
        len = between(0.065, 0.155);
      const w = between(0.005, 0.01),
        bend = between(0.01, 0.018);
      face(
        water,
        [
          v(x, 0.064, z - len / 2),
          v(x + w + bend, 0.0645, z),
          v(x + 0.007, 0.064, z + len / 2),
          v(x + bend, 0.0645, z)
        ],
        pick([0x8fbbb0, 0x8cb5a6, 0x7daea3])
      );
    }
  }

  function reeds() {
    for (const s of [-1, 1]) {
      const x = s * between(0.292, 0.355),
        z = between(-0.24, 0.23);
      for (let i = 0; i < 7; i++) {
        const xx = x + between(-0.054, 0.054),
          zz = z + between(-0.071, 0.071),
          phi = between(0, tau),
          r = between(0.036, 0.083);
        leaf(
          foliage,
          v(xx, 0.061, zz),
          Math.cos(phi) * r,
          between(0.098, 0.239),
          Math.sin(phi) * r,
          0.009,
          0.018,
          pick(grass),
          pick(reedHues)
        );
      }
      for (let i = 0; i < 2; i++) {
        const a = v(x + between(-0.04, 0.04), 0.064, z + between(-0.048, 0.048));
        const e = v(a[0] + between(-0.038, 0.038), between(0.245, 0.338), a[2] + between(-0.042, 0.042));
        rod(foliage, a, e, 0.0055, 0.004, 0x9ba263, 4);
        const d = sub(e, a),
          base = v(e[0] - d[0] * 0.16, e[1] - d[1] * 0.16, e[2] - d[2] * 0.16);
        rod(foliage, base, e, 0.012, 0.008, pick([0x9d8255, 0xa58d5e, 0xb5a270]), 5, true);
      }
      for (let i = 0; i < 2; i++) {
        const px = s * between(0.28, 0.382),
          pz = between(-0.38, 0.38),
          r = between(0.025, 0.048);
        clast(px, pz, r, r * 0.66, r * 0.56, false, false, 0.061);
      }
    }
  }

  function footbridge(cell) {
    const northSouth = 0.325,
      planks = 9,
      continuousLeft = kindAt(cell.x - 1, cell.y) === 'bridge',
      continuousRight = kindAt(cell.x + 1, cell.y) === 'bridge';
    for (const s of [-1, 1]) box(solid, 0, 0.067, s * 0.248, 0.995, 0.024, 0.049, 0x705a41);
    for (let j = 0; j < planks; j++) {
      const x = -0.5 + (j + 0.5) / planks,
        top = 0.089 + 0.0015 * Math.cos(j * 1.2),
        depth = 0.696 + between(-0.012, 0.014);
      box(solid, x, top - 0.012, 0, 1 / planks - 0.006, 0.024, depth, pick(wood));
      for (const s of [-1, 1]) {
        const px = x + s * 0.025,
          pz = s * 0.237;
        face(
          solid,
          [
            v(px - 0.008, top + 0.001, pz),
            v(px, top + 0.001, pz - 0.009),
            v(px + 0.008, top + 0.001, pz),
            v(px, top + 0.001, pz + 0.009)
          ],
          0x68573f
        );
      }
      if (j % 2 === 1) {
        const len = between(0.1, 0.22),
          z = between(-0.095, 0.025);
        face(
          solid,
          [
            v(x - 0.026, top + 0.001, z),
            v(x - 0.02, top + 0.001, z + 0.038),
            v(x - 0.028, top + 0.001, z + len)
          ],
          0x8c6b48
        );
      }
    }
    for (const s of [-1, 1]) {
      const z = s * northSouth;
      for (const x of [-0.424, 0.424]) {
        if ((x < 0 && continuousLeft) || (x > 0 && continuousRight)) continue;
        rod(solid, v(x, 0.065, z), v(x, 0.246, z), 0.024, 0.021, 0x896c47, 6, true);
        rod(solid, v(x, 0.188, z), v(x, 0.209, z), 0.026, 0.026, 0xc8ac77, 6);
      }
      const x1 = continuousLeft ? -0.5 : -0.424,
        x2 = continuousRight ? 0.5 : 0.424;
      const h1 = continuousLeft ? 0.19 : 0.208,
        h2 = continuousRight ? 0.19 : 0.208;
      const left = v(x1, h1, z),
        mid = v(0, 0.163, z),
        right = v(x2, h2, z);
      rod(solid, left, mid, 0.011, 0.01, 0xc6a775, 5);
      rod(solid, mid, right, 0.01, 0.011, 0xc6a775, 5);
    }
  }

  function medicinalHerbs() {
    local(0, 0, (Math.floor(random() * 4) * pi) / 2, () => {
      const sites = [
        [-0.29, -0.26],
        [0.2, -0.34],
        [0.33, 0.18]
      ];
      for (let i = 0; i < sites.length; i++) {
        const x = sites[i][0] + between(-0.025, 0.025),
          z = sites[i][1] + between(-0.023, 0.023);
        const size = i === 0 ? 1 : 0.8,
          count = i === 0 ? 8 : 6;
        swatch(foliage, x, z, 0.11 * size, 0.073 * size, 0.058, 0x7b8b69);
        for (let j = 0; j < count; j++) {
          const p = (tau * j) / count + between(-0.19, 0.19),
            r = between(0.078, 0.131) * size;
          leaf(
            foliage,
            v(x, 0.064, z),
            Math.cos(p) * r,
            between(0.032, 0.083) * size,
            Math.sin(p) * r,
            between(0.02, 0.033) * size,
            0.038 * size,
            pick(leafDeep),
            pick(leafLit)
          );
        }
        const blooms = i === 0 ? 3 : 2;
        for (let j = 0; j < blooms; j++) {
          const p = (tau * j) / blooms + between(-0.26, 0.26),
            rad = between(0.024, 0.058) * size;
          const fx = x + Math.cos(p) * rad,
            fz = z + Math.sin(p) * rad,
            fy = between(0.134, 0.186) * size + 0.025;
          rod(foliage, v(x, 0.067, z), v(fx, fy, fz), 0.004, 0.003, 0x668150, 4);
          const rgb = pick(petalTones),
            scale = between(0.8, 1.09) * size;
          for (let k = 0; k < 5; k++) {
            const a = (k * tau) / 5 + 0.3,
              dx = Math.cos(a),
              dz = Math.sin(a),
              wid = 0.017 * scale,
              len = 0.034 * scale;
            face(
              foliage,
              [
                v(fx, fy, fz),
                v(fx + dx * len * 0.68 - dz * wid, fy + 0.008 * scale, fz + dz * len * 0.68 + dx * wid),
                v(fx + dx * len, fy + 0.012 * scale, fz + dz * len),
                v(fx + dx * len * 0.68 + dz * wid, fy + 0.009 * scale, fz + dz * len * 0.68 - dx * wid)
              ],
              rgb
            );
          }
          face(
            foliage,
            [
              v(fx - 0.007, fy + 0.009, fz),
              v(fx, fy + 0.011, fz - 0.008),
              v(fx + 0.007, fy + 0.009, fz),
              v(fx, fy + 0.01, fz + 0.008)
            ],
            0xe7c577
          );
        }
      }
    });
  }

  function scholarsRock() {
    // A pierced Jiangnan limestone body has a through-hole and an eroded upper rim.
    local(0, 0, between(-0.69, 0.69) + (Math.floor(random() * 4) * pi) / 2, () => {
      swatch(solid, 0, 0, 0.352, 0.226, 0.057, 0x72816c);
      const outline = [
        [-0.278, 0.079],
        [-0.32, 0.178],
        [-0.293, 0.255],
        [-0.246, 0.326],
        [-0.215, 0.481],
        [-0.13, 0.502],
        [-0.081, 0.434],
        [0.007, 0.466],
        [0.089, 0.602],
        [0.171, 0.631],
        [0.195, 0.523],
        [0.23, 0.469],
        [0.255, 0.311],
        [0.312, 0.198],
        [0.284, 0.082],
        [0.162, 0.055],
        [0.019, 0.074],
        [-0.143, 0.058]
      ];
      const inner = [
        [-0.146, 0.188],
        [-0.155, 0.221],
        [-0.141, 0.251],
        [-0.122, 0.281],
        [-0.095, 0.314],
        [-0.071, 0.33],
        [-0.048, 0.339],
        [-0.005, 0.345],
        [0.043, 0.347],
        [0.08, 0.338],
        [0.088, 0.31],
        [0.084, 0.275],
        [0.075, 0.243],
        [0.058, 0.204],
        [0.035, 0.18],
        [0.001, 0.159],
        [-0.06, 0.16],
        [-0.111, 0.167]
      ];
      const zFront = [],
        zBack = [],
        iFront = [],
        iBack = [],
        ridge = [];
      const lean = between(-0.125, 0.035),
        lift = between(0.93, 1.06);
      for (let i = 0; i < outline.length; i++) {
        const [x, y] = outline[i],
          [u, h] = inner[i],
          jitter = between(-0.012, 0.015);
        const front = 0.128 - (y - 0.22) * 0.2 + jitter,
          rear = -0.134 - (y - 0.22) * 0.19 - jitter;
        zFront.push(v(x, y * lift, front + lean * y));
        zBack.push(v(x * 0.92 + 0.016, (y + 0.006) * lift, rear + lean * y));
        iFront.push(v(u, h * lift, 0.127 - (h - 0.22) * 0.2 + lean * h));
        iBack.push(v(u * 0.88 + 0.021, (h + 0.016) * lift, -0.109 - (h - 0.22) * 0.18 + lean * h));
        ridge.push(
          v(x * 0.976 + between(-0.013, 0.014), (y + 0.011) * lift, (front + rear) / 2 + lean * y)
        );
      }
      for (let i = 0; i < outline.length; i++) {
        const j = (i + 1) % outline.length,
          c = pick(rockHues);
        face(solid, [zFront[i], zFront[j], iFront[j]], c, [0, 0.13, 1]);
        face(solid, [zFront[i], iFront[j], iFront[i]], i % 4 === 0 ? pick(lightStone) : c, [0, 0.13, 1]);
        face(solid, [iBack[i], iBack[j], zBack[j], zBack[i]], pick(rockHues), [0, 0.11, -1]);
        const radial = v(
          (zFront[i][0] + zFront[j][0]) * 0.5,
          (outline[i][1] + outline[j][1]) * 0.5 - 0.28,
          0
        );
        const topSide = radial[1] > 0.11;
        face(
          solid,
          [zFront[j], zFront[i], ridge[i], ridge[j]],
          topSide && i % 4 !== 1 ? pick(mosses) : pick(lightStone),
          radial
        );
        face(
          solid,
          [ridge[i], zBack[i], zBack[j], ridge[j]],
          topSide && i % 3 === 0 ? pick(mosses) : c,
          radial
        );
        const holeDir = v(-inner[i][0] - 0.025, 0.247 - inner[i][1], 0);
        face(
          solid,
          [iFront[i], iFront[j], iBack[j], iBack[i]],
          i % 4 === 0 ? 0x78877d : 0x6d7f76,
          holeDir,
          0.89
        );
      }
      clast(-0.215, -0.086, 0.172, 0.163, 0.24, true, true);
      clast(0.195, 0.108, 0.152, 0.107, 0.154, true, true);
      clast(0.29, -0.083, 0.088, 0.095, 0.097, false, false);
      for (let i = 0; i < 7; i++) {
        const x = -0.221 + between(-0.05, 0.044),
          z = 0.174 + between(-0.03, 0.033),
          a = between(0, tau);
        leaf(
          foliage,
          v(x, 0.068, z),
          Math.cos(a) * 0.049,
          between(0.033, 0.102),
          Math.sin(a) * 0.05,
          0.008,
          0.013,
          pick(grass),
          pick(leafLit)
        );
      }
    });
  }

  function cargoChest(w, d, h, floor) {
    const dark = 0x74563c,
      timber = 0x886646,
      strap = 0xc3ab78,
      edge = 0xd1b980;
    const top = floor + h,
      thick = 0.032;
    box(solid, 0, floor + h / 2, 0, w, h, d, dark);
    for (let j = 0; j < 4; j++) {
      const x = -w / 2 + ((j + 0.5) * w) / 4;
      box(solid, x, top + 0.003, 0, w / 4 - 0.005, 0.01, d - 0.017, pick(wood));
    }
    for (const s of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const y = floor + ((j + 0.5) * h) / 3;
        box(solid, 0, y, s * (d / 2 + 0.003), w - 0.021, h / 3 - 0.007, 0.011, pick(wood));
        box(solid, s * (w / 2 + 0.003), y, 0, 0.011, h / 3 - 0.007, d - 0.02, pick(wood));
      }
      for (const t of [-1, 1]) {
        box(solid, s * (w / 2 - 0.014), floor + h / 2, (t * d) / 2, thick, h + 0.009, 0.027, timber);
        box(solid, (s * w) / 2, floor + h / 2, t * (d / 2 - 0.013), 0.025, h + 0.01, thick, timber);
      }
      // Cleats carry the corner joints. Two pale split-bamboo lashings wrap each chest.
      box(solid, s * (w / 2 - 0.023), top + 0.012, 0, 0.038, 0.018, d + 0.004, timber);
      const x = s * w * 0.256,
        halfBand = 0.012;
      box(solid, x, top + 0.016, 0, 2 * halfBand, 0.01, d + 0.015, strap);
      for (const zz of [-1, 1]) {
        box(solid, x, floor + h / 2, zz * (d / 2 + 0.012), 2 * halfBand, h + 0.017, 0.01, strap);
        face(
          solid,
          [
            v(x - 0.009, floor + 0.02, zz * (d / 2 + 0.018)),
            v(x - 0.006, floor + 0.02, zz * (d / 2 + 0.018)),
            v(x - 0.006, top + 0.008, zz * (d / 2 + 0.018)),
            v(x - 0.009, top + 0.008, zz * (d / 2 + 0.018))
          ],
          edge,
          [0, 0, zz]
        );
      }
      // Worn brass nails on the paired lid battens.
      for (const z of [-d * 0.32, d * 0.32]) {
        const xx = s * (w / 2 - 0.023),
          y = top + 0.023;
        face(
          solid,
          [v(xx - 0.006, y, z), v(xx, y, z - 0.006), v(xx + 0.006, y, z), v(xx, y, z + 0.006)],
          0x564c3a
        );
      }
    }
    const y = top + 0.022,
      tx = w * 0.04,
      tz = -d * 0.095;
    // An oiled shipping label with the ferryman's small vermilion seal.
    face(
      solid,
      [
        v(tx - 0.047, y, tz - 0.056),
        v(tx + 0.046, y, tz - 0.05),
        v(tx + 0.039, y, tz + 0.063),
        v(tx - 0.052, y, tz + 0.058)
      ],
      0xd4c18d
    );
    face(
      solid,
      [
        v(tx - 0.014, y + 0.0008, tz + 0.028),
        v(tx + 0.02, y + 0.0008, tz + 0.029),
        v(tx + 0.018, y + 0.0008, tz + 0.049),
        v(tx - 0.016, y + 0.0008, tz + 0.047)
      ],
      0xaa5941
    );
    for (let i = 0; i < 3; i++) {
      const zz = tz - 0.032 + i * 0.012;
      face(
        solid,
        [
          v(tx - 0.026, y + 0.0008, zz),
          v(tx + 0.026 - i * 0.005, y + 0.0008, zz + 0.001),
          v(tx + 0.022 - i * 0.005, y + 0.0008, zz + 0.005),
          v(tx - 0.026, y + 0.0008, zz + 0.004)
        ],
        0x827555
      );
    }
    const zK = d / 2 + 0.022,
      xK = w * 0.256;
    rod(
      solid,
      v(xK - 0.007, floor + h * 0.62, zK),
      v(xK + 0.023, floor + h * 0.7, zK + 0.009),
      0.008,
      0.007,
      edge,
      5
    );
    rod(
      solid,
      v(xK + 0.018, floor + h * 0.66, zK + 0.008),
      v(xK + 0.045, floor + h * 0.52, zK + 0.015),
      0.005,
      0.003,
      strap,
      4
    );
  }
  function teaCargo() {
    local(0, 0, (Math.floor(random() * 4) * pi) / 2 + between(-0.07, 0.07), () => {
      const stacked = random() < 0.48;
      if (stacked) {
        local(-0.042, -0.02, 0.045, () => cargoChest(0.577, 0.457, 0.286, 0.053));
        local(-0.079, -0.034, -0.096, () => cargoChest(0.356, 0.308, 0.185, 0.365));
      } else {
        local(-0.042, -0.148, 0.035, () => cargoChest(0.568, 0.342, 0.298, 0.053));
        local(0.073, 0.174, -0.087, () => cargoChest(0.345, 0.231, 0.201, 0.053));
      }
    });
  }

  function stoneCover() {
    local(0, 0, (Math.floor(random() * 4) * pi) / 2, () => {
      swatch(solid, 0, -0.335, 0.372, 0.106, 0.057, 0x78866c);
      clast(-0.179, -0.348, 0.155, 0.107, between(0.135, 0.198), true, true);
      clast(0.048, -0.319, 0.165, 0.103, between(0.181, 0.246), true, true);
      clast(0.247, -0.353, 0.108, 0.075, 0.137, false, true);
      clast(-0.29, -0.294, 0.074, 0.069, 0.078, false, false);
      for (let i = 0; i < 5; i++) {
        const x = between(-0.135, -0.065),
          z = between(-0.365, -0.313),
          a = between(0, tau);
        leaf(
          foliage,
          v(x, 0.113, z),
          0.04 * Math.cos(a),
          between(0.048, 0.108),
          0.04 * Math.sin(a),
          0.008,
          0.013,
          pick(grass),
          pick(leafLit)
        );
      }
    });
  }

  for (const cell of cells) {
    setFrame(cell.x - center, cell.y - center, 0);
    seed = (Math.imul(cell.x + 37, 73856093) ^ Math.imul(cell.y + 81, 19349663)) >>> 0;
    if (isChannel(cell.kind)) channel(cell);
    if (cell.kind === 'bamboo' || cell.kind === 'herbs') plantingBed(cell);
    switch (cell.kind) {
      case 'bamboo':
        bamboo();
        break;
      case 'reeds':
        reeds();
        break;
      case 'bridge':
        footbridge(cell);
        break;
      case 'herbs':
        medicinalHerbs();
        break;
      case 'rock':
        scholarsRock();
        break;
      case 'crate':
        teaCargo();
        break;
      case 'cover':
        stoneCover();
        break;
    }
  }
  for (const b of batches) {
    if (!b.i.length) continue;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(b.p, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(b.c, 3));
    geo.setIndex(b.i);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const mat = new T.MeshStandardMaterial({
      name: b.name,
      vertexColors: true,
      roughness: b.roughness,
      metalness: b.metalness,
      side: T.DoubleSide
    });
    const mesh = new T.Mesh(geo, mat);
    mesh.name = b.name;
    mesh.castShadow = b.shadow;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

export { buildFieldProps };
