// Developer mode: a small floating window for clicking through runs without fighting them.
//
//   game/?dev       turns it on, and the browser remembers it
//   game/?dev=off   turns it off again
//
// The window (devWindow) has a bar reading 開發: drag the bar to move the window, press the
// bar's button to fold the window down to the bar, double-tap the bar to send it back to its
// corner. Where it was put and whether it is folded are remembered.
//
// In a battle (from its story, briefing or 整備 too) it can win the board now, win it with the
// secondary met, or lose it; each goes through the game's own settling, so rewards, the next
// hero, the story and the end of the run follow as in play (journey.js devFinish). Once the
// fight is on, 局主半血 takes half of what 氣血 the board's master has, as a blow would: his 變招,
// and on the last board those who come to 求敗's side (journey.js devPress). Outside a battle it
// can open all five 境界, play the ending film, and open what the ending opens (無名入盤). Always,
// 跳至終局 jumps to the last board with the heroes last picked for a test battle, against the ten
// masters of a run drawn at random, and 試局 opens a page to start a test battle: any board, any
// 境界, the heroes picked (journey.js devTestRun). Always too, and on a second press only: 清空紀錄
// puts the browser back to a first visit, and 清空・首局 does the same and then starts an ordinary
// first run at the first board's 起陣, for seeing the tutorial again (journey.js devFirstBoard).
import { btn, titleHead, esc } from './panels.js';
import { DETAILS, PARTY } from '../rules/game.js';
import { mapLayout, MAP_LAYOUTS } from '../data/terrain.js';
import { REALMS } from '../data/realms.js';
import { DEV_TEST, mapStages, stageTitle } from '../rules/journey.js';

const DEV_KEY = 'jianying.dev-mode.v1';
const PICK_KEY = 'jianying.dev-test.v1';
// Where the window was put and whether it is folded.
const PLACE_KEY = 'jianying.dev-window.v1';
// Set for one reload (in the session's storage): 清空・首局 asked to open on the board.
const ENTER_KEY = 'jianying.dev-enter.v1';
// Every key the game keeps in the browser begins with the first of these; developer mode's own
// begin with the second, and a clearing leaves them.
const GAME_KEYS = 'jianying.',
  DEV_KEYS = 'jianying.dev-';

// Reads ?dev from the address and remembers it; every storage access may fail (private
// windows, blocked storage), and then only the address counts.
function devMode() {
  let on = false;
  try {
    on = localStorage.getItem(DEV_KEY) === '1';
  } catch {}
  const asked = new URLSearchParams(location.search).get('dev');
  if (asked !== null) {
    on = asked !== 'off' && asked !== '0';
    try {
      if (on) localStorage.setItem(DEV_KEY, '1');
      else localStorage.removeItem(DEV_KEY);
    } catch {}
  }
  return on;
}

// Where the window was put, remembered between visits: { folded, h, x, v, y }. It is kept by
// the two screen edges it was nearest ('left' or 'right' and 'top' or 'bottom') and how far in
// from each, so that it holds its corner when the phone is turned or the window resized. With
// no h it has never been moved and sits in its default corner. It starts folded.
function loadPlace() {
  let kept = null;
  try {
    kept = JSON.parse(localStorage.getItem(PLACE_KEY) || 'null');
  } catch {}
  const far = (n) => Number.isFinite(n) && n >= 0;
  const put = ['left', 'right'].includes(kept?.h) && ['top', 'bottom'].includes(kept?.v) && far(kept.x) && far(kept.y);
  return { folded: kept?.folded !== false, ...(put ? { h: kept.h, x: kept.x, v: kept.v, y: kept.y } : {}) };
}
function keepPlace(place) {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {}
}
// A press on the bar that moves less than SLACK pixels is a tap, and two taps within TWICE
// milliseconds are a double tap.
const SLACK = 5,
  TWICE = 350;
// The two clearing buttons take two presses: the first arms the button for ARMED milliseconds
// and its label asks; a second press on it then clears, but only STEADY milliseconds after the
// first, so that a double tap cannot. Anything else lets go of it.
const ARMED = 4000,
  STEADY = 400;
// Each button's action, with its label and what it asks once armed.
const CLEAR = { 'dev-wipe': ['清空紀錄', '確定清空？'], 'dev-first': ['清空・首局', '確定清空入局？'] };

