// The drawn grid, pointer picking, touch and keyboard all use this camera and ground plane.
import { fieldSize, validTile } from '../data/terrain.js';
import { POLISH } from '../polish.js';
const FLOOR = 0.09;
const smooth = (t) => t * t * (3 - 2 * t);
class FerryCamera {
  constructor(T) {
    this.T = T;
    this.camera = new T.PerspectiveCamera(38, 1, 0.12, 120);
    this.ray = new T.Raycaster();
    this.floor = new T.Plane(new T.Vector3(0, 1, 0), -FLOOR);
    this.v = new T.Vector3();
    this.width = 1200;
    this.height = 700;
    this.setMap(0);
    this.reset(true);
  }
  setMap(index) {
    this.mapIndex = index;
    const { width, height } = fieldSize(index);
    this.columns = width;
    this.rows = height;
    this.centerX = (width - 1) / 2;
    this.centerZ = (height - 1) / 2;
    this.focusX = this.focusZ = 0;
    this.zoom = 1;
    this.release();
  }
  reset(title = this.title, portrait = this.width < this.height) {
    this.title = title;
    this.zoom = 1;
    this.focusX = this.focusZ = 0;
    this.release();
    // A more square-on formation gives individual tiles a wider touch target on a phone.
    this.yaw = title ? 0.47 : portrait ? 0.2 : 0.69;
    this.pitch = title ? 0.205 : portrait ? 1.08 : 0.85;
    this.rebuild();
  }
  size(width, height, frame = null) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.frame = frame && frame.width > 0 && frame.height > 0 ? frame : null;
    this.rebuild();
  }
  rebuild() {
    const c = this.camera,
      aspect = this.width / this.height,
      narrow = aspect < 0.95;
    const frame = !this.title && this.frame;
    const fitAspect = frame ? frame.width / frame.height : aspect;
    c.aspect = aspect;
    c.fov = this.title ? 39 : 37;
    const focus = this.title
      ? new this.T.Vector3(-0.6, 1.32, -3.15)
      : new this.T.Vector3(this.focusX, FLOOR, this.focusZ);
    // Fit the whole square at every orbit angle. Perspective makes the near
    // corner larger, so the ground center belongs just above the screen center.
    const tan = Math.tan((c.fov * Math.PI) / 360),
      radius = Math.hypot(this.columns, this.rows) / 2;
    const cp = Math.cos(this.pitch),
      sp = Math.sin(this.pitch);
    const lift = 0.3 * cp * (frame ? Math.min(1, fitAspect) : 1);
    let fit =
      radius *
      Math.max(
        cp + sp / (tan * (0.86 + lift)),
        -cp + sp / (tan * (0.88 - lift)),
        Math.hypot(cp, 1 / (tan * fitAspect * 0.91))
      );
    if (frame) {
      // At portrait bearings the square's corners fit well inside its bounding circle.
      const halfX = this.columns / 2,
        halfZ = this.rows / 2,
        sine = Math.sin(this.yaw),
        cosine = Math.cos(this.yaw);
      const extent = halfX * Math.abs(sine) + halfZ * Math.abs(cosine);
      fit = extent * Math.max(cp + sp / (tan * (0.86 + lift)), -cp + sp / (tan * (0.88 - lift)));
      for (const x of [-halfX, halfX])
        for (const z of [-halfZ, halfZ]) {
          const toward = x * sine + z * cosine,
            across = x * cosine - z * sine;
          fit = Math.max(fit, toward * cp + Math.abs(across) / (tan * fitAspect * 0.93));
        }
    }
    // `push` is the brief lean-in on a high-tier technique; it is 1 at every other moment.
    const d = (this.title ? (narrow ? 17.4 : 16.2) : fit / this.push) / this.zoom;
    this.distance = d;
    c.position.set(
      focus.x + d * Math.cos(this.pitch) * Math.sin(this.yaw),
      focus.y + d * Math.sin(this.pitch),
      focus.z + d * Math.cos(this.pitch) * Math.cos(this.yaw)
    );
    c.lookAt(focus);
    c.updateProjectionMatrix();
    if (this.title) {
      // Wide: the scene moves right, clear of the title on the left. Narrow: it moves a little
      // left, so the three fighters on the east bank (actors.js) stay in the frame.
      c.projectionMatrix.elements[8] -= narrow ? -0.36 : 0.32;
      c.projectionMatrix.elements[9] -= narrow ? 0.25 : 0.01;
    } else {
      // Frame the playable tiles clear of the controls. Both renderers and the
      // ground picker still use the same full-viewport projection.
      const matrix = c.projectionMatrix.elements;
      const scale = frame ? frame.height / this.height : 1;
      matrix[0] *= scale;
      matrix[5] *= scale;
      if (frame) {
        matrix[8] -= (2 * frame.x + frame.width) / this.width - 1;
        matrix[9] -= 1 - (2 * frame.y + frame.height) / this.height;
      }
      matrix[9] -= lift * scale;
    }
    c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
    c.updateMatrixWorld(true);
    c.userData.ferryVersion = (c.userData.ferryVersion || 0) + 1;
  }
  orbit(dx, dy) {
    this.yield(false);
    this.yaw += dx;
    this.pitch = Math.max(this.title ? 0.13 : 0.4, Math.min(1.41, this.pitch + dy));
    this.rebuild();
  }
  setZoom(z) {
    this.yield();
    this.zoom = Math.max(0.78, Math.min(this.title ? 1.72 : 2.4, z));
    if (this.zoom <= 1) this.focusX = this.focusZ = 0;
    this.rebuild();
    return this.zoom;
  }
  pan(dx, dy) {
    if (this.title) return;
    this.yield();
    const width =
      (2 * this.distance * Math.tan((this.camera.fov * Math.PI) / 360)) /
      (this.frame?.height || this.height);
    const across = -dx * width,
      along = (-dy * width) / Math.sin(this.pitch);
    const bound = (v, edge) => Math.max(-edge, Math.min(edge, v));
    this.focusX = bound(
      this.focusX + across * Math.cos(this.yaw) + along * Math.sin(this.yaw),
      this.centerX
    );
    this.focusZ = bound(
      this.focusZ - across * Math.sin(this.yaw) + along * Math.cos(this.yaw),
      this.centerZ
    );
    this.rebuild();
  }
  focusTile(x, y, zoom = this.zoom) {
    if (this.title || !validTile(x, y, this.mapIndex)) return;
    this.yield();
    this.focusX = x - this.centerX;
    this.focusZ = y - this.centerZ;
    this.zoom = zoom;
    this.rebuild();
  }
  // ---- Combat direction (polish switch: cameraFollow) --------------------------------
  // Two short tweens: `glide` moves the focus, `surge` leans the camera in and out. Both
  // are advanced by step() from the board's render loop, and both give way the moment the
  // player orbits, pans, zooms or recentres.
  release() {
    this.push = 1;
    this.glide = this.surge = this.home = this.rest = null;
    this.watching = this.handsOff = false;
    this.touched = -Infinity;
  }
  // The player has taken the camera: stop steering it, and ease any lean-in back out.
  // An orbit leaves the focus alone, so the focus may still finish returning from a lean.
  yield(focus = true) {
    this.touched = performance.now();
    if (this.watching) this.handsOff = true;
    this.glide = null;
    const rest = this.rest;
    this.rest = null;
    if (focus) {
      this.home = null;
      if (rest) {
        this.focusX = rest.x;
        this.focusZ = rest.z;
      }
    } else if (rest) this.glideTo(rest.x, rest.z, 160);
    if (this.push !== 1 || this.surge)
      this.surge = { from: this.push, to: 1, at: null, ms: 160, delay: 0 };
  }
  get easing() {
    return !!(this.glide || this.surge);
  }
  glideTo(x, z, ms) {
    const bound = (v, edge) => Math.max(-edge, Math.min(edge, v));
    x = bound(x, this.centerX);
    z = bound(z, this.centerZ);
    if (Math.abs(x - this.focusX) < 0.02 && Math.abs(z - this.focusZ) < 0.02) return;
    this.glide = { fromX: this.focusX, fromZ: this.focusZ, x, z, at: null, ms };
  }
  // The enemy phase starts (true) or hands back to the player (false).
  watch(on) {
    if (!POLISH.cameraFollow || this.title) return;
    this.watching = on;
    if (on) {
      this.handsOff = false;
      this.home = null;
      return;
    }
    if (this.home) this.glideTo(this.home.x, this.home.z, 360);
    this.home = null;
  }
  // Brings the given tiles into view if any of them sits near or beyond the edge.
  // Does nothing at the default framing, where the whole field is already on screen.
  follow(tiles, ms = 320) {
    if (!POLISH.cameraFollow || this.title || this.handsOff || !tiles.length) return false;
    if (this.zoom <= 1.02 && !this.focusX && !this.focusZ && !this.home) return false;
    const f = this.frame,
      left = f ? f.x / this.width : 0,
      top = f ? f.y / this.height : 0,
      wide = f ? f.width / this.width : 1,
      tall = f ? f.height / this.height : 1;
    const inside = tiles.every(({ x, y }) => {
      const p = this.tile(x, y);
      return (
        p.z < 1 &&
        p.x > left + wide * 0.1 &&
        p.x < left + wide * 0.9 &&
        p.y > top + tall * 0.2 &&
        p.y < top + tall * 0.92
      );
    });
    if (inside) return false;
    this.home ??= { x: this.focusX, z: this.focusZ };
    const cx = tiles.reduce((sum, t) => sum + t.x, 0) / tiles.length,
      cy = tiles.reduce((sum, t) => sum + t.y, 0) / tiles.length;
    this.glideTo(cx - this.centerX, cy - this.centerZ, ms);
    return true;
  }
  // Leans in on a high-tier technique: a small push, and a step of the focus toward the blow.
  lean(x, y, push, ms) {
    if (!POLISH.cameraFollow || this.title || performance.now() - this.touched < 500) return false;
    this.rest ??= { x: this.focusX, z: this.focusZ };
    const share = 0.26;
    this.glideTo(
      this.focusX + (x - this.centerX - this.focusX) * share,
      this.focusZ + (y - this.centerZ - this.focusZ) * share,
      ms
    );
    this.surge = { from: this.push, to: push, at: null, ms, delay: 0 };
    return true;
  }
  // Ends a lean, after `delay` ms, and returns the focus to where it was.
  settle(ms = 340, delay = 0) {
    if (this.push !== 1 || this.surge)
      this.surge = { from: this.push, to: 1, at: null, ms, delay, back: this.rest };
    else if (this.rest) this.glideTo(this.rest.x, this.rest.z, ms);
    this.rest = null;
  }
  // Advances the tweens. Returns true when the view changed and the world must be redrawn.
  step(now) {
    if (!this.glide && !this.surge) return false;
    // Two slow frames in a row mean the world is expensive to redraw: finish at once.
    const slow = now - (this.stepped ?? now) > 90;
    this.slowSteps = slow ? (this.slowSteps || 0) + 1 : 0;
    this.stepped = now;
    const snap = this.slowSteps >= 2;
    let moved = false;
    const s = this.surge;
    if (s) {
      s.at ??= now + s.delay;
      if (now >= s.at) {
        if (s.back) {
          // The focus travels home alongside the lean-out.
          this.glideTo(s.back.x, s.back.z, s.ms);
          s.back = null;
        }
        const k = snap || !s.ms ? 1 : Math.min(1, (now - s.at) / s.ms);
        this.push = s.from + (s.to - s.from) * smooth(k);
        if (k >= 1) this.surge = null;
        moved = true;
      }
    }
    const g = this.glide;
    if (g) {
      g.at ??= now;
      const k = snap || !g.ms ? 1 : Math.min(1, (now - g.at) / g.ms);
      this.focusX = g.fromX + (g.x - g.fromX) * smooth(k);
      this.focusZ = g.fromZ + (g.z - g.fromZ) * smooth(k);
      if (k >= 1) this.glide = null;
      moved = true;
    }
    if (!this.glide && !this.surge) this.stepped = null;
    if (moved) this.rebuild();
    return moved;
  }
  point(x, y, z) {
    this.v.set(x, y, z).project(this.camera);
    return { x: (this.v.x + 1) * 0.5, y: (1 - this.v.y) * 0.5, z: this.v.z };
  }
  tile(x, y, h = FLOOR) {
    return this.point(x - this.centerX, h, y - this.centerZ);
  }
  ground(nx, ny) {
    this.ray.setFromCamera({ x: nx * 2 - 1, y: 1 - ny * 2 }, this.camera);
    const hit = this.ray.ray.intersectPlane(this.floor, this.v);
    if (!hit) return null;
    const x = Math.floor(hit.x + this.columns / 2),
      y = Math.floor(hit.z + this.rows / 2);
    return validTile(x, y, this.mapIndex) ? { x, y } : null;
  }
}

export { FLOOR, FerryCamera };
