import { moveFacts } from '../rules/move-facts.js';
import {
  COMMANDS,
  commandDescription,
  activeEffects,
  effectDescription
} from '../rules/battle-mastery.js';
import { art } from './artwork.js';
import { fieldSize, fieldCells, terrainTypes, mapLayout, tileInfo } from '../data/terrain.js';
import { NUMERALS, guideInventory, acceptsGuide, briefing, boardBrief, sideForecast } from '../rules/journey.js';
import { seatsFor } from '../rules/formation.js';
import { POSTS, boardPlan, planGrid, planKey } from './board-plan.js';
import {
  DETAILS,
  unitDetails,
  enemyTechnique,
  enemyTraitLines,
  signatureLines,
  traitsOf,
  coverer,
  taunters,
  reach,
  roundsToSignature,
  standingLines,
  ITEMS,
  LIMIT,
  PARTY,
  BOOKS,
  chapterScenes,
  leader,
  TALENTS,
  ally,
  canAct,
  canGlide,
  targetOK,
  canPrepare,
  canUseMedicine,
  medicineFor,
  artFor,
  basicFor,
  equippedArts,
  company,
  commanderId,
  cost,
  damage,
  find,
  forecast,
  living,
  party,
  unclaimedObjectiveTile,
  wardEscorts,
  wardShare,
  stat,
  announcedWaves,
  arrivalGhosts,
  pieceUnit,
  waveList,
  boardOf
} from '../rules/game.js';
import { icon } from './icons.js';
import { itemPicture } from './item-art.js';
import { POLISH } from '../polish.js';
import { guideEntries } from '../data/rule-terms.js';
import { extraHotkeys } from './field-extras.js';
import { ON as actionFlow, anyIdle, flowHotkeys } from './action-flow.js';
const portraits = {
  huang: 'huang',
  yang: 'yang',
  zhang: 'zhang',
  hu: 'hu',
  hero: 'shen',
  medic: 'lu',
  guard: 'pei',
  chief: 'han',
  murong: 'murong',
  guo: 'guo',
  xiao: 'xiao',
  duan: 'duan'
};
const face = (id) =>
  art(DETAILS[id]?.portraitFile || 'portraits-' + portraits[id] + '.webp');
function unitFace(u) {
  const d = unitDetails(u);
  return d.portraitFile
    ? art(d.portraitFile)
    : portraits[u.id]
      ? face(u.id)
      : art('mini-' + d.mini + '.webp');
}
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
function factBadge(f) {
  if (!f) return '';
  const parts = f.effectLines.map((line) => '<span>' + esc(line) + '</span>').join('');
  return (
    '<span class="fo-facts"><span class="fo-power"><small>' +
    esc(f.powerLabel) +
    '</small><b>' +
    esc(f.powerText) +
    '</b></span><span class="fo-effects">' +
    parts +
    '</span></span>'
  );
}
function bookCitation(titles) {
  return titles
    .split('、')
    .map((title) => '《' + esc(title) + '》')
    .join('、');
}
const btn = (action, label, cls = 'outline-btn', attrs = '') =>
  '<button class="' + cls + '" data-do="' + action + '" ' + attrs + '>' + label + '</button>';
const arrow = icon('chevron', 13);
const meter = (value, max, cls) =>
  '<span class="meter ' +
  cls +
  '"><i style="width:' +
  Math.min(100, (100 * value) / max) +
  '%"></i></span>';
const bar = (label, value, max, cls, ic) =>
  '<div class="bar-row"><span class="bar-label">' +
  icon(ic, 13) +
  label +
  '</span>' +
  meter(value, max, cls) +
  '<span class="bar-value">' +
  value +
  ' <small>/ ' +
  max +
  '</small></span></div>';
const lv = (u) => '<span class="lv">Lv. <b>' + String(u.level).padStart(2, '0') + '</b></span>';
const titleHead = (ic, title, sub = '') =>
  '<div class="modal-head"><div class="modal-title">' +
  icon(ic, 23) +
  '<h2>' +
  title +
  '</h2></div>' +
  btn('close', icon('close', 20), 'square-btn', 'aria-label="關閉視窗"') +
  '</div>' +
  (sub ? '<p class="modal-intro">' + sub + '</p>' : '');
const allyPick = (s, id) =>
  '<div class="ally-pick">' +
  (s.run?.status === 'camp' ? company(s) : party(s))
    .map((u) =>
      btn(
        'view-unit',
        '<img alt="" src="' + face(u.id) + '"><span>' + DETAILS[u.id].name + '</span>',
        id === u.id ? 'picked' : '',
        'data-id="' + u.id + '"'
      )
    )
    .join('') +
  '</div>';
function actionState(u) {
  return !living(u) ? '已退場' : u.acted ? '已行動' : u.moved ? '已移動' : '可行動';
}

