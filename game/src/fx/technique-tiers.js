// A separate, screen-space layer for the four tiers of techniques. All artwork
// is local to the two fighters and uses the camera's projected size of one tile.
const TAU = Math.PI * 2;
const PI = Math.PI;
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const smooth = (a, b, n) => {
  const u = clamp01((n - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const pulse = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));

// Ink, middle pigment, illuminated edge, and the warm foil picked up at tier four.
const COLOR = {
  weapon: ['#253d43', '#78a5a6', '#e4f8e7', '#efc27b'],
  palm: ['#4c3433', '#ca7545', '#ffdead', '#ffcb72'],
  finger: ['#33394d', '#769dc6', '#e0f1fa', '#edc982'],
  support: ['#254b43', '#78ad84', '#e3efd0', '#efd393'],
  poison: ['#41334a', '#bd99c8', '#ffe6f5', '#dec27a'],
  blink: ['#25474c', '#6db8ae', '#e3fff0', '#efd494'],
  enemy: ['#45272e', '#b96351', '#f8c7a2', '#d9b16d']
};
const DIR = Object.freeze({
  weapon: 'weapon',
  weapons: 'weapon',
  blade: 'weapon',
  blades: 'weapon',
  sword: 'weapon',
  swords: 'weapon',
  chain: 'weapon',
  staff: 'weapon',
  whip: 'weapon',
  hero: 'weapon',
  xiao: 'weapon',
  hu: 'weapon',
  huang: 'weapon',
  palm: 'palm',
  palms: 'palm',
  fist: 'palm',
  hand: 'palm',
  earth: 'palm',
  sacrifice: 'palm',
  guo: 'palm',
  guard: 'palm',
  yang: 'palm',
  finger: 'finger',
  ray: 'finger',
  spark: 'finger',
  meridian: 'finger',
  duan: 'finger',
  support: 'support',
  heal: 'support',
  healing: 'support',
  shield: 'support',
  ward: 'support',
  rally: 'support',
  ally: 'support',
  medic: 'support',
  zhang: 'support',
  poison: 'poison',
  toxin: 'poison',
  toxic: 'poison',
  venom: 'poison',
  blink: 'blink',
  ground: 'blink',
  teleport: 'blink',
  haste: 'blink',
  lightness: 'blink',
  enemy: 'enemy',
  foe: 'enemy',
  hostile: 'enemy',
  boss: 'enemy',
  'enemy-skill': 'enemy',
  'enemy-technique': 'enemy',
  chief: 'enemy',
  murong: 'enemy',
  archer: 'enemy',
  bandit: 'enemy',
  echobow: 'enemy',
  echoblade: 'enemy',
  echoscout: 'enemy'
});
function familyOf(kind, visual) {
  if (kind && typeof kind === 'object') {
    if (kind.side === 'enemy' || kind.enemy) return 'enemy';
    if (kind.poison) return 'poison';
    if (kind.blink || kind.haste || kind.target === 'ground') return 'blink';
    if (kind.heal || kind.shield || kind.rally || kind.target === 'ally' || kind.target === 'self')
      return 'support';
    if (kind.hpCost) return 'palm';
    visual = kind.visual || visual;
    kind = kind.family || kind.flourish || kind.kind;
  }
  let key = typeof kind === 'string' ? kind.toLowerCase() : '';
  if (Object.hasOwn(DIR, key)) return DIR[key];
  key = typeof visual === 'string' ? visual.toLowerCase() : '';
  return Object.hasOwn(DIR, key) ? DIR[key] : 'weapon';
}

function ink(ctx, color) {
  ctx.fillStyle = color;
  ctx.fill();
}
function stroke(ctx, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function curve(c, x, y, a, b, d, e, u, v, color, width) {
  c.beginPath();
  c.moveTo(x, y);
  c.bezierCurveTo(a, b, d, e, u, v);
  stroke(c, color, width);
}

// The two sides of the same curved brushstroke meet in a pointed entry and exit.
// The moving outer edge catches a sliver of light without a blur or a bloom pass.
function brush(c, x, y, a, b, d, e, u, v, width, color) {
  const l0 = Math.hypot(d - x, e - y) || 1,
    l1 = Math.hypot(u - a, v - b) || 1;
  const ax = -(e - y) / l0,
    ay = (d - x) / l0,
    bx = -(v - b) / l1,
    by = (u - a) / l1;
  c.beginPath();
  c.moveTo(x, y);
  c.bezierCurveTo(
    a + ax * width * 0.77,
    b + ay * width * 0.77,
    d + bx * width,
    e + by * width,
    u,
    v
  );
  c.bezierCurveTo(
    d - bx * width * 0.43,
    e - by * width * 0.43,
    a - ax * width * 0.22,
    b - ay * width * 0.22,
    x,
    y
  );
  c.closePath();
  ink(c, color);
}

function point(c, x, y, r, color, stretch = 1) {
  c.beginPath();
  c.moveTo(x - r * stretch, y);
  c.lineTo(x, y - r * 0.55);
  c.lineTo(x + r * stretch, y);
  c.lineTo(x + r * 0.05, y + r * 0.55);
  c.closePath();
  ink(c, color);
}
function glint(c, x, y, r, color) {
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x + 0.07 * r, y - 0.12 * r, x + 0.67 * r, y);
  c.quadraticCurveTo(x + 0.08 * r, y + 0.09 * r, x, y + r);
  c.quadraticCurveTo(x - 0.09 * r, y + 0.1 * r, x - 0.67 * r, y);
  c.quadraticCurveTo(x - 0.07 * r, y - 0.12 * r, x, y - r);
  c.closePath();
  ink(c, color);
}
function ellipseArc(c, x, y, rx, ry, slant, a, b, color, width) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, slant, a, b);
  stroke(c, color, width);
}
function culmLeaf(c, x, y, length, width, angle, color, vein) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(length * 0.35, -width * 1.05, length * 0.76, -width * 0.7, length, -width * 0.25);
  c.bezierCurveTo(length * 0.74, width * 0.65, length * 0.31, width * 0.78, 0, 0);
  c.closePath();
  ink(c, color);
  if (vein)
    curve(
      c,
      0.04 * length,
      0,
      0.28 * length,
      -0.02 * width,
      0.63 * length,
      -0.16 * width,
      0.85 * length,
      -0.23 * width,
      vein,
      0.012
    );
  c.restore();
}

