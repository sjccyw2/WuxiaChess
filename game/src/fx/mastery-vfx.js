// Foot positions are projected screen pixels. Distances below are world-tile units.
const TURN = Math.PI * 2;
const ink = '#202822';
const ease = (lo, hi, t) => {
  const u = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
  return u * u * (3 - 2 * u);
};
const envelope = (a, b, c, d, t) => ease(a, b, t) * (1 - ease(c, d, t));

function dot(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TURN);
  ctx.fillStyle = color;
  ctx.fill();
}

function outline(ctx, color, width, edge = ink) {
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width + 0.024;
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function pigment(ctx, fill, rim, width = 0.015) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (rim) outline(ctx, rim, width, null);
}

function arc(ctx, x, y, rx, ry, start, end, color, width, edge = null) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, start, end);
  outline(ctx, color, width, edge);
}

function stroke(ctx, x1, y1, x2, y2, color, width, edge = null) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  outline(ctx, color, width, edge);
}

// A cubic with a light entry, a full brush belly and a lifted tip.
function brush(ctx, x0, y0, x1, y1, x2, y2, x3, y3, width, color) {
  const back = [];
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const t = i / 16,
      u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    const dx = u * u * (x1 - x0) + 2 * u * t * (x2 - x1) + t * t * (x3 - x2);
    const dy = u * u * (y1 - y0) + 2 * u * t * (y2 - y1) + t * t * (y3 - y2);
    const radius = (width * Math.sin(Math.PI * Math.pow(t, 0.83))) / (Math.hypot(dx, dy) || 1);
    const left = x - dy * radius,
      top = y + dx * radius;
    if (i === 0) ctx.moveTo(left, top);
    else ctx.lineTo(left, top);
    back.push([x + dy * radius, y - dx * radius]);
  }
  for (let i = back.length - 1; i >= 0; i--) ctx.lineTo(back[i][0], back[i][1]);
  ctx.closePath();
  pigment(ctx, color);
}

function glint(ctx, x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.09, y - size * 0.09, x + size * 0.65, y);
  ctx.quadraticCurveTo(x + size * 0.09, y + size * 0.1, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.09, y + size * 0.1, x - size * 0.65, y);
  ctx.quadraticCurveTo(x - size * 0.09, y - size * 0.1, x, y - size);
  ctx.closePath();
  pigment(ctx, color);
}

function wash(ctx, x, y, rx, ry, center, edge) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, center);
  gradient.addColorStop(1, edge);
  dot(ctx, 0, 0, 1, 1, gradient);
  ctx.restore();
}

function sealRing(ctx, x, y, radius, turn, a, quiet) {
  if (a < 0.01 || radius < 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radius, radius * 0.43);
  ctx.globalAlpha *= a;
  wash(ctx, 0, 0, 1.14, 1.14, '#7fdac334', '#6fdabe00');
  arc(ctx, 0, 0, 1, 1, turn + 0.07, turn + Math.PI * 1.42, '#c2f8de', 0.044, '#244e54');
  arc(ctx, 0, 0, 1, 1, turn + Math.PI * 1.51, turn + TURN - 0.12, '#9caad4', 0.044, '#244e54');
  arc(ctx, 0, 0, 0.78, 0.78, -turn + 0.2, -turn + 5.73, '#d5ca9d', 0.025, '#344944');
  // Broken and whole lines occupy each compass station on the dial.
  const count = quiet ? 4 : 8;
  for (let i = 0; i < count; i++) {
    const a = (i * TURN) / count + turn;
    ctx.save();
    ctx.rotate(a);
    stroke(ctx, 0.82, -0.089, 0.82, 0.089, '#f1deb0', 0.032);
    stroke(ctx, 0.89, -0.087, 0.89, -0.018, '#d7e8bc', 0.032);
    stroke(ctx, 0.89, 0.018, 0.89, 0.087, '#d7e8bc', 0.032);
    ctx.restore();
  }
  ctx.restore();
}

