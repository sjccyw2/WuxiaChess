// One dry-brush stroke, painted once and shared as a CSS mask (--combat-brush on <html>).
// The phase banner, the technique caption and the cut-in all take their ragged ink edge
// from it, each filling the shape with its own colour.
let ready = false;

function paintStroke() {
  const W = 1024,
    H = 160;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  let seed = 20240917;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  c.fillStyle = '#fff';
  const bristles = 84;
  for (let i = 0; i < bristles; i++) {
    const v = i / (bristles - 1), // 0 at the top edge, 1 at the bottom
      edge = Math.abs(v - 0.5) * 2, // 0 on the centre line, 1 at either edge
      y = 6 + v * (H - 12),
      thick = (H - 12) / bristles + 1.2;
    // The brush lands heavy on the left and lifts off dry on the right.
    const start = W * (0.012 + edge * edge * 0.05 + random() * 0.022);
    const end = W * (0.985 - edge * edge * 0.09 - random() * random() * 0.12);
    const outer = edge > 0.82;
    c.globalAlpha = outer ? 0.45 + random() * 0.4 : 1;
    let x = start;
    while (x < end) {
      // Past three quarters of the stroke the bristles begin to skip.
      const dry = Math.max(0, (x / W - 0.7) / 0.3);
      const run = W * (0.05 + random() * 0.3) * (1 - dry * 0.75);
      const stop = Math.min(end, x + run);
      c.fillRect(x, y, stop - x, thick);
      x = stop + W * random() * (0.004 + dry * dry * 0.05 + (outer ? 0.02 : 0));
    }
  }
  // A few hairline scratches where the paper shows through the body of the stroke.
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 16; i++) {
    const y = 14 + random() * (H - 28),
      x = W * (0.25 + random() * 0.6),
      length = W * (0.06 + random() * 0.22);
    c.globalAlpha = 0.25 + random() * 0.5;
    c.fillRect(x, y, length, 0.8 + random() * 1.4);
  }
  return canvas.toDataURL('image/png');
}

function inkBrush() {
  if (ready) return;
  ready = true;
  try {
    document.documentElement.style.setProperty('--combat-brush', `url("${paintStroke()}")`);
  } catch {
    // Without a canvas the bands simply keep their straight edges.
  }
}

export { inkBrush };
