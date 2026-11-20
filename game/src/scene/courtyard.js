// Physical banks and timber crossings for Qingzhudu. Coordinates use one unit per cell.
const EPSILON = 1e-7;
const key = (x, y) => x + ',' + y;

function painter(T, name, castsShadow = false) {
  const positions = [],
    colors = [],
    ids = [];
  const colorCache = new Map();
  function color(hex) {
    if (typeof hex !== 'number') return hex;
    if (!colorCache.has(hex)) colorCache.set(hex, new T.Color(hex));
    return colorCache.get(hex);
  }
  function vertex(p, tint, factor = 1) {
    const c = color(tint),
      n = positions.length / 3;
    positions.push(p[0], p[1], p[2]);
    colors.push(c.r * factor, c.g * factor, c.b * factor);
    return n;
  }
  function quad(a, b, c, d, tint, shade = [1, 1, 1, 1]) {
    const v = [a, b, c, d].map((p, i) => vertex(p, tint, shade[i]));
    ids.push(v[0], v[1], v[2], v[0], v[2], v[3]);
  }
  function triangle(a, b, c, tint) {
    ids.push(vertex(a, tint), vertex(b, tint), vertex(c, tint));
  }
  function attach(parent, grain = false) {
    if (!ids.length) return;
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(ids);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const material = new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.025,
      side: T.DoubleSide
    });
    if (grain) {
      material.onBeforeCompile = (shader) => {
        shader.vertexShader =
          'varying vec3 quayPoint;\n' +
          shader.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nquayPoint = position;'
          );
        shader.fragmentShader =
          'varying vec3 quayPoint;\n' +
          shader.fragmentShader.replace(
            '#include <color_fragment>',
            `#include <color_fragment>
          vec2 uv = quayPoint.xz + vec2(quayPoint.y * .23, quayPoint.y * .42);
          float fleck = fract(sin(dot(floor(uv * 136.), vec2(127.1,311.7))) * 43758.545);
          float vein = sin(uv.x * 63. + sin(uv.y * 22.) * 1.8) + sin(uv.y * 103. + uv.x * 14.);
          diffuseColor.rgb *= .985 + .023 * vein + .048 * fleck;`
          );
      };
      material.customProgramCacheKey = () => 'ferry-grained-stone-1';
    }
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = castsShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  return { vertex, quad, triangle, ids, attach };
}

function randomStream(initial) {
  let state = initial;
  return () => (state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296;
}

function masonry(T, slabArt, left, right, back, front, nearShore, random) {
  const shades = [0x859483, 0x969c8c, 0x899688, 0x9c9f8e, 0xa0a18d, 0x7f8e80, 0x949b89, 0x8e9586];
  const hue = new T.Color(shades[Math.floor(random() * shades.length)]);
  if (nearShore) hue.lerp(new T.Color(0x617c69), 0.07 + random() * 0.17);
  const cut = Math.min((right - left) * 0.18, 0.027 + random() * 0.03),
    top = 0.035 + 0.016 * random();
  const outline = [
    [left + cut, back],
    [left, back + cut],
    [left, front - cut],
    [left + cut, front],
    [right - cut, front],
    [right, front - cut],
    [right, back + cut],
    [right - cut, back]
  ];
  const cx = (left + right) / 2,
    cz = (back + front) / 2;
  const cap = [],
    shoulder = [],
    foot = [];
  for (let [x, z] of outline) {
    x += (random() - 0.5) * 0.005;
    z += (random() - 0.5) * 0.004;
    cap.push(
      slabArt.vertex(
        [x + 0.048 * (cx - x), top, z + 0.058 * (cz - z)],
        hue,
        0.98 + random() * 0.045
      )
    );
    shoulder.push(slabArt.vertex([x, top - 0.012, z], hue, 0.84));
    foot.push(slabArt.vertex([x, -0.008, z], hue, 0.67));
  }
  for (let i = 1; i < 7; i++) slabArt.ids.push(cap[0], cap[i], cap[i + 1]);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    slabArt.ids.push(cap[i], shoulder[i], shoulder[j], cap[i], shoulder[j], cap[j]);
    slabArt.ids.push(shoulder[i], foot[i], foot[j], shoulder[i], foot[j], shoulder[j]);
  }
}