function footprint(ctx, x, y, bearing, side, alpha) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(bearing);
  ctx.scale(0.87, side * 0.79);
  ctx.beginPath();
  ctx.moveTo(-0.09, -0.044);
  ctx.bezierCurveTo(-0.009, -0.037, 0.07, -0.09, 0.17, -0.052);
  ctx.bezierCurveTo(0.22, 0.002, 0.155, 0.052, 0.088, 0.057);
  ctx.quadraticCurveTo(0.015, 0.058, -0.07, 0.026);
  ctx.closePath();
  pigment(ctx, '#b9f2da', '#395a62', 0.023);
  stroke(ctx, 0.063, -0.044, 0.042, 0.034, '#639a96', 0.022);
  dot(ctx, -0.126, -0.01, 0.041, 0.041, '#ded0e5');
  ctx.restore();
}

function blink(ctx, e) {
  const { dx, dy, t, quiet } = e;
  const departure = 1 - 0.5 * ease(0.31, 0.78, t);
  const arrival = ease(0.2, 0.53, t);
  sealRing(ctx, 0, 0, 0.71 - 0.2 * ease(0.3, 0.8, t), t * 0.56, departure, quiet);
  if (e.distance > 0.16) {
    const n = quiet ? 3 : Math.max(3, Math.min(9, Math.round(e.distance * 1.62)));
    const bearing = Math.atan2(dy, dx),
      ux = dx / e.distance,
      uy = dy / e.distance;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.67) / (n + 0.34),
        side = i % 2 ? -1 : 1;
      const mark = quiet
        ? 0.57
        : envelope(0.07 + u * 0.38, 0.17 + u * 0.38, 0.41 + u * 0.42, 0.65 + u * 0.34, t);
      if (mark < 0.01) continue;
      footprint(
        ctx,
        dx * u - uy * side * 0.11,
        dy * u + ux * side * 0.075 - 0.035,
        bearing,
        side,
        mark
      );
    }
  }
  sealRing(
    ctx,
    dx,
    dy,
    (e.distance < 0.16 ? 0.86 : 0.49) + 0.29 * arrival,
    -0.42 - t * 0.52,
    arrival,
    quiet
  );
  if (!quiet) {
    const lift = ease(0.39, 0.88, t);
    ctx.save();
    ctx.globalAlpha *= arrival * (1 - ease(0.82, 1, t));
    for (const side of [-1, 1]) {
      const x = dx + side * 0.46;
      brush(
        ctx,
        x + side * 0.1,
        dy + 0.03,
        x - side * 0.34,
        dy - 0.21,
        x + side * 0.27,
        dy - 0.48 * lift,
        x + side * 0.06,
        dy - 0.62 * lift,
        0.028,
        '#bdeddd'
      );
      glint(ctx, x + side * 0.07, dy - 0.2 - 0.46 * lift, 0.069, '#fff1c4');
    }
    ctx.restore();
  }
}

function poison(ctx, e) {
  const { t, quiet } = e;
  const bloom = ease(0.09, 0.6, t);
  const pool = 0.47 + 0.26 * bloom;
  wash(ctx, 0, -0.045, pool * 1.26, pool * 0.42, '#25172cbb', '#677e4200');
  arc(
    ctx,
    0,
    -0.035,
    pool,
    pool * 0.31,
    0.23 + t * 0.48,
    5.76 + t * 0.48,
    '#9cae59',
    0.026,
    '#383345'
  );
  const lift = 0.35 + 0.84 * bloom;
  // The curved green body coils once around the target, then lifts its ink-dark head.
  brush(ctx, -0.51, -0.055, 0.76, -0.15, 0.57, -0.42 * lift, -0.11, -0.67 * lift, 0.054, '#34263e');
  brush(ctx, -0.48, -0.06, 0.72, -0.17, 0.51, -0.42 * lift, -0.11, -0.67 * lift, 0.032, '#bfd683');
  brush(
    ctx,
    -0.1,
    -0.66 * lift,
    -0.6,
    -0.81 * lift,
    -0.37,
    -1.0 * lift,
    -0.18,
    -0.99 * lift,
    0.042,
    '#88749b'
  );
  ctx.save();
  ctx.translate(-0.19, -0.985 * lift);
  ctx.beginPath();
  ctx.moveTo(-0.11, 0.045);
  ctx.quadraticCurveTo(-0.03, -0.095, 0.16, -0.046);
  ctx.quadraticCurveTo(0.11, 0.027, 0.022, 0.041);
  ctx.closePath();
  pigment(ctx, '#8cae5b', '#372c40', 0.024);
  dot(ctx, 0.066, -0.037, 0.017, 0.014, '#fff0a1');
  ctx.restore();
  const count = quiet ? 3 : 8;
  for (let i = 0; i < count; i++) {
    const a = i * 2.399 + 0.38,
      path = (t * 0.7 + i * 0.211) % 1;
    const x = Math.cos(a) * (0.35 + 0.17 * path),
      y = -0.07 - 0.92 * path + 0.08 * Math.sin(a);
    const r = 0.033 + 0.014 * (i % 3);
    ctx.save();
    ctx.globalAlpha *= 0.3 + 0.7 * Math.sin(Math.PI * path);
    dot(ctx, x, y, r * 0.92, r * 1.15, '#43384d');
    dot(ctx, x - r * 0.1, y - r * 0.12, r * 0.64, r * 0.8, i % 3 === 0 ? '#ae90bb' : '#c3dc88');
    ctx.restore();
  }
}

