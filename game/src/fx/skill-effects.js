// Signature arts are drawn in tile units, on top of the projected battlefield.
const TAU = Math.PI * 2;
const pt = (x, y) => ({ x, y });
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (a, b, t) => {
  const u = clamp((t - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const windowAt = (t, a, b, c, d) => ease(a, b, t) * (1 - ease(c, d, t));

function layer(c, alpha, draw) {
  if (alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= alpha;
  draw();
  c.restore();
}

function sample(curve, start = 0, end = 1, steps = 18) {
  return Array.from({ length: steps + 1 }, (_, i) => curve(mix(start, end, i / steps)));
}

function line(c, points, color, width) {
  c.beginPath();
  c.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i].x, points[i].y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function fillShape(c, points, color) {
  c.beginPath();
  c.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i].x, points[i].y);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

// A taper on both edges produces the pointed end and uneven pressure of a brush stroke.
function brush(c, points, widthAt, color) {
  const right = [],
    left = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      a = points[Math.max(0, i - 1)],
      b = points[Math.min(points.length - 1, i + 1)];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const w = widthAt(i / (points.length - 1)) / (Math.hypot(dx, dy) || 1);
    right.push(pt(p.x - dy * w, p.y + dx * w));
    left.push(pt(p.x + dy * w, p.y - dx * w));
  }
  fillShape(c, right.concat(left.reverse()), color);
}

function ellipse(c, x, y, rx, ry, color) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fillStyle = color;
  c.fill();
}

function light(c, x, y, rx, ry, center, edge) {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const glow = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  glow.addColorStop(0, center);
  glow.addColorStop(1, edge);
  ellipse(c, 0, 0, 1, 1, glow);
  c.restore();
}

function sweep(c, x, y, rx, ry, start, end, color, width) {
  const points = sample((u) => {
    const a = mix(start, end, u);
    return pt(x + rx * Math.cos(a), y + ry * Math.sin(a));
  });
  brush(c, points, (u) => width * (0.07 + 0.93 * Math.sin(Math.PI * u)), color);
}

// Local x always points at the target. Local y stays on the lower side of the screen,
// so horns, a dragon's belly and a guqin remain upright when a camera reverses the shot.
function along(c, e, draw) {
  c.save();
  c.transform(e.ux, e.uy, -e.uy * e.side, e.ux * e.side, 0, 0);
  draw(e.distance);
  c.restore();
}

function blade(c, x, y, angle, length, width, metal, spine = '#fff9df') {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  // The origin is the tip, so it follows the end of its painted trail exactly.
  fillShape(
    c,
    [
      pt(0, 0),
      pt(-length * 0.23, -width),
      pt(-length, -width * 0.64),
      pt(-length, width * 0.62),
      pt(-length * 0.23, width)
    ],
    '#374a4a'
  );
  fillShape(
    c,
    [
      pt(0, 0),
      pt(-length * 0.24, -width * 0.83),
      pt(-length, -width * 0.38),
      pt(-length, width * 0.12)
    ],
    metal
  );
  line(
    c,
    [pt(-length, width * 0.1), pt(-length * 0.19, 0.0), pt(0, 0)],
    spine,
    Math.min(0.012, width * 0.34)
  );
  line(
    c,
    [pt(-length, -width * 2.1), pt(-length * 1.04, 0), pt(-length, width * 2.1)],
    '#d5bd82',
    width * 0.55
  );
  line(c, [pt(-length * 1.03, 0), pt(-length * 1.24, 0)], '#5b5e53', width * 0.79);
  ellipse(c, -length * 1.25, 0, width * 0.66, width * 0.6, '#ead6a2');
  c.restore();
}

function tangent(curve, u) {
  const p = curve(clamp(u - 0.012)),
    q = curve(clamp(u + 0.012));
  return Math.atan2(q.y - p.y, q.x - p.x);
}

function fragment(c, x, y, angle, size, color) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  fillShape(
    c,
    [pt(-size, 0.0), pt(-size * 0.18, -size * 0.25), pt(size, 0), pt(-size * 0.18, size * 0.22)],
    color
  );
  c.restore();
}

// The four painted stamps are packed into this module to keep the complete field art
// available in the offline build. Every technique also has an immediate vector form.
const STAMPS = {
  dragon: [2, 2, 350, 288],
  sword: [357, 2, 207, 85],
  lotus: [357, 94, 208, 168],
  spire: [2, 296, 140, 142]
};
const inkSheet = typeof globalThis.Image === 'function' ? new globalThis.Image() : null;

function hasInk() {
  return inkSheet && inkSheet.complete && inkSheet.naturalWidth >= 564;
}

function stamp(c, name, x, y, width, height, anchorX, anchorY) {
  if (!hasInk()) return false;
  const [sx, sy, sw, sh] = STAMPS[name];
  c.drawImage(inkSheet, sx, sy, sw, sh, x - width * anchorX, y - height * anchorY, width, height);
  return true;
}

function spectralSword(c, x, y, angle, length, tint) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  if (stamp(c, 'sword', 0, 0, length * 1.3, length * 0.53, 0.995, 0.204)) {
    // The luminous edge catches light along the sword's steel ridge. Its bronze
    // guard and red tassel remain distinct in front of the moving silk/ink trail.
    line(c, [pt(-length * 0.71, -0.003), pt(-length * 0.13, -0.008), pt(0, 0)], tint, 0.015);
  } else blade(c, 0, 0, 0, length, 0.055, tint);
  c.restore();
}

function plume(c, points, width, mist, body, core) {
  const pressure = (u) => Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.64);
  brush(c, points, (u) => width * 1.95 * pressure(u), mist);
  brush(c, points, (u) => width * pressure(u), body);
  brush(c, points, (u) => width * 0.28 * pressure(u), core);
}

function ruyi(c, x, y, size, rotation, color, glint) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.scale(size, size);
  const curls = [
    [-0.33, 0.09, -0.43, -0.04, -0.27, -0.13],
    [-0.15, -0.2, -0.18, -0.4, 0.008, -0.38],
    [0.18, -0.37, 0.15, -0.18, 0.065, -0.19],
    [-0.005, -0.2, 0.02, -0.29, 0.084, -0.27]
  ];
  curveLine(c, color, 0.07, [-0.65, 0.08], curls);
  curveLine(
    c,
    glint,
    0.024,
    [-0.62, 0.051],
    [
      [-0.38, 0.04, -0.42, -0.074, -0.266, -0.16],
      [-0.115, -0.24, -0.16, -0.4, 0.014, -0.4]
    ]
  );
  curveLine(
    c,
    color,
    0.042,
    [-0.2, -0.16],
    [
      [0.0, -0.1, 0.13, 0.005, 0.33, -0.09],
      [0.44, -0.147, 0.53, -0.125, 0.67, -0.148]
    ]
  );
  c.restore();
}

function crescent(c, x, y, r, angle, fill, edge) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(r, r);
  c.beginPath();
  c.moveTo(-0.23, -0.96);
  c.bezierCurveTo(-1.08, -0.71, -1.13, 0.39, -0.49, 0.88);
  c.bezierCurveTo(-0.057, 1.202, 0.55, 1.03, 0.84, 0.58);
  c.bezierCurveTo(0.34, 0.88, -0.26, 0.69, -0.53, 0.27);
  c.bezierCurveTo(-0.83, -0.18, -0.63, -0.66, -0.23, -0.96);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  curveLine(
    c,
    edge,
    0.018,
    [-0.23, -0.96],
    [
      [-1.11, -0.62, -1.03, 0.46, -0.49, 0.87],
      [0.04, 1.22, 0.61, 0.94, 0.82, 0.61]
    ]
  );
  c.restore();
}

