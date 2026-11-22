// Builds the wiki's catalog and text listing from the game sources, outside a browser,
// and checks that every cross-link points at a page that exists.
//
//   node tools/check-wiki.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const { loadSources, TEXT_FILES } = await import(new URL('wiki/src/sources.js', root));
await loadSources(async (file) => fs.readFileSync(new URL('game/' + file, root), 'utf8'));
const { loadManuscripts } = await import(new URL('wiki/src/catalog/lore.js', root));
await loadManuscripts(async (file) => fs.readFileSync(new URL(file, root), 'utf8'));
const { buildCatalog } = await import(new URL('wiki/src/catalog/index.js', root));
const { buildCorpus } = await import(new URL('wiki/src/corpus/index.js', root));

const catalog = buildCatalog(),
  corpus = buildCorpus();
const problems = [];
const ids = Object.fromEntries(Object.entries(catalog.groups).map(([g, list]) => [g, new Set(list.map((e) => e.id))]));

for (const [group, list] of Object.entries(catalog.groups)) {
  if (ids[group].size !== list.length) problems.push(group + ': duplicate ids');
  for (const entry of list) {
    const at = group + '/' + entry.id;
    if (!entry.name || !entry.tag) problems.push(at + ': missing name or tag');
    if (catalog.manuscripts[group]) continue;
    if (!entry.sources.length) problems.push(at + ': no source reference found');
    if (entry.image) {
      const file = new URL('wiki/' + entry.image, root);
      if (!fs.existsSync(fileURLToPath(file))) problems.push(at + ': missing picture ' + entry.image);
    }
    const check = (l) => l && !ids[l.group]?.has(l.id) && problems.push(at + ': dead link to ' + l.group + '/' + l.id);
    for (const s of entry.sections) {
      (s.links || []).forEach(check);
      (s.tree || []).flat().forEach(check);
      for (const row of s.rows || []) if (row[1] == null || row[1] === '') problems.push(at + ': empty row ' + row[0]);
      for (const line of s.speeches || []) if (!line.text) problems.push(at + ': empty line in ' + s.title);
    }
  }
}

// ── Does the wiki cover the game? ────────────────────────────────────────────
// A new mechanic, enemy, board piece or kind of secondary must reach a page. These checks fail
// when the game gains one that the wiki (or the rule words in game/src/data/rule-terms.js) does
// not account for.
const G = await import(new URL('wiki/src/game-data.js', root));
const { foePage } = await import(new URL('wiki/src/catalog/foes.js', root));
const has = (group, id) => ids[group]?.has(String(id));
const terms = Object.values(G.RULE_TERMS);
const named = (key, kind) => terms.some((t) => t[kind] === key) || G.PLAIN_FIELDS[kind].includes(key);

for (const [id, art] of Object.entries(G.TECHNIQUES)) {
  if (!has('skills', id)) problems.push('no skills page for the art ' + id);
  for (const key of Object.keys(art))
    if (!named(key, 'art')) problems.push('art ' + id + ' has the field "' + key + '", which no rule term or PLAIN_FIELDS.art entry accounts for (game/src/data/rule-terms.js)');
}
// (G.ROSTER: the ten heroes of the box, and 無名, who is a piece on the last board and after it.)
for (const hero of G.ROSTER)
  for (const page of ['basic-' + hero, 'signature-' + hero])
    if (!has('skills', page)) problems.push('no skills page ' + page);
for (const [id, item] of Object.entries(G.ITEMS)) {
  if (!has('items', id)) problems.push('no items page for ' + id);
  for (const key of Object.keys(item))
    if (!named(key, 'item')) problems.push('item ' + id + ' has the field "' + key + '", which no rule term or PLAIN_FIELDS.item entry accounts for');
}
for (const id of Object.keys(G.TRADE_MANUALS)) if (!has('items', 'guide-' + id)) problems.push('no items page for the manual ' + id);
for (const [key, details] of Object.entries(G.DETAILS)) {
  if (G.ROSTER.includes(key)) {
    if (!has('heroes', key)) problems.push('no heroes page for ' + key);
    continue;
  }
  if (!has('foes', foePage(key))) problems.push('no foes page for the enemy ' + key + ' (' + details.name + ')');
  for (const trait of Object.keys(details.traits || {}))
    if (!named(trait, 'trait')) problems.push('enemy ' + key + ' has the trait "' + trait + '", which no rule term or PLAIN_FIELDS.trait entry accounts for');
}
// (The last board is read as the game casts it: its guests are the masters of the ten boards.)
G.BATTLES.forEach((_, map) => {
  const board = G.castBoard(map);
  if (!has('missions', 'map-' + map) || !has('maps', map) || !has('story', 'map-' + map)) problems.push('board ' + map + ' has no missions, maps or story page');
  if (!has('rules', board.kind)) problems.push('board ' + map + ' is of kind "' + board.kind + '", which has no rules page');
  for (const piece of [...board.pieces, ...board.waves.flatMap((w) => w.pieces)])
    if (!has('foes', foePage(piece.id.split('#')[0]))) problems.push('board ' + map + ': no foes page for the piece ' + piece.id);
  for (const side of board.sides)
    if (!has('rules', 'side-' + side.kind)) problems.push('board ' + map + ': no rules page for the secondary "' + side.kind + '"');
});
for (const term of terms) if (!has('rules', term.id)) problems.push('no rules page for the term ' + term.id);
for (const form of Object.keys(G.FORM_RULES)) if (!has('skills', 'form-' + form)) problems.push('no skills page for the form ' + form);
// Every state a piece can be in is explained by a term or a 戰鬥效果.
const STATE_OF = { unguarded: 'openGuard' }; // a state named differently from the field that causes it
for (const kind of [...Object.keys(G.CONDITION_NAMES), ...Object.keys(G.STATUS_SIGNS).filter((k) => k !== 'formation')]) {
  const key = STATE_OF[kind] || kind;
  if (!terms.some((t) => t.condition === key || t.art === key) && !G.FORM_RULES[key]) problems.push('the state "' + kind + '" (' + G.CONDITION_NAMES[kind] + ') has no rule term');
}
if (catalog.groups.rules.filter((e) => e.tag === '操作指南').length < G.guideEntries().length) problems.push('the in-game guide has paragraphs the wiki does not show');
// Nothing a page shows may be a value that failed to resolve.
for (const [group, list] of Object.entries(catalog.groups))
  for (const entry of list) {
    if (catalog.manuscripts[group]) continue;
    const bad = JSON.stringify([entry.name, entry.tag, entry.summary, entry.sections]).match(/undefined|NaN|\[object/);
    if (bad) problems.push(group + '/' + entry.id + ': shows "' + bad[0] + '"');
  }

if (corpus.entries.length < 500) problems.push('text listing looks too small: ' + corpus.entries.length);

console.log(Object.entries(catalog.groups).map(([g, l]) => g + ' ' + l.length).join(' · '));
console.log('遊戲原文 ' + corpus.entries.length + ' 條，來自 ' + TEXT_FILES.length + ' 個檔案');
if (problems.length) {
  console.error('\n' + problems.length + ' problem(s):\n  ' + problems.slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('OK');
