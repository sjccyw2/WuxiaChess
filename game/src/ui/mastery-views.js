import { visitorInvite } from './bowl-views.js';
import { factBadge } from './panels.js';
import { btn, titleHead, face, esc, bookCitation, itemBonus, stoneLabel } from './panels.js';
import { icon } from './icons.js';
import { art } from './artwork.js';
import { itemPicture } from './item-art.js';
import { DETAILS, ITEMS } from '../rules/game.js';

const text = (value) => esc(value ?? '');
const whole = (value) => Math.max(0, Math.trunc(Number(value) || 0));
const list = (value) => (Array.isArray(value) ? value : []);
const data = (id) => `data-id="${text(id)}"`;
const pressed = (value) => `aria-pressed="${Boolean(value)}"`;
const picture = (id) => `<img src="${text(face(id))}" alt="" decoding="async">`;
const illustration = (name) =>
  `<img class="mj-illustration" src="${text(art(name))}" alt="" decoding="async">`;
const glyph = (name, size = 17) => icon(name || 'diamond', size);
const tiers = ['根基', '一階', '二階', '三階', '四階', '五階', '六階'];
const tierName = (n) => tiers[whole(n)] || `第 ${whole(n)} 階`;
const slotName = (i) => ['第一格', '第二格', '第三格'][i];
// What a node does when learned. Only 普攻精進 upgrades something (the basic attack, and its name
// is written 「本招・式名」); a 新招 or the 成名絕技 is an art of its own in a slot.
const kindNames = {
  root: '根基',
  basic: '普攻精進',
  signature: '根基',
  active: '新招',
  refinement: '成名絕技'
};
// Said under the name only where the kind needs a word more: an upgrade takes the basic
// attack's place. (新招 and 成名絕技 are named on the line above and go in a slot like any art.)
const kindNotes = {
  basic: '取代原本的普攻。'
};
// The small line above a node's name in the tree: the art it belongs to, or 普攻 for an upgrade.
const nodeKicker = (node) => (node.kind === 'basic' ? '普攻精進' : node.family || '');
// An upgrade's name breaks only at its 「・」, never inside 南山掌法.
const nodeTitle = (name) => String(name).split('・').map((part) => `<span class="mj-nowrap">${text(part)}</span>`).join('・<wbr>');
const skillTabs = [
  ['school', 'tree', '門派武學'],
  ['guides', 'book', '授業武譜'],
  ['loadout', 'swords', '招式配置']
];
function tabs(group, options, current) {
  return `<div class="mj-tabs" role="tablist" aria-label="${group === 'skill' ? '武學頁面' : '通吃坊頁面'}">${options.map(([id, symbol, label]) => btn(`${group}-tab`, glyph(symbol) + `<span>${label}</span>`, 'mj-tab', `${data(id)} id="mj-tab-${id}" role="tab" aria-selected="${id === current}" tabindex="${id === current ? 0 : -1}" aria-controls="mj-panel-${id}"`)).join('')}</div>`;
}
function tabPanel(id, content, options) {
  return options
    .map(
      ([key]) =>
        `<div class="mj-panel" id="mj-panel-${key}" role="tabpanel" aria-labelledby="mj-tab-${key}"${id === key ? '' : ' hidden'}>${id === key ? content : ''}</div>`
    )
    .join('');
}
function heroPicker(roster, active) {
  return `<div class="mj-picker" role="group" aria-label="選擇俠客">${list(roster)
    .map((u) =>
      btn(
        'view-unit',
        picture(u.id) + `<span>${text(u.name)}</span>`,
        'mj-picker-unit',
        `${data(u.id)} ${pressed(u.id === active)} aria-label="查看${text(u.name)}的武學"`
      )
    )
    .join('')}</div>`;
}

function rollLeaderInfo(heroOrId, boonName, boonDesc) {
  const hero = typeof heroOrId === 'object' ? heroOrId : DETAILS[heroOrId];
  const title = boonName || hero?.boonName || hero?.leaderName;
  const desc = boonDesc || hero?.boonDesc || hero?.leaderDesc;
  if (!title && !desc) return '';
  return `<div class="mj-boon">${glyph('flag', 19)}<div><p><span>領隊效果${hero?.name ? ` · ${text(hero.name)}` : ''}</span><strong>${text(title)}</strong></p>${desc ? `<small>${text(desc)}</small>` : ''}</div></div>`;
}

