// The trees round the 溫 house: old camphors with broad crowns, osmanthus in the rear
// court, groves of tall bamboo on the hill behind, mountain pines along the ravine, and the
// woods thinning up the hillsides.
import { circle } from '../scenery-kit.js';
import { clump, bamboo, taihuRock } from './garden-13.js';
import { pine } from './kit-12.js';
import { heightN, heightS, lipN, lipS, inHouse } from './ravine-16.js';

const bark = 0x4a3e34;
const barkLight = 0x6a5c4e;
const camphorDark = 0x334b2f;
const camphorLight = 0x6a8650;
const osmanthusDark = 0x2e4a30;
const osmanthusLight = 0x5d7d48;
const bloom = 0xe8c86a;

// Camphor: a short massive trunk that splits into spreading limbs under a broad, lumpy crown.
function camphor(m, x, y, z, s, plain = false) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    if (plain) {
      m.tube([0, -0.1, 0], [0.05, 1.4, 0], 0.22, 0.14, bark, 5);
      clump(m, 0, 2.4, 0, 1.6, 1.0, 1.5, camphorDark, camphorLight, 7);
      clump(m, 0.5, 3.1, 0.2, 0.9, 0.6, 0.9, camphorDark, camphorLight, 6);
      return;
    }
    m.tube([0, -0.1, 0], [0.05, 1.0, 0], 0.26, 0.2, bark, 8);
    m.lathe(0, -0.1, 0, [[0, 0.42], [0.25, 0.3], [0.45, 0.25]], bark, 8);
    const limbs = 5;
    for (let k = 0; k < limbs; k++) {
      const a = (k * circle) / limbs + r.range(-0.3, 0.3),
        reach = r.range(1.2, 1.9),
        mid = [Math.cos(a) * reach * 0.45, 1.6 + r.range(0, 0.3), Math.sin(a) * reach * 0.45],
        tip = [Math.cos(a) * reach, 2.4 + r.range(0, 0.5), Math.sin(a) * reach];
      m.line([[0.05, 0.95, 0], mid, tip], 0.1 - k * 0.008, barkLight, 6);
      clump(m, tip[0], tip[1] + 0.25, tip[2], r.range(0.85, 1.15), 0.62, r.range(0.85, 1.1), camphorDark, camphorLight, 9);
      clump(m, mid[0] * 1.3, mid[1] + 0.55, mid[2] * 1.3, 0.7, 0.45, 0.7, camphorDark, m.mix(camphorDark, camphorLight, 0.6), 8);
    }
    clump(m, 0, 3.35, 0, 1.3, 0.75, 1.2, camphorDark, camphorLight, 10);
  });
}
// Osmanthus: a dense round evergreen on a short trunk, dotted with its tiny golden flowers.
function osmanthus(m, x, y, z, s) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, circle), s, () => {
    m.tube([0, 0, 0], [0.02, 0.6, 0], 0.09, 0.07, bark, 6);
    for (let k = 0; k < 4; k++) {
      const a = (k * circle) / 4 + r.range(-0.3, 0.3);
      m.tube([0.02, 0.55, 0], [Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3], 0.045, 0.03, barkLight, 5);
      clump(m, Math.cos(a) * 0.42, 1.2 + r.range(-0.1, 0.15), Math.sin(a) * 0.42, 0.55, 0.5, 0.55, osmanthusDark, osmanthusLight, 8);
    }
    clump(m, 0, 1.65, 0, 0.6, 0.45, 0.6, osmanthusDark, osmanthusLight, 8);
    for (let i = 0; i < 26; i++) {
      const a = r.range(0, circle),
        h = r.range(0.85, 1.9),
        d = 0.55 + 0.35 * Math.sin(((h - 0.85) / 1.05) * Math.PI);
      m.box(Math.cos(a) * d, h, Math.sin(a) * d, 0.05, 0.05, 0.05, bloom);
    }
  });
}
// A grove of tall bamboo: clumps set round a centre, each on the hillside where it stands.
function grove(m, x, z, rad, n, height, s = 1.6) {
  const r = m.rng;
  for (let i = 0; i < n; i++) {
    const a = r.range(0, circle),
      d = r.range(0, rad),
      gx = x + Math.cos(a) * d,
      gz = z + Math.sin(a) * d;
    m.frame(0, height(gx, gz) - 0.02, 0, 0, 1, () => bamboo(m, gx, gz, s * r.range(0.85, 1.15), 7));
  }
}

