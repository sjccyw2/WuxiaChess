// Builds the whole catalog from the game as it is right now.
//
// Each group has its own file. They all read the game through ../game-data.js and return
// plain entries: {id, name, tag, summary, image, sections, sources}.
import * as G from '../game-data.js';
import { MANUSCRIPTS, pages, manuscript } from './lore.js';
import { story } from './story.js';
import { heroes } from './heroes.js';
import { folk } from './folk.js';
import { foes } from './foes.js';
import { skills } from './skills.js';
import { items } from './items.js';
import { missions } from './missions.js';
import { maps } from './maps.js';
import { rules } from './rules.js';

export function buildCatalog() {
  return {
    game: G.MAZE_TALE.title,
    convention: G.CATALOG_NOTE,
    // Hand-written in wiki/content/: 世界觀設定 and 單輪劇本.
    manuscripts: Object.fromEntries(Object.keys(MANUSCRIPTS).map((g) => [g, manuscript(g)])),
    groups: {
      ...Object.fromEntries(Object.keys(MANUSCRIPTS).map((g) => [g, pages(g)])),
      // Everything from here on is read from the game.
      story: story(),
      heroes: heroes(),
      folk: folk(),
      foes: foes(),
      skills: skills(),
      items: items(),
      missions: missions(),
      rules: rules(),
      maps: maps()
    }
  };
}
