import { visitorInvite } from './bowl-views.js';
import { factBadge } from './panels.js';
import { btn, titleHead, face, esc, bookCitation } from './panels.js';
import { icon } from './icons.js';
import { art } from './artwork.js';
import { DETAILS } from '../rules/game.js';

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
const kindNames = {
  root: '根基',
  basic: '基本招式',
  signature: '成名絕學',
  active: '主動招式',
  refinement: '絕技精修'
};
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

function skillHeading(model) {
  const title = model.pathTitle || model.name;
  const citation = model.book ? bookCitation(model.book) : '';
  return `<div class="mj-path">${illustration('run-meridians.webp')}<div class="mj-path-copy"><div class="mj-citation">${text(model.name)}${citation && model.name ? '<i></i>' : ''}${citation}</div><h3>${text(title)}</h3></div><div class="mj-sp">${glyph('spark', 16)}<b>${whole(model.sp)}</b><span>武學點</span></div></div>`;
}
function pathOrigin(model) {
  if (!model.origin && !model.leaderDesc && !model.basicName) return '';
  const source = model.origin ? `<p>${text(model.origin)}</p>` : '';
  const basic = model.basicName
    ? `<div><dt>基本招式</dt><dd>${text(model.basicName)}</dd></div>`
    : '';
  const leader =
    model.leaderName || model.leaderDesc
      ? `<div><dt>領隊效果</dt><dd><b>${text(model.leaderName)}</b>${model.leaderDesc ? ` ${text(model.leaderDesc)}` : ''}</dd></div>`
      : '';
  return `<details class="mj-origin"><summary>${glyph('scroll', 14)}師承與行功${glyph('down', 14)}</summary>${source}${model.originNote ? `<p>${text(model.originNote)}</p>` : ''}${basic || leader ? `<dl>${basic}${leader}</dl>` : ''}</details>`;
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
        `<span class="mj-node-title">${text(node.name)}</span><span class="mj-node-state">${glyph(node.learned ? 'check' : node.canLearn ? 'plus' : 'diamond', 10)}${text(rootRank(node) ? `${rootRank(node)} 重` : node.learned ? '已習' : node.canLearn ? '可修' : '未習')}</span>`,
        `mj-node mj-${state}`,
        `${data(node.id)} data-tab="school" aria-controls="mj-inspector" ${pressed(active)} style="grid-column:${col + 1};grid-row:${row + 1}" aria-label="${text(node.name)}，${tierName(node.tier)}，${text(statusOf(node))}"`
      );
    })
    .join('');
  return `<div class="mj-map-window" role="group" aria-label="門派脈絡與修習先後"><div class="mj-map" style="--mj-lanes:${lanes};--mj-levels:${levels.length};--mj-map-min:${36 + lanes * 61}px"><div class="mj-levels" aria-hidden="true">${levels.map((level) => `<span>${tierName(level)}</span>`).join('')}</div><div class="mj-weave">${mapWires(positions, lanes, levels.length)}${controls}</div></div></div>`;
}
function nodeDetails(node, tab, nodes, library) {
  if (!node) return '';
  const hasCost = node.cost !== undefined && node.cost !== null && node.cost !== '';
  const visibleStudy = node.canLearn || !node.learned;
  const inLibrary = library.some((art) => art.id === node.id);
  const facts = [];
  if (node.rank) facts.push(`<div><dt>修為</dt><dd>${text(node.rank)}</dd></div>`);
  if (visibleStudy && hasCost)
    facts.push(`<div><dt>研習所需</dt><dd>${text(node.cost)} 武學點</dd></div>`);
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
  if (visibleStudy)
    action = btn(
      'learn',
      glyph('book', 15) +
        (rootRank(node) || node.learned
          ? '精進一重'
          : node.kind === 'root'
            ? '研習根基'
            : '修習此招'),
      'mj-action mj-primary',
      `${data(node.id)} ${node.canLearn ? '' : 'disabled'} aria-label="修習${text(node.name)}"`
    );
  else if (inLibrary)
    action = btn('skill-tab', glyph('swords', 15) + '前往招式配置', 'mj-action', data('loadout'));
  return `<section class="mj-detail" id="mj-inspector" tabindex="-1" aria-label="招式詳情"><div class="mj-detail-top"><span class="mj-seal">${glyph(node.icon, 22)}</span><small>${tab === 'guides' ? '授業武譜' : text(kindNames[node.kind] || '門派武學')} · ${tierName(node.tier)}</small></div><h4>${text(node.name)}</h4><div class="mj-state mj-state-${nodeState(node)}">${glyph(node.learned ? 'check' : node.canLearn ? 'plus' : 'diamond', 13)}${text(statusOf(node))}</div>${factBadge(node.facts)}${node.description ? `<details class="fo-lore"><summary>招式解說</summary><p>${text(node.description)}</p>${(node.facts?.formRules || []).map((rule) => '<p>' + text(rule) + '</p>').join('')}${node.facts?.factor ? '<p>攻擊倍率 × ' + text(node.facts.factor) + '</p>' : ''}${node.facts?.animation ? '<p>' + text(node.facts.animation) + '</p>' : ''}</details>` : ''}${facts.length ? `<dl class="mj-facts">${facts.join('')}</dl>` : ''}${node.sourceNote ? `<p class="mj-source">${text(node.sourceNote)}</p>` : ''}${action ? `<div class="mj-detail-action">${action}</div>` : ''}<button type="button" class="mj-return-map mj-text-button" data-frame-return>回看${tab === 'guides' ? '武譜' : '脈絡'}</button></section>`;
}
function schoolContents(model, ui) {
  const nodes = list(model.school),
    current = chooseNode(nodes, ui.node);
  if (!current) return '<p class="mj-empty">此俠客尚無門派武學可供查看。</p>';
  return `<div class="mj-school">${schoolMap(nodes, current)}${nodeDetails(current, 'school', nodes, list(model.library))}</div>${pathOrigin(model)}`;
}
function guideContents(model, ui) {
  const nodes = list(model.guides),
    current = chooseNode(nodes, ui.node);
  if (!current) {
    const remaining = whole(model.pending ?? model.pendingGuides ?? model.unassignedCount);
    const action = remaining
      ? btn('team-guides', glyph('book', 15) + '分配公庫武譜', 'mj-action')
      : '';
    return `<div class="mj-blank">${glyph('book', 33)}<h4>尚未獲授武譜</h4><p>在隊伍的「武譜招式」將武譜交予${text(model.name)}，便可在此修習。</p>${remaining ? `<small>尚有 ${remaining} 冊待授。</small>` : ''}${action}</div>`;
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
  const slotControls = slots
    .map((id, i) =>
      btn(
        'slot-select',
        `<span class="mj-slot-number">${slotName(i)}</span><span class="mj-slot-title">${glyph(id ? artById.get(id)?.icon || 'sword' : 'plus', 16)}<b>${slotTitle(id)}</b></span>`,
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
            ? '成名絕學'
            : '門派武學';
      const label = here ? '已配置' : used >= 0 ? '移至此格' : '配置此格';
      return `<li class="mj-library-row"><span class="mj-item-symbol">${glyph(a.icon, 20)}</span><div><small>${what}${used >= 0 ? ` · ${slotName(used)}` : ''}</small><h4>${text(a.name)}</h4>${factBadge(a.facts)}</div>${btn('slot-set', label, 'mj-action mj-compact', `${data(a.id)} data-slot="${index}" ${here || a.canEquip === false ? 'disabled' : ''} aria-label="${text(a.name)}${here ? '已配置於' : '配置到'}${slotName(index)}"`)}</li>`;
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
  const studyLinks = [btn('skill-tab', '查看門派武學', 'mj-text-button', data('school'))];
  if (list(model.guides).some((n) => !n.learned))
    studyLinks.push(btn('skill-tab', '修習已授武譜', 'mj-text-button', data('guides')));
  return `<div class="mj-slot-bar" role="group" aria-label="三格出戰招式">${slotControls}</div><div class="mj-subhead"><div><h4>可用招式</h4><p>${model.fieldStudy ? '可將剛參悟的招式配置一次。' : model.canConfigure === false ? '可於戰前整備、通吃坊，或全隊尚未行動時換招。' : `選擇招式，裝入${slotName(index)}。`}</p></div>${clear}</div>${entries ? `<ul class="mj-library">${entries}</ul>` : '<p class="mj-empty">尚未習得可配置的招式。</p>'}<div class="mj-study-links">${studyLinks.join('')}</div>`;
}

function personalTraining(model, ui) {
  const tab = skillTabs.some(([id]) => id === ui.tab) ? ui.tab : 'school';
  const body =
    tab === 'school'
      ? schoolContents(model, ui)
      : tab === 'guides'
        ? guideContents(model, ui)
        : loadout(model, ui);
  return tabs('skill', skillTabs, tab) + tabPanel(tab, skillHeading(model) + body, skillTabs);
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
function campRecap(model) {
  const reward =
    typeof model.reward === 'number'
      ? model.reward
        ? `＋${whole(model.reward)} 兩`
        : ''
      : text(model.reward);
  const provenance = model.lost ? '此局失利' : '此局已過';
  return `<section class="mj-berth">${illustration('run-merchant.webp')}<img class="fo-shop-face" src="${text(art('npc-wei.webp'))}" alt="通吃坊掌櫃韋小寶"><div class="mj-berth-copy"><small>${glyph('pin', 13)}韋小寶的通吃坊</small><h3>${text(model.stageName)}</h3><p>${provenance}${reward ? ` · ${reward}` : ''}${model.recruit ? ` · ${text(model.recruit)}入隊` : ''}</p></div></section>${model.objective || model.story ? `<details class="mj-origin mj-recap"><summary>${glyph('scroll', 14)}本局紀錄${glyph('down', 14)}</summary>${model.story ? `<p>${text(model.story)}</p>` : ''}${model.objective ? `<dl><div><dt>局中影</dt><dd>${text(model.objective)}</dd></div></dl>` : ''}</details>` : ''}`;
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
  return `<li class="mj-product"><span class="mj-item-symbol">${item.group === 'manual' ? glyph(item.icon, 20) : '<img class="fo-mini" alt="" src="' + text(art('item-' + item.id + '.webp')) + '">'}</span><div>${item.description ? `<details class="shop-item-detail"><summary>${text(item.name)}</summary><p>${text(item.description)}</p></details>` : `<h5>${text(item.name)}</h5>`}<small>庫存 ${left}<i></i>持有 ${owned}</small></div>${action}</li>`;
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
  const destination = model.final ? '結束此行' : '前往' + text(model.nextName);
  return `<section class="mj-view mj-market">${titleHead('bag', '通吃坊')}<div class="mj-tools fy-shopbar" data-frame-tools><strong>貨架</strong><div class="mj-wallet">${coin}<b>${whole(model.coins)}</b> 兩</div></div>${visitorInvite(model.visit)}${shop(model)}${btn('story', '重讀戰後對話', 'mj-text-button', 'data-id="after"')}<footer class="mj-footer">${model.final ? btn('home', '主畫面', 'mj-action') : btn('team', glyph('people', 16) + ' 整理隊伍', 'mj-action')}${btn('march', destination, 'gold-btn')}</footer></section>`;
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