function rally(ctx, e) {
  const { t, side, quiet } = e;
  const rise = ease(0.04, 0.5, t),
    wind = quiet ? 0.09 : 0.11 * Math.sin(5.4 * t + 0.34);
  const poleX = side * 0.43,
    top = -0.69 - 0.7 * rise;
  arc(
    ctx,
    0,
    -0.04,
    0.42 + 0.38 * rise,
    0.14 + 0.11 * rise,
    0.06,
    3.06,
    '#f4c979',
    0.031,
    '#64422c'
  );
  ctx.save();
  ctx.translate(poleX, top);
  ctx.scale(side, 1);
  stroke(ctx, 0.045, -0.07, -0.1, -top - 0.06, '#d8a856', 0.047, '#513626');
  glint(ctx, 0.055, -0.085, 0.095, '#ffe2a3');
  const length = 0.47 + 0.44 * rise;
  ctx.beginPath();
  ctx.moveTo(0.04, 0.042);
  ctx.bezierCurveTo(0.27, -0.066, 0.48, 0.079 + wind, length, -0.004 + wind);
  ctx.lineTo(length - 0.22, 0.158 + wind);
  ctx.lineTo(length + 0.018, 0.267 + wind);
  ctx.bezierCurveTo(0.61, 0.338 + wind, 0.39, 0.259, 0.009, 0.365);
  ctx.closePath();
  pigment(ctx, '#a83e36', '#f1c87f', 0.025);
  brush(ctx, 0.08, 0.3, 0.31, 0.202, 0.48, 0.284, length - 0.055, 0.256 + wind, 0.014, '#e79059');
  ctx.beginPath();
  ctx.moveTo(0.12, 0.219);
  ctx.lineTo(0.2, 0.151);
  ctx.lineTo(0.243, 0.185);
  ctx.lineTo(0.325, 0.084);
  ctx.lineTo(0.378, 0.167);
  ctx.lineTo(0.427, 0.135);
  outline(ctx, '#ffdf92', 0.023, '#7a4538');
  ctx.restore();
  if (!quiet)
    for (let i = 0; i < 5; i++) {
      const u = (i * 0.23 + t * 0.72) % 1,
        a = i * 2.399;
      glint(
        ctx,
        Math.cos(a) * (0.33 + 0.27 * u),
        -0.15 - u * 1.18,
        0.046 * (0.6 + Math.sin(Math.PI * u)),
        '#f7d390'
      );
    }
}