// `details` is the team page's 俠客詳情 button (the hero's own page has no use for one).
function skillHeading(model, details = '') {
  const title = model.pathTitle || model.name;
  const citation = model.book ? bookCitation(model.book) : '';
  return `<div class="mj-path">${illustration('run-meridians.webp')}<div class="mj-path-copy"><div class="mj-citation">${text(model.name)}${citation && model.name ? '<i></i>' : ''}${citation}</div><h3>${text(title)}</h3></div><div class="mj-sp">${glyph('spark', 16)}<b>${whole(model.sp)}</b><span>武學點</span></div>${details}</div>`;
}
function pathOrigin(model) {
  if (!model.origin) return '';
  return `<details class="mj-origin"><summary>${glyph('scroll', 14)}師承與行功${glyph('down', 14)}</summary><p>${text(model.origin)}</p></details>`;
}
function statusOf(node) {
  if (node.status) return node.status;
  if (node.learned) return '已習得';
  return node.canLearn ? '可修習' : '待解鎖';
}
function rootRank(node) {
  if (node.kind !== 'root') return 0;
  return whole(node.rankLevel ?? String(node.rank || '').match(/\d+/)?.[0]);
}
function nodeState(node) {
  return node.learned || rootRank(node) > 0 ? 'known' : node.canLearn ? 'ready' : 'locked';
}
function chooseNode(nodes, id) {
  return (
    nodes.find((node) => node.id === id) ||
    nodes.find((node) => node.canLearn) ||
    nodes.find((node) => node.kind === 'signature') ||
    nodes[0]
  );
}

