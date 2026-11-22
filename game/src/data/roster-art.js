// Characters painted with a sheet and a portrait of their own, by the id their files are named
// with. The art is from asset-gen/jianying-roster-art, whose README names each character;
// tools/roster-art.py makes these files from it:
//   motion-<id>.webp  the full-size sprite sheet, five rows (actors/sprite-sheets.js)
//   poses-<id>.png    the same sheet at half size, drawn while the full one loads
//   mini-<id>.webp    a still of the first idle frame, drawn if neither sheet can be
//   npc-<id>.webp     the portrait, 400 x 400, head and shoulders
// A piece whose description has `mini: '<id>'` is drawn as that character and wears that
// portrait (on the enemy page, in the strike forecast, in a cut-in and on the wiki), whatever
// seat it fills. Nothing is fetched until a piece on the board is drawn with it.
const ROSTER_ART = [
  'fengTiannan',
  'zhaoZhong',
  'wanYan',
  'xianYu',
  'wanZhen',
  'fiveTiger',
  'qingShield',
  'jinBow',
  'huaBlade',
  'wanDisciple',
  // the ten heroes: their portrait is 588 x 588, and they have a figure-<id>.webp as well
  'qiaoFeng',
  'xuZhu',
  'hongQi',
  'yaoShi',
  'sanFeng',
  'zhaoMin',
  'lingSu',
  'diYun',
  'chengZhi',
  'aQing'
];
const rosterPortrait = (id) => (ROSTER_ART.includes(id) ? 'npc-' + id + '.webp' : null);

export { ROSTER_ART, rosterPortrait };
