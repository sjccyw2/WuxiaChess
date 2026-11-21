// Offscreen copies of sprite frames.
//
// Each frame a piece needs is copied once, at about the size it shows on screen, with its
// robe tint, its team outline and (for a hero who has acted) its grey already baked in.
// Painting a piece is then a single drawImage: no canvas filter is ever set per frame.
import { CELL_WIDTH, CELL_HEIGHT, FOOT_Y, FRAMES } from './sprite-sheets.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const TAU = Math.PI * 2;
const INK = '#07110f';
// The line drawn round a figure: jade for the player's side, vermilion for the enemy.
const OUTLINES = { ally: '#a5ffe0', enemy: '#ff9b7a', spent: '#6f7f7a' };
// Heights, in device pixels, at which a sheet cell is cached.
const HEIGHTS = [48, 64, 84, 110, 144, CELL_HEIGHT, 216, 264, 320];
const BUDGET = 9e6; // pixels of cached copies kept before idle ones are dropped (36 MB)
const atlases = new Map();
let held = 0;
const imageNumbers = new WeakMap();
let imageCount = 0;
const scratch = {};

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

// A reusable work surface, cleared and sized for the frame being baked.
function pane(name, w, h, readback = false) {
  let entry = scratch[name];
  if (!entry) {
    const canvas = makeCanvas(w, h);
    entry = scratch[name] = {
      canvas,
      ctx: canvas.getContext('2d', readback ? { willReadFrequently: true } : undefined)
    };
  }
  if (entry.canvas.width !== w || entry.canvas.height !== h) {
    entry.canvas.width = w;
    entry.canvas.height = h;
  } else {
    entry.ctx.setTransform(1, 0, 0, 1, 0, 0);
    entry.ctx.globalCompositeOperation = 'source-over';
    entry.ctx.globalAlpha = 1;
    entry.ctx.clearRect(0, 0, w, h);
  }
  return entry;
}

// The enemy robe tints are written as CSS filter lists. These are the same colour
// matrices the browser applies for them, so a tint costs one pass when a frame is cached
// and looks the same in browsers whose canvas has no filter support.
function colourSteps(filter) {
  const steps = [];
  for (const [, name, raw] of filter.matchAll(/([a-z-]+)\(([^)]*)\)/g)) {
    let n = parseFloat(raw);
    if (!Number.isFinite(n)) return null;
    if (raw.trim().endsWith('%')) n /= 100;
    if (name === 'sepia') {
      const a = 1 - clamp(n, 0, 1);
      steps.push([
        0.393 + 0.607 * a,
        0.769 - 0.769 * a,
        0.189 - 0.189 * a,
        0.349 - 0.349 * a,
        0.686 + 0.314 * a,
        0.168 - 0.168 * a,
        0.272 - 0.272 * a,
        0.534 - 0.534 * a,
        0.131 + 0.869 * a
      ]);
    } else if (name === 'saturate') {
      const s = Math.max(0, n);
      steps.push([
        0.213 + 0.787 * s,
        0.715 - 0.715 * s,
        0.072 - 0.072 * s,
        0.213 - 0.213 * s,
        0.715 + 0.285 * s,
        0.072 - 0.072 * s,
        0.213 - 0.213 * s,
        0.715 - 0.715 * s,
        0.072 + 0.928 * s
      ]);
    } else if (name === 'hue-rotate') {
      const turn = raw.includes('rad') ? n : raw.includes('turn') ? n * TAU : (n * Math.PI) / 180,
        k = Math.cos(turn),
        s = Math.sin(turn);
      steps.push([
        0.213 + k * 0.787 - s * 0.213,
        0.715 - k * 0.715 - s * 0.715,
        0.072 - k * 0.072 + s * 0.928,
        0.213 - k * 0.213 + s * 0.143,
        0.715 + k * 0.285 + s * 0.14,
        0.072 - k * 0.072 - s * 0.283,
        0.213 - k * 0.213 - s * 0.787,
        0.715 - k * 0.715 + s * 0.715,
        0.072 + k * 0.928 + s * 0.072
      ]);
    } else return null;
  }
  return steps;
}
const stepCache = new Map();
function stepsFor(filter) {
  if (!stepCache.has(filter)) stepCache.set(filter, colourSteps(filter));
  return stepCache.get(filter);
}

