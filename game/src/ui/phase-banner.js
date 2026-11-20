// The banner that sweeps across the field when the side to act changes.
// Polish switch: phaseBanner. Styled in styles/12-combat.css.
//
// It is decoration only: aria-hidden (the plaque's live region already announces the
// phase) and transparent to the pointer, so it never takes a click from the board.
import { POLISH } from '../polish.js';
import { inkBrush } from '../fx/brush.js';

const LABELS = { ally: '我方行動', enemy: '敵方行動' };
// Sweep in, hold and sweep out take LIFE ms. The enemy's first action waits until LEAD ms
// after the banner appears, which is while it still holds; the sweep out plays over it.
const LIFE = 1060,
  LEAD = 540;
const STILL_LIFE = 820,
  STILL_LEAD = 300;

let node = null,
  timer = 0,
  shownAt = -Infinity,
  lead = 0;

function build() {
  const host = document.getElementById('field');
  if (!host) return null;
  node = document.createElement('div');
  node.id = 'phase-banner';
  node.className = 'phase-banner';
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML =
    '<i class="pb-shade"></i><i class="pb-ink"></i><i class="pb-rule"></i>' +
    '<span class="pb-text"><small>第 <b></b> 回合</small><strong></strong></span>';
  host.append(node);
  return node;
}

// side: 'ally' or 'enemy'. motion: the game's motion setting.
function showPhase(side, round, motion = true) {
  if (!POLISH.phaseBanner) return;
  inkBrush();
  const el = node || build();
  if (!el) return;
  clearTimeout(timer);
  el.classList.remove('run', 'still');
  el.dataset.side = side === 'enemy' ? 'enemy' : 'ally';
  el.querySelector('b').textContent = round;
  el.querySelector('strong').textContent = LABELS[el.dataset.side];
  // Reading a layout property restarts the keyframes when two banners follow closely.
  void el.offsetWidth;
  el.classList.add(motion ? 'run' : 'still');
  shownAt = performance.now();
  lead = motion ? LEAD : STILL_LEAD;
  timer = setTimeout(() => el.classList.remove('run', 'still'), motion ? LIFE : STILL_LIFE);
}

// Resolves once a banner that is on screen has had its moment. Immediate when none is showing.
function phaseLead() {
  const wait = shownAt + lead - performance.now();
  return wait > 0 ? new Promise((resolve) => setTimeout(resolve, wait)) : Promise.resolve();
}

export { showPhase, phaseLead };
