// Keys match the combat and mastery catalogues. A weapon's offensive forms belong
// to deliberate normal attacks. Its support forms belong to support skills.
const ART_FORMS = {
  // 令狐冲
  'signature:hero': ['exploit'],
  mountainOpening: ['line'],
  ninefoldFormula: ['exploit'],
  breakSword: [],
  breakArrow: [],
  starSuction: ['siphon'],
  breakQi: ['seal'],
  ninefoldIntent: ['exploit'],

  // 任盈盈
  'signature:medic': ['cleanse'],
  sheathedDagger: ['distill'],
  blackNeedle: ['mark'],
  returningSong: ['cleanse', 'overflow'],
  qinXiaoRally: ['riposte'],
  saintessOrder: [],
  clearHeartCoda: ['cleanse'],

  // 向問天
  'signature:guard': [],
  ironChainForm: ['mark'],
  chainShelter: [],
  sweepingWhip: ['pull'],
  reverseForce: [],
  bloodAtPass: ['leech'],
  earthThroughChain: [],

  // 郭靖
  'signature:guo': [],
  southernStance: ['still'],
  kanglongRegret: ['collision'],
  guoPairedHands: [],
  fieldDragonWard: [],
  flyingDragon: [],
  armyBookRally: ['channel'],
  dragonReserve: ['collision'],

  // 小龍女
  'signature:xiao': ['pin'],
  jadeThread: ['exploit'],
  jadeNeedle: ['glide'],
  silkBell: ['pull', 'collision'],
  jadeHeart: ['glide'],
  pairedHands: ['distill'],
  maidenHarmony: [],

  // 段譽
  'signature:duan': ['siphon'],
  fingerPrimer: ['pin'],
  shangYang: ['still'],
  ripplingSteps: [],
  lesserMarsh: ['mark'],
  guanChong: ['collision'],
  shaoShang: ['line'],
  sixMeridians: ['line', 'exploit'],

  // 黃蓉
  'signature:huang': ['seal'],
  huangPetals: ['mark'],
  peachWard: [],
  beggarBind: [],
  beggarTrip: ['pin'],
  peachGate: ['cleanse'],
  staffWithoutDogs: [],

  // 楊過
  'signature:yang': ['still'],
  quanzhenSword: [],
  darkIronEdge: ['line'],
  jadeFluteCut: [],
  tideBreaker: [],
  mournfulCloud: [],
  solitaryPalm: [],

  // 張無忌
  'signature:zhang': ['overflow'],
  nineYangMantle: ['cleanse'],
  qiankunYield: [],
  qiankunShove: ['collision'],
  holyFireTurn: ['pull'],
  taijiGate: ['still'],
  qiankunSeventh: ['cleanse'],

  // 胡斐
  'signature:hu': ['mark'],
  huQuickDraw: ['exploit'],
  snowPursuit: ['cleanse'],
  foxFeint: ['pull'],
  silkwormPalm: ['pin'],
  miaoSword: ['glide'],
  heartCut: ['exploit', 'again'],
  cliffCut: ['exploit', 'mark'],

  // 可分授給俠客的八部武譜
  fingerFlick: [],
  softPalm: ['pin'],
  yangFinger: ['channel'],
  yijinjing: ['cleanse'],
  iceSoulNeedle: ['still'],
  diamondWard: [],
  sevenInjuries: [],
  waterSkim: ['landing']
};

const WEAPON_FORMS = {
  pine: ['mark'],
  staff: ['channel'],
  pole: ['pin'],
  wraps: ['flank', 'riposte'],
  twins: ['arc', 'antidote'],
  fan: ['mark', 'channel'],
  jadeCane: ['pull'],
  darkIron: ['still'],
  mingSash: ['antidote', 'riposte'],
  foxSaber: ['flank'],
  frost: ['distill'],
  blueEdge: ['exploit'],
  ironFan: ['mark', 'overflow'],
  silkWhip: ['pull', 'pin'],
  travelBlade: ['arc'],
  starSteel: ['line'],
  dragonSaber: ['still']
};

const COMBINATIONS = [
  {
    name: '拂花遞劍',
    skills: ['huangPetals', 'signature:hero', 'ninefoldFormula', 'ninefoldIntent'],
    weapons: ['jadeCane'],
    text: '黃蓉與敵人之間留一空格，持青竹棒使拂花，把人拉近，逼他露出破綻。令狐冲進到兩格內接石壁劍招、總訣式或獨孤九劍，抓住破綻，多打 9 點原始傷害，這次交鋒也免受還擊。'
  },
  {
    name: '前掌後刀',
    skills: ['kanglongRegret'],
    weapons: ['foxSaber'],
    text: '郭靖和胡斐各站在敵人南北相鄰的一格。胡斐持胡家單刀先攻，夾擊多打 7 點，郭靖回 4 點內力。郭靖再出亢龍有悔，敵人的退路正被胡斐佔住，掌力再添 7 點。'
  },
  {
    name: '飛針催毒',
    skills: ['blackNeedle', 'pairedHands'],
    weapons: ['frost'],
    text: '任盈盈用黑血神針下毒。小龍女接左右互搏術，或由持寒潭短劍的令狐冲普攻，均可將未發的毒傷一次催出。當回合接上可多打 14 點原始傷害，雙劍也只催毒一次。'
  },
  {
    name: '牽敵成列',
    skills: ['sweepingWhip', 'shaoShang'],
    weapons: ['silkWhip'],
    text: '向問天隔一空格用長鞭破陣，將敵人拉進段譽與另一敵人所在的直線。任盈盈換錦紋軟鞭，也能普攻牽敵。段譽再出少商劍，主敵後兩格內若有敵人且通路無阻，劍氣便以四成半威力穿中一人。'
  },
  {
    name: '一指續孤掌',
    skills: ['mournfulCloud', 'yangFinger'],
    weapons: ['ironFan'],
    text: '楊過先出杞人憂天，自耗 10 點氣血。讓已習一陽指的張無忌持鐵骨折扇，在三格內替他療傷兼回 6 點內力。多出的療量最多有 12 點化為一回合護盾，可留待敵方出招。'
  },
  {
    name: '踏浪回陣',
    skills: ['waterSkim', 'armyBookRally'],
    weapons: ['wraps'],
    text: '讓同伴施水上漂，落在郭靖旁的空格，兩人各得 8 點護盾。郭靖戴布纏護手，接武穆遺書・合陣。同伴受令後攻擊上升，並回 6 點內力。下一次受敵人直接攻擊而損血時，可按損血數返勁，最多 9 點。'
  }
];

export { ART_FORMS, WEAPON_FORMS, COMBINATIONS };