function scattering(c, x, y, t, count, radius, palette, flat = 0.78) {
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996 + 0.31,
      r = (0.19 + 0.81 * t) * radius * (0.63 + (0.37 * ((i * 7) % 11)) / 10);
    const px = x + Math.cos(a) * r,
      py = y + Math.sin(a) * r * flat + 0.12 * t * t;
    fragment(
      c,
      px,
      py,
      a - 0.14 + t * 0.43,
      (0.052 + 0.034 * (i % 3)) * (1 - 0.53 * t),
      palette[i % palette.length]
    );
    if (i % 4 === 0) ellipse(c, px + 0.038, py - 0.047, 0.015, 0.012, palette[0]);
  }
}

function silverFan(c, e) {
  const t = e.t;
  along(c, e, (length) => {
    layer(c, windowAt(t, 0.01, 0.13, 0.25, 0.47), () => {
      const open = ease(0.01, 0.25, t),
        r = 0.45 + 0.54 * open;
      light(c, -0.12, -0.07, r * 1.14, r, '#cae3d344', '#769b9e00');
      sweep(c, -0.13, -0.06, r * 0.76, r, 1.75, 4.95, '#91aa9c', 0.029);
      sweep(c, -0.13, -0.06, r * 0.87, r * 1.13, 2.05, 4.71, '#d5c08b', 0.02);
    });
    for (let i = 0; i < 9; i++) {
      const band = i - 4,
        theta = band * 0.265,
        lag = (Math.abs(band) + (i % 2)) * 0.008;
      const open = ease(0.015 + i * 0.004, 0.22, t);
      const start = pt(
        -0.42 + 0.75 * Math.cos(theta) * open,
        Math.sin(theta) * (1.11 * open + 0.08) - 0.08
      );
      const tip = pt(length + 0.13 + 0.04 * (i % 3), band * 0.025);
      const curve = (v) =>
        pt(
          mix(start.x, tip.x, v) + 0.15 * Math.sin(Math.PI * v),
          mix(start.y, tip.y, v) + band * 0.195 * Math.sin(Math.PI * v) + 0.086 * Math.sin(TAU * v)
        );
      const head = ease(0.208 + lag, 0.515 + lag * 0.5, t),
        tail = ease(0.34 + lag, 0.76 + lag, t);
      layer(
        c,
        windowAt(t, 0.027 + i * 0.006, 0.13 + lag, 0.61 + lag, 0.8 + lag) *
          (i % 3 === 1 ? 1 : 0.89),
        () => {
          const p = curve(head),
            pts = sample(curve, Math.min(tail, head), head, 20);
          plume(
            c,
            pts,
            i % 3 === 1 ? 0.051 : 0.039,
            '#addfdd35',
            i % 2 ? '#b3c9c2' : '#d2d9cf',
            '#fffced'
          );
          const tilt = mix(theta * 0.97, tangent(curve, head), ease(0.19, 0.41, t));
          spectralSword(c, p.x, p.y, tilt, 0.45 + 0.13 * (i % 3), i % 2 ? '#e7fff5' : '#fff8d8');
        }
      );
    }
    layer(c, windowAt(t, 0.46, 0.54, 0.74, 0.98), () => {
      const hit = ease(0.476, 0.67, t),
        dissolve = ease(0.65, 0.97, t);
      light(c, length, 0, 0.72, 0.62, '#eaf5dd52', '#b6cfc500');
      const cut = (v) =>
        pt(length - 1.03 + v * 2.16, -0.7 + v * 1.34 - 0.47 * Math.sin(Math.PI * v));
      plume(
        c,
        sample(cut, Math.min(dissolve, hit), hit, 22),
        0.086,
        '#c8e5cd38',
        '#d6ded0',
        '#fffde5'
      );
      const reverse = (v) =>
        pt(length - 0.6 + v * 1.45, 0.53 - v * 1.35 + 0.17 * Math.sin(Math.PI * v));
      plume(
        c,
        sample(reverse, dissolve * 0.88, ease(0.5, 0.7, t), 20),
        0.047,
        '#abbec73d',
        '#a6bbbb',
        '#e5f5eb'
      );
      scattering(c, length, 0.0, ease(0.51, 0.95, t), 15, 1.33, ['#f0edd2', '#b2dcd5', '#aab6a6']);
    });
  });
  // The nine cuts settle into separate spectral swords around the struck tile.
  layer(c, windowAt(t, 0.575, 0.705, 0.84, 0.986) * 0.77, () => {
    const settle = ease(0.6, 0.82, t),
      out = ease(0.79, 0.98, t),
      r = 0.58 + 0.22 * settle + 0.1 * out;
    const g = e.ground;
    sweep(c, g.x, g.y, r, r * 0.34, -2.95, 2.67, '#a9c3b6', 0.021);
    for (let i = 0; i < 9; i++) {
      const a = (i * TAU) / 9 - 0.38,
        radius = r * (i % 2 ? 0.95 : 1.07);
      const tip = pt(
        g.x + Math.cos(a) * radius,
        g.y + Math.sin(a) * radius * 0.34 - 0.09 * (1 - settle)
      );
      blade(
        c,
        tip.x,
        tip.y,
        Math.PI * 0.5 + Math.cos(a) * 0.27,
        0.33 + 0.11 * (i % 3),
        0.02,
        i % 2 ? '#c6e2da' : '#efdcb6'
      );
    }
  });
}

function twinBlades(c, e) {
  const t = e.t;
  along(c, e, (length) => {
    layer(c, windowAt(t, 0.02, 0.18, 0.29, 0.48), () => {
      const r = 0.33 + 0.35 * ease(0.035, 0.28, t);
      light(c, -0.08, -0.37, r, r, '#d6e2ed5c', '#b5bfd600');
      crescent(c, -0.08, -0.37, r, -0.42, '#d6e5e8b8', '#f9f6e1');
    });
    for (const side of [-1, 1]) {
      const lag = side < 0 ? 0.022 : 0,
        head = ease(0.17 + lag, 0.515 + lag, t),
        tail = ease(0.4, 0.84, t);
      const curve = (v) =>
        pt(
          (length + 0.32) * v - 0.08,
          side *
            (0.34 * Math.cos(Math.PI * v) -
              0.78 * Math.sin(TAU * v) +
              0.12 * Math.sin(3 * Math.PI * v)) -
            0.12 * Math.sin(Math.PI * v)
        );
      layer(c, windowAt(t, 0.045, 0.19, 0.58, 0.85), () => {
        const pts = sample(curve, Math.min(tail, head), head, 36),
          p = curve(head);
        const twist = (u) =>
          0.16 *
          Math.pow(Math.max(0, Math.sin(u * Math.PI)), 0.8) *
          (0.22 + 0.78 * Math.abs(Math.cos(u * 4.8 + side * 0.6)));
        brush(c, pts, (u) => twist(u) * 1.72, side < 0 ? '#c2a3d454' : '#a6dbe951');
        brush(c, pts, (u) => twist(u), side < 0 ? '#d7afd2' : '#b4dfe2');
        brush(c, pts, (u) => twist(u) * 0.42, side < 0 ? '#fff0ee' : '#f2fff9');
        const thread = pts.map((q, i) => pt(q.x, q.y + side * twist(i / (pts.length - 1)) * 0.77));
        line(c, thread, '#f7e7bd', 0.014);
        spectralSword(c, p.x, p.y, tangent(curve, head), 0.76, side < 0 ? '#ffedf4' : '#ddfffb');
      });
    }
    layer(c, windowAt(t, 0.45, 0.55, 0.75, 0.98), () => {
      const flare = ease(0.45, 0.66, t),
        out = ease(0.6, 0.96, t),
        r = 0.46 + 0.54 * flare + 0.13 * out;
      light(c, length, -0.1, r * 1.1, r, '#d9dde74d', '#d4c8ea00');
      crescent(c, length, -0.08, r, 0.36 + out * 0.31, '#d6e5eaa6', '#fff2d7');
      for (const side of [-1, 1]) {
        const arc = (v) =>
          pt(
            length - 1.08 + v * 2.17,
            side * (0.78 - 1.58 * v + 0.32 * Math.sin(Math.PI * v)) - 0.15
          );
        plume(
          c,
          sample(arc, Math.min(out * 0.86, flare), flare, 22),
          0.055,
          side < 0 ? '#e0c1d94d' : '#b9dce950',
          side < 0 ? '#ead0df' : '#c8e9ee',
          '#fff9ec'
        );
      }
      for (let i = 0; i < 9; i++) {
        const a = i * 2.399 + 0.52,
          rr = (0.38 + out * 0.86) * (i % 2 ? 0.91 : 1.13);
        leaf(
          c,
          length + Math.cos(a) * rr,
          -0.12 + Math.sin(a) * rr * 0.67 - out * 0.15,
          a + out * 0.56,
          0.07 + (i % 3) * 0.015,
          i % 2 ? '#e6ccd9' : '#c6dce1'
        );
      }
    });
  });
}

