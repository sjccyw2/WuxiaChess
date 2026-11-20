// Where the chosen piece can go and what it can strike, drawn on the ground the way a
// tactics player expects: one wash per region, a crisp line along its outer edge only,
// a red fringe for what can be struck after moving, and a reticle on every valid target.
// Rules modules are read here, never changed.
import { fieldCells } from '../data/terrain.js';
import * as G from '../rules/game.js';
import { POLISH } from '../polish.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const TAU = Math.PI * 2;
const SPAN = 128;
const cellKey = (x, y) => x + 1 + (y + 1) * SPAN;

const STYLES = {
  move: {
    wash: 'rgba(20,150,126,.30)',
    glow: 'rgba(150,255,222,.34)',
    inner: 'rgba(196,255,234,.17)',
    ink: 'rgba(3,36,31,.72)',
    line: '#c9ffeb',
    weight: 1
  },
  fringe: {
    wash: 'rgba(204,58,34,.21)',
    glow: 'rgba(255,150,120,.20)',
    inner: 'rgba(255,196,176,.13)',
    ink: 'rgba(58,12,7,.5)',
    line: 'rgba(255,158,128,.86)',
    weight: 0.72
  },
  strike: {
    wash: 'rgba(210,58,34,.29)',
    glow: 'rgba(255,160,126,.36)',
    inner: 'rgba(255,205,186,.17)',
    ink: 'rgba(60,12,7,.72)',
    line: '#ffc7ae',
    weight: 1
  },
  heal: {
    wash: 'rgba(62,170,108,.28)',
    glow: 'rgba(176,255,200,.34)',
    inner: 'rgba(214,255,224,.17)',
    ink: 'rgba(8,44,24,.7)',
    line: '#c9f7d2',
    weight: 1
  }
};

// The shape of one region, in grid-corner coordinates: closed loops for the wash, the outer
// edge for the line, and the seams between its own tiles.
function outline(tiles, cells, open) {
  const edges = new Map(),
    border = [],
    inner = [];
  const side = (x, y, nx, ny, ax, ay, bx, by) => {
    const beyond = cellKey(nx, ny);
    if (tiles.has(beyond)) {
      if (nx > x || ny > y) inner.push(ax, ay, bx, by);
      return;
    }
    const from = cellKey(ax, ay);
    if (!edges.has(from)) edges.set(from, []);
    edges.get(from).push([ax, ay, bx, by, false]);
    if (!open(beyond)) border.push(ax, ay, bx, by);
  };
  for (const { x, y } of cells) {
    if (!tiles.has(cellKey(x, y))) continue;
    side(x, y, x, y - 1, x, y, x + 1, y);
    side(x, y, x + 1, y, x + 1, y, x + 1, y + 1);
    side(x, y, x, y + 1, x + 1, y + 1, x, y + 1);
    side(x, y, x - 1, y, x, y + 1, x, y);
  }
  // Chain the directed edges into loops. Holes come out wound the other way, so one
  // non-zero fill leaves them empty and never shows a seam between neighbouring tiles.
  const loops = [];
  for (const list of edges.values())
    for (const first of list) {
      if (first[4]) continue;
      const loop = [];
      let edge = first;
      while (edge && !edge[4]) {
        edge[4] = true;
        loop.push(edge[0], edge[1]);
        edge = edges.get(cellKey(edge[2], edge[3]))?.find((next) => !next[4]);
      }
      loops.push(loop);
    }
  return { loops, border, inner, size: tiles.size };
}

// Lays the unit square of one tile, centred on a board position, onto the screen.
function onGround(layer, c, x, y, level) {
  const o = layer.point(x, y, level),
    ax = layer.point(x + 0.5, y, level),
    ay = layer.point(x, y + 0.5, level);
  c.transform((ax.x - o.x) * 2, (ax.y - o.y) * 2, (ay.x - o.x) * 2, (ay.y - o.y) * 2, o.x, o.y);
}

const plans = new WeakMap();