function renderParty(s) {
  return party(s)
    .map((u) => {
      const name = DETAILS[u.id].name;
      const flag = u.id === leader(s) ? icon('flag', 13) : '';
      return btn(
        'select',
        `<img src="${face(u.id)}" alt=""><span><strong>${name} ${flag}</strong><small>${actionState(u)}</small></span>${meter(u.hp, u.maxHp, 'hp')}`,
        'field-member' + (s.selected === u.id ? ' current' : '') + (!living(u) ? ' fallen' : ''),
        `data-id="${u.id}" aria-pressed="${s.selected === u.id}" aria-label="${name}，${actionState(u)}，氣血 ${u.hp}／${u.maxHp}"`
      );
    })
    .join('');
}
// What the hero's own last turns have readied, shown while he can still act (SPEC-mechanics §4):
// 留力, he did not strike last turn, so an equipped art that needs it may be used; 還報, an enemy
// hurt him in the last enemy phase, so an equipped art that pays it back is stronger.
function turnPips(s, u) {
  if (s.phase !== 'ally' || !canAct(s, u)) return '';
  const arts = equippedArts(u).map((id) => artFor(u, id));
  const pip = (name, rule) => `<small class="unit-pip" title="${rule}">${name}</small>`;
  return (
    (arts.some((a) => a.poised) && u.struckRound !== s.round - 1
      ? pip('留力', '上一回合未曾出手，留力之招可以施展')
      : '') +
    (arts.some((a) => a.avenge) && u.hurtRound === s.round - 1
      ? pip('還報', '上一個敵方回合曾受敵人攻擊而損血，還報之招威力增加')
      : '')
  );
}
function activeHero(s) {
  const u = find(s, s.selected);
  const stateMark =
    u.acted || !living(u) ? `<small class="unit-spent">${actionState(u)}</small>` : '';
  const flag =
    u.id === leader(s) ? `<i class="unit-flag" title="領隊">${icon('flag', 12)}</i>` : '';
  const vitality = (ic, key, v, max) =>
    `<span class="unit-vital ${key}">${icon(ic, 12)}${meter(v, max, key)}<b>${v}</b></span>`;
  return `<span class="unit-face"><img src="${face(u.id)}" alt="">${flag}</span><span class="unit-summary">
    <span class="unit-name"><strong>${DETAILS[u.id].name}</strong><small>Lv.${u.level}</small>${stateMark}${turnPips(s, u)}</span>
    ${vitality('heart', 'hp', u.hp, u.maxHp)}${vitality('drop', 'mp', u.mp, u.maxMp)}</span>`;
}
function commander(s, mode) {
  const u = find(s, s.selected);
  if (s.result)
    return btn(
      'result',
      icon('flag', 19) +
        '<span>' +
        (s.run?.status === 'camp' ? '返回通吃坊' : '查看戰果') +
        '</span>',
      'field-action turn-action'
    );
  // The deployment step: the end-turn control is 開戰, which starts round one.
  const begin = btn(
    'battle-begin',
    icon('flag', 18) + '<span>開戰</span>',
    'field-action turn-action ready',
    'title="開戰"'
  );
  if (s.run?.deploying) {
    if (actionFlow) return begin;
    return (
      [
        ['move', 'move', '移動'],
        ['skill', 'spark', '招式'],
        ['wait', 'wait', '待命']
      ]
        .map(([a, ic, label]) =>
          btn(a, icon(ic, 18) + '<span>' + label + '</span>', 'field-action', 'title="' + label + '" disabled')
        )
        .join('') + begin
    );
  }
  // Polish (actionFlow): the bar is reduced to End turn, which lights up once every hero has
  // at least moved.
  if (actionFlow) {
    // The art the hero has ready, as a chip that reopens the list so it can be changed.
    const armed =
      canAct(s, u) && ['attack', 'skill'].includes(mode)
        ? mode === 'attack'
          ? { name: basicFor(u).name, icon: 'swords' }
          : artFor(u)
        : null;
    return (
      (armed
        ? btn(
            'arts-open',
            icon(armed.icon || 'spark', 17) + '<span>' + esc(armed.name) + '</span>' + icon('down', 12),
            'field-action armed-art',
            'id="arts-toggle" aria-controls="arts-panel" aria-expanded="false" title="' +
              esc(armed.name) +
              '・招式"'
          )
        : '') +
      btn(
        'end',
        icon('end', 18) + '<span>結束回合</span>',
        'field-action turn-action' + (s.phase === 'ally' && !anyIdle(s) ? ' ready' : ''),
        'title="結束回合" ' + (s.phase !== 'ally' ? 'disabled' : '')
      )
    );
  }
  // 回身: once a glide art has struck, move walks on and wait stays put.
  const gliding = canGlide(s, u);
  const acts = gliding
    ? [
        ['glide', 'move', '回身'],
        ['skill', 'spark', '招式'],
        ['glide-stop', 'wait', '不走了'],
        ['end', 'end', '結束回合']
      ]
    : [
        ['move', u.moved ? 'undo' : 'move', u.moved ? '撤步' : '移動'],
        ['skill', 'spark', '招式'],
        ['wait', 'wait', '待命'],
        ['end', 'end', '結束回合']
      ];
  return acts
    .map(([a, ic, label]) => {
      const current = (canAct(s, u) || gliding) && mode === a;
      const attrs =
        a === 'skill'
          ? 'id="arts-toggle" aria-controls="arts-panel" aria-expanded="false"'
          : ['move', 'attack', 'glide'].includes(a)
            ? `aria-pressed="${current}"`
            : '';
      const disabled =
        a === 'end'
          ? s.phase !== 'ally'
          : gliding
            ? a === 'skill'
            : !canAct(s, u) || (a === 'move' && u.moved && !u.origin);
      return btn(
        a,
        icon(ic, 18) + '<span>' + label + '</span>',
        'field-action' + (current ? ' current' : '') + (a === 'end' ? ' turn-action' : ''),
        attrs + ' title="' + label + '" ' + (disabled ? 'disabled' : '')
      );
    })
    .join('');
}
// The goal rows of the single-board game (no run). A run's goals page is the live briefing.
function goalRows(s) {
  if (s.run) return '';
  const alive = party(s).filter(living).length,
    chief = find(s, 'chief');
  const won = s.result === 'win';
  return (
    '<div class="goal-row"><span class="objective-mark ' +
    (!living(chief) ? 'complete' : '') +
    '">' +
    icon(!living(chief) ? 'check' : 'diamond', 15) +
    '</span><div><small>主要目標</small><strong>擊敗青城掌門余滄海</strong></div></div>' +
    '<div class="goal-row"><span class="objective-mark alt">' +
    icon(won && alive === 3 ? 'check' : 'diamond', 15) +
    '</span><div><small>額外目標</small><strong>我方俠客全數存活</strong></div><span class="goal-count">' +
    alive +
    ' / 3</span></div>'
  );
}
const labels = {
  system: '回合',
  story: '劇情',
  move: '移動',
  terrain: '地形',
  combat: '交鋒',
  grow: '成長',
  item: '行囊'
};
function logRow(e) {
  return (
    '<div class="log-row log-' +
    esc(e.type) +
    '"><span class="log-round">回合 ' +
    String(e.round).padStart(2, '0') +
    '</span><b class="log-bullet"></b><span class="log-text">' +
    (e.who ? '<strong>' + esc(e.who) + '</strong>' : '') +
    esc(e.text) +
    '</span></div>'
  );
}
function portraitSummary(u) {
  const i = DETAILS[u.id];
  return (
    '<div class="sheet-profile"><img src="' +
    face(u.id) +
    '" alt="' +
    i.name +
    '肖像"><div><div class="section-kicker">' +
    i.epithet +
    '</div><h3>' +
    i.name +
    '</h3><div class="sheet-meta">' +
    '<span>' +
    bookCitation(BOOKS[u.id]) +
    '</span>' +
    '<span>' +
    i.school +
    '</span>' +
    lv(u) +
    '</div><details class="hud-disclosure"><summary>人物小傳</summary><p>' +
    i.bio +
    '</p></details></div></div>'
  );
}
function equippedCard(u, id, slot) {
  const item = ITEMS[id];
  return (
    '<div class="equipped-card"><div class="item-icon">' +
    (item
      ? itemPicture(id, 'fo-mini')
      : icon(slot === '兵器' ? 'sword' : 'shield', 22)) +
    '</div><div><small>' +
    slot +
    '</small><strong>' +
    (item?.name || '未裝備') +
    '</strong></div></div>'
  );
}
function conditionChips(s, u) {
  const labels = [...activeEffects(u, s.round), ...standingLines(s, u)];
  // 受護: derived, never stored — a companion beside a hero who covers.
  const guard = ally(u) && coverer(s, u);
  if (guard) labels.push('受護 · ' + DETAILS[guard.id].name + '在旁代受直接攻擊');
  return labels.length
    ? '<div class="condition-chips">' +
        labels.map((x) => '<span>' + esc(x) + '</span>').join('') +
        '</div>'
    : '';
}
function sheetPage(s, id) {
  return titleHead('people', '俠客錄') + allyPick(s, id) + profileContents(s, id);
}
function profileContents(s, id) {
  const u = find(s, id);
  const location = tileInfo(u.x, u.y, s.mapIndex);
  const footing = !s.units.includes(u)
    ? '盤邊候補'
    : s.run?.status === 'camp'
      ? '通吃坊・歇手中'
      : s.run?.scene === 'prep'
        ? '整備中'
        : location.name + ' · ' + location.note;
  return (
    portraitSummary(u) +
    conditionChips(s, u) +
    '<p class="sheet-boon">' +
    icon('flag', 16) +
    '<strong>' +
    COMMANDS[id].name +
    '</strong>　' +
    commandDescription(id) +
    '</p>' +
    '<div class="sheet-grid"><div><h4>人物屬性</h4>' +
    bar('氣血', u.hp, u.maxHp, 'hp', 'heart') +
    bar('內力', u.mp, u.maxMp, 'mp', 'drop') +
    bar('歷練', u.xp, 100, 'xp', 'star') +
    '<div class="detail-list"><span>攻擊 <b>' +
    stat(u, 'atk', s) +
    '</b></span><span>防禦 <b>' +
    stat(u, 'def', s) +
    '</b></span><span>移動 <b>' +
    stat(u, 'step', s) +
    ' 步</b></span><span>攻距 <b>' +
    u.range +
    ' 格</b></span></div><p class="footnote">' +
    icon('stone', 15) +
    footing +
    '</p></div><div><h4>隨身裝備</h4>' +
    equippedCard(u, u.weapon, '兵器') +
    equippedCard(u, u.gear, '護具／佩飾') +
    btn('inventory', '整理行囊 ' + arrow, 'text-btn inline') +
    '</div></div>' +
    '<div class="skill-feature">' +
    icon(basicFor(u).icon || 'sword', 23) +
    '<div><small>基本招式</small><strong>' +
    basicFor(u).name +
    '</strong><p>出戰特技 · ' +
    (equippedArts(u)
      .map((id) => artFor(u, id).name)
      .join('、') || '尚未配置') +
    '</p></div>' +
    btn('skills', '修習 ' + arrow, 'text-btn') +
    '</div>'
  );
}
// An item's numbers in one line: 「攻擊 ＋17 · 移動 −1」.
function itemBonus(item) {
  return [
    ['cleanse', '解除不良狀態'],
    ['atk', '攻擊'],
    ['def', '防禦'],
    ['power', '絕技威力'],
    ['step', '移動'],
    ['barbs', '反刺'],
    ['hp', '氣血'],
    ['mp', '內力']
  ]
    .filter(([k]) => item[k])
    .map(([k, n]) =>
      item[k] === true ? n : k === 'barbs' ? n + ' ' + item[k] : n + (item[k] < 0 ? ' −' + -item[k] : ' ＋' + item[k])
    )
    .join(' · ');
}
// The button's word for a dose that would do nothing now.
function medicineIdle(item) {
  return item.hp && !item.mp ? '氣血已滿' : item.mp && !item.hp ? '內力已滿' : '無須服用';
}
const effect = itemBonus;
function inventoryPage(s, id, filter) {
  const u = find(s, id);
  const groups = [
    ['all', '全部'],
    ['equip', '裝備'],
    ['use', '丹藥'],
    ['guide', '武譜']
  ];
  let content = '';
  for (const [k, item] of Object.entries(ITEMS)) {
    const worn = u.weapon === k || u.gear === k,
      q = s.stock[k] || 0;
    if (
      filter === 'guide' ||
      (!worn && !q) ||
      (filter === 'equip' && item.kind === 'use') ||
      (filter === 'use' && item.kind !== 'use')
    )
      continue;
    const match = !item.owner || item.owner === id,
      usable =
        (item.kind === 'use' ? canUseMedicine(s, u) : canPrepare(s, u)) &&
        match &&
        (item.kind !== 'use' || medicineFor(u, item).helps);
    const label = !match
      ? '限' + DETAILS[item.owner].name
      : worn
        ? '卸下'
        : item.kind === 'use'
          ? medicineFor(u, item).helps
            ? '服用'
            : medicineIdle(item)
          : '裝備';
    content +=
      '<div class="inventory-row"><span class="item-icon">' +
      icon(item.icon, 23) +
      '</span><div class="item-copy"><h4>' +
      item.name +
      (worn ? '<small>裝備中</small>' : '') +
      '</h4><p>' +
      item.desc +
      '</p><em>' +
      effect(item) +
      '</em></div><div class="item-controls"><small>行囊 × ' +
      q +
      '</small>' +
      btn('item', label, 'outline-btn tiny', 'data-id="' + k + '" ' + (usable ? '' : 'disabled')) +
      '</div></div>';
  }
  if (s.run && (filter === 'all' || filter === 'guide') && !s.run.last?.terminal) {
    for (const guide of guideInventory(s)) {
      content +=
        '<div class="inventory-row"><span class="item-icon">' +
        icon('book', 22) +
        '</span><div class="item-copy"><h4>《' +
        guide.name +
        '》</h4><p>' +
        guide.description +
        '</p><em>未授武譜 × ' +
        guide.count +
        '</em></div>' +
        btn(
          'teach-guide',
          '授予' + DETAILS[id].name,
          'outline-btn tiny',
          'data-id="' +
            guide.id +
            '" data-unit="' +
            id +
            '" ' +
            (acceptsGuide(s, u, guide.id) ? '' : 'disabled')
        ) +
        '</div>';
    }
    if (filter === 'guide' && !content)
      content = '<p class="empty">行囊暫無未授的武譜。可於通吃坊購買抄本，再選擇受授俠客。</p>';
  }
  return (
    titleHead('bag', '隨身行囊') +
    allyPick(s, id) +
    '<div class="segmented">' +
    groups
      .map(([k, n]) => btn('bag-filter', n, k === filter ? 'sel' : '', 'data-id="' + k + '"'))
      .join('') +
    '</div><div class="inventory-list">' +
    (content || '<p class="empty">行囊中尚無此類物品。</p>') +
    '</div><p class="footnote">' +
    icon('info', 14) +
    (s.run?.status === 'camp'
      ? '兩局之間可自由服藥、換裝。'
      : '各俠客共用行囊。每服一劑消耗一份，可連用且保留行動。') +
    '</p>' +
    (s.run?.status === 'camp'
      ? '<div class="modal-foot right">' + btn('camp', '返回通吃坊') + '</div>'
      : '')
  );
}
function skillPage(s, id) {
  const u = find(s, id),
    i = DETAILS[id];
  return (
    titleHead('book', '武學修習') +
    allyPick(s, id) +
    '<div class="talent-summary"><div class="art-seal">' +
    icon(i.skillIcon, 32) +
    '</div><div><small>' +
    i.school +
    ' · 獨門絕技</small><h3>' +
    i.skill +
    '</h3><p>' +
    i.skillDesc +
    '</p><em>消耗 ' +
    cost(u) +
    ' 內力　／　招式距離 ' +
    i.skillRange +
    ' 格</em></div></div>' +
    '<div class="subhead"><h4>內功修為</h4><span class="point-balance">可用點數 <b>' +
    u.sp +
    '</b></span></div><div class="talent-list">' +
    Object.entries(TALENTS)
      .map(
        ([k, t]) =>
          '<div class="talent-row"><span class="item-icon">' +
          icon(t.icon, 21) +
          '</span><div><h4>' +
          t.name +
          ' <span class="rank-dots">' +
          [1, 2, 3].map((n) => '<i class="' + (u.talents[k] >= n ? 'on' : '') + '"></i>').join('') +
          '</span></h4><p>' +
          t.desc +
          '</p></div>' +
          btn(
            'train',
            u.talents[k] >= 3 ? '已精通' : icon('plus', 13) + '修習',
            'outline-btn tiny',
            'data-id="' +
              k +
              '" ' +
              (canAct(s, u) && u.sp > 0 && u.talents[k] < 3 ? '' : 'disabled')
          ) +
          '</div>'
      )
      .join('') +
    '</div><p class="footnote">' +
    icon('star', 15) +
    '每升一級獲得 1 點武學點數。每次修習耗用 1 點。</p>'
  );
}
function storyPage(s, page) {
  const p = chapterScenes(s)[page],
    max = s.result === 'win' ? 4 : 2;
  return (
    titleHead('scroll', '章回故事') +
    '<div class="story-paper"><div class="section-kicker">' +
    (page < 3 ? '第一回' : '第一回 · 尾聲') +
    '<i></i>' +
    p.place +
    '</div><p class="narration">' +
    p.note +
    '</p><div class="dialogue"><img src="' +
    face(p.face) +
    '" alt="' +
    p.speaker +
    '"><div><strong>' +
    p.speaker +
    '</strong><blockquote>「' +
    p.text +
    '」</blockquote></div></div></div><div class="modal-foot">' +
    btn('story-prev', '上一幕', 'outline-btn', page === 0 ? 'disabled' : '') +
    '<div class="page-dots">' +
    Array.from(
      { length: max + 1 },
      (_, j) => '<i class="' + (j === page ? 'on' : '') + '"></i>'
    ).join('') +
    '</div>' +
    btn(
      page < max ? 'story-next' : 'close',
      page < max ? '下一幕 ' + arrow : '返回戰場',
      'gold-btn'
    ) +
    '</div>'
  );
}
function logPage(s, filter) {
  const filters = [
    ['all', '全部'],
    ['combat', '交鋒'],
    ['grow', '成長'],
    ['story', '劇情'],
    ['move', '移動'],
    ['terrain', '地形'],
    ['item', '行囊']
  ];
  return (
    titleHead('scroll', '戰場紀錄') +
    '<div class="segmented wrap">' +
    filters
      .map(([k, v]) => btn('log-filter', v, k === filter ? 'sel' : '', 'data-id="' + k + '"'))
      .join('') +
    '</div><div class="full-log">' +
    (s.logs
      .slice()
      .reverse()
      .filter((e) => filter === 'all' || e.type === filter)
      .map(logRow)
      .join('') || '<p class="empty">尚無' + labels[filter] + '紀錄。</p>') +
    '</div>'
  );
}
// ── The briefing (軍情) ─────────────────────────────────────────────────────
// One page before 整備: how the board is won and lost, the drawn secondary and what it pays, who
// stands against the heroes and who comes later, and a plan of the board. `live` is the goals
// page of the fight: the same page with the state of the fight in it. `ahead` reads the next
// board from the shop, with no secondary drawn yet. `back` names the page the footer returns to.
function briefPage(s, { live = false, ahead = false, back = '', extra = '' } = {}) {
  const r = s.run,
    model = ahead ? boardBrief(r.route[r.stage + 1], r.stage + 1) : briefing(s, { live });
  const plan = boardPlan(model.map, ahead ? null : s);
  const seats = ahead ? [] : seatsFor(r);
  const post = (i, x, y, at) =>
    '<b class="plan-post' +
    (seats[i] ? ' filled' : '') +
    (seats[i] && seats[i] === (r.scene === 'fight' ? s.leader : r.next[0]) ? ' captain' : '') +
    '" style="' +
    at +
    '" title="陣位' +
    POSTS[i] +
    (seats[i] ? ' · ' + DETAILS[seats[i]].name : '') +
    '">' +
    POSTS[i] +
    '</b>';
  const sect = (cls, title, body) =>
    '<section class="brief-sec ' + cls + '"><h4>' + title + '</h4>' + body + '</section>';
  const p = (text, cls = '') => (text ? '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(text) + '</p>' : '');
  const L = model.live;
  // 勝利, and in the fight how far it has come: each master's 氣血, or the enemies left.
  let progress = '';
  if (L) {
    const ward = (m) => {
      const u = find(s, m.id);
      if (!u || !(wardEscorts(s).length || s.units.some((v) => unitDetails(v)?.traits?.ward))) return '';
      return (
        '　星索護陣・' +
        wardEscorts(s).length +
        ' / ' +
        s.units.filter((v) => unitDetails(v)?.traits?.ward).length +
        ' 名護陣者，減傷 ' +
        wardShare(s, u) +
        '%'
      );
    };
    const rows =
      model.kind === 'rout'
        ? [L.remaining, L.waiting].filter(Boolean).map((t) => '<li>' + esc(t) + '</li>')
        : L.masters.map(
            (m) =>
              '<li class="' +
              (m.fallen ? 'done' : '') +
              '">' +
              icon(m.fallen ? 'check' : 'flag', 14) +
              '<span>' +
              esc(m.line) +
              esc(m.fallen ? '' : ward(m)) +
              '</span></li>'
          );
    progress = rows.length ? '<ul class="brief-progress">' + rows.join('') + '</ul>' : '';
  }
  const sd = model.side;
  const side = sd
    ? '<p class="brief-side-name">' +
      (sd.mark ? '<b class="side-mark ' + sd.state + '">' + sd.mark + '</b>' : '') +
      '<strong>' +
      esc(sd.name) +
      '</strong>' +
      (sd.stateText ? '<small class="side-state ' + sd.state + '">' + esc(sd.stateText) + '</small>' : '') +
      '</p>' +
      p(sd.detail) +
      (sd.progress && sd.state === 'open' ? p(sd.progress, 'brief-note') : '') +
      (sd.lost ? p(sd.lost, 'brief-note warn') : '') +
      p(sd.rewardText, 'brief-small') +
      p(sd.warning, 'brief-note warn')
    : model.pool.length
      ? p(model.sideNote) +
        '<ul class="brief-pool">' +
        model.pool.map((e) => '<li><strong>' + esc(e.name) + '</strong> ' + esc(e.rewardText) + '</li>').join('') +
        '</ul>'
      : p(model.sideNote);
  // The page stops at 入局 (the producer's ruling of 2026-11-21): how each enemy fights, how
  // many there are and when more arrive are for the player to find out on the board. The
  // model still carries them (journey.js briefing) for the wiki and the tools.
  const foot = live
    ? btn('close', '返回戰盤', 'gold-btn')
    : back
      ? btn('close', back, 'gold-btn')
      : btn('home', '主畫面', 'outline-btn') + btn('brief-next', '進入整備 ' + arrow, 'gold-btn');
  return (
    '<section class="mj-view brief-view">' +
    titleHead('flag', '軍情', esc(model.heading)) +
    (L ? '<p class="brief-live">' + esc(L.line) + '</p>' : '') +
    (model.lead && !live ? '<p class="brief-lead">' + esc(model.lead) + '</p>' : '') +
    '<div class="brief-body"><div class="brief-plan">' +
    planGrid(plan, post) +
    planKey(plan) +
    '</div><div class="brief-text">' +
    sect('brief-kind', '戰局', p(model.battle)) +
    sect('brief-win', '勝利', p(model.win) + progress) +
    sect('brief-loss', '敗退', p(model.loss)) +
    sect('brief-side', '支線', (model.sideLead ? p(model.sideLead + '：', 'brief-small') : '') + side) +
    (model.recruit ? sect('brief-recruit', '入局', p(model.recruit)) : '') +
    '</div></div>' +
    extra +
    '<div class="modal-foot right">' +
    foot +
    '</div></section>'
  );
}
function goalsPage(s) {
  if (s.run)
    return briefPage(s, {
      live: true,
      extra:
      '<details class="hud-disclosure brief-route"><summary>十局次序 · ' +
      (s.run.stage + 1) +
      '／10</summary><ol class="journey-route">' +
      s.run.route
        .map(
          (map, i) =>
            '<li class="' +
            (i === s.run.stage ? 'current' : i < s.run.stage ? 'cleared' : '') +
            '"><small>第' +
            NUMERALS[i] +
            '局</small><strong>' +
            mapLayout(map).name +
            ' · ' +
            mapLayout(map).shapeName +
            ' · ' +
            fieldCells(map).length +
            ' 格' +
            '</strong><span>' +
            (i === s.run.stage
              ? '目前所在'
              : i < s.run.stage
                ? '已破局'
                : i === 9
                  ? '最後一局'
                  : '未抵達') +
            '</span></li>'
        )
        .join('') +
      '</ol></details>'
    });
  return (
    titleHead('flag', '戰役目標') +
    '<div class="goals-detail">' +
    goalRows(s) +
    '</div><div class="rules-block"><h4>勝利條件</h4><p>在第十二回合結束前擊敗余滄海，護住《笑傲江湖》曲譜。</p><h4>失敗條件</h4><p>領隊' +
    DETAILS[leader(s)].name +
    '退場，或超過十二回合仍未擊敗余滄海。</p><h4>額外評價</h4><p>勝利時三位俠客全數存活，可獲「同舟共濟」評價。</p></div>'
  );
}
function terrainPage(s) {
  const { width, height } = fieldSize(s.mapIndex);
  const roster = new Map(s.units.filter(living).map((u) => [u.y * width + u.x, u]));
  const lamp = unclaimedObjectiveTile(s),
    cells = new Map(fieldCells(s.mapIndex).map((cell) => [cell.y * width + cell.x, cell])),
    types = terrainTypes(s.mapIndex);
  const header = Array.from(
    { length: width },
    (_, i) => '<th scope="col">' + (i + 1) + '</th>'
  ).join('');
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = '<tr><th scope="row">' + (y + 1) + '</th>';
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!cells.has(i)) {
        row += '<td class="survey-void" aria-label="棋盤外"></td>';
        continue;
      }
      const kind = cells.get(i).kind,
        u = roster.get(i);
      const isGoal = lamp && lamp.x === x && lamp.y === y;
      const label =
        types[kind].name + (u ? ' · ' + unitDetails(u).name : '') + (isGoal ? ' · 支線燈記' : '');
      const marker = u
        ? '<i class="survey-piece ' + u.side + (s.selected === u.id ? ' chosen' : '') + '"></i>'
        : isGoal
          ? '<i class="survey-lamp" title="支線燈記">燈</i>'
          : '';
      row +=
        '<td class="ground-' +
        kind +
        '" title="' +
        label +
        '" aria-label="' +
        label +
        '">' +
        marker +
        '</td>';
    }
    rows.push(row + '</tr>');
  }
  const legend = Object.entries(types)
    .map(
      ([kind, tile]) =>
        '<li><i class="ground-' +
        kind +
        '"></i><div><strong>' +
        tile.name +
        '</strong><p>' +
        tile.note +
        '</p></div></li>'
    )
    .join('');
  return (
    titleHead('grid', mapLayout(s.mapIndex).name + ' · 地形圖') +
    '<p class="fy-geometry">' +
    esc(mapLayout(s.mapIndex).shapeName) +
    ' · ' +
    cells.size +
    ' 格 · ' +
    width +
    ' × ' +
    height +
    '</p><div class="terrain-survey"><div class="survey-chart" style="--tile-pct:' +
    100 / (width + 1) +
    '%"><p>北</p><table aria-label="' +
    width +
    '列' +
    height +
    '行地形與軍勢"><thead><tr><th></th>' +
    header +
    '</tr></thead><tbody>' +
    rows.join('') +
    '</tbody></table><p>南</p>' +
    '<div class="survey-key"><span><i class="survey-piece ally"></i>我方</span><span><i class="survey-piece enemy"></i>敵方</span>' +
    (lamp ? '<span><i class="survey-lamp">燈</i>支線燈記</span>' : '') +
    '</div></div>' +
    '<ul class="terrain-list">' +
    legend +
    '</ul></div>'
  );
}
function helpPage() {
  // The paragraphs are worded in data/rule-terms.js, which the wiki reads too.
  const rules = guideEntries({ actionFlow });
  return (
    titleHead('help', '操作指南') +
    '<div class="field-help">' +
    rules
      .map(
        ([ic, title, body]) =>
          `<details class="hud-disclosure"><summary>${icon(ic, 17)} ${title}</summary><p>${body}</p></details>`
      )
      .join('') +
    '</div><div class="hotkeys">' +
    (actionFlow
      ? flowHotkeys
      : '<kbd>1</kbd> 移動 <kbd>2</kbd> 招式 <kbd>3</kbd> 待命 <kbd>G</kbd> 棋格 <kbd>[ ]</kbd> 旋轉 <kbd>E</kbd> 結束回合 <kbd>Esc</kbd> 返回 <kbd>?</kbd> 指南') +
    extraHotkeys() +
    '</div>'
  );
}
function settingsPage(p, inBattle = true) {
  return (
    titleHead('settings', '遊戲設定') +
    '<div class="settings-list">' +
    [
      ['sound', 'volume', '遊戲音效', '移動、交鋒及回合提示音'],
      ['grid', 'grid', '棋格邊線', '顯示全戰場地格輪廓'],
      ['motion', 'leaf', '完整動作與特效', '關閉後使用簡化特效。']
    ]
      .map(
        ([k, ic, n, d]) =>
          '<div class="setting-row">' +
          icon(ic, 20) +
          '<div><h4>' +
          n +
          '</h4><p>' +
          d +
          '</p></div>' +
          btn(
            'pref',
            '<i></i>',
            'switch ' + (p[k] ? 'on' : ''),
            'data-id="' + k + '" role="switch" aria-label="' + n + '" aria-checked="' + !!p[k] + '"'
          ) +
          '</div>'
      )
      .join('') +
    '</div><div class="save-panel"><h4>章回存檔</h4><p>行動後自動存檔於此瀏覽器。</p>' +
    '<div class="save-options">' +
    (inBattle
      ? btn('home', icon('undo', 15) + '返回主畫面', 'outline-btn') +
        btn('reset-ask', icon('restart', 15) + '另起一輪', 'outline-btn')
      : '') +
    '</div></div>'
  );
}
function endPage(s) {
  const n = party(s).filter((u) => canAct(s, u)).length;
  return (
    titleHead('end', '結束我方回合') +
    '<div class="confirm-copy"><p>' +
    (n ? '尚有 <strong>' + n + ' 位俠客</strong> 可行動。' : '我方俠客皆已行動。') +
    '</p></div><div class="modal-foot right">' +
    btn('close', '返回戰場', 'outline-btn') +
    btn('end-confirm', '結束回合 ' + icon('end', 15), 'gold-btn') +
    '</div>'
  );
}
// What a charged signature means for whoever strikes next, for signatures that answer a blow
// (or wait for a wounded companion) rather than make one.
const CHARGED = {
  mirror: '蓄勢已成 · 第一下直接攻擊將被反震',
  mend: '蓄勢已成 · 同夥傷重便替他續命',
  stance: '蓄勢已成 · 近身打他必遭全力還擊'
};
// A reinforcement not yet on the board, as the enemy page shows it: the piece built where it
// would enter now (G.arrivalGhosts), or at its own entry tile when that is taken.
function waitingPiece(s, id) {
  for (const p of announcedWaves(s)) {
    const def = p.defs.find((d) => d.id === id);
    if (!def) continue;
    const u = arrivalGhosts(s, p.due).find((g) => g.id === id) || pieceUnit(s, def, p.due);
    return { u, pending: p };
  }
  return null;
}
function enemyPage(s, id) {
  const waiting = find(s, id) ? null : waitingPiece(s, id);
  const u = waiting ? waiting.u : find(s, id),
    i = unitDetails(u),
    special = enemyTechnique(u, s),
    turns = roundsToSignature(s, u);
  return (
    titleHead('target', '敵情查探') +
    '<div class="enemy-summary"><img class="' +
    (i.portraitFile ? 'enemy-face' : 'enemy-mini') +
    '" src="' +
    unitFace(u) +
    '" alt="">' +
    '<div><small>' +
    i.school +
    ' · ' +
    i.role +
    '</small><h3>' +
    i.name +
    '</h3><p>' +
    (i.bio || '對面落下的一枚黑子，守著這一局的要道。') +
    '</p></div></div>' +
    (special
      ? '<div class="enemy-forecast"><strong>' +
        special.name +
        '</strong><span>' +
        (u.conditions?.seal
          ? '本回合封穴，無法施展絕技'
          : u.conditions?.daze
            ? '本回合失神，不會出手'
            : turns === 0
              ? CHARGED[special.style] ||
                (traitsOf(u).stance ? CHARGED.stance : '本回合蓄勢，正是破綻')
              : '距蓄勢 ' + turns + ' 回合') +
        '</span><p>' +
        // A mend or a mirror is no blow, so it has no strength against the normal strike.
        (special.strikes ? '普攻傷害 × ' + special.factor + '。' : '') +
        signatureLines(s, u).map(esc).join('') +
        '</p></div>'
      : '') +
    bar('氣血', u.hp, u.maxHp, 'hp', 'heart') +
    conditionChips(s, u) +
    '<div class="detail-list"><span>攻擊 <b>' +
    stat(u, 'atk', s) +
    '</b></span><span>防禦 <b>' +
    stat(u, 'def', s) +
    '</b></span><span>移動 <b>' +
    stat(u, 'step', s) +
    ' 步</b></span><span>招式 <b>' +
    i.basic +
    '</b></span><span>射程 <b>' +
    reach(s, u) +
    ' 格' +
    (u.conditions?.disarm ? '（纏械）' : '') +
    '</b></span></div>' +
    enemyTraitLines(s, u)
      .concat(
        // 挑釁: derived from where the pieces stand now, as its own action will read it.
        taunters(s, u).map((t) => '受挑釁 · 本回合須攻擊' + DETAILS[t.id].name)
      )
      .map(
        (line) =>
          '<p class="footnote">' +
          icon('flag', 15) +
          // One flowing line: the trait's name in bold, then its words (no column to wrap in).
          '<span>' +
          esc(line).replace(/^【(.+?)】/, '<b class="trait-name">$1</b>　') +
          '</span></p>'
      )
      .join('') +
    (waiting
      ? '<p class="footnote">' +
        icon('stone', 15) +
        '<span>' +
        esc('尚未入場 · 第' + NUMERALS[waiting.pending.due - 1] + '回合自' + waiting.pending.wave.place + '入場') +
        '</span></p>' +
        (waiting.pending.defs.length > 1
          ? '<div class="wave-mates">' +
            waiting.pending.defs
              .map((d) => {
                const mate = pieceUnit(s, d, waiting.pending.due);
                return (
                  '<span class="' +
                  (d.id === id ? 'current' : '') +
                  '"><img src="' +
                  unitFace(mate) +
                  '" alt=""><small>' +
                  esc(unitDetails(mate).name) +
                  '</small></span>'
                );
              })
              .join('') +
            '</div>'
          : '')
      : '<p class="footnote">' +
        icon('stone', 15) +
        ('立於' + tileInfo(u.x, u.y, s.mapIndex).name + '。' + tileInfo(u.x, u.y, s.mapIndex).note) +
        '</p>')
  );
}
function attackPage(s, source, target, skill) {
  const u = find(s, source),
    aimed = typeof target === 'string' ? find(s, target) : target;
  const f = forecast(u, aimed, skill, s),
    a = skill ? artFor(u) : basicFor(u);
  // 代受: the piece clicked is not the one struck; the coverer stands opposite (§9.7).
  const t = f.coveredBy ? find(s, f.coveredBy) : aimed;
  const friendly = f.support,
    blink = f.type === 'ground',
    formation = blink && !!a.zone; // 布陣: the caster stays; the tile is the formation's centre
  const title = formation
    ? '布陣'
    : blink
      ? '輕功落點'
      : f.heal
        ? '運功療傷'
        : friendly
          ? '護持預覽'
          : '交鋒預覽';
  const line = (label, value, cls = '') =>
    '<div><span>' + label + '</span><b class="' + cls + '">' + value + '</b></div>';
  const who = (v) => {
    if (!v.id)
      return (
        '<div class="duelist"><i class="forecast-destination">' +
        icon('move', 29) +
        '</i><small>' +
        (formation ? '陣眼' : '落點') +
        '</small><strong>第 ' +
        (v.x + 1) +
        ' 列・' +
        (v.y + 1) +
        ' 行</strong></div>'
      );
    const info = unitDetails(v);
    return (
      '<div class="duelist"><img class="' +
      (portraits[v.id] || info.portraitFile ? '' : 'mini') +
      '" src="' +
      unitFace(v) +
      '" alt=""><small>' +
      info.school +
      '</small><strong>' +
      info.name +
      '</strong>' +
      (POLISH.forecastBars ? forecastBar(v) : '') +
      '</div>'
    );
  };
  // Polish (forecastBars): each fighter's health, with the predicted change as its own segment.
  // Built only from what forecast() returned: the blow, the reply, and any cost or recovery.
  const forecastBar = (v) => {
    const healed = f.heal ? f.recipients.find((e) => e.id === v.id)?.amount || 0 : 0;
    const own =
      v === u ? f.selfHeal - f.hpCost - f.counter - (f.selfLoss || 0) - (f.rebound || 0) : 0;
    const taken = friendly || blink ? healed : v === t ? -f.amount : 0;
    const after = Math.max(0, Math.min(v.maxHp, v.hp + own + taken));
    const share = (n) => Math.max(0, Math.min(100, (100 * n) / v.maxHp));
    const from = share(Math.min(v.hp, after)),
      to = share(Math.max(v.hp, after));
    const kind = after < v.hp ? ' loss' : after > v.hp ? ' gain' : '';
    const left = after / v.maxHp;
    const level = after <= 0 ? ' ko' : left < 0.25 ? ' crit' : left < 0.5 ? ' warn' : '';
    return (
      '<span class="fc-bar' +
      kind +
      level +
      '" role="img" aria-label="氣血 ' +
      v.hp +
      (kind ? ' → ' + after : '') +
      '／' +
      v.maxHp +
      '"><span class="fc-track"><i class="fc-now" style="width:' +
      from +
      '%"></i>' +
      (kind ? '<i class="fc-delta" style="left:' + from + '%;width:' + (to - from) + '%"></i>' : '') +
      '</span><span class="fc-figures"><b>' +
      v.hp +
      '</b>' +
      (kind ? '<i>→</i><b class="fc-after">' + after + '</b>' : '') +
      '<small>／' +
      v.maxHp +
      '</small></span></span>'
    );
  };
  const lines = [];
  if (formation)
    lines.push(
      line('陣眼', tileInfo(t.x, t.y, s.mapIndex).name + ' · 陣勢 ' + f.zone.length + ' 格')
    );
  else if (blink)
    lines.push(
      line(
        '移至',
        tileInfo(t.x, t.y, s.mapIndex).name +
          ' · ' +
          Math.abs(t.x - u.x) +
          ' 列／' +
          Math.abs(t.y - u.y) +
          ' 行'
      )
    );
  else if (!friendly || f.heal) {
    lines.push(
      line(
        f.heal ? '預計回復' : '預計傷害',
        (f.heal ? '＋' : '−') + f.amount,
        f.heal ? 'positive' : 'negative'
      )
    );
    // Polish (forecastTrim): the fighter's health bar already shows this change.
    if (!(POLISH.forecastTrim && POLISH.forecastBars))
      lines.push(
        line(
          '目標氣血',
          t.hp + ' → ' + (f.heal ? Math.min(t.maxHp, t.hp + f.amount) : Math.max(0, t.hp - f.amount))
        )
      );
  }
  if (!blink && !friendly)
    lines.push(line('敵方還擊', f.counterRaw ? '−' + f.counter + ' 氣血' : '無'));
  if (f.hits.length > 1) lines.push(line('連擊', f.hits.join(' ＋ ')));
  if (f.shielded) lines.push(line('護勁吸收', f.shielded));
  if (f.splash.length)
    lines.push(
      line(
        '波及敵人',
        f.splash.map((v) => unitDetails(find(s, v.id)).name + ' −' + v.amount).join('、')
      )
    );
  if (friendly)
    lines.push(
      line(
        '作用對象',
        f.recipients.map((v) => DETAILS[v.id].name + (f.heal ? ' ＋' + v.amount : '')).join('、')
      )
    );
  for (const e of f.effects)
    lines.push(line('附加效果', effectDescription(e.kind, e.power, e.turns)));
  if (f.push) lines.push(line(a.push ? '擊退' : '牽引', '一格'));
  // 代受 and 號令 change who the action is for: each gets its own row.
  for (const note of f.notes)
    lines.push(
      /^(代受|號令|化功) · /.test(note)
        ? line(note.slice(0, 2), esc(note.slice(5)))
        : line('招式連攜', esc(note))
    );
  if (f.ward) lines.push(line('星索護陣', '已減傷 ' + f.ward + '%'));
  // The secondary: this blow would fell its target and so meet or fail it.
  const sideLine = s.run && !friendly && !blink ? sideForecast(s, u, aimed, f) : '';
  if (sideLine)
    lines.push(line('支線', sideLine.replace(/^支線 · /, ''), sideLine.endsWith('達成') ? 'positive' : 'negative'));
  if (skill)
    lines.push(
      line('自身消耗', f.mpCost + ' 內力' + (f.hpCost ? '、' + f.hpCost + ' 氣血' : ''))
    );
  return (
    titleHead(friendly || blink ? 'spark' : 'swords', title) +
    '<div class="duel">' +
    who(u) +
    '<div class="duel-mid">' +
    icon(a.icon || 'swords', 26) +
    '<strong>' +
    a.name +
    '</strong></div>' +
    who(t) +
    '</div><div class="forecast-lines">' +
    lines.join('') +
    (f.forms.length
      ? '<details class="fo-lore"><summary>招式與兵器特性</summary><p>' +
        moveFacts(s, u, skill ? u.activeArt || 'signature' : 'basic')
          .formRules.map(esc)
          .join('<br>') +
        '</p></details>'
      : '') +
    '</div><div class="modal-foot right">' +
    btn('close', '重選目標', 'outline-btn') +
    btn(
      'strike',
      formation ? '布下陣勢' : blink ? '施展輕功' : friendly ? '施展招式' : '確認出招',
      'gold-btn'
    ) +
    '</div>'
  );
}