const RAY_COLORS = ['#71dddf', '#8ee8b7', '#fccc77', '#96c6ff', '#f39fb0', '#bea3f2'];
function sixRays(c, e) {
  const t = e.t;
  along(c, e, (length) => {
    layer(c, windowAt(t, 0.01, 0.15, 0.3, 0.48), () => {
      light(c, -0.025, -0.05, 0.72, 0.88, '#dfdfc654', '#aeccbe00');
      const spread = ease(0.02, 0.19, t);
      for (let i = 0; i < 6; i++) {
        const a = -1.3 + i * 0.49,
          rx = 0.14 + 0.28 * spread,
          ry = 0.27 + 0.42 * spread;
        const p = pt(Math.cos(a) * rx, Math.sin(a) * ry);
        line(
          c,
          [pt(-0.17, 0.07), pt(p.x * 0.57, p.y * 0.55 + 0.05), p],
          RAY_COLORS[i] + 'ab',
          0.019
        );
        light(c, p.x, p.y, 0.128, 0.128, RAY_COLORS[i] + 'c9', RAY_COLORS[i] + '00');
        fragment(c, p.x, p.y, a, 0.072, RAY_COLORS[i]);
      }
    });
    for (let i = 0; i < 6; i++) {
      const band = i - 2.5,
        lag = i * 0.011,
        head = ease(0.18 + lag, 0.489 + lag, t),
        tail = ease(0.42 + lag, 0.75 + lag, t);
      const curve = (u) =>
        pt(
          u * (length + 0.26) + 0.07,
          band * (0.095 + 0.225 * Math.sin(Math.PI * u * 0.93) + 0.085 * u)
        );
      layer(c, windowAt(t, 0.095 + lag, 0.22 + lag, 0.63 + lag, 0.82 + lag), () => {
        const pts = sample(curve, Math.min(tail, head), head, 17),
          p = curve(head),
          angle = tangent(curve, head);
        plume(c, pts, 0.048, RAY_COLORS[i] + '49', RAY_COLORS[i] + 'ec', '#fffbea');
        for (let j = 0; j < 2; j++) {
          const pulse = (head - tail) * (0.27 + j * 0.39) + tail,
            q = curve(clamp(pulse));
          fragment(c, q.x, q.y, tangent(curve, pulse), 0.12 + j * 0.03, '#fff8dc');
        }
        c.save();
        c.translate(p.x, p.y);
        c.rotate(angle);
        fillShape(
          c,
          [pt(0.135, 0), pt(-0.17, -0.056), pt(-0.36, 0), pt(-0.17, 0.048)],
          RAY_COLORS[i]
        );
        fillShape(c, [pt(0.135, 0), pt(-0.17, -0.056), pt(-0.12, 0)], '#fffced');
        c.restore();
      });
      layer(c, windowAt(t, 0.46 + lag, 0.53 + lag, 0.69 + lag, 0.98), () => {
        const expand = ease(0.49 + lag, 0.77 + lag, t),
          fade = ease(0.68 + lag, 0.97, t),
          a = band * 0.34;
        const p = curve(1),
          reach = 0.25 + expand * (0.64 + 0.12 * (i % 2));
        const q = pt(p.x + Math.cos(a) * reach, p.y + Math.sin(a) * reach);
        const start = pt(mix(p.x, q.x, fade * 0.85), mix(p.y, q.y, fade * 0.85));
        plume(
          c,
          sample((u) => pt(mix(start.x, q.x, u), mix(start.y, q.y, u)), 0, 1, 8),
          0.03,
          RAY_COLORS[i] + '32',
          RAY_COLORS[i],
          '#fffae4'
        );
        fragment(c, q.x, q.y, a, 0.124 * (1 - 0.6 * fade), RAY_COLORS[i]);
      });
    }
    layer(c, windowAt(t, 0.54, 0.665, 0.85, 0.985) * 0.9, () => {
      const breathe = ease(0.56, 0.83, t),
        out = ease(0.79, 0.985, t),
        radius = 0.37 + 0.29 * breathe + 0.14 * out;
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6 - 0.38,
          curve = (u) => {
            const turn = a - 0.56 * (1 - u),
              r = radius * (0.23 + 0.77 * u);
            return pt(length + Math.cos(turn) * r, Math.sin(turn) * r * 0.83);
          };
        const knots = sample(curve, 0, 1, 11),
          q = curve(1);
        plume(c, knots, 0.027, RAY_COLORS[i] + '4d', RAY_COLORS[i] + 'c2', '#f9f0d7');
        light(c, q.x, q.y, 0.114, 0.114, RAY_COLORS[i] + 'b9', RAY_COLORS[i] + '00');
        fragment(c, q.x, q.y, a, 0.064, RAY_COLORS[i]);
      }
    });
  });
}