// u follows the edge. Positive depth runs from the masonry into the channel.
function shoreFrame(wx, wz, dx, dz) {
  return (u, h, depth) => [wx + dz * u + dx * depth, h, wz - dx * u + dz * depth];
}

function retainingWall(stone, details, at, random, atBridge) {
  // Face order faces the water so both lighting backends see the outward normal.
  stone.quad(
    at(-0.5, -0.94, -0.054),
    at(0.5, -0.94, -0.054),
    at(0.5, 0.019, -0.054),
    at(-0.5, 0.019, -0.054),
    0x3d504a
  );
  const courses = [
    [-0.9, -0.58, 0x546861, 0.077],
    [-0.58, -0.39, 0x63746b, 0.047],
    [-0.39, -0.187, 0x748077, 0.032],
    [-0.187, -0.075, 0x899084, 0.018],
    [-0.075, 0.026, 0x9b9e89, 0.007]
  ];
  for (let c = 0; c < courses.length; c++) {
    const [bottom, top, color, depth] = courses[c],
      lift = 0.009;
    // Stagger long and short stones like the dry-laid Jiangnan canal quays.
    const count = c === 4 ? 2 : 2 + (random() > 0.49 ? 1 : 0);
    let start = -0.5;
    for (let i = 0; i < count; i++) {
      const end = i === count - 1 ? 0.5 : -0.5 + (i + 1) / count + (random() - 0.5) * 0.13;
      const a = start + 0.006,
        b = end - 0.006,
        bevel = 0.013 + random() * 0.009;
      const face = depth + random() * 0.017,
        tone = 0.86 + random() * 0.17;
      const p = [
        at(a + bevel, bottom + lift, face),
        at(b - bevel, bottom + lift, face),
        at(b, bottom + bevel + 0.01, face),
        at(b, top - bevel, face),
        at(b - bevel, top - 0.003, face),
        at(a + bevel, top - 0.003, face),
        at(a, top - bevel, face),
        at(a, bottom + bevel + 0.01, face)
      ];
      const center = at((a + b) / 2, (top + bottom) / 2, face + 0.005);
      for (let j = 0; j < 8; j++) {
        const k = (j + 1) % 8;
        stone.triangle(p[j], p[k], center, color);
      }
      // A fine bright or mossy lip along each stone and a darker inward return.
      stone.quad(p[4], at(b - bevel, top, -0.053), at(a + bevel, top, -0.053), p[5], color, [
        tone + 0.08,
        tone,
        tone,
        tone + 0.08
      ]);
      stone.quad(
        p[2],
        at(b, bottom + bevel + 0.01, -0.053),
        at(b, top - bevel, -0.053),
        p[3],
        color,
        [tone * 0.84, tone * 0.7, tone * 0.77, tone * 0.92]
      );
      if (c === 4 && random() < 0.4) {
        const f = Math.min(b - 0.03, a + 0.1 + random() * 0.2);
        details.quad(
          at(a + 0.022, top + 0.001, -0.007),
          at(a + 0.022, top + 0.001, -0.044),
          at(f, top + 0.001, -0.035),
          at(f + 0.012, top + 0.001, -0.005),
          0x788450
        );
      }
      start = end;
    }
  }
  if (atBridge) return;
  // Hairline bronze key pattern in the outside slate only, kept clear of the planks.
  if (random() < 0.55) {
    const inlay = 0xb0a27a,
      h = 0.053;
    function line(a, b, d, e, width = 0.012) {
      const du = b - a,
        dv = e - d,
        length = Math.hypot(du, dv);
      const ou = (-dv * width) / (2 * length),
        ov = (du * width) / (2 * length);
      details.quad(
        at(a - ou, h, d - ov),
        at(a + ou, h, d + ov),
        at(b + ou, h, e + ov),
        at(b - ou, h, e - ov),
        inlay
      );
    }
    line(-0.33, 0.33, -0.103, -0.103);
    for (const end of [-1, 1]) {
      line(end * 0.32, end * 0.32, -0.103, -0.155);
      line(end * 0.32, end * 0.24, -0.155, -0.155);
      line(end * 0.24, end * 0.24, -0.155, -0.129);
    }
  }
}

