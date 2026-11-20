import { wakeJournal } from './wake-views.js';
import { COMMANDS, commandDescription } from '../rules/battle-mastery.js';
import { rollLeaderInfo } from './mastery-views.js';
import { btn, titleHead, face, esc, bookCitation } from './panels.js';
import { icon } from './icons.js';
import { BOOKS, DETAILS } from '../rules/game.js';
import { MAZE_TALE } from '../data/maze-tale.js';

const amount = (value) => Math.max(0, Math.trunc(Number(value) || 0));
const idAttr = (id) => `data-id="${esc(id)}"`;
const text = (value) => esc(value ?? '');
const coin = '<i class="run-coin" aria-hidden="true"></i>';
const playerImage = (id) => `<img src="${esc(face(id))}" alt="" decoding="async">`;

function drawPortrait(id, captain) {
  const hero = DETAILS[id];
  if (!hero) return '';
  return `<li class="run-lot ${id === captain ? 'lead-lot' : ''}">
    <div class="run-lot-image">${playerImage(id)}<span class="run-lot-role">${id === captain ? '領隊 · ' : ''}${text(hero.role)}</span></div>
    <div class="run-lot-name"><small>${bookCitation(BOOKS[id])}</small><h3>${text(hero.name)}</h3>
    <span class="run-lot-skill">${icon(hero.skillIcon, 15)}${text(hero.skill)}</span></div>
  ${btn('lead-lot', '<span class="sr-only">選擇' + text(hero.name) + '為領隊</span>', 'lot-choice', idAttr(id) + ' aria-pressed="' + (id === captain) + '"')}
  </li>`;
}

function record(label, value, suffix) {
  return `<div><dt>${label}</dt><dd>${amount(value)}<small>${suffix}</small></dd></div>`;
}

function rollView(ids, meta = {}, hasSave = false, captain = ids[0]) {
  const best = amount(meta.best),
    embers = amount(meta.embers);
  const silver = 24 + 4 * Math.min(embers, 12);
  const parcel = amount(meta.parcelCount);
  const benefits = [`<span>${coin}起手銀兩 <strong>${silver} 兩</strong></span>`];
  if (best >= 4) benefits.push(`<span>${icon('spark', 15)}起手武學點 <strong>＋1</strong></span>`);
  if (best >= 7) benefits.push(`<span>${icon('bottle', 15)}傷藥 <strong>＋1</strong></span>`);
  if (parcel)
    benefits.push(`<span>${icon('bag', 15)}上回寄存 <strong>${parcel} 件</strong></span>`);
  return `<section class="run-view run-roll">
    ${titleHead('scroll', '銅漏啟籤')}
    <div class="run-lacquer">
      <details class="hud-disclosure draw-tale"><summary>渡口籤記</summary><p>${text(MAZE_TALE.draw)}</p></details>
      <p class="lot-instruction">選擇領隊。領隊倒下即告敗。</p>
      <ul class="run-lots" aria-label="此次抽出的三位俠客">${ids.map((id) => drawPortrait(id, captain)).join('')}</ul>
    </div>
    ${rollLeaderInfo(captain, COMMANDS[captain].name, commandDescription(captain))}
    <details class="hud-disclosure draw-records"><summary>渡行紀錄與啟程資源</summary><div class="run-draw-ledger">
      <dl class="run-records" aria-label="歷次渡行紀錄">
        ${record('最深通關', best, '關')}${record('全程通過', meta.wins, '次')}${record('累積餘燼', embers, '點')}
      </dl>
      <div class="run-benefits" aria-label="此次啟程資源">${benefits.join('')}</div>
    </div></details>
    ${wakeJournal(meta, meta.returns ?? meta.wins ?? 0)}
    ${hasSave ? `<p class="run-save-note">${icon('info', 15)}<span>按下「啟程」時，這次旅程會取代目前的存檔。</span></p>` : ''}
    <footer class="run-footer run-roll-footer">${btn('close', '返回', 'outline-btn')}${btn('deploy', '啟程', 'gold-btn')}</footer>
  </section>`;
}

export { rollView };