function curveLine(c, color, width, start, curves) {
  c.beginPath();
  c.moveTo(start[0], start[1]);
  for (const v of curves) c.bezierCurveTo(...v);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function dragonHead(c) {
  // Backward-swept mane, a pair of branching antlers, long whiskers and the split muzzle.
  fillShape(
    c,
    [
      pt(-0.06, -0.2),
      pt(-0.29, -0.29),
      pt(-0.23, -0.18),
      pt(-0.43, -0.27),
      pt(-0.32, -0.11),
      pt(-0.5, -0.12),
      pt(-0.3, -0.01),
      pt(-0.44, 0.04),
      pt(-0.22, 0.11),
      pt(-0.29, 0.22),
      pt(-0.07, 0.09)
    ],
    '#a26637'
  );
  fillShape(
    c,
    [
      pt(-0.04, -0.16),
      pt(-0.28, -0.21),
      pt(-0.23, -0.12),
      pt(-0.39, -0.13),
      pt(-0.22, -0.035),
      pt(-0.32, 0.01),
      pt(-0.14, 0.07),
      pt(-0.2, 0.13),
      pt(0.0, 0.07)
    ],
    '#eab65c'
  );
  curveLine(c, '#83613c', 0.016, [-0.36, -0.19], [[-0.28, -0.16, -0.24, -0.05, -0.14, -0.058]]);
  curveLine(c, '#f4d38b', 0.016, [-0.36, 0.03], [[-0.24, 0.001, -0.18, 0.076, -0.09, 0.042]]);
  for (const [x, y, s] of [
    [-0.11, -0.16, 1],
    [0.015, -0.17, 0.84]
  ]) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.beginPath();
    c.moveTo(0, 0.02);
    c.bezierCurveTo(-0.04, -0.08, -0.12, -0.18, -0.28, -0.26);
    c.quadraticCurveTo(-0.15, -0.25, -0.09, -0.17);
    c.quadraticCurveTo(-0.14, -0.29, -0.13, -0.36);
    c.quadraticCurveTo(-0.09, -0.21, -0.04, -0.18);
    c.quadraticCurveTo(0.015, -0.22, 0.019, -0.3);
    c.quadraticCurveTo(0.063, -0.18, 0.015, -0.12);
    c.lineTo(0.075, 0.025);
    c.closePath();
    c.fillStyle = '#ecce82';
    c.fill();
    c.strokeStyle = '#735130';
    c.lineWidth = 0.012;
    c.stroke();
    curveLine(
      c,
      '#b78340',
      0.012,
      [0.033, -0.022],
      [[-0.006, -0.081, -0.049, -0.159, -0.074, -0.177]]
    );
    c.restore();
  }
  c.beginPath();
  c.moveTo(0.101, -0.072);
  c.bezierCurveTo(0.216, -0.106, 0.371, -0.112, 0.429, -0.069);
  c.quadraticCurveTo(0.412, 0.05, 0.318, 0.109);
  c.quadraticCurveTo(0.2, 0.124, 0.103, 0.048);
  c.closePath();
  c.fillStyle = '#793f32';
  c.fill();
  curveLine(c, '#ca896c', 0.019, [0.204, 0.083], [[0.259, 0.089, 0.291, 0.072, 0.348, 0.055]]);
  c.beginPath();
  c.moveTo(-0.19, -0.1);
  c.bezierCurveTo(-0.16, -0.25, -0.012, -0.27, 0.12, -0.208);
  c.lineTo(0.23, -0.159);
  c.quadraticCurveTo(0.29, -0.173, 0.345, -0.18);
  c.quadraticCurveTo(0.425, -0.19, 0.454, -0.119);
  c.quadraticCurveTo(0.466, -0.057, 0.388, -0.032);
  c.lineTo(0.196, -0.01);
  c.quadraticCurveTo(0.208, 0.065, 0.32, 0.066);
  c.quadraticCurveTo(0.377, 0.064, 0.432, 0.019);
  c.quadraticCurveTo(0.415, 0.14, 0.267, 0.162);
  c.quadraticCurveTo(0.165, 0.166, 0.068, 0.096);
  c.quadraticCurveTo(-0.065, 0.162, -0.183, 0.074);
  c.quadraticCurveTo(-0.268, -0.022, -0.19, -0.1);
  c.closePath();
  const gold = c.createLinearGradient(-0.05, -0.23, 0.1, 0.17);
  gold.addColorStop(0, '#ffdf86');
  gold.addColorStop(0.43, '#eab65a');
  gold.addColorStop(1, '#b78042');
  c.fillStyle = gold;
  c.fill();
  c.strokeStyle = '#754d2a';
  c.lineWidth = 0.021;
  c.stroke();
  c.beginPath();
  c.moveTo(-0.155, -0.153);
  c.quadraticCurveTo(-0.269, -0.194, -0.31, -0.268);
  c.quadraticCurveTo(-0.197, -0.274, -0.1, -0.187);
  c.closePath();
  c.fillStyle = '#c08b4a';
  c.fill();
  curveLine(
    c,
    '#f5d287',
    0.014,
    [-0.285, -0.251],
    [[-0.229, -0.235, -0.191, -0.213, -0.151, -0.177]]
  );
  fillShape(
    c,
    [
      pt(-0.089, -0.166),
      pt(-0.055, -0.225),
      pt(0.043, -0.21),
      pt(0.151, -0.154),
      pt(0.062, -0.168),
      pt(-0.02, -0.185)
    ],
    '#a0723d'
  );
  curveLine(c, '#ffe6a1', 0.015, [-0.069, -0.202], [[-0.01, -0.236, 0.084, -0.162, 0.145, -0.155]]);
  fillShape(
    c,
    [pt(0.033, -0.166), pt(0.173, -0.139), pt(0.067, -0.089), pt(-0.005, -0.112)],
    '#624022'
  );
  ellipse(c, 0.075, -0.126, 0.036, 0.02, '#fff1b7');
  ellipse(c, 0.088, -0.127, 0.01, 0.018, '#344234');
  ellipse(c, 0.383, -0.135, 0.035, 0.017, '#8a5c2f');
  fillShape(c, [pt(0.291, -0.029), pt(0.332, -0.033), pt(0.305, 0.044)], '#fff5c9');
  fillShape(c, [pt(0.352, -0.029), pt(0.38, -0.033), pt(0.357, 0.014)], '#fff2bf');
  fillShape(c, [pt(0.258, 0.074), pt(0.283, 0.038), pt(0.292, 0.082)], '#f5dc9e');
  fillShape(
    c,
    [pt(-0.012, 0.095), pt(0.012, 0.22), pt(0.036, 0.117), pt(0.07, 0.207), pt(0.09, 0.11)],
    '#f7d676'
  );
  curveLine(
    c,
    '#ab7943',
    0.016,
    [-0.156, -0.092],
    [
      [-0.09, -0.113, -0.098, -0.013, -0.031, 0.011],
      [0.038, 0.035, 0.054, 0.002, 0.027, -0.023]
    ]
  );
  curveLine(
    c,
    '#f7d587',
    0.012,
    [-0.149, -0.082],
    [[-0.109, -0.097, -0.106, 0.013, -0.041, 0.028]]
  );
  curveLine(c, '#9e6b38', 0.011, [0.121, -0.106], [[0.172, -0.106, 0.189, -0.068, 0.244, -0.088]]);
  curveLine(c, '#fff0ad', 0.018, [0.16, -0.147], [[0.24, -0.122, 0.3, -0.201, 0.37, -0.171]]);
  curveLine(
    c,
    '#f7d88a',
    0.017,
    [0.26, -0.07],
    [
      [0.42, -0.1, 0.47, -0.28, 0.61, -0.25],
      [0.69, -0.23, 0.65, -0.17, 0.6, -0.18]
    ]
  );
  curveLine(
    c,
    '#ebc477',
    0.013,
    [0.27, -0.04],
    [
      [0.43, -0.02, 0.48, 0.15, 0.62, 0.13],
      [0.69, 0.12, 0.68, 0.08, 0.63, 0.085]
    ]
  );
  curveLine(c, '#ffdf92', 0.021, [-0.31, -0.105], [[-0.19, -0.08, -0.19, 0.036, -0.068, 0.047]]);
}

