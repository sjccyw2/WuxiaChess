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
if (corpus.entries.length < 500) problems.push('text listing looks too small: ' + corpus.entries.length);

console.log(Object.entries(catalog.groups).map(([g, l]) => g + ' ' + l.length).join(' · '));
console.log('遊戲原文 ' + corpus.entries.length + ' 條，來自 ' + TEXT_FILES.length + ' 個檔案');
if (problems.length) {
  console.error('\n' + problems.length + ' problem(s):\n  ' + problems.slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('OK');
