// Starts the wiki: read the game, build the catalog and the text listing, show the page.
import { store } from './store.js';
import { loadSources } from './sources.js';
import { buildCatalog } from './catalog/index.js';
import { loadLore } from './catalog/lore.js';
import { buildCorpus } from './corpus/index.js';
import { $, content, srcText } from './view/html.js';
import { normal, searchable } from './view/search.js';
import { render } from './app.js';

// 匯出: the catalog and text exactly as built for this visit.
function offerDownload(id, value) {
  const blob = new Blob([JSON.stringify(value, null, 1)], { type: 'application/json;charset=utf-8' });
  $(id).href = URL.createObjectURL(blob);
}

async function start() {
  try {
    await Promise.all([loadSources(), loadLore()]);
    const catalog = buildCatalog(),
      corpus = buildCorpus();
    store.corpus = corpus;
    store.game = catalog.game;
    store.worldview = catalog.worldview;
    if (catalog.worldview)
      store.loreFile = URL.createObjectURL(
        new Blob([catalog.worldview.markdown], { type: 'text/markdown;charset=utf-8' })
      );
    store.entries = catalog.groups;
    store.tables = Object.fromEntries(
      Object.entries(store.entries).map(([k, v]) => [k, new Map(v.map((r) => [r.id, r]))])
    );
    store.terms = Object.fromEntries(
      Object.entries(store.entries).map(([k, v]) => [
        k,
        new Map(
          v.map((r) => [
            r.id,
            normal([r.name, r.tag, r.summary, searchable(r.sections), searchable(r.sources)].join(' '))
          ])
        )
      ])
    );
    store.textLookup = new Map(corpus.entries.map((r) => [r.id, r]));
    store.messages = new Map(
      corpus.entries.map((r) => [
        r.id,
        normal(
          r.text + ' ' + r.groups.join(' ') + ' ' + r.sections.join(' ') + ' ' + r.refs.map(srcText).join(' ')
        )
      ])
    );
    offerDownload('export-catalog', catalog);
    offerDownload('export-text', corpus);
    window.addEventListener('hashchange', render);
    render();
  } catch (e) {
    content.innerHTML =
      '<p class="empty">圖鑑載入失敗。<button type="button" class="minor" id="retry">重新載入</button></p>';
    $('retry').addEventListener('click', () => location.reload());
    console.error(e);
  }
}
start();