function box(art, x, y, z, width, height, depth, hue) {
  const x0 = x - width / 2,
    x1 = x + width / 2,
    y0 = y - height / 2,
    y1 = y + height / 2,
    z0 = z - depth / 2,
    z1 = z + depth / 2;
  art.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], hue);
  art.quad([x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y0, z0], hue, [0.58, 0.58, 0.58, 0.58]);
  art.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], hue, [0.7, 0.7, 0.87, 0.87]);
  art.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], hue, [0.7, 0.7, 0.87, 0.87]);
  art.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], hue, [0.7, 0.7, 0.83, 0.83]);
  art.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], hue, [0.7, 0.7, 0.83, 0.83]);
}

function rod(art, a, b, radius, hue, sides = 6) {
  const f = b.map((v, i) => v - a[i]),
    l = Math.hypot(...f);
  if (l < EPSILON) return;
  f.forEach((v, i) => (f[i] = v / l));
  let ref = [0, 1, 0];
  if (Math.abs(f[1]) > 0.87) ref = [1, 0, 0];
  const cross = (u, v) => [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0]
  ];
  const side = cross(f, ref),
    n = Math.hypot(...side);
  side.forEach((v, i) => (side[i] = v / n));
  const up = cross(f, side),
    rim = [];
  for (let i = 0; i < sides; i++) {
    const t = (2 * Math.PI * i) / sides,
      d = side.map((v, j) => radius * (v * Math.cos(t) + up[j] * Math.sin(t)));
    rim.push([a.map((v, j) => v + d[j]), b.map((v, j) => v + d[j])]);
  }
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    art.quad(rim[i][0], rim[j][0], rim[j][1], rim[i][1], hue);
  }
}

function timberCrossing(wood, x0, x1, z, random) {
  const length = x1 - x0,
    cx = (x0 + x1) / 2,
    deckY = 0.083;
  const timbers = [0xa97b4b, 0xae8050, 0xb58954, 0xa97948, 0xb48c59, 0x986b3e];
  const left = x0 - 0.06,
    right = x1 + 0.06,
    boards = Math.ceil((right - left) / 0.137);
  for (const side of [-1, 1]) {
    box(wood, cx, -0.076, z + side * 0.31, length + 0.18, 0.16, 0.092, 0x6e4a32);
    box(wood, cx, -0.061, z + side * 0.438, length + 0.06, 0.083, 0.053, 0x8a6341);
    const posts = [left + 0.02, right - 0.02];
    if (length > 1.8) posts.splice(1, 0, cx);
    for (const x of posts) {
      const h = 0.306 + random() * 0.024;
      box(wood, x, h / 2 - 0.071, z + side * 0.441, 0.059, h + 0.142, 0.062, 0x8c6644);
      box(wood, x, h - 0.02, z + side * 0.441, 0.067, 0.027, 0.069, 0xc4a276);
      box(wood, x, h - 0.071, z + side * 0.441, 0.064, 0.014, 0.066, 0xd3b27a);
      box(wood, x, -0.145, z + side * 0.385, 0.107, 0.075, 0.146, 0x78583d);
    }
    for (let i = 1; i < posts.length; i++) {
      const xA = posts[i - 1],
        xB = posts[i],
        zz = z + side * 0.441;
      for (const h of [0.186, 0.28]) {
        const a = [xA, h, zz],
          b = [(xA + xB) / 2, h - 0.044, zz + side * 0.008],
          c = [xB, h, zz];
        rod(wood, a, b, 0.009, 0xccab72, 5);
        rod(wood, b, c, 0.009, 0xc6a273, 5);
      }
      rod(wood, [xA, -0.32, zz], [xA + (xB - xA) * 0.46, -0.075, zz], 0.034, 0x715039, 5);
      rod(wood, [xB, -0.32, zz], [xB - (xB - xA) * 0.46, -0.075, zz], 0.034, 0x78583b, 5);
    }
  }
  for (let i = 0; i < boards; i++) {
    const start = left + ((right - left) * i) / boards,
      end = left + ((right - left) * (i + 1)) / boards;
    const x = (start + end) / 2,
      zz = z + (random() - 0.5) * 0.018;
    const h = deckY + 0.004 * Math.sin((i + 0.15) * 2.18),
      width = 0.791 + random() * 0.042;
    box(
      wood,
      x,
      h - 0.032,
      zz,
      end - start - 0.011,
      0.064,
      width,
      timbers[Math.floor(random() * timbers.length)]
    );
    // Sparse hand-planed grain and worn peg heads, visible when zoomed.
    if (i % 2 === 0) {
      const lineX = x + (random() - 0.5) * 0.039;
      wood.quad(
        [lineX, h + 0.001, zz - 0.27],
        [lineX - 0.005, h + 0.001, zz + 0.17],
        [lineX + 0.002, h + 0.001, zz + 0.24],
        [lineX + 0.007, h + 0.001, zz - 0.19],
        0x997145
      );
    }
    for (const side of [-1, 1])
      box(wood, x, h + 0.002, zz + side * 0.314, 0.019, 0.006, 0.022, 0x69513c);
  }
}

