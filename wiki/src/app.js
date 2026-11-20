// Routing and the page's event handlers.
import { store } from './store.js';
import { categories, $, content, href, route } from './view/html.js';
import { menu, nav } from './view/chrome.js';
import { home, listPage, entry, textEntry, searchPage, lost } from './view/pages.js';
import { loreIndex, loreEntry } from './view/lore.js';

function render() {
  if (!store.entries) return;
  const { group: g, id, p } = route();
  menu(false);
  nav(g);
  $('query').value = g === 'search' ? p.get('q') || '' : '';
  content.innerHTML =
    g === 'home'
      ? home()
      : g === 'search'
        ? searchPage(p)
        : g === 'text' && id
          ? textEntry(id)
          : store.docs[g]
            ? id
              ? loreEntry(g, id, lost)
              : loreIndex(g)
          : categories[g]
            ? id
              ? entry(g, id)
              : listPage(g, p)
            : lost();
  document.title = (content.querySelector('h1')?.textContent || '江湖志') + ' · 劍影江湖';
  if (window.scrollTo) window.scrollTo(0, 0);
}
function queryForm(form) {
  const obj = {};
  for (const el of form.querySelectorAll('[name]')) if (el.value) obj[el.name] = el.value;
  location.hash = href(form.dataset.filter, '', obj);
}
let noticeTimer;
function notice(s) {
  $('notice').textContent = s;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => ($('notice').textContent = ''), 1800);
}
async function copy(value) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      const t = document.createElement('textarea');
      t.value = value;
      t.style.position = 'fixed';
      t.style.left = '-2000px';
      document.body.append(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      if (!ok) throw Error();
    }
    notice('已複製');
  } catch {
    notice('可選取原文或網址列複製。');
  }
}
document.querySelector('.skip').addEventListener('click', (e) => {
  e.preventDefault();
  content.focus();
});
$('menu').addEventListener('click', () => menu(!document.body.classList.contains('menu-open')));
$('scrim').addEventListener('click', () => menu(false));
$('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  location.hash = href('search', '', { q: $('query').value.trim() });
});
content.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-filter]');
  if (form) {
    e.preventDefault();
    queryForm(form);
  }
});
content.addEventListener('change', (e) => {
  if (e.target.matches('select')) queryForm(e.target.closest('form'));
});
content.addEventListener('click', (e) => {
  const el = e.target.closest('[data-copy], [data-cell]');
  if (!el) return;
  if (el.hasAttribute('data-cell'))
    el.closest('.box-body').querySelector('[data-map-readout]').textContent = el.dataset.cell;
  else if (el.dataset.copy === 'link') copy(location.href);
  else if (el.dataset.copy === 'text') {
    const r = store.textLookup.get(route().id);
    if (r) copy(r.text);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    menu(false);
    return;
  }
  if (
    e.key === '/' &&
    !e.ctrlKey &&
    !e.metaKey &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
  ) {
    e.preventDefault();
    $('query').focus();
  }
});

export { render };