// Worked out once per board update. The board hands the layer a fresh reach map every
// time the game state or the command mode changes, which is what marks a plan stale.
function plan(layer, reach) {
  const s = layer.state,
    old = plans.get(layer);
  if (old && old.reach === reach && old.state === s && old.mode === layer.mode) return old;
  const u = G.find(s, s.selected),
    can = G.canAct(s, u),
    cast = ['attack', 'skill'].includes(layer.mode) && can,
    skill = layer.mode === 'skill',
    art = cast && skill ? G.artFor(u) : null,
    range = cast ? (art ? art.range : u.range) : 0,
    heal = !!(art && (G.isSupport(art) || art.blink)),
    canBlink = art?.blink && G.canPay(s, u),
    gliding = layer.mode === 'glide' && G.canGlide(s, u), // 回身: tiles for the walk left
    moving = (layer.mode === 'move' && G.canMove(s, u)) || gliding;
  const cells = fieldCells(s.mapIndex),
    field = new Set(),
    move = new Set(),
    fringe = new Set(),
    aim = new Set(),
    friends = new Set();
  for (const { x, y } of cells) field.add(cellKey(x, y));
  for (const v of s.units) if (G.living(v) && G.ally(v) && v !== u) friends.add(cellKey(v.x, v.y));
  if (moving) {
    move.add(cellKey(u.x, u.y));
    for (const { x, y } of cells) if (reach.has(G.key(x, y))) move.add(cellKey(x, y));
    const stand = new Set(move);
    // A friend's tile cannot be stopped on, but it belongs to the region when the piece
    // has the steps to pass through it, so the outline does not break around companions.
    const steps = gliding ? u.glideLeft : G.stat(u, 'step', s);
    for (const v of s.units) {
      if (!friends.has(cellKey(v.x, v.y)) || !G.living(v) || !G.ally(v)) continue;
      const path = G.movementPath(s, u, u, v);
      let spent = 0;
      for (const step of path.slice(1)) spent += G.terrainInfo(step.x, step.y, s.mapIndex).cost;
      if (path.length > 1 && spent <= steps) move.add(cellKey(v.x, v.y));
    }
    // Every tile the basic strike could reach from somewhere the piece can stand (none for a
    // hero who has already struck).
    const far = gliding ? -1 : u.range || 0;
    for (const { x, y } of cells) {
      if (!stand.has(cellKey(x, y))) continue;
      for (let dy = -far; dy <= far; dy++)
        for (let dx = Math.abs(dy) - far; dx <= far - Math.abs(dy); dx++) {
          const k = cellKey(x + dx, y + dy);
          if (
            field.has(k) &&
            !move.has(k) &&
            !friends.has(k) &&
            !fringe.has(k) &&
            G.walkable(x + dx, y + dy, s.mapIndex)
          )
            fringe.add(k);
        }
    }
  }
  if (cast)
    for (const { x, y } of cells) {
      if (
        G.distance(u, { x, y }) <= range &&
        G.walkable(x, y, s.mapIndex) &&
        (!art?.blink || (canBlink && !G.at(s, x, y))) &&
        (heal || x !== u.x || y !== u.y)
      )
        aim.add(cellKey(x, y));
    }
  const zoned = (k) => move.has(k) || fringe.has(k) || aim.has(k);
  // Faint grid lines everywhere the regions are not already drawing their own.
  const grid = [];
  for (const { x, y } of cells) {
    if (zoned(cellKey(x, y))) continue;
    for (const [nx, ny, ax, ay, bx, by] of [
      [x, y - 1, x, y, x + 1, y],
      [x - 1, y, x, y, x, y + 1],
      [x + 1, y, x + 1, y, x + 1, y + 1],
      [x, y + 1, x, y + 1, x + 1, y + 1]
    ]) {
      const k = cellKey(nx, ny);
      if (zoned(k)) continue;
      // A line shared by two open tiles is drawn by the upper or left one.
      if (field.has(k) && (nx > x || ny > y)) continue;
      grid.push(ax, ay, bx, by);
    }
  }
  const targets = [];
  if (cast)
    for (const t of s.units)
      if (G.living(t) && G.targetOK(s, u, t, skill)) targets.push({ unit: t, mend: G.ally(t) });
  const fresh = {
    reach,
    state: s,
    mode: layer.mode,
    unit: u,
    grid,
    covers: cells.filter(({ x, y }) => G.cover(x, y, s.mapIndex)),
    regions: [
      fringe.size && { style: STYLES.fringe, ...outline(fringe, cells, (k) => move.has(k)) },
      move.size > 1 && { style: STYLES.move, ...outline(move, cells, () => false) },
      aim.size && {
        style: heal ? STYLES.heal : STYLES.strike,
        // The caster's own tile sits unlit inside a strike region, with no line round it.
        ...outline(aim, cells, (k) => u && k === cellKey(u.x, u.y))
      }
    ].filter(Boolean),
    targets
  };
  plans.set(layer, fresh);
  return fresh;
}

