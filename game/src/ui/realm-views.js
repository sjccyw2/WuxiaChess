// The 境界 picker shown before a run, and the placeholder last battle and ending that follow the
// fifth 境界 won. The 境界 are difficulty levels (data/realms.js); the story keys 求敗's lines to the
// one picked.
import { btn, titleHead, esc } from './panels.js';
import { icon } from './icons.js';
import { art } from './artwork.js';
import { REALMS } from '../data/realms.js';
import { WAKES } from '../data/wake-tale.js';
import { MAZE_TALE, YOUTH, QIUBAI } from '../data/maze-tale.js';

const NUMERAL = '一二三四五';

//   profile  the chronicle: realms (highest open), cleared (won), finale (times reached)
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
        `<span class="realm-seal">${NUMERAL[i]}</span><span class="realm-name"><strong>第${NUMERAL[i]}境界・${esc(realm.sword)}</strong><small>${esc(WAKES[i].title)}</small></span><span class="realm-state">${state}</span><span class="realm-note">${esc(shut ? '先勝第' + NUMERAL[i - 1] + '境界，此重境界方開。' : realm.note)}</span>`,
        'realm-choice',
        `data-id="${n}" aria-pressed="${chosen}" ${shut ? 'disabled' : ''}`
      )}
    </li>`;
  }).join('');
  const finale = profile.finale > 0;
  return `<section class="run-view run-realm">
    ${titleHead('scroll', '選境界')}
    <p class="realm-lead">棋臺邊的石上刻著五柄劍的來歷。每勝一輪，求敗便放下一樣，他的黑子便多一分自己，也多一分難纏。選一重境界入夢。勝了已開的最高一重境界，下一重境界方開；五重境界皆勝，便有最後一局。</p>
    <ol class="realm-list" aria-label="五重境界">${cards}</ol>
    <footer class="run-footer">${btn('close', '返回', 'outline-btn')}<span class="realm-actions">${finale ? btn('finale-replay', '重看終局', 'outline-btn') : ''}${btn('realm-go', '入夢・第' + NUMERAL[picked - 1] + '境界', 'gold-btn')}</span></footer>
  </section>`;
}

// A line of the finale with {name} filled and its speaker named.
function finaleLine(line, name) {
  const fill = (t) => String(t ?? '').replaceAll('{name}', name);
  const who = line.who === 'qiu' ? QIUBAI.name : line.who === 'youth' ? name : '';
  return who
    ? `<p class="finale-said"><strong>${esc(who)}</strong>「${esc(fill(line.text))}」</p>`
    : `<p class="finale-note">${esc(fill(line.note))}</p>`;
}
// Black and white stones on the little board the ending shows; black ones go dark as he lets
// go, white ones light.
const STONES = [
  [2, 2, 'b'], [6, 2, 'w'], [4, 3, 'b'], [3, 4, 'w'], [5, 4, 'b'], [4, 5, 'w'], [2, 6, 'b'],
  [6, 6, 'w'], [1, 4, 'b'], [7, 4, 'w'], [4, 1, 'b'], [4, 7, 'w'], [3, 6, 'b'], [5, 2, 'w']
];
//   phase  'board' (the eleventh board), 'letGo' (the ending), 'wake'
function finaleView(name, phase = 'board') {
  const tale = MAZE_TALE.finale,
    who = name || YOUTH.name;
  const placeholder = (text) => `<p class="finale-placeholder">${icon('info', 15)}<span>${esc(text)}</span></p>`;
  if (phase === 'board')
    return `<section class="run-view run-finale finale-board">
      ${titleHead('flag', '第十一局')}
      <div class="finale-cast">
        <figure><img src="${esc(art('finale-youth.webp'))}" alt="" decoding="async"><figcaption>${esc(who)}<small>上盤</small></figcaption></figure>
        <span class="finale-versus" aria-hidden="true">對</span>
        <figure><img src="${esc(art('finale-qiubai.webp'))}" alt="" decoding="async"><figcaption>${esc(QIUBAI.name)}<small>上盤</small></figcaption></figure>
      </div>
      <div class="finale-lines">${tale.board.map((line) => finaleLine(line, who)).join('')}</div>
      ${placeholder('暫代：最後一局尚未製成。將來是一張新的棋盤，少年與求敗親自上盤，與俠客、反派同場。此處先跳過這一局。')}
      <footer class="run-footer">${btn('home', '返回主畫面', 'outline-btn')}${btn('finale-next', '下完這一局', 'gold-btn')}</footer>
    </section>`;
  if (phase === 'letGo') {
    const stones = STONES.map(
      ([x, y, c], i) => `<i class="finale-stone ${c}" style="--x:${x};--y:${y};--i:${i}"></i>`
    ).join('');
    const lines = tale.letGo
      .map((line, i) => `<div class="finale-caption" style="--n:${i}">${finaleLine(line, who)}</div>`)
      .join('');
    return `<section class="run-view run-finale finale-letgo" style="--steps:${tale.letGo.length}">
      ${titleHead('scroll', '放下')}
      <div class="finale-stage" aria-hidden="true">
        <img class="finale-elder" src="${esc(art('finale-qiubai.webp'))}" alt="" decoding="async">
        <div class="finale-goban">${stones}<i class="finale-held"></i></div>
      </div>
      <div class="finale-captions" aria-live="polite">${lines}</div>
      ${placeholder('暫代：終局的動畫尚未製成，此處以簡單的動畫代之。')}
      <footer class="run-footer">${btn('home', '返回主畫面', 'outline-btn')}${btn('finale-next', '夢醒', 'gold-btn finale-done')}</footer>
    </section>`;
  }
  return `<section class="run-view run-finale finale-wake">
    ${titleHead('scroll', '夢醒')}
    <img class="tale-scene finale-wake-scene" src="${esc(art('fragment-5.webp'))}" alt="" decoding="async">
    <p class="finale-note">${esc(tale.wake)}</p>
    ${placeholder('暫代：少年夢醒、練劍、遇鵰的結局尚待製作人設計。')}
    <footer class="run-footer">${btn('finale-replay', '再看一遍', 'outline-btn')}${btn('home', '返回主畫面', 'gold-btn')}</footer>
  </section>`;
}

export { realmView, finaleView };
