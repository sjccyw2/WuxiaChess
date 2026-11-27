// 黑子對照: every black stone ranked on its measures in a 境界; up to five picked on a radar and in
// a table side by side, with the reasons for each score; and each board's pieces summed. The
// counterpart of 俠客對照 (view/compare.js), drawn with its parts: its picker, radar, table and
// readout. Nothing here names a measure: they are the data's `axes`.
//
// The choice lives in the address: #foecompare?r=<境界>&s=<measure or 'board'>&f=<piece ids>
// (&b=total to order the boards by their sum, &k=master|second|troop to show one rank in the
// picker). As on 俠客對照 each place in `f` is a colour slot, so a piece keeps its colour when
// another is removed: removing leaves an empty place (a,,c) that the next piece added fills.
import { esc, href, anchor, image, crumb } from './html.js';
import { foeCompareData } from '../catalog/foe-compare.js';
import { SERIES, key, legend, radarSvg, scoreTable, axisReadout, notesBox } from './compare.js';

const MAX = 5;
const ROUTE = 'foecompare';
const CN = ' 一二三四五六七八九十'; // numerals by index (0 is never shown)
// The picker's rank filter: 求敗 (對面的人) is the last board's master.
const KINDS = [
  ['all', '全部', () => true],
  ['master', '局主', (p) => p.rank === '局主' || p.rank === '對面的人'],
  ['second', '副手', (p) => p.rank === '副手'],
  ['troop', '兵卒', (p) => p.rank === '兵卒']
];
const kindOf = (k) => KINDS.find(([id]) => id === k) || KINDS[0];

function lookup() {
  const data = foeCompareData();
  if (!data._byId) Object.defineProperty(data, '_byId', { value: new Map(data.pieces.map((p) => [p.id, p])) });
  return data;
}
// With no choice in the address: the masters of the run's first board and of its tenth, and 求敗
// on the last, so the page opens on how far the run climbs.
function defaults(data) {
  const master = (b) =>
    b && data.pieces.filter((p) => p.map === b.map && kindOf('master')[2](p)).sort((x, y) => x.order - y.order)[0]?.id;
  const runs = data.boards.filter((b) => !b.stages.some((n) => n >= 10));
  const picks = [master(runs[0]), master(runs.at(-1)), master(data.boards.at(-1))].filter(Boolean);
  return [...new Set(picks)];
}
// URL → up to five slots (piece id or null). Unknown ids and repeats are dropped; a piece past
// the fifth place takes the first empty one.
function readSlots(p) {
  const data = lookup();
  if (!p.has('f')) return defaults(data);
  const slots = [],
    late = [],
    seen = new Set();
  p.get('f')
    .split(',')
    .map((s) => s.trim())
    .forEach((id) => {
      if (!id) return slots.length < MAX && slots.push(null);
      if (!data._byId.has(id) || seen.has(id)) return;
      seen.add(id);
      if (slots.length < MAX) slots.push(id);
      else late.push(id);
    });
  for (const id of late) {
    const gap = slots.indexOf(null);
    if (gap >= 0) slots[gap] = id;
  }
  while (slots.length && slots[slots.length - 1] == null) slots.pop();
  return slots;
}
function readState(p) {
  const data = lookup(),
    realm = data.realms.includes(+p.get('r')) ? +p.get('r') : data.realms[0],
    sort = ['composite', 'board', ...data.axes.map((a) => a.key)].includes(p.get('s')) ? p.get('s') : 'composite',
    boards = p.get('b') === 'total' ? 'total' : 'order',
    kind = kindOf(p.get('k'))[0];
  return { realm, sort, boards, kind, slots: readSlots(p) };
}
function addressOf(st, change = {}) {
  const s = { ...st, ...change },
    q = new URLSearchParams(),
    slots = [...s.slots];
  while (slots.length && slots[slots.length - 1] == null) slots.pop();
  if (s.realm !== 1) q.set('r', s.realm);
  if (s.sort !== 'composite') q.set('s', s.sort);
  if (s.boards !== 'order') q.set('b', s.boards);
  if (s.kind !== 'all') q.set('k', s.kind);
  q.set('f', slots.map((id) => id || '').join(','));
  return '#' + ROUTE + '?' + q.toString().replace(/%2C/g, ',');
}
const withPiece = (slots, id) => {
  const next = [...slots],
    gap = next.indexOf(null);
  if (gap >= 0) next[gap] = id;
  else next.push(id);
  return next;
};
const withoutPiece = (slots, id) => slots.map((s) => (s === id ? null : s));
// The chosen pieces in slot order, each with its slot.
const chosen = (st) => {
  const { _byId: byId } = lookup();
  return st.slots.map((id, slot) => id && { piece: byId.get(id), slot }).filter(Boolean);
};
const realmName = (data, r) => data.realmSwords[r - 1] + '境界';
const scoresOf = (piece, realm) => piece.realms[realm];
// The radar, legend and table read a series as { hero: { id, name, sub, scores, composite, raw }, slot }.
const series = (list, realm) =>
  list.map(({ piece, slot }) => {
    const r = scoresOf(piece, realm);
    return { hero: { id: piece.id, name: piece.name, sub: piece.board, scores: r.scores, composite: r.composite, raw: r.raw }, slot };
  });
