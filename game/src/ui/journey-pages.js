import { wakeJournal, fatePage } from './wake-views.js';
import { moveFacts } from '../rules/move-facts.js';
import { factBadge } from './panels.js';
import * as G from '../rules/game.js';
import { MAZE_TALE, TALE_ART } from '../data/maze-tale.js';
import { art } from './artwork.js';
import { WAKES, closingFor, fragmentArt } from '../data/wake-tale.js';
import { titleHead, btn, esc } from './panels.js';
import { icon } from './icons.js';

function equippedMoves(s, u) {
  const moves = ['basic', ...G.equippedArts(u)].map((id) => {
    const normal = id === 'basic';
    const f = moveFacts(s, u, id);
    const kind = { basic: '普攻', enemy: '敵軍', ally: '友軍', self: '自身', ground: '空地' }[
      f.kind
    ];
    const cost = normal ? '免內力' : f.mp + ' 內力';
    // An art the rules hold back says why in place of its kind and range.
    const ready = normal ? { ok: true } : G.artReady(s, u, id);
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
        (ready.ok ? kind + ' · ' + f.range + ' 格' : esc(ready.reason)) +
        '</small>' +
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
// The end of a run. Won: the heroes have gone home, and the youth climbs the last step,
// loses in one stroke and is told it is not enough. Lost: the stones go dark. Either way he
// leaves a mark on the stone, closes his eyes, and half senses the place where he sleeps.
function journeyEnding(s) {
  const r = s.run,
    won = s.result === 'win',
    wake = WAKES[Math.min(WAKES.length, r.voyage) - 1];
  return (
    titleHead(won ? 'flag' : 'scroll', won ? '階盡' : '眼破') +
    '<div class="result-banner"><div class="result-seal">' +
    (won ? '階' : '破') +
    '</div><h3>' +
    (won ? '還不夠' : '白子俱暗') +
    '</h3><p>' +
    esc(won ? MAZE_TALE.win : MAZE_TALE.loss) +
    '</p></div>' +
    // Won: the last step and the one at the top, seen from behind. Lost: only the youth and
    // the great bird are left by the table.
    '<figure class="ending-figure ending-scene"><img class="tale-scene" src="' +
    esc(art(won ? TALE_ART.win : TALE_ART.loss)) +
    '" alt="" decoding="async"></figure>' +
    '<div class="result-stats"><span>此輪破局<b>' +
    (r.stage + (won ? 1 : 0)) +
    ' / 10</b></span>' +
    '<span>累積的悟<b>' +
    r.chronicle.embers +
    '</b></span><span>最遠走到<b>' +
    r.chronicle.best +
    ' 局</b></span></div>' +
    '<p class="footnote">' +
    (won ? MAZE_TALE.winAgain : '買下的東西寄在通吃坊，下一輪照舊取用。') +
    '</p>' +
    '<p class="wake-manifest">此輪同行　' +
    G.company(s)
      .map((u) => esc(G.unitDetails(u).name))
      .join('、') +
    '</p>' +
    '<section class="wake-choice wake-closing"><h3>留痕</h3><p>' +
    esc(wake.carve) +
    '</p></section>' +
    fatePage(s) +
    '<section class="wake-choice wake-closing"><h3>闔眼</h3><img class="tale-scene wake-fragment" src="' +
    esc(art(fragmentArt(r.voyage))) +
    '" alt="" decoding="async"><p>' +
    esc(closingFor(r.voyage, won)) +
    '</p></section>' +
    wakeJournal(r.chronicle, r.voyage) +
    (won && r.voyage >= 5 && !r.last.fate
      ? ''
      : '<div class="modal-foot right">' +
        btn('home', '返回主畫面', 'outline-btn') +
        btn('title-new', '再睜眼', 'gold-btn') +
        '</div>')
  );
}

// 破招 (SPEC-mechanics §4): with the pointer on an enemy, each equipped form that answers that
// enemy is lit in the arts list, so the player sees which form to bring before picking one.
// The rules decide: the form answers when its 破招 bonus would be added against this target.
function markAnswers(list, s, u, t) {
  const foe = t && G.living(t) && !G.ally(t) && G.canAct(s, u) ? t : null;
  for (const b of list.querySelectorAll('.field-art[data-id]')) {
    const art = b.dataset.id !== 'basic' && G.artFor(u, b.dataset.id);
    const on =
      !!foe && !!art?.answer && G.strikeFactor(s, u, art, foe).notes.some((n) => n.startsWith('破招'));
    b.classList.toggle('answers', on);
  }
}
export { equippedMoves, markAnswers, journeyEnding };
