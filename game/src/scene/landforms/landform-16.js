// 石樑溫家: a stand-in until the board's own landform is built. The board borrows the tile
// language of an earlier board (maze-scenery.js LOOKS) and adds nothing of its own yet.
function landform16(T) {
  const group = new T.Group();
  group.name = '石樑溫家';
  return group;
}
const tiles16 = {};

export { landform16, tiles16 };
