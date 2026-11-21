// 百物譜: weapons, gear, medicine and the martial manuals sold at the ferry shop.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, links, link, cells, gameArt } from './parts.js';
import { NOTES } from './notes.js';
import { itemTerms, ruleLinks } from './terms.js';

const KINDS = { weapon: '兵器', gear: '護具', use: '丹藥' };
// An item or manual with no line in the shop's stock is not sold there.
const shelf = (entry) =>
  entry?.[0] != null
    ? [
        ['通吃坊底價', entry[0] + ' 兩'],
        ['最早上架', '第 ' + entry[1] + ' 局戰後']
      ]
    : [['通吃坊', NOTES.notSold]];

function item(id) {
  const it = G.ITEMS[id],
    owner = it.owner && G.DETAILS[it.owner],
    // Heroes who answer the summons already holding it.
    starts = G.PARTY.filter((hero) => [G.startingHero(hero).weapon, G.startingHero(hero).gear].includes(id));
  return {
    id,
    name: it.name,
    tag: KINDS[it.kind],
    summary: it.desc,
    image: gameArt('item-' + id + '.webp'),
    sections: [
      rows('器物資料', [
        ['類別', KINDS[it.kind]],
        ['適用', owner ? owner.name + '專屬' : '全隊可用'],
        starts.length && ['起手所持', starts.map((hero) => G.DETAILS[hero].name).join('、')],
        it.atk && ['攻擊', it.atk],
        it.def && ['防禦', it.def],
        it.power && ['絕技威力', it.power],
        it.step && ['移動', it.step],
        it.barbs && ['反刺', it.barbs + ' 點，相鄰敵人打中佩者時'],
        it.cleanse && ['解除', '中毒、內傷等不良狀態'],
        it.hp && ['回復氣血', it.hp],
        it.mp && ['回復內力', it.mp]
      ]),
      rows('取得與使用', [...shelf(G.MARKET_STOCK[id]), ['使用方式', NOTES.itemUse[it.kind]]]),
      ruleLinks(itemTerms(id)),
      owner && links('所屬俠客', [link('heroes', it.owner, owner.name)])
    ].filter(Boolean),
    sources: cites(cite(it.name, 'src/rules/game.js', 'src/data/martial-arts.js'))
  };
}

function manual(id) {
  const art = G.TRADE_MANUALS[id];
  return {
    id: 'guide-' + id,
    name: '《' + art.name + '》',
    tag: '武譜',
    summary: art.desc,
    image: gameArt('guide-cover.webp'),
    sections: [
      rows('武譜資料', [
        ...shelf([G.MANUAL_PRICES[id], G.manualStage(id)]),
        ['階位', art.tier],
        ['參悟', art.points + ' 武學點'],
        ['授譜', NOTES.manualUse]
      ]),
      links('授予招式', [link('skills', id, art.name)])
    ],
    sources: cites(cite(art.name, 'src/data/mastery-catalog.js'))
  };
}

export function items() {
  return [...Object.keys(G.ITEMS).map(item), ...Object.keys(G.TRADE_MANUALS).map(manual)];
}
