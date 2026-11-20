// Action flow (switch: actionFlow). The owner's redesign of a hero's turn:
//
//   - no move button: selecting a hero shows where it can go
//   - the arts list opens by itself once a hero has finished moving, or when the selected hero
//     is clicked again; on wide screens it sits beside the hero
//   - undo appears in that list, only after a move
//   - no wait button: heroes who have not struck brace by themselves when the turn ends, which
//     is exactly what the wait button did
//   - the bottom bar is gone; the end-turn button stands alone in its corner
//
// With the switch off, none of this runs and the four-button bar is back.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';
import { icon } from './icons.js';

const ON = POLISH.actionFlow;

// The undo entry at the foot of the arts list, shown only once the hero has moved.
function undoRow(s, u) {
  if (!ON || !u?.moved || !G.canAct(s, u)) return '';
  return (
    '<button class="field-loadout field-undo" data-do="move" title="撤步">' +
    icon('undo', 15) +
    '撤步</button>'
  );
}

// Marks the entry of the arts list that is ready to strike with, so the choice is visible and
// another can be picked instead.
function markReady(list, s, u, mode) {
  if (!ON || !G.canAct(s, u) || !['attack', 'skill'].includes(mode)) return;
  const id = mode === 'attack' ? 'basic' : u.activeArt || 'signature';
  for (const b of list.querySelectorAll('.field-art')) {
    const on = b.dataset.id === id;
    b.classList.toggle('armed', on);
    b.setAttribute('aria-pressed', String(on));
  }
}

// The hero to pick next: one who has not been touched this turn, before one who has only moved.
function nextToAct(s) {
  const line = G.party(s).filter((u) => G.canAct(s, u));
  return line.find((u) => !u.moved) || line[0] || null;
}

// True while some hero has neither moved nor struck.
const anyIdle = (s) => G.party(s).some((u) => G.canAct(s, u) && !u.moved);

// Ending the turn asks first only when something is plainly being left undone: a hero who has
// not been touched, or one who could still strike an enemy from where it stands.
function shouldConfirmEnd(s) {
  return G.party(s).some(
    (u) =>
      G.canAct(s, u) &&
      (!u.moved || G.enemies(s).some((t) => G.living(t) && G.targetOK(s, u, t, false)))
  );
}

// What the wait button did, for every hero who has not struck: brace for the enemy's turn.
function braceTheRest(s) {
  if (!ON) return;
  for (const u of G.party(s).filter(G.living)) if (G.canAct(s, u)) G.waitUnit(s, u);
}

// Keeps the arts list beside the selected hero while it is open (wide screens; on phones the
// stylesheet docks it at an edge and uses only the side worked out here). It goes on the side away from the enemy, so the
// pieces the hero is most likely to strike stay in view. `who` answers the hero and the state
// while the list should follow, or null once it has closed.
function followHero(panel, layer, who) {
  if (!ON || panel.dataset.following) return;
  panel.dataset.following = '1';
  let last = '';
  const step = () => {
    const now = who();
    if (!now || panel.hidden || !layer?.width) {
      delete panel.dataset.following;
      panel.classList.remove('at-unit');
      panel.style.removeProperty('--ax');
      panel.style.removeProperty('--ay');
      delete panel.dataset.side;
      return;
    }
    const { hero, state } = now;
    const p = layer.point(hero.x, hero.y);
    const foes = G.enemies(state).filter(G.living);
    const foeX = foes.length
      ? foes.reduce((sum, t) => sum + layer.point(t.x, t.y).x, 0) / foes.length
      : layer.width;
    const w = panel.offsetWidth,
      h = panel.offsetHeight,
      gap = Math.max(56, layer.scaleAt(hero.x, hero.y) * 0.95);
    let x = foeX >= p.x ? p.x - gap - w : p.x + gap;
    if (x < 14) x = p.x + gap;
    if (x + w > layer.width - 14) x = p.x - gap - w;
    x = Math.max(14, Math.min(layer.width - w - 14, x));
    const y = Math.max(76, Math.min(layer.height - h - 92, p.y - h * 0.62));
    // Phones in landscape dock the list at a screen edge instead: the one the hero is not near.
    const side = p.x > layer.width / 2 ? 'left' : 'right';
    const mark = Math.round(x) + ',' + Math.round(y) + side;
    if (mark !== last) {
      last = mark;
      panel.style.setProperty('--ax', Math.round(x) + 'px');
      panel.style.setProperty('--ay', Math.round(y) + 'px');
      panel.dataset.side = side;
      panel.classList.add('at-unit');
    }
    requestAnimationFrame(step);
  };
  step();
}

// The keys line of the help page under this flow.
const flowHotkeys =
  '<kbd>1</kbd>–<kbd>4</kbd> 招式 <kbd>G</kbd> 棋格 <kbd>[ ]</kbd> 旋轉 <kbd>E</kbd> 結束回合 <kbd>Esc</kbd> 撤步・返回 <kbd>?</kbd> 指南';

export { ON, markReady, undoRow, nextToAct, anyIdle, shouldConfirmEnd, braceTheRest, followHero, flowHotkeys };
