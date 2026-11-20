import * as G from './game.js';
import { TECHNIQUES, MANUAL_PRICES } from '../data/martial-arts.js';
import { random, shuffled } from './lots.js';

const VISITOR = {
  name: '周伯通',
  alias: '老頑童',
  title: '三碗借時',
  portrait: 'npc-zhoubotong.webp',
  book: '射鵰英雄傳、神鵰俠侶',
  bio: '周伯通在桃花島水邊練雙手互搏，聽見有人要搭船，兩隻手一齊伸了出去。上了桑婆婆的渡船，連一頓茶的工夫也要拿來玩三個碗。',
  arrival:
    '上一航沒跟人上岸的小東西，有時卡在船舷的縫裡。周伯通趁靠岸摸上一把，排開三隻木碗，說左右手各有一套藏法。',
  reveal: '眼睛看仔細，我可要扣碗了。左手想教你記住，右手偏想瞧你猜錯，兩個各有各的樂子！',
  blind: '三隻碗一樣重，我這兩隻手已經爭了一回。輪到你，揭一隻。',
  win: '成啦，這件你收好。餘下的留我跟自己再賭一把。',
  rules: '首渡獲勝必遇。其餘戰後有四成機會相逢。每次可免費揭一碗，三個位置機會均等。'
};
// Base prices exclude a small, seeded dock premium. Minimum depth is one-based.
const MARKET_STOCK = {
  travelBlade: [23, 1],
  blueEdge: [33, 1],
  ironFan: [31, 1],
  silkWhip: [29, 1],
  starSteel: [45, 3],
  jadeCane: [20, 1],
  darkIron: [31, 1],
  mingSash: [24, 1],
  foxSaber: [26, 1],
  pine: [17, 1],
  staff: [16, 1],
  pole: [19, 1],
  wraps: [17, 1],
  twins: [19, 1],
  fan: [18, 1],
  frost: [26, 1],
  bracer: [18, 1],
  jade: [22, 1],
  cloudCoat: [29, 1],
  bellJade: [36, 2],
  trailBoots: [32, 1],
  heartMirror: [38, 3],
  herbCharm: [28, 1],
  remedy: [9, 1],
  elixir: [10, 1],
  greatPill: [18, 1]
};
const MARKET_RULES =
  '每渡重排貨架，各抽兩件兵器、兩件護具、兩種丹藥與兩卷武譜。銀價較底價浮動零至三兩。武譜購回後須授予俠客並花武學點參悟。';
function pools(s) {
  const depth = s.run.stage + 1,
    roster = G.company(s);
  const groups = { weapon: [], gear: [], use: [], manual: [] };
  for (const [id, [, gate]] of Object.entries(MARKET_STOCK)) {
    const item = G.ITEMS[id];
    if (gate > depth || (item.owner && !roster.some((u) => u.id === item.owner && u.weapon !== id)))
      continue;
    groups[item.kind].push(id);
  }
  groups.manual = Object.keys(MANUAL_PRICES).filter(
    (id) => TECHNIQUES[id].tier <= Math.min(4, depth + 1)
  );
  return groups;
}
// Mix every bit of the run and stage before taking the first draw.
function ferryRandom(run, salt) {
  let n = run.seed ^ Math.imul(run.stage + 1, 0x9e3779b1) ^ salt;
  n = Math.imul(n ^ (n >>> 16), 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return random(n ^ (n >>> 16));
}
function makeOffers(s) {
  const r = s.run,
    rng = ferryRandom(r, 0x7feb352d),
    groups = pools(s);
  const rows = [];
  for (const [kind, ids] of Object.entries(groups)) {
    const deck = shuffled(ids, rng);
    if (kind === 'manual') {
      const copies = r.last.terminal ? r.chronicle.parcel.manuals : r.manuals;
      const known = (id) =>
        copies.includes(id) ||
        (!r.last.terminal && G.company(s).every((u) => u.guides.includes(id)));
      deck.sort((a, b) => Number(known(a)) - Number(known(b)));
    }
    for (const id of deck.slice(0, 2)) {
      const base = MARKET_STOCK[id]?.[0] || MANUAL_PRICES[id];
      rows.push({
        id,
        price: base + Math.floor(rng() * 4),
        left: kind === 'use' ? 2 + Math.floor(rng() * 3) : 1
      });
    }
  }
  return rows;
}
function makeVisit(s) {
  const r = s.run,
    rng = ferryRandom(r, 0x5bd1e995);
  const chance = rng();
  if (!(r.stage === 0 && r.last.won) && chance >= 0.4) return null;
  const groups = pools(s);
  const take = (ids) => ids[Math.floor(rng() * ids.length)];
  const cards = shuffled(
    [take([...groups.weapon, ...groups.gear]), take(groups.manual), take(groups.use)],
    rng
  );
  return { cards, order: shuffled([0, 1, 2], rng), phase: 'show', pick: null };
}
function validVisit(v) {
  return (
    !!v &&
    Array.isArray(v.cards) &&
    v.cards.length === 3 &&
    new Set(v.cards).size === 3 &&
    v.cards.every((id) => Object.hasOwn(MARKET_STOCK, id) || Object.hasOwn(MANUAL_PRICES, id)) &&
    Array.isArray(v.order) &&
    v.order.length === 3 &&
    new Set(v.order).size === 3 &&
    v.order.every((n) => Number.isInteger(n) && n >= 0 && n < 3) &&
    (v.phase === 'claimed'
      ? Number.isInteger(v.pick) && v.pick >= 0 && v.pick < 3
      : ['show', 'hidden'].includes(v.phase) && v.pick === null)
  );
}
function lotName(id) {
  return G.ITEMS[id]?.name || '《' + TECHNIQUES[id].name + '》';
}
function lotImage(id) {
  return G.ITEMS[id] ? 'item-' + id + '.webp' : 'guide-cover.webp';
}
function grantLot(s, id) {
  const r = s.run,
    parcel = r.last.terminal ? r.chronicle.parcel : null;
  if (Object.hasOwn(MANUAL_PRICES, id)) (parcel ? parcel.manuals : r.manuals).push(id);
  else {
    const stock = parcel ? parcel.stock : s.stock;
    stock[id] = (stock[id] || 0) + 1;
  }
}
function visiting(s) {
  return s.run?.status === 'camp' && s.run.scene === 'shop' ? s.run.last?.visit : null;
}
function coverBowls(s) {
  const v = visiting(s);
  if (v?.phase !== 'show') return false;
  v.phase = 'hidden';
  return true;
}
function pickBowl(s, position) {
  const v = visiting(s);
  if (v?.phase !== 'hidden' || !Number.isInteger(position) || position < 0 || position > 2)
    return false;
  const id = v.cards[v.order[position]];
  grantLot(s, id);
  v.pick = position;
  v.phase = 'claimed';
  G.log(
    s,
    'item',
    '揭開第' +
      ['一', '二', '三'][position] +
      '碗，拾得' +
      lotName(id) +
      (s.run.last.terminal ? '，收入下一航渡資。' : '，收入隊伍公庫。'),
    VISITOR.name
  );
  return true;
}

export { VISITOR, MARKET_STOCK, MARKET_RULES, makeOffers, makeVisit, validVisit, lotName, lotImage, grantLot, coverBowls, pickBowl };
