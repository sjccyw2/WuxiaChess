// The side menu and its counts.
import { store } from '../store.js';
import { categories, $, href } from './html.js';

export function menu(open) {
  document.body.classList.toggle('menu-open', open);
  $('menu').setAttribute('aria-expanded', String(open));
  $('menu').setAttribute('aria-label', open ? '收起目錄' : '打開目錄');
  $('scrim').hidden = !open;
}
export function nav(g) {
  const entry = (key, title, glyph, count = '') =>
    '<a href="' +
    href(key) +
    '"' +
    (key === g ? ' aria-current="page"' : '') +
    '><span class="nav-symbol" aria-hidden="true">' +
    glyph +
    '</span>' +
    title +
    (count ? '<small>' + count + '</small>' : '') +
    '</a>';
  $('nav-list').innerHTML =
    entry('home', '圖鑑總覽', '冊') +
    Object.entries(categories)
      .filter(([k]) => k === 'text' || store.entries[k])
      .map(([k, v]) =>
        entry(k, v[0], v[1], k === 'text' ? store.corpus.entries.length : store.entries[k].length)
      )
      .join('');
}
