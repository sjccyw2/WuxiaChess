// The game's saves in the browser. `store` is localStorage, or anything with its getItem,
// setItem and removeItem (tools/check-mechanics.mjs passes a Map in its place).
//
//   AUTO_KEY    自動存檔: the game being played. app.js writes it after nearly every action; 繼續
//               on the title continues it. (The key is the one the game has always saved under.)
//   RECORD_KEY  the player's lasting record: the chronicle (境界 opened and won, runs finished, the
//               ending seen, 悟, and the parcel the shop keeps for the next run). Every save reads it.
//   SLOT_KEYS   存檔一 to 存檔三: { at, save }, a game the player saved by hand and when (ms).
//
// Each save still carries a copy of the chronicle, so it loads on its own (restoreRun checks it)
// and an older build of the game can still read it. Whatever is loaded takes the record in place
// of that copy, merged so that nothing in it goes back (mergeRecord): loading an older slot never
// closes a 境界 or forgets the ending.
import * as R from './journey.js';

const AUTO_KEY = 'jianying.qingzhudu.chapter1.v1',
  RECORD_KEY = 'jianying.qingzhudu.record.v1',
  SLOT_KEYS = [1, 2, 3].map((n) => 'jianying.qingzhudu.slot' + n + '.v1'),
  SLOT_COUNT = SLOT_KEYS.length,
  // The keys another tab may write under this one (app.js listens for them).
  SAVE_KEYS = [AUTO_KEY, RECORD_KEY, ...SLOT_KEYS];

const copy = (value) => JSON.parse(JSON.stringify(value));
function readJSON(store, key) {
  try {
    return JSON.parse(store.getItem(key));
  } catch {
    return null;
  }
}
// The record's counts only rise and its lists only grow, whichever run is played; so of two
// copies the later is the higher count and the union of the lists. The parcel is the exception:
// a new run takes it, so it is not a count. It is the one in `kept` (the record as it stands),
// so a slot saved before the parcel was taken does not hand it out twice, and one saved after
// cannot empty it.
const COUNTS = ['best', 'wins', 'embers', 'returns', 'realms', 'finale', 'ended', 'missed'],
  LISTS = ['fates', 'seen', 'cleared'];
function mergeRecord(kept, other) {
  if (!other) return kept;
  if (!kept) return other;
  const out = copy(kept);
  for (const k of COUNTS)
    if (Number.isSafeInteger(other[k])) out[k] = Math.max(Number.isSafeInteger(out[k]) ? out[k] : 0, other[k]);
  for (const k of LISTS) {
    if (!Array.isArray(other[k])) continue;
    const list = Array.isArray(out[k]) ? [...out[k]] : [];
    for (const v of other[k]) if (!list.includes(v)) list.push(v);
    out[k] = list.every((v) => typeof v === 'number') ? list.sort((a, b) => a - b) : list;
  }
  out.walked = { ...(out.walked || {}) };
  for (const [id, n] of Object.entries(other.walked || {}))
    if (Number.isSafeInteger(n)) out.walked[id] = Math.max(out.walked[id] || 0, n);
  out.lastFate ??= other.lastFate ?? null;
  if (!out.name && other.name) out.name = other.name;
  return out;
}
// The record under its own key, or null when there is none (a save from before the slots) or it
// does not read as a record.
function openRecord(store) {
  const p = readJSON(store, RECORD_KEY);
  if (!p || typeof p !== 'object') return null;
  p.returns ??= p.wins;
  return R.validProfile(p) ? R.fillProfile(p) : null;
}
// A loaded game, with the record in place of its own copy.
function withRecord(s, record) {
  if (s?.run && record) s.run.chronicle = mergeRecord(record, s.run.chronicle);
  return s;
}
// The game at the page's load: the autosave, if it loads, with the record. A save from before the
// slots has no record of its own yet: its chronicle becomes the record, written at once, so the
// first slot loaded after it already has a record to keep to.
function openGame(store) {
  const s = R.restoreRun(readJSON(store, AUTO_KEY));
  let record = openRecord(store);
  const migrated = !!s && !record;
  if (s) {
    withRecord(s, record);
    record = s.run.chronicle;
  }
  if (migrated)
    try {
      store.setItem(RECORD_KEY, JSON.stringify(record));
    } catch {}
  return { state: s, record, migrated };
}
// The autosave: the record first (the smaller, and the one that must not be lost), then the game.
function writeGame(store, s) {
  store.setItem(RECORD_KEY, JSON.stringify(s.run.chronicle));
  store.setItem(AUTO_KEY, JSON.stringify(s));
}
// A slot (1 to 3): null when empty; else when it was saved and the game in it, which is null if
// the save no longer loads (`broken`: it can still be saved over).
function readSlot(store, n) {
  const raw = readJSON(store, SLOT_KEYS[n - 1]);
  if (!raw) return null;
  const s = raw.save ? R.restoreRun(raw.save) : null;
  return { n, at: Number.isFinite(raw.at) ? raw.at : 0, state: s, broken: !s };
}
const readSlots = (store) => SLOT_KEYS.map((_, i) => readSlot(store, i + 1));
function writeSlot(store, n, s, at = Date.now()) {
  store.setItem(SLOT_KEYS[n - 1], JSON.stringify({ at, save: s }));
}
// A slot loaded: its game, with the record, to become the autosave (the caller writes it).
function loadSlot(store, n, record) {
  const slot = readSlot(store, n);
  return slot?.state ? withRecord(slot.state, record) : null;
}
// A run still to be played: loading another game or starting a new run would replace it.
const inProgress = (s) => !!s?.run && s.run.status !== 'ended';

export {
  AUTO_KEY,
  RECORD_KEY,
  SLOT_KEYS,
  SLOT_COUNT,
  SAVE_KEYS,
  mergeRecord,
  openRecord,
  withRecord,
  openGame,
  writeGame,
  readSlot,
  readSlots,
  writeSlot,
  loadSlot,
  inProgress
};
