// 百物譜: weapons, gear, medicine and the martial manuals sold at the ferry shop.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, links, link, cells, gameArt } from './parts.js';
import { NOTES } from './notes.js';

const KINDS = { weapon: '兵器', gear: '護具', use: '丹藥' };
const shelf = ([price, stage]) => [
  ['通吃坊底價', price + ' 兩'],
  ['最早上架', '第 ' + stage + ' 局戰後']
];

function item(id) {
  const it = G.ITEMS[id],
    owner = it.owner && G.DETAILS[it.owner];
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
