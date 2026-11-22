// 谷底棋臺, the last board: the valley floor where 求敗 has sat for centuries
// at a stone table, playing himself. The table is the board. Sheer cliffs
// stand on all four sides, a fall comes down the east wall into a pond that
// has worn into the table's edge, the sword mound lies to the north and the
// great eagle watches from a boulder to the west.
import { Model } from '../scenery-kit.js';
import { valleyFloor, litterFloor, cliffs, mist } from './valley-10.js';
import { slab, tileDressing } from './table-10.js';
import { swordMound } from './swords-10.js';
import { eagle } from './eagle-10.js';

function landform10(T, layout) {
  const site = new T.Group();
  site.name = '谷底與四面峭壁';
  site.userData = { kind: 'maze-scenery', occluder: false };
  const floor = new Model(T, 100003);
  valleyFloor(floor);
  litterFloor(floor);
  site.add(floor.finish('谷底亂石、落葉與潭岸'));
  const table = new Model(T, 100019);
  slab(table, layout);
  tileDressing(table, layout);
  site.add(table.finish('青石棋枰與枰上諸物'));
  site.add(cliffs(T), swordMound(T), eagle(T), mist(T));
  site.updateMatrixWorld(true);
  return site;
}

export { landform10 };