const stagesText = (b) => (b.stages.some((n) => n >= 10) ? '終局' : '第' + b.stages.map((n) => n + 1).join('、') + '局');
// What tells a piece apart from the board's others: its rank, or a troop's role; and 援軍.
const roleOf = (p) => (p.rank === '兵卒' ? p.role || p.rank : p.rank);
const tagOf = (p) => roleOf(p) + (p.wave ? '，' + p.wave : '');

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
const why = (r) => (r?.why?.length ? '<span class="cmp-why">' + r.why.map(esc).join('；') + '</span>' : '');
function pieceReadout(piece, slot, data, st, only) {
  const r = scoresOf(piece, st.realm);
  return (
    '<div class="foe-readout"><h3>' +
    key(slot) +
    esc(piece.name) +
    ' <small>' +
    esc(piece.board + ' · ' + piece.rank + (piece.wave ? ' · ' + piece.wave : '') + ' · 綜合 ' + r.composite) +
    '</small>' +
    (only ? '' : ' ' + anchor(addressOf(st, { slots: withoutPiece(st.slots, piece.id) }), '×', 'cmp-x')) +
    '</h3><ul>' +
    data.axes
      .filter((a) => !only || a.key === only)
      .map((a) => '<li><b>' + esc(r.scores[a.key]) + '</b><span class="cmp-who">' + esc(a.name) + '</span>' + why(r.raw[a.key]) + '</li>')
      .join('') +
    '</ul></div>'
  );
}

