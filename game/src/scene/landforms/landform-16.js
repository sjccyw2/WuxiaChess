// 石樑溫家: the court of the 溫 house in the Zhejiang hills (碧血劍), by a hazy daylight. The board
// is the brick-paved court. A stone beam bridge (石樑) crosses the ravine on its south side
// from the landing where the heroes start; stone lions sit at both bridgeheads. The great hall
// stands to the north on its terrace, with the family's flagpole stones and censers before it;
// the east and west wings close the court, their horse-head gables standing on the ravine's
// lip; the screen wall rises in the middle of the court with the five element stones of the
// brothers' 五行陣 round it. Behind the house the hill rises in bamboo and camphor; south of the
// ravine a grassy slope falls away; misty ranges close the view.
import { Model } from '../scenery-kit.js';
import { ground, plainLitter, beamBridge } from './paving-16.js';
import { coverTile, rockTile, bambooClump, herbBed, censer, flagpole } from './props-16.js';
import { greatHall, wing, eastGallery, eastGarden, rearCourt, PLAT } from './house-16.js';
import { ravine, ravineLife, grounds, groundCover, farHills, mistBanks, heightS } from './ravine-16.js';
import { hillWoods, bambooGroves, courtTrees, southWoods, osmanthus } from './woods-16.js';
import { pottedPine, taihuRock, bamboo, clump } from './garden-13.js';
import { walk, CX, CZ, TOP, granite, graniteShade, bronze, bronzeDark, verdigris, put, slab } from './kit-16.js';

// The court round the board, outside its tiles, out to the hall's terrace, the west wing and the
// east gallery and down to the ravine's lip; the north-east corner is the little garden.
// Where the ravine's north lip runs, by x (the board's own south and west edges).
function courtLip(x) {
  if (x < -5.5) return -1;
  if (x < -4.5) return 0;
  if (x < -3.5) return 1;
  if (x < -2.5) return 2;
  if (x < 2.5) return 4;
  if (x < 4.5) return 3;
  return 2;
}
const inGarden = (x, z) => (x > 4.5 && z < -2) || (x > 3.5 && z > -3 && z < -2);
function courtFill(m) {
  const rows = [-6.75, -6.5];
  for (let z = -6.0; z <= 4.0; z += 0.5) rows.push(z);
  for (let x = -6.5; x < 7.12; x += 0.5) {
    const xb = Math.min(x + 0.5, 7.12),
      cx = (x + xb) / 2;
    for (let i = 0; i < rows.length - 1; i++) {
      const z = rows[i],
        z1 = rows[i + 1],
        cz = (z + z1) / 2;
      if (walk.has(Math.round(cx + CX) + ',' + Math.round(cz + CZ))) continue;
      if (Math.abs(cx) < 1.95 && cz < -6.05) continue;
      if (cz > courtLip(cx)) continue;
      put(m, [[x, -0.01, z], [xb, -0.01, z], [xb, -0.01, z1], [x, -0.01, z1]], 0x51554f);
      if (inGarden(cx, cz)) {
        // Moss and dark earth, a few fallen leaves.
        put(m, [[x, 0.004, z], [xb, 0.004, z], [xb, 0.004, z1], [x, 0.004, z1]], [[x, z], [xb, z], [xb, z1], [x, z1]].map(([u, v]) => m.mix(0x55683f, 0x6f6450, 0.5 + 0.5 * Math.sin(u * 2.1 + v * 1.3))));
        continue;
      }
      put(m, [[x + 0.012, 0, z + 0.012], [xb - 0.012, 0, z + 0.012], [xb - 0.012, 0, z1 - 0.012], [x + 0.012, 0, z1 - 0.012]], m.mix(0x8b8e88, 0xa3a59e, m.rng.next() * 0.6));
    }
  }
}
// The little garden in the court's north-east corner: a pierced rock, an osmanthus, bamboo in
// the angle of the gallery, and low flowering plants.
function cornerGarden(m) {
  const r = m.rng;
  taihuRock(m, 5.75, -3.05, 0.62, 0);
  osmanthus(m, 5.85, 0, -5.35, 0.78);
  bamboo(m, 6.8, -4.1, 0.75, 6);
  for (const [x, z] of [
    [4.95, -2.45],
    [6.4, -2.4],
    [5.1, -4.3],
    [6.6, -3.3],
    [4.9, -3.6]
  ]) {
    clump(m, x, 0.12, z, 0.24, 0.16, 0.22, 0x2f4a2c, 0x5f8048, 6);
    const col = r.pick([0xd8566b, 0xf2d6dc, 0xe8c86a, 0xb88ac0]);
    for (let k = 0; k < 3; k++) m.box(x + r.range(-0.15, 0.15), 0.25 + r.range(0, 0.05), z + r.range(-0.12, 0.12), 0.06, 0.04, 0.06, col);
  }
  // A grey brick kerb along the gallery's foot.
  slab(m, 7.0, 7.12, 0, 0.08, -6.45, -2.05, 0x6f7472);
}
// A great bronze water vat on a stone stand, kept full against fire.
function waterVat(m, x, z) {
  m.frame(x, 0, z, 0, 1, () => {
    slab(m, -0.34, 0.34, 0, 0.1, -0.34, 0.34, graniteShade);
    m.lathe(0, 0.1, 0, [[0, 0.2], [0.04, 0.25], [0.18, 0.31], [0.36, 0.3], [0.44, 0.27], [0.47, 0.29], [0.46, 0.25], [0.43, 0]], m.mix(bronze, verdigris, 0.35), 14);
    m.lathe(0, 0.53, 0, [[0, 0.25], [0.004, 0.25]], 0x3b5552, 14);
    for (const s of [-1, 1]) m.hoop(s * 0.3, 0.4, 0, 0.05, 0.012, bronzeDark, 8, 'yz', Math.PI / 2);
    // A few lotus pads afloat.
    for (const [a, d] of [[0.5, 0.12], [2.4, 0.15], [4.2, 0.08]]) {
      const cx = Math.cos(a) * d,
        cz = Math.sin(a) * d;
      const pts = [];
      for (let i = 0; i < 8; i++) pts.push([cx + Math.cos(i * 0.785) * 0.06, 0.535, cz + Math.sin(i * 0.785) * 0.06]);
      put(m, pts, 0x5a8048);
    }
  });
}
// A glazed flower pot of 蘭 on a low stand.
function orchidPot(m, x, y, z) {
  const r = m.rng;
  m.frame(x, y, z, r.range(0, 6), 1, () => {
    m.lathe(0, 0, 0, [[0, 0.1], [0.03, 0.13], [0.2, 0.16], [0.22, 0.17], [0.21, 0]], 0x3f6a72, 10);
    for (let k = 0; k < 9; k++) {
      const a = (k * 6.283) / 9 + r.range(0, 0.4),
        l = r.range(0.2, 0.32);
      m.leaf([0, 0.21, 0], [Math.cos(a) * l, 0.21 + l * 0.6, Math.sin(a) * l], 0.02, 0x3d6a3a, 0x6d9a58, 0.06);
    }
  });
}
// 界碑: a stone tablet at the head of the path on the landing's side, under a little stone roof,
// with the family's name cut in it.
function boundaryStone(m, x, z) {
  const y = heightS(x, z);
  m.frame(x, y, z, 2.6, 1, () => {
    slab(m, -0.34, 0.34, -0.05, 0.14, -0.2, 0.2, graniteShade);
    slab(m, -0.26, 0.26, 0.14, 0.95, -0.07, 0.07, granite);
    slab(m, -0.19, 0.19, 0.25, 0.85, 0.07, 0.075, graniteShade);
    for (let i = 0; i < 4; i++) slab(m, -0.04, 0.04, 0.32 + i * 0.13, 0.4 + i * 0.13, 0.075, 0.08, 0x4a4944);
    slab(m, -0.34, 0.34, 0.95, 1.0, -0.13, 0.13, graniteShade);
    put(m, [[-0.36, 1.0, -0.15], [0.36, 1.0, -0.15], [0.3, 1.1, 0], [-0.3, 1.1, 0]], granite, [0, 1, -1]);
    put(m, [[-0.36, 1.0, 0.15], [0.36, 1.0, 0.15], [0.3, 1.1, 0], [-0.3, 1.1, 0]], granite, [0, 1, 1]);
  });
}
function furnishings(m) {
  boundaryStone(m, -1.15, 7.0);
  courtFill(m);
  cornerGarden(m);
  // The family's two flagpole stones flank the front of the hall, beyond the board's edge.
  for (const s of [-1, 1]) m.frame(s * 4.1, -TOP, -5.55, 0, 1, () => flagpole(m));
  waterVat(m, -5.55, -5.45);
  m.frame(-6.0, 0, -4.5, 0, 1, () => {
    slab(m, -0.2, 0.2, 0, 0.12, -0.2, 0.2, granite);
    pottedPine(m, 0, 0, 0.9);
  });
  // Orchids along the hall's terrace edge, either side of the steps.
  for (const s of [-1, 1]) for (const x of [2.5, 3.1]) orchidPot(m, s * x, PLAT, -6.95);
}

