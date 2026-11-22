// Developer mode: a small panel for clicking through runs without fighting them.
//
//   game/?dev       turns it on, and the browser remembers it
//   game/?dev=off   turns it off again
//
// In a battle (from its story, briefing or 整備 too) it can win the board now, win it with the
// secondary met, or lose it; each goes through the game's own settling, so rewards, the next
// hero, the story and the end of the run follow as in play (journey.js devFinish). Outside a
// battle it can open all five 境界 and jump to the placeholder last battle.
import { btn } from './panels.js';

const DEV_KEY = 'jianying.dev-mode.v1';

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
  return battle
    ? btn('dev-win', '速勝', 'dev-btn') + btn('dev-win-side', '速勝・支線', 'dev-btn') + btn('dev-lose', '速敗', 'dev-btn')
    : btn('dev-unlock', '開五重境界', 'dev-btn') + btn('dev-finale', '跳至終局', 'dev-btn');
}

export { devMode, devPanel };
