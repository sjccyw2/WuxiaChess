import { TAU, smooth, fbm, pine } from './kit-12.js';
import { pathX } from './valley-12.js';
import { grassClump, fern, heather, bush, reeds, fallenTrunk, litter } from './flora-12.js';

// The cover on 鐵掌溪灘's banks, in layers: turf grass in clumps thickest where the ground is
// green, drifts of heather, leafy scrub, ferns in the shade of the mountain and the west skirt,
// reeds along the water, pines of every age from saplings to old trees, and trunks the floods
// have thrown down. Nothing is set on the board, in the water, on the trail or the gate path,
// or among the gang's works.

const trailX = (z) => 0.4 + 0.9 * Math.sin(z * 0.35);
// Ground kept clear for the gang's works and the gate: [x, z, radius].
const works = [
  [-2.95, -8.6, 1.0],
  [-4.25, -8.05, 0.8],
  [-4.35, -6.75, 0.5],
  [-2.3, -7.35, 0.45],
  [-3.2, -6.9, 0.75],
  [4.9, -6.65, 0.85],
  [3.95, -7.05, 0.7],
  [0.6, -7.7, 1.9],
  [-1.75, -7.0, 0.45],
  [2.95, -7.0, 0.45],
  [-2.7, 7.9, 0.6]
];

function clear(valley, x, z) {
  if (valley.outside(x, z) < 0.3) return false;
  if (z > 5.8 && Math.abs(x - trailX(z)) < 0.5) return false;
  if (z < -6 && Math.abs(x - pathX(z)) < 0.85) return false;
  return !works.some(([wx, wz, rad]) => Math.hypot(x - wx, z - wz) < rad);
}

function bankCover(m, valley, ground) {
  const r = m.rng;
  // Grass, heather and scrub over the open banks.
  // The second half of the throws falls on the south bank near the board, the ground the
  // camera looks across.
  for (let i = 0; i < 1150; i++) {
    const near = i >= 800,
      x = near ? r.range(-8, 12) : r.range(-16, 19),
      z = near ? r.range(6, 12.5) : r.range(-9.5, 19),
      y = ground(x, z),
      [e] = valley.reach(x, z),
      out = valley.outside(x, z);
    if (e < 0.15 || y > 1.5 || !clear(valley, x, z)) continue;
    const lush = 0.4 - 0.2 * smooth((Math.abs(z) - 3) / 4),
      green = fbm(x * 0.5 + 1.7, z * 0.5 - 4.2),
      heath = fbm(x * 0.9 + 13.1, z * 0.9 - 2.3);
    // Thinner far off, where it would not be seen one clump from another.
    const far = Math.max(Math.abs(x) - 11, z - 12, 0);
    if (r.next() < far * 0.25) continue;
    if (heath > 0.58 && green > lush && r.next() < 0.3) heather(m, x, y, z, r.range(0.14, 0.26));
    else if (green > lush + 0.12 && r.next() < 0.07 && out > 1.1)
      bush(m, x, y, z, r.range(0.32, 0.55), r.range(0, 0.25));
    else if (green > lush - 0.06 || (out < 1 && r.next() < 0.5))
      grassClump(m, x, y, z, r.range(0.2, 0.38), r.next() < 0.5 ? 6 : 8);
  }
  // Ferns in the shade: at the foot of the mountain, under the west skirt's pines and along
  // the upper stream.
  for (let i = 0; i < 500; i++) {
    const x = r.range(-15, 9),
      z = r.range(-10, 5),
      y = ground(x, z),
      [e] = valley.reach(x, z);
    if (e < 0.25 || y > 2.2 || !clear(valley, x, z)) continue;
    if (!(z < -5.6 || x < -6.3)) continue;
    if (fbm(x * 0.7 - 4.1, z * 0.7 + 8.2) < 0.47) continue;
    fern(m, x, y, z, r.range(0.22, 0.38), r.next() < 0.5 ? 5 : 7);
  }
  // Reeds and rushes where the banks meet the water.
  for (let i = 0; i < 2000; i++) {
    const x = r.range(-14, 20),
      z = r.range(-8, 9),
      [e, water] = valley.reach(x, z);
    if (e < -0.12 || e > 0.3 || water < -2 || !clear(valley, x, z)) continue;
    if (fbm(x * 0.8 + 2.2, z * 0.8 - 6.6) < 0.42) continue;
    const y = Math.max(ground(x, z), water);
    reeds(m, x, y, z, r.range(0.35, 0.6), r.next() < 0.5 ? 7 : 10);
  }
  // Pines of every age on the banks: saplings, young trees and a few old ones. On the south
  // and east, between the camera and the board, they stay short.
  for (const [x, z, h, rich] of [
    [-8.6, 4.2, 2.6, true],
    [-11.6, 3.1, 3.2, true],
    [-7.1, -1.6, 2.4, true],
    [-13.2, 6.9, 2.8, false],
    [-9.0, -4.0, 1.0, false],
    [-6.9, 0.9, 0.6, false],
    [-8.1, 6.2, 0.7, false],
    [-6.6, 8.6, 0.9, false],
    [-1.1, 10.2, 0.8, false],
    [5.3, 10.9, 0.9, false],
    [8.3, 8.9, 0.6, false],
    [9.6, 13.2, 1.4, false],
    [-11.0, 14.6, 1.8, false],
    [7.6, -4.6, 1.8, true],
    [10.6, -4.9, 2.4, true],
    [12.8, -6.2, 2.9, true],
    [6.6, -6.9, 0.8, false],
    [11.4, 6.6, 1.1, false],
    [14.6, 8.3, 1.6, false]
  ]) {
    const y = ground(x, z);
    pine(m, x, y, z, h, {
      lean: r.range(-1, 1),
      yaw: r.range(0, TAU),
      boughs: h < 1 ? 4 : rich ? 8 : 6,
      rich,
      spread: h < 1 ? 1.6 : 1.25
    });
    litter(m, x, y, z, 0.25 + h * 0.15, 5 + Math.round(h * 2));
  }
  // Trunks the floods threw down on the banks.
  for (const [x, z, len, yaw, rad] of [
    [-9.6, 5.2, 2.1, 0.4, 0.13],
    [8.4, 6.4, 1.8, -0.5, 0.12],
    [-7.4, -4.6, 1.6, 1.9, 0.11],
    [12.2, -4.4, 2.0, 0.2, 0.12],
    [-3.6, 13.4, 1.7, 2.6, 0.12]
  ])
    fallenTrunk(m, x, ground(x, z) - 0.03, z, len, yaw, rad, { roots: true });
}

export { bankCover };