// A broken crescent, broad at its shoulder and fine at the escaping tip.
function crescent(c, r, rotation, color, middle, edge, full) {
  c.save();
  c.rotate(rotation);
  c.scale(r, r);
  c.beginPath();
  c.moveTo(-0.98, 0.16);
  c.bezierCurveTo(-0.68, 0.51, 0.13, 0.6, 0.95, -0.4);
  c.bezierCurveTo(0.66, -0.04, 0.79, -0.2, 0.89, -0.43);
  c.bezierCurveTo(0.25, 0.23, -0.39, 0.48, -0.98, 0.16);
  c.closePath();
  ink(c, color);
  brush(c, -0.92, 0.19, -0.46, 0.49, 0.31, 0.44, 0.91, -0.4, 0.058, middle);
  curve(c, -0.7, 0.33, -0.3, 0.45, 0.31, 0.39, 0.78, -0.24, edge, 0.022);
  if (full) {
    curve(c, -0.37, 0.384, -0.23, 0.39, -0.11, 0.385, 0.04, 0.345, color, 0.014);
    curve(c, 0.1, 0.323, 0.18, 0.3, 0.24, 0.269, 0.29, 0.239, color, 0.014);
  }
  c.restore();
}
function bladeCrest(c, p, r, phase) {
  const size = 0.36 + r * 0.18,
    rot = -0.26 + 0.035 * phase;
  crescent(c, size, rot, p[0], p[1], p[2], r >= 3);
  if (r >= 2) crescent(c, size * 0.76, 2.77, p[0], p[2], r === 4 ? p[3] : p[1], false);
  if (r >= 3) {
    crescent(c, size * 0.9, -1.2, p[0], p[1], r === 4 ? p[3] : p[2], true);
    point(c, -size * 0.64, -size * 0.39, 0.038, p[2], 2.45);
  }
  if (r === 4) {
    crescent(c, size * 0.88, 1.54, p[0], p[3], p[2], true);
    curve(c, -0.95, -0.18, -0.73, -0.41, -0.52, -0.51, -0.32, -0.54, p[3], 0.018);
    point(c, 0.91, -0.32, 0.04, p[3], 2.3);
    glint(c, 0.53, -0.38, 0.092, p[2]);
  }
}