function mapLayout(nodes) {
  const levels = [...new Set(nodes.map((n) => whole(n.tier)))].sort((a, b) => a - b);
  const positions = new Map();
  let lanes = 1;
  levels.forEach((tier, row) => {
    const occupied = new Set();
    for (const node of nodes.filter((n) => whole(n.tier) === tier)) {
      let col = whole(node.lane);
      while (occupied.has(col)) col++;
      occupied.add(col);
      lanes = Math.max(lanes, col + 1);
      positions.set(node.id, { col, row, node });
    }
  });
  return { positions, lanes, levels };
}
function mapWires(positions, width, height) {
  const paths = [];
  for (const dest of positions.values()) {
    for (const id of list(dest.node.parents)) {
      const source = positions.get(id);
      if (!source) continue;
      const x = source.col * 100 + 50,
        y = source.row * 100 + 50;
      const tx = dest.col * 100 + 50,
        ty = dest.row * 100 + 50;
      const middle = y === ty ? y - 42 : (y + ty) / 2;
      const d = `M ${x} ${y} C ${x} ${middle},${tx} ${middle},${tx} ${ty}`;
      paths.push(
        `<path class="${nodeState(source.node) === 'known' && nodeState(dest.node) === 'known' ? 'mj-wire-known' : nodeState(source.node) === 'known' ? 'mj-wire-open' : ''}" d="${d}" vector-effect="non-scaling-stroke"/>`
      );
    }
  }
  return `<svg class="mj-wires" aria-hidden="true" viewBox="0 0 ${width * 100} ${height * 100}" preserveAspectRatio="none">${paths.join('')}</svg>`;
}
function schoolMap(nodes, selected) {
  if (!nodes.length) return '';
  const { positions, lanes, levels } = mapLayout(nodes);
  const controls = [...positions.values()]
    .map(({ col, row, node }) => {
      const state = nodeState(node),
        active = node.id === selected.id;
      return btn(
        'skill-node',
        `${nodeKicker(node) ? `<span class="mj-node-family">${text(nodeKicker(node))}</span>` : ''}<span class="mj-node-title">${nodeTitle(node.name)}</span><span class="mj-node-state">${glyph(node.learned ? 'check' : node.canLearn ? 'plus' : 'diamond', 10)}${text(rootRank(node) ? `${rootRank(node)} 重` : node.learned ? '已習' : node.canLearn ? '可修習' : '未習')}</span>`,
        `mj-node mj-${state}`,
        `${data(node.id)} data-tab="school" aria-controls="mj-inspector" ${pressed(active)} style="grid-column:${col + 1};grid-row:${row + 1}" aria-label="${text(node.name)}，${tierName(node.tier)}，${text(statusOf(node))}"`
      );
    })
    .join('');
  return `<div class="mj-map-window" role="group" aria-label="門派脈絡與修習先後"><div class="mj-map" style="--mj-lanes:${lanes};--mj-levels:${levels.length};--mj-map-min:${36 + lanes * 61}px"><div class="mj-levels" aria-hidden="true">${levels.map((level) => `<span>${tierName(level)}</span>`).join('')}</div><div class="mj-weave">${mapWires(positions, lanes, levels.length)}${controls}</div></div></div>`;
}
// `preview`: a hero not yet in the run (抓子's 俠客詳情): read only, no study or slot buttons.
function nodeDetails(node, tab, nodes, library, preview = false) {
  if (!node) return '';
  const hasCost = node.cost !== undefined && node.cost !== null && node.cost !== '';
  const visibleStudy = node.canLearn || !node.learned;
  const inLibrary = library.some((art) => art.id === node.id);
  const facts = [];
  if (node.rank) facts.push(`<div><dt>修為</dt><dd>${text(node.rank)}</dd></div>`);
  if (visibleStudy && hasCost)
    facts.push(`<div><dt>修習所需</dt><dd>${text(node.cost)} 武學點</dd></div>`);
  if (Number(node.mp) > 0) facts.push(`<div><dt>內力消耗</dt><dd>${text(node.mp)} 點</dd></div>`);
  if (Number(node.hpCost) > 0)
    facts.push(`<div><dt>氣血消耗</dt><dd>${text(node.hpCost)} 點</dd></div>`);
  if (node.range !== undefined && node.range !== null && node.range !== '')
    facts.push(
      `<div><dt>施展距離</dt><dd>${Number(node.range) === 0 ? '自身' : `${text(node.range)} 格`}</dd></div>`
    );
  const parents = list(node.parents)
    .map((id) => nodes.find((entry) => entry.id === id)?.name)
    .filter(Boolean);
  if (node.requirement || parents.length)
    facts.push(
      `<div><dt>修習條件</dt><dd>${text(node.requirement || parents.join('、'))}</dd></div>`
    );
  let action = '';
  if (visibleStudy && !preview)
    action = btn(
      'learn',
      glyph('book', 15) +
        (rootRank(node) || node.learned
          ? '精進一重'
          : node.kind === 'root'
            ? '修習根基'
            : '修習此招'),
      'mj-action mj-primary',
      `${data(node.id)} ${node.canLearn ? '' : 'disabled'} aria-label="修習${text(node.name)}"`
    );
  else if (inLibrary && !preview)
    action = btn('skill-tab', glyph('swords', 15) + '前往招式配置', 'mj-action', data('loadout'));
  // The small line at the top: what the node is and its tier, said once where the two are one
  // word (根基). The fold holds the readable version of the badges, then the note on the novel.
  const kind = tab === 'guides' ? '授業武譜' : kindNames[node.kind] || '門派武學',
    tier = tierName(node.tier);
  return `<section class="mj-detail" id="mj-inspector" tabindex="-1" aria-label="招式詳情"><div class="mj-detail-top"><span class="mj-seal">${glyph(node.icon, 22)}</span><small>${text(kind === tier ? kind : kind + ' · ' + tier)}</small></div><h4>${text(node.name)}${node.family ? `<small class="mj-family">${text(node.family)}</small>` : ''}</h4>${kindNotes[node.kind] ? `<p class="mj-kind-note">${text((kindNames[node.kind] || '') + '：' + kindNotes[node.kind])}</p>` : ''}<div class="mj-state mj-state-${nodeState(node)}">${glyph(node.learned ? 'check' : node.canLearn ? 'plus' : 'diamond', 13)}${text(statusOf(node))}</div>${factBadge(node.facts)}${node.description ? `<details class="fo-lore"><summary>招式解說</summary><p>${text(node.description)}</p>${(node.facts?.formRules || []).map((rule) => '<p>' + text(rule) + '</p>').join('')}${node.facts?.factor ? '<p>攻擊倍率 × ' + text(node.facts.factor) + '</p>' : ''}${node.sourceNote ? `<p class="mj-source">${text(node.sourceNote)}</p>` : ''}</details>` : ''}${facts.length ? `<dl class="mj-facts">${facts.join('')}</dl>` : ''}${action ? `<div class="mj-detail-action">${action}</div>` : ''}<button type="button" class="mj-return-map mj-text-button" data-frame-return>回看${tab === 'guides' ? '武譜' : '脈絡'}</button></section>`;
}
function schoolContents(model, ui) {
  const nodes = list(model.school),
    current = chooseNode(nodes, ui.node);
  if (!current) return '<p class="mj-empty">此俠客尚無門派武學可供查看。</p>';
  return `<div class="mj-school">${schoolMap(nodes, current)}${nodeDetails(current, 'school', nodes, list(model.library), model.preview)}</div>${pathOrigin(model)}`;
}
// In the team page (inTeam) the company's spare manuals are listed under this page, so the empty
// page points down to them instead of away to the team.
function guideContents(model, ui, inTeam = false) {
  const nodes = list(model.guides),
    current = chooseNode(nodes, ui.node);
  if (!current) {
    const remaining = whole(model.pending ?? model.pendingGuides ?? model.unassignedCount);
    const action =
      remaining && !inTeam ? btn('team-guides', glyph('book', 15) + '分配公庫武譜', 'mj-action') : '';
    const how = inTeam
      ? `將下方公庫的武譜授予${text(model.name)}，便可在此修習。`
      : `在隊伍的「武學」頁將武譜交予${text(model.name)}，便可在此修習。`;
    return `<div class="mj-blank">${glyph('book', 33)}<h4>尚未獲授武譜</h4><p>${how}</p>${remaining ? `<small>尚有 ${remaining} 冊待授。</small>` : ''}${action}</div>`;
  }
  const choices = nodes
    .map((n) =>
      btn(
        'skill-node',
        `<span class="mj-guide-symbol">${glyph(n.icon, 20)}</span><span><b>${text(n.name)}</b><small>${tierName(n.tier)} · ${text(statusOf(n))}</small></span>`,
        'mj-guide',
        `${data(n.id)} data-tab="guides" aria-controls="mj-inspector" ${pressed(n.id === current.id)}`
      )
    )
    .join('');
  return `<div class="mj-guides"><div class="mj-guide-list" role="group" aria-label="${text(model.name)}已獲授的武譜">${choices}</div>${nodeDetails(current, 'guides', nodes, list(model.library))}</div>`;
}
function loadout(model, ui) {
  const index = Math.min(2, whole(ui.slot));
  const slots = Array.from({ length: 3 }, (_, i) => list(model.slots)[i] || null);
  const library = list(model.library);
  const artById = new Map(
    [...list(model.school), ...list(model.guides), ...library].map((a) => [a.id, a])
  );
  const slotTitle = (id) => (id ? text(artById.get(id)?.name || id) : '空位');
  // Reach and 內力 cost, shown on every box and every row so arts can be compared at a glance.
  const reach = (f) =>
    f ? `<span class="mj-move-cost"><span>射程 <b>${whole(f.range)}</b> 格</span><span>${f.mp ? `內力 <b>${whole(f.mp)}</b>` : '免內力'}</span>${f.hpCost ? `<span>氣血 <b>${whole(f.hpCost)}</b></span>` : ''}</span>` : '';
  // The basic attack is always carried and cannot be swapped: shown first, as a fixed box.
  const basicBox = model.basicName
    ? `<div class="mj-slot mj-slot-basic" role="img" aria-label="基本攻擊，${text(model.basicName)}，固定不可更換"><span class="mj-slot-number">基本攻擊</span><span class="mj-slot-title">${glyph('sword', 16)}<b>${text(model.basicName)}</b></span>${reach(model.basicFacts)}</div>`
    : '';
  const slotControls = slots
    .map((id, i) =>
      btn(
        'slot-select',
        `<span class="mj-slot-number">${slotName(i)}</span><span class="mj-slot-title">${glyph(id ? artById.get(id)?.icon || 'sword' : 'plus', 16)}<b>${slotTitle(id)}</b></span>${id ? reach(artById.get(id)?.facts) : ''}`,
        `mj-slot ${id ? '' : 'mj-vacant'}`,
        `${data(i)} ${pressed(i === index)} aria-label="選擇${slotName(i)}，${slotTitle(id)}"`
      )
    )
    .join('');
  const entries = library
    .map((a) => {
      const used = slots.indexOf(a.id),
        here = used === index;
      const what =
        a.source === 'guides'
          ? '授業武譜'
          : a.source === 'signature' || a.id === 'signature'
            ? '根基'
            : '門派武學';
      const label = here ? '已配置' : used >= 0 ? '移至此格' : '配置此格';
      return `<li class="mj-library-row"><span class="mj-item-symbol">${glyph(a.icon, 20)}</span><div><small>${what}${used >= 0 ? ` · ${slotName(used)}` : ''}</small><h4>${text(a.name)}${a.family ? `<small class="mj-family">${text(a.family)}</small>` : ''}</h4>${reach(a.facts)}${factBadge(a.facts)}</div>${btn('slot-set', label, 'mj-action mj-compact', `${data(a.id)} data-slot="${index}" ${here || a.canEquip === false ? 'disabled' : ''} aria-label="${text(a.name)}${here ? '已配置於' : '配置到'}${slotName(index)}"`)}</li>`;
    })
    .join('');
  const clear = slots[index]
    ? btn(
        'slot-clear',
        glyph('minus', 13) + '卸下此格',
        'mj-text-button',
        `${data(index)} ${model.canConfigure === false ? 'disabled' : ''} aria-label="卸下${slotName(index)}的${slotTitle(slots[index])}"`
      )
    : '';
  return `<div class="mj-slot-bar${basicBox ? ' mj-with-basic' : ''}" role="group" aria-label="基本攻擊與三格出戰招式">${basicBox}${slotControls}</div><div class="mj-subhead"><div><h4>可用招式</h4><p>${model.fieldStudy ? '可將剛修習的招式配置一次。' : model.canConfigure === false ? '可於戰前整備、通吃坊，或全隊尚未行動時換招。' : `選擇招式，裝入${slotName(index)}。`}</p></div>${clear}</div>${entries ? `<ul class="mj-library">${entries}</ul>` : '<p class="mj-empty">尚未習得可配置的招式。</p>'}`;
}

