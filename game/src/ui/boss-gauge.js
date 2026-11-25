// 五劍: 求敗's 氣血 as five bars (G.stageOf), wherever it is read in words and figures: the gauge
// pinned at the top of the battlefield, the bar on his enemy page and in 交鋒預覽. The board's own
// gauge over his head is painted by actors/tokens.js. Game flow, not polish: no switch.
//
// Where the pinned gauge sits (styles/14-battles.css), clear of the plaque, the tools, the
// tutorial card and the arts list:
//   desktop          under the map plaque
//   upright phone    under the top row, across it (the tutorial's card and the framed board
//                    move down by its height)
//   sideways phone   in the top row beside the plaque (the board's tip line keeps the room
//                    between it and the tools)
import * as G from '../rules/game.js';

const NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

// The piece on the board that fights in stages (求敗, on the last board), or null.
const stagedPiece = (s) => (s?.units ? G.enemies(s).find((u) => G.living(u) && G.stageOf(u)) || null : null);

// What a stage is called in words: 「第二劍 · 軟劍」.
const stageWords = (stage) => '第' + NUMBERS[stage.index] + '劍 · ' + stage.name;

// One diamond per stage, in its colour: those gone hollow, the one he is on ringed. The count
// and the place read without the colours.
function stageTicks(u, stage) {
  const stages = G.unitDetails(u).traits.stages;
  return (
    '<span class="stage-ticks" aria-hidden="true">' +
    stages
      .map(
        (v, i) =>
          '<i class="' + (i < stage.index ? 'past' : i === stage.index ? 'now' : '') + '" style="--c:' + v.colour + '"></i>'
      )
      .join('') +
    '</span>'
  );
}

// The bar alone: the current stage, full as it begins.
const stageMeter = (stage, cls = '') =>
  '<span class="stage-meter ' + cls + '"><i style="width:' + (100 * stage.share).toFixed(1) + '%"></i></span>';

// The enemy page's 氣血 row for a piece with stages: the stage's bar in its colour, his real
// 氣血, and the stage by name. `label` is the row's label as the page writes it.
function stageRow(u, label) {
  const stage = G.stageOf(u);
  return (
    '<div class="bar-row stage-row" style="--stage:' +
    stage.colour +
    '"><span class="bar-label">' +
    label +
    '</span>' +
    stageMeter(stage) +
    '<span class="bar-value">' +
    u.hp +
    ' <small>/ ' +
    u.maxHp +
    '</small></span><span class="stage-name">' +
    stageTicks(u, stage) +
    '<b>' +
    stageWords(stage) +
    '</b></span></div>'
  );
}

// The pinned gauge. Shown only while a piece with stages stands on the board being fought.
function syncBossGauge(el, s, battle) {
  const u = battle && s?.run?.scene === 'fight' ? stagedPiece(s) : null;
  const field = el.closest('.battlefield');
  if (!u) {
    if (!el.hidden) el.hidden = true;
    return;
  }
  const stage = G.stageOf(u),
    name = G.unitDetails(u).name;
  const html =
    '<b class="bg-seal" aria-hidden="true">' +
    name[0] +
    '</b><span class="bg-main"><span class="bg-head"><strong>' +
    name +
    '</strong><em>' +
    stage.name +
    '</em>' +
    stageTicks(u, stage) +
    '<span class="bg-hp"><b>' +
    u.hp +
    '</b><small>／' +
    u.maxHp +
    '</small></span></span>' +
    stageMeter(stage, 'bg-bar') +
    '</span>';
  if (el.dataset.html !== html) {
    el.dataset.html = html;
    el.innerHTML = html;
    el.style.setProperty('--stage', stage.colour);
    const words = name + '，' + stageWords(stage) + '，氣血 ' + u.hp + '／' + u.maxHp + '。點按把視角移到他身上';
    el.setAttribute('aria-label', words);
    el.title = words;
  }
  el.dataset.id = u.id;
  el.hidden = false;
  place(el, field);
  if (!placed) {
    // The phone turned or the window changed: the gauge moves with the top row.
    placed = true;
    addEventListener('resize', () => !el.hidden && place(el, el.closest('.battlefield')));
  }
}
let placed = false;

// What the stylesheet needs to know of where the gauge ended up: how far it reaches down past
// the top row (the caption and the framed board move by it), and on a sideways phone the room
// left in the top row between it and the tools (where the tip line sits).
function place(el, field) {
  if (!field) return;
  const f = field.getBoundingClientRect(),
    g = el.getBoundingClientRect(),
    plaque = field.querySelector('.map-plaque')?.getBoundingClientRect(),
    tools = field.querySelector('.hud-tools')?.getBoundingClientRect();
  if (!plaque || !tools || !g.width) return;
  const vars = {
    '--gauge-drop': Math.max(0, Math.round(g.bottom - Math.max(plaque.bottom, tools.bottom))) + 'px',
    '--gauge-end': Math.round(g.right - f.left) + 'px',
    '--tools-start': Math.round(tools.left - f.left) + 'px'
  };
  for (const [k, v] of Object.entries(vars)) if (field.style.getPropertyValue(k) !== v) field.style.setProperty(k, v);
}

export { stagedPiece, stageWords, stageTicks, stageMeter, stageRow, syncBossGauge };
