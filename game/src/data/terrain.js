// Rows run north to south, columns west to east. All maps use the same movement rules.
const TERRAIN = {
  '.': 'plain',
  '=': 'bridge',
  '~': 'reeds',
  m: 'cover',
  b: 'bamboo',
  h: 'herbs',
  R: 'rock',
  C: 'crate'
};

const TERRAIN_TYPES = {
  plain: { name: '渡口石坪', cost: 1, defense: 0, note: '平坦石路，移動消耗 1 步。' },
  bridge: { name: '木棧橋', cost: 1, defense: 0, note: '跨過水渠，移動消耗 1 步。' },
  reeds: { name: '蘆葦淺灘', cost: 2, defense: 0, note: '涉水而行，移動消耗 2 步。' },
  cover: { name: '苔石掩體', cost: 1, defense: 3, note: '移動消耗 1 步，防禦增加 3 點。' },
  bamboo: { name: '疏竹林', cost: 2, defense: 5, note: '移動消耗 2 步，防禦增加 5 點。' },
  herbs: {
    name: '藥草地',
    cost: 1,
    defense: 0,
    heal: 12,
    note: '移動消耗 1 步。駐足至己方回合結束，可回復 12 點氣血。'
  },
  rock: { name: '太湖石', cost: Infinity, defense: 0, note: '巨石阻路，須繞道。' },
  crate: { name: '渡口茶箱', cost: Infinity, defense: 0, note: '堆疊的貨箱封住此格，須繞道。' }
};