const tiles16 = {
  ground,
  plain: plainLitter,
  bridge: beamBridge,
  cover: coverTile,
  bamboo: bambooClump,
  herbs: herbBed,
  rock: rockTile,
  crate: (m) => censer(m)
};

function landform16(T) {
  const group = new T.Group();
  group.name = '石樑溫家';
  const parts = [
    [160411, greatHall, '溫家大堂', { occluder: true }],
    [160829, (m) => wing(m, -1), '西廂房', { occluder: true }],
    [161237, eastGallery, '東遊廊與月洞門', { occluder: true }],
    [161447, eastGarden, '東園書房', { occluder: true }],
    [161653, rearCourt, '後院、後樓與圍牆', { occluder: true }],
    [162067, furnishings, '院中陳設', {}],
    [162481, (m) => {
      ravine(m);
      grounds(m);
    }, '山澗、溪水與坡地', {}],
    [162893, (m) => {
      ravineLife(m);
      groundCover(m);
    }, '澗壁草木與坡上草石', {}],
    [163307, (m) => {
      hillWoods(m);
      courtTrees(m);
      southWoods(m);
    }, '古樹與松林', {}],
    [163721, bambooGroves, '屋後竹林', {}],
    [164137, (m) => {
      farHills(m);
      mistBanks(m);
    }, '遠山與山霧', { distant: true, cast: false }]
  ];
  for (const [seed, draw, name, options] of parts) {
    const m = new Model(T, seed);
    draw(m);
    group.add(m.finish(name, options));
  }
  return group;
}

export { landform16, tiles16 };
