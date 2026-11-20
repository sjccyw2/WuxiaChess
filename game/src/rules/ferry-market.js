import * as G from './game.js';
import { TECHNIQUES, MANUAL_PRICES } from '../data/martial-arts.js';
import { random, shuffled } from './lots.js';

// 韋小寶 keeps the shop (通吃坊) and runs its game of three cups. He is a living man who
// wandered in, not a borrowed moment, so he is the one person who remembers every run.
const VISITOR = {
  name: '韋小寶',
  alias: '通吃坊掌櫃',
  title: '三盅通吃',
  portrait: 'npc-wei.webp',
  book: '鹿鼎記',
  bio: '他不會武功，沒有人請他，他是自己摸進來的。在谷裡開一爿通吃坊，賣藥、賣兵器，也開賭。人人都把這裡的事忘了，只有他記得每一回。問他，他就賴。',
  arrival:
    '上一輪沒給人帶走的小東西，都落在韋小寶手裡。他排開三隻木盅，說是白送，只看你眼力。',
  reveal: '看仔細了，我可要扣盅啦。老規矩，三樣東西你揀一樣。……甚麼老規矩？我說了老規矩麼？你聽錯了。',
  blind: '三隻盅一樣重。別看我的手，看了也沒用，我這雙手是在揚州練出來的。揭一隻。',
  win: '成，這件歸你。餘下兩件我留著，下回再同你賭。',
  rules: '第一局獲勝後必定開局。其餘各局戰後有四成機會。每次可免費揭一盅，三個位置機會均等。'
};
// Base prices exclude a small, seeded premium. Minimum depth is one-based.
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
  '每局重排貨架，各抽兩件兵器、兩件護具、兩種丹藥與兩卷武譜。銀價較底價浮動零至三兩。武譜購回後須授予俠客並花武學點參悟。';
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
  groups.manual = Object.keys(MANUAL_PRICES).filter((id) => manualStage(id) <= depth);
  return groups;
}
// The first board (counted from 1) after which the shelf can carry this manual.
function manualStage(id) {
  const tier = TECHNIQUES[id].tier;
  return tier > 4 ? Infinity : Math.max(1, tier - 1);
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
      '盅，得了' +
      lotName(id) +
      (s.run.last.terminal ? '，寄在通吃坊，下一輪取用。' : '，收入隊伍公庫。'),
    VISITOR.name
  );
  return true;
}

export { VISITOR, MARKET_STOCK, MARKET_RULES, manualStage, makeOffers, makeVisit, validVisit, lotName, lotImage, grantLot, coverBowls, pickBowl };
