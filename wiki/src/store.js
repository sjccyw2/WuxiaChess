// What the pages read from. Filled once by main.js after the game data is loaded.
//
//   game        the current build's title
//   worldview   世界觀設定: title, opening notes, one-line summary, the Markdown itself
//   loreFile    a download address for that Markdown
//   entries     catalog groups: { heroes: [...], skills: [...], ... }
//   tables      the same, as id -> entry lookups
//   terms       searchable text of each catalog entry
//   corpus      遊戲原文: { groups, entries }
//   textLookup  id -> line of game text
//   messages    searchable text of each line
export const store = {};
