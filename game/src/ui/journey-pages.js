import { wakeJournal } from './wake-views.js';
import { moveFacts } from '../rules/move-facts.js';
import { factBadge } from './panels.js';
import * as G from '../rules/game.js';
import { MAZE_TALE, TALE_ART } from '../data/maze-tale.js';
import { art } from './artwork.js';
import { WAKES, NO_MARK, closingFor, fragmentArt } from '../data/wake-tale.js';
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
// The end of a run. Won: the white stones have gone home, 求敗 says what he saw this run, cuts a
// line in the stone beside the table and sends the youth home. Lost: the white stones go back in
// the box. Either way the youth wakes, with only a shadow of the dream and something in his hands.
function journeyEnding(s) {
  const r = s.run,
    won = s.result === 'win',
    realm = Math.min(WAKES.length, Math.max(1, r.realm || 1)),
    wake = WAKES[realm - 1],
    // Every 境界 won tells how its line came to be cut.
    carved = won;
  return (
    titleHead(won ? 'flag' : 'scroll', won ? '好棋' : '眼破') +
    '<div class="result-banner"><div class="result-seal">' +
    (won ? '勝' : '破') +
    '</div><h3>' +
    (won ? '請回吧' : '白子俱暗') +
    '</h3><p>' +
    esc(won ? MAZE_TALE.win : MAZE_TALE.loss) +
    '</p></div>' +
    // After a lost run the white stones have gone dark and go back into the box.
    (won
      ? ''
      : '<figure class="ending-figure ending-scene"><img class="tale-scene" src="' +
        esc(art(TALE_ART.loss)) +
        '" alt="" decoding="async"></figure>') +
    '<div class="result-stats"><span>此輪破局<b>' +
    (r.stage + (won ? 1 : 0)) +
    ' / 10</b></span>' +
    '<span>累積的悟<b>' +
    r.chronicle.embers +
    '</b></span><span>最遠走到<b>' +
    r.chronicle.best +
    ' 局</b></span></div>' +
    '<p class="footnote">' +
    MAZE_TALE.winNote +
    '</p>' +
    '<p class="wake-manifest">此輪同行　' +
    G.company(s)
      .map((u) => esc(G.unitDetails(u).name))
      .join('、') +
    '</p>' +
    '<section class="wake-choice wake-closing"><h3>' +
    (carved ? esc(wake.name) : '臺邊的石') +
    '</h3><p>' +
    esc(carved ? wake.carve : NO_MARK) +
    '</p></section>' +
    '<section class="wake-choice wake-closing"><h3>夢醒</h3><img class="tale-scene wake-fragment" src="' +
    esc(art(fragmentArt(realm))) +
    '" alt="" decoding="async"><p>' +
    esc(closingFor(realm, won)) +
    '</p></section>' +
    // Winning the highest open 境界 opens the next; winning the fifth brings the last battle.
    (r.last?.opened
      ? '<p class="realm-opened">' + icon('spark', 15) + '<span>第' + '一二三四五'[r.last.opened - 1] + '境界已開。下一輪入夢之前，可以選它。</span></p>'
      : '') +
    wakeJournal(r.chronicle, r.voyage) +
    '<div class="modal-foot right">' +
    btn('home', '返回主畫面', 'outline-btn') +
    (r.last?.finale ? btn('finale-open', '最後一局', 'gold-btn') : btn('title-new', '再入夢', 'gold-btn')) +
    '</div>'
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
