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

// Alpha atlas: gold dragon, jian, lotus and basalt. It used to be embedded here as base64,
// 110 KB of this module that every visit had to download before the title could start.
if (inkSheet) inkSheet.src = new URL('../../assets/skill-ink.webp', import.meta.url).href;

export { paintSkillEffect };
