// Developer mode: a small panel for clicking through runs without fighting them.
//
//   game/?dev       turns it on, and the browser remembers it
//   game/?dev=off   turns it off again
//
// In a battle (from its story, briefing or 整備 too) it can win the board now, win it with the
// secondary met, or lose it; each goes through the game's own settling, so rewards, the next
// hero, the story and the end of the run follow as in play (journey.js devFinish). Outside a
// battle it can open all five 境界, jump to the last board (終局) with the heroes last picked for a
// test battle, play the ending film, and open what the ending opens (無名入盤). Always, 試局 opens
// a page to start a test battle: any board, any 境界, the heroes picked (journey.js devTestRun).
import { btn, titleHead, esc } from './panels.js';
import { DETAILS, PARTY } from '../rules/game.js';
import { mapLayout, MAP_LAYOUTS } from '../data/terrain.js';
import { REALMS } from '../data/realms.js';
import { DEV_TEST, mapStages, stageTitle } from '../rules/journey.js';

const DEV_KEY = 'jianying.dev-mode.v1';
const PICK_KEY = 'jianying.dev-test.v1';

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

// The panel's buttons, which change with what is on screen (app.js keeps the folding panel).
//   battle  a board of the run is being played and not yet decided
function devPanel({ battle }) {
  return (
    (battle
      ? btn('dev-win', '速勝', 'dev-btn') + btn('dev-win-side', '速勝・支線', 'dev-btn') + btn('dev-lose', '速敗', 'dev-btn')
      : btn('dev-unlock', '開五重境界', 'dev-btn') +
        btn('dev-finale', '跳至終局', 'dev-btn') +
        btn('dev-film', '看終局影片', 'dev-btn') +
        btn('dev-plus', '開無名入盤', 'dev-btn')) +
    btn('dev-test', '試局', 'dev-btn')
  );
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
    <p class="dev-test-lead">直接從一局的軍情開始，敵人照該局在一輪中的位置與所選境界。每位俠客 ${DEV_TEST.points} 武學點，行囊 ${DEV_TEST.coins} 兩。終局只在無劍境界，無名自會入盤領隊，眾人招式俱全。打完這一局，這一輪照常往下走。開局會取代目前的存檔。</p>
    <h3>棋局</h3><div class="dev-chips">${boards}</div>
    <h3>境界</h3><div class="dev-chips">${realms}</div>
    <h3>俠客 <small>按選的先後：第一位領隊，前五位上陣，其餘候補</small></h3><div class="dev-chips">${heroes}</div>
    <footer class="run-footer">${btn('close', '返回', 'outline-btn')}${btn('dev-test-all', pick.heroes.length === PARTY.length ? '全不選' : '全選', 'outline-btn')}${btn('dev-test-go', '開局', 'gold-btn', pick.heroes.length ? '' : 'disabled')}</footer>
  </section>`;
}

export { devMode, devPanel, devTestView, loadPick, changePick };
