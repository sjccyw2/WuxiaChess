// Small, deterministic mesh batches. Architectural profiles and plants are built
// in local coordinates, then share a handful of draw calls per cutaway object.
const TAU = Math.PI * 2;
const circle = TAU;
const midway = (a, b, t) => a.map((n, i) => n + (b[i] - n) * t);
function randomStream(seed) {
  const next = () => (seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296;
  return {
    next,
    range: (a, b) => a + (b - a) * next(),
    pick: (values) => values[Math.floor(next() * values.length)]
  };
}
class Model {
  constructor(T, seed) {
    this.T = T;
    this.rng = randomStream(seed);
    this.colors = new Map();
    this.parts = [
      { p: [], c: [], i: [] },
      { p: [], c: [], i: [] }
    ];
    this.part = 0;
    this.matrix = new T.Matrix4();
  }
  rgb(code) {
    if (Array.isArray(code)) return code;
    if (!this.colors.has(code)) {
      const c = new this.T.Color(code);
      this.colors.set(code, [c.r, c.g, c.b]);
    }
    return this.colors.get(code);
  }
  mix(a, b, t) {
    return midway(this.rgb(a), this.rgb(b), t);
  }
  frame(x, y, z, yaw, scale, draw, rx = 0, rz = 0) {
    const T = this.T,
      prev = this.matrix;
    const sizes = Array.isArray(scale) ? scale : [scale, scale, scale];
    const pose = new T.Matrix4().compose(
      new T.Vector3(x, y, z),
      new T.Quaternion().setFromEuler(new T.Euler(rx, yaw, rz, 'YXZ')),
      new T.Vector3(...sizes)
    );
    this.matrix = prev.clone().multiply(pose);
    draw();
    this.matrix = prev;
  }
  glow(draw) {
    const last = this.part;
    this.part = 1;
    draw();
    this.part = last;
  }
  face(points, col, brightness = 1) {
    const dest = this.parts[this.part],
      e = this.matrix.elements,
      start = dest.p.length / 3;
    const perVertex = Array.isArray(col) && Array.isArray(col[0]);
    for (let i = 0; i < points.length; i++) {
      const [x, y, z] = points[i];
      dest.p.push(
        e[0] * x + e[4] * y + e[8] * z + e[12],
        e[1] * x + e[5] * y + e[9] * z + e[13],
        e[2] * x + e[6] * y + e[10] * z + e[14]
      );
      const c = perVertex ? col[i] : this.rgb(col);
      dest.c.push(c[0] * brightness, c[1] * brightness, c[2] * brightness);
    }
    for (let i = 1; i < points.length - 1; i++) dest.i.push(start, start + i, start + i + 1);
  }
  box(x, y, z, w, h, d, color) {
    const l = x - w / 2,
      r = x + w / 2,
      b = z - d / 2,
      f = z + d / 2,
      lo = y - h / 2,
      hi = y + h / 2;
    const a = [l, lo, b],
      c = [r, lo, b],
      e = [r, lo, f],
      g = [l, lo, f],
      A = [l, hi, b],
      C = [r, hi, b],
      E = [r, hi, f],
      G = [l, hi, f];
    this.face([A, G, E, C], color);
    this.face([a, A, C, c], color);
    this.face([c, C, E, e], color);
    this.face([e, E, G, g], color);
    this.face([g, G, A, a], color);
    this.face([a, c, e, g], color);
  }
  tube(a, b, ra, rb, color, n = 7) {
    const T = this.T,
      v = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (v.lengthSq() < 1e-9) return;
    v.normalize();
    const u = new T.Vector3()
      .crossVectors(Math.abs(v.y) > 0.88 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0), v)
      .normalize();
    const w = new T.Vector3().crossVectors(v, u),
      top = [],
      bot = [];
    for (let i = 0; i < n; i++) {
      const t = (i * TAU) / n,
        cs = Math.cos(t),
        sn = Math.sin(t),
        dx = u.x * cs + w.x * sn,
        dy = u.y * cs + w.y * sn,
        dz = u.z * cs + w.z * sn;
      bot.push([a[0] + dx * ra, a[1] + dy * ra, a[2] + dz * ra]);
      top.push([b[0] + dx * rb, b[1] + dy * rb, b[2] + dz * rb]);
    }
    for (let i = 0; i < n; i++) {
      let j = (i + 1) % n;
      this.face([bot[i], bot[j], top[j], top[i]], color);
    }
    if (rb > 0) this.face(top, color);
  }
  line(points, r, col, n = 5) {
    for (let i = 1; i < points.length; i++) this.tube(points[i - 1], points[i], r, r, col, n);
  }
  // profile contains [height, radius]. Negative radii are unnecessary; turn the
  // profile inward again to model an actual open bronze bowl or cave mouth.
  lathe(x, y, z, profile, col, n = 16) {
    let last;
    for (let k = 0; k < profile.length; k++) {
      const [h, r] = profile[k],
        ring = [];
      for (let j = 0; j < n; j++) {
        const a = (TAU * j) / n;
        ring.push([x + Math.cos(a) * r, y + h, z + Math.sin(a) * r]);
      }
      if (last)
        for (let j = 0; j < n; j++) {
          let q = (j + 1) % n;
          this.face([last[j], ring[j], ring[q], last[q]], col);
        }
      last = ring;
    }
    if (last && profile.at(-1)[1] > 0.002) this.face([...last].reverse(), col);
  }
  hoop(x, y, z, r, t, col, n = 32, plane = 'xz', tilt = 0) {
    const p = [];
    for (let i = 0; i <= n; i++) {
      const a = (i * TAU) / n,
        u = Math.cos(a) * r,
        v = Math.sin(a) * r;
      if (plane === 'xy') p.push([x + u, y + v * Math.cos(tilt), z + v * Math.sin(tilt)]);
      else if (plane === 'yz') p.push([x + u * Math.sin(tilt), y + v, z + u * Math.cos(tilt)]);
      else p.push([x + u, y + v * Math.sin(tilt), z + v * Math.cos(tilt)]);
    }
    this.line(p, t, col, 5);
  }
  rock(x, y, z, rx, h, rz, col, cap = col, n = 9, angle = 0) {
    const r = this.rng,
      edges = Array.from({ length: n }, (_, i) => [
        (i * TAU) / n + angle + r.range(-0.12, 0.12),
        r.range(0.83, 1.13),
        r.range(-0.07, 0.07)
      ]);
    let last;
    for (const [hei, scale] of [
      [0, 0.84],
      [0.19, 1],
      [0.75, 0.87],
      [1, 0.61]
    ]) {
      const ring = edges.map(([a, k, v]) => [
        x + Math.cos(a) * rx * k * scale + rx * 0.06 * hei,
        y + h * (hei + v * 0.61),
        z + Math.sin(a) * rz * k * scale - rz * 0.06 * hei
      ]);
      if (last)
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n,
            top = this.mix(col, cap, hei > 0.8 ? 0.56 : 0.14);
          this.face(
            [last[i], ring[i], ring[j], last[j]],
            [this.rgb(col), top, top, this.rgb(col)],
            0.94 + 0.06 * Math.abs(Math.cos(i))
          );
        }
      last = ring;
    }
    for (let i = 0; i < n; i++)
      this.face([[x + rx * 0.034, y + h * 1.045, z], last[(i + 1) % n], last[i]], cap);
  }
  crystal(x, y, z, r, h, col, light, n = 6, slant = 0.0) {
    const ring = [],
      base = [];
    for (let i = 0; i < n; i++) {
      const a = (i * TAU) / n,
        dx = Math.cos(a) * r,
        dz = Math.sin(a) * r;
      base.push([x + dx * 0.79, y, z + dz * 0.8]);
      ring.push([x + dx + slant * 0.73, y + h * (0.65 + 0.04 * Math.sin(i)), z + dz]);
    }
    const top = [x + slant, y + h, z + r * 0.14];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        c = this.mix(col, light, i % 3 === 0 ? 0.46 : 0.18),
        l = this.mix(col, light, 0.6 + 0.12 * (i % 3));
      this.face([base[i], ring[i], ring[j], base[j]], [this.rgb(col), c, l, this.rgb(col)]);
      this.face([ring[i], top, ring[j]], [c, this.rgb(light), l]);
    }
  }
  leaf(a, b, w, col, light = col, arch = 0.03) {
    const dx = b[0] - a[0],
      dz = b[2] - a[2],
      l = Math.hypot(dx, dz) || 1;
    const mid = midway(a, b, 0.4);
    mid[1] += arch;
    const left = [mid[0] - (dz / l) * w, mid[1] - 0.1 * w, mid[2] + (dx / l) * w],
      right = [mid[0] + (dz / l) * w, mid[1] - 0.2 * w, mid[2] - (dx / l) * w];
    const ridge = [mid[0], mid[1] + w * 0.18, mid[2]];
    this.face([a, left, b, ridge], col);
    this.face([a, ridge, b, right], light);
  }
  finish(name, { occluder = false, distant = false, cast = true } = {}) {
    const T = this.T,
      g = new T.Group();
    g.name = name;
    g.userData = { occluder, distant, kind: 'maze-scenery' };
    for (let k = 0; k < this.parts.length; k++) {
      const { p, c, i } = this.parts[k];
      if (!p.length) continue;
      const geom = new T.BufferGeometry();
      geom.setAttribute('position', new T.Float32BufferAttribute(p, 3));
      geom.setAttribute('color', new T.Float32BufferAttribute(c, 3));
      geom.setIndex(i);
      geom.computeVertexNormals();
      geom.computeBoundingSphere();
      const mat = new T.MeshStandardMaterial({
        vertexColors: true,
        side: T.DoubleSide,
        roughness: 0.82,
        metalness: k ? 0.08 : 0.045,
        emissive: k ? 0x426461 : 0,
        emissiveIntensity: k ? 0.47 : 0
      });
      mat.name = k ? 'Maze_Luminous' : 'Maze_Stone_Wood';
      const mesh = new T.Mesh(geom, mat);
      mesh.castShadow = cast && !k && !distant;
      mesh.receiveShadow = !distant;
      g.add(mesh);
    }
    return g;
  }
}

export { circle, midway, randomStream, Model };
