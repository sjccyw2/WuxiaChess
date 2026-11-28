import { fieldCells, mapLayout } from '../data/terrain.js';
import * as G from '../rules/game.js';
import { FerryCamera } from './camera.js';
import { makeScenery, decorateWorld, Cutaway } from './environment.js';
import { SoftwareScene } from './software.js';
import { ActorLayer } from '../actors/actors.js';
import { PULSE_MS, PEEK_MS } from '../actors/zones.js';
// Tap again to take the enemy behind (BattleBoard.tapPick): within this long, and this near.
const CYCLE_MS = 6000,
  CYCLE_PX = 22,
  STACK_SLACK = 6; // px
import { POLISH } from '../polish.js';
import { installGrade } from './stage-light.js';
import { FramePacer } from './pacing.js';
// Idle motion (rippling water, idle poses, the cursor's pulse) is slow: thirty frames a second
// show it as smoothly as the display's own rate, at a half to a quarter of the GPU's work on a 60
// to 120 Hz screen. Moves, blows, effects, camera eases and the pointer are drawn on every frame.
const IDLE_FPS = 30,
  IDLE_MS = 1000 / IDLE_FPS;
// adaptiveRes: the scales of the screen's pixels the 3D world steps down through on a device that
// cannot draw it in a display frame, and how long it must have been too slow before each step.
const WORLD_SCALES = [1, 0.8, 0.65],
  SLOW_MS = 3000;