// The regions change only when the board updates or the camera moves, so they are drawn
// once onto their own sheet and copied to the overlay each frame. The pulse is the copy's
// opacity; an idle frame costs one drawImage.
const sheets = new WeakMap();

function fieldSheet(layer, p) {
  let sheet = sheets.get(layer);
  if (!sheet) {
    const canvas = document.createElement('canvas');
    sheet = { canvas, ctx: canvas.getContext('2d'), view: new Float64Array(38), w: 0, h: 0 };
    sheets.set(layer, sheet);
  }
  // What the sheet was drawn for: the plan, the camera and the size of the overlay.
  const camera = layer.view.camera,
    world = camera.matrixWorldInverse.elements,
    lens = camera.projectionMatrix.elements,
    view = sheet.view;
  let stale = sheet.plan !== p || sheet.grid !== layer.prefs.grid;
  const note = (i, value) => {
    if (view[i] !== value) {
      view[i] = value;
      stale = true;
    }
  };
  for (let i = 0; i < 16; i++) {
    note(i, world[i]);
    note(i + 16, lens[i]);
  }
  note(32, layer.width);
  note(33, layer.height);
  note(34, layer.canvas.width);
  note(35, layer.canvas.height);
  note(36, layer.view.centerX);
  note(37, layer.view.centerZ);
  if (!stale) return sheet;
  sheet.plan = p;
  sheet.grid = layer.prefs.grid;
  const grid = layer.prefs.grid,
    corners = new Map();
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  const at = (i, j) => {
    const k = cellKey(i, j);
    let point = corners.get(k);
    if (!point) {
      corners.set(k, (point = layer.point(i - 0.5, j - 0.5)));
      if (point.x < x0) x0 = point.x;
      if (point.x > x1) x1 = point.x;
      if (point.y < y0) y0 = point.y;
      if (point.y > y1) y1 = point.y;
    }
    return point;
  };
  // Project everything first, to learn how much of the screen the sheet must cover.
  const reachOut = (list) => {
    for (let i = 0; i < list.length; i += 2) at(list[i], list[i + 1]);
  };
  if (grid) reachOut(p.grid);
  for (const region of p.regions) {
    for (const loop of region.loops) reachOut(loop);
    reachOut(region.inner);
  }
  const ratio = layer.canvas.width / layer.width || 1,
    margin = 10;
  x0 = Math.floor(Math.max(0, x0 - margin) * ratio) / ratio;
  y0 = Math.floor(Math.max(0, y0 - margin) * ratio) / ratio;
  x1 = Math.min(layer.width, x1 + margin);
  y1 = Math.min(layer.height, y1 + margin);
  const pw = Math.ceil((x1 - x0) * ratio),
    ph = Math.ceil((y1 - y0) * ratio);
  if (!(pw > 0 && ph > 0)) {
    sheet.w = sheet.h = 0;
    return sheet;
  }
  const c = sheet.ctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (sheet.canvas.width < pw || sheet.canvas.height < ph) {
    // Grown in steps, never shrunk, so turning the camera does not keep reallocating it.
    sheet.canvas.width = Math.max(sheet.canvas.width, Math.ceil(pw / 128) * 128);
    sheet.canvas.height = Math.max(sheet.canvas.height, Math.ceil(ph / 128) * 128);
  } else c.clearRect(0, 0, sheet.canvas.width, sheet.canvas.height);
  sheet.x = x0;
  sheet.y = y0;
  sheet.pw = pw;
  sheet.ph = ph;
  sheet.w = pw / ratio;
  sheet.h = ph / ratio;
  c.setTransform(ratio, 0, 0, ratio, -x0 * ratio, -y0 * ratio);
  const lines = (list) => {
    c.beginPath();
    for (let i = 0; i < list.length; i += 4) {
      const a = at(list[i], list[i + 1]),
        b = at(list[i + 2], list[i + 3]);
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
    }
  };
  c.lineCap = c.lineJoin = 'round';
  c.globalAlpha = 1;
  if (grid) {
    lines(p.grid);
    c.strokeStyle = 'rgba(38,52,48,.46)';
    c.lineWidth = 1.2;
    c.stroke();
  }
  const anchor = p.unit && p.regions.length ? layer.scaleAt(p.unit.x, p.unit.y) : 0,
    width = clamp(anchor * 0.04, 1.5, 2.6);
  for (const region of p.regions) {
    const style = region.style;
    c.beginPath();
    for (const loop of region.loops) {
      for (let i = 0; i < loop.length; i += 2) {
        const point = at(loop[i], loop[i + 1]);
        if (i) c.lineTo(point.x, point.y);
        else c.moveTo(point.x, point.y);
      }
      c.closePath();
    }
    c.fillStyle = style.wash;
    c.fill();
    // Light gathers along the inside of the edge and fades toward the middle.
    c.save();
    c.clip();
    c.strokeStyle = style.glow;
    c.lineWidth = clamp(anchor * 0.3, 7, 20) * style.weight;
    lines(region.border);
    c.stroke();
    c.lineWidth *= 0.45;
    c.stroke();
    c.restore();
    lines(region.inner);
    c.strokeStyle = style.inner;
    c.lineWidth = 1;
    c.stroke();
    lines(region.border);
    c.strokeStyle = style.ink;
    c.lineWidth = width * style.weight * 2.3;
    c.stroke();
    c.strokeStyle = style.line;
    c.lineWidth = width * style.weight;
    c.stroke();
  }
  if (grid) {
    c.fillStyle = '#495f4d';
    c.font = 'bold ' + Math.max(8, layer.height * 0.017) + 'px serif';
    for (const { x, y } of p.covers) {
      const point = layer.point(x - 0.32, y + 0.29);
      c.fillText('◇', point.x, point.y);
    }
  }
  return sheet;
}