// A clay-coloured ruyi rim rolls back on itself like painted waves on a screen.
function cloud(c, x, y, k, phi, p, foil) {
  c.save();
  c.translate(x, y);
  c.rotate(phi);
  c.scale(k, k);
  c.beginPath();
  c.moveTo(-0.6, 0.22);
  c.bezierCurveTo(-0.46, 0.08, -0.4, -0.1, -0.29, -0.22);
  c.bezierCurveTo(-0.24, -0.41, -0.01, -0.45, 0.09, -0.29);
  c.bezierCurveTo(0.23, -0.38, 0.42, -0.3, 0.43, -0.13);
  c.bezierCurveTo(0.6, -0.19, 0.74, -0.07, 0.73, 0.04);
  c.bezierCurveTo(0.72, 0.13, 0.61, 0.2, 0.51, 0.17);
  c.bezierCurveTo(0.64, 0.15, 0.67, 0.08, 0.62, 0.03);
  c.bezierCurveTo(0.51, -0.03, 0.43, 0.08, 0.39, 0.13);
  c.bezierCurveTo(0.39, -0.1, 0.21, -0.14, 0.14, -0.02);
  c.bezierCurveTo(0.1, 0.09, 0.11, 0.16, 0.18, 0.2);
  c.bezierCurveTo(-0.1, 0.05, -0.34, 0.16, -0.6, 0.22);
  c.closePath();
  ink(c, p[0]);
  brush(c, -0.56, 0.2, -0.32, 0.06, -0.2, -0.49, 0.06, -0.27, 0.071, p[1]);
  curve(c, -0.43, 0.15, -0.26, 0.02, -0.19, -0.41, 0.025, -0.294, foil ? p[3] : p[2], 0.023);
  curve(c, 0.045, -0.24, 0.21, -0.4, 0.45, -0.26, 0.41, -0.09, p[1], 0.043);
  curve(c, 0.25, -0.27, 0.38, -0.28, 0.43, -0.19, 0.407, -0.135, p[2], 0.018);
  curve(c, 0.428, -0.089, 0.63, -0.24, 0.84, 0.048, 0.58, 0.135, foil ? p[3] : p[1], 0.029);
  c.restore();
}
function palmCrest(c, p, r, phase) {
  const s = 0.42 + r * 0.145;
  cloud(c, 0.05, -0.03, s, -0.39, p, r === 4);
  if (r >= 2) cloud(c, -0.17, 0.12, s * 0.81, 2.32, p, false);
  if (r >= 3) {
    cloud(c, -0.22, -0.22, s * 0.79, -1.9, p, r === 4);
    ellipseArc(c, 0.03, 0.04, s * 0.88, s * 0.38, -0.35, 0.16, 1.64, p[1], 0.032);
  }
  if (r === 4) {
    cloud(c, 0.4, 0.1, s * 0.75, 0.58, p, true);
    ellipseArc(c, -0.03, 0.06, s * 1.05, s * 0.54, -0.31, 2.63, 3.89, p[3], 0.022);
    brush(c, -0.82, 0.43, -0.57, 0.51, -0.38, 0.43, -0.24, 0.32, 0.034, p[3]);
    glint(c, 0.52, -0.28, 0.08, p[2]);
  }
}