function shield(ctx, e) {
  const { t, quiet } = e,
    raised = ease(0.02, 0.44, t),
    settle = ease(0.42, 0.78, t);
  const w = 0.46 + 0.24 * raised,
    h = 0.52 + 1.0 * raised;
  ctx.save();
  ctx.scale(w, h);
  ctx.beginPath();
  ctx.moveTo(-1.01, -0.095);
  ctx.bezierCurveTo(-0.79, -0.34, -0.8, -0.69, -0.53, -0.86);
  ctx.quadraticCurveTo(-0.33, -0.984, 0, -1.0);
  ctx.quadraticCurveTo(0.36, -0.982, 0.54, -0.86);
  ctx.bezierCurveTo(0.8, -0.68, 0.8, -0.35, 1.01, -0.095);
  ctx.quadraticCurveTo(0.56, 0.057, 0.14, -0.012);
  ctx.quadraticCurveTo(0.0, -0.08, -0.15, -0.012);
  ctx.quadraticCurveTo(-0.57, 0.055, -1.01, -0.095);
  ctx.closePath();
  const metal = ctx.createLinearGradient(-1, -0.6, 1, -0.6);
  metal.addColorStop(0, '#5a8e885e');
  metal.addColorStop(0.24, '#9ad9bc20');
  metal.addColorStop(0.63, '#d3cb8b12');
  metal.addColorStop(1, '#6d9b8560');
  pigment(ctx, metal);
  outline(ctx, '#dfd19b', 0.023, '#37554c');
  for (const s of [-1, 1]) {
    brush(
      ctx,
      s * 0.16,
      -0.978,
      s * 0.49,
      -0.75,
      s * 0.41,
      -0.27,
      s * 0.62,
      -0.046,
      0.018,
      '#87c6af'
    );
    for (let i = 0; i < 3; i++)
      dot(ctx, s * (0.59 + 0.035 * i), -0.58 + 0.1 * i, 0.031, 0.017, '#c5d69d');
  }
  ctx.restore();
  arc(ctx, 0, -h - 0.043, 0.095, 0.062, Math.PI, TURN, '#e7ca83', 0.029, '#39574e');
  arc(ctx, 0, -0.048, w * 1.03, 0.145 + 0.043 * settle, 0.11, 3.08, '#a2e2c6', 0.039, '#344d43');
  if (!quiet) {
    const ring = 0.39 + 0.58 * settle;
    arc(ctx, 0, 0.0, ring, ring * 0.27, 0.24, 2.81, '#d4c890', 0.02, '#52645a');
    glint(ctx, -w * 0.62, -h * 0.77, 0.09, '#f0f4c8');
  }
}

function bindingSlip(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(-0.092, -0.28);
  ctx.lineTo(0.09, -0.28);
  ctx.lineTo(0.09, 0.18);
  ctx.lineTo(0.031, 0.242);
  ctx.lineTo(0.008, 0.191);
  ctx.lineTo(-0.088, 0.269);
  ctx.closePath();
  pigment(ctx, '#716072', '#ddbed3', 0.019);
  stroke(ctx, -0.057, -0.199, 0.055, -0.199, '#f2cf9e', 0.019);
  stroke(ctx, -0.057, -0.143, 0.055, -0.143, '#bba0b7', 0.014);
  ctx.beginPath();
  ctx.moveTo(0, -0.091);
  ctx.lineTo(0.049, -0.04);
  ctx.lineTo(0, 0.015);
  ctx.lineTo(-0.045, -0.036);
  ctx.closePath();
  outline(ctx, '#efcfaf', 0.016, null);
  stroke(ctx, 0, 0.013, 0, 0.132, '#efcfaf', 0.018);
  ctx.restore();
}

function debuff(ctx, e) {
  const { t, quiet } = e,
    drop = ease(0.04, 0.66, t),
    shrink = 1 - 0.2 * ease(0.46, 0.85, t);
  const y = -1.14 + 0.53 * drop,
    w = 0.69 * shrink;
  // A near-side set of individually turned links fastens two lowering paper wards.
  arc(ctx, 0, y, w, 0.155, Math.PI, TURN, '#b6a1bf', 0.028, '#443347');
  const count = quiet ? 6 : 11;
  for (let i = 0; i < count; i++) {
    const a = 0.1 + ((Math.PI - 0.2) * i) / (count - 1),
      x = Math.cos(a) * w,
      yy = y + 0.155 * Math.sin(a);
    ctx.save();
    ctx.translate(x, yy);
    ctx.rotate(-0.25 * Math.cos(a));
    arc(
      ctx,
      0,
      0,
      i % 2 ? 0.042 : 0.06,
      i % 2 ? 0.021 : 0.033,
      0,
      TURN,
      i % 2 ? '#c59dba' : '#e2c4d0',
      0.021,
      '#3e3040'
    );
    ctx.restore();
  }
  bindingSlip(ctx, -w * 0.88, y + 0.24, 0.2 - 0.08 * drop, 0.84);
  bindingSlip(ctx, w * 0.6, y + 0.27, -0.16 + 0.09 * drop, 1.03);
  if (!quiet) {
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 0.3;
      brush(
        ctx,
        x - 0.025,
        y - 0.26,
        x - 0.08,
        y - 0.12,
        x + 0.055,
        y + 0.13,
        x + 0.03,
        y + 0.26,
        0.015,
        i % 2 ? '#aa829e' : '#d0b4c4'
      );
    }
  }
}

