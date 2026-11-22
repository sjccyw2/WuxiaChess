// The 境界 picker shown before a run. The 境界 are difficulty levels (data/realms.js); the story
// keys 求敗's lines to the one picked. Once the ending has been seen it also offers the ending
// film again and says what the ending opened (無名 on the board, MAZE_TALE.finale.plus).
import { btn, titleHead, esc } from './panels.js';
import { icon } from './icons.js';
import { REALMS } from '../data/realms.js';
import { WAKES } from '../data/wake-tale.js';
import { MAZE_TALE, YOUTH } from '../data/maze-tale.js';

const NUMERAL = '一二三四五';

//   profile  the chronicle: realms (highest open), cleared (won), ended (times the ending was seen)
//   picked   the 境界 chosen so far
function realmView(profile, picked) {
  const open = Math.max(1, profile.realms || 1),
    cleared = profile.cleared || [];
  const cards = REALMS.map((realm, i) => {
    const n = i + 1,
      shut = n > open,
      won = cleared.includes(n),
      chosen = n === picked;
    const state = shut ? '未開' : won ? '已勝' : '未勝';
    return `<li class="realm-card${shut ? ' shut' : ''}${won ? ' won' : ''}${chosen ? ' chosen' : ''}">
      ${btn(
        'realm-pick',
        `<span class="realm-seal">${NUMERAL[i]}</span><span class="realm-name"><strong>${esc(realm.sword)}境界</strong><small>${esc(WAKES[i].title)}</small></span><span class="realm-state">${state}</span><span class="realm-note">${esc(shut ? '先勝' + REALMS[i - 1].sword + '境界，此重境界方開。' : realm.note)}</span>`,
        'realm-choice',
        `data-id="${n}" aria-pressed="${chosen}" ${shut ? 'disabled' : ''}`
      )}
    </li>`;
  }).join('');
  const ended = profile.ended > 0,
    plus = MAZE_TALE.finale.plus;
  return `<section class="run-view run-realm">
    ${titleHead('scroll', '選境界')}
    <p class="realm-lead">棋臺邊的石上刻著五柄劍的來歷。每勝一輪，求敗便放下一樣，他的黑子便多一分自己，也多一分難纏。選一重境界入夢。勝了已開的最高一重境界，下一重境界方開。無劍境界十局皆勝，便是終局：求敗與${esc(YOUTH.name)}都放下棋子，親自入盤。</p>
    <ol class="realm-list" aria-label="五重境界">${cards}</ol>
    ${ended ? `<p class="realm-plus">${icon('spark', 15)}<span><strong>${esc(plus.title)}</strong>${esc(plus.text.replaceAll('{name}', YOUTH.name))}</span></p>` : ''}
    <footer class="run-footer">${btn('close', '返回', 'outline-btn')}<span class="realm-actions">${ended ? btn('ending-replay', '重看終局', 'outline-btn') : ''}${btn('realm-go', '入夢・' + REALMS[picked - 1].sword + '境界', 'gold-btn')}</span></footer>
  </section>`;
}

export { realmView };
