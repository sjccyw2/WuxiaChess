// The tile cursor: what marks the tile under the pointer or the keyboard focus.
import { POLISH } from '../polish.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Corner brackets that close and open on the tile under the pointer. Answers false, having
// painted nothing, when the tileCursor switch is off.
function paintCursor(layer, hover, now) {
  if (!POLISH.tileCursor) return false;
  const c = layer.ctx,
    beat = layer.prefs.motion ? 0.5 + 0.5 * Math.sin(now / 230) : 0.3,
    reach = 0.495 - beat * 0.05,
    arm = 0.185,
    scale = layer.scaleAt(hover.x, hover.y),
    line = clamp(scale * 0.046, 1.7, 3);
  layer.path(layer.tile(hover.x, hover.y, 0.47));
  c.fillStyle = 'rgba(255,236,176,.15)';
  c.fill();
  c.save();
  c.beginPath();
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1]
  ]) {
    const a = layer.point(hover.x + sx * reach, hover.y + sy * (reach - arm)),
      b = layer.point(hover.x + sx * reach, hover.y + sy * reach),
      d = layer.point(hover.x + sx * (reach - arm), hover.y + sy * reach);
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.lineTo(d.x, d.y);
  }
  c.lineCap = 'round';
  c.lineJoin = 'miter';
  c.strokeStyle = 'rgba(34,22,5,.8)';
  c.lineWidth = line * 2.2;
  c.stroke();
  c.strokeStyle = '#fff3c0';
  c.lineWidth = line;
  c.stroke();
  c.restore();
  return true;
}

export { paintCursor };