const fields = [
  {
    name: '青竹渡',
    shapeName: '雙岸竹渡',
    mask: [
      '..###...##.',
      '.#####.####',
      '#####..####',
      '###########',
      '######..##.',
      '.####...###',
      '.#####.####',
      '###########',
      '######.####',
      '.####..###.',
      '..##....##.'
    ],
    rows: [
      'bb..m.~..bb',
      'b.R...~.m.b',
      '.b.h..~.C..',
      '.mb...=..m.',
      '..R...~.b..',
      '..m.C.~....',
      '.h....~.R.b',
      '..m...=..b.',
      '.C.bb.~.hm.',
      'b..m..~..C.',
      'bb....~..mb'
    ],
    allies: [
      [3, 7],
      [2, 8],
      [5, 8],
      [4, 9],
      [1, 7]
    ],
    enemies: [
      [8, 1],
      [5, 4],
      [3, 2],
      [7, 6]
    ],
    objective: [8, 8],
    tactic: '兩岸竹洲隔著深水，渡江只通南北兩座木橋。西岸有竹蔭與藥圃，東岸守軍扼住橋頭。'
  },
  {
    name: '紅楓驛',
    shapeName: '丁字驛道',
    mask: [
      '..........###.',
      '........######',
      '........######',
      '.#############',
      '##############',
      '##############',
      '#############.',
      '#############.',
      '........######',
      '.........#####',
      '.........####.'
    ],
    rows: [
      'bb..C.bm..b.Cb',
      '.b.hC.C..mb.h.',
      'm..m..m.C..m.b',
      '.CC.b.C..h..C.',
      '..m.C.Cb..m..m',
      '........m..m..',
      '.m..C.C.m....C',
      'b...b.C.mC.C.m',
      'm.h.m...m....h',
      'b.CC..C.bb..mb',
      '.b....m.C.bb..'
    ],
    allies: [
      [1, 5],
      [1, 4],
      [1, 6],
      [0, 7],
      [2, 7]
    ],
    enemies: [
      [12, 5],
      [5, 5],
      [8, 3],
      [12, 8]
    ],
    objective: [12, 1],
    names: {
      plain: '驛道青磚',
      cover: '繫馬石墩',
      bamboo: '紅楓疏林',
      herbs: '驛舍藥圃',
      crate: '封泥驛箱'
    },
    tactic: '馬廄驛道橫接東院，驛舍和藥圃在北岔盡頭。紅楓遮住南岔，借繫馬石墩可正面逼近東門。'
  },
  {
    name: '蘆花汀',
    shapeName: '三汊蘆洲',
    mask: [
      '.##..##..##.',
      '###..##..###',
      '###..###.###',
      '#######..###',
      '###.########',
      '.##.###..###',
      '.###.##..##.',
      '..##.#######',
      '#######..###',
      '###..###..##',
      '###..##..###',
      '#######.####',
      '.##..######.'
    ],
    rows: [
      'bb.~~mb~~.mb',
      '.h.~~..~~.b.',
      'Rm.~~h.~~m.h',
      '.m.==.m~~...',
      'b..~~b.==.mm',
      '~b.~~Rm~~mC.',
      '.h.~~..~~.h.',
      'C.m~~.m==.bb',
      '.m.==..~~...',
      'b..~~.m~~.m.',
      'bb.~~b.~~.Rb',
      'b.m==.h~~.m.',
      '.h.~~m.==.h.'
    ],
    allies: [
      [1, 11],
      [2, 11],
      [2, 10],
      [0, 9],
      [1, 12]
    ],
    enemies: [
      [9, 1],
      [6, 4],
      [9, 3],
      [11, 7]
    ],
    objective: [10, 12],
    names: {
      plain: '汀上沙脊',
      bridge: '沙洲木橋',
      reeds: '蘆花淺水',
      cover: '汀岸矮石',
      bamboo: '密蘆叢',
      herbs: '水畔藥草',
      rock: '汀心礁石',
      crate: '漁具簍箱'
    },
    tactic: '河水分流成三條沙洲。循蘆岸與散布南北的短木橋換汊，可以北取漁寨，也可南訪藥洲。'
  },
  {
    name: '聽雪棧',
    shapeName: '迴折絕棧',
    mask: [
      '..#######..',
      '..########.',
      '......####.',
      '..#########',
      '###########',
      '####.#.....',
      '##########.',
      '.#########.',
      '......#####',
      '..#########',
      '##########.',
      '#####......',
      '.###.......',
      '.########..',
      '..######...'
    ],
    rows: [
      'Rbm...m..bR',
      'b..hR...m.b',
      'RR.mRRR.mRR',
      'b.m..~.Rb.h',
      '.h.R.=.m..R',
      'R.mRR~RR.mR',
      '.b..m~..R..',
      'R.mR.~b..h.',
      'RR.mRR.m.RR',
      '.b...m...b.',
      'R.m..b.m..R',
      '.b.mRb.R.m.',
      'RR..RRR..RR',
      'bh.m...m.hb',
      'R.bmh..m.bR'
    ],
    allies: [
      [3, 13],
      [4, 14],
      [2, 13],
      [5, 13],
      [3, 14]
    ],
    enemies: [
      [5, 1],
      [6, 3],
      [8, 1],
      [2, 9]
    ],
    objective: [10, 3],
    names: {
      plain: '覆雪棧道',
      bridge: '雪溝木棧',
      reeds: '融雪寒溝',
      cover: '避風矮石',
      bamboo: '雪松疏林',
      herbs: '雪蓮簇',
      rock: '斷崖冰岩'
    },
    tactic: '疊棧在南北絕壁間折返。山腰有一道融雪石梁可直上北棧，東側的雪蓮小徑通往藥坪。'
  },
  {
    name: '空山琴臺',
    shapeName: '束腰琴臺',
    mask: [
      '..########...',
      '..#######....',
      '...#####.....',
      '....####.....',
      '..########...',
      '#############',
      '#############',
      '.###########.',
      '..#########..',
      '...#######...',
      '....#####....',
      '...#######...',
      '.###########.'
    ],
    rows: [
      'b..hm..h..b.b',
      '.m..b..m.m.m.',
      'bR.m...m.RbR.',
      '.m.RR.RR.m..m',
      '..R.m.m.R....',
      'h.m..m..m.h.h',
      '..R.m.m.R....',
      '.m.RR.RR.m.m.',
      'bR.m...m.RbR.',
      '.h..m.m..h..b',
      'b..m..m...bm.',
      '.m..b..m...h.',
      'b..m.h.m..m.b'
    ],
    allies: [
      [5, 1],
      [4, 1],
      [6, 1],
      [3, 2],
      [7, 2]
    ],
    enemies: [
      [6, 11],
      [5, 8],
      [11, 7],
      [2, 7]
    ],
    objective: [12, 5],
    names: {
      plain: '琴臺石階',
      cover: '琴座矮石',
      bamboo: '山竹林',
      herbs: '玉簪花叢',
      rock: '回音石屏'
    },
    tactic: '琴臺石屏收束成狹腰。穿過瓶頸踏入闊臺，能從東翼花圃與南席兩邊包抄守臺人。'
  },
  {
    name: '桃花石陣',
    shapeName: '八卦環陣',
    mask: [
      '....######....',
      '...########...',
      '..##########..',
      '.############.',
      '#####...######',
      '####.....#####',
      '####.....#####',
      '#####...######',
      '##############',
      '##############',
      '.############.',
      '..##########..',
      '...#######....'
    ],
    rows: [
      'bb.h...b..b.mb',
      '.RRRR..RR.bR..',
      'b...R.mb.h...m',
      'b.R.RRR.R.m.R.',
      'h.R..m..R.b.Rb',
      '.R.bRRR..h..h.',
      '.R.mR...R.bR.m',
      'mRR.R.RRR....b',
      'b...R.m..b.R..',
      'h.m.b..R.Rb.R.',
      '.b..m..bh.b.hm',
      '.mR.R..m.R.bh.',
      'b..h..b..m...b'
    ],
    allies: [
      [1, 9],
      [2, 10],
      [0, 9],
      [3, 11],
      [3, 12]
    ],
    enemies: [
      [11, 2],
      [3, 4],
      [9, 3],
      [13, 4]
    ],
    objective: [12, 10],
    names: {
      plain: '落英石徑',
      cover: '陣中矮石',
      bamboo: '桃花叢',
      herbs: '桃溪藥圃',
      rock: '陣眼奇石'
    },
    tactic: '桃石之間藏著一口無底陣井，北門與南徑皆可繞行。東門外的桃溪藥圃在重重石屏後方。'
  },
  {
    name: '襄陽殘垣',
    shapeName: '三翼甕城',
    mask: [
      '..#############.',
      '################',
      '#######...#####.',
      '.#####..........',
      '.############...',
      '###############.',
      '##############..',
      '.#####..........',
      '.#####..........',
      '##############..',
      '################',
      '.##############.',
      '...#######......'
    ],
    rows: [
      'C..m..b...C.m..C',
      '.h.C.m.R.m.m..h.',
      '.b..m..C.h..C..m',
      'RR.mR.RR.mRRR.mR',
      '.Cm..b..mC....m.',
      'm...C.mR...C..m.',
      'RR.mR.mRR.RR.mRR',
      '..C...C..h..h...',
      '.m..b.m..C...C.m',
      'b..h...b..mm..h.',
      'C.m...m..bC.m.b.',
      'b..m..C...m..h.b',
      'Cm..b..m..C..m.b'
    ],
    allies: [
      [3, 7],
      [4, 7],
      [2, 8],
      [1, 7],
      [5, 8]
    ],
    enemies: [
      [12, 1],
      [12, 4],
      [14, 5],
      [8, 5]
    ],
    objective: [14, 1],
    names: {
      plain: '城門甬道',
      cover: '斷牆掩體',
      bamboo: '城根荒藤',
      herbs: '城下藥畦',
      rock: '坍塌城磚',
      crate: '軍械箱'
    },
    tactic: '三重女牆由西面甬道相連。中央軍營的一段城牆已坍塌，穿過它可以縮短趕往東甕城的路。'
  },
  {
    name: '寒玉石室',
    shapeName: '雙窟玉門',
    mask: [
      '..######....',
      '.#########..',
      '###########.',
      '############',
      '..#######...',
      '....###.....',
      '...#####....',
      '.##########.',
      '############',
      '###########.',
      '.##########.',
      '...########.'
    ],
    rows: [
      'RR..m~...RRR',
      'R.h.R~R..mR.',
      '..m.R~R.b...',
      '.R.m.=.m.R.m',
      'RR.R.~.R.RRR',
      'h..m.~.m..bh',
      'RR.R.~.R.RRR',
      '.R.m.=.m.R..',
      '..b.R~R.m..m',
      'R.m.R~R.h.R.',
      'RR...~m..RRR',
      'R..mh~.m..hR'
    ],
    allies: [
      [8, 10],
      [8, 11],
      [8, 9],
      [9, 8],
      [7, 10]
    ],
    enemies: [
      [2, 2],
      [4, 3],
      [2, 1],
      [11, 3]
    ],
    objective: [10, 11],
    names: {
      plain: '青玉甬道',
      bridge: '寒泉石樑',
      reeds: '沁骨寒泉',
      cover: '玉臺殘座',
      bamboo: '垂冰石簾',
      herbs: '寒玉藥泉',
      rock: '寒玉石壁'
    },
    tactic: '上下兩座石窟只隔一道寒泉石頸。北窟的守軍依鐵壁設防，南窟東隅仍湧著一泓藥泉。'
  },
  {
    name: '倒影天街',
    shapeName: '雁行曲街',
    mask: [
      '########.......',
      '########.......',
      '.##########....',
      '..############.',
      '....###########',
      '.....#########.',
      '....########...',
      '..#########....',
      '...##########..',
      '......#########',
      '........#######',
      '.........######'
    ],
    rows: [
      'bC.~.m.~.Cb~.Cb',
      '.h.~C..~.m.~.h.',
      'm..=.b.~..C=m..',
      '.C.~..m=..b~.mC',
      '.m.~mC.~.C.~b..',
      'h..~...~..h~.h.',
      'C..~.Cm~.m.~..m',
      '.b.=m..~.C.=m..',
      '.C.~.m.=..m~.C.',
      '.m.~..C~.h.~m..',
      'b..~C..~..b~.mb',
      '.m.=.m.=.b.=.m.'
    ],
    allies: [
      [13, 9],
      [14, 9],
      [12, 9],
      [13, 10],
      [12, 10]
    ],
    enemies: [
      [1, 2],
      [4, 3],
      [12, 4],
      [6, 6]
    ],
    objective: [1, 1],
    names: {
      plain: '倒影街衢',
      bridge: '跨渠廊橋',
      reeds: '照影水渠',
      cover: '坊間石墩',
      bamboo: '庭院榕叢',
      herbs: '藥鋪花圃',
      crate: '茶行貨箱'
    },
    tactic: '重樓依雲階迂迴而起，東南坊與西北坊隔空相望。循可落腳的廊橋轉折，能避開斷街。'
  },
  {
    name: '無刻漏臺',
    shapeName: '四門環漏',
    mask: [
      '.....#####.....',
      '....#######....',
      '..###########..',
      '.#############.',
      '..####...####..',
      '.####.....####.',
      '#####.....#####',
      '####.......####',
      '#####.....#####',
      '.####.....####.',
      '..####...####..',
      '.#############.',
      '..###########..',
      '....#######....',
      '.....#####.....'
    ],
    rows: [
      'b.b.m.m.b.b.m.b',
      '.h..R.R..h..~h.',
      'm.~~m~m~~.mm~m.',
      '..~RRRRR~...~.R',
      'R.mR.m.Rm.R.=m.',
      '.m=.m.m.=m.m.m.',
      'R.mR.m.Rm.R.=m.',
      '..~RR.RR~...~.R',
      'm.~~m.m~~.mm~m.',
      '.h..m.m..h..~h.',
      'b..m...m..b.~.b',
      'b.m..m.m..m..m.',
      'm.~~m=~m=m~~~m.',
      '.h..m...m..mh..',
      'b..m..b..m..m.b'
    ],
    allies: [
      [7, 12],
      [6, 13],
      [8, 13],
      [5, 13],
      [9, 12]
    ],
    enemies: [
      [7, 1],
      [2, 6],
      [11, 5],
      [3, 11]
    ],
    objective: [11, 9],
    names: {
      plain: '漏臺刻盤',
      bridge: '銅閘踏板',
      reeds: '逆流水槽',
      cover: '銅漏石座',
      bamboo: '星刻柱陣',
      herbs: '漏臺靈草',
      rock: '刻度石壁'
    },
    tactic:
      '漏盤臺心已塌作星淵，東西雙廊環繞四門。兩根星索樁各替慕容博化去三成半傷害，樁旁各有守索人；須循環廊逐一破樁。'
  },
  // The boards from here on are each built round one villain (battles.js): a run meets some of
  // them in place of the earlier boards of the same stage (journey.js routeFor).
  {
    name: '神龍竹堂',
    shapeName: '孤島竹堂',
    mask: [
      '...######...',
      '..########..',
      '.##########.',
      '############',
      '############',
      '############',
      '############',
      '############',
      '.##########.',
      '.##########.',
      '..########..',
      '...######...'
    ],
    rows: [
      '...bm..mb...',
      '..bb.C..bb..',
      '.bb.m..m.bb.',
      'bb~.......~b',
      'b~~..h.R.~~.',
      '.~~.b...m.~.',
      '....R..b...C',
      '.m.b.....m..',
      '.h..m..C..b.',
      '.bb......bh.',
      '..b......b..',
      '...b....b...'
    ],
    allies: [
      [5, 10],
      [6, 10],
      [4, 9],
      [7, 9],
      [5, 11]
    ],
    enemies: [
      [6, 1],
      [3, 4],
      [8, 4],
      [6, 3]
    ],
    objective: [10, 6],
    names: {
      plain: '島上沙徑',
      bridge: '竹排',
      reeds: '蛇草淺沼',
      cover: '礁岸矮石',
      bamboo: '毛竹林',
      herbs: '雄黃藥圃',
      rock: '嶙峋礁岩',
      crate: '蛇簍竹籠'
    },
    tactic: '孤島南灘可以登岸，北面竹堂之前築有高臺。兩翼蛇草淺沼難行，毛竹林可以藏身；西南與東岸各有一片雄黃藥圃。'
  },
  {
    name: '絕情花徑',
    shapeName: '環潭花徑',
    mask: [
      '..###########',
      '.############',
      '#############',
      '#############',
      '######..#####',
      '#####....####',
      '######..#####',
      '#############',
      '#############',
      '.###########.',
      '..#########..'
    ],
    rows: [
      '..b.m...b.C.R',
      '.bb...bb....R',
      'b...b..b..m..',
      '..m.bb.....h.',
      '.....b..b.m..',
      '..h.b....b...',
      '.m..bb..bb.m.',
      '.....~~~.....',
      'b.m..~h~..b.b',
      '.bb.......bb.',
      '..bbb.m.bbb..'
    ],
    allies: [
      [0, 4],
      [1, 5],
      [0, 6],
      [1, 3],
      [1, 7]
    ],
    enemies: [
      [11, 2],
      [8, 2],
      [9, 7],
      [7, 3]
    ],
    objective: [6, 8],
    names: {
      plain: '谷中石徑',
      bridge: '石樑',
      reeds: '潭畔淺水',
      cover: '谷中山石',
      bamboo: '情花叢',
      herbs: '斷腸草圃',
      rock: '谷壁巨石',
      crate: '丹房藥櫃'
    },
    tactic: '石徑繞著谷心深潭分作南北兩路，路旁盡是情花叢，花叢可以藏身，卻走不快。西首入谷，東北角是谷主的石屋；潭南水畔有一圃斷腸草。'
  },
  {
    name: '鐵掌溪灘',
    shapeName: '隔溪兩岸',
    mask: [
      '..########..',
      '.##########.',
      '############',
      '############',
      '############',
      '############',
      '############',
      '############',
      '############',
      '############',
      '.##########.',
      '..########..'
    ],
    rows: [
      '..Rb.mm.bR..',
      '.b...C....b.',
      'b.m......m.b',
      '..R..h....R.',
      '~~~.~~~~m~~~',
      '~~m~~.~~~~.~',
      '~.~~~R~~.~~~',
      '~~~.~~~m~.~~',
      '.m....b...m.',
      'b..C.....h.b',
      '.b...m....b.',
      '..bR....Rb..'
    ],
    allies: [
      [4, 10],
      [6, 10],
      [5, 9],
      [7, 9],
      [5, 11]
    ],
    enemies: [
      [6, 1],
      [3, 4],
      [8, 6],
      [6, 3]
    ],
    objective: [1, 6],
    names: {
      plain: '溪岸與踏腳石',
      bridge: '獨木橋',
      reeds: '湍溪淺水',
      cover: '灘石與石樁',
      bamboo: '岸邊松叢',
      herbs: '山藥坡',
      rock: '山溪巨岩',
      crate: '幫眾貨擔'
    },
    tactic: '一道湍溪橫在南北兩岸之間，涉水極慢，只有幾塊踏腳石與石樁可以落足。南岸登灘，鐵掌幫守在北岸山道之前。'
  },
  {
    name: '西夏夜苑',
    shapeName: '環池宮苑',
    mask: [
      '..#########..',
      '.###########.',
      '#############',
      '#############',
      '#####...#####',
      '#############',
      '#####...#####',
      '#############',
      '#############',
      '.###########.',
      '..#########..'
    ],
    rows: [
      '..Rm..C..mR..',
      '.b.........b.',
      'm..R.m.m.R..m',
      '.h.........h.',
      '..m.R...R.m..',
      'b...m===m...b',
      '..m.R...R.m..',
      '.............',
      'm.R..m.m..R.m',
      '.b....h....b.',
      '..Rm.....mR..'
    ],
    allies: [
      [5, 9],
      [7, 9],
      [6, 10],
      [4, 9],
      [8, 9]
    ],
    enemies: [
      [6, 1],
      [5, 3],
      [7, 3],
      [6, 5]
    ],
    objective: [12, 5],
    names: {
      plain: '宮苑磚地',
      bridge: '池上曲橋',
      reeds: '池畔淺水',
      cover: '白石欄',
      bamboo: '苑中花樹',
      herbs: '御藥圃',
      rock: '宮燈石柱',
      crate: '鎏金香爐'
    },
    tactic: '宮苑四面迴廊，環著當中一口蓮池，池上只有一道曲橋。南首入苑，北面是香爐與殿階；東西兩廊各有一圃御藥。'
  },
  {
    name: '黑木繡閣',
    shapeName: '崖頂花塢',
    mask: [
      '....########',
      '..##########',
      '.###########',
      '############',
      '############',
      '#####..#####',
      '#####..#####',
      '############',
      '############',
      '###########.',
      '##########..',
      '########....'
    ],
    rows: [
      '....b.mRC.m.',
      '..bb........',
      '.b..m.b....R',
      'b.R....m.bh.',
      '...b.m....m.',
      '.m.....b...b',
      'b..m.....R..',
      '..b....m....',
      '.h...b...m.b',
      '..m.R...b...',
      'b....m.b....',
      '.b.m..b.....'
    ],
    allies: [
      [1, 10],
      [2, 10],
      [1, 9],
      [3, 10],
      [2, 11]
    ],
    enemies: [
      [9, 1],
      [5, 2],
      [10, 5],
      [3, 5]
    ],
    objective: [10, 9],
    names: {
      plain: '園中石徑',
      bridge: '小石橋',
      reeds: '池畔淺水',
      cover: '玲瓏湖石',
      bamboo: '紅梅翠竹',
      herbs: '芍藥圃',
      rock: '假山',
      crate: '繡架屏風'
    },
    tactic: '崖頂一座花園，紅梅翠竹之間散著湖石，當中一口鴛鴦小池。西南石階登園，東北角是一間精雅小舍；園西有一圃芍藥。'
  },
  // The last board (world view §8.4): the valley's own stone table, walked on at last. A plain
  // square go board of thirteen lines with nothing on it but obstacles (the producer, 2026-11-22):
  // the four swords of the tomb in rock at its four star points, seven great go stones, and
  // 韋小寶's stall at the south-east corner. 求敗 stands at 天元; the waterfall and its pool lie
  // beside the slab, off the board. It has no fixed four: every piece on it is named in battles.js.
  {
    name: '谷底棋臺',
    shapeName: '十三路方枰',
    mask: [
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############'
    ],
    rows: [
      '.............',
      '......R......',
      '.............',
      '...R.....R...',
      '.............',
      '.R.........R.',
      '.............',
      '....R...R....',
      '.............',
      '...R.....R...',
      '.R.........R.',
      '............C',
      '.............'
    ],
    allies: [
      [6, 11],
      [5, 12],
      [7, 12],
      [4, 11],
      [8, 11]
    ],
    enemies: [],
    objective: [6, 8],
    names: {
      plain: '青石棋枰',
      rock: '棋枰石墩',
      crate: '通吃坊布攤'
    },
    notes: {
      rock: '星位的石上插著劍，別處是碩大的棋子，都擋路，須繞道。',
      crate: '韋小寶的攤子擺在這裡，須繞道。'
    },
    tactic:
      '谷底一方青石棋枰，四四方方，縱橫十三路，枰上平坦，只有擋路的石墩。四角星位各有一塊插劍石，利劍、軟劍、重劍、木劍分立其上；另有七枚碩大的棋子散在枰上；求敗手持枯枝，立在天元。瀑布與淺潭在枰外東邊，東南角上是韋小寶的布攤。'
  },
  // The boards added on 2026-11-28, after the last board (it stays map 15). 16 石樑溫家: the
  // courtyard of the 溫 house. The one way in is a stone beam over the ravine to the south; the
  // five brothers stand round the screen wall in the middle of the court, a point of the 五行陣
  // each (battles.js).
  {
    name: '石樑溫家',
    shapeName: '照壁五行',
    mask: [
      '...#######...',
      '.##########..',
      '###########..',
      '##########...',
      '############.',
      '.###########.',
      '..#########..',
      '...##########',
      '....#######..',
      '....#####....',
      '.....###.....',
      '...#######...'
    ],
    rows: [
      '...mC...Cm...',
      '.b...........',
      'm............',
      '..h..........',
      '.............',
      '.b...mRm...b.',
      '.............',
      '...m.......mR',
      '....R.....R..',
      '....m...m....',
      '.....===.....',
      '...m.....m...'
    ],
    allies: [
      [6, 11],
      [5, 11],
      [7, 11],
      [4, 11],
      [8, 11]
    ],
    enemies: [
      [6, 2],
      [2, 1],
      [10, 1],
      [6, 8]
    ],
    objective: [0, 4],
    names: {
      plain: '溫家青磚',
      bridge: '石樑',
      cover: '石獅石鼓',
      bamboo: '庭前竹叢',
      herbs: '廂房藥圃',
      rock: '照壁石柱',
      crate: '銅香爐'
    },
    tactic:
      '溫家大院坐北朝南。南面一道石樑橫過山澗，是進院唯一的路；山澗在院子西南咬進一角，東北角讓後園佔了去。院心一堵照壁，五位老人繞著照壁各佔一方；北面大堂前只留一道窄窄的石階。'
  },
  // 17 萬安寺: the court before the pagoda. Two cages stand by the east and west walls (破: break
  // both); the 玄冥二老 keep to the pagoda steps, and the lamas hold the cages.
  {
    name: '萬安寺',
    shapeName: '寶塔前庭',
    mask: [
      '....#####....',
      '...#######...',
      '..#########..',
      '.###########.',
      '###.#####.###',
      '###.#####.###',
      '#############',
      '###.#####.###',
      '....#####....',
      '...#######...',
      '..#########..',
      '...#######...'
    ],
    rows: [
      '....bRRRb....',
      '...m.RRR.m...',
      '..h..m.m..h..',
      '.C.........C.',
      '.b..m...m..b.',
      '.............',
      '....m...m....',
      'C...........C',
      '....m...m....',
      '...b.....b...',
      '..m.......m..',
      '.............'
    ],
    allies: [
      [6, 11],
      [5, 11],
      [7, 11],
      [4, 11],
      [8, 11]
    ],
    enemies: [
      [5, 3],
      [2, 6],
      [10, 6],
      [6, 5]
    ],
    objective: [12, 4],
    names: {
      plain: '寺院青磚',
      cover: '石香爐',
      bamboo: '古柏',
      herbs: '僧寮藥圃',
      rock: '寶塔塔基',
      crate: '石經幢'
    },
    tactic:
      '萬安寺的前庭，北面一座十三層寶塔。東西兩邊各圍一進小院，院牆只開窄窄的口子，鐵籠就擺在小院裡，籠門鎖得極牢，裡頭卻只有一領草蓆；南面是山門前的空場。'
  },
  // 18 光明頂: the summit before the hall of the sacred fire (守: keep the fire through round 8).
  // The heroes stand by the altar; the road comes up from the south, and a secret way opens behind
  // the hall to the north-west.
  {
    name: '光明頂',
    shapeName: '聖火峰頂',
    mask: [
      '....#####....',
      '.##.#######..',
      '.###########.',
      '..##########.',
      '.##########..',
      '###.######...',
      '######.######',
      '.#####.####..',
      '..#########..',
      '...#######...',
      '..########...',
      '...#######...',
      '....#####....'
    ],
    rows: [
      '....mRRRm....',
      '.R..b.....R..',
      '..m.......m..',
      '.............',
      '.b.......b...',
      '..R..m.m.....',
      'm..b....b....',
      '..m.......m..',
      '.....R.R.....',
      '...m.....m...',
      '..h..m.m.....',
      '.............',
      '.............'
    ],
    allies: [
      [6, 3],
      [5, 4],
      [7, 4],
      [4, 3],
      [8, 3]
    ],
    enemies: [
      [6, 10],
      [5, 11],
      [7, 11],
      [6, 12]
    ],
    objective: [12, 6],
    names: {
      plain: '峰頂石坪',
      cover: '斷碑殘垣',
      bamboo: '崖上古松',
      herbs: '山徑藥草',
      rock: '嶙峋山石'
    },
    tactic:
      '光明頂絕頂，北面是供奉聖火的大殿，殿前石壇上燃著聖火。峰頂並不平整：當中一道裂罅截斷神道，兩旁也有崩落的缺口。南面一條山道蜿蜒而上，越上越窄；大殿西北一道石脊，盡頭的山石後頭藏著秘道口。'
  },
  // 19 俠客島: the cave hall whose walls are carved with the poem and its figures. The two envoys
  // stand before the walls; the sea comes in at both ends of the hall.
  {
    name: '俠客島',
    shapeName: '石洞刻壁',
    mask: [
      '.###########.',
      '..#########..',
      '..#########..',
      '.###########.',
      '..#########..',
      '##..#####..##',
      '###.#####.###',
      '.###########.',
      '##.#######.##',
      '..#########..',
      '...#######...'
    ],
    rows: [
      '.R.R.R.R.R.R.',
      '.............',
      '..m.......m..',
      '....R...R....',
      '.............',
      '~~..m...m..~~',
      '~~....h....~~',
      '....R...R....',
      '...m.....m...',
      '.............',
      '.............'
    ],
    allies: [
      [6, 10],
      [5, 10],
      [7, 10],
      [4, 9],
      [8, 9]
    ],
    enemies: [
      [5, 1],
      [3, 3],
      [9, 3],
      [6, 4]
    ],
    objective: [0, 8],
    names: {
      plain: '石洞地面',
      reeds: '潮水淺灘',
      cover: '石凳石案',
      herbs: '島上藥圃',
      rock: '刻字石壁'
    },
    notes: {
      rock: '壁上刻著一首〈俠客行〉，字旁滿是圖譜與注解。擋路，須繞道。'
    },
    tactic:
      '島上一座大石洞，北面一排石壁，每塊壁上都刻著字和圖。潮水從東西兩頭湧進洞來，沖出幾道深槽，只留石脊相連；洞中石柱、石案錯落，南面洞口收窄。'
  }
];