// Behind the house and along its sides.
function hillWoods(m) {
  const r = m.rng;
  // Two old camphors at the back corners of the compound, over the walls.
  camphor(m, -12.6, heightN(-12.6, -14), -14, 1.25);
  camphor(m, 13.0, heightN(13, -9.5), -9.5, 1.15);
  camphor(m, -13.5, heightN(-13.5, -4.5), -4.5, 1.0);
  // Pines and camphors up the hill, thinning as it climbs.
  for (let i = 0; i < 22; i++) {
    const x = r.range(-28, 28),
      z = r.range(-30, -20.5);
    if (inHouse(x, z)) continue;
    const y = heightN(x, z);
    camphor(m, x, y, z, r.range(0.7, 1.1), true);
  }
  // Pines along the lanes east and west and on the slopes beyond them.
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1,
      x = side * r.range(15, 30),
      z = r.range(-20, 0.5);
    if (z > lipN(x) - 1.2) continue;
    pine(m, x, heightN(x, z), z, r.range(2.2, 3.4), { lean: r.range(-0.5, 0.5), yaw: r.range(0, circle), boughs: 5, rich: false });
  }
}
// Bamboo groves on the hill behind and beside the house: drawn as a separate model, since they
// are the heaviest growth here.
function bambooGroves(m) {
  for (const [x, z, rad, n] of [
    [-6, -22.5, 3.2, 4],
    [5.5, -23, 3.6, 4],
    [-15.5, -16, 2.6, 3],
    [17.5, -15.5, 2.8, 3]
  ]) {
    grove(m, x, z, rad, n, heightN, 1.7);
  }
}
// The trees inside the walls: osmanthus pairs in the rear court, and in the east garden an
// osmanthus by the pond, a rockery and bamboo against the outer wall.
function courtTrees(m) {
  for (const x of [-5.6, 5.6]) osmanthus(m, x, 0, -13.2, 1.05);
  osmanthus(m, 12.7, 0, -1.6, 0.95);
  taihuRock(m, 10.0, 0.9, 0.85, 0);
  for (const z of [-11.2, -9.8, 1.3]) bamboo(m, 13.25, z, 1.05, 7);
}
// South of the ravine: pines leaning out over the lip, and scattered trees down the hillside.
function southWoods(m) {
  const r = m.rng;
  for (const [x, lean] of [
    [-8.5, 0.6],
    [-13.5, 0.5],
    [9.6, -0.5],
    [15.5, -0.4],
    [-21, 0.4],
    [22, -0.5]
  ]) {
    const z = lipS(x) + 0.7;
    pine(m, x, heightS(x, z), z, r.range(2.3, 3.0), { lean, yaw: Math.PI, boughs: 7, rich: Math.abs(x) < 12 });
  }
  for (let i = 0; i < 12; i++) {
    const x = r.range(-26, 26),
      z = r.range(12, 21);
    if (Math.abs(x - z * 0.6 + 2) < 2.5) continue;
    const y = heightS(x, z);
    if (r.next() < 0.4) camphor(m, x, y, z, r.range(0.6, 0.9), true);
    else pine(m, x, y, z, r.range(2, 3), { lean: r.range(-0.4, 0.4), yaw: r.range(0, circle), boughs: 6, rich: false });
  }
}

export { camphor, osmanthus, hillWoods, bambooGroves, courtTrees, southWoods };
