// 世界觀設定 pages, and the notice shown on entries that still describe the current build.
import { store } from '../store.js';
import { categories, esc, href, anchor, crumb, srcText } from './html.js';
import { FEATURED } from '../catalog/lore.js';

// **bold** and "第 N 節" cross-references inside the manuscript's text.
const inline = (v) =>
  esc(v)
    .replace(
      /\*\*(.+?)\*\*( ?)/g,
      (m, t, gap) => '<strong>' + t + '</strong>' + (/[。：；！？）」]$/.test(t) ? '' : gap)
    )
    .replace(/第 (\d+) 節/g, (m, n) => {
      const r = store.entries.lore?.find((v) => v.num === +n);
      return r ? '<a href="' + href('lore', r.id) + '">' + m + '</a>' : m;
    });

function blocks(list) {
  return list
    .map((b) => {
      if (b.p) return '<p>' + inline(b.p) + '</p>';
      if (b.ul || b.ol) {
        const t = b.ul ? 'ul' : 'ol';
        return (
          '<' + t + '>' + (b.ul || b.ol).map((v) => '<li>' + inline(v) + '</li>').join('') + '</' + t + '>'
        );
      }
      if (b.table)
        return (
          '<table class="lore-table"><thead><tr>' +
          b.table.head.map((h) => '<th scope="col">' + inline(h) + '</th>').join('') +
          '</tr></thead><tbody>' +
          b.table.rows
            .map(
              (row) =>
                '<tr>' +
                row
                  .map(
                    (c, i) =>
                      '<td data-label="' + esc(b.table.head[i] ?? '') + '">' + inline(c) + '</td>'
                  )
                  .join('') +
                '</tr>'
            )
            .join('') +
          '</tbody></table>'
        );
      return '';
    })
    .join('');
}

// Everything outside 世界觀設定 is read from the current game, which predates the new
// world view. This notice says so wherever that content is shown.
export const legacy = (lead = '此頁') =>
  store.worldview
    ? '<p class="legacy">' +
      lead +
      '記錄現行遊戲版本《' +
      esc(store.game) +
      '》的內容，尚未依新世界觀改寫。' +
      anchor('#lore', '查看世界觀設定 →') +
      '</p>'
    : '';

export function loreIndex() {
  const w = store.worldview,
    rows = store.entries.lore;
  return (
    crumb('lore') +
    '<div class="index-head"><h1>' +
    categories.lore[0] +
    '</h1><span class="count">' +
    rows.length +
    ' ' +
    categories.lore[2] +
    '</span></div><p class="revision" style="margin:0 0 14px">' +
    esc(w.title) +
    '。本分類揭露全部主線真相與結局。</p><blockquote class="text-body">' +
    esc(w.logline) +
    '</blockquote><ol class="toc">' +
    rows
      .map(
        (r) =>
          '<li>' +
          anchor(
            href('lore', r.id),
            '<span class="toc-num" aria-hidden="true">' +
              r.num +
              '</span><span><strong>' +
              esc(r.name) +
              '</strong><span>' +
              esc(r.summary) +
              '</span></span><small>' +
              esc(r.tag) +
              '</small>',
            'toc-row'
          ) +
          '</li>'
      )
      .join('') +
    '</ol><div class="lore-box" style="margin-top:16px"><div class="box-body"><dl class="fact">' +
    w.meta
      .map((line) => {
        const at = line.indexOf('：');
        return (
          '<div><dt>' + esc(line.slice(0, at)) + '</dt><dd>' + esc(line.slice(at + 1)) + '</dd></div>'
        );
      })
      .join('') +
    '</dl></div></div><div class="entry-foot"><span class="sources">原稿 ' +
    esc(w.source) +
    '</span>' +
    (store.loreFile
      ? '<a class="minor" href="' +
        store.loreFile +
        '" download="' +
        esc(w.source) +
        '">下載 Markdown 原稿 ↓</a>'
      : '') +
    '</div>'
  );
}

export function loreEntry(id, lost) {
  const rows = store.entries.lore,
    at = rows.findIndex((r) => r.id === id),
    r = rows[at];
  if (!r) return lost();
  const step = (t, label) => (t ? anchor(href('lore', t.id), label) : '<span></span>');
  const body =
    r.id === 'logline'
      ? '<blockquote class="text-body">' + esc(store.worldview.logline) + '</blockquote>'
      : r.sections
          .map((s) =>
            s.title
              ? '<details open><summary>' +
                esc(s.title) +
                '</summary><div class="box-body prose">' +
                blocks(s.blocks) +
                '</div></details>'
              : '<div class="lore-box"><div class="box-body prose">' + blocks(s.blocks) + '</div></div>'
          )
          .join('');
  return (
    '<article class="entry">' +
    crumb('lore', r.name) +
    '<div class="detail-head"><span class="lore-num" aria-hidden="true">' +
    r.num +
    '</span><div><span class="tag">' +
    esc(r.tag) +
    ' · 第 ' +
    r.num +
    ' 節</span><h1>' +
    esc(r.name) +
    '</h1><p>' +
    esc(r.summary) +
    '</p></div></div>' +
    body +
    '<nav class="lore-pager" aria-label="前後節">' +
    step(rows[at - 1], '← ' + esc(rows[at - 1]?.name)) +
    step(rows[at + 1], esc(rows[at + 1]?.name) + ' →') +
    '</nav><div class="entry-foot"><span></span><button class="minor" data-copy="link">複製條目連結</button></div><div class="sources">來源 ' +
    r.sources.map((s) => esc(srcText(s))).join(' · ') +
    ' · ' +
    esc(store.worldview.meta[0] ?? '') +
    '</div></article>'
  );
}

// A home-page tile for one section.
export const loreShelf = (r) =>
  anchor(
    href('lore', r.id),
    '<span class="shelf-mark" aria-hidden="true">' +
      r.num +
      '</span><span><strong>' +
      esc(r.name) +
      '</strong><small>' +
      esc(r.tag) +
      '</small></span><i aria-hidden="true">›</i>',
    'shelf'
  );
export const featuredLore = () => FEATURED.map((id) => store.tables.lore?.get(id)).filter(Boolean);
