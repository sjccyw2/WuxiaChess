// 黑子對照: every black stone ranked on five measures in a 境界, a radar and the reasons for the
// pieces picked, and each board's pieces summed. The counterpart of 俠客對照 (view/compare.js),
// drawn with its parts.
//
// The choice lives in the address: #foecompare?r=<境界>&s=<measure or 'board'>&f=<piece ids>
// (&b=total to order the boards by their sum). Sorting and picking are links, as on 俠客對照.
import { esc, href, anchor, image, crumb } from './html.js';
import { foeCompareData } from '../catalog/foe-compare.js';
import { SERIES, key, legend, radarSvg, notesBox } from './compare.js';

const MAX = 3;
const ROUTE = 'foecompare';
const REALM_NAMES = ['一', '二', '三', '四', '五'];

function lookup() {
  const data = foeCompareData();
  if (!data._byId) Object.defineProperty(data, '_byId', { value: new Map(data.pieces.map((p) => [p.id, p])) });
  return data;
}
function readState(p) {
  const data = lookup(),
    realm = data.realms.includes(+p.get('r')) ? +p.get('r') : data.realms[0],
    sort = ['composite', 'board', ...data.axes.map((a) => a.key)].includes(p.get('s')) ? p.get('s') : 'composite',
    boards = p.get('b') === 'total' ? 'total' : 'order';
  const value = (piece) => piece.realms[realm].composite;
  const picked = p.has('f')
    ? [...new Set(p.get('f').split(',').filter((id) => data._byId.has(id)))].slice(0, MAX)
    : [...data.pieces].sort((a, b) => value(b) - value(a)).slice(0, MAX).map((x) => x.id);
  return { realm, sort, boards, picked };
}
function addressOf(st, change = {}) {
  const s = { ...st, ...change },
    q = new URLSearchParams();
  if (s.realm !== 1) q.set('r', s.realm);
  if (s.sort !== 'composite') q.set('s', s.sort);
  if (s.boards !== 'order') q.set('b', s.boards);
  q.set('f', s.picked.join(','));
  return '#' + ROUTE + '?' + q.toString().replace(/%2C/g, ',');
}
const realmName = (data, r) => data.realmSwords[r - 1] + '境界';
const scoresOf = (piece, realm) => piece.realms[realm];
// The radar reads a series as { id, name, scores }.
const series = (list, realm) =>
  list.map((piece, slot) => ({ hero: { id: piece.id, name: piece.name, scores: scoresOf(piece, realm).scores }, slot }));

function realmPicker(data, st) {
  return (
    '<nav class="foe-realms" aria-label="境界">' +
    data.realms
      .map((r) =>
        r === st.realm
          ? '<span class="is-on" aria-current="true">' + esc(realmName(data, r)) + '</span>'
          : anchor(addressOf(st, { realm: r }), esc(realmName(data, r)))
      )
      .join('') +
    '</nav>'
  );
}
function why(r) {
  return r?.why?.length ? '<span class="cmp-why">' + r.why.map(esc).join('；') + '</span>' : '';
}
function pieceReadout(piece, slot, data, st) {
  const r = scoresOf(piece, st.realm);
  return (
    '<div class="foe-readout"><h3>' +
    key(slot) +
    esc(piece.name) +
    ' <small>' +
    esc(piece.board + ' · ' + piece.rank + (piece.wave ? ' · ' + piece.wave : '') + ' · 綜合 ' + r.composite) +
    '</small> ' +
    anchor(addressOf(st, { picked: st.picked.filter((id) => id !== piece.id) }), '×', 'cmp-x') +
    '</h3><ul>' +
    data.axes.map((a) => '<li><b>' + esc(r.scores[a.key]) + '</b><span class="cmp-who">' + esc(a.name) + '</span>' + why(r.raw[a.key]) + '</li>').join('') +
    '</ul></div>'
  );
}
function picks(data, st) {
  const list = st.picked.map((id) => data._byId.get(id));
  if (!list.length) return '<section class="cmp-block"><p class="cmp-hint">在下方排名中點「＋對照」，最多並列三子。</p></section>';
  return (
    '<section class="cmp-block" aria-labelledby="foe-radar-h"><h2 id="foe-radar-h">五項評分</h2>' +
    '<div class="cmp-radar-row"><figure class="cmp-figure">' +
    legend(series(list, st.realm)) +
    '<div class="cmp-chart" data-foe-radar>' +
    radarSvg(series(list, st.realm), data.axes) +
    '</div></figure><div class="cmp-side cmp-readout">' +
    list.map((piece, slot) => pieceReadout(piece, slot, data, st)).join('') +
    '</div></div></section>'
  );
}