function swallow(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(0.41, -0.045);
  ctx.lineTo(0.29, -0.108);
  ctx.quadraticCurveTo(0.215, -0.151, 0.111, -0.078);
  ctx.quadraticCurveTo(-0.064, -0.23, -0.236, -0.5);
  ctx.quadraticCurveTo(-0.28, -0.24, -0.108, -0.008);
  ctx.lineTo(-0.54, 0.03);
  ctx.lineTo(-0.27, 0.105);
  ctx.lineTo(-0.45, 0.253);
  ctx.quadraticCurveTo(-0.16, 0.207, -0.025, 0.116);
  ctx.quadraticCurveTo(0.031, 0.285, 0.217, 0.351);
  ctx.quadraticCurveTo(0.139, 0.18, 0.101, 0.074);
  ctx.quadraticCurveTo(0.25, 0.061, 0.299, -0.014);
  ctx.closePath();
  pigment(ctx, '#456b75', '#d4f2e7', 0.022);
  brush(ctx, -0.219, -0.421, -0.137, -0.243, 0.021, -0.044, 0.22, -0.049, 0.02, '#a2d4d4');
  dot(ctx, 0.248, -0.075, 0.014, 0.014, '#f6d99a');
  ctx.restore();
}

function haste(ctx, e) {
  const { t, side, quiet } = e,
    rise = ease(0.1, 0.8, t);
  ctx.save();
  ctx.scale(side, 1);
  for (let i = 0; i < 3; i++) {
    const lift = i * 0.09,
      slide = 0.17 * rise;
    brush(
      ctx,
      -1.02 + slide,
      -0.11 - lift,
      -0.51,
      -0.01 - lift,
      0.06,
      0.16 - lift,
      0.55 + 0.08 * i,
      -0.26 - lift - 0.18 * rise,
      0.024 + 0.011 * i,
      '#417378'
    );
    brush(
      ctx,
      -1.02 + slide,
      -0.133 - lift,
      -0.48,
      -0.026 - lift,
      0.1,
      0.128 - lift,
      0.55 + 0.08 * i,
      -0.26 - lift - 0.18 * rise,
      0.014 + 0.006 * i,
      i === 1 ? '#f6e3a7' : '#b9e9e2'
    );
  }
  const x = 0.055 + 0.46 * rise,
    y = -0.5 - 0.57 * rise;
  brush(ctx, -0.56, -0.29, -0.27, -0.41, 0.1, -0.55, x - 0.1, y + 0.06, 0.029, '#95cabe');
  swallow(ctx, x, y, -0.21, 0.81);
  if (!quiet)
    for (let i = 0; i < 4; i++) {
      const u = (0.19 * i + t * 0.67) % 1;
      brush(
        ctx,
        -0.24 - 0.52 * u,
        -0.3 - i * 0.092,
        -0.43 - 0.4 * u,
        -0.32 - i * 0.09,
        -0.53 - 0.4 * u,
        -0.29 - i * 0.095,
        -0.71 - 0.43 * u,
        -0.29 - i * 0.095,
        0.012,
        '#c8ead7'
      );
    }
  ctx.restore();
}

function lotusLamp(ctx, x, y, size, amount) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(0.012, 0.095);
    ctx.bezierCurveTo(0.076, -0.1, 0.25, -0.071, 0.35, -0.171);
    ctx.bezierCurveTo(0.332, 0.014, 0.21, 0.17, 0.016, 0.132);
    ctx.closePath();
    pigment(ctx, '#993f52', '#e9a991', 0.019);
    brush(ctx, 0.033, 0.114, 0.18, 0.032, 0.23, 0.04, 0.307, -0.106, 0.014, '#d67a77');
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(0, 0.094);
  ctx.bezierCurveTo(-0.159, 0.018, -0.102, -0.11, -0.049, -0.201);
  ctx.quadraticCurveTo(0.022, -0.287, 0.021, -0.365 - 0.055 * amount);
  ctx.bezierCurveTo(0.179, -0.188, 0.156, -0.031, 0, 0.094);
  ctx.closePath();
  pigment(ctx, '#f6b47f', '#743c48', 0.018);
  ctx.beginPath();
  ctx.moveTo(0, 0.067);
  ctx.quadraticCurveTo(-0.057, -0.015, 0.022, -0.154);
  ctx.quadraticCurveTo(0.089, -0.016, 0, 0.067);
  ctx.fillStyle = '#fff0bc';
  ctx.fill();
  ctx.restore();
}

