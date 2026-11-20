// What the pages read from. Filled once by main.js after the game data is loaded.
//
//   game        the current build's title
//   docs        the hand-written manuscripts (世界觀設定, 單輪劇本), by category: title,
//               opening notes, one-line summary, the Markdown itself
//   docFiles    a download address for each manuscript's Markdown
//   entries     catalog groups: { heroes: [...], skills: [...], ... }
//   tables      the same, as id -> entry lookups
//   terms       searchable text of each catalog entry
//   corpus      遊戲原文: { groups, entries }
//   textLookup  id -> line of game text
//   messages    searchable text of each line
export const store = {};
