// Item pictures. Each item has a still (item-<id>.webp) and, painted from the same sheet, a short
// animated loop (item-<id>-motion.webp, eight frames of about 0.8 s). A panel shows the still; the
// loop plays while the item's row, tile or slot is pointed at or holds the keyboard focus, for two
// turns after a tap (phones have no pointer to rest), and for as long as the item is the one
// picked (the armory's inspector, the dice cup that was won). The loop is fetched the first time
// it plays. With reduced motion only stills are shown.
import { art } from './artwork.js';
import { ITEMS } from '../rules/game.js';

// 古墓長劍 keeps its old still picture; it has no loop.
const STILL_ONLY = new Set(['tombSword']);
// Where an item picture sits: the element that hovering, focusing or tapping plays it for.
const HOSTS = '.mj-product, .fo-item, .fo-slot, .fo-inspector, .lk-lot, .equipped-card';
const TAP_PLAY = 1700; // ms: two turns of a loop

const moving = () => !globalThis.document?.body?.classList.contains('no-motion');

// `live`: the picked item, which plays for as long as it is shown.
function itemPicture(id, cls = '', live = false) {
  const still = art('item-' + id + '.webp');
  if (STILL_ONLY.has(id) || !ITEMS[id])
    return '<img class="' + cls + '" draggable="false" alt="" src="' + still + '">';
  const motion = art('item-' + id + '-motion.webp'),
    play = live && moving();
  return (
    '<img class="' +
    cls +
    ' item-art' +
    (live ? ' live' : '') +
    '" draggable="false" alt="" src="' +
    (play ? motion : still) +
    '" data-still="' +
    still +
    '" data-motion="' +
    motion +
    '">'
  );
}

function play(img) {
  if (!img || !moving() || img.src.endsWith(img.dataset.motion)) return;
  img.src = img.dataset.motion;
}
function rest(img) {
  if (!img || img.classList.contains('live') || img.src.endsWith(img.dataset.still)) return;
  img.src = img.dataset.still;
}
const pictureIn = (el) => el?.closest?.(HOSTS)?.querySelector('img[data-motion]') || null;

// One set of listeners on the document serves every panel, however often it is redrawn.
function watchItemArt(doc = globalThis.document) {
  if (!doc || doc.itemArtWatched) return;
  doc.itemArtWatched = true;
  // A screen without hover may still report a pointer resting where the last finger was; that is
  // not a hover, and nothing would ever move it off again.
  const hoverless = () => globalThis.matchMedia?.('(hover: none)').matches;
  doc.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'touch' && !hoverless()) play(pictureIn(e.target));
  });
  // A finger lifted also leaves its element; a tapped picture rests on its own timer instead.
  doc.addEventListener('pointerout', (e) => {
    if (e.pointerType === 'touch') return;
    const host = e.target.closest?.(HOSTS);
    if (host && !host.contains(e.relatedTarget) && !host.matches(':focus-visible, :has(:focus-visible)'))
      rest(host.querySelector('img[data-motion]'));
  });
  // Keyboard focus only: a panel redrawn under a tap may put the focus back where it was.
  doc.addEventListener('focusin', (e) => {
    if (e.target.matches?.(':focus-visible')) play(pictureIn(e.target));
  });
  doc.addEventListener('focusout', (e) => {
    const host = e.target.closest?.(HOSTS);
    if (host && !host.contains(e.relatedTarget) && !host.matches(':hover'))
      rest(host.querySelector('img[data-motion]'));
  });
  doc.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    const img = pictureIn(e.target);
    if (!img) return;
    play(img);
    clearTimeout(img.restTimer);
    img.restTimer = setTimeout(() => rest(img), TAP_PLAY);
  });
}

export { itemPicture, watchItemArt };