// Paints the grid and the regions. Answers false, having painted nothing, when the
// rangeTiles switch is off, so the layer falls back to its own tile-by-tile loop.
function paintField(layer, reach, now) {
  if (!POLISH.rangeTiles) return false;
  const p = plan(layer, reach),
    sheet = fieldSheet(layer, p);
  if (!sheet.w) return true;
  const c = layer.ctx,
    breath = layer.prefs.motion ? 0.5 + 0.5 * Math.sin(now / 560) : 0.7,
    alpha = c.globalAlpha;
  if (p.regions.length) c.globalAlpha = alpha * (0.84 + breath * 0.16);
  c.drawImage(sheet.canvas, 0, 0, sheet.pw, sheet.ph, sheet.x, sheet.y, sheet.w, sheet.h);
  c.globalAlpha = alpha;
  return true;
}

// A turning, breathing ring with four inward ticks round every piece the pending strike
// or art could be used on. It closes in on the one under the pointer.
function paintReticles(layer, reach, hover, now) {
  if (!POLISH.rangeTiles) return;
  const p = plan(layer, reach);
  if (!p.targets.length) return;
  const c = layer.ctx,
    motion = layer.prefs.motion,
    beat = motion ? 0.5 + 0.5 * Math.sin(now / 240) : 0.5,
    turn = motion ? now / 1500 : TAU / 8;
  for (const { unit, mend } of p.targets) {
    if (!G.living(unit)) continue;
    const pos = layer.location(unit, now),
      aimed = hover && hover.x === unit.x && hover.y === unit.y,
      radius = aimed ? 0.47 + beat * 0.012 : 0.5 + beat * 0.04,
      scale = layer.scaleAt(pos.x, pos.y);
    if (!scale) continue;
    c.save();
    onGround(layer, c, pos.x, pos.y, 0.104);
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (aimed ? TAU / 8 : turn) + (i * TAU) / 4,
        gap = aimed ? 0.16 : 0.3;
      c.moveTo(Math.cos(a + gap) * radius, Math.sin(a + gap) * radius);
      c.arc(0, 0, radius, a + gap, a + TAU / 4 - gap);
      const mid = a + TAU / 8;
      c.moveTo(Math.cos(mid) * (radius + 0.05), Math.sin(mid) * (radius + 0.05));
      c.lineTo(Math.cos(mid) * (radius - 0.085), Math.sin(mid) * (radius - 0.085));
    }
    c.restore();
    const line = clamp(scale * 0.046, 1.7, 2.9) * (aimed ? 1.3 : 1);
    c.save();
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(20,10,6,.5)';
    c.lineWidth = line * 3.2;
    c.stroke();
    c.strokeStyle = mend ? '#1f9a5c' : '#de3a1f';
    c.lineWidth = line * 2.2;
    c.stroke();
    c.strokeStyle = aimed ? '#fffdf0' : mend ? '#e4ffea' : '#ffeadd';
    c.globalAlpha *= aimed ? 1 : 0.82 + beat * 0.18;
    c.lineWidth = line * 0.95;
    c.stroke();
    c.restore();
  }
}

export { paintField, paintReticles };