// What a tap on the board means: a piece (its id) or a ground tile.
//
// `ground` is the tile under the tap; `figures` the pieces whose drawn figure the tap is on or just
// beside, nearest the camera first (actors/figure-pick.js). A figure is painted over the tiles
// behind it, so the two often disagree. Players aim at the figure, so:
//   - a tap on a figure is that piece: the one in front or, while an art is aimed, the first of
//     them the art can be used on (then whoever stands on the tile under the tap, if it can);
//   - a tap on open ground is a tile the selected hero may walk to, or whoever stands on it;
//   - a tap just beside a figure, a fingertip's width, is that figure only where the ground under
//     it has nothing to offer, so the tiles round a figure stay easy to walk to.
// A move is only ever accepted for the tile under the tap, never through a figure.
function resolveBoardPick(s, mode, ground, figures, reach) {
  if (!s) return null;
  if (ground && !G.valid(ground.x, ground.y, s.mapIndex)) ground = null;
  const actor = G.find(s, s.selected),
    occupant = ground && G.at(s, ground.x, ground.y);
  // A ground art (輕功, 布陣) is aimed at tiles; the figures on them do not come into it.
  if (mode === 'skill' && ground && G.targetType(G.artFor(actor)) === 'ground') return ground;
  const pieces = (figures || [])
    .map(({ id, gap }) => ({ unit: G.find(s, id), gap }))
    .filter(({ unit }) => unit && G.living(unit));
  const on = pieces.filter((f) => !f.gap).map((f) => f.unit),
    beside = pieces
      .filter((f) => f.gap)
      .sort((a, b) => a.gap - b.gap)
      .map((f) => f.unit);
  const aiming = mode === 'attack' || mode === 'skill',
    open = (t) => G.targetOK(s, actor, t, mode === 'skill');
  const aimed = aiming && (on.find(open) || (open(occupant) && occupant));
  if (aimed) return { id: aimed.id };
  if (on.length) return { id: on[0].id };
  if (ground && !occupant) {
    const here = G.key(ground.x, ground.y),
      walk = mode === 'move' && G.canAct(s, actor) && !actor.moved,
      glide = mode === 'glide' && G.canGlide(s, actor); // 回身: the walk left after the strike
    if (walk && (reach || G.reachable(s, actor)).has(here)) return ground;
    if (glide && (reach || G.glideField(s, actor).costs).has(here)) return ground;
  }
  if (occupant) return { id: occupant.id };
  const near = (aiming && beside.find(open)) || beside[0];
  return near ? { id: near.id } : ground;
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
    onCue,
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
    this.worldStep = 0; // adaptiveRes: index into WORLD_SCALES

    this.layers = new ActorLayer(tactics, this.view, () => this.draw(), onTechnique);
    this.layers.onCue = onCue; // sound: timed board events (see actors.js releaseCues)
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
    this.focusPiece(this.s && G.find(this.s, this.s.selected));
  }
  // The view brought to one piece, near enough to read it (定位俠客; 求敗's pinned gauge).
  focusPiece(u) {
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
  // hideAim: an art is ready but not yet picked by the player (app.js, aimHidden), so its reach
  // is not drawn; taps still prefer a piece it can strike.
  sync(s, mode, prefs, hideAim = false) {
    this.changeMap(s.mapIndex || 0);
    this.s = s;
    this.mode = mode;
    this.prefs = prefs;
    this.layers.sync(s, mode, prefs, hideAim);
    const u = G.find(s, s.selected);
    this.reach =
      G.canAct(s, u) && !u.moved
        ? G.reachable(s, u)
        : mode === 'glide' && G.canGlide(s, u) // 回身: the walk left after the strike
          ? G.glideField(s, u).costs
          : new Map();
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
  // The tiles the aimed art reaches swell for a moment (actors/zones.js, reachPulse): what the
  // board shows when an enemy outside them is tapped. A reach not drawn (hideAim: the basic
  // strike after a walk, not yet picked) is drawn for that moment and then hidden again.
  pulseReach() {
    const now = performance.now(),
      hidden = this.layers.hideAim;
    this.layers.reachPulse = now;
    this.layers.peekAim = hidden ? { at: now, unit: this.s?.selected, mode: this.mode } : null;
    this.draw();
    // With motion off nothing else would redraw the board to take the highlight away again.
    clearTimeout(this.pulseTimer);
    this.pulseTimer = setTimeout(() => this.draw(), (hidden ? PEEK_MS : PULSE_MS) + 40);
  }
  // ---- Combat feel: camera direction (polish switch cameraFollow; see scene/camera.js) ----
  // The enemy phase begins (true) or hands back to the player (false).
  watch(on) {
    if (!on && this.pointers.size) this.view.home = null;
    this.view.watch(on);
    this.draw();
  }
  // Brings an acting piece, and whoever it strikes, into view when they are near the edge.
  follow(...units) {
    if (this.pointers.size || this.title) return;
    const tiles = units.filter(Boolean).map((u) => ({ x: u.x, y: u.y }));
    if (this.view.follow(tiles, this.prefs.motion ? 320 : 0)) this.draw();
  }
  // ---- end combat feel ----
  // A frame for something that changed: drawn on the very next animation frame.
  draw() {
    this.urgent = true;
    this.request();
  }
  // A frame only for idle motion (water, idle poses, pulses): drawn at most IDLE_FPS times a
  // second, however fast the display refreshes. Anything that calls draw() meanwhile is not held.
  idle() {
    this.request();
  }
  request() {
    if (this.pending || document.hidden) return;
    clearTimeout(this.timer);
    this.pending = requestAnimationFrame((time) => {
      const urgent = this.urgent;
      this.pending = 0;
      this.urgent = false;
      this.render(time, urgent);
    });
  }
  render(now, urgent = true) {
    if (document.hidden || !this.scene.clientWidth || !this.scene.clientHeight) return;
    if (!this.scenery) this.initScenery();
    // Idle cap: an idle frame that comes too soon after the last one paints nothing. The pacer is
    // still told of it, as a frame that drew no world, so it keeps timing the display.
    if (!urgent && this.pace && !this.dirty && !this.layout && now - this.painted < IDLE_MS - 4) {
      this.pace.begin(now);
      this.pace.end(now, false, false);
      this.pace.chain();
      this.idle();
      return;
    }
    this.painted = now;
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
        // The world may be drawn at fewer pixels than the 2D layer (adaptiveRes, below); the
        // pieces, numbers and marks on the 2D layer stay at the screen's own sharpness.
        const scale = WORLD_SCALES[this.worldStep];
        this.renderer.setPixelRatio(Math.max(Math.min(dpr, 0.8), dpr * scale));
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
    // Combat feel: a camera ease in progress moves the view, so the world is redrawn.
    if (this.view.step(now)) this.dirty = true;
    const cam = this.view.camera;
    if (this.dirty) {
      this.cut.update(cam, this.title);
      this.locateKeys();
    }
    const covered = this.covered();
    // Smooth idle: the pacer times real frames and says how often the world may redraw.
    const pace = POLISH.smoothIdle ? (this.pace ||= new FramePacer()) : null;
    if (pace) {
      if (this.pacedScenery !== this.scenery) pace.settle();
      this.pacedScenery = this.scenery;
      pace.begin(now);
      if (POLISH.adaptiveRes && this.renderer) this.fitWorld(pace, now);
    }
    const playing = this.layers.playing;
    // While fighters are acting, their frames take priority over animated water.
    const ripple = pace
      ? !covered && this.prefs.motion && pace.worldDue(now, playing)
      : !covered && !playing && this.prefs.motion && now - (this.lastWorld || 0) > 115;
    const world = this.renderer && (this.dirty || ripple);
    if (world) {
      this.water.material.uniforms.time.value = this.prefs.motion ? now / 1000 : 0;
      this.renderer.render(this.world, cam);
      this.lastWorld = now;
    } else if (this.soft && this.dirty) this.soft.render(cam);
    this.dirty = false;
    this.layers.draw(now, this.title, this.reach, this.hover, covered);
    pace?.end(now, Boolean(world), playing);
    if (covered || this.layers.waitingForArt) return;
    if (this.layers.playing || (this.prefs.motion && this.layers.effects.length)) {
      this.draw();
      pace?.chain();
    } else if (this.prefs.motion) {
      if (pace?.smooth) {
        // Idle motion, up to IDLE_FPS a second; nothing is drawn while the tab is hidden.
        this.idle();
        pace.chain();
      } else this.timer = setTimeout(() => this.idle(), 105);
    }
    // The reach pulse is short: every frame of it is drawn, whatever pace idle motion keeps.
    const pulsed = performance.now() - (this.layers.reachPulse ?? -Infinity);
    if (this.prefs.motion && pulsed < PULSE_MS) this.draw();
    // Combat feel: keep frames coming until a camera ease has finished.
    if (this.view.easing) {
      this.draw();
      pace?.chain();
    }
  }
  // adaptiveRes: while the world has not fitted in a display frame for SLOW_MS, whether idle or
  // while pieces act, draw it at the next smaller scale (WORLD_SCALES) and measure afresh. It only
  // ever steps down: a device that could not keep up once is spared the trial of going back.
  fitWorld(pace, now) {
    const slow = !pace.fluid || !pace.actionFits;
    if (!slow || pace.settling > 0 || this.worldStep >= WORLD_SCALES.length - 1) {
      this.slowSince = null;
      return;
    }
    this.slowSince ??= now;
    if (now - this.slowSince < SLOW_MS) return;
    this.worldStep++;
    this.slowSince = null;
    pace.restart();
    this.layout = true;
  }
  pointFromEvent(e) {
    const r = this.scene.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  // What the pointer of this event is on: a piece's id or a ground tile (resolveBoardPick).
  pickAt(e) {
    const p = this.pointFromEvent(e),
      g = this.view.ground(p.x, p.y),
      scale = this.layers.scaleAt(g ? g.x : this.view.centerX, g ? g.y : this.view.centerZ);
    // A fingertip hides the figure it aims at and lands a little off it; a mouse pointer does not.
    const slack = e.pointerType === 'touch' ? Math.max(7, Math.min(14, scale * 0.34)) : 3;
    const figures = this.layers.figures(p.x * this.layers.width, p.y * this.layers.height, slack);
    return resolveBoardPick(this.s, this.mode, g, figures, this.reach);
  }
  // A tap. Where figures overlap, the one in front hides those behind it, and zooming in does not
  // change the angle they are seen from. So a tap again on the same spot, within a few seconds,
  // takes the next enemy behind the one taken last (and after the last, the front one again).
  // The time allowed covers a 交鋒預覽 or 敵情查探 opened by the first tap and closed again.
  tapPick(e) {
    let pick = this.pickAt(e);
    // The enemy figures (and board objects) the pointer is on, front-most first. A few pixels of
    // slack, since an idle figure's outline sways from frame to frame. Heroes are left out: a
    // second tap on a hero opens his arts list.
    const p = this.pointFromEvent(e),
      stack = this.layers
        .figures(p.x * this.layers.width, p.y * this.layers.height, STACK_SLACK)
        .map((f) => G.find(this.s, f.id))
        .filter((v) => v && G.living(v) && !G.ally(v))
        .map((v) => v.id);
    const now = performance.now(),
      prev = this.cycle,
      same =
        prev &&
        now - prev.time < CYCLE_MS &&
        Math.hypot(e.clientX - prev.x, e.clientY - prev.y) <= CYCLE_PX;
    if (pick?.id && stack.length > 1 && same && stack.includes(prev.id))
      pick = { id: prev.hold ? prev.id : stack[(stack.indexOf(prev.id) + 1) % stack.length] };
    this.cycle =
      pick?.id && stack.includes(pick.id)
        ? { x: e.clientX, y: e.clientY, time: now, id: pick.id }
        : null;
    return pick;
  }
  // The next tap on the same spot takes the same enemy again, not the next one: the first tap
  // was spent on him (an enemy out of reach: once more reads his page).
  holdCycle() {
    if (this.cycle) this.cycle.hold = true;
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
        // The pointer over a figure is on that piece's tile, as a click there would be.
        const pick = this.pickAt(e),
          piece = pick?.id && G.find(this.s, pick.id),
          g = piece ? { x: piece.x, y: piece.y } : pick;
        if (g?.x !== this.hover?.x || g?.y !== this.hover?.y) {
          this.hover = g;
          this.pointerHover = true;
          this.onHover?.(g?.x, g?.y);
          this.draw();
        }
      }
    });
    el.addEventListener('pointerleave', () => {
      if (!this.pointers.size) clearHover();
    });
    // The tile label goes when the pointer leaves the board, also where no leave reaches it: the
    // pointer onto a control, a page or a card laid over the board, or out of the window. Only a
    // hover the pointer made (not a tile the keyboard is on) and not while a drag holds it.
    const away = (e) => {
      if (this.hover && this.pointerHover && !this.pointers.size && !el.contains(e.target))
        clearHover();
    };
    document.addEventListener('pointerover', (e) => e.pointerType !== 'touch' && away(e), true);
    document.documentElement.addEventListener('pointerleave', (e) => away(e));
    const release = (e, cancel) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (this.pointers.size) return;
      el.classList.remove('orbiting');
      if (!cancel && !this.dragged && !this.title) {
        const pick = this.tapPick(e);
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
        this.pointerHover = false;
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
    // Reinforcements' entry tiles, and while deploying the five posts.
    const entries = new Map();
    if (this.s.run?.status === 'battle')
      for (const p of G.announcedWaves(this.s))
        for (const t of p.tiles) entries.set(G.key(t.x, t.y), p.due);
    const posts = this.s.run?.deploying && this.s.run.scene === 'fight' ? mapLayout(this.mapIndex).allies : [];
    this.keys.forEach((b, i) => {
      const x = i % this.view.columns,
        y = Math.floor(i / this.view.columns),
        occ = G.at(this.s, x, y);
      const due = entries.get(G.key(x, y)),
        post = posts.findIndex((p) => p.x === x && p.y === y);
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
          (marker && marker.x === x && marker.y === y ? G.markerName(this.s) + '。' : '') +
          (due ? '敵援入場處，第' + G.NUMERALS[due - 1] + '回合。' : '') +
          (post >= 0 ? '起陣格，陣位' + G.NUMERALS[post] + '。' : '') +
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