// The hero's 武學: tree, manuals and slots. `more` adds a page's own lines under a sub-tab (the
// team page's spare manuals under 授業武譜), `more.team` says it is drawn in the team page, and
// `more.details` is that page's 俠客詳情 button for the header card.
function personalTraining(model, ui, more = {}) {
  // A hero not yet in the run has no manuals and no slots to set: the tree alone.
  if (model.preview) return skillHeading(model) + schoolContents(model, ui);
  const tab = skillTabs.some(([id]) => id === ui.tab) ? ui.tab : 'school';
  const body =
    tab === 'school'
      ? schoolContents(model, ui)
      : tab === 'guides'
        ? guideContents(model, ui, more.team)
        : loadout(model, ui);
  return (
    tabs('skill', skillTabs, tab) +
    tabPanel(tab, skillHeading(model, more.details) + body + (more[tab] || ''), skillTabs)
  );
}
function treeView(model, ui = {}) {
  return (
    '<section class="mj-view mj-mastery">' +
    titleHead('tree', '武學修習') +
    '<div class="mj-tools" data-frame-tools>' +
    heroPicker(model.roster, model.id) +
    '</div>' +
    personalTraining(model, ui) +
    '</section>'
  );
}
const groups = [
  ['weapon', '兵器', 'sword'],
  ['gear', '護具與佩飾', 'shield'],
  ['use', '丹藥', 'bottle'],
  ['manual', '武譜抄本', 'book']
];
const coin = '<i class="mj-coin" aria-hidden="true"></i>';
// The board just played, in one line (「青竹渡 · 勝 · ＋36 兩 · 袁承志入隊」, after a loss
// 「紅楓驛 · 敗」), and its record in a fold.
function campRecap(model) {
  const reward =
    typeof model.reward === 'number'
      ? model.reward
        ? `＋${whole(model.reward)} 兩`
        : ''
      : text(model.reward);
  const line = [text(model.stageName), model.lost ? '敗' : '勝', reward, model.recruit ? `${text(model.recruit)}入隊（Lv.${model.recruitLevel}）` : ''].filter(Boolean).join(' · ');
  const bench = model.benchRose?.length ? `<div><dt>場下</dt><dd>${text(model.benchRose.join('、'))}</dd></div>` : '';
  return `<p class="mj-outcome">${line}</p>${model.objective || model.story || bench ? `<details class="mj-origin mj-recap"><summary>${glyph('scroll', 14)}本局紀錄${glyph('down', 14)}</summary>${model.story ? `<p>${text(model.story)}</p>` : ''}${model.objective || bench ? `<dl>${model.objective ? `<div><dt>支線</dt><dd>${text(model.objective)}</dd></div>` : ''}${bench}</dl>` : ''}</details>` : ''}`;
}
function productRow(item, coins) {
  const left = whole(item.left),
    price = whole(item.price),
    owned = whole(item.owned);
  const caption = item.canBuy ? '購買' : !left ? '售罄' : coins < price ? '銀兩不足' : '暫不可購';
  const action = btn(
    'buy',
    `${coin}<span><b>${price}</b> 兩</span><small>${caption}</small>`,
    'mj-buy',
    `${data(item.id)} ${item.canBuy ? '' : 'disabled'} aria-label="${caption}${text(item.name)}，${price} 兩"`
  );
  // What the item does, in numbers, as the armoury says it (「絕技威力 ＋7」): always in sight
  // under the name. The item's own description stays in the fold. (A manual has no such line.)
  const bonus = ITEMS[item.id] ? `<span class="mj-bonus">${text(itemBonus(ITEMS[item.id]))}</span>` : '';
  return `<li class="mj-product"><span class="mj-item-symbol">${item.group === 'manual' ? glyph(item.icon, 20) : itemPicture(item.id, 'fo-mini')}</span><div>${item.description ? `<details class="shop-item-detail"><summary>${text(item.name)}${bonus}</summary><p>${text(item.description)}</p></details>` : `<h5>${text(item.name)}</h5>${bonus}`}<small>庫存 ${left}<i></i>持有 ${owned}</small></div>${action}</li>`;
}
function shop(model) {
  const offers = list(model.offers);
  const stock = groups
    .map(([id, name, symbol]) => {
      const items = offers.filter((i) => i.group === id);
      if (!items.length) return '';
      return `<section class="mj-shelf"><h4>${glyph(symbol, 17)}${name}</h4><ul>${items.map((i) => productRow(i, whole(model.coins))).join('')}</ul></section>`;
    })
    .join('');
  const message = model.final
    ? `<p class="mj-parcel">${glyph('bag', 17)}<span>此處購得的物品與武譜將寄存，於下次啟程時領取。</span></p>`
    : '';
  return `${campRecap(model)}${message}${stock ? `<div class="mj-shelves">${stock}</div>` : '<p class="mj-empty">今日的貨架已空。</p>'}`;
}
function campView(model) {
  const destination = model.final ? '結束此行' : stoneLabel('啟程', text(model.nextName), '前往' + text(model.nextName));
  return `<section class="mj-view mj-market">${titleHead('bag', '通吃坊')}<div class="mj-tools fy-shopbar" data-frame-tools><div class="mj-wallet">${coin}<b>${whole(model.coins)}</b> 兩</div></div>${visitorInvite(model.visit)}${shop(model)}${btn('story', '重讀戰後對話', 'mj-text-button', 'data-id="after"')}<footer class="mj-footer">${model.final ? btn('home', '主畫面', 'mj-action') : btn('team', glyph('people', 16) + ' 整理隊伍', 'mj-action')}${btn('march', destination, 'gold-btn')}</footer></section>`;
}

