// Hand-painted effects for the famous arts. Each sheet is 4 × 2 frames, read left to right and
// top to bottom, painted facing right with every frame anchored at its cell's centre.
//
// A painted art keeps the board's common dressing (the tier's charge at the striker and its
// trace along the path, technique-tiers.js) and replaces the per-hero ink effect and the art's
// own stroke with the sheet, so it reads as the same family as every other art. The sheet is
// timed so that its impact frame starts exactly when the blow lands (the action's hit, at 0.52
// of the effect), which is also when the numbers, the flash and the hit-stop arrive; a held
// action clock holds the painted frame with them. Frames before the impact are squeezed if the
// art's wind-up is shorter than the sheet's, and frames after it likewise.
import { art } from '../ui/artwork.js';
import { paintTechniqueTier } from './technique-tiers.js';
import { POLISH } from '../polish.js';

// One painted sheet. `frames` are the manifest's suggested times (ms). `hit` is the frame on
// which the blow lands. `at` is where, in the cell (fractions of its width and height), the blow
// lands in that frame: that point is put on the target. `width` is the cell's width in tiles for
// a full-size use. `tilt` is how far the sheet follows the slope of the blow on screen (0 for an
// art that lands where it stands, 1 for one that travels). `still` is the frame shown, unmoving,
// in reduced motion.
const SHEETS = {
  'nine-swords': { file: 'fx-nine-swords.webp', frames: [100, 85, 75, 65, 105, 75, 95, 115], hit: 5, at: [0.84, 0.5], width: 2.6, tilt: 1, still: 4 },
  'dragon-palms': { file: 'fx-dragon-palms.webp', frames: [105, 90, 85, 80, 115, 90, 95, 130], hit: 5, at: [0.72, 0.45], width: 2.5, tilt: 0.6, still: 4 },
  'six-meridians': { file: 'fx-six-meridians.webp', frames: [95, 80, 75, 80, 105, 85, 95, 105], hit: 5, at: [0.8, 0.46], width: 2.3, tilt: 1, still: 5 },
  'lone-palm': { file: 'fx-lone-palm.webp', frames: [120, 105, 100, 80, 125, 100, 105, 135], hit: 4, at: [0.55, 0.52], width: 1.9, tilt: 0, still: 4 },
  'bamboo-staff': { file: 'fx-bamboo-staff.webp', frames: [105, 90, 85, 75, 100, 85, 85, 115], hit: 4, at: [0.52, 0.52], width: 2, tilt: 0, still: 4 },
  'toad-qi': { file: 'fx-toad-qi.webp', frames: [110, 100, 100, 70, 110, 85, 90, 115], hit: 5, at: [0.82, 0.47], width: 2.3, tilt: 0.4, still: 4 },
  'jade-flick': { file: 'fx-jade-flick.webp', frames: [105, 95, 65, 60, 110, 75, 85, 120], hit: 4, at: [0.66, 0.5], width: 1.9, tilt: 1, still: 4 }
};

// Which art plays which sheet, at what share of its full size. A famous art's summit plays it
// whole; a form of the same art (亢龍有悔, of 降龍十八掌) shares it, smaller, so the summit
// still reads as the grandest. Some forms (破劍式, 少商劍 …) keep their own
// strokes, as does 見龍在田, a ward raised on oneself rather than a blow. 金蛇劍法 has a sheet
// too; it waits for 袁承志.
const ARTS = {
  ninefoldIntent: ['nine-swords', 1], // 獨孤九劍, 令狐冲's summit
  ninefoldFormula: ['nine-swords', 0.78], // 總訣式
  dragonReserve: ['dragon-palms', 1], // 降龍十八掌, 郭靖's summit
  flyingDragon: ['dragon-palms', 0.88], // 飛龍在天
  kanglongRegret: ['dragon-palms', 0.8], // 亢龍有悔
  sixMeridians: ['six-meridians', 1], // 六脈齊發, 段譽's summit
  solitaryPalm: ['lone-palm', 1], // 黯然銷魂掌, 楊過's summit
  mournfulCloud: ['lone-palm', 0.85], // 杞人憂天
  staffWithoutDogs: ['bamboo-staff', 1], // 天下無狗, 黃蓉's summit
  beggarTrip: ['bamboo-staff', 0.86], // 絆字訣
  beggarBind: ['bamboo-staff', 0.8], // 纏字訣
  'signature:yang': ['toad-qi', 0.75], // 蛤蟆功, 楊過's starting art
  toadLunge: ['toad-qi', 1], // 蛤蟆功, 歐陽鋒's signature
  fingerFlick: ['jade-flick', 0.85] // 彈指神通, the shop manual
};