function resultPage(s) {
  const won = s.result === 'win',
    alive = party(s).filter(living).length;
  return (
    titleHead(won ? 'flag' : 'shield', '第一回 · 戰果') +
    '<div class="result-banner"><div class="result-seal">' +
    (won ? '勝' : '敗') +
    '</div><h3>' +
    (won ? '曲譜得全' : '渡口失守') +
    '</h3><p>' +
    s.reason +
    '</p></div><div class="result-stats"><span>交戰回合<b>' +
    s.round +
    '</b></span><span>存活俠客<b>' +
    alive +
    ' / 3</b></span><span>擊退敵人<b>' +
    s.stats.kills +
    '</b></span></div>' +
    (won && alive === 3 ? '<p class="award">' + icon('star', 17) + '同舟共濟 · 全員生還</p>' : '') +
    '<div class="modal-foot right">' +
    btn('reset-ask', '重新挑戰', 'outline-btn') +
    btn(won ? 'epilogue' : 'close', won ? '閱讀尾聲 ' + arrow : '查看戰場', 'gold-btn') +
    '</div>'
  );
}

export { itemBonus, medicineIdle, portraits, face, unitFace, esc, factBadge, bookCitation, btn, arrow, titleHead, renderParty, activeHero, commander, goalRows, logRow, sheetPage, profileContents, inventoryPage, skillPage, storyPage, logPage, briefPage, goalsPage, terrainPage, helpPage, settingsPage, endPage, enemyPage, attackPage, resultPage };