function dragonInkFallback(c, e) {
  const t = e.t;
  along(c, e, (length) => {
    const cast = ease(0.17, 0.53, t),
      after = ease(0.52, 0.82, t);
    layer(c, windowAt(t, 0.02, 0.15, 0.25, 0.39), () => {
      const charge = ease(0.02, 0.28, t);
      light(c, 0, 0.0, 0.48, 0.43, '#edbc5b62', '#edbc5b00');
      sweep(
        c,
        0,
        0.0,
        0.24 + charge * 0.14,
        0.18 + charge * 0.08,
        -2.6 + charge,
        2.9 + charge,
        '#eed085',
        0.035
      );
      sweep(c, 0, 0.015, 0.34, 0.25, 0.19 + charge * 1.4, 3.19 + charge * 1.4, '#cb954d', 0.024);
    });
    layer(c, windowAt(t, 0.125, 0.26, 0.6, 0.84), () => {
      const x = mix(-0.04, length - 0.25, cast) + after * 0.2,
        y = -0.06 - 0.15 * Math.sin(cast * Math.PI);
      const strength = 0.37 + 0.63 * ease(0.15, 0.37, t);
      const reach = (0.38 + 0.62 * ease(0.17, 0.44, t)) * clamp(length * 0.72 + 0.6, 0.86, 2.9);
      const power = 0.1 + 0.22 * ease(0.16, 0.39, t),
        phase = t * 3.7;
      const body = (u) => {
        const v = 1 - u;
        return pt(
          x - 0.14 - reach * v,
          y + power * Math.sin(v * TAU * 1.3 - phase) * Math.sin(Math.PI * v) + 0.08 * v
        );
      };
      const pts = sample(body, 0, 1, 40);
      for (const [at, side] of [
        [0.44, 1],
        [0.72, -1]
      ]) {
        const p = body(at);
        c.save();
        c.translate(p.x, p.y);
        c.scale(1, side);
        const leg = [
          [0.085, 0.1, 0.135, 0.15, 0.07, 0.18],
          [0.04, 0.197, 0.025, 0.17, -0.017, 0.18]
        ];
        curveLine(c, '#8a5c30', 0.06, [0, 0.0], leg);
        curveLine(c, '#deb263', 0.035, [0.0, 0.0], leg);
        for (const z of [-1, 0, 1])
          curveLine(
            c,
            '#f3d58d',
            0.015,
            [0.0, 0.18],
            [[0.0, 0.18, -0.035, 0.19 + z * 0.018, -0.07, 0.19 + z * 0.034]]
          );
        c.restore();
      }
      const width = (u) =>
        (0.009 + 0.086 * Math.pow(u, 0.6) + 0.04 * Math.sin(u * Math.PI)) * strength;
      brush(c, pts, (u) => width(u) + 0.014, '#835932');
      const hide = c.createLinearGradient(x - reach, y, x, y);
      hide.addColorStop(0, '#ebbe6c');
      hide.addColorStop(0.38, '#c68a3c');
      hide.addColorStop(0.7, '#e1ad54');
      hide.addColorStop(1, '#bd813f');
      brush(c, pts, width, hide);
      brush(
        c,
        pts.map((p, i) => pt(p.x, p.y + width(i / (pts.length - 1)) * 0.54)),
        (u) => width(u) * 0.39,
        '#f4d68b'
      );
      const scales = Math.max(9, Math.round(reach * 10));
      for (let i = 1; i < scales; i++) {
        const u = i / scales,
          p = body(u),
          w = width(u),
          angle = tangent(body, u),
          step = reach / scales;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(angle);
        fillShape(
          c,
          [pt(-0.056, -w * 0.83), pt(-0.076, -w * 1.58), pt(0.029, -w * 0.77)],
          i % 2 ? '#d4a260' : '#efbd66'
        );
        // Two offset rows of overlapping scales run parallel to the spine. The belly
        // plates turn at each bend, so the small figure keeps its three-dimensional form.
        for (const [offset, band] of [
          [0, -0.36],
          [-0.35, 0.11]
        ]) {
          const ox = offset * step,
            oy = band * w;
          c.beginPath();
          c.moveTo(ox - step * 0.41, oy - w * 0.28);
          c.quadraticCurveTo(ox + step * 0.15, oy - w * 0.3, ox + step * 0.39, oy);
          c.quadraticCurveTo(ox + step * 0.05, oy + w * 0.36, ox - step * 0.42, oy + w * 0.24);
          c.quadraticCurveTo(ox - step * 0.12, oy, ox - step * 0.41, oy - w * 0.28);
          c.closePath();
          c.fillStyle = i % 2 ? '#e4b45f' : '#edc371';
          c.fill();
          c.strokeStyle = '#9f743e';
          c.lineWidth = 0.012;
          c.stroke();
        }
        line(c, [pt(-step * 0.12, w * 0.44), pt(step * 0.13, w * 0.86)], '#bc975d', 0.011);
        c.restore();
      }
      c.save();
      c.translate(x, y);
      c.rotate(-0.07 + 0.06 * after);
      c.scale(strength, strength);
      dragonHead(c);
      c.restore();
    });
    layer(c, windowAt(t, 0.46, 0.56, 0.66, 0.94), () => {
      const r = ease(0.49, 0.92, t);
      sweep(
        c,
        length,
        -0.01,
        0.18 + r * 0.43,
        0.12 + r * 0.29,
        -1.47,
        1.84,
        '#f1cb77',
        0.03 * (1 - 0.55 * r)
      );
      for (let i = 0; i < 8; i++) {
        const angle = i * 2.399 + 0.25,
          radius = 0.17 + (i % 3) * 0.06 + r * 0.52;
        fragment(
          c,
          length + Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.78,
          angle,
          0.05 + (i % 3) * 0.014,
          i % 2 ? '#f4d995' : '#c8974e'
        );
      }
    });
  });
}

function dragonSilk(c, x, y, width, height, phase) {
  const [sx, sy, sw, sh] = STAMPS.dragon,
    bands = 22;
  // The head stays registered to the palm strike while the painted tail undulates.
  // A subpixel overlap between neighboring strips survives fractional phone projection.
  c.save();
  c.translate(x, y);
  c.rotate(-0.025 - 0.042 * Math.sin(phase));
  for (let i = 0; i < bands; i++) {
    const u = (i + 0.5) / bands,
      tail = 1 - u,
      weight = Math.sin(Math.PI * tail * 0.98) * tail;
    const wave = 0.095 * Math.sin(tail * TAU * 1.48 - phase * 2) * weight;
    const depth = 1 + 0.041 * Math.cos(tail * TAU - phase * 1.7) * weight;
    const sourceLeft = sx + (sw * i) / bands,
      srcWidth = sw / bands + (i === bands - 1 ? 0 : 0.4);
    c.drawImage(
      inkSheet,
      sourceLeft,
      sy,
      srcWidth,
      sh,
      (i / bands - 0.964) * width,
      -height * 0.318 * depth + wave,
      (width * srcWidth) / sw,
      height * depth
    );
  }
  c.restore();
}

function dragonPalm(c, e) {
  const t = e.t;
  layer(c, windowAt(t, 0.45, 0.54, 0.78, 0.99), () => {
    const kick = ease(0.47, 0.72, t),
      after = ease(0.64, 1, t),
      g = e.ground;
    for (let i = 0; i < 2; i++) {
      const r = 0.31 + kick * (0.7 + i * 0.23) + after * 0.26;
      sweep(
        c,
        g.x,
        g.y,
        r,
        r * 0.34,
        -2.64 + i * 0.36,
        2.47 + i * 0.31,
        i ? '#dfad62' : '#f2d78c',
        0.039 * (1 - 0.52 * after)
      );
    }
  });
  along(c, e, (length) => {
    const cast = ease(0.18, 0.52, t),
      after = ease(0.54, 0.86, t),
      gather = ease(0.035, 0.3, t);
    layer(c, windowAt(t, 0.012, 0.14, 0.28, 0.47), () => {
      const r = 0.34 + 0.49 * gather;
      light(c, -0.08, -0.01, r, r * 0.72, '#ffbf4a75', '#eda94b00');
      for (let i = 0; i < 3; i++) {
        const a = (i * TAU) / 3 + gather * 0.87;
        sweep(
          c,
          -0.08,
          0,
          r * (0.81 + i * 0.1),
          r * 0.59,
          a,
          a + 1.94,
          i % 2 ? '#e6ab5c' : '#ffe0a2',
          0.043
        );
        ruyi(
          c,
          -0.02 + Math.cos(a) * r * 0.75,
          Math.sin(a) * r * 0.43,
          0.36,
          a * 0.21,
          '#b78345',
          '#f9cf7c'
        );
      }
    });
    layer(c, windowAt(t, 0.18, 0.34, 0.64, 0.87), () => {
      const front = length * cast,
        tail = front - (1.1 + 0.33 * length);
      for (let i = 0; i < 3; i++) {
        const bend = (v) =>
          pt(
            mix(tail, front, v),
            -0.11 +
              (i - 1) * 0.2 +
              0.34 * Math.sin(v * TAU * 1.2 + t * 2.8 + i * 0.32) * Math.sin(Math.PI * v)
          );
        plume(c, sample(bend, 0, 1, 27), 0.055 + i * 0.008, '#de983638', '#d6a351a6', '#f8db98');
      }
    });
    if (hasInk())
      layer(c, windowAt(t, 0.11, 0.26, 0.66, 0.86), () => {
        const growth = 0.34 + 0.66 * ease(0.13, 0.425, t),
          w = (2.69 + clamp(length * 0.23, 0, 0.83)) * growth;
        const x = length * cast + after * 0.39,
          y = -0.055 - 0.26 * Math.sin(Math.PI * cast) - after * 0.16;
        light(c, x - 0.52 * w, y + 0.15 * w, w * 0.54, w * 0.35, '#e7a03d46', '#d68e3900');
        dragonSilk(c, x, y, w, w * (0.68 + 0.045 * Math.sin(Math.PI * cast)), t * 4.16);
      });
    layer(c, windowAt(t, 0.47, 0.55, 0.74, 0.99), () => {
      const boom = ease(0.48, 0.73, t),
        late = ease(0.64, 0.995, t),
        r = 0.25 + 0.77 * boom + 0.24 * late;
      light(c, length, -0.03, r * 0.88, r * 0.7, '#fed27b53', '#e7b04b00');
      for (let i = 0; i < 4; i++) {
        const a = (i * TAU) / 4 - 0.34 + 0.55 * late;
        ruyi(
          c,
          length + Math.cos(a) * r * 0.79,
          Math.sin(a) * r * 0.63,
          0.35 + boom * 0.22,
          a + 0.2,
          '#bc8b51',
          '#ffd88b'
        );
      }
      scattering(
        c,
        length,
        -0.05,
        boom * 0.63 + late * 0.37,
        19,
        1.58,
        ['#ffe1a0', '#d7a85a', '#f5cb7b'],
        0.8
      );
    });
  });
  if (!hasInk()) {
    c.save();
    c.scale(1.48, 1.48);
    dragonInkFallback(c, { ...e, distance: e.distance / 1.48 });
    c.restore();
  }
}

