import { POLISH } from '../polish.js';
import { COMBINATIONS } from '../data/form-catalog.js';
import { art } from './artwork.js';
import { armory, formationCards, heroStats, planningMap } from './armory-views.js';
import { moveFacts } from '../rules/move-facts.js';
import { factBadge } from './panels.js';
import * as G from '../rules/game.js';
import * as R from '../rules/journey.js';
import { mapLayout } from '../data/terrain.js';
import { COMMANDS, commandDescription } from '../rules/battle-mastery.js';
import { TECHNIQUES } from '../data/martial-arts.js';
import { face, unitFace, btn, titleHead, profileContents, esc, stoneLabel } from './panels.js';
import { personalTraining } from './mastery-views.js';
import { icon } from './icons.js';

const teamTabs = [
  ['line', 'people', '陣容'],
  ['arts', 'tree', '武學'],
  ['stores', 'bag', '裝備物資']
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
// 俠客詳情 for the 武學 tab's header card and the 裝備物資 tab's name row.
const detailsButton = (u) => btn('hero-details', '俠客詳情', 'mj-action mj-compact fy-details', tag(u.id));
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
          '<img alt="" src="' +
            face(u.id) +
            '"><span>' +
            name(u) +
            '</span>' +
            (u.sp > 0 ? '<b class="mj-picker-points" title="武學點 ' + u.sp + '">' + u.sp + '</b>' : ''),
          'mj-picker-unit',
          tag(u.id) +
            (u.sp > 0 ? ' aria-label="' + name(u) + '，武學點 ' + u.sp + '"' : '') +
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
// The pane beside the 陣容 cards: the picked hero's numbers, rank and points, the leader's boon,
// the arts carried, and what can be done with them here (seat, bench, appoint, 修習).
function heroPane(s, u, line) {
  const active = line.includes(u.id),
    chief = line[0] === u.id;
  const role = chief ? '領隊' : active ? '出陣' : '候補';
  const manage = G.managesCompany(s);
  // On the last board the lead is 無名's: he is not benched, and no one else is appointed.
  const held = R.fixedLead(s, line[0]);
  const edit = manage
    ? [
        action(
          'lineup',
          active ? '轉為候補' : '加入出陣',
          u.id,
          active ? line.length > 1 && !(held && chief) : line.length < 5
        ),
        action('appoint', chief ? '現任領隊' : '任為領隊', u.id, active && !chief && !held)
      ].join('')
    : active && G.living(u) && s.run.scene === 'fight'
      ? action('field-control', '操控此俠客', u.id)
      : '';
  const stats = heroStats(s, u)
    .map(
      ([k, label, value, max]) =>
        '<div class="fy-stat-' +
        k +
        '"><dt>' +
        label +
        '</dt><dd>' +
        value +
        (max ? '<small>／' + max + '</small>' : k === 'step' ? '<small> 步</small>' : k === 'range' ? '<small> 格</small>' : '') +
        '</dd></div>'
    )
    .join('');
  // Polish (inkLook): each equipped art can be read in full on a long press or a resting pointer
  // (ui/art-detail.js), so it carries its id and can take the keyboard's focus.
  const readable = (key) => (POLISH.inkLook && key ? ' data-id="' + esc(key) + '" tabindex="0"' : '');
  const slots = (u.slots || []).map((key, i) => {
    const a = key ? G.artFor(u, key) : null;
    return (
      '<li' +
      (a ? ' class="ink-art"' + readable(key) : ' class="fy-art-empty"') +
      '>' +
      icon(a ? a.icon || 'diamond' : 'plus', 15) +
      '<small>第' +
      ['一', '二', '三'][i] +
      '格</small><span>' +
      (a ? esc(a.name) : '空位') +
      '</span></li>'
    );
  });
  const gear = ['weapon', 'gear']
    .map((k) => (u[k] ? G.ITEMS[u[k]]?.name : ''))
    .filter(Boolean)
    .join('、');
  return (
    '<aside class="fy-pane" aria-label="' +
    name(u) +
    '的資料">' +
    // Polish (inkLook): the hero's full-length figure (every hero has one) hung as a scroll, the
    // name set vertically beside it.
    (POLISH.inkLook
      ? '<div class="ink-scroll" aria-hidden="true" style="background-image:url(' +
        art('figure-' + u.id + '.webp') +
        ')">' +
        (role === '領隊' ? '<b class="ink-seal">領隊</b>' : '') +
        '</div><div class="ink-vname" aria-hidden="true">' +
        name(u) +
        '<small>' +
        G.DETAILS[u.id].school +
        '</small></div>'
      : '') +
    '<header class="fy-pane-head"><img src="' +
    face(u.id) +
    '" alt=""><div><small>' +
    role +
    ' · ' +
    G.DETAILS[u.id].school +
    '</small><h3>' +
    name(u) +
    '</h3><p>等級 ' +
    u.level +
    ' · 歷練 ' +
    u.xp +
    '／100</p></div>' +
    '<span class="fy-pane-points' +
    (u.sp > 0 ? ' has-points' : '') +
    '"><b>' +
    u.sp +
    '</b><small>武學點</small></span></header>' +
    '<dl class="fy-pane-stats">' +
    stats +
    '</dl>' +
    (edit ? '<div class="fo-captain-actions">' + edit + '</div>' : '') +
    '<div class="fy-boon">' +
    icon('flag', 18) +
    '<div><strong>' +
    COMMANDS[u.id].name +
    '</strong><p>領隊效果 · ' +
    commandDescription(u.id) +
    '</p></div></div>' +
    '<section class="fy-pane-arts" aria-label="出戰招式"><h4>出戰招式</h4>' +
    // Polish (inkLook): straight to 招式配置 for this hero.
    (POLISH.inkLook
      ? btn('hero-loadout', '配招', 'mj-action ink-loadout', tag(u.id) + ' title="到「招式配置」為' + name(u) + '配招"')
      : '') +
    '<ul><li class="fy-art-basic' +
    (POLISH.inkLook ? ' ink-art"' + readable('basic') : '"') +
    '>' +
    icon('sword', 15) +
    '<small>普攻</small><span>' +
    esc(G.basicFor(u).name) +
    '</span></li>' +
    slots.join('') +
    '</ul>' +
    (gear ? '<p class="fy-pane-gear">' + icon('shield', 14) + esc(gear) + '</p>' : '') +
    '</section><footer class="fy-pane-foot">' +
    btn(
      'hero-train',
      icon('tree', 16) + '修習' + (u.sp > 0 ? '<b>' + u.sp + '</b>' : ''),
      'mj-action fy-train',
      tag(u.id) + ' title="在「武學」頁為' + name(u) + '修習與配招"'
    ) +
    action('hero-details', '俠客詳情', u.id) +
    '</footer></aside>'
  );
}
function memberLine(s, u, ui) {
  const line = positions(s);
  const map = planningMap(s);
  const upcoming = map !== s.mapIndex;
  // The next board's named stones: its master and lieutenant, or on the last board everyone it opens with.
  const foes = upcoming
    ? G.hasFour(map)
      ? // The next board's named opponents: its master, and its lieutenant if it has one.
        G.encounterKeys(map)
          .slice(0, 2)
          .filter((key) => G.DETAILS[key]?.rank)
          .map((id) => ({ id }))
      : // The last board: 求敗 and the masters who stand with him from the start.
        G.castBoard(map, s.run.route).pieces.map((p) => ({ id: p.id }))
    : G.enemies(s).filter((v) => G.unitDetails(v).rank);
  const board = mapLayout(map);
  // The briefing in short: this board's (or, from the shop, the next board's, whose secondary
  // is not drawn yet). It repeats the 軍情 page just left, so it starts folded (app.js teamUI):
  // the folded header keeps the 支線's name, and the one line that bears on the line-up, the
  // warning for a 支線 whose hero is not sent out, shows folded or not (folded, under the header;
  // open, in the 支線 row). 軍情 opens the whole page.
  const model = upcoming ? R.boardBrief(map, s.run.stage + 1, s.run.route) : R.briefing(s);
  const side = model.side;
  const shut = !!ui.missionShut;
  const row = (term, body) => '<div><dt>' + term + '</dt><dd>' + body + '</dd></div>';
  const warning = side?.warning ? '<small class="warn fy-mission-warn">' + icon('info', 14) + esc(side.warning) + '</small>' : '';
  const brief =
    '<section class="wake-mission' +
    (shut ? ' folded' : '') +
    '" aria-label="作戰目標"><header>' +
    icon('flag', 19) +
    '<h3>作戰目標</h3><span>' +
    esc(board.name) +
    '</span>' +
    (shut && side ? '<small class="fy-mission-side">支線 · <strong>' + esc(side.name) + '</strong></small>' : '') +
    btn('brief-open', icon('flag', 14) + '軍情', 'mj-action brief-open', 'title="軍情"') +
    btn(
      'mission-fold',
      icon('down', 14) + (shut ? '展開' : '收起'),
      'mj-action fy-fold',
      'aria-expanded="' + !shut + '" aria-controls="fy-mission-body"'
    ) +
    '</header>' +
    (shut ? warning : '') +
    '<dl id="fy-mission-body"' +
    (shut ? ' hidden' : '') +
    '>' +
    row('勝利', esc(model.win)) +
    row('敗退', esc(model.loss)) +
    // (No row while no 支線 is drawn yet: the shop's look at the next board, and the last board.)
    (side
      ? row('支線', '<strong>' + esc(side.name) + '</strong>　' + esc(side.detail) + '<small>' + esc(side.rewardText) + '</small>' + (shut ? '' : warning))
      : '') +
    (model.recruit ? row('入局', esc(model.recruit)) : '') +
    '</dl></section>';
  return (
    brief +
    '<div class="fy-lineup">' +
    formationCards(s, u, ui) +
    heroPane(s, u, line) +
    '</div>' +
    '<details class="hud-disclosure fy-brief"><summary>' +
    footprint(board) +
    '<span><strong>' +
    board.name +
    ' · 地勢與敵情</strong></span></summary><div class="fy-opponents">' +
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
// The 武學 tab: the picked hero's tree, manuals and slots (the hero panel's own view), with the
// company's spare manuals to hand out under 授業武譜 and the 合招譜 under 招式配置.
function arts(s, u, ui) {
  const shelf = R.guideInventory(s).map((n) =>
    row(
      '《' + n.name + '》' + factBadge(moveFacts(s, u, n.id)),
      '公庫 ×' + n.count + ' · 修習需 ' + TECHNIQUES[n.id].points + ' 武學點',
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
  const combos =
    '<details class="hud-disclosure wake-combinations"><summary>合招譜</summary>' +
    COMBINATIONS.map(
      (c) => '<details><summary>' + esc(c.name) + '</summary><p>' + esc(c.text) + '</p></details>'
    ).join('') +
    '</details>';
  return personalTraining(
    R.treeModel(s, u),
    { tab: ui.skill, node: ui.node, slot: ui.slot },
    {
      team: true,
      details: detailsButton(u),
      guides: list('公庫武譜', shelf, '公庫目前沒有抄本。'),
      loadout: combos
    }
  );
}
function teamPage(s, u, ui) {
  const prep = s.run.scene === 'prep',
    title = prep ? '戰前整備' : '隊伍';
  const content =
    ui.tab === 'line'
      ? memberLine(s, u, ui)
      : ui.tab === 'stores'
        ? armory(s, u, ui, detailsButton(u))
        : arts(s, u, ui);
  const back = prep
    ? btn('home', '主畫面', 'mj-action')
    : btn('close', s.run.scene === 'shop' ? '返回通吃坊' : '返回戰盤', 'mj-action');
  const right = prep
    ? btn('field-deploy', stoneLabel('出陣', s.run.next.length + ' 人', icon('flag', 16) + ' 出陣 · ' + s.run.next.length + ' 人'), 'gold-btn')
    : '';
  return (
    '<section class="mj-view fy-team' +
    (ui.tab === 'arts' ? ' mj-mastery' : '') +
    '">' +
    titleHead('people', title) +
    '<div class="mj-tools" data-frame-tools>' +
    tabs('team-tab', teamTabs, ui.tab) +
    (ui.tab === 'line' ? '' : picker(s, u.id, ui.tab === 'stores')) +
    '</div><div id="fy-section" role="tabpanel" aria-label="' +
    teamTabs.find(([id]) => id === ui.tab)[2] +
    '">' +
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
  // (After the last board is won there is no shop: the ending follows.)
  const dest = opening ? '進入整備' : s.run.last?.ended ? '放下' : '前往通吃坊';
  const next = archive ? (last ? '返回' : '下一句') : last ? dest : '下一句';
  const head =
    '<header class="modal-head"><div class="modal-title">' +
    icon('scroll', 20) +
    '<h2>' +
    R.stageTitle(s.run.stage) +
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