function selectionKeys(container, strip, selector) {
  strip.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const choices = Array.from(strip.querySelectorAll(selector));
    const index = choices.indexOf(event.target.closest(selector));
    if (index === -1) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? choices.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + choices.length) % choices.length;
    const target = choices[next],
      id = target.dataset.id;
    target.click();
    const replacement = [...container.querySelectorAll(selector)].find(
      (el) => el.dataset.id === id
    );
    replacement?.focus({ preventScroll: true });
    if (replacement?.closest('.mj-picker')) revealHero(replacement.closest('.mj-picker'));
  });
}

function revealHero(strip) {
  const selected = strip?.querySelector('[aria-pressed="true"]');
  if (!selected || !strip.clientWidth) return;
  const left = selected.offsetLeft,
    right = left + selected.offsetWidth;
  if (left < strip.scrollLeft || right > strip.scrollLeft + strip.clientWidth) {
    strip.scrollLeft = Math.max(0, left - (strip.clientWidth - selected.offsetWidth) / 2);
  }
}

function mobileInspector(container, body) {
  body.addEventListener('click', (event) => {
    const win = container.ownerDocument.defaultView;
    if (!win?.matchMedia?.('(max-width: 620px)').matches) return;
    const node = event.target.closest('[data-do="skill-node"]');
    const back = event.target.closest('[data-frame-return]');
    if (!node && !back) return;
    win.requestAnimationFrame(() => {
      const target = container.querySelector(
        back ? '[data-do="skill-node"][aria-pressed="true"]' : '#mj-inspector'
      );
      const scroller = target?.closest('.mj-scroll');
      if (!scroller) return;
      const box = target.getBoundingClientRect(),
        viewport = scroller.getBoundingClientRect();
      if (box.top < viewport.top || box.bottom > viewport.bottom)
        scroller.scrollTop += box.top - viewport.top - 8;
      if (back || event.detail === 0) target.focus({ preventScroll: true });
    });
  });
}

