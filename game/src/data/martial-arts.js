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
    atk: 17,
    step: -1,
    icon: 'sword',
    desc: '刀身烏沉，重逾百斤，揮動須站穩腳步。攻擊增加 17，移動減少 1 格。'
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
    desc: '桃花島秘製的丸藥，清香沁人。先為使用者解除中毒、攻勢受挫、破防、絆足、破綻、截勁、亂氣、內傷、失神與纏械，再回復 36 點氣血。每次用去一份。'
  },
  beeNectar: {
    name: '玉蜂漿',
    kind: 'use',
    hp: 30,
    mp: 20,
    icon: 'drop',
    desc: '古墓玉蜂所釀的蜂漿，甘潤養氣。為使用者回復 30 點氣血與 20 點內力。每次用去一份。'
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
