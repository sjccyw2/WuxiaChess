// The original nine sprites share a compact atlas. Later heroes have individual compact sheets.
// Both resolutions share the same poses and foot anchors.
import { art } from '../ui/artwork.js';
// Fighters drawn on the shared atlas (assets/battle-poses.png), in atlas order.
const SHEET_IDS = ['hero', 'medic', 'guard', 'guo', 'xiao', 'duan', 'chief', 'bandit', 'archer'];
const FRAMES = 8;
const CELL_WIDTH = 144;
const CELL_HEIGHT = 176;
const FOOT_Y = 162;

function validSheet(image, cols, rows) {
  return !!(
    image?.complete &&
    image.naturalWidth > 0 &&
    image.naturalHeight > 0 &&
    Math.abs(
      (image.naturalWidth * rows * CELL_HEIGHT) / (image.naturalHeight * cols * CELL_WIDTH) - 1
    ) < 0.015
  );
}
function compactSheetName(id) {
  return SHEET_IDS.includes(id) ? 'battle-poses' : 'poses-' + id;
}
function spriteSheet(id, image) {
  const full = image('motion-' + id);
  if (validSheet(full, FRAMES, 4))
    return { image: full, x: 0, y: 0, w: full.naturalWidth / FRAMES, h: full.naturalHeight / 4 };
  if (!SHEET_IDS.includes(id)) {
    const small = image(compactSheetName(id));
    return validSheet(small, FRAMES, 4)
      ? { image: small, x: 0, y: 0, w: small.naturalWidth / FRAMES, h: small.naturalHeight / 4 }
      : null;
  }
  const compact = image('battle-poses'),
    index = SHEET_IDS.indexOf(id);
  if (index < 0 || !validSheet(compact, 3 * FRAMES, 12)) return null;
  const w = compact.naturalWidth / (3 * FRAMES),
    h = compact.naturalHeight / 12;
  return { image: compact, x: (index % 3) * FRAMES * w, y: Math.floor(index / 3) * 4 * h, w, h };
}

// The compact atlas is small and requested first, so a slow or failed high-resolution
// sheet never has to supply the first step or strike.
function compactImage(img, onFailure) {
  img.onerror = onFailure;
  img.src = art('battle-poses.png');
}

// Fighter art that has been asked for and has neither arrived nor failed. The loading
// sequence (src/loading.js) reads the count so the title is not shown before its fighters.
const arriving = new Set();
function watchArt(img) {
  arriving.add(img);
  const settled = () => arriving.delete(img);
  img.addEventListener('load', settled);
  img.addEventListener('error', settled);
}
function artArriving() {
  return arriving.size;
}

export {
  FRAMES,
  CELL_WIDTH,
  CELL_HEIGHT,
  FOOT_Y,
  compactSheetName,
  spriteSheet,
  compactImage,
  watchArt,
  artArriving
};
