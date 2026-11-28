import { POLISH } from '../polish.js';
import { POSTS, boardPlan, planGrid, planKey } from './board-plan.js';
import * as G from '../rules/game.js';
import * as R from '../rules/journey.js';
import { seatsFor } from '../rules/formation.js';
import { art } from './artwork.js';
import { face, btn, esc, itemBonus, medicineIdle } from './panels.js';
import { icon } from './icons.js';
import { itemPicture } from './item-art.js';

const slotNames = { weapon: '兵器', gear: '護具' };
const numerals = ['一', '二', '三', '四', '五'];
const who = (u) => G.unitDetails(u).name;
const small = (action, label, attr = '', disabled = false) =>
  btn(action, label, 'mj-action fo-action', attr + (disabled ? ' disabled' : ''));
const grip = '<i class="fo-grip" aria-hidden="true">⠿</i>';
const itemImage = (id) => itemPicture(id, 'fo-item-img');
const dropAttrs = (kind, destination) => 'data-drop="' + kind + '" data-dest="' + destination + '"';
const dragAttrs = (kind, id, owner) =>
  'data-drag="' + kind + '" data-id="' + id + '" data-owner="' + owner + '" draggable="false"';

function planningMap(s) {
  return s.run.scene === 'shop' && !s.run.last?.terminal ? (R.nextMap(s.run) ?? s.mapIndex) : s.mapIndex;
}
// The 起陣圖: the board's plan with its five posts as buttons that take the picked hero; the
// enemy pieces, the reinforcements' entry tiles and the secondary's lamp or line drawn with it.
function planDiagram(s, seats, chief) {
  const map = planningMap(s),
    plan = boardPlan(map, map === s.mapIndex ? s : null, s.run.route);
  const post = (i, x, y, at) =>
    btn(
      'place-post',
      POSTS[i],
      'fo-pin' + (seats[i] === chief ? ' captain' : '') + (seats[i] ? '' : ' open'),
      'data-id="' +
        i +
        '" ' +
        dropAttrs('post', i) +
        ' style="' +
        at +
        '" aria-label="第' +
        numerals[i] +
        '陣位，第' +
        (x + 1) +
        '列第' +
        (y + 1) +
        '行"'
    );
  return (
    '<details class="fo-map-plan"><summary>' +
    icon('pin', 15) +
    plan.layout.name +
    ' · 起陣圖</summary>' +
    planGrid(plan, post) +
    planKey(plan) +
    '</details>'
  );
}
// A hero's numbers as the game counts them (gear and talents included), for the 陣容 cards and
// the pane beside them. 氣血 and 內力 are what the hero has now.
function heroStats(s, u) {
  return [
    ['hp', '氣血', u.hp, u.maxHp],
    ['mp', '內力', u.mp, u.maxMp],
    ['atk', '攻擊', G.stat(u, 'atk', s)],
    ['def', '防禦', G.stat(u, 'def', s)],
    ['step', '移動', G.stat(u, 'step', s)],
    ['range', '射程', u.range]
  ];
}
// The card's compact block: the six numbers, then the three arts in their slots as icons.
function cardFacts(s, u) {
  const stats = heroStats(s, u)
    .map(
      ([k, label, value, max]) =>
        '<span class="fo-stat fo-stat-' +
        k +
        (max && value < max ? ' low' : '') +
        '"><small>' +
        label +
        '</small><b>' +
        value +
        '</b></span>'
    )
    .join('');
  const arts = (u.slots || [null, null, null]).map((key) => (key ? G.artFor(u, key) : null));
  const names = arts.filter(Boolean).map((a) => a.name);
  const marks = arts
    .map((a) =>
      a
        ? '<i title="' + esc(a.name) + '">' + icon(a.icon || 'diamond', 14) + '</i>'
        : '<i class="fo-art-empty" title="空位"></i>'
    )
    .join('');
  return (
    '<span class="fo-facts" id="fo-facts-' +
    u.id +
    '"><span class="fo-stats">' +
    stats +
    '</span><span class="fo-arts" role="img" aria-label="出戰招式：' +
    esc(names.join('、') || '尚未配置') +
    '">' +
    marks +
    '</span></span>'
  );
}
function formationCards(s, u, ui) {
  const manage = G.managesCompany(s),
    company = G.company(s);
  const seats = manage ? seatsFor(s.run) : G.party(s).map((v) => v.id);
  const chief = manage ? s.run.next[0] : s.leader;
  const picked = ui.pickedHero;
  const card = (id, index) => {
    const member = company.find((a) => a.id === id);
    const deployed = index >= 0;
    const target = manage && deployed ? dropAttrs('post', index) : '';
    const position = deployed ? '陣位 ' + numerals[index] : '候補';
    if (!member)
      return (
        '<article class="fo-seat empty" ' +
        target +
        '>' +
        btn(
          'place-post',
          icon('plus', 20) + '<span>' + position + '</span>',
          'fo-vacancy',
          'data-id="' + index + '" aria-label="放至' + position + '"'
        ) +
        '</article>'
      );
    const attrs = manage ? dragAttrs('hero', id, '') : 'data-id="' + id + '"';
    const stamp = chief === id ? '<b class="fo-seal">領隊</b>' : '';
    const label = (manage && picked && picked !== id ? '放至' : '') + position;
    const points = member.sp > 0 ? '<b class="fo-points">可修習 ' + member.sp + '</b>' : '';
    return (
      '<article class="fo-seat' +
      (id === u.id ? ' inspected' : '') +
      (picked === id ? ' picked' : '') +
      '" ' +
      target +
      '>' +
      btn(
        manage ? 'formation-pick' : 'view-unit',
        '<span class="fo-face"><img draggable="false" alt="" src="' +
          face(id) +
          '">' +
          stamp +
          (manage ? grip : '') +
          '<span class="fo-name"><strong>' +
          who(member) +
          '</strong><small>等級 ' +
          member.level +
          '</small></span>' +
          points +
          '</span>' +
          cardFacts(s, member),
        'fo-portrait',
        attrs +
          ' aria-label="' +
          who(member) +
          '，' +
          position +
          (chief === id ? '，領隊' : '') +
          (member.sp > 0 ? '，武學點 ' + member.sp : '') +
          '" aria-describedby="fo-facts-' +
          id +
          '" aria-pressed="' +
          (u.id === id) +
          '"'
      ) +
      (manage && deployed
        ? small('place-post', label, 'data-id="' + index + '"')
        : '<small class="fo-post-label">' + position + '</small>') +
      '</article>'
    );
  };
  const bench = company.filter((a) => !seats.includes(a.id));
  // Polish (inkLook): one row that scrolls sideways, the five sent out first and the bench after
  // them; under it, 任為領隊 and 移至候補 for the hero shown (the producer, 2026-11-28).
  if (POLISH.inkLook && manage) {
    const active = seats.includes(u.id);
    const sent = seats.filter(Boolean).length;
    return (
      '<section class="fo-formation ink-roster-wrap"><div class="ink-roster" role="group" aria-label="出陣與候補">' +
      '<div class="fo-hand">' +
      seats.map(card).join('') +
      '</div><div class="fo-bench' +
      (bench.length ? '' : ' vacant') +
      '" ' +
      dropAttrs('post', -1) +
      '><span class="ink-bench-mark">候補</span>' +
      (bench.length ? bench.map((v) => card(v.id, -1)).join('') : '<span class="ink-bench-empty">無</span>') +
      '</div></div><div class="ink-roster-actions">' +
      small('appoint', chief === u.id ? '現任領隊' : '任為領隊', 'data-id="' + u.id + '"', !active || chief === u.id) +
      small(
        'lineup',
        active ? '移至候補' : '加入出陣',
        'data-id="' + u.id + '"',
        active ? sent <= 1 || chief === u.id : sent >= 5
      ) +
      planDiagram(s, seats, chief) +
      '</div></section>'
    );
  }
  return (
    '<section class="fo-formation"><header class="fo-section"><h3>出陣</h3><span>' +
    seats.filter(Boolean).length +
    '／5</span></header><div class="fo-hand">' +
    seats.map(card).join('') +
    '</div>' +
    (manage && s.run.scene === 'prep' ? '<p class="fo-redeploy">出陣後可在戰盤上再換位置。</p>' : '') +
    // The bench. With nobody on it, it shows only while a hero is in hand to be sent there
    // (picked, or being dragged: the styles show a `vacant` bench then), so it can still be reached.
    (manage
      ? '<div class="fo-bench' +
        (bench.length ? '' : ' vacant') +
        '" ' +
        dropAttrs('post', -1) +
        '><div class="fo-section"><h3>候補</h3>' +
        (picked && seats.includes(picked)
          ? small('place-post', '移至候補', 'data-id="-1"', seats.filter(Boolean).length === 1)
          : '') +
        '</div>' +
        (bench.length ? '<div class="fo-reserves">' + bench.map((v) => card(v.id, -1)).join('') + '</div>' : '') +
        '</div>' +
        '<div class="fo-instruction" aria-live="polite">' +
        (picked
          ? '已選' + who(G.find(s, picked)) + ' · 點選陣位放置'
          : '拖曳俠客，或先點選俠客再選陣位。') +
        '</div>' +
        planDiagram(s, seats, chief)
      : '') +
    '</section>'
  );
}
const bonus = itemBonus;
function available(s, u) {
  const entries = [];
  for (const [id, item] of Object.entries(G.ITEMS)) {
    if (item.owner && item.owner !== u.id) continue;
    const add = (owner, amount) => {
      if (amount > 0) entries.push({ id, item, owner, amount });
    };
    add('stock', s.stock[id] || 0);
    if (item.kind !== 'use') for (const v of G.company(s)) if (v[item.kind] === id) add(v.id, 1);
  }
  return entries;
}
function canPlaceEquipment(s, u, id, owner, dest) {
  const item = G.ITEMS[id];
  if (
    !u ||
    !item ||
    item.kind === 'use' ||
    !G.canOutfit(s, u) ||
    (item.owner && item.owner !== u.id)
  )
    return false;
  if (dest === 'stock') return owner === u.id && u[item.kind] === id;
  if (dest !== item.kind || u[item.kind] === id) return false;
  if (owner === 'stock') return s.stock[id] > 0;
  return G.managesCompany(s) && G.company(s).some((v) => v.id === owner && v[item.kind] === id);
}
function equipmentPlacement(s, u, id, owner, dest) {
  if (!canPlaceEquipment(s, u, id, owner, dest)) return false;
  return dest === 'stock' || owner === 'stock'
    ? G.equip(s, u, id)
    : G.transferEquipment(s, u, G.find(s, owner), id);
}
// `more` is put at the end of the hero's name row: the team page's 俠客詳情 button.
function armory(s, u, ui, more = '') {
  const all = available(s, u);
  const filter = ui.filter || 'all';
  const visible = all.filter((v) => filter === 'all' || v.item.kind === filter);
  const chosen = all.find((v) => v.id === ui.item && v.owner === ui.owner);
  const section = (label, extra = '') =>
    '<header class="fo-section"><h3>' + label + '</h3>' + extra + '</header>';
  function slot(kind) {
    const id = u[kind];
    const glyph = { weapon: 'sword', gear: 'shield' }[kind];
    const title = G.ITEMS[id]?.name || '空位';
    const visual = id ? itemImage(id) : '<i>' + icon(glyph, 22) + '</i>';
    return btn(
      'arm-slot',
      visual + '<span><small>' + slotNames[kind] + '</small><strong>' + title + '</strong></span>',
      'fo-slot fo-slot-' + kind,
      'data-id="' +
        kind +
        '" ' +
        dropAttrs('gear', kind) +
        (id ? ' ' + dragAttrs('equipment', id, u.id).replace('data-id=', 'data-gear=') : '') +
        ' aria-label="' +
        slotNames[kind] +
        '，' +
        title +
        '"'
    );
  }
  const figure =
    '<div class="fo-figure" data-drop="gear" data-dest="auto"><img draggable="false" class="fo-body" alt="' +
    who(u) +
    '的全身立像" src="' +
    esc(art('figure-' + u.id + '.webp')) +
    '">' +
    slot('weapon') +
    slot('gear') +
    '</div>';
  const source = (v) =>
    v.owner === 'stock' ? '公庫' : v.owner === u.id ? '穿戴中' : who(G.find(s, v.owner));
  function tile(v) {
    const picked = chosen === v;
    const movable = v.item.kind !== 'use' && G.canOutfit(s, u);
    const attrs = movable
      ? dragAttrs('equipment', v.id, v.owner)
      : 'data-id="' + v.id + '" data-owner="' + v.owner + '"';
    return btn(
      'arm-pick',
      itemImage(v.id) +
        (movable ? grip : '') +
        '<span><strong>' +
        v.item.name +
        '</strong><small>' +
        source(v) +
        (v.item.kind === 'use' || v.owner === 'stock' ? ' ×' + v.amount : '') +
        '</small></span>',
      'fo-item' + (picked ? ' picked' : ''),
      attrs + ' aria-pressed="' + picked + '"'
    );
  }
  function inspector(v) {
    if (!v)
      return (
        '<p class="fo-instruction">' +
        (filter === 'use'
          ? '選擇丹藥，讓' + who(u) + '服用。'
          : G.canOutfit(s, u)
            ? '拖曳兵器或護具至俠客立像，也可點選器物裝備。'
            : '交戰中不能更換兵器與護具，只能服藥；請在整備時更換。') +
        '</p>'
      );
    const attr = 'data-id="' + v.id + '" data-owner="' + v.owner + '"';
    const worn = v.owner === u.id;
    const helps = G.medicineFor(u, v.item).helps,
      canUse = G.canUseMedicine(s, u) && helps;
    let actions = '';
    if (v.item.kind === 'use') {
      actions += small(
        'item',
        canUse
          ? '服用一份'
          : !helps
            ? medicineIdle(v.item)
            : '暫不可服',
        attr,
        !canUse
      );
    } else {
      const can = G.canOutfit(s, u);
      actions = small(
        'arm-place',
        !can ? '整備時更換' : worn ? '卸回公庫' : v.owner === 'stock' ? '裝備' : '移交並裝備',
        attr + ' data-dest="' + (worn ? 'stock' : v.item.kind) + '"',
        !can || (!worn && u[v.item.kind] === v.id)
      );
    }
    return (
      '<section class="fo-inspector">' +
      itemImage(v.id) +
      '<div><h4>' +
      v.item.name +
      '</h4><b>' +
      bonus(v.item) +
      '</b><small>' +
      (v.item.kind === 'use' ? '全隊共用 · 每次一份 · 保留行動' : v.item.desc) +
      '</small></div><aside>' +
      actions +
      '</aside></section>'
    );
  }
  // Polish (inkLook): the hero's figure in the middle, weapons in a column on the left, armour in
  // a column on the right, medicine in a row along the bottom (the producer, 2026-11-27). What
  // the hero wears leads its column, ringed in gold. A tap picks a thing and the card under the
  // figure says what it does and offers 裝備 / 卸回公庫 / 服用; things still drag onto the figure.
  if (POLISH.inkLook) {
    const rank = (v) => (v.owner === u.id ? 0 : v.owner === 'stock' ? 1 : 2);
    const reel = (kind, label, glyph) => {
      const items = all.filter((v) => v.item.kind === kind).sort((a, b) => rank(a) - rank(b));
      return (
        '<section class="ink-rail ink-rail-' +
        kind +
        '" aria-label="' +
        label +
        '"><h4>' +
        label +
        '</h4><div class="ink-reel">' +
        (items.map((v) => tile(v).replace('class="fo-item', 'class="fo-item' + (v.owner === u.id ? ' worn' : ''))).join('') ||
          '<p class="ink-reel-empty">' + icon(glyph, 20) + '<span>無' + label + '</span></p>') +
        '</div></section>'
      );
    };
    const wearing = (kind) =>
      '<span class="ink-wearing"><small>' +
      slotNames[kind] +
      '</small><b>' +
      (G.ITEMS[u[kind]]?.name || '未裝備') +
      '</b></span>';
    return (
      '<div class="ink-armory"><header class="ink-arm-head"><h3>' +
      who(u) +
      '</h3><small>氣血 ' +
      u.hp +
      '／' +
      u.maxHp +
      '　內力 ' +
      u.mp +
      '／' +
      u.maxMp +
      '</small>' +
      more +
      '</header><div class="ink-arm-stage">' +
      reel('weapon', '兵器', 'sword') +
      '<div class="ink-arm-figure" ' +
      dropAttrs('gear', 'auto') +
      '><img draggable="false" alt="' +
      who(u) +
      '的全身立像" src="' +
      esc(art('figure-' + u.id + '.webp')) +
      '"><div class="ink-arm-worn">' +
      wearing('weapon') +
      wearing('gear') +
      '</div></div>' +
      reel('gear', '護具', 'shield') +
      '</div>' +
      inspector(chosen) +
      reel('use', '丹藥', 'bottle') +
      '</div>'
    );
  }
  const filters = ['all', 'weapon', 'gear', 'use']
    .map((k) =>
      btn(
        'arm-filter',
        k === 'all' ? '全部' : k === 'use' ? '丹藥' : slotNames[k],
        'fo-filter',
        'data-id="' + k + '" aria-pressed="' + (filter === k) + '"'
      )
    )
    .join('');
  return (
    '<div class="fo-armory' +
    (filter === 'use' ? ' fo-medicine' : '') +
    '"><section class="fo-doll">' +
    (filter === 'use' ? '<img class="fo-recipient" alt="" src="' + esc(face(u.id)) + '">' : '') +
    section(
      who(u),
      '<small><span>氣血 ' + u.hp + '／' + u.maxHp + '</span> · <span>內力 ' + u.mp + '／' + u.maxMp + '</span></small>' +
        more
    ) +
    (filter === 'use' ? '' : figure) +
    '</section><section class="fo-cabinet">' +
    section(
      filter === 'use' ? '共用藥箱' : '行囊',
      filter === 'use'
        ? ''
        : btn(
            'arm-stock',
            icon('bag', 14) + ' 公庫',
            'fo-stock',
            dropAttrs('gear', 'stock') + ' title="將已裝備的兵器或護具放回公庫"'
          )
    ) +
    '<div class="fo-filters" role="group" aria-label="器物分類">' +
    filters +
    '</div><div class="fo-inventory">' +
    (visible.map(tile).join('') || '<p class="fo-instruction">此類暫無器物</p>') +
    '</div>' +
    inspector(chosen) +
    '</section></div>'
  );
}

export { planningMap, heroStats, formationCards, canPlaceEquipment, equipmentPlacement, armory };