// ── the picker: the chosen as chips, then every piece by board ─────────────────
// Which boards' groups are open, kept while the page is drawn again on every pick.
const openBoards = new Set();
function picker(data, st, list) {
  const full = list.length >= MAX,
    slotOf = new Map(list.map(({ piece, slot }) => [piece.id, slot])),
    [kind, , keep] = kindOf(st.kind);
  const chips = list
    .map(
      ({ piece, slot }) =>
        '<li class="cmp-chip" style="--c:' +
        SERIES[slot] +
        '"><button type="button" data-cmp-hero="' +
        esc(piece.id) +
        '" aria-label="' +
        esc('看' + piece.name + '（' + piece.board + '）的分數由來') +
        '">' +
        image(piece.portrait) +
        key(slot) +
        '<span>' +
        esc(piece.name) +
        '<small>' +
        esc(piece.board) +
        '</small></span></button><a class="cmp-x" data-cmp-key="f-' +
        esc(piece.id) +
        '" href="' +
        esc(addressOf(st, { slots: withoutPiece(st.slots, piece.id) })) +
        '" aria-label="' +
        esc('移除' + piece.name + '（' + piece.board + '）') +
        '">×</a></li>'
    )
    .join('');
  const pick = (p) => {
    const slot = slotOf.get(p.id),
      face =
        image(p.portrait) +
        (p.wave ? '<i class="foe-wave" title="' + esc(p.wave) + '">援</i>' : '') +
        '<span>' +
        esc(p.name) +
        '<small>' +
        esc(roleOf(p)) +
        '</small></span>';
    if (slot != null)
      return '<li><span class="cmp-pick is-in" style="--c:' + SERIES[slot] + '">' + face + key(slot) + '<span class="sr">已選</span></span></li>';
    if (full) return '<li><span class="cmp-pick is-off" aria-disabled="true">' + face + '</span></li>';
    return (
      '<li><a class="cmp-pick" data-cmp-key="f-' +
      esc(p.id) +
      '" href="' +
      esc(addressOf(st, { slots: withPiece(st.slots, p.id) })) +
      '" aria-label="' +
      esc('加入' + p.name + '（' + p.board + '，' + tagOf(p) + '）') +
      '">' +
      face +
      '</a></li>'
    );
  };
  const groups = data.boards
    .map((b) => {
      const mine = data.pieces.filter((p) => p.map === b.map && keep(p)).sort((x, y) => x.order - y.order);
      if (!mine.length) return '';
      const marks = mine.filter((p) => slotOf.has(p.id)).map((p) => key(slotOf.get(p.id))).join('');
      return (
        '<details class="foe-group" data-foe-board="' +
        b.map +
        '"' +
        (kind !== 'all' || openBoards.has(String(b.map)) ? ' open' : '') +
        '><summary><span class="foe-group-name">' +
        esc(b.name) +
        '<small>' +
        esc(stagesText(b)) +
        '</small></span><span class="foe-group-faces" aria-hidden="true">' +
        mine.map((p) => image(p.portrait)).join('') +
        '</span>' +
        (marks ? '<span class="foe-group-in">' + marks + '</span>' : '') +
        '<span class="foe-group-n">' +
        mine.length +
        ' 子</span></summary><ul class="cmp-picks foe-picks">' +
        mine.map(pick).join('') +
        '</ul></details>'
      );
    })
    .join('');
  const kinds =
    '<nav class="foe-realms foe-kinds" aria-label="身分">' +
    KINDS.map(([id, name, test]) => {
      const label = esc(name) + '<small>' + data.pieces.filter(test).length + '</small>';
      return id === kind
        ? '<span class="is-on" aria-current="true">' + label + '</span>'
        : '<a href="' + esc(addressOf(st, { kind: id })) + '" data-cmp-key="k-' + id + '">' + label + '</a>';
    }).join('') +
    '</nav>';
  return (
    '<div class="cmp-picker foe-picker">' +
    (list.length
      ? '<ul class="cmp-chips" aria-label="已選黑子">' + chips + '</ul>'
      : '<p class="cmp-hint">尚未選子。從下方各局點選黑子加入，最多' + CN[MAX] + '子。</p>') +
    '<div class="cmp-add"><div class="foe-add-head"><p class="cmp-add-title">' +
    (full ? '已選滿' + CN[MAX] + '子：先移除一子，才能再加入' : '加入黑子 <small>' + list.length + '／' + MAX + '</small>') +
    '</p>' +
    kinds +
    '</div><div class="foe-groups">' +
    groups +
    '</div></div></div>'
  );
}

