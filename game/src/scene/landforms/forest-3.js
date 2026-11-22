import { Model } from '../scenery-kit.js';
import { clearOf, groundOf, hash, slopeOf, snowLight, spike, valleyHeight } from './ground-3.js';

// 聽雪棧 only: the snow forest. Spruce of every age stand in groves on the
// benches and down in the valley, a few cling to ledges of the faces; dead
// snags, bare shrubs and tufts of frozen grass fill the gaps, and snow lotus
// grows on the sheltered ground beside the shelf.

const needles = [0x2c463a, 0x33503f, 0x29433a, 0x3a5644],
  bark = 0x4a3a30,
  silver = 0x8d877d,
  straw = 0xa59a7a,
  twig = 0x5a4842;

// One spruce, its foot at (x, y, z). Each whorl of boughs is a star of drooping
// tips, loaded with snow from the trunk outward, dark underneath; old trees
// lose boughs and carry a dead leader, the young are full and narrow.
function spruce(m, x, y, z, h, age, lean = [0, 0]) {
  const tiers = Math.max(3, Math.min(9, Math.round(2.6 + h * 2.3)));
  const n = h < 0.9 ? 6 : 7,
    spin = m.rng.range(0, Math.PI * 2),
    tone = m.rng.pick(needles);
  const snowLoad = m.rng.range(0.55, 1);
  const at = (t) => [x + lean[0] * t * h, y + t * h, z + lean[1] * t * h];
  m.tube(at(-0.12), at(0.97), 0.022 + 0.026 * h, 0.006, age > 0.8 ? silver : bark, 5);
  for (let i = 0; i < tiers; i++) {
    // An old tree has lost some of its lower whorls.
    if (age > 0.7 && i > 0 && i < tiers - 2 && m.rng.next() < 0.3) continue;
    const t = i / tiers,
      c = at(0.16 + 0.78 * t),
      r = h * (0.36 - 0.3 * t) * m.rng.range(0.85, 1.12) * (age > 0.7 ? 1.12 : 1);
    const collar = [c[0], c[1] + 0.32 * r, c[2]],
      under = [c[0], c[1] - 0.42 * r, c[2]];
    const tips = [],
      notches = [];
    for (let k = 0; k < n; k++) {
      const a = spin + i * 0.7 + (k / n) * Math.PI * 2 + m.rng.range(-0.18, 0.18),
        b = a + Math.PI / n;
      const reach = r * m.rng.range(0.82, 1.12),
        droop = (0.3 + 0.18 * snowLoad) * r;
      tips.push([c[0] + Math.cos(a) * reach, c[1] - droop, c[2] + Math.sin(a) * reach]);
      notches.push([c[0] + Math.cos(b) * r * 0.58, c[1] - 0.06 * r, c[2] + Math.sin(b) * r * 0.58]);
    }
    const top = m.mix(snowLight(m, 0, 1, 0), tone, 0.12),
      shade = snowLight(m, 0, 0.5, 0, 0.12);
    const tip = m.mix(tone, top, 0.08 * snowLoad),
      notch = m.mix(tone, shade, 0.3 * snowLoad),
      dark = m.mix(tone, 0x12201b, 0.45);
    for (let k = 0; k < n; k++) {
      const q = (k + 1) % n;
      m.face([collar, tips[k], notches[k]], [top, tip, notch]);
      m.face([collar, notches[k], tips[q]], [top, notch, tip]);
      m.face([under, notches[k], tips[k]], [dark, m.rgb(tone), m.rgb(tone)]);
      m.face([under, tips[q], notches[k]], [dark, m.rgb(tone), m.rgb(tone)]);
    }
  }
  // The leader: green and snow-tipped when young, a bare grey spike when old.
  const crown = at(0.96);
  if (age > 0.75) spike(m, crown, -h * 0.22, 0.012 + 0.01 * h, silver, 4, 0xb3aca2);
  else spike(m, crown, -h * 0.12, 0.05 * h, tone, 5, 0xeef2f2);
}