function buildCourtyard(T, cells, center) {
  const group = new T.Group();
  group.name = '渡口石坪';
  if (!cells?.length) return group;
  const size = 2 * center + 1,
    byGrid = new Map(cells.map((c) => [key(c.x, c.y), c]));
  const dry = (x, y) => {
    const c = byGrid.get(key(x, y));
    return c && c.kind !== 'bridge';
  };
  const slate = painter(T, '雙岸舊青石'),
    wall = painter(T, '臨水駁岸'),
    ornament = painter(T, '岸石銅紋與苔跡'),
    bridge = painter(T, '兩岸木架橋', true);
  const random = randomStream(0x42a5c13b),
    coastRandom = randomStream(0x15f837);
  for (let row = 0; row < size; row++) {
    const back = row - center - 0.5;
    // Three staggered courses cross cell boundaries without drawing those boundaries.
    const courses = [
      back,
      back + 0.325 + (random() - 0.5) * 0.075,
      back + 0.696 + (random() - 0.5) * 0.067,
      back + 1
    ];
    let x = 0;
    while (x < size) {
      if (!dry(x, row)) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && dry(x, row)) x++;
      const left = start - center - 0.5,
        right = x - center - 0.5;
      slate.quad(
        [left, -0.002, back],
        [left, -0.002, back + 1],
        [right, -0.002, back + 1],
        [right, -0.002, back],
        0x626e61
      );
      for (let lane = 0; lane < 3; lane++) {
        for (let a = left; a < right - EPSILON; ) {
          let b = Math.min(right, a + 0.45 + random() * 0.59);
          if (right - b < 0.23) b = right;
          const nearShore =
            a < left + 0.5 ||
            b > right - 0.5 ||
            !dry(Math.round((a + b) / 2 + center), row + (lane === 0 ? -1 : 1));
          masonry(
            T,
            slate,
            a + 0.007,
            b - 0.007,
            courses[lane] + 0.005,
            courses[lane + 1] - 0.005,
            nearShore,
            random
          );
          a = b;
        }
      }
    }
  }
  for (const c of cells) {
    if (c.kind === 'bridge') {
      if (byGrid.get(key(c.x - 1, c.y))?.kind === 'bridge') continue;
      let end = c.x + 1;
      while (byGrid.get(key(end, c.y))?.kind === 'bridge') end++;
      timberCrossing(bridge, c.x - center - 0.5, end - center - 0.5, c.y - center, coastRandom);
      continue;
    }
    for (const [dx, dz] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ]) {
      if (dry(c.x + dx, c.y + dz)) continue;
      const next = byGrid.get(key(c.x + dx, c.y + dz));
      retainingWall(
        wall,
        ornament,
        shoreFrame(c.x - center + dx * 0.5, c.y - center + dz * 0.5, dx, dz),
        coastRandom,
        next?.kind === 'bridge'
      );
    }
  }
  slate.attach(group, true);
  wall.attach(group, true);
  ornament.attach(group);
  bridge.attach(group, true);
  return group;
}