function leaf(c, x, y, angle, size, tint) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(-size, 0.0);
  c.quadraticCurveTo(-size * 0.33, -size * 0.71, size, 0);
  c.quadraticCurveTo(size * 0.27, size * 0.54, -size, 0);
  c.closePath();
  c.fillStyle = tint;
  c.fill();
  line(c, [pt(-size * 0.88, 0.0), pt(size * 0.76, -size * 0.032)], '#e9e7b2', 0.009);
  c.restore();
}

function blossom(c, x, y, size, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  for (let i = 0; i < 5; i++) {
    c.rotate(TAU / 5);
    ellipse(c, size * 0.48, 0, size * 0.52, size * 0.29, '#f2ead6');
  }
  ellipse(c, 0, 0, size * 0.23, size * 0.23, '#c8ad72');
  c.restore();
}

function guqin(c, x, y, size) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.16);
  c.scale(size, size);
  c.beginPath();
  c.moveTo(-0.39, -0.065);
  c.quadraticCurveTo(-0.29, -0.145, -0.22, -0.088);
  c.quadraticCurveTo(-0.07, -0.049, 0.28, -0.07);
  c.quadraticCurveTo(0.39, -0.095, 0.406, -0.041);
  c.quadraticCurveTo(0.45, 0.018, 0.386, 0.054);
  c.quadraticCurveTo(0.13, 0.058, -0.18, 0.071);
  c.quadraticCurveTo(-0.285, 0.144, -0.377, 0.086);
  c.quadraticCurveTo(-0.415, 0.04, -0.39, -0.065);
  c.closePath();
  c.fillStyle = '#315e55';
  c.fill();
  c.strokeStyle = '#b8d2ac';
  c.lineWidth = 0.015;
  c.stroke();
  for (let i = 0; i < 7; i++) {
    const h = (i - 3) * 0.014;
    line(c, [pt(-0.29, h * 1.3), pt(0.34, h * 0.66)], i % 2 ? '#b0c8ad' : '#e5dcb7', 0.007);
  }
  line(c, [pt(-0.285, -0.071), pt(-0.285, 0.069)], '#d5ba87', 0.024);
  c.restore();
}

function lotusPetal(c, x, y, angle, length, width, fill, rim) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(-width, -length * 0.2, -width * 0.75, -length * 0.57, 0, -length);
  c.bezierCurveTo(width * 0.49, -length * 0.66, width * 1.04, -length * 0.2, 0, 0);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = rim;
  c.lineWidth = 0.012;
  c.stroke();
  curveLine(
    c,
    rim,
    0.008,
    [0, -length * 0.05],
    [[width * 0.08, -length * 0.37, -width * 0.12, -length * 0.64, 0, -length * 0.92]]
  );
  c.restore();
}

function openLotus(c, x, y, width, opening) {
  const h = width * (0.56 + 0.27 * (1 - opening));
  if (stamp(c, 'lotus', x, y, width, h, 0.5, 0.84)) return;
  c.save();
  c.translate(x, y);
  c.scale(width / 1.6, h / 0.86);
  for (let tier = 0; tier < 2; tier++)
    for (let i = 0; i < 7; i++) {
      const side = (i - 3) / 3,
        ang = side * (0.4 + opening * 0.76),
        len = (tier ? 0.55 : 0.79) * (1 - 0.18 * Math.abs(side));
      lotusPetal(
        c,
        side * 0.14,
        tier * 0.04,
        ang,
        len,
        tier ? 0.23 : 0.21,
        tier ? '#c2e1cc' : '#86b8ac',
        '#eee3b4'
      );
    }
  ellipse(c, 0, -0.15, 0.16, 0.068, '#d5b465');
  c.restore();
}

function healingSong(c, e) {
  const t = e.t,
    target = e.to,
    floor = e.ground;
  layer(c, windowAt(t, 0.014, 0.14, 0.3, 0.53), () => {
    const open = ease(0.028, 0.25, t);
    light(c, 0.02, -0.14, 0.84, 0.49, '#89d3af6e', '#71b6a100');
    guqin(c, 0.02, -0.035, 1.23);
    for (let i = 0; i < 4; i++)
      sweep(
        c,
        0.02,
        -0.02,
        0.31 + 0.145 * i,
        0.14 + 0.073 * i,
        3.26 + 0.4 * open,
        6.1 + 0.16 * open,
        i % 2 ? '#b9ddbb' : '#92c6b0',
        0.023
      );
  });
  if (e.distance > 0.18)
    along(c, e, (length) => {
      const head = ease(0.145, 0.5, t),
        tail = ease(0.37, 0.78, t);
      layer(c, windowAt(t, 0.1, 0.25, 0.55, 0.79), () => {
        for (let i = 0; i < 7; i++) {
          const band = i - 3;
          const curve = (v) =>
            pt(
              length * v,
              -0.31 * Math.sin(Math.PI * v) +
                band * 0.056 +
                0.24 * Math.sin(v * TAU * 1.12 + t * 2 + band * 0.13)
            );
          const points = sample(curve, Math.min(tail, head), head, 24);
          brush(c, points, (u) => 0.02 * Math.sin(Math.PI * u), i % 2 ? '#a4d9c4' : '#e1dbad');
          if (i % 3 === 0) {
            const q = curve(head);
            blossom(c, q.x, q.y, 0.057, head * 2 + i);
          }
        }
      });
    });
  layer(c, windowAt(t, 0.17, 0.35, 0.8, 0.995), () => {
    const open = ease(0.235, 0.536, t),
      after = ease(0.6, 0.95, t),
      rx = 0.55 + open * 0.61 + after * 0.2;
    light(c, floor.x, floor.y, rx * 1.18, rx * 0.45, '#92d7ac69', '#6ba99500');
    c.save();
    c.translate(floor.x, floor.y);
    c.scale(1, 0.39);
    for (let i = 0; i < 10; i++) {
      const angle = (i * TAU) / 10 + after * 0.16;
      lotusPetal(
        c,
        Math.sin(angle) * 0.12,
        -Math.cos(angle) * 0.12,
        angle,
        rx * (i % 2 ? 0.87 : 1.06),
        rx * 0.25,
        '#79bba377',
        '#c0d8b79e'
      );
    }
    c.restore();
    for (let i = 0; i < 3; i++) {
      const age = ease(0.26 + i * 0.059, 0.78 + i * 0.051, t),
        ring = 0.35 + age * (0.99 + i * 0.12);
      sweep(
        c,
        floor.x,
        floor.y + 0.028 * i,
        ring,
        ring * 0.3,
        -2.94 + i * 0.36,
        2.92 + i * 0.23,
        i % 2 ? '#d3e6c1' : '#8dccb6',
        0.026 * (1 - 0.35 * age)
      );
    }
    const top = pt(target.x, target.y - 0.37 - open * 0.39 - after * 0.28),
      wide = 0.49 + open * 1.18 - after * 0.22;
    light(c, top.x, top.y - 0.24, wide * 0.68, wide * 0.49, '#d3efe292', '#8ebdb000');
    for (let i = 0; i < 7; i++) {
      const band = (i - 3) / 3;
      const stream = (v) =>
        pt(
          mix(top.x, floor.x, v) +
            band * (0.23 + 0.51 * Math.sin(Math.PI * v)) +
            0.074 * Math.sin(TAU * v + i * 0.43 + after * 0.84),
          mix(top.y - 0.035, floor.y - 0.05, v)
        );
      const points = sample(stream, 0, 1, 23);
      brush(c, points, (u) => 0.019 * Math.sin(Math.PI * u), i % 2 ? '#b8e1c778' : '#eae0b990');
      const bead = stream(0.18 + ((i * 0.127 + after * 0.35) % 0.7));
      ellipse(c, bead.x, bead.y, 0.02, 0.031, '#d7e9c6');
    }
    openLotus(c, top.x, top.y, wide, open);
    for (let i = 0; i < 13; i++) {
      const u = i / 13,
        angle = TAU * u + open * 0.49 + after * 0.7,
        orbit = 0.41 + open * 0.32 + after * 0.31;
      const x = target.x + Math.cos(angle) * orbit,
        y = mix(floor.y, top.y - 0.14, 0.07 + 0.88 * u) + Math.sin(angle) * 0.22 - after * 0.18;
      if (i % 3 === 0) blossom(c, x, y, 0.078 + (i % 2) * 0.025, angle);
      else leaf(c, x, y, angle - 0.65, 0.09 + (i % 2) * 0.037, i % 2 ? '#77b59b' : '#c0d6ae');
    }
  });
}

