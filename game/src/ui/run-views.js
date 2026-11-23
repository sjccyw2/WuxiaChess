import { wakeJournal } from './wake-views.js';
import { COMMANDS, commandDescription } from '../rules/battle-mastery.js';
import { rollLeaderInfo } from './mastery-views.js';
import { btn, titleHead, face, esc, bookCitation } from './panels.js';
import { icon } from './icons.js';
import { BOOKS, DETAILS } from '../rules/game.js';
import { MAZE_TALE, YOUTH, WEI, acrossTable, TALE_ART } from '../data/maze-tale.js';
import { art } from './artwork.js';
import { REALMS } from '../data/realms.js';

const EAGLE_PICTURE = 'npc-eagle.webp';

const amount = (value) => Math.max(0, Math.trunc(Number(value) || 0));
const idAttr = (id) => `data-id="${esc(id)}"`;
const text = (value) => esc(value ?? '');
const coin = '<i class="run-coin" aria-hidden="true"></i>';
const playerImage = (id) => `<img src="${esc(face(id))}" alt="" decoding="async">`;
const scene = (file, cls) => `<img class="tale-scene ${cls}" src="${text(art(file))}" alt="" decoding="async">`;

// One of the five drawn. The card itself keeps the stone or puts it back (three are kept); a kept
// stone that is not the leader carries a small 立為領隊 button above the card.
function drawPortrait(id, captain, kept, full) {
  const hero = DETAILS[id];
  if (!hero) return '';
  const keep = kept.includes(id),
    lead = keep && id === captain,
    blocked = !keep && full;
  const choice = keep
    ? '放回' + text(hero.name)
    : blocked
      ? '已留下三枚：先放回一枚，才能留下' + text(hero.name)
      : '留下' + text(hero.name);
  return `<li class="run-lot ${lead ? 'lead-lot' : ''} ${keep ? 'kept-lot' : 'back-lot'}">
    <div class="run-lot-image">${playerImage(id)}${lead ? '<span class="run-lot-role">領隊</span>' : keep ? '<span class="run-lot-role kept-role">留下</span>' : ''}</div>
    <div class="run-lot-name"><small>${bookCitation(BOOKS[id])}</small><h3>${text(hero.name)}</h3>
    <span class="run-lot-skill">${icon(hero.skillIcon, 15)}${text(hero.skill)}</span>
    ${keep && !lead ? btn('lead-lot', '立為領隊', 'lot-lead', idAttr(id) + ' aria-label="選擇' + text(hero.name) + '為領隊"') : ''}</div>
  ${btn('keep-lot', '<span class="sr-only">' + choice + '</span>', 'lot-choice', idAttr(id) + ' aria-pressed="' + keep + '"' + (blocked ? ' aria-disabled="true"' : ''))}
  </li>`;
}

function record(label, value, suffix) {
  return `<div><dt>${label}</dt><dd>${amount(value)}<small>${suffix}</small></dd></div>`;
}

function rollView(ids, meta = {}, hasSave = false, captain = ids[0], kept = ids.slice(0, 3)) {
  const best = amount(meta.best),
    embers = amount(meta.embers);
  const silver = 24 + 4 * Math.min(embers, 12);
  const parcel = amount(meta.parcelCount);
  const benefits = [`<span>${coin}起手銀兩 <strong>${silver} 兩</strong></span>`];
  if (best >= 4) benefits.push(`<span>${icon('spark', 15)}起手武學點 <strong>＋1</strong></span>`);
  if (best >= 7) benefits.push(`<span>${icon('bottle', 15)}傷藥 <strong>＋1</strong></span>`);
  if (parcel)
    benefits.push(`<span>${icon('bag', 15)}通吃坊寄存 <strong>${parcel} 件</strong></span>`);
  const realmAt = Math.min(REALMS.length, Math.max(1, meta.realm || 1)),
    realm = REALMS[realmAt - 1];
  return `<section class="run-view run-roll">
    ${titleHead('scroll', '抓子')}
    <p class="run-kicker realm-kicker">${icon('flag', 14)}${text(realm.sword)}境界　${text(realm.note)}</p>
    <div class="run-lacquer">
      ${scene(TALE_ART.board, 'run-scene')}
      <details class="hud-disclosure draw-tale"><summary>局規</summary><p>${text(MAZE_TALE.draw)}</p><p>棋臺沿上刻著：「${text(MAZE_TALE.rule)}」</p></details>
      <p class="lot-instruction">從五位中留下三位，再選一位作領隊。領隊倒下，這一輪便結束。<strong class="lot-count">已留 ${kept.length}／3</strong></p>
      <ul class="run-lots run-lots-five${meta.settled ? ' settled' : ''}" aria-label="這一輪抓到的五位俠客，留下三位">${ids.map((id) => drawPortrait(id, captain, kept, kept.length >= 3)).join('')}</ul>
      ${meta.ended > 0 ? `<p class="lot-plus"><img src="${text(art(YOUTH.portrait))}" alt="" decoding="async"><span><strong>${text(MAZE_TALE.finale.plus.title)}</strong>${text(MAZE_TALE.finale.plus.draw.replaceAll('{name}', YOUTH.name))}</span></p>` : ''}
    </div>
    ${captain && COMMANDS[captain] ? rollLeaderInfo(captain, COMMANDS[captain].name, commandDescription(captain)) : ''}
    <details class="hud-disclosure draw-records"><summary>歷輪紀錄與開局資源</summary><div class="run-draw-ledger">
      <dl class="run-records" aria-label="歷輪紀錄">
        ${record('最遠走到', best, '局')}${record('走完十局', meta.wins, '次')}${record('累積的悟', embers, '點')}
      </dl>
      <div class="run-benefits" aria-label="這一輪的開局資源">${benefits.join('')}</div>
    </div></details>
    ${wakeJournal(meta)}
    ${hasSave ? `<p class="run-save-note">${icon('info', 15)}<span>按下「落子」時，這一輪會取代目前的存檔。</span></p>` : ''}
    <footer class="run-footer run-roll-footer">${btn('close', '返回', 'outline-btn')}${btn('deploy', kept.length === 3 ? '落子' : '先留下三枚', 'gold-btn', kept.length === 3 ? '' : 'disabled')}</footer>
  </section>`;
}