// A dead snag: a silver trunk snapped off, with the stubs of its boughs.
function snag(m, x, y, z, h) {
  const top = [x + m.rng.range(-0.06, 0.06), y + h, z + m.rng.range(-0.06, 0.06)];
  m.tube([x, y - 0.15, z], top, 0.05 + 0.03 * h, 0.03, silver, 5);
  for (let i = 0; i < 5; i++) {
    const t = 0.35 + 0.12 * i,
      a = i * 2.3 + x,
      p = [x + (top[0] - x) * t, y + h * t, z + (top[2] - z) * t];
    const len = (0.35 - 0.04 * i) * h * m.rng.range(0.6, 1.1);
    m.tube(
      p,
      [p[0] + Math.cos(a) * len, p[1] - len * 0.25, p[2] + Math.sin(a) * len],
      0.016,
      0.004,
      silver,
      3
    );
  }
  // A cap of snow on the broken top and a splinter standing up from it.
  spike(m, top, -0.12 * h, 0.03, 0xb7afa4, 3);
  m.lathe(
    top[0],
    top[1] - 0.02,
    top[2],
    [
      [0, 0.055],
      [0.03, 0.04],
      [0.045, 0.0]
    ],
    0xeef2f2,
    6
  );
}

// A bare shrub: a fan of purple-brown twigs with snow lodged in the forks.
function shrub(m, x, y, z, s) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + m.rng.range(-0.3, 0.3),
      reach = s * m.rng.range(0.25, 0.5);
    const mid = [
      x + Math.cos(a) * reach * 0.45,
      y + s * m.rng.range(0.3, 0.5),
      z + Math.sin(a) * reach * 0.45
    ];
    const end = [x + Math.cos(a) * reach, y + s * m.rng.range(0.65, 1), z + Math.sin(a) * reach];
    m.tube([x, y - 0.03, z], mid, 0.012 * s + 0.006, 0.008 * s + 0.004, twig, 3);
    m.tube(mid, end, 0.008 * s + 0.004, 0.002, twig, 3);
    if (i % 2 === 0) m.box(mid[0], mid[1] + 0.012, mid[2], 0.05 * s, 0.022, 0.04 * s, 0xeef2f2);
  }
}

// A tuft of frozen grass pushing through the crust.
function tuft(m, x, y, z, s) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + m.rng.range(-0.4, 0.4),
      l = s * m.rng.range(0.6, 1);
    const base = [x + Math.cos(a) * 0.02, y - 0.01, z + Math.sin(a) * 0.02];
    spike(m, base, -l, 0.012, m.mix(straw, 0x6f6a55, m.rng.next() * 0.5), 2, 0xd9d2b8, [
      Math.cos(a) * l * 0.45,
      Math.sin(a) * l * 0.45
    ]);
  }
}

// 雪蓮: a rosette of silver-green leaves round a cream bud.
function snowLotus(m, x, y, z, s) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + m.rng.range(-0.2, 0.2),
      l = s * (i % 2 ? 0.75 : 1);
    m.leaf(
      [x, y + 0.01, z],
      [x + Math.cos(a) * l, y + 0.04 * s, z + Math.sin(a) * l],
      l * 0.28,
      0x7f9c86,
      0xb8ccbc,
      0.08 * s
    );
  }
  m.crystal(x, y, z, 0.12 * s, 0.38 * s, 0xd9d4b4, 0xfbf8ec, 5);
}