// Union of underwater openings. The two mouths return to the surrounding river beyond the board.
function waterOpenings(cells, center) {
  const size = 2 * center + 1,
    edge = size / 2,
    dry = new Set(cells.filter((c) => c.kind !== 'bridge').map((c) => key(c.x, c.y)));
  const rectangles = [],
    previous = new Map();
  function add(x0, x1, z0, z1) {
    rectangles.push([x0, x1, z0, z1]);
  }
  for (let y = 0; y < size; y++) {
    const next = new Map(),
      z0 = y - center - 0.5,
      z1 = z0 + 1;
    let x = 0;
    while (x < size) {
      if (dry.has(key(x, y))) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && !dry.has(key(x, y))) x++;
      const x0 = start - center - 0.5,
        x1 = x - center - 0.5,
        id = key(start, x);
      if (previous.has(id)) {
        const rect = previous.get(id);
        rect[3] = z1;
        next.set(id, rect);
      } else {
        const rect = [x0, x1, z0, z1];
        rectangles.push(rect);
        next.set(id, rect);
      }
      const exteriorWidth = 0.84;
      if (start === 0) add(x0 - exteriorWidth, x0, z0, z1);
      if (x === size) add(x1, x1 + exteriorWidth, z0, z1);
      if (y === 0 || y === size - 1) {
        const outsideX0 = x0 - (start === 0 ? exteriorWidth : 0),
          outsideX1 = x1 + (x === size ? exteriorWidth : 0);
        if (y === 0) add(outsideX0, outsideX1, -edge - 0.93, -edge);
        else add(outsideX0, outsideX1, edge, edge + 2.5);
      }
    }
    previous.clear();
    for (const [k, r] of next) previous.set(k, r);
  }
  // A notch on the town edge opens into an estuary beyond the grid. The bank
  // narrows just after its faced stone lip, then widens as it meets the old river.
  for (const side of [-1, 1]) {
    const border = side < 0 ? 0 : size - 1;
    for (let row = 0; row < size; ) {
      if (dry.has(key(border, row))) {
        row++;
        continue;
      }
      const start = row;
      while (row < size && !dry.has(key(border, row))) row++;
      const back = start - center - 0.5,
        front = row - center - 0.5,
        mid = (back + front) / 2,
        half = (front - back) / 2;
      for (const [from, to, trim, drift] of [
        [0.84, 1.63, 0.1, 0],
        [1.63, 2.55, 0.25, -0.09],
        [2.55, 3.37, 0.27, -0.14],
        [3.37, 4.42, 0.12, -0.18],
        [4.42, 7, -0.14, -0.13]
      ]) {
        const a = side * (edge + from),
          b = side * (edge + to);
        add(
          Math.min(a, b),
          Math.max(a, b),
          mid + drift - (half - trim),
          mid + drift + (half - trim)
        );
      }
    }
  }
  // Follow the crossing axis upstream between the two existing pavilion foundations.
  const crossings = cells.filter((c) => c.kind === 'bridge');
  if (crossings.length) {
    const axis = crossings.reduce((t, c) => t + c.x - center, 0) / crossings.length;
    add(axis - 0.76, axis + 1.24, -edge - 2.18, -edge - 0.93);
    add(axis - 0.45, axis + 1.38, -edge - 3.75, -edge - 2.18);
    add(axis - 0.18, axis + 1.5, -edge - 8.6, -edge - 3.75);
  }
  return rectangles;
}

function polygonBounds(poly) {
  let x0 = Infinity,
    x1 = -Infinity,
    z0 = Infinity,
    z1 = -Infinity;
  for (const p of poly) {
    x0 = Math.min(x0, p[3]);
    x1 = Math.max(x1, p[3]);
    z0 = Math.min(z0, p[4]);
    z1 = Math.max(z1, p[4]);
  }
  return [x0, x1, z0, z1];
}
const overlaps = (a, b) =>
  a[1] > b[0] + EPSILON && a[0] < b[1] - EPSILON && a[3] > b[2] + EPSILON && a[2] < b[3] - EPSILON;
const insideRect = (a, b) =>
  a[0] >= b[0] - EPSILON &&
  a[1] <= b[1] + EPSILON &&
  a[2] >= b[2] - EPSILON &&
  a[3] <= b[3] + EPSILON;