function recolour(d, steps, grey) {
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    let r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    for (const m of steps) {
      const nr = m[0] * r + m[1] * g + m[2] * b,
        ng = m[3] * r + m[4] * g + m[5] * b,
        nb = m[6] * r + m[7] * g + m[8] * b;
      r = nr < 0 ? 0 : nr > 255 ? 255 : nr;
      g = ng < 0 ? 0 : ng > 255 ? 255 : ng;
      b = nb < 0 ? 0 : nb > 255 ? 255 : nb;
    }
    if (grey) {
      // Mostly drained of colour and pushed toward cold slate, keeping enough contrast
      // that the figure can still be recognised.
      const light = 0.3 * r + 0.59 * g + 0.11 * b;
      r = (light * 0.82 + r * 0.18) * 0.6 + 14;
      g = (light * 0.82 + g * 0.18) * 0.62 + 19;
      b = (light * 0.82 + b * 0.18) * 0.62 + 20;
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
}

function atlasFor(sheet, look, cell, edge) {
  let number = imageNumbers.get(sheet.image);
  if (!number) imageNumbers.set(sheet.image, (number = ++imageCount));
  const name = [
    number,
    sheet.x,
    sheet.y,
    look.robe || '',
    look.team || '',
    look.grey ? 1 : 0,
    cell,
    edge
  ].join('|');
  let atlas = atlases.get(name);
  if (!atlas) {
    const ch = cell,
      cw = Math.round((cell * CELL_WIDTH) / CELL_HEIGHT),
      pad = look.team ? Math.ceil(edge * 1.5 + 1) : 0;
    atlas = {
      canvas: makeCanvas((cw + pad * 2) * FRAMES, (ch + pad * 2) * sheet.rows),
      ready: new Uint8Array(FRAMES * sheet.rows),
      cw,
      ch,
      pad,
      edge,
      used: 0
    };
    atlas.ctx = atlas.canvas.getContext('2d');
    atlas.pixels = atlas.canvas.width * atlas.canvas.height;
    atlas.used = performance.now();
    atlases.set(name, atlas);
    held += atlas.pixels;
    if (held > BUDGET) {
      // Drop the copies that have gone longest unused (another zoom level, a finished
      // battle), but never one painted in the last few seconds.
      const idle = [...atlases].sort((a, b) => a[1].used - b[1].used);
      for (const [key, old] of idle) {
        if (held <= BUDGET || atlas.used - old.used < 3000) break;
        held -= old.pixels;
        old.canvas.width = old.canvas.height = 0;
        atlases.delete(key);
      }
    }
  }
  atlas.used = performance.now();
  return atlas;
}

// Stamps a silhouette round a circle, which grows it outward by `radius`.
function ring(ctx, shape, radius) {
  const count = radius > 2.6 ? 16 : radius > 1.3 ? 12 : 8;
  for (let i = 0; i < count; i++) {
    const a = (i * TAU) / count;
    ctx.drawImage(shape, Math.cos(a) * radius, Math.sin(a) * radius);
  }
}

function bake(atlas, sheet, look, row, frame) {
  const { cw, ch, pad, edge } = atlas,
    w = cw + pad * 2,
    h = ch + pad * 2,
    x = frame * w,
    y = row * h,
    steps = look.robe ? stepsFor(look.robe) : [];
  const figure = pane('figure', w, h, true),
    f = figure.ctx;
  f.imageSmoothingQuality = 'high';
  // A tint this module cannot work out is left to the browser, once, as the copy is made.
  if (!steps) f.filter = look.robe;
  f.drawImage(
    sheet.image,
    sheet.x + frame * sheet.w,
    sheet.y + row * sheet.h,
    sheet.w,
    sheet.h,
    pad,
    pad,
    cw,
    ch
  );
  if (!steps) f.filter = 'none';
  const tinting = look.grey || steps?.length,
    pixels = tinting || look.team ? f.getImageData(0, 0, w, h) : null;
  if (tinting) {
    recolour(pixels.data, steps || [], look.grey);
    f.putImageData(pixels, 0, 0);
  }
  const a = atlas.ctx;
  a.clearRect(x, y, w, h);
  if (look.team) {
    const shape = pane('shape', w, h),
      s = shape.ctx,
      halo = pane('halo', w, h),
      o = halo.ctx,
      d = pixels.data;
    // The figure's soft edge is hardened into a solid silhouette, so the line drawn
    // round it is crisp instead of a haze.
    for (let i = 0; i < d.length; i += 4) {
      const solid = (d[i + 3] - 56) * 5;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = solid < 0 ? 0 : solid > 255 ? 255 : solid;
    }
    s.putImageData(pixels, 0, 0);
    s.globalCompositeOperation = 'source-in';
    // A dark line outside the coloured one keeps the rim clear of pale stone and water.
    s.fillStyle = INK;
    s.fillRect(0, 0, w, h);
    ring(o, shape.canvas, edge * 1.4);
    a.globalAlpha = look.grey ? 0.34 : 0.4;
    a.drawImage(halo.canvas, x, y);
    s.fillStyle = OUTLINES[look.grey ? 'spent' : look.team];
    s.fillRect(0, 0, w, h);
    o.clearRect(0, 0, w, h);
    ring(o, shape.canvas, edge);
    a.globalAlpha = look.grey ? 0.7 : 0.86;
    a.drawImage(halo.canvas, x, y);
    a.globalAlpha = 1;
  }
  a.drawImage(figure.canvas, x, y);
  atlas.ready[row * FRAMES + frame] = 1;
}

// Draws one sheet frame from its cached copy, placed exactly as the layer's own drawImage
// places it: `w` and `h` are the on-screen size of a sheet cell and the origin is the
// piece's foot point. `look` is { robe, team, grey }: a CSS filter list or '', 'ally' or
// 'enemy' for an outline (null for none), and whether the copy is the grey one.
function paintFrame(layer, sheet, row, frame, w, h, look, alpha = 1) {
  const c = layer.ctx,
    ratio = layer.canvas.width / layer.width || 1,
    shown = Math.max(1, h * ratio),
    // On ordinary screens copies are kept somewhat larger than they show, up to the art's
    // own size, so the second scaling on the way to the screen does not soften them.
    // Dense screens hide that softening and their copies are already large.
    wanted = ratio < 1.5 && shown < CELL_HEIGHT ? Math.min(shown * 1.4, CELL_HEIGHT) : shown,
    cell = HEIGHTS.find((size) => size >= wanted * 0.97) || HEIGHTS.at(-1),
    // The outline is a fixed share of the figure, but never under about a CSS pixel (less
    // on dense screens, where a full pixel swamps a phone-sized figure). It is rounded
    // coarsely so pieces at slightly different depths share one copy.
    step = ratio >= 2 ? 1 : 0.5,
    least = clamp(1.15 - 0.3 * ratio, 0.6, 0.85),
    edge = look.team
      ? Math.round(Math.max(cell * 0.012, (least * ratio * cell) / shown) / step) * step
      : 0,
    atlas = atlasFor(sheet, look, cell, Math.min(edge, 8));
  if (!atlas.ready[row * FRAMES + frame]) bake(atlas, sheet, look, row, frame);
  const kx = w / atlas.cw,
    ky = h / atlas.ch,
    sw = atlas.cw + atlas.pad * 2,
    sh = atlas.ch + atlas.pad * 2;
  if (alpha < 1) {
    c.save();
    c.globalAlpha *= alpha;
  }
  c.drawImage(
    atlas.canvas,
    frame * sw,
    row * sh,
    sw,
    sh,
    -w / 2 - atlas.pad * kx,
    (-h * FOOT_Y) / CELL_HEIGHT - atlas.pad * ky,
    sw * kx,
    sh * ky
  );
  if (alpha < 1) c.restore();
}

export { paintFrame };
