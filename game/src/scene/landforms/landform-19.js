// 俠客島 (俠客行): the great cave hall on the hidden island. Along the north stand the carved
// walls, each cut with lines of the poem 〈俠客行〉 and the figures that go with them; stone
// pillars hold up the roof; the sea comes in at both ends of the hall through arches in the
// rock, and the south opens on the sea at the cave's mouth, where the heroes land.
//
//   kit-19.js      the plan of the hall, the floor's lie, the light, the inside-only shell
//   hall-19.js     the floor round the board, the cave wall and its openings, the buttresses
//   floor-19.js    the board's own tiles (tiles19): hewn floor, benches, herb bed, shallows
//   carving-19.js  the carved walls on the north row
//   pillars-19.js  the four pillars
//   shore-19.js    the channels' rocks, the reef, the landing and its boat, the far sea
import { Model } from '../scenery-kit.js';
import { caveFloor, caveWall, cornerButtresses } from './hall-19.js';
import { carvedWalls } from './carving-19.js';
import { pillarGroups } from './pillars-19.js';
import { shore, farSea } from './shore-19.js';
import { tiles19 } from './floor-19.js';
import { rgb, blend, alcoveLamps, lamps, lightAt } from './kit-19.js';

// The lamps that stand on the rock shelf at the back of each alcove: a bronze dish on a short
// stand, on a flat stone.
function alcoveLampStands(m) {
  for (const [x, y, z] of alcoveLamps) {
    const foot = y - 0.2,
      stone = lightAt(x, foot, z, rgb(0x6a675e), 0.5);
    m.box(x, foot - 0.02, z, 0.36, 0.1, 0.3, stone);
    m.box(x, foot + 0.035, z, 0.34, 0.012, 0.28, blend(stone, rgb(0x9a958a), 0.3));
    m.lathe(
      x,
      foot + 0.04,
      z,
      [
        [0, 0.07],
        [0.02, 0.06],
        [0.04, 0.025],
        [0.13, 0.018],
        [0.15, 0.03],
        [0.165, 0.065],
        [0.175, 0.07]
      ],
      0x7a6238,
      12
    );
  }
}
// Every flame in the hall, in one glowing batch: the alcove lamps, the pillars' hanging lamps
// and the lamps in the buttresses' niches.
function flames(T) {
  const m = new Model(T, 197207);
  m.glow(() => {
    for (const [x, y, z] of lamps) {
      m.crystal(x, y - 0.03, z, 0.03, 0.12, 0xe8963e, 0xffe1a0, 6, 0.01);
      m.crystal(x + 0.008, y - 0.03, z - 0.006, 0.016, 0.07, 0xffd27a, 0xfff2c8, 5, -0.01);
    }
  });
  return m.finish('燈火', { cast: false });
}
function landform19(T) {
  const group = new T.Group();
  group.name = '俠客島・石洞刻壁';
  const props = new Model(T, 197011);
  alcoveLampStands(props);
  group.add(
    caveFloor(T),
    caveWall(T),
    cornerButtresses(T),
    ...carvedWalls(T),
    ...pillarGroups(T),
    shore(T),
    props.finish('壁龕燈臺'),
    flames(T),
    farSea(T)
  );
  return group;
}

export { landform19, tiles19 };