function rankingTable(data, st) {
  const value = (piece, k) => (k === 'composite' ? scoresOf(piece, st.realm).composite : k === 'board' ? -piece.order : scoresOf(piece, st.realm).scores[k]);
  const order = data.pieces
    .map((piece, i) => ({ piece, i }))
    .sort((a, b) => value(b.piece, st.sort) - value(a.piece, st.sort) || value(b.piece, 'composite') - value(a.piece, 'composite') || a.i - b.i)
    .map(({ piece }) => piece);
  const cols = [['composite', '綜合'], ...data.axes.map((a) => [a.key, a.name])],
    sortName = st.sort === 'board' ? '所在棋局' : cols.find(([k]) => k === st.sort)[1];
  const sortable = (k, name) =>
    '<th scope="col"' +
    (k === st.sort ? ' aria-sort="descending" class="is-sorted"' : '') +
    '><a href="' +
    esc(addressOf(st, { sort: k })) +
    '" title="' +
    esc('依' + name + '排序') +
    '">' +
    esc(name) +
    (k === st.sort ? ' ▾' : '') +
    '</a></th>';
  const full = st.picked.length >= MAX;
  let rank = 0,
    last = null;
  const rows = order
    .map((piece, i) => {
      const v = value(piece, st.sort),
        r = scoresOf(piece, st.realm),
        slot = st.picked.indexOf(piece.id);
      if (v !== last) (rank = i + 1), (last = v);
      const action =
        slot >= 0
          ? '<span class="cmp-rank-in">' + key(slot) + '已選</span>'
          : full
            ? ''
            : anchor(addressOf(st, { picked: [...st.picked, piece.id] }), '＋對照', 'cmp-rank-add');
      return (
        '<tr' +
        (slot >= 0 ? ' class="is-chosen" style="--slot:' + SERIES[slot] + '"' : '') +
        '><td class="cmp-rank-no">' +
        rank +
        '</td><th scope="row"><span class="cmp-rank-hero">' +
        image(piece.portrait) +
        anchor(href('foes', piece.page), esc(piece.name)) +
        '</span>' +
        action +
        '</th><td class="foe-where">' +
        anchor(href('missions', 'map-' + piece.map), esc(piece.board)) +
        '</td><td class="foe-rank">' +
        esc(piece.rank) +
        (piece.count > 1 ? ' ×' + piece.count : '') +
        (piece.wave ? '<small>' + esc(piece.wave) + '</small>' : '') +
        '</td>' +
        cols
          .map(([k]) => {
            const n = k === 'composite' ? r.composite : r.scores[k],
              title = k === 'composite' ? '' : r.raw[k].why.join('；');
            return k === 'composite'
              ? '<td class="cmp-rank-total' + (k === st.sort ? ' is-sorted' : '') + '"><span class="cmp-bar" style="--v:' + n + '"></span><b>' + n + '</b></td>'
              : '<td' + (k === st.sort ? ' class="is-sorted"' : '') + ' title="' + esc(title) + '">' + n + '</td>';
          })
          .join('') +
        '</tr>'
      );
    })
    .join('');
  return (
    '<section class="cmp-block" aria-labelledby="foe-rank-h"><div class="cmp-block-head"><h2 id="foe-rank-h">黑子排名</h2>' +
    '<p class="cmp-hint">' +
    esc(realmName(data, st.realm)) +
    '，依' +
    esc(sortName) +
    '排序；點欄名改排序，滑過分數看由來，點「＋對照」看圖。</p></div>' +
    '<div class="cmp-table-wrap"><table class="cmp-table cmp-rank foe-rank-table"><caption class="sr">' +
    esc('全部 ' + order.length + ' 種黑子在' + realmName(data, st.realm) + '的綜合與五項評分，依' + sortName + '由高到低') +
    '</caption><thead><tr><th scope="col">名次</th><th scope="col">黑子</th>' +
    sortable('board', '所在') +
    '<th scope="col">身分</th>' +
    cols.map(([k, name]) => sortable(k, name)).join('') +
    '</tr></thead><tbody>' +
    rows +
    '</tbody></table></div></section>'
  );
}

