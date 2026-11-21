// The one seam between the wiki and the game.
//
// Everything the wiki shows about heroes, arts, items, foes, missions and maps is read from
// the game's own modules at page load, so the two can never drift apart. Add a line here
// when the wiki needs something new from the game; do not copy values into the wiki.
export * from '../../game/src/data/terrain.js';
export * from '../../game/src/data/mastery-catalog.js';
export * from '../../game/src/data/new-heroes.js';
export * from '../../game/src/data/encounters.js';
export * from '../../game/src/data/battles.js';
export * from '../../game/src/data/board-objects.js';
export * from '../../game/src/data/encounter-script.js';
export * from '../../game/src/data/form-catalog.js';
export * from '../../game/src/data/wake-tale.js';
export * from '../../game/src/data/maze-tale.js';
export * from '../../game/src/data/realms.js';
export * from '../../game/src/data/hero-voices.js';
export * from '../../game/src/data/martial-arts.js';
export * from '../../game/src/data/rule-terms.js';
export * from '../../game/src/rules/formation.js';
export * from '../../game/src/rules/battle-mastery.js';
export * from '../../game/src/rules/form-rules.js';
export * from '../../game/src/rules/game.js';
export * from '../../game/src/rules/move-facts.js';
export * from '../../game/src/rules/ferry-market.js';
export * from '../../game/src/rules/journey.js';
export * from '../../game/src/fx/technique-strokes.js';
export { portraits } from '../../game/src/ui/panels.js';
export { flowHotkeys } from '../../game/src/ui/action-flow.js';
export { extraHotkeys } from '../../game/src/ui/field-extras.js';
export { STATUS_SIGNS } from '../../game/src/actors/tokens.js';

// Game source files whose text the wiki reads (for 來源 line references and 遊戲原文).
export const GAME_ROOT = new URL('../../game/', import.meta.url);
