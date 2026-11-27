// The full rules of an art in the battle's arts list: a card shown on a long press (touch) or
// when the pointer rests on an entry (mouse), or when an entry takes keyboard focus. The list
// itself has room for a name, a range and one number; what an art does beyond that (濺射,
// 擊退, 連擊, conditions, 破招 and the rest) is in `moveFacts`, and this card shows all of it
// with the art's own description.
//
// A long press only reads: the tap that ends it does not pick the art. The card stays until the
// next touch anywhere, which then does whatever it would have done.
//
// A card the mouse opened goes as soon as the pointer is off its entry (2026-11-25, the
// producer's ruling: on a desktop it stayed beside the list and covered the board), and so does
// any card when its art is picked or the list closes. The entry just picked opens no card again
// until the pointer (or the keyboard focus) has left it.
import * as G from '../rules/game.js';
import { moveFacts } from '../rules/move-facts.js';
import { TECHNIQUES } from '../data/martial-arts.js';

const PRESS_MS = 450, // how long a finger rests before the card opens
  HOVER_MS = 280, // how long a mouse pointer rests
  DRIFT = 10; // how far a finger may move (px) and still count as resting
const KINDS = {
  basic: '普攻',
  enemy: '敵軍',
  ally: '友軍',
  self: '自身',
  ground: '空地'
};

