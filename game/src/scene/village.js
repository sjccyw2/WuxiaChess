// Qingzhu Ferry, built in metres of one tactical cell. Local child Y is up.
function buildVillage(T) {
  const village = new T.Group();
  village.name = 'qingzhu-ferry-village';
  const B = new T.BoxGeometry(1, 1, 1);
  const rods = new Map();
  const orbs = new Map();
  const axisY = new T.Vector3(0, 1, 0);
  const v = (x, y, z) => new T.Vector3(x, y, z);
  const mix = T.MathUtils.lerp;
  const pi = Math.PI;

  function paint(name, color, metalness = 0, emission = null) {
    const options = { name, color, roughness: metalness ? 0.58 : 0.86, metalness };
    if (emission !== null) {
      options.emissive = emission;
      options.emissiveIntensity = 0.78;
    }
    const result = new T.MeshStandardMaterial(options);
    return result;
  }

  const wood = paint('dark aged elm', 0x593a2b);
  const woodDark = paint('lacquered mahogany', 0x462e29);
  const woodMid = paint('honey timber', 0xa27249);
  const woodLight = paint('fresh bamboo and exposed wood', 0xc19961);
  const cinnamon = paint('warm cedar', 0x80563a);
  const red = paint('weathered vermilion', 0xa44934);
  const redDark = paint('oxblood in shadow', 0x703c31);
  const teal = paint('carved verdigris trim', 0x42706b);
  const tealDark = paint('painted peacock frieze', 0x2e5150);
  const gold = paint('aged brass', 0xc89b5d, 0.42);
  const gilding = paint('sunlit gilding', 0xe0b975, 0.38);
  const clay = paint('unglazed tile underside', 0x4c4840);
  const tileDark = paint('dark slate in tile grooves', 0x354c50);
  const tile = paint('blue-grey glazed tile', 0x4b696e, 0.1);
  const tileLip = paint('slate highlights', 0x668387, 0.12);
  const tileCap = paint('jade ceramic ridge ornaments', 0x496c6b, 0.15);
  const stone = paint('river limestone', 0x81857b);
  const stoneD = paint('cool stone shadow', 0x586b65);
  const stoneM = paint('weathered stone facing', 0x737f76);
  const stoneL = paint('carved grey granite edges', 0xa0a193);
  const plaster = paint('chalk and ochre plaster', 0xc0aa84);
  const paper = paint('glowing amber lantern paper', 0xffb34f, 0, 0xff6511);
  const paperPale = paint('gold paper lantern ribs', 0xf6c97b, 0, 0xe5862e);
  const rope = paint('braided flax', 0xaa8760);
  const hullRed = paint('ferryman hull, seal brown', 0x604332);
  const oiledCloth = paint('oiled indigo bamboo boat awning', 0x465859);
  const awningRib = paint('woven straw edging', 0x95805f);
  const waterVessel = paint('celadon pottery', 0x62847a, 0.08);
  const roofField = new T.MeshStandardMaterial({
    name: 'slate tiles with individual glaze variation',
    vertexColors: true,
    roughness: 0.76,
    metalness: 0.08,
    side: T.DoubleSide
  });
  const hullField = new T.MeshStandardMaterial({
    name: 'hand-hewn boat planks',
    vertexColors: true,
    roughness: 0.9,
    side: T.DoubleSide
  });
  const geometryByBracket = new Map();

  function group(name, x, y, z) {
    const g = new T.Group();
    g.name = name;
    g.position.set(x, y, z);
    village.add(g);
    return g;
  }

  function mesh(parent, geom, mat, x = 0, y = 0, z = 0, name) {
    const m = new T.Mesh(geom, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function box(parent, x, y, z, width, height, depth, mat) {
    const m = mesh(parent, B, mat, x, y, z);
    m.scale.set(width, height, depth);
    return m;
  }

  function cylinderGeom(n = 10, topRatio = 1) {
    const key = n + ':' + topRatio;
    if (!rods.has(key)) rods.set(key, new T.CylinderGeometry(topRatio, 1, 1, n));
    return rods.get(key);
  }

  function column(parent, x, y, z, radius, height, mat, n = 10, topRatio = 1) {
    const m = mesh(parent, cylinderGeom(n, topRatio), mat, x, y, z);
    m.scale.set(radius, height, radius);
    return m;
  }

  function sphere(parent, x, y, z, a, b, c, mat, n = 10) {
    if (!orbs.has(n)) orbs.set(n, new T.SphereGeometry(1, n, Math.max(4, n >> 1)));
    const m = mesh(parent, orbs.get(n), mat, x, y, z);
    m.scale.set(a, b, c);
    return m;
  }

  function beam(parent, a, b, width, depth, mat) {
    const direction = b.clone().sub(a);
    const m = mesh(parent, B, mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.scale.set(width, direction.length(), depth);
    m.quaternion.setFromUnitVectors(axisY, direction.normalize());
    return m;
  }

  function rod(parent, a, b, radius, mat, n = 8, topRatio = 1) {
    const direction = b.clone().sub(a);
    const m = mesh(parent, cylinderGeom(n, topRatio), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.scale.set(radius, direction.length(), radius);
    m.quaternion.setFromUnitVectors(axisY, direction.normalize());
    return m;
  }

  function stripGeometry(points, indices, colors) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
    if (colors) g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }

  // A joined round moulding is drawn as one mesh, including gilded sweeps and rope.
  function molding(parent, path, r, mat, sides = 6) {
    const p = [],
      ix = [];
    for (let i = 0; i < path.length; i++) {
      const tangent = path[Math.min(i + 1, path.length - 1)]
        .clone()
        .sub(path[Math.max(i - 1, 0)])
        .normalize();
      const normal =
        Math.abs(tangent.y) > 0.94
          ? v(1, 0, 0).cross(tangent).normalize()
          : v(0, 1, 0).cross(tangent).normalize();
      const bitangent = tangent.clone().cross(normal).normalize();
      for (let j = 0; j < sides; j++) {
        const a = (2 * pi * j) / sides;
        const q = path[i]
          .clone()
          .addScaledVector(normal, r * Math.cos(a))
          .addScaledVector(bitangent, r * Math.sin(a));
        p.push(q.x, q.y, q.z);
        if (i) {
          const last = (i - 1) * sides + j,
            next = (i - 1) * sides + ((j + 1) % sides);
          ix.push(last, next, last + sides, next, next + sides, last + sides);
        }
      }
    }
    return mesh(parent, stripGeometry(p, ix), mat);
  }

  function polygonGeom(profile, depth) {
    const shape = new T.Shape();
    profile.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    const geom = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 5
    });
    geom.translate(0, 0, -depth / 2);
    return geom;
  }

  function carvedBracket(parent, x, y, z, angle, scale) {
    if (!geometryByBracket.has(1)) {
      const profile = [
        [-0.34, 0.08],
        [-0.32, 0],
        [-0.26, -0.025],
        [-0.225, -0.082],
        [-0.15, -0.082],
        [-0.125, -0.14],
        [0.125, -0.14],
        [0.15, -0.082],
        [0.225, -0.082],
        [0.26, -0.025],
        [0.32, 0],
        [0.34, 0.08],
        [0.265, 0.072],
        [0.22, 0.038],
        [0.12, 0.056],
        [-0.12, 0.056],
        [-0.22, 0.038],
        [-0.265, 0.072]
      ];
      geometryByBracket.set(1, polygonGeom(profile, 0.105));
    }
    const m = mesh(parent, geometryByBracket.get(1), teal, x, y, z);
    m.rotation.y = angle;
    m.scale.setScalar(scale);
    const d = 0.25 * scale * Math.cos(angle),
      e = -0.25 * scale * Math.sin(angle);
    for (const s of [-1, 1])
      box(
        parent,
        x + s * d,
        y + 0.07 * scale,
        z + s * e,
        0.095 * scale,
        0.055 * scale,
        0.095 * scale,
        gold
      );
  }

  function lantern(parent, x, y, z, s = 1) {
    const y0 = y - 0.28 * s;
    column(parent, x, y - 0.055 * s, z, 0.011 * s, 0.12 * s, woodDark, 6);
    column(parent, x, y0 + 0.157 * s, z, 0.082 * s, 0.05 * s, woodDark, 10, 0.86);
    column(parent, x, y0 + 0.124 * s, z, 0.114 * s, 0.028 * s, gold, 10);
    const rad = 0.138 * s;
    sphere(parent, x, y0, z, rad, 0.145 * s, rad, paper, 12);
    for (const step of [-0.08, -0.035, 0.028, 0.077]) {
      const radius = rad * Math.sqrt(1 - (step / 0.145) ** 2) * 1.015;
      column(parent, x, y0 + step * s, z, radius, 0.009 * s, paperPale, 12);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * pi) / 3,
        cs = Math.cos(a),
        sn = Math.sin(a);
      const path = [-0.112, -0.065, 0, 0.065, 0.112].map((ty) => {
        const rr = rad * Math.sqrt(1 - (ty / 0.145) ** 2) * 1.016;
        return v(x + cs * rr, y0 + ty * s, z + sn * rr);
      });
      molding(parent, path, 0.0039 * s, gold, 4);
    }
    column(parent, x, y0 - 0.131 * s, z, 0.089 * s, 0.03 * s, gold, 10);
    column(parent, x, y0 - 0.157 * s, z, 0.045 * s, 0.032 * s, woodDark, 8);
    column(parent, x, y0 - 0.197 * s, z, 0.011 * s, 0.064 * s, gold, 6);
    column(parent, x, y0 - 0.249 * s, z, 0.033 * s, 0.083 * s, red, 8, 0.44);
  }

  const roofColors = [0x445e61, 0x45656a, 0x557174, 0x3f5b60, 0x49666b, 0x59767a, 0x4b6b6b].map(
    (c) => new T.Color(c)
  );
  function tiledRoof(parent, width, depth, eave, rise, uplift, ornate) {
    const hx = width / 2,
      hz = depth / 2,
      hr = hx * 0.49;
    const relative = width / 4.5;
    // All four hips share their edge curve. Every ridge and eave is a real 3D sweep.
    function point(f, s, t) {
      t = Math.min(1, Math.max(0, t));
      const long = f < 2,
        sign = f % 2 === 0 ? 1 : -1;
      const flareBase = 0.055 * relative * Math.pow(t, 3.4) * Math.pow(Math.abs(s), 5);
      const u = Math.sign(s);
      const h =
        eave + rise * Math.pow(1 - t, 1.8) + uplift * Math.pow(t, 2.65) * Math.pow(Math.abs(s), 3.8);
      return long
        ? v(s * mix(hr, hx, t) + u * flareBase, h, sign * (hz * t + flareBase))
        : v(sign * (mix(hr, hx, t) + flareBase), h, s * hz * t + u * flareBase);
    }
    const nt = 7;
    for (let f = 0; f < 4; f++) {
      const isLong = f < 2,
        ns = isLong ? (ornate ? 29 : 19) : ornate ? 14 : 11;
      const positions = [],
        ix = [],
        colors = [];
      const add = (q, c) => {
        positions.push(q.x, q.y, q.z);
        colors.push(c.r, c.g, c.b);
      };
      for (let k = 0; k < nt; k++)
        for (let j = 0; j < ns; j++) {
          const s0 = -1 + (2 * j) / ns,
            s1 = -1 + (2 * (j + 1)) / ns;
          const t0 = k / nt,
            t1 = (k + 1) / nt;
          const a = point(f, s0, t0),
            b = point(f, s1, t0),
            c = point(f, s1, t1),
            d = point(f, s0, t1);
          // Overlapping rows catch narrow raking highlights beneath their lips.
          a.y += 0.003 * relative;
          b.y += 0.003 * relative;
          c.y += 0.017 * relative;
          d.y += 0.017 * relative;
          const col = roofColors[(j * 13 + k * 7 + j * k * 3 + f * 4) % roofColors.length];
          const n = positions.length / 3;
          add(a, col);
          add(b, col);
          add(c, col);
          add(d, col);
          if (f === 0 || f === 3) ix.push(n, n + 2, n + 1, n, n + 3, n + 2);
          else ix.push(n, n + 1, n + 2, n, n + 2, n + 3);
        }
      mesh(
        parent,
        stripGeometry(positions, ix, colors),
        roofField,
        0,
        0,
        0,
        'curved glazed tile courses'
      );
      // Raised semi-round tile seams and their scalloped circular eave ends.
      for (let j = 0; j <= ns; j++) {
        const s = -1 + (2 * j) / ns,
          seam = [];
        for (let k = 0; k <= 9; k++) {
          const t = (isLong ? 0 : 0.07) + ((isLong ? 1 : 0.93) * k) / 9;
          const q = point(f, s, t);
          q.y += 0.027 * relative;
          seam.push(q);
        }
        const grooveR = (isLong ? 0.018 : 0.016) * relative;
        molding(parent, seam, grooveR, j % 4 === 0 ? tileLip : tile, 6);
        const end = seam[seam.length - 1],
          direction = isLong ? v(0, 0, f === 0 ? 1 : -1) : v(f === 2 ? 1 : -1, 0, 0);
        const p0 = end.clone().addScaledVector(direction, -0.016 * relative);
        const p1 = end.clone().addScaledVector(direction, 0.027 * relative);
        rod(parent, p0, p1, 0.024 * relative, j % 3 === 0 ? tileLip : tileCap, 8);
        if (ornate && j % 3 === 0) {
          const q = p1.clone().addScaledVector(direction, 0.0075 * relative);
          rod(parent, p1, q, 0.01 * relative, gold, 6);
        }
      }
      const edgeTop = [],
        edgeUnder = [],
        edgeGold = [];
      for (let k = 0; k <= 16; k++) {
        const q = point(f, -1 + k / 8, 1);
        edgeTop.push(q.clone().add(v(0, -0.018 * relative, 0)));
        edgeUnder.push(q.clone().add(v(0, -0.08 * relative, 0)));
        edgeGold.push(q.clone().add(v(0, -0.089 * relative, 0)));
      }
      molding(parent, edgeTop, 0.039 * relative, tileDark, 6);
      molding(parent, edgeUnder, 0.041 * relative, woodDark, 6);
      molding(parent, edgeGold, 0.012 * relative, gold, 5);
      // Broad, shallow timber soffit under each overhang, visible from the river.
      const ps = [],
        ids = [];
      for (let k = 0; k <= 12; k++) {
        const s = -1 + k / 6;
        const qi = point(f, s, 0.72),
          qo = point(f, s, 1);
        qi.y -= 0.13 * relative;
        qo.y -= 0.07 * relative;
        ps.push(qi.x, qi.y, qi.z, qo.x, qo.y, qo.z);
        if (k) {
          const i = 2 * k;
          if (f === 0 || f === 3) ids.push(i - 2, i, i - 1, i, i + 1, i - 1);
          else ids.push(i - 2, i - 1, i, i - 1, i + 1, i);
        }
      }
      mesh(parent, stripGeometry(ps, ids), clay);
    }
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const path = [];
        for (let i = 0; i <= 15; i++) {
          const q = point(sz > 0 ? 0 : 1, sx, i / 15);
          q.y += 0.054 * relative;
          path.push(q);
        }
        molding(parent, path, 0.052 * relative, tileCap, 9);
        molding(
          parent,
          path.map((p) => p.clone().add(v(0, 0.041 * relative, 0))),
          0.016 * relative,
          gold,
          6
        );
        const last = path[path.length - 1];
        const fin = [
          last.clone().add(v(-sx * 0.08 * relative, -0.026 * relative, -sz * 0.073 * relative)),
          last,
          last.clone().add(v(sx * 0.055 * relative, 0.064 * relative, sz * 0.055 * relative)),
          last.clone().add(v(sx * 0.092 * relative, 0.142 * relative, sz * 0.097 * relative)),
          last.clone().add(v(sx * 0.12 * relative, 0.215 * relative, sz * 0.114 * relative))
        ];
        molding(parent, fin.slice(0, 4), 0.035 * relative, tileCap, 7);
        rod(parent, fin[3], fin[4], 0.027 * relative, gilding, 7, 0.08);
      }
    const yy = eave + rise + 0.065 * relative;
    rod(parent, v(-hr, yy, 0), v(hr, yy, 0), 0.065 * relative, tileCap, 12);
    rod(
      parent,
      v(-hr, yy + 0.054 * relative, 0),
      v(hr, yy + 0.054 * relative, 0),
      0.02 * relative,
      gold,
      8
    );
    const ornaments = ornate ? 13 : 9;
    for (let j = 0; j <= ornaments; j++) {
      const x = mix(-hr + 0.04 * relative, hr - 0.04 * relative, j / ornaments);
      rod(
        parent,
        v(x - 0.0085 * relative, yy, 0),
        v(x + 0.0085 * relative, yy, 0),
        0.072 * relative,
        j % 3 === 0 ? gold : tileLip,
        10
      );
    }
    // Ceramic chiwen curl inward and frame the horizontal ridge in silhouette.
    for (const s of [-1, 1]) {
      const a = v(s * hr, yy, 0);
      const p = (dx, dy, dz = 0) => a.clone().add(v(s * dx * relative, dy * relative, dz * relative));
      molding(
        parent,
        [
          p(-0.14, 0.022),
          p(-0.03, 0.035),
          p(0.055, 0.09),
          p(0.089, 0.172),
          p(0.073, 0.244),
          p(0.014, 0.258),
          p(-0.019, 0.227)
        ],
        0.045 * relative,
        tileCap,
        9
      );
      molding(
        parent,
        [
          p(-0.12, 0.063, 0.023),
          p(-0.019, 0.075, 0.023),
          p(0.031, 0.123, 0.023),
          p(0.052, 0.186, 0.023)
        ],
        0.013 * relative,
        gilding,
        6
      );
      rod(parent, p(0.06, 0.177), p(0.125, 0.275), 0.031 * relative, gold, 7, 0.06);
      sphere(
        parent,
        s * hr,
        yy + 0.079 * relative,
        0,
        0.075 * relative,
        0.06 * relative,
        0.067 * relative,
        tileCap
      );
    }
  }

  function lowRailing(g, a, b, n, base, postMat = red) {
    const dx = b.x - a.x,
      dz = b.z - a.z,
      length = Math.hypot(dx, dz);
    const pt = (t, h) => v(mix(a.x, b.x, t), base + h, mix(a.z, b.z, t));
    beam(g, pt(0, 0.32), pt(1, 0.32), 0.05, 0.065, woodDark);
    beam(g, pt(0, 0.123), pt(1, 0.123), 0.033, 0.045, postMat);
    for (let i = 0; i <= n; i++)
      box(g, pt(i / n, 0.21).x, base + 0.21, pt(i / n, 0.21).z, 0.04, 0.25, 0.04, postMat);
    if (length > 0.55) {
      // Offset lattice elbows, a small recurring motif of the ferry buildings.
      for (let i = 0; i < n; i++) {
        const start = i / n,
          end = (i + 1) / n,
          xm = (start + end) / 2;
        beam(g, pt(start, 0.14), pt(xm, 0.235), 0.02, 0.023, woodMid);
        beam(g, pt(xm, 0.235), pt(end, 0.14), 0.02, 0.023, woodMid);
      }
    }
  }

  function pot(g, x, y, z, s) {
    column(g, x, y + 0.029 * s, z, 0.082 * s, 0.057 * s, waterVessel, 10, 0.95);
    column(g, x, y + 0.086 * s, z, 0.082 * s, 0.065 * s, waterVessel, 12, 1.24);
    column(g, x, y + 0.145 * s, z, 0.1 * s, 0.067 * s, waterVessel, 12, 0.73);
    column(g, x, y + 0.193 * s, z, 0.065 * s, 0.039 * s, waterVessel, 12, 0.96);
    column(g, x, y + 0.211 * s, z, 0.073 * s, 0.019 * s, woodDark, 12);
  }

  function letteredPlaque(g, x, y, z) {
    box(g, x, y, z, 0.88, 0.253, 0.038, gold);
    box(g, x, y, z + 0.022, 0.835, 0.214, 0.021, tealDark);
    for (const s of [-1, 1]) {
      box(g, x + s * 0.396, y, z + 0.035, 0.013, 0.169, 0.012, gilding);
      box(g, x, y + s * 0.087, z + 0.036, 0.78, 0.009, 0.01, gilding);
    }
    // The plaque reads 青竹渡. These engraved strokes stay legible as the sign turns.
    const chars = [
      [
        [
          [1, 9],
          [8.4, 9]
        ],
        [
          [1.7, 7.6],
          [8, 7.6]
        ],
        [
          [0.6, 6.0],
          [9, 6]
        ],
        [
          [4.8, 9.8],
          [4.8, 5.95]
        ],
        [
          [2.3, 0.5],
          [2.3, 4.85],
          [7.5, 4.85],
          [7.5, 0.65],
          [6.5, 0.58]
        ],
        [
          [2.4, 3.45],
          [7.4, 3.45]
        ],
        [
          [2.4, 2.05],
          [7.4, 2.05]
        ]
      ],
      [
        [
          [2.6, 9.7],
          [0.8, 6.6]
        ],
        [
          [2, 8.3],
          [4.7, 8.3]
        ],
        [
          [2.8, 8.1],
          [2.8, 0.55]
        ],
        [
          [6.75, 9.7],
          [5.1, 6.65]
        ],
        [
          [6.1, 8.3],
          [9.6, 8.3]
        ],
        [
          [7.45, 8.05],
          [7.45, 0.57],
          [6.3, 0.4]
        ]
      ],
      [
        [
          [0.55, 8.6],
          [1.65, 7.9]
        ],
        [
          [0.25, 6.4],
          [1.45, 5.85]
        ],
        [
          [0.65, 1.3],
          [1.8, 4.3]
        ],
        [
          [5.6, 9.75],
          [6.25, 9.0]
        ],
        [
          [2.85, 1.55],
          [3.5, 5],
          [3.5, 8.65],
          [9.55, 8.65]
        ],
        [
          [3.6, 7.05],
          [9.15, 7.05]
        ],
        [
          [5.25, 7.8],
          [5.25, 5.5],
          [7.77, 5.5],
          [7.77, 7.79]
        ],
        [
          [4.25, 4.45],
          [8.9, 4.45],
          [7.65, 2.52],
          [5.85, 1.35],
          [3.65, 0.65]
        ],
        [
          [4.8, 4.15],
          [6.8, 2.32],
          [9.52, 0.65]
        ]
      ]
    ];
    for (let j = 0; j < chars.length; j++)
      for (const path of chars[j]) {
        const points = path.map(([u, w]) =>
          v(x + (j - 1) * 0.192 + (u - 5) * 0.0143, y + (w - 5) * 0.014, z + 0.041)
        );
        molding(g, points, 0.0064, gilding, 5);
      }
  }

  const temple = group('qingzhu-temple-pavilion', -1.9, 0, -5.6);
  // Stone plinth, open galleries and hand-cut front steps.
  box(temple, 0, 0.064, 0, 3.86, 0.22, 2.4, stoneD);
  box(temple, 0, 0.171, 0, 3.98, 0.09, 2.48, stoneM);
  box(temple, 0, 0.242, 0, 4.04, 0.077, 2.54, stoneL);
  box(temple, 0, 0.282, 0, 3.93, 0.045, 2.43, wood);
  for (let j = 0; j < 11; j++) {
    const x = mix(-1.82, 1.82, j / 10);
    box(temple, x, 0.128, 1.209, 0.311, 0.092, 0.024, j % 3 === 1 ? stone : stoneM);
  }
  for (let j = 0; j < 15; j++) {
    const x = mix(-1.82, 1.82, j / 14);
    box(temple, x, 0.314, 0, 0.251, 0.025, 2.36, j % 4 === 0 ? woodMid : cinnamon);
  }
  for (let i = 0; i < 4; i++) {
    const z = 1.26 + i * 0.145,
      h = 0.239 - i * 0.059;
    box(temple, 0, h / 2, z, 1.1, h, 0.205, i % 2 ? stoneM : stone);
    box(temple, 0, h + 0.008, z + 0.075, 1.13, 0.022, 0.046, stoneL);
    for (const s of [-1, 1]) box(temple, s * 0.603, h / 2 + 0.03, z, 0.11, h + 0.06, 0.16, stoneM);
  }
  const xp = [-1.76, -0.605, 0.605, 1.76],
    zz = 1.025;
  xp.forEach((x, i) => {
    for (const z of [-zz, zz]) {
      box(temple, x, 0.348, z, 0.19, 0.077, 0.19, stoneL);
      column(temple, x, 0.428, z, 0.097, 0.087, stoneM, 10, 0.83);
      column(temple, x, 1.061, z, 0.066, 1.24, red, 12, 0.93);
      column(temple, x, 0.517, z, 0.077, 0.077, redDark, 12);
      column(temple, x, 0.503, z, 0.081, 0.016, gold, 12);
      column(temple, x, 1.602, z, 0.081, 0.085, redDark, 12);
      column(temple, x, 1.63, z, 0.085, 0.025, gold, 12);
      carvedBracket(temple, x, 1.667, z, 0, i === 0 || i === 3 ? 1 : 0.87);
      carvedBracket(temple, x, 1.734, z, pi / 2, i === 0 || i === 3 ? 1.02 : 0.83);
      box(temple, x, 1.778, z, 0.22, 0.083, 0.208, redDark);
      box(temple, x, 1.828, z, 0.28, 0.041, 0.23, woodMid);
    }
  });
  for (const s of [-1, 1]) {
    const z = s * zz;
    box(temple, 0, 1.761, z, 4.04, 0.13, 0.13, woodDark);
    box(temple, 0, 1.817, z, 4.1, 0.032, 0.154, gold);
    box(temple, 0, 1.885, z, 4.05, 0.107, 0.129, tealDark);
    for (const x of [-1.185, 0, 1.185]) {
      box(temple, x, 1.902, z + s * 0.069, 0.81, 0.04, 0.018, teal);
      for (const dx of [-0.31, 0.31])
        box(temple, x + dx, 1.902, z + s * 0.08, 0.046, 0.045, 0.016, gold);
    }
    const x = s * 1.76;
    box(temple, x, 1.769, 0, 0.13, 0.13, 2.65, woodDark);
    box(temple, x, 1.83, 0, 0.142, 0.031, 2.74, gold);
    lowRailing(temple, v(x, 0, -zz + 0.06), v(x, 0, zz - 0.06), 6, 0.328);
  }
  for (const z of [-zz, zz])
    for (let i = 0; i < 3; i++) {
      if (z > 0 && i === 1) continue;
      lowRailing(temple, v(xp[i] + 0.065, 0, z), v(xp[i + 1] - 0.065, 0, z), 3, 0.328);
    }
  for (const x of [-1.49, 1.49]) lantern(temple, x, 1.72, 1.21, 1.03);
  for (const x of [-1.62, 1.62]) lantern(temple, x, 1.72, -1.13, 0.76);
  letteredPlaque(temple, 0, 1.611, 1.083);
  // A tea table, two low seats and celadon jars are visible through the open sides.
  box(temple, -0.91, 0.61, -0.12, 0.5, 0.045, 0.33, woodMid);
  for (const x of [-1.1, -0.72])
    for (const z of [-0.22, -0.02]) box(temple, x, 0.457, z, 0.044, 0.26, 0.044, woodDark);
  for (const x of [-1.3, -0.52]) {
    box(temple, x, 0.455, -0.13, 0.2, 0.047, 0.22, cinnamon);
    box(temple, x, 0.372, -0.13, 0.109, 0.13, 0.126, wood);
  }
  pot(temple, -1.1, 0.632, -0.11, 0.48);
  box(temple, 0.99, 0.534, -0.69, 0.91, 0.065, 0.24, woodMid);
  for (const x of [0.62, 1.36]) box(temple, x, 0.424, -0.69, 0.08, 0.19, 0.16, wood);
  tiledRoof(temple, 4.47, 2.94, 1.935, 0.925, 0.31, true);

  const house = group('east-ferry-office', 4.92, -0.052, -4.91);
  box(house, 0, 0.088, 0, 2.43, 0.27, 1.82, stoneD);
  box(house, 0, 0.221, 0, 2.51, 0.098, 1.9, stoneL);
  box(house, 0, 0.283, 0, 2.45, 0.067, 1.84, cinnamon);
  // Plaster and timber infill leave a deep, shaded front porch.
  box(house, 0, 0.863, -0.263, 2.05, 1.096, 1.074, plaster);
  const fx = 1.032,
    front = 0.286,
    back = -0.82;
  for (const x of [-fx, 0, fx]) {
    for (const z of [back, front]) box(house, x, 0.872, z, 0.092, 1.13, 0.092, woodDark);
  }
  for (const x of [-fx, fx])
    for (const z of [-0.46, -0.11]) box(house, x, 0.866, z, 0.085, 1.09, 0.054, wood);
  for (const z of [front, back]) {
    box(house, 0, 0.43, z, 2.15, 0.115, 0.095, wood);
    box(house, 0, 1.318, z, 2.15, 0.079, 0.095, woodDark);
  }
  function latticeWindow(x, width) {
    box(house, x, 0.925, front + 0.055, width, 0.594, 0.05, woodDark);
    box(house, x, 0.927, front + 0.087, width - 0.092, 0.505, 0.018, tealDark);
    for (let n = 0; n < 5; n++)
      box(house, x - width * 0.39 + n * width * 0.195, 0.925, front + 0.105, 0.016, 0.48, 0.02, woodMid);
    for (let n = 0; n < 3; n++)
      box(house, x, 0.742 + n * 0.181, front + 0.109, width - 0.071, 0.024, 0.02, woodMid);
    box(house, x, 0.61, front + 0.078, width + 0.06, 0.039, 0.083, woodMid);
  }
  latticeWindow(-0.56, 0.62);
  box(house, 0.48, 0.809, front + 0.054, 0.547, 0.95, 0.051, woodDark);
  for (let i = 0; i < 5; i++)
    box(house, 0.268 + i * 0.107, 0.81, front + 0.091, 0.094, 0.871, 0.035, i % 2 ? cinnamon : wood);
  for (const yy of [0.578, 1.05]) box(house, 0.48, yy, front + 0.115, 0.52, 0.047, 0.024, woodDark);
  sphere(house, 0.627, 0.777, front + 0.148, 0.022, 0.022, 0.018, gold, 8);
  for (const x of [-1.09, 1.09]) {
    column(house, x, 0.867, 0.781, 0.059, 1.085, red, 10);
    box(house, x, 0.342, 0.781, 0.15, 0.09, 0.15, stoneL);
    carvedBracket(house, x, 1.386, 0.781, 0, 0.65);
    lowRailing(house, v(x, 0, 0.33), v(x, 0, 0.72), 1, 0.317);
  }
  box(house, 0, 1.421, 0.767, 2.4, 0.091, 0.085, woodDark);
  box(house, 0, 1.463, 0.765, 2.46, 0.023, 0.099, gold);
  lantern(house, -0.765, 1.382, 0.834, 0.76);
  // Paired carrying crates and a tied reed bundle in the shade of the eaves.
  for (let n = 0; n < 2; n++) {
    const x = 0.88 + n * 0.2,
      z = 0.557;
    box(house, x, 0.421, z, 0.19, 0.201, 0.2, woodMid);
    for (const zz of [-0.082, 0.082]) box(house, x, 0.423, z + zz, 0.203, 0.194, 0.027, cinnamon);
  }
  for (let i = 0; i < 4; i++)
    rod(
      house,
      v(-0.95 + i * 0.037, 0.323, 0.54),
      v(-1.035 + i * 0.031, 1.1 - i * 0.06, 0.43),
      0.012,
      woodLight,
      6
    );
  pot(house, -0.85, 0.314, 0.61, 0.69);
  box(house, 0.33, 0.097, 1.03, 0.8, 0.16, 0.29, stone);
  tiledRoof(house, 2.8, 2.11, 1.491, 0.615, 0.18, false);

  const bridge = group('single-arch-limestone-ferry-bridge', 5.29, -0.25, 1);
  const reach = 1.78,
    spring = 1.28,
    halfLane = 0.57;
  const bridgeTop = (x) => 0.216 + 0.494 * (1 - Math.min(1, (x / reach) ** 2));
  const arc = (a) => v(spring * Math.cos(a), -0.454 + 0.788 * Math.sin(a), 0);
  const silhouette = [
    [-reach, -0.47],
    [-reach, bridgeTop(-reach)]
  ];
  for (let n = 1; n <= 20; n++) {
    const x = mix(-reach, reach, n / 20);
    silhouette.push([x, bridgeTop(x)]);
  }
  silhouette.push([reach, -0.47], [spring, -0.47]);
  for (let n = 0; n <= 24; n++) {
    const q = arc((pi * n) / 24);
    silhouette.push([q.x, q.y]);
  }
  silhouette.push([-spring, -0.47]);
  mesh(bridge, polygonGeom(silhouette, halfLane * 2), stoneM, 0, 0, 0, 'arched limestone vault');

  const outerArch = (a) => v((spring + 0.157) * Math.cos(a), -0.454 + 0.939 * Math.sin(a), 0);
  for (const s of [-1, 1]) {
    for (let n = 0; n < 17; n++) {
      const a0 = (n * pi) / 17 + 0.005,
        a1 = ((n + 1) * pi) / 17 - 0.005;
      const i0 = arc(a0),
        i1 = arc(a1),
        o1 = outerArch(a1),
        o0 = outerArch(a0);
      const profile = [
        [i0.x, i0.y],
        [i1.x, i1.y],
        [o1.x, o1.y],
        [o0.x, o0.y]
      ];
      const block = n % 5 === 3 ? stoneL : n % 3 === 1 ? stone : stoneM;
      mesh(bridge, polygonGeom(profile, 0.041), block, 0, 0, s * (halfLane + 0.013));
    }
    // A keystone and modest dressing blocks break up the broad faces.
    mesh(
      bridge,
      polygonGeom(
        [
          [-0.082, 0.397],
          [-0.12, 0.55],
          [0.12, 0.55],
          [0.082, 0.397]
        ],
        0.055
      ),
      stoneL,
      0,
      0,
      s * (halfLane + 0.03)
    );
    for (const k of [-1, 1]) {
      for (let n = 0; n < 3; n++) {
        const xx = k * (1.51 + (n % 2) * 0.037);
        box(
          bridge,
          xx,
          -0.317 + n * 0.16,
          s * (halfLane + 0.01),
          0.326,
          0.13,
          0.035,
          n % 2 ? stoneM : stone
        );
      }
    }
  }
  const deckPieces = 17;
  const deckStones = [
    stone,
    stoneM,
    paint('worn deck stone', 0x7a7f74),
    stone,
    paint('damp deck stone', 0x6e766d),
    paint('sun-bleached deck stone', 0x8d8f83)
  ];
  // A single bed of mortar shows in the joints between the deck stones.
  for (let n = 0; n < deckPieces; n++) {
    const x0 = mix(-reach, reach, n / deckPieces),
      x1 = mix(-reach, reach, (n + 1) / deckPieces);
    const bed = box(
      bridge,
      (x0 + x1) / 2,
      (bridgeTop(x0) + bridgeTop(x1)) / 2 + 0.006,
      0,
      (x1 - x0) * 1.015,
      0.04,
      1.2,
      stoneD
    );
    bed.rotation.z = Math.atan2(bridgeTop(x1) - bridgeTop(x0), x1 - x0);
  }
  for (let n = 0; n < deckPieces; n++) {
    const x0 = mix(-reach, reach, n / deckPieces),
      x1 = mix(-reach, reach, (n + 1) / deckPieces);
    const xx = (x0 + x1) / 2,
      h = (bridgeTop(x0) + bridgeTop(x1)) / 2,
      tilt = Math.atan2(bridgeTop(x1) - bridgeTop(x0), x1 - x0);
    // Each course is laid as two or three stones with staggered joints, in
    // close greys, so the deck reads as worn paving rather than painted stripes.
    const joints = n % 2 ? [-0.608, -0.17, 0.25, 0.608] : [-0.608, 0.05, 0.608];
    for (let k = 0; k + 1 < joints.length; k++) {
      const slab = box(
        bridge,
        xx,
        h + 0.026 - 0.004 * ((n + k) % 2),
        (joints[k] + joints[k + 1]) / 2,
        (x1 - x0) * 0.985,
        0.059,
        joints[k + 1] - joints[k] - 0.012,
        deckStones[(n * 5 + k * 3 + (n >> 2)) % deckStones.length]
      );
      slab.rotation.z = tilt;
    }
    for (const s of [-1, 1]) {
      const cur = box(bridge, xx, h + 0.071, s * 0.567, (x1 - x0) * 1.01, 0.07, 0.119, stoneL);
      cur.rotation.z = tilt;
    }
  }
  const postXs = [-1.69, -1.15, -0.585, 0, 0.585, 1.15, 1.69];
  for (const s of [-1, 1]) {
    const z = s * 0.568;
    for (let n = 0; n < postXs.length; n++) {
      const x = postXs[n],
        h = bridgeTop(x),
        tall = n === 0 || n === postXs.length - 1 ? 0.373 : 0.333;
      box(bridge, x, h + 0.123, z, 0.12, 0.099, 0.127, stoneM);
      box(bridge, x, h + 0.111 + tall / 2, z, 0.088, tall, 0.089, stoneL);
      box(bridge, x, h + tall + 0.101, z, 0.121, 0.065, 0.121, stoneM);
      column(bridge, x, h + tall + 0.157, z, 0.067, 0.058, stoneL, 8, 0.65);
      if (n === 0 || n === postXs.length - 1) {
        sphere(bridge, x, h + tall + 0.203, z, 0.059, 0.049, 0.059, stoneL, 8);
      }
      if (n === postXs.length - 1) continue;
      const x1 = postXs[n + 1],
        h1 = bridgeTop(x1);
      const a = v(x, h + 0.343, z),
        b = v(x1, h1 + 0.343, z);
      beam(bridge, a, b, 0.062, 0.075, stoneL);
      beam(bridge, v(x, h + 0.169, z), v(x1, h1 + 0.169, z), 0.035, 0.054, stoneM);
      // Three carved uprights leave the channel visible through the balustrade.
      for (const t of [0.26, 0.74]) {
        const px = mix(x, x1, t),
          ph = mix(h, h1, t);
        column(bridge, px, ph + 0.254, z, 0.02, 0.155, stone, 8, 0.86);
      }
    }
  }

  const dock = group('western-timber-landing', -1.2, 0, 4.59);
  for (const x of [-0.383, 0.383]) box(dock, x, -0.231, 0, 0.099, 0.142, 1.93, woodDark);
  // Boards long in the weather go silver-brown; a few newer ones keep their honey colour.
  const greyPlank = paint('weathered grey plank', 0x8a7862),
    silverPlank = paint('sun-silvered plank', 0x9b8b70);
  const plankColors = [woodMid, greyPlank, cinnamon, silverPlank, greyPlank, woodMid, cinnamon];
  for (let n = 0; n < 14; n++) {
    const z = -0.901 + n * 0.139;
    const p = box(
      dock,
      0,
      -0.113,
      z,
      1.004 + (n % 4) * 0.011,
      0.108,
      0.135,
      plankColors[(n * 3) % plankColors.length]
    );
    p.rotation.y = 0.002 * ((n % 3) - 1);
    for (const x of [-0.393, 0.393]) column(dock, x, -0.0559, z, 0.013, 0.005, woodDark, 6);
    if (n % 3 === 0)
      box(
        dock,
        -0.095 + 0.071 * (n % 5),
        -0.057,
        z + 0.029,
        0.18 + 0.02 * (n % 4),
        0.005,
        0.009,
        cinnamon
      );
  }
  const pierPosts = [
    [-0.484, -0.838],
    [0.485, -0.838],
    [0.485, -0.06],
    [-0.484, 0.839],
    [0.485, 0.839]
  ];
  for (let n = 0; n < pierPosts.length; n++) {
    const [x, z] = pierPosts[n],
      top = n === 2 ? 0.17 : 0.25;
    column(dock, x, (top - 0.8) / 2, z, 0.058, 0.8 + top, woodDark, 9, 0.9);
    column(dock, x, top + 0.006, z, 0.048, 0.022, woodMid, 9);
    for (let j = 0; j < 3; j++) column(dock, x, top - 0.102 + j * 0.016, z, 0.061, 0.012, rope, 9);
  }
  function hangingRope(parent, a, b, sag = 0.095) {
    const points = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10,
        q = a.clone().lerp(b, t);
      q.y -= 4 * sag * t * (1 - t);
      points.push(q);
    }
    molding(parent, points, 0.015, rope, 6);
  }
  hangingRope(dock, v(0.485, 0.16, -0.838), v(0.485, 0.103, -0.06), 0.101);
  hangingRope(dock, v(0.485, 0.103, -0.06), v(0.485, 0.16, 0.839), 0.099);
  // Flat turns of a mooring coil share the dock boards.
  for (let n = 0; n < 3; n++) {
    const path = [],
      rr = 0.077 + n * 0.022;
    for (let j = 0; j <= 17; j++) {
      const a = (j * 2 * pi) / 17;
      path.push(v(0.264 + Math.cos(a) * rr, -0.046, 0.596 + Math.sin(a) * rr * 0.76));
    }
    molding(dock, path, 0.01, rope, 5);
  }
  // A short, self-supporting gangplank meets the terrace above the waterline.
  for (let n = 0; n < 4; n++)
    box(dock, 0, -0.019 - n * 0.015, -0.938 + n * 0.066, 0.64, 0.047, 0.081, n % 2 ? woodMid : cinnamon);

  const boat = group('moored-wupeng-canopy-boat', -2.27, 0, 4.88);
  const stationZ = [-1.15, -1.03, -0.83, -0.54, -0.21, 0.14, 0.47, 0.76, 1.01, 1.17];
  const stationW = [0.023, 0.158, 0.282, 0.334, 0.349, 0.351, 0.331, 0.277, 0.14, 0.023];
  const edgeY = (z) => -0.413 + 0.219 * Math.pow(Math.abs(z) / 1.17, 3.4);
  const hullPos = [],
    hullColors = [],
    hullIds = [];
  const palette = [0x5a4437, 0x6a4936, 0x80573d, 0x73503b, 0x9a6f4b].map((x) => new T.Color(x));
  for (let n = 0; n < stationZ.length - 1; n++) {
    const frame = (i) => {
      const z = stationZ[i],
        w = stationW[i],
        lip = edgeY(z),
        keel = -0.74 + 0.17 * Math.pow(Math.abs(z) / 1.17, 3);
      return [
        [-1, lip],
        [-0.9, lip - 0.071],
        [-0.69, (keel + lip) / 2],
        [-0.36, keel + 0.033],
        [0, keel],
        [0.36, keel + 0.033],
        [0.69, (keel + lip) / 2],
        [0.9, lip - 0.071],
        [1, lip]
      ].map(([f, y]) => v(f * w, y, z));
    };
    const a = frame(n),
      b = frame(n + 1);
    for (let j = 0; j < a.length - 1; j++) {
      const k = hullPos.length / 3;
      const col = palette[(Math.abs(j - 3) + (n % 2)) % palette.length];
      for (const q of [a[j], b[j], b[j + 1], a[j + 1]]) {
        hullPos.push(q.x, q.y, q.z);
        hullColors.push(col.r, col.g, col.b);
      }
      hullIds.push(k, k + 2, k + 1, k, k + 3, k + 2);
    }
  }
  mesh(boat, stripGeometry(hullPos, hullIds, hullColors), hullField, 0, 0, 0, 'peaked river punt hull');
  for (const s of [-1, 1]) {
    const gunwale = stationZ.map((z, i) => v(s * stationW[i], edgeY(z) + 0.005, z));
    molding(boat, gunwale, 0.029, hullRed, 8);
    molding(
      boat,
      gunwale.map((p) => p.clone().add(v(s * 0.005, 0.019, 0))),
      0.009,
      woodLight,
      5
    );
    for (const loss of [0.058, 0.101]) {
      const seam = stationZ.map((z, i) =>
        v(s * stationW[i] * (loss < 0.08 ? 0.92 : 0.85), edgeY(z) - loss, z)
      );
      molding(boat, seam, 0.007, woodDark, 5);
    }
  }
  for (const i of [1, 2, 3, 5, 7, 8]) {
    const z = stationZ[i],
      w = stationW[i],
      y = edgeY(z);
    molding(
      boat,
      [
        v(-w * 0.93, y - 0.03, z),
        v(-w * 0.67, y - 0.144, z),
        v(0, y - 0.2, z),
        v(w * 0.67, y - 0.144, z),
        v(w * 0.93, y - 0.03, z)
      ],
      0.016,
      woodMid,
      6
    );
  }
  for (const i of [2, 4, 7]) {
    const z = stationZ[i],
      w = stationW[i];
    box(boat, 0, edgeY(z) - 0.063, z, w * 1.68, 0.032, 0.125, woodMid);
  }
  // Wupeng boat awning, formed from bamboo ribs and an arched, oiled cloth shell.
  const cz0 = -0.512,
    cz1 = 0.386,
    canY = -0.386,
    canW = 0.319,
    canH = 0.46;
  const canopyPos = [],
    canopyIx = [],
    canopyCols = [];
  const canopyColors = [0x354d50, 0x405558, 0x4a5c5d, 0x4a5d5d].map((c) => new T.Color(c));
  const archPoint = (z, a, inflate = 1) =>
    v(canW * inflate * Math.cos(a), canY + canH * inflate * Math.sin(a), z);
  for (let j = 0; j < 6; j++)
    for (let i = 0; i < 14; i++) {
      const z0 = mix(cz0, cz1, j / 6),
        z1 = mix(cz0, cz1, (j + 1) / 6);
      const a0 = (i * pi) / 14,
        a1 = ((i + 1) * pi) / 14;
      const k = canopyPos.length / 3,
        col = canopyColors[(i * 3 + j * 2) % canopyColors.length];
      for (const q of [archPoint(z0, a0), archPoint(z1, a0), archPoint(z1, a1), archPoint(z0, a1)]) {
        canopyPos.push(q.x, q.y, q.z);
        canopyCols.push(col.r, col.g, col.b);
      }
      canopyIx.push(k, k + 2, k + 1, k, k + 3, k + 2);
    }
  mesh(boat, stripGeometry(canopyPos, canopyIx, canopyCols), hullField);
  for (let n = 0; n <= 6; n++) {
    const z = mix(cz0, cz1, n / 6),
      points = [];
    for (let j = 0; j <= 17; j++) points.push(archPoint(z, (pi * j) / 17, 1.014));
    molding(
      boat,
      points,
      n === 0 || n === 6 ? 0.017 : 0.009,
      n === 0 || n === 6 ? woodMid : awningRib,
      6
    );
  }
  for (const a of [0, 0.32 * pi, 0.68 * pi, pi]) {
    const q0 = archPoint(cz0, a),
      q1 = archPoint(cz1, a);
    rod(boat, q0, q1, 0.01, oiledCloth, 6);
  }
  // A single sculling oar, a travel jar and a folded hoop line complete the boat.
  rod(boat, v(-0.22, -0.3, 0.55), v(0.57, -0.315, 1.18), 0.02, woodMid, 7);
  beam(boat, v(0.57, -0.315, 1.18), v(0.76, -0.322, 1.31), 0.066, 0.024, woodLight);
  pot(boat, -0.095, -0.411, 0.704, 0.49);
  for (const s of [-1, 1]) {
    const z = s > 0 ? 1.122 : -1.087;
    rod(
      boat,
      v(0, edgeY(z) - 0.071, z),
      v(0, edgeY(z) + 0.082, z + s * 0.035),
      0.022,
      woodDark,
      7,
      0.82
    );
  }
  // Rope ends are in the boat group so the entire craft can fade as a unit.
  hangingRope(boat, v(0.113, -0.259, 0.987), v(0.584, 0.147, 0.549), 0.109);

  const northRail = group('north-bank-cutout-railings', 0, 0, -3.76);
  function bankRail(a, b) {
    const n = Math.max(1, Math.round((b - a) / 0.8));
    for (let i = 0; i <= n; i++) {
      const x = mix(a, b, i / n);
      box(northRail, x, 0.108, 0, 0.126, 0.19, 0.13, stoneM);
      box(northRail, x, 0.256, 0, 0.088, 0.26, 0.09, woodDark);
      box(northRail, x, 0.407, 0, 0.121, 0.06, 0.122, woodMid);
      if (i < n) {
        const nx = mix(a, b, (i + 1) / n);
        box(northRail, (x + nx) / 2, 0.318, 0, nx - x, 0.05, 0.058, wood);
        box(northRail, (x + nx) / 2, 0.178, 0, nx - x, 0.031, 0.045, cinnamon);
      }
    }
  }
  bankRail(-3.46, -2.69);
  bankRail(-1.08, 1.31);
  return village;
}

export { buildVillage };
