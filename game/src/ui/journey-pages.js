import { wakeJournal, fatePage } from './wake-views.js';
import { moveFacts } from '../rules/move-facts.js';
import { factBadge } from './panels.js';
import { NEW_VOICES } from '../data/new-heroes.js';
import * as G from '../rules/game.js';
import { NUMERALS } from '../rules/journey.js';
import { mapLayout } from '../data/terrain.js';
import { MAZE_TALE, CHAMBER_TALES } from '../data/maze-tale.js';
import { titleHead, btn, face, esc } from './panels.js';
import { icon } from './icons.js';

function stageScenes(s) {
  const stage = CHAMBER_TALES[s.mapIndex],
    voices = [...(NEW_VOICES[s.mapIndex] || []), stage.voice],
    who = G.party(s)
      .map((u) => voices.find((v) => v.id === u.id))
      .find(Boolean);
  const scenes = [];
  if (!s.run.stage) {
    scenes.push({ speaker: '桑婆婆', note: MAZE_TALE.opening[0], text: MAZE_TALE.opening[1] });
    scenes.push({ speaker: '桑婆婆', note: MAZE_TALE.opening[2], text: MAZE_TALE.deploy });
  }
  if (s.mapIndex === 9)
    scenes.push({
      speaker: '慕容博・漏中身',
      face: 'murong',
      note: stage.arrival,
      text: MAZE_TALE.boss.line
    });
  scenes.push({
    speaker: who ? G.DETAILS[who.id].name : '桑婆婆',
    face: who?.id,
    note: s.mapIndex === 9 ? MAZE_TALE.boss.reply : stage.arrival,
    text: who?.line || mapLayout(s.mapIndex).tactic
  });
  return scenes;
}
function stageStory(s, n) {
  const scenes = stageScenes(s),
    i = Math.max(0, Math.min(n, scenes.length - 1)),
    p = scenes[i];
  return (
    titleHead('scroll', '江湖異聞') +
    '<div class="story-paper"><div class="section-kicker">第' +
    NUMERALS[s.run.stage] +
    '渡<i></i>' +
    mapLayout(s.mapIndex).name +
    '</div><p class="narration">' +
    p.note +
    '</p><div class="dialogue">' +
    (p.face ? '<img alt="" src="' + face(p.face) + '">' : '<span class="ferryman-seal">渡</span>') +
    '<div><strong>' +
    p.speaker +
    '</strong><blockquote>' +
    p.text +
    '</blockquote></div></div></div>' +
    '<div class="modal-foot">' +
    btn('story-prev', '上一幕', 'outline-btn', i ? '' : 'disabled') +
    '<div class="page-dots">' +
    scenes.map((_, j) => '<i class="' + (i === j ? 'on' : '') + '"></i>').join('') +
    '</div>' +
    btn(
      i === scenes.length - 1 ? 'close' : 'story-next',
      i === scenes.length - 1 ? '踏入陣中' : '下一幕',
      'gold-btn'
    ) +
    '</div>'
  );
}
function equippedMoves(s, u) {
  const moves = ['basic', ...G.equippedArts(u)].map((id) => {
    const normal = id === 'basic';
    const f = moveFacts(s, u, id);
    const kind = { basic: '普攻', enemy: '敵軍', ally: '友軍', self: '自身', ground: '空地' }[
      f.kind
    ];
    const cost = normal ? '免內力' : f.mp + ' 內力';
    const estimates = normal
      ? G.enemies(s)
          .filter((t) => G.living(t) && G.targetOK(s, u, t, false))
          .map((t) => G.forecast(u, t, false, s).amount)
      : [];
    const low = Math.min(...estimates),
      high = Math.max(...estimates);
    const inReach = estimates.length
      ? '<small class="fo-nearby">射程內預估 ' +
        (low === high ? low : low + '–' + high) +
        ' 傷害</small>'
      : '';
    return btn(
      normal ? 'attack' : 'quick-art',
      '<i>' +
        icon(normal ? 'swords' : G.artFor(u, id).icon, 19) +
        '</i><span><strong>' +
        esc(f.name) +
        '</strong><small>' +
        kind +
        ' · ' +
        f.range +
        ' 格</small>' +
        factBadge(f) +
        inReach +
        '</span><b>' +
        cost +
        '</b>',
      'field-art fo-move',
      'data-id="' + id + '" ' + (G.canAct(s, u) && (normal || G.canPay(s, u, id)) ? '' : 'disabled')
    );
  });
  if (G.canConfigure(s, u) || (G.canAct(s, u) && u.unplacedArts?.length))
    moves.push(btn('field-loadout', icon('book', 15) + '招式配置', 'field-loadout'));
  return moves.join('');
}
function journeyEnding(s) {
  const r = s.run,
    won = s.result === 'win',
    tale = won ? MAZE_TALE.win : MAZE_TALE.loss;
  return (
    titleHead(won ? 'flag' : 'scroll', won ? '十漏歸時' : '折返青竹渡') +
    '<div class="result-banner"><div class="result-seal">' +
    (won ? '歸' : '渡') +
    '</div><h3>' +
    (won ? '晨光終至' : '舟燈尚在') +
    '</h3><p>' +
    esc(tale) +
    '</p></div><div class="result-stats"><span>此行破關<b>' +
    (r.stage + (won ? 1 : 0)) +
    ' / 10</b></span>' +
    '<span>歷世餘燼<b>' +
    r.chronicle.embers +
    '</b></span><span>最高紀錄<b>' +
    r.chronicle.best +
    ' 渡</b></span></div>' +
    '<p class="footnote">' +
    (won ? MAZE_TALE.winAgain : '船上的寄存與歷次餘燼，會隨新籤再渡。') +
    '</p>' +
    (won
      ? '<p class="wake-manifest">此航應聲同行　' +
        G.company(s)
          .map((u) => esc(G.unitDetails(u).name))
          .join('、') +
        '</p>'
      : '') +
    fatePage(s) +
    wakeJournal(r.chronicle, r.voyage) +
    (won && r.voyage >= 5 && !r.last.fate
      ? ''
      : '<div class="modal-foot right">' +
        btn('home', '返回主畫面', 'outline-btn') +
        btn('title-new', '重投三籤', 'gold-btn') +
        '</div>')
  );
}

export { stageScenes, stageStory, equippedMoves, journeyEnding };