function frameDialog(container) {
  if (!container) return null;
  const child = container.firstElementChild;
  const host =
    container.childElementCount === 1 && child.matches('.run-view,.mj-view') ? child : container;
  const children = [...host.children];
  const oldBody = children.find((el) => el.classList.contains('mj-scroll'));
  if (oldBody) return oldBody;
  container.classList.toggle('mj-frame', host === container);
  host.classList.add('mj-frame');
  const header = children.find((el) => el.classList.contains('modal-head'));
  const controls = children.find((el) => el.hasAttribute('data-frame-tools'));
  const footer = [...children]
    .reverse()
    .find((el) => el.matches('.modal-foot,.run-footer,.mj-footer'));
  const body = container.ownerDocument.createElement('div');
  body.className = 'mj-scroll';
  body.tabIndex = 0;
  body.setAttribute('role', 'region');
  body.setAttribute('aria-label', `${header?.querySelector('h2')?.textContent || '視窗'}內容`);
  for (const node of [...host.childNodes])
    if (node !== header && node !== controls && node !== footer) body.appendChild(node);
  header?.classList.add('mj-fixed-head');
  footer?.classList.add('mj-fixed-foot');
  host.replaceChildren(...[header, controls, body, footer].filter(Boolean));
  for (const strip of host.querySelectorAll('.mj-tabs'))
    selectionKeys(container, strip, '[role="tab"]');
  const picker = controls?.querySelector('.mj-picker');
  if (picker) {
    selectionKeys(container, picker, '.mj-picker-unit');
    revealHero(picker);
    container.ownerDocument.defaultView?.requestAnimationFrame?.(() => revealHero(picker));
  }
  if (host.classList.contains('mj-mastery')) mobileInspector(container, body);
  return body;
}

export { rollLeaderInfo, personalTraining, treeView, campView, frameDialog };
