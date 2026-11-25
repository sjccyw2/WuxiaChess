// Additions to the battle controls that the owner approved one by one. Each sits behind its own
// switch in polish.js; with a switch off, the control it adds is absent.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';

// forecastSide: dock the strike forecast on the side away from the two fighters, so the duel it
// describes stays in view. The stylesheet does the placing (wide screens only) from data-dock.
function dockForecast(dialog, layer, state, strike, page) {
  if (!POLISH.forecastSide) return;
  if (page !== 'attack-preview' || !strike || !layer?.width) {
    delete dialog.dataset.dock;
    return;
  }
  const from = G.find(state, strike.source),
    to = typeof strike.target === 'string' ? G.find(state, strike.target) : strike.target;
  if (!from || !to) return;
  const middle = (layer.point(from.x, from.y).x + layer.point(to.x, to.y).x) / 2 / layer.width;
  dialog.dataset.dock = middle > 0.5 ? 'left' : 'right';
}

// nextHeroKey: the hero after (or before) the selected one who can still act this turn.
function nextHero(state, step = 1) {
  if (!POLISH.nextHeroKey) return null;
  const line = G.party(state).filter(G.living);
  const here = line.findIndex((u) => u.id === state.selected);
  for (let i = 1; i <= line.length; i++) {
    const u = line[(here + i * step + line.length * (i + 1)) % line.length];
    if (u.id !== state.selected && G.canAct(state, u)) return u.id;
  }
  return null;
}

// Tab keeps its usual job of moving between controls whenever the keyboard focus is showing on
// one; it cycles heroes only while nothing is visibly focused (the usual case when playing with
// a mouse or by touch with a keyboard at hand).
function tabIsFree(doc = document) {
  const el = doc.activeElement;
  if (!el || el === doc.body) return true;
  if (el.matches('input, textarea, select, [contenteditable]')) return false;
  return !el.matches(':focus-visible');
}

// dangerZone: the HUD button exists in the page but stays hidden unless the switch is on.
function syncDangerButton(button, on) {
  if (!button) return;
  button.hidden = !POLISH.dangerZone;
  button.setAttribute('aria-pressed', String(Boolean(on)));
}

// keyHints: the key that presses a button, in a small mark on it. Drawn only where there is a fine
// pointer (styles/13-panels.css), the same test that hides the guide's keys on touch screens:
// a phone with no keyboard is shown no keys. `aria-keyshortcuts` on the button says it to a
// screen reader instead, so the mark itself is hidden from one.
function keyHint(key) {
  return POLISH.keyHints ? '<kbd class="key-hint" aria-hidden="true">' + key + '</kbd>' : '';
}

// The keys line of the help page, for the keys these additions bring.
function extraHotkeys() {
  return (
    (POLISH.dangerZone ? ' <kbd>D</kbd> 敵方範圍' : '') +
    (POLISH.nextHeroKey ? ' <kbd>Tab</kbd> 下一位' : '')
  );
}

export { dockForecast, nextHero, tabIsFree, syncDangerButton, keyHint, extraHotkeys };
