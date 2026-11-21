// Which rule words (the game's RULE_TERMS, data/rule-terms.js) an art, an item or an enemy
// carries, and the reverse. Pages use these to link a rule to everything that has it.
import * as G from '../game-data.js';
import { links, link } from './parts.js';

const TERMS = Object.values(G.RULE_TERMS);
// A term names its carrier by a field ('recoil') or by a test of the whole definition.
const carries = (test, subject) =>
  typeof test === 'function' ? !!test(subject) : subject?.[test] != null && subject[test] !== false;

// `art` is a technique's definition; `forms` its FORM_RULES keys (ART_FORMS).
export function artTerms(art, forms = []) {
  if (!art) return [];
  const conditions = new Set([...G.effectsOf(art), ...G.selfEffectsOf(art)].map((e) => e.kind));
  return TERMS.filter(
    (t) =>
      (t.art && carries(t.art, art)) ||
      (t.form && forms.includes(t.form)) ||
      (t.condition && conditions.has(t.condition))
  );
}
export function itemTerms(id) {
  const it = G.ITEMS[id],
    forms = G.WEAPON_FORMS[id] || [];
  return TERMS.filter(
    (t) =>
      (t.item && carries(t.item, it)) ||
      (t.form && forms.includes(t.form)) ||
      (t.id === 'weaponForm' && forms.length) ||
      (t.id === 'medicine' && it.kind === 'use')
  );
}
// `details` is an enemy's entry: a named opponent (it has a signature) or a troop type.
export function traitTerms(details) {
  const traits = details.traits || {};
  return TERMS.filter(
    (t) =>
      (t.trait && carries(t.trait, traits)) ||
      (t.style && details.style === t.style) ||
      (t.id === 'signature' && details.skill)
  );
}
// The link row a page shows for the rules it carries; null when it carries none.
export const ruleLinks = (terms) =>
  terms.length ? links('相關規則', terms.map((t) => link('rules', t.id, t.name))) : null;
