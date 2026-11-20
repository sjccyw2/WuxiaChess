// The pages: home, lists, one entry, one line of game text, search results.
import { store } from '../store.js';
import { categories, esc, href, anchor, image, crumb, srcText } from './html.js';
import { normal, match, paginate, pager } from './search.js';
import { toggleSection } from './sections.js';
import { gameArt, wikiArt } from '../catalog/parts.js';
import { BASELINE_ATTACK } from '../catalog/skills.js';
import { loreShelf, featured } from './lore.js';

function detailHead(r, g) {
  return (
    '<div class="detail-head">' +
    image(
      r.image,
      ['maps', 'story', 'missions'].includes(g) && r.image?.includes('map-') ? 'wide' : '',
      true
    ) +
    '<div><span class="tag">' +
    esc(r.tag) +
    '</span><h1>' +
    esc(r.name) +
    '</h1><p>' +
    esc(r.summary) +
    '</p></div></div>'
  );
}
function card(g, r) {
  return anchor(
    href(g, r.id),
    (image(r.image) ||
      '<span class="card-mark" aria-hidden="true">' + categories[g][1] + '</span>') +
      '<span><small>' +
      esc(r.tag) +
      '</small><strong>' +
      esc(r.name) +
      '</strong></span>',
    'card'
  );
}
export function home() {
  const shelf = (g, file) => {
    const c = categories[g];
    return anchor(
      href(g),
      image(gameArt(file)) +
        '<span><strong>' +
        c[0] +
        '</strong><small>' +
        store.entries[g].length +
        ' ' +
        c[2] +
        '</small></span><i aria-hidden="true">›</i>',
      'shelf'
    );
  };
  const artCard = (i) => {
    const r = store.tables.maps.get(String(i));
    return anchor(
      href('maps', i.toString()),
      image(r.image) + '<strong>' + esc(r.name) + '</strong>',
      'map-card'
    );
  };
  const lore = store.entries.lore ?? [];
  return (
    '<div class="hero">' +
    image(wikiArt('jianghu-cover.webp'), '', true) +
    '<div class="hero-copy"><span>劍影江湖・一念江湖（暫名）</span><h1>江湖志</h1>' +
    (lore.length
      ? anchor('#lore', '讀世界觀 <span aria-hidden="true">→</span>')
      : anchor(href('story', 'opening'), '讀序章 <span aria-hidden="true">→</span>')) +
    '</div></div>' +
    (lore.length
      ? '<div class="home-title"><h2>' +
        categories.lore[0] +
        '</h2>' +
        anchor('#lore', '全部 ' + lore.length + ' 節 →') +
        '</div><blockquote class="text-body">' +
        esc(store.docs.lore.logline) +
        '</blockquote><div class="home-grid">' +
        featured('lore').map((r) => loreShelf('lore', r)).join('') +
        '</div>'
      : '') +
    (store.entries.run?.length
      ? '<div class="home-title"><h2>' +
        categories.run[0] +
        '</h2>' +
        anchor('#run', '全部 ' + store.entries.run.length + ' 節 →') +
        '</div><div class="home-grid">' +
        featured('run').map((r) => loreShelf('run', r)).join('') +
        '</div>'
      : '') +
    '<div class="home-title"><h2>查閱圖鑑</h2>' +
    anchor('#text', '遊戲原文 ↗') +
    '</div>' +
    '<div class="home-grid">' +
    [
      ['heroes', 'portraits-shen.webp'],
      ['skills', 'guide-cover.webp'],
      ['items', 'item-ironFan.webp'],
      ['folk', 'npc-wei.webp'],
      ['foes', 'captain-9.webp'],
      ['missions', 'run-meridians.webp']
    ]
      .map(([g, f]) => shelf(g, f))
      .join('') +
    '</div>' +
    '<div class="home-title"><h2>十局輿圖</h2>' +
    anchor('#maps', '查看十局 →') +
    '</div><div class="atlas-strip">' +
    [0, 5, 9].map(artCard).join('') +
    '</div>' +
    '<p class="revision">圖鑑與原文皆於開啟時讀自遊戲原始檔 · ' +
    store.corpus.entries.length.toLocaleString('zh-Hant') +
    ' 條原文</p>'
  );
}
function filters(g, p, values, textGroup = false) {
  const q = p.get('q') || '',
    t = p.get('tag') || '';
  return (
    '<form class="filters" data-filter="' +
    g +
    '"><label class="sr" for="filter-q">篩選關鍵字</label><input id="filter-q" type="search" name="q" value="' +
    esc(q) +
    '" placeholder="' +
    (textGroup ? '查詞句或來源檔名' : '查名稱、效果或條件') +
    '"><label class="sr" for="filter-tag">分類</label><select id="filter-tag" name="tag"><option value="">全部分類</option>' +
    values
      .map((v) => '<option' + (v === t ? ' selected' : '') + '>' + esc(v) + '</option>')
      .join('') +
    '</select><button type="submit">篩選</button>' +
    (q || t ? anchor(href(g), '清除', 'more') : '') +
    '</form>'
  );
}
const empty = '<p class="empty">沒有符合的條目。可縮短關鍵字或清除分類。</p>';
const textCard = (r) =>
  anchor(
    href('text', r.id),
    '<small>' +
      esc(r.group) +
      ' · ' +
      esc(r.section) +
      '</small><p>' +
      esc(r.text) +
      '</p><span class="source">' +
      esc(srcText(r.refs[0])) +
      '</span>',
    'text-row'
  );
