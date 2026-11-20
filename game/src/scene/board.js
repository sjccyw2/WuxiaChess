import { fieldCells } from '../data/terrain.js';
import * as G from '../rules/game.js';
import { FerryCamera } from './camera.js';
import { makeScenery, decorateWorld, Cutaway } from './environment.js';
import { SoftwareScene } from './software.js';
import { ActorLayer } from '../actors/actors.js';
import { POLISH } from '../polish.js';
import { installGrade } from './stage-light.js';

// A legal destination always owns its entire projected tile, including pixels painted by a sprite.
function resolveBoardPick(s, mode, ground, body, reach) {
  if (!s) return null;
  if (ground && !G.valid(ground.x, ground.y, s.mapIndex)) ground = null;
  const actor = G.find(s, s.selected),
    occupant = ground && G.at(s, ground.x, ground.y);
  const silhouette = body && G.find(s, body);
  if (
    ground &&
    mode === 'move' &&
    G.canAct(s, actor) &&
    !actor.moved &&
    !occupant &&
    (reach || G.reachable(s, actor)).has(G.key(ground.x, ground.y))
  )
    return ground;
  if (mode === 'skill' && G.artFor(actor).blink && ground) return ground;
  if (mode === 'attack' || mode === 'skill') {
    if (G.targetOK(s, actor, occupant, mode === 'skill')) return { id: occupant.id };
    if (G.targetOK(s, actor, silhouette, mode === 'skill')) return { id: silhouette.id };
  }
  if (occupant) return { id: occupant.id };
  if (silhouette && G.living(silhouette)) return { id: silhouette.id };
  return ground;
}
class BattleBoard {
  constructor({
    canvas,
    tactics,
    hits,
    scene,
    frame,
    onCell,
    onUnit,
    onHover,
    onCamera,
    onTechnique,
    covered = () => false
  }) {
    this.T = globalThis.THREE;
    this.canvas = canvas;
    this.hits = hits;
    this.scene = scene;
    this.frame = frame;
    this.onCell = onCell;
    this.onUnit = onUnit;
    this.onHover = onHover;
    this.onCamera = onCamera;
    this.covered = covered;
    this.view = new FerryCamera(this.T);
    this.title = true;
    this.mapIndex = 0;
    this.pending = 0;
    this.dirty = true;
    this.layout = true;
    this.reach = new Map();
    this.prefs = { motion: true, grid: true };
    this.pointers = new Map();

    this.layers = new ActorLayer(tactics, this.view, () => this.draw(), onTechnique);
    this.layers.warm(['hero', 'xiao', 'guo']);
    this.addInput();
    this.buildKeys();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(scene);
    if (frame) this.ro.observe(frame);
    document.addEventListener('visibilitychange', () => {
      this.layers.lastPaint = null;
      if (!document.hidden) this.draw();
    });
    this.draw();
  }
  initScenery() {
    this.scenery = makeScenery(this.T, this.mapIndex);
    this.cut = new Cutaway(this.T, this.scenery);
    try {
      const T = this.T;
      const renderer = new T.WebGLRenderer({
        canvas: this.canvas,
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      // The lit stage folds its colour grade into tone mapping.
      if (POLISH.lighting) installGrade(T, renderer);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      this.world = new T.Scene();
      this.water = decorateWorld(T, this.world, this.scenery, true);
      this.renderer = renderer;
      this.canvas.addEventListener(
        'webglcontextlost',
        (e) => {
          e.preventDefault();
          this.useSoftware(true);
          this.resize();
        },
        { once: true }
      );
    } catch {
      this.useSoftware(true);
    }
  }
  useSoftware(replace) {
    if (replace) {
      const canvas = document.createElement('canvas');
      canvas.id = this.canvas.id;
      canvas.setAttribute('aria-hidden', 'true');
      this.canvas.replaceWith(canvas);
      this.canvas = canvas;
    }
    this.renderer = null;
    this.soft = new SoftwareScene(this.T, this.canvas, this.scenery);
  }
  changeMap(index = 0) {
    if (this.mapIndex === index) return;
    this.mapIndex = index;
    this.view.setMap(index);
    this.view.rebuild();
    this.hover = null;
    this.buildKeys();
    if (!this.scenery) return;
    const geometries = new Set(),
      materials = new Set();
    (this.world || this.scenery).traverse((node) => {
      if (node.geometry) geometries.add(node.geometry);
      for (const m of [].concat(node.material || [])) materials.add(m);
      node.shadow?.dispose?.();
    });
    this.water?.getRenderTarget?.().dispose();
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    this.scenery = makeScenery(this.T, index);
    this.cut = new Cutaway(this.T, this.scenery);
    if (this.renderer) {
      this.world = new this.T.Scene();
      this.water = decorateWorld(this.T, this.world, this.scenery, true);
      this.renderer.shadowMap.needsUpdate = true;
      this.renderer.renderLists.dispose();
    } else this.soft = new SoftwareScene(this.T, this.canvas, this.scenery);
    this.dirty = true;
    this.layout = true;
  }
  get zoom() {
    return this.view.zoom;
  }
  present(title) {
    this.title = title;
    if (title) this.changeMap(0);
    this.view.reset(title, this.scene.clientWidth < this.scene.clientHeight);
    this.hover = null;
    this.layers.reset();
    this.hits.hidden = title;
    this.pointers.clear();
    this.resize();
  }
  resize() {
    this.layout = true;
    this.changed();
  }
  changed() {
    this.dirty = true;
    this.draw();
  }
  setZoom(z) {
    this.view.setZoom(z);
    this.changed();
    this.onCamera?.();
  }
  rotate(dir) {
    this.view.orbit((dir * Math.PI) / 8, 0);
    this.changed();
    this.onCamera?.();
  }
  resetCamera() {
    this.view.reset(this.title);
    this.changed();
    this.onCamera?.();
  }
  focusSelected() {
    const u = this.s && G.find(this.s, this.s.selected);
    if (!u || this.title) return;
    this.view.focusTile(u.x, u.y, Math.max(1.45, this.zoom));
    this.changed();
    this.onCamera?.();
  }
  toggleCamera() {
    const high = this.view.pitch < 1.12;
    this.view.orbit(0, (high ? 1.33 : 0.85) - this.view.pitch);
    this.changed();
    this.onCamera?.();
    return high;
  }
  sync(s, mode, prefs) {
    this.changeMap(s.mapIndex || 0);
    this.s = s;
    this.mode = mode;
    this.prefs = prefs;
    this.layers.sync(s, mode, prefs);
    const u = G.find(s, s.selected);
    this.reach = G.canAct(s, u) && !u.moved ? G.reachable(s, u) : new Map();
    this.syncKeys();
    this.draw();
  }
  finished() {
    return this.layers.finished();
  }
  uncover() {
    this.layers.lastPaint = null;
    this.draw();
  }
  showEffects(items) {
    this.layers.numbers(items);
  }
  strikeEffect(u, t, kind, origin) {
    this.layers.pose(u, t, kind, origin);
  }
  draw() {
    if (this.pending || document.hidden) return;
    clearTimeout(this.timer);
    this.pending = requestAnimationFrame((time) => {
      this.pending = 0;
      this.render(time);
    });
  }
  render(now) {
    if (document.hidden || !this.scene.clientWidth || !this.scene.clientHeight) return;
    if (!this.scenery) this.initScenery();
    if (this.layout) {
      const w = this.scene.clientWidth,
        h = this.scene.clientHeight;
      const frame =
        !this.title && this.frame?.offsetWidth && this.frame?.offsetHeight
          ? {
              x: this.frame.offsetLeft,
              y: this.frame.offsetTop,
              width: this.frame.offsetWidth,
              height: this.frame.offsetHeight
            }
          : null;
      this.view.size(w, h, frame);
      const dpr = Math.min(1.65, globalThis.devicePixelRatio || 1);
      if (this.renderer) {
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(w, h, false);
      } else {
        const factor = this.dragged
          ? Math.min(0.85, 620 / w, 500 / h)
          : Math.min(1, 1050 / w, 840 / h);
        this.canvas.width = Math.max(1, Math.round(w * factor));
        this.canvas.height = Math.max(1, Math.round(h * factor));
      }
      this.layers.size(w, h, dpr);
      this.layout = false;
      this.dirty = true;
    }
    const cam = this.view.camera;
    if (this.dirty) {
      this.cut.update(cam, this.title);
      this.locateKeys();
    }
    const covered = this.covered();
    // While fighters are acting, their frames take priority over animated water.
    const ripple =
      !covered && !this.layers.playing && this.prefs.motion && now - (this.lastWorld || 0) > 115;
    if (this.renderer && (this.dirty || ripple)) {
      this.water.material.uniforms.time.value = this.prefs.motion ? now / 1000 : 0;
      this.renderer.render(this.world, cam);
      this.lastWorld = now;
    } else if (this.soft && this.dirty) this.soft.render(cam);
    this.dirty = false;
    this.layers.draw(now, this.title, this.reach, this.hover, covered);
    if (covered || this.layers.waitingForArt) return;
    if (this.layers.playing || (this.prefs.motion && this.layers.effects.length)) this.draw();
    else if (this.prefs.motion) this.timer = setTimeout(() => this.draw(), 105);
  }
  pointFromEvent(e) {
    const r = this.scene.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  addInput() {
    const el = this.scene;
    const pairDistance = () => {
      const [a, b] = this.pointers.values();
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const midpoint = () => {
      const [a, b] = this.pointers.values();
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    const clearHover = () => {
      this.hover = null;
      this.onHover?.(null, null);
      this.draw();
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
      if (e.target.closest('.key-cell')) return;
      this.pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        sx: e.clientX,
        sy: e.clientY,
        pan: !this.title && (e.shiftKey || e.button === 1)
      });
      el.setPointerCapture?.(e.pointerId);
      if (this.pointers.size === 1) this.dragged = e.button !== 0;
      if (this.pointers.size === 2) {
        if (this.soft) this.layout = true;
        this.dragged = true;
        this.span = pairDistance();
        this.mid = midpoint();
      }
    });
    el.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (p) {
        const dx = e.clientX - p.x,
          dy = e.clientY - p.y;
        p.x = e.clientX;
        p.y = e.clientY;
        if (this.pointers.size > 1) {
          const d = pairDistance(),
            mid = midpoint();
          if (this.span > 8 && d > 8) this.setZoom((this.zoom * d) / this.span);
          if (!this.title && this.zoom > 1) this.view.pan(mid.x - this.mid.x, mid.y - this.mid.y);
          this.span = d;
          this.mid = mid;
          this.changed();
          return;
        }
        if (!this.dragged && Math.hypot(p.x - p.sx, p.y - p.sy) > 5) {
          this.dragged = true;
          if (this.soft) this.layout = true;
        }
        if (this.dragged) {
          if (p.pan) this.view.pan(dx, dy);
          else this.view.orbit(-dx * 0.007, dy * 0.005);
          el.classList.add('orbiting');
          clearHover();
          this.changed();
          this.onCamera?.();
        }
      } else if (!this.title) {
        const k = this.pointFromEvent(e),
          g = this.view.ground(k.x, k.y);
        if (g?.x !== this.hover?.x || g?.y !== this.hover?.y) {
          this.hover = g;
          this.onHover?.(g?.x, g?.y);
          this.draw();
        }
      }
    });
    el.addEventListener('pointerleave', () => {
      if (!this.pointers.size) clearHover();
    });
    const release = (e, cancel) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (this.pointers.size) return;
      el.classList.remove('orbiting');
      if (!cancel && !this.dragged && !this.title) {
        const p = this.pointFromEvent(e),
          g = this.view.ground(p.x, p.y);
        const body = this.layers.body(p.x * this.layers.width, p.y * this.layers.height);
        const pick = resolveBoardPick(this.s, this.mode, g, body, this.reach);
        if (pick?.id) this.onUnit(pick.id);
        else if (pick) this.onCell(pick.x, pick.y);
      }
      const redraw = this.soft && this.dragged;
      this.dragged = false;
      if (redraw) this.resize();
    };
    el.addEventListener('pointerup', (e) => release(e, false));
    el.addEventListener('pointercancel', (e) => release(e, true));
    el.addEventListener('lostpointercapture', (e) => release(e, true));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.setZoom(this.zoom * Math.exp(-e.deltaY * 0.0014));
      },
      { passive: false }
    );
  }
  buildKeys() {
    this.keys = [];
    this.hits.replaceChildren();
    const cells = fieldCells(this.mapIndex);
    const center = { x: this.view.centerX, y: this.view.centerZ };
    const start = cells.reduce((nearest, cell) =>
      G.distance(cell, center) < G.distance(nearest, center) ? cell : nearest
    );
    this.keyboardIndex = start.y * this.view.columns + start.x;
    for (const { x, y } of cells) {
      const index = y * this.view.columns + x,
        b = document.createElement('button');
      b.dataset.x = x;
      b.dataset.y = y;
      b.className = 'key-cell';
      b.type = 'button';
      b.tabIndex = index === this.keyboardIndex ? 0 : -1;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this.title) this.onCell(x, y);
      });
      b.addEventListener('focus', () => {
        this.keyboardIndex = index;
        this.hover = { x, y };
        const p = this.view.tile(x, y);
        if (p.x < 0.04 || p.x > 0.96 || p.y < 0.07 || p.y > 0.93) {
          this.view.focusTile(x, y);
          this.changed();
        }
        this.onHover?.(x, y);
        this.draw();
      });
      b.addEventListener('blur', () => {
        this.hover = null;
        this.onHover?.(null, null);
        this.draw();
      });
      b.addEventListener('keydown', (e) => {
        const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[
          e.key
        ];
        if (!dir) return;
        e.preventDefault();
        let a = x + dir[0],
          d = y + dir[1];
        while (
          a >= 0 &&
          d >= 0 &&
          a < this.view.columns &&
          d < this.view.rows &&
          !G.valid(a, d, this.mapIndex)
        ) {
          a += dir[0];
          d += dir[1];
        }
        if (!G.valid(a, d, this.mapIndex)) return;
        b.tabIndex = -1;
        const next = this.keys[d * this.view.columns + a];
        next.tabIndex = 0;
        next.focus({ preventScroll: true });
      });
      this.hits.append(b);
      this.keys[index] = b;
    }
  }
  syncKeys() {
    const marker = G.unclaimedObjectiveTile(this.s);
    this.keys.forEach((b, i) => {
      const x = i % this.view.columns,
        y = Math.floor(i / this.view.columns),
        occ = G.at(this.s, x, y);
      b.setAttribute(
        'aria-label',
        '第' +
          (x + 1) +
          '列，第' +
          (y + 1) +
          '行，' +
          (occ ? G.unitDetails(occ).name + '，' : '') +
          G.terrain(x, y, this.mapIndex) +
          '。' +
          G.terrainInfo(x, y, this.mapIndex).note +
          (marker && marker.x === x && marker.y === y ? '支線燈記。' : '') +
          (this.reach.has(G.key(x, y)) ? '可移動至此。' : '')
      );
    });
  }
  locateKeys() {
    if (this.title) return;
    this.keys.forEach((b, i) => {
      const p = this.view.tile(i % this.view.columns, Math.floor(i / this.view.columns));
      b.style.left = p.x * 100 + '%';
      b.style.top = p.y * 100 + '%';
    });
  }
}
export { resolveBoardPick, BattleBoard };
