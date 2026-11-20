// Small builders for the pieces a catalog entry is made of. The page renderer in
// view/sections.js knows how to draw each of these shapes.
export const rows = (title, list) => ({ title, rows: list.filter(Boolean) });
export const speech = (title, ...lines) => ({
  title,
  speeches: lines.flat().filter(Boolean).map((l) => (typeof l === 'string' ? { text: l } : l))
});
export const links = (title, list) => ({ title, links: list.filter(Boolean) });
export const link = (group, id, label) => ({ group, id: String(id), label });
export const cells = (n) => n + ' 格';

// Pictures: the wiki shows the game's own files, plus a few of its own in wiki/assets/.
export const gameArt = (file) => '../game/assets/' + file;
export const wikiArt = (file) => 'assets/' + file;