function clipSide(polygon, component, threshold, direction) {
  if (!polygon.length) return polygon;
  const out = [];
  let a = polygon[polygon.length - 1],
    da = (a[component] - threshold) * direction;
  for (const b of polygon) {
    const db = (b[component] - threshold) * direction;
    if ((db > EPSILON && da < -EPSILON) || (db < -EPSILON && da > EPSILON)) {
      const t = da / (da - db),
        intersection = a.map((v, i) => v + (b[i] - v) * t);
      intersection[component] = threshold;
      out.push(intersection);
    }
    if (db >= -EPSILON) out.push(b);
    a = b;
    da = db;
  }
  return out;
}

// Keep up to four disjoint pieces outside the opening; the remainder is actual empty space.
function subtractRectangle(polygon, bounds, rect, result) {
  if (!overlaps(bounds, rect)) {
    result.push(polygon);
    return;
  }
  if (insideRect(bounds, rect)) return;
  let remainder = polygon;
  for (const [component, limit, sign] of [
    [3, rect[0], 1],
    [3, rect[1], -1],
    [4, rect[2], 1],
    [4, rect[3], -1]
  ]) {
    const outside = clipSide(remainder, component, limit, -sign);
    if (outside.length >= 3) result.push(outside);
    remainder = clipSide(remainder, component, limit, sign);
    if (remainder.length < 3) break;
  }
}

function appendSlope(art, a, b, nx, nz) {
  if ((b[3] - a[3]) * nz - (b[4] - a[4]) * nx < 0) [a, b] = [b, a];
  const count = Math.max(1, Math.ceil(Math.hypot(b[3] - a[3], b[4] - a[4]) / 0.43));
  const rings = [
    [0, 0, 0x7e856c],
    [-0.045, 0.014, 0x7b8066],
    [-0.14, 0.016, 0x6b7265],
    [-0.21, 0.041, 0x848372],
    [-0.226, 0.048, 0x9b9982],
    [-0.25, 0.023, 0x6e7468],
    [-0.38, 0.065, 0x657168],
    [-0.48, 0.042, 0x72817a],
    [-0.505, 0.081, 0x8a9280],
    [-0.562, 0.087, 0x546963],
    [-0.84, 0.152, 0x405e59]
  ];
  let last;
  for (let i = 0; i <= count; i++) {
    const f = i / count,
      x = a[3] + (b[3] - a[3]) * f,
      z = a[4] + (b[4] - a[4]) * f,
      y = a[11] + (b[11] - a[11]) * f;
    const phase = Math.sin(x * 3.83 + z * 2.99) * 0.017 + Math.sin(z * 7.23 - x * 1.79) * 0.008;
    const loop = rings.map(([drop, depth]) => [
      x + nx * depth * (1 + phase * 6),
      y + drop + phase * Math.min(1, -3 * drop),
      z + nz * depth * (1 + phase * 6)
    ]);
    if (last)
      for (let j = 1; j < loop.length; j++) {
        art.quad(last[j], loop[j], loop[j - 1], last[j - 1], rings[j][2], [0.86, 0.91, 1, 0.97]);
      }
    last = loop;
  }
}

function exteriorSlope(art, poly, holes, edge, seen) {
  const isWater = (x, z) => holes.some((r) => x > r[0] && x < r[1] && z > r[2] && z < r[3]);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length],
      dx = b[3] - a[3],
      dz = b[4] - a[4];
    const x = (a[3] + b[3]) / 2,
      z = (a[4] + b[4]) / 2;
    if (Math.max(Math.abs(x), Math.abs(z)) < edge + 0.001 || Math.hypot(dx, dz) < 0.003) continue;
    let nx = 0,
      nz = 0;
    if (Math.abs(dx) < 1e-6) nx = Number(isWater(x + 0.0002, z)) - Number(isWater(x - 0.0002, z));
    else if (Math.abs(dz) < 1e-6)
      nz = Number(isWater(x, z + 0.0002)) - Number(isWater(x, z - 0.0002));
    if (!(nx || nz)) continue;
    const ka = Math.round(a[3] * 1e4) + ',' + Math.round(a[4] * 1e4),
      kb = Math.round(b[3] * 1e4) + ',' + Math.round(b[4] * 1e4);
    const id = ka < kb ? ka + ';' + kb : kb + ';' + ka;
    if (seen.has(id)) continue;
    seen.add(id);
    appendSlope(art, a, b, nx, nz);
  }
}