function lance(c, x, y, len, w, rot, p, foil) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  c.moveTo(-len, 0);
  c.lineTo(-0.18 * len, -w);
  c.lineTo(0.13 * len, 0);
  c.lineTo(-0.2 * len, 0.59 * w);
  c.closePath();
  ink(c, p[0]);
  c.beginPath();
  c.moveTo(-0.98 * len, 0);
  c.lineTo(-0.18 * len, -w * 0.81);
  c.lineTo(0.095 * len, 0);
  c.closePath();
  ink(c, foil ? p[3] : p[1]);
  curve(
    c,
    -len * 0.77,
    -0.035 * w,
    -len * 0.46,
    -0.09 * w,
    -len * 0.12,
    0,
    len * 0.08,
    0,
    p[2],
    0.015
  );
  c.restore();
}
function fingerCrest(c, p, r, phase) {
  const len = 0.31 + r * 0.15,
    count = r === 4 ? 5 : r;
  for (let i = 0; i < count; i++) {
    const a = (i - (count - 1) / 2) * (0.23 + (r === 4 ? 0.035 : 0));
    const end = 0.35 + Math.abs(i - (count - 1) / 2) * 0.025;
    lance(
      c,
      Math.cos(a) * end,
      Math.sin(a) * end,
      len * (1 - Math.min(0.28, 0.08 * Math.abs(i - (count - 1) / 2))),
      0.037 + r * 0.008,
      a,
      p,
      r === 4 && i % 2 === 1
    );
  }
  if (r >= 2) {
    glint(c, 0.4, 0.01, 0.041 + r * 0.012, p[2]);
    point(c, 0.53, 0, 0.021, p[1], 1.9);
  }
  if (r >= 3) {
    const nodes = [
      [-0.5, -0.35],
      [-0.15, -0.48],
      [0.16, -0.33],
      [0.41, -0.53]
    ];
    for (let i = 0; i < nodes.length; i++) {
      const [x, y] = nodes[i];
      if (i)
        curve(
          c,
          nodes[i - 1][0],
          nodes[i - 1][1],
          nodes[i - 1][0] * 0.58 + x * 0.42,
          nodes[i - 1][1] * 0.58 + y * 0.42,
          x * 0.76 + nodes[i - 1][0] * 0.24,
          y * 0.76 + nodes[i - 1][1] * 0.24,
          x,
          y,
          r === 4 ? p[3] : p[1],
          0.013
        );
      point(c, x, y, i === 1 ? 0.042 : 0.031, i % 2 === 0 ? p[2] : p[1], 1.05);
    }
  }
  if (r === 4) {
    lance(c, -0.17, 0.47, 0.56, 0.047, -0.23, p, true);
    lance(c, 0.6, 0.21, 0.36, 0.042, -0.24, p, false);
    glint(c, -0.15, -0.48, 0.067, p[3]);
  }
}

function lotusPetal(c, x, y, k, angle, p, foil) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(k, k);
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(-0.2, -0.17, -0.19, -0.4, -0.04, -0.58);
  c.bezierCurveTo(-0.015, -0.62, -0.015, -0.67, 0, -0.69);
  c.bezierCurveTo(0.16, -0.46, 0.23, -0.15, 0, 0);
  c.closePath();
  ink(c, p[0]);
  c.beginPath();
  c.moveTo(0, -0.027);
  c.bezierCurveTo(-0.13, -0.2, -0.15, -0.42, -0.025, -0.575);
  c.bezierCurveTo(0.015, -0.49, 0.05, -0.19, 0, -0.027);
  c.closePath();
  ink(c, foil ? p[3] : p[1]);
  curve(c, 0, -0.035, 0.1, -0.22, 0.14, -0.4, 0, -0.64, p[2], 0.022);
  c.restore();
}
function lotusCrest(c, p, r, phase) {
  const s = 0.6 + 0.135 * r,
    open = 0.35 + 0.1 * r + 0.06 * phase;
  // The calyx stays below the chest, leaving the portrait and nameplate clear.
  const y = 0.31;
  if (r >= 3) {
    lotusPetal(c, -0.08, y + 0.01, s * 0.79, -1.12, p, r === 4);
    lotusPetal(c, 0.08, y + 0.01, s * 0.79, 1.12, p, r === 4);
  }
  lotusPetal(c, -0.035, y, s * 0.82, -open, p, false);
  if (r >= 2) lotusPetal(c, 0.035, y, s * 0.82, open, p, false);
  if (r === 1) culmLeaf(c, 0.02, y, 0.27, 0.077, -0.48, p[1], p[2]);
  if (r >= 2) {
    ellipseArc(c, 0, y + 0.01, s * 0.64, s * 0.17, 0, 0.08, 2.92, p[1], 0.03);
    ellipseArc(c, 0, y + 0.015, s * 0.52, s * 0.12, 0, 0.25, 1.7, p[2], 0.019);
  }
  if (r >= 3) {
    lotusPetal(c, 0, y + 0.035, s * 0.69, 0, p, true);
    glint(c, 0, y - s * 0.61, 0.059, p[2]);
  }
  if (r === 4) {
    ellipseArc(c, 0, y + 0.02, s * 0.81, s * 0.224, -0.08, 3.3, 5.24, p[3], 0.022);
    culmLeaf(c, -0.43, y + 0.04, 0.39, 0.067, -2.99, p[1], p[3]);
    culmLeaf(c, 0.44, y + 0.005, 0.38, 0.068, -0.19, p[1], p[3]);
    point(c, -0.61, -0.31, 0.034, p[3], 1);
    point(c, 0.62, -0.36, 0.044, p[2], 0.85);
  }
}