function boardTable(data, st) {
  const top = Math.max(...data.boards.flatMap((b) => Object.values(b.totals).filter((v) => v != null)));
  const at = (b) => b.totals[st.realm] ?? -1;
  const list = st.boards === 'total' ? [...data.boards].sort((a, b) => at(b) - at(a) || a.order - b.order) : data.boards;
  const head =
    '<th scope="col">' +
    (st.boards === 'total' ? anchor(addressOf(st, { boards: 'order' }), '棋局') : '棋局 ▾') +
    '</th><th scope="col">局次</th><th scope="col">子數</th>' +
    data.realms
      .map(
        (r) =>
          '<th scope="col"' +
          (r === st.realm ? ' class="is-sorted"' : '') +
          '>' +
          (r === st.realm && st.boards !== 'total'
            ? anchor(addressOf(st, { boards: 'total' }), esc(data.realmSwords[r - 1]))
            : esc(data.realmSwords[r - 1]) + (r === st.realm ? ' ▾' : '')) +
          '</th>'
      )
      .join('');
  const rows = list
    .map(
      (b) =>
        '<tr><th scope="row">' +
        anchor(href('missions', 'map-' + b.map), esc(b.name)) +
        '</th><td>' +
        esc(b.stages.map((n) => (n >= 10 ? '終局' : '第' + (n + 1))).join('、')) +
        '</td><td>' +
        b.count +
        (b.later ? '<small>（援軍 ' + b.later + '）</small>' : '') +
        '</td>' +
        data.realms
          .map((r) => {
            const v = b.totals[r];
            if (v == null) return '<td class="foe-none">—</td>';
            return r === st.realm
              ? '<td class="cmp-rank-total is-sorted"><span class="cmp-bar" style="--v:' + Math.round((100 * v) / top) + '"></span><b>' + v + '</b></td>'
              : '<td>' + v + '</td>';
          })
          .join('') +
        '</tr>'
    )
    .join('');
  return (
    '<section class="cmp-block" aria-labelledby="foe-board-h"><div class="cmp-block-head"><h2 id="foe-board-h">各局合計</h2>' +
    '<p class="cmp-hint">該局每一子的綜合分相加，援軍按在場的時間折算；局次為第幾局可能遇上。點所選境界的欄名，依合計排序。</p></div>' +
    '<div class="cmp-table-wrap"><table class="cmp-table foe-board-table"><caption class="sr">各局黑子的綜合分合計，五個境界</caption><thead><tr>' +
    head +
    '</tr></thead><tbody>' +
    rows +
    '</tbody></table></div></section>'
  );
}

export function foeComparePage(p) {
  const data = lookup(),
    st = readState(p);
  return (
    '<div class="compare foe-compare" data-foe-compare>' +
    crumb('黑子對照') +
    '<div class="index-head"><h1>黑子對照</h1><span class="count">' +
    data.pieces.length +
    ' 種黑子 · ' +
    data.boards.length +
    ' 局</span></div>' +
    '<p class="cmp-intro">每一子在他所在的那一局、所選的境界裡，對上同局次的普通俠客：攻勢、耐打、出手範圍、牽制、統御五項，與各局合計。' +
    anchor('#compare', '俠客的評分見俠客對照 →', 'more') +
    '</p>' +
    realmPicker(data, st) +
    picks(data, st) +
    rankingTable(data, st) +
    boardTable(data, st) +
    notesBox(data) +
    '</div>'
  );
}

// The radar is drawn again at the width the page gives it, so its labels keep their size.
let observer;
export function mountFoeCompare(root) {
  observer?.disconnect();
  observer = null;
  const box = root.querySelector('[data-foe-radar]');
  if (!box) return;
  const data = lookup(),
    st = readState(new URLSearchParams(location.hash.split(/\?(.*)/s)[1] || '')),
    list = series(st.picked.map((id) => data._byId.get(id)), st.realm);
  const draw = () => {
    const w = Math.round(box.clientWidth);
    if (w && Math.abs(w - (+box.dataset.w || 0)) > 4) {
      box.dataset.w = w;
      box.innerHTML = radarSvg(list, data.axes, w);
    }
  };
  draw();
  if (window.ResizeObserver) {
    observer = new ResizeObserver(draw);
    observer.observe(box);
  }
}
