// The original nine sprites share a compact atlas. Later characters have individual compact
// sheets. Both resolutions share the same poses and foot anchors.
//
// A sheet has four rows of eight frames (idle, walk, strike, hurt) or five, the fifth being
// the special pose (絕技) that a signature or an art plays. Which one a file is follows from
// its proportions, so a character's sheet needs no registration.
import { art } from '../ui/artwork.js';
// Fighters drawn on the shared atlas (assets/battle-poses.png), in atlas order.
const SHEET_IDS = ['hero', 'medic', 'guard', 'guo', 'xiao', 'duan', 'chief', 'bandit', 'archer'];
const FRAMES = 8;
const CELL_WIDTH = 144;
const CELL_HEIGHT = 176;
const FOOT_Y = 162;
const STRIKE_ROW = 2;
const SPECIAL_ROW = 4;

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
// The rows a sheet image holds, or 0 if it is not (yet) a sheet.
function sheetRows(image) {
  return [4, 5].find((rows) => validSheet(image, FRAMES, rows)) || 0;
}
function spriteSheet(id, image) {
  const full = image('motion-' + id),
    fullRows = sheetRows(full);
  if (fullRows)
    return {
      image: full,
      x: 0,
      y: 0,
      w: full.naturalWidth / FRAMES,
      h: full.naturalHeight / fullRows,
      rows: fullRows
    };
  if (!SHEET_IDS.includes(id)) {
    const small = image(compactSheetName(id)),
      rows = sheetRows(small);
    return rows
      ? {
          image: small,
          x: 0,
          y: 0,
          w: small.naturalWidth / FRAMES,
          h: small.naturalHeight / rows,
          rows
        }
      : null;
  }
  const compact = image('battle-poses'),
    index = SHEET_IDS.indexOf(id);
  if (index < 0 || !validSheet(compact, 3 * FRAMES, 12)) return null;
  const w = compact.naturalWidth / (3 * FRAMES),
    h = compact.naturalHeight / 12;
  return {
    image: compact,
    x: (index % 3) * FRAMES * w,
    y: Math.floor(index / 3) * 4 * h,
    w,
    h,
    rows: 4
  };
}
// The row a sheet plays for a clip's row: a four-row sheet has no special pose and plays its
// strike instead.
function sheetRow(sheet, row) {
  return row < sheet.rows ? row : STRIKE_ROW;
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
  STRIKE_ROW,
  SPECIAL_ROW,
  compactSheetName,
  spriteSheet,
  sheetRow,
  compactImage,
  watchArt,
  artArriving
};