function thorn(c, x, y, length, rot, p, foil) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(length, length);
  brush(c, 0, 0, 0.24, -0.12, 0.7, -0.25, 1, -0.13, 0.069, p[0]);
  curve(c, 0.03, -0.008, 0.25, -0.12, 0.66, -0.24, 0.93, -0.156, foil ? p[3] : p[1], 0.024);
  for (let j = 0; j < 3; j++) {
    const xx = 0.23 + j * 0.225,
      yy = -0.14 - 0.045 * Math.sin(j * 1.4);
    c.beginPath();
    c.moveTo(xx - 0.07, yy + 0.025);
    c.quadraticCurveTo(xx + 0.02, yy - 0.035, xx + 0.065, yy - 0.265 + j * 0.038);
    c.quadraticCurveTo(xx + 0.126, yy - 0.114, xx + 0.064, yy);
    c.closePath();
    ink(c, j === 1 ? p[2] : p[1]);
    c.beginPath();
    c.moveTo(xx + 0.05, yy + 0.014);
    c.lineTo(xx + 0.17, yy + 0.11 - j * 0.018);
    c.lineTo(xx + 0.14, yy - 0.025);
    c.closePath();
    ink(c, p[0]);
  }
  c.restore();
}
function poisonCrest(c, p, r, phase) {
  const s = 0.42 + 0.148 * r;
  thorn(c, -0.12, 0.14, s, -0.51, p, false);
  if (r >= 2) thorn(c, 0.03, -0.01, s * 0.81, 2.65, p, false);
  if (r >= 3) {
    thorn(c, -0.07, 0.1, s * 0.73, -1.48, p, r === 4);
    point(c, 0.35, 0.3, 0.044, p[2], 0.7);
    point(c, 0.24, 0.45, 0.036, p[1], 0.55);
  }
  if (r === 4) {
    thorn(c, 0.04, 0.09, s * 0.68, 0.81, p, true);
    ellipseArc(c, 0.025, 0.07, 0.68, 0.42, -0.44, 1.88, 2.96, p[3], 0.014);
    point(c, -0.47, 0.33, 0.052, p[2], 0.71);
    point(c, -0.56, 0.45, 0.035, p[1], 0.48);
  }
}

function swallow(c, x, y, k, a, p, foil) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.scale(k, k);
  c.beginPath();
  c.moveTo(-0.61, 0.23);
  c.bezierCurveTo(-0.31, 0.16, -0.13, 0, 0.055, -0.028);
  c.bezierCurveTo(0.23, -0.22, 0.49, -0.31, 0.72, -0.26);
  c.bezierCurveTo(0.43, -0.13, 0.35, -0.017, 0.23, 0.072);
  c.bezierCurveTo(0.12, 0.15, -0.02, 0.13, -0.092, 0.135);
  c.bezierCurveTo(-0.3, 0.16, -0.43, 0.28, -0.64, 0.31);
  c.lineTo(-0.39, 0.18);
  c.closePath();
  ink(c, p[0]);
  brush(c, -0.58, 0.24, -0.27, 0.12, -0.06, 0.04, 0.13, 0.035, 0.038, foil ? p[3] : p[1]);
  brush(c, 0.07, 0.037, 0.24, -0.13, 0.51, -0.28, 0.7, -0.26, 0.055, p[1]);
  curve(c, 0.15, 0.035, 0.3, -0.078, 0.47, -0.226, 0.61, -0.24, p[2], 0.022);
  c.restore();
}
function blinkCrest(c, p, r, phase) {
  const s = 0.47 + 0.12 * r;
  swallow(c, 0.02, -0.065, s, -0.16, p, r === 4);
  if (r >= 2) swallow(c, -0.14, 0.22, s * 0.69, -0.12, p, false);
  if (r >= 3) {
    swallow(c, 0.32, -0.32, s * 0.64, -0.33, p, false);
    brush(c, -0.65, 0.28, -0.43, 0.23, -0.3, 0.08, -0.13, 0.14, 0.035, p[1]);
    point(c, -0.46, 0.35, 0.027, p[2], 1.65);
  }
  if (r === 4) {
    swallow(c, -0.36, -0.17, s * 0.6, -0.49, p, true);
    curve(c, -0.85, 0.41, -0.61, 0.42, -0.44, 0.2, -0.29, 0.2, p[3], 0.018);
    glint(c, 0.56, -0.48, 0.065, p[2]);
  }
}