function stone(c, x, y, angle, size) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(size, size);
  const a = pt(-0.78, -0.12),
    b = pt(-0.22, -0.68),
    d = pt(0.9, -0.27),
    f = pt(0.64, 0.48),
    g = pt(-0.26, 0.58),
    mid = pt(0.16, 0.03);
  fillShape(c, [a, b, d, mid], '#bd9d73');
  fillShape(c, [a, mid, f, g], '#806b53');
  fillShape(c, [d, f, mid], '#a98b67');
  line(c, [a, b, d], '#d6be89', 0.085);
  c.restore();
}

function earthSpiral(c, x, y, phase, radius) {
  for (let j = 0; j < 3; j++) {
    const curve = (u) => {
      const a = (j * TAU) / 3 + phase + u * 4.4,
        r = radius * (1 - 0.93 * u);
      return pt(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.39);
    };
    const points = sample(curve, 0, 1, 23);
    brush(c, points, (u) => 0.064 * Math.sin(Math.PI * u), '#544a3c');
    brush(c, points, (u) => 0.027 * Math.sin(Math.PI * u), j === 0 ? '#d8b67c' : '#b69a6e');
  }
}

function basalt(c, x, y, height, width, direction, painted) {
  c.save();
  c.translate(x, y);
  c.scale(direction, 1);
  if (!(painted && stamp(c, 'spire', 0, 0, width, height, 0.5, 0.99))) {
    const root = pt(-width * 0.48, 0),
      shoulder = pt(-width * 0.36, -height * 0.49),
      peak = pt(width * 0.15, -height),
      knee = pt(width * 0.16, -height * 0.34),
      right = pt(width * 0.49, -height * 0.02),
      ridge = pt(width * 0.01, -height * 0.39);
    fillShape(c, [root, shoulder, peak, ridge], '#62584e');
    fillShape(c, [ridge, peak, knee, right], '#8c7660');
    fillShape(c, [root, ridge, right, pt(-width * 0.11, height * 0.06)], '#423e38');
    line(c, [shoulder, peak, ridge, pt(-width * 0.06, -height * 0.12)], '#e4b46f', 0.025);
    line(
      c,
      [pt(-width * 0.29, -height * 0.25), pt(-width * 0.06, -height * 0.3), ridge],
      '#9e8b71',
      0.015
    );
  }
  c.restore();
}

function earthArt(c, e) {
  const t = e.t,
    foot = e.ground,
    source = pt(foot.x - e.to.x, foot.y - e.to.y);
  const travel = ease(0.1, 0.505, t),
    mouth = ease(0.27, 0.57, t),
    sink = ease(0.54, 0.85, t),
    late = ease(0.7, 0.985, t);
  layer(c, windowAt(t, 0.02, 0.17, 0.39, 0.64), () => {
    const r = 0.26 + 0.43 * ease(0.04, 0.32, t);
    earthSpiral(c, source.x, source.y, t * 2.1, r);
    light(c, source.x, source.y, r * 1.2, r * 0.41, '#d3b16f55', '#785d3d00');
  });
  layer(c, windowAt(t, 0.08, 0.23, 0.65, 0.94), () => {
    const normal = pt(-e.uy, e.ux),
      length = e.distance;
    const mark = (k) => {
      const u = k / 12,
        bend = k === 0 || k === 12 ? 0 : Math.sin(k * 5.28) * 0.15;
      return pt(
        source.x + e.ux * length * u + normal.x * bend,
        source.y + e.uy * length * u + normal.y * bend * 0.65
      );
    };
    const crack = (u) => {
      const n = Math.min(11, Math.floor(u * 12)),
        f = u * 12 - n,
        a = mark(n),
        b = mark(n + 1);
      return pt(mix(a.x, b.x, f), mix(a.y, b.y, f));
    };
    const points = sample(crack, 0, travel, 28);
    line(c, points, '#3f3834', 0.084);
    line(c, points, '#b78e59', 0.035);
    line(c, points, '#f4c575', 0.012);
    for (let k = 2; k < 12 * travel; k += 2) {
      const a = mark(k),
        s = k % 4 ? 1 : -1;
      line(
        c,
        [
          a,
          pt(a.x + normal.x * 0.25 * s, a.y + normal.y * 0.17 * s),
          pt(a.x + normal.x * 0.34 * s + e.ux * 0.16, a.y + normal.y * 0.3 * s + e.uy * 0.13)
        ],
        '#867454',
        0.022
      );
    }
  });
  layer(c, windowAt(t, 0.15, 0.35, 0.84, 0.998), () => {
    const radius = 0.43 + mouth * 0.83 - late * 0.17;
    light(c, foot.x, foot.y, radius * 1.49, radius * 0.63, '#4e443bd4', '#71573900');
    ellipse(c, foot.x, foot.y, radius * 0.8, radius * 0.32, '#302e2bcc');
    for (let i = 0; i < 12; i++) {
      const a = (TAU * i) / 12 + 0.08 * Math.sin(i * 4.1),
        d = radius * (1.16 + 0.19 * (i % 3));
      const polar = (r, off) =>
        pt(foot.x + Math.cos(a + off) * r, foot.y + Math.sin(a + off) * r * 0.42);
      const b = polar(d * 0.39, 0),
        k = polar(d * 0.69, 0.09),
        m = polar(d * 0.86, -0.045),
        tip = polar(d * 1.04, 0.067);
      line(c, [b, k, m, tip], '#3a3833', 0.056);
      line(c, [k, m, tip], '#d4ab6a', 0.018);
      line(c, [m, polar(d * 0.97, 0.165), polar(d * 1.03, 0.21)], '#786548', 0.026);
      const p = polar(radius * 0.53, 0.025),
        q = polar(radius * 0.91, 0.08),
        v = polar(radius * (0.84 + 0.06 * (i % 2)), 0.38),
        w = polar(radius * 0.47, 0.35);
      const lift = (0.085 + 0.07 * (i % 3)) * Math.sin(Math.PI * clamp((t - 0.28) / 0.61));
      const upper = [p, q, v, w].map((n, j) =>
        pt(n.x, n.y - lift * (j === 0 || j === 3 ? 0.31 : 1))
      );
      fillShape(c, [upper[0], upper[1], q, p], '#51483e');
      fillShape(c, [upper[1], upper[2], v, q], '#67594a');
      fillShape(c, upper, ['#756854', '#89775a', '#706653'][i % 3]);
      line(c, [upper[1], upper[2], upper[3]], i % 3 ? '#ad9168' : '#d0ac71', 0.018);
    }
    earthSpiral(c, foot.x, foot.y, 0.38 + sink * 2.69, radius * 0.72);
    const peaks = [];
    for (let i = 0; i < 8; i++) {
      const a = (TAU * i) / 8 + 0.18,
        orbit = (0.72 + (i % 2) * 0.22) * radius,
        z = Math.sin(a);
      peaks.push({ i, z, x: foot.x + Math.cos(a) * orbit, y: foot.y + z * orbit * 0.39 });
    }
    peaks.sort((a, b) => a.z - b.z);
    for (const p of peaks) {
      const i = p.i,
        start = 0.24 + (i % 3) * 0.019;
      const lift =
        ease(start, 0.52 + (i % 3) * 0.018, t) *
        (1 - ease(0.63 + (i % 3) * 0.018, 0.9 + (i % 2) * 0.018, t));
      if (lift > 0.012) {
        const h = (0.66 + 0.33 * ((i * 5) % 4)) * (p.z > 0.3 ? 0.73 : 1) * lift,
          w = (0.33 + 0.13 * (i % 3)) * (0.48 + 0.52 * lift);
        ellipse(c, p.x, p.y, w * 0.66, w * 0.21, '#3e362e8c');
        layer(c, p.z < -0.35 ? 0.78 : 0.98, () =>
          basalt(c, p.x, p.y, h, w, i % 2 ? 1 : -1, i % 3 !== 1)
        );
      }
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * TAU) / 12 + 0.21 * Math.sin(4.7 * i) + sink * 1.15;
      const rr = (0.78 + 0.18 * (i % 3)) * (1 - 0.84 * sink),
        rise = (0.33 + 0.14 * (i % 4)) * Math.sin(Math.PI * ease(0.22, 0.86, t));
      const x = foot.x + Math.cos(a) * rr,
        y = foot.y + Math.sin(a) * rr * 0.42;
      const sz = (0.116 + 0.032 * (i % 3)) * (1 - 0.63 * sink);
      ellipse(c, x, y, sz * 0.77, sz * 0.23, '#55463351');
      stone(c, x, y - rise, a + sink * 0.94, sz);
    }
    for (let j = 0; j < 3; j++) {
      const stream = (v) => {
        const a = (j * TAU) / 3 + v * TAU * 1.18 + sink * 2.55,
          r = (0.16 + 0.28 * Math.sin(Math.PI * v)) * (1 - 0.77 * v);
        return pt(
          mix(e.to.x, foot.x, v) + Math.cos(a) * r,
          mix(e.to.y - 0.16, foot.y, v) + Math.sin(a) * r * 0.43
        );
      };
      brush(
        c,
        sample(stream, 0, 1, 24),
        (u) => 0.028 * Math.sin(Math.PI * u),
        j === 1 ? '#e0b46c9c' : '#b78c5575'
      );
    }
    for (let i = 0; i < 7; i++) {
      const a = i * 2.39 + 0.32,
        r = (0.7 + late * 0.67) * (i % 2 ? 0.91 : 1.12),
        x = foot.x + Math.cos(a) * r,
        y = foot.y + Math.sin(a) * r * 0.38 - 0.12 * late;
      light(c, x, y, 0.21 + 0.13 * late, 0.088 + 0.057 * late, '#c9a77a49', '#a17c4c00');
    }
  });
}