// The prologue: the youth falls asleep and finds himself beside the stone table, where an old
// man is playing himself. The first time, 求敗 asks who he is: the youth cannot recall his name
// in the dream and calls himself 無名. On later runs 求敗 greets him by the 境界 picked.
//   profile  the chronicle (returns, wins)
//   step     which page is showing
//   film     the film has just told the first pages (first visit): start where the youth
//            cannot find his name, then resume where the film ends
//   realm    the 境界 picked for this run: 求敗 greets him by it
function prologueSteps(profile, film = false, realm = 1) {
  const tale = MAZE_TALE.prologue,
    called = YOUTH.name,
    greetings = tale.again.greeting;
  // After the ending the one at the table is 求敗's shadow (maze-tale.js QIUBAI_SHADOW).
  const plus = (profile.ended ?? 0) > 0,
    people = { youth: YOUTH, qiu: acrossTable(plus), wei: WEI },
    back = plus ? tale.shadow : tale.again;
  const named = (line) => String(line).replaceAll('{name}', called);
  const page = (step) => ({
    ...step,
    note: step.note && named(step.note),
    text: step.text && named(step.text),
    speaker: people[step.who]
  });
  // He has been here before once a run has been played to its end.
  const again = (profile.returns ?? 0) > 0;
  const steps = again
    ? [
        { note: back.note, picture: EAGLE_PICTURE },
        { who: 'qiu', text: greetings[Math.min(greetings.length, Math.max(1, realm)) - 1] },
        { who: 'youth', text: back.youth },
        { who: 'qiu', text: back.reply }
      ]
    : film
      ? [tale.film.name, tale.film.named, ...tale.first.slice(tale.first.findIndex((step) => step.afterFilm))]
      : tale.first;
  // Until he calls himself 無名, the page calls him only 少年.
  const namedAt = steps.findIndex((step) => step.names);
  return steps.map((step, i) => {
    const p = page(step);
    if (i < namedAt && step.who === 'youth') p.speaker = { ...p.speaker, name: '少年' };
    return { ...p, view: i === 0 && !film ? TALE_ART.wake : '', last: i === steps.length - 1 };
  });
}
function prologuePage(profile, step = 0, film = false, realm = 1) {
  const steps = prologueSteps(profile, film, realm),
    at = Math.max(0, Math.min(step, steps.length - 1)),
    p = steps[at];
  // A page has a picture when someone speaks, or when the narration comes with one.
  const picture = p.speaker?.portrait || p.picture;
  const portrait = picture
    ? `<img class="fy-speaker-portrait" alt="" src="${text(art(picture))}">`
    : '';
  const said = p.speaker
    ? `<div class="fy-byline"><strong>${text(p.speaker.name)}</strong><small>${text(p.speaker.role)}</small></div><blockquote>${text(p.text)}</blockquote>`
    : '';
  return `<section class="mj-view fy-story fy-prologue">
    <header class="modal-head"><div class="modal-title">${icon('scroll', 20)}<h2>入夢</h2></div><small>序幕</small></header>
    ${p.view ? scene(p.view, 'fy-scene') : ''}<div class="fy-story-body${picture ? '' : ' fy-narration'}">${portrait}<div class="fy-dialogue">
      ${p.note ? (p.picture ? `<blockquote>${text(p.note)}</blockquote>` : `<p class="fy-stage-note">${text(p.note)}</p>`) : ''}${said}${p.after ? `<p class="fy-stage-note">${text(p.after)}</p>` : ''}
    </div></div>
    <footer class="mj-footer"><div class="fy-reading">${at ? btn('prologue-prev', '上一句', 'mj-action') : ''}<span>${at + 1}／${steps.length}</span></div><aside>${p.last ? '' : btn('prologue-skip', '略過', 'mj-action')}${btn('prologue-next', p.last ? '看棋盤' : '下一句', 'gold-btn')}</aside></footer>
  </section>`;
}

// Whether this run opens with the first visit's prologue, which the film tells.
const firstVisit = (profile) => !((profile.returns ?? 0) > 0);

export { rollView, prologuePage, prologueSteps, firstVisit };
