import * as G from './game.js';
import { TECHNIQUES, MANUAL_PRICES } from '../data/martial-arts.js';
import { random, shuffled } from './lots.js';

// 韋小寶 keeps the shop (通吃坊) and runs its game of three cups. He is a living man who walked
// in: the wall of the realm stops only those who seek something from martial arts, and he seeks
// nothing from them. 求敗 cannot see or hear him. He remembers every run.
const VISITOR = {
  name: '韋小寶',
  alias: '通吃坊掌櫃',
  title: '三盅通吃',
  portrait: 'npc-wei.webp',
  book: '鹿鼎記',
  bio: '韋小寶不會武功，也無求於武，劍境的牆便攔不住他，任他來去。谷裡那爿通吃坊是他的，賣藥賣兵器，局局還另開盤口，求敗卻聽不見也看不見。問起來路，他每回都另編一個大話。',
  arrival:
    '上回無人帶走的零碎，都到了韋小寶手中。他排開三隻木盅，說是白送，單看客人眼力。',
  reveal: '看好，老規矩，三樣揀一樣。甚麼老規矩？我可沒說，是你聽錯。',
  blind: '三隻盅一樣重，掂也沒用。別盯我這雙揚州練的手。揭一隻罷。',
  win: '成，歸你。另兩件我留下。下回再賭。',
  rules: '第一局獲勝後必定開局。其餘各局戰後有四成機會。每次可免費揭一盅，三個位置機會均等。盅裡分常品、珍品、秘寶三品：珍品與秘寶攤上不賣。揭過一盅，可花 2 籌碼再揭一盅；沒開盅的一局，可花 3 籌碼請他開盅。籌碼只在押中支線時得。',
  // His line when a second cup is lifted for chips, and when he is paid to open the table.
  again: '再揭？成，籌碼拿來。韋小寶做生意，向來童叟無欺。',
  paid: '好，好，有籌碼便是大爺。三樣揀一樣，老規矩。'
};
// ── Grades (the producer, 2026-11-28, Q-N170) ────────────────────────────
// 常品 is what the shelf sells. 珍品 (items with `grade: 'rare'`) and 秘寶 (the 秘笈, manuals with
// `secret`) are never on the shelf: they come only from the cups and the 支線.
const RARE_STOCK = Object.keys(G.ITEMS).filter((id) => G.ITEMS[id].grade === 'rare');
const SECRET_MANUALS = Object.keys(MANUAL_PRICES).filter((id) => TECHNIQUES[id].secret);
const GRADES = {
  common: { name: '常品' },
  rare: { name: '珍品' },
  secret: { name: '秘寶' }
};
const gradeOf = (id) =>
  SECRET_MANUALS.includes(id) ? 'secret' : G.ITEMS[id]?.grade === 'rare' ? 'rare' : 'common';