function claw(c, x, y, len, rot, p, foil) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(len, len);
  c.beginPath();
  c.moveTo(-0.76, 0.28);
  c.bezierCurveTo(-0.41, 0.16, -0.05, -0.29, 0.36, -0.27);
  c.lineTo(0.25, -0.23);
  c.lineTo(0.61, -0.31);
  c.lineTo(0.31, -0.08);
  c.lineTo(0.4, -0.11);
  c.bezierCurveTo(0.07, 0.17, -0.27, 0.18, -0.76, 0.28);
  c.closePath();
  ink(c, p[0]);
  brush(c, -0.68, 0.25, -0.25, 0.14, -0.08, -0.13, 0.45, -0.24, 0.07, p[1]);
  curve(c, -0.26, 0.08, -0.12, -0.02, 0.02, -0.16, 0.29, -0.2, foil ? p[3] : p[2], 0.023);
  c.restore();
}
function enemyCrest(c, p, r, phase) {
  const s = 0.49 + 0.13 * r;
  claw(c, 0.02, -0.06, s, -0.27, p, false);
  if (r >= 2) claw(c, -0.13, 0.1, s * 0.78, -0.15, p, false);
  if (r >= 3) {
    claw(c, 0.23, -0.3, s * 0.77, -0.36, p, r === 4);
    point(c, 0.54, -0.36, 0.035, p[2], 1.6);
  }
  if (r === 4) {
    claw(c, -0.02, 0.41, s * 0.72, -0.71, p, true);
    brush(c, -0.52, -0.26, -0.3, -0.42, 0.09, -0.46, 0.23, -0.45, 0.035, p[3]);
    glint(c, 0.38, -0.44, 0.068, p[2]);
  }
}

// The last tier finishes with an open, gold-edged dry brush. Its missing
// middle and two separated fragments read as paper showing through the ink.
function gildedFinish(c, p, family) {
  c.save();
  if (family === 'support') c.rotate(-0.65);
  else if (family === 'finger') c.rotate(0.45);
  else if (family === 'enemy') c.rotate(-0.46);
  brush(c, -0.62, 0.49, -0.94, 0.16, -0.82, -0.28, -0.57, -0.455, 0.047, p[0]);
  brush(c, -0.63, 0.47, -0.88, 0.12, -0.79, -0.24, -0.58, -0.441, 0.035, p[3]);
  brush(c, -0.537, -0.487, -0.46, -0.55, -0.365, -0.593, -0.287, -0.611, 0.026, p[3]);
  point(c, -0.252, -0.629, 0.018, p[2], 1.6);
  c.restore();
}

const CRESTS = {
  weapon: bladeCrest,
  palm: palmCrest,
  finger: fingerCrest,
  support: lotusCrest,
  poison: poisonCrest,
  blink: blinkCrest,
  enemy: enemyCrest
};

