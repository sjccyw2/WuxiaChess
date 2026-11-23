// Which figures a tap is on.
//
// A figure stands taller than its tile is deep, so its body and head are painted over the tiles
// behind it. A tap used to be read from the ground under it, with one loose box per figure as a
// second guess: a tap on a head fell through to the tile behind, and the empty corners of a nearer
// figure's box hid the one being aimed at. Players aim at the figure, so a tap is measured against
// each figure as it is drawn: the sprite's own shape in the frame showing. The shape, not the
// cell, because the ground beside a figure must stay free to be walked to.
//
// A fingertip is not that exact. A tap may also land a little beside a figure (`slack`), and the
// gauge over its head counts as beside it; the board lets such a near miss give way to whatever
// the ground under the tap is good for (scene/board.js, resolveBoardPick).
import { CELL_WIDTH, CELL_HEIGHT, FOOT_Y } from './sprite-sheets.js';

// A frame's shape is kept at a quarter of the sheet's cell: quick to read back, and about as fine
// as a figure is drawn on a phone.
const MASK_W = CELL_WIDTH / 4,
  MASK_H = CELL_HEIGHT / 4;
// How far outside the shape still counts as on it, in screen pixels: the outline drawn round a
// figure, and the gaps between an arm and a robe.
const EDGE = 1.5;
const shapes = new WeakMap();
let pane = null;

// The opaque pixels of one frame of a sheet, or null where the picture cannot be read back (the
// figure's box stands in for it then).
function shapeOf(sheet, row, frame) {
  let kept = shapes.get(sheet.image);
  if (!kept) shapes.set(sheet.image, (kept = new Map()));
  const name = sheet.x + ',' + sheet.y + ',' + row + ',' + frame;
  if (!kept.has(name)) {
    let shape = null;
    try {
      if (!pane) {
        const canvas = document.createElement('canvas');
        canvas.width = MASK_W;
        canvas.height = MASK_H;
        pane = canvas.getContext('2d', { willReadFrequently: true });
      }
      pane.clearRect(0, 0, MASK_W, MASK_H);
      pane.drawImage(
        sheet.image,
        sheet.x + frame * sheet.w,
        sheet.y + row * sheet.h,
        sheet.w,
        sheet.h,
        0,
        0,
        MASK_W,
        MASK_H
      );
      const d = pane.getImageData(0, 0, MASK_W, MASK_H).data;
      shape = new Uint8Array(MASK_W * MASK_H);
      for (let i = 0; i < shape.length; i++) shape[i] = d[i * 4 + 3] > 72 ? 1 : 0;
    } catch {}
    kept.set(name, shape);
  }
  return kept.get(name);
}

// How far a point is from a rectangle (0 inside it).
const boxGap = (b, px, py) =>
  Math.hypot(Math.max(b.left - px, 0, px - b.right), Math.max(b.top - py, 0, py - b.bottom));

// How far a point is from one drawn figure: 0 on it, up to `slack` beside it, null beyond that.
// `b` is what the layer noted as it painted the piece: its box, and for a sprite the frame
// showing (sheet, row, frame, flip) with where its cell stands (foot point x, y; cell w, h).
function figureGap(b, px, py, slack) {
  // Over its head: the gauge, a hand's breadth of bar a player takes for the piece itself.
  const onBar = b.bar && Math.abs(px - b.x) <= b.bar.half + 2 && Math.abs(py - b.bar.y) <= 5;
  const shape = b.sheet && shapeOf(b.sheet, b.row, b.frame);
  let gap;
  if (!shape) gap = boxGap(b, px, py);
  else {
    const k = MASK_H / b.h, // shape pixels to a screen pixel
      mx = ((b.flip ? b.x - px : px - b.x) + b.w / 2) * k,
      my = (py - b.y) * k + (FOOT_Y / CELL_HEIGHT) * MASK_H,
      far = (slack + EDGE) * k + 1,
      r = Math.ceil(far);
    let near = Infinity;
    for (let j = Math.max(0, Math.floor(my) - r); j <= Math.min(MASK_H - 1, Math.floor(my) + r); j++)
      for (let i = Math.max(0, Math.floor(mx) - r); i <= Math.min(MASK_W - 1, Math.floor(mx) + r); i++)
        if (shape[j * MASK_W + i]) {
          // To the nearest edge of that pixel, so a point inside one is on the figure.
          const d = Math.hypot(Math.max(i - mx, 0, mx - i - 1), Math.max(j - my, 0, my - j - 1));
          if (d < near) near = d;
        }
    gap = Math.max(0, near / k - EDGE);
  }
  if (onBar && gap > 0) gap = Math.min(gap, 1);
  return gap <= slack ? gap : null;
}

// Every figure a tap at (px, py) is on or within `slack` of, nearest the camera first:
// [{ id, gap }], gap 0 for a tap on the figure itself. `boxes` is in painting order, far to near.
function figuresAt(boxes, px, py, slack = 0) {
  const found = [];
  for (let i = boxes.length - 1; i >= 0; i--) {
    const gap = figureGap(boxes[i], px, py, slack);
    if (gap !== null) found.push({ id: boxes[i].id, gap });
  }
  return found;
}

export { figuresAt };