// The floating window: a bar (開發, the handle it is dragged by, and the button that folds it)
// over its buttons. It answers:
//   show(html, host)  draws these buttons, inside `host`: the open dialog when there is one
//                     (everything outside a modal dialog is inert), else the page
//   fold()            folds it down to its bar
//   confirm(action)   a press on a clearing button: true when it is the second press
function devWindow() {
  const root = document.documentElement;
  const el = document.createElement('aside');
  el.className = 'dev-panel';
  el.setAttribute('aria-label', '開發者模式');
  el.innerHTML =
    '<div class="dev-bar"><button type="button" class="dev-fold" aria-controls="dev-buttons"></button>' +
    '<span>開發</span></div>' +
    '<div class="dev-buttons" id="dev-buttons"></div>';
  const bar = el.firstChild,
    foldButton = bar.firstChild,
    list = el.lastChild;
  // Shown as a popover where the browser has them: the window is then in the top layer in its
  // own right, drawn above the open dialog and placed against the screen whatever the dialog
  // does. (A dialog that eases in is transformed while it does, and then places and clips a
  // fixed element inside it.) Elsewhere it is an ordinary fixed element, and put() makes up for
  // the dialog.
  const layered = typeof el.showPopover === 'function';
  if (layered) el.setAttribute('popover', 'manual');
  let kept = loadPlace(),
    drawn = null,
    drag = null,
    tapped = null,
    spent = null,
    armed = null;

  // How far the window can travel (w, h): the screen, less the window and the gutter the
  // stylesheet gives it as a margin (which holds the notch and the home bar). With no travel
  // at all its box is at (left, top), the gutter's width there.
  function room() {
    const style = getComputedStyle(el),
      px = (value) => parseFloat(value) || 0;
    const left = px(style.marginLeft),
      top = px(style.marginTop);
    return {
      left,
      top,
      w: Math.max(0, (root.clientWidth || innerWidth) - left - px(style.marginRight) - el.offsetWidth),
      h: Math.max(0, (root.clientHeight || innerHeight) - top - px(style.marginBottom) - el.offsetHeight)
    };
  }
  // The default corner, where it does least harm on each format (the formats are the
  // stylesheets' own, styles/08 and 09):
  //   upright phone   the left edge, under the board and over where the arts list opens: clear
  //                   of both, of the top row and the tutorial's card under it, of the
  //                   messages above the hero's card, and of 結束回合
  //   sideways phone  the top edge, right of the board's plaque: the middle of a page's title
  //                   bar, and off the board
  //   desktop         the left edge, a little above the middle: beside the pages, off the board
  function corner() {
    const w = root.clientWidth || innerWidth,
      h = root.clientHeight || innerHeight;
    if (w <= 540 || (h > w && w <= 800)) return { h: 'left', x: 0, v: 'bottom', y: 236 };
    if (h <= 600) return { h: 'left', x: 180, v: 'top', y: 0 };
    return { h: 'left', x: 0, v: 'top', y: Math.round(h * 0.42) };
  }
  // Sets the window `at` (its travel from the left and from the top), kept on the screen.
  function put(at, space = room()) {
    const x = Math.round(Math.min(space.w, Math.max(0, at.x))),
      y = Math.round(Math.min(space.h, Math.max(0, at.y)));
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    // Not in the top layer, inside a dialog that is transformed: it is placed against the
    // dialog, so the difference is taken off.
    const box = el.getBoundingClientRect(),
      dx = x + space.left - box.left,
      dy = y + space.top - box.top;
    if (Math.abs(dx) > 0.5) el.style.left = x + dx + 'px';
    if (Math.abs(dy) > 0.5) el.style.top = y + dy + 'px';
    return { x, y };
  }
  // Where it belongs now: its remembered edges or its default corner, on this screen. It grows
  // away from the edges it is kept by, so that folding and opening leave the fold button where
  // it is: kept by the bottom edge it opens upward, its bar below its buttons, and kept by the
  // right edge the fold button is at the bar's right end.
  function place() {
    if (drag?.moved || !el.offsetWidth) return;
    const spot = kept.h ? kept : corner();
    el.classList.toggle('up', spot.v === 'bottom');
    el.classList.toggle('right', spot.h === 'right');
    const space = room();
    put({ x: spot.h === 'right' ? space.w - spot.x : spot.x, y: spot.v === 'bottom' ? space.h - spot.y : spot.y }, space);
  }
  // Into the top layer, above whatever is there. Moving an element takes it out, and so does
  // nothing else; `again` takes it out and back in, to be above something that came later.
  function raise(again = false) {
    if (!layered || !el.isConnected) return;
    try {
      if (again && el.matches(':popover-open')) el.hidePopover();
      if (!el.matches(':popover-open')) el.showPopover();
    } catch {}
  }
  function show(html, host) {
    if (drawn !== html) {
      list.innerHTML = drawn = html;
      mark();
    }
    if (el.parentElement !== host) host.append(el);
    raise();
    place();
  }
  function setFold(folded) {
    if (kept.folded !== folded) keepPlace((kept = { ...kept, folded }));
    el.classList.toggle('folded', folded);
    foldButton.setAttribute('aria-expanded', String(!folded));
    foldButton.title = folded ? '展開' : '收起';
    foldButton.setAttribute('aria-label', foldButton.title);
    place();
  }
  // (A press of the pointer on the fold button is the bar's, below; this is the keyboard's.)
  foldButton.addEventListener('click', () => setFold(!kept.folded));

  // The whole bar is the handle, its fold button too: a press that moves drags the window, one
  // that does not is a tap (on the button it folds or opens; twice on the rest of the bar it
  // sends the window back to its corner). The press is kept from the page (the HUD closes its
  // lists on a press elsewhere, and 整備 listens for its own drags), and so is the click it ends
  // in, which on a dialog's backdrop would count as a tap outside the page.
  bar.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (drag || e.button !== 0 || e.isPrimary === false) return;
    const box = bar.getBoundingClientRect();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: e.clientX - box.left, dy: e.clientY - box.top, moved: false, fold: foldButton.contains(e.target) };
    try {
      bar.setPointerCapture(e.pointerId);
    } catch {}
    e.preventDefault();
  });
  bar.addEventListener('pointermove', (e) => {
    if (e.pointerId !== drag?.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < SLACK) return;
    drag.moved = true;
    el.classList.add('dragging');
    // The bar follows the pointer. In the lower half of the screen the buttons open above it,
    // in the upper half below it, and the window turns over as the bar crosses the middle.
    const barTop = e.clientY - drag.dy;
    el.classList.toggle('up', barTop * 2 + bar.offsetHeight > (root.clientHeight || innerHeight));
    const space = room(),
      inset = el.clientLeft;
    drag.at = put({ x: e.clientX - drag.dx - inset - space.left, y: barTop - inset - bar.offsetTop - space.top }, space);
  });
  function drop(e) {
    if (e.pointerId !== drag?.id) return;
    const { moved, at, fold } = drag;
    drag = null;
    el.classList.remove('dragging');
    // The click this press ends in goes no further: the window may have moved from under it.
    spent = { until: Date.now() + 400, x: e.clientX, y: e.clientY };
    if (moved) {
      // Remembered by the edges it is nearest: its bottom edge if it was let go opening upward.
      const space = room(),
        h = at.x > space.w / 2 ? 'right' : 'left',
        v = el.classList.contains('up') ? 'bottom' : 'top';
      kept = { ...kept, h, x: h === 'right' ? space.w - at.x : at.x, v, y: v === 'bottom' ? space.h - at.y : at.y };
    } else if (e.type !== 'pointerup') return;
    else if (fold) return setFold(!kept.folded);
    else {
      // A tap; the second of two sends the window back to its default corner.
      const twice = tapped && e.timeStamp - tapped.time < TWICE && Math.hypot(e.clientX - tapped.x, e.clientY - tapped.y) < 24;
      tapped = twice ? null : { time: e.timeStamp, x: e.clientX, y: e.clientY };
      if (!twice) return;
      kept = { folded: kept.folded };
    }
    tapped = null;
    keepPlace(kept);
    place();
  }
  bar.addEventListener('pointerup', drop);
  bar.addEventListener('pointercancel', drop);
  bar.addEventListener('lostpointercapture', drop);
  addEventListener(
    'click',
    (e) => {
      if (!spent || Date.now() > spent.until || Math.hypot(e.clientX - spent.x, e.clientY - spent.y) > 22) return;
      spent = null;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );
  // Kept on the screen when the window is resized or the phone turned, and above the page again
  // when it goes full screen (which puts the page itself in the top layer).
  addEventListener('resize', place);
  for (const name of ['fullscreenchange', 'webkitfullscreenchange'])
    document.addEventListener(name, () => {
      raise(true);
      place();
    });
  // Not in the top layer: a dialog that has finished easing in no longer places the window, so
  // it is placed again.
  if (!layered)
    for (const name of ['animationend', 'animationcancel', 'transitionend'])
      document.addEventListener(name, (e) => e.target === el.parentElement && place());

  // The clearing buttons: which one is armed is written on the button itself, so that arming
  // and letting go redraw nothing.
  function mark() {
    for (const button of list.querySelectorAll('.dev-clear')) {
      const on = armed?.action === button.dataset.do;
      button.classList.toggle('armed', on);
      button.textContent = CLEAR[button.dataset.do][on ? 1 : 0];
    }
  }
  function disarm() {
    if (!armed) return;
    clearTimeout(armed.timer);
    armed = null;
    mark();
  }
  function confirm(action) {
    if (armed?.action === action) {
      if (Date.now() - armed.at < STEADY) return false;
      disarm();
      return true;
    }
    disarm();
    armed = { action, at: Date.now(), timer: setTimeout(disarm, ARMED) };
    mark();
    return false;
  }
  // A press anywhere but on the armed button lets go of it, and so does any key but the two
  // that press a button.
  const onArmed = (e) => list.contains(e.target) && e.target.closest('[data-do]')?.dataset.do === armed.action;
  document.addEventListener('pointerdown', (e) => armed && !onArmed(e) && disarm(), true);
  document.addEventListener('keydown', (e) => armed && !(onArmed(e) && [' ', 'Enter'].includes(e.key)) && disarm(), true);

  setFold(kept.folded);
  return { show, fold: () => setFold(true), confirm };
}