const esc = (t) =>
  String(t ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

function definitionOf(u, id) {
  if (id === 'basic') return G.basicFor(u);
  return id === 'signature' ? G.artFor(u, id) : TECHNIQUES[id] || G.artFor(u, id);
}

function artDetail(s, u, id) {
  const f = moveFacts(s, u, id);
  if (!f) return '';
  const basic = id === 'basic';
  const ready = basic ? { ok: true } : G.artReady(s, u, id);
  const desc = definitionOf(u, id)?.desc;
  const head = [
    KINDS[f.kind] || '',
    f.range ? '射程 ' + f.range + ' 格' : '',
    basic ? '免內力' : f.mp + ' 內力',
    f.hpCost ? '自耗 ' + f.hpCost + ' 氣血' : ''
  ].filter(Boolean);
  return (
    '<header><strong>' +
    esc(f.name) +
    '</strong><small>' +
    esc(head.join(' · ')) +
    '</small></header>' +
    '<p class="ad-power"><small>' +
    esc(f.powerLabel) +
    '</small><b>' +
    esc(f.powerText) +
    '</b>' +
    (f.factor ? '<small>攻擊倍率 × ' + esc(f.factor) + '</small>' : '') +
    '</p>' +
    (f.effectLines.length
      ? '<ul>' + f.effectLines.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>'
      : '') +
    (desc ? '<p class="ad-desc">' + esc(desc) + '</p>' : '') +
    (f.formRules.length
      ? f.formRules.map((r) => '<p class="ad-form">' + esc(r) + '</p>').join('')
      : '') +
    (ready.ok ? '' : '<p class="ad-held">' + esc(ready.reason) + '</p>')
  );
}

// list: the element the arts list is drawn into (it is redrawn often, so events are read on it);
// read: () => ({ state, unit }) for the hero whose list it is. 整備's 陣容 pane uses it too (inkLook).
// options.entry: which elements are entries (the battle list's by default); options.host: where the
// card lives (a page in the modal dialog needs it inside the dialog, which shuts out the rest).
function installArtDetail(list, read, { entry = '.field-art[data-id]', host = document.body, id = 'art-detail' } = {}) {
  const card = document.createElement('div');
  card.className = 'art-detail';
  card.id = id;
  card.setAttribute('role', 'tooltip');
  card.hidden = true;
  host.append(card);
  let timer = 0,
    press = null, // the finger resting on an entry: { id, x, y }
    swallow = false, // the click that ends a long press is not a pick
    shownFor = null,
    byMouse = false, // the card was opened by a resting mouse pointer
    picked = null; // the entry just picked: no card for it until the pointer or focus leaves it

  const entryOf = (e) => e.target.closest?.(entry);
  function place(button) {
    const r = button.getBoundingClientRect(),
      vw = innerWidth,
      vh = innerHeight,
      gap = 8,
      edge = 12;
    card.style.maxWidth = Math.min(320, vw - 2 * edge) + 'px';
    card.style.left = card.style.top = '0px';
    const w = card.offsetWidth,
      h = card.offsetHeight;
    const panel = button.closest('#arts-panel')?.getBoundingClientRect() || r;
    let x, y;
    if (panel.left - gap - w >= edge) x = panel.left - gap - w;
    else if (panel.right + gap + w <= vw - edge) x = panel.right + gap;
    if (x != null) y = Math.max(edge, Math.min(vh - h - edge, r.top + r.height / 2 - h / 2));
    else {
      // No room beside the list (an upright phone): above the entry, or below it.
      x = Math.max(edge, Math.min(vw - w - edge, r.left));
      y = r.top - gap - h >= edge ? r.top - gap - h : Math.min(vh - h - edge, r.bottom + gap);
    }
    card.style.left = Math.round(x) + 'px';
    card.style.top = Math.round(y) + 'px';
  }
  function show(button) {
    // The list may have been redrawn or shut while the pointer rested.
    if (!button.isConnected || button.closest('[hidden]') || button.dataset.id === picked) return;
    const { state, unit } = read();
    if (!state || !unit) return;
    const html = artDetail(state, unit, button.dataset.id);
    if (!html) return;
    card.innerHTML = html;
    card.hidden = false;
    shownFor = button.dataset.id;
    place(button);
  }
  function hide() {
    clearTimeout(timer);
    card.hidden = true;
    shownFor = null;
    byMouse = false;
  }

  list.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = entryOf(e);
    if (!b) return;
    clearTimeout(timer);
    if (shownFor === b.dataset.id && !card.hidden) return;
    timer = setTimeout(() => {
      show(b);
      if (!card.hidden) byMouse = true;
    }, shownFor ? 0 : HOVER_MS);
  });
  list.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = entryOf(e);
    if (b && b.contains(e.relatedTarget)) return;
    hide();
  });
  // The pointer is off the entry the card describes. The list is redrawn under a resting pointer
  // (a pick, a repaint), and an entry taken away sends no pointerout: so every mouse move is
  // checked against the entry now under it.
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const over = entryOf(e)?.dataset.id ?? null;
      if (picked && over !== picked) picked = null;
      if (byMouse && !card.hidden && over !== shownFor) hide();
    },
    true
  );
  // An art picked: the card has served its purpose.
  list.addEventListener('click', (e) => {
    const b = entryOf(e);
    if (!b) return;
    hide();
    picked = b.dataset.id;
  });
  list.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    picked = null; // a finger asks afresh: a long press reads even the art just picked
    const b = entryOf(e);
    if (!b) return;
    press = { id: b.dataset.id, x: e.clientX, y: e.clientY };
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!press) return;
      swallow = true;
      show(b);
      navigator.vibrate?.(8);
    }, PRESS_MS);
  });
  list.addEventListener('pointermove', (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > DRIFT) {
      press = null;
      clearTimeout(timer);
    }
  });
  const release = () => {
    press = null;
    if (card.hidden) clearTimeout(timer);
  };
  list.addEventListener('pointerup', release);
  list.addEventListener('pointercancel', release);
  // A long press is not a pick, and not a call for the browser's own menu.
  list.addEventListener(
    'click',
    (e) => {
      if (!swallow) return;
      swallow = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );
  list.addEventListener('contextmenu', (e) => {
    if (entryOf(e)) e.preventDefault();
  });
  // The next touch anywhere, or the list going away, puts the card away.
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!card.hidden) hide();
      if (!list.contains(e.target)) swallow = false;
    },
    true
  );
  // The list shut (its panel hidden), whatever shut it.
  const panel = list.closest('.hud-flyout');
  if (panel)
    new MutationObserver(() => {
      if (!panel.hidden) return;
      hide();
      picked = null;
    }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  list.addEventListener('focusin', (e) => {
    const b = entryOf(e);
    if (picked && b?.dataset.id !== picked) picked = null;
    if (b?.matches(':focus-visible')) show(b);
  });
  list.addEventListener('focusout', (e) => {
    if (!list.contains(e.relatedTarget)) hide();
  });
  return {
    // After the list is redrawn: keep the card only while its entry is still there and shown.
    sync() {
      if (list.closest('[hidden]')) picked = null;
      if (card.hidden) return;
      const b = list.querySelector(entry.replace('[data-id]', '') + '[data-id="' + CSS.escape(shownFor || '') + '"]');
      if (!b || b.closest('[hidden]')) hide();
      else place(b);
    },
    hide
  };
}

export { installArtDetail, artDetail };
