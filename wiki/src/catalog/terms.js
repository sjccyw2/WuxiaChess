// Which rule words (the game's RULE_TERMS, data/rule-terms.js) an art, an item or an enemy
// carries, and the reverse. Pages use these to link a rule to everything that has it.
import * as G from '../game-data.js';
import { links, link } from './parts.js';

// The tests are the game's own (rules/rule-words.js, which the in-game guide uses to name only the
// words a board carries); here they give the terms, without the 戰鬥效果 that are words.
const terms = (ids) => ids.map((id) => G.RULE_TERMS[id]).filter(Boolean);

// `art` is a technique's definition; `forms` its FORM_RULES keys (ART_FORMS).
export const artTerms = (art, forms = []) => terms(G.artWords(art, forms));
export const itemTerms = (id) => terms(G.itemWords(id));
// `details` is an enemy's entry: a named opponent (it has a signature) or a troop type.
export const traitTerms = (details) => terms(G.traitWords(details));
// The link row a page shows for the rules it carries; null when it carries none.
export const ruleLinks = (terms) =>
  terms.length ? links('相關規則', terms.map((t) => link('rules', t.id, t.name))) : null;
