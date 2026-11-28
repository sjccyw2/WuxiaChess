import { ART_FORMS } from './form-catalog.js';
import { ENCOUNTERS } from './encounters.js';
import { MASTERY_ARTS, TRADE_MANUALS } from './mastery-catalog.js';
// Learned techniques use the same forecast and resolution as the six signature arts.
const BRANCHES = {
  force: { name: '外功・破勢', icon: 'sword' },
  guard: { name: '身法・守轉', icon: 'shield' },
  breath: { name: '內功・行氣', icon: 'drop' }
};
const TECHNIQUES = Object.fromEntries(
  Object.entries({ ...MASTERY_ARTS, ...TRADE_MANUALS }).map(([id, art]) => [
    id,
    { ...art, forms: ART_FORMS[id] || [] }
  ])
);
const MANUAL_PRICES = Object.fromEntries(
  Object.entries(TRADE_MANUALS).map(([id, book]) => [id, book.price])
);
const WARES = {
  blueEdge: {
    name: '青鋒劍',
    kind: 'weapon',
    atk: 10,
    icon: 'sword',
    desc: '青鋼劍身輕捷，攻擊增加 10。'
  },
  ironFan: {
    name: '鐵骨折扇',
    kind: 'weapon',
    atk: 4,
    power: 7,
    icon: 'feather',
    desc: '鐵骨中藏行氣紋，攻擊增加 4，絕技威力增加 7。'
  },
  silkWhip: {
    name: '錦紋軟鞭',
    kind: 'weapon',
    atk: 6,
    def: 3,
    icon: 'sword',
    desc: '錦紋長鞭收放自如，攻擊增加 6，防禦增加 3。'
  },
  trailBoots: {
    name: '踏雲靴',
    kind: 'gear',
    step: 1,
    icon: 'move',
    desc: '輕底布靴使步伐更遠，移動增加 1 格。'
  },
  heartMirror: {
    name: '護心鏡',
    kind: 'gear',
    def: 9,
    icon: 'shield',
    desc: '青銅護心鏡貼身護住要害，防禦增加 9。'
  },
  herbCharm: {
    name: '凝神香囊',
    kind: 'gear',
    def: 2,
    power: 7,
    icon: 'leaf',
    desc: '草木清香助人凝神，防禦增加 2，絕技威力增加 7。'
  },
  travelBlade: {
    name: '雁翎刀',
    kind: 'weapon',
    atk: 8,
    icon: 'sword',
    desc: '刃薄如翎，裝備者攻擊增加 8。'
  },
  starSteel: {
    name: '星紋精鋼劍',
    kind: 'weapon',
    atk: 13,
    icon: 'swords',
    desc: '天外隕鐵鍛成的寶劍，攻擊增加 13。'
  },
  cloudCoat: {
    name: '流雲軟甲',
    kind: 'gear',
    def: 6,
    icon: 'shield',
    desc: '層疊絲甲，防禦增加 6。'
  },
  bellJade: {
    name: '聽潮古玉',
    kind: 'gear',
    power: 12,
    icon: 'diamond',
    desc: '玉中隱有潮聲，絕技威力增加 12。'
  },
  greatPill: { name: '大還丹', kind: 'use', hp: 92, icon: 'bottle', desc: '服下回復 92 點氣血。' },
  // A heavy blade: the most attack of any weapon, paid for in footwork.
  dragonSaber: {
    name: '屠龍刀',
    kind: 'weapon',
    atk: 18,
    step: -1,
    icon: 'sword',
    desc: '刀身烏沉，重逾百斤，提著它走不快。攻擊增加 18，移動減少 1 格。'
  },
  // 反震 (game.js, barbStrike): whoever strikes the wearer from beside her pays for it.
  hedgehogVest: {
    name: '軟蝟甲',
    kind: 'gear',
    def: 4,
    barbs: 7,
    icon: 'shield',
    desc: '桃花島的鎮島之寶，甲上布滿倒刺。防禦增加 4。【反震】相鄰的敵人以攻擊或還擊打中佩者時，被倒刺扎傷 7 點氣血，不計防禦。'
  },
  // `cleanse` lifts every ailment that 解厄 lifts (form-rules.js, AILMENTS) before the healing.
  nineFlowerPill: {
    name: '九花玉露丸',
    kind: 'use',
    hp: 36,
    cleanse: true,
    icon: 'leaf',
    desc: '桃花島秘製的丸藥，清香沁人。先為使用者解除中毒、攻勢受挫、破防、絆足、破綻、截勁、亂氣、內傷與纏械，再回復 36 點氣血。每次用去一份。'
  },
  beeNectar: {
    name: '玉蜂漿',
    kind: 'use',
    hp: 30,
    mp: 20,
    icon: 'drop',
    desc: '古墓玉蜂所釀的蜂漿，甘潤養氣。為使用者回復 30 點氣血與 20 點內力。每次用去一份。'
  },
  // ── 珍品: never on the shelf. They come only from 三盅通吃 and the 支線 (ferry-market.js
  // RARE_STOCK; the producer, 2026-11-28, Q-N170). `grade` says so on every page that shows them.
  snowLotus: {
    name: '天山雪蓮',
    kind: 'use',
    grade: 'rare',
    hp: 40,
    mp: 40,
    cleanse: true,
    icon: 'leaf',
    desc: '天山絕頂冰雪中所生，百年一開。先為使用者解除中毒、攻勢受挫、破防、絆足、破綻、截勁、亂氣、內傷與纏械，再回復 40 點氣血與 40 點內力。每次用去一份。'
  },
  // 鴛鴦刀: a pair. Each is a weapon on its own; held by two heroes standing side by side, each
  // gains `pair.atk` and `pair.def` (game.js pairBonus).
  yuanBlade: {
    name: '鴛刀',
    kind: 'weapon',
    grade: 'rare',
    atk: 8,
    pair: { with: 'yangBlade', atk: 4, def: 4 },
    icon: 'sword',
    desc: '鴛鴦刀之一，刀身烏沉，護手鑄作鴛鳥。攻擊增加 8。【仁者無敵】持鴦刀的同伴站在身旁時，兩人攻擊各增加 4、防禦各增加 4。'
  },
  yangBlade: {
    name: '鴦刀',
    kind: 'weapon',
    grade: 'rare',
    atk: 7,
    pair: { with: 'yuanBlade', atk: 4, def: 4 },
    icon: 'sword',
    desc: '鴛鴦刀之一，刀身雪亮，護手鑄作鴦鳥。攻擊增加 7。【仁者無敵】持鴛刀的同伴站在身旁時，兩人攻擊各增加 4、防禦各增加 4。'
  },
  // 百毒不侵: poison never takes hold of the wearer (battle-mastery.js applyCondition).
  scarletToad: {
    name: '莽牯朱蛤',
    kind: 'gear',
    grade: 'rare',
    def: 3,
    antivenom: true,
    icon: 'shield',
    desc: '萬毒之王，通體朱紅，以金絲繫作佩飾。防禦增加 3。【百毒不侵】佩者不會中毒。'
  },
  // The basic attack (and the counter) passes `pierce` of the target's 防禦, as 七傷拳 does.
  ironDagger: {
    name: '削鐵匕首',
    kind: 'weapon',
    grade: 'rare',
    atk: 9,
    pierce: 0.5,
    icon: 'sword',
    desc: '韋小寶從鰲拜府中抄來的匕首，削鐵如泥。攻擊增加 9。普攻與還擊穿透一半防禦。'
  },
  // 信物 (`kind: 'token'`): kept by 韋小寶 for the run (run.tokens), never in the company's store,
  // and spent with a button where they work (ferry-market.js peekBowl, journey.js swapSides).
  loadedDice: {
    name: '灌鉛骰子',
    kind: 'token',
    grade: 'rare',
    icon: 'diamond',
    desc: '韋小寶的看家寶貝，骰心灌了鉛。三盅扣下之後，用一枚可先看其中一盅裝的是甚麼。每次用去一枚。'
  },
  ironToken: {
    name: '玄鐵令',
    kind: 'token',
    grade: 'rare',
    icon: 'diamond',
    desc: '持令者可求一事。在軍情用一枚，韋小寶便把這一局開出的兩口注收回，另開兩口；每局一次，每次用去一枚。'
  }
};
const CAPTAINS = [
  'chief',
  'courier',
  'reed',
  'snow',
  'qin',
  'peach',
  'wall',
  'jadeHall',
  'mirror',
  'murong',
  'hongAn',
  'gongSun',
  'qiuRen',
  'liQiu',
  'dongFang'
].map((id, index) => {
  const boss = ENCOUNTERS[index][0];
  return [id, boss.name, boss.school, boss.basic, boss.mini];
});

export { BRANCHES, TECHNIQUES, MANUAL_PRICES, WARES, CAPTAINS };