function charging(c, family, p, rank, t, alpha) {
  const gain = pulse(0.025, 0.18, 0.34, 0.52, t);
  if (gain <= 0) return;
  c.save();
  c.globalAlpha = alpha * gain * (0.52 + 0.08 * rank);
  const r = 0.11 + rank * 0.047 + 0.055 * (1 - smooth(0.06, 0.36, t));
  if (family === 'support') {
    culmLeaf(c, -0.012, 0.04, r * 1.4, r * 0.24, -2.35, p[1], p[2]);
    if (rank >= 2)
      culmLeaf(c, 0.025, 0.05, r * 1.18, r * 0.24, -0.76, p[1], rank === 4 ? p[3] : p[2]);
  } else if (family === 'palm') {
    ellipseArc(c, 0, 0, r * 1.28, r * 0.58, -0.21, -0.78, 1.78, p[1], 0.026);
    if (rank >= 2) ellipseArc(c, -0.024, -0.03, r * 0.99, r * 0.55, -0.21, 2.12, 4.1, p[2], 0.02);
  } else if (family === 'poison') {
    thorn(c, -r * 0.67, 0.02, r * 1.18, -0.46, p, rank === 4);
  } else if (family === 'blink') {
    swallow(c, -0.03, 0.045, r * 1.52, -0.15, p, rank === 4);
  } else {
    brush(
      c,
      -r * 0.96,
      r * 0.43,
      -r * 0.38,
      r * 0.22,
      0.02,
      -r * 0.42,
      r * 0.93,
      -r * 0.48,
      0.034,
      p[1]
    );
    glint(c, r * 0.82, -r * 0.4, r * 0.3, p[2]);
  }
  if (rank >= 3) {
    point(c, -r * 1.21, -r * 0.82, 0.036, p[2], 1.55);
    if (rank === 4) point(c, r * 0.37, r * 0.86, 0.025, p[3], 2.25);
  }
  c.restore();
}

// Travel only paints a short segment around the moving tip. Long-range arts
// keep their actual arrival coordinates without drawing across the entire field.
function trace(c, family, p, rank, t, gap, alpha) {
  if (gap < 0.15) return;
  const begin = 0.205,
    end = 0.545,
    head = smooth(begin, end, t);
  const visible = pulse(begin, 0.29, 0.53, 0.68, t);
  if (visible <= 0) return;
  const arc =
    family === 'finger'
      ? 0
      : family === 'support'
        ? 0.22
        : family === 'blink'
          ? -0.2
          : family === 'palm'
            ? 0.14
            : 0.095;
  const x = gap * head,
    len = Math.min(gap * (0.16 + head * 0.33), 0.32 + rank * 0.22),
    height = (u) => -arc * Math.sin(PI * clamp01(u / gap));
  const y = height(x);
  c.save();
  c.globalAlpha = alpha * visible * 0.85;
  if (family === 'poison' || family === 'finger') {
    const n = rank === 4 ? 4 : rank === 3 ? 3 : rank;
    for (let i = 0; i < n; i++) {
      const offset = (i - (n - 1) / 2) * 0.079,
        xx = x - i * 0.078;
      if (xx < 0) continue;
      lance(
        c,
        xx,
        y + offset,
        Math.max(0.08, len * (1 - i * 0.105)),
        0.026 + rank * 0.005,
        -offset * 0.16,
        p,
        rank === 4 && i === 2
      );
    }
  } else if (family === 'blink') {
    for (let i = 0; i < rank; i++) {
      const xx = x - i * 0.23;
      if (xx < 0) continue;
      swallow(
        c,
        xx,
        height(xx) + (i % 2 ? 0.047 : -0.027),
        0.23 + (rank - i) * 0.056,
        -0.16,
        p,
        rank === 4 && i === 1
      );
    }
  } else {
    const runs = rank === 1 ? 1 : rank === 2 ? 2 : 3;
    for (let i = 0; i < runs; i++) {
      const offset = (i - (runs - 1) / 2) * (0.073 + rank * 0.007),
        tail = Math.max(0, x - len * (1 - i * 0.105)),
        tailY = height(tail) - offset;
      const w = (family === 'palm' ? 0.04 : 0.028) + rank * 0.006;
      curve(
        c,
        tail,
        tailY,
        (tail + x) * 0.5,
        tailY - offset * 0.6,
        x - len * 0.25,
        y + offset * 0.21,
        x,
        y + offset,
        p[0],
        w * 1.5
      );
      brush(
        c,
        tail,
        tailY,
        (tail + x) * 0.5,
        tailY - offset * 0.6,
        x - len * 0.25,
        y + offset * 0.21,
        x,
        y + offset,
        w,
        rank === 4 && i === 1 ? p[3] : i === 0 ? p[1] : p[2]
      );
    }
  }
  if (rank >= 3) glint(c, x + 0.025, y, 0.042 + rank * 0.007, p[2]);
  c.restore();
}

