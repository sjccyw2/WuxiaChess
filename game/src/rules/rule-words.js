// Which rule words something carries: an art, an item, an enemy, a state on a piece, and a whole
// battle (carriedWords). The in-game guide names a word beyond the first tier only when the board
// carries it (Q-N152, T2); the wiki uses the same tests to list, on each word's page, every art,
// item and enemy that has it (wiki/src/catalog/terms.js).
//
// A term (data/rule-terms.js) names its carriers by its fields: `art`, `item` and `trait` a field
// of the definition, a list of fields or a test of the whole; `form` and `condition` a key or a
// list. The 戰鬥效果 that are words (破綻, 截勁, 牽引; FORM_WORDS) are carried by their forms.
// Words are given by id: a term's id, or a form word's (its first form).
import { RULE_TERMS, FORM_WORDS } from '../data/rule-terms.js';
import { TECHNIQUES } from '../data/martial-arts.js';
import { CONDITION_NAMES, effectsOf, selfEffectsOf } from './battle-mastery.js';
import { ITEMS, party, artFor, living, ally, unitDetails, traitsOf, announcedWaves, boardOf } from './game.js';

const TERMS = Object.values(RULE_TERMS);
const carries = (test, subject) =>
  Array.isArray(test)
    ? test.some((one) => carries(one, subject))
    : typeof test === 'function'
      ? !!test(subject)
      : subject?.[test] != null && subject[test] !== false;
const keysOf = (field) => [].concat(field ?? []);
const formWords = (forms) => FORM_WORDS.filter((w) => w.forms.some((f) => forms.includes(f))).map((w) => w.id);

// An art's definition and its FORM_RULES keys: the words of its fields, its forms and the states
// it lays on its target or its caster.
function artWords(art, forms = art?.forms || []) {
  if (!art) return [];
  const laid = new Set([...effectsOf(art), ...selfEffectsOf(art)].map((e) => e.kind));
  return [
    ...TERMS.filter(
      (t) =>
        (t.art && carries(t.art, art)) ||
        keysOf(t.form).some((f) => forms.includes(f)) ||
        keysOf(t.condition).some((c) => laid.has(c))
    ).map((t) => t.id),
    ...formWords(forms)
  ];
}
// An item by id: its fields and its forms; any medicine carries 服藥.
function itemWords(id) {
  const it = ITEMS[id];
  if (!it) return [];
  const forms = it.forms || [];
  return [
    ...TERMS.filter(
      (t) =>
        (t.item && carries(t.item, it)) ||
        keysOf(t.form).some((f) => forms.includes(f)) ||
        (t.id === 'medicine' && it.kind === 'use')
    ).map((t) => t.id),
    ...formWords(forms)
  ];
}
// An enemy's entry (a named opponent, who has a signature, or a troop type) and the traits in
// force (a piece's own, traitsOf, or the entry's).
function traitWords(details, traits = details?.traits || {}) {
  if (!details) return [];
  return TERMS.filter(
    (t) =>
      (t.trait && carries(t.trait, traits)) ||
      (t.style && details.style === t.style) ||
      (t.id === 'signature' && details.skill)
  ).map((t) => t.id);
}
// The word for a state a piece can be in (a condition's kind), or null. 代價's 無守 is the state of
// the field openGuard.
const STATE_OF = { unguarded: 'openGuard' };
function stateWord(kind) {
  const key = STATE_OF[kind] || kind;
  const term =
    TERMS.find((t) => keysOf(t.condition).includes(key)) ||
    TERMS.find((t) => keysOf(t.form).includes(key)) ||
    TERMS.find((t) => typeof t.art !== 'function' && keysOf(t.art).includes(key));
  return term ? term.id : formWords([key])[0] || null;
}

// The words a battle carries, as a set of ids: the arts every fielded hero has learned or
// equipped (his starting art among them), the items worn and in the stores, the enemies on the
// board (their traits, and the states their signatures lay), every state on a living piece, a
// laid 布陣, the secondary, and reinforcements once they are announced or on the board (never
// before: they come as a surprise). Empty without a board.
function carriedWords(s) {
  const found = new Set(),
    add = (ids) => ids.forEach((id) => id && found.add(id));
  if (!s?.units) return found;
  for (const u of party(s)) {
    const arts = new Set(['signature', ...(u.learned || []), ...(u.slots || [])]);
    for (const id of arts) if (id === 'signature' || TECHNIQUES[id]) add(artWords(artFor(u, id)));
    add(itemWords(u.weapon));
    add(itemWords(u.gear));
  }
  for (const [id, n] of Object.entries(s.stock || {})) if (n > 0) add(itemWords(id));
  for (const v of s.units) {
    if (!living(v)) continue;
    add(Object.keys(v.conditions || {}).map(stateWord));
    if (ally(v) || v.side === 'prop') continue;
    const details = unitDetails(v),
      traits = traitsOf(v);
    add(traitWords(details, traits));
    add([details?.style, traits.sig?.extra].filter((kind) => kind in CONDITION_NAMES).map(stateWord));
  }
  if (s.zones?.length) found.add('zone');
  if (s.run?.side) found.add('side');
  const arrived = boardOf(s).waves.some((w) => w.pieces.some((p) => s.units.some((v) => v.id === p.id)));
  if (arrived || announcedWaves(s).length) found.add('waves');
  return found;
}

export { artWords, itemWords, traitWords, stateWord, carriedWords };
