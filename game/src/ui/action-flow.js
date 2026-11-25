// Action flow (switch: actionFlow). The owner's redesign of a hero's turn:
//
//   - no move button: selecting a hero shows where it can go
//   - the arts list opens by itself once a hero has finished moving, or when the selected hero
//     is clicked again; on wide screens it sits beside the hero
//   - undo appears in that list, only after a move; before one, while an art is ready, 走位
//     stands in its place and brings the walk tiles back
//   - no wait button: heroes who have not struck brace by themselves when the turn ends, which
//     is exactly what the wait button did
//   - the bottom bar is gone; the end-turn button stands alone in its corner
//
// With the switch off, none of this runs and the four-button bar is back.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';
import { icon } from './icons.js';
import { keyHint } from './field-extras.js';

const ON = POLISH.actionFlow;

// The undo entry at the foot of the arts list, shown only once the hero has moved (and while the
// move can still be taken back: not after a second action from 連環).
function undoRow(s, u) {
  if (!ON || !u?.moved || !u.origin || !G.canAct(s, u)) return '';
  return (
    '<button class="field-loadout field-undo" data-do="move" title="撤步" aria-keyshortcuts="Backspace">' +
    icon('undo', 15) +
    '撤步' +
    keyHint('Backspace') +
    '</button>'
  );
}

// 走位, in the same place while the hero has not walked and an art is ready: back to the walk
// tiles. Picking an art first hid them, and without this row the only way back was to choose a
// companion and return, which nothing said and which the last hero left to act could not do.
function walkRow(s, u, mode) {
  if (!ON || !G.canMove(s, u) || !['attack', 'skill'].includes(mode)) return '';
  return (
    '<button class="field-loadout field-undo field-walk" data-do="move" title="走位">' +
    icon('move', 15) +
    '走位</button>'
  );
}

// 回身: once a hero has struck with a glide art, his list holds only the walk and the choice to
// stay where he is. There is no undo: the walk, once taken, stands.
function glideRows(s, u) {
  if (!ON || !G.canGlide(s, u)) return '';
  const row = (action, symbol, title, note) =>
    '<button class="field-art fo-move" data-do="' +
    action +
    '"><i>' +
    icon(symbol, 19) +
    '</i><span><strong>' +
    title +
    '</strong><small>' +
    note +
    '</small></span></button>';
  return (
    row('glide', 'move', '回身 ' + u.glideLeft + ' 步', '點選青綠色地格，走完餘步') +
    row('glide-stop', 'wait', '不走了', '留在原地，結束行動')
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

// What the wait button did, for every hero who has not struck: brace for the enemy's turn. A hero
// given a second turn by 號令 who leaves it unused has made his choice and gets no free brace.
function braceTheRest(s) {
  if (!ON) return;
  for (const u of G.party(s).filter(G.living))
    if (G.canAct(s, u) && u.orderedRound !== s.round) G.waitUnit(s, u);
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

// The keys line of the help page under this flow. Esc only closes or lets go; Backspace is 撤步
// (R-61, the producer's ruling of 2026-11-25).
const flowHotkeys =
  '<kbd>1</kbd>–<kbd>4</kbd> 招式 <kbd>Enter</kbd> 確認 <kbd>E</kbd> 結束回合 <kbd>Backspace</kbd> 撤步 <kbd>Esc</kbd> 返回・選單 <kbd>G</kbd> 棋格 <kbd>[ ]</kbd> 旋轉 <kbd>?</kbd> 指南';

export { ON, markReady, undoRow, walkRow, glideRows, nextToAct, anyIdle, shouldConfirmEnd, braceTheRest, followHero, flowHotkeys };
