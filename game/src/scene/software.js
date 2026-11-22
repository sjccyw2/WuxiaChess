import { mapLayout } from '../data/terrain.js';
// A depth-buffered renderer for browsers without WebGL. It draws the same model,
// camera and projected tiles. Static scenery is redrawn only when the camera changes.
import { sunDirection } from './environment.js';
import { setting, bytes, isNight } from './maze-atmosphere.js';

const clamp = (n, l, h) => Math.max(l, Math.min(h, n));
const pack = (r, g, b) => (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
function lightChannel(x) {
  const m = clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1);
  return Math.round(255 * (m <= 0.0031308 ? 12.92 * m : 1.055 * m ** (1 / 2.4) - 0.055));
}
function raster(x0, y0, z0, x1, y1, z1, x2, y2, z2, w, h, depth, pixels, color, thin = false) {
  let left = Math.max(0, Math.floor(Math.min(x0, x1, x2))),
    right = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
  let top = Math.max(0, Math.floor(Math.min(y0, y1, y2))),
    bottom = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
  if (left > right || top > bottom) return;
  const ax = x1 - x0,
    ay = y1 - y0,
    bx = x2 - x0,
    by = y2 - y0,
    det = ax * by - ay * bx;
  if (Math.abs(det) < 0.065) return;
  const du = by / det,
    dv = -ay / det,
    eu = -bx / det,
    ev = ax / det,
    za = z1 - z0,
    zb = z2 - z0;
  let ru = ((left + 0.5 - x0) * by - (top + 0.5 - y0) * bx) / det,
    rv = (ax * (top + 0.5 - y0) - ay * (left + 0.5 - x0)) / det;
  for (let iy = top; iy <= bottom; iy++, ru += eu, rv += ev) {
    let u = ru,
      v = rv,
      p = iy * w + left;
    for (let ix = left; ix <= right; ix++, u += du, v += dv, p++) {
      if (u < -0.0001 || v < -0.0001 || u + v > 1.0001) continue;
      const z = z0 + u * za + v * zb;
      if (thin === true && ((ix + iy * 3) & 7) !== 0) continue;
      if (thin && thin !== true && thin[p] > 0 && z > thin[p] && ((ix + iy * 3) & 7) > 1) continue;
      if (z > depth[p]) {
        depth[p] = z;
        if (pixels) pixels[p] = color;
      }
    }
  }
}
class SoftwareScene {
  constructor(T, canvas, scenery) {
    this.T = T;
    this.canvas = canvas;
    this.index = scenery.userData.mapIndex || 0;
    const board = mapLayout(this.index);
    this.dimensions = { width: board.width, height: board.height };
    this.shoreRows = new Uint32Array(board.height);
    for (const { x, y } of board.cells) this.shoreRows[y] |= 1 << x;
    this.setting = setting(this.index);
    this.haze = bytes(this.setting.horizon);
    this.skyBase = this.index ? this.haze : [193, 208, 194];
    this.zenith = this.index ? bytes(this.setting.zenith) : [127, 171, 180];
    this.surface = bytes(this.setting.base);
    this.fogK = this.index ? this.setting.fog ** 2 : 0.00038;
    const sunlight = bytes(this.setting.sun);
    this.lighting = this.index
      ? sunlight.map((v, j) => [1.12, 1.05, 0.97][j] * (0.31 + (0.69 * v) / 255))
      : [1.13, 0.91, 0.65];
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.batches = [];
    this.matrix = new T.Matrix4();
    const p = new T.Vector3(),
      n = new T.Vector3(),
      normalMat = new T.Matrix3();
    this.sun = new T.Vector3(...sunDirection()).normalize();
    this.axis = new T.Vector3(0, 1, 0).cross(this.sun).normalize();
    this.up = this.sun.clone().cross(this.axis);
    scenery.updateMatrixWorld(true);
    for (const group of scenery.children)
      group.traverse((mesh) => {
        if (!mesh.isMesh) return;
        const g = mesh.geometry,
          attr = g.attributes,
          mat = mesh.material,
          len = attr.position.count;
        const pos = new Float32Array(len * 3),
          colors = new Float32Array(len * 3),
          normal = new Float32Array(len * 3);
        normalMat.getNormalMatrix(mesh.matrixWorld);
        for (let i = 0; i < len; i++) {
          p.fromBufferAttribute(attr.position, i).applyMatrix4(mesh.matrixWorld);
          p.toArray(pos, i * 3);
          if (attr.normal) n.fromBufferAttribute(attr.normal, i).applyNormalMatrix(normalMat);
          else n.set(0, 1, 0);
          n.toArray(normal, i * 3);
          const c = mat.color;
          colors[i * 3] = (c?.r ?? 1) * (attr.color?.getX(i) ?? 1);
          colors[i * 3 + 1] = (c?.g ?? 1) * (attr.color?.getY(i) ?? 1);
          colors[i * 3 + 2] = (c?.b ?? 1) * (attr.color?.getZ(i) ?? 1);
        }
        const idx = g.index?.array ?? null,
          count = idx ? idx.length : len;
        this.batches.push({
          group,
          pos,
          normal,
          colors,
          idx,
          count,
          len,
          em: mat.emissive?.clone().multiplyScalar(mat.emissiveIntensity ?? 1) || new T.Color(0),
          far: group.userData.distant,
          shadow: mesh.castShadow,
          screen: new Float32Array(len * 3),
          paint: new Uint32Array(count / 3)
        });
      });
    this.bakeLight();
  }
  bakeLight() {
    const size = 400,
      depth = new Float32Array(size * size);
    depth.fill(-999);
    const right = this.axis,
      up = this.up,
      sun = this.sun,
      step = size / 28;
    for (const b of this.batches) {
      const { pos, screen: v, idx, len, count } = b;
      for (let i = 0; i < len; i++) {
        const j = i * 3,
          x = pos[j],
          y = pos[j + 1],
          z = pos[j + 2];
        v[j] = size * 0.5 + (x * right.x + y * right.y + z * right.z) * step;
        v[j + 1] = size * 0.5 - (x * up.x + y * up.y + z * up.z) * step;
        v[j + 2] = x * sun.x + y * sun.y + z * sun.z;
      }
      if (b.far || !b.shadow) continue;
      for (let i = 0; i < count; i += 3) {
        const a = (idx ? idx[i] : i) * 3,
          c = (idx ? idx[i + 1] : i + 1) * 3,
          d = (idx ? idx[i + 2] : i + 2) * 3;
        raster(
          v[a],
          v[a + 1],
          v[a + 2],
          v[c],
          v[c + 1],
          v[c + 2],
          v[d],
          v[d + 1],
          v[d + 2],
          size,
          size,
          depth,
          null,
          0
        );
      }
    }
    for (const b of this.batches) {
      const { normal: n, screen: v, idx, count, colors: c } = b;
      for (let i = 0; i < count; i += 3) {
        const a = (idx ? idx[i] : i) * 3,
          d = (idx ? idx[i + 1] : i + 1) * 3,
          e = (idx ? idx[i + 2] : i + 2) * 3;
        const sx = Math.round((v[a] + v[d] + v[e]) / 3),
          sy = Math.round((v[a + 1] + v[d + 1] + v[e + 1]) / 3),
          sz = (v[a + 2] + v[d + 2] + v[e + 2]) / 3;
        let shade = 1;
        if (!b.far && sx > 1 && sy > 1 && sx < size - 2 && sy < size - 2) {
          const index = sy * size + sx;
          shade =
            1 -
            [0, -1, 1, -size, size].reduce(
              (sum, j) => sum + (sz + 0.058 < depth[index + j] ? 1 : 0),
              0
            ) *
              0.12;
        }
        const nx = (n[a] + n[d] + n[e]) / 3,
          ny = (n[a + 1] + n[d + 1] + n[e + 1]) / 3,
          nz = (n[a + 2] + n[d + 2] + n[e + 2]) / 3;
        const diffuse = Math.max(0, nx * sun.x + ny * sun.y + nz * sun.z) * shade;
        const ambient = 0.47 + ny * 0.12;
        const r = (c[a] + c[d] + c[e]) / 3,
          g = (c[a + 1] + c[d + 1] + c[e + 1]) / 3,
          bl = (c[a + 2] + c[d + 2] + c[e + 2]) / 3;
        b.paint[i / 3] = pack(
          lightChannel(r * (ambient + diffuse * this.lighting[0]) + b.em.r * 0.69),
          lightChannel(g * (ambient * 1.02 + diffuse * this.lighting[1]) + b.em.g * 0.69),
          lightChannel(bl * (ambient * 1.06 + diffuse * this.lighting[2]) + b.em.b * 0.69)
        );
      }
      b.colors = null;
      b.normal = null;
    }
  }
  geometry(cam, pixels, depth, w, h, mirror) {
    const waterY = this.setting.level,
      haze = this.haze;
    const m = this.matrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).elements;
    for (const b of this.batches) {
      const { pos: p, idx, len, count, screen: v } = b;
      for (let i = 0; i < len; i++) {
        const j = i * 3,
          x = p[j],
          y = mirror ? 2 * waterY - p[j + 1] : p[j + 1],
          z = p[j + 2],
          cz = m[3] * x + m[7] * y + m[11] * z + m[15];
        const inv = cz > 0.15 ? 1 / cz : -1;
        v[j + 2] = inv;
        v[j] = ((m[0] * x + m[4] * y + m[8] * z + m[12]) * inv * 0.5 + 0.5) * w;
        v[j + 1] = (0.5 - (m[1] * x + m[5] * y + m[9] * z + m[13]) * inv * 0.5) * h;
      }
      for (let i = 0; i < count; i += 3) {
        const a = (idx ? idx[i] : i) * 3,
          d = (idx ? idx[i + 1] : i + 1) * 3,
          e = (idx ? idx[i + 2] : i + 2) * 3;
        if (v[a + 2] <= 0 || v[d + 2] <= 0 || v[e + 2] <= 0) continue;
        if (mirror && (p[a + 1] + p[d + 1] + p[e + 1]) / 3 < waterY) continue;
        const dist = 3 / (v[a + 2] + v[d + 2] + v[e + 2]),
          fog = (1 - Math.exp(-this.fogK * dist * dist)) * 0.89;
        let color = b.paint[i / 3],
          r = color & 255,
          g = (color >> 8) & 255,
          bl = (color >> 16) & 255;
        color = pack(r + (haze[0] - r) * fog, g + (haze[1] - g) * fog, bl + (haze[2] - bl) * fog);
        raster(
          v[a],
          v[a + 1],
          v[a + 2],
          v[d],
          v[d + 1],
          v[d + 2],
          v[e],
          v[e + 1],
          v[e + 2],
          w,
          h,
          depth,
          pixels,
          color,
          !mirror && b.group.userData.cutaway && (this.index ? this.boardMask : true)
        );
      }
    }
  }
  render(cam) {
    if (!this.ctx) return;
    const mode = this.setting.mode,
      waterY = this.setting.level;
    const haze = this.haze,
      skyBase = this.skyBase,
      high = this.zenith,
      surf = this.surface;
    const w = this.canvas.width,
      h = this.canvas.height;
    if (!this.frame || this.frame.width !== w || this.frame.height !== h) {
      this.frame = this.ctx.createImageData(w, h);
      this.depth = new Float32Array(w * h);
      this.boardMask = new Float32Array(w * h);
    }
    this.boardMask.fill(0);
    const bits = new Uint32Array(this.frame.data.buffer),
      depth = this.depth;
    depth.fill(0);
    const pe = cam.projectionMatrix.elements,
      me = cam.matrixWorld.elements;
    for (let y = 0; y < h; y++) {
      const ny = (1 - (2 * (y + 0.5)) / h + pe[9]) / pe[5],
        sy = ny * me[5] - me[9];
      for (let x = 0; x < w; x++) {
        const nx = ((2 * (x + 0.5)) / w - 1 + pe[8]) / pe[0],
          sx = nx * me[0] + ny * me[4] - me[8],
          sz = nx * me[2] + ny * me[6] - me[10],
          len = Math.hypot(sx, sy, sz);
        const height = Math.pow(Math.max(0, sy / len), 0.56),
          sun = Math.max(0, (-sx * 0.6 + sy * 0.23 - sz * 0.77) / len);
        const glow = Math.pow(sun, 12),
          disc = clamp((sun - 0.9984) * 1300, 0, 1);
        if (this.index && sy < -0.001) {
          const distance = (0.14 - cam.position.y) / sy;
          const col = Math.floor(cam.position.x + sx * distance + this.dimensions.width / 2);
          const row = Math.floor(cam.position.z + sz * distance + this.dimensions.height / 2);
          if (col >= 0 && col < this.dimensions.width && (this.shoreRows[row] || 0) & (1 << col))
            this.boardMask[y * w + x] = 1 / distance;
        }
        let sparkle = 0;
        if (mode === 'stars') {
          const ax = Math.atan2(sx, sz) * 63,
            ay = Math.asin(clamp(sy / len, -1, 1)) * 62;
          const u = Math.floor(ax),
            v = Math.floor(ay),
            n = Math.sin(u * 127.1 + v * 311.7) * 43758.54;
          if (n - Math.floor(n) > 0.87 && Math.hypot(ax - u - 0.51, ay - v - 0.48) < 0.095)
            sparkle = 92;
        }
        const sunlight =
          (this.index === 7 ? 0.07 : isNight(this.index) ? 0.34 : 1) *
          (this.index ? clamp((7 * sy) / len, 0, 1) : 1);
        bits[y * w + x] = pack(
          clamp(
            skyBase[0] +
              (high[0] - skyBase[0]) * height +
              (42 * glow + 41 * disc) * sunlight +
              sparkle,
            0,
            255
          ),
          clamp(
            skyBase[1] +
              (high[1] - skyBase[1]) * height +
              (21 * glow + 42 * disc) * sunlight +
              sparkle,
            0,
            255
          ),
          clamp(
            skyBase[2] +
              (high[2] - skyBase[2]) * height +
              (6 * glow + 36 * disc) * sunlight +
              sparkle,
            0,
            255
          )
        );
      }
    }
    let reflection;
    if (mode === 'water') {
      this.geometry(cam, bits, depth, w, h, true);
      reflection = new Uint32Array(bits);
    }
    depth.fill(0);
    for (let y = 0; y < h; y++) {
      const ny = (1 - (2 * (y + 0.5)) / h + pe[9]) / pe[5],
        dy = ny * me[5] - me[9];
      if (dy >= -0.001) continue;
      const dist = (waterY - cam.position.y) / dy,
        inv = 1 / dist;
      for (let x = 0; x < w; x++) {
        const nx = ((2 * (x + 0.5)) / w - 1 + pe[8]) / pe[0],
          wx = cam.position.x + dist * (nx * me[0] + ny * me[4] - me[8]),
          wz = cam.position.z + dist * (nx * me[2] + ny * me[6] - me[10]);
        const p = y * w + x,
          fog = 1 - Math.exp(-this.fogK * dist * dist);
        let rr, gg, bb;
        if (mode === 'water') {
          const wave =
            Math.sin(wz * 7.6 + wx * 0.92 + 1.8 * Math.sin(wx * 2.1)) * 0.62 +
            Math.sin(wx * 4.2 + wz * 1.6) * 0.38;
          const b =
            reflection[
              clamp(y + Math.round(wave * 1.2), 0, h - 1) * w +
                clamp(x + Math.round(wave * 3.7), 0, w - 1)
            ];
          const f = clamp(0.27 + 0.29 / (Math.abs(dy) + 0.56), 0.32, 0.68),
            glint = Math.max(0, wave - 0.75) * 72;
          rr = (surf[0] + 8 * wave) * (1 - f) + (b & 255) * f + glint;
          gg = (surf[1] + 9 * wave) * (1 - f) + ((b >> 8) & 255) * f + glint;
          bb = (surf[2] + 7 * wave) * (1 - f) + ((b >> 16) & 255) * f + glint;
        } else {
          const grit = Math.sin(wx * 0.89 + Math.sin(wz * 0.64)) * Math.cos(wz * 0.61 + wx * 0.41);
          const mist =
            mode === 'earth'
              ? 0.038 * grit
              : 0.21 + 0.13 * grit + 0.045 * Math.sin(wx * 0.35 + wz * 0.29);
          rr = surf[0] + (haze[0] - surf[0]) * mist;
          gg = surf[1] + (haze[1] - surf[1]) * mist;
          bb = surf[2] + (haze[2] - surf[2]) * mist;
          if (mode === 'stars') {
            const ux = wx * 0.67,
              uz = wz * 0.67,
              xx = Math.floor(ux),
              zz = Math.floor(uz);
            const n = Math.sin((xx + 31) * 127.1 + (zz + 31) * 311.7) * 43758.545;
            if (n - Math.floor(n) > 0.75) {
              const a = Math.sin(xx * 127.1 + zz * 311.7) * 43758.545,
                b = Math.sin((xx + 9) * 127.1 + (zz + 9) * 311.7) * 43758.545;
              const rad = Math.hypot(ux - xx - (a - Math.floor(a)), uz - zz - (b - Math.floor(b)));
              const star = clamp((0.06 - rad) * 24, 0, 1) * 106;
              rr += star;
              gg += star;
              bb += star;
            }
          }
        }
        bits[p] = pack(
          rr + (haze[0] - rr) * fog,
          gg + (haze[1] - gg) * fog,
          bb + (haze[2] - bb) * fog
        );
        depth[p] = inv;
      }
    }
    this.geometry(cam, bits, depth, w, h, false);
    this.ctx.putImageData(this.frame, 0, 0);
  }
}

export { SoftwareScene };