// The window's buttons, which change with what is on screen (app.js hands them to the window).
//   battle  a board of the run is being played and not yet decided
//   side    it has a secondary (the last board has none)
//   fight   its fight has begun
// The two clearing buttons come last, apart from the rest (the window words them: CLEAR).
function devPanel({ battle, side = true, fight = false }) {
  return (
    (battle
      ? btn('dev-win', '速勝', 'dev-btn') +
        (side ? btn('dev-win-side', '速勝・支線', 'dev-btn') : '') +
        btn('dev-lose', '速敗', 'dev-btn') +
        (fight ? btn('dev-press', '局主半血', 'dev-btn') : '')
      : btn('dev-unlock', '開五重境界', 'dev-btn') +
        btn('dev-film', '看終局影片', 'dev-btn') +
        btn('dev-plus', '開無名入盤', 'dev-btn')) +
    btn('dev-finale', '跳至終局', 'dev-btn') +
    btn('dev-test', '試局', 'dev-btn') +
    '<hr class="dev-rule" />' +
    Object.keys(CLEAR)
      .map((action) => btn(action, CLEAR[action][0], 'dev-btn dev-clear'))
      .join('')
  );
}

// Puts the browser back to what it holds for someone who has never opened the game: every key
// of the game's goes, from both storages (the save, the settings, the draw being set up, the
// tutorial's record, and whatever is added later under the same prefix), except developer
// mode's own (that it is on, the last 試局 pick, the window's place).
function clearRecord() {
  for (const name of ['localStorage', 'sessionStorage'])
    try {
      const store = globalThis[name];
      const keys = Array.from({ length: store.length }, (_, i) => store.key(i));
      for (const key of keys)
        if (key?.startsWith(GAME_KEYS) && !key.startsWith(DEV_KEYS)) store.removeItem(key);
    } catch {}
}
// 清空紀錄 and 清空・首局: the record is cleared and the page loaded again, so that whatever a
// module holds in memory (the settings, the tutorial's record) starts as on a first visit too.
// `keep`, if given, then writes what the next visit is to find (app.js passes the game's own
// save, with the run just built), and the next visit is told to open on its board.
// Done now and once more as the page leaves, so that nothing still running in between (the
// tutorial's frame, say) writes the old record back.
function devRestart(keep) {
  const wipe = () => {
    clearRecord();
    if (!keep) return;
    keep();
    try {
      sessionStorage.setItem(ENTER_KEY, '1');
    } catch {}
  };
  wipe();
  addEventListener('pagehide', wipe);
  location.reload();
}
// Whether this visit follows 清空・首局 and should open on the saved board (asked once).
function devEnter() {
  try {
    const asked = sessionStorage.getItem(ENTER_KEY) === '1';
    sessionStorage.removeItem(ENTER_KEY);
    return asked;
  } catch {
    return false;
  }
}

