// Things on a board that are not people (battles.js `objects`; decision Q-N22: whatever is
// defended or destroyed is an object, never a person). Some boards' 戰意 is not pressed on a man
// but fixed in a thing (破: break it and everyone wakes) or turned on a thing of ours (守: keep it
// whole until the borrowed thought runs out).
//
//   kind   'keep': the heroes keep it, the black stones strike it; it breaking loses the board.
//          'break': the heroes strike it; breaking every one wins the board.
//   row    the stage row (game.js stageRows) whose 氣血 and 防禦 it is measured against
//   hp     its 氣血 as a share of that row's
//   def    added to that row's 防禦
//   lure   how much rather a black stone strikes a 'keep' object than a hero it could strike as
//          well: taken off the object's cost as a target, on the scale of 氣血 (enemy turn)
//   pull   how far the black stones' walk is drawn to a 'keep' object: it counts as this many
//          steps nearer than it is, so they march on it and fight whoever stands in the way
//   traits as a villain's (encounters.js): only `ward`, the share it takes off its master's blows
//   art    its picture, game/assets/object-<art>.webp, and the broken one object-<art>-broken.webp
//   size   its height on the board, as a share of a fighter's (never wider than a tile and a half)
//   measure  the measure word it is counted with (星索樁兩根, 鐵籠兩口); '根' when not given
//   fall   what a 'break' object does as it breaks, in the log (倒了, 破了); '倒了' when not given
//
// An object takes no turn, never strikes or counters, cannot be pushed, and takes no condition.
// Its ids are kept in saves, like a piece's. Its story lines are its board's
// (encounter-script.js `objects`).
const BOARD_OBJECTS = {
  guqin: {
    kind: 'keep',
    map: 4,
    name: '七弦琴',
    role: '守物',
    school: '空山琴臺',
    art: 'qin',
    size: 0.62,
    row: 'master',
    hp: 0.62,
    def: 0,
    lure: 60,
    pull: 10,
    bio: '琴臺上一張七弦琴，擱在矮石琴座上，絃上積了一層薄灰。〈笑傲江湖〉這一曲，原是一張琴、一管簫合奏的；嵩山派恨這一曲，恨了半輩子。這一局的戰意對著它：琴斷，這一局便輸了。'
  },
  warDrum: {
    kind: 'keep',
    map: 6,
    name: '城頭戰鼓',
    role: '守物',
    school: '襄陽殘垣',
    art: 'drum',
    size: 0.85,
    row: 'master',
    hp: 0.7,
    def: 2,
    lure: 60,
    pull: 10,
    bio: '襄陽城頭的戰鼓，紅漆剝落，蒙皮已舊，兩根鼓槌插在架上。城上無人，更鼓不響；這一局的戰意卻對著它。鼓破，這一局便輸了。'
  },
  starPost: {
    kind: 'break',
    map: 9,
    name: '星索樁',
    role: '破物',
    school: '無刻漏臺',
    art: 'starPost',
    size: 1.15,
    row: 'lieutenant',
    hp: 0.62,
    def: 4,
    traits: { ward: 35 },
    bio: '青銅鑄的索樁，八面刻滿星圖。一股星索從盤外垂下，在樁上打了個死結，再牽到慕容博身上。樁在一日，索便不斷；倒一根，他身上的遮護便卸三成半。兩根俱倒，壓在這一局的戰意便散了。'
  },
  // The boards added on 2026-11-28.
  cage: {
    kind: 'break',
    map: 17,
    name: '鐵籠',
    role: '破物',
    school: '萬安寺',
    art: 'cage',
    size: 1.0,
    measure: '口',
    fall: '破了',
    row: 'lieutenant',
    hp: 0.6,
    def: 3,
    bio: '寺牆下一口黑鐵籠，鐵鍊鎖得極牢，籠裡卻只有一領草蓆、一串念珠。這一局的戰意鎖在籠裡：兩口鐵籠都打破了，戰意才散。'
  },
  holyFire: {
    kind: 'keep',
    map: 18,
    name: '聖火',
    role: '守物',
    school: '光明頂',
    art: 'holyFire',
    size: 0.8,
    row: 'master',
    hp: 0.8,
    def: 2,
    lure: 60,
    pull: 10,
    bio: '光明頂大殿前石壇上的一盆聖火，銅盆三足，火頭極旺。這一局的戰意對著它：火滅了，這一局便輸了。'
  }
};

// The name each kind goes by in the briefing and the wiki.
const OBJECT_KINDS = { keep: '守物', break: '破物' };

export { BOARD_OBJECTS, OBJECT_KINDS };
