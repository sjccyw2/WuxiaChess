// Item pictures: one still each (item-<id>.webp), cut from the painted sheets by tools/item-art.py.
// Items are shown still, never animated (the producer's decision of 2026-11-21).
import { art } from './artwork.js';

function itemPicture(id, cls = '') {
  return '<img class="' + cls + '" draggable="false" alt="" src="' + art('item-' + id + '.webp') + '">';
}

export { itemPicture };