// ── the radar, the table beside it, and every reason ─────────────────────────
const READOUT_HINT = '<p class="cmp-hint">點選或移到軸名、圖上的點、對照表的分數或上方的名牌，可看分數由來。</p>';
function picks(data, st, list) {
  if (!list.length) return '';
  const lines = series(list, st.realm),
    n = CN[data.axes.length] || data.axes.length;
  const cell = (hero, k) => {
    if (k === 'composite') return '';
    return ' tabindex="0" data-cmp-point="' + esc(hero.id + ' ' + k) + '" title="' + esc(hero.raw[k]?.why?.join('；') || '') + '"';
  };
  return (
    '<section class="cmp-block" aria-labelledby="foe-radar-h"><h2 id="foe-radar-h">' +
    n +
    '項評分 <small>' +
    esc(realmName(data, st.realm)) +
    '</small></h2>' +
    '<div class="cmp-radar-row" data-foe-row><figure class="cmp-figure">' +
    legend(lines) +
    '<div class="cmp-chart" data-foe-radar>' +
    radarSvg(lines, data.axes) +
    '</div><div class="cmp-readout" data-foe-readout aria-live="polite">' +
    READOUT_HINT +
    '</div></figure>' +
    '<div class="cmp-side"><h3 class="cmp-sub">對照表 <small>0–100，各項最高者標底色</small></h3>' +
    scoreTable(lines, data.axes, {
      caption: '所選黑子在' + realmName(data, st.realm) + '的' + n + '項評分與綜合分數（0 至 100）',
      cell
    }) +
    '</div></div></section>' +
    '<section class="cmp-block" aria-labelledby="foe-why-h"><h2 id="foe-why-h">評分由來</h2>' +
    '<div class="cmp-side cmp-readout foe-why">' +
    list.map(({ piece, slot }) => pieceReadout(piece, slot, data, st)).join('') +
    '</div></section>'
  );
}