// Project only low native ground in world space; retain the original local normals and pigment.
function cutGroundMesh(T, mesh, holes, edge, slopes, seen) {
  const old = mesh.geometry,
    att = old.attributes,
    m = mesh.matrixWorld.elements;
  if (!old.boundingBox) old.computeBoundingBox();
  const box = old.boundingBox.clone().applyMatrix4(mesh.matrixWorld),
    range = [box.min.x, box.max.x, box.min.z, box.max.z];
  const active = holes.filter((r) => overlaps(range, r));
  if (!active.length) return;
  const positions = [],
    colors = [],
    normals = [],
    idx = old.index,
    isBank = mesh.name === 'Terraced slate riverbanks';
  let changed = false;
  const read = (i) => {
    const x = att.position.getX(i),
      y = att.position.getY(i),
      z = att.position.getZ(i);
    return [
      x,
      y,
      z,
      m[0] * x + m[4] * y + m[8] * z + m[12],
      m[2] * x + m[6] * y + m[10] * z + m[14],
      att.color?.getX(i) ?? 1,
      att.color?.getY(i) ?? 1,
      att.color?.getZ(i) ?? 1,
      att.normal?.getX(i) ?? 0,
      att.normal?.getY(i) ?? 1,
      att.normal?.getZ(i) ?? 0,
      m[1] * x + m[5] * y + m[9] * z + m[13]
    ];
  };
  function put(p) {
    positions.push(p[0], p[1], p[2]);
    colors.push(p[5], p[6], p[7]);
    const length = Math.hypot(p[8], p[9], p[10]) || 1;
    normals.push(p[8] / length, p[9] / length, p[10] / length);
  }
  function putPoly(poly) {
    const a = poly[0];
    for (let i = 1; i + 1 < poly.length; i++) {
      const b = poly[i],
        c = poly[i + 1],
        ux = b[0] - a[0],
        uy = b[1] - a[1],
        uz = b[2] - a[2],
        vx = c[0] - a[0],
        vy = c[1] - a[1],
        vz = c[2] - a[2];
      if (
        Math.abs(uy * vz - uz * vy) + Math.abs(uz * vx - ux * vz) + Math.abs(ux * vy - uy * vx) <
        1e-11
      )
        continue;
      put(a);
      put(b);
      put(c);
    }
  }
  const count = idx?.count ?? att.position.count;
  for (let i = 0; i < count; i += 3) {
    const tri = [0, 1, 2].map((j) => read(idx ? idx.getX(i + j) : i + j)),
      bounds = polygonBounds(tri);
    const touches = active.filter((r) => overlaps(bounds, r));
    if (!touches.length) {
      for (const p of tri) put(p);
      continue;
    }
    changed = true;
    let fragments = [tri];
    for (const rect of touches) {
      const kept = [];
      for (const poly of fragments) subtractRectangle(poly, polygonBounds(poly), rect, kept);
      fragments = kept;
      if (!fragments.length) break;
    }
    const cap = isBank && tri.every((p) => p[11] > -0.113) && Math.abs(tri[0][9]) > 0.74;
    for (const poly of fragments) {
      putPoly(poly);
      if (cap) exteriorSlope(slopes, poly, holes, edge, seen);
    }
  }
  if (!changed) return;
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh.geometry = geometry;
  old.dispose();
}

// Run after the original landscape chunks receive their map scale and before cutaway/shadow baking.
function cutFerryLandscape(T, scenery, cells, center) {
  if (!cells?.length) return;
  const holes = waterOpenings(cells, center),
    slopes = painter(T, '舊河床裸露岸岩'),
    seen = new Set();
  scenery.updateMatrixWorld(true);
  scenery.traverse((mesh) => {
    const u = mesh.userData;
    if (
      mesh.isMesh &&
      u.environment &&
      !u.occluder &&
      !u.distant &&
      (u.kind === 'terrain' || u.kind === 'groundcover')
    ) {
      cutGroundMesh(T, mesh, holes, center + 0.5, slopes, seen);
    }
  });
  slopes.attach(scenery, true);
}

export { buildCourtyard, cutFerryLandscape };
