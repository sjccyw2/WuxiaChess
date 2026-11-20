// A hero who has acted this turn is shown spent: grey sprite, dulled base and gauge.
// This module only keeps the timing of the fade; the grey copy of the sprite comes from
// sprite-frames.js and the dull base and gauge from tokens.js.
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const memories = new WeakMap();

// How far a hero has faded to grey, 0 to 1. A piece first met already spent (a loaded
// game) is simply grey; one seen acting fades over a few frames.
function spentAmount(layer, u, spent, now) {
  if (!memories.has(layer)) memories.set(layer, new Map());
  const marks = memories.get(layer);
  let mark = marks.get(u.id);
  if (!mark || mark.unit !== u) {
    mark = { unit: u, at: spent ? -Infinity : null };
    marks.set(u.id, mark);
  }
  if (!spent) {
    mark.at = null;
    return 0;
  }
  if (mark.at === null) mark.at = now;
  else if (now < mark.at) mark.at = -Infinity;
  return layer.prefs.motion ? clamp((now - mark.at) / 240, 0, 1) : 1;
}

export { spentAmount };
