import { wakeJournal } from './wake-views.js';
import { COMMANDS, commandDescription } from '../rules/battle-mastery.js';
import { rollLeaderInfo } from './mastery-views.js';
import { btn, titleHead, face, esc, bookCitation } from './panels.js';
import { icon } from './icons.js';
import { BOOKS, DETAILS } from '../rules/game.js';
import { MAZE_TALE, YOUTH, WEI, QIUBAI, TALE_ART } from '../data/maze-tale.js';
import { art } from './artwork.js';

const EAGLE_PICTURE = 'npc-eagle.webp';

const amount = (value) => Math.max(0, Math.trunc(Number(value) || 0));
const idAttr = (id) => `data-id="${esc(id)}"`;
const text = (value) => esc(value ?? '');
const coin = '<i class="run-coin" aria-hidden="true"></i>';
const playerImage = (id) => `<img src="${esc(face(id))}" alt="" decoding="async">`;
const scene = (file, cls) => `<img class="tale-scene ${cls}" src="${text(art(file))}" alt="" decoding="async">`;

function drawPortrait(id, captain) {
  const hero = DETAILS[id];
  if (!hero) return '';
  return `<li class="run-lot ${id === captain ? 'lead-lot' : ''}">
    <div class="run-lot-image">${playerImage(id)}${id === captain ? '<span class="run-lot-role">領隊</span>' : ''}</div>
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
    benefits.push(`<span>${icon('bag', 15)}通吃坊寄存 <strong>${parcel} 件</strong></span>`);
  return `<section class="run-view run-roll">
    ${titleHead('scroll', '抓子')}
    <div class="run-lacquer">
      ${scene(TALE_ART.board, 'run-scene')}
      <details class="hud-disclosure draw-tale"><summary>局規</summary><p>${text(MAZE_TALE.draw)}</p><p>棋臺沿上刻著：「${text(MAZE_TALE.rule)}」</p></details>
      <p class="lot-instruction">選一枚先落的子作領隊，是為這一輪的「眼」。領隊倒下，這一輪便結束。</p>
      <ul class="run-lots" aria-label="這一輪抓到的三位俠客">${ids.map((id) => drawPortrait(id, captain)).join('')}</ul>
    </div>
    ${rollLeaderInfo(captain, COMMANDS[captain].name, commandDescription(captain))}
    <details class="hud-disclosure draw-records"><summary>歷輪紀錄與開局資源</summary><div class="run-draw-ledger">
      <dl class="run-records" aria-label="歷輪紀錄">
        ${record('最遠走到', best, '局')}${record('走完十局', meta.wins, '次')}${record('累積的悟', embers, '點')}
      </dl>
      <div class="run-benefits" aria-label="這一輪的開局資源">${benefits.join('')}</div>
    </div></details>
    ${wakeJournal(meta, meta.returns ?? meta.wins ?? 0)}
    ${hasSave ? `<p class="run-save-note">${icon('info', 15)}<span>按下「落子」時，這一輪會取代目前的存檔。</span></p>` : ''}
    <footer class="run-footer run-roll-footer">${btn('close', '返回', 'outline-btn')}${btn('deploy', '落子', 'gold-btn')}</footer>
  </section>`;
}

// The prologue: the youth falls asleep and finds himself beside the stone table, where an old
// man is playing himself. The first time, 求敗 asks who he is and the player types the name. On
// later runs 求敗 remembers him, and greets him by the 境 he has reached.
//   profile  the chronicle (name, returns, wins)
//   step     which page is showing
//   name     the name as typed so far (first run only)
function prologueSteps(profile, name = '') {
  const tale = MAZE_TALE.prologue,
    known = profile.name || '',
    called = known || name || YOUTH.name,
    wins = profile.wins ?? 0;
  const people = { youth: { ...YOUTH, name: called }, qiu: QIUBAI, wei: WEI };
  const named = (line) => String(line).replaceAll('{name}', called);
  const page = (step) => ({
    ...step,
    note: step.note && named(step.note),
    text: step.text && named(step.text),
    speaker: people[step.who]
  });
  // He has been here before only if a name was given: the first visit asks for it.
  const again = known && (profile.returns ?? 0) > 0;
  const steps = again
    ? [
        { note: tale.again.note, picture: EAGLE_PICTURE },
        { who: 'qiu', text: wins >= 5 ? tale.again.beyond : tale.again.greeting[Math.min(4, wins)] },
        { who: 'youth', text: tale.again.youth },
        { who: 'qiu', text: tale.again.reply }
      ]
    : tale.first.map((step) => (step.ask && known ? { ...step, ask: false } : step));
  // Until he has said his name, the page calls him only 少年.
  const asked = known ? -1 : steps.findIndex((step) => step.ask);
  return steps.map((step, i) => {
    const p = page(step);
    if (i <= asked && step.who === 'youth') p.speaker = { ...p.speaker, name: '少年' };
    return { ...p, view: i === 0 ? TALE_ART.wake : '', last: i === steps.length - 1 };
  });
}
function prologuePage(profile, step = 0, name = '') {
  const steps = prologueSteps(profile, name),
    at = Math.max(0, Math.min(step, steps.length - 1)),
    p = steps[at];
  // A page has a picture when someone speaks, or when the narration comes with one.
  const picture = p.speaker?.portrait || p.picture;
  const portrait = picture
    ? `<img class="fy-speaker-portrait" alt="" src="${text(art(picture))}">`
    : '';
  const entry = p.ask
    ? `<label class="youth-name"><span>你的名字</span><input id="youth-name" type="text" maxlength="8" autocomplete="off" spellcheck="false" enterkeyhint="done" value="${text(name)}" placeholder="${text(YOUTH.name)}"></label><p class="footnote">最多八個字。留空便叫「${text(YOUTH.name)}」。這個名字會一直跟著你。</p>`
    : '';
  const said = p.speaker
    ? `<div class="fy-byline"><strong>${text(p.speaker.name)}</strong><small>${text(p.speaker.role)}</small></div><blockquote>${text(p.text)}</blockquote>`
    : '';
  return `<section class="mj-view fy-story fy-prologue">
    <header class="modal-head"><div class="modal-title">${icon('scroll', 20)}<h2>入夢</h2></div><small>序幕</small></header>
    ${p.view ? scene(p.view, 'fy-scene') : ''}<div class="fy-story-body${picture ? '' : ' fy-narration'}">${portrait}<div class="fy-dialogue">
      ${p.note ? (p.picture ? `<blockquote>${text(p.note)}</blockquote>` : `<p class="fy-stage-note">${text(p.note)}</p>`) : ''}${said}${p.after ? `<p class="fy-stage-note">${text(p.after)}</p>` : ''}${entry}
    </div></div>
    <footer class="mj-footer"><div class="fy-reading">${at ? btn('prologue-prev', '上一句', 'mj-action') : ''}<span>${at + 1}／${steps.length}</span></div><aside>${p.last || p.ask ? '' : btn('prologue-skip', '略過', 'mj-action')}${btn('prologue-next', p.last ? '看棋盤' : '下一句', 'gold-btn')}</aside></footer>
  </section>`;
}

export { rollView, prologuePage, prologueSteps };