function flecks(c, p, r, phase) {
  // Dry-brush chips lie at the edge of the gesture, never across the face.
  const count = r === 4 ? 8 : r === 3 ? 5 : r === 2 ? 2 : 0;
  for (let i = 0; i < count; i++) {
    const a = -1.17 + i * 2.21 + (i % 2) * 0.36;
    const d = 0.3 + r * 0.11 + (0.11 + 0.011 * i) * phase + (i % 3) * 0.057;
    const x = Math.cos(a) * d,
      y = Math.sin(a) * d * 0.62;
    c.save();
    c.translate(x, y);
    c.rotate(a - 0.16);
    point(
      c,
      0,
      0,
      0.015 + (i % 3) * 0.008,
      r === 4 && i % 3 === 0 ? p[3] : i % 2 ? p[1] : p[2],
      1.6 + (i % 2) * 0.8
    );
    c.restore();
  }
}

/**
 * Paint the tier flourish over the projected chest positions used by paintSkillEffect.
 * kind may be a family, a mastery flourish, or the technique definition itself.
 * Use the explicit kind 'enemy' for a hostile caster. rank is a number from 1 to 4.
 */
function paintTechniqueTier(
  ctx,
  from,
  to,
  progress,
  scale,
  rank,
  kind,
  visual,
  reduced = false
) {
  if (
    !ctx ||
    !from ||
    !to ||
    !Number.isFinite(progress) ||
    progress <= 0 ||
    progress >= 1 ||
    !Number.isFinite(scale) ||
    scale <= 0 ||
    !Number.isFinite(from.x) ||
    !Number.isFinite(from.y) ||
    !Number.isFinite(to.x) ||
    !Number.isFinite(to.y)
  )
    return;
  const tier = Number.isFinite(rank) ? Math.max(1, Math.min(4, Math.round(rank))) : 1;
  const family = familyOf(kind, visual),
    palette = COLOR[family];
  const pixels = Math.max(14, Math.min(86, scale));
  const dx = to.x - from.x,
    dy = to.y - from.y,
    gap = Math.hypot(dx, dy) / pixels;
  if (!Number.isFinite(gap)) return;
  const angle = gap > 0.035 ? Math.atan2(dy, dx) : -0.13;
  const alpha = ctx.globalAlpha,
    t = progress;
  ctx.save();
  try {
    ctx.translate(from.x, from.y);
    ctx.scale(pixels, pixels);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (!reduced) {
      ctx.save();
      ctx.rotate(angle);
      charging(ctx, family, palette, tier, t, alpha);
      trace(ctx, family, palette, tier, t, gap, alpha);
      ctx.restore();
    }
    ctx.translate(dx / pixels, dy / pixels);
    const gain = reduced ? pulse(0.035, 0.18, 0.78, 0.97, t) : pulse(0.408, 0.523, 0.744, 0.954, t);
    if (gain <= 0) return;
    const phase = reduced ? 0.52 : smooth(0.435, 0.83, t);
    // Most marks follow the blow; botanic marks grow toward screen-up.
    if (family === 'support') ctx.scale(dx < 0 ? -0.99 : 0.99, 1);
    else if (family === 'poison') {
      ctx.scale(dx < 0 ? -0.99 : 0.99, 1);
      ctx.rotate(Math.max(-0.22, Math.min(0.22, (dy / (Math.abs(dx) + pixels)) * 0.37)));
    } else {
      ctx.rotate(angle);
      if (family === 'blink' && Math.cos(angle) < 0) ctx.scale(1, -1);
    }
    const size = reduced ? 0.82 : 0.76 + 0.29 * smooth(0.41, 0.57, t) + 0.08 * phase;
    ctx.scale(size, size);
    ctx.globalAlpha = alpha * gain * (reduced ? 0.82 : 0.9);
    if (tier === 4) gildedFinish(ctx, palette, family);
    CRESTS[family](ctx, palette, tier, phase);
    if (!reduced) flecks(ctx, palette, tier, phase);
  } finally {
    ctx.restore();
  }
}

export { paintTechniqueTier };