export function listPage(g, p) {
  const t = p.get('tag') || '',
    q = p.get('q') || '',
    textGroup = g === 'text';
  const rows = textGroup ? store.corpus.entries : store.entries[g],
    values = textGroup ? Object.keys(store.corpus.groups) : [...new Set(rows.map((r) => r.tag))];
  const matched = rows.filter(
    (r) =>
      (!t || (textGroup ? r.groups.includes(t) : r.tag === t)) &&
      match(textGroup ? store.messages.get(r.id) : store.terms[g].get(r.id), q)
  );
  const page = paginate(matched, p, textGroup ? 38 : 36);
  return (
    crumb(g) +
    '<div class="index-head"><h1>' +
    categories[g][0] +
    '</h1><span class="count">' +
    matched.length +
    ' ' +
    categories[g][2] +
    '</span></div>' +
    filters(g, p, values, textGroup) +
    (textGroup ? '<p class="revision">〔　〕標示遊戲執行時代入的姓名、數值或選項。</p>' : '') +
    (page.portion.length
      ? '<div class="' +
        (textGroup ? 'text-list' : 'catalog') +
        '">' +
        page.portion.map((r) => (textGroup ? textCard(r) : card(g, r))).join('') +
        '</div>'
      : empty) +
    pager(g, p, page)
  );
}
export function entry(g, id) {
  const r = store.tables[g].get(id);
  if (!r) return lost();
  const audit = href('text', '', { q: r.name });
  return (
    '<article class="entry">' +
    crumb(g, r.name) +
    detailHead(r, g) +
    (g === 'skills' && r.sections[0]?.title === '招式數值'
      ? '<p class="revision">比較基準採攻擊 ' +
        BASELINE_ATTACK +
        '、絕技威力 0、無裝備與陣法。戰場實際數值會隨俠客、地形與目標改變。</p>'
      : '') +
    r.sections.map((s, i) => toggleSection(s, i, g)).join('') +
    '<div class="entry-foot">' +
    anchor(audit, '查相關遊戲原文', 'more') +
    '<button class="minor" data-copy="link">複製條目連結</button></div><div class="sources">來源 ' +
    r.sources.map((s) => esc(srcText(s))).join(' · ') +
    '</div></article>'
  );
}
export function textEntry(id) {
  const r = store.textLookup.get(id);
  if (!r) return lost();
  return (
    '<article class="entry">' +
    crumb('text', r.section) +
    '<span class="tag">' +
    esc(r.group) +
    ' · ' +
    esc(r.kind) +
    '</span><h1 class="entry-title">' +
    esc(r.section) +
    '</h1><div class="text-body">' +
    esc(r.text) +
    '</div><div class="entry-foot"><button class="minor" data-copy="text">複製原文</button><button class="minor" data-copy="link">複製條目連結</button></div>' +
    '<details open><summary>遊戲來源 · ' +
    r.refs.length +
    '</summary><div class="box-body">' +
    r.refs
      .map((v) => '<p class="source">' + esc(srcText(v)) + ' · ' + esc(v.section) + '</p>')
      .join('') +
    '</div></details></article>'
  );
}
export function searchPage(p) {
  const q = p.get('q') || '',
    g = p.get('scope') || 'all';
  const choices = [['all', '全部'], ...Object.entries(categories).map(([k, v]) => [k, v[0]])];
  const results = [];
  if (q)
    for (const [key, list] of Object.entries(store.entries)) {
      if (g !== 'all' && g !== key) continue;
      for (const r of list)
        if (match(store.terms[key].get(r.id), q))
          results.push({
            g: key,
            r,
            rank: normal(r.name) === normal(q) ? 0 : match(normal(r.name), q) ? 1 : 3
          });
    }
  if (q && (g === 'all' || g === 'text'))
    for (const r of store.corpus.entries)
      if (match(store.messages.get(r.id), q))
        results.push({ g: 'text', r, rank: normal(r.text) === normal(q) ? 0 : 4 });
  results.sort((a, b) => a.rank - b.rank);
  const page = paginate(results, p, 32);
  return (
    crumb('全文檢索') +
    '<div class="index-head"><h1>全文檢索</h1><span class="count">' +
    results.length +
    ' 筆</span></div><form class="filters" data-filter="search"><label class="sr" for="filter-q">關鍵字</label><input type="search" id="filter-q" name="q" placeholder="輸入關鍵字" value="' +
    esc(q) +
    '"><label class="sr" for="scope">搜尋範圍</label><select id="scope" name="scope">' +
    choices
      .map(
        ([k, v]) =>
          '<option value="' + k + '"' + (g === k ? ' selected' : '') + '>' + v + '</option>'
      )
      .join('') +
    '</select><button type="submit">查找</button></form>' +
    (page.portion.length
      ? '<div class="text-list">' +
        page.portion
          .map(({ g: key, r }) =>
            key === 'text'
              ? textCard(r)
              : anchor(
                  href(key, r.id),
                  '<small>' +
                    esc(categories[key][0]) +
                    ' · ' +
                    esc(r.tag) +
                    '</small><p><strong>' +
                    esc(r.name) +
                    '</strong></p>',
                  'text-row'
                )
          )
          .join('') +
        '</div>'
      : q
        ? empty
        : '') +
    pager('search', p, page)
  );
}
export const lost = () =>
  '<div class="empty"><h1>查無此條目</h1>' + anchor('#home', '回圖鑑總覽', 'more') + '</div>';
