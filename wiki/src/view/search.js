// Matching, paging and the page-number bar.
import { href, anchor } from './html.js';

export function searchable(o) {
  if (o == null) return '';
  if (typeof o !== 'object') return String(o);
  if (Array.isArray(o)) return o.map(searchable).join(' ');
  return Object.entries(o)
    .filter(([k]) => !['map', 'image'].includes(k))
    .map(([, v]) => searchable(v))
    .join(' ');
}
export const normal = (s) =>
  String(s ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .trim();
export function match(haystack, q) {
  const query = normal(q);
  if (!query) return true;
  const parts = query.match(/"[^"]+"|「[^」]+」|\S+/g) || [];
  return parts.every((s) => haystack.includes(s.replace(/^["「]|["」]$/g, '')));
}
export function paginate(list, p, size = 36) {
  const pages = Math.max(1, Math.ceil(list.length / size)),
    page = Math.max(1, Math.min(pages, parseInt(p.get('p'), 10) || 1));
  return { portion: list.slice((page - 1) * size, page * size), page, pages };
}
export function pager(g, p, info) {
  if (info.pages < 2) return '';
  const at = (n) => href(g, '', { ...Object.fromEntries(p), p: n });
  return (
    '<nav class="pages" aria-label="頁次">' +
    (info.page > 1 ? anchor(at(info.page - 1), '← 上一頁') : '') +
    '<span>' +
    info.page +
    ' ／ ' +
    info.pages +
    '</span>' +
    (info.page < info.pages ? anchor(at(info.page + 1), '下一頁 →') : '') +
    '</nav>'
  );
}