const MAX_TILT = 0.38;
const sheets = new Map(); // name → { image, bitmap, ready, failed }

function load(name) {
  let sheet = sheets.get(name);
  if (sheet || typeof Image !== 'function') return sheet;
  const image = new Image();
  sheet = { image, bitmap: null, ready: false, failed: false };
  sheets.set(name, sheet);
  image.decoding = 'async';
  image.onload = () => {
    sheet.ready = true;
    // A decoded bitmap draws without decoding again on any later frame.
    globalThis.createImageBitmap?.(image).then(
      (bitmap) => (sheet.bitmap = bitmap),
      () => {}
    );
  };
  image.onerror = () => (sheet.failed = true);
  image.src = art(SHEETS[name].file);
  return sheet;
}

// The arts on this board that have a painted sheet start loading: the heroes' learned arts and
// starting arts, and the villains' signatures. Cheap enough to call on every board update.
function warmPaintedEffects(state, enemyTechnique) {
  if (!POLISH.paintedEffects) return;
  for (const u of state?.units || []) {
    if (u.hp <= 0) continue;
    const ids =
      u.side === 'ally'
        ? ['signature:' + u.id, ...(Array.isArray(u.learned) ? u.learned : [])]
        : [enemyTechnique(u, state)?.stroke];
    for (const id of ids) if (Object.hasOwn(ARTS, id)) load(ARTS[id][0]);
  }
}

// Which painted sheet an effect plays, or null.
function paintedFor(e) {
  return e.kind === 'technique' && Object.hasOwn(ARTS, e.techniqueId) ? ARTS[e.techniqueId] : null;
}

const smooth = (a, b, t) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

// Paints effect `e` at action time `now` if its art has a sheet, and returns whether it did; the
// caller draws the ink effect and stroke otherwise. Whether an effect is painted is settled on its
// first frame, so a sheet that arrives mid-action does not swap the drawing halfway. `from` and
// `to` are the striker's and target's body points on screen; `scale` is pixels per tile there.
function paintPaintedEffect(c, e, now, from, to, scale, reduced) {
  const use = POLISH.paintedEffects && paintedFor(e);
  if (!use) return false;
  const [name, size] = use;
  const sheet = load(name);
  e.painted ??= !!sheet?.ready;
  if (!e.painted) return false;
  const f = (now - e.start) / (e.end - e.start);
  paintTechniqueTier(c, from, to, f, scale, e.rank, e.family, e.visual, reduced);
  const spec = SHEETS[name],
    frames = spec.frames;
  let index, alpha;
  if (reduced) {
    // Reduced motion: the full silhouette at the target, fading in and out.
    index = spec.still;
    alpha = smooth(0.025, 0.16, f) * (1 - smooth(0.81, 0.975, f));
  } else {
    const hitAt = e.start + 0.52 * (e.end - e.start);
    let lead = 0;
    for (let i = 0; i < spec.hit; i++) lead += frames[i];
    let tail = 0;
    for (let i = spec.hit; i < frames.length; i++) tail += frames[i];
    // Sheet time: the impact frame starts at the blow.
    const before = hitAt - e.start,
      after = e.end - hitAt,
      t =
        now < hitAt
          ? lead + (now - hitAt) / Math.min(1, before / lead)
          : lead + (now - hitAt) / Math.min(1, after / tail);
    if (t < 0 || t >= lead + tail) return true;
    let edge = 0;
    for (index = 0; index < frames.length - 1 && t >= edge + frames[index]; index++) edge += frames[index];
    alpha = 1;
  }
  if (alpha <= 0.01) return true;
  const source = sheet.bitmap || sheet.image,
    cellW = source.width / 4,
    cellH = source.height / 2;
  // The cell in tiles, then pixels; the painted blow (spec.at) is put on the target.
  const width = spec.width * size * Math.max(scale, 14),
    height = (width * cellH) / cellW;
  const dx = to.x - from.x,
    dy = to.y - from.y,
    facing = dx < 0 ? -1 : 1;
  const slope = Math.abs(dx) + Math.abs(dy) > 1 ? Math.atan2(dy, Math.abs(dx)) : 0;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(to.x, to.y);
  c.scale(facing, 1);
  c.rotate(Math.max(-MAX_TILT, Math.min(MAX_TILT, slope)) * spec.tilt);
  c.drawImage(
    source,
    (index % 4) * cellW,
    Math.floor(index / 4) * cellH,
    cellW,
    cellH,
    -spec.at[0] * width,
    -spec.at[1] * height,
    width,
    height
  );
  c.restore();
  return true;
}

export { SHEETS as PAINTED_SHEETS, ARTS as PAINTED_ARTS, warmPaintedEffects, paintPaintedEffect };