function sacrifice(ctx, e) {
  const { dx, dy, t, quiet } = e,
    release = ease(0.14, 0.68, t);
  const sx = 0,
    sy = -0.74,
    tx = dx,
    ty = dy - 0.68;
  if (e.distance > 0.17) {
    const bend = Math.min(0.66, 0.24 + 0.13 * e.distance),
      nx = -dy / e.distance,
      ny = dx / e.distance;
    const midx = dx * 0.5 + nx * bend * 0.38,
      midy = (sy + ty) * 0.5 - bend;
    const cx1 = (sx + midx) * 0.53,
      cy1 = midy - 0.09;
    const cx2 = (midx + tx) * 0.5,
      cy2 = midy + 0.13 * ny;
    brush(ctx, sx, sy, cx1, cy1, cx2, cy2, tx, ty, 0.055, '#883f55');
    brush(ctx, sx, sy, cx1, cy1 - 0.035, cx2, cy2 - 0.035, tx, ty, 0.018, '#f2b0a4');
    if (!quiet) {
      const twist = 0.07 + 0.035 * Math.sin(5.2 * t);
      brush(ctx, sx, sy, cx1, cy1 + twist * 2, cx2, cy2 - twist * 2, tx, ty, 0.013, '#e5a89b');
    }
    const beads = quiet ? 2 : 5;
    for (let i = 0; i < beads; i++) {
      const v = (t * 0.95 + i / beads) % 1,
        u = 1 - v;
      const x = u * u * u * sx + 3 * u * u * v * cx1 + 3 * u * v * v * cx2 + v * v * v * tx;
      const y = u * u * u * sy + 3 * u * u * v * cy1 + 3 * u * v * v * cy2 + v * v * v * ty;
      glint(ctx, x, y, 0.061, i % 2 ? '#ffdda1' : '#ffc7ba');
    }
    lotusLamp(ctx, 0, sy, 0.61 - 0.13 * release, 0.5);
  }
  wash(ctx, tx, ty - 0.13, 0.39, 0.42, '#e69d8852', '#d0777700');
  lotusLamp(ctx, tx, ty, 0.74 + 0.24 * release, release);
  if (!quiet) {
    for (let i = 0; i < 5; i++) {
      const path = (t * 0.62 + i * 0.19) % 1,
        a = 2.4 * i;
      const x = tx + Math.cos(a) * (0.12 + 0.31 * path),
        y = ty - 0.04 - path * 0.64;
      brush(
        ctx,
        x - 0.041,
        y + 0.047,
        x - 0.054,
        y - 0.007,
        x + 0.012,
        y - 0.047,
        x + 0.036,
        y - 0.065,
        0.026,
        i % 2 ? '#e4a29c' : '#b35a68'
      );
    }
  }
}

const marks = { blink, poison, rally, shield, debuff, haste, sacrifice };

function paintMasteryFlourish(ctx, kind, from, to, progress, scale, reduced = false) {
  if (
    !ctx ||
    !Object.hasOwn(marks, kind) ||
    !Number.isFinite(progress) ||
    progress <= 0 ||
    progress >= 1 ||
    !Number.isFinite(scale) ||
    scale <= 0 ||
    !from ||
    !to ||
    ![from.x, from.y, to.x, to.y].every(Number.isFinite)
  )
    return;
  const pixels = Math.max(scale, Math.min(25, scale * 1.25));
  const dx = (to.x - from.x) / pixels,
    dy = (to.y - from.y) / pixels,
    distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance)) return;
  const e = {
    dx,
    dy,
    distance,
    side: dx < -0.06 ? -1 : 1,
    t: reduced ? 0.61 : progress,
    quiet: reduced
  };
  const atSource = kind === 'blink' || kind === 'sacrifice';
  ctx.save();
  try {
    ctx.translate(atSource ? from.x : to.x, atSource ? from.y : to.y);
    ctx.scale(pixels, pixels);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha *= envelope(0, 0.075, 0.87, 1, progress);
    marks[kind](ctx, e);
  } finally {
    ctx.restore();
  }
}

export { paintMasteryFlourish };
