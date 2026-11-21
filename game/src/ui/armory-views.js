import { mapMission } from '../rules/journey.js';
import * as G from '../rules/game.js';
import { seatsFor } from '../rules/formation.js';
import { mapLayout } from '../data/terrain.js';
import { art } from './artwork.js';
import { face, btn, esc, itemBonus } from './panels.js';
import { icon } from './icons.js';
import { itemPicture } from './item-art.js';

const slotNames = { weapon: '兵器', gear: '護具' };
const numerals = ['一', '二', '三', '四', '五'];
const who = (u) => G.unitDetails(u).name;
const small = (action, label, attr = '', disabled = false) =>
  btn(action, label, 'mj-action fo-action', attr + (disabled ? ' disabled' : ''));
const grip = '<i class="fo-grip" aria-hidden="true">⠿</i>';
const itemImage = (id, live = false) => itemPicture(id, 'fo-item-img', live);
const dropAttrs = (kind, destination) => 'data-drop="' + kind + '" data-dest="' + destination + '"';
const dragAttrs = (kind, id, owner) =>
  'data-drag="' + kind + '" data-id="' + id + '" data-owner="' + owner + '" draggable="false"';

function planningMap(s) {
  return s.run.scene === 'shop' && !s.run.last?.terminal && s.run.stage < 9
    ? s.run.route[s.run.stage + 1]
    : s.mapIndex;
}
function planDiagram(board, seats, chief, marker) {
  const dots = board.cells
    .map(
      ({ x, y, kind }) =>
        '<i class="ft-' +
        kind +
        '" style="grid-column:' +
        (x + 1) +
        ';grid-row:' +
        (y + 1) +
        '"></i>'
    )
    .join('');
  const posts = board.allies
    .map(({ x, y }, i) =>
      btn(
        'place-post',
        String(i + 1),
        'fo-pin' + (seats[i] === chief ? ' captain' : ''),
        'data-id="' +
          i +
          '" ' +
          dropAttrs('post', i) +
          ' style="grid-column:' +
          (x + 1) +
          ';grid-row:' +
          (y + 1) +
          '" aria-label="第' +
          numerals[i] +
          '陣位，第' +
          (x + 1) +
          '列第' +
          (y + 1) +
          '行"'
      )
    )
    .join('');
  return (
    '<details class="fo-map-plan"><summary>' +
    icon('pin', 15) +
    board.name +
    ' · 起陣圖</summary><div class="fo-map-grid" style="--map-w:' +
    board.width +
    ';--map-h:' +
    board.height +
    '">' +
    dots +
    (marker
      ? '<span class="wake-map-lamp" role="img" aria-label="支線燈記" style="grid-column:' +
        (marker.x + 1) +
        ';grid-row:' +
        (marker.y + 1) +
        '">✦</span>'
      : '') +
    posts +
    '</div></details>'
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
    return (
      '<article class="fo-seat' +
      (id === u.id ? ' inspected' : '') +
      (picked === id ? ' picked' : '') +
      '" ' +
      target +
      '>' +
      btn(
        manage ? 'formation-pick' : 'view-unit',
        '<img draggable="false" alt="" src="' +
          face(id) +
          '">' +
          stamp +
          (manage ? grip : '') +
          '<span><strong>' +
          who(member) +
          '</strong><small>等級 ' +
          member.level +
          '</small></span>',
        'fo-portrait',
        attrs +
          ' aria-label="' +
          who(member) +
          '，' +
          position +
          (chief === id ? '，領隊' : '') +
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
  return (
    '<section class="fo-formation"><header class="fo-section"><h3>出陣</h3><span>' +
    seats.filter(Boolean).length +
    '／5</span></header><div class="fo-hand">' +
    seats.map(card).join('') +
    '</div>' +
    (manage
      ? '<div class="fo-bench" ' +
        dropAttrs('post', -1) +
        '><div class="fo-section"><h3>候補</h3>' +
        (picked && seats.includes(picked)
          ? small('place-post', '移至候補', 'data-id="-1"', seats.filter(Boolean).length === 1)
          : '') +
        '</div><div class="fo-reserves">' +
        (bench.map((v) => card(v.id, -1)).join('') || '<small>無候補俠客</small>') +
        '</div></div>' +
        '<div class="fo-instruction" aria-live="polite">' +
        (picked
          ? '已選' + who(G.find(s, picked)) + ' · 點選陣位放置'
          : '拖曳俠客，或先點選俠客再選陣位。') +
        '</div>' +
        planDiagram(
          mapLayout(planningMap(s)),
          seats,
          chief,
          mapMission(planningMap(s), planningMap(s) === s.mapIndex ? G.objectiveTile(s) : null).tile
        )
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
    !G.canPrepare(s, u) ||
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
function armory(s, u, ui) {
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
    const movable = v.item.kind !== 'use' && (G.canPrepare(s, u) || G.managesCompany(s));
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
          : '拖曳兵器或護具至俠客立像，也可點選器物裝備。') +
        '</p>'
      );
    const attr = 'data-id="' + v.id + '" data-owner="' + v.owner + '"';
    const worn = v.owner === u.id;
    const canUse = G.canUseMedicine(s, u) && (v.item.hp ? u.hp < u.maxHp : u.mp < u.maxMp);
    let actions = '';
    if (v.item.kind === 'use') {
      actions += small(
        'item',
        canUse
          ? '服用一份'
          : v.item.hp && u.hp === u.maxHp
            ? '氣血已滿'
            : v.item.mp && u.mp === u.maxMp
              ? '內力已滿'
              : '暫不可服',
        attr,
        !canUse
      );
    } else {
      const can = v.owner === 'stock' || worn ? G.canPrepare(s, u) : G.managesCompany(s);
      actions = small(
        'arm-place',
        worn ? '卸回公庫' : v.owner === 'stock' ? '裝備' : '移交並裝備',
        attr + ' data-dest="' + (worn ? 'stock' : v.item.kind) + '"',
        !can || (!worn && u[v.item.kind] === v.id)
      );
    }
    return (
      '<section class="fo-inspector">' +
      itemImage(v.id, true) +
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
      '<small>氣血 ' + u.hp + '／' + u.maxHp + ' · 內力 ' + u.mp + '／' + u.maxMp + '</small>'
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

export { planningMap, formationCards, canPlaceEquipment, equipmentPlacement, armory };