function reducedEmblem(c, id, e) {
  const position = id === 'guard' ? e.ground : e.to;
  c.save();
  c.translate(position.x, position.y - (id === 'guard' ? 0 : 0.16));
  c.globalAlpha *= 0.84;
  if (id === 'guo') {
    c.scale(e.side * 0.68, 0.68);
    sweep(c, -0.15, 0.02, 0.34, 0.25, -1.6, 3.07, '#d8ac5c', 0.056);
    dragonHead(c);
  } else if (id === 'hero') {
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.5 + (i - 4) * 0.205;
      blade(
        c,
        Math.cos(a) * 0.4,
        Math.sin(a) * 0.4,
        a,
        0.215,
        0.019,
        i % 2 ? '#d4e2dd' : '#eee5d2'
      );
    }
  } else if (id === 'xiao') {
    sweep(c, 0, 0, 0.35, 0.33, 0.22, 3.91, '#c2b6cb', 0.021);
    blade(c, 0.263, -0.258, -0.81, 0.58, 0.029, '#dbebeb');
    blade(c, -0.24, -0.26, -2.33, 0.56, 0.027, '#ecdae4');
  } else if (id === 'duan') {
    for (let i = 0; i < 6; i++) {
      const a = -2.25 + i * 0.26,
        tip = pt(Math.cos(a) * 0.44, Math.sin(a) * 0.44);
      line(c, [pt(Math.cos(a) * 0.09, 0.08 + Math.sin(a) * 0.09), tip], RAY_COLORS[i], 0.023);
      fragment(c, tip.x, tip.y, a, 0.062, RAY_COLORS[i]);
    }
  } else if (id === 'medic') {
    sweep(c, 0, 0.12, 0.38, 0.12, 0.04, 5.85, '#96cbb3', 0.022);
    guqin(c, 0, 0, 0.72);
    blossom(c, -0.215, -0.135, 0.094, 0.22);
    leaf(c, 0.22, -0.11, -0.55, 0.1, '#9bbda1');
  } else {
    earthSpiral(c, 0, 0, 0.72, 0.52);
    stone(c, -0.34, -0.14, -0.2, 0.1);
    stone(c, 0.29, 0.08, 0.5, 0.07);
  }
  c.restore();
}

const ARTS = {
  hero: silverFan,
  medic: healingSong,
  guard: earthArt,
  guo: dragonPalm,
  xiao: twinBlades,
  duan: sixRays
};

function paintSkillEffect(
  ctx,
  { id, progress, from, to, ground, scale, reduced, facing } = {}
) {
  const draw = ARTS[id];
  if (!Object.hasOwn(ARTS, id) || !Number.isFinite(progress) || !from || !to) return;
  const t = clamp(progress);
  if (t === 0 || t === 1) return;
  const projected = Number.isFinite(scale) && scale > 0 ? scale : 40;
  // Distant pieces still receive a legible emblem. Origin, impact and feet remain
  // registered to the real camera because the offsets below use the same unit.
  const pixels = Math.max(projected, Math.min(27, projected * 1.28));
  const dx = (to.x - from.x) / pixels,
    dy = (to.y - from.y) / pixels,
    distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance)) return;
  const direction = facing < 0 ? -1 : 1,
    ux = distance > 0.015 ? dx / distance : direction,
    uy = distance > 0.015 ? dy / distance : 0;
  const floor =
    ground && Number.isFinite(ground.x) && Number.isFinite(ground.y)
      ? pt((ground.x - from.x) / pixels, (ground.y - from.y) / pixels)
      : pt(dx, dy + 0.65);
  const e = {
    t,
    distance,
    ux,
    uy,
    side: Math.abs(ux) > 0.12 ? (ux < 0 ? -1 : 1) : direction,
    to: pt(dx, dy),
    ground: floor
  };
  ctx.save();
  ctx.translate(from.x, from.y);
  ctx.scale(pixels, pixels);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha *= windowAt(t, 0, 0.095, 0.9, 1);
  if (reduced) reducedEmblem(ctx, id, e);
  else draw(ctx, e);
  ctx.restore();
}

// Embedded alpha atlas: gold dragon, jian, lotus and basalt.
if (inkSheet)
  inkSheet.src =
    'data:image/webp;base64,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';

export { paintSkillEffect };