// Each cup is 秘寶 at `secret`, else 珍品 at `rare` + `rarePerStage` for each board after the first,
// else 常品.
const CUP_ODDS = { secret: 0.05, rare: 0.25, rarePerStage: 0.02 };
// What 籌碼 buy at the table: a second cup once one is lifted, and a table on a board with none.
const CHIP_PRICES = { again: 2, open: 3 };
const chipsOf = (r) => r?.chips || 0;
// Base prices exclude a small, seeded premium. Minimum depth is one-based.
// Only what is listed here is ever on the shelf or under a cup: to keep an item for a quest or
// another way of earning it, delete its line.
const MARKET_STOCK = {
  travelBlade: [23, 1],
  blueEdge: [33, 1],
  ironFan: [31, 1],
  silkWhip: [29, 1],
  starSteel: [45, 3],
  jadeCane: [20, 1],
  tombSword: [18, 1],
  darkIron: [31, 1],
  mingSash: [24, 1],
  foxSaber: [26, 1],
  goldSerpentBlade: [30, 2],
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
  greatPill: [18, 1],
  dragonSaber: [52, 4],
  hedgehogVest: [30, 2],
  nineFlowerPill: [22, 2],
  beeNectar: [12, 1]
};
const MARKET_RULES =
  '每局重排貨架，各抽兩件兵器、兩件護具、兩種丹藥與兩卷武譜。銀價較底價浮動零至三兩。武譜購回後須授予俠客並花武學點修習。';
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
  groups.manual = Object.keys(MANUAL_PRICES).filter((id) => !TECHNIQUES[id].secret && manualStage(id) <= depth);
  return groups;
}
// The first board (counted from 1) after which the shelf can carry this manual.
function manualStage(id) {
  const tier = TECHNIQUES[id].tier;
  if (TECHNIQUES[id].secret) return Infinity; // a 秘笈 is never on the shelf
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
// ── The secondary's manual (journey.js settle) ───────────────────────────
// A met secondary that pays a manual: one the shelf could carry after this board, preferring one
// not already in the store and not held by every hero, drawn from the run and stage.
// `ends`: the run ends with this board, so the manual goes to the parcel for the next run.
// `secret`: a bet at 一賠三 pays a 秘笈 instead (journey.js paySide).
function bonusManual(s, ends = s.run.stage === 9, secret = false) {
  const r = s.run,
    store = ends ? r.chronicle.parcel.manuals : r.manuals;
  const known = (id) => store.includes(id) || G.company(s).every((u) => u.guides.includes(id));
  const deck = shuffled(
    secret ? SECRET_MANUALS : Object.keys(MANUAL_PRICES).filter((id) => manualStage(id) <= r.stage + 1),
    ferryRandom(r, 0x2c1b3c6d)
  ).sort((a, b) => Number(known(a)) - Number(known(b)));
  return deck[0] || null;
}
// `paid`: the table is opened for 籌碼 on a board where it did not open by itself.
function makeVisit(s, paid = false) {
  const r = s.run,
    rng = ferryRandom(r, 0x5bd1e995);
  const chance = rng();
  if (!paid && !(r.stage === 0 && r.last.won) && chance >= 0.4) return null;
  const groups = pools(s);
  const take = (ids) => ids[Math.floor(rng() * ids.length)];
  const lots = [take([...groups.weapon, ...groups.gear]), take(groups.manual), take(groups.use)];
  // Each cup's grade. A 珍品 is of the cup's own kind where there is one (armour or a weapon for the
  // first cup, 天山雪蓮 for the medicine's), else any; no two cups hold the same thing.
  const rare = CUP_ODDS.rare + CUP_ODDS.rarePerStage * r.stage;
  const used = new Set();
  const kinds = [['weapon', 'gear'], [], ['use']];
  const cards = lots.map((common, i) => {
    const roll = rng(),
      free = (ids) => ids.filter((id) => !used.has(id) && !lots.includes(id));
    let id = common;
    if (roll < CUP_ODDS.secret && free(SECRET_MANUALS).length) id = take(free(SECRET_MANUALS));
    else if (roll < CUP_ODDS.secret + rare) {
      const own = free(RARE_STOCK.filter((x) => kinds[i].includes(G.ITEMS[x].kind)));
      const any = free(RARE_STOCK);
      if (own.length || any.length) id = take(own.length ? own : any);
    }
    used.add(id);
    return id;
  });
  return {
    cards: shuffled(cards, rng),
    order: shuffled([0, 1, 2], rng),
    phase: 'show',
    pick: null,
    ...(paid ? { paid: true } : {})
  };
}
// 開盅: on a board where the table did not open, 籌碼 open it.
function canOpenTable(s) {
  const r = s.run;
  return (
    r?.status === 'camp' &&
    r.scene === 'shop' &&
    !!r.last &&
    !r.last.visit &&
    chipsOf(r) >= CHIP_PRICES.open
  );
}
function openTable(s) {
  if (!canOpenTable(s)) return false;
  const r = s.run;
  r.last.visit = makeVisit(s, true);
  r.chips -= CHIP_PRICES.open;
  G.log(s, 'item', '付了 ' + CHIP_PRICES.open + ' 籌碼，請韋小寶開盅。', VISITOR.name);
  return true;
}
function validVisit(v) {
  return (
    !!v &&
    Array.isArray(v.cards) &&
    v.cards.length === 3 &&
    new Set(v.cards).size === 3 &&
    v.cards.every(
      (id) => Object.hasOwn(MARKET_STOCK, id) || RARE_STOCK.includes(id) || Object.hasOwn(MANUAL_PRICES, id)
    ) &&
    (v.paid == null || v.paid === true) &&
    (v.extra == null ||
      (v.phase === 'claimed' && Number.isInteger(v.extra) && v.extra >= 0 && v.extra < 3 && v.extra !== v.pick)) &&
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
  return G.ITEMS[id] ? 'item-' + id + '.webp' : TECHNIQUES[id]?.secret ? 'guide-secret.webp' : 'guide-cover.webp';
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
// 扣盅換位: which cup holds which thing is drawn only now, as the cups are covered, and nothing
// on screen follows it (the cups gather, swirl and spread as one; bowl-views.js), so watching the
// shuffle tells the player nothing (the producer, 2026-11-27). The draw comes from the run's own
// random source, so a run started from a fixed seed still plays the same every time (Q-N168).
function coverBowls(s) {
  const v = visiting(s);
  if (v?.phase !== 'show') return false;
  v.order = shuffled([0, 1, 2], ferryRandom(s.run, 0x1b873593));
  v.phase = 'hidden';
  return true;
}
// 再揭一盅: once a cup is lifted, another of the two left can be lifted for 籌碼, once a table.
function canLiftAgain(s, position = null) {
  const v = visiting(s);
  return (
    v?.phase === 'claimed' &&
    v.extra == null &&
    chipsOf(s.run) >= CHIP_PRICES.again &&
    (position == null || (Number.isInteger(position) && position >= 0 && position < 3 && position !== v.pick))
  );
}
function pickBowl(s, position) {
  const v = visiting(s);
  if (v?.phase === 'claimed') {
    if (!canLiftAgain(s, position)) return false;
    s.run.chips -= CHIP_PRICES.again;
    v.extra = position;
  } else if (v?.phase !== 'hidden' || !Number.isInteger(position) || position < 0 || position > 2)
    return false;
  const id = v.cards[v.order[position]];
  grantLot(s, id);
  if (v.phase === 'hidden') {
    v.pick = position;
    v.phase = 'claimed';
  }
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

export { VISITOR, MARKET_STOCK, MARKET_RULES, RARE_STOCK, SECRET_MANUALS, GRADES, gradeOf, CUP_ODDS, CHIP_PRICES, chipsOf, manualStage, bonusManual, makeOffers, makeVisit, canOpenTable, openTable, validVisit, lotName, lotImage, grantLot, coverBowls, canLiftAgain, pickBowl };
