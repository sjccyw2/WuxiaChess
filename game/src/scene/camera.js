// The drawn grid, pointer picking, touch and keyboard all use this camera and ground plane.
import { fieldSize, validTile } from '../data/terrain.js';
const FLOOR = 0.09;
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
  }
  reset(title = this.title, portrait = this.width < this.height) {
    this.title = title;
    this.zoom = 1;
    this.focusX = this.focusZ = 0;
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
    const d = (this.title ? (narrow ? 17.4 : 16.2) : fit) / this.zoom;
    this.distance = d;
    c.position.set(
      focus.x + d * Math.cos(this.pitch) * Math.sin(this.yaw),
      focus.y + d * Math.sin(this.pitch),
      focus.z + d * Math.cos(this.pitch) * Math.cos(this.yaw)
    );
    c.lookAt(focus);
    c.updateProjectionMatrix();
    if (this.title) {
      c.projectionMatrix.elements[8] -= narrow ? 0 : 0.32;
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
    this.yaw += dx;
    this.pitch = Math.max(this.title ? 0.13 : 0.4, Math.min(1.41, this.pitch + dy));
    this.rebuild();
  }
  setZoom(z) {
    this.zoom = Math.max(0.78, Math.min(this.title ? 1.72 : 2.4, z));
    if (this.zoom <= 1) this.focusX = this.focusZ = 0;
    this.rebuild();
    return this.zoom;
  }
  pan(dx, dy) {
    if (this.title) return;
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
    this.focusX = x - this.centerX;
    this.focusZ = y - this.centerZ;
    this.zoom = zoom;
    this.rebuild();
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
