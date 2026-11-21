// Text of the game's source files, loaded once.
//
// The wiki cites where each fact lives (來源 rules/game.js:198) and lists every line of
// in-game text (遊戲原文). Both are worked out from the files the game is running right now,
// not from a saved copy.
import { GAME_ROOT } from './game-data.js';

// Files whose text is shown to players. Scenery modules only build 3D models and are skipped.
export const TEXT_FILES = [
  'src/ui/action-flow.js',
  'src/actors/actors.js',
  'src/app.js',
  'src/ui/armory-views.js',
  'src/actors/battle-marks.js',
  'src/rules/battle-mastery.js',
  'src/data/battles.js',
  'src/ui/board-plan.js',
  'src/scene/board.js',
  'src/ui/bowl-views.js',
  'src/ui/company-views.js',
  'src/data/encounter-script.js',
  'src/data/encounters.js',
  'src/rules/ferry-market.js',
  'src/ui/field-extras.js',
  'src/ui/field-hud.js',
  'src/data/form-catalog.js',
  'src/rules/form-rules.js',
  'src/rules/game.js',
  'src/ui/gates.js',
  'src/data/hero-voices.js',
  'index.html',
  'src/ui/journey-pages.js',
  'src/rules/journey.js',
  'src/data/martial-arts.js',
  'src/data/mastery-catalog.js',
  'src/ui/mastery-views.js',
  'src/data/maze-tale.js',
  'src/rules/move-facts.js',
  'src/data/new-heroes.js',
  'src/ui/panels.js',
  'src/ui/phase-banner.js',
  'src/data/rule-terms.js',
  'src/ui/intro-film.js',
  'src/ui/run-views.js',
  'src/data/realms.js',
  'src/ui/realm-views.js',
  'src/ui/dev-mode.js',
  'src/fx/technique-strokes.js',
  'src/data/terrain.js',
  'src/actors/tokens.js',
  'src/data/wake-tale.js',
  'src/ui/wake-views.js'
];

const browserReader = async (file) => {
  const r = await fetch(new URL(file, GAME_ROOT));
  if (!r.ok) throw Error('無法讀取 ' + file);
  return r.text();
};

let texts = new Map();

// reader(file) -> Promise<string>. The browser fetches; tools pass a file-system reader.
export async function loadSources(reader = browserReader) {
  const loaded = await Promise.all(TEXT_FILES.map(async (f) => [f, await reader(f)]));
  texts = new Map(loaded);
  return texts;
}
export const sourceText = (file) => texts.get(file) ?? '';
export const sourceFiles = () => [...texts.keys()];

const lineStarts = new Map();
function lineAt(file, index) {
  if (!lineStarts.has(file)) {
    const starts = [0],
      text = sourceText(file);
    for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) starts.push(i + 1);
    lineStarts.set(file, starts);
  }
  const starts = lineStarts.get(file);
  let lo = 0,
    hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}
export { lineAt };

// Where a piece of game text is written: the first of `files` that contains it, as
// {file, line}. A whole quoted string is preferred over a mention inside a longer one.
// Returns null when the text is put together at run time.
export function cite(text, ...files) {
  if (text == null || text === '') return null;
  const list = files.length ? files : sourceFiles();
  for (const needle of ["'" + text + "'", '"' + text + '"', String(text)])
    for (const file of list) {
      const at = sourceText(file).indexOf(needle);
      if (at >= 0) return { file, line: lineAt(file, at) };
    }
  return null;
}
// Several citations at once, dropping the ones that were not found and repeats.
export function cites(...refs) {
  const seen = new Set();
  return refs.filter((r) => r && !seen.has(r.file + ':' + r.line) && seen.add(r.file + ':' + r.line));
}
