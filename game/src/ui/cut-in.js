// The portrait cut-in for rank 3 and 4 techniques: a slanted band with the fighter's
// painted portrait and the name of the technique. Polish switch: skillCutIn.
// Styled in styles/12-combat.css.
//
// Decoration only: aria-hidden (the technique caption is the live region) and
// transparent to the pointer.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';
import { unitFace } from './panels.js';
import { inkBrush } from '../fx/brush.js';

let node = null,
  timer = 0;
const warmed = new Map();
// The restyled technique caption takes its ink edge from the shared brush stroke, which
// is painted once, when the page is next idle.
if (POLISH.skillCutIn && globalThis.document)
  (globalThis.requestIdleCallback || setTimeout)(() => inkBrush());

// Called when a rank 3 or 4 technique is queued, usually a walk ahead of the cut-in:
// builds the band and hands it the portrait, so nothing is fetched or laid out for the
// first time on the frame the band opens.
function warmCutIn(unit) {
  if (!POLISH.skillCutIn || !unit) return;
  const src = unitFace(unit);
  if (!warmed.has(src)) {
    const img = new Image();
    img.src = src;
    img.decode?.().catch(() => {});
    warmed.set(src, img);
  }
  const el = node || build();
  if (el && !el.classList.contains('run')) {
    const img = el.querySelector('img');
    if (img.getAttribute('src') !== src) img.src = src;
  }
}

function build() {
  const host = document.getElementById('field');
  if (!host) return null;
  node = document.createElement('div');
  node.id = 'cut-in';
  node.className = 'cut-in';
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML =
    '<div class="ci-band"><i class="ci-streaks"></i>' +
    '<span class="ci-face"><img alt=""></span><i class="ci-glint"></i>' +
    '<p class="ci-title"><span></span><strong></strong></p></div>';
  host.append(node);
  return node;
}

// unit: the fighter using the technique. ms: how long the cut-in stays, start to finish.
function showCutIn(unit, technique, rank, ms) {
  if (!POLISH.skillCutIn || !unit) return;
  const el = node || build();
  if (!el) return;
  clearTimeout(timer);
  el.classList.remove('run');
  el.dataset.side = G.ally(unit) ? 'ally' : 'enemy';
  el.dataset.tier = rank;
  el.style.setProperty('--ci-ms', ms + 'ms');
  const src = unitFace(unit),
    img = el.querySelector('img');
  if (img.getAttribute('src') !== src) img.src = src;
  el.querySelector('.ci-title span').textContent = G.unitDetails(unit).name;
  el.querySelector('.ci-title strong').textContent = technique;
  void el.offsetWidth;
  el.classList.add('run');
  timer = setTimeout(() => el.classList.remove('run'), ms + 40);
}

export { showCutIn, warmCutIn };