// The test battle last set up, remembered between visits: { map, realm, heroes } with heroes in
// the order they were picked (the first five fight, the first of all leads).
function loadPick() {
  let pick = null;
  try {
    pick = JSON.parse(localStorage.getItem(PICK_KEY) || 'null');
  } catch {}
  const heroes = Array.isArray(pick?.heroes) ? [...new Set(pick.heroes.filter((id) => PARTY.includes(id)))] : [];
  return {
    map: Number.isInteger(pick?.map) && pick.map >= 0 && pick.map < MAP_LAYOUTS.length ? pick.map : 0,
    realm: Number.isInteger(pick?.realm) && pick.realm >= 1 && pick.realm <= REALMS.length ? pick.realm : 1,
    heroes: heroes.length ? heroes : PARTY.slice(0, 5)
  };
}
function keepPick(pick) {
  try {
    localStorage.setItem(PICK_KEY, JSON.stringify(pick));
  } catch {}
}
// One click on the test page: choose a board or a 境界, or add or drop a hero (a dropped hero
// leaves the order; an added one goes to the end). Returns the new pick.
function changePick(pick, what, id) {
  const next = { ...pick, heroes: [...pick.heroes] };
  if (what === 'map') next.map = Math.min(MAP_LAYOUTS.length - 1, Math.max(0, Number(id) || 0));
  if (what === 'realm') next.realm = Math.min(REALMS.length, Math.max(1, Number(id) || 1));
  if (what === 'hero' && PARTY.includes(id))
    next.heroes = next.heroes.includes(id) ? next.heroes.filter((h) => h !== id) : [...next.heroes, id];
  if (what === 'all') next.heroes = next.heroes.length === PARTY.length ? [] : [...PARTY];
  keepPick(next);
  return next;
}
function devTestView(pick) {
  const chip = (action, id, label, on, extra = '') =>
    btn(action, label, 'dev-chip' + (on ? ' on' : ''), `data-id="${id}" aria-pressed="${on}" ${extra}`);
  // Every board, in the order a run can meet them (the boards of a stage side by side), the
  // last board after them.
  const boards = MAP_LAYOUTS.map((_, i) => i)
    .sort((a, b) => (mapStages(a)[0] ?? 0) - (mapStages(b)[0] ?? 0) || a - b)
    .map((i) =>
      chip('dev-test-map', i, `<small>${stageTitle(mapStages(i)[0] ?? 0, '')}</small>${esc(mapLayout(i).name)}`, pick.map === i)
    )
    .join('');
  const realms = REALMS.map((r, i) => chip('dev-test-realm', i + 1, `${esc(r.sword)}境界`, pick.realm === i + 1)).join('');
  const heroes = PARTY.map((id) => {
    const at = pick.heroes.indexOf(id),
      tag = at < 0 ? '' : at === 0 ? '領隊' : at < 5 ? `上陣 ${at + 1}` : '候補';
    return chip('dev-test-hero', id, `${esc(DETAILS[id].name)}<small>${tag}</small>`, at >= 0);
  }).join('');
  return `<section class="run-view dev-test">
    ${titleHead('scroll', '試局', '開發者模式')}
    <p class="dev-test-lead">直接從一局的軍情開始，敵人照該局在一輪中的位置與所選境界。每位俠客 ${DEV_TEST.points} 武學點，行囊 ${DEV_TEST.coins} 兩。終局只在無劍境界，無名自會入盤領隊，眾人招式俱全；對面的十位局主，取自隨機抽出的一輪十局。打完這一局，這一輪照常往下走。開局會取代目前的存檔。</p>
    <h3>棋局</h3><div class="dev-chips">${boards}</div>
    <h3>境界</h3><div class="dev-chips">${realms}</div>
    <h3>俠客 <small>按選的先後：第一位領隊，前五位上陣，其餘候補</small></h3><div class="dev-chips">${heroes}</div>
    <footer class="run-footer">${btn('close', '返回', 'outline-btn')}${btn('dev-test-all', pick.heroes.length === PARTY.length ? '全不選' : '全選', 'outline-btn')}${btn('dev-test-go', '開局', 'gold-btn', pick.heroes.length ? '' : 'disabled')}</footer>
  </section>`;
}

export { devMode, devWindow, devPanel, devRestart, devEnter, devTestView, loadPick, changePick };
