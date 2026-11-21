import { COMBINATIONS } from '../data/form-catalog.js';
import { art } from './artwork.js';
import { armory, formationCards, planningMap } from './armory-views.js';
import { moveFacts } from '../rules/move-facts.js';
import { factBadge } from './panels.js';
import * as G from '../rules/game.js';
import * as R from '../rules/journey.js';
import { mapLayout } from '../data/terrain.js';
import { COMMANDS, commandDescription } from '../rules/battle-mastery.js';
import { TECHNIQUES, CAPTAINS } from '../data/martial-arts.js';
import { face, unitFace, btn, titleHead, profileContents, esc } from './panels.js';
import { personalTraining } from './mastery-views.js';
import { icon } from './icons.js';

const teamTabs = [
  ['line', 'people', '陣容'],
  ['stores', 'bag', '裝備物資'],
  ['arts', 'book', '武譜招式']
];
const personTabs = [
  ['sheet', 'person', '人物'],
  ['skills', 'tree', '武學'],
  ['inventory', 'bag', '行裝']
];
const tag = (id) => 'data-id="' + esc(id) + '"';
const action = (key, label, id, enabled = true, more = '') =>
  btn(key, label, 'mj-action', tag(id) + ' ' + more + (enabled ? '' : ' disabled'));
const name = (u) => G.unitDetails(u).name;
function tabs(group, choices, current) {
  return (
    '<div class="mj-tabs fy-tabs" role="tablist" aria-label="' +
    (group === 'team-tab' ? '隊伍管理' : '俠客詳情') +
    '">' +
    choices
      .map(([id, symbol, label]) =>
        btn(
          group,
          icon(symbol, 16) + label,
          'mj-tab',
          tag(id) +
            ' role="tab" aria-selected="' +
            (current === id) +
            '" tabindex="' +
            (current === id ? 0 : -1) +
            '" aria-controls="fy-section"'
        )
      )
      .join('') +
    '</div>'
  );
}
function picker(s, id, gearTargets = false) {
  return (
    '<div class="mj-picker" role="group" aria-label="選擇俠客">' +
    G.company(s)
      .map((u) =>
        btn(
          'view-unit',
          '<img alt="" src="' + face(u.id) + '"><span>' + name(u) + '</span>',
          'mj-picker-unit',
          tag(u.id) +
            (gearTargets ? ' data-drop="gear" data-dest="hero-' + u.id + '"' : '') +
            ' aria-pressed="' +
            (u.id === id) +
            '"'
        )
      )
      .join('') +
    '</div>'
  );
}
function positions(s) {
  return G.managesCompany(s) ? s.run.next : G.party(s).map((u) => u.id);
}
function row(label, note, controls, mark = '') {
  return (
    '<li class="fy-row">' +
    (mark ? '<i class="fy-symbol">' + icon(mark, 18) + '</i>' : '') +
    '<div><strong>' +
    label +
    '</strong>' +
    (note ? '<small>' + note + '</small>' : '') +
    '</div><aside>' +
    controls +
    '</aside></li>'
  );
}
function list(heading, rows, fallback = '') {
  return (
    '<section class="fy-group"><h3>' +
    heading +
    '</h3>' +
    (rows.length ? '<ul>' + rows.join('') + '</ul>' : '<p class="fy-empty">' + fallback + '</p>') +
    '</section>'
  );
}
function footprint(layout) {
  return (
    '<span class="fy-footprint" style="--cols:' +
    layout.width +
    ';--rows:' +
    layout.height +
    '" aria-hidden="true">' +
    layout.cells
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
      .join('') +
    '</span>'
  );
}
function memberLine(s, u, ui) {
  const line = positions(s),
    active = line.includes(u.id),
    chief = line[0] === u.id;
  const role = chief ? '領隊' : active ? '出陣' : '候補';
  const manage = G.managesCompany(s);
  const edit = manage
    ? [
        action(
          'lineup',
          active ? '轉為候補' : '加入出陣',
          u.id,
          active ? line.length > 1 : line.length < 5
        ),
        action('appoint', chief ? '現任領隊' : '任為領隊', u.id, active && !chief)
      ].join('')
    : active && G.living(u) && s.run.scene === 'fight'
      ? action('field-control', '操控此俠客', u.id)
      : '';
  const map = planningMap(s);
  const upcoming = map !== s.mapIndex;
  const foes = upcoming
    ? [{ id: CAPTAINS[map][0] }, { id: 'lieutenant-' + map }]
    : G.enemies(s).filter((v) => G.unitDetails(v).rank);
  const board = mapLayout(map);
  // The briefing in short: this board's (or, from the shop, the next board's, whose secondary
  // is not drawn yet). 軍情 opens the whole briefing.
  const model = upcoming ? R.boardBrief(map, s.run.stage + 1) : R.briefing(s);
  const side = model.side;
  const row = (term, body) => '<div><dt>' + term + '</dt><dd>' + body + '</dd></div>';
  const brief =
    '<section class="wake-mission" aria-label="作戰目標"><header>' +
    icon('flag', 19) +
    '<h3>作戰目標</h3><span>' +
    esc(board.name) +
    '</span>' +
    btn('brief-open', icon('flag', 14) + '軍情', 'mj-action brief-open', 'title="軍情"') +
    '</header><dl>' +
    row('勝利', esc(model.win)) +
    row('敗退', esc(model.loss)) +
    row(
      '支線',
      side
        ? '<strong>' +
            esc(side.name) +
            '</strong>　' +
            esc(side.detail) +
            '<small>' +
            esc(side.rewardText) +
            '</small>' +
            (side.warning ? '<small class="warn">' + esc(side.warning) + '</small>' : '')
        : esc(model.sideNote)
    ) +
    row('兵力', esc(model.force.line) + (model.waves.length ? '' : '<small>' + esc(model.noWaves) + '</small>')) +
    (model.recruit ? row('應帖', esc(model.recruit)) : '') +
    '</dl></section>';
  return (
    brief +
    formationCards(s, u, ui) +
    '<div class="fy-member"><img src="' +
    face(u.id) +
    '" alt=""><div><small>' +
    role +
    ' · ' +
    G.DETAILS[u.id].school +
    '</small><h3>' +
    name(u) +
    '</h3><p>等級 ' +
    u.level +
    '　武學點 ' +
    u.sp +
    '</p></div>' +
    action('hero-details', '俠客詳情', u.id) +
    '</div>' +
    '<div class="fo-captain-actions">' +
    edit +
    '</div>' +
    '<div class="fy-boon">' +
    icon('flag', 18) +
    '<div><strong>' +
    COMMANDS[u.id].name +
    '</strong><p>領隊效果 · ' +
    commandDescription(u.id) +
    '</p></div></div>' +
    '<details class="hud-disclosure fy-brief"><summary>' +
    footprint(board) +
    '<span><strong>' +
    board.name +
    ' · 地勢與敵情</strong><small>' +
    board.shapeName +
    ' · ' +
    board.cells.length +
    ' 格</small></span></summary><div class="fy-opponents">' +
    foes
      .map(
        (v) =>
          '<div><img src="' +
          unitFace(v) +
          '" alt=""><span><small>' +
          G.unitDetails(v).role +
          '</small><strong>' +
          name(v) +
          '</strong></span></div>'
      )
      .join('') +
    '</div><p>' +
    esc(board.tactic) +
    (s.run.stage + (upcoming ? 1 : 0) >= 6
      ? '　敵軍善尋落單領隊。與同伴相鄰，或踏上有防禦加成的地形，可打亂對方選擇目標的次序。'
      : '') +
    '</p></details>'
  );
}
function arts(s, u, ui) {
  const model = R.treeModel(s, u),
    slot = ui.slot;
  const slots =
    '<div class="mj-slot-bar fy-slots" role="group" aria-label="三格出戰招式">' +
    u.slots
      .map((id, i) =>
        btn(
          'slot-select',
          '<small>第' +
            ['一', '二', '三'][i] +
            '格</small><strong>' +
            (id ? G.artFor(u, id).name : '空位') +
            '</strong>',
          'mj-slot',
          tag(i) + ' aria-pressed="' + (i === slot) + '"'
        )
      )
      .join('') +
    '</div>';
  const known = model.library.map((n) =>
    row(
      n.name + factBadge(n.facts),
      (u.slots.includes(n.id) ? '已配置 · ' : '') + '內力 ' + n.mp + ' · ' + n.range + ' 格',
      action(
        'slot-set',
        '裝入第' + (slot + 1) + '格',
        n.id,
        n.canEquip && u.slots[slot] !== n.id,
        'data-slot="' + slot + '"'
      ),
      n.icon
    )
  );
  const assigned = model.guides.map((n) =>
    row(
      '《' + n.name + '》' + factBadge(moveFacts(s, u, n.id)),
      n.learned
        ? '已參悟'
        : n.cost + ' 武學點 · ' + [n.status, n.requirement].filter(Boolean).join(' · '),
      n.learned ? '' : action('learn', '參悟', n.id, n.canLearn),
      'book'
    )
  );
  const library = R.guideInventory(s).map((n) =>
    row(
      '《' + n.name + '》' + factBadge(moveFacts(s, u, n.id)),
      '公庫 ×' + n.count + ' · 參悟 ' + TECHNIQUES[n.id].points + ' 點',
      action(
        'teach-guide',
        u.guides.includes(n.id) ? '已獲授' : '授予' + name(u),
        n.id,
        R.acceptsGuide(s, u, n.id),
        'data-unit="' + u.id + '"'
      ),
      'scroll'
    )
  );
  return (
    '<div class="fy-sectionhead"><h3>出戰招式</h3><small>武學點 ' +
    u.sp +
    '</small></div>' +
    '<div class="fo-basic"><small>普通攻擊</small><strong>' +
    esc(G.basicFor(u).name) +
    '</strong>' +
    factBadge(moveFacts(s, u)) +
    '</div>' +
    slots +
    list('已習招式', known, '尚無可用招式。') +
    (u.slots[slot]
      ? action('slot-clear', '卸下第' + (slot + 1) + '格', slot, model.canConfigure)
      : '') +
    list('已授武譜', assigned, '此俠客尚未獲授武譜。') +
    list('公庫武譜', library, '公庫目前沒有抄本。') +
    action('hero-school', '查看門派武學', u.id) +
    '<details class="hud-disclosure wake-combinations"><summary>合招譜</summary>' +
    COMBINATIONS.map(
      (c) => '<details><summary>' + esc(c.name) + '</summary><p>' + esc(c.text) + '</p></details>'
    ).join('') +
    '</details>'
  );
}
function teamPage(s, u, ui) {
  const prep = s.run.scene === 'prep',
    title = prep ? '戰前整備' : '隊伍';
  const content =
    ui.tab === 'line'
      ? memberLine(s, u, ui)
      : ui.tab === 'stores'
        ? armory(s, u, ui)
        : arts(s, u, ui);
  const back = prep
    ? btn('home', '主畫面', 'mj-action')
    : btn('close', s.run.scene === 'shop' ? '返回通吃坊' : '返回戰盤', 'mj-action');
  const right = prep
    ? btn('field-deploy', icon('flag', 16) + ' 出陣 · ' + s.run.next.length + ' 人', 'gold-btn')
    : '';
  const recipient =
    ui.tab === 'line'
      ? ''
      : '<div class="fy-recipient"><strong>' +
        name(u) +
        '</strong>' +
        action('hero-details', '俠客詳情', u.id) +
        '</div>';
  return (
    '<section class="mj-view fy-team">' +
    titleHead('people', title) +
    '<div class="mj-tools" data-frame-tools>' +
    tabs('team-tab', teamTabs, ui.tab) +
    (ui.tab === 'line' ? '' : picker(s, u.id, ui.tab === 'stores')) +
    '</div><div id="fy-section" role="tabpanel" aria-label="' +
    teamTabs.find(([id]) => id === ui.tab)[2] +
    '">' +
    recipient +
    content +
    '</div><footer class="mj-footer">' +
    back +
    right +
    '</footer></section>'
  );
}
function dossier(s, u, section, ui, parent) {
  const content =
    section === 'sheet'
      ? profileContents(s, u.id)
      : section === 'inventory'
        ? armory(s, u, ui)
        : personalTraining(R.treeModel(s, u), ui);
  const back = parent === 'team' ? (s.run.scene === 'prep' ? '返回整備' : '返回隊伍') : '返回戰盤';
  return (
    '<section class="mj-view fy-dossier ' +
    (section === 'skills' ? 'mj-mastery' : '') +
    '">' +
    titleHead('person', name(u) + ' · 俠客錄') +
    '<div class="mj-tools" data-frame-tools>' +
    tabs('person-tab', personTabs, section) +
    '</div><div id="fy-section" role="tabpanel">' +
    content +
    '</div><footer class="mj-footer">' +
    btn('close', back, 'mj-action') +
    (parent === 'team' ? '' : btn('team', icon('people', 16) + ' 隊伍', 'mj-action')) +
    '</footer></section>'
  );
}
function encounterPage(s, scene, beat, archive = false) {
  const map = mapLayout(s.mapIndex),
    lines = R.dialogue(s, scene),
    current = Math.min(beat, lines.length - 1),
    p = lines[current];
  const opening = scene === 'before',
    last = current === lines.length - 1;
  const label = opening ? '臨陣' : s.result === 'win' ? '戰後 · 勝' : '戰後 · 敗';
  const dest = opening ? '進入整備' : '前往通吃坊';
  const next = archive ? (last ? '返回' : '下一句') : last ? dest : '下一句';
  const head =
    '<header class="modal-head"><div class="modal-title">' +
    icon('scroll', 20) +
    '<h2>第' +
    R.NUMERALS[s.run.stage] +
    '局 · ' +
    map.name +
    '</h2></div><small>' +
    label +
    '</small></header>';
  // The youth and 韋小寶 speak from outside the board, so they have a picture but no unit.
  const portrait = p.person
    ? '<img class="fy-speaker-portrait" alt="" src="' + unitFace(p.person) + '">'
    : '<img class="fy-speaker-portrait" alt="" src="' + art(p.portrait) + '">';
  return (
    '<section class="mj-view fy-story">' +
    head +
    '<div class="fy-story-body">' +
    portrait +
    '<div class="fy-dialogue">' +
    (p.note ? '<p class="fy-stage-note">' + esc(p.note) + '</p>' : '') +
    '<div class="fy-byline"><strong>' +
    esc(p.speaker) +
    '</strong>' +
    (p.role ? '<small>' + esc(p.role) + '</small>' : '') +
    '</div><blockquote>' +
    esc(p.text) +
    '</blockquote>' +
    '</div></div><footer class="mj-footer"><div class="fy-reading">' +
    (current ? btn('scene-prev', '上一句', 'mj-action') : '') +
    '<span>' +
    (current + 1) +
    '／' +
    lines.length +
    '</span></div><aside>' +
    (!archive && !last ? btn('scene-skip', '略過', 'mj-action') : '') +
    btn('scene-next', next, 'gold-btn') +
    '</aside></footer></section>'
  );
}

export { teamPage, dossier, encounterPage };