function rankingTable(data, st, list) {
  const value = (piece, k) => (k === 'composite' ? scoresOf(piece, st.realm).composite : k === 'board' ? -piece.order : scoresOf(piece, st.realm).scores[k]);
  const order = data.pieces
    .map((piece, i) => ({ piece, i }))
    .sort((a, b) => value(b.piece, st.sort) - value(a.piece, st.sort) || value(b.piece, 'composite') - value(a.piece, 'composite') || a.i - b.i)
    .map(({ piece }) => piece);
  const cols = [['composite', '綜合'], ...data.axes.map((a) => [a.key, a.name])],
    sortName = st.sort === 'board' ? '所在棋局' : cols.find(([k]) => k === st.sort)[1],
    n = CN[data.axes.length] || data.axes.length;
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
  const full = list.length >= MAX,
    slotOf = new Map(list.map(({ piece, slot }) => [piece.id, slot]));
  let rank = 0,
    last = null;
  const rows = order
    .map((piece, i) => {
      const v = value(piece, st.sort),
        r = scoresOf(piece, st.realm),
        slot = slotOf.get(piece.id);
      if (v !== last) (rank = i + 1), (last = v);
      const action =
        slot != null
          ? '<span class="cmp-rank-in">' + key(slot) + '已選</span>'
          : full
            ? ''
            : '<a class="cmp-rank-add" data-cmp-key="f-' +
              esc(piece.id) +
              '" href="' +
              esc(addressOf(st, { slots: withPiece(st.slots, piece.id) })) +
              '" aria-label="' +
              esc('加入' + piece.name + '（' + piece.board + '）') +
              '">＋對照</a>';
      return (
        '<tr' +
        (slot != null ? ' class="is-chosen" style="--slot:' + SERIES[slot] + '"' : '') +
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
    esc('全部 ' + order.length + ' 種黑子在' + realmName(data, st.realm) + '的綜合與' + n + '項評分，依' + sortName + '由高到低') +
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
    st = readState(p),
    list = chosen(st);
  return (
    '<div class="compare foe-compare" data-foe-compare>' +
    crumb('黑子對照') +
    '<div class="index-head"><h1>黑子對照</h1><span class="count">已選 ' +
    list.length +
    '／' +
    MAX +
    ' · ' +
    data.pieces.length +
    ' 種黑子 · ' +
    data.boards.length +
    ' 局</span></div>' +
    '<p class="cmp-intro">每一子在他所在的那一局、所選的境界裡，對上同局次的普通俠客：' +
    esc(data.axes.map((a) => a.name).join('、')) +
    (CN[data.axes.length] || data.axes.length) +
    '項，與各局合計。並列最多' +
    CN[MAX] +
    '子。' +
    anchor('#compare', '俠客的評分見俠客對照 →', 'more') +
    '</p>' +
    realmPicker(data, st) +
    picker(data, st, list) +
    picks(data, st, list) +
    rankingTable(data, st, list) +
    boardTable(data, st) +
    notesBox(data) +
    '</div>'
  );
}

// ── behaviour, attached to each rendered page ───────────────────────────────
let observer;
export function mountFoeCompare(root) {
  observer?.disconnect();
  observer = null;
  const page = root.querySelector('[data-foe-compare]');
  if (!page) return;
  const data = lookup(),
    st = readState(new URLSearchParams(location.hash.split(/\?(.*)/s)[1] || '')),
    list = chosen(st),
    lines = series(list, st.realm);
  // A board's group opened or closed is remembered for the next drawing (only while every rank
  // shows: a filtered list opens every group).
  page.addEventListener(
    'toggle',
    (e) => {
      const g = e.target.closest?.('[data-foe-board]');
      if (!g || st.kind !== 'all') return;
      if (g.open) openBoards.add(g.dataset.foeBoard);
      else openBoards.delete(g.dataset.foeBoard);
    },
    true
  );
  const box = page.querySelector('[data-foe-radar]'),
    readout = page.querySelector('[data-foe-readout]'),
    row = page.querySelector('[data-foe-row]');
  if (!box) return;
  // What was last tapped, as the attribute that finds it again (the radar is redrawn on a resize).
  let pinned = '';
  const focusSlot = (slot) => {
    const svg = box.querySelector('svg');
    if (slot == null) svg.removeAttribute('data-focus');
    else svg.setAttribute('data-focus', slot);
  };
  // An axis: every piece on it. A name: that piece on every axis. A point or a score: that piece on that axis.
  const show = (el, pin) => {
    if (pin)
      pinned = [['cmpAxis', 'data-cmp-axis'], ['cmpHero', 'data-cmp-hero'], ['cmpPoint', 'data-cmp-point']]
        .filter(([k]) => el.dataset[k])
        .map(([k, attr]) => '[' + attr + '="' + CSS.escape(el.dataset[k]) + '"]')[0];
    const axis = el.dataset.cmpAxis;
    if (axis) {
      readout.innerHTML = axisReadout(data.axes.find((a) => a.key === axis), lines);
      focusSlot(null);
      return;
    }
    const [id, only] = (el.dataset.cmpHero || el.dataset.cmpPoint).split(' '),
      it = list.find(({ piece }) => piece.id === id);
    if (!it) return;
    readout.innerHTML = pieceReadout(it.piece, it.slot, data, st, only);
    focusSlot(it.slot);
  };
  const target = (e) => e.target.closest?.('[data-cmp-axis], [data-cmp-hero], [data-cmp-point]');
  page.addEventListener('click', (e) => {
    const el = target(e);
    if (el) show(el, true);
  });
  page.addEventListener('keydown', (e) => {
    const el = target(e);
    if (el && el.matches('[data-cmp-axis], td[data-cmp-point]') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      show(el, true);
    }
  });
  page.addEventListener('focusin', (e) => {
    const el = target(e);
    if (el) show(el, true);
  });
  page.addEventListener('mouseover', (e) => {
    const el = target(e);
    if (el && el.closest('.cmp-radar, .cmp-table')) show(el, false);
  });
  row.addEventListener('mouseleave', () => {
    const el = pinned && page.querySelector(pinned);
    if (el) return show(el, false);
    readout.innerHTML = READOUT_HINT;
    focusSlot(null);
  });
  // The radar is drawn again at the width the page gives it, so its labels keep their size.
  const draw = () => {
    const w = Math.round(box.clientWidth);
    if (w && Math.abs(w - (+box.dataset.w || 0)) > 4) {
      box.dataset.w = w;
      const focus = box.querySelector('svg')?.getAttribute('data-focus');
      box.innerHTML = radarSvg(lines, data.axes, w);
      if (focus != null) focusSlot(focus);
    }
  };
  draw();
  if (window.ResizeObserver) {
    observer = new ResizeObserver(draw);
    observer.observe(box);
  }
}
