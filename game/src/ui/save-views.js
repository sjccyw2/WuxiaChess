// 存檔・讀檔: the page of the four saves (自動存檔 and 存檔一 to 三), the question 另開新局 asks
// while a run is under way, and the notice of a tab that another tab has taken the game from.
// The saves themselves are in rules/saves.js; app.js opens these pages and answers their buttons.
import * as G from '../rules/game.js';
import { stageTitle } from '../rules/journey.js';
import { REALMS, realmIndex } from '../data/realms.js';
import { mapLayout } from '../data/terrain.js';
import { titleHead, btn, esc } from './panels.js';
import { icon } from './icons.js';

const SLOT_NAMES = ['存檔一', '存檔二', '存檔三'];
const AUTO_NAME = '自動存檔';
const slotName = (n) => SLOT_NAMES[n - 1];
// Where a game stands: the board and what is happening on it, or the page between boards.
function whereOf(s) {
  const r = s.run,
    board = stageTitle(r.stage, '・') + mapLayout(s.mapIndex).name;
  if (r.status === 'ended') return board + ' · 本輪已結束';
  const step = {
    before: '局前劇情',
    brief: '軍情',
    prep: '整備',
    after: '戰後劇情',
    shop: '通吃坊'
  }[r.scene];
  if (step) return board + ' · ' + step;
  return board + ' · ' + (r.deploying && s.round === 1 && !s.result ? '起陣' : '第 ' + s.round + ' 回合');
}
const two = (n) => String(n).padStart(2, '0');
function whenSaved(at) {
  if (!at) return '';
  const d = new Date(at),
    year = d.getFullYear() === new Date().getFullYear() ? '' : d.getFullYear() + '年';
  return year + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + two(d.getHours()) + ':' + two(d.getMinutes());
}
// What a save holds, enough to choose by: where, the 境界, the heroes, and when it was saved.
function saveCard(s, at = 0) {
  const heroes = G.company(s)
    .map((u) => G.unitDetails(u).name)
    .join('、');
  return (
    '<div class="slot-card"><strong>' +
    esc(whereOf(s)) +
    '</strong><span>' +
    esc(REALMS[realmIndex(s.run.realm) - 1].sword + '境界') +
    ' · ' +
    esc(heroes) +
    '</span>' +
    (at ? '<time>' + whenSaved(at) + '</time>' : '') +
    '</div>'
  );
}
const emptyCard = (text = '空') => '<p class="slot-empty">' + text + '</p>';
// model: { auto: the game in the autosave or null, autoLive: whether it is a run still to be
// played, slots: [slot or null] × 3 (rules/saves.js readSlot), canSave, ask: null or { kind:
// 'save' | 'load', n }, thenNew: saving before 另開新局 }
function savesPage(m) {
  const head = titleHead('chest', '存檔・讀檔');
  if (m.ask) return head + askBox(m);
  const intro = m.thenNew
    ? '選一格存下這一局。存好之後，另開新局。'
    : '每次行動後，遊戲自動存入「自動存檔」。另有三格，可隨時把這一局存進去，之後讀檔，從那裡繼續。已開的境界、累積的悟等紀錄各格共用，讀舊檔也不會少。';
  const auto =
    '<section class="slot-row slot-auto"><h3>' +
    AUTO_NAME +
    (m.auto && m.autoLive ? '<small>正在進行</small>' : '') +
    '</h3>' +
    (m.auto ? saveCard(m.auto) : emptyCard()) +
    '</section>';
  const rows = m.slots
    .map((slot, i) => {
      const n = i + 1,
        acts =
          (m.canSave ? btn('slot-save', '存檔', 'outline-btn', 'data-id="' + n + '"') : '') +
          (slot?.state && !m.thenNew ? btn('slot-load', '讀檔', 'gold-btn', 'data-id="' + n + '"') : '');
      return (
        '<section class="slot-row"><h3>' +
        slotName(n) +
        '</h3>' +
        (!slot ? emptyCard() : slot.state ? saveCard(slot.state, slot.at) : emptyCard('無法讀取')) +
        (acts ? '<div class="slot-acts">' + acts + '</div>' : '') +
        '</section>'
      );
    })
    .join('');
  return (
    head +
    '<p class="modal-intro">' +
    intro +
    '</p><div class="slot-list">' +
    auto +
    rows +
    '</div><div class="modal-foot right">' +
    btn('close', '返回', 'outline-btn') +
    '</div>'
  );
}
// Saving over a filled slot, or loading while the autosave holds a run under way: asked first.
function askBox(m) {
  const n = m.ask.n,
    slot = m.slots[n - 1],
    name = slotName(n);
  const body =
    m.ask.kind === 'save'
      ? '<h3>存入' +
        name +
        '？</h3><p>' +
        name +
        '裡的這一局會被蓋掉：</p>' +
        (slot?.state ? saveCard(slot.state, slot.at) : emptyCard('無法讀取'))
      : '<h3>讀取' +
        name +
        '？</h3>' +
        saveCard(slot.state, slot.at) +
        '<p>自動存檔裡正在進行的這一局會被取代：</p>' +
        saveCard(m.auto) +
        '<p>要留著它，先取消，把它存進一格存檔。</p>';
  return (
    '<div class="slot-ask">' +
    body +
    '</div><div class="modal-foot right">' +
    btn('slot-no', '取消', 'outline-btn') +
    btn('slot-yes', (m.ask.kind === 'save' ? '存入' : '讀取') + name, 'gold-btn') +
    '</div>'
  );
}
// 另開新局 while a run is under way: it is named, and can be saved into a slot first.
function newRunAsk(s) {
  return (
    titleHead('people', '另開新局') +
    '<div class="slot-ask"><p>自動存檔裡有一局正在進行：</p>' +
    saveCard(s) +
    '<p>另開新局，落子之後，這一局就會被新局取代。要留著它，先存進一格存檔。</p></div>' +
    '<div class="modal-foot right">' +
    btn('close', '取消', 'outline-btn') +
    btn('new-save', '先存檔', 'outline-btn') +
    btn('new-go', '另開新局', 'gold-btn') +
    '</div>'
  );
}
// Another tab has written the game's saves: this one stops saving until the player takes it back.
function lockPage() {
  return (
    '<div class="tab-lock-body">' +
    icon('info', 26) +
    '<h2 id="tab-lock-title">已在另一個分頁繼續</h2>' +
    '<p>這個遊戲剛在另一個分頁存了檔。此頁已停止存檔，免得蓋掉那邊的進度。</p>' +
    '<p>要在此頁接著玩，按「在此頁接手」：此頁會讀回最新的存檔，另一個分頁則停下。</p>' +
    btn('tab-take', '在此頁接手', 'gold-btn') +
    '</div>'
  );
}
// A button that opens the page, for the head of the pages between boards.
const savesButton = () => btn('saves', icon('chest', 16) + '<span>存檔</span>', 'head-saves', 'title="存檔・讀檔"');
const savedNotice = (n) => '已存入' + slotName(n) + '。';
const loadedNotice = (n) => '已讀取' + slotName(n) + '。';
const SAVE_FAILED = '存不進去：此瀏覽器的空間已滿，或不許網頁存檔。';
const LOAD_FAILED = '這一格讀不出來。';

export { savesPage, newRunAsk, lockPage, savesButton, saveCard, whereOf, savedNotice, loadedNotice, SAVE_FAILED, LOAD_FAILED };