const point = ([x, y]) => ({ x, y });
// Legacy opening-chapter dimensions for the original ferry models.
const FIELD_SIZE = fields[0].rows[0].length;
const FIELD_CENTER = (FIELD_SIZE - 1) / 2;
// The mask is the actual board. A silhouette can contain waterways, an open
// courtyard or a chasm, all of which have no terrain, collision or movement.
const MAP_LAYOUTS = fields.map(
  ({ name, shapeName, mask, rows, allies, enemies, objective, tactic }) => {
    const cells = [];
    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[y].length; x++) {
        if (mask[y][x] === '#') cells.push({ x, y, kind: TERRAIN[rows[y][x]] });
      }
    }
    return {
      name,
      shapeName,
      mask,
      width: rows[0].length,
      height: rows.length,
      count: cells.length,
      cells,
      allies: allies.map(point),
      enemies: enemies.map(point),
      objective: point(objective),
      tactic
    };
  }
);

const regionalNotes = {
  plain: '地勢平緩，移動消耗 1 步。',
  bridge: '過橋移動消耗 1 步。',
  rock: '此處阻路，須繞道。',
  crate: '此物擋路，須繞道。'
};
// A map's own words for a kind (`names`), and its own note where the usual one does not fit (`notes`).
const localTerrain = fields.map(({ names, notes = {} }) => {
  if (!names) return TERRAIN_TYPES;
  return Object.fromEntries(
    Object.entries(TERRAIN_TYPES).map(([kind, type]) => [
      kind,
      names[kind] ? { ...type, name: names[kind], note: notes[kind] || regionalNotes[kind] || type.note } : type
    ])
  );
});

const indexOfMap = (index) =>
  Number.isInteger(index) && index >= 0 && index < MAP_LAYOUTS.length ? index : 0;
const mapLayout = (index = 0) => MAP_LAYOUTS[indexOfMap(index)];
function fieldSize(index = 0) {
  const { width, height } = mapLayout(index);
  return { width, height };
}
const fieldCells = (index = 0) => mapLayout(index).cells;
const terrainTypes = (index = 0) => localTerrain[indexOfMap(index)];
const FIELD_CELLS = fieldCells();

function validTile(x, y, index = 0) {
  return Number.isInteger(x) && Number.isInteger(y) && mapLayout(index).mask[y]?.[x] === '#';
}
function tileInfo(x, y, index = 0) {
  if (!validTile(x, y, index)) return null;
  const map = indexOfMap(index);
  return localTerrain[map][TERRAIN[fields[map].rows[y][x]]];
}

export { TERRAIN, TERRAIN_TYPES, FIELD_SIZE, FIELD_CENTER, MAP_LAYOUTS, mapLayout, fieldSize, fieldCells, terrainTypes, FIELD_CELLS, validTile, tileInfo };
