// 俠客島 (俠客行): the great cave hall on the hidden island. Along the north stand the carved
// walls, each cut with lines of the poem 〈俠客行〉 and the figures that go with them; stone
// pillars hold up the roof; the sea comes in at both ends of the hall through arches in the
// rock, and the south opens on the sea at the cave's mouth, where the heroes land.
import { caveFloor, caveWall, cornerButtresses } from './hall-19.js';

function landform19(T) {
  const group = new T.Group();
  group.name = '俠客島';
  group.add(caveFloor(T), caveWall(T), cornerButtresses(T));
  return group;
}
const tiles19 = {};

export { landform19, tiles19 };
