// 光明頂: the summit of the mountain seat of the 明教, high in the Kunlun range. The
// board is a terrace of bare granite with a sacred way up its middle to the altar court
// where the sacred fire burns (the game sets the brazier on tile (6,2)); the hall of the
// sacred fire stands behind it to the north, its steps coming down onto the board. The
// rock falls sheer on every side into a sea of cloud; the mountain road climbs the south
// face to the board, and in the crags to the north-west a cleft opens on the secret way.
// Snowy peaks stand round about. The camera stands to the south-east, so everything
// tall is kept north and west.
import { Model, circle } from '../scenery-kit.js';
import { setting } from '../maze-atmosphere.js';
import { kunlunRange, cloudSea } from './range-18.js';
import { oldPine } from './peaks-4.js';
import { tiles18 } from './tiles-18.js';
import { sacredHall, streamer, fireBasket } from './hall-18.js';
import {
  SPOKES,
  degrees,
  summit,
  cliffSection,
  crag,
  snowPatches,
  chasms,
  apronScree,
  ledgeLife,
  cliffPine,
  mountainRoad,
  secretWay,
  cloudBanks
} from './summit-18.js';

const hallZ = -8.35;

function landform18(T, layout) {
  const land = summit(layout),
    sections = Array.from({ length: SPOKES }, (_, i) => cliffSection(land, i));
  const group = new T.Group();
  group.name = '光明頂';

  const rock = new Model(T, 180101);
  const crowns = crag(rock, land, sections);
  snowPatches(rock, land);
  apronScree(rock, land);
  chasms(rock, layout);

  const hall = new Model(T, 180203);
  hall.frame(0, 0, hallZ, 0, 1, () => sacredHall(hall));

  const crags = new Model(T, 180307);
  secretWay(crags, land);
  mountainRoad(crags, land, sections);
  // Banners on the rocks at the board's two north corners, a fire basket by each.
  for (const [x, z, salt] of [
    [-5, -5, 4],
    [4, -5, 6]
  ]) {
    streamer(crags, x - 0.15, 0.6, z - 0.1, 2.6, 1.6, 0.5, salt);
  }
  fireBasket(crags, 3.75, land.ground(3.75, -7.1), -7.1);

  // Pines rooted in the joints of the cliff, leaning out over the drop: [bearing,
  // stratum they root in, size].
  const pines = new Model(T, 180411);
  for (const [bearing, k, size] of [
    [72, 2, 0.95],
    [104, 4, 1.3],
    [47, 4, 1.4],
    [16, 2, 0.9],
    [-18, 4, 1.3],
    [168, 2, 1.05],
    [205, 4, 1.35],
    [-70, 2, 0.95],
    [-115, 4, 1.2],
    [132, 4, 1.25],
    [88, 6, 1.4]
  ]) {
    const i = Math.round(degrees(bearing)) % SPOKES,
      a = (i * circle) / SPOKES,
      [r, y] = sections[i][k];
    cliffPine(pines, Math.cos(a) * r, y - 0.25, Math.sin(a) * r, -a + pines.rng.range(-0.3, 0.3), size);
  }
  for (const [x, y, z] of crowns) oldPine(pines, x, y - 0.1, z, 0.55, pines.rng.range(0, circle), 0.5, 3);
  // Pines on the summit ground round the hall and on the north-east knoll.
  for (const [x, z, s, yaw] of [
    [5.3, -6.9, 0.75, -0.6],
    [6.3, -5.9, 0.6, 0.3],
    [4.0, -8.3, 0.7, -1.2],
    [-2.6, -10.6, 0.65, 2.4]
  ])
    if (land.inside(x, z, 0.25)) oldPine(pines, x, land.ground(x, z), z, s, yaw, 0.6, 5);
  ledgeLife(pines, sections);

  const far = new Model(T, 180719);
  // The Kunlun range round about, its feet sunk in the cloud.
  kunlunRange(far, -7.3, setting(18).horizon);

  group.add(
    rock.finish('峰頂山岩與絕壁'),
    hall.finish('聖火大殿', { occluder: true }),
    crags.finish('秘道山石與上山石道', { occluder: true }),
    pines.finish('崖上古松', { occluder: true }),
    far.finish('崑崙雪峰', { distant: true, cast: false }),
    cloudSea(T, cloudBanks(land), 1807)
  );
  return group;
}

export { landform18, tiles18 };
