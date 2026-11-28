// 俠客島: a stand-in until the board's own landform is built. The board borrows the tile
// language of an earlier board (maze-scenery.js LOOKS) and adds nothing of its own yet.
function landform19(T) {
  const group = new T.Group();
  group.name = '俠客島';
  return group;
}
const tiles19 = {};

export { landform19, tiles19 };