function forest3(T, surface, land) {
  const far = new Model(T, 39701),
    near = new Model(T, 39709);
  const ground = groundOf(surface);
  // Groves: trees gather where this field is high.
  const grove = (x, z) =>
    0.5 + 0.3 * Math.sin(x * 0.61 + z * 0.37) + 0.2 * Math.sin(x * 1.37 - z * 1.11 + 2.1);
  const plant = (x, z, h, age) => {
    const y = ground(x, z) - 0.02;
    // Anything that would stand above the shelf goes in the cutaway group.
    const m = y + h > -0.35 ? near : far;
    if (age > 0.95) snag(m, x, y, z, h * 0.8);
    else spruce(m, x, y, z, h, age, [m.rng.range(-0.04, 0.04), m.rng.range(-0.04, 0.04)]);
  };
  // On the massif: benches and gentle shoulders.
  for (let i = 0, made = 0; i < 6000 && made < 64; i++) {
    const x = far.rng.range(-13, 13),
      z = far.rng.range(-14, 14),
      y = surface(x, z);
    if (y > -0.6 || y < -6.9 || land(x, z) < 0.75 || !clearOf(x, z, 0.4)) continue;
    if (slopeOf(surface, x, z).steep > 0.75 || far.rng.next() > grove(x, z)) continue;
    const age = far.rng.next(),
      h = 0.45 + 1.35 * age ** 0.8;
    // Stay low beside the shelf on the camera's sides.
    const lift = y + h;
    if (lift > 0.25 && (x > 3.5 || z > 4.5)) continue;
    if (lift > 1.1) continue;
    plant(x, z, h, age);
    made++;
  }
  // Clinging trees on the faces, leaning out toward the light.
  for (let i = 0, made = 0; i < 4000 && made < 16; i++) {
    const x = far.rng.range(-12, 12),
      z = far.rng.range(-13, 13),
      y = surface(x, z);
    if (y > -1.2 || y < -6.5 || land(x, z) < 0.8 || !clearOf(x, z, 0.3)) continue;
    const g = slopeOf(surface, x, z);
    if (g.steep < 1.0 || g.steep > 2.4) continue;
    const h = far.rng.range(0.4, 0.8);
    spruce(far, x, y - 0.05, z, h, 0.5, [(-g.gx / g.steep) * 0.25, (-g.gz / g.steep) * 0.25]);
    made++;
  }
  // The valley forest round the foot of the massif, in close stands.
  for (let g = 0; g < 26; g++) {
    const a = (g / 26) * Math.PI * 2 + far.rng.range(-0.12, 0.12),
      rad = far.rng.range(9.8, 13.2);
    const gx = Math.cos(a) * rad,
      gz = Math.sin(a) * rad * 1.08;
    for (let k = 0, tries = 0; k < 6 && tries < 40; tries++) {
      const x = gx + far.rng.range(-1.1, 1.1),
        z = gz + far.rng.range(-1.1, 1.1),
        y = valleyHeight(x, z);
      if (surface(x, z) > y - 0.1 || land(x, z) < 3) continue;
      const age = far.rng.next(),
        h = 0.65 + 1.05 * age;
      if (age > 0.96) snag(far, x, y - 0.06, z, h);
      else spruce(far, x, y - 0.06, z, h, age);
      k++;
    }
  }
  // Shrubs, grass and snow lotus close to the shelf.
  for (
    let i = 0, shrubs = 0, tufts = 0, lotus = 0;
    i < 8000 && (shrubs < 30 || tufts < 70 || lotus < 22);
    i++
  ) {
    const x = near.rng.range(-11, 11),
      z = near.rng.range(-12, 12),
      y = surface(x, z),
      d = land(x, z);
    if (y > -0.2 || y < -5.5 || d < 0.35 || !clearOf(x, z, 0.2)) continue;
    if (slopeOf(surface, x, z).steep > 0.9) continue;
    const roll = hash(Math.round(x * 13), Math.round(z * 13));
    if (lotus < 22 && d < 2.2 && y > -2.4 && roll < 0.3) {
      snowLotus(far, x, y, z, near.rng.range(0.12, 0.18));
      lotus++;
    } else if (shrubs < 30 && roll < 0.55) {
      shrub(far, x, y, z, near.rng.range(0.3, 0.6));
      shrubs++;
    } else if (tufts < 70) {
      tuft(far, x, y, z, near.rng.range(0.08, 0.15));
      tufts++;
    }
  }
  return [far.finish('雪松林與斷木'), near.finish('崖畔雪松', { occluder: true })];
}

export { forest3 };
